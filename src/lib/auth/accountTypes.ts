/**
 * src/lib/auth/accountTypes.ts
 *
 * Types for Teacher Account, Registration, Verification, and Profile.
 */

import type { UserRole } from "./types.ts";

export type AccountStatus = "registration_incomplete" | "active" | "suspended";

export type TeacherDesignation =
  | "teacher"
  | "senior_teacher"
  | "headmaster"
  | "principal"
  | "coordinator"
  | "other";

export interface TeacherAccount {
  id: string;
  fullName: string;
  institutionName: string;
  gradesTaught: string[]; // e.g. ["class_3", "class_4", "class_5"]
  subjectsTaught: string[]; // e.g. ["Mathematics", "Science"]
  designation?: TeacherDesignation;
  phone: string; // E.164 normalized format, e.g. +919876543210
  phoneVerified: boolean;
  phoneVerifiedAt?: string | null;
  email: string; // normalized lowercase
  emailVerified: boolean;
  emailVerifiedAt?: string | null;
  passwordHash: string; // bcrypt hash
  role: UserRole; // "teacher" | "school_admin"
  status: AccountStatus;
  age?: number;
  preferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationTokenRecord {
  id: string;
  userId: string;
  channel: "phone" | "email" | "password_reset";
  target: string; // phone number or email address
  tokenHash: string; // SHA-256 hash of token / OTP to prevent plaintext exposure in DB
  attempts: number;
  maxAttempts: number;
  expiresAt: number; // epoch ms
  createdAt: number;
  used: boolean;
}

export interface RegistrationInput {
  fullName: string;
  institutionName: string;
  gradesTaught: string[];
  subjectsTaught?: string[];
  designation?: TeacherDesignation;
  countryCode: string; // e.g. "+91"
  phone: string;
  email: string;
  password: string;
  age?: number;
  privacyConsent: boolean;
}
