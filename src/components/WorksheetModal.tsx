"use client";

import React from "react";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Printer, X } from "@phosphor-icons/react";
import { generateQuestion } from "@/lib/questions/generator";
import { makeRng } from "@/lib/rng";

interface Props {
  data: DemoStudentData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WorksheetModal({ data, isOpen, onClose }: Props) {
  const { t, formatTxt } = useI18n();

  if (!data) return null;

  const { student, profile } = data;
  const rootId = profile.rootCauses[0]?.rootId || "mult_facts";

  // Generate 6 deterministic practice items for this student's root cause
  const rng = makeRng(12345 + student.rollNo);
  const questions = [
    generateQuestion(rootId, 1, rng),
    generateQuestion(rootId, 1, rng),
    generateQuestion(rootId, 2, rng),
    generateQuestion(rootId, 2, rng),
    generateQuestion(rootId, 2, rng),
    generateQuestion(rootId, 3, rng),
  ];

  const handlePrint = () => {
    window.print();
  };

  const currentDateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-[2px] bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] print:p-0 print:m-0 print:max-w-none print:border-none">
        {/* Actions bar (hidden during print) */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] print:hidden">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
              REMEDIATION MATERIAL
            </div>
            <h3 className="font-serif text-lg font-bold text-[var(--foreground)] mt-0.5">
              Printable Remediation Handout
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Designed for classroom intervention or offline practice at home.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[2px] border border-[var(--primary)] flex items-center gap-1.5"
            >
              <Printer size={14} />
              <span>Print Worksheet</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[2px] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
              aria-label="Close worksheet"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Printable Worksheet Document */}
        <div className="space-y-6 pt-4">
          {/* Header Masthead */}
          <div className="border-b border-[var(--foreground)] pb-4 text-center space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
              ELEMENTARY MATHEMATICS DIAGNOSTIC | CLASS 5 SECTION A
            </div>
            <h1 className="font-serif text-2xl font-bold uppercase text-[var(--foreground)]">
              Targeted Remediation Worksheet
            </h1>
            <p className="text-xs font-mono font-semibold text-[var(--primary)]">
              Target Skill: {t(`c_${rootId}`)}
            </p>
          </div>

          {/* Student metadata box */}
          <div className="grid grid-cols-3 gap-3 border border-[var(--border)] p-3 rounded-[2px] text-xs bg-[var(--card)] print:bg-transparent">
            <div>
              <span className="text-[var(--muted-foreground)] font-mono">STUDENT:</span>{" "}
              <strong className="text-[var(--foreground)] font-bold text-sm block sm:inline">
                {student.name}
              </strong>
            </div>
            <div>
              <span className="text-[var(--muted-foreground)] font-mono">ROLL NO:</span>{" "}
              <strong className="text-[var(--foreground)] font-bold text-sm block sm:inline">
                #{student.rollNo}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-[var(--muted-foreground)] font-mono">DATE:</span>{" "}
              <span className="text-[var(--foreground)] font-mono font-semibold">{currentDateStr}</span>
            </div>
          </div>

          {/* Practice Questions */}
          <div className="space-y-4 pt-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
              INSTRUCTIONS: Solve each problem showing your calculation or reasoning steps clearly.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="border border-[var(--border)] rounded-[2px] p-3.5 min-h-[140px] flex flex-col justify-between bg-[var(--card)] print:bg-transparent"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold font-mono text-[var(--muted-foreground)]">
                      PROBLEM {idx + 1}
                    </span>
                    <p className="text-xs font-semibold text-[var(--foreground)]">
                      {formatTxt(q.prompt)}
                    </p>
                    {q.expression && (
                      <div className="text-center py-2 font-mono text-xl font-bold text-[var(--foreground)] bg-[var(--background)] rounded-[2px] border border-[var(--border)]">
                        {q.expression}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-dashed border-[var(--border)] pt-2 mt-3 flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
                    <span>Working Area:</span>
                    <span className="font-mono">Answer: _________</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer with sign-off */}
          <div className="pt-6 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)] flex items-center justify-between font-mono">
            <span>Teacher Signature: ______________________</span>
            <span>Score: _____ / {questions.length}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
