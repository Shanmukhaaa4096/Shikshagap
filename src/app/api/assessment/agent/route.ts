import { NextRequest, NextResponse } from "next/server";
import { generateQuestion, generateUnique } from "@/lib/questions/generator";
import { enhanceQuestionWithHybridWording } from "@/lib/questions/hybridGenerator";
import { getVerifiedTextbookQuestion } from "@/lib/questions/textbookBank";
import { validateQuestionStrict } from "@/lib/questions/validator";
import { makeRng } from "@/lib/rng";
import {
  getNextStaircaseAction,
  applyAttemptToMemory,
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
import { rotateSourceStyle, type SourceStyle, type DifficultyLevel } from "@/lib/agents/adaptiveEngine";
import { z } from "zod";
import { guardRequest, createGuardResponse } from "@/lib/server/guard";
import { getClientIp } from "@/lib/server/security";

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
    sessionSeed: z.number().int().optional(),
    stepCount: z.number().int().optional(),
    boardPreference: z.enum(["CBSE", "ICSE", "BOTH"]).optional(),
  }),
  lastAttempt: z
    .object({
      conceptId: z.string(),
      level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
      questionId: z.string(),
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
    const seen = new Set<string>(currentMemory.seenSignatures || []);
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

    // 4a. Primary: Retrieve matching multi-board question (NCERT, Exemplar, CBSE Ref, ICSE Selina/Foundation)
    const multiBoardCandidate = getMultiBoardQuestion(
      {
        class: currentMemory.grade,
        conceptId: nextAction.conceptId,
        difficulty: nextAction.level as DifficultyLevel,
        sourceStyle: targetSourceStyle,
        board: targetBoard,
        excludeIds: Array.from(seen),
      },
      currentMemory.language
    );

    if (multiBoardCandidate) {
      const valResult = validateQuestionStrict(multiBoardCandidate, {
        targetLang: currentMemory.language,
        requireTextbookProvenance: false,
      });
      if (valResult.valid) {
        nextQuestion = multiBoardCandidate;
      }
    }

    // 4b. Secondary: Retrieve verified textbook question from official NCERT question bank (CBSE only)
    if (!nextQuestion && targetBoard === "CBSE") {
      const textbookCandidate = getVerifiedTextbookQuestion(
        {
          class: currentMemory.grade,
          conceptId: nextAction.conceptId,
          difficulty: nextAction.level,
          language: currentMemory.language,
          excludeIds: Array.from(seen),
          onlyVerified: true,
        },
        currentMemory.language
      );

      if (textbookCandidate) {
        const valResult = validateQuestionStrict(textbookCandidate, {
          targetLang: currentMemory.language,
          requireTextbookProvenance: true,
        });
        if (valResult.valid) {
          nextQuestion = {
            ...textbookCandidate,
            sourceStyle: targetSourceStyle,
            board: "CBSE",
          };
        }
      }
    }

    // 5. Fallback: generate and enhance with Gemini hybrid generator in the requested sourceStyle & board
    if (!nextQuestion) {
      const baseQuestion = generateUnique(
        nextAction.conceptId,
        nextAction.level,
        rng,
        seen,
        currentMemory.grade,
        {},
        { avoidFormat: lastFormat }
      );
      baseQuestion.board = targetBoard;

      // Enhance wording with Gemini hybrid generator (validated against operands, script, and safety)
      let enhanced = await enhanceQuestionWithHybridWording(
        baseQuestion,
        currentMemory.language,
        currentMemory.grade,
        seen,
        { ip, sourceStyle: targetSourceStyle }
      );
      enhanced.board = targetBoard;

      // Strict question validation
      let strictCheck = validateQuestionStrict(enhanced, {
        targetLang: currentMemory.language,
        requireTextbookProvenance: false,
      });

      if (!strictCheck.valid) {
        console.warn(`[AgentRoute] Enhanced question failed validation: ${strictCheck.errors.join(", ")}. Falling back to base.`);
        enhanced = baseQuestion;
        enhanced.board = targetBoard;
        strictCheck = validateQuestionStrict(enhanced, {
          targetLang: currentMemory.language,
          requireTextbookProvenance: false,
        });
        if (!strictCheck.valid) {
          enhanced = generateQuestion(nextAction.conceptId, nextAction.level, rng, currentMemory.grade);
          enhanced.board = targetBoard;
        }
      }

      nextQuestion = {
        ...enhanced,
        sourceStyle: targetSourceStyle,
        board: targetBoard,
      };
    }

    // Final strict validation check before returning to student
    const finalCheck = validateQuestionStrict(nextQuestion, {
      targetLang: currentMemory.language,
      requireTextbookProvenance: false,
    });

    if (!finalCheck.valid) {
      console.error(`[AgentRoute] CRITICAL: Question failed final validation:`, finalCheck.errors);
      if (targetBoard === "ICSE") {
        const emergencyICSE = getMultiBoardQuestion(
          {
            class: currentMemory.grade,
            board: "ICSE",
            excludeIds: Array.from(seen),
          },
          currentMemory.language
        );
        if (emergencyICSE) {
          nextQuestion = emergencyICSE;
        }
      } else {
        const emergencyQ = getVerifiedTextbookQuestion(
          {
            class: currentMemory.grade,
            language: currentMemory.language,
            excludeIds: Array.from(seen),
            onlyVerified: true,
          },
          currentMemory.language
        );
        if (emergencyQ) {
          nextQuestion = {
            ...emergencyQ,
            sourceStyle: targetSourceStyle,
            board: "CBSE",
          };
        }
      }
    }

    // Server-Side Strict Board Isolation Guard
    if (targetBoard === "ICSE" && nextQuestion.board !== "ICSE") {
      const emergencyICSE = getMultiBoardQuestion(
        {
          class: currentMemory.grade,
          board: "ICSE",
        },
        currentMemory.language
      );
      if (emergencyICSE) {
        nextQuestion = emergencyICSE;
      } else {
        nextQuestion.board = "ICSE";
      }
    } else if (targetBoard === "CBSE" && nextQuestion.board !== "CBSE") {
      const emergencyCBSE = getMultiBoardQuestion(
        {
          class: currentMemory.grade,
          board: "CBSE",
        },
        currentMemory.language
      );
      if (emergencyCBSE) {
        nextQuestion = emergencyCBSE;
      } else {
        nextQuestion.board = "CBSE";
      }
    }

    if (nextQuestion) {
      nextQuestion.sourceStyle = nextQuestion.sourceStyle || targetSourceStyle;
    }

    seen.add(nextQuestion.id);
    currentMemory.seenSignatures = Array.from(seen);
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
    });
  } catch (error) {
    console.error("[AgentRoute] Assessment error (sanitized, zero student data):", error instanceof Error ? error.message : "Internal error");
    return NextResponse.json(
      { error: "Internal server error while evaluating assessment step." },
      { status: 500 }
    );
  }
}
