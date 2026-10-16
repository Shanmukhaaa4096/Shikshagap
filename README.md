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
| `DEMO_TEACHER_PASSWORD` / `DEMO_TEACHER_HASH` | Optional | Explicit password or bcrypt hash to enable demo teacher login. Disabled by default in production and development unless explicitly set. |
| `DEMO_ADMIN_PASSWORD` / `DEMO_ADMIN_HASH` | Optional | Explicit password or bcrypt hash to enable demo admin login. Disabled by default in production and development unless explicitly set. |
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

## 5. Adaptive Difficulty Engine & Multi-Board Question Sources

ShikshaGap features a 5-level adaptive difficulty engine and multi-board curriculum question rotation:

### 5-Level Adaptive Difficulty Ladder
- **L1 Recall**: Definitions, direct facts, single-step operations.
- **L2 Understanding**: Explain in own words, simple numericals, foundational concepts (default starting level).
- **L3 Application**: Multi-step problems, real-life Indian word problem scenarios.
- **L4 Analysis**: Compare, reason, "why/what if", data and diagram interpretation.
- **L5 Challenge**: HOTS (Higher Order Thinking Skills), Olympiad-style multi-concept integration.

### Adaptation Rules
- **Correct**: $+1$ difficulty level. Two consecutive correct answers jump $+1$ level up to L5.
- **Partially Correct**: Stays at the same level, presenting a question targeting the missing part.
- **Wrong / "I don't know yet"**: $-1$ difficulty level with an immediate concise hint.
- **Two Wrong in a Row**: $-2$ difficulty levels and automatic prerequisite concept backtracking via DAG.
- **Floor Guard & Teaching Mode**: Never drops below L1; if wrong at L1, switches to teaching mode with confidence-building explanations.
- **Stopping Rules**: Minimum 2, maximum 6 questions per topic. Stops early on 2 correct at L5 (mastered) or 2 wrong at L1 with no improvement (learning gap).
- **Bayesian Mastery**: High-difficulty successes (L4/L5) provide stronger evidence of solid mastery; low-difficulty misses (L1) provide stronger evidence of foundational gaps.

### Multi-Book, Multi-Board Question Sources
Supports 5 authentic book families across Indian primary curricula:
1. `ncert`: NCERT Math-Magic (Classes 3–5) with conversational Indian storytelling context.
2. `exemplar`: NCERT Exemplar with deep conceptual problems.
3. `cbse_reference`: CBSE Reference problems (R.D. Sharma / R.S. Aggarwal style) focusing on procedural fluency.
4. `icse_selina`: ICSE Selina / Concise Mathematics with formal wording and explicit units.
5. `icse_foundation`: ICSE Foundation (Frank / ML Aggarwal style) with structured mathematical reasoning.

Teachers and students can select their preferred curriculum focus on the assessment start screen: **CBSE** (70% CBSE / 30% ICSE), **ICSE** (70% ICSE / 30% CBSE), or **Both** (balanced alternation). Source styles are automatically rotated so that no two consecutive questions share the same style, and at least two distinct styles are experienced every five questions.

---

## 6. Question Engine Quality Evaluation Script

Run the automated quality evaluation script to verify mathematical accuracy, range compliance, blind-solver agreement, and format variety:

```bash
# Generate 300 questions per class (Classes 3, 4, 5) and produce docs/QUALITY_REPORT.md
npm run eval:questions
```

Review the resulting analysis at [`docs/QUALITY_REPORT.md`](file:///c:/Users/pbala/shikshagap/Shikshagap/shikshagap/docs/QUALITY_REPORT.md).

---

## 7. Run Tests

The test suite covers curriculum consistency, security invariants, privacy boundaries, agent orchestrator states, question formats, adaptive difficulty transitions, and multi-board rotation:

```bash
# Run full automated test suite (221 tests)
npm test

# Run static type checks
npx tsc --noEmit

# Run linter
npm run lint

# Build production bundle
npm run build
```

---

## 8. Getting Started Locally

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
