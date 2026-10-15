'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeSlash, Lock, User, WarningCircle, CheckCircle } from '@phosphor-icons/react';

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    phone: string;
    url: string;
  } | null>(null);

  const submitWithCredentials = async (loginEmail: string, loginPassword: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    const redirectUrl =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('redirect') || '/app'
        : '/app';

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
      <div className="w-full max-w-md mx-auto my-auto py-8">
        {/* Header */}
        <div className="border border-border bg-card text-card-foreground p-6 mb-4">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
            <div>
              <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-foreground">
                ShikshaGap
              </Link>
              <h1 className="text-sm font-bold uppercase tracking-widest text-foreground/80 dark:text-muted-foreground mt-1">
                Authorized Staff Access
              </h1>
            </div>
            <div className="border border-border px-2 py-1 text-sm font-mono uppercase bg-muted text-foreground">
              v2.4 Sec
            </div>
          </div>

          <p className="text-sm text-foreground/80 dark:text-muted-foreground mb-6 leading-relaxed">
            Restricted portal for verified government school educators and school administrative heads. Student assessment records are protected under India DPDP Act 2023.
          </p>

          {pendingVerification && (
            <div
              role="alert"
              className="mb-6 p-4 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 text-sm rounded-[2px]"
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
                className="inline-block py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-mono font-bold rounded-[2px] transition"
              >
                Complete Verification Now &rarr;
              </Link>
            </div>
          )}

          {errorMessage && !pendingVerification && (
            <div 
              role="alert" 
              className="mb-6 p-3 border border-[var(--status-urgent-border)] bg-[var(--status-urgent-bg)] text-foreground text-sm flex items-start gap-2 rounded-[2px]"
            >
              <WarningCircle size={18} className="text-[var(--status-urgent)] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--status-urgent)]">Access Denied: </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground mb-1"
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
                  className="w-full min-h-[44px] bg-card dark:bg-card border border-border px-3 py-2 text-base sm:text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <User size={18} className="absolute right-3 top-3 text-muted-foreground dark:text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label 
                  htmlFor="password" 
                  className="block text-sm font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground"
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
                    className="min-h-[44px] px-2 text-sm text-muted-foreground dark:text-muted-foreground underline hover:text-foreground dark:hover:text-primary-foreground flex items-center gap-1"
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
                  className="w-full min-h-[44px] bg-card dark:bg-card border border-border px-3 py-2 text-base sm:text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <Lock size={18} className="absolute right-3 top-3 text-muted-foreground dark:text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[44px] bg-primary text-primary-foreground py-2.5 px-4 text-sm font-mono uppercase tracking-wider font-bold border border-primary hover:opacity-95 disabled:opacity-50 flex items-center justify-center cursor-pointer rounded-[2px]"
              >
                {isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Dashboard'}
              </button>

              <Link
                href="/register"
                className="w-full min-h-[44px] bg-card border border-border hover:bg-muted text-foreground py-2.5 px-4 text-xs font-mono uppercase tracking-wider font-bold flex items-center justify-center rounded-[2px] transition"
              >
                New Teacher? Register Here &rarr;
              </Link>
            </div>
          </form>

          {/* Quick Demo Credentials for Evaluation */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm font-mono uppercase text-muted-foreground dark:text-muted-foreground mb-2">
              Evaluation & Review Credentials (1-Click Login)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoTeacher(true)}
                className="text-left p-2.5 border border-border hover:bg-muted text-foreground text-sm rounded-[2px] transition-colors cursor-pointer group"
                title="Click to sign in immediately as Class Teacher"
              >
                <div className="font-bold flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} className="text-[var(--status-good)]" />
                    <span>Class Teacher</span>
                  </div>
                  <span className="text-xs font-mono px-1.5 py-0.5 bg-primary text-primary-foreground font-bold rounded-[2px]">
                    1-Click
                  </span>
                </div>
                <div className="text-muted-foreground font-mono text-xs mt-1">
                  teacher@shikshagap.in
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAdmin(true)}
                className="text-left p-2.5 border border-border hover:bg-muted text-foreground text-sm rounded-[2px] transition-colors cursor-pointer group"
                title="Click to sign in immediately as Headmaster"
              >
                <div className="font-bold flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} className="text-[var(--status-warn)]" />
                    <span>Headmaster</span>
                  </div>
                  <span className="text-xs font-mono px-1.5 py-0.5 bg-primary text-primary-foreground font-bold rounded-[2px]">
                    1-Click
                  </span>
                </div>
                <div className="text-muted-foreground font-mono text-xs mt-1">
                  admin@shikshagap.in
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Back Link & Security Notice */}
        <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground px-1">
          <Link href="/" className="hover:underline">
            &larr; Return to Public Landing Page
          </Link>
          <Link href="/privacy" className="hover:underline">
            DPDP Compliance Policy
          </Link>
        </div>
      </div>

      <footer className="w-full text-center text-sm text-muted-foreground dark:text-muted-foreground py-4 border-t border-border">
        ShikshaGap Educational Intelligence System. All audit trails logged for security compliance.
      </footer>
    </div>
  );
}
