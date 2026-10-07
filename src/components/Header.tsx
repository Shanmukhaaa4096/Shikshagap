"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Lang } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, Sparkles, GraduationCap, School, BookOpen } from "lucide-react";

interface HeaderProps {
  currentView: "teacher" | "student";
  onViewChange: (view: "teacher" | "student") => void;
  onResetDemo: () => void;
}

export function Header({ currentView, onViewChange, onResetDemo }: HeaderProps) {
  const { lang, setLang, dict } = useI18n();

  return (
    <header className="border-b bg-white dark:bg-zinc-950 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Context */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-xl">
              SG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
                  {dict.appName}
                </span>
                <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium flex items-center gap-1 border-blue-200 dark:border-blue-800">
                  <School className="w-3 h-3" />
                  {dict.badgeGovtSchool}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {dict.schoolName} • <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{dict.class5A}</span>
              </p>
            </div>
          </div>

          {/* Controls: Role Switcher, Language, Reset */}
          <div className="flex items-center gap-3">
            {/* View Selector */}
            <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg flex items-center border">
              <Button
                variant={currentView === "teacher" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange("teacher")}
                className={`h-8 px-3 text-xs font-semibold rounded-md ${
                  currentView === "teacher"
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
                {dict.teacherView}
              </Button>
              <Button
                variant={currentView === "student" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange("student")}
                className={`h-8 px-3 text-xs font-semibold rounded-md ${
                  currentView === "student"
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                {dict.studentView}
              </Button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border rounded-lg p-0.5">
              {(["en", "hi", "te"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    lang === l
                      ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                  }`}
                >
                  {l === "en" ? "English" : l === "hi" ? "हिन्दी" : "తెలుగు"}
                </button>
              ))}
            </div>

            {/* Reset Demo Data Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onResetDemo}
              className="h-8 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 border-dashed"
              title="Reset students to default demo state"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              {dict.resetDemo}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
