import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { createShareToken, revokeShareToken, logAuditEvent, hashIp } from '@/lib/server/store';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Teacher session required.' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const body = await req.json().catch(() => null);

    if (!body || !body.studentId || !body.confirmedNotice) {
      return NextResponse.json(
        { error: 'Missing required parameters. Teacher guardian-sharing confirmation is required.' },
        { status: 400 }
      );
    }

    const { studentId, classId, confirmedNotice } = body;

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

    // Generate 128-bit cryptographically secure unguessable share token
    const record = createShareToken({
      studentId: String(studentId),
      schoolId: session.user.schoolId,
      classId: String(classId || session.user.classId || 'class_5a'),
      createdById: session.user.id,
      confirmedNotice: Boolean(confirmedNotice),
    });

    logAuditEvent({
      userId: session.user.id,
      userRole: session.user.role,
      schoolId: session.user.schoolId,
      action: 'share_report_created',
      targetRecordId: `token_scope_${studentId}`,
      ipHash: hashIp(ip),
      details: 'Secure parent report token generated (valid 7 days)',
    });

    const host = req.headers.get('host') || 'shikshagap.vercel.app';
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const shareUrl = `${protocol}://${host}/report/${record.token}`;

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
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    if (!token) {
      return NextResponse.json({ error: 'Token parameter required.' }, { status: 400 });
    }

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

    return NextResponse.json({ success });
  } catch {
    return NextResponse.json({ error: 'Failed to revoke token.' }, { status: 500 });
  }
}
