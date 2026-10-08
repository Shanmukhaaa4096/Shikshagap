'use client';

import React, { useState, useEffect } from 'react';
import { LanguageProvider } from '@/lib/i18n/context';
import { Header } from '@/components/Header';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { StudentDiagnosticModal } from '@/components/StudentDiagnosticModal';
import { AdaptiveAssessmentView } from '@/components/AdaptiveAssessmentView';
import { StudentHome } from '@/components/StudentHome';
import { WorksheetModal } from '@/components/WorksheetModal';
import { loadStudents, saveStudents, resetDemoData, type DemoStudentData } from '@/lib/data/demo';

function AuthenticatedApp() {
  const [students, setStudents] = useState<DemoStudentData[]>(() => loadStudents());
  const [currentView, setCurrentView] = useState<'teacher' | 'student'>('teacher');
  const [studentSubView, setStudentSubView] = useState<'home' | 'assessment'>('home');
  const [selectedStudent, setSelectedStudent] = useState<DemoStudentData | null>(null);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [worksheetStudent, setWorksheetStudent] = useState<DemoStudentData | null>(null);
  const [isWorksheetOpen, setIsWorksheetOpen] = useState(false);

  // Reassessment specific triggers
  const [reassessStudentId, setReassessStudentId] = useState<string | undefined>();
  const [reassessConceptId, setReassessConceptId] = useState<string | undefined>();

  // Load students on mount
  useEffect(() => {
    const loaded = loadStudents();
    setStudents(loaded);
  }, []);

  const handleResetDemo = () => {
    const fresh = resetDemoData();
    setStudents(fresh);
    setIsDiagnosticOpen(false);
    setSelectedStudent(null);
  };

  const handleSelectStudent = (studentData: DemoStudentData) => {
    setSelectedStudent(studentData);
    setIsDiagnosticOpen(true);
  };

  const handleOpenAssessment = (studentId: string, conceptId: string) => {
    setReassessStudentId(studentId);
    setReassessConceptId(conceptId);
    setIsDiagnosticOpen(false);
    setStudentSubView('assessment');
    setCurrentView('student');
  };

  const handlePrintWorksheet = (studentData: DemoStudentData) => {
    setWorksheetStudent(studentData);
    setIsWorksheetOpen(true);
  };

  const handleAssessmentCompleted = (updatedStudent: DemoStudentData) => {
    const updated = students.map((s) =>
      s.student.id === updatedStudent.student.id ? updatedStudent : s
    );
    setStudents(updated);
    saveStudents(updated);
    setSelectedStudent(updatedStudent);
    setIsDiagnosticOpen(true);
    setCurrentView('teacher');
  };

  return (
    <div className="min-h-screen bg-[#FAF8E8] dark:bg-[#432623] text-[#432623] dark:text-[#F5F1BC] font-sans flex flex-col selection:bg-[#DE2A35] selection:text-[#F5F1BC]">
      <Header
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          if (view === 'student') {
            setStudentSubView('home');
          }
        }}
        onResetDemo={handleResetDemo}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'teacher' ? (
          <TeacherDashboard
            students={students}
            onSelectStudent={handleSelectStudent}
            onOpenAssessment={handleOpenAssessment}
            onPrintWorksheet={handlePrintWorksheet}
          />
        ) : studentSubView === 'home' ? (
          <StudentHome
            studentData={selectedStudent || students[0]}
            onStartPractice={(conceptId) => {
              const activeS = selectedStudent || students[0];
              setReassessStudentId(activeS.student.id);
              setReassessConceptId(conceptId);
              setStudentSubView('assessment');
            }}
            onTakeAssessment={(studentId, conceptId) => {
              setReassessStudentId(studentId);
              setReassessConceptId(conceptId);
              setStudentSubView('assessment');
            }}
          />
        ) : (
          <AdaptiveAssessmentView
            students={students}
            initialStudentId={reassessStudentId || selectedStudent?.student.id || students[0]?.student.id}
            initialConceptId={reassessConceptId}
            isStudentView={true}
            onAssessmentCompleted={(updatedStudent) => {
              handleAssessmentCompleted(updatedStudent);
              setStudentSubView('home');
            }}
            onCancel={() => setStudentSubView('home')}
          />
        )}
      </main>

      {/* Student Diagnostic Profile & 5-Day Plan Modal */}
      <StudentDiagnosticModal
        data={selectedStudent}
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        onStartReassessment={handleOpenAssessment}
        onPrintWorksheet={handlePrintWorksheet}
      />

      {/* Printable Worksheet Modal */}
      <WorksheetModal
        data={worksheetStudent}
        isOpen={isWorksheetOpen}
        onClose={() => setIsWorksheetOpen(false)}
      />
    </div>
  );
}

export default function AppPage() {
  return (
    <LanguageProvider>
      <AuthenticatedApp />
    </LanguageProvider>
  );
}
