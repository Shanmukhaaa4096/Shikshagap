/**
 * ShikshaGap Question Bank & Provenance Types
 *
 * Defines the strict schema for verified textbook questions from official NCERT
 * and State Board textbooks, including full attribution, verification status,
 * and mathematical integrity metadata.
 */

import type { ConceptId, Difficulty, ErrorType, Lang, QuestionFormat, Visual } from "@/lib/types";

export type EducationalBoard =
  | "NCERT"
  | "CBSE"
  | "SCERT_TELANGANA"
  | "SCERT_AP"
  | "STATE_BOARD";

export type SourceType =
  | "official_ncert_textbook"
  | "official_state_board"
  | "official_resource";

export type ReuseStatus =
  | "public_educational_ncert"
  | "scert_permitted"
  | "fair_educational_use";

export type VerificationStatus =
  | "verified"
  | "pending_review"
  | "rejected";

export interface QuestionSourceMetadata {
  /** The educational authority publishing the textbook (e.g., NCERT, SCERT) */
  board: EducationalBoard;
  /** Class level (1 to 10) */
  class: number;
  /** Subject name (e.g., 'mathematics') */
  subject: string;
  /** Language edition of the textbook */
  language: Lang;
  /** Official title of the textbook (e.g., 'Math-Magic Class 4') */
  textbookTitle: string;
  /** Specific published edition (e.g., 'NCERT 2024-25 Rationalised Reprint') */
  textbookEdition: string;
  /** Academic year applicable */
  academicYear?: string;
  /** Chapter number (1-indexed) */
  chapterNumber: number;
  /** Official chapter title */
  chapterTitle: string;
  /** Exercise or section name (e.g., 'Practice Time', 'Exercise 3.1') */
  exerciseNumber?: string;
  /** Confirmed page number in official publication, when verifiable */
  pageNumber?: number;
  /** Question number in the exercise, when verifiable */
  questionNumber?: number;
  /** Official repository URL (e.g., ncert.nic.in portal) */
  sourceUrl?: string;
  /** Provenance category */
  sourceType: SourceType;
  /** Copyright and reuse status */
  reuseStatus: ReuseStatus;
  /** Verified step-by-step mathematical explanation */
  verifiedSolution: string;
  /** Specific pedagogical misconception tags addressed */
  misconceptionTags?: string[];
  /** Verification lifecycle state */
  verificationStatus: VerificationStatus;
  /** Verifier identity or automated benchmark suite */
  verifiedBy?: string;
  /** Timestamp when verification was confirmed */
  verifiedAt?: string;
  /** Human-readable attribution label shown to teachers/students */
  provenanceLabel: string;
}

export interface TextbookOption {
  id: string;
  label: string;
  value: string;
  errorType?: ErrorType;
}

export interface TextbookQuestion {
  /** Stable unique identifier (e.g., 'ncert_m4_c03_p38_q02_en') */
  id: string;
  board: EducationalBoard;
  class: number;
  subject: string;
  language: Lang;
  textbookTitle: string;
  textbookEdition: string;
  academicYear?: string;
  chapterNumber: number;
  chapterTitle: string;
  exerciseNumber?: string;
  pageNumber?: number;
  questionNumber?: number;
  sourceUrl?: string;
  sourceType: SourceType;
  reuseStatus: ReuseStatus;
  /** Verbatim or official educational text of the question */
  questionText: string;
  questionType: QuestionFormat;
  expression?: string;
  options?: TextbookOption[];
  correctAnswer: string;
  verifiedSolution: string;
  conceptIds: ConceptId[];
  difficulty: Difficulty;
  misconceptionTags?: string[];
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  hasVisual?: boolean;
  visual?: Visual;
  hintText?: string;
}

export interface QuestionBankFilter {
  board?: EducationalBoard;
  class?: number;
  subject?: string;
  chapterNumber?: number;
  conceptId?: ConceptId;
  difficulty?: Difficulty;
  language?: Lang;
  excludeIds?: string[];
  onlyVerified?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  code?:
    | "UNRESOLVED_PLACEHOLDER"
    | "EMPTY_PROMPT"
    | "MISSING_OPTIONS"
    | "DUPLICATE_OPTIONS"
    | "ANSWER_NOT_IN_OPTIONS"
    | "MISSING_VISUAL"
    | "UNVERIFIED_SOURCE"
    | "INVALID_ANSWER";
}
