# ShikshaGap (शिक्षा-गैप / శిక్షా-గ్యాప్)

**AI Agent Learning Gap Diagnostic & Remediation for Primary Schools**

- **Live Production URL**: [https://shikshagap.vercel.app](https://shikshagap.vercel.app)
- **Node.js Version**: Node.js 24 (`v24.x` recommended / enforced in CI)
- **Supported Classes**: Class 3, Class 4, and Class 5 Mathematics (NCERT Math-Magic aligned)
- **Demo Data Notice**: Class 5A, 36 students, and "PM SHRI School" data are mock demo datasets provided exclusively for demonstration and evaluation purposes. They do not represent real children or institutions.

---

## 1. Application Screenshot

```
+-----------------------------------------------------------------------+
|  SHIKSHAGAP : AI AGENT LEARNING GAP DIAGNOSTIC                        |
|                                                                       |
|  [ Assess Test (6 Min Check) ]   [ Classes: 3 | 4 | 5 ]  [ En/Hi/Te ] |
|                                                                       |
|  Exhibit: Student Diagnostic Output (Sample Data)                     |
|  - Diagnosed Root Cause: Class 3 Subtraction Regrouping               |
|  - Backtracking Trail: Class 3 -> Class 4 Facts -> Class 5 Division   |
|  - Output: 5-Day Targeted Plan & Printable 1-Page Worksheet           |
+-----------------------------------------------------------------------+
```

---

## 2. Multi-Class Curriculum Support

ShikshaGap supports **Classes 3, 4, and 5** with syllabus-aligned mathematics topics and 1-page paper worksheets:
- **Class 3**: Number sense, 2-digit & 3-digit column addition with carrying, 3-digit subtraction with borrowing, equal sharing division, and money calculations (rupees and paise).
- **Class 4**: Place value up to 10,000, multiplication facts (2 to 9), sharing division, and unit fractions.
- **Class 5**: Multi-digit multiplication, long division with remainders, division word problems, and equivalent fractions.
- **Classes 1, 2, 6, 7, 8**: Marked as "Coming soon" with disabled states. No unverified syllabus content is added.

---

## 3. Environment Variables

Create `.env.local` based on `.env.example`:

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Optional | Google Gemini API key used by the Examiner and Analyst agents. When absent, the system operates deterministically on code-gate fallback with zero crashes. |
| `DATABASE_URL` | Optional | PostgreSQL connection string with pgvector support for persistent question memory. When absent, operates in-memory with safe fallbacks. |
| `CRON_SECRET` | Recommended in prod | Secret token securing the automated memory upkeep route (`/api/cron/memory-upkeep`). |
| `SESSION_SECRET` | Recommended in prod | 32-byte secret for HMAC signing of auth session cookies. |
| `IP_SALT` | Recommended in prod | Salt for one-way pseudonymized IP hashing in audit logs. |
| `GEMINI_MODEL` | Optional | Override model identifier for Gemini calls (default: `gemini-2.5-flash`). |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Yes (in prod) | Public contact email for footer, terms, and privacy notice. If missing at build time in production, the build fails. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical base URL (default: `https://shikshagap.vercel.app`). |
| `NEXT_PUBLIC_LEGAL_ENTITY_NAME` | Optional | Legal entity name for data fiduciary disclosures. |
| `NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME` | Optional | Grievance officer title/name for DPDP compliance. |

---

## 4. Persistent Memory Architecture & Privacy (DPDP Act 2023)

ShikshaGap maintains a persistent, privacy-preserving question memory designed to continuously calibrate question quality without tracking children:

### What Is Stored
- **Item-Level Quality Statistics**: Question ID, concept ID, curriculum class, difficulty level, language, presentation count, and correct answer count.
- **Aggregated Misconceptions**: Anonymized error tally counts (e.g., regrouping errors vs. place value slips).
- **Topic Outcome Aggregates**: Collective mastery distributions (mastered, developing, gap).
- **Anonymous Session Summaries**: Ephemeral row with random client-generated UUID, class, language, total questions answered, and aggregate score. Automatically pruned after **90 days**.

### What Is NEVER Stored
- **Zero Student Identifiers**: No student names, roll numbers, school IDs, or attendance logs.
- **Zero Free-Form Input**: No typed student text, audio recordings, or biometric tokens.
- **Zero Network PII**: No raw IP addresses, MAC addresses, or granular millisecond timestamps.

### Memory Upkeep Cron
A scheduled maintenance worker (`/api/cron/memory-upkeep`) runs daily via `vercel.json`:
1. Recomputes empirical difficulty and discriminative quality scores for active questions.
2. Automatically retires questions with extreme difficulty (<15% or >98% accuracy after ≥30 impressions) or flagged questions.
3. Hard-prunes retired questions and anonymous session summaries older than **90 days**.
4. Enforces a 5,000-question table ceiling to maintain zero-cost compliance on free database tiers.

---

## 5. Question Engine Quality Evaluation Script

Run the automated quality evaluation script to verify mathematical accuracy, range compliance, blind-solver agreement, and format variety:

```bash
# Generate 300 questions per class (Classes 3, 4, 5) and produce docs/QUALITY_REPORT.md
npm run eval:questions
```

Review the resulting analysis at [`docs/QUALITY_REPORT.md`](file:///c:/Users/pbala/shikshagap/Shikshagap/shikshagap/docs/QUALITY_REPORT.md).

---

## 6. Run Tests

The test suite covers curriculum consistency, security invariants, privacy boundaries, agent orchestrator states, question formats, and persistent memory:

```bash
# Run full automated test suite (135 tests)
npm test

# Run static type checks
npx tsc --noEmit

# Run linter
npm run lint

# Build production bundle
npm run build
```

---

## 7. Getting Started Locally

```bash
# Clone the repository
git clone https://github.com/Shanmukhaaa4096/Shikshagap.git
cd Shikshagap

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Documentation

Detailed documentation and audit reports are organized in the [`/docs`](file:///c:/Users/pbala/shikshagap/Shikshagap/shikshagap/docs) directory:
- [`docs/CHANGES.md`](file:///c:/Users/pbala/shikshagap/Shikshagap/shikshagap/docs/CHANGES.md): Historical change records
- [`docs/LEGAL_AUDIT.md`](file:///c:/Users/pbala/shikshagap/Shikshagap/shikshagap/docs/LEGAL_AUDIT.md): DPDP Act 2023 compliance audit
- [`docs/SECURITY_AUDIT.md`](file:///c:/Users/pbala/shikshagap/Shikshagap/shikshagap/docs/SECURITY_AUDIT.md): Security analysis and headers report
- [`docs/SEO_PLAN.md`](file:///c:/Users/pbala/shikshagap/Shikshagap/shikshagap/docs/SEO_PLAN.md): Metadata and indexing guidelines
- [`docs/THIRD_PARTY.md`](file:///c:/Users/pbala/shikshagap/Shikshagap/shikshagap/docs/THIRD_PARTY.md): Zero third-party tracker audit

---

## 7. License

This project is licensed under the [MIT License](file:///c:/Users/pbala/shikshagap/Shikshagap/shikshagap/LICENSE).
