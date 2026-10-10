'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Warning, CaretDown, CaretUp, PaperPlaneRight } from '@phosphor-icons/react';

export default function HowItWorksPage() {
  const [reportTopic, setReportTopic] = useState('subtraction');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);
    // Simulate submission to diagnostic feedback store
    await new Promise((r) => setTimeout(r, 600));
    setIsSubmitting(false);
    setSubmitSuccess(true);
    setFeedbackText('');
  };

  const sections = [
    {
      title: '1. Competency Graph Mapping',
      summary: 'How questions connect to foundational skills from earlier grades.',
      detail: 'Every assessment item is tagged not just with Class 5 chapter labels, but with directed prerequisite dependency edges. For example, a student struggling with 3-digit subtraction may have a root gap in 2-digit regrouping (Class 3) or place value representation of zero (Class 2). The system traces backwards through these prerequisite dependencies.',
    },
    {
      title: '2. Root Gap Isolation Algorithm',
      summary: 'Distinguishing careless slips from deep conceptual roadblocks.',
      detail: 'A single arithmetic error does not trigger a critical gap diagnosis. The engine looks for consistent error signatures across 2 or more related items (such as repeatedly subtracting the smaller digit from the larger digit regardless of position). When an error signature recurs, the system identifies the earliest prerequisite node in the dependency graph.',
    },
    {
      title: '3. What the AI Does vs What It Does Not Do',
      summary: 'Clear boundaries between algorithmic support and human educator judgment.',
      detail: 'The AI model synthesizes observation evidence into plain-language pedagogical recommendations and drafts 5-day action plans. It NEVER assigns final marks, does NOT make pass/fail determinations, and does NOT profile children. The classroom teacher retains complete authority to override or dismiss any suggested diagnosis.',
    },
    {
      title: '4. Accuracy Measurements & Known Limitations',
      summary: 'Honest empirical disclosure with no fabricated performance benchmarks.',
      detail: 'ShikshaGap is in pilot research evaluation. Formal empirical accuracy percentages (precision and recall against expert master teacher diagnoses) are actively being collected across classroom trials. We do not publish simulated or unverified "99% accuracy" marketing claims. Known limitations include: inability to evaluate scratchpad mental math, language comprehension barriers in word problems, and lack of handwritten work analysis.',
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#FAF8E8] dark:bg-[#432623] text-[#432623] dark:text-[#F5F1BC] font-sans selection:bg-[#DE2A35] selection:text-[#F5F1BC] p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Bar */}
        <div className="pb-4 mb-6 border-b border-[#432623]/20 dark:border-[#F5F1BC]/20 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-[#432623]/70 dark:text-[#F5F1BC]/70 hover:underline min-h-[44px]"
          >
            <ArrowLeft size={16} />
            <span>Return to Home</span>
          </Link>
          <div className="border border-[#432623]/25 px-2 py-0.5 text-[11px] font-mono uppercase bg-[#F5F1BC] text-[#432623]">
            Methodology & Validation
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#F5F1BC]/70">
            Pedagogical Integrity
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal mt-1 tracking-tight text-[#432623] dark:text-[#F5F1BC]">
            Diagnostic Methodology & Accuracy Disclosures
          </h1>
          <p className="text-xs sm:text-sm text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed mt-3">
            An open, honest explanation of how ShikshaGap traces prerequisite learning gaps in primary mathematics, what the assistive engine can and cannot do, and our ongoing empirical validation process.
          </p>
        </div>

        {/* Methodology Sections */}
        <div className="space-y-3 mb-10">
          {sections.map((sec, index) => {
            const isOpen = expandedSection === index;
            return (
              <div 
                key={index} 
                className="border border-[#432623]/25 dark:border-[#F5F1BC]/25 bg-[#FAF8E8] dark:bg-[#381f1c]"
              >
                <button
                  onClick={() => setExpandedSection(isOpen ? null : index)}
                  className="w-full text-left p-4 flex items-start justify-between gap-3 min-h-[44px]"
                  aria-expanded={isOpen}
                >
                  <div>
                    <h2 className="font-serif text-base sm:text-lg font-bold text-[#432623] dark:text-[#F5F1BC]">
                      {sec.title}
                    </h2>
                    <p className="text-xs text-[#432623]/70 dark:text-[#F5F1BC]/70 mt-0.5 font-sans">
                      {sec.summary}
                    </p>
                  </div>
                  <div className="pt-1 text-[#432623]/60 dark:text-[#F5F1BC]/60 shrink-0">
                    {isOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-[#432623]/15 dark:border-[#F5F1BC]/15 text-xs sm:text-sm text-[#432623]/85 dark:text-[#F5F1BC]/85 leading-relaxed">
                    {sec.detail}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Teacher Feedback / Report Problem Form */}
        <div className="border border-[#432623]/25 dark:border-[#F5F1BC]/25 p-6 bg-[#F5F1BC]/30 dark:bg-[#381f1c] mb-12">
          <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold text-[#DE2A35] mb-1">
            <Warning size={16} />
            <span>Educator Feedback</span>
          </div>
          <h2 className="font-serif text-xl font-bold mb-2 text-[#432623] dark:text-[#F5F1BC]">
            Report a Problem with a Diagnosis
          </h2>
          <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed mb-4">
            If you encounter an assessment item with ambiguous phrasing, an incorrect prerequisite tag, or an unrealistic remediation recommendation, please let our curriculum review team know. No student names or identifiers are required.
          </p>

          {submitSuccess ? (
            <div className="p-3 border border-[#8ABB93] bg-[#8ABB93]/15 text-[#432623] dark:text-[#F5F1BC] text-xs flex items-center gap-2">
              <CheckCircle size={16} className="text-[#8ABB93]" />
              <span>Thank you. Your feedback has been logged for our mathematical curriculum review cycle.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-3">
              <div>
                <label htmlFor="topic-select" className="block text-xs font-mono uppercase text-[#432623]/70 dark:text-[#F5F1BC]/70 mb-1">
                  Topic Area
                </label>
                <select
                  id="topic-select"
                  value={reportTopic}
                  onChange={(e) => setReportTopic(e.target.value)}
                  className="w-full min-h-[44px] bg-[#FAF8E8] dark:bg-[#432623] border border-[#432623]/30 px-3 text-base sm:text-xs font-mono text-[#432623] dark:text-[#F5F1BC]"
                >
                  <option value="place_value">Place Value & Number Sense</option>
                  <option value="subtraction">Multi-Digit Subtraction with Regrouping</option>
                  <option value="multiplication">Multiplication Facts & Expanded Products</option>
                  <option value="division">Division Concepts & Remainders</option>
                  <option value="fractions">Fractions as Equal Parts</option>
                </select>
              </div>

              <div>
                <label htmlFor="observation-input" className="block text-xs font-mono uppercase text-[#432623]/70 dark:text-[#F5F1BC]/70 mb-1">
                  Observed Problem Description
                </label>
                <textarea
                  id="observation-input"
                  required
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Describe the discrepancy (e.g., student understood concept but misread vernacular phrasing)..."
                  className="w-full bg-[#FAF8E8] dark:bg-[#432623] border border-[#432623]/30 p-3 text-base sm:text-xs font-mono text-[#432623] dark:text-[#F5F1BC] focus:outline-none focus:border-[#432623]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[44px] px-4 bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623] text-xs font-mono uppercase font-bold inline-flex items-center gap-2 border border-[#432623] dark:border-[#F5F1BC]"
              >
                <PaperPlaneRight size={16} />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Diagnostic Feedback'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-[#432623]/20 dark:border-[#F5F1BC]/20 text-center text-[11px] font-mono text-[#432623]/60 dark:text-[#F5F1BC]/60">
          ShikshaGap Methodology Version 2026.04 | Peer Reviewed Primary Mathematics Graph
        </div>
      </div>
    </div>
  );
}
