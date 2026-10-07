/**
 * ShikshaGap Diagnostic Engine
 * Implements Bayesian mastery accumulation and prerequisite backtracking
 * to isolate root-cause learning gaps.
 */
import {
  CONCEPTS,
  prerequisitesOf,
  ancestorsOf,
} from "@/lib/concepts/graph";
import type {
  ConceptId,
  Difficulty,
  ErrorType,
  EvidenceItem,
  MasteryEstimate,
  MasteryStatus,
  Response,
  RootCause,
  Severity,
} from "@/lib/types";
import { generateQuestion } from "@/lib/questions/generator";
import { makeRng, type Rng } from "@/lib/rng";

/**
 * Compute mastery estimate for a concept from a list of responses using a
 * Beta(1, 1) prior with exponential recency weighting.
 */
export function estimateMastery(
  conceptId: ConceptId,
  responses: Response[]
): MasteryEstimate {
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

  items.forEach((r, idx) => {
    // Weight later responses slightly more
    const weight = 0.8 + 0.4 * ((idx + 1) / attempts);
    if (r.correct) {
      alpha += weight;
      correctCount++;
    } else {
      beta += weight;
    }
  });

  const mastery = alpha / (alpha + beta);
  // Confidence scales with number of items and variance
  const confidence = Math.min(0.98, attempts / (attempts + 2.5));

  let status: MasteryStatus = "not_assessed";
  if (mastery >= 0.75) status = "mastered";
  else if (mastery >= 0.5) status = "developing";
  else status = "needs_support";

  return {
    conceptId,
    alpha,
    beta,
    attempts,
    correct: correctCount,
    mastery: Math.round(mastery * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    status,
    lastUpdated: items[items.length - 1]?.timestamp || "2026-10-06T10:30:00Z",
  };
}

/**
 * Analyze responses across all concepts to identify root causes.
 * Uses DAG traversal to find the deepest failing prerequisite.
 */
export function findRootCauses(responses: Response[]): RootCause[] {
  // 1. Group responses by concept and compute mastery
  const conceptResponses = new Map<ConceptId, Response[]>();
  for (const r of responses) {
    if (!conceptResponses.has(r.conceptId)) {
      conceptResponses.set(r.conceptId, []);
    }
    conceptResponses.get(r.conceptId)!.push(r);
  }

  const masteryMap = new Map<ConceptId, MasteryEstimate>();
  for (const [cid, resps] of conceptResponses.entries()) {
    masteryMap.set(cid, estimateMastery(cid, resps));
  }

  // 2. Identify all struggling concepts (mastery < 0.65 or status != 'mastered')
  const weakConcepts: ConceptId[] = [];
  for (const [cid, est] of masteryMap.entries()) {
    if (est.status === "needs_support" || est.status === "developing") {
      weakConcepts.push(cid);
    }
  }

  if (weakConcepts.length === 0) return [];

  const rootCauses: RootCause[] = [];
  const processedRoots = new Set<ConceptId>();

  for (const symptom of weakConcepts) {
    // Trace prerequisites downwards
    const chain: ConceptId[] = [symptom];
    let current = symptom;
    let foundDeeperPrereq = true;

    while (foundDeeperPrereq) {
      foundDeeperPrereq = false;
      const prereqs = prerequisitesOf(current);

      for (const p of prereqs) {
        const pEst = masteryMap.get(p);
        // If prerequisite was tested and is struggling, step down to it
        if (pEst && (pEst.status === "needs_support" || pEst.status === "developing")) {
          current = p;
          chain.push(p);
          foundDeeperPrereq = true;
          break; // Follow deepest path
        }
      }
    }

    const rootId = current;
    if (processedRoots.has(rootId)) continue;
    processedRoots.add(rootId);

    const rootEst = masteryMap.get(rootId) || estimateMastery(rootId, []);
    const rootResponses = conceptResponses.get(rootId) || [];

    // Gather evidence items from responses on this root and symptoms
    const relevantResps = [...rootResponses, ...(conceptResponses.get(symptom) || [])];
    const evidence: EvidenceItem[] = relevantResps.map((r) => ({
      questionId: r.questionId,
      conceptId: r.conceptId,
      prompt: { key: `q.${r.conceptId}` as any },
      answer: r.answer,
      correctAnswer: r.correct ? r.answer : "(correct answer)",
      correct: r.correct,
      classification: r.classification,
    }));

    // Extract misconceptions
    const misconceptions: ErrorType[] = [];
    for (const r of rootResponses) {
      if (!r.correct && r.classification !== "correct" && !misconceptions.includes(r.classification)) {
        misconceptions.push(r.classification);
      }
    }

    // Determine severity
    let severity: Severity = "low";
    if (rootEst.mastery < 0.45) severity = "high";
    else if (rootEst.mastery < 0.65) severity = "medium";

    // Unchecked prerequisites
    const uncheckedPrereqs = prerequisitesOf(rootId).filter(
      (p) => !conceptResponses.has(p)
    );

    // Symptoms linked to this root
    const symptoms = weakConcepts.filter(
      (s) => s !== rootId && ancestorsOf(s).has(rootId)
    );

    rootCauses.push({
      rootId,
      symptomIds: symptoms.length > 0 ? symptoms : [symptom],
      chain,
      severity,
      confidence: rootEst.confidence,
      rootMastery: rootEst.mastery,
      uncheckedPrereqs,
      isSelfRoot: rootId === symptom,
      evidence,
      misconceptions,
      priority: severity === "high" ? 1 : severity === "medium" ? 2 : 3,
    });
  }

  // Sort by priority (high severity first)
  return rootCauses.sort((a, b) => a.priority - b.priority);
}

export interface AdaptiveStepResult {
  nextQuestion: ReturnType<typeof generateQuestion> | null;
  reasoning: string;
  isComplete: boolean;
  isolatedRoot?: ConceptId;
}

/**
 * Adaptive question selection agent:
 * Dynamically picks the next question to isolate learning gaps using
 * prerequisite backtracking.
 */
export function getNextDiagnosticStep(
  targetConceptId: ConceptId,
  responses: Response[],
  rng: Rng = makeRng(12345),
  maxQuestions = 6
): AdaptiveStepResult {
  if (responses.length >= maxQuestions) {
    const roots = findRootCauses(responses);
    return {
      nextQuestion: null,
      reasoning: "Maximum diagnostic question limit reached. Evidence synthesized.",
      isComplete: true,
      isolatedRoot: roots[0]?.rootId,
    };
  }

  // 1. Initial question: start on the target concept at standard difficulty (Level 2)
  if (responses.length === 0) {
    const q = generateQuestion(targetConceptId, 2, rng);
    return {
      nextQuestion: q,
      reasoning: `Beginning diagnostic assessment on target concept: ${CONCEPTS[targetConceptId]?.strand} → ${targetConceptId} at Grade level (Difficulty 2).`,
      isComplete: false,
    };
  }

  const lastResp = responses[responses.length - 1];
  const lastConcept = lastResp.conceptId;

  // CASE A: Student got the question WRONG
  if (!lastResp.correct) {
    // Check prerequisites of the failed concept
    const prereqs = prerequisitesOf(lastConcept);

    // Find the first prerequisite not yet evaluated in this session
    const evaluatedConcepts = new Set(responses.map((r) => r.conceptId));
    const nextPrereq = prereqs.find((p) => !evaluatedConcepts.has(p));

    if (nextPrereq) {
      // Backtrack: test prerequisite at Difficulty 2
      const q = generateQuestion(nextPrereq, 2, rng, {
        link: { conceptId: lastConcept, meta: {} },
      });
      return {
        nextQuestion: q,
        reasoning: `Student struggled with ${lastConcept} (${lastResp.classification}). Backtracking down the prerequisite chain to probe foundational concept: ${nextPrereq}.`,
        isComplete: false,
      };
    } else {
      // All direct prerequisites were either tested or none exist -> probe easier difficulty or finalize
      const sameConceptResps = responses.filter((r) => r.conceptId === lastConcept);
      if (sameConceptResps.length === 1) {
        // Try Level 1 (scaffolded)
        const q = generateQuestion(lastConcept, 1, rng);
        return {
          nextQuestion: q,
          reasoning: `Prerequisites already investigated. Testing foundational Level 1 scaffold for ${lastConcept}.`,
          isComplete: false,
        };
      }
    }
  }

  // CASE B: Student got the question RIGHT
  if (lastResp.correct) {
    // If they got a prerequisite right, the root cause is likely the higher concept that failed
    const failedConcepts = responses.filter((r) => !r.correct).map((r) => r.conceptId);
    if (failedConcepts.length > 0 && lastConcept !== targetConceptId) {
      // The prerequisite is solid! The gap is in bridging or the higher concept itself.
      const roots = findRootCauses(responses);
      return {
        nextQuestion: null,
        reasoning: `Student verified prerequisite fluency on ${lastConcept}. Diagnosed gap is isolated to bridging concept: ${failedConcepts[0]}.`,
        isComplete: true,
        isolatedRoot: roots[0]?.rootId || failedConcepts[0],
      };
    }

    // Still testing target concept -> probe harder (Difficulty 3)
    const targetResps = responses.filter((r) => r.conceptId === targetConceptId);
    if (targetResps.length === 1) {
      const q = generateQuestion(targetConceptId, 3, rng);
      return {
        nextQuestion: q,
        reasoning: `Student answered target concept correctly. Testing application & multi-step challenge (Difficulty 3) to confirm mastery.`,
        isComplete: false,
      };
    } else {
      // Mastered target!
      return {
        nextQuestion: null,
        reasoning: `Student demonstrated consistent conceptual fluency and mastery on ${targetConceptId}.`,
        isComplete: true,
      };
    }
  }

  // Fallback next available question
  const q = generateQuestion(targetConceptId, 2, rng);
  return {
    nextQuestion: q,
    reasoning: `Administering follow-up verification item on ${targetConceptId}.`,
    isComplete: false,
  };
}
