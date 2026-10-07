'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Funnel, Clock, ShieldCheck, User, WarningCircle } from '@phosphor-icons/react';
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

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsPermissionDenied(false);

    try {
      const url = actionFilter 
        ? `/api/admin/audit-log?action=${encodeURIComponent(actionFilter)}`
        : '/api/admin/audit-log';

      const res = await fetch(url);
      if (res.status === 403) {
        setIsPermissionDenied(true);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to load audit records.');
        return;
      }

      setLogs(data.logs || []);
    } catch {
      setErrorMessage('Network connection failure.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPermissionDenied) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF8E8] dark:bg-[#432623] text-[#432623] dark:text-[#F5F1BC] p-4 sm:p-8 flex items-center justify-center">
        <PermissionDeniedState requiredRole="School Administrator" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAF8E8] dark:bg-[#432623] text-[#432623] dark:text-[#F5F1BC] font-sans selection:bg-[#DE2A35] selection:text-[#F5F1BC] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#432623]/20 dark:border-[#F5F1BC]/20 gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="min-h-[44px] px-3 border border-[#432623]/30 dark:border-[#F5F1BC]/30 text-xs font-mono uppercase inline-flex items-center gap-1.5 hover:bg-[#F5F1BC]"
            >
              <ArrowLeft size={16} />
              <span>Dashboard</span>
            </Link>
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-tight">
                Institutional Security Audit Log
              </h1>
              <p className="text-xs font-mono text-[#432623]/70 dark:text-[#F5F1BC]/70">
                Append-only log of security events, student data exports, report shares, and overrides.
              </p>
            </div>
          </div>

          <div className="border border-[#432623]/25 px-2.5 py-1 text-xs font-mono uppercase bg-[#F5F1BC] text-[#432623] self-start sm:self-auto">
            DPDP Act Sec 10 Audit Trail
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mb-6 p-4 border border-[#432623]/20 dark:border-[#F5F1BC]/20 bg-[#FAF8E8] dark:bg-[#381f1c] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Funnel size={16} className="text-[#432623]/60 dark:text-[#F5F1BC]/60" />
            <span className="text-xs font-mono uppercase font-bold">Filter By Action:</span>
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="min-h-[44px] bg-[#FAF8E8] dark:bg-[#432623] border border-[#432623]/30 px-3 text-base sm:text-xs font-mono text-[#432623] dark:text-[#F5F1BC]"
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
          <ErrorState errorMessage={errorMessage} onRetry={fetchLogs} />
        ) : logs.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block border border-[#432623]/25 dark:border-[#F5F1BC]/25 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#F5F1BC]/50 dark:bg-[#381f1c] border-b border-[#432623]/20 dark:border-[#F5F1BC]/20">
                  <tr>
                    <th className="p-3 uppercase">Timestamp</th>
                    <th className="p-3 uppercase">User & Role</th>
                    <th className="p-3 uppercase">Action</th>
                    <th className="p-3 uppercase">Target Scope</th>
                    <th className="p-3 uppercase">Hashed IP</th>
                    <th className="p-3 uppercase">Operational Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#432623]/10 dark:divide-[#F5F1BC]/10">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F5F1BC]/20 dark:hover:bg-[#381f1c]/50">
                      <td className="p-3 whitespace-nowrap text-[#432623]/70 dark:text-[#F5F1BC]/70">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold">{log.userId}</span>
                        <span className="ml-1 text-[10px] px-1 border border-[#432623]/30 uppercase">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 border text-[11px] font-bold ${
                          log.action.includes('failure') 
                            ? 'border-[#DE2A35] text-[#DE2A35]' 
                            : log.action.includes('export')
                              ? 'border-[#DFA06E] text-[#DFA06E]'
                              : 'border-[#8ABB93] text-[#8ABB93]'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-[#432623]/80 dark:text-[#F5F1BC]/80">
                        {log.targetRecordId || '-'}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#432623]/60 dark:text-[#F5F1BC]/60">
                        {log.ipHash}
                      </td>
                      <td className="p-3 text-[#432623]/85 dark:text-[#F5F1BC]/85">
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
                  className="p-4 border border-[#432623]/25 dark:border-[#F5F1BC]/25 bg-[#FAF8E8] dark:bg-[#381f1c] space-y-2 text-xs font-mono"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#432623]/15">
                    <span className={`px-1.5 py-0.5 border text-[10px] font-bold ${
                      log.action.includes('failure') 
                        ? 'border-[#DE2A35] text-[#DE2A35]' 
                        : log.action.includes('export')
                          ? 'border-[#DFA06E] text-[#DFA06E]'
                          : 'border-[#8ABB93] text-[#8ABB93]'
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-[10px] text-[#432623]/60 dark:text-[#F5F1BC]/60">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#432623]/60 dark:text-[#F5F1BC]/60">User: </span>
                      <span className="font-bold">{log.userId}</span>
                    </div>
                    <div>
                      <span className="text-[#432623]/60 dark:text-[#F5F1BC]/60">Role: </span>
                      <span className="uppercase">{log.userRole}</span>
                    </div>
                  </div>

                  {log.details && (
                    <div className="text-[11px] text-[#432623]/85 dark:text-[#F5F1BC]/85 bg-[#F5F1BC]/30 p-2 border border-[#432623]/10">
                      {log.details}
                    </div>
                  )}

                  <div className="text-[10px] text-[#432623]/60 dark:text-[#F5F1BC]/60 flex items-center justify-between pt-1">
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
