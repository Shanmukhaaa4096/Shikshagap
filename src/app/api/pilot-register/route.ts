import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { logAuditEvent, hashIp } from "@/lib/server/store";
import { sanitizeText, checkRateLimit } from "@/lib/server/security";

const PilotRegistrationSchema = z.object({
  schoolName: z
    .string()
    .trim()
    .min(2, "School name must be at least 2 characters")
    .max(120, "School name cannot exceed 120 characters"),
  teacherName: z
    .string()
    .trim()
    .min(2, "Teacher name must be at least 2 characters")
    .max(80, "Teacher name cannot exceed 80 characters"),
  classRange: z
    .string()
    .trim()
    .min(1, "Class range is required")
    .max(50, "Class range cannot exceed 50 characters"),
  contact: z
    .string()
    .trim()
    .min(5, "Contact must be at least 5 characters")
    .max(100, "Contact cannot exceed 100 characters")
    .refine((val) => {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      const isPhone = /^[6-9]\d{9}$/.test(val.replace(/[\s-+]/g, ""));
      return isEmail || isPhone;
    }, "Please provide a valid 10-digit Indian mobile number or email address"),
  privacyConsent: z.literal(true, {
    message: "You must accept the privacy policy to request a school pilot.",
  }),
  honeypot: z.string().max(100).optional(),
});

export interface PilotRegistrationRecord {
  id: string;
  schoolName: string;
  teacherName: string;
  classRange: string;
  contactMasked: string;
  timestamp: string;
  status: "received" | "reviewed";
}

// In-memory registry for pilot registrations
export const PILOT_REGISTRATIONS: PilotRegistrationRecord[] = [];

export function checkPilotRateLimit(ip: string): boolean {
  return checkRateLimit(`pilot_${ip}`, 5, 10 * 60 * 1000).allowed;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    // Rate limiting: 5 requests per 10 minutes per IP
    if (!checkPilotRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many submission attempts. Please wait 10 minutes before trying again." },
        { status: 429 }
      );
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: "Invalid form payload." }, { status: 400 });
    }

    // Bot honeypot check
    if (rawBody.honeypot && String(rawBody.honeypot).trim().length > 0) {
      // Silently accept bots to avoid leaking honeypot logic
      return NextResponse.json({ success: true, message: "Registration received." });
    }

    const parseResult = PilotRegistrationSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input provided.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const validData = parseResult.data;

    const schoolName = sanitizeText(validData.schoolName);
    const teacherName = sanitizeText(validData.teacherName);
    const classRange = sanitizeText(validData.classRange);
    const rawContact = validData.contact;

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawContact);
    const regId = `PILOT-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const contactMasked = isEmail
      ? rawContact.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + "*".repeat(b.length))
      : rawContact.slice(0, 2) + "******" + rawContact.slice(-2);

    const record: PilotRegistrationRecord = {
      id: regId,
      schoolName,
      teacherName,
      classRange,
      contactMasked,
      timestamp: new Date().toISOString(),
      status: "received",
    };

    PILOT_REGISTRATIONS.push(record);

    logAuditEvent({
      userId: "anonymous",
      userRole: "anonymous",
      schoolId: "pilot_program",
      action: "data_request_received",
      targetRecordId: regId,
      ipHash: hashIp(ip),
      details: "Pilot school registration submitted",
    });

    return NextResponse.json({
      success: true,
      referenceId: regId,
      message: "Thank you. Your school pilot request has been recorded. Our academic team will get in touch with you.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to process request at this time. Please try again later." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    totalCount: PILOT_REGISTRATIONS.length,
    registrations: PILOT_REGISTRATIONS.map((r) => ({
      id: r.id,
      schoolName: r.schoolName,
      classRange: r.classRange,
      timestamp: r.timestamp,
      status: r.status,
    })),
  });
}
