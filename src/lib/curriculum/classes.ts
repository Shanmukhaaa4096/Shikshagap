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
  targetConcepts: (ConceptId | string)[];
  defaultStudentCount: number;
  board?: string;
  textbookTitle?: string;
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
    targetConcepts: [
      "cbse_1_counting_20",
      "cbse_1_add_sub_9",
      "cbse_1_shapes_space",
      "cbse_1_measurement_basics",
      "cbse_1_time_patterns",
      "cbse_1_money_coins",
      "icse_1_pre_number_concepts",
      "icse_1_numbers_1_99",
      "icse_1_addition_subtraction",
    ],
    defaultStudentCount: 30,
    description: {
      en: "Early numeracy, counting, shapes, time, and money (Coming soon)",
      hi: "आरंभिक गिनती, आकार, समय और मुद्रा (शीघ्र उपलब्ध)",
      te: "ప్రారంభ గణితం, ఆకారాలు, సమయం మరియు డబ్బు (త్వరలో అందుబాటులో ఉంటుంది)",
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
    targetConcepts: [
      "cbse_2_number_names_100",
      "cbse_2_add_2digit",
      "cbse_2_sub_2digit",
      "cbse_2_shapes_footprints",
      "cbse_2_money_notes",
      "cbse_2_measurement_jugs",
      "icse_2_place_value_100",
      "icse_2_addition_subtraction_2digit",
      "icse_2_geometry_shapes",
    ],
    defaultStudentCount: 32,
    description: {
      en: "Place value to 100, 2-digit addition/subtraction, shapes, time, and money (Coming soon)",
      hi: "100 तक स्थानीय मान, 2-अंकीय जोड़/घटाव, आकार और मुद्रा (शीघ्र उपलब्ध)",
      te: "100 వరకు స్థాన విలువ, 2-అంకెల సంకలనం/వ్యవకలనం, ఆకారాలు మరియు డబ్బు (త్వరలో అందుబాటులో ఉంటుంది)",
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
    defaultStudentCount: 32,
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
    targetConcepts: [
      "cbse_6_integers",
      "cbse_6_fractions_decimals",
      "cbse_6_ratio_proportion",
      "cbse_6_algebra_basics",
      "cbse_6_mensuration_perimeter_area",
      "icse_6_integers",
      "icse_6_fractions_decimals",
      "icse_6_ratio_proportion",
      "icse_6_algebra_introduction",
    ],
    defaultStudentCount: 38,
    description: {
      en: "Integers, fractions/decimals, ratio & proportion, algebra basics, and mensuration (Coming soon)",
      hi: "पूर्णांक, भिन्न/दशमलव, अनुपात एवं समानुपात, आरंभिक बीजगणित और क्षेत्रमिति (शीघ्र उपलब्ध)",
      te: "పూర్ణాంకాలు, భిన్నాలు/దశాంశాలు, నిష్పత్తి & అనుపాతం, ప్రాథమిక బీజగణితం మరియు క్షేత్రమితి (త్వరలో అందుబాటులో ఉంటుంది)",
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
    targetConcepts: [
      "cbse_7_integers_operations",
      "cbse_7_rational_numbers",
      "cbse_7_simple_equations",
      "cbse_7_lines_and_angles",
      "cbse_7_triangle_properties",
      "cbse_7_comparing_quantities",
      "cbse_7_algebraic_expressions",
      "icse_7_integers",
      "icse_7_rational_numbers",
      "icse_7_linear_equations",
    ],
    defaultStudentCount: 40,
    description: {
      en: "Rational numbers, linear equations, comparing quantities, and geometry (Coming soon)",
      hi: "परिमेय संख्याएं, सरल समीकरण, राशियों की तुलना और ज्यामिति (शीघ्र उपलब्ध)",
      te: "అకరణీయ సంఖ్యలు, సరళ సమీకరణాలు, పరిమాణాల పోలిక మరియు రేఖాగణితం (త్వరలో అందుబాటులో ఉంటుంది)",
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
    targetConcepts: [
      "cbse_8_rational_numbers_props",
      "cbse_8_linear_equations_one_var",
      "cbse_8_squares_square_roots",
      "cbse_8_cubes_cube_roots",
      "cbse_8_comparing_quantities_ci",
      "cbse_8_algebraic_identities",
      "cbse_8_mensuration_solid_shapes",
      "cbse_8_exponents_powers",
      "cbse_8_factorisation",
      "icse_8_rational_numbers",
      "icse_8_exponents_powers",
      "icse_8_algebraic_expressions",
      "icse_8_factorisation",
    ],
    defaultStudentCount: 40,
    description: {
      en: "Exponents, squares/cubes, algebraic identities, factorisation, and mensuration (Coming soon)",
      hi: "घातांक, वर्ग/घन, सर्वसमिकाएं, गुणनखंड और क्षेत्रमिति (शीघ्र उपलब्ध)",
      te: "ఘాతాంకాలు, వర్గాలు/ఘనాలు, బీజగణిత సూత్రాలు, కారణాంకాలు మరియు క్షేత్రమితి (త్వరలో అందుబాటులో ఉంటుంది)",
    },
  },
  {
    id: "class_9",
    label: "Class 9",
    shortLabel: "9",
    grade: 9,
    section: "A",
    enabled: false,
    subjects: ["math"],
    topics: [],
    targetConcepts: [
      "cbse_9_number_systems",
      "cbse_9_polynomials",
      "cbse_9_coordinate_geometry",
      "cbse_9_linear_equations_two_var",
      "cbse_9_lines_and_angles",
      "cbse_9_triangles_congruence",
      "cbse_9_quadrilaterals",
      "cbse_9_circles",
      "cbse_9_herons_formula",
      "cbse_9_surface_areas_volumes",
      "cbse_9_statistics",
      "icse_9_pure_arithmetic_rational_irrational",
      "icse_9_commercial_math_ci",
      "icse_9_algebra_expansions",
      "icse_9_factorisation",
      "icse_9_simultaneous_linear_equations",
      "icse_9_geometry_triangles",
      "icse_9_trigonometric_ratios",
    ],
    defaultStudentCount: 42,
    description: {
      en: "Number systems, polynomials, coordinate geometry, linear equations, geometry, and statistics (Coming soon)",
      hi: "संख्या पद्धति, बहुपद, निर्देशांक ज्यामिति, दो चरों वाले रैखिक समीकरण, ज्यामिति और सांख्यिकी (शीघ्र उपलब्ध)",
      te: "సంఖ్యా వ్యవస్థలు, బహుపదులు, నిరూపక రేఖాగణితం, రెండు చరరాశుల సరళ సమీకరణాలు, రేఖాగణితం మరియు సాంఖ్యక శాస్త్రం (త్వరలో అందుబాటులో ఉంటుంది)",
    },
  },
  {
    id: "class_10",
    label: "Class 10",
    shortLabel: "10",
    grade: 10,
    section: "A",
    enabled: false,
    subjects: ["math"],
    topics: [],
    targetConcepts: [
      "cbse_10_real_numbers",
      "cbse_10_polynomials",
      "cbse_10_pair_linear_equations",
      "cbse_10_quadratic_equations",
      "cbse_10_arithmetic_progressions",
      "cbse_10_triangles_similarity",
      "cbse_10_coordinate_geometry",
      "cbse_10_intro_trigonometry",
      "cbse_10_applications_trigonometry",
      "cbse_10_circles",
      "cbse_10_areas_related_to_circles",
      "cbse_10_surface_areas_volumes",
      "cbse_10_statistics",
      "cbse_10_probability",
      "icse_10_commercial_mathematics_gst",
      "icse_10_banking_recurring_deposit",
      "icse_10_linear_inequations",
      "icse_10_quadratic_equations",
      "icse_10_ratio_and_proportion",
      "icse_10_factorisation_remainder_theorem",
      "icse_10_matrices",
      "icse_10_arithmetic_geometric_progression",
      "icse_10_coordinate_geometry_reflection_section",
      "icse_10_similarity",
      "icse_10_circles",
      "icse_10_mensuration_cylinder_cone_sphere",
      "icse_10_trigonometric_identities_heights",
      "icse_10_statistics_ogive_mean_median",
      "icse_10_probability",
    ],
    defaultStudentCount: 42,
    description: {
      en: "Real numbers, quadratic equations, arithmetic progressions, trigonometry, statistics, and probability (Coming soon)",
      hi: "वास्तविक संख्याएं, द्विघात समीकरण, समांतर श्रेढियाँ, त्रिकोणमिति, सांख्यिकी और प्रायिकता (शीघ्र उपलब्ध)",
      te: "వాస్తవ సంఖ్యలు, వర్గ సమీకరణాలు, అంక శ్రేఢులు, త్రికోణమితి, సాంఖ్యక శాస్త్రం మరియు సంభావ్యత (త్వరలో అందుబాటులో ఉంటుంది)",
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
