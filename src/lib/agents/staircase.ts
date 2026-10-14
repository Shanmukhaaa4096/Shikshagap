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
  SessionMemory,
  TopicId,
  TopicMemory,
  TopicStatus,
} from "@/lib/types";

export type StaircaseAction =
  | { type: "ask"; topicId: TopicId; conceptId: ConceptId; level: 1 | 2 | 3 }
  | { type: "close_topic"; topicId: TopicId; status: TopicStatus }
  | { type: "finish" };

export const DEFAULT_TOPICS: TopicId[] = [
  "number_ops",
  "multiplication",
  "division",
  "fractions",
];

/**
 * Returns the primary target concept for a given topic and grade.
 */
export function getConceptForTopic(topicId: TopicId, grade: 3 | 4 | 5): ConceptId {
  switch (topicId) {
    case "number_ops":
      return grade === 3 ? "number_sense" : "place_value";
    case "multiplication":
      return grade === 3 ? "mult_concept" : "mult_facts";
    case "division":
      return grade === 3 || grade === 4 ? "division_concept" : "division_facts";
    case "fractions":
      return grade === 4 ? "fraction_basics" : "equivalent_fractions";
    default:
      return "number_sense";
  }
}

/**
 * Creates a clean initial SessionMemory object.
 */
export function createSessionMemory(
  pseudonymousId: string,
  grade: 3 | 4 | 5 = 5,
  language: "en" | "hi" | "te" = "en",
  topics: TopicId[] = DEFAULT_TOPICS
): SessionMemory {
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
  };
}

/**
 * Maps a concept to its foundational prerequisite for diagnostic probing.
 * Grounded directly in the curriculum dependency DAG (CONCEPTS).
 */
export function getPrerequisiteForConcept(
  conceptId: ConceptId,
  errorType?: string
): ConceptId {
  if (conceptId === "division_facts" || conceptId === "long_division") {
    // If error indicates sharing concept confusion, probe division_concept;
    // if table slip / factor error / default, probe mult_facts
    if (errorType === "wrong_operation" || errorType === "sharing_error" || errorType === "sharing" || errorType?.includes("sharing")) {
      return "division_concept";
    }
    return "mult_facts";
  }
  if (conceptId === "division_concept") {
    return "mult_concept";
  }
  if (conceptId === "equivalent_fractions" || conceptId === "comparing_fractions" || conceptId === "fraction_addition") {
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
  // If we have already stepped beyond all topics, finish.
  if (memory.currentTopicIndex >= memory.topics.length) {
    return { type: "finish" };
  }

  const currentTopic = memory.topics[memory.currentTopicIndex];
  if (!currentTopic) {
    return { type: "finish" };
  }

  // If the current topic is already closed, check if next topic is available.
  if (currentTopic.status !== "pending") {
    const nextIdx = memory.currentTopicIndex + 1;
    if (nextIdx >= memory.topics.length) {
      return { type: "finish" };
    }
    const nextTopic = memory.topics[nextIdx];
    return {
      type: "ask",
      topicId: nextTopic.topicId,
      conceptId: getConceptForTopic(nextTopic.topicId, memory.grade),
      level: 2,
    };
  }

  // Combine topic attempts with lastAttempt if lastAttempt is not already present
  const attempts: Attempt[] = [...currentTopic.attempts];
  if (
    lastAttempt &&
    !attempts.some((a) => a.questionId === lastAttempt.questionId)
  ) {
    attempts.push(lastAttempt);
  }

  // Case 1: Start at level 2
  if (attempts.length === 0) {
    return {
      type: "ask",
      topicId: currentTopic.topicId,
      conceptId: getConceptForTopic(currentTopic.topicId, memory.grade),
      level: 2,
    };
  }
  // Case 2: 1 attempt made
  if (attempts.length === 1) {
    const first = attempts[0];
    if (first.correct) {
      // Demonstrated proficiency at level 2 -> test mastery at level 3
      return {
        type: "ask",
        topicId: currentTopic.topicId,
        conceptId: first.conceptId,
        level: 3,
      };
    } else {
      // Struggled at level 2 -> investigate foundational prerequisite at level 1
      const prereqConcept = getPrerequisiteForConcept(first.conceptId, first.errorType);
      return {
        type: "ask",
        topicId: currentTopic.topicId,
        conceptId: prereqConcept,
        level: 1,
      };
    }
  }

  // Case 3: 2 attempts made -> Topic closes with definitive status
  const first = attempts[0];
  const second = attempts[1];
  let status: TopicStatus;

  if (first.correct && second.correct) {
    // Correct at 2 -> Correct at 3 -> mastered
    status = "mastered";
  } else if (!first.correct && !second.correct) {
    // Wrong at 2 -> Wrong at 1 -> gap
    status = "gap";
  } else {
    // Correct at 2 -> Wrong at 3 -> developing
    // OR Wrong at 2 -> Correct at 1 -> developing
    status = "developing";
  }

  return {
    type: "close_topic",
    topicId: currentTopic.topicId,
    status,
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
    const existing = t.attempts.some((a) => a.questionId === attempt.questionId);
    return {
      ...t,
      attempts: existing ? t.attempts : [...t.attempts, attempt],
      notes: [...t.notes],
      misconceptions: t.misconceptions ? [...t.misconceptions] : [],
    };
  });

  let currentIdx = memory.currentTopicIndex;
  const currentTopic = updatedTopics[currentIdx];

  const memWithAttempt: SessionMemory = {
    ...memory,
    topics: updatedTopics,
    currentTopicIndex: currentIdx,
    seenSignatures: memory.seenSignatures ? [...memory.seenSignatures] : [],
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

  return {
    memory: memWithAttempt,
    action,
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
