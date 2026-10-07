/**
 * ShikshaGap Remediation Planner
 * Generates actionable 5-day targeted remediation plans tailored to government school
 * classrooms (15 mins/day, low-resource materials, visual anchors).
 */
import type { ConceptId, PlanDay, RemediationPlan, RootCause } from "@/lib/types";
import { CONCEPTS } from "@/lib/concepts/graph";
import { uid } from "@/lib/rng";

interface PlanTemplate {
  conceptId: ConceptId;
  days: {
    title: string;
    activity: string;
    focus: string;
    minutes: number;
  }[];
}

const REMEDIATION_TEMPLATES: Record<ConceptId, PlanTemplate> = {
  number_sense: {
    conceptId: "number_sense",
    days: [
      {
        title: "Day 1: Concrete Number Line Walking",
        activity: "Draw a 0-100 chalk line in the classroom veranda. Have student jump to numbers and identify which is further from zero.",
        focus: "Magnitude comparison",
        minutes: 15,
      },
      {
        title: "Day 2: Place Value Arrow Cards",
        activity: "Use 2-digit number cards. Practice identifying which digit has greater positional weight.",
        focus: "Digit place comparison",
        minutes: 15,
      },
      {
        title: "Day 3: 'Who is Greater?' Partner Game",
        activity: "Roll two 1-9 dice to form two 2-digit numbers. Student announces which is larger and explains why.",
        focus: "Rapid comparison fluency",
        minutes: 15,
      },
      {
        title: "Day 4: Ordering Sets of 4 Numbers",
        activity: "Sort 4 random 3-digit number chits in ascending and descending order on the blackboard.",
        focus: "Multi-number ordering",
        minutes: 15,
      },
      {
        title: "Day 5: Mastery Check & Word Scenarios",
        activity: "5 quick comparison problems involving school bus capacities and story contexts.",
        focus: "Independent verification",
        minutes: 15,
      },
    ],
  },

  place_value: {
    conceptId: "place_value",
    days: [
      {
        title: "Day 1: Bundle of 10s with Sticks",
        activity: "Use neem or broom sticks. Tie bundles of 10 to physically experience that 1 bundle = 10 units, and 10 bundles = 1 hundred.",
        focus: "Base-10 bundling intuition",
        minutes: 15,
      },
      {
        title: "Day 2: Expanded Form Chalk Grid",
        activity: "Break 3-digit numbers into Hundreds + Tens + Ones boxes (e.g. 347 = 300 + 40 + 7) on slate/chalkboard.",
        focus: "Decomposition",
        minutes: 15,
      },
      {
        title: "Day 3: The Zero-Hero Trap",
        activity: "Focus explicitly on numbers with internal zeros like 305 and 4020. Emphasize zero as a place holder.",
        focus: "Zero placeholder misconceptions",
        minutes: 15,
      },
      {
        title: "Day 4: Digit Value vs Face Value",
        activity: "Point to digits in numbers and ask: 'What is its name?' vs 'How much is it worth here?'",
        focus: "Positional value distinction",
        minutes: 15,
      },
      {
        title: "Day 5: Application & Flashcard Check",
        activity: "10 rapid place-value flashcards plus 3 expanded notation problems.",
        focus: "Mastery check",
        minutes: 15,
      },
    ],
  },

  addition: {
    conceptId: "addition",
    days: [
      {
        title: "Day 1: Two-Column Regrouping Board",
        activity: "Draw Tens and Ones columns. When Ones exceed 9, physically push 10 seeds over to the Tens column as 1 ten.",
        focus: "Physical carry-over concept",
        minutes: 15,
      },
      {
        title: "Day 2: The 'Carry Hat' Method",
        activity: "Solve 2-digit addition problems writing the carried '1' in a small circle above the tens digit before adding.",
        focus: "Carrying notation routine",
        minutes: 15,
      },
      {
        title: "Day 3: Find the Mistake Detective Game",
        activity: "Show student sample incorrect work where someone forgot to carry. Have student circle and correct the bug.",
        focus: "Error discrimination",
        minutes: 15,
      },
      {
        title: "Day 4: 3-Digit Addition with Money Context",
        activity: "Practice addition using play currency (₹100, ₹10, ₹1 notes) to reinforce exchange value.",
        focus: "Multi-digit regrouping",
        minutes: 15,
      },
      {
        title: "Day 5: 5-Question Speed Challenge",
        activity: "5 timed column addition problems with varied carry positions.",
        focus: "Fluency verification",
        minutes: 15,
      },
    ],
  },

  subtraction: {
    conceptId: "subtraction",
    days: [
      {
        title: "Day 1: The 'Borrowing Exchange' Story",
        activity: "Use bundles of 10. When you don't have enough loose sticks, untie 1 bundle of 10 and add it to the loose ones.",
        focus: "Concrete borrowing understanding",
        minutes: 15,
      },
      {
        title: "Day 2: Cross Out & Write Above",
        activity: "Practice crossing out the top tens digit (e.g., 5 becomes 4) and writing 10 + current ones digit cleanly.",
        focus: "Standard subtraction algorithm",
        minutes: 15,
      },
      {
        title: "Day 3: Anti-Reverse Subtraction Drills",
        activity: "Target the misconception of subtracting the smaller number from the larger regardless of top/bottom position.",
        focus: "Eliminating reverse-subtraction bug",
        minutes: 15,
      },
      {
        title: "Day 4: Subtraction Across Zeros",
        activity: "Tackle tricky problems like 502 - 138 with step-by-step multi-step exchange.",
        focus: "Borrowing across zero",
        minutes: 15,
      },
      {
        title: "Day 5: Recheck with Inverse Addition",
        activity: "Solve 4 problems and teach the student to verify their answer by adding the result back to the subtracted number.",
        focus: "Self-checking mastery",
        minutes: 15,
      },
    ],
  },

  mult_concept: {
    conceptId: "mult_concept",
    days: [
      {
        title: "Day 1: Dot Array Exploration",
        activity: "Arrange pebbles or draw chalk circles in 3 rows of 4. Count by rows (4+4+4) and show that 3 × 4 is the same.",
        focus: "Array representation of multiplication",
        minutes: 15,
      },
      {
        title: "Day 2: Repeated Addition Chains",
        activity: "Convert repeated addition (e.g., 6 + 6 + 6 + 6) into '4 groups of 6' and write '4 × 6'.",
        focus: "Notation equivalence",
        minutes: 15,
      },
      {
        title: "Day 3: Equal Groups in the Classroom",
        activity: "Form groups of students (e.g. 5 benches with 3 students each). Ask students to write the multiplication statement.",
        focus: "Real-world grouping",
        minutes: 15,
      },
      {
        title: "Day 4: Commutative Property (Turn Arounds)",
        activity: "Show that 3 rows of 5 dots is the same total as 5 rows of 3 dots by rotating the slate 90 degrees.",
        focus: "Multiplication commutativity",
        minutes: 15,
      },
      {
        title: "Day 5: Array Drawing Worksheet",
        activity: "Draw arrays for 5 given multiplication facts and write both the repeated sum and product.",
        focus: "Concept consolidation",
        minutes: 15,
      },
    ],
  },

  mult_facts: {
    conceptId: "mult_facts",
    days: [
      {
        title: "Day 1: Visual Skip-Counting Ladder",
        activity: "Draw a ladder for the targeted table (e.g. 6s: 6, 12, 18, 24, 30...). Practice chanting and rhythmic clapping.",
        focus: "Skip-counting foundation",
        minutes: 15,
      },
      {
        title: "Day 2: Friendly Number Benchmarks (×2, ×5, ×10)",
        activity: "Show that 6 × 6 is just (6 × 5) + 6 = 30 + 6 = 36. Use known benchmark facts to derive unknown facts.",
        focus: "Deriving facts from known landmarks",
        minutes: 15,
      },
      {
        title: "Day 3: Fact Family Triangle Cards",
        activity: "Draw triangles with Product at top and Factors at the two bottom corners. Cover one corner and test retrieval.",
        focus: "Fast recall and inverse linkage",
        minutes: 15,
      },
      {
        title: "Day 4: Bridging to Division Facts",
        activity: "Show: 'If I know 7 × 8 = 56, what is 56 ÷ 7? What is 56 ÷ 8?' Instantly unlock division fluency.",
        focus: "Multiplication-division bridge",
        minutes: 15,
      },
      {
        title: "Day 5: 1-Minute Fact Blitz & Reassessment",
        activity: "15 quick multiplication flashcards. Student aims for accuracy and immediate recall under 3 seconds per item.",
        focus: "Fluency verification",
        minutes: 15,
      },
    ],
  },

  division_concept: {
    conceptId: "division_concept",
    days: [
      {
        title: "Day 1: Fair Sharing with Seeds/Counters",
        activity: "Distribute 18 seeds equally to 3 students one-by-one. Emphasize 'Equal Sharing' as the true meaning of division.",
        focus: "Fair sharing (partitive division)",
        minutes: 15,
      },
      {
        title: "Day 2: Repeated Subtraction / Bagging",
        activity: "Start with 20 pencils. Repeatedly take away groups of 4 until none are left. Count how many bags were made.",
        focus: "Quotative division (grouping)",
        minutes: 15,
      },
      {
        title: "Day 3: 'What Does the Remainder Mean?'",
        activity: "Share 14 laddus among 4 children. Each gets 3 laddus, with 2 leftover. Discuss why 2 cannot be shared equally as whole laddus.",
        focus: "Concrete remainder understanding",
        minutes: 15,
      },
      {
        title: "Day 4: Division as the Reverse of Multiplication",
        activity: "Match arrays to division sentences: 4 rows of 5 = 20 → 20 split into 4 rows = 5 in each row.",
        focus: "Inverse operation mapping",
        minutes: 15,
      },
      {
        title: "Day 5: Word Story Problem Solving",
        activity: "Solve 4 real-life stories (sharing mangoes, packing auto passengers) and write the division number sentence.",
        focus: "Application check",
        minutes: 15,
      },
    ],
  },

  division_facts: {
    conceptId: "division_facts",
    days: [
      {
        title: "Day 1: Multiplication Table Inversion",
        activity: "Look at the 7 times table on chart. Read it backwards: 42 ÷ 7 = 6, 35 ÷ 7 = 5. Practice turning tables into division facts.",
        focus: "Reading tables in reverse",
        minutes: 15,
      },
      {
        title: "Day 2: Fact Family 3-Card Drill",
        activity: "Use cards with 3 numbers (e.g. 6, 8, 48). Student writes 2 multiplications and 2 divisions for each set.",
        focus: "Fact family cohesion",
        minutes: 15,
      },
      {
        title: "Day 3: Missing Factor Riddles",
        activity: "Ask: '7 times what gives 56?' Connect immediately: 'So 56 ÷ 7 must be...' Removes division intimidation.",
        focus: "Missing factor strategy",
        minutes: 15,
      },
      {
        title: "Day 4: Rapid Oral Fire Round",
        activity: "Teacher calls out a division fact; student calls out the quotient within 3 seconds using table recall.",
        focus: "Automaticity",
        minutes: 15,
      },
      {
        title: "Day 5: Timed 10-Item Quiz",
        activity: "Written check of 10 fundamental division facts spanning 2s through 9s.",
        focus: "Mastery check",
        minutes: 15,
      },
    ],
  },

  long_division: {
    conceptId: "long_division",
    days: [
      {
        title: "Day 1: The 'DMSB' Family Chant",
        activity: "Teach the 4-step ritual: Divide (Dad), Multiply (Mom), Subtract (Sister), Bring down (Brother). Chant it aloud.",
        focus: "Algorithm memory hook",
        minutes: 15,
      },
      {
        title: "Day 2: 2-Digit by 1-Digit Step-by-Step",
        activity: "Solve 75 ÷ 3 on grid paper with colored chalk for each of the 4 steps to avoid alignment mistakes.",
        focus: "Column alignment & subtraction",
        minutes: 15,
      },
      {
        title: "Day 3: The Danger of the Zero in Quotient",
        activity: "Practice problems like 612 ÷ 6 where 1 cannot be divided by 6, requiring a 0 in the quotient before bringing down 2.",
        focus: "Zero quotient placeholder bug",
        minutes: 15,
      },
      {
        title: "Day 4: Checking with (Divisor × Quotient) + Remainder",
        activity: "Teach students to multiply their answer back by divisor and add remainder to see if it equals dividend.",
        focus: "Self-verification skill",
        minutes: 15,
      },
      {
        title: "Day 5: 3 Practical Long Division Problems",
        activity: "Work through 3 independent problems with remainders and write verification formulas.",
        focus: "Full procedure mastery",
        minutes: 15,
      },
    ],
  },

  fraction_basics: {
    conceptId: "fraction_basics",
    days: [
      {
        title: "Day 1: Paper Roti Folding Activity",
        activity: "Fold circular paper 'rotis' into 2, 4, and 8 equal parts. Label 1/2, 1/4, 1/8. Emphasize parts MUST be equal.",
        focus: "Equal parts intuition",
        minutes: 15,
      },
      {
        title: "Day 2: Shaded Fraction Strip Drawing",
        activity: "Draw strips on grid paper divided into equal rectangles. Shade 3 out of 5 and identify numerator (3) and denominator (5).",
        focus: "Numerator vs Denominator role",
        minutes: 15,
      },
      {
        title: "Day 3: Fraction of a Collection",
        activity: "Place 12 pebbles. Find 1/2 (6 pebbles), 1/3 (4 pebbles), 1/4 (3 pebbles) by sorting into equal piles.",
        focus: "Fraction as an operator on sets",
        minutes: 15,
      },
      {
        title: "Day 4: Fraction Misconception Buster",
        activity: "Show shapes split into UNEQUAL parts and ask: 'Is this 1/2?' Clarify that parts must have identical area.",
        focus: "Non-equal parts trap",
        minutes: 15,
      },
      {
        title: "Day 5: Slate Representation Check",
        activity: "Teacher names 5 fractions; student draws and shades representation on slate.",
        focus: "Consolidation",
        minutes: 15,
      },
    ],
  },

  comparing_fractions: {
    conceptId: "comparing_fractions",
    days: [
      {
        title: "Day 1: The 'Sharing Pizza/Roti' Dilemma",
        activity: "Ask: 'Would you rather share 1 roti with 2 friends or with 8 friends?' Lead them to conclude 1/2 is much bigger than 1/8.",
        focus: "Denominator magnitude misconception",
        minutes: 15,
      },
      {
        title: "Day 2: Fraction Strips Side-by-Side",
        activity: "Align paper strips of identical length: compare 1/3 strip against 1/5 strip. Physically see 1/3 is longer.",
        focus: "Visual length comparison",
        minutes: 15,
      },
      {
        title: "Day 3: Same Denominator Rule",
        activity: "Compare fractions with matching denominators: 3/7 vs 5/7. Since pieces are same size, more pieces = bigger.",
        focus: "Like denominator comparison",
        minutes: 15,
      },
      {
        title: "Day 4: Cross-Multiplication Butterfly Method",
        activity: "Teach the cross-multiply shortcut for unlike denominators: for 2/3 vs 3/5, compare (2×5=10) with (3×3=9). 10 > 9 so 2/3 > 3/5.",
        focus: "Universal comparison tool",
        minutes: 15,
      },
      {
        title: "Day 5: Comparison Sorting Challenge",
        activity: "Sort 5 fraction cards from least to greatest using strips or cross-multiplication.",
        focus: "Mastery check",
        minutes: 15,
      },
    ],
  },

  fraction_addition: {
    conceptId: "fraction_addition",
    days: [
      {
        title: "Day 1: Physical Fraction Strip Combining",
        activity: "Take two 1/4 paper pieces and tape them together. Show it is two fourths (2/4), NOT two eighths (2/8)!",
        focus: "Eliminating denominator-adding bug",
        minutes: 15,
      },
      {
        title: "Day 2: The Pizza Slice Analogy",
        activity: "1 slice of an 8-slice pizza + 2 slices of the same pizza = 3 slices of that 8-slice pizza (3/8). The slice size doesn't change.",
        focus: "Unit preservation",
        minutes: 15,
      },
      {
        title: "Day 3: Like-Denominator Practice Worksheet",
        activity: "Solve 8 like-denominator addition problems on chalkboard: add numerators only, keep denominator unchanged.",
        focus: "Procedural fluency",
        minutes: 15,
      },
      {
        title: "Day 4: Simple Unlike Denominators (Halves to Quarters)",
        activity: "Convert 1/2 into 2/4 using equivalent fractions before adding to 1/4 to get 3/4.",
        focus: "Equivalent fraction conversion bridge",
        minutes: 15,
      },
      {
        title: "Day 5: Real-World Story Problems",
        activity: "Solve 3 story problems about water in buckets and measuring cloth.",
        focus: "Application check",
        minutes: 15,
      },
    ],
  },

  equivalent_fractions: {
    conceptId: "equivalent_fractions",
    days: [
      {
        title: "Day 1: Folding Halves into Fourths",
        activity: "Take a folded 1/2 paper. Fold it again in half to show 1/2 = 2/4 without changing amount of shaded paper.",
        focus: "Visual equivalence",
        minutes: 15,
      },
      {
        title: "Day 2: The Golden Rule: Multiply Top & Bottom by Same Number",
        activity: "Demonstrate multiplying numerator AND denominator by 2, 3, or 4 creates identical amounts.",
        focus: "Multiplicative scaling",
        minutes: 15,
      },
      {
        title: "Day 3: Anti-Additive Scaling Trap",
        activity: "Expose error where students add same number: show why 1/2 ≠ 2/3 (1+1 / 2+1) using visual circles.",
        focus: "Debunking additive scaling misconception",
        minutes: 15,
      },
      {
        title: "Day 4: Equivalent Fraction Dominoes Game",
        activity: "Match cards with equivalent representations (e.g. 2/3 matches 4/6 and 6/9).",
        focus: "Pattern recognition",
        minutes: 15,
      },
      {
        title: "Day 5: Find the Missing Value Worksheet",
        activity: "Fill in the blanks: 3/4 = ?/12, 2/5 = 6/?.",
        focus: "Mastery check",
        minutes: 15,
      },
    ],
  },

  multi_digit_mult: {
    conceptId: "multi_digit_mult",
    days: [
      {
        title: "Day 1: Area Model / Box Method",
        activity: "Break 23 × 14 into a grid: (20 + 3) × (10 + 4). Calculate 4 partial boxes (200, 80, 30, 12) and add together.",
        focus: "Conceptual breakdown",
        minutes: 15,
      },
      {
        title: "Day 2: The Placeholder Zero Routine",
        activity: "Focus on why we put '0' in the ones place when multiplying by the tens digit. Color the placeholder zero red.",
        focus: "Placeholder zero retention",
        minutes: 15,
      },
      {
        title: "Day 3: Two-Line Column Multiplication",
        activity: "Practice the 2-step layout: Line 1 = multiply by ones, Line 2 = multiply by tens, Line 3 = add columns.",
        focus: "Algorithm alignment",
        minutes: 15,
      },
      {
        title: "Day 4: Carrying Within Multiplication vs Adding",
        activity: "Keep carried numbers from multiplication distinct from carried numbers during the final addition step.",
        focus: "Disentangling carries",
        minutes: 15,
      },
      {
        title: "Day 5: Real-World Multi-Digit Problem",
        activity: "Solve 3 story problems involving school supplies and check with estimation.",
        focus: "Independent mastery",
        minutes: 15,
      },
    ],
  },

  division_word: {
    conceptId: "division_word",
    days: [
      {
        title: "Day 1: Identifying Action Keywords",
        activity: "Highlight story phrases like 'shared equally', 'packed into boxes of', 'distributed among'.",
        focus: "Word problem decoding",
        minutes: 15,
      },
      {
        title: "Day 2: Drawing the Story Before the Equation",
        activity: "Sketch circles and tally marks for the scenario before writing numbers.",
        focus: "Visual mental model",
        minutes: 15,
      },
      {
        title: "Day 3: What to Do with the Remainder?",
        activity: "Discuss: If 25 students need autos that hold 4 students each, do we need 6 autos or 7 autos? (Must round UP!).",
        focus: "Interpreting remainder in context",
        minutes: 15,
      },
      {
        title: "Day 4: Writing Equations from Word Prompts",
        activity: "Translate 5 short stories into clear Dividend ÷ Divisor = Quotient statements.",
        focus: "Equation translation",
        minutes: 15,
      },
      {
        title: "Day 5: Partner Problem Creation",
        activity: "Student invents one division word problem about their home village or school for a classmate to solve.",
        focus: "Deep generative mastery",
        minutes: 15,
      },
    ],
  },
};

/**
 * Generate a personalized 5-day remediation plan for a student based on their
 * diagnosed root cause and symptoms.
 */
export function generateRemediationPlan(
  studentId: string,
  rootCause: RootCause
): RemediationPlan {
  const template =
    REMEDIATION_TEMPLATES[rootCause.rootId] || REMEDIATION_TEMPLATES.mult_facts;

  const days: PlanDay[] = template.days.map((d, index) => ({
    day: index + 1,
    title: { raw: d.title },
    activity: { raw: d.activity },
    focus: d.focus,
    minutes: d.minutes,
  }));

  const symptomNames = rootCause.symptomIds
    .map((s) => CONCEPTS[s]?.strand || s)
    .join(", ");

  const aiNote = `Diagnosed root cause is ${rootCause.rootId} (severity: ${rootCause.severity.toUpperCase()}, mastery: ${Math.round(rootCause.rootMastery * 100)}%). This deficit directly blocks fluency in ${symptomNames}. Recommended plan uses 15 min/day low-cost concrete manipulatives and visual scaffolding before advancing to symbolic algorithms.`;

  return {
    id: `plan_${studentId}_${rootCause.rootId}`,
    studentId,
    conceptId: rootCause.rootId,
    symptomIds: rootCause.symptomIds,
    createdAt: "2026-10-07T00:00:00.000Z",
    days,
    source: "rules",
    aiNote,
    completedDays: [],
    reassessAfter: "2026-10-12",
  };
}
