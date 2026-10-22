import { NextRequest, NextResponse } from "next/server";
import { generateUnique } from "@/lib/questions/generator";
import { enhanceQuestionWithHybridWording } from "@/lib/questions/hybridGenerator";
import { getVerifiedTextbookQuestion } from "@/lib/questions/textbookBank";
import { validateQuestionStrict } from "@/lib/questions/validator";
import { makeRng } from "@/lib/rng";
import {
  getNextStaircaseAction,
  applyAttemptToMemory,
  advanceToNextTopic,
  normalizeQuestionText,
  getQuestionText,
  type StaircaseAction,
} from "@/lib/agents/staircase";
import { runExaminerStep } from "@/lib/agents/examiner";
import { analyzeErrors } from "@/lib/agents/errorAnalyst";
import type {
  Attempt,
  Question,
  SessionMemory,
} from "@/lib/types";

import { getMultiBoardQuestion } from "@/lib/questions/multiBoardBank";
import { syncQuestionProvenance } from "@/lib/questions/provenance";
import { getCurriculumConcept } from "@/data/curriculum";
import { rotateSourceStyle, type SourceStyle, type DifficultyLevel } from "@/lib/agents/adaptiveEngine";
import { z } from "zod";
import { guardRequest, createGuardResponse } from "@/lib/server/guard";
import { getClientIp } from "@/lib/server/security";
import { retrieve } from "@/lib/rag/retrieve.ts";

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
      const advanced = applyAttemptToMemory(currentMemory, {
        conceptId: "number_sense",
        level: 2,
        questionId: "dummy",
        studentAnswer: "",
        correct: true,
      });
      currentMemory = advanced.memory;
      nextAction = advanced.action;
    }

    if (nextAction.type !== "ask") {
      return NextResponse.json({
        memory: currentMemory,
        isFinished: true,
        nextQuestion: null,
        action: nextAction,
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

      // 5. Fallback: generate and enhance with Gemini hybrid generator
      if (!nextQuestion) {
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
          if (lookupClass <= 4) {
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
      return NextResponse.json({
        memory: currentMemory,
        isFinished: true,
        nextQuestion: null,
        action: nextAction,
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
