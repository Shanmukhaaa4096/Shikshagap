import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getSharedReport, isReportExpired } from '@/lib/server/supabase';
import { getShareTokenStatus, recordTokenView, logAuditEvent } from '@/lib/server/store';
import { LoadingSkeletonState } from '@/components/StateScreens';
import ReportClientView from './ReportClientView';
import { Warning, ArrowLeft, ClockCounterClockwise } from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Student Mathematics Learning Progress | ShikshaGap',
  description: 'Private formative mathematics learning progress report.',
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

function isTokenExpired(expiresAtMs: number, expiresAtIso: string): boolean {
  return Date.now() > expiresAtMs || isReportExpired(expiresAtIso);
}

interface SharedReportData {
  skillsUnlocked?: Array<{ id: string; name: string }>;
  skillsSleeping?: Array<{ id: string; name: string; prereqRoot?: string }>;
  prescribedPlan?: Array<{ step: number; title: string; desc: string }>;
  totalQuestions?: number;
  confidence?: number;
  isProvisional?: boolean;
}

async function ReportLoader({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const token = resolvedParams?.token;

  if (!token || typeof token !== 'string') {
    return renderErrorCard({
      title: 'Report Link Unavailable',
      titleHi: 'रिपोर्ट लिंक उपलब्ध नहीं है',
      titleTe: 'నివేదిక లింక్ అందుబాటులో లేదు',
      message: 'This report link is invalid or does not exist. Check the URL and try again.',
      messageHi: 'यह रिपोर्ट लिंक अमान्य है या मौजूद नहीं है। कृपया सही लिंक की जांच करें।',
      messageTe: 'ఈ నివేదిక లింక్ చెల్లదు లేదా అందుబాటులో లేదు. దయచేసి లింక్‌ను మళ్లీ తనిఖీ చేయండి.',
      status: 'invalid',
    });
  }

  // 1. First attempt to load persistent record from Supabase shared_reports table
  const dbReport = await getSharedReport(token);
  // 2. Fall back to in-memory store for instant caching during active sessions / tests
  const storeData = getShareTokenStatus(token);
  const report = dbReport || (storeData.record ? {
    id: storeData.record.token,
    token: storeData.record.token,
    first_name: storeData.record.firstName,
    class: typeof storeData.record.grade === 'number' ? storeData.record.grade : 5,
    expires_at: storeData.record.expiresAt,
    revoked: storeData.record.revoked,
    report_data: {
      skillsUnlocked: storeData.record.skillsUnlocked,
      skillsSleeping: storeData.record.skillsSleeping,
      prescribedPlan: storeData.record.prescribedPlan,
    }
  } : null);

  if (!report) {
    return renderErrorCard({
      title: 'Report Link Unavailable',
      titleHi: 'रिपोर्ट लिंक उपलब्ध नहीं है',
      titleTe: 'నివేదిక లింక్ అందుబాటులో లేదు',
      message: 'This report link is invalid or does not exist. Check the URL and try again.',
      messageHi: 'यह रिपोर्ट लिंक अमान्य है या मौजूद नहीं है। कृपया सही लिंक की जांच करें।',
      messageTe: 'ఈ నివేదిక లింక్ చెల్లదు లేదా అందుబాటులో లేదు. దయచేసి లింక్‌ను మళ్లీ తనిఖీ చేయండి.',
      status: 'invalid',
    });
  }

  if (report.revoked) {
    return renderErrorCard({
      title: 'Report Link Revoked',
      titleHi: 'रिपोर्ट लिंक निष्क्रिय कर दिया गया है',
      titleTe: 'నివేదిక లింక్ రద్దు చేయబడింది',
      message: 'This shared report link was revoked by the educator or creator and is no longer accessible.',
      messageHi: 'इस रिपोर्ट लिंक को शिक्षक या निर्माता द्वारा निष्क्रिय कर दिया गया है।',
      messageTe: 'ఈ నివేదిక లింక్ ఉపాధ్యాయుడు లేదా సృష్టికర్తచే రద్దు చేయబడింది.',
      status: 'revoked',
    });
  }

  const expiresAtMs = typeof report.expires_at === 'number'
    ? report.expires_at
    : new Date(report.expires_at).getTime();
  const expiresAtIso = typeof report.expires_at === 'string'
    ? report.expires_at
    : new Date(report.expires_at).toISOString();

  if (report.expires_at && isTokenExpired(expiresAtMs, expiresAtIso)) {
    return renderErrorCard({
      title: 'Report Link Expired',
      titleHi: 'रिपोर्ट लिंक समाप्त हो चुका है',
      titleTe: 'నివేదిక లింక్ గడువు ముగిసింది',
      message: 'This shared report link has expired (links remain active for 30 days to protect student privacy).',
      messageHi: 'यह रिपोर्ट लिंक समाप्त हो चुका है (छात्र गोपनीयता के लिए लिंक 30 दिनों तक वैध रहते हैं)।',
      messageTe: 'ఈ నివేదిక లింక్ గడువు ముగిసింది (విద్యార్థి గోప్యత కోసం లింకులు 30 రోజులు మాత్రమే ఉంటాయి).',
      status: 'expired',
    });
  }

  // Record view & security audit
  recordTokenView(token);
  logAuditEvent({
    userId: 'parent_guardian',
    userRole: 'anonymous',
    schoolId: 'student_share',
    action: 'share_report_accessed',
    targetRecordId: `token_${token.substring(0, 8)}`,
    ipHash: 'parent_viewer',
    details: 'Parent accessed secure read-only progress report',
  });

  const cleanFirstName = (report.first_name || 'Learner').trim().split(/\s+/)[0] || 'Learner';
  const reportData = (report.report_data || {}) as SharedReportData;

  return (
    <ReportClientView
      token={token}
      expiresAt={expiresAtMs}
      firstName={cleanFirstName}
      grade={report.class}
      skillsUnlocked={reportData.skillsUnlocked || []}
      skillsSleeping={reportData.skillsSleeping || []}
      prescribedPlan={reportData.prescribedPlan || []}
      totalQuestions={reportData.totalQuestions}
      confidence={reportData.confidence}
      isProvisional={Boolean(reportData.isProvisional)}
    />
  );
}

function renderErrorCard(props: {
  title: string;
  titleHi: string;
  titleTe: string;
  message: string;
  messageHi: string;
  messageTe: string;
  status: 'expired' | 'revoked' | 'invalid';
}) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 sm:p-8 bg-card border border-border rounded-[24px] shadow-warm space-y-6 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 mx-auto flex items-center justify-center border border-amber-300 dark:border-amber-700">
          {props.status === 'expired' ? (
            <ClockCounterClockwise size={28} weight="bold" />
          ) : (
            <Warning size={28} weight="bold" />
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-foreground font-serif">
            {props.title}
          </h1>
          <p className="text-xs font-mono text-muted-foreground">
            {props.titleHi} • {props.titleTe}
          </p>
        </div>

        <div className="p-4 rounded-[16px] bg-muted/50 border border-border/80 text-xs text-foreground/90 space-y-2 text-left leading-relaxed">
          <p>{props.message}</p>
          <p className="text-muted-foreground pt-1 border-t border-border/60">{props.messageHi}</p>
          <p className="text-muted-foreground">{props.messageTe}</p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            href="/"
            className="neo-btn neo-btn-primary min-h-[48px] px-6 text-sm font-bold rounded-full w-full flex items-center justify-center gap-2 cursor-pointer shadow-warm"
          >
            <ArrowLeft size={16} />
            <span>Return to ShikshaGap Home</span>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground font-mono">
          Security reference: REPORT-LINK-{props.status.toUpperCase()}
        </p>
      </div>
    </div>
  );
}

export default function SharedReportPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-card dark:bg-muted p-4 flex items-center justify-center">
          <LoadingSkeletonState className="w-full max-w-md" />
        </div>
      }
    >
      <ReportLoader params={params} />
    </Suspense>
  );
}
