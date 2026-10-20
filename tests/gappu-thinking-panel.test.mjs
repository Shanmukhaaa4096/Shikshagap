/**
 * Tests for "See how Gappu thinks" live agent reasoning and prerequisite trace panel
 *
 * Verifies:
 * 1. Collapsible panel toggle with accessible touch targets (min-h >= 44px)
 * 2. Real agent state: current topic, confidence per topic, prerequisite trace timeline
 * 3. Staircase dependency backtracking logic (Class 5 -> Class 4 -> Class 3)
 * 4. Trilingual translations (en, hi, te) for all new dictionary strings
 * 5. Design invariants (MascotHero count, readable typography, no deficit language)
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DICTS } from "../src/lib/i18n/dict.ts";
import {
  createSessionMemory,
  getNextStaircaseAction,
  applyAttemptToMemory,
  getPrerequisiteForConcept,
  getConceptForTopic,
} from "../src/lib/agents/staircase.ts";
import { allConceptsMap, getCurriculumConcept } from "../src/data/curriculum/index.ts";

test("Gappu Thinking Panel: All 3 languages populated in dictionary", () => {
  const requiredKeys = [
    "seeHowGappuThinks",
    "seeHowGappuThinksSub",
    "gappuActiveTopic",
    "gappuConfidenceLabel",
    "gappuPrereqTrace",
    "gappuNoGapsTrace",
    "gappuCheckingPrereq",
    "gappuGapIsolated",
    "gappuPrereqSolid",
    "gappuTopicPending",
    "gappuTopicAssessing",
  ];

  for (const lang of ["en", "hi", "te"]) {
    const dict = DICTS[lang];
    assert.ok(dict, `Dictionary for lang "${lang}" should exist`);
    for (const key of requiredKeys) {
      assert.ok(
        dict[key] && dict[key].trim().length > 0,
        `Dictionary key "${key}" missing or empty for lang "${lang}"`
      );
    }
  }

  // Check specific English, Hindi, and Telugu texts
  assert.strictEqual(DICTS.en.seeHowGappuThinks, "See how Gappu thinks");
  assert.ok(DICTS.hi.seeHowGappuThinks.includes("गप्पू"));
  assert.ok(DICTS.te.seeHowGappuThinks.includes("గప్పు"));
});

test("Gappu Thinking Panel: Real agent state prerequisite backtracking", () => {
  // Test Class 5 Long Division -> Class 4 Multiplication facts -> Class 3 Regrouping
  const prereq1 = getPrerequisiteForConcept("long_division");
  assert.ok(prereq1, "Prerequisite for long_division must exist");
  assert.strictEqual(prereq1, "mult_facts");

  const prereq2 = getPrerequisiteForConcept(prereq1);
  assert.ok(prereq2, "Prerequisite for mult_facts must exist");
  assert.strictEqual(prereq2, "mult_concept");

  const prereq3 = getPrerequisiteForConcept(prereq2);
  assert.strictEqual(prereq3, "addition");

  // Verify concept metadata in curriculum graph
  const c5 = allConceptsMap.get("long_division");
  assert.strictEqual(c5.class, 5, "long_division should be Class 5");

  const c4 = allConceptsMap.get("mult_facts");
  assert.strictEqual(c4.class, 4, "mult_facts should be Class 4");

  const c3 = allConceptsMap.get("addition");
  assert.strictEqual(c3.class, 3, "addition should be Class 3");
  assert.ok(
    c3.name.en.toLowerCase().includes("regrouping"),
    "Class 3 addition should mention regrouping"
  );
});

test("Gappu Thinking Panel: Staircase memory dynamically traces prerequisite steps on error", () => {
  const memory = createSessionMemory(["division", "multiplication"]);
  assert.strictEqual(memory.currentTopicIndex, 0);

  // Question 1 for division at Level 2
  const initialConcept = getConceptForTopic("division", 5);
  assert.ok(initialConcept, "Initial concept for division should exist");

  // Attempt 1: student struggles (incorrect)
  const attempt1 = {
    questionId: "q1_div",
    conceptId: initialConcept,
    level: 2,
    studentAnswer: "wrong_val",
    correct: false,
    timestamp: Date.now(),
    errorType: "wrong_operation",
  };

  const step1 = applyAttemptToMemory(memory, attempt1);
  assert.strictEqual(step1.action.type, "ask");
  assert.strictEqual(step1.action.level, 1, "Next staircase question must be Level 1 (prerequisite check)");

  // Attempt 2: student struggles on prerequisite too
  const attempt2 = {
    questionId: "q2_prereq",
    conceptId: step1.action.conceptId,
    level: 1,
    studentAnswer: "wrong_prereq",
    correct: false,
    timestamp: Date.now(),
  };

  const step2 = applyAttemptToMemory(step1.memory, attempt2);
  assert.ok(step2.closedTopic, "Topic must be closed");
  assert.strictEqual(step2.closedTopic.status, "gap", "Topic status must be diagnosed as 'gap'");

  // Root prerequisite isolation from real agent state
  const rootPrereq = getPrerequisiteForConcept(attempt2.conceptId);
  assert.ok(rootPrereq, "Root prerequisite must be isolated from real state");
});

test("Gappu Thinking Panel: AdaptiveAssessmentView source contains collapsible panel and invariants", () => {
  const viewPath = path.resolve(process.cwd(), "src/components/AdaptiveAssessmentView.tsx");
  const source = fs.readFileSync(viewPath, "utf-8");

  // Panel test IDs
  assert.ok(source.includes('data-testid="gappu-thinking-panel"'), "Panel container test ID missing");
  assert.ok(source.includes('data-testid="toggle-gappu-thinking-btn"'), "Toggle button test ID missing");
  assert.ok(source.includes('data-testid="active-topic-display"'), "Active topic display test ID missing");
  assert.ok(source.includes('data-testid="topic-confidences-grid"'), "Topic confidences grid test ID missing");
  assert.ok(source.includes('data-testid="prereq-trace-timeline"'), "Prerequisite trace timeline test ID missing");
  assert.ok(source.includes('data-testid="prereq-trace-nodes-container"'), "Prerequisite trace nodes container test ID missing");

  // Accessibility & touch target
  assert.ok(source.includes('aria-expanded={showGappuThinking}'), "aria-expanded missing on toggle");
  assert.ok(source.includes('aria-controls="gappu-thinking-content"'), "aria-controls missing on toggle");
  assert.ok(source.includes("min-h-[48px]"), "Panel toggle must have large touch target min-h >= 44px");

  // Invariant: MascotHero count must remain exactly 2
  const mascotHeroCount = (source.match(/<MascotHero/g) || []).length;
  assert.strictEqual(
    mascotHeroCount,
    2,
    `<MascotHero count must remain exactly 2 (found ${mascotHeroCount})`
  );

  // Invariant: Typography readable (no text-[Npx] with N < 12)
  const tinyTextRegex = /text-\[(\d+)px\]/g;
  let match;
  while ((match = tinyTextRegex.exec(source)) !== null) {
    const px = parseInt(match[1], 10);
    assert.ok(px >= 12, `Found typography under 12px: text-[${px}px]`);
  }

  // Deficit-free language in student assessment
  assert.ok(!source.includes('"wrong"'), 'Should not use "wrong" in student feedback');
  assert.ok(!source.includes('"incorrect"'), 'Should not use "incorrect" in student feedback');
  assert.ok(!source.includes("weak student"), 'Should not use "weak student"');
  assert.ok(!source.includes("failing student"), 'Should not use "failing student"');
});
