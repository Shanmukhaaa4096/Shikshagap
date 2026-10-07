import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Warning } from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "Privacy Policy | ShikshaGap",
  description: "Privacy policy and child data protection practices under India's Digital Personal Data Protection Act 2023.",
};

export default function PrivacyPage() {
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
            <ShieldCheck className="w-4 h-4 text-[#432623]" />
            <span>DPDP ACT 2023 COMPLIANT SPECIFICATION</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#432623] dark:text-[#F5F1BC]">
            Privacy Policy &amp; Child Data Protection
          </h1>
          <p className="text-sm text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
            ShikshaGap is an academic diagnostic and pedagogical intelligence application designed for elementary school teachers in Indian government schools. Because our tool assists with children&apos;s learning evaluations (Class 5, minors under 18), we treat all student data with the highest sensitivity under India&apos;s Digital Personal Data Protection Act 2023 (DPDP Act).
          </p>
        </div>

        {/* Core Principles Callout */}
        <div className="p-4 bg-[#F5F1BC]/60 border border-[#432623]/25 rounded-[2px] space-y-2 text-xs text-[#432623]">
          <div className="flex items-center gap-2 font-bold">
            <Warning className="w-4 h-4 text-[#DE2A35]" />
            <span>Absolute Commitments Regarding Children&apos;s Data:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[#432623]/90">
            <li>No behavioral tracking, advertising, profiling, or commercial monetization of children&apos;s data.</li>
            <li>No real student names are ever sent to external AI providers. Only pseudonymous IDs are used.</li>
            <li>All diagnostic outputs are decision support tools for teachers; teacher judgement is final.</li>
          </ul>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
            1. What Information We Collect and Why
          </h2>
          <div className="border border-[#432623]/25 rounded-[2px] overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#F5F1BC]/50 border-b border-[#432623]/20 font-bold">
                <tr>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Data Fields</th>
                  <th className="p-2.5">Purpose &amp; Basis</th>
                  <th className="p-2.5">Retention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#432623]/15">
                <tr>
                  <td className="p-2.5 font-bold">Teacher Data</td>
                  <td className="p-2.5">Name, school affiliation, email, staff ID</td>
                  <td className="p-2.5">Account authorization, class assignment, communication</td>
                  <td className="p-2.5">Duration of active employment at school</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Student Data</td>
                  <td className="p-2.5">First name, roll number, answers, mastery scores, detected gaps</td>
                  <td className="p-2.5">Formative pedagogical diagnosis, printable practice worksheets</td>
                  <td className="p-2.5">Current academic year (deleted after annual cycle)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Technical Logs</td>
                  <td className="p-2.5">IP address, browser type, timestamp of errors</td>
                  <td className="p-2.5">System security, rate-limiting, audit compliance</td>
                  <td className="p-2.5">30 days rolling purge</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
            2. Third-Party Service Providers
          </h2>
          <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
            We work with a minimal set of secure infrastructure partners:
          </p>
          <ul className="list-disc list-inside text-xs space-y-1.5 text-[#432623]/90 dark:text-[#F5F1BC]/90">
            <li><strong>Hosting:</strong> Vercel Inc. (cloud infrastructure with TLS encryption in transit and at rest).</li>
            <li><strong>AI Diagnostic Analysis:</strong> Google Gemini API (Interactions API / Flash models). Student identifiers sent to Gemini are anonymized pseudonyms (e.g., anon_4b8f), and student names are never passed in prompt contexts.</li>
            <li><strong>Fonts:</strong> Google Fonts loaded securely and statically subsetted without cookies or personal tracking.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
            3. Rights Under the DPDP Act 2023
          </h2>
          <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
            Parents, legal guardians, and authorized school teachers have the statutory right to:
          </p>
          <ul className="list-disc list-inside text-xs space-y-1 text-[#432623]/90 dark:text-[#F5F1BC]/90">
            <li>Request a copy of all diagnostic records held for their child.</li>
            <li>Request correction or rectification of inaccurate academic logs.</li>
            <li>Request permanent erasure of student records from our active databases.</li>
            <li>File a grievance with our designated Data Protection Grievance Officer.</li>
          </ul>
          <div className="pt-2">
            <Link
              href="/data-request"
              className="inline-block px-3 py-2 bg-[#432623] text-[#F5F1BC] text-xs font-bold rounded-[2px]"
            >
              Submit a Data Request (Access / Correction / Deletion)
            </Link>
          </div>
        </section>

        <section className="space-y-3 border-t border-[#432623]/20 pt-6">
          <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
            4. Grievance Redressal Officer
          </h2>
          <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
            In accordance with the Digital Personal Data Protection Act 2023, you may contact our Grievance Officer:
          </p>
          <div className="p-3 bg-[var(--surface)] border border-[#432623]/25 rounded-[2px] text-xs font-mono space-y-1">
            <div>Data Protection &amp; Grievance Officer: ShikshaGap Privacy Cell</div>
            <div>Email: <a href="mailto:privacy@shikshagap.in" className="underline">privacy@shikshagap.in</a></div>
            <div>Jurisdiction: Hyderabad, Telangana, India</div>
          </div>
          <p className="text-[11px] text-[#432623]/60 dark:text-[#F5F1BC]/60">
            Note: While ShikshaGap provides multilingual interfaces in English, Hindi, and Telugu, this English legal document governs in the event of any interpretive ambiguity.
          </p>
        </section>
      </div>
    </div>
  );
}
