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
  processAnonymousSession,
  getInMemoryQuestionStats,
  runMemoryUpkeep,
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

  // Simulate 30 attempts with 0 correct (< 15% success rate -> retired after at least 30 impressions)
  for (let i = 0; i < 30; i++) {
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

test("Step 10: Two sequential sessions raise the counts", async () => {
  resetQuestionMemoryForTesting();

  const q = await saveValidatedQuestion({
    id: "q_seq_1",
    grade: 3,
    conceptId: "addition_facts",
    language: "en",
    theme: "sports",
    text: "There are 3 blue balls and 4 red balls. How many?",
    operands: [3, 4],
    embedding: [],
  });

  const session1 = {
    sessionId: "sess_seq_1",
    grade: 3,
    language: "en",
    hourTimestamp: new Date().toISOString().slice(0, 13) + ":00:00.000Z",
    questions: [
      { questionId: q.id, conceptId: "addition_facts", level: 1, correct: true },
    ],
    topicOutcomes: [{ topicId: "addition", status: "mastered" }],
  };

  const session2 = {
    sessionId: "sess_seq_2",
    grade: 3,
    language: "en",
    hourTimestamp: new Date().toISOString().slice(0, 13) + ":00:00.000Z",
    questions: [
      { questionId: q.id, conceptId: "addition_facts", level: 1, correct: false, wrongOptionTag: "off_by_one" },
    ],
    topicOutcomes: [{ topicId: "addition", status: "needs_practice" }],
  };

  const res1 = await processAnonymousSession(session1);
  assert.equal(res1.success, true);
  assert.equal(res1.recorded, true);

  const res2 = await processAnonymousSession(session2);
  assert.equal(res2.success, true);
  assert.equal(res2.recorded, true);

  const stats = getInMemoryQuestionStats();
  const qStat = stats.get(q.id);
  assert.ok(qStat);
  assert.equal(qStat.timesShown, 2);
  assert.equal(qStat.timesCorrect, 1);

  // Check misconception tally from session 2
  const tallies = getAnonymousMisconceptionTallies();
  const tagTally = tallies.find((t) => t.errorType === "off_by_one");
  assert.ok(tagTally);
  assert.equal(tagTally.count, 1);
});

test("Step 10: Idempotency - the same session sent twice counts once", async () => {
  resetQuestionMemoryForTesting();

  const q = await saveValidatedQuestion({
    id: "q_idemp_1",
    grade: 4,
    conceptId: "multiplication_facts",
    language: "en",
    theme: "food",
    text: "4 bags each have 5 apples. How many?",
    operands: [4, 5],
    embedding: [],
  });

  const session = {
    sessionId: "sess_duplicate_123",
    grade: 4,
    language: "en",
    hourTimestamp: new Date().toISOString().slice(0, 13) + ":00:00.000Z",
    questions: [
      { questionId: q.id, conceptId: "multiplication_facts", level: 2, correct: true },
    ],
    topicOutcomes: [{ topicId: "multiplication", status: "mastered" }],
  };

  const firstCall = await processAnonymousSession(session);
  assert.equal(firstCall.success, true);
  assert.equal(firstCall.recorded, true);

  const secondCall = await processAnonymousSession(session);
  assert.equal(secondCall.success, true);
  assert.equal(secondCall.recorded, false);
  assert.equal(secondCall.duplicate, true);

  const stats = getInMemoryQuestionStats();
  const qStat = stats.get(q.id);
  assert.equal(qStat.timesShown, 1);
  assert.equal(qStat.timesCorrect, 1);
});

test("Step 10: Abandon path writes anonymous session data", async () => {
  resetQuestionMemoryForTesting();

  const q = await saveValidatedQuestion({
    id: "q_aband_1",
    grade: 5,
    conceptId: "fractions_unit",
    language: "en",
    theme: "shapes",
    text: "What fraction is 1 part out of 4 parts?",
    operands: [1, 4],
    embedding: [],
  });

  const abandonSession = {
    sessionId: "sess_abandon_999",
    grade: 5,
    language: "en",
    hourTimestamp: new Date().toISOString().slice(0, 13) + ":00:00.000Z",
    questions: [
      { questionId: q.id, conceptId: "fractions_unit", level: 1, correct: false, wrongOptionTag: "inverted_fraction" },
    ],
    topicOutcomes: [{ topicId: "fractions", status: "needs_practice" }],
  };

  const res = await processAnonymousSession(abandonSession);
  assert.equal(res.success, true);
  assert.equal(res.recorded, true);

  const stats = getInMemoryQuestionStats();
  assert.equal(stats.get(q.id)?.timesShown, 1);
  assert.equal(stats.get(q.id)?.timesCorrect, 0);
});

test("Step 10: Whitelist test fails if payload contains any key outside allowed list", async () => {
  resetQuestionMemoryForTesting();

  // Test root payload with extra key
  const invalidRoot = {
    sessionId: "sess_whitelist_1",
    grade: 3,
    language: "en",
    hourTimestamp: new Date().toISOString().slice(0, 13) + ":00:00.000Z",
    questions: [],
    topicOutcomes: [],
    studentName: "Aarav", // Illegal key
  };

  await assert.rejects(
    async () => {
      // @ts-expect-error Whitelist test with illegal key
      await processAnonymousSession(invalidRoot);
    },
    /WHITELIST VIOLATION/i,
    "Should reject payload with unauthorized top-level key"
  );

  // Test question object with extra key
  const invalidQuestion = {
    sessionId: "sess_whitelist_2",
    grade: 3,
    language: "en",
    hourTimestamp: new Date().toISOString().slice(0, 13) + ":00:00.000Z",
    questions: [
      {
        questionId: "q_1",
        conceptId: "addition_facts",
        level: 1,
        correct: true,
        rollNumber: 15, // Illegal key
      },
    ],
    topicOutcomes: [],
  };

  await assert.rejects(
    async () => {
      // @ts-expect-error Whitelist test with illegal question key
      await processAnonymousSession(invalidQuestion);
    },
    /WHITELIST VIOLATION/i,
    "Should reject question payload with unauthorized key"
  );
});

test("Step 10: Retirement invariant - question retires only after at least 30 impressions", async () => {
  resetQuestionMemoryForTesting();

  const q = await saveValidatedQuestion({
    id: "q_retire_30",
    grade: 3,
    conceptId: "addition_facts",
    language: "en",
    theme: "toys",
    text: "There are 5 cars and 2 bikes. How many toys?",
    operands: [5, 2],
    embedding: [],
  });

  // 15 fails in a row with 0% success (< 15%) BUT timesShown < 30 -> MUST NOT RETIRE
  for (let i = 1; i <= 15; i++) {
    await processAnonymousSession({
      sessionId: `sess_fail_${i}`,
      grade: 3,
      language: "en",
      hourTimestamp: new Date().toISOString().slice(0, 13) + ":00:00.000Z",
      questions: [{ questionId: q.id, conceptId: "addition_facts", level: 1, correct: false }],
      topicOutcomes: [],
    });
  }

  let memory = await retrieveQuestionMemory(3, "addition_facts", "en");
  // Still retrieved because timesShown is only 15 (< 30)
  assert.equal(memory.goodExamples.some((x) => x.id === q.id), true);

  // Deliver 15 more failures bringing timesShown to 30
  for (let i = 16; i <= 30; i++) {
    await processAnonymousSession({
      sessionId: `sess_fail_${i}`,
      grade: 3,
      language: "en",
      hourTimestamp: new Date().toISOString().slice(0, 13) + ":00:00.000Z",
      questions: [{ questionId: q.id, conceptId: "addition_facts", level: 1, correct: false }],
      topicOutcomes: [],
    });
  }

  // Now timesShown = 30 and successRate = 0% -> Question is retired!
  memory = await retrieveQuestionMemory(3, "addition_facts", "en");
  assert.equal(memory.goodExamples.some((x) => x.id === q.id), false);
});

test("Step 10: Next session's retrieval reads updated quality scores", async () => {
  resetQuestionMemoryForTesting();

  const qGood = await saveValidatedQuestion({
    id: "q_high_quality",
    grade: 3,
    conceptId: "addition_facts",
    language: "en",
    theme: "gardening",
    text: "5 flowers and 4 trees. How many plants?",
    operands: [5, 4],
    embedding: [],
  });

  // Deliver 35 balanced answers (approx 65% correct -> ideal formative range)
  for (let i = 1; i <= 35; i++) {
    await processAnonymousSession({
      sessionId: `sess_high_${i}`,
      grade: 3,
      language: "en",
      hourTimestamp: new Date().toISOString().slice(0, 13) + ":00:00.000Z",
      questions: [{ questionId: qGood.id, conceptId: "addition_facts", level: 1, correct: i % 3 !== 0 }],
      topicOutcomes: [],
    });
  }

  const memory = await retrieveQuestionMemory(3, "addition_facts", "en");
  const retrieved = memory.goodExamples.find((x) => x.id === qGood.id);
  assert.ok(retrieved);
  // Times shown and correct should be reflected
  assert.equal(retrieved.timesShown, 35);
  assert.ok(retrieved.qualityScore > 0.7);
});

test("Step 11: Memory upkeep recomputes scores, prunes >90 day retired questions/sessions, caps size, and logs summary", async () => {
  resetQuestionMemoryForTesting();

  const nowMs = Date.now();
  const ninetyFiveDaysAgo = new Date(nowMs - 95 * 24 * 60 * 60 * 1000).toISOString();
  const tenDaysAgo = new Date(nowMs - 10 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Create a retired question older than 90 days (should be deleted)
  const qOldRetired = await saveValidatedQuestion({
    id: "q_old_retired",
    grade: 3,
    conceptId: "addition_facts",
    language: "en",
    theme: "market",
    text: "Old question 1",
    operands: [1, 2],
    embedding: [],
  });
  qOldRetired.isRetired = true;
  qOldRetired.updatedAt = ninetyFiveDaysAgo;

  // 2. Create a retired question younger than 90 days (should be kept)
  const qRecentRetired = await saveValidatedQuestion({
    id: "q_recent_retired",
    grade: 3,
    conceptId: "addition_facts",
    language: "en",
    theme: "market",
    text: "Recent retired question",
    operands: [2, 3],
    embedding: [],
  });
  qRecentRetired.isRetired = true;
  qRecentRetired.updatedAt = tenDaysAgo;

  // 3. Create active questions
  for (let i = 1; i <= 5; i++) {
    await saveValidatedQuestion({
      id: `q_active_${i}`,
      grade: 3,
      conceptId: "addition_facts",
      language: "en",
      theme: "market",
      text: `Active question ${i}`,
      operands: [i, 1],
      embedding: [],
    });
  }

  // 4. Create an old session summary (> 90 days) and a recent one
  await processAnonymousSession({
    sessionId: "sess_old_summary",
    grade: 3,
    language: "en",
    hourTimestamp: ninetyFiveDaysAgo,
    questions: [],
    topicOutcomes: [],
  });
  // Manually backdate the createdAt
  const summaries = (await import("../src/lib/db/questionMemory.ts")).getAnonymousSessionSummaries();
  const oldSummary = summaries.find((s) => s.sessionId === "sess_old_summary");
  if (oldSummary) oldSummary.createdAt = ninetyFiveDaysAgo;

  await processAnonymousSession({
    sessionId: "sess_recent_summary",
    grade: 3,
    language: "en",
    hourTimestamp: tenDaysAgo,
    questions: [],
    topicOutcomes: [],
  });

  // Run upkeep with max cap of 4 items
  const res = await runMemoryUpkeep(4);

  // Assertions:
  // q_old_retired was pruned
  assert.equal(res.prunedQuestions, 1);
  // sess_old_summary was pruned
  assert.equal(res.prunedSessions, 1);
  // Total questions was 7 initially; 1 pruned -> 6 remaining; cap is 4 -> 2 capped
  assert.equal(res.sizeCapped, 2);
  // logSummary contains memory health keyword
  assert.ok(res.logSummary.includes("[MemoryHealth]"));
  assert.ok(res.logSummary.includes("active="));
  assert.ok(res.logSummary.includes("retired="));
  assert.ok(res.logSummary.includes("sessions=1"));
});


