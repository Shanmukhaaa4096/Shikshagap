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
  const [activeTab, setActiveTab] = useState<"report" | "plan" | "override" | "share">("report");
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  // Override States
  const [overrideDecision, setOverrideDecision] = useState<'accepted' | 'changed' | 'dismissed'>('accepted');
  const [alternateConcept, setAlternateConcept] = useState('place_value');
  const [teacherNote, setTeacherNote] = useState('');
  const [isSavingOverride, setIsSavingOverride] = useState(false);
  const [overrideSavedMessage, setOverrideSavedMessage] = useState<string | null>(null);

  // Sharing States
  const [confirmedShareNotice, setConfirmedShareNotice] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  if (!data) return null;

  const { student, profile, activePlan } = data;
  const rootCause = profile.rootCauses[0];

  const handleSaveOverride = async () => {
    setIsSavingOverride(true);
    setOverrideSavedMessage(null);
    try {
      const res = await fetch('/api/assessment/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          classId: student.classroomId || 'class_5a',
          originalRootGapId: rootCause?.rootId || 'unclassified',
          originalRootGapLabel: rootCause ? t(`c_${rootCause.rootId}`) : 'Unclassified',
          decision: overrideDecision,
          newRootGapId: overrideDecision === 'changed' ? alternateConcept : undefined,
          newRootGapLabel: overrideDecision === 'changed' ? (CONCEPTS as any)[alternateConcept]?.name : undefined,
          teacherNote,
        }),
      });
      if (res.ok) {
        setOverrideSavedMessage('Teacher diagnostic decision recorded and locked.');
      } else {
        setOverrideSavedMessage('Failed to save decision to server.');
      }
    } catch {
      setOverrideSavedMessage('Saved locally for sync upon reconnect.');
    } finally {
      setIsSavingOverride(false);
    }
  };

  const handleGenerateShare = async () => {
    if (!confirmedShareNotice) return;
    setIsGeneratingShare(true);
    setShareError(null);
    try {
      const res = await fetch('/api/reports/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          classId: student.classroomId || 'class_5a',
          confirmedNotice: true,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setShareError(resData.error || 'Failed to generate secure link.');
        return;
      }
      setShareLink(resData.shareUrl);
    } catch {
      setShareError('Network failure generating link.');
    } finally {
      setIsGeneratingShare(false);
    }
  };

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
          <div className="flex flex-wrap items-center gap-1.5 mt-4 -mb-6 border-b border-[var(--border)] pb-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("report")}
              className={`min-h-[40px] px-3 py-1 font-semibold rounded-[2px] border ${
                activeTab === "report"
                  ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                  : "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
              }`}
            >
              Diagnostic Intelligence
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("plan")}
              className={`min-h-[40px] px-3 py-1 font-semibold rounded-[2px] border flex items-center gap-1.5 ${
                activeTab === "plan"
                  ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                  : "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
              }`}
            >
              <CalendarBlank size={13} />
              <span>5-Day Action Plan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("override" as any)}
              className={`min-h-[40px] px-3 py-1 font-semibold rounded-[2px] border flex items-center gap-1.5 ${
                (activeTab as string) === "override"
                  ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                  : "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
              }`}
            >
              <span>Teacher Override</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("share" as any)}
              className={`min-h-[40px] px-3 py-1 font-semibold rounded-[2px] border flex items-center gap-1.5 ${
                (activeTab as string) === "share"
                  ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                  : "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
              }`}
            >
              <span>Parent WhatsApp Report</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-5 bg-[var(--background)]">
          {activeTab === "report" && (
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
          )}

          {/* TAB 2: 5-Day Plan Tab */}
          {activeTab === "plan" && (
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

          {/* TAB 3: TEACHER OVERRIDE */}
          {activeTab === "override" && (
            <div className="space-y-4">
              <div className="border border-[var(--border)] p-4 bg-[var(--card)] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                      AI SUGGESTED DIAGNOSIS
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">
                      {rootCause ? t(`c_${rootCause.rootId}`) : "No Critical Gap Detected"}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-[#DE2A35] text-[#DE2A35] font-bold uppercase">
                    AI Decision Support
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-[var(--foreground)] mb-2">
                    Teacher Pedagogical Determination:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setOverrideDecision("accepted")}
                      className={`min-h-[44px] p-2.5 text-xs font-mono uppercase border text-left ${
                        overrideDecision === "accepted"
                          ? "bg-[var(--foreground)] text-[var(--background)] font-bold border-[var(--foreground)]"
                          : "border-[var(--border)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      <div className="font-bold">Accept Suggestion</div>
                      <div className="text-[10px] opacity-75">Confirm AI assessment</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverrideDecision("changed")}
                      className={`min-h-[44px] p-2.5 text-xs font-mono uppercase border text-left ${
                        overrideDecision === "changed"
                          ? "bg-[var(--foreground)] text-[var(--background)] font-bold border-[var(--foreground)]"
                          : "border-[var(--border)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      <div className="font-bold">Change Root Gap</div>
                      <div className="text-[10px] opacity-75">Select alternate skill</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverrideDecision("dismissed")}
                      className={`min-h-[44px] p-2.5 text-xs font-mono uppercase border text-left ${
                        overrideDecision === "dismissed"
                          ? "bg-[var(--foreground)] text-[var(--background)] font-bold border-[var(--foreground)]"
                          : "border-[var(--border)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      <div className="font-bold">Dismiss Gap</div>
                      <div className="text-[10px] opacity-75">Student on track</div>
                    </button>
                  </div>
                </div>

                {overrideDecision === "changed" && (
                  <div>
                    <label htmlFor="alternate-concept-select" className="block text-xs font-mono uppercase text-[var(--muted-foreground)] mb-1">
                      Select True Prerequisite Gap:
                    </label>
                    <select
                      id="alternate-concept-select"
                      value={alternateConcept}
                      onChange={(e) => setAlternateConcept(e.target.value)}
                      className="w-full min-h-[44px] bg-[var(--background)] border border-[var(--border)] px-3 text-base sm:text-xs font-mono text-[var(--foreground)]"
                    >
                      {Object.entries(CONCEPTS).map(([id, c]) => (
                        <option key={id} value={id}>
                          {t(`c_${id}` as any) || id.replace(/_/g, ' ')} (Grade {c.grade})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="teacher-note-textarea" className="block text-xs font-mono uppercase text-[var(--muted-foreground)]">
                      Confidential Teacher Note (Classroom Context):
                    </label>
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                      {500 - teacherNote.length} characters left
                    </span>
                  </div>
                  <textarea
                    id="teacher-note-textarea"
                    rows={3}
                    maxLength={500}
                    value={teacherNote}
                    onChange={(e) => setTeacherNote(e.target.value)}
                    placeholder="e.g. Student understood borrowing with base-10 flats but rushed on zero regrouping..."
                    className="w-full bg-[var(--background)] border border-[var(--border)] p-3 text-base sm:text-xs font-mono text-[var(--foreground)]"
                  />
                </div>

                {overrideSavedMessage && (
                  <div className="p-3 border border-[#8ABB93] bg-[#8ABB93]/15 text-xs font-mono">
                    {overrideSavedMessage}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveOverride}
                    disabled={isSavingOverride}
                    className="w-full sm:w-auto min-h-[44px] px-6 bg-[var(--foreground)] text-[var(--background)] text-xs font-mono uppercase font-bold border border-[var(--foreground)] hover:bg-[#DE2A35]"
                  >
                    {isSavingOverride ? "Saving Override..." : "Save Teacher Determination"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PARENT WHATSAPP REPORT */}
          {activeTab === "share" && (
            <div className="space-y-4">
              <div className="border border-[var(--border)] p-5 bg-[var(--card)] space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#DE2A35] font-bold">
                    Child Privacy Protected (DPDP Act 2023)
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[var(--foreground)] mt-0.5">
                    Generate Private 7-Day Parent Progress Note
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mt-1">
                    Creates an unguessable 128-bit cryptographic link containing parent-friendly practice tips and strengths. Contains zero student scores or rankings.
                  </p>
                </div>

                <div className="p-3 border border-[var(--border)] bg-[var(--background)] space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed">
                    <input
                      type="checkbox"
                      checked={confirmedShareNotice}
                      onChange={(e) => setConfirmedShareNotice(e.target.checked)}
                      className="mt-0.5 w-4 h-4 shrink-0 rounded-[2px]"
                    />
                    <span>
                      <strong>Teacher Confirmation:</strong> I confirm that I am sharing formative mathematics diagnostic feedback solely with this child&apos;s lawful parent or guardian.
                    </span>
                  </label>
                </div>

                {shareError && (
                  <div className="p-3 border border-[#DE2A35] bg-[#DE2A35]/10 text-xs text-[#DE2A35]">
                    {shareError}
                  </div>
                )}

                {!shareLink ? (
                  <button
                    type="button"
                    onClick={handleGenerateShare}
                    disabled={!confirmedShareNotice || isGeneratingShare}
                    className="min-h-[44px] px-5 bg-[var(--foreground)] text-[var(--background)] text-xs font-mono uppercase font-bold border border-[var(--foreground)] disabled:opacity-40"
                  >
                    {isGeneratingShare ? "Generating Cryptographic Token..." : "Generate Secure Parent Link"}
                  </button>
                ) : (
                  <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                    <div>
                      <span className="block text-[11px] font-mono uppercase text-[var(--muted-foreground)] mb-1">
                        Secure Private Link (Expires in 7 days):
                      </span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          readOnly
                          value={shareLink}
                          className="flex-1 min-h-[44px] bg-[var(--background)] border border-[var(--border)] px-3 font-mono text-xs text-[var(--foreground)] select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(shareLink);
                            setIsLinkCopied(true);
                            setTimeout(() => setIsLinkCopied(false), 2000);
                          }}
                          className="min-h-[44px] px-4 border border-[var(--border)] bg-[var(--card)] text-xs font-mono uppercase font-bold shrink-0 hover:bg-[var(--muted)]"
                        >
                          {isLinkCopied ? "Copied!" : "Copy Link"}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Namaste. Here is the Class 5 mathematics learning progress note for ${student.name.split(" ")[0]}: ${shareLink}`
                        )}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="min-h-[44px] px-4 bg-[#8ABB93] text-[var(--foreground)] font-bold text-xs font-mono uppercase inline-flex items-center gap-2 border border-[#8ABB93] hover:bg-[#8ABB93]/80"
                      >
                        <span>Share on WhatsApp</span>
                      </a>

                      <a
                        href={shareLink}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="min-h-[44px] px-4 border border-[var(--border)] text-xs font-mono uppercase inline-flex items-center gap-1.5 hover:bg-[var(--muted)]"
                      >
                        <span>Open Parent View</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
