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
    <aside aria-label="Connectivity and Device Security Status" className="space-y-2 mb-4 font-mono text-xs">
      {/* Offline Alert Bar */}
      {!isOnline && (
        <div 
          role="status" 
          aria-live="polite" 
          className="p-3 border border-[#DFA06E] bg-[#DFA06E]/15 text-[#432623] dark:text-[#F5F1BC] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <WifiSlash size={16} className="text-[#DFA06E] shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> Using local cached records. Edits will sync when connection returns.
            </span>
          </div>
          {queuedCount > 0 && (
            <span className="text-[11px] bg-[#DFA06E]/30 px-2 py-0.5 border border-[#DFA06E]/50 shrink-0">
              {queuedCount} changes queued
            </span>
          )}
        </div>
      )}

      {/* Online but pending sync changes */}
      {isOnline && queuedCount > 0 && (
        <div 
          role="status" 
          className="p-3 border border-[#8ABB93] bg-[#8ABB93]/15 text-[#432623] dark:text-[#F5F1BC] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <ArrowsClockwise size={16} className={`text-[#8ABB93] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {queuedCount} offline change{queuedCount > 1 ? 's' : ''} waiting to synchronize with school server.
            </span>
          </div>
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="min-h-[44px] sm:min-h-[32px] px-3 bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623] text-xs font-mono uppercase font-bold shrink-0 hover:bg-[#DE2A35]"
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}

      {/* Shared Device Notice for Government Schools */}
      {showSharedNotice && (
        <div 
          role="note" 
          className="p-2.5 border border-[#432623]/20 dark:border-[#F5F1BC]/20 bg-[#F5F1BC]/30 dark:bg-[#381f1c] flex items-center justify-between text-[11px] text-[#432623]/80 dark:text-[#F5F1BC]/80 gap-2"
        >
          <div className="flex items-center gap-2">
            <Warning size={14} className="text-[#DE2A35] shrink-0" />
            <span>
              <strong>Shared Device Notice:</strong> Always log out after your teaching session to protect child assessment privacy.
            </span>
          </div>
          <button
            onClick={() => setShowSharedNotice(false)}
            aria-label="Dismiss shared device notice"
            className="p-1 hover:bg-[#432623]/10 dark:hover:bg-[#F5F1BC]/10 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </aside>
  );
}
