import { Suspense } from 'react';
import { Metadata } from 'next';
import { getShareToken, getRawShareToken, recordTokenView, logAuditEvent } from '@/lib/server/store';
import { ErrorState, LoadingSkeletonState } from '@/components/StateScreens';
import ReportClientView from './ReportClientView';

export const metadata: Metadata = {
  title: 'Student Mathematics Learning Progress | ShikshaGap',
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

async function ReportLoader({ params }: PageProps) {
  const { token } = await params;
  const record = getShareToken(token);

  if (!record) {
    const raw = getRawShareToken(token);
    let errorMsg = "This report link is invalid, has expired, or was revoked.";
    if (raw?.revoked) {
      errorMsg = "This report link was revoked by the creator.";
    } else if (raw && Date.now() > raw.expiresAt) {
      errorMsg = "This report link has expired (links expire after 14 days).";
    }
    return (
      <div className="min-h-[100dvh] bg-card dark:bg-muted flex items-center justify-center p-4">
        <ErrorState
          errorMessage={errorMsg}
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
    details: 'Parent accessed secure read-only progress report',
  });

  return (
    <ReportClientView
      studentId={record.studentId}
      schoolId={record.schoolId}
      token={record.token}
      expiresAt={record.expiresAt}
      firstName={record.firstName}
      grade={record.grade}
      skillsUnlocked={record.skillsUnlocked}
      skillsSleeping={record.skillsSleeping}
      prescribedPlan={record.prescribedPlan}
    />
  );
}

export default function SharedReportPage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-card dark:bg-muted p-4 flex items-center justify-center">
        <LoadingSkeletonState className="w-full max-w-md" />
      </div>
    }>
      <ReportLoader params={params} />
    </Suspense>
  );
}
