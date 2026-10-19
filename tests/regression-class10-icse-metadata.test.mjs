import test from "node:test";
import assert from "node:assert/strict";
import {
  createSessionMemory,
  getNextStaircaseAction,
  applyAttemptToMemory,
} from "../src/lib/agents/staircase.ts";
import { getMultiBoardQuestion } from "../src/lib/questions/multiBoardBank.ts";
import { generateQuestion } from "../src/lib/questions/generator.ts";
import { syncQuestionProvenance, validateQuestionDifficultyFloor, isProvenanceConsistentWithBoard } from "../src/lib/questions/provenance.ts";
import { validateQuestionStrict } from "../src/lib/questions/validator.ts";
import { getCurriculumConcept, getConceptsByClassAndBoard } from "../src/data/curriculum/index.ts";
import { makeRng } from "../src/lib/rng.ts";

test("REGRESSION: Exact bug report on /assessment - Class 10 ICSE question 4", () => {
  // Scenario: Student takes Class 10 ICSE assessment.
  // Topic: quadratic_equations.
  const rng = makeRng(10007);
  const memory = createSessionMemory("anon_test_icse10", 10, "en", ["quadratic_equations"]);
  memory.boardPreference = "ICSE";

  // Simulate staircase turns:
  // Turn 1: Action is ask level 2
  const action1 = getNextStaircaseAction(memory);
  assert.equal(action1.type, "ask");
  assert.equal(action1.level, 2);

  // Retrieve/generate Q1
  const targetConcept = getCurriculumConcept(action1.conceptId, "ICSE");
  assert.ok(targetConcept, "Class 10 ICSE quadratic equations concept must exist");
  assert.equal(targetConcept.board, "ICSE");
  assert.equal(targetConcept.class, 10);

  let q1 = getMultiBoardQuestion({
    class: 10,
    conceptId: action1.conceptId,
    difficulty: action1.level,
    board: "ICSE",
  });
  if (!q1) {
    q1 = generateQuestion(action1.conceptId, action1.level, rng, 10, { board: "ICSE" });
  }
  q1 = syncQuestionProvenance(q1, "ICSE");

  // Verify Q1 strictly
  const val1 = validateQuestionStrict(q1, { enrolledGrade: 10, expectedBoard: "ICSE" });
  assert.ok(val1.valid, `Q1 validation failed: ${val1.errors.join("; ")}`);
  assert.equal(q1.board, "ICSE");
  assert.ok(!q1.provenanceLabel.includes("NCERT"), "Q1 must not have NCERT tag");
  assert.ok(q1.provenanceLabel.includes("CISCE") || q1.provenanceLabel.includes("ICSE"), "Q1 must have ICSE/CISCE provenance");

  // Student answers Q1 INCORRECTLY -> staircase should backtrack to Level 1
  const res1 = applyAttemptToMemory(memory, {
    questionId: q1.id,
    conceptId: action1.conceptId,
    level: 2,
    correct: false,
    studentAnswer: "wrong",
    correctAnswer: q1.answer,
  });
  const updated1 = res1.memory;

  const action2 = getNextStaircaseAction(updated1);
  assert.equal(action2.type, "ask");
  assert.equal(action2.level, 1, "After wrong answer on L2, staircase must ask L1 on-grade");

  // Retrieve/generate Q2 (Level 1)
  let q2 = getMultiBoardQuestion({
    class: 10,
    conceptId: action2.conceptId,
    difficulty: action2.level,
    board: "ICSE",
    excludeIds: [q1.id],
  });
  if (!q2) {
    q2 = generateQuestion(action2.conceptId, action2.level, rng, 10, { board: "ICSE" });
  }
  q2 = syncQuestionProvenance(q2, "ICSE");

  // Verify Q2 strictly: Level 1 must still be on-grade Class 10, never primary arithmetic
  const val2 = validateQuestionStrict(q2, { enrolledGrade: 10, expectedBoard: "ICSE" });
  assert.ok(val2.valid, `Q2 validation failed: ${val2.errors.join("; ")}`);
  assert.equal(q2.board, "ICSE");
  assert.ok(!q2.provenanceLabel.includes("NCERT"), "Q2 must not have NCERT tag");
  assert.ok(q2.provenanceLabel.includes("CISCE") || q2.provenanceLabel.includes("ICSE"), "Q2 must have ICSE/CISCE provenance");

  // Crucial check: Q2 prompt must NOT be "Compare the two answers" or "20 + 10 = ?"
  const promptText2 = typeof q2.prompt === "object" && "raw" in q2.prompt ? q2.prompt.raw : "";
  assert.ok(
    !promptText2.toLowerCase().includes("compare the two answers"),
    `Q2 must not be corrupted compare-answers template: ${promptText2}`
  );
  assert.ok(
    !promptText2.includes("20 + 10") && !((q2.expression || "").includes("20 + 10")),
    `Q2 must not contain elementary arithmetic 20 + 10 = ?: ${promptText2}`
  );

  // Student answers Q2 CORRECTLY -> topic closes after 2 attempts
  const res2 = applyAttemptToMemory(updated1, {
    questionId: q2.id,
    conceptId: action2.conceptId,
    level: 1,
    correct: true,
    studentAnswer: q2.answer,
    correctAnswer: q2.answer,
  });
  const updated2 = res2.memory;

  const quadTopic = updated2.topics.find((t) => t.topicId === "quadratic_equations");
  assert.ok(quadTopic, "Topic must be found");
  assert.equal(quadTopic.status, "developing", "Topic must diagnose as developing after wrong then correct, and not be stuck at Level 1");
  assert.equal(quadTopic.attempts.length, 2, "Topic should have recorded 2 attempts");
});

test("Staircase Deduplication: repeated questionId with different answer is never discarded", () => {
  const memory = createSessionMemory("anon_dedup", 10, "en", ["quadratic_equations"]);
  const staticId = "mb_icse_10_quad_01";

  // First attempt (wrong answer)
  const res1 = applyAttemptToMemory(memory, {
    questionId: staticId,
    conceptId: "icse_10_quadratic_equations",
    level: 2,
    correct: false,
    studentAnswer: "option_wrong",
    correctAnswer: "option_correct",
  });
  const mem1 = res1.memory;
  assert.equal(mem1.topics[0].attempts.length, 1);

  // Second attempt using same static questionId (e.g. repeated in bank, different student answer)
  const res2 = applyAttemptToMemory(mem1, {
    questionId: staticId,
    conceptId: "icse_10_quadratic_equations",
    level: 1,
    correct: true,
    studentAnswer: "option_correct",
    correctAnswer: "option_correct",
  });
  const mem2 = res2.memory;
  assert.equal(
    mem2.topics[0].attempts.length,
    2,
    "Second attempt with static ID must be recorded, not dropped"
  );
  assert.equal(mem2.topics[0].status, "developing", "Topic should close after 2 distinct attempts");
});

test("BATCH: Consistency and floor validation across all Classes 1 to 10 for CBSE and ICSE", () => {
  const boards = ["CBSE", "ICSE"];

  for (let grade = 1; grade <= 10; grade++) {
    for (const board of boards) {
      const concepts = getConceptsByClassAndBoard(grade, board);
      assert.ok(
        concepts.length > 0,
        `Class ${grade} ${board} must have at least 1 registered concept`
      );

      for (const concept of concepts) {
        for (let difficulty of [1, 2, 3]) {
          // Attempt bank retrieval
          let q = getMultiBoardQuestion({
            class: grade,
            conceptId: concept.id,
            difficulty: difficulty,
            board: board,
          });

          // If bank does not have this specific difficulty, generate procedurally
          if (!q) {
            const rng = makeRng(grade * 100 + difficulty);
            q = generateQuestion(concept.id, difficulty, rng, grade, { board });
          }

          assert.ok(
            q,
            `Must produce question for Class ${grade} ${board} concept ${concept.id} diff ${difficulty}`
          );

          // Synchronize provenance
          q = syncQuestionProvenance(q, board);

          // 1. Board tag assertion
          assert.equal(
            q.board,
            board,
            `Class ${grade} question ${q.id} board '${q.board}' must match selected board '${board}'`
          );

          // 2. Provenance label consistency
          const provCheck = isProvenanceConsistentWithBoard(q.provenanceLabel, board);
          assert.ok(
            provCheck.valid,
            `Class ${grade} ${board} question ${q.id} provenance '${q.provenanceLabel}' is invalid: ${provCheck.reason}`
          );

          // 3. Difficulty floor assertion
          const floorCheck = validateQuestionDifficultyFloor(q, grade);
          assert.ok(
            floorCheck.valid,
            `Class ${grade} ${board} question ${q.id} failed difficulty floor: ${floorCheck.reason}`
          );

          // 4. Strict validator assertion
          const strictVal = validateQuestionStrict(q, {
            enrolledGrade: grade,
            expectedBoard: board,
          });
          assert.ok(
            strictVal.valid,
            `Class ${grade} ${board} question ${q.id} failed strict validator: ${strictVal.errors.join("; ")}`
          );
        }
      }
    }
  }
});
