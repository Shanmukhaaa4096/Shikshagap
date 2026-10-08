"use client";

import React, { useState, useEffect } from "react";
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
  onSignOut,
}: HeaderProps) {
  const { lang, setLang, dict } = useI18n();
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    }
  };

  return (
    <header className="border-b border-[#432623]/25 dark:border-[#F5F1BC]/25 bg-[#FAF8E8] dark:bg-[#381f1c] sticky top-0 z-30">
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-[#DE2A35] focus:text-[#F5F1BC] focus:px-3 focus:py-1 focus:text-xs font-mono"
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
              <div className="h-8 w-8 rounded-[2px] bg-[#DE2A35] flex items-center justify-center text-[#F5F1BC] font-mono font-bold text-xs border border-[#432623]/30">
                SG
              </div>
              <div>
                <span className="font-serif font-bold text-lg tracking-tight text-[#432623] dark:text-[#F5F1BC]">
                  ShikshaGap
                </span>
                <span className="ml-2 text-xs font-mono font-bold uppercase text-[#432623]/80 dark:text-[#F5F1BC]/80 border border-[#432623]/20 dark:border-[#F5F1BC]/20 px-1.5 py-0.5 rounded-[2px] bg-[#F5F1BC]/40 dark:bg-[#432623]">
                  Class 5A
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Language switch + View toggle + Menu */}
          <div className="flex items-center gap-2">
            {/* View Switcher: Teacher vs Student */}
            {onViewChange && (
              <div className="hidden sm:flex items-center bg-[#FAF8E8] dark:bg-[#432623] border border-[#432623]/25 dark:border-[#F5F1BC]/25 rounded-[2px] p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => onViewChange("teacher")}
                  className={`min-h-[36px] px-2.5 rounded-[2px] flex items-center gap-1.5 font-bold ${
                    currentView === "teacher"
                      ? "bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623]"
                      : "text-[#432623] dark:text-[#F5F1BC] hover:bg-[#F5F1BC]/40"
                  }`}
                >
                  <GraduationCap size={15} />
                  <span>Teacher</span>
                </button>
                <button
                  type="button"
                  onClick={() => onViewChange("student")}
                  className={`min-h-[36px] px-2.5 rounded-[2px] flex items-center gap-1.5 font-bold ${
                    currentView === "student"
                      ? "bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623]"
                      : "text-[#432623] dark:text-[#F5F1BC] hover:bg-[#F5F1BC]/40"
                  }`}
                >
                  <BookOpen size={15} />
                  <span>Student</span>
                </button>
              </div>
            )}

            {/* Language Switcher */}
            <div className="flex items-center border border-[#432623]/25 dark:border-[#F5F1BC]/25 rounded-[2px] p-0.5 text-xs font-mono">
              {(["en", "hi", "te"] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`min-h-[36px] px-2 rounded-[2px] font-bold ${
                    lang === l
                      ? "bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623]"
                      : "text-[#432623] dark:text-[#F5F1BC] hover:bg-[#F5F1BC]/40"
                  }`}
                >
                  {l === "en" ? "EN" : l === "hi" ? "हिन्दी" : "తెలుగు"}
                </button>
              ))}
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-[#432623]/25 dark:border-[#F5F1BC]/25 rounded-[2px] text-[#432623] dark:text-[#F5F1BC] hover:bg-[#F5F1BC]/40"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Mobile / Secondary Menu Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-[#432623]/25 dark:border-[#F5F1BC]/25 rounded-[2px] text-[#432623] dark:text-[#F5F1BC] hover:bg-[#F5F1BC]/40"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={18} /> : <List size={18} />}
            </button>
          </div>
        </div>

        {/* Dropdown Menu when toggled */}
        {isMenuOpen && (
          <div className="border-t border-[#432623]/20 dark:border-[#F5F1BC]/20 py-3 space-y-2 font-mono text-xs">
            {/* View switcher on mobile */}
            {onViewChange && (
              <div className="sm:hidden flex items-center gap-2 pb-2 border-b border-[#432623]/10 dark:border-[#F5F1BC]/10">
                <button
                  type="button"
                  onClick={() => {
                    onViewChange("teacher");
                    setIsMenuOpen(false);
                  }}
                  className={`flex-1 min-h-[44px] px-3 border border-[#432623]/25 rounded-[2px] font-bold flex items-center justify-center gap-2 ${
                    currentView === "teacher"
                      ? "bg-[#432623] text-[#F5F1BC]"
                      : "bg-[#FAF8E8] text-[#432623]"
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
                  className={`flex-1 min-h-[44px] px-3 border border-[#432623]/25 rounded-[2px] font-bold flex items-center justify-center gap-2 ${
                    currentView === "student"
                      ? "bg-[#432623] text-[#F5F1BC]"
                      : "bg-[#FAF8E8] text-[#432623]"
                  }`}
                >
                  <BookOpen size={16} />
                  <span>Student View</span>
                </button>
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
                  className="min-h-[44px] px-3 border border-dashed border-[#432623]/30 text-[#432623] dark:text-[#F5F1BC] hover:bg-[#F5F1BC]/50 flex items-center gap-1.5"
                >
                  <ArrowCounterClockwise size={14} />
                  <span>Reset Demo Data</span>
                </button>
              )}

              <Link
                href="/app/audit-log"
                onClick={() => setIsMenuOpen(false)}
                className="min-h-[44px] px-3 border border-[#432623]/20 text-[#432623] dark:text-[#F5F1BC] inline-flex items-center hover:bg-[#F5F1BC]/50"
              >
                <span>Audit Trail</span>
              </Link>

              <Link
                href="/notices/guardian"
                onClick={() => setIsMenuOpen(false)}
                className="min-h-[44px] px-3 border border-[#432623]/20 text-[#432623] dark:text-[#F5F1BC] inline-flex items-center hover:bg-[#F5F1BC]/50"
              >
                <span>Guardian Notice</span>
              </Link>

              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="min-h-[44px] px-3 border border-[#DE2A35] text-[#DE2A35] hover:bg-[#DE2A35]/10 flex items-center gap-1.5 font-bold"
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
