'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Sun, 
  Moon, 
  List, 
  X, 
  ArrowRight,
  Clock,
  FileText
} from '@phosphor-icons/react';
import { useI18n, LanguageProvider } from '@/lib/i18n/context';
import type { Lang } from '@/lib/types';
import { 
  getClassConfig, 
  DEFAULT_CLASS_ID 
} from '@/lib/curriculum/classes';
import { siteConfig } from '@/config/site';
import { generateQuestion } from '@/lib/questions/generator';
import { makeRng } from '@/lib/rng';
import { motion } from 'motion/react';
import { LuminousType } from '@/components/LuminousType';
import { BlinkingDots } from '@/components/BlinkingDots';
import { MascotHero } from '@/components/illustrations/MascotHero';
import { MathFloatingShapes } from '@/components/illustrations/MathFloatingShapes';
import { ProblemIllustration, SolutionIllustration } from '@/components/illustrations/ProblemSolutionIllustrations';

// Dynamically load heavy below-the-fold interactive sections
const LandingHowAgentWorksSection = dynamic(
  () => import('@/components/landing/LandingHowAgentWorksSection').then(m => m.LandingHowAgentWorksSection),
  { ssr: true }
);

const LandingDemoSection = dynamic(
  () => import('@/components/landing/LandingDemoSection').then(m => m.LandingDemoSection),
  { ssr: true }
);

const LandingBentoSection = dynamic(
  () => import('@/components/landing/LandingBentoSection').then(m => m.LandingBentoSection),
  { ssr: true }
);

const LandingPilotSection = dynamic(
  () => import('@/components/landing/LandingPilotSection').then(m => m.LandingPilotSection),
  { ssr: true }
);

const LandingFaqSection = dynamic(
  () => import('@/components/landing/LandingFaqSection').then(m => m.LandingFaqSection),
  { ssr: true }
);
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
  const selectedClassId = DEFAULT_CLASS_ID;
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic class configuration
  const activeClassConfig = getClassConfig(selectedClassId);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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
    <div className="min-h-screen bg-card text-foreground font-sans flex flex-col selection:bg-primary text-primary-foreground selection:text-primary-foreground pb-16 sm:pb-0 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Accessible Skip Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary text-primary-foreground focus:text-primary-foreground text-sm font-mono uppercase border border-border"
      >
        Skip to main content
      </a>

      {/* TOP MASTHEAD DATELINE */}
      <div className="bg-card border-b border-border px-4 sm:px-8 py-1.5 text-sm sm:text-sm font-mono uppercase tracking-widest text-muted-foreground dark:text-muted-foreground flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Vol. 2026 / Issue No. 05 hidden per teacher clarity requirements */}
          <span className="hidden">VOL. 2026 | ISSUE NO. 05</span>
          <span className="font-bold text-primary">PRIMARY MATHEMATICS</span>
          <span className="opacity-40 hidden md:inline">|</span>
          <span className="hidden md:inline">FOUNDATIONAL LEARNING GAP DIAGNOSTIC</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">INDIAN PRIMARY SCHOOLS EDITION</span>
          <span className="opacity-40 hidden sm:inline">|</span>
          <span className="text-primary font-bold">BUILT FOLLOWING DPDP ACT 2023 PRINCIPLES</span>
        </div>
      </div>

      {/* STICKY NAVBAR with thin rule divider */}
      <header className="sticky top-0 z-50 bg-card/95 dark:bg-card/95 backdrop-blur-xs border-b border-border px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-[2px] bg-primary text-primary-foreground font-mono text-sm flex items-center justify-center font-bold tracking-normal shadow-xs">
                SG
              </span>
              <span className="tracking-tighter">ShikshaGap</span>
            </Link>
            <span className="hidden sm:inline-block border border-border text-sm font-mono uppercase px-2 py-0.5 bg-muted dark:bg-card text-foreground font-bold">
              AI Diagnostic Agent
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-5 text-sm font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground" aria-label="Main Navigation">
              <a href="#cover" className="hover:text-primary transition-colors">01 Cover</a>
              <a href="#how-agent-works" className="hover:text-primary transition-colors">02 How Agent Works</a>
              <a href="#demo" className="hover:text-primary transition-colors">03 Interactive Cases</a>
              <a href="#faq" className="hover:text-primary transition-colors">04 FAQ</a>
            </nav>

            {/* Language Switcher (EN / हिन्दी / తెలుగు) */}
            <div className="flex items-center border border-border rounded-[2px] p-0.5 text-sm font-mono bg-muted dark:bg-card">
              {(['en', 'hi', 'te'] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`min-h-[44px] sm:min-h-[36px] px-2.5 rounded-[2px] font-bold cursor-pointer transition-none focus-visible:outline-2 focus-visible:outline-ring ${
                    lang === l
                      ? 'bg-foreground text-background dark:bg-card dark:text-foreground'
                      : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-primary-foreground'
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
              className="min-w-[44px] min-h-[44px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center border border-border bg-transparent hover:bg-muted text-foreground cursor-pointer focus-visible:outline-2 focus-visible:outline-ring"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Secondary Link: Sign In (Quiet) */}
            <Link
              href="/login"
              className="hidden sm:inline-flex border border-border bg-transparent text-foreground px-3 py-2 min-h-[44px] sm:min-h-[38px] items-center text-sm font-mono uppercase font-bold hover:bg-muted cursor-pointer focus-visible:outline-2 focus-visible:outline-ring"
            >
              Sign In
            </Link>

            {/* PRIMARY ACTION: ASSESS TEST BUTTON (Sticky Navbar) */}
            <Link
              href="/assessment"
              className="inline-flex border-2 border-primary bg-primary text-primary-foreground px-4 sm:px-5 py-2 min-h-[40px] items-center text-sm font-mono uppercase font-bold hover:bg-primary focus-visible:outline-2 focus-visible:outline-ring cursor-pointer shadow-xs active:translate-y-[1px] tracking-wider"
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
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center border border-border bg-transparent text-foreground cursor-pointer focus-visible:outline-2 focus-visible:outline-ring"
            >
              {isMobileMenuOpen ? <X size={18} /> : <List size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-border flex flex-col gap-2 font-mono text-sm uppercase tracking-wider">
            <Link
              href="/assessment"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[48px] flex items-center justify-center px-4 border-2 border-primary bg-primary text-primary-foreground font-bold text-sm tracking-wider"
            >
              Assess Test (Start Assessment)
            </Link>
            <a
              href="#cover"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[42px] flex items-center px-3 border border-border bg-muted dark:bg-card"
            >
              01 Cover Story
            </a>
            <a
              href="#how-agent-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[42px] flex items-center px-3 border border-border bg-muted dark:bg-card"
            >
              02 How Agent Works
            </a>
            <a
              href="#demo"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[42px] flex items-center px-3 border border-border bg-muted dark:bg-card"
            >
              03 Interactive Workflow
            </a>
            <a
              href="#faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[42px] flex items-center px-3 border border-border bg-muted dark:bg-card"
            >
              04 Inquiries & FAQ
            </a>
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[42px] flex items-center justify-center px-3 border border-border bg-transparent text-foreground font-bold"
            >
              Teacher Sign In
            </Link>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main id="main-content" className="flex-1">

        {/* SECTION 01: HERO MAGAZINE COVER (With Primary "Assess Test" Button Above the Fold) */}
        <section id="cover" className="relative border-b border-border overflow-hidden bg-card">
          
          {/* Top Editorial Hairline & Issue Badge */}
          <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6 pb-2 flex flex-wrap items-center justify-between gap-2 border-b border-border text-sm font-mono uppercase tracking-widest text-muted-foreground dark:text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary text-primary-foreground rounded-full inline-block"></span>
              <span className="font-bold text-foreground">01 / THE COVER STORY</span>
              <span className="opacity-40">|</span>
              <span className="text-primary font-bold">ISSUE / CLASS 5 MATHS</span>
            </div>
            <div>
              <span>AI LEARNING GAP AGENT : FREE FOR GOVT SCHOOLS</span>
            </div>
          </div>

          {/* MAGAZINE COVER HERO STAGE */}
          {/* Wrapper is position: relative, headline at z-10, cutout PNG at z-20, foreground content and Assess Test at z-30 */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-8 min-h-[520px] sm:min-h-[720px] lg:min-h-[800px] flex flex-col justify-between overflow-hidden">

            {/* LAYER 1 (z-10): GIGANTIC EDITORIAL HEADLINE BEHIND THE CUTOUT */}
            <div className="absolute inset-0 z-10 flex flex-col justify-center items-center pointer-events-none select-none px-2 sm:px-6">
              <div className="w-full text-center">
                <h1 className="font-serif uppercase tracking-tight text-foreground leading-[0.88] text-[clamp(2.1rem,9.5vw,10.5rem)] m-0">
                  <span className="block break-words sm:whitespace-nowrap">
                    <LuminousType text="WHAT EACH student" italicIndices={[2]} />
                  </span>
                  <span className="block break-words sm:whitespace-nowrap">
                    <LuminousType text="NEEDS TO learn NEXT" italicIndices={[2]} />
                  </span>
                </h1>
                <div className="mt-2 text-sm sm:text-sm font-mono tracking-widest uppercase text-muted-foreground dark:text-muted-foreground">
                  SHIKSHAGAP AI AGENT : ADAPTIVE DIAGNOSTIC FOR CLASSES 3, 4 & 5
                </div>
              </div>
            </div>

            {/* FLOATING MATH SHAPES BACKGROUND DRIFT */}
            <MathFloatingShapes />

            {/* LAYER 2 (z-20): 2D CARTOON OWL MASCOT ("GAPPU") ON BOOKS */}
            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center pointer-events-auto">
              <div className="relative w-[240px] sm:w-[380px] lg:w-[460px] flex items-end justify-center pb-2">
                <MascotHero
                  width={460}
                  height={560}
                  className="w-full max-w-[420px] drop-shadow-md"
                />
              </div>
            </div>

            {/* LAYER 3 (z-30): FOREGROUND CALLOUT WITH PRIMARY 'ASSESS TEST' BUTTON (Above both layers, never covered) */}
            <div className="relative z-30 pt-2 sm:pt-6 pb-4 sm:pb-6 flex-1 flex flex-col justify-between pointer-events-none">
              
              {/* Upper Section: Primary Agent Action Card (Prominent & immediately visible above the fold on mobile & desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pointer-events-auto">
                <div className="md:col-span-5 bg-card/95 dark:bg-card/95 p-4 sm:p-6 border-2 border-border backdrop-blur-xs max-w-md shadow-md">
                  
                  <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-primary font-bold mb-1">
                    <BlinkingDots count={3} activeColor="#F56276" />
                    <span>AI DIAGNOSTIC AGENT</span>
                  </div>

                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground mb-2 leading-snug">
                    Find the exact concept blocking your student.
                  </h2>

                  {/* Copy describing the agent: what it assesses, how long it takes, and what student gets */}
                  <div className="space-y-1 mb-2.5 sm:mb-4 text-sm font-mono text-foreground/80 dark:text-muted-foreground border-t border-b border-border py-1.5 sm:py-2.5">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-primary w-20 shrink-0 uppercase text-sm">Assesses:</span>
                      <span>Foundational Math in Classes 3 to 5 (place value, regrouping, fractions, division)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary w-20 shrink-0 uppercase text-sm">Time:</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> 6 to 8 minutes per child</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-primary w-20 shrink-0 uppercase text-sm">Output:</span>
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
                        href="/assessment"
                        className="border-2 border-primary bg-primary text-primary-foreground px-6 py-3.5 min-h-[50px] inline-flex items-center justify-center gap-2 text-sm font-mono uppercase tracking-wider font-bold hover:bg-primary focus-visible:outline-2 focus-visible:outline-ring cursor-pointer shadow-md active:translate-y-[1px] transition-transform duration-150"
                      >
                        <span>Assess Test</span>
                        <ArrowRight size={16} />
                      </Link>
                    </motion.div>

                    {/* Visually quieter secondary button */}
                    <a
                      href="#how-agent-works"
                      className="border border-border bg-transparent text-foreground px-4 py-2.5 min-h-[44px] inline-flex items-center justify-center text-sm font-mono uppercase tracking-wider font-semibold hover:bg-muted cursor-pointer transition-none"
                    >
                      See how it works
                    </a>
                  </div>

                  <div className="mt-3 text-sm font-mono text-muted-foreground dark:text-muted-foreground flex items-center gap-2">
                    <ShieldCheck size={13} className="text-[var(--status-good)]" />
                    <span>No login required for initial classroom trial</span>
                  </div>
                </div>

                {/* Right Side: Issue Contents */}
                <div className="hidden md:block md:col-start-9 md:col-span-4 bg-card/90 dark:bg-card/90 p-4 border border-border backdrop-blur-xs text-right">
                  <div className="text-sm font-mono uppercase tracking-widest text-foreground font-bold mb-1">
                    WHAT IS INSIDE
                  </div>
                  <ul className="text-sm font-mono space-y-1.5 text-foreground/80 dark:text-muted-foreground">
                    <li><span className="text-primary font-bold">p. 02</span> : The 42% Test Score Fallacy</li>
                    <li><span className="text-primary font-bold">p. 04</span> : How the AI Agent Traces Gaps</li>
                    <li><span className="text-primary font-bold">p. 07</span> : Live Student Gap Report Sample</li>
                    <li><span className="text-primary font-bold">p. 12</span> : Printable 1-Page A4 Worksheets</li>
                  </ul>
                  <div className="mt-3 pt-2 border-t border-border text-sm font-mono text-muted-foreground dark:text-muted-foreground">
                    MADE SPECIFICALLY FOR INDIAN GOVT SCHOOLS
                  </div>
                </div>
              </div>

              {/* Lower Bar: Editorial Cutout Caption & Sample Barcode */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mt-auto pt-6 pointer-events-auto">
                <div className="md:col-span-5 bg-card/95 dark:bg-card/95 p-3 border border-border">
                  <div className="text-sm font-mono uppercase text-primary font-bold">
                    FIGURE 1.0: GAPPU THE DIAGNOSTIC OWL
                  </div>
                  <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-snug mt-0.5">
                    Friendly AI agent mascot Gappu analyzing foundational math prerequisites. Interactive mascot winks and bobs as it tracks Class 3 and 4 skills that stall multi-digit division.
                  </p>
                </div>

                <div className="hidden md:flex md:col-start-9 md:col-span-4 justify-end">
                  <div className="bg-card/95 dark:bg-card/95 border border-border p-2.5 text-center font-mono">
                    <div className="text-sm tracking-widest text-muted-foreground dark:text-muted-foreground uppercase">
                      SAMPLE NO. 2026-SG-AGENT
                    </div>
                    <div className="text-sm font-mono tracking-widest font-bold text-foreground mt-0.5">
                      ||| | |||| || ||| |||||
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 02: THE CLASSROOM DILEMMA */}
        <section className="border-b border-border px-4 sm:px-8 py-12 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-muted-foreground dark:text-muted-foreground mb-4">
            <span className="text-primary font-bold">02</span>
            <span>/</span>
            <span>THE CLASSROOM DILEMMA</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Pull Quote */}
            <div className="lg:col-span-5 border-l-2 border-primary pl-5 py-2">
              <span className="text-sm font-mono uppercase tracking-widest text-primary font-bold block mb-2">
                THE PROBLEM
              </span>
              <blockquote className="font-serif text-2xl sm:text-3xl lg:text-4xl leading-tight text-foreground">
                A student scores 42% on a test. The mark confirms struggle, but conceals the root cause.
              </blockquote>
              <div className="mt-4 text-sm font-mono text-muted-foreground dark:text-muted-foreground">
                DESIGNED FOR TELANGANA AND ANDHRA PRADESH CLASSROOMS
              </div>
            </div>

            {/* Two Side-by-Side Hairline Columns */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-border bg-muted dark:bg-card p-5 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                <div>
                  <div className="text-sm font-mono uppercase tracking-wider text-primary font-bold mb-1">
                    The Dilemma
                  </div>
                  <h3 className="font-serif text-lg font-bold text-foreground mb-2">
                    Repeating current class problems creates frustration.
                  </h3>
                  <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed mb-4">
                    When a Class 5 child fails long division, giving 20 more division sums fails. The real gap is almost always in Class 3 regrouping or Class 4 multiplication table fluency.
                  </p>
                </div>
                <div className="pt-2 flex justify-center">
                  <ProblemIllustration />
                </div>
              </div>

              <div className="border border-border bg-[var(--status-good-bg)] dark:bg-[var(--status-good)]/10 p-5 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                <div>
                  <div className="text-sm font-mono uppercase tracking-wider text-foreground font-bold mb-1">
                    The AI Agent Solution
                  </div>
                  <h3 className="font-serif text-lg font-bold text-foreground mb-2">
                    Traces the prerequisite gap and generates a 5-day plan.
                  </h3>
                  <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed mb-4">
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

        {/* SECTION 03: HOW THE AGENT WORKS (Modular Specimen Section) */}
        <LandingHowAgentWorksSection
          sampleQ1Expression={previewSampleQ1.expression || '4 x 6 = ?'}
          sampleQ2Expression={previewSampleQ2.expression || '7 x 8 = ?'}
        />

        {/* SECTION 04: PRODUCT DEMO (Modular Interactive Case Dossier) */}
        <LandingDemoSection />

        {/* SECTION 05: PULL-QUOTE STYLE STAT ROW */}
        <section className="border-b border-border px-4 sm:px-8 py-12 max-w-7xl mx-auto bg-muted dark:bg-card">
          <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-muted-foreground dark:text-muted-foreground mb-4">
            <span className="text-primary font-bold">05</span>
            <span>/</span>
            <span>VITAL STATISTICS : THE CURRICULUM FOOTPRINT</span>
          </div>

          {/* Editorial Pull-Quote */}
          <div className="max-w-4xl mb-10">
            <blockquote className="font-serif text-2xl sm:text-3xl lg:text-4xl leading-tight text-foreground">
              &ldquo;A curriculum map of 15 connected concepts, taught across 3 Indian regional languages, with zero tracking cookies and built following DPDP Act 2023 principles.&rdquo;
            </blockquote>
          </div>

          {/* Asymmetric Hairline Stat Columns */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-border">
            <div className="border-l border-border pl-4 py-1">
              <div className="font-serif text-5xl sm:text-6xl font-normal text-primary leading-none">
                15
              </div>
              <div className="text-sm font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground mt-2 font-bold">
                Concepts in DAG
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-0.5">
                Single unified acyclic prerequisite graph
              </div>
            </div>

            <div className="border-l border-border pl-4 py-1">
              <div className="font-serif text-5xl sm:text-6xl font-normal text-foreground leading-none">
                03
              </div>
              <div className="text-sm font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground mt-2 font-bold">
                Languages Supported
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-0.5">
                Full translation in English, हिन्दी and తెలుగు
              </div>
            </div>

            <div className="border-l border-border pl-4 py-1">
              <div className="font-serif text-5xl sm:text-6xl font-normal text-foreground leading-none">
                03
              </div>
              <div className="text-sm font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground mt-2 font-bold">
                Classes Enabled (3, 4, 5)
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-0.5">
                Aligned to Class 3 to 5 maths topics
              </div>
            </div>

            <div className="border-l border-border pl-4 py-1">
              <div className="font-serif text-5xl sm:text-6xl font-normal text-foreground leading-none">
                00
              </div>
              <div className="text-sm font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground mt-2 font-bold">
                Tracking Cookies
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-0.5">
                Local device session storage only
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 06: CURRICULUM ARCHITECTURE (Modular Bento Grid) */}
        <LandingBentoSection />

        {/* SECTION 07: FIELD PARTNERSHIPS & PILOT FORM (Modular Pilot Section) */}
        <LandingPilotSection />

        {/* SECTION 08: INQUIRIES & FAQ (Modular Accordion Section) */}
        <LandingFaqSection />

        {/* SECTION 09: FINAL EDITORIAL DISPATCH CTA (Repeats Primary Assess Test Button) */}
        <section className="border-b border-border px-4 sm:px-8 py-16 max-w-7xl mx-auto text-center bg-muted dark:bg-card">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="text-sm font-mono uppercase tracking-widest text-primary font-bold">
              GET STARTED
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
              Start an assessment to find student learning gaps today.
            </h2>
            <p className="text-sm sm:text-sm text-foreground/80 dark:text-muted-foreground max-w-xl mx-auto leading-relaxed">
              A 6-minute adaptive test gives you the exact prerequisite concept holding each student back, with a 5-day action plan. Free for government schools during the pilot.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              {/* PRIMARY ACTION: ASSESS TEST BUTTON (Final CTA) */}
              <Link
                href="/assessment"
                className="min-h-[52px] px-8 bg-primary text-primary-foreground text-sm font-mono uppercase font-bold hover:bg-primary focus-visible:outline-2 focus-visible:outline-ring inline-flex items-center gap-2 cursor-pointer shadow-md active:translate-y-[1px] tracking-wider"
              >
                <span>Assess Test</span>
                <ArrowRight size={16} />
              </Link>

              {/* Visually quieter secondary button */}
              <a
                href="#pilot"
                className="min-h-[48px] px-6 border border-border bg-card text-foreground text-sm font-mono uppercase font-bold hover:bg-muted inline-flex items-center cursor-pointer"
              >
                Request School Pilot
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 10: EDITORIAL COLOPHON & FOOTER */}
      <footer className="border-t border-border bg-card px-4 sm:px-8 py-12 text-sm font-mono">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-border">
          <div>
            <div className="font-serif text-2xl font-bold text-foreground flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-[2px] bg-primary text-primary-foreground font-mono text-sm flex items-center justify-center font-bold">
                SG
              </span>
              <span>ShikshaGap</span>
            </div>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-2 max-w-md leading-relaxed">
              AI-powered learning gap detection and personalized remediation for Indian primary schools, Classes 3 to 5.
            </p>
            <div className="mt-4 text-sm text-muted-foreground dark:text-muted-foreground">
              Built Following DPDP Act 2023 Principles | Made for Indian Government Schools
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 justify-between md:justify-end text-sm uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
            <div className="space-y-2 flex flex-col">
              <span className="font-bold text-foreground">Diagnostic Actions</span>
              <Link href="/assessment" className="text-primary font-bold hover:underline">Assess Test Now</Link>
              <a href="#how-agent-works" className="hover:text-primary">How Agent Works</a>
              <a href="#demo" className="hover:text-primary">Interactive Demo</a>
              <a href="#pilot" className="hover:text-primary">Request Pilot</a>
              <Link href="/login" className="hover:text-primary">Teacher Sign In</Link>
            </div>
            <div className="space-y-2 flex flex-col">
              <span className="font-bold text-foreground">Legal & Governance</span>
              <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
              <Link href="/cookies" className="hover:text-primary">Cookie Notice</Link>
              <Link href="/notices/guardian" className="hover:text-primary">Guardian Notice</Link>
              <Link href="/data-request" className="hover:text-primary">Data Request</Link>
              <Link href="/licenses" className="hover:text-primary">Licenses</Link>
            </div>
            <div className="space-y-2 flex flex-col">
              <span className="font-bold text-foreground">Official Contact</span>
              <div className="text-sm text-foreground/80 dark:text-muted-foreground leading-snug">
                <span>Email: </span>
                <a href={`mailto:${siteConfig.contactEmail}`} className="text-primary underline font-bold">
                  {siteConfig.contactEmail}
                </a>
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                Educational Cell : {siteConfig.city}
              </div>
              <Link href="/data-request" className="text-foreground hover:text-primary">
                DPDP Grievance Desk
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6 flex flex-col sm:flex-row justify-between text-sm text-muted-foreground dark:text-muted-foreground gap-2">
          <div>Copyright 2026 ShikshaGap. All rights reserved.</div>
          <div>Strictly necessary storage only. Zero third-party tracking.</div>
        </div>
      </footer>

      {/* STICKY MOBILE CTA BAR (Assess Test button visible without scrolling on small screens) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 dark:bg-card/95 border-t border-border px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg backdrop-blur-xs">
        <div className="flex flex-col">
          <span className="text-sm font-mono uppercase tracking-wider text-primary font-bold">
            AI Diagnostic
          </span>
          <span className="text-sm font-mono text-foreground font-bold">
            Class 3 to 5 Math
          </span>
        </div>
        <Link
          href="/assessment"
          className="min-h-[44px] px-5 bg-primary text-primary-foreground text-sm font-mono uppercase font-bold inline-flex items-center justify-center gap-1.5 border border-primary shadow-xs active:scale-95"
        >
          <span>Assess Test</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
