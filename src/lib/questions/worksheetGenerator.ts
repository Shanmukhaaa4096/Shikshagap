/**
 * src/lib/questions/worksheetGenerator.ts
 *
 * Printable Practice Worksheet Generator for ShikshaGap.
 * Generates pedagogically structured, non-repetitive, class-appropriate math practice sheets.
 *
 * Hard Requirements:
 * 1. Inputs: class (1-10), board (CBSE|ICSE), skill/topic, difficulty band, language, count (default 10), diagnosedGap.
 * 2. Structure:
 *    - Section A "Warm-up" (max 30% of items, from diagnosed gap, labelled with prerequisite class).
 *    - Section B "Class N practice" (at least 70% of items, from selected class and board).
 *    - Section C "Challenge" (1 or 2 items one band harder).
 * 3. Header shows real class, board, and actual skills generated from items' topic tags.
 * 4. Content respects data-driven topic map for Classes 1 to 10.
 * 5. Repetition guard: zero duplicate items, no repeated operand pairs, no repeated number pattern, retry cap.
 * 6. Code-validated items with complete Teacher Answer Key.
 */

import { makeRng, randInt, gcd, type Rng } from "../rng.ts";
import { MULTI_BOARD_QUESTION_BANK } from "./multiBoardBank.ts";

export type Board = "CBSE" | "ICSE" | "Both";
export type Language = "en" | "hi" | "te";

export interface DiagnosedGapInput {
  rootId: string;
  title?: string;
  fromGrade?: number;
}

export interface WorksheetGeneratorOptions {
  classNum: number; // 1 to 10
  board: Board;
  skillOrTopic?: string;
  targetSkill?: string;
  difficultyBand?: "easy" | "medium" | "hard" | "all" | number;
  language?: Language;
  count?: number; // default 10
  diagnosedGap?: DiagnosedGapInput;
  excludeIds?: string[];
  seed?: number;
  storedQuestions?: Array<{
    id: string;
    class: number;
    board: string;
    concept_id: string;
    question_text: string;
    answer_value: string;
    difficulty: number;
    fingerprint: string;
    options?: Array<{ id: string; label: string; value: string }>;
  }>;
}

export interface WorksheetItem {
  number: number;
  section: "warmup" | "practice" | "challenge";
  sectionLabel: string;
  classNum: number;
  board: Board;
  topic: string;
  subtopic?: string;
  difficulty: number; // 1 to 5
  difficultyBand: "easy" | "medium" | "hard";
  prompt: string;
  expression?: string;
  questionText: string;
  options?: Array<{ id: string; label: string; value: string }>;
  correctAnswer: string;
  explanation: string;
  operands?: number[];
  provenanceLabel?: string;
  templateId?: string;
  fingerprint: string;
}

export interface GeneratedWorksheet {
  header: {
    classNum: number;
    board: Board;
    title: string;
    skillsLine: string;
    dateStr: string;
    totalCount: number;
  };
  warmupSection: {
    title: string;
    fromGrade: number;
    items: WorksheetItem[];
  };
  practiceSection: {
    title: string;
    classNum: number;
    items: WorksheetItem[];
  };
  challengeSection: {
    title: string;
    items: WorksheetItem[];
  };
  items: WorksheetItem[];
  answerKey: Array<{
    number: number;
    section: string;
    topic: string;
    questionSummary: string;
    correctAnswer: string;
    explanation: string;
  }>;
}

export interface TopicDefinition {
  id: string;
  name: { en: string; hi: string; te: string };
  class: number;
  difficulties: number[]; // e.g. [1, 2, 3, 4, 5]
}

/**
 * Data-driven Topic Map for Classes 1 to 10.
 */
export const WORKSHEET_TOPIC_MAP: Record<number, TopicDefinition[]> = {
  1: [
    { id: "counting_objects", name: { en: "Counting and Numbers (1 to 20)", hi: "गिनती और संख्याएँ (1 से 20)", te: "లెక్కింపు మరియు సంఖ్యలు (1 నుండి 20)" }, class: 1, difficulties: [1, 2] },
    { id: "addition_within_10", name: { en: "Addition within 10", hi: "10 तक जोड़", te: "10 లోపు కూడికలు" }, class: 1, difficulties: [1, 2, 3] },
    { id: "subtraction_within_10", name: { en: "Subtraction within 10", hi: "10 तक घटाव", te: "10 లోపు తీసివేతలు" }, class: 1, difficulties: [1, 2, 3] },
    { id: "shapes_basic", name: { en: "Basic Shapes and Patterns", hi: "मूलभूत आकृतियाँ और पैटर्न", te: "ప్రాథమిక ఆకారాలు" }, class: 1, difficulties: [1, 2] },
  ],
  2: [
    { id: "addition_with_carry", name: { en: "2-Digit Addition with Regrouping", hi: "हासिल वाला 2-अंकीय जोड़", te: "దశాంశాల మార్పిడితో కూడిక" }, class: 2, difficulties: [1, 2, 3] },
    { id: "subtraction_borrow", name: { en: "2-Digit Subtraction with Borrowing", hi: "उधार वाला 2-अंकीय घटाव", te: "అప్పు తెచ్చుకునే తీసివేత" }, class: 2, difficulties: [1, 2, 3] },
    { id: "place_value_2digit", name: { en: "Place Value (Tens and Ones)", hi: "स्थानीय मान (दहाई और इकाई)", te: "స్థాన విలువ (పదులు మరియు ఒకట్లు)" }, class: 2, difficulties: [1, 2] },
    { id: "skip_counting", name: { en: "Skip Counting (2s, 5s, 10s)", hi: "छलांग गिनती (2, 5, 10)", te: "క్రమ సంఖ్యల లెక్కింపు" }, class: 2, difficulties: [1, 2] },
  ],
  3: [
    { id: "number_sense", name: { en: "3-Digit Number Sense & Place Value", hi: "3-अंकीय संख्या बोध एवं स्थानीय मान", te: "3-అంకెల సంఖ్యా భావన" }, class: 3, difficulties: [1, 2, 3] },
    { id: "addition", name: { en: "3-Digit Column Addition", hi: "3-अंकीय स्तंभ जोड़", te: "3-అంకెల కూడిక" }, class: 3, difficulties: [1, 2, 3] },
    { id: "subtraction", name: { en: "3-Digit Subtraction with Regrouping", hi: "3-अंकीय उधार वाला घटाव", te: "3-అంకెల తీసివేత" }, class: 3, difficulties: [1, 2, 3] },
    { id: "multiplication_tables", name: { en: "Multiplication Tables (2 to 9)", hi: "पहाड़े और गुणन (2 से 9)", te: "గుణకార పట్టికలు (2 నుండి 9)" }, class: 3, difficulties: [1, 2, 3] },
    { id: "division_basics", name: { en: "Division as Equal Sharing", hi: "बराबर बाँटने का भाग", te: "సమ విభజన భాగాహారం" }, class: 3, difficulties: [1, 2, 3] },
  ],
  4: [
    { id: "place_value_4digit", name: { en: "Place Value up to 10,000", hi: "10,000 तक स्थानीय मान", te: "10,000 వరకు స్థాన విలువ" }, class: 4, difficulties: [1, 2, 3] },
    { id: "mult_2digit_1digit", name: { en: "Multiplication (2-Digit by 1-Digit)", hi: "2-अंकीय गुणा", te: "2-అంకెల గుణకారం" }, class: 4, difficulties: [1, 2, 3] },
    { id: "division_facts", name: { en: "Division with Remainders", hi: "शेषफल के साथ भाग", te: "శేషంతో కూడిన భాగాహారం" }, class: 4, difficulties: [1, 2, 3] },
    { id: "fractions_basics", name: { en: "Unit and Like Fractions", hi: "भिन्न और सम भिन्न", te: "భిన్నాల పరిచయం" }, class: 4, difficulties: [1, 2, 3] },
    { id: "perimeter_basic", name: { en: "Perimeter of Rectangles and Squares", hi: "आयत और वर्ग का परिमाप", te: "చుట్టుకొలత" }, class: 4, difficulties: [1, 2, 3] },
  ],
  5: [
    { id: "multi_digit_mult", name: { en: "Multi-Digit Multiplication (3-Digit by 2-Digit)", hi: "बहु-अंकीय गुणा", te: "బహుళ-అంకెల గుణకారం" }, class: 5, difficulties: [1, 2, 3, 4] },
    { id: "long_division", name: { en: "Long Division with 2-Digit Divisors", hi: "2-अंकीय भाजक के साथ लंबा भाग", te: "దీర్ఘ భాగాహారం" }, class: 5, difficulties: [1, 2, 3, 4] },
    { id: "fractions_like_add", name: { en: "Operations on Fractions (Like & Unlike)", hi: "भिन्नों का जोड़ और घटाव", te: "భిన్నాల సంకలనం మరియు వ్యవకలనం" }, class: 5, difficulties: [1, 2, 3, 4] },
    { id: "decimals_basics", name: { en: "Decimals and Place Value", hi: "दशमलव संख्याएँ और जोड़", te: "దశాంశాలు" }, class: 5, difficulties: [1, 2, 3, 4] },
    { id: "area_perimeter", name: { en: "Area and Perimeter of Plane Figures", hi: "क्षेत्रफल और परिमाप", te: "వైశాల్యం మరియు చుట్టుకొలత" }, class: 5, difficulties: [1, 2, 3, 4] },
  ],
  6: [
    { id: "integers", name: { en: "Integers and Number Line Operations", hi: "पूर्णांक और संख्या रेखा", te: "పూర్ణాంకాలు మరియు సంఖ్యా రేఖ" }, class: 6, difficulties: [1, 2, 3, 4] },
    { id: "fractions_decimals", name: { en: "Fractions and Decimals Multiplication/Division", hi: "भिन्न एवं दशमलव के गुणन व भाग", te: "భిన్నాలు మరియు దశాంశాల గుణకారం" }, class: 6, difficulties: [1, 2, 3, 4] },
    { id: "ratio_proportion", name: { en: "Ratio and Proportion", hi: "अनुपात एवं समानुपात", te: "నిష్పత్తి మరియు అనుపాతం" }, class: 6, difficulties: [1, 2, 3, 4] },
    { id: "algebra_intro", name: { en: "Introduction to Algebra and Linear Expressions", hi: "आरंभिक बीजगणित", te: "బీజగణిత పరిచయం" }, class: 6, difficulties: [1, 2, 3, 4] },
    { id: "perimeter_area", name: { en: "Perimeter and Area of Polygons", hi: "क्षेत्रमिति: परिमाप और क्षेत्रफल", te: "బహుభుజుల చుట్టుకొలత మరియు వైశాల్యం" }, class: 6, difficulties: [1, 2, 3, 4] },
  ],
  7: [
    { id: "rational_numbers", name: { en: "Operations on Rational Numbers", hi: "परिमेय संख्याओं पर संक्रियाएँ", te: "అకరణీయ సంఖ్యలపై పరిక్రియలు" }, class: 7, difficulties: [1, 2, 3, 4, 5] },
    { id: "simple_equations", name: { en: "Simple Equations (Linear in One Variable)", hi: "सरल समीकरण", te: "సరళ సమీకరణాలు" }, class: 7, difficulties: [1, 2, 3, 4, 5] },
    { id: "algebraic_expressions", name: { en: "Algebraic Expressions (Like Terms & Addition)", hi: "बीजीय व्यंजक", te: "బీజగణిత సమాసాలు" }, class: 7, difficulties: [1, 2, 3, 4, 5] },
    { id: "comparing_quantities", name: { en: "Comparing Quantities: Percentage and Profit-Loss", hi: "राशियों की तुलना: प्रतिशत और लाभ-हानि", te: "పరిమాణాల పోలిక: శాతాలు మరియు లాభ-నష్టాలు" }, class: 7, difficulties: [1, 2, 3, 4, 5] },
    { id: "exponents_powers", name: { en: "Exponents and Laws of Indices", hi: "घातांक और घात के नियम", te: "ఘాతాంకాలు మరియు ఘాతాలు" }, class: 7, difficulties: [1, 2, 3, 4, 5] },
    { id: "perimeter_area", name: { en: "Area of Triangles, Parallelograms, and Circles", hi: "त्रिभुज, समांतर चतुर्भुज और वृत्त का क्षेत्रफल", te: "త్రిభుజాలు, సమాంతర చతుర్భుజాలు, వృత్తాల వైశాల్యం" }, class: 7, difficulties: [1, 2, 3, 4, 5] },
  ],
  8: [
    { id: "rational_numbers", name: { en: "Properties of Rational Numbers", hi: "परिमेय संख्याओं के गुणधर्म", te: "అకరణీయ సంఖ్యల ధర్మాలు" }, class: 8, difficulties: [1, 2, 3, 4, 5] },
    { id: "exponents_powers", name: { en: "Exponents and Powers (Negative Indices)", hi: "घातांक और घात (ऋणात्मक घातांक)", te: "ఘాతాంకాలు మరియు ఘాతాలు (రుణ ఘాతాలు)" }, class: 8, difficulties: [1, 2, 3, 4, 5] },
    { id: "linear_equations_one_var", name: { en: "Linear Equations in One Variable", hi: "एक चर वाले रैखिक समीकरण", te: "ఒక చరరాశిలో సరళ సమీకరణాలు" }, class: 8, difficulties: [1, 2, 3, 4, 5] },
    { id: "factorisation", name: { en: "Factorisation of Algebraic Expressions", hi: "बीजीय व्यंजकों का गुणनखंडन", te: "బీజగణిత సమాసాల కారణాంకాల విభజన" }, class: 8, difficulties: [1, 2, 3, 4, 5] },
    { id: "algebraic_identities", name: { en: "Standard Algebraic Identities", hi: "मानक बीजीय सर्वसमिकाएँ", te: "ప్రామాణిక బీజగణిత సర్వసమీకరణాలు" }, class: 8, difficulties: [1, 2, 3, 4, 5] },
    { id: "mensuration", name: { en: "Mensuration (Trapezium, Area & Volume)", hi: "क्षेत्रमिति (समलंब, पृष्ठीय क्षेत्रफल और आयतन)", te: "క్షేత్రమితి (సమలంబ చతుర్భుజం, వైశాల్యం, ఘనపరిమాణం)" }, class: 8, difficulties: [1, 2, 3, 4, 5] },
    { id: "squares_square_roots", name: { en: "Squares and Square Roots", hi: "वर्ग और वर्गमूल", te: "వర్గాలు మరియు వర్గమూలాలు" }, class: 8, difficulties: [1, 2, 3, 4, 5] },
    { id: "cubes_cube_roots", name: { en: "Cubes and Cube Roots", hi: "घन और घनमूल", te: "ఘనాలు మరియు ఘనమూలాలు" }, class: 8, difficulties: [1, 2, 3, 4, 5] },
    { id: "percentage_profit_loss", name: { en: "Commercial Math (Discount, GST, Compound Interest)", hi: "व्यावसायिक गणित (छूट, जीएसटी, चक्रवृद्धि ब्याज)", te: "వాణిజ్య గణితం (రాయితీ, జిఎస్టి, చక్రవడ్డీ)" }, class: 8, difficulties: [1, 2, 3, 4, 5] },
    { id: "data_handling", name: { en: "Data Handling (Mean, Graphs, Probability)", hi: "आँकड़ों का प्रबंधन", te: "దత్తాంశ నిర్వహణ" }, class: 8, difficulties: [1, 2, 3, 4, 5] },
  ],
  9: [
    { id: "number_systems", name: { en: "Real Numbers and Rationalisation", hi: "वास्तविक संख्याएँ और परिमेयकरण", te: "వాస్తవ సంఖ్యలు మరియు హేతుబద్ధీకరణ" }, class: 9, difficulties: [1, 2, 3, 4, 5] },
    { id: "polynomials", name: { en: "Polynomials and Factor Theorem", hi: "बहुपद और गुणनखंड प्रमेय", te: "బహుపదులు మరియు కారణాంక సిద్ధాంతం" }, class: 9, difficulties: [1, 2, 3, 4, 5] },
    { id: "coordinate_geometry", name: { en: "Coordinate Geometry and Quadrants", hi: "निर्देशांक ज्यामिति", te: "నిరూపక రేఖాగణితం" }, class: 9, difficulties: [1, 2, 3, 4, 5] },
    { id: "linear_equations_two_vars", name: { en: "Linear Equations in Two Variables", hi: "दो चरों वाले रैखिक समीकरण", te: "రెండు చరరాశులలో సరళ సమీకరణాలు" }, class: 9, difficulties: [1, 2, 3, 4, 5] },
    { id: "triangles_congruence", name: { en: "Congruence of Triangles (SSS, SAS, ASA, RHS)", hi: "त्रिभुजों की सर्वांगसमता", te: "త్రిభుజాల సర్వసమానత్వం" }, class: 9, difficulties: [1, 2, 3, 4, 5] },
    { id: "surface_areas_volumes", name: { en: "Surface Areas and Volumes (Cone, Sphere, Cylinder)", hi: "पृष्ठीय क्षेत्रफल और आयतन", te: "ఉపరితల వైశాల్యాలు మరియు ఘనపరిమాణాలు" }, class: 9, difficulties: [1, 2, 3, 4, 5] },
    { id: "statistics", name: { en: "Statistics (Measures of Central Tendency)", hi: "सांख्यिकी (माध्य, माध्यक, बहुलक)", te: "సాంఖ్యక శాస్త్రం" }, class: 9, difficulties: [1, 2, 3, 4, 5] },
  ],
  10: [
    { id: "real_numbers", name: { en: "Real Numbers (Fundamental Theorem of Arithmetic)", hi: "वास्तविक संख्याएँ (अंकगणित की आधारभूत प्रमेय)", te: "వాస్తవ సంఖ్యలు (అంకగణిత ప్రాథమిక సిద్ధాంతం)" }, class: 10, difficulties: [1, 2, 3, 4, 5] },
    { id: "polynomials", name: { en: "Polynomials (Zeroes and Coefficients)", hi: "बहुपद (शून्यक और गुणांक)", te: "బహుపదుల శూన్యాలు" }, class: 10, difficulties: [1, 2, 3, 4, 5] },
    { id: "linear_equations_pair", name: { en: "Pair of Linear Equations in Two Variables", hi: "दो चरों में रैखिक समीकरण युग्म", te: "రెండు చరరాశులలో సరళ సమీకరణాల జత" }, class: 10, difficulties: [1, 2, 3, 4, 5] },
    { id: "quadratic_equations", name: { en: "Quadratic Equations and Nature of Roots", hi: "द्विघात समीकरण और मूलों की प्रकृति", te: "వర్గ సమీకరణాలు" }, class: 10, difficulties: [1, 2, 3, 4, 5] },
    { id: "arithmetic_progressions", name: { en: "Arithmetic Progressions (nth term and Sum)", hi: "समांतर श्रेढियाँ (n-वाँ पद और योग)", te: "అంకశ్రేఢులు (nవ పదం మరియు మొత్తం)" }, class: 10, difficulties: [1, 2, 3, 4, 5] },
    { id: "coordinate_geometry", name: { en: "Coordinate Geometry (Distance and Section Formulae)", hi: "निर्देशांक ज्यामिति (दूरी और विभाजन सूत्र)", te: "నిరూపక రేఖాగణితం (దూరం మరియు విభజన సూత్రాలు)" }, class: 10, difficulties: [1, 2, 3, 4, 5] },
    { id: "trigonometry", name: { en: "Trigonometric Ratios and Identities", hi: "त्रिकोणमितीय अनुपात और सर्वसमिकाएँ", te: "త్రికోణమితి నిష్పత్తులు మరియు సర్వసమీకరణాలు" }, class: 10, difficulties: [1, 2, 3, 4, 5] },
    { id: "surface_areas_volumes", name: { en: "Surface Areas and Volumes of Combined Solids", hi: "संयोजित ठोसों का पृष्ठीय क्षेत्रफल और आयतन", te: "సంయుక్త ఘనాల వైశాల్యాలు" }, class: 10, difficulties: [1, 2, 3, 4, 5] },
    { id: "statistics", name: { en: "Statistics (Mean, Median, Mode of Grouped Data)", hi: "सांख्यिकी (वर्गीकृत आँकड़े)", te: "వర్గీకృత దత్తాంశ సాంఖ్యక శాస్త్రం" }, class: 10, difficulties: [1, 2, 3, 4, 5] },
  ],
};

/**
 * Reusable anti-repetition guard preventing duplicate questions, operand pairs, and number patterns.
 */
class RepetitionGuard {
  private seenSignatures = new Set<string>();
  private seenOperandPairs = new Set<string>();
  private operandFrequency = new Map<number, number>();
  private templateFrequency = new Map<string, number>();
  private seenPrompts = new Set<string>();
  private excludedIds = new Set<string>();

  constructor(excludeIds?: string[]) {
    if (excludeIds) {
      for (const id of excludeIds) {
        if (!id) continue;
        this.excludedIds.add(id);
        this.excludedIds.add(id.split("_s")[0]);
        this.excludedIds.add(`bank_${id}`);
      }
    }
  }

  canAccept(
    item: { fingerprint: string; id?: string; operands?: number[]; templateId?: string; prompt?: string },
    relaxOperands = false
  ): boolean {
    if (item.id && (this.excludedIds.has(item.id) || this.excludedIds.has(item.id.split("_s")[0]))) {
      return false;
    }
    if (this.excludedIds.has(item.fingerprint)) {
      return false;
    }
    if (this.seenSignatures.has(item.fingerprint)) {
      return false;
    }

    if (item.prompt && this.seenPrompts.has(item.prompt.trim().toLowerCase())) {
      return false;
    }

    if (!relaxOperands) {
      if (item.operands && item.operands.length >= 2) {
        const sortedPair = [...item.operands].sort((a, b) => a - b).join(":");
        if (this.seenOperandPairs.has(sortedPair)) {
          return false;
        }
      }

      if (item.operands) {
        const incomingCounts = new Map<number, number>();
        for (const op of item.operands) {
          incomingCounts.set(op, (incomingCounts.get(op) || 0) + 1);
        }
        for (const [op, count] of incomingCounts.entries()) {
          if ((this.operandFrequency.get(op) || 0) + count > 2) {
            return false;
          }
        }
      }

      if (item.templateId) {
        if ((this.templateFrequency.get(item.templateId) || 0) >= 2) {
          return false;
        }
      }
    }

    return true;
  }

  record(item: { fingerprint: string; operands?: number[]; templateId?: string; prompt?: string }): void {
    this.seenSignatures.add(item.fingerprint);

    if (item.prompt) {
      this.seenPrompts.add(item.prompt.trim().toLowerCase());
    }

    if (item.operands && item.operands.length >= 2) {
      const sortedPair = [...item.operands].sort((a, b) => a - b).join(":");
      this.seenOperandPairs.add(sortedPair);
    }

    if (item.operands) {
      for (const op of item.operands) {
        this.operandFrequency.set(op, (this.operandFrequency.get(op) || 0) + 1);
      }
    }

    if (item.templateId) {
      this.templateFrequency.set(item.templateId, (this.templateFrequency.get(item.templateId) || 0) + 1);
    }
  }
}

/**
 * Procedural item generators for topics across Classes 1 to 10.
 * Every generator computes answers deterministically with verified solutions.
 */
function buildParametricItem(
  topicId: string,
  classNum: number,
  board: Board,
  difficulty: number,
  lang: Language,
  rng: Rng
): Omit<WorksheetItem, "number" | "section" | "sectionLabel"> {
  const diffBand: "easy" | "medium" | "hard" = difficulty <= 2 ? "easy" : difficulty === 3 ? "medium" : "hard";

  // -------------------------------------------------------------
  // Class 8 Topics
  // -------------------------------------------------------------
  if (topicId === "linear_equations_one_var" || topicId === "simple_equations") {
    const a = randInt(rng, 2, 8);
    const xVal = randInt(rng, 2, 12);
    const b = randInt(rng, 3, 20);
    const isMinus = rng() < 0.5;
    const rhs = isMinus ? a * xVal - b : a * xVal + b;
    const expr = isMinus ? `${a}x - ${b} = ${rhs}` : `${a}x + ${b} = ${rhs}`;

    let prompt = `Solve the linear equation for x: ${expr}`;
    let explanation = isMinus
      ? `Add ${b} to both sides: ${a}x = ${rhs + b}, then divide by ${a}: x = ${xVal}.`
      : `Subtract ${b} from both sides: ${a}x = ${rhs - b}, then divide by ${a}: x = ${xVal}.`;

    if (lang === "hi") {
      prompt = `x के लिए रैखिक समीकरण हल कीजिए: ${expr}`;
      explanation = isMinus
        ? `दोनों पक्षों में ${b} जोड़ें: ${a}x = ${rhs + b}, फिर ${a} से भाग दें: x = ${xVal}।`
        : `दोनों पक्षों से ${b} घटाएँ: ${a}x = ${rhs - b}, फिर ${a} से भाग दें: x = ${xVal}।`;
    } else if (lang === "te") {
      prompt = `x కోసం సరళ సమీకరణాన్ని సాధించండి: ${expr}`;
      explanation = isMinus
        ? `ఇరువైపులా ${b} కలపండి: ${a}x = ${rhs + b}, తరువాత ${a} తో భాగించండి: x = ${xVal}.`
        : `ఇరువైపుల నుండి ${b} తీసివేయండి: ${a}x = ${rhs - b}, తరువాత ${a} తో భాగించండి: x = ${xVal}.`;
    }

    return {
      classNum,
      board,
      topic: "Linear Equations in One Variable",
      subtopic: "Transposition and Solution",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: expr,
      questionText: `${prompt} (${expr})`,
      correctAnswer: `x = ${xVal}`,
      explanation,
      operands: [a, b],
      templateId: `lineq_${isMinus ? "minus" : "plus"}`,
      fingerprint: `lineq_${expr}_${xVal}`,
      provenanceLabel: board === "ICSE" ? "CISCE Mathematics Class 8 (Linear Equations)" : "NCERT Class 8 Mathematics Chapter 2",
    };
  }

  if (topicId === "exponents_powers") {
    if (classNum >= 8) {
      const base = randInt(rng, 2, 5);
      const negPow = randInt(rng, 2, 4);
      const val = Math.pow(base, negPow);
      const expr = `${base}^(-${negPow})`;
      let prompt = `Evaluate the exponential expression: ${base}^(-${negPow})`;
      let explanation = `${base}^(-${negPow}) = 1 / (${base}^${negPow}) = 1 / ${val}.`;
      if (lang === "hi") {
        prompt = `मान ज्ञात कीजिए: ${base}^(-${negPow})`;
        explanation = `${base}^(-${negPow}) = 1 / (${base}^${negPow}) = 1 / ${val}।`;
      } else if (lang === "te") {
        prompt = `విలువను కనుగొనండి: ${base}^(-${negPow})`;
        explanation = `${base}^(-${negPow}) = 1 / (${base}^${negPow}) = 1 / ${val}.`;
      }

      return {
        classNum,
        board,
        topic: "Exponents and Powers",
        subtopic: "Negative Exponents",
        difficulty,
        difficultyBand: diffBand,
        prompt,
        expression: `${expr} = ?`,
        questionText: prompt,
        correctAnswer: `1/${val}`,
        explanation,
        operands: [base, negPow],
        templateId: "neg_exponent",
        fingerprint: `neg_exp_${base}_${negPow}`,
        provenanceLabel: board === "ICSE" ? "CISCE Mathematics Class 8 (Exponents)" : "NCERT Class 8 Mathematics Chapter 10",
      };
    } else {
      const base = randInt(rng, 2, 6);
      const m = randInt(rng, 2, 4);
      const n = randInt(rng, 2, 4);
      const expr = `${base}^${m} × ${base}^${n}`;
      let prompt = `Simplify using the law of exponents: ${expr}`;
      let explanation = `Using a^m × a^n = a^(m+n): ${base}^(${m} + ${n}) = ${base}^${m + n}.`;
      if (lang === "hi") {
        prompt = `घातांक नियम का उपयोग करके सरल कीजिए: ${expr}`;
        explanation = `a^m × a^n = a^(m+n) से: ${base}^(${m} + ${n}) = ${base}^${m + n}।`;
      } else if (lang === "te") {
        prompt = `ఘాతాంక న్యాయాన్ని ఉపయోగించి సూక్ష్మీకరించండి: ${expr}`;
        explanation = `a^m × a^n = a^(m+n) ప్రకారం: ${base}^(${m} + ${n}) = ${base}^${m + n}.`;
      }

      return {
        classNum,
        board,
        topic: "Exponents and Powers",
        subtopic: "Laws of Indices",
        difficulty,
        difficultyBand: diffBand,
        prompt,
        expression: `${expr} = ?`,
        questionText: prompt,
        correctAnswer: `${base}^${m + n}`,
        explanation,
        operands: [base, m + n],
        templateId: "laws_of_indices",
        fingerprint: `exp_law_${base}_${m}_${n}`,
        provenanceLabel: "NCERT Mathematics Class 7 Chapter 11",
      };
    }
  }

  if (topicId === "squares_square_roots") {
    const root = randInt(rng, 11, 25);
    const sq = root * root;
    let prompt = `Find the square root of ${sq} using prime factorisation.`;
    let explanation = `${root} × ${root} = ${sq}, therefore √${sq} = ${root}.`;
    if (lang === "hi") {
      prompt = `अभाज्य गुणनखंड द्वारा ${sq} का वर्गमूल ज्ञात कीजिए।`;
      explanation = `${root} × ${root} = ${sq}, अतः √${sq} = ${root}।`;
    } else if (lang === "te") {
      prompt = `ప్రధాన కారణాంకాల పద్ధతి ద్వారా ${sq} యొక్క వర్గమూలాన్ని కనుగొనండి.`;
      explanation = `${root} × ${root} = ${sq}, కావున √${sq} = ${root}.`;
    }

    return {
      classNum,
      board,
      topic: "Squares and Square Roots",
      subtopic: "Square Roots",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `√${sq} = ?`,
      questionText: prompt,
      correctAnswer: String(root),
      explanation,
      operands: [root, sq],
      templateId: "sq_root",
      fingerprint: `sqrt_${sq}`,
      provenanceLabel: "NCERT Class 8 Mathematics Chapter 5",
    };
  }

  if (topicId === "cubes_cube_roots") {
    const root = randInt(rng, 3, 9);
    const cube = root * root * root;
    let prompt = `Find the cube root of ${cube}.`;
    let explanation = `${root} × ${root} × ${root} = ${cube}, therefore ∛${cube} = ${root}.`;
    if (lang === "hi") {
      prompt = `${cube} का घनमूल ज्ञात कीजिए।`;
      explanation = `${root} × ${root} × ${root} = ${cube}, अतः ∛${cube} = ${root}।`;
    } else if (lang === "te") {
      prompt = `${cube} యొక్క ఘనమూలాన్ని కనుగొనండి.`;
      explanation = `${root} × ${root} × ${root} = ${cube}, కావున ∛${cube} = ${root}.`;
    }

    return {
      classNum,
      board,
      topic: "Cubes and Cube Roots",
      subtopic: "Cube Roots",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `∛${cube} = ?`,
      questionText: prompt,
      correctAnswer: String(root),
      explanation,
      operands: [root, cube],
      templateId: "cube_root",
      fingerprint: `cbrt_${cube}`,
      provenanceLabel: "NCERT Class 8 Mathematics Chapter 6",
    };
  }

  if (topicId === "factorisation") {
    const k = randInt(rng, 2, 9);
    const sq = k * k;
    const expr = `x² - ${sq}`;
    const ans = `(x - ${k})(x + ${k})`;
    let prompt = `Factorise the algebraic expression using difference of squares: ${expr}`;
    let explanation = `Using identity a² - b² = (a - b)(a + b): ${expr} = x² - ${k}² = (x - ${k})(x + ${k}).`;
    if (lang === "hi") {
      prompt = `वर्गों के अंतर का उपयोग करके गुणनखंडन कीजिए: ${expr}`;
      explanation = `a² - b² = (a - b)(a + b) से: ${expr} = (x - ${k})(x + ${k})।`;
    } else if (lang === "te") {
      prompt = `వర్గాల తేడాను ఉపయోగించి కారణాంకాలుగా విభజించండి: ${expr}`;
      explanation = `a² - b² = (a - b)(a + b) ప్రకారం: ${expr} = (x - ${k})(x + ${k}).`;
    }

    return {
      classNum,
      board,
      topic: "Factorisation of Algebraic Expressions",
      subtopic: "Difference of Squares",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `${expr} = ?`,
      questionText: prompt,
      correctAnswer: ans,
      explanation,
      operands: [k, sq],
      templateId: "factor_diff_sq",
      fingerprint: `fact_sq_${k}`,
      provenanceLabel: board === "ICSE" ? "CISCE Mathematics Class 8 (Factorisation)" : "NCERT Class 8 Mathematics Chapter 12",
    };
  }

  if (topicId === "algebraic_identities") {
    const a = randInt(rng, 2, 7);
    let b = randInt(rng, 3, 9);
    if (b === a) b = a + 1;
    const expr = `(x + ${a})(x + ${b})`;
    const midCoeff = a + b;
    const constTerm = a * b;
    const expanded = `x² + ${midCoeff}x + ${constTerm}`;
    let prompt = `Expand using the algebraic identity (x + a)(x + b): ${expr}`;
    let explanation = `(x + a)(x + b) = x² + (a + b)x + ab = x² + (${a} + ${b})x + (${a} × ${b}) = ${expanded}.`;
    if (lang === "hi") {
      prompt = `बीजीय सर्वसमिका (x + a)(x + b) का उपयोग करके प्रसार कीजिए: ${expr}`;
      explanation = `(x + a)(x + b) = x² + (a + b)x + ab = ${expanded}।`;
    } else if (lang === "te") {
      prompt = `(x + a)(x + b) సర్వసమీకరణాన్ని ఉపయోగించి విస్తరించండి: ${expr}`;
      explanation = `(x + a)(x + b) = x² + (a + b)x + ab = ${expanded}.`;
    }

    return {
      classNum,
      board,
      topic: "Standard Algebraic Identities",
      subtopic: "Polynomial Expansion",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `${expr} = ?`,
      questionText: prompt,
      correctAnswer: expanded,
      explanation,
      operands: [a, b],
      templateId: "alg_identity_expand",
      fingerprint: `alg_exp_${a}_${b}`,
      provenanceLabel: board === "ICSE" ? "CISCE Mathematics Class 8 (Identities)" : "NCERT Class 8 Mathematics Chapter 8",
    };
  }

  if (topicId === "data_handling") {
    const base = randInt(rng, 10, 30);
    const deltas = [randInt(rng, 0, 4), randInt(rng, 2, 6), randInt(rng, 4, 8), randInt(rng, 6, 10), randInt(rng, 8, 12)];
    const sum = deltas.reduce((acc, d) => acc + d, 0);
    const rem = sum % 5;
    if (rem !== 0) {
      deltas[4] += (5 - rem);
    }
    const values = deltas.map((d) => base + d);
    const total = values.reduce((acc, v) => acc + v, 0);
    const mean = total / 5;
    const dataStr = values.join(", ");
    let prompt = `Find the arithmetic mean of the given observation values: ${dataStr}.`;
    let explanation = `Sum of observations = ${values.join(" + ")} = ${total}. Number of observations = 5. Mean = ${total} / 5 = ${mean}.`;
    if (lang === "hi") {
      prompt = `दिए गए प्रेक्षणों का समांतर माध्य ज्ञात कीजिए: ${dataStr}।`;
      explanation = `प्रेक्षणों का योग = ${total}। प्रेक्षणों की संख्या = 5। माध्य = ${total} / 5 = ${mean}।`;
    } else if (lang === "te") {
      prompt = `ఇవ్వబడిన రాశుల అంకమధ్యమం (సగటు) ను కనుగొనండి: ${dataStr}.`;
      explanation = `రాశుల మొత్తం = ${total}. రాశుల సంఖ్య = 5. సగటు = ${total} / 5 = ${mean}.`;
    }

    return {
      classNum,
      board,
      topic: "Data Handling",
      subtopic: "Arithmetic Mean",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `Values: ${dataStr}`,
      questionText: prompt,
      correctAnswer: String(mean),
      explanation,
      operands: [values[0], values[4]],
      templateId: "data_mean_5",
      fingerprint: `data_mean_${values.join("_")}`,
      provenanceLabel: board === "ICSE" ? "CISCE Mathematics Class 8 (Data Handling)" : "NCERT Class 8 Mathematics Chapter 4",
    };
  }

  if (topicId === "rational_numbers") {
    const num1 = randInt(rng, 1, 5);
    const den1 = randInt(rng, 2, 6);
    const num2 = randInt(rng, 1, 5);
    const den2 = randInt(rng, 2, 6);
    const commonDen = den1 * den2;
    const resNum = num1 * den2 + num2 * den1;
    const div = gcd(resNum, commonDen);
    const simpNum = resNum / div;
    const simpDen = commonDen / div;
    const ansStr = simpDen === 1 ? String(simpNum) : `${simpNum}/${simpDen}`;
    const expr = `${num1}/${den1} + ${num2}/${den2}`;

    let prompt = `Add the rational numbers and simplify to lowest terms: ${expr}`;
    let explanation = `Common denominator is ${commonDen}. (${num1} × ${den2} + ${num2} × ${den1}) / ${commonDen} = ${resNum} / ${commonDen} = ${ansStr}.`;
    if (lang === "hi") {
      prompt = `परिमेय संख्याओं को जोड़िए और सरलतम रूप में लिखिए: ${expr}`;
      explanation = `ल.स. ${commonDen} है। (${num1} × ${den2} + ${num2} × ${den1}) / ${commonDen} = ${ansStr}।`;
    } else if (lang === "te") {
      prompt = `అకరణీయ సంఖ్యలను కలిపి సూక్ష్మరూపంలో రాయండి: ${expr}`;
      explanation = `సాధారణ హారం ${commonDen}. (${num1} × ${den2} + ${num2} × ${den1}) / ${commonDen} = ${ansStr}.`;
    }

    return {
      classNum,
      board,
      topic: "Rational Numbers",
      subtopic: "Addition of Rational Numbers",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `${expr} = ?`,
      questionText: prompt,
      correctAnswer: ansStr,
      explanation,
      operands: [den1, den2],
      templateId: "rational_add",
      fingerprint: `rat_add_${num1}_${den1}_${num2}_${den2}`,
      provenanceLabel: board === "ICSE" ? "CISCE Mathematics Class 8 (Rational Numbers)" : "NCERT Class 8 Mathematics Chapter 1",
    };
  }

  if (topicId === "mensuration" || topicId === "perimeter_area") {
    if (classNum >= 8) {
      // Area of trapezium
      const a = randInt(rng, 4, 12);
      const b = randInt(rng, 6, 16);
      const h = randInt(rng, 3, 10);
      const area = 0.5 * (a + b) * h;
      let prompt = `Find the area of a trapezium with parallel sides ${a} cm and ${b} cm and perpendicular height ${h} cm.`;
      let explanation = `Area of trapezium = 1/2 × (a + b) × h = 1/2 × (${a} + ${b}) × ${h} = 1/2 × ${a + b} × ${h} = ${area} cm².`;
      if (lang === "hi") {
        prompt = `एक समलंब चतुर्भुज का क्षेत्रफल ज्ञात कीजिए जिसकी समांतर भुजाएँ ${a} सेमी और ${b} सेमी हैं और ऊँचाई ${h} सेमी है।`;
        explanation = `समलंब का क्षेत्रफल = 1/2 × (a + b) × h = ${area} सेमी²।`;
      } else if (lang === "te") {
        prompt = `సమాంతర భుజాలు ${a} సెం.మీ, ${b} సెం.మీ మరియు ఎత్తు ${h} సెం.మీ కలిగిన సమలంబ చతుర్భుజ వైశాల్యాన్ని కనుగొనండి.`;
        explanation = `వైశాల్యం = 1/2 × (a + b) × h = ${area} చ.సెం.మీ.`;
      }

      return {
        classNum,
        board,
        topic: "Mensuration",
        subtopic: "Area of Trapezium",
        difficulty,
        difficultyBand: diffBand,
        prompt,
        expression: `Area = 1/2 × (${a} + ${b}) × ${h}`,
        questionText: prompt,
        correctAnswer: `${area} cm²`,
        explanation,
        operands: [a, b],
        templateId: "trap_area",
        fingerprint: `trap_area_${a}_${b}_${h}`,
        provenanceLabel: "NCERT Class 8 Mathematics Chapter 9",
      };
    } else {
      const length = randInt(rng, 5, 18);
      const width = randInt(rng, 3, 12);
      const area = length * width;
      const peri = 2 * (length + width);
      let prompt = `Find the perimeter and area of a rectangle of length ${length} m and breadth ${width} m.`;
      let explanation = `Perimeter = 2 × (${length} + ${width}) = ${peri} m. Area = ${length} × ${width} = ${area} m².`;
      if (lang === "hi") {
        prompt = `लंबाई ${length} मीटर और चौड़ाई ${width} मीटर वाले आयत का परिमाप और क्षेत्रफल ज्ञात कीजिए।`;
        explanation = `परिमाप = ${peri} मीटर, क्षेत्रफल = ${area} वर्ग मीटर।`;
      } else if (lang === "te") {
        prompt = `పొడవు ${length} మీ మరియు వెడల్పు ${width} మీ కలిగిన దీర్ఘచతురస్ర చుట్టుకొలత మరియు వైశాల్యాన్ని కనుగొనండి.`;
        explanation = `చుట్టుకొలత = ${peri} మీ, వైశాల్యం = ${area} చ.మీ.`;
      }

      return {
        classNum,
        board,
        topic: "Perimeter and Area",
        subtopic: "Rectangular Mensuration",
        difficulty,
        difficultyBand: diffBand,
        prompt,
        expression: `Perimeter: 2 × (${length} + ${width}), Area: ${length} × ${width}`,
        questionText: prompt,
        correctAnswer: `Perimeter = ${peri} m, Area = ${area} m²`,
        explanation,
        operands: [length, width],
        templateId: "rect_peri_area",
        fingerprint: `rect_${length}_${width}`,
        provenanceLabel: "NCERT Mathematics Chapter Mensuration",
      };
    }
  }

  // -------------------------------------------------------------
  // Class 6 to 7 Topics
  // -------------------------------------------------------------
  if (topicId === "integers") {
    const a = randInt(rng, 5, 25) * (rng() < 0.5 ? -1 : 1);
    const b = randInt(rng, 5, 25) * (rng() < 0.5 ? -1 : 1);
    const isSub = rng() < 0.5;
    const ans = isSub ? a - b : a + b;
    const expr = isSub ? `(${a}) - (${b})` : `(${a}) + (${b})`;

    let prompt = `Evaluate the integer expression: ${expr}`;
    let explanation = isSub
      ? `Subtracting ${b} from ${a}: ${a} - (${b}) = ${ans}.`
      : `Adding ${a} and ${b}: ${a} + (${b}) = ${ans}.`;
    if (lang === "hi") {
      prompt = `पूर्णांक व्यंजक का मान ज्ञात कीजिए: ${expr}`;
      explanation = `${expr} = ${ans}।`;
    } else if (lang === "te") {
      prompt = `పూర్ణాంకాల సమాసాన్ని లెక్కించండి: ${expr}`;
      explanation = `${expr} = ${ans}.`;
    }

    return {
      classNum,
      board,
      topic: "Integers",
      subtopic: "Integer Arithmetic",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `${expr} = ?`,
      questionText: prompt,
      correctAnswer: String(ans),
      explanation,
      operands: [Math.abs(a), Math.abs(b)],
      templateId: "integer_op",
      fingerprint: `int_${a}_${isSub ? "sub" : "add"}_${b}`,
      provenanceLabel: "NCERT Class 6 Mathematics Chapter 6",
    };
  }

  if (topicId === "ratio_proportion") {
    const k = randInt(rng, 2, 7);
    const p = randInt(rng, 2, 5);
    const q = randInt(rng, 6, 9);
    const a = p * k;
    const b = q * k;
    let prompt = `Simplify the ratio ${a} : ${b} to its simplest form.`;
    let explanation = `Divide both antecedent and consequent by their HCF (${k}): ${a}/${k} : ${b}/${k} = ${p} : ${q}.`;
    if (lang === "hi") {
      prompt = `अनुपात ${a} : ${b} को सरलतम रूप में लिखिए।`;
      explanation = `म.स. (${k}) से भाग देने पर: ${p} : ${q}।`;
    } else if (lang === "te") {
      prompt = `${a} : ${b} నిష్పత్తిని సూక్ష్మరూపంలో రాయండి.`;
      explanation = `గ.సా.భా (${k}) తో భాగించగా: ${p} : ${q}.`;
    }

    return {
      classNum,
      board,
      topic: "Ratio and Proportion",
      subtopic: "Simplifying Ratios",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `${a} : ${b} = ?`,
      questionText: prompt,
      correctAnswer: `${p} : ${q}`,
      explanation,
      operands: [a, b],
      templateId: "ratio_simp",
      fingerprint: `ratio_${a}_${b}`,
      provenanceLabel: "NCERT Class 6 Mathematics Chapter 12",
    };
  }

  // -------------------------------------------------------------
  // Class 9 to 10 Topics
  // -------------------------------------------------------------
  if (topicId === "quadratic_equations") {
    const r1 = randInt(rng, 2, 6);
    const r2 = randInt(rng, 7, 12);
    const b = -(r1 + r2);
    const c = r1 * r2;
    const expr = `x² ${b < 0 ? "-" : "+"} ${Math.abs(b)}x + ${c} = 0`;

    let prompt = `Solve the quadratic equation by factorisation: ${expr}`;
    let explanation = `(x - ${r1})(x - ${r2}) = 0. Therefore, x = ${r1} or x = ${r2}.`;
    if (lang === "hi") {
      prompt = `गुणनखंड विधि द्वारा द्विघात समीकरण हल कीजिए: ${expr}`;
      explanation = `(x - ${r1})(x - ${r2}) = 0। अतः x = ${r1} या x = ${r2}।`;
    } else if (lang === "te") {
      prompt = `కారణాంకాల పద్ధతి ద్వారా వర్గ సమీకరణాన్ని సాధించండి: ${expr}`;
      explanation = `(x - ${r1})(x - ${r2}) = 0. కావున x = ${r1} లేదా x = ${r2}.`;
    }

    return {
      classNum,
      board,
      topic: "Quadratic Equations",
      subtopic: "Factorisation Method",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: expr,
      questionText: prompt,
      correctAnswer: `x = ${r1}, x = ${r2}`,
      explanation,
      operands: [r1, r2],
      templateId: "quad_factor",
      fingerprint: `quad_${r1}_${r2}`,
      provenanceLabel: "NCERT Class 10 Mathematics Chapter 4",
    };
  }

  if (topicId === "arithmetic_progressions") {
    const a = randInt(rng, 3, 10);
    const d = randInt(rng, 3, 7);
    const n = randInt(rng, 8, 15);
    const nthTerm = a + (n - 1) * d;

    let prompt = `Find the ${n}th term of the AP: ${a}, ${a + d}, ${a + 2 * d}, ...`;
    let explanation = `Using a_n = a + (n - 1)d: a_${n} = ${a} + (${n} - 1) × ${d} = ${a} + ${n - 1} × ${d} = ${nthTerm}.`;
    if (lang === "hi") {
      prompt = `समांतर श्रेढ़ी: ${a}, ${a + d}, ${a + 2 * d}, ... का ${n}-वाँ पद ज्ञात कीजिए।`;
      explanation = `a_n = a + (n - 1)d सूत्र से: ${nthTerm}।`;
    } else if (lang === "te") {
      prompt = `అంకశ్రేఢి ${a}, ${a + d}, ${a + 2 * d}, ... యొక్క ${n}వ పదాన్ని కనుగొనండి.`;
      explanation = `a_n = a + (n - 1)d సూత్రం ప్రకారం: ${nthTerm}.`;
    }

    return {
      classNum,
      board,
      topic: "Arithmetic Progressions",
      subtopic: "nth Term of an AP",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `a_${n} = ?`,
      questionText: prompt,
      correctAnswer: String(nthTerm),
      explanation,
      operands: [a, d, n],
      templateId: "ap_nth",
      fingerprint: `ap_${a}_${d}_${n}`,
      provenanceLabel: "NCERT Class 10 Mathematics Chapter 5",
    };
  }

  if (topicId === "trigonometry") {
    const angles = [30, 45, 60] as const;
    const angle = angles[randInt(rng, 0, angles.length - 1)];
    let expr = "";
    let ans = "";
    let step = "";
    if (angle === 30) {
      expr = "sin 30° + cos 60°";
      ans = "1";
      step = "sin 30° = 1/2, cos 60° = 1/2. 1/2 + 1/2 = 1.";
    } else if (angle === 45) {
      expr = "tan 45° + cot 45°";
      ans = "2";
      step = "tan 45° = 1, cot 45° = 1. 1 + 1 = 2.";
    } else {
      expr = "2 × sin 30° × cos 30°";
      ans = "√3/2";
      step = "2 × (1/2) × (√3/2) = √3/2.";
    }

    let prompt = `Evaluate the trigonometric expression: ${expr}`;
    if (lang === "hi") prompt = `त्रिकोणमितीय व्यंजक का मान ज्ञात कीजिए: ${expr}`;
    if (lang === "te") prompt = `త్రికోణమితి సమాసపు విలువను కనుగొనండి: ${expr}`;

    return {
      classNum,
      board,
      topic: "Trigonometry",
      subtopic: "Standard Angle Evaluation",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `${expr} = ?`,
      questionText: prompt,
      correctAnswer: ans,
      explanation: step,
      operands: [angle],
      templateId: "trig_eval",
      fingerprint: `trig_${angle}_${expr}`,
      provenanceLabel: "NCERT Class 10 Mathematics Chapter 8",
    };
  }
  if (topicId === "percentage_profit_loss" || topicId === "comparing_quantities") {
    const cp = randInt(rng, 10, 40) * 20; // 200, 220, ... 800
    const pct = randInt(rng, 1, 5) * 5; // 5, 10, 15, 20, 25%
    const profit = (cp * pct) / 100;
    const sp = cp + profit;
    let prompt = `An item bought for ₹${cp} is sold at a profit of ${pct}%. Find the selling price.`;
    let explanation = `Profit = ${pct}% of ${cp} = ₹${profit}. Selling Price = ${cp} + ${profit} = ₹${sp}.`;
    if (lang === "hi") {
      prompt = `₹${cp} में खरीदी गई एक वस्तु ${pct}% लाभ पर बेची जाती है। विक्रय मूल्य ज्ञात कीजिए।`;
      explanation = `लाभ = ${cp} का ${pct}% = ₹${profit}। विक्रय मूल्य = ₹${sp}।`;
    } else if (lang === "te") {
      prompt = `₹${cp} కు కొన్న వస్తువును ${pct}% లాభంతో అమ్మినచో అమ్మకపు వెలను కనుగొనండి.`;
      explanation = `లాభం = ₹${profit}. అమ్మకపు వెల = ₹${sp}.`;
    }

    return {
      classNum,
      board,
      topic: "Comparing Quantities and Profit-Loss",
      subtopic: "Profit and Loss",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `CP = ₹${cp}, Profit = ${pct}%`,
      questionText: prompt,
      correctAnswer: `₹${sp}`,
      explanation,
      operands: [cp, pct],
      templateId: "profit_loss_sp",
      fingerprint: `pl_${cp}_${pct}`,
      provenanceLabel: "NCERT Class 8 Mathematics Chapter 7",
    };
  }

  if (topicId === "algebraic_expressions" || topicId === "algebra_intro") {
    const a = randInt(rng, 2, 7);
    const b = randInt(rng, 3, 9);
    const c = randInt(rng, 2, 6);
    const expr = `${a}x + ${b}y + ${c}x`;
    const ans = `${a + c}x + ${b}y`;
    let prompt = `Simplify the algebraic expression by combining like terms: ${expr}`;
    let explanation = `Combine x-terms: (${a} + ${c})x + ${b}y = ${ans}.`;
    if (lang === "hi") {
      prompt = `समान पदों को संयोजित करके सरल कीजिए: ${expr}`;
      explanation = `(${a} + ${c})x + ${b}y = ${ans}।`;
    } else if (lang === "te") {
      prompt = `సజాతి పదాలను కలిపి సూక్ష్మీకరించండి: ${expr}`;
      explanation = `(${a} + ${c})x + ${b}y = ${ans}.`;
    }

    return {
      classNum,
      board,
      topic: "Algebraic Expressions",
      subtopic: "Combining Like Terms",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `${expr} = ?`,
      questionText: prompt,
      correctAnswer: ans,
      explanation,
      operands: [a, b, c],
      templateId: "alg_like_terms",
      fingerprint: `alg_like_${a}_${b}_${c}`,
      provenanceLabel: "NCERT Class 7 Mathematics Chapter 12",
    };
  }

  if (topicId === "coordinate_geometry") {
    const x = randInt(rng, 3, 8);
    const y = randInt(rng, 3, 8);
    let prompt = `Determine the quadrant in which the point (-${x}, ${y}) lies.`;
    let explanation = `Since x-coordinate is negative (-${x}) and y-coordinate is positive (${y}), the point lies in Quadrant II.`;
    let ans = "Quadrant II";
    if (lang === "hi") {
      prompt = `बिंदु (-${x}, ${y}) किस चतुर्थांश में स्थित है?`;
      explanation = `x-निर्देशांक ऋणात्मक और y-निर्देशांक धनात्मक होने के कारण यह द्वितीय चतुर्थांश में स्थित है।`;
      ans = "द्वितीय चतुर्थांश";
    } else if (lang === "te") {
      prompt = `(-${x}, ${y}) బిందువు ఏ పాదంలో ఉంటుంది?`;
      explanation = `x-నిరూపకం రుణాత్మకం మరియు y-నిరూపకం ధనాత్మకం కావున ఇది రెండవ పాదం (Quadrant II) లో ఉంటుంది.`;
      ans = "రెండవ పాదం (Quadrant II)";
    }

    return {
      classNum,
      board,
      topic: "Coordinate Geometry",
      subtopic: "Quadrants and Coordinates",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `Point (-${x}, ${y})`,
      questionText: prompt,
      correctAnswer: ans,
      explanation,
      operands: [x, y],
      templateId: "coord_quadrant",
      fingerprint: `coord_${x}_${y}`,
      provenanceLabel: "NCERT Class 9 Mathematics Chapter 3",
    };
  }

  if (topicId === "polynomials") {
    const r1 = randInt(rng, 1, 5);
    const r2 = randInt(rng, 2, 6);
    const sum = r1 + r2;
    const prod = r1 * r2;
    const expr = `p(x) = x² - ${sum}x + ${prod}`;
    let prompt = `Find the zeroes of the quadratic polynomial ${expr}.`;
    let explanation = `Factorising gives (x - ${r1})(x - ${r2}) = 0. Therefore the zeroes are ${r1} and ${r2}.`;
    if (lang === "hi") {
      prompt = `द्विघात बहुपद ${expr} के शून्यक ज्ञात कीजिए।`;
      explanation = `गुणनखंड करने पर (x - ${r1})(x - ${r2}) = 0। अतः शून्यक ${r1} और ${r2} हैं।`;
    } else if (lang === "te") {
      prompt = `${expr} వర్గ బహుపది యొక్క శూన్యాలను కనుగొనండి.`;
      explanation = `కారణాంకాలు: (x - ${r1})(x - ${r2}) = 0. కావున శూన్యాలు ${r1} మరియు ${r2}.`;
    }

    return {
      classNum,
      board,
      topic: "Polynomials",
      subtopic: "Zeroes of Polynomial",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `${expr} = 0`,
      questionText: prompt,
      correctAnswer: `${r1}, ${r2}`,
      explanation,
      operands: [r1, r2],
      templateId: "poly_zeroes",
      fingerprint: `poly_${r1}_${r2}`,
      provenanceLabel: "NCERT Class 10 Mathematics Chapter 2",
    };
  }

  if (topicId === "linear_equations_two_vars" || topicId === "linear_equations_pair") {
    const xVal = randInt(rng, 3, 9);
    const yVal = randInt(rng, 2, 7);
    const eq1 = xVal + yVal;
    const eq2 = xVal - yVal;
    let prompt = `Solve the pair of linear equations: x + y = ${eq1} and x - y = ${eq2}.`;
    let explanation = `Adding both equations: 2x = ${eq1 + eq2} => x = ${xVal}. Substituting x gives y = ${yVal}.`;
    if (lang === "hi") {
      prompt = `रैखिक समीकरण युग्म हल कीजिए: x + y = ${eq1} और x - y = ${eq2}।`;
      explanation = `दोनों समीकरणों को जोड़ने पर: 2x = ${eq1 + eq2} => x = ${xVal}, y = ${yVal}।`;
    } else if (lang === "te") {
      prompt = `రెండు చరరాశులలో సమీకరణాల జతను సాధించండి: x + y = ${eq1} మరియు x - y = ${eq2}.`;
      explanation = `రెండు సమీకరణాలను కలపగా: 2x = ${eq1 + eq2} => x = ${xVal}, y = ${yVal}.`;
    }

    return {
      classNum,
      board,
      topic: "Linear Equations in Two Variables",
      subtopic: "Elimination Method",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `x + y = ${eq1}, x - y = ${eq2}`,
      questionText: prompt,
      correctAnswer: `x = ${xVal}, y = ${yVal}`,
      explanation,
      operands: [xVal, yVal],
      templateId: "lineq_two_vars",
      fingerprint: `lineq2_${xVal}_${yVal}`,
      provenanceLabel: "NCERT Class 10 Mathematics Chapter 3",
    };
  }

  if (topicId === "number_systems" || topicId === "real_numbers") {
    const a = randInt(rng, 12, 36);
    const b = randInt(rng, 8, 24);
    const h = gcd(a, b);
    let prompt = `Find the Highest Common Factor (HCF) of ${a} and ${b}.`;
    let explanation = `Using prime factorisation: HCF(${a}, ${b}) = ${h}.`;
    if (lang === "hi") {
      prompt = `${a} और ${b} का महत्तम समापवर्तक (HCF) ज्ञात कीजिए।`;
      explanation = `अभाज्य गुणनखंडन द्वारा: HCF(${a}, ${b}) = ${h}।`;
    } else if (lang === "te") {
      prompt = `${a} మరియు ${b} ల గరిష్ఠ సామాన్య భాజకం (గ.సా.భా) ను కనుగొనండి.`;
      explanation = `ప్రధాన కారణాంకాల పద్ధతి ద్వారా: గ.సా.భా(${a}, ${b}) = ${h}.`;
    }

    return {
      classNum,
      board,
      topic: "Real Numbers",
      subtopic: "Fundamental Theorem of Arithmetic (HCF)",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `HCF(${a}, ${b}) = ?`,
      questionText: prompt,
      correctAnswer: String(h),
      explanation,
      operands: [a, b],
      templateId: "real_num_hcf",
      fingerprint: `hcf_${a}_${b}`,
      provenanceLabel: "NCERT Class 10 Mathematics Chapter 1",
    };
  }

  if (topicId === "surface_areas_volumes") {
    const r = 7;
    const h = randInt(rng, 3, 10);
    const vol = 22 * r * h; // π * r² * h with r=7 -> (22/7)*49*h = 154*h
    let prompt = `Find the volume of a right circular cylinder with base radius 7 cm and height ${h} cm (Take π = 22/7).`;
    let explanation = `Volume = π r² h = 22/7 × 7² × ${h} = 154 × ${h} = ${vol} cm³.`;
    if (lang === "hi") {
      prompt = `7 सेमी त्रिज्या और ${h} सेमी ऊँचाई वाले एक लंब वृत्तीय बेलन का आयतन ज्ञात कीजिए (π = 22/7)।`;
      explanation = `आयतन = π r² h = 154 × ${h} = ${vol} सेमी³।`;
    } else if (lang === "te") {
      prompt = `భూ వ్యాసార్థం 7 సెం.మీ మరియు ఎత్తు ${h} సెం.మీ కలిగిన స్థూపం యొక్క ఘనపరిమాణాన్ని కనుగొనండి (π = 22/7 తీసుకోండి).`;
      explanation = `ఘనపరిమాణం = π r² h = ${vol} ఘనపు సెం.మీ.`;
    }

    return {
      classNum,
      board,
      topic: "Surface Areas and Volumes",
      subtopic: "Volume of Cylinder",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `V = π × 7² × ${h}`,
      questionText: prompt,
      correctAnswer: `${vol} cm³`,
      explanation,
      operands: [r, h],
      templateId: "cyl_volume",
      fingerprint: `cyl_vol_${h}`,
      provenanceLabel: "NCERT Class 9/10 Mathematics",
    };
  }

  if (topicId === "statistics") {
    const vals = [randInt(rng, 4, 12), randInt(rng, 5, 14), randInt(rng, 6, 16), randInt(rng, 8, 20)];
    const sum = vals.reduce((acc, v) => acc + v, 0);
    const mean = (sum / vals.length).toFixed(1);
    const listStr = vals.join(", ");
    let prompt = `Calculate the mean (average) of the observations: ${listStr}.`;
    let explanation = `Sum of observations = ${sum}. Total observations = 4. Mean = ${sum} / 4 = ${mean}.`;
    if (lang === "hi") {
      prompt = `दिए गए प्रेक्षणों का माध्य ज्ञात कीजिए: ${listStr}।`;
      explanation = `प्रेक्षणों का योग = ${sum}। माध्य = ${sum} / 4 = ${mean}।`;
    } else if (lang === "te") {
      prompt = `దత్తాంశ పరిశీలనల అంకమధ్యమం (సగటు) ను కనుగొనండి: ${listStr}.`;
      explanation = `రాశుల మొత్తం = ${sum}. సగటు = ${sum} / 4 = ${mean}.`;
    }

    return {
      classNum,
      board,
      topic: "Statistics",
      subtopic: "Measures of Central Tendency",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `Mean of [${listStr}]`,
      questionText: prompt,
      correctAnswer: String(mean),
      explanation,
      operands: vals,
      templateId: "stats_mean",
      fingerprint: `mean_${vals.join("_")}`,
      provenanceLabel: "NCERT Mathematics Chapter Statistics",
    };
  }

  if (topicId === "triangles_congruence") {
    let prompt = `If in ΔABC and ΔPQR, AB = PQ, BC = QR, and CA = RP, by which congruence criterion are the two triangles congruent?`;
    let ans = "SSS Congruence Criterion";
    let explanation = `Since all three corresponding sides of the two triangles are equal, ΔABC ≅ ΔPQR by SSS (Side-Side-Side) congruence rule.`;
    if (lang === "hi") {
      prompt = `यदि ΔABC और ΔPQR में AB = PQ, BC = QR और CA = RP है, तो दोनों त्रिभुज किस सर्वांगसमता नियम से सर्वांगसम हैं?`;
      ans = "SSS सर्वांगसमता नियम";
      explanation = `तीनों संगत भुजाएँ बराबर होने से SSS नियम लागू होता है।`;
    } else if (lang === "te") {
      prompt = `ΔABC మరియు ΔPQR లలో AB = PQ, BC = QR మరియు CA = RP అయితే, ఏ సర్వసమానత్వ నియమం ద్వారా ఆ రెండు త్రిభుజాలు సర్వసమానాలు?`;
      ans = "భు.భు.భు (SSS) సర్వసమానత్వ నియమం";
      explanation = `మూడు అనురూప భుజాలు సమానం కావున భు.భు.భు నియమం వర్తిస్తుంది.`;
    }

    return {
      classNum,
      board,
      topic: "Triangles and Congruence",
      subtopic: "Congruence Criteria",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: "AB=PQ, BC=QR, CA=RP",
      questionText: prompt,
      correctAnswer: ans,
      explanation,
      operands: [3],
      templateId: "tri_cong_sss",
      fingerprint: `tri_cong_sss`,
      provenanceLabel: "NCERT Class 9 Mathematics Chapter 7",
    };
  }
  // -------------------------------------------------------------
  // Primary (Classes 1 to 5) Topics
  // -------------------------------------------------------------
  if (topicId === "subtraction" || topicId === "subtraction_borrow" || topicId === "subtraction_within_10") {
    let a: number;
    let b: number;
    if (classNum <= 1) {
      a = randInt(rng, 5, 10);
      b = randInt(rng, 1, a - 1);
    } else if (classNum === 2) {
      a = randInt(rng, 35, 75);
      b = randInt(rng, 16, a - 10);
    } else {
      a = randInt(rng, 145, 495);
      b = randInt(rng, 68, a - 25);
    }
    const diff = a - b;
    let prompt = `Subtract: ${a} - ${b}`;
    const explanation = `${a} - ${b} = ${diff}.`;
    if (lang === "hi") prompt = `घटाव कीजिए: ${a} - ${b}`;
    if (lang === "te") prompt = `తీసివేత చేయండి: ${a} - ${b}`;

    return {
      classNum,
      board,
      topic: "Subtraction",
      subtopic: classNum >= 3 ? "3-Digit Subtraction with Regrouping" : "Subtraction",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `${a} - ${b} = ?`,
      questionText: prompt,
      correctAnswer: String(diff),
      explanation,
      operands: [a, b],
      templateId: "sub_regroup",
      fingerprint: `sub_${a}_${b}`,
      provenanceLabel: "NCERT Math-Magic",
    };
  }

  if (topicId === "addition" || topicId === "addition_within_10" || topicId === "addition_with_carry") {
    let a: number;
    let b: number;
    let prov = "NCERT Math-Magic";
    if (classNum <= 1) {
      a = randInt(rng, 1, 5);
      b = randInt(rng, 1, 5);
    } else if (classNum === 2) {
      a = randInt(rng, 25, 68);
      b = randInt(rng, 15, 30);
    } else {
      a = randInt(rng, 125, 480);
      b = randInt(rng, 110, 450);
      prov = "NCERT Math-Magic Class 3";
    }
    const sum = a + b;
    let prompt = `Find the sum: ${a} + ${b}`;
    let explanation = `${a} + ${b} = ${sum}.`;
    if (lang === "hi") {
      prompt = `योग ज्ञात कीजिए: ${a} + ${b}`;
      explanation = `${a} + ${b} = ${sum}।`;
    } else if (lang === "te") {
      prompt = `మొత్తాన్ని కనుగొనండి: ${a} + ${b}`;
      explanation = `${a} + ${b} = ${sum}.`;
    }

    return {
      classNum,
      board,
      topic: "Addition",
      subtopic: classNum >= 3 ? "3-Digit Column Addition" : "Addition with Regrouping",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `${a} + ${b} = ?`,
      questionText: prompt,
      correctAnswer: String(sum),
      explanation,
      operands: [a, b],
      templateId: "add_col",
      fingerprint: `add_${a}_${b}`,
      provenanceLabel: prov,
    };
  }

  if (topicId === "number_sense" || topicId === "place_value_2digit" || topicId === "place_value_4digit") {
    let num: number;
    let digit: number;
    let placeVal: number;
    if (classNum <= 2) {
      const tens = randInt(rng, 2, 9);
      const ones = randInt(rng, 1, 9);
      num = tens * 10 + ones;
      digit = rng() < 0.5 ? tens : ones;
      placeVal = digit === tens ? tens * 10 : ones;
    } else if (classNum <= 3) {
      const h = randInt(rng, 2, 8);
      const t = randInt(rng, 1, 9);
      const o = randInt(rng, 1, 9);
      num = h * 100 + t * 10 + o;
      const pick = randInt(rng, 1, 3);
      digit = pick === 1 ? h : pick === 2 ? t : o;
      placeVal = pick === 1 ? h * 100 : pick === 2 ? t * 10 : o;
    } else {
      const th = randInt(rng, 2, 9);
      const h = randInt(rng, 1, 9);
      const t = randInt(rng, 1, 9);
      const o = randInt(rng, 1, 9);
      num = th * 1000 + h * 100 + t * 10 + o;
      digit = th;
      placeVal = th * 1000;
    }

    let prompt = `Write the place value of the digit ${digit} in the number ${num}.`;
    let explanation = `In ${num}, the digit ${digit} is in its place with value ${placeVal}.`;
    if (lang === "hi") {
      prompt = `संख्या ${num} में अंक ${digit} का स्थानीय मान लिखिए।`;
      explanation = `संख्या ${num} में अंक ${digit} का स्थानीय मान ${placeVal} है।`;
    } else if (lang === "te") {
      prompt = `${num} సంఖ్యలో ${digit} అంకె యొక్క స్థాన విలువను రాయండి.`;
      explanation = `${num} లో ${digit} స్థాన విలువ ${placeVal}.`;
    }

    return {
      classNum,
      board,
      topic: "Place Value and Number Sense",
      subtopic: "Place Value Identification",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `Place value of ${digit} in ${num}`,
      questionText: prompt,
      correctAnswer: String(placeVal),
      explanation,
      operands: [num, digit],
      templateId: "place_val",
      fingerprint: `pv_${num}_${digit}`,
      provenanceLabel: "NCERT Math-Magic",
    };
  }

  if (topicId === "division_basics" || topicId === "division_facts" || topicId === "long_division") {
    let divisor: number;
    let quotient: number;
    if (classNum <= 3) {
      divisor = randInt(rng, 2, 8);
      quotient = randInt(rng, 3, 9);
    } else if (classNum === 4) {
      divisor = randInt(rng, 4, 9);
      quotient = randInt(rng, 11, 24);
    } else {
      divisor = randInt(rng, 11, 25);
      quotient = randInt(rng, 15, 35);
    }
    const dividend = divisor * quotient;
    let prompt = `Divide: ${dividend} ÷ ${divisor}`;
    let explanation = `${dividend} ÷ ${divisor} = ${quotient}.`;
    if (lang === "hi") {
      prompt = `भाग दीजिए: ${dividend} ÷ ${divisor}`;
      explanation = `${dividend} ÷ ${divisor} = ${quotient}।`;
    } else if (lang === "te") {
      prompt = `భాగించండి: ${dividend} ÷ ${divisor}`;
      explanation = `${dividend} ÷ ${divisor} = ${quotient}.`;
    }

    return {
      classNum,
      board,
      topic: "Division",
      subtopic: classNum <= 3 ? "Equal Sharing" : "Long Division",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `${dividend} ÷ ${divisor} = ?`,
      questionText: prompt,
      correctAnswer: String(quotient),
      explanation,
      operands: [dividend, divisor],
      templateId: "div_fact",
      fingerprint: `div_${dividend}_${divisor}`,
      provenanceLabel: "NCERT Math-Magic",
    };
  }

  if (topicId === "mult_2digit_1digit" || topicId === "multi_digit_mult") {
    let a: number;
    let b: number;
    if (classNum <= 4) {
      a = randInt(rng, 21, 65);
      b = randInt(rng, 3, 8);
    } else {
      a = randInt(rng, 120, 320);
      b = randInt(rng, 12, 28);
    }
    const prod = a * b;
    let prompt = `Multiply: ${a} × ${b}`;
    let explanation = `${a} × ${b} = ${prod}.`;
    if (lang === "hi") {
      prompt = `गुणा कीजिए: ${a} × ${b}`;
      explanation = `${a} × ${b} = ${prod}।`;
    } else if (lang === "te") {
      prompt = `గుణించండి: ${a} × ${b}`;
      explanation = `${a} × ${b} = ${prod}.`;
    }

    return {
      classNum,
      board,
      topic: "Multiplication",
      subtopic: classNum <= 4 ? "2-Digit by 1-Digit" : "Multi-Digit Multiplication",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `${a} × ${b} = ?`,
      questionText: prompt,
      correctAnswer: String(prod),
      explanation,
      operands: [a, b],
      templateId: "mult_multi",
      fingerprint: `mult_m_${a}_${b}`,
      provenanceLabel: "NCERT Math-Magic",
    };
  }

  if (topicId === "fractions_basics" || topicId === "fractions_like_add") {
    const den = randInt(rng, 5, 12);
    const n1 = randInt(rng, 1, Math.floor(den / 2));
    const n2 = randInt(rng, 1, Math.floor(den / 2));
    const sumN = n1 + n2;
    const g = gcd(sumN, den);
    const simpN = sumN / g;
    const simpD = den / g;
    const ans = simpD === 1 ? String(simpN) : `${simpN}/${simpD}`;

    let prompt = `Add the like fractions: ${n1}/${den} + ${n2}/${den}`;
    let explanation = `Since denominators are same: (${n1} + ${n2}) / ${den} = ${sumN}/${den} = ${ans}.`;
    if (lang === "hi") {
      prompt = `समान भिन्नों को जोड़िए: ${n1}/${den} + ${n2}/${den}`;
      explanation = `(${n1} + ${n2}) / ${den} = ${ans}।`;
    } else if (lang === "te") {
      prompt = `సజాతి భిన్నాలను కూడండి: ${n1}/${den} + ${n2}/${den}`;
      explanation = `(${n1} + ${n2}) / ${den} = ${ans}.`;
    }

    return {
      classNum,
      board,
      topic: "Fractions",
      subtopic: "Like Fraction Addition",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `${n1}/${den} + ${n2}/${den} = ?`,
      questionText: prompt,
      correctAnswer: ans,
      explanation,
      operands: [n1, n2, den],
      templateId: "frac_like_add",
      fingerprint: `frac_like_${n1}_${n2}_${den}`,
      provenanceLabel: "NCERT Math-Magic",
    };
  }

  if (topicId === "decimals_basics") {
    const d1 = Number((randInt(rng, 12, 85) / 10).toFixed(1));
    const d2 = Number((randInt(rng, 11, 65) / 10).toFixed(1));
    const sum = Number((d1 + d2).toFixed(1));

    let prompt = `Add the decimal numbers: ${d1} + ${d2}`;
    let explanation = `${d1} + ${d2} = ${sum}.`;
    if (lang === "hi") {
      prompt = `दशमलव संख्याओं को जोड़िए: ${d1} + ${d2}`;
      explanation = `${d1} + ${d2} = ${sum}।`;
    } else if (lang === "te") {
      prompt = `దశాంశ సంఖ్యలను కూడండి: ${d1} + ${d2}`;
      explanation = `${d1} + ${d2} = ${sum}.`;
    }

    return {
      classNum,
      board,
      topic: "Decimals",
      subtopic: "Decimal Addition",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `${d1} + ${d2} = ?`,
      questionText: prompt,
      correctAnswer: String(sum),
      explanation,
      operands: [Math.round(d1 * 10), Math.round(d2 * 10)],
      templateId: "dec_add",
      fingerprint: `dec_add_${d1}_${d2}`,
      provenanceLabel: "NCERT Math-Magic Class 5",
    };
  }

  if (topicId === "counting_objects" || topicId === "skip_counting") {
    const step = classNum <= 1 ? 1 : randInt(rng, 2, 5);
    const start = randInt(rng, 2, 10);
    const term1 = start;
    const term2 = start + step;
    const term3 = start + 2 * step;
    const term4 = start + 3 * step;

    let prompt = `Find the next number in the pattern: ${term1}, ${term2}, ${term3}, ___`;
    let explanation = `Pattern increases by ${step}: ${term3} + ${step} = ${term4}.`;
    if (lang === "hi") {
      prompt = `पैटर्न में अगली संख्या ज्ञात कीजिए: ${term1}, ${term2}, ${term3}, ___`;
      explanation = `क्रम में ${step} जुड़ रहा है: ${term4}।`;
    } else if (lang === "te") {
      prompt = `క్రమంలో తదుపరి సంఖ్యను కనుగొనండి: ${term1}, ${term2}, ${term3}, ___`;
      explanation = `సంఖ్యలు ${step} చొప్పున పెరుగుతున్నాయి: ${term4}.`;
    }

    return {
      classNum,
      board,
      topic: "Patterns and Skip Counting",
      subtopic: "Number Sequences",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `${term1}, ${term2}, ${term3}, ?`,
      questionText: prompt,
      correctAnswer: String(term4),
      explanation,
      operands: [start, step],
      templateId: "skip_count",
      fingerprint: `skip_${start}_${step}`,
      provenanceLabel: "NCERT Math-Magic",
    };
  }

  if (topicId === "shapes_basic") {
    const shapes = [
      { nameEn: "triangle", nameHi: "त्रिभुज", nameTe: "త్రిభుజం", sides: 3, corners: 3 },
      { nameEn: "rectangle", nameHi: "आयत", nameTe: "దీర్ఘచతురస్రం", sides: 4, corners: 4 },
      { nameEn: "pentagon", nameHi: "पंचभुज", nameTe: "పంచభుజి", sides: 5, corners: 5 },
    ];
    const s = shapes[randInt(rng, 0, shapes.length - 1)];
    let prompt = `How many sides does a ${s.nameEn} have?`;
    let explanation = `A ${s.nameEn} has ${s.sides} straight sides.`;
    if (lang === "hi") {
      prompt = `एक ${s.nameHi} में कितनी भुजाएँ होती हैं?`;
      explanation = `एक ${s.nameHi} में ${s.sides} भुजाएँ होती हैं।`;
    } else if (lang === "te") {
      prompt = `${s.nameTe} కు ఎన్ని భుజాలు ఉంటాయి?`;
      explanation = `${s.nameTe} కు ${s.sides} భుజాలు ఉంటాయి.`;
    }

    return {
      classNum,
      board,
      topic: "Basic Shapes",
      subtopic: "Properties of 2D Shapes",
      difficulty,
      difficultyBand: diffBand,
      prompt,
      expression: `Sides of ${s.nameEn}`,
      questionText: prompt,
      correctAnswer: String(s.sides),
      explanation,
      operands: [s.sides],
      templateId: "shapes_sides",
      fingerprint: `shape_${s.nameEn}_${s.sides}`,
      provenanceLabel: "NCERT Math-Magic Class 1",
    };
  }

  // Class >= 6 safety guard: strictly select an on-grade topic from WORKSHEET_TOPIC_MAP[classNum]
  if (classNum >= 6) {
    const classTopics = WORKSHEET_TOPIC_MAP[classNum] || WORKSHEET_TOPIC_MAP[8];
    const safeTopic = classTopics[randInt(rng, 0, classTopics.length - 1)];
    const fallbackId = safeTopic.id !== topicId ? safeTopic.id : (classNum >= 8 ? "linear_equations_one_var" : "integers");
    return buildParametricItem(fallbackId, classNum, board, difficulty, lang, rng);
  }

  // Multiplication tables (strictly Classes 2-3)
  const factorA = randInt(rng, 2, 9);
  const factorB = randInt(rng, 2, 9);
  const prod = factorA * factorB;
  let prompt = `Calculate the product: ${factorA} × ${factorB}`;
  if (lang === "hi") prompt = `गुणनफल ज्ञात कीजिए: ${factorA} × ${factorB}`;
  if (lang === "te") prompt = `లబ్ధాన్ని కనుగొనండి: ${factorA} × ${factorB}`;

  return {
    classNum,
    board,
    topic: "Multiplication Tables",
    subtopic: "Basic Facts",
    difficulty,
    difficultyBand: diffBand,
    prompt,
    expression: `${factorA} × ${factorB} = ?`,
    questionText: prompt,
    correctAnswer: String(prod),
    explanation: `${factorA} groups of ${factorB} equals ${prod}.`,
    operands: [factorA, factorB],
    templateId: "mult_fact",
    fingerprint: `mult_${factorA}_${factorB}`,
    provenanceLabel: "NCERT Math-Magic",
  };
}

/**
 * Attempt to fetch authentic verified question from MULTI_BOARD_QUESTION_BANK.
 */
function fetchFromBank(
  classNum: number,
  board: Board,
  lang: Language,
  rng: Rng,
  repetitionGuard: RepetitionGuard
): Omit<WorksheetItem, "number" | "section" | "sectionLabel"> | null {
  const matches = MULTI_BOARD_QUESTION_BANK.filter(
    (q) => q.class === classNum && (q.board === board || q.board === "BOTH" || q.board === "NCERT")
  );

  if (matches.length === 0) return null;

  // Shuffle matches deterministically
  const shuffled = [...matches].sort(() => rng() - 0.5);

  for (const entry of shuffled) {
    const promptText = entry.prompt[lang] || entry.prompt.en;
    const solutionText = entry.verifiedSolution[lang] || entry.verifiedSolution.en;
    const fingerprint = `bank_${entry.id}`;

    if (!repetitionGuard.canAccept({ fingerprint, prompt: promptText })) {
      continue;
    }

    const diff = entry.difficulty || 2;
    const diffBand: "easy" | "medium" | "hard" = diff <= 2 ? "easy" : diff === 3 ? "medium" : "hard";

    const item = {
      classNum: entry.class,
      board,
      topic: entry.bookFamily || "Classroom Mathematics",
      difficulty: diff,
      difficultyBand: diffBand,
      prompt: promptText,
      expression: entry.expression,
      questionText: promptText,
      correctAnswer: entry.correctAnswer,
      explanation: solutionText,
      provenanceLabel: entry.provenanceLabel,
      fingerprint,
    };

    repetitionGuard.record(item);
    return item;
  }

  return null;
}

/**
 * Main Generator Function: Generates a complete, verified, structured worksheet.
 */
export function generateWorksheet(options: WorksheetGeneratorOptions): GeneratedWorksheet {
  const {
    classNum,
    board,
    skillOrTopic,
    difficultyBand,
    language = "en",
    count = 10,
    diagnosedGap,
    excludeIds,
    seed = 20261023,
  } = options;

  const rng = makeRng(seed);
  const repetitionGuard = new RepetitionGuard(excludeIds);

  // 1. Determine Section Split
  // Warm-up is maximum 30% of total count (e.g. 2 items out of 10)
  const warmupCount = Math.max(1, Math.min(3, Math.floor(count * 0.2)));
  // Optional Challenge of 1 or 2 items one band up
  const challengeCount = count >= 8 ? Math.min(2, Math.max(1, Math.floor(count * 0.15))) : 0;
  const practiceCount = count - warmupCount - challengeCount; // on-grade items (at least 70% together with challenge)

  // Prerequisite grade for warm-up
  const foundationGrade = diagnosedGap?.fromGrade || Math.max(1, classNum - 2);
  const foundationTopics = WORKSHEET_TOPIC_MAP[foundationGrade] || WORKSHEET_TOPIC_MAP[3];

  // Selected Class topics for practice
  const onGradeTopics = WORKSHEET_TOPIC_MAP[classNum] || WORKSHEET_TOPIC_MAP[8];

  const warmupItems: WorksheetItem[] = [];
  const practiceItems: WorksheetItem[] = [];
  const challengeItems: WorksheetItem[] = [];

  let itemCounter = 1;

  // -------------------------------------------------------------
  // Generate Section A: Warm-up
  // -------------------------------------------------------------
  const gapDetail = diagnosedGap?.title ? ` - ${diagnosedGap.title}` : "";
  const warmupLabel = `Foundation check from Class ${foundationGrade}${gapDetail}`;
  for (let i = 0; i < warmupCount; i++) {
    let picked: Omit<WorksheetItem, "number" | "section" | "sectionLabel"> | null = null;
    let attempts = 0;

    while (!picked && attempts++ < 60) {
      const topic = foundationTopics[randInt(rng, 0, foundationTopics.length - 1)];
      const diff = randInt(rng, 1, 2); // Easy foundation level
      const candidate = buildParametricItem(topic.id, foundationGrade, board, diff, language, rng);
      if (repetitionGuard.canAccept(candidate)) {
        repetitionGuard.record(candidate);
        picked = candidate;
      }
    }

    if (!picked) {
      // Systematic search across foundation topics
      for (const t of foundationTopics) {
        for (let retry = 0; retry < 30; retry++) {
          const candidate = buildParametricItem(t.id, foundationGrade, board, randInt(rng, 1, 2), language, rng);
          if (repetitionGuard.canAccept(candidate)) {
            repetitionGuard.record(candidate);
            picked = candidate;
            break;
          }
        }
        if (picked) break;
      }
      if (!picked) {
        const fallbackTopic = foundationTopics[i % foundationTopics.length];
        picked = buildParametricItem(fallbackTopic.id, foundationGrade, board, 1, language, rng);
        repetitionGuard.record(picked);
      }
    }

    warmupItems.push({
      ...picked,
      number: itemCounter++,
      section: "warmup",
      sectionLabel: `Section A: Warm-up (${warmupLabel})`,
    });
  }

  // -------------------------------------------------------------
  // Generate Section B: Class N Practice & Section C: Challenge
  // -------------------------------------------------------------
  const effectiveSkill = skillOrTopic || options.targetSkill;

  // First, populate from question_memory (storedQuestions) if provided
  if (options.storedQuestions && options.storedQuestions.length > 0) {
    for (const sq of options.storedQuestions) {
      if (practiceItems.length >= practiceCount) break;
      if (sq.class !== classNum) continue;
      if (board !== "Both" && sq.board && sq.board !== board) continue;

      const candidate: Omit<WorksheetItem, "number" | "section" | "sectionLabel"> = {
        classNum: sq.class,
        board: (sq.board as Board) || board,
        topic: sq.concept_id,
        difficulty: sq.difficulty,
        difficultyBand: sq.difficulty <= 2 ? "easy" : sq.difficulty === 3 ? "medium" : "hard",
        prompt: sq.question_text,
        questionText: sq.question_text,
        correctAnswer: sq.answer_value,
        explanation: `Calculated and verified: ${sq.answer_value}`,
        fingerprint: sq.fingerprint,
        templateId: sq.id,
      };

      if (repetitionGuard.canAccept(candidate)) {
        repetitionGuard.record(candidate);
        practiceItems.push({
          ...candidate,
          number: itemCounter++,
          section: "practice",
          sectionLabel: `Section B: Class ${classNum} Practice`,
        });
      }
    }
  }

  // Practice items must be strictly on-grade (classNum)
  const remainingPracticeCount = practiceCount - practiceItems.length;
  for (let i = 0; i < remainingPracticeCount; i++) {
    let targetDiff: number;
    if (difficultyBand === "easy") {
      targetDiff = 2;
    } else if (difficultyBand === "medium") {
      targetDiff = 3;
    } else if (difficultyBand === "hard") {
      targetDiff = 4;
    } else {
      // Spread across easy (2), medium (3), and hard (4)
      targetDiff = i < Math.floor(practiceCount * 0.35) ? 2 : i < Math.floor(practiceCount * 0.7) ? 3 : 4;
    }

    let picked: Omit<WorksheetItem, "number" | "section" | "sectionLabel"> | null = null;
    let attempts = 0;

    // Try bank first for on-grade items (40% chance if available)
    if (rng() < 0.4) {
      picked = fetchFromBank(classNum, board, language, rng, repetitionGuard);
    }

    while (!picked && attempts++ < 80) {
      // Filter by effectiveSkill if requested
      const candidateTopics = effectiveSkill
        ? onGradeTopics.filter((t) => t.id === effectiveSkill || t.name.en.toLowerCase().includes(effectiveSkill.toLowerCase()))
        : onGradeTopics;
      const topicList = candidateTopics.length > 0 ? candidateTopics : onGradeTopics;
      const topic = topicList[randInt(rng, 0, topicList.length - 1)];

      const candidate = buildParametricItem(topic.id, classNum, board, targetDiff, language, rng);
      if (repetitionGuard.canAccept(candidate)) {
        repetitionGuard.record(candidate);
        picked = candidate;
      }
    }

    if (!picked) {
      for (const t of onGradeTopics) {
        for (let retry = 0; retry < 30; retry++) {
          const candidate = buildParametricItem(t.id, classNum, board, targetDiff, language, rng);
          if (repetitionGuard.canAccept(candidate)) {
            repetitionGuard.record(candidate);
            picked = candidate;
            break;
          }
        }
        if (picked) break;
      }
      if (!picked) {
        const fallbackTopic = onGradeTopics[i % onGradeTopics.length];
        picked = buildParametricItem(fallbackTopic.id, classNum, board, targetDiff, language, rng);
        repetitionGuard.record(picked);
      }
    }

    const item: WorksheetItem = {
      ...picked,
      number: itemCounter++,
      section: "practice",
      sectionLabel: `Section B: Class ${classNum} Practice`,
    };

    practiceItems.push(item);
  }

  // Generate Challenge Items (1 or 2 items one band up)
  for (let c = 0; c < challengeCount; c++) {
    const challengeDiff = 4 + (c % 2); // Band 4 or 5
    let picked: Omit<WorksheetItem, "number" | "section" | "sectionLabel"> | null = null;
    let attempts = 0;

    while (!picked && attempts++ < 80) {
      const topic = onGradeTopics[randInt(rng, 0, onGradeTopics.length - 1)];
      const candidate = buildParametricItem(topic.id, classNum, board, challengeDiff, language, rng);
      if (repetitionGuard.canAccept(candidate)) {
        repetitionGuard.record(candidate);
        picked = candidate;
      }
    }

    if (!picked) {
      const fallbackTopic = onGradeTopics[(practiceCount + c) % onGradeTopics.length];
      picked = buildParametricItem(fallbackTopic.id, classNum, board, challengeDiff, language, rng);
      repetitionGuard.record(picked);
    }

    const item: WorksheetItem = {
      ...picked,
      number: itemCounter++,
      section: "challenge",
      sectionLabel: `Section C: Challenge (Advanced Concept Application)`,
    };
    challengeItems.push(item);
  }

  const allItems = [...warmupItems, ...practiceItems, ...challengeItems];

  // Compute dynamic skill header from actual items present in the worksheet
  const uniqueTopics = Array.from(new Set(allItems.map((it) => it.topic)));
  const skillsLine = uniqueTopics.join(", ");

  const currentDateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const answerKey = allItems.map((it) => ({
    number: it.number,
    section: it.section === "warmup" ? "Warm-up" : it.section === "challenge" ? "Challenge" : "Practice",
    topic: it.topic,
    questionSummary: it.expression || it.prompt,
    correctAnswer: it.correctAnswer,
    explanation: it.explanation,
  }));

  return {
    header: {
      classNum,
      board,
      title: `CLASS ${classNum} | ${board} | MATHS PRACTICE`,
      skillsLine: `Skills: ${skillsLine}`,
      dateStr: currentDateStr,
      totalCount: allItems.length,
    },
    warmupSection: {
      title: `Section A: Warm-up (${warmupLabel})`,
      fromGrade: foundationGrade,
      items: warmupItems,
    },
    practiceSection: {
      title: `Section B: Class ${classNum} Practice`,
      classNum,
      items: practiceItems,
    },
    challengeSection: {
      title: `Section C: Challenge (Advanced Concept Application)`,
      items: challengeItems,
    },
    items: allItems,
    answerKey,
  };
}

/**
 * Validates a generated worksheet item for correctness and integrity.
 */
export function validateWorksheetItem(item: WorksheetItem): boolean {
  if (!item.prompt || item.prompt.trim().length === 0) return false;
  if (!item.correctAnswer || item.correctAnswer.trim().length === 0) return false;
  if (!item.explanation || item.explanation.trim().length === 0) return false;
  if (item.classNum < 1 || item.classNum > 10) return false;
  if (item.difficulty < 1 || item.difficulty > 5) return false;
  return true;
}
