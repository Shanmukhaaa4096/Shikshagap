import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface DataRequestPayload {
  requesterName: string;
  requesterRole: "parent" | "teacher" | "student" | "guardian";
  email: string;
  phone?: string;
  studentName: string;
  studentRollNo: string;
  schoolName: string;
  requestType: "access" | "correction" | "deletion" | "grievance";
  details: string;
  consentConfirmed: boolean;
}

// In-memory request log (in production persisted to encrypted audit ledger)
const DATA_REQUESTS: Array<DataRequestPayload & { id: string; timestamp: string; status: string }> = [];

export async function POST(req: NextRequest) {
  try {
    const body: DataRequestPayload = await req.json().catch(() => null);

    if (
      !body ||
      !body.requesterName ||
      !body.email ||
      !body.studentName ||
      !body.requestType ||
      !body.consentConfirmed
    ) {
      return NextResponse.json(
        {
          error: "All required fields including consent declaration must be provided.",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Generate unique reference ID
    const refId = `DPDP-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    const record = {
      ...body,
      id: refId,
      timestamp: new Date().toISOString(),
      status: "received",
    };

    DATA_REQUESTS.push(record);

    return NextResponse.json({
      success: true,
      referenceId: refId,
      message:
        "Your request under India's Digital Personal Data Protection Act 2023 has been logged. Our Data Protection Officer will review and verify your identity within 7 business days, and resolve the request within 30 days.",
      timelineDays: 30,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process data request. Please try again or contact privacy@shikshagap.in" },
      { status: 500 }
    );
  }
}
