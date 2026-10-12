'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import { 
  CheckCircle, 
  ShieldCheck,
  CaretDown, 
  Sun, 
  Moon, 
  List, 
  X, 
  Lock, 
  ArrowRight,
  Clock,
  FileText
} from '@phosphor-icons/react';
import { useI18n, LanguageProvider } from '@/lib/i18n/context';
import type { Lang } from '@/lib/types';
import { 
  ENABLED_CLASSES, 
  getClassConfig, 
  DEFAULT_CLASS_ID 
} from '@/lib/curriculum/classes';
import { siteConfig } from '@/config/site';
import { ClassSelector } from '@/components/ClassSelector';
import { generateQuestion } from '@/lib/questions/generator';
import { makeRng } from '@/lib/rng';
import { motion } from 'motion/react';
import { LuminousType } from '@/components/LuminousType';
import { BlinkingDots } from '@/components/BlinkingDots';
import { CountUp } from '@/components/CountUp';
import { MascotHero } from '@/components/illustrations/MascotHero';
import { MathFloatingShapes } from '@/components/illustrations/MathFloatingShapes';
import { ProblemIllustration, SolutionIllustration } from '@/components/illustrations/ProblemSolutionIllustrations';
import { 
  DagBentoIllustration, 
  LanguagesBentoIllustration, 
  WorksheetBentoIllustration, 
  PrivacyBentoIllustration 
} from '@/components/illustrations/BentoIllustrations';
import { WorksheetPreviewIllustration } from '@/components/illustrations/WorksheetPreviewIllustration';
import { SuccessIllustration } from '@/components/illustrations/StateIllustrations';


// Seeded workflow demo records per enabled class (clearly marked Demo data)
const MULTICLASS_DEMO_DATA: Record<string, Array<{
  id: string;
  name: string;
  rollNo: number;
  gradeLabel: string;
  topic: string;
  status: string;
  statusType: 'critical' | 'warn' | 'good';
  mastery: number;
  question: string;
  options: string[];
  correctOption: string;
  studentChoice: string;
  observedMistake: string;
  rootGap: string;
  prerequisiteFor: string;
  evidence: string;
  plan: Array<{ day: string; task: string }>;
  reassessmentResult: string;
}>> = {
  class_3: [
    {
      id: 'demo-c3-1',
      name: 'Anil Kumar',
      rollNo: 4,
      gradeLabel: 'Class 3A',
      topic: '2-Digit Subtraction with Regrouping',
      status: 'Needs Immediate Help',
      statusType: 'critical',
      mastery: 38,
      question: 'Solve: 52 - 27 = ?',
      options: ['35', '25', '30', '21'],
      correctOption: '25',
      studentChoice: '35',
      observedMistake: 'Subtracted smaller digit from larger digit (7 - 2 = 5) instead of borrowing from tens',
      rootGap: 'Place Value and Regrouping (Tens to Units)',
      prerequisiteFor: '2-Digit Subtraction with Regrouping',
      evidence: 'Student wrote 52 - 27 = 35 by reversing the ones place subtraction.',
      plan: [
        { day: 'Day 1', task: 'Use bundles of 10 matchsticks and loose sticks to model 52.' },
        { day: 'Day 2', task: 'Untie one ten-bundle into 10 loose sticks to show borrowing clearly.' },
        { day: 'Day 3', task: 'Practice subtracting loose sticks after regrouping.' },
        { day: 'Day 4', task: 'Write place value columns on slate and solve 3 regrouping sums.' },
        { day: 'Day 5', task: 'Check understanding with 2 new subtraction problems.' }
      ],
      reassessmentResult: 'Student solved 52 - 27 and 61 - 38 correctly with physical bundles and column notation.'
    },
    {
      id: 'demo-c3-2',
      name: 'Meena Bai',
      rollNo: 11,
      gradeLabel: 'Class 3A',
      topic: 'Repeated Addition (Multiplication Concept)',
      status: 'Needs Practice',
      statusType: 'warn',
      mastery: 58,
      question: 'There are 4 plates. Each plate has 3 bananas. How many bananas in all?',
      options: ['7 bananas', '12 bananas', '10 bananas', '15 bananas'],
      correctOption: '12 bananas',
      studentChoice: '7 bananas',
      observedMistake: 'Added the numbers 4 + 3 instead of counting 4 equal groups of 3',
      rootGap: 'Equal Groups Concept',
      prerequisiteFor: 'Multiplication Facts',
      evidence: 'Student added 4 and 3 directly without visualizing 4 separate plates of 3.',
      plan: [
        { day: 'Day 1', task: 'Arrange pebbles in 4 circles with 3 pebbles in each circle.' },
        { day: 'Day 2', task: 'Skip count aloud by threes: 3, 6, 9, 12.' },
        { day: 'Day 3', task: 'Write repeated addition: 3 + 3 + 3 + 3 = 12.' },
        { day: 'Day 4', task: 'Connect to multiplication sentence: 4 times 3 equals 12.' },
        { day: 'Day 5', task: 'Complete 4 grouping drawing problems.' }
      ],
      reassessmentResult: 'Student recognized that 5 groups of 2 equals 10, not 7.'
    }
  ],
  class_4: [
    {
      id: 'demo-c4-1',
      name: 'Pooja Reddy',
      rollNo: 9,
      gradeLabel: 'Class 4A',
      topic: 'Sharing Division Concept',
      status: 'Needs Immediate Help',
      statusType: 'critical',
      mastery: 42,
      question: 'Share 20 marbles equally among 4 friends. How many marbles does each friend get?',
      options: ['16 marbles', '5 marbles', '6 marbles', '4 marbles'],
      correctOption: '5 marbles',
      studentChoice: '16 marbles',
      observedMistake: 'Subtracted 4 from 20 once instead of sharing equally into 4 equal shares',
      rootGap: 'Equal Sharing Partitioning',
      prerequisiteFor: 'Division Facts and Long Division',
      evidence: 'Student calculated 20 - 4 = 16 and stopped.',
      plan: [
        { day: 'Day 1', task: 'Distribute 20 bottle caps one by one into 4 bowls.' },
        { day: 'Day 2', task: 'Draw 4 circles and share 12 dots equally to confirm the idea.' },
        { day: 'Day 3', task: 'Connect to the 4 times multiplication table: 4 x 5 = 20.' },
        { day: 'Day 4', task: 'Solve 3 simple sharing word problems on the board.' },
        { day: 'Day 5', task: 'Complete a 1-page paper worksheet with sharing problems.' }
      ],
      reassessmentResult: 'Student accurately shared 18 items into 3 bowls without subtracting.'
    },
    {
      id: 'demo-c4-2',
      name: 'Sunil Rao',
      rollNo: 15,
      gradeLabel: 'Class 4A',
      topic: 'Unit Fractions (Part of a Whole)',
      status: 'Needs Practice',
      statusType: 'warn',
      mastery: 62,
      question: 'Which is larger: 1/3 or 1/6 of the same chapati?',
      options: ['1/6 is larger', '1/3 is larger', 'Both are equal', 'Cannot tell'],
      correctOption: '1/3 is larger',
      studentChoice: '1/6 is larger',
      observedMistake: 'Believed 1/6 is larger because 6 is a bigger number than 3',
      rootGap: 'Denominator Size Meaning',
      prerequisiteFor: 'Comparing Fractions',
      evidence: 'Student treated denominator as a whole number without seeing slice size.',
      plan: [
        { day: 'Day 1', task: 'Fold two circular paper chapatis into 3 parts and 6 parts.' },
        { day: 'Day 2', task: 'Place one 1/3 slice over a 1/6 slice to see which piece is larger.' },
        { day: 'Day 3', task: 'Learn the rule: more slices mean smaller slices.' },
        { day: 'Day 4', task: 'Draw and color 1/2, 1/4, and 1/8 on strip drawings.' },
        { day: 'Day 5', task: 'Short 3-question paper check comparing unit fractions.' }
      ],
      reassessmentResult: 'Student proved on paper that 1/4 is bigger than 1/8.'
    }
  ],
  class_5: [
    {
      id: 'demo-c5-1',
      name: 'Rajesh Kumar',
      rollNo: 7,
      gradeLabel: 'Class 5A',
      topic: 'Long Division with Remainder',
      status: 'Needs Immediate Help',
      statusType: 'critical',
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
      id: 'demo-c5-2',
      name: 'Priya Sharma',
      rollNo: 12,
      gradeLabel: 'Class 5A',
      topic: 'Fractions (Part of a Whole)',
      status: 'Needs Practice',
      statusType: 'warn',
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
      id: 'demo-c5-3',
      name: 'Amit Patel',
      rollNo: 19,
      gradeLabel: 'Class 5A',
      topic: 'Place Value and Regrouping',
      status: 'On Track',
      statusType: 'good',
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
  ]
};

import { FAQS } from '@/data/faqs';

export default function PublicLandingPage() {
  return (
    <LanguageProvider>
      <PublicLandingPageContent />
    </LanguageProvider>
  );
}

function PublicLandingPageContent() {
  const { lang, setLang } = useI18n();
  const [selectedClassId, setSelectedClassId] = useState<string>(DEFAULT_CLASS_ID);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Pilot form state
  const [pilotSchool, setPilotSchool] = useState('');
  const [pilotTeacher, setPilotTeacher] = useState('');
  const [pilotClassRange, setPilotClassRange] = useState('Classes 3 to 5');
  const [pilotContact, setPilotContact] = useState('');
  const [pilotHoneypot, setPilotHoneypot] = useState('');
  const [pilotConsent, setPilotConsent] = useState(true);
  const [pilotLoading, setPilotLoading] = useState(false);
  const [pilotSuccess, setPilotSuccess] = useState<string | null>(null);
  const [pilotReferenceId, setPilotReferenceId] = useState<string | null>(null);
  const [pilotError, setPilotError] = useState<string | null>(null);
  const [pilotFieldErrors, setPilotFieldErrors] = useState<{
    school?: string;
    teacher?: string;
    contact?: string;
    consent?: string;
  }>({});

  const schoolInputId = useId();
  const teacherInputId = useId();
  const classRangeInputId = useId();
  const contactInputId = useId();
  const consentInputId = useId();

  // Dynamic class configuration and students
  const activeClassConfig = getClassConfig(selectedClassId);
  const classStudents = MULTICLASS_DEMO_DATA[selectedClassId] || MULTICLASS_DEMO_DATA.class_5;
  const currentStudent = classStudents[selectedStudentIndex] || classStudents[0];

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedStudentIndex(0);
    setActiveWorkflowStep(1);
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Pilot registration submission handler with full client validation & error states
  const handlePilotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPilotError(null);
    setPilotSuccess(null);
    setPilotReferenceId(null);

    const errors: { school?: string; teacher?: string; contact?: string; consent?: string } = {};
    if (!pilotSchool.trim()) {
      errors.school = 'School name is required.';
    }
    if (!pilotTeacher.trim()) {
      errors.teacher = 'Teacher or headmaster name is required.';
    }
    const cleanContact = pilotContact.trim();
    if (!cleanContact) {
      errors.contact = 'Contact phone number or email address is required.';
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContact);
      const isPhone = /^[6-9]\d{9}$/.test(cleanContact.replace(/[\s-+]/g, ''));
      if (!isEmail && !isPhone) {
        errors.contact = 'Please enter a valid 10-digit mobile number or email address.';
      }
    }
    if (!pilotConsent) {
      errors.consent = 'You must accept the privacy policy to submit a pilot request.';
    }

    if (Object.keys(errors).length > 0) {
      setPilotFieldErrors(errors);
      return;
    }

    setPilotFieldErrors({});
    setPilotLoading(true);

    try {
      const res = await fetch('/api/pilot-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: pilotSchool.trim(),
          teacherName: pilotTeacher.trim(),
          classRange: pilotClassRange,
          contact: pilotContact.trim(),
          honeypot: pilotHoneypot,
          privacyConsent: pilotConsent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request.');
      }

      setPilotSuccess(data.message || 'Thank you! Your school pilot request has been registered.');
      setPilotReferenceId(data.referenceId || null);
      setPilotSchool('');
      setPilotTeacher('');
      setPilotContact('');
    } catch (err: unknown) {
      const msg = err instanceof TypeError && err.message.includes('fetch')
        ? 'Network request failed. Please check your internet connectivity and try again.'
        : err instanceof Error
        ? err.message
        : 'An unexpected error occurred while submitting.';
      setPilotError(msg);
    } finally {
      setPilotLoading(false);
    }
  };

  // Dynamic worksheet preview sample question
  const targetConcept = activeClassConfig.targetConcepts[0] || 'mult_facts';
  const previewRng = makeRng(42);
  const previewSampleQ1 = generateQuestion(targetConcept, 1, previewRng);
  const previewSampleQ2 = generateQuestion(targetConcept, 2, previewRng);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        'name': 'ShikshaGap',
        'applicationCategory': 'EducationalApplication',
        'operatingSystem': 'Web Browser',
        'description': 'AI agent that assesses students across Classes 3 to 5 and finds their foundational learning gaps.',
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
    <div className="min-h-screen bg-[#FAF8E8] dark:bg-[#251614] text-[#432623] dark:text-[#FAF8E8] font-sans flex flex-col selection:bg-[#DE2A35] selection:text-[#FAF8E8] pb-16 sm:pb-0 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Accessible Skip Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#DE2A35] focus:text-[#FAF8E8] text-xs font-mono uppercase border border-[#432623]"
      >
        Skip to main content
      </a>

      {/* TOP MASTHEAD DATELINE */}
      <div className="bg-[#FAF8E8] dark:bg-[#251614] border-b border-[#432623]/20 px-4 sm:px-8 py-1.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#FAF8E8]/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Vol. 2026 / Issue No. 05 hidden per teacher clarity requirements */}
          <span className="hidden">VOL. 2026 | ISSUE NO. 05</span>
          <span className="font-bold text-[#DE2A35]">PRIMARY MATHEMATICS</span>
          <span className="opacity-40 hidden md:inline">|</span>
          <span className="hidden md:inline">FOUNDATIONAL LEARNING GAP DIAGNOSTIC</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">INDIAN PRIMARY SCHOOLS EDITION</span>
          <span className="opacity-40 hidden sm:inline">|</span>
          <span className="text-[#DE2A35] font-bold">BUILT FOLLOWING DPDP ACT 2023 PRINCIPLES</span>
        </div>
      </div>

      {/* STICKY NAVBAR with thin rule divider */}
      <header className="sticky top-0 z-50 bg-[#FAF8E8]/95 dark:bg-[#251614]/95 backdrop-blur-xs border-b border-[#432623]/25 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#432623] dark:text-[#FAF8E8] flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-[2px] bg-[#DE2A35] text-[#FAF8E8] font-mono text-xs flex items-center justify-center font-bold tracking-normal shadow-xs">
                SG
              </span>
              <span className="tracking-tighter">ShikshaGap</span>
            </Link>
            <span className="hidden sm:inline-block border border-[#432623]/30 text-[10px] font-mono uppercase px-2 py-0.5 bg-[#F5F1BC]/60 dark:bg-[#311E1B] text-[#432623] dark:text-[#FAF8E8] font-bold">
              AI Diagnostic Agent
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-5 text-[11px] font-mono uppercase tracking-wider text-[#432623]/80 dark:text-[#FAF8E8]/80" aria-label="Main Navigation">
              <a href="#cover" className="hover:text-[#DE2A35] transition-colors">01 Cover</a>
              <a href="#how-agent-works" className="hover:text-[#DE2A35] transition-colors">02 How Agent Works</a>
              <a href="#demo" className="hover:text-[#DE2A35] transition-colors">03 Interactive Cases</a>
              <a href="#faq" className="hover:text-[#DE2A35] transition-colors">04 FAQ</a>
            </nav>

            {/* Language Switcher (EN / हिन्दी / తెలుగు) */}
            <div className="flex items-center border border-[#432623]/30 dark:border-[#FAF8E8]/30 rounded-[2px] p-0.5 text-xs font-mono bg-[#F5F1BC]/40 dark:bg-[#311E1B]">
              {(['en', 'hi', 'te'] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`min-h-[44px] sm:min-h-[36px] px-2.5 rounded-[2px] font-bold cursor-pointer transition-none focus-visible:outline-2 focus-visible:outline-[#DE2A35] ${
                    lang === l
                      ? 'bg-[#432623] text-[#FAF8E8] dark:bg-[#FAF8E8] dark:text-[#432623]'
                      : 'text-[#432623]/70 dark:text-[#FAF8E8]/70 hover:text-[#432623] dark:hover:text-[#FAF8E8]'
                  }`}
                  aria-label={`Switch language to ${l === 'en' ? 'English' : l === 'hi' ? 'Hindi' : 'Telugu'}`}
                >
                  {l === 'en' ? 'EN' : l === 'hi' ? 'हिन्दी' : 'తెలుగు'}
                </button>
              ))}
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="min-w-[44px] min-h-[44px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center border border-[#432623]/30 dark:border-[#FAF8E8]/30 bg-transparent hover:bg-[#F5F1BC] dark:hover:bg-[#311E1B] text-[#432623] dark:text-[#FAF8E8] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#DE2A35]"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Secondary Link: Sign In (Quiet) */}
            <Link
              href="/login"
              className="hidden sm:inline-flex border border-[#432623]/30 dark:border-[#FAF8E8]/30 bg-transparent text-[#432623] dark:text-[#FAF8E8] px-3 py-2 min-h-[44px] sm:min-h-[38px] items-center text-xs font-mono uppercase font-bold hover:bg-[#F5F1BC]/60 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#DE2A35]"
            >
              Sign In
            </Link>

            {/* PRIMARY ACTION: ASSESS TEST BUTTON (Sticky Navbar) */}
            <Link
              href="/app"
              className="inline-flex border-2 border-[#DE2A35] bg-[#DE2A35] text-[#FAF8E8] px-4 sm:px-5 py-2 min-h-[40px] items-center text-xs font-mono uppercase font-bold hover:bg-[#B51E28] focus-visible:outline-2 focus-visible:outline-[#DE2A35] cursor-pointer shadow-xs active:translate-y-[1px] tracking-wider"
            >
              <span>Assess Test</span>
              <ArrowRight size={13} className="ml-1.5" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center border border-[#432623]/30 dark:border-[#FAF8E8]/30 bg-transparent text-[#432623] dark:text-[#FAF8E8] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#DE2A35]"
            >
              {isMobileMenuOpen ? <X size={18} /> : <List size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-[#432623]/20 dark:border-[#FAF8E8]/20 flex flex-col gap-2 font-mono text-xs uppercase tracking-wider">
            <Link
              href="/app"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[48px] flex items-center justify-center px-4 border-2 border-[#DE2A35] bg-[#DE2A35] text-[#FAF8E8] font-bold text-sm tracking-wider"
            >
              Assess Test (Start Assessment)
            </Link>
            <a
              href="#cover"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[42px] flex items-center px-3 border border-[#432623]/20 bg-[#F5F1BC]/50 dark:bg-[#311E1B]"
            >
              01 Cover Story
            </a>
            <a
              href="#how-agent-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[42px] flex items-center px-3 border border-[#432623]/20 bg-[#F5F1BC]/50 dark:bg-[#311E1B]"
            >
              02 How Agent Works
            </a>
            <a
              href="#demo"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[42px] flex items-center px-3 border border-[#432623]/20 bg-[#F5F1BC]/50 dark:bg-[#311E1B]"
            >
              03 Interactive Workflow
            </a>
            <a
              href="#faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[42px] flex items-center px-3 border border-[#432623]/20 bg-[#F5F1BC]/50 dark:bg-[#311E1B]"
            >
              04 Inquiries & FAQ
            </a>
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[42px] flex items-center justify-center px-3 border border-[#432623]/30 bg-transparent text-[#432623] dark:text-[#FAF8E8] font-bold"
            >
              Teacher Sign In
            </Link>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main id="main-content" className="flex-1">

        {/* SECTION 01: HERO MAGAZINE COVER (With Primary "Assess Test" Button Above the Fold) */}
        <section id="cover" className="relative border-b border-[#432623]/25 overflow-hidden bg-[#FAF8E8] dark:bg-[#251614]">
          
          {/* Top Editorial Hairline & Issue Badge */}
          <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6 pb-2 flex flex-wrap items-center justify-between gap-2 border-b border-[#432623]/15 text-[11px] font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#FAF8E8]/70">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#DE2A35] rounded-full inline-block"></span>
              <span className="font-bold text-[#432623] dark:text-[#FAF8E8]">01 / THE COVER STORY</span>
              <span className="opacity-40">|</span>
              <span className="text-[#DE2A35] font-bold">ISSUE / CLASS 5 MATHS</span>
            </div>
            <div>
              <span>AI LEARNING GAP AGENT : FREE FOR GOVT SCHOOLS</span>
            </div>
          </div>

          {/* MAGAZINE COVER HERO STAGE */}
          {/* Wrapper is position: relative, headline at z-10, cutout PNG at z-20, foreground content and Assess Test at z-30 */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-8 min-h-[640px] sm:min-h-[720px] lg:min-h-[800px] flex flex-col justify-between overflow-hidden">

            {/* LAYER 1 (z-10): GIGANTIC EDITORIAL HEADLINE BEHIND THE CUTOUT */}
            <div className="absolute inset-0 z-10 flex flex-col justify-center items-center pointer-events-none select-none px-2 sm:px-6">
              <div className="w-full text-center">
                <h1 className="font-serif uppercase tracking-tight text-[#432623] dark:text-[#FAF8E8] leading-[0.84] text-[clamp(3.6rem,11.5vw,10.5rem)] m-0">
                  <span className="block whitespace-nowrap">
                    <LuminousType text="WHAT EACH student" italicIndices={[2]} />
                  </span>
                  <span className="block whitespace-nowrap">
                    <LuminousType text="NEEDS TO learn NEXT" italicIndices={[2]} />
                  </span>
                </h1>
                <div className="mt-2 text-xs sm:text-sm font-mono tracking-widest uppercase text-[#432623]/60 dark:text-[#FAF8E8]/60">
                  SHIKSHAGAP AI AGENT : ADAPTIVE DIAGNOSTIC FOR CLASSES 3, 4 & 5
                </div>
              </div>
            </div>

            {/* FLOATING MATH SHAPES BACKGROUND DRIFT */}
            <MathFloatingShapes />

            {/* LAYER 2 (z-20): 2D CARTOON OWL MASCOT ("GAPPU") ON BOOKS */}
            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center pointer-events-auto">
              <div className="relative w-[280px] sm:w-[380px] lg:w-[460px] flex items-end justify-center pb-2">
                <MascotHero
                  width={460}
                  height={560}
                  className="w-full max-w-[420px] drop-shadow-md"
                />
              </div>
            </div>

            {/* LAYER 3 (z-30): FOREGROUND CALLOUT WITH PRIMARY 'ASSESS TEST' BUTTON (Above both layers, never covered) */}
            <div className="relative z-30 pt-4 sm:pt-6 pb-6 flex-1 flex flex-col justify-between pointer-events-none">
              
              {/* Upper Section: Primary Agent Action Card (Prominent & immediately visible above the fold on mobile & desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pointer-events-auto">
                <div className="md:col-span-5 bg-[#FAF8E8]/95 dark:bg-[#251614]/95 p-5 sm:p-6 border-2 border-[#432623]/30 backdrop-blur-xs max-w-md shadow-md">
                  
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#DE2A35] font-bold mb-1.5">
                    <BlinkingDots count={3} activeColor="#DE2A35" />
                    <span>AI DIAGNOSTIC AGENT</span>
                  </div>

                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#432623] dark:text-[#FAF8E8] mb-2 leading-snug">
                    Find the exact concept blocking your student.
                  </h2>

                  {/* Copy describing the agent: what it assesses, how long it takes, and what student gets */}
                  <div className="space-y-1.5 mb-4 text-xs font-mono text-[#432623]/80 dark:text-[#FAF8E8]/80 border-t border-b border-[#432623]/15 py-2.5">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#DE2A35] w-20 shrink-0 uppercase text-[10px]">Assesses:</span>
                      <span>Foundational Math in Classes 3 to 5 (place value, regrouping, fractions, division)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#DE2A35] w-20 shrink-0 uppercase text-[10px]">Time:</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> 6 to 8 minutes per child</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#DE2A35] w-20 shrink-0 uppercase text-[10px]">Output:</span>
                      <span className="flex items-center gap-1"><FileText size={12} /> Root gap report & 5-day classroom plan</span>
                    </div>
                  </div>

                  {/* PRIMARY ACTION BUTTON: ASSESS TEST (Single most prominent button on the page) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <motion.div
                      whileHover={{ y: -1, scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="inline-block"
                    >
                      <Link
                        href="/app"
                        className="border-2 border-[#DE2A35] bg-[#DE2A35] text-[#FAF8E8] px-6 py-3.5 min-h-[50px] inline-flex items-center justify-center gap-2 text-sm font-mono uppercase tracking-wider font-bold hover:bg-[#B51E28] focus-visible:outline-2 focus-visible:outline-[#DE2A35] cursor-pointer shadow-md active:translate-y-[1px] transition-transform duration-150"
                      >
                        <span>Assess Test</span>
                        <ArrowRight size={16} />
                      </Link>
                    </motion.div>

                    {/* Visually quieter secondary button */}
                    <a
                      href="#how-agent-works"
                      className="border border-[#432623]/30 dark:border-[#FAF8E8]/30 bg-transparent text-[#432623] dark:text-[#FAF8E8] px-4 py-2.5 min-h-[44px] inline-flex items-center justify-center text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#F5F1BC]/60 cursor-pointer transition-none"
                    >
                      See how it works
                    </a>
                  </div>

                  <div className="mt-3 text-[10px] font-mono text-[#432623]/60 dark:text-[#FAF8E8]/60 flex items-center gap-2">
                    <ShieldCheck size={13} className="text-[#8ABB93]" />
                    <span>No login required for initial classroom trial</span>
                  </div>
                </div>

                {/* Right Side: Issue Contents */}
                <div className="hidden md:block md:col-start-9 md:col-span-4 bg-[#FAF8E8]/90 dark:bg-[#251614]/90 p-4 border border-[#432623]/25 backdrop-blur-xs text-right">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#8ABB93] font-bold mb-1">
                    WHAT IS INSIDE
                  </div>
                  <ul className="text-xs font-mono space-y-1.5 text-[#432623]/80 dark:text-[#FAF8E8]/80">
                    <li><span className="text-[#DE2A35] font-bold">p. 02</span> : The 42% Test Score Fallacy</li>
                    <li><span className="text-[#DE2A35] font-bold">p. 04</span> : How the AI Agent Traces Gaps</li>
                    <li><span className="text-[#DE2A35] font-bold">p. 07</span> : Live Student Gap Report Sample</li>
                    <li><span className="text-[#DE2A35] font-bold">p. 12</span> : Printable 1-Page A4 Worksheets</li>
                  </ul>
                  <div className="mt-3 pt-2 border-t border-[#432623]/20 text-[10px] font-mono text-[#432623]/60 dark:text-[#FAF8E8]/60">
                    MADE SPECIFICALLY FOR INDIAN GOVT SCHOOLS
                  </div>
                </div>
              </div>

              {/* Lower Bar: Editorial Cutout Caption & Sample Barcode */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mt-auto pt-6 pointer-events-auto">
                <div className="md:col-span-5 bg-[#FAF8E8]/95 dark:bg-[#251614]/95 p-3 border border-[#432623]/25">
                  <div className="text-[10px] font-mono uppercase text-[#DE2A35] font-bold">
                    FIGURE 1.0: GAPPU THE DIAGNOSTIC OWL
                  </div>
                  <p className="text-[11px] text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-snug mt-0.5">
                    Friendly AI agent mascot Gappu analyzing foundational math prerequisites. Interactive mascot winks and bobs as it tracks Class 3 and 4 skills that stall multi-digit division.
                  </p>
                </div>

                <div className="hidden md:flex md:col-start-9 md:col-span-4 justify-end">
                  <div className="bg-[#FAF8E8]/95 dark:bg-[#251614]/95 border border-[#432623]/25 p-2.5 text-center font-mono">
                    <div className="text-[9px] tracking-widest text-[#432623]/60 dark:text-[#FAF8E8]/60 uppercase">
                      SAMPLE NO. 2026-SG-AGENT
                    </div>
                    <div className="text-sm font-mono tracking-widest font-bold text-[#432623] dark:text-[#FAF8E8] mt-0.5">
                      ||| | |||| || ||| |||||
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 02: THE CLASSROOM DILEMMA */}
        <section className="border-b border-[#432623]/25 px-4 sm:px-8 py-12 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#FAF8E8]/70 mb-4">
            <span className="text-[#DE2A35] font-bold">02</span>
            <span>/</span>
            <span>THE CLASSROOM DILEMMA</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Pull Quote */}
            <div className="lg:col-span-5 border-l-2 border-[#DE2A35] pl-5 py-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#DE2A35] font-bold block mb-2">
                THE PROBLEM
              </span>
              <blockquote className="font-serif text-2xl sm:text-3xl lg:text-4xl leading-tight text-[#432623] dark:text-[#FAF8E8]">
                A student scores 42% on a test. The mark confirms struggle, but conceals the root cause.
              </blockquote>
              <div className="mt-4 text-xs font-mono text-[#432623]/70 dark:text-[#FAF8E8]/70">
                DESIGNED FOR TELANGANA AND ANDHRA PRADESH CLASSROOMS
              </div>
            </div>

            {/* Two Side-by-Side Hairline Columns */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-[#432623]/20 bg-[#F5F1BC]/30 dark:bg-[#311E1B]/50 p-5 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#DE2A35] font-bold mb-1">
                    The Dilemma
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#432623] dark:text-[#FAF8E8] mb-2">
                    Repeating current class problems creates frustration.
                  </h3>
                  <p className="text-xs text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed mb-4">
                    When a Class 5 child fails long division, giving 20 more division sums fails. The real gap is almost always in Class 3 regrouping or Class 4 multiplication table fluency.
                  </p>
                </div>
                <div className="pt-2 flex justify-center">
                  <ProblemIllustration />
                </div>
              </div>

              <div className="border border-[#432623]/20 bg-[#8ABB93]/15 dark:bg-[#8ABB93]/10 p-5 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#8ABB93] font-bold mb-1">
                    The AI Agent Solution
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#432623] dark:text-[#FAF8E8] mb-2">
                    Traces the prerequisite gap and generates a 5-day plan.
                  </h3>
                  <p className="text-xs text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed mb-4">
                    ShikshaGap backtracks through the curriculum DAG to identify whether the missing link began in Class 3, 4, or 5, then produces a concrete 5-day plan with single-sheet paper printouts.
                  </p>
                </div>
                <div className="pt-2 flex justify-center">
                  <SolutionIllustration />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 03: HOW THE AGENT WORKS (With Live Gap Report & Worksheet Visual) */}
        <section id="how-agent-works" className="border-b border-[#432623]/25 px-4 sm:px-8 py-12 max-w-7xl mx-auto bg-[#F5F1BC]/20 dark:bg-[#311E1B]/30">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#432623]/20 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#FAF8E8]/70">
                <span className="text-[#DE2A35] font-bold">03</span>
                <span>/</span>
                <span>HOW THE AI AGENT WORKS : VISUAL SAMPLES</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-normal mt-1 text-[#432623] dark:text-[#FAF8E8]">
                From 6-Minute Check to Actionable Gap Report
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/app"
                className="border-2 border-[#DE2A35] bg-[#DE2A35] text-[#FAF8E8] px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-[#B51E28] cursor-pointer"
              >
                Start an Assessment Now
              </Link>
            </div>
          </div>

          {/* 2-Part Visual Specimen Grid: Gap Report Specimen & Printable Practice Worksheet */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Visual Specimen 1: Student Gap Report */}
            <div className="border-2 border-[#432623]/30 bg-[#FAF8E8] dark:bg-[#251614] p-6 shadow-sm space-y-4">
              <div className="border-b border-[#432623]/20 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#DE2A35] font-bold">
                    SAMPLE REPORT
                  </span>
                  <h3 className="font-serif text-xl font-bold">Student Gap Report</h3>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-mono px-2 py-1 bg-[#DE2A35]/15 text-[#DE2A35] border border-[#DE2A35]/30 font-bold">
                    Class 5A : 42%
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#FAF8E8] dark:bg-[#251614] text-[#432623]/80 dark:text-[#FAF8E8]/80 border border-[#432623]/20">
                    Sample data. Not a real student.
                  </span>
                </div>
              </div>

              {/* Diagnosed Root Gap */}
              <div className="border border-[#432623]/20 p-4 bg-[#F5F1BC]/40 dark:bg-[#311E1B]/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#432623]/70 dark:text-[#FAF8E8]/70 uppercase text-[10px]">Student:</span>
                  <strong>Rajesh Kumar (Roll #7)</strong>
                </div>
                <div className="text-xs font-mono">
                  <span className="text-[#DE2A35] font-bold uppercase text-[10px] block">Diagnosed Root Cause:</span>
                  <p className="font-serif text-base font-bold text-[#DE2A35]">
                    Class 3 Subtraction Regrouping (Tens to Units Borrowing)
                  </p>
                </div>
                <p className="text-xs text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed italic border-t border-[#432623]/15 pt-2">
                  &ldquo;Student attempted long division in 24 / 6 by subtracting 6 repeatedly, but subtracted the smaller ones digit from the larger digit without borrowing.&rdquo;
                </p>
              </div>

              {/* Prerequisite Backtracking Graph Trail */}
              <div className="border border-[#432623]/20 p-3 bg-white dark:bg-[#311E1B] space-y-2 text-xs font-mono">
                <span className="text-[10px] uppercase font-bold text-[#432623]/70 dark:text-[#FAF8E8]/70 block">
                  AI Agent Backtracking Trail:
                </span>
                <div className="flex items-center justify-between text-[11px] bg-[#FAF8E8] dark:bg-[#251614] p-2 border border-[#432623]/15">
                  <span className="text-[#DE2A35] font-bold">Class 3 Place Value</span>
                  <ArrowRight size={12} className="text-[#DE2A35]" />
                  <span className="text-[#DE2A35] font-bold">Class 4 Mult Facts</span>
                  <ArrowRight size={12} className="text-[#DE2A35]" />
                  <span className="text-[#432623]/60 dark:text-[#FAF8E8]/60">Class 5 Long Division</span>
                </div>
              </div>

              {/* 5-Day Plan Summary */}
              <div className="border border-[#8ABB93]/50 p-3 bg-[#8ABB93]/10 space-y-1.5 text-xs font-mono">
                <span className="text-[10px] uppercase font-bold text-[#432623] dark:text-[#FAF8E8] block">
                  Prescribed 5-Day Classroom Sequence:
                </span>
                <div className="text-[11px] text-[#432623]/80 dark:text-[#FAF8E8]/80">
                  Day 1 to 2: Physical pebble bundles for grouping. Day 3: Inverse facts on slate. Day 4 to 5: Single-sheet paper checks.
                </div>
              </div>
            </div>

            {/* Visual Specimen 2: Single-Sheet Printable Practice Worksheet */}
            <div className="border-2 border-[#432623]/30 p-6 bg-[#FAF8E8] text-[#432623] rounded-[2px] shadow-sm space-y-4">
              <div className="border-b border-[#432623]/30 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#432623]/70 font-bold">
                    SAMPLE WORKSHEET
                  </span>
                  <h3 className="font-serif text-xl font-bold">1-Page Paper Worksheet</h3>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-mono px-2 py-1 bg-[#8ABB93]/20 border border-[#8ABB93] text-[#432623] font-bold">
                    Standard A4 Print
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#FAF8E8] text-[#432623]/80 border border-[#432623]/20">
                    Sample data. Not a real student.
                  </span>
                </div>
              </div>
              <div className="flex justify-center py-2">
                <WorksheetPreviewIllustration className="max-w-[170px]" />
              </div>

              <div className="grid grid-cols-3 gap-2 border border-[#432623]/20 p-2 text-[11px] font-mono bg-[#F5F1BC]/50">
                <div>STUDENT: <strong>Rajesh Kumar</strong></div>
                <div>ROLL NO: <strong>#7</strong></div>
                <div className="text-right">CLASS: <strong>5A</strong></div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#432623]/70">
                  Target Skill: Equal Sharing Division Concept
                </div>

                <div className="border border-[#432623]/20 p-3 space-y-1 bg-white">
                  <div className="text-xs font-bold font-sans">1. Solve the following problem:</div>
                  <div className="text-sm font-mono font-bold">{previewSampleQ1.expression || '4 x 6 = ?'}</div>
                  <div className="h-8 border-b border-dashed border-[#432623]/30 flex items-end text-[10px] text-[#432623]/50 font-mono">
                    Answer: _______________________
                  </div>
                </div>

                <div className="border border-[#432623]/20 p-3 space-y-1 bg-white">
                  <div className="text-xs font-bold font-sans">2. Solve the following problem:</div>
                  <div className="text-sm font-mono font-bold">{previewSampleQ2.expression || '7 x 8 = ?'}</div>
                  <div className="h-8 border-b border-dashed border-[#432623]/30 flex items-end text-[10px] text-[#432623]/50 font-mono">
                    Answer: _______________________
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] font-mono text-[#432623]/60 border-t border-[#432623]/15">
                Deterministic Question Bank : Generated for Student Diagnosis : Form SG-A4-2026
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 04: PRODUCT DEMO (5-Step Interactive Case Dossier) */}
        <section id="demo" className="border-b border-[#432623]/25 px-4 sm:px-8 py-12 max-w-7xl mx-auto">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#432623]/20 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#FAF8E8]/70">
                <span className="text-[#DE2A35] font-bold">04</span>
                <span>/</span>
                <span>INTERACTIVE WORKFLOW CASE FILES</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-normal mt-1 text-[#432623] dark:text-[#FAF8E8]">
                How the Agent Runs in Five Steps
              </h2>
            </div>
            <p className="text-xs font-mono text-[#432623]/70 dark:text-[#FAF8E8]/70 max-w-md">
              Select a class and student record below to test diagnostic checking, DAG backtracking, and 5-day practice sequences.
            </p>
          </div>

          {/* Class Selector Bar */}
          <div className="mb-6 p-4 border border-[#432623]/20 bg-[#F5F1BC]/40 dark:bg-[#311E1B]/60">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#432623]/70 dark:text-[#FAF8E8]/70 mb-2 font-bold">
              Select Grade to Explore Curriculum Cases:
            </div>
            <ClassSelector
              selectedClassId={selectedClassId}
              onSelectClass={handleClassChange}
            />
          </div>

          {/* Stepper Buttons (Hairline Editorial Numbered Navigation) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6 font-mono text-xs uppercase">
            {[
              { num: 1, label: '01. Select Student' },
              { num: 2, label: '02. Check Learning' },
              { num: 3, label: '03. Find Gaps' },
              { num: 4, label: '04. Practice Plan' },
              { num: 5, label: '05. Check Again' },
            ].map((step) => {
              const isActive = activeWorkflowStep === step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => setActiveWorkflowStep(step.num as 1 | 2 | 3 | 4 | 5)}
                  className={`min-h-[44px] p-2.5 border text-center font-bold cursor-pointer transition-none ${
                    isActive
                      ? 'border-[#DE2A35] bg-[#DE2A35] text-[#FAF8E8]'
                      : 'border-[#432623]/25 bg-[#FAF8E8] dark:bg-[#251614] text-[#432623] dark:text-[#FAF8E8] hover:bg-[#F5F1BC] dark:hover:bg-[#311E1B]'
                  }`}
                >
                  {step.label}
                </button>
              );
            })}
          </div>

          {/* Interactive Stepper Content Card */}
          <div className="border-2 border-[#432623]/30 bg-[#FAF8E8] dark:bg-[#251614] p-5 sm:p-7 shadow-xs">
            {/* Student selection bar */}
            <div className="flex flex-wrap items-center justify-between pb-4 mb-5 border-b border-[#432623]/20 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#432623]/70 dark:text-[#FAF8E8]/70 uppercase font-bold">
                  {activeClassConfig.label} Case Records:
                </span>
                <div className="flex gap-2">
                  {classStudents.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStudentIndex(idx)}
                      className={`min-h-[36px] px-3 border text-xs font-mono cursor-pointer transition-none ${
                        selectedStudentIndex === idx
                          ? 'border-[#432623] dark:border-[#FAF8E8] bg-[#432623] text-[#FAF8E8] dark:bg-[#FAF8E8] dark:text-[#432623] font-bold'
                          : 'border-[#432623]/20 bg-transparent text-[#432623] dark:text-[#FAF8E8] hover:bg-[#F5F1BC]'
                      }`}
                    >
                      {s.name} ({s.gradeLabel})
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs font-mono text-[#432623]/70 dark:text-[#FAF8E8]/70">
                Roll No: #{currentStudent.rollNo}
              </div>
            </div>

            {/* STEP 1 */}
            {activeWorkflowStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold">Step 1: Student Diagnostic Profile</h3>
                  <span className="text-xs font-mono px-2 py-0.5 border border-[#432623]/20 bg-[#F5F1BC]/60 dark:bg-[#311E1B]">
                    Initial Status: {currentStudent.status}
                  </span>
                </div>
                <p className="text-xs text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed">
                  The teacher or agent selects <strong>{currentStudent.name}</strong> from {currentStudent.gradeLabel}. Current evaluated topic: <em>{currentStudent.topic}</em>. Initial estimated mastery is {currentStudent.mastery}%.
                </p>

                <div className="border border-[#432623]/20 p-4 bg-[#F5F1BC]/30 dark:bg-[#311E1B]/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[#432623]/60 dark:text-[#FAF8E8]/60 uppercase block text-[10px]">Student Name</span>
                    <strong className="text-sm">{currentStudent.name}</strong>
                  </div>
                  <div>
                    <span className="text-[#432623]/60 dark:text-[#FAF8E8]/60 uppercase block text-[10px]">Topic Under Assessment</span>
                    <strong>{currentStudent.topic}</strong>
                  </div>
                  <div>
                    <span className="text-[#432623]/60 dark:text-[#FAF8E8]/60 uppercase block text-[10px]">Diagnostic Standing</span>
                    <strong className={currentStudent.statusType === 'critical' ? 'text-[#DE2A35]' : 'text-[#8ABB93]'}>
                      {currentStudent.status} ({currentStudent.mastery}%)
                    </strong>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(2)}
                    className="min-h-[44px] px-5 bg-[#DE2A35] text-[#FAF8E8] text-xs font-mono uppercase font-bold hover:bg-[#B51E28] cursor-pointer"
                  >
                    Next: Check Learning
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {activeWorkflowStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl sm:text-2xl font-bold">Step 2: Diagnostic Check Question</h3>
                <p className="text-xs text-[#432623]/80 dark:text-[#FAF8E8]/80">
                  The student answers a diagnostic question calibrated specifically for {currentStudent.topic}.
                </p>

                <div className="border border-[#432623]/20 p-4 bg-[#FAF8E8] dark:bg-[#251614] space-y-3">
                  <div className="text-xs font-mono text-[#DE2A35] font-bold uppercase">Diagnostic Item:</div>
                  <div className="text-sm font-bold font-mono">{currentStudent.question}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2">
                    {currentStudent.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`p-2 border ${
                          opt === currentStudent.studentChoice
                            ? 'border-[#DE2A35] bg-[#DE2A35]/10 font-bold'
                            : 'border-[#432623]/20'
                        }`}
                      >
                        Option {i + 1}: {opt}
                        {opt === currentStudent.studentChoice && ' (Student Choice)'}
                        {opt === currentStudent.correctOption && ' (Correct Key)'}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(1)}
                    className="min-h-[44px] px-4 border border-[#432623]/20 text-xs font-mono uppercase hover:bg-[#F5F1BC] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(3)}
                    className="min-h-[44px] px-5 bg-[#DE2A35] text-[#FAF8E8] text-xs font-mono uppercase font-bold hover:bg-[#B51E28] cursor-pointer"
                  >
                    Next: Find Gaps
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {activeWorkflowStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl sm:text-2xl font-bold">Step 3: Root Cause Analysis</h3>
                <p className="text-xs text-[#432623]/80 dark:text-[#FAF8E8]/80">
                  The system analyzes the error and traces the prerequisite gap back through the curriculum DAG.
                </p>

                <div className="border border-[#432623]/20 p-4 bg-[#F5F1BC]/30 dark:bg-[#311E1B]/30 space-y-3 text-xs">
                  <div>
                    <span className="font-mono text-[#DE2A35] font-bold uppercase block text-[10px]">Observed Error Pattern:</span>
                    <p className="text-[#432623] dark:text-[#FAF8E8] mt-0.5">{currentStudent.observedMistake}</p>
                  </div>
                  <div className="border-t border-[#432623]/15 pt-2">
                    <span className="font-mono text-[#432623]/60 dark:text-[#FAF8E8]/60 uppercase block text-[10px]">Diagnosed Root Gap:</span>
                    <strong className="text-sm font-serif text-[#DE2A35]">{currentStudent.rootGap}</strong>
                  </div>
                  <div className="border-t border-[#432623]/15 pt-2">
                    <span className="font-mono text-[#432623]/60 dark:text-[#FAF8E8]/60 uppercase block text-[10px]">Foundational Prerequisite For:</span>
                    <p>{currentStudent.prerequisiteFor}</p>
                  </div>
                  <div className="border-t border-[#432623]/15 pt-2">
                    <span className="font-mono text-[#432623]/60 dark:text-[#FAF8E8]/60 uppercase block text-[10px]">Diagnostic Evidence:</span>
                    <p className="italic text-[#432623]/80 dark:text-[#FAF8E8]/80">{currentStudent.evidence}</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(2)}
                    className="min-h-[44px] px-4 border border-[#432623]/20 text-xs font-mono uppercase hover:bg-[#F5F1BC] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(4)}
                    className="min-h-[44px] px-5 bg-[#DE2A35] text-[#FAF8E8] text-xs font-mono uppercase font-bold hover:bg-[#B51E28] cursor-pointer"
                  >
                    Next: Practice Plan
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {activeWorkflowStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl sm:text-2xl font-bold">Step 4: 5-Day Classroom Practice Plan</h3>
                <p className="text-xs text-[#432623]/80 dark:text-[#FAF8E8]/80">
                  A concrete, manipulative-assisted 5-day classroom sequence for the teacher.
                </p>

                <div className="border border-[#432623]/20 p-4 bg-[#FAF8E8] dark:bg-[#251614] space-y-2.5">
                  {currentStudent.plan.map((p, i) => (
                    <div key={i} className="flex gap-3 text-xs border-b border-[#432623]/15 pb-2 last:border-b-0 last:pb-0">
                      <span className="font-mono font-bold text-[#DE2A35] w-14 shrink-0">{p.day}:</span>
                      <span className="text-[#432623]/80 dark:text-[#FAF8E8]/80">{p.task}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(3)}
                    className="min-h-[44px] px-4 border border-[#432623]/20 text-xs font-mono uppercase hover:bg-[#F5F1BC] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(5)}
                    className="min-h-[44px] px-5 bg-[#DE2A35] text-[#FAF8E8] text-xs font-mono uppercase font-bold hover:bg-[#B51E28] cursor-pointer"
                  >
                    Next: Check Again
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5 */}
            {activeWorkflowStep === 5 && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl sm:text-2xl font-bold">Step 5: Verification & Check Again</h3>
                <p className="text-xs text-[#432623]/80 dark:text-[#FAF8E8]/80">
                  After 5 days of practice, the student is checked again to verify mastery.
                </p>

                <div className="border border-[#8ABB93] p-4 bg-[#8ABB93]/15 space-y-2">
                  <div className="flex items-center gap-2 text-[#432623] dark:text-[#FAF8E8] font-mono font-bold text-xs uppercase">
                    <CheckCircle size={16} className="text-[#8ABB93]" />
                    <span>Learning Verified on Paper & Slate</span>
                  </div>
                  <p className="text-xs text-[#432623] dark:text-[#FAF8E8] leading-relaxed">
                    {currentStudent.reassessmentResult}
                  </p>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(4)}
                    className="min-h-[44px] px-4 border border-[#432623]/20 text-xs font-mono uppercase hover:bg-[#F5F1BC] cursor-pointer"
                  >
                    Back to Step 4
                  </button>
                  <Link
                    href="/app"
                    className="min-h-[44px] px-5 bg-[#DE2A35] text-[#FAF8E8] text-xs font-mono uppercase font-bold hover:bg-[#B51E28] inline-flex items-center cursor-pointer shadow-xs"
                  >
                    Assess Test Now
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 05: PULL-QUOTE STYLE STAT ROW */}
        <section className="border-b border-[#432623]/25 px-4 sm:px-8 py-12 max-w-7xl mx-auto bg-[#F5F1BC]/30 dark:bg-[#311E1B]/40">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#FAF8E8]/70 mb-4">
            <span className="text-[#DE2A35] font-bold">05</span>
            <span>/</span>
            <span>VITAL STATISTICS : THE CURRICULUM FOOTPRINT</span>
          </div>

          {/* Editorial Pull-Quote */}
          <div className="max-w-4xl mb-10">
            <blockquote className="font-serif text-2xl sm:text-3xl lg:text-4xl leading-tight text-[#432623] dark:text-[#FAF8E8]">
              &ldquo;A curriculum map of 15 connected concepts, taught across 3 Indian regional languages, with zero tracking cookies and built following DPDP Act 2023 principles.&rdquo;
            </blockquote>
          </div>

          {/* Asymmetric Hairline Stat Columns */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-[#432623]/20">
            <div className="border-l border-[#432623]/30 pl-4 py-1">
              <div className="font-serif text-5xl sm:text-6xl font-normal text-[#DE2A35] leading-none">
                <CountUp end={15} />
              </div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#432623]/80 dark:text-[#FAF8E8]/80 mt-2 font-bold">
                Concepts in DAG
              </div>
              <div className="text-[10px] text-[#432623]/60 dark:text-[#FAF8E8]/60 mt-0.5">
                Single unified acyclic prerequisite graph
              </div>
            </div>

            <div className="border-l border-[#432623]/30 pl-4 py-1">
              <div className="font-serif text-5xl sm:text-6xl font-normal text-[#432623] dark:text-[#FAF8E8] leading-none">
                0<CountUp end={3} />
              </div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#432623]/80 dark:text-[#FAF8E8]/80 mt-2 font-bold">
                Languages Supported
              </div>
              <div className="text-[10px] text-[#432623]/60 dark:text-[#FAF8E8]/60 mt-0.5">
                Full translation in English, हिन्दी and తెలుగు
              </div>
            </div>

            <div className="border-l border-[#432623]/30 pl-4 py-1">
              <div className="font-serif text-5xl sm:text-6xl font-normal text-[#DFA06E] leading-none">
                0<CountUp end={ENABLED_CLASSES.length} />
              </div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#432623]/80 dark:text-[#FAF8E8]/80 mt-2 font-bold">
                Classes Enabled (3, 4, 5)
              </div>
              <div className="text-[10px] text-[#432623]/60 dark:text-[#FAF8E8]/60 mt-0.5">
                Aligned to Class 3 to 5 maths topics
              </div>
            </div>

            <div className="border-l border-[#432623]/30 pl-4 py-1">
              <div className="font-serif text-5xl sm:text-6xl font-normal text-[#8ABB93] leading-none">
                00
              </div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#432623]/80 dark:text-[#FAF8E8]/80 mt-2 font-bold">
                Tracking Cookies
              </div>
              <div className="text-[10px] text-[#432623]/60 dark:text-[#FAF8E8]/60 mt-0.5">
                Local device session storage only
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 06: CURRICULUM ARCHITECTURE (Bento Grid) */}
        <section className="border-b border-[#432623]/25 px-4 sm:px-8 py-12 max-w-7xl mx-auto">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#432623]/20 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#FAF8E8]/70">
                <span className="text-[#DE2A35] font-bold">06</span>
                <span>/</span>
                <span>CURRICULUM ARCHITECTURE</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-normal mt-1 text-[#432623] dark:text-[#FAF8E8]">
                Built for Indian Government School Classrooms
              </h2>
            </div>
            <p className="text-xs font-mono text-[#432623]/70 dark:text-[#FAF8E8]/70 max-w-md">
              Engineered for multi-grade classrooms, non-English speakers, limited internet, and zero child tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Tile 1: Wide */}
            <div className="md:col-span-2 border border-[#432623]/25 p-6 bg-[#FAF8E8] dark:bg-[#251614] flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-mono text-[#DE2A35] font-bold mb-1 uppercase tracking-wider">
                    01 : Prerequisite Tracing Engine
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold mb-2">
                    Traces Missing Skills Across Grade Boundaries
                  </h3>
                  <p className="text-xs text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed mb-4">
                    When a Class 5 student fails a long division task, the system automatically traverses backwards to check whether the breakdown began in Class 3 repeated addition or Class 4 multiplication facts.
                  </p>
                </div>
                <div className="shrink-0 flex justify-center pb-2 sm:pb-0">
                  <DagBentoIllustration className="w-36 h-auto" />
                </div>
              </div>
              <div className="border border-[#432623]/20 p-3 bg-[#F5F1BC]/40 dark:bg-[#311E1B]/50 flex items-center justify-between text-[11px] font-mono">
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
                  <span className="text-[10px] font-mono text-[#DFA06E] font-bold uppercase tracking-wider">
                    02 : Three Regional Languages
                  </span>
                  <LanguagesBentoIllustration className="w-16 h-auto" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold mb-2">
                  Native Vernacular Fluency
                </h3>
                <p className="text-xs text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed mb-4">
                  Questions, diagnostic instructions, hints, and practice sheets are completely translated for native regional language classrooms.
                </p>
              </div>
              <div className="flex gap-2 font-mono text-xs">
                <span className="px-2.5 py-1 border border-[#432623]/20 bg-[#F5F1BC]/50 dark:bg-[#311E1B]">English</span>
                <span className="px-2.5 py-1 border border-[#432623]/20 bg-[#F5F1BC]/50 dark:bg-[#311E1B] font-bold">हिन्दी</span>
                <span className="px-2.5 py-1 border border-[#432623]/20 bg-[#F5F1BC]/50 dark:bg-[#311E1B] font-bold">తెలుగు</span>
              </div>
            </div>

            {/* Tile 3: Square */}
            <div className="border border-[#432623]/25 p-6 bg-[#FAF8E8] dark:bg-[#251614] flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#8ABB93] font-bold uppercase tracking-wider">
                    03 : Printable Worksheets
                  </span>
                  <WorksheetBentoIllustration className="w-16 h-auto" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold mb-2">
                  Single-Page Paper Sheets
                </h3>
                <p className="text-xs text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed mb-4">
                  Print ready-to-use worksheets for students who do not have personal smartphones or internet access at home.
                </p>
              </div>
              <div className="border border-[#432623]/20 p-2.5 bg-[#F5F1BC]/40 dark:bg-[#311E1B]/50 text-center text-[10px] font-mono uppercase text-[#432623]/70 dark:text-[#FAF8E8]/70">
                Standard A4 / Single Sheet Print Format
              </div>
            </div>

            {/* Tile 4: Wide */}
            <div className="md:col-span-2 border border-[#432623]/25 p-6 bg-[#FAF8E8] dark:bg-[#251614] flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-mono text-[#432623] dark:text-[#FAF8E8] font-bold mb-1 uppercase tracking-wider">
                    04 : Child Privacy by Design
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold mb-2">
                    Built Following DPDP Act 2023 Principles & Zero Surveillance
                  </h3>
                  <p className="text-xs text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed mb-4">
                    Zero tracking cookies, zero third-party advertising trackers, and strictly necessary local storage only. Children are never profiled.
                  </p>
                </div>
                <div className="shrink-0 flex justify-center pb-2 sm:pb-0">
                  <PrivacyBentoIllustration className="w-20 h-auto" />
                </div>
              </div>
              <div className="border border-[#432623]/20 p-3 bg-[#F5F1BC]/40 dark:bg-[#311E1B]/50 flex items-center gap-4 text-[11px] font-mono text-[#432623]/70 dark:text-[#FAF8E8]/70">
                <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-[#8ABB93]" /> Cookies: 0</span>
                <span className="flex items-center gap-1"><Lock size={14} className="text-[#8ABB93]" /> Third-Party Scripts: 0</span>
                <span>Storage: Local Device Only</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 07: FIELD PARTNERSHIPS & PILOT FORM */}
        <section id="pilot" className="border-b border-[#432623]/25 px-4 sm:px-8 py-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Letter to School Leaders */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#FAF8E8]/70">
                <span className="text-[#DE2A35] font-bold">07</span>
                <span>/</span>
                <span>FIELD PARTNERSHIPS</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#432623] dark:text-[#FAF8E8]">
                Request a Classroom Pilot
              </h2>
              <p className="text-xs text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed">
                Government primary schools, headmasters, and cluster resource persons can request dedicated classroom onboarding support.
              </p>
              <div className="border-l-2 border-[#8ABB93] pl-4 py-2 space-y-2 text-xs font-mono text-[#432623]/70 dark:text-[#FAF8E8]/70">
                <div>Zero license fee for public schools.</div>
                <div>Includes physical printable templates.</div>
                <div>Built following DPDP Act 2023 principles.</div>
              </div>
            </div>

            {/* Right Column: Form or Confirmation Card */}
            <div className="lg:col-span-7">
              {pilotSuccess ? (
                <div className="border-2 border-[#8ABB93] p-6 sm:p-8 bg-[#FAF8E8] dark:bg-[#251614] text-center space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                  <SuccessIllustration className="w-20 h-16 mx-auto mb-2" />
                  
                  <div className="text-xs font-mono uppercase tracking-widest text-[#8ABB93] font-bold">
                    Registration Confirmed
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#432623] dark:text-[#FAF8E8]">
                    School Pilot Request Received
                  </h3>

                  {pilotReferenceId && (
                    <div className="inline-block px-3 py-1 bg-[#8ABB93]/15 border border-[#8ABB93] font-mono text-xs text-[#432623] dark:text-[#FAF8E8] font-bold">
                      Reference ID: {pilotReferenceId}
                    </div>
                  )}

                  <p className="text-xs text-[#432623]/80 dark:text-[#FAF8E8]/80 max-w-md mx-auto leading-relaxed">
                    {pilotSuccess} Our academic team will verify school details and contact you to provision classroom diagnostic materials and printable worksheets.
                  </p>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      href="/app"
                      className="w-full sm:w-auto min-h-[44px] px-6 bg-[#DE2A35] text-[#FAF8E8] text-xs font-mono uppercase font-bold inline-flex items-center justify-center gap-2 hover:bg-[#B51E28] transition-colors"
                    >
                      <span>Assess Test (Start Assessment)</span>
                      <ArrowRight size={14} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setPilotSuccess(null);
                        setPilotReferenceId(null);
                      }}
                      className="w-full sm:w-auto min-h-[44px] px-4 border border-[#432623]/30 dark:border-[#FAF8E8]/30 bg-transparent text-[#432623] dark:text-[#FAF8E8] text-xs font-mono uppercase hover:bg-[#F5F1BC] dark:hover:bg-[#311E1B] transition-colors cursor-pointer"
                    >
                      Submit Another Request
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePilotSubmit} noValidate className="border-2 border-[#432623]/25 p-6 bg-[#FAF8E8] dark:bg-[#251614] space-y-4 shadow-xs">
                  {/* Bot Honeypot */}
                  <input
                    type="text"
                    name="school_url_confirm"
                    value={pilotHoneypot}
                    onChange={(e) => setPilotHoneypot(e.target.value)}
                    className="sr-only"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  {/* School Name */}
                  <div>
                    <label htmlFor={schoolInputId} className="block text-xs font-mono uppercase text-[#432623]/70 dark:text-[#FAF8E8]/70 mb-1 font-bold">
                      School Name *
                    </label>
                    <input
                      id={schoolInputId}
                      type="text"
                      required
                      value={pilotSchool}
                      onChange={(e) => {
                        setPilotSchool(e.target.value);
                        if (pilotFieldErrors.school) setPilotFieldErrors((prev) => ({ ...prev, school: undefined }));
                      }}
                      placeholder="e.g. MPPS Gandhi Nagar"
                      aria-invalid={!!pilotFieldErrors.school}
                      className={`w-full min-h-[44px] px-3 border bg-[#FAF8E8] dark:bg-[#251614] text-xs font-mono ${
                        pilotFieldErrors.school
                          ? 'border-[#DE2A35] ring-1 ring-[#DE2A35]'
                          : 'border-[#432623]/25 focus:border-[#DE2A35]'
                      }`}
                    />
                    {pilotFieldErrors.school && (
                      <p className="text-[11px] font-mono text-[#DE2A35] mt-1">{pilotFieldErrors.school}</p>
                    )}
                  </div>

                  {/* Teacher Name */}
                  <div>
                    <label htmlFor={teacherInputId} className="block text-xs font-mono uppercase text-[#432623]/70 dark:text-[#FAF8E8]/70 mb-1 font-bold">
                      Teacher or Headmaster Name *
                    </label>
                    <input
                      id={teacherInputId}
                      type="text"
                      required
                      value={pilotTeacher}
                      onChange={(e) => {
                        setPilotTeacher(e.target.value);
                        if (pilotFieldErrors.teacher) setPilotFieldErrors((prev) => ({ ...prev, teacher: undefined }));
                      }}
                      placeholder="e.g. Smt. Lakshmi Rao"
                      aria-invalid={!!pilotFieldErrors.teacher}
                      className={`w-full min-h-[44px] px-3 border bg-[#FAF8E8] dark:bg-[#251614] text-xs font-mono ${
                        pilotFieldErrors.teacher
                          ? 'border-[#DE2A35] ring-1 ring-[#DE2A35]'
                          : 'border-[#432623]/25 focus:border-[#DE2A35]'
                      }`}
                    />
                    {pilotFieldErrors.teacher && (
                      <p className="text-[11px] font-mono text-[#DE2A35] mt-1">{pilotFieldErrors.teacher}</p>
                    )}
                  </div>

                  {/* Class Range */}
                  <div>
                    <label htmlFor={classRangeInputId} className="block text-xs font-mono uppercase text-[#432623]/70 dark:text-[#FAF8E8]/70 mb-1 font-bold">
                      Class Range *
                    </label>
                    <select
                      id={classRangeInputId}
                      value={pilotClassRange}
                      onChange={(e) => setPilotClassRange(e.target.value)}
                      className="w-full min-h-[44px] px-3 border border-[#432623]/25 bg-[#FAF8E8] dark:bg-[#251614] text-xs font-mono"
                    >
                      <option value="Classes 3 to 5">Classes 3 to 5 (Full support)</option>
                      <option value="Class 3">Class 3 only</option>
                      <option value="Class 4">Class 4 only</option>
                      <option value="Class 5">Class 5 only</option>
                      <option value="All Primary (Classes 1 to 5)">All Primary (Classes 1 to 5)</option>
                    </select>
                  </div>

                  {/* Contact */}
                  <div>
                    <label htmlFor={contactInputId} className="block text-xs font-mono uppercase text-[#432623]/70 dark:text-[#FAF8E8]/70 mb-1 font-bold">
                      Teacher Contact (Phone or Email) *
                    </label>
                    <input
                      id={contactInputId}
                      type="text"
                      required
                      value={pilotContact}
                      onChange={(e) => {
                        setPilotContact(e.target.value);
                        if (pilotFieldErrors.contact) setPilotFieldErrors((prev) => ({ ...prev, contact: undefined }));
                      }}
                      placeholder="e.g. 9876543210 or teacher@school.edu"
                      aria-invalid={!!pilotFieldErrors.contact}
                      className={`w-full min-h-[44px] px-3 border bg-[#FAF8E8] dark:bg-[#251614] text-xs font-mono ${
                        pilotFieldErrors.contact
                          ? 'border-[#DE2A35] ring-1 ring-[#DE2A35]'
                          : 'border-[#432623]/25 focus:border-[#DE2A35]'
                      }`}
                    />
                    {pilotFieldErrors.contact && (
                      <p className="text-[11px] font-mono text-[#DE2A35] mt-1">{pilotFieldErrors.contact}</p>
                    )}
                  </div>

                  {/* Privacy Consent */}
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      id={consentInputId}
                      type="checkbox"
                      required
                      checked={pilotConsent}
                      onChange={(e) => {
                        setPilotConsent(e.target.checked);
                        if (pilotFieldErrors.consent) setPilotFieldErrors((prev) => ({ ...prev, consent: undefined }));
                      }}
                      className="mt-1"
                    />
                    <label htmlFor={consentInputId} className="text-[11px] text-[#432623]/70 dark:text-[#FAF8E8]/70 leading-tight">
                      I agree that this contact will be used strictly for school pilot onboarding in accordance with our{' '}
                      <Link href="/privacy" className="underline hover:text-[#432623] dark:hover:text-[#FAF8E8]">
                        Privacy Policy
                      </Link>.
                    </label>
                  </div>
                  {pilotFieldErrors.consent && (
                    <p className="text-[11px] font-mono text-[#DE2A35]">{pilotFieldErrors.consent}</p>
                  )}

                  {/* General / Network Error */}
                  {pilotError && (
                    <div className="p-3 border border-[#DE2A35] bg-[#DE2A35]/15 text-[#DE2A35] text-xs font-mono" role="alert">
                      {pilotError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="submit"
                      disabled={pilotLoading}
                      className="w-full sm:w-auto min-h-[44px] px-6 bg-[#DE2A35] text-[#FAF8E8] text-xs font-mono uppercase font-bold hover:bg-[#B51E28] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-[#DE2A35] flex items-center justify-center gap-2"
                    >
                      {pilotLoading && (
                        <span className="w-3.5 h-3.5 border-2 border-[#FAF8E8] border-t-transparent rounded-full animate-spin"></span>
                      )}
                      <span>{pilotLoading ? 'Submitting...' : 'Submit Pilot Request'}</span>
                    </button>
                    <span className="text-[10px] text-[#432623]/60 dark:text-[#FAF8E8]/60 font-mono">
                      DPDP 2023 protected : Masked storage
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 08: INQUIRIES & FAQ (Accordion) */}
        <section id="faq" className="border-b border-[#432623]/25 px-4 sm:px-8 py-12 max-w-7xl mx-auto">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#432623]/20 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#FAF8E8]/70">
                <span className="text-[#DE2A35] font-bold">08</span>
                <span>/</span>
                <span>INQUIRIES &amp; FAQ</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-normal mt-1 text-[#432623] dark:text-[#FAF8E8]">
                Frequently Asked Questions
              </h2>
            </div>
            <p className="text-xs font-mono text-[#432623]/70 dark:text-[#FAF8E8]/70 max-w-md">
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
                  <div className="p-4 sm:p-5 pt-0 text-xs text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed border-t border-[#432623]/15">
                    {faq.a}
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        {/* SECTION 09: FINAL EDITORIAL DISPATCH CTA (Repeats Primary Assess Test Button) */}
        <section className="border-b border-[#432623]/25 px-4 sm:px-8 py-16 max-w-7xl mx-auto text-center bg-[#F5F1BC]/40 dark:bg-[#311E1B]/50">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#DE2A35] font-bold">
              GET STARTED
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#432623] dark:text-[#FAF8E8] tracking-tight">
              Start an assessment to find student learning gaps today.
            </h2>
            <p className="text-xs sm:text-sm text-[#432623]/80 dark:text-[#FAF8E8]/80 max-w-xl mx-auto leading-relaxed">
              A 6-minute adaptive test gives you the exact prerequisite concept holding each student back, with a 5-day action plan. Free for government schools during the pilot.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              {/* PRIMARY ACTION: ASSESS TEST BUTTON (Final CTA) */}
              <Link
                href="/app"
                className="min-h-[52px] px-8 bg-[#DE2A35] text-[#FAF8E8] text-sm font-mono uppercase font-bold hover:bg-[#B51E28] focus-visible:outline-2 focus-visible:outline-[#DE2A35] inline-flex items-center gap-2 cursor-pointer shadow-md active:translate-y-[1px] tracking-wider"
              >
                <span>Assess Test</span>
                <ArrowRight size={16} />
              </Link>

              {/* Visually quieter secondary button */}
              <a
                href="#pilot"
                className="min-h-[48px] px-6 border border-[#432623]/40 dark:border-[#FAF8E8]/40 bg-[#FAF8E8] dark:bg-[#251614] text-[#432623] dark:text-[#FAF8E8] text-xs font-mono uppercase font-bold hover:bg-[#F5F1BC] inline-flex items-center cursor-pointer"
              >
                Request School Pilot
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 10: EDITORIAL COLOPHON & FOOTER */}
      <footer className="border-t border-[#432623]/25 bg-[#FAF8E8] dark:bg-[#251614] px-4 sm:px-8 py-12 text-xs font-mono">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-[#432623]/20">
          <div>
            <div className="font-serif text-2xl font-bold text-[#432623] dark:text-[#FAF8E8] flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-[2px] bg-[#DE2A35] text-[#FAF8E8] font-mono text-[10px] flex items-center justify-center font-bold">
                SG
              </span>
              <span>ShikshaGap</span>
            </div>
            <p className="text-[11px] text-[#432623]/70 dark:text-[#FAF8E8]/70 mt-2 max-w-md leading-relaxed">
              AI-powered learning gap detection and personalized remediation for Indian primary schools, Classes 3 to 5.
            </p>
            <div className="mt-4 text-[10px] text-[#432623]/60 dark:text-[#FAF8E8]/60">
              Built Following DPDP Act 2023 Principles | Made for Indian Government Schools
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 justify-between md:justify-end text-[11px] uppercase tracking-wider text-[#432623]/70 dark:text-[#FAF8E8]/70">
            <div className="space-y-2 flex flex-col">
              <span className="font-bold text-[#432623] dark:text-[#FAF8E8]">Diagnostic Actions</span>
              <Link href="/app" className="text-[#DE2A35] font-bold hover:underline">Assess Test Now</Link>
              <a href="#how-agent-works" className="hover:text-[#DE2A35]">How Agent Works</a>
              <a href="#demo" className="hover:text-[#DE2A35]">Interactive Demo</a>
              <a href="#pilot" className="hover:text-[#DE2A35]">Request Pilot</a>
              <Link href="/login" className="hover:text-[#DE2A35]">Teacher Sign In</Link>
            </div>
            <div className="space-y-2 flex flex-col">
              <span className="font-bold text-[#432623] dark:text-[#FAF8E8]">Legal & Governance</span>
              <Link href="/privacy" className="hover:text-[#DE2A35]">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-[#DE2A35]">Terms of Service</Link>
              <Link href="/cookies" className="hover:text-[#DE2A35]">Cookie Notice</Link>
              <Link href="/notices/guardian" className="hover:text-[#DE2A35]">Guardian Notice</Link>
              <Link href="/data-request" className="hover:text-[#DE2A35]">Data Request</Link>
              <Link href="/licenses" className="hover:text-[#DE2A35]">Licenses</Link>
            </div>
            <div className="space-y-2 flex flex-col">
              <span className="font-bold text-[#432623] dark:text-[#FAF8E8]">Official Contact</span>
              <div className="text-[11px] text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-snug">
                <span>Email: </span>
                <a href={`mailto:${siteConfig.contactEmail}`} className="text-[#DE2A35] underline font-bold">
                  {siteConfig.contactEmail}
                </a>
              </div>
              <div className="text-[10px] text-[#432623]/60 dark:text-[#FAF8E8]/60">
                Educational Cell : {siteConfig.city}
              </div>
              <Link href="/data-request" className="text-[#432623] dark:text-[#FAF8E8] hover:text-[#DE2A35]">
                DPDP Grievance Desk
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6 flex flex-col sm:flex-row justify-between text-[10px] text-[#432623]/60 dark:text-[#FAF8E8]/60 gap-2">
          <div>Copyright 2026 ShikshaGap. All rights reserved.</div>
          <div>Strictly necessary storage only. Zero third-party tracking.</div>
        </div>
      </footer>

      {/* STICKY MOBILE CTA BAR (Assess Test button visible without scrolling on small screens) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF8E8]/95 dark:bg-[#251614]/95 border-t border-[#432623]/25 px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg backdrop-blur-xs">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#DE2A35] font-bold">
            AI Diagnostic
          </span>
          <span className="text-xs font-mono text-[#432623] dark:text-[#FAF8E8] font-bold">
            Class 3 to 5 Math
          </span>
        </div>
        <Link
          href="/app"
          className="min-h-[44px] px-5 bg-[#DE2A35] text-[#FAF8E8] text-xs font-mono uppercase font-bold inline-flex items-center justify-center gap-1.5 border border-[#DE2A35] shadow-xs active:scale-95"
        >
          <span>Assess Test</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
