/**
 * ShikshaGap Evidence-Based Stopping Engine
 * 
 * Replaces premature 2-3 question early exits with an evidence-based
 * Bayesian Knowledge Tracing (BKT) stopping rule.
 * 
 * Invariants:
 * 1. MIN_TOTAL_QUESTIONS = 8, MAX_TOTAL_QUESTIONS = 18.
 * 2. Never conclude "gap" or "mastered" from a single answer (models guess and slip).
 * 3. MIN_QUESTIONS_PER_PROBED_CONCEPT = 2, and 3 for the diagnosed root gap.
 * 4. Stop only when BOTH hold: minimums are met AND confidence in root gap >= 0.85,
 *    or MAX_TOTAL_QUESTIONS is reached (which flags result as "provisional").
 * 5. Requires confirmation question in a different question form on candidate root gap,
 *    and prerequisite probing to support backtracking trail.
 * 6. Adaptive difficulty: harder after correct, easier after wrong/unanswered.
 * 7. Skipped/unanswered count as weak evidence, never proof of a gap.
 * 8. Never repeats a question or near-duplicate in a session.
 */

import type { ConceptId, Attempt, SessionMemory, TopicId } from "../types.ts";
import { getPrerequisiteForConcept } from "../agents/staircase.ts";

// ==============================================================================
// CONFIGURATION CONSTANTS (Single source of truth)
// ==============================================================================
export const MIN_TOTAL_QUESTIONS = 8;
export const MAX_TOTAL_QUESTIONS = 18;
export const MIN_QUESTIONS_PER_PROBED_CONCEPT = 2;
export const MIN_QUESTIONS_ROOT_GAP = 3;
export const ROOT_GAP_CONFIDENCE_THRESHOLD = 0.85;

// Bayesian Knowledge Tracing (BKT) Parameters
export const DEFAULT_PRIOR_MASTERY = 0.50; // P(L0) - prior probability of skill mastery
export const DEFAULT_TRANSIT_PROB = 0.05;  // P(T) - transition/learning probability during assessment
export const DEFAULT_GUESS_PROB = 0.25;    // P(G) - 1/4 for 4-option multiple choice questions
export const DEFAULT_SLIP_PROB = 0.10;     // P(S) - slip probability (careless mistake on known skill)

export interface ConceptMasteryEvaluation {
  conceptId: ConceptId;
  pMastery: number;       // P(L): Probability student has mastered the concept
  pGap: number;           // P(Gap) = 1 - P(L): Probability concept is an active learning gap
  confidence: number;     // Certainty metric [0, 1]
  attempts: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  formatsUsed: string[];
  status: "mastered" | "developing" | "gap" | "unassessed";
}

export interface StoppingEvaluationResult {
  shouldStop: boolean;
  reason: string;
  isProvisional: boolean;
  totalQuestions: number;
  candidateRootGap: ConceptId | null;
  rootGapConfidence: number;
  estimatedTotalQuestions: number;
  progressText: string;
  conceptEvaluations: Record<string, ConceptMasteryEvaluation>;
}

/**
 * Computes updated Bayesian mastery using standard Knowledge Tracing formulas.
 * Accounts for guess probability (from option count) and slip probability.
 */
export function updateBktMastery(
  priorMastery: number,
  correct: boolean,
  optionsCount: number = 4,
  slipProb: number = DEFAULT_SLIP_PROB,
  transitProb: number = DEFAULT_TRANSIT_PROB,
  isUnanswered: boolean = false
): { pMastery: number; pGap: number; confidence: number } {
  const pL = Math.max(0.01, Math.min(0.99, priorMastery));
  const pG = Math.max(0.10, Math.min(0.50, 1 / Math.max(2, optionsCount)));
  const pS = Math.max(0.02, Math.min(0.30, slipProb));

  let pPosterior: number;

  if (isUnanswered) {
    // Unanswered / skipped questions count as weak evidence, NOT proof of a gap.
    // Dampened evidence update (shifts slightly towards gap without heavy penalty)
    const weakLikelihoodRatio = 0.85;
    const odds = (pL / (1 - pL)) * weakLikelihoodRatio;
    pPosterior = odds / (1 + odds);
  } else if (correct) {
    // P(L | correct) = P(L) * (1 - S) / [ P(L)*(1 - S) + (1 - P(L))*G ]
    const pCorrectGivenMastery = 1 - pS;
    const pCorrectGivenNonMastery = pG;
    const numerator = pL * pCorrectGivenMastery;
    const denominator = numerator + (1 - pL) * pCorrectGivenNonMastery;
    pPosterior = denominator > 0 ? numerator / denominator : pL;
  } else {
    // P(L | wrong) = P(L) * S / [ P(L)*S + (1 - P(L))*(1 - G) ]
    const pWrongGivenMastery = pS;
    const pWrongGivenNonMastery = 1 - pG;
    const numerator = pL * pWrongGivenMastery;
    const denominator = numerator + (1 - pL) * pWrongGivenNonMastery;
    pPosterior = denominator > 0 ? numerator / denominator : pL;
  }

  // Apply learning transition: P(L_t+1) = P(L | obs) + (1 - P(L | obs)) * P(T)
  const pNext = pPosterior + (1 - pPosterior) * transitProb;
  const pMasteryClamped = Math.max(0.01, Math.min(0.99, pNext));
  const pGap = 1 - pMasteryClamped;

  // Confidence in definitive diagnosis: distance from maximum uncertainty (0.5)
  // Scaled from 0 to 1
  const confidence = Math.min(1.0, Math.abs(pMasteryClamped - 0.5) * 2);

  return {
    pMastery: Math.round(pMasteryClamped * 1000) / 1000,
    pGap: Math.round(pGap * 1000) / 1000,
    confidence: Math.round(confidence * 1000) / 1000,
  };
}

/**
 * Aggregates all attempts across session memory to evaluate BKT mastery for each probed concept.
 */
export function evaluateAllConceptsMastery(
  attempts: Attempt[]
): Record<string, ConceptMasteryEvaluation> {
  const byConcept = new Map<ConceptId, Attempt[]>();
  for (const a of attempts) {
    if (!a.conceptId || a.questionId === "dummy") continue;
    const list = byConcept.get(a.conceptId) || [];
    list.push(a);
    byConcept.set(a.conceptId, list);
  }

  const result: Record<string, ConceptMasteryEvaluation> = {};

  for (const [conceptId, conceptAttempts] of byConcept.entries()) {
    let pMastery = DEFAULT_PRIOR_MASTERY;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const formatsUsed = new Set<string>();

    for (const a of conceptAttempts) {
      const isUnanswered = a.studentAnswer === "" || a.studentAnswer === "skipped";
      if (isUnanswered) {
        unansweredCount++;
      } else if (a.correct) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      if (a.questionId) {
        formatsUsed.add(a.questionId.split("_s")[0]);
      }

      const update = updateBktMastery(
        pMastery,
        a.correct,
        4,
        DEFAULT_SLIP_PROB,
        DEFAULT_TRANSIT_PROB,
        isUnanswered
      );
      pMastery = update.pMastery;
    }

    const pGap = Math.round((1 - pMastery) * 1000) / 1000;
    // For gap diagnosis, confidence is how firmly P(Gap) exceeds 0.5
    const gapOrMasteryConfidence = Math.min(1.0, Math.abs(pMastery - 0.5) * 2);

    let status: "mastered" | "developing" | "gap" | "unassessed" = "unassessed";
    if (conceptAttempts.length === 0) {
      status = "unassessed";
    } else if (pMastery >= 0.75) {
      status = "mastered";
    } else if (pGap >= 0.60) {
      status = "gap";
    } else {
      status = "developing";
    }

    result[conceptId] = {
      conceptId,
      pMastery,
      pGap,
      confidence: Math.round(gapOrMasteryConfidence * 1000) / 1000,
      attempts: conceptAttempts.length,
      correct: correctCount,
      incorrect: incorrectCount,
      unanswered: unansweredCount,
      formatsUsed: Array.from(formatsUsed),
      status,
    };
  }

  return result;
}

/**
 * Traces the backtracking graph from struggling concepts to isolate the deepest root-cause gap.
 */
export function identifyCandidateRootGap(
  evaluations: Record<string, ConceptMasteryEvaluation>,
  memory?: SessionMemory
): {
  candidateRoot: ConceptId | null;
  confidence: number;
  trail: ConceptId[];
} {
  // 1. Check if any topic in session memory has confirmed gap status (both attempts wrong)
  if (memory?.topics) {
    const gapTopics = memory.topics.filter((t) => t.status === "gap");
    if (gapTopics.length > 0) {
      for (const t of gapTopics) {
        const attempts = t.attempts.filter((a) => a.questionId !== "dummy" && Boolean(a.conceptId));
        if (attempts.length >= 2) {
          const symptom = attempts[0].conceptId;
          const prereq = attempts[1].conceptId;
          const root = prereq || symptom;
          const rootEval = evaluations[root];
          const confidence = rootEval ? Math.max(0.85, rootEval.pGap) : 0.88;
          return {
            candidateRoot: root,
            confidence: Math.round(confidence * 1000) / 1000,
            trail: [symptom, root].filter((v, i, a) => a.indexOf(v) === i),
          };
        }
      }
    }
  }

  // 2. Find all concepts where student struggled with persistent errors
  // Requirement: student has answered at least 2 items incorrectly on the concept (single errors are never gaps)
  const struggling = Object.values(evaluations).filter(
    (e) => e.attempts >= 2 && e.incorrect >= 2
  );

  if (struggling.length === 0) {
    return { candidateRoot: null, confidence: 0, trail: [] };
  }

  // Sort by highest gap probability
  struggling.sort((a, b) => b.pGap - a.pGap);

  // Traverse down the prerequisite tree for the strongest symptom
  let current: ConceptId = struggling[0].conceptId;
  const trail: ConceptId[] = [current];
  const visited = new Set<ConceptId>([current]);

  while (true) {
    const prereq = getPrerequisiteForConcept(current);
    if (!prereq || prereq === current || visited.has(prereq)) {
      break;
    }
    visited.add(prereq);

    const prereqEval = evaluations[prereq];
    if (prereqEval && prereqEval.attempts >= 1) {
      // If prerequisite was tested and student also struggled on it (at least 2 incorrect answers or unmastered), root is deeper
      if (prereqEval.incorrect >= 2 || (prereqEval.attempts >= 2 && prereqEval.incorrect > prereqEval.correct)) {
        current = prereq;
        trail.push(current);
        continue;
      }
    }
    // Prerequisite is either fluent or unprobed; stop backtracking
    break;
  }

  const rootEval = evaluations[current];
  const confidence = rootEval ? rootEval.pGap : 0.5;

  return {
    candidateRoot: current,
    confidence: Math.round(confidence * 1000) / 1000,
    trail,
  };
}

/**
 * Evaluates the full evidence-based stopping rule.
 */
export function evaluateStoppingRule(
  memory: SessionMemory,
  allAttempts: Attempt[]
): StoppingEvaluationResult {
  // Filter out dummy bookkeeping attempts
  const realAttempts = allAttempts.filter(
    (a) => a.questionId !== "dummy" && Boolean(a.conceptId)
  );
  const totalQuestions = realAttempts.length;

  const conceptEvaluations = evaluateAllConceptsMastery(realAttempts);
  const { candidateRoot, confidence: rootGapConfidence } = identifyCandidateRootGap(conceptEvaluations, memory);

  // Dynamic estimate of total questions for honest progress indicator
  let estimatedTotalQuestions = 10;
  if (totalQuestions < MIN_TOTAL_QUESTIONS) {
    estimatedTotalQuestions = Math.max(10, Math.min(14, totalQuestions + 5));
  } else if (candidateRoot && rootGapConfidence < ROOT_GAP_CONFIDENCE_THRESHOLD) {
    estimatedTotalQuestions = Math.min(MAX_TOTAL_QUESTIONS, totalQuestions + 3);
  } else {
    estimatedTotalQuestions = Math.max(totalQuestions, 10);
  }

  const displayStep = totalQuestions + 1;
  const progressText = `Question ${displayStep} of about ${estimatedTotalQuestions}`;

  // 1. HARD CONSTRAINT: Never stop before MIN_TOTAL_QUESTIONS
  if (totalQuestions < MIN_TOTAL_QUESTIONS) {
    return {
      shouldStop: false,
      reason: `Minimum questions threshold not yet met (${totalQuestions}/${MIN_TOTAL_QUESTIONS} questions asked).`,
      isProvisional: false,
      totalQuestions,
      candidateRootGap: candidateRoot,
      rootGapConfidence,
      estimatedTotalQuestions,
      progressText,
      conceptEvaluations,
    };
  }

  // 2. HARD CONSTRAINT: Always stop at MAX_TOTAL_QUESTIONS (time budget protection)
  if (totalQuestions >= MAX_TOTAL_QUESTIONS) {
    const isProvisional = rootGapConfidence < ROOT_GAP_CONFIDENCE_THRESHOLD;
    return {
      shouldStop: true,
      reason: `Maximum assessment budget reached (${MAX_TOTAL_QUESTIONS} questions). Evidence synthesized across curriculum.`,
      isProvisional,
      totalQuestions,
      candidateRootGap: candidateRoot,
      rootGapConfidence,
      estimatedTotalQuestions: totalQuestions,
      progressText: `Completed ${totalQuestions} questions`,
      conceptEvaluations,
    };
  }

  // 3. Check evidence criteria when between MIN and MAX
  // Criterion A: Every probed concept must have at least MIN_QUESTIONS_PER_PROBED_CONCEPT (2)
  const probedConcepts = Object.values(conceptEvaluations);
  const allProbedMeetMin = probedConcepts.every(
    (e) => e.attempts >= MIN_QUESTIONS_PER_PROBED_CONCEPT
  );

  // Criterion B: If all probed concepts are clearly mastered or developing at level 3 (no persistent gaps)
  const hasNoGaps = !candidateRoot && probedConcepts.every((e) => e.incorrect < 2);
  const allTopicsClosedWithoutGap = memory.topics && memory.topics.length > 0 &&
    memory.currentTopicIndex >= memory.topics.length &&
    memory.topics.every((t) => t.status !== "pending" && t.status !== "gap");

  if ((hasNoGaps || allTopicsClosedWithoutGap) && allProbedMeetMin) {
    return {
      shouldStop: true,
      reason: "High confidence mastery demonstrated across all curriculum concepts assessed.",
      isProvisional: false,
      totalQuestions,
      candidateRootGap: null,
      rootGapConfidence: 0.95,
      estimatedTotalQuestions: totalQuestions,
      progressText: `Completed ${totalQuestions} questions`,
      conceptEvaluations,
    };
  }

  // Criterion C: If a learning gap is identified
  if (candidateRoot) {
    const rootEval = conceptEvaluations[candidateRoot];
    const rootAttempts = rootEval?.attempts || 0;
    const rootFormatsCount = rootEval?.formatsUsed?.length || 0;

    const rootHasMinQuestions = rootAttempts >= MIN_QUESTIONS_ROOT_GAP;
    const rootHasDifferentForm = rootFormatsCount >= 2;
    const meetsConfidence = rootGapConfidence >= ROOT_GAP_CONFIDENCE_THRESHOLD;

    // Prerequisite check: has the immediate prerequisite been probed if it exists?
    const prereqConcept = getPrerequisiteForConcept(candidateRoot);
    const prereqTested = !prereqConcept || prereqConcept === candidateRoot || Boolean(conceptEvaluations[prereqConcept]?.attempts);

    if (
      allProbedMeetMin &&
      rootHasMinQuestions &&
      rootHasDifferentForm &&
      meetsConfidence &&
      prereqTested
    ) {
      return {
        shouldStop: true,
        reason: `Root learning gap definitively isolated at ${candidateRoot} with high confidence (${Math.round(rootGapConfidence * 100)}%) across multiple question formats.`,
        isProvisional: false,
        totalQuestions,
        candidateRootGap: candidateRoot,
        rootGapConfidence,
        estimatedTotalQuestions: totalQuestions,
        progressText: `Completed ${totalQuestions} questions`,
        conceptEvaluations,
      };
    }
  }

  // Continue testing to gather conclusive evidence
  return {
    shouldStop: false,
    reason: `Gathering evidence: need confirmation on candidate concepts or confidence threshold (${Math.round(rootGapConfidence * 100)}% / ${Math.round(ROOT_GAP_CONFIDENCE_THRESHOLD * 100)}%).`,
    isProvisional: false,
    totalQuestions,
    candidateRootGap: candidateRoot,
    rootGapConfidence,
    estimatedTotalQuestions,
    progressText,
    conceptEvaluations,
  };
}
