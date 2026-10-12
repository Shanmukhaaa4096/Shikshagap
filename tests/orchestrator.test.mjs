import test from "node:test";
import assert from "node:assert/strict";
import {
  stepAssessment,
  finalizeAssessment,
} from "../src/lib/agents/orchestrator.ts";
import {
  writeReport,
  generateFallbackSummary,
} from "../src/lib/agents/reportWriter.ts";
import { createSessionMemory } from "../src/lib/agents/staircase.ts";

test("Report Writer: Generates accurate fallback summary in en, hi, and te without adding facts", () => {
  const memory = {
    pseudonymousId: "anon_test_writer",
    language: "en",
    grade: 4,
    currentTopicIndex: 0,
    topics: [
      {
        topicId: "number_ops",
        status: "mastered",
        attempts: [],
        notes: [],
      },
      {
        topicId: "multiplication",
        status: "developing",
        attempts: [],
        notes: [],
        misconceptions: ["table_recall_delay"],
      },
      {
        topicId: "division",
        status: "gap",
        attempts: [],
        notes: [],
        misconceptions: ["remainder_greater_than_divisor"],
      },
    ],
  };

  const recs = [
    {
      topicId: "division",
      resources: [
        {
          id: "res_div_01",
          title: "Division as Equal Sharing",
          url: "https://example.com/div",
          source: "Khan Academy",
          type: "video",
          reason: "Targeted division video.",
        },
      ],
    },
  ];

  // English
  const enSummary = generateFallbackSummary({ ...memory, language: "en" }, recs);
  assert.ok(enSummary.includes("Class 4"));
  assert.ok(enSummary.includes("mastery in: Number Operations"));
  assert.ok(enSummary.includes("Needs additional practice in: Multiplication"));
  assert.ok(enSummary.includes("Foundational gaps identified in: Division"));
  assert.ok(enSummary.includes("1 targeted learning resource"));

  // Hindi
  const hiSummary = generateFallbackSummary({ ...memory, language: "hi" }, recs);
  assert.ok(hiSummary.includes("कक्षा 4"));
  assert.ok(hiSummary.includes("संख्या संक्रियाएं"));
  assert.ok(hiSummary.includes("गुणा"));
  assert.ok(hiSummary.includes("भाग"));
  assert.ok(hiSummary.includes("1 अध्ययन सामग्री"));

  // Telugu
  const teSummary = generateFallbackSummary({ ...memory, language: "te" }, recs);
  assert.ok(teSummary.includes("తరగతి 4"));
  assert.ok(teSummary.includes("Mastered"));
  assert.ok(teSummary.includes("గుణకారం"));
  assert.ok(teSummary.includes("భాగహారం"));
  assert.ok(teSummary.includes("1 అధ్యయన వనరులు"));
});

test("Orchestrator E2E: Runs full 4-topic staircase lifecycle with all agents mocked", async () => {
  let memory = createSessionMemory("anon_mock_user", 5, "en", [
    "number_ops",
    "multiplication",
    "division",
    "fractions",
  ]);

  // Mock Examiner client to simulate LLM tool calls
  const mockExaminerClient = {
    models: {
      generateContent: async () => {
        return {
          functionCalls: () => [
            {
              name: "update_memory",
              args: { note: "Observation by Examiner" },
            },
          ],
        };
      },
    },
  };

  // Mock Analyst client
  const mockAnalystClient = {
    models: {
      generateContent: async () => {
        return {
          text: JSON.stringify({
            misconceptions: [
              {
                label: "table_recall",
                explanation: "Delayed recall of multiplication tables observed.",
              },
            ],
          }),
        };
      },
    },
  };

  // Mock Advisor client
  const mockAdvisorClient = {
    models: {
      generateContent: async () => {
        return {
          text: JSON.stringify({
            recommendations: [
              { id: "res_mul_01", reason: "Multiplication practice video." },
            ],
          }),
        };
      },
    },
  };

  // Mock Report client
  const mockReportClient = {
    models: {
      generateContent: async () => {
        return {
          text: "Student achieved mastery in Number Operations, while Multiplication requires additional practice.",
        };
      },
    },
  };

  const options = {
    examinerClient: mockExaminerClient,
    analystClient: mockAnalystClient,
    advisorOptions: { client: mockAdvisorClient },
    reportOptions: { client: mockReportClient },
  };

  // Step 1: Start assessment (starts at Level 2 for Topic 0: number_ops)
  let step = await stepAssessment(memory, undefined, options);
  assert.equal(step.isFinished, false);
  assert.equal(step.action.type, "ask");
  assert.equal(step.action.level, 2);
  memory = step.memory;

  // Answer correctly -> level 3
  step = await stepAssessment(
    memory,
    {
      conceptId: step.action.conceptId,
      level: 2,
      questionId: "q1",
      studentAnswer: "correct",
      correct: true,
    },
    options
  );
  assert.equal(step.action.level, 3);
  memory = step.memory;

  // Answer correctly at 3 -> Topic 0 closes as mastered, moves to Topic 1 at Level 2
  step = await stepAssessment(
    memory,
    {
      conceptId: step.action.conceptId,
      level: 3,
      questionId: "q2",
      studentAnswer: "correct",
      correct: true,
    },
    options
  );
  assert.equal(step.action.type, "ask");
  assert.equal(step.action.topicId, "multiplication");
  assert.equal(step.action.level, 2);
  memory = step.memory;

  // Fail Topic 1 at level 2 -> ask at level 1
  step = await stepAssessment(
    memory,
    {
      conceptId: step.action.conceptId,
      level: 2,
      questionId: "q3",
      studentAnswer: "wrong",
      correct: false,
    },
    options
  );
  assert.equal(step.action.level, 1);
  memory = step.memory;

  // Succeed Topic 1 at level 1 -> closes as developing, Analyst runs
  step = await stepAssessment(
    memory,
    {
      conceptId: step.action.conceptId,
      level: 1,
      questionId: "q4",
      studentAnswer: "correct",
      correct: true,
    },
    options
  );
  assert.equal(step.action.topicId, "division");
  assert.equal(step.action.level, 2);
  const mulTopic = step.memory.topics.find((t) => t.topicId === "multiplication");
  assert.equal(mulTopic?.status, "developing");
  assert.ok(mulTopic?.misconceptions && mulTopic.misconceptions.includes("table_recall"));
  memory = step.memory;

  // Complete Topic 2 (division) -> Fail 2, Fail 1 -> Gap
  step = await stepAssessment(
    memory,
    { conceptId: step.action.conceptId, level: 2, questionId: "q5", studentAnswer: "w", correct: false },
    options
  );
  step = await stepAssessment(
    step.memory,
    { conceptId: step.action.conceptId, level: 1, questionId: "q6", studentAnswer: "w", correct: false },
    options
  );
  assert.equal(step.action.topicId, "fractions");
  const divTopic = step.memory.topics.find((t) => t.topicId === "division");
  assert.equal(divTopic?.status, "gap");

  // Complete Topic 3 (fractions) -> Correct 2, Correct 3 -> Mastered -> FINISH
  step = await stepAssessment(
    step.memory,
    { conceptId: step.action.conceptId, level: 2, questionId: "q7", studentAnswer: "c", correct: true },
    options
  );
  step = await stepAssessment(
    step.memory,
    { conceptId: step.action.conceptId, level: 3, questionId: "q8", studentAnswer: "c", correct: true },
    options
  );

  // Full assessment finished
  assert.equal(step.isFinished, true);
  assert.equal(step.action.type, "finish");
  assert.ok(step.recommendations, "Recommendations must be generated");
  assert.ok(step.recommendations.length > 0, "Remediations provided for gap/dev topics");
  assert.ok(step.summary, "Report summary must be generated");
  assert.ok(step.summary.includes("Mastery") || step.summary.includes("mastery"));
});

test("Orchestrator E2E: Runs full assessment lifecycle with NO GEMINI_API_KEY (pure fallback path)", async () => {
  let memory = createSessionMemory("anon_pure_fallback", 4, "en", [
    "number_ops",
    "multiplication",
    "division",
    "fractions",
  ]);

  // Pass no clients or options (null API key simulation)
  let step = await stepAssessment(memory, undefined, {
    examinerClient: null,
    analystClient: null,
    advisorOptions: { client: null },
    reportOptions: { client: null },
  });

  assert.equal(step.isFinished, false);
  assert.equal(step.action.level, 2);

  // Rapidly drive all 4 topics through deterministic responses
  while (!step.isFinished && step.action.type === "ask") {
    step = await stepAssessment(
      step.memory,
      {
        conceptId: step.action.conceptId,
        level: step.action.level,
        questionId: `q_${Date.now()}`,
        studentAnswer: "ans",
        correct: false, // Fails everything -> all topics become "gap"
      },
      {
        examinerClient: null,
        analystClient: null,
        advisorOptions: { client: null },
        reportOptions: { client: null },
      }
    );
  }

  assert.equal(step.isFinished, true);
  assert.equal(step.action.type, "finish");
  assert.ok(step.recommendations && step.recommendations.length > 0, "Fallback recommendations provided");
  assert.ok(step.summary && step.summary.length > 0, "Fallback summary generated");
  assert.ok(step.summary.includes("Foundational gaps identified in"));
});
