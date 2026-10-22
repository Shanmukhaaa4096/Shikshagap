// scripts/seedQuestionMemory.mjs
/**
 * ShikshaGap Question-Memory Backfill & Seeding Script.
 * Backfills validated questions from the deterministic generator into QuestionStore.
 * Idempotent via fingerprint: duplicate questions are automatically skipped.
 *
 * Usage:
 *   node scripts/seedQuestionMemory.mjs
 *   node scripts/seedQuestionMemory.mjs --wipe  (clears store before seeding)
 */

import { getQuestionStore, embedQuestionText } from "../src/lib/db/questionStore.ts";
import { computeQuestionFingerprint } from "../src/lib/questions/fingerprint.ts";
import { generateUnique } from "../src/lib/questions/generator.ts";
import { validateQuestionStrict } from "../src/lib/questions/validator.ts";
import { makeRng } from "../src/lib/rng.ts";
import { getQuestionText } from "../src/lib/agents/staircase.ts";

const SEED_TARGETS = [
  // Class 3
  { class: 3, board: "CBSE", concepts: ["addition_facts", "subtraction_facts", "multiplication_facts"] },
  { class: 3, board: "ICSE", concepts: ["addition_facts", "subtraction_facts", "multiplication_facts"] },
  // Class 4
  { class: 4, board: "CBSE", concepts: ["mult_2digit_1digit", "division_facts", "fractions_like_add"] },
  { class: 4, board: "ICSE", concepts: ["mult_2digit_1digit", "division_facts", "fractions_like_add"] },
  // Class 5
  { class: 5, board: "CBSE", concepts: ["fractions_unlike_add", "decimals_addition", "area_concept"] },
  { class: 5, board: "ICSE", concepts: ["fractions_unlike_add", "decimals_addition", "area_concept"] },
];

async function runSeed() {
  const isWipeRequested = process.argv.includes("--wipe");
  const store = getQuestionStore();

  console.log("-----------------------------------------------------------------");
  console.log("ShikshaGap Question-Memory Seed & Backfill");
  console.log("-----------------------------------------------------------------");

  if (isWipeRequested) {
    console.log("Option --wipe detected. Clearing existing QuestionStore items...");
    await store.clear();
    console.log("QuestionStore cleared.");
  }

  let totalGenerated = 0;
  let newlyInserted = 0;
  let skippedDuplicates = 0;
  let validationFailures = 0;

  const rng = makeRng(20261022);

  for (const target of SEED_TARGETS) {
    for (const conceptId of target.concepts) {
      for (const difficulty of [1, 2, 3]) {
        for (let sample = 1; sample <= 2; sample++) {
          totalGenerated++;
          try {
            const askedIds = new Set();

            const question = generateUnique(
              conceptId,
              difficulty,
              rng,
              askedIds,
              target.class,
              { board: target.board }
            );

            const valResult = validateQuestionStrict(question, {
              targetLang: "en",
              requireTextbookProvenance: false,
              enrolledGrade: target.class,
              expectedBoard: target.board,
            });

            if (!valResult.valid) {
              validationFailures++;
              continue;
            }

            const questionText = getQuestionText(question, "en");
            const operands = Array.isArray(question.operands) ? question.operands : [];
            const fingerprint = computeQuestionFingerprint(questionText, operands);

            const embedding = await embedQuestionText(questionText, {
              conceptId,
              board: target.board,
            });

            const saveResult = await store.saveQuestion({
              board: target.board,
              class: target.class,
              concept_id: conceptId,
              lang: "en",
              difficulty,
              question_text: questionText,
              answer_value: String(question.answer),
              answer_format: question.format || "short_text",
              template_or_source: "hybrid",
              fingerprint,
              embedding,
            });

            if (saveResult.saved) {
              newlyInserted++;
            } else {
              skippedDuplicates++;
            }
          } catch (err) {
            console.warn(`[Seed Error] Class ${target.class} ${conceptId} L${difficulty}:`, err.message);
          }
        }
      }
    }
  }

  console.log("\n-----------------------------------------------------------------");
  console.log("Seeding Summary:");
  console.log(`Total Candidates Examined: ${totalGenerated}`);
  console.log(`Newly Inserted:            ${newlyInserted}`);
  console.log(`Skipped Duplicates:        ${skippedDuplicates}`);
  console.log(`Validation Failures:       ${validationFailures}`);
  console.log("-----------------------------------------------------------------");
  console.log("Question-Memory seeding complete.");
}

runSeed().catch((err) => {
  console.error("Seeding script failed:", err);
  process.exit(1);
});
