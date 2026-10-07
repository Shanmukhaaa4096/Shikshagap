"use client";

import React from "react";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Printer, X } from "lucide-react";
import { generateQuestion } from "@/lib/questions/generator";
import { makeRng } from "@/lib/rng";

interface Props {
  data: DemoStudentData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WorksheetModal({ data, isOpen, onClose }: Props) {
  const { dict, t, formatTxt } = useI18n();

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
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-xl bg-white text-[#171717] border-[1.5px] border-[#172033] shadow-[4px_5px_0px_#172033] print:p-0 print:m-0 print:max-w-none print:border-none print:shadow-none">
        {/* Actions bar (hidden during print) */}
        <div className="flex items-center justify-between pb-5 border-b-[1.5px] border-[#172033]/20 print:hidden">
          <div>
            <span className="editorial-meta text-[#3156D3]">OFFICIAL REMEDIATION RESOURCE</span>
            <h3 className="editorial-title text-xl text-[#171717] mt-0.5">
              Printable Remediation Handout
            </h3>
            <p className="text-xs text-[#64748B]">
              Generated for classroom intervention or offline practice at home.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="neo-btn neo-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-blue-300" />
              <span>PRINT / EXPORT PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[#172033]/20 hover:bg-[#F7F6F2] transition-colors"
            >
              <X className="w-4 h-4 text-[#171717]" />
            </button>
          </div>
        </div>

        {/* Printable Worksheet Document */}
        <div className="space-y-6 pt-4">
          {/* Header Masthead */}
          <div className="border-b-[2px] border-[#172033] pb-4 text-center space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
              GOVT PRIMARY SCHOOL • PM SHRI CLASS 5A
            </div>
            <h1 className="editorial-title text-2xl sm:text-3xl font-black uppercase text-[#171717]">
              ShikshaGap Remediation Worksheet
            </h1>
            <p className="text-xs font-mono font-bold text-[#3156D3]">
              Target Prerequisite Skill: {t(`c_${rootId}`)}
            </p>
          </div>

          {/* Student metadata box */}
          <div className="grid grid-cols-3 gap-3 border-[1.5px] border-[#172033] p-3 rounded-lg text-xs font-medium bg-[#F7F6F2] print:bg-transparent">
            <div>
              <span className="text-[#64748B] font-mono">STUDENT:</span>{" "}
              <strong className="text-[#171717] font-bold text-sm block sm:inline">{student.name}</strong>
            </div>
            <div>
              <span className="text-[#64748B] font-mono">ROLL NO:</span>{" "}
              <strong className="text-[#171717] font-bold text-sm block sm:inline">#{student.rollNo}</strong>
            </div>
            <div className="text-right">
              <span className="text-[#64748B] font-mono">DATE:</span>{" "}
              <span className="text-[#171717] font-mono font-semibold">{currentDateStr}</span>
            </div>
          </div>

          {/* Practice Questions */}
          <div className="space-y-4 pt-1">
            <div className="editorial-meta text-[#64748B]">
              INSTRUCTIONS: Solve each problem showing your calculation or reasoning steps clearly.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="border-[1.5px] border-[#172033]/40 rounded-lg p-3.5 min-h-[140px] flex flex-col justify-between bg-white"
                >
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold font-mono text-[#64748B]">
                      ITEM {idx + 1}.
                    </span>
                    <p className="text-xs font-semibold text-[#171717]">
                      {formatTxt(q.prompt)}
                    </p>
                    {q.expression && (
                      <div className="text-center py-2 font-mono text-xl font-extrabold text-[#172033] bg-[#F7F6F2] rounded border border-[#172033]/15">
                        {q.expression}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-dashed border-[#172033]/30 pt-2 mt-3 flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>Working Area:</span>
                    <span className="font-mono">Answer: _________</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer with sign-off */}
          <div className="pt-6 border-t-[1.5px] border-[#172033]/20 text-xs text-[#64748B] flex items-center justify-between font-mono">
            <span>Teacher Signature: ______________________</span>
            <span>Score: _____ / {questions.length}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
