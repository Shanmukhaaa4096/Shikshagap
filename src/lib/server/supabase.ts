import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import {
  createStudentShareToken,
  getRawShareToken,
  revokeStudentShareToken,
  type SharedReportRecord,
} from './store.ts';

// ==============================================================================
// SUPABASE SERVICE ROLE SERVER CLIENT
// STRICT SECURITY INVARIANT:
// 1. NEVER use NEXT_PUBLIC_ for SUPABASE_SERVICE_ROLE_KEY.
// 2. This module is server-only (used by Next.js Route Handlers and Server Components).
// 3. Service role key bypasses Row Level Security (RLS) to manage shared_reports.
// ==============================================================================

export interface SharedReportRow {
  id?: string;
  token: string;
  report_data: {
    skillsUnlocked?: Array<{ id: string; name: string }>;
    skillsSleeping?: Array<{ id: string; name: string; prereqRoot?: string }>;
    prescribedPlan?: Array<{ step: number; title: string; desc: string }>;
    assessmentSessionId?: string;
    [key: string]: unknown;
  };
  first_name: string;
  class: string | number;
  expires_at: string;
  revoked: boolean;
  created_at?: string;
  class_level?: string | number;
}

let supabaseAdminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Strictly server-side service role key (bypasses RLS)
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseAdminClient;
}

/**
 * Inserts a shared report row into Supabase `shared_reports` table.
 * If Supabase is not configured (e.g. in test or offline environments),
 * falls back to the server in-memory store so tests and preview builds run without failure.
 * When Supabase IS configured, throws an Error if the insert fails so the API can report it.
 */
export async function insertSharedReport(params: {
  token?: string;
  report_data: SharedReportRow['report_data'];
  first_name: string;
  class: string | number;
  expires_at?: string;
  revoked?: boolean;
}): Promise<SharedReportRow> {
  const token = params.token || crypto.randomUUID();
  const cleanFirstName = (params.first_name || 'Learner').trim().split(/\s+/)[0] || 'Learner';
  const expiresAtStr =
    params.expires_at || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const revoked = params.revoked ?? false;

  const row: SharedReportRow = {
    token,
    report_data: params.report_data,
    first_name: cleanFirstName,
    class: params.class,
    expires_at: expiresAtStr,
    revoked,
    created_at: new Date().toISOString(),
  };

  // Always mirror to in-memory store for instant cache & tests
  createStudentShareToken({
    token: row.token,
    assessmentSessionId: String(params.report_data.assessmentSessionId || `sess_${token.slice(0, 8)}`),
    firstName: cleanFirstName,
    grade: params.class,
    skillsUnlocked: params.report_data.skillsUnlocked || [],
    skillsSleeping: params.report_data.skillsSleeping || [],
    prescribedPlan: params.report_data.prescribedPlan,
  });

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const insertPayload: Record<string, unknown> = {
      token: row.token,
      report_data: row.report_data,
      first_name: row.first_name,
      class_level: String(row.class),
      expires_at: row.expires_at,
      revoked: row.revoked,
    };

    const { data, error } = await supabase
      .from('shared_reports')
      .insert(insertPayload)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[Supabase Insert Error]:', error);
      throw new Error(`Database insert failed: ${error.message} (code: ${error.code || 'UNKNOWN'})`);
    }

    if (data) {
      return {
        token: data.token,
        report_data: data.report_data || row.report_data,
        first_name: data.first_name || row.first_name,
        class: data.class_level || data.class || row.class,
        expires_at: data.expires_at || row.expires_at,
        revoked: Boolean(data.revoked),
        created_at: data.created_at || row.created_at,
      };
    }
  }

  return row;
}

/**
 * Fetches a shared report by token from Supabase `shared_reports` table.
 * Returns null if not found.
 */
export async function getSharedReport(token: string): Promise<SharedReportRow | null> {
  if (!token || typeof token !== 'string') return null;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('shared_reports')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (error) {
        console.error('[Supabase Lookup Error]:', error);
      } else if (data) {
        return {
          token: data.token,
          report_data: data.report_data || {},
          first_name: data.first_name || 'Learner',
          class: data.class_level || data.class || 5,
          expires_at: data.expires_at,
          revoked: Boolean(data.revoked),
          created_at: data.created_at,
        };
      }
    } catch (err) {
      console.error('[Supabase Lookup Exception]:', err);
    }
  }

  // Fallback to in-memory store
  const memRecord: SharedReportRecord | null = getRawShareToken(token);
  if (!memRecord) return null;

  return {
    token: memRecord.token,
    report_data: {
      skillsUnlocked: memRecord.skillsUnlocked || [],
      skillsSleeping: memRecord.skillsSleeping || [],
      prescribedPlan: memRecord.prescribedPlan,
      assessmentSessionId: memRecord.assessmentSessionId,
    },
    first_name: memRecord.firstName || 'Learner',
    class: memRecord.grade || 5,
    expires_at: new Date(memRecord.expiresAt).toISOString(),
    revoked: memRecord.revoked,
    created_at: new Date(memRecord.createdAt).toISOString(),
  };
}

/**
 * Revokes a shared report by setting revoked = true in Supabase `shared_reports`.
 */
export async function revokeSharedReport(token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;

  // Mirror to in-memory store
  const memRecord = getRawShareToken(token);
  if (memRecord) {
    revokeStudentShareToken(token, memRecord.creatorSecret || memRecord.assessmentSessionId || '');
    memRecord.revoked = true;
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('shared_reports')
        .update({ revoked: true })
        .eq('token', token);

      if (error) {
        console.warn('[Supabase] Warning revoking shared_report:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[Supabase] Database error during revokeSharedReport:', err);
      return false;
    }
  }

  return true;
}

/**
 * Checks if a report expiration timestamp has passed.
 */
export function isReportExpired(expiresAt: string): boolean {
  const expiryTimestamp = new Date(expiresAt).getTime();
  return Number.isNaN(expiryTimestamp) || Date.now() > expiryTimestamp;
}

