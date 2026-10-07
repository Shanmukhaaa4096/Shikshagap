# LEGAL AND PRIVACY AUDIT: ShikshaGap

**Date of Audit**: October 2026  
**Jurisdiction**: Republic of India  
**Applicable Statutes**: Digital Personal Data Protection Act, 2023 (DPDP Act 2023) and allied Information Technology Rules  
**System Scope**: ShikshaGap Diagnostic Educational Intelligence Platform (Class 5 Mathematics)

---

## 1. Executive Summary & Context

ShikshaGap processes educational assessment information concerning children (minors under 18 years of age enrolled in primary schools). Under Section 9 of the DPDP Act 2023, data fiduciaries face strict obligations when processing personal data of children, including verifiable parental/guardian consent and a strict prohibition on tracking, behavioral monitoring, or targeted advertising directed at children.

This audit details the architectural and procedural measures implemented across the codebase to ensure complete statutory alignment.

---

## 2. What Was Done

### 2.1 Public Isolation of Child Data
* **Previous Vulnerability**: The root URL (`/`) previously exposed real student names, roll numbers, and diagnostic scores to unauthenticated web visitors.
* **Remediation**: 
  - The live classroom dashboard and all student data were moved behind authenticated access at `/app`.
  - The public landing page (`/`) displays strictly synthetic, illustrative benchmark profiles (`Synthetic Learner A`, etc.).
  - Search engine spiders are disallowed from crawling `/app/` and `/api/` in `robots.txt` and `sitemap.xml`.

### 2.2 India DPDP Act 2023 Compliance Pages
* **`/privacy`**: Plain-language policy detailing every data field collected:
  - Teacher: Institutional name, school email, role, access logs.
  - Student: Name, roll number, assessment responses, diagnosed prerequisite gaps, 5-day remediation progress.
  - Technical: IP address, user-agent, authentication timestamp.
  - Specific retention windows (academic cycle + 30 days post-remediation).
  - Explicit declaration of no behavioral profiling and zero third-party data monetization.
* **`/terms`**: Clear disclaimer stating ShikshaGap is an independent academic diagnostic tool not officially affiliated with or endorsed by the Ministry of Education, State Boards, or PM SHRI schools.
* **`/cookies`**: Documentation that only strictly necessary session storage is used (no analytics or advertising cookies).
* **`/data-request`**: Public grievance mechanism enabling parents, teachers, and school heads to file Access, Correction, or Erasure requests under Section 12 of the DPDP Act 2023.

### 2.3 AI Disclosure & Pseudonymization
* **Zero Child Names Sent to Gemini**: In `/api/assessment/agent`, child names and roll numbers are stripped before calling `@google/genai`. In their place, an ephemeral pseudonymous identifier (`anon_[random_hex]`) is transmitted.
* **Non-Evaluative Decision Support**: Prominent disclaimers accompany all AI diagnostic tags, stating that outputs are diagnostic decision support for educators and never a final or binding assessment of a child.

### 2.4 Removal of Unverifiable Marketing Claims
* Removed claims implying government endorsement (e.g. unauthorized "PM SHRI" tags).
* Removed absolute marketing superlatives ("100% evaluated", "instant root cause fix") in favor of precise pedagogical terms ("AI-assisted diagnostic decision support").

---

## 3. Third-Party Service Audits

| Service | Category | Data Transmitted | Privacy & Compliance Assessment |
| :--- | :--- | :--- | :--- |
| **Vercel** | Hosting & Edge Compute | IP address, HTTP headers, request paths | Host processor agreement required; server logs purged per standard edge retention. |
| **Google Cloud Gemini (`@google/genai`)** | AI Inference Engine | Pseudonymous student IDs, math responses, topic tags | API agreement must guarantee that API inputs are not used for public model retraining. |
| **Google Fonts (via `next/font`)** | Typography | None at runtime (self-hosted at build time) | Completely zero data leak to Google servers at runtime. |
| **Phosphor Icons** | Vector UI Icons | Local React SVG components | 100% client bundle; zero network calls. |

---

## 4. What Is Assumed

1. **School / Institutional Authority**: It is assumed that schools deploying ShikshaGap act as lawful institutional data processors, maintaining requisite guardian notification or consent through school admission agreements.
2. **Local Storage Integrity**: It is assumed that client hardware in government schools is password-protected and shared terminals use private browsing or log out between sessions.

---

## 5. "Needs a Lawyer" (Legal Review Checklist)

The following items involve legal policy decisions that require sign-off by qualified legal counsel in India:
1. **Verification of Guardian Consent Mechanism**: Formalizing whether school enrollment bylaws constitute sufficient statutory basis under the DPDP Act 2023 Rules for diagnostic formative assessments, or if a physical signed consent slip is mandated.
2. **Data Processing Agreement (DPA)**: Execution of an enterprise B2B Data Protection Agreement with Google Cloud securing strict DPDP Act Section 9 compliance for API calls.
3. **Formal Grievance Redressal Officer Appointment**: Designating a named Data Protection Officer (DPO) and registered Indian address as required by Section 10/12 of the DPDP Act.
