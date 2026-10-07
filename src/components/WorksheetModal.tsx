"use client";

import React from "react";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

  // Generate 8-10 deterministic practice items
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-8 rounded-2xl bg-white text-zinc-900 print:p-0 print:m-0 print:max-w-none">
        {/* Actions bar (hidden on print) */}
        <div className="flex items-center justify-between pb-6 border-b print:hidden">
          <div>
            <h3 className="font-bold text-lg">Targeted Remediation Worksheet</h3>
            <p className="text-xs text-zinc-500">Ready to print for classroom or home practice</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold">
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </Button>
            <Button variant="ghost" onClick={onClose} size="icon">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Printable Worksheet Document */}
        <div className="space-y-6 pt-4">
          {/* Header */}
          <div className="border-b-2 border-zinc-900 pb-4 text-center space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-600">
              PM SHRI GOVT PRIMARY SCHOOL • HYDERABAD
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              ShikshaGap Remediation Worksheet
            </h1>
            <p className="text-sm font-semibold text-blue-700">
              Focus Concept: {t(`c_${rootId}`)}
            </p>
          </div>

          {/* Student metadata box */}
          <div className="grid grid-cols-3 gap-4 border p-3 rounded-lg text-sm font-medium bg-zinc-50 print:bg-transparent">
            <div>
              <span className="text-zinc-500">Student Name:</span>{" "}
              <strong className="text-zinc-900">{student.name}</strong>
            </div>
            <div>
              <span className="text-zinc-500">Roll No:</span>{" "}
              <strong className="text-zinc-900">#{student.rollNo}</strong>
            </div>
            <div className="text-right">
              <span className="text-zinc-500">Date:</span> ______________
            </div>
          </div>

          {/* Practice Questions */}
          <div className="space-y-6 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Instructions: Solve each problem showing your working steps clearly.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="border border-zinc-300 rounded-xl p-4 min-h-[140px] flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-400 font-mono">Q{idx + 1}.</span>
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatTxt(q.prompt)}
                    </p>
                    {q.expression && (
                      <div className="text-center py-2 font-mono text-xl font-bold text-blue-900">
                        {q.expression}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-dashed pt-2 mt-4 flex items-center justify-between text-xs text-zinc-400">
                    <span>Working area:</span>
                    <span>Answer: ____________</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t text-xs text-zinc-500 flex items-center justify-between">
            <span>Teacher Signature: ______________________</span>
            <span>Marks: _____ / {questions.length}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
