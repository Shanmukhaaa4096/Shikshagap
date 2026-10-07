import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Warning } from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "Terms of Service | ShikshaGap",
  description: "Terms of service and pedagogical guidelines for using the ShikshaGap diagnostic system.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF8E8] dark:bg-[#432623] text-[#432623] dark:text-[#F5F1BC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-[#432623]/20 pb-4">
          <Link
            href="/"
            className="text-xs font-bold text-[#432623] dark:text-[#F5F1BC] hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <span className="font-mono text-xs text-[#432623]/70 dark:text-[#F5F1BC]/70">
            Last updated: October 2026
          </span>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F1BC] text-[#432623] text-xs font-mono font-bold rounded-[2px] border border-[#432623]/25">
            <FileText className="w-4 h-4 text-[#432623]" />
            <span>TERMS OF PEDAGOGICAL USE</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#432623] dark:text-[#F5F1BC]">
            Terms of Service
          </h1>
          <p className="text-sm text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
            Welcome to ShikshaGap. By accessing or using the ShikshaGap application at shikshagap.vercel.app or associated domains, you agree to these Terms of Service.
          </p>
        </div>

        <div className="p-4 bg-[#F5F1BC]/60 border border-[#432623]/25 rounded-[2px] space-y-2 text-xs text-[#432623]">
          <div className="flex items-center gap-2 font-bold">
            <Warning className="w-4 h-4 text-[#DE2A35]" />
            <span>Independent Academic Tool Notice:</span>
          </div>
          <p className="text-[#432623]/90 leading-relaxed">
            ShikshaGap is an independent research and educational intelligence prototype. It is not affiliated with, endorsed by, or representing any government department, state education board, or government initiative (such as PM SHRI or Samagra Shiksha). Mention of curriculum standards (e.g., NCERT or SCERT Class 5) is solely for pedagogical alignment.
          </p>
        </div>

        <section className="space-y-3 text-xs leading-relaxed">
          <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
            1. Intended Users &amp; Permitted Use
          </h2>
          <p className="text-[#432623]/80 dark:text-[#F5F1BC]/80">
            ShikshaGap is provided for elementary school teachers, headmasters, educational researchers, and academic mentors. You agree to use the platform only for legitimate formative classroom assessment and pedagogical remediation in elementary school mathematics.
          </p>
        </section>

        <section className="space-y-3 text-xs leading-relaxed">
          <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
            2. Nature of AI Diagnostic Assistance
          </h2>
          <p className="text-[#432623]/80 dark:text-[#F5F1BC]/80">
            Our diagnostic engine uses mathematical rule trees combined with artificial intelligence (Google Gemini API) to suggest probable prerequisite gaps. You acknowledge and agree that:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#432623]/90 dark:text-[#F5F1BC]/90">
            <li>Outputs are formative pedagogical guidance, not psychological, clinical, or statutory evaluations.</li>
            <li>Teacher judgement is always final. Automated diagnoses must never be used to penalize, track, or label a student.</li>
            <li>We do not guarantee 100% diagnostic accuracy under all circumstances.</li>
          </ul>
        </section>

        <section className="space-y-3 text-xs leading-relaxed">
          <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
            3. Account Security &amp; Confidentiality
          </h2>
          <p className="text-[#432623]/80 dark:text-[#F5F1BC]/80">
            Authorized teachers are responsible for maintaining the confidentiality of their login credentials. Any unauthorized access to classroom student profiles must be reported immediately to security@shikshagap.in.
          </p>
        </section>

        <section className="space-y-3 text-xs leading-relaxed border-t border-[#432623]/20 pt-6">
          <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
            4. Limitation of Liability &amp; Governing Law
          </h2>
          <p className="text-[#432623]/80 dark:text-[#F5F1BC]/80">
            ShikshaGap is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis without warranty of any kind. To the fullest extent permitted under Indian law, ShikshaGap contributors shall not be liable for any indirect or consequential damages resulting from pedagogical use. These terms are governed by the laws of India, with exclusive jurisdiction in Hyderabad, Telangana.
          </p>
          <p className="text-[11px] text-[#432623]/60 dark:text-[#F5F1BC]/60 pt-2">
            The English version of these Terms of Service is the authoritative legal text.
          </p>
        </section>
      </div>
    </div>
  );
}
