'use client';

import React, { useState, useId } from 'react';
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
  X,
  Lock,
  ArrowRight
} from '@phosphor-icons/react';
import { useI18n, LanguageProvider } from '@/lib/i18n/context';
import type { Lang } from '@/lib/types';
import { 
  ENABLED_CLASSES, 
  getClassConfig, 
  DEFAULT_CLASS_ID 
} from '@/lib/curriculum/classes';
import { ClassSelector } from '@/components/ClassSelector';
import { generateQuestion } from '@/lib/questions/generator';
import { makeRng } from '@/lib/rng';

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

const FAQS = [
  {
    q: 'What is ShikshaGap and who is it for?',
    a: 'ShikshaGap is a free teaching tool created for Indian government-school teachers and students. It is designed for primary mathematics teachers across Classes 3 to 5 who want to find why a student is struggling and what skill they need to learn next.'
  },
  {
    q: 'Which classes are supported?',
    a: 'Classes 3, 4, and 5 mathematics are fully supported today with verified syllabus topics, cross-grade gap backtracking, and 1-page printable worksheets. Classes 1, 2, 6, 7, and 8 are in preparation and clearly marked Coming soon.'
  },
  {
    q: 'How does it help a teacher in a real classroom?',
    a: 'When a child scores 42% on a Class 5 test, the teacher often cannot tell which earlier concept is missing. ShikshaGap traces the gap back to the missing prerequisite from Class 3 or 4 and gives the teacher a clear 5-day practice plan.'
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
    a: 'ShikshaGap follows the Digital Personal Data Protection Act 2023. We collect zero tracking cookies, store only strictly necessary local session data, and never share student identifying details with third parties.'
  },
  {
    q: 'Can a teacher use it on a simple phone or with slow internet?',
    a: 'Yes. The interface uses lightweight pages, fast local storage, and large touch targets designed for inexpensive Android smartphones and tablets commonly used in schools.'
  }
];

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
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
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
  const [pilotError, setPilotError] = useState<string | null>(null);

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

  // Pilot registration submission handler
  const handlePilotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPilotLoading(true);
    setPilotError(null);
    setPilotSuccess(null);

    try {
      const res = await fetch('/api/pilot-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: pilotSchool,
          teacherName: pilotTeacher,
          classRange: pilotClassRange,
          contact: pilotContact,
          honeypot: pilotHoneypot,
          privacyConsent: pilotConsent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request.');
      }

      setPilotSuccess('Thank you! Your school pilot request has been registered. We will contact you soon.');
      setPilotSchool('');
      setPilotTeacher('');
      setPilotContact('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
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
        'description': 'Mathematics learning check and practice planning for Indian schools, Classes 3 to 5.',
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Accessible Skip Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#DE2A35] focus:text-[#F5F1BC] text-xs font-mono uppercase border border-[#432623]"
      >
        Skip to main content
      </a>

      {/* SECTION 1: Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-[var(--background)]/95 border-b border-[var(--border)] px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
              <span className="h-7 w-7 rounded-[2px] bg-[#DE2A35] text-[#F5F1BC] font-mono text-xs flex items-center justify-center font-bold">
                SG
              </span>
              <span>ShikshaGap</span>
            </Link>
            <span className="hidden sm:inline-block border border-[var(--border)] text-[10px] font-mono uppercase px-2 py-0.5 bg-[var(--muted)] text-[var(--muted-foreground)]">
              Classes 3 to 5
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* 4 desktop links max */}
            <nav className="hidden md:flex items-center gap-5 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]" aria-label="Main Navigation">
              <a href="#demo" className="hover:text-[var(--foreground)]">Demo</a>
              <a href="#how-it-works" className="hover:text-[var(--foreground)]">How It Works</a>
              <a href="#faq" className="hover:text-[var(--foreground)]">FAQ</a>
            </nav>

            {/* SECTION 2: Language switcher in navbar (EN / हिन्दी / తెలుగు) */}
            <div className="flex items-center border border-[var(--border)] rounded-[2px] p-0.5 text-xs font-mono">
              {(['en', 'hi', 'te'] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`min-h-[36px] px-2 rounded-[2px] font-bold ${
                    lang === l
                      ? 'bg-[var(--foreground)] text-[var(--background)]'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
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
              className="min-w-[40px] min-h-[40px] flex items-center justify-center border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Teacher Sign In (Filled Button) */}
            <Link
              href="/login"
              className="hidden sm:inline-flex border border-[#DE2A35] bg-[#DE2A35] text-[#F5F1BC] px-4 py-2 min-h-[40px] items-center text-xs font-mono uppercase font-bold hover:bg-[#B51E28]"
            >
              Teacher Sign In
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center border border-[var(--border)] bg-[var(--card)]"
            >
              {isMobileMenuOpen ? <X size={20} /> : <List size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-2 font-mono text-xs uppercase tracking-wider">
            <a
              href="#demo"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 border border-[var(--border)] bg-[var(--card)]"
            >
              Demo
            </a>
            <a
              href="#how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 border border-[var(--border)] bg-[var(--card)]"
            >
              How It Works
            </a>
            <a
              href="#faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 border border-[var(--border)] bg-[var(--card)]"
            >
              FAQ
            </a>
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center justify-center px-3 border border-[#DE2A35] bg-[#DE2A35] text-[#F5F1BC] font-bold"
            >
              Teacher Sign In
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        {/* SECTION 3: Hero */}
        <section className="border-b border-[var(--border)] px-4 sm:px-8 py-14 sm:py-20 max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-block border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-mono uppercase text-[var(--muted-foreground)] mb-5">
              For Indian Primary School Teachers
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.15] text-[var(--foreground)] tracking-tight mb-5">
              Find out what each student needs to learn next.
            </h1>

            <p className="text-base sm:text-lg text-[var(--muted-foreground)] leading-relaxed mb-7">
              ShikshaGap checks understanding across Classes 3 to 5, traces learning gaps back to foundational skills, and helps teachers plan the next lesson.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#demo"
                className="border border-[#DE2A35] bg-[#DE2A35] text-[#F5F1BC] px-5 py-3 text-xs font-mono uppercase tracking-wider font-bold hover:bg-[#B51E28] inline-flex items-center gap-2 min-h-[44px]"
              >
                <span>Try the 5-Step Demo</span>
              </a>

              <Link
                href="/login"
                className="border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-xs font-mono uppercase tracking-wider font-bold hover:bg-[var(--muted)] inline-flex items-center gap-2 min-h-[44px]"
              >
                <User size={16} />
                <span>Teacher Sign In</span>
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 4: Problem and solution strip (two short columns) */}
        <section className="border-b border-[var(--border)] px-4 sm:px-8 py-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-[var(--border)] p-5 bg-[var(--card)]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#DE2A35] font-bold mb-1">
                The Classroom Dilemma
              </div>
              <h2 className="font-serif text-lg font-bold text-[var(--foreground)] mb-2">
                A student scores 42% on a test.
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                A low score tells a teacher that a student is struggling, but it cannot reveal which earlier prerequisite is missing. Repeating current class problems only creates frustration.
              </p>
            </div>

            <div className="border border-[var(--border)] p-5 bg-[var(--card)]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#8ABB93] font-bold mb-1">
                The ShikshaGap Solution
              </div>
              <h2 className="font-serif text-lg font-bold text-[var(--foreground)] mb-2">
                Traces the gap back and gives a 5-day plan.
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                ShikshaGap backtracks through the concept graph to find whether the gap began in Class 3, 4, or 5, then provides a concrete 5-day classroom action plan with printable sheets.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: Product Demo (5-step workflow driven by class selector) */}
        <section id="demo" className="border-b border-[var(--border)] px-4 sm:px-8 py-12 max-w-6xl mx-auto">
          <div className="mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
              Demo Data | Interactive Workflow
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1 text-[var(--foreground)]">
              How ShikshaGap Works in Five Steps
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1 max-w-2xl">
              Select a class below to see how diagnostic checks, gap detection, and practice planning adapt across grade levels.
            </p>
          </div>

          {/* Class selector for demo */}
          <div className="mb-6 p-3 border border-[var(--border)] bg-[var(--card)]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
              Select Grade to Explore Demo:
            </div>
            <ClassSelector
              selectedClassId={selectedClassId}
              onSelectClass={handleClassChange}
            />
          </div>

          {/* Stepper buttons */}
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
                      ? 'border-[#DE2A35] bg-[#DE2A35] text-[#F5F1BC]'
                      : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                  }`}
                >
                  {step.label}
                </button>
              );
            })}
          </div>

          {/* Interactive Stepper Content Card */}
          <div className="border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            {/* Student selection bar */}
            <div className="flex flex-wrap items-center justify-between pb-4 mb-5 border-b border-[var(--border)] gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--muted-foreground)] uppercase">
                  {activeClassConfig.label} Demo Students:
                </span>
                <div className="flex gap-2">
                  {classStudents.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStudentIndex(idx)}
                      className={`min-h-[36px] px-3 text-xs font-mono border ${
                        selectedStudentIndex === idx
                          ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-bold'
                          : 'border-[var(--border)] hover:bg-[var(--muted)]'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs font-mono text-[var(--muted-foreground)]">
                Roll #{currentStudent.rollNo} | {currentStudent.gradeLabel}
              </div>
            </div>

            {/* STEP 1 */}
            {activeWorkflowStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold">Step 1: Select a student</h3>
                  <span className={`text-xs font-mono px-2 py-0.5 border ${
                    currentStudent.statusType === 'critical'
                      ? 'border-[#DE2A35] text-[#DE2A35] bg-[#DE2A35]/10'
                      : currentStudent.statusType === 'warn'
                      ? 'border-[#DFA06E] text-[#432623] dark:text-[#F5F1BC] bg-[#DFA06E]/20'
                      : 'border-[#8ABB93] text-[#432623] dark:text-[#F5F1BC] bg-[#8ABB93]/20'
                  }`}>
                    {currentStudent.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  The teacher views their classroom roster and sees each student learning status clearly.
                </p>

                <div className="border border-[var(--border)] p-4 bg-[var(--background)]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                    <div>
                      <div className="text-[var(--muted-foreground)] uppercase text-[10px]">Student</div>
                      <div className="text-sm font-bold text-[var(--foreground)] mt-0.5">{currentStudent.name}</div>
                    </div>
                    <div>
                      <div className="text-[var(--muted-foreground)] uppercase text-[10px]">Class Topic</div>
                      <div className="text-sm font-bold text-[var(--foreground)] mt-0.5">{currentStudent.topic}</div>
                    </div>
                    <div>
                      <div className="text-[var(--muted-foreground)] uppercase text-[10px]">Current Understanding</div>
                      <div className="text-sm font-bold text-[var(--foreground)] mt-0.5">{currentStudent.mastery}%</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(2)}
                    className="min-h-[44px] px-4 bg-[#DE2A35] text-[#F5F1BC] text-xs font-mono uppercase font-bold hover:bg-[#B51E28]"
                  >
                    Next: Check Learning
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {activeWorkflowStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold">Step 2: Check Learning</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  The student answers a diagnostic question on the screen or paper.
                </p>

                <div className="border border-[var(--border)] p-4 bg-[var(--background)] space-y-3">
                  <div className="text-xs font-mono uppercase text-[var(--muted-foreground)]">Question:</div>
                  <div className="font-serif text-base font-bold text-[var(--foreground)]">
                    {currentStudent.question}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {currentStudent.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`p-2.5 text-xs font-mono border ${
                          opt === currentStudent.studentChoice
                            ? 'border-[#DE2A35] bg-[#DE2A35]/10 text-[var(--foreground)] font-bold'
                            : 'border-[var(--border)] text-[var(--muted-foreground)]'
                        }`}
                      >
                        {opt} {opt === currentStudent.studentChoice && '(Student selected)'}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(1)}
                    className="min-h-[44px] px-4 border border-[var(--border)] text-xs font-mono uppercase hover:bg-[var(--muted)]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(3)}
                    className="min-h-[44px] px-4 bg-[#DE2A35] text-[#F5F1BC] text-xs font-mono uppercase font-bold hover:bg-[#B51E28]"
                  >
                    Next: Find Gaps
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {activeWorkflowStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold">Step 3: Find Gaps</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  ShikshaGap connects the mistake to an earlier prerequisite topic in the curriculum DAG.
                </p>

                <div className="border border-[var(--border)] p-4 bg-[var(--background)] space-y-3 text-xs font-mono">
                  <div>
                    <span className="text-[var(--muted-foreground)] uppercase">Observed Mistake: </span>
                    <span className="text-[var(--foreground)] font-bold">{currentStudent.observedMistake}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)] uppercase">Missing Prerequisite: </span>
                    <span className="text-[#DE2A35] font-bold">{currentStudent.rootGap}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)] uppercase">Prerequisite Needed For: </span>
                    <span className="text-[var(--foreground)] font-bold">{currentStudent.prerequisiteFor}</span>
                  </div>
                  <div className="pt-2 text-[var(--muted-foreground)] text-[11px] leading-relaxed border-t border-[var(--border)]">
                    Evidence: {currentStudent.evidence}
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(2)}
                    className="min-h-[44px] px-4 border border-[var(--border)] text-xs font-mono uppercase hover:bg-[var(--muted)]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(4)}
                    className="min-h-[44px] px-4 bg-[#DE2A35] text-[#F5F1BC] text-xs font-mono uppercase font-bold hover:bg-[#B51E28]"
                  >
                    Next: Practice Plan
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {activeWorkflowStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold">Step 4: Practice Plan</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  A concrete 5-day classroom practice sequence for the teacher.
                </p>

                <div className="border border-[var(--border)] p-4 bg-[var(--background)] space-y-2.5">
                  {currentStudent.plan.map((p, i) => (
                    <div key={i} className="flex gap-3 text-xs border-b border-[var(--border)] pb-2 last:border-b-0 last:pb-0">
                      <span className="font-mono font-bold text-[var(--foreground)] w-14 shrink-0">{p.day}:</span>
                      <span className="text-[var(--muted-foreground)]">{p.task}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(3)}
                    className="min-h-[44px] px-4 border border-[var(--border)] text-xs font-mono uppercase hover:bg-[var(--muted)]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(5)}
                    className="min-h-[44px] px-4 bg-[#DE2A35] text-[#F5F1BC] text-xs font-mono uppercase font-bold hover:bg-[#B51E28]"
                  >
                    Next: Check Again
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5 */}
            {activeWorkflowStep === 5 && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold">Step 5: Check Again</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  After 5 days of practice, the student is checked again to verify mastery.
                </p>

                <div className="border border-[#8ABB93] p-4 bg-[#8ABB93]/10 space-y-2">
                  <div className="flex items-center gap-2 text-[#432623] dark:text-[#F5F1BC] font-mono font-bold text-xs uppercase">
                    <CheckCircle size={16} />
                    <span>Learning Verified</span>
                  </div>
                  <p className="text-xs text-[var(--foreground)] leading-relaxed">
                    {currentStudent.reassessmentResult}
                  </p>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowStep(4)}
                    className="min-h-[44px] px-4 border border-[var(--border)] text-xs font-mono uppercase hover:bg-[var(--muted)]"
                  >
                    Back to Step 4
                  </button>
                  <Link
                    href="/login"
                    className="min-h-[44px] px-4 bg-[#DE2A35] text-[#F5F1BC] text-xs font-mono uppercase font-bold hover:bg-[#B51E28] inline-flex items-center"
                  >
                    Open Teacher App
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 6: Trust Strip */}
        <section className="border-b border-[var(--border)] px-4 sm:px-8 py-5 max-w-6xl mx-auto bg-[var(--card)]">
          <div className="flex flex-wrap items-center justify-around gap-4 text-xs font-mono text-[var(--muted-foreground)]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-[#8ABB93]" />
              <span>DPDP 2023 Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock size={16} className="text-[#8ABB93]" />
              <span>No Tracking Cookies</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle size={16} className="text-[#8ABB93]" />
              <span>Works on Simple Android Phones</span>
            </div>
          </div>
        </section>

        {/* SECTION 7: Features as a Bento Grid (4 cards in unequal tiles with 1 small visual each) */}
        <section id="how-it-works" className="border-b border-[var(--border)] px-4 sm:px-8 py-12 max-w-6xl mx-auto">
          <div className="mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
              Core Capabilities
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1 text-[var(--foreground)]">
              Built for Government School Classrooms
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tile 1: Wide */}
            <div className="md:col-span-2 border border-[var(--border)] p-5 bg-[var(--card)] flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#DE2A35] font-bold mb-1">01 / PREREQUISITE TRACING</div>
                <h3 className="font-serif text-lg font-bold mb-2">Traces Missing Skills Across Grades</h3>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mb-4">
                  When a Class 5 student fails a long division task, the system automatically checks whether the gap began in Class 3 repeated addition or Class 4 multiplication facts.
                </p>
              </div>
              <div className="border border-[var(--border)] p-2.5 bg-[var(--background)] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[var(--muted-foreground)]">Class 3 Repeated Addition</span>
                <ArrowRight size={14} className="text-[#DE2A35]" />
                <span className="text-[var(--muted-foreground)]">Class 4 Mult Facts</span>
                <ArrowRight size={14} className="text-[#DE2A35]" />
                <span className="font-bold text-[var(--foreground)]">Class 5 Long Division</span>
              </div>
            </div>

            {/* Tile 2: Square */}
            <div className="border border-[var(--border)] p-5 bg-[var(--card)] flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#DFA06E] font-bold mb-1">02 / THREE LANGUAGES</div>
                <h3 className="font-serif text-lg font-bold mb-2">Regional Languages</h3>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mb-4">
                  Questions, practice instructions, and printable sheets are fully translated for Indian classrooms.
                </p>
              </div>
              <div className="flex gap-2 font-mono text-xs">
                <span className="px-2 py-1 border border-[var(--border)] bg-[var(--background)]">English</span>
                <span className="px-2 py-1 border border-[var(--border)] bg-[var(--background)] font-bold">हिन्दी</span>
                <span className="px-2 py-1 border border-[var(--border)] bg-[var(--background)] font-bold">తెలుగు</span>
              </div>
            </div>

            {/* Tile 3: Square */}
            <div className="border border-[var(--border)] p-5 bg-[var(--card)] flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#8ABB93] font-bold mb-1">03 / PRINTABLE SHEETS</div>
                <h3 className="font-serif text-lg font-bold mb-2">1-Page Paper Worksheets</h3>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mb-4">
                  Print ready-to-use worksheets for students who do not have smartphones at home.
                </p>
              </div>
              <div className="border border-[var(--border)] p-2 bg-[var(--background)] text-center text-[10px] font-mono uppercase text-[var(--muted-foreground)]">
                Standard A4 / Single Sheet Print
              </div>
            </div>

            {/* Tile 4: Wide */}
            <div className="md:col-span-2 border border-[var(--border)] p-5 bg-[var(--card)] flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#432623] dark:text-[#F5F1BC] font-bold mb-1">04 / PRIVACY BY DESIGN</div>
                <h3 className="font-serif text-lg font-bold mb-2">Child Privacy and DPDP 2023 Compliance</h3>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mb-4">
                  No tracking cookies, zero third-party marketing trackers, and strictly necessary local storage only.
                </p>
              </div>
              <div className="border border-[var(--border)] p-2.5 bg-[var(--background)] flex items-center gap-4 text-[11px] font-mono text-[var(--muted-foreground)]">
                <span>Tracking Cookies: 0</span>
                <span>Third-Party Scripts: 0</span>
                <span>Storage: Local Device Only</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: Worksheet preview (paper mockup of real worksheet output) */}
        <section className="border-b border-[var(--border)] px-4 sm:px-8 py-12 max-w-6xl mx-auto">
          <div className="mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
              Classroom Material
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1 text-[var(--foreground)]">
              Printable Practice Sheet Preview
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1 max-w-2xl">
              Generated directly from the curriculum question bank for {activeClassConfig.label}.
            </p>
          </div>

          <div className="max-w-2xl mx-auto border-2 border-[var(--border)] p-6 bg-white dark:bg-[#FAF8E8] text-[#432623] rounded-[2px] shadow-sm space-y-4">
            <div className="border-b border-[#432623]/30 pb-3 text-center space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#432623]/70">
                {activeClassConfig.label.toUpperCase()} - SECTION A | PRACTICE WORKSHEET
              </div>
              <h3 className="font-serif text-xl font-bold uppercase tracking-tight">
                Daily Classroom Practice
              </h3>
              <p className="text-xs font-mono font-semibold text-[#DE2A35]">
                Target Skill: {targetConcept.replace(/_/g, ' ')}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 border border-[#432623]/20 p-2 text-[11px] font-mono bg-[#F5F1BC]/30">
              <div>STUDENT: <strong>{currentStudent.name}</strong></div>
              <div>ROLL NO: <strong>#{currentStudent.rollNo}</strong></div>
              <div className="text-right">DATE: <strong>Today</strong></div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#432623]/70">
                Solve each problem and show your work:
              </div>

              <div className="border border-[#432623]/20 p-3 space-y-1 bg-white">
                <div className="text-xs font-bold">1. Solve the following problem:</div>
                <div className="text-sm font-mono font-bold">{previewSampleQ1.expression || '4 x 6 = ?'}</div>
                <div className="h-8 border-b border-dashed border-[#432623]/30 flex items-end text-[10px] text-[#432623]/50">
                  Answer: _______________________
                </div>
              </div>

              <div className="border border-[#432623]/20 p-3 space-y-1 bg-white">
                <div className="text-xs font-bold">2. Solve the following problem:</div>
                <div className="text-sm font-mono font-bold">{previewSampleQ2.expression || '7 x 8 = ?'}</div>
                <div className="h-8 border-b border-dashed border-[#432623]/30 flex items-end text-[10px] text-[#432623]/50">
                  Answer: _______________________
                </div>
              </div>
            </div>

            <div className="pt-2 text-center text-[10px] font-mono text-[#432623]/60">
              ShikshaGap Deterministic Practice Sheet | No AI Hallucinations
            </div>
          </div>
        </section>

        {/* SECTION 9: Stats row (config-derived facts only) */}
        <section className="border-b border-[var(--border)] px-4 sm:px-8 py-8 max-w-6xl mx-auto bg-[var(--card)]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="border border-[var(--border)] p-4">
              <div className="font-serif text-2xl font-bold text-[var(--foreground)]">3</div>
              <div className="text-[10px] font-mono uppercase text-[var(--muted-foreground)] mt-1">
                Languages Supported
              </div>
            </div>
            <div className="border border-[var(--border)] p-4">
              <div className="font-serif text-2xl font-bold text-[var(--foreground)]">
                {ENABLED_CLASSES.length}
              </div>
              <div className="text-[10px] font-mono uppercase text-[var(--muted-foreground)] mt-1">
                Classes Enabled (3, 4, 5)
              </div>
            </div>
            <div className="border border-[var(--border)] p-4">
              <div className="font-serif text-2xl font-bold text-[var(--foreground)]">15</div>
              <div className="text-[10px] font-mono uppercase text-[var(--muted-foreground)] mt-1">
                Curriculum Concepts in DAG
              </div>
            </div>
            <div className="border border-[var(--border)] p-4">
              <div className="font-serif text-2xl font-bold text-[#8ABB93]">0</div>
              <div className="text-[10px] font-mono uppercase text-[var(--muted-foreground)] mt-1">
                Tracking Cookies
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 10: Pilot Form */}
        <section id="pilot" className="border-b border-[var(--border)] px-4 sm:px-8 py-12 max-w-6xl mx-auto">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 text-center">
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
                School Partnerships
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1 text-[var(--foreground)]">
                Request a Classroom Pilot
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Government primary schools and teachers can request classroom onboarding assistance.
              </p>
            </div>

            <form onSubmit={handlePilotSubmit} className="border border-[var(--border)] p-6 bg-[var(--card)] space-y-4">
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

              <div>
                <label htmlFor={schoolInputId} className="block text-xs font-mono uppercase text-[var(--muted-foreground)] mb-1">
                  School Name *
                </label>
                <input
                  id={schoolInputId}
                  type="text"
                  required
                  value={pilotSchool}
                  onChange={(e) => setPilotSchool(e.target.value)}
                  placeholder="e.g. MPPS Gandhi Nagar"
                  className="w-full min-h-[44px] px-3 border border-[var(--border)] bg-[var(--background)] text-xs font-mono"
                />
              </div>

              <div>
                <label htmlFor={teacherInputId} className="block text-xs font-mono uppercase text-[var(--muted-foreground)] mb-1">
                  Teacher or Headmaster Name *
                </label>
                <input
                  id={teacherInputId}
                  type="text"
                  required
                  value={pilotTeacher}
                  onChange={(e) => setPilotTeacher(e.target.value)}
                  placeholder="e.g. Smt. Lakshmi Rao"
                  className="w-full min-h-[44px] px-3 border border-[var(--border)] bg-[var(--background)] text-xs font-mono"
                />
              </div>

              <div>
                <label htmlFor={classRangeInputId} className="block text-xs font-mono uppercase text-[var(--muted-foreground)] mb-1">
                  Class Range *
                </label>
                <select
                  id={classRangeInputId}
                  value={pilotClassRange}
                  onChange={(e) => setPilotClassRange(e.target.value)}
                  className="w-full min-h-[44px] px-3 border border-[var(--border)] bg-[var(--background)] text-xs font-mono"
                >
                  <option value="Classes 3 to 5">Classes 3 to 5 (Full support)</option>
                  <option value="Class 3">Class 3 only</option>
                  <option value="Class 4">Class 4 only</option>
                  <option value="Class 5">Class 5 only</option>
                  <option value="All Primary (Classes 1 to 5)">All Primary (Classes 1 to 5)</option>
                </select>
              </div>

              <div>
                <label htmlFor={contactInputId} className="block text-xs font-mono uppercase text-[var(--muted-foreground)] mb-1">
                  Teacher Contact (Phone or Email) *
                </label>
                <input
                  id={contactInputId}
                  type="text"
                  required
                  value={pilotContact}
                  onChange={(e) => setPilotContact(e.target.value)}
                  placeholder="e.g. 9876543210 or teacher@school.edu"
                  className="w-full min-h-[44px] px-3 border border-[var(--border)] bg-[var(--background)] text-xs font-mono"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  id={consentInputId}
                  type="checkbox"
                  required
                  checked={pilotConsent}
                  onChange={(e) => setPilotConsent(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor={consentInputId} className="text-[11px] text-[var(--muted-foreground)] leading-tight">
                  I agree that this contact will be used strictly for school pilot onboarding in accordance with our{' '}
                  <Link href="/privacy" className="underline hover:text-[var(--foreground)]">
                    Privacy Policy
                  </Link>.
                </label>
              </div>

              {pilotSuccess && (
                <div className="p-3 border border-[#8ABB93] bg-[#8ABB93]/15 text-[#432623] dark:text-[#F5F1BC] text-xs font-mono">
                  {pilotSuccess}
                </div>
              )}

              {pilotError && (
                <div className="p-3 border border-[#DE2A35] bg-[#DE2A35]/15 text-[#DE2A35] text-xs font-mono">
                  {pilotError}
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={pilotLoading}
                  className="w-full sm:w-auto min-h-[44px] px-6 bg-[#DE2A35] text-[#F5F1BC] text-xs font-mono uppercase font-bold hover:bg-[#B51E28] disabled:opacity-50"
                >
                  {pilotLoading ? 'Submitting...' : 'Submit Pilot Request'}
                </button>
                <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                  DPDP 2023 protected | Masked storage
                </span>
              </div>
            </form>
          </div>
        </section>

        {/* SECTION 11: FAQ as Accordion (one open at a time) */}
        <section id="faq" className="border-b border-[var(--border)] px-4 sm:px-8 py-12 max-w-6xl mx-auto">
          <div className="mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
              Teacher Inquiries
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1 text-[var(--foreground)]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3 max-w-3xl">
            {FAQS.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div key={index} className="border border-[var(--border)] bg-[var(--card)]">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="w-full text-left p-4 flex items-center justify-between gap-4 font-serif text-base font-bold text-[var(--foreground)]"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <CaretUp size={16} className="shrink-0" /> : <CaretDown size={16} className="shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-[var(--muted-foreground)] leading-relaxed border-t border-[var(--border)]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 12: Final CTA Banner (one heading, one line, two buttons) */}
        <section className="border-b border-[var(--border)] px-4 sm:px-8 py-14 max-w-6xl mx-auto text-center bg-[var(--card)]">
          <h2 className="font-serif text-3xl font-bold mb-3 text-[var(--foreground)]">
            Start checking student gaps in your classroom today.
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-6 max-w-xl mx-auto">
            Free forever for Indian government schools. No special devices or tracking required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="min-h-[44px] px-6 bg-[#DE2A35] text-[#F5F1BC] text-xs font-mono uppercase font-bold hover:bg-[#B51E28] inline-flex items-center"
            >
              Sign In to Teacher Dashboard
            </Link>
            <a
              href="#pilot"
              className="min-h-[44px] px-6 border border-[var(--border)] bg-[var(--background)] text-xs font-mono uppercase font-bold hover:bg-[var(--muted)] inline-flex items-center"
            >
              Request School Pilot
            </a>
          </div>
        </section>
      </main>

      {/* SECTION 13: Footer (grouped into two columns on desktop, all legal links, copyright line) */}
      <footer className="border-t border-[var(--border)] bg-[var(--background)] px-4 sm:px-8 py-10 text-xs font-mono">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-[var(--border)]">
          <div>
            <div className="font-serif text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              <span className="h-6 w-6 rounded-[2px] bg-[#DE2A35] text-[#F5F1BC] font-mono text-[10px] flex items-center justify-center font-bold">
                SG
              </span>
              <span>ShikshaGap</span>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-2 max-w-md leading-relaxed">
              Mathematics learning check and practice planning for Indian primary schools, Classes 3 to 5.
            </p>
            <div className="mt-4 text-[10px] text-[var(--muted-foreground)]">
              DPDP Act 2023 Compliant | Made for Indian Government Schools
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-between md:justify-end text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
            <div className="space-y-2 flex flex-col">
              <span className="font-bold text-[var(--foreground)]">Product</span>
              <a href="#demo" className="hover:text-[var(--foreground)]">Interactive Demo</a>
              <a href="#how-it-works" className="hover:text-[var(--foreground)]">How It Works</a>
              <a href="#pilot" className="hover:text-[var(--foreground)]">Request Pilot</a>
              <Link href="/login" className="hover:text-[var(--foreground)]">Teacher Sign In</Link>
            </div>
            <div className="space-y-2 flex flex-col">
              <span className="font-bold text-[var(--foreground)]">Legal & Privacy</span>
              <Link href="/privacy" className="hover:text-[var(--foreground)]">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-[var(--foreground)]">Terms of Service</Link>
              <Link href="/cookies" className="hover:text-[var(--foreground)]">Cookie Notice</Link>
              <Link href="/notices/guardian" className="hover:text-[var(--foreground)]">Guardian Notice</Link>
              <Link href="/data-request" className="hover:text-[var(--foreground)]">Data Request</Link>
              <Link href="/licenses" className="hover:text-[var(--foreground)]">Licenses</Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-6 flex flex-col sm:flex-row justify-between text-[10px] text-[var(--muted-foreground)] gap-2">
          <div>Copyright 2026 ShikshaGap. All rights reserved.</div>
          <div>Strictly necessary storage only. Zero third-party tracking.</div>
        </div>
      </footer>
    </div>
  );
}
