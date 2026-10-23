"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Printer, X } from "@phosphor-icons/react";
import { getClassConfig } from "@/lib/curriculum/classes";
import {
  generateWorksheet,
  type Language,
  type Board,
  type GeneratedWorksheet,
} from "@/lib/questions/worksheetGenerator";

interface Props {
  data: DemoStudentData | null;
  isOpen: boolean;
  onClose: () => void;
  targetClass?: number;
  targetBoard?: Board;
  targetLanguage?: Language;
  targetSkill?: string;
  excludeIds?: string[];
}

export function WorksheetModal({
  data,
  isOpen,
  onClose,
  targetClass,
  targetBoard,
  targetLanguage,
  targetSkill,
  excludeIds,
}: Props) {
  const { lang, t } = useI18n();

  const student = data?.student;
  const profile = data?.profile;

  const effectiveGrade = (() => {
    if (targetClass && targetClass >= 1 && targetClass <= 10) return targetClass;
    if (student?.classroomId) {
      try {
        return getClassConfig(student.classroomId).grade;
      } catch {
        return 5;
      }
    }
    return 5;
  })();

  const effectiveBoard: Board = targetBoard || "CBSE";
  const effectiveLang: Language = (targetLanguage || (lang as Language) || "en");

  const diagnosedGap = useMemo(() => {
    if (!profile?.rootCauses || profile.rootCauses.length === 0) return undefined;
    const rc = profile.rootCauses[0];
    if (!rc?.rootId) return undefined;
    return {
      rootId: rc.rootId,
      title: t(`c_${rc.rootId}`) || rc.rootId,
      fromGrade: (rc as { grade?: number }).grade || Math.max(1, effectiveGrade - 2),
    };
  }, [profile?.rootCauses, t, effectiveGrade]);

  const initialWorksheet = useMemo(() => {
    return generateWorksheet({
      classNum: effectiveGrade,
      board: effectiveBoard,
      skillOrTopic: targetSkill,
      targetSkill,
      language: effectiveLang,
      count: 10,
      diagnosedGap,
      excludeIds,
      seed: 20261023 + (student?.rollNo || 1),
    });
  }, [effectiveGrade, effectiveBoard, effectiveLang, diagnosedGap, student?.rollNo, targetSkill, excludeIds]);

  const [serverWorksheet, setServerWorksheet] = useState<GeneratedWorksheet | null>(null);

  const worksheet = serverWorksheet || initialWorksheet;

  // Asynchronously query question_memory from server route
  useEffect(() => {
    if (!isOpen || !data) {
      return;
    }

    let cancelled = false;
    async function fetchServerWorksheet() {
      try {
        const res = await fetch("/api/worksheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classNum: effectiveGrade,
            board: effectiveBoard,
            skill: targetSkill,
            language: effectiveLang,
            count: 10,
            diagnosedGap,
            excludeIds,
            seed: 20261023 + (student?.rollNo || 1),
          }),
        });

        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled && body.success && body.worksheet) {
          setServerWorksheet(body.worksheet);
        }
      } catch {
        // Fail gracefully to local deterministic worksheet
      }
    }

    fetchServerWorksheet();
    return () => {
      cancelled = true;
    };
  }, [isOpen, data, effectiveGrade, effectiveBoard, targetSkill, effectiveLang, diagnosedGap, excludeIds, student?.rollNo]);

  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl xl:max-w-5xl 2xl:max-w-6xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 lg:p-8 rounded-[2px] bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] print:p-0 print:m-0 print:max-w-none print:border-none print:max-h-none print:overflow-visible">
        {/* Actions bar (hidden during print) */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] print:hidden">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
              PRACTICE MATERIAL
            </div>
            <h3 className="font-serif text-lg font-bold text-[var(--foreground)] mt-0.5">
              Printable Practice Sheet
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Structured single-page A4 classroom worksheet with teacher answer key.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[44px] px-3.5 py-2 text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[2px] border border-[var(--primary)] flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer size={16} />
              <span>Print Worksheet</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center rounded-[2px] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer"
              aria-label="Close worksheet"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Page 1: Student Practice Sheet (Fits on 1 A4 Page) */}
        <div className="space-y-4 pt-3 print:pt-0 print:text-xs">
          {/* Header Masthead */}
          <div className="border-b-2 border-[var(--foreground)] pb-2.5 text-center space-y-0.5">
            <div className="text-xs font-mono font-bold tracking-wider text-[var(--muted-foreground)]">
              {worksheet.header.title}
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold uppercase text-[var(--foreground)]">
              Mathematics Practice Worksheet
            </h1>
            <p className="text-xs font-mono font-semibold text-[var(--primary)]">
              {worksheet.header.skillsLine}
            </p>
          </div>

          {/* Student metadata box */}
          <div className="grid grid-cols-3 gap-2 border border-[var(--border)] p-2 rounded-[2px] text-xs bg-[var(--card)] print:bg-transparent">
            <div>
              <span className="text-[var(--muted-foreground)] font-mono">STUDENT:</span>{" "}
              <strong className="text-[var(--foreground)] font-bold">{student?.name || "Student"}</strong>
            </div>
            <div>
              <span className="text-[var(--muted-foreground)] font-mono">ROLL NO:</span>{" "}
              <strong className="text-[var(--foreground)] font-bold">#{student?.rollNo || "01"}</strong>
            </div>
            <div className="text-right">
              <span className="text-[var(--muted-foreground)] font-mono">DATE:</span>{" "}
              <span className="text-[var(--foreground)] font-mono font-semibold">{worksheet.header.dateStr}</span>
            </div>
          </div>

          {/* Section A: Warm-up Banner */}
          <div className="bg-[var(--muted)]/50 px-2 py-1 rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted-foreground)] border-l-2 border-[var(--primary)]">
            {worksheet.warmupSection.title}
          </div>

          {/* Warm-up Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:grid-cols-2 print:gap-2">
            {worksheet.warmupSection.items.map((q) => (
              <div
                key={q.number}
                className="border border-[var(--border)] rounded-[2px] p-2.5 flex flex-col justify-between bg-[var(--card)] print:bg-transparent min-h-[90px]"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--muted-foreground)]">
                    <span className="font-bold">PROBLEM {q.number}</span>
                    <span className="text-xs uppercase font-semibold text-[var(--primary)]">{q.topic}</span>
                  </div>
                  <p className="text-xs font-medium text-[var(--foreground)] leading-snug">
                    {q.prompt}
                  </p>
                  {q.expression && (
                    <div className="text-center py-1 font-mono text-sm font-bold text-[var(--foreground)] bg-[var(--background)] rounded-[2px] border border-[var(--border)]">
                      {q.expression}
                    </div>
                  )}
                </div>
                <div className="border-t border-dashed border-[var(--border)] pt-1 mt-1.5 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span>Working:</span>
                  <span className="font-mono">Ans: _________</span>
                </div>
              </div>
            ))}
          </div>

          {/* Section B: Class Practice Banner */}
          <div className="bg-[var(--muted)]/50 px-2 py-1 rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted-foreground)] border-l-2 border-[var(--primary)] mt-3">
            {worksheet.practiceSection.title}
          </div>

          {/* Practice & Challenge Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:grid-cols-2 print:gap-2">
            {[...worksheet.practiceSection.items, ...worksheet.challengeSection.items].map((q) => (
              <div
                key={q.number}
                className="border border-[var(--border)] rounded-[2px] p-2.5 flex flex-col justify-between bg-[var(--card)] print:bg-transparent min-h-[90px]"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--muted-foreground)]">
                    <span className="font-bold">
                      PROBLEM {q.number} {q.section === "challenge" ? "(CHALLENGE)" : ""}
                    </span>
                    <span className="text-xs uppercase font-semibold text-[var(--primary)]">{q.topic}</span>
                  </div>
                  <p className="text-xs font-medium text-[var(--foreground)] leading-snug">
                    {q.prompt}
                  </p>
                  {q.expression && (
                    <div className="text-center py-1 font-mono text-sm font-bold text-[var(--foreground)] bg-[var(--background)] rounded-[2px] border border-[var(--border)]">
                      {q.expression}
                    </div>
                  )}
                </div>
                <div className="border-t border-dashed border-[var(--border)] pt-1 mt-1.5 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span>Working:</span>
                  <span className="font-mono">Ans: _________</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer sign-off for Page 1 */}
          <div className="pt-3 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)] flex items-center justify-between font-mono">
            <span>Teacher Signature: ______________________</span>
            <span>Score: _____ / {worksheet.items.length}</span>
          </div>
        </div>

        {/* Page 2: Teacher Copy / Answer Key (Breaks to Page 2 on Print) */}
        <div className="mt-8 pt-6 border-t-2 border-dashed border-[var(--border)] print:break-before-page print:mt-0 print:pt-4">
          <div className="border-b border-[var(--foreground)] pb-2 mb-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--primary)]">
              CONFIDENTIAL TEACHER COPY
            </div>
            <h2 className="font-serif text-lg font-bold text-[var(--foreground)]">
              Answer Key and Verification Guide
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] font-mono">
              Worksheet: {worksheet.header.title} | Total Questions: {worksheet.items.length}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[var(--border)]">
              <thead className="bg-[var(--muted)]/50 font-mono text-xs uppercase">
                <tr>
                  <th className="p-2 border-b border-r border-[var(--border)]">#</th>
                  <th className="p-2 border-b border-r border-[var(--border)]">Section</th>
                  <th className="p-2 border-b border-r border-[var(--border)]">Skill / Topic</th>
                  <th className="p-2 border-b border-r border-[var(--border)]">Question</th>
                  <th className="p-2 border-b border-r border-[var(--border)] font-bold text-[var(--primary)]">Correct Answer</th>
                  <th className="p-2 border-b border-[var(--border)]">Pedagogical Solution Steps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-sans">
                {worksheet.answerKey.map((ans) => (
                  <tr key={ans.number} className="hover:bg-[var(--muted)]/20">
                    <td className="p-2 border-r border-[var(--border)] font-mono font-bold text-center">
                      {ans.number}
                    </td>
                    <td className="p-2 border-r border-[var(--border)] font-mono text-xs">
                      {ans.section}
                    </td>
                    <td className="p-2 border-r border-[var(--border)] font-semibold text-xs">
                      {ans.topic}
                    </td>
                    <td className="p-2 border-r border-[var(--border)] font-mono text-xs max-w-[180px] truncate">
                      {ans.questionSummary}
                    </td>
                    <td className="p-2 border-r border-[var(--border)] font-mono font-bold text-[var(--primary)] text-xs">
                      {ans.correctAnswer}
                    </td>
                    <td className="p-2 text-xs text-[var(--muted-foreground)]">
                      {ans.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)] font-mono flex items-center justify-between">
            <span>Generated and verified by code - ShikshaGap Assessment Platform</span>
            <span>Document ID: SG-WS-A4-2026</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
