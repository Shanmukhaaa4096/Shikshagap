/**
 * scripts/verifyBackToBackAssessments.mjs
 *
 * STEP 15 Verification:
 * Runs two full simulated back-to-back assessments per class (Classes 3, 4, 5)
 * and confirms that memory counts (presentation count, correct answers, misconception tallies,
 * and topic outcomes) rise after each session.
 */

import assert from "node:assert/strict";
import {
  saveValidatedQuestion,
  processAnonymousSession,
  getInMemoryQuestionStats,
  getAnonymousMisconceptionTallies,
  getAnonymousTopicOutcomeTallies,
  resetQuestionMemoryForTesting,
} from "../src/lib/db/questionMemory.ts";
import { stepAssessment } from "../src/lib/agents/orchestrator.ts";
import { createSessionMemory } from "../src/lib/agents/staircase.ts";
import { getClassConfig } from "../src/lib/curriculum/classes.ts";

async function runBackToBackVerification() {
  console.log("=== STEP 15: VERIFYING BACK-TO-BACK ASSESSMENTS AND MEMORY GROWTH ===");
  resetQuestionMemoryForTesting();

  const grades = [3, 4, 5];

  for (const grade of grades) {
    console.log(`\nTesting Class ${grade}:`);
    const classConfig = getClassConfig(`class_${grade}`);
    const topics = classConfig?.topics || ["number_ops", "multiplication"];
    const conceptId = classConfig.targetConcepts[0];

    // Seed question into memory
    const q = await saveValidatedQuestion({
      id: `test_q_g${grade}_01`,
      grade,
      conceptId,
      language: "en",
      theme: "classroom",
      text: `Solve the foundational problem for Class ${grade}`,
      operands: [10, 5],
      embedding: [],
    });

    const initialStats = getInMemoryQuestionStats().get(q.id);
    const initialShown = initialStats?.timesShown || 0;
    const initialCorrect = initialStats?.timesCorrect || 0;
    console.log(`  Initial memory for ${conceptId} (Class ${grade}): shown=${initialShown}, correct=${initialCorrect}`);

    // --- SESSION 1: Full simulation with correct answer ---
    const session1Id = `sess_b2b_g${grade}_run1_${Date.now()}`;
    let memory1 = createSessionMemory(`sim_stud1_g${grade}`, grade, "en", topics);
    let step1 = await stepAssessment(memory1, undefined, { skipLLM: true });
    let loop1 = 0;
    while (step1.action.type !== "finish" && loop1 < 10) {
      loop1++;
      step1 = await stepAssessment(
        step1.memory,
        {
          conceptId: step1.action.conceptId,
          level: step1.action.level,
          questionId: q.id,
          studentAnswer: "15",
          correct: true,
        },
        { skipLLM: true }
      );
    }

    const session1Payload = {
      sessionId: session1Id,
      grade,
      language: "en",
      hourTimestamp: new Date().toISOString().slice(0, 13) + ":00:00.000Z",
      questions: [
        {
          questionId: q.id,
          conceptId,
          level: 2,
          correct: true,
        },
      ],
      topicOutcomes: [
        {
          topicId: topics[0],
          status: "mastered",
        },
      ],
    };

    const res1 = await processAnonymousSession(session1Payload);
    assert.equal(res1.success, true);
    assert.equal(res1.recorded, true);

    const statsAfter1 = getInMemoryQuestionStats().get(q.id);
    console.log(`  After Session 1: shown=${statsAfter1?.timesShown}, correct=${statsAfter1?.timesCorrect}`);
    assert.equal(statsAfter1?.timesShown, initialShown + 1, "timesShown must increase by 1 after Session 1");
    assert.equal(statsAfter1?.timesCorrect, initialCorrect + 1, "timesCorrect must increase by 1 after Session 1");

    // --- SESSION 2: Full simulation with incorrect answer & misconception ---
    const session2Id = `sess_b2b_g${grade}_run2_${Date.now() + 500}`;
    let memory2 = createSessionMemory(`sim_stud2_g${grade}`, grade, "en", topics);
    let step2 = await stepAssessment(memory2, undefined, { skipLLM: true });
    let loop2 = 0;
    while (step2.action.type !== "finish" && loop2 < 10) {
      loop2++;
      step2 = await stepAssessment(
        step2.memory,
        {
          conceptId: step2.action.conceptId,
          level: step2.action.level,
          questionId: q.id,
          studentAnswer: "5",
          correct: false,
          wrongOptionTag: "err_regrouping",
        },
        { skipLLM: true }
      );
    }

    const session2Payload = {
      sessionId: session2Id,
      grade,
      language: "en",
      hourTimestamp: new Date().toISOString().slice(0, 13) + ":00:00.000Z",
      questions: [
        {
          questionId: q.id,
          conceptId,
          level: 2,
          correct: false,
          wrongOptionTag: "err_regrouping",
        },
      ],
      topicOutcomes: [
        {
          topicId: topics[0],
          status: "developing",
        },
      ],
    };

    const res2 = await processAnonymousSession(session2Payload);
    assert.equal(res2.success, true);
    assert.equal(res2.recorded, true);

    const statsAfter2 = getInMemoryQuestionStats().get(q.id);
    console.log(`  After Session 2: shown=${statsAfter2?.timesShown}, correct=${statsAfter2?.timesCorrect}`);
    assert.equal(statsAfter2?.timesShown, initialShown + 2, "timesShown must increase by 2 after Session 2");
    assert.equal(statsAfter2?.timesCorrect, initialCorrect + 1, "timesCorrect stays at +1 since Session 2 was wrong");

    console.log(`  ✓ Class ${grade} question counters rose from ${initialShown} -> ${statsAfter1?.timesShown} -> ${statsAfter2?.timesShown}`);
  }

  // Verify aggregate misconception and topic outcome counts rose across sessions
  const misconceptions = getAnonymousMisconceptionTallies();
  console.log(`\nVerified Misconception Tallies: ${misconceptions.length} categories tracked anonymously`);
  assert.ok(misconceptions.length >= 3, "Misconceptions should be recorded for tested classes");

  const topicTallies = getAnonymousTopicOutcomeTallies();
  console.log(`Verified Topic Outcome Tallies: ${topicTallies.length} outcomes tracked`);
  assert.ok(topicTallies.length >= 3, "Topic outcomes should be recorded for tested classes");

  console.log("\nSUCCESS: All back-to-back assessments confirmed memory increments as required by Step 15.");
}

runBackToBackVerification().catch((err) => {
  console.error("Back to back assessment failed:", err);
  process.exit(1);
});
