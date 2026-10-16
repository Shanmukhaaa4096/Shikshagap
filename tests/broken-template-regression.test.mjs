/**
 * ShikshaGap Broken Template & Unresolved Token Regression Test Suite
 *
 * Reproduces and verifies permanent fixes for:
 * 1. "You have 48 pencils. If you put {each} pencils in each box, how many boxes do you need?"
 * 2. "In the fraction {num}/{den}, which number is the denominator?"
 * 3. Rejection of unrendered {variable} tokens by validateQuestionStrict.
 * 4. Trilingual dictionary key completeness across en, hi, and te.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { generateQuestion } from "../src/lib/questions/generator.ts";
import { makeRng } from "../src/lib/rng.ts";
import {
  validateQuestionStrict,
  resolveTxtSafe,
} from "../src/lib/questions/validator.ts";
import { DICTS } from "../src/lib/i18n/dict.ts";

test("Regression 1: Division concept question must never render unrendered {each} token", () => {
  const rng = makeRng(42);
  // Generate division_concept questions across difficulties 1, 2, 3
  for (let diff of [1, 2, 3]) {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion("division_concept", diff, rng, 4);

      // Verify across all 3 languages
      for (const lang of ["en", "hi", "te"]) {
        const resolved = resolveTxtSafe(q.prompt, lang);

        assert.equal(
          resolved.hasUnresolved,
          false,
          `Prompt in '${lang}' contains unresolved tokens: [${resolved.unresolvedTokens.join(", ")}]. Text: "${resolved.text}"`
        );
        assert.doesNotMatch(
          resolved.text,
          /\{each\}/,
          `Found unresolved '{each}' token in question text: "${resolved.text}"`
        );
        assert.doesNotMatch(
          resolved.text,
          /\{total\}/,
          `Found unresolved '{total}' token in question text: "${resolved.text}"`
        );
      }

      // Strict validation must pass
      const validation = validateQuestionStrict(q);
      assert.equal(
        validation.valid,
        true,
        `Strict validation failed on generated question: ${validation.errors.join("; ")}`
      );
    }
  }
});

test("Regression 2: Fraction denominator question must never render unrendered {num}/{den} tokens", () => {
  const rng = makeRng(101);
  for (let diff of [1, 2, 3]) {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion("fraction_basics", diff, rng, 4);

      for (const lang of ["en", "hi", "te"]) {
        const resolved = resolveTxtSafe(q.prompt, lang);

        assert.equal(
          resolved.hasUnresolved,
          false,
          `Prompt in '${lang}' contains unresolved tokens: [${resolved.unresolvedTokens.join(", ")}]. Text: "${resolved.text}"`
        );
        assert.doesNotMatch(
          resolved.text,
          /\{num\}/,
          `Found unresolved '{num}' token in question text: "${resolved.text}"`
        );
        assert.doesNotMatch(
          resolved.text,
          /\{den\}/,
          `Found unresolved '{den}' token in question text: "${resolved.text}"`
        );
      }

      const validation = validateQuestionStrict(q);
      assert.equal(
        validation.valid,
        true,
        `Strict validation failed on generated fraction question: ${validation.errors.join("; ")}`
      );
    }
  }
});

test("Validation Layer: Rejects any question containing unresolved placeholders", () => {
  // Synthesize broken question reproducing the exact reported bug
  const brokenQuestion1 = {
    id: "test_broken_1",
    conceptId: "division_concept",
    difficulty: 2,
    format: "mcq",
    prompt: {
      raw: "You have 48 pencils. If you put {each} pencils in each box, how many boxes do you need?",
    },
    answerKind: "choice",
    answer: "8",
    options: [
      { id: "1", label: { raw: "8" }, value: "8" },
      { id: "2", label: { raw: "6" }, value: "6" },
    ],
    meta: {},
    source: "bank",
  };

  const check1 = validateQuestionStrict(brokenQuestion1);
  assert.equal(check1.valid, false, "Broken question with {each} must be rejected");
  assert.equal(check1.code, "UNRESOLVED_PLACEHOLDER");
  assert.ok(check1.errors[0].includes("{each}"));

  const brokenQuestion2 = {
    id: "test_broken_2",
    conceptId: "fraction_basics",
    difficulty: 2,
    format: "mcq",
    prompt: {
      raw: "In the fraction {num}/{den}, which number is the denominator?",
    },
    answerKind: "choice",
    answer: "4",
    options: [
      { id: "1", label: { raw: "4" }, value: "4" },
      { id: "2", label: { raw: "3" }, value: "3" },
    ],
    meta: {},
    source: "bank",
  };

  const check2 = validateQuestionStrict(brokenQuestion2);
  assert.equal(check2.valid, false, "Broken question with {num}/{den} must be rejected");
  assert.equal(check2.code, "UNRESOLVED_PLACEHOLDER");
});

test("Validation Layer: Rejects duplicate options and missing answers", () => {
  const duplicateOptionsQuestion = {
    id: "test_dup_opts",
    conceptId: "addition",
    difficulty: 1,
    format: "mcq",
    prompt: { raw: "What is 5 + 5?" },
    answerKind: "choice",
    answer: "10",
    options: [
      { id: "1", label: { raw: "10" }, value: "10" },
      { id: "2", label: { raw: "10" }, value: "10" }, // Duplicate!
      { id: "3", label: { raw: "9" }, value: "9" },
    ],
    meta: {},
    source: "bank",
  };

  const dupCheck = validateQuestionStrict(duplicateOptionsQuestion);
  assert.equal(dupCheck.valid, false);
  assert.equal(dupCheck.code, "DUPLICATE_OPTIONS");

  const missingAnswerQuestion = {
    id: "test_missing_ans",
    conceptId: "addition",
    difficulty: 1,
    format: "mcq",
    prompt: { raw: "What is 7 + 2?" },
    answerKind: "choice",
    answer: "9",
    options: [
      { id: "1", label: { raw: "8" }, value: "8" },
      { id: "2", label: { raw: "10" }, value: "10" },
    ], // '9' is not in options!
    meta: {},
    source: "bank",
  };

  const missingCheck = validateQuestionStrict(missingAnswerQuestion);
  assert.equal(missingCheck.valid, false);
  assert.equal(missingCheck.code, "ANSWER_NOT_IN_OPTIONS");
});

test("Dictionary Completeness: All question template keys exist in en, hi, and te", () => {
  const enKeys = Object.keys(DICTS.en).filter((k) => k.startsWith("q.") || k.startsWith("opt.") || k.startsWith("hint."));
  const hiDict = DICTS.hi;
  const teDict = DICTS.te;

  for (const k of enKeys) {
    assert.ok(
      k in hiDict,
      `Key '${k}' exists in English dictionary but is missing in Hindi dictionary`
    );
    assert.ok(
      k in teDict,
      `Key '${k}' exists in English dictionary but is missing in Telugu dictionary`
    );
  }
});
