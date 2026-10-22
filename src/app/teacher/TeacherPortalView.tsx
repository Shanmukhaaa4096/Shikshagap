'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  SignOut,
  ChalkboardTeacher,
  ShieldCheck,
  Brain,
  TrendUp,
  ArrowRight
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { DICTS } from '@/lib/i18n/dict';

interface Props {
  teacherName: string;
  teacherEmail: string;
  avatarUrl?: string;
}

export default function TeacherPortalView({
  teacherName,
  teacherEmail,
  avatarUrl,
}: Props) {
  const [lang, setLang] = useState<'en' | 'hi' | 'te'>('en');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const t = DICTS[lang];

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    // Hard navigate to /login to ensure all session state is reset
    window.location.assign('/login');
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Navigation Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-foreground hover:opacity-90">
              ShikshaGap
            </Link>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {t.teacherPortal}
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
            {/* Trilingual Language Selector */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full border border-border" role="group" aria-label="Language selection">
              {(['en', 'hi', 'te'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`min-h-[36px] px-3 text-xs font-bold font-mono rounded-full transition-all cursor-pointer ${
                    lang === l
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-pressed={lang === l}
                >
                  {l === 'en' ? 'EN' : l === 'hi' ? 'हिन्दी' : 'తెలుగు'}
                </button>
              ))}
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              data-testid="teacher-signout-btn"
              className="min-h-[44px] px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-foreground text-xs sm:text-sm font-bold font-mono flex items-center gap-2 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
            >
              <SignOut className="w-4 h-4 text-primary" weight="bold" />
              <span>{isSigningOut ? (lang === 'hi' ? 'साइन आउट...' : lang === 'te' ? 'సైన్ అవుట్...' : 'Signing out...') : t.signOut}</span>
            </button>
          </div>
        </header>

        {/* Welcome Card */}
        <section aria-labelledby="welcome-heading" className="neo-panel bg-card border border-border rounded-[24px] p-6 sm:p-8 shadow-warm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={teacherName}
                  className="w-16 h-16 rounded-full border-2 border-primary object-cover shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center border-2 border-primary/20 shrink-0">
                  <ChalkboardTeacher className="w-8 h-8" weight="fill" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-primary">
                    {t.verifiedTeacherBadge}
                  </span>
                  <span className="text-muted-foreground text-xs">•</span>
                  <span className="text-xs font-mono text-[var(--status-good)] flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" weight="bold" />
                    <span>Google OAuth Verified</span>
                  </span>
                </div>
                <h1 id="welcome-heading" className="text-2xl sm:text-3xl font-serif font-black text-foreground tracking-tight mt-1">
                  {t.welcomeTeacher}, <span data-testid="teacher-name">{teacherName}</span>!
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {t.signedInAs} <strong className="font-mono text-foreground">{teacherEmail}</strong>
                </p>
              </div>
            </div>

            <div className="bg-muted/40 border border-border p-3 rounded-[16px] text-xs font-mono text-muted-foreground shrink-0 self-start sm:self-center">
              <span className="text-primary font-bold">Academic Session:</span> 2024–25 (Classes 1–10)
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.teacherPortalDesc}
          </p>
        </section>

        {/* Quick Launch Cards */}
        <section aria-labelledby="tools-heading" className="space-y-4">
          <h2 id="tools-heading" className="text-sm font-mono uppercase font-bold tracking-wider text-muted-foreground">
            Classroom Tools &amp; Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Dashboard Card */}
            <div className="p-6 rounded-[22px] bg-card border border-border shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <TrendUp className="w-5 h-5 text-primary" weight="bold" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {t.goToDashboard}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Inspect student learning trajectories, examine prerequisite dependencies, and see which foundational skills need review today.
                </p>
              </div>

              <Link
                href="/app"
                data-testid="teacher-dashboard-link"
                className="neo-btn neo-btn-primary min-h-[48px] px-5 text-xs sm:text-sm font-bold rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-warm"
              >
                <span>{t.goToDashboard}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Assessment Check Card */}
            <div className="p-6 rounded-[22px] bg-card border border-border shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-[var(--status-good-bg)] text-[var(--status-good)] flex items-center justify-center border border-[var(--status-good-border)]">
                  <Brain className="w-5 h-5" weight="bold" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {t.launchStudentCheck}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Start an adaptive diagnostic check for any student or class from Class 1 through 10. Students never need login credentials.
                </p>
              </div>

              <Link
                href="/assessment"
                data-testid="teacher-assessment-link"
                className="neo-btn neo-btn-secondary min-h-[48px] px-5 text-xs sm:text-sm font-bold rounded-full flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t.launchStudentCheck}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Privacy Note */}
        <footer className="p-4 rounded-[18px] bg-card border border-border text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" weight="bold" />
            <span>Built following DPDP Act 2023 principles • Student assessment records are strictly isolated.</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
