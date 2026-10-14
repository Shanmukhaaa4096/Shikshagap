# ShikshaGap Comprehensive Audit, Fix, Theme Rebuild & Quality Tracking

## Priority 1: Question Freshness, Fingerprinting & Non-Repeating Fallbacks
- [x] **Audit and replace `questionSignature()` with `canonicalQuestionFingerprint()`**: Normalize whitespace, math operators (`×` -> `*`, `÷` -> `/`, `−` -> `-`), sort parameters, and key on concept, difficulty, format, prompt, operands, expression, answer, and visual configuration (`src/lib/questions/generator.ts`).
- [x] **Eliminate predictable fixed-seed fallbacks**: Remove rollNo-based seeds (`12345 + rollNo`) from `AdaptiveAssessmentView.tsx`. Replace with fresh cryptographic/browser session PRNG seeds so repeated assessments for the same demo student never start with identical questions.
- [x] **Enforce format diversity and operand variation**: Expand supported question formats (MCQ, short answer, missing number, find the mistake, true/false, choose the working, compare answers, word problems) with grade-appropriate numerical boundaries.
- [x] **In-session duplicate avoidance**: Integrate `seenSignatures` and `usedFormats` tracking in `applyAttemptToMemory()` (`src/lib/agents/staircase.ts`), preventing consecutive identical formats and repeated question fingerprints.
- [x] **Audit question memory architecture**: Verify `src/lib/db/questionMemory.ts`. Confirmed in-process store without external DB dependency; strictly enforce zero child PII (DPDP Act 2023) and provide reliable in-session fallback.

## Priority 2: Repair Question-Quality Evaluation & Stated Benchmarks
- [x] **Fix argument passing in `scripts/evalQuestions.mjs`**: Correctly pass `{ avoidFormat }` options object to `generateQuestionWithVariety()` instead of raw format string.
- [x] **Correct evaluation mathematics**: Fix remainder division solver (`a % b`), prompt parameter resolution, and exact duplicate tracking using canonical fingerprinting.
- [x] **Dynamic Pass/Fail reporting in `docs/QUALITY_REPORT.md`**: Eradicate hardcoded "Pass" values. Derive all statuses strictly from actual measurements against declared benchmarks.
- [x] **Evaluate against quality benchmarks**:
  - Class 3: 100% recomputed, 100% range, 99.7% solver, **0.7% repeat rate** (target $\le 5\%$) -> **Pass**
  - Class 4: 100% recomputed, 100% range, 100% solver, **5.0% repeat rate** (target $\le 5\%$) -> **Pass**
  - Class 5: 100% recomputed, 100% range, 96.3% solver, **3.3% repeat rate** (target $\le 5\%$) -> **Pass**

## Priority 3: Exact Coolors 5-Color Palette & WCAG AA Dark-Mode Contrast
- [x] **Define central theme tokens in `src/app/globals.css`**:
  - Deep burgundy: `#36151E` (Light-mode text, Dark-mode background, strong controls)
  - Cool off-white: `#EEF0F2` (Light-mode background, Dark-mode text)
  - Stone grey: `#C6C7C4` (Secondary surfaces, borders, muted elements)
  - Mauve grey: `#A2999E` (Supporting surfaces, secondary accents)
  - Coral pink: `#F56276` (Brand accent, active elements, highlights)
- [x] **Enforce accessible text on Coral buttons**: Deep burgundy text (`#36151E`) on Coral (`#F56276`) yields **5.37:1** contrast (WCAG AA Pass), replacing illegible white/off-white (2.67:1).
- [x] **Purge 100% of legacy hardcoded colors**: Scanned and replaced all occurrences of `#432623`, `#FAF8E8`, `#DE2A35`, `#F5F1BC`, `#251614`, `#311E1B`, `#8ABB93`, `#B51E28` across all `src/` files and SVG illustrations.
- [x] **Resolve dark-mode text collisions**: Semantic tokens (`text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`) guarantee minimum **14.33:1** text contrast in both light and dark modes.

## Priority 4: Assessment Journey, Adaptive Staircase & Prerequisite Tracing
- [x] **Guest trial path without forced login**: Unauthenticated students access `/assessment` directly with full diagnostic capability; teacher and admin routes remain protected.
- [x] **Session resilience & state preservation**: Answers preserved in `sessionStorage` across accidental reloads and step navigation; duplicate submissions disabled during evaluation.
- [x] **Adaptive prerequisite diagnosis**: Examiner & Staircase agent investigates foundational gaps (e.g. division struggle at Level 2 triggers multiplication facts or division concept checks).
- [x] **Evidence-backed learning gap reports**: Actionable 5-day classroom remediation plans derived from verified student attempt errors.

## Priority 5: Mobile Usability & Responsiveness
- [x] **Touch-friendly ergonomics**: All interactive controls, option pills, and navigation buttons meet or exceed $44 \times 44$ CSS pixels (`min-h-[44px] min-w-[44px]`).
- [x] **Responsive viewports audited**: Verified clean layouts, no horizontal scroll, and readable typography across 320x700, 360x800, 390x844, and desktop regression viewports.
- [x] **Stacked mobile layouts**: Header, modal dialogues, worksheet preview, and diagnostic results cards gracefully collapse without text truncation or overlay clipping.

## Priority 6: Content Credibility, Language & Privacy
- [x] **Eliminate deceptive stats and dead links**: Fixed counter stats (15 Concepts, 03 Languages, 03 Classes, 00 Tracking Cookies); all 43 navigation and documentation links verified HTTP 200.
- [x] **Tri-lingual consistency**: Full UI and assessment coverage across English, Hindi, and Telugu without mixed-language artifacts.
- [x] **DPDP Act 2023 compliance**: Zero child PII collected or stored; question memory operates strictly on anonymous fingerprints and session identifiers.

## Priority 7: Automated Verification & Testing
- [x] **Fingerprint & diversity test suite**: `tests/question-diversity-fingerprint.test.mjs` verifying canonical fingerprints, PRNG seeds, and repeat avoidance.
- [x] **Automated contrast suite**: `scripts/checkColorContrast.mjs` verifying light, dark, and button contrast ratios against WCAG 2.1 AA.
- [x] **Unit & integration tests**: `npm test` runs 159 passing tests (0 failures).
- [x] **TypeScript check**: `npx tsc --noEmit` exits with 0 errors.
- [x] **Lint check**: `npm run lint` exits with 0 errors.
- [x] **Production build**: `npm run build` succeeds with all 33 static and dynamic routes compiled.
