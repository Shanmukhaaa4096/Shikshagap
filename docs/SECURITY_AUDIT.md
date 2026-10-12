# Comprehensive Security Audit Report: ShikshaGap

**Application**: ShikshaGap (Class 5 Mathematics Diagnostic Intelligence)  
**Host Environment**: Vercel Edge (`shikshagap.vercel.app`)  
**Audit Date**: October 2026  
**Auditor**: Senior Full-Stack Security & Privacy Reviewer  
**Status**: All Critical Invariants Verified; 8/8 Automated Security Tests Passing  

---

## 1. Executive Summary

ShikshaGap processes educational diagnostic information for Class 5 students in Indian government schools. Under the **Digital Personal Data Protection Act (DPDP Act) 2023**, children's data requires strict confidentiality, purpose limitation, and tamper-resistant access controls. 

This audit verified multi-tenant isolation, cryptographic share tokens, teacher overrides, audit trail immutability, spreadsheet injection defenses, and mobile security invariants.

---

## 2. Automated Security Test Suite Results

An automated security test suite was authored and executed in Node.js test runner (`tests/security.test.mjs`). All 8 test scenarios passed with 0 failures:

```text
✔ Security Test 1: Cross-Class Access Isolation (1.2023ms)
✔ Security Test 2: Cross-School Data Isolation (1.3276ms)
✔ Security Test 3: Token Entropy and Guessing Resistance (0.4883ms)
✔ Security Test 4: Expired, Revoked, and View-Limited Tokens (0.2909ms)
✔ Security Test 5: Re-Authentication Window Enforcement for Exports (0.2034ms)
✔ Security Test 6: Teacher Note XSS Sanitization & Character Cap (0.4236ms)
✔ Security Test 7: CSV Injection Formula Escaping and UTF-8 BOM (0.2897ms)
✔ Security Test 8: Audit Log Privacy & Zero Student PII Exposure (0.2901ms)

ℹ tests 8 | suites 0 | pass 8 | fail 0 | cancelled 0 | duration 127ms
```

### Breakdown of Test Cases:

1. **Test 1: Cross-Class Access Isolation**:  
   Verified that a teacher assigned to Class 5A cannot view, share, or override records for students in Class 5B. Server-side authorization checks `assignedClasses.includes(student.classId)`.
2. **Test 2: Cross-School Data Isolation**:  
   Verified that a school administrator for School A cannot read audit logs, export records, or revoke parent links belonging to School B. Queries filter by `schoolId`.
3. **Test 3: Token Entropy and Guessing Resistance**:  
   Verified that generated parent share tokens have 128 bits of entropy (32 hexadecimal characters from `crypto.randomBytes(16)`). Unguessable: random trial nonces return `null` / HTTP 404.
4. **Test 4: Expired, Revoked, and View-Limited Tokens**:  
   Verified that:
   - Tokens past their 7-day TTL return `null`.
   - Explicitly revoked tokens return `null`.
   - Tokens exceeding their 20-view threshold return `null`.
5. **Test 5: Re-Authentication Window Enforcement for Exports**:  
   Verified that calling the data export endpoint without a fresh password verification in the preceding 10 minutes returns HTTP 401 `REAUTH_REQUIRED`. Verified that after valid re-auth, export succeeds, but fails after 11 minutes.
6. **Test 6: Teacher Note XSS Sanitization & Character Cap**:  
   Verified that malicious HTML tags (`<script>`, `<img>`, `<iframe>`) inserted into teacher notes are stripped prior to storage, and text exceeding 500 characters is cleanly truncated.
7. **Test 7: CSV Injection Formula Escaping & UTF-8 BOM**:  
   Verified that cells beginning with dangerous spreadsheet execution symbols (`=`, `+`, `-`, `@`, `\t`, `\r`) are neutralized with a leading single quote (`'`). Verified presence of UTF-8 Byte Order Mark (`\uFEFF`) for Indic script fidelity in Microsoft Excel.
8. **Test 8: Audit Log Privacy & Zero Student PII Exposure**:  
   Verified that audit logs store one-way salted SHA-256 IP hashes, high-level operational descriptions, and zero student personal names, scores, or tokens.

---

## 3. Threat Modeling & Vulnerability Remediations

| Vulnerability Threat | Risk Level | Architectural Fix Applied | Verification |
|---|---|---|---|
| **Public Leakage of Student Records** | Critical | Relocated dashboard to `/app` behind HMAC-SHA256 authenticated session middleware. Public landing page at `/` displays only labelled synthetic demo data. | Verified via curl & route tests |
| **Cross-Tenant Data Exposure** | High | Added strict server-side validation on every write and read API endpoint (`/api/export`, `/api/reports/share`, `/api/assessment/override`, `/api/admin/audit-log`). Client-supplied roles and school IDs are discarded. | Verified via Security Tests 1 & 2 |
| **Brute Force on Parent Share Links** | High | Replaced sequential or predictable IDs with 128-bit cryptographically secure random tokens. Strict rate-limiting on token resolution (60 requests/min). | Verified via Security Test 3 |
| **Spreadsheet Formula Injection (CSV Injection)** | High | Prepend `'` prefix to all cells beginning with `=+\-@\t\r`. Added `\uFEFF` BOM for UTF-8 Excel support. | Verified via Security Test 7 |
| **Cross-Site Scripting (XSS) in Teacher Notes** | Medium | Regex tag-stripper and strict alphanumeric sanitization applied to teacher override notes. 500 character ceiling enforced. | Verified via Security Test 6 |
| **Credential Stuffing / Password Spraying** | Medium | Constant-time password hashing execution via bcrypt, 5-attempt lockout per IP/email within 15 minutes, generic error messages ("Invalid institutional credentials provided"). | Verified via login route |
| **Prompt Injection to Gemini AI Provider** | Medium | User math answers enclosed in strict XML demarcations; system prompt enforces math evaluation only; output parsed through deterministic fallback validation; zero child PII transmitted. | Verified via AI endpoint route |
| **Child Data Persistence on Shared Devices** | Medium | Scoped service worker (`sw.js`) caches app shell only; zero API student data cached; `wipeLocalSecureData()` purges local state on logout and session expiration. | Verified in PWA sync manager |

---

## 4. HTTP Security Headers Verification

Configured in `next.config.ts`:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://generativelanguage.googleapis.com; frame-ancestors 'none';
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Frame-Options: DENY
```

### Analysis:
- `HSTS`: 2-year duration with subdomains and preload directive.
- `X-Frame-Options: DENY` & `frame-ancestors 'none'`: Prevents clickjacking in iframes.
- `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing attacks.
- `Referrer-Policy: strict-origin-when-cross-origin`: Restricts URL leakage on outbound navigation.

---

## 5. Dependency Audit & Repository Secret Scan

1. **Dependency Audit (`npm audit`)**:
   - `npm audit` flagged vulnerabilities in `@vercel` developer CLI tools (`tar` and `ts-morph` transitive sub-dependencies used during local builds).
   - These packages are developer build-time tools only and do not bundle into the client runtime bundle or serverless function handlers.
   - Core production runtime dependencies (`@google/genai`, `bcryptjs`, `@phosphor-icons/react`, `next`, `react`) are secure.
2. **Repository Secret Scan**:
   - Git history and codebase scanned for hardcoded credentials.
   - Zero API keys, passwords, or session secrets found in repository source files.
   - All runtime secrets (`GEMINI_API_KEY`, `SESSION_SECRET`) are loaded from environment variables.

---

## 6. Residual Risks & Production Architecture Recommendations

1. **In-Memory Store vs Distributed Database**:
   - The current demonstration stores audit logs and tokens in server memory (`src/lib/server/store.ts`). For multi-instance horizontal scaling on Vercel or cloud containers, this store must be backed by an ACID-compliant Postgres database with Row-Level Security (RLS).
2. **Periodic Token Sweeping**:
   - An asynchronous cron job should periodically delete expired share tokens from the persistence store after their 7-day lifetime.
3. **Hardware Security Modules (HSM) for Cloud Deployments**:
   - For state-wide school rollouts, session signing keys and database encryption keys should be managed through a cloud KMS / HSM.
