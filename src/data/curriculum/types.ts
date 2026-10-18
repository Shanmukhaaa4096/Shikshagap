import type { Board, Difficulty, QuestionFormat } from "@/lib/types";

export interface CurriculumConcept {
  id: string;
  name: {
    en: string;
    hi: string;
    te: string;
  };
  class: number;
  board: Board;
  /** Explicit array of boards where this concept is valid (for strict board filtering) */
  boards?: Board[];
  chapterName: string;
  /** Specific syllabus learning outcome achieved by mastering this concept */
  learningOutcome?: string;
  /** Prerequisites in diagnostic priority order, including cross-grade links */
  prerequisites: string[];
  difficultyLevels: Difficulty[];
  /** Allowed difficulty tier range [min, max] (e.g. [1, 4]) */
  difficultyRange?: [number, number];
  questionTypes: QuestionFormat[];
  /** Official syllabus provenance citation */
  source?: string;
}
