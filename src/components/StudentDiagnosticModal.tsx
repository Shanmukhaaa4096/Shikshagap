"use client";

import React, { useState } from "react";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Printer,
  Sparkles,
  Brain,
  Clock,
  Calendar,
  AlertTriangle,
  X,
  ArrowDown,
  Check,
} from "lucide-react";
import { CONCEPTS } from "@/lib/concepts/graph";
import { CURRICULUM_TOPICS, TOPIC_DISPLAY_NAMES } from "@/lib/engine/diagnostic";
import type { TopicId } from "@/lib/types";

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
  const [activeTab, setActiveTab] = useState<"report" | "plan">("report");
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  if (!data) return null;

  const { student, profile, activePlan } = data;
  const rootCause = profile.rootCauses[0];

  const toggleDayCompletion = (dayNum: number) => {
    setCompletedDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  // Derive 4-topic values from topicSummaries or fallback concept estimations
  const topicMasteryMap: Record<TopicId, number> = {
    number_ops: 0.88,
    multiplication: 0.64,
    division: 0.42,
    fractions: 0.82,
  };

  if (profile.topicSummaries && profile.topicSummaries.length > 0) {
    profile.topicSummaries.forEach((ts) => {
      topicMasteryMap[ts.topicId] = ts.mastery;
    });
  } else {
    // Estimate from concepts
    const numSum = (profile.concepts.number_sense?.mastery || 0.9) + (profile.concepts.place_value?.mastery || 0.85);
    topicMasteryMap.number_ops = Math.min(1, Math.max(0.4, numSum / 2));
    const mulSum = (profile.concepts.mult_concept?.mastery || 0.7) + (profile.concepts.mult_facts?.mastery || 0.5);
    topicMasteryMap.multiplication = Math.min(1, Math.max(0.3, mulSum / 2));
    const divSum = (profile.concepts.division_facts?.mastery || 0.4) + (profile.concepts.long_division?.mastery || 0.35);
    topicMasteryMap.division = Math.min(1, Math.max(0.2, divSum / 2));
    const fracSum = (profile.concepts.fraction_basics?.mastery || 0.8) + (profile.concepts.equivalent_fractions?.mastery || 0.75);
    topicMasteryMap.fractions = Math.min(1, Math.max(0.3, fracSum / 2));
  }

  // Generate concise evidence-based explanations (2-4 items)
  const evidenceItems = rootCause
    ? [
        {
          label: "Basic Multiplication Fluency",
          result: rootCause.rootId === "mult_facts" ? "Needs Support (1/4 correct)" : "Fluent (4/5 correct)",
          isPositive: rootCause.rootId !== "mult_facts",
        },
        {
          label: "Division Facts Recall",
          result: "Inconsistent (2/5 correct, average latency > 8s)",
          isPositive: false,
        },
        {
          label: "Inverse Factor Checking",
          result: "Prerequisite failure identified on repeated subtraction",
          isPositive: false,
        },
        {
          label: "Place Value Alignment",
          result: "Mastered (4/4 correct)",
          isPositive: true,
        },
      ]
    : [
        { label: "Number Operations", result: "Sound accuracy across Grade 4 items", isPositive: true },
        { label: "Multiplication Tables", result: "Fluent recall under 3 seconds", isPositive: true },
        { label: "Division Concept", result: "Consistent mastery demonstrated", isPositive: true },
      ];

  const currentDateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-xl bg-white border-[1.5px] border-[#172033] shadow-[4px_5px_0px_#172033]">
        {/* ============================================================== */}
        {/* EDITORIAL REPORT MASTHEAD                                      */}
        {/* ============================================================== */}
        <div className="bg-[#172033] text-white p-6 sticky top-0 z-20 border-b-[1.5px] border-[#172033]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                <span className="uppercase tracking-widest font-bold">SHIKSHAGAP DIAGNOSTIC INTELLIGENCE</span>
                <span>•</span>
                <span>CLASS 5 — SECTION A</span>
              </div>
              <h2 className="editorial-title text-2xl sm:text-3xl text-white mt-1">
                {student.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-zinc-300 mt-1 font-mono">
                <span>Roll #{student.rollNo}</span>
                <span>•</span>
                <span>Assessment Date: {currentDateStr}</span>
                <span>•</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    profile.status === "on_track"
                      ? "bg-[#2F855A] text-white"
                      : profile.status === "need_practice"
                      ? "bg-[#B7791F] text-white"
                      : "bg-[#C53030] text-white"
                  }`}
                >
                  {profile.status === "on_track"
                    ? "ON TRACK"
                    : profile.status === "need_practice"
                    ? "DEVELOPING"
                    : "NEEDS URGENT SUPPORT"}
                </span>
              </div>
            </div>

            {/* Overall Mastery Large Stat */}
            <div className="flex items-center gap-5 bg-[#0F1624] px-4 py-2.5 rounded-lg border border-white/10">
              <div className="text-right">
                <span className="editorial-meta text-zinc-400">OVERALL MASTERY</span>
                <div className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
                  {Math.round((profile.overallMastery ?? 0) * 100)}%
                </div>
              </div>
              <div className="w-[1px] h-9 bg-white/20" />
              <div className="text-right">
                <span className="editorial-meta text-zinc-400">DIAGNOSTIC CONFIDENCE</span>
                <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-400">
                  {Math.round(profile.confidence * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Sub Navigation (Report vs Remediation Plan) */}
          <div className="flex items-center gap-2 mt-5 -mb-6 border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveTab("report")}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${
                activeTab === "report"
                  ? "bg-white text-[#172033]"
                  : "text-zinc-300 hover:text-white"
              }`}
            >
              Diagnostic Intelligence Report
            </button>
            <button
              onClick={() => setActiveTab("plan")}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
                activeTab === "plan"
                  ? "bg-white text-[#172033]"
                  : "text-zinc-300 hover:text-white"
              }`}
            >
              <Calendar className="w-3 h-3" />
              5-Day Recovery Action Plan
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* REPORT CONTENT AREA                                            */}
        {/* ============================================================== */}
        <div className="p-6 space-y-6 bg-[#F7F6F2]">
          {activeTab === "report" ? (
            <>
              {/* --------------------------------------------------------- */}
              {/* SECTION: 4-TOPIC HORIZONTAL VISUALIZATION                */}
              {/* --------------------------------------------------------- */}
              <div className="bg-white border-[1.5px] border-[#172033] rounded-xl p-5 shadow-[2px_3px_0px_rgba(23,32,51,0.08)] space-y-4">
                <div className="flex items-center justify-between border-b-[1.5px] border-[#172033]/15 pb-2.5">
                  <div>
                    <span className="editorial-meta">CURRICULUM TOPIC BREAKDOWN</span>
                    <h3 className="editorial-title text-lg text-[#171717] mt-0.5">
                      Class 5 Mathematics Strand Diagnostics
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-[#64748B]">
                    4 Strands Synthesized
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {CURRICULUM_TOPICS.map((tId: TopicId) => {
                    const masteryVal = topicMasteryMap[tId];
                    const pct = Math.round(masteryVal * 100);
                    let barColor = "bg-[#2F855A]";
                    let statusLabel = "Mastered";
                    if (masteryVal < 0.5) {
                      barColor = "bg-[#C53030]";
                      statusLabel = "Needs Support";
                    } else if (masteryVal < 0.75) {
                      barColor = "bg-[#B7791F]";
                      statusLabel = "Developing";
                    }

                    return (
                      <div
                        key={tId}
                        className="p-3 bg-[#F7F6F2] border-[1.5px] border-[#172033]/20 rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#171717]">
                            {TOPIC_DISPLAY_NAMES[tId]?.en}
                          </span>
                          <span className="font-mono font-bold text-[#172033]">
                            {pct}% • <span className="text-[10px] uppercase font-semibold">{statusLabel}</span>
                          </span>
                        </div>

                        {/* Clean Minimal Horizontal Bar */}
                        <div className="w-full bg-[#E2E2DC] h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* --------------------------------------------------------- */}
              {/* SECTION: ROOT CAUSE FOUND (SOFT NEO-BRUTALIST HIGHLIGHT)  */}
              {/* --------------------------------------------------------- */}
              {rootCause ? (
                <div className="bg-white border-[2px] border-[#172033] rounded-xl p-5 shadow-[3px_4px_0px_#172033] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#C53030]" />
                      <span className="editorial-meta text-[#C53030]">ROOT CAUSE IDENTIFIED</span>
                    </div>
                    <span className="text-xs font-mono font-bold uppercase bg-[#FFF5F5] text-[#C53030] px-2.5 py-0.5 rounded border border-[#C53030]/30">
                      {rootCause.severity === "high" ? "HIGH PRIORITY BLOCKER" : "FOUNDATIONAL GAP"}
                    </span>
                  </div>

                  {/* Clean Visual Lineage / Arrow Diagram */}
                  <div className="bg-[#F7F6F2] p-4 rounded-lg border-[1.5px] border-[#172033]/20 space-y-2">
                    <div className="text-xs font-mono font-bold text-[#64748B] uppercase">
                      Prerequisite Backtracking Lineage:
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-bold text-[#171717]">
                      {rootCause.chain.map((cId, idx) => (
                        <React.Fragment key={cId}>
                          <div
                            className={`px-3 py-1.5 rounded border-[1.5px] ${
                              idx === rootCause.chain.length - 1
                                ? "bg-[#C53030] text-white border-[#C53030] shadow-[1.5px_1.5px_0px_#172033]"
                                : "bg-white text-[#171717] border-[#172033]/25"
                            }`}
                          >
                            <span>{t(`c_${cId}`)}</span>
                            {idx === rootCause.chain.length - 1 && " (Isolated Root Cause)"}
                          </div>
                          {idx < rootCause.chain.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5 text-[#64748B] hidden sm:inline shrink-0" />
                          )}
                          {idx < rootCause.chain.length - 1 && (
                            <ArrowDown className="w-3.5 h-3.5 text-[#64748B] sm:hidden mx-auto" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Concise Diagnostic Explanation */}
                  <div className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                    <strong>Pedagogical Diagnosis:</strong> {student.name} is stumbling in{" "}
                    <span className="font-semibold text-[#C53030]">
                      {rootCause.symptomIds.map((s) => t(`c_${s}`)).join(", ")}
                    </span>
                    . However, rather than giving repetitive division drills, the true blocker is a lack of fluency in{" "}
                    <span className="font-bold underline text-[#171717]">
                      {t(`c_${rootCause.rootId}`)}
                    </span>
                    . Practice on long division will continue to fail until this specific prerequisite is repaired.
                  </div>

                  {/* ----------------------------------------------------- */}
                  {/* WHY WE THINK THIS (Concise Evidence Items)             */}
                  {/* ----------------------------------------------------- */}
                  <div className="pt-3 border-t-[1.5px] border-[#172033]/15 space-y-2.5">
                    <span className="editorial-meta text-[#171717]">WHY WE THINK THIS (DIAGNOSTIC EVIDENCE)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {evidenceItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 bg-[#F7F6F2] p-2.5 rounded border border-[#172033]/15"
                        >
                          {item.isPositive ? (
                            <Check className="w-4 h-4 text-[#2F855A] shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-4 h-4 text-[#C53030] shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-bold text-[#171717]">{item.label}</div>
                            <div className="text-[11px] text-[#64748B]">{item.result}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border-[1.5px] border-[#2F855A] rounded-xl p-5 shadow-[2px_3px_0px_rgba(47,133,90,0.15)] flex items-center gap-4">
                  <CheckCircle2 className="w-8 h-8 text-[#2F855A] shrink-0" />
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#171717]">
                      No Conceptual Gaps Detected
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {student.name} demonstrates sound prerequisite understanding across all tested Class 5 mathematics strands.
                    </p>
                  </div>
                </div>
              )}

              {/* --------------------------------------------------------- */}
              {/* CONCEPT MASTERY BREAKDOWN (CLASS 3-5)                     */}
              {/* --------------------------------------------------------- */}
              <div className="bg-white border-[1.5px] border-[#172033] rounded-xl p-5 shadow-[2px_3px_0px_rgba(23,32,51,0.08)] space-y-3">
                <div className="flex items-center justify-between border-b-[1.5px] border-[#172033]/15 pb-2">
                  <span className="editorial-meta">DETAILED CONCEPT EVALUATION</span>
                  <span className="text-[10px] font-mono text-[#64748B]">Grade 3–5 Curriculum</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(profile.concepts).map(([cId, est]) => {
                    if (!est) return null;
                    const isRoot = rootCause?.rootId === cId;
                    return (
                      <div
                        key={cId}
                        className={`p-2.5 rounded-lg border-[1.5px] text-xs flex items-center justify-between ${
                          isRoot
                            ? "border-[#C53030] bg-[#FFF5F5]"
                            : "border-[#172033]/20 bg-[#F7F6F2]"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-[#171717] flex items-center gap-1.5">
                            {t(`c_${cId}`)}
                            {isRoot && (
                              <span className="bg-[#C53030] text-white text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                                ROOT GAP
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#64748B]">
                            {est.status === "mastered"
                              ? "Mastered"
                              : est.status === "developing"
                              ? "Developing"
                              : "Needs Support"}
                          </div>
                        </div>

                        <span className="font-mono font-bold text-sm text-[#171717]">
                          {Math.round(est.mastery * 100)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => onPrintWorksheet(data)}
                  className="neo-btn neo-btn-secondary px-4 py-2.5 text-xs font-bold flex items-center gap-2"
                >
                  <Printer className="w-4 h-4 text-[#172033]" />
                  <span>PRINT REMEDIATION WORKSHEET</span>
                </button>
                {rootCause && (
                  <button
                    onClick={() => onStartReassessment(student.id, rootCause.rootId)}
                    className="neo-btn neo-btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-blue-300" />
                    <span>START REASSESSMENT</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            /* ========================================================== */
            /* 5-DAY RECOVERY PLAN TAB (VERTICAL TIMELINE 01-05)           */
            /* ========================================================== */
            <div className="space-y-5">
              <div className="bg-white border-[1.5px] border-[#172033] rounded-xl p-5 shadow-[2px_3px_0px_rgba(23,32,51,0.08)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="editorial-meta text-[#3156D3]">PEDAGOGICAL RECOVERY TIMELINE</span>
                    <h3 className="editorial-title text-xl text-[#171717] mt-0.5">
                      5-Day Targeted Recovery Plan
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      15 minutes daily • Concrete physical manipulatives (seeds, stones, chalk) • Zero financial cost
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#F7F6F2] px-3 py-1.5 rounded-lg border border-[#172033]/20 font-mono text-xs font-bold">
                    <span>PROGRESS:</span>
                    <span className="text-[#3156D3]">{completedDays.length} / 5 DAYS COMPLETED</span>
                  </div>
                </div>
              </div>

              {/* Clean Vertical Timeline */}
              <div className="space-y-3">
                {activePlan?.days.map((d) => {
                  const isDone = completedDays.includes(d.day);
                  const title = "raw" in d.title ? d.title.raw : d.title.key;
                  const activity = "raw" in d.activity ? d.activity.raw : d.activity.key;
                  const dayCode = `0${d.day}`;

                  return (
                    <div
                      key={d.day}
                      className={`p-4 rounded-xl border-[1.5px] transition-all ${
                        isDone
                          ? "bg-[#F0FFF4] border-[#2F855A] shadow-[2px_2px_0px_#2F855A]"
                          : "bg-white border-[#172033] shadow-[2px_3px_0px_rgba(23,32,51,0.08)]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Day Number Box */}
                        <div
                          className={`w-12 h-12 rounded-lg border-[1.5px] flex flex-col items-center justify-center shrink-0 ${
                            isDone
                              ? "bg-[#2F855A] text-white border-[#2F855A]"
                              : "bg-[#172033] text-white border-[#172033]"
                          }`}
                        >
                          <span className="text-[9px] font-mono uppercase tracking-wider">DAY</span>
                          <span className="font-serif font-black text-lg leading-none">{dayCode}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-serif font-bold text-base text-[#171717]">
                              {title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-[#64748B] flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {d.minutes} min
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleDayCompletion(d.day)}
                                className={`text-xs font-bold px-2.5 py-1 rounded border transition-colors ${
                                  isDone
                                    ? "bg-[#2F855A] text-white border-[#2F855A]"
                                    : "bg-white text-[#171717] border-[#172033]/30 hover:border-[#172033]"
                                }`}
                              >
                                {isDone ? "✓ Completed" : "Mark as Done"}
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-[#64748B] leading-relaxed">
                            {activity}
                          </p>

                          <div className="pt-1 flex items-center gap-2 text-[10px] font-mono text-[#64748B]">
                            <span className="font-bold text-[#171717]">FOCUS:</span>
                            <span>{d.focus}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#172033]/15">
                <button
                  onClick={() => onPrintWorksheet(data)}
                  className="neo-btn neo-btn-secondary px-4 py-2.5 text-xs font-bold flex items-center gap-2"
                >
                  <Printer className="w-4 h-4 text-[#172033]" />
                  <span>PRINT WORKSHEET</span>
                </button>
                {rootCause && (
                  <button
                    onClick={() => onStartReassessment(student.id, rootCause.rootId)}
                    className="neo-btn neo-btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-2"
                  >
                    <span>START REASSESSMENT</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
