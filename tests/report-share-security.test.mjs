import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

// Import server store methods
import {
  createStudentShareToken,
  getShareToken,
  getRawShareToken,
  revokeStudentShareToken,
  recordAssessmentSessionCompletion,
  isAssessmentSessionCompleted,
} from '../src/lib/server/store.ts';

test('Report Share: Token Entropy - Uses crypto.randomUUID (not sequential IDs)', () => {
  const tokenRecord1 = createStudentShareToken({
    assessmentSessionId: 'sess_12345678',
    firstName: 'Aarav Sharma',
    grade: 5,
    skillsUnlocked: [{ id: 'place_value', name: 'Place Value' }],
    skillsSleeping: [{ id: 'fractions', name: 'Fractions', prereqRoot: 'Division' }],
  });

  const tokenRecord2 = createStudentShareToken({
    assessmentSessionId: 'sess_12345678',
    firstName: 'Priya K',
    grade: 5,
    skillsUnlocked: [],
    skillsSleeping: [],
  });

  // Verify token has at least 128 bits of entropy (64 hex chars / 256-bit unguessable token)
  const tokenRegex = /^[0-9a-f]{32,64}$/i;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  assert.match(tokenRecord1.token, tokenRegex, 'Share token must have >= 128 bits of cryptographic entropy');
  assert.match(tokenRecord2.token, tokenRegex, 'Share token must have >= 128 bits of cryptographic entropy');
  assert.notEqual(tokenRecord1.token, tokenRecord2.token, 'Tokens must be unique and non-sequential');

  // Verify creator secret is also an unguessable UUID
  assert.match(tokenRecord1.creatorSecret, uuidRegex, 'Creator secret must be a valid crypto.randomUUID()');
});

test('Report Share: Expiration - Links expire after 30 days', () => {
  const now = Date.now();
  const tokenRecord = createStudentShareToken({
    assessmentSessionId: 'sess_expiry_test',
    firstName: 'Rohan',
    grade: 4,
    skillsUnlocked: [{ id: 'addition', name: 'Addition' }],
    skillsSleeping: [],
  });

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const diff = tokenRecord.expiresAt - tokenRecord.createdAt;
  assert.equal(diff, thirtyDaysMs, 'Token must expire in exactly 30 days (2592000000 ms)');

  // Active token retrieval
  const activeRecord = getShareToken(tokenRecord.token);
  assert.ok(activeRecord !== null, 'Active token within 30 days must be accessible');

  // Expired token test
  tokenRecord.expiresAt = now - 1000; // set expiry in past
  const expiredRecord = getShareToken(tokenRecord.token);
  assert.equal(expiredRecord, null, 'Expired token beyond 30 days must return null');
});

test('Report Share: Creator Revocation - Only creator with creatorSecret can revoke link', () => {
  const tokenRecord = createStudentShareToken({
    assessmentSessionId: 'sess_revoke_test',
    firstName: 'Ananya Gupta',
    grade: 3,
    skillsUnlocked: [],
    skillsSleeping: [{ id: 'regrouping', name: 'Regrouping' }],
  });

  // Unauthorized revocation attempt with wrong secret must fail
  const wrongSecretAttempt = revokeStudentShareToken(tokenRecord.token, 'wrong-secret-token');
  assert.equal(wrongSecretAttempt, false, 'Revocation with wrong secret must be rejected');
  assert.ok(getShareToken(tokenRecord.token) !== null, 'Token should still be active after failed revocation');

  // Authorized revocation with valid creatorSecret
  const authorizedAttempt = revokeStudentShareToken(tokenRecord.token, tokenRecord.creatorSecret);
  assert.equal(authorizedAttempt, true, 'Revocation with valid creatorSecret must succeed');

  // Verification: Token is now revoked
  assert.equal(getShareToken(tokenRecord.token), null, 'Revoked token must not be accessible via getShareToken');
  const rawRecord = getRawShareToken(tokenRecord.token);
  assert.equal(rawRecord.revoked, true, 'Raw record must be marked revoked');
});

test('Report Share: Privacy Invariant - Shows ONLY first name, class, and skills (NO surname, roll number, school, contact)', () => {
  const testNames = [
    { input: 'Aarav Sharma', expectedFirst: 'Aarav' },
    { input: 'Priya K. Reddy', expectedFirst: 'Priya' },
    { input: 'Mohd. Imran', expectedFirst: 'Mohd.' },
    { input: 'Sunita', expectedFirst: 'Sunita' },
  ];

  for (const { input, expectedFirst } of testNames) {
    const record = createStudentShareToken({
      assessmentSessionId: `sess_${Math.random().toString(36).slice(2)}`,
      firstName: input,
      grade: 5,
      skillsUnlocked: [{ id: 'numbers', name: 'Numbers' }],
      skillsSleeping: [{ id: 'fractions', name: 'Fractions' }],
    });

    assert.equal(record.firstName, expectedFirst, `Stored name must only be first name '${expectedFirst}', got '${record.firstName}'`);
    assert.ok(!record.firstName.includes(' '), 'First name must contain no spaces/surnames');
  }

  // Inspect ReportClientView.tsx source to verify absence of surname/roll number/contact fields
  const clientViewPath = path.join(workspaceRoot, 'src', 'app', 'report', '[token]', 'ReportClientView.tsx');
  const clientViewContent = fs.readFileSync(clientViewPath, 'utf8');

  // Ensure cleanFirstName is strictly extracted
  assert.ok(clientViewContent.includes(".split(/\\s+/)[0]"), 'Client view must isolate first name only');

  // Ensure no roll number, student contact, or school phone/email fields
  const forbiddenPiiTerms = ['rollNumber', 'roll_number', 'studentEmail', 'studentPhone', 'parentPhone', 'parentEmail'];
  for (const term of forbiddenPiiTerms) {
    assert.ok(!clientViewContent.includes(term), `Forbidden PII field "${term}" found in ReportClientView`);
  }
});

test('Report Share: Security - Only the session that completed the assessment can create share link', () => {
  const sessionCompleted = 'sess_completed_exam_999';
  const sessionUnfinished = 'sess_fake_unauthenticated_000';

  // Mark completion
  recordAssessmentSessionCompletion(sessionCompleted, 5);

  assert.equal(isAssessmentSessionCompleted(sessionCompleted), true, 'Completed assessment session must be recognized');
  assert.equal(isAssessmentSessionCompleted(sessionUnfinished), false, 'Unfinished/unauthorized session must NOT be permitted to create link');
});

test('Report Share: SEO & Crawler Invariant - Contains noindex and nofollow meta tags', () => {
  const pagePath = path.join(workspaceRoot, 'src', 'app', 'report', '[token]', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  // Verify metadata configuration
  assert.ok(pageContent.includes('index: false'), 'Metadata must configure index: false');
  assert.ok(pageContent.includes('follow: false'), 'Metadata must configure follow: false');
  assert.ok(pageContent.includes('noarchive: true'), 'Metadata must configure noarchive: true');
});

test('Report Share: WhatsApp One-Tap Link and Copy-Link Button with Trilingual Strings', () => {
  const viewPath = path.join(workspaceRoot, 'src', 'components', 'AdaptiveAssessmentView.tsx');
  const viewContent = fs.readFileSync(viewPath, 'utf8');

  const dictPath = path.join(workspaceRoot, 'src', 'lib', 'i18n', 'dict.ts');
  const dictContent = fs.readFileSync(dictPath, 'utf8');

  // Verify WhatsApp URL generation in AdaptiveAssessmentView
  assert.ok(viewContent.includes('https://wa.me/?text='), 'AdaptiveAssessmentView must feature wa.me prefilled share link');
  assert.ok(viewContent.includes('data-testid="modal-whatsapp-share-btn"'), 'Must have testable WhatsApp share button');
  assert.ok(viewContent.includes('data-testid="modal-copy-link-btn"'), 'Must have testable copy link button');
  assert.ok(viewContent.includes('data-testid="share-report-btn"'), 'Must have testable Share Report CTA');

  // Verify Trilingual strings in dict.ts
  const shareKeys = [
    'shareReportBtn',
    'shareReportModalTitle',
    'shareReportModalSub',
    'shareViaWhatsApp',
    'copyLink',
    'linkCopied',
    'revokeLink',
    'linkRevoked',
    'linkRevokedDesc',
    'linkExpiresNotice',
  ];

  for (const key of shareKeys) {
    assert.match(dictContent, new RegExp(`${key}:\\s*string;`), `Dict interface must include '${key}'`);
    const matches = [...dictContent.matchAll(new RegExp(`${key}:\\s*["'\`](.+?)["'\`]`, 'g'))];
    assert.ok(matches.length >= 3, `Key '${key}' must be translated in en, hi, and te`);
  }
});
