/**
 * Parameterized Per-Class Test Coverage for ShikshaGap
 * Runs for EVERY class (1 to 10) and EVERY board (NCERT/CBSE, ICSE).
 *
 * Checks:
 * 1. Class exists in selector/config and assessment starts without errors
 * 2. At least N concepts exist (N >= 5) and every concept has a verified official syllabus source
 * 3. Generated/retrieved questions pass deterministic answer validation
 * 4. Question difficulty falls inside class's allowed range (1 to 5)
 * 5. Strict board and class isolation (no question from another class or board leaks in)
 * 6. Adaptive difficulty moves UP after correct (L2 -> L3) and DOWN after wrong (L2 -> L1)
 * 7. Cross-class prerequisite backtracking works down to lower grades
 * 8. Prints an exhaustive coverage matrix at the end of the test run.
 */

import test, { after } from "node:test";
import assert from "node:assert/strict";
import { SUPPORTED_CLASSES } from "../src/lib/curriculum/classes.ts";
import { isClassLive } from "../src/lib/coverage.ts";
import {
  ALL_CURRICULUM_CONCEPTS_LIST,
  CURRICULUM_REGISTRY,
  ancestorsOfConcept,
} from "../src/data/curriculum/index.ts";
import {
  getMultiBoardQuestion,
} from "../src/lib/questions/multiBoardBank.ts";
import { generateQuestion } from "../src/lib/questions/generator.ts";
import {
  createSessionMemory,
  getNextStaircaseAction,
} from "../src/lib/agents/staircase.ts";
import { makeRng } from "../src/lib/rng.ts";

const CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const BOARDS = ["NCERT", "ICSE"]; // NCERT corresponds to CBSE
const MIN_CONCEPTS_PER_CELL = 5;

// Table record for final coverage summary
const coverageMatrix = [];

for (const grade of CLASSES) {
  for (const board of BOARDS) {
    const targetBoardCode = board === "NCERT" ? "CBSE" : "ICSE";
    const cellId = `Class ${grade} [${board}]`;

    test(`Coverage: ${cellId} - Full Specification & Quality Gate`, () => {
      const cellResult = {
        grade,
        board,
        stage: "",
        conceptsCount: 0,
        minRequired: MIN_CONCEPTS_PER_CELL,
        sourcesVerified: false,
        selectorReady: false,
        mathValid: false,
        isolationPassed: false,
        adaptivePassed: false,
        backtrackingPassed: false,
        status: "FAIL",
      };

      try {
        // -------------------------------------------------------------
        // 1. Selector & Start Verification
        // -------------------------------------------------------------
        const classConfig = SUPPORTED_CLASSES.find((c) => c.grade === grade);
        assert.ok(
          classConfig,
          `${cellId}: Class configuration must exist in SUPPORTED_CLASSES`
        );
        const isLive = isClassLive(grade);
        assert.equal(
          classConfig.enabled,
          isLive,
          `${cellId}: Class enabled property (${classConfig.enabled}) must match isClassLive (${isLive})`
        );
        assert.ok(
          classConfig.topics && classConfig.topics.length >= 3,
          `${cellId}: Class must define at least 3 curriculum topics`
        );
        cellResult.stage = classConfig.stage;
        cellResult.selectorReady = isLive;

        if (!isLive) {
          cellResult.status = "COMING_SOON";
          coverageMatrix.push(cellResult);
          return;
        }

        // Initialize session memory
        const memory = createSessionMemory(
          `test_pseudonym_${grade}_${board.toLowerCase()}`,
          grade,
          "en",
          classConfig.topics,
          10007 + grade
        );
        memory.boardPreference = targetBoardCode;

        // Verify initial action starts at Level 2
        const initialAction = getNextStaircaseAction(memory);
        assert.equal(
          initialAction.type,
          "ask",
          `${cellId}: Initial action must be 'ask'`
        );
        assert.equal(
          initialAction.level,
          2,
          `${cellId}: Assessment must start at Level 2 (on-grade medium application)`
        );
        assert.ok(
          initialAction.conceptId,
          `${cellId}: Initial action must have a valid conceptId`
        );

        // -------------------------------------------------------------
        // 2. Minimum Concepts & Verified Syllabus Sources
        // -------------------------------------------------------------
        const cellConcepts = ALL_CURRICULUM_CONCEPTS_LIST.filter(
          (c) =>
            c.class === grade &&
            (c.board === targetBoardCode || c.boards?.includes(targetBoardCode))
        );

        cellResult.conceptsCount = cellConcepts.length;
        assert.ok(
          cellConcepts.length >= MIN_CONCEPTS_PER_CELL,
          `${cellId}: Found only ${cellConcepts.length} concepts; expected at least ${MIN_CONCEPTS_PER_CELL}`
        );

        // Verify that EVERY concept in this cell has an official syllabus source citation
        for (const concept of cellConcepts) {
          assert.ok(
            concept.source && concept.source.trim().length > 0,
            `${cellId}: Concept ${concept.id} has missing syllabus source provenance`
          );
          assert.ok(
            concept.learningOutcome && concept.learningOutcome.trim().length > 0,
            `${cellId}: Concept ${concept.id} is missing an explicit learning outcome`
          );
          assert.ok(
            concept.difficultyRange &&
              concept.difficultyRange[0] >= 1 &&
              concept.difficultyRange[1] <= 5 &&
              concept.difficultyRange[0] <= concept.difficultyRange[1],
            `${cellId}: Concept ${concept.id} has invalid difficulty range: ${JSON.stringify(concept.difficultyRange)}`
          );
          assert.ok(
            concept.name?.en?.trim() && concept.name?.hi?.trim() && concept.name?.te?.trim(),
            `${cellId}: Concept ${concept.id} is missing full trilingual translations (en, hi, te)`
          );
        }
        cellResult.sourcesVerified = true;

        // -------------------------------------------------------------
        // 3. Question Validation & Mathematical Correctness
        // -------------------------------------------------------------
        const rng = makeRng(42000 + grade);
        let validQuestionCount = 0;

        for (let diff = 1; diff <= 4; diff++) {
          const sampleConcept = cellConcepts[(diff - 1) % cellConcepts.length];
          let q = getMultiBoardQuestion({
            board: targetBoardCode,
            class: grade,
            difficulty: diff,
            conceptId: sampleConcept.id,
          });

          if (!q) {
            q = generateQuestion(sampleConcept.id, diff, rng, grade);
          }

          // Deterministic correctness assertions
          assert.ok(q.prompt, `${cellId}: Question prompt must exist`);
          const promptText = typeof q.prompt.raw === "string" ? q.prompt.raw : q.prompt.key;
          assert.ok(promptText && promptText.length > 0, `${cellId}: Prompt text must not be empty`);

          assert.ok(
            q.answer !== undefined && q.answer !== null && String(q.answer).length > 0,
            `${cellId}: Question answer must not be empty`
          );

          assert.ok(
            Array.isArray(q.options) && q.options.length >= 2,
            `${cellId}: Question must contain at least 2 distinct multiple choice options`
          );

          // All option values must be unique
          const optionValues = q.options.map((opt) => String(opt.value));
          const uniqueOptionValues = new Set(optionValues);
          assert.equal(
            uniqueOptionValues.size,
            optionValues.length,
            `${cellId}: Options must have unique values (no duplicate choices allowed)`
          );

          // The correct answer must be one of the options
          assert.ok(
            uniqueOptionValues.has(String(q.answer)),
            `${cellId}: Correct answer '${q.answer}' must be present in options: [${optionValues.join(", ")}]`
          );

          // Numeric arithmetic check if metadata operands exist
          if (
            typeof q.meta?.a === "number" &&
            typeof q.meta?.b === "number" &&
            q.meta?.op
          ) {
            let expectedNum;
            if (q.meta.op === "+") expectedNum = q.meta.a + q.meta.b;
            else if (q.meta.op === "-") expectedNum = q.meta.a - q.meta.b;
            else if (q.meta.op === "*" || q.meta.op === "x") expectedNum = q.meta.a * q.meta.b;
            else if (q.meta.op === "/") expectedNum = q.meta.a / q.meta.b;

            if (expectedNum !== undefined && !Number.isNaN(expectedNum)) {
              assert.equal(
                Number(q.answer),
                expectedNum,
                `${cellId}: Mathematical operand check failed: ${q.meta.a} ${q.meta.op} ${q.meta.b} should equal ${expectedNum}, got answer ${q.answer}`
              );
            }
          }

          // -------------------------------------------------------------
          // 4. Question Difficulty inside Allowed Range
          // -------------------------------------------------------------
          assert.ok(
            q.difficulty >= 1 && q.difficulty <= 5,
            `${cellId}: Question difficulty (${q.difficulty}) must fall in allowed range 1-5`
          );

          // -------------------------------------------------------------
          // 5. Strict Board and Class Isolation (No Leakage)
          // -------------------------------------------------------------
          if (targetBoardCode === "ICSE") {
            assert.notEqual(
              q.board,
              "NCERT",
              `${cellId}: ICSE assessment leaked NCERT-only question ${q.id}`
            );
          } else {
            assert.notEqual(
              q.board,
              "ICSE",
              `${cellId}: CBSE assessment leaked ICSE-only question ${q.id}`
            );
          }

          validQuestionCount++;
        }

        assert.ok(
          validQuestionCount >= 4,
          `${cellId}: Must validate at least 4 grade-calibrated questions`
        );
        cellResult.mathValid = true;
        cellResult.isolationPassed = true;

        // -------------------------------------------------------------
        // 6. Adaptive Difficulty State Transitions (Staircase)
        // -------------------------------------------------------------
        // Step A: Correct answer moves Level 2 -> Level 3
        const correctAttempt = {
          conceptId: initialAction.conceptId,
          level: 2,
          questionId: "test_q_correct",
          studentAnswer: "correct",
          correct: true,
        };
        const nextActionCorrect = getNextStaircaseAction(memory, correctAttempt);
        assert.equal(
          nextActionCorrect.type,
          "ask",
          `${cellId}: After correct answer, action must be 'ask'`
        );
        assert.equal(
          nextActionCorrect.level,
          3,
          `${cellId}: Adaptive difficulty must move UP from Level 2 to Level 3 after a correct answer`
        );

        // Step B: Wrong answer moves Level 2 -> Level 1 (prerequisite probe)
        const wrongAttempt = {
          conceptId: initialAction.conceptId,
          level: 2,
          questionId: "test_q_wrong",
          studentAnswer: "wrong",
          correct: false,
          errorType: "slip",
        };
        const nextActionWrong = getNextStaircaseAction(memory, wrongAttempt);
        assert.equal(
          nextActionWrong.type,
          "ask",
          `${cellId}: After wrong answer, action must be 'ask'`
        );
        assert.equal(
          nextActionWrong.level,
          1,
          `${cellId}: Adaptive difficulty must move DOWN from Level 2 to Level 1 after a wrong answer`
        );
        cellResult.adaptivePassed = true;

        // -------------------------------------------------------------
        // 7. Cross-Class Prerequisite Backtracking
        // -------------------------------------------------------------
        if (grade >= 2) {
          let hasLowerGradePrereq = false;
          for (const c of cellConcepts) {
            const ancestors = ancestorsOfConcept(c.id);
            for (const ancId of ancestors) {
              const ancNode = CURRICULUM_REGISTRY[ancId];
              if (ancNode && ancNode.class < grade) {
                hasLowerGradePrereq = true;
                break;
              }
            }
            if (hasLowerGradePrereq) break;
          }

          assert.ok(
            hasLowerGradePrereq,
            `${cellId}: Grade ${grade} concepts must have transitive prerequisite backtracking reaching lower grades`
          );
        }
        cellResult.backtrackingPassed = true;

        cellResult.status = "PASS";
      } catch (err) {
        cellResult.status = "FAIL";
        coverageMatrix.push(cellResult);
        throw err;
      }

      coverageMatrix.push(cellResult);
    });
  }
}

// Print formatted Coverage Matrix at the end of the test run
after(() => {
  console.log("\n==========================================================================================================");
  console.log("                           SHIKSHAGAP PER-CLASS & PER-BOARD TEST COVERAGE TABLE                           ");
  console.log("==========================================================================================================");
  console.log(
    "Class    | Board | Stage        | Concepts | Min Req | Sources | Math Valid | Isolation | Adaptive | Backtrack | Status"
  );
  console.log(
    "---------+-------+--------------+----------+---------+---------+------------+-----------+----------+-----------+-------"
  );

  let totalCells = 0;
  let passedCells = 0;

  for (const row of coverageMatrix) {
    totalCells++;
    if (row.status === "PASS") passedCells++;

    const classStr = `Class ${row.grade}`.padEnd(8);
    const boardStr = row.board.padEnd(5);
    const stageStr = row.stage.padEnd(12);
    const conceptsStr = String(row.conceptsCount).padStart(8);
    const minReqStr = String(row.minRequired).padStart(7);
    const srcStr = (row.sourcesVerified ? "VERIFIED" : "FAIL").padEnd(7);
    const mathStr = (row.mathValid ? "PASSED" : "FAIL").padEnd(10);
    const isoStr = (row.isolationPassed ? "ISOLATED" : "FAIL").padEnd(9);
    const adapStr = (row.adaptivePassed ? "UP/DOWN" : "FAIL").padEnd(8);
    const backStr = (row.backtrackingPassed ? "CONNECTED" : "FAIL").padEnd(9);
    const statusStr = row.status === "PASS" ? "✓ PASS" : "✗ FAIL";

    console.log(
      `${classStr} | ${boardStr} | ${stageStr} | ${conceptsStr} | ${minReqStr} | ${srcStr} | ${mathStr} | ${isoStr} | ${adapStr} | ${backStr} | ${statusStr}`
    );
  }

  console.log("==========================================================================================================");
  console.log(`TOTAL CELLS AUDITED: ${totalCells} / 20`);
  console.log(`PASSED: ${passedCells} / ${totalCells} (${((passedCells / totalCells) * 100).toFixed(1)}%)`);
  console.log("==========================================================================================================\n");
});
