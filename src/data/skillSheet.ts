/**
 * NCERT Math-Magic Skill Sheet for Classes 3, 4, and 5
 *
 * Each concept defines:
 * - A single-sentence learning outcome in own words (no verbatim textbook copy).
 * - Exact allowed number ranges for difficulty levels 1, 2, and 3.
 * - Diagnostic prerequisites (root causes evaluated in order).
 * - Explicit flag `needsTeacherCheck` where curriculum scope requires teacher verification.
 */

export interface NumberRange {
  /** Primary operand or overall target number minimum */
  min: number;
  /** Primary operand or overall target number maximum */
  max: number;
  /** Secondary operand minimum (e.g., addend, subtrahend, multiplier, divisor) */
  operandBMin?: number;
  /** Secondary operand maximum */
  operandBMax?: number;
}

export interface SkillEntry {
  conceptId: string;
  grade: 3 | 4 | 5;
  strand: "number" | "muldiv" | "fractions" | "measurement";
  outcome: string;
  prerequisites: string[];
  ranges: {
    1: NumberRange;
    2: NumberRange;
    3: NumberRange;
  };
  needsTeacherCheck?: boolean;
}

export const SKILL_SHEET: SkillEntry[] = [
  // =========================================================================
  // CLASS 3 (NCERT Math-Magic Class 3)
  // =========================================================================
  {
    conceptId: "number_sense",
    grade: 3,
    strand: "number",
    outcome: "The learner can read, compare, and order whole numbers up to three digits using positional magnitude.",
    prerequisites: [],
    ranges: {
      1: { min: 10, max: 99 },
      2: { min: 100, max: 500 },
      3: { min: 500, max: 999 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "place_value",
    grade: 3,
    strand: "number",
    outcome: "The learner can decompose a three-digit number into hundreds, tens, and units places.",
    prerequisites: ["number_sense"],
    ranges: {
      1: { min: 10, max: 99 },
      2: { min: 100, max: 500 },
      3: { min: 500, max: 999 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "addition",
    grade: 3,
    strand: "number",
    outcome: "The learner can compute the sum of two numbers with and without regrouping up to two and three digits.",
    prerequisites: ["place_value"],
    ranges: {
      1: { min: 10, max: 49, operandBMin: 10, operandBMax: 49 },
      2: { min: 15, max: 89, operandBMin: 12, operandBMax: 89 },
      3: { min: 100, max: 450, operandBMin: 50, operandBMax: 450 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "subtraction",
    grade: 3,
    strand: "number",
    outcome: "The learner can calculate the difference between two numbers with borrowing within three digits.",
    prerequisites: ["place_value", "addition"],
    ranges: {
      1: { min: 20, max: 99, operandBMin: 10, operandBMax: 45 },
      2: { min: 30, max: 95, operandBMin: 15, operandBMax: 65 },
      3: { min: 120, max: 500, operandBMin: 50, operandBMax: 350 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "mult_concept",
    grade: 3,
    strand: "muldiv",
    outcome: "The learner can interpret multiplication as repeated equal groups and arrays of concrete items.",
    prerequisites: ["addition"],
    ranges: {
      1: { min: 2, max: 5, operandBMin: 2, operandBMax: 5 },
      2: { min: 3, max: 8, operandBMin: 2, operandBMax: 7 },
      3: { min: 4, max: 10, operandBMin: 4, operandBMax: 9 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "mult_facts",
    grade: 3,
    strand: "muldiv",
    outcome: "The learner can recall multiplication table facts through 10 in rapid mental calculations.",
    prerequisites: ["mult_concept"],
    ranges: {
      1: { min: 2, max: 5, operandBMin: 2, operandBMax: 5 },
      2: { min: 6, max: 9, operandBMin: 2, operandBMax: 6 },
      3: { min: 6, max: 10, operandBMin: 6, operandBMax: 10 },
    },
    needsTeacherCheck: true,
  },
  {
    conceptId: "addition_3digit",
    grade: 3,
    strand: "number",
    outcome: "The learner can add pairs of three-digit numbers requiring carrying across both tens and hundreds columns.",
    prerequisites: ["addition", "place_value"],
    ranges: {
      1: { min: 100, max: 300, operandBMin: 100, operandBMax: 300 },
      2: { min: 200, max: 550, operandBMin: 150, operandBMax: 350 },
      3: { min: 300, max: 700, operandBMin: 200, operandBMax: 299 },
    },
    needsTeacherCheck: true,
  },
  {
    conceptId: "subtraction_3digit",
    grade: 3,
    strand: "number",
    outcome: "The learner can subtract three-digit numbers with regrouping across multiple places.",
    prerequisites: ["subtraction", "place_value"],
    ranges: {
      1: { min: 200, max: 500, operandBMin: 100, operandBMax: 200 },
      2: { min: 350, max: 750, operandBMin: 150, operandBMax: 350 },
      3: { min: 500, max: 950, operandBMin: 200, operandBMax: 480 },
    },
    needsTeacherCheck: true,
  },
  {
    conceptId: "division_sharing",
    grade: 3,
    strand: "muldiv",
    outcome: "The learner can divide quantities into equal shares and identify how many items belong in each group.",
    prerequisites: ["mult_concept", "subtraction"],
    ranges: {
      1: { min: 6, max: 20, operandBMin: 2, operandBMax: 4 },
      2: { min: 12, max: 36, operandBMin: 3, operandBMax: 6 },
      3: { min: 20, max: 50, operandBMin: 4, operandBMax: 8 },
    },
    needsTeacherCheck: true,
  },
  {
    conceptId: "money_math",
    grade: 3,
    strand: "measurement",
    outcome: "The learner can calculate total rupees in small transactions and determine correct change.",
    prerequisites: ["addition", "subtraction"],
    ranges: {
      1: { min: 5, max: 50, operandBMin: 5, operandBMax: 30 },
      2: { min: 20, max: 200, operandBMin: 10, operandBMax: 120 },
      3: { min: 100, max: 500, operandBMin: 50, operandBMax: 400 },
    },
    needsTeacherCheck: true,
  },

  // =========================================================================
  // CLASS 4 (NCERT Math-Magic Class 4)
  // =========================================================================
  {
    conceptId: "number_sense",
    grade: 4,
    strand: "number",
    outcome: "The learner can compare, order, and estimate four-digit numbers up to 10,000.",
    prerequisites: ["place_value"],
    ranges: {
      1: { min: 100, max: 999 },
      2: { min: 1000, max: 5000 },
      3: { min: 5000, max: 9999 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "place_value",
    grade: 4,
    strand: "number",
    outcome: "The learner can identify thousands, hundreds, tens, and units values in four-digit numbers.",
    prerequisites: ["number_sense"],
    ranges: {
      1: { min: 100, max: 999 },
      2: { min: 1000, max: 5000 },
      3: { min: 5000, max: 9999 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "addition",
    grade: 4,
    strand: "number",
    outcome: "The learner can add three-digit and four-digit numbers with multiple regroupings.",
    prerequisites: ["place_value"],
    ranges: {
      1: { min: 100, max: 500, operandBMin: 100, operandBMax: 450 },
      2: { min: 500, max: 2500, operandBMin: 400, operandBMax: 2000 },
      3: { min: 1500, max: 5000, operandBMin: 1000, operandBMax: 4500 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "subtraction",
    grade: 4,
    strand: "number",
    outcome: "The learner can subtract four-digit numbers with regrouping across zero digits.",
    prerequisites: ["place_value", "addition"],
    ranges: {
      1: { min: 200, max: 900, operandBMin: 100, operandBMax: 450 },
      2: { min: 1000, max: 4000, operandBMin: 500, operandBMax: 2500 },
      3: { min: 3000, max: 8000, operandBMin: 1500, operandBMax: 6000 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "mult_facts",
    grade: 4,
    strand: "muldiv",
    outcome: "The learner can recall multiplication table combinations up to 12 in arithmetic problems.",
    prerequisites: ["mult_concept"],
    ranges: {
      1: { min: 2, max: 6, operandBMin: 2, operandBMax: 6 },
      2: { min: 6, max: 9, operandBMin: 3, operandBMax: 9 },
      3: { min: 7, max: 12, operandBMin: 6, operandBMax: 12 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "multi_digit_mult",
    grade: 4,
    strand: "muldiv",
    outcome: "The learner can multiply a two-digit number by a one-digit or two-digit number using place-value distribution.",
    prerequisites: ["mult_facts", "place_value"],
    ranges: {
      1: { min: 12, max: 45, operandBMin: 2, operandBMax: 9 },
      2: { min: 18, max: 65, operandBMin: 11, operandBMax: 25 },
      3: { min: 105, max: 350, operandBMin: 3, operandBMax: 9 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "division_concept",
    grade: 4,
    strand: "muldiv",
    outcome: "The learner can describe division as grouping, sharing, and inverse multiplication with simple remainders.",
    prerequisites: ["mult_concept", "subtraction"],
    ranges: {
      1: { min: 12, max: 48, operandBMin: 2, operandBMax: 6 },
      2: { min: 24, max: 72, operandBMin: 3, operandBMax: 8 },
      3: { min: 35, max: 99, operandBMin: 4, operandBMax: 9 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "division_facts",
    grade: 4,
    strand: "muldiv",
    outcome: "The learner can divide two-digit numbers by single-digit divisors without remainders.",
    prerequisites: ["mult_facts", "division_concept"],
    ranges: {
      1: { min: 10, max: 40, operandBMin: 2, operandBMax: 5 },
      2: { min: 24, max: 72, operandBMin: 3, operandBMax: 9 },
      3: { min: 45, max: 96, operandBMin: 4, operandBMax: 12 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "fraction_basics",
    grade: 4,
    strand: "fractions",
    outcome: "The learner can identify unit and simple non-unit fractions as parts of a whole region or set.",
    prerequisites: ["division_concept"],
    ranges: {
      1: { min: 1, max: 4 },
      2: { min: 1, max: 8 },
      3: { min: 1, max: 12 },
    },
    needsTeacherCheck: false,
  },

  // =========================================================================
  // CLASS 5 (NCERT Math-Magic Class 5)
  // =========================================================================
  {
    conceptId: "number_sense",
    grade: 5,
    strand: "number",
    outcome: "The learner can read, write, compare, and round numbers beyond 10,000 up to lakhs.",
    prerequisites: ["place_value"],
    ranges: {
      1: { min: 1000, max: 9999 },
      2: { min: 10000, max: 50000 },
      3: { min: 50000, max: 99999 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "place_value",
    grade: 5,
    strand: "number",
    outcome: "The learner can express large numbers in expanded notation across thousands, ten-thousands, and lakhs.",
    prerequisites: ["number_sense"],
    ranges: {
      1: { min: 1000, max: 9999 },
      2: { min: 10000, max: 99999 },
      3: { min: 100000, max: 999999 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "addition",
    grade: 5,
    strand: "number",
    outcome: "The learner can add large multi-digit numbers up to five digits with regrouping.",
    prerequisites: ["place_value"],
    ranges: {
      1: { min: 1000, max: 5000, operandBMin: 1000, operandBMax: 4500 },
      2: { min: 5000, max: 25000, operandBMin: 4000, operandBMax: 20000 },
      3: { min: 20000, max: 75000, operandBMin: 10000, operandBMax: 24000 },
    },
    needsTeacherCheck: true,
  },
  {
    conceptId: "subtraction",
    grade: 5,
    strand: "number",
    outcome: "The learner can subtract multi-digit numbers up to five digits across multiple regroupings.",
    prerequisites: ["place_value", "addition"],
    ranges: {
      1: { min: 2000, max: 8000, operandBMin: 1000, operandBMax: 4500 },
      2: { min: 8000, max: 35000, operandBMin: 3000, operandBMax: 20000 },
      3: { min: 30000, max: 95000, operandBMin: 10000, operandBMax: 45000 },
    },
    needsTeacherCheck: true,
  },
  {
    conceptId: "multi_digit_mult",
    grade: 5,
    strand: "muldiv",
    outcome: "The learner can multiply three-digit numbers by two-digit numbers using standard column multiplication.",
    prerequisites: ["mult_facts", "place_value"],
    ranges: {
      1: { min: 25, max: 95, operandBMin: 12, operandBMax: 45 },
      2: { min: 110, max: 450, operandBMin: 12, operandBMax: 35 },
      3: { min: 200, max: 750, operandBMin: 22, operandBMax: 65 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "division_facts",
    grade: 5,
    strand: "muldiv",
    outcome: "The learner can divide two-digit and three-digit numbers by single-digit and round-ten divisors.",
    prerequisites: ["mult_facts", "division_concept"],
    ranges: {
      1: { min: 30, max: 90, operandBMin: 3, operandBMax: 9 },
      2: { min: 100, max: 450, operandBMin: 4, operandBMax: 9 },
      3: { min: 150, max: 720, operandBMin: 10, operandBMax: 20 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "long_division",
    grade: 5,
    strand: "muldiv",
    outcome: "The learner can perform multi-step division of three-digit and four-digit dividends by one-digit and two-digit divisors.",
    prerequisites: ["division_facts", "place_value", "subtraction"],
    ranges: {
      1: { min: 120, max: 500, operandBMin: 3, operandBMax: 8 },
      2: { min: 250, max: 900, operandBMin: 11, operandBMax: 25 },
      3: { min: 1000, max: 4500, operandBMin: 12, operandBMax: 35 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "division_word",
    grade: 5,
    strand: "muldiv",
    outcome: "The learner can solve contextual division word problems and correctly interpret remainders.",
    prerequisites: ["division_facts"],
    ranges: {
      1: { min: 36, max: 96, operandBMin: 3, operandBMax: 8 },
      2: { min: 120, max: 480, operandBMin: 4, operandBMax: 12 },
      3: { min: 350, max: 1200, operandBMin: 12, operandBMax: 25 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "fraction_basics",
    grade: 5,
    strand: "fractions",
    outcome: "The learner can recognize proper, improper, and mixed numbers as quantities relative to whole units.",
    prerequisites: ["division_concept"],
    ranges: {
      1: { min: 1, max: 6 },
      2: { min: 2, max: 10 },
      3: { min: 3, max: 12 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "equivalent_fractions",
    grade: 5,
    strand: "fractions",
    outcome: "The learner can identify and construct equivalent fractions by scaling numerators and denominators.",
    prerequisites: ["fraction_basics", "mult_facts"],
    ranges: {
      1: { min: 1, max: 4 },
      2: { min: 2, max: 7 },
      3: { min: 3, max: 11 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "comparing_fractions",
    grade: 5,
    strand: "fractions",
    outcome: "The learner can compare two fractions with like or unlike denominators using cross-multiplication or common denominators.",
    prerequisites: ["equivalent_fractions", "fraction_basics"],
    ranges: {
      1: { min: 1, max: 5 },
      2: { min: 1, max: 6 },
      3: { min: 2, max: 8 },
    },
    needsTeacherCheck: false,
  },
  {
    conceptId: "fraction_addition",
    grade: 5,
    strand: "fractions",
    outcome: "The learner can add fractions with identical or related denominators to compute combined portions.",
    prerequisites: ["equivalent_fractions", "addition"],
    ranges: {
      1: { min: 1, max: 4 },
      2: { min: 2, max: 6 },
      3: { min: 1, max: 5 },
    },
    needsTeacherCheck: false,
  },
];

/**
 * Retrieves the skill definition for a given concept and grade.
 * If grade-specific definition is not found, falls back to the nearest grade.
 */
export function getSkillEntry(conceptId: string, grade: number): SkillEntry | undefined {
  const exact = SKILL_SHEET.find((s) => s.conceptId === conceptId && s.grade === grade);
  if (exact) return exact;
  return SKILL_SHEET.find((s) => s.conceptId === conceptId);
}

/**
 * Returns the verified number range for a concept, grade, and difficulty level.
 */
export function getSkillRange(
  conceptId: string,
  grade: number,
  difficulty: 1 | 2 | 3
): NumberRange {
  const skill = getSkillEntry(conceptId, grade);
  if (skill && skill.ranges[difficulty]) {
    return skill.ranges[difficulty];
  }

  // Safe fallback default if concept range is unspecified
  if (difficulty === 1) return { min: 5, max: 20 };
  if (difficulty === 2) return { min: 15, max: 60 };
  return { min: 30, max: 150 };
}
