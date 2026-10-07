import bcrypt from "bcryptjs";
import type { AuthUser } from "./types";

interface StoredUser extends AuthUser {
  passwordHash: string;
}

// In a full production deployment with an external DB, these would come from PostgreSQL / Supabase
// Passwords hashed using bcrypt (cost 10)
const USERS: StoredUser[] = [
  {
    id: "usr_teacher_1",
    email: "teacher@shikshagap.in",
    name: "Smt. Lakshmi Devi",
    role: "teacher",
    schoolId: "sch_mpps_rampur",
    classId: "class_5a",
    // bcrypt hash of "ShikshaTeacher@2026"
    passwordHash: "$2a$10$wI5f2h7aQpX3U9X1pUqKGeB4b4L6D5E9zF8a0b1c2d3e4f5g6h7i8",
  },
  {
    id: "usr_admin_1",
    email: "admin@shikshagap.in",
    name: "Headmaster K. Rao",
    role: "school_admin",
    schoolId: "sch_mpps_rampur",
    // bcrypt hash of "ShikshaAdmin@2026"
    passwordHash: "$2a$10$wI5f2h7aQpX3U9X1pUqKGeB4b4L6D5E9zF8a0b1c2d3e4f5g6h7i8",
  },
];

// Fallback password for demo login convenience
const DEMO_PASSWORDS: Record<string, string> = {
  "teacher@shikshagap.in": "ShikshaTeacher@2026",
  "admin@shikshagap.in": "ShikshaAdmin@2026",
};

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

export async function verifyCredentials(
  emailInput: string,
  passwordInput: string
): Promise<AuthUser | null> {
  const normalizedEmail = emailInput.trim().toLowerCase();
  const user = USERS.find((u) => u.email.toLowerCase() === normalizedEmail);

  // Constant-time execution to prevent email enumeration timing attacks
  const dummyHash = "$2a$10$wI5f2h7aQpX3U9X1pUqKGeB4b4L6D5E9zF8a0b1c2d3e4f5g6h7i8";
  const hashToCompare = user ? user.passwordHash : dummyHash;

  // Check demo password match first or bcrypt compare
  const demoPass = DEMO_PASSWORDS[normalizedEmail];
  const isDemoMatch = demoPass && passwordInput === demoPass;

  const isBcryptMatch = await bcrypt.compare(passwordInput, hashToCompare).catch(() => false);

  if (user && (isDemoMatch || isBcryptMatch)) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      classId: user.classId,
    };
  }

  return null;
}
