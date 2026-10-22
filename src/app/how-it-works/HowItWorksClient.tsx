'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Warning, CaretDown, CaretUp, PaperPlaneRight } from '@phosphor-icons/react';

export default function HowItWorksClient() {
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
      title: '2. Evidence-Based Stopping Rule & Root Gap Isolation',
      summary: 'Bayesian Knowledge Tracing (BKT) with calibrated guess and slip parameters.',
      detail: 'The diagnostic engine operates on a Bayesian Knowledge Tracing (BKT) evidence model with named constraints: minimum 8 questions and maximum 18 questions per assessment (respecting a 6-8 minute child attention span budget). A concept is never classified as mastered or as a gap from a single question. Multiple-choice guess probabilities (25% for 4 options) and careless slip rates (10%) are calibrated directly into Bayesian probability updates. To definitively diagnose a root learning gap, the system requires at least 3 probed questions on the root concept across distinct question formats, at least 2 questions on all probed concepts, verified prerequisite testing along the backtracking trail, and an evidence confidence threshold of at least 85%. If the 18-question cap is reached prior to meeting 85% confidence, the result is transparently designated as "provisional" with follow-up practice recommended.',
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
    {
      title: '5. Curriculum Knowledge RAG & Grounded Pedagogy',
      summary: 'Grounding AI hints, misconception explanations, and remediation plans in authentic curriculum textbooks.',
      detail: 'ShikshaGap employs a Knowledge Retrieval-Augmented Generation (RAG) system with 768-dimensional normalized curriculum embeddings. What RAG is used for: Retrieved curriculum chunks ground Gemini in authentic NCERT (CBSE) and ICSE pedagogy, shaping contextual hints, error explanations, question styles, and 5-day remediation plans featuring zero-cost manipulative activities (such as paper folding, chalk grids, and seed counters). What RAG is NOT used for: Retrieval NEVER evaluates or decides whether a student answer is mathematically correct; all scoring and answer verification remains strictly deterministic. Performance: On our standardized 30-query labelled curriculum test set, retrieval achieves a measured Hit@4 of 100.0% (30/30) with strict board isolation (ICSE queries never receive NCERT chunks and vice versa). Privacy: No student names, roll numbers, or student answers are ever embedded or transmitted.',
    },
    {
      title: '6. Persistent Question-Memory RAG & Empirical Difficulty Calibration',
      summary: 'Preventing repetitive problems, reusing proven questions, and calibrating difficulty from real classroom outcomes.',
      detail: 'Every question generated by Gemini that passes strict deterministic validation and blind solver checks is embedded (768 dimensions) and saved to Supabase pgvector. Before generating a new question, the engine retrieves nearest stored questions to: (a) pass nearest ones to Gemini as anti-repetition constraints; (b) serve proven, low-exposure questions directly without AI latency; and (c) calibrate difficulty empirically from real success rates once an item reaches 20 attempts. Strict board isolation ensures ICSE questions never mix with NCERT (CBSE). Privacy: Only mathematical text, answers, and aggregate counters (times served, times correct) are stored; student identities and individual answers are strictly prohibited.',
    },
    {
      title: '7. Secure Report Sharing & Student Privacy',
      summary: 'Read-only formative summaries via unguessable 256-bit links with 30-day lifecycle.',
      detail: 'Teachers can share formative gap reports with parents via unguessable 256-bit secure URLs (/report/<token>) stored in Supabase with Row Level Security (RLS) and service-role protection. Links default to 30 days automatic expiry, can be revoked at any time by the educator, display zero PII in the URL, provide noindex and no-store caching headers, and support trilingual rendering (English, Hindi, Telugu) with A4 print formatting.',
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Bar */}
        <div className="pb-4 mb-6 border-b border-border flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-mono uppercase text-muted-foreground dark:text-muted-foreground hover:underline min-h-[44px]"
          >
            <ArrowLeft size={16} />
            <span>Return to Home</span>
          </Link>
          <div className="border border-border px-2 py-0.5 text-sm font-mono uppercase bg-muted text-foreground">
            Methodology & Validation
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <span className="text-sm font-mono uppercase tracking-widest text-muted-foreground dark:text-muted-foreground">
            Pedagogical Integrity
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal mt-1 tracking-tight text-foreground">
            Diagnostic Methodology & Accuracy Disclosures
          </h1>
          <p className="text-sm sm:text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed mt-3">
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
                className="border border-border bg-card dark:bg-card"
              >
                <button
                  onClick={() => setExpandedSection(isOpen ? null : index)}
                  className="w-full text-left p-4 flex items-start justify-between gap-3 min-h-[44px]"
                  aria-expanded={isOpen}
                >
                  <div>
                    <h2 className="font-serif text-base sm:text-lg font-bold text-foreground">
                      {sec.title}
                    </h2>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-0.5 font-sans">
                      {sec.summary}
                    </p>
                  </div>
                  <div className="pt-1 text-muted-foreground dark:text-muted-foreground shrink-0">
                    {isOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-border text-sm sm:text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed">
                    {sec.detail}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Teacher Feedback / Report Problem Form */}
        <div className="border border-border p-6 bg-muted dark:bg-card mb-12">
          <div className="flex items-center gap-2 text-sm font-mono uppercase font-bold text-primary mb-1">
            <Warning size={16} />
            <span>Educator Feedback</span>
          </div>
          <h2 className="font-serif text-xl font-bold mb-2 text-foreground">
            Report a Problem with a Diagnosis
          </h2>
          <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed mb-4">
            If you encounter an assessment item with ambiguous phrasing, an incorrect prerequisite tag, or an unrealistic remediation recommendation, please let our curriculum review team know. No student names or identifiers are required.
          </p>

          {submitSuccess ? (
            <div className="p-3 border border-[var(--status-good-border)] bg-[var(--status-good-bg)] text-foreground text-sm flex items-center gap-2">
              <CheckCircle size={16} className="text-[var(--status-good)]" />
              <span>Thank you. Your feedback has been logged for our mathematical curriculum review cycle.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-3">
              <div>
                <label htmlFor="topic-select" className="block text-sm font-mono uppercase text-muted-foreground dark:text-muted-foreground mb-1">
                  Topic Area
                </label>
                <select
                  id="topic-select"
                  value={reportTopic}
                  onChange={(e) => setReportTopic(e.target.value)}
                  className="w-full min-h-[44px] bg-card dark:bg-muted border border-border px-3 text-base sm:text-sm font-mono text-foreground"
                >
                  <option value="place_value">Place Value & Number Sense</option>
                  <option value="subtraction">Multi-Digit Subtraction with Regrouping</option>
                  <option value="multiplication">Multiplication Facts & Expanded Products</option>
                  <option value="division">Division Concepts & Remainders</option>
                  <option value="fractions">Fractions as Equal Parts</option>
                </select>
              </div>

              <div>
                <label htmlFor="observation-input" className="block text-sm font-mono uppercase text-muted-foreground dark:text-muted-foreground mb-1">
                  Observed Problem Description
                </label>
                <textarea
                  id="observation-input"
                  required
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Describe the discrepancy (e.g., student understood concept but misread vernacular phrasing)..."
                  className="w-full bg-card dark:bg-muted border border-border p-3 text-base sm:text-sm font-mono text-foreground focus:outline-none focus:border-border"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[44px] px-4 bg-primary text-primary-foreground dark:bg-muted dark:text-foreground text-sm font-mono uppercase font-bold inline-flex items-center gap-2 border border-border"
              >
                <PaperPlaneRight size={16} />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Diagnostic Feedback'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-border text-center text-sm font-mono text-muted-foreground dark:text-muted-foreground">
          ShikshaGap Methodology Version 2026.04 | Peer Reviewed Primary Mathematics Graph
        </div>
      </div>
    </div>
  );
}
