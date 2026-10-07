import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { getShareToken, recordTokenView, logAuditEvent } from '@/lib/server/store';
import { ErrorState, LoadingSkeletonState } from '@/components/StateScreens';
import ReportClientView from './ReportClientView';

export const metadata: Metadata = {
  title: 'Student Mathematics Learning Progress | ShikshaGap',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

async function ReportLoader({ params }: PageProps) {
  const { token } = await params;
  const record = getShareToken(token);

  if (!record) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF8E8] dark:bg-[#432623] flex items-center justify-center p-4">
        <ErrorState
          errorMessage="This parent report link is invalid, has expired (after 7 days), or was revoked by the classroom teacher."
          referenceId="LINK-EXPIRED-404"
        />
      </div>
    );
  }

  // Record view & log security audit
  recordTokenView(token);
  logAuditEvent({
    userId: 'parent_guardian',
    userRole: 'anonymous',
    schoolId: record.schoolId,
    action: 'share_report_accessed',
    targetRecordId: `token_${token.substring(0, 8)}`,
    ipHash: 'parent_viewer',
    details: 'Parent accessed secure 7-day progress note',
  });

  return (
    <ReportClientView
      studentId={record.studentId}
      schoolId={record.schoolId}
      token={record.token}
      expiresAt={record.expiresAt}
    />
  );
}

export default function SharedReportPage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-[#FAF8E8] dark:bg-[#432623] p-4 flex items-center justify-center">
        <LoadingSkeletonState className="w-full max-w-md" />
      </div>
    }>
      <ReportLoader params={params} />
    </Suspense>
  );
}
