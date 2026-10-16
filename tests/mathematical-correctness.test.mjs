/**
 * tests/mathematical-correctness.test.mjs
 *
 * Production Quality & Educational Correctness Verification Suite:
 * 1. Strict mathematical correctness contract (deterministic recomputation).
 * 2. Distinct options invariant (zero duplicate options for any question).
 * 3. Exactly one matching option for multiple choice questions.
 * 4. Ground truth agreement between operands, expressions, and answer keys.
 * 5. Protection of specialized formats from word problem prompt destruction.
 * 6. High-volume coverage across all 19 concepts, grades 3-5, difficulties 1-3.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { makeRng } from "../src/lib/rng.ts";
import {
  generateQuestion,
  generateQuestionWithVariety,
  applyQuestionFormat,
} from "../src/lib/questions/generator.ts";
import {
  validateQuestionIntegrity,
} from "../src/lib/questions/integrity.ts";
import {
  extractQuestionOperands,
  normalizeAnswer,
} from "../src/lib/questions/hybridGenerator.ts";

const ALL_CONCEPTS = [
  "number_sense",
  "place_value",
  "addition",
  "subtraction",
  "mult_concept",
  "mult_facts",
  "multi_digit_mult",
  "division_concept",
  "division_facts",
  "long_division",
  "division_word",
  "fraction_basics",
  "equivalent_fractions",
  "comparing_fractions",
  "fraction_addition",
  "addition_3digit",
  "subtraction_3digit",
  "division_sharing",
  "money_math",
];

test("Integrity Contract: detects malformed questions correctly", () => {
  // Empty answer
  assert.equal(
    validateQuestionIntegrity({
      conceptId: "addition",
      difficulty: 1,
      format: "mcq",
      answer: "",
      prompt: { raw: "test" },
    }).valid,
    false
  );

  // Duplicate options
  assert.equal(
    validateQuestionIntegrity({
      conceptId: "addition",
      difficulty: 1,
      format: "mcq",
      answer: "5",
      options: [
        { id: "o1", label: { raw: "5" }, value: "5" },
        { id: "o2", label: { raw: "5" }, value: "5" },
        { id: "o3", label: { raw: "6" }, value: "6" },
        { id: "o4", label: { raw: "7" }, value: "7" },
      ],
      prompt: { raw: "test" },
    }).valid,
    false
  );

  // No option matches answer key
  assert.equal(
    validateQuestionIntegrity({
      conceptId: "addition",
      difficulty: 1,
      format: "mcq",
      answer: "10",
      options: [
        { id: "o1", label: { raw: "1" }, value: "1" },
        { id: "o2", label: { raw: "2" }, value: "2" },
        { id: "o3", label: { raw: "3" }, value: "3" },
        { id: "o4", label: { raw: "4" }, value: "4" },
      ],
      prompt: { raw: "test" },
    }).valid,
    false
  );

  // Mathematical mismatch between operands and answer
  assert.equal(
    validateQuestionIntegrity({
      conceptId: "addition",
      difficulty: 1,
      format: "short_answer",
      answer: "15",
      meta: { a: 5, b: 5, op: "+" },
      prompt: { raw: "test" },
    }).valid,
    false
  );

  // True/False contradiction
  assert.equal(
    validateQuestionIntegrity({
      conceptId: "addition",
      difficulty: 1,
      format: "true_false",
      expression: "2 + 2 = 5",
      answer: "True",
      options: [
        { id: "o1", label: { raw: "True" }, value: "True" },
        { id: "o2", label: { raw: "False" }, value: "False" },
      ],
      prompt: { raw: "test" },
    }).valid,
    false
  );
});

test("Regression: mult_concept diff 2 produces strictly distinct options when n === v", () => {
  for (let seed = 1; seed <= 50; seed++) {
    const rng = makeRng(seed * 111);
    const q = generateQuestion("mult_concept", 2, rng, 3);
    assert.equal(q.format, "mcq");
    assert.ok(q.options && q.options.length === 4);

    const normOpts = q.options.map((o) => normalizeAnswer(o.value));
    const uniqueOpts = new Set(normOpts);
    assert.equal(uniqueOpts.size, 4, `Duplicate option in mult_concept diff 2 (seed ${seed}): ${normOpts.join(", ")}`);

    const integrity = validateQuestionIntegrity(q);
    assert.ok(integrity.valid, `Integrity failed for mult_concept: ${integrity.reason}`);
  }
});

test("Regression: fraction_basics diff 1 produces strictly distinct options for all denominators", () => {
  for (let seed = 1; seed <= 50; seed++) {
    const rng = makeRng(seed * 222);
    const q = generateQuestion("fraction_basics", 1, rng, 3);
    assert.equal(q.format, "mcq");
    assert.ok(q.options && q.options.length === 4);

    const normOpts = q.options.map((o) => normalizeAnswer(o.value));
    const uniqueOpts = new Set(normOpts);
    assert.equal(uniqueOpts.size, 4, `Duplicate option in fraction_basics diff 1 (seed ${seed}): ${normOpts.join(", ")}`);

    const integrity = validateQuestionIntegrity(q);
    assert.ok(integrity.valid, `Integrity failed for fraction_basics: ${integrity.reason}`);
  }
});

test("Hybrid Generator: specialized formats are never eligible for arbitrary word problems", () => {
  const rng = makeRng(555);
  const base = generateQuestion("addition", 2, rng, 4);

  const formats = ["true_false", "find_mistake", "choose_working", "compare_answers", "missing_number"];
  for (const fmt of formats) {
    const formatted = applyQuestionFormat(base, fmt, rng);
    const extracted = extractQuestionOperands(formatted);
    assert.ok(extracted, `Expected extracted object for format ${fmt}`);
    assert.equal(extracted.isEligibleForWordProblem, false, `Format ${fmt} should NOT be eligible for word problem replacement`);
  }
});

test("Zero Invalid Questions Across All 19 Concepts x 3 Difficulties x 3 Grades", () => {
  let validatedCount = 0;
  for (const concept of ALL_CONCEPTS) {
    for (const diff of [1, 2, 3]) {
      for (const grade of [3, 4, 5]) {
        for (let seed = 1; seed <= 15; seed++) {
          const rng = makeRng(seed * 333 + diff * 17 + grade);
          const q = generateQuestion(concept, diff, rng, grade);
          const integrity = validateQuestionIntegrity(q);
          assert.ok(
            integrity.valid,
            `Invalid question generated for concept ${concept}, diff ${diff}, grade ${grade}, seed ${seed}: ${integrity.reason}`
          );
          validatedCount++;
        }
      }
    }
  }
  assert.ok(validatedCount >= 2565);
});

test("Zero Invalid Questions with Variety Generation across All Concepts", () => {
  let validatedVarietyCount = 0;
  for (const concept of ALL_CONCEPTS) {
    for (const diff of [1, 2, 3]) {
      for (const grade of [3, 4, 5]) {
        for (let seed = 1; seed <= 15; seed++) {
          const rng = makeRng(seed * 444 + diff * 19 + grade);
          const q = generateQuestionWithVariety(concept, diff, rng, grade);
          const integrity = validateQuestionIntegrity(q);
          assert.ok(
            integrity.valid,
            `Invalid variety question for concept ${concept}, diff ${diff}, grade ${grade}, seed ${seed}: ${integrity.reason}`
          );
          validatedVarietyCount++;
        }
      }
    }
  }
  assert.ok(validatedVarietyCount >= 2565);
});
