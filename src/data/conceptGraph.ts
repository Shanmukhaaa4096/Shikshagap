import type { Concept } from '../types';

export const CONCEPTS: Concept[] = [
  {
    id: 'num_sense',
    subjectId: 'math',
    name: 'Number Sense',
    code: 'MATH-C5-01',
    gradeLevel: 3,
    description: 'Understanding whole numbers, sequence counting, and quantity comparison.',
    prerequisites: [],
    category: 'Foundational Numbers',
  },
  {
    id: 'place_val',
    subjectId: 'math',
    name: 'Place Value',
    code: 'MATH-C5-02',
    gradeLevel: 3,
    description: 'Units, Tens, Hundreds, and Thousands representation and digit values.',
    prerequisites: ['num_sense'],
    category: 'Foundational Numbers',
  },
  {
    id: 'addition',
    subjectId: 'math',
    name: 'Addition & Regrouping',
    code: 'MATH-C5-03',
    gradeLevel: 3,
    description: 'Adding multi-digit numbers with carrying/regrouping.',
    prerequisites: ['place_val'],
    category: 'Core Operations',
  },
  {
    id: 'subtraction',
    subjectId: 'math',
    name: 'Subtraction with Regrouping',
    code: 'MATH-C5-04',
    gradeLevel: 4,
    description: 'Subtracting numbers with borrowing and step verification.',
    prerequisites: ['place_val', 'addition'],
    category: 'Core Operations',
  },
  {
    id: 'multiplication_fluency',
    subjectId: 'math',
    name: 'Multiplication Facts & Fluency',
    code: 'MATH-C5-05',
    gradeLevel: 4,
    description: 'Immediate recall of times tables 2 to 10 as repeated addition and arrays.',
    prerequisites: ['addition'],
    category: 'Multiplicative Thinking',
  },
  {
    id: 'multi_digit_mult',
    subjectId: 'math',
    name: 'Multi-digit Multiplication',
    code: 'MATH-C5-06',
    gradeLevel: 4,
    description: 'Multiplying 2-digit and 3-digit numbers using standard algorithm.',
    prerequisites: ['multiplication_fluency', 'place_val'],
    category: 'Multiplicative Thinking',
  },
  {
    id: 'division_concepts',
    subjectId: 'math',
    name: 'Basic Division & Equal Sharing',
    code: 'MATH-C5-07',
    gradeLevel: 4,
    description: 'Fair sharing, inverse of multiplication facts, simple division (e.g. 36 ÷ 6).',
    prerequisites: ['multiplication_fluency', 'subtraction'],
    category: 'Division & Partitioning',
  },
  {
    id: 'long_division',
    subjectId: 'math',
    name: 'Long Division Algorithm',
    code: 'MATH-C5-08',
    gradeLevel: 5,
    description: 'Dividing multi-digit dividends by 1-digit/2-digit divisors with quotients & remainders.',
    prerequisites: ['division_concepts', 'subtraction', 'multi_digit_mult'],
    category: 'Division & Partitioning',
  },
  {
    id: 'division_word_prob',
    subjectId: 'math',
    name: 'Division Word Problems',
    code: 'MATH-C5-09',
    gradeLevel: 5,
    description: 'Applying division concepts to real-life distribution, currency, and resource sharing.',
    prerequisites: ['long_division'],
    category: 'Applied Mathematics',
  },
  {
    id: 'fractions_intro',
    subjectId: 'math',
    name: 'Introduction to Fractions',
    code: 'MATH-C5-10',
    gradeLevel: 5,
    description: 'Understanding numerator and denominator as equal parts of a whole.',
    prerequisites: ['division_concepts'],
    category: 'Fractional Reasoning',
  },
  {
    id: 'equiv_fractions',
    subjectId: 'math',
    name: 'Equivalent Fractions',
    code: 'MATH-C5-11',
    gradeLevel: 5,
    description: 'Generating and identifying fractions of identical value using scale factors.',
    prerequisites: ['fractions_intro', 'multiplication_fluency'],
    category: 'Fractional Reasoning',
  },
];

export const CONCEPTS_BY_ID = CONCEPTS.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {} as Record<string, Concept>);

/**
 * Helper to get immediate prerequisite concepts for a given concept ID
 */
export function getPrerequisites(conceptId: string): Concept[] {
  const concept = CONCEPTS_BY_ID[conceptId];
  if (!concept) return [];
  return concept.prerequisites.map((pId) => CONCEPTS_BY_ID[pId]).filter(Boolean);
}

/**
 * Topological traversal to get all ancestral prerequisite IDs in order
 */
export function getAllAncestors(conceptId: string, visited = new Set<string>()): string[] {
  const concept = CONCEPTS_BY_ID[conceptId];
  if (!concept) return [];

  const result: string[] = [];
  for (const prereqId of concept.prerequisites) {
    if (!visited.has(prereqId)) {
      visited.add(prereqId);
      result.push(...getAllAncestors(prereqId, visited));
      result.push(prereqId);
    }
  }
  return Array.from(new Set(result));
}
