'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LanguageProvider } from '@/lib/i18n/context';
import { Header } from '@/components/Header';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { StudentDiagnosticModal } from '@/components/StudentDiagnosticModal';
import { AdaptiveAssessmentView } from '@/components/AdaptiveAssessmentView';
import { StudentHome } from '@/components/StudentHome';
import { WorksheetModal } from '@/components/WorksheetModal';
import { TeacherProfileModal } from '@/components/TeacherProfileModal';
import { loadStudents, saveStudents, resetDemoData, type DemoStudentData } from '@/lib/data/demo';

import { DEFAULT_CLASS_ID } from '@/lib/curriculum/classes';

function AuthenticatedApp() {
  const router = useRouter();
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('sg_selected_class') || DEFAULT_CLASS_ID;
      } catch {
        return DEFAULT_CLASS_ID;
      }
    }
    return DEFAULT_CLASS_ID;
  });

  const [students, setStudents] = useState<DemoStudentData[]>(() => loadStudents(selectedClassId));
  const [currentView, setCurrentView] = useState<'teacher' | 'student'>('teacher');
  const [studentSubView, setStudentSubView] = useState<'home' | 'assessment'>('home');
  const [selectedStudent, setSelectedStudent] = useState<DemoStudentData | null>(null);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [worksheetStudent, setWorksheetStudent] = useState<DemoStudentData | null>(null);
  const [isWorksheetOpen, setIsWorksheetOpen] = useState(false);

  // Sync server-persisted teacher classroom progress
  useEffect(() => {
    let active = true;
    fetch(`/api/auth/classroom-data?classId=${selectedClassId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (active && payload?.data && Array.isArray(payload.data) && payload.data.length > 0) {
          setStudents(payload.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [selectedClassId]);

  // Reassessment specific triggers
  const [reassessStudentId, setReassessStudentId] = useState<string | undefined>();
  const [reassessConceptId, setReassessConceptId] = useState<string | undefined>();

  const handleSelectClass = (newClassId: string) => {
    setSelectedClassId(newClassId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sg_selected_class', newClassId);
      } catch {
        // ignore
      }
    }
    const classStudents = loadStudents(newClassId);
    setStudents(classStudents);
    setSelectedStudent(null);
    setIsDiagnosticOpen(false);
  };

  const handleResetDemo = () => {
    const fresh = resetDemoData(selectedClassId);
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
    saveStudents(updated, selectedClassId);

    // Asynchronously persist to server for authenticated teacher
    fetch('/api/auth/classroom-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: selectedClassId, data: updated }),
    }).catch(() => {});

    setSelectedStudent(updatedStudent);
    setIsDiagnosticOpen(true);
    setCurrentView('teacher');
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    // Clear cached student and selection data so returning/different teacher has clean isolated session
    try {
      localStorage.removeItem('sg_selected_class');
      localStorage.removeItem('shikshagap_students_class_3a_v2');
      localStorage.removeItem('shikshagap_students_class_4a_v2');
      localStorage.removeItem('shikshagap_students_class_5a_v2');
    } catch {
      // ignore
    }
    router.push('/login');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-card dark:bg-muted text-foreground font-sans flex flex-col selection:bg-primary selection:text-primary-foreground">
      <Header
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          if (view === 'student') {
            setStudentSubView('home');
          }
        }}
        onResetDemo={handleResetDemo}
        selectedClassId={selectedClassId}
        onSelectClass={handleSelectClass}
        onSignOut={handleSignOut}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'teacher' ? (
          <TeacherDashboard
            students={students}
            onSelectStudent={handleSelectStudent}
            onOpenAssessment={handleOpenAssessment}
            onPrintWorksheet={handlePrintWorksheet}
            selectedClassId={selectedClassId}
            onSelectClass={handleSelectClass}
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
            selectedClassId={selectedClassId}
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

      {/* Teacher Profile & Account Management Modal */}
      <TeacherProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSignOut={handleSignOut}
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
