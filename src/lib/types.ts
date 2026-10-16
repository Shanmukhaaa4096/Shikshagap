/**
 * ShikshaGap | core domain types.
 * All human-readable text is referenced through translation keys (TKey) so the
 * same data renders in English, Hindi or Telugu.
 */
import type { TKey } from "@/lib/i18n/keys";

export type Lang = "en" | "hi" | "te";

export type Board = "CBSE" | "ICSE";

export type ConceptId =
  | "number_sense"
  | "place_value"
  | "addition"
  | "subtraction"
  | "mult_concept"
  | "mult_facts"
  | "multi_digit_mult"
  | "division_concept"
  | "division_facts"
  | "long_division"
  | "division_word"
  | "fraction_basics"
  | "equivalent_fractions"
  | "comparing_fractions"
  | "fraction_addition"
  | "addition_3digit"
  | "subtraction_3digit"
  | "division_sharing"
  | "money_math";

export type Strand = "number" | "muldiv" | "fractions" | "measurement";

export interface Concept {
  id: ConceptId;
  subjectId: "math";
  grade: number;
  strand: Strand;
  /** Ordered by diagnostic priority: the most likely root cause first. */
  prerequisites: ConceptId[];
  /** Marked when curriculum scope or boundary needs teacher verification. */
  needsTeacherCheck?: boolean;
}

export type TopicId = "division" | "multiplication" | "fractions" | "number_ops";

export interface Topic {
  id: TopicId;
  subjectId: "math";
  grade: number;
  targets: ConceptId[];
}

/** Text that is either a translation key with params or a literal (math) string. */
export type Txt = { key: TKey; params?: Record<string, string | number> } | { raw: string };

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type SourceStyle =
  | "ncert"
  | "exemplar"
  | "cbse_reference"
  | "icse_selina"
  | "icse_foundation";

export type BoardPreference = "CBSE" | "ICSE" | "BOTH";
export type QuestionFormat =
  | "mcq"
  | "fill_blank"
  | "short_answer"
  | "word_problem"
  | "missing_number"
  | "find_mistake"
  | "true_false"
  | "choose_working"
  | "compare_answers";
export type AnswerKind = "int" | "fraction" | "choice";

export type ErrorType =
  | "slip" // near miss: likely careless
  | "wrong_operation" // e.g. subtracted instead of dividing
  | "regrouping" // carry / borrow error
  | "place_value" // digit value confusion
  | "fraction_add_denominators" // 1/4 + 1/4 = 2/8
  | "fraction_larger_denominator" // thinks 1/5 > 1/3
  | "fraction_additive" // 1/2 = 3/4 (adds same number)
  | "fraction_inverted"
  | "remainder" // remainder ignored / misread
  | "dont_know"
  | "unclassified";

export type Visual =
  | { kind: "array"; rows: number; cols: number }
  | { kind: "groups"; groups: number; each: number; total?: number }
  | { kind: "fraction_bar"; num: number; den: number }
  | { kind: "fraction_compare"; a: [number, number]; b: [number, number] }
  | { kind: "place_value"; value: number };

export interface Option {
  id: string;
  label: Txt;
  /** canonical value compared with Question.answer */
  value: string;
  errorType?: ErrorType;
}

export interface QuestionMeta {
  a?: number;
  b?: number;
  op?: "+" | "-" | "x" | "/";
  /** known buggy answers → error type (canonical string → error) */
  bugs?: Record<string, ErrorType>;
  focus?: number;
}

export interface Question {
  id: string;
  conceptId: ConceptId;
  difficulty: Difficulty;
  format: QuestionFormat;
  prompt: Txt;
  /** Large math expression shown under the prompt, e.g. "36 ÷ 6 = ?" */
  expression?: string;
  answerKind: AnswerKind;
  answer: string;
  options?: Option[];
  visual?: Visual;
  meta: QuestionMeta;
  /** Shown after practice answers */
  hint?: Txt;
  source: "bank" | "ai";
  /** Present when this question was asked to test a prerequisite of a failed concept */
  linkedFrom?: ConceptId;
  /** Full textbook provenance metadata when question originates from official textbook */
  textbookSource?: {
    board: "NCERT" | "CBSE" | "SCERT_TELANGANA" | "SCERT_AP" | "STATE_BOARD";
    class: number;
    subject: string;
    language: Lang;
    textbookTitle: string;
    textbookEdition: string;
    chapterNumber: number;
    chapterTitle: string;
    exerciseNumber?: string;
    pageNumber?: number;
    questionNumber?: number;
    sourceUrl?: string;
    verifiedSolution: string;
    provenanceLabel: string;
  };
  /** Indicates whether question is certified from official textbook source */
  isTextbookVerified?: boolean;
  /** Short provenance label shown to students/teachers (e.g. 'NCERT Math-Magic Class 4') */
  provenanceLabel?: string;
  /** Multi-book pedagogical source style */
  sourceStyle?: SourceStyle;
  /** Curriculum board tag ("CBSE" or "ICSE") */
  board: Board;
}

export type Classification = "correct" | ErrorType;

export interface Response {
  id: string;
  studentId: string;
  questionId: string;
  conceptId: ConceptId;
  difficulty: Difficulty;
  answer: string;
  correct: boolean;
  classification: Classification;
  timestamp: string;
  timeMs: number;
  context: "assessment" | "practice";
}

export type MasteryStatus = "mastered" | "developing" | "needs_support" | "not_assessed";

export interface MasteryEstimate {
  conceptId: ConceptId;
  /** Beta posterior parameters (deterministic evidence accumulation) */
  alpha: number;
  beta: number;
  attempts: number;
  correct: number;
  mastery: number; // 0..1
  confidence: number; // 0..1
  status: MasteryStatus;
  lastUpdated: string;
}

export type DecisionKind =
  | "start"
  | "harder"
  | "easier"
  | "resolved_mastered"
  | "resolved_gap"
  | "resolved_developing"
  | "probe_prereq"
  | "skip_prereqs"
  | "check_impact"
  | "stop_evidence"
  | "stop_budget";

export interface Decision {
  step: number;
  kind: DecisionKind;
  conceptId: ConceptId;
  relatedConceptId?: ConceptId;
  difficulty?: Difficulty;
  text: Txt;
}

export interface Classroom {
  id: string;
  name: string;
  grade: number;
  section: string;
  subjectId: "math";
  isDemo: boolean;
}

export interface Student {
  id: string;
  name: string;
  rollNo: number;
  classroomId: string;
  isDemo: boolean;
}

export interface Assessment {
  id: string;
  studentId: string;
  topicId: TopicId;
  kind: "initial" | "reassessment";
  startedAt: string;
  completedAt?: string;
  questions: Question[];
  responses: Response[];
  decisions: Decision[];
  result?: Partial<Record<ConceptId, MasteryEstimate>>;
}

export interface ProgressSnapshot {
  studentId: string;
  conceptId: ConceptId;
  mastery: number;
  confidence: number;
  source: "assessment" | "reassessment" | "practice";
  assessmentId?: string;
  timestamp: string;
}

export interface PlanDay {
  day: number;
  title: Txt;
  activity: Txt;
  focus?: string;
  minutes: number;
}

export interface RemediationPlan {
  id: string;
  studentId: string;
  conceptId: ConceptId;
  symptomIds: ConceptId[];
  createdAt: string;
  days: PlanDay[];
  source: "rules" | "ai";
  aiNote?: string;
  completedDays: number[];
  reassessAfter: string;
}

export interface PracticeSession {
  id: string;
  studentId: string;
  conceptId: ConceptId;
  startedAt: string;
  completedAt?: string;
  responses: Response[];
  startMastery: number;
  endMastery?: number;
}

export type Severity = "high" | "medium" | "low";

export interface EvidenceItem {
  questionId: string;
  conceptId: ConceptId;
  prompt: Txt;
  expression?: string;
  answer: string;
  correctAnswer: string;
  correct: boolean;
  classification: Classification;
}

export interface RootCause {
  rootId: ConceptId;
  symptomIds: ConceptId[];
  /** path from a symptom down to the root, e.g. [division_facts, mult_facts] */
  chain: ConceptId[];
  severity: Severity;
  confidence: number;
  rootMastery: number;
  /** prerequisites of the root that were not checked */
  uncheckedPrereqs: ConceptId[];
  /** true when the gap seems specific to the concept itself (prereqs look fine) */
  isSelfRoot: boolean;
  evidence: EvidenceItem[];
  misconceptions: ErrorType[];
  priority: number;
}

export type StudentStatus = "on_track" | "need_practice" | "critical" | "not_assessed";

export type AgentAction =
  | "START_TOPIC"
  | "CONTINUE_TOPIC"
  | "INCREASE_DIFFICULTY"
  | "DECREASE_DIFFICULTY"
  | "PROBE_PREREQUISITE"
  | "VERIFY_MASTERY"
  | "MARK_MASTERED"
  | "MARK_DEVELOPING"
  | "MARK_NEEDS_SUPPORT"
  | "MOVE_TO_NEXT_TOPIC"
  | "FINISH_ASSESSMENT";

export interface TopicConceptSummary {
  conceptId: ConceptId;
  mastery: number;
  confidence: number;
  status: MasteryStatus;
}

export interface TopicAssessmentSummary {
  topicId: TopicId;
  mastery: number;
  confidence: number;
  status: MasteryStatus;
  evidenceCount: number;
  concepts: TopicConceptSummary[];
  prerequisiteProbesCount?: number;
  reason?: string;
}

export interface DiagnosticResult {
  studentId: string;
  subjectId: string;
  topics: TopicAssessmentSummary[];
  rootCauses: RootCause[];
  overallMastery: number;
  overallConfidence: number;
  recommendedNextConcept: ConceptId | null;
  assessmentStats: {
    totalQuestions: number;
    topicsAssessed: number;
    prerequisiteProbes: number;
  };
}

export interface TopicMasteryState {
  topicId: TopicId;
  mastery: number; // 0..1
  confidence: number; // 0..1
  status: MasteryStatus;
  attempts: number;
  correct: number;
  difficultyProgression: Difficulty[];
  misconceptions: ErrorType[];
  evidenceCount: number;
  prerequisiteProbesCount: number;
  probedPrerequisites: ConceptId[];
  reason?: string;
}

export interface AgentDecisionRecord {
  step: number;
  action: AgentAction;
  topicId: TopicId;
  conceptId: ConceptId;
  difficulty: Difficulty;
  reason: string;
  confidence: number;
  studentFeedbackPrompt?: string;
  source: "ai" | "deterministic";
}

export interface AssessmentAgentState {
  studentId: string;
  studentName: string;
  grade: number;
  subjectId: string;
  topics: TopicId[];
  currentTopicIndex: number;
  currentTopic: TopicId;
  currentConcept: ConceptId;
  currentDifficulty: Difficulty;
  responses: Response[];
  visitedConcepts: ConceptId[];
  probedConcepts: ConceptId[];
  topicStates: Partial<Record<TopicId, TopicMasteryState>>;
  decisions: AgentDecisionRecord[];
  assessmentComplete: boolean;
  diagnosticResult?: DiagnosticResult;
}

export interface StudentProfile {
  studentId: string;
  status: StudentStatus;
  overallMastery: number | null;
  confidence: number;
  concepts: Partial<Record<ConceptId, MasteryEstimate>>;
  strong: ConceptId[];
  developing: ConceptId[];
  needsSupport: ConceptId[];
  inferredOk: ConceptId[];
  rootCauses: RootCause[];
  nextConcept: ConceptId | null;
  nextReason: "root_cause" | "frontier" | "none";
  evidenceCount: number;
  lastAssessedAt?: string;
  lastTopic?: TopicId;
  topicSummaries?: TopicAssessmentSummary[];
  lastDiagnosticResult?: DiagnosticResult;
}

/* ------------------------------------------------------------------ */
/* Multi-Agent Staircase & Session Memory Types                       */
/* ------------------------------------------------------------------ */

export type TopicStatus = "pending" | "mastered" | "developing" | "gap";

export interface Attempt {
  conceptId: ConceptId;
  level: Difficulty;
  questionId: string;
  studentAnswer: string;
  correct: boolean;
  errorType?: string;      // from the existing error classification
  questionSignature?: string;
  format?: QuestionFormat;
  sourceStyle?: SourceStyle;
  missingPart?: string;
}

export interface TopicMemory {
  topicId: TopicId;
  status: TopicStatus;
  attempts: Attempt[];
  notes: string[];          // short notes written by the Examiner
  misconceptions?: string[]; // written later by the Error analyst
  difficultyPath?: Difficulty[];
  highestLevelReached?: Difficulty;
  sourceStyles?: SourceStyle[];
}

export interface SessionMemory {
  pseudonymousId: string;   // never the student's name
  language: "en" | "hi" | "te";
  grade: number; // Classes 1 to 10
  topics: TopicMemory[];
  currentTopicIndex: number;
  seenSignatures?: string[];
  usedFormats?: QuestionFormat[];
  /** Session-specific PRNG seed for deterministic yet fresh question generation across assessments */
  sessionSeed?: number;
  /** Counter of questions/attempts within this assessment session to advance RNG state */
  stepCount?: number;
  /** Chosen board preference (CBSE, ICSE, or BOTH) */
  boardPreference?: BoardPreference;
}

export interface EducationalResource {
  id: string;
  title: string;
  url: string;
  source: "NCERT" | "DIKSHA" | "Khan Academy" | string;
  topicId: TopicId;
  conceptIds: ConceptId[];
  grade: number[];
  language: "en" | "hi" | "te" | string;
  type: "video" | "worksheet" | "article" | "exercise";
  description: string;
  needsHumanCheck?: boolean;
}

export interface ResourceRecommendation {
  topicId: TopicId;
  resources: Array<{
    id: string;
    title: string;
    url: string;
    source: string;
    type: string;
    reason: string;
  }>;
}


