import React from 'react';
import { FAQS } from '@/data/faqs';
import { CaretDown } from '@phosphor-icons/react';

export function LandingFaqSection() {
  return (
    <section id="faq" className="border-b border-[#432623]/25 px-4 sm:px-8 py-12 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#432623]/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#FAF8E8]/70">
            <span className="text-[#DE2A35] font-bold">08</span>
            <span>/</span>
            <span>INQUIRIES &amp; FAQ</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal mt-1 text-[#432623] dark:text-[#FAF8E8]">
            Frequently Asked Questions
          </h2>
        </div>
        <p className="text-sm font-mono text-[#432623]/70 dark:text-[#FAF8E8]/70 max-w-md">
          Answers regarding curriculum coverage, teacher autonomy, local device operation, and child privacy protections.
        </p>
      </div>

      <div className="space-y-3 max-w-3xl mx-auto">
        {FAQS.map((faq, index) => {
          return (
            <details key={index} className="group border border-[#432623]/20 bg-[#FAF8E8] dark:bg-[#251614]">
              <summary className="list-none w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-serif text-base sm:text-lg font-bold text-[#432623] dark:text-[#FAF8E8] cursor-pointer">
                <span>{faq.q}</span>
                <CaretDown size={16} className="shrink-0 text-[#432623]/60 dark:text-[#FAF8E8]/60 transition-transform group-open:rotate-180 group-open:text-[#DE2A35]" />
              </summary>
              <div className="p-4 sm:p-5 pt-0 text-sm text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed border-t border-[#432623]/15">
                {faq.a}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
