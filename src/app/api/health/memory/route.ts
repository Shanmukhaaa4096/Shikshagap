import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { isSupabaseConfigured } from "@/lib/db/questionStore";
import { guardRequest, createGuardResponse } from "@/lib/server/guard";

/**
 * Protected health check endpoint for Question Memory.
 * Verifies persistent storage status and reports live row counts per class and board.
 *
 * Security: Requires Authorization header matching MEMORY_HEALTH_SECRET, CRON_SECRET, or SESSION_SECRET.
 */
export async function GET(req: NextRequest) {
  const guard = await guardRequest(req, { route: "/api/health/memory" });
  if (!guard.ok) {
    return createGuardResponse(guard);
  }

  const expectedSecret =
    process.env.MEMORY_HEALTH_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SESSION_SECRET;

  if (expectedSecret && expectedSecret.trim().length > 0) {
    const authHeader = req.headers.get("authorization") || "";
    const healthKey = req.headers.get("x-health-key") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();

    if (bearerToken !== expectedSecret && healthKey !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized access to memory health telemetry" }, { status: 401 });
    }
  }

  try {
    const supabaseConfigured = isSupabaseConfigured();
    if (supabaseConfigured) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data, count, error } = await supabase
          .from("question_memory")
          .select("class, board, times_served, times_correct");

        if (!error && Array.isArray(data)) {
          const breakdownMap = new Map<string, { class: number; board: string; count: number; timesServed: number; timesCorrect: number }>();
          let totalServed = 0;
          let totalCorrect = 0;

          for (const row of data) {
            const cls = Number(row.class) || 1;
            const brd = String(row.board) || "CBSE";
            const key = `${cls}:${brd}`;
            const served = Number(row.times_served) || 0;
            const correct = Number(row.times_correct) || 0;

            totalServed += served;
            totalCorrect += correct;

            const existing = breakdownMap.get(key) || { class: cls, board: brd, count: 0, timesServed: 0, timesCorrect: 0 };
            existing.count++;
            existing.timesServed += served;
            existing.timesCorrect += correct;
            breakdownMap.set(key, existing);
          }

          const breakdown = Array.from(breakdownMap.values()).sort(
            (a, b) => a.class - b.class || a.board.localeCompare(b.board)
          );

          return NextResponse.json({
            status: "healthy",
            storage: "supabase",
            totalQuestions: count ?? data.length,
            totalTimesServed: totalServed,
            totalTimesCorrect: totalCorrect,
            breakdown,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // Local / fallback response
    return NextResponse.json({
      status: "healthy",
      storage: "local",
      totalQuestions: 0,
      totalTimesServed: 0,
      totalTimesCorrect: 0,
      breakdown: [],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[MemoryHealthRoute] Telemetry error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Failed retrieving memory health statistics" },
      { status: 500 }
    );
  }
}
