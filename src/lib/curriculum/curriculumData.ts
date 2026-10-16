/**
 * ShikshaGap Comprehensive Curriculum Architecture (Classes 1 - 10)
 *
 * Defines the official NCERT / CBSE curriculum standards for Classes 1 through 10,
 * detailing authentic textbook titles, rationalised editions, chapter sequences,
 * prerequisites, learning competencies, and question bank verification status.
 */

import type { EducationalBoard } from "../questions/types.ts";
import type { Lang } from "../types.ts";

export interface OfficialChapter {
  number: number;
  title: {
    en: string;
    hi: string;
    te: string;
  };
  keyConcepts: string[];
  prerequisites?: string[];
  verifiedQuestionsAvailable: number;
  coverageStatus: "fully_verified" | "in_verification" | "pending_curation";
}

export interface OfficialTextbookInfo {
  board: EducationalBoard;
  class: number;
  subject: string;
  title: string;
  edition: string;
  academicYear: string;
  officialPortalUrl: string;
  supportedLanguages: Lang[];
  chapters: OfficialChapter[];
  totalChapters: number;
  verifiedQuestionCount: number;
  isAssessmentReady: boolean;
}

export interface BoardConfig {
  id: EducationalBoard;
  name: string;
  description: string;
  officialPortal: string;
  supportedClasses: number[];
  activeForScoredAssessments: boolean;
}

export const SUPPORTED_BOARDS: BoardConfig[] = [
  {
    id: "NCERT",
    name: "NCERT / National Curriculum Framework (NCF-FS / NCF-SE)",
    description: "Official National Council of Educational Research and Training textbooks (Joyful Mathematics, Math-Magic, Ganita Prakash).",
    officialPortal: "https://ncert.nic.in/textbook.php",
    supportedClasses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    activeForScoredAssessments: true,
  },
  {
    id: "CBSE",
    name: "CBSE (Central Board of Secondary Education)",
    description: "Follows prescribed NCERT textbooks and curriculum frameworks.",
    officialPortal: "https://cbseacademic.nic.in",
    supportedClasses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    activeForScoredAssessments: true,
  },
  {
    id: "SCERT_TELANGANA",
    name: "State Board: Telangana SCERT",
    description: "Telangana State Council of Educational Research and Training Mathematics textbooks (Ganitam).",
    officialPortal: "https://scert.telangana.gov.in",
    supportedClasses: [3, 4, 5],
    activeForScoredAssessments: false, // Architectural infrastructure ready, pending verbatim verification
  },
  {
    id: "SCERT_AP",
    name: "State Board: Andhra Pradesh SCERT",
    description: "Andhra Pradesh State Council of Educational Research and Training (Gani-tha Deepika / Telugu Bharathi).",
    officialPortal: "https://scert.ap.gov.in",
    supportedClasses: [3, 4, 5],
    activeForScoredAssessments: false, // Architectural infrastructure ready, pending verbatim verification
  },
];

/**
 * Authentic NCERT Mathematics textbooks structure for Classes 1 to 10.
 */
export const NCERT_CURRICULUM_DATA: Record<number, OfficialTextbookInfo> = {
  // CLASS 1: Joyful Mathematics
  1: {
    board: "NCERT",
    class: 1,
    subject: "mathematics",
    title: "Joyful Mathematics Class 1",
    edition: "NCERT NEP 2020 Edition",
    academicYear: "2024-25",
    officialPortalUrl: "https://ncert.nic.in/textbook.php?aejm1=0-13",
    supportedLanguages: ["en", "hi", "te"],
    totalChapters: 13,
    verifiedQuestionCount: 0,
    isAssessmentReady: false,
    chapters: [
      { number: 1, title: { en: "Finding the Furry Cat! (Pre-number)", hi: "बिल्ली कहाँ है?", te: "పిల్లి ఎక్కడ ఉంది?" }, keyConcepts: ["spatial_sense"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 2, title: { en: "What is Long? What is Round? (Shapes)", hi: "लंबा क्या है? गोल क्या है?", te: "పొడవాటిదేది? గుండ్రటిదేది?" }, keyConcepts: ["basic_shapes"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 3, title: { en: "Mango Treat (Numbers 1 to 9)", hi: "आम की दावत (1 से 9 तक संख्याएं)", te: "మామిడి విందు (1 నుండి 9 సంఖ్యలు)" }, keyConcepts: ["counting_1_9"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 4, title: { en: "Making 10 (Numbers 10 to 20)", hi: "10 बनाना (10 से 20)", te: "10 తయారుచేయడం (10 నుండి 20)" }, keyConcepts: ["numbers_10_20"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 5, title: { en: "How Many? (Addition & Subtraction up to 9)", hi: "कितने? (जोड़ और घटाव)", te: "ఎన్ని? (కూడిక మరియు తీసివేత)" }, keyConcepts: ["single_digit_add_sub"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 6, title: { en: "Vegetable Farm (Addition & Subtraction up to 20)", hi: "सब्जी का खेत", te: "కూరగాయల తోట" }, keyConcepts: ["add_sub_20"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 7, title: { en: "Lina's Family (Measurement)", hi: "लीना का परिवार (माप)", te: "లీనా కుటుంబం (కొలతలు)" }, keyConcepts: ["length_comparison"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 8, title: { en: "Fun with Numbers (Numbers 21 to 99)", hi: "संख्याओं का खेल (21 से 99)", te: "సంఖ్యలతో సరదా (21 నుండి 99)" }, keyConcepts: ["numbers_21_99"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 9, title: { en: "Utsav (Patterns)", hi: "उत्सव (पैटर्न)", te: "ఉత్సవం (నమూనాలు)" }, keyConcepts: ["repeating_patterns"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 10, title: { en: "How do I Spend My Day? (Time)", hi: "मेरा दिन कैसा बीतता है? (समय)", te: "నా రోజు ఎలా గడుస్తుంది? (సమయం)" }, keyConcepts: ["daily_sequence_time"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 11, title: { en: "How Many Times? (Early Grouping)", hi: "कितनी बार?", te: "ఎన్ని సార్లు?" }, keyConcepts: ["equal_groups"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 12, title: { en: "How Much Can We Spend? (Money)", hi: "हम कितना खर्च कर सकते हैं? (मुद्रा)", te: "మనం ఎంత ఖర్చు చేయగలం? (డబ్బు)" }, keyConcepts: ["indian_coins_notes"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 13, title: { en: "So Many Toys (Data Handling)", hi: "इतने सारे खिलौने (आंकड़े)", te: "ఎన్నో బొమ్మలు (దత్తాంశం)" }, keyConcepts: ["pictorial_counting"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
    ],
  },

  // CLASS 2: Joyful Mathematics
  2: {
    board: "NCERT",
    class: 2,
    subject: "mathematics",
    title: "Joyful Mathematics Class 2",
    edition: "NCERT NEP 2020 Edition",
    academicYear: "2024-25",
    officialPortalUrl: "https://ncert.nic.in/textbook.php?bejm1=0-11",
    supportedLanguages: ["en", "hi", "te"],
    totalChapters: 11,
    verifiedQuestionCount: 0,
    isAssessmentReady: false,
    chapters: [
      { number: 1, title: { en: "A Day at the Beach (Counting in Groups)", hi: "समुद्र तट पर एक दिन (समूहों में गिनती)", te: "బీచ్‌లో ఒక రోజు (సమూహాలలో లెక్కింపు)" }, keyConcepts: ["counting_tens"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 2, title: { en: "Shapes Around Us (2D and 3D)", hi: "हमारे चारों ओर आकार", te: "మన చుట్టూ ఉన్న ఆకారాలు" }, keyConcepts: ["rolling_sliding"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 3, title: { en: "Fun with Numbers (Numbers up to 100)", hi: "संख्याओं का खेल (100 तक संख्याएं)", te: "సంఖ్యలతో సరదా (100 వరకు సంఖ్యలు)" }, keyConcepts: ["place_value_tens_ones"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 4, title: { en: "Shadow Story (Together / Addition)", hi: "परछाई की कहानी (जोड़)", te: "నీడల కథ (సంకలనం)" }, keyConcepts: ["2digit_addition"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 5, title: { en: "Playing with Lines", hi: "रेखाओं से खेल", te: "రేఖలతో ఆటలు" }, keyConcepts: ["straight_curved_lines"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 6, title: { en: "Decoration for Festival (Subtraction)", hi: "त्योहार की सजावट (घटाव)", te: "పండుగ అలంకరణ (తీసివేత)" }, keyConcepts: ["2digit_subtraction"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 7, title: { en: "Rani's Gift (Measurement)", hi: "रानी का उपहार (माप)", te: "రాణి బహుమతి (కొలతలు)" }, keyConcepts: ["non_standard_units"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 8, title: { en: "Grouping and Sharing", hi: "समूह बनाना और बांटना", te: "సమూహాలు మరియు పంపకం" }, keyConcepts: ["equal_sharing"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 9, title: { en: "Which Season is It? (Time)", hi: "यह कौन सा मौसम है? (समय)", te: "ఇది ఏ ఋతువు? (సమయం)" }, keyConcepts: ["days_months_seasons"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 10, title: { en: "Fun at the Fair (Money)", hi: "मेले में मज़ा (मुद्रा)", te: "జాతరలో సరదా (డబ్బు)" }, keyConcepts: ["combining_notes_coins"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 11, title: { en: "Data Handling", hi: "आंकड़ों का प्रबंधन", te: "దత్తాంశ నిర్వహణ" }, keyConcepts: ["simple_bar_tallies"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
    ],
  },

  // CLASS 3: Math-Magic 3 (VERIFIED & ENABLED)
  3: {
    board: "NCERT",
    class: 3,
    subject: "mathematics",
    title: "Math-Magic 3",
    edition: "NCERT 2024-25 Rationalised Reprint",
    academicYear: "2024-25",
    officialPortalUrl: "https://ncert.nic.in/textbook.php?femh1=0-14",
    supportedLanguages: ["en", "hi", "te"],
    totalChapters: 14,
    verifiedQuestionCount: 8,
    isAssessmentReady: true,
    chapters: [
      { number: 1, title: { en: "Where to Look From", hi: "कहाँ से देखें", te: "ఎక్కడి నుంచి చూడాలి" }, keyConcepts: ["views_symmetry"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 2, title: { en: "Fun with Numbers", hi: "संख्याओं की उछलकूद", te: "సంఖ్యలతో ఆటలు" }, keyConcepts: ["number_sense", "place_value"], verifiedQuestionsAvailable: 2, coverageStatus: "fully_verified" },
      { number: 3, title: { en: "Give and Take", hi: "कुछ लेना कुछ देना", te: "ఇవ్వడం తీసుకోవడం" }, keyConcepts: ["addition", "addition_3digit"], verifiedQuestionsAvailable: 2, coverageStatus: "fully_verified" },
      { number: 4, title: { en: "Long and Short", hi: "क्या लंबा क्या छोटा", te: "పొడవు మరియు పొట్టి" }, keyConcepts: ["measurement_length"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 5, title: { en: "Shapes and Designs", hi: "आकृतियों का कमाल", te: "ఆకారాలు మరియు నమూనాలు" }, keyConcepts: ["2d_shapes_tessellation"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 6, title: { en: "Fun with Give and Take", hi: "लेन देन का खेल", te: "ఇవ్వడం తీసుకోవడంలో సరదా" }, keyConcepts: ["subtraction", "subtraction_3digit"], verifiedQuestionsAvailable: 1, coverageStatus: "fully_verified" },
      { number: 7, title: { en: "Time Goes On...", hi: "समय-समय की बात", te: "సమయం గడిచే కొద్దీ..." }, keyConcepts: ["clock_calendar"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 8, title: { en: "Who is Heavier?", hi: "कौन किससे भारी?", te: "ఎవరు బరువు?" }, keyConcepts: ["weight_kilogram"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 9, title: { en: "How Many Times?", hi: "बोलो भई कितने गुना?", te: "ఎన్ని రెట్లు?" }, keyConcepts: ["mult_concept"], verifiedQuestionsAvailable: 1, coverageStatus: "fully_verified" },
      { number: 10, title: { en: "Play with Patterns", hi: "पैटर्न की पहचान", te: "నమూనాలతో ఆటలు" }, keyConcepts: ["number_patterns"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 11, title: { en: "Jugs and Mugs", hi: "जग मग, जग मग", te: "జగ్గులు మరియు మగ్గులు" }, keyConcepts: ["volume_capacity"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 12, title: { en: "Can We Share?", hi: "क्या हम बाँट सकते हैं?", te: "మనం పంచగలమా?" }, keyConcepts: ["division_sharing"], verifiedQuestionsAvailable: 1, coverageStatus: "fully_verified" },
      { number: 13, title: { en: "Smart Charts!", hi: "स्मार्ट चार्ट", te: "స్మార్ట్ చార్టులు" }, keyConcepts: ["tables_pictographs"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 14, title: { en: "Rupees and Paise", hi: "रुपए और पैसे", te: "రూపాయలు మరియు పైసలు" }, keyConcepts: ["money_math"], verifiedQuestionsAvailable: 1, coverageStatus: "fully_verified" },
    ],
  },

  // CLASS 4: Math-Magic 4 (VERIFIED & ENABLED)
  4: {
    board: "NCERT",
    class: 4,
    subject: "mathematics",
    title: "Math-Magic 4",
    edition: "NCERT 2024-25 Rationalised Reprint",
    academicYear: "2024-25",
    officialPortalUrl: "https://ncert.nic.in/textbook.php?femh1=0-14",
    supportedLanguages: ["en", "hi", "te"],
    totalChapters: 14,
    verifiedQuestionCount: 7,
    isAssessmentReady: true,
    chapters: [
      { number: 1, title: { en: "Building with Bricks", hi: "ईंटों से बनी इमारत", te: "ఇటుకలతో భవనం" }, keyConcepts: ["place_value", "brick_patterns"], verifiedQuestionsAvailable: 1, coverageStatus: "fully_verified" },
      { number: 2, title: { en: "Long and Short", hi: "लंबा और छोटा", te: "పొడవు మరియు పొట్టి" }, keyConcepts: ["standard_units_m_cm"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 3, title: { en: "A Trip to Bhopal", hi: "भोपाल की सैर", te: "భోపాల్ పర్యటన" }, keyConcepts: ["division_concept", "division_facts"], verifiedQuestionsAvailable: 2, coverageStatus: "fully_verified" },
      { number: 4, title: { en: "Tick-Tick-Tick", hi: "टिक-टिक-टिक", te: "టిక్-టిక్-టిక్" }, keyConcepts: ["12hr_24hr_clock"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 5, title: { en: "The Way The World Looks", hi: "दुनिया कुछ ऐसी दिखती है", te: "ప్రపంచం ఎలా కనిపిస్తుంది" }, keyConcepts: ["perspective_aerial_views"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 6, title: { en: "The Junk Seller", hi: "कबाड़ीवाली", te: "పాత సామానుల వ్యాపారి" }, keyConcepts: ["money_multiplication"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 7, title: { en: "Jugs and Mugs", hi: "जग मग, जग मग", te: "జగ్గులు మరియు మగ్గులు" }, keyConcepts: ["litre_millilitre"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 8, title: { en: "Carts and Wheels", hi: "गाड़ियाँ और पहिए", te: "బండ్లు మరియు చక్రాలు" }, keyConcepts: ["circle_radius_diameter"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 9, title: { en: "Halves and Quarters", hi: "आधा और चौथाई", te: "సగము మరియు పావు" }, keyConcepts: ["fraction_basics"], verifiedQuestionsAvailable: 2, coverageStatus: "fully_verified" },
      { number: 10, title: { en: "Play with Patterns", hi: "पैटर्न का खेल", te: "నమూనాలతో ఆటలు" }, keyConcepts: ["rotational_symmetry"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 11, title: { en: "Tables and Shares", hi: "पहाड़े और बँटवारे", te: "ఎక్కాలు మరియు పంపకాలు" }, keyConcepts: ["mult_facts", "division_concept"], verifiedQuestionsAvailable: 2, coverageStatus: "fully_verified" },
      { number: 12, title: { en: "How Heavy? How Light?", hi: "कितना भारी? कितना हल्का?", te: "ఎంత బరువు? ఎంత తేలిక?" }, keyConcepts: ["gram_kilogram_balance"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 13, title: { en: "Fields and Fences", hi: "खेत और बाड़", te: "పొలాలు మరియు కంచెలు" }, keyConcepts: ["perimeter_boundary"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 14, title: { en: "Smart Charts", hi: "स्मार्ट चार्ट", te: "స్మార్ట్ చార్టులు" }, keyConcepts: ["bar_charts_chapati_chart"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
    ],
  },

  // CLASS 5: Math-Magic 5 (VERIFIED & ENABLED)
  5: {
    board: "NCERT",
    class: 5,
    subject: "mathematics",
    title: "Math-Magic 5",
    edition: "NCERT 2024-25 Rationalised Reprint",
    academicYear: "2024-25",
    officialPortalUrl: "https://ncert.nic.in/textbook.php?femh1=0-14",
    supportedLanguages: ["en", "hi", "te"],
    totalChapters: 14,
    verifiedQuestionCount: 8,
    isAssessmentReady: true,
    chapters: [
      { number: 1, title: { en: "The Fish Tale", hi: "मछली उछली", te: "చేపల కథ" }, keyConcepts: ["multi_digit_mult", "large_numbers"], verifiedQuestionsAvailable: 1, coverageStatus: "fully_verified" },
      { number: 2, title: { en: "Shapes and Angles", hi: "आकृतियाँ और कोण", te: "ఆకారాలు మరియు కోణాలు" }, keyConcepts: ["angles_right_acute_obtuse"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 3, title: { en: "How Many Squares?", hi: "कितने वर्ग?", te: "ఎన్ని చతురస్రాలు?" }, keyConcepts: ["grid_area"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 4, title: { en: "Parts and Wholes", hi: "हिस्से और पूरे", te: "భాగాలు మరియు పూర్ణాలు" }, keyConcepts: ["equivalent_fractions", "comparing_fractions", "fraction_addition"], verifiedQuestionsAvailable: 3, coverageStatus: "fully_verified" },
      { number: 5, title: { en: "Does it Look the Same?", hi: "क्या यह एक जैसा दिखता है?", te: "ఇది ఒకేలా కనిపిస్తుందా?" }, keyConcepts: ["reflection_rotation_symmetry"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 6, title: { en: "Be My Multiple, I'll be Your Factor", hi: "मैं तेरा गुणनखंड, तू मेरा गुणज", te: "నువ్వు నా గుణిజం, నేను నీ కారణాంకం" }, keyConcepts: ["factors_multiples_lcm_hcf"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 7, title: { en: "Can You See the Pattern?", hi: "क्या तुम पैटर्न देख सकते हो?", te: "నువ్వు నమూనాను చూడగలవా?" }, keyConcepts: ["magic_squares_patterns"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 8, title: { en: "Mapping Your Way", hi: "नक्शा", te: "దారిని పటం ద్వారా తెలుసుకోవడం" }, keyConcepts: ["scale_maps_directions"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 9, title: { en: "Boxes and Sketches", hi: "डिब्बे और रेखाचित्र", te: "పెట్టెలు మరియు రేఖాచిత్రాలు" }, keyConcepts: ["nets_3d_folding"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 10, title: { en: "Tenths and Hundredths", hi: "दसवाँ और सौवाँ भाग", te: "పదవ మరియు వందవ వంతు" }, keyConcepts: ["decimals_tenths_hundredths"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 11, title: { en: "Area and its Boundary", hi: "क्षेत्रफल और घेरा", te: "వైశాల్యం మరియు సరిహద్దు" }, keyConcepts: ["area_perimeter_formulas"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 12, title: { en: "Smart Charts", hi: "स्मार्ट चार्ट", te: "స్మార్ట్ చార్టులు" }, keyConcepts: ["tally_marks_pie_charts"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
      { number: 13, title: { en: "Ways to Multiply and Divide", hi: "गुणा और भाग के तरीके", te: "గుణకారం మరియు భాగహారం పద్ధతులు" }, keyConcepts: ["multi_digit_mult", "division_word", "long_division", "division_facts"], verifiedQuestionsAvailable: 4, coverageStatus: "fully_verified" },
      { number: 14, title: { en: "How Big? How Heavy?", hi: "कितना बड़ा? कितना भारी?", te: "ఎంత పెద్దది? ఎంత బరువు?" }, keyConcepts: ["volume_cube_weight"], verifiedQuestionsAvailable: 0, coverageStatus: "in_verification" },
    ],
  },

  // CLASS 6: Ganita Prakash (NCERT NEP 2024-25)
  6: {
    board: "NCERT",
    class: 6,
    subject: "mathematics",
    title: "Ganita Prakash (Class 6)",
    edition: "NCERT NEP 2024-25 Edition",
    academicYear: "2024-25",
    officialPortalUrl: "https://ncert.nic.in/textbook.php?fegp1=0-10",
    supportedLanguages: ["en", "hi", "te"],
    totalChapters: 10,
    verifiedQuestionCount: 0,
    isAssessmentReady: false,
    chapters: [
      { number: 1, title: { en: "Patterns in Mathematics", hi: "गणित में पैटर्न", te: "గణితంలో నమూనాలు" }, keyConcepts: ["number_geometric_patterns"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 2, title: { en: "Lines and Angles", hi: "रेखाएं और कोण", te: "రేఖలు మరియు కోణాలు" }, keyConcepts: ["point_line_angle_types"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 3, title: { en: "Number Play", hi: "संख्याओं का खेल", te: "సంఖ్యలతో ఆట" }, keyConcepts: ["large_numbers_operations"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 4, title: { en: "Data Handling and Presentation", hi: "आंकड़ों का प्रस्तुतीकरण", te: "దత్తాంశ సమర్పణ" }, keyConcepts: ["bar_graphs_pictograms"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 5, title: { en: "Prime Time", hi: "अभाज्य संख्याएं", te: "ప్రధాన సంఖ్యలు" }, keyConcepts: ["primes_factors_divisibility"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 6, title: { en: "Perimeter and Area", hi: "परिमाप और क्षेत्रफल", te: "చుట్టుకొలత మరియు వైశాల్యం" }, keyConcepts: ["polygon_perimeter_rect_area"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 7, title: { en: "Fractions", hi: "भिन्न", te: "భిన్నాలు" }, keyConcepts: ["proper_improper_mixed_fractions"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 8, title: { en: "Playing with Constructions", hi: "रचनाओं का खेल", te: "నిర్మాణాలతో ఆటలు" }, keyConcepts: ["ruler_compass_basics"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 9, title: { en: "Symmetry", hi: "सममिति", te: "సౌష్టవం" }, keyConcepts: ["line_symmetry"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 10, title: { en: "The Other Side of Zero (Integers)", hi: "शून्य के दूसरी ओर (पूर्णांक)", te: "సున్నాకి మరో వైపు (పూర్ణాంకాలు)" }, keyConcepts: ["negative_numbers_integers"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
    ],
  },

  // CLASS 7: Mathematics Class 7 (NCERT 2024-25)
  7: {
    board: "NCERT",
    class: 7,
    subject: "mathematics",
    title: "Mathematics Class 7",
    edition: "NCERT 2024-25 Rationalised Reprint",
    academicYear: "2024-25",
    officialPortalUrl: "https://ncert.nic.in/textbook.php?gemh1=0-13",
    supportedLanguages: ["en", "hi", "te"],
    totalChapters: 13,
    verifiedQuestionCount: 0,
    isAssessmentReady: false,
    chapters: [
      { number: 1, title: { en: "Integers", hi: "पूर्णांक", te: "పూర్ణాంకాలు" }, keyConcepts: ["integer_operations_properties"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 2, title: { en: "Fractions and Decimals", hi: "भिन्न एवं दशमलव", te: "భిన్నాలు మరియు దశాంశాలు" }, keyConcepts: ["fraction_multiplication_division"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 3, title: { en: "Data Handling", hi: "आंकड़ों का प्रबंधन", te: "దత్తాంశ నిర్వహణ" }, keyConcepts: ["mean_median_mode"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 4, title: { en: "Simple Equations", hi: "सरल समीकरण", te: "సరళ సమీకరణాలు" }, keyConcepts: ["linear_equations_1var"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 5, title: { en: "Lines and Angles", hi: "रेखा एवं कोण", te: "రేఖలు మరియు కోణాలు" }, keyConcepts: ["complementary_supplementary_angles"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 6, title: { en: "The Triangle and its Properties", hi: "त्रिभुज और उसके गुण", te: "త్రిభుజము మరియు దాని ధర్మాలు" }, keyConcepts: ["angle_sum_pythagoras"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 7, title: { en: "Comparing Quantities", hi: "राशियों की तुलना", te: "రాశుల పోలిక" }, keyConcepts: ["ratio_percentage_profit_loss"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 8, title: { en: "Rational Numbers", hi: "परिमेय संख्याएं", te: "అకరణీయ సంఖ్యలు" }, keyConcepts: ["rational_operations"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 9, title: { en: "Perimeter and Area", hi: "परिमाप और क्षेत्रफल", te: "చుట్టుకొలత మరియు వైశాల్యం" }, keyConcepts: ["circle_circumference_triangle_area"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 10, title: { en: "Algebraic Expressions", hi: "बीजीय व्यंजक", te: "బీజగణిత సమాసాలు" }, keyConcepts: ["terms_coefficients_addition_subtraction"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 11, title: { en: "Exponents and Powers", hi: "घातांक और घात", te: "ఘాతాంకాలు మరియు ఘాతాలు" }, keyConcepts: ["laws_of_exponents"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 12, title: { en: "Symmetry", hi: "सममिति", te: "సౌష్టవం" }, keyConcepts: ["rotational_symmetry_orders"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 13, title: { en: "Visualising Solid Shapes", hi: "ठोस आकारों का चित्रण", te: "ఘన రూపాల చిత్రణ" }, keyConcepts: ["faces_edges_vertices_euler"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
    ],
  },

  // CLASS 8: Mathematics Class 8 (NCERT 2024-25)
  8: {
    board: "NCERT",
    class: 8,
    subject: "mathematics",
    title: "Mathematics Class 8",
    edition: "NCERT 2024-25 Rationalised Reprint",
    academicYear: "2024-25",
    officialPortalUrl: "https://ncert.nic.in/textbook.php?hemh1=0-13",
    supportedLanguages: ["en", "hi", "te"],
    totalChapters: 13,
    verifiedQuestionCount: 0,
    isAssessmentReady: false,
    chapters: [
      { number: 1, title: { en: "Rational Numbers", hi: "परिमेय संख्याएं", te: "అకరణీయ సంఖ్యలు" }, keyConcepts: ["rational_closure_associativity_distributivity"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 2, title: { en: "Linear Equations in One Variable", hi: "एक चर वाले रैखिक समीकरण", te: "ఒకే చరరాశిలో సరళ సమీకరణాలు" }, keyConcepts: ["solving_linear_equations"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 3, title: { en: "Understanding Quadrilaterals", hi: "चतुर्भुजों को समझना", te: "చతుర్భుజాలను అర్థం చేసుకోవడం" }, keyConcepts: ["polygons_parallelograms_properties"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 4, title: { en: "Data Handling", hi: "आंकड़ों का प्रबंधन", te: "దత్తాంశ నిర్వహణ" }, keyConcepts: ["pie_charts_probability"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 5, title: { en: "Square and Square Roots", hi: "वर्ग और वर्गमूल", te: "వర్గాలు మరియు వర్గమూలాలు" }, keyConcepts: ["prime_factorisation_division_method"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 6, title: { en: "Cube and Cube Roots", hi: "घन और घनमूल", te: "ఘనాలు మరియు ఘనమూలాలు" }, keyConcepts: ["cube_roots_factorisation"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 7, title: { en: "Comparing Quantities", hi: "राशियों की तुलना", te: "రాశుల పోలిక" }, keyConcepts: ["compound_interest_discount"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 8, title: { en: "Algebraic Expressions and Identities", hi: "बीजीय व्यंजक एवं सर्वसमिकाएं", te: "బీజగణిత సమాసాలు మరియు సూత్రాలు" }, keyConcepts: ["identities_polynomial_multiplication"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 9, title: { en: "Mensuration", hi: "क्षेत्रमिति", te: "క్షేత్రగణితం" }, keyConcepts: ["surface_area_volume_cylinder_cube"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 10, title: { en: "Exponents and Powers", hi: "घातांक और घात", te: "ఘాతాంకాలు మరియు ఘాతాలు" }, keyConcepts: ["negative_exponents_scientific_notation"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 11, title: { en: "Direct and Inverse Proportions", hi: "सीधा और प्रतिलोम अनुपात", te: "ప్రత్యక్ష మరియు విలోమ అనుపాతాలు" }, keyConcepts: ["direct_inverse_variation"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 12, title: { en: "Factorisation", hi: "गुणनखंडन", te: "కారణాంకాల విభజన" }, keyConcepts: ["common_factors_regrouping_identities"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 13, title: { en: "Introduction to Graphs", hi: "आलेखों से परिचय", te: "గ్రాఫ్‌ల పరిచయం" }, keyConcepts: ["cartesian_coordinates_linear_graphs"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
    ],
  },

  // CLASS 9: Mathematics Class 9 (NCERT 2024-25)
  9: {
    board: "NCERT",
    class: 9,
    subject: "mathematics",
    title: "Mathematics Class 9",
    edition: "NCERT 2024-25 Rationalised Reprint",
    academicYear: "2024-25",
    officialPortalUrl: "https://ncert.nic.in/textbook.php?iemh1=0-12",
    supportedLanguages: ["en", "hi", "te"],
    totalChapters: 12,
    verifiedQuestionCount: 0,
    isAssessmentReady: false,
    chapters: [
      { number: 1, title: { en: "Number Systems", hi: "संख्या पद्धति", te: "సంఖ్యా వ్యవస్థలు" }, keyConcepts: ["irrational_numbers_real_number_line"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 2, title: { en: "Polynomials", hi: "बहुपद", te: "బహుపదులు" }, keyConcepts: ["factor_theorem_algebraic_identities"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 3, title: { en: "Coordinate Geometry", hi: "निर्देशांक ज्यामिति", te: "నిరూపక రేఖాగణితం" }, keyConcepts: ["cartesian_plane_plotting"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 4, title: { en: "Linear Equations in Two Variables", hi: "दो चरों वाले रैखिक समीकरण", te: "రెండు చరరాశులలో సరళ సమీకరణాలు" }, keyConcepts: ["solutions_graphical_representation"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 5, title: { en: "Introduction to Euclid's Geometry", hi: "यूक्लिड की ज्यामिति का परिचय", te: "యూక్లిడ్ రేఖాగణిత పరిచయం" }, keyConcepts: ["axioms_postulates"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 6, title: { en: "Lines and Angles", hi: "रेखाएँ और कोण", te: "రేఖలు మరియు కోణాలు" }, keyConcepts: ["parallel_lines_transversal"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 7, title: { en: "Triangles", hi: "त्रिभुज", te: "త్రిభుజాలు" }, keyConcepts: ["congruence_criteria_sas_asa_sss_rhs"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 8, title: { en: "Quadrilaterals", hi: "चतुर्भुज", te: "చతుర్భుజాలు" }, keyConcepts: ["midpoint_theorem_properties"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 9, title: { en: "Circles", hi: "वृत्त", te: "వృత్తాలు" }, keyConcepts: ["angle_subtended_cyclic_quadrilaterals"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 10, title: { en: "Heron's Formula", hi: "हीरोन का सूत्र", te: "హెరాన్ సూత్రం" }, keyConcepts: ["triangle_area_heron"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 11, title: { en: "Surface Areas and Volumes", hi: "पृष्ठीय क्षेत्रफल और आयतन", te: "ఉపరితల వైశాల్యాలు మరియు ఘనపరిమాణాలు" }, keyConcepts: ["cone_sphere_hemisphere"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 12, title: { en: "Statistics", hi: "सांख्यिकी", te: "సాంఖ్యక శాస్త్రం" }, keyConcepts: ["histograms_frequency_polygons"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
    ],
  },

  // CLASS 10: Mathematics Class 10 (NCERT 2024-25)
  10: {
    board: "NCERT",
    class: 10,
    subject: "mathematics",
    title: "Mathematics Class 10",
    edition: "NCERT 2024-25 Rationalised Reprint",
    academicYear: "2024-25",
    officialPortalUrl: "https://ncert.nic.in/textbook.php?jemh1=0-14",
    supportedLanguages: ["en", "hi", "te"],
    totalChapters: 14,
    verifiedQuestionCount: 0,
    isAssessmentReady: false,
    chapters: [
      { number: 1, title: { en: "Real Numbers", hi: "वास्तविक संख्याएं", te: "వాస్తవ సంఖ్యలు" }, keyConcepts: ["fundamental_theorem_of_arithmetic"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 2, title: { en: "Polynomials", hi: "बहुपद", te: "బహుపదులు" }, keyConcepts: ["zeros_coefficients_relationships"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 3, title: { en: "Pair of Linear Equations in Two Variables", hi: "दो चर वाले रैखिक समीकरण युग्म", te: "రెండు చరరాశులలో సరళ సమీకరణాల జత" }, keyConcepts: ["substitution_elimination_graphical"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 4, title: { en: "Quadratic Equations", hi: "द्विघात समीकरण", te: "వర్గ సమీకరణాలు" }, keyConcepts: ["quadratic_formula_discriminant"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 5, title: { en: "Arithmetic Progressions", hi: "समांतर श्रेढियाँ", te: "అంకశ్రేఢులు" }, keyConcepts: ["nth_term_sum_of_n_terms"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 6, title: { en: "Triangles", hi: "त्रिभुज", te: "త్రిభుజాలు" }, keyConcepts: ["basic_proportionality_similarity_criteria"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 7, title: { en: "Coordinate Geometry", hi: "निर्देशांक ज्यामिति", te: "నిరూపక రేఖాగణితం" }, keyConcepts: ["distance_section_formula"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 8, title: { en: "Introduction to Trigonometry", hi: "त्रिकोणमिति का परिचय", te: "త్రికోణమితి పరిచయం" }, keyConcepts: ["trigonometric_ratios_identities"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 9, title: { en: "Some Applications of Trigonometry", hi: "त्रिकोणमिति के कुछ अनुप्रयोग", te: "త్రికోణమితి యొక్క కొన్ని అనువర్తనాలు" }, keyConcepts: ["heights_distances_angles_elevation_depression"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 10, title: { en: "Circles", hi: "वृत्त", te: "వృత్తాలు" }, keyConcepts: ["tangents_to_circle_theorems"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 11, title: { en: "Areas Related to Circles", hi: "वृत्तों से संबंधित क्षेत्रफल", te: "వృత్తాలకు సంబంధించిన వైశాల్యాలు" }, keyConcepts: ["sector_segment_area"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 12, title: { en: "Surface Areas and Volumes", hi: "पृष्ठीय क्षेत्रफल और आयतन", te: "ఉపరితల వైశాల్యాలు మరియు ఘనపరిమాణాలు" }, keyConcepts: ["combination_of_solids"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 13, title: { en: "Statistics", hi: "सांख्यिकी", te: "సాంఖ్యక శాస్త్రం" }, keyConcepts: ["grouped_mean_median_mode"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
      { number: 14, title: { en: "Probability", hi: "प्रायिकता", te: "సంభావ్యత" }, keyConcepts: ["classical_probability_single_events"], verifiedQuestionsAvailable: 0, coverageStatus: "pending_curation" },
    ],
  },
};

/**
 * Returns curriculum metadata for a specific class level.
 */
export function getCurriculumForClass(grade: number): OfficialTextbookInfo | null {
  return NCERT_CURRICULUM_DATA[grade] || null;
}

/**
 * Validates whether a class has sufficient verified question bank coverage for scored assessments.
 */
export function isGradeReadyForScoredAssessment(grade: number): boolean {
  const info = NCERT_CURRICULUM_DATA[grade];
  return Boolean(info && info.isAssessmentReady && info.verifiedQuestionCount >= 5);
}
