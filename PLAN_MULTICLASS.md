# PLAN_MULTICLASS.md — Multi-Class Support & Landing Page Implementation Plan

## 1. Overview & Objectives
ShikshaGap currently has hardcoded references to Class 5 / Class 5A (36 students) in its demo data, assessment agent, curriculum topics, headers, and landing page.
This plan details how to systematically transition ShikshaGap into a multi-class system with verified support for Class 3, 4, and 5 mathematics, while cleanly marking Classes 1, 2, 6, 7, 8+ as "Coming soon".

---

## 2. Order of Implementation

### Step 1: Typed Curriculum Configuration (`src/lib/curriculum/`)
- Create `src/lib/curriculum/classes.ts`:
  - Definition of all elementary & middle school grades: Class 1 to 8.
  - Enabled classes: Class 3 (`class_3`), Class 4 (`class_4`), Class 5 (`class_5`).
  - Disabled classes with "Coming soon": Class 1, Class 2, Class 6, Class 7, Class 8.
  - Per-class curriculum metadata: class ID, label, grade number, subject, topics list, target concepts, student count defaults, and section defaults.
  - Verification that the unified concept DAG (`CONCEPTS` in `src/lib/concepts/graph.ts`) remains a single acyclic graph spanning Class 3 to 5 so cross-class prerequisite backtracking works seamlessly across grades.
  - No guessed syllabus for disabled classes.

### Step 2: Parameterize the Core Engine & Data Models
- Update `src/lib/types.ts`:
  - Support `classId` / `grade` parameter across `AssessmentAgentState`, `Classroom`, and API payloads.
- Update `src/lib/data/demo.ts`:
  - Create seeded demo data for Class 3A, Class 4A, and Class 5A, clearly labelled "Demo data".
  - Make student lists, roll numbers, and classroom metadata config-driven by class ID.
  - Implement helper `loadStudents(classId?: string)`.
- Update `src/lib/engine/diagnostic.ts` & `src/lib/engine/remediation.ts`:
  - Update `initAssessmentAgent` to accept `classId` / `grade` and select appropriate class topics.
  - Ensure topic summaries and stopping criteria respect the active class.
- Update `src/app/api/assessment/agent/route.ts`:
  - Whitelist allowed class IDs (`class_3`, `class_4`, `class_5`) in validation.
  - Ensure system instructions for Gemini are dynamically parameterized by grade level.

### Step 3: UI Selectors & Component Integration
- Add a compact class selector (`ClassSelector.tsx` using native/Radix accessible select & pill buttons) with large touch targets.
- Integrate class selection into:
  - Landing page interactive demo.
  - Teacher dashboard header and student filters.
  - Student assessment initialization screen.
  - Worksheet preview and print modal.
- Implement strictly necessary storage persistence (`localStorage` key: `sg_selected_class`).

### Step 4: Pilot School Registration API & Storage
- Create pilot registration route (`/api/pilot-register`) with:
  - School name, teacher name, class range, contact info (phone/email).
  - Anti-bot honeypot field (`website_url` / hidden input).
  - In-memory rate limiting (max 5 submissions per minute per IP).
  - Server-side validation.
  - Safe storage: Append to audit log / JSON store under server data storage with DPDP privacy notice.
  - Integration with privacy policy and data request flows.

### Step 5: Landing Page Overhaul (Sections in Specified Order)
1. Sticky Navbar: Logo, max 4 links (Demo, How It Works, FAQ, Teacher Sign In), mobile drawer, language switcher.
2. Language Switcher: EN / हिन्दी / తెలుగు.
3. Hero: Compact headline, CTAs, no badge claims (moved to trust strip).
4. Problem & Solution Strip: Two clean columns highlighting the 42% marks dilemma vs. root-cause prerequisite tracing.
5. Product Demo: 5-step demo interactive with Class 3/4/5 selector.
6. Trust Strip: DPDP 2023 compliant, no tracking cookies, works on low-cost devices.
7. Bento Grid Features: 4 feature cards in unequal tiles with focused visuals.
8. Worksheet Preview: 1-page paper-style printable sheet preview for the selected class.
9. Stats Row: True config-derived facts (languages, classes enabled, topic range, 0 tracking cookies).
10. Pilot Form: School signup form with validation, honeypot, and privacy notice.
11. FAQ Accordion: Single-open accordion including question on multiple classes.
12. Final CTA Banner: Clear heading, subhead, and two buttons.
13. Footer: Two-column desktop footer with all legal links and copyright.

### Step 6: Language & Content Standardization
- Update `dict.ts` across English, Hindi, and Telugu to be class-neutral (Classes 3 to 5).
- Ensure zero em dashes (`—` / `–`) across all text, translations, and comments.
- Ensure Lucide icons only (no emojis).
- Ensure strict 5-color palette: Red, Sage Green, Cream, Clay/Tan Orange, Dark Brown/Charcoal.

### Step 7: Tests & Verification
- Unit & integration tests in `tests/`:
  - Class parameter validation.
  - Multi-class DAG traversal and prerequisite backtracking.
  - Worksheet generation for Class 3, 4, and 5.
  - Fallback / "Coming soon" state for disabled classes.
- Full verification: `npm test`, `tsc --noEmit`, `npm run lint`, `npm run build`.

---

## 3. What We Will NOT Do
- We will NOT invent or hallucinate syllabus for Classes 1, 2, 6, 7, 8+. They are marked as "Coming soon".
- We will NOT add third-party analytics or tracking cookies.
- We will NOT introduce off-palette colors or purple gradients.
- We will NOT use emojis or em dashes anywhere.
- We will NOT weaken API validation or deterministic mathematical truth.
- We will NOT delete legal pages, DPDP notices, or security headers.
