/**
 * ShikshaGap Offline Queue & Sync Manager
 * Designed for low-connectivity Indian classrooms on 2G/3G networks.
 */

export interface QueuedAction {
  id: string;
  type: 'teacher_override' | 'practice_result';
  timestamp: number;
  payload: Record<string, unknown>;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'shikshagap_offline_queue_v1';
const LAST_SYNC_KEY = 'shikshagap_last_sync_timestamp';

export function getOfflineQueue(): QueuedAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function queueOfflineAction(action: Omit<QueuedAction, 'id' | 'retryCount'>): QueuedAction {
  const queue = getOfflineQueue();
  const newAction: QueuedAction = {
    ...action,
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    retryCount: 0,
  };
  queue.push(newAction);
  if (typeof window !== 'undefined') {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }
  return newAction;
}

export function removeQueuedAction(id: string): void {
  const queue = getOfflineQueue().filter(item => item.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }
}

export function clearOfflineQueue(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  }
}

export function getLastSyncTime(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(LAST_SYNC_KEY);
  return raw ? parseInt(raw, 10) : null;
}

export function recordSyncSuccess(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  }
}

/**
 * Wipe all local data on logout, session expiry, or role change.
 * Prevents child assessment data from leaking on shared government school phones.
 */
export function wipeLocalSecureData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('shikshagap_students_v1');
    localStorage.removeItem(QUEUE_STORAGE_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
    sessionStorage.clear();
  } catch {
    // Ignore storage errors
  }
}

export async function syncOfflineQueue(): Promise<{
  success: boolean;
  syncedCount: number;
  remainingCount: number;
  error?: string;
}> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { success: true, syncedCount: 0, remainingCount: 0 };
  }

  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: queue }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        syncedCount: 0,
        remainingCount: queue.length,
        error: errData.error || 'Server error during sync',
      };
    }

    const result = await response.json();
    clearOfflineQueue();
    recordSyncSuccess();
    return {
      success: true,
      syncedCount: result.processedCount || queue.length,
      remainingCount: 0,
    };
  } catch (err) {
    return {
      success: false,
      syncedCount: 0,
      remainingCount: queue.length,
      error: 'Network unreachable. Queued changes retained.',
    };
  }
}
