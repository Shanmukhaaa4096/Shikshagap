'use client';

import React, { useState, useEffect } from 'react';
import { WifiSlash, ArrowsClockwise, Warning, X } from '@phosphor-icons/react';
import { getOfflineQueue, syncOfflineQueue, getLastSyncTime } from '@/lib/offline/sync';

export function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSharedNotice, setShowSharedNotice] = useState(true);

  const triggerSync = React.useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    setIsSyncing(true);

    const result = await syncOfflineQueue();
    setIsSyncing(false);

    if (result.success) {
      setQueuedCount(0);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const updateOffline = () => setIsOnline(false);

    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOffline);

    // Check queue
    const checkQueue = () => {
      const q = getOfflineQueue();
      setQueuedCount(q.length);
      getLastSyncTime();
    };

    checkQueue();
    const interval = setInterval(checkQueue, 10000);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOffline);
      clearInterval(interval);
    };
  }, [triggerSync]);

  // If online with 0 queued items and shared notice dismissed, keep UI completely unobtrusive
  if (isOnline && queuedCount === 0 && !showSharedNotice) {
    return null;
  }

  return (
    <aside aria-label="Connectivity and Device Security Status" className="space-y-2 mb-4 font-mono text-sm">
      {/* Offline Alert Bar */}
      {!isOnline && (
        <div 
          role="status" 
          aria-live="polite" 
          className="p-3 border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <WifiSlash size={16} className="text-[var(--status-warn)] shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> Using local cached records. Edits will sync when connection returns.
            </span>
          </div>
          {queuedCount > 0 && (
            <span className="text-sm bg-[var(--status-warn)]/30 px-2 py-0.5 border border-[var(--status-warn-border)]/50 shrink-0">
              {queuedCount} changes queued
            </span>
          )}
        </div>
      )}

      {/* Online but pending sync changes */}
      {isOnline && queuedCount > 0 && (
        <div 
          role="status" 
          className="p-3 border border-[var(--status-good-border)] bg-[var(--status-good-bg)] text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <ArrowsClockwise size={16} className={`text-[var(--status-good)] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {queuedCount} offline change{queuedCount > 1 ? 's' : ''} waiting to synchronize with school server.
            </span>
          </div>
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="min-h-[44px] sm:min-h-[32px] px-3 bg-primary text-primary-foreground dark:bg-muted dark:text-foreground text-sm font-mono uppercase font-bold shrink-0 hover:bg-primary"
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}

      {/* Shared Device Notice for Government Schools */}
      {showSharedNotice && (
        <div 
          role="note" 
          className="p-2.5 border border-border bg-muted dark:bg-card flex items-center justify-between text-sm text-foreground/80 dark:text-muted-foreground gap-2"
        >
          <div className="flex items-center gap-2">
            <Warning size={14} className="text-primary shrink-0" />
            <span>
              <strong>Shared Device Notice:</strong> Always log out after your teaching session to protect child assessment privacy.
            </span>
          </div>
          <button
            onClick={() => setShowSharedNotice(false)}
            aria-label="Dismiss shared device notice"
            className="p-1 hover:bg-muted shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </aside>
  );
}
