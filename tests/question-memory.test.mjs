/**
 * tests/question-memory.test.mjs
 *
 * Verifies Persistent Question Memory specifications:
 * 1. App behaves properly when DATABASE_URL is off/empty.
 * 2. Questions are retrieved without repeats in a session.
 * 3. Never stores student names, roll numbers, or identifying telemetry (rejects PII).
 * 4. Retired questions (too easy, too hard, or teacher reported) are not retrieved.
 * 5. Teacher reporting marks questions unapproved and requires teacher approval before reuse.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  saveValidatedQuestion,
  retrieveQuestionMemory,
  recordAnonymousQuestionResult,
  reportQuestion,
  approveQuestion,
  recordAnonymousMisconception,
  getAnonymousMisconceptionTallies,
  resetQuestionMemoryForTesting,
  isDatabaseConfigured,
} from "../src/lib/db/questionMemory.ts";

test("Question Memory: handles unconfigured DATABASE_URL safely", () => {
  assert.equal(isDatabaseConfigured(), false);
});

test("Question Memory: rejects any student PII fields (strict DPDP compliance)", async () => {
  resetQuestionMemoryForTesting();

  // Attempt to save with studentName
  await assert.rejects(
    async () => {
      await saveValidatedQuestion({
        grade: 3,
        conceptId: "addition_facts",
        language: "en",
        theme: "market",
        text: "A vendor had 4 apples and got 3 more. How many?",
        operands: [4, 3],
        embedding: [],
        // @ts-expect-error Testing runtime PII rejection
        studentName: "Rahul",
      });
    },
    /PRIVACY VIOLATION/i,
    "Should throw error when studentName is provided"
  );

  // Attempt to save with rollNumber
  await assert.rejects(
    async () => {
      await saveValidatedQuestion({
        grade: 4,
        conceptId: "multiplication_facts",
        language: "en",
        theme: "library",
        text: "There are 4 rows with 5 books each. How many?",
        operands: [4, 5],
        embedding: [],
        // @ts-expect-error Testing runtime PII rejection
        rollNumber: 12,
      });
    },
    /PRIVACY VIOLATION/i,
    "Should throw error when rollNumber is provided"
  );

  // Attempt to save with typedAnswer
  await assert.rejects(
    async () => {
      await saveValidatedQuestion({
        grade: 5,
        conceptId: "fractions_unit",
        language: "en",
        theme: "school",
        text: "A pizza was divided into 4 pieces. How much is 1 slice?",
        operands: [1, 4],
        embedding: [],
        // @ts-expect-error Testing runtime PII rejection
        typedAnswer: "one fourth",
      });
    },
    /PRIVACY VIOLATION/i,
    "Should throw error when typedAnswer is provided"
  );
});

test("Question Memory: saves validated questions and retrieves good examples without repeats", async () => {
  resetQuestionMemoryForTesting();

  const q1 = await saveValidatedQuestion({
    id: "q_mem_1",
    grade: 3,
    conceptId: "addition_facts",
    language: "en",
    theme: "gardening",
    text: "A gardener planted 5 red roses and 4 white roses. How many roses are planted?",
    operands: [5, 4],
    embedding: [],
  });

  const q2 = await saveValidatedQuestion({
    id: "q_mem_2",
    grade: 3,
    conceptId: "addition_facts",
    language: "en",
    theme: "sports",
    text: "A student collected 6 footballs and 3 basketballs. How many balls in total?",
    operands: [6, 3],
    embedding: [],
  });

  assert.equal(q1.id, "q_mem_1");
  assert.equal(q2.id, "q_mem_2");

  const memory = await retrieveQuestionMemory(3, "addition_facts", "en");
  assert.equal(memory.goodExamples.length, 2);
  const ids = memory.goodExamples.map((x) => x.id);
  assert.deepEqual(ids.sort(), ["q_mem_1", "q_mem_2"]);
});

test("Question Memory: retired questions (too hard / too easy) are not retrieved", async () => {
  resetQuestionMemoryForTesting();

  const qHard = await saveValidatedQuestion({
    id: "q_hard",
    grade: 4,
    conceptId: "subtraction_facts",
    language: "en",
    theme: "baking",
    text: "A baker made 85 buns and sold 47. How many remain?",
    operands: [85, 47],
    embedding: [],
  });

  // Simulate 6 attempts with 0 correct (< 15% success rate -> retired)
  for (let i = 0; i < 6; i++) {
    await recordAnonymousQuestionResult(qHard.id, false);
  }

  const memory = await retrieveQuestionMemory(4, "subtraction_facts", "en");
  // Retired question should NOT be included in good examples
  assert.equal(memory.goodExamples.some((q) => q.id === "q_hard"), false);
});

test("Question Memory: teacher reported questions are retired and require approval before reuse", async () => {
  resetQuestionMemoryForTesting();

  const qReported = await saveValidatedQuestion({
    id: "q_reported_1",
    grade: 5,
    conceptId: "multiplication_facts",
    language: "en",
    theme: "classroom",
    text: "A teacher brought 6 packs of 8 pencils. How many pencils?",
    operands: [6, 8],
    embedding: [],
  });

  // Confirm initially retrieved
  let memory = await retrieveQuestionMemory(5, "multiplication_facts", "en");
  assert.equal(memory.goodExamples.some((q) => q.id === "q_reported_1"), true);

  // Teacher flags question
  const reportRes = await reportQuestion(qReported.id, "Ambiguous sentence phrasing");
  assert.equal(reportRes.success, true);
  assert.equal(reportRes.requiresApproval, true);

  // Reported question must NOT be retrieved
  memory = await retrieveQuestionMemory(5, "multiplication_facts", "en");
  assert.equal(memory.goodExamples.some((q) => q.id === "q_reported_1"), false);

  // After teacher reviews and approves, it is restored
  const approved = await approveQuestion(qReported.id);
  assert.equal(approved, true);

  memory = await retrieveQuestionMemory(5, "multiplication_facts", "en");
  assert.equal(memory.goodExamples.some((q) => q.id === "q_reported_1"), true);
});

test("Question Memory: tracks aggregate misconception tallies anonymously", async () => {
  resetQuestionMemoryForTesting();

  await recordAnonymousMisconception(3, "addition_3digit", "en", "regrouping_error");
  await recordAnonymousMisconception(3, "addition_3digit", "en", "regrouping_error");
  await recordAnonymousMisconception(3, "addition_3digit", "en", "place_value_shift");

  const tallies = getAnonymousMisconceptionTallies();
  assert.equal(tallies.length, 2);

  const regrouping = tallies.find((t) => t.errorType === "regrouping_error");
  assert.ok(regrouping);
  assert.equal(regrouping.count, 2);
  assert.equal(regrouping.grade, 3);
});
