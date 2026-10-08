import crypto from 'crypto';
import type { UserRole } from '@/lib/auth/types';

// ==========================================
// AUDIT LOG (APPEND-ONLY)
// ==========================================
export type AuditAction = 
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'view_student_records'
  | 'share_report_created'
  | 'share_report_accessed'
  | 'share_report_revoked'
  | 'override_created'
  | 'export_data'
  | 'view_audit_log'
  | 'data_request_received';

export interface AuditLogEntry {
  id: string;
  timestamp: number; // ISO epoch ms
  userId: string;
  userRole: UserRole | 'anonymous';
  schoolId: string;
  action: AuditAction;
  targetRecordId?: string; // e.g. student ID or export scope (NO student names, NO scores, NO tokens)
  ipHash: string; // 1-way SHA-256 hash of IP for privacy
  details?: string; // High-level operational message (strictly no child PII)
}

const IP_SALT = process.env.IP_SALT || (process.env.NODE_ENV === 'production' ? crypto.randomBytes(16).toString('hex') : 'dev_ip_salt');

export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + IP_SALT).digest('hex').substring(0, 16);
}

// In-memory append-only audit log store
const auditLogs: AuditLogEntry[] = [
  {
    id: 'log_init_01',
    timestamp: Date.now() - 3600000,
    userId: 'usr_admin_1',
    userRole: 'school_admin',
    schoolId: 'sch_mpps_rampur',
    action: 'login_success',
    ipHash: hashIp('127.0.0.1'),
    details: 'System startup institutional session established',
  }
];

export function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const newLog: AuditLogEntry = {
    ...entry,
    id: `log_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    timestamp: Date.now(),
  };
  // Append-only constraint: cannot edit or delete
  auditLogs.unshift(newLog); // latest first
  return newLog;
}

export function getAuditLogs(
  schoolId: string, 
  filter?: { action?: AuditAction; userId?: string; dateFrom?: number; dateTo?: number },
  page = 1,
  limit = 20
): { logs: AuditLogEntry[]; total: number } {
  let filtered = auditLogs.filter(log => log.schoolId === schoolId);

  if (filter?.action) {
    filtered = filtered.filter(log => log.action === filter.action);
  }
  if (filter?.userId) {
    filtered = filtered.filter(log => log.userId === filter.userId);
  }
  if (filter?.dateFrom) {
    filtered = filtered.filter(log => log.timestamp >= filter.dateFrom!);
  }
  if (filter?.dateTo) {
    filtered = filtered.filter(log => log.timestamp <= filter.dateTo!);
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return { logs: paginated, total };
}

// ==========================================
// SECURE REPORT SHARE TOKENS (128-BIT ENTROPY)
// ==========================================
export interface SharedReportRecord {
  token: string; // 128-bit hex string
  studentId: string;
  schoolId: string;
  classId: string;
  createdById: string;
  createdAt: number;
  expiresAt: number; // 7 days standard
  revoked: boolean;
  viewsCount: number;
  maxViews: number;
  confirmedNotice: boolean; // Teacher confirmation recording
}

const shareTokens = new Map<string, SharedReportRecord>();

export function createShareToken(params: {
  studentId: string;
  schoolId: string;
  classId: string;
  createdById: string;
  confirmedNotice: boolean;
  maxViews?: number;
}): SharedReportRecord {
  // 128-bit unguessable random cryptographic token
  const token = crypto.randomBytes(16).toString('hex');
  const record: SharedReportRecord = {
    token,
    studentId: params.studentId,
    schoolId: params.schoolId,
    classId: params.classId,
    createdById: params.createdById,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    revoked: false,
    viewsCount: 0,
    maxViews: params.maxViews ?? 20, // default max 20 parent views
    confirmedNotice: params.confirmedNotice,
  };

  shareTokens.set(token, record);
  return record;
}

export function getShareToken(token: string): SharedReportRecord | null {
  const record = shareTokens.get(token);
  if (!record) return null;
  if (record.revoked) return null;
  if (Date.now() > record.expiresAt) return null;
  if (record.viewsCount >= record.maxViews) return null;
  return record;
}

export function recordTokenView(token: string): boolean {
  const record = shareTokens.get(token);
  if (!record) return false;
  record.viewsCount += 1;
  return true;
}

export function revokeShareToken(token: string, userId: string, schoolId: string): boolean {
  const record = shareTokens.get(token);
  if (!record) return false;
  if (record.schoolId !== schoolId) return false;
  record.revoked = true;
  return true;
}

// ==========================================
// TEACHER OVERRIDES ON AI DIAGNOSES
// ==========================================
export interface TeacherOverrideRecord {
  id: string;
  studentId: string;
  classId: string;
  schoolId: string;
  teacherId: string;
  teacherName: string;
  timestamp: number;
  originalRootGapId: string;
  originalRootGapLabel: string;
  decision: 'accepted' | 'changed' | 'dismissed';
  newRootGapId?: string;
  newRootGapLabel?: string;
  teacherNote?: string; // Sanitized, max 500 chars
}

// Map of studentId -> list of override records (immutable history)
const teacherOverrides = new Map<string, TeacherOverrideRecord[]>();

export function saveTeacherOverride(override: Omit<TeacherOverrideRecord, 'id' | 'timestamp'>): TeacherOverrideRecord {
  const record: TeacherOverrideRecord = {
    ...override,
    id: `ovr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    timestamp: Date.now(),
  };

  const list = teacherOverrides.get(override.studentId) || [];
  list.unshift(record); // newest first
  teacherOverrides.set(override.studentId, list);
  return record;
}

export function getLatestTeacherOverride(studentId: string): TeacherOverrideRecord | null {
  const list = teacherOverrides.get(studentId);
  return list && list.length > 0 ? list[0] : null;
}

export function getAllTeacherOverridesForClass(classId: string, schoolId: string): TeacherOverrideRecord[] {
  const results: TeacherOverrideRecord[] = [];
  for (const list of teacherOverrides.values()) {
    if (list.length > 0 && list[0].classId === classId && list[0].schoolId === schoolId) {
      results.push(list[0]);
    }
  }
  return results;
}

// ==========================================
// RE-AUTHENTICATION CHECK (10 MINUTE WINDOW)
// ==========================================
const userRecentAuth = new Map<string, number>();

export function recordRecentAuth(userId: string): void {
  userRecentAuth.set(userId, Date.now());
}

export function hasRecentAuth(userId: string, windowMs = 10 * 60 * 1000): boolean {
  const lastAuth = userRecentAuth.get(userId);
  if (!lastAuth) return false;
  return (Date.now() - lastAuth) < windowMs;
}
