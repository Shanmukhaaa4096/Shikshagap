export interface FAQItem {
  q: string;
  a: string;
}

export const FAQS: FAQItem[] = [
  {
    q: 'What is ShikshaGap and who is it for?',
    a: 'ShikshaGap is a free teaching tool created for Indian government-school teachers and students. It is designed for primary mathematics teachers across Classes 3 to 5 who want to find why a student is struggling and what skill they need to learn next.'
  },
  {
    q: 'Which classes are supported?',
    a: 'Classes 3, 4, and 5 mathematics are fully supported today with verified syllabus topics, cross-grade gap backtracking, and 1-page printable worksheets. Classes 1, 2, 6, 7, 8, 9, and 10 are in preparation and clearly marked Coming soon.'
  },
  {
    q: 'How does it help a teacher in a real classroom?',
    a: 'When a child scores 42% on a Class 5 test, the teacher often cannot tell which earlier concept is missing. ShikshaGap traces the gap back to the missing prerequisite from Class 3 or 4 and gives the teacher a clear 5-day practice plan.'
  },
  {
    q: 'Does it replace the classroom teacher?',
    a: 'No. ShikshaGap is built to support the teacher, not replace them. The teacher decides which topics to practice, when to check again, and how to teach their students.'
  },
  {
    q: 'Which languages are supported?',
    a: 'ShikshaGap supports English, Hindi, and Telugu across the entire application, including student questions, hints, and printable practice sheets.'
  },
  {
    q: 'How is student privacy protected under Indian law?',
    a: 'ShikshaGap is built following Digital Personal Data Protection Act 2023 principles. Student session progress stays on your local device. We do not use tracking cookies or ad trackers. Questions and remediation plans are generated using Google Gemini with anonymous concept-level prompts containing zero student names or roll numbers.'
  },
  {
    q: 'Can a teacher use it on a simple phone or with slow internet?',
    a: 'Yes. The interface uses lightweight pages, fast local storage, and large touch targets designed for inexpensive Android smartphones and tablets commonly used in schools.'
  }
];
