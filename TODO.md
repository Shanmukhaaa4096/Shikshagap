# ShikshaGap Audit, Fix and Mobile Optimization Tracking

## Priority 1: Fix the Assessment Journey
- [x] Create public guest assessment route (`/assessment`) allowing trial without login
- [x] Align landing page CTAs ("Assess Test", "Start Assessment") to `/assessment`
- [x] Verify middleware: preserve auth protection for teacher data (`/app`, student records, admin exports), allow public guest trial on `/assessment`
- [x] Handle state transitions: loading, empty, error, timeout, and retry with clear visual feedback
- [x] Prevent duplicate submissions on answer buttons and submission handlers (`disabled={isEvaluating || Boolean(feedback)}`)
- [x] Support back navigation, refresh recovery, and safe answer state persistence in local session (`sessionStorage` rehydration)

## Priority 2: Genuine Adaptive Diagnostic Engine & Prerequisite Tracing
- [x] Implement prerequisite investigation when student struggles at Level 2 (e.g. division -> multiplication facts / division concept; fractions -> fraction basics; place value -> number sense via `getPrerequisiteForConcept()`)
- [x] Distinguish demonstrated mastery, suspected difficulty, and insufficient evidence with recorded rationale
- [x] Record concrete evidence supporting each diagnosed gap ("Foundational difficulty confirmed: struggle with ... traced to ...")
- [x] Connect identified gaps directly to actionable 5-day classroom remediation plans (`generateRemediationPlan()`)
- [x] Ensure deterministic rule engine is transparent, testable, and robust against API failures (100% template fallback)
- [x] Keep server-side API keys secure and validate LLM outputs via strict code gate

## Priority 3: Mobile Usability & Responsive UI
- [x] Ensure interactive targets are at least 44x44 CSS pixels across all buttons and answer options (`min-h-[44px] min-w-[44px]`)
- [x] Ensure one focused question at a time with large readable text (>= 22px prompt, >= 18px options, no clipping or horizontal scroll)
- [x] Clean, stacked layout on mobile viewports (320px, 360px, 390px, and desktop)
- [x] Fix navigation bar, mobile menu drawer, and floating elements from overlapping content
- [x] Make worksheet and print modal fully responsive and usable on small screens (`grid-cols-1 sm:grid-cols-3`)
- [x] Visible progress indicator (e.g. "Question 3 of 8") and clear Next/Submit controls

## Priority 4: Content Credibility & Audit
- [x] Fix statistics displaying zero or confusing count-ups on landing page (15 Concepts, 03 Languages, 03 Classes, 00 Tracking Cookies)
- [x] Remove misleading or non-functioning links (43/43 links verified HTTP 200 via `check:links`)
- [x] Ensure supported classes (Classes 3, 4, 5) and languages (EN, HI, TE) are consistently represented
- [x] Clearly label sample data and student profile demonstrations
- [x] Verify privacy and contact links

## Priority 5: Language & Accessibility
- [x] Verify full assessment and diagnostic flow across English, Hindi, and Telugu
- [x] Eliminate leftover untranslated strings, mixed-language labels, and clipping
- [x] Ensure WCAG compliant contrast, visible focus rings, and screen-reader accessible form labels
- [x] Ensure colour is never the sole indicator of correctness (icons, badges, text feedback)
- [x] Maintain DPDP 2023 compliance with zero child PII collection

## Priority 6: Testing & Verification
- [x] Add unit tests for adaptive prerequisite selection across answer patterns (`tests/staircase.test.mjs`)
- [x] Add tests for guest assessment journey, state persistence, and error recovery
- [x] Run complete test suite (`npm test` passes 150/150 tests) and type checks (`npm run build` succeeds 0 errors)
- [x] Perform viewport responsiveness audits (320px, 360px, 390px, desktop)
