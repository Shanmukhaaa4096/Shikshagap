/**
 * ShikshaGap Staircase Engine
 *
 * Implements the deterministic difficulty staircase per SPEC.md:
 * Each topic starts at level 2.
 * - Correct at 2 -> ask at level 3
 *   - Correct at 3 -> topic status "mastered", move to next topic
 *   - Wrong at 3 -> topic status "developing", move to next topic
 * - Wrong at 2 -> ask at level 1 (same topic, a different question)
 *   - Correct at 1 -> topic status "developing", move to next topic
 *   - Wrong at 1 -> topic status "gap", move to next topic
 *
 * Max 2 questions per topic.
 */

import type {
  Attempt,
  ConceptId,
  Question,
  SessionMemory,
  TopicId,
  TopicMemory,
  TopicStatus,
} from "@/lib/types";

export type StaircaseAction =
  | { type: "ask"; topicId: TopicId; conceptId: ConceptId; level: 1 | 2 | 3 | 4 | 5 }
  | { type: "close_topic"; topicId: TopicId; status: TopicStatus }
  | { type: "finish" };

import { allConceptsMap } from "../../data/curriculum/index.ts";
import {
  evaluateStoppingRule,
  MIN_TOTAL_QUESTIONS,
  MIN_QUESTIONS_PER_PROBED_CONCEPT,
  MIN_QUESTIONS_ROOT_GAP,
} from "../engine/stoppingRule.ts";

/**
 * Normalizes question text for prompt deduplication across languages.
 * Strips whitespace, punctuation, and lowercases.
 */
export function normalizeQuestionText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "")
    .trim();
}

/**
 * Extracts normalized prompt string from a Question object.
 */
export function getQuestionText(q: Question, lang: string = "en"): string {
  const p = q.prompt as unknown as Record<string, string | undefined> | string;
  let text = "";
  if (typeof p === "string") text = p;
  else if (p?.raw) text = p.raw;
  else if (p?.[lang]) text = p[lang] || "";
  else if (p?.en) text = p.en || "";
  else if (typeof p?.key === "string") text = p.key;

  if (q.expression) {
    text += ` ${q.expression}`;
  }
  return text.trim();
}

export const DEFAULT_TOPICS: TopicId[] = [
  "number_ops",
  "multiplication",
  "division",
  "fractions",
];

/**
 * Returns the primary target concept for a given topic, grade (Classes 1 to 10),
 * and board preference (CBSE / ICSE).
 */
export function getConceptForTopic(
  topicId: TopicId,
  grade: number,
  boardPreference?: "CBSE" | "ICSE" | "BOTH"
): ConceptId {
  const isIcse = boardPreference === "ICSE";

  // Class 1
  if (grade === 1) {
    if (topicId === "counting") return isIcse ? "icse_1_numbers_20" : "cbse_1_counting_1_9";
    if (topicId === "shapes_spatial") return isIcse ? "icse_1_shapes" : "cbse_1_shapes";
    if (topicId === "add_sub") return isIcse ? "icse_1_add_sub_20" : "cbse_1_add_sub_9";
    if (topicId === "money") return isIcse ? "icse_1_time_money" : "cbse_1_money";
    return isIcse ? "icse_1_numbers_20" : "cbse_1_counting_1_9";
  }

  // Class 2
  if (grade === 2) {
    if (topicId === "two_digit_numbers") return isIcse ? "icse_2_numbers_1000" : "cbse_2_pv_100";
    if (topicId === "addition_subtraction") return isIcse ? "icse_2_add_sub" : "cbse_2_add_2digit";
    if (topicId === "measurement") return isIcse ? "icse_2_measurement" : "cbse_2_measurement";
    if (topicId === "patterns") return isIcse ? "icse_2_geometry" : "cbse_2_shapes_2d_3d";
    return isIcse ? "icse_2_numbers_1000" : "cbse_2_pv_100";
  }

  // Class 3
  if (grade === 3) {
    if (topicId === "number_sense") return "number_sense";
    if (topicId === "multiplication") return "mult_concept";
    if (topicId === "division") return "division_sharing";
    if (topicId === "fractions") return "shapes_designs";
    if (topicId === "number_ops") return "number_sense";
    return "number_sense";
  }

  // Class 4
  if (grade === 4) {
    if (topicId === "number_ops") return "place_value";
    if (topicId === "multiplication") return "mult_facts";
    if (topicId === "division") return "division_concept";
    if (topicId === "fractions") return "fraction_basics";
    return "place_value";
  }

  // Class 5
  if (grade === 5) {
    if (topicId === "multiplication") return "multi_digit_mult";
    if (topicId === "division") return "division_facts";
    if (topicId === "fractions") return "equivalent_fractions";
    if (topicId === "area_perimeter") return "cbse_5_area";
    if (topicId === "number_ops") return "place_value";
    return "multi_digit_mult";
  }

  // Class 6
  if (grade === 6) {
    if (topicId === "integers") return isIcse ? "icse_6_integers" : "cbse_6_integers";
    if (topicId === "fractions_decimals" || topicId === "fractions") return isIcse ? "icse_6_fractions_decimals" : "cbse_6_fractions_decimals";
    if (topicId === "algebra_intro") return isIcse ? "icse_6_algebra" : "cbse_6_algebra_basics";
    if (topicId === "ratio_proportion" || topicId === "multiplication" || topicId === "division") return isIcse ? "icse_6_ratio_proportion" : "cbse_6_ratio";
    if (topicId === "number_ops") return isIcse ? "icse_6_integers" : "cbse_6_integers";
    return isIcse ? "icse_6_integers" : "cbse_6_integers";
  }

  // Class 7
  if (grade === 7) {
    if (topicId === "rational_numbers" || topicId === "number_ops") return isIcse ? "icse_7_integers_rationals" : "cbse_7_rational_numbers";
    if (topicId === "linear_equations") return isIcse ? "icse_7_algebra_equations" : "cbse_7_simple_equations";
    if (topicId === "algebraic_expressions") return isIcse ? "icse_7_exponents" : "cbse_7_algebraic_expressions";
    if (topicId === "comparing_quantities" || topicId === "multiplication" || topicId === "division" || topicId === "fractions") return isIcse ? "icse_7_commercial_math" : "cbse_7_comparing_quantities";
    return isIcse ? "icse_7_integers_rationals" : "cbse_7_rational_numbers";
  }

  // Class 8
  if (grade === 8) {
    if (topicId === "rational_powers" || topicId === "number_ops") return isIcse ? "icse_8_exponents_radicals" : "cbse_8_rational_properties";
    if (topicId === "linear_equations_one_var") return isIcse ? "icse_8_linear_equations" : "cbse_8_linear_equations_1var";
    if (topicId === "algebraic_identities" || topicId === "multiplication" || topicId === "division") return isIcse ? "icse_8_algebra_factorisation" : "cbse_8_algebraic_identities";
    if (topicId === "mensuration" || topicId === "fractions") return isIcse ? "icse_8_mensuration" : "cbse_8_mensuration";
    return isIcse ? "icse_8_exponents_radicals" : "cbse_8_rational_properties";
  }

  // Class 9
  if (grade === 9) {
    if (topicId === "number_systems" || topicId === "number_ops") return isIcse ? "icse_9_pure_arithmetic" : "cbse_9_number_systems";
    if (topicId === "polynomials" || topicId === "multiplication" || topicId === "division") return isIcse ? "icse_9_algebra_expansions" : "cbse_9_polynomials";
    if (topicId === "coordinate_geometry") return isIcse ? "icse_9_coordinate_geometry" : "cbse_9_coordinate_geometry";
    if (topicId === "linear_equations_two_vars" || topicId === "fractions") return isIcse ? "icse_9_linear_equations" : "cbse_9_linear_equations_2var";
    return isIcse ? "icse_9_pure_arithmetic" : "cbse_9_number_systems";
  }

  // Class 10
  if (grade === 10) {
    if (topicId === "real_numbers" || topicId === "number_ops") return isIcse ? "icse_10_commercial_math" : "cbse_10_real_numbers";
    if (topicId === "quadratic_equations" || topicId === "multiplication" || topicId === "division") return isIcse ? "icse_10_quadratic_equations" : "cbse_10_quadratic_equations";
    if (topicId === "arithmetic_progressions") return isIcse ? "icse_10_arithmetic_progression" : "cbse_10_arithmetic_progressions";
    if (topicId === "trigonometry" || topicId === "fractions") return isIcse ? "icse_10_trigonometry" : "cbse_10_trigonometry";
    return isIcse ? "icse_10_commercial_math" : "cbse_10_real_numbers";
  }

  return "number_sense";
}

export function generateFreshSessionSeed(): number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return (buf[0] % 2147483647) + 1;
  }
  return Math.floor(Math.random() * 2147483646) + 1;
}

/**
 * Creates a clean initial SessionMemory object with a fresh, session-specific seed.
 */
export function createSessionMemory(
  pseudonymousId: string,
  grade: number = 5,
  language: "en" | "hi" | "te" = "en",
  topics: TopicId[] = DEFAULT_TOPICS,
  sessionSeedOrDifficulty?: number | 1 | 2 | 3 | 4 | 5,
  initialDifficultyOrAdaptive?: (1 | 2 | 3 | 4 | 5) | boolean,
  adaptiveMode?: boolean
): SessionMemory {
  let sessionSeed: number | undefined;
  let initDiff: (1 | 2 | 3 | 4 | 5) | undefined;
  let adaptive: boolean | undefined = adaptiveMode;

  if (typeof initialDifficultyOrAdaptive === "boolean") {
    adaptive = initialDifficultyOrAdaptive;
    if (
      typeof sessionSeedOrDifficulty === "number" &&
      sessionSeedOrDifficulty >= 1 &&
      sessionSeedOrDifficulty <= 5
    ) {
      initDiff = sessionSeedOrDifficulty as 1 | 2 | 3 | 4 | 5;
    }
    sessionSeed = undefined;
  } else {
    sessionSeed = sessionSeedOrDifficulty;
    initDiff = initialDifficultyOrAdaptive as (1 | 2 | 3 | 4 | 5) | undefined;
  }

  const topicList = topics.length > 0 ? topics : DEFAULT_TOPICS;
  return {
    pseudonymousId,
    language,
    grade,
    currentTopicIndex: 0,
    topics: topicList.map(
      (topicId): TopicMemory => ({
        topicId,
        status: "pending",
        attempts: [],
        notes: [],
        misconceptions: [],
      })
    ),
    seenSignatures: [],
    usedFormats: [],
    askedQuestionIds: [],
    askedQuestionTexts: [],
    sessionSeed: sessionSeed ?? generateFreshSessionSeed(),
    stepCount: 0,
    initialDifficulty: initDiff,
    adaptiveMode: adaptive,
  };
}

/**
 * Maps a concept to its foundational prerequisite for diagnostic probing.
 * Supports cross-class prerequisite backtracking across Classes 1 to 10
 * via the unified curriculum dependency graph.
 */
export function getPrerequisiteForConcept(
  conceptId: ConceptId,
  errorType?: string
): ConceptId {
  // 1. Specific error-type diagnostic routing for foundational arithmetic
  if (conceptId === "division_facts" || conceptId === "long_division") {
    if (
      errorType === "wrong_operation" ||
      errorType === "sharing_error" ||
      errorType === "sharing" ||
      errorType?.includes("sharing")
    ) {
      return "division_concept";
    }
    return "mult_facts";
  }
  if (conceptId === "division_concept") {
    return "mult_concept";
  }
  if (
    conceptId === "equivalent_fractions" ||
    conceptId === "comparing_fractions" ||
    conceptId === "fraction_addition"
  ) {
    return "fraction_basics";
  }
  if (conceptId === "multi_digit_mult") {
    return "mult_facts";
  }
  if (conceptId === "mult_facts") {
    return "mult_concept";
  }
  if (conceptId === "mult_concept") {
    return "addition";
  }
  if (conceptId === "place_value") {
    return "number_sense";
  }
  if (conceptId === "addition_3digit") {
    return "place_value";
  }
  if (conceptId === "subtraction_3digit" || conceptId === "subtraction") {
    return "place_value";
  }

  // 2. Check unified curriculum graph (Classes 1 to 10 cross-class backtracking)
  const curriculumNode = allConceptsMap.get(conceptId);
  if (curriculumNode && curriculumNode.prerequisites && curriculumNode.prerequisites.length > 0) {
    return curriculumNode.prerequisites[0];
  }

  return conceptId;
}

/**
 * Pure function that, given SessionMemory and optional last Attempt,
 * returns the single legal next action (ask at level N, or close the topic with a status, or finish).
 */
export function getNextStaircaseAction(
  memory: SessionMemory,
  lastAttempt?: Attempt
): StaircaseAction {
  if (!memory.topics || memory.topics.length === 0) {
    return { type: "finish" };
  }

  // 1. Gather all real assessment attempts
  const allAttempts: Attempt[] = [];
  for (const t of memory.topics) {
    for (const a of t.attempts) {
      if (a.questionId !== "dummy" && Boolean(a.conceptId)) {
        allAttempts.push(a);
      }
    }
  }
  if (
    lastAttempt &&
    lastAttempt.questionId !== "dummy" &&
    Boolean(lastAttempt.conceptId) &&
    !allAttempts.some((a) => a.questionId === lastAttempt.questionId)
  ) {
    allAttempts.push(lastAttempt);
  }

  // 2. Initial curriculum pass: ensure every topic is assessed through the 2-question staircase
  if (memory.currentTopicIndex < memory.topics.length) {
    const currentTopic = memory.topics[memory.currentTopicIndex];
    if (currentTopic && currentTopic.status === "pending") {
      const attempts = [...currentTopic.attempts];
      if (
        lastAttempt &&
        lastAttempt.questionId !== "dummy" &&
        !attempts.some((a) => a.questionId === lastAttempt.questionId)
      ) {
        attempts.push(lastAttempt);
      }

      const startLevel = (memory.initialDifficulty ?? (memory.adaptiveMode ? 3 : 2)) as 1 | 2 | 3 | 4 | 5;

      if (attempts.length === 0) {
        const conceptId = getConceptForTopic(currentTopic.topicId, memory.grade, memory.boardPreference);
        return {
          type: "ask",
          topicId: currentTopic.topicId,
          conceptId,
          level: startLevel,
        };
      }

      // Full Adaptive 5-level difficulty engine (enabled when adaptiveMode is true or initialDifficulty is 3)
      if (memory.adaptiveMode || memory.initialDifficulty === 3) {
        const numAttempts = attempts.length;
        const lastAtt = attempts[numAttempts - 1];

        // Early stopping rules (min 2, max 6 per topic)
        if (numAttempts >= 2) {
          const allCorrect = attempts.every((a) => a.correct);
          const lastTwoCorrect = attempts.slice(-2).every((a) => a.correct);
          const reachedHighLevel = attempts.some((a) => a.level >= 4);

          // Clear mastery: all attempts correct (>= 2) or last 2 correct reaching high level (>= 4)
          if ((allCorrect && numAttempts >= 2) || (lastTwoCorrect && reachedHighLevel)) {
            return {
              type: "close_topic",
              topicId: currentTopic.topicId,
              status: "mastered",
            };
          }

          // Flag for gap if 2 consecutive errors at foundational level 1
          const lastTwo = attempts.slice(-2);
          if (lastTwo.length >= 2 && lastTwo.every((a) => !a.correct && a.level === 1)) {
            return {
              type: "close_topic",
              topicId: currentTopic.topicId,
              status: "gap",
            };
          }

          // Max 6 questions per topic stopping rule
          if (numAttempts >= 6) {
            const correctCount = attempts.filter((a) => a.correct).length;
            const finalStatus: TopicStatus = correctCount >= 4 ? "mastered" : correctCount >= 2 ? "developing" : "gap";
            return {
              type: "close_topic",
              topicId: currentTopic.topicId,
              status: finalStatus,
            };
          }
        }

        // Adaptive step progression:
        // Correct answer -> next difficulty +1 (max 5)
        // Wrong or unanswered -> next difficulty -1 (min 1) and probe prerequisite concept from previous grade
        if (lastAtt.correct) {
          const nextLevel = Math.min(5, lastAtt.level + 1) as 1 | 2 | 3 | 4 | 5;
          return {
            type: "ask",
            topicId: currentTopic.topicId,
            conceptId: lastAtt.conceptId,
            level: nextLevel,
          };
        } else {
          const nextLevel = Math.max(1, lastAtt.level - 1) as 1 | 2 | 3 | 4 | 5;
          const prereq = getPrerequisiteForConcept(lastAtt.conceptId, lastAtt.errorType);
          return {
            type: "ask",
            topicId: currentTopic.topicId,
            conceptId: prereq,
            level: nextLevel,
          };
        }
      }

      // Legacy 2-step fixed staircase (SPEC.md baseline)
      if (attempts.length === 1) {
        const a1 = attempts[0];
        if (a1.correct) {
          return {
            type: "ask",
            topicId: currentTopic.topicId,
            conceptId: a1.conceptId,
            level: 3,
          };
        } else {
          const prereq = getPrerequisiteForConcept(a1.conceptId, a1.errorType);
          return {
            type: "ask",
            topicId: currentTopic.topicId,
            conceptId: prereq,
            level: 1,
          };
        }
      }
      // Topic has 2 attempts -> close topic with status
      const a1 = attempts[0];
      const a2 = attempts[1];
      let status: TopicStatus;
      if (a1.correct && a2.correct) {
        status = "mastered";
      } else if (!a1.correct && !a2.correct) {
        status = "gap";
      } else {
        status = "developing";
      }
      return {
        type: "close_topic",
        topicId: currentTopic.topicId,
        status,
      };
    }
  }

  // 3. Evidence-Based Stopping Engine (Evaluates BKT and MIN/MAX constraints)
  if (
    memory.topics &&
    memory.topics.length > 0 &&
    memory.currentTopicIndex >= memory.topics.length &&
    memory.topics.every((t) => t.status !== "pending") &&
    allAttempts.length >= MIN_TOTAL_QUESTIONS
  ) {
    return { type: "finish" };
  }

  const stopping = evaluateStoppingRule(memory, allAttempts);
  if (stopping.shouldStop) {
    return { type: "finish" };
  }

  // Identify fallback topic and previous attempt
  const fallbackTopic = memory.topics[0] || { topicId: "number_ops" as TopicId };
  const prevAttempt = lastAttempt || (allAttempts.length > 0 ? allAttempts[allAttempts.length - 1] : undefined);

  // Adaptive difficulty helper: harder after correct, easier after wrong/unanswered
  const getAdaptiveDifficulty = (lastAtt?: Attempt): 1 | 2 | 3 => {
    if (!lastAtt) return 2;
    if (lastAtt.studentAnswer === "" || lastAtt.studentAnswer === "skipped") {
      return Math.max(1, lastAtt.level - 1) as 1 | 2 | 3;
    }
    if (lastAtt.correct) {
      return Math.min(3, lastAtt.level + 1) as 1 | 2 | 3;
    }
    return Math.max(1, lastAtt.level - 1) as 1 | 2 | 3;
  };

  // 4. PRIORITY A: Candidate root gap confirmation questions (must have >= 3 questions & >= 2 formats)
  if (stopping.candidateRootGap) {
    const rootEval = stopping.conceptEvaluations[stopping.candidateRootGap];
    const rootAttempts = rootEval?.attempts || 0;
    const rootFormatsCount = rootEval?.formatsUsed?.length || 0;

    if (rootAttempts < MIN_QUESTIONS_ROOT_GAP || rootFormatsCount < 2) {
      const parentTopic = memory.topics.find((t) =>
        t.attempts.some((a) => a.conceptId === stopping.candidateRootGap)
      ) || fallbackTopic;

      return {
        type: "ask",
        topicId: parentTopic.topicId,
        conceptId: stopping.candidateRootGap,
        level: getAdaptiveDifficulty(prevAttempt),
      };
    }

    // A2: Probe immediate prerequisite if not yet probed to at least 2 questions
    const prereqConcept = getPrerequisiteForConcept(stopping.candidateRootGap);
    if (prereqConcept && prereqConcept !== stopping.candidateRootGap) {
      const prereqEval = stopping.conceptEvaluations[prereqConcept];
      if (!prereqEval || prereqEval.attempts < MIN_QUESTIONS_PER_PROBED_CONCEPT) {
        const parentTopic = memory.topics.find((t) =>
          t.attempts.some((a) => a.conceptId === prereqConcept)
        ) || fallbackTopic;

        return {
          type: "ask",
          topicId: parentTopic.topicId,
          conceptId: prereqConcept,
          level: 2,
        };
      }
    }
  }

  // 5. PRIORITY B: Ensure every probed concept has at least MIN_QUESTIONS_PER_PROBED_CONCEPT (2)
  for (const [cId, evalData] of Object.entries(stopping.conceptEvaluations)) {
    if (evalData.attempts < MIN_QUESTIONS_PER_PROBED_CONCEPT) {
      const parentTopic = memory.topics.find((t) =>
        t.attempts.some((a) => a.conceptId === cId)
      ) || fallbackTopic;

      return {
        type: "ask",
        topicId: parentTopic.topicId,
        conceptId: cId as ConceptId,
        level: evalData.correct > 0 ? 3 : 1,
      };
    }
  }

  // 6. PRIORITY C: Rotate among curriculum topics with adaptive difficulty
  const sortedTopics = [...memory.topics].sort((a, b) => a.attempts.length - b.attempts.length);
  const targetTopic = sortedTopics[0] || fallbackTopic;
  const targetConcept = getConceptForTopic(targetTopic.topicId, memory.grade, memory.boardPreference);

  return {
    type: "ask",
    topicId: targetTopic.topicId,
    conceptId: targetConcept,
    level: getAdaptiveDifficulty(prevAttempt),
  };
}

/**
 * Advance session memory with an attempt (pure immutable transformation).
 * Applies the attempt, closes topic if needed, and advances currentTopicIndex.
 */
export function applyAttemptToMemory(
  memory: SessionMemory,
  attempt: Attempt
): {
  memory: SessionMemory;
  action: StaircaseAction;
  closedTopic?: { topicId: TopicId; status: TopicStatus };
} {
  // Clone memory deeply enough to mutate safely
  const updatedTopics: TopicMemory[] = memory.topics.map((t, idx) => {
    if (idx !== memory.currentTopicIndex) return t;
    const existing = t.attempts.some(
      (a) => a.questionId === attempt.questionId && a.studentAnswer === attempt.studentAnswer
    );
    return {
      ...t,
      attempts: existing ? t.attempts : [...t.attempts, attempt],
      notes: [...t.notes],
      misconceptions: t.misconceptions ? [...t.misconceptions] : [],
    };
  });

  let currentIdx = memory.currentTopicIndex;
  const currentTopic = updatedTopics[currentIdx];

  const seenSignatures = memory.seenSignatures ? [...memory.seenSignatures] : [];
  if (attempt.questionSignature && !seenSignatures.includes(attempt.questionSignature)) {
    seenSignatures.push(attempt.questionSignature);
  }

  const usedFormats = memory.usedFormats ? [...memory.usedFormats] : [];
  if (attempt.format) {
    usedFormats.push(attempt.format);
  }

  const askedQuestionIds = memory.askedQuestionIds ? [...memory.askedQuestionIds] : [];
  if (attempt.questionId) {
    if (!askedQuestionIds.includes(attempt.questionId)) {
      askedQuestionIds.push(attempt.questionId);
    }
    const baseId = attempt.questionId.split("_s")[0];
    if (baseId && !askedQuestionIds.includes(baseId)) {
      askedQuestionIds.push(baseId);
    }
  }

  const askedQuestionTexts = memory.askedQuestionTexts ? [...memory.askedQuestionTexts] : [];
  if (attempt.questionText) {
    const norm = normalizeQuestionText(attempt.questionText);
    if (norm && !askedQuestionTexts.includes(norm)) {
      askedQuestionTexts.push(norm);
    }
  }

  const memWithAttempt: SessionMemory = {
    ...memory,
    topics: updatedTopics,
    currentTopicIndex: currentIdx,
    seenSignatures,
    usedFormats,
    askedQuestionIds,
    askedQuestionTexts,
    stepCount: (memory.stepCount ?? 0) + 1,
  };

  const action = getNextStaircaseAction(memWithAttempt);

  if (action.type === "close_topic") {
    // Close the current topic
    currentTopic.status = action.status;
    if (action.status === "gap") {
      const first = currentTopic.attempts[0];
      const second = currentTopic.attempts[1];
      if (second && first && second.conceptId !== first.conceptId) {
        currentTopic.notes.push(
          `Foundational difficulty confirmed: struggle with ${first.conceptId} traced to missing prerequisite fluency in ${second.conceptId}`
        );
      } else {
        currentTopic.notes.push("Learning gap identified");
      }
    } else if (action.status === "developing") {
      const first = currentTopic.attempts[0];
      const second = currentTopic.attempts[1];
      if (first && !first.correct && second && second.correct && second.conceptId !== first.conceptId) {
        currentTopic.notes.push(
          `Developing understanding: foundational prerequisite ${second.conceptId} verified fluent; needs practice on bridging to ${first.conceptId}`
        );
      }
    } else if (action.status === "mastered") {
      const first = currentTopic.attempts[0];
      if (first) {
        currentTopic.notes.push(`Demonstrated mastery on ${first.conceptId}`);
      }
    }
    currentIdx += 1;

    const advancedMem: SessionMemory = {
      ...memWithAttempt,
      currentTopicIndex: currentIdx,
    };

    const nextAction = getNextStaircaseAction(advancedMem);
    return {
      memory: advancedMem,
      action: nextAction,
      closedTopic: { topicId: action.topicId, status: action.status },
    };
  }

  if (action.type === "ask") {
    const targetIdx = updatedTopics.findIndex((t) => t.topicId === action.topicId);
    const targetTopicIdx = targetIdx >= 0 ? targetIdx : currentIdx;
    return {
      memory: {
        ...memWithAttempt,
        currentTopicIndex: targetTopicIdx,
      },
      action,
    };
  }

  return {
    memory: memWithAttempt,
    action,
  };
}

/**
 * Advances to the next topic if the current topic runs out of unasked questions.
 * Marks the current topic as developing (or preserves status if already evaluated)
 * and returns the next StaircaseAction without repeating any question.
 */
export function advanceToNextTopic(
  memory: SessionMemory,
  note: string = "Topic unasked questions exhausted"
): {
  memory: SessionMemory;
  action: StaircaseAction;
  closedTopic?: { topicId: TopicId; status: TopicStatus };
} {
  const currentIdx = memory.currentTopicIndex;
  if (currentIdx >= memory.topics.length) {
    return { memory, action: { type: "finish" } };
  }

  const currentTopic = memory.topics[currentIdx];
  const finalStatus: TopicStatus = currentTopic.status !== "pending"
    ? currentTopic.status
    : currentTopic.attempts.length > 0 && currentTopic.attempts[0].correct
    ? "developing"
    : "developing";

  const updatedTopics: TopicMemory[] = memory.topics.map((t, idx) => {
    if (idx !== currentIdx) return t;
    return {
      ...t,
      status: finalStatus,
      notes: [...t.notes, note],
    };
  });

  const nextIdx = currentIdx + 1;
  const advancedMem: SessionMemory = {
    ...memory,
    topics: updatedTopics,
    currentTopicIndex: nextIdx,
  };

  const action = getNextStaircaseAction(advancedMem);
  return {
    memory: advancedMem,
    action,
    closedTopic: { topicId: currentTopic.topicId, status: finalStatus },
  };
}

/**
 * Gate validation for Phase 2: checks whether a proposed agent tool call is legal.
 */
export function isActionLegal(
  memory: SessionMemory,
  proposed: StaircaseAction,
  lastAttempt?: Attempt
): boolean {
  const legal = getNextStaircaseAction(memory, lastAttempt);
  if (proposed.type !== legal.type) return false;
  if (proposed.type === "ask" && legal.type === "ask") {
    return (
      proposed.topicId === legal.topicId &&
      proposed.level === legal.level
    );
  }
  if (proposed.type === "close_topic" && legal.type === "close_topic") {
    return (
      proposed.topicId === legal.topicId &&
      proposed.status === legal.status
    );
  }
  return true;
}
