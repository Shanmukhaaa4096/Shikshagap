import type { ConceptId, TopicId } from "../types.ts";
import { isClassLive } from "../coverage.ts";
// Note: (Coming soon) marker preserved for backward compatibility tests while all Classes 1-10 are active.

export type StageGroup = "foundational" | "preparatory" | "middle" | "secondary";

export interface ClassStageInfo {
  id: StageGroup;
  label: string;
  shortLabel: string;
  gradeRange: string;
  description: string;
}

export const STAGE_GROUPS: ClassStageInfo[] = [
  {
    id: "foundational",
    label: "Foundational Stage",
    shortLabel: "Foundational (1–2)",
    gradeRange: "Classes 1–2",
    description: "Early numeracy, counting, shapes, and intuitive daily math.",
  },
  {
    id: "preparatory",
    label: "Preparatory Stage",
    shortLabel: "Primary (3–5)",
    gradeRange: "Classes 3–5",
    description: "Core operations, place value, multiplication, division, and fraction basics.",
  },
  {
    id: "middle",
    label: "Middle Stage",
    shortLabel: "Middle (6–8)",
    gradeRange: "Classes 6–8",
    description: "Integers, rational numbers, pre-algebra, ratios, and geometric reasoning.",
  },
  {
    id: "secondary",
    label: "Secondary Stage",
    shortLabel: "Secondary (9–10)",
    gradeRange: "Classes 9–10",
    description: "Polynomials, coordinate geometry, trigonometry, and board exam foundations.",
  },
];

export interface ClassConfig {
  id: string;
  label: string;
  shortLabel: string;
  grade: number;
  section: string;
  enabled: boolean;
  stage: StageGroup;
  stageLabel: string;
  subjects: string[];
  topics: TopicId[];
  targetConcepts: (ConceptId | string)[];
  syllabusConcepts?: string[];
  defaultStudentCount: number;
  board?: string;
  textbookTitle?: string;
  description: {
    en: string;
    hi: string;
    te: string;
  };
}

export const ALLOWED_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export type AllowedGrade = (typeof ALLOWED_GRADES)[number];

export function isValidGrade(grade: unknown): grade is AllowedGrade {
  return typeof grade === "number" && Number.isInteger(grade) && grade >= 1 && grade <= 10;
}

/**
 * Returns dynamic pedagogical instruction for AI Examiner, Error Analyst, and Report Writer
 * to ensure age-appropriate vocabulary, sentence length, and conceptual depth.
 */
export function getClassPedagogicalInstructions(grade: number): string {
  if (grade <= 2) {
    return "Classes 1-2 Level: Use very simple words, short friendly sentences, lots of visual/everyday examples (fruits, toys, animals), a playful and encouraging tone, and focus on basic foundational concepts only.";
  }
  if (grade <= 5) {
    return "Classes 3-5 Level: Keep the current warm, conversational, relatable Indian school storytelling context with step-by-step guidance and everyday problem scenarios.";
  }
  if (grade <= 8) {
    return "Classes 6-8 Level: Provide more detail, introduce conceptual reasoning and the 'why' behind methods, use moderate mathematical vocabulary, and encourage structured logic.";
  }
  return "Classes 9-10 Level: Use board-exam style depth and rigor, precise mathematical terminology, step-by-step structured proofs/solutions, standard algebraic formulas, and clear analytical definitions.";
}

/**
 * Mascot reaction for Gappu the owl when a class is selected.
 */
export function getGappuClassReaction(grade: number): string {
  switch (grade) {
    case 1:
      return "Class 1? Welcome, little owlet! Let's count together!";
    case 2:
      return "Class 2? Yay! Numbers and shapes are so much fun!";
    case 3:
      return "Class 3? Let's crack some fun math puzzles!";
    case 4:
      return "Class 4? Awesome! Tables and fractions await!";
    case 5:
      return "Class 5? High five! Ready to master division!";
    case 6:
      return "Class 6? Welcome to middle school math adventure!";
    case 7:
      return "Class 7? Let's go! Time for smart reasoning!";
    case 8:
      return "Class 8? Exponents and algebra? We've got this!";
    case 9:
      return "Class 9? High school rigor! Let's build real mastery!";
    case 10:
      return "Class 10? Board exam champions! Let's do our best!";
    default:
      return `Class ${grade}? Let's learn together!`;
  }
}

/**
 * Central single-source-of-truth configuration for all 10 classes (Classes 1 to 10).
 */
export const SUPPORTED_CLASSES: ClassConfig[] = [
  {
    id: "class_1",
    label: "Class 1",
    shortLabel: "1",
    grade: 1,
    section: "A",
    enabled: isClassLive(1),
    stage: "foundational",
    stageLabel: "Foundational (1–2)",
    subjects: ["math"],
    topics: ["counting", "shapes_spatial", "add_sub", "money"],
    targetConcepts: ["cbse-1-m02", "cbse-1-m01", "cbse-1-m03", "cbse-1-m12"],
    syllabusConcepts: [
      "cbse-1-m01",
      "cbse-1-m02",
      "cbse-1-m03",
      "cbse-1-m04",
      "cbse-1-m05",
      "cbse-1-m06",
      "cbse-1-m07",
      "cbse-1-m08",
      "cbse-1-m09",
      "cbse-1-m10",
      "cbse-1-m11",
      "cbse-1-m12",
      "cbse-1-m13",
      "icse-1-m01",
      "icse-1-m02",
      "icse-1-m03",
      "icse-1-m04",
      "icse-1-m05",
    ],
    defaultStudentCount: 30,
    textbookTitle: "Joyful Mathematics Class 1",
    description: {
      en: "Early numeracy, counting to 20, spatial shapes, time, and basic money calculations",
      hi: "आरंभिक गिनती (20 तक), स्थानिक आकार, समय और बुनियादी मुद्रा गणना",
      te: "ప్రారంభ గణితం (20 వరకు లెక్కింపు), ప్రాదేశిక ఆకారాలు, సమయం మరియు ప్రాథమిక డబ్బు లెక్కలు",
    },
  },
  {
    id: "class_2",
    label: "Class 2",
    shortLabel: "2",
    grade: 2,
    section: "A",
    enabled: isClassLive(2),
    stage: "foundational",
    stageLabel: "Foundational (1–2)",
    subjects: ["math"],
    topics: ["two_digit_numbers", "addition_subtraction", "measurement", "patterns"],
    targetConcepts: ["cbse-2-m02", "cbse-2-m08", "cbse-2-m07", "cbse-2-m01"],
    syllabusConcepts: [
      "cbse-2-m01",
      "cbse-2-m02",
      "cbse-2-m03",
      "cbse-2-m04",
      "cbse-2-m05",
      "cbse-2-m06",
      "cbse-2-m07",
      "cbse-2-m08",
      "cbse-2-m09",
      "cbse-2-m10",
      "cbse-2-m11",
      "icse-2-m01",
      "icse-2-m02",
      "icse-2-m03",
      "icse-2-m04",
      "icse-2-m05",
    ],
    defaultStudentCount: 32,
    textbookTitle: "Joyful Mathematics Class 2",
    description: {
      en: "Place value to 100, 2-digit addition/subtraction, shapes, capacity, and money handling",
      hi: "100 तक स्थानीय मान, 2-अंकीय जोड़/घटाव, आकार, धारिता और मुद्रा लेन-देन",
      te: "100 వరకు స్థాన విలువ, 2-అంకెల సంకలనం/వ్యవకలనం, ఆకారాలు, కొలతలు మరియు డబ్బు నిర్వహణ",
    },
  },
  {
    id: "class_3",
    label: "Class 3",
    shortLabel: "3A",
    grade: 3,
    section: "A",
    enabled: isClassLive(3),
    stage: "preparatory",
    stageLabel: "Primary (3–5)",
    subjects: ["math"],
    topics: ["number_sense", "multiplication", "division", "fractions"],
    targetConcepts: [
      "number_sense",
      "addition",
      "subtraction",
      "mult_concept",
      "addition_3digit",
      "subtraction_3digit",
      "division_sharing",
      "money_math",
    ],
    syllabusConcepts: [
      "cbse-3-m01",
      "cbse-3-m02",
      "cbse-3-m03",
      "cbse-3-m04",
      "cbse-3-m05",
      "cbse-3-m06",
      "cbse-3-m07",
      "cbse-3-m08",
      "cbse-3-m09",
      "cbse-3-m10",
      "cbse-3-m11",
      "cbse-3-m12",
      "cbse-3-m13",
      "cbse-3-m14",
    ],
    defaultStudentCount: 32,
    textbookTitle: "Maths Mela Class 3 (NCF-SE 2023)",
    description: {
      en: "Number sense, 2-digit & 3-digit operations, equal sharing division, and money calculations",
      hi: "संख्या बोध, 2 और 3-अंकीय संक्रियाएं, बराबर बंटवारा और मुद्रा गणना",
      te: "సంఖ్యా భావన, 2 మరియు 3-అంకెల ప్రక్రియలు, సమాన పంపకం మరియు డబ్బు లెక్కలు",
    },
  },
  {
    id: "class_4",
    label: "Class 4",
    shortLabel: "4A",
    grade: 4,
    section: "A",
    enabled: isClassLive(4),
    stage: "preparatory",
    stageLabel: "Primary (3–5)",
    subjects: ["math"],
    topics: ["number_ops", "multiplication", "division", "fractions"],
    targetConcepts: ["place_value", "mult_facts", "division_concept", "fraction_basics"],
    defaultStudentCount: 34,
    textbookTitle: "Math-Magic 4",
    description: {
      en: "Place value up to 10,000, multiplication facts (2 to 9), sharing division, and unit fractions",
      hi: "10,000 तक स्थानीय मान, पहाड़े (2 से 9), बराबर बांटने का भाग और आरंभिक भिन्न",
      te: "స్థాన విలువ, గుణకార పట్టికలు (2 నుండి 9), భాగాహార భావన మరియు భిన్నాల పరిచయం",
    },
  },
  {
    id: "class_5",
    label: "Class 5",
    shortLabel: "5A",
    grade: 5,
    section: "A",
    enabled: isClassLive(5),
    stage: "preparatory",
    stageLabel: "Primary (3–5)",
    subjects: ["math"],
    topics: ["multiplication", "division", "fractions", "area_perimeter"],
    targetConcepts: [
      "multi_digit_mult",
      "division_facts",
      "long_division",
      "equivalent_fractions",
    ],
    defaultStudentCount: 36,
    textbookTitle: "Math-Magic 5",
    description: {
      en: "Multi-digit multiplication, long division with remainders, and equivalent fractions",
      hi: "बहु-अंकीय गुणा, शेषफल के साथ भाग और तुल्य भिन्न",
      te: "బహుళ-అంకెల గుణకారం, శేషంతో కూడిన భాగాహారం మరియు సమాన భిన్నాలు",
    },
  },
  {
    id: "class_6",
    label: "Class 6",
    shortLabel: "6",
    grade: 6,
    section: "A",
    enabled: isClassLive(6),
    stage: "middle",
    stageLabel: "Middle (6–8)",
    subjects: ["math"],
    topics: ["integers", "fractions_decimals", "algebra_intro", "ratio_proportion"],
    targetConcepts: ["cbse-6-m03", "cbse-6-m04", "cbse-6-m07", "cbse-6-m08"],
    syllabusConcepts: [
      "cbse-6-m01",
      "cbse-6-m02",
      "cbse-6-m03",
      "cbse-6-m04",
      "cbse-6-m05",
      "cbse-6-m06",
      "cbse-6-m07",
      "cbse-6-m08",
      "cbse-6-m09",
      "cbse-6-m10",
      "icse-6-m01",
      "icse-6-m02",
      "icse-6-m03",
      "icse-6-m04",
      "icse-6-m05",
      "icse-6-m06",
      "icse-6-m07",
    ],
    defaultStudentCount: 38,
    textbookTitle: "Ganita Prakash Class 6 (NCF-SE 2023)",
    description: {
      en: "Integers, fractions/decimals, ratio & proportion, algebra basics, and geometric mensuration",
      hi: "पूर्णांक, भिन्न/दशमलव, अनुपात एवं समानुपात, आरंभिक बीजगणित और क्षेत्रमिति",
      te: "పూర్ణాంకాలు, భిన్నాలు/దశాంశాలు, నిష్పత్తి & అనుపాతం, ప్రాథమిక బీజగణితం మరియు క్షేత్రమితి",
    },
  },
  {
    id: "class_7",
    label: "Class 7",
    shortLabel: "7",
    grade: 7,
    section: "A",
    enabled: isClassLive(7),
    stage: "middle",
    stageLabel: "Middle (6–8)",
    subjects: ["math"],
    topics: ["rational_numbers", "linear_equations", "algebraic_expressions", "comparing_quantities"],
    targetConcepts: ["cbse-7-m08", "cbse-7-m04", "cbse-7-m10", "cbse-7-m07"],
    syllabusConcepts: [
      "cbse-7-m01",
      "cbse-7-m02",
      "cbse-7-m03",
      "cbse-7-m04",
      "cbse-7-m05",
      "cbse-7-m06",
      "cbse-7-m07",
      "cbse-7-m08",
      "cbse-7-m09",
      "cbse-7-m10",
      "cbse-7-m11",
      "cbse-7-m12",
      "cbse-7-m13",
      "icse-7-m01",
      "icse-7-m02",
      "icse-7-m03",
      "icse-7-m04",
      "icse-7-m05",
      "icse-7-m06",
      "icse-7-m07",
    ],
    defaultStudentCount: 40,
    textbookTitle: "Mathematics Class 7",
    description: {
      en: "Rational numbers, linear equations, algebraic expressions, comparing quantities, and geometry",
      hi: "परिमेय संख्याएं, सरल समीकरण, बीजीय व्यंजक, राशियों की तुलना और ज्यामिति",
      te: "అకరణీయ సంఖ్యలు, సరళ సమీకరణాలు, బీజగణిత సమాసాలు, పరిమాణాల పోలిక మరియు రేఖాగణితం",
    },
  },
  {
    id: "class_8",
    label: "Class 8",
    shortLabel: "8",
    grade: 8,
    section: "A",
    enabled: isClassLive(8),
    stage: "middle",
    stageLabel: "Middle (6–8)",
    subjects: ["math"],
    topics: ["rational_powers", "linear_equations_one_var", "algebraic_identities", "mensuration"],
    targetConcepts: ["cbse-8-m01", "cbse-8-m02", "cbse-8-m08", "cbse-8-m09"],
    syllabusConcepts: [
      "cbse-8-m01",
      "cbse-8-m02",
      "cbse-8-m03",
      "cbse-8-m04",
      "cbse-8-m05",
      "cbse-8-m06",
      "cbse-8-m07",
      "cbse-8-m08",
      "cbse-8-m09",
      "cbse-8-m10",
      "cbse-8-m11",
      "cbse-8-m12",
      "cbse-8-m13",
      "icse-8-m01",
      "icse-8-m02",
      "icse-8-m03",
      "icse-8-m04",
      "icse-8-m05",
      "icse-8-m06",
      "icse-8-m07",
    ],
    defaultStudentCount: 40,
    textbookTitle: "Mathematics Class 8",
    description: {
      en: "Rational exponents, squares/cubes, algebraic identities, factorisation, and 3D mensuration",
      hi: "घातांक, वर्ग/घन, सर्वसमिकाएं, गुणनखंड और 3-विमीय क्षेत्रमिति",
      te: "ఘాతాంకాలు, వర్గాలు/ఘనాలు, బీజగణిత సూత్రాలు, కారణాంకాలు మరియు 3డి క్షేత్రమితి",
    },
  },
  {
    id: "class_9",
    label: "Class 9",
    shortLabel: "9",
    grade: 9,
    section: "A",
    enabled: isClassLive(9),
    stage: "secondary",
    stageLabel: "Secondary (9–10)",
    subjects: ["math"],
    topics: ["number_systems", "polynomials", "coordinate_geometry", "linear_equations_two_vars"],
    targetConcepts: ["cbse-9-m01", "cbse-9-m02", "cbse-9-m03", "cbse-9-m04"],
    syllabusConcepts: [
      "cbse-9-m01",
      "cbse-9-m02",
      "cbse-9-m03",
      "cbse-9-m04",
      "cbse-9-m05",
      "cbse-9-m06",
      "cbse-9-m07",
      "cbse-9-m08",
      "cbse-9-m09",
      "cbse-9-m10",
      "cbse-9-m11",
      "cbse-9-m12",
      "icse-9-m01",
      "icse-9-m02",
      "icse-9-m03",
      "icse-9-m04",
      "icse-9-m05",
      "icse-9-m06",
      "icse-9-m07",
      "icse-9-m08",
    ],
    defaultStudentCount: 42,
    textbookTitle: "Mathematics Class 9",
    description: {
      en: "Real number systems, polynomials, coordinate geometry, linear equations, geometry, and statistics",
      hi: "वास्तविक संख्या पद्धति, बहुपद, निर्देशांक ज्यामिति, दो चरों वाले रैखिक समीकरण और सांख्यिकी",
      te: "వాస్తవ సంఖ్యా వ్యవస్థలు, బహుపదులు, నిరూపక రేఖాగణితం, రెండు చరరాశుల సరళ సమీకరణాలు మరియు సాంఖ్యక శాస్త్రం",
    },
  },
  {
    id: "class_10",
    label: "Class 10",
    shortLabel: "10",
    grade: 10,
    section: "A",
    enabled: isClassLive(10),
    stage: "secondary",
    stageLabel: "Secondary (9–10)",
    subjects: ["math"],
    topics: ["real_numbers", "quadratic_equations", "arithmetic_progressions", "trigonometry"],
    targetConcepts: ["cbse-10-m01", "cbse-10-m04", "cbse-10-m05", "cbse-10-m08"],
    syllabusConcepts: [
      "cbse-10-m01",
      "cbse-10-m02",
      "cbse-10-m03",
      "cbse-10-m04",
      "cbse-10-m05",
      "cbse-10-m06",
      "cbse-10-m07",
      "cbse-10-m08",
      "cbse-10-m09",
      "cbse-10-m10",
      "cbse-10-m11",
      "cbse-10-m12",
      "cbse-10-m13",
      "cbse-10-m14",
      "icse-10-m01",
      "icse-10-m02",
      "icse-10-m03",
      "icse-10-m04",
      "icse-10-m05",
      "icse-10-m06",
      "icse-10-m07",
      "icse-10-m08",
      "icse-10-m09",
      "icse-10-m10",
    ],
    defaultStudentCount: 42,
    textbookTitle: "Mathematics Class 10",
    description: {
      en: "Real numbers, quadratic equations, arithmetic progressions, trigonometry, statistics, and probability",
      hi: "वास्तविक संख्याएं, द्विघात समीकरण, समांतर श्रेढियाँ, त्रिकोणमिति, सांख्यिकी और प्रायिकता",
      te: "వాస్తవ సంఖ్యలు, వర్గ సమీకరణాలు, అంక శ్రేఢులు, త్రికోణమితి, సాంఖ్యక శాస్త్రం మరియు సంభావ్యత",
    },
  },
];

export const ENABLED_CLASSES = SUPPORTED_CLASSES.filter((c) => c.enabled);
export const DEFAULT_CLASS_ID = "class_5";

export function getClassConfig(classId: string): ClassConfig {
  const found = SUPPORTED_CLASSES.find((c) => c.id === classId);
  return found || SUPPORTED_CLASSES.find((c) => c.id === DEFAULT_CLASS_ID)!;
}

export function getClassByGrade(grade: number): ClassConfig | undefined {
  return SUPPORTED_CLASSES.find((c) => c.grade === grade);
}

export function isClassEnabled(classId: string): boolean {
  const found = SUPPORTED_CLASSES.find((c) => c.id === classId);
  return Boolean(found?.enabled);
}
