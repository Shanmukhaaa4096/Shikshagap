/**
 * Security, sanitization, and in-memory rate limiting utilities.
 */

// Simple HTML/script entity escaper to neutralize injection attacks
export function sanitizeText(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Safely extracts client IP address.
 * Trusts x-forwarded-for ONLY if process.env.VERCEL is set (or TRUSTED_PROXY=true), taking the FIRST entry.
 * Otherwise, rejects user-supplied proxy headers and uses a safe fallback ("127.0.0.1") to prevent header spoofing.
 */
export function getClientIp(req: Request | { headers: Headers | { get(name: string): string | null } }): string {
  const headers = "headers" in req ? req.headers : req;
  const isTrustedProxy = Boolean(process.env.VERCEL || process.env.TRUSTED_PROXY === "true");

  if (isTrustedProxy) {
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
    const realIp = headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  }

  // Off Vercel: Reject spoofed proxy headers to prevent rate limit bypass
  return "127.0.0.1";
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

/**
 * Per-IP rate limiting: e.g. maxRequests = 5 per windowMs (default 10 minutes = 600,000 ms)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 10 * 60 * 1000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitBuckets.get(key);

  if (!record || now > record.resetAt) {
    const nextRecord = { count: 1, resetAt: now + windowMs };
    rateLimitBuckets.set(key, nextRecord);
    return { allowed: true, remaining: maxRequests - 1, resetAt: nextRecord.resetAt };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}
