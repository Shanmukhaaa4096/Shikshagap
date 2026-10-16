import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createInitialAdaptiveTopicState,
  computeNextAdaptiveStep,
  rotateSourceStyle,
  estimateAdaptiveMastery,
  DIFFICULTY_DESCRIPTIONS,
  SOURCE_STYLE_METADATA,
} from "../src/lib/agents/adaptiveEngine.ts";

describe("Adaptive Difficulty Engine (5-Level Pedagogical Ladder)", () => {
  it("Rule 0: Difficulty descriptions and source style metadata are defined accurately", () => {
    assert.equal(DIFFICULTY_DESCRIPTIONS[1].tag, "recall");
    assert.equal(DIFFICULTY_DESCRIPTIONS[2].tag, "understanding");
    assert.equal(DIFFICULTY_DESCRIPTIONS[3].tag, "application");
    assert.equal(DIFFICULTY_DESCRIPTIONS[4].tag, "analysis");
    assert.equal(DIFFICULTY_DESCRIPTIONS[5].tag, "challenge");

    assert.ok(SOURCE_STYLE_METADATA.ncert);
    assert.ok(SOURCE_STYLE_METADATA.exemplar);
    assert.ok(SOURCE_STYLE_METADATA.cbse_reference);
    assert.ok(SOURCE_STYLE_METADATA.icse_selina);
    assert.ok(SOURCE_STYLE_METADATA.icse_foundation);
  });

  it("Rule 1: Initial state always starts at Level 2 (Understanding)", () => {
    const state = createInitialAdaptiveTopicState("division", "division_facts");
    assert.equal(state.currentLevel, 2);
    assert.equal(state.correctStreak, 0);
    assert.equal(state.wrongStreak, 0);
    assert.equal(state.questionCount, 0);
    assert.equal(state.status, "pending");
  });

  it("Rule 2: Single correct answer increases difficulty by 1 level (L2 -> L3)", () => {
    const s0 = createInitialAdaptiveTopicState("division", "division_facts");
    const { nextState, action } = computeNextAdaptiveStep(s0, {
      questionId: "q1",
      conceptId: "division_facts",
      level: 2,
      responseKind: "correct",
      sourceStyle: "ncert",
    });

    assert.equal(action.type, "ask");
    if (action.type === "ask") {
      assert.equal(action.level, 3);
      assert.equal(action.conceptId, "division_facts");
      assert.equal(nextState.correctStreak, 1);
      assert.equal(nextState.wrongStreak, 0);
      assert.equal(nextState.highestLevelReached, 2);
    }
  });

  it("Rule 3: Two correct answers in a row accelerates / jumps difficulty (L2 -> L4)", () => {
    const s0 = createInitialAdaptiveTopicState("multiplication", "mult_facts");
    const step1 = computeNextAdaptiveStep(s0, {
      questionId: "q1",
      conceptId: "mult_facts",
      level: 2,
      responseKind: "correct",
      sourceStyle: "ncert",
    });

    const step2 = computeNextAdaptiveStep(step1.nextState, {
      questionId: "q2",
      conceptId: "mult_facts",
      level: 2,
      responseKind: "correct",
      sourceStyle: "icse_selina",
    });

    assert.equal(step2.action.type, "ask");
    if (step2.action.type === "ask") {
      assert.equal(step2.action.level, 4); // Jumped from 2 to 4
      assert.equal(step2.nextState.correctStreak, 2);
    }
  });

  it("Rule 4: Two correct in a row at L5 triggers early topic mastery", () => {
    const s0 = createInitialAdaptiveTopicState("fractions", "fraction_basics");
    // Simulate getting L5 right on question 1
    const step1 = computeNextAdaptiveStep(s0, {
      questionId: "q1",
      conceptId: "fraction_basics",
      level: 5,
      responseKind: "correct",
      sourceStyle: "exemplar",
    });

    // Second correct in a row at L5 on question 2
    const step2 = computeNextAdaptiveStep(step1.nextState, {
      questionId: "q2",
      conceptId: "fraction_basics",
      level: 5,
      responseKind: "correct",
      sourceStyle: "icse_selina",
    });

    assert.equal(step2.action.type, "close_topic");
    if (step2.action.type === "close_topic") {
      assert.equal(step2.action.status, "mastered");
      assert.equal(step2.action.highestLevelReached, 5);
      assert.equal(step2.nextState.status, "mastered");
    }
  });

  it("Rule 5: Partially correct stays at same level and targets missing part", () => {
    const s0 = createInitialAdaptiveTopicState("number_ops", "place_value");
    const { nextState, action } = computeNextAdaptiveStep(s0, {
      questionId: "q1",
      conceptId: "place_value",
      level: 3,
      responseKind: "partially_correct",
      sourceStyle: "ncert",
      missingPart: "tens_place_regrouping",
    });

    assert.equal(action.type, "ask");
    if (action.type === "ask") {
      assert.equal(action.level, 3); // Stayed at 3
      assert.equal(action.missingPartTarget, "tens_place_regrouping");
      assert.equal(nextState.correctStreak, 0);
      assert.equal(nextState.wrongStreak, 0);
    }
  });

  it("Rule 6: Single wrong or 'I don't know' drops 1 level and provides a hint", () => {
    const s0 = createInitialAdaptiveTopicState("division", "division_facts");
    const { nextState, action } = computeNextAdaptiveStep(s0, {
      questionId: "q1",
      conceptId: "division_facts",
      level: 3,
      responseKind: "dont_know",
      sourceStyle: "cbse_reference",
    });

    assert.equal(action.type, "ask");
    if (action.type === "ask") {
      assert.equal(action.level, 2); // Dropped 3 -> 2
      assert.ok(action.hintKey);
      assert.equal(nextState.wrongStreak, 1);
      assert.equal(nextState.correctStreak, 0);
    }
  });

  it("Rule 7: Two wrong in a row drops 2 levels and backtracks to prerequisite concept", () => {
    const s0 = createInitialAdaptiveTopicState("division", "division_facts");
    const step1 = computeNextAdaptiveStep(s0, {
      questionId: "q1",
      conceptId: "division_facts",
      level: 4,
      responseKind: "wrong",
      sourceStyle: "ncert",
    });

    const step2 = computeNextAdaptiveStep(step1.nextState, {
      questionId: "q2",
      conceptId: "division_facts",
      level: 3,
      responseKind: "wrong",
      sourceStyle: "icse_selina",
      errorType: "wrong_operation",
    });

    assert.equal(step2.action.type, "ask");
    if (step2.action.type === "ask") {
      // 3 - 2 = 1
      assert.equal(step2.action.level, 1);
      // Prerequisite for division_facts with sharing/wrong_operation error is division_concept
      assert.equal(step2.action.conceptId, "division_concept");
      assert.equal(step2.nextState.wrongStreak, 2);
    }
  });

  it("Rule 8: Stuck at L1 with wrong answer activates teaching mode", () => {
    const s0 = createInitialAdaptiveTopicState("division", "division_concept");
    const { nextState, action } = computeNextAdaptiveStep(s0, {
      questionId: "q1",
      conceptId: "division_concept",
      level: 1,
      responseKind: "wrong",
      sourceStyle: "ncert",
    });

    assert.equal(action.type, "ask");
    if (action.type === "ask") {
      assert.equal(action.level, 1); // Never drops below 1
      assert.equal(action.isTeachingMode, true);
      assert.ok(action.teachingExplanationKey);
      assert.equal(nextState.isTeachingMode, true);
      assert.equal(nextState.consecutiveL1Wrongs, 1);
    }
  });

  it("Rule 9: Two consecutive wrong at L1 triggers early stop for teacher support", () => {
    const s0 = createInitialAdaptiveTopicState("division", "division_concept");
    const step1 = computeNextAdaptiveStep(s0, {
      questionId: "q1",
      conceptId: "division_concept",
      level: 1,
      responseKind: "wrong",
      sourceStyle: "ncert",
    });

    const step2 = computeNextAdaptiveStep(step1.nextState, {
      questionId: "q2",
      conceptId: "division_concept",
      level: 1,
      responseKind: "wrong",
      sourceStyle: "icse_selina",
    });

    assert.equal(step2.action.type, "close_topic");
    if (step2.action.type === "close_topic") {
      assert.equal(step2.action.status, "needs_teacher_support");
      assert.equal(step2.nextState.status, "needs_teacher_support");
    }
  });

  it("Rule 10: Never exceeds L5 and never drops below L1 (Bounds invariant)", () => {
    const s0 = createInitialAdaptiveTopicState("multiplication", "mult_facts");
    // At L5, correct answer stays capped at 5
    const stepAtMax = computeNextAdaptiveStep(s0, {
      questionId: "q1",
      conceptId: "mult_facts",
      level: 5,
      responseKind: "correct",
      sourceStyle: "exemplar",
    });
    if (stepAtMax.action.type === "ask") {
      assert.ok(stepAtMax.action.level <= 5);
    }

    // At L1, wrong answer stays at 1
    const stepAtMin = computeNextAdaptiveStep(s0, {
      questionId: "q2",
      conceptId: "mult_facts",
      level: 1,
      responseKind: "wrong",
      sourceStyle: "ncert",
    });
    if (stepAtMin.action.type === "ask") {
      assert.ok(stepAtMin.action.level >= 1);
    }
  });

  it("Rule 11: Maximum question budget of 6 per topic is strictly enforced", () => {
    let state = createInitialAdaptiveTopicState("fractions", "equivalent_fractions");
    for (let i = 1; i <= 5; i++) {
      const res = computeNextAdaptiveStep(state, {
        questionId: `q${i}`,
        conceptId: "equivalent_fractions",
        level: ((i % 3) + 1),
        responseKind: i % 2 === 0 ? "correct" : "partially_correct",
        sourceStyle: "ncert",
      });
      assert.equal(res.action.type, "ask");
      state = res.nextState;
    }

    // 6th question attempt: MUST close topic
    const step6 = computeNextAdaptiveStep(state, {
      questionId: "q6",
      conceptId: "equivalent_fractions",
      level: 3,
      responseKind: "correct",
      sourceStyle: "icse_selina",
    });

    assert.equal(step6.action.type, "close_topic");
    assert.equal(step6.nextState.questionCount, 6);
  });
});

describe("Multi-Book & Multi-Board Question Source Style Rotation", () => {
  it("Rule 1: Never two consecutive questions from the same source style", () => {
    let history = [];
    for (let i = 0; i < 20; i++) {
      const nextStyle = rotateSourceStyle(history, "BOTH", (i * 0.17) % 1);
      if (history.length > 0) {
        assert.notEqual(nextStyle, history[history.length - 1], `Consecutive styles matched at step ${i}`);
      }
      history.push(nextStyle);
    }
  });

  it("Rule 2: In every 5 questions, at least 2 different source styles appear", () => {
    let history = [];
    for (let i = 0; i < 30; i++) {
      const nextStyle = rotateSourceStyle(history, "BOTH", (i * 0.23) % 1);
      history.push(nextStyle);
      if (history.length >= 5) {
        const window = history.slice(-5);
        const uniqueInWindow = new Set(window).size;
        assert.ok(uniqueInWindow >= 2, `Window [${window.join(", ")}] has fewer than 2 distinct styles`);
      }
    }
  });

  it("Rule 3: Board preference weights CBSE (>=60% CBSE/NCERT sources) when CBSE chosen", () => {
    let history = [];
    const cbseFamily = new Set(["ncert", "exemplar", "cbse_reference"]);
    let cbseCount = 0;
    const trials = 50;

    for (let i = 0; i < trials; i++) {
      const nextStyle = rotateSourceStyle(history, "CBSE", (i * 0.19) % 1);
      history.push(nextStyle);
      if (cbseFamily.has(nextStyle)) cbseCount++;
    }

    const ratio = cbseCount / trials;
    assert.ok(ratio >= 0.60, `CBSE preference ratio ${ratio} is below 60%`);
  });

  it("Rule 4: Board preference weights ICSE (>=60% ICSE sources) when ICSE chosen", () => {
    let history = [];
    const icseFamily = new Set(["icse_selina", "icse_foundation"]);
    let icseCount = 0;
    const trials = 50;

    for (let i = 0; i < trials; i++) {
      const nextStyle = rotateSourceStyle(history, "ICSE", (i * 0.19) % 1);
      history.push(nextStyle);
      if (icseFamily.has(nextStyle)) icseCount++;
    }

    const ratio = icseCount / trials;
    assert.ok(ratio >= 0.60, `ICSE preference ratio ${ratio} is below 60%`);
  });
});

describe("Bayesian Mastery Evidence Scaling by Difficulty Level", () => {
  it("Rule 1: Answering an L5 question right provides more mastery evidence than L1", () => {
    const l1Success = [
      {
        id: "r1",
        studentId: "s1",
        questionId: "q1",
        conceptId: "mult_facts",
        difficulty: 1,
        answer: "12",
        correct: true,
        classification: "correct",
        timestamp: "2026-10-16T10:00:00Z",
        timeMs: 4000,
        context: "assessment",
      },
      {
        id: "r2",
        studentId: "s1",
        questionId: "q2",
        conceptId: "mult_facts",
        difficulty: 1,
        answer: "18",
        correct: true,
        classification: "correct",
        timestamp: "2026-10-16T10:01:00Z",
        timeMs: 4000,
        context: "assessment",
      },
    ];

    const l5Success = [
      {
        id: "r3",
        studentId: "s1",
        questionId: "q3",
        conceptId: "mult_facts",
        difficulty: 5,
        answer: "144",
        correct: true,
        classification: "correct",
        timestamp: "2026-10-16T10:00:00Z",
        timeMs: 4000,
        context: "assessment",
      },
      {
        id: "r4",
        studentId: "s1",
        questionId: "q4",
        conceptId: "mult_facts",
        difficulty: 5,
        answer: "168",
        correct: true,
        classification: "correct",
        timestamp: "2026-10-16T10:01:00Z",
        timeMs: 4000,
        context: "assessment",
      },
    ];

    const m1 = estimateAdaptiveMastery("mult_facts", l1Success);
    const m5 = estimateAdaptiveMastery("mult_facts", l5Success);

    // Alpha (accumulated success evidence) must be significantly higher for L5 than L1
    assert.ok(
      m5.alpha > m1.alpha,
      `Expected L5 alpha (${m5.alpha}) to exceed L1 alpha (${m1.alpha})`
    );
  });

  it("Rule 2: Missing an L1 question provides stronger evidence of a gap than missing L5", () => {
    const l1Fail = [
      {
        id: "r1",
        studentId: "s1",
        questionId: "q1",
        conceptId: "division_concept",
        difficulty: 1,
        answer: "0",
        correct: false,
        classification: "wrong_operation",
        timestamp: "2026-10-16T10:00:00Z",
        timeMs: 5000,
        context: "assessment",
      },
    ];

    const l5Fail = [
      {
        id: "r2",
        studentId: "s1",
        questionId: "q2",
        conceptId: "division_concept",
        difficulty: 5,
        answer: "0",
        correct: false,
        classification: "slip",
        timestamp: "2026-10-16T10:00:00Z",
        timeMs: 5000,
        context: "assessment",
      },
    ];

    const m1 = estimateAdaptiveMastery("division_concept", l1Fail);
    const m5 = estimateAdaptiveMastery("division_concept", l5Fail);

    // Beta (evidence of learning gap) must be significantly higher when missing L1 than when missing L5
    assert.ok(
      m1.beta > m5.beta,
      `Expected L1 beta (${m1.beta}) to exceed L5 beta (${m5.beta})`
    );
    // Mastery after missing L1 should be lower than after missing L5
    assert.ok(
      m1.mastery < m5.mastery,
      `Expected L1 failure mastery (${m1.mastery}) to be lower than L5 failure mastery (${m5.mastery})`
    );
  });
});

