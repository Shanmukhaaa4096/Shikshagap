'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  CheckCircle, 
  Warning, 
  Brain, 
  TreeStructure, 
  ShieldCheck, 
  FileText, 
  User, 
  CaretDown, 
  CaretUp,
  Sun,
  Moon
} from '@phosphor-icons/react';

// Synthetic sample learners for public demonstration (never real children)
const SYNTHETIC_SAMPLES = [
  {
    id: 'syn-01',
    label: 'Synthetic Learner A',
    topic: '3-Digit Subtraction with Regrouping',
    status: 'Developing',
    score: 62,
    rootGap: 'Zero in Subtrahend (Borrowing Across Zero)',
    evidence: 'Learner subtracts smaller digit from larger digit regardless of position when zero occurs in tens place (e.g., 504 - 128 = 424).',
    prerequisite: 'Place Value Regrouping (Tens to Ones)',
    remedialFocus: 'Concrete bundle sticks and base-10 flats showing exchange of 1 Hundred for 10 Tens before borrowing into Ones.'
  },
  {
    id: 'syn-02',
    label: 'Synthetic Learner B',
    topic: 'Fractions as Equal Parts',
    status: 'Critical',
    score: 45,
    rootGap: 'Denominator as Independent Whole Number',
    evidence: 'Learner compares 1/8 and 1/4 and asserts 1/8 is larger because 8 is greater than 4.',
    prerequisite: 'Unit Fraction Partitioning',
    remedialFocus: 'Paper folding and roti/cake circular cutouts dividing one whole into unequal vs equal parts.'
  },
  {
    id: 'syn-03',
    label: 'Synthetic Learner C',
    topic: 'Place Value and Expanded Form',
    status: 'On Track',
    score: 88,
    rootGap: 'Consistent positional understanding',
    evidence: 'Correctly decomposes 4-digit numbers into thousands, hundreds, tens, and ones with minimal hesitation.',
    prerequisite: 'Foundational Numeracy',
    remedialFocus: 'Advance to multi-digit multiplication mental math strategies.'
  }
];

const FAQS = [
  {
    q: 'What is ShikshaGap and who is it intended for?',
    a: 'ShikshaGap is a diagnostic educational intelligence tool designed for Class 5 mathematics teachers in Indian schools. It analyzes student responses to locate prerequisite concept gaps in foundational math topics such as place value, fractions, and multi-digit operations.'
  },
  {
    q: 'Does ShikshaGap replace teacher evaluation or exams?',
    a: 'No. ShikshaGap functions strictly as an assistive diagnostic support system. All recommendations and learning gap analyses are subject to the professional judgment of the classroom teacher.'
  },
  {
    q: 'How is student data protected under Indian law?',
    a: 'ShikshaGap adheres to the Digital Personal Data Protection Act 2023 (DPDP Act). Student records are processed strictly on educational authority. AI diagnostic calls use pseudonymous identifiers with no personal identifiers transmitted.'
  },
  {
    q: 'Which languages are supported?',
    a: 'The diagnostic system supports English, Hindi (हिन्दी), and Telugu (తెలుగు) across instruction prompts, question statements, and teacher remediation worksheets.'
  },
  {
    q: 'How can a government school or NGO access the full dashboard?',
    a: 'School administrators and educators can log in using institutional credentials via the Teacher Portal. For pilot deployment inquiries, contact our academic support desk.'
  }
];

export default function PublicLandingPage() {
  const [selectedSynthetic, setSelectedSynthetic] = useState(SYNTHETIC_SAMPLES[0]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const currentYear = 2026;

  // Structured Schema for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        'name': 'ShikshaGap',
        'url': 'https://shikshagap.vercel.app',
        'description': 'Educational intelligence and diagnostic system for foundational mathematics in Indian schools.',
        'contactPoint': {
          '@type': 'ContactPoint',
          'email': 'support@shikshagap.in',
          'contactType': 'Educational Support'
        }
      },
      {
        '@type': 'SoftwareApplication',
        'name': 'ShikshaGap Diagnostic Intelligence',
        'applicationCategory': 'EducationalApplication',
        'operatingSystem': 'Web Browser',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'INR'
        }
      },
      {
        '@type': 'FAQPage',
        'mainEntity': FAQS.map(faq => ({
          '@type': 'Question',
          'name': faq.q,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.a
          }
        }))
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#FAF8E8] dark:bg-[#432623] text-[#432623] dark:text-[#F5F1BC] font-sans selection:bg-[#DE2A35] selection:text-[#F5F1BC] flex flex-col">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Skip to Content for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#DE2A35] focus:text-[#F5F1BC] text-xs font-mono uppercase border border-[#432623]"
      >
        Skip to main content
      </a>

      {/* Top Banner */}
      <div className="bg-[#FAF8E8] dark:bg-[#381f1c] border-b border-[#432623]/20 dark:border-[#F5F1BC]/20 text-[11px] font-mono py-1.5 px-4 text-center text-[#432623]/80 dark:text-[#F5F1BC]/80">
        Indian Government School Mathematics (Class 5) | DPDP Act 2023 Aligned Educational Intelligence
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8E8]/95 dark:bg-[#432623]/95 backdrop-blur-none border-b border-[#432623]/20 dark:border-[#F5F1BC]/20 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-[#432623] dark:text-[#F5F1BC]">
              ShikshaGap
            </Link>
            <span className="hidden sm:inline-block border border-[#432623]/25 dark:border-[#F5F1BC]/25 text-[10px] font-mono px-2 py-0.5 uppercase bg-[#F5F1BC] text-[#432623]">
              Diagnostic System
            </span>
          </div>

          <nav className="flex items-center gap-3 sm:gap-6 text-xs font-mono uppercase tracking-wider" aria-label="Main Navigation">
            <a href="#how-it-works" className="hidden md:inline hover:underline text-[#432623]/80 dark:text-[#F5F1BC]/80">
              Methodology
            </a>
            <a href="#synthetic-demo" className="hidden md:inline hover:underline text-[#432623]/80 dark:text-[#F5F1BC]/80">
              Sample Demo
            </a>
            <a href="#faq" className="hidden md:inline hover:underline text-[#432623]/80 dark:text-[#F5F1BC]/80">
              FAQ
            </a>
            
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 border border-[#432623]/25 dark:border-[#F5F1BC]/25 hover:bg-[#F5F1BC]/40 dark:hover:bg-[#381f1c]"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <Link
              href="/login"
              className="border border-[#432623] dark:border-[#F5F1BC] bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623] px-3.5 py-1.5 text-xs font-mono uppercase font-bold hover:bg-[#DE2A35] dark:hover:bg-[#DE2A35] dark:hover:text-[#F5F1BC]"
            >
              Teacher Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-[#432623]/20 dark:border-[#F5F1BC]/20 px-4 sm:px-8 py-16 sm:py-24 max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 border border-[#432623]/20 dark:border-[#F5F1BC]/20 bg-[#F5F1BC] dark:bg-[#381f1c] px-2.5 py-1 text-xs font-mono uppercase text-[#432623] dark:text-[#F5F1BC] mb-6">
              <TreeStructure size={14} className="text-[#DE2A35]" />
              <span>Prerequisite Diagnostic Engine for Class 5 Mathematics</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.15] text-[#432623] dark:text-[#F5F1BC] tracking-tight mb-6">
              Identify foundational mathematics gaps before they compound.
            </h1>

            <p className="text-base sm:text-lg text-[#432623]/85 dark:text-[#F5F1BC]/85 leading-relaxed mb-8 max-w-3xl">
              When a child struggles with 3-digit division or equivalent fractions in Class 5, the root problem is rarely the current textbook chapter. ShikshaGap maps student responses to prerequisite competency graphs, identifying earlier learning gaps and generating actionable 5-day classroom remediation plans.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#synthetic-demo"
                className="border border-[#432623] dark:border-[#F5F1BC] bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623] px-5 py-3 text-xs font-mono uppercase tracking-wider font-bold hover:bg-[#DE2A35] dark:hover:bg-[#DE2A35] dark:hover:text-[#F5F1BC] inline-flex items-center gap-2"
              >
                <span>Explore Interactive Demo</span>
                <ArrowRight size={14} />
              </a>

              <Link
                href="/login"
                className="border border-[#432623]/30 dark:border-[#F5F1BC]/30 bg-transparent px-5 py-3 text-xs font-mono uppercase tracking-wider font-bold hover:bg-[#F5F1BC]/50 dark:hover:bg-[#381f1c] inline-flex items-center gap-2"
              >
                <User size={14} />
                <span>Authorized Staff Portal</span>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-[#432623]/15 dark:border-[#F5F1BC]/15 flex flex-wrap items-center gap-6 text-xs text-[#432623]/70 dark:text-[#F5F1BC]/70 font-mono">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-[#8ABB93]" />
                <span>English, Hindi and Telugu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#8ABB93]" />
                <span>Child Privacy Protected (DPDP 2023)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Brain size={14} className="text-[#DFA06E]" />
                <span>Educator Decision Support</span>
              </div>
            </div>
          </div>
        </section>

        {/* Methodology: How Diagnosis Works */}
        <section id="how-it-works" className="border-b border-[#432623]/20 dark:border-[#F5F1BC]/20 px-4 sm:px-8 py-16 max-w-7xl mx-auto">
          <div className="mb-10">
            <span className="text-xs font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#F5F1BC]/70">
              System Architecture
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1 text-[#432623] dark:text-[#F5F1BC]">
              How the Diagnostic Engine Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-[#432623]/20 dark:border-[#F5F1BC]/20 p-5 bg-[#FAF8E8] dark:bg-[#381f1c]">
              <div className="text-xs font-mono text-[#DE2A35] font-bold mb-2">01 / ASSESSMENT</div>
              <h3 className="font-serif text-lg font-bold mb-2">Diagnostic Probing</h3>
              <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
                Adaptive 3 to 5 question diagnostic cycles test core mathematical competencies without intimidating lengthy examination formats.
              </p>
            </div>

            <div className="border border-[#432623]/20 dark:border-[#F5F1BC]/20 p-5 bg-[#FAF8E8] dark:bg-[#381f1c]">
              <div className="text-xs font-mono text-[#DE2A35] font-bold mb-2">02 / GRAPH TRAVERSAL</div>
              <h3 className="font-serif text-lg font-bold mb-2">Prerequisite Mapping</h3>
              <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
                The engine traverses prerequisite dependency trees backwards, identifying whether a failure stems from vocabulary, regrouping, or place value.
              </p>
            </div>

            <div className="border border-[#432623]/20 dark:border-[#F5F1BC]/20 p-5 bg-[#FAF8E8] dark:bg-[#381f1c]">
              <div className="text-xs font-mono text-[#DE2A35] font-bold mb-2">03 / REMEDIATION</div>
              <h3 className="font-serif text-lg font-bold mb-2">5-Day Action Plans</h3>
              <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
                Generates concrete pedagogical recommendations, manipulative tasks, and printable worksheets tailored to the specific roadblock.
              </p>
            </div>

            <div className="border border-[#432623]/20 dark:border-[#F5F1BC]/20 p-5 bg-[#FAF8E8] dark:bg-[#381f1c]">
              <div className="text-xs font-mono text-[#DE2A35] font-bold mb-2">04 / OVERSIGHT</div>
              <h3 className="font-serif text-lg font-bold mb-2">Teacher Discretion</h3>
              <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
                AI outputs serve strictly as decision support. The classroom teacher verifies findings and retains final authority over student progress.
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Demo Section with Synthetic Data */}
        <section id="synthetic-demo" className="border-b border-[#432623]/20 dark:border-[#F5F1BC]/20 px-4 sm:px-8 py-16 max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-block border border-[#DE2A35] bg-[#DE2A35]/10 text-[#DE2A35] text-[11px] font-mono uppercase px-2 py-0.5 mb-2 font-bold">
                Demonstration Environment
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#432623] dark:text-[#F5F1BC]">
                Interactive Diagnostic Explorer
              </h2>
            </div>
            <p className="text-xs font-mono text-[#432623]/70 dark:text-[#F5F1BC]/70 max-w-md">
              NOTICE: All learner profiles below use synthetic sample data. No real student records or personal identities are shown on public pages.
            </p>
          </div>

          <div className="border border-[#432623]/25 dark:border-[#F5F1BC]/25 bg-[#FAF8E8] dark:bg-[#381f1c]">
            {/* Tab Bar */}
            <div className="flex border-b border-[#432623]/20 dark:border-[#F5F1BC]/20 overflow-x-auto bg-[#F5F1BC]/40 dark:bg-[#381f1c]">
              {SYNTHETIC_SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => setSelectedSynthetic(sample)}
                  className={`px-4 py-3 text-xs font-mono uppercase border-r border-[#432623]/20 dark:border-[#F5F1BC]/20 whitespace-nowrap text-left ${
                    selectedSynthetic.id === sample.id
                      ? 'bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623] font-bold'
                      : 'hover:bg-[#F5F1BC] dark:hover:bg-[#432623]/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{sample.label}</span>
                    <span className={`text-[10px] px-1 border ${
                      sample.status === 'Critical' 
                        ? 'border-[#DE2A35] text-[#DE2A35]' 
                        : sample.status === 'Developing' 
                          ? 'border-[#DFA06E] text-[#DFA06E]' 
                          : 'border-[#8ABB93] text-[#8ABB93]'
                    }`}>
                      {sample.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Profile Detail */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 border border-[#432623]/20 dark:border-[#F5F1BC]/20 p-4 bg-[#FAF8E8] dark:bg-[#432623]">
                  <div className="text-[11px] font-mono uppercase text-[#432623]/60 dark:text-[#F5F1BC]/60 mb-1">
                    Assessment Topic
                  </div>
                  <h3 className="font-serif text-lg font-bold mb-4">{selectedSynthetic.topic}</h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="font-mono text-[#432623]/70 dark:text-[#F5F1BC]/70 text-[11px] uppercase">
                        Current Mastery Index
                      </div>
                      <div className="font-mono text-xl font-bold mt-0.5">{selectedSynthetic.score}%</div>
                    </div>
                    <div>
                      <div className="font-mono text-[#432623]/70 dark:text-[#F5F1BC]/70 text-[11px] uppercase">
                        Diagnostic Status
                      </div>
                      <div className="font-bold mt-0.5 flex items-center gap-1.5">
                        {selectedSynthetic.status === 'Critical' && <Warning size={14} className="text-[#DE2A35]" />}
                        {selectedSynthetic.status === 'Developing' && <Warning size={14} className="text-[#DFA06E]" />}
                        {selectedSynthetic.status === 'On Track' && <CheckCircle size={14} className="text-[#8ABB93]" />}
                        <span>{selectedSynthetic.status}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[#432623]/70 dark:text-[#F5F1BC]/70 text-[11px] uppercase">
                        Prerequisite Dependency
                      </div>
                      <div className="font-medium mt-0.5">{selectedSynthetic.prerequisite}</div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 border border-[#432623]/20 dark:border-[#F5F1BC]/20 p-4 bg-[#FAF8E8] dark:bg-[#432623] space-y-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#DE2A35] font-bold">
                      Identified Prerequisite Learning Gap
                    </span>
                    <h4 className="font-serif text-base font-bold text-[#432623] dark:text-[#F5F1BC] mt-0.5">
                      {selectedSynthetic.rootGap}
                    </h4>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#432623]/70 dark:text-[#F5F1BC]/70">
                      Diagnostic Observational Evidence
                    </span>
                    <p className="text-xs text-[#432623]/85 dark:text-[#F5F1BC]/85 mt-1 leading-relaxed bg-[#F5F1BC]/30 dark:bg-[#381f1c] p-3 border border-[#432623]/15 dark:border-[#F5F1BC]/15">
                      {selectedSynthetic.evidence}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#432623]/70 dark:text-[#F5F1BC]/70">
                      Actionable Remediation Strategy (Day 1 to 5)
                    </span>
                    <p className="text-xs text-[#432623]/85 dark:text-[#F5F1BC]/85 mt-1 leading-relaxed">
                      {selectedSynthetic.remedialFocus}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-[#432623]/15 dark:border-[#F5F1BC]/15">
                    <span className="text-[11px] text-[#432623]/60 dark:text-[#F5F1BC]/60 font-mono">
                      Artificial Intelligence Decision Support | Non-Evaluative
                    </span>
                    <Link
                      href="/login"
                      className="text-xs font-mono uppercase font-bold text-[#DE2A35] hover:underline flex items-center gap-1"
                    >
                      <span>Open in Full Dashboard</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who It Is For */}
        <section className="border-b border-[#432623]/20 dark:border-[#F5F1BC]/20 px-4 sm:px-8 py-16 max-w-7xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#F5F1BC]/70">
              User Profiles
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1 text-[#432623] dark:text-[#F5F1BC]">
              Designed Specifically for Primary School Educators
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-[#432623]/20 dark:border-[#F5F1BC]/20 p-5 bg-[#FAF8E8] dark:bg-[#381f1c]">
              <h3 className="font-serif text-lg font-bold mb-2">Class 5 Mathematics Teachers</h3>
              <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
                Quickly locate which prerequisite concepts are stalling mastery without grading piles of diagnostic paper scripts manually.
              </p>
            </div>

            <div className="border border-[#432623]/20 dark:border-[#F5F1BC]/20 p-5 bg-[#FAF8E8] dark:bg-[#381f1c]">
              <h3 className="font-serif text-lg font-bold mb-2">Headmasters and Academic Supervisors</h3>
              <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
                Access school-wide learning trends to plan targeted peer-grouping, teaching learning materials (TLMs), and remedial timetables.
              </p>
            </div>

            <div className="border border-[#432623]/20 dark:border-[#F5F1BC]/20 p-5 bg-[#FAF8E8] dark:bg-[#381f1c]">
              <h3 className="font-serif text-lg font-bold mb-2">Block Resource Persons & Mentors</h3>
              <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
                Guide classroom teachers with structured 5-day instructional interventions grounded in cognitive learning science.
              </p>
            </div>
          </div>
        </section>

        {/* Expandable FAQ */}
        <section id="faq" className="border-b border-[#432623]/20 dark:border-[#F5F1BC]/20 px-4 sm:px-8 py-16 max-w-7xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#F5F1BC]/70">
              Inquiries
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1 text-[#432623] dark:text-[#F5F1BC]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3 max-w-3xl">
            {FAQS.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div key={index} className="border border-[#432623]/25 dark:border-[#F5F1BC]/25 bg-[#FAF8E8] dark:bg-[#381f1c]">
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="w-full text-left p-4 flex items-center justify-between gap-4 font-serif text-base font-bold text-[#432623] dark:text-[#F5F1BC]"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <CaretUp size={16} className="shrink-0" /> : <CaretDown size={16} className="shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed border-t border-[#432623]/15 dark:border-[#F5F1BC]/15 font-sans">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Institutional Inquiries */}
        <section className="px-4 sm:px-8 py-16 max-w-7xl mx-auto">
          <div className="border border-[#432623]/25 dark:border-[#F5F1BC]/25 p-8 bg-[#F5F1BC]/40 dark:bg-[#381f1c]">
            <h2 className="font-serif text-2xl font-bold mb-2">Institutional Inquiries & Support</h2>
            <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 mb-6 max-w-2xl leading-relaxed">
              For state school partnerships, academic research access, or grievance inquiries under the Digital Personal Data Protection Act 2023, contact our coordination desk.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <a 
                href="mailto:support@shikshagap.in" 
                className="border border-[#432623] dark:border-[#F5F1BC] bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623] px-4 py-2 uppercase font-bold hover:bg-[#DE2A35]"
              >
                support@shikshagap.in
              </a>
              <Link 
                href="/data-request" 
                className="border border-[#432623]/30 dark:border-[#F5F1BC]/30 px-4 py-2 uppercase font-bold hover:bg-[#FAF8E8] dark:hover:bg-[#432623]"
              >
                Submit DPDP Data Request
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#432623]/20 dark:border-[#F5F1BC]/20 bg-[#FAF8E8] dark:bg-[#381f1c] px-4 sm:px-8 py-8 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="font-serif text-lg font-bold text-[#432623] dark:text-[#F5F1BC]">
              ShikshaGap
            </div>
            <p className="text-[11px] text-[#432623]/70 dark:text-[#F5F1BC]/70 mt-1 max-w-md">
              Foundational Mathematics Diagnostic Intelligence for Indian Schools. Academic evaluation prototype. Not affiliated with government bodies.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-[11px] uppercase tracking-wider text-[#432623]/80 dark:text-[#F5F1BC]/80">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <span>/</span>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <span>/</span>
            <Link href="/cookies" className="hover:underline">Cookie Notice</Link>
            <span>/</span>
            <Link href="/licenses" className="hover:underline">Open Source Licenses</Link>
            <span>/</span>
            <Link href="/data-request" className="hover:underline">Data Request</Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-[#432623]/10 dark:border-[#F5F1BC]/10 flex flex-col sm:flex-row justify-between text-[10px] text-[#432623]/60 dark:text-[#F5F1BC]/60">
          <div>Copyright {currentYear} ShikshaGap Educational Intelligence. All rights reserved.</div>
          <div>Strictly necessary storage only. Zero third party behavioral tracking.</div>
        </div>
      </footer>
    </div>
  );
}
