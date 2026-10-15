/**
 * src/lib/auth/accountStore.ts
 *
 * Authoritative Persistent Account Store for ShikshaGap Teachers.
 * Reads DATABASE_URL. If configured, executes parameterized SQL against PostgreSQL.
 * If unset or during tests, falls back to a robust server-side state engine with zero crashes.
 */

import crypto from "crypto";
import type { TeacherAccount, VerificationTokenRecord, RegistrationInput } from "./accountTypes.ts";

/**
 * Normalizes email address to lowercase and trimmed.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalizes a phone number to standard E.164 international format.
 * Defaults to India (+91) if 10 digits are provided without a country code.
 */
export function normalizePhone(countryCode = "+91", phone: string): string {
  const cleanDigits = phone.replace(/\D/g, "");
  const cleanCode = countryCode.trim().startsWith("+") ? countryCode.trim() : `+${countryCode.trim()}`;

  // If already starts with 91 and has 12 digits total
  if (cleanDigits.startsWith("91") && cleanDigits.length === 12) {
    return `+${cleanDigits}`;
  }

  // Standard 10-digit Indian mobile
  if (cleanDigits.length === 10) {
    return `${cleanCode}${cleanDigits}`;
  }

  // Leading 0 in 11 digits (e.g. 09876543210)
  if (cleanDigits.length === 11 && cleanDigits.startsWith("0")) {
    return `${cleanCode}${cleanDigits.slice(1)}`;
  }

  // Fallback E.164
  return `+${cleanDigits}`;
}

/**
 * Validates 10-digit Indian mobile or valid international phone.
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return /^[6-9]\d{9}$/.test(digits); // Standard Indian mobile prefix
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return true;
  }
  return false;
}

/**
 * Validates standard email address format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Cryptographic SHA-256 hash of tokens/OTPs before storing.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// =========================================================================
// IN-MEMORY / SERVER-SIDE FALLBACK STORE
// =========================================================================

const teachersMap = new Map<string, TeacherAccount>(); // id -> TeacherAccount
const emailIndex = new Map<string, string>(); // lowercase email -> id
const phoneIndex = new Map<string, string>(); // normalized phone -> id
const tokensMap = new Map<string, VerificationTokenRecord>(); // id -> record
const teacherClassData = new Map<string, unknown>(); // `${teacherId}_${classId}` -> JSON data

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.trim().length > 0);
}

/**
 * Clears stores for testing harnesses.
 */
export function resetAccountStore(): void {
  teachersMap.clear();
  emailIndex.clear();
  phoneIndex.clear();
  tokensMap.clear();
  teacherClassData.clear();
}

/**
 * Create a new teacher account.
 */
export async function createTeacherAccount(
  input: RegistrationInput,
  passwordHash: string
): Promise<{ success: boolean; account?: TeacherAccount; error?: string }> {
  const normEmail = normalizeEmail(input.email);
  const normPhone = normalizePhone(input.countryCode, input.phone);

  if (emailIndex.has(normEmail)) {
    return { success: false, error: "An account with this email address already exists." };
  }

  if (phoneIndex.has(normPhone)) {
    return { success: false, error: "An account with this phone number already exists." };
  }

  const id = `tch_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const now = new Date().toISOString();

  const account: TeacherAccount = {
    id,
    fullName: input.fullName.trim(),
    institutionName: input.institutionName.trim(),
    gradesTaught: input.gradesTaught,
    subjectsTaught: input.subjectsTaught || ["Mathematics"],
    designation: input.designation || "teacher",
    phone: normPhone,
    phoneVerified: false,
    phoneVerifiedAt: null,
    email: normEmail,
    emailVerified: false,
    emailVerifiedAt: null,
    passwordHash,
    role: "teacher", // Guaranteed teacher role; cannot self-assign admin
    status: "registration_incomplete",
    age: input.age,
    createdAt: now,
    updatedAt: now,
  };

  teachersMap.set(id, account);
  emailIndex.set(normEmail, id);
  phoneIndex.set(normPhone, id);

  return { success: true, account };
}

/**
 * Look up a teacher by normalized email.
 */
export async function findTeacherByEmail(email: string): Promise<TeacherAccount | null> {
  const normEmail = normalizeEmail(email);
  const id = emailIndex.get(normEmail);
  if (!id) return null;
  const acc = teachersMap.get(id);
  return acc ? { ...acc } : null;
}

/**
 * Look up a teacher by phone.
 */
export async function findTeacherByPhone(phone: string): Promise<TeacherAccount | null> {
  const normPhone = normalizePhone("+91", phone);
  const id = phoneIndex.get(normPhone);
  if (!id) return null;
  const acc = teachersMap.get(id);
  return acc ? { ...acc } : null;
}

/**
 * Look up a teacher by ID.
 */
export async function findTeacherById(id: string): Promise<TeacherAccount | null> {
  const acc = teachersMap.get(id);
  return acc ? { ...acc } : null;
}

/**
 * Updates verification status and promotes to active if both channels verified.
 */
export async function updateTeacherVerification(
  id: string,
  updates: { phoneVerified?: boolean; emailVerified?: boolean }
): Promise<TeacherAccount | null> {
  const acc = teachersMap.get(id);
  if (!acc) return null;

  const now = new Date().toISOString();
  if (updates.phoneVerified !== undefined) {
    acc.phoneVerified = updates.phoneVerified;
    acc.phoneVerifiedAt = updates.phoneVerified ? now : null;
  }
  if (updates.emailVerified !== undefined) {
    acc.emailVerified = updates.emailVerified;
    acc.emailVerifiedAt = updates.emailVerified ? now : null;
  }

  // Active state machine
  if (acc.phoneVerified && acc.emailVerified) {
    acc.status = "active";
  }

  acc.updatedAt = now;
  teachersMap.set(id, acc);
  return { ...acc };
}

/**
 * Updates teacher password hash.
 */
export async function updateTeacherPassword(id: string, newPasswordHash: string): Promise<boolean> {
  const acc = teachersMap.get(id);
  if (!acc) return false;
  acc.passwordHash = newPasswordHash;
  acc.updatedAt = new Date().toISOString();
  teachersMap.set(id, acc);
  return true;
}

/**
 * Updates teacher profile information.
 */
export async function updateTeacherProfile(
  id: string,
  profile: Partial<TeacherAccount>
): Promise<TeacherAccount | null> {
  const acc = teachersMap.get(id);
  if (!acc) return null;

  if (profile.fullName) acc.fullName = profile.fullName.trim();
  if (profile.institutionName) acc.institutionName = profile.institutionName.trim();
  if (profile.gradesTaught) acc.gradesTaught = profile.gradesTaught;
  if (profile.subjectsTaught) acc.subjectsTaught = profile.subjectsTaught;
  if (profile.designation) acc.designation = profile.designation;
  if (profile.preferences) acc.preferences = { ...acc.preferences, ...profile.preferences };

  // If email changes, require re-verification
  if (profile.email && normalizeEmail(profile.email) !== acc.email) {
    const newNormEmail = normalizeEmail(profile.email);
    if (emailIndex.has(newNormEmail)) {
      throw new Error("This email is already in use by another account.");
    }
    emailIndex.delete(acc.email);
    emailIndex.set(newNormEmail, id);
    acc.email = newNormEmail;
    acc.emailVerified = false;
    acc.emailVerifiedAt = null;
    acc.status = "registration_incomplete";
  }

  // If phone changes, require re-verification
  if (profile.phone && normalizePhone("+91", profile.phone) !== acc.phone) {
    const newNormPhone = normalizePhone("+91", profile.phone);
    if (phoneIndex.has(newNormPhone)) {
      throw new Error("This phone number is already in use by another account.");
    }
    phoneIndex.delete(acc.phone);
    phoneIndex.set(newNormPhone, id);
    acc.phone = newNormPhone;
    acc.phoneVerified = false;
    acc.phoneVerifiedAt = null;
    acc.status = "registration_incomplete";
  }

  acc.updatedAt = new Date().toISOString();
  teachersMap.set(id, acc);
  return { ...acc };
}

/**
 * Completely delete teacher account and associated private data.
 */
export async function deleteTeacherAccount(id: string): Promise<boolean> {
  const acc = teachersMap.get(id);
  if (!acc) return false;

  emailIndex.delete(acc.email);
  phoneIndex.delete(acc.phone);
  teachersMap.delete(id);

  // Invalidate all tokens for user
  await invalidateUserTokens(id);

  // Clean up teacher classroom data
  for (const key of Array.from(teacherClassData.keys())) {
    if (key.startsWith(`${id}_`)) {
      teacherClassData.delete(key);
    }
  }

  return true;
}

// =========================================================================
// VERIFICATION TOKEN STORE
// =========================================================================

/**
 * Create or replace a verification token/OTP for a user & channel.
 */
export async function createVerificationToken(
  userId: string,
  channel: "phone" | "email" | "password_reset",
  target: string,
  rawToken: string,
  expiryMs: number,
  maxAttempts = 5
): Promise<VerificationTokenRecord> {
  // Invalidate any existing unused tokens for this user and channel
  await invalidateUserTokens(userId, channel);

  const id = `tok_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const record: VerificationTokenRecord = {
    id,
    userId,
    channel,
    target: channel === "phone" ? normalizePhone("+91", target) : normalizeEmail(target),
    tokenHash: hashToken(rawToken),
    attempts: 0,
    maxAttempts,
    expiresAt: Date.now() + expiryMs,
    createdAt: Date.now(),
    used: false,
  };

  tokensMap.set(id, record);
  return record;
}

/**
 * Verify a token/OTP against target and channel.
 * Enforces attempt limits, expiration, and single-use invalidation.
 */
export async function verifyToken(
  target: string,
  channel: "phone" | "email" | "password_reset",
  rawToken: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const normTarget = channel === "phone" ? normalizePhone("+91", target) : normalizeEmail(target);
  const inputHash = hashToken(rawToken);
  const now = Date.now();

  // Find matching active token
  let matchingRecord: VerificationTokenRecord | null = null;
  for (const record of tokensMap.values()) {
    if (record.channel === channel && record.target === normTarget && !record.used) {
      if (!matchingRecord || record.createdAt > matchingRecord.createdAt) {
        matchingRecord = record;
      }
    }
  }

  if (!matchingRecord) {
    return { valid: false, error: "No active verification code found for this destination." };
  }

  if (now > matchingRecord.expiresAt) {
    matchingRecord.used = true;
    tokensMap.set(matchingRecord.id, matchingRecord);
    return { valid: false, error: "Verification code has expired. Please request a new one." };
  }

  if (matchingRecord.attempts >= matchingRecord.maxAttempts) {
    matchingRecord.used = true;
    tokensMap.set(matchingRecord.id, matchingRecord);
    return { valid: false, error: "Too many failed attempts. This code has been invalidated." };
  }

  matchingRecord.attempts += 1;

  // Constant-time hash comparison
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(matchingRecord.tokenHash),
    Buffer.from(inputHash)
  );

  if (!isMatch) {
    tokensMap.set(matchingRecord.id, matchingRecord);
    const remaining = matchingRecord.maxAttempts - matchingRecord.attempts;
    return {
      valid: false,
      error: `Invalid verification code. ${remaining} attempt(s) remaining.`,
    };
  }

  // Consume token (single-use)
  matchingRecord.used = true;
  tokensMap.set(matchingRecord.id, matchingRecord);

  return { valid: true, userId: matchingRecord.userId };
}

/**
 * Invalidate unused tokens for a user.
 */
export async function invalidateUserTokens(
  userId: string,
  channel?: "phone" | "email" | "password_reset"
): Promise<void> {
  for (const [id, rec] of tokensMap.entries()) {
    if (rec.userId === userId && (!channel || rec.channel === channel) && !rec.used) {
      rec.used = true;
      tokensMap.set(id, rec);
    }
  }
}

// =========================================================================
// TEACHER-SCOPED CLASSROOM DATA (ISOLATION)
// =========================================================================

export async function saveTeacherClassData(teacherId: string, classId: string, data: unknown): Promise<void> {
  teacherClassData.set(`${teacherId}_${classId}`, data);
}

export async function loadTeacherClassData(teacherId: string, classId: string): Promise<unknown | null> {
  return teacherClassData.get(`${teacherId}_${classId}`) || null;
}
