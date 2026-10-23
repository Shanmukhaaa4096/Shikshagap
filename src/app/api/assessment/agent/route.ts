import { NextRequest, NextResponse } from "next/server.js";
import { generateUnique } from "../../../../lib/questions/generator.ts";
import { enhanceQuestionWithHybridWording } from "../../../../lib/questions/hybridGenerator.ts";
import { getVerifiedTextbookQuestion } from "../../../../lib/questions/textbookBank.ts";
import { validateQuestionStrict } from "../../../../lib/questions/validator.ts";
import { makeRng } from "../../../../lib/rng.ts";
import {
  getNextStaircaseAction,
  applyAttemptToMemory,
  advanceToNextTopic,
  normalizeQuestionText,
  getQuestionText,
  type StaircaseAction,
} from "../../../../lib/agents/staircase.ts";
import { runExaminerStep } from "../../../../lib/agents/examiner.ts";
import { analyzeErrors } from "../../../../lib/agents/errorAnalyst.ts";
import { evaluateStoppingRule } from "../../../../lib/engine/stoppingRule.ts";
import type {
  Attempt,
  Question,
  SessionMemory,
  ConceptId,
  Difficulty,
  QuestionFormat,
} from "../../../../lib/types.ts";

import { getMultiBoardQuestion } from "../../../../lib/questions/multiBoardBank.ts";
import { syncQuestionProvenance } from "../../../../lib/questions/provenance.ts";
import { getCurriculumConcept } from "../../../../data/curriculum/index.ts";
import { rotateSourceStyle, type SourceStyle, type DifficultyLevel, calibrateDifficultyWithEmpiricalData } from "../../../../lib/agents/adaptiveEngine.ts";
import { z } from "zod";
import { guardRequest, createGuardResponse } from "../../../../lib/server/guard.ts";
import { getClientIp } from "../../../../lib/server/security.ts";
import { retrieve } from "../../../../lib/rag/retrieve.ts";
import {
  getQuestionStore,
  retrieveSimilarQuestionsSafe,
  embedQuestionText,
} from "../../../../lib/db/questionStore.ts";
import { computeQuestionFingerprint } from "../../../../lib/questions/fingerprint.ts";

const AssessmentAgentSchema = z.object({
  memory: z.object({
    pseudonymousId: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .refine(
        (id) => !/\b(rajesh|kumar|sharma|patel|singh|devi|priya|ananya|rahul|amit|pooja|sneha|mohan)\b/i.test(id),
        "Real student names are strictly forbidden; use pseudonymous identifier only"
      ),
    grade: z.number().int().min(1).max(10),
    language: z.enum(["en", "hi", "te"]),
    currentTopicIndex: z.number().int().min(0),
    topics: z.array(z.any()).min(1),
    seenSignatures: z.array(z.string()).optional(),
    usedFormats: z.array(z.string()).optional(),
    askedQuestionIds: z.array(z.string()).optional(),
    askedQuestionTexts: z.array(z.string()).optional(),
    sessionSeed: z.number().int().optional(),
    stepCount: z.number().int().optional(),
    boardPreference: z.enum(["CBSE", "ICSE", "BOTH"]).optional(),
    initialDifficulty: z.number().int().min(1).max(5).optional(),
    adaptiveMode: z.boolean().optional(),
  }),
  lastAttempt: z
    .object({
      conceptId: z.string(),
      level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
      questionId: z.string(),
      questionText: z.string().optional(),
      studentAnswer: z.string(),
      correct: z.boolean(),
      errorType: z.string().optional(),
      sourceStyle: z.enum(["ncert", "exemplar", "cbse_reference", "icse_selina", "icse_foundation"]).optional(),
      missingPart: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req, { route: "/api/assessment/agent" });
    if (!guard.ok) {
      return createGuardResponse(guard);
    }

    const ip = getClientIp(req);

    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 65536) {
      return NextResponse.json(
        { error: "Request payload exceeds allowed limit (64KB)." },
        { status: 413 }
      );
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const parseResult = AssessmentAgentSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const err = parseResult.error.issues[0]?.message || "Invalid payload schema.";
      return NextResponse.json({ error: err }, { status: 400 });
    }

    const memory = rawBody.memory as SessionMemory;
    const lastAttempt = rawBody.lastAttempt as Attempt | undefined;

    // Allowed grades whitelist: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] (expanded from [3, 4, 5])
    const ALLOWED_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    if (memory.grade && !ALLOWED_GRADES.includes(memory.grade)) {
      return NextResponse.json(
        { error: "Invalid grade. Only grades 1 to 10 are currently enabled." },
        { status: 400 }
      );
    }

    const sessionSeed = memory.sessionSeed ?? Date.now();
    const currentStep = memory.stepCount ?? 0;
    const rng = makeRng(((sessionSeed + currentStep * 7919) >>> 0));

    let currentMemory: SessionMemory = memory;
    let nextAction: StaircaseAction;

    if (lastAttempt) {
      // 1. Advance session memory with student's attempt
      const advanced = applyAttemptToMemory(currentMemory, lastAttempt);
      currentMemory = advanced.memory;
      nextAction = advanced.action;

      // Update aggregate counters in QuestionStore (strictly aggregate, no student PII or session id)
      if (lastAttempt.questionId) {
        const store = getQuestionStore();
        store.incrementStats(lastAttempt.questionId, lastAttempt.correct).catch((err) => {
          console.error("[QuestionStore] incrementStats failed:", {
            error: err instanceof Error ? err.message : err,
            questionId: lastAttempt.questionId,
          });
        });
      }

      // 2. If a topic closed as developing or gap, run Error Analyst
      if (
        advanced.closedTopic &&
        (advanced.closedTopic.status === "developing" || advanced.closedTopic.status === "gap")
      ) {
        const closedTopicMem = currentMemory.topics.find(
          (t) => t.topicId === advanced.closedTopic!.topicId
        );
        if (closedTopicMem) {
          const analystRes = await analyzeErrors({
            topicId: closedTopicMem.topicId,
            attempts: closedTopicMem.attempts,
            pseudonymousId: currentMemory.pseudonymousId,
            grade: currentMemory.grade,
          });
          closedTopicMem.misconceptions = analystRes.labels;
        }
      }
    } else {
      nextAction = getNextStaircaseAction(currentMemory);
    }

    // 3. Consult Examiner agent via function calling through code gate
    const examinerRes = await runExaminerStep(currentMemory, undefined);
    if (examinerRes.notes.length > 0) {
      const activeTopic =
        currentMemory.topics[currentMemory.currentTopicIndex] ||
        currentMemory.topics[currentMemory.currentTopicIndex - 1];
      if (activeTopic) {
        activeTopic.notes.push(...examinerRes.notes);
      }
    }
    nextAction = examinerRes.action;

    if (nextAction.type === "close_topic") {
      const advanced = advanceToNextTopic(currentMemory, `Topic closed with status ${nextAction.status}`);
      currentMemory = advanced.memory;
      nextAction = advanced.action;
    }

    if (nextAction.type !== "ask") {
      const allAtts = currentMemory.topics.flatMap((t) => t.attempts).filter((a) => a.questionId !== "dummy");
      const stopping = evaluateStoppingRule(currentMemory, allAtts);
      return NextResponse.json({
        memory: currentMemory,
        isFinished: true,
        nextQuestion: null,
        action: nextAction,
        isProvisional: stopping.isProvisional,
        confidence: stopping.rootGapConfidence,
        stoppingReason: stopping.reason,
      });
    }

    // 4. Source rotation & multi-board selection
    const askedIds = new Set<string>([
      ...(currentMemory.askedQuestionIds || []),
      ...(currentMemory.seenSignatures || []),
    ]);
    const askedTexts = new Set<string>(
      (currentMemory.askedQuestionTexts || []).map((t) => normalizeQuestionText(t)).filter(Boolean)
    );

    const usedFormats = currentMemory.usedFormats || [];
    const lastFormat = usedFormats.length > 0 ? usedFormats[usedFormats.length - 1] : undefined;

    const historyOfStyles = currentMemory.topics.flatMap((t) =>
      t.attempts.map((a) => a.sourceStyle).filter((s): s is SourceStyle => Boolean(s))
    );
    const targetSourceStyle = rotateSourceStyle(
      historyOfStyles,
      currentMemory.boardPreference || "BOTH",
      rng()
    );

    const targetBoard: "CBSE" | "ICSE" =
      currentMemory.boardPreference === "ICSE"
        ? "ICSE"
        : currentMemory.boardPreference === "CBSE"
        ? "CBSE"
        : (targetSourceStyle === "icse_selina" || targetSourceStyle === "icse_foundation")
        ? "ICSE"
        : "CBSE";

    let nextQuestion: Question | null = null;

    const isCandidateUnasked = (candidate: Question): boolean => {
      const baseId = candidate.id.split("_s")[0];
      if (askedIds.has(candidate.id) || askedIds.has(baseId)) return false;
      const norm = normalizeQuestionText(getQuestionText(candidate, currentMemory.language));
      if (norm && askedTexts.has(norm)) return false;
      return true;
    };

    // Keep selecting until we get an unasked question or advance to the next topic
    while (nextAction.type === "ask" && !nextQuestion) {
      const targetConcept = getCurriculumConcept(nextAction.conceptId, targetBoard);
      const lookupClass = targetConcept?.class || currentMemory.grade;

      // 4a. Primary: Retrieve matching multi-board question
      const multiBoardCandidate = getMultiBoardQuestion(
        {
          class: lookupClass,
          conceptId: nextAction.conceptId,
          difficulty: nextAction.level as DifficultyLevel,
          sourceStyle: targetSourceStyle,
          board: targetBoard,
          excludeIds: Array.from(askedIds),
          excludeTexts: Array.from(askedTexts),
        },
        currentMemory.language
      );

      if (multiBoardCandidate && isCandidateUnasked(multiBoardCandidate)) {
        const synced = syncQuestionProvenance(multiBoardCandidate, targetBoard);
        const valResult = validateQuestionStrict(synced, {
          targetLang: currentMemory.language,
          requireTextbookProvenance: false,
          enrolledGrade: lookupClass,
          expectedBoard: targetBoard,
        });
        if (valResult.valid && isCandidateUnasked(synced)) {
          nextQuestion = synced;
        }
      }

      // 4b. Secondary: Retrieve verified textbook question (CBSE only)
      if (!nextQuestion && targetBoard === "CBSE") {
        const textbookCandidate = getVerifiedTextbookQuestion(
          {
            class: lookupClass,
            conceptId: nextAction.conceptId,
            difficulty: nextAction.level,
            language: currentMemory.language,
            excludeIds: Array.from(askedIds),
            excludeTexts: Array.from(askedTexts),
            onlyVerified: true,
          },
          currentMemory.language
        );

        if (textbookCandidate && isCandidateUnasked(textbookCandidate)) {
          const synced = syncQuestionProvenance(textbookCandidate, "CBSE");
          const valResult = validateQuestionStrict(synced, {
            targetLang: currentMemory.language,
            requireTextbookProvenance: true,
            enrolledGrade: lookupClass,
            expectedBoard: "CBSE",
          });
          if (valResult.valid && isCandidateUnasked(synced)) {
            nextQuestion = synced;
          }
        }
      }

      // 4c. Tertiary: Retrieve proven stored question from Persistent QuestionStore
      if (!nextQuestion) {
        try {
          const store = getQuestionStore();
          const queryEmb = await embedQuestionText(
            `Class ${lookupClass} ${targetBoard} ${nextAction.conceptId}`,
            { conceptId: nextAction.conceptId, board: targetBoard }
          );
          const storedCandidates = await retrieveSimilarQuestionsSafe(
            {
              queryEmbedding: queryEmb,
              board: targetBoard,
              class: lookupClass,
              conceptId: nextAction.conceptId,
              difficultyMin: 1,
              difficultyMax: 5,
              limit: 8,
            },
            800
          );

          // Calibrate difficulty with empirical data if times_served >= 20
          const matchingCandidates = [];
          for (const c of storedCandidates) {
            const norm = normalizeQuestionText(c.question_text);
            if (norm) askedTexts.add(norm); // Deduplication: prevent generator from repeating or paraphrasing stored questions
            if (askedIds.has(c.id)) continue;

            const empirical = await store.getEmpiricalDifficulty(c.id);
            const effDiff = calibrateDifficultyWithEmpiricalData(c.difficulty as DifficultyLevel, empirical);
            if (effDiff === nextAction.level) {
              matchingCandidates.push(c);
            }
          }

          // Prefer low times_served to give questions balanced exposure
          matchingCandidates.sort((a, b) => a.times_served - b.times_served);

          if (matchingCandidates.length > 0) {
            const chosen = matchingCandidates[0];
            const storedQ: Question = {
              id: chosen.id,
              conceptId: chosen.concept_id as ConceptId,
              difficulty: chosen.difficulty as Difficulty,
              prompt: {
                raw: chosen.question_text,
              },
              answer: chosen.answer_value,
              answerKind: "int",
              format: (chosen.answer_format as QuestionFormat) || "short_answer",
              source: "ai",
              sourceStyle: targetSourceStyle,
              board: targetBoard,
              meta: {
                class: lookupClass,
              },
            };

            const synced = syncQuestionProvenance(storedQ, targetBoard);
            const valResult = validateQuestionStrict(synced, {
              targetLang: currentMemory.language,
              requireTextbookProvenance: false,
              enrolledGrade: lookupClass,
              expectedBoard: targetBoard,
            });
            if (valResult.valid && isCandidateUnasked(synced)) {
              nextQuestion = synced;
            }
          }
        } catch {
          // Graceful fallback: continue to generator
        }
      }

      // 5. Fallback: generate and enhance with Gemini hybrid generator (CBSE only, never mask CBSE as ICSE)
      if (!nextQuestion && targetBoard === "CBSE") {
        for (let attempt = 0; attempt < 3; attempt++) {
          const baseQuestion = generateUnique(
            nextAction.conceptId,
            nextAction.level,
            rng,
            askedIds,
            lookupClass,
            { board: targetBoard },
            { avoidFormat: lastFormat },
            askedTexts
          );
          if (!isCandidateUnasked(baseQuestion)) continue;

          const synced = syncQuestionProvenance(baseQuestion, targetBoard);

          let candidateQ = synced;
          if (lookupClass <= 5) {
            candidateQ = await enhanceQuestionWithHybridWording(
              synced,
              currentMemory.language,
              lookupClass,
              askedIds,
              { ip, sourceStyle: targetSourceStyle }
            );
            candidateQ = syncQuestionProvenance(candidateQ, targetBoard);
          }

          if (isCandidateUnasked(candidateQ)) {
            const strictCheck = validateQuestionStrict(candidateQ, {
              targetLang: currentMemory.language,
              requireTextbookProvenance: false,
              enrolledGrade: lookupClass,
              expectedBoard: targetBoard,
            });

            if (strictCheck.valid) {
              nextQuestion = candidateQ;
              break;
            }
          }

          if (isCandidateUnasked(synced)) {
            const baseCheck = validateQuestionStrict(synced, {
              targetLang: currentMemory.language,
              requireTextbookProvenance: false,
              enrolledGrade: lookupClass,
              expectedBoard: targetBoard,
            });
            if (baseCheck.valid) {
              nextQuestion = synced;
              break;
            }
          }
        }
      }

      // 6. If this topic runs out of unasked questions, advance to the next topic instead of repeating!
      if (!nextQuestion) {
        const advanced = advanceToNextTopic(currentMemory, `Unasked questions exhausted for ${nextAction.topicId}`);
        currentMemory = advanced.memory;
        nextAction = advanced.action;
      }
    }

    if (nextAction.type !== "ask" || !nextQuestion) {
      // If we could not find any question on the very first step, signal empty state
      const isInitialStep = (currentMemory.stepCount ?? 0) === 0;
      return NextResponse.json({
        memory: currentMemory,
        isFinished: !isInitialStep,
        nextQuestion: null,
        action: nextAction,
        isEmptyState: isInitialStep,
        emptyStateMessage: "Content for this class is being added",
        sources: [],
      });
    }

    // Call curriculum RAG retriever to ground pedagogical hints and style
    const ragBoard = targetBoard === "ICSE" ? "ICSE" : (currentMemory.boardPreference === "CBSE" ? "CBSE" : "NCERT");
    let retrievedChunks: Array<{ id: string; source: string; text: string; type: string }> = [];
    try {
      retrievedChunks = await retrieve(
        `Class ${currentMemory.grade} maths curriculum pedagogy and hints for ${nextAction.conceptId}`,
        {
          board: ragBoard,
          class: currentMemory.grade,
          conceptId: nextAction.conceptId,
          lang: currentMemory.language,
          k: 4,
        }
      );
    } catch {
      retrievedChunks = [];
    }

    const ragSources = retrievedChunks.map((c) => ({ id: c.id, title: c.source }));
    const hintChunk = retrievedChunks.find((c) => c.type === "hint");

    // Stamp final synchronization, unique step-scoped instance ID, and record in asked lists
    const baseId = nextQuestion.id.split("_s")[0];
    const normText = normalizeQuestionText(getQuestionText(nextQuestion, currentMemory.language));

    askedIds.add(baseId);
    if (normText) askedTexts.add(normText);

    nextQuestion = syncQuestionProvenance(nextQuestion, targetBoard);
    nextQuestion.sourceStyle = nextQuestion.sourceStyle || targetSourceStyle;
    nextQuestion.id = `${baseId}_s${currentStep + 1}_${Date.now()}`;
    if (!nextQuestion.ragSources && ragSources.length > 0) {
      nextQuestion.ragSources = ragSources;
    }
    if (!nextQuestion.hintSource && (hintChunk || ragSources.length > 0)) {
      nextQuestion.hintSource = hintChunk?.source || ragSources[0].title;
    }
    askedIds.add(nextQuestion.id);

    // Persist served question into persistent QuestionStore (Supabase in production, Local in dev/test)
    try {
      const store = getQuestionStore();
      const questionText = getQuestionText(nextQuestion, currentMemory.language);
      const rawQ = nextQuestion as unknown as { operands?: number[]; provenance?: { type?: string } };
      const operands = Array.isArray(rawQ.operands) ? rawQ.operands : [];
      const fingerprint = computeQuestionFingerprint(questionText, operands);
      const embedding = await embedQuestionText(questionText, {
        conceptId: nextAction.conceptId,
        board: targetBoard,
      });

      const questionClass = nextQuestion.meta?.class || currentMemory.grade;

      const saveRes = await store.saveQuestion({
        id: baseId,
        board: targetBoard,
        class: questionClass,
        concept_id: nextAction.conceptId,
        lang: currentMemory.language,
        difficulty: nextAction.level,
        question_text: questionText,
        answer_value: String(nextQuestion.answer ?? ""),
        answer_format: nextQuestion.format || "numeric",
        template_or_source: (rawQ.provenance?.type === "textbook" || nextQuestion.sourceStyle) ? "hybrid" : "gemini",
        fingerprint,
        embedding,
        times_served: 1,
        times_correct: 0,
        flagged: false,
      });

      if (!saveRes.saved) {
        if (saveRes.reason === "database_error") {
          console.error(`[QuestionStore] FAILED(${saveRes.error || "database_error"}) id=${baseId} class=${questionClass}`);
        }
      }
    } catch (saveErr) {
      const errMessage = saveErr instanceof Error ? saveErr.message : String(saveErr);
      const questionClass = nextQuestion.meta?.class || currentMemory.grade;
      console.error(`[QuestionStore] FAILED(${errMessage}) id=${baseId} class=${questionClass}`);
    }

    currentMemory.askedQuestionIds = Array.from(askedIds);
    currentMemory.askedQuestionTexts = Array.from(askedTexts);
    currentMemory.seenSignatures = Array.from(askedIds);
    currentMemory.usedFormats = [...usedFormats, nextQuestion.format];
    currentMemory.stepCount = currentStep + 1;

    return NextResponse.json({
      memory: currentMemory,
      isFinished: false,
      nextQuestion,
      action: nextAction,
      decision: {
        action: nextAction.type,
        topicId: nextAction.topicId,
        level: nextAction.level,
        conceptId: nextAction.conceptId,
        sourceStyle: nextQuestion.sourceStyle || targetSourceStyle,
      },
      sources: ragSources,
    });
  } catch (error) {
    console.error("[AgentRoute] Assessment error (sanitized, zero student data):", error instanceof Error ? error.message : "Internal error");
    return NextResponse.json(
      { error: "Internal server error while evaluating assessment step." },
      { status: 500 }
    );
  }
}
