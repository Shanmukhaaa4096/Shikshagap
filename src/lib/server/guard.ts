import { getClientIp } from "./security.ts";
import { hashIp } from "./store.ts";

export interface GuardOptions {
  route: string;
  cost?: number;
  idempotencyKey?: string;
  customKey?: string;
  sessionToken?: string;
}

export interface GuardSuccess {
  ok: true;
  callerKey: string;
  headers: Record<string, string>;
}

export interface GuardFailure {
  ok: false;
  status: 429 | 403;
  headers: Record<string, string>;
  body: {
    error: string;
    messageKey: string;
    retryAfterSeconds: number;
  };
}

export type GuardResult = GuardSuccess | GuardFailure;

interface TokenBucket {
  tokens: number;
  capacity: number;
  refillRatePerSec: number;
  lastRefillTime: number;
}

interface CachedResponse {
  status: number;
  body: unknown;
  headers: Record<string, string>;
  timestamp: number;
}

// Global in-memory storage for rate limiting, idempotency, and temporary blocks
const buckets = new Map<string, TokenBucket>();
const idempotencyStore = new Map<string, CachedResponse>();
const activeBlocks = new Map<string, { blockedUntil: number; reason: string }>();

// Clean up expired idempotency keys and stale buckets periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function performCleanupIfNeeded(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  // Prune idempotency entries older than 60s
  for (const [key, item] of idempotencyStore.entries()) {
    if (now - item.timestamp > 60 * 1000) {
      idempotencyStore.delete(key);
    }
  }

  // Prune blocks past their expiry
  for (const [key, block] of activeBlocks.entries()) {
    if (now > block.blockedUntil) {
      activeBlocks.delete(key);
    }
  }

  // Prune token buckets untouched for > 15 minutes
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefillTime > 15 * 60 * 1000) {
      buckets.delete(key);
    }
  }
}

/**
 * Route-specific default token bucket configuration.
 * School-friendly limits: student/assessment routes provide high burst and steady refill.
 */
export function getRouteBucketConfig(route: string): { capacity: number; refillRatePerSec: number } {
  switch (route) {
    case "/api/assessment/agent":
    case "/api/assessment/verify":
      // Student assessment step: burst 40, steady 20/min (~0.33/s) per session
      return { capacity: 40, refillRatePerSec: 20 / 60 };

    case "/api/assessment/finish":
    case "/api/assessment/session-close":
      // Session finalization / close: burst 10, steady 5/min (~0.083/s)
      return { capacity: 10, refillRatePerSec: 5 / 60 };

    case "/api/assessment/report-question":
      // Report bad question: burst 10, steady 5/min
      return { capacity: 10, refillRatePerSec: 5 / 60 };

    case "/api/auth/login":
      // Login endpoint: burst 5, steady 10/min (0.167/s)
      return { capacity: 5, refillRatePerSec: 10 / 60 };

    case "/api/pilot-register":
      // Public school pilot request: burst 3, steady 5 per 10 min
      return { capacity: 3, refillRatePerSec: 5 / 600 };

    case "/api/data-request":
      // DPDP grievance/inquiry: burst 2, steady 3 per 10 min
      return { capacity: 2, refillRatePerSec: 3 / 600 };

    case "/api/export":
      // Grade data export: burst 5, steady 10/min
      return { capacity: 5, refillRatePerSec: 10 / 60 };

    case "/api/sync":
      // Offline sync: burst 15, steady 30/min
      return { capacity: 15, refillRatePerSec: 30 / 60 };

    case "/api/assessment/override":
    case "/api/reports/share":
    case "/api/auth/me":
    case "/api/admin/audit-log":
      // Teacher / admin dashboard operations: burst 30, steady 60/min
      return { capacity: 30, refillRatePerSec: 1 };

    case "/api/cron/memory-upkeep":
      // Scheduled cron maintenance: burst 2, steady 6/hr
      return { capacity: 2, refillRatePerSec: 6 / 3600 };

    default:
      // General safe default: burst 30, steady 30/min
      return { capacity: 30, refillRatePerSec: 0.5 };
  }
}

/**
 * Resolves caller key following strict hierarchy:
 * 1. Signed anonymous session ID (if provided)
 * 2. Signed-in user ID + school ID (if authenticated)
 * 3. Salted SHA-256 IP hash (fallback)
 * Note: Raw IP is NEVER used as key or logged.
 */
export async function resolveCallerKey(
  req: Request | { headers: Headers | { get(name: string): string | null } },
  sessionToken?: string
): Promise<{ callerKey: string; keyType: "student_session" | "user_school" | "ip_hash"; ipHash: string }> {
  const ip = getClientIp(req);
  const ipHashed = hashIp(ip);

  // 1. Explicit or cookie session token (Student pseudonymous assessment session)
  const headerSession = req.headers.get("x-session-id") || sessionToken;
  if (headerSession && headerSession.trim().length >= 8) {
    return {
      callerKey: `sess:${headerSession.trim()}`,
      keyType: "student_session",
      ipHash: ipHashed,
    };
  }

  // 2. Signed-in teacher or school admin session
  try {
    const { getServerSession } = await import("../auth/session.ts");
    const authSession = await getServerSession();
    if (authSession && authSession.user && authSession.user.id) {
      return {
        callerKey: `usr:${authSession.user.schoolId || "school"}:${authSession.user.id}`,
        keyType: "user_school",
        ipHash: ipHashed,
      };
    }
  } catch {
    // Ignore session decoding failures in public routes or test environments
  }

  // 3. Fallback: Salted SHA-256 IP hash
  return {
    callerKey: `ip:${ipHashed}`,
    keyType: "ip_hash",
    ipHash: ipHashed,
  };
}

/**
 * Single shared guard deciding if request passes.
 * Uses token bucket algorithm with burst capacity and steady refill.
 */
export async function guardRequest(
  req: Request | { headers: Headers | { get(name: string): string | null } },
  options: GuardOptions
): Promise<GuardResult> {
  performCleanupIfNeeded();
  const now = Date.now();
  const { route, cost = 1 } = options;

  // Check Idempotency-Key if provided
  const idempotencyHeader = options.idempotencyKey || req.headers.get("idempotency-key");
  if (idempotencyHeader) {
    const cached = idempotencyStore.get(idempotencyHeader);
    if (cached && now - cached.timestamp < 60 * 1000) {
      return {
        ok: true,
        callerKey: `idempotent:${idempotencyHeader}`,
        headers: {
          ...cached.headers,
          "X-Idempotent-Replay": "true",
        },
      };
    }
  }

  // Resolve caller key
  const { callerKey, keyType, ipHash } = await resolveCallerKey(req, options.sessionToken);
  const effectiveKey = options.customKey || `${route}:${callerKey}`;

  // Check active temporary block
  const block = activeBlocks.get(effectiveKey) || activeBlocks.get(`block:${ipHash}`);
  if (block && now < block.blockedUntil) {
    const retryAfter = Math.ceil((block.blockedUntil - now) / 1000);
    return {
      ok: false,
      status: 403,
      headers: {
        "Retry-After": String(retryAfter),
        "RateLimit-Limit": "0",
        "RateLimit-Remaining": "0",
        "RateLimit-Reset": String(retryAfter),
      },
      body: {
        error: "Access temporarily blocked due to repeated security policy violations.",
        messageKey: "rateLimit.temporaryBlock",
        retryAfterSeconds: retryAfter,
      },
    };
  }

  // Fetch or initialize token bucket
  const config = getRouteBucketConfig(route);
  let bucket = buckets.get(effectiveKey);

  if (!bucket) {
    bucket = {
      tokens: config.capacity,
      capacity: config.capacity,
      refillRatePerSec: config.refillRatePerSec,
      lastRefillTime: now,
    };
  } else {
    // Refill tokens based on elapsed time
    const elapsedSec = (now - bucket.lastRefillTime) / 1000;
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + elapsedSec * bucket.refillRatePerSec);
    bucket.lastRefillTime = now;
  }

  // Check if enough tokens available
  if (bucket.tokens < cost) {
    const deficit = cost - bucket.tokens;
    const retryAfter = Math.max(1, Math.ceil(deficit / bucket.refillRatePerSec));
    buckets.set(effectiveKey, bucket);

    return {
      ok: false,
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "RateLimit-Limit": String(bucket.capacity),
        "RateLimit-Remaining": "0",
        "RateLimit-Reset": String(retryAfter),
      },
      body: {
        error: "Too many requests. Please wait a moment before trying again.",
        messageKey: keyType === "student_session" ? "rateLimit.studentWait" : "rateLimit.standardLimit",
        retryAfterSeconds: retryAfter,
      },
    };
  }

  // Debit tokens
  bucket.tokens -= cost;
  buckets.set(effectiveKey, bucket);

  const remaining = Math.max(0, Math.floor(bucket.tokens));
  const resetAfter = Math.ceil((bucket.capacity - bucket.tokens) / bucket.refillRatePerSec);

  return {
    ok: true,
    callerKey: effectiveKey,
    headers: {
      "RateLimit-Limit": String(bucket.capacity),
      "RateLimit-Remaining": String(remaining),
      "RateLimit-Reset": String(resetAfter),
    },
  };
}

/**
 * Records cached response for Idempotency-Key replay.
 */
export function recordIdempotentResponse(
  idempotencyKey: string,
  response: { status: number; body: unknown; headers?: Record<string, string> }
): void {
  idempotencyStore.set(idempotencyKey, {
    status: response.status,
    body: response.body,
    headers: response.headers || {},
    timestamp: Date.now(),
  });
}

/**
 * Creates standard Response from GuardFailure
 */
export function createGuardResponse(failure: GuardFailure): Response {
  return Response.json(failure.body, {
    status: failure.status,
    headers: failure.headers,
  });
}

/**
 * Helper to apply temporary block to a caller key or IP hash.
 */
export function applyTemporaryBlock(key: string, durationSeconds: number, reason: string): void {
  activeBlocks.set(key, {
    blockedUntil: Date.now() + durationSeconds * 1000,
    reason,
  });
}

/**
 * Reset helper for testing
 */
export function resetGuardStore(): void {
  buckets.clear();
  idempotencyStore.clear();
  activeBlocks.clear();
}
