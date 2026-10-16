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
  chapterName: string;
  prerequisites: string[];
  difficultyLevels: Difficulty[];
  questionTypes: QuestionFormat[];
}
