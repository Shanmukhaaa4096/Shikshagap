# Comprehensive Legal and Privacy Audit: ShikshaGap

**Date of Audit**: October 2026  
**Jurisdiction**: Republic of India  
**Applicable Statutes**: Digital Personal Data Protection Act, 2023 (DPDP Act 2023) and allied Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules  
**System Scope**: ShikshaGap Diagnostic Educational Intelligence Platform (Class 5 Mathematics)  
**Auditor**: Senior Full-Stack Security & Privacy Reviewer  

---

## 1. Statutory Context & Principles

ShikshaGap processes educational diagnostic data concerning children (minors aged 9–10 enrolled in Class 5 in Indian schools). Under Section 9 of the **Digital Personal Data Protection Act, 2023 (DPDP Act 2023)**:
- A Data Fiduciary must obtain verifiable parental consent before processing any personal data of a child.
- A Data Fiduciary shall not undertake tracking or behavioral monitoring of children or targeted advertising directed at children.
- A Data Fiduciary shall not undertake processing of personal data that is likely to cause any detrimental effect on the well-being of a child.

---

## 2. Compliance Architecture Implemented

### 2.1 Public Isolation of Child Data
- Live student records are strictly restricted to authenticated educators and school heads at `/app`.
- Public landing page (`/`) renders 100% synthetic, illustrative sample profiles (`Synthetic Learner A`, etc.) with zero connection to live school records.
- `robots.txt` and `sitemap.xml` explicitly disallow indexing of `/app/*`, `/api/*`, and `/report/*`.

### 2.2 Guardian Notice Templates under DPDP Act (`/notices/guardian`)
- Server-rendered, printable 1-page notices in English, Hindi (हिन्दी), and Telugu (తెలుగు) detailing:
  1. What data is collected (diagnostic math answers, prerequisite skill gaps).
  2. Why it is collected (classroom remediation plans, not competitive grading).
  3. Who sees it (child's classroom teacher and school head).
  4. Data retention schedule (current academic year plus 30 days).
  5. Grievance redressal procedure under Section 12 of the DPDP Act.
- Physical signature and date block for the school's administrative compliance records.
- Prominent in-template notice stating that the text is a draft requiring advocate approval before institutional deployment.

### 2.3 Parent Report Sharing via WhatsApp
- **128-bit Cryptographic Nonces**: Report links use random 16-byte hex tokens (`/report/[token]`), preventing link prediction or sequential URL guessing.
- **Zero URL PII**: Student roll numbers, names, and school IDs are excluded from shared URLs.
- **Minimal Pre-filled Text**: WhatsApp text (`wa.me`) contains only the child's first name and the secure link. Real scores, diagnostic classifications, and marks are excluded from the pre-filled text.
- **Link Controls**: Expire after 7 days, capped at 20 views, revocable at any time by the classroom teacher.
- **Teacher Confirmation Barrier**: Generates links only after the teacher ticks: *"I confirm that I am sharing formative mathematics diagnostic feedback solely with this child's lawful parent or guardian."*

### 2.4 Teacher Override on AI Diagnoses
- Prevents automated black-box profiling of children.
- Teachers retain final authority to accept, modify, or dismiss AI-identified prerequisite gaps.
- Notes are sanitised, limited to 500 plain-text characters, and access-restricted to the owning teacher and school head.

### 2.5 Data Export Safeguards
- Re-authentication window requires password confirmation within 10 minutes prior to exporting student records.
- CSV injection defenses neutralize formula execution attacks (`=`, `+`, `-`, `@`).
- UTF-8 BOM (`\uFEFF`) ensures regional scripts (Hindi, Telugu) render correctly in Excel without character mangling.
- All exports are recorded in the append-only audit trail.

### 2.6 Append-Only Audit Logging
- Logs user ID, role, action, target record ID, timestamp, and salted SHA-256 IP hash.
- Child names, scores, notes, and plain tokens are strictly excluded from audit log text.
- Append-only structure prevents retroactive tampering or erasure of access logs.

---

## 3. Third-Party Service Data Flow Assessment

| Service | Role | Data Sent | Data Protection Safeguards |
|---|---|---|---|
| **Vercel** | Hosting & Edge Functions | HTTP request metadata, IP address | Enterprise processor agreement; edge logs purged in accordance with standard retention schedules. |
| **Google Cloud Gemini (`@google/genai`)** | AI Diagnostic Assistance | Pseudonymous learner IDs, math responses, topic tags | **Zero student names or school names transmitted.** Ephemeral IDs only. Ensure enterprise zero-data-retention clause is enabled. |
| **Google Fonts** | Typography | None at runtime | Self-hosted at build time via `next/font`; zero client requests to Google font servers. |
| **WhatsApp (`wa.me`)** | Link Referral | First name, secure link | Pre-filled URL parameter; no direct API integration or automated server-to-server messaging. |

---

## 4. "Needs a Lawyer" Checklist (Items Requiring Legal Sign-off)

The following items involve legal policy decisions that require review by a qualified legal advocate in India prior to school deployment:

- [ ] **Guardian Notice & Consent Formalization**:  
  Review the draft notices in English, Hindi, and Telugu at `/notices/guardian` to confirm whether school admission bylaws constitute sufficient legal basis under the DPDP Act 2023, or if signed physical return slips are mandatory in each state.
- [ ] **WhatsApp Sharing Method Evaluation**:  
  Evaluate whether sharing links via WhatsApp (`wa.me`) satisfies institutional data transmission policies for government school students, particularly regarding end-to-end encryption boundaries and message forwarding by guardians.
- [ ] **Google Cloud Data Processing Addendum (DPA)**:  
  Execute a formal B2B Data Processing Addendum with Google Cloud ensuring that queries sent via `@google/genai` are not retained or utilized to train foundation models.
- [ ] **Statutory Data Protection Officer (DPO) Appointment**:  
  Formally designate an institutional Data Protection Officer and publish their official postal address and grievance email in `/privacy` as mandated by Section 10 and Section 12 of the DPDP Act 2023.
- [ ] **Data Retention & Disposal Schedule**:  
  Validate whether the proposed retention period (academic year + 30 days) complies with state Department of School Education directives on student record archival.
