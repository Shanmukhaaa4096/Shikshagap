import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { saveTeacherOverride, getLatestTeacherOverride, getAllTeacherOverridesForClass, logAuditEvent, hashIp } from '@/lib/server/store';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Teacher session required.' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const body = await req.json().catch(() => null);

    if (!body || !body.studentId || !body.decision) {
      return NextResponse.json({ error: 'Missing required override fields.' }, { status: 400 });
    }

    const { 
      studentId, 
      classId, 
      originalRootGapId, 
      originalRootGapLabel, 
      decision, 
      newRootGapId, 
      newRootGapLabel, 
      teacherNote 
    } = body;

    // Authorization: teacher can only override their own class
    if (session.user.role === 'teacher' && classId && session.user.classId && classId !== session.user.classId) {
      logAuditEvent({
        userId: session.user.id,
        userRole: session.user.role,
        schoolId: session.user.schoolId,
        action: 'override_created',
        ipHash: hashIp(ip),
        details: 'DENIED: Cross-class override attempt blocked',
      });
      return NextResponse.json({ error: 'Forbidden. You cannot override diagnoses for another class cohort.' }, { status: 403 });
    }

    if (!['accepted', 'changed', 'dismissed'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision type.' }, { status: 400 });
    }

    // Sanitize note: strip HTML and enforce max 500 characters
    const sanitizedNote = teacherNote 
      ? String(teacherNote).replace(/<[^>]*>/g, '').trim().substring(0, 500)
      : undefined;

    const record = saveTeacherOverride({
      studentId: String(studentId),
      classId: String(classId || session.user.classId || 'class_5a'),
      schoolId: session.user.schoolId,
      teacherId: session.user.id,
      teacherName: session.user.name,
      originalRootGapId: String(originalRootGapId || ''),
      originalRootGapLabel: String(originalRootGapLabel || ''),
      decision: decision as 'accepted' | 'changed' | 'dismissed',
      newRootGapId: newRootGapId ? String(newRootGapId) : undefined,
      newRootGapLabel: newRootGapLabel ? String(newRootGapLabel) : undefined,
      teacherNote: sanitizedNote,
    });

    logAuditEvent({
      userId: session.user.id,
      userRole: session.user.role,
      schoolId: session.user.schoolId,
      action: 'override_created',
      targetRecordId: `student_${studentId}`,
      ipHash: hashIp(ip),
      details: `Teacher recorded diagnostic decision: ${decision}`,
    });

    return NextResponse.json({ success: true, override: record });
  } catch {
    return NextResponse.json({ error: 'Failed to record diagnostic override.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');

    if (studentId) {
      const override = getLatestTeacherOverride(studentId);
      return NextResponse.json({ override });
    }

    if (classId) {
      if (session.user.role === 'teacher' && session.user.classId && classId !== session.user.classId) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }
      const overrides = getAllTeacherOverridesForClass(classId, session.user.schoolId);
      return NextResponse.json({ overrides });
    }

    return NextResponse.json({ error: 'Parameter studentId or classId required.' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Server error retrieving overrides.' }, { status: 500 });
  }
}
