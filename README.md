# ShikshaGap (शिक्षा-गैप / శిక్షా-గ్యాప్)

**AI Agent Learning Gap Diagnostic & Remediation for Primary Schools**

- **Live Production URL**: [https://shikshagap.vercel.app](https://shikshagap.vercel.app)
- **Supported Classes**: Class 3, Class 4, and Class 5 Mathematics
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

## 2. Multi-Class Curriculum Support

ShikshaGap supports **Classes 3, 4, and 5** with syllabus-aligned mathematics topics and 1-page paper worksheets:
- **Class 3**: Number sense, 2-digit subtraction with borrowing, and introduction to repeated addition.
- **Class 4**: Place value up to 10,000, multiplication facts (2 to 9), sharing division, and unit fractions.
- **Class 5**: Multi-digit multiplication, long division with remainders, and equivalent fractions.
- **Classes 1, 2, 6, 7, 8**: Marked as "Coming soon" with disabled states. No unverified syllabus content is added.

---

## 3. Environment Variables

Create `.env.local` based on `.env.example`:

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Optional | Google Gemini API key used by the Examiner and Analyst agents. When absent, the system operates deterministically on code-gate fallback. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Yes (in prod) | Public contact email for footer, terms, and privacy notice. If missing at build time in production, the build fails. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical base URL (default: `https://shikshagap.vercel.app`). |
| `NEXT_PUBLIC_LEGAL_ENTITY_NAME` | Optional | Legal entity name for data fiduciary disclosures. |
| `NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME` | Optional | Grievance officer title/name for DPDP compliance. |
| `SESSION_SECRET` | Recommended in prod | 32-byte secret for HMAC signing of auth session cookies. |
| `IP_SALT` | Recommended in prod | Salt for one-way pseudonymized IP hashing in audit logs. |

---

## 4. Run Tests

The test suite covers curriculum consistency, security invariants, privacy boundaries, agent orchestrator states, and staircase difficulty logic:

```bash
# Run full automated test suite
npm test

# Run static type checks
npx tsc --noEmit

# Run linter
npm run lint

# Build production bundle
npm run build
```

---

## 5. Getting Started Locally

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
