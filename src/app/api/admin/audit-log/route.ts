import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { getAuditLogs, logAuditEvent, hashIp, AuditAction } from '@/lib/server/store';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // Strict role check: Only school_admin can access institutional audit trail
    if (session.user.role !== 'school_admin') {
      logAuditEvent({
        userId: session.user.id,
        userRole: session.user.role,
        schoolId: session.user.schoolId,
        action: 'view_audit_log',
        ipHash: hashIp(ip),
        details: 'DENIED: Non-admin attempted to inspect audit log',
      });
      return NextResponse.json({ error: 'Forbidden. School administrative privilege required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') as AuditAction | undefined;
    const userId = searchParams.get('userId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    // Reading the audit log is itself logged!
    logAuditEvent({
      userId: session.user.id,
      userRole: session.user.role,
      schoolId: session.user.schoolId,
      action: 'view_audit_log',
      ipHash: hashIp(ip),
      details: 'Administrator inspected security audit trail',
    });

    const result = getAuditLogs(
      session.user.schoolId,
      { action, userId },
      page,
      limit
    );

    return NextResponse.json({
      success: true,
      logs: result.logs,
      total: result.total,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve audit trail.' }, { status: 500 });
  }
}
