# ShikshaGap (शिक्षा-गैप / శిక్షా-గ్యాప్)
**AI-Powered Learning Gap Detection and Personalized Remediation System for Indian Government Schools**

![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19.3-blue?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat&logo=tailwind-css)

---

## 1. Problem Statement
In classrooms of 30–60+ students, traditional evaluations produce marks (e.g., *42% in Mathematics*), but fail to tell teachers **why** a student is struggling or **which foundational prerequisite concept is missing**. 

For example, a Class 5 student who cannot solve long division is usually not struggling with division itself, but with **multiplication table fluency** or **subtraction regrouping**. Without diagnosing the root cause, standard repeated practice on division fails.

**ShikshaGap** converts:
$$\text{Marks} \longrightarrow \text{Learning Intelligence} \longrightarrow \text{Targeted Action}$$

---

## 2. Core Diagnostic Loop

```
Assess ──► Diagnose ──► Find Root Cause ──► Personalize ──► Recommend ──► Reassess
```

1. **What does the student know?** Tracked through Bayesian mastery accumulation ($P(M|E)$).
2. **What concept is the student struggling with?** Observed curriculum symptom (e.g. Long Division).
3. **What prerequisite concept is causing the difficulty?** Backtracked along the mathematical dependency graph (e.g. Multiplication facts or Subtraction regrouping).
4. **How severe is the gap?** High, Medium, or Low severity.
5. **What should the student learn next?** A personalized 5-day action plan using concrete, zero-cost manipulatives (tamarind seeds, broom sticks, paper folding).
6. **What should they practice?** Parameterized adaptive items and printable 1-page paper worksheets.
7. **When should they be reassessed?** Automatic reassessment after 5 days to prove gap closure.

---

## 3. Key Capabilities

- **Adaptive Diagnostic Agent**: Real-time prerequisite backtracking during assessment. If a student misses an item, the agent dynamically selects foundational prerequisite probes to isolate root causes.
- **Trilingual Localization**: Instant switching between **English**, **हिन्दी (Hindi)**, and **తెలుగు (Telugu)**.
- **Teacher Dashboard**:
  - Class-wide overview for Class 5A (36 students) in PM SHRI Government Primary School.
  - Priority intervention table highlighting blocked prerequisites and root causes.
  - Aggregate learning gap distribution.
  - Full Class Mastery Matrix across Class 3–5 concepts.
- **Interactive Student Diagnostic Profile**:
  - Root-cause explanation & visual backtracking chain.
  - Evidence trail showing exact questions, student answers, and identified misconception bugs.
  - Interactive 5-day action plan with progress checkboxes.
- **Printable Remediation Worksheets**: Formatted 1-page worksheets ready for classroom distribution or homework.

---

## 4. Concept Dependency Graph (Class 3–5 Math)

```
Number Sense
    └── Place Value
            ├── Addition
            │      └── Subtraction
            │             └── Division Concept ──► Fraction Basics ──► Equivalent Fractions
            └── Multi-Digit Mult                       │                        ├── Comparing Fractions
                     ▲                                 │                        └── Fraction Addition
                     │                                 ▼
              Mult Facts ◄── Mult Concept ──► Division Facts ──► Long Division
```

---

## 5. Getting Started

### Prerequisites
- Node.js 18+ or 20+

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/Shanmukhaaa4096/Shikshagap.git
cd Shikshagap

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **UI & Styling**: [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Lucide React](https://lucide.dev)
- **Language**: TypeScript (strict type checking)
- **AI Engine**: Prerequisite DAG traversal, Bayesian mastery estimation, and Gemini API integration (`@google/genai`)
