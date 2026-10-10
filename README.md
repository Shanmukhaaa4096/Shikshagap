# ShikshaGap (शिक्षा-गैप / శిక్షా-గ్యాప్)
**AI-Powered Learning Gap Detection and Personalized Remediation System for Indian Government Schools**

![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19.3-blue?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat&logo=tailwind-css)

---

## 1. Problem Statement
In classrooms of 30 to 60+ students, traditional evaluations produce marks (e.g., *42% in Mathematics*), but fail to tell teachers **why** a student is struggling or **which foundational prerequisite concept is missing**. 

For example, a Class 5 student who cannot solve long division is usually not struggling with division itself, but with **multiplication table fluency** or **subtraction regrouping**. Without diagnosing the root cause, standard repeated practice on division fails.

**ShikshaGap** converts:
$$\text{Marks} \longrightarrow \text{Learning Intelligence} \longrightarrow \text{Targeted Action}$$

---

## 2. Multi-Class Curriculum Support

ShikshaGap supports **Classes 3, 4, and 5** with fully verified syllabus topics, student cohorts, and 1-page printable worksheets:
- **Class 3**: Number sense, 2-digit subtraction with borrowing, and introduction to repeated addition.
- **Class 4**: Place value up to 10,000, multiplication facts (2 to 9), sharing division, and unit fractions.
- **Class 5**: Multi-digit multiplication, long division with remainders, and equivalent fractions.
- **Classes 1, 2, 6, 7, 8**: Marked as "Coming soon" with disabled states. No unverified syllabus content is invented.

### How to Add a New Class
1. Open `src/lib/curriculum/classes.ts`.
2. Locate the target class configuration in `SUPPORTED_CLASSES` (e.g. `class_6`).
3. Set `enabled: true`, define verified syllabus `topics` and `targetConcepts`.
4. Add prerequisite edges to the concept graph in `src/lib/concepts/graph.ts` ensuring the single unified DAG property is preserved.
5. Add realistic demo cohort data in `src/lib/data/demo.ts`.
6. Enable the grade in `src/app/api/assessment/agent/route.ts` allowed grades whitelist.

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
