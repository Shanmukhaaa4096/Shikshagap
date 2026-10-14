import Link from "next/link";
import { ArrowLeft, FileText, Warning } from "@phosphor-icons/react/dist/ssr";
import { siteConfig } from "@/config/site";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Terms of Service | ${siteConfig.siteName}`,
  description: "Terms of service and pedagogical guidelines for using the ShikshaGap diagnostic system.",
  openGraph: {
    title: `Terms of Service | ${siteConfig.siteName}`,
    description: "Terms of service and pedagogical guidelines for using the ShikshaGap diagnostic system.",
    url: `${siteConfig.siteUrl}/terms`,
    siteName: siteConfig.siteName,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${siteConfig.siteName} Terms of Service` }],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/terms`,
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-card dark:bg-muted text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Link
            href="/"
            className="text-xs font-bold text-foreground hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <span className="font-mono text-xs text-muted-foreground dark:text-muted-foreground">
            Last updated: October 2026
          </span>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted text-foreground text-xs font-mono font-bold rounded-[2px] border border-border">
            <FileText className="w-4 h-4 text-foreground" />
            <span>TERMS OF PEDAGOGICAL USE</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-foreground">
            Terms of Service
          </h1>
          <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed">
            Welcome to ShikshaGap. By accessing or using the ShikshaGap application at shikshagap.vercel.app or associated domains, you agree to these Terms of Service.
          </p>
        </div>

        <div className="p-4 bg-muted border border-border rounded-[2px] space-y-2 text-xs text-foreground">
          <div className="flex items-center gap-2 font-bold">
            <Warning className="w-4 h-4 text-primary" />
            <span>Independent Academic Tool Notice:</span>
          </div>
          <p className="text-foreground/80 leading-relaxed">
            ShikshaGap is an independent, pilot-stage research and educational intelligence prototype provided free of charge for Indian government schools during the pilot phase. It is not affiliated with, endorsed by, or representing any government department, state education board, or government initiative (such as PM SHRI or Samagra Shiksha). Mention of curriculum standards (e.g., NCERT or SCERT Classes 3 to 5) is solely for pedagogical alignment.
          </p>
        </div>

        <section className="space-y-3 text-xs leading-relaxed">
          <h2 className="font-serif text-xl font-bold text-foreground">
            1. Intended Users &amp; Permitted Use
          </h2>
          <p className="text-foreground/80 dark:text-muted-foreground">
            ShikshaGap is provided for elementary school teachers, headmasters, educational researchers, and academic mentors. You agree to use the platform only for legitimate formative classroom assessment and pedagogical remediation in elementary school mathematics.
          </p>
        </section>

        <section className="space-y-3 text-xs leading-relaxed">
          <h2 className="font-serif text-xl font-bold text-foreground">
            2. Nature of AI Diagnostic Assistance
          </h2>
          <p className="text-foreground/80 dark:text-muted-foreground">
            Our diagnostic engine uses mathematical rule trees combined with artificial intelligence (Google Gemini API) to suggest probable prerequisite gaps. You acknowledge and agree that:
          </p>
          <ul className="list-disc list-inside space-y-1 text-foreground/80 dark:text-muted-foreground">
            <li>Outputs are formative pedagogical guidance, not psychological, clinical, or statutory evaluations.</li>
            <li>Teacher judgement is always final. Automated diagnoses must never be used to penalize, track, or label a student.</li>
            <li>We do not guarantee 100% diagnostic accuracy under all circumstances.</li>
          </ul>
        </section>

        <section className="space-y-3 text-xs leading-relaxed">
          <h2 className="font-serif text-xl font-bold text-foreground">
            3. Account Security &amp; Confidentiality
          </h2>
          <p className="text-foreground/80 dark:text-muted-foreground">
            Authorized teachers are responsible for maintaining the confidentiality of their login credentials. Any unauthorized access to classroom student profiles must be reported immediately to <a href={`mailto:${siteConfig.contactEmail}`} className="underline font-bold">{siteConfig.contactEmail}</a>.
          </p>
        </section>

        <section className="space-y-3 text-xs leading-relaxed border-t border-border pt-6">
          <h2 className="font-serif text-xl font-bold text-foreground">
            4. Limitation of Liability &amp; Governing Law
          </h2>
          <p className="text-foreground/80 dark:text-muted-foreground">
            ShikshaGap is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis without warranty of any kind. To the fullest extent permitted under Indian law, ShikshaGap contributors shall not be liable for any indirect or consequential damages resulting from pedagogical use. These terms are governed by the laws of India, with exclusive jurisdiction in Hyderabad, Telangana.
          </p>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground pt-2">
            The English version of these Terms of Service is the authoritative legal text.
          </p>
        </section>
      </div>
    </div>
  );
}
