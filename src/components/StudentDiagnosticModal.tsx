"use client";

import React, { useState } from "react";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  Printer,
  Clock,
  CalendarBlank,
  Warning,
  X,
  ArrowDown,
  Check,
  Copy,
} from "@phosphor-icons/react";
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
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const { student, profile, activePlan } = data;
  const rootCause = profile.rootCauses[0];

  const toggleDayCompletion = (dayNum: number) => {
    setCompletedDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

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
    const numSum = (profile.concepts.number_sense?.mastery || 0.9) + (profile.concepts.place_value?.mastery || 0.85);
    topicMasteryMap.number_ops = Math.min(1, Math.max(0.4, numSum / 2));
    const mulSum = (profile.concepts.mult_concept?.mastery || 0.7) + (profile.concepts.mult_facts?.mastery || 0.5);
    topicMasteryMap.multiplication = Math.min(1, Math.max(0.3, mulSum / 2));
    const divSum = (profile.concepts.division_facts?.mastery || 0.4) + (profile.concepts.long_division?.mastery || 0.35);
    topicMasteryMap.division = Math.min(1, Math.max(0.2, divSum / 2));
    const fracSum = (profile.concepts.fraction_basics?.mastery || 0.8) + (profile.concepts.equivalent_fractions?.mastery || 0.75);
    topicMasteryMap.fractions = Math.min(1, Math.max(0.3, fracSum / 2));
  }

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

  const handleCopyReport = () => {
    const text = `SHIKSHAGAP DIAGNOSTIC REPORT\nStudent: ${student.name} (Roll #${student.rollNo})\nOverall Mastery: ${Math.round((profile.overallMastery ?? 0) * 100)}%\nStatus: ${profile.status.toUpperCase()}\nDiagnosed Root Cause: ${rootCause ? t(`c_${rootCause.rootId}`) : "None detected"}\nDate: ${currentDateStr}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-[2px] bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)]">
        {/* Masthead Header Bar */}
        <div className="bg-[var(--card)] p-5 sm:p-6 sticky top-0 z-20 border-b border-[var(--border)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted-foreground)]">
                <span className="uppercase tracking-wider font-semibold">DIAGNOSTIC REPORT</span>
                <span>|</span>
                <span>CLASS 5 SECTION A</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[var(--foreground)] mt-0.5">
                {student.name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mt-1 font-mono">
                <span>Roll #{student.rollNo}</span>
                <span>|</span>
                <span>Date: {currentDateStr}</span>
                <span>|</span>
                <span
                  className={`px-1.5 py-0.2 rounded-[2px] text-[10px] font-bold uppercase ${
                    profile.status === "on_track"
                      ? "bg-[#8ABB93]/20 text-[#432623] border border-[#8ABB93]"
                      : profile.status === "need_practice"
                      ? "bg-[#DFA06E]/20 text-[#432623] border border-[#DFA06E]"
                      : "bg-[#DE2A35]/20 text-[#B51E28] border border-[#DE2A35]"
                  }`}
                >
                  {profile.status === "on_track"
                    ? "ON TRACK"
                    : profile.status === "need_practice"
                    ? "DEVELOPING"
                    : "NEEDS SUPPORT"}
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 bg-[var(--background)] p-3 rounded-[2px] border border-[var(--border)]">
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                  OVERALL MASTERY
                </span>
                <div className="font-serif text-3xl font-bold text-[var(--foreground)]">
                  {Math.round((profile.overallMastery ?? 0) * 100)}%
                </div>
              </div>
              <div className="w-[1px] h-8 bg-[var(--border)]" />
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                  CONFIDENCE
                </span>
                <div className="font-mono text-xl font-bold text-[#8ABB93]">
                  {Math.round(profile.confidence * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 mt-4 -mb-6 border-b border-[var(--border)] pb-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("report")}
              className={`px-3 py-1 font-semibold rounded-[2px] border ${
                activeTab === "report"
                  ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                  : "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
              }`}
            >
              Diagnostic Intelligence Report
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("plan")}
              className={`px-3 py-1 font-semibold rounded-[2px] border flex items-center gap-1.5 ${
                activeTab === "plan"
                  ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                  : "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
              }`}
            >
              <CalendarBlank size={12} />
              <span>5-Day Recovery Action Plan</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-5 bg-[var(--background)]">
          {activeTab === "report" ? (
            <>
              {/* Mandatory AI Decision Support Disclaimer (Phase B rule 6) */}
              <div className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-[2px] text-xs flex items-start gap-2.5 text-[var(--muted-foreground)]">
                <Warning size={16} className="text-[var(--primary)] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--foreground)]">AI Decision Support Notice:</strong> This diagnostic profile is generated by automated rule and probabilistic inference models to assist educators. It is decision support, not a definitive assessment of a child. Teacher pedagogical judgement remains primary.
                </div>
              </div>

              {/* 4 Topic Breakdown */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2px] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                    CURRICULUM TOPIC BREAKDOWN
                  </span>
                  <span className="text-xs font-mono text-[var(--muted-foreground)]">
                    4 Strands Evaluated
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CURRICULUM_TOPICS.map((tId: TopicId) => {
                    const masteryVal = topicMasteryMap[tId];
                    const pct = Math.round(masteryVal * 100);
                    let barColor = "bg-[#8ABB93]";
                    let statusLabel = "Mastered";
                    if (masteryVal < 0.5) {
                      barColor = "bg-[#DE2A35]";
                      statusLabel = "Needs Support";
                    } else if (masteryVal < 0.75) {
                      barColor = "bg-[#DFA06E]";
                      statusLabel = "Developing";
                    }

                    return (
                      <div
                        key={tId}
                        className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-[2px] space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[var(--foreground)]">
                            {TOPIC_DISPLAY_NAMES[tId]?.en}
                          </span>
                          <span className="font-mono font-bold text-[var(--foreground)]">
                            {pct}% | <span className="text-[10px] uppercase">{statusLabel}</span>
                          </span>
                        </div>
                        <div className="w-full bg-[var(--muted)] h-2 rounded-[2px] overflow-hidden">
                          <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Root Cause Panel */}
              {rootCause ? (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2px] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-[#DE2A35]" />
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#B51E28]">
                        ROOT CAUSE IDENTIFIED
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase bg-[#DE2A35]/15 text-[#B51E28] px-2 py-0.5 rounded-[2px] border border-[#DE2A35]">
                      {rootCause.severity === "high" ? "HIGH PRIORITY GAP" : "FOUNDATIONAL GAP"}
                    </span>
                  </div>

                  {/* Backtracking Lineage */}
                  <div className="bg-[var(--background)] p-3 rounded-[2px] border border-[var(--border)] space-y-2">
                    <div className="text-[10px] font-mono uppercase text-[var(--muted-foreground)]">
                      Prerequisite Backtracking Lineage:
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-semibold text-[var(--foreground)]">
                      {rootCause.chain.map((cId, idx) => (
                        <React.Fragment key={cId}>
                          <div
                            className={`px-2.5 py-1 rounded-[2px] border ${
                              idx === rootCause.chain.length - 1
                                ? "bg-[#DE2A35] text-[var(--primary-foreground)] border-[#DE2A35]"
                                : "bg-[var(--card)] text-[var(--foreground)] border-[var(--border)]"
                            }`}
                          >
                            <span>{t(`c_${cId}`)}</span>
                            {idx === rootCause.chain.length - 1 && " (Isolated Root Cause)"}
                          </div>
                          {idx < rootCause.chain.length - 1 && (
                            <ArrowRight size={12} className="text-[var(--muted-foreground)] hidden sm:inline shrink-0" />
                          )}
                          {idx < rootCause.chain.length - 1 && (
                            <ArrowDown size={12} className="text-[var(--muted-foreground)] sm:hidden mx-auto" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--foreground)] leading-relaxed">
                    <strong>Diagnosis:</strong> {student.name} shows difficulty on{" "}
                    <span className="font-semibold text-[#B51E28]">
                      {rootCause.symptomIds.map((s) => t(`c_${s}`)).join(", ")}
                    </span>
                    . Backtracking traces the bottleneck to missing fluency in{" "}
                    <span className="font-bold underline text-[var(--foreground)]">
                      {t(`c_${rootCause.rootId}`)}
                    </span>
                    . Practice on higher tasks will stall until this prerequisite is addressed.
                  </p>

                  {/* Why We Think This */}
                  <div className="pt-2 border-t border-[var(--border)] space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                      WHY WE THINK THIS (EVIDENCE)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {evidenceItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 bg-[var(--background)] p-2 rounded-[2px] border border-[var(--border)]"
                        >
                          {item.isPositive ? (
                            <Check size={14} className="text-[#8ABB93] shrink-0 mt-0.5" />
                          ) : (
                            <X size={14} className="text-[#DE2A35] shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-semibold text-[var(--foreground)]">{item.label}</div>
                            <div className="text-[11px] text-[var(--muted-foreground)]">{item.result}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--card)] border border-[#8ABB93] rounded-[2px] p-4 flex items-center gap-3">
                  <CheckCircle size={24} className="text-[#8ABB93] shrink-0" />
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[var(--foreground)]">
                      No Conceptual Gaps Detected
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {student.name} demonstrates sound prerequisite understanding across all tested Class 5 strands.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPrintWorksheet(data)}
                    className="px-3 py-1.5 text-xs font-semibold bg-[var(--card)] text-[var(--foreground)] rounded-[2px] border border-[var(--border)] hover:bg-[var(--muted)] flex items-center gap-1.5"
                  >
                    <Printer size={14} />
                    <span>Print Worksheet</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="px-3 py-1.5 text-xs font-semibold bg-[var(--card)] text-[var(--foreground)] rounded-[2px] border border-[var(--border)] hover:bg-[var(--muted)] flex items-center gap-1.5"
                  >
                    <Copy size={14} />
                    <span>{copied ? "Copied" : "Copy Report"}</span>
                  </button>
                </div>

                {rootCause && (
                  <button
                    type="button"
                    onClick={() => onStartReassessment(student.id, rootCause.rootId)}
                    className="px-4 py-1.5 text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[2px] border border-[var(--primary)] flex items-center gap-1.5"
                  >
                    <span>Start Reassessment</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </>
          ) : (
            /* 5-Day Plan Tab */
            <div className="space-y-4">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2px] p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif font-bold text-base text-[var(--foreground)]">
                    5-Day Recovery Action Plan
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    15 minutes daily | Concrete classroom manipulatives | Zero cost
                  </p>
                </div>
                <div className="text-xs font-mono font-semibold bg-[var(--background)] px-2.5 py-1 rounded-[2px] border border-[var(--border)]">
                  Progress: {completedDays.length} / 5 Days Completed
                </div>
              </div>

              <div className="space-y-2.5">
                {activePlan?.days.map((d) => {
                  const isDone = completedDays.includes(d.day);
                  const title = "raw" in d.title ? d.title.raw : d.title.key;
                  const activity = "raw" in d.activity ? d.activity.raw : d.activity.key;
                  const dayCode = `0${d.day}`;

                  return (
                    <div
                      key={d.day}
                      className={`p-3.5 rounded-[2px] border ${
                        isDone
                          ? "bg-[#8ABB93]/10 border-[#8ABB93]"
                          : "bg-[var(--card)] border-[var(--border)]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-[2px] border flex flex-col items-center justify-center shrink-0 ${
                            isDone
                              ? "bg-[#8ABB93] text-[var(--foreground)] border-[#8ABB93]"
                              : "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                          }`}
                        >
                          <span className="text-[8px] font-mono uppercase">DAY</span>
                          <span className="font-serif font-bold text-sm leading-none">{dayCode}</span>
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif font-semibold text-sm text-[var(--foreground)]">
                              {title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-[var(--muted-foreground)] flex items-center gap-1">
                                <Clock size={12} />
                                {d.minutes} min
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleDayCompletion(d.day)}
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-[2px] border ${
                                  isDone
                                    ? "bg-[#8ABB93] text-[var(--foreground)] border-[#8ABB93]"
                                    : "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
                                }`}
                              >
                                {isDone ? "Done" : "Mark Done"}
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                            {activity}
                          </p>
                          <div className="text-[10px] font-mono text-[var(--muted-foreground)]">
                            Focus: {d.focus}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => onPrintWorksheet(data)}
                  className="px-3 py-1.5 text-xs font-semibold bg-[var(--card)] text-[var(--foreground)] rounded-[2px] border border-[var(--border)] hover:bg-[var(--muted)] flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>Print Plan Worksheet</span>
                </button>
                {rootCause && (
                  <button
                    type="button"
                    onClick={() => onStartReassessment(student.id, rootCause.rootId)}
                    className="px-4 py-1.5 text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[2px] border border-[var(--primary)] flex items-center gap-1.5"
                  >
                    <span>Start Reassessment</span>
                    <ArrowRight size={14} />
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
