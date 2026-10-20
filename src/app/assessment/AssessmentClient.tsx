'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n, LanguageProvider } from '@/lib/i18n/context';
import { AdaptiveAssessmentView } from '@/components/AdaptiveAssessmentView';
import { DEFAULT_CLASS_ID, getClassConfig } from '@/lib/curriculum/classes';
import { Sun, Moon, ArrowLeft, ShieldCheck, User, Sparkle } from '@phosphor-icons/react';

function AssessmentInner() {
  const router = useRouter();
  const { dict } = useI18n();

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('demo') === 'student' || urlParams.get('mode') === 'demo';
      } catch {
        return false;
      }
    }
    return false;
  });

  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const qClass = urlParams.get('class');
        if (qClass && ['class_3', 'class_4', 'class_5'].includes(qClass)) {
          return qClass;
        }
        if (urlParams.get('demo') === 'student' || urlParams.get('mode') === 'demo') {
          return 'class_5';
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
      try {
        const stored = localStorage.getItem('shikshagap_theme') || localStorage.getItem('theme');
        if (stored) return stored === 'dark';
        return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
      } catch {
        return false;
      }
    }
    return false;
  });

  // Keep demo mode in sync if URL changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('demo') === 'student' || urlParams.get('mode') === 'demo') {
        setIsDemoMode(true);
        setSelectedClassId('class_5');
      }
    }
  }, []);

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

  const handleTryAsStudent = () => {
    setIsDemoMode(true);
    setSelectedClassId('class_5');
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sg_trial_class', 'class_5');
        const url = new URL(window.location.href);
        url.searchParams.set('demo', 'student');
        url.searchParams.set('class', 'class_5');
        window.history.replaceState({}, '', url.toString());
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
      try {
        localStorage.setItem('shikshagap_theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('shikshagap_theme', 'light');
        localStorage.setItem('theme', 'light');
      } catch {}
    }
  };

  const classConfig = getClassConfig(selectedClassId);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="border-b border-border bg-card px-4 sm:px-6 lg:px-8 py-3 sticky top-0 z-40">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
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
              <div className="flex items-center gap-2 flex-wrap">
                <Link href="/" className="flex items-center gap-2">
                  <span className="font-serif font-black text-xl tracking-tight text-foreground">
                    Shiksha<span className="text-primary">Gap</span>
                  </span>
                </Link>
                {isDemoMode ? (
                  <span
                    data-testid="demo-mode-badge"
                    className="inline-flex items-center gap-1 text-xs font-mono uppercase px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-full font-bold shadow-xs"
                  >
                    <Sparkle size={11} weight="fill" className="text-amber-600 dark:text-amber-400" />
                    <span>{dict.demoModeBadge || "Demo mode"}</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline-block text-xs font-mono uppercase px-2 py-0.5 bg-[var(--status-good-bg)] text-[var(--status-good)] border border-[var(--status-good-border)] rounded-[2px] font-bold">
                    Free Student Trial
                  </span>
                )}
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                {classConfig.label} Maths Diagnostic {isDemoMode && '• Preset Profile (Ravi Kumar)'}
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {!isDemoMode && (
              <button
                type="button"
                onClick={handleTryAsStudent}
                data-testid="header-try-as-student-btn"
                className="min-h-[44px] px-3 sm:px-4 py-2 border border-primary bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 text-xs font-mono uppercase font-bold rounded-[2px] cursor-pointer shadow-warm"
              >
                <Sparkle size={14} weight="fill" />
                <span>{dict.tryAsStudent || "Try as a student"}</span>
              </button>
            )}

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

      {/* Main Assessment Container - comfortably wide on laptop and desktop displays */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 xl:p-10">
        <AdaptiveAssessmentView
          isGuest={true}
          isStudentView={true}
          isDemoMode={isDemoMode}
          autoStartDemo={isDemoMode}
          selectedClassId={selectedClassId}
          onClassChange={handleClassChange}
          onCancel={() => {
            router.push('/');
          }}
        />
      </main>

      {/* Privacy and Trust Footer */}
      <footer className="border-t border-border bg-card px-4 py-4 text-center text-xs font-mono text-muted-foreground">
        <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
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
