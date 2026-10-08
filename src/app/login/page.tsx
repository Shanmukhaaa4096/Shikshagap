'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeSlash, Lock, User, WarningCircle, CheckCircle } from '@phosphor-icons/react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

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
    <div className="min-h-screen bg-[#FAF8E8] dark:bg-[#432623] text-[#432623] dark:text-[#F5F1BC] flex flex-col justify-between p-4 sm:p-8 font-sans">
      <div className="w-full max-w-md mx-auto my-auto py-8">
        {/* Header */}
        <div className="border border-[#432623]/25 dark:border-[#F5F1BC]/25 bg-[#FAF8E8] dark:bg-[#432623] p-6 mb-4">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#432623]/20 dark:border-[#F5F1BC]/20">
            <div>
              <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-[#432623] dark:text-[#F5F1BC]">
                ShikshaGap
              </Link>
              <p className="text-xs uppercase tracking-widest text-[#432623]/70 dark:text-[#F5F1BC]/70 mt-1">
                Authorized Staff Access
              </p>
            </div>
            <div className="border border-[#432623]/20 px-2 py-1 text-[11px] font-mono uppercase bg-[#F5F1BC] text-[#432623]">
              v2.4 Sec
            </div>
          </div>

          <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 mb-6 leading-relaxed">
            Restricted portal for verified government school educators and school administrative heads. Student assessment records are protected under India DPDP Act 2023.
          </p>

          {errorMessage && (
            <div 
              role="alert" 
              className="mb-6 p-3 border border-[#DE2A35] bg-[#DE2A35]/10 text-[#432623] dark:text-[#F5F1BC] text-xs flex items-start gap-2"
            >
              <WarningCircle size={18} className="text-[#DE2A35] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#DE2A35]">Access Denied: </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="email" 
                className="block text-xs font-mono uppercase tracking-wider text-[#432623]/90 dark:text-[#F5F1BC]/90 mb-1"
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
                  className="w-full min-h-[44px] bg-[#FAF8E8] dark:bg-[#381f1c] border border-[#432623]/30 dark:border-[#F5F1BC]/30 px-3 py-2 text-base sm:text-xs font-mono text-[#432623] dark:text-[#F5F1BC] focus:outline-none focus:border-[#432623] dark:focus:border-[#F5F1BC]"
                />
                <User size={18} className="absolute right-3 top-3 text-[#432623]/40 dark:text-[#F5F1BC]/40 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label 
                  htmlFor="password" 
                  className="block text-xs font-mono uppercase tracking-wider text-[#432623]/90 dark:text-[#F5F1BC]/90"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="min-h-[44px] px-2 text-[11px] text-[#432623]/70 dark:text-[#F5F1BC]/70 underline hover:text-[#432623] dark:hover:text-[#F5F1BC] flex items-center gap-1"
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
                  className="w-full min-h-[44px] bg-[#FAF8E8] dark:bg-[#381f1c] border border-[#432623]/30 dark:border-[#F5F1BC]/30 px-3 py-2 text-base sm:text-xs font-mono text-[#432623] dark:text-[#F5F1BC] focus:outline-none focus:border-[#432623] dark:focus:border-[#F5F1BC]"
                />
                <Lock size={18} className="absolute right-3 top-3 text-[#432623]/40 dark:text-[#F5F1BC]/40 pointer-events-none" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[44px] bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623] py-2.5 px-4 text-xs font-mono uppercase tracking-wider font-bold border border-[#432623] dark:border-[#F5F1BC] disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Dashboard'}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials for Evaluation */}
          <div className="mt-6 pt-4 border-t border-[#432623]/15 dark:border-[#F5F1BC]/15">
            <p className="text-[11px] font-mono uppercase text-[#432623]/70 dark:text-[#F5F1BC]/70 mb-2">
              Evaluation & Review Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillDemoTeacher}
                className="text-left p-2 border border-[#432623]/20 dark:border-[#F5F1BC]/20 hover:bg-[#F5F1BC]/50 dark:hover:bg-[#381f1c] text-[11px]"
              >
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle size={12} className="text-[#8ABB93]" />
                  <span>Class Teacher</span>
                </div>
                <div className="text-[#432623]/60 dark:text-[#F5F1BC]/60 font-mono text-[10px] mt-0.5">
                  Class 5 Mathematics
                </div>
              </button>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="text-left p-2 border border-[#432623]/20 dark:border-[#F5F1BC]/20 hover:bg-[#F5F1BC]/50 dark:hover:bg-[#381f1c] text-[11px]"
              >
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle size={12} className="text-[#DFA06E]" />
                  <span>Headmaster</span>
                </div>
                <div className="text-[#432623]/60 dark:text-[#F5F1BC]/60 font-mono text-[10px] mt-0.5">
                  School Admin Access
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Back Link & Security Notice */}
        <div className="flex items-center justify-between text-xs text-[#432623]/70 dark:text-[#F5F1BC]/70 px-1">
          <Link href="/" className="hover:underline">
            &larr; Return to Public Landing Page
          </Link>
          <Link href="/privacy" className="hover:underline">
            DPDP Compliance Policy
          </Link>
        </div>
      </div>

      <footer className="w-full text-center text-[11px] text-[#432623]/60 dark:text-[#F5F1BC]/60 py-4 border-t border-[#432623]/10 dark:border-[#F5F1BC]/10">
        ShikshaGap Educational Intelligence System. All audit trails logged for security compliance.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8E8] dark:bg-[#432623] flex items-center justify-center font-mono text-xs text-[#432623] dark:text-[#F5F1BC]">Loading login form...</div>}>
      <LoginForm />
    </Suspense>
  );
}
