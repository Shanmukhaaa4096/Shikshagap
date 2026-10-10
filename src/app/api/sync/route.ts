import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { logAuditEvent, saveTeacherOverride, hashIp } from '@/lib/server/store';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Institutional session required.' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const body = await req.json().catch(() => null);

    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json({ error: 'Invalid sync payload. Expected items array.' }, { status: 400 });
    }

    let processedCount = 0;

    for (const item of body.items) {
      if (item.type === 'teacher_override' && item.payload) {
        const p = item.payload;
        // Verify class / school ownership
        if (session.user.role === 'teacher' && p.classId && p.classId !== session.user.classId) {
          continue; // Cannot override student from another class
        }

        saveTeacherOverride({
          studentId: String(p.studentId || ''),
          classId: String(p.classId || session.user.classId || 'class_5a'),
          schoolId: session.user.schoolId,
          teacherId: session.user.id,
          teacherName: session.user.name,
          originalRootGapId: String(p.originalRootGapId || ''),
          originalRootGapLabel: String(p.originalRootGapLabel || ''),
          decision: (p.decision as 'accepted' | 'changed' | 'dismissed') || 'accepted',
          newRootGapId: p.newRootGapId ? String(p.newRootGapId) : undefined,
          newRootGapLabel: p.newRootGapLabel ? String(p.newRootGapLabel) : undefined,
          teacherNote: p.teacherNote ? String(p.teacherNote).substring(0, 500) : undefined,
        });

        processedCount++;
      }
    }

    logAuditEvent({
      userId: session.user.id,
      userRole: session.user.role,
      schoolId: session.user.schoolId,
      action: 'override_created',
      ipHash: hashIp(ip),
      details: `Offline sync processed ${processedCount} pending changes`,
    });

    return NextResponse.json({
      success: true,
      processedCount,
      timestamp: Date.now(),
    });
  } catch {
    return NextResponse.json({ error: 'Sync server processing failure.' }, { status: 500 });
  }
}
