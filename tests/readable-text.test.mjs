import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(...walk(full));
    } else if (file.endsWith(".tsx") || file.endsWith(".ts") || file.endsWith(".jsx") || file.endsWith(".js")) {
      results.push(full);
    }
  }
  return results;
}

test("Step 2 Typography Invariant: No text-[Npx] with N < 12 exists in src", () => {
  const srcDir = path.resolve(process.cwd(), "src");
  const files = walk(srcDir);
  const violations = [];

  for (const f of files) {
    const content = fs.readFileSync(f, "utf8");
    const matches = content.match(/text-\[(\d+)px\]/g);
    if (matches) {
      for (const m of matches) {
        const px = parseInt(m.match(/\d+/)[0], 10);
        if (px < 12) {
          violations.push({ file: path.relative(process.cwd(), f), match: m, px });
        }
      }
    }
  }

  assert.equal(
    violations.length,
    0,
    `Found font sizes below 12px: ${JSON.stringify(violations, null, 2)}`
  );
});

test("Step 2 Student Assessment Typography: prompt is >= 22px and options are >= 18px", () => {
  const assessmentFile = path.resolve(process.cwd(), "src/components/AdaptiveAssessmentView.tsx");
  const content = fs.readFileSync(assessmentFile, "utf8");
  
  // Prompt text must have >= 22px
  assert.ok(
    content.includes("text-[22px]") || content.includes("text-2xl"),
    "AdaptiveAssessmentView prompt text must be at least 22px"
  );

  // Options must have >= 18px
  assert.ok(
    content.includes("text-[18px]") || content.includes("text-lg") || content.includes("text-xl"),
    "AdaptiveAssessmentView option buttons must be at least 18px"
  );
});
