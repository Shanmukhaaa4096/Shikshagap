import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ArrowLeft, ArrowRight, Brain, BookOpen, CheckCircle } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: `Classes 1 to 3 Maths Learning Gaps: Foundational Numeracy | ${siteConfig.siteName}`,
  description:
    "Diagnose foundational mathematics learning gaps in Classes 1, 2, and 3. Aligned to NCERT Joyful Mathematics and ICSE CISCE for early number confidence.",
  openGraph: {
    title: `Classes 1 to 3 Maths Learning Gaps: Foundational Numeracy | ${siteConfig.siteName}`,
    description:
      "Diagnose foundational mathematics learning gaps in Classes 1, 2, and 3. Aligned to NCERT Joyful Mathematics and ICSE CISCE for early number confidence.",
    url: `${siteConfig.siteUrl}/curriculum/classes-1-3`,
    siteName: siteConfig.siteName,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${siteConfig.siteName} Classes 1 to 3 Mathematics` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Classes 1 to 3 Maths Learning Gaps: Foundational Numeracy | ${siteConfig.siteName}`,
    description:
      "Diagnose foundational mathematics learning gaps in Classes 1, 2, and 3. Aligned to NCERT Joyful Mathematics and ICSE CISCE for early number confidence.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/curriculum/classes-1-3`,
  },
};

export default function Classes1to3Page() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/assessment"
              className="neo-btn neo-btn-primary px-4 py-2 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer"
            >
              <span>Assess Class 1–3</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto space-y-10">
          <header className="space-y-4 border-b border-border pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Foundational Stage (Ages 6 to 9)</span>
            </div>
            <h1 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
              Classes 1 to 3 Mathematics: Foundational Numeracy & Concept Diagnostics
            </h1>
            <p className="text-base sm:text-lg text-foreground/85 leading-relaxed max-w-3xl font-sans">
              Building concrete number sense, place value comprehension, and arithmetic intuition aligned to NCERT Joyful Mathematics / Math-Magic and ICSE CISCE curriculum guidelines.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              Core Competencies for Primary Grades 1, 2, and 3
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-primary">Class 1 Focus</span>
                <h3 className="font-bold text-sm text-foreground">Counting & Comparison</h3>
                <p className="text-xs text-foreground/75 leading-relaxed font-sans">
                  Numbers to 20, concrete counting, one-to-one correspondence, basic visual addition, and non-standard measurement (NCERT Joyful Mathematics Chapter 1 to 4).
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-primary">Class 2 Focus</span>
                <h3 className="font-bold text-sm text-foreground">Place Value & Regrouping</h3>
                <p className="text-xs text-foreground/75 leading-relaxed font-sans">
                  Tens and ones place value, numbers to 100, 2-digit addition and subtraction, patterns, and currency identification (NCERT Joyful Mathematics & ICSE CISCE).
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-primary">Class 3 Focus</span>
                <h3 className="font-bold text-sm text-foreground">3-Digit Math & Multiplication</h3>
                <p className="text-xs text-foreground/75 leading-relaxed font-sans">
                  Numbers to 1000, 3-digit regrouping, multiplication as repeated addition, equal sharing division, simple fractions, and calendar reasoning (NCERT Math-Magic & ICSE).
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              Common Foundational Misconceptions Detected
            </h2>
            <ul className="space-y-3 font-sans text-sm text-foreground/80">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Place Value Reversals:</strong> Treating the number 42 as 4 ones and 2 tens, or failing to understand zero as a place holder in 105.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Subtraction Regrouping Inversion:</strong> When calculating 52 minus 27, subtracting 2 from 7 instead of regrouping from the tens column.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Equal Sharing vs Remainder:</strong> Memorizing multiplication tables without understanding equal groups, leading to immediate breakdown in Class 3 division problems.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-4 border-t border-border pt-8">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              Continue Exploring Curricula
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/learning-gaps" className="neo-btn neo-btn-secondary px-4 py-2 text-xs font-bold rounded-full">
                What is a Learning Gap?
              </Link>
              <Link href="/curriculum/classes-4-5" className="neo-btn neo-btn-secondary px-4 py-2 text-xs font-bold rounded-full">
                Classes 4 and 5 (Preparatory)
              </Link>
              <Link href="/curriculum/classes-6-8" className="neo-btn neo-btn-secondary px-4 py-2 text-xs font-bold rounded-full">
                Classes 6 to 8 (Middle School)
              </Link>
              <Link href="/curriculum/classes-9-10" className="neo-btn neo-btn-secondary px-4 py-2 text-xs font-bold rounded-full">
                Classes 9 and 10 (Secondary)
              </Link>
            </div>
          </section>

          <section className="p-6 rounded-3xl bg-card border border-primary/30 space-y-3 text-center">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              Assess a Class 1, 2, or 3 Learner Now
            </h2>
            <p className="text-sm text-foreground/80 max-w-lg mx-auto font-sans">
              Takes just 6 minutes with clean visual prompts and trilingual instructions in English, Hindi, and Telugu.
            </p>
            <div className="pt-1">
              <Link
                href="/assessment"
                className="neo-btn neo-btn-primary px-8 py-3 text-base font-bold rounded-full inline-flex items-center gap-2 cursor-pointer"
              >
                <Brain className="w-5 h-5 text-primary-foreground" />
                <span>Start Free Assessment</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </section>
        </article>
      </main>

      <footer className="border-t border-border bg-card/60 py-6 px-4 sm:px-6 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-mono">
          <div>ShikshaGap • Foundational Numeracy & Prerequisite Diagnostic System</div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/assessment" className="hover:underline">Assessment</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
