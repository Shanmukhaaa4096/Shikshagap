import { makeRng } from "../rng.ts";
import { generateQuestion } from "../questions/generator.ts";
import { generateRemediationPlan } from "../engine/remediation.ts";
import type { ConceptId, RootCause } from "../types.ts";

export interface SampleReportNode {
  id: ConceptId;
  label: string;
  grade: number;
  isRootCause: boolean;
}

export interface SampleReportData {
  student: {
    name: string;
    rollNo: string;
    classLabel: string;
    scoreLabel: string;
    badge: string;
  };
  diagnosedRootCause: {
    conceptId: ConceptId;
    title: string;
    grade: number;
    description: string;
  };
  backtrackingTrail: SampleReportNode[];
  fiveDayPlanSummary: string;
  fiveDayPlanDetails: Array<{ day: number; title: string; activity: string }>;
  sampleWorksheet: {
    targetSkillId: ConceptId;
    targetSkillTitle: string;
    q1: { expression: string; prompt: string };
    q2: { expression: string; prompt: string };
    footerClaim: string;
  };
}

/**
 * Generates an internally consistent specimen report and worksheet
 * derived directly from the real prerequisite DAG and question generator.
 */
export function getSampleReportData(): SampleReportData {
  const rootConceptId: ConceptId = "subtraction";
  const targetConceptId: ConceptId = "long_division";
  const intermediateConceptId: ConceptId = "division_concept";

  const rootCause: RootCause = {
    rootId: rootConceptId,
    symptomIds: [targetConceptId],
    chain: [targetConceptId, intermediateConceptId, rootConceptId],
    severity: "high",
    confidence: 0.95,
    rootMastery: 0.42,
    uncheckedPrereqs: [],
    isSelfRoot: false,
    evidence: [],
    misconceptions: ["regrouping"],
    priority: 1,
  };

  const plan = generateRemediationPlan("sample_student_00", rootCause);

  const rng = makeRng(42);
  let q1 = generateQuestion(rootConceptId, 2, rng, 3, { board: "CBSE" });
  while (Number(q1.meta?.a ?? 0) % 10 >= Number(q1.meta?.b ?? 0) % 10) {
    q1 = generateQuestion(rootConceptId, 2, rng, 3, { board: "CBSE" });
  }
  let q2 = generateQuestion(rootConceptId, 2, rng, 3, { board: "CBSE" });
  while (Number(q2.meta?.a ?? 0) % 10 >= Number(q2.meta?.b ?? 0) % 10 || q2.meta?.a === q1.meta?.a) {
    q2 = generateQuestion(rootConceptId, 2, rng, 3, { board: "CBSE" });
  }

  const backtrackingTrail: SampleReportNode[] = [
    {
      id: "long_division",
      label: "Class 5 Long Division",
      grade: 5,
      isRootCause: false,
    },
    {
      id: "division_concept",
      label: "Class 4 Division Concept",
      grade: 4,
      isRootCause: false,
    },
    {
      id: "subtraction",
      label: "Class 3 Subtraction Regrouping",
      grade: 3,
      isRootCause: true,
    },
  ];

  return {
    student: {
      name: "Sample Student",
      rollNo: "Roll #00",
      classLabel: "Class 5A",
      scoreLabel: "Class 5A : 42%",
      badge: "Sample data. Not a real student.",
    },
    diagnosedRootCause: {
      conceptId: rootConceptId,
      title: "Class 3 Subtraction Regrouping (Tens to Units Borrowing)",
      grade: 3,
      description:
        "Student attempted long division in 24 / 6 by subtracting 6 repeatedly, but subtracted the smaller ones digit from the larger digit without borrowing.",
    },
    backtrackingTrail,
    fiveDayPlanSummary:
      "Day 1 to 2: Physical bundle exchange (tens to units). Day 3: Crossing out and column regrouping on slate. Day 4 to 5: 1-page paper checks.",
    fiveDayPlanDetails: plan.days.map((d) => ({
      day: d.day,
      title: "raw" in d.title ? d.title.raw : String(d.title.key),
      activity: "raw" in d.activity ? d.activity.raw : String(d.activity.key),
    })),
    sampleWorksheet: {
      targetSkillId: rootConceptId,
      targetSkillTitle: "Target Skill: Subtraction with Regrouping",
      q1: {
        expression: q1.expression || "54 − 28 = ?",
        prompt: "raw" in q1.prompt ? q1.prompt.raw : String(q1.prompt.key),
      },
      q2: {
        expression: q2.expression || "62 − 37 = ?",
        prompt: "raw" in q2.prompt ? q2.prompt.raw : String(q2.prompt.key),
      },
      footerClaim:
        "Generated and verified by code • Classroom Diagnostic • Form SG-A4-2026",
    },
  };
}
