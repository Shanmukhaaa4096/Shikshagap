import type { Concept, ConceptId, Strand, Topic, TopicId } from "@/lib/types";

/**
 * Concept dependency graph (Class 3–5 Mathematics).
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
};

export const CONCEPT_IDS = Object.keys(CONCEPTS) as ConceptId[];

export const TOPICS: Record<TopicId, Topic> = {
  division: { id: "division", subjectId: "math", grade: 5, targets: ["division_facts", "long_division", "division_word"] },
  multiplication: { id: "multiplication", subjectId: "math", grade: 5, targets: ["mult_facts", "multi_digit_mult"] },
  fractions: { id: "fractions", subjectId: "math", grade: 5, targets: ["equivalent_fractions", "comparing_fractions", "fraction_addition"] },
  number_ops: { id: "number_ops", subjectId: "math", grade: 4, targets: ["place_value", "addition", "subtraction"] },
};
export const TOPIC_IDS = Object.keys(TOPICS) as TopicId[];

export const STRANDS: Strand[] = ["number", "muldiv", "fractions"];

export function prerequisitesOf(id: ConceptId): ConceptId[] {
  return CONCEPTS[id].prerequisites;
}

/** All transitive prerequisites (ancestors) of a concept. */
export function ancestorsOf(id: ConceptId): Set<ConceptId> {
  const out = new Set<ConceptId>();
  const stack = [...prerequisitesOf(id)];
  while (stack.length) {
    const c = stack.pop()!;
    if (out.has(c)) continue;
    out.add(c);
    stack.push(...prerequisitesOf(c));
  }
  return out;
}

/** Concepts that directly depend on `id`. */
export function dependentsOf(id: ConceptId): ConceptId[] {
  return CONCEPT_IDS.filter((c) => CONCEPTS[c].prerequisites.includes(id));
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
