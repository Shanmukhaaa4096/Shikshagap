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
| `GEMINI_API_KEY` | Optional | Google Gemini API key used for generation and 768-dim embeddings (`gemini-embedding-001`). When absent, the system operates deterministically on code-gate fallback with zero crashes. |
| `SUPABASE_URL` | Optional | Supabase project URL for pgvector question memory and shared reports. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional (Server Only) | Supabase service role key (bypasses RLS). STRICTLY SERVER-SIDE: never use `NEXT_PUBLIC_` or expose to browser. |
| `DATABASE_URL` | Optional | PostgreSQL connection string for persistent teacher accounts and classrooms. |
| `CRON_SECRET` | Recommended in prod | Secret token securing automated upkeep routes (`/api/cron/memory-upkeep`). |
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

## 7. Persistent Question-Memory RAG & Operating Guide

ShikshaGap features a persistent Question-Memory RAG (`src/lib/db/questionStore.ts`) backed by Supabase Postgres with `pgvector` (production) and a local JSON store (development & offline testing):

### Storage Architecture & Interface
- **Interface Abstraction (`QuestionStore`)**: Seamlessly switches between `SupabaseQuestionStore` (when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured) and `LocalJsonQuestionStore` (when offline or in test suites).
- **Schema & Indexes (`question_memory`)**: Stores question text, answer value, format, difficulty (1–5), board ("CBSE" | "ICSE"), class, concept ID, normalized text hash (`fingerprint`), 768-dimensional embedding vector, and aggregate counters (`times_served`, `times_correct`).
- **Index Optimization**: HNSW cosine distance index on `embedding`, composite btree index on `(board, class, concept_id, difficulty)`, and unique index on `fingerprint`.
- **Security & RLS**: Row Level Security is enabled with **zero public policies**. Access is restricted strictly to server routes using the service role key.

### Write Path: Deduplication & Quality Filtering
- After a generated question passes deterministic operand validation and the blind-solver check:
  1. Computes a canonical SHA-256 fingerprint from normalized text and operands.
  2. Embeds the question text using `gemini-embedding-001` (768 dimensions, L2-normalized).
  3. Checks nearest-neighbor cosine similarity: if similarity $\ge 0.92$ (`DUPLICATE_THRESHOLD`), the duplicate is skipped. Otherwise, it is saved.

### Read Path: Three-Way Utilization
- **Anti-Repetition Prompting**: Nearest stored questions are passed to Gemini inside generation prompts as explicit "do not repeat or closely paraphrase" constraints.
- **Direct Proven Reuse**: When a stored question matches the required concept, board, and difficulty, and has not been seen by the student in the current session, it is served directly, prioritizing low `times_served` items.
- **Empirical Difficulty Calibration**: Once an item reaches 20 attempts (`times_served >= 20`), the adaptive difficulty engine estimates empirical difficulty from `times_correct / times_served` to calibrate question difficulty.

### Operating the Question Memory

#### 1. Running the Database Migration
In the Supabase SQL Editor or via Supabase CLI, run:
```sql
-- Migration file located at: supabase/migrations/20261022000000_question_memory.sql
-- Enables vector extension, creates question_memory table, HNSW indexes, RLS, and match_questions() RPC
```

#### 2. Seeding Question Memory (Idempotent Backfill)
Backfill validated questions across CBSE and ICSE Classes 3–5:
```bash
npm run seed:questions
```
The script computes fingerprints and embeddings for each candidate question. Re-running it is completely idempotent (duplicates are skipped).

#### 3. Flagging Problematic Questions
Teachers can flag bad or ambiguous questions via the protected API:
```bash
POST /api/teacher/flag-question
Content-Type: application/json

{
  "questionId": "00000000-0000-0000-0000-000000000000",
  "reason": "Ambiguous word problem phrasing"
}
```
Setting `flagged = true` instantly excludes the question from all future retrieval and rotation.

#### 4. Wiping Question Memory (Maintenance)
To wipe local development question memory:
```bash
npm run seed:questions -- --wipe
```
Or in Supabase SQL editor:
```sql
TRUNCATE TABLE question_memory;
```

---

## 8. Question Engine Quality Evaluation Script

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
