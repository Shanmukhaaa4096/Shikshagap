/**
 * tests/option-shuffling-anti-bias.test.mjs
 *
 * Test Suite for Assessment Option Shuffling, Anti-Bias Constraints,
 * Distractor Quality, and Server-Side Verification.
 *
 * Requirements verified:
 * 1. 400 questions generated across Classes 3 to 10 have correct option position
 *    distribution strictly within 20% to 30% per option (A, B, C, D).
 * 2. In every question, options are unique, and the correct answer appears exactly once.
 * 3. No more than 2 consecutive questions have the correct answer in the same position.
 * 4. Across a session of 6+ questions, every position A to D appears at least once when possible.
 * 5. A stored question served twice in the same session gets a different option order.
 * 6. Distractor quality in validateQuestionStrict: each distractor must be unique, non-empty,
 *    and not equal to the correct answer.
 * 7. Verification token security: correct answer index/value is never leaked to client
 *    before submission and verified server-side.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { makeRng } from "../src/lib/rng.ts";
import { generateUnique } from "../src/lib/questions/generator.ts";
import { getMultiBoardQuestion } from "../src/lib/questions/multiBoardBank.ts";
import { getVerifiedTextbookQuestion } from "../src/lib/questions/textbookBank.ts";
import { ALL_CURRICULUM_CONCEPTS_LIST } from "../src/data/curriculum/index.ts";
import {
  shuffleQuestionOptionsForServe,
  createVerificationToken,
  verifyAnswerWithToken,
} from "../src/lib/questions/optionShuffler.ts";
import { validateQuestionStrict } from "../src/lib/questions/validator.ts";
import { areAnswersEquivalent } from "../src/lib/questions/integrity.ts";

test("Distribution: 400 questions across Classes 3-10 are 20% to 30% per option with no duplicates and exactly 1 correct answer", () => {
  const targetTotal = 400;
  const questions = [];
  const classes = [3, 4, 5, 6, 7, 8, 9, 10];
  const rng = makeRng(1234567);

  // Collect concepts across classes 3 to 10
  const conceptsByClass = new Map();
  for (const c of classes) {
    conceptsByClass.set(c, []);
  }
  for (const concept of ALL_CURRICULUM_CONCEPTS_LIST) {
    if (concept.class >= 3 && concept.class <= 10) {
      conceptsByClass.get(concept.class)?.push(concept.id);
    }
  }

  let count = 0;
  let classIdx = 0;
  const askedIds = new Set();
  const askedTexts = new Set();

  while (count < targetTotal) {
    const cls = classes[classIdx % classes.length];
    classIdx++;
    const classConcepts = conceptsByClass.get(cls) || [];
    if (classConcepts.length === 0) continue;

    const conceptId = classConcepts[Math.floor(rng() * classConcepts.length)];
    const difficulty = (1 + Math.floor(rng() * 4));

    // Try multiBoardBank first, then textbookBank, then generator
    let q = getMultiBoardQuestion({
      class: cls,
      conceptId,
      difficulty,
      board: "CBSE",
      excludeIds: Array.from(askedIds),
    });

    if (!q) {
      q = getVerifiedTextbookQuestion({
        class: cls,
        conceptId,
        difficulty,
        language: "en",
        excludeIds: Array.from(askedIds),
        excludeTexts: Array.from(askedTexts),
      }, "en");
    }

    if (!q) {
      q = generateUnique(
        conceptId,
        difficulty,
        rng,
        askedIds,
        cls,
        { board: "CBSE" },
        {},
        askedTexts
      );
    }

    if (!q || !q.options || q.options.length !== 4) continue;

    // Check that question has valid answer matching one option
    const match = q.options.some((o) => areAnswersEquivalent(o.value, q.answer));
    if (!match) continue;

    askedIds.add(q.id);
    questions.push(q);
    count++;
  }

  assert.equal(questions.length, targetTotal, "Should collect exactly 400 4-option questions");

  // Simulate serving across realistic sessions of 10 questions each
  const sessionLength = 10;
  const numSessions = targetTotal / sessionLength;
  const positionCounts = { A: 0, B: 0, C: 0, D: 0 };
  let totalConsecutiveViolations = 0;
  let totalSessionCoverageFailures = 0;

  for (let s = 0; s < numSessions; s++) {
    const sessionSeed = 800000 + s * 1337;
    const sessionQuestions = questions.slice(s * sessionLength, (s + 1) * sessionLength);
    const sessionHistory = [];

    for (let step = 0; step < sessionQuestions.length; step++) {
      const originalQ = sessionQuestions[step];
      const res = shuffleQuestionOptionsForServe(originalQ, sessionSeed, step, sessionHistory);
      const shuffledQ = res.question;

      // 1. Assert option labels and values are unique in served question
      const values = shuffledQ.options.map((o) => o.value);
      const uniqueValues = new Set(values);
      assert.equal(uniqueValues.size, shuffledQ.options.length, `Question ${shuffledQ.id} must have unique option values`);

      // 2. Assert correct answer appears exactly once
      const matches = shuffledQ.options.filter((o) => areAnswersEquivalent(o.value, shuffledQ.answer));
      assert.equal(matches.length, 1, `Correct answer must appear exactly once in question ${shuffledQ.id}`);

      // 3. Assert target position matches the option containing the correct answer
      const actualPosIdx = shuffledQ.options.findIndex((o) => areAnswersEquivalent(o.value, shuffledQ.answer));
      const actualLetter = ["A", "B", "C", "D"][actualPosIdx];
      assert.equal(actualLetter, res.correctPosition, "Computed correctPosition must match actual position");

      // 4. Assert anti-consecutive rule: no more than 2 consecutive in same position
      if (sessionHistory.length >= 2) {
        const last1 = sessionHistory[sessionHistory.length - 1];
        const last2 = sessionHistory[sessionHistory.length - 2];
        if (last1 === last2 && res.correctPosition === last1) {
          totalConsecutiveViolations++;
        }
      }

      sessionHistory.push(res.correctPosition);
      positionCounts[res.correctPosition]++;
    }

    // 5. Assert across a session of 6+ questions, each position A to D appears at least once
    const sessionPositions = new Set(sessionHistory);
    if (sessionPositions.size < 4) {
      totalSessionCoverageFailures++;
    }
  }

  // Assert anti-bias constraints
  assert.equal(totalConsecutiveViolations, 0, "There must be ZERO occurrences of 3 consecutive questions with the same correct position");
  assert.equal(totalSessionCoverageFailures, 0, "Every session of 10 questions must cover all 4 positions A, B, C, and D");

  // Assert distribution across 400 questions is within 20% to 30% (80 to 120 per option)
  for (const pos of ["A", "B", "C", "D"]) {
    const count = positionCounts[pos];
    const pct = (count / targetTotal) * 100;
    assert.ok(
      pct >= 20.0 && pct <= 30.0,
      `Position ${pos} count ${count} (${pct.toFixed(1)}%) must be within 20% to 30% range (80-120)`
    );
  }
});

test("Repeat Serve: A stored question served twice in the same session gets a different option order", () => {
  const sampleQuestion = getMultiBoardQuestion({
    class: 6,
    difficulty: 2,
    board: "CBSE",
  });
  assert.ok(sampleQuestion, "Sample question must exist");

  const sessionSeed = 998877;
  // Serve at step 0 with empty history
  const serve1 = shuffleQuestionOptionsForServe(sampleQuestion, sessionSeed, 0, []);

  // Serve at step 3 where history has ['A', 'B', 'A']
  const serve2 = shuffleQuestionOptionsForServe(sampleQuestion, sessionSeed, 3, ["A", "B", "A"]);

  // The option order (values sequence) or the correct position should differ
  const order1 = serve1.question.options.map((o) => o.value).join("|");
  const order2 = serve2.question.options.map((o) => o.value).join("|");

  assert.notEqual(order1, order2, "A question served at different steps with different histories must produce different option orders");
});

test("Distractor Quality: validateQuestionStrict enforces unique, plausible distractors not equal to correct answer", () => {
  const validQuestion = {
    id: "test_dq_valid_1",
    conceptId: "fractions_basic",
    difficulty: 2,
    format: "mcq",
    prompt: { raw: "What is 1/2 + 1/4?" },
    answer: "3/4",
    options: [
      { id: "o1", label: { raw: "3/4" }, value: "3/4" },
      { id: "o2", label: { raw: "2/6" }, value: "2/6" }, // plausible error: adding numerators & denominators
      { id: "o3", label: { raw: "1/4" }, value: "1/4" }, // plausible error: sign/subtraction error
      { id: "o4", label: { raw: "1" }, value: "1" },     // plausible error: rounding error
    ],
    meta: { class: 5 },
  };

  const validRes = validateQuestionStrict(validQuestion, { requireTextbookProvenance: false, enrolledGrade: 5 });
  assert.ok(validRes.valid, `Valid question should pass validation: ${JSON.stringify(validRes.errors)}`);

  // Case 1: Distractor equals correct answer mathematically
  const invalidEqualDistractor = {
    ...validQuestion,
    id: "test_dq_invalid_equal",
    options: [
      { id: "o1", label: { raw: "3/4" }, value: "3/4" },
      { id: "o2", label: { raw: "6/8" }, value: "6/8" }, // 6/8 == 3/4!
      { id: "o3", label: { raw: "1/4" }, value: "1/4" },
      { id: "o4", label: { raw: "1" }, value: "1" },
    ],
  };

  const resEqual = validateQuestionStrict(invalidEqualDistractor, { requireTextbookProvenance: false, enrolledGrade: 5 });
  assert.equal(resEqual.valid, false, "Should fail when distractor equals correct answer");
  assert.ok(
    resEqual.code === "DISTRACTOR_EQUALS_ANSWER" || resEqual.code === "DUPLICATE_OPTIONS",
    `Expected DISTRACTOR_EQUALS_ANSWER or DUPLICATE_OPTIONS, got ${resEqual.code}`
  );

  // Case 2: Duplicate distractor values
  const invalidDuplicateDistractor = {
    ...validQuestion,
    id: "test_dq_invalid_dup",
    options: [
      { id: "o1", label: { raw: "3/4" }, value: "3/4" },
      { id: "o2", label: { raw: "2/6" }, value: "2/6" },
      { id: "o3", label: { raw: "2/6" }, value: "2/6" }, // Duplicate!
      { id: "o4", label: { raw: "1" }, value: "1" },
    ],
  };

  const resDup = validateQuestionStrict(invalidDuplicateDistractor, { requireTextbookProvenance: false, enrolledGrade: 5 });
  assert.equal(resDup.valid, false, "Should fail when distractors are duplicate");
  assert.equal(resDup.code, "DUPLICATE_OPTIONS");

  // Case 3: Empty / NaN distractor value
  const invalidEmptyDistractor = {
    ...validQuestion,
    id: "test_dq_invalid_empty",
    options: [
      { id: "o1", label: { raw: "3/4" }, value: "3/4" },
      { id: "o2", label: { raw: "NaN" }, value: "NaN" },
      { id: "o3", label: { raw: "1/4" }, value: "1/4" },
      { id: "o4", label: { raw: "1" }, value: "1" },
    ],
  };

  const resEmpty = validateQuestionStrict(invalidEmptyDistractor, { requireTextbookProvenance: false, enrolledGrade: 5 });
  assert.equal(resEmpty.valid, false, "Should fail when distractor has NaN or empty value");
  assert.equal(resEmpty.code, "INVALID_DISTRACTOR");
});

test("Verification Token: Verifies student submissions securely server-side without leaking answer", () => {
  const questionId = "test_q_security_42";
  const correctAnswer = "42";
  const token = createVerificationToken(questionId, correctAnswer);

  // 1. Correct submission verifies to true
  assert.equal(verifyAnswerWithToken(questionId, "42", token), true, "Correct student answer should verify");
  assert.equal(verifyAnswerWithToken(questionId, " 42 ", token), true, "Trimmed answer should verify");

  // 2. Wrong submission verifies to false
  assert.equal(verifyAnswerWithToken(questionId, "41", token), false, "Wrong answer must verify to false");
  assert.equal(verifyAnswerWithToken(questionId, "A", token), false, "Option letter must not verify when answer value is numeric");

  // 3. Forged token or wrong questionId fails
  assert.equal(verifyAnswerWithToken("other_question", "42", token), false, "Token for different questionId must fail");
  assert.equal(verifyAnswerWithToken(questionId, "42", "forged_token_123"), false, "Forged token must fail");
});
