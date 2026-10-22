"use client";

import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { getClassConfig } from "@/lib/curriculum/classes";
import { ArrowRight, WarningCircle } from "@phosphor-icons/react";
import { FlowerPetal, BotanicalLeaf, WarmSparkle } from "@/components/illustrations/FloralMotifs";

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
        <div className="bg-[#FFF7E6] dark:bg-[#1C2817] border-2 border-[#C7DDAE] rounded-[28px] p-8 space-y-4 shadow-card">
          <div className="h-8 bg-[#C7DDAE]/40 rounded-full animate-pulse w-2/3 mx-auto" />
          <div className="h-4 bg-[#C7DDAE]/30 rounded-full animate-pulse w-1/2 mx-auto" />
          <div className="h-24 bg-[#C7DDAE]/20 rounded-[20px] animate-pulse w-full mt-6" />
        </div>
        <p className="font-heading text-base font-bold text-foreground">
          {lang === "hi"
            ? "सीखने का विवरण लोड हो रहा है..."
            : lang === "te"
            ? "పాఠ్యాంశాల వివరాలు లోడ్ అవుతున్నాయి..."
            : "Unwrapping your learning journey..."}
        </p>
      </div>
    );
  }

  // 2. Error State
  if (isError || !studentData) {
    return (
      <div className="w-full max-w-xl mx-auto py-8 sm:py-12 px-4 space-y-6 text-center">
        <div className="bg-[#FFF7E6] dark:bg-[#1C2817] border-2 border-accent/40 rounded-[28px] p-8 space-y-4 shadow-card">
          <div className="w-14 h-14 mx-auto rounded-full bg-accent/20 border border-accent flex items-center justify-center text-accent">
            <WarningCircle size={32} weight="bold" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {lang === "hi"
              ? "विद्यार्थी की जानकारी नहीं मिल सकी"
              : lang === "te"
              ? "విద్యార్థి సమాచారం లోడ్ కాలేదు"
              : "Could not load student information"}
          </h2>
          <p className="text-sm text-foreground/80 font-sans">
            {lang === "hi"
              ? "कृपया दोबारा प्रयास करें।"
              : lang === "te"
              ? "దయచేసి మళ్ళీ ప్రయత్నించండి."
              : "Please check your connection and give it another try."}
          </p>
          {onRetry && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onRetry}
                className="rounded-full min-h-[48px] px-8 text-sm font-bold bg-primary text-primary-foreground shadow-warm hover:bg-primary/90 transition-transform active:scale-95"
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
      <div className="bg-[#FFF7E6] dark:bg-[#1C2817] border-2 border-[#C7DDAE] rounded-[28px] p-6 sm:p-8 space-y-2 text-center shadow-card relative overflow-hidden">
        <div className="absolute top-3 right-4 opacity-30 pointer-events-none">
          <FlowerPetal size={36} />
        </div>
        <span className="text-xs font-sans uppercase tracking-wider font-bold text-primary flex items-center justify-center gap-1.5">
          <BotanicalLeaf size={14} /> {getClassConfig(student.classroomId || "class_5").label} Mathematics
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
          {greetingWord}, {student.name}!
        </h1>
        <p className="text-base sm:text-lg text-foreground/80 leading-relaxed max-w-md mx-auto font-sans">
          {encouragingTitle}
        </p>
      </div>

      {/* 2. Today's Practice (Primary Action) */}
      <div className="bg-[#FFF7E6] dark:bg-[#1C2817] border-2 border-[#C7DDAE] rounded-[28px] p-6 sm:p-8 space-y-6 shadow-card">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-sans font-bold uppercase text-primary">
            <span className="flex items-center gap-1">
              <WarmSparkle size={13} /> {dict.todaysPractice || "Today's Practice"}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C7DDAE]/30 text-foreground">15 min</span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
            {targetConceptName}
          </h2>
          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans">
            Fun and simple math exercises designed just for you today.
          </p>
        </div>

        {/* Primary Marigold Action Button */}
        <button
          type="button"
          onClick={() => onStartPractice(targetConcept)}
          className="w-full min-h-[56px] py-4 px-6 bg-accent text-accent-foreground font-heading text-lg font-bold rounded-full shadow-warm flex items-center justify-center gap-3 hover:bg-accent/90 transition-transform active:scale-98"
        >
          <span>{dict.startPractice || "Start Today's Practice"}</span>
          <ArrowRight size={22} weight="bold" />
        </button>

        {/* Simple Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-[#C7DDAE]/50">
          <div className="flex items-center justify-between text-xs font-sans text-muted-foreground">
            <span>Skill Progress</span>
            <span className="font-bold text-primary">Step {completedSteps} of {totalSteps}</span>
          </div>
          <div className="w-full bg-[#C7DDAE]/30 h-3 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Take Assessment (Secondary Outline Button) */}
      <div className="bg-[#FFF7E6] dark:bg-[#1C2817] border-2 border-[#C7DDAE] rounded-[24px] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-warm">
        <div className="space-y-0.5 text-center sm:text-left">
          <h3 className="font-heading text-base sm:text-lg font-bold text-foreground">
            {dict.takeAssessment || "Take assessment"}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans">
            Check your progress anytime with a quick check.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onTakeAssessment(student.id, targetConcept)}
          className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 bg-primary text-primary-foreground font-sans text-xs font-bold uppercase rounded-full shadow-warm hover:bg-primary/90 shrink-0 transition-transform active:scale-95"
        >
          {dict.takeAssessment || "Take assessment"}
        </button>
      </div>
    </div>
  );
}
