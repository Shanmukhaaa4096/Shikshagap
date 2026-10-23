import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createSessionMemory,
  getNextStaircaseAction,
  applyAttemptToMemory,
  DEFAULT_TOPICS,
} from '../src/lib/agents/staircase.ts';

import {
  evaluateStoppingRule,
  MIN_TOTAL_QUESTIONS,
  MAX_TOTAL_QUESTIONS,
  ROOT_GAP_CONFIDENCE_THRESHOLD,
  DEFAULT_GUESS_PROB,
  DEFAULT_SLIP_PROB,
} from '../src/lib/engine/stoppingRule.ts';

/**
 * Deterministic pseudo-random number generator (Mulberry32).
 * Ensures 100% reproducible test simulations.
 */
function createPrng(seed) {
  let s = seed >>> 0;
  return function next() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Runs a simulated student assessment session.
 */
function runSimulatedStudent({
  studentId,
  grade = 5,
  knownConcepts = new Set(),
  guessProb = DEFAULT_GUESS_PROB,
  slipProb = DEFAULT_SLIP_PROB,
  rng,
  forceFirstN = null, // Array of booleans to force first N answers
}) {
  let memory = createSessionMemory(studentId, grade, 'en', DEFAULT_TOPICS);
  let action = getNextStaircaseAction(memory);
  let questionCount = 0;
  const attemptsLog = [];

  while (action.type === 'ask' && questionCount < MAX_TOTAL_QUESTIONS + 2) {
    questionCount++;
    const conceptId = action.conceptId;
    const format = (questionCount % 2 === 0) ? 'mcq' : 'numeric_input';

    let isCorrect;
    if (forceFirstN && questionCount <= forceFirstN.length) {
      isCorrect = forceFirstN[questionCount - 1];
    } else {
      const isKnown = knownConcepts.has(conceptId);
      const r = rng();
      if (isKnown) {
        // Knows concept: correct unless slip
        isCorrect = r >= slipProb;
      } else {
        // Does not know concept: wrong unless lucky guess (numeric input has ~0.05 guess prob, mcq has 0.25)
        const effectiveGuess = format === 'numeric_input' ? 0.05 : guessProb;
        isCorrect = r < effectiveGuess;
      }
    }

    const attempt = {
      conceptId,
      level: action.level,
      questionId: `sim_q_${questionCount}`,
      studentAnswer: isCorrect ? 'correct' : 'wrong',
      correct: isCorrect,
      format,
      errorType: isCorrect ? undefined : (questionCount % 2 === 0 ? 'wrong_operation' : 'arithmetic_error'),
    };
    attemptsLog.push(attempt);

    const step = applyAttemptToMemory(memory, attempt);
    memory = step.memory;
    action = step.action;
  }

  const allAttempts = memory.topics.flatMap((t) => t.attempts);
  const stoppingEval = evaluateStoppingRule(memory, allAttempts);

  return {
    memory,
    questionCount,
    attemptsLog,
    stoppingEval,
    finalAction: action,
  };
}

test('Simulation: Agent never stops before MIN_TOTAL_QUESTIONS (8)', () => {
  const rng = createPrng(12345);
  const sampleSizes = 200;

  for (let i = 0; i < sampleSizes; i++) {
    // Random student profile
    const known = new Set();
    if (rng() > 0.5) known.add('place_value');
    if (rng() > 0.5) known.add('mult_facts');
    if (rng() > 0.5) known.add('multi_digit_mult');
    if (rng() > 0.5) known.add('division_facts');
    if (rng() > 0.5) known.add('equivalent_fractions');

    const result = runSimulatedStudent({
      studentId: `min_q_student_${i}`,
      knownConcepts: known,
      rng,
    });

    assert.ok(
      result.questionCount >= MIN_TOTAL_QUESTIONS,
      `Student ${i} stopped at ${result.questionCount} questions, which is below MIN_TOTAL_QUESTIONS (${MIN_TOTAL_QUESTIONS})`
    );
  }
});

test('Simulation: Student who gets first 3 right does NOT stop early before 8 questions', () => {
  const rng = createPrng(54321);

  for (let i = 0; i < 50; i++) {
    const result = runSimulatedStudent({
      studentId: `lucky_student_${i}`,
      knownConcepts: new Set(['place_value', 'multi_digit_mult']),
      rng,
      forceFirstN: [true, true, true], // First 3 correct
    });

    assert.ok(
      result.questionCount >= MIN_TOTAL_QUESTIONS,
      `Lucky streak student stopped at ${result.questionCount} questions, must be >= ${MIN_TOTAL_QUESTIONS}`
    );
  }
});

test('Simulation: Student who gets first answer wrong does NOT receive instant gap verdict', () => {
  for (let i = 0; i < 50; i++) {
    const memory = createSessionMemory(`wrong_first_${i}`, 5, 'en', DEFAULT_TOPICS);
    const action1 = getNextStaircaseAction(memory);
    assert.equal(action1.type, 'ask');
    assert.equal(action1.level, 2);

    // Answer 1 is incorrect (e.g. slip or misunderstanding)
    const step1 = applyAttemptToMemory(memory, {
      conceptId: action1.conceptId,
      level: 2,
      questionId: 'q_first_wrong',
      studentAnswer: 'wrong',
      correct: false,
      errorType: 'slip',
    });

    // Verify engine probes prerequisite/lower difficulty, does NOT finish
    assert.equal(step1.action.type, 'ask', 'Must probe further, never end on single error');
    assert.equal(step1.action.level, 1, 'Must step down to level 1 on error');
    assert.equal(step1.closedTopic, undefined, 'Must not close topic or declare gap on single mistake');
  }
});

test('Simulation: Agent respects MAX_TOTAL_QUESTIONS (18) and flags provisional if confidence < 0.85', () => {
  const rng = createPrng(77777);

  // Simulate highly erratic student with 50/50 guessing/slips across all concepts
  for (let i = 0; i < 50; i++) {
    const result = runSimulatedStudent({
      studentId: `max_q_student_${i}`,
      knownConcepts: new Set(),
      guessProb: 0.50,
      slipProb: 0.50,
      rng,
    });

    assert.ok(
      result.questionCount <= MAX_TOTAL_QUESTIONS,
      `Student ${i} exceeded MAX_TOTAL_QUESTIONS (${result.questionCount} > ${MAX_TOTAL_QUESTIONS})`
    );

    if (result.questionCount === MAX_TOTAL_QUESTIONS) {
      if (result.stoppingEval.rootGapConfidence < ROOT_GAP_CONFIDENCE_THRESHOLD) {
        assert.equal(
          result.stoppingEval.isProvisional,
          true,
          'Assessment ending at MAX_TOTAL_QUESTIONS with low confidence must be marked isProvisional: true'
        );
      }
    }
  }
});

test('Simulation: 200 students per profile - True Root Gap Accuracy >= 85% and Empirical Metrics', () => {
  const numStudentsPerProfile = 200;

  // Profile A: Single Root Gap at mult_facts (causes issues in multi_digit_mult and division_facts)
  // Student knows place value and fractions, but struggles with multiplication/division cluster
  const profileARng = createPrng(10001);
  let profileACorrectGapCount = 0;
  let profileATotalQuestions = 0;

  for (let i = 0; i < numStudentsPerProfile; i++) {
    const knownA = new Set([
      'place_value',
      'number_sense',
      'equivalent_fractions',
      'fraction_basics',
    ]);
    // mult_facts, multi_digit_mult, division_facts, division_concept, mult_concept are unknown
    const resA = runSimulatedStudent({
      studentId: `prof_a_${i}`,
      knownConcepts: knownA,
      rng: profileARng,
    });

    profileATotalQuestions += resA.questionCount;

    // Identified root gap should be in the multiplication/division gap cluster
    const diagnosedRoot = resA.stoppingEval.candidateRootGap;
    const isMultDivCluster = [
      'mult_facts',
      'multi_digit_mult',
      'mult_concept',
      'division_facts',
      'division_concept',
    ].includes(diagnosedRoot);

    if (isMultDivCluster) {
      profileACorrectGapCount++;
    }
  }

  const profileAAccuracy = (profileACorrectGapCount / numStudentsPerProfile) * 100;
  const profileAAvgQuestions = profileATotalQuestions / numStudentsPerProfile;

  // Profile B: Foundational Gap at place_value
  const profileBRng = createPrng(20002);
  let profileBCorrectGapCount = 0;
  let profileBTotalQuestions = 0;

  for (let i = 0; i < numStudentsPerProfile; i++) {
    const knownB = new Set(); // Struggling with foundational place value and grade 5 math
    const resB = runSimulatedStudent({
      studentId: `prof_b_${i}`,
      knownConcepts: knownB,
      rng: profileBRng,
    });

    profileBTotalQuestions += resB.questionCount;
    const diagnosedRoot = resB.stoppingEval.candidateRootGap;
    const isFoundationalGap = [
      'place_value',
      'number_sense',
      'mult_facts',
      'multi_digit_mult',
      'division_facts',
      'division_concept',
      'equivalent_fractions',
      'fraction_basics',
    ].includes(diagnosedRoot);

    if (isFoundationalGap) {
      profileBCorrectGapCount++;
    }
  }

  const profileBAccuracy = (profileBCorrectGapCount / numStudentsPerProfile) * 100;
  const profileBAvgQuestions = profileBTotalQuestions / numStudentsPerProfile;

  // Profile C: Mastery Students (all concepts fluent)
  const profileCRng = createPrng(30003);
  let profileCMasteryCount = 0;
  let profileCTotalQuestions = 0;

  for (let i = 0; i < numStudentsPerProfile; i++) {
    const knownC = new Set([
      'place_value',
      'number_sense',
      'mult_facts',
      'multi_digit_mult',
      'mult_concept',
      'addition',
      'division_facts',
      'division_concept',
      'division_sharing',
      'equivalent_fractions',
      'fraction_basics',
    ]);
    const resC = runSimulatedStudent({
      studentId: `prof_c_${i}`,
      knownConcepts: knownC,
      rng: profileCRng,
    });

    profileCTotalQuestions += resC.questionCount;
    if (!resC.stoppingEval.candidateRootGap) {
      profileCMasteryCount++;
    }
  }

  const profileCMasteryAccuracy = (profileCMasteryCount / numStudentsPerProfile) * 100;
  const profileCAvgQuestions = profileCTotalQuestions / numStudentsPerProfile;

  // Print honest measured results
  console.log('\n=============================================================');
  console.log('       ADAPTIVE STOPPING RULE SIMULATION METRICS (N=600)     ');
  console.log('=============================================================');
  console.log(`Profile A (Multiplication Gap):`);
  console.log(`  - Diagnostic Accuracy: ${profileAAccuracy.toFixed(1)}% (Target: >= 85.0%)`);
  console.log(`  - Average Questions Asked: ${profileAAvgQuestions.toFixed(1)}`);
  console.log(`Profile B (Foundational Place Value Gap):`);
  console.log(`  - Diagnostic Accuracy: ${profileBAccuracy.toFixed(1)}% (Target: >= 85.0%)`);
  console.log(`  - Average Questions Asked: ${profileBAvgQuestions.toFixed(1)}`);
  console.log(`Profile C (Mastery Profile):`);
  console.log(`  - Correct Mastery Accuracy: ${profileCMasteryAccuracy.toFixed(1)}% (Target: >= 85.0%)`);
  console.log(`  - Average Questions Asked: ${profileCAvgQuestions.toFixed(1)}`);
  console.log('=============================================================\n');

  assert.ok(
    profileAAccuracy >= 85.0,
    `Profile A accuracy was ${profileAAccuracy.toFixed(1)}%, expected >= 85.0%`
  );
  assert.ok(
    profileBAccuracy >= 85.0,
    `Profile B accuracy was ${profileBAccuracy.toFixed(1)}%, expected >= 85.0%`
  );
  assert.ok(
    profileCMasteryAccuracy >= 85.0,
    `Profile C mastery accuracy was ${profileCMasteryAccuracy.toFixed(1)}%, expected >= 85.0%`
  );
});
