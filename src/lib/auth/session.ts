import { cookies } from "next/headers";
import type { AuthUser, SessionData } from "./types";
import crypto from "crypto";

const SESSION_COOKIE = "shikshagap_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "shikshagap_production_secret_key_2026_safe";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function signData(data: string): string {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(data);
  return hmac.digest("hex");
}

export function createSessionToken(user: AuthUser): string {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const session: SessionData = { user, expiresAt };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = signData(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): SessionData | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const expectedSignature = signData(payload);

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const json = Buffer.from(payload, "base64url").toString("utf-8");
    const session: SessionData = JSON.parse(json);

    if (Date.now() > session.expiresAt) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(user: AuthUser): Promise<void> {
  const cookieStore = await cookies();
  const token = createSessionToken(user);

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60, // 8 hours
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
