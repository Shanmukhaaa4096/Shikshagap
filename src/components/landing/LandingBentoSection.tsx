import React from 'react';
import { ArrowRight, ShieldCheck, Lock } from '@phosphor-icons/react';
import { 
  DagBentoIllustration, 
  LanguagesBentoIllustration, 
  WorksheetBentoIllustration, 
  PrivacyBentoIllustration 
} from '@/components/illustrations/BentoIllustrations';

export function LandingBentoSection() {
  return (
    <section className="border-b border-[#432623]/25 px-4 sm:px-8 py-12 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#432623]/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#FAF8E8]/70">
            <span className="text-[#DE2A35] font-bold">06</span>
            <span>/</span>
            <span>CURRICULUM ARCHITECTURE</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal mt-1 text-[#432623] dark:text-[#FAF8E8]">
            Built for Indian Government School Classrooms
          </h2>
        </div>
        <p className="text-sm font-mono text-[#432623]/70 dark:text-[#FAF8E8]/70 max-w-md">
          Engineered for multi-grade classrooms, non-English speakers, limited internet, and zero child tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tile 1: Wide */}
        <div className="md:col-span-2 border border-[#432623]/25 p-6 bg-[#FAF8E8] dark:bg-[#251614] flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="text-sm font-mono text-[#B51E28] font-bold mb-1 uppercase tracking-wider">
                01 : Prerequisite Tracing Engine
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold mb-2">
                Traces Missing Skills Across Grade Boundaries
              </h3>
              <p className="text-sm text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed mb-4">
                When a Class 5 student fails a long division task, the system automatically traverses backwards to check whether the breakdown began in Class 3 repeated addition or Class 4 multiplication facts.
              </p>
            </div>
            <div className="shrink-0 flex justify-center pb-2 sm:pb-0">
              <DagBentoIllustration className="w-36 h-auto" />
            </div>
          </div>
          <div className="border border-[#432623]/20 p-3 bg-[#F5F1BC]/40 dark:bg-[#311E1B]/50 flex items-center justify-between text-sm font-mono">
            <span className="text-[#432623]/70 dark:text-[#FAF8E8]/70">Class 3 Repeated Addition</span>
            <ArrowRight size={14} className="text-[#DE2A35]" />
            <span className="text-[#432623]/70 dark:text-[#FAF8E8]/70">Class 4 Mult Facts</span>
            <ArrowRight size={14} className="text-[#DE2A35]" />
            <span className="font-bold text-[#432623] dark:text-[#FAF8E8]">Class 5 Long Division</span>
          </div>
        </div>

        {/* Tile 2: Square */}
        <div className="border border-[#432623]/25 p-6 bg-[#FAF8E8] dark:bg-[#251614] flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-mono text-[#432623] dark:text-[#FAF8E8] font-bold uppercase tracking-wider">
                02 : Three Regional Languages
              </span>
              <LanguagesBentoIllustration className="w-16 h-auto" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold mb-2">
              Native Vernacular Fluency
            </h3>
            <p className="text-sm text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed mb-4">
              Questions, diagnostic instructions, hints, and practice sheets are completely translated for native regional language classrooms.
            </p>
          </div>
          <div className="flex gap-2 font-mono text-sm">
            <span className="px-2.5 py-1 border border-[#432623]/20 bg-[#F5F1BC]/50 dark:bg-[#311E1B]">English</span>
            <span className="px-2.5 py-1 border border-[#432623]/20 bg-[#F5F1BC]/50 dark:bg-[#311E1B] font-bold">हिन्दी</span>
            <span className="px-2.5 py-1 border border-[#432623]/20 bg-[#F5F1BC]/50 dark:bg-[#311E1B] font-bold">తెలుగు</span>
          </div>
        </div>

        {/* Tile 3: Square */}
        <div className="border border-[#432623]/25 p-6 bg-[#FAF8E8] dark:bg-[#251614] flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-mono text-[#432623] dark:text-[#FAF8E8] font-bold uppercase tracking-wider">
                03 : Printable Worksheets
              </span>
              <WorksheetBentoIllustration className="w-16 h-auto" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold mb-2">
              Single-Page Paper Sheets
            </h3>
            <p className="text-sm text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed mb-4">
              Print ready-to-use worksheets for students who do not have personal smartphones or internet access at home.
            </p>
          </div>
          <div className="border border-[#432623]/20 p-2.5 bg-[#F5F1BC]/40 dark:bg-[#311E1B]/50 text-center text-sm font-mono uppercase text-[#432623]/70 dark:text-[#FAF8E8]/70">
            Standard A4 / Single Sheet Print Format
          </div>
        </div>

        {/* Tile 4: Wide */}
        <div className="md:col-span-2 border border-[#432623]/25 p-6 bg-[#FAF8E8] dark:bg-[#251614] flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="text-sm font-mono text-[#432623] dark:text-[#FAF8E8] font-bold mb-1 uppercase tracking-wider">
                04 : Child Privacy by Design
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold mb-2">
                Built Following DPDP Act 2023 Principles & Zero Surveillance
              </h3>
              <p className="text-sm text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed mb-4">
                Zero tracking cookies, zero third-party advertising trackers, and strictly necessary local storage only. Children are never profiled.
              </p>
            </div>
            <div className="shrink-0 flex justify-center pb-2 sm:pb-0">
              <PrivacyBentoIllustration className="w-20 h-auto" />
            </div>
          </div>
          <div className="border border-[#432623]/20 p-3 bg-[#F5F1BC]/40 dark:bg-[#311E1B]/50 flex items-center gap-4 text-sm font-mono text-[#432623]/70 dark:text-[#FAF8E8]/70">
            <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-[#8ABB93]" /> Cookies: 0</span>
            <span className="flex items-center gap-1"><Lock size={14} className="text-[#8ABB93]" /> Third-Party Scripts: 0</span>
            <span>Storage: Local Device Only</span>
          </div>
        </div>
      </div>
    </section>
  );
}
