import test from "node:test";
import assert from "node:assert/strict";
import { generateQuestion } from "../src/lib/questions/generator.ts";
import {
  enhanceQuestionWithHybridWording,
  extractQuestionOperands,
  getReadingLevelWordCap,
  countWords,
  validateReadingLevel,
  normalizeAnswer,
} from "../src/lib/questions/hybridGenerator.ts";

test("Step 6: Reading-level limit rules and word count caps", () => {
  assert.equal(getReadingLevelWordCap(3), 30, "Class 3 cap should be 30 words");
  assert.equal(getReadingLevelWordCap(4), 40, "Class 4 cap should be 40 words");
  assert.equal(getReadingLevelWordCap(5), 45, "Class 5 cap should be 45 words");

  const text31Words = new Array(31).fill("word").join(" ");
  assert.equal(countWords(text31Words), 31);
  assert.equal(validateReadingLevel(text31Words, 3).valid, false, "31 words exceeds Class 3 cap");
  assert.equal(validateReadingLevel(text31Words, 4).valid, true, "31 words is within Class 4 cap");

  const text42Words = new Array(42).fill("word").join(" ");
  assert.equal(validateReadingLevel(text42Words, 4).valid, false, "42 words exceeds Class 4 cap");
  assert.equal(validateReadingLevel(text42Words, 5).valid, true, "42 words is within Class 5 cap");
});

test("Step 6: normalizeAnswer handles numeric, currency, and punctuation variations", () => {
  assert.equal(normalizeAnswer("45"), "45");
  assert.equal(normalizeAnswer(45), "45");
  assert.equal(normalizeAnswer(" 45.0 "), "45");
  assert.equal(normalizeAnswer("₹ 120"), "120");
  assert.equal(normalizeAnswer("Rs. 120/-"), "120");
  assert.equal(normalizeAnswer("120 rupees."), "120");
  assert.equal(normalizeAnswer(" 3/4 "), "3/4");
});

test("Step 6: Blind solver mismatch is rejected and retries, accepting on correct answer", async () => {
  const baseQ = generateQuestion("addition", 2, Math.random, 3);
  const operands = extractQuestionOperands(baseQ).operands;
  const expectedAnswer = String(Number(operands[0]) + Number(operands[1]));

  let attemptCount = 0;
  let solverCallCount = 0;

  const mockClient = {
    models: {
      generateContent: async (args) => {
        const text = args.contents?.[0]?.parts?.[0]?.text || "";
        if (text.includes("Question:")) {
          solverCallCount++;
          // First solver call returns wrong answer (mismatch)
          if (solverCallCount === 1) {
            return { text: JSON.stringify({ answer: "9999" }) };
          }
          // Second solver call returns correct answer
          return { text: JSON.stringify({ answer: expectedAnswer }) };
        }

        // Wording generator call
        attemptCount++;
        return {
          text: JSON.stringify({
            wordProblem: `At the library, a student has ${operands[0]} books and borrows ${operands[1]} books. How many total?`,
            scenarioTopic: "classroom library",
          }),
        };
      },
    },
  };

  const seen = new Set();
  const enhanced = await enhanceQuestionWithHybridWording(
    baseQ,
    "en",
    3,
    seen,
    { client: mockClient }
  );

  assert.equal(solverCallCount, 2, "Solver should be called twice (1 mismatch + 1 match)");
  assert.equal(attemptCount, 2, "Should retry wording generation after mismatch");
  assert.equal(enhanced.answer, baseQ.answer);
  assert.ok(enhanced.prompt.raw.includes(String(operands[0])));
});

test("Step 6: Blind solver 3-retry limit triggers deterministic fallback to template", async () => {
  const baseQ = generateQuestion("addition", 2, Math.random, 3);
  const operands = extractQuestionOperands(baseQ).operands;

  let solverCallCount = 0;
  const mockClient = {
    models: {
      generateContent: async (args) => {
        const text = args.contents?.[0]?.parts?.[0]?.text || "";
        if (text.includes("Question:")) {
          solverCallCount++;
          // Always return wrong answer
          return { text: JSON.stringify({ answer: "wrong_answer" }) };
        }
        return {
          text: JSON.stringify({
            wordProblem: `In a shop, a shopkeeper counts ${operands[0]} apples and ${operands[1]} mangoes. Total fruits?`,
            scenarioTopic: "local weekly market",
          }),
        };
      },
    },
  };

  const seen = new Set();
  const enhanced = await enhanceQuestionWithHybridWording(
    baseQ,
    "en",
    3,
    seen,
    { client: mockClient }
  );

  assert.equal(solverCallCount, 3, "Should attempt blind solver up to 3 times");
  // Falls back to base question prompt
  assert.deepEqual(enhanced.prompt, baseQ.prompt, "Should fall back to template prompt after 3 mismatches");
});

test("Step 6: Reading-level violation (>30 words for Class 3) is rejected and retries", async () => {
  const baseQ = generateQuestion("addition", 2, Math.random, 3);
  const operands = extractQuestionOperands(baseQ).operands;
  const expectedAnswer = String(Number(operands[0]) + Number(operands[1]));

  let wordingAttempts = 0;
  const mockClient = {
    models: {
      generateContent: async (args) => {
        const text = args.contents?.[0]?.parts?.[0]?.text || "";
        if (text.includes("Question:")) {
          return { text: JSON.stringify({ answer: expectedAnswer }) };
        }

        wordingAttempts++;
        if (wordingAttempts === 1) {
          // Attempt 1: 34 words (exceeds Class 3 cap of 30 words)
          const longStory = `In a very long and sunny school sports day morning in the village playground, a teacher gathered ${operands[0]} excited children on the grass and then another group of ${operands[1]} happy children arrived running. How many children total?`;
          assert.ok(countWords(longStory) > 30, "First story must exceed 30 words");
          return {
            text: JSON.stringify({
              wordProblem: longStory,
              scenarioTopic: "sports day",
            }),
          };
        }

        // Attempt 2: Short story (under 30 words)
        return {
          text: JSON.stringify({
            wordProblem: `On sports day, a coach counts ${operands[0]} red balls and ${operands[1]} blue balls. How many balls altogether?`,
            scenarioTopic: "sports day",
          }),
        };
      },
    },
  };

  const seen = new Set();
  const enhanced = await enhanceQuestionWithHybridWording(
    baseQ,
    "en",
    3,
    seen,
    { client: mockClient }
  );

  assert.equal(wordingAttempts, 2, "Should retry after reading-level rejection");
  assert.ok(enhanced.prompt.raw.includes("coach counts"));
});

test("Step 6: Blind solver is skipped if remaining time is under 800ms", async () => {
  const baseQ = generateQuestion("addition", 2, Math.random, 3);
  const operands = extractQuestionOperands(baseQ).operands;

  let solverCalled = false;
  const mockClient = {
    models: {
      generateContent: async (args) => {
        const text = args.contents?.[0]?.parts?.[0]?.text || "";
        if (text.includes("Question:")) {
          solverCalled = true;
          return { text: JSON.stringify({ answer: "9999" }) }; // Would fail if called!
        }
        return {
          text: JSON.stringify({
            wordProblem: `At a stall, a vendor sells ${operands[0]} pens and ${operands[1]} notebooks. How many items?`,
            scenarioTopic: "local weekly market",
          }),
        };
      },
    },
  };

  const seen = new Set();
  // Set totalTimeBudgetMs to a very small budget (700ms), which triggers the skip (<800ms)
  const enhanced = await enhanceQuestionWithHybridWording(
    baseQ,
    "en",
    3,
    seen,
    { client: mockClient, totalTimeBudgetMs: 700 }
  );

  assert.equal(solverCalled, false, "Blind solver should be skipped when budget is under 800ms");
  assert.ok(enhanced.prompt.raw.includes(String(operands[0])), "Question accepted with solver skipped");
});
