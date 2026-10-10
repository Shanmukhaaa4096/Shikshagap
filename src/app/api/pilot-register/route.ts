import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { logAuditEvent, hashIp } from "@/lib/server/store";

interface PilotRegistrationPayload {
  schoolName: string;
  teacherName: string;
  classRange: string;
  contact: string; // phone or email
  honeypot?: string;
  privacyConsent: boolean;
}

// In-memory rate limiting: max 5 submissions per minute per IP
const pilotRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkPilotRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = pilotRateLimits.get(ip);
  if (!record || now > record.resetAt) {
    pilotRateLimits.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }
  if (record.count >= 5) {
    return false;
  }
  record.count += 1;
  return true;
}

export interface PilotRegistrationRecord {
  id: string;
  schoolName: string;
  teacherName: string;
  classRange: string;
  contactMasked: string;
  timestamp: string;
  status: "received" | "reviewed";
}

// In-memory registry for pilot registrations (persisted in server audit logs)
export const PILOT_REGISTRATIONS: PilotRegistrationRecord[] = [];

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    if (!checkPilotRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many pilot registration attempts. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    const body: PilotRegistrationPayload = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid form payload." }, { status: 400 });
    }

    // Bot honeypot check
    if (body.honeypot && body.honeypot.trim().length > 0) {
      // Silently reject bots
      return NextResponse.json({ success: true, message: "Registration received." });
    }

    // Field validations
    const schoolName = (body.schoolName || "").trim();
    const teacherName = (body.teacherName || "").trim();
    const classRange = (body.classRange || "").trim();
    const contact = (body.contact || "").trim();

    if (!schoolName || !teacherName || !classRange || !contact) {
      return NextResponse.json(
        { error: "Please fill in all required fields (School name, Teacher name, Class range, Contact details)." },
        { status: 400 }
      );
    }

    if (!body.privacyConsent) {
      return NextResponse.json(
        { error: "You must accept the privacy policy to request a school pilot." },
        { status: 400 }
      );
    }

    // Basic contact validation (email or 10-digit Indian mobile)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const isPhone = /^[6-9]\d{9}$/.test(contact.replace(/[\s-+]/g, ""));

    if (!isEmail && !isPhone) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number or email address." },
        { status: 400 }
      );
    }

    const regId = `PILOT-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const contactMasked = isEmail
      ? contact.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + "*".repeat(b.length))
      : contact.slice(0, 2) + "******" + contact.slice(-2);

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

    // Audit log (strictly necessary administrative record)
    logAuditEvent({
      userId: "anonymous",
      userRole: "anonymous",
      schoolId: "pilot_program",
      action: "data_request_received",
      targetRecordId: regId,
      ipHash: hashIp(ip),
      details: `Pilot school registration submitted for ${schoolName}`,
    });

    return NextResponse.json({
      success: true,
      referenceId: regId,
      message: "Thank you. Your school pilot request has been recorded. Our academic team will get in touch with you.",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process pilot registration. Please try again." },
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
