"use client";

import React, { useState } from "react";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { ArrowRight, BookOpen, CheckCircle, Sparkle } from "@phosphor-icons/react";

interface Props {
  studentData: DemoStudentData;
  onStartPractice: (conceptId: string) => void;
  onTakeAssessment: (studentId: string, conceptId: string) => void;
}

export function StudentHome({
  studentData,
  onStartPractice,
  onTakeAssessment,
}: Props) {
  const { dict, t, lang } = useI18n();
  const { student, profile, activePlan } = studentData;

  const rootCause = profile.rootCauses[0];
  const targetConcept = rootCause?.rootId || "mult_facts";
  const targetConceptName = t(`c_${targetConcept}`) || "Multiplication Tables";

  // Friendly encouraging title
  const encouragingTitle =
    lang === "hi"
      ? `आइए ${targetConceptName} का अभ्यास करें`
      : lang === "te"
      ? `రండి ${targetConceptName} సాధన చేద్దాం`
      : `Let's practise ${targetConceptName}`;

  // Greeting in current language
  const greetingWord =
    lang === "hi" ? "नमस्ते" : lang === "te" ? "నమస్కారం" : "Namaste";

  // Completed steps calculation for child
  const completedSteps = activePlan ? 2 : 1;
  const totalSteps = 5;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="w-full max-w-xl mx-auto py-6 sm:py-10 px-4 space-y-6">
      {/* 1. Welcoming Greeting Card */}
      <div className="bg-[#FAF8E8] dark:bg-[#381f1c] border border-[#432623]/25 dark:border-[#F5F1BC]/25 rounded-[2px] p-6 sm:p-8 space-y-2 text-center">
        <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#432623]/70 dark:text-[#F5F1BC]/70 block">
          Class 5 Mathematics
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-[#432623] dark:text-[#F5F1BC]">
          {greetingWord}, {student.name}!
        </h1>
        <p className="text-base sm:text-lg text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed max-w-md mx-auto">
          {encouragingTitle}
        </p>
      </div>

      {/* 2. Today's Practice (Primary Action) */}
      <div className="bg-[#FAF8E8] dark:bg-[#381f1c] border border-[#432623]/25 dark:border-[#F5F1BC]/25 rounded-[2px] p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-[#432623]/70 dark:text-[#F5F1BC]/70">
            <span>{dict.todaysPractice || "Today's Practice"}</span>
            <span>15 min</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#432623] dark:text-[#F5F1BC]">
            {targetConceptName}
          </h2>
          <p className="text-sm text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
            Fun and simple math exercises designed just for you today.
          </p>
        </div>

        {/* Big Primary Red Action Button */}
        <button
          type="button"
          onClick={() => onStartPractice(targetConcept)}
          className="w-full min-h-[56px] py-4 px-6 bg-[#DE2A35] text-[#F5F1BC] font-serif text-lg font-bold rounded-[2px] border border-[#DE2A35] flex items-center justify-center gap-3 transition-none hover:bg-[#c2202a]"
        >
          <span>{dict.startPractice || "Start Today's Practice"}</span>
          <ArrowRight size={22} weight="bold" />
        </button>

        {/* Simple Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-[#432623]/15 dark:border-[#F5F1BC]/15">
          <div className="flex items-center justify-between text-xs font-mono text-[#432623]/75 dark:text-[#F5F1BC]/75">
            <span>Skill Progress</span>
            <span className="font-bold">Step {completedSteps} of {totalSteps}</span>
          </div>
          <div className="w-full bg-[#432623]/15 dark:bg-[#F5F1BC]/15 h-3 rounded-[2px] overflow-hidden">
            <div
              className="bg-[#8ABB93] h-full rounded-[2px]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Take Assessment (Secondary Outline Button) */}
      <div className="bg-[#FAF8E8] dark:bg-[#381f1c] border border-[#432623]/25 dark:border-[#F5F1BC]/25 rounded-[2px] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-center sm:text-left">
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#432623] dark:text-[#F5F1BC]">
            {dict.takeAssessment || "Take assessment"}
          </h3>
          <p className="text-xs sm:text-sm text-[#432623]/75 dark:text-[#F5F1BC]/75">
            Check your progress anytime with a quick check.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onTakeAssessment(student.id, targetConcept)}
          className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 bg-transparent text-[#432623] dark:text-[#F5F1BC] font-mono text-sm font-bold uppercase rounded-[2px] border border-[#432623]/40 dark:border-[#F5F1BC]/40 hover:bg-[#432623]/5 dark:hover:bg-[#F5F1BC]/5 shrink-0"
        >
          {dict.takeAssessment || "Take assessment"}
        </button>
      </div>
    </div>
  );
}
