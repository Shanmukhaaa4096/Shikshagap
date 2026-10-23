// tests/real-assessment-rag-save.test.mjs
/**
 * Real Assessment Flow Question-Memory Save Tests
 *
 * Verifies that:
 * 1. The real assessment agent route handler awaits saveQuestion for every served question (3 questions in a session).
 * 2. QuestionStore failures surface as logged errors ([QuestionStore] FAILED), not silent skips.
 * 3. Protected /api/health/rag returns 404 if RAG_HEALTH_SECRET is unset, 401 if wrong, and counts when valid.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "../src/app/api/assessment/agent/route.ts";
import { GET as getRagHealth } from "../src/app/api/health/rag/route.ts";
import { setQuestionStoreOverride } from "../src/lib/db/questionStore.ts";
import { createSessionMemory, applyAttemptToMemory } from "../src/lib/agents/staircase.ts";

function createMockRequest(url, options = {}) {
  const req = new Request(url, options);
  req.nextUrl = new URL(url);
  return req;
}

test("Real Assessment Flow: Agent route handler awaits saveQuestion for 3 sequential questions", async () => {
  const savedItems = [];
  const mockStore = {
    async saveQuestion(item) {
      // Simulate real async database latency
      await new Promise((resolve) => setTimeout(resolve, 10));
      savedItems.push(item);
      return { saved: true, reason: "ok", id: item.id || `mock_${Date.now()}` };
    },
    async retrieveSimilarQuestions() {
      return [];
    },
    async getQuestionById() {
      return null;
    },
    async getQuestionByFingerprint() {
      return null;
    },
    async incrementStats() {
      return true;
    },
    async flagQuestion() {
      return true;
    },
    async getEmpiricalDifficulty() {
      return { sampleSize: 0, successRate: 0, calibratedDifficulty: null };
    },
    async clear() {},
  };

  setQuestionStoreOverride(mockStore);

  try {
    let memory = createSessionMemory(
      "student_real_flow",
      5,
      "en",
      ["multiplication_facts", "division_facts"],
      3,
      true
    );
    memory.boardPreference = "CBSE";

    // Question 1
    const req1 = createMockRequest("http://localhost:3000/api/assessment/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memory }),
    });
    const res1 = await POST(req1);
    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.ok(data1.nextQuestion, "Should return question 1");
    assert.equal(savedItems.length, 1, "Question 1 should be awaited and saved in QuestionStore");
    assert.equal(savedItems[0].class, 5);
    assert.equal(savedItems[0].board, "CBSE");

    // Advance to Question 2
    memory = applyAttemptToMemory(data1.memory, {
      questionId: data1.nextQuestion.id,
      conceptId: data1.nextQuestion.conceptId,
      difficulty: data1.nextQuestion.difficulty,
      isCorrect: true,
      timeSpentSeconds: 15,
      timestamp: Date.now(),
      topicId: data1.nextQuestion.conceptId,
      answerValue: String(data1.nextQuestion.answer),
      expectedAnswer: String(data1.nextQuestion.answer),
    }).memory;

    const req2 = createMockRequest("http://localhost:3000/api/assessment/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memory }),
    });
    const res2 = await POST(req2);
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.ok(data2.nextQuestion, "Should return question 2");
    assert.equal(savedItems.length, 2, "Question 2 should be awaited and saved in QuestionStore");

    // Advance to Question 3
    memory = applyAttemptToMemory(data2.memory, {
      questionId: data2.nextQuestion.id,
      conceptId: data2.nextQuestion.conceptId,
      difficulty: data2.nextQuestion.difficulty,
      isCorrect: false,
      timeSpentSeconds: 12,
      timestamp: Date.now(),
      topicId: data2.nextQuestion.conceptId,
      answerValue: "wrong_ans",
      expectedAnswer: String(data2.nextQuestion.answer),
    }).memory;

    const req3 = createMockRequest("http://localhost:3000/api/assessment/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memory }),
    });
    const res3 = await POST(req3);
    assert.equal(res3.status, 200);
    const data3 = await res3.json();
    assert.ok(data3.nextQuestion, "Should return question 3");
    assert.equal(savedItems.length, 3, "Question 3 should be awaited and saved in QuestionStore");
  } finally {
    setQuestionStoreOverride(null);
  }
});

test("Real Assessment Flow: Store failures surface as logged errors, not silent skips", async () => {
  const loggedErrors = [];
  const originalConsoleError = console.error;
  console.error = (...args) => {
    loggedErrors.push(args.join(" "));
  };

  const failingStore = {
    async saveQuestion() {
      return { saved: false, reason: "database_error", error: "mock_postgres_connection_timeout" };
    },
    async retrieveSimilarQuestions() {
      return [];
    },
    async getQuestionById() {
      return null;
    },
    async getQuestionByFingerprint() {
      return null;
    },
    async incrementStats() {
      return false;
    },
    async flagQuestion() {
      return false;
    },
    async getEmpiricalDifficulty() {
      return { sampleSize: 0, successRate: 0, calibratedDifficulty: null };
    },
    async clear() {},
  };

  setQuestionStoreOverride(failingStore);

  try {
    const memory = createSessionMemory(
      "student_fail_flow",
      5,
      "en",
      ["multiplication_facts"],
      3,
      true
    );

    const req = createMockRequest("http://localhost:3000/api/assessment/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memory }),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.nextQuestion, "Question should still be served to student gracefully");

    const failedLog = loggedErrors.find((msg) =>
      msg.includes("[QuestionStore] FAILED(mock_postgres_connection_timeout)")
    );
    assert.ok(
      failedLog,
      `Expected '[QuestionStore] FAILED(mock_postgres_connection_timeout)' in logs, got: ${JSON.stringify(loggedErrors)}`
    );
  } finally {
    console.error = originalConsoleError;
    setQuestionStoreOverride(null);
  }
});

test("Protected Health Route: /api/health/rag behaves securely", async () => {
  const origSecret = process.env.RAG_HEALTH_SECRET;

  try {
    // 1. When RAG_HEALTH_SECRET is unset, returns 404
    delete process.env.RAG_HEALTH_SECRET;
    const req1 = createMockRequest("http://localhost:3000/api/health/rag?secret=anything");
    const res1 = await getRagHealth(req1);
    assert.equal(res1.status, 404, "Must return 404 when RAG_HEALTH_SECRET is unset");

    // 2. When RAG_HEALTH_SECRET is set but client sends wrong secret, returns 401
    process.env.RAG_HEALTH_SECRET = "super_secret_health_token";
    const req2 = createMockRequest("http://localhost:3000/api/health/rag?secret=wrong_token");
    const res2 = await getRagHealth(req2);
    assert.equal(res2.status, 401, "Must return 401 on incorrect secret");

    // 3. When client sends valid secret via query param or Authorization Bearer header, returns 200 with counts
    const req3 = createMockRequest("http://localhost:3000/api/health/rag?secret=super_secret_health_token");
    const res3 = await getRagHealth(req3);
    assert.equal(res3.status, 200, "Must return 200 on valid secret query param");
    const data3 = await res3.json();
    assert.equal(data3.status, "ok");
    assert.ok(typeof data3.total === "number");
    assert.ok(typeof data3.by_class_and_board === "object");

    const req4 = createMockRequest("http://localhost:3000/api/health/rag", {
      headers: { Authorization: "Bearer super_secret_health_token" },
    });
    const res4 = await getRagHealth(req4);
    assert.equal(res4.status, 200, "Must return 200 on valid Bearer header");
  } finally {
    if (origSecret) process.env.RAG_HEALTH_SECRET = origSecret;
    else delete process.env.RAG_HEALTH_SECRET;
  }
});
