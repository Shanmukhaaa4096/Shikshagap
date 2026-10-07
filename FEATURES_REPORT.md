# ShikshaGap: Comprehensive Engineering & Features Implementation Report

**Application**: ShikshaGap (Next.js on Vercel at `shikshagap.vercel.app`)  
**Target Users**: Indian government school Class 5 mathematics teachers, academic mentors, and school administrators  
**Environment Constraints**: Low-end Android devices on 2G/3G networks, shared school devices, multi-lingual (English, Hindi, Telugu), strict child data privacy (DPDP Act 2023)  
**Date**: October 2026  

---

## 1. Executive Summary & Deliverables Completed

All nine architectural features and required security, mobile-first, and regulatory enhancements have been implemented in accordance with the system design constraints and palette tokens (`#DE2A35`, `#8ABB93`, `#F5F1BC`, `#DFA06E`, `#432623`).

| Feature | Status | Key Deliverable |
|---|---|---|
| **Feature 1: Roles, Login & Private Dashboard** | Completed | `/app` authenticated dashboard, single-column mobile login with >=16px font inputs (preventing iOS zoom), password toggle, audit-logged login/logout events. |
| **Feature 2: Public Landing Page & Demo** | Completed | Clean landing page at `/` with honest SVG diagnostic traversal flowchart, client-side synthetic demo with "Reset Demo", mobile drawer. |
| **Feature 3: Guardian DPDP Notice Templates** | Completed | Multilingual notices (EN, HI, TE) at `/notices/guardian` adhering to DPDP Act 2023, printable A4 format, Web Share sheet integration, legal review disclaimer. |
| **Feature 4: Offline-First Classroom PWA** | Completed | Palette vector icon, `manifest.json`, scoped service worker `sw.js` (caching app shell only, 0 API caching), IndexedDB/session queue, `wipeLocalSecureData` on logout/expiry. |
| **Feature 5: Parent Reports (Print & WhatsApp)** | Completed | One-page student report at `/report/[token]` using unguessable 128-bit cryptographic tokens (7-day expiry, view limited, no child names in URL), teacher confirmation guard. |
| **Feature 6: Teacher Override on AI Diagnosis** | Completed | Accept, change (with curriculum skill dropdown), or dismiss AI diagnosis; immutable audit history; 500-char sanitized teacher notes; mobile full-width sheet. |
| **Feature 7: Accuracy & Method Page** | Completed | Public `/how-it-works` explaining prerequisite concept mapping, empirical boundaries, AI non-claims, and problem report form. |
| **Feature 8: Data Export** | Completed | Authenticated CSV/JSON export requiring 10-minute recent re-auth, formula injection protection (`=`, `+`, `-`, `@`), UTF-8 BOM (`\uFEFF`) for Hindi/Telugu in Excel. |
| **Feature 9: Admin Audit Log** | Completed | Append-only audit trail at `/app/audit-log` for school admins with action/date filters, self-logging, responsive desktop table and stacked mobile cards. |

---

## 2. Feature-by-Feature Details

### Feature 1: Roles, Login and Private Dashboard (`/app`)
- **Roles**: Structured for `teacher` and `school_admin`.
- **Skipped / Rationale**: Standalone `student` login accounts were deliberately skipped for this Class 5 primary school release. Class 5 students (ages 9–10 in rural government schools) do not maintain individual email/password accounts; diagnostic assessments are administered under direct teacher facilitation on shared classroom tablets.
- **Form Inputs**: Single-column login layout with `text-base sm:text-xs` (16px minimum on mobile devices) preventing automatic mobile Safari/Chrome viewport zoom. Inputs include standard `autocomplete="email"` and `autocomplete="current-password"` for password manager compatibility.
- **Session Security**: Session expiration redirects to `/login` while preserving draft changes in local session state. Login attempts and logouts are logged to the immutable audit store with one-way salted IP hashing.

### Feature 2: Public Landing Page & Sample Demo (`/`)
- **Honest Methodology Diagram**: Flowchart drawn entirely in code using palette tokens (no drop shadows, no gradients) showing:
  `Step 1: Class 5 Math Item` &rarr; `Step 2: Error Clustering` &rarr; `Step 3: Graph Traversal` &rarr; `Step 4: Teacher Override`.
- **Client-Side Synthetic Demo**: Contains three clearly labelled synthetic learner profiles (`Synthetic Learner A`, `B`, `C`). Runs 100% in-memory with zero calls to production records or AI endpoints.
- **Reset Demo**: Dedicated button to reset the demo state without leaving demo mode.
- **Mobile Navigation**: Sticky header with responsive hamburger drawer button (minimum 44x44px touch target) collapsing cleanly on small screens.

### Feature 3: Guardian Notice Templates (`/notices/guardian`)
- **Statutory Alignment**: Drafted under Section 6 of the Digital Personal Data Protection Act (DPDP Act) 2023.
- **Multilingual Support**: Available in English, Hindi (हिन्दी), and Telugu (తెలుగు) with dynamic school name and grievance officer configuration.
- **Print & Share**: Print-specific stylesheet formatted for clean A4 printing on standard school printers; system Web Share API (`navigator.share`) fallback for mobile sharing.
- **Legal Warning**: Prominently marked in-file and in `LEGAL_AUDIT.md` that notices are drafts requiring formal advocate review prior to institutional deployment.

### Feature 4: Offline-First PWA for Shared Classroom Devices
- **Manifest & Icons**: `public/manifest.json` and palette SVG icon `public/icon.svg` drawn using `#DE2A35` and `#FAF8E8`.
- **Scoped Service Worker (`public/sw.js`)**: Scoped strictly to app shell assets, fonts, and static bundles. Bypasses all `/api/*`, `/app/*`, and authenticated student endpoints.
- **No Plaintext Child PII in Storage**: `wipeLocalSecureData()` wipes all cached session records on logout, session expiration, and role change.
- **Offline Sync Banner**: Real-time component (`OfflineSyncBanner.tsx`) displays connectivity status, queued offline actions count, and shared-device security warnings ("Shared Device: Remember to Log Out").

### Feature 5: Parent-Friendly Reports (Print & WhatsApp)
- **Token Cryptography**: Random 128-bit cryptographic tokens (16-byte hex strings via `crypto.randomBytes(16)`), providing $2^{128}$ combinations that make link guessing mathematically impossible.
- **Link Restrictions**: 7-day automatic expiry, max 20 view threshold, teacher revocability, access logged with zero student PII in log text.
- **Zero URL PII**: URL path `/report/[token]` contains only the random hex token—never student roll numbers, names, or class IDs.
- **Teacher Confirmation Modal**: Requires explicit affirmation: *"I confirm that I am sharing formative mathematics diagnostic feedback solely with this child's lawful parent or guardian."*
- **WhatsApp Pre-filled Text**: Pre-filled text uses only the student's first name, learning progress note, and secure link:
  `Namaste. Here is the Class 5 mathematics learning progress note for [FirstName]: https://shikshagap.vercel.app/report/[token]`

### Feature 6: Teacher Override on AI Diagnosis
- **Pedagogical Authority**: Teachers can Accept, Change (selecting an alternate prerequisite skill from the official curriculum graph), or Dismiss an AI gap recommendation.
- **Immutable Log**: Original AI diagnosis is never overwritten; all teacher determinations are stored with timestamp, teacher ID, and decision type.
- **Sanitized Notes**: Plain-text notes capped at 500 characters, stripped of HTML/script tags to prevent XSS.
- **Visual Label**: Overridden diagnoses display an explicit *"Overridden by Teacher"* indicator on student profile cards.

### Feature 7: Accuracy & Method Page (`/how-it-works`)
- **Scientific Honesty**: Clarifies that the prerequisite diagnostic graph represents cognitive competency mapping rather than infallible AI grading.
- **No Fabricated Benchmarks**: Strictly avoids unsupported claims; acknowledges that multi-school empirical validity studies are currently in pilot review.
- **Feedback & Reporting Form**: Interactive "Report a Discrepancy" form allowing educators to report inaccurate question-skill mappings without transmitting student PII.

### Feature 8: Data Export
- **Re-Authentication Window**: Enforces that the requesting user must have authenticated within the preceding 10 minutes (`hasRecentAuth`). Unauthenticated or stale sessions receive HTTP 401 `REAUTH_REQUIRED`.
- **CSV Injection Defense**: Cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` are prepended with a single quote (`'`), neutralizing spreadsheet macro execution in Microsoft Excel and LibreOffice Calc.
- **Indic Script Support**: Prepends UTF-8 Byte Order Mark (`\uFEFF`) to CSV exports, ensuring Hindi and Telugu characters render without corruption in Windows Excel.
- **Audit Logging**: Every export event logs teacher/admin ID, record count, and scope.

### Feature 9: Admin Audit Log (`/app/audit-log`)
- **Append-Only Store**: In-memory audit trail with zero update/delete capabilities.
- **PII Redaction**: Logs record `timestamp`, `userId`, `userRole`, `schoolId`, `action`, `ipHash` (SHA-256 salted hash), and high-level operational descriptions. Strictly zero student names, scores, notes, or tokens are logged.
- **Self-Auditing**: Querying the audit log itself emits a `view_audit_log` event.
- **Role Isolation**: Only `school_admin` users can access `/app/audit-log` or `/api/admin/audit-log`. Cross-school log queries are strictly blocked.

---

## 3. Mobile Viewport Verification Results

All interfaces were verified against the mobile design constraints:

| Viewport Width | Device Archetype | Test Results & Observations |
|---|---|---|
| **320px** | Low-end Android (JioPhone Next / Redmi Go) | - Zero horizontal page scroll.<br>- Navigation drawer opens full width with >=44px tap targets.<br>- Student roster and audit log tables stack into vertical cards.<br>- Forms maintain 16px inputs to prevent viewport zooming.<br>- Action buttons stack vertically with 8px spacing. |
| **375px** | Standard Mobile (iPhone SE / Samsung Galaxy A14) | - Hero section fits one screen cleanly.<br>- Diagnostic breakdown renders stacked competency bars.<br>- Parent report displays clear typography with comfortable padding.<br>- WhatsApp sharing link fits cleanly without button overflow. |
| **768px** | Classroom Tablet (Lenovo Tab M8 / iPad Mini) | - Dashboard displays dual-column layout (Summary Cards + Roster).<br>- Audit trail renders tabular grid with filter toolbar.<br>- Synthetic demo displays side-by-side competency explorer.<br>- Modals center cleanly with backdrop overlay. |

---

## 4. Design Ban Compliance Checklist

- [x] **No shadows**: Verified via codebase grep (`box-shadow` and `shadow-*` banned; only `shadow-none` allowed).
- [x] **No gradients**: Verified via codebase grep (`bg-gradient-*` banned).
- [x] **No emojis**: Verified via regex search; clean ASCII / Unicode mathematical symbols only (`✓`, `●`, `○`).
- [x] **No Lucide icons**: Verified via grep (`lucide-react` imports banned; `@phosphor-icons/react` used consistently).
- [x] **No em dashes (`—`)**: Verified via grep (`—` replaced with colons, parentheses, or hyphens).
- [x] **No rounded-full / pill buttons**: Verified via grep (`rounded-full` replaced with `rounded-[2px]`).
- [x] **Radius 0 to 2px**: Standardized across buttons, cards, badges, and modals.
- [x] **Palette Tokens Only**: `#DE2A35` (red), `#8ABB93` (sage), `#F5F1BC` (cream), `#DFA06E` (clay), `#432623` (brown).
- [x] **No Inter / Geist / Space Grotesk**: System serif and monospace fonts used with `font-display: swap`.
- [x] **No pure white (`#FFFFFF`) or pure black (`#000000`)**: Uses `#FAF8E8` and `#432623` (except print media stylesheets for white paper printing).

---

## 5. Known Limitations & Architecture Recommendations

1. **In-Memory Store vs Production Database**:  
   The current audit log, share tokens, and teacher overrides are maintained in-memory in `src/lib/server/store.ts`. For multi-server serverless deployments across multiple Vercel instances, this in-memory store should be backed by an encrypted Postgres database (e.g. Neon, Supabase, or AWS RDS) with row-level security (RLS).
2. **Encrypted Client Storage**:  
   While `wipeLocalSecureData()` purges all local state on logout and session expiration, prolonged offline caching of student records in PWA mode will benefit from Web Crypto API AES-GCM encryption with session keys in browser memory.
3. **SMS Fallback for Feature Phones**:  
   WhatsApp sharing relies on `wa.me` links. In rural regions where guardians possess basic feature phones without WhatsApp, integrating a state-approved transactional SMS gateway (CDAC / NIC SMS portal) is recommended for phase 2.
