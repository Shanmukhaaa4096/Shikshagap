import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ArrowLeft, ArrowRight, Brain, BookOpen, CheckCircle } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: `Classes 9 and 10 Maths Learning Gaps: Secondary Board Readiness | ${siteConfig.siteName}`,
  description:
    "Diagnose secondary mathematics learning gaps in Classes 9 and 10 for CBSE NCERT and ICSE board readiness, covering polynomials, quadratics, and trig.",
  openGraph: {
    title: `Classes 9 and 10 Maths Learning Gaps: Secondary Board Readiness | ${siteConfig.siteName}`,
    description:
      "Diagnose secondary mathematics learning gaps in Classes 9 and 10 for CBSE NCERT and ICSE board readiness, covering polynomials, quadratics, and trig.",
    url: `${siteConfig.siteUrl}/curriculum/classes-9-10`,
    siteName: siteConfig.siteName,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${siteConfig.siteName} Classes 9 and 10 Mathematics` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Classes 9 and 10 Maths Learning Gaps: Secondary Board Readiness | ${siteConfig.siteName}`,
    description:
      "Diagnose secondary mathematics learning gaps in Classes 9 and 10 for CBSE NCERT and ICSE board readiness, covering polynomials, quadratics, and trig.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/curriculum/classes-9-10`,
  },
};

export default function Classes9to10Page() {
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
              <span>Assess Class 9–10</span>
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
              <span>Secondary Stage (Ages 14 to 16)</span>
            </div>
            <h1 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
              Classes 9 and 10 Mathematics: Polynomials, Quadratics & Trigonometry
            </h1>
            <p className="text-base sm:text-lg text-foreground/85 leading-relaxed max-w-3xl font-sans">
              Diagnosing board-level prerequisite gaps for Class 10 CBSE (NCERT Rationalised 2024–25 & Exemplar) and ICSE (CISCE / ML Aggarwal / Selina).
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              Secondary Board Curriculum Coverage
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-primary">Class 9 Foundation</span>
                <h3 className="font-bold text-base text-foreground">Number Systems & Geometry Foundations</h3>
                <p className="text-xs text-foreground/75 leading-relaxed font-sans">
                  Irrational numbers, remainder theorem, linear equations in two variables, coordinate geometry, lines & angles, congruency theorems, and surface areas (NCERT & ICSE).
                </p>
              </div>
              <div className="p-5 rounded-xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-primary">Class 10 Board Standards</span>
                <h3 className="font-bold text-base text-foreground">Real Numbers, Quadratics & Trigonometry</h3>
                <p className="text-xs text-foreground/75 leading-relaxed font-sans">
                  Fundamental Theorem of Arithmetic, quadratic formula, arithmetic progressions, similar triangles, coordinate section formula, trigonometric identities, and statistics (NCERT Rationalised 2024–25 & ICSE).
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              Why Board Exam Struggles Trace to Middle School Roots
            </h2>
            <p className="text-base text-foreground/80 leading-relaxed font-sans">
              Secondary school students facing low marks on Class 10 mock exams often receive advice to &quot;do more past papers&quot;. However, error analysis reveals that past paper practice fails when underlying prerequisite concepts are broken:
            </p>
            <ul className="space-y-3 font-sans text-sm text-foreground/80 pt-1">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Quadratic Factorization Failure:</strong> Students cannot solve ax² + bx + c = 0 because they never mastered splitting the middle term from Class 8.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Trigonometric Ratio Breakdown:</strong> Rote memorization of sin, cos, tan tables without understanding right triangle similarity ratios from Class 7 and 9.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span><strong>Coordinate Distance & Section Errors:</strong> Confusion with algebraic signs under the square root in the distance formula tracing back to Class 7 integer arithmetic.</span>
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
              <Link href="/curriculum/classes-6-8" className="neo-btn neo-btn-secondary px-4 py-2 text-xs font-bold rounded-full">
                Classes 6 to 8 (Middle School)
              </Link>
            </div>
          </section>

          <section className="p-6 rounded-3xl bg-card border border-primary/30 space-y-3 text-center">
            <h2 className="editorial-title text-2xl font-bold text-foreground">
              Assess a Class 9 or 10 Student Now
            </h2>
            <p className="text-sm text-foreground/80 max-w-lg mx-auto font-sans">
              Takes just 6 minutes with dual-board NCERT/ICSE difficulty calibration and step-by-step diagnostic reasoning.
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
