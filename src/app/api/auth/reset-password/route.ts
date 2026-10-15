/**
 * src/app/api/auth/reset-password/route.ts
 *
 * Verifies single-use reset token and securely updates teacher password hash.
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  verifyToken,
  updateTeacherPassword,
  findTeacherByEmail,
  normalizeEmail,
} from "@/lib/auth/accountStore.ts";
import { logAuditEvent, hashIp } from "@/lib/server/store.ts";
import { getClientIp, checkRateLimit } from "@/lib/server/security.ts";
import { guardRequest, createGuardResponse } from "@/lib/server/guard.ts";

const ResetPasswordSchema = z.object({
  email: z.string().trim().email("Valid email required"),
  token: z.string().trim().min(16, "Valid reset token required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req, { route: "/api/auth/reset-password" });
    if (!guard.ok) {
      return createGuardResponse(guard);
    }

    const ip = getClientIp(req);
    const ipHashed = hashIp(ip);

    // Rate limit
    const rateCheck = checkRateLimit(`rp_${ip}`, 10, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please wait before retrying." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = ResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const { email, token, newPassword } = parsed.data;
    const normEmail = normalizeEmail(email);

    // Verify reset token
    const verification = await verifyToken(normEmail, "password_reset", token);
    if (!verification.valid || !verification.userId) {
      return NextResponse.json(
        { error: verification.error || "Invalid or expired password reset link." },
        { status: 400 }
      );
    }

    const teacher = await findTeacherByEmail(normEmail);
    if (!teacher || teacher.id !== verification.userId) {
      return NextResponse.json({ error: "Invalid password reset request." }, { status: 400 });
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);
    const updated = await updateTeacherPassword(teacher.id, newHash);

    if (!updated) {
      return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
    }

    logAuditEvent({
      userId: teacher.id,
      userRole: "teacher",
      schoolId: teacher.institutionName,
      action: "login_success",
      ipHash: ipHashed,
      details: "Password successfully reset via verified token",
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
