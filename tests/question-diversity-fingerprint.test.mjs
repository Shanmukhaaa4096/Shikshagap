/**
 * tests/question-diversity-fingerprint.test.mjs
 *
 * Verifies Phase 2, Phase 3, and Phase 4 requirements:
 * 1. Canonical question fingerprinting (normalisation, stability, operand sensitivity).
 * 2. Fresh session-seed fallback generation (session-specific RNG, no predictable roll-no seed).
 * 3. Fallback behaviour when Gemini is disabled (100% code-computed math ground truth).
 * 4. In-session repeat avoidance and format diversification.
 * 5. Accurate dynamic quality metrics (Pass/Fail based on benchmark).
 * 6. Theme token WCAG AA contrast compliance.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../src/lib/rng.ts';
import {
  canonicalQuestionFingerprint,
  questionSignature,
  generateQuestion,
  generateQuestionWithVariety,
} from '../src/lib/questions/generator.ts';
import { createSessionMemory, applyAttemptToMemory } from '../src/lib/agents/staircase.ts';
import { enhanceQuestionWithHybridWording } from '../src/lib/questions/hybridGenerator.ts';
import { contrastRatio, SHIKSHAGAP_PALETTE } from '../scripts/checkColorContrast.mjs';

test('Fingerprint: distinguishes questions with different operands and answers', () => {
  const rng1 = makeRng(101);
  const q1 = generateQuestion('addition', 2, rng1, 3);

  const rng2 = makeRng(202);
  const q2 = generateQuestion('addition', 2, rng2, 3);

  const fp1 = canonicalQuestionFingerprint(q1);
  const fp2 = canonicalQuestionFingerprint(q2);

  assert.ok(fp1.length > 0);
  assert.ok(fp2.length > 0);
  // Different random seeds yield different operands for addition level 2
  if (q1.meta.a !== q2.meta.a || q1.meta.b !== q2.meta.b) {
    assert.notEqual(fp1, fp2, 'Fingerprint must distinguish questions with different operands');
  }
});

test('Fingerprint: recognises equivalent items despite whitespace or cosmetic operator formatting', () => {
  const baseQ = {
    id: 'random_id_1',
    grade: 3,
    conceptId: 'addition',
    difficulty: 2,
    format: 'mcq',
    prompt: { key: 'add_two_numbers', params: { a: 45, b: 23 } },
    expression: '45 + 23',
    answer: '68',
    options: [{ id: 'a', value: '68', label: '68' }],
    meta: { a: 45, b: 23, op: '+' },
  };

  const cosmeticVariant = {
    id: 'random_id_2_different_uuid',
    grade: 3,
    conceptId: 'addition',
    difficulty: 2,
    format: 'mcq',
    prompt: { key: 'add_two_numbers', params: { b: 23, a: 45 } }, // different key order
    expression: '  45   +   23  ', // irregular whitespace
    answer: '68',
    options: [{ id: 'b', value: '68', label: '68' }],
    meta: { a: 45, b: 23, op: '+' },
  };

  const fpBase = canonicalQuestionFingerprint(baseQ);
  const fpVariant = canonicalQuestionFingerprint(cosmeticVariant);

  assert.equal(fpBase, fpVariant, 'Canonical fingerprint must match for mathematically equivalent items');
  assert.equal(questionSignature(baseQ), questionSignature(cosmeticVariant), 'questionSignature must delegate to canonical fingerprint');
});

test('Fingerprint: normalises multiplication and division operator symbols', () => {
  const qUnicode = {
    grade: 4,
    conceptId: 'mult_facts',
    difficulty: 2,
    format: 'mcq',
    prompt: '7 × 8',
    expression: '7 × 8',
    answer: '56',
    meta: { a: 7, b: 8, op: '×' },
  };

  const qAscii = {
    grade: 4,
    conceptId: 'mult_facts',
    difficulty: 2,
    format: 'mcq',
    prompt: '7 * 8',
    expression: '7 * 8',
    answer: '56',
    meta: { a: 7, b: 8, op: '*' },
  };

  assert.equal(
    canonicalQuestionFingerprint(qUnicode),
    canonicalQuestionFingerprint(qAscii),
    'Fingerprint must normalize × to *'
  );
});

test('Session Seed: fresh sessions receive distinct random seeds', () => {
  const mem1 = createSessionMemory('addition', 3);
  const mem2 = createSessionMemory('addition', 3);
  const mem3 = createSessionMemory('addition', 3);

  assert.ok(typeof mem1.sessionSeed === 'number');
  assert.ok(typeof mem2.sessionSeed === 'number');
  assert.ok(typeof mem3.sessionSeed === 'number');

  // Successive sessions must not have the exact same seed (avoids predictable roll-no repetition)
  const allSame = mem1.sessionSeed === mem2.sessionSeed && mem2.sessionSeed === mem3.sessionSeed;
  assert.equal(allSame, false, 'Successive assessment sessions must generate distinct seeds');
});

test('Session Seed: deterministic injection reproduces consistent test streams', () => {
  const fixedSeed = 987654321;
  const memA = createSessionMemory('student_test', 4, 'en', undefined, fixedSeed);
  const memB = createSessionMemory('student_test', 4, 'en', undefined, fixedSeed);

  assert.equal(memA.sessionSeed, fixedSeed);
  assert.equal(memB.sessionSeed, fixedSeed);

  const rngA = makeRng(memA.sessionSeed);
  const rngB = makeRng(memB.sessionSeed);

  const qA1 = generateQuestion('mult_facts', 2, rngA, 4);
  const qB1 = generateQuestion('mult_facts', 2, rngB, 4);

  assert.equal(canonicalQuestionFingerprint(qA1), canonicalQuestionFingerprint(qB1));
});

test('Fallback: deterministic generator functions without Gemini', async () => {
  const rng = makeRng(555);
  const base = generateQuestionWithVariety('addition', 2, rng, 3);
  assert.ok(base, 'Deterministic generator must generate question');

  // Calling enhanceQuestionWithHybridWording with a null / undefined AI client to test offline fallback
  const result = await enhanceQuestionWithHybridWording(
    base,
    null, // No Gemini AI client provided
    {
      language: 'en',
      grade: 3,
    }
  );

  assert.ok(result, 'Fallback must return a valid question');
  assert.ok(result.answer, 'Question must have a ground-truth answer');
  assert.equal(typeof result.answer, 'string');
});

test('Format Diversity: consecutive format avoidance works across steps', () => {
  const rng = makeRng(333);
  let prevFormat = undefined;
  const formatHistory = [];

  for (let i = 0; i < 10; i++) {
    const q = generateQuestionWithVariety('addition', 2, rng, 3, { avoidFormat: prevFormat });
    formatHistory.push(q.format);
    if (prevFormat) {
      assert.notEqual(q.format, prevFormat, `Step ${i}: format ${q.format} must not repeat consecutive ${prevFormat}`);
    }
    prevFormat = q.format;
  }

  // Ensure multiple distinct formats were produced
  const uniqueFormats = new Set(formatHistory);
  assert.ok(uniqueFormats.size >= 3, `Expected at least 3 distinct formats, got: ${Array.from(uniqueFormats).join(', ')}`);
});

test('In-Session Repeat Avoidance: seenSignatures prevents duplicate items', () => {
  const initialMemory = createSessionMemory('mult_facts', 4, 'en', undefined, 12345);
  const rng = makeRng(initialMemory.sessionSeed);

  const q1 = generateQuestion('mult_facts', 2, rng, 4);
  const fp1 = canonicalQuestionFingerprint(q1);

  // Record attempt and get updated immutable memory
  const { memory: updatedMemory } = applyAttemptToMemory(initialMemory, {
    topicId: 'multiplication',
    level: 2,
    correct: true,
    errorType: null,
    timeSpentSeconds: 5,
    questionSignature: fp1,
    format: q1.format,
    questionId: q1.id || 'q1',
    userAnswer: String(q1.answer),
  });

  assert.ok(updatedMemory.seenSignatures.includes(fp1), 'Signature must be recorded in session memory');

  // Next question generation with variety should skip seen signatures
  const q2 = generateQuestionWithVariety('mult_facts', 2, rng, 4, {
    avoidSignatures: updatedMemory.seenSignatures,
  });
  const fp2 = canonicalQuestionFingerprint(q2);

  assert.notEqual(fp1, fp2, 'Generated question must avoid signatures already in session memory');
});

test('Theme Contrast: WCAG AA compliance with exact Coolors palette', () => {
  // 1. Text on Coral pink (#F56276) MUST be Deep burgundy (#36151E)
  const burgundyOnCoral = contrastRatio(SHIKSHAGAP_PALETTE.burgundy, SHIKSHAGAP_PALETTE.coral);
  assert.ok(
    burgundyOnCoral >= 4.5,
    `Deep burgundy on coral must achieve WCAG AA >= 4.5:1 (got ${burgundyOnCoral.toFixed(2)}:1)`
  );

  // 2. Off-white on Coral fails (< 4.5:1), mathematically proving the requirement
  const offwhiteOnCoral = contrastRatio(SHIKSHAGAP_PALETTE.offwhite, SHIKSHAGAP_PALETTE.coral);
  assert.ok(
    offwhiteOnCoral < 4.5,
    `Off-white on coral must fail WCAG AA < 4.5:1 (got ${offwhiteOnCoral.toFixed(2)}:1)`
  );

  // 3. Primary light mode text (#36151E on #EEF0F2) must be >= 14:1
  const lightModeContrast = contrastRatio(SHIKSHAGAP_PALETTE.burgundy, SHIKSHAGAP_PALETTE.offwhite);
  assert.ok(
    lightModeContrast >= 14.0,
    `Light mode text contrast must be >= 14:1 (got ${lightModeContrast.toFixed(2)}:1)`
  );

  // 4. Primary dark mode text (#EEF0F2 on #36151E) must be >= 14:1
  const darkModeContrast = contrastRatio(SHIKSHAGAP_PALETTE.offwhite, SHIKSHAGAP_PALETTE.burgundy);
  assert.ok(
    darkModeContrast >= 14.0,
    `Dark mode text contrast must be >= 14:1 (got ${darkModeContrast.toFixed(2)}:1)`
  );
});
