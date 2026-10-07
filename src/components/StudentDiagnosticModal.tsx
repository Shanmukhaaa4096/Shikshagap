"use client";

import React, { useState } from "react";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, ArrowRight, Printer, Sparkles, Brain, Clock, Calendar } from "lucide-react";
import { CONCEPTS } from "@/lib/concepts/graph";

interface Props {
  data: DemoStudentData | null;
  isOpen: boolean;
  onClose: () => void;
  onStartReassessment: (studentId: string, conceptId: string) => void;
  onPrintWorksheet: (studentData: DemoStudentData) => void;
}

export function StudentDiagnosticModal({
  data,
  isOpen,
  onClose,
  onStartReassessment,
  onPrintWorksheet,
}: Props) {
  const { dict, t } = useI18n();
  const [activeTab, setActiveTab] = useState<"diagnosis" | "plan">("diagnosis");
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  if (!data) return null;

  const { student, profile, activePlan } = data;
  const rootCause = profile.rootCauses[0];
  const rootConcept = rootCause ? CONCEPTS[rootCause.rootId] : null;

  const toggleDayCompletion = (dayNum: number) => {
    setCompletedDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        {/* Header Bar */}
        <div className="bg-zinc-900 text-white p-6 sticky top-0 z-10 border-b border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{student.name}</h2>
                <Badge variant="outline" className="text-zinc-300 border-zinc-700 font-mono">
                  Roll #{student.rollNo}
                </Badge>
                <Badge
                  className={
                    profile.status === "on_track"
                      ? "bg-emerald-600 text-white"
                      : profile.status === "need_practice"
                      ? "bg-amber-600 text-white"
                      : "bg-rose-600 text-white"
                  }
                >
                  {profile.status === "on_track"
                    ? dict.onTrack
                    : profile.status === "need_practice"
                    ? dict.needPractice
                    : dict.criticalGaps}
                </Badge>
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                Class 5A • Mathematics Diagnostic Profile
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs text-zinc-400 uppercase tracking-wider">{dict.masteryScore}</div>
                <div className="text-2xl font-black text-white">
                  {Math.round((profile.overallMastery ?? 0) * 100)}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-400 uppercase tracking-wider">{dict.confidenceScore}</div>
                <div className="text-2xl font-black text-emerald-400">
                  {Math.round(profile.confidence * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex gap-2 mt-6 border-b border-zinc-800 -mb-6 pb-2">
            <button
              onClick={() => setActiveTab("diagnosis")}
              className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "diagnosis"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              {dict.rootCauseAnalysis}
            </button>
            <button
              onClick={() => setActiveTab("plan")}
              className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "plan"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {dict.fiveDayPlanTitle}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 bg-zinc-50 dark:bg-zinc-950">
          {activeTab === "diagnosis" ? (
            <>
              {/* Root Cause Banner */}
              {rootCause ? (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-rose-600 text-white rounded-lg shadow-sm">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                          {dict.rootCauseConcept}
                        </span>
                        <Badge variant="destructive" className="text-xs font-semibold">
                          {rootCause.severity === "high"
                            ? dict.highSeverity
                            : dict.mediumSeverity}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
                        {t(`c_${rootCause.rootId}`)}
                      </h3>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2 leading-relaxed">
                        <strong>Why is {student.name} struggling?</strong> The student appears weak in{" "}
                        <span className="font-semibold text-rose-800 dark:text-rose-300">
                          {rootCause.symptomIds.map((s) => t(`c_${s}`)).join(", ")}
                        </span>
                        , but the actual bottleneck is a missing prerequisite:{" "}
                        <span className="underline font-bold text-rose-950 dark:text-rose-200">
                          {t(`c_${rootCause.rootId}`)}
                        </span>
                        . Standard practice on division will fail until this prerequisite gap is repaired.
                      </p>

                      {/* Visual Backtracking Chain */}
                      <div className="mt-4 pt-4 border-t border-rose-200 dark:border-rose-900/60 flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="text-zinc-500 uppercase">{dict.chainOfReasoning}:</span>
                        {rootCause.chain.map((cId, idx) => (
                          <React.Fragment key={cId}>
                            <span
                              className={`px-2.5 py-1 rounded-md ${
                                idx === rootCause.chain.length - 1
                                  ? "bg-rose-600 text-white font-bold ring-2 ring-rose-400"
                                  : "bg-white dark:bg-zinc-900 border text-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              {t(`c_${cId}`)}
                              {idx === rootCause.chain.length - 1 && " (Root Cause)"}
                            </span>
                            {idx < rootCause.chain.length - 1 && (
                              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl p-5 flex items-center gap-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-300">
                      No Conceptual Gaps Detected
                    </h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      {student.name} demonstrates sound prerequisite understanding across all tested Class 5 math strands.
                    </p>
                  </div>
                </div>
              )}

              {/* Concept Mastery Breakdown */}
              <div className="bg-white dark:bg-zinc-900 border rounded-xl p-5 shadow-2xs">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-4">
                  Concept Mastery Breakdown (Class 3–5)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(profile.concepts).map(([cId, est]) => {
                    if (!est) return null;
                    const isRoot = rootCause?.rootId === cId;
                    return (
                      <div
                        key={cId}
                        className={`p-3 rounded-lg border text-sm flex items-center justify-between ${
                          isRoot
                            ? "border-rose-400 bg-rose-50/60 dark:bg-rose-950/20"
                            : "bg-zinc-50 dark:bg-zinc-800/40"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                            {t(`c_${cId}`)}
                            {isRoot && (
                              <Badge variant="destructive" className="text-[10px] h-4 px-1">
                                Root Gap
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            {est.status === "mastered"
                              ? dict.statusMastered
                              : est.status === "developing"
                              ? dict.statusDeveloping
                              : dict.statusNeedsSupport}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            {Math.round(est.mastery * 100)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => onPrintWorksheet(data)}
                  className="gap-2"
                >
                  <Printer className="w-4 h-4" />
                  {dict.printWorksheet}
                </Button>
                {rootCause && (
                  <Button
                    onClick={() => onStartReassessment(student.id, rootCause.rootId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold shadow-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    {dict.reassessStudent}
                  </Button>
                )}
              </div>
            </>
          ) : (
            /* 5-Day Remediation Plan Tab */
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm">
                    {dict.fiveDayPlanTitle}
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                    15 minutes daily • Zero cost • Concrete manipulatives suitable for government schools
                  </p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 font-mono">
                  {completedDays.length} / 5 Days Done
                </Badge>
              </div>

              {/* Plan Days Accordion/Cards */}
              <div className="space-y-3">
                {activePlan?.days.map((d) => {
                  const isDone = completedDays.includes(d.day);
                  const title = "raw" in d.title ? d.title.raw : d.title.key;
                  const activity = "raw" in d.activity ? d.activity.raw : d.activity.key;

                  return (
                    <div
                      key={d.day}
                      className={`border rounded-xl p-4 transition-all ${
                        isDone
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                          : "bg-white dark:bg-zinc-900 hover:border-zinc-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDayCompletion(d.day)}
                          className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            isDone
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400"
                          }`}
                        >
                          {isDone && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              {title}
                            </span>
                            <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {d.minutes} {dict.minutesLabel}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">
                            {activity}
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <Badge variant="outline" className="text-[11px] font-normal text-zinc-500">
                              Focus: {d.focus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => onPrintWorksheet(data)} className="gap-2">
                  <Printer className="w-4 h-4" />
                  {dict.printWorksheet}
                </Button>
                {rootCause && (
                  <Button
                    onClick={() => onStartReassessment(student.id, rootCause.rootId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {dict.reassessStudent}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
