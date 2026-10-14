'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LanguageProvider } from '@/lib/i18n/context';
import { AdaptiveAssessmentView } from '@/components/AdaptiveAssessmentView';
import { DEFAULT_CLASS_ID, getClassConfig } from '@/lib/curriculum/classes';
import { Sun, Moon, ArrowLeft, ShieldCheck, User } from '@phosphor-icons/react';

function AssessmentInner() {
  const router = useRouter();
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const qClass = urlParams.get('class');
        if (qClass && ['class_3', 'class_4', 'class_5'].includes(qClass)) {
          return qClass;
        }
        return localStorage.getItem('sg_trial_class') || DEFAULT_CLASS_ID;
      } catch {
        return DEFAULT_CLASS_ID;
      }
    }
    return DEFAULT_CLASS_ID;
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sg_trial_class', newClassId);
      } catch {
        // ignore
      }
    }
  };

  const toggleTheme = () => {
    if (typeof window === 'undefined') return;
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const classConfig = getClassConfig(selectedClassId);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="border-b border-border bg-card px-4 sm:px-6 py-3 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Back Link */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 border border-border rounded-[2px] text-foreground hover:bg-muted"
              aria-label="Return to ShikshaGap homepage"
              title="Return to Home"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <Link href="/" className="flex items-center gap-2">
                <span className="font-serif font-black text-xl tracking-tight text-foreground">
                  Shiksha<span className="text-primary">Gap</span>
                </span>
                <span className="hidden sm:inline-block text-xs font-mono uppercase px-2 py-0.5 bg-[var(--status-good-bg)] text-[var(--status-good)] border border-[var(--status-good-border)] rounded-[2px] font-bold">
                  Free Student Trial
                </span>
              </Link>
              <div className="text-xs font-mono text-muted-foreground">
                {classConfig.label} Maths Diagnostic
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center border border-border bg-transparent hover:bg-muted text-foreground rounded-[2px] cursor-pointer"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link
              href="/login?redirect=/app"
              className="min-h-[44px] px-3 sm:px-4 py-2 border border-border bg-transparent text-foreground inline-flex items-center gap-1.5 text-xs font-mono uppercase font-bold hover:bg-muted rounded-[2px]"
            >
              <User size={14} />
              <span className="hidden sm:inline">Teacher Sign In</span>
              <span className="sm:hidden">Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Assessment Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AdaptiveAssessmentView
          isGuest={true}
          isStudentView={true}
          selectedClassId={selectedClassId}
          onClassChange={handleClassChange}
          onCancel={() => {
            router.push('/');
          }}
        />
      </main>

      {/* Privacy and Trust Footer */}
      <footer className="border-t border-border bg-card px-4 py-4 text-center text-xs font-mono text-muted-foreground">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[var(--status-good)]" />
            <span>DPDP Act 2023 Compliant • Strictly Pseudonymous • Zero Child Tracking Cookies</span>
          </div>
          <div>
            <span>Government School Maths Curriculum (Classes 3 to 5)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AssessmentClient() {
  return (
    <LanguageProvider>
      <AssessmentInner />
    </LanguageProvider>
  );
}
