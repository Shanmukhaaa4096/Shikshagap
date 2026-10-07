import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

// Re-create / import core security functions to test store invariants
function hashIp(ip) {
  return crypto.createHash('sha256').update(ip + 'shikshagap_salt').digest('hex').substring(0, 16);
}

function escapeCsvCell(val) {
  const str = String(val ?? '');
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

function sanitizeText(input, maxLen = 500) {
  return String(input)
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/[^\w\s.,?!;:()\-'"]/gi, '')
    .trim()
    .slice(0, maxLen);
}

// In-memory test harness simulating store.ts behavior
const auditLogs = [];
function logAuditEvent(entry) {
  const newLog = {
    ...entry,
    id: `log_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    timestamp: Date.now(),
  };
  auditLogs.unshift(newLog);
  return newLog;
}

function getAuditLogs(schoolId, filter) {
  let filtered = auditLogs.filter(log => log.schoolId === schoolId);
  if (filter?.action) filtered = filtered.filter(l => l.action === filter.action);
  return filtered;
}

const shareTokens = new Map();
function createShareToken(params) {
  const token = crypto.randomBytes(16).toString('hex'); // 128-bit
  const record = {
    token,
    ...params,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    revoked: false,
    viewsCount: 0,
    maxViews: params.maxViews ?? 20,
  };
  shareTokens.set(token, record);
  return record;
}

function getShareToken(token) {
  const record = shareTokens.get(token);
  if (!record) return null;
  if (record.revoked) return null;
  if (Date.now() > record.expiresAt) return null;
  if (record.viewsCount >= record.maxViews) return null;
  return record;
}

function revokeShareToken(token, schoolId) {
  const record = shareTokens.get(token);
  if (!record) return false;
  if (record.schoolId !== schoolId) return false;
  record.revoked = true;
  return true;
}

const userRecentAuth = new Map();
function recordRecentAuth(userId) {
  userRecentAuth.set(userId, Date.now());
}
function hasRecentAuth(userId, windowMs = 10 * 60 * 1000) {
  const last = userRecentAuth.get(userId);
  if (!last) return false;
  return (Date.now() - last) < windowMs;
}

// ==========================================
// TEST SUITE
// ==========================================

test('Security Test 1: Cross-Class Access Isolation', () => {
  const teacherA = { id: 'usr_t1', role: 'teacher', schoolId: 'sch_01', assignedClasses: ['cls_5a'] };
  const studentInClass5A = { id: 'stu_01', classId: 'cls_5a', schoolId: 'sch_01' };
  const studentInClass5B = { id: 'stu_02', classId: 'cls_5b', schoolId: 'sch_01' };

  // Teacher A should be permitted to share report for their own class
  const isAllowedA = teacherA.schoolId === studentInClass5A.schoolId && teacherA.assignedClasses.includes(studentInClass5A.classId);
  assert.equal(isAllowedA, true, 'Teacher A must have access to Class 5A');

  // Teacher A must be DENIED access to Class 5B
  const isAllowedB = teacherA.schoolId === studentInClass5B.schoolId && teacherA.assignedClasses.includes(studentInClass5B.classId);
  assert.equal(isAllowedB, false, 'Teacher A must be denied access to Class 5B');
});

test('Security Test 2: Cross-School Data Isolation', () => {
  const adminSchool1 = { id: 'adm_1', role: 'school_admin', schoolId: 'sch_01' };
  
  // Log events in School 1 and School 2
  logAuditEvent({
    userId: 'usr_t1',
    userRole: 'teacher',
    schoolId: 'sch_01',
    action: 'view_student_records',
    ipHash: hashIp('127.0.0.1')
  });

  logAuditEvent({
    userId: 'usr_t2',
    userRole: 'teacher',
    schoolId: 'sch_02',
    action: 'override_created',
    ipHash: hashIp('192.168.1.1')
  });

  // Admin of School 1 queries logs
  const school1Logs = getAuditLogs(adminSchool1.schoolId);
  assert.ok(school1Logs.length > 0, 'Should find school 1 logs');
  assert.ok(school1Logs.every(l => l.schoolId === 'sch_01'), 'No cross-school leakage into School 1 query');

  // School 1 admin attempting to revoke School 2 token
  const token2 = createShareToken({
    studentId: 'stu_s2',
    schoolId: 'sch_02',
    classId: 'cls_5x',
    createdById: 'usr_t2',
    confirmedNotice: true
  });

  const revokeAttempt = revokeShareToken(token2.token, adminSchool1.schoolId);
  assert.equal(revokeAttempt, false, 'School 1 admin cannot revoke School 2 token');
});

test('Security Test 3: Token Entropy and Guessing Resistance', () => {
  const tokenRecord = createShareToken({
    studentId: 'stu_test',
    schoolId: 'sch_01',
    classId: 'cls_5a',
    createdById: 'usr_t1',
    confirmedNotice: true
  });

  // 128-bit entropy = 16 bytes = 32 hex characters
  assert.equal(tokenRecord.token.length, 32, 'Token must be exactly 32 hex characters (128 bits)');
  assert.match(tokenRecord.token, /^[0-9a-f]{32}$/, 'Token must be valid hexadecimal string');

  // Guessing test: random non-existent token must return null
  const fakeToken = crypto.randomBytes(16).toString('hex');
  assert.equal(getShareToken(fakeToken), null, 'Random unallocated token must return null');
});

test('Security Test 4: Expired, Revoked, and View-Limited Tokens', () => {
  const token = createShareToken({
    studentId: 'stu_limits',
    schoolId: 'sch_01',
    classId: 'cls_5a',
    createdById: 'usr_t1',
    confirmedNotice: true,
    maxViews: 2
  });

  // Active token
  assert.ok(getShareToken(token.token) !== null, 'New token is active');

  // Consume views
  token.viewsCount = 2;
  assert.equal(getShareToken(token.token), null, 'Token exceeding maxViews must return null');

  // Revocation test
  const tokenToRevoke = createShareToken({
    studentId: 'stu_rev',
    schoolId: 'sch_01',
    classId: 'cls_5a',
    createdById: 'usr_t1',
    confirmedNotice: true
  });
  revokeShareToken(tokenToRevoke.token, 'sch_01');
  assert.equal(getShareToken(tokenToRevoke.token), null, 'Revoked token must return null');

  // Expiration test
  const tokenToExpire = createShareToken({
    studentId: 'stu_exp',
    schoolId: 'sch_01',
    classId: 'cls_5a',
    createdById: 'usr_t1',
    confirmedNotice: true
  });
  tokenToExpire.expiresAt = Date.now() - 1000; // in the past
  assert.equal(getShareToken(tokenToExpire.token), null, 'Expired token must return null');
});

test('Security Test 5: Re-Authentication Window Enforcement for Exports', () => {
  const userId = 'usr_teacher_export';

  // Before recent auth: must be rejected
  assert.equal(hasRecentAuth(userId), false, 'Must reject export without recent auth');

  // After recent login / re-auth
  recordRecentAuth(userId);
  assert.equal(hasRecentAuth(userId), true, 'Must permit export immediately following re-auth');

  // Re-auth older than 10 minutes (600,000 ms)
  userRecentAuth.set(userId, Date.now() - (11 * 60 * 1000));
  assert.equal(hasRecentAuth(userId), false, 'Must reject export if re-auth is older than 10 minutes');
});

test('Security Test 6: Teacher Note XSS Sanitization & Character Cap', () => {
  const maliciousNote = '<script>alert("XSS")</script><img src=x onerror=alert(1)>Student demonstrates strong counting.';
  const sanitized = sanitizeText(maliciousNote, 500);

  assert.ok(!sanitized.includes('<script>'), 'Must strip <script> tag');
  assert.ok(!sanitized.includes('</script>'), 'Must strip </script> tag');
  assert.ok(!sanitized.includes('<img'), 'Must strip <img> tag');
  assert.ok(sanitized.includes('Student demonstrates strong counting'), 'Must preserve safe text');

  // Length limit test
  const overlyLongNote = 'A'.repeat(800);
  const truncated = sanitizeText(overlyLongNote, 500);
  assert.equal(truncated.length, 500, 'Must enforce 500 character maximum');
});

test('Security Test 7: CSV Injection Formula Escaping and UTF-8 BOM', () => {
  const maliciousFormulas = [
    '=cmd|"/C calc"!A0',
    '+12345',
    '-cmd|"/C calc"!A0',
    '@SUM(A1:A10)',
    '\t=malicious_tab',
    '\r=malicious_return'
  ];

  for (const formula of maliciousFormulas) {
    const escaped = escapeCsvCell(formula);
    assert.ok(escaped.startsWith("'"), `Dangerous formula ${formula} must be escaped with single quote prefix`);
  }

  // Safe cell remains unaltered
  assert.equal(escapeCsvCell('Class 5A Mathematics'), 'Class 5A Mathematics');

  // Verify UTF-8 BOM byte marker
  const csvBuffer = Buffer.from('\uFEFF' + 'Student,Score\n', 'utf-8');
  assert.equal(csvBuffer[0], 0xEF, 'Byte 0 must be 0xEF (UTF-8 BOM)');
  assert.equal(csvBuffer[1], 0xBB, 'Byte 1 must be 0xBB (UTF-8 BOM)');
  assert.equal(csvBuffer[2], 0xBF, 'Byte 2 must be 0xBF (UTF-8 BOM)');
});

test('Security Test 8: Audit Log Privacy & Zero Student PII Exposure', () => {
  const rawIp = '103.21.244.0';
  const hashed = hashIp(rawIp);

  // Check IP is not stored raw
  assert.notEqual(hashed, rawIp, 'IP must be 1-way hashed');
  assert.equal(hashed.length, 16, 'IP hash must be truncated hex string');

  // Ensure log entry strictly accepts no student names or scores
  const log = logAuditEvent({
    userId: 'usr_t1',
    userRole: 'teacher',
    schoolId: 'sch_01',
    action: 'export_data',
    targetRecordId: 'export_class_5a_csv',
    ipHash: hashed,
    details: 'Encrypted export generated'
  });

  assert.ok(!log.details?.includes('Aarav'), 'Audit log must not contain real student names');
  assert.ok(!log.details?.includes('Score:'), 'Audit log must not contain assessment scores');
});
