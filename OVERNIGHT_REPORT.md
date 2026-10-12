# Overnight Autonomous Run Report: Question Engine

## Overview
- Branch: `overnight/question-engine`
- Baseline: commit `2244574` on `main`
- Node version: `v24.18.1`
- Gemini API Key status: No key found in `.env.local` (length 0). All Gemini integration steps are verified using unit test mocks and deterministic fallback mechanisms per instructions.

## Step Summary Table

| Step | Name | Status | Files Touched | Tests Result | Notes / Decisions |
|---|---|---|---|---|---|
| Step 1 | Make failures visible | Done | `src/components/AdaptiveAssessmentView.tsx`, `src/lib/questions/hybridGenerator.ts`, `src/app/api/assessment/agent/route.ts`, `tests/hybrid-generator.test.mjs` | All 63 tests pass | Replaced single client fallback with 1 server retry before showing "Using backup question". Logged 5 fallback reasons (timeout, validation, no_key, budget, rate_limit) with no student data. Added 5 tests. |
| Step 2 | Skill sheet (no question text) | Done | `src/data/skillSheet.ts`, `tests/skill-sheet.test.mjs`, `package.json` | All 68 tests pass | Created NCERT Math-Magic skill sheet covering Classes 3, 4, and 5 with one-sentence outcomes in own words, allowed number ranges for difficulty 1, 2, and 3, diagnostic prerequisites, and explicit needsTeacherCheck flags for newly added or boundary concepts. Added 5 tests. |
| Step 3 | Make the class change the numbers | Done | `src/lib/questions/generator.ts`, `src/app/api/assessment/agent/route.ts`, `src/components/AdaptiveAssessmentView.tsx`, `src/components/WorksheetModal.tsx`, `src/data/skillSheet.ts`, `tests/class-numbers-range.test.mjs`, `package.json` | All 95 tests pass | Added grade parameter across question generators and callers. Number ranges are dynamically read from the skill sheet per grade and difficulty. Added comprehensive range test (200 random questions per class and concept) verifying every number is within range bounds and answers are correct. |
| Step 4 | More Class 3 concepts | Done | `src/lib/types.ts`, `src/lib/concepts/graph.ts`, `src/lib/curriculum/classes.ts`, `src/data/skillSheet.ts`, `src/lib/i18n/keys.ts`, `src/lib/i18n/dict.ts`, `src/lib/questions/generator.ts`, `src/lib/engine/remediation.ts`, `tests/class3-concepts.test.mjs`, `package.json` | All 103 tests pass | Added 4 NCERT Class 3 concepts (addition_3digit, subtraction_3digit, division_sharing, money_math) marked with needsTeacherCheck: true. Added generator implementations with computed answers and misconception distractors across levels 1, 2, 3 in en, hi, and te. Added remediation templates and tests. |
| Step 5 | Fresh wording for every concept | Done | `src/lib/questions/hybridGenerator.ts`, `tests/hybrid-all-concepts.test.mjs`, `package.json` | All 108 tests pass | Extended hybridGenerator to generate varied wording across all concepts (not just 9) using structured Zod schema. Code strictly computes numbers, answers, and wrong options. Prompt includes grade, concept learning outcome from skill sheet, number range, language, runtime theme, and last 5 session questions to avoid repetitive stories or sentence structures. Diagram questions retain visual structure while Gemini generates the problem wording. Added 5 tests. |
| Step 6 | Blind solver and reading level | Done | `src/lib/questions/hybridGenerator.ts`, `tests/blind-solver.test.mjs`, `package.json` | All 114 tests pass | Added blind solver: after Gemini writes a question, a second Gemini call receives ONLY the question text and returns its own computed answer. If answer differs from the code answer, question is rejected and retried up to 3 times before falling back to the deterministic template. Added reading-level limit (Class 3: max 30 words, Class 4: max 40 words, Class 5: max 45 words). Total time budget kept under 4s per question, skipping blind solver if time would exceed budget. Added 6 tests. |
| Step 7 | Fix the study resources | Done | `src/lib/types.ts`, `src/data/resources.json`, `src/data/resources.embeddings.json`, `src/components/AdaptiveAssessmentView.tsx`, `src/lib/agents/errorAnalyst.ts`, `src/lib/agents/examiner.ts`, `tests/examiner-analyst.test.mjs`, `tests/hybrid-generator.test.mjs`, `tests/orchestrator.test.mjs`, `tests/resource-advisor.test.mjs` | All 115 tests pass, 0 lint warnings | Verified that `rankCandidates` uses precomputed embeddings for cosine similarity ranking against the query. Added a unit test proving ranking changes with the query. Ran `npm run check:links` (all 43 resources verified HTTP 200). Added verified Hindi and Telugu resources for fractions, multiplication, and number ops with confirmed 200 URLs. Fixed all 15 ESLint dead-code / unused-var warnings across codebase. |
| Step 8 | Persistent question memory, built safely | Done | `.env.example`, `migrations/001_question_memory.sql`, `src/lib/db/questionMemory.ts`, `src/lib/questions/hybridGenerator.ts`, `src/components/AdaptiveAssessmentView.tsx`, `src/app/api/assessment/report-question/route.ts`, `SPEC.md`, `src/app/privacy/page.tsx`, `src/app/notices/guardian/GuardianNoticeClient.tsx`, `tests/question-memory.test.mjs`, `package.json` | All 121 tests pass | Built PostgreSQL + pgvector schema and TypeScript data layer with safe in-memory fallback when DATABASE_URL is unset. Zero student PII guarantee enforced by runtime checks. Automatic retirement for extreme difficulty and teacher-reported questions. Added 'Report this question' button. Updated SPEC, Privacy Policy, and Guardian Notice with legal review notices. Added 6 tests. |
| Step 9 | Final check and report | Pending | - | - | - |

---

## Decisions Log
- Base branch is `overnight/question-engine`.
- No Gemini API key was present in `.env.local`; all tests use strict unit mocks or fallback generators.
- Step 1:
  - Added one server retry in `AdaptiveAssessmentView.tsx` on failure before switching to the browser template question.
  - Added a visible badge `"Using backup question"` on screen when using a backup question.
  - Added structured fallback reason logging (`timeout`, `validation`, `no_key`, `budget`, `rate_limit`) in `hybridGenerator.ts` and `route.ts`. No student data or identifiers are ever logged.
  - Added tests verifying all 5 fallback reasons in `tests/hybrid-generator.test.mjs`.
- Step 2:
  - Created `src/data/skillSheet.ts` with explicit outcomes in simple words, difficulty 1-3 number ranges, and diagnostic prerequisites for Classes 3, 4, and 5 based on NCERT Math-Magic.
  - Marked newly added and boundary concepts with `needsTeacherCheck: true`.
- Step 3:
  - Added `grade` parameter to `generateQuestion`, `generateUnique`, and all concept generators in `src/lib/questions/generator.ts`.
  - Updated all callers (`/api/assessment/agent/route.ts`, `AdaptiveAssessmentView.tsx`, `WorksheetModal.tsx`).
  - Added `tests/class-numbers-range.test.mjs` running 200 random iterations per class and concept (over 5,400 questions tested) verifying operands remain inside skill sheet ranges and correct answers are mathematically sound.
- Step 4:
  - Added 4 missing NCERT Math-Magic Class 3 concepts: `addition_3digit` (3-digit column addition with carrying), `subtraction_3digit` (3-digit subtraction with borrowing), `division_sharing` (equal sharing division), and `money_math` (rupees transactions, totals and change calculation).
  - Explicitly marked each new concept with `needsTeacherCheck: true` in both `graph.ts` and `skillSheet.ts`.
  - Updated `class_3` curriculum in `classes.ts` to include all 4 concepts in `targetConcepts`.
  - Added translation prompts, options, and hints in English, Hindi, and Telugu (without emojis or em dashes).
  - Added 5-day concrete remediation templates in `src/lib/engine/remediation.ts` for all 4 concepts.
  - Created `tests/class3-concepts.test.mjs` verifying curriculum integration, `needsTeacherCheck: true`, computed answers, and misconception distractors across all 3 levels.
- Step 5:
  - Extended `extractQuestionOperands` in `src/lib/questions/hybridGenerator.ts` to support all concepts across Classes 3, 4, and 5.
  - Added 8 realistic Indian primary contexts as runtime themes (`haat / santhe`, sports day, classroom library, community kitchen, bus ticket counter, tree planting, craft workshop, nature walk).
  - Prompt provides the exact grade, NCERT learning outcome, target number range, language name, runtime theme, and recent session question history to ensure sentence variety and prevent repetitive phrasing.
  - Diagram questions (like visual fractions) preserve their `visual` object while Gemini generates the accompanying question sentence.
- Step 6:
  - Implemented blind solver verification: after wording generation, a second Gemini call receives ONLY the question text (no operands, hints, answer, or curriculum grade).
  - Implemented `normalizeAnswer` handling integer/decimal simplification, fractional answers, and stripping currency terms (₹, Rs., /-, rupees).
  - If blind solver answer mismatches the code-computed answer, question is rejected and retried up to 3 times. If all 3 attempts fail, system falls back to the deterministic question template.
  - Added reading-level limit: 30 words for Class 3, 40 words for Class 4, 45 words for Class 5. Any generated wording exceeding this is rejected and retried.
  - Maintained overall question time under 4 seconds (`totalTimeBudgetMs = 4000`), skipping the blind solver if remaining budget is under 800ms.
  - Added `tests/blind-solver.test.mjs` verifying reading level caps, answer normalization, mismatch rejection and retry, 3-retry fallback, and <800ms solver skip.
- Step 7:
  - Investigated `rankCandidates` and `embeddingsData` in `src/lib/agents/resourceAdvisor.ts`. Confirmed that query embeddings are generated deterministically and compared against saved resource embeddings via cosine similarity to score and rank candidates.
  - Added unit test in `tests/resource-advisor.test.mjs` demonstrating that candidate ranking changes dynamically depending on the student's misconceptions in the query.
  - Ran `npm run check:links`: All 40 existing resources returned HTTP 200 with zero TODOs.
  - Added verified Telugu fractions resource (`res_frac_11`), Hindi 3-digit operations resource (`res_num_11`), and Telugu multiplication resource (`res_mul_11`) with confirmed HTTP 200 endpoints (`https://te.khanacademy.org` and `https://hi.khanacademy.org`). Ran `npm run build:embeddings` to regenerate embeddings. Re-ran `npm run check:links` (all 43 resources verified 200).
  - Added `needsHumanCheck?: boolean` to `EducationalResource` interface in `src/lib/types.ts`.
  - Cleared all 15 ESLint warnings pointing to dead code or unused variables across `AdaptiveAssessmentView.tsx`, `errorAnalyst.ts`, `examiner.ts`, and test files. ESLint now reports 0 errors and 0 warnings.
- Step 8:
  - Created SQL migration `migrations/001_question_memory.sql` setting up `validated_questions` (with pgvector embedding vector(128)), `anonymous_misconception_tallies`, `rate_limit_counters`, and `daily_budget_counters`.
  - Added empty `DATABASE_URL=` to `.env.example`.
  - Implemented `src/lib/db/questionMemory.ts` with zero database provisioning required. If `DATABASE_URL` is unset or database connection fails, the application transparently and safely falls back to in-memory tracking with zero behavioral change or crashes.
  - Enforced strict DPDP privacy check rejecting records with `studentName`, `studentId`, `rollNumber`, or `typedAnswer`.
  - Questions are saved only after passing all generation validations and the blind solver check.
  - Implemented automatic discrimination quality scoring: questions with success rate < 15% (too hard) or > 98% (too easy) are automatically marked `isRetired = true` and excluded from retrieval.
  - Added "Report this question" button (`data-testid="report-question-btn"`) in `AdaptiveAssessmentView.tsx` with backend handler in `src/app/api/assessment/report-question/route.ts`. Reported questions are retired from circulation until manual teacher approval.
  - Updated `SPEC.md`, `src/app/privacy/page.tsx`, and `GuardianNoticeClient.tsx` with notes on anonymised question memory telemetry and comments that legal text requires review by qualified legal counsel.
  - Created `tests/question-memory.test.mjs` (6 tests passing) verifying safe DB fallback, PII rejection, example retrieval, retirement of extreme/reported questions, and anonymous aggregate error tallies.


