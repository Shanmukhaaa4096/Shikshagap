// tests/board-strict-filtering.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { LIVE_CLASSES } from "../src/lib/coverage.ts";
import { generateQuestion } from "../src/lib/questions/generator.ts";
import { makeRng } from "../src/lib/rng.ts";
import { SUPPORTED_CLASSES } from "../src/lib/curriculum/classes.ts";
import {
  createSessionMemory,
  getNextStaircaseAction,
  getConceptForTopic,
} from "../src/lib/agents/staircase.ts";

test("Board Isolation: Strict 50-question generation per live class and board", () => {
  for (const grade of LIVE_CLASSES) {
    const classConfig = SUPPORTED_CLASSES.find((c) => c.grade === grade);
    assert.ok(classConfig, `Class ${grade} must be configured`);
    const topics = classConfig.topics || ["number_sense", "multiplication", "division"];

    // 1. NCERT (CBSE) test: 50 questions
    for (let i = 0; i < 50; i++) {
      const topic = topics[i % topics.length];
      const conceptId = getConceptForTopic(topic, grade, "CBSE");
      const difficulty = (i % 3) + 1;
      const rng = makeRng(10000 + grade * 100 + i);

      const q = generateQuestion(conceptId, difficulty, rng, grade, { board: "CBSE" });

      assert.equal(
        q.board,
        "CBSE",
        `[Class ${grade} NCERT (CBSE) Question ${i + 1}] q.board must be CBSE, got ${q.board}`
      );

      const prov = (q.provenanceLabel || "").toLowerCase();
      assert.ok(
        !prov.includes("cisce") && !prov.includes("icse") && !prov.includes("selina"),
        `[Class ${grade} NCERT (CBSE) Question ${i + 1}] Leaked ICSE provenance: "${q.provenanceLabel}"`
      );

      if (q.textbookSource) {
        assert.notEqual(
          q.textbookSource.board,
          "STATE_BOARD",
          `[Class ${grade} NCERT (CBSE) Question ${i + 1}] textbookSource leaked STATE_BOARD`
        );
      }
    }

    // 2. ICSE test: 50 questions
    for (let i = 0; i < 50; i++) {
      const topic = topics[i % topics.length];
      const conceptId = getConceptForTopic(topic, grade, "ICSE");
      const difficulty = (i % 3) + 1;
      const rng = makeRng(20000 + grade * 100 + i);

      const q = generateQuestion(conceptId, difficulty, rng, grade, { board: "ICSE" });

      assert.equal(
        q.board,
        "ICSE",
        `[Class ${grade} ICSE Question ${i + 1}] q.board must be ICSE, got ${q.board}`
      );

      const prov = (q.provenanceLabel || "").toLowerCase();
      assert.ok(
        !prov.includes("ncert") && !prov.includes("cbse") && !prov.includes("math-magic"),
        `[Class ${grade} ICSE Question ${i + 1}] Leaked NCERT/CBSE provenance: "${q.provenanceLabel}"`
      );

      if (q.textbookSource) {
        assert.notEqual(
          q.textbookSource.board,
          "NCERT",
          `[Class ${grade} ICSE Question ${i + 1}] textbookSource leaked NCERT`
        );
      }
    }
  }
});

test("Board Isolation: Zero cross-board leakage across session reload", () => {
  const grade = 4;
  const memory = createSessionMemory("test_student_reload", grade, "en", ["multiplication", "division"]);
  memory.boardPreference = "ICSE";

  // Simulate serialization to sessionStorage
  const serialized = JSON.stringify({
    sessionMemory: memory,
    boardPreference: memory.boardPreference,
    isStarted: true,
  });

  // Simulate restore after page reload
  const parsed = JSON.parse(serialized);
  assert.equal(parsed.boardPreference, "ICSE");
  const restoredMemory = parsed.sessionMemory;
  assert.equal(restoredMemory.boardPreference, "ICSE");

  const nextAction = getNextStaircaseAction(restoredMemory);
  const rng = makeRng(777);
  const q = generateQuestion(nextAction.conceptId, nextAction.level, rng, grade, {
    board: restoredMemory.boardPreference,
  });

  assert.equal(q.board, "ICSE", "Question after reload must remain strictly ICSE");
  assert.ok(
    !q.provenanceLabel?.toLowerCase().includes("ncert"),
    "Provenance after reload must not leak NCERT"
  );
});

test("Board Isolation: Zero cross-board leakage when switching board mid-session", () => {
  const grade = 5;
  const rng = makeRng(888);

  // 1. Initial selection: CBSE
  const qCbse = generateQuestion("multi_digit_mult", 2, rng, grade, { board: "CBSE" });
  assert.equal(qCbse.board, "CBSE");
  assert.ok(!qCbse.provenanceLabel?.toLowerCase().includes("icse"));

  // 2. Teacher switches to ICSE mid-session
  const qIcse = generateQuestion("multi_digit_mult", 2, rng, grade, { board: "ICSE" });
  assert.equal(qIcse.board, "ICSE");
  assert.ok(!qIcse.provenanceLabel?.toLowerCase().includes("ncert"));
  assert.ok(!qIcse.provenanceLabel?.toLowerCase().includes("cbse"));
});
