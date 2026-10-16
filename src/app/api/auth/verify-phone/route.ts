/**
 * src/app/api/auth/verify-phone/route.ts
 *
 * Verifies Phone SMS OTP, records timestamp, and activates session if both channels verified.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  verifyToken,
  updateTeacherVerification,
  normalizePhone,
} from "@/lib/auth/accountStore.ts";
import { setSessionCookie } from "@/lib/auth/session.ts";
import { logAuditEvent, hashIp } from "@/lib/server/store.ts";
import { getClientIp, checkRateLimit } from "@/lib/server/security.ts";
import { guardRequest, createGuardResponse } from "@/lib/server/guard.ts";

const VerifyPhoneSchema = z.object({
  phone: z.string().trim().min(8, "Phone number is required"),
  otp: z.string().trim().min(4, "Verification OTP is required").max(10),
});

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req, { route: "/api/auth/verify-phone" });
    if (!guard.ok) {
      return createGuardResponse(guard);
    }

    const ip = getClientIp(req);
    const ipHashed = hashIp(ip);

    // Rate limit: max 10 verification attempts per IP per 10 minutes
    const rateCheck = checkRateLimit(`vphone_${ip}`, 10, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait before retrying." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = VerifyPhoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Phone number and verification OTP are required." },
        { status: 400 }
      );
    }

    const { phone, otp } = parsed.data;
    const normPhone = normalizePhone("+91", phone);

    // Verify token cryptographically
    const verification = await verifyToken(normPhone, "phone", otp);
    if (!verification.valid || !verification.userId) {
      return NextResponse.json(
        { error: verification.error || "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // Update teacher record
    const updatedTeacher = await updateTeacherVerification(verification.userId, {
      phoneVerified: true,
    });

    if (!updatedTeacher) {
      return NextResponse.json(
        { error: "Teacher account not found." },
        { status: 404 }
      );
    }

    logAuditEvent({
      userId: updatedTeacher.id,
      userRole: "teacher",
      schoolId: updatedTeacher.institutionName,
      action: "login_success",
      ipHash: ipHashed,
      details: "Mobile phone ownership successfully verified",
    });

    const isFullyActive = updatedTeacher.status === "active";

    // If both verified, establish session
    if (isFullyActive) {
      await setSessionCookie({
        id: updatedTeacher.id,
        email: updatedTeacher.email,
        name: updatedTeacher.fullName,
        role: updatedTeacher.role,
        schoolId: updatedTeacher.institutionName,
        classId: updatedTeacher.gradesTaught[0] || "class_5",
        phone: updatedTeacher.phone,
        institutionName: updatedTeacher.institutionName,
        gradesTaught: updatedTeacher.gradesTaught,
        subjectsTaught: updatedTeacher.subjectsTaught,
        designation: updatedTeacher.designation,
        status: updatedTeacher.status,
      });
    }

    return NextResponse.json({
      success: true,
      message: isFullyActive
        ? "Phone verified and account activated successfully."
        : "Phone verified successfully. Please also verify your email address to complete registration.",
      phoneVerified: true,
      emailVerified: updatedTeacher.emailVerified,
      active: isFullyActive,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
