import { generateQuestion, generateQuestionWithVariety } from "../src/lib/questions/generator.ts";
import { makeRng } from "../src/lib/rng.ts";
import { normalizeAnswer } from "../src/lib/questions/hybridGenerator.ts";

const concepts = [
  "number_sense", "place_value", "addition", "subtraction",
  "mult_concept", "mult_facts", "multi_digit_mult",
  "division_concept", "division_facts", "long_division", "division_word",
  "fraction_basics", "equivalent_fractions", "comparing_fractions", "fraction_addition",
  "addition_3digit", "subtraction_3digit", "division_sharing", "money_math"
];

let totalGen = 0;
let errorsGen = [];

for (const concept of concepts) {
  for (const diff of [1, 2, 3]) {
    for (const grade of [3, 4, 5]) {
      for (let seed = 1; seed <= 50; seed++) {
        totalGen++;
        const rng = makeRng(seed * 1000 + diff * 10 + grade);
        try {
          const q = generateQuestion(concept, diff, rng, grade);
          const normAns = normalizeAnswer(q.answer);

          if (!normAns && normAns !== "0") {
            errorsGen.push({ type: "empty_answer", concept, diff, grade, seed, answer: q.answer });
          }

          if (q.options && q.options.length > 0) {
            const normOpts = q.options.map((o) => normalizeAnswer(o.value));
            const matchCount = normOpts.filter((v) => v === normAns).length;
            if (matchCount !== 1) {
              errorsGen.push({
                type: "mcq_answer_match_count",
                count: matchCount,
                concept,
                diff,
                grade,
                seed,
                normAns,
                normOpts,
                q
              });
            }
            const uniqueOpts = new Set(normOpts);
            if (uniqueOpts.size !== normOpts.length) {
              errorsGen.push({
                type: "duplicate_options",
                concept,
                diff,
                grade,
                seed,
                normOpts,
                q
              });
            }
          }
        } catch (err) {
          errorsGen.push({ type: "exception", concept, diff, grade, seed, error: String(err) });
        }
      }
    }
  }
}

console.log(`[generateQuestion] Tested: ${totalGen}, Errors: ${errorsGen.length}`);
if (errorsGen.length > 0) {
  console.log("Sample errors from generateQuestion:");
  console.log(JSON.stringify(errorsGen.slice(0, 5), null, 2));
}

let totalVariety = 0;
let errorsVariety = [];

for (const concept of concepts) {
  for (const diff of [1, 2, 3]) {
    for (const grade of [3, 4, 5]) {
      for (let seed = 1; seed <= 50; seed++) {
        totalVariety++;
        const rng = makeRng(seed * 777 + diff * 5 + grade);
        try {
          const q = generateQuestionWithVariety(concept, diff, rng, grade);
          const normAns = normalizeAnswer(q.answer);

          if (!normAns && normAns !== "0") {
            errorsVariety.push({ type: "empty_answer", concept, diff, grade, seed, answer: q.answer, format: q.format });
          }

          if (q.options && q.options.length > 0) {
            const normOpts = q.options.map((o) => normalizeAnswer(o.value));
            const matchCount = normOpts.filter((v) => v === normAns).length;
            if (matchCount !== 1) {
              errorsVariety.push({
                type: "variety_mcq_answer_match_count",
                count: matchCount,
                concept,
                diff,
                grade,
                seed,
                format: q.format,
                normAns,
                normOpts,
                prompt: q.prompt,
                expression: q.expression
              });
            }
            const uniqueOpts = new Set(normOpts);
            if (uniqueOpts.size !== normOpts.length) {
              errorsVariety.push({
                type: "variety_duplicate_options",
                concept,
                diff,
                grade,
                seed,
                format: q.format,
                normOpts
              });
            }
          }
        } catch (err) {
          errorsVariety.push({ type: "exception", concept, diff, grade, seed, error: String(err) });
        }
      }
    }
  }
}

console.log(`[generateQuestionWithVariety] Tested: ${totalVariety}, Errors: ${errorsVariety.length}`);
if (errorsVariety.length > 0) {
  console.log("Sample errors from generateQuestionWithVariety:");
  console.log(JSON.stringify(errorsVariety.slice(0, 10), null, 2));
}
