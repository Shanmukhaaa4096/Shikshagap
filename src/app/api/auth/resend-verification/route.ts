/**
 * src/app/api/auth/resend-verification/route.ts
 *
 * Resends Phone SMS OTP or Email Verification Code with cooldown and rate-limiting.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import {
  findTeacherByEmail,
  findTeacherByPhone,
  createVerificationToken,
  normalizeEmail,
  normalizePhone,
} from "@/lib/auth/accountStore.ts";
import { getSmsProvider } from "@/lib/auth/smsProvider.ts";
import { getEmailProvider } from "@/lib/auth/emailProvider.ts";
import { getClientIp, checkRateLimit } from "@/lib/server/security.ts";
import { guardRequest, createGuardResponse } from "@/lib/server/guard.ts";

const ResendSchema = z.object({
  channel: z.enum(["phone", "email"]),
  target: z.string().trim().min(3),
});

// Cooldown map: target -> lastSentTimestamp
const resendCooldowns = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req, { route: "/api/auth/resend-verification" });
    if (!guard.ok) {
      return createGuardResponse(guard);
    }

    const ip = getClientIp(req);
    const body = await req.json().catch(() => null);
    const parsed = ResendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request. Channel and target required." }, { status: 400 });
    }

    const { channel, target } = parsed.data;

    // Rate limit per IP: max 5 resends per 15 minutes
    const ipRate = checkRateLimit(`resend_${ip}`, 5, 15 * 60 * 1000);
    if (!ipRate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }

    const normTarget = channel === "phone" ? normalizePhone("+91", target) : normalizeEmail(target);

    // Enforce 60-second cooldown per target
    const now = Date.now();
    const lastSent = resendCooldowns.get(normTarget) || 0;
    const elapsed = now - lastSent;
    if (elapsed < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - elapsed) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSeconds} seconds before requesting a new code.` },
        { status: 429 }
      );
    }

    // Look up teacher
    const teacher =
      channel === "phone"
        ? await findTeacherByPhone(normTarget)
        : await findTeacherByEmail(normTarget);

    // Return generic message if teacher not found to avoid enumeration
    if (!teacher) {
      resendCooldowns.set(normTarget, now);
      return NextResponse.json({
        success: true,
        message: "If an unverified account matches this detail, a new verification code has been dispatched.",
      });
    }

    if (channel === "phone") {
      if (teacher.phoneVerified) {
        return NextResponse.json({ error: "Your phone number is already verified." }, { status: 400 });
      }

      const otp = crypto.randomInt(100000, 1000000).toString();
      await createVerificationToken(teacher.id, "phone", teacher.phone, otp, 10 * 60 * 1000);
      const smsProvider = getSmsProvider();
      const sendResult = await smsProvider.sendVerificationOtp(teacher.phone, otp);

      resendCooldowns.set(normTarget, now);
      return NextResponse.json({
        success: true,
        message: "A new phone verification code has been sent via SMS.",
        delivery: { sent: sendResult.success, error: sendResult.error },
      });
    } else {
      if (teacher.emailVerified) {
        return NextResponse.json({ error: "Your email address is already verified." }, { status: 400 });
      }

      const emailCode = crypto.randomInt(100000, 1000000).toString();
      const emailToken = crypto.randomBytes(32).toString("hex");
      await createVerificationToken(teacher.id, "email", teacher.email, emailCode, 24 * 60 * 60 * 1000);
      const emailProvider = getEmailProvider();
      const sendResult = await emailProvider.sendVerificationEmail(teacher.email, emailToken, emailCode);

      resendCooldowns.set(normTarget, now);
      return NextResponse.json({
        success: true,
        message: "A new email verification code has been sent to your email address.",
        delivery: { sent: sendResult.success, error: sendResult.error },
      });
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
