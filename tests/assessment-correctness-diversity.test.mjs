/**
 * tests/assessment-correctness-diversity.test.mjs
 *
 * Dedicated Verification Suite for:
 * 1. Priority 1: Mathematical Truth, Equivalence, Format Integrity, Option Distinctness
 * 2. Priority 2: Genuine Topic Diversity, Duplicate Rejection, Low Repeat Rate
 */

import test from "node:test";
import assert from "node:assert/strict";
import { makeRng } from "../src/lib/rng.ts";
import {
  generateQuestion,
  generateUnique,
  applyQuestionFormat,
  questionSignature,
} from "../src/lib/questions/generator.ts";
import {
  validateQuestionIntegrity,
  recomputeGroundTruthAnswer,
  areAnswersEquivalent,
} from "../src/lib/questions/integrity.ts";
import {
  normalizeAnswer,
} from "../src/lib/questions/hybridGenerator.ts";
import { SKILL_SHEET } from "../src/data/skillSheet.ts";

test("Answer Normalization: Equivalent fraction representation", () => {
  assert.ok(areAnswersEquivalent("1/2", "2/4"), "1/2 should equal 2/4");
  assert.ok(areAnswersEquivalent("3/6", "1/2"), "3/6 should equal 1/2");
  assert.ok(areAnswersEquivalent("6/8", "3/4"), "6/8 should equal 3/4");
  assert.ok(areAnswersEquivalent("4/2", "2"), "4/2 should equal 2");
  assert.ok(areAnswersEquivalent("2/3", "4/6"), "2/3 should equal 4/6");
  assert.ok(!areAnswersEquivalent("1/3", "1/2"), "1/3 should NOT equal 1/2");
});

test("Answer Normalization: Spaces, commas, and unit stripping", () => {
  // Whitespace in fractions
  assert.ok(areAnswersEquivalent("1 / 2", "1/2"));
  assert.ok(areAnswersEquivalent(" 3 / 4 ", "3/4"));

  // Digit commas (Indian and International)
  assert.ok(areAnswersEquivalent("1,200", "1200"));
  assert.ok(areAnswersEquivalent("1,00,000", "100000"));

  // Suffix units (sweets, candies, kg, rs)
  assert.ok(areAnswersEquivalent("4 sweets", "4"));
  assert.ok(areAnswersEquivalent("12 candies", "12"));
  assert.ok(areAnswersEquivalent("50 rs", "50"));
  assert.ok(areAnswersEquivalent("Rs. 50", "50"));
  assert.ok(areAnswersEquivalent("15 kg", "15"));
});

test("Answer Normalization: Indic numerals (Devanagari and Telugu)", () => {
  // Devanagari numerals ०-९
  assert.equal(normalizeAnswer("५"), "5");
  assert.equal(normalizeAnswer("४२"), "42");
  assert.equal(normalizeAnswer("१,२००"), "1200");
  assert.ok(areAnswersEquivalent("५", "5"));
  assert.ok(areAnswersEquivalent("४२", "42"));
  assert.ok(areAnswersEquivalent("१/२", "1/2"));

  // Telugu numerals ౦-౯
  assert.equal(normalizeAnswer("౫"), "5");
  assert.equal(normalizeAnswer("౪౨"), "42");
  assert.ok(areAnswersEquivalent("౫", "5"));
  assert.ok(areAnswersEquivalent("౪౨", "42"));
});

test("Mathematical Truth: Question formats never contradict ground truth arithmetic", () => {
  const operations = [
    { concept: "addition", diff: 2 },
    { concept: "subtraction", diff: 2 },
    { concept: "mult_facts", diff: 2 },
    { concept: "division_facts", diff: 2 },
  ];

  const formats = ["true_false", "missing_number", "find_mistake", "choose_working", "compare_answers"];

  for (const { concept, diff } of operations) {
    for (const fmt of formats) {
      for (let seed = 1; seed <= 20; seed++) {
        const rng = makeRng(seed * 701 + diff * 13);
        const base = generateQuestion(concept, diff, rng, 4);
        const formatted = applyQuestionFormat(base, fmt, rng);

        const integrity = validateQuestionIntegrity(formatted);
        assert.ok(
          integrity.valid,
          `Format '${fmt}' produced invalid question for ${concept}: ${integrity.reason} (seed ${seed})`
        );

        if (fmt === "true_false") {
          // If statement is true, answer must be True. If false, answer must be False.
          assert.ok(
            formatted.answer === "True" || formatted.answer === "False",
            `true_false answer must be True or False, got: ${formatted.answer}`
          );
        }

        if (fmt === "missing_number") {
          const recomputed = recomputeGroundTruthAnswer(formatted);
          assert.ok(
            recomputed !== null,
            `missing_number recomputeGroundTruthAnswer failed for: ${formatted.expression || formatted.prompt.raw}`
          );
          assert.ok(
            areAnswersEquivalent(recomputed, formatted.answer),
            `missing_number recomputed '${recomputed}' does not match answer '${formatted.answer}'`
          );
        }
      }
    }
  }
});

test("Format Integrity: Choice-based questions retain options", () => {
  // comparing_fractions, division_concept (d=3), and number_sense (d=1, 2)
  for (let seed = 1; seed <= 20; seed++) {
    const rng = makeRng(seed * 809);
    
    // comparing_fractions
    const qFrac = generateQuestion("comparing_fractions", 1, rng, 4);
    assert.ok(qFrac.options && qFrac.options.length >= 2, "comparing_fractions must have options");
    assert.ok(qFrac.options.some((o) => areAnswersEquivalent(o.value, qFrac.answer)), "Answer must be among options");

    // division_concept d=3
    const qDiv3 = generateQuestion("division_concept", 3, rng, 3);
    assert.ok(qDiv3.options && qDiv3.options.length === 4, "division_concept d=3 must have 4 options");
    assert.ok(qDiv3.options.some((o) => areAnswersEquivalent(o.value, qDiv3.answer)), "Answer must be among options");

    // number_sense d=1
    const qNum1 = generateQuestion("number_sense", 1, rng, 3);
    assert.ok(qNum1.options && qNum1.options.length >= 2, "number_sense d=1 must have at least 2 options");
    assert.ok(qNum1.options.some((o) => areAnswersEquivalent(o.value, qNum1.answer)), "Answer must be among options");
  }
});

test("Place Value: Zero digit is never selected for tens or hundreds place-value queries", () => {
  for (let seed = 1; seed <= 50; seed++) {
    const rng = makeRng(seed * 911);
    const q = generateQuestion("place_value", 2, rng, 3);
    
    // Prompt asks: "What is the place value of X in Y?"
    const promptText = q.prompt.raw || q.prompt.en || "";
    const match = promptText.match(/place value of (\d+) in/i);
    if (match) {
      const queriedDigit = match[1];
      assert.notEqual(queriedDigit, "0", `Place value asked for 0 in seed ${seed}: ${promptText}`);
    }

    const integrity = validateQuestionIntegrity(q);
    assert.ok(integrity.valid, `Place value integrity failed: ${integrity.reason}`);
  }
});

test("Priority 2: Structural Diversity & Low Duplicate Rate Across Assessments", () => {
  const grades = [3, 4, 5];

  for (const grade of grades) {
    const classSkills = SKILL_SHEET.filter((s) => s.grade === grade);
    assert.ok(classSkills.length >= 4, `Expected skills for grade ${grade}`);

    const seenSignatures = new Set();
    const allQuestionSignatures = [];
    let repeatCount = 0;
    const assessmentRuns = 5;
    const questionsPerRun = 8;

    for (let run = 0; run < assessmentRuns; run++) {
      const rng = makeRng(5000 + run * 79);
      const sessionSignatures = new Set();

      for (let i = 0; i < questionsPerRun; i++) {
        // Pick skill cyclically to simulate balanced topic coverage
        const skill = classSkills[i % classSkills.length];
        const diff = (i % 3) + 1;

        const q = generateUnique(
          skill.conceptId,
          diff,
          rng,
          seenSignatures,
          grade
        );

        const integrity = validateQuestionIntegrity(q);
        assert.ok(
          integrity.valid,
          `Invalid question during diversity test (grade ${grade}, skill ${skill.conceptId}): ${integrity.reason}`
        );

        const sig = questionSignature(q);

        // Within the same assessment session, duplicate rate must be exactly 0
        assert.ok(!sessionSignatures.has(sig), `Duplicate question within session ${run}: ${sig}`);
        sessionSignatures.add(sig);

        // Track cross-session repeats
        if (allQuestionSignatures.includes(sig)) {
          repeatCount++;
        }
        allQuestionSignatures.push(sig);
      }
    }

    const totalQuestions = assessmentRuns * questionsPerRun;
    const repeatRate = repeatCount / totalQuestions;

    assert.ok(
      repeatRate <= 0.05,
      `Repeat rate for grade ${grade} was ${(repeatRate * 100).toFixed(1)}%, expected <= 5%`
    );
  }
});
