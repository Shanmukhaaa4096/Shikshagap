/**
 * scripts/simulateAssessments.mjs
 *
 * Runs three full simulated assessments each for Classes 3, 4, and 5,
 * in all three languages (en, hi, te), once with Gemini mocked ON and once with it OFF.
 * Logs execution progress and ensures zero crashes occur across all 54 simulations.
 */

import { stepAssessment } from "../src/lib/agents/orchestrator.ts";
import { createSessionMemory } from "../src/lib/agents/staircase.ts";
import { getClassConfig } from "../src/lib/curriculum/classes.ts";

const grades = [3, 4, 5];
const languages = ["en", "hi", "te"];
const modes = [
  { name: "Gemini Mocked ON", mockGemini: true },
  { name: "Gemini OFF (pure fallback)", mockGemini: false },
];

function createMockGeminiClient() {
  return {
    models: {
      generateContent: async ({ contents }) => {
        const textPrompt = contents?.[0]?.parts?.[0]?.text || "";
        if (/misconception/i.test(textPrompt)) {
          return {
            text: JSON.stringify({
              misconceptions: [
                {
                  code: "regrouping_error",
                  explanation: "Student struggled with regrouping tens.",
                },
              ],
            }),
          };
        }
        if (/educational mathematics item writer/i.test(textPrompt)) {
          return {
            text: JSON.stringify({
              wordProblem: "A teacher arranged 6 pencils and 4 pens. How many items altogether?",
              scenarioTopic: "school",
            }),
          };
        }
        return {
          text: JSON.stringify({
            recommendations: [
              {
                id: "res_num_01",
                reason: "Provides visual regrouping practice.",
              },
            ],
            summary: "Student demonstrated foundational understanding.",
          }),
        };
      },
    },
  };
}

let totalSimulations = 0;
let totalStepsExecuted = 0;
let errorsEncountered = 0;

console.log("=== STARTING 54 FULL SIMULATED ASSESSMENTS ===");

for (const mode of modes) {
  console.log(`\n--- Running Mode: ${mode.name} ---`);
  const client = mode.mockGemini ? createMockGeminiClient() : undefined;
  const options = client ? { client, skipLLM: false } : { skipLLM: true };

  for (const grade of grades) {
    const classConfig = getClassConfig(grade);
    const topics = classConfig?.topics || ["number_ops", "multiplication", "division", "fractions"];

    for (const lang of languages) {
      for (let run = 1; run <= 3; run++) {
        totalSimulations++;
        const studentId = `sim_g${grade}_${lang}_run${run}`;
        let memory = createSessionMemory(studentId, grade, lang, topics);

        try {
          // Initial step
          let step = await stepAssessment(memory, undefined, options);
          totalStepsExecuted++;

          // Step until finished (maximum 2 questions per topic)
          let safetyLoopLimit = topics.length * 3 + 2;
          let loopCount = 0;

          while (step.action.type !== "finish" && loopCount < safetyLoopLimit) {
            loopCount++;
            totalStepsExecuted++;
            memory = step.memory;

            // Simulate student answer: alternate correct and wrong to test all paths
            // run 1: all correct -> all mastered
            // run 2: alternating -> developing / gap
            // run 3: all wrong -> gap
            const isCorrect = run === 1 ? true : run === 2 ? loopCount % 2 === 0 : false;

            step = await stepAssessment(
              memory,
              {
                conceptId: step.action.conceptId,
                level: step.action.level,
                questionId: `sim_q_${loopCount}`,
                studentAnswer: isCorrect ? "correct_val" : "wrong_val",
                correct: isCorrect,
              },
              options
            );
          }

          if (step.action.type !== "finish") {
            throw new Error(`Assessment did not reach finish state within safety limit for ${studentId}`);
          }

          // Verify every topic closed properly
          for (const topic of step.memory.topics) {
            if (!["mastered", "developing", "gap"].includes(topic.status)) {
              throw new Error(`Topic ${topic.topicId} did not reach terminal status (status: ${topic.status})`);
            }
          }
        } catch (err) {
          errorsEncountered++;
          console.error(`[CRASH] Failed simulation: Class ${grade}, ${lang}, Run ${run}, Mode: ${mode.name}`, err);
        }
      }
    }
  }
}

console.log(`\n=== 54 SIMULATIONS COMPLETE ===`);
console.log(`Total Assessment Runs: ${totalSimulations} / 54`);
console.log(`Total Steps Executed: ${totalStepsExecuted}`);
console.log(`Errors / Crashes: ${errorsEncountered}`);

if (errorsEncountered > 0) {
  process.exit(1);
} else {
  console.log("SUCCESS: All 54 simulated assessments across Classes 3, 4, 5 in en, hi, te completed with ZERO crashes.");
  process.exit(0);
}
