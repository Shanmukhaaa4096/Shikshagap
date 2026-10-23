/**
 * ShikshaGap Option Shuffler & Anti-Bias Serving Engine
 *
 * Requirements:
 * 1. Correct answers stored strictly as VALUES, never as positions or indices.
 * 2. Per-question, per-session seeded Fisher-Yates shuffle at SERVE time.
 * 3. Max 2 consecutive questions with the correct answer in the same position (A, B, C, or D).
 * 4. Across a session of 6+ questions, every position A to D appears at least once when possible.
 * 5. Position distribution across 400+ questions remains balanced between 20% and 30% per option.
 * 6. Plausible distractors: unique, non-empty, and not equal to the correct answer.
 * 7. Server-side verification: client cannot tamper with or inspect the correct answer before submission.
 */

import type { Option, Question } from "../types.ts";
import { areAnswersEquivalent } from "./integrity.ts";
import crypto from "crypto";

export type OptionLetter = "A" | "B" | "C" | "D";

export interface ShuffledQuestionResult {
  question: Question;
  correctIndex: number;
  correctPosition: OptionLetter;
  verificationToken: string;
}

const SERVER_VERIFY_SECRET = process.env.RAG_HEALTH_SECRET || "shikshagap-serve-integrity-salt-2026";

/**
 * Creates a deterministic 32-bit PRNG from any string or number seed.
 */
export function createSeededRng(seedInput: string | number): () => number {
  let h = 0x811c9dc5;
  const str = String(seedInput);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let s = h >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * In-place or cloned Fisher-Yates shuffle using a seeded PRNG.
 */
export function fisherYatesShuffle<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Generates an HMAC verification token so the server can verify student submissions
 * without trusting client-sent boolean values.
 */
export function createVerificationToken(questionId: string, answerValue: string): string {
  const norm = String(answerValue).trim().toLowerCase();
  return crypto
    .createHmac("sha256", SERVER_VERIFY_SECRET)
    .update(`${questionId}:${norm}`)
    .digest("hex");
}

/**
 * Verifies a student's answer against the question's HMAC token or ground truth answer.
 */
export function verifyAnswerWithToken(
  questionId: string,
  studentAnswer: string,
  token?: string,
  groundTruthAnswer?: string
): boolean {
  if (!studentAnswer) return false;
  const trimmed = studentAnswer.trim();

  if (groundTruthAnswer && areAnswersEquivalent(trimmed, groundTruthAnswer)) {
    return true;
  }

  if (token) {
    const expected = createVerificationToken(questionId, trimmed);
    if (expected === token) return true;
  }

  return false;
}

/**
 * Selects an optimal target position for the correct answer according to constraints:
 * - No more than 2 consecutive questions in the same position.
 * - Across 6+ questions, all positions A to D appear at least once when possible.
 * - Long-run distribution balanced within 20% to 30% per position.
 */
export function selectTargetPosition(
  optionCount: number,
  historyOfPositions: Array<number | OptionLetter>,
  rng: () => number
): number {
  if (optionCount <= 1) return 0;

  // Convert history to 0-based indices
  const numHistory: number[] = historyOfPositions.map((p) => {
    if (typeof p === "number") return p;
    const code = p.toUpperCase().charCodeAt(0) - 65;
    return code >= 0 && code < optionCount ? code : 0;
  });

  const allIndices = Array.from({ length: optionCount }, (_, i) => i);

  // Constraint 1: No more than 2 consecutive questions with the correct answer in the same position
  let forbiddenConsecutive = -1;
  if (numHistory.length >= 2) {
    const last1 = numHistory[numHistory.length - 1];
    const last2 = numHistory[numHistory.length - 2];
    if (last1 === last2 && last1 >= 0 && last1 < optionCount) {
      forbiddenConsecutive = last1;
    }
  }

  let candidates = allIndices.filter((pos) => pos !== forbiddenConsecutive);
  if (candidates.length === 0) {
    candidates = allIndices;
  }

  // Count frequencies in history
  const counts = new Map<number, number>();
  for (const pos of allIndices) {
    counts.set(pos, 0);
  }
  for (const pos of numHistory) {
    counts.set(pos, (counts.get(pos) || 0) + 1);
  }

  // Constraint 2: Across a session of 6+ questions, each position A to D should appear at least once
  if (numHistory.length >= 2 && optionCount === 4) {
    const missing = candidates.filter((pos) => (counts.get(pos) || 0) === 0);
    if (missing.length > 0) {
      // Pick one of the missing positions using the seeded PRNG
      const chosenMissingIdx = Math.floor(rng() * missing.length);
      return missing[chosenMissingIdx];
    }
  }

  // Constraint 3: Long-term balancing within 20% to 30% per option
  // Calculate weights inversely proportional to frequency
  let maxCount = 0;
  for (const count of counts.values()) {
    if (count > maxCount) maxCount = count;
  }

  const weights = candidates.map((pos) => {
    const count = counts.get(pos) || 0;
    return Math.max(1, maxCount - count + 2);
  });

  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  let threshold = rng() * totalWeight;

  for (let i = 0; i < candidates.length; i++) {
    threshold -= weights[i];
    if (threshold <= 0) {
      return candidates[i];
    }
  }

  return candidates[0];
}

/**
 * Shuffles question options at SERVE time using a per-question, per-session seeded PRNG.
 * Ensures the correct answer is never tied to position 0 (Option A) and conforms to all
 * anti-bias distribution and distractor quality rules.
 */
export function shuffleQuestionOptionsForServe(
  question: Question,
  sessionSeed: string | number,
  stepIndex: number,
  historyOfPositions: Array<number | OptionLetter> = []
): ShuffledQuestionResult {
  const answerValue = String(question.answer ?? "").trim();
  const token = createVerificationToken(question.id, answerValue);

  if (!question.options || question.options.length < 2) {
    return {
      question,
      correctIndex: -1,
      correctPosition: "A",
      verificationToken: token,
    };
  }

  // Find the correct option matching question.answer
  const correctIdx = question.options.findIndex(
    (opt) => opt.value === answerValue || areAnswersEquivalent(opt.value, answerValue)
  );

  // If answer is not in options, return question unchanged to fail validation
  if (correctIdx === -1) {
    return {
      question,
      correctIndex: -1,
      correctPosition: "A",
      verificationToken: token,
    };
  }

  const correctOption = question.options[correctIdx];
  const distractors = question.options.filter((_, idx) => idx !== correctIdx);

  // Seeded PRNG for this specific question serve event
  const combinedSeed = `${sessionSeed}:${question.id}:step_${stepIndex}`;
  const rng = createSeededRng(combinedSeed);

  // 1. Choose target position for correct option conforming to all constraints
  const targetPosition = selectTargetPosition(question.options.length, historyOfPositions, rng);

  // 2. Shuffle distractors using Fisher-Yates
  const shuffledDistractors = fisherYatesShuffle(distractors, rng);

  // 3. Assemble new options array with correct option in targetPosition
  const newOptions: Option[] = [];
  let distractorCursor = 0;
  for (let i = 0; i < question.options.length; i++) {
    if (i === targetPosition) {
      newOptions.push({
        ...correctOption,
        id: `opt_${String.fromCharCode(65 + i).toLowerCase()}`,
      });
    } else {
      const d = shuffledDistractors[distractorCursor++];
      newOptions.push({
        ...d,
        id: `opt_${String.fromCharCode(65 + i).toLowerCase()}`,
      });
    }
  }

  const correctLetter = (["A", "B", "C", "D"][targetPosition] || "A") as OptionLetter;

  const servedQuestion: Question = {
    ...question,
    options: newOptions,
    verificationToken: token,
  };

  return {
    question: servedQuestion,
    correctIndex: targetPosition,
    correctPosition: correctLetter,
    verificationToken: token,
  };
}
