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

## 2. Multi-Class Curriculum & Multi-Board Architecture

ShikshaGap features a modular, data-driven curriculum system (`src/data/curriculum/`) supporting **Classes 1 through 10** mapped strictly to official public syllabi from **NCERT** (`ncert.nic.in`) and **CISCE** (`cisce.org`):

### Concept Dependency Graph (DAG)
- **180 Concepts Registered**: Complete trilingual coverage in English, Hindi, and Telugu.
- **229 Prerequisite Edges**: Strictly acyclic directed graph with deep cross-grade and cross-board prerequisite links.
- **Deep Backtracking**: Gap diagnosis traces foundational root causes across grade boundaries (e.g. Class 10 Quadratic Equations backtracks through Class 9 Polynomials → Class 8 Factorisation → Class 7 Expressions → Class 6 Algebra Basics → Class 5 Multiplication → Class 4 Facts → Class 3 Addition → Class 2 → Class 1).
- **Class Bands**:
  - **Band 1-2**: Early numeracy, counting, place value to 100, addition/subtraction, shapes, time, money.
  - **Band 3-5 (Active Interactive Testing)**: Scored diagnostic assessment, multi-digit operations, fractions, division sharing, measurement, data handling, and 1-page paper worksheets.
  - **Band 6-8**: Integers, fractions/decimals, ratio & proportion, algebra basics, geometry, mensuration.
  - **Band 9-10**: Polynomials, linear equations, coordinate geometry, trigonometry, statistics, probability, quadratic equations, arithmetic/geometric progressions.

### Multi-Board Filtering (CBSE & ICSE)
- **CBSE (NCERT)**: 100% CBSE-sourced questions (`ncert`, `exemplar`, `cbse_reference`) with 0% ICSE leakage.
- **ICSE (CISCE)**: 100% ICSE-sourced questions (`icse_selina`, `icse_foundation`) with 0% CBSE leakage.
- **Both**: Balanced, deterministic alternation between boards.
- **Server-Side Guard**: Every question carries verified board provenance enforced by API route validation.

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

## 6. Curriculum Knowledge RAG (Retrieval-Augmented Generation)

ShikshaGap integrates a Knowledge RAG system (`src/lib/rag/`) to ground Gemini in authentic Indian primary mathematics curriculum content:

### Grounding Scope: What RAG Is and Is Not Used For
- **What Retrieval Influences**: Hints, misconception explanations, 5-day targeted remediation plans (incorporating zero-cost manipulative activities like paper folding, seed counters, and chalk grids), and question level/style generation.
- **What Retrieval NEVER Does**: Retrieval **never** evaluates or decides whether an answer is mathematically correct. All answer verification and scoring remains 100% deterministic (verified by programmatic mathematical checks and blind-solver validation).

### Corpus Architecture & Build-Time Validation
- **Corpus Files (`data/knowledge/`)**: 92 curated chunks (60 NCERT + 32 ICSE) covering every Class 5 concept in the curriculum DAG and prerequisite ancestors. Every chunk is strictly 200–400 words, original pedagogical content (no verbatim textbook copying), tagged with license (`"own"` | `"open"` | `"permission"`), and validated via Zod (`src/lib/rag/schema.ts`).
- **Fail-Safe Build Hook (`scripts/validateCorpus.mjs`)**: Automatically validates all chunks during `prebuild` and `npm test`. Fails the build immediately if any chunk references a `conceptId` not in the DAG or lacks a license.

### Embedding Pipeline & In-Memory Cosine Retriever
- **Embedding Script (`scripts/buildEmbeddings.mjs`)**: Generates 768-dimensional L2-normalized vectors using `@google/genai` model `gemini-embedding-001` with `taskType: "RETRIEVAL_DOCUMENT"`, rate-limiting backoff, and SHA-256 content-hash caching.
- **Offline / Vercel Readiness (`data/embeddings.json`)**: Pre-computed vectors are committed so builds on Vercel do not require API keys at build time.
- **Strict Board Isolation**: Hard metadata filtering ensures ICSE queries retrieve only ICSE chunks, and NCERT/CBSE queries retrieve only NCERT chunks.
- **Prerequisite Backtracking**: Searches encompass prerequisite concept chains in the DAG when diagnosing foundational gaps.
- **Measured Accuracy**: Evaluated on 30 labelled test queries (`tests/fixtures/labelled-queries.json`), achieving **100.0% Hit@4 (30/30)**.
- **Privacy & Fail-Safe Fallback**: Zero student names, roll numbers, or answers are ever embedded. If `GEMINI_API_KEY` is absent, `retrieve()` returns `[]` without throwing and the app degrades gracefully to code-gate behavior.

---

## 7. Question Engine Quality Evaluation Script

Run the automated quality evaluation script to verify mathematical accuracy, range compliance, blind-solver agreement, and format variety:

```bash
# Generate 300 questions per class (Classes 3, 4, 5) and produce docs/QUALITY_REPORT.md
npm run eval:questions
```

Review the resulting analysis at [`docs/QUALITY_REPORT.md`](file:///c:/Users/pbala/shikshagap/Shikshagap/shikshagap/docs/QUALITY_REPORT.md).

---

## 8. Run Tests

The test suite covers curriculum consistency, security invariants, privacy boundaries, agent orchestrator states, question formats, adaptive difficulty transitions, multi-board rotation, and RAG retrieval:

```bash
# Run full automated test suite (320 tests)
npm test

# Run RAG retrieval test specifically
npm run test:rag

# Run static type checks
npx tsc --noEmit

# Run linter
npm run lint

# Build production bundle (includes prebuild corpus validation)
npm run build
```

---

## 9. Getting Started Locally

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
