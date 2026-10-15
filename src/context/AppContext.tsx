import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Student, AdaptiveAssessmentSession, ClassroomOverview, Question } from '../types';
import { INITIAL_STUDENTS } from '../data/initialStudents';
import { AdaptiveAssessmentAgent } from '../engine/adaptiveAssessmentAgent';
import { DiagnosticEngine } from '../engine/diagnosticEngine';
import { RemediationAgent } from '../engine/remediationAgent';

interface AppContextType {
  students: Student[];
  selectedStudent: Student | null;
  selectStudent: (id: string | null) => void;
  classroomOverview: ClassroomOverview;
  
  // Assessment Modal
  isAssessmentModalOpen: boolean;
  activeSession: AdaptiveAssessmentSession | null;
  currentAssessmentQuestion: Question | null;
  assessmentReasoning: string;
  startAssessment: (studentId: string, conceptId?: string) => void;
  submitAssessmentAnswer: (answer: string) => void;
  closeAssessmentModal: () => void;

  // Remediation
  generateRemediationPlan: (studentId: string) => void;

  // Practice Modal
  isPracticeModalOpen: boolean;
  practiceQuestions: Question[];
  currentPracticeIndex: number;
  openPracticeModal: (studentId: string) => void;
  closePracticeModal: () => void;
  nextPracticeQuestion: () => void;
  finishPractice: () => void;

  // Reassessment Modal
  isReassessmentModalOpen: boolean;
  reassessingStudent: Student | null;
  openReassessmentModal: (studentId: string) => void;
  closeReassessmentModal: () => void;
  applyReassessmentProgress: () => void;

  // Guided Tour & Settings
  isDemoTourOpen: boolean;
  setDemoTourOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  // Reset
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'shikshagap_students_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading saved students', e);
      }
    }
    return INITIAL_STUDENTS;
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>('stud_ravi');
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState<boolean>(false);
  const [activeSession, setActiveSession] = useState<AdaptiveAssessmentSession | null>(null);
  const [currentAssessmentQuestion, setCurrentAssessmentQuestion] = useState<Question | null>(null);
  const [assessmentReasoning, setAssessmentReasoning] = useState<string>('');

  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState<boolean>(false);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState<number>(0);

  const [isReassessmentModalOpen, setIsReassessmentModalOpen] = useState<boolean>(false);
  const [reassessingStudent, setReassessingStudent] = useState<Student | null>(null);

  const [isDemoTourOpen, setDemoTourOpen] = useState<boolean>(false);
  const [isSettingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Sync students to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;

  // Compute classroom overview metrics
  const totalStudents = students.length;
  const onTrackCount = students.filter((s) => s.statusCategory === 'on_track').length;
  const needPracticeCount = students.filter((s) => s.statusCategory === 'need_practice').length;
  const criticalGapsCount = students.filter((s) => s.statusCategory === 'critical_gap').length;

  // Compute most common gaps dynamically
  const gapCounts: Record<string, { count: number; name: string; severity: 'high' | 'medium' }> = {
    multiplication_fluency: { count: 0, name: 'Multiplication Fluency', severity: 'high' },
    equiv_fractions: { count: 0, name: 'Fractions & Equivalence', severity: 'high' },
    division_word_prob: { count: 0, name: 'Division Word Problems', severity: 'medium' },
    subtraction: { count: 0, name: 'Subtraction with Regrouping', severity: 'high' },
    place_val: { count: 0, name: 'Place Value Concept', severity: 'medium' },
  };

  students.forEach((s) => {
    if (s.conceptMasteryMap['multiplication_fluency']?.status === 'needs_support') {
      gapCounts['multiplication_fluency'].count++;
    }
    if (s.conceptMasteryMap['equiv_fractions']?.status === 'needs_support' || s.activeDiagnosis?.rootConceptId === 'fractions_intro') {
      gapCounts['equiv_fractions'].count++;
    }
    if (s.conceptMasteryMap['division_word_prob']?.status === 'needs_support') {
      gapCounts['division_word_prob'].count++;
    }
    if (s.conceptMasteryMap['subtraction']?.status === 'needs_support') {
      gapCounts['subtraction'].count++;
    }
  });

  const mostCommonGaps = Object.entries(gapCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([id, item]) => ({
      conceptId: id,
      conceptName: item.name,
      affectedStudentsCount: item.count,
      percentageOfClass: Math.round((item.count / totalStudents) * 100),
      severity: item.severity,
    }));

  const classroomOverview: ClassroomOverview = {
    classId: 'class_5a',
    className: 'Class 5A',
    subject: 'Mathematics',
    academicYear: '2026-27',
    totalStudents,
    onTrackCount,
    needPracticeCount,
    criticalGapsCount,
    mostCommonGaps,
  };

  const selectStudent = (id: string | null) => {
    setSelectedStudentId(id);
  };

  // Start Adaptive Assessment
  const startAssessment = (studentId: string, conceptId: string = 'division_concepts') => {
    setSelectedStudentId(studentId);
    const session: AdaptiveAssessmentSession = {
      studentId,
      subjectId: 'math',
      primaryConceptId: conceptId,
      currentQuestionIndex: 0,
      responses: [],
      activePrerequisiteChain: [],
      investigatingConceptId: conceptId,
      isComplete: false,
      questionHistory: [],
    };

    const decision = AdaptiveAssessmentAgent.selectNextQuestion(conceptId, []);
    setActiveSession(session);
    setCurrentAssessmentQuestion(decision.nextQuestion);
    setAssessmentReasoning(decision.reasoning.en);
    setIsAssessmentModalOpen(true);
  };

  // Submit Answer to Adaptive Assessment
  const submitAssessmentAnswer = (answer: string) => {
    if (!activeSession || !currentAssessmentQuestion) return;

    const isCorrect = String(answer).trim() === String(currentAssessmentQuestion.correctAnswer).trim();

    const newResponse = {
      questionId: currentAssessmentQuestion.id,
      conceptId: currentAssessmentQuestion.conceptId,
      studentAnswer: answer,
      isCorrect,
      timeSpentSeconds: 12,
      timestamp: new Date().toISOString(),
      difficulty: currentAssessmentQuestion.difficulty,
    };

    const updatedResponses = [...activeSession.responses, newResponse];
    const decision = AdaptiveAssessmentAgent.selectNextQuestion(
      activeSession.primaryConceptId,
      updatedResponses
    );

    if (decision.isAssessmentComplete || !decision.nextQuestion) {
      // Complete assessment and run diagnostic engine!
      const targetStudent = students.find((s) => s.id === activeSession.studentId);
      const studentName = targetStudent ? targetStudent.name : 'Student';

      const diagResult = DiagnosticEngine.analyzeResponses(
        studentName,
        activeSession.primaryConceptId,
        updatedResponses,
        targetStudent?.conceptMasteryMap
      );

      // Update student in state
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id !== activeSession.studentId) return s;
          const statusCat =
            diagResult.diagnosis?.severity === 'high'
              ? 'critical_gap'
              : diagResult.overallMastery >= 75
              ? 'on_track'
              : 'need_practice';

          return {
            ...s,
            overallMastery: diagResult.overallMastery,
            statusCategory: statusCat,
            conceptMasteryMap: diagResult.conceptMasteryUpdates,
            activeDiagnosis: diagResult.diagnosis || s.activeDiagnosis,
            assessmentHistory: [
              ...s.assessmentHistory,
              {
                date: new Date().toISOString().split('T')[0],
                conceptId: activeSession.primaryConceptId,
                score: Math.round(
                  (updatedResponses.filter((r) => r.isCorrect).length / updatedResponses.length) * 100
                ),
                totalQuestions: updatedResponses.length,
              },
            ],
          };
        })
      );

      setActiveSession({
        ...activeSession,
        responses: updatedResponses,
        isComplete: true,
        currentDiagnosis: diagResult.diagnosis,
      });
      setCurrentAssessmentQuestion(null);
      setAssessmentReasoning(decision.reasoning.en);
    } else {
      setActiveSession({
        ...activeSession,
        responses: updatedResponses,
        currentQuestionIndex: activeSession.currentQuestionIndex + 1,
      });
      setCurrentAssessmentQuestion(decision.nextQuestion);
      setAssessmentReasoning(decision.reasoning.en);
    }
  };

  const closeAssessmentModal = () => {
    setIsAssessmentModalOpen(false);
    setActiveSession(null);
    setCurrentAssessmentQuestion(null);
  };

  // Generate Remediation Plan
  const generateRemediationPlan = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student || !student.activeDiagnosis) return;

    const plan = RemediationAgent.generatePlan(
      student.id,
      student.name,
      student.activeDiagnosis.targetConceptId,
      student.activeDiagnosis.targetConceptName,
      student.activeDiagnosis.rootConceptId,
      student.activeDiagnosis.rootConceptName
    );

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, remediationPlan: plan } : s))
    );
  };

  // Open Practice Modal
  const openPracticeModal = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    const rootId = student?.activeDiagnosis?.rootConceptId || 'multiplication_fluency';
    const questions = RemediationAgent.generateTargetedPracticeQuestions(rootId);
    setPracticeQuestions(questions);
    setCurrentPracticeIndex(0);
    setIsPracticeModalOpen(true);
  };

  const closePracticeModal = () => {
    setIsPracticeModalOpen(false);
  };

  const nextPracticeQuestion = () => {
    if (currentPracticeIndex < practiceQuestions.length - 1) {
      setCurrentPracticeIndex((prev) => prev + 1);
    }
  };

  const finishPractice = () => {
    setIsPracticeModalOpen(false);
  };

  // Open Reassessment Modal
  const openReassessmentModal = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (student) {
      setReassessingStudent(student);
      setIsReassessmentModalOpen(true);
    }
  };

  const closeReassessmentModal = () => {
    setIsReassessmentModalOpen(false);
    setReassessingStudent(null);
  };

  // Apply Reassessment Progress (Before vs After Demo showcase!)
  const applyReassessmentProgress = () => {
    if (!reassessingStudent) return;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== reassessingStudent.id) return s;

        // Elevated scores post-remediation
        const updatedMasteryMap = { ...s.conceptMasteryMap };
        if (updatedMasteryMap['multiplication_fluency']) {
          updatedMasteryMap['multiplication_fluency'] = {
            ...updatedMasteryMap['multiplication_fluency'],
            masteryScore: 78,
            status: 'mastered',
            questionsAttempted: updatedMasteryMap['multiplication_fluency'].questionsAttempted + 5,
            questionsCorrect: updatedMasteryMap['multiplication_fluency'].questionsCorrect + 4,
          };
        }
        if (updatedMasteryMap['division_concepts']) {
          updatedMasteryMap['division_concepts'] = {
            ...updatedMasteryMap['division_concepts'],
            masteryScore: 71,
            status: 'developing',
            questionsAttempted: updatedMasteryMap['division_concepts'].questionsAttempted + 5,
            questionsCorrect: updatedMasteryMap['division_concepts'].questionsCorrect + 4,
          };
        }

        return {
          ...s,
          overallMastery: 76,
          statusCategory: 'need_practice', // moved out of critical_gap!
          conceptMasteryMap: updatedMasteryMap,
          assessmentHistory: [
            ...s.assessmentHistory,
            {
              date: new Date().toISOString().split('T')[0],
              conceptId: 'division_concepts',
              score: 71,
              totalQuestions: 6,
              reassessed: true,
              previousScore: 38,
            },
          ],
        };
      })
    );
  };

  // Reset to original demo data
  const resetToDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStudents(INITIAL_STUDENTS);
    setSelectedStudentId('stud_ravi');
  };

  return (
    <AppContext.Provider
      value={{
        students,
        selectedStudent,
        selectStudent,
        classroomOverview,
        isAssessmentModalOpen,
        activeSession,
        currentAssessmentQuestion,
        assessmentReasoning,
        startAssessment,
        submitAssessmentAnswer,
        closeAssessmentModal,
        generateRemediationPlan,
        isPracticeModalOpen,
        practiceQuestions,
        currentPracticeIndex,
        openPracticeModal,
        closePracticeModal,
        nextPracticeQuestion,
        finishPractice,
        isReassessmentModalOpen,
        reassessingStudent,
        openReassessmentModal,
        closeReassessmentModal,
        applyReassessmentProgress,
        isDemoTourOpen,
        setDemoTourOpen,
        isSettingsOpen,
        setSettingsOpen,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
