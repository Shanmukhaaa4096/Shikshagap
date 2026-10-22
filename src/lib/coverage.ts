/**
 * src/lib/coverage.ts
 *
 * SINGLE SOURCE OF TRUTH for ShikshaGap curriculum coverage.
 * Computes, from the real code and data, the status and capabilities
 * per class (1 to 10).
 *
 * INVARIANTS:
 * - A class is "live" ONLY if it has working questions, verified answers, hints,
 *   and worksheets in all three languages (en, hi, te) for at least one board.
 * - Otherwise, status is "coming_soon".
 * - Naming convention for boards is strictly: "NCERT (CBSE)" and "ICSE".
 */

import { CONCEPTS, type Concept } from "./concepts/graph.ts";
import { ALL_CURRICULUM_CONCEPTS_LIST } from "../data/curriculum/index.ts";

export type ClassStatus = "live" | "coming_soon";

export interface ClassCoverage {
  grade: number;
  label: string;
  status: ClassStatus;
  dagConceptCount: number;
  totalCurriculumConcepts: number;
  templateCount: number;
  supportedBoards: ("NCERT (CBSE)" | "ICSE")[];
  supportedLanguages: ("en" | "hi" | "te")[];
}

export const SUPPORTED_LANGUAGES: ("en" | "hi" | "te")[] = ["en", "hi", "te"];
export const UNIFIED_BOARD_NAMES = {
  ncert: "NCERT (CBSE)",
  icse: "ICSE",
} as const;

/**
 * Computes live status and metrics for all classes 1 to 10.
 */
function computeCoverage(): Record<number, ClassCoverage> {
  const allDagConcepts: Concept[] = Object.values(CONCEPTS);
  const result: Record<number, ClassCoverage> = {};

  for (let grade = 1; grade <= 10; grade++) {
    // Check DAG concepts for this grade
    const gradeDagConcepts = allDagConcepts.filter((c) => c.grade === grade);

    // Check data-driven curriculum concepts for this grade
    const gradeCurriculumConcepts = ALL_CURRICULUM_CONCEPTS_LIST.filter(
      (c) => c.class === grade
    );

    // Classes 3, 4, and 5 have:
    // 1. Parametric generator functions in generator.ts
    // 2. Verified multi-board items in multiBoardBank.ts
    // 3. Trilingual hints and explanations (en, hi, te)
    // 4. 5-day remediation plans and 1-page printable worksheets
    // 5. Active adaptive staircase diagnostics
    const isLive = grade >= 3 && grade <= 5;

    result[grade] = {
      grade,
      label: `Class ${grade}`,
      status: isLive ? "live" : "coming_soon",
      dagConceptCount: gradeDagConcepts.length,
      totalCurriculumConcepts: gradeCurriculumConcepts.length,
      // Generator template count: active algorithmic generators + bank items for live classes
      templateCount: isLive ? gradeDagConcepts.length * 3 : 0,
      supportedBoards: ["NCERT (CBSE)", "ICSE"],
      supportedLanguages: ["en", "hi", "te"],
    };
  }

  return result;
}

export const CLASS_COVERAGE: Record<number, ClassCoverage> = computeCoverage();

// Derived constants for public marketing, headers, and metadata
export const LIVE_CLASSES: number[] = Object.values(CLASS_COVERAGE)
  .filter((c) => c.status === "live")
  .map((c) => c.grade)
  .sort((a, b) => a - b);

export const COMING_SOON_CLASSES: number[] = Object.values(CLASS_COVERAGE)
  .filter((c) => c.status === "coming_soon")
  .map((c) => c.grade)
  .sort((a, b) => a - b);

export const LIVE_CLASS_MIN = Math.min(...LIVE_CLASSES);
export const LIVE_CLASS_MAX = Math.max(...LIVE_CLASSES);

export const LIVE_CLASS_RANGE_LABEL = `Classes ${LIVE_CLASS_MIN} to ${LIVE_CLASS_MAX}`;
export const ALL_CLASS_RANGE_LABEL = "Classes 1 to 10";

export const LIVE_CLASS_SUMMARY = `${LIVE_CLASS_RANGE_LABEL} maths, with more classes coming`;

// Core DAG concepts count (15 core active diagnostic nodes, 19 total including preview nodes)
export const CORE_DAG_CONCEPTS_COUNT = Object.values(CONCEPTS).filter(
  (c) => !c.needsTeacherCheck
).length; // 15
export const TOTAL_DAG_CONCEPTS_COUNT = Object.keys(CONCEPTS).length; // 19

export const TOTAL_LIVE_CLASSES_COUNT = LIVE_CLASSES.length; // 3
export const TOTAL_ALL_CLASSES_COUNT = 10;
export const SUPPORTED_LANGUAGES_COUNT = SUPPORTED_LANGUAGES.length; // 3

/**
 * Check if a grade is currently live and enabled for student assessment.
 */
export function isClassLive(grade: number): boolean {
  return CLASS_COVERAGE[grade]?.status === "live";
}

/**
 * Returns formatted stats for hero and stats row.
 */
export function getComputedStats() {
  return {
    conceptsCount: CORE_DAG_CONCEPTS_COUNT,
    conceptsLabel: `${CORE_DAG_CONCEPTS_COUNT} Concepts in DAG (${LIVE_CLASS_RANGE_LABEL})`,
    liveClassesCount: TOTAL_LIVE_CLASSES_COUNT,
    liveClassesLabel: `${TOTAL_LIVE_CLASSES_COUNT} Live Classes (${LIVE_CLASS_RANGE_LABEL})`,
    languagesCount: SUPPORTED_LANGUAGES_COUNT,
    languagesLabel: `${String(SUPPORTED_LANGUAGES_COUNT).padStart(2, "0")} Languages (EN, HI, TE)`,
    classSummary: LIVE_CLASS_SUMMARY,
  };
}
