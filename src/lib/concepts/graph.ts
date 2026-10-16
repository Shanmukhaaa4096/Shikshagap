import type { Concept, ConceptId, Strand, Topic, TopicId } from "@/lib/types";

/**
 * Concept dependency graph (Classes 3 to 5 Mathematics).
 * Prerequisites are listed in diagnostic priority order: when a student shows
 * difficulty with a concept, the agent investigates prerequisites in this order.
 */
export const CONCEPTS: Record<ConceptId, Concept> = {
  number_sense: { id: "number_sense", subjectId: "math", grade: 3, strand: "number", prerequisites: [] },
  place_value: { id: "place_value", subjectId: "math", grade: 4, strand: "number", prerequisites: ["number_sense"] },
  addition: { id: "addition", subjectId: "math", grade: 3, strand: "number", prerequisites: ["place_value"] },
  subtraction: { id: "subtraction", subjectId: "math", grade: 3, strand: "number", prerequisites: ["place_value", "addition"] },
  mult_concept: { id: "mult_concept", subjectId: "math", grade: 3, strand: "muldiv", prerequisites: ["addition"] },
  mult_facts: { id: "mult_facts", subjectId: "math", grade: 4, strand: "muldiv", prerequisites: ["mult_concept"] },
  multi_digit_mult: { id: "multi_digit_mult", subjectId: "math", grade: 5, strand: "muldiv", prerequisites: ["mult_facts", "place_value"] },
  division_concept: { id: "division_concept", subjectId: "math", grade: 4, strand: "muldiv", prerequisites: ["mult_concept", "subtraction"] },
  division_facts: { id: "division_facts", subjectId: "math", grade: 5, strand: "muldiv", prerequisites: ["mult_facts", "division_concept"] },
  long_division: { id: "long_division", subjectId: "math", grade: 5, strand: "muldiv", prerequisites: ["division_facts", "place_value", "subtraction"] },
  division_word: { id: "division_word", subjectId: "math", grade: 5, strand: "muldiv", prerequisites: ["division_facts"] },
  fraction_basics: { id: "fraction_basics", subjectId: "math", grade: 4, strand: "fractions", prerequisites: ["division_concept"] },
  equivalent_fractions: { id: "equivalent_fractions", subjectId: "math", grade: 5, strand: "fractions", prerequisites: ["fraction_basics", "mult_facts"] },
  comparing_fractions: { id: "comparing_fractions", subjectId: "math", grade: 5, strand: "fractions", prerequisites: ["equivalent_fractions", "fraction_basics"] },
  fraction_addition: { id: "fraction_addition", subjectId: "math", grade: 5, strand: "fractions", prerequisites: ["equivalent_fractions", "addition"] },
  addition_3digit: { id: "addition_3digit", subjectId: "math", grade: 3, strand: "number", prerequisites: ["addition", "place_value"], needsTeacherCheck: true },
  subtraction_3digit: { id: "subtraction_3digit", subjectId: "math", grade: 3, strand: "number", prerequisites: ["subtraction", "place_value"], needsTeacherCheck: true },
  division_sharing: { id: "division_sharing", subjectId: "math", grade: 3, strand: "muldiv", prerequisites: ["mult_concept", "subtraction"], needsTeacherCheck: true },
  money_math: { id: "money_math", subjectId: "math", grade: 3, strand: "measurement", prerequisites: ["addition", "subtraction"], needsTeacherCheck: true },
};

export const CONCEPT_IDS = Object.keys(CONCEPTS) as ConceptId[];

export const TOPICS: Record<TopicId, Topic> = {
  division: { id: "division", subjectId: "math", grade: 5, targets: ["division_facts", "long_division", "division_word"] },
  multiplication: { id: "multiplication", subjectId: "math", grade: 5, targets: ["mult_facts", "multi_digit_mult"] },
  fractions: { id: "fractions", subjectId: "math", grade: 5, targets: ["equivalent_fractions", "comparing_fractions", "fraction_addition"] },
  number_ops: { id: "number_ops", subjectId: "math", grade: 4, targets: ["place_value", "addition", "subtraction"] },
};
export const TOPIC_IDS = Object.keys(TOPICS) as TopicId[];

export const STRANDS: Strand[] = ["number", "muldiv", "fractions", "measurement"];

import {
  CURRICULUM_REGISTRY,
  prerequisitesOfConcept,
  ancestorsOfConcept,
  getCurriculumConcept,
} from "../../data/curriculum/index.ts";

export function prerequisitesOf(id: ConceptId): ConceptId[];
export function prerequisitesOf(id: string): string[];
export function prerequisitesOf(id: string): string[] {
  // If present in data-driven curriculum registry, use its official syllabus prerequisites
  const currPrereqs = prerequisitesOfConcept(id);
  if (currPrereqs && currPrereqs.length > 0) {
    return currPrereqs;
  }
  if (CONCEPTS[id as ConceptId]) {
    return CONCEPTS[id as ConceptId].prerequisites;
  }
  return [];
}

/** All transitive prerequisites (ancestors) of a concept (Classes 1 to 10). */
export function ancestorsOf(id: ConceptId): Set<ConceptId>;
export function ancestorsOf(id: string): Set<string>;
export function ancestorsOf(id: string): Set<string> {
  // Use data-driven ancestors if registered
  if (CURRICULUM_REGISTRY[id]) {
    return ancestorsOfConcept(id);
  }
  const out = new Set<string>();
  const stack = [...prerequisitesOf(id)];
  while (stack.length) {
    const c = stack.pop()!;
    if (out.has(c)) continue;
    out.add(c);
    stack.push(...prerequisitesOf(c));
  }
  return out;
}

export interface BacktrackNode {
  conceptId: string;
  name: { en: string; hi: string; te: string };
  grade: number;
  board?: string;
  chapterName?: string;
}

/**
 * Traces a learning gap down its prerequisite tree across grade boundaries (Classes 1-10).
 * For example, a Class 10 gap in Quadratic Equations backtracks through
 * Class 9 Polynomials -> Class 8 Factorisation -> Class 7 Expressions -> Class 6 Algebra Basics ->
 * Class 5 Multiplication -> Class 4 Facts -> Class 3 Addition -> Class 2 -> Class 1.
 */
export function tracePrerequisiteBacktrack(
  conceptId: string,
  isPrereqStruggling?: (prereqId: string) => boolean
): BacktrackNode[] {
  const chain: BacktrackNode[] = [];
  const visited = new Set<string>();
  let currentId: string | null = conceptId;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);

    // Look up concept metadata
    const curr = getCurriculumConcept(currentId);
    const legacy = CONCEPTS[currentId as ConceptId];

    if (curr) {
      chain.push({
        conceptId: curr.id,
        name: curr.name,
        grade: curr.class,
        board: curr.board,
        chapterName: curr.chapterName,
      });
    } else if (legacy) {
      chain.push({
        conceptId: legacy.id,
        name: {
          en: legacy.id.replace(/_/g, " "),
          hi: legacy.id.replace(/_/g, " "),
          te: legacy.id.replace(/_/g, " "),
        },
        grade: legacy.grade,
        chapterName: `Class ${legacy.grade} Mathematics`,
      });
    } else {
      chain.push({
        conceptId: currentId,
        name: { en: currentId, hi: currentId, te: currentId },
        grade: 0,
      });
    }

    const prereqs: string[] = prerequisitesOf(currentId);
    if (!prereqs || prereqs.length === 0) {
      break;
    }

    if (isPrereqStruggling) {
      // Step down to the first struggling prerequisite
      const struggling: string | undefined = prereqs.find((p: string) => isPrereqStruggling(p));
      currentId = struggling || null;
    } else {
      // Follow the first prerequisite path down to foundational roots
      currentId = prereqs[0];
    }
  }

  return chain;
}

/** Concepts that directly depend on `id`. */
export function dependentsOf(id: ConceptId): ConceptId[];
export function dependentsOf(id: string): string[];
export function dependentsOf(id: string): string[] {
  // Check both legacy CONCEPTS and CURRICULUM_REGISTRY
  const legacyDeps = CONCEPT_IDS.filter((c) => CONCEPTS[c]?.prerequisites?.includes(id as ConceptId));
  const currDeps = Object.values(CURRICULUM_REGISTRY)
    .filter((c) => c.prerequisites.includes(id))
    .map((c) => c.id);
  return Array.from(new Set([...legacyDeps, ...currDeps]));
}

/** Topological order (prerequisites first): stable, used for learning maps. */
export const TOPO_ORDER: ConceptId[] = (() => {
  const seen = new Set<ConceptId>();
  const order: ConceptId[] = [];
  const visit = (c: ConceptId) => {
    if (seen.has(c)) return;
    seen.add(c);
    CONCEPTS[c].prerequisites.forEach(visit);
    order.push(c);
  };
  CONCEPT_IDS.forEach(visit);
  return order;
})();

/** Depth = longest path from a concept with no prerequisites. */
export function depthOf(id: ConceptId): number {
  const p = prerequisitesOf(id);
  return p.length === 0 ? 0 : 1 + Math.max(...p.map(depthOf));
}
