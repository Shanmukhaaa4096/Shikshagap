"use client";

import React, { useState } from "react";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  CheckCircle,
  AlertTriangle,
  Flame,
  Search,
  ArrowRight,
  Brain,
  Sparkles,
  ArrowDown,
  Layers,
  Activity,
  FileSpreadsheet,
  Network,
  Printer,
  ChevronRight,
} from "lucide-react";
import { CONCEPTS, CONCEPT_IDS, prerequisitesOf, dependentsOf } from "@/lib/concepts/graph";
import type { ConceptId } from "@/lib/types";

interface Props {
  students: DemoStudentData[];
  onSelectStudent: (student: DemoStudentData) => void;
  onOpenAssessment: (studentId: string, conceptId: string) => void;
  onPrintWorksheet: (student: DemoStudentData) => void;
}

export function TeacherDashboard({
  students,
  onSelectStudent,
  onOpenAssessment,
  onPrintWorksheet,
}: Props) {
  const { dict, t } = useI18n();
  const [activeTab, setActiveTab] = useState<"interventions" | "map" | "gaps" | "matrix">("interventions");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedConceptForMap, setSelectedConceptForMap] = useState<ConceptId | null>("mult_facts");

  // Summary Metrics
  const total = students.length;
  const onTrackCount = students.filter((s) => s.profile.status === "on_track").length;
  const needPracticeCount = students.filter((s) => s.profile.status === "need_practice").length;
  const criticalCount = students.filter((s) => s.profile.status === "critical").length;

  // Filtered students for list
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

  // Top critical students needing urgent intervention (compact top list)
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

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. FIRST VIEWPORT: WHO NEEDS MY ATTENTION? (SWISS EDITORIAL)   */}
      {/* ============================================================== */}
      <section className="bg-white border-[1.5px] border-[#172033] rounded-xl p-5 sm:p-6 shadow-[2px_3px_0px_rgba(23,32,51,0.08)]">
        {/* Editorial Masthead Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b-[1.5px] border-[#172033]/15">
          <div>
            <div className="flex items-center gap-2">
              <span className="editorial-meta">ACADEMIC DIAGNOSTICS</span>
              <span className="text-[#64748B] text-xs">•</span>
              <span className="text-xs font-mono font-semibold text-[#3156D3]">PM SHRI CLASS 5 — SEC A</span>
            </div>
            <h1 className="editorial-title text-2xl sm:text-3xl text-[#171717] mt-0.5">
              Teacher Intelligence Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] font-sans mt-0.5">
              Mathematics Diagnostic Status • Real-time pedagogical overview answering:{" "}
              <strong className="text-[#171717] font-semibold">Who needs my attention today?</strong>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                const firstCritical = students.find((s) => s.profile.status === "critical");
                onOpenAssessment(firstCritical?.student.id || students[0]?.student.id || "student_1", "math");
              }}
              className="neo-btn neo-btn-primary px-4 py-2.5 text-xs sm:text-sm flex items-center gap-2 font-bold"
            >
              <Sparkles className="w-4 h-4 text-blue-300" />
              <span>START AI DIAGNOSTIC</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Swiss Metric Figures (Compact, No card-in-card bloat) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          {/* Total */}
          <div className="p-3.5 bg-[#F7F6F2] rounded-lg border-[1.5px] border-[#172033]/20 flex flex-col justify-between">
            <span className="editorial-meta text-[#64748B]">{dict.totalStudents}</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-serif text-3xl font-extrabold text-[#171717]">{total}</span>
              <span className="text-[11px] font-mono text-[#64748B]">Class 5A</span>
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">100% evaluated</div>
          </div>

          {/* On Track */}
          <div className="p-3.5 bg-[#F0FFF4] rounded-lg border-[1.5px] border-[#2F855A] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="editorial-meta text-[#2F855A]">{dict.onTrack}</span>
              <span className="w-2 h-2 rounded-full bg-[#2F855A]" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-serif text-3xl font-extrabold text-[#2F855A]">{onTrackCount}</span>
              <span className="text-[11px] font-mono font-bold text-[#2F855A]">
                {Math.round((onTrackCount / (total || 1)) * 100)}%
              </span>
            </div>
            <div className="text-[11px] text-[#2F855A]/90 mt-1">Fluent across prerequisites</div>
          </div>

          {/* Developing */}
          <div className="p-3.5 bg-[#FFFDF5] rounded-lg border-[1.5px] border-[#B7791F] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="editorial-meta text-[#B7791F]">{dict.needPractice}</span>
              <span className="w-2 h-2 rounded-full bg-[#B7791F]" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-serif text-3xl font-extrabold text-[#B7791F]">{needPracticeCount}</span>
              <span className="text-[11px] font-mono font-bold text-[#B7791F]">
                {Math.round((needPracticeCount / (total || 1)) * 100)}%
              </span>
            </div>
            <div className="text-[11px] text-[#B7791F]/90 mt-1">Needs targeted practice</div>
          </div>

          {/* Need Support */}
          <div className="p-3.5 bg-[#FFF5F5] rounded-lg border-[1.5px] border-[#C53030] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="editorial-meta text-[#C53030]">{dict.criticalGaps}</span>
              <span className="w-2 h-2 rounded-full bg-[#C53030]" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-serif text-3xl font-extrabold text-[#C53030]">{criticalCount}</span>
              <span className="text-[11px] font-mono font-bold text-[#C53030]">
                {Math.round((criticalCount / (total || 1)) * 100)}%
              </span>
            </div>
            <div className="text-[11px] text-[#C53030]/90 mt-1">Blocked by root cause</div>
          </div>
        </div>

        {/* Viewport Sub-Grid: Learning Gaps Distribution vs Priority Interventions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-6 mt-6 border-t-[1.5px] border-[#172033]/15">
          {/* Left Column (5 cols): LEARNING GAPS THIS WEEK */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="editorial-meta">CURRICULUM BOTTLENECK DISTRIBUTION</span>
                <h3 className="font-serif font-bold text-base text-[#171717] mt-0.5">
                  Most Common Gaps This Week
                </h3>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] border-[#172033]/20">
                CLASS 5A
              </Badge>
            </div>

            <p className="text-xs text-[#64748B]">
              Aggregated root-cause isolation identifying missing prerequisite skills blocking class progress.
            </p>

            <div className="space-y-2.5 pt-1">
              {sortedGaps.slice(0, 4).map((gap, idx) => (
                <div
                  key={gap.conceptId}
                  className="p-3 bg-[#F7F6F2] border-[1.5px] border-[#172033]/20 rounded-lg hover:border-[#172033] transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#171717]">
                      <span className="font-mono text-[10px] text-[#64748B]">0{idx + 1}</span>
                      <span>{t(`c_${gap.conceptId}`)}</span>
                    </div>
                    <span className="font-mono font-bold text-[#172033]">
                      {gap.count} learners ({gap.pct}%)
                    </span>
                  </div>

                  {/* Clean Minimal Progress Bar */}
                  <div className="w-full bg-[#E2E2DC] h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full ${
                        gap.severity === "high" ? "bg-[#C53030]" : "bg-[#B7791F]"
                      }`}
                      style={{ width: `${Math.min(gap.pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-[#64748B]">
                    <span>Affects division &amp; fractions</span>
                    <span className="uppercase font-semibold text-[#172033]">
                      {gap.severity === "high" ? "Urgent Remediation" : "Targeted Drill"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (7 cols): PRIORITY INTERVENTIONS (Immediate teacher focus) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="editorial-meta">ACTION REQUIRED</span>
                <h3 className="font-serif font-bold text-base text-[#171717] mt-0.5">
                  Priority Interventions (Who Needs Support)
                </h3>
              </div>
              <span className="text-[11px] font-mono font-semibold text-[#C53030] bg-[#FFF5F5] px-2 py-0.5 rounded border border-[#C53030]/30">
                {criticalCount + needPracticeCount} Learners
              </span>
            </div>

            <p className="text-xs text-[#64748B]">
              Sorted by diagnostic urgency. Each student has a diagnosed prerequisite root cause.
            </p>

            {/* Compact Swiss Table */}
            <div className="border-[1.5px] border-[#172033] rounded-lg overflow-hidden bg-white shadow-[1.5px_2px_0px_rgba(23,32,51,0.06)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F6F2] text-[#171717] font-bold border-b-[1.5px] border-[#172033]/20">
                    <tr>
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Diagnosed Root Gap</th>
                      <th className="py-2.5 px-2">Priority</th>
                      <th className="py-2.5 px-3 text-right">Pedagogical Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#172033]/10">
                    {urgentStudents.map((s) => {
                      const root = s.profile.rootCauses[0];
                      const isCritical = s.profile.status === "critical";
                      return (
                        <tr
                          key={s.student.id}
                          className="hover:bg-[#F7F6F2]/80 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-semibold text-[#171717]">
                            <div className="font-bold">{s.student.name}</div>
                            <div className="text-[10px] text-[#64748B] font-mono">
                              Roll #{s.student.rollNo} • {Math.round((s.profile.overallMastery ?? 0) * 100)}% Mastery
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {root ? (
                              <div>
                                <span className="font-bold text-[#C53030]">
                                  {t(`c_${root.rootId}`)}
                                </span>
                                <div className="text-[10px] text-[#64748B]">
                                  Affecting: {root.symptomIds.map((sym) => t(`c_${sym}`)).join(", ")}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[#64748B] italic">Prerequisite check</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                isCritical
                                  ? "bg-[#FFF5F5] text-[#C53030] border border-[#C53030]/30"
                                  : "bg-[#FFFDF5] text-[#B7791F] border border-[#B7791F]/30"
                              }`}
                            >
                              {isCritical ? "HIGH" : "MEDIUM"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onSelectStudent(s)}
                                className="neo-btn neo-btn-secondary px-2.5 py-1 text-[11px] font-bold"
                              >
                                View Report
                              </button>
                              {root && (
                                <button
                                  onClick={() => onOpenAssessment(s.student.id, root.rootId)}
                                  className="neo-btn neo-btn-primary px-2.5 py-1 text-[11px] font-bold flex items-center gap-1"
                                >
                                  <span>Reassess</span>
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
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. DEEP INTELLIGENCE TABS                                      */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {/* Soft Neo-Brutalist Tab Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-[#172033]/20 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("interventions")}
              className={`h-9 px-3.5 text-xs font-bold rounded-lg border-[1.5px] transition-all flex items-center gap-1.5 ${
                activeTab === "interventions"
                  ? "bg-[#172033] text-white border-[#172033] shadow-[2px_2px_0px_#172033]"
                  : "bg-white text-[#171717] border-[#172033]/20 hover:border-[#172033]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Students ({students.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("map")}
              className={`h-9 px-3.5 text-xs font-bold rounded-lg border-[1.5px] transition-all flex items-center gap-1.5 ${
                activeTab === "map"
                  ? "bg-[#172033] text-white border-[#172033] shadow-[2px_2px_0px_#172033]"
                  : "bg-white text-[#171717] border-[#172033]/20 hover:border-[#172033]"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Learning Dependency Map</span>
            </button>

            <button
              onClick={() => setActiveTab("matrix")}
              className={`h-9 px-3.5 text-xs font-bold rounded-lg border-[1.5px] transition-all flex items-center gap-1.5 ${
                activeTab === "matrix"
                  ? "bg-[#172033] text-white border-[#172033] shadow-[2px_2px_0px_#172033]"
                  : "bg-white text-[#171717] border-[#172033]/20 hover:border-[#172033]"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Mastery Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab("gaps")}
              className={`h-9 px-3.5 text-xs font-bold rounded-lg border-[1.5px] transition-all flex items-center gap-1.5 ${
                activeTab === "gaps"
                  ? "bg-[#172033] text-white border-[#172033] shadow-[2px_2px_0px_#172033]"
                  : "bg-white text-[#171717] border-[#172033]/20 hover:border-[#172033]"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Remediation Insights</span>
            </button>
          </div>

          {/* Search & Filter for Students Tab */}
          {activeTab === "interventions" && (
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <Input
                  placeholder="Search name or roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white border-[1.5px] border-[#172033]/20 focus-visible:border-[#172033] rounded-lg"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-white border-[1.5px] border-[#172033]/20 rounded-lg h-8 px-2 font-medium"
              >
                <option value="all">All Status</option>
                <option value="critical">Critical Support</option>
                <option value="need_practice">Developing</option>
                <option value="on_track">On Track</option>
              </select>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: ALL STUDENTS LIST                                     */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "interventions" && (
          <div className="neo-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F7F6F2] text-[#171717] font-bold text-xs border-b-[1.5px] border-[#172033]/20">
                  <tr>
                    <th className="py-3 px-4">{dict.studentName}</th>
                    <th className="py-3 px-4">{dict.symptomConcept}</th>
                    <th className="py-3 px-4">{dict.rootCauseConcept}</th>
                    <th className="py-3 px-4">{dict.severity}</th>
                    <th className="py-3 px-4 text-right">{dict.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#172033]/10">
                  {filteredStudents.map((s) => {
                    const root = s.profile.rootCauses[0];
                    return (
                      <tr
                        key={s.student.id}
                        className="hover:bg-[#F7F6F2]/80 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#171717]">
                            {s.student.name}
                          </div>
                          <div className="text-xs text-[#64748B] font-mono">
                            Roll #{s.student.rollNo} • Mastery: {Math.round((s.profile.overallMastery ?? 0) * 100)}%
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">
                          {root && root.symptomIds.length > 0 ? (
                            <span className="font-medium text-[#171717]">
                              {root.symptomIds.map((sym) => t(`c_${sym}`)).join(", ")}
                            </span>
                          ) : (
                            <span className="text-[#64748B] italic">None (On Track)</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {root ? (
                            <div className="font-bold text-[#C53030]">
                              {t(`c_${root.rootId}`)}
                            </div>
                          ) : (
                            <span className="text-[#2F855A] font-semibold flex items-center gap-1 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Fluent Prerequisite
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                              s.profile.status === "critical"
                                ? "bg-[#FFF5F5] text-[#C53030] border-[#C53030]/40"
                                : s.profile.status === "need_practice"
                                ? "bg-[#FFFDF5] text-[#B7791F] border-[#B7791F]/40"
                                : "bg-[#F0FFF4] text-[#2F855A] border-[#2F855A]/40"
                            }`}
                          >
                            {s.profile.status === "critical"
                              ? dict.highSeverity
                              : s.profile.status === "need_practice"
                              ? dict.mediumSeverity
                              : dict.lowSeverity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onSelectStudent(s)}
                              className="neo-btn neo-btn-secondary px-3 py-1 text-xs font-semibold"
                            >
                              {dict.diagnoseBtn}
                            </button>
                            {root && (
                              <button
                                onClick={() => onOpenAssessment(s.student.id, root.rootId)}
                                className="neo-btn neo-btn-primary px-3 py-1 text-xs font-semibold flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                {dict.practiceBtn}
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
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: ACADEMIC LEARNING DEPENDENCY MAP                       */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "map" && (
          <div className="neo-panel p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-[1.5px] border-[#172033]/15">
              <div>
                <span className="editorial-meta">SIGNATURE ACADEMIC INTELLIGENCE</span>
                <h3 className="editorial-title text-xl text-[#171717]">
                  Mathematics Concept Dependency Graph (Class 3–5)
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5 max-w-2xl">
                  Prerequisites cascade downwards. When students stumble on upper-tier concepts (e.g., Division or Fractions), the diagnostic engine traces prerequisite lineages to isolate the exact foundation gap.
                </p>
              </div>

              {/* Status Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs bg-[#F7F6F2] p-2.5 rounded-lg border-[1.5px] border-[#172033]/20">
                <span className="flex items-center gap-1.5 font-semibold text-[#171717]">
                  <span className="w-2.5 h-2.5 rounded bg-[#2F855A]" />
                  Mastered (≥75%)
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-[#171717]">
                  <span className="w-2.5 h-2.5 rounded bg-[#B7791F]" />
                  Developing (50–74%)
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-[#171717]">
                  <span className="w-2.5 h-2.5 rounded bg-[#C53030]" />
                  Needs Support (&lt;50%)
                </span>
              </div>
            </div>

            {/* Academic Knowledge Map Visualizer */}
            <div className="space-y-6">
              {/* Level 1: Foundational Number Sense */}
              <div className="space-y-2">
                <div className="editorial-meta text-[#64748B]">STAGE 1: FOUNDATIONAL NUMBER SENSE</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["number_sense", "place_value", "addition"] as ConceptId[]).map((cId) => {
                    const st = conceptStats[cId];
                    const isSelected = selectedConceptForMap === cId;
                    return (
                      <div
                        key={cId}
                        onClick={() => setSelectedConceptForMap(cId)}
                        className={`p-3.5 rounded-lg border-[1.5px] cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#172033] bg-[#EBF0FF] shadow-[2px_2px_0px_#172033]"
                            : "border-[#172033]/20 bg-white hover:border-[#172033]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#171717]">{t(`c_${cId}`)}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              st.status === "mastered"
                                ? "bg-[#2F855A]"
                                : st.status === "developing"
                                ? "bg-[#B7791F]"
                                : "bg-[#C53030]"
                            }`}
                          />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between text-xs">
                          <span className="font-mono font-bold text-sm text-[#171717]">{st.avg}%</span>
                          <span className="text-[10px] text-[#64748B]">Grade {CONCEPTS[cId].grade}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dependency Flow Arrow */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#64748B] bg-[#F7F6F2] px-3 py-1 rounded border border-[#172033]/20">
                  <span>PREREQUISITE DEPENDENCY FLOW</span>
                  <ArrowDown className="w-3.5 h-3.5 text-[#172033]" />
                </div>
              </div>

              {/* Level 2: Subtraction & Multiplication Foundations */}
              <div className="space-y-2">
                <div className="editorial-meta text-[#64748B]">STAGE 2: MULTIPLICATION &amp; SUBTRACTION PREREQUISITES</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["subtraction", "mult_concept", "mult_facts"] as ConceptId[]).map((cId) => {
                    const st = conceptStats[cId];
                    const isSelected = selectedConceptForMap === cId;
                    return (
                      <div
                        key={cId}
                        onClick={() => setSelectedConceptForMap(cId)}
                        className={`p-3.5 rounded-lg border-[1.5px] cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#172033] bg-[#EBF0FF] shadow-[2px_2px_0px_#172033]"
                            : "border-[#172033]/20 bg-white hover:border-[#172033]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#171717]">{t(`c_${cId}`)}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              st.status === "mastered"
                                ? "bg-[#2F855A]"
                                : st.status === "developing"
                                ? "bg-[#B7791F]"
                                : "bg-[#C53030]"
                            }`}
                          />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between text-xs">
                          <span className="font-mono font-bold text-sm text-[#171717]">{st.avg}%</span>
                          <span className="text-[10px] text-[#64748B]">Grade {CONCEPTS[cId].grade}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dependency Flow Arrow */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#64748B] bg-[#F7F6F2] px-3 py-1 rounded border border-[#172033]/20">
                  <span>PREREQUISITE DEPENDENCY FLOW</span>
                  <ArrowDown className="w-3.5 h-3.5 text-[#172033]" />
                </div>
              </div>

              {/* Level 3: Division Operations & Multi-digit */}
              <div className="space-y-2">
                <div className="editorial-meta text-[#64748B]">STAGE 3: DIVISION OPERATIONS &amp; MULTI-DIGIT FLUENCY</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {(["multi_digit_mult", "division_concept", "division_facts", "fraction_basics"] as ConceptId[]).map((cId) => {
                    const st = conceptStats[cId];
                    const isSelected = selectedConceptForMap === cId;
                    return (
                      <div
                        key={cId}
                        onClick={() => setSelectedConceptForMap(cId)}
                        className={`p-3.5 rounded-lg border-[1.5px] cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#172033] bg-[#EBF0FF] shadow-[2px_2px_0px_#172033]"
                            : "border-[#172033]/20 bg-white hover:border-[#172033]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#171717] truncate">{t(`c_${cId}`)}</span>
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ml-1 ${
                              st.status === "mastered"
                                ? "bg-[#2F855A]"
                                : st.status === "developing"
                                ? "bg-[#B7791F]"
                                : "bg-[#C53030]"
                            }`}
                          />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between text-xs">
                          <span className="font-mono font-bold text-sm text-[#171717]">{st.avg}%</span>
                          <span className="text-[10px] text-[#64748B]">Grade {CONCEPTS[cId].grade}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dependency Flow Arrow */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#64748B] bg-[#F7F6F2] px-3 py-1 rounded border border-[#172033]/20">
                  <span>PREREQUISITE DEPENDENCY FLOW</span>
                  <ArrowDown className="w-3.5 h-3.5 text-[#172033]" />
                </div>
              </div>

              {/* Level 4: Upper Grade 5 Mastery (Long Division, Word Problems, Fractions) */}
              <div className="space-y-2">
                <div className="editorial-meta text-[#64748B]">STAGE 4: GRADE 5 TARGETS &amp; FRACTIONS</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {(["long_division", "division_word", "equivalent_fractions", "comparing_fractions"] as ConceptId[]).map((cId) => {
                    const st = conceptStats[cId];
                    const isSelected = selectedConceptForMap === cId;
                    return (
                      <div
                        key={cId}
                        onClick={() => setSelectedConceptForMap(cId)}
                        className={`p-3.5 rounded-lg border-[1.5px] cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#172033] bg-[#EBF0FF] shadow-[2px_2px_0px_#172033]"
                            : "border-[#172033]/20 bg-white hover:border-[#172033]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#171717] truncate">{t(`c_${cId}`)}</span>
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ml-1 ${
                              st.status === "mastered"
                                ? "bg-[#2F855A]"
                                : st.status === "developing"
                                ? "bg-[#B7791F]"
                                : "bg-[#C53030]"
                            }`}
                          />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between text-xs">
                          <span className="font-mono font-bold text-sm text-[#171717]">{st.avg}%</span>
                          <span className="text-[10px] text-[#64748B]">Grade {CONCEPTS[cId].grade}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Node Academic Dossier */}
            {selectedConceptForMap && (
              <div className="p-4 bg-[#F7F6F2] border-[1.5px] border-[#172033] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="editorial-meta text-[#3156D3]">CONCEPT DOSSIER</span>
                    <h4 className="font-serif font-bold text-base text-[#171717]">
                      {t(`c_${selectedConceptForMap}`)}
                    </h4>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] border-[#172033]/30">
                    Grade {CONCEPTS[selectedConceptForMap].grade} • Strand: {CONCEPTS[selectedConceptForMap].strand.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-white p-3 rounded border-[1.5px] border-[#172033]/20">
                    <div className="text-[#64748B] font-semibold">Immediate Prerequisites:</div>
                    <div className="font-bold text-[#171717] mt-1">
                      {prerequisitesOf(selectedConceptForMap).length > 0
                        ? prerequisitesOf(selectedConceptForMap).map((p) => t(`c_${p}`)).join(", ")
                        : "Foundational (No prior prerequisites)"}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border-[1.5px] border-[#172033]/20">
                    <div className="text-[#64748B] font-semibold">Downstream Dependents:</div>
                    <div className="font-bold text-[#171717] mt-1">
                      {dependentsOf(selectedConceptForMap).length > 0
                        ? dependentsOf(selectedConceptForMap).map((d) => t(`c_${d}`)).join(", ")
                        : "Top-level capstone"}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border-[1.5px] border-[#172033]/20">
                    <div className="text-[#64748B] font-semibold">Class Breakdown:</div>
                    <div className="font-bold text-[#171717] mt-1">
                      {conceptStats[selectedConceptForMap].masteredCount} Mastered • {conceptStats[selectedConceptForMap].developingCount} Developing • {conceptStats[selectedConceptForMap].supportCount} Need Support
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: TABULAR MASTERY MATRIX                                */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "matrix" && (
          <div className="neo-panel overflow-hidden">
            <div className="p-4 bg-[#F7F6F2] border-b-[1.5px] border-[#172033]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="editorial-meta">CURRICULUM MATRIX</span>
                <h4 className="font-serif font-bold text-base text-[#171717] mt-0.5">
                  Student × Concept Fluency Matrix
                </h4>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#2F855A]" />
                  ≥75%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#B7791F]" />
                  50–74%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#C53030]" />
                  &lt;50%
                </span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white sticky top-0 border-b-[1.5px] border-[#172033]/20 z-10">
                  <tr>
                    <th className="py-2.5 px-3 font-bold w-44">Student</th>
                    {CONCEPT_IDS.map((cId) => (
                      <th key={cId} className="py-2.5 px-2 font-medium text-center text-[10px] whitespace-nowrap">
                        {t(`c_${cId}`).split(" ")[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#172033]/10">
                  {students.map((s) => (
                    <tr key={s.student.id} className="hover:bg-[#F7F6F2]/60">
                      <td className="py-2 px-3 font-semibold text-[#171717] whitespace-nowrap">
                        {s.student.name}
                      </td>
                      {CONCEPT_IDS.map((cId) => {
                        const est = s.profile.concepts[cId];
                        const st = est?.status;
                        const color =
                          st === "mastered"
                            ? "bg-[#2F855A] text-white"
                            : st === "developing"
                            ? "bg-[#B7791F] text-white"
                            : st === "needs_support"
                            ? "bg-[#C53030] text-white"
                            : "bg-[#E2E2DC] text-[#64748B]";

                        return (
                          <td key={cId} className="py-2 px-1 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${color}`}
                              title={`${t(`c_${cId}`)}: ${Math.round((est?.mastery || 0) * 100)}%`}
                            >
                              {Math.round((est?.mastery || 0) * 100)}%
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

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: REMEDIATION INSIGHTS                                  */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "gaps" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedGaps.map((gap, index) => (
              <div
                key={gap.conceptId}
                className="neo-panel p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs border-[#172033]/30">
                    Rank #{index + 1}
                  </Badge>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      gap.severity === "high"
                        ? "bg-[#FFF5F5] text-[#C53030] border border-[#C53030]/30"
                        : "bg-[#FFFDF5] text-[#B7791F] border border-[#B7791F]/30"
                    }`}
                  >
                    {gap.count} Students ({gap.pct}%)
                  </span>
                </div>

                <div>
                  <h4 className="font-serif font-bold text-lg text-[#171717]">
                    {t(`c_${gap.conceptId}`)}
                  </h4>
                  <div className="text-xs text-[#64748B] mt-0.5">
                    {dict.prerequisiteOf}: {CONCEPTS[gap.conceptId]?.strand?.toUpperCase()} (Grade {CONCEPTS[gap.conceptId]?.grade})
                  </div>
                </div>

                <div className="w-full bg-[#E2E2DC] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      gap.severity === "high" ? "bg-[#C53030]" : "bg-[#B7791F]"
                    }`}
                    style={{ width: `${gap.pct}%` }}
                  />
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed">
                  Blocking {gap.count} learners in Class 5A. Remediation in this foundational concept will directly unlock higher-order fluency in division and fractions.
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-[#172033]/10 text-xs">
                  <span className="font-semibold text-[#171717]">Recommended: 5-Day Targeted Practice</span>
                  <span className="text-[#3156D3] font-bold">15 min daily</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
