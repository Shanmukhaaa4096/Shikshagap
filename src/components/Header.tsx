"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { Lang } from "@/lib/types";
import {
  Moon,
  Sun,
  SignOut,
  List,
  X,
  GraduationCap,
  BookOpen,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { getClassConfig, DEFAULT_CLASS_ID } from "@/lib/curriculum/classes";
import { ClassSelector } from "./ClassSelector";

interface HeaderProps {
  currentView?: "teacher" | "student";
  onViewChange?: (view: "teacher" | "student") => void;
  onResetDemo?: () => void;
  userRole?: "teacher" | "admin" | "student" | null;
  onSignOut?: () => void;
  selectedClassId?: string;
  onSelectClass?: (classId: string) => void;
}

export function Header({
  currentView = "teacher",
  onViewChange,
  onResetDemo,
  onSignOut,
  selectedClassId = DEFAULT_CLASS_ID,
  onSelectClass,
}: HeaderProps) {
  const { lang, setLang } = useI18n();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const savedTheme = localStorage.getItem("shikshagap_theme");
        if (savedTheme) {
          return savedTheme === "dark";
        }
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
      } catch {
        return false;
      }
    }
    return false;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    try {
      localStorage.setItem("shikshagap_theme", nextDark ? "dark" : "light");
    } catch {
      // ignore
    }
  };

  return (
    <header className="border-b border-border bg-card dark:bg-card sticky top-0 z-30">
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary text-primary-foreground focus:text-primary-foreground focus:px-3 focus:py-1 focus:text-sm font-mono"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left: Logo & Class Name */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="flex items-center gap-2 text-inherit no-underline"
              aria-label="ShikshaGap Home"
            >
              <div className="h-8 w-8 rounded-[2px] bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold text-sm border border-border">
                SG
              </div>
              <div>
                <span className="font-serif font-bold text-lg tracking-tight text-foreground">
                  ShikshaGap
                </span>
                <span className="ml-2 text-sm font-mono font-bold uppercase text-foreground/80 dark:text-muted-foreground border border-border px-1.5 py-0.5 rounded-[2px] bg-muted dark:bg-muted">
                  {getClassConfig(selectedClassId).shortLabel}
                </span>
              </div>
            </Link>

            {onSelectClass && (
              <div className="hidden md:flex items-center ml-2 pl-2 border-l border-border">
                <ClassSelector
                  selectedClassId={selectedClassId}
                  onSelectClass={onSelectClass}
                  compact={true}
                />
              </div>
            )}
          </div>

          {/* Right: Language switch + View toggle + Menu */}
          <div className="flex items-center gap-2">
            {/* View Switcher: Teacher vs Student */}
            {onViewChange && (
              <div className="hidden sm:flex items-center gap-1 bg-card dark:bg-muted border border-border rounded-[2px] p-1 text-sm font-mono">
                <button
                  type="button"
                  onClick={() => onViewChange("teacher")}
                  className={`min-h-[44px] px-3 rounded-[2px] flex items-center gap-1.5 font-bold ${
                    currentView === "teacher"
                      ? "bg-primary text-primary-foreground dark:bg-muted dark:text-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  aria-label="Switch to teacher view"
                >
                  <GraduationCap size={16} />
                  <span>Teacher</span>
                </button>
                <button
                  type="button"
                  onClick={() => onViewChange("student")}
                  className={`min-h-[44px] px-3 rounded-[2px] flex items-center gap-1.5 font-bold ${
                    currentView === "student"
                      ? "bg-primary text-primary-foreground dark:bg-muted dark:text-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  aria-label="Switch to student view"
                >
                  <BookOpen size={16} />
                  <span>Student</span>
                </button>
              </div>
            )}

            {/* Language Switcher */}
            <div className="flex items-center gap-1 border border-border rounded-[2px] p-1 text-sm font-mono" role="group" aria-label="Select language">
              {(["en", "hi", "te"] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`min-h-[44px] min-w-[44px] px-2.5 rounded-[2px] font-bold ${
                    lang === l
                      ? "bg-primary text-primary-foreground dark:bg-muted dark:text-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  aria-label={l === "en" ? "Switch language to English" : l === "hi" ? "Switch language to Hindi" : "Switch language to Telugu"}
                  aria-pressed={lang === l}
                >
                  {l === "en" ? "EN" : l === "hi" ? "हिन्दी" : "తెలుగు"}
                </button>
              ))}
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-border rounded-[2px] text-foreground hover:bg-muted"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Mobile / Secondary Menu Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-border rounded-[2px] text-foreground hover:bg-muted"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={18} /> : <List size={18} />}
            </button>
          </div>
        </div>

        {/* Dropdown Menu when toggled */}
        {isMenuOpen && (
          <div className="border-t border-border py-3 space-y-2 font-mono text-sm">
            {/* View switcher on mobile */}
            {onViewChange && (
              <div className="sm:hidden flex items-center gap-2 pb-2 border-b border-border">
                <button
                  type="button"
                  onClick={() => {
                    onViewChange("teacher");
                    setIsMenuOpen(false);
                  }}
                  className={`flex-1 min-h-[44px] px-3 border border-border rounded-[2px] font-bold flex items-center justify-center gap-2 ${
                    currentView === "teacher"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground"
                  }`}
                >
                  <GraduationCap size={16} />
                  <span>Teacher View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onViewChange("student");
                    setIsMenuOpen(false);
                  }}
                  className={`flex-1 min-h-[44px] px-3 border border-border rounded-[2px] font-bold flex items-center justify-center gap-2 ${
                    currentView === "student"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground"
                  }`}
                >
                  <BookOpen size={16} />
                  <span>Student View</span>
                </button>
              </div>
            )}

            {/* Class switcher on mobile */}
            {onSelectClass && (
              <div className="md:hidden pb-2 border-b border-border">
                <div className="text-sm text-muted-foreground dark:text-muted-foreground uppercase tracking-wider mb-1">
                  Active Class
                </div>
                <ClassSelector
                  selectedClassId={selectedClassId}
                  onSelectClass={(cls) => {
                    onSelectClass(cls);
                    setIsMenuOpen(false);
                  }}
                  compact={false}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {onResetDemo && (
                <button
                  type="button"
                  onClick={() => {
                    onResetDemo();
                    setIsMenuOpen(false);
                  }}
                  className="min-h-[44px] px-3 border border-dashed border-border text-foreground hover:bg-muted flex items-center gap-1.5"
                >
                  <ArrowCounterClockwise size={14} />
                  <span>Reset Demo Data</span>
                </button>
              )}

              <Link
                href="/app/audit-log"
                onClick={() => setIsMenuOpen(false)}
                className="min-h-[44px] px-3 border border-border text-foreground inline-flex items-center hover:bg-muted"
              >
                <span>Audit Trail</span>
              </Link>

              <Link
                href="/notices/guardian"
                onClick={() => setIsMenuOpen(false)}
                className="min-h-[44px] px-3 border border-border text-foreground inline-flex items-center hover:bg-muted"
              >
                <span>Guardian Notice</span>
              </Link>

              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="min-h-[44px] px-3 border border-primary text-primary hover:bg-primary text-primary-foreground/10 flex items-center gap-1.5 font-bold"
                >
                  <SignOut size={14} />
                  <span>Sign out</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
