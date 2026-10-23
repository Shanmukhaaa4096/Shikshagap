'use client';

import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';
import { WorksheetPreviewIllustration } from '@/components/illustrations/WorksheetPreviewIllustration';
import { FlowerPetal, BotanicalLeaf, WarmSparkle } from '@/components/illustrations/FloralMotifs';
import { getSampleReportData } from '@/lib/data/sampleReportData';

interface Props {
  sampleQ1Expression?: string;
  sampleQ2Expression?: string;
  sampleTargetSkillTitle?: string;
}

export function LandingHowAgentWorksSection({
  sampleQ1Expression,
  sampleQ2Expression,
  sampleTargetSkillTitle,
}: Props) {
  const sampleData = getSampleReportData();
  const q1Exp = sampleQ1Expression || sampleData.sampleWorksheet.q1.expression;
  const q2Exp = sampleQ2Expression || sampleData.sampleWorksheet.q2.expression;
  const targetSkillTitle = sampleTargetSkillTitle || sampleData.sampleWorksheet.targetSkillTitle;

  return (
    <section id="how-agent-works" className="px-4 sm:px-8 py-14 max-w-7xl mx-auto bg-[#FFF7E6] dark:bg-[#1A2615] rounded-[32px] border border-[#C7DDAE]/60 my-6 shadow-card">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#C7DDAE]/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-primary font-bold">
            <BotanicalLeaf size={16} />
            <span>03 / HOW THE AI AGENT WORKS : VISUAL SAMPLES</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl font-bold mt-1 text-foreground">
            From 6-Minute Check to Actionable Gap Report
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/assessment"
            className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 min-h-[44px] inline-flex items-center gap-1.5 text-xs font-sans uppercase font-bold hover:bg-primary/90 cursor-pointer shadow-warm transition-transform active:scale-95"
          >
            <span>Start an Assessment Now</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>

      {/* 2-Part Visual Specimen Grid: Gap Report Specimen & Printable Practice Worksheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Visual Specimen 1: Student Gap Report */}
        <div className="rounded-[28px] border-2 border-[#C7DDAE] bg-[#FFF7E6] dark:bg-[#1C2817] p-6 shadow-card space-y-4">
          <div className="border-b border-[#C7DDAE]/60 pb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-sans uppercase tracking-wider text-primary font-bold flex items-center gap-1">
                <WarmSparkle size={13} /> SAMPLE REPORT
              </span>
              <h3 className="font-heading text-xl font-bold text-foreground">Student Gap Report</h3>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-sans px-3 py-1 rounded-full bg-[#F4C542]/25 text-[#9E6000] dark:text-[#F4C542] border border-[#F4C542]/50 font-bold">
                {sampleData.student.scoreLabel}
              </span>
              <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-[#C7DDAE]/20 text-muted-foreground border border-[#C7DDAE]/40">
                {sampleData.student.badge}
              </span>
            </div>
          </div>

          {/* Diagnosed Root Gap */}
          <div className="rounded-[20px] border border-[#C7DDAE] p-4 bg-[#C7DDAE]/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="text-muted-foreground uppercase">Student:</span>
              <strong className="text-foreground">{sampleData.student.name} ({sampleData.student.rollNo})</strong>
            </div>
            <div className="text-xs font-sans">
              <span className="text-accent font-bold uppercase block">Diagnosed Root Cause:</span>
              <p className="font-heading text-base font-bold text-primary">
                {sampleData.diagnosedRootCause.title}
              </p>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed italic border-t border-[#C7DDAE]/50 pt-2">
              &ldquo;{sampleData.diagnosedRootCause.description}&rdquo;
            </p>
          </div>

          {/* Prerequisite Backtracking Graph Trail */}
          <div className="rounded-[20px] border border-[#C7DDAE] p-3.5 bg-white dark:bg-[#1A2615] space-y-2 text-xs font-sans">
            <span className="uppercase font-bold text-primary flex items-center gap-1">
              <FlowerPetal size={13} /> AI Agent Backtracking Trail:
            </span>
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs bg-[#FFF7E6] dark:bg-[#1C2817] p-2.5 rounded-[14px] border border-[#C7DDAE]/60">
              {sampleData.backtrackingTrail.map((node, i) => (
                <div key={node.id} className="flex items-center gap-1">
                  <span className={node.isRootCause ? "text-primary font-bold" : "text-muted-foreground font-semibold"}>
                    {node.label}
                  </span>
                  {i < sampleData.backtrackingTrail.length - 1 && (
                    <ArrowRight size={13} weight="bold" className="text-accent shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 5-Day Plan Summary */}
          <div className="rounded-[20px] border border-[#6CA24A]/40 p-4 bg-[#C7DDAE]/30 space-y-1.5 text-xs font-sans">
            <span className="uppercase font-bold text-foreground block">
              Prescribed 5-Day Classroom Sequence:
            </span>
            <div className="text-foreground/80 leading-relaxed">
              {sampleData.fiveDayPlanSummary}
            </div>
          </div>
        </div>

        {/* Visual Specimen 2: Single-Sheet Printable Practice Worksheet */}
        <div className="rounded-[28px] border-2 border-[#C7DDAE] p-6 bg-[#FFF7E6] dark:bg-[#1C2817] text-foreground shadow-card space-y-4">
          <div className="border-b border-[#C7DDAE]/60 pb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                <FlowerPetal size={13} /> SAMPLE WORKSHEET
              </span>
              <h3 className="font-heading text-xl font-bold">1-Page Paper Worksheet</h3>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-sans px-3 py-1 rounded-full bg-[#C7DDAE]/40 text-primary border border-[#6CA24A]/40 font-bold">
                Standard A4 Print
              </span>
              <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-[#C7DDAE]/20 text-muted-foreground border border-[#C7DDAE]/40">
                {sampleData.student.badge}
              </span>
            </div>
          </div>
          <div className="flex justify-center py-2">
            <WorksheetPreviewIllustration className="max-w-[170px]" />
          </div>

          <div className="grid grid-cols-3 gap-2 border border-[#C7DDAE] p-2.5 rounded-[16px] text-xs font-sans bg-[#C7DDAE]/20">
            <div>STUDENT: <strong>{sampleData.student.name}</strong></div>
            <div>ROLL NO: <strong>{sampleData.student.rollNo}</strong></div>
            <div className="text-right">CLASS: <strong>{sampleData.student.classLabel}</strong></div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="text-xs font-sans uppercase tracking-wider text-primary font-bold">
              {targetSkillTitle}
            </div>

            <div className="border border-[#C7DDAE] p-3 rounded-[16px] space-y-1 bg-white dark:bg-[#1A2615]">
              <div className="text-xs font-bold font-sans">1. Solve the following problem:</div>
              <div className="text-xs font-mono font-bold text-primary">{q1Exp}</div>
              <div className="h-8 border-b border-dashed border-[#C7DDAE] flex items-end text-xs text-muted-foreground font-sans">
                Answer: _______________________
              </div>
            </div>

            <div className="border border-[#C7DDAE] p-3 rounded-[16px] space-y-1 bg-white dark:bg-[#1A2615]">
              <div className="text-xs font-bold font-sans">2. Solve the following problem:</div>
              <div className="text-xs font-mono font-bold text-primary">{q2Exp}</div>
              <div className="h-8 border-b border-dashed border-[#C7DDAE] flex items-end text-xs text-muted-foreground font-sans">
                Answer: _______________________
              </div>
            </div>
          </div>

          <div className="pt-2 text-center text-xs font-sans text-muted-foreground border-t border-[#C7DDAE]/50">
            {sampleData.sampleWorksheet.footerClaim}
          </div>
        </div>

      </div>
    </section>
  );
}
