/**
 * ShikshaGap Demo Dataset
 * Realistic student cohorts for Class 3A, 4A, and 5A.
 * Clearly marked as Demo data.
 */
import type {
  Classroom,
  ConceptId,
  MasteryEstimate,
  MasteryStatus,
  RemediationPlan,
  RootCause,
  Student,
  StudentProfile,
  StudentStatus,
} from "@/lib/types";
import { generateRemediationPlan } from "@/lib/engine/remediation";
import { getClassConfig, DEFAULT_CLASS_ID } from "@/lib/curriculum/classes";

export const SCHOOL_NAME = "Government Primary School, Hyderabad";

export function getDemoClassroom(classId: string = DEFAULT_CLASS_ID): Classroom {
  const conf = getClassConfig(classId);
  return {
    id: conf.id,
    name: `${conf.label} - Section ${conf.section} (Maths)`,
    grade: conf.grade,
    section: conf.section,
    subjectId: "math",
    isDemo: true,
  };
}

export const DEMO_CLASSROOM: Classroom = getDemoClassroom(DEFAULT_CLASS_ID);

export interface DemoStudentData {
  student: Student;
  profile: StudentProfile;
  activePlan?: RemediationPlan;
}

// Class 5A (36 students)
const RAW_STUDENTS_CLASS_5 = [
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
  { roll: 27, name: "Swathi Reddy", status: "need_practice", rootId: "comparing_fractions", symptoms: ["fraction_addition"] },
  { roll: 28, name: "Kiran Abbavaram", status: "on_track", rootId: null, symptoms: [] },
  { roll: 29, name: "Rashmika Mandanna", status: "on_track", rootId: null, symptoms: [] },
  { roll: 30, name: "Vijay Deverakonda", status: "need_practice", rootId: "mult_facts", symptoms: ["multi_digit_mult"] },
  { roll: 31, name: "Samantha Ruth", status: "critical", rootId: "subtraction", symptoms: ["long_division"] },
  { roll: 32, name: "Allu Arjun", status: "on_track", rootId: null, symptoms: [] },
  { roll: 33, name: "Ram Charan", status: "on_track", rootId: null, symptoms: [] },
  { roll: 34, name: "NTR Junior", status: "need_practice", rootId: "fraction_basics", symptoms: ["comparing_fractions"] },
  { roll: 35, name: "Prabhas Raju", status: "on_track", rootId: null, symptoms: [] },
  { roll: 36, name: "Vamsi Paidipally", status: "on_track", rootId: null, symptoms: [] },
];

// Class 4A (34 students)
const RAW_STUDENTS_CLASS_4 = [
  { roll: 1, name: "Aarav Sharma", status: "critical", rootId: "subtraction", symptoms: ["division_concept"] },
  { roll: 2, name: "Ishaan Reddy", status: "on_track", rootId: null, symptoms: [] },
  { roll: 3, name: "Ananya Iyer", status: "need_practice", rootId: "place_value", symptoms: ["addition"] },
  { roll: 4, name: "Diya Nair", status: "on_track", rootId: null, symptoms: [] },
  { roll: 5, name: "Sai Praneeth", status: "critical", rootId: "mult_concept", symptoms: ["mult_facts"] },
  { roll: 6, name: "Tanvi Rao", status: "need_practice", rootId: "mult_concept", symptoms: ["division_concept"] },
  { roll: 7, name: "Manish Kumar", status: "on_track", rootId: null, symptoms: [] },
  { roll: 8, name: "Bhavya Sri", status: "critical", rootId: "number_sense", symptoms: ["place_value"] },
  { roll: 9, name: "Rohit Varma", status: "on_track", rootId: null, symptoms: [] },
  { roll: 10, name: "Meera Bai", status: "need_practice", rootId: "subtraction", symptoms: ["division_concept"] },
  { roll: 11, name: "Krishna Chaitanya", status: "on_track", rootId: null, symptoms: [] },
  { roll: 12, name: "Sandhya Rani", status: "critical", rootId: "addition", symptoms: ["mult_concept"] },
  { roll: 13, name: "Tarun Tej", status: "on_track", rootId: null, symptoms: [] },
  { roll: 14, name: "Kavya Madhavan", status: "need_practice", rootId: "place_value", symptoms: ["subtraction"] },
  { roll: 15, name: "Rakesh Roshan", status: "on_track", rootId: null, symptoms: [] },
  { roll: 16, name: "Pavani Latha", status: "need_practice", rootId: "mult_concept", symptoms: ["mult_facts"] },
  { roll: 17, name: "Nikhil Siddhartha", status: "on_track", rootId: null, symptoms: [] },
  { roll: 18, name: "Anjali Menon", status: "critical", rootId: "number_sense", symptoms: ["addition"] },
  { roll: 19, name: "Siddharth Roy", status: "on_track", rootId: null, symptoms: [] },
  { roll: 20, name: "Charan Raj", status: "need_practice", rootId: "division_concept", symptoms: ["fraction_basics"] },
  { roll: 21, name: "Vaishnavi Devi", status: "on_track", rootId: null, symptoms: [] },
  { roll: 22, name: "Aditi Rao", status: "on_track", rootId: null, symptoms: [] },
  { roll: 23, name: "Murali Krishna", status: "critical", rootId: "mult_facts", symptoms: ["division_concept"] },
  { roll: 24, name: "Shreya Ghoshal", status: "on_track", rootId: null, symptoms: [] },
  { roll: 25, name: "Varun Sandesh", status: "need_practice", rootId: "place_value", symptoms: ["addition"] },
  { roll: 26, name: "Kajal Agarwal", status: "on_track", rootId: null, symptoms: [] },
  { roll: 27, name: "Mahesh Babu", status: "on_track", rootId: null, symptoms: [] },
  { roll: 28, name: "Namrata Shirodkar", status: "need_practice", rootId: "subtraction", symptoms: ["division_concept"] },
  { roll: 29, name: "Nani Bellamkonda", status: "on_track", rootId: null, symptoms: [] },
  { roll: 30, name: "Nithya Menen", status: "critical", rootId: "addition", symptoms: ["mult_concept"] },
  { roll: 31, name: "Sundeep Kishan", status: "on_track", rootId: null, symptoms: [] },
  { roll: 32, name: "Regina Cassandra", status: "need_practice", rootId: "fraction_basics", symptoms: ["fraction_basics"] },
  { roll: 33, name: "Sharwanand Myneni", status: "on_track", rootId: null, symptoms: [] },
  { roll: 34, name: "Sai Pallavi", status: "on_track", rootId: null, symptoms: [] },
];

// Class 3A (32 students)
const RAW_STUDENTS_CLASS_3 = [
  { roll: 1, name: "Vihaan Joshi", status: "critical", rootId: "number_sense", symptoms: ["place_value"] },
  { roll: 2, name: "Aadhya Patel", status: "on_track", rootId: null, symptoms: [] },
  { roll: 3, name: "Kabir Das", status: "critical", rootId: "place_value", symptoms: ["addition"] },
  { roll: 4, name: "Saanvi Reddy", status: "on_track", rootId: null, symptoms: [] },
  { roll: 5, name: "Reyansh Gupta", status: "need_practice", rootId: "place_value", symptoms: ["subtraction"] },
  { roll: 6, name: "Anvi Kulkarni", status: "on_track", rootId: null, symptoms: [] },
  { roll: 7, name: "Dhruv Nambiar", status: "critical", rootId: "addition", symptoms: ["mult_concept"] },
  { roll: 8, name: "Isha Sundaram", status: "on_track", rootId: null, symptoms: [] },
  { roll: 9, name: "Arnav Varma", status: "need_practice", rootId: "number_sense", symptoms: ["addition"] },
  { roll: 10, name: "Myra Kapoor", status: "on_track", rootId: null, symptoms: [] },
  { roll: 11, name: "Yuvan Shankar", status: "critical", rootId: "place_value", symptoms: ["subtraction"] },
  { roll: 12, name: "Prisha Sen", status: "on_track", rootId: null, symptoms: [] },
  { roll: 13, name: "Advait Pillai", status: "need_practice", rootId: "addition", symptoms: ["subtraction"] },
  { roll: 14, name: "Kiara Advani", status: "on_track", rootId: null, symptoms: [] },
  { roll: 15, name: "Vivaan Shah", status: "critical", rootId: "number_sense", symptoms: ["place_value"] },
  { roll: 16, name: "Anaya Saxena", status: "on_track", rootId: null, symptoms: [] },
  { roll: 17, name: "Atharv Kulkarni", status: "need_practice", rootId: "addition", symptoms: ["mult_concept"] },
  { roll: 18, name: "Riya Chakraborty", status: "on_track", rootId: null, symptoms: [] },
  { roll: 19, name: "Shaurya Singh", status: "on_track", rootId: null, symptoms: [] },
  { roll: 20, name: "Navya Nair", status: "critical", rootId: "place_value", symptoms: ["addition"] },
  { roll: 21, name: "Samarth Bhat", status: "on_track", rootId: null, symptoms: [] },
  { roll: 22, name: "Ahana Ghosh", status: "need_practice", rootId: "number_sense", symptoms: ["subtraction"] },
  { roll: 23, name: "Devansh Parekh", status: "on_track", rootId: null, symptoms: [] },
  { roll: 24, name: "Mira Nair", status: "on_track", rootId: null, symptoms: [] },
  { roll: 25, name: "Rudra Pratap", status: "critical", rootId: "place_value", symptoms: ["subtraction"] },
  { roll: 26, name: "Siya Agarwal", status: "on_track", rootId: null, symptoms: [] },
  { roll: 27, name: "Darshil Seth", status: "need_practice", rootId: "addition", symptoms: ["mult_concept"] },
  { roll: 28, name: "Shanaya Roy", status: "on_track", rootId: null, symptoms: [] },
  { roll: 29, name: "Veer Singhania", status: "on_track", rootId: null, symptoms: [] },
  { roll: 30, name: "Tara Sutaria", status: "need_practice", rootId: "number_sense", symptoms: ["place_value"] },
  { roll: 31, name: "Rishi Sunak", status: "on_track", rootId: null, symptoms: [] },
  { roll: 32, name: "Avani Lekhara", status: "on_track", rootId: null, symptoms: [] },
];

function getRawCohort(classId: string) {
  if (classId === "class_3") return RAW_STUDENTS_CLASS_3;
  if (classId === "class_4") return RAW_STUDENTS_CLASS_4;
  if (classId === "class_5") return RAW_STUDENTS_CLASS_5;

  // Cohort generator for classes 1, 2, 6, 7, 8, 9, 10
  const conf = getClassConfig(classId);
  const count = conf.defaultStudentCount || 30;
  const names = [
    "Aarav Sharma", "Aditi Rao", "Ananya Reddy", "Arjun Patel", "Bhavya Sri",
    "Charan Raj", "Deepa Rao", "Divya Teja", "Harish Chandra", "Ishaan Reddy",
    "Kavya Madhavan", "Krishna Chaitanya", "Lakshmi Bai", "Manish Kumar", "Meera Bai",
    "Mohammed Imran", "Murali Krishna", "Naveen Kumar", "Nikhil Siddhartha", "Pavani Latha",
    "Pooja Hegde", "Priya Nair", "Rahul Sharma", "Rakesh Roshan", "Ravi Kumar",
    "Rohit Varma", "Sai Praneeth", "Samantha Ruth", "Sandhya Rani", "Sita Devi",
    "Sunita Goud", "Suresh Raina", "Tanvi Rao", "Tarun Tej", "Vaishnavi Devi",
    "Varun Sandesh", "Vikram Singh", "Zoya Fatima", "Karthik Varma", "Manoj Yadav",
    "Kavita Meena", "Ganesh Naik", "Aditya Das"
  ];

  const primaryRoot = (conf.targetConcepts && conf.targetConcepts[0] ? String(conf.targetConcepts[0]) : "number_sense");
  const secondaryRoot = (conf.targetConcepts && conf.targetConcepts[1] ? String(conf.targetConcepts[1]) : "place_value");

  const cohort = [];
  for (let r = 1; r <= count; r++) {
    const name = names[(r - 1) % names.length];
    let status = "on_track";
    let rootId: string | null = null;
    let symptoms: string[] = [];

    if (r % 5 === 1) {
      status = "critical";
      rootId = primaryRoot;
      symptoms = [secondaryRoot];
    } else if (r % 4 === 2) {
      status = "need_practice";
      rootId = secondaryRoot;
      symptoms = [primaryRoot];
    }

    cohort.push({ roll: r, name, status, rootId, symptoms });
  }

  return cohort;
}

function buildConceptsMap(
  status: string,
  rootId: ConceptId | null,
  roll: number
): Partial<Record<ConceptId, MasteryEstimate>> {
  // Ensure we assess all concepts up to this class's scope, including prerequisites
  const allConcepts: ConceptId[] = [
    "number_sense",
    "place_value",
    "addition",
    "subtraction",
    "mult_concept",
    "mult_facts",
    "multi_digit_mult",
    "division_concept",
    "division_facts",
    "long_division",
    "division_word",
    "fraction_basics",
    "equivalent_fractions",
    "comparing_fractions",
    "fraction_addition",
  ];

  const map: Partial<Record<ConceptId, MasteryEstimate>> = {};

  allConcepts.forEach((cid, idx) => {
    let mastery = 0.85;
    let st: MasteryStatus = "mastered";

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

export function initializeDemoData(classId: string = DEFAULT_CLASS_ID): DemoStudentData[] {
  const rawCohort = getRawCohort(classId);
  const classroom = getDemoClassroom(classId);

  return rawCohort.map((item) => {
    const sId = `${classId}_student_${item.roll}`;
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
            prompt: { raw: `Solve ${rootId.replace(/_/g, " ")}` },
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
      status: item.status as StudentStatus,
      overallMastery: overallMastery / 100,
      confidence: 0.85,
      concepts,
      rootCauses,
      strong,
      developing,
      needsSupport,
      inferredOk: [],
      nextConcept: rootCauses[0]?.rootId || null,
      nextReason: rootCauses.length > 0 ? "root_cause" : "none",
      evidenceCount: 4,
      lastAssessedAt: "2026-10-06T10:30:00Z",
      lastTopic: "division",
    };

    const student: Student = {
      id: sId,
      name: item.name,
      rollNo: item.roll,
      classroomId: classroom.id,
      isDemo: true,
    };

    return {
      student,
      profile,
      activePlan,
    };
  });
}

function getStorageKey(classId: string): string {
  return `shikshagap_students_${classId}_v2`;
}

export function loadStudents(classId: string = DEFAULT_CLASS_ID): DemoStudentData[] {
  if (typeof window === "undefined") {
    return initializeDemoData(classId);
  }
  try {
    const raw = localStorage.getItem(getStorageKey(classId));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  const fresh = initializeDemoData(classId);
  saveStudents(fresh, classId);
  return fresh;
}

export function saveStudents(data: DemoStudentData[], classId: string = DEFAULT_CLASS_ID): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(classId), JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function resetDemoData(classId: string = DEFAULT_CLASS_ID): DemoStudentData[] {
  const fresh = initializeDemoData(classId);
  saveStudents(fresh, classId);
  return fresh;
}
