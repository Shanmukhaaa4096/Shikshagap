/**
 * Trilingual dictionaries (English, Hindi, Telugu) for ShikshaGap.
 */

export interface Dict {
  // Brand & Header
  appName: string;
  appTagline: string;
  badgeGovtSchool: string;
  demoBadge: string;
  resetDemo: string;
  teacherView: string;
  studentView: string;
  schoolName: string;
  class5A: string;

  // Teacher Dashboard Metrics
  totalStudents: string;
  onTrack: string;
  needPractice: string;
  criticalGaps: string;
  teacherQuestionBanner: string;
  teacherQuestionSub: string;

  // Tabs & Sections
  navHome: string;
  navStudents: string;
  navClassGaps: string;
  navReports: string;
  whoNeedsHelpToday: string;
  seeAllStudents: string;
  whatToDoNext: string;
  showDetails: string;
  hideDetails: string;
  todaysPractice: string;
  startPractice: string;
  takeAssessment: string;
  oneMainGap: string;
  tabOverview: string;
  tabInterventions: string;
  tabConceptMap: string;
  tabLiveAssessment: string;

  // Learning Gaps Table
  rank: string;
  conceptGap: string;
  studentsAffected: string;
  severity: string;
  prerequisiteOf: string;
  highSeverity: string;
  mediumSeverity: string;
  lowSeverity: string;

  // Interventions List
  studentName: string;
  rollNo: string;
  symptomConcept: string;
  rootCauseConcept: string;
  action: string;
  diagnoseBtn: string;
  planBtn: string;
  practiceBtn: string;

  // Diagnostic Detail
  diagnosticProfile: string;
  backToDashboard: string;
  masteryScore: string;
  confidenceScore: string;
  rootCauseAnalysis: string;
  whyStruggling: string;
  evidenceTrail: string;
  studentAnswer: string;
  correctAnswer: string;
  detectedMisconception: string;
  chainOfReasoning: string;
  fiveDayPlanTitle: string;
  dayLabel: string;
  minutesLabel: string;
  printWorksheet: string;
  reassessStudent: string;

  // Statuses
  statusMastered: string;
  statusDeveloping: string;
  statusNeedsSupport: string;
  statusNotAssessed: string;

  // Student Assessment View
  assessmentTitle: string;
  adaptiveSubtitle: string;
  agentThinking: string;
  questionLabel: string;
  submitAnswer: string;
  nextQuestion: string;
  finishAssessment: string;
  selectOption: string;
  enterAnswer: string;
  yourAnswer: string;
  correctFeedback: string;
  incorrectFeedback: string;
  assessmentComplete: string;
  viewReport: string;

  // Practice & Visuals
  hintLabel: string;
  showHint: string;

  // Common Question & Concept Names
  c_number_sense: string;
  c_place_value: string;
  c_addition: string;
  c_subtraction: string;
  c_mult_concept: string;
  c_mult_facts: string;
  c_multi_digit_mult: string;
  c_division_concept: string;
  c_division_facts: string;
  c_long_division: string;
  c_division_word: string;
  c_fraction_basics: string;
  c_equivalent_fractions: string;
  c_comparing_fractions: string;
  c_fraction_addition: string;

  // Question prompts
  "q.solve": string;
  "q.fill": string;
  "q.ns.bigger": string;
  "q.ns.largest": string;
  "q.ns.after": string;
  "q.pv.value": string;
  "q.pv.expanded": string;
  "q.add.word": string;
  "q.sub.word": string;
  "q.mc.array": string;
  "q.mc.groups": string;
  "q.mc.repeated": string;
  "q.mdm.word": string;
  "q.dc.meaning": string;
  "q.dc.groups": string;
  "q.dc.share": string;
  "q.ld.remainder": string;
  "q.dw.autos": string;
  "q.fb.shaded": string;
  "q.fb.denominator": string;
  "q.fb.of": string;
  "q.ef.which": string;
  "q.cf.bigger": string;
  "q.fa.word": string;

  // Hints
  "hint.number_sense": string;
  "hint.place_value": string;
  "hint.addition": string;
  "hint.subtraction": string;
  "hint.mult_concept": string;
  "hint.mult_facts": string;
  "hint.multi_digit_mult": string;
  "hint.division_concept": string;
  "hint.division_facts": string;
  "hint.long_division": string;
  "hint.division_word": string;
  "hint.fraction_basics": string;
  "hint.equivalent_fractions": string;
  "hint.comparing_fractions": string;
  "hint.fraction_addition": string;

  // Options
  "opt.dc.share": string;
  "opt.dc.groups": string;
  "opt.dc.subtract": string;
  "opt.dc.multiply": string;
  "opt.dc.add": string;

  // Misconception explanations
  err_slip: string;
  err_wrong_operation: string;
  err_regrouping: string;
  err_place_value: string;
  err_fraction_add_denominators: string;
  err_fraction_larger_denominator: string;
  err_fraction_additive: string;
  err_fraction_inverted: string;
  err_remainder: string;
  err_dont_know: string;
  err_unclassified: string;
}

export const DICTS: Record<"en" | "hi" | "te", Dict> = {
  en: {
    appName: "ShikshaGap",
    appTagline: "Find out what each student needs to learn next",
    badgeGovtSchool: "Foundational Primary School",
    demoBadge: "Demo: Class 5A (36 Students)",
    resetDemo: "Reset Demo",
    teacherView: "Teacher Dashboard",
    studentView: "Student Assessment",
    schoolName: "MPPS Gandhi Nagar, Hyderabad",
    class5A: "Class 5 - Section A (Maths)",

    totalStudents: "Total Students",
    onTrack: "On Track",
    needPractice: "Need Practice",
    criticalGaps: "Need Immediate Help",
    teacherQuestionBanner: "Which students need help, and what should you teach today?",
    teacherQuestionSub: "ShikshaGap finds the early skills each student needs before moving to new lessons.",

    navHome: "Home",
    navStudents: "Students",
    navClassGaps: "Class Gaps",
    navReports: "Reports",
    whoNeedsHelpToday: "Who needs help today",
    seeAllStudents: "See all students",
    whatToDoNext: "What to do next",
    showDetails: "Show details",
    hideDetails: "Hide details",
    todaysPractice: "Today's Practice",
    startPractice: "Start Practice",
    takeAssessment: "Take assessment",
    oneMainGap: "Topic Needing Practice",
    tabOverview: "Class Overview",
    tabInterventions: "What to Do Next",
    tabConceptMap: "Class Progress Map",
    tabLiveAssessment: "Check Student Learning",

    rank: "Rank",
    conceptGap: "Topic Needing Practice",
    studentsAffected: "Students Affected",
    severity: "Priority",
    prerequisiteOf: "Skill Needed First For",
    highSeverity: "High",
    mediumSeverity: "Medium",
    lowSeverity: "Low",

    studentName: "Student Name",
    rollNo: "Roll No",
    symptomConcept: "Struggling With",
    rootCauseConcept: "Skill Needed First",
    action: "Action",
    diagnoseBtn: "Learning Report",
    planBtn: "Practice Plan",
    practiceBtn: "Practice",

    diagnosticProfile: "Student Learning Report",
    backToDashboard: "Back to Class Overview",
    masteryScore: "How well the student understands",
    confidenceScore: "Confidence",
    rootCauseAnalysis: "Why the student is struggling",
    whyStruggling: "Why is this student struggling?",
    evidenceTrail: "Answers and evidence",
    studentAnswer: "Student's Answer",
    correctAnswer: "Correct Answer",
    detectedMisconception: "Observed Mistake",
    chainOfReasoning: "Earlier skills needed first",
    fiveDayPlanTitle: "5-Day Practice Plan",
    dayLabel: "Day",
    minutesLabel: "mins",
    printWorksheet: "Print Practice Sheet",
    reassessStudent: "Check Again",

    statusMastered: "Understands Well (75% or more)",
    statusDeveloping: "Needs Practice (50 to 74%)",
    statusNeedsSupport: "Needs Immediate Help (under 50%)",
    statusNotAssessed: "Not Checked Yet",

    assessmentTitle: "Learning Check",
    adaptiveSubtitle: "Each question helps find what the student needs to practice first.",
    agentThinking: "Checking answer and choosing next question",
    questionLabel: "Question",
    submitAnswer: "Submit Answer",
    nextQuestion: "Next Question",
    finishAssessment: "See Results",
    selectOption: "Choose an answer:",
    enterAnswer: "Type your answer...",
    yourAnswer: "Your Answer:",
    correctFeedback: "Correct answer.",
    incorrectFeedback: "Needs practice with this step.",
    assessmentComplete: "Learning Check Complete!",
    viewReport: "See Learning Report and Plan",

    hintLabel: "Hint",
    showHint: "Need a hint?",

    c_number_sense: "Number Sense & Order",
    c_place_value: "Place Value (1s, 10s, 100s, 1000s)",
    c_addition: "Addition (with Regrouping)",
    c_subtraction: "Subtraction (with Borrowing)",
    c_mult_concept: "Multiplication Concept (Arrays & Groups)",
    c_mult_facts: "Multiplication Tables (2 to 9)",
    c_multi_digit_mult: "Multi-digit Multiplication",
    c_division_concept: "Division Concept (Equal Sharing)",
    c_division_facts: "Division Facts",
    c_long_division: "Long Division with Remainder",
    c_division_word: "Division Word Problems",
    c_fraction_basics: "Fraction Basics (Part of a Whole)",
    c_equivalent_fractions: "Equivalent Fractions",
    c_comparing_fractions: "Comparing Fractions",
    c_fraction_addition: "Fraction Addition",

    "q.solve": "Solve the problem:",
    "q.fill": "Fill in the blank:",
    "q.ns.bigger": "Which number is greater?",
    "q.ns.largest": "Which of these is the largest number?",
    "q.ns.after": "What number comes immediately after {n}?",
    "q.pv.value": "In the number {n}, what is the place value of digit {digit}?",
    "q.pv.expanded": "Write in standard form: {th} thousands + {h} hundreds + {t} tens + {o} ones",
    "q.add.word": "In a village school, there are {a} boys and {b} girls. How many students are there in total?",
    "q.sub.word": "A library has {a} books. If {b} books are checked out, how many books remain?",
    "q.mc.array": "Look at the dots in rows and columns. Which multiplication sentence shows the total?",
    "q.mc.groups": "There are {groups} bags. Each bag has {each} mangoes. How many mangoes in all?",
    "q.mc.repeated": "Which multiplication expression means the same as {a} added {times} times?",
    "q.mdm.word": "A farmer packs {a} boxes of apples. Each box contains {b} apples. How many apples in total?",
    "q.dc.meaning": "What does division primarily mean?",
    "q.dc.groups": "You have {total} pencils. If you put {each} pencils in each box, how many boxes do you need?",
    "q.dc.share": "If {total} laddus are shared equally among {people} children, how many laddus does each child get?",
    "q.ld.remainder": "Divide {a} by {b}. What is the quotient and the remainder?",
    "q.dw.autos": "{total} passengers need to travel. Each auto-rickshaw holds {capacity} passengers. How many autos are needed?",
    "q.fb.shaded": "What fraction of the shape is shaded?",
    "q.fb.denominator": "In the fraction {num}/{den}, which number is the denominator?",
    "q.fb.of": "What is {fraction} of {total} marbles?",
    "q.ef.which": "Which fraction is equivalent to {a}/{b}?",
    "q.cf.bigger": "Which fraction is larger: {a} or {b}?",
    "q.fa.word": "Ravi ate {a} of a roti, and Sita ate {b} of the same roti. How much did they eat together?",

    "hint.number_sense": "Compare digits from left to right starting with the highest place.",
    "hint.place_value": "Remember: units are 1s, tens are 10s, hundreds are 100s, thousands are 1000s.",
    "hint.addition": "Line up digits by place value. When a column adds to 10 or more, carry 1 to the next left column.",
    "hint.subtraction": "When the top digit is smaller than the bottom digit, borrow 1 from the column to the left.",
    "hint.mult_concept": "Multiplication is repeated addition of equal groups.",
    "hint.mult_facts": "Think of the multiplication table or skip-counting.",
    "hint.multi_digit_mult": "Multiply by ones first, write 0 as a placeholder, then multiply by tens.",
    "hint.division_concept": "Division is splitting a total into equal groups.",
    "hint.division_facts": "Division is the opposite of multiplication: if A × B = C, then C ÷ B = A.",
    "hint.long_division": "Follow the steps: Divide, Multiply, Subtract, then Bring down.",
    "hint.division_word": "Find total items and number of groups or items per group.",
    "hint.fraction_basics": "The top number is parts taken; bottom number is total equal parts.",
    "hint.equivalent_fractions": "Multiply or divide both numerator and denominator by the same number.",
    "hint.comparing_fractions": "When denominators are the same, compare numerators. When numerators are the same, smaller denominator means bigger piece!",
    "hint.fraction_addition": "When denominators are the same, add only the numerators and keep the denominator.",

    "opt.dc.share": "Sharing equally into groups",
    "opt.dc.groups": "Counting how many groups",
    "opt.dc.subtract": "Taking away one number",
    "opt.dc.multiply": "Adding numbers repeatedly",
    "opt.dc.add": "Combining two sets",

    err_slip: "Calculation slip / Near miss (likely careless arithmetic)",
    err_wrong_operation: "Used incorrect operation (e.g. subtracted instead of divided)",
    err_regrouping: "Regrouping / Carrying / Borrowing error in column arithmetic",
    err_place_value: "Place value confusion (treated digit as simple number instead of its positional value)",
    err_fraction_add_denominators: "Added denominators together (e.g., 1/4 + 1/4 = 2/8 instead of 2/4)",
    err_fraction_larger_denominator: "Believed larger denominator means larger fraction (e.g. 1/6 > 1/2)",
    err_fraction_additive: "Added the same number to top and bottom instead of multiplying for equivalence",
    err_fraction_inverted: "Inverted numerator and denominator",
    err_remainder: "Remainder ignored or calculated incorrectly",
    err_dont_know: "Student indicated they did not know",
    err_unclassified: "Unclassified arithmetic mistake",
  },

  hi: {
    appName: "शिक्षा-गैप (ShikshaGap)",
    appTagline: "विद्यार्थी को आगे क्या सीखना है, यह जानें",
    badgeGovtSchool: "बुनियादी प्राथमिक विद्यालय",
    demoBadge: "डेमो: कक्षा 5A (36 विद्यार्थी)",
    resetDemo: "डेमो रीसेट करें",
    teacherView: "शिक्षक डैशबोर्ड",
    studentView: "छात्र मूल्यांकन",
    schoolName: "प्राथमिक विद्यालय गांधी नगर, हैदराबाद",
    class5A: "कक्षा 5 - वर्ग A (गणित)",

    totalStudents: "कुल छात्र",
    onTrack: "सही दिशा में",
    needPractice: "अभ्यास की आवश्यकता",
    criticalGaps: "तुरंत मदद चाहिए",
    teacherQuestionBanner: "किन विद्यार्थियों को मदद चाहिए, और आज क्या पढ़ाना चाहिए?",
    teacherQuestionSub: "शिक्षा-गैप हर छात्र के लिए पहले जरूरी बुनियादी कौशल ढूंढता है।",

    navHome: "होम",
    navStudents: "छात्र",
    navClassGaps: "कक्षा की कमियां",
    navReports: "रिपोर्ट्स",
    whoNeedsHelpToday: "आज किन्हें मदद चाहिए",
    seeAllStudents: "सभी छात्र देखें",
    whatToDoNext: "आगे क्या करें",
    showDetails: "विवरण देखें",
    hideDetails: "विवरण छिपाएं",
    todaysPractice: "आज का अभ्यास",
    startPractice: "अभ्यास शुरू करें",
    takeAssessment: "मूल्यांकन दें",
    oneMainGap: "सीखने का मुख्य विषय",
    tabOverview: "कक्षा सारांश",
    tabInterventions: "आगे क्या करें",
    tabConceptMap: "कक्षा प्रगति मानचित्र",
    tabLiveAssessment: "छात्र की सीख जांचें",

    rank: "क्रमांक",
    conceptGap: "अभ्यास के लिए विषय",
    studentsAffected: "प्रभावित छात्र",
    severity: "प्राथमिकता",
    prerequisiteOf: "इसके लिए पहले चाहिए",
    highSeverity: "गंभीर (High)",
    mediumSeverity: "मध्यम (Medium)",
    lowSeverity: "निम्न (Low)",

    studentName: "छात्र का नाम",
    rollNo: "रोल नं.",
    symptomConcept: "इस विषय में कठिनाई",
    rootCauseConcept: "पहले आवश्यक कौशल",
    action: "कार्रवाई",
    diagnoseBtn: "सीख रिपोर्ट",
    planBtn: "अभ्यास योजना",
    practiceBtn: "अभ्यास करें",

    diagnosticProfile: "छात्र सीख रिपोर्ट",
    backToDashboard: "कक्षा डैशबोर्ड पर वापस",
    masteryScore: "छात्र की समझ का स्तर",
    confidenceScore: "विश्वसनीयता",
    rootCauseAnalysis: "छात्र क्यों कठिनाई महसूस कर रहा है",
    whyStruggling: "यह छात्र क्यों संघर्ष कर रहा है?",
    evidenceTrail: "उत्तर और साक्ष्य",
    studentAnswer: "छात्र का उत्तर",
    correctAnswer: "सही उत्तर",
    detectedMisconception: "देखी गई गलती",
    chainOfReasoning: "पहले आवश्यक बुनियादी कौशल",
    fiveDayPlanTitle: "5-दिवसीय अभ्यास योजना",
    dayLabel: "दिन",
    minutesLabel: "मिनट",
    printWorksheet: "अभ्यास पत्र प्रिंट करें",
    reassessStudent: "फिर से जांचें",

    statusMastered: "अच्छी समझ (75% या अधिक)",
    statusDeveloping: "अभ्यास चाहिए (50 से 74%)",
    statusNeedsSupport: "तुरंत मदद चाहिए (50% से कम)",
    statusNotAssessed: "जांच नहीं हुई",

    assessmentTitle: "सीख की जांच",
    adaptiveSubtitle: "प्रत्येक प्रश्न यह जानने में मदद करता है कि छात्र को पहले क्या अभ्यास चाहिए।",
    agentThinking: "उत्तर की जांच और अगला प्रश्न चयन",
    questionLabel: "प्रश्न",
    submitAnswer: "उत्तर जमा करें",
    nextQuestion: "अगला प्रश्न",
    finishAssessment: "परिणाम देखें",
    selectOption: "उत्तर चुनें:",
    enterAnswer: "उत्तर दर्ज करें...",
    yourAnswer: "आपका उत्तर:",
    correctFeedback: "शाबाश! सही उत्तर।",
    incorrectFeedback: "इस चरण के अभ्यास की जरूरत है।",
    assessmentComplete: "सीख की जांच पूरी हुई!",
    viewReport: "सीख रिपोर्ट और योजना देखें",

    hintLabel: "संकेत / मदद",
    showHint: "मदद चाहिए?",

    c_number_sense: "संख्या बोध और क्रम",
    c_place_value: "स्थानीय मान (इकाई, दहाई, सैकड़ा, हज़ार)",
    c_addition: "जोड़ (हासिल सहित)",
    c_subtraction: "घटाव (उधार सहित)",
    c_mult_concept: "गुणा की अवधारणा (समूह और पंक्तियाँ)",
    c_mult_facts: "गुणा पहाड़े (2 से 9)",
    c_multi_digit_mult: "बहु-अंकीय गुणा",
    c_division_concept: "भाग की अवधारणा (समान बँटवारा)",
    c_division_facts: "भाग तथ्य (Division Facts)",
    c_long_division: "दीर्घ भाग (शेषफल सहित)",
    c_division_word: "भाग के व्यावहारिक प्रश्न",
    c_fraction_basics: "भिन्न की मूल बातें (एक पूरे का भाग)",
    c_equivalent_fractions: "समतुल्य भिन्न",
    c_comparing_fractions: "भिन्नों की तुलना",
    c_fraction_addition: "भिन्नों का जोड़",

    "q.solve": "हल कीजिए:",
    "q.fill": "रिक्त स्थान भरें:",
    "q.ns.bigger": "कौन सी संख्या बड़ी है?",
    "q.ns.largest": "इनमें से सबसे बड़ी संख्या कौन सी है?",
    "q.ns.after": "{n} के ठीक बाद कौन सी संख्या आती है?",
    "q.pv.value": "संख्या {n} में अंक {digit} का स्थानीय मान क्या है?",
    "q.pv.expanded": "मानक रूप में लिखें: {th} हज़ार + {h} सैकड़ा + {t} दहाई + {o} इकाई",
    "q.add.word": "एक गाँव के स्कूल में {a} लड़के और {b} लड़कियाँ हैं। कुल कितने विद्यार्थी हैं?",
    "q.sub.word": "एक पुस्तकालय में {a} पुस्तकें हैं। यदि {b} पुस्तकें जारी की जाती हैं, तो कितनी पुस्तकें बचती हैं?",
    "q.mc.array": "बिंदुओं की पंक्तियों और स्तंभों को देखें। कौन सा गुणा कुल संख्या दर्शाता है?",
    "q.mc.groups": "{groups} थैलियाँ हैं। प्रत्येक थैली में {each} आम हैं। कुल कितने आम हैं?",
    "q.mc.repeated": "{a} को {times} बार जोड़ने के समान कौन सा गुणा रूप है?",
    "q.mdm.word": "एक किसान {a} बक्से सेब पैक करता है। प्रत्येक बक्से में {b} सेब हैं। कुल कितने सेब हैं?",
    "q.dc.meaning": "भाग का मुख्य अर्थ क्या है?",
    "q.dc.groups": "आपके पास {total} पेंसिलें हैं। यदि प्रत्येक डिब्बे में {each} पेंसिलें रखी जाएँ, तो कितने डिब्बों की आवश्यकता होगी?",
    "q.dc.share": "यदि {total} लड्डू {people} बच्चों में बराबर बाँटे जाएँ, तो प्रत्येक बच्चे को कितने लड्डू मिलेंगे?",
    "q.ld.remainder": "{a} को {b} से भाग दीजिए। भागफल और शेषफल क्या है?",
    "q.dw.autos": "{total} यात्रियों को यात्रा करनी है। प्रत्येक ऑटो में {capacity} यात्री बैठ सकते हैं। कितने ऑटो चाहिए?",
    "q.fb.shaded": "आकृति का कितना भाग छायांकित है?",
    "q.fb.denominator": "भिन्न {num}/{den} में हर (denominator) कौन सा है?",
    "q.fb.of": "{total} कंचों का {fraction} भाग कितना होगा?",
    "q.ef.which": "कौन सी भिन्न {a}/{b} के समतुल्य है?",
    "q.cf.bigger": "कौन सी भिन्न बड़ी है: {a} या {b}?",
    "q.fa.word": "रवि ने एक रोटी का {a} भाग खाया और सीता ने उसी रोटी का {b} भाग खाया। दोनों ने मिलकर कितना खाया?",

    "hint.number_sense": "बाएं से दाएं उच्चतम स्थान से अंकों की तुलना करें।",
    "hint.place_value": "याद रखें: इकाई = 1, दहाई = 10, सैकड़ा = 100, हज़ार = 1000।",
    "hint.addition": "अंकों को स्थानीय मान के अनुसार रखें। जब योग 10 या अधिक हो, तो हासिल अगले स्तंभ में जोड़ें।",
    "hint.subtraction": "जब ऊपर का अंक नीचे के अंक से छोटा हो, तो बाईं ओर के स्तंभ से 1 उधार लें।",
    "hint.mult_concept": "गुणा बराबर समूहों का बार-बार जोड़ है।",
    "hint.mult_facts": "गुणा पहाड़े या गिनती याद करें।",
    "hint.multi_digit_mult": "पहले इकाई से गुणा करें, फिर 0 लिखकर दहाई से गुणा करें।",
    "hint.division_concept": "भाग एक कुल राशि को बराबर समूहों में बाँटना है।",
    "hint.division_facts": "भाग गुणा का उल्टा है: यदि A × B = C, तो C ÷ B = A।",
    "hint.long_division": "क्रम: भाग करें, गुणा करें, घटाएं, फिर नीचे लाएं।",
    "hint.division_word": "कुल वस्तुएं और समूहों की संख्या पहचानें।",
    "hint.fraction_basics": "ऊपर का अंक लिए गए भाग हैं; नीचे का अंक कुल बराबर भाग हैं।",
    "hint.equivalent_fractions": "अंश और हर दोनों को एक ही संख्या से गुणा या भाग करें।",
    "hint.comparing_fractions": "जब हर समान हों, तो अंश की तुलना करें। जब अंश समान हों, तो छोटा हर बड़ा टुकड़ा होता है!",
    "hint.fraction_addition": "जब हर समान हों, तो केवल अंश जोड़ें और हर वही रखें।",

    "opt.dc.share": "समान समूहों में बराबर बाँटना",
    "opt.dc.groups": "कितने समूह हैं गिनना",
    "opt.dc.subtract": "एक संख्या घटाना",
    "opt.dc.multiply": "संख्याओं को बार-बार जोड़ना",
    "opt.dc.add": "दो समूहों को मिलाना",

    err_slip: "गणना चूक (असावधानीवश अंकगणितीय त्रुटि)",
    err_wrong_operation: "गलत संक्रिया का उपयोग (उदा. भाग की जगह घटा दिया)",
    err_regrouping: "हासिल/उधार की त्रुटि (Regrouping error)",
    err_place_value: "स्थानीय मान भ्रम (अंक को उसके स्थान के बजाय साधारण अंक मान लिया)",
    err_fraction_add_denominators: "हरों को आपस में जोड़ दिया (उदा. 1/4 + 1/4 = 2/8)",
    err_fraction_larger_denominator: "बड़े हर को बड़ी भिन्न समझ लिया (उदा. 1/6 > 1/2)",
    err_fraction_additive: "गुणा करने के बजाय अंश और हर में समान संख्या जोड़ दी",
    err_fraction_inverted: "अंश और हर को उलट दिया",
    err_remainder: "शेषफल छोड़ दिया या गलत निकाला",
    err_dont_know: "छात्र ने उत्तर नहीं पता बताया",
    err_unclassified: "अवर्गीकृत अंकगणितीय त्रुटि",
  },

  te: {
    appName: "శిక్షా-గ్యాప్ (ShikshaGap)",
    appTagline: "విద్యార్థి తర్వాత ఏమి నేర్చుకోవాలో తెలుసుకోండి",
    badgeGovtSchool: "ప్రాథమిక పాఠశాల",
    demoBadge: "డెమో: 5వ తరగతి A (36 మంది విద్యార్థులు)",
    resetDemo: "డెమో రీసెట్ చేయండి",
    teacherView: "ఉపాధ్యాయుల డాష్‌బోర్డ్",
    studentView: "విద్యార్థి పరిశీలన",
    schoolName: "ఎం.పి.పి.ఎస్ గాంధీ నగర్, హైదరాబాద్",
    class5A: "5వ తరగతి - సెక్షన్ A (గణితం)",

    totalStudents: "మొత్తం విద్యార్థులు",
    onTrack: "సరైన పురోగతిలో",
    needPractice: "సాధన అవసరం",
    criticalGaps: "వెంటనే సహాయం కావాలి",
    teacherQuestionBanner: "ఏ విద్యార్థులకు సహాయం కావాలి, ఈరోజు ఏమి బోధించాలి?",
    teacherQuestionSub: "శిక్షా-గ్యాప్ విద్యార్థులకు ముందుగా అవసరమైన పునాది నైపుణ్యాలను గుర్తిస్తుంది.",

    navHome: "హోమ్",
    navStudents: "విద్యార్థులు",
    navClassGaps: "తరగతి లోపాలు",
    navReports: "నివేదికలు",
    whoNeedsHelpToday: "ఈరోజు ఎవరికి సహాయం కావాలి",
    seeAllStudents: "అందరి విద్యార్థులను చూడండి",
    whatToDoNext: "తర్వాత ఏమి చేయాలి",
    showDetails: "వివరాలు చూపించు",
    hideDetails: "వివరాలు దాచు",
    todaysPractice: "ఈరోజు అభ్యాసం",
    startPractice: "సాధన ప్రారంభించండి",
    takeAssessment: "పరిశీలన ప్రారంభించండి",
    oneMainGap: "సాధన అవసరమైన అంశం",
    tabOverview: "తరగతి ముఖ్యాంశాలు",
    tabInterventions: "తర్వాత ఏమి చేయాలి",
    tabConceptMap: "తరగతి పురోగతి మ్యాప్",
    tabLiveAssessment: "నేర్చుకున్నది తనిఖీ చేయండి",

    rank: "వరుస సంఖ్య",
    conceptGap: "సాధన అవసరమైన అంశం",
    studentsAffected: "ప్రభావిత విద్యార్థులు",
    severity: "ప్రాధాన్యత",
    prerequisiteOf: "దీనికి ముందుగా అవసరం",
    highSeverity: "అధికం (High)",
    mediumSeverity: "మధ్యస్థం (Medium)",
    lowSeverity: "తక్కువ (Low)",

    studentName: "విద్యార్థి పేరు",
    rollNo: "రోల్ నెం.",
    symptomConcept: "ఇబ్బంది పడుతున్న అంశం",
    rootCauseConcept: "ముందుగా అవసరమైన నైపుణ్యం",
    action: "చర్య",
    diagnoseBtn: "అభ్యసన నివేదిక",
    planBtn: "సాధన ప్రణాళిక",
    practiceBtn: "సాధన చేయండి",

    diagnosticProfile: "విద్యార్థి అభ్యసన నివేదిక",
    backToDashboard: "తరగతి డాష్‌బోర్డ్‌కు తిరిగి వెళ్ళండి",
    masteryScore: "విద్యార్థి అవగాహన స్థాయి",
    confidenceScore: "విశ్వసనీయత",
    rootCauseAnalysis: "విద్యార్థి ఎందుకు ఇబ్బంది పడుతున్నారు",
    whyStruggling: "ఈ విద్యార్థి ఎందుకు ఇబ్బంది పడుతున్నారు?",
    evidenceTrail: "సమాధానాలు మరియు ఆధారాలు",
    studentAnswer: "విద్యార్థి సమాధానం",
    correctAnswer: "సరైన సమాధానం",
    detectedMisconception: "గమనించిన పొరపాటు",
    chainOfReasoning: "ముందుగా కావలసిన పునాది నైపుణ్యాలు",
    fiveDayPlanTitle: "5 రోజుల సాధన ప్రణాళిక",
    dayLabel: "రోజు",
    minutesLabel: "నిమిషాలు",
    printWorksheet: "సాధన పత్రం ప్రింట్ చేయండి",
    reassessStudent: "మళ్ళీ తనిఖీ చేయండి",

    statusMastered: "బాగా అర్థమైంది (75% లేదా ఎక్కువ)",
    statusDeveloping: "సాధన అవసరం (50 నుండి 74%)",
    statusNeedsSupport: "వెంటనే సహాయం కావాలి (50% కంటే తక్కువ)",
    statusNotAssessed: "ఇంకా తనిఖీ చేయలేదు",

    assessmentTitle: "నేర్చుకున్నది పరిశీలించడం",
    adaptiveSubtitle: "విద్యార్థికి ముందుగా ఏ అంశం సాధన కావాలో గుర్తించడానికి ప్రశ్నలు సహాయపడతాయి.",
    agentThinking: "సమాధానం పరిశీలించి తదుపరి ప్రశ్నను ఎంచుకోవడం",
    questionLabel: "ప్రశ్న",
    submitAnswer: "సమాధానం సమర్పించండి",
    nextQuestion: "తదుపరి ప్రశ్న",
    finishAssessment: "ఫలితాలు చూడండి",
    selectOption: "సమాధానాన్ని ఎంచుకోండి:",
    enterAnswer: "సమాధానం టైప్ చేయండి...",
    yourAnswer: "మీ సమాధానం:",
    correctFeedback: "చాలా బాగుంది! సరైన సమాధానం.",
    incorrectFeedback: "ఈ భావన మరింత సాధన చేయాలి.",
    assessmentComplete: "పరిశీలన పూర్తయింది!",
    viewReport: "అభ్యసన నివేదిక మరియు ప్రణాళిక చూడండి",

    hintLabel: "సహాయం / హింట్",
    showHint: "సహాయం కావాలా?",

    c_number_sense: "సంఖ్యా జ్ఞానం మరియు క్రమం",
    c_place_value: "స్థాన విలువ (ఒకట్లు, పదులు, వందలు, వేలు)",
    c_addition: "కూడిక (దశాంశ మార్పిడితో)",
    c_subtraction: "తీసివేత (అప్పు తెచ్చుకోవడంతో)",
    c_mult_concept: "గుణకారం భావన (సమూహాలు)",
    c_mult_facts: "ఎక్కాలు (2 నుండి 9)",
    c_multi_digit_mult: "పెద్ద సంఖ్యల గుణకారం",
    c_division_concept: "భాగహారం భావన (సమ పంపకం)",
    c_division_facts: "భాగహారం లెక్కలు",
    c_long_division: "శేషంతో కూడిన భాగహారం",
    c_division_word: "భాగహార రాత లెక్కలు",
    c_fraction_basics: "భిన్నాల ప్రాథమిక భావన",
    c_equivalent_fractions: "సమాన భిన్నాలు",
    c_comparing_fractions: "భిన్నాల పోలిక",
    c_fraction_addition: "భిన్నాల కూడిక",

    "q.solve": "సాధించండి:",
    "q.fill": "ఖాళీని పూరించండి:",
    "q.ns.bigger": "ఏ సంఖ్య పెద్దది?",
    "q.ns.largest": "వీటిలో అతిపెద్ద సంఖ్య ఏది?",
    "q.ns.after": "{n} తర్వాత వెంటనే వచ్చే సంఖ్య ఏది?",
    "q.pv.value": "{n} సంఖ్యలో {digit} అంకె స్థాన విలువ ఎంత?",
    "q.pv.expanded": "ప్రామాణిక రూపంలో రాయండి: {th} వేలు + {h} వందలు + {t} పదులు + {o} ఒకట్లు",
    "q.add.word": "ఒక పాఠశాలలో {a} మంది బాలురు, {b} మంది బాలికలు ఉన్నారు. మొత్తం ఎంతమంది?",
    "q.sub.word": "లైబ్రరీలో {a} పుస్తకాలు ఉన్నాయి. {b} పుస్తకాలు ఇస్తే, మిగిలినవి ఎన్ని?",
    "q.mc.array": "బిందువుల అమరికను చూడండి. ఏ గుణకారం సరైనది?",
    "q.mc.groups": "{groups} సంచులు ఉన్నాయి. ప్రతి సంచిలో {each} మామిడి పండ్లు ఉన్నాయి. మొత్తం ఎన్ని?",
    "q.mc.repeated": "{a} ని {times} సార్లు కూడడానికి సమానమైన గుణకారం ఏది?",
    "q.mdm.word": "ఒక రైతు {a} పెట్టెల ఆపిల్స్ ప్యాక్ చేసాడు. ప్రతి పెట్టెలో {b} ఉన్నాయి. మొత్తం ఎన్ని?",
    "q.dc.meaning": "భాగహారం అంటే ముఖ్యంగా ఏమిటి?",
    "q.dc.groups": "మీ వద్ద {total} పెన్సిళ్లు ఉన్నాయి. ప్రతి పెట్టెలో {each} ఉంచితే, ఎన్ని పెట్టెలు కావాలి?",
    "q.dc.share": "{total} లడ్డూలను {people} మంది పిల్లలకు సమానంగా పంచితే, ఒక్కొక్కరికి ఎన్ని వస్తాయి?",
    "q.ld.remainder": "{a} ని {b} తో భాగించండి. భాగఫలం మరియు శేషం ఎంత?",
    "q.dw.autos": "{total} మంది ప్రయాణీకులు ఉన్నారు. ప్రతి ఆటోలో {capacity} మంది పట్టవచ్చు. ఎన్ని ఆటోలు కావాలి?",
    "q.fb.shaded": "ఆకారంలో రంగు వేసిన భాగం భిన్న రూపంలో ఎంత?",
    "q.fb.denominator": "{num}/{den} భిన్నంలో హారం (denominator) ఏది?",
    "q.fb.of": "{total} గోళీలలో {fraction} భాగం ఎంత?",
    "q.ef.which": "{a}/{b} కి సమాన భిన్నం ఏది?",
    "q.cf.bigger": "ఏ భిన్నం పెద్దది: {a} లేదా {b}?",
    "q.fa.word": "రవి రోటీలో {a} భాగం తిన్నాడు, సీత అదే రోటీలో {b} భాగం తిన్నది. ఇద్దరూ కలిసి ఎంత తిన్నారు?",

    "hint.number_sense": "ఎడమ నుండి కుడికి పెద్ద స్థానం నుండి అంకెలను పోల్చండి.",
    "hint.place_value": "గుర్తుంచుకోండి: ఒకట్లు = 1, పదులు = 10, వందలు = 100, వేలు = 1000.",
    "hint.addition": "అంకెలను స్థాన విలువల ప్రకారం అమర్చండి. కూడిక 10 లేదా అంతకంటే ఎక్కువైతే పక్క స్థానానికి చేర్చండి.",
    "hint.subtraction": "పై అంకె కింద అంకె కంటే చిన్నదైతే, ఎడమ వైపు స్థానం నుండి 1 అప్పు తీసుకోండి.",
    "hint.mult_concept": "గుణకారం అనేది సమాన సమూహాల పునరావృత కూడిక.",
    "hint.mult_facts": "ఎక్కాలు లేదా సంఖ్యల లెక్కింపును గుర్తుకు తెచ్చుకోండి.",
    "hint.multi_digit_mult": "ముందుగా ఒకట్లతో గుణించండి, తరువాత 0 రాసి పదులతో గుణించండి.",
    "hint.division_concept": "భాగహారం అంటే సమాన సమూహాలుగా పంచడం.",
    "hint.division_facts": "భాగహారం గుణకారానికి వ్యతిరేకం: A × B = C అయితే, C ÷ B = A.",
    "hint.long_division": "దశలు: భాగించండి, గుణించండి, తీసివేయండి, కిందకు దించండి.",
    "hint.division_word": "మొత్తం వస్తువులు మరియు సమూహాల సంఖ్యను గుర్తించండి.",
    "hint.fraction_basics": "పై సంఖ్య తీసుకున్న భాగాలు; కింది సంఖ్య మొత్తం సమాన భాగాలు.",
    "hint.equivalent_fractions": "లవం మరియు హారం రెండింటినీ ఒకే సంఖ్యతో గుణించండి లేదా భాగించండి.",
    "hint.comparing_fractions": "హారాలు సమానంగా ఉన్నప్పుడు లవాలను పోల్చండి. లవాలు సమానమైతే, చిన్న హారం ఉన్నదే పెద్ద భాగం!",
    "hint.fraction_addition": "హారాలు సమానంగా ఉన్నప్పుడు, లవాలను మాత్రమే కూడండి.",

    "opt.dc.share": "సమాన సమూహాలుగా పంచడం",
    "opt.dc.groups": "ఎన్ని సమూహాలు ఉన్నాయో లెక్కించడం",
    "opt.dc.subtract": "ఒక సంఖ్యను తీసివేయడం",
    "opt.dc.multiply": "సంఖ్యలను పదే పదే కూడడం",
    "opt.dc.add": "రెండు సమూహాలను కలపడం",

    err_slip: "సాధారణ లెక్క తప్పు (అజాగ్రత్త వల్ల జరిగిన పొరపాటు)",
    err_wrong_operation: "తప్పుడు ప్రక్రియను వాడారు (ఉదా. భాగహారానికి బదులు తీసివేశారు)",
    err_regrouping: "దశాంశ మార్పిడి లేదా అప్పు తీసుకోవడంలో తప్పు",
    err_place_value: "స్థాన విలువల గందరగోళం",
    err_fraction_add_denominators: "హారాలను కూడా కలిపేశారు (ఉదా. 1/4 + 1/4 = 2/8)",
    err_fraction_larger_denominator: "పెద్ద హారం ఉన్న భిన్నాన్ని పెద్దదిగా భావించారు (ఉదా. 1/6 > 1/2)",
    err_fraction_additive: "గుణించడానికి బదులు పైన కింద ఒకే సంఖ్యను కలిపారు",
    err_fraction_inverted: "లవం మరియు హారాన్ని తారుమారు చేశారు",
    err_remainder: "శేషాన్ని విస్మరించారు లేదా తప్పుగా లెక్కించారు",
    err_dont_know: "సమాధానం తెలియదని విద్యార్థి తెలిపారు",
    err_unclassified: "వర్గీకరించని లెక్క పొరపాటు",
  },
};
