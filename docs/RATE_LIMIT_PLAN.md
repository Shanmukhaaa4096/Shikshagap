# ShikshaGap API Rate Limiting & Protection Plan

## 1. Executive Summary & Design Principles for Schools

Primary schools across India operate in unique technological environments:
1. **Shared Network IP**: An entire school computer lab (30 to 40 students) typically connects through a single BSNL / Jio broadband router or mobile hotspot. If an API rate limiter naively tracks requests by raw IP alone with tight caps (e.g. 20-40 req/min), an entire classroom of children will be locked out within seconds.
2. **Never Punish Students**: An assessment session must never display aggressive HTTP 429 alarm messages to a 9-year-old child. If an AI generation quota is reached, the system must silently fall back to deterministic NCERT template questions without interrupting the test.
3. **Defense Against Abuse**: Public lead forms (`/api/pilot-register`, `/api/data-request`) and login endpoints must strictly defend against credential stuffing, automated scraping, and payload floods.
4. **Zero Student PII**: Rate limiting keys and logs must never store student names, roll numbers, or raw IP addresses. Only salted SHA-256 hashes (`hashIp`) and cryptographically signed pseudonymous session tokens are permitted.

---

## 2. Client IP Resolution & Anti-Spoofing Architecture

### How Client IP is Read
In `src/lib/server/security.ts`:
```ts
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
```

### Security Rules:
1. **Trust Boundary**: `x-forwarded-for` is trusted **ONLY** when `process.env.VERCEL` is set or `TRUSTED_PROXY=true`.
2. **First Hop**: When running behind Vercel edge reverse proxy, the first IP in `x-forwarded-for` represents the real client origin added by the edge.
3. **Header Spoofing Prevention**: Off Vercel (or when self-hosted without a trusted reverse proxy configuration), user-supplied `x-forwarded-for` and `x-real-ip` headers are rejected. Attackers attempting to rotate `x-forwarded-for: 1.1.1.1`, `x-forwarded-for: 2.2.2.2` are collapsed onto the safe local fallback bucket (`127.0.0.1`) and immediately rate limited together.
4. **Privacy Salting**: IP addresses are never stored or logged in plain text. They are hashed using SHA-256 with an environment salt (`IP_SALT`).

---

## 3. Comprehensive Audit of All API Routes

| Route Path | HTTP Methods | Caller Persona | Data Operation | Current Rate Limiting | Recommended Steady Limit | Recommended Burst | Recommended Caller Key |
|---|---|---|---|---|---|---|---|
| `/api/assessment/agent` | `POST` | Anonymous Student | Read & Compute (Expensive AI call via Gemini Flash / fallback) | In-memory Map (`agentRateLimits`, 40 req/min per IP) | **20 req/min** (per session)<br>**600 req/min** (per IP) | **40** (session)<br>**200** (IP) | Signed Anonymous `sessionId` > Salted IP Hash (`hashIp`) |
| `/api/assessment/finish` | `POST` | Anonymous Student | Write & Compute (Evaluates staircase results, writes to question memory) | In-memory Map (`finishRateLimits`, 40 req/min per IP) | **5 req/min** (per session)<br>**120 req/min** (per IP) | **10** (session)<br>**60** (IP) | Signed Anonymous `sessionId` > Salted IP Hash |
| `/api/assessment/session-close` | `POST` | Anonymous Student | Write (Beacon/unload updates misconception and impression tallies) | In-memory Map (`closeRateLimits`, 60 req/min per IP) | **5 req/min** (per session)<br>**120 req/min** (per IP) | **10** (session)<br>**60** (IP) | `sessionId` > Salted IP Hash |
| `/api/assessment/report-question` | `POST` | Anonymous Student / Teacher | Write (Increments report count, may retire bad questions) | **None** | **5 req/min** (session)<br>**30 req/min** (IP) | **10** (session)<br>**15** (IP) | `sessionId` > Salted IP Hash |
| `/api/assessment/override` | `POST` | Signed-in Teacher | Write (Stores teacher clinical diagnosis override + audit event) | **None** | **60 req/min** | **30** | Teacher ID + School ID (`${schoolId}:${userId}`) |
| `/api/auth/login` | `POST` | Teacher / School Admin | Read/Write (Bcrypt verification, session cookie issuance, audit log) | In-memory Map (`loginAttempts`, 5 failures locks 15 min) | **10 req/min** (per IP)<br>Exponential delay per email | **5** (burst) | Hashed IP + Normalized Email |
| `/api/auth/logout` | `POST` | Signed-in User | Write (Clears cookie, audit event) | **None** | **20 req/min** | **10** | Session `userId` or Salted IP Hash |
| `/api/auth/me` | `GET` | Signed-in User | Read (Decodes JWT/session cookie, returns role and profile) | **None** | **60 req/min** | **30** | Session `userId` or Salted IP Hash |
| `/api/sync` | `POST` | Signed-in Teacher | Write (Batches offline IndexedDB overrides; capped at 200 items, 512KB) | **None** | **30 req/min** (teacher)<br>**120 req/min** (IP) | **15** (teacher)<br>**60** (IP) | Teacher ID + School ID (supports `Idempotency-Key`) |
| `/api/export` | `POST` | Signed-in Teacher / Admin | Read/Compute (Generates CSV/JSON student records; requires recent re-auth) | **None** | **10 req/min** (user)<br>**30 req/min** (IP) | **5** (user)<br>**10** (IP) | User ID + School ID |
| `/api/reports/share` | `POST`, `DELETE` | Signed-in Teacher | Write (Generates or revokes 128-bit unguessable guardian share token) | **None** | **30 req/min** | **15** | Teacher ID + School ID |
| `/api/pilot-register` | `POST` | Public / Prospective School | Write (Sanitizes input, stores lead, honeypot spam protection) | In-memory fixed bucket (5 req per 10 min per IP) | **5 req / 10 min** | **3** | Salted IP Hash |
| `/api/data-request` | `POST` | Public / Parent / Guardian | Write (Logs DPDP statutory grievance / inquiry, audit event) | In-memory fixed bucket (3 req per 10 min per IP) | **3 req / 10 min** | **2** | Salted IP Hash |
| `/api/admin/audit-log` | `GET` | Signed-in School Admin | Read (Returns paginated school audit log, logs inspection event) | **None** | **60 req/min** | **30** | Admin ID + School ID |
| `/api/cron/memory-upkeep` | `GET` | Background Worker | Maintenance (Recomputes scores, prunes >90 day items, caps table size) | Protected by `CRON_SECRET` Bearer auth | **6 req / hour** | **2** | Authorization Token |

---

## 4. Key Recommendations & Implementation Roadmap

1. **One Shared Guard (`src/lib/server/guard.ts`)**:
   - Centralize token-bucket rate limiting with refill rates and burst capacity.
   - Return standard RFC 6585 headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After`.
   - Support `Idempotency-Key` caching (60s replay protection for offline sync & session close).
2. **School-Safe Limits (`src/config/rateLimits.ts`)**:
   - Differentiate student session limits (20/min steady, 40 burst) from shared IP limits (600/min steady, 200 burst).
   - Global safety net at 3,000 req/min.
   - Dual-tier Gemini AI quota with silent fallback to deterministic NCERT questions.
3. **Strikes & School-Safe Blocks**:
   - Failed logins and malicious inputs accumulate strikes against a specific account or session, never locking an entire school IP out of classroom math lessons.
   - Strikes decay after 24 hours.
