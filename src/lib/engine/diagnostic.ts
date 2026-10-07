/**
 * ShikshaGap Diagnostic Engine
 * Implements Bayesian mastery accumulation and prerequisite backtracking
 * to isolate root-cause learning gaps.
 */
import {
  CONCEPTS,
  TOPICS,
  prerequisitesOf,
  ancestorsOf,
} from "@/lib/concepts/graph";
import type {
  AgentAction,
  AgentDecisionRecord,
  AssessmentAgentState,
  ConceptId,
  DiagnosticResult,
  Difficulty,
  ErrorType,
  EvidenceItem,
  MasteryEstimate,
  MasteryStatus,
  Question,
  Response,
  RootCause,
  Severity,
  TopicAssessmentSummary,
  TopicId,
  TopicMasteryState,
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
    mastery: correctCount === attempts && attempts >= 1 ? Math.max(0.85, Math.round(mastery * 100) / 100) : Math.round(mastery * 100) / 100,
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

  // 2. Identify all struggling concepts (must have made mistakes: correct < attempts)
  const weakConcepts: ConceptId[] = [];
  for (const [cid, est] of masteryMap.entries()) {
    if (est.correct < est.attempts && (est.status === "needs_support" || est.mastery < 0.70)) {
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

/* ------------------------------------------------------------------ */
/* Multi-Topic AI Assessment Agent State Machine                       */
/* ------------------------------------------------------------------ */

export const CURRICULUM_TOPICS: TopicId[] = [
  "number_ops",
  "multiplication",
  "division",
  "fractions",
];

export const TOPIC_DISPLAY_NAMES: Record<TopicId, { en: string; hi: string; te: string }> = {
  number_ops: {
    en: "Number Operations",
    hi: "संख्या संक्रियाएं (Number Operations)",
    te: "సంఖ్యా పరిక్రియలు (Number Operations)",
  },
  multiplication: {
    en: "Multiplication",
    hi: "गुणा (Multiplication)",
    te: "గుణకారం (Multiplication)",
  },
  division: {
    en: "Division",
    hi: "भाग (Division)",
    te: "భాగాహారం (Division)",
  },
  fractions: {
    en: "Fractions",
    hi: "भिन्न (Fractions)",
    te: "భిన్నాలు (Fractions)",
  },
};

/**
 * Initialize a comprehensive AI diagnostic session for all curriculum topics.
 */
export function initAssessmentAgent(
  studentId: string,
  studentName: string,
  grade = 5,
  subjectId = "math"
): AssessmentAgentState {
  const initialTopic = CURRICULUM_TOPICS[0]; // "number_ops"
  const targets = TOPICS[initialTopic].targets;
  const initialConcept = targets[0] || "place_value";
  const initialDifficulty: Difficulty = 2;

  const topicStates: Partial<Record<TopicId, TopicMasteryState>> = {};
  for (const tId of CURRICULUM_TOPICS) {
    topicStates[tId] = {
      topicId: tId,
      mastery: 0,
      confidence: 0,
      status: "not_assessed",
      attempts: 0,
      correct: 0,
      difficultyProgression: [],
      misconceptions: [],
      evidenceCount: 0,
      prerequisiteProbesCount: 0,
      probedPrerequisites: [],
      reason: "Pending diagnostic probe",
    };
  }

  const initialDecision: AgentDecisionRecord = {
    step: 1,
    action: "START_TOPIC",
    topicId: initialTopic,
    conceptId: initialConcept,
    difficulty: initialDifficulty,
    reason: `Starting diagnostic check on foundational topic: ${TOPIC_DISPLAY_NAMES[initialTopic].en} at Grade level (${initialConcept}).`,
    confidence: 0.5,
    studentFeedbackPrompt: "Let's see what you already know.",
    source: "deterministic",
  };

  return {
    studentId,
    studentName,
    grade,
    subjectId,
    topics: CURRICULUM_TOPICS,
    currentTopicIndex: 0,
    currentTopic: initialTopic,
    currentConcept: initialConcept,
    currentDifficulty: initialDifficulty,
    responses: [],
    visitedConcepts: [initialConcept],
    probedConcepts: [],
    topicStates,
    decisions: [initialDecision],
    assessmentComplete: false,
  };
}

/**
 * Synthesizes the full multi-topic DiagnosticResult once assessment completes.
 */
export function buildDiagnosticResult(state: AssessmentAgentState): DiagnosticResult {
  const topicsSummary: TopicAssessmentSummary[] = state.topics.map((tId: TopicId) => {
    const tState = state.topicStates[tId] || {
      topicId: tId,
      mastery: 0,
      confidence: 0,
      status: "not_assessed",
      attempts: 0,
      correct: 0,
      difficultyProgression: [],
      misconceptions: [],
      evidenceCount: 0,
      prerequisiteProbesCount: 0,
      probedPrerequisites: [],
    };

    const targetConcepts = TOPICS[tId]?.targets || [];
    const allRelevantConcepts = Array.from(
      new Set([...targetConcepts, ...tState.probedPrerequisites])
    );

    const concepts = allRelevantConcepts.map((cId: ConceptId) => {
      const cResps = state.responses.filter((r: Response) => r.conceptId === cId);
      const est = estimateMastery(cId, cResps);
      return {
        conceptId: cId,
        mastery: est.mastery,
        confidence: est.confidence,
        status: est.status,
      };
    });

    return {
      topicId: tId,
      mastery: tState.mastery,
      confidence: tState.confidence,
      status: tState.status,
      evidenceCount: tState.attempts,
      concepts,
      prerequisiteProbesCount: tState.prerequisiteProbesCount,
      reason: tState.reason,
    };
  });

  const rootCauses = findRootCauses(state.responses);

  const assessedTopics = topicsSummary.filter((t) => t.status !== "not_assessed");
  const overallMastery =
    assessedTopics.length > 0
      ? Math.round(
          (assessedTopics.reduce((acc: number, t: TopicAssessmentSummary) => acc + t.mastery, 0) /
            assessedTopics.length) *
            100
        ) / 100
      : 0;

  const overallConfidence =
    assessedTopics.length > 0
      ? Math.round(
          (assessedTopics.reduce((acc: number, t: TopicAssessmentSummary) => acc + t.confidence, 0) /
            assessedTopics.length) *
            100
        ) / 100
      : 0;

  const recommendedNextConcept =
    rootCauses.length > 0
      ? rootCauses[0].rootId
      : (TOPICS.fractions?.targets[0] || null);

  const totalPrereqProbes = Object.values(state.topicStates).reduce(
    (acc: number, ts: TopicMasteryState | undefined) => acc + (ts?.prerequisiteProbesCount || 0),
    0
  );

  return {
    studentId: state.studentId,

    subjectId: state.subjectId,
    topics: topicsSummary,
    rootCauses,
    overallMastery,
    overallConfidence,
    recommendedNextConcept,
    assessmentStats: {
      totalQuestions: state.responses.length,
      topicsAssessed: assessedTopics.length,
      prerequisiteProbes: totalPrereqProbes,
    },
  };
}

export interface StepEvaluationOutput {
  nextState: AssessmentAgentState;
  nextQuestion: Question | null;
  decision: AgentDecisionRecord;
}

/**
 * Deterministic Adaptive Evaluation and Next Step Engine.
 *
 * Implements:
 * 1. Bayesian topic mastery updates.
 * 2. Prerequisite backtracking when a student fails.
 * 3. Dynamic stopping rule per topic (minimum 2, maximum 6 questions).
 * 4. Automatic progression to the next required topic until all 4 topics are diagnosed.
 * 5. Full synthesis without hardcoded student identities.
 */
export function evaluateAndDecideStep(
  state: AssessmentAgentState,
  lastResponse?: Response,
  rng: Rng = makeRng(Date.now())
): StepEvaluationOutput {
  const nextState: AssessmentAgentState = {
    ...state,
    responses: lastResponse ? [...state.responses, lastResponse] : [...state.responses],
    visitedConcepts: [...state.visitedConcepts],
    probedConcepts: [...state.probedConcepts],
    topicStates: { ...state.topicStates },
    decisions: [...state.decisions],
  };

  const currentTopic = nextState.currentTopic;
  const currentTopicTargets = TOPICS[currentTopic]?.targets || [];

  // Update current topic state with the new response
  const tState: TopicMasteryState = nextState.topicStates[currentTopic]
    ? { ...nextState.topicStates[currentTopic]! }
    : {
        topicId: currentTopic,
        mastery: 0,
        confidence: 0,
        status: "not_assessed",
        attempts: 0,
        correct: 0,
        difficultyProgression: [],
        misconceptions: [],
        evidenceCount: 0,
        prerequisiteProbesCount: 0,
        probedPrerequisites: [],
      };

  if (lastResponse) {
    tState.attempts++;
    tState.evidenceCount++;
    if (lastResponse.correct) {
      tState.correct++;
    } else if (
      lastResponse.classification !== "correct" &&
      lastResponse.classification !== "unclassified" &&
      !tState.misconceptions.includes(lastResponse.classification)
    ) {
      tState.misconceptions.push(lastResponse.classification);
    }
    tState.difficultyProgression.push(lastResponse.difficulty);

    // Filter all responses in this session relevant to this topic or its probed prerequisites
    const relevantResps = nextState.responses.filter((r: Response) =>
      currentTopicTargets.includes(r.conceptId) ||
      tState.probedPrerequisites.includes(r.conceptId) ||
      r.conceptId === nextState.currentConcept
    );

    let alpha = 1;
    let beta = 1;
    relevantResps.forEach((r: Response, idx: number) => {
      const weight = 0.8 + 0.4 * ((idx + 1) / relevantResps.length);
      if (r.correct) alpha += weight;
      else beta += weight;
    });

    const topicMastery = alpha / (alpha + beta);
    const topicConfidence = Math.min(0.98, relevantResps.length / (relevantResps.length + 2.0));

    tState.mastery = Math.round(topicMastery * 100) / 100;
    tState.confidence = Math.round(topicConfidence * 100) / 100;

    if (tState.mastery >= 0.75) tState.status = "mastered";
    else if (tState.mastery >= 0.50) tState.status = "developing";
    else tState.status = "needs_support";

    nextState.topicStates[currentTopic] = tState;
  }

  const topicResponses = nextState.responses.filter((r: Response) =>
    currentTopicTargets.includes(r.conceptId) ||
    tState.probedPrerequisites.includes(r.conceptId)
  );

  const MIN_QUESTIONS_PER_TOPIC = 2;
  const MAX_QUESTIONS_PER_TOPIC = 6;
  const MAX_PREREQ_PROBES_PER_TOPIC = 3;
  const MAX_TOTAL_QUESTIONS = 24;

  const totalQuestions = nextState.responses.length;

  // Global budget safeguard
  if (totalQuestions >= MAX_TOTAL_QUESTIONS) {
    const finalDecision: AgentDecisionRecord = {
      step: nextState.decisions.length + 1,
      action: "FINISH_ASSESSMENT",
      topicId: currentTopic,
      conceptId: nextState.currentConcept,
      difficulty: nextState.currentDifficulty,
      reason: "Maximum total assessment budget reached. Evidence across curriculum synthesized.",
      confidence: 0.95,
      studentFeedbackPrompt: "Assessment completed! Generating learning profile.",
      source: "deterministic",
    };
    nextState.decisions.push(finalDecision);
    nextState.assessmentComplete = true;
    nextState.diagnosticResult = buildDiagnosticResult(nextState);
    return { nextState, nextQuestion: null, decision: finalDecision };
  }

  // Helper to transition to next topic
  const moveToNextTopic = (reason: string, confidence: number): StepEvaluationOutput => {
    tState.reason = reason;
    nextState.topicStates[currentTopic] = tState;

    const nextIndex = nextState.currentTopicIndex + 1;
    if (nextIndex < nextState.topics.length) {
      const nextTopic = nextState.topics[nextIndex];
      const nextTargets = TOPICS[nextTopic]?.targets || [];
      const nextConcept = nextTargets[0] || "mult_facts";
      const nextDifficulty: Difficulty = 2;

      nextState.currentTopicIndex = nextIndex;
      nextState.currentTopic = nextTopic;
      nextState.currentConcept = nextConcept;
      nextState.currentDifficulty = nextDifficulty;
      if (!nextState.visitedConcepts.includes(nextConcept)) {
        nextState.visitedConcepts.push(nextConcept);
      }

      const decision: AgentDecisionRecord = {
        step: nextState.decisions.length + 1,
        action: "MOVE_TO_NEXT_TOPIC",
        topicId: nextTopic,
        conceptId: nextConcept,
        difficulty: nextDifficulty,
        reason: `${reason} Transitioning to ${TOPIC_DISPLAY_NAMES[nextTopic].en} at standard level (${nextConcept}).`,
        confidence,
        studentFeedbackPrompt: "Let's check the next topic.",
        source: "deterministic",
      };
      nextState.decisions.push(decision);

      const nextQuestion = generateQuestion(nextConcept, nextDifficulty, rng);
      return { nextState, nextQuestion, decision };
    } else {
      // Assessment Completed across all topics!
      const finishDecision: AgentDecisionRecord = {
        step: nextState.decisions.length + 1,
        action: "FINISH_ASSESSMENT",
        topicId: currentTopic,
        conceptId: nextState.currentConcept,
        difficulty: nextState.currentDifficulty,
        reason: "All 4 curriculum topics thoroughly assessed with adaptive confidence.",
        confidence: 0.95,
        studentFeedbackPrompt: "Assessment completed! Preparing your learning profile.",
        source: "deterministic",
      };
      nextState.decisions.push(finishDecision);
      nextState.assessmentComplete = true;
      nextState.diagnosticResult = buildDiagnosticResult(nextState);
      return { nextState, nextQuestion: null, decision: finishDecision };
    }
  };

  // 1. Initial question for fresh session
  if (!lastResponse) {
    const q = generateQuestion(nextState.currentConcept, nextState.currentDifficulty, rng);
    return { nextState, nextQuestion: q, decision: nextState.decisions[0] };
  }

  const lastCorrect = lastResponse.correct;
  const lastConcept = lastResponse.conceptId;

  // 2. High-Confidence Early Exit (Student A / Student C behavior)
  // If student answered >= 2 items on this topic and ALL were correct at level >= 2
  const topicCorrectCount = topicResponses.filter((r: Response) => r.correct).length;
  const topicIncorrectCount = topicResponses.filter((r: Response) => !r.correct).length;

  if (
    topicResponses.length >= MIN_QUESTIONS_PER_TOPIC &&
    topicIncorrectCount === 0 &&
    tState.mastery >= 0.75
  ) {
    return moveToNextTopic(
      `High-confidence mastery established on ${TOPIC_DISPLAY_NAMES[currentTopic].en} (${topicCorrectCount}/${topicResponses.length} correct).`,
      tState.confidence
    );
  }

  // 3. Adaptive Backtracking (Student A / Student B behavior)
  // If student failed last item, investigate prerequisites
  if (!lastCorrect) {
    const directPrereqs = prerequisitesOf(lastConcept);
    const unprobedPrereq = directPrereqs.find(
      (p: ConceptId) => !nextState.responses.some((r: Response) => r.conceptId === p)
    );

    if (unprobedPrereq && tState.prerequisiteProbesCount < MAX_PREREQ_PROBES_PER_TOPIC) {
      tState.prerequisiteProbesCount++;
      tState.probedPrerequisites.push(unprobedPrereq);
      nextState.topicStates[currentTopic] = tState;

      nextState.currentConcept = unprobedPrereq;
      nextState.currentDifficulty = 2;
      if (!nextState.visitedConcepts.includes(unprobedPrereq)) {
        nextState.visitedConcepts.push(unprobedPrereq);
      }
      if (!nextState.probedConcepts.includes(unprobedPrereq)) {
        nextState.probedConcepts.push(unprobedPrereq);
      }

      const decision: AgentDecisionRecord = {
        step: nextState.decisions.length + 1,
        action: "PROBE_PREREQUISITE",
        topicId: currentTopic,
        conceptId: unprobedPrereq,
        difficulty: 2,
        reason: `Student struggled with ${lastConcept} (${lastResponse.classification}). Backtracking down prerequisite chain to probe foundational concept: ${unprobedPrereq}.`,
        confidence: 0.65,
        studentFeedbackPrompt: "Checking a related concept...",
        source: "deterministic",
      };
      nextState.decisions.push(decision);

      const q = generateQuestion(unprobedPrereq, 2, rng, {
        link: { conceptId: lastConcept, meta: {} },
      });
      return { nextState, nextQuestion: q, decision };
    }
  }

  // 4. If student just succeeded on a prerequisite probe
  const isLastConceptPrereq = tState.probedPrerequisites.includes(lastConcept);
  if (lastCorrect && isLastConceptPrereq) {
    // Prerequisite was verified! So the root cause is in bridging or the higher topic concept itself.
    if (topicResponses.length >= 3) {
      return moveToNextTopic(
        `Prerequisite ${lastConcept} confirmed fluent. Diagnostic gap isolated to bridging concept in ${TOPIC_DISPLAY_NAMES[currentTopic].en}.`,
        0.82
      );
    }
  }

  // 5. Check if topic evidence threshold reached (3-5 questions with clear status or max reached)
  if (
    topicResponses.length >= 3 &&
    (topicIncorrectCount >= 2 || topicResponses.length >= MAX_QUESTIONS_PER_TOPIC)
  ) {
    const conclusionStatus = tState.status;
    return moveToNextTopic(
      `Diagnostic evidence sufficient for ${TOPIC_DISPLAY_NAMES[currentTopic].en} (${topicResponses.length} probes administered, status: ${conclusionStatus}).`,
      tState.confidence
    );
  }

  // 6. Otherwise, continue testing within topic with difficulty adaptation
  let nextDifficulty: Difficulty = 2;
  let nextConceptToTest = currentTopicTargets.find((c: ConceptId) => c !== lastConcept) || currentTopicTargets[0];


  if (lastCorrect) {
    nextDifficulty = Math.min(3, ((lastResponse.difficulty + 1) as Difficulty)) as Difficulty;
  } else {
    nextDifficulty = Math.max(1, ((lastResponse.difficulty - 1) as Difficulty)) as Difficulty;
  }

  nextState.currentConcept = nextConceptToTest;
  nextState.currentDifficulty = nextDifficulty;
  if (!nextState.visitedConcepts.includes(nextConceptToTest)) {
    nextState.visitedConcepts.push(nextConceptToTest);
  }

  const action: AgentAction =
    lastCorrect && nextDifficulty > lastResponse.difficulty
      ? "INCREASE_DIFFICULTY"
      : !lastCorrect && nextDifficulty < lastResponse.difficulty
      ? "DECREASE_DIFFICULTY"
      : "CONTINUE_TOPIC";

  const decision: AgentDecisionRecord = {
    step: nextState.decisions.length + 1,
    action,
    topicId: currentTopic,
    conceptId: nextConceptToTest,
    difficulty: nextDifficulty,
    reason: `Continuing evaluation on ${TOPIC_DISPLAY_NAMES[currentTopic].en} (${nextConceptToTest} at Difficulty ${nextDifficulty}).`,
    confidence: tState.confidence,
    studentFeedbackPrompt: "Let's try one more question.",
    source: "deterministic",
  };
  nextState.decisions.push(decision);

  const q = generateQuestion(nextConceptToTest, nextDifficulty, rng);
  return { nextState, nextQuestion: q, decision };
}

/**
 * Legacy adaptive helper kept for backwards compatibility.
 */
export interface AdaptiveStepResult {
  nextQuestion: ReturnType<typeof generateQuestion> | null;
  reasoning: string;
  isComplete: boolean;
  isolatedRoot?: ConceptId;
}

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

  if (responses.length === 0) {
    const q = generateQuestion(targetConceptId, 2, rng);
    return {
      nextQuestion: q,
      reasoning: `Beginning diagnostic assessment on concept: ${targetConceptId} at Grade level (Difficulty 2).`,
      isComplete: false,
    };
  }

  const lastResp = responses[responses.length - 1];
  const lastConcept = lastResp.conceptId;

  if (!lastResp.correct) {
    const prereqs = prerequisitesOf(lastConcept);
    const evaluatedConcepts = new Set(responses.map((r) => r.conceptId));
    const nextPrereq = prereqs.find((p) => !evaluatedConcepts.has(p));

    if (nextPrereq) {
      const q = generateQuestion(nextPrereq, 2, rng, {
        link: { conceptId: lastConcept, meta: {} },
      });
      return {
        nextQuestion: q,
        reasoning: `Student struggled with ${lastConcept} (${lastResp.classification}). Backtracking to probe prerequisite: ${nextPrereq}.`,
        isComplete: false,
      };
    } else {
      const sameConceptResps = responses.filter((r) => r.conceptId === lastConcept);
      if (sameConceptResps.length === 1) {
        const q = generateQuestion(lastConcept, 1, rng);
        return {
          nextQuestion: q,
          reasoning: `Testing foundational Level 1 scaffold for ${lastConcept}.`,
          isComplete: false,
        };
      }
    }
  }

  if (lastResp.correct) {
    const failedConcepts = responses.filter((r) => !r.correct).map((r) => r.conceptId);
    if (failedConcepts.length > 0 && lastConcept !== targetConceptId) {
      const roots = findRootCauses(responses);
      return {
        nextQuestion: null,
        reasoning: `Student verified prerequisite fluency on ${lastConcept}. Diagnosed gap is isolated to bridging concept: ${failedConcepts[0]}.`,
        isComplete: true,
        isolatedRoot: roots[0]?.rootId || failedConcepts[0],
      };
    }

    const targetResps = responses.filter((r) => r.conceptId === targetConceptId);
    if (targetResps.length === 1) {
      const q = generateQuestion(targetConceptId, 3, rng);
      return {
        nextQuestion: q,
        reasoning: `Student answered target concept correctly. Testing application challenge (Difficulty 3) to confirm mastery.`,
        isComplete: false,
      };
    } else {
      return {
        nextQuestion: null,
        reasoning: `Student demonstrated consistent conceptual fluency on ${targetConceptId}.`,
        isComplete: true,
      };
    }
  }

  const q = generateQuestion(targetConceptId, 2, rng);
  return {
    nextQuestion: q,
    reasoning: `Administering follow-up verification item on ${targetConceptId}.`,
    isComplete: false,
  };
}

