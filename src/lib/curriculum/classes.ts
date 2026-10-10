import type { ConceptId, TopicId } from "@/lib/types";

export interface ClassConfig {
  id: string;
  label: string;
  shortLabel: string;
  grade: number;
  section: string;
  enabled: boolean;
  subjects: string[];
  topics: TopicId[];
  targetConcepts: ConceptId[];
  defaultStudentCount: number;
  description: {
    en: string;
    hi: string;
    te: string;
  };
}

export const SUPPORTED_CLASSES: ClassConfig[] = [
  {
    id: "class_1",
    label: "Class 1",
    shortLabel: "1",
    grade: 1,
    section: "A",
    enabled: false,
    subjects: ["math"],
    topics: [],
    targetConcepts: [],
    defaultStudentCount: 30,
    description: {
      en: "Early numeracy, counting, and shapes (Coming soon)",
      hi: "आरंभिक गिनती और आकार (शीघ्र उपलब्ध)",
      te: "ప్రారంభ గణితం మరియు ఆకారాలు (త్వరలో అందుబాటులో ఉంటుంది)",
    },
  },
  {
    id: "class_2",
    label: "Class 2",
    shortLabel: "2",
    grade: 2,
    section: "A",
    enabled: false,
    subjects: ["math"],
    topics: [],
    targetConcepts: [],
    defaultStudentCount: 32,
    description: {
      en: "2-digit numbers and basic addition (Coming soon)",
      hi: "2-अंकीय संख्याएं और जोड़ (शीघ्र उपलब्ध)",
      te: "2-అంకెల సంఖ్యలు మరియు సంకలనం (త్వరలో అందుబాటులో ఉంటుంది)",
    },
  },
  {
    id: "class_3",
    label: "Class 3",
    shortLabel: "3A",
    grade: 3,
    section: "A",
    enabled: true,
    subjects: ["math"],
    topics: ["number_ops", "multiplication"],
    targetConcepts: ["number_sense", "addition", "subtraction", "mult_concept"],
    defaultStudentCount: 32,
    description: {
      en: "Number sense, 2-digit subtraction with borrowing, and introduction to repeated addition",
      hi: "संख्या बोध, 2-अंकीय घटाव और बार-बार जोड़ के रूप में गुणा",
      te: "సంఖ్యా భావన, 2-అంకెల వ్యవకలనం మరియు గుణకార ప్రారంభం",
    },
  },
  {
    id: "class_4",
    label: "Class 4",
    shortLabel: "4A",
    grade: 4,
    section: "A",
    enabled: true,
    subjects: ["math"],
    topics: ["number_ops", "multiplication", "division", "fractions"],
    targetConcepts: ["place_value", "mult_facts", "division_concept", "fraction_basics"],
    defaultStudentCount: 34,
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
    enabled: true,
    subjects: ["math"],
    topics: ["number_ops", "multiplication", "division", "fractions"],
    targetConcepts: [
      "multi_digit_mult",
      "division_facts",
      "long_division",
      "division_word",
      "equivalent_fractions",
      "comparing_fractions",
      "fraction_addition",
    ],
    defaultStudentCount: 36,
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
    enabled: false,
    subjects: ["math"],
    topics: [],
    targetConcepts: [],
    defaultStudentCount: 38,
    description: {
      en: "Integers, ratios, and algebraic expressions (Coming soon)",
      hi: "पूर्णांक, अनुपात और बीजगणित (शीघ्र उपलब्ध)",
      te: "పూర్ణాంకాలు, నిష్పత్తులు మరియు బీజగణితం (త్వరలో అందుబాటులో ఉంటుంది)",
    },
  },
  {
    id: "class_7",
    label: "Class 7",
    shortLabel: "7",
    grade: 7,
    section: "A",
    enabled: false,
    subjects: ["math"],
    topics: [],
    targetConcepts: [],
    defaultStudentCount: 40,
    description: {
      en: "Rational numbers, linear equations, and geometry (Coming soon)",
      hi: "परिमेय संख्याएं और रैखिक समीकरण (शीघ्र उपलब्ध)",
      te: "అకరణీయ సంఖ్యలు మరియు సరళ సమీకరణాలు (త్వరలో అందుబాటులో ఉంటుంది)",
    },
  },
  {
    id: "class_8",
    label: "Class 8",
    shortLabel: "8",
    grade: 8,
    section: "A",
    enabled: false,
    subjects: ["math"],
    topics: [],
    targetConcepts: [],
    defaultStudentCount: 40,
    description: {
      en: "Exponents, squares, and algebraic identities (Coming soon)",
      hi: "घातांक, वर्ग और सर्वसमिकाएं (शीघ्र उपलब्ध)",
      te: "ఘాతాంకాలు, వర్గాలు మరియు బీజగణిత సూత్రాలు (త్వరలో అందుబాటులో ఉంటుంది)",
    },
  },
];

export const ENABLED_CLASSES = SUPPORTED_CLASSES.filter((c) => c.enabled);
export const DEFAULT_CLASS_ID = "class_5";

export function getClassConfig(classId: string): ClassConfig {
  const found = SUPPORTED_CLASSES.find((c) => c.id === classId);
  return found || SUPPORTED_CLASSES.find((c) => c.id === DEFAULT_CLASS_ID)!;
}

export function isClassEnabled(classId: string): boolean {
  const found = SUPPORTED_CLASSES.find((c) => c.id === classId);
  return Boolean(found?.enabled);
}
