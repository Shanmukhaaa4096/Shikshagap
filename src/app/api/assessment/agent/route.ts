import { NextRequest, NextResponse } from "next/server";
import { generateQuestion, generateUnique } from "@/lib/questions/generator";
import { enhanceQuestionWithHybridWording } from "@/lib/questions/hybridGenerator";
import { validateQuestionIntegrity } from "@/lib/questions/integrity";
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
  SessionMemory,
} from "@/lib/types";

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
    grade: z.union([z.literal(3), z.literal(4), z.literal(5)]),
    language: z.enum(["en", "hi", "te"]),
    currentTopicIndex: z.number().int().min(0),
    topics: z.array(z.any()).min(1),
    seenSignatures: z.array(z.string()).optional(),
    usedFormats: z.array(z.string()).optional(),
    sessionSeed: z.number().int().optional(),
    stepCount: z.number().int().optional(),
  }),
  lastAttempt: z
    .object({
      conceptId: z.string(),
      level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      questionId: z.string(),
      studentAnswer: z.string(),
      correct: z.boolean(),
      errorType: z.string().optional(),
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

    // Explicit validation check: Allowed grades whitelist [3, 4, 5]
    if (memory.grade && ![3, 4, 5].includes(memory.grade)) {
      return NextResponse.json(
        { error: "Invalid grade. Only grades 3, 4, and 5 are currently enabled." },
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

    // 4. Generate unique question with Step 12 format diversification:
    // Never use same format twice in a row, and diversify across assessment
    const seen = new Set<string>(currentMemory.seenSignatures || []);
    const usedFormats = currentMemory.usedFormats || [];
    const lastFormat = usedFormats.length > 0 ? usedFormats[usedFormats.length - 1] : undefined;

    const baseQuestion = generateUnique(
      nextAction.conceptId,
      nextAction.level,
      rng,
      seen,
      currentMemory.grade,
      {},
      { avoidFormat: lastFormat }
    );

    // 5. Enhance wording with Gemini hybrid generator (validated against operands, script, and safety)
    let nextQuestion = await enhanceQuestionWithHybridWording(
      baseQuestion,
      currentMemory.language,
      currentMemory.grade,
      seen,
      { ip }
    );

    // Strict mathematical validation boundary before returning to student
    let integrity = validateQuestionIntegrity(nextQuestion);
    if (!integrity.valid) {
      console.warn(`[AgentRoute] Integrity validation failed: ${integrity.reason}. Falling back to base question.`);
      nextQuestion = baseQuestion;
      integrity = validateQuestionIntegrity(nextQuestion);
      if (!integrity.valid) {
        nextQuestion = generateQuestion(nextAction.conceptId, nextAction.level, rng, currentMemory.grade);
      }
    }

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
