"use client";

import React, { useState } from "react";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { OfflineSyncBanner } from "@/components/OfflineSyncBanner";
import {
  Users,
  CheckCircle,
  Warning,
  Fire,
  MagnifyingGlass,
  ArrowRight,
  Brain,
  ArrowDown,
  Stack,
  ChartLineUp,
  Table,
  TreeStructure,
  Printer,
  CaretRight,
  FileArrowDown,
  FileText,
} from "@phosphor-icons/react";
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

  return (
    <div className="space-y-6">
      {/* Offline & Sync Status Banner */}
      <OfflineSyncBanner />

      {/* ============================================================== */}
      {/* 1. FIRST VIEWPORT: WHO NEEDS MY ATTENTION? (SWISS EDITORIAL)   */}
      {/* ============================================================== */}
      <section className="bg-[var(--surface)] border border-[#432623]/25 rounded-[2px] p-5 sm:p-6">
        {/* Editorial Masthead Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#432623]/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="editorial-meta text-[#432623]/80">ACADEMIC DIAGNOSTICS</span>
              <span className="text-[#432623]/40 text-xs">•</span>
              <span className="text-xs font-mono font-semibold text-[#432623]">CLASS 5 : SECTION A (SAMPLE COHORT)</span>
            </div>
            <h1 className="editorial-title text-2xl sm:text-3xl text-[#432623] mt-0.5">
              Teacher Intelligence Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#432623]/80 font-sans mt-0.5">
              Mathematics diagnostic status and pedagogical overview answering:{" "}
              <strong className="text-[#432623] font-semibold">Who needs attention today?</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/notices/guardian"
              className="min-h-[44px] px-3 border border-[#432623]/30 text-xs font-mono uppercase inline-flex items-center gap-1.5 hover:bg-[#F5F1BC]"
            >
              <FileText size={16} />
              <span>Guardian Notice</span>
            </Link>

            <Link
              href="/app/audit-log"
              className="min-h-[44px] px-3 border border-[#432623]/30 text-xs font-mono uppercase inline-flex items-center gap-1.5 hover:bg-[#F5F1BC]"
            >
              <span>Audit Trail</span>
            </Link>

            <button
              onClick={() => handleExport("csv")}
              disabled={isExporting}
              className="min-h-[44px] px-3 border border-[#432623]/30 text-xs font-mono uppercase inline-flex items-center gap-1.5 hover:bg-[#F5F1BC]"
            >
              <FileArrowDown size={16} />
              <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
            </button>

            <button
              onClick={() => {
                const firstCritical = students.find((s) => s.profile.status === "critical");
                onOpenAssessment(firstCritical?.student.id || students[0]?.student.id || "student_1", "math");
              }}
              className="neo-btn neo-btn-primary min-h-[44px] px-4 py-2.5 text-xs sm:text-sm flex items-center gap-2 font-bold rounded-[2px]"
            >
              <Brain className="w-4 h-4 text-[#F5F1BC]" />
              <span>START AI DIAGNOSTIC</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Re-authentication Modal for Export */}
        {showReauthModal && (
          <div className="mt-4 p-4 border border-[#DE2A35] bg-[#DE2A35]/10 rounded-[2px] space-y-3">
            <div className="text-xs font-bold text-[#DE2A35] flex items-center gap-1.5">
              <Warning size={16} />
              <span>Security Re-authentication Required Prior to Exporting Child Records</span>
            </div>
            <p className="text-xs text-[#432623] leading-relaxed">
              Per DPDP Act 2023 security protocols, please verify your institutional password to authorize downloading student data:
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
                onClick={() => handleExport("csv")}
                className="min-h-[44px] px-4 bg-[#432623] text-[#F5F1BC] text-xs font-mono uppercase font-bold"
              >
                Confirm & Download
              </button>
              <button
                onClick={() => setShowReauthModal(false)}
                className="min-h-[44px] px-3 border border-[#432623]/30 text-xs font-mono uppercase"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* AI Decision Support Disclaimer */}
        <div className="mt-4 p-3 bg-[#F5F1BC]/60 border border-[#432623]/25 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#432623]">
          <div className="flex items-center gap-2">
            <Warning className="w-4 h-4 text-[#DE2A35] shrink-0" />
            <span>
              <strong>Pedagogical Decision Support:</strong> Diagnostic outputs are AI-assisted recommendations. Teacher judgement is final.
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#432623]/70 shrink-0">SAMPLE DATA COHORT</span>
        </div>

        {/* 4 Swiss Metric Figures */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          {/* Total */}
          <div className="p-3.5 bg-[#FAF8E8] dark:bg-[#432623]/40 rounded-[2px] border border-[#432623]/25 flex flex-col justify-between">
            <span className="editorial-meta text-[#432623]/70">{dict.totalStudents}</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-serif text-3xl font-extrabold text-[#432623]">{total}</span>
              <span className="text-[11px] font-mono text-[#432623]/70">Class 5A</span>
            </div>
            <div className="text-[11px] text-[#432623]/70 mt-1">15 learners assessed (Sample data)</div>
          </div>

          {/* On Track */}
          <div className="p-3.5 bg-[#8ABB93]/15 rounded-[2px] border border-[#8ABB93] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="editorial-meta text-[#432623] font-bold">{dict.onTrack}</span>
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#8ABB93]" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-serif text-3xl font-extrabold text-[#432623]">{onTrackCount}</span>
              <span className="text-[11px] font-mono font-bold text-[#432623]">
                {Math.round((onTrackCount / (total || 1)) * 100)}%
              </span>
            </div>
            <div className="text-[11px] text-[#432623]/80 mt-1">Fluent across prerequisites</div>
          </div>

          {/* Developing */}
          <div className="p-3.5 bg-[#DFA06E]/15 rounded-[2px] border border-[#DFA06E] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="editorial-meta text-[#432623] font-bold">{dict.needPractice}</span>
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#DFA06E]" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-serif text-3xl font-extrabold text-[#432623]">{needPracticeCount}</span>
              <span className="text-[11px] font-mono font-bold text-[#432623]">
                {Math.round((needPracticeCount / (total || 1)) * 100)}%
              </span>
            </div>
            <div className="text-[11px] text-[#432623]/80 mt-1">Needs targeted practice</div>
          </div>

          {/* Need Support */}
          <div className="p-3.5 bg-[#DE2A35]/15 rounded-[2px] border border-[#DE2A35] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="editorial-meta text-[#DE2A35] font-bold">{dict.criticalGaps}</span>
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#DE2A35]" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-serif text-3xl font-extrabold text-[#DE2A35]">{criticalCount}</span>
              <span className="text-[11px] font-mono font-bold text-[#DE2A35]">
                {Math.round((criticalCount / (total || 1)) * 100)}%
              </span>
            </div>
            <div className="text-[11px] text-[#DE2A35]/90 mt-1">Blocked by root cause</div>
          </div>
        </div>

        {/* Viewport Sub-Grid: Learning Gaps Distribution vs Priority Interventions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-6 mt-6 border-t border-[#432623]/20">
          {/* Left Column (5 cols): LEARNING GAPS THIS WEEK */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="editorial-meta text-[#432623]/80">CURRICULUM BOTTLENECK DISTRIBUTION</span>
                <h3 className="font-serif font-bold text-base text-[#432623] mt-0.5">
                  Most Common Gaps This Week
                </h3>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] border-[#432623]/30 text-[#432623] rounded-[2px]">
                CLASS 5A
              </Badge>
            </div>

            <p className="text-xs text-[#432623]/80">
              Aggregated root-cause isolation identifying missing prerequisite skills blocking class progress.
            </p>

            <div className="space-y-2.5 pt-1">
              {sortedGaps.slice(0, 4).map((gap, idx) => (
                <div
                  key={gap.conceptId}
                  className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/25 rounded-[2px] hover:border-[#432623]"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#432623]">
                      <span className="font-mono text-[10px] text-[#432623]/70">0{idx + 1}</span>
                      <span>{t(`c_${gap.conceptId}`)}</span>
                    </div>
                    <span className="font-mono font-bold text-[#432623]">
                      {gap.count} learners ({gap.pct}%)
                    </span>
                  </div>

                  {/* Clean Minimal Progress Bar */}
                  <div className="w-full bg-[#F5F1BC] h-2 rounded-[2px] overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-[2px] ${
                        gap.severity === "high" ? "bg-[#DE2A35]" : "bg-[#DFA06E]"
                      }`}
                      style={{ width: `${Math.min(gap.pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-[#432623]/80">
                    <span>Affects division &amp; fractions</span>
                    <span className="uppercase font-semibold text-[#432623]">
                      {gap.severity === "high" ? "Urgent Remediation" : "Targeted Drill"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (7 cols): PRIORITY INTERVENTIONS */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="editorial-meta text-[#432623]/80">ACTION REQUIRED</span>
                <h3 className="font-serif font-bold text-base text-[#432623] mt-0.5">
                  Priority Interventions (Who Needs Support)
                </h3>
              </div>
              <span className="text-[11px] font-mono font-semibold text-[#DE2A35] bg-[#DE2A35]/10 px-2 py-0.5 rounded-[2px] border border-[#DE2A35]/30">
                {criticalCount + needPracticeCount} Learners
              </span>
            </div>

            <p className="text-xs text-[#432623]/80">
              Sorted by diagnostic urgency. Each student has a diagnosed prerequisite root cause.
            </p>

            {/* Compact Swiss Table */}
            <div className="border border-[#432623]/25 rounded-[2px] overflow-hidden bg-[var(--surface)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F1BC]/50 text-[#432623] font-bold border-b border-[#432623]/20">
                    <tr>
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Diagnosed Root Gap</th>
                      <th className="py-2.5 px-2">Priority</th>
                      <th className="py-2.5 px-3 text-right">Pedagogical Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#432623]/15">
                    {urgentStudents.map((s) => {
                      const root = s.profile.rootCauses[0];
                      const isCritical = s.profile.status === "critical";
                      return (
                        <tr
                          key={s.student.id}
                          className="hover:bg-[#F5F1BC]/30"
                        >
                          <td className="py-2.5 px-3 font-semibold text-[#432623]">
                            <div className="font-bold">{s.student.name}</div>
                            <div className="text-[10px] text-[#432623]/70 font-mono">
                              Roll #{s.student.rollNo} • {Math.round((s.profile.overallMastery ?? 0) * 100)}% Mastery
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {root ? (
                              <div>
                                <span className="font-bold text-[#DE2A35]">
                                  {t(`c_${root.rootId}`)}
                                </span>
                                <div className="text-[10px] text-[#432623]/70">
                                  Affecting: {root.symptomIds.map((sym) => t(`c_${sym}`)).join(", ")}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[#432623]/70 italic">Prerequisite check</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold uppercase ${
                                isCritical
                                  ? "bg-[#DE2A35]/15 text-[#DE2A35] border border-[#DE2A35]/30"
                                  : "bg-[#DFA06E]/20 text-[#432623] border border-[#DFA06E]/40"
                              }`}
                            >
                              {isCritical ? "HIGH" : "MEDIUM"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onSelectStudent(s)}
                                className="neo-btn neo-btn-secondary px-2.5 py-1 text-[11px] font-bold rounded-[2px]"
                              >
                                View Report
                              </button>
                              {root && (
                                <button
                                  onClick={() => onOpenAssessment(s.student.id, root.rootId)}
                                  className="neo-btn neo-btn-primary px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 rounded-[2px]"
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
        {/* Tab Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#432623]/20 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("interventions")}
              className={`h-9 px-3.5 text-xs font-bold rounded-[2px] border flex items-center gap-1.5 ${
                activeTab === "interventions"
                  ? "bg-[#432623] text-[#F5F1BC] border-[#432623]"
                  : "bg-[var(--surface)] text-[#432623] border-[#432623]/25 hover:bg-[#F5F1BC]/40"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Students ({students.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("map")}
              className={`h-9 px-3.5 text-xs font-bold rounded-[2px] border flex items-center gap-1.5 ${
                activeTab === "map"
                  ? "bg-[#432623] text-[#F5F1BC] border-[#432623]"
                  : "bg-[var(--surface)] text-[#432623] border-[#432623]/25 hover:bg-[#F5F1BC]/40"
              }`}
            >
              <TreeStructure className="w-3.5 h-3.5" />
              <span>Learning Dependency Map</span>
            </button>

            <button
              onClick={() => setActiveTab("matrix")}
              className={`h-9 px-3.5 text-xs font-bold rounded-[2px] border flex items-center gap-1.5 ${
                activeTab === "matrix"
                  ? "bg-[#432623] text-[#F5F1BC] border-[#432623]"
                  : "bg-[var(--surface)] text-[#432623] border-[#432623]/25 hover:bg-[#F5F1BC]/40"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Mastery Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab("gaps")}
              className={`h-9 px-3.5 text-xs font-bold rounded-[2px] border flex items-center gap-1.5 ${
                activeTab === "gaps"
                  ? "bg-[#432623] text-[#F5F1BC] border-[#432623]"
                  : "bg-[var(--surface)] text-[#432623] border-[#432623]/25 hover:bg-[#F5F1BC]/40"
              }`}
            >
              <ChartLineUp className="w-3.5 h-3.5" />
              <span>Remediation Insights</span>
            </button>
          </div>

          {/* Search & Filter for Students Tab */}
          {activeTab === "interventions" && (
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <MagnifyingGlass className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#432623]/60" />
                <Input
                  placeholder="Search name or roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-[var(--surface)] border border-[#432623]/25 focus-visible:border-[#432623] rounded-[2px] text-[#432623]"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-[var(--surface)] border border-[#432623]/25 rounded-[2px] h-8 px-2 font-medium text-[#432623]"
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
          <div className="neo-panel overflow-hidden rounded-[2px]">
            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F5F1BC]/50 text-[#432623] font-bold text-xs border-b border-[#432623]/20">
                  <tr>
                    <th className="py-3 px-4">{dict.studentName}</th>
                    <th className="py-3 px-4">{dict.symptomConcept}</th>
                    <th className="py-3 px-4">{dict.rootCauseConcept}</th>
                    <th className="py-3 px-4">{dict.severity}</th>
                    <th className="py-3 px-4 text-right">{dict.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#432623]/15">
                  {filteredStudents.map((s) => {
                    const root = s.profile.rootCauses[0];
                    return (
                      <tr
                        key={s.student.id}
                        className="hover:bg-[#F5F1BC]/30"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#432623]">
                            {s.student.name}
                          </div>
                          <div className="text-xs text-[#432623]/70 font-mono">
                            Roll #{s.student.rollNo} • Mastery: {Math.round((s.profile.overallMastery ?? 0) * 100)}%
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#432623]/80">
                          {root && root.symptomIds.length > 0 ? (
                            <span className="font-medium text-[#432623]">
                              {root.symptomIds.map((sym) => t(`c_${sym}`)).join(", ")}
                            </span>
                          ) : (
                            <span className="text-[#432623]/60 italic">None (On Track)</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {root ? (
                            <div className="font-bold text-[#DE2A35]">
                              {t(`c_${root.rootId}`)}
                            </div>
                          ) : (
                            <span className="text-[#432623] font-semibold flex items-center gap-1 text-xs">
                              <CheckCircle className="w-3.5 h-3.5 text-[#8ABB93]" />
                              Fluent Prerequisite
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold uppercase border ${
                              s.profile.status === "critical"
                                ? "bg-[#DE2A35]/15 text-[#DE2A35] border-[#DE2A35]/40"
                                : s.profile.status === "need_practice"
                                ? "bg-[#DFA06E]/20 text-[#432623] border-[#DFA06E]/40"
                                : "bg-[#8ABB93]/20 text-[#432623] border-[#8ABB93]/40"
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
                              className="neo-btn neo-btn-secondary px-3 py-1 text-xs font-semibold rounded-[2px]"
                            >
                              {dict.diagnoseBtn}
                            </button>
                            {root && (
                              <button
                                onClick={() => onOpenAssessment(s.student.id, root.rootId)}
                                className="neo-btn neo-btn-primary px-3 py-1 text-xs font-semibold flex items-center gap-1 rounded-[2px]"
                              >
                                <span>{dict.practiceBtn}</span>
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

            {/* Mobile Stacked Card View (< 640px) */}
            <div className="sm:hidden p-3 space-y-3">
              {filteredStudents.map((s) => {
                const root = s.profile.rootCauses[0];
                return (
                  <div
                    key={s.student.id}
                    className="p-3.5 border border-[#432623]/20 bg-[var(--surface)] space-y-2.5 rounded-[2px]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-[#432623] text-sm">
                          {s.student.name}
                        </div>
                        <div className="text-xs text-[#432623]/70 font-mono">
                          Roll #{s.student.rollNo} • Mastery: {Math.round((s.profile.overallMastery ?? 0) * 100)}%
                        </div>
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold uppercase border shrink-0 ${
                          s.profile.status === "critical"
                            ? "bg-[#DE2A35]/15 text-[#DE2A35] border-[#DE2A35]/40"
                            : s.profile.status === "need_practice"
                            ? "bg-[#DFA06E]/20 text-[#432623] border-[#DFA06E]/40"
                            : "bg-[#8ABB93]/20 text-[#432623] border-[#8ABB93]/40"
                        }`}
                      >
                        {s.profile.status === "critical"
                          ? dict.highSeverity
                          : s.profile.status === "need_practice"
                          ? dict.mediumSeverity
                          : dict.lowSeverity}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 bg-[#F5F1BC]/30 p-2 border border-[#432623]/10">
                      <div>
                        <span className="font-mono text-[10px] uppercase text-[#432623]/60">Root Cause: </span>
                        {root ? (
                          <span className="font-bold text-[#DE2A35]">{t(`c_${root.rootId}`)}</span>
                        ) : (
                          <span className="font-semibold text-[#8ABB93]">Fluent Prerequisite</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onSelectStudent(s)}
                        className="flex-1 min-h-[44px] neo-btn neo-btn-secondary text-xs font-semibold rounded-[2px] flex items-center justify-center"
                      >
                        {dict.diagnoseBtn}
                      </button>
                      {root && (
                        <button
                          onClick={() => onOpenAssessment(s.student.id, root.rootId)}
                          className="flex-1 min-h-[44px] neo-btn neo-btn-primary text-xs font-semibold rounded-[2px] flex items-center justify-center"
                        >
                          {dict.practiceBtn}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: ACADEMIC LEARNING DEPENDENCY MAP                       */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "map" && (
          <div className="neo-panel p-6 space-y-6 rounded-[2px] border border-[#432623]/25 bg-[var(--surface)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#432623]/20">
              <div>
                <span className="editorial-meta text-[#432623]/80">SIGNATURE ACADEMIC INTELLIGENCE</span>
                <h3 className="editorial-title text-xl text-[#432623]">
                  Mathematics Concept Dependency Graph (Class 3-5)
                </h3>
                <p className="text-xs text-[#432623]/80 mt-0.5 max-w-2xl">
                  Prerequisites cascade downwards. When students stumble on upper-tier concepts (such as Division or Fractions), the diagnostic engine traces prerequisite lineages to isolate the exact foundation gap.
                </p>
              </div>

              {/* Status Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs bg-[#FAF8E8] dark:bg-[#432623]/30 p-2.5 rounded-[2px] border border-[#432623]/25">
                <span className="flex items-center gap-1.5 font-semibold text-[#432623]">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#8ABB93]" />
                  Mastered (≥75%)
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-[#432623]">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#DFA06E]" />
                  Developing (50-74%)
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-[#432623]">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#DE2A35]" />
                  Needs Support (&lt;50%)
                </span>
              </div>
            </div>

            {/* Academic Knowledge Map Visualizer */}
            <div className="space-y-6">
              {/* Level 1: Foundational Number Sense */}
              <div className="space-y-2">
                <div className="editorial-meta text-[#432623]/70">STAGE 1: FOUNDATIONAL NUMBER SENSE</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["number_sense", "place_value", "addition"] as ConceptId[]).map((cId) => {
                    const st = conceptStats[cId];
                    const isSelected = selectedConceptForMap === cId;
                    return (
                      <div
                        key={cId}
                        onClick={() => setSelectedConceptForMap(cId)}
                        className={`p-3.5 rounded-[2px] border cursor-pointer ${
                          isSelected
                            ? "border-[#432623] bg-[#F5F1BC]/70"
                            : "border-[#432623]/25 bg-[var(--surface)] hover:border-[#432623]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#432623]">{t(`c_${cId}`)}</span>
                          <span
                            className={`w-2.5 h-2.5 rounded-[2px] ${
                              st.status === "mastered"
                                ? "bg-[#8ABB93]"
                                : st.status === "developing"
                                ? "bg-[#DFA06E]"
                                : "bg-[#DE2A35]"
                            }`}
                          />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between text-xs">
                          <span className="font-mono font-bold text-sm text-[#432623]">{st.avg}%</span>
                          <span className="text-[10px] text-[#432623]/70">Grade {CONCEPTS[cId].grade}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dependency Flow Arrow */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#432623] bg-[#FAF8E8] dark:bg-[#432623]/40 px-3 py-1 rounded-[2px] border border-[#432623]/25">
                  <span>PREREQUISITE DEPENDENCY FLOW</span>
                  <ArrowDown className="w-3.5 h-3.5 text-[#432623]" />
                </div>
              </div>

              {/* Level 2: Subtraction & Multiplication Foundations */}
              <div className="space-y-2">
                <div className="editorial-meta text-[#432623]/70">STAGE 2: MULTIPLICATION &amp; SUBTRACTION PREREQUISITES</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["subtraction", "mult_concept", "mult_facts"] as ConceptId[]).map((cId) => {
                    const st = conceptStats[cId];
                    const isSelected = selectedConceptForMap === cId;
                    return (
                      <div
                        key={cId}
                        onClick={() => setSelectedConceptForMap(cId)}
                        className={`p-3.5 rounded-[2px] border cursor-pointer ${
                          isSelected
                            ? "border-[#432623] bg-[#F5F1BC]/70"
                            : "border-[#432623]/25 bg-[var(--surface)] hover:border-[#432623]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#432623]">{t(`c_${cId}`)}</span>
                          <span
                            className={`w-2.5 h-2.5 rounded-[2px] ${
                              st.status === "mastered"
                                ? "bg-[#8ABB93]"
                                : st.status === "developing"
                                ? "bg-[#DFA06E]"
                                : "bg-[#DE2A35]"
                            }`}
                          />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between text-xs">
                          <span className="font-mono font-bold text-sm text-[#432623]">{st.avg}%</span>
                          <span className="text-[10px] text-[#432623]/70">Grade {CONCEPTS[cId].grade}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dependency Flow Arrow */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#432623] bg-[#FAF8E8] dark:bg-[#432623]/40 px-3 py-1 rounded-[2px] border border-[#432623]/25">
                  <span>PREREQUISITE DEPENDENCY FLOW</span>
                  <ArrowDown className="w-3.5 h-3.5 text-[#432623]" />
                </div>
              </div>

              {/* Level 3: Division Operations & Multi-digit */}
              <div className="space-y-2">
                <div className="editorial-meta text-[#432623]/70">STAGE 3: DIVISION OPERATIONS &amp; MULTI-DIGIT FLUENCY</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {(["multi_digit_mult", "division_concept", "division_facts", "fraction_basics"] as ConceptId[]).map((cId) => {
                    const st = conceptStats[cId];
                    const isSelected = selectedConceptForMap === cId;
                    return (
                      <div
                        key={cId}
                        onClick={() => setSelectedConceptForMap(cId)}
                        className={`p-3.5 rounded-[2px] border cursor-pointer ${
                          isSelected
                            ? "border-[#432623] bg-[#F5F1BC]/70"
                            : "border-[#432623]/25 bg-[var(--surface)] hover:border-[#432623]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#432623] truncate">{t(`c_${cId}`)}</span>
                          <span
                            className={`w-2.5 h-2.5 rounded-[2px] shrink-0 ml-1 ${
                              st.status === "mastered"
                                ? "bg-[#8ABB93]"
                                : st.status === "developing"
                                ? "bg-[#DFA06E]"
                                : "bg-[#DE2A35]"
                            }`}
                          />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between text-xs">
                          <span className="font-mono font-bold text-sm text-[#432623]">{st.avg}%</span>
                          <span className="text-[10px] text-[#432623]/70">Grade {CONCEPTS[cId].grade}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dependency Flow Arrow */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#432623] bg-[#FAF8E8] dark:bg-[#432623]/40 px-3 py-1 rounded-[2px] border border-[#432623]/25">
                  <span>PREREQUISITE DEPENDENCY FLOW</span>
                  <ArrowDown className="w-3.5 h-3.5 text-[#432623]" />
                </div>
              </div>

              {/* Level 4: Upper Grade 5 Targets & Fractions */}
              <div className="space-y-2">
                <div className="editorial-meta text-[#432623]/70">STAGE 4: GRADE 5 TARGETS &amp; FRACTIONS</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {(["long_division", "division_word", "equivalent_fractions", "comparing_fractions"] as ConceptId[]).map((cId) => {
                    const st = conceptStats[cId];
                    const isSelected = selectedConceptForMap === cId;
                    return (
                      <div
                        key={cId}
                        onClick={() => setSelectedConceptForMap(cId)}
                        className={`p-3.5 rounded-[2px] border cursor-pointer ${
                          isSelected
                            ? "border-[#432623] bg-[#F5F1BC]/70"
                            : "border-[#432623]/25 bg-[var(--surface)] hover:border-[#432623]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#432623] truncate">{t(`c_${cId}`)}</span>
                          <span
                            className={`w-2.5 h-2.5 rounded-[2px] shrink-0 ml-1 ${
                              st.status === "mastered"
                                ? "bg-[#8ABB93]"
                                : st.status === "developing"
                                ? "bg-[#DFA06E]"
                                : "bg-[#DE2A35]"
                            }`}
                          />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between text-xs">
                          <span className="font-mono font-bold text-sm text-[#432623]">{st.avg}%</span>
                          <span className="text-[10px] text-[#432623]/70">Grade {CONCEPTS[cId].grade}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Node Academic Dossier */}
            {selectedConceptForMap && (
              <div className="p-4 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/25 rounded-[2px] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="editorial-meta text-[#432623]/80">CONCEPT DOSSIER</span>
                    <h4 className="font-serif font-bold text-base text-[#432623]">
                      {t(`c_${selectedConceptForMap}`)}
                    </h4>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] border-[#432623]/30 text-[#432623] rounded-[2px]">
                    Grade {CONCEPTS[selectedConceptForMap].grade} • Strand: {CONCEPTS[selectedConceptForMap].strand.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-[var(--surface)] p-3 rounded-[2px] border border-[#432623]/20">
                    <div className="text-[#432623]/70 font-semibold">Immediate Prerequisites:</div>
                    <div className="font-bold text-[#432623] mt-1">
                      {prerequisitesOf(selectedConceptForMap).length > 0
                        ? prerequisitesOf(selectedConceptForMap).map((p) => t(`c_${p}`)).join(", ")
                        : "Foundational (No prior prerequisites)"}
                    </div>
                  </div>

                  <div className="bg-[var(--surface)] p-3 rounded-[2px] border border-[#432623]/20">
                    <div className="text-[#432623]/70 font-semibold">Downstream Dependents:</div>
                    <div className="font-bold text-[#432623] mt-1">
                      {dependentsOf(selectedConceptForMap).length > 0
                        ? dependentsOf(selectedConceptForMap).map((d) => t(`c_${d}`)).join(", ")
                        : "Top-level capstone"}
                    </div>
                  </div>

                  <div className="bg-[var(--surface)] p-3 rounded-[2px] border border-[#432623]/20">
                    <div className="text-[#432623]/70 font-semibold">Class Breakdown:</div>
                    <div className="font-bold text-[#432623] mt-1">
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
          <div className="neo-panel overflow-hidden rounded-[2px] border border-[#432623]/25 bg-[var(--surface)]">
            <div className="p-4 bg-[#F5F1BC]/50 border-b border-[#432623]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="editorial-meta text-[#432623]/80">CURRICULUM MATRIX</span>
                <h4 className="font-serif font-bold text-base text-[#432623] mt-0.5">
                  Student × Concept Fluency Matrix
                </h4>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-[#432623]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#8ABB93]" />
                  ≥75%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#DFA06E]" />
                  50-74%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#DE2A35]" />
                  &lt;50%
                </span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface)] sticky top-0 border-b border-[#432623]/20 z-10 text-[#432623]">
                  <tr>
                    <th className="py-2.5 px-3 font-bold w-44">Student</th>
                    {CONCEPT_IDS.map((cId) => (
                      <th key={cId} className="py-2.5 px-2 font-medium text-center text-[10px] whitespace-nowrap">
                        {t(`c_${cId}`).split(" ")[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#432623]/15">
                  {students.map((s) => (
                    <tr key={s.student.id} className="hover:bg-[#F5F1BC]/30">
                      <td className="py-2 px-3 font-semibold text-[#432623] whitespace-nowrap">
                        {s.student.name}
                      </td>
                      {CONCEPT_IDS.map((cId) => {
                        const est = s.profile.concepts[cId];
                        const st = est?.status;
                        const color =
                          st === "mastered"
                            ? "bg-[#8ABB93] text-[#432623]"
                            : st === "developing"
                            ? "bg-[#DFA06E] text-[#432623]"
                            : st === "needs_support"
                            ? "bg-[#DE2A35] text-white"
                            : "bg-[#FAF8E8] text-[#432623]/60";

                        return (
                          <td key={cId} className="py-2 px-1 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold ${color}`}
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
                className="neo-panel p-5 space-y-3 rounded-[2px] border border-[#432623]/25 bg-[var(--surface)]"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs border-[#432623]/30 text-[#432623] rounded-[2px]">
                    Rank #{index + 1}
                  </Badge>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-[2px] ${
                      gap.severity === "high"
                        ? "bg-[#DE2A35]/15 text-[#DE2A35] border border-[#DE2A35]/30"
                        : "bg-[#DFA06E]/20 text-[#432623] border border-[#DFA06E]/40"
                    }`}
                  >
                    {gap.count} Students ({gap.pct}%)
                  </span>
                </div>

                <div>
                  <h4 className="font-serif font-bold text-lg text-[#432623]">
                    {t(`c_${gap.conceptId}`)}
                  </h4>
                  <div className="text-xs text-[#432623]/70 mt-0.5">
                    {dict.prerequisiteOf}: {CONCEPTS[gap.conceptId]?.strand?.toUpperCase()} (Grade {CONCEPTS[gap.conceptId]?.grade})
                  </div>
                </div>

                <div className="w-full bg-[#F5F1BC] h-2 rounded-[2px] overflow-hidden">
                  <div
                    className={`h-full rounded-[2px] ${
                      gap.severity === "high" ? "bg-[#DE2A35]" : "bg-[#DFA06E]"
                    }`}
                    style={{ width: `${gap.pct}%` }}
                  />
                </div>

                <p className="text-xs text-[#432623]/80 leading-relaxed">
                  Blocking {gap.count} learners in Class 5A. Remediation in this foundational concept will directly unlock higher-order fluency in division and fractions.
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-[#432623]/15 text-xs">
                  <span className="font-semibold text-[#432623]">Recommended: 5-Day Targeted Practice</span>
                  <span className="text-[#432623] font-bold">15 min daily</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
