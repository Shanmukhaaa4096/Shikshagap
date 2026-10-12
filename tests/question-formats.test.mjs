/**
 * tests/question-formats.test.mjs
 *
 * Verifies Step 12: Question variety in shape
 * 1. Checks that formats (missing_number, find_mistake, true_false, choose_working, compare_answers)
 *    are accurately generated with strictly code-computed answers and distractors.
 * 2. In one test, verifies that the engine never uses the same format twice in a row.
 * 3. In one full test session, verifies that at least 3 distinct formats are used where the concept allows.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { makeRng } from "../src/lib/rng.ts";
import {
  generateQuestion,
  applyQuestionFormat,
  generateUnique,
} from "../src/lib/questions/generator.ts";

test("Question Formats: code computes answers and wrong options for missing_number", () => {
  const rng = makeRng(42);
  const base = generateQuestion("addition", 2, rng, 3);
  const formatted = applyQuestionFormat(base, "missing_number", rng);

  assert.equal(formatted.format, "missing_number");
  assert.ok(formatted.expression?.includes("[ ? ]"));

  const a = base.meta.a;
  const b = base.meta.b;
  // Answer must be one of the original operands
  assert.ok(formatted.answer === String(a) || formatted.answer === String(b));

  // Options must be present and contain the correct answer
  assert.ok(formatted.options && formatted.options.length >= 2);
  assert.ok(formatted.options.some((opt) => opt.value === formatted.answer));
});

test("Question Formats: code computes answers and wrong options for true_false", () => {
  const rng = makeRng(100);
  const base = generateQuestion("mult_facts", 2, rng, 4);
  const formatted = applyQuestionFormat(base, "true_false", rng);

  assert.equal(formatted.format, "true_false");
  assert.ok(formatted.answer === "True" || formatted.answer === "False");
  assert.equal(formatted.options?.length, 2);
  assert.deepEqual(
    formatted.options?.map((o) => o.value).sort(),
    ["False", "True"]
  );
});

test("Question Formats: code computes answers and wrong options for find_mistake", () => {
  const rng = makeRng(202);
  const base = generateQuestion("subtraction", 2, rng, 4);
  const formatted = applyQuestionFormat(base, "find_mistake", rng);

  assert.equal(formatted.format, "find_mistake");
  assert.ok(formatted.answer === "Correct" || formatted.answer === "Mistake");
  assert.equal(formatted.options?.length, 2);
  assert.deepEqual(
    formatted.options?.map((o) => o.value).sort(),
    ["Correct", "Mistake"]
  );
});

test("Question Formats: code computes answers and wrong options for choose_working", () => {
  const rng = makeRng(303);
  const base = generateQuestion("addition_3digit", 2, rng, 3);
  const formatted = applyQuestionFormat(base, "choose_working", rng);

  assert.equal(formatted.format, "choose_working");
  assert.ok(formatted.options && formatted.options.length >= 2);
  assert.ok(formatted.options.some((o) => o.value === formatted.answer));
  assert.ok(formatted.options.some((o) => o.errorType !== undefined));
});

test("Question Formats: code computes answers and wrong options for compare_answers", () => {
  const rng = makeRng(404);
  const base = generateQuestion("division_facts", 2, rng, 4);
  const formatted = applyQuestionFormat(base, "compare_answers", rng);

  assert.equal(formatted.format, "compare_answers");
  assert.ok(formatted.answer.startsWith("Student A:") || formatted.answer.startsWith("Student B:"));
  assert.equal(formatted.options?.length, 2);
  assert.ok(formatted.options.some((o) => o.value === formatted.answer));
});

test("Step 12: In one test never use the same format twice in a row", () => {
  const rng = makeRng(555);
  const seen = new Set();
  const formatsUsed = [];

  for (let i = 0; i < 10; i++) {
    const lastFormat = formatsUsed.length > 0 ? formatsUsed[formatsUsed.length - 1] : undefined;
    const q = generateUnique(
      "addition_3digit",
      2,
      rng,
      seen,
      3,
      {},
      { avoidFormat: lastFormat }
    );

    if (lastFormat) {
      assert.notEqual(
        q.format,
        lastFormat,
        `Consecutive question ${i} repeated format ${q.format}`
      );
    }
    formatsUsed.push(q.format);
  }
});

test("Step 12: Use at least 3 formats per test where the concept allows", () => {
  const rng = makeRng(777);
  const seen = new Set();
  const formatsUsed = new Set();
  let lastFormat;

  // Run 8 questions across concepts
  const concepts = [
    "addition_3digit",
    "subtraction_3digit",
    "mult_facts",
    "division_sharing",
    "money_math",
    "addition",
    "subtraction",
    "multi_digit_mult",
  ];

  for (let i = 0; i < concepts.length; i++) {
    const concept = concepts[i];
    const q = generateUnique(
      concept,
      2,
      rng,
      seen,
      4,
      {},
      { avoidFormat: lastFormat }
    );
    formatsUsed.add(q.format);
    lastFormat = q.format;
  }

  // Must have used at least 3 distinct formats
  assert.ok(
    formatsUsed.size >= 3,
    `Expected at least 3 formats across test, got ${formatsUsed.size} (${Array.from(formatsUsed).join(", ")})`
  );
});
