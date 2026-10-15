/**
 * src/app/api/auth/register/route.ts
 *
 * Handles Teacher Registration with Server Validation, Cryptographic Verification Tokens,
 * and SMS/Email Dispatch.
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import {
  createTeacherAccount,
  findTeacherByEmail,
  findTeacherByPhone,
  createVerificationToken,
  normalizeEmail,
  normalizePhone,
  isValidPhone,
} from "@/lib/auth/accountStore.ts";
import { getSmsProvider } from "@/lib/auth/smsProvider.ts";
import { getEmailProvider } from "@/lib/auth/emailProvider.ts";
import { logAuditEvent, hashIp } from "@/lib/server/store.ts";
import { getClientIp, checkRateLimit } from "@/lib/server/security.ts";
import { guardRequest, createGuardResponse } from "@/lib/server/guard.ts";

const RegisterSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  institutionName: z
    .string()
    .trim()
    .min(2, "School or institution name must be at least 2 characters")
    .max(150, "School name cannot exceed 150 characters"),
  gradesTaught: z
    .array(z.string())
    .min(1, "Please select at least one class or grade taught"),
  subjectsTaught: z.array(z.string()).optional(),
  designation: z
    .enum(["teacher", "senior_teacher", "headmaster", "principal", "coordinator", "other"])
    .optional(),
  countryCode: z.string().default("+91"),
  phone: z.string().trim().min(8, "Phone number is too short"),
  email: z.string().trim().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
  age: z.number().int().min(18).max(100).optional(),
  privacyConsent: z.literal(true, {
    message: "You must accept the privacy policy to register.",
  }),
});

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req, { route: "/api/auth/register" });
    if (!guard.ok) {
      return createGuardResponse(guard);
    }

    const ip = getClientIp(req);
    const ipHashed = hashIp(ip);

    // Rate limit: max 5 registrations per IP per 15 minutes
    const rateCheck = checkRateLimit(`reg_${ip}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts from this network. Please wait before retrying." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // Validate phone number
    if (!isValidPhone(input.phone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const normEmail = normalizeEmail(input.email);
    const normPhone = normalizePhone(input.countryCode, input.phone);

    // Check for existing accounts
    const existingEmail = await findTeacherByEmail(normEmail);
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in." },
        { status: 409 }
      );
    }

    const existingPhone = await findTeacherByPhone(normPhone);
    if (existingPhone) {
      return NextResponse.json(
        { error: "An account with this mobile number already exists. Please log in." },
        { status: 409 }
      );
    }

    // Hash password with bcrypt salt 10
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create teacher record with status: "registration_incomplete"
    const creationResult = await createTeacherAccount(input, passwordHash);
    if (!creationResult.success || !creationResult.account) {
      return NextResponse.json(
        { error: creationResult.error || "Failed to create teacher account" },
        { status: 500 }
      );
    }

    const teacher = creationResult.account;

    // 1. Generate cryptographic 6-digit phone SMS OTP
    const phoneOtp = crypto.randomInt(100000, 1000000).toString();
    await createVerificationToken(
      teacher.id,
      "phone",
      teacher.phone,
      phoneOtp,
      10 * 60 * 1000 // 10 minutes expiry
    );

    // 2. Generate cryptographic 32-byte email verification token + 6-digit email code
    const emailToken = crypto.randomBytes(32).toString("hex");
    const emailCode = crypto.randomInt(100000, 1000000).toString();
    await createVerificationToken(
      teacher.id,
      "email",
      teacher.email,
      emailCode, // Support verifying by code or token
      24 * 60 * 60 * 1000 // 24 hours expiry
    );

    // 3. Dispatch SMS OTP via pluggable provider
    const smsProvider = getSmsProvider();
    const smsResult = await smsProvider.sendVerificationOtp(teacher.phone, phoneOtp);

    // 4. Dispatch Email Verification via pluggable provider
    const emailProvider = getEmailProvider();
    const emailResult = await emailProvider.sendVerificationEmail(teacher.email, emailToken, emailCode);

    logAuditEvent({
      userId: teacher.id,
      userRole: "teacher",
      schoolId: teacher.institutionName,
      action: "login_success", // Track account creation in audit logs
      ipHash: ipHashed,
      details: `Teacher registration initiated. SMS provider: ${smsProvider.name}, Email provider: ${emailProvider.name}`,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration initiated successfully. Verification codes have been sent.",
        userId: teacher.id,
        email: teacher.email,
        phone: teacher.phone,
        phoneVerified: false,
        emailVerified: false,
        delivery: {
          sms: { sent: smsResult.success, error: smsResult.error },
          email: { sent: emailResult.success, error: emailResult.error },
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
