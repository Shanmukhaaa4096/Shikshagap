"use client";

import React from "react";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { ArrowRight, WarningCircle } from "@phosphor-icons/react";

interface Props {
  studentData?: DemoStudentData | null;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onStartPractice: (conceptId: string) => void;
  onTakeAssessment: (studentId: string, conceptId: string) => void;
}

export function StudentHome({
  studentData,
  isLoading = false,
  isError = false,
  onRetry,
  onStartPractice,
  onTakeAssessment,
}: Props) {
  const { dict, t, lang } = useI18n();

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="w-full max-w-xl mx-auto py-8 sm:py-12 px-4 space-y-6 text-center">
        <div className="bg-card dark:bg-card border border-border rounded-[2px] p-8 space-y-4">
          <div className="h-8 bg-muted rounded-[2px] animate-pulse w-2/3 mx-auto" />
          <div className="h-4 bg-muted rounded-[2px] animate-pulse w-1/2 mx-auto" />
          <div className="h-24 bg-muted rounded-[2px] animate-pulse w-full mt-6" />
        </div>
        <p className="font-serif text-base font-bold text-foreground">
          {lang === "hi"
            ? "सीखने का विवरण लोड हो रहा है..."
            : lang === "te"
            ? "పాఠ్యాంశాల వివరాలు లోడ్ అవుతున్నాయి..."
            : "Loading your learning details..."}
        </p>
      </div>
    );
  }

  // 2. Error State
  if (isError || !studentData) {
    return (
      <div className="w-full max-w-xl mx-auto py-8 sm:py-12 px-4 space-y-6 text-center">
        <div className="bg-card dark:bg-card border border-primary/40 rounded-[2px] p-8 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-card border border-primary flex items-center justify-center text-primary">
            <WarningCircle size={28} weight="bold" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground">
            {lang === "hi"
              ? "विद्यार्थी की जानकारी नहीं मिल सकी"
              : lang === "te"
              ? "విద్యార్థి సమాచారం లోడ్ కాలేదు"
              : "Could not load student information"}
          </h2>
          <p className="text-base text-foreground/80 dark:text-muted-foreground">
            {lang === "hi"
              ? "कृपया दोबारा प्रयास करें।"
              : lang === "te"
              ? "దయచేసి మళ్ళీ ప్రయత్నించండి."
              : "Please check your network and try again."}
          </p>
          {onRetry && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onRetry}
                className="neo-btn neo-btn-primary min-h-[48px] px-8 text-base font-bold rounded-[2px]"
              >
                {lang === "hi" ? "फिर से कोशिश करें" : lang === "te" ? "మళ్ళీ ప్రయత్నించండి" : "Try Again"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

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
      <div className="bg-card dark:bg-card border border-border rounded-[2px] p-6 sm:p-8 space-y-2 text-center">
        <span className="font-mono text-sm uppercase tracking-wider font-bold text-muted-foreground dark:text-muted-foreground block">
          Class 5 Mathematics
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-foreground">
          {greetingWord}, {student.name}!
        </h1>
        <p className="text-base sm:text-lg text-foreground/80 dark:text-muted-foreground leading-relaxed max-w-md mx-auto">
          {encouragingTitle}
        </p>
      </div>

      {/* 2. Today's Practice (Primary Action) */}
      <div className="bg-card dark:bg-card border border-border rounded-[2px] p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm font-mono font-bold uppercase text-muted-foreground dark:text-muted-foreground">
            <span>{dict.todaysPractice || "Today's Practice"}</span>
            <span>15 min</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            {targetConceptName}
          </h2>
          <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed">
            Fun and simple math exercises designed just for you today.
          </p>
        </div>

        {/* Big Primary Red Action Button */}
        <button
          type="button"
          onClick={() => onStartPractice(targetConcept)}
          className="w-full min-h-[56px] py-4 px-6 bg-primary text-primary-foreground font-serif text-lg font-bold rounded-[2px] border border-primary flex items-center justify-center gap-3 transition-none hover:bg-[#c2202a]"
        >
          <span>{dict.startPractice || "Start Today's Practice"}</span>
          <ArrowRight size={22} weight="bold" />
        </button>

        {/* Simple Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between text-sm font-mono text-muted-foreground dark:text-muted-foreground">
            <span>Skill Progress</span>
            <span className="font-bold">Step {completedSteps} of {totalSteps}</span>
          </div>
          <div className="w-full bg-muted dark:bg-muted h-3 rounded-[2px] overflow-hidden">
            <div
              className="bg-[var(--status-good)] h-full rounded-[2px]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Take Assessment (Secondary Outline Button) */}
      <div className="bg-card dark:bg-card border border-border rounded-[2px] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-center sm:text-left">
          <h3 className="font-serif text-base sm:text-lg font-bold text-foreground">
            {dict.takeAssessment || "Take assessment"}
          </h3>
          <p className="text-sm sm:text-sm text-muted-foreground dark:text-muted-foreground">
            Check your progress anytime with a quick check.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onTakeAssessment(student.id, targetConcept)}
          className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 bg-transparent text-foreground font-mono text-sm font-bold uppercase rounded-[2px] border border-border hover:bg-muted dark:hover:bg-muted shrink-0"
        >
          {dict.takeAssessment || "Take assessment"}
        </button>
      </div>
    </div>
  );
}
