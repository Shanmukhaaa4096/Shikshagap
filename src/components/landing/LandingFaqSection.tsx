'use client';

import { FAQS } from '@/data/faqs';
import { CaretDown } from '@phosphor-icons/react';
import { FlowerPetal, BotanicalLeaf } from '@/components/illustrations/FloralMotifs';

export function LandingFaqSection() {
  return (
    <section id="faq" className="px-4 sm:px-8 py-14 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#C7DDAE]/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-primary font-bold">
            <BotanicalLeaf size={16} />
            <span>08 / INQUIRIES &amp; FAQ</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl font-bold mt-1 text-foreground">
            Frequently Asked Questions
          </h2>
        </div>
        <p className="text-xs sm:text-sm font-sans text-muted-foreground max-w-md">
          Answers regarding curriculum coverage, teacher autonomy, local device operation, and child privacy protections.
        </p>
      </div>

      <div className="space-y-3.5 max-w-3xl mx-auto">
        {FAQS.map((faq, index) => {
          return (
            <details 
              key={index} 
              className="group rounded-[20px] border border-[#C7DDAE] bg-[#FFF7E6] dark:bg-[#1C2817] shadow-xs overflow-hidden transition-all duration-200 open:shadow-warm open:border-primary/50"
            >
              <summary className="list-none w-full text-left p-5 flex items-center justify-between gap-4 font-heading text-base sm:text-lg font-bold text-foreground cursor-pointer select-none">
                <span className="flex items-center gap-2">
                  <FlowerPetal size={14} color="#F4C542" className="group-open:rotate-45 transition-transform" />
                  {faq.q}
                </span>
                <CaretDown size={18} weight="bold" className="shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 group-open:text-primary" />
              </summary>
              <div className="p-5 pt-0 text-xs sm:text-sm text-foreground/80 leading-relaxed border-t border-[#C7DDAE]/40 font-sans">
                {faq.a}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
