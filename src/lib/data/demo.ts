/**
 * ShikshaGap Demo Dataset
 * 36 realistic Class 5A students in PM SHRI Govt Primary School, Hyderabad.
 * Diverse profiles demonstrating varying learning gap topologies.
 */
import type {
  Classroom,
  ConceptId,
  MasteryEstimate,
  RemediationPlan,
  RootCause,
  Student,
  StudentProfile,
} from "@/lib/types";
import { generateRemediationPlan } from "@/lib/engine/remediation";

export const DEMO_CLASSROOM: Classroom = {
  id: "class_5a",
  name: "Class 5 - Section A (Maths)",
  grade: 5,
  section: "A",
  subjectId: "math",
  isDemo: true,
};

export interface DemoStudentData {
  student: Student;
  profile: StudentProfile;
  activePlan?: RemediationPlan;
}

const RAW_STUDENTS = [
  { roll: 1, name: "Ravi Kumar", status: "critical", rootId: "mult_facts", symptoms: ["division_facts", "long_division"] },
  { roll: 2, name: "Sita Devi", status: "critical", rootId: "subtraction", symptoms: ["long_division"] },
  { roll: 3, name: "Mohammed Imran", status: "critical", rootId: "comparing_fractions", symptoms: ["fraction_addition"] },
  { roll: 4, name: "Ananya Reddy", status: "on_track", rootId: null, symptoms: [] },
  { roll: 5, name: "Rahul Sharma", status: "critical", rootId: "place_value", symptoms: ["multi_digit_mult", "addition"] },
  { roll: 6, name: "Lakshmi Bai", status: "need_practice", rootId: "division_concept", symptoms: ["fraction_basics"] },
  { roll: 7, name: "Arjun Patel", status: "need_practice", rootId: "mult_facts", symptoms: ["multi_digit_mult"] },
  { roll: 8, name: "Priya Nair", status: "critical", rootId: "division_facts", symptoms: ["division_word", "long_division"] },
  { roll: 9, name: "Vikram Singh", status: "on_track", rootId: null, symptoms: [] },
  { roll: 10, name: "Deepa Rao", status: "need_practice", rootId: "place_value", symptoms: ["subtraction"] },
  { roll: 11, name: "Kavita Meena", status: "on_track", rootId: null, symptoms: [] },
  { roll: 12, name: "Ganesh Naik", status: "critical", rootId: "mult_concept", symptoms: ["mult_facts", "division_facts"] },
  { roll: 13, name: "Zoya Fatima", status: "on_track", rootId: null, symptoms: [] },
  { roll: 14, name: "Karthik Varma", status: "need_practice", rootId: "fraction_basics", symptoms: ["equivalent_fractions"] },
  { roll: 15, name: "Divya Teja", status: "on_track", rootId: null, symptoms: [] },
  { roll: 16, name: "Manoj Yadav", status: "need_practice", rootId: "addition", symptoms: ["mult_concept"] },
  { roll: 17, name: "Sunita Goud", status: "critical", rootId: "number_sense", symptoms: ["place_value", "addition"] },
  { roll: 18, name: "Aditya Das", status: "on_track", rootId: null, symptoms: [] },
  { roll: 19, name: "Pooja Hegde", status: "need_practice", rootId: "equivalent_fractions", symptoms: ["comparing_fractions"] },
  { roll: 20, name: "Salman Baig", status: "on_track", rootId: null, symptoms: [] },
  { roll: 21, name: "Keerthi Suresh", status: "on_track", rootId: null, symptoms: [] },
  { roll: 22, name: "Harish Chandra", status: "need_practice", rootId: "mult_facts", symptoms: ["division_facts"] },
  { roll: 23, name: "Nandini Gowda", status: "on_track", rootId: null, symptoms: [] },
  { roll: 24, name: "Suresh Raina", status: "need_practice", rootId: "division_facts", symptoms: ["long_division"] },
  { roll: 25, name: "Bhavana Chary", status: "on_track", rootId: null, symptoms: [] },
  { roll: 26, name: "Naveen Polishetty", status: "on_track", rootId: null, symptoms: [] },
  { roll: 27, name: "Sandhya Rani", status: "critical", rootId: "subtraction", symptoms: ["long_division"] },
  { roll: 28, name: "Prashanth Neel", status: "on_track", rootId: null, symptoms: [] },
  { roll: 29, name: "Ayesha Siddiqua", status: "need_practice", rootId: "fraction_basics", symptoms: ["fraction_addition"] },
  { roll: 30, name: "Varun Tej", status: "on_track", rootId: null, symptoms: [] },
  { roll: 31, name: "Meenakshi S", status: "on_track", rootId: null, symptoms: [] },
  { roll: 32, name: "Shravan Kumar", status: "need_practice", rootId: "place_value", symptoms: ["addition"] },
  { roll: 33, name: "Pallavi Prashanth", status: "on_track", rootId: null, symptoms: [] },
  { roll: 34, name: "Tarun Bhaskar", status: "on_track", rootId: null, symptoms: [] },
  { roll: 35, name: "Sneha Reddy", status: "on_track", rootId: null, symptoms: [] },
  { roll: 36, name: "Vamsi Paidipally", status: "on_track", rootId: null, symptoms: [] },
];

function buildConceptsMap(status: string, rootId: ConceptId | null, roll: number): Partial<Record<ConceptId, MasteryEstimate>> {
  const allConcepts: ConceptId[] = [
    "number_sense", "place_value", "addition", "subtraction",
    "mult_concept", "mult_facts", "multi_digit_mult",
    "division_concept", "division_facts", "long_division", "division_word",
    "fraction_basics", "equivalent_fractions", "comparing_fractions", "fraction_addition",
  ];

  const map: Partial<Record<ConceptId, MasteryEstimate>> = {};

  allConcepts.forEach((cid, idx) => {
    let mastery = 0.85;
    let st: any = "mastered";

    const variance = ((roll * 17 + idx * 23) % 15) / 100;

    if (status === "on_track") {
      mastery = 0.82 + variance;
      st = "mastered";
    } else if (cid === rootId) {
      mastery = status === "critical" ? 0.32 : 0.52;
      st = status === "critical" ? "needs_support" : "developing";
    } else if (status === "critical" && (roll + idx) % 3 === 0) {
      mastery = 0.45;
      st = "needs_support";
    } else {
      mastery = 0.70 + variance;
      st = mastery >= 0.75 ? "mastered" : "developing";
    }

    map[cid] = {
      conceptId: cid,
      alpha: Math.round(mastery * 10),
      beta: Math.round((1 - mastery) * 10),
      attempts: 4,
      correct: Math.round(mastery * 4),
      mastery: Math.round(mastery * 100) / 100,
      confidence: 0.88,
      status: st,
      lastUpdated: "2026-10-06T10:30:00Z",
    };
  });

  return map;
}

export function initializeDemoData(): DemoStudentData[] {
  return RAW_STUDENTS.map((item) => {
    const sId = `student_${item.roll}`;
    const concepts = buildConceptsMap(item.status, item.rootId as ConceptId | null, item.roll);

    const strong: ConceptId[] = [];
    const developing: ConceptId[] = [];
    const needsSupport: ConceptId[] = [];

    Object.entries(concepts).forEach(([cid, est]) => {
      if (!est) return;
      if (est.status === "mastered") strong.push(cid as ConceptId);
      else if (est.status === "developing") developing.push(cid as ConceptId);
      else if (est.status === "needs_support") needsSupport.push(cid as ConceptId);
    });

    const rootCauses: RootCause[] = [];
    let activePlan: RemediationPlan | undefined;

    if (item.rootId) {
      const rootId = item.rootId as ConceptId;
      const symptoms = (item.symptoms || [rootId]) as ConceptId[];
      const rc: RootCause = {
        rootId,
        symptomIds: symptoms,
        chain: [symptoms[0] || rootId, rootId],
        severity: item.status === "critical" ? "high" : "medium",
        confidence: 0.88,
        rootMastery: item.status === "critical" ? 0.35 : 0.54,
        uncheckedPrereqs: [],
        isSelfRoot: symptoms.includes(rootId),
        evidence: [
          {
            questionId: `ev_${item.roll}_1`,
            conceptId: rootId,
            prompt: { key: `q.${rootId}` as any },
            answer: "Wrong Answer",
            correctAnswer: "Correct Answer",
            correct: false,
            classification: "regrouping",
          },
        ],
        misconceptions: ["regrouping", "place_value"],
        priority: item.status === "critical" ? 1 : 2,
      };

      rootCauses.push(rc);
      activePlan = generateRemediationPlan(sId, rc);
    }

    const overallMastery = Math.round(
      (Object.values(concepts).reduce((sum, c) => sum + (c?.mastery || 0), 0) /
        Object.keys(concepts).length) *
        100
    );

    const profile: StudentProfile = {
      studentId: sId,
      status: item.status as any,
      overallMastery: overallMastery / 100,
      confidence: 0.85,
      concepts,
      strong,
      developing,
      needsSupport,
      inferredOk: [],
      rootCauses,
      nextConcept: item.rootId as ConceptId | null,
      nextReason: item.rootId ? "root_cause" : "none",
      evidenceCount: 12,
      lastAssessedAt: "2026-10-06T10:30:00Z",
      lastTopic: "division",
    };

    const student: Student = {
      id: sId,
      name: item.name,
      rollNo: item.roll,
      classroomId: DEMO_CLASSROOM.id,
      isDemo: true,
    };

    return {
      student,
      profile,
      activePlan,
    };
  });
}

const STORAGE_KEY = "shikshagap_students_v1";

export function loadStudents(): DemoStudentData[] {
  if (typeof window === "undefined") {
    return initializeDemoData();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  const fresh = initializeDemoData();
  saveStudents(fresh);
  return fresh;
}

export function saveStudents(data: DemoStudentData[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function resetDemoData(): DemoStudentData[] {
  const fresh = initializeDemoData();
  saveStudents(fresh);
  return fresh;
}
