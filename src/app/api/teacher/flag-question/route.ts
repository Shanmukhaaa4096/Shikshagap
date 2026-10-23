// src/app/api/teacher/flag-question/route.ts
/**
 * Protected Teacher Endpoint: Flag a Bad Question.
 * Excludes the flagged question from all future retrieval (flagged = true).
 * Protected by teacher authentication session.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { guardRequest, createGuardResponse } from "@/lib/server/guard";
import { getQuestionStore } from "@/lib/db/questionStore";
import { reportQuestion } from "@/lib/db/questionMemory";
import { z } from "zod";

const FlagQuestionSchema = z.object({
  questionId: z.string().min(1).max(128),
  reason: z.string().max(256).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req, { route: "/api/teacher/flag-question" });
    if (!guard.ok) {
      return createGuardResponse(guard);
    }

    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized. Teacher session required." }, { status: 401 });
    }

    const raw = await req.json().catch(() => null);
    if (!raw) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = FlagQuestionSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload schema", issues: parsed.error.issues }, { status: 400 });
    }

    const { questionId, reason } = parsed.data;
    let flagged = false;
    try {
      const store = getQuestionStore();
      flagged = await store.flagQuestion(questionId, reason);
    } catch (storeErr) {
      console.warn("[FlagQuestionRoute] Store unconfigured in production:", storeErr);
    }

    // Also update legacy memory store if present
    await reportQuestion(questionId, reason).catch(() => {});

    return NextResponse.json({
      success: true,
      flagged,
      questionId,
      reason: reason || "Flagged by teacher",
    });
  } catch (error) {
    console.error("[FlagQuestionRoute] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to flag question." }, { status: 500 });
  }
}
