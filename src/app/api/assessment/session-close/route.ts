import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processAnonymousSession, validateSessionPayloadWhitelist } from "@/lib/db/questionMemory";

const SessionCloseSchema = z.object({
  sessionId: z.string().min(8).max(64),
  grade: z.union([z.literal(3), z.literal(4), z.literal(5)]),
  language: z.enum(["en", "hi", "te"]),
  hourTimestamp: z.string().min(10).max(35),
  questions: z.array(
    z.object({
      questionId: z.string().max(64),
      conceptId: z.string().max(64),
      level: z.number().int().min(1).max(3),
      correct: z.boolean(),
      errorType: z.string().max(64).optional(),
    })
  ).max(20),
  topicOutcomes: z.array(
    z.object({
      topicId: z.string().max(64),
      status: z.enum(["mastered", "developing", "gap", "pending"]),
    })
  ).max(10),
});

import { guardRequest, createGuardResponse } from "@/lib/server/guard";

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req, { route: "/api/assessment/session-close" });
    if (!guard.ok) {
      return createGuardResponse(guard);
    }

    // Size limit check (max 32KB payload)
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 32768) {
      return NextResponse.json(
        { error: "Payload exceeds maximum allowed size (32KB)." },
        { status: 413 }
      );
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Strict whitelist check
    const whitelistCheck = validateSessionPayloadWhitelist(rawBody);
    if (!whitelistCheck.valid) {
      return NextResponse.json({ error: whitelistCheck.error }, { status: 400 });
    }

    // Zod Schema validation
    const parsed = SessionCloseSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Schema validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await processAnonymousSession(parsed.data);

    return NextResponse.json({
      success: true,
      alreadyProcessed: result.alreadyProcessed,
      questionsUpdated: result.questionsUpdated,
      sessionId: result.sessionSummary.sessionId,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
