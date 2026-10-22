import test from "node:test";
import assert from "node:assert/strict";
import { getSampleReportData } from "../src/lib/data/sampleReportData.ts";
import fs from "node:fs";
import path from "node:path";

test("Goal 5 & 6: Sample Report and Worksheet Consistency", async (t) => {
  const data = getSampleReportData();

  await t.test("Placeholder student identity is obviously fictional", () => {
    assert.equal(data.student.name, "Sample Student");
    assert.equal(data.student.rollNo, "Roll #00");
    assert.match(data.student.badge, /Sample data\. Not a real student\./);
  });

  await t.test("Backtracking trail includes the diagnosed root cause node", () => {
    const rootId = data.diagnosedRootCause.conceptId;
    const found = data.backtrackingTrail.some(
      (node) => node.id === rootId && node.isRootCause
    );
    assert.ok(
      found,
      `Backtracking trail must include diagnosed root cause concept '${rootId}'`
    );
  });

  await t.test("Worksheet questions test the diagnosed root cause target skill", () => {
    assert.equal(
      data.sampleWorksheet.targetSkillId,
      data.diagnosedRootCause.conceptId,
      "Worksheet targetSkillId must match diagnosedRootCause conceptId"
    );

    // Expressions must test subtraction (contain subtraction operator '-' or '−')
    assert.match(
      data.sampleWorksheet.q1.expression,
      /[-−]/,
      "Question 1 expression must be a subtraction problem"
    );
    assert.match(
      data.sampleWorksheet.q2.expression,
      /[-−]/,
      "Question 2 expression must be a subtraction problem"
    );
  });

  await t.test("Worksheet claims generated-and-verified-by-code and removes deterministic bank claim", () => {
    assert.match(
      data.sampleWorksheet.footerClaim,
      /Generated and verified by code/
    );
    assert.doesNotMatch(
      data.sampleWorksheet.footerClaim,
      /Deterministic Question Bank/i
    );
  });

  await t.test("LandingHowAgentWorksSection rendered component contains consistent data", () => {
    const componentPath = path.resolve(
      "src/components/landing/LandingHowAgentWorksSection.tsx"
    );
    const source = fs.readFileSync(componentPath, "utf-8");

    // Must not have hardcoded realistic names
    assert.doesNotMatch(source, /Rajesh Kumar/);
    assert.doesNotMatch(source, /Roll #7/);
    assert.doesNotMatch(source, /Deterministic Question Bank/);

    // Must import from sampleReportData
    assert.match(source, /getSampleReportData/);
  });
});
