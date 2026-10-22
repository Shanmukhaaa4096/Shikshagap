// scripts/checkQuestionMemory.mjs
/**
 * Diagnostic tool to inspect ShikshaGap Question-Memory status and row counts.
 * Checks whether Supabase or LocalJsonQuestionStore is active, queries row counts,
 * and prints sample items with empirical statistics.
 *
 * Usage:
 *   node scripts/checkQuestionMemory.mjs
 */

import { getQuestionStore, isSupabaseConfigured } from "../src/lib/db/questionStore.ts";
import { getSupabaseAdmin } from "../src/lib/server/supabase.ts";
import fs from "fs";
import path from "path";

async function checkStatus() {
  console.log("================================================================================");
  console.log("            SHIKSHAGAP QUESTION-MEMORY DIAGNOSTIC CHECK");
  console.log("================================================================================\n");

  const supabaseConfigured = isSupabaseConfigured();
  const store = getQuestionStore();
  const storeName = store.constructor.name;

  console.log(`Active Store:         ${storeName}`);
  console.log(`Supabase Configured:  ${supabaseConfigured ? "YES" : "NO"}`);
  console.log(`Node Environment:     ${process.env.NODE_ENV || "development"}\n`);

  if (supabaseConfigured) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error("ERROR: isSupabaseConfigured() returned true, but getSupabaseAdmin() returned null!");
      process.exit(1);
    }

    const { count, error } = await supabase
      .from("question_memory")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Supabase query error:", error.message);
    } else {
      console.log(`Total Rows in 'question_memory': ${count}`);
    }

    const { data: recent, error: recentErr } = await supabase
      .from("question_memory")
      .select("id, board, class, concept_id, difficulty, question_text, answer_value, times_served, times_correct, flagged, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentErr) {
      console.error("Error fetching recent questions:", recentErr.message);
    } else if (recent && recent.length > 0) {
      console.log(`\nLast ${recent.length} Question(s) in Supabase:`);
      recent.forEach((q, idx) => {
        console.log(`  [${idx + 1}] ID: ${q.id} | Board: ${q.board} | Class ${q.class} | ${q.concept_id} (L${q.difficulty})`);
        console.log(`      Text: "${q.question_text}" -> Answer: ${q.answer_value}`);
        console.log(`      Served: ${q.times_served} | Correct: ${q.times_correct} | Flagged: ${q.flagged}\n`);
      });
    } else {
      console.log("No questions found in Supabase table 'question_memory'.");
    }
  } else {
    const jsonPath = path.join(process.cwd(), "data", "question_memory.json");
    if (!fs.existsSync(jsonPath)) {
      console.log(`Local JSON file does not exist at: ${jsonPath}`);
    } else {
      try {
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const items = JSON.parse(raw);
        console.log(`Total Items in 'data/question_memory.json': ${items.length}`);

        const boardBreakdown = {};
        for (const item of items) {
          const key = `${item.board || "Unknown"}-Class${item.class || "?"}`;
          boardBreakdown[key] = (boardBreakdown[key] || 0) + 1;
        }
        console.log("Breakdown by Board & Class:", JSON.stringify(boardBreakdown, null, 2));

        const recent = items.slice(-5).reverse();
        console.log(`\nLatest ${recent.length} Item(s):`);
        recent.forEach((q, idx) => {
          console.log(`  [${idx + 1}] ID: ${q.id} | Board: ${q.board} | Class ${q.class} | ${q.concept_id} (L${q.difficulty})`);
          console.log(`      Text: "${q.question_text}" -> Answer: ${q.answer_value}`);
          console.log(`      Served: ${q.times_served} | Correct: ${q.times_correct} | Flagged: ${q.flagged}\n`);
        });
      } catch (err) {
        console.error("Error reading question_memory.json:", err.message);
      }
    }
  }

  console.log("================================================================================");
}

checkStatus().catch(console.error);
