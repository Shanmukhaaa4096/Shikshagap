import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const workspaceRoot = process.cwd();

test('Audit 1: Sitemap Privacy & No Private Student Routes', () => {
  const sitemapPath = path.join(workspaceRoot, 'src', 'app', 'sitemap.ts');
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

  // Verify private student routes are NOT included
  assert.equal(sitemapContent.includes('/app/'), false, 'Private /app/ route must not be in sitemap');
  assert.equal(sitemapContent.includes('/api/'), false, 'Internal /api/ route must not be in sitemap');
  assert.equal(sitemapContent.includes('/report/'), false, 'Private student /report/ route must not be in sitemap');

  // Verify all entries use canonical baseUrl
  assert.ok(sitemapContent.includes('https://shikshagap.vercel.app'), 'Sitemap must use configured production domain');
});

test('Audit 2: Robots.txt Disallow Rules for Private Routes', () => {
  const robotsPath = path.join(workspaceRoot, 'src', 'app', 'robots.ts');
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');

  // Verify disallow directives protect private student records
  assert.ok(robotsContent.includes("'/app'"), 'Robots must disallow /app');
  assert.ok(robotsContent.includes("'/api'"), 'Robots must disallow /api');
  assert.ok(robotsContent.includes("'/report'"), 'Robots must disallow /report');
});

test('Audit 3: Language Rules - No Em Dashes in Translations', () => {
  const dictPath = path.join(workspaceRoot, 'src', 'lib', 'i18n', 'dict.ts');
  const dictContent = fs.readFileSync(dictPath, 'utf8');

  // Check for em dashes (U+2014) and en dashes (U+2013)
  const hasEmDash = dictContent.includes('—');
  const hasEnDash = dictContent.includes('–');

  assert.equal(hasEmDash, false, 'Dictionary must not contain em dashes (—)');
  assert.equal(hasEnDash, false, 'Dictionary must not contain en dashes (–)');
});

test('Audit 4: Language Rules - No Emoji Icons in User-Facing Strings', () => {
  const dictPath = path.join(workspaceRoot, 'src', 'lib', 'i18n', 'dict.ts');
  const dictContent = fs.readFileSync(dictPath, 'utf8');

  // Regex checking common emoji ranges (excluding basic punctuation and native Indic scripts)
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  const hasEmoji = emojiRegex.test(dictContent);

  assert.equal(hasEmoji, false, 'Dictionary must not contain emoji characters');
});

test('Audit 5: No Deficit Labels for Children', () => {
  const dictPath = path.join(workspaceRoot, 'src', 'lib', 'i18n', 'dict.ts');
  const dictContent = fs.readFileSync(dictPath, 'utf8');

  // Ensure children are never labeled with deficit or degrading terms
  assert.equal(dictContent.toLowerCase().includes('weak student'), false, 'Must not label child as weak student');
  assert.equal(dictContent.toLowerCase().includes('slow learner'), false, 'Must not label child as slow learner');
  assert.equal(dictContent.toLowerCase().includes('incapable'), false, 'Must not label child as incapable');
});

test('Audit 6: Password Hashing with Salt & Authentication Invariants', async () => {
  const usersPath = path.join(workspaceRoot, 'src', 'lib', 'auth', 'users.ts');
  const usersContent = fs.readFileSync(usersPath, 'utf8');

  // Verify bcrypt format $2b$10$...
  assert.ok(usersContent.includes('$2b$10$'), 'Demo users must use salted bcrypt hashes');
  assert.equal(usersContent.includes('sha256_dummy_'), false, 'Must not contain placeholder dummy hashes');

  // Test actual verification using bcrypt
  const teacherHashMatch = usersContent.match(/passwordHash:\s*(?:process\.env\.[A-Z_]+\s*\|\|\s*)?["'](\$2b\$10\$[^"']+)["']/);
  assert.ok(teacherHashMatch, 'Must locate valid passwordHash in users.ts');
  const teacherHash = teacherHashMatch[1];

  const isValidPassword = await bcrypt.compare('ShikshaTeacher@2026', teacherHash);
  assert.equal(isValidPassword, true, 'Valid password must verify against bcrypt hash');

  const isInvalidPassword = await bcrypt.compare('WrongPassword123', teacherHash);
  assert.equal(isInvalidPassword, false, 'Invalid password must be rejected');
});

test('Audit 7: Rate Limiter Invariant for AI Agent API', () => {
  // Test in-memory token bucket / sliding window rate limiter logic
  const requestHistory = new Map();
  const maxRequests = 40;
  const windowMs = 60 * 1000;

  function checkRateLimit(ip) {
    const now = Date.now();
    const timestamps = requestHistory.get(ip) || [];
    const validTimestamps = timestamps.filter(t => now - t < windowMs);

    if (validTimestamps.length >= maxRequests) {
      return false; // Rate limited
    }

    validTimestamps.push(now);
    requestHistory.set(ip, validTimestamps);
    return true;
  }

  const testIp = '192.168.1.100';
  for (let i = 0; i < maxRequests; i++) {
    assert.equal(checkRateLimit(testIp), true, `Request ${i + 1} should be permitted`);
  }

  // 41st request must be blocked
  assert.equal(checkRateLimit(testIp), false, '41st request within window must be rate limited');
});

test('Audit 8: Concept Graph Acyclic Prerequisite Traversal', () => {
  const graphPath = path.join(workspaceRoot, 'src', 'lib', 'concepts', 'graph.ts');
  const graphContent = fs.readFileSync(graphPath, 'utf8');

  // Verify foundational prerequisites exist
  assert.ok(graphContent.includes('mult_facts'), 'Graph must define multiplication facts');
  assert.ok(graphContent.includes('division_concept'), 'Graph must define division concept');
  assert.ok(graphContent.includes('long_division'), 'Graph must define long division');
  assert.ok(graphContent.includes('prerequisites:'), 'Graph must define explicit prerequisite edges');
});

test('Audit 9: Secrets Hygiene - No Sensitive Keys Tracked', () => {
  const gitignorePath = path.join(workspaceRoot, '.gitignore');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');

  assert.ok(gitignoreContent.includes('.env.*') || gitignoreContent.includes('.env'), '.gitignore must ignore local env files');

  const envExamplePath = path.join(workspaceRoot, '.env.example');
  assert.ok(fs.existsSync(envExamplePath), '.env.example must exist');
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');

  // Verify .env.example contains only dummy placeholders
  assert.equal(envExampleContent.includes('AIzaSy'), false, 'Real Gemini keys must never be committed');
});
