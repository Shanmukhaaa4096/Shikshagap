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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Authentication failed. Please check your credentials.');
        return;
      }

      // Successful login
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoTeacher = () => {
    setEmail('teacher@shikshagap.in');
    setPassword('ShikshaTeacher@2026');
    setErrorMessage(null);
  };

  const fillDemoAdmin = () => {
    setEmail('admin@shikshagap.in');
    setPassword('ShikshaAdmin@2026');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-card dark:bg-muted text-foreground flex flex-col justify-between p-4 sm:p-8 font-sans">
      <div className="w-full max-w-md mx-auto my-auto py-8">
        {/* Header */}
        <div className="border border-border bg-card dark:bg-muted p-6 mb-4">
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

          {errorMessage && (
            <div 
              role="alert" 
              className="mb-6 p-3 border border-primary bg-primary text-primary-foreground/10 text-foreground text-sm flex items-start gap-2"
            >
              <WarningCircle size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-primary">Access Denied: </span>
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[44px] bg-primary text-primary-foreground dark:bg-muted dark:text-foreground py-2.5 px-4 text-sm font-mono uppercase tracking-wider font-bold border border-border disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Dashboard'}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials for Evaluation */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm font-mono uppercase text-muted-foreground dark:text-muted-foreground mb-2">
              Evaluation & Review Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillDemoTeacher}
                className="text-left p-2 border border-border hover:bg-muted dark:hover:bg-[#381f1c] text-sm"
              >
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle size={12} className="text-[var(--status-good)]" />
                  <span>Class Teacher</span>
                </div>
                <div className="text-muted-foreground dark:text-muted-foreground font-mono text-sm mt-0.5">
                  Class 5 Mathematics
                </div>
              </button>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="text-left p-2 border border-border hover:bg-muted dark:hover:bg-[#381f1c] text-sm"
              >
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle size={12} className="text-[var(--status-warn)]" />
                  <span>Headmaster</span>
                </div>
                <div className="text-muted-foreground dark:text-muted-foreground font-mono text-sm mt-0.5">
                  School Admin Access
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
