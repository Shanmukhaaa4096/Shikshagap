import test from "node:test";
import assert from "node:assert/strict";
import { rotateSourceStyle } from "../src/lib/agents/adaptiveEngine.ts";
import { getMultiBoardQuestion, MULTI_BOARD_QUESTION_BANK } from "../src/lib/questions/multiBoardBank.ts";

test("Board Filtering: rotateSourceStyle isolation & alternation", () => {
  const cbseStyles = new Set(["ncert", "exemplar", "cbse_reference"]);
  const icseStyles = new Set(["icse_selina", "icse_foundation"]);

  // 1. 30 questions with boardPreference = 'ICSE' -> exactly 0% CBSE
  let historyICSE = [];
  for (let i = 0; i < 30; i++) {
    const nextStyle = rotateSourceStyle(historyICSE, "ICSE", (i * 0.17) % 1);
    assert.ok(icseStyles.has(nextStyle), `Expected ICSE style but got ${nextStyle} at step ${i}`);
    assert.ok(!cbseStyles.has(nextStyle), `Unexpected CBSE style ${nextStyle} under ICSE preference`);
    historyICSE.push(nextStyle);
  }

  // 2. 30 questions with boardPreference = 'CBSE' -> exactly 0% ICSE
  let historyCBSE = [];
  for (let i = 0; i < 30; i++) {
    const nextStyle = rotateSourceStyle(historyCBSE, "CBSE", (i * 0.23) % 1);
    assert.ok(cbseStyles.has(nextStyle), `Expected CBSE style but got ${nextStyle} at step ${i}`);
    assert.ok(!icseStyles.has(nextStyle), `Unexpected ICSE style ${nextStyle} under CBSE preference`);
    historyCBSE.push(nextStyle);
  }

  // 3. 30 questions with boardPreference = 'BOTH' -> strictly alternating boards
  let historyBOTH = [];
  for (let i = 0; i < 30; i++) {
    const nextStyle = rotateSourceStyle(historyBOTH, "BOTH", 0.3);
    if (i > 0) {
      const prevStyle = historyBOTH[i - 1];
      const prevBoard = icseStyles.has(prevStyle) ? "ICSE" : "CBSE";
      const currBoard = icseStyles.has(nextStyle) ? "ICSE" : "CBSE";
      assert.notEqual(
        currBoard,
        prevBoard,
        `Consecutive questions from same board ${currBoard} at step ${i} under BOTH`
      );
    }
    historyBOTH.push(nextStyle);
  }
});

test("Board Filtering: getMultiBoardQuestion strictly adheres to requested board", () => {
  // Test ICSE retrieval
  for (let i = 0; i < 30; i++) {
    const q = getMultiBoardQuestion({
      board: "ICSE",
      class: 5,
    });
    assert.ok(q, "Should retrieve an ICSE question");
    assert.equal(q.board, "ICSE", `Expected ICSE question but got ${q.board}`);
  }

  // Test CBSE retrieval
  for (let i = 0; i < 30; i++) {
    const q = getMultiBoardQuestion({
      board: "CBSE",
      class: 5,
    });
    assert.ok(q, "Should retrieve a CBSE question");
    assert.equal(q.board, "CBSE", `Expected CBSE question but got ${q.board}`);
  }
});

test("Board Filtering: Every entry in MULTI_BOARD_QUESTION_BANK has matching board tag and styles", () => {
  const cbseStyles = new Set(["ncert", "exemplar", "cbse_reference"]);
  const icseStyles = new Set(["icse_selina", "icse_foundation"]);

  for (const entry of MULTI_BOARD_QUESTION_BANK) {
    if (entry.board === "ICSE") {
      assert.ok(icseStyles.has(entry.sourceStyle), `ICSE entry ${entry.id} has invalid style ${entry.sourceStyle}`);
    } else {
      assert.ok(cbseStyles.has(entry.sourceStyle), `CBSE entry ${entry.id} has invalid style ${entry.sourceStyle}`);
    }
  }
});
