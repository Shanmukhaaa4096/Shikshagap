import bcrypt from "bcryptjs";
import type { AuthUser } from "./types";

interface StoredUser extends AuthUser {
  passwordHash?: string;
}

// In a full production deployment with an external DB, these would come from PostgreSQL / Supabase
// In production (NODE_ENV=production) demo login works ONLY if DEMO_TEACHER_PASSWORD / DEMO_ADMIN_PASSWORD
// or DEMO_TEACHER_HASH / DEMO_ADMIN_HASH are explicitly provided in environment variables.
const USERS: StoredUser[] = [
  {
    id: "usr_teacher_1",
    email: "teacher@shikshagap.in",
    name: "Smt. Lakshmi Devi",
    role: "teacher",
    schoolId: "sch_mpps_rampur",
    classId: "class_5a",
    passwordHash: process.env.DEMO_TEACHER_HASH || "$2b$10$gpdgL818eby42wLrinnq6.8Z1ZNnmzVFI3Lc0QHxljk4oG3ds5YC.",
  },
  {
    id: "usr_admin_1",
    email: "admin@shikshagap.in",
    name: "Headmaster K. Rao",
    role: "school_admin",
    schoolId: "sch_mpps_rampur",
    passwordHash: process.env.DEMO_ADMIN_HASH || "$2b$10$ifEVNWAd2Xqi3TbPhPhPDuJjUQqp9ut4KXUSerTkTQ/jfjsQzUm4G",
  },
];

function getDemoPassword(email: string): string | undefined {
  const normalized = email.toLowerCase().trim();
  if (normalized === "teacher@shikshagap.in") {
    return process.env.DEMO_TEACHER_PASSWORD || undefined;
  }
  if (normalized === "admin@shikshagap.in") {
    return process.env.DEMO_ADMIN_PASSWORD || undefined;
  }
  return undefined;
}

export function isDemoLoginDisabled(email: string): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === "teacher@shikshagap.in") {
    return !process.env.DEMO_TEACHER_PASSWORD && !process.env.DEMO_TEACHER_HASH;
  }
  if (normalized === "admin@shikshagap.in") {
    return !process.env.DEMO_ADMIN_PASSWORD && !process.env.DEMO_ADMIN_HASH;
  }
  return false;
}

let hasLoggedWarning = false;
function checkDemoConfigNotice(): void {
  if (hasLoggedWarning) return;
  const isProd = process.env.NODE_ENV === "production";
  const hasTeacherConfig = Boolean(process.env.DEMO_TEACHER_PASSWORD || process.env.DEMO_TEACHER_HASH);
  const hasAdminConfig = Boolean(process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_ADMIN_HASH);

  if (isProd && (!hasTeacherConfig || !hasAdminConfig)) {
    hasLoggedWarning = true;
    console.warn("[Auth Warning] In production, demo logins are disabled because DEMO_TEACHER_PASSWORD / DEMO_ADMIN_PASSWORD (or *_HASH) are not set.");
  }
}

// In-memory rate limiting map (IP / email -> { attempts, lockedUntil })
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil?: number }>();

export function checkRateLimit(key: string): { allowed: boolean; remainingSeconds?: number } {
  const record = loginAttempts.get(key);
  const now = Date.now();
  if (!record) return { allowed: true };

  if (record.lockedUntil && record.lockedUntil > now) {
    return {
      allowed: false,
      remainingSeconds: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  // Reset if window has passed (15 minutes)
  if (now - record.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  if (record.count >= 5) {
    // Lock for 15 minutes after 5 failures
    record.lockedUntil = now + 15 * 60 * 1000;
    return { allowed: false, remainingSeconds: 15 * 60 };
  }

  return { allowed: true };
}

export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, lastAttempt: now };
  record.count += 1;
  record.lastAttempt = now;
  loginAttempts.set(key, record);
}

export function resetLoginAttempts(key: string): void {
  loginAttempts.delete(key);
}

import { findTeacherByEmail } from "./accountStore.ts";

export class AccountPendingVerificationError extends Error {
  pendingDetails: {
    email: string;
    phone: string;
    phoneVerified: boolean;
    emailVerified: boolean;
  };
  constructor(details: { email: string; phone: string; phoneVerified: boolean; emailVerified: boolean }) {
    super("Account registration is incomplete. Please complete verification.");
    this.name = "AccountPendingVerificationError";
    this.pendingDetails = details;
  }
}

export async function verifyCredentials(
  emailInput: string,
  passwordInput: string
): Promise<AuthUser | null> {
  checkDemoConfigNotice();
  const normalizedEmail = emailInput.trim().toLowerCase();

  // 1. Check registered teacher accounts first
  const registeredTeacher = await findTeacherByEmail(normalizedEmail);
  if (registeredTeacher) {
    const isPasswordCorrect = await bcrypt.compare(passwordInput, registeredTeacher.passwordHash).catch(() => false);
    if (!isPasswordCorrect) {
      return null;
    }
    if (!registeredTeacher.phoneVerified || !registeredTeacher.emailVerified || registeredTeacher.status !== "active") {
      throw new AccountPendingVerificationError({
        email: registeredTeacher.email,
        phone: registeredTeacher.phone,
        phoneVerified: registeredTeacher.phoneVerified,
        emailVerified: registeredTeacher.emailVerified,
      });
    }
    return {
      id: registeredTeacher.id,
      email: registeredTeacher.email,
      name: registeredTeacher.fullName,
      role: registeredTeacher.role,
      schoolId: registeredTeacher.institutionName,
      classId: registeredTeacher.gradesTaught[0] || "class_5",
      phone: registeredTeacher.phone,
      institutionName: registeredTeacher.institutionName,
      gradesTaught: registeredTeacher.gradesTaught,
      subjectsTaught: registeredTeacher.subjectsTaught,
      designation: registeredTeacher.designation,
      status: registeredTeacher.status,
    };
  }

  // 2. In production, demo login works only if DEMO_* env vars are set
  if (isDemoLoginDisabled(normalizedEmail)) {
    const dummyHash = "$2a$10$wI5f2h7aQpX3U9X1pUqKGeB4b4L6D5E9zF8a0b1c2d3e4f5g6h7i8";
    await bcrypt.compare(passwordInput, dummyHash).catch(() => false);
    return null;
  }

  const user = USERS.find((u) => u.email.toLowerCase() === normalizedEmail);

  // Constant-time execution to prevent email enumeration timing attacks
  const dummyHash = "$2a$10$wI5f2h7aQpX3U9X1pUqKGeB4b4L6D5E9zF8a0b1c2d3e4f5g6h7i8";
  const hashToCompare = (user && user.passwordHash) ? user.passwordHash : dummyHash;

  // Check demo password match first or bcrypt compare
  const demoPass = getDemoPassword(normalizedEmail);
  const isDemoMatch = Boolean(demoPass && passwordInput === demoPass);

  const isBcryptMatch = (user && user.passwordHash)
    ? await bcrypt.compare(passwordInput, hashToCompare).catch(() => false)
    : false;

  // If no user found or neither demo nor bcrypt configured/matched, compare dummyHash to keep constant time
  if (!user || (!isDemoMatch && !isBcryptMatch)) {
    if (!user || !user.passwordHash) {
      await bcrypt.compare(passwordInput, dummyHash).catch(() => false);
    }
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolId: user.schoolId,
    classId: user.classId,
  };
}
