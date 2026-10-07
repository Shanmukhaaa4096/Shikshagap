"use client";

import React, { useState } from "react";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  FileSpreadsheet,
  Printer,
  Sparkles,
} from "lucide-react";
import { CONCEPTS, CONCEPT_IDS } from "@/lib/concepts/graph";
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
  const [activeTab, setActiveTab] = useState<"interventions" | "gaps" | "matrix">("interventions");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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
      conceptId: cId,
      count,
      pct: Math.round((count / total) * 100),
      severity: count >= 6 ? ("high" as const) : ("medium" as const),
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {dict.totalStudents}
              </p>
              <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">
                {total}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">PM SHRI Class 5A</p>
            </div>
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {dict.onTrack}
              </p>
              <h3 className="text-3xl font-extrabold text-emerald-950 dark:text-emerald-100 mt-1">
                {onTrackCount}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                {Math.round((onTrackCount / total) * 100)}% of classroom
              </p>
            </div>
            <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-xs">
              <CheckCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {dict.needPractice}
              </p>
              <h3 className="text-3xl font-extrabold text-amber-950 dark:text-amber-100 mt-1">
                {needPracticeCount}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Developing prerequisites
              </p>
            </div>
            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                {dict.criticalGaps}
              </p>
              <h3 className="text-3xl font-extrabold text-rose-950 dark:text-rose-100 mt-1">
                {criticalCount}
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                Blocked by root causes
              </p>
            </div>
            <div className="p-3 bg-rose-600 text-white rounded-xl shadow-xs">
              <Flame className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Core Teacher Question Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-200 text-xs px-2.5 py-0.5 rounded-full border border-blue-400/30 font-semibold">
              <Brain className="w-3.5 h-3.5 text-blue-300" />
              Learning Intelligence Agent
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {dict.teacherQuestionBanner}
            </h2>
            <p className="text-sm text-blue-200/90 leading-relaxed">
              {dict.teacherQuestionSub}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                const firstCritical = students.find((s) => s.profile.status === "critical");
                onOpenAssessment(firstCritical?.student.id || students[0]?.student.id || "student_1", "math");
              }}
              className="bg-white text-blue-950 hover:bg-blue-50 font-bold px-4 py-2.5 rounded-xl shadow-xs"
            >
              Start AI Diagnostic Assessment →
            </Button>
          </div>

        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("interventions")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === "interventions"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
            }`}
          >
            {dict.tabInterventions} ({students.filter((s) => s.profile.status !== "on_track").length})
          </button>
          <button
            onClick={() => setActiveTab("gaps")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === "gaps"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
            }`}
          >
            {dict.conceptGap} Overview
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === "matrix"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
            }`}
          >
            {dict.tabConceptMap}
          </button>
        </div>

        {/* Filter / Search for Interventions */}
        {activeTab === "interventions" && (
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search student or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-white dark:bg-zinc-900"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-white dark:bg-zinc-900 border rounded-lg h-8 px-2 font-medium"
            >
              <option value="all">All Status</option>
              <option value="critical">Critical</option>
              <option value="need_practice">Need Practice</option>
              <option value="on_track">On Track</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Prioritized Interventions Table */}
      {activeTab === "interventions" && (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-semibold text-xs border-b">
                <tr>
                  <th className="py-3 px-4">{dict.studentName}</th>
                  <th className="py-3 px-4">{dict.symptomConcept}</th>
                  <th className="py-3 px-4">{dict.rootCauseConcept}</th>
                  <th className="py-3 px-4">{dict.severity}</th>
                  <th className="py-3 px-4 text-right">{dict.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredStudents.map((s) => {
                  const root = s.profile.rootCauses[0];
                  return (
                    <tr
                      key={s.student.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {s.student.name}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono">
                          Roll #{s.student.rollNo} • Mastery: {Math.round((s.profile.overallMastery ?? 0) * 100)}%
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">
                        {root && root.symptomIds.length > 0 ? (
                          <span className="font-medium">
                            {root.symptomIds.map((sym) => t(`c_${sym}`)).join(", ")}
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic">None (On Track)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {root ? (
                          <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                            <span>{t(`c_${root.rootId}`)}</span>
                          </div>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Fluent
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          className={
                            s.profile.status === "critical"
                              ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
                              : s.profile.status === "need_practice"
                              ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                          }
                          variant="outline"
                        >
                          {s.profile.status === "critical"
                            ? dict.highSeverity
                            : s.profile.status === "need_practice"
                            ? dict.mediumSeverity
                            : dict.lowSeverity}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSelectStudent(s)}
                            className="h-8 text-xs font-semibold"
                          >
                            {dict.diagnoseBtn}
                          </Button>
                          {root && (
                            <Button
                              size="sm"
                              onClick={() => onOpenAssessment(s.student.id, root.rootId)}
                              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              {dict.practiceBtn}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Common Learning Gaps in Classroom */}
      {activeTab === "gaps" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedGaps.map((gap, index) => (
            <Card key={gap.conceptId} className="border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs">
                    Rank #{index + 1}
                  </Badge>
                  <Badge
                    variant={gap.severity === "high" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {gap.count} Students ({gap.pct}%)
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                  {t(`c_${gap.conceptId}`)}
                </CardTitle>
                <CardDescription className="text-xs">
                  {dict.prerequisiteOf}: {CONCEPTS[gap.conceptId as ConceptId]?.strand?.toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={gap.pct} className="h-2 bg-zinc-100 dark:bg-zinc-800" />
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Affects {gap.count} learners in Class 5A. Remediation in this foundational concept will unblock higher-order fluency.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 3: Mastery Matrix Grid */}
      {activeTab === "matrix" && (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-b flex items-center justify-between text-xs text-zinc-500">
            <span>Color Legend:</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Mastered (≥75%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Developing (50–74%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Needs Support (&lt;50%)
              </span>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-white dark:bg-zinc-950 sticky top-0 border-b z-10">
                <tr>
                  <th className="py-2.5 px-3 font-bold w-40">Student</th>
                  {CONCEPT_IDS.map((cId) => (
                    <th key={cId} className="py-2.5 px-2 font-medium text-center text-[11px] whitespace-nowrap">
                      {t(`c_${cId}`).split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {students.map((s) => (
                  <tr key={s.student.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <td className="py-2 px-3 font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                      {s.student.name}
                    </td>
                    {CONCEPT_IDS.map((cId) => {
                      const est = s.profile.concepts[cId];
                      const st = est?.status;
                      const color =
                        st === "mastered"
                          ? "bg-emerald-500 text-white"
                          : st === "developing"
                          ? "bg-amber-500 text-white"
                          : st === "needs_support"
                          ? "bg-rose-500 text-white"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500";

                      return (
                        <td key={cId} className="py-2 px-2 text-center">
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
        </Card>
      )}
    </div>
  );
}
