import test from "node:test";
import assert from "node:assert/strict";
import { generateQuestion } from "../src/lib/questions/generator.ts";
import {
  enhanceQuestionWithHybridWording,
  extractQuestionOperands,
  pickRuntimeTheme,
  RUNTIME_THEMES,
} from "../src/lib/questions/hybridGenerator.ts";
import { SUPPORTED_CLASSES } from "../src/lib/curriculum/classes.ts";

function createMockGeminiClient(wordingGenerator) {
  return {
    models: {
      generateContent: async (args) => {
        const text = args.contents?.[0]?.parts?.[0]?.text || "";
        if (text.includes("Question:")) {
          return {
            text: JSON.stringify({
              wordProblem: "legacy mock response",
            }),
          };
        }
        const generated = wordingGenerator(args);
        return {
          text: JSON.stringify({
            wordProblem: generated,
            scenarioTopic: "local weekly market",
          }),
        };
      },
    },
  };
}

test("Step 5: Runtime themes picker returns valid themes", () => {
  const theme = pickRuntimeTheme();
  assert.ok(RUNTIME_THEMES.includes(theme), `Theme '${theme}' should be in RUNTIME_THEMES`);
});

test("Step 5: Operand extraction supports all concept types", () => {
  for (const cls of SUPPORTED_CLASSES.filter((c) => c.enabled)) {
    for (const conceptId of cls.targetConcepts) {
      for (const diff of [1, 2, 3]) {
        const q = generateQuestion(conceptId, diff, Math.random, cls.grade);
        const extracted = extractQuestionOperands(q);
        assert.ok(
          extracted.isEligibleForWordProblem,
          `Concept ${conceptId} in grade ${cls.grade} diff ${diff} should be eligible for word problem`
        );
        assert.ok(
          extracted.operands.length > 0,
          `Concept ${conceptId} should have at least 1 extracted operand`
        );
      }
    }
  }
});

test("Step 5: Hybrid wording generation works for newly added Class 3 concepts with mocked Gemini", async () => {
  const c3Concepts = ["addition_3digit", "subtraction_3digit", "division_sharing", "money_math"];

  for (const conceptId of c3Concepts) {
    const baseQ = generateQuestion(conceptId, 2, Math.random, 3);
    const operands = extractQuestionOperands(baseQ).operands;

    let receivedInstruction = "";
    const mockClient = createMockGeminiClient((args) => {
      receivedInstruction = args.contents?.[0]?.parts?.[0]?.text || "";
      if (operands.length >= 2) {
        return `At the haat, a shopkeeper counts ${operands[0]} items and finds ${operands[1]} more. What is the total?`;
      }
      return `At the haat, a shopkeeper has ${operands[0]} coins. How many are left?`;
    });

    const seen = new Set(["Previous question in session"]);
    const enhanced = await enhanceQuestionWithHybridWording(
      baseQ,
      "en",
      3,
      seen,
      { client: mockClient }
    );

    // Prompt checks
    assert.ok(
      receivedInstruction.includes("Learning Outcome:"),
      "System instruction should include concept Learning Outcome"
    );
    assert.ok(
      receivedInstruction.includes("Target Number Range:"),
      "System instruction should include Target Number Range"
    );
    assert.ok(
      receivedInstruction.includes("Theme:"),
      "System instruction should include runtime theme"
    );
    assert.ok(
      receivedInstruction.includes("Previous question in session"),
      "System instruction should include session question history"
    );

    // Enhanced question checks
    assert.equal(enhanced.conceptId, baseQ.conceptId);
    assert.equal(enhanced.answer, baseQ.answer);
    assert.deepEqual(enhanced.options, baseQ.options);
    assert.equal(enhanced.format, baseQ.format);
    assert.ok(
      enhanced.prompt.raw.includes(String(operands[0])),
      `Enhanced question should include operand ${operands[0]}`
    );
  }
});

test("Step 5: Diagram questions keep their visual and get worded sentence from Gemini", async () => {
  const baseQ = generateQuestion("fraction_basics", 1, Math.random, 4);
  assert.ok(baseQ.visual, "fraction_basics difficulty 1 should have a visual diagram");
  const origVisual = { ...baseQ.visual };

  const operands = extractQuestionOperands(baseQ).operands;
  const mockClient = createMockGeminiClient((args) => {
    const text = args.contents?.[0]?.parts?.[0]?.text || "";
    assert.ok(
      text.includes("visual diagram"),
      "System instruction should note the visual diagram"
    );
    return `Look at the strip where ${operands[0]} parts out of ${operands[1]} parts are shaded. What fraction is shaded?`;
  });

  const seen = new Set();
  const enhanced = await enhanceQuestionWithHybridWording(
    baseQ,
    "en",
    4,
    seen,
    { client: mockClient }
  );

  assert.ok(enhanced.visual, "Enhanced diagram question must retain its visual");
  assert.deepEqual(enhanced.visual, origVisual, "Visual diagram structure must remain unchanged");
  assert.equal(enhanced.answer, baseQ.answer);
  assert.deepEqual(enhanced.options, baseQ.options);
});

test("Step 5: Multilingual generation passes language requirement to prompt", async () => {
  for (const lang of ["hi", "te"]) {
    const baseQ = generateQuestion("addition", 1, Math.random, 3);
    const operands = extractQuestionOperands(baseQ).operands;

    let receivedLangInstruction = "";
    const mockClient = createMockGeminiClient((args) => {
      receivedLangInstruction = args.contents?.[0]?.parts?.[0]?.text || "";
      if (lang === "hi") {
        return `एक माली के पास ${operands[0]} फूल हैं और उसने ${operands[1]} और लगाए। कुल कितने फूल हुए?`;
      }
      return `ఒక తోటమాలి వద్ద ${operands[0]} పువ్వులు ఉన్నాయి మరియు అతను ${operands[1]} పువ్వులు తీసుకున్నాడు. మొత్తం ఎన్ని?`;
    });

    const seen = new Set();
    const enhanced = await enhanceQuestionWithHybridWording(
      baseQ,
      lang,
      3,
      seen,
      { client: mockClient }
    );
    assert.ok(
      receivedLangInstruction.includes(lang === "hi" ? "Hindi (हिंदी)" : "Telugu (తెలుగు)"),
      "Prompt must specify the exact target language and script"
    );
    assert.equal(enhanced.answer, baseQ.answer);
  }
});
