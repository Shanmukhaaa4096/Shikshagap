'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle, 
  ShieldCheck, 
  User, 
  CaretDown, 
  CaretUp,
  Sun,
  Moon,
  List,
  X
} from '@phosphor-icons/react';

// Real demo workflow data matching Class 5 mathematics
const DEMO_WORKFLOW_STUDENTS = [
  {
    id: 'demo-1',
    name: 'Rajesh Kumar',
    rollNo: 7,
    grade: 'Class 5A',
    topic: 'Long Division with Remainder',
    status: 'Needs Immediate Help',
    statusType: 'critical' as const,
    mastery: 42,
    question: 'If 24 laddus are shared equally among 6 children, how many laddus does each child get?',
    options: ['3 laddus', '4 laddus', '5 laddus', '6 laddus'],
    correctOption: '4 laddus',
    studentChoice: '3 laddus',
    observedMistake: 'Subtracted 6 from 24 instead of dividing into equal groups',
    rootGap: 'Division Concept (Equal Sharing)',
    prerequisiteFor: 'Long Division with Remainder',
    evidence: 'Student attempted to subtract the divisor once instead of partitioning 24 into 6 equal shares.',
    plan: [
      { day: 'Day 1', task: 'Use 24 pebbles or bottle caps. Practice sharing them equally into 6 bowls.' },
      { day: 'Day 2', task: 'Draw circles on slate and distribute dots equally to build grouping sense.' },
      { day: 'Day 3', task: 'Relate division facts to the 6 times table (6 x 4 = 24, so 24 / 6 = 4).' },
      { day: 'Day 4', task: 'Solve 4 simple sharing word problems with drawings.' },
      { day: 'Day 5', task: 'Check understanding with 3 new sharing questions on paper.' }
    ],
    reassessmentResult: 'After Day 5 practice, student answered 3 of 3 sharing questions correctly. Ready for 2-digit division.'
  },
  {
    id: 'demo-2',
    name: 'Priya Sharma',
    rollNo: 12,
    grade: 'Class 5A',
    topic: 'Fractions (Part of a Whole)',
    status: 'Needs Practice',
    statusType: 'warn' as const,
    mastery: 60,
    question: 'Which fraction is greater: 1/4 or 1/8 of the same roti?',
    options: ['1/8 is greater', '1/4 is greater', 'Both are equal', 'Cannot tell'],
    correctOption: '1/4 is greater',
    studentChoice: '1/8 is greater',
    observedMistake: 'Treated denominator 8 as a larger quantity than 4 without considering slice size',
    rootGap: 'Unit Fraction Partitioning',
    prerequisiteFor: 'Comparing and Adding Fractions',
    evidence: 'Student believes 1/8 is bigger than 1/4 because the number 8 is larger than the number 4.',
    plan: [
      { day: 'Day 1', task: 'Fold two identical paper strips. Cut one into 4 parts and the other into 8 parts.' },
      { day: 'Day 2', task: 'Compare the size of one 1/4 piece next to one 1/8 piece on the desk.' },
      { day: 'Day 3', task: 'Draw rotis on blackboard and shade 1/2, 1/4, and 1/8 to see slice size.' },
      { day: 'Day 4', task: 'Practice the rule: more equal parts means each piece is smaller.' },
      { day: 'Day 5', task: 'Complete 1-page paper worksheet comparing unit fractions.' }
    ],
    reassessmentResult: 'Student correctly identified that 1/3 is bigger than 1/6 using paper fold evidence.'
  },
  {
    id: 'demo-3',
    name: 'Amit Patel',
    rollNo: 19,
    grade: 'Class 5A',
    topic: 'Place Value and Regrouping',
    status: 'On Track',
    statusType: 'good' as const,
    mastery: 88,
    question: 'In the number 4,520, what is the value of the digit 5?',
    options: ['5', '50', '500', '5,000'],
    correctOption: '500',
    studentChoice: '500',
    observedMistake: 'None observed. Student answered with correct positional reasoning.',
    rootGap: 'Place value foundation is solid',
    prerequisiteFor: 'Multi-digit Multiplication',
    evidence: 'Correctly expanded 4,520 as 4 thousands, 5 hundreds, and 2 tens.',
    plan: [
      { day: 'Day 1', task: 'Practice 2-digit by 2-digit multiplication using area model.' },
      { day: 'Day 2', task: 'Solve word problems involving price calculations in local currency.' },
      { day: 'Day 3', task: 'Peer-tutor a classmate on place value columns.' },
      { day: 'Day 4', task: 'Independent practice with 3-digit multiplication.' },
      { day: 'Day 5', task: 'Short check on multi-digit multiplication fluency.' }
    ],
    reassessmentResult: 'Student demonstrates consistent mastery across 4-digit place value and multiplication.'
  }
];

const FAQS = [
  {
    q: 'What is ShikshaGap and who is it for?',
    a: 'ShikshaGap is a free teaching tool created for Indian government-school teachers and students. It is designed for Class 5 mathematics teachers who want to find why a student is struggling and what skill they need to learn next.'
  },
  {
    q: 'How does it help a teacher in a real classroom?',
    a: 'When a child struggles with Class 5 math like division or fractions, the root difficulty is usually an earlier missing skill from Class 3 or 4. ShikshaGap asks a few short questions, finds the earlier skill that needs practice, and gives the teacher a clear 5-day practice plan.'
  },
  {
    q: 'Does it replace the classroom teacher?',
    a: 'No. ShikshaGap is built to support the teacher, not replace them. The teacher decides which topics to practice, when to check again, and how to teach their students.'
  },
  {
    q: 'Which languages are supported?',
    a: 'ShikshaGap supports English, Hindi, and Telugu across the entire application, including student questions, hints, and printable practice sheets.'
  },
  {
    q: 'How is student privacy protected under Indian law?',
    a: 'ShikshaGap follows the Digital Personal Data Protection Act 2023. We do not sell student data, we do not track students, and we never share identifying details with external services.'
  },
  {
    q: 'Can a teacher use it on a simple phone or with slow internet?',
    a: 'Yes. The interface uses lightweight pages and large tap buttons designed for inexpensive Android smartphones and tablets commonly used in schools.'
  }
];

export default function PublicLandingPage() {
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const student = DEMO_WORKFLOW_STUDENTS[selectedStudentIndex];

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const currentYear = 2026;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        'name': 'ShikshaGap',
        'applicationCategory': 'EducationalApplication',
        'operatingSystem': 'Web Browser',
        'description': 'Find out what each student needs to learn next in Indian primary school mathematics.',
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
    <div className="min-h-screen bg-[#F8F7F4] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC] font-sans selection:bg-[#1D4ED8] selection:text-white flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Skip to Content for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#1D4ED8] focus:text-white text-xs font-mono uppercase border border-[#0F172A]"
      >
        Skip to main content
      </a>

      {/* School Context Notice Banner */}
      <div className="bg-[#F1EFEA] dark:bg-[#1E293B] border-b border-[#CBD5E1] dark:border-[#334155] text-xs font-mono py-2 px-4 text-center text-[#475569] dark:text-[#94A3B8]">
        Indian Primary School Mathematics (Class 5) | DPDP Act 2023 Compliant Educational Support
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#F8F7F4]/95 dark:bg-[#0F172A]/95 border-b border-[#CBD5E1] dark:border-[#334155] px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              ShikshaGap
            </Link>
            <span className="hidden sm:inline-block border border-[#CBD5E1] dark:border-[#334155] text-[11px] font-mono px-2 py-0.5 bg-[#F1EFEA] dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC]">
              Class 5 Maths
            </span>
          </div>

          <nav className="flex items-center gap-3 sm:gap-6 text-xs font-mono uppercase tracking-wider" aria-label="Main Navigation">
            <a href="#product-demo" className="hidden md:inline hover:underline text-[#475569] dark:text-[#94A3B8]">
              Product Demo
            </a>
            <Link href="/how-it-works" className="hidden lg:inline hover:underline text-[#475569] dark:text-[#94A3B8]">
              How It Works
            </Link>
            <a href="#faq" className="hidden md:inline hover:underline text-[#475569] dark:text-[#94A3B8]">
              Questions
            </a>
            
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F1EFEA] dark:hover:bg-[#334155]"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              href="/login"
              className="hidden sm:inline-flex border border-[#1D4ED8] bg-[#1D4ED8] text-white px-4 py-2 min-h-[44px] items-center text-xs font-mono uppercase font-bold hover:bg-[#1E40AF]"
            >
              Teacher Sign In
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B]"
            >
              {isMobileMenuOpen ? <X size={20} /> : <List size={20} />}
            </button>
          </nav>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-[#CBD5E1] dark:border-[#334155] flex flex-col gap-2 font-mono text-xs uppercase tracking-wider">
            <a
              href="#product-demo"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B]"
            >
              Interactive Product Demo
            </a>
            <Link
              href="/how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B]"
            >
              How It Works
            </Link>
            <a
              href="#faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B]"
            >
              Common Questions
            </a>
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center justify-center px-3 border border-[#1D4ED8] bg-[#1D4ED8] text-white font-bold text-center"
            >
              Teacher Sign In
            </Link>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-[#CBD5E1] dark:border-[#334155] px-4 sm:px-8 py-16 sm:py-24 max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-block border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] px-3 py-1 text-xs font-mono uppercase text-[#0F172A] dark:text-[#F8FAFC] mb-6">
              For Indian Government-School Teachers
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.15] text-[#0F172A] dark:text-[#F8FAFC] tracking-tight mb-6">
              Find out what each student needs to learn next.
            </h1>

            <p className="text-base sm:text-lg text-[#475569] dark:text-[#94A3B8] leading-relaxed mb-8">
              ShikshaGap checks a student&apos;s understanding, finds the topics that need more practice and helps teachers plan the next lesson.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#product-demo"
                className="border border-[#1D4ED8] bg-[#1D4ED8] text-white px-5 py-3 text-xs font-mono uppercase tracking-wider font-bold hover:bg-[#1E40AF] inline-flex items-center gap-2 min-h-[44px]"
              >
                <span>Try the 5-Step Demo</span>
              </a>

              <Link
                href="/login"
                className="border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] px-5 py-3 text-xs font-mono uppercase tracking-wider font-bold hover:bg-[#F1EFEA] dark:hover:bg-[#334155] inline-flex items-center gap-2 min-h-[44px]"
              >
                <User size={16} />
                <span>Teacher Sign In</span>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-[#CBD5E1] dark:border-[#334155] flex flex-wrap items-center gap-6 text-xs text-[#475569] dark:text-[#94A3B8] font-mono">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={15} className="text-[#15803D] dark:text-[#4ADE80]" />
                <span>English, Hindi and Telugu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-[#15803D] dark:text-[#4ADE80]" />
                <span>Student Privacy Protected (DPDP 2023)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={15} className="text-[#15803D] dark:text-[#4ADE80]" />
                <span>Works on Simple Phones</span>
              </div>
            </div>
          </div>
        </section>

        {/* Real Product Demonstration: 5-Step Workflow */}
        <section id="product-demo" className="border-b border-[#CBD5E1] dark:border-[#334155] px-4 sm:px-8 py-16 max-w-6xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-mono uppercase tracking-widest text-[#475569] dark:text-[#94A3B8]">
              Real Product Demonstration
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1 text-[#0F172A] dark:text-[#F8FAFC]">
              How ShikshaGap Works in Five Steps
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] mt-1 max-w-2xl">
              Tap through the five steps below to see how a teacher discovers why a student is struggling and builds a practical classroom practice plan.
            </p>
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6 font-mono text-xs uppercase">
            {[
              { num: 1, label: '1. Select Student' },
              { num: 2, label: '2. Check Learning' },
              { num: 3, label: '3. Find Gaps' },
              { num: 4, label: '4. Practice Plan' },
              { num: 5, label: '5. Check Again' },
            ].map((step) => {
              const isActive = activeWorkflowStep === step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => setActiveWorkflowStep(step.num as 1 | 2 | 3 | 4 | 5)}
                  className={`min-h-[44px] p-2.5 border text-center font-bold ${
                    isActive
                      ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                      : 'border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] hover:bg-[#F1EFEA] dark:hover:bg-[#334155]'
                  }`}
                >
                  {step.label}
                </button>
              );
            })}
          </div>

          {/* Demonstration Interactive Card */}
          <div className="border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-6">
            {/* Student Picker Bar */}
            <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-[#CBD5E1] dark:border-[#334155] gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#475569] dark:text-[#94A3B8] uppercase">Class 5A Demo Students:</span>
                <div className="flex gap-2">
                  {DEMO_WORKFLOW_STUDENTS.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStudentIndex(idx)}
                      className={`min-h-[36px] px-3 text-xs font-mono border ${
                        selectedStudentIndex === idx
                          ? 'border-[#0F172A] dark:border-[#F8FAFC] bg-[#0F172A] text-white dark:bg-[#F8FAFC] dark:text-[#0F172A] font-bold'
                          : 'border-[#CBD5E1] dark:border-[#334155] hover:bg-[#F1EFEA] dark:hover:bg-[#334155]'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs font-mono text-[#475569] dark:text-[#94A3B8]">
                Roll #{student.rollNo} | {student.grade}
              </div>
            </div>

            {/* STEP 1: Select a student */}
            {activeWorkflowStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold">Step 1: Select a student</h3>
                  <span className={`text-xs font-mono px-2 py-0.5 border ${
                    student.statusType === 'critical'
                      ? 'border-[#B91C1C] text-[#B91C1C] bg-[#FEE2E2] dark:bg-[#B91C1C]/20'
                      : student.statusType === 'warn'
                      ? 'border-[#B45309] text-[#B45309] bg-[#FEF3C7] dark:bg-[#B45309]/20'
                      : 'border-[#15803D] text-[#15803D] bg-[#DCFCE7] dark:bg-[#15803D]/20'
                  }`}>
                    {student.status}
                  </span>
                </div>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  The teacher views their classroom list and sees each student&apos;s current learning status.
                </p>

                <div className="border border-[#CBD5E1] dark:border-[#334155] p-4 bg-[#F8F7F4] dark:bg-[#0F172A]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                    <div>
                      <div className="text-[#475569] dark:text-[#94A3B8] uppercase text-[11px]">Student</div>
                      <div className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">{student.name}</div>
                    </div>
                    <div>
                      <div className="text-[#475569] dark:text-[#94A3B8] uppercase text-[11px]">Class Topic</div>
                      <div className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">{student.topic}</div>
                    </div>
                    <div>
                      <div className="text-[#475569] dark:text-[#94A3B8] uppercase text-[11px]">Current Understanding</div>
                      <div className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">{student.mastery}%</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(2)}
                    className="min-h-[44px] px-4 bg-[#1D4ED8] text-white text-xs font-mono uppercase font-bold hover:bg-[#1E40AF]"
                  >
                    Next: Check Learning
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Check learning */}
            {activeWorkflowStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold">Step 2: Check learning</h3>
                  <span className="text-xs font-mono text-[#475569] dark:text-[#94A3B8]">1 Question Check</span>
                </div>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  The student answers a simple question on a phone or tablet. The questions are short and easy to read.
                </p>

                <div className="border border-[#CBD5E1] dark:border-[#334155] p-5 bg-[#F8F7F4] dark:bg-[#0F172A] space-y-4">
                  <div className="font-serif text-base text-[#0F172A] dark:text-[#F8FAFC]">
                    {student.question}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {student.options.map((opt, i) => {
                      const isStudentChoice = opt === student.studentChoice;
                      const isCorrect = opt === student.correctOption;
                      return (
                        <div
                          key={i}
                          className={`p-3 border text-xs font-mono ${
                            isStudentChoice
                              ? isCorrect
                                ? 'border-[#15803D] bg-[#DCFCE7] text-[#15803D] font-bold'
                                : 'border-[#B91C1C] bg-[#FEE2E2] text-[#B91C1C] font-bold'
                              : 'border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B]'
                          }`}
                        >
                          <span>{opt}</span>
                          {isStudentChoice && (
                            <span className="ml-2 text-[10px] uppercase">
                              (Student answered this)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-xs text-[#475569] dark:text-[#94A3B8] font-mono">
                    Observed choice: <strong>{student.studentChoice}</strong> | Correct answer: <strong>{student.correctOption}</strong>
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(1)}
                    className="min-h-[44px] px-4 border border-[#CBD5E1] dark:border-[#334155] text-xs font-mono uppercase hover:bg-[#F1EFEA] dark:hover:bg-[#334155]"
                  >
                    Back to Step 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(3)}
                    className="min-h-[44px] px-4 bg-[#1D4ED8] text-white text-xs font-mono uppercase font-bold hover:bg-[#1E40AF]"
                  >
                    Next: Find Gaps
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Find gaps */}
            {activeWorkflowStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold">Step 3: Find gaps</h3>
                  <span className="text-xs font-mono text-[#B91C1C] font-bold uppercase">Evidence-Based</span>
                </div>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  ShikshaGap explains why the student struggled using evidence from the actual response.
                </p>

                <div className="border border-[#CBD5E1] dark:border-[#334155] p-5 bg-[#F8F7F4] dark:bg-[#0F172A] space-y-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#475569] dark:text-[#94A3B8]">
                      Skill Needed First
                    </span>
                    <div className="font-serif text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {student.rootGap}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#475569] dark:text-[#94A3B8]">
                      Why the student is struggling
                    </span>
                    <p className="text-xs text-[#0F172A] dark:text-[#F8FAFC] leading-relaxed mt-1">
                      {student.observedMistake}
                    </p>
                  </div>

                  <div className="p-3 border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-xs font-mono text-[#475569] dark:text-[#94A3B8]">
                    <strong>Evidence:</strong> {student.evidence}
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(2)}
                    className="min-h-[44px] px-4 border border-[#CBD5E1] dark:border-[#334155] text-xs font-mono uppercase hover:bg-[#F1EFEA] dark:hover:bg-[#334155]"
                  >
                    Back to Step 2
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(4)}
                    className="min-h-[44px] px-4 bg-[#1D4ED8] text-white text-xs font-mono uppercase font-bold hover:bg-[#1E40AF]"
                  >
                    Next: Practice Plan
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Make a practice plan */}
            {activeWorkflowStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold">Step 4: Make a practice plan</h3>
                  <span className="text-xs font-mono text-[#15803D] font-bold uppercase">5-Day Plan</span>
                </div>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  The teacher receives a short daily plan using common materials like pebbles, slates, and paper strips.
                </p>

                <div className="border border-[#CBD5E1] dark:border-[#334155] divide-y divide-[#CBD5E1] dark:divide-[#334155] bg-[#F8F7F4] dark:bg-[#0F172A]">
                  {student.plan.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-start gap-3 text-xs">
                      <span className="font-mono font-bold text-[#1D4ED8] shrink-0">{item.day}:</span>
                      <span className="text-[#0F172A] dark:text-[#F8FAFC]">{item.task}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(3)}
                    className="min-h-[44px] px-4 border border-[#CBD5E1] dark:border-[#334155] text-xs font-mono uppercase hover:bg-[#F1EFEA] dark:hover:bg-[#334155]"
                  >
                    Back to Step 3
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(5)}
                    className="min-h-[44px] px-4 bg-[#1D4ED8] text-white text-xs font-mono uppercase font-bold hover:bg-[#1E40AF]"
                  >
                    Next: Check Again
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Check progress again */}
            {activeWorkflowStep === 5 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold">Step 5: Check progress again</h3>
                  <span className="text-xs font-mono text-[#15803D] font-bold uppercase">Progress Confirmed</span>
                </div>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  After practice, the teacher gives a short reassessment to confirm the student has understood the topic.
                </p>

                <div className="border border-[#15803D] p-5 bg-[#DCFCE7]/30 dark:bg-[#15803D]/10 space-y-3">
                  <div className="flex items-center gap-2 text-[#15803D]">
                    <CheckCircle size={18} />
                    <span className="font-mono font-bold text-xs uppercase">Learning Verified</span>
                  </div>
                  <p className="text-xs text-[#0F172A] dark:text-[#F8FAFC] leading-relaxed">
                    {student.reassessmentResult}
                  </p>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(4)}
                    className="min-h-[44px] px-4 border border-[#CBD5E1] dark:border-[#334155] text-xs font-mono uppercase hover:bg-[#F1EFEA] dark:hover:bg-[#334155]"
                  >
                    Back to Step 4
                  </button>
                  <Link
                    href="/login"
                    className="min-h-[44px] px-4 bg-[#1D4ED8] text-white text-xs font-mono uppercase font-bold hover:bg-[#1E40AF] inline-flex items-center"
                  >
                    Open Live Teacher App
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Real Classroom Advantages (2-Column Layout, No 3-Card Bento Pattern) */}
        <section className="border-b border-[#CBD5E1] dark:border-[#334155] px-4 sm:px-8 py-16 max-w-6xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-mono uppercase tracking-widest text-[#475569] dark:text-[#94A3B8]">
              Built for Government Schools
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1 text-[#0F172A] dark:text-[#F8FAFC]">
              Designed for Daily Teaching Reality
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-[#CBD5E1] dark:border-[#334155] p-6 bg-white dark:bg-[#1E293B]">
              <div className="text-xs font-mono text-[#1D4ED8] font-bold mb-2">01 / NO SPECIAL HARDWARE</div>
              <h3 className="font-serif text-lg font-bold mb-2">Works on Inexpensive Android Phones</h3>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                Large touch targets and clear text ensure teachers can quickly use the app during classroom hours without technical delays.
              </p>
            </div>

            <div className="border border-[#CBD5E1] dark:border-[#334155] p-6 bg-white dark:bg-[#1E293B]">
              <div className="text-xs font-mono text-[#1D4ED8] font-bold mb-2">02 / THREE REGIONAL LANGUAGES</div>
              <h3 className="font-serif text-lg font-bold mb-2">English, Hindi and Telugu</h3>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                Questions, practice instructions, and teacher guidance are completely translated into regional languages so students can learn comfortably.
              </p>
            </div>

            <div className="border border-[#CBD5E1] dark:border-[#334155] p-6 bg-white dark:bg-[#1E293B]">
              <div className="text-xs font-mono text-[#1D4ED8] font-bold mb-2">03 / PRINTABLE PAPER SHEETS</div>
              <h3 className="font-serif text-lg font-bold mb-2">1-Page Worksheets for the Classroom</h3>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                Teachers can print a 1-page practice sheet with 5 tailored problems for each child to complete with a pencil during self-study.
              </p>
            </div>

            <div className="border border-[#CBD5E1] dark:border-[#334155] p-6 bg-white dark:bg-[#1E293B]">
              <div className="text-xs font-mono text-[#1D4ED8] font-bold mb-2">04 / STUDENT PRIVACY BY DESIGN</div>
              <h3 className="font-serif text-lg font-bold mb-2">Child Privacy Protected (DPDP 2023)</h3>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                We collect zero tracking cookies and never share student identities with third parties. Records belong to authorized teachers only.
              </p>
            </div>
          </div>
        </section>

        {/* Expandable FAQs */}
        <section id="faq" className="border-b border-[#CBD5E1] dark:border-[#334155] px-4 sm:px-8 py-16 max-w-6xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-mono uppercase tracking-widest text-[#475569] dark:text-[#94A3B8]">
              Teacher Inquiries
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1 text-[#0F172A] dark:text-[#F8FAFC]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3 max-w-3xl">
            {FAQS.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div key={index} className="border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B]">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="w-full text-left p-4 flex items-center justify-between gap-4 font-serif text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <CaretUp size={16} className="shrink-0" /> : <CaretDown size={16} className="shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed border-t border-[#CBD5E1] dark:border-[#334155]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* School Coordinator & Teacher Access Section */}
        <section className="px-4 sm:px-8 py-16 max-w-6xl mx-auto">
          <div className="border border-[#CBD5E1] dark:border-[#334155] p-8 bg-white dark:bg-[#1E293B]">
            <h2 className="font-serif text-2xl font-bold mb-2">School & Teacher Inquiries</h2>
            <p className="text-xs text-[#475569] dark:text-[#94A3B8] mb-6 max-w-2xl leading-relaxed">
              If you are a government-school teacher, headmaster, or academic mentor, you can sign in with your school account or request student data assistance.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <Link 
                href="/login" 
                className="border border-[#1D4ED8] bg-[#1D4ED8] text-white px-4 py-2 uppercase font-bold hover:bg-[#1E40AF]"
              >
                Sign In to Teacher Dashboard
              </Link>
              <Link 
                href="/data-request" 
                className="border border-[#CBD5E1] dark:border-[#334155] px-4 py-2 uppercase font-bold hover:bg-[#F1EFEA] dark:hover:bg-[#334155]"
              >
                Submit DPDP Data Request
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#CBD5E1] dark:border-[#334155] bg-[#F8F7F4] dark:bg-[#0F172A] px-4 sm:px-8 py-8 text-xs font-mono">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="font-serif text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              ShikshaGap
            </div>
            <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-1 max-w-md">
              Mathematics learning check and practice planning for Indian schools.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-[11px] uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
            <Link href="/how-it-works" className="hover:underline">How It Works</Link>
            <span>/</span>
            <Link href="/notices/guardian" className="hover:underline">Guardian Notice</Link>
            <span>/</span>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <span>/</span>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <span>/</span>
            <Link href="/cookies" className="hover:underline">Cookie Notice</Link>
            <span>/</span>
            <Link href="/licenses" className="hover:underline">Licenses</Link>
            <span>/</span>
            <Link href="/data-request" className="hover:underline">Data Request</Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-[#CBD5E1] dark:border-[#334155] flex flex-col sm:flex-row justify-between text-[10px] text-[#475569] dark:text-[#94A3B8]">
          <div>Copyright {currentYear} ShikshaGap. All rights reserved.</div>
          <div>Strictly necessary storage only. Zero third-party tracking.</div>
        </div>
      </footer>
    </div>
  );
}
