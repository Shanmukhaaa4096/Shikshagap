import { NextRequest, NextResponse } from "next/server";
import { finalizeAssessment } from "@/lib/agents/orchestrator";
import type { SessionMemory } from "@/lib/types";
import { guardRequest, createGuardResponse } from "@/lib/server/guard";
import { recordAssessmentSessionCompletion } from "@/lib/server/store";

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req, { route: "/api/assessment/finish" });
    if (!guard.ok) {
      return createGuardResponse(guard);
    }

    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 65536) {
      return NextResponse.json(
        { error: "Request payload exceeds allowed limit (64KB)." },
        { status: 413 }
      );
    }

    const body = await req.json();
    const memory: SessionMemory | undefined = body?.memory;

    if (!memory || !Array.isArray(memory.topics)) {
      return NextResponse.json(
        { error: "Invalid session memory provided." },
        { status: 400 }
      );
    }

    // Allowed grades whitelist: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] (expanded from [3, 4, 5])
    const ALLOWED_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    if (memory.grade && !ALLOWED_GRADES.includes(memory.grade)) {
      return NextResponse.json(
        { error: "Invalid grade. Only grades 1 to 10 are currently enabled." },
        { status: 400 }
      );
    }

    const result = await finalizeAssessment(memory);

    // Register this completed assessment session so only this session can generate a share report
    const validSessionId =
      (body && typeof body.sessionId === "string" && body.sessionId.length >= 8)
        ? body.sessionId
        : undefined;
    if (validSessionId) {
      recordAssessmentSessionCompletion(validSessionId, memory.grade || 5);
    }

    // Step 10: In background, record anonymous session memory update
    try {
      const questionsList: Array<{
        questionId: string;
        conceptId: string;
        level: number;
        correct: boolean;
        errorType?: string;
      }> = [];

      for (const topic of memory.topics) {
        for (const att of topic.attempts) {
          questionsList.push({
            questionId: att.questionId || `${att.conceptId}_${att.level}`,
            conceptId: att.conceptId,
            level: att.level,
            correct: att.correct,
            errorType: att.errorType,
          });
        }
      }

      if (questionsList.length > 0) {
        const topicOutcomes = memory.topics.map((t) => ({
          topicId: t.topicId,
          status: t.status,
        }));

        const now = new Date();
        now.setMinutes(0, 0, 0); // truncate to hour precision

        const sessionId =
          (body && typeof body.sessionId === "string" && body.sessionId.length >= 8)
            ? body.sessionId
            : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const { processAnonymousSession } = await import("@/lib/db/questionMemory");
        await processAnonymousSession({
          sessionId,
          grade: memory.grade,
          language: memory.language,
          hourTimestamp: now.toISOString(),
          questions: questionsList,
          topicOutcomes,
        }).catch(() => {
          // Non-blocking
        });
      }
    } catch {
      // Non-blocking memory update
    }

    return NextResponse.json({
      success: true,
      recommendations: result.recommendations,
      summary: result.summary,
    });
  } catch (error) {
    console.error("Assessment finish error:", error);
    return NextResponse.json(
      { error: "Internal server error while finalizing assessment." },
      { status: 500 }
    );
  }
}
