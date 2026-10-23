/**
 * ShikshaGap Multi-Book, Multi-Board Verified Question Bank
 *
 * Provides authentic, curriculum-aligned questions across:
 * 1. NCERT (Math-Magic Class 3, 4, 5): everyday Indian story context, conversational clarity.
 * 2. NCERT Exemplar: deeper conceptual and analytical reasoning.
 * 3. CBSE Reference (R.D. Sharma / R.S. Aggarwal style): procedural fluency, graded difficulty.
 * 4. ICSE Selina / Concise Mathematics: formal wording, explicit units, step-by-step reasoning.
 * 5. ICSE Foundation (Frank / ML Aggarwal style): strong conceptual basis, word problems with units.
 *
 * All questions are age-appropriate for Indian school children (Class 3-5), feature
 * familiar Indian contexts (Aarav, Diya, rupees, sweets, autos, train journeys),
 * have trilingual prompts (en, hi, te), verified step-by-step solutions, hints,
 * and deliberate pedagogical distractors.
 */

import type { ConceptId, Difficulty, ErrorType, Lang, Question, QuestionFormat } from "../types.ts";
import type { SourceStyle } from "../agents/adaptiveEngine.ts";
import { EXTENDED_MULTI_BOARD_QUESTIONS } from "./multiBoardBankExtended.ts";
import { getCurriculumConcept } from "../../data/curriculum/index.ts";

export interface MultiBoardQuestionEntry {
  id: string;
  sourceStyle: SourceStyle;
  board: "CBSE" | "ICSE" | "NCERT" | "BOTH";
  bookFamily: string;
  class: number;
  conceptIds: ConceptId[];
  difficulty: Difficulty; // 1 to 5
  format: QuestionFormat;
  expression?: string;
  prompt: {
    en: string;
    hi: string;
    te: string;
  };
  options?: Array<{
    id: string;
    value: string;
    label: {
      en: string;
      hi: string;
      te: string;
    };
    errorType?: string;
  }>;
  correctAnswer: string;
  verifiedSolution: {
    en: string;
    hi: string;
    te: string;
  };
  hint: {
    en: string;
    hi: string;
    te: string;
  };
  misconceptionTags?: string[];
  provenanceLabel: string;
}

export const MULTI_BOARD_QUESTION_BANK: MultiBoardQuestionEntry[] = [
  // =========================================================================
  // CLASS 3: NUMBER SENSE & PLACE VALUE
  // =========================================================================
  {
    id: "ncert_m3_ns_l1_01",
    sourceStyle: "ncert",
    board: "NCERT",
    bookFamily: "NCERT Math-Magic 3",
    class: 3,
    conceptIds: ["number_sense"],
    difficulty: 1, // L1 Recall
    format: "mcq",
    prompt: {
      en: "Aarav has 48 marbles and Kabir has 84 marbles. Which number has the greater value?",
      hi: "आरव के पास 48 कंचे हैं और कबीर के पास 84 कंचे हैं। किस संख्या का मान बड़ा है?",
      te: "ఆరవ్ వద్ద 48 గోళీలు, కబీర్ వద్ద 84 గోళీలు ఉన్నాయి. ఏ సంఖ్య పెద్దది?",
    },
    expression: "48 vs 84",
    options: [
      { id: "o1", value: "84", label: { en: "84", hi: "84", te: "84" } },
      { id: "o2", value: "48", label: { en: "48", hi: "48", te: "48" }, errorType: "place_value" },
      { id: "o3", value: "Both are equal", label: { en: "Both are equal", hi: "दोनों बराबर हैं", te: "రెండూ సమానం" }, errorType: "slip" },
      { id: "o4", value: "40", label: { en: "40", hi: "40", te: "40" }, errorType: "slip" },
    ],
    correctAnswer: "84",
    verifiedSolution: {
      en: "84 has 8 tens (80), while 48 has only 4 tens (40). Since 80 > 40, 84 is greater.",
      hi: "84 में 8 दहाई (80) हैं, जबकि 48 में केवल 4 दहाई (40) हैं। 84 बड़ा है।",
      te: "84 లో 8 పదులు (80) ఉన్నాయి, 48 లో 4 పదులు (40) ఉన్నాయి. కావున 84 పెద్దది.",
    },
    hint: {
      en: "Look at the tens digit: 8 tens is more than 4 tens.",
      hi: "दहाई के अंक को देखें: 8 दहाई 4 दहाई से अधिक है।",
      te: "పదుల స్థానాన్ని చూడండి: 8 పదులు 4 పదుల కంటే ఎక్కువ.",
    },
    provenanceLabel: "NCERT Math-Magic Class 3",
  },
  {
    id: "selina_m3_pv_l2_01",
    sourceStyle: "icse_selina",
    board: "ICSE",
    bookFamily: "Selina Concise Mathematics 3",
    class: 3,
    conceptIds: ["place_value"],
    difficulty: 2, // L2 Understanding
    format: "mcq",
    prompt: {
      en: "In the number 653, what is the place value of the digit 5?",
      hi: "संख्या 653 में अंक 5 का स्थानीय मान क्या है?",
      te: "653 సంఖ్యలో 5 అంకె యొక్క స్థాన విలువ ఎంత?",
    },
    expression: "653",
    options: [
      { id: "o1", value: "50", label: { en: "50 (5 tens)", hi: "50 (5 दहाई)", te: "50 (5 పదులు)" } },
      { id: "o2", value: "5", label: { en: "5 (5 ones)", hi: "5 (5 इकाई)", te: "5 (5 ఒకట్లు)" }, errorType: "place_value" },
      { id: "o3", value: "500", label: { en: "500 (5 hundreds)", hi: "500 (5 सैकड़ा)", te: "500 (5 వందలు)" }, errorType: "place_value" },
      { id: "o4", value: "53", label: { en: "53", hi: "53", te: "53" }, errorType: "slip" },
    ],
    correctAnswer: "50",
    verifiedSolution: {
      en: "Digit 5 is in the tens place: 5 × 10 = 50.",
      hi: "अंक 5 दहाई के स्थान पर है: 5 × 10 = 50।",
      te: "5 అంకె పదుల స్థానంలో ఉంది: 5 × 10 = 50.",
    },
    hint: {
      en: "Find which place 5 sits in: hundreds, tens, or ones.",
      hi: "देखें 5 किस स्थान पर है: सैकड़ा, दहाई या इकाई।",
      te: "5 ఏ స్థానంలో ఉందో చూడండి: వందలు, పదులు, లేదా ఒకట్లు.",
    },
    provenanceLabel: "ICSE Selina Concise Mathematics Class 3",
  },
  {
    id: "rdsharma_m3_add_l3_01",
    sourceStyle: "cbse_reference",
    board: "CBSE",
    bookFamily: "R.D. Sharma Primary Mathematics 3",
    class: 3,
    conceptIds: ["addition_3digit"],
    difficulty: 3, // L3 Application
    format: "mcq",
    prompt: {
      en: "Diya saved ₹345 in July and ₹278 in August. How much total money did she save?",
      hi: "दीया ने जुलाई में ₹345 और अगस्त में ₹278 बचाए। उसने कुल कितने रुपये बचाए?",
      te: "దియా జూలైలో ₹345 మరియు ఆగస్టులో ₹278 ఆదా చేసింది. ఆమె మొత్తం ఎంత సొమ్ము ఆదా చేసింది?",
    },
    expression: "₹345 + ₹278 = ?",
    options: [
      { id: "o1", value: "623", label: { en: "₹623", hi: "₹623", te: "₹623" } },
      { id: "o2", value: "613", label: { en: "₹613", hi: "₹613", te: "₹613" }, errorType: "regrouping" },
      { id: "o3", value: "523", label: { en: "₹523", hi: "₹523", te: "₹523" }, errorType: "regrouping" },
      { id: "o4", value: "628", label: { en: "₹628", hi: "₹628", te: "₹628" }, errorType: "slip" },
    ],
    correctAnswer: "623",
    verifiedSolution: {
      en: "345 + 278: 5 + 8 = 13 (carry 1). 4 + 7 + 1 = 12 (carry 1). 3 + 2 + 1 = 6. Total = ₹623.",
      hi: "345 + 278: 5 + 8 = 13 (हासिल 1)। 4 + 7 + 1 = 12 (हासिल 1)। 3 + 2 + 1 = 6। कुल = ₹623।",
      te: "345 + 278: 5 + 8 = 13 (దస్తీ 1). 4 + 7 + 1 = 12 (దస్తీ 1). 3 + 2 + 1 = 6. మొత్తం = ₹623.",
    },
    hint: {
      en: "Remember to carry over when the sum of a column is 10 or more.",
      hi: "जब किसी स्तंभ का योग 10 या अधिक हो तो हासिल जोड़ना न भूलें।",
      te: "కూడిక 10 లేదా అంతకంటే ఎక్కువ వచ్చినప్పుడు దస్తీ కలపడం మర్చిపోకండి.",
    },
    provenanceLabel: "CBSE R.D. Sharma Mathematics Class 3",
  },
  {
    id: "exemplar_m3_ops_l4_01",
    sourceStyle: "exemplar",
    board: "CBSE",
    bookFamily: "NCERT Exemplar Problems Class 3",
    class: 3,
    conceptIds: ["subtraction_3digit"],
    difficulty: 4, // L4 Analysis
    format: "mcq",
    prompt: {
      en: "A school library had 500 storybooks. 237 books were issued to students. How many books remain in the library?",
      hi: "एक स्कूल पुस्तकालय में 500 कहानियों की किताबें थीं। 237 किताबें छात्रों को दी गईं। पुस्तकालय में कितनी किताबें बची हैं?",
      te: "ఒక పాఠశాల లైబ్రరీలో 500 కథల పుస్తకాలు ఉన్నాయి. 237 పుస్తకాలను విద్యార్థులకు ఇచ్చారు. లైబ్రరీలో ఇంకా ఎన్ని పుస్తకాలు మిగిలి ఉన్నాయి?",
    },
    expression: "500 - 237 = ?",
    options: [
      { id: "o1", value: "263", label: { en: "263 books", hi: "263 किताबें", te: "263 పుస్తకాలు" } },
      { id: "o2", value: "273", label: { en: "273 books", hi: "273 किताबें", te: "273 పుస్తకాలు" }, errorType: "regrouping" },
      { id: "o3", value: "363", label: { en: "363 books", hi: "363 किताबें", te: "363 పుస్తకాలు" }, errorType: "regrouping" },
      { id: "o4", value: "267", label: { en: "267 books", hi: "267 किताबें", te: "267 పుస్తకాలు" }, errorType: "slip" },
    ],
    correctAnswer: "263",
    verifiedSolution: {
      en: "Borrowing across zeros: 500 becomes 4 hundreds, 9 tens, 10 ones. 10 - 7 = 3; 9 - 3 = 6; 4 - 2 = 2. Result = 263.",
      hi: "शून्य से उधार लेना: 500 बनता है 4 सैकड़ा, 9 दहाई, 10 इकाई। 10 - 7 = 3; 9 - 3 = 6; 4 - 2 = 2। उत्तर = 263।",
      te: "సున్నాల నుండి అప్పు తీసుకోవడం: 500 అనేది 4 వందలు, 9 పదులు, 10 ఒకట్లు అవుతుంది. 10 - 7 = 3; 9 - 3 = 6; 4 - 2 = 2. జవాబు = 263.",
    },
    hint: {
      en: "Regroup across the zeros: 500 = 400 + 90 + 10.",
      hi: "शून्यों के आर-पार हासिल बदलें: 500 = 400 + 90 + 10।",
      te: "సున్నాల మీదుగా మార్పిడి చేయండి: 500 = 400 + 90 + 10.",
    },
    provenanceLabel: "NCERT Exemplar Class 3",
  },
  {
    id: "icse_m3_hots_l5_01",
    sourceStyle: "icse_foundation",
    board: "ICSE",
    bookFamily: "Frank ICSE Primary Mathematics 3",
    class: 3,
    conceptIds: ["mult_concept"],
    difficulty: 5, // L5 Challenge / HOTS
    format: "mcq",
    prompt: {
      en: "A train has 6 compartments. Each compartment has 8 windows on the left and 8 windows on the right. What is the total number of windows on the train?",
      hi: "एक रेलगाड़ी में 6 डिब्बे हैं। प्रत्येक डिब्बे में बाईं ओर 8 खिड़कियां और दाईं ओर 8 खिड़कियां हैं। रेलगाड़ी में कुल कितनी खिड़कियां हैं?",
      te: "ఒక రైలులో 6 బోగీలు ఉన్నాయి. ప్రతి బోగీకి ఎడమవైపు 8 కిటికీలు, కుడివైపు 8 కిటికీలు ఉన్నాయి. ఆ రైలులోని మొత్తం కిటికీల సంఖ్య ఎంత?",
    },
    expression: "6 × (8 + 8) = ?",
    options: [
      { id: "o1", value: "96", label: { en: "96 windows", hi: "96 खिड़कियां", te: "96 కిటికీలు" } },
      { id: "o2", value: "48", label: { en: "48 windows", hi: "48 खिड़कियां", te: "48 కిటికీలు" }, errorType: "slip" },
      { id: "o3", value: "88", label: { en: "88 windows", hi: "88 खिड़कियां", te: "88 కిటికీలు" }, errorType: "wrong_operation" },
      { id: "o4", value: "106", label: { en: "106 windows", hi: "106 खिड़कियां", te: "106 కిటికీలు" }, errorType: "slip" },
    ],
    correctAnswer: "96",
    verifiedSolution: {
      en: "Each compartment has 8 + 8 = 16 windows. Across 6 compartments: 6 × 16 = 96 windows.",
      hi: "प्रत्येक डिब्बे में 8 + 8 = 16 खिड़कियां हैं। 6 डिब्बों में: 6 × 16 = 96 खिड़कियां।",
      te: "ప్రతి బోగీకి 8 + 8 = 16 కిటికీలు. 6 బోగీలలో: 6 × 16 = 96 కిటికీలు.",
    },
    hint: {
      en: "First calculate the windows in one single compartment, then multiply by 6.",
      hi: "पहले एक डिब्बे की कुल खिड़कियां निकालें, फिर 6 से गुणा करें।",
      te: "ముందుగా ఒక బోగీలోని మొత్తం కిటికీలను లెక్కించి, తరువాత 6 తో గుణించండి.",
    },
    provenanceLabel: "Frank ICSE Primary Maths Class 3",
  },

  // =========================================================================
  // CLASS 4: MULTIPLICATION & DIVISION
  // =========================================================================
  {
    id: "ncert_m4_div_l1_01",
    sourceStyle: "ncert",
    board: "NCERT",
    bookFamily: "NCERT Math-Magic 4",
    class: 4,
    conceptIds: ["division_concept"],
    difficulty: 1, // L1 Recall
    format: "mcq",
    prompt: {
      en: "Ananya has 24 gulab jamuns to share equally among 4 friends. How many gulab jamuns does each friend receive?",
      hi: "अनन्या के पास 4 दोस्तों में बराबर बांटने के लिए 24 गुलाब जामुन हैं। प्रत्येक दोस्त को कितने गुलाब जामुन मिलेंगे?",
      te: "అనన్య వద్ద 4 గురు స్నేహితులకు సమానంగా పంచడానికి 24 గులాబ్ జామున్లు ఉన్నాయి. ప్రతి స్నేహితుడికి ఎన్ని గులాబ్ జామున్లు వస్తాయి?",
    },
    expression: "24 ÷ 4 = ?",
    options: [
      { id: "o1", value: "6", label: { en: "6 gulab jamuns", hi: "6 गुलाब जामुन", te: "6 గులాబ్ జామున్లు" } },
      { id: "o2", value: "5", label: { en: "5 gulab jamuns", hi: "5 गुलाब जामुन", te: "5 గులాబ్ జామున్లు" }, errorType: "slip" },
      { id: "o3", value: "8", label: { en: "8 gulab jamuns", hi: "8 गुलाब जामुन", te: "8 గులాబ్ జామున్లు" }, errorType: "slip" },
      { id: "o4", value: "20", label: { en: "20 gulab jamuns", hi: "20 गुलाब जामुन", te: "20 గులాబ్ జామున్లు" }, errorType: "wrong_operation" },
    ],
    correctAnswer: "6",
    verifiedSolution: {
      en: "Sharing 24 equally into 4 groups: 24 ÷ 4 = 6. Each friend receives 6 gulab jamuns.",
      hi: "24 को 4 बराबर समूहों में बांटना: 24 ÷ 4 = 6। प्रत्येक दोस्त को 6 मिलेंगे।",
      te: "24 ని 4 సమాన భాగాలుగా పంచితే: 24 ÷ 4 = 6. ప్రతి స్నేహితుడికి 6 వస్తాయి.",
    },
    hint: {
      en: "Think: 4 times what number equals 24?",
      hi: "सोचें: 4 का पहाड़ा कितनी बार पढ़ने पर 24 आता है?",
      te: "ఆలోచించండి: 4 ని దేనితో గుణిస్తే 24 వస్తుంది?",
    },
    provenanceLabel: "NCERT Math-Magic Class 4",
  },
  {
    id: "selina_m4_div_l2_01",
    sourceStyle: "icse_selina",
    board: "ICSE",
    bookFamily: "Selina Concise Mathematics 4",
    class: 4,
    conceptIds: ["division_facts"],
    difficulty: 2, // L2 Understanding
    format: "mcq",
    prompt: {
      en: "Divide 72 by 8. What is the quotient?",
      hi: "72 को 8 से भाग दें। भागफल क्या है?",
      te: "72 ని 8 తో భాగించండి. భాగఫలం ఎంత?",
    },
    expression: "72 ÷ 8 = ?",
    options: [
      { id: "o1", value: "9", label: { en: "9", hi: "9", te: "9" } },
      { id: "o2", value: "8", label: { en: "8", hi: "8", te: "8" }, errorType: "slip" },
      { id: "o3", value: "7", label: { en: "7", hi: "7", te: "7" }, errorType: "slip" },
      { id: "o4", value: "64", label: { en: "64", hi: "64", te: "64" }, errorType: "wrong_operation" },
    ],
    correctAnswer: "9",
    verifiedSolution: {
      en: "8 × 9 = 72, so 72 ÷ 8 = 9.",
      hi: "8 × 9 = 72, इसलिए 72 ÷ 8 = 9।",
      te: "8 × 9 = 72, కాబట్టి 72 ÷ 8 = 9.",
    },
    hint: {
      en: "Recall the 8 times multiplication table.",
      hi: "8 का पहाड़ा याद करें।",
      te: "8 వ ఎక్కం గుర్తుచేసుకోండి.",
    },
    provenanceLabel: "ICSE Selina Concise Mathematics Class 4",
  },
  {
    id: "rdsharma_m4_mul_l3_01",
    sourceStyle: "cbse_reference",
    board: "CBSE",
    bookFamily: "R.D. Sharma Mathematics 4",
    class: 4,
    conceptIds: ["multi_digit_mult"],
    difficulty: 3, // L3 Application
    format: "mcq",
    prompt: {
      en: "A box contains 25 packets of biscuits. Each packet has 16 biscuits. How many biscuits are in the box?",
      hi: "एक डिब्बे में बिस्कुट के 25 पैकेट हैं। प्रत्येक पैकेट में 16 बिस्कुट हैं। डिब्बे में कुल कितने बिस्कुट हैं?",
      te: "ఒక పెట్టెలో 25 బిస్కెట్ ప్యాకెట్లు ఉన్నాయి. ప్రతి ప్యాకెట్‌లో 16 బిస్కెట్లు ఉన్నాయి. ఆ పెట్టెలో మొత్తం ఎన్ని బిస్కెట్లు ఉన్నాయి?",
    },
    expression: "25 × 16 = ?",
    options: [
      { id: "o1", value: "400", label: { en: "400 biscuits", hi: "400 बिस्कुट", te: "400 బిస్కెట్లు" } },
      { id: "o2", value: "350", label: { en: "350 biscuits", hi: "350 बिस्कुट", te: "350 బిస్కెట్లు" }, errorType: "regrouping" },
      { id: "o3", value: "375", label: { en: "375 biscuits", hi: "375 बिस्कुट", te: "375 బిస్కెట్లు" }, errorType: "slip" },
      { id: "o4", value: "41", label: { en: "41 biscuits", hi: "41 बिस्कुट", te: "41 బిస్కెట్లు" }, errorType: "wrong_operation" },
    ],
    correctAnswer: "400",
    verifiedSolution: {
      en: "25 × 16 = 25 × (10 + 6) = 250 + 150 = 400 biscuits.",
      hi: "25 × 16 = 25 × (10 + 6) = 250 + 150 = 400 बिस्कुट।",
      te: "25 × 16 = 25 × (10 + 6) = 250 + 150 = 400 బిస్కెట్లు.",
    },
    hint: {
      en: "Break 16 into 10 + 6, or multiply 25 by 4 and then by 4.",
      hi: "16 को 10 + 6 में तोड़ें, या 25 को 4 से गुणा करके फिर 4 से गुणा करें।",
      te: "16 ని 10 + 6 గా విభజించండి, లేదా 25 ని 4 తో గుణించి మళ్ళీ 4 తో గుణించండి.",
    },
    provenanceLabel: "CBSE R.D. Sharma Mathematics Class 4",
  },
  {
    id: "exemplar_m4_div_l4_01",
    sourceStyle: "exemplar",
    board: "CBSE",
    bookFamily: "NCERT Exemplar Problems Class 4",
    class: 4,
    conceptIds: ["long_division"],
    difficulty: 4, // L4 Analysis
    format: "mcq",
    prompt: {
      en: "85 children are going on a school trip in auto-rickshaws. If each auto can safely seat 4 children, how many autos are needed so that all children can travel?",
      hi: "85 बच्चे ऑटो-रिक्शा से स्कूल ट्रिप पर जा रहे हैं। यदि प्रत्येक ऑटो में 4 बच्चे सुरक्षित बैठ सकते हैं, तो सभी बच्चों के जाने के लिए कितने ऑटो चाहिए?",
      te: "85 మంది పిల్లలు ఆటో రిక్షాలలో విహారయాత్రకు వెళ్తున్నారు. ప్రతి ఆటోలో 4 గురు పిల్లలు సురక్షితంగా కూర్చోగలిగితే, అందరూ వెళ్ళడానికి ఎన్ని ఆటోలు అవసరం?",
    },
    expression: "85 ÷ 4 = 21 R 1",
    options: [
      { id: "o1", value: "22", label: { en: "22 autos", hi: "22 ऑटो", te: "22 ఆటోలు" } },
      { id: "o2", value: "21", label: { en: "21 autos", hi: "21 ऑटो", te: "21 ఆటోలు" }, errorType: "remainder" },
      { id: "o3", value: "20", label: { en: "20 autos", hi: "20 ऑटो", te: "20 ఆటోలు" }, errorType: "slip" },
      { id: "o4", value: "81", label: { en: "81 autos", hi: "81 ऑटो", te: "81 ఆటోలు" }, errorType: "wrong_operation" },
    ],
    correctAnswer: "22",
    verifiedSolution: {
      en: "85 ÷ 4 gives quotient 21 with remainder 1 child. That 1 remaining child still needs an auto, so 21 + 1 = 22 autos are required.",
      hi: "85 ÷ 4 से भागफल 21 और शेषफल 1 बच्चा आता है। बचे 1 बच्चे के लिए भी एक ऑटो चाहिए, इसलिए 21 + 1 = 22 ऑटो की आवश्यकता होगी।",
      te: "85 ÷ 4 చేస్తే భాగఫలం 21, శేషం 1 మిగులుతుంది. ఆ 1 బిడ్డ ప్రయాణించడానికి కూడా ఒక ఆటో కావాలి, కాబట్టి 21 + 1 = 22 ఆటోలు అవసరం.",
    },
    hint: {
      en: "Don't leave the remaining child behind! Round up for the extra child.",
      hi: "बचे हुए बच्चे को मत छोड़िए! एक अतिरिक्त ऑटो जोड़ें।",
      te: "మిగిలిన ఒక్క బిడ్డను వదిలివేయలేము కదా! అదనంగా ఒక ఆటో కలపండి.",
    },
    provenanceLabel: "NCERT Exemplar Class 4",
  },
  {
    id: "icse_m4_hots_l5_01",
    sourceStyle: "icse_foundation",
    board: "ICSE",
    bookFamily: "ML Aggarwal Mathematics Class 4",
    class: 4,
    conceptIds: ["division_word"],
    difficulty: 5, // L5 Challenge / Olympiad
    format: "mcq",
    prompt: {
      en: "A farmer packed 156 oranges equally into 12 baskets. He then sold 5 baskets. How many oranges did he sell in total?",
      hi: "एक किसान ने 156 संतरे 12 टोकरियों में बराबर भरे। फिर उसने 5 टोकरियां बेच दीं। उसने कुल कितने संतरे बेचे?",
      te: "ఒక రైతు 156 నారింజ పండ్లను 12 బుట్టలలో సమానంగా సర్దాడు. తరువాత అతను 5 బుట్టలను విక్రయించాడు. అతను మొత్తం ఎన్ని నారింజ పండ్లను విక్రయించాడు?",
    },
    expression: "(156 ÷ 12) × 5 = ?",
    options: [
      { id: "o1", value: "65", label: { en: "65 oranges", hi: "65 संतरे", te: "65 నారింజ పండ్లు" } },
      { id: "o2", value: "13", label: { en: "13 oranges", hi: "13 संतरे", te: "13 నారింజ పండ్లు" }, errorType: "slip" },
      { id: "o3", value: "60", label: { en: "60 oranges", hi: "60 संतरे", te: "60 నారింజ పండ్లు" }, errorType: "slip" },
      { id: "o4", value: "75", label: { en: "75 oranges", hi: "75 संतरे", te: "75 నారింజ పండ్లు" }, errorType: "regrouping" },
    ],
    correctAnswer: "65",
    verifiedSolution: {
      en: "Step 1: Oranges per basket = 156 ÷ 12 = 13 oranges. Step 2: 5 baskets sold = 5 × 13 = 65 oranges.",
      hi: "चरण 1: प्रति टोकरी संतरे = 156 ÷ 12 = 13 संतरे। चरण 2: 5 टोकरियां बिकीं = 5 × 13 = 65 संतरे।",
      te: "దశ 1: ప్రతి బుట్టలోని పండ్లు = 156 ÷ 12 = 13. దశ 2: 5 బుట్టలు అమ్మినవి = 5 × 13 = 65 నారింజ పండ్లు.",
    },
    hint: {
      en: "First find out how many oranges fit in 1 basket, then multiply by 5.",
      hi: "पहले पता करें कि 1 टोकरी में कितने संतरे आते हैं, फिर 5 से गुणा करें।",
      te: "ముందుగా 1 బుట్టలో ఎన్ని పండ్లు పడతాయో కనుక్కోండి, ఆపై 5 తో గుణించండి.",
    },
    provenanceLabel: "ML Aggarwal Primary Maths Class 4",
  },

  // =========================================================================
  // CLASS 5: FRACTIONS & ADVANCED OPERATIONS
  // =========================================================================
  {
    id: "ncert_m5_frac_l1_01",
    sourceStyle: "ncert",
    board: "NCERT",
    bookFamily: "NCERT Math-Magic 5",
    class: 5,
    conceptIds: ["fraction_basics"],
    difficulty: 1, // L1 Recall
    format: "mcq",
    prompt: {
      en: "A circle is divided into 4 equal parts. 3 parts are shaded blue. What fraction represents the shaded part?",
      hi: "एक वृत्त को 4 बराबर भागों में बांटा गया है। 3 भाग नीले रंग से रंगे हैं। रंगे हुए भाग को कौन सी भिन्न दर्शाती है?",
      te: "ఒక వృత్తం 4 సమాన భాగాలుగా విభజించబడింది. 3 భాగాలు నీలం రంగుతో నింపబడ్డాయి. రంగు వేసిన భాగాన్ని సూచించే భిన్నం ఏది?",
    },
    expression: "3 of 4 equal parts",
    options: [
      { id: "o1", value: "3/4", label: { en: "3/4", hi: "3/4", te: "3/4" } },
      { id: "o2", value: "1/4", label: { en: "1/4", hi: "1/4", te: "1/4" }, errorType: "fraction_inverted" },
      { id: "o3", value: "4/3", label: { en: "4/3", hi: "4/3", te: "4/3" }, errorType: "fraction_inverted" },
      { id: "o4", value: "3/1", label: { en: "3/1", hi: "3/1", te: "3/1" }, errorType: "slip" },
    ],
    correctAnswer: "3/4",
    verifiedSolution: {
      en: "Numerator is shaded parts (3). Denominator is total equal parts (4). Fraction = 3/4.",
      hi: "अंश रंगे हुए भाग हैं (3)। हर कुल बराबर भाग हैं (4)। भिन्न = 3/4।",
      te: "లవం రంగు వేసిన భాగాలు (3). హారం మొత్తం సమాన భాగాలు (4). భిన్నం = 3/4.",
    },
    hint: {
      en: "Numerator = shaded parts, Denominator = total parts.",
      hi: "अंश = रंगे भाग, हर = कुल भाग।",
      te: "లవం = రంగు వేసిన భాగాలు, హారం = మొత్తం భాగాలు.",
    },
    provenanceLabel: "NCERT Math-Magic Class 5",
  },
  {
    id: "selina_m5_eqf_l2_01",
    sourceStyle: "icse_selina",
    board: "ICSE",
    bookFamily: "Selina Concise Mathematics 5",
    class: 5,
    conceptIds: ["equivalent_fractions"],
    difficulty: 2, // L2 Understanding
    format: "mcq",
    prompt: {
      en: "Which of the following fractions is equivalent to 2/5?",
      hi: "निम्नलिखित में से कौन सी भिन्न 2/5 के तुल्य है?",
      te: "కింది వాటిలో 2/5 కు సమానమైన భిన్నం ఏది?",
    },
    expression: "2/5 = ?/15",
    options: [
      { id: "o1", value: "6/15", label: { en: "6/15", hi: "6/15", te: "6/15" } },
      { id: "o2", value: "4/15", label: { en: "4/15", hi: "4/15", te: "4/15" }, errorType: "slip" },
      { id: "o3", value: "5/10", label: { en: "5/10", hi: "5/10", te: "5/10" }, errorType: "slip" },
      { id: "o4", value: "3/6", label: { en: "3/6", hi: "3/6", te: "3/6" }, errorType: "slip" },
    ],
    correctAnswer: "6/15",
    verifiedSolution: {
      en: "Multiply numerator and denominator by 3: (2 × 3) / (5 × 3) = 6/15.",
      hi: "अंश और हर दोनों को 3 से गुणा करें: (2 × 3) / (5 × 3) = 6/15।",
      te: "లవం మరియు హారం రెండింటినీ 3 తో గుణించండి: (2 × 3) / (5 × 3) = 6/15.",
    },
    hint: {
      en: "Multiply both the top and bottom by the same number.",
      hi: "ऊपर और नीचे दोनों को एक ही संख्या से गुणा करें।",
      te: "లవం మరియు హారాన్ని ఒకే సంఖ్యతో గుణించండి.",
    },
    provenanceLabel: "ICSE Selina Concise Mathematics Class 5",
  },
  {
    id: "rdsharma_m5_cmp_l3_01",
    sourceStyle: "cbse_reference",
    board: "CBSE",
    bookFamily: "R.S. Aggarwal Mathematics Class 5",
    class: 5,
    conceptIds: ["comparing_fractions"],
    difficulty: 3, // L3 Application
    format: "mcq",
    prompt: {
      en: "Rohan ate 3/8 of a watermelon and Siya ate 5/8 of the watermelon. Who ate more, and what is the difference?",
      hi: "रोहन ने तरबूज का 3/8 भाग खाया और सिया ने 5/8 भाग खाया। किसने अधिक खाया, और कितना अधिक?",
      te: "రోహన్ పుచ్చకాయలో 3/8 భాగం తిన్నాడు, సియా 5/8 భాగం తిన్నది. ఎవరు ఎక్కువ తిన్నారు, వారి తేడా ఎంత?",
    },
    expression: "5/8 - 3/8 = ?",
    options: [
      { id: "o1", value: "Siya by 2/8", label: { en: "Siya by 2/8 (or 1/4)", hi: "सिया ने 2/8 (या 1/4) अधिक", te: "సియా 2/8 (లేదా 1/4) ఎక్కువ" } },
      { id: "o2", value: "Rohan by 2/8", label: { en: "Rohan by 2/8", hi: "रोहन ने 2/8 अधिक", te: "రోహన్ 2/8 ఎక్కువ" }, errorType: "slip" },
      { id: "o3", value: "Siya by 8/8", label: { en: "Siya by 8/8", hi: "सिया ने 8/8 अधिक", te: "సియా 8/8 ఎక్కువ" }, errorType: "fraction_add_denominators" },
      { id: "o4", value: "Both ate equal", label: { en: "Both ate equal", hi: "दोनों ने बराबर खाया", te: "ఇద్దరూ సమానంగా తిన్నారు" }, errorType: "slip" },
    ],
    correctAnswer: "Siya by 2/8",
    verifiedSolution: {
      en: "With like denominators: 5/8 > 3/8, so Siya ate more. Difference = 5/8 - 3/8 = 2/8 = 1/4.",
      hi: "समान हर होने पर: 5/8 > 3/8, इसलिए सिया ने अधिक खाया। अंतर = 5/8 - 3/8 = 2/8।",
      te: "సమాన హారాలు ఉన్నప్పుడు: 5/8 > 3/8, కాబట్టి సియా ఎక్కువ తిన్నది. తేడా = 5/8 - 3/8 = 2/8.",
    },
    hint: {
      en: "When denominators are the same, simply compare the numerators.",
      hi: "जब हर समान हों, तो केवल अंशों की तुलना करें।",
      te: "హారాలు సమానంగా ఉన్నప్పుడు, కేవలం లవాలను పోల్చండి.",
    },
    provenanceLabel: "CBSE R.S. Aggarwal Mathematics Class 5",
  },
  {
    id: "exemplar_m5_add_l4_01",
    sourceStyle: "exemplar",
    board: "CBSE",
    bookFamily: "NCERT Exemplar Problems Class 5",
    class: 5,
    conceptIds: ["fraction_addition"],
    difficulty: 4, // L4 Analysis
    format: "mcq",
    prompt: {
      en: "Arjun painted 1/2 of a fence in the morning and 1/4 of the fence in the afternoon. What total fraction of the fence did he paint?",
      hi: "अर्जुन ने सुबह एक बाड़ का 1/2 भाग रंगा और दोपहर में 1/4 भाग रंगा। उसने बाड़ का कुल कितना भाग रंगा?",
      te: "అర్జున్ ఉదయం కంచెలో 1/2 భాగం, మధ్యాహ్నం 1/4 భాగం పెయింట్ చేశాడు. అతను కంచెలో మొత్తం ఎంత భాగానికి పెయింట్ చేశాడు?",
    },
    expression: "1/2 + 1/4 = ?",
    options: [
      { id: "o1", value: "3/4", label: { en: "3/4", hi: "3/4", te: "3/4" } },
      { id: "o2", value: "2/6", label: { en: "2/6", hi: "2/6", te: "2/6" }, errorType: "fraction_add_denominators" },
      { id: "o3", value: "1/6", label: { en: "1/6", hi: "1/6", te: "1/6" }, errorType: "fraction_add_denominators" },
      { id: "o4", value: "2/4", label: { en: "2/4", hi: "2/4", te: "2/4" }, errorType: "slip" },
    ],
    correctAnswer: "3/4",
    verifiedSolution: {
      en: "Convert 1/2 to equivalent denominator of 4: 1/2 = 2/4. Then: 2/4 + 1/4 = 3/4.",
      hi: "1/2 को 4 के तुल्य भिन्न में बदलें: 1/2 = 2/4। फिर: 2/4 + 1/4 = 3/4।",
      te: "1/2 ని సమాన హారం 4 గా మార్చండి: 1/2 = 2/4. అప్పుడు: 2/4 + 1/4 = 3/4.",
    },
    hint: {
      en: "Change 1/2 into fourths first before adding.",
      hi: "जोड़ने से पहले 1/2 को चौथाई (चतुर्थांश) में बदलें।",
      te: "కూడే ముందు 1/2 ని నాలుగు భాగాలుగా మార్చండి.",
    },
    provenanceLabel: "NCERT Exemplar Class 5",
  },
  {
    id: "icse_m5_hots_l5_01",
    sourceStyle: "icse_selina",
    board: "ICSE",
    bookFamily: "Selina Concise Mathematics 5",
    class: 5,
    conceptIds: ["fraction_addition"],
    difficulty: 5, // L5 Challenge / Olympiad
    format: "mcq",
    prompt: {
      en: "A recipe requires 2/3 cup of milk and 1/6 cup of water. What is the total volume of liquid required, and what fraction remains to make a full cup?",
      hi: "एक नुस्खे के लिए 2/3 कप दूध और 1/6 कप पानी की आवश्यकता है। कुल तरल कितना है, और पूरा एक कप बनने में कितना कम है?",
      te: "ఒక వంటకానికి 2/3 కప్పు పాలు మరియు 1/6 కప్పు నీరు అవసరం. మొత్తం ద్రవం ఎంత, మరియు ఒక పూర్తి కప్పు కావడానికి ఇంకా ఎంత భాగం మిగిలి ఉంది?",
    },
    expression: "2/3 + 1/6 = 5/6, Remaining = 1/6",
    options: [
      { id: "o1", value: "5/6 total, 1/6 remaining", label: { en: "5/6 total, 1/6 remaining", hi: "कुल 5/6, शेष 1/6", te: "మొత్తం 5/6, మిగిలినది 1/6" } },
      { id: "o2", value: "3/9 total, 6/9 remaining", label: { en: "3/9 total, 6/9 remaining", hi: "कुल 3/9, शेष 6/9", te: "మొత్తం 3/9, మిగిలినది 6/9" }, errorType: "fraction_add_denominators" },
      { id: "o3", value: "4/6 total, 2/6 remaining", label: { en: "4/6 total, 2/6 remaining", hi: "कुल 4/6, शेष 2/6", te: "మొత్తం 4/6, మిగిలినది 2/6" }, errorType: "slip" },
      { id: "o4", value: "1 cup total, 0 remaining", label: { en: "1 full cup, 0 remaining", hi: "पूरा 1 कप, शेष 0", te: "మొత్తం 1 కప్పు, మిగిలినది 0" }, errorType: "slip" },
    ],
    correctAnswer: "5/6 total, 1/6 remaining",
    verifiedSolution: {
      en: "2/3 = 4/6. Total liquid = 4/6 + 1/6 = 5/6 cup. Remaining to make 1 full cup = 1 - 5/6 = 1/6 cup.",
      hi: "2/3 = 4/6। कुल तरल = 4/6 + 1/6 = 5/6 कप। 1 पूरा कप बनने में शेष = 1 - 5/6 = 1/6 कप।",
      te: "2/3 = 4/6. మొత్తం ద్రవం = 4/6 + 1/6 = 5/6 కప్పు. పూర్తి కప్పు కావడానికి మిగిలింది = 1 - 5/6 = 1/6 కప్పు.",
    },
    hint: {
      en: "Find a common denominator of 6 for both fractions.",
      hi: "दोनों भिन्नों के लिए 6 का उभयनिष्ठ हर ज्ञात करें।",
      te: "రెండు భిన్నాలకు ఉమ్మడి హారం 6 గా మార్చండి.",
    },
    provenanceLabel: "ICSE Selina Concise Mathematics Class 5",
  },
  {
    id: "selina_m5_num_l1_01",
    sourceStyle: "icse_selina",
    board: "ICSE",
    bookFamily: "Selina Concise Mathematics 5",
    class: 5,
    conceptIds: ["place_value", "number_sense"],
    difficulty: 1, // L1 Recall
    format: "mcq",
    prompt: {
      en: "In the number 8,45,210, what is the place value of the digit 4 in the Indian number system?",
      hi: "संख्या 8,45,210 में भारतीय संख्या प्रणाली में अंक 4 का स्थानीय मान क्या है?",
      te: "భారతీయ సంఖ్యా మానంలో 8,45,210 సంఖ్యలో 4 అంకె యొక్క స్థాన విలువ ఎంత?",
    },
    expression: "8,45,210",
    options: [
      { id: "o1", value: "40000", label: { en: "40,000 (Forty Thousand)", hi: "40,000 (चालीस हजार)", te: "40,000 (నలభై వేలు)" } },
      { id: "o2", value: "4000", label: { en: "4,000", hi: "4,000", te: "4,000" }, errorType: "place_value" },
      { id: "o3", value: "400000", label: { en: "4,00,000", hi: "4,00,000", te: "4,00,000" }, errorType: "place_value" },
      { id: "o4", value: "400", label: { en: "400", hi: "400", te: "400" }, errorType: "slip" },
    ],
    correctAnswer: "40000",
    verifiedSolution: {
      en: "The digit 4 lies in the ten-thousands place: 4 × 10,000 = 40,000.",
      hi: "अंक 4 दस हजार के स्थान पर है: 4 × 10,000 = 40,000।",
      te: "4 అంకె పదివేల స్థానంలో ఉంది: 4 × 10,000 = 40,000.",
    },
    hint: {
      en: "Count the places from right: ones, tens, hundreds, thousands, ten thousands.",
      hi: "दाएं से स्थान गिनें: इकाई, दहाई, सैकड़ा, हजार, दस हजार।",
      te: "కుడి వైపు నుండి లెక్కించండి: ఒకట్లు, పదులు, వందలు, వేలు, పదివేలు.",
    },
    provenanceLabel: "ICSE Selina Concise Mathematics Class 5",
  },
  {
    id: "foundation_m5_num_l2_01",
    sourceStyle: "icse_foundation",
    board: "ICSE",
    bookFamily: "ML Aggarwal Primary Maths Class 5",
    class: 5,
    conceptIds: ["number_sense", "place_value"],
    difficulty: 2, // L2 Understanding
    format: "mcq",
    prompt: {
      en: "Write the numeral for: Seven lakh fifty thousand two hundred and four.",
      hi: "अंकों में लिखें: सात लाख पचास हजार दो सौ चार।",
      te: "సంఖ్యారూపంలో రాయండి: ఏడు లక్షల యాభై వేల రెండు వందల నాలుగు.",
    },
    expression: "7,00,000 + 50,000 + 200 + 4",
    options: [
      { id: "o1", value: "750204", label: { en: "7,50,204", hi: "7,50,204", te: "7,50,204" } },
      { id: "o2", value: "705204", label: { en: "7,05,204", hi: "7,05,204", te: "7,05,204" }, errorType: "place_value" },
      { id: "o3", value: "75204", label: { en: "75,204", hi: "75,204", te: "75,204" }, errorType: "slip" },
      { id: "o4", value: "752004", label: { en: "7,52,004", hi: "7,52,004", te: "7,52,004" }, errorType: "place_value" },
    ],
    correctAnswer: "750204",
    verifiedSolution: {
      en: "7 lakhs = 7,00,000; 50 thousands = 50,000; 2 hundreds = 200; 4 ones = 4. Total = 7,50,204.",
      hi: "7 लाख = 7,00,000; 50 हजार = 50,000; 2 सौ = 200; 4 इकाई = 4। कुल = 7,50,204।",
      te: "7 లక్షలు = 7,00,000; 50 వేలు = 50,000; 2 వందలు = 200; 4 ఒకట్లు = 4. మొత్తం = 7,50,204.",
    },
    hint: {
      en: "Place digits in Lakhs, Ten-Thousands, Thousands, Hundreds, Tens, and Ones places.",
      hi: "अंकों को लाख, दस हजार, हजार, सैकड़ा, दहाई और इकाई के स्थानों पर रखें।",
      te: "లక్షలు, పదివేలు, వేలు, వందలు, పదులు, ఒకట్ల స్థానాల్లో అంకెలను ఉంచండి.",
    },
    provenanceLabel: "ICSE ML Aggarwal Primary Maths Class 5",
  },
  {
    id: "selina_m5_mult_l2_01",
    sourceStyle: "icse_selina",
    board: "ICSE",
    bookFamily: "Selina Concise Mathematics 5",
    class: 5,
    conceptIds: ["multi_digit_mult", "mult_facts"],
    difficulty: 2, // L2 Understanding
    format: "mcq",
    prompt: {
      en: "A school box contains 144 pencils. How many pencils are there in 25 such boxes?",
      hi: "एक स्कूल बॉक्स में 144 पेंसिलें हैं। ऐसे 25 बॉक्सों में कुल कितनी पेंसिलें होंगी?",
      te: "ఒక పెట్టెలో 144 పెన్సిళ్లు ఉన్నాయి. అలాంటి 25 పెట్టెలలో మొత్తం ఎన్ని పెన్సిళ్లు ఉంటాయి?",
    },
    expression: "144 × 25 = ?",
    options: [
      { id: "o1", value: "3600", label: { en: "3,600 pencils", hi: "3,600 पेंसिलें", te: "3,600 పెన్సిళ్లు" } },
      { id: "o2", value: "3400", label: { en: "3,400 pencils", hi: "3,400 पेंसिलें", te: "3,400 పెన్సిళ్లు" }, errorType: "regrouping" },
      { id: "o3", value: "360", label: { en: "360 pencils", hi: "360 पेंसिलें", te: "360 పెన్సిళ్లు" }, errorType: "place_value" },
      { id: "o4", value: "3800", label: { en: "3,800 pencils", hi: "3,800 पेंसिलें", te: "3,800 పెన్సిళ్లు" }, errorType: "slip" },
    ],
    correctAnswer: "3600",
    verifiedSolution: {
      en: "144 × 25 = 144 × (100 ÷ 4) = 14,400 ÷ 4 = 3,600 pencils.",
      hi: "144 × 25 = 3,600 पेंसिलें।",
      te: "144 × 25 = 3,600 పెన్సిళ్లు.",
    },
    hint: {
      en: "Multiply 144 by 25 using standard multiplication or 144 × 100 ÷ 4.",
      hi: "144 को 25 से गुणा करें।",
      te: "144 ను 25 తో గుణించండి.",
    },
    provenanceLabel: "ICSE Selina Concise Mathematics Class 5",
  },
  {
    id: "foundation_m5_mult_l3_01",
    sourceStyle: "icse_foundation",
    board: "ICSE",
    bookFamily: "ML Aggarwal Primary Maths Class 5",
    class: 5,
    conceptIds: ["multi_digit_mult"],
    difficulty: 3, // L3 Application
    format: "mcq",
    prompt: {
      en: "Calculate the product: 325 × 48.",
      hi: "गुणनफल ज्ञात कीजिए: 325 × 48।",
      te: "గుణకారం చేయండి: 325 × 48.",
    },
    expression: "325 × 48 = ?",
    options: [
      { id: "o1", value: "15600", label: { en: "15,600", hi: "15,600", te: "15,600" } },
      { id: "o2", value: "15300", label: { en: "15,300", hi: "15,300", te: "15,300" }, errorType: "regrouping" },
      { id: "o3", value: "14600", label: { en: "14,600", hi: "14,600", te: "14,600" }, errorType: "slip" },
      { id: "o4", value: "16000", label: { en: "16,000", hi: "16,000", te: "16,000" }, errorType: "slip" },
    ],
    correctAnswer: "15600",
    verifiedSolution: {
      en: "325 × 8 = 2,600. 325 × 40 = 13,000. Sum = 2,600 + 13,000 = 15,600.",
      hi: "325 × 8 = 2,600। 325 × 40 = 13,000। योग = 2,600 + 13,000 = 15,600।",
      te: "325 × 8 = 2,600. 325 × 40 = 13,000. మొత్తం = 2,600 + 13,000 = 15,600.",
    },
    hint: {
      en: "Multiply 325 by 8, then 325 by 40, and add the two partial products.",
      hi: "325 को 8 से गुणा करें, फिर 40 से गुणा करें और दोनों को जोड़ें।",
      te: "325 ని 8 తో, తరువాత 40 తో గుణించి రెండింటినీ కూడండి.",
    },
    provenanceLabel: "ICSE ML Aggarwal Primary Maths Class 5",
  },
  {
    id: "selina_m5_div_l2_01",
    sourceStyle: "icse_selina",
    board: "ICSE",
    bookFamily: "Selina Concise Mathematics 5",
    class: 5,
    conceptIds: ["division_facts", "long_division"],
    difficulty: 2, // L2 Understanding
    format: "mcq",
    prompt: {
      en: "Divide 864 by 12. What is the quotient?",
      hi: "864 को 12 से भाग दीजिए। भागफल क्या है?",
      te: "864 ను 12 తో భాగించండి. భాగఫలం ఎంత?",
    },
    expression: "864 ÷ 12 = ?",
    options: [
      { id: "o1", value: "72", label: { en: "72", hi: "72", te: "72" } },
      { id: "o2", value: "70", label: { en: "70", hi: "70", te: "70" }, errorType: "slip" },
      { id: "o3", value: "68", label: { en: "68", hi: "68", te: "68" }, errorType: "regrouping" },
      { id: "o4", value: "74", label: { en: "74", hi: "74", te: "74" }, errorType: "slip" },
    ],
    correctAnswer: "72",
    verifiedSolution: {
      en: "86 ÷ 12 = 7 with remainder 2. Bring down 4: 24 ÷ 12 = 2. Quotient = 72, Remainder = 0.",
      hi: "86 ÷ 12 = 7 (शेष 2)। 24 ÷ 12 = 2। भागफल = 72।",
      te: "86 ÷ 12 = 7 (శేషం 2). 24 ÷ 12 = 2. భాగఫలం = 72.",
    },
    hint: {
      en: "12 × 7 = 84. Subtract 84 from 86 to get 2.",
      hi: "12 × 7 = 84। 86 में से 84 घटाकर 2 प्राप्त करें।",
      te: "12 × 7 = 84. 86 నుండి 84 తీసివేస్తే 2 వస్తుంది.",
    },
    provenanceLabel: "ICSE Selina Concise Mathematics Class 5",
  },
  {
    id: "foundation_m5_div_l3_01",
    sourceStyle: "icse_foundation",
    board: "ICSE",
    bookFamily: "ML Aggarwal Primary Maths Class 5",
    class: 5,
    conceptIds: ["long_division", "division_word"],
    difficulty: 3, // L3 Application
    format: "mcq",
    prompt: {
      en: "A school auditorium has 936 seats arranged equally in 26 rows. How many seats are there in each row?",
      hi: "एक स्कूल सभागार में 936 सीटें 26 पंक्तियों में बराबर व्यवस्थित हैं। प्रत्येक पंक्ति में कितनी सीटें हैं?",
      te: "ఒక ఆడిటోరియంలో 936 సీట్లు 26 వరుసలలో సమానంగా అమర్చబడి ఉన్నాయి. ప్రతి వరుసలో ఎన్ని సీట్లు ఉన్నాయి?",
    },
    expression: "936 ÷ 26 = ?",
    options: [
      { id: "o1", value: "36", label: { en: "36 seats", hi: "36 सीटें", te: "36 సీట్లు" } },
      { id: "o2", value: "34", label: { en: "34 seats", hi: "34 सीटें", te: "34 సీట్లు" }, errorType: "regrouping" },
      { id: "o3", value: "38", label: { en: "38 seats", hi: "38 सीटें", te: "38 సీట్లు" }, errorType: "slip" },
      { id: "o4", value: "32", label: { en: "32 seats", hi: "32 सीटें", te: "32 సీట్లు" }, errorType: "wrong_operation" },
    ],
    correctAnswer: "36",
    verifiedSolution: {
      en: "936 ÷ 26 = 36. Check: 26 × 36 = 936 seats per row.",
      hi: "936 ÷ 26 = 36 सीटें। जांच: 26 × 36 = 936।",
      te: "936 ÷ 26 = 36 సీట్లు. తనిఖీ: 26 × 36 = 936.",
    },
    hint: {
      en: "Divide the total seats (936) by the number of rows (26).",
      hi: "कुल सीटों (936) को पंक्तियों की संख्या (26) से भाग दें।",
      te: "మొత్తం సీట్లను (936) వరుసల సంఖ్యతో (26) భాగించండి.",
    },
    provenanceLabel: "ICSE ML Aggarwal Primary Maths Class 5",
  },
  {
    id: "selina_m5_div_l4_01",
    sourceStyle: "icse_selina",
    board: "ICSE",
    bookFamily: "Selina Concise Mathematics 5",
    class: 5,
    conceptIds: ["long_division", "division_word"],
    difficulty: 4, // L4 Analysis
    format: "mcq",
    prompt: {
      en: "When 1,575 is divided by 15, what is the quotient and the remainder?",
      hi: "जब 1,575 को 15 से भाग दिया जाता है, तो भागफल और शेषफल क्या होता है?",
      te: "1,575 ను 15 తో భాగించినప్పుడు, భాగఫలం మరియు శేషం ఎంత?",
    },
    expression: "1,575 ÷ 15",
    options: [
      { id: "o1", value: "Quotient 105, Remainder 0", label: { en: "Quotient 105, Remainder 0", hi: "भागफल 105, शेष 0", te: "భాగఫలం 105, శేషం 0" } },
      { id: "o2", value: "Quotient 15, Remainder 0", label: { en: "Quotient 15, Remainder 0", hi: "भागफल 15, शेष 0", te: "భాగఫలం 15, శేషం 0" }, errorType: "place_value" },
      { id: "o3", value: "Quotient 100, Remainder 75", label: { en: "Quotient 100, Remainder 75", hi: "भागफल 100, शेष 75", te: "భాగఫలం 100, శేషం 75" }, errorType: "slip" },
      { id: "o4", value: "Quotient 150, Remainder 5", label: { en: "Quotient 150, Remainder 5", hi: "भागफल 150, शेष 5", te: "భాగఫలం 150, శేషం 5" }, errorType: "regrouping" },
    ],
    correctAnswer: "Quotient 105, Remainder 0",
    verifiedSolution: {
      en: "15 ÷ 15 = 1. Bring down 7: 7 cannot be divided by 15, so write 0 in quotient. Bring down 5: 75 ÷ 15 = 5. Quotient = 105, Remainder = 0.",
      hi: "15 ÷ 15 = 1। 7 उतारा: भाग नहीं जाता तो 0 लिखा। 75 ÷ 15 = 5। भागफल = 105, शेष = 0।",
      te: "15 ÷ 15 = 1. 7 కి భాగించలేము కాబట్టి భాగఫలంలో 0. 75 ÷ 15 = 5. భాగఫలం = 105, శేషం = 0.",
    },
    hint: {
      en: "Remember to put a 0 in the tens place of the quotient when the digit brought down is smaller than the divisor.",
      hi: "ध्यान रहे: जब उतारा गया अंक भाजक से छोटा हो तो भागफल में 0 लगाएं।",
      te: "కిందికి దించిన అంకె విభాజకం కంటే చిన్నదైతే భాగఫలంలో 0 ఉంచడం మర్చిపోకండి.",
    },
    provenanceLabel: "ICSE Selina Concise Mathematics Class 5",
  },
  {
    id: "foundation_m5_mult_l4_01",
    sourceStyle: "icse_foundation",
    board: "ICSE",
    bookFamily: "ML Aggarwal Primary Maths Class 5",
    class: 5,
    conceptIds: ["multi_digit_mult", "division_word"],
    difficulty: 4, // L4 Analysis
    format: "mcq",
    prompt: {
      en: "A school bus travels 48 km in one trip. If it makes 12 trips a week for 4 weeks, what is the total distance travelled by the bus?",
      hi: "एक स्कूल बस एक चक्कर में 48 किमी चलती है। यदि वह 4 सप्ताह तक प्रति सप्ताह 12 चक्कर लगाती है, तो बस द्वारा तय की गई कुल दूरी क्या है?",
      te: "ఒక స్కూల్ బస్సు ఒక ట్రిప్‌లో 48 కి.మీ ప్రయాణిస్తుంది. అది 4 వారాల పాటు వారానికి 12 ట్రిప్పులు వేస్తే, బస్సు మొత్తం ఎంత దూరం ప్రయాణించింది?",
    },
    expression: "48 × 12 × 4 = ?",
    options: [
      { id: "o1", value: "2304", label: { en: "2,304 km", hi: "2,304 किमी", te: "2,304 కి.మీ" } },
      { id: "o2", value: "2204", label: { en: "2,204 km", hi: "2,204 किमी", te: "2,204 కి.మీ" }, errorType: "regrouping" },
      { id: "o3", value: "2400", label: { en: "2,400 km", hi: "2,400 किमी", te: "2,400 కి.మీ" }, errorType: "slip" },
      { id: "o4", value: "1920", label: { en: "1,920 km", hi: "1,920 किमी", te: "1,920 కి.మీ" }, errorType: "wrong_operation" },
    ],
    correctAnswer: "2304",
    verifiedSolution: {
      en: "Total trips = 12 × 4 = 48 trips. Total distance = 48 km × 48 trips = 2,304 km.",
      hi: "कुल चक्कर = 12 × 4 = 48 चक्कर। कुल दूरी = 48 किमी × 48 = 2,304 किमी।",
      te: "మొత్తం ట్రిప్పులు = 12 × 4 = 48. మొత్తం దూరం = 48 కి.మీ × 48 = 2,304 కి.మీ.",
    },
    hint: {
      en: "Find the total number of trips first (12 × 4), then multiply by 48 km.",
      hi: "पहले कुल चक्करों की संख्या (12 × 4) निकालें, फिर 48 से गुणा करें।",
      te: "ముందుగా మొత్తం ట్రిప్పుల సంఖ్యను (12 × 4) కనుగొని, ఆపై 48 తో గుణించండి.",
    },
    provenanceLabel: "ICSE ML Aggarwal Primary Maths Class 5",
  },
  ...EXTENDED_MULTI_BOARD_QUESTIONS,
];

import { syncQuestionProvenance } from "./provenance.ts";
import { CONCEPT_ALIASES } from "../../data/curriculum/index.ts";

/**
 * Retrieves a multi-board verified question matching requested criteria.
 * Strict board isolation: ICSE never returns NCERT-only questions and vice-versa.
 * Strict class isolation: Questions never leak from different classes.
 * Strict concept isolation: Concept is never dropped when specified.
 */
export function getMultiBoardQuestion(
  filter: {
    class?: number;
    conceptId?: ConceptId;
    difficulty?: Difficulty;
    sourceStyle?: SourceStyle;
    board?: "CBSE" | "ICSE";
    excludeIds?: string[];
    excludeTexts?: string[];
  },
  lang: Lang = "en"
): Question | null {
  const baseExcludeIds = new Set(
    (filter.excludeIds || []).flatMap((id) => [id, id.split("_s")[0]])
  );
  const normExcludeTexts = new Set(
    (filter.excludeTexts || []).map((t) => t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "").trim()).filter(Boolean)
  );

  const isExcluded = (q: MultiBoardQuestionEntry) => {
    if (baseExcludeIds.has(q.id)) return true;
    if (normExcludeTexts.size > 0) {
      for (const l of ["en", "hi", "te"] as const) {
        const rawText = q.prompt[l] || q.prompt.en;
        if (rawText) {
          const norm = rawText.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "").trim();
          if (norm && normExcludeTexts.has(norm)) return true;
        }
      }
    }
    return false;
  };

  const boardMatches = (q: MultiBoardQuestionEntry) => {
    if (!filter.board) return true;
    if (filter.board === "ICSE") return q.board === "ICSE";
    if (filter.board === "CBSE") return q.board === "CBSE" || q.board === "NCERT";
    return true;
  };

  const matchesConcept = (q: MultiBoardQuestionEntry, targetConcept?: ConceptId) => {
    if (!targetConcept) return true;
    if (q.conceptIds.includes(targetConcept)) return true;
    // Check aliases
    const aliased = CONCEPT_ALIASES[targetConcept];
    if (aliased && q.conceptIds.includes(aliased)) return true;
    for (const cid of q.conceptIds) {
      if (CONCEPT_ALIASES[cid] === targetConcept || CONCEPT_ALIASES[cid] === aliased) return true;
    }
    // Generic fallback match (e.g. "quadratic_equations" matches "icse_10_quadratic_equations")
    for (const cid of q.conceptIds) {
      if (cid.includes(targetConcept) || targetConcept.includes(cid)) return true;
    }
    return false;
  };

  // 1. Strict match: class, concept, difficulty, sourceStyle, and board
  let candidates = MULTI_BOARD_QUESTION_BANK.filter((q) => {
    if (isExcluded(q)) return false;
    if (!boardMatches(q)) return false;
    if (filter.class && q.class !== filter.class) return false;
    if (!matchesConcept(q, filter.conceptId)) return false;
    if (filter.difficulty && q.difficulty !== filter.difficulty) return false;
    if (filter.sourceStyle && q.sourceStyle !== filter.sourceStyle) return false;
    return true;
  });

  // 2. Relaxed match: matching class, concept, difficulty, and board
  if (candidates.length === 0) {
    candidates = MULTI_BOARD_QUESTION_BANK.filter((q) => {
      if (isExcluded(q)) return false;
      if (!boardMatches(q)) return false;
      if (filter.class && q.class !== filter.class) return false;
      if (!matchesConcept(q, filter.conceptId)) return false;
      if (filter.difficulty && q.difficulty !== filter.difficulty) return false;
      return true;
    });
  }

  // 3. Fallback match: matching class, concept, and board (relaxed difficulty on SAME concept)
  if (candidates.length === 0 && filter.conceptId) {
    candidates = MULTI_BOARD_QUESTION_BANK.filter((q) => {
      if (isExcluded(q)) return false;
      if (!boardMatches(q)) return false;
      if (filter.class && q.class !== filter.class) return false;
      if (!matchesConcept(q, filter.conceptId)) return false;
      return true;
    });
  }

  // 4. If conceptId was NOT specified, allow any question matching class and board
  if (candidates.length === 0 && !filter.conceptId && filter.class) {
    candidates = MULTI_BOARD_QUESTION_BANK.filter((q) => {
      if (isExcluded(q)) return false;
      if (!boardMatches(q)) return false;
      if (q.class !== filter.class) return false;
      return true;
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  // Rotate across candidates based on excludeIds count so one book does not dominate
  const rotateIndex = (filter.excludeIds?.length || 0) % candidates.length;
  const chosen = candidates[rotateIndex];

  return convertMultiBoardEntryToAppQuestion(chosen, lang, filter.board);
}

export function convertMultiBoardEntryToAppQuestion(
  entry: MultiBoardQuestionEntry,
  lang: Lang,
  targetBoard?: "CBSE" | "ICSE"
): Question {
  const promptText = entry.prompt[lang] || entry.prompt.en;
  const hintText = entry.hint[lang] || entry.hint.en;

  const appOptions = entry.options?.map((opt) => ({
    id: opt.id,
    value: opt.value,
    label: { raw: opt.label[lang] || opt.label.en },
    errorType: opt.errorType as ErrorType | undefined,
  }));

  const effectiveBoard: "CBSE" | "ICSE" =
    entry.board === "ICSE"
      ? "ICSE"
      : entry.board === "CBSE" || entry.board === "NCERT"
      ? "CBSE"
      : targetBoard || "CBSE";

  const concept = getCurriculumConcept(entry.conceptIds[0], effectiveBoard);
  const grade = concept?.class || entry.class;
  const chapterTitle = concept?.chapterName || entry.bookFamily || "Mathematics";

  const textbookSource = {
    board: effectiveBoard === "ICSE" ? ("STATE_BOARD" as const) : ("NCERT" as const),
    class: grade,
    subject: "mathematics",
    language: lang,
    textbookTitle: entry.bookFamily || (effectiveBoard === "ICSE" ? `CISCE Class ${grade} Mathematics` : `NCERT Class ${grade} Mathematics`),
    textbookEdition: "2024-25 Edition",
    chapterNumber: 1,
    chapterTitle,
    verifiedSolution: entry.verifiedSolution[lang] || entry.verifiedSolution.en,
    provenanceLabel: entry.provenanceLabel,
  };

  const base: Question = {
    id: entry.id,
    conceptId: entry.conceptIds[0],
    difficulty: entry.difficulty,
    format: entry.format,
    prompt: { raw: promptText },
    expression: entry.expression,
    answerKind: "choice",
    answer: entry.correctAnswer,
    options: appOptions,
    meta: {
      class: grade,
      sourceBook: entry.bookFamily,
      sourceChapter: chapterTitle,
    },
    hint: { raw: hintText },
    source: "bank",
    isTextbookVerified: true,
    textbookSource,
    provenanceLabel: entry.provenanceLabel,
    sourceStyle: entry.sourceStyle,
    board: effectiveBoard,
  };

  return syncQuestionProvenance(base, effectiveBoard);
}
