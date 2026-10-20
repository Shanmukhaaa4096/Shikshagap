import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSharedReport } from '@/lib/server/supabase';
import SharedReportClient from './SharedReportClient';

// ==============================================================================
// SERVER-SIDE SHARED REPORT PAGE (/r/[token])
// Strict Invariants:
// 1. Fetches the row server-side using Supabase Service Role Key.
// 2. Returns 404 (notFound()) if missing, expired (>14 days), or revoked.
// 3. Displays strictly first name, class, and gap results (no surname, school, etc.).
// 4. Configures robots noindex & nofollow meta tags.
// ==============================================================================

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Student Learning Gap Report | ShikshaGap',
  description: 'Private formative maths learning gap report for parents and guardians.',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

interface PageProps {
  params: Promise<{ token: string }> | { token: string };
}

export default async function SharedReportPage({ params }: PageProps) {
  // In Next.js 15, params is a Promise, so await it (support both Promise and object forms)
  const resolvedParams = await Promise.resolve(params);
  const token = resolvedParams?.token;

  if (!token || typeof token !== 'string') {
    notFound();
  }

  // Load the row server-side with the Supabase service role client
  const report = await getSharedReport(token);

  // Call notFound() ONLY when the row is genuinely missing, expired or revoked
  if (!report) {
    notFound();
  }

  if (report.revoked) {
    notFound();
  }

  if (report.expires_at && Date.now() > new Date(report.expires_at).getTime()) {
    notFound();
  }

  // Ensure first name is strictly isolated (no surname, no suffixes)
  const cleanFirstName = (report.first_name || 'Learner').trim().split(/\s+/)[0] || 'Learner';
  const classValue = report.class;
  const reportData = report.report_data || {};

  return (
    <SharedReportClient
      token={token}
      firstName={cleanFirstName}
      classNum={classValue}
      expiresAt={report.expires_at}
      reportData={reportData}
    />
  );
}
