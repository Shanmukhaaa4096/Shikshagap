/**
 * scripts/generateTeacherSamples.mjs
 *
 * Generates 5 sample questions per class (3, 4, 5) per language (en, hi, te)
 * using the enhanced generator and skill sheets.
 * Resolves Txt translation objects using DICTS.
 */

import { generateQuestion } from "../src/lib/questions/generator.ts";
import { getClassConfig } from "../src/lib/curriculum/classes.ts";
import { makeRng } from "../src/lib/rng.ts";
import { DICTS } from "../src/lib/i18n/dict.ts";

const grades = [3, 4, 5];
const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi (हिंदी)" },
  { code: "te", name: "Telugu (తెలుగు)" },
];

function formatTxt(txt, lang) {
  if (!txt) return "";
  if (typeof txt === "string") return txt;
  if ("raw" in txt && txt.raw) return txt.raw;
  if ("key" in txt && txt.key) {
    const dict = DICTS[lang] || DICTS.en;
    let str = dict[txt.key] || DICTS.en[txt.key] || txt.key;
    if (txt.params) {
      for (const [k, v] of Object.entries(txt.params)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  }
  if (txt[lang]) return txt[lang];
  if (txt.en) return txt.en;
  return "";
}

let mdOutput = "### Samples for teacher review\n\n";
mdOutput += "> [!NOTE]\n";
mdOutput += "> No Gemini API key was present in `.env.local`. Samples below were generated using the curriculum question engine with skill sheet number ranges and multilingual wording across Classes 3, 4, and 5 in English, Hindi, and Telugu.\n\n";

for (const grade of grades) {
  mdOutput += `#### Class ${grade} Questions\n\n`;
  const config = getClassConfig(grade);
  const concepts = config.targetConcepts;

  for (const lang of languages) {
    mdOutput += `**${lang.name} (Class ${grade})**\n\n`;
    const rng = makeRng(2026 + grade * 100 + (lang.code === "hi" ? 10 : lang.code === "te" ? 20 : 0));

    for (let i = 0; i < 5; i++) {
      const conceptId = concepts[i % concepts.length];
      const difficulty = ((i % 3) + 1);
      const q = generateQuestion(conceptId, difficulty, rng, grade);

      let promptText = formatTxt(q.prompt, lang.code);
      if (!promptText && q.expression) {
        promptText = lang.code === "hi" ? `हल कीजिए: ${q.expression}` : lang.code === "te" ? `సాధించండి: ${q.expression}` : `Solve: ${q.expression}`;
      }

      const optionsText = (q.options || [])
        .map((opt) => formatTxt(opt.label, lang.code) || opt.value)
        .join(", ");

      mdOutput += `${i + 1}. **Concept**: \`${conceptId}\` (Level ${difficulty})\n`;
      mdOutput += `   - **Question**: ${promptText}\n`;
      if (q.expression) {
        mdOutput += `   - **Expression**: \`${q.expression}\`\n`;
      }
      mdOutput += `   - **Correct Answer**: \`${q.answer}\`\n`;
      if (optionsText) {
        mdOutput += `   - **Options**: [ ${optionsText} ]\n`;
      }
      mdOutput += `\n`;
    }
  }
}

console.log(mdOutput);
