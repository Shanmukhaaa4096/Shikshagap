import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ArrowLeft, ArrowRight, Brain, BookOpen, CheckCircle } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: `Classes 4 and 5 Maths Learning Gaps: Preparatory Mathematics | ${siteConfig.siteName}`,
  description:
    "Identify preparatory mathematics learning gaps in Classes 4 and 5 across NCERT Math-Magic and ICSE CISCE, covering multi-digit math, fractions, and area.",
  openGraph: {
    title: `Classes 4 and 5 Maths Learning Gaps: Preparatory Mathematics | ${siteConfig.siteName}`,
    description:
      "Identify preparatory mathematics learning gaps in Classes 4 and 5 across NCERT Math-Magic and ICSE CISCE, covering multi-digit math, fractions, and area.",
    url: `${siteConfig.siteUrl}/curriculum/classes-4-5`,
    siteName: siteConfig.siteName,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${siteConfig.siteName} Classes 4 and 5 Mathematics` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Classes 4 and 5 Maths Learning Gaps: Preparatory Mathematics | ${siteConfig.siteName}`,
    description:
      "Identify preparatory mathematics learning gaps in Classes 4 and 5 across NCERT Math-Magic and ICSE CISCE, covering multi-digit math, fractions, and area.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/curriculum/classes-4-5`,
  },
};

export default function Classes4to5Page() {
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
              <span>Assess Class 4–5</span>
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
              <span>Preparatory Stage (Ages 9 to 11)</span>
            </div>
            <h1 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
              Classes 4 and 5 Mathematics: Multi-Digit Operations, Fractions & Measurement
            </h1>
            <p className="text-base sm:text-lg text-foreground/85 leading-relaxed max-w-3xl font-sans">
              Navigating the critical cognitive leap from concrete counting to multiplicative reasoning, rational parts, and geometric mensuration under NCERT Math-Magic and ICSE CISCE.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              Core Competencies for Upper Primary Classes 4 and 5
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-primary">Class 4 Competencies</span>
                <h3 className="font-bold text-base text-foreground">Multi-Digit Arithmetic & Metric Units</h3>
                <p className="text-xs text-foreground/75 leading-relaxed font-sans">
                  Numbers up to 10,000, 2-digit multiplication, division with remainders, halves and quarters, clock angles, perimeter of rectangles, and metric volume conversions (NCERT Math-Magic Ch 1 to 14).
                </p>
              </div>
              <div className="p-5 rounded-xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-primary">Class 5 Competencies</span>
                <h3 className="font-bold text-base text-foreground">Fractions, Decimals, Factors & Area</h3>
                <p className="text-xs text-foreground/75 leading-relaxed font-sans">
                  Large numbers (lakhs & crores), LCM and HCF, equivalent fractions, decimals as tenths/hundredths, area calculation, 3D nets, and rotational symmetry (NCERT Math-Magic & ICSE CISCE Standards).
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              The Critical Prerequisite Pivot: Additive to Multiplicative Thinking
            </h2>
            <p className="text-base text-foreground/80 leading-relaxed font-sans">
              Research consistently identifies the transition between Class 3 and Class 5 as the moment where math learning gaps widen most rapidly. When students rely solely on repeated counting to solve multi-digit problems, their working memory becomes overloaded:
            </p>
            <ul className="space-y-3 font-sans text-sm text-foreground/80 pt-1">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Fraction Incomprehension:</strong> Treating numerator and denominator as separate independent whole numbers (e.g. thinking 1/4 is bigger than 1/2 because 4 is bigger than 2).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Long Division Breakdown:</strong> Forgetting the standard estimate-multiply-subtract-bring-down loop due to insecure multiplication recall.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Area vs Perimeter Confusion:</strong> Confusing the boundary length of a shape with the 2-dimensional grid space enclosed within it.</span>
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
              <Link href="/curriculum/classes-1-3" className="neo-btn neo-btn-secondary px-4 py-2 text-xs font-bold rounded-full">
                Classes 1 to 3 (Foundational)
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
              Assess a Class 4 or 5 Student Now
            </h2>
            <p className="text-sm text-foreground/80 max-w-lg mx-auto font-sans">
              Takes just 6 minutes with dual-board NCERT/ICSE difficulty calibration and an instant 5-day printable remedial worksheet.
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
