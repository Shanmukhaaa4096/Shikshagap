import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';
import { WorksheetPreviewIllustration } from '@/components/illustrations/WorksheetPreviewIllustration';

interface Props {
  sampleQ1Expression: string;
  sampleQ2Expression: string;
}

export function LandingHowAgentWorksSection({ sampleQ1Expression, sampleQ2Expression }: Props) {
  return (
    <section id="how-agent-works" className="border-b border-border px-4 sm:px-8 py-12 max-w-7xl mx-auto bg-muted dark:bg-card">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-muted-foreground dark:text-muted-foreground">
            <span className="text-primary font-bold">03</span>
            <span>/</span>
            <span>HOW THE AI AGENT WORKS : VISUAL SAMPLES</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal mt-1 text-foreground">
            From 6-Minute Check to Actionable Gap Report
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/assessment"
            className="border-2 border-primary bg-primary text-primary-foreground px-4 py-2 min-h-[44px] inline-flex items-center text-sm font-mono uppercase font-bold hover:bg-primary cursor-pointer"
          >
            Start an Assessment Now
          </Link>
        </div>
      </div>

      {/* 2-Part Visual Specimen Grid: Gap Report Specimen & Printable Practice Worksheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Visual Specimen 1: Student Gap Report */}
        <div className="border-2 border-border bg-card p-6 shadow-sm space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div>
              <span className="text-sm font-mono uppercase tracking-wider text-primary font-bold">
                SAMPLE REPORT
              </span>
              <h3 className="font-serif text-xl font-bold">Student Gap Report</h3>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-mono px-2 py-1 bg-primary/15 text-primary border border-primary/40 font-bold">
                Class 5A : 42%
              </span>
              <span className="text-sm font-mono px-1.5 py-0.5 bg-card text-foreground/80 dark:text-muted-foreground border border-border">
                Sample data. Not a real student.
              </span>
            </div>
          </div>

          {/* Diagnosed Root Gap */}
          <div className="border border-border p-4 bg-muted dark:bg-card space-y-2">
            <div className="flex items-center justify-between text-sm font-mono">
              <span className="text-muted-foreground dark:text-muted-foreground uppercase text-sm">Student:</span>
              <strong>Rajesh Kumar (Roll #7)</strong>
            </div>
            <div className="text-sm font-mono">
              <span className="text-primary font-bold uppercase text-sm block">Diagnosed Root Cause:</span>
              <p className="font-serif text-base font-bold text-primary">
                Class 3 Subtraction Regrouping (Tens to Units Borrowing)
              </p>
            </div>
            <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed italic border-t border-border pt-2">
              &ldquo;Student attempted long division in 24 / 6 by subtracting 6 repeatedly, but subtracted the smaller ones digit from the larger digit without borrowing.&rdquo;
            </p>
          </div>

          {/* Prerequisite Backtracking Graph Trail */}
          <div className="border border-border p-3 bg-white dark:bg-card space-y-2 text-sm font-mono">
            <span className="text-sm uppercase font-bold text-muted-foreground dark:text-muted-foreground block">
              AI Agent Backtracking Trail:
            </span>
            <div className="flex items-center justify-between text-sm bg-card p-2 border border-border">
              <span className="text-primary font-bold">Class 3 Place Value</span>
              <ArrowRight size={12} className="text-primary" />
              <span className="text-primary font-bold">Class 4 Mult Facts</span>
              <ArrowRight size={12} className="text-primary" />
              <span className="text-muted-foreground dark:text-muted-foreground">Class 5 Long Division</span>
            </div>
          </div>

          {/* 5-Day Plan Summary */}
          <div className="border border-[var(--status-good-border)]/50 p-3 bg-[var(--status-good)]/10 space-y-1.5 text-sm font-mono">
            <span className="text-sm uppercase font-bold text-foreground block">
              Prescribed 5-Day Classroom Sequence:
            </span>
            <div className="text-sm text-foreground/80 dark:text-muted-foreground">
              Day 1 to 2: Physical pebble bundles for grouping. Day 3: Inverse facts on slate. Day 4 to 5: Single-sheet paper checks.
            </div>
          </div>
        </div>

        {/* Visual Specimen 2: Single-Sheet Printable Practice Worksheet */}
        <div className="border-2 border-border p-6 bg-card text-foreground rounded-[2px] shadow-sm space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div>
              <span className="text-sm font-mono uppercase tracking-wider text-muted-foreground font-bold">
                SAMPLE WORKSHEET
              </span>
              <h3 className="font-serif text-xl font-bold">1-Page Paper Worksheet</h3>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-mono px-2 py-1 bg-[var(--status-good-bg)] text-[var(--status-good)] border border-[var(--status-good-border)] font-bold">
                Standard A4 Print
              </span>
              <span className="text-sm font-mono px-1.5 py-0.5 bg-card text-foreground/80 border border-border">
                Sample data. Not a real student.
              </span>
            </div>
          </div>
          <div className="flex justify-center py-2">
            <WorksheetPreviewIllustration className="max-w-[170px]" />
          </div>

          <div className="grid grid-cols-3 gap-2 border border-border p-2 text-sm font-mono bg-muted">
            <div>STUDENT: <strong>Rajesh Kumar</strong></div>
            <div>ROLL NO: <strong>#7</strong></div>
            <div className="text-right">CLASS: <strong>5A</strong></div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
              Target Skill: Equal Sharing Division Concept
            </div>

            <div className="border border-border p-3 space-y-1 bg-white">
              <div className="text-sm font-bold font-sans">1. Solve the following problem:</div>
              <div className="text-sm font-mono font-bold">{sampleQ1Expression}</div>
              <div className="h-8 border-b border-dashed border-border flex items-end text-sm text-muted-foreground font-mono">
                Answer: _______________________
              </div>
            </div>

            <div className="border border-border p-3 space-y-1 bg-white">
              <div className="text-sm font-bold font-sans">2. Solve the following problem:</div>
              <div className="text-sm font-mono font-bold">{sampleQ2Expression}</div>
              <div className="h-8 border-b border-dashed border-border flex items-end text-sm text-muted-foreground font-mono">
                Answer: _______________________
              </div>
            </div>
          </div>

          <div className="pt-2 text-center text-sm font-mono text-muted-foreground border-t border-border">
            Deterministic Question Bank : Generated for Student Diagnosis : Form SG-A4-2026
          </div>
        </div>

      </div>
    </section>
  );
}
