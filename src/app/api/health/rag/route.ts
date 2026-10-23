import { NextRequest, NextResponse } from "next/server.js";
import { getSupabaseAdmin } from "../../../../lib/server/supabase.ts";
import { getQuestionStore, type QuestionStore } from "../../../../lib/db/questionStore.ts";

export const dynamic = "force-dynamic";

/**
 * Protected health route for RAG question_memory status.
 *
 * Requirements:
 * 1. Requires secret from env var named RAG_HEALTH_SECRET.
 * 2. If RAG_HEALTH_SECRET is not set, returns 404.
 * 3. Never inserts or mutates any data.
 * 4. Returns only row counts grouped by class and board.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const expectedSecret = process.env.RAG_HEALTH_SECRET;
  if (!expectedSecret || expectedSecret.trim().length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const searchParams = req.nextUrl.searchParams;
  const secretParam = searchParams.get("secret");
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  const providedSecret = secretParam || bearerSecret;
  if (!providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("question_memory")
      .select("class, board, difficulty");

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          error: error.message,
        },
        { status: 500 }
      );
    }

    const counts: Record<string, number> = {};
    const byDifficulty: Record<string, number> = {};
    let total = 0;

    for (const row of data || []) {
      total++;
      const classBoardKey = `class_${row.class}_${row.board}`;
      counts[classBoardKey] = (counts[classBoardKey] || 0) + 1;

      const diffKey = `diff_${row.difficulty}`;
      byDifficulty[diffKey] = (byDifficulty[diffKey] || 0) + 1;
    }

    return NextResponse.json({
      status: "ok",
      store: "supabase",
      total,
      by_class_and_board: counts,
      by_difficulty: byDifficulty,
    });
  }

  // Fallback to local store if Supabase is not configured (in dev/test)
  let localStore: QuestionStore | null = null;
  try {
    localStore = getQuestionStore();
  } catch (_err) {
    return NextResponse.json({
      status: "degraded",
      store: "unconfigured",
      error: "Supabase question store is not configured in production serverless.",
      total: 0,
      by_class_and_board: {},
      by_difficulty: {},
    });
  }
  const allQuestions: Array<{ class: number; board: string; difficulty: number }> = [];

  for (let c = 1; c <= 10; c++) {
    for (const b of ["CBSE", "ICSE"]) {
      const questions = await localStore.retrieveSimilarQuestions({
        queryEmbedding: new Array(768).fill(0),
        board: b,
        class: c,
        conceptId: "any",
        difficultyMin: 1,
        difficultyMax: 5,
        limit: 1000,
      });
      for (const q of questions) {
        allQuestions.push({ class: q.class, board: q.board, difficulty: q.difficulty });
      }
    }
  }

  const counts: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};
  for (const row of allQuestions) {
    const classBoardKey = `class_${row.class}_${row.board}`;
    counts[classBoardKey] = (counts[classBoardKey] || 0) + 1;
    const diffKey = `diff_${row.difficulty}`;
    byDifficulty[diffKey] = (byDifficulty[diffKey] || 0) + 1;
  }

  return NextResponse.json({
    status: "ok",
    store: "local",
    total: allQuestions.length,
    by_class_and_board: counts,
    by_difficulty: byDifficulty,
  });
}
