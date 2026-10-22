import { NextRequest, NextResponse } from "next/server";
import { getQuestionStore, isSupabaseConfigured } from "@/lib/db/questionStore";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { guardRequest, createGuardResponse } from "@/lib/server/guard";
import { getServerSession } from "@/lib/auth/session";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const guard = await guardRequest(req, { route: "/api/admin/question-memory-status" });
    if (!guard.ok) {
      return createGuardResponse(guard);
    }

    // Role verification: school_admin or valid ADMIN_DIAGNOSTIC_KEY
    const session = await getServerSession();
    const adminKey = req.headers.get("x-admin-key");
    const expectedKey = process.env.ADMIN_DIAGNOSTIC_KEY;

    const isAuthorized =
      (session?.user?.role === "school_admin") ||
      (expectedKey && adminKey === expectedKey) ||
      (process.env.NODE_ENV !== "production");

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden. Administrative access required." },
        { status: 403 }
      );
    }

    const supabaseConfigured = isSupabaseConfigured();
    const store = getQuestionStore();
    const storeName = store.constructor.name;

    if (supabaseConfigured) {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return NextResponse.json({
          activeStore: storeName,
          supabaseConfigured: true,
          error: "Supabase client initialization failed",
          totalCount: 0,
          recentQuestions: [],
        });
      }

      const { count, error } = await supabase
        .from("question_memory")
        .select("*", { count: "exact", head: true });

      const { data: recent } = await supabase
        .from("question_memory")
        .select("id, board, class, concept_id, difficulty, question_text, answer_value, times_served, times_correct, flagged, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      return NextResponse.json({
        activeStore: storeName,
        supabaseConfigured: true,
        totalCount: count || 0,
        queryError: error ? error.message : null,
        recentQuestions: recent || [],
      });
    }

    // LocalJsonQuestionStore fallback
    const jsonPath = path.join(process.cwd(), "data", "question_memory.json");
    let count = 0;
    let recent: unknown[] = [];
    if (fs.existsSync(jsonPath)) {
      try {
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const items = JSON.parse(raw);
        if (Array.isArray(items)) {
          count = items.length;
          recent = items.slice(-10).reverse().map((item) => ({
            id: item.id,
            board: item.board,
            class: item.class,
            concept_id: item.concept_id,
            difficulty: item.difficulty,
            question_text: item.question_text,
            answer_value: item.answer_value,
            times_served: item.times_served,
            times_correct: item.times_correct,
            flagged: item.flagged,
            created_at: item.created_at,
          }));
        }
      } catch {
        count = 0;
      }
    }

    return NextResponse.json({
      activeStore: storeName,
      supabaseConfigured: false,
      totalCount: count,
      recentQuestions: recent,
    });
  } catch (error) {
    console.error("[QuestionMemoryStatus] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
