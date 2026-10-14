import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { logAuditEvent, saveTeacherOverride, hashIp } from '@/lib/server/store';
import { getClientIp } from '@/lib/server/security';
import { guardRequest, createGuardResponse, recordIdempotentResponse } from '@/lib/server/guard';

// Set of processed sync item IDs for memory idempotency
const processedSyncItemIds = new Set<string>();

const MAX_SYNC_ITEMS = 200;
const MAX_PAYLOAD_BYTES = 512 * 1024; // 512 KB

export async function POST(req: NextRequest) {
  try {
    const idempotencyKey = req.headers.get('idempotency-key') || undefined;
    const guard = await guardRequest(req, { route: '/api/sync', idempotencyKey });
    if (!guard.ok) {
      return createGuardResponse(guard);
    }

    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Institutional session required.' }, { status: 401 });
    }

    const ip = getClientIp(req);

    // Check payload size using content-length header and raw buffer read
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Sync payload too large. Maximum size is 512 KB.' },
        { status: 413 }
      );
    }

    const rawText = await req.text().catch(() => null);
    if (!rawText) {
      return NextResponse.json({ error: 'Empty or invalid sync payload.' }, { status: 400 });
    }

    if (Buffer.byteLength(rawText, 'utf8') > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Sync payload too large. Maximum size is 512 KB.' },
        { status: 413 }
      );
    }

    let body: { items?: unknown };
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json({ error: 'Invalid sync payload. Expected items array.' }, { status: 400 });
    }

    if (body.items.length > MAX_SYNC_ITEMS) {
      return NextResponse.json(
        { error: `Sync batch exceeds maximum allowed items (${MAX_SYNC_ITEMS}). Received ${body.items.length}.` },
        { status: 400 }
      );
    }

    let processedCount = 0;

    for (const item of body.items) {
      if (!item || typeof item !== 'object') continue;

      // Item idempotency check by unique item.id
      const itemId = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : null;
      if (itemId) {
        if (processedSyncItemIds.has(itemId)) {
          // Already processed; skip cleanly for idempotency
          continue;
        }
        processedSyncItemIds.add(itemId);
        // Prevent unbounded memory growth by pruning oldest entries if set exceeds 10,000
        if (processedSyncItemIds.size > 10000) {
          const firstKey = processedSyncItemIds.values().next().value;
          if (firstKey) processedSyncItemIds.delete(firstKey);
        }
      }

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
      } else if (item.type === 'session_close' && item.payload) {
        try {
          const { processAnonymousSession } = await import('@/lib/db/questionMemory');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await processAnonymousSession(item.payload as any);
          processedCount++;
        } catch {
          // If individual session payload fails or is malformed, skip it
        }
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

    const responsePayload = {
      success: true,
      processedCount,
      timestamp: Date.now(),
    };

    if (idempotencyKey) {
      recordIdempotentResponse(idempotencyKey, { status: 200, body: responsePayload });
    }

    return NextResponse.json(responsePayload);
  } catch {
    return NextResponse.json({ error: 'Sync server processing failure.' }, { status: 500 });
  }
}
