import { NextRequest, NextResponse } from "next/server.js";
import { z } from "zod";
import {
  generateWorksheet,
  validateWorksheetItem,
  type Board,
  type Language,
} from "../../../lib/questions/worksheetGenerator.ts";
import {
  getQuestionStore,
  embedQuestionText,
  type QuestionMemoryItem,
  type QuestionStore,
} from "../../../lib/db/questionStore.ts";
import { computeQuestionFingerprint } from "../../../lib/questions/fingerprint.ts";
import { guardRequest, createGuardResponse } from "../../../lib/server/guard.ts";

const WorksheetRequestSchema = z.object({
  classNum: z.coerce.number().int().min(1).max(10),
  board: z.enum(["CBSE", "ICSE", "Both"]).default("CBSE"),
  skill: z.string().optional(),
  difficultyBand: z.enum(["easy", "medium", "hard", "all"]).optional(),
  language: z.enum(["en", "hi", "te"]).default("en"),
  count: z.coerce.number().int().min(4).max(30).default(10),
  diagnosedGap: z
    .object({
      rootId: z.string(),
      title: z.string(),
      fromGrade: z.number().int().min(1).max(10),
    })
    .optional(),
  excludeIds: z.array(z.string()).optional(),
  seed: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const guard = await guardRequest(req, { route: "/api/worksheet" });
  if (!guard.ok) {
    return createGuardResponse(guard);
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = WorksheetRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid worksheet request parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      classNum,
      board,
      skill,
      difficultyBand,
      language,
      count,
      diagnosedGap,
      excludeIds,
      seed,
    } = parsed.data;

    let store: QuestionStore | null = null;
    try {
      store = getQuestionStore();
    } catch (storeInitErr) {
      console.warn("[WorksheetAPI] Persistent question store unconfigured in production:", storeInitErr);
    }

    // 1. Query existing questions from question_memory filtered in SQL
    let storedQuestions: QuestionMemoryItem[] = [];
    if (store) {
      try {
        storedQuestions = await store.queryQuestions({
          class: classNum,
          board: board === "Both" ? undefined : board,
          conceptId: skill,
          excludeIds,
          limit: count,
        });
      } catch (queryErr) {
        console.warn("[WorksheetAPI] Stored question retrieval fallback:", queryErr);
        storedQuestions = [];
      }
    }

    // 2. Generate structured worksheet combining stored questions and deterministic parametric generation
    const worksheet = generateWorksheet({
      classNum,
      board: board as Board,
      targetSkill: skill,
      difficultyBand,
      language: language as Language,
      count,
      diagnosedGap,
      excludeIds,
      seed: seed ?? Math.floor(Math.random() * 1000000),
      storedQuestions,
    });

    // 3. Persist newly generated items into question_memory after code validation
    // Code validation: answer recomputed deterministically, unique options, single correct choice, class-tagged
    const storedIdsSet = new Set(storedQuestions.map((q) => q.id));
    const itemsToSave = worksheet.items.filter(
      (item) => (!item.templateId || !storedIdsSet.has(item.templateId)) && validateWorksheetItem(item)
    );

    let newlySavedCount = 0;
    if (store) {
      for (const item of itemsToSave) {
        try {
          const fingerprint = item.fingerprint || computeQuestionFingerprint(item.prompt, item.operands || []);
          const embedding = await embedQuestionText(item.prompt, {
            conceptId: item.topic,
            board: item.board,
          });

          const saveRes = await store.saveQuestion({
            board: item.board,
            class: item.classNum,
            concept_id: item.topic,
            lang: language,
            difficulty: item.difficulty,
            question_text: item.prompt,
            answer_value: item.correctAnswer,
            answer_format: item.options ? "multiple_choice" : "numeric",
            template_or_source: "hybrid",
            fingerprint,
            embedding,
            times_served: 1,
            times_correct: 0,
            flagged: false,
          });

          if (saveRes.saved) {
            newlySavedCount++;
          }
        } catch (saveErr) {
          // Log without crashing the worksheet delivery
          console.warn("[WorksheetAPI] Failed to persist generated question to memory:", saveErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      worksheet,
      retrievedFromStoreCount: storedQuestions.length,
      newlySavedCount,
    });
  } catch (err) {
    console.error("[WorksheetAPI] Internal error:", err);
    return NextResponse.json(
      { error: "Failed to generate worksheet" },
      { status: 500 }
    );
  }
}
