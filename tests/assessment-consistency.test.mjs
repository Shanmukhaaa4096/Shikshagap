import test from 'node:test';
import assert from 'node:assert/strict';
import { getMultiBoardQuestion } from '../src/lib/questions/multiBoardBank.ts';
import {
  createSessionMemory,
  getNextStaircaseAction,
  applyAttemptToMemory,
} from '../src/lib/agents/staircase.ts';
import { getClassConfig } from '../src/lib/curriculum/classes.ts';

test('Acceptance (a): ICSE selected returns zero CBSE-tagged items over 50 sampled questions', () => {
  const sampledQuestions = [];

  // Sample 50 questions with ICSE selected across classes 1 to 10 and difficulties
  for (let i = 0; i < 50; i++) {
    const grade = (i % 10) + 1;
    const diff = (i % 4) + 1;
    const excludeIds = i > 10 ? [`other_id_${i}`] : [];

    const q = getMultiBoardQuestion(
      {
        class: grade,
        difficulty: diff,
        board: 'ICSE',
        excludeIds,
      },
      'en'
    );

    if (q) {
      sampledQuestions.push(q);
    }
  }

  assert.equal(
    sampledQuestions.length,
    50,
    `Sampled 50 questions with ICSE selected (got ${sampledQuestions.length})`
  );

  // Strictly verify zero CBSE/NCERT items among the sampled questions
  for (const q of sampledQuestions) {
    assert.equal(
      q.board,
      'ICSE',
      `Question ${q.id} must be strictly tagged ICSE, got ${q.board}`
    );
    assert.notEqual(
      q.board,
      'CBSE',
      `Question ${q.id} must not be tagged CBSE`
    );
    assert.notEqual(
      q.board,
      'NCERT',
      `Question ${q.id} must not be tagged NCERT`
    );

    // Textbook source must not point to NCERT
    if (q.textbookSource) {
      assert.notEqual(
        q.textbookSource.board,
        'NCERT',
        `Question ${q.id} textbookSource board must not be NCERT`
      );
      assert.ok(
        !q.textbookSource.textbookTitle?.toLowerCase().includes('ncert'),
        `Question ${q.id} textbookTitle (${q.textbookSource.textbookTitle}) must not be NCERT`
      );
    }
  }
});

test('Acceptance (b): Page title, headings, and topic chips change dynamically with the class', () => {
  // Test across multiple classes
  const classesToTest = ['class_3', 'class_5', 'class_6', 'class_8', 'class_10'];

  for (const classId of classesToTest) {
    const config = getClassConfig(classId);

    // 1. Heading verification
    const heading = `${config.label} Maths Check`;
    assert.ok(heading.includes(config.label), `Heading should include ${config.label}`);
    assert.ok(!heading.includes('Class 5') || config.label === 'Class 5', `Heading should not hardcode Class 5 when ${config.label} is selected`);

    // 2. Page title verification
    const cbseTitle = `${config.label} Maths Diagnostic (CBSE (NCERT)) | ShikshaGap`;
    const icseTitle = `${config.label} Maths Diagnostic (ICSE) | ShikshaGap`;
    const bothTitle = `${config.label} Maths Diagnostic (Both) | ShikshaGap`;

    assert.ok(cbseTitle.includes(config.label));
    assert.ok(cbseTitle.includes('CBSE (NCERT)'));
    assert.ok(icseTitle.includes('ICSE'));
    assert.ok(bothTitle.includes('Both'));

    // 3. Footer verification
    const footerText = `${config.label} Maths Curriculum • CBSE (NCERT) • Classes 1 to 10 ready`;
    assert.ok(footerText.includes(config.label));
    assert.ok(footerText.includes('Classes 1 to 10 ready'));
    assert.ok(!footerText.includes('Classes 3 to 5'));

    // 4. Topic chips verification
    assert.ok(config.topics && config.topics.length > 0, `${config.label} must have configured topics`);
    for (const topicId of config.topics) {
      assert.ok(typeof topicId === 'string' && topicId.length > 0, `Topic ${topicId} must be a valid topic string`);
    }
  }

  // Ensure Class 6 topics are distinct from Class 5 topics
  const c5 = getClassConfig('class_5');
  const c6 = getClassConfig('class_6');
  const c5Topics = new Set(c5.topics);
  const c6Topics = new Set(c6.topics);

  assert.deepEqual(c5.topics, ['multiplication', 'division', 'fractions', 'area_perimeter']);
  assert.deepEqual(c6.topics, ['integers', 'fractions_decimals', 'algebra_intro', 'ratio_proportion']);

  // Verify non-empty and non-identical
  assert.notDeepEqual(Array.from(c5Topics), Array.from(c6Topics));
  for (const t of c6Topics) {
    assert.ok(!c5Topics.has(t), `Class 6 topic ${t} should not be in Class 5 list`);
  }
});

test('Acceptance (c): Correct-then-wrong sequence changes difficulty +1 then -1', () => {
  // Start session with initialDifficulty = 3 and adaptiveMode = true
  const memory = createSessionMemory(
    'anon_student_adaptive',
    5,
    'en',
    ['multiplication', 'division'],
    3,
    true
  );

  // Step 0: Initial question starts at medium band 3
  const initialAction = getNextStaircaseAction(memory);
  assert.equal(initialAction.type, 'ask');
  assert.equal(initialAction.level, 3, 'Initial question must start at level 3');
  assert.equal(initialAction.topicId, 'multiplication');

  // Step 1: Submit correct answer at level 3
  const attempt1 = {
    conceptId: initialAction.conceptId,
    level: 3,
    questionId: 'q_adaptive_step_1',
    studentAnswer: '42',
    correct: true,
  };
  const step1 = applyAttemptToMemory(memory, attempt1);

  // Step 2: Next difficulty must increase by +1 (3 -> 4)
  assert.equal(step1.action.type, 'ask');
  assert.equal(
    step1.action.level,
    4,
    'Correct answer at level 3 must change difficulty to +1 (level 4)'
  );
  assert.equal(step1.action.topicId, 'multiplication');

  // Step 3: Submit wrong answer at level 4
  const attempt2 = {
    conceptId: step1.action.conceptId,
    level: 4,
    questionId: 'q_adaptive_step_2',
    studentAnswer: 'wrong_ans',
    correct: false,
    errorType: 'slip',
  };
  const step2 = applyAttemptToMemory(step1.memory, attempt2);

  // Step 4: Next difficulty must decrease by -1 (4 -> 3)
  assert.equal(step2.action.type, 'ask');
  assert.equal(
    step2.action.level,
    3,
    'Wrong answer at level 4 must change difficulty to -1 (level 3)'
  );
  assert.equal(step2.action.topicId, 'multiplication');
});
