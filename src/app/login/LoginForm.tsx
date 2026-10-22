'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeSlash, Lock, User, WarningCircle, CheckCircle, ShieldCheck } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { DICTS } from '@/lib/i18n/dict';

interface LoginFormProps {
  initialError?: string | null;
  initialRedirect?: string;
}

export default function LoginForm({ initialError = null, initialRedirect = '/app' }: LoginFormProps) {
  const [lang, setLang] = useState<'en' | 'hi' | 'te'>('en');
  const t = DICTS[lang];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(initialError);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    phone: string;
    url: string;
  } | null>(null);

  // Google OAuth Handler
  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    setGoogleError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setGoogleError(error.message);
        setIsGoogleLoading(false);
      }
    } catch (err: unknown) {
      setGoogleError(err instanceof Error ? err.message : t.googleAuthFailed);
      setIsGoogleLoading(false);
    }
  };

  const submitWithCredentials = async (loginEmail: string, loginPassword: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    const redirectUrl =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('redirect') || initialRedirect || '/app'
        : initialRedirect || '/app';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.code === 'PENDING_VERIFICATION') {
          const emailParam = encodeURIComponent(data.pendingEmail || loginEmail);
          const phoneParam = encodeURIComponent(data.pendingPhone || '');
          setPendingVerification({
            email: data.pendingEmail || loginEmail,
            phone: data.pendingPhone || '',
            url: `/verify?email=${emailParam}&phone=${phoneParam}`,
          });
          setErrorMessage(data.error || 'Your account registration is incomplete. Please verify your phone and email.');
        } else {
          setErrorMessage(data.error || 'Authentication failed. Please check your credentials.');
        }
        setIsLoading(false);
        return;
      }

      // Hard navigation ensures session cookie is immediately sent to middleware/protected routes on first click
      window.location.assign(redirectUrl);
    } catch {
      setErrorMessage('Network connection error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitWithCredentials(email, password);
  };

  const fillDemoTeacher = (autoSubmit = false) => {
    const demoEmail = 'teacher@shikshagap.in';
    const demoPass = 'ShikshaTeacher@2026';
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
    if (autoSubmit) {
      submitWithCredentials(demoEmail, demoPass);
    }
  };

  const fillDemoAdmin = (autoSubmit = false) => {
    const demoEmail = 'admin@shikshagap.in';
    const demoPass = 'ShikshaAdmin@2026';
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
    if (autoSubmit) {
      submitWithCredentials(demoEmail, demoPass);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-8 font-sans">
      <div className="w-full max-w-md mx-auto my-auto py-6 sm:py-8">
        {/* Header Card */}
        <div className="border border-border bg-card text-card-foreground p-6 rounded-[24px] shadow-warm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border gap-2">
            <div>
              <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-foreground hover:opacity-90">
                ShikshaGap
              </Link>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-primary mt-0.5">
                {t.teacherLogin}
              </h1>
            </div>

            {/* Trilingual Language Selector */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full border border-border" role="group" aria-label="Language selection">
              {(['en', 'hi', 'te'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`min-h-[36px] px-2.5 text-xs font-bold font-mono rounded-full transition-all cursor-pointer ${
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
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t.teacherPortalDesc}
          </p>

          {/* Google OAuth Error Alert */}
          {googleError && (
            <div
              role="alert"
              className="p-3.5 border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 text-xs sm:text-sm rounded-[16px] flex items-start gap-2"
            >
              <WarningCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{t.googleAuthFailed || googleError}</span>
            </div>
          )}

          {/* Primary Action: Sign in with Google */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              data-testid="google-signin-btn"
              aria-label="Sign in with Google"
              className="w-full min-h-[48px] px-4 py-3 rounded-full border border-[#747775] dark:border-[#747775] !bg-white hover:!bg-[#F8F9FA] active:!bg-[#F1F3F4] !text-[#1F1F1F] dark:!text-[#1F1F1F] text-sm sm:text-base font-semibold font-sans flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#1F1F1F',
                borderColor: '#747775',
              }}
            >
              {/* Google G Logo SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.9c2.28-2.1 3.645-5.2 3.645-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.93H1.21v3.15C3.25 21.42 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.27c-.24-.73-.38-1.5-.38-2.27s.14-1.54.38-2.27V6.58H1.21C.44 8.11 0 9.99 0 12s.44 3.89 1.21 5.42l4.11-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.58 1.21 6.58l4.11 3.15c.94-2.83 3.58-4.98 6.68-4.98z"
                />
              </svg>
              <span className="font-semibold tracking-normal !text-[#1F1F1F] dark:!text-[#1F1F1F]" style={{ color: '#1F1F1F' }}>
                {isGoogleLoading
                  ? (lang === 'hi' ? 'Google से जुड़ रहे हैं...' : lang === 'te' ? 'Googleతో కనెక్ట్ అవుతోంది...' : 'Connecting to Google...')
                  : (t.signInWithGoogle || 'Sign in with Google')}
              </span>
            </button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck size={14} className="text-primary" />
              <span>Google OAuth 2.0 • Built following DPDP Act 2023 principles</span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full" />
            <span className="bg-card px-3 text-xs font-mono text-muted-foreground uppercase shrink-0">
              {lang === 'hi' ? 'या संस्थागत क्रेडेंशियल्स' : lang === 'te' ? 'లేదా సంస్థాగత ఆధారాలు' : 'or institutional login'}
            </span>
            <div className="border-t border-border w-full" />
          </div>

          {pendingVerification && (
            <div
              role="alert"
              className="p-4 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 text-sm rounded-[16px]"
            >
              <div className="font-bold flex items-center gap-2 mb-1">
                <WarningCircle size={18} className="text-amber-600 dark:text-amber-400" />
                <span>Verification Incomplete</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200 mb-3">
                Your teacher account has been registered, but requires phone SMS OTP and email verification before access is granted.
              </p>
              <Link
                href={pendingVerification.url}
                className="inline-block py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-mono font-bold rounded-full transition"
              >
                Complete Verification Now &rarr;
              </Link>
            </div>
          )}

          {errorMessage && !pendingVerification && (
            <div
              role="alert"
              className="p-3 border border-[var(--status-urgent-border)] bg-[var(--status-urgent-bg)] text-foreground text-sm flex items-start gap-2 rounded-[16px]"
            >
              <WarningCircle size={18} className="text-[var(--status-urgent)] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--status-urgent)]">Access Denied: </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Institutional Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1"
              >
                Institutional Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@school.gov.in"
                  className="w-full min-h-[44px] bg-card border border-border px-3 py-2 rounded-[12px] text-base sm:text-sm font-mono text-foreground focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <User size={18} className="absolute right-3 top-3 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-mono uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </label>
                <div className="flex items-center gap-3">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary underline hover:opacity-80"
                  >
                    Forgot password?
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="min-h-[44px] px-2 text-xs text-muted-foreground underline hover:text-foreground flex items-center gap-1 cursor-pointer"
                    aria-label={showPassword ? 'Hide password text' : 'Show password text'}
                  >
                    {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[44px] bg-card border border-border px-3 py-2 rounded-[12px] text-base sm:text-sm font-mono text-foreground focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <Lock size={18} className="absolute right-3 top-3 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[48px] bg-primary text-primary-foreground py-2.5 px-4 text-sm font-mono uppercase tracking-wider font-bold rounded-full hover:opacity-95 disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-warm"
              >
                {isLoading ? 'Verifying Credentials...' : 'Authenticate with Password'}
              </button>

              <Link
                href="/register"
                className="w-full min-h-[44px] bg-card border border-border hover:bg-muted text-foreground py-2 px-4 text-xs font-mono uppercase tracking-wider font-bold flex items-center justify-center rounded-full transition"
              >
                New Teacher? Register Here &rarr;
              </Link>
            </div>
          </form>

          {/* Quick Demo Credentials for Evaluation (Students & Demo Mode Never Require Login) */}
          <div className="pt-3 border-t border-border">
            <p className="text-xs font-mono uppercase text-muted-foreground mb-2">
              Evaluation & Review Credentials (1-Click Demo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoTeacher(true)}
                className="text-left p-2.5 border border-border hover:bg-muted text-foreground text-xs rounded-[16px] transition-colors cursor-pointer group"
                title="Click to sign in immediately as Class Teacher"
              >
                <div className="font-bold flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} className="text-[var(--status-good)]" />
                    <span>Class Teacher</span>
                  </div>
                  <span className="text-xs font-mono px-1.5 py-0.5 bg-primary text-primary-foreground font-bold rounded-full">
                    1-Click
                  </span>
                </div>
                <div className="text-muted-foreground font-mono text-xs mt-1 truncate">
                  teacher@shikshagap.in
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAdmin(true)}
                className="text-left p-2.5 border border-border hover:bg-muted text-foreground text-xs rounded-[16px] transition-colors cursor-pointer group"
                title="Click to sign in immediately as Headmaster"
              >
                <div className="font-bold flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} className="text-[var(--status-warn)]" />
                    <span>Headmaster</span>
                  </div>
                  <span className="text-xs font-mono px-1.5 py-0.5 bg-primary text-primary-foreground font-bold rounded-full">
                    1-Click
                  </span>
                </div>
                <div className="text-muted-foreground font-mono text-xs mt-1 truncate">
                  admin@shikshagap.in
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Back Link & Security Notice */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2 pt-4">
          <Link href="/" className="hover:underline">
            &larr; Return to Public Landing Page
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy (DPDP Act 2023 Principles)
          </Link>
        </div>
      </div>

      <footer className="w-full text-center text-xs text-muted-foreground py-4 border-t border-border">
        ShikshaGap Educational Intelligence System. Built following DPDP Act 2023 principles.
      </footer>
    </div>
  );
}
