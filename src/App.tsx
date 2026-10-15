import { LanguageProvider } from './i18n/LanguageContext';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { ClassroomDashboard } from './components/ClassroomDashboard';
import { StudentModal } from './components/StudentModal';
import { DemoTourModal } from './components/DemoTourModal';
import { AssessmentModal } from './components/AssessmentModal';
import { PracticeModal } from './components/PracticeModal';
import { ReassessmentModal } from './components/ReassessmentModal';
import { SettingsModal } from './components/SettingsModal';

function AppContent() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ClassroomDashboard />
      </main>

      {/* Modals */}
      <StudentModal />
      <DemoTourModal />
      <AssessmentModal />
      <PracticeModal />
      <ReassessmentModal />
      <SettingsModal />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <strong>ShikshaGap</strong> • AI-Powered Learning Gap Diagnostic & Prerequisite Remediation Engine
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>DPDP Act 2023 Compliant</span>
            <span>•</span>
            <span>No Child PII Collected</span>
            <span>•</span>
            <span>NCERT/State Curriculum Aligned</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </LanguageProvider>
  );
}
