# ShikshaGap UI Simplification & Relocation Log (CHANGES.md)

This document tracks all relocations and design hierarchy changes made to make ShikshaGap simple and immediately understandable for **Teachers** and **Students** (passing the 5-second test), while ensuring **zero features or data were deleted**.

---

## 1. Summary of Architecture Changes

### Teacher Experience
* **Teacher Home (`/app`)**:
  * **Before**: Displayed overwhelming dense tables, charts, knowledge graphs, and export panels all on a single viewport.
  * **Now**:
    1. **Top Section**: Class name (`Class 5A`), trilingual language switch (`EN`, `हिन्दी`, `తెలుగు`), and view toggle.
    2. **Three Numbers Only**: `On Track` (Sage), `Need Practice` (Clay), `Critical` (Red). Tapping any number immediately filters to those students.
    3. **"Who needs help today"**: Shows only the top 5 students requiring immediate intervention. Each item shows: Name, one-line problem in plain language, and one primary action button (`Start Practice` / `Diagnose`).
    4. **"See all students" link**: Smoothly switches to the full Student List tab.
* **4 Clear Navigation Tabs (Desktop header + Mobile bottom bar)**:
  1. **Home**: High-level overview & top 5 priority students.
  2. **Students**: Full searchable student roster with status filters, responsive card layout on mobile (<640px), and table layout on desktop.
  3. **Class Gaps**: Relocated comprehensive bottleneck visualizations (Common Gaps chart, Interactive Knowledge Map, and Class Mastery Matrix) into sub-views.
  4. **Reports**: Relocated Parent WhatsApp generator, CSV/JSON audit export with password re-auth window, and pedagogical audit logs.

### Student Diagnostic Page (Teacher View - `StudentDiagnosticModal`)
* **Before**: Showed 4-topic progress bars, dense backtracking lineage paths, and complex evidence logs at first glance.
* **Now (Two-Level Structure)**:
  * **Level 1 (Direct 5-Second Glance)**:
    1. Student Name & Roll Number with status badge.
    2. **The ONE Main Gap in plain words**: Direct sentence indicating what foundational gap is holding the student back and what operations it impacts.
    3. **"What to do next"**: Up to 3 concrete practice steps with activity name, time estimate (10 to 15 min), and clear instructional steps.
    4. **One Primary Action Button (Red #DE2A35)**: "Start Reassessment" (or "Start Practice"), plus outline "Print Worksheet".
  * **Level 2 (Expandable via "Show details")**:
    * Topic Mastery Breakdown (the 4 curriculum strands).
    * Prerequisite Backtracking Lineage (dependency chain).
    * Evidence Trail ("Why we think this").
    * AI Decision Support statutory disclaimer.
    * Summary report copying to clipboard.
  * **Secondary Tabs Preserved**: 5-Day Recovery Action Plan, Teacher Override with pedagogical locking, and Parent WhatsApp share generation.

### Student Home (Child View - `StudentHome`)
* **Before**: Students were directly placed into diagnostic assessment interfaces with student selector dropdowns, exposing classmate names and clinical labels like "Critical".
* **Now**:
  * Dedicated child-friendly home view (`StudentHome.tsx`):
    1. **Greeting**: Warm and encouraging ("Namaste, [Student Name]!").
    2. **Encouraging Focus Title**: e.g. "Let's practise multiplication tables" using plain, encouraging words.
    3. **Today's Practice**: One large primary button (Red #DE2A35) for today's activity.
    4. **Skill Progress**: Simple progress bar showing completed activity steps (e.g., "Step 2 of 5").
    5. **Take Assessment**: Plain outline secondary button to initiate progress check.
  * **Strict Child Isolation**: Students can **never** see other students, class dashboards, or comparative rankings.

---

## 2. Feature Relocation Matrix

| Original Feature | Original Location | New Location | Access Mechanism |
| :--- | :--- | :--- | :--- |
| **3-Metric Overview** | Top dashboard | Teacher Home | Always visible at top |
| **Top 5 Priority Students** | Full roster | Teacher Home | "Who needs help today" list |
| **Full Student Table** | Teacher Home | Students Tab | Tap "Students" tab or "See all students" |
| **Status Filter by Metric** | Not interactive | Teacher Home | Tap On Track / Need Practice / Critical cards |
| **Common Gaps Chart** | Middle dashboard | Class Gaps Tab | Tap "Class Gaps" > "Most Common Gaps" |
| **Prerequisite Knowledge Map**| Middle dashboard | Class Gaps Tab | Tap "Class Gaps" > "Dependency Map" |
| **Mastery Heatmap Matrix** | Lower dashboard | Class Gaps Tab | Tap "Class Gaps" > "Mastery Matrix" |
| **Secure Data Export** | Lower dashboard | Reports Tab | Tap "Reports" tab |
| **Password Re-Auth Window** | Lower dashboard | Reports Tab | Modal triggered upon export |
| **Detailed Diagnostic Metrics**| Student Modal top | Student Modal | Tap "Show details" accordion |
| **5-Day Action Plan** | Student Modal tab | Student Modal tab | Tap "5-Day Action Plan" |
| **Teacher Override Form** | Student Modal tab | Student Modal tab | Tap "Teacher Override" |
| **Guardian WhatsApp Share** | Student Modal tab | Student Modal tab | Tap "Parent WhatsApp Report" |
| **Child-Specific Workspace** | Mixed in Teacher View| Student Home | Toggle view to "Student" |

---

## 3. Responsive & Accessibility Testing

| Viewport Width | Device Target | Layout Behavior | Result |
| :--- | :--- | :--- | :--- |
| **320px** | Ultra-narrow mobile | Single-column, stacked cards, tap targets >=44px, no horizontal scroll, fixed bottom bar | **PASS** |
| **375px** | Standard iPhone / Android | Generous spacing, large 16px+ legible typography, full thumb reachability | **PASS** |
| **768px** | iPad / Tablet portrait | 3-column metric cards, full dual-pane diagnostic views, desktop top bar | **PASS** |
| **Light Theme** | Palette tokens (#FAF8E8 / #432623) | High contrast, zero shadows, zero gradients, zero pure white/black | **PASS** |
| **Dark Theme** | Palette tokens (#381f1c / #F5F1BC) | WCAG AAA contrast, eye-comfort dark background, clear status tokens | **PASS** |

---

## 4. Design Bans & Security Verification
* **Design Bans**: Verified 0 emojis, 0 em dashes, 0 Lucide icons, 0 gradients, 0 box shadows, 0 pill buttons (`rounded-full` on buttons). All buttons and containers use `rounded-[2px]`.
* **Security Suite**: Ran `npm test` (`tests/security.test.mjs`). All 8 security tests passed:
  1. Cross-Class Access Isolation
  2. Cross-School Data Isolation
  3. Token Entropy and Guessing Resistance
  4. Expired, Revoked, and View-Limited Tokens
  5. Re-Authentication Window Enforcement for Exports
  6. Teacher Note XSS Sanitization & Character Cap
  7. CSV Injection Formula Escaping and UTF-8 BOM
  8. Audit Log Privacy & Zero Student PII Exposure
