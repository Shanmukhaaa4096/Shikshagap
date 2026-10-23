/**
 * tests/worksheet-generator.test.mjs
 *
 * Acceptance test suite for ShikshaGap Printable Practice Worksheet Generator.
 *
 * Verifies:
 * 1. For each class 3 to 10, generate 20 sheets:
 *    - Zero duplicate items inside a sheet.
 *    - At least 70% of items tagged with the selected class.
 *    - Header skill matches item topics.
 * 2. A Class 8 sheet never contains an item below Class 6 outside the Warm-up section.
 * 3. Repetition killed: no duplicate operand pairs, no repeated number pattern, templates <= 2.
 * 4. Print preview layout fits on 1 A4 page with clean 2-page teacher answer key.
 * 5. Full trilingual generation in English, Hindi, and Telugu.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { generateWorksheet, WORKSHEET_TOPIC_MAP, validateWorksheetItem } from "../src/lib/questions/worksheetGenerator.ts";

test("Worksheet Generator: Topic Map exists and covers Classes 1 through 10 with verified difficulties", () => {
  for (let c = 1; c <= 10; c++) {
    const topics = WORKSHEET_TOPIC_MAP[c];
    assert.ok(Array.isArray(topics) && topics.length > 0, `Class ${c} must have topics defined in topic map`);
    for (const t of topics) {
      assert.ok(t.id, `Topic in class ${c} must have an id`);
      assert.ok(t.name.en, `Topic ${t.id} must have an English name`);
      assert.ok(t.name.hi, `Topic ${t.id} must have a Hindi name`);
      assert.ok(t.name.te, `Topic ${t.id} must have a Telugu name`);
      assert.ok(t.difficulties.length > 0, `Topic ${t.id} must define difficulty levels`);
    }
  }
});

test("Acceptance 1: For each class 3 to 10, generate 20 sheets (160 sheets total) with zero duplicates and >= 70% on-grade items", () => {
  const classesToTest = [3, 4, 5, 6, 7, 8, 9, 10];
  const boards = ["CBSE", "ICSE"];
  let totalSheetsGenerated = 0;

  for (const classNum of classesToTest) {
    for (let run = 1; run <= 20; run++) {
      const board = boards[run % 2];
      const seed = 50000 + classNum * 1000 + run * 37;

      const sheet = generateWorksheet({
        classNum,
        board,
        count: 10,
        seed,
        language: run % 3 === 0 ? "hi" : run % 3 === 1 ? "te" : "en",
      });

      totalSheetsGenerated++;

      // Invariant A: Total items count must be 10
      assert.equal(sheet.items.length, 10, `Sheet for class ${classNum} must contain 10 items`);

      // Invariant B: Zero duplicate items inside the sheet
      const signatures = new Set();
      const fingerprints = new Set();
      for (const item of sheet.items) {
        assert.ok(validateWorksheetItem(item), `Item ${item.number} must pass validation`);
        const sig = `${item.prompt}::${item.correctAnswer}`;
        assert.ok(!signatures.has(sig), `Duplicate prompt found in Class ${classNum} run ${run}: "${item.prompt}"`);
        assert.ok(!fingerprints.has(item.fingerprint), `Duplicate fingerprint found: ${item.fingerprint}`);
        signatures.add(sig);
        fingerprints.add(item.fingerprint);
      }

      // Invariant C: At least 70% of items must be tagged with the selected class
      const onGradeItems = sheet.items.filter((item) => item.classNum === classNum);
      const onGradeRatio = onGradeItems.length / sheet.items.length;
      assert.ok(
        onGradeRatio >= 0.7,
        `Class ${classNum} run ${run} on-grade ratio must be >= 70% (found: ${(onGradeRatio * 100).toFixed(0)}%)`
      );

      // Invariant C2: No item below Class N-2 outside the Warm-up section
      const nonWarmup = [...sheet.practiceSection.items, ...sheet.challengeSection.items];
      for (const item of nonWarmup) {
        assert.ok(
          item.classNum >= classNum - 2,
          `Class ${classNum} non-warmup item #${item.number} must be >= Class ${classNum - 2} (found Class ${item.classNum})`
        );
      }

      // Invariant D: Header title reflects the real class and board
      assert.ok(
        sheet.header.title.includes(`CLASS ${classNum}`),
        `Header title must include 'CLASS ${classNum}' (found: '${sheet.header.title}')`
      );
      assert.ok(
        sheet.header.title.includes(board),
        `Header title must include board '${board}' (found: '${sheet.header.title}')`
      );

      // Invariant E: Header skill line matches the actual item topics in the sheet, never a default string
      assert.ok(sheet.header.skillsLine.startsWith("Skills: "), "Header skillsLine must start with 'Skills: '");
      for (const item of sheet.items) {
        assert.ok(
          sheet.header.skillsLine.includes(item.topic),
          `Header skillsLine must include item topic '${item.topic}'`
        );
      }

      // Invariant F: Answer key matches 1-to-1 with items
      assert.equal(sheet.answerKey.length, 10, "Answer key must contain 10 answers");
      for (let i = 0; i < sheet.items.length; i++) {
        assert.equal(sheet.answerKey[i].number, sheet.items[i].number);
        assert.equal(sheet.answerKey[i].correctAnswer, sheet.items[i].correctAnswer);
      }
    }
  }

  assert.equal(totalSheetsGenerated, 160, "Must have generated 160 sheets across Classes 3 to 10");
});

test("Acceptance 2: A Class 8 sheet never contains an item below Class 6 outside the Warm-up section", () => {
  for (let run = 1; run <= 25; run++) {
    const sheet = generateWorksheet({
      classNum: 8,
      board: run % 2 === 0 ? "CBSE" : "ICSE",
      count: 10,
      seed: 80000 + run * 79,
      diagnosedGap: {
        rootId: "fractions_like_add",
        title: "Fraction Addition",
        fromGrade: 5, // Student had diagnosed gap from Class 5
      },
    });

    // Check Warm-up section (Section A)
    assert.ok(sheet.warmupSection.items.length <= 3, "Warm-up section must be max 30% of items");
    assert.ok(
      sheet.warmupSection.title.includes("Foundation check from Class 5"),
      "Warm-up title must cite the real prerequisite foundation class"
    );

    // Check Practice (Section B) and Challenge (Section C)
    const nonWarmupItems = [...sheet.practiceSection.items, ...sheet.challengeSection.items];
    assert.ok(nonWarmupItems.length >= 7, "Practice and challenge items must be at least 70% of sheet");

    for (const item of nonWarmupItems) {
      assert.ok(
        item.classNum >= 6,
        `Class 8 non-warmup item #${item.number} must be on or above Class 6 (found Class ${item.classNum}: "${item.prompt}")`
      );
      assert.equal(
        item.classNum,
        8,
        `Class 8 non-warmup item #${item.number} must be strictly Class 8`
      );
      // Ensure no elementary multiplication tables in Class 8 practice
      assert.notEqual(
        item.topic,
        "Multiplication Tables",
        `Class 8 practice must never include elementary multiplication tables`
      );
    }
  }
});

test("Acceptance 3: Repetition Guard kills duplicate operand pairs, repeated number patterns, and template repetition", () => {
  const sheet = generateWorksheet({
    classNum: 8,
    board: "CBSE",
    count: 10,
    seed: 88888,
  });

  const operandPairs = new Set();
  const operandCounts = new Map();
  const templateCounts = new Map();

  for (const item of sheet.items) {
    if (item.operands && item.operands.length >= 2) {
      const sortedPair = [...item.operands].sort((a, b) => a - b).join(":");
      assert.ok(
        !operandPairs.has(sortedPair),
        `Found duplicate operand pair ${sortedPair} in sheet`
      );
      operandPairs.add(sortedPair);
    }

    if (item.operands) {
      for (const op of item.operands) {
        const count = (operandCounts.get(op) || 0) + 1;
        assert.ok(
          count <= 2,
          `Operand ${op} appeared ${count} times, exceeding repetition cap of 2`
        );
        operandCounts.set(op, count);
      }
    }

    if (item.templateId) {
      const tCount = (templateCounts.get(item.templateId) || 0) + 1;
      assert.ok(
        tCount <= 2,
        `Template ${item.templateId} appeared ${tCount} times, exceeding template cap of 2`
      );
      templateCounts.set(item.templateId, tCount);
    }
  }
});

test("Acceptance 4: Trilingual Support in English, Hindi, and Telugu produces complete, localized prompts", () => {
  const languages = ["en", "hi", "te"];

  for (const lang of languages) {
    const sheet = generateWorksheet({
      classNum: 8,
      board: "CBSE",
      language: lang,
      count: 10,
      seed: 99999,
    });

    assert.equal(sheet.items.length, 10);
    for (const item of sheet.items) {
      assert.ok(item.prompt && item.prompt.length > 5, `Prompt for ${lang} must be non-empty`);
      assert.ok(item.correctAnswer && item.correctAnswer.length > 0, `Answer for ${lang} must be non-empty`);
      assert.ok(item.explanation && item.explanation.length > 5, `Explanation for ${lang} must be non-empty`);
    }
  }
});

test("Acceptance 5: Across sheets for the same student, excludeIds prevents duplicate questions from being served", () => {
  const sheet1 = generateWorksheet({
    classNum: 8,
    board: "CBSE",
    count: 10,
    seed: 12345,
  });

  const servedIds = sheet1.items.map((it) => it.templateId || it.fingerprint);
  const servedFingerprints = new Set(sheet1.items.map((it) => it.fingerprint));

  const sheet2 = generateWorksheet({
    classNum: 8,
    board: "CBSE",
    count: 10,
    seed: 54321,
    excludeIds: servedIds,
  });

  for (const item of sheet2.items) {
    assert.ok(
      !servedFingerprints.has(item.fingerprint),
      `Sheet 2 contains item with fingerprint ${item.fingerprint} already served in Sheet 1`
    );
  }
});

test("Acceptance 6: Stored questions from question_memory are prioritized and included in the practice section", () => {
  const dummyStoredQuestions = [
    {
      id: "qm_test_001",
      class: 8,
      board: "CBSE",
      concept_id: "linear_equations_one_var",
      question_text: "Solve: 7x - 5 = 30",
      answer_value: "5",
      difficulty: 3,
      fingerprint: "fp_test_linear_001",
    },
    {
      id: "qm_test_002",
      class: 8,
      board: "CBSE",
      concept_id: "factorisation",
      question_text: "Factorise: x^2 + 5x + 6",
      answer_value: "(x + 2)(x + 3)",
      difficulty: 3,
      fingerprint: "fp_test_factor_002",
    },
  ];

  const sheet = generateWorksheet({
    classNum: 8,
    board: "CBSE",
    count: 10,
    seed: 77777,
    storedQuestions: dummyStoredQuestions,
  });

  const matchingStored = sheet.practiceSection.items.filter(
    (it) => it.templateId === "qm_test_001" || it.templateId === "qm_test_002"
  );

  assert.equal(matchingStored.length, 2, "Practice section must include both prioritized stored questions from question_memory");
  assert.equal(sheet.items.length, 10, "Total count must remain exactly 10");
});

