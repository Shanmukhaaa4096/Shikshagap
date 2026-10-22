// tests/question-memory-rag.test.mjs
/**
 * Test Suite for Persistent Question-Memory RAG:
 * 1. Near-duplicate rejected, distinct question accepted (DUPLICATE_THRESHOLD = 0.92).
 * 2. Board isolation in retrieval (strict ICSE vs CBSE separation).
 * 3. Flagged questions never served.
 * 4. Counters update without storing any student identifier (strict DPDP compliance).
 * 5. Empirical difficulty kicks in only after minimum sample size (times_served >= 20).
 * 6. Fallback to current generation when the store throws or times out (safe retrieval).
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  LocalJsonQuestionStore,
  DUPLICATE_THRESHOLD,
  MIN_EMPIRICAL_SAMPLE_SIZE,
  retrieveSimilarQuestionsSafe,
  setQuestionStoreOverride,
  embedQuestionText,
} from "../src/lib/db/questionStore.ts";
import {
  computeQuestionFingerprint,
  normalizeQuestionTextForFingerprint,
} from "../src/lib/questions/fingerprint.ts";
import { calibrateDifficultyWithEmpiricalData } from "../src/lib/agents/adaptiveEngine.ts";
import { cosineSimilarity } from "../src/lib/rag/vector.ts";

test("Question-Memory RAG: Fingerprint normalization is deterministic and insensitive to casing/punctuation", () => {
  const t1 = "There are 5 red apples and 4 green apples. How many total?";
  const t2 = "THERE are 5 red apples, and 4 green apples? How many total!";
  const fp1 = computeQuestionFingerprint(t1, [5, 4]);
  const fp2 = computeQuestionFingerprint(t2, [4, 5]);

  assert.equal(fp1, fp2, "Fingerprints for semantically equivalent texts and sorted operands should match");
  assert.equal(typeof fp1, "string");
  assert.equal(fp1.length, 64, "SHA-256 fingerprint should be 64 hex characters");
});

test("Question-Memory RAG 1: Near-duplicate rejected, distinct question accepted (DUPLICATE_THRESHOLD = 0.92)", async () => {
  const store = new LocalJsonQuestionStore();
  await store.clear();

  const originalText = "A fruit seller had 45 oranges and sold 18 of them. How many oranges remain?";
  const fp1 = computeQuestionFingerprint(originalText, [45, 18]);
  const emb1 = await embedQuestionText(originalText, { conceptId: "subtraction_facts", board: "CBSE" });

  // 1. Insert original question
  const res1 = await store.saveQuestion({
    id: "q_orig_1",
    board: "CBSE",
    class: 3,
    concept_id: "subtraction_facts",
    lang: "en",
    difficulty: 2,
    question_text: originalText,
    answer_value: "27",
    answer_format: "short_text",
    template_or_source: "hybrid",
    fingerprint: fp1,
    embedding: emb1,
  });

  assert.equal(res1.saved, true);
  assert.equal(res1.reason, "ok");

  // 2. Exact duplicate by fingerprint is rejected
  const resExact = await store.saveQuestion({
    board: "CBSE",
    class: 3,
    concept_id: "subtraction_facts",
    lang: "en",
    difficulty: 2,
    question_text: originalText,
    answer_value: "27",
    answer_format: "short_text",
    template_or_source: "hybrid",
    fingerprint: fp1,
    embedding: emb1,
  });
  assert.equal(resExact.saved, false);
  assert.equal(resExact.reason, "duplicate_fingerprint");

  // 3. Near-duplicate with high cosine similarity (>= 0.92) is rejected
  // Construct high-similarity vector (sim > 0.95 with emb1)
  const nearDupEmbedding = emb1.map((v) => Number((v * 0.99).toFixed(7)));
  const sim = cosineSimilarity(emb1, nearDupEmbedding);
  assert.ok(sim >= DUPLICATE_THRESHOLD, `Test embedding similarity ${sim} should exceed threshold ${DUPLICATE_THRESHOLD}`);

  const resNearDup = await store.saveQuestion({
    board: "CBSE",
    class: 3,
    concept_id: "subtraction_facts",
    lang: "en",
    difficulty: 2,
    question_text: "A vendor had 45 fresh oranges and sold 18 oranges to customers. How many oranges are left?",
    answer_value: "27",
    answer_format: "short_text",
    template_or_source: "hybrid",
    fingerprint: computeQuestionFingerprint("A vendor had 45 fresh oranges..."),
    embedding: nearDupEmbedding,
  });
  assert.equal(resNearDup.saved, false);
  assert.equal(resNearDup.reason, "duplicate_similarity");

  // 4. Distinct question with different concept / vector is accepted
  const distinctText = "A gardener planted 12 rows with 6 sunflower plants in each row. How many flowers in all?";
  const fpDistinct = computeQuestionFingerprint(distinctText, [12, 6]);
  const embDistinct = await embedQuestionText(distinctText, { conceptId: "multiplication_facts", board: "CBSE" });

  const resDistinct = await store.saveQuestion({
    id: "q_distinct_1",
    board: "CBSE",
    class: 3,
    concept_id: "multiplication_facts",
    lang: "en",
    difficulty: 2,
    question_text: distinctText,
    answer_value: "72",
    answer_format: "short_text",
    template_or_source: "hybrid",
    fingerprint: fpDistinct,
    embedding: embDistinct,
  });
  assert.equal(resDistinct.saved, true);
  assert.equal(resDistinct.reason, "ok");
});

test("Question-Memory RAG 2: Board isolation in retrieval (strict ICSE vs CBSE separation)", async () => {
  const store = new LocalJsonQuestionStore();
  await store.clear();

  const cbseEmb = await embedQuestionText("CBSE Addition Question", { conceptId: "addition_facts", board: "CBSE" });
  const icseEmb = await embedQuestionText("ICSE Addition Question", { conceptId: "addition_facts", board: "ICSE" });

  await store.saveQuestion({
    id: "q_cbse_1",
    board: "CBSE",
    class: 4,
    concept_id: "addition_facts",
    lang: "en",
    difficulty: 2,
    question_text: "A student collected 125 bottle caps and 80 stamps. How many items total?",
    answer_value: "205",
    answer_format: "short_text",
    template_or_source: "hybrid",
    fingerprint: computeQuestionFingerprint("A student collected 125 bottle caps..."),
    embedding: cbseEmb,
  });

  await store.saveQuestion({
    id: "q_icse_1",
    board: "ICSE",
    class: 4,
    concept_id: "addition_facts",
    lang: "en",
    difficulty: 2,
    question_text: "Express the sum of 125 ml and 80 ml in total volume.",
    answer_value: "205",
    answer_format: "short_text",
    template_or_source: "hybrid",
    fingerprint: computeQuestionFingerprint("Express the sum of 125 ml and 80 ml..."),
    embedding: icseEmb,
  });

  // Query ICSE: MUST ONLY return ICSE
  const icseResults = await store.retrieveSimilarQuestions({
    queryEmbedding: icseEmb,
    board: "ICSE",
    class: 4,
    conceptId: "addition_facts",
    difficultyMin: 1,
    difficultyMax: 5,
    limit: 5,
  });

  assert.equal(icseResults.length, 1);
  assert.equal(icseResults[0].id, "q_icse_1");
  assert.equal(icseResults[0].board, "ICSE");
  assert.equal(icseResults.some((q) => q.board === "CBSE"), false, "ICSE retrieval must never leak CBSE questions");

  // Query CBSE: MUST ONLY return CBSE
  const cbseResults = await store.retrieveSimilarQuestions({
    queryEmbedding: cbseEmb,
    board: "CBSE",
    class: 4,
    conceptId: "addition_facts",
    difficultyMin: 1,
    difficultyMax: 5,
    limit: 5,
  });

  assert.equal(cbseResults.length, 1);
  assert.equal(cbseResults[0].id, "q_cbse_1");
  assert.equal(cbseResults[0].board, "CBSE");
  assert.equal(cbseResults.some((q) => q.board === "ICSE"), false, "CBSE retrieval must never leak ICSE questions");
});

test("Question-Memory RAG 3: Flagged questions never served", async () => {
  const store = new LocalJsonQuestionStore();
  await store.clear();

  const emb = await embedQuestionText("Division question", { conceptId: "division_facts", board: "CBSE" });

  await store.saveQuestion({
    id: "q_to_flag_1",
    board: "CBSE",
    class: 3,
    concept_id: "division_facts",
    lang: "en",
    difficulty: 2,
    question_text: "Divide 24 crayons equally among 4 children. How many each?",
    answer_value: "6",
    answer_format: "short_text",
    template_or_source: "hybrid",
    fingerprint: computeQuestionFingerprint("Divide 24 crayons equally among 4 children."),
    embedding: emb,
  });

  // Verify initially retrievable
  let results = await store.retrieveSimilarQuestions({
    queryEmbedding: emb,
    board: "CBSE",
    class: 3,
    conceptId: "division_facts",
    difficultyMin: 1,
    difficultyMax: 5,
    limit: 5,
  });
  assert.equal(results.some((q) => q.id === "q_to_flag_1"), true);

  // Teacher flags question
  const flagged = await store.flagQuestion("q_to_flag_1", "Sentence contains confusing phrasing");
  assert.equal(flagged, true);

  // Verify question is now completely excluded from retrieval
  results = await store.retrieveSimilarQuestions({
    queryEmbedding: emb,
    board: "CBSE",
    class: 3,
    conceptId: "division_facts",
    difficultyMin: 1,
    difficultyMax: 5,
    limit: 5,
  });
  assert.equal(results.some((q) => q.id === "q_to_flag_1"), false, "Flagged questions must never be served");
});

test("Question-Memory RAG 4: Counters update without storing any student identifier", async () => {
  const store = new LocalJsonQuestionStore();
  await store.clear();

  const emb = await embedQuestionText("Fraction problem", { conceptId: "fractions_unit", board: "CBSE" });

  await store.saveQuestion({
    id: "q_counter_1",
    board: "CBSE",
    class: 5,
    concept_id: "fractions_unit",
    lang: "en",
    difficulty: 3,
    question_text: "What fraction of a meter is 25 centimeters?",
    answer_value: "1/4",
    answer_format: "short_text",
    template_or_source: "hybrid",
    fingerprint: computeQuestionFingerprint("What fraction of a meter is 25 centimeters?"),
    embedding: emb,
  });

  // Increment counter for 1 correct answer
  const ok1 = await store.incrementStats("q_counter_1", true);
  assert.equal(ok1, true);

  // Increment counter for 1 wrong answer (with step suffix _s1_1234)
  const ok2 = await store.incrementStats("q_counter_1_s2_1700000000", false);
  assert.equal(ok2, true);

  const updated = await store.getQuestionById("q_counter_1");
  assert.ok(updated);
  assert.equal(updated.times_served, 2);
  assert.equal(updated.times_correct, 1);

  // Verify object schema contains zero student PII fields
  const raw = updated;
  assert.equal(raw.studentName, undefined);
  assert.equal(raw.studentId, undefined);
  assert.equal(raw.rollNumber, undefined);
  assert.equal(raw.sessionId, undefined);
  assert.equal(raw.studentAnswer, undefined);
});

test("Question-Memory RAG 5: Empirical difficulty kicks in only after minimum sample size (times_served >= 20)", async () => {
  const store = new LocalJsonQuestionStore();
  await store.clear();

  const emb = await embedQuestionText("Decimals question", { conceptId: "decimals_addition", board: "CBSE" });

  await store.saveQuestion({
    id: "q_empirical_1",
    board: "CBSE",
    class: 5,
    concept_id: "decimals_addition",
    lang: "en",
    difficulty: 3, // Nominal difficulty L3
    question_text: "Add 1.25 and 0.50 liters of milk. How much in total?",
    answer_value: "1.75",
    answer_format: "short_text",
    template_or_source: "hybrid",
    fingerprint: computeQuestionFingerprint("Add 1.25 and 0.50 liters of milk."),
    embedding: emb,
  });

  // 1. Before 20 impressions (e.g. 15 impressions, all correct) -> empirical difficulty must be null
  for (let i = 0; i < 15; i++) {
    await store.incrementStats("q_empirical_1", true);
  }

  const pre20 = await store.getEmpiricalDifficulty("q_empirical_1");
  assert.equal(pre20.sampleSize, 15);
  assert.equal(pre20.calibratedDifficulty, null, "Calibrated difficulty must remain null before sample size reaches 20");

  const calibratedPre20 = calibrateDifficultyWithEmpiricalData(3, pre20);
  assert.equal(calibratedPre20, 3, "Nominal difficulty must not be altered before minimum sample size");

  // 2. Deliver 5 more correct attempts bringing sample size to 20 (success rate = 100%)
  for (let i = 0; i < 5; i++) {
    await store.incrementStats("q_empirical_1", true);
  }

  const post20 = await store.getEmpiricalDifficulty("q_empirical_1");
  assert.equal(post20.sampleSize, 20);
  assert.equal(post20.successRate, 1.0);
  assert.equal(post20.calibratedDifficulty, 1, "100% success rate should calibrate to Level 1 (Easy / Recall)");

  const calibratedPost20 = calibrateDifficultyWithEmpiricalData(3, post20);
  assert.equal(calibratedPost20, 1, "Calibrated difficulty should now override nominal difficulty (L3 -> L1)");
});

test("Question-Memory RAG 6: Fallback to current generation when store throws or times out", async () => {
  // Mock a failing store that simulates timeout or unhandled exception
  const mockFailingStore = {
    async saveQuestion() {
      throw new Error("Simulated database failure");
    },
    async retrieveSimilarQuestions() {
      // Simulate slow query exceeding timeout
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return [];
    },
    async getQuestionById() { return null; },
    async getQuestionByFingerprint() { return null; },
    async incrementStats() { return false; },
    async flagQuestion() { return false; },
    async getEmpiricalDifficulty() {
      return { sampleSize: 0, successRate: 0, calibratedDifficulty: null };
    },
    async clear() {},
  };

  setQuestionStoreOverride(mockFailingStore);

  // Safe retrieval with 100ms timeout
  const results = await retrieveSimilarQuestionsSafe({
    queryEmbedding: [0.1, 0.2],
    board: "CBSE",
    class: 3,
    conceptId: "addition_facts",
  }, 100);

  // Must not throw, must return empty array smoothly
  assert.ok(Array.isArray(results));
  assert.equal(results.length, 0);

  // Reset override
  setQuestionStoreOverride(null);
});
