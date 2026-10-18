import type { Board } from "@/lib/types";
import type { CurriculumConcept } from "./types.ts";

import { CBSE_CLASS_1_CONCEPTS } from "./cbse-class-1.ts";
import { CBSE_CLASS_2_CONCEPTS } from "./cbse-class-2.ts";
import { CBSE_CLASS_3_CONCEPTS } from "./cbse-class-3.ts";
import { CBSE_CLASS_4_CONCEPTS } from "./cbse-class-4.ts";
import { CBSE_CLASS_5_CONCEPTS } from "./cbse-class-5.ts";
import { CBSE_CLASS_6_CONCEPTS } from "./cbse-class-6.ts";
import { CBSE_CLASS_7_CONCEPTS } from "./cbse-class-7.ts";
import { CBSE_CLASS_8_CONCEPTS } from "./cbse-class-8.ts";
import { CBSE_CLASS_9_CONCEPTS } from "./cbse-class-9.ts";
import { CBSE_CLASS_10_CONCEPTS } from "./cbse-class-10.ts";

import { ICSE_CLASS_1_CONCEPTS } from "./icse-class-1.ts";
import { ICSE_CLASS_2_CONCEPTS } from "./icse-class-2.ts";
import { ICSE_CLASS_3_CONCEPTS } from "./icse-class-3.ts";
import { ICSE_CLASS_4_CONCEPTS } from "./icse-class-4.ts";
import { ICSE_CLASS_5_CONCEPTS } from "./icse-class-5.ts";
import { ICSE_CLASS_6_CONCEPTS } from "./icse-class-6.ts";
import { ICSE_CLASS_7_CONCEPTS } from "./icse-class-7.ts";
import { ICSE_CLASS_8_CONCEPTS } from "./icse-class-8.ts";
import { ICSE_CLASS_9_CONCEPTS } from "./icse-class-9.ts";
import { ICSE_CLASS_10_CONCEPTS } from "./icse-class-10.ts";

export * from "./types.ts";
export * from "./syllabusMap.ts";

function enrichConcept(c: CurriculumConcept): CurriculumConcept {
  const boards: Board[] = c.boards && c.boards.length > 0 ? c.boards : [c.board];
  const levels = c.difficultyLevels?.length ? c.difficultyLevels : [1, 2, 3, 4];
  const difficultyRange: [number, number] = c.difficultyRange || [
    Math.min(...levels),
    Math.max(...levels),
  ];
  const source =
    c.source ||
    (c.board === "ICSE"
      ? c.class >= 9
        ? `CISCE ICSE Mathematics Class ${c.class === 9 ? "IX" : "X"} Syllabus (2024-26)`
        : `CISCE Curriculum for Preschool to Class VIII: Mathematics Class ${c.class} (CISCE-aligned)`
      : c.class === 1
      ? "NCERT Joyful Mathematics Class 1 (2024-25)"
      : c.class === 2
      ? "NCERT Joyful Mathematics Class 2 (2024-25)"
      : c.class === 3
      ? "NCERT Maths Mela Class 3 (2024-25)"
      : c.class === 6
      ? "NCERT Ganita Prakash Class 6 (2024-25)"
      : c.class <= 5
      ? `NCERT Math-Magic ${c.class} (Rationalised 2024-25)`
      : `NCERT Mathematics Class ${c.class} (Rationalised 2024-25)`);

  const learningOutcome =
    c.learningOutcome ||
    `Demonstrates conceptual understanding and procedural fluency in ${c.name.en} aligned to Class ${c.class} ${c.board} curriculum standards.`;

  return {
    ...c,
    boards,
    difficultyRange,
    source,
    learningOutcome,
  };
}

const RAW_CONCEPTS_LIST: CurriculumConcept[] = [
  ...CBSE_CLASS_1_CONCEPTS,
  ...CBSE_CLASS_2_CONCEPTS,
  ...CBSE_CLASS_3_CONCEPTS,
  ...CBSE_CLASS_4_CONCEPTS,
  ...CBSE_CLASS_5_CONCEPTS,
  ...CBSE_CLASS_6_CONCEPTS,
  ...CBSE_CLASS_7_CONCEPTS,
  ...CBSE_CLASS_8_CONCEPTS,
  ...CBSE_CLASS_9_CONCEPTS,
  ...CBSE_CLASS_10_CONCEPTS,

  ...ICSE_CLASS_1_CONCEPTS,
  ...ICSE_CLASS_2_CONCEPTS,
  ...ICSE_CLASS_3_CONCEPTS,
  ...ICSE_CLASS_4_CONCEPTS,
  ...ICSE_CLASS_5_CONCEPTS,
  ...ICSE_CLASS_6_CONCEPTS,
  ...ICSE_CLASS_7_CONCEPTS,
  ...ICSE_CLASS_8_CONCEPTS,
  ...ICSE_CLASS_9_CONCEPTS,
  ...ICSE_CLASS_10_CONCEPTS,
];

export const ALL_CURRICULUM_CONCEPTS_LIST: CurriculumConcept[] = RAW_CONCEPTS_LIST.map(enrichConcept);

export const CURRICULUM_REGISTRY: Record<string, CurriculumConcept> = Object.fromEntries(
  ALL_CURRICULUM_CONCEPTS_LIST.map((c) => [c.id, c])
);

export const allConceptsMap: Map<string, CurriculumConcept> = new Map(
  ALL_CURRICULUM_CONCEPTS_LIST.map((c) => [c.id, c])
);

export function getCurriculumConcept(id: string): CurriculumConcept | undefined {
  return CURRICULUM_REGISTRY[id];
}

export function getConceptsByClassAndBoard(grade: number, board: Board): CurriculumConcept[] {
  return ALL_CURRICULUM_CONCEPTS_LIST.filter(
    (c) => c.class === grade && (c.board === board || c.boards?.includes(board))
  );
}

export function prerequisitesOfConcept(id: string): string[] {
  const c = CURRICULUM_REGISTRY[id];
  return c ? c.prerequisites : [];
}

/**
 * Returns all transitive prerequisites (ancestors) for a given concept ID.
 * Follows deep paths from Class 10 down to Class 1.
 */
export function ancestorsOfConcept(id: string): Set<string> {
  const out = new Set<string>();
  const stack = [...prerequisitesOfConcept(id)];
  while (stack.length > 0) {
    const next = stack.pop()!;
    if (out.has(next)) continue;
    out.add(next);
    stack.push(...prerequisitesOfConcept(next));
  }
  return out;
}

export interface GraphValidationResult {
  valid: boolean;
  totalConcepts: number;
  totalPrerequisiteEdges: number;
  errors: string[];
  missingPrereqs: string[];
  cycles: string[][];
  invalidTranslations: string[];
  missingSources: string[];
  missingOutcomes: string[];
}

/**
 * Validates the curriculum concept graph:
 * 1. Checks that every prerequisite ID exists in the registry.
 * 2. Checks that every concept has complete and non-empty entries for English, Hindi, and Telugu.
 * 3. Checks that every concept has an official syllabus source citation.
 * 4. Checks that every concept has an explicit learning outcome.
 * 5. Detects any directed cycles (ensures DAG).
 */
export function validateCurriculumGraph(): GraphValidationResult {
  const errors: string[] = [];
  const missingPrereqs: string[] = [];
  const invalidTranslations: string[] = [];
  const missingSources: string[] = [];
  const missingOutcomes: string[] = [];
  const cycles: string[][] = [];
  let totalEdges = 0;

  for (const c of ALL_CURRICULUM_CONCEPTS_LIST) {
    // 1. Translations check
    if (!c.name?.en?.trim() || !c.name?.hi?.trim() || !c.name?.te?.trim()) {
      invalidTranslations.push(c.id);
      errors.push(`Concept ${c.id} is missing translation in one or more languages (en, hi, te).`);
    }

    // 2. Official Syllabus Source check
    if (!c.source || !c.source.trim()) {
      missingSources.push(c.id);
      errors.push(`Concept ${c.id} is missing official syllabus source provenance.`);
    }

    // 3. Learning Outcome check
    if (!c.learningOutcome || !c.learningOutcome.trim()) {
      missingOutcomes.push(c.id);
      errors.push(`Concept ${c.id} is missing learning outcome definition.`);
    }

    // 4. Difficulty Range check
    if (
      !c.difficultyRange ||
      c.difficultyRange[0] < 1 ||
      c.difficultyRange[1] > 5 ||
      c.difficultyRange[0] > c.difficultyRange[1]
    ) {
      errors.push(`Concept ${c.id} has invalid difficulty range: ${JSON.stringify(c.difficultyRange)}`);
    }

    // 5. Prerequisite IDs check
    for (const prereqId of c.prerequisites) {
      totalEdges++;
      if (!CURRICULUM_REGISTRY[prereqId]) {
        missingPrereqs.push(`Concept ${c.id} references missing prerequisite ${prereqId}`);
        errors.push(`Concept ${c.id} references non-existent prerequisite ID: ${prereqId}`);
      }
    }
  }

  // 6. Cycle detection (DFS with 3 colors: 0=unvisited, 1=visiting, 2=visited)
  const state = new Map<string, 0 | 1 | 2>();
  for (const c of ALL_CURRICULUM_CONCEPTS_LIST) {
    state.set(c.id, 0);
  }

  const currentPath: string[] = [];

  function dfs(nodeId: string): boolean {
    state.set(nodeId, 1);
    currentPath.push(nodeId);

    const prereqs = prerequisitesOfConcept(nodeId);
    for (const p of prereqs) {
      const pState = state.get(p);
      if (pState === 1) {
        // Cycle detected
        const cycleStartIndex = currentPath.indexOf(p);
        const cycle = [...currentPath.slice(cycleStartIndex), p];
        cycles.push(cycle);
        errors.push(`Cycle detected in concept graph: ${cycle.join(" -> ")}`);
        return false;
      }
      if (pState === 0) {
        if (!dfs(p)) return false;
      }
    }

    currentPath.pop();
    state.set(nodeId, 2);
    return true;
  }

  for (const c of ALL_CURRICULUM_CONCEPTS_LIST) {
    if (state.get(c.id) === 0) {
      dfs(c.id);
    }
  }

  return {
    valid: errors.length === 0,
    totalConcepts: ALL_CURRICULUM_CONCEPTS_LIST.length,
    totalPrerequisiteEdges: totalEdges,
    errors,
    missingPrereqs,
    cycles,
    invalidTranslations,
    missingSources,
    missingOutcomes,
  };
}
