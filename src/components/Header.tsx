"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Lang } from "@/lib/types";
import {
  ArrowCounterClockwise,
  GraduationCap,
  BookOpen,
  Moon,
  Sun,
  SignOut,
} from "@phosphor-icons/react";
import Link from "next/link";

interface HeaderProps {
  currentView?: "teacher" | "student";
  onViewChange?: (view: "teacher" | "student") => void;
  onResetDemo?: () => void;
  userRole?: "teacher" | "admin" | "student" | null;
  onSignOut?: () => void;
}

export function Header({
  currentView = "teacher",
  onViewChange,
  onResetDemo,
  userRole,
  onSignOut,
}: HeaderProps) {
  const { lang, setLang, dict } = useI18n();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("shikshagap_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("shikshagap_theme", "light");
    }
  };

  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-30">
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-[var(--primary)] focus:text-[var(--primary-foreground)] focus:px-3 focus:py-1 focus:text-xs"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo / Masthead */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-inherit no-underline"
              aria-label="ShikshaGap Home"
            >
              <div className="h-8 w-8 rounded-[2px] bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-mono font-bold text-xs border border-[var(--border)]">
                SG
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-lg tracking-tight text-[var(--foreground)]">
                    ShikshaGap
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-[var(--muted)] text-[var(--foreground)] px-1.5 py-0.2 border border-[var(--border)] rounded-[2px]">
                    Class 5 Maths
                  </span>
                </div>
                <div className="text-[10px] text-[var(--muted-foreground)]">
                  Diagnostic Intelligence | Synthetic Demonstration
                </div>
              </div>
            </Link>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role / View switcher if in app view */}
            {onViewChange && (
              <div className="bg-[var(--background)] p-0.5 rounded-[2px] flex items-center border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => onViewChange("teacher")}
                  className={`h-7 px-2.5 text-xs font-semibold rounded-[2px] flex items-center gap-1.5 ${
                    currentView === "teacher"
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                  }`}
                >
                  <GraduationCap size={14} />
                  <span className="hidden sm:inline">{dict.teacherView}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onViewChange("student")}
                  className={`h-7 px-2.5 text-xs font-semibold rounded-[2px] flex items-center gap-1.5 ${
                    currentView === "student"
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                  }`}
                >
                  <BookOpen size={14} />
                  <span className="hidden sm:inline">{dict.studentView}</span>
                </button>
              </div>
            )}

            {/* Language Switcher */}
            <div className="flex items-center bg-[var(--background)] border border-[var(--border)] rounded-[2px] p-0.5 text-xs">
              {(["en", "hi", "te"] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`px-2 py-0.5 rounded-[2px] font-medium ${
                    lang === l
                      ? "bg-[var(--card)] font-bold text-[var(--primary)] border border-[var(--border)]"
                      : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                  }`}
                >
                  {l === "en" ? "EN" : l === "hi" ? "हिन्दी" : "తెలుగు"}
                </button>
              ))}
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="h-7 w-7 flex items-center justify-center border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-[2px] hover:bg-[var(--muted)]"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Reset Demo Data (labeled clearly as demo reset) */}
            {onResetDemo && (
              <button
                type="button"
                onClick={onResetDemo}
                className="h-7 px-2 text-xs font-medium text-[var(--foreground)] border border-dashed border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] rounded-[2px] hidden md:flex items-center gap-1"
                title="Reset sample demonstration data"
              >
                <ArrowCounterClockwise size={12} />
                <span>Reset Demo</span>
              </button>
            )}

            {/* Sign out if authenticated */}
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="h-7 px-2 text-xs font-medium text-[var(--foreground)] border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] rounded-[2px] flex items-center gap-1"
                title="Sign out of ShikshaGap"
              >
                <SignOut size={12} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
