/**
 * ShikshaGap Adaptive Difficulty Engine & Source Style Rotation
 *
 * Implements the 5-level adaptive difficulty engine and multi-board source
 * rotation per the pedagogical specification:
 *
 * Difficulty levels:
 * - L1 Recall: definitions, direct facts, one-step questions
 * - L2 Understanding: explain in own words, simple examples, basic numericals (START)
 * - L3 Application: multi-step problems, real-life scenarios
 * - L4 Analysis: compare, reason, "why/what if", data or diagram interpretation
 * - L5 Challenge: HOTS, Olympiad-style, combining multiple concepts
 *
 * Adaptation rules:
 * - Start at L2.
 * - Correct: +1 level for next question.
 *   Two correct in a row: jump 1 level (e.g., L2 -> L4, or L3 -> L5) and advance concept.
 * - Partially correct: stay at the same level, ask similar question targeting missing part.
 * - Wrong / "I don't know" / Skipped: -1 level for next question, first give short hint.
 * - Two wrong in a row: -2 levels and backtrack to prerequisite concept via DAG.
 * - Never drop below L1. If stuck at L1 and wrong: switch to teaching mode, give simple explanation,
 *   and ask a confidence-builder question.
 * - Never exceed L5. If 2 correct at L5 in a row: topic mastered!
 * - Never repeat a question in the same session.
 *
 * Stopping rules per topic:
 * - Minimum 2 questions per topic.
 * - Maximum 6 questions per topic.
 * - Stop early if: 2 correct at top level (L5, mastered) OR 2 wrong at L1 with no improvement (needs teacher intervention).
 */

import type { ConceptId, ErrorType, TopicId } from "../types.ts";
import { getPrerequisiteForConcept } from "./staircase.ts";

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type SourceStyle =
  | "ncert"
  | "exemplar"
  | "cbse_reference"
  | "icse_selina"
  | "icse_foundation";

export type BoardPreference = "CBSE" | "ICSE" | "BOTH";

export type StudentResponseKind =
  | "correct"
  | "partially_correct"
  | "wrong"
  | "dont_know"
  | "skipped";

export interface AdaptiveTopicState {
  topicId: TopicId;
  conceptId: ConceptId;
  currentLevel: DifficultyLevel;
  correctStreak: number;
  wrongStreak: number;
  questionCount: number;
  askedQuestionIds: string[];
  difficultyPath: DifficultyLevel[];
  sourceStyleHistory: SourceStyle[];
  isTeachingMode: boolean;
  consecutiveL1Wrongs: number;
  highestLevelReached: DifficultyLevel;
  status: "pending" | "mastered" | "developing" | "gap" | "needs_teacher_support";
}

export interface StudentAttemptInput {
  questionId: string;
  conceptId: ConceptId;
  level: DifficultyLevel;
  responseKind: StudentResponseKind;
  sourceStyle?: SourceStyle;
  errorType?: ErrorType;
  missingPart?: string;
}

export type AdaptiveAction =
  | {
      type: "ask";
      topicId: TopicId;
      conceptId: ConceptId;
      level: DifficultyLevel;
      sourceStyle: SourceStyle;
      isTeachingMode: boolean;
      teachingExplanationKey?: string;
      hintKey?: string;
      missingPartTarget?: string;
      reason: string;
    }
  | {
      type: "close_topic";
      topicId: TopicId;
      status: "mastered" | "developing" | "gap" | "needs_teacher_support";
      highestLevelReached: DifficultyLevel;
      difficultyPath: DifficultyLevel[];
      reason: string;
    }
  | {
      type: "finish";
      reason: string;
    };

export interface AdaptiveStepResult {
  nextState: AdaptiveTopicState;
  action: AdaptiveAction;
}

export const DIFFICULTY_DESCRIPTIONS: Record<
  DifficultyLevel,
  { name: string; tag: string; description: string }
> = {
  1: {
    name: "L1 Recall",
    tag: "recall",
    description: "Definitions, direct facts, and one-step basic operations.",
  },
  2: {
    name: "L2 Understanding",
    tag: "understanding",
    description: "Explain in own words, simple examples, and basic numericals.",
  },
  3: {
    name: "L3 Application",
    tag: "application",
    description: "Multi-step problems and real-life everyday scenarios.",
  },
  4: {
    name: "L4 Analysis",
    tag: "analysis",
    description: "Compare, reason, why/what-if questions, and data/diagram interpretation.",
  },
  5: {
    name: "L5 Challenge",
    tag: "challenge",
    description: "HOTS, Olympiad-style, combining multiple foundational concepts.",
  },
};

export const SOURCE_STYLE_METADATA: Record<
  SourceStyle,
  { label: string; board: "CBSE" | "ICSE"; bookFamily: string; description: string }
> = {
  ncert: {
    label: "NCERT Math-Magic",
    board: "CBSE",
    bookFamily: "NCERT Official",
    description: "Everyday Indian context, story-based, conceptual clarity.",
  },
  exemplar: {
    label: "NCERT Exemplar",
    board: "CBSE",
    bookFamily: "NCERT Exemplar",
    description: "In-depth analytical problems, reasoning, and conceptual depth.",
  },
  cbse_reference: {
    label: "CBSE Reference (R.D. Sharma / R.S. Aggarwal)",
    board: "CBSE",
    bookFamily: "CBSE Standard Reference",
    description: "Procedural fluency, graded problem variations, multi-digit drill.",
  },
  icse_selina: {
    label: "ICSE Selina / Concise Mathematics",
    board: "ICSE",
    bookFamily: "Concise / Selina",
    description: "Formal mathematical language, mandatory units, step-by-step reasoning.",
  },
  icse_foundation: {
    label: "ICSE Foundation (Frank / ML Aggarwal)",
    board: "ICSE",
    bookFamily: "ML Aggarwal / Frank",
    description: "Strong structural foundations, word problems with units and comparisons.",
  },
};

/**
 * Creates a clean initial adaptive state for a topic.
 * Always starts at L2 (Understanding).
 */
export function createInitialAdaptiveTopicState(
  topicId: TopicId,
  conceptId: ConceptId
): AdaptiveTopicState {
  return {
    topicId,
    conceptId,
    currentLevel: 2,
    correctStreak: 0,
    wrongStreak: 0,
    questionCount: 0,
    askedQuestionIds: [],
    difficultyPath: [],
    sourceStyleHistory: [],
    isTeachingMode: false,
    consecutiveL1Wrongs: 0,
    highestLevelReached: 2,
    status: "pending",
  };
}

/**
 * Source style rotation logic.
 *
 * Rules:
 * 1. Never two questions in a row from the same source style.
 * 2. In any 5 questions, include at least 2 distinct source styles.
 * 3. Board weighting:
 *    - CBSE: 70% CBSE/NCERT sources, 30% ICSE sources.
 *    - ICSE: 70% ICSE sources, 30% CBSE/NCERT sources.
 *    - BOTH: balanced rotation between CBSE and ICSE.
 */
export function rotateSourceStyle(
  history: SourceStyle[],
  boardPreference: BoardPreference = "BOTH",
  pseudoRandomSeed = 0.5
): SourceStyle {
  const cbseStyles: SourceStyle[] = ["ncert", "exemplar", "cbse_reference"];
  const icseStyles: SourceStyle[] = ["icse_selina", "icse_foundation"];
  const allStyles: SourceStyle[] = [...cbseStyles, ...icseStyles];

  const lastStyle = history.length > 0 ? history[history.length - 1] : undefined;
  const recentWindow = history.slice(-4); // Last 4 + new 1 = 5 question window

  // Determine target board category for this turn
  let preferBoard: "CBSE" | "ICSE";
  if (boardPreference === "CBSE") {
    // 70% CBSE, 30% ICSE
    preferBoard = pseudoRandomSeed < 0.7 ? "CBSE" : "ICSE";
  } else if (boardPreference === "ICSE") {
    // 70% ICSE, 30% CBSE
    preferBoard = pseudoRandomSeed < 0.7 ? "ICSE" : "CBSE";
  } else {
    // BOTH: alternate boards if possible
    if (lastStyle && cbseStyles.includes(lastStyle)) {
      preferBoard = "ICSE";
    } else if (lastStyle && icseStyles.includes(lastStyle)) {
      preferBoard = "CBSE";
    } else {
      preferBoard = pseudoRandomSeed < 0.5 ? "CBSE" : "ICSE";
    }
  }

  // Filter candidates matching preferred board, excluding lastStyle
  let candidates = (preferBoard === "CBSE" ? cbseStyles : icseStyles).filter(
    (s) => s !== lastStyle
  );

  // If none available in preferred board, pick from alternative board (excluding lastStyle)
  if (candidates.length === 0) {
    candidates = allStyles.filter((s) => s !== lastStyle);
  }

  // Enforce rule: in any 5 questions, at least 2 different styles
  // If recent window has only 1 unique style, strictly pick a different style
  const uniqueInWindow = new Set(recentWindow).size;
  if (recentWindow.length >= 4 && uniqueInWindow === 1) {
    const forcedDifferent = candidates.filter((s) => !recentWindow.includes(s));
    if (forcedDifferent.length > 0) {
      candidates = forcedDifferent;
    }
  }

  // Deterministic pick based on seed and history length
  const pickIndex = Math.floor(Math.abs(pseudoRandomSeed * 1000 + history.length)) % candidates.length;
  return candidates[pickIndex] || (lastStyle === "ncert" ? "icse_selina" : "ncert");
}

/**
 * Pure function: Given current AdaptiveTopicState and the student's latest attempt,
 * computes the next adaptive state and the next action.
 */
export function computeNextAdaptiveStep(
  state: AdaptiveTopicState,
  attempt: StudentAttemptInput,
  boardPreference: BoardPreference = "BOTH"
): AdaptiveStepResult {
  const newQuestionCount = state.questionCount + 1;
  const newAskedIds = [...state.askedQuestionIds, attempt.questionId];
  const newDiffPath = [...state.difficultyPath, attempt.level];
  const newSourceHistory = attempt.sourceStyle
    ? [...state.sourceStyleHistory, attempt.sourceStyle]
    : state.sourceStyleHistory;
  const newHighestLevel = Math.max(state.highestLevelReached, attempt.level) as DifficultyLevel;

  const isCorrect = attempt.responseKind === "correct";
  const isPartial = attempt.responseKind === "partially_correct";
  const isWrongOrIdk =
    attempt.responseKind === "wrong" ||
    attempt.responseKind === "dont_know" ||
    attempt.responseKind === "skipped";

  // 1. Evaluate performance streaks & flags
  let newCorrectStreak = state.correctStreak;
  let newWrongStreak = state.wrongStreak;
  let newConsecutiveL1Wrongs = state.consecutiveL1Wrongs;
  let newIsTeachingMode = state.isTeachingMode;

  if (isCorrect) {
    newCorrectStreak = state.correctStreak + 1;
    newWrongStreak = 0;
    newConsecutiveL1Wrongs = 0;
    newIsTeachingMode = false;
  } else if (isPartial) {
    newCorrectStreak = 0;
    newWrongStreak = 0;
    // Keep consecutiveL1Wrongs as is
  } else if (isWrongOrIdk) {
    newWrongStreak = state.wrongStreak + 1;
    newCorrectStreak = 0;
    if (attempt.level === 1) {
      newConsecutiveL1Wrongs += 1;
    } else {
      newConsecutiveL1Wrongs = 0;
    }
  }

  // 2. Check Early Stopping Rules (Must have at least MIN_QUESTIONS = 2)
  // Early Stopping Rule A: 2 correct at top level (L5) -> Topic Mastered!
  if (newQuestionCount >= 2 && attempt.level === 5 && newCorrectStreak >= 2) {
    const finalState: AdaptiveTopicState = {
      ...state,
      questionCount: newQuestionCount,
      askedQuestionIds: newAskedIds,
      difficultyPath: newDiffPath,
      sourceStyleHistory: newSourceHistory,
      highestLevelReached: newHighestLevel,
      correctStreak: newCorrectStreak,
      wrongStreak: newWrongStreak,
      consecutiveL1Wrongs: newConsecutiveL1Wrongs,
      isTeachingMode: false,
      status: "mastered",
    };
    return {
      nextState: finalState,
      action: {
        type: "close_topic",
        topicId: state.topicId,
        status: "mastered",
        highestLevelReached: 5,
        difficultyPath: newDiffPath,
        reason: "Demonstrated consistent mastery at highest challenge level (L5).",
      },
    };
  }

  // Early Stopping Rule B: 2 wrong at L1 with no improvement -> Flag for teacher support!
  if (newQuestionCount >= 2 && attempt.level === 1 && newConsecutiveL1Wrongs >= 2) {
    const finalState: AdaptiveTopicState = {
      ...state,
      questionCount: newQuestionCount,
      askedQuestionIds: newAskedIds,
      difficultyPath: newDiffPath,
      sourceStyleHistory: newSourceHistory,
      highestLevelReached: newHighestLevel,
      correctStreak: newCorrectStreak,
      wrongStreak: newWrongStreak,
      consecutiveL1Wrongs: newConsecutiveL1Wrongs,
      isTeachingMode: true,
      status: "needs_teacher_support",
    };
    return {
      nextState: finalState,
      action: {
        type: "close_topic",
        topicId: state.topicId,
        status: "needs_teacher_support",
        highestLevelReached: newHighestLevel,
        difficultyPath: newDiffPath,
        reason: "Struggling at foundational level L1; flagged for teacher intervention.",
      },
    };
  }

  // 3. Maximum question budget stopping rule (MAX_QUESTIONS = 6)
  if (newQuestionCount >= 6) {
    let finalStatus: "mastered" | "developing" | "gap" | "needs_teacher_support" = "developing";
    if (newHighestLevel >= 4 && isCorrect) {
      finalStatus = "mastered";
    } else if (attempt.level === 1 && newWrongStreak >= 1) {
      finalStatus = "gap";
    } else {
      finalStatus = "developing";
    }

    const finalState: AdaptiveTopicState = {
      ...state,
      questionCount: newQuestionCount,
      askedQuestionIds: newAskedIds,
      difficultyPath: newDiffPath,
      sourceStyleHistory: newSourceHistory,
      highestLevelReached: newHighestLevel,
      correctStreak: newCorrectStreak,
      wrongStreak: newWrongStreak,
      consecutiveL1Wrongs: newConsecutiveL1Wrongs,
      status: finalStatus,
    };

    return {
      nextState: finalState,
      action: {
        type: "close_topic",
        topicId: state.topicId,
        status: finalStatus,
        highestLevelReached: newHighestLevel,
        difficultyPath: newDiffPath,
        reason: `Reached maximum question budget of 6 items on this topic with status: ${finalStatus}.`,
      },
    };
  }

  // 4. Compute Next Level & Next Concept
  let nextLevel: DifficultyLevel = state.currentLevel;
  let nextConcept: ConceptId = state.conceptId;
  let teachingKey: string | undefined;
  let hintKey: string | undefined;
  let missingPartTarget: string | undefined;
  let reason = "";

  if (isCorrect) {
    // Correct answer:
    // Two correct in a row: jump one level (capped at 5)
    // One correct: increase difficulty by 1 level
    if (newCorrectStreak >= 2) {
      nextLevel = Math.min(5, attempt.level + 2) as DifficultyLevel;
      reason = `Two consecutive correct answers: accelerated jump to Level ${nextLevel}.`;
    } else {
      nextLevel = Math.min(5, attempt.level + 1) as DifficultyLevel;
      reason = `Correct answer at Level ${attempt.level}: stepping up to Level ${nextLevel}.`;
    }
  } else if (isPartial) {
    // Partially correct: stay at the same level, target the missing part
    nextLevel = attempt.level;
    missingPartTarget = attempt.missingPart || "procedural_step";
    reason = `Partially correct at Level ${attempt.level}: reinforcing target step with a parallel question.`;
  } else if (isWrongOrIdk) {
    // Wrong / "I don't know" / Skipped:
    hintKey = "hint.scaffold_one_line";

    if (attempt.level === 1) {
      // Stuck at L1: switch to teaching mode
      nextLevel = 1;
      newIsTeachingMode = true;
      teachingKey = "teach.simple_explanation_confidence_builder";
      reason = `Missed foundational Level 1: activating teaching mode with a simple scaffolded confidence builder.`;
    } else if (newWrongStreak >= 2) {
      // Two wrong in a row: drop 2 levels and backtrack to prerequisite concept
      nextLevel = Math.max(1, attempt.level - 2) as DifficultyLevel;
      const prereq = getPrerequisiteForConcept(attempt.conceptId, attempt.errorType);
      nextConcept = prereq;
      reason = `Two consecutive errors: stepping down 2 levels to Level ${nextLevel} and backtracking to prerequisite ${prereq}.`;
    } else {
      // Single wrong answer: reduce difficulty by 1 level
      nextLevel = Math.max(1, attempt.level - 1) as DifficultyLevel;
      reason = `Incorrect answer at Level ${attempt.level}: reducing difficulty to Level ${nextLevel} with scaffolding hint.`;
    }
  }

  // 5. Select next source style with rotation
  const nextSourceStyle = rotateSourceStyle(newSourceHistory, boardPreference);

  const nextState: AdaptiveTopicState = {
    topicId: state.topicId,
    conceptId: nextConcept,
    currentLevel: nextLevel,
    correctStreak: newCorrectStreak,
    wrongStreak: newWrongStreak,
    questionCount: newQuestionCount,
    askedQuestionIds: newAskedIds,
    difficultyPath: newDiffPath,
    sourceStyleHistory: newSourceHistory,
    isTeachingMode: newIsTeachingMode,
    consecutiveL1Wrongs: newConsecutiveL1Wrongs,
    highestLevelReached: newHighestLevel,
    status: "pending",
  };

  return {
    nextState,
    action: {
      type: "ask",
      topicId: state.topicId,
      conceptId: nextConcept,
      level: nextLevel,
      sourceStyle: nextSourceStyle,
      isTeachingMode: newIsTeachingMode,
      teachingExplanationKey: teachingKey,
      hintKey,
      missingPartTarget,
      reason,
    },
  };
}

export interface AdaptiveMasteryEstimate {
  conceptId: ConceptId;
  alpha: number;
  beta: number;
  attempts: number;
  correct: number;
  mastery: number; // 0..1
  confidence: number; // 0..1
  status: "mastered" | "developing" | "needs_support" | "not_assessed";
  lastUpdated: string;
}

/**
 * Computes deterministic Bayesian mastery with difficulty-weighted evidence scaling.
 * Getting an L4/L5 question right provides significantly more alpha (mastery) evidence.
 * Missing an L1 question provides significantly stronger beta (gap) evidence than missing an L5.
 */
export function estimateAdaptiveMastery(
  conceptId: ConceptId,
  responses: Array<{
    conceptId: ConceptId;
    difficulty?: DifficultyLevel | number;
    correct: boolean;
    timestamp?: string;
  }>
): AdaptiveMasteryEstimate {
  const items = responses.filter((r) => r.conceptId === conceptId);
  const attempts = items.length;

  if (attempts === 0) {
    return {
      conceptId,
      alpha: 1,
      beta: 1,
      attempts: 0,
      correct: 0,
      mastery: 0,
      confidence: 0,
      status: "not_assessed",
      lastUpdated: "2026-10-06T10:30:00Z",
    };
  }

  let alpha = 1;
  let beta = 1;
  let correctCount = 0;

  const correctMultiplierMap: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0.7,
    2: 0.85,
    3: 1.0,
    4: 1.25,
    5: 1.5,
  };
  const wrongMultiplierMap: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 1.5,
    2: 1.25,
    3: 1.0,
    4: 0.85,
    5: 0.7,
  };

  items.forEach((r, idx) => {
    const baseWeight = 0.8 + 0.4 * ((idx + 1) / attempts);
    const d = (
      r.difficulty && r.difficulty >= 1 && r.difficulty <= 5 ? r.difficulty : 2
    ) as 1 | 2 | 3 | 4 | 5;

    if (r.correct) {
      const weight = baseWeight * correctMultiplierMap[d];
      alpha += weight;
      correctCount++;
    } else {
      const weight = baseWeight * wrongMultiplierMap[d];
      beta += weight;
    }
  });

  const mastery = alpha / (alpha + beta);
  const confidence = Math.min(0.98, attempts / (attempts + 2.5));

  let status: "mastered" | "developing" | "needs_support" | "not_assessed" = "not_assessed";
  if (correctCount === attempts && attempts >= 1) {
    status = "mastered";
  } else if (mastery >= 0.75) {
    status = "mastered";
  } else if (mastery >= 0.5) {
    status = "developing";
  } else {
    status = "needs_support";
  }

  return {
    conceptId,
    alpha,
    beta,
    attempts,
    correct: correctCount,
    mastery:
      correctCount === attempts && attempts >= 1
        ? Math.max(0.85, Math.round(mastery * 100) / 100)
        : Math.round(mastery * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    status,
    lastUpdated: items[items.length - 1]?.timestamp || "2026-10-06T10:30:00Z",
  };
}

