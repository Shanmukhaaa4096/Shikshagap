import { NextRequest, NextResponse } from "next/server";
import { generateUnique } from "@/lib/questions/generator";
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

// In-memory rate limiting for AI assessment agent endpoint (max 40 requests/min per IP)
const agentRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkAgentRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = agentRateLimits.get(ip);
  if (!record || now > record.resetAt) {
    agentRateLimits.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }
  if (record.count >= 40) {
    return false;
  }
  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    if (!checkAgentRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

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

    const rng = makeRng(Date.now());

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

    // 4. Generate unique question (never written by LLM; generated purely by code)
    const seen = new Set<string>(currentMemory.seenSignatures || []);
    const nextQuestion = generateUnique(
      nextAction.conceptId,
      nextAction.level,
      rng,
      seen
    );
    currentMemory.seenSignatures = Array.from(seen);

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
    console.error("Agent assessment error:", error);
    return NextResponse.json(
      { error: "Internal server error while evaluating assessment step." },
      { status: 500 }
    );
  }
}
