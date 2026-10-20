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
  FileText,
  Sparkle
} from '@phosphor-icons/react';
import { useI18n, LanguageProvider } from '@/lib/i18n/context';
import type { ConceptId, Lang } from '@/lib/types';
import { CONCEPTS } from '@/lib/concepts/graph';
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
import { 
  FlowerPetal, 
  BotanicalLeaf, 
  WarmSparkle, 
  GiftBoxMotif, 
  FloralSectionDivider 
} from '@/components/illustrations/FloralMotifs';

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
  const { lang, setLang, dict } = useI18n();
  const selectedClassId = DEFAULT_CLASS_ID;
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('shikshagap_theme') || localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic class configuration
  const activeClassConfig = getClassConfig(selectedClassId);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('shikshagap_theme', next ? 'dark' : 'light');
        localStorage.setItem('theme', next ? 'dark' : 'light');
      } catch {
        // ignore
      }
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Dynamic worksheet preview sample question
  const targetConcept: ConceptId = (activeClassConfig.targetConcepts.find(
    (c): c is ConceptId => c in CONCEPTS
  ) || 'mult_facts');
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
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-accent selection:text-white pb-16 sm:pb-0 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Accessible Skip Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary text-primary-foreground focus:text-primary-foreground text-sm font-sans font-bold rounded-full shadow-warm"
      >
        Skip to main content
      </a>

      {/* TOP WHIMSICAL BANNER */}
      <div className="bg-[#FFF7E6] dark:bg-[#1A2615] border-b border-[#C7DDAE]/60 dark:border-[#3B5428] px-3 sm:px-8 py-2 text-xs font-sans text-foreground/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Mobile single-line edition badge */}
          <div className="flex sm:hidden items-center justify-between w-full text-[12px] font-bold text-primary">
            <span className="flex items-center gap-1.5">
              <FlowerPetal size={14} color="#F4C542" />
              <span>SHIKSHAGAP &bull; PRIMARY MATH</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C7DDAE]/50 dark:bg-[#2A3E1F] text-foreground text-[12px]">
              <GiftBoxMotif size={12} /> Free for Schools
            </span>
          </div>

          {/* Desktop full banner */}
          <div className="hidden sm:flex items-center gap-2">
            <FlowerPetal size={16} color="#F4C542" />
            <span className="font-bold text-primary tracking-wide">SHIKSHAGAP &bull; PRIMARY MATHEMATICS</span>
            <span className="opacity-40 hidden md:inline">|</span>
            <span className="hidden md:inline italic text-muted-foreground">The unboxing starts before you open it.</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C7DDAE]/50 dark:bg-[#2A3E1F] text-foreground font-semibold">
              <GiftBoxMotif size={13} /> Free for Govt Schools
            </span>
            <span className="opacity-40 hidden sm:inline">|</span>
            <span className="text-primary font-semibold hidden sm:inline">DPDP Act 2023 Principles</span>
          </div>
        </div>
      </div>

      {/* STICKY NAVBAR with rounded pill styling */}
      <header className="sticky top-0 z-50 bg-[#FFF7E6]/90 dark:bg-[#1C2817]/90 backdrop-blur-md border-b border-[#C7DDAE]/60 dark:border-[#3B5428] px-3 sm:px-8 py-2.5 sm:py-3 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="font-heading text-xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2 group">
              <span className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary text-primary-foreground font-heading text-sm sm:text-base flex items-center justify-center font-bold shadow-warm group-hover:rotate-6 transition-transform">
                <FlowerPetal size={18} color="#FFF7E6" centerColor="#F4C542" />
              </span>
              <span className="tracking-tight text-primary font-extrabold">Shiksha<span className="text-accent">Gap</span></span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[#C7DDAE] text-xs font-sans px-3 py-1 bg-[#C7DDAE]/30 dark:bg-[#2A3E1F] text-foreground font-bold">
              <Sparkle size={12} weight="fill" className="text-secondary" /> AI Diagnostic
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4">
            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-2 text-sm font-sans font-semibold text-foreground/80" aria-label="Main Navigation">
              <a href="#cover" className="px-3 py-1.5 rounded-full hover:bg-[#C7DDAE]/40 hover:text-primary transition-all">01 Cover</a>
              <a href="#how-agent-works" className="px-3 py-1.5 rounded-full hover:bg-[#C7DDAE]/40 hover:text-primary transition-all">02 How It Works</a>
              <a href="#demo" className="px-3 py-1.5 rounded-full hover:bg-[#C7DDAE]/40 hover:text-primary transition-all">03 Cases</a>
              <a href="#faq" className="px-3 py-1.5 rounded-full hover:bg-[#C7DDAE]/40 hover:text-primary transition-all">04 FAQ</a>
            </nav>

            {/* Language Switcher (EN / हिन्दी / తెలుగు) as soft rounded pill container */}
            <div className="flex items-center border border-[#C7DDAE] dark:border-[#3B5428] rounded-full p-0.5 text-xs font-sans bg-[#FFF7E6] dark:bg-[#1A2615] shadow-xs" role="group" aria-label="Language selection">
              {(['en', 'hi', 'te'] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`min-h-[44px] px-2 sm:px-3 rounded-full font-bold cursor-pointer transition-all focus-visible:outline-2 focus-visible:outline-ring text-xs ${
                    lang === l
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-foreground/70 hover:text-foreground hover:bg-[#C7DDAE]/30'
                  }`}
                  aria-label={`${l === 'en' ? 'EN' : l === 'hi' ? 'हिन्दी' : 'తెలుగు'} - Switch language`}
                  aria-pressed={lang === l}
                >
                  {l === 'en' ? 'EN' : l === 'hi' ? 'हिन्दी' : 'తెలుగు'}
                </button>
              ))}
            </div>

            {/* Theme Toggle as rounded pill button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="w-11 h-11 rounded-full flex items-center justify-center border border-[#C7DDAE] dark:border-[#3B5428] bg-[#FFF7E6] dark:bg-[#1A2615] hover:bg-[#C7DDAE]/30 text-foreground cursor-pointer shadow-xs transition-colors"
            >
              {isDark ? <Sun size={17} weight="bold" className="text-secondary" /> : <Moon size={17} weight="bold" className="text-primary" />}
            </button>

            {/* Secondary Link: Sign In */}
            <Link
              href="/login"
              className="hidden sm:inline-flex rounded-full border border-[#C7DDAE] dark:border-[#3B5428] bg-transparent text-foreground px-4 py-2 min-h-[44px] items-center text-xs font-sans uppercase font-bold hover:bg-[#C7DDAE]/30 cursor-pointer transition-colors"
            >
              Sign In
            </Link>

            {/* PRIMARY ACTION: START ASSESSMENT BUTTON */}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="hidden sm:inline-block">
              <Link
                href="/assessment"
                data-testid="header-start-assessment-btn"
                className="inline-flex rounded-full bg-accent text-accent-foreground px-5 sm:px-6 py-2.5 min-h-[44px] items-center text-sm font-sans font-bold hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-ring cursor-pointer shadow-warm tracking-wide transition-all"
              >
                <span>{dict.startPractice || "Start assessment"}</span>
                <ArrowRight size={15} weight="bold" className="ml-1.5" />
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              className="lg:hidden w-11 h-11 rounded-full flex items-center justify-center border border-[#C7DDAE] bg-[#FFF7E6] dark:bg-[#1A2615] text-foreground cursor-pointer"
            >
              {isMobileMenuOpen ? <X size={20} /> : <List size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-[#C7DDAE] flex flex-col gap-2 font-sans text-sm">
            <Link
              href="/assessment"
              onClick={() => setIsMobileMenuOpen(false)}
              data-testid="drawer-start-assessment-btn"
              className="min-h-[48px] rounded-full flex items-center justify-center gap-2 px-4 bg-accent text-accent-foreground font-bold text-sm shadow-warm"
            >
              <span>Start assessment</span>
              <ArrowRight size={16} weight="bold" />
            </Link>
            <a
              href="#cover"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] rounded-[16px] flex items-center px-4 border border-[#C7DDAE] bg-[#FFF7E6] dark:bg-[#1A2615]"
            >
              01 Cover Story
            </a>
            <a
              href="#how-agent-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] rounded-[16px] flex items-center px-4 border border-[#C7DDAE] bg-[#FFF7E6] dark:bg-[#1A2615]"
            >
              02 How Agent Works
            </a>
            <a
              href="#demo"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] rounded-[16px] flex items-center px-4 border border-[#C7DDAE] bg-[#FFF7E6] dark:bg-[#1A2615]"
            >
              03 Interactive Workflow
            </a>
            <a
              href="#faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] rounded-[16px] flex items-center px-4 border border-[#C7DDAE] bg-[#FFF7E6] dark:bg-[#1A2615]"
            >
              04 Inquiries &amp; FAQ
            </a>
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] rounded-full flex items-center justify-center px-4 border border-[#C7DDAE] bg-transparent text-foreground font-bold"
            >
              Teacher Sign In
            </Link>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main id="main-content" className="flex-1">

        {/* SECTION 01: HERO MAGAZINE COVER (With Primary "Assess Test" Button Above the Fold) */}
        <section id="cover" className="relative border-b border-[#C7DDAE]/60 dark:border-[#3B5428] overflow-hidden bg-background botanical-dots">
          
          {/* Top Editorial Hairline & Issue Badge */}
          <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-5 pb-2 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-sans tracking-wide text-foreground/70">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-accent rounded-full inline-block animate-pulse"></span>
              <span className="font-bold text-foreground">01 / THE COVER STORY</span>
              <span className="opacity-40">&bull;</span>
              <span className="text-primary font-bold">PRIMARY MATHEMATICS</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-xs bg-[#C7DDAE]/40 px-3 py-1 rounded-full text-primary">
              <GiftBoxMotif size={14} />
              <span>Gently unwrapping learning gaps in 6 minutes</span>
            </div>
          </div>

          {/* MAGAZINE COVER HERO STAGE */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-8 flex flex-col justify-between overflow-hidden pt-4 pb-8 md:py-0 md:min-h-[720px] lg:min-h-[800px]">

            {/* LAYER 1: EDITORIAL HEADLINE */}
            <div className="relative md:absolute md:inset-0 md:z-10 flex flex-col justify-center items-center pointer-events-none select-none px-2 sm:px-6 mb-4 md:mb-0">
              <div className="w-full text-center">
                <h1 className="font-heading uppercase tracking-tight text-foreground leading-[0.92] md:leading-[0.88] text-[clamp(1.9rem,7.5vw,10rem)] m-0">
                  <span className="block break-words sm:whitespace-nowrap">
                    <LuminousType text="WHAT EACH student" italicIndices={[2]} />
                  </span>
                  <span className="block break-words sm:whitespace-nowrap">
                    <LuminousType text="NEEDS TO learn NEXT" italicIndices={[2]} />
                  </span>
                </h1>
                <div className="mt-2.5 sm:mt-3 text-[12px] sm:text-sm font-sans font-bold tracking-widest uppercase text-muted-foreground flex items-center justify-center gap-2">
                  <WarmSparkle size={14} />
                  <span>SHIKSHAGAP AI AGENT &bull; ADAPTIVE DIAGNOSTIC FOR PRIMARY MATH</span>
                  <WarmSparkle size={14} />
                </div>
              </div>
            </div>

            {/* FLOATING MATH SHAPES & BOTANICALS BACKGROUND DRIFT */}
            <MathFloatingShapes />

            {/* LAYER 2 (z-20): 2D CARTOON OWL MASCOT ("GAPPU") */}
            <div className="relative md:absolute md:inset-x-0 md:bottom-0 z-20 flex justify-center pointer-events-auto my-3 md:my-0">
              <div className="relative w-[210px] sm:w-[280px] md:w-[400px] lg:w-[480px] flex items-end justify-center pb-2">
                <MascotHero
                  width={460}
                  height={540}
                  className="w-full max-w-[440px] drop-shadow-md"
                />
              </div>
            </div>

            {/* LAYER 3 (z-30): FOREGROUND CALLOUT WITH PRIMARY 'ASSESS TEST' BUTTON */}
            <div className="relative z-30 pt-2 sm:pt-6 pb-4 sm:pb-6 flex-1 flex flex-col justify-between pointer-events-none">
              
              {/* Upper Section: Primary Agent Action Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pointer-events-auto">
                <div className="md:col-span-5 bg-[#FFF7E6]/95 dark:bg-[#1C2817]/95 p-5 sm:p-7 border-2 border-[#C7DDAE] dark:border-[#3B5428] backdrop-blur-md max-w-md mx-auto md:mx-0 rounded-[28px] shadow-card relative overflow-hidden">
                  
                  {/* Decorative corner blossom */}
                  <div className="absolute -top-3 -right-3 opacity-20 pointer-events-none">
                    <FlowerPetal size={64} />
                  </div>

                  <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-primary font-bold mb-1.5">
                    <BlinkingDots count={3} activeColor="#F28C38" />
                    <span>AI DIAGNOSTIC AGENT</span>
                  </div>

                  <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground mb-2 leading-snug">
                    Find the exact concept blocking your student.
                  </h2>

                  {/* Copy describing the agent */}
                  <div className="space-y-1.5 mb-4 sm:mb-5 text-sm font-sans text-foreground/85 border-t border-b border-[#C7DDAE]/60 dark:border-[#3B5428] py-2.5 sm:py-3">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-primary w-20 shrink-0 text-xs uppercase">Assesses:</span>
                      <span className="text-xs sm:text-sm">Foundational Math across Primary classes (place value, regrouping, tables, fractions)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary w-20 shrink-0 text-xs uppercase">Time:</span>
                      <span className="flex items-center gap-1 text-xs sm:text-sm"><Clock size={14} className="text-accent" /> 6 to 8 minutes per child</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-primary w-20 shrink-0 text-xs uppercase">Output:</span>
                      <span className="flex items-center gap-1 text-xs sm:text-sm"><FileText size={14} className="text-primary" /> Root gap report &amp; 5-day classroom plan</span>
                    </div>
                  </div>

                  {/* PRIMARY ACTION BUTTON: START ASSESSMENT */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <motion.div
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="inline-block"
                    >
                      <Link
                        href="/assessment"
                        data-testid="hero-start-assessment-btn"
                        className="w-full sm:w-auto rounded-full bg-accent text-accent-foreground px-7 py-3.5 min-h-[50px] inline-flex items-center justify-center gap-2 text-base font-sans font-bold hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-ring cursor-pointer shadow-warm active:translate-y-[1px] transition-all"
                      >
                        <span>Start assessment</span>
                        <ArrowRight size={18} weight="bold" />
                      </Link>
                    </motion.div>

                    {/* Secondary button */}
                    <a
                      href="#how-agent-works"
                      className="rounded-full border border-[#C7DDAE] dark:border-[#3B5428] bg-[#C7DDAE]/20 text-foreground px-4 py-2.5 min-h-[44px] inline-flex items-center justify-center text-xs font-sans font-semibold hover:bg-[#C7DDAE]/40 cursor-pointer transition-colors"
                    >
                      See how it works
                    </a>
                  </div>

                  <div className="mt-3 text-xs font-sans text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[var(--status-good)]" />
                    <span>No login required for initial classroom trial</span>
                  </div>
                </div>

                {/* Right Side: What is Inside Card */}
                <div className="hidden md:block md:col-start-9 md:col-span-4 bg-[#FFF7E6]/90 dark:bg-[#1C2817]/90 p-5 border border-[#C7DDAE] dark:border-[#3B5428] backdrop-blur-md text-right rounded-[24px] shadow-warm">
                  <div className="text-xs font-sans uppercase tracking-widest text-primary font-bold mb-2 flex items-center justify-end gap-1.5">
                    <BotanicalLeaf size={14} />
                    <span>WHAT IS INSIDE</span>
                  </div>
                  <ul className="text-xs font-sans space-y-2 text-foreground/80 text-left">
                    <li className="flex items-center justify-between border-b border-[#C7DDAE]/40 pb-1">
                      <span>The 42% Test Score Fallacy</span>
                      <span className="font-bold text-accent">p. 02</span>
                    </li>
                    <li className="flex items-center justify-between border-b border-[#C7DDAE]/40 pb-1">
                      <span>How the AI Agent Traces Gaps</span>
                      <span className="font-bold text-primary">p. 04</span>
                    </li>
                    <li className="flex items-center justify-between border-b border-[#C7DDAE]/40 pb-1">
                      <span>Live Student Gap Report Sample</span>
                      <span className="font-bold text-primary">p. 07</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Printable 1-Page A4 Worksheets</span>
                      <span className="font-bold text-accent">p. 12</span>
                    </li>
                  </ul>
                  <div className="mt-3 pt-2 border-t border-[#C7DDAE]/40 text-xs font-sans text-muted-foreground text-center">
                    MADE FOR INDIAN CLASSROOMS &bull; JOYFUL &amp; FREE
                  </div>
                </div>
              </div>

              {/* Lower Bar: Mascot caption & sticker stamp (Desktop only) */}
              <div className="hidden md:grid grid-cols-1 md:grid-cols-12 gap-4 items-end mt-auto pt-6 pointer-events-auto">
                <div className="md:col-span-5 bg-[#FFF7E6]/95 dark:bg-[#1C2817]/95 p-4 border border-[#C7DDAE] dark:border-[#3B5428] rounded-[22px] shadow-warm">
                  <div className="text-xs font-sans uppercase text-primary font-bold flex items-center gap-1.5">
                    <FlowerPetal size={14} />
                    <span>FIGURE 1.0: GAPPU THE DIAGNOSTIC OWL</span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-snug mt-1">
                    Friendly AI companion Gappu. Hover over him to say hello, or tap him for happy hops and blossom bursts as he gently traces foundational gaps!
                  </p>
                </div>

                <div className="hidden md:flex md:col-start-9 md:col-span-4 justify-end">
                  <div className="bg-[#FFF7E6]/95 dark:bg-[#1C2817]/95 border border-[#C7DDAE] dark:border-[#3B5428] p-3 text-center rounded-[18px] shadow-warm">
                    <div className="text-xs tracking-wider text-muted-foreground uppercase font-sans">
                      SEALED WITH CARE &bull; 2026
                    </div>
                    <div className="text-xs font-mono tracking-widest font-bold text-primary mt-0.5">
                      &bull; &bull; &bull; SHIKSHAGAP &bull; &bull; &bull;
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* FLORAL DIVIDER */}
        <FloralSectionDivider />

        {/* SECTION 02: THE CLASSROOM DILEMMA */}
        <section className="px-4 sm:px-8 py-14 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-primary font-bold mb-4">
            <BotanicalLeaf size={16} />
            <span>02 / THE CLASSROOM DILEMMA</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Pull Quote */}
            <div className="lg:col-span-5 border-l-4 border-primary pl-5 py-2">
              <span className="text-xs font-sans uppercase tracking-widest text-accent font-bold block mb-2">
                THE PROBLEM
              </span>
              <blockquote className="font-heading text-2xl sm:text-3xl lg:text-4xl leading-tight text-foreground">
                A student scores 42% on a test. The mark confirms struggle, but conceals the root cause.
              </blockquote>
              <div className="mt-4 text-xs font-sans text-muted-foreground flex items-center gap-1.5">
                <GiftBoxMotif size={14} />
                <span>DESIGNED FOR TELANGANA AND ANDHRA PRADESH CLASSROOMS</span>
              </div>
            </div>

            {/* Two Side-by-Side Cards with soft fills */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-[24px] border border-[#F7B7C4] bg-[#F7B7C4]/20 p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-warm transition-all duration-200">
                <div>
                  <div className="text-xs font-sans uppercase tracking-wider text-accent font-bold mb-1">
                    The Dilemma
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                    Repeating current class problems creates frustration.
                  </h3>
                  <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed mb-4">
                    When a Class 5 child fails long division, giving 20 more division sums fails. The real gap is almost always in Class 3 regrouping or Class 4 multiplication table fluency.
                  </p>
                </div>
                <div className="pt-2 flex justify-center">
                  <ProblemIllustration />
                </div>
              </div>

              <div className="rounded-[24px] border border-[#6CA24A]/40 bg-[#C7DDAE]/30 p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-warm transition-all duration-200">
                <div>
                  <div className="text-xs font-sans uppercase tracking-wider text-primary font-bold mb-1">
                    The AI Agent Solution
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                    Traces the prerequisite gap and generates a 5-day plan.
                  </h3>
                  <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed mb-4">
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

        {/* FLORAL DIVIDER */}
        <FloralSectionDivider />

        {/* SECTION 05: PULL-QUOTE STYLE STAT ROW */}
        <section className="px-4 sm:px-8 py-14 max-w-7xl mx-auto bg-[#FFF7E6] dark:bg-[#1A2615] rounded-[32px] border border-[#C7DDAE]/60 my-6 shadow-card">
          <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-primary font-bold mb-4">
            <WarmSparkle size={16} />
            <span>05 / VITAL STATISTICS : THE CURRICULUM FOOTPRINT</span>
          </div>

          {/* Editorial Pull-Quote */}
          <div className="max-w-4xl mb-10">
            <blockquote className="font-heading text-2xl sm:text-3xl lg:text-4xl leading-tight text-foreground">
              &ldquo;A curriculum map of 15 connected concepts, taught across 3 Indian regional languages, with zero tracking cookies and built following DPDP Act 2023 principles.&rdquo;
            </blockquote>
          </div>

          {/* Asymmetric Rounded Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-[#C7DDAE]/60">
            <div className="rounded-[20px] bg-[#C7DDAE]/20 p-5 border border-[#C7DDAE]/50">
              <div className="font-heading text-5xl sm:text-6xl font-bold text-primary leading-none">
                15
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-foreground mt-2 font-bold">
                Concepts in DAG
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Single unified acyclic graph
              </div>
            </div>

            <div className="rounded-[20px] bg-[#FFF7E6] dark:bg-[#1C2817] p-5 border border-[#C7DDAE]/50">
              <div className="font-heading text-5xl sm:text-6xl font-bold text-accent leading-none">
                03
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-foreground mt-2 font-bold">
                Languages Supported
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Full translation in English, हिन्दी &amp; తెలుగు
              </div>
            </div>

            <div className="rounded-[20px] bg-[#C7DDAE]/20 p-5 border border-[#C7DDAE]/50">
              <div className="font-heading text-5xl sm:text-6xl font-bold text-foreground leading-none">
                10
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-foreground mt-2 font-bold">
                Classes Enabled (1 to 10)
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Aligned to Class 1 to 10 topics
              </div>
            </div>

            <div className="rounded-[20px] bg-[#FFF7E6] dark:bg-[#1C2817] p-5 border border-[#C7DDAE]/50">
              <div className="font-heading text-5xl sm:text-6xl font-bold text-primary leading-none">
                00
              </div>
              <div className="text-xs font-sans uppercase tracking-wider text-foreground mt-2 font-bold">
                Tracking Cookies
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
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

        {/* SECTION 09: FINAL DISPATCH CTA */}
        <section className="px-4 sm:px-8 py-16 max-w-7xl mx-auto text-center">
          <div className="max-w-2xl mx-auto rounded-[32px] bg-gradient-to-b from-[#FFF7E6] to-[#C7DDAE]/30 dark:from-[#1C2817] dark:to-[#1A2615] border-2 border-[#C7DDAE] p-8 sm:p-12 shadow-card space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-center gap-1.5 text-xs font-sans uppercase tracking-widest text-primary font-bold">
              <FlowerPetal size={16} />
              <span>GET STARTED TODAY</span>
              <FlowerPetal size={16} />
            </div>
            <h2 className="font-heading text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
              Start an assessment to find student learning gaps today.
            </h2>
            <p className="text-sm text-foreground/80 max-w-xl mx-auto leading-relaxed">
              A 6-minute adaptive test gives you the exact prerequisite concept holding each student back, with a 5-day action plan. Free for government schools during the pilot.
            </p>
            <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
              {/* PRIMARY ACTION: ASSESS TEST BUTTON (Final CTA) */}
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/assessment"
                  className="rounded-full min-h-[52px] px-8 bg-accent text-accent-foreground text-sm font-sans font-bold hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-ring inline-flex items-center gap-2 cursor-pointer shadow-warm tracking-wide"
                >
                  <span>Assess Test</span>
                  <ArrowRight size={17} weight="bold" />
                </Link>
              </motion.div>

              {/* Visually quieter secondary button */}
              <a
                href="#pilot"
                className="rounded-full min-h-[48px] px-6 border border-[#C7DDAE] bg-[#FFF7E6] text-foreground text-sm font-sans font-bold hover:bg-[#C7DDAE]/30 inline-flex items-center cursor-pointer transition-colors"
              >
                Request School Pilot
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 10: COLOPHON & FOOTER */}
      <footer className="border-t border-[#C7DDAE]/60 bg-[#FFF7E6] dark:bg-[#1A2615] px-4 sm:px-8 py-12 text-xs font-sans text-foreground/80">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-[#C7DDAE]/40">
          <div>
            <div className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
              <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground font-heading text-sm flex items-center justify-center font-bold">
                <FlowerPetal size={16} color="#FFF7E6" centerColor="#F4C542" />
              </span>
              <span className="text-primary font-bold">Shiksha<span className="text-accent">Gap</span></span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 max-w-md leading-relaxed">
              AI-powered learning gap detection and personalized remediation for Indian schools, Classes 1 to 10 across NCERT and ICSE curricula.
            </p>
            <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
              <GiftBoxMotif size={15} />
              <span>Built Following DPDP Act 2023 Principles &bull; Made for Indian Government Schools</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 md:gap-8 justify-between md:justify-end text-xs uppercase tracking-wider text-muted-foreground flex-wrap">
            <div className="space-y-2 flex flex-col">
              <span className="font-bold text-foreground">Curriculum &amp; Guides</span>
              <Link href="/learning-gaps" className="text-primary font-bold hover:underline">Learning Gaps Guide</Link>
              <Link href="/curriculum/classes-1-3" className="hover:text-primary">Classes 1–3 (Foundational)</Link>
              <Link href="/curriculum/classes-4-5" className="hover:text-primary">Classes 4–5 (Preparatory)</Link>
              <Link href="/curriculum/classes-6-8" className="hover:text-primary">Classes 6–8 (Middle)</Link>
              <Link href="/curriculum/classes-9-10" className="hover:text-primary">Classes 9–10 (Secondary)</Link>
            </div>
            <div className="space-y-2 flex flex-col">
              <span className="font-bold text-foreground">Diagnostic Actions</span>
              <Link href="/assessment" className="text-primary font-bold hover:underline">Assess Test Now</Link>
              <Link href="/how-it-works" className="hover:text-primary">How Agent Works</Link>
              <a href="#demo" className="hover:text-primary">Interactive Demo</a>
              <a href="#pilot" className="hover:text-primary">Request Pilot</a>
              <Link href="/login" className="hover:text-primary">Teacher Sign In</Link>
            </div>
            <div className="space-y-2 flex flex-col">
              <span className="font-bold text-foreground">Legal &amp; Governance</span>
              <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
              <Link href="/cookies" className="hover:text-primary">Cookie Notice</Link>
              <Link href="/notices/guardian" className="hover:text-primary">Guardian Notice</Link>
              <Link href="/data-request" className="hover:text-primary">Data Request</Link>
              <Link href="/licenses" className="hover:text-primary">Licenses</Link>
            </div>
            <div className="space-y-2 flex flex-col">
              <span className="font-bold text-foreground">Official Contact</span>
              <div className="text-xs text-foreground/80 leading-snug">
                <span>Email: </span>
                <a href={`mailto:${siteConfig.contactEmail}`} className="text-primary underline font-bold">
                  {siteConfig.contactEmail}
                </a>
              </div>
              <div className="text-xs text-muted-foreground">
                Educational Cell : {siteConfig.city}
              </div>
              <Link href="/data-request" className="text-foreground hover:text-primary">
                DPDP Grievance Desk
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6 flex flex-col sm:flex-row justify-between text-xs text-muted-foreground gap-2">
          <div>Copyright 2026 ShikshaGap. Sealed with care. All rights reserved.</div>
          <div>Strictly necessary storage only. Zero third-party tracking.</div>
        </div>
      </footer>

      {/* STICKY MOBILE CTA BAR */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FFF7E6]/95 dark:bg-[#1A2615]/95 border-t border-[#C7DDAE] px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 shadow-warm backdrop-blur-md">
        <div className="flex flex-col">
          <span className="text-[12px] font-sans uppercase tracking-wider text-primary font-bold">
            AI Diagnostic
          </span>
          <span className="text-[12px] font-sans text-foreground font-bold">
            Class 1 to 10 Math
          </span>
        </div>
        <Link
          href="/assessment"
          className="min-h-[44px] px-5 rounded-full bg-accent text-accent-foreground text-xs font-sans font-bold inline-flex items-center justify-center gap-1.5 shadow-warm active:scale-95"
        >
          <span>Assess Test</span>
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>
    </div>
  );
}
