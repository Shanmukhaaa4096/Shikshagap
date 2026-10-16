import { validateCurriculumGraph } from "../src/data/curriculum/index.ts";

console.log("=================================================");
console.log("ShikshaGap Curriculum Graph Validation (Classes 1 - 10)");
console.log("=================================================");

const result = validateCurriculumGraph();

console.log(`Total Concepts Registered: ${result.totalConcepts}`);
console.log(`Total Prerequisite Edges:  ${result.totalPrerequisiteEdges}`);

if (!result.valid) {
  console.error("FAIL: Curriculum graph has validation errors:");
  if (result.missingPrereqs.length > 0) {
    console.error("\n[Missing Prerequisites]:");
    result.missingPrereqs.forEach((err) => console.error("  - " + err));
  }
  if (result.cycles.length > 0) {
    console.error("\n[Cycles Detected]:");
    result.cycles.forEach((c) => console.error("  - " + c.join(" -> ")));
  }
  if (result.invalidTranslations.length > 0) {
    console.error("\n[Incomplete Translations]:");
    result.invalidTranslations.forEach((id) => console.error("  - " + id));
  }
  process.exit(1);
} else {
  console.log("\nPASS: Concept graph is strictly ACYCLIC (DAG).");
  console.log("PASS: 100% of prerequisite IDs exist in the curriculum registry.");
  console.log("PASS: 100% of concepts have complete English, Hindi, and Telugu names.");
  console.log("=================================================");
  process.exit(0);
}
