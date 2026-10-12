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
