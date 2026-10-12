import test from 'node:test';
import assert from 'node:assert/strict';
import { runExaminerStep } from '../src/lib/agents/examiner.ts';
import { analyzeErrors, getFallbackMisconceptions } from '../src/lib/agents/errorAnalyst.ts';
import {
  createSessionMemory,
  getNextStaircaseAction,
  applyAttemptToMemory,
} from '../src/lib/agents/staircase.ts';

test('Examiner: Illegal tool call (wrong level) is rejected by code gate', async () => {
  const memory = createSessionMemory('anon_test_gate_1', 5, 'en', ['number_ops']);
  // Initial legal action is ask at level 2

  // Mock Gemini returning ask_question at Level 3 (ILLEGAL: must start at level 2)
  const mockAi = {
    models: {
      generateContent: async () => ({
        functionCalls: [
          {
            name: 'ask_question',
            args: { conceptId: 'place_value', level: 3 },
          },
        ],
      }),
    },
  };

  const result = await runExaminerStep(memory, undefined, { client: mockAi });

  assert.equal(result.rejectedIllegalCall, true, 'Code gate must reject illegal level 3 tool call');
  assert.equal(result.action.type, 'ask');
  assert.equal(result.action.level, 2, 'Must fall back to legal action at level 2');
});

test('Examiner: Illegal tool call (premature next_topic) is rejected by code gate', async () => {
  const memory = createSessionMemory('anon_test_gate_2', 5, 'en', ['number_ops']);

  // Mock Gemini returning next_topic before any question is asked (ILLEGAL)
  const mockAi = {
    models: {
      generateContent: async () => ({
        functionCalls: [
          {
            name: 'next_topic',
            args: { reason: 'Skip to multiplication' },
          },
        ],
      }),
    },
  };

  const result = await runExaminerStep(memory, undefined, { client: mockAi });

  assert.equal(result.rejectedIllegalCall, true, 'Code gate must reject premature next_topic');
  assert.equal(result.action.type, 'ask');
  assert.equal(result.action.level, 2);
});

test('Examiner: Legal tool call with update_memory records note and accepts action', async () => {
  const memory = createSessionMemory('anon_test_legal_1', 5, 'en', ['number_ops']);

  // Mock Gemini returning legal ask_question at Level 2 and update_memory note
  const mockAi = {
    models: {
      generateContent: async () => ({
        functionCalls: [
          {
            name: 'update_memory',
            args: { note: 'Student demonstrates confidence with place value' },
          },
          {
            name: 'ask_question',
            args: { conceptId: 'place_value', level: 2 },
          },
        ],
      }),
    },
  };

  const result = await runExaminerStep(memory, undefined, { client: mockAi });

  assert.equal(result.rejectedIllegalCall, false, 'Legal tool call must not be rejected');
  assert.equal(result.usedFallback, false, 'Must not use fallback for legal call');
  assert.equal(result.action.level, 2);
  assert.equal(result.notes.length, 1);
  assert.equal(result.notes[0], 'Student demonstrates confidence with place value');
});

test('Error Analyst: Malformed JSON falls back to existing attempt classification', async () => {
  const attempts = [
    {
      conceptId: 'place_value',
      level: 2,
      questionId: 'q1',
      studentAnswer: '400',
      correct: false,
      errorType: 'place_value',
    },
    {
      conceptId: 'place_value',
      level: 1,
      questionId: 'q2',
      studentAnswer: '20',
      correct: false,
      errorType: 'regrouping',
    },
  ];

  // Mock Gemini returning invalid/malformed JSON
  const mockAi = {
    models: {
      generateContent: async () => ({
        text: '```json\n{ malformed_syntax: [missing closing brackets',
      }),
    },
  };

  const result = await analyzeErrors({
    topicId: 'number_ops',
    attempts,
    pseudonymousId: 'anon_test_malformed',
    grade: 5,
    client: mockAi,
  });

  assert.ok(result.labels.length > 0, 'Must fall back to attempt classifications');
  assert.ok(result.labels.includes('place_value') || result.labels.includes('regrouping'));
});

test('Error Analyst: Disallowed / invented misconception label falls back', async () => {
  const attempts = [
    {
      conceptId: 'addition',
      level: 2,
      questionId: 'q1',
      studentAnswer: '10',
      correct: false,
      errorType: 'regrouping',
    },
  ];

  // Mock Gemini returning an invented label not in the allowed list
  const mockAi = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          misconceptions: [
            { label: 'invented_hallucinated_label', explanation: 'Does not exist in fixed list' },
          ],
        }),
      }),
    },
  };

  const result = await analyzeErrors({
    topicId: 'number_ops',
    attempts,
    pseudonymousId: 'anon_test_filter',
    grade: 5,
    client: mockAi,
  });

  // Invented label must be dropped, falling back to existing classification 'regrouping'
  assert.equal(result.labels.includes('invented_hallucinated_label'), false);
  assert.ok(result.labels.includes('regrouping'));
});

test('Error Analyst: Valid allowed misconception label is accepted', async () => {
  const attempts = [
    {
      conceptId: 'fraction_addition',
      level: 2,
      questionId: 'q1',
      studentAnswer: '2/8',
      correct: false,
      errorType: 'fraction_add_denominators',
    },
  ];

  const mockAi = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          misconceptions: [
            {
              label: 'fraction_add_denominators',
              explanation: 'Student added denominators 1/4 + 1/4 = 2/8 instead of keeping common denominator.',
            },
          ],
        }),
      }),
    },
  };

  const result = await analyzeErrors({
    topicId: 'fractions',
    attempts,
    pseudonymousId: 'anon_test_valid',
    grade: 5,
    client: mockAi,
  });

  assert.equal(result.labels.length, 1);
  assert.equal(result.labels[0], 'fraction_add_denominators');
  assert.ok(result.details[0].explanation.includes('denominators'));
});

test('Privacy invariant: Only pseudonymous ID is transmitted to Gemini, never student names', async () => {
  let transmittedPrompt = '';

  const mockAi = {
    models: {
      generateContent: async (config) => {
        transmittedPrompt = config.contents[0].parts[0].text;
        return {
          functionCalls: [
            {
              name: 'ask_question',
              args: { conceptId: 'place_value', level: 2 },
            },
          ],
        };
      },
    },
  };

  const memory = createSessionMemory('anon_secret_99', 5, 'en', ['number_ops']);
  await runExaminerStep(memory, undefined, { client: mockAi });

  assert.ok(transmittedPrompt.includes('anon_secret_99'), 'Pseudonymous ID must be transmitted');
  assert.equal(transmittedPrompt.includes('Aarav'), false, 'Real names must never be sent');
  assert.equal(transmittedPrompt.includes('studentName'), false);
});

test('Missing-key path: Completes a full 4-topic assessment on deterministic fallbacks', async () => {
  // Explicitly simulate missing API key
  const topics = ['number_ops', 'multiplication', 'division', 'fractions'];
  let memory = createSessionMemory('anon_test_nokey', 5, 'en', topics);

  for (let t = 0; t < topics.length; t++) {
    // Step 1: Level 2
    const res1 = await runExaminerStep(memory, undefined, { apiKey: '' });
    assert.equal(res1.usedFallback, true);
    assert.equal(res1.action.type, 'ask');
    assert.equal(res1.action.level, 2);

    const step1 = applyAttemptToMemory(memory, {
      conceptId: res1.action.conceptId,
      level: 2,
      questionId: `q_${t}_1`,
      studentAnswer: 'ans1',
      correct: false,
      errorType: 'wrong_operation',
    });
    memory = step1.memory;

    // Step 2: Level 1 (since Level 2 was wrong)
    const res2 = await runExaminerStep(memory, undefined, { apiKey: '' });
    assert.equal(res2.action.type, 'ask');
    assert.equal(res2.action.level, 1);

    const step2 = applyAttemptToMemory(memory, {
      conceptId: res2.action.conceptId,
      level: 1,
      questionId: `q_${t}_2`,
      studentAnswer: 'ans2',
      correct: false,
      errorType: 'slip',
    });
    memory = step2.memory;

    // Topic closes as gap; run errorAnalyst with no key
    assert.equal(step2.closedTopic?.status, 'gap');
    const closedTopic = memory.topics[t];
    const analystRes = await analyzeErrors({
      topicId: closedTopic.topicId,
      attempts: closedTopic.attempts,
      pseudonymousId: memory.pseudonymousId,
      grade: memory.grade,
      apiKey: '',
    });
    closedTopic.misconceptions = analystRes.labels;
    assert.ok(closedTopic.misconceptions.length > 0, 'Must have fallback misconceptions');
  }

  // All 4 topics completed with status gap
  const finalAction = getNextStaircaseAction(memory);
  assert.equal(finalAction.type, 'finish');
  assert.equal(memory.topics.every((t) => t.status === 'gap'), true);
  assert.equal(memory.topics.every((t) => t.misconceptions && t.misconceptions.length > 0), true);
});
