import test from "node:test";
import assert from "node:assert/strict";
import {
  ALL_CURRICULUM_CONCEPTS_LIST,
  CURRICULUM_REGISTRY,
  validateCurriculumGraph,
  ancestorsOfConcept,
} from "../src/data/curriculum/index.ts";
import { tracePrerequisiteBacktrack } from "../src/lib/concepts/graph.ts";

test("Curriculum Graph: full integrity validation (DAG, no missing IDs, trilingual completeness)", () => {
  const result = validateCurriculumGraph();

  // 1. Must be valid with 0 errors
  assert.equal(result.errors.length, 0, `Validation errors: ${result.errors.join("; ")}`);
  assert.ok(result.valid, "Concept graph should be marked valid");

  // 2. 0 cycles (DAG property)
  assert.equal(result.cycles.length, 0, `Directed cycles found: ${JSON.stringify(result.cycles)}`);

  // 3. 0 missing prerequisites
  assert.equal(
    result.missingPrereqs.length,
    0,
    `Missing prerequisites found: ${result.missingPrereqs.join(", ")}`
  );

  // 4. 0 missing translations
  assert.equal(
    result.invalidTranslations.length,
    0,
    `Concepts with missing en/hi/te translations: ${result.invalidTranslations.join(", ")}`
  );

  // 5. 0 missing syllabus sources and learning outcomes
  assert.equal(
    result.missingSources.length,
    0,
    `Concepts with missing syllabus source citations: ${result.missingSources.join(", ")}`
  );
  assert.equal(
    result.missingOutcomes.length,
    0,
    `Concepts with missing learning outcomes: ${result.missingOutcomes.join(", ")}`
  );

  // 6. Total concepts and edges check
  assert.ok(result.totalConcepts >= 180, `Expected at least 180 concepts across Classes 1-10, got ${result.totalConcepts}`);
  assert.ok(result.totalPrerequisiteEdges >= 200, `Expected at least 200 prerequisite edges, got ${result.totalPrerequisiteEdges}`);
});

test("Curriculum Graph: class bands coverage (Classes 1 to 10 for CBSE & ICSE)", () => {
  for (let grade = 1; grade <= 10; grade++) {
    const cbseForGrade = ALL_CURRICULUM_CONCEPTS_LIST.filter(
      (c) => c.class === grade && c.board === "CBSE"
    );
    const icseForGrade = ALL_CURRICULUM_CONCEPTS_LIST.filter(
      (c) => c.class === grade && c.board === "ICSE"
    );

    assert.ok(
      cbseForGrade.length > 0,
      `Class ${grade} CBSE must have registered curriculum concepts, found 0`
    );
    assert.ok(
      icseForGrade.length > 0,
      `Class ${grade} ICSE must have registered curriculum concepts, found 0`
    );
  }

  // Band 1-2 check: counting, place value to 100, addition/subtraction, shapes, time, money
  const band12 = ALL_CURRICULUM_CONCEPTS_LIST.filter((c) => c.class <= 2);
  const band12Ids = band12.map((c) => c.id).join(" ");
  assert.ok(band12Ids.includes("counting"), "Band 1-2 must cover counting");
  assert.ok(band12Ids.includes("shapes"), "Band 1-2 must cover shapes");
  assert.ok(band12Ids.includes("money"), "Band 1-2 must cover money");
  assert.ok(band12Ids.includes("add"), "Band 1-2 must cover addition");

  // Band 3-5 check: existing topics plus measurement, geometry basics, data handling
  const band35 = ALL_CURRICULUM_CONCEPTS_LIST.filter((c) => c.class >= 3 && c.class <= 5);
  const band35Ids = band35.map((c) => c.id).join(" ");
  assert.ok(band35Ids.includes("number_sense"), "Band 3-5 must include existing number_sense");
  assert.ok(band35Ids.includes("place_value"), "Band 3-5 must include existing place_value");
  assert.ok(band35Ids.includes("fraction"), "Band 3-5 must include existing fractions");
  assert.ok(band35Ids.includes("measurement"), "Band 3-5 must include measurement");
  assert.ok(band35Ids.includes("geometry"), "Band 3-5 must include geometry basics");
  assert.ok(band35Ids.includes("data"), "Band 3-5 must include data handling");

  // Band 6-8 check: integers, fractions/decimals, ratio, algebra basics, geometry, mensuration
  const band68 = ALL_CURRICULUM_CONCEPTS_LIST.filter((c) => c.class >= 6 && c.class <= 8);
  const band68Ids = band68.map((c) => c.id).join(" ");
  assert.ok(band68Ids.includes("integers"), "Band 6-8 must cover integers");
  assert.ok(band68Ids.includes("fractions_decimals") || band68Ids.includes("rational"), "Band 6-8 must cover fractions/decimals/rationals");
  assert.ok(band68Ids.includes("ratio"), "Band 6-8 must cover ratio");
  assert.ok(band68Ids.includes("algebra"), "Band 6-8 must cover algebra basics");
  assert.ok(band68Ids.includes("mensuration"), "Band 6-8 must cover mensuration");

  // Band 9-10 check: polynomials, linear equations, coordinate geometry, trigonometry, statistics, probability, quadratic equations, progressions
  const band910 = ALL_CURRICULUM_CONCEPTS_LIST.filter((c) => c.class >= 9 && c.class <= 10);
  const band910Ids = band910.map((c) => c.id).join(" ");
  assert.ok(band910Ids.includes("polynomials"), "Band 9-10 must cover polynomials");
  assert.ok(band910Ids.includes("linear_equations"), "Band 9-10 must cover linear equations");
  assert.ok(band910Ids.includes("coordinate_geometry"), "Band 9-10 must cover coordinate geometry");
  assert.ok(band910Ids.includes("trigonometry") || band910Ids.includes("trigonometric"), "Band 9-10 must cover trigonometry");
  assert.ok(band910Ids.includes("statistics"), "Band 9-10 must cover statistics");
  assert.ok(band910Ids.includes("probability"), "Band 9-10 must cover probability");
  assert.ok(band910Ids.includes("quadratic_equations"), "Band 9-10 must cover quadratic equations");
  assert.ok(band910Ids.includes("progression"), "Band 9-10 must cover progressions");
});

test("Curriculum Graph: Class 10 gap backtracks to Class 6-8 and foundational prerequisites", () => {
  // CBSE Class 10 Quadratic Equations backtracking
  const cbse10Ancestors = ancestorsOfConcept("cbse_10_quadratic_equations");
  assert.ok(
    cbse10Ancestors.has("cbse_9_polynomials"),
    "Class 10 quadratic equations must have Class 9 polynomials as ancestor"
  );
  assert.ok(
    cbse10Ancestors.has("cbse_8_factorisation"),
    "Class 10 quadratic equations must reach Class 8 factorisation"
  );
  assert.ok(
    cbse10Ancestors.has("cbse_7_algebraic_expressions"),
    "Class 10 quadratic equations must reach Class 7 algebraic expressions"
  );
  assert.ok(
    cbse10Ancestors.has("cbse_6_algebra_basics"),
    "Class 10 quadratic equations must reach Class 6 algebra basics"
  );
  assert.ok(
    cbse10Ancestors.has("multi_digit_mult"),
    "Class 10 quadratic equations must reach Class 5 multi_digit_mult"
  );
  assert.ok(
    cbse10Ancestors.has("mult_facts"),
    "Class 10 quadratic equations must reach Class 4 mult_facts"
  );
  assert.ok(
    cbse10Ancestors.has("addition"),
    "Class 10 quadratic equations must reach Class 3 addition"
  );
  assert.ok(
    cbse10Ancestors.has("cbse_2_add_2digit"),
    "Class 10 quadratic equations must reach Class 2 addition"
  );
  assert.ok(
    cbse10Ancestors.has("cbse_1_add_sub_9"),
    "Class 10 quadratic equations must reach Class 1 foundational addition"
  );

  // ICSE Class 10 Quadratic Equations backtracking
  const icse10Ancestors = ancestorsOfConcept("icse_10_quadratic_equations");
  assert.ok(
    icse10Ancestors.has("icse_9_algebra_expansions") || icse10Ancestors.has("cbse_10_quadratic_equations"),
    "ICSE Class 10 quadratic equations must link to factorisation/expansions or shared skill"
  );

  // Test tracePrerequisiteBacktrack function
  const backtrackChain = tracePrerequisiteBacktrack("cbse_10_quadratic_equations");
  assert.ok(backtrackChain.length >= 6, "Backtrack chain should have depth of at least 6 levels");
  const gradesInChain = backtrackChain.map((n) => n.grade);
  assert.ok(gradesInChain.includes(10), "Chain includes Class 10");
  assert.ok(gradesInChain.includes(9), "Chain includes Class 9");
  assert.ok(gradesInChain.includes(8), "Chain includes Class 8");
  assert.ok(gradesInChain.includes(7), "Chain includes Class 7");
  assert.ok(gradesInChain.includes(6), "Chain includes Class 6");
  assert.ok(gradesInChain.includes(5) || gradesInChain.includes(4), "Chain reaches foundational classes");
});

test("Curriculum Graph: cross-board shared underlying skills", () => {
  // ICSE concepts point to shared underlying skills / CBSE equivalents where appropriate
  const icseConcept = CURRICULUM_REGISTRY["icse_10_quadratic_equations"];
  assert.ok(
    icseConcept.prerequisites.includes("cbse_10_quadratic_equations") ||
      icseConcept.prerequisites.some((p) => p.startsWith("icse_") || p.startsWith("cbse_")),
    "ICSE concepts must link to underlying skills"
  );

  // Each concept has valid difficulty levels and question formats
  for (const c of ALL_CURRICULUM_CONCEPTS_LIST) {
    assert.ok(c.difficultyLevels.length > 0, `${c.id} must have allowed difficulty levels`);
    assert.ok(c.questionTypes.length > 0, `${c.id} must have allowed question types`);
    assert.ok(c.chapterName.length > 0, `${c.id} must have official chapter name`);
  }
});
