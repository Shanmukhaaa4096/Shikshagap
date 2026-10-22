import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ArrowLeft, ArrowRight, Brain, BookOpen, CheckCircle } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: `Classes 6 to 8 Maths Learning Gaps: Middle School Algebra & Geometry | ${siteConfig.siteName}`,
  description:
    "Preview planned middle school mathematics curriculum for Classes 6 to 8 across NCERT (CBSE) and ICSE Selina. Diagnostic assessments currently in preparation.",
  openGraph: {
    title: `Classes 6 to 8 Maths Learning Gaps: Middle School Algebra & Geometry | ${siteConfig.siteName}`,
    description:
      "Preview planned middle school mathematics curriculum for Classes 6 to 8 across NCERT (CBSE) and ICSE Selina. Diagnostic assessments currently in preparation.",
    url: `${siteConfig.siteUrl}/curriculum/classes-6-8`,
    siteName: siteConfig.siteName,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${siteConfig.siteName} Classes 6 to 8 Mathematics` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Classes 6 to 8 Maths Learning Gaps: Middle School Algebra & Geometry | ${siteConfig.siteName}`,
    description:
      "Preview planned middle school mathematics curriculum for Classes 6 to 8 across NCERT (CBSE) and ICSE Selina. Diagnostic assessments currently in preparation.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/curriculum/classes-6-8`,
  },
};

export default function Classes6to8Page() {
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
              <span>Assess Live Classes (3 to 5)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto space-y-10">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-foreground text-xs sm:text-sm font-sans flex items-start gap-3">
            <span className="font-bold uppercase tracking-wider font-mono text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-100 shrink-0">Planned Curriculum Preview</span>
            <div>
              <strong>This is a preview of the planned curriculum for Classes 6 to 8.</strong> Interactive diagnostic assessments for these grades are currently in preparation. Live assessments are currently available for Classes 3 to 5.
            </div>
          </div>

          <header className="space-y-4 border-b border-border pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Middle Stage (Ages 11 to 14)</span>
            </div>
            <h1 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
              Classes 6 to 8 Mathematics: Integers, Rational Numbers & Pre-Algebra
            </h1>
            <p className="text-base sm:text-lg text-foreground/85 leading-relaxed max-w-3xl font-sans">
              Bridging arithmetic into abstract symbolic algebra, negative quantities, ratios, and geometric theorems under NCERT (CBSE Ganita Prakash) and ICSE (Selina / Concise Maths).
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              Middle School Curriculum Progression by Class
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-primary">Class 6 Focus</span>
                <h3 className="font-bold text-sm text-foreground">Negative Numbers & Ratios</h3>
                <p className="text-xs text-foreground/75 leading-relaxed font-sans">
                  Integer number lines, basic algebra notation (letters for unknowns), ratios, proportions, prime factorization, and parallel lines (NCERT Ganita Prakash Ch 1–10).
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-primary">Class 7 Focus</span>
                <h3 className="font-bold text-sm text-foreground">Rational Numbers & Equations</h3>
                <p className="text-xs text-foreground/75 leading-relaxed font-sans">
                  Multiplication/division of integers, rational numbers on number lines, simple linear equations, triangle angle sums, congruence, and percentages (NCERT & ICSE Selina).
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-primary">Class 8 Focus</span>
                <h3 className="font-bold text-sm text-foreground">Linear Equations & Quadratics Entry</h3>
                <p className="text-xs text-foreground/75 leading-relaxed font-sans">
                  Linear equations in one variable, algebraic identities, factorization of polynomials, powers & exponents, squares & square roots, and surface areas (NCERT & ICSE).
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              The Abstract Shift: Why Middle School Students Struggle
            </h2>
            <p className="text-base text-foreground/80 leading-relaxed font-sans">
              Middle school introduces negative signs, symbolic variables, and non-intuitive algebraic operations. Without concrete conceptual anchors, students rely on brittle memorized mnemonics:
            </p>
            <ul className="space-y-3 font-sans text-sm text-foreground/80 pt-1">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Negative Sign Operations:</strong> Misapplying multiplication sign rules to addition (e.g. writing &quot;-4 - 3 = +7&quot; because &quot;two minuses make a plus&quot;).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Equals Sign Misconception:</strong> Viewing &quot;=&quot; as an &quot;execute operation&quot; prompt rather than an equivalence balance between left and right sides.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Insecure Fraction Arithmetic:</strong> Struggling with rational algebraic coefficients because Class 4 and 5 fraction addition was never mastered.</span>
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
              <Link href="/curriculum/classes-4-5" className="neo-btn neo-btn-secondary px-4 py-2 text-xs font-bold rounded-full">
                Classes 4 and 5 (Preparatory)
              </Link>
              <Link href="/curriculum/classes-9-10" className="neo-btn neo-btn-secondary px-4 py-2 text-xs font-bold rounded-full">
                Classes 9 and 10 (Secondary)
              </Link>
            </div>
          </section>

          <section className="p-6 rounded-3xl bg-card border border-primary/30 space-y-3 text-center">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              Classes 6 to 8 Assessments in Preparation
            </h2>
            <p className="text-sm text-foreground/80 max-w-lg mx-auto font-sans">
              Diagnostic assessments for middle school classes are currently being developed. You can run live diagnostic assessments for Classes 3 to 5 right now.
            </p>
            <div className="pt-1">
              <Link
                href="/assessment"
                className="neo-btn neo-btn-primary px-8 py-3 text-base font-bold rounded-full inline-flex items-center gap-2 cursor-pointer"
              >
                <Brain className="w-5 h-5 text-primary-foreground" />
                <span>Start Live Assessment (Classes 3 to 5)</span>
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
