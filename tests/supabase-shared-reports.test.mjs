import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

// Import Supabase server module
import {
  insertSharedReport,
  getSharedReport,
  revokeSharedReport,
} from '../src/lib/server/supabase.ts';

// Import in-memory store helpers
import {
  recordAssessmentSessionCompletion,
} from '../src/lib/server/store.ts';

test('1. Supabase Service Role: Never exposed to client code (no NEXT_PUBLIC_ prefix)', () => {
  // Check client files to ensure SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY is never imported or present
  const clientComponentPaths = [
    path.join(workspaceRoot, 'src', 'app', 'r', '[token]', 'SharedReportClient.tsx'),
    path.join(workspaceRoot, 'src', 'components', 'AdaptiveAssessmentView.tsx'),
  ];

  for (const filePath of clientComponentPaths) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(!content.includes('SERVICE_ROLE_KEY'), `Client component at ${filePath} must not reference SERVICE_ROLE_KEY`);
      assert.ok(!content.includes('SUPABASE_SERVICE_KEY'), `Client component at ${filePath} must not reference SUPABASE_SERVICE_KEY`);
    }
  }

  // Check .env.example to verify service role key documentation
  const envExamplePath = path.join(workspaceRoot, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    assert.ok(!envContent.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'), 'Service role key must never have NEXT_PUBLIC_ prefix');
  }
});

test('2. Insert into shared_reports: unguessable token, gap results only, first name, class, expires_at = now + 30 days', async () => {
  const sessionCompleted = `sess_completed_${Math.random().toString(36).slice(2)}`;
  recordAssessmentSessionCompletion(sessionCompleted, 5);

  const inserted = await insertSharedReport({
    report_data: {
      assessmentSessionId: sessionCompleted,
      skillsUnlocked: [{ id: 'place_value', name: 'Place Value' }],
      skillsSleeping: [{ id: 'fractions', name: 'Fractions', prereqRoot: 'Division' }],
      prescribedPlan: [
        { step: 1, title: 'Step 1', desc: 'Step 1 desc' },
        { step: 2, title: 'Step 2', desc: 'Step 2 desc' },
      ],
    },
    first_name: 'Ananya Sharma',
    class: 5,
  });

  // 1. Unguessable token verification (>= 128 bits entropy)
  const tokenRegex = /^[0-9a-f]{32,64}$/i;
  assert.match(inserted.token, tokenRegex, 'Token must have >= 128 bits entropy');

  // 2. First name only (strictly stripped of surname)
  assert.equal(inserted.first_name, 'Ananya', 'Must store only first name, stripped of surname');
  assert.ok(!inserted.first_name.includes(' '), 'First name must contain no spaces/surnames');

  // 3. Class check
  assert.equal(inserted.class, 5, 'Class must be stored');

  // 4. Expires at = now + 30 days
  const now = Date.now();
  const expiryTime = new Date(inserted.expires_at).getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const diff = expiryTime - now;
  assert.ok(Math.abs(diff - thirtyDaysMs) < 5000, 'Expiry must be approximately 30 days from insertion');

  // 5. Default revoked = false
  assert.equal(inserted.revoked, false, 'Default revoked state must be false');

  // 6. Report data has gap results only (no surname, school, roll number)
  assert.ok(inserted.report_data.skillsUnlocked, 'Must include skillsUnlocked');
  assert.ok(inserted.report_data.skillsSleeping, 'Must include skillsSleeping');
  assert.equal(inserted.report_data.studentSurname, undefined);
  assert.equal(inserted.report_data.rollNumber, undefined);
  assert.equal(inserted.report_data.schoolName, undefined);
});

test('3. /report/[token] Server-side page and /r/[token] redirect', async () => {
  const pagePath = path.join(workspaceRoot, 'src', 'app', 'report', '[token]', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  // Verify server-side checks for invalid, expired, or revoked tokens
  assert.ok(pageContent.includes("if (!report)"), 'Must check missing report');
  assert.ok(pageContent.includes("report.revoked"), 'Must check revoked status');
  assert.ok(pageContent.includes("Date.now() >"), 'Must check expiration');

  // Verify redirect from legacy /r/[token]
  const rRedirectPath = path.join(workspaceRoot, 'src', 'app', 'r', '[token]', 'page.tsx');
  const rContent = fs.readFileSync(rRedirectPath, 'utf8');
  assert.ok(rContent.includes("redirect(`/report/"), 'Must redirect /r/[token] to /report/[token]');

  // Functional test via store
  // A. Non-existent token returns null
  const nonExistent = await getSharedReport('0000000000000000000000000000000000000000000000000000000000000000');
  assert.equal(nonExistent, null, 'Non-existent token must return null');

  // B. Active token returns report
  const activeReport = await insertSharedReport({
    report_data: { skillsUnlocked: [] },
    first_name: 'Priya',
    class: 4,
  });
  const fetched = await getSharedReport(activeReport.token);
  assert.ok(fetched !== null, 'Active token must return valid report');
  assert.equal(fetched.revoked, false, 'Fetched report must not be revoked');

  // C. Revoked token
  await revokeSharedReport(activeReport.token);
  const fetchedRevoked = await getSharedReport(activeReport.token);
  assert.ok(fetchedRevoked === null || fetchedRevoked.revoked === true, 'Revoked report must be marked revoked or null');
});

test('4. SEO Invariant: /report/[token] page has noindex meta tag', () => {
  const pagePath = path.join(workspaceRoot, 'src', 'app', 'report', '[token]', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  assert.ok(pageContent.includes('index: false'), '/report/[token] metadata must have index: false');
  assert.ok(pageContent.includes('follow: false'), '/report/[token] metadata must have follow: false');
});

test('5. WhatsApp Share, Copy-Link, and Stop Sharing in UI', () => {
  const clientPath = path.join(workspaceRoot, 'src', 'app', 'r', '[token]', 'SharedReportClient.tsx');
  const clientContent = fs.readFileSync(clientPath, 'utf8');

  // WhatsApp share link
  assert.ok(clientContent.includes('https://wa.me/?text='), 'Must feature WhatsApp wa.me share link');

  // Copy link
  assert.ok(clientContent.includes('handleCopyLink'), 'Must feature copy link handler');

  // Stop sharing button setting revoked = true
  assert.ok(clientContent.includes('handleStopSharing'), 'Must feature stop sharing handler');
  assert.ok(clientContent.includes("method: 'DELETE'"), 'Stop sharing must call DELETE or revocation API');

  // Trilingual support in UI
  assert.ok(clientContent.includes("lang === 'hi'"), 'Must support Hindi in UI');
  assert.ok(clientContent.includes("lang === 'te'"), 'Must support Telugu in UI');
});

test('6. Return link /report/<token> from Route Handler', () => {
  const routePath = path.join(workspaceRoot, 'src', 'app', 'api', 'reports', 'share', 'route.ts');
  const routeContent = fs.readFileSync(routePath, 'utf8');

  assert.ok(routeContent.includes("`/report/${record.token}`") || routeContent.includes("'/report/'"), 'Route handler must generate /report/<token> link');
  assert.ok(routeContent.includes('insertSharedReport'), 'Route handler must call insertSharedReport');
});
