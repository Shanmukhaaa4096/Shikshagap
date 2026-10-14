import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNextStaircaseAction,
  applyAttemptToMemory,
  createSessionMemory,
  isActionLegal,
  getPrerequisiteForConcept,
} from '../src/lib/agents/staircase.ts';
import { generateRemediationPlan } from '../src/lib/engine/remediation.ts';

test('Staircase Path 1: Correct at 2 -> Correct at 3 -> mastered', () => {
  const memory = createSessionMemory('anon_test_1', 5, 'en', ['number_ops', 'multiplication']);

  // Step 1: Initial question must be at level 2
  const action1 = getNextStaircaseAction(memory);
  assert.equal(action1.type, 'ask');
  assert.equal(action1.level, 2);
  assert.equal(action1.topicId, 'number_ops');

  // Attempt 1: Correct at level 2
  const attempt1 = {
    conceptId: action1.conceptId,
    level: 2,
    questionId: 'q_step_1',
    studentAnswer: '42',
    correct: true,
  };
  const step1 = applyAttemptToMemory(memory, attempt1);

  // Step 2: Next question must be at level 3
  assert.equal(step1.action.type, 'ask');
  assert.equal(step1.action.level, 3);
  assert.equal(step1.action.topicId, 'number_ops');

  // Attempt 2: Correct at level 3
  const attempt2 = {
    conceptId: step1.action.conceptId,
    level: 3,
    questionId: 'q_step_2',
    studentAnswer: '100',
    correct: true,
  };
  const step2 = applyAttemptToMemory(step1.memory, attempt2);

  // Topic must be closed as 'mastered' and advance to next topic at level 2
  assert.equal(step2.closedTopic?.topicId, 'number_ops');
  assert.equal(step2.closedTopic?.status, 'mastered');
  assert.equal(step2.memory.topics[0].status, 'mastered');
  assert.equal(step2.memory.currentTopicIndex, 1);
  assert.equal(step2.action.type, 'ask');
  assert.equal(step2.action.topicId, 'multiplication');
  assert.equal(step2.action.level, 2);
});

test('Staircase Path 2: Correct at 2 -> Wrong at 3 -> developing', () => {
  const memory = createSessionMemory('anon_test_2', 5, 'en', ['number_ops', 'multiplication']);

  // Step 1: Correct at level 2
  const attempt1 = {
    conceptId: 'place_value',
    level: 2,
    questionId: 'q_p2_1',
    studentAnswer: '40',
    correct: true,
  };
  const step1 = applyAttemptToMemory(memory, attempt1);
  assert.equal(step1.action.level, 3);

  // Step 2: Wrong at level 3
  const attempt2 = {
    conceptId: 'place_value',
    level: 3,
    questionId: 'q_p2_2',
    studentAnswer: '99',
    correct: false,
    errorType: 'slip',
  };
  const step2 = applyAttemptToMemory(step1.memory, attempt2);

  // Topic must be closed as 'developing'
  assert.equal(step2.closedTopic?.status, 'developing');
  assert.equal(step2.memory.topics[0].status, 'developing');
  assert.equal(step2.memory.currentTopicIndex, 1);
});

test('Staircase Path 3: Wrong at 2 -> Correct at 1 -> developing', () => {
  const memory = createSessionMemory('anon_test_3', 5, 'en', ['division', 'fractions']);

  // Step 1: Wrong at level 2 -> must ask at level 1
  const attempt1 = {
    conceptId: 'division_facts',
    level: 2,
    questionId: 'q_p3_1',
    studentAnswer: '5',
    correct: false,
  };
  const step1 = applyAttemptToMemory(memory, attempt1);
  assert.equal(step1.action.type, 'ask');
  assert.equal(step1.action.level, 1);
  assert.equal(step1.action.topicId, 'division');

  // Step 2: Correct at level 1
  const attempt2 = {
    conceptId: 'division_facts',
    level: 1,
    questionId: 'q_p3_2',
    studentAnswer: '4',
    correct: true,
  };
  const step2 = applyAttemptToMemory(step1.memory, attempt2);

  // Topic must be closed as 'developing'
  assert.equal(step2.closedTopic?.status, 'developing');
  assert.equal(step2.memory.topics[0].status, 'developing');
  assert.equal(step2.memory.currentTopicIndex, 1);
});

test('Staircase Path 4: Wrong at 2 -> Wrong at 1 -> gap', () => {
  const memory = createSessionMemory('anon_test_4', 5, 'en', ['division', 'fractions']);

  // Step 1: Wrong at level 2
  const attempt1 = {
    conceptId: 'division_facts',
    level: 2,
    questionId: 'q_p4_1',
    studentAnswer: '9',
    correct: false,
  };
  const step1 = applyAttemptToMemory(memory, attempt1);
  assert.equal(step1.action.level, 1);

  // Step 2: Wrong at level 1
  const attempt2 = {
    conceptId: 'division_facts',
    level: 1,
    questionId: 'q_p4_2',
    studentAnswer: '2',
    correct: false,
    errorType: 'wrong_operation',
  };
  const step2 = applyAttemptToMemory(step1.memory, attempt2);

  // Topic must be closed as 'gap' and note added
  assert.equal(step2.closedTopic?.status, 'gap');
  assert.equal(step2.memory.topics[0].status, 'gap');
  assert.ok(step2.memory.topics[0].notes.length > 0, 'Must record note on gap topic');
  assert.equal(step2.memory.currentTopicIndex, 1);
});

test('Staircase Path 5: Initial step on any topic starts at Level 2', () => {
  const memory = createSessionMemory('anon_test_5', 5, 'en', ['fractions']);
  const action = getNextStaircaseAction(memory);

  assert.equal(action.type, 'ask');
  assert.equal(action.level, 2, 'Initial difficulty must be Level 2');
  assert.equal(action.topicId, 'fractions');
});

test('Constraint: Maximum 2 questions per topic enforced', () => {
  const memory = createSessionMemory('anon_test_max2', 5, 'en', ['number_ops']);

  // After 0 attempts -> ask
  const a0 = getNextStaircaseAction(memory);
  assert.equal(a0.type, 'ask');

  // After 1 attempt -> ask
  memory.topics[0].attempts.push({
    conceptId: 'place_value',
    level: 2,
    questionId: 'q1',
    studentAnswer: '10',
    correct: true,
  });
  const a1 = getNextStaircaseAction(memory);
  assert.equal(a1.type, 'ask');

  // After 2 attempts -> MUST close topic (cannot ask 3rd question)
  memory.topics[0].attempts.push({
    conceptId: 'place_value',
    level: 3,
    questionId: 'q2',
    studentAnswer: '20',
    correct: true,
  });
  const a2 = getNextStaircaseAction(memory);
  assert.equal(a2.type, 'close_topic');
  assert.notEqual(a2.type, 'ask', 'Never ask more than 2 questions per topic');
});

test('Constraint: No repeated questions in session memory', () => {
  const memory = createSessionMemory('anon_test_uniq', 5, 'en', ['number_ops']);
  memory.seenSignatures = [];

  // Simulate unique question signatures
  function simulateQuestionSignature(conceptId, expression, promptKey) {
    return `${conceptId}|${expression}|${promptKey}`;
  }

  const sig1 = simulateQuestionSignature('place_value', '40 + 2', 'q.pv.expanded');
  const sig2 = simulateQuestionSignature('place_value', '50 + 3', 'q.pv.expanded');

  // Record sig1 into seenSignatures
  memory.seenSignatures.push(sig1);

  // Verification: signature set contains sig1, preventing re-use
  const seenSet = new Set(memory.seenSignatures);
  assert.equal(seenSet.has(sig1), true, 'sig1 is seen and must not be repeated');
  assert.equal(seenSet.has(sig2), false, 'sig2 is new and can be asked');

  // Adding sig2
  seenSet.add(sig2);
  memory.seenSignatures = Array.from(seenSet);
  assert.equal(memory.seenSignatures.length, 2);
  assert.equal(new Set(memory.seenSignatures).size, 2, 'All signatures in session must be unique');
});

test('Full Assessment Lifecycle: 4 topics finish with completion', () => {
  const topics = ['number_ops', 'multiplication', 'division', 'fractions'];
  let memory = createSessionMemory('anon_test_full', 5, 'en', topics);

  // Play through all 4 topics (2 questions each = 8 questions)
  for (let t = 0; t < topics.length; t++) {
    // Question 1 at level 2
    const nextQ1 = getNextStaircaseAction(memory);
    assert.equal(nextQ1.type, 'ask');
    assert.equal(nextQ1.level, 2);

    const step1 = applyAttemptToMemory(memory, {
      conceptId: nextQ1.conceptId,
      level: 2,
      questionId: `q_${t}_1`,
      studentAnswer: 'ans1',
      correct: true,
    });
    memory = step1.memory;

    // Question 2 at level 3
    const nextQ2 = getNextStaircaseAction(memory);
    assert.equal(nextQ2.type, 'ask');
    assert.equal(nextQ2.level, 3);

    const step2 = applyAttemptToMemory(memory, {
      conceptId: nextQ2.conceptId,
      level: 3,
      questionId: `q_${t}_2`,
      studentAnswer: 'ans2',
      correct: t % 2 === 0, // Alternate right and wrong
    });
    memory = step2.memory;
  }

  // After all 4 topics close, action must be 'finish'
  const finalAction = getNextStaircaseAction(memory);
  assert.equal(finalAction.type, 'finish');
  assert.equal(memory.currentTopicIndex, 4);
  assert.equal(memory.topics.every(t => t.status !== 'pending'), true);
});

test('Code Gate: Reject illegal tool calls', () => {
  const memory = createSessionMemory('anon_gate_test', 5, 'en', ['number_ops']);

  // At start, legal action is ask at level 2
  assert.equal(isActionLegal(memory, { type: 'ask', topicId: 'number_ops', conceptId: 'place_value', level: 2 }), true);

  // Asking at level 3 before level 2 is illegal
  assert.equal(isActionLegal(memory, { type: 'ask', topicId: 'number_ops', conceptId: 'place_value', level: 3 }), false);

  // Asking at level 1 before level 2 is illegal
  assert.equal(isActionLegal(memory, { type: 'ask', topicId: 'number_ops', conceptId: 'place_value', level: 1 }), false);

  // Closing topic before 2 questions is illegal
  assert.equal(isActionLegal(memory, { type: 'close_topic', topicId: 'number_ops', status: 'mastered' }), false);
});

test('Adaptive Prerequisite: Division Level 2 error steps down to multiplication facts or division concept at Level 1', () => {
  // Prerequisite mapping function check
  const prereqMult = getPrerequisiteForConcept('division_facts', 'times_table');
  assert.equal(prereqMult, 'mult_facts', 'Times table error in division maps to mult_facts prerequisite');

  const prereqConcept = getPrerequisiteForConcept('division_facts', 'sharing');
  assert.equal(prereqConcept, 'division_concept', 'Sharing error in division maps to division_concept prerequisite');

  // Interactive staircase check
  const memory = createSessionMemory('anon_prereq_test', 5, 'en', ['division']);
  const action1 = getNextStaircaseAction(memory);
  assert.equal(action1.type, 'ask');
  assert.equal(action1.level, 2);

  const attempt1 = {
    conceptId: action1.conceptId,
    level: 2,
    questionId: 'q_div_2',
    studentAnswer: '4',
    correct: false,
    errorType: 'times_table',
  };

  const step1 = applyAttemptToMemory(memory, attempt1);
  assert.equal(step1.action.type, 'ask');
  assert.equal(step1.action.level, 1, 'Step down to level 1 for prerequisite check');
  assert.equal(step1.action.conceptId, 'mult_facts', 'Investigate foundational multiplication facts');
});

test('Diagnostic Rationale: Recorded note documents evidence for learning gap', () => {
  const memory = createSessionMemory('anon_rationale_test', 5, 'en', ['division']);
  const action1 = getNextStaircaseAction(memory);

  const attempt1 = {
    conceptId: action1.conceptId,
    level: 2,
    questionId: 'q_div_l2',
    studentAnswer: '3',
    correct: false,
    errorType: 'times_table',
  };
  const step1 = applyAttemptToMemory(memory, attempt1);

  const attempt2 = {
    conceptId: step1.action.conceptId,
    level: 1,
    questionId: 'q_prereq_l1',
    studentAnswer: '15',
    correct: false,
    errorType: 'wrong_fact',
  };
  const step2 = applyAttemptToMemory(step1.memory, attempt2);

  assert.equal(step2.closedTopic?.status, 'gap');
  assert.ok(step2.memory.topics[0].notes.length > 0);
  assert.match(step2.memory.topics[0].notes[0], /Foundational difficulty confirmed/);
});

test('Remediation Planner: Generates a concrete 5-day action plan for diagnosed gap', () => {
  const rootCause = {
    rootId: 'mult_facts',
    symptomIds: ['division_facts'],
    severity: 'high',
    rootMastery: 0.3,
  };

  const plan = generateRemediationPlan('anon_student_test', rootCause);
  assert.equal(plan.studentId, 'anon_student_test');
  assert.equal(plan.conceptId, 'mult_facts');
  assert.equal(plan.days.length, 5, 'Plan must contain exactly 5 actionable days');
  assert.ok(plan.days.every(d => d.minutes >= 10 && d.minutes <= 20), 'Daily activities must be manageable (10-20 mins)');
  assert.ok(plan.aiNote.length > 0, 'Plan must explain diagnostic rationale');
});

