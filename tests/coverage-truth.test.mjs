// tests/coverage-truth.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  CLASS_COVERAGE,
  LIVE_CLASSES,
  COMING_SOON_CLASSES,
  CORE_DAG_CONCEPTS_COUNT,
  TOTAL_LIVE_CLASSES_COUNT,
  isClassLive,
} from "../src/lib/coverage.ts";
import { SUPPORTED_CLASSES } from "../src/lib/curriculum/classes.ts";
import { FAQS } from "../src/data/faqs.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

test("Coverage Truth: Single Source of Truth invariants", () => {
  // Live classes must be exactly 3, 4, 5
  assert.deepEqual(LIVE_CLASSES, [3, 4, 5], "Live classes must be exactly 3, 4, 5");
  assert.deepEqual(COMING_SOON_CLASSES, [1, 2, 6, 7, 8, 9, 10], "Coming soon classes must be 1, 2, 6, 7, 8, 9, 10");
  assert.equal(CORE_DAG_CONCEPTS_COUNT, 15, "Core concepts in DAG must be 15");
  assert.equal(TOTAL_LIVE_CLASSES_COUNT, 3, "Total live classes count must be 3");

  for (const grade of [1, 2, 6, 7, 8, 9, 10]) {
    assert.equal(isClassLive(grade), false, `Grade ${grade} must not be live`);
    assert.equal(CLASS_COVERAGE[grade].status, "coming_soon", `Grade ${grade} must be coming_soon`);
  }

  for (const grade of [3, 4, 5]) {
    assert.equal(isClassLive(grade), true, `Grade ${grade} must be live`);
    assert.equal(CLASS_COVERAGE[grade].status, "live", `Grade ${grade} must be live`);
  }
});

test("Coverage Truth: SUPPORTED_CLASSES enabled state must match coverage.ts", () => {
  for (const cls of SUPPORTED_CLASSES) {
    const expectedLive = isClassLive(cls.grade);
    assert.equal(
      cls.enabled,
      expectedLive,
      `Class ${cls.grade} (${cls.label}) enabled property (${cls.enabled}) must match isClassLive (${expectedLive})`
    );
  }
});

test("Coverage Truth: FAQ covers all 10 classes and matches coverage.ts", () => {
  const classFaq = FAQS.find((f) => f.q.toLowerCase().includes("which classes are supported"));
  assert.ok(classFaq, "FAQ must contain 'Which classes are supported?'");

  // Must mention Classes 3, 4, and 5 as live
  assert.ok(
    classFaq.a.includes("Classes 3, 4, and 5") || classFaq.a.includes("Classes 3 to 5"),
    "FAQ must state Classes 3, 4, and 5 are supported"
  );

  // Must mention all coming soon classes (1, 2, 6, 7, 8, 9, 10)
  for (const grade of [1, 2, 6, 7, 8, 9, 10]) {
    assert.ok(
      classFaq.a.includes(String(grade)),
      `FAQ must explicitly mention Class ${grade} in the status list`
    );
  }
});

test("Coverage Truth: Public files (llms.txt, ai.txt) do not falsely claim non-live classes are live", () => {
  const llmsTxt = fs.readFileSync(path.join(rootDir, "public/llms.txt"), "utf8");
  assert.ok(!llmsTxt.includes("Classes 1 to 10 live"), "llms.txt must not overclaim live classes");

  const aiTxt = fs.readFileSync(path.join(rootDir, "public/ai.txt"), "utf8");
  assert.ok(!aiTxt.includes("Classes 1 to 10 live"), "ai.txt must not overclaim live classes");
});
