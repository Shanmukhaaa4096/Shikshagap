"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Lang } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, GraduationCap, School, BookOpen, Compass } from "lucide-react";

interface HeaderProps {
  currentView: "teacher" | "student";
  onViewChange: (view: "teacher" | "student") => void;
  onResetDemo: () => void;
}

export function Header({ currentView, onViewChange, onResetDemo }: HeaderProps) {
  const { lang, setLang, dict } = useI18n();

  return (
    <header className="border-b-[1.5px] border-[#172033]/20 bg-[#FFFFFF] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Swiss Masthead / Logo */}
          <div className="flex items-center gap-3.5">
            <div className="h-9 w-9 rounded-md bg-[#172033] flex items-center justify-center text-white font-mono font-black text-sm border-[1.5px] border-[#172033] shadow-[1.5px_1.5px_0px_#172033]">
              SG
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-serif font-black text-xl tracking-tight text-[#171717]">
                  {dict.appName}
                </span>
                <span className="text-[11px] font-sans text-[#64748B] hidden sm:inline-block">
                  शिक्षा-गैप • శిక్షా-గ్యాప్
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider font-bold bg-[#EBF0FF] text-[#3156D3] px-2 py-0.5 rounded border border-[#3156D3]/30">
                  <School className="w-3 h-3" />
                  {dict.badgeGovtSchool}
                </span>
              </div>
              <p className="text-[11px] font-sans text-[#64748B]">
                {dict.schoolName} • <strong className="text-[#172033] font-semibold">{dict.class5A}</strong>
              </p>
            </div>
          </div>

          {/* Controls: Role Switcher, Language, Reset */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* View Selector — Soft Neo-brutalist Segmented Control */}
            <div className="bg-[#F7F6F2] p-1 rounded-lg flex items-center border-[1.5px] border-[#172033]/20">
              <button
                onClick={() => onViewChange("teacher")}
                className={`h-7 px-3 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                  currentView === "teacher"
                    ? "bg-[#172033] text-white shadow-[1px_1px_0px_#172033]"
                    : "text-[#64748B] hover:text-[#171717]"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{dict.teacherView}</span>
              </button>
              <button
                onClick={() => onViewChange("student")}
                className={`h-7 px-3 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                  currentView === "student"
                    ? "bg-[#172033] text-white shadow-[1px_1px_0px_#172033]"
                    : "text-[#64748B] hover:text-[#171717]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{dict.studentView}</span>
              </button>
            </div>

            {/* Language Selector */}
            <div className="hidden sm:flex items-center bg-[#F7F6F2] border-[1.5px] border-[#172033]/20 rounded-lg p-0.5">
              {(["en", "hi", "te"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 text-xs transition-colors rounded ${
                    lang === l
                      ? "bg-[#FFFFFF] text-[#3156D3] font-bold border border-[#3156D3]/30 shadow-2xs"
                      : "text-[#64748B] hover:text-[#171717] font-medium"
                  }`}
                >
                  {l === "en" ? "EN" : l === "hi" ? "हिन्दी" : "తెలుగు"}
                </button>
              ))}
            </div>

            {/* Reset Demo Data Button */}
            <button
              onClick={onResetDemo}
              className="h-8 px-2.5 text-xs font-semibold text-[#64748B] hover:text-[#171717] border-[1.5px] border-dashed border-[#172033]/30 hover:border-[#172033] rounded-lg transition-colors flex items-center gap-1 bg-[#FFFFFF]"
              title="Reset students to default demo state"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden md:inline">{dict.resetDemo}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
