/**
 * ShikshaGap Examiner Agent
 *
 * Implements Gemini function calling per SPEC.md with tools:
 * - ask_question(conceptId, level)
 * - update_memory(note)
 * - next_topic()
 * - finish()
 *
 * Every tool call passes through the code gate (staircase.ts) and is rejected if illegal.
 * Question text and correct answers come only from generateQuestion; the LLM never writes math.
 * If GEMINI_API_KEY is missing or any call fails, falls back to the staircase's own legal action.
 * Sends only the pseudonymous ID, never real student names.
 */

import {
  GoogleGenAI,
  Type,
} from "@google/genai";
import type { FunctionDeclaration } from "@google/genai";
import {
  getNextStaircaseAction,
  isActionLegal,
  type StaircaseAction,
} from "./staircase.ts";
import type {
  Attempt,
  ConceptId,
  SessionMemory,
} from "../types";

export const EXAMINER_TOOLS: FunctionDeclaration[] = [
  {
    name: "ask_question",
    description: "Ask a math question for a concept at a specific difficulty level.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        conceptId: {
          type: Type.STRING,
          description: "Concept identifier to assess",
        },
        level: {
          type: Type.NUMBER,
          description: "Difficulty level (1: easy, 2: medium, 3: hard)",
        },
      },
      required: ["conceptId", "level"],
    },
  },
  {
    name: "update_memory",
    description: "Record a short observational note about the student's mathematical understanding.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        note: {
          type: Type.STRING,
          description: "A short, objective observation note (e.g., 'Student computes column addition fluently')",
        },
      },
      required: ["note"],
    },
  },
  {
    name: "next_topic",
    description: "Close the current topic assessment and proceed to the next topic.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        reason: {
          type: Type.STRING,
          description: "Reason for closing the topic",
        },
      },
    },
  },
  {
    name: "finish",
    description: "Conclude the full multi-topic assessment once all topics have closed.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        reason: {
          type: Type.STRING,
          description: "Reason for finishing",
        },
      },
    },
  },
];

export interface ExaminerStepResult {
  action: StaircaseAction;
  notes: string[];
  usedFallback: boolean;
  rejectedIllegalCall?: boolean;
}

export async function runExaminerStep(
  memory: SessionMemory,
  lastAttempt?: Attempt,
  options?: { apiKey?: string; client?: unknown }
): Promise<ExaminerStepResult> {
  const legalAction = getNextStaircaseAction(memory, lastAttempt);

  const effectiveApiKey = options?.apiKey || process.env.GEMINI_API_KEY;
  const client = options?.client;

  // If no Gemini client or API key, fall back to pure staircase legal action
  if (!client && !effectiveApiKey) {
    return {
      action: legalAction,
      notes: [],
      usedFallback: true,
    };
  }

  const currentTopic = memory.topics[memory.currentTopicIndex];
  if (!currentTopic) {
    return { action: legalAction, notes: [], usedFallback: true };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai: any = client || new GoogleGenAI({ apiKey: effectiveApiKey });
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // Strictly pseudonymous ID - never names
    const pseudonymousId = memory.pseudonymousId || "anon_learner";

    const promptContext = {
      learnerPseudonym: pseudonymousId,
      grade: memory.grade,
      language: memory.language,
      currentTopicIndex: memory.currentTopicIndex,
      topicId: currentTopic.topicId,
      attemptsOnCurrentTopic: currentTopic.attempts.map((a) => ({
        concept: a.conceptId,
        level: a.level,
        correct: a.correct,
        errorType: a.errorType || "none",
      })),
      lastAttempt: lastAttempt
        ? {
            concept: lastAttempt.conceptId,
            level: lastAttempt.level,
            correct: lastAttempt.correct,
            errorType: lastAttempt.errorType || "none",
          }
        : null,
    };

    const systemInstruction = `You are the ShikshaGap AI Examiner administering a calm, adaptive Class ${memory.grade} Mathematics learning check.
You must use function calling to select the next action.
Rules:
1. Every topic starts at Level 2.
2. If correct at 2 -> call ask_question at Level 3.
3. If wrong at 2 -> call ask_question at Level 1.
4. Each topic has at most 2 questions. After 2 questions on a topic, call next_topic().
5. When all curriculum topics are complete, call finish().
6. You can call update_memory(note) to record an observational note about the student's thinking.
Your actions are checked by a strict code gate; illegal actions will be rejected.`;

    const generatePromise = ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\nCurrent Assessment State:\n${JSON.stringify(promptContext)}` }],
        },
      ],
      config: {
        tools: [{ functionDeclarations: EXAMINER_TOOLS }],
        temperature: 0.1,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini examiner call timed out (6s)")), 6000)
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await Promise.race([generatePromise, timeoutPromise]);

    const calls = response.functionCalls || [];
    const notes: string[] = [];
    let proposedAction: StaircaseAction | null = null;

    for (const call of calls) {
      if (call.name === "update_memory" && call.args?.note) {
        const noteStr = String(call.args.note).trim();
        if (noteStr) notes.push(noteStr);
      } else if (call.name === "ask_question") {
        const levelNum = Number(call.args?.level) as 1 | 2 | 3;
        const conceptId = (call.args?.conceptId ||
          (legalAction.type === "ask" ? legalAction.conceptId : "number_sense")) as ConceptId;
        proposedAction = {
          type: "ask",
          topicId: currentTopic.topicId,
          conceptId,
          level: levelNum,
        };
      } else if (call.name === "next_topic") {
        proposedAction = {
          type: "close_topic",
          topicId: currentTopic.topicId,
          status: legalAction.type === "close_topic" ? legalAction.status : "developing",
        };
      } else if (call.name === "finish") {
        proposedAction = {
          type: "finish",
        };
      }
    }

    // Code Gate verification
    if (proposedAction) {
      if (isActionLegal(memory, proposedAction, lastAttempt)) {
        return {
          action: proposedAction,
          notes,
          usedFallback: false,
          rejectedIllegalCall: false,
        };
      } else {
        // Reject illegal tool call and fall back to staircase ground truth
        return {
          action: legalAction,
          notes,
          usedFallback: true,
          rejectedIllegalCall: true,
        };
      }
    }

    // No action tool was called; fall back to staircase ground truth
    return {
      action: legalAction,
      notes,
      usedFallback: true,
      rejectedIllegalCall: false,
    };
  } catch {
    // LLM call failure fallback
    return {
      action: legalAction,
      notes: [],
      usedFallback: true,
    };
  }
}
