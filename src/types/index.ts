export type Language = 'en' | 'hi' | 'te';

export type ConceptStatus = 'mastered' | 'developing' | 'needs_support' | 'not_assessed';

export interface Concept {
  id: string;
  subjectId: string;
  name: string;
  code: string;
  gradeLevel: number;
  description: string;
  prerequisites: string[]; // IDs of prerequisite concepts
  category: string;
}

export type QuestionType = 'mcq' | 'fill_in_blank' | 'word_problem';

export interface Question {
  id: string;
  conceptId: string;
  difficulty: 1 | 2 | 3; // 1: Basic/Prereq, 2: Standard grade-level, 3: Advanced/Application
  text: {
    en: string;
    hi: string;
    te: string;
  };
  options?: {
    en: string;
    hi: string;
    te: string;
  }[];
  correctAnswer: string | number;
  questionType: QuestionType;
  explanation: {
    en: string;
    hi: string;
    te: string;
  };
  visualHint?: string; // e.g. SVG or ASCII grouping description
  isPrerequisiteProbe?: boolean;
  probeForConceptId?: string; // if this probes prerequisite for a failed concept
}

export interface StudentResponse {
  questionId: string;
  conceptId: string;
  studentAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  timestamp: string;
  difficulty: number;
}

export interface ConceptMastery {
  conceptId: string;
  conceptName: string;
  masteryScore: number; // 0 - 100
  status: ConceptStatus;
  questionsAttempted: number;
  questionsCorrect: number;
  confidenceScore: number; // 0 - 100
  evidenceCount: number;
}

export interface RootCauseDiagnosis {
  targetConceptId: string;
  targetConceptName: string;
  symptomDescription: {
    en: string;
    hi: string;
    te: string;
  };
  rootConceptId: string;
  rootConceptName: string;
  rootCauseReasoning: {
    en: string;
    hi: string;
    te: string;
  };
  severity: 'high' | 'medium' | 'low';
  confidencePercentage: number;
  evidencePoints: string[];
}

export interface DailyRemediationTask {
  day: number;
  title: {
    en: string;
    hi: string;
    te: string;
  };
  durationMinutes: number;
  objective: {
    en: string;
    hi: string;
    te: string;
  };
  activityType: 'hands_on' | 'drill_fluency' | 'visual_grouping' | 'peer_work' | 'mini_quiz';
  description: {
    en: string;
    hi: string;
    te: string;
  };
  sampleProblem: {
    en: string;
    hi: string;
    te: string;
  };
}

export interface RemediationPlan {
  id: string;
  studentId: string;
  studentName: string;
  conceptId: string;
  conceptName: string;
  rootCauseId: string;
  rootCauseName: string;
  durationDays: number;
  estimatedDailyMinutes: number;
  generatedDate: string;
  status: 'active' | 'in_progress' | 'completed';
  days: DailyRemediationTask[];
  teacherNotes: string;
}

export interface Student {
  id: string;
  rollNumber: number;
  name: string;
  grade: number;
  section: string;
  attendanceRate: number; // e.g. 88%
  overallMastery: number; // e.g. 61%
  statusCategory: 'on_track' | 'need_practice' | 'critical_gap';
  conceptMasteryMap: Record<string, ConceptMastery>;
  activeDiagnosis?: RootCauseDiagnosis;
  remediationPlan?: RemediationPlan;
  assessmentHistory: {
    date: string;
    conceptId: string;
    score: number;
    totalQuestions: number;
    reassessed?: boolean;
    previousScore?: number;
  }[];
}

export interface ClassroomOverview {
  classId: string;
  className: string;
  subject: string;
  academicYear: string;
  totalStudents: number;
  onTrackCount: number;
  needPracticeCount: number;
  criticalGapsCount: number;
  mostCommonGaps: {
    conceptId: string;
    conceptName: string;
    affectedStudentsCount: number;
    percentageOfClass: number;
    severity: 'high' | 'medium';
  }[];
}

export interface AdaptiveAssessmentSession {
  studentId: string;
  subjectId: string;
  primaryConceptId: string;
  currentQuestionIndex: number;
  responses: StudentResponse[];
  activePrerequisiteChain: string[];
  investigatingConceptId: string;
  isComplete: boolean;
  questionHistory: Question[];
  currentDiagnosis?: RootCauseDiagnosis;
}
