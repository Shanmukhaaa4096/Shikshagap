import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

import {
  generateShareToken,
  createStudentShareToken,
  getShareToken,
  getShareTokenStatus,
  revokeStudentShareToken,
  recordAssessmentSessionCompletion,
  DEFAULT_REPORT_EXPIRY_DAYS,
} from '../src/lib/server/store.ts';

import {
  insertSharedReport,
  getSharedReport,
  isReportExpired,
} from '../src/lib/server/supabase.ts';

test('Share Report: Unguessable token generation has at least 128 bits of entropy and no PII', () => {
  const tokens = new Set();
  const hex64Regex = /^[0-9a-f]{64}$/i;

  for (let i = 0; i < 50; i++) {
    const token = generateShareToken();
    assert.match(token, hex64Regex, 'Token must be a 64-character lowercase hex string (256 bits)');
    assert.ok(!tokens.has(token), 'Every generated token must be unique');
    tokens.add(token);

    // Verify absence of common PII or sequential patterns
    assert.ok(!token.includes('student'), 'Token must contain no PII words');
    assert.ok(!token.includes('aarav'), 'Token must contain no student name');
    assert.ok(!token.includes('class'), 'Token must contain no grade metadata');
  }
});

test('Share Report: Server-side storage and 30-day default expiry', async () => {
  const sessionId = `sess_server_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  recordAssessmentSessionCompletion(sessionId, 5);

  const shared = await insertSharedReport({
    report_data: {
      assessmentSessionId: sessionId,
      skillsUnlocked: [{ id: 'place_value', name: 'Place Value' }],
      skillsSleeping: [{ id: 'multi_digit_mult', name: 'Multiplication', prereqRoot: 'mult_facts' }],
      prescribedPlan: [{ step: 1, title: 'Step 1', desc: 'Desc 1' }],
      totalQuestions: 10,
      confidence: 0.92,
      isProvisional: false,
    },
    first_name: 'Priya Sharma',
    class: 5,
  });

  assert.ok(shared.token, 'Must return token');
  assert.equal(shared.token.length, 64, 'Token must be 64 hex characters (256 bits)');
  assert.equal(shared.first_name, 'Priya', 'Must store only first name, stripped of surname');
  assert.equal(shared.class, 5);
  assert.equal(shared.revoked, false);

  // Check 30-day expiry calculation
  const now = Date.now();
  const expiryTime = new Date(shared.expires_at).getTime();
  const expectedThirtyDaysMs = DEFAULT_REPORT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const diff = expiryTime - now;
  assert.ok(Math.abs(diff - expectedThirtyDaysMs) < 5000, 'Expires at must be 30 days from creation');

  // Verify retrieval
  const fetched = await getSharedReport(shared.token);
  assert.ok(fetched !== null, 'Report must be retrievable by token');
  assert.equal(fetched.first_name, 'Priya');
  assert.equal(isReportExpired(fetched.expires_at), false, 'Active report must not be expired');
});

test('Share Report: Revocation via creatorSecret prevents unauthorized viewers', async () => {
  const sessionId = `sess_revocation_${Date.now()}`;
  recordAssessmentSessionCompletion(sessionId, 4);

  const memoryRecord = createStudentShareToken({
    assessmentSessionId: sessionId,
    firstName: 'Aarav Patel',
    grade: 4,
    skillsUnlocked: [{ id: 'addition', name: 'Addition' }],
    skillsSleeping: [],
  });

  // Attempt revocation with invalid secret
  const badRevoke = revokeStudentShareToken(memoryRecord.token, 'invalid-secret-attempt');
  assert.equal(badRevoke, false, 'Revocation with incorrect secret must fail');
  assert.ok(getShareToken(memoryRecord.token) !== null, 'Token must still be accessible');

  // Revocation with creatorSecret
  const goodRevoke = revokeStudentShareToken(memoryRecord.token, memoryRecord.creatorSecret);
  assert.equal(goodRevoke, true, 'Revocation with creatorSecret must succeed');
  assert.equal(getShareToken(memoryRecord.token), null, 'Revoked token must return null to viewers');

  const status = getShareTokenStatus(memoryRecord.token);
  assert.equal(status.status, 'revoked');
});

test('Share Report: Middleware enforces noindex and no-store headers on /report and /r routes', () => {
  const middlewarePath = path.join(workspaceRoot, 'src', 'middleware.ts');
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

  // Headers invariant
  assert.ok(middlewareContent.includes('X-Robots-Tag'), 'Middleware must set X-Robots-Tag header');
  assert.ok(middlewareContent.includes('noindex, nofollow, noarchive'), 'Must specify noindex, nofollow, noarchive');
  assert.ok(middlewareContent.includes('Cache-Control'), 'Middleware must set Cache-Control header');
  assert.ok(middlewareContent.includes('no-store'), 'Must enforce no-store cache control');
  assert.ok(middlewareContent.includes('/report/:path*'), 'Middleware matcher must cover /report/:path*');
  assert.ok(middlewareContent.includes('/r/:path*'), 'Middleware matcher must cover /r/:path*');
});

test('Share Report: Fresh session access without client localStorage', () => {
  const pagePath = path.join(workspaceRoot, 'src', 'app', 'report', '[token]', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  // Must be server-side data fetching from database
  assert.ok(pageContent.includes('getSharedReport'), 'Server page must query getSharedReport');
  assert.ok(!pageContent.includes('localStorage'), 'Server page must not rely on client localStorage');

  // Friendly error card on expired/revoked/invalid
  assert.ok(pageContent.includes('Report Link Expired'), 'Must render expired card');
  assert.ok(pageContent.includes('Report Link Revoked'), 'Must render revoked card');
  assert.ok(pageContent.includes('Report Link Unavailable'), 'Must render unavailable card');
});
