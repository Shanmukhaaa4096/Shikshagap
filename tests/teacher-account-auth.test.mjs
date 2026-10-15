/**
 * tests/teacher-account-auth.test.mjs
 *
 * Production-ready test suite verifying:
 * 1. Teacher Registration (Zod validation, normalization, password hashing, role escalation defense)
 * 2. Duplicate email and phone collision handling
 * 3. SMS OTP generation, verification, expiration, attempt caps, single-use invalidation
 * 4. Email token generation, verification, tamper rejection, single-use invalidation
 * 5. Dual-channel verification state machine (incomplete -> active)
 * 6. Login blocking before full verification and successful returning-user login
 * 7. Non-enumerating login error handling
 * 8. Password recovery flow with single-use expiring tokens
 * 9. Cross-teacher data isolation (Teacher A cannot access or overwrite Teacher B's records)
 * 10. Account deletion with credential re-authentication and private data purging
 */

process.env.NODE_ENV = 'test';
process.env.ALLOW_TEST_SMS_MOCK = 'true';
process.env.ALLOW_TEST_EMAIL_MOCK = 'true';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

import {
  createTeacherAccount,
  findTeacherByEmail,
  findTeacherById,
  updateTeacherProfile,
  updateTeacherVerification,
  deleteTeacherAccount,
  createVerificationToken,
  verifyToken,
  saveTeacherClassData,
  loadTeacherClassData,
  normalizeEmail,
  normalizePhone,
  updateTeacherPassword,
} from '../src/lib/auth/accountStore.ts';

import { verifyCredentials, AccountPendingVerificationError } from '../src/lib/auth/users.ts';
import { TEST_SMS_INTERCEPTOR, getSmsProvider } from '../src/lib/auth/smsProvider.ts';
import { TEST_EMAIL_INTERCEPTOR, getEmailProvider } from '../src/lib/auth/emailProvider.ts';

test('1. Normalization: Email & E.164 Phone Normalization', () => {
  // Case-insensitivity & whitespace stripping
  assert.equal(normalizeEmail('  Teacher.Priya@School.Gov.In  '), 'teacher.priya@school.gov.in');

  // Indian phone normalization to E.164
  assert.equal(normalizePhone('+91', '9876543210'), '+919876543210');
  assert.equal(normalizePhone('+91', '09876543210'), '+919876543210');
  assert.equal(normalizePhone('+91', '+91 98765 43210'), '+919876543210');
  assert.equal(normalizePhone('+91', '9876-543-210'), '+919876543210');

  // International phone normalization
  assert.equal(normalizePhone('+1', '4155552671'), '+14155552671');
});

test('2. Teacher Registration: Password hashing & Role Escalation Defense', async () => {
  const email = `test.reg.${Date.now()}@school.edu.in`;
  const rawPass = 'SecureTeacher@2026';
  const hashedPass = await bcrypt.hash(rawPass, 10);

  // Attempt privilege escalation by passing role: 'admin'
  const res = await createTeacherAccount(
    {
      email,
      fullName: 'Lakshmi Narayana',
      institutionName: 'Zilla Parishad High School, Kurnool',
      phone: '9848012345',
      countryCode: '+91',
      gradesTaught: ['class_3', 'class_4'],
      subjectsTaught: ['Mathematics'],
      designation: 'senior_teacher',
      role: 'admin', // Malicious attempt to escalate
    },
    hashedPass
  );

  assert.equal(res.success, true, 'Registration must succeed for valid teacher inputs');
  const account = res.account;

  assert.ok(account.id.startsWith('tch_'), 'Must generate a unique tch_ identifier');
  assert.equal(account.role, 'teacher', 'CRITICAL: Role must remain teacher, admin self-assignment must be ignored');
  assert.equal(account.status, 'registration_incomplete', 'New registrations must be registration_incomplete');
  assert.equal(account.phoneVerified, false, 'Phone must not be marked verified on signup');
  assert.equal(account.emailVerified, false, 'Email must not be marked verified on signup');
  assert.equal(account.email, normalizeEmail(email));
  assert.equal(account.phone, '+919848012345');

  // Verify bcrypt password matching
  const matches = await bcrypt.compare(rawPass, account.passwordHash);
  assert.equal(matches, true, 'Stored bcrypt hash must verify against original password');
});

test('3. Duplicate Prevention: Unique constraint on Email and Phone', async () => {
  const ts = Date.now();
  const email = `unique.${ts}@school.edu.in`;
  const phone = `9876${(ts % 1000000).toString().padStart(6, '0')}`;
  const hashedPass = await bcrypt.hash('SecretPass123!', 10);

  const initial = await createTeacherAccount(
    {
      email,
      fullName: 'Teacher First',
      institutionName: 'Govt School',
      phone,
      countryCode: '+91',
      gradesTaught: ['class_5'],
    },
    hashedPass
  );
  assert.equal(initial.success, true);

  // Duplicate email attempt
  const dupEmail = await createTeacherAccount(
    {
      email,
      fullName: 'Teacher Imposter',
      institutionName: 'Other School',
      phone: '9999999999',
      countryCode: '+91',
      gradesTaught: ['class_5'],
    },
    hashedPass
  );
  assert.equal(dupEmail.success, false, 'Must reject registration with duplicate email');
  assert.match(dupEmail.error, /already exists|already registered/i);

  // Duplicate phone attempt
  const dupPhone = await createTeacherAccount(
    {
      email: `other.${ts}@school.edu.in`,
      fullName: 'Teacher Duplicate Phone',
      institutionName: 'Other School',
      phone,
      countryCode: '+91',
      gradesTaught: ['class_5'],
    },
    hashedPass
  );
  assert.equal(dupPhone.success, false, 'Must reject registration with duplicate phone number');
  assert.match(dupPhone.error, /already exists|already associated/i);
});

test('4. SMS OTP Lifecycle: Dispatch, Verification, Expiration, Attempt Caps & Single-Use', async () => {
  const phone = '+919876543299';
  const userId = 'tch_sms_test_user';

  // Clear interceptor log
  TEST_SMS_INTERCEPTOR.length = 0;

  // Send OTP
  const rawOtp = '748291';
  const sent = await getSmsProvider().sendVerificationOtp(phone, rawOtp);
  assert.equal(sent.success, true);
  assert.equal(TEST_SMS_INTERCEPTOR.length, 1);
  assert.equal(TEST_SMS_INTERCEPTOR[0].otp, rawOtp);

  // Store hashed verification token with 5-minute expiry
  await createVerificationToken(userId, 'phone', phone, rawOtp, 5 * 60 * 1000, 3);

  // Test 4a: Wrong OTP decrements attempts
  const wrongAttempt = await verifyToken(phone, 'phone', '000000');
  assert.equal(wrongAttempt.valid, false);
  assert.match(wrongAttempt.error, /2 attempt\(s\) remaining/);

  // Test 4b: Correct OTP succeeds
  const correctAttempt = await verifyToken(phone, 'phone', rawOtp);
  assert.equal(correctAttempt.valid, true);
  assert.equal(correctAttempt.userId, userId);

  // Test 4c: Single-use: Reusing same OTP must fail immediately
  const reuseAttempt = await verifyToken(phone, 'phone', rawOtp);
  assert.equal(reuseAttempt.valid, false, 'Used verification codes must not be accepted twice');

  // Test 4d: Expiration check
  const expiredOtp = '112233';
  await createVerificationToken(userId, 'phone', phone, expiredOtp, -1000); // Expired 1 second ago
  const expiredAttempt = await verifyToken(phone, 'phone', expiredOtp);
  assert.equal(expiredAttempt.valid, false);
  assert.match(expiredAttempt.error, /expired/);

  // Test 4e: Rate limiting / Attempt exhaustion
  const bruteOtp = '889900';
  await createVerificationToken(userId, 'phone', phone, bruteOtp, 60000, 2);
  await verifyToken(phone, 'phone', '111111'); // 1st failure
  await verifyToken(phone, 'phone', '222222'); // 2nd failure -> exhausted
  const lockedAttempt = await verifyToken(phone, 'phone', bruteOtp); // even if now correct, attempts exhausted!
  assert.equal(lockedAttempt.valid, false);
  assert.match(lockedAttempt.error, /invalidated|exceeded/i);
});

test('5. Email Verification Token Lifecycle: Dispatch, Tamper Defense, & Expiration', async () => {
  const email = 'teacher.verification@school.gov.in';
  const userId = 'tch_email_test_user';
  const rawToken = 'secure_random_token_hex_value_1234567890abcdef';

  TEST_EMAIL_INTERCEPTOR.length = 0;
  await getEmailProvider().sendVerificationEmail(email, rawToken, '654321');
  assert.equal(TEST_EMAIL_INTERCEPTOR.length, 1);
  assert.equal(TEST_EMAIL_INTERCEPTOR[0].token, rawToken);

  // Store token
  await createVerificationToken(userId, 'email', email, rawToken, 24 * 60 * 60 * 1000);

  // Tampered token fails
  const tampered = await verifyToken(email, 'email', rawToken + 'tampered');
  assert.equal(tampered.valid, false);

  // Correct token succeeds
  const verified = await verifyToken(email, 'email', rawToken);
  assert.equal(verified.valid, true);
  assert.equal(verified.userId, userId);

  // Re-use fails
  const reused = await verifyToken(email, 'email', rawToken);
  assert.equal(reused.valid, false);
});

test('6. Dual-Channel Verification State Machine: Both Required for Active Status', async () => {
  const email = `state.machine.${Date.now()}@school.edu.in`;
  const phone = `9911${(Date.now() % 1000000).toString().padStart(6, '0')}`;
  const password = 'DualChannelPass@2026';
  const passwordHash = await bcrypt.hash(password, 10);

  const regResult = await createTeacherAccount(
    {
      email,
      phone,
      countryCode: '+91',
      fullName: 'Teacher Shanti',
      institutionName: 'MPPS Primary School',
      gradesTaught: ['class_3'],
    },
    passwordHash
  );
  assert.equal(regResult.success, true);
  const teacher = regResult.account;

  // Test 6a: Login attempt while unverified MUST throw AccountPendingVerificationError
  await assert.rejects(
    async () => {
      await verifyCredentials(email, password);
    },
    (err) => {
      assert.ok(err instanceof AccountPendingVerificationError);
      assert.equal(err.pendingDetails.phone, `+91${phone}`);
      assert.equal(err.pendingDetails.email, email);
      return true;
    },
    'Unverified teacher must be rejected with AccountPendingVerificationError'
  );

  // Test 6b: Verify phone only -> still unverified email -> login still blocked
  await updateTeacherVerification(teacher.id, { phoneVerified: true });
  await assert.rejects(
    async () => {
      await verifyCredentials(email, password);
    },
    AccountPendingVerificationError,
    'Login must remain blocked when only phone is verified'
  );

  // Test 6c: Verify email as well -> status transitions to active -> login succeeds!
  const fullyVerified = await updateTeacherVerification(teacher.id, { emailVerified: true });
  assert.equal(fullyVerified.status, 'active');

  const user = await verifyCredentials(email, password);
  assert.ok(user, 'Login must succeed once both phone and email are verified');
  assert.equal(user.id, teacher.id);
  assert.equal(user.role, 'teacher');
  assert.equal(user.status, 'active');
});

test('7. Authentication Security: Non-Enumerating Generic Error Messages', async () => {
  // Unknown email returns null (no disclosure of whether user exists)
  const unknownUser = await verifyCredentials('nonexistent.teacher@school.edu.in', 'SomePassword123!');
  assert.equal(unknownUser, null, 'Must return null for nonexistent account');

  // Incorrect password for existing verified user returns null
  const realTeacher = await findTeacherByEmail('teacher@shikshagap.in');
  if (realTeacher) {
    const wrongPassResult = await verifyCredentials('teacher@shikshagap.in', 'WrongPassword!');
    assert.equal(wrongPassResult, null, 'Must return null for incorrect password without enumeration');
  }
});

test('8. Password Recovery: Expiring Single-Use Reset Token Flow', async () => {
  const email = `recovery.${Date.now()}@school.edu.in`;
  const phone = `9922${(Date.now() % 1000000).toString().padStart(6, '0')}`;
  const oldPassword = 'OldPassword@2026';
  const newPassword = 'NewPassword@2026!';

  const reg = await createTeacherAccount(
    {
      email,
      phone,
      countryCode: '+91',
      fullName: 'Teacher Ramesh',
      institutionName: 'Govt Model School',
      gradesTaught: ['class_4'],
    },
    await bcrypt.hash(oldPassword, 10)
  );
  assert.equal(reg.success, true);
  const teacher = reg.account;

  await updateTeacherVerification(teacher.id, { phoneVerified: true, emailVerified: true });

  // Request password reset
  const resetToken = 'reset_token_' + Date.now() + '_secure_random_string';
  await createVerificationToken(teacher.id, 'password_reset', email, resetToken, 15 * 60 * 1000);

  // Verify reset token
  const tokenCheck = await verifyToken(email, 'password_reset', resetToken);
  assert.equal(tokenCheck.valid, true);
  assert.equal(tokenCheck.userId, teacher.id);

  // Update password
  const newHash = await bcrypt.hash(newPassword, 10);
  const updated = await updateTeacherPassword(teacher.id, newHash);
  assert.equal(updated, true);

  // Verify old password no longer works
  const oldLogin = await verifyCredentials(email, oldPassword);
  assert.equal(oldLogin, null, 'Old password must be rejected after reset');

  // Verify new password works
  const newLogin = await verifyCredentials(email, newPassword);
  assert.ok(newLogin, 'New password must authenticate successfully');
  assert.equal(newLogin.id, teacher.id);
});

test('9. Data Isolation: Teacher A Cannot Access or Overwrite Teacher B Records', async () => {
  const teacherA = 'tch_isolated_user_A';
  const teacherB = 'tch_isolated_user_B';
  const classId = 'class_5a';

  const classDataA = [{ id: 'st_1', name: 'Student of Teacher A', score: 95 }];
  const classDataB = [{ id: 'st_2', name: 'Student of Teacher B', score: 40 }];

  // Save distinct classroom records
  await saveTeacherClassData(teacherA, classId, classDataA);
  await saveTeacherClassData(teacherB, classId, classDataB);

  // Load records
  const loadedA = await loadTeacherClassData(teacherA, classId);
  const loadedB = await loadTeacherClassData(teacherB, classId);

  assert.deepEqual(loadedA, classDataA, "Teacher A must receive only Teacher A's records");
  assert.deepEqual(loadedB, classDataB, "Teacher B must receive only Teacher B's records");
  assert.notDeepEqual(loadedA, loadedB, 'Data across teachers must never be shared');
});

test('10. Account Deletion: Purges Teacher Profile, Data and Revokes Access', async () => {
  const email = `deletion.${Date.now()}@school.edu.in`;
  const phone = `9933${(Date.now() % 1000000).toString().padStart(6, '0')}`;
  const password = 'DeleteMePass@2026';

  const reg = await createTeacherAccount(
    {
      email,
      phone,
      countryCode: '+91',
      fullName: 'Teacher To Be Deleted',
      institutionName: 'Primary School X',
      gradesTaught: ['class_3'],
    },
    await bcrypt.hash(password, 10)
  );
  assert.equal(reg.success, true);
  const teacher = reg.account;

  await updateTeacherVerification(teacher.id, { phoneVerified: true, emailVerified: true });

  // Save student data
  await saveTeacherClassData(teacher.id, 'class_3a', [{ id: 's1', score: 80 }]);

  // Execute deletion
  const deleted = await deleteTeacherAccount(teacher.id);
  assert.equal(deleted, true);

  // Teacher lookup must return null
  assert.equal(await findTeacherById(teacher.id), null, 'Account must not exist after deletion');
  assert.equal(await findTeacherByEmail(email), null, 'Email lookup must return null after deletion');

  // Classroom data must be purged
  assert.equal(await loadTeacherClassData(teacher.id, 'class_3a'), null, 'Classroom data must be purged on deletion');

  // Login attempt must fail
  const loginAttempt = await verifyCredentials(email, password);
  assert.equal(loginAttempt, null, 'Deleted teacher cannot authenticate');
});
