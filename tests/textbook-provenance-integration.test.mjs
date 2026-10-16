/**
 * ShikshaGap Verified Textbook Provenance & Assessment Integration Tests
 *
 * Verifies:
 * 1. Official NCERT textbook provenance metadata (board, class, subject, title, chapter, page, URL).
 * 2. Independent answer and solution verification.
 * 3. Trilingual translations alignment (English, Hindi, Telugu).
 * 4. Classes 1–10 curriculum architecture and readiness checks.
 * 5. Full adaptive assessment simulation using verified textbook questions.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  VERIFIED_TEXTBOOK_QUESTIONS,
  getVerifiedTextbookQuestion,
  getQuestionBankStats,
  TEXTBOOK_TRANSLATIONS,
} from "../src/lib/questions/textbookBank.ts";
import { validateQuestionStrict } from "../src/lib/questions/validator.ts";
import {
  NCERT_CURRICULUM_DATA,
  SUPPORTED_BOARDS,
  isGradeReadyForScoredAssessment,
} from "../src/lib/curriculum/curriculumData.ts";
import { SUPPORTED_CLASSES, isClassEnabled } from "../src/lib/curriculum/classes.ts";

test("Provenance 1: Every scored textbook question has complete and authentic NCERT metadata", () => {
  const stats = getQuestionBankStats();
  assert.ok(stats.total >= 20, `Question bank must contain at least 20 verified questions, found: ${stats.total}`);
  assert.equal(stats.rejected, 0, "Question bank must contain zero rejected questions");
  assert.equal(stats.verified, stats.total, "All scored questions must be marked verified");

  for (const q of VERIFIED_TEXTBOOK_QUESTIONS) {
    assert.equal(q.board, "NCERT", `Question ${q.id} must be attributed to NCERT`);
    assert.ok([3, 4, 5].includes(q.class), `Class must be 3, 4, or 5, got: ${q.class}`);
    assert.equal(q.subject, "mathematics");
    assert.ok(q.textbookTitle.startsWith("Math-Magic"), `Textbook title must be Math-Magic, got: ${q.textbookTitle}`);
    assert.ok(q.textbookEdition.includes("NCERT 2024-25"), `Edition must be NCERT 2024-25, got: ${q.textbookEdition}`);
    assert.ok(q.chapterNumber >= 1 && q.chapterNumber <= 14, `Chapter number must be between 1 and 14`);
    assert.ok(q.chapterTitle.length > 2, `Chapter title must not be empty`);
    assert.ok(q.pageNumber && q.pageNumber > 0, `Page number must be verifiable`);
    assert.ok(q.sourceUrl && q.sourceUrl.startsWith("https://ncert.nic.in/textbook.php"), `Source URL must link to NCERT portal`);
    assert.equal(q.reuseStatus, "public_educational_ncert");
    assert.ok(q.verifiedSolution && q.verifiedSolution.length > 10, `Question must have step-by-step solution`);
    assert.ok(q.conceptIds && q.conceptIds.length > 0, `Question must specify conceptIds`);

    // Verify app-format question and strict validation
    const appQ = getVerifiedTextbookQuestion({ class: q.class, conceptId: q.conceptIds[0], onlyVerified: true });
    assert.ok(appQ, `Failed to retrieve question for concept ${q.conceptIds[0]}`);
    assert.equal(appQ.isTextbookVerified, true);
    assert.ok(appQ.textbookSource, "Question must include textbookSource");
    assert.ok(appQ.provenanceLabel?.includes("NCERT"), "Provenance label must include NCERT");

    const validation = validateQuestionStrict(appQ, { requireTextbookProvenance: true });
    assert.equal(validation.valid, true, `Strict validation failed on textbook question ${q.id}: ${validation.errors.join("; ")}`);
  }
});

test("Provenance 2: Multiple-choice options and answers are mutually unique and verified", () => {
  for (const q of VERIFIED_TEXTBOOK_QUESTIONS) {
    if (q.options) {
      assert.ok(q.options.length >= 2, `Question ${q.id} has fewer than 2 options`);
      const values = q.options.map((o) => o.value);
      const uniqueValues = new Set(values);
      assert.equal(uniqueValues.size, values.length, `Question ${q.id} has duplicate option values: [${values.join(", ")}]`);

      const matchingOption = q.options.find((o) => o.value === q.correctAnswer);
      assert.ok(matchingOption, `Question ${q.id} correct answer '${q.correctAnswer}' is missing from options [${values.join(", ")}]`);
    }
  }
});

test("Provenance 3: Trilingual translations exist and match for all textbook questions", () => {
  for (const q of VERIFIED_TEXTBOOK_QUESTIONS) {
    const trans = TEXTBOOK_TRANSLATIONS[q.id];
    assert.ok(trans, `Missing translations object for question ${q.id}`);
    assert.ok(trans.hi?.questionText, `Missing Hindi translation for question ${q.id}`);
    assert.ok(trans.te?.questionText, `Missing Telugu translation for question ${q.id}`);

    // Validate Hindi conversion
    const hiAppQ = getVerifiedTextbookQuestion({ class: q.class, conceptId: q.conceptIds[0], onlyVerified: true }, "hi");
    assert.ok(hiAppQ);
    const hiValidation = validateQuestionStrict(hiAppQ, { targetLang: "hi", requireTextbookProvenance: true });
    assert.equal(hiValidation.valid, true, `Hindi question failed validation for ${q.id}: ${hiValidation.errors.join("; ")}`);

    // Validate Telugu conversion
    const teAppQ = getVerifiedTextbookQuestion({ class: q.class, conceptId: q.conceptIds[0], onlyVerified: true }, "te");
    assert.ok(teAppQ);
    const teValidation = validateQuestionStrict(teAppQ, { targetLang: "te", requireTextbookProvenance: true });
    assert.equal(teValidation.valid, true, `Telugu question failed validation for ${q.id}: ${teValidation.errors.join("; ")}`);
  }
});

test("Curriculum Architecture: Classes 1 through 10 are completely configured with official NCERT data", () => {
  // 1. Check supported classes list contains Classes 1 to 10
  assert.equal(SUPPORTED_CLASSES.length, 10, "SUPPORTED_CLASSES must contain exactly 10 class levels (Classes 1-10)");
  for (let grade = 1; grade <= 10; grade++) {
    const classConfig = SUPPORTED_CLASSES.find((c) => c.grade === grade);
    assert.ok(classConfig, `Class config missing for grade ${grade}`);
    assert.equal(classConfig.grade, grade);

    // Only Classes 3, 4, 5 are enabled for scored assessments
    if ([3, 4, 5].includes(grade)) {
      assert.equal(isClassEnabled(classConfig.id), true, `Class ${grade} must be enabled`);
      assert.equal(isGradeReadyForScoredAssessment(grade), true, `Class ${grade} must be ready for scored assessment`);
    } else {
      assert.equal(isClassEnabled(classConfig.id), false, `Class ${grade} must remain disabled until question bank verified`);
      assert.equal(isGradeReadyForScoredAssessment(grade), false, `Class ${grade} must not be marked ready for scored assessment`);
    }

    // Official NCERT textbook data must be defined
    const ncertData = NCERT_CURRICULUM_DATA[grade];
    assert.ok(ncertData, `NCERT curriculum data missing for grade ${grade}`);
    assert.ok(ncertData.title.length > 5, `NCERT textbook title must be defined for grade ${grade}`);
    assert.ok(ncertData.chapters.length >= 10, `NCERT grade ${grade} must have all official chapters mapped (at least 10)`);
    assert.ok(ncertData.officialPortalUrl.includes("ncert.nic.in"), `NCERT portal link must be authentic for grade ${grade}`);
  }

  // 2. Boards configuration
  assert.ok(SUPPORTED_BOARDS.length >= 4, "Must configure NCERT, CBSE, and State Boards");
  const ncertBoard = SUPPORTED_BOARDS.find((b) => b.id === "NCERT");
  assert.ok(ncertBoard && ncertBoard.activeForScoredAssessments === true);
  const stateBoard = SUPPORTED_BOARDS.find((b) => b.id === "SCERT_TELANGANA");
  assert.ok(stateBoard && stateBoard.activeForScoredAssessments === false, "State boards must be pending until questions verified");
});

test("Assessment Simulation: Complete adaptive flow retrieves verified textbook questions without repeats", () => {
  const seenIds = new Set();
  const targetConcepts = ["number_sense", "addition", "subtraction_3digit", "mult_concept", "division_sharing", "money_math"];

  for (const conceptId of targetConcepts) {
    const q = getVerifiedTextbookQuestion(
      {
        class: 3,
        conceptId: conceptId,
        excludeIds: Array.from(seenIds),
        onlyVerified: true,
      },
      "en"
    );

    assert.ok(q, `Should retrieve verified textbook question for concept ${conceptId}`);
    assert.equal(q.isTextbookVerified, true, "Question must be verified textbook item");
    assert.ok(!seenIds.has(q.id), `Question ${q.id} was repeated!`);
    seenIds.add(q.id);

    // Validate prompt and options
    const validation = validateQuestionStrict(q, { requireTextbookProvenance: true });
    assert.equal(validation.valid, true, `Validation failed: ${validation.errors.join("; ")}`);
  }

  assert.equal(seenIds.size, targetConcepts.length, "All concepts must have unique questions without repetition");
});
