import test from "node:test";
import assert from "node:assert/strict";
import { MULTI_BOARD_QUESTION_BANK, getMultiBoardQuestion } from "../src/lib/questions/multiBoardBank.ts";

test("Board Isolation: selecting ICSE never returns NCERT or CBSE-only questions", () => {
  // Test across all classes 1 through 10
  for (let grade = 1; grade <= 10; grade++) {
    for (let diff = 1; diff <= 4; diff++) {
      const q = getMultiBoardQuestion({
        board: "ICSE",
        class: grade,
        difficulty: diff,
      });

      if (q) {
        // Find corresponding bank entry
        const entry = MULTI_BOARD_QUESTION_BANK.find((e) => e.id === q.id);
        assert.ok(entry, `Question entry ${q.id} must exist in MULTI_BOARD_QUESTION_BANK`);
        assert.ok(
          entry.board === "ICSE" || entry.board === "BOTH",
          `When ICSE is selected, question board must be ICSE or BOTH. Got ${entry.board} for ${q.id}`
        );
        assert.notEqual(
          entry.board,
          "CBSE",
          `ICSE request must never return CBSE-only questions. Failed on question ${q.id}`
        );
        assert.notEqual(
          entry.board,
          "NCERT",
          `ICSE request must never return NCERT-only questions. Failed on question ${q.id}`
        );
      }
    }
  }
});

test("Board Isolation: selecting CBSE/NCERT never returns ICSE-only questions", () => {
  for (let grade = 1; grade <= 10; grade++) {
    for (let diff = 1; diff <= 4; diff++) {
      const q = getMultiBoardQuestion({
        board: "CBSE",
        class: grade,
        difficulty: diff,
      });

      if (q) {
        const entry = MULTI_BOARD_QUESTION_BANK.find((e) => e.id === q.id);
        assert.ok(entry, `Question entry ${q.id} must exist in MULTI_BOARD_QUESTION_BANK`);
        assert.ok(
          entry.board === "CBSE" || entry.board === "NCERT" || entry.board === "BOTH",
          `When CBSE is selected, question board must be CBSE, NCERT, or BOTH. Got ${entry.board} for ${q.id}`
        );
        assert.notEqual(
          entry.board,
          "ICSE",
          `CBSE request must never return ICSE-only questions. Failed on question ${q.id}`
        );
      }
    }
  }
});

test("Class Isolation: Question for Class X never returns a question from another class when class is specified", () => {
  for (let grade = 1; grade <= 10; grade++) {
    const q = getMultiBoardQuestion({
      class: grade,
    });
    if (q) {
      const entry = MULTI_BOARD_QUESTION_BANK.find((e) => e.id === q.id);
      assert.ok(entry, `Question entry ${q.id} must exist`);
      assert.equal(
        entry.class,
        grade,
        `Expected class ${grade} question, but received class ${entry.class} for question ${q.id}`
      );
    }
  }
});
