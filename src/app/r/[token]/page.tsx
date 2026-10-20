import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSharedReport, isReportExpired } from '@/lib/server/supabase';
import { LoadingSkeletonState } from '@/components/StateScreens';
import SharedReportClient from './SharedReportClient';

// ==============================================================================
// SERVER-SIDE SHARED REPORT PAGE (/r/[token])
// Strict Invariants:
// 1. Fetches the row server-side using Supabase Service Role Key.
// 2. Returns 404 (notFound()) if missing, expired (>14 days), or revoked.
// 3. Displays strictly first name, class, and gap results (no surname, school, etc.).
// 4. Configures robots noindex & nofollow meta tags.
// ==============================================================================

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
  params: Promise<{ token: string }>;
}

async function SharedReportLoader({ params }: PageProps) {
  const { token } = await params;

  if (!token || typeof token !== 'string') {
    notFound();
  }

  // Fetch report row server-side
  const report = await getSharedReport(token);

  // 1. Missing check
  if (!report) {
    notFound();
  }

  // 2. Revoked check
  if (report.revoked) {
    notFound();
  }

  // 3. Expired check (14 days)
  if (Date.now() > new Date(report.expires_at).getTime()) {
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

export default function SharedReportPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-card dark:bg-muted p-4 flex items-center justify-center">
          <LoadingSkeletonState className="w-full max-w-md" />
        </div>
      }
    >
      <SharedReportLoader params={params} />
    </Suspense>
  );
}
