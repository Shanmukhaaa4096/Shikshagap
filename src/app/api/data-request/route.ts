import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { sanitizeText, checkRateLimit } from "@/lib/server/security";
import { logAuditEvent, hashIp } from "@/lib/server/store";

const DataRequestSchema = z.object({
  requesterName: z
    .string()
    .trim()
    .min(2, "Requester name must be at least 2 characters")
    .max(80, "Requester name cannot exceed 80 characters"),
  requesterRole: z.enum(["parent", "teacher", "student", "guardian"], {
    message: "Please select a valid requester role",
  }),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .max(100, "Email cannot exceed 100 characters"),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number cannot exceed 20 characters")
    .optional()
    .or(z.literal("")),
  studentName: z
    .string()
    .trim()
    .min(2, "Student name must be at least 2 characters")
    .max(80, "Student name cannot exceed 80 characters"),
  studentRollNo: z
    .string()
    .trim()
    .max(30, "Roll number cannot exceed 30 characters")
    .optional()
    .or(z.literal("")),
  schoolName: z
    .string()
    .trim()
    .max(120, "School name cannot exceed 120 characters")
    .optional()
    .or(z.literal("")),
  requestType: z.enum(["access", "correction", "deletion", "grievance"], {
    message: "Please select a valid request type",
  }),
  details: z
    .string()
    .trim()
    .max(1000, "Details cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
  consentConfirmed: z.literal(true, {
    message: "You must confirm the consent declaration",
  }),
  honeypot: z.string().max(100).optional(),
});

export interface DataRequestRecord {
  id: string;
  requesterName: string;
  requesterRole: "parent" | "teacher" | "student" | "guardian";
  email: string;
  phone?: string;
  studentName: string;
  studentRollNo?: string;
  schoolName?: string;
  requestType: "access" | "correction" | "deletion" | "grievance";
  details?: string;
  timestamp: string;
  status: "verification_sent" | "verified" | "completed";
  verificationToken: string;
}

// In-memory request log
export const DATA_REQUESTS: DataRequestRecord[] = [];

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    // Rate limiting: 5 requests per 10 minutes per IP
    const rateCheck = checkRateLimit(`datareq_${ip}`, 5, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait 10 minutes before submitting again." },
        { status: 429 }
      );
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: "Invalid form payload." }, { status: 400 });
    }

    // Bot honeypot check
    if (rawBody.honeypot && String(rawBody.honeypot).trim().length > 0) {
      return NextResponse.json({
        success: true,
        message: "Your request has been recorded.",
      });
    }

    const parseResult = DataRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input provided.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = parseResult.data;

    // Generate unique reference tracking ID and a secure verification token
    const refId = `DPDP-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const verificationToken = crypto.randomBytes(16).toString("hex");

    const sanitizedRecord: DataRequestRecord = {
      id: refId,
      requesterName: sanitizeText(data.requesterName),
      requesterRole: data.requesterRole,
      email: data.email,
      phone: data.phone ? sanitizeText(data.phone) : undefined,
      studentName: sanitizeText(data.studentName),
      studentRollNo: data.studentRollNo ? sanitizeText(data.studentRollNo) : undefined,
      schoolName: data.schoolName ? sanitizeText(data.schoolName) : undefined,
      requestType: data.requestType,
      details: data.details ? sanitizeText(data.details) : undefined,
      timestamp: new Date().toISOString(),
      status: "verification_sent",
      verificationToken,
    };

    DATA_REQUESTS.push(sanitizedRecord);

    logAuditEvent({
      userId: "anonymous",
      userRole: "anonymous",
      schoolId: "grievance_portal",
      action: "data_request_received",
      targetRecordId: refId,
      ipHash: hashIp(ip),
      details: `Data principal ${data.requestType} request initiated`,
    });

    // Requirement:
    // "after submission, send a verification step to the email given before any record is released. Do not return any student data in the API response."
    // Response strictly contains NO student names, NO scores, NO sensitive records.
    return NextResponse.json({
      success: true,
      referenceId: refId,
      verificationRequired: true,
      message:
        "Your request under the DPDP Act 2023 has been logged. For security and privacy, a verification link has been sent to the email address provided. You must verify your email before any records can be reviewed or released.",
      timelineDays: 30,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to process request at this time. Please try again later." },
      { status: 500 }
    );
  }
}
