'use client';

import { ArrowRight, ShieldCheck, Lock } from '@phosphor-icons/react';
import { 
  DagBentoIllustration, 
  LanguagesBentoIllustration, 
  WorksheetBentoIllustration, 
  PrivacyBentoIllustration 
} from '@/components/illustrations/BentoIllustrations';
import { FlowerPetal, BotanicalLeaf, WarmSparkle } from '@/components/illustrations/FloralMotifs';

export function LandingBentoSection() {
  return (
    <section className="px-4 sm:px-8 py-14 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#C7DDAE]/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-primary font-bold">
            <BotanicalLeaf size={16} />
            <span>06 / CURRICULUM ARCHITECTURE</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl font-bold mt-1 text-foreground">
            Built for Indian Government School Classrooms
          </h2>
        </div>
        <p className="text-xs sm:text-sm font-sans text-muted-foreground max-w-md">
          Engineered for multi-grade classrooms, non-English speakers, limited internet, and zero child tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tile 1: Wide */}
        <div className="md:col-span-2 rounded-[28px] border-2 border-[#C7DDAE] p-7 bg-[#FFF7E6] dark:bg-[#1C2817] flex flex-col justify-between hover:-translate-y-1 hover:shadow-warm transition-all duration-200 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="text-xs font-sans text-primary font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                <FlowerPetal size={13} /> 01 : Prerequisite Tracing Engine
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold mb-2 text-foreground">
                Traces Missing Skills Across Grade Boundaries
              </h3>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed mb-4">
                When a Class 5 student fails a long division task, the system automatically traverses backwards to check whether the breakdown began in Class 3 repeated addition or Class 4 multiplication facts.
              </p>
            </div>
            <div className="shrink-0 flex justify-center pb-2 sm:pb-0">
              <DagBentoIllustration className="w-36 h-auto" />
            </div>
          </div>
          <div className="rounded-[18px] border border-[#C7DDAE] p-3.5 bg-[#C7DDAE]/20 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-sans">
            <span className="text-muted-foreground">Class 3 Repeated Addition</span>
            <ArrowRight size={14} weight="bold" className="text-accent shrink-0" />
            <span className="text-muted-foreground">Class 4 Mult Facts</span>
            <ArrowRight size={14} weight="bold" className="text-accent shrink-0" />
            <span className="font-bold text-foreground">Class 5 Long Division</span>
          </div>
        </div>

        {/* Tile 2: Square */}
        <div className="rounded-[28px] border-2 border-[#C7DDAE] p-7 bg-[#FFF7E6] dark:bg-[#1C2817] flex flex-col justify-between hover:-translate-y-1 hover:shadow-warm transition-all duration-200 shadow-card">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-sans text-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                <WarmSparkle size={13} /> 02 : Three Regional Languages
              </span>
              <LanguagesBentoIllustration className="w-16 h-auto" />
            </div>
            <h3 className="font-heading text-xl sm:text-2xl font-bold mb-2 text-foreground">
              Native Vernacular Fluency
            </h3>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed mb-4">
              Questions, diagnostic instructions, hints, and practice sheets are completely translated for native regional language classrooms.
            </p>
          </div>
          <div className="flex gap-2 font-sans text-xs">
            <span className="px-3 py-1.5 rounded-full border border-[#C7DDAE] bg-[#C7DDAE]/20 text-foreground font-semibold">English</span>
            <span className="px-3 py-1.5 rounded-full border border-[#C7DDAE] bg-[#C7DDAE]/40 text-primary font-bold">हिन्दी</span>
            <span className="px-3 py-1.5 rounded-full border border-[#C7DDAE] bg-[#C7DDAE]/40 text-primary font-bold">తెలుగు</span>
          </div>
        </div>

        {/* Tile 3: Square */}
        <div className="rounded-[28px] border-2 border-[#C7DDAE] p-7 bg-[#FFF7E6] dark:bg-[#1C2817] flex flex-col justify-between hover:-translate-y-1 hover:shadow-warm transition-all duration-200 shadow-card">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-sans text-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                <FlowerPetal size={13} /> 03 : Printable Worksheets
              </span>
              <WorksheetBentoIllustration className="w-16 h-auto" />
            </div>
            <h3 className="font-heading text-xl sm:text-2xl font-bold mb-2 text-foreground">
              Single-Page Paper Sheets
            </h3>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed mb-4">
              Print ready-to-use worksheets for students who do not have personal smartphones or internet access at home.
            </p>
          </div>
          <div className="rounded-[16px] border border-[#C7DDAE] p-2.5 bg-[#C7DDAE]/20 text-center text-xs font-sans uppercase text-muted-foreground font-semibold">
            Standard A4 / Single Sheet Print Format
          </div>
        </div>

        {/* Tile 4: Wide */}
        <div className="md:col-span-2 rounded-[28px] border-2 border-[#C7DDAE] p-7 bg-[#FFF7E6] dark:bg-[#1C2817] flex flex-col justify-between hover:-translate-y-1 hover:shadow-warm transition-all duration-200 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="text-xs font-sans text-primary font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={14} className="text-primary" /> 04 : Child Privacy by Design
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold mb-2 text-foreground">
                Built Following DPDP Act 2023 Principles &amp; Zero Surveillance
              </h3>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed mb-4">
                Zero tracking cookies, zero third-party advertising trackers. Essential local session storage on device, with encrypted cloud storage on Supabase for teacher accounts. Children are never profiled.
              </p>
            </div>
            <div className="shrink-0 flex justify-center pb-2 sm:pb-0">
              <PrivacyBentoIllustration className="w-20 h-auto" />
            </div>
          </div>
          <div className="rounded-[18px] border border-[#C7DDAE] p-3.5 bg-[#C7DDAE]/20 flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-sans text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-foreground"><ShieldCheck size={14} className="text-[var(--status-good)]" /> Ad Cookies: 0</span>
            <span className="flex items-center gap-1 font-semibold text-foreground"><Lock size={14} className="text-[var(--status-good)]" /> Ad Trackers: 0</span>
            <span>Storage: Essential Session &amp; Secure Cloud</span>
          </div>
        </div>
      </div>

      {/* Curriculum Guides & Learning Gaps Navigation Strip */}
      <div className="mt-8 pt-8 border-t border-[#C7DDAE]/60 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-sans uppercase tracking-widest text-primary font-bold">
            Curriculum Deep-Dives by Stage (NCERT (CBSE) &amp; ICSE Aligned)
          </div>
          <a href="/learning-gaps" className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
            <span>Read: What is a Learning Gap?</span>
            <ArrowRight size={12} weight="bold" />
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
          <a
            href="/curriculum/classes-1-3"
            className="p-3.5 rounded-[18px] border border-[#C7DDAE] bg-[#FFF7E6] dark:bg-[#1C2817] hover:border-primary transition-all block group"
          >
            <span className="font-mono text-xs uppercase font-bold text-primary block">Foundational</span>
            <strong className="text-foreground group-hover:text-primary block mt-0.5">Classes 1 to 3</strong>
            <span className="text-muted-foreground text-xs block mt-0.5">Number sense &amp; grouping</span>
          </a>
          <a
            href="/curriculum/classes-4-5"
            className="p-3.5 rounded-[18px] border border-[#C7DDAE] bg-[#FFF7E6] dark:bg-[#1C2817] hover:border-primary transition-all block group"
          >
            <span className="font-mono text-xs uppercase font-bold text-primary block">Preparatory</span>
            <strong className="text-foreground group-hover:text-primary block mt-0.5">Classes 4 and 5</strong>
            <span className="text-muted-foreground text-xs block mt-0.5">Multi-digit math &amp; fractions</span>
          </a>
          <a
            href="/curriculum/classes-6-8"
            className="p-3.5 rounded-[18px] border border-[#C7DDAE] bg-[#FFF7E6] dark:bg-[#1C2817] hover:border-primary transition-all block group"
          >
            <span className="font-mono text-xs uppercase font-bold text-primary block">Middle Stage</span>
            <strong className="text-foreground group-hover:text-primary block mt-0.5">Classes 6 to 8</strong>
            <span className="text-muted-foreground text-xs block mt-0.5">Integers &amp; pre-algebra</span>
          </a>
          <a
            href="/curriculum/classes-9-10"
            className="p-3.5 rounded-[18px] border border-[#C7DDAE] bg-[#FFF7E6] dark:bg-[#1C2817] hover:border-primary transition-all block group"
          >
            <span className="font-mono text-xs uppercase font-bold text-primary block">Secondary</span>
            <strong className="text-foreground group-hover:text-primary block mt-0.5">Classes 9 and 10</strong>
            <span className="text-muted-foreground text-xs block mt-0.5">Quadratics &amp; trigonometry</span>
          </a>
        </div>
      </div>
    </section>
  );
}
