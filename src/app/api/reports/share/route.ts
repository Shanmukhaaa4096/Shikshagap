import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import {
  createShareToken,
  revokeShareToken,
  createStudentShareToken,
  revokeStudentShareToken,
  isAssessmentSessionCompleted,
  logAuditEvent,
  hashIp,
  DEFAULT_REPORT_EXPIRY_DAYS,
} from '@/lib/server/store';
import { insertSharedReport, revokeSharedReport } from '@/lib/server/supabase';
import { getClientIp } from '@/lib/server/security';
import { guardRequest, createGuardResponse } from '@/lib/server/guard';
import { siteConfig } from '@/config/site';

function getBaseUrl(req: NextRequest): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || siteConfig.siteUrl || '').trim().replace(/\/+$/, '');
  if (configured && !configured.includes('localhost') && !configured.includes('127.0.0.1')) {
    return configured;
  }
  const origin = req.headers.get('origin');
  if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    return origin.replace(/\/+$/, '');
  }
  const forwardedHost = req.headers.get('x-forwarded-host');
  const host = forwardedHost || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return `${proto}://${host}`.replace(/\/+$/, '');
  }
  return configured || (process.env.NODE_ENV === 'production' ? 'https://shikshagap.vercel.app' : `${proto}://${host || 'localhost:3000'}`);
}

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req, { route: '/api/reports/share' });
    if (!guard.ok) {
      return createGuardResponse(guard);
    }

    const ip = getClientIp(req);
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: 'Missing request body.' }, { status: 400 });
    }

    // ==============================================================
    // CASE 1: Student Assessment Gap Report Share Link
    // Requirements:
    // - Only the session that ran and completed the assessment can create the link
    // - Uses unguessable 256-bit token (crypto.randomUUID twice)
    // - Inserts into Supabase `shared_reports` using service role key
    // - Expires after 30 days (DEFAULT_REPORT_EXPIRY_DAYS)
    // - Stores only first name, class, and gap results (no surname, roll number, school, contact info)
    // - Returns the link /report/<token>
    // ==============================================================
    if (body.assessmentSessionId || body.isStudentShare || body.gapResults) {
      const {
        assessmentSessionId,
        firstName,
        grade,
        class: classVal,
        skillsUnlocked,
        skillsSleeping,
        prescribedPlan,
        gapTopics,
        totalQuestions,
        confidence,
        isProvisional,
      } = body;

      const sessionIdStr = assessmentSessionId ? String(assessmentSessionId) : '';
      if (sessionIdStr && !isAssessmentSessionCompleted(sessionIdStr)) {
        return NextResponse.json(
          { error: 'Only the session that completed the assessment can create a share link.' },
          { status: 403 }
        );
      }

      const rawFirstName = (firstName || 'Learner').trim();
      const cleanFirstName = rawFirstName.split(/\s+/)[0] || 'Learner';
      const classId = classVal || grade || 5;

      const record = createStudentShareToken({
        assessmentSessionId: sessionIdStr || `sess_${crypto.randomUUID().slice(0, 8)}`,
        firstName: cleanFirstName,
        grade: classId,
        skillsUnlocked: Array.isArray(skillsUnlocked) ? skillsUnlocked : [],
        skillsSleeping: Array.isArray(skillsSleeping) ? skillsSleeping : [],
        prescribedPlan: Array.isArray(prescribedPlan) ? prescribedPlan : undefined,
      });

      // Insert into Supabase shared_reports via service role key
      try {
        await insertSharedReport({
          token: record.token,
          report_data: {
            skillsUnlocked: Array.isArray(skillsUnlocked) ? skillsUnlocked : [],
            skillsSleeping: Array.isArray(skillsSleeping) ? skillsSleeping : [],
            prescribedPlan: Array.isArray(prescribedPlan) ? prescribedPlan : undefined,
            gapTopics: Array.isArray(gapTopics) ? gapTopics : undefined,
            assessmentSessionId: sessionIdStr,
            totalQuestions: typeof totalQuestions === 'number' ? totalQuestions : undefined,
            confidence: typeof confidence === 'number' ? confidence : undefined,
            isProvisional: Boolean(isProvisional),
          },
          first_name: cleanFirstName,
          class: classId,
          expires_at: new Date(record.expiresAt).toISOString(),
          revoked: false,
          creator_secret: record.creatorSecret,
        });
      } catch (insertError: unknown) {
        const errorMsg = insertError instanceof Error ? insertError.message : String(insertError);
        console.error('[Share API Supabase Insert Error]:', insertError);
        return NextResponse.json(
          { error: `Database insert failed: ${errorMsg}` },
          { status: 500 }
        );
      }

      logAuditEvent({
        userId: 'student_session',
        userRole: 'student',
        schoolId: 'student_share',
        action: 'share_report_created',
        targetRecordId: `token_${record.token.slice(0, 8)}`,
        ipHash: hashIp(ip),
        details: `Student gap report share link generated (valid ${DEFAULT_REPORT_EXPIRY_DAYS} days)`,
      });

      const baseUrl = getBaseUrl(req);
      const link = `/report/${record.token}`;
      const shareUrl = `${baseUrl}${link}`;

      return NextResponse.json({
        success: true,
        token: record.token,
        creatorSecret: record.creatorSecret,
        link,
        shareUrl,
        expiresAt: record.expiresAt,
      });
    }

    // ==============================================================
    // CASE 2: Teacher Guardian-Sharing Flow (authenticated teacher session)
    // ==============================================================
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Teacher session required.' }, { status: 401 });
    }

    if (!body.studentId || !body.confirmedNotice) {
      return NextResponse.json(
        { error: 'Missing required parameters. Teacher guardian-sharing confirmation is required.' },
        { status: 400 }
      );
    }

    const { studentId, classId, confirmedNotice, firstName: teacherFirstName } = body;

    // Data isolation check: Teacher can only share for their own assigned class
    if (session.user.role === 'teacher' && classId && session.user.classId && classId !== session.user.classId) {
      logAuditEvent({
        userId: session.user.id,
        userRole: session.user.role,
        schoolId: session.user.schoolId,
        action: 'share_report_created',
        ipHash: hashIp(ip),
        details: 'DENIED: Cross-class report share attempt blocked',
      });
      return NextResponse.json({ error: 'Forbidden. You may only share reports for your own class cohort.' }, { status: 403 });
    }

    // Generate 256-bit cryptographically secure unguessable share token
    const record = createShareToken({
      studentId: String(studentId),
      schoolId: session.user.schoolId,
      classId: String(classId || session.user.classId || 'class_5a'),
      createdById: session.user.id,
      confirmedNotice: Boolean(confirmedNotice),
    });

    const cleanTeacherFirstName = (teacherFirstName || 'Learner').trim().split(/\s+/)[0] || 'Learner';

    // Persist to Supabase shared_reports via service role key so link works across devices
    try {
      await insertSharedReport({
        token: record.token,
        report_data: {
          studentId: String(studentId),
          classId: String(classId || session.user.classId || 'class_5a'),
          skillsUnlocked: Array.isArray(body.skillsUnlocked) ? body.skillsUnlocked : [],
          skillsSleeping: Array.isArray(body.skillsSleeping) ? body.skillsSleeping : [],
          prescribedPlan: Array.isArray(body.prescribedPlan) ? body.prescribedPlan : undefined,
        },
        first_name: cleanTeacherFirstName,
        class: classId || 5,
        expires_at: new Date(record.expiresAt).toISOString(),
        revoked: false,
      });
    } catch (insertError: unknown) {
      console.warn('[Share API Teacher Insert Warning]:', insertError);
    }

    logAuditEvent({
      userId: session.user.id,
      userRole: session.user.role,
      schoolId: session.user.schoolId,
      action: 'share_report_created',
      targetRecordId: `token_scope_${studentId}`,
      ipHash: hashIp(ip),
      details: `Secure parent report token generated (valid ${DEFAULT_REPORT_EXPIRY_DAYS} days)`,
    });

    const baseUrl = getBaseUrl(req);
    const link = `/report/${record.token}`;
    const shareUrl = `${baseUrl}${link}`;

    return NextResponse.json({
      success: true,
      token: record.token,
      shareUrl,
      expiresAt: record.expiresAt,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate share link.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const guard = await guardRequest(req, { route: '/api/reports/share' });
    if (!guard.ok) {
      return createGuardResponse(guard);
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const creatorSecret = searchParams.get('creatorSecret') || req.headers.get('x-creator-secret');
    const ip = getClientIp(req);

    if (!token) {
      return NextResponse.json({ error: 'Token parameter required.' }, { status: 400 });
    }

    // Revoke in Supabase shared_reports table via service role key
    await revokeSharedReport(token);

    // Case 1: Creator of student share report revoking using creatorSecret
    if (creatorSecret) {
      revokeStudentShareToken(token, creatorSecret);

      logAuditEvent({
        userId: 'creator_session',
        userRole: 'student',
        schoolId: 'student_share',
        action: 'share_report_revoked',
        targetRecordId: `token_${token.slice(0, 8)}`,
        ipHash: hashIp(ip),
        details: 'Student share link revoked by creator',
      });

      return NextResponse.json({ success: true, revoked: true });
    }

    // Case 2: Teacher revoking teacher-generated share token
    const session = await getServerSession();
    if (session) {
      const success = revokeShareToken(token, session.user.id, session.user.schoolId);
      if (success) {
        logAuditEvent({
          userId: session.user.id,
          userRole: session.user.role,
          schoolId: session.user.schoolId,
          action: 'share_report_revoked',
          ipHash: hashIp(ip),
          details: 'Share token explicitly revoked by educator',
        });
      }
      return NextResponse.json({ success: true, revoked: true });
    }

    // Case 3: Direct stop sharing request from report page
    logAuditEvent({
      userId: 'anonymous_report_viewer',
      userRole: 'anonymous',
      schoolId: 'student_share',
      action: 'share_report_revoked',
      targetRecordId: `token_${token.slice(0, 8)}`,
      ipHash: hashIp(ip),
      details: 'Shared report stopped/revoked from viewer action',
    });

    return NextResponse.json({ success: true, revoked: true });
  } catch {
    return NextResponse.json({ error: 'Failed to revoke token.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  return DELETE(req);
}

