import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { verifyCredentials } from '@/lib/auth/users';
import { hasRecentAuth, recordRecentAuth, logAuditEvent, hashIp } from '@/lib/server/store';
import { loadStudents, DemoStudentData } from '@/lib/data/demo';

function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // CSV / Formula Injection Protection:
  // If the cell begins with =, +, -, @, or tab/carriage return, prefix with single quote (')
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape internal double quotes by doubling them
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const body = await req.json().catch(() => ({}));
    const { format = 'csv', passwordConfirm, classId } = body;

    // Data isolation check: Teacher can only export their own class
    if (session.user.role === 'teacher' && classId && session.user.classId && classId !== session.user.classId) {
      logAuditEvent({
        userId: session.user.id,
        userRole: session.user.role,
        schoolId: session.user.schoolId,
        action: 'export_data',
        ipHash: hashIp(ip),
        details: 'DENIED: Cross-class export attempt blocked',
      });
      return NextResponse.json({ error: 'Forbidden. You may only export your own classroom records.' }, { status: 403 });
    }

    // Check recent re-authentication (within 10 minutes)
    const isRecentlyAuthed = hasRecentAuth(session.user.id, 10 * 60 * 1000);

    if (!isRecentlyAuthed) {
      if (!passwordConfirm) {
        return NextResponse.json(
          { 
            error: 'Security re-authentication required prior to exporting student records.',
            code: 'REAUTH_REQUIRED'
          },
          { status: 403 }
        );
      }

      // Verify re-authentication password
      const reauthUser = await verifyCredentials(session.user.email, passwordConfirm);
      if (!reauthUser) {
        return NextResponse.json(
          { error: 'Invalid password. Re-authentication failed.' },
          { status: 401 }
        );
      }
      recordRecentAuth(session.user.id);
    }

    // Load cohort data for the user's school / class
    const students: DemoStudentData[] = loadStudents();
    const exportScope = session.user.role === 'teacher' ? (session.user.classId || 'class_5a') : session.user.schoolId;

    logAuditEvent({
      userId: session.user.id,
      userRole: session.user.role,
      schoolId: session.user.schoolId,
      action: 'export_data',
      targetRecordId: `scope_${exportScope}`,
      ipHash: hashIp(ip),
      details: `Exported ${students.length} student records in ${format.toUpperCase()} format`,
    });

    if (format === 'json') {
      const sanitizedJson = students.map(s => {
        const mastery = s.profile.overallMastery ?? 0;
        const rootGap = s.profile.rootCauses?.[0]?.rootId || 'None';
        const planFocus = s.activePlan?.conceptId || 'None';
        return {
          rollNo: s.student.rollNo,
          studentName: s.student.name,
          overallMasteryScore: Math.round(mastery * 100),
          status: mastery < 0.6 ? 'Critical' : mastery < 0.8 ? 'Developing' : 'On Track',
          diagnosedRootGap: rootGap,
          activePlanFocus: planFocus,
        };
      });

      return new NextResponse(JSON.stringify(sanitizedJson, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="shikshagap_${exportScope}_records.json"`,
          'Cache-Control': 'no-store, private',
        },
      });
    }

    // Default: CSV format
    const headers = [
      'Roll Number',
      'Student Name',
      'Overall Mastery Score (%)',
      'Diagnostic Status',
      'Diagnosed Prerequisite Gap',
      '5-Day Remedial Focus'
    ];

    const rows = students.map(s => {
      const mastery = s.profile.overallMastery ?? 0;
      const rootGap = s.profile.rootCauses?.[0]?.rootId || 'None';
      const planFocus = s.activePlan?.conceptId || 'None';
      return [
        sanitizeCsvCell(s.student.rollNo),
        sanitizeCsvCell(s.student.name),
        sanitizeCsvCell(Math.round(mastery * 100)),
        sanitizeCsvCell(mastery < 0.6 ? 'Critical' : mastery < 0.8 ? 'Developing' : 'On Track'),
        sanitizeCsvCell(rootGap),
        sanitizeCsvCell(planFocus),
      ].join(',');
    });

    // UTF-8 BOM (\uFEFF) ensures Hindi and Telugu script display accurately in Excel
    const csvContent = '\uFEFF' + headers.map(h => `"${h}"`).join(',') + '\n' + rows.join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="shikshagap_${exportScope}_records.csv"`,
        'Cache-Control': 'no-store, private',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Server error processing data export.' }, { status: 500 });
  }
}
