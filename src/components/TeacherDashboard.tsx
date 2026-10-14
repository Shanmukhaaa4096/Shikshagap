"use client";

import { useState } from "react";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { OfflineSyncBanner } from "@/components/OfflineSyncBanner";
import { NoSearchResultsState, EmptyState } from "@/components/StateScreens";
import {
  House,
  Users,
  ChartPieSlice,
  FileText,
  MagnifyingGlass,
  ArrowRight,
  Printer,
  Warning,
} from "@phosphor-icons/react";
import { getClassConfig, DEFAULT_CLASS_ID } from "@/lib/curriculum/classes";
import { ClassSelector } from "./ClassSelector";
import type { ConceptId } from "@/lib/types";
import { CONCEPT_IDS, CONCEPTS, prerequisitesOf, dependentsOf } from "@/lib/concepts/graph";

interface Props {
  students: DemoStudentData[];
  onSelectStudent: (student: DemoStudentData) => void;
  onOpenAssessment: (studentId: string, conceptId: string) => void;
  onPrintWorksheet: (student: DemoStudentData) => void;
  selectedClassId?: string;
  onSelectClass?: (classId: string) => void;
}

type TabType = "home" | "students" | "gaps" | "reports";

export function TeacherDashboard({
  students,
  onSelectStudent,
  onOpenAssessment,
  onPrintWorksheet,
  selectedClassId = DEFAULT_CLASS_ID,
  onSelectClass,
}: Props) {
  const classConfig = getClassConfig(selectedClassId);
  const { lang, setLang, dict, t } = useI18n();
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
      <nav aria-label="Teacher Dashboard Navigation" className="border-b border-border flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className={`min-h-[44px] px-4 py-2 font-mono text-sm uppercase font-bold border-b-2 transition-none flex items-center gap-2 ${
            activeTab === "home"
              ? "border-primary text-primary bg-card dark:bg-card"
              : "border-transparent text-muted-foreground dark:text-muted-foreground hover:text-foreground"
          }`}
        >
          <House size={16} />
          <span>{dict.navHome || "Home"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("students")}
          className={`min-h-[44px] px-4 py-2 font-mono text-sm uppercase font-bold border-b-2 transition-none flex items-center gap-2 ${
            activeTab === "students"
              ? "border-primary text-primary bg-card dark:bg-card"
              : "border-transparent text-muted-foreground dark:text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users size={16} />
          <span>{dict.navStudents || "Students"} ({total})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gaps")}
          className={`min-h-[44px] px-4 py-2 font-mono text-sm uppercase font-bold border-b-2 transition-none flex items-center gap-2 ${
            activeTab === "gaps"
              ? "border-primary text-primary bg-card dark:bg-card"
              : "border-transparent text-muted-foreground dark:text-muted-foreground hover:text-foreground"
          }`}
        >
          <ChartPieSlice size={16} />
          <span>{dict.navClassGaps || "Class Gaps"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`min-h-[44px] px-4 py-2 font-mono text-sm uppercase font-bold border-b-2 transition-none flex items-center gap-2 ${
            activeTab === "reports"
              ? "border-primary text-primary bg-card dark:bg-card"
              : "border-transparent text-muted-foreground dark:text-muted-foreground hover:text-foreground"
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
          <div className="border border-border p-5 bg-card dark:bg-card rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-sm font-mono uppercase text-muted-foreground dark:text-muted-foreground font-bold block mb-1">
                {classConfig.label} - Section {classConfig.section} Mathematics Overview • (Demo data)
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                {dict.whoNeedsHelpToday || "Who needs help today"}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 sm:justify-end">
              <div className="flex flex-col sm:items-end gap-1">
                <div className="flex gap-1" role="group" aria-label="Language Switcher">
                  {(["en", "hi", "te"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={`min-h-[44px] px-2.5 py-1 text-sm font-mono uppercase border ${
                        lang === l
                          ? "bg-primary text-primary-foreground dark:bg-muted dark:text-foreground font-bold border-border"
                          : "border-border hover:bg-muted text-foreground"
                      }`}
                    >
                      {l === "en" ? "EN" : l === "hi" ? "HI" : "TE"}
                    </button>
                  ))}
                </div>
              </div>
              {onSelectClass && (
                <div className="flex flex-col sm:items-end gap-1">
                  <span className="text-sm font-mono font-bold uppercase text-muted-foreground dark:text-muted-foreground">
                    Select Grade
                  </span>
                  <ClassSelector
                    selectedClassId={selectedClassId}
                    onSelectClass={onSelectClass}
                    compact={true}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 1. THREE NUMBERS ONLY: On Track, Need Practice, Critical */}
          <div>
            <div className="text-sm font-mono uppercase text-muted-foreground dark:text-muted-foreground font-bold mb-2">
              Class Progress (Tap any number to filter students):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* On Track */}
              <button
                type="button"
                onClick={() => handleFilterClick("on_track")}
                className="p-4 border border-[var(--status-good-border)] bg-[var(--status-good-bg)] rounded-[2px] text-left hover:bg-[var(--status-good)]/25 transition-none flex flex-col justify-between min-h-[96px]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm uppercase font-bold text-foreground">
                    {dict.onTrack || "On Track"}
                  </span>
                  <span className="w-3 h-3 rounded-[2px] bg-[var(--status-good)]" />
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-serif text-4xl font-black text-foreground">
                    {onTrackCount}
                  </span>
                  <span className="font-mono text-sm text-muted-foreground dark:text-muted-foreground font-bold">
                    {Math.round((onTrackCount / (total || 1)) * 100)}%
                  </span>
                </div>
              </button>

              {/* Need Practice */}
              <button
                type="button"
                onClick={() => handleFilterClick("need_practice")}
                className="p-4 border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] rounded-[2px] text-left hover:bg-[var(--status-warn)]/25 transition-none flex flex-col justify-between min-h-[96px]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm uppercase font-bold text-foreground">
                    {dict.needPractice || "Need Practice"}
                  </span>
                  <span className="w-3 h-3 rounded-[2px] bg-[var(--status-warn)]" />
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-serif text-4xl font-black text-foreground">
                    {needPracticeCount}
                  </span>
                  <span className="font-mono text-sm text-muted-foreground dark:text-muted-foreground font-bold">
                    {Math.round((needPracticeCount / (total || 1)) * 100)}%
                  </span>
                </div>
              </button>

              {/* Critical */}
              <button
                type="button"
                onClick={() => handleFilterClick("critical")}
                className="p-4 border border-primary bg-primary text-primary-foreground/15 rounded-[2px] text-left hover:bg-primary text-primary-foreground/25 transition-none flex flex-col justify-between min-h-[96px]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm uppercase font-bold text-primary">
                    {dict.criticalGaps || "Critical"}
                  </span>
                  <span className="w-3 h-3 rounded-[2px] bg-primary text-primary-foreground" />
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-serif text-4xl font-black text-primary">
                    {criticalCount}
                  </span>
                  <span className="font-mono text-sm text-primary font-bold">
                    {Math.round((criticalCount / (total || 1)) * 100)}%
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Top 3 Struggling Topics for the Class */}
          <div className="border border-border bg-card dark:bg-card rounded-[2px] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                  Top 3 Topics Needing Class Practice
                </h2>
                <p className="text-sm text-foreground/80 dark:text-muted-foreground mt-0.5">
                  Core concept bottlenecks affecting the most students in this class.
                </p>
              </div>
              <span className="text-sm font-mono font-bold text-foreground bg-muted dark:bg-muted px-2.5 py-1 rounded-[2px] border border-border">
                Classwide Focus
              </span>
            </div>

            {sortedGaps.length === 0 ? (
              <div className="p-4 text-center text-sm font-mono text-muted-foreground dark:text-muted-foreground">
                No learning gaps identified yet. Run assessments to detect focus areas.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {sortedGaps.slice(0, 3).map((gap, idx) => (
                  <div
                    key={gap.conceptId}
                    className="p-4 border border-border bg-card rounded-[2px] flex flex-col justify-between space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-muted-foreground dark:text-muted-foreground">
                        PRIORITY 0{idx + 1}
                      </span>
                      <span
                        className={`text-sm font-mono font-bold px-2 py-0.5 rounded-[2px] border ${
                          gap.severity === "high"
                            ? "bg-primary text-primary-foreground/15 text-primary border-primary/40"
                            : "bg-[var(--status-warn-bg)] text-foreground border-[var(--status-warn-border)]"
                        }`}
                      >
                        {gap.count} Learners ({gap.pct}%)
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-base text-foreground">
                        {t(`c_${gap.conceptId}`)}
                      </h3>
                      <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-0.5">
                        {CONCEPTS[gap.conceptId]?.strand?.toUpperCase()}
                      </div>
                    </div>

                    <div className="w-full bg-muted h-2 rounded-[2px] overflow-hidden">
                      <div
                        className={`h-full rounded-[2px] ${gap.severity === "high" ? "bg-primary text-primary-foreground" : "bg-[var(--status-warn)]"}`}
                        style={{ width: `${gap.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. "STUDENTS WHO NEED HELP FIRST": Priority Table / Cards */}
          <div className="border border-border bg-card dark:bg-card rounded-[2px] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                  Students Who Need Help First
                </h2>
                <p className="text-sm text-foreground/80 dark:text-muted-foreground mt-0.5">
                  Top learners needing teacher support in class today.
                </p>
              </div>
              <span className="text-sm font-mono font-bold text-primary bg-primary text-primary-foreground/10 px-2.5 py-1 rounded-[2px] border border-primary/40">
                {urgentStudents.length} Students
              </span>
            </div>

            {urgentStudents.length === 0 ? (
              <div className="p-4 text-center text-sm font-mono text-muted-foreground dark:text-muted-foreground">
                No students assessed yet. Start an assessment.
              </div>
            ) : (
              <div className="space-y-3">
                {urgentStudents.map((s) => {
                  const root = s.profile.rootCauses[0];
                  const isCritical = s.profile.status === "critical";
                  const problemDesc = root ? t(`c_${root.rootId}`) : "Prerequisite foundation review";

                  return (
                    <div
                      key={s.student.id}
                      className="p-3.5 border border-border bg-card rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Left: Name and One-line problem */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectStudent(s)}
                            className="font-serif font-bold text-base text-foreground hover:underline text-left"
                          >
                            {s.student.name}
                          </button>
                          <span className="text-sm font-mono text-muted-foreground dark:text-muted-foreground">
                            (Roll #{s.student.rollNo})
                          </span>
                          <span
                            className={`text-sm font-mono font-bold uppercase px-1.5 py-0.2 rounded-[2px] border ${
                              isCritical
                                ? "bg-primary text-primary-foreground/15 text-primary border-primary"
                                : "bg-[var(--status-warn-bg)] text-foreground border-[var(--status-warn-border)]"
                            }`}
                          >
                            {isCritical ? "Critical" : "Need Practice"}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 dark:text-muted-foreground">
                          <strong className="text-primary">{problemDesc}</strong>
                        </p>
                      </div>

                      {/* Right: Actions */}
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectStudent(s)}
                          className="min-h-[44px] px-3 border border-border text-sm font-mono uppercase text-foreground hover:bg-muted"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenAssessment(s.student.id, root?.rootId || "number_ops")}
                          className="min-h-[44px] px-4 bg-primary text-primary-foreground text-sm font-mono uppercase font-bold border border-primary hover:bg-primary/90 flex items-center gap-1.5"
                        >
                          <span>Practice</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Link to full student roster */}
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("all");
                  setActiveTab("students");
                }}
                className="min-h-[44px] px-4 py-2 border border-border text-sm font-mono uppercase font-bold text-foreground hover:bg-muted dark:hover:bg-muted inline-flex items-center gap-1.5"
              >
                <span>{dict.seeAllStudents || "See all students"} ({total})</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* More details toggle for teacher */}
          <details className="border border-border bg-card dark:bg-card rounded-[2px] p-4 text-sm">
            <summary className="font-mono text-sm uppercase font-bold text-foreground cursor-pointer hover:underline py-1">
              More details (Class breakdown & quick actions)
            </summary>
            <div className="pt-4 space-y-3 border-t border-border mt-3">
              <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed">
                Need the complete prerequisite dependency map, individual student diagnosis, or institutional CSV/JSON records? Tap any section above or use the navigation tabs.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("gaps")}
                  className="min-h-[44px] px-4 border border-border text-sm font-mono uppercase font-bold hover:bg-muted"
                >
                  View Full Mastery Matrix & Dependency Map
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("reports")}
                  className="min-h-[44px] px-4 border border-border text-sm font-mono uppercase font-bold hover:bg-muted"
                >
                  Export Student Data (CSV / JSON)
                </button>
              </div>
            </div>
          </details>
        </section>
      )}

      {/* ============================================================== */}
      {/* 2. STUDENT LIST TAB                                            */}
      {/* ============================================================== */}
      {activeTab === "students" && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">
                {classConfig.label} - Section {classConfig.section} Student Cohort ({filteredStudents.length} of {total}) • Demo data
              </h2>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Tap any student to view their diagnosis and 5-day action plan.
              </p>
            </div>

            {/* Search Box and Single Status Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search student or roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 min-h-[44px] text-base sm:text-sm font-mono bg-card dark:bg-card border border-border rounded-[2px]"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="min-h-[44px] px-3 text-base sm:text-sm font-mono bg-card dark:bg-card border border-border rounded-[2px] text-foreground"
              >
                <option value="all">All Students ({total})</option>
                <option value="critical">Critical Support ({criticalCount})</option>
                <option value="need_practice">Need Practice ({needPracticeCount})</option>
                <option value="on_track">On Track ({onTrackCount})</option>
              </select>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="py-4">
              {students.length === 0 ? (
                <EmptyState />
              ) : (
                <NoSearchResultsState
                  onClear={() => {
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                />
              )}
            </div>
          ) : (
            <>
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
                      className="p-4 border border-border bg-card dark:bg-card rounded-[2px] cursor-pointer hover:border-primary space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-serif font-bold text-base text-foreground">
                            {s.student.name}
                          </span>
                          <span className="text-sm font-mono text-muted-foreground dark:text-muted-foreground ml-1.5">
                            #{s.student.rollNo}
                          </span>
                        </div>

                        <span
                          className={`text-sm font-mono font-bold uppercase px-2 py-0.5 rounded-[2px] border ${
                            isCritical
                              ? "bg-primary text-primary-foreground/15 text-primary border-primary"
                              : isNeedPractice
                              ? "bg-[var(--status-warn-bg)] text-foreground border-[var(--status-warn-border)]"
                              : "bg-[var(--status-good)] text-foreground font-bold border-[var(--status-good-border)]"
                          }`}
                        >
                          {isCritical ? "Need Immediate Help" : isNeedPractice ? "Need Practice" : "On Track"}
                        </span>
                      </div>

                      <p className="text-sm text-foreground/80 dark:text-muted-foreground">
                        {root ? (
                          <span>Needs practice with: <strong className="text-primary">{t(`c_${root.rootId}`)}</strong></span>
                        ) : (
                          <span className="text-foreground font-bold bg-[var(--status-good)]/40 px-1.5 py-0.5 rounded-[2px]">Understands foundational concepts</span>
                        )}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-border text-sm font-mono">
                        <span className="text-muted-foreground dark:text-muted-foreground">
                          Understanding: {Math.round((s.profile.overallMastery ?? 0) * 100)}%
                        </span>
                        <span className="text-primary font-bold">View report</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= 640px) */}
              <div className="hidden sm:block border border-border bg-card dark:bg-card rounded-[2px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm sm:text-sm">
                    <thead className="bg-muted dark:bg-card text-foreground font-bold text-sm border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Topic Needing Practice</th>
                        <th className="py-3 px-4">Understanding</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-border">
                      {filteredStudents.map((s) => {
                        const root = s.profile.rootCauses[0];
                        const isCritical = s.profile.status === "critical";
                        const isNeedPractice = s.profile.status === "need_practice";

                        return (
                          <tr key={s.student.id} className="hover:bg-muted dark:hover:bg-foreground/40">
                            <td className="py-3 px-4 font-semibold text-foreground">
                              <div className="font-bold">{s.student.name}</div>
                              <div className="text-sm text-muted-foreground dark:text-muted-foreground font-mono">
                                Roll #{s.student.rollNo}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-[2px] text-sm font-mono font-bold uppercase border ${
                                  isCritical
                                    ? "bg-primary text-primary-foreground/15 text-primary border-primary"
                                    : isNeedPractice
                                    ? "bg-[var(--status-warn-bg)] text-foreground border-[var(--status-warn-border)]"
                                    : "bg-[var(--status-good)] text-foreground font-bold border-[var(--status-good-border)]"
                                }`}
                              >
                                {isCritical ? "Need Immediate Help" : isNeedPractice ? "Need Practice" : "On Track"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {root ? (
                                <span className="font-bold text-primary">{t(`c_${root.rootId}`)}</span>
                              ) : (
                                <span className="text-foreground font-bold bg-[var(--status-good)]/40 px-1.5 py-0.5 rounded-[2px]">Understands foundational concepts</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-sm">
                              {Math.round((s.profile.overallMastery ?? 0) * 100)}%
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => onSelectStudent(s)}
                                  className="min-h-[44px] px-3.5 border border-border text-sm font-mono uppercase font-bold hover:bg-muted"
                                >
                                  Report
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onPrintWorksheet(s)}
                                  className="min-h-[44px] px-3 border border-border text-sm font-mono uppercase font-bold hover:bg-muted inline-flex items-center gap-1"
                                  title="Print 1-page paper worksheet"
                                >
                                  <Printer size={16} />
                                  <span>Sheet</span>
                                </button>
                                {root && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenAssessment(s.student.id, root.rootId)}
                                    className="min-h-[44px] px-3.5 bg-primary text-primary-foreground text-sm font-mono uppercase font-bold border border-primary hover:bg-primary cursor-pointer"
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
            </>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* 3. CLASS GAPS TAB (Visualizations in their own second level)   */}
      {/* ============================================================== */}
      {activeTab === "gaps" && (
        <section className="space-y-5">
          <div className="border-b border-border pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">
                Classroom Learning Gaps & Prerequisite Map
              </h2>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Explore root-cause bottlenecks and curriculum prerequisite dependencies.
              </p>
            </div>

            {/* Sub-view toggles */}
            <div className="flex items-center bg-card dark:bg-muted border border-border rounded-[2px] p-0.5 text-sm font-mono">
              <button
                type="button"
                onClick={() => setGapsSubView("common")}
                className={`min-h-[36px] px-3 rounded-[2px] font-bold ${
                  gapsSubView === "common"
                    ? "bg-primary text-primary-foreground dark:bg-muted dark:text-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                Common Gaps
              </button>
              <button
                type="button"
                onClick={() => setGapsSubView("map")}
                className={`min-h-[36px] px-3 rounded-[2px] font-bold ${
                  gapsSubView === "map"
                    ? "bg-primary text-primary-foreground dark:bg-muted dark:text-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                Dependency Map
              </button>
              <button
                type="button"
                onClick={() => setGapsSubView("matrix")}
                className={`min-h-[36px] px-3 rounded-[2px] font-bold ${
                  gapsSubView === "matrix"
                    ? "bg-primary text-primary-foreground dark:bg-muted dark:text-foreground"
                    : "text-foreground hover:bg-muted"
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
                  className="p-5 border border-border bg-card dark:bg-card rounded-[2px] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-muted-foreground dark:text-muted-foreground">
                      GAP 0{index + 1}
                    </span>
                    <span
                      className={`text-sm font-mono font-bold px-2 py-0.5 rounded-[2px] border ${
                        gap.severity === "high"
                          ? "bg-primary text-primary-foreground/15 text-primary border-primary/40"
                          : "bg-[var(--status-warn-bg)] text-foreground border-[var(--status-warn-border)]"
                      }`}
                    >
                      {gap.count} Students ({gap.pct}%)
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-lg text-foreground">
                      {t(`c_${gap.conceptId}`)}
                    </h3>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-0.5">
                      Strand: {CONCEPTS[gap.conceptId]?.strand?.toUpperCase()} (Grade {CONCEPTS[gap.conceptId]?.grade})
                    </div>
                  </div>

                  {/* Clean Progress Bar */}
                  <div className="w-full bg-muted h-2 rounded-[2px] overflow-hidden">
                    <div
                      className={`h-full rounded-[2px] ${
                        gap.severity === "high" ? "bg-primary text-primary-foreground" : "bg-[var(--status-warn)]"
                      }`}
                      style={{ width: `${gap.pct}%` }}
                    />
                  </div>

                  <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed">
                    Affects {gap.count} learners in {classConfig.label} - Section {classConfig.section}. Practice this skill before moving to higher topics.
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Sub-view 2: Prerequisite Dependency Map */}
          {gapsSubView === "map" && (
            <div className="space-y-5 p-5 border border-border bg-card dark:bg-card rounded-[2px]">
              <div className="border-b border-border pb-3">
                <h3 className="font-serif text-lg font-bold text-foreground">
                  Prerequisite Lineage Traversal
                </h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Earlier concepts lead into upper grade mathematics. Tap any box to see prerequisites and dependents.
                </p>
              </div>

              {/* Stage 1 */}
              <div className="space-y-2">
                <span className="text-sm font-mono uppercase font-bold text-muted-foreground">STAGE 1: FOUNDATION</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["number_sense", "place_value", "addition"] as ConceptId[]).map((cId) => {
                    const st = conceptStats[cId];
                    const isSelected = selectedConceptForMap === cId;
                    return (
                      <button
                        type="button"
                        key={cId}
                        onClick={() => setSelectedConceptForMap(cId)}
                        className={`min-h-[44px] p-3 rounded-[2px] border text-left w-full ${
                          isSelected
                            ? "border-primary bg-muted"
                            : "border-border bg-card hover:border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm font-bold text-foreground">
                          <span>{t(`c_${cId}`)}</span>
                          <span>{st.avg}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-center font-bold text-muted-foreground">&darr;</div>

              {/* Stage 2 */}
              <div className="space-y-2">
                <span className="text-sm font-mono uppercase font-bold text-muted-foreground">STAGE 2: OPERATIONS</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["subtraction", "mult_concept", "mult_facts"] as ConceptId[]).map((cId) => {
                    const st = conceptStats[cId];
                    const isSelected = selectedConceptForMap === cId;
                    return (
                      <button
                        type="button"
                        key={cId}
                        onClick={() => setSelectedConceptForMap(cId)}
                        className={`min-h-[44px] p-3 rounded-[2px] border text-left w-full ${
                          isSelected
                            ? "border-primary bg-muted"
                            : "border-border bg-card hover:border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm font-bold text-foreground">
                          <span>{t(`c_${cId}`)}</span>
                          <span>{st.avg}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-center font-bold text-muted-foreground">&darr;</div>

              {/* Stage 3 */}
              <div className="space-y-2">
                <span className="text-sm font-mono uppercase font-bold text-muted-foreground">STAGE 3: DIVISION & FRACTIONS</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {(["multi_digit_mult", "division_concept", "division_facts", "fraction_basics"] as ConceptId[]).map((cId) => {
                    const st = conceptStats[cId];
                    const isSelected = selectedConceptForMap === cId;
                    return (
                      <button
                        type="button"
                        key={cId}
                        onClick={() => setSelectedConceptForMap(cId)}
                        className={`min-h-[44px] p-3 rounded-[2px] border text-left w-full ${
                          isSelected
                            ? "border-primary bg-muted"
                            : "border-border bg-card hover:border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm font-bold text-foreground">
                          <span className="truncate">{t(`c_${cId}`)}</span>
                          <span>{st.avg}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Concept Info */}
              {selectedConceptForMap && (
                <div className="p-4 border border-border bg-muted dark:bg-card rounded-[2px] text-sm space-y-1">
                  <div className="font-bold text-foreground">
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
            <div className="border border-border bg-card dark:bg-card rounded-[2px] overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="font-serif font-bold text-base text-foreground">
                  Student × Concept Matrix
                </span>
                <div className="flex items-center gap-3 text-sm font-mono">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[var(--status-good)]" /> &ge;75%</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[var(--status-warn)]" /> 50-74%</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-primary text-primary-foreground" /> &lt;50%</span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-card dark:bg-card sticky top-0 border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3 font-bold w-40">Student</th>
                      {CONCEPT_IDS.map((cId) => (
                        <th key={cId} className="py-2.5 px-2 text-center text-sm whitespace-nowrap">
                          {t(`c_${cId}`).split(" ")[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map((s) => (
                      <tr key={s.student.id} className="hover:bg-muted">
                        <td className="py-2 px-3 font-semibold text-foreground whitespace-nowrap">
                          {s.student.name}
                        </td>
                        {CONCEPT_IDS.map((cId) => {
                          const est = s.profile.concepts[cId];
                          const m = est?.mastery ?? 0;
                          const bg = m >= 0.75 ? "bg-[var(--status-good)]" : m >= 0.5 ? "bg-[var(--status-warn)]" : "bg-primary text-primary-foreground text-white";
                          return (
                            <td key={cId} className="py-2 px-1 text-center font-mono text-sm">
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
          <div className="border-b border-border pb-3">
            <h2 className="font-serif text-xl font-bold text-foreground">
              Classroom Reports & Institutional Exports
            </h2>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Download student records, guardian notices, and inspect security audit trails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export Card */}
            <div className="p-5 border border-border bg-card dark:bg-card rounded-[2px] space-y-3">
              <h3 className="font-serif font-bold text-base text-foreground">
                Data Export (CSV & JSON)
              </h3>
              <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed">
                Download {classConfig.label} - Section {classConfig.section} student records with formula injection protection and UTF-8 encoding for Excel.
              </p>
              {exportError && (
                <div className="p-2 border border-primary bg-primary text-primary-foreground/10 text-sm text-primary">
                  {exportError}
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleExport("csv")}
                  disabled={isExporting}
                  className="min-h-[44px] px-4 bg-primary text-primary-foreground dark:bg-muted dark:text-foreground text-sm font-mono uppercase font-bold hover:bg-primary"
                >
                  {isExporting ? "Exporting..." : "Export CSV"}
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("json")}
                  disabled={isExporting}
                  className="min-h-[44px] px-4 border border-border text-sm font-mono uppercase hover:bg-muted"
                >
                  Export JSON
                </button>
              </div>
            </div>

            {/* Guardian Notice Card */}
            <div className="p-5 border border-border bg-card dark:bg-card rounded-[2px] space-y-3">
              <h3 className="font-serif font-bold text-base text-foreground">
                Guardian DPDP Notices
              </h3>
              <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed">
                Print statutory 1-page parent notices in English, Hindi, and Telugu under DPDP Act 2023.
              </p>
              <div className="pt-1">
                <Link
                  href="/notices/guardian"
                  className="min-h-[44px] px-4 border border-border text-sm font-mono uppercase font-bold inline-flex items-center gap-1.5 hover:bg-muted"
                >
                  <FileText size={16} />
                  <span>Open Printable Notices</span>
                </Link>
              </div>
            </div>

            {/* Audit Trail Card */}
            <div className="p-5 border border-border bg-card dark:bg-card rounded-[2px] space-y-3">
              <h3 className="font-serif font-bold text-base text-foreground">
                Security Audit Trail
              </h3>
              <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed">
                Review immutable access logs, export events, share links, and teacher override determinations.
              </p>
              <div className="pt-1">
                <Link
                  href="/app/audit-log"
                  className="min-h-[44px] px-4 border border-border text-sm font-mono uppercase font-bold inline-flex items-center gap-1.5 hover:bg-muted"
                >
                  <span>View Audit Log</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Re-auth Password Modal */}
          {showReauthModal && (
            <div className="p-4 border border-primary bg-primary text-primary-foreground/10 rounded-[2px] space-y-3">
              <div className="text-sm font-bold text-primary flex items-center gap-1.5">
                <Warning size={16} />
                <span>Re-authentication Required Prior to Exporting Child Records</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                To protect student data, verify your teacher credentials:
              </p>
              <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                <input
                  type="password"
                  placeholder="Enter password to confirm"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  className="flex-1 min-h-[44px] px-3 border border-border bg-card text-base sm:text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleExport("csv")}
                  className="min-h-[44px] px-4 bg-primary text-primary-foreground text-sm font-mono uppercase font-bold"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setShowReauthModal(false)}
                  className="min-h-[44px] px-3 border border-border text-sm font-mono uppercase"
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
      <nav aria-label="Mobile Navigation Bar" className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-card dark:bg-card border-t border-border flex items-center justify-around h-16 px-1 safe-area-pb">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 text-sm font-mono font-bold uppercase ${
            activeTab === "home" ? "text-primary" : "text-muted-foreground dark:text-muted-foreground"
          }`}
        >
          <House size={20} />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("students")}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 text-sm font-mono font-bold uppercase ${
            activeTab === "students" ? "text-primary" : "text-muted-foreground dark:text-muted-foreground"
          }`}
        >
          <Users size={20} />
          <span>Students</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gaps")}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 text-sm font-mono font-bold uppercase ${
            activeTab === "gaps" ? "text-primary" : "text-muted-foreground dark:text-muted-foreground"
          }`}
        >
          <ChartPieSlice size={20} />
          <span>Class Gaps</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 text-sm font-mono font-bold uppercase ${
            activeTab === "reports" ? "text-primary" : "text-muted-foreground dark:text-muted-foreground"
          }`}
        >
          <FileText size={20} />
          <span>Reports</span>
        </button>
      </nav>
    </div>
  );
}
