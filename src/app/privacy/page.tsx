// Legal wording needs review by a qualified lawyer before launch.

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Warning } from "@phosphor-icons/react/dist/ssr";
import { siteConfig } from "@/config/site";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.siteName}`,
  description: "Privacy policy and child data protection practices under India's Digital Personal Data Protection Act 2023.",
  openGraph: {
    title: `Privacy Policy | ${siteConfig.siteName}`,
    description: "Privacy policy and child data protection practices under India's Digital Personal Data Protection Act 2023.",
    url: `${siteConfig.siteUrl}/privacy`,
    siteName: siteConfig.siteName,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${siteConfig.siteName} Privacy Policy` }],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/privacy`,
  },
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
            <span>BUILT FOLLOWING DPDP ACT 2023 PRINCIPLES</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#432623] dark:text-[#F5F1BC]">
            Privacy Policy &amp; Child Data Protection
          </h1>
          <p className="text-sm text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
            ShikshaGap is an academic diagnostic and pedagogical intelligence application designed for elementary school teachers in Indian government schools. Because our tool assists with children&apos;s learning evaluations (Classes 3 to 5, minors under 18), we treat all student data with the highest sensitivity under India&apos;s Digital Personal Data Protection Act 2023 (DPDP Act).
          </p>
        </div>

        {/* Data Fiduciary Callout */}
        <div className="p-4 bg-[var(--surface)] border border-[#432623]/25 rounded-[2px] space-y-1 text-xs">
          <div className="font-mono font-bold text-[#DE2A35] uppercase text-[11px]">Data Fiduciary Identification</div>
          <div className="text-[#432623] dark:text-[#F5F1BC]">
            <strong>Legal Entity Name:</strong> {siteConfig.legalEntityName}
          </div>
          <div className="text-[#432623] dark:text-[#F5F1BC]">
            <strong>Registered Location:</strong> {siteConfig.city}, India
          </div>
          <div className="text-[#432623]/80 dark:text-[#F5F1BC]/80 text-[11px] mt-1">
            {siteConfig.legalEntityName} acts as the Data Fiduciary responsible for defining the pedagogical purposes and safeguards for data processed across ShikshaGap.
          </div>
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
                  <td className="p-2.5 font-bold">Question Memory &amp; Quality Metrics</td>
                  <td className="p-2.5">Validated mathematical problem text, operands, anonymised success tallies, aggregate error category counts</td>
                  <td className="p-2.5">Question engine quality calibration and difficulty tuning; zero student names, roll numbers, or personal telemetry stored</td>
                  <td className="p-2.5">Persistent mathematical library (retained without student identifiers)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Anonymous Session Summaries</td>
                  <td className="p-2.5">Random client session ID, grade, language, hour-precision timestamp, question IDs attempted/correct, topic mastery outcomes</td>
                  <td className="p-2.5">Measuring question engine reliability and curriculum progression across classrooms; strictly decoupled from student identity</td>
                  <td className="p-2.5">90 days rolling retention (purged via automated upkeep cron; aggregate mathematical tallies retained)</td>
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
          {/* Legal wording requires review by qualified legal counsel under DPDP Act 2023 */}
          <p className="text-[11px] text-[#432623]/70 dark:text-[#F5F1BC]/70 italic mt-2">
            Note: All persistent question quality telemetry and session summaries are strictly anonymised and decoupled from student identities. Session summaries are automatically purged after 90 days. Formal legal text requires review by qualified legal counsel under the DPDP Act 2023.
          </p>
        </section>

        {/* Section on Parental / Guardian Consent */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
            2. Parental or Guardian Consent
          </h2>
          <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
            The school or classroom teacher must obtain verifiable parental or guardian consent before entering any child&apos;s data or assessment responses into ShikshaGap.
          </p>
          <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
            <strong>How Consent is Recorded:</strong> Schools use the physical printable Parent / Guardian Notice &amp; Consent Record template (accessible at <Link href="/notices/guardian" className="underline font-bold">/notices/guardian</Link> in English, Hindi, and Telugu). The document is signed or thumb-printed by the student&apos;s parent or legal guardian, verified and countersigned by the class teacher, and securely retained on file in the school administration office for the academic year.
          </p>
        </section>

        {/* Section on Third-Party Processors & Cross-Border Processing */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
            3. Third-Party Processors &amp; Cross-Border Processing
          </h2>
          <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
            We work with a minimal set of secure infrastructure partners:
          </p>
          <ul className="list-disc list-inside text-xs space-y-1.5 text-[#432623]/90 dark:text-[#F5F1BC]/90">
            <li><strong>Hosting:</strong> Vercel Inc. (cloud infrastructure with TLS encryption in transit and at rest).</li>
            <li><strong>AI Diagnostic Analysis:</strong> Google Gemini API (Interactions API / Flash models). Student identifiers sent to Gemini are anonymized pseudonyms (e.g., anon_4b8f), and real student names are never passed in prompt contexts.</li>
            <li><strong>Fonts:</strong> Self-hosted at build time via next/font; zero runtime requests to third-party CDNs or external font servers.</li>
          </ul>
          <div className="p-3 bg-[#FAF8E8] dark:bg-[#381f1c] border border-[#432623]/20 rounded-[2px] text-xs text-[#432623]/90 dark:text-[#F5F1BC]/90 leading-relaxed">
            <strong>Cross-Border Processing Disclosure:</strong> While ShikshaGap is tailored for Indian schools, technical data may be processed by Google (Gemini) and Vercel on secure cloud servers located outside India. All such transfers are subject to rigorous encryption, pseudonymous masking of student records, and strict data confidentiality agreements.
          </div>
        </section>

        {/* Section on Protection of Children */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
            4. Special Safeguards for Children
          </h2>
          <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
            In compliance with Section 9 of the DPDP Act 2023, ShikshaGap enforces strict safeguards regarding minors:
          </p>
          <ul className="list-disc list-inside text-xs space-y-1 text-[#432623]/90 dark:text-[#F5F1BC]/90">
            <li><strong>No Tracking:</strong> Zero tracking cookies, zero pixel tags, and zero device fingerprinting.</li>
            <li><strong>No Behavioural Monitoring:</strong> The system does not monitor children&apos;s browsing behavior, emotional responses, or non-academic activities.</li>
            <li><strong>No Targeted Advertising:</strong> There is absolutely no advertising, sponsored content, or marketing on the platform.</li>
          </ul>
        </section>

        {/* Section on Data Breach Notification Protocol */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
            5. Data Breach Notification Protocol
          </h2>
          <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
            In the event of an identified personal data breach involving student or teacher records:
          </p>
          <ul className="list-disc list-inside text-xs space-y-1 text-[#432623]/90 dark:text-[#F5F1BC]/90">
            <li><strong>Data Protection Board of India:</strong> ShikshaGap will notify the Data Protection Board of India in the prescribed form and manner without undue delay.</li>
            <li><strong>Affected Data Principals:</strong> Impacted schools, educators, and parents will be promptly notified via registered institutional email and administrative notices describing the nature of the breach, affected data categories, and recommended mitigating actions.</li>
            <li><strong>Remediation:</strong> Immediate incident containment, root-cause isolation, and security patch verification will be initiated by our technical response team.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-[#432623] dark:text-[#F5F1BC]">
            6. Rights Under the DPDP Act 2023
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
            7. Grievance Redressal Officer
          </h2>
          <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed">
            In accordance with the Digital Personal Data Protection Act 2023, you may contact our Grievance Officer:
          </p>
          <div className="p-3 bg-[var(--surface)] border border-[#432623]/25 rounded-[2px] text-xs font-mono space-y-1">
            <div>Data Protection &amp; Grievance Officer: {siteConfig.grievanceOfficerName}</div>
            <div>Email: <a href={`mailto:${siteConfig.contactEmail}`} className="underline">{siteConfig.contactEmail}</a></div>
            <div>Jurisdiction: {siteConfig.city}</div>
          </div>
          <p className="text-[11px] text-[#432623]/60 dark:text-[#F5F1BC]/60">
            Note: While ShikshaGap provides multilingual interfaces in English, Hindi, and Telugu, this English legal document governs in the event of any interpretive ambiguity.
          </p>
        </section>
      </div>
    </div>
  );
}
