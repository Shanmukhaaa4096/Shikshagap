import React from 'react';
import { FAQS } from '@/data/faqs';
import { CaretDown } from '@phosphor-icons/react';

export function LandingFaqSection() {
  return (
    <section id="faq" className="border-b border-border px-4 sm:px-8 py-12 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-muted-foreground dark:text-muted-foreground">
            <span className="text-primary font-bold">08</span>
            <span>/</span>
            <span>INQUIRIES &amp; FAQ</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal mt-1 text-foreground">
            Frequently Asked Questions
          </h2>
        </div>
        <p className="text-sm font-mono text-muted-foreground dark:text-muted-foreground max-w-md">
          Answers regarding curriculum coverage, teacher autonomy, local device operation, and child privacy protections.
        </p>
      </div>

      <div className="space-y-3 max-w-3xl mx-auto">
        {FAQS.map((faq, index) => {
          return (
            <details key={index} className="group border border-border bg-card">
              <summary className="list-none w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-serif text-base sm:text-lg font-bold text-foreground cursor-pointer">
                <span>{faq.q}</span>
                <CaretDown size={16} className="shrink-0 text-muted-foreground dark:text-muted-foreground transition-transform group-open:rotate-180 group-open:text-primary" />
              </summary>
              <div className="p-4 sm:p-5 pt-0 text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed border-t border-border">
                {faq.a}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
