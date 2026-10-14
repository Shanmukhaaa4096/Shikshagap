'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Funnel } from '@phosphor-icons/react';
import { LoadingSkeletonState, EmptyState, ErrorState, PermissionDeniedState } from '@/components/StateScreens';

interface AuditLogItem {
  id: string;
  timestamp: number;
  userId: string;
  userRole: string;
  action: string;
  targetRecordId?: string;
  ipHash: string;
  details?: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadLogs() {
      try {
        const url = actionFilter 
          ? `/api/admin/audit-log?action=${encodeURIComponent(actionFilter)}`
          : '/api/admin/audit-log';

        const res = await fetch(url);
        if (ignore) return;
        if (res.status === 403) {
          setIsPermissionDenied(true);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        if (ignore) return;
        if (!res.ok) {
          setErrorMessage(data.error || 'Failed to load audit records.');
          setIsLoading(false);
          return;
        }

        setLogs(data.logs || []);
      } catch {
        if (!ignore) setErrorMessage('Network connection failure.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadLogs();
    return () => {
      ignore = true;
    };
  }, [actionFilter, refreshKey]);

  if (isPermissionDenied) {
    return (
      <div className="min-h-[100dvh] bg-card dark:bg-muted text-foreground p-4 sm:p-8 flex items-center justify-center">
        <PermissionDeniedState requiredRole="School Administrator" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-card dark:bg-muted text-foreground font-sans selection:bg-primary text-primary-foreground selection:text-primary-foreground p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-border gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="min-h-[44px] px-3 border border-border text-sm font-mono uppercase inline-flex items-center gap-1.5 hover:bg-muted"
            >
              <ArrowLeft size={16} />
              <span>Dashboard</span>
            </Link>
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-tight">
                Institutional Security Audit Log
              </h1>
              <p className="text-sm font-mono text-muted-foreground dark:text-muted-foreground">
                Append-only log of security events, student data exports, report shares, and overrides.
              </p>
            </div>
          </div>

          <div className="border border-border px-2.5 py-1 text-sm font-mono uppercase bg-muted text-foreground self-start sm:self-auto">
            DPDP Act Sec 10 Audit Trail
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mb-6 p-4 border border-border bg-card dark:bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Funnel size={16} className="text-muted-foreground dark:text-muted-foreground" />
            <span className="text-sm font-mono uppercase font-bold">Filter By Action:</span>
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="min-h-[44px] bg-card dark:bg-muted border border-border px-3 text-base sm:text-sm font-mono text-foreground"
          >
            <option value="">All Security Events</option>
            <option value="login_success">Successful Logins</option>
            <option value="login_failure">Failed Authentication</option>
            <option value="override_created">Teacher Diagnostic Overrides</option>
            <option value="share_report_created">Parent Report Links Generated</option>
            <option value="share_report_accessed">Parent Report Views</option>
            <option value="export_data">Student Data Exports</option>
            <option value="view_audit_log">Audit Trail Views</option>
          </select>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <LoadingSkeletonState />
        ) : errorMessage ? (
          <ErrorState errorMessage={errorMessage} onRetry={() => setRefreshKey(k => k + 1)} />
        ) : logs.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block border border-border overflow-x-auto">
              <table className="w-full text-left text-sm font-mono">
                <thead className="bg-muted dark:bg-card border-b border-border">
                  <tr>
                    <th className="p-3 uppercase">Timestamp</th>
                    <th className="p-3 uppercase">User & Role</th>
                    <th className="p-3 uppercase">Action</th>
                    <th className="p-3 uppercase">Target Scope</th>
                    <th className="p-3 uppercase">Hashed IP</th>
                    <th className="p-3 uppercase">Operational Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted dark:hover:bg-[#381f1c]/50">
                      <td className="p-3 whitespace-nowrap text-muted-foreground dark:text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold">{log.userId}</span>
                        <span className="ml-1 text-sm px-1 border border-border uppercase">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 border text-sm font-bold ${
                          log.action.includes('failure') 
                            ? 'border-primary text-primary' 
                            : log.action.includes('export')
                              ? 'bg-[var(--status-warn)] text-foreground border-border'
                              : 'bg-[var(--status-good)] text-foreground border-border'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-foreground/80 dark:text-muted-foreground">
                        {log.targetRecordId || '-'}
                      </td>
                      <td className="p-3 font-mono text-sm text-muted-foreground dark:text-muted-foreground">
                        {log.ipHash}
                      </td>
                      <td className="p-3 text-foreground/80 dark:text-muted-foreground">
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (< 640px) */}
            <div className="sm:hidden space-y-3">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-4 border border-border bg-card dark:bg-card space-y-2 text-sm font-mono"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className={`px-1.5 py-0.5 border text-sm font-bold ${
                      log.action.includes('failure') 
                        ? 'border-primary text-primary' 
                        : log.action.includes('export')
                          ? 'bg-[var(--status-warn)] text-foreground border-border'
                          : 'bg-[var(--status-good)] text-foreground border-border'
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground dark:text-muted-foreground">User: </span>
                      <span className="font-bold">{log.userId}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground dark:text-muted-foreground">Role: </span>
                      <span className="uppercase">{log.userRole}</span>
                    </div>
                  </div>

                  {log.details && (
                    <div className="text-sm text-foreground/80 dark:text-muted-foreground bg-muted p-2 border border-border">
                      {log.details}
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground dark:text-muted-foreground flex items-center justify-between pt-1">
                    <span>Scope: {log.targetRecordId || '-'}</span>
                    <span>IP: {log.ipHash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
