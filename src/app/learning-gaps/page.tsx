import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ArrowLeft, ArrowRight, Brain, CheckCircle, WarningCircle, TreeStructure } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: `What is a Learning Gap? Mathematics Diagnosis & Prerequisite Graphs | ${siteConfig.siteName}`,
  description:
    "Understand what a learning gap is in school mathematics, how hidden prerequisite weaknesses cause repeated mistakes, and how diagnostic trees fix root causes.",
  openGraph: {
    title: `What is a Learning Gap? Mathematics Diagnosis & Prerequisite Graphs | ${siteConfig.siteName}`,
    description:
      "Understand what a learning gap is in school mathematics, how hidden prerequisite weaknesses cause repeated mistakes, and how diagnostic trees fix root causes.",
    url: `${siteConfig.siteUrl}/learning-gaps`,
    siteName: siteConfig.siteName,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${siteConfig.siteName} Learning Gaps Explainer` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `What is a Learning Gap? Mathematics Diagnosis & Prerequisite Graphs | ${siteConfig.siteName}`,
    description:
      "Understand what a learning gap is in school mathematics, how hidden prerequisite weaknesses cause repeated mistakes, and how diagnostic trees fix root causes.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/learning-gaps`,
  },
};

export default function LearningGapsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col">
      {/* Navigation */}
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
              <span>Take Free Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto space-y-10">
          {/* Header Section */}
          <header className="space-y-4 border-b border-border pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase">
              <TreeStructure className="w-3.5 h-3.5" />
              <span>Pedagogical Guide</span>
            </div>
            <h1 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
              Understanding and Diagnosing Learning Gaps in School Mathematics
            </h1>
            <p className="text-base sm:text-lg text-foreground/85 leading-relaxed max-w-3xl font-sans">
              Why repeating the same lesson rarely helps a student who failed a test, and how prerequisite concept trees uncover the true starting point for remediation across NCERT and ICSE curricula.
            </p>
          </header>

          {/* Section 1: Definition */}
          <section className="space-y-4">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              1. What is a Learning Gap?
            </h2>
            <p className="text-base text-foreground/80 leading-relaxed font-sans">
              A learning gap is the divergence between what a student is expected to understand at their current grade level and what they have actually mastered. Unlike a casual careless error or misreading a question, a true learning gap represents a missing foundational concept in the student&apos;s mental model.
            </p>
            <p className="text-base text-foreground/80 leading-relaxed font-sans">
              Mathematics is uniquely cumulative. Every new topic rests upon earlier pillars. When a Class 5 student struggles with long division, the breakdown is rarely caused by the division algorithm itself. In over 70% of cases, the true barrier is insecure single-digit multiplication recall or place value misalignment from Class 3.
            </p>
          </section>

          {/* Section 2: Mistake vs Root Cause */}
          <section className="space-y-4">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              2. Surface Errors vs. Root-Cause Prerequisites
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-card border border-[var(--status-warn-border)] space-y-2">
                <div className="flex items-center gap-2 text-[var(--status-warn)] font-bold text-sm">
                  <WarningCircle className="w-4 h-4" />
                  <span>The Surface Symptom</span>
                </div>
                <h3 className="font-bold text-base text-foreground">Student fails Class 7 algebraic equation: 3x + 5 = 20</h3>
                <p className="text-xs text-foreground/75 leading-relaxed font-sans">
                  Standard marking marks the question incorrect (0 marks). A traditional worksheet provides 20 more linear equations to practise without addressing the missing rule.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-[var(--status-good-border)] space-y-2">
                <div className="flex items-center gap-2 text-[var(--status-good)] font-bold text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>The Diagnostic Root Cause</span>
                </div>
                <h3 className="font-bold text-base text-foreground">Insecure negative integer subtraction (Class 6 prerequisite)</h3>
                <p className="text-xs text-foreground/75 leading-relaxed font-sans">
                  The student understands the balancing concept of equality, but miscalculates inverse operations because they cannot subtract integers reliably on a number line.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Prerequisite Graph */}
          <section className="space-y-4">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              3. The Power of Prerequisite DAG Modeling
            </h2>
            <p className="text-base text-foreground/80 leading-relaxed font-sans">
              ShikshaGap organizes school mathematics as a Directed Acyclic Graph (DAG). Rather than treating a syllabus as a linear checklist of textbook chapters, each skill connects explicitly to its foundational prerequisites:
            </p>
            <ul className="space-y-2 text-sm text-foreground/80 list-disc list-inside font-sans pl-2">
              <li><strong>Class 10 Trigonometry</strong> requires <strong>Class 9 Similar Triangles</strong> and <strong>Class 7 Ratio and Proportion</strong>.</li>
              <li><strong>Class 8 Linear Equations</strong> requires <strong>Class 6 Integer Operations</strong> and <strong>Class 4 Order of Operations</strong>.</li>
              <li><strong>Class 5 Fractions</strong> requires <strong>Class 3 Division as Equal Sharing</strong> and <strong>Class 2 Unit Grouping</strong>.</li>
            </ul>
            <p className="text-base text-foreground/80 leading-relaxed font-sans">
              When a student gives an incorrect answer during an assessment, ShikshaGap steps down the prerequisite tree to test the supporting skill. This ensures remediation focuses on the root cause rather than repeatedly testing a concept the student cannot yet access.
            </p>
          </section>

          {/* Section 4: Dual Board Alignment */}
          <section className="space-y-4">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              4. Alignment to NCERT (CBSE) and ICSE (CISCE) Syllabi
            </h2>
            <p className="text-base text-foreground/80 leading-relaxed font-sans">
              In India, schools follow distinct curricular philosophies that influence how learning gaps form:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-primary uppercase">NCERT / CBSE Alignment</span>
                <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                  Focuses on conceptual inquiry, intuitive reasoning, and real-world story problems based on the Rationalised 2024–25 editions (Math-Magic, Ganita Prakash, Exemplar).
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-primary uppercase">ICSE / CISCE Alignment</span>
                <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                  Emphasizes formal symbolic rigour, exact definitions, multi-step calculation procedures, and algebraic proofs (Selina Concise Mathematics, ML Aggarwal).
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Explore Class Groups */}
          <section className="space-y-4 border-t border-border pt-8">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              5. Explore Diagnostics by Class Level
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <Link
                href="/curriculum/classes-1-3"
                className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all space-y-1 block cursor-pointer group"
              >
                <div className="text-xs font-mono font-bold text-primary">Foundational</div>
                <div className="font-bold text-sm text-foreground group-hover:text-primary">Classes 1 to 3</div>
                <p className="text-xs text-foreground/70">Number sense, place value, and basic operations.</p>
              </Link>
              <Link
                href="/curriculum/classes-4-5"
                className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all space-y-1 block cursor-pointer group"
              >
                <div className="text-xs font-mono font-bold text-primary">Preparatory</div>
                <div className="font-bold text-sm text-foreground group-hover:text-primary">Classes 4 and 5</div>
                <p className="text-xs text-foreground/70">Multi-digit math, fractions, and measurement.</p>
              </Link>
              <Link
                href="/curriculum/classes-6-8"
                className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all space-y-1 block cursor-pointer group"
              >
                <div className="text-xs font-mono font-bold text-primary">Middle Stage</div>
                <div className="font-bold text-sm text-foreground group-hover:text-primary">Classes 6 to 8</div>
                <p className="text-xs text-foreground/70">Integers, rational numbers, and pre-algebra.</p>
              </Link>
              <Link
                href="/curriculum/classes-9-10"
                className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all space-y-1 block cursor-pointer group"
              >
                <div className="text-xs font-mono font-bold text-primary">Secondary</div>
                <div className="font-bold text-sm text-foreground group-hover:text-primary">Classes 9 and 10</div>
                <p className="text-xs text-foreground/70">Polynomials, quadratics, and trigonometry.</p>
              </Link>
            </div>
          </section>

          {/* CTA */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card border border-primary/30 space-y-4 text-center">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              Ready to check a student&apos;s learning gaps?
            </h2>
            <p className="text-sm text-foreground/80 max-w-xl mx-auto font-sans">
              Start an adaptive diagnostic check. No sign-in or student personal data required. It takes 6 minutes and delivers an actionable remediation plan.
            </p>
            <div className="pt-2">
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

      {/* Footer */}
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
