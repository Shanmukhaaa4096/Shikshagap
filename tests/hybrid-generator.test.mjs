import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateQuestionWording,
  enhanceQuestionWithHybridWording,
  checkDailyBudget,
  recordDailyCall,
  resetBudgetAndLimitsForTesting,
  checkIpWordingLimit,
  DAILY_BUDGET_LIMIT,
} from '../src/lib/questions/hybridGenerator.ts';
import { generateQuestion } from '../src/lib/questions/generator.ts';
import { makeRng } from '../src/lib/rng.ts';

test('Validator: Valid English wording with exact operands passes', () => {
  const text = 'In a village primary school, there are 140 notebooks on the desk and 215 notebooks in the cupboard. How many notebooks are there in total?';
  const result = validateQuestionWording(text, [140, 215], 'en');
  assert.equal(result.valid, true);
  assert.deepEqual(result.extractedNumbers, [140, 215]);
});

test('Validator: Missing operand fails validation', () => {
  const text = 'In a village primary school, there are 140 notebooks on the desk. How many are there?';
  const result = validateQuestionWording(text, [140, 215], 'en');
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'missing_operand_215');
});

test('Validator: Extra numbers in problem statement fail validation', () => {
  const text = 'A shopkeeper with 3 carts has 140 red apples and 215 green apples. How many apples are there in total?';
  const result = validateQuestionWording(text, [140, 215], 'en');
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'extra_numbers_present');
});

test('Validator: Prohibited student names fail safety check', () => {
  const text = 'Rahul and Priya collected 140 stamps and 215 stickers. How many items do they have in total?';
  const result = validateQuestionWording(text, [140, 215], 'en');
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'unsafe_pii_student_name');
});

test('Validator: Language script validation for Hindi (Devanagari)', () => {
  const validHindi = 'एक गाँव के प्राथमिक स्कूल में 140 कॉपियाँ मेज़ पर और 215 कॉपियाँ अलमारी में हैं। कुल कितनी कॉपियाँ हैं?';
  const validResult = validateQuestionWording(validHindi, [140, 215], 'hi');
  assert.equal(validResult.valid, true);

  const invalidHindi = 'In a village school, there are 140 books and 215 pencils. How many items?';
  const invalidResult = validateQuestionWording(invalidHindi, [140, 215], 'hi');
  assert.equal(invalidResult.valid, false);
  assert.equal(invalidResult.reason, 'wrong_language_hindi_missing_devanagari');
});

test('Validator: Language script validation for Telugu', () => {
  const validTelugu = 'ఒక ప్రాథమిక పాఠశాలలో ఉపాధ్యాయుడు 140 పుస్తకాలు పై అరలో, 215 పుస్తకాలు కింది అరలో ఉంచారు. మొత్తం ఎన్ని ఉన్నాయి?';
  const validResult = validateQuestionWording(validTelugu, [140, 215], 'te');
  assert.equal(validResult.valid, true);

  const invalidTelugu = 'There are 140 notebooks and 215 pens on the table. What is the total?';
  const invalidResult = validateQuestionWording(invalidTelugu, [140, 215], 'te');
  assert.equal(invalidResult.valid, false);
  assert.equal(invalidResult.reason, 'wrong_language_telugu_missing_telugu_script');
});

test('Hybrid: Answer key and options are ALWAYS strictly code-computed', async () => {
  resetBudgetAndLimitsForTesting();
  const rng = makeRng(42);
  const baseQuestion = generateQuestion('addition', 3, rng);

  // Assert base question has deterministic code-computed answer
  assert.ok(baseQuestion.answer, 'Base question must have answer');
  const originalAnswer = baseQuestion.answer;
  const originalOptions = baseQuestion.options ? [...baseQuestion.options] : undefined;
  const originalAnswerKind = baseQuestion.answerKind;
  const originalDifficulty = baseQuestion.difficulty;
  const originalConceptId = baseQuestion.conceptId;

  const operands = [baseQuestion.meta.a, baseQuestion.meta.b];
  const mockAi = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          wordProblem: `In a school book fair, a teacher arranged ${operands[0]} notebooks and ${operands[1]} textbooks. How many books in all?`,
          scenarioTopic: 'book fair',
        }),
      }),
    },
  };

  const seen = new Set();
  const enhanced = await enhanceQuestionWithHybridWording(
    baseQuestion,
    'en',
    5,
    seen,
    { client: mockAi }
  );

  // Invariants: Answer, options, conceptId, difficulty, answerKind must remain 100% untouched
  assert.equal(enhanced.answer, originalAnswer, 'Answer key must be strictly code-computed');
  assert.deepEqual(enhanced.options, originalOptions, 'Options must be strictly code-computed');
  assert.equal(enhanced.answerKind, originalAnswerKind, 'AnswerKind must remain code-computed');
  assert.equal(enhanced.difficulty, originalDifficulty, 'Difficulty must remain code-computed');
  assert.equal(enhanced.conceptId, originalConceptId, 'ConceptId must remain code-computed');
  assert.ok(enhanced.prompt.raw.includes(String(operands[0])));
  assert.ok(enhanced.prompt.raw.includes(String(operands[1])));
});

test('Hybrid: Fallback works when Gemini throws network error', async () => {
  resetBudgetAndLimitsForTesting();
  const rng = makeRng(42);
  const baseQuestion = generateQuestion('addition', 3, rng);
  const originalPromptKey = 'key' in baseQuestion.prompt ? baseQuestion.prompt.key : undefined;

  const mockFailingAi = {
    models: {
      generateContent: async () => {
        throw new Error('Gemini network socket failure');
      },
    },
  };

  const seen = new Set();
  const enhanced = await enhanceQuestionWithHybridWording(
    baseQuestion,
    'en',
    5,
    seen,
    { client: mockFailingAi }
  );

  // Falls back to base question template
  assert.equal('key' in enhanced.prompt && enhanced.prompt.key, originalPromptKey);
  assert.equal(enhanced.answer, baseQuestion.answer);
});

test('Hybrid: Fallback works on timeout (> 3s)', async () => {
  resetBudgetAndLimitsForTesting();
  const rng = makeRng(42);
  const baseQuestion = generateQuestion('addition', 3, rng);
  const originalPromptKey = 'key' in baseQuestion.prompt ? baseQuestion.prompt.key : undefined;

  const mockHangingAi = {
    models: {
      generateContent: async () => {
        // Sleep 50ms with a 10ms timeout test
        await new Promise((res) => setTimeout(res, 50));
        return { text: '{}' };
      },
    },
  };

  const seen = new Set();
  const enhanced = await enhanceQuestionWithHybridWording(
    baseQuestion,
    'en',
    5,
    seen,
    { client: mockHangingAi, timeoutMs: 10 }
  );

  // Falls back to base question template
  assert.equal('key' in enhanced.prompt && enhanced.prompt.key, originalPromptKey);
});

test('Hybrid: Fallback works when Gemini outputs invalid JSON', async () => {
  resetBudgetAndLimitsForTesting();
  const rng = makeRng(42);
  const baseQuestion = generateQuestion('addition', 3, rng);
  const originalPromptKey = 'key' in baseQuestion.prompt ? baseQuestion.prompt.key : undefined;

  const mockGarbageAi = {
    models: {
      generateContent: async () => ({
        text: 'This is not JSON at all: 404 Error',
      }),
    },
  };

  const seen = new Set();
  const enhanced = await enhanceQuestionWithHybridWording(
    baseQuestion,
    'en',
    5,
    seen,
    { client: mockGarbageAi }
  );

  assert.equal('key' in enhanced.prompt && enhanced.prompt.key, originalPromptKey);
});

test('Hybrid: Session deduplication prevents repeating same question in session', async () => {
  resetBudgetAndLimitsForTesting();
  const rng = makeRng(42);
  const baseQuestion = generateQuestion('addition', 3, rng);
  const operands = [baseQuestion.meta.a, baseQuestion.meta.b];

  const generatedText = `In a village harvest, a farmer collected ${operands[0]} sacks of rice and ${operands[1]} sacks of wheat. How many sacks in total?`;
  const mockAi = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          wordProblem: generatedText,
          scenarioTopic: 'harvest',
        }),
      }),
    },
  };

  const seen = new Set();
  // First call: succeeds and registers generatedText in seen
  const first = await enhanceQuestionWithHybridWording(baseQuestion, 'en', 5, seen, { client: mockAi });
  assert.equal(first.prompt.raw, generatedText);
  assert.ok(seen.has(generatedText));

  // Second call with same seen set: must NOT repeat the same wording!
  const second = await enhanceQuestionWithHybridWording(baseQuestion, 'en', 5, seen, { client: mockAi });
  // Should fall back to template prompt since identical text is in seen
  assert.ok('key' in second.prompt);
});

test('Hybrid: Daily budget and IP rate limits are respected', async () => {
  resetBudgetAndLimitsForTesting();

  // Test IP rate limit
  const testIp = '192.168.1.99';
  for (let i = 0; i < 30; i++) {
    assert.equal(checkIpWordingLimit(testIp), true);
  }
  // 31st call from same IP in same minute window must be rate limited
  assert.equal(checkIpWordingLimit(testIp), false);

  // Test daily budget
  resetBudgetAndLimitsForTesting();
  assert.equal(checkDailyBudget(), true);
  for (let i = 0; i < DAILY_BUDGET_LIMIT; i++) {
    recordDailyCall();
  }
  // Budget exhausted
  assert.equal(checkDailyBudget(), false);
});
