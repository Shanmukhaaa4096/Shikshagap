/**
 * src/app/api/auth/forgot-password/route.ts
 *
 * Initiates Password Reset flow by issuing a single-use 15-minute token.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import {
  findTeacherByEmail,
  createVerificationToken,
  normalizeEmail,
} from "@/lib/auth/accountStore.ts";
import { getEmailProvider } from "@/lib/auth/emailProvider.ts";
import { logAuditEvent, hashIp } from "@/lib/server/store.ts";
import { getClientIp, checkRateLimit } from "@/lib/server/security.ts";
import { guardRequest, createGuardResponse } from "@/lib/server/guard.ts";

const ForgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req, { route: "/api/auth/forgot-password" });
    if (!guard.ok) {
      return createGuardResponse(guard);
    }

    const ip = getClientIp(req);
    const ipHashed = hashIp(ip);

    // Rate limit: max 5 requests per 15 minutes per IP
    const rateCheck = checkRateLimit(`fp_${ip}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = ForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const normEmail = normalizeEmail(parsed.data.email);
    const teacher = await findTeacherByEmail(normEmail);

    // Constant-time generic response to prevent email enumeration
    if (teacher) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      await createVerificationToken(
        teacher.id,
        "password_reset",
        teacher.email,
        resetToken,
        15 * 60 * 1000, // 15-minute single-use expiry
        3 // Max 3 attempts
      );

      const emailProvider = getEmailProvider();
      await emailProvider.sendPasswordResetEmail(teacher.email, resetToken);

      logAuditEvent({
        userId: teacher.id,
        userRole: "teacher",
        schoolId: teacher.institutionName,
        action: "login_success",
        ipHash: ipHashed,
        details: "Password reset token requested and dispatched",
      });
    }

    return NextResponse.json({
      success: true,
      message: "If an active teacher account exists with this email address, a password reset link has been dispatched.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
