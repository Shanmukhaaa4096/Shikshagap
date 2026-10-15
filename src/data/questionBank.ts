import type { Question } from '../types';

export const QUESTION_BANK: Question[] = [
  // ==========================================
  // DIVISION CONCEPTS (Target Concept for Class 5)
  // ==========================================
  {
    id: 'div_01',
    conceptId: 'division_concepts',
    difficulty: 2,
    questionType: 'mcq',
    text: {
      en: 'What is 36 ÷ 6?',
      hi: '36 ÷ 6 का मान क्या होगा?',
      te: '36 ÷ 6 విలువ ఎంత?',
    },
    options: [
      { en: '4', hi: '4', te: '4' },
      { en: '5', hi: '5', te: '5' },
      { en: '6', hi: '6', te: '6' },
      { en: '7', hi: '7', te: '7' },
    ],
    correctAnswer: '6',
    explanation: {
      en: 'Since 6 × 6 = 36, 36 divided into 6 equal groups gives 6 in each group.',
      hi: 'चूंकि 6 × 6 = 36 होता है, इसलिए 36 को 6 बराबर भागों में बांटने पर प्रत्येक भाग में 6 आते हैं।',
      te: '6 × 6 = 36 కాబట్టి, 36 ని 6 సమాన భాగాలుగా పంచుకుంటే ప్రతి భాగానికి 6 వస్తాయి.',
    },
    visualHint: '6 groups of 6 dots: [••••••] × 6 = 36',
  },
  {
    id: 'div_02',
    conceptId: 'division_concepts',
    difficulty: 2,
    questionType: 'mcq',
    text: {
      en: 'Solve: 42 ÷ 7 = ?',
      hi: 'हल करें: 42 ÷ 7 = ?',
      te: 'సాధించండి: 42 ÷ 7 = ?',
    },
    options: [
      { en: '5', hi: '5', te: '5' },
      { en: '6', hi: '6', te: '6' },
      { en: '7', hi: '7', te: '7' },
      { en: '8', hi: '8', te: '8' },
    ],
    correctAnswer: '6',
    explanation: {
      en: '42 divided by 7 is 6 because 7 × 6 = 42.',
      hi: '42 को 7 से भाग देने पर 6 आता है क्योंकि 7 × 6 = 42 होता है।',
      te: '42 ని 7 తో భాగిస్తే 6 వస్తుంది ఎందుకంటే 7 × 6 = 42.',
    },
  },
  {
    id: 'div_03',
    conceptId: 'division_concepts',
    difficulty: 2,
    questionType: 'mcq',
    text: {
      en: 'Solve: 56 ÷ 8 = ?',
      hi: 'हल करें: 56 ÷ 8 = ?',
      te: 'సాధించండి: 56 ÷ 8 = ?',
    },
    options: [
      { en: '6', hi: '6', te: '6' },
      { en: '7', hi: '7', te: '7' },
      { en: '8', hi: '8', te: '8' },
      { en: '9', hi: '9', te: '9' },
    ],
    correctAnswer: '7',
    explanation: {
      en: '8 groups of 7 equals 56, so 56 ÷ 8 = 7.',
      hi: '8 गुना 7 बराबर 56, इसलिए 56 ÷ 8 = 7।',
      te: '8 × 7 = 56 కాబట్టి, 56 ÷ 8 = 7.',
    },
  },
  {
    id: 'div_04',
    conceptId: 'division_concepts',
    difficulty: 2,
    questionType: 'word_problem',
    text: {
      en: 'A teacher has 48 pencils to distribute equally among 6 students. How many pencils does each student receive?',
      hi: 'एक शिक्षक के पास 48 पेंसिलें हैं जिन्हें 6 छात्रों में बराबर बांटना है। प्रत्येक छात्र को कितनी पेंसिलें मिलेंगी?',
      te: 'ఒక ఉపాధ్యాయుని వద్ద 48 పెన్సిళ్లు ఉన్నాయి. వాటిని 6 మంది విద్యార్థులకు సమానంగా పంచాలి. ప్రతి విద్యార్థికి ఎన్ని పెన్సిళ్లు వస్తాయి?',
    },
    options: [
      { en: '6 pencils', hi: '6 पेंसिलें', te: '6 పెన్సిళ్లు' },
      { en: '7 pencils', hi: '7 पेंसिलें', te: '7 పెన్సిళ్లు' },
      { en: '8 pencils', hi: '8 पेंसिलें', te: '8 పెన్సిళ్లు' },
      { en: '9 pencils', hi: '9 पेंसिलें', te: '9 పెన్సిళ్లు' },
    ],
    correctAnswer: '8 pencils',
    explanation: {
      en: '48 pencils divided by 6 students: 48 ÷ 6 = 8.',
      hi: '48 पेंसिलें ÷ 6 छात्र: 48 ÷ 6 = 8 पेंसिलें।',
      te: '48 పెన్సిళ్లు ÷ 6 మంది విద్యార్థులు: 48 ÷ 6 = 8 పెన్సిళ్లు.',
    },
  },
  {
    id: 'div_05',
    conceptId: 'division_concepts',
    difficulty: 3,
    questionType: 'mcq',
    text: {
      en: 'What is 72 ÷ 9?',
      hi: '72 ÷ 9 का मान क्या है?',
      te: '72 ÷ 9 విలువ ఎంత?',
    },
    options: [
      { en: '7', hi: '7', te: '7' },
      { en: '8', hi: '8', te: '8' },
      { en: '9', hi: '9', te: '9' },
      { en: '6', hi: '6', te: '6' },
    ],
    correctAnswer: '8',
    explanation: {
      en: '9 × 8 = 72, so 72 ÷ 9 = 8.',
      hi: '9 × 8 = 72 होता है, अतः 72 ÷ 9 = 8।',
      te: '9 × 8 = 72 కాబట్టి 72 ÷ 9 = 8.',
    },
  },

  // ==========================================
  // PREREQUISITE PROBE: MULTIPLICATION FLUENCY
  // ==========================================
  {
    id: 'mult_prereq_01',
    conceptId: 'multiplication_fluency',
    difficulty: 1,
    isPrerequisiteProbe: true,
    probeForConceptId: 'division_concepts',
    questionType: 'mcq',
    text: {
      en: 'What number makes this true: 6 × ? = 36',
      hi: 'इस कथन को सही बनाने वाली संख्या क्या है: 6 × ? = 36',
      te: 'ఈ వాక్యం సరైనది కావడానికి ఖాళీలో ఉండాల్సిన సంఖ్య: 6 × ? = 36',
    },
    options: [
      { en: '5', hi: '5', te: '5' },
      { en: '6', hi: '6', te: '6' },
      { en: '7', hi: '7', te: '7' },
      { en: '8', hi: '8', te: '8' },
    ],
    correctAnswer: '6',
    explanation: {
      en: 'From the 6 times table: 6 × 6 = 36.',
      hi: '6 के पहाड़े से: 6 × 6 = 36।',
      te: '6 వ ఎక్కం ప్రకారం: 6 × 6 = 36.',
    },
    visualHint: 'Think: How many groups of 6 make 36?',
  },
  {
    id: 'mult_prereq_02',
    conceptId: 'multiplication_fluency',
    difficulty: 1,
    isPrerequisiteProbe: true,
    probeForConceptId: 'division_concepts',
    questionType: 'mcq',
    text: {
      en: 'What is 7 × 6?',
      hi: '7 × 6 का मान क्या होगा?',
      te: '7 × 6 ఎంత?',
    },
    options: [
      { en: '36', hi: '36', te: '36' },
      { en: '40', hi: '40', te: '40' },
      { en: '42', hi: '42', te: '42' },
      { en: '48', hi: '48', te: '48' },
    ],
    correctAnswer: '42',
    explanation: {
      en: '7 × 6 = 42. Practicing the 7 or 6 table helps recall this quickly.',
      hi: '7 × 6 = 42 होता है। 7 या 6 का पहाड़ा याद करने से तुरंत उत्तर मिलता है।',
      te: '7 × 6 = 42. 7 లేదా 6 వ ఎక్కం గుర్తుచేసుకుంటే సులభంగా తెలుస్తుంది.',
    },
  },
  {
    id: 'mult_prereq_03',
    conceptId: 'multiplication_fluency',
    difficulty: 1,
    isPrerequisiteProbe: true,
    probeForConceptId: 'division_concepts',
    questionType: 'mcq',
    text: {
      en: 'What is 6 × 5?',
      hi: '6 × 5 कितना होता है?',
      te: '6 × 5 ఎంత?',
    },
    options: [
      { en: '25', hi: '25', te: '25' },
      { en: '30', hi: '30', te: '30' },
      { en: '35', hi: '35', te: '35' },
      { en: '36', hi: '36', te: '36' },
    ],
    correctAnswer: '30',
    explanation: {
      en: 'Counting by 5s six times: 5, 10, 15, 20, 25, 30.',
      hi: '5 को 6 बार जोड़ने पर: 5 + 5 + 5 + 5 + 5 + 5 = 30।',
      te: '5 ని 6 సార్లు కూడితే: 5 + 5 + 5 + 5 + 5 + 5 = 30.',
    },
  },
  {
    id: 'mult_prereq_04',
    conceptId: 'multiplication_fluency',
    difficulty: 1,
    isPrerequisiteProbe: true,
    probeForConceptId: 'division_concepts',
    questionType: 'mcq',
    text: {
      en: 'What is 8 × 7?',
      hi: '8 × 7 का मान क्या है?',
      te: '8 × 7 విలువ ఎంత?',
    },
    options: [
      { en: '54', hi: '54', te: '54' },
      { en: '56', hi: '56', te: '56' },
      { en: '64', hi: '64', te: '64' },
      { en: '48', hi: '48', te: '48' },
    ],
    correctAnswer: '56',
    explanation: {
      en: '8 × 7 = 56. Essential fact for solving 56 ÷ 8 and 56 ÷ 7.',
      hi: '8 × 7 = 56 होता है। यह 56 ÷ 8 हल करने के लिए बुनियादी ज्ञान है।',
      te: '8 × 7 = 56. ఇది 56 ÷ 8 సమస్యను సాధించడానికి అవసరమైన ప్రాథమిక అంశం.',
    },
  },

  // ==========================================
  // PREREQUISITE PROBE: PLACE VALUE
  // ==========================================
  {
    id: 'pv_prereq_01',
    conceptId: 'place_val',
    difficulty: 1,
    isPrerequisiteProbe: true,
    probeForConceptId: 'division_concepts',
    questionType: 'mcq',
    text: {
      en: 'In the number 470, what is the place value of the digit 7?',
      hi: 'संख्या 470 में अंक 7 का स्थानीय मान (Place Value) क्या है?',
      te: '470 సంఖ్యలో 7 యొక్క స్థాన విలువ ఎంత?',
    },
    options: [
      { en: '7', hi: '7', te: '7' },
      { en: '70', hi: '70', te: '70' },
      { en: '700', hi: '700', te: '700' },
      { en: '47', hi: '47', te: '47' },
    ],
    correctAnswer: '70',
    explanation: {
      en: 'The digit 7 is in the Tens place, so its value is 7 × 10 = 70.',
      hi: 'अंक 7 दहाई के स्थान पर है, इसलिए इसका मान 7 × 10 = 70 है।',
      te: '7 అంకె పదుల స్థానంలో ఉంది, కాబట్టి దాని విలువ 7 × 10 = 70.',
    },
  },
  {
    id: 'pv_prereq_02',
    conceptId: 'place_val',
    difficulty: 1,
    isPrerequisiteProbe: true,
    probeForConceptId: 'division_concepts',
    questionType: 'mcq',
    text: {
      en: 'How many tens are there in 60?',
      hi: '60 में कितनी दहाइयां (Tens) होती हैं?',
      te: '60 లో ఎన్ని పదులు ఉన్నాయి?',
    },
    options: [
      { en: '5', hi: '5', te: '5' },
      { en: '6', hi: '6', te: '6' },
      { en: '60', hi: '60', te: '60' },
      { en: '10', hi: '10', te: '10' },
    ],
    correctAnswer: '6',
    explanation: {
      en: '60 equals 6 bundles of 10.',
      hi: '60 का अर्थ है 10 के 6 बंडल।',
      te: '60 అంటే 10 యొక్క 6 సమూహాలు.',
    },
  },

  // ==========================================
  // PREREQUISITE PROBE: SUBTRACTION
  // ==========================================
  {
    id: 'sub_prereq_01',
    conceptId: 'subtraction',
    difficulty: 1,
    isPrerequisiteProbe: true,
    probeForConceptId: 'division_concepts',
    questionType: 'mcq',
    text: {
      en: 'What is 42 - 36?',
      hi: '42 - 36 का मान क्या होगा?',
      te: '42 - 36 ఎంత?',
    },
    options: [
      { en: '4', hi: '4', te: '4' },
      { en: '6', hi: '6', te: '6' },
      { en: '8', hi: '8', te: '8' },
      { en: '16', hi: '16', te: '16' },
    ],
    correctAnswer: '6',
    explanation: {
      en: 'Borrowing 1 ten into units: 12 - 6 = 6, and 3 - 3 = 0.',
      hi: 'दहाई से उधार लेने पर: 12 - 6 = 6, और 3 - 3 = 0।',
      te: 'పదుల స్థానం నుండి అప్పు తీసుకుంటే: 12 - 6 = 6.',
    },
  },

  // ==========================================
  // ADVANCED: LONG DIVISION
  // ==========================================
  {
    id: 'ld_01',
    conceptId: 'long_division',
    difficulty: 2,
    questionType: 'mcq',
    text: {
      en: 'What is 84 ÷ 4?',
      hi: '84 ÷ 4 का मान क्या है?',
      te: '84 ÷ 4 విలువ ఎంత?',
    },
    options: [
      { en: '20', hi: '20', te: '20' },
      { en: '21', hi: '21', te: '21' },
      { en: '22', hi: '22', te: '22' },
      { en: '24', hi: '24', te: '24' },
    ],
    correctAnswer: '21',
    explanation: {
      en: '8 tens ÷ 4 = 2 tens (20), 4 units ÷ 4 = 1 unit. Total = 21.',
      hi: '8 दहाई ÷ 4 = 2 दहाई (20), 4 इकाई ÷ 4 = 1 इकाई। कुल = 21।',
      te: '8 పదులు ÷ 4 = 2 పదులు (20), 4 ఒకట్లు ÷ 4 = 1 ఒకట్లు. మొత్తం = 21.',
    },
  },
  {
    id: 'ld_02',
    conceptId: 'long_division',
    difficulty: 2,
    questionType: 'mcq',
    text: {
      en: 'If 75 is divided by 5, what is the quotient?',
      hi: 'यदि 75 को 5 से भाग दिया जाए, तो भागफल (Quotient) क्या होगा?',
      te: '75 ని 5 తో భాగిస్తే వచ్చే భాగఫలం ఎంత?',
    },
    options: [
      { en: '12', hi: '12', te: '12' },
      { en: '15', hi: '15', te: '15' },
      { en: '18', hi: '18', te: '18' },
      { en: '25', hi: '25', te: '25' },
    ],
    correctAnswer: '15',
    explanation: {
      en: '5 × 15 = 75, so quotient is 15 with 0 remainder.',
      hi: '5 × 15 = 75 होता है, अतः भागफल 15 है।',
      te: '5 × 15 = 75 కాబట్టి భాగఫలం 15.',
    },
  },

  // ==========================================
  // FRACTIONS
  // ==========================================
  {
    id: 'frac_01',
    conceptId: 'fractions_intro',
    difficulty: 2,
    questionType: 'mcq',
    text: {
      en: 'A chapati is cut into 4 equal pieces. Sita eats 1 piece. What fraction did she eat?',
      hi: 'एक रोटी को 4 बराबर टुकड़ों में काटा गया। सीता ने 1 टुकड़ा खाया। उसने कितना भिन्न (Fraction) खाया?',
      te: 'ఒక చపాతీని 4 సమాన భాగాలుగా కత్తిరించారు. సీత 1 ముక్క తిన్నది. ఆమె తిన్న భాగం ఎంత?',
    },
    options: [
      { en: '1/2', hi: '1/2', te: '1/2' },
      { en: '1/3', hi: '1/3', te: '1/3' },
      { en: '1/4', hi: '1/4', te: '1/4' },
      { en: '4/1', hi: '4/1', te: '4/1' },
    ],
    correctAnswer: '1/4',
    explanation: {
      en: '1 piece out of 4 total equal pieces is written as 1/4.',
      hi: 'कुल 4 बराबर भागों में से 1 भाग को 1/4 लिखा जाता है।',
      te: 'మొత్తం 4 సమాన భాగాలలో 1 భాగాన్ని 1/4 గా రాస్తారు.',
    },
  },
  {
    id: 'frac_02',
    conceptId: 'equiv_fractions',
    difficulty: 2,
    questionType: 'mcq',
    text: {
      en: 'Which fraction is equivalent to 1/2?',
      hi: '1/2 के समतुल्य (Equivalent) कौन सा भिन्न है?',
      te: '1/2 కు సమానమైన భిన్నం ఏది?',
    },
    options: [
      { en: '2/3', hi: '2/3', te: '2/3' },
      { en: '2/4', hi: '2/4', te: '2/4' },
      { en: '1/4', hi: '1/4', te: '1/4' },
      { en: '3/5', hi: '3/5', te: '3/5' },
    ],
    correctAnswer: '2/4',
    explanation: {
      en: 'Multiplying both numerator and denominator by 2: (1×2)/(2×2) = 2/4.',
      hi: 'अंश और हर दोनों को 2 से गुणा करने पर: (1×2)/(2×2) = 2/4 मिलता है।',
      te: 'లవం మరియు హారాన్ని 2 తో గుణిస్తే: 2/4 వస్తుంది.',
    },
  },
];

export const QUESTION_MAP = QUESTION_BANK.reduce((acc, q) => {
  acc[q.id] = q;
  return acc;
}, {} as Record<string, Question>);

/**
 * Filter questions by concept and difficulty
 */
export function getQuestionsForConcept(conceptId: string, difficulty?: number): Question[] {
  return QUESTION_BANK.filter((q) => {
    if (q.conceptId !== conceptId) return false;
    if (difficulty !== undefined && q.difficulty !== difficulty) return false;
    return true;
  });
}
