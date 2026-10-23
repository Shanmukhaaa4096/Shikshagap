import { NextRequest, NextResponse } from "next/server";
import { areAnswersEquivalent } from "@/lib/questions/integrity";
import { verifyAnswerWithToken } from "@/lib/questions/optionShuffler";
import { guardRequest, createGuardResponse } from "@/lib/server/guard";

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req, { route: "/api/assessment/verify" });
    if (!guard.ok) return createGuardResponse(guard);

    const body = await req.json();
    const { questionId, studentAnswer, token, expectedAnswer } = body || {};

    if (!questionId || studentAnswer === undefined) {
      return NextResponse.json(
        { error: "Missing questionId or studentAnswer." },
        { status: 400 }
      );
    }

    const trimmed = String(studentAnswer).trim();
    let isCorrect = false;

    if (token) {
      isCorrect = verifyAnswerWithToken(questionId, trimmed, token, expectedAnswer);
    } else if (expectedAnswer) {
      isCorrect = areAnswersEquivalent(trimmed, expectedAnswer);
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      questionId,
    });
  } catch (error) {
    console.error("[VerifyRoute] Verification error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Internal error during answer verification." },
      { status: 500 }
    );
  }
}
