"use client";

import React, { useState } from "react";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { OfflineSyncBanner } from "@/components/OfflineSyncBanner";
import {
  House,
  Users,
  ChartPieSlice,
  FileText,
  MagnifyingGlass,
  ArrowRight,
  Brain,
  ArrowDown,
  Printer,
  FileArrowDown,
  CheckCircle,
  Warning,
  Table,
  TreeStructure,
} from "@phosphor-icons/react";
import { CONCEPTS, CONCEPT_IDS, prerequisitesOf, dependentsOf } from "@/lib/concepts/graph";
import type { ConceptId } from "@/lib/types";

interface Props {
  students: DemoStudentData[];
  onSelectStudent: (student: DemoStudentData) => void;
  onOpenAssessment: (studentId: string, conceptId: string) => void;
  onPrintWorksheet: (student: DemoStudentData) => void;
}

type TabType = "home" | "students" | "gaps" | "reports";

export function TeacherDashboard({
  students,
  onSelectStudent,
  onOpenAssessment,
  onPrintWorksheet,
}: Props) {
  const { dict, t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedConceptForMap, setSelectedConceptForMap] = useState<ConceptId | null>("mult_facts");
  const [gapsSubView, setGapsSubView] = useState<"common" | "map" | "matrix">("common");

  // Summary Metrics
  const total = students.length;
  const onTrackCount = students.filter((s) => s.profile.status === "on_track").length;
  const needPracticeCount = students.filter((s) => s.profile.status === "need_practice").length;
  const criticalCount = students.filter((s) => s.profile.status === "critical").length;

  // Filtered students for full list
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.student.rollNo).includes(searchQuery);
    const matchesStatus = filterStatus === "all" || s.profile.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate Most Common Root Gaps
  const rootGapCounts = new Map<string, number>();
  students.forEach((s) => {
    s.profile.rootCauses.forEach((rc) => {
      const current = rootGapCounts.get(rc.rootId) || 0;
      rootGapCounts.set(rc.rootId, current + 1);
    });
  });

  const sortedGaps = Array.from(rootGapCounts.entries())
    .map(([cId, count]) => ({
      conceptId: cId as ConceptId,
      count,
      pct: Math.round((count / (total || 1)) * 100),
      severity: count >= 6 ? ("high" as const) : ("medium" as const),
    }))
    .sort((a, b) => b.count - a.count);

  // Top 5 students needing urgent help today
  const urgentStudents = students
    .filter((s) => s.profile.status === "critical" || s.profile.status === "need_practice")
    .slice(0, 5);

  // Concept class stats for knowledge map
  const conceptStats = CONCEPT_IDS.reduce((acc, cId) => {
    let sumMastery = 0;
    let masteredCount = 0;
    let developingCount = 0;
    let supportCount = 0;

    students.forEach((s) => {
      const m = s.profile.concepts[cId]?.mastery ?? 0;
      sumMastery += m;
      if (m >= 0.75) masteredCount++;
      else if (m >= 0.5) developingCount++;
      else supportCount++;
    });

    const avg = total > 0 ? sumMastery / total : 0;
    let status: "mastered" | "developing" | "needs_support" = "mastered";
    if (avg < 0.5) status = "needs_support";
    else if (avg < 0.75) status = "developing";

    acc[cId] = {
      avg: Math.round(avg * 100),
      status,
      masteredCount,
      developingCount,
      supportCount,
    };
    return acc;
  }, {} as Record<ConceptId, { avg: number; status: "mastered" | "developing" | "needs_support"; masteredCount: number; developingCount: number; supportCount: number }>);

  // Export States
  const [isExporting, setIsExporting] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(true);
    setExportError(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, passwordConfirm: exportPassword || undefined }),
      });

      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        if (data.code === "REAUTH_REQUIRED") {
          setShowReauthModal(true);
          setIsExporting(false);
          return;
        }
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setExportError(data.error || "Export failed.");
        setIsExporting(false);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shikshagap_class_5a_records.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setShowReauthModal(false);
      setExportPassword("");
    } catch {
      setExportError("Network error during export.");
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to jump from metric tap to filtered student list
  const handleFilterClick = (status: "on_track" | "need_practice" | "critical") => {
    setFilterStatus(status);
    setActiveTab("students");
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Offline & Sync Status Banner */}
      <OfflineSyncBanner />

      {/* Top Desktop Tabs (Max 4 tabs: Home, Students, Class Gaps, Reports) */}
      <nav aria-label="Teacher Dashboard Navigation" className="border-b border-[#432623]/25 dark:border-[#F5F1BC]/25 flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className={`min-h-[44px] px-4 py-2 font-mono text-xs uppercase font-bold border-b-2 transition-none flex items-center gap-2 ${
            activeTab === "home"
              ? "border-[#DE2A35] text-[#DE2A35] bg-[#FAF8E8] dark:bg-[#381f1c]"
              : "border-transparent text-[#432623]/70 dark:text-[#F5F1BC]/70 hover:text-[#432623]"
          }`}
        >
          <House size={16} />
          <span>{dict.navHome || "Home"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("students")}
          className={`min-h-[44px] px-4 py-2 font-mono text-xs uppercase font-bold border-b-2 transition-none flex items-center gap-2 ${
            activeTab === "students"
              ? "border-[#DE2A35] text-[#DE2A35] bg-[#FAF8E8] dark:bg-[#381f1c]"
              : "border-transparent text-[#432623]/70 dark:text-[#F5F1BC]/70 hover:text-[#432623]"
          }`}
        >
          <Users size={16} />
          <span>{dict.navStudents || "Students"} ({total})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gaps")}
          className={`min-h-[44px] px-4 py-2 font-mono text-xs uppercase font-bold border-b-2 transition-none flex items-center gap-2 ${
            activeTab === "gaps"
              ? "border-[#DE2A35] text-[#DE2A35] bg-[#FAF8E8] dark:bg-[#381f1c]"
              : "border-transparent text-[#432623]/70 dark:text-[#F5F1BC]/70 hover:text-[#432623]"
          }`}
        >
          <ChartPieSlice size={16} />
          <span>{dict.navClassGaps || "Class Gaps"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`min-h-[44px] px-4 py-2 font-mono text-xs uppercase font-bold border-b-2 transition-none flex items-center gap-2 ${
            activeTab === "reports"
              ? "border-[#DE2A35] text-[#DE2A35] bg-[#FAF8E8] dark:bg-[#381f1c]"
              : "border-transparent text-[#432623]/70 dark:text-[#F5F1BC]/70 hover:text-[#432623]"
          }`}
        >
          <FileText size={16} />
          <span>{dict.navReports || "Reports"}</span>
        </button>
      </nav>

      {/* ============================================================== */}
      {/* 1. TEACHER HOME TAB (Ultra-Clean, Passes the 5-Second Test)    */}
      {/* ============================================================== */}
      {activeTab === "home" && (
        <section className="space-y-6">
          {/* Main Question & Classroom Heading */}
          <div className="border border-[#432623]/20 dark:border-[#F5F1BC]/20 p-5 bg-[#FAF8E8] dark:bg-[#381f1c] rounded-[2px]">
            <span className="text-[11px] font-mono uppercase text-[#432623]/70 dark:text-[#F5F1BC]/70 font-bold block mb-1">
              Class 5A Mathematics Overview
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#432623] dark:text-[#F5F1BC]">
              {dict.whoNeedsHelpToday || "Who needs help today"}
            </h1>
          </div>

          {/* 1. THREE NUMBERS ONLY: On Track, Need Practice, Critical */}
          <div>
            <div className="text-[11px] font-mono uppercase text-[#432623]/70 dark:text-[#F5F1BC]/70 font-bold mb-2">
              Class Progress (Tap any number to filter students):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* On Track */}
              <button
                type="button"
                onClick={() => handleFilterClick("on_track")}
                className="p-4 border border-[#8ABB93] bg-[#8ABB93]/15 rounded-[2px] text-left hover:bg-[#8ABB93]/25 transition-none flex flex-col justify-between min-h-[96px]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase font-bold text-[#432623] dark:text-[#F5F1BC]">
                    {dict.onTrack || "On Track"}
                  </span>
                  <span className="w-3 h-3 rounded-[2px] bg-[#8ABB93]" />
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-serif text-4xl font-black text-[#432623] dark:text-[#F5F1BC]">
                    {onTrackCount}
                  </span>
                  <span className="font-mono text-xs text-[#432623]/75 dark:text-[#F5F1BC]/75 font-bold">
                    {Math.round((onTrackCount / (total || 1)) * 100)}%
                  </span>
                </div>
              </button>

              {/* Need Practice */}
              <button
                type="button"
                onClick={() => handleFilterClick("need_practice")}
                className="p-4 border border-[#DFA06E] bg-[#DFA06E]/15 rounded-[2px] text-left hover:bg-[#DFA06E]/25 transition-none flex flex-col justify-between min-h-[96px]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase font-bold text-[#432623] dark:text-[#F5F1BC]">
                    {dict.needPractice || "Need Practice"}
                  </span>
                  <span className="w-3 h-3 rounded-[2px] bg-[#DFA06E]" />
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-serif text-4xl font-black text-[#432623] dark:text-[#F5F1BC]">
                    {needPracticeCount}
                  </span>
                  <span className="font-mono text-xs text-[#432623]/75 dark:text-[#F5F1BC]/75 font-bold">
                    {Math.round((needPracticeCount / (total || 1)) * 100)}%
                  </span>
                </div>
              </button>

              {/* Critical */}
              <button
                type="button"
                onClick={() => handleFilterClick("critical")}
                className="p-4 border border-[#DE2A35] bg-[#DE2A35]/15 rounded-[2px] text-left hover:bg-[#DE2A35]/25 transition-none flex flex-col justify-between min-h-[96px]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase font-bold text-[#DE2A35]">
                    {dict.criticalGaps || "Critical"}
                  </span>
                  <span className="w-3 h-3 rounded-[2px] bg-[#DE2A35]" />
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-serif text-4xl font-black text-[#DE2A35]">
                    {criticalCount}
                  </span>
                  <span className="font-mono text-xs text-[#DE2A35] font-bold">
                    {Math.round((criticalCount / (total || 1)) * 100)}%
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. "WHO NEEDS HELP TODAY": Top 5 Students Only */}
          <div className="border border-[#432623]/25 dark:border-[#F5F1BC]/25 bg-[#FAF8E8] dark:bg-[#381f1c] rounded-[2px] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#432623]/15 dark:border-[#F5F1BC]/15 pb-3">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
                  {dict.whoNeedsHelpToday || "Who needs help today"}
                </h2>
                <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 mt-0.5">
                  Top 5 learners needing teacher support in class today.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#DE2A35] bg-[#DE2A35]/10 px-2.5 py-1 rounded-[2px] border border-[#DE2A35]/30">
                {urgentStudents.length} Students
              </span>
            </div>

            <div className="space-y-3">
              {urgentStudents.map((s) => {
                const root = s.profile.rootCauses[0];
                const isCritical = s.profile.status === "critical";
                const problemDesc = root ? t(`c_${root.rootId}`) : "Prerequisite foundation review";

                return (
                  <div
                    key={s.student.id}
                    className="p-3.5 border border-[#432623]/20 dark:border-[#F5F1BC]/20 bg-[#FAF8E8] dark:bg-[#432623]/30 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Left: Name and One-line problem */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectStudent(s)}
                          className="font-serif font-bold text-base text-[#432623] dark:text-[#F5F1BC] hover:underline text-left"
                        >
                          {s.student.name}
                        </button>
                        <span className="text-[11px] font-mono text-[#432623]/60 dark:text-[#F5F1BC]/60">
                          (Roll #{s.student.rollNo})
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-[2px] border ${
                            isCritical
                              ? "bg-[#DE2A35]/15 text-[#DE2A35] border-[#DE2A35]"
                              : "bg-[#DFA06E]/20 text-[#432623] border-[#DFA06E]"
                          }`}
                        >
                          {isCritical ? "Critical" : "Need Practice"}
                        </span>
                      </div>
                      <p className="text-xs text-[#432623]/85 dark:text-[#F5F1BC]/85">
                        <strong className="text-[#DE2A35]">{problemDesc}</strong>
                      </p>
                    </div>

                    {/* Right: Exactly ONE Action Button */}
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectStudent(s)}
                        className="min-h-[44px] px-3 border border-[#432623]/30 dark:border-[#F5F1BC]/30 text-xs font-mono uppercase text-[#432623] dark:text-[#F5F1BC] hover:bg-[#F5F1BC]/50"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAssessment(s.student.id, root?.rootId || "number_ops")}
                        className="min-h-[44px] px-4 bg-[#DE2A35] text-[#F5F1BC] text-xs font-mono uppercase font-bold border border-[#DE2A35] hover:bg-[#DE2A35]/90 flex items-center gap-1.5"
                      >
                        <span>Practice</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3. "SEE ALL STUDENTS" LINK */}
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("all");
                  setActiveTab("students");
                }}
                className="min-h-[44px] px-4 py-2 border border-[#432623]/30 dark:border-[#F5F1BC]/30 text-xs font-mono uppercase font-bold text-[#432623] dark:text-[#F5F1BC] hover:bg-[#F5F1BC] dark:hover:bg-[#432623] inline-flex items-center gap-1.5"
              >
                <span>{dict.seeAllStudents || "See all students"} ({total})</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 2. STUDENT LIST TAB                                            */}
      {/* ============================================================== */}
      {activeTab === "students" && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#432623]/20 dark:border-[#F5F1BC]/20 pb-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
                Class 5A Student Cohort ({filteredStudents.length} of {total})
              </h2>
              <p className="text-xs text-[#432623]/70 dark:text-[#F5F1BC]/70">
                Tap any student to view their diagnosis and 5-day action plan.
              </p>
            </div>

            {/* Search Box and Single Status Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#432623]/60 dark:text-[#F5F1BC]/60" />
                <Input
                  type="text"
                  placeholder="Search student or roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 min-h-[44px] text-base sm:text-xs font-mono bg-[#FAF8E8] dark:bg-[#381f1c] border border-[#432623]/25 dark:border-[#F5F1BC]/25 rounded-[2px]"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="min-h-[44px] px-3 text-base sm:text-xs font-mono bg-[#FAF8E8] dark:bg-[#381f1c] border border-[#432623]/25 dark:border-[#F5F1BC]/25 rounded-[2px] text-[#432623] dark:text-[#F5F1BC]"
              >
                <option value="all">All Students ({total})</option>
                <option value="critical">Critical Support ({criticalCount})</option>
                <option value="need_practice">Need Practice ({needPracticeCount})</option>
                <option value="on_track">On Track ({onTrackCount})</option>
              </select>
            </div>
          </div>

          {/* Mobile Card View (< 640px) */}
          <div className="sm:hidden space-y-3">
            {filteredStudents.map((s) => {
              const root = s.profile.rootCauses[0];
              const isCritical = s.profile.status === "critical";
              const isNeedPractice = s.profile.status === "need_practice";

              return (
                <div
                  key={s.student.id}
                  onClick={() => onSelectStudent(s)}
                  className="p-4 border border-[#432623]/25 dark:border-[#F5F1BC]/25 bg-[#FAF8E8] dark:bg-[#381f1c] rounded-[2px] cursor-pointer hover:border-[#DE2A35] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-serif font-bold text-base text-[#432623] dark:text-[#F5F1BC]">
                        {s.student.name}
                      </span>
                      <span className="text-xs font-mono text-[#432623]/60 dark:text-[#F5F1BC]/60 ml-1.5">
                        #{s.student.rollNo}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-[2px] border ${
                        isCritical
                          ? "bg-[#DE2A35]/15 text-[#DE2A35] border-[#DE2A35]"
                          : isNeedPractice
                          ? "bg-[#DFA06E]/20 text-[#432623] border-[#DFA06E]"
                          : "bg-[#8ABB93]/20 text-[#8ABB93] border-[#8ABB93]"
                      }`}
                    >
                      {isCritical ? "Critical" : isNeedPractice ? "Need Practice" : "On Track"}
                    </span>
                  </div>

                  <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80">
                    {root ? (
                      <span>Gap: <strong className="text-[#DE2A35]">{t(`c_${root.rootId}`)}</strong></span>
                    ) : (
                      <span className="text-[#8ABB93] font-semibold">Mastering Grade 5 curriculum</span>
                    )}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-[#432623]/10 dark:border-[#F5F1BC]/10 text-xs font-mono">
                    <span className="text-[#432623]/70 dark:text-[#F5F1BC]/70">
                      Mastery: {Math.round((s.profile.overallMastery ?? 0) * 100)}%
                    </span>
                    <span className="text-[#DE2A35] font-bold">Tap to view report &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= 640px) */}
          <div className="hidden sm:block border border-[#432623]/25 dark:border-[#F5F1BC]/25 bg-[#FAF8E8] dark:bg-[#381f1c] rounded-[2px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F5F1BC]/50 dark:bg-[#432623]/60 text-[#432623] dark:text-[#F5F1BC] font-bold text-xs border-b border-[#432623]/20 dark:border-[#F5F1BC]/20">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Main Learning Gap</th>
                    <th className="py-3 px-4">Mastery</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#432623]/15 dark:divide-[#F5F1BC]/15">
                  {filteredStudents.map((s) => {
                    const root = s.profile.rootCauses[0];
                    const isCritical = s.profile.status === "critical";
                    const isNeedPractice = s.profile.status === "need_practice";

                    return (
                      <tr key={s.student.id} className="hover:bg-[#F5F1BC]/30 dark:hover:bg-[#432623]/40">
                        <td className="py-3 px-4 font-semibold text-[#432623] dark:text-[#F5F1BC]">
                          <div className="font-bold">{s.student.name}</div>
                          <div className="text-[11px] text-[#432623]/60 dark:text-[#F5F1BC]/60 font-mono">
                            Roll #{s.student.rollNo}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold uppercase border ${
                              isCritical
                                ? "bg-[#DE2A35]/15 text-[#DE2A35] border-[#DE2A35]"
                                : isNeedPractice
                                ? "bg-[#DFA06E]/20 text-[#432623] dark:text-[#F5F1BC] border-[#DFA06E]"
                                : "bg-[#8ABB93]/20 text-[#8ABB93] border-[#8ABB93]"
                            }`}
                          >
                            {isCritical ? "Critical" : isNeedPractice ? "Need Practice" : "On Track"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {root ? (
                            <span className="font-bold text-[#DE2A35]">{t(`c_${root.rootId}`)}</span>
                          ) : (
                            <span className="text-[#8ABB93] font-semibold">Solid prerequisite foundation</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-xs">
                          {Math.round((s.profile.overallMastery ?? 0) * 100)}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectStudent(s)}
                              className="min-h-[36px] px-3 border border-[#432623]/30 dark:border-[#F5F1BC]/30 text-xs font-mono uppercase font-bold hover:bg-[#F5F1BC]"
                            >
                              Report
                            </button>
                            {root && (
                              <button
                                type="button"
                                onClick={() => onOpenAssessment(s.student.id, root.rootId)}
                                className="min-h-[36px] px-3 bg-[#DE2A35] text-[#F5F1BC] text-xs font-mono uppercase font-bold border border-[#DE2A35] hover:bg-[#DE2A35]/90"
                              >
                                Practice
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 3. CLASS GAPS TAB (Visualizations in their own second level)   */}
      {/* ============================================================== */}
      {activeTab === "gaps" && (
        <section className="space-y-5">
          <div className="border-b border-[#432623]/20 dark:border-[#F5F1BC]/20 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
                Classroom Learning Gaps & Prerequisite Map
              </h2>
              <p className="text-xs text-[#432623]/70 dark:text-[#F5F1BC]/70">
                Explore root-cause bottlenecks and curriculum prerequisite dependencies.
              </p>
            </div>

            {/* Sub-view toggles */}
            <div className="flex items-center bg-[#FAF8E8] dark:bg-[#432623] border border-[#432623]/25 dark:border-[#F5F1BC]/25 rounded-[2px] p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setGapsSubView("common")}
                className={`min-h-[36px] px-3 rounded-[2px] font-bold ${
                  gapsSubView === "common"
                    ? "bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623]"
                    : "text-[#432623] dark:text-[#F5F1BC] hover:bg-[#F5F1BC]/40"
                }`}
              >
                Common Gaps
              </button>
              <button
                type="button"
                onClick={() => setGapsSubView("map")}
                className={`min-h-[36px] px-3 rounded-[2px] font-bold ${
                  gapsSubView === "map"
                    ? "bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623]"
                    : "text-[#432623] dark:text-[#F5F1BC] hover:bg-[#F5F1BC]/40"
                }`}
              >
                Dependency Map
              </button>
              <button
                type="button"
                onClick={() => setGapsSubView("matrix")}
                className={`min-h-[36px] px-3 rounded-[2px] font-bold ${
                  gapsSubView === "matrix"
                    ? "bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623]"
                    : "text-[#432623] dark:text-[#F5F1BC] hover:bg-[#F5F1BC]/40"
                }`}
              >
                Mastery Matrix
              </button>
            </div>
          </div>

          {/* Sub-view 1: Common Gaps List */}
          {gapsSubView === "common" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedGaps.map((gap, index) => (
                <div
                  key={gap.conceptId}
                  className="p-5 border border-[#432623]/25 dark:border-[#F5F1BC]/25 bg-[#FAF8E8] dark:bg-[#381f1c] rounded-[2px] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#432623]/70 dark:text-[#F5F1BC]/70">
                      GAP 0{index + 1}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-[2px] border ${
                        gap.severity === "high"
                          ? "bg-[#DE2A35]/15 text-[#DE2A35] border-[#DE2A35]/30"
                          : "bg-[#DFA06E]/20 text-[#432623] border-[#DFA06E]/40"
                      }`}
                    >
                      {gap.count} Students ({gap.pct}%)
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#432623] dark:text-[#F5F1BC]">
                      {t(`c_${gap.conceptId}`)}
                    </h3>
                    <div className="text-xs text-[#432623]/70 dark:text-[#F5F1BC]/70 mt-0.5">
                      Strand: {CONCEPTS[gap.conceptId]?.strand?.toUpperCase()} (Grade {CONCEPTS[gap.conceptId]?.grade})
                    </div>
                  </div>

                  {/* Clean Progress Bar */}
                  <div className="w-full bg-[#F5F1BC] h-2 rounded-[2px] overflow-hidden">
                    <div
                      className={`h-full rounded-[2px] ${
                        gap.severity === "high" ? "bg-[#DE2A35]" : "bg-[#DFA06E]"
                      }`}
                      style={{ width: `${gap.pct}%` }}
                    />
                  </div>

                  <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
                    Affects {gap.count} learners in Class 5A. Prerequisite for multi-digit division and fraction calculations.
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Sub-view 2: Prerequisite Dependency Map */}
          {gapsSubView === "map" && (
            <div className="space-y-5 p-5 border border-[#432623]/25 dark:border-[#F5F1BC]/25 bg-[#FAF8E8] dark:bg-[#381f1c] rounded-[2px]">
              <div className="border-b border-[#432623]/15 pb-3">
                <h3 className="font-serif text-lg font-bold text-[#432623] dark:text-[#F5F1BC]">
                  Prerequisite Lineage Traversal
                </h3>
                <p className="text-xs text-[#432623]/75 dark:text-[#F5F1BC]/75">
                  Earlier concepts lead into upper grade mathematics. Tap any box to see prerequisites and dependents.
                </p>
              </div>

              {/* Stage 1 */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-[#432623]/70">STAGE 1: FOUNDATION</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["number_sense", "place_value", "addition"] as ConceptId[]).map((cId) => {
                    const st = conceptStats[cId];
                    const isSelected = selectedConceptForMap === cId;
                    return (
                      <div
                        key={cId}
                        onClick={() => setSelectedConceptForMap(cId)}
                        className={`p-3 rounded-[2px] border cursor-pointer ${
                          isSelected
                            ? "border-[#DE2A35] bg-[#F5F1BC]"
                            : "border-[#432623]/25 bg-[#FAF8E8] dark:bg-[#432623]/30 hover:border-[#432623]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-[#432623] dark:text-[#F5F1BC]">
                          <span>{t(`c_${cId}`)}</span>
                          <span>{st.avg}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-center font-bold text-[#432623]/50">&darr;</div>

              {/* Stage 2 */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-[#432623]/70">STAGE 2: OPERATIONS</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["subtraction", "mult_concept", "mult_facts"] as ConceptId[]).map((cId) => {
                    const st = conceptStats[cId];
                    const isSelected = selectedConceptForMap === cId;
                    return (
                      <div
                        key={cId}
                        onClick={() => setSelectedConceptForMap(cId)}
                        className={`p-3 rounded-[2px] border cursor-pointer ${
                          isSelected
                            ? "border-[#DE2A35] bg-[#F5F1BC]"
                            : "border-[#432623]/25 bg-[#FAF8E8] dark:bg-[#432623]/30 hover:border-[#432623]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-[#432623] dark:text-[#F5F1BC]">
                          <span>{t(`c_${cId}`)}</span>
                          <span>{st.avg}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-center font-bold text-[#432623]/50">&darr;</div>

              {/* Stage 3 */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-[#432623]/70">STAGE 3: DIVISION & FRACTIONS</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {(["multi_digit_mult", "division_concept", "division_facts", "fraction_basics"] as ConceptId[]).map((cId) => {
                    const st = conceptStats[cId];
                    const isSelected = selectedConceptForMap === cId;
                    return (
                      <div
                        key={cId}
                        onClick={() => setSelectedConceptForMap(cId)}
                        className={`p-3 rounded-[2px] border cursor-pointer ${
                          isSelected
                            ? "border-[#DE2A35] bg-[#F5F1BC]"
                            : "border-[#432623]/25 bg-[#FAF8E8] dark:bg-[#432623]/30 hover:border-[#432623]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-[#432623] dark:text-[#F5F1BC]">
                          <span className="truncate">{t(`c_${cId}`)}</span>
                          <span>{st.avg}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Concept Info */}
              {selectedConceptForMap && (
                <div className="p-4 border border-[#432623]/25 bg-[#F5F1BC]/40 dark:bg-[#432623]/50 rounded-[2px] text-xs space-y-1">
                  <div className="font-bold text-[#432623] dark:text-[#F5F1BC]">
                    Selected: {t(`c_${selectedConceptForMap}`)}
                  </div>
                  <div>
                    Prerequisites: {prerequisitesOf(selectedConceptForMap).map((p) => t(`c_${p}`)).join(", ") || "Foundational"}
                  </div>
                  <div>
                    Dependents: {dependentsOf(selectedConceptForMap).map((d) => t(`c_${d}`)).join(", ") || "None"}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-view 3: Tabular Mastery Matrix */}
          {gapsSubView === "matrix" && (
            <div className="border border-[#432623]/25 dark:border-[#F5F1BC]/25 bg-[#FAF8E8] dark:bg-[#381f1c] rounded-[2px] overflow-hidden">
              <div className="p-4 border-b border-[#432623]/20 flex items-center justify-between">
                <span className="font-serif font-bold text-base text-[#432623] dark:text-[#F5F1BC]">
                  Student × Concept Matrix
                </span>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#8ABB93]" /> &ge;75%</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#DFA06E]" /> 50-74%</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#DE2A35]" /> &lt;50%</span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8E8] dark:bg-[#381f1c] sticky top-0 border-b border-[#432623]/20">
                    <tr>
                      <th className="py-2.5 px-3 font-bold w-40">Student</th>
                      {CONCEPT_IDS.map((cId) => (
                        <th key={cId} className="py-2.5 px-2 text-center text-[10px] whitespace-nowrap">
                          {t(`c_${cId}`).split(" ")[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#432623]/15">
                    {students.map((s) => (
                      <tr key={s.student.id} className="hover:bg-[#F5F1BC]/30">
                        <td className="py-2 px-3 font-semibold text-[#432623] dark:text-[#F5F1BC] whitespace-nowrap">
                          {s.student.name}
                        </td>
                        {CONCEPT_IDS.map((cId) => {
                          const est = s.profile.concepts[cId];
                          const m = est?.mastery ?? 0;
                          const bg = m >= 0.75 ? "bg-[#8ABB93]" : m >= 0.5 ? "bg-[#DFA06E]" : "bg-[#DE2A35] text-white";
                          return (
                            <td key={cId} className="py-2 px-1 text-center font-mono text-[10px]">
                              <span className={`inline-block px-1 py-0.5 rounded-[2px] ${bg}`}>
                                {Math.round(m * 100)}%
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* 4. REPORTS TAB (Exports, Guardian Notices, Audit Trail)        */}
      {/* ============================================================== */}
      {activeTab === "reports" && (
        <section className="space-y-5">
          <div className="border-b border-[#432623]/20 dark:border-[#F5F1BC]/20 pb-3">
            <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
              Classroom Reports & Institutional Exports
            </h2>
            <p className="text-xs text-[#432623]/70 dark:text-[#F5F1BC]/70">
              Download student records, guardian notices, and inspect security audit trails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export Card */}
            <div className="p-5 border border-[#432623]/25 dark:border-[#F5F1BC]/25 bg-[#FAF8E8] dark:bg-[#381f1c] rounded-[2px] space-y-3">
              <h3 className="font-serif font-bold text-base text-[#432623] dark:text-[#F5F1BC]">
                Data Export (CSV & JSON)
              </h3>
              <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
                Download Class 5A student records with formula injection protection and UTF-8 encoding for Excel.
              </p>
              {exportError && (
                <div className="p-2 border border-[#DE2A35] bg-[#DE2A35]/10 text-xs text-[#DE2A35]">
                  {exportError}
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleExport("csv")}
                  disabled={isExporting}
                  className="min-h-[44px] px-4 bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623] text-xs font-mono uppercase font-bold hover:bg-[#DE2A35]"
                >
                  {isExporting ? "Exporting..." : "Export CSV"}
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("json")}
                  disabled={isExporting}
                  className="min-h-[44px] px-4 border border-[#432623]/30 dark:border-[#F5F1BC]/30 text-xs font-mono uppercase hover:bg-[#F5F1BC]/40"
                >
                  Export JSON
                </button>
              </div>
            </div>

            {/* Guardian Notice Card */}
            <div className="p-5 border border-[#432623]/25 dark:border-[#F5F1BC]/25 bg-[#FAF8E8] dark:bg-[#381f1c] rounded-[2px] space-y-3">
              <h3 className="font-serif font-bold text-base text-[#432623] dark:text-[#F5F1BC]">
                Guardian DPDP Notices
              </h3>
              <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
                Print statutory 1-page parent notices in English, Hindi, and Telugu under DPDP Act 2023.
              </p>
              <div className="pt-1">
                <Link
                  href="/notices/guardian"
                  className="min-h-[44px] px-4 border border-[#432623]/30 dark:border-[#F5F1BC]/30 text-xs font-mono uppercase font-bold inline-flex items-center gap-1.5 hover:bg-[#F5F1BC]"
                >
                  <FileText size={16} />
                  <span>Open Printable Notices</span>
                </Link>
              </div>
            </div>

            {/* Audit Trail Card */}
            <div className="p-5 border border-[#432623]/25 dark:border-[#F5F1BC]/25 bg-[#FAF8E8] dark:bg-[#381f1c] rounded-[2px] space-y-3">
              <h3 className="font-serif font-bold text-base text-[#432623] dark:text-[#F5F1BC]">
                Security Audit Trail
              </h3>
              <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
                Review immutable access logs, export events, share links, and teacher override determinations.
              </p>
              <div className="pt-1">
                <Link
                  href="/app/audit-log"
                  className="min-h-[44px] px-4 border border-[#432623]/30 dark:border-[#F5F1BC]/30 text-xs font-mono uppercase font-bold inline-flex items-center gap-1.5 hover:bg-[#F5F1BC]"
                >
                  <span>View Audit Log</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Re-auth Password Modal */}
          {showReauthModal && (
            <div className="p-4 border border-[#DE2A35] bg-[#DE2A35]/10 rounded-[2px] space-y-3">
              <div className="text-xs font-bold text-[#DE2A35] flex items-center gap-1.5">
                <Warning size={16} />
                <span>Re-authentication Required Prior to Exporting Child Records</span>
              </div>
              <p className="text-xs text-[#432623] dark:text-[#F5F1BC] leading-relaxed">
                To protect student data, verify your teacher credentials:
              </p>
              <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                <input
                  type="password"
                  placeholder="Enter password to confirm"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  className="flex-1 min-h-[44px] px-3 border border-[#432623]/30 bg-[#FAF8E8] text-base sm:text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleExport("csv")}
                  className="min-h-[44px] px-4 bg-[#DE2A35] text-[#F5F1BC] text-xs font-mono uppercase font-bold"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setShowReauthModal(false)}
                  className="min-h-[44px] px-3 border border-[#432623]/30 text-xs font-mono uppercase"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* MOBILE FIXED BOTTOM NAVIGATION BAR (< 640px)                   */}
      {/* ============================================================== */}
      <nav aria-label="Mobile Navigation Bar" className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8E8] dark:bg-[#381f1c] border-t border-[#432623]/25 dark:border-[#F5F1BC]/25 flex items-center justify-around h-16 px-1 safe-area-pb">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 text-[11px] font-mono font-bold uppercase ${
            activeTab === "home" ? "text-[#DE2A35]" : "text-[#432623]/60 dark:text-[#F5F1BC]/60"
          }`}
        >
          <House size={20} />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("students")}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 text-[11px] font-mono font-bold uppercase ${
            activeTab === "students" ? "text-[#DE2A35]" : "text-[#432623]/60 dark:text-[#F5F1BC]/60"
          }`}
        >
          <Users size={20} />
          <span>Students</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gaps")}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 text-[11px] font-mono font-bold uppercase ${
            activeTab === "gaps" ? "text-[#DE2A35]" : "text-[#432623]/60 dark:text-[#F5F1BC]/60"
          }`}
        >
          <ChartPieSlice size={20} />
          <span>Class Gaps</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 text-[11px] font-mono font-bold uppercase ${
            activeTab === "reports" ? "text-[#DE2A35]" : "text-[#432623]/60 dark:text-[#F5F1BC]/60"
          }`}
        >
          <FileText size={20} />
          <span>Reports</span>
        </button>
      </nav>
    </div>
  );
}
