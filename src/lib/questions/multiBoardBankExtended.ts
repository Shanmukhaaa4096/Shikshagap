/**
 * ShikshaGap Multi-Board Question Bank - Extended Classes (1, 2, 6, 7, 8, 9, 10)
 *
 * Authentic, curriculum-aligned questions across:
 * - NCERT (NCF-SE 2023 & Rationalised editions)
 * - CISCE / ICSE (Regulations & Curriculum Framework)
 *
 * 4 Calibrated Difficulty Tiers:
 * 1 = Recall
 * 2 = Application (on-grade medium level start)
 * 3 = Multi-step reasoning
 * 4 = Challenge / HOTS (Olympiad-lite)
 *
 * Indian contexts: rupees, kirana shops, Indian railways, cricket, sweets, monuments.
 * Trilingual prompts (en, hi, te) with step-by-step verified solutions and pedagogical distractors.
 * Original problems aligned with official learning outcomes (zero copyright infringement).
 */

import type { MultiBoardQuestionEntry } from "./multiBoardBank.ts";

export const EXTENDED_MULTI_BOARD_QUESTIONS: MultiBoardQuestionEntry[] = [
  // =========================================================================
  // CLASS 1 - CBSE / NCERT (Joyful Mathematics) & ICSE
  // =========================================================================
  {
    id: "mb_cbse_1_ns_01",
    sourceStyle: "ncert",
    board: "CBSE",
    bookFamily: "Joyful Mathematics 1",
    class: 1,
    conceptIds: ["cbse-1-m02", "number_sense"],
    difficulty: 1, // Recall
    format: "mcq",
    prompt: {
      en: "Aarav has 7 red marigold flowers and Diya has 5 yellow marigold flowers. Who has more flowers?",
      hi: "आरव के पास 7 गेंदे के लाल फूल हैं और दीया के पास 5 पीले फूल हैं। किसके पास अधिक फूल हैं?",
      te: "ఆరవ్ దగ్గర 7 ఎర్ర బంతిపూలు మరియు దియా దగ్గర 5 పసుపు బంతిపూలు ఉన్నాయి. ఎవరి దగ్గర ఎక్కువ పూలు ఉన్నాయి?",
    },
    options: [
      { id: "o1", value: "Aarav", label: { en: "Aarav (7)", hi: "आरव (7)", te: "ఆరవ్ (7)" } },
      { id: "o2", value: "Diya", label: { en: "Diya (5)", hi: "दीया (5)", te: "దియా (5)" }, errorType: "smaller_number" },
      { id: "o3", value: "Both have equal", label: { en: "Both have equal", hi: "दोनों के पास बराबर हैं", te: "ఇద్దరి దగ్గర సమానంగా ఉన్నాయి" }, errorType: "misconception" },
      { id: "o4", value: "Cannot tell", label: { en: "Cannot tell", hi: "नहीं बता सकते", te: "చెప్పలేము" }, errorType: "slip" },
    ],
    correctAnswer: "Aarav",
    verifiedSolution: {
      en: "7 is greater than 5, so Aarav has more flowers.",
      hi: "7 संख्या 5 से बड़ी है, इसलिए आरव के पास अधिक फूल हैं।",
      te: "7 అనేది 5 కంటే పెద్ద సంఖ్య, కాబట్టి ఆరవ్ దగ్గర ఎక్కువ పూలు ఉన్నాయి.",
    },
    hint: {
      en: "Count from 1 to 7. 7 comes after 5.",
      hi: "1 से 7 तक गिनें। 7, 5 के बाद आता है।",
      te: "1 నుండి 7 వరకు లెక్కించండి. 5 తర్వాత 7 వస్తుంది.",
    },
    provenanceLabel: "NCERT Class 1 Joyful Mathematics Chapter 2 (Finding the Furry Friends)",
  },
  {
    id: "mb_cbse_1_add_02",
    sourceStyle: "ncert",
    board: "CBSE",
    bookFamily: "Joyful Mathematics 1",
    class: 1,
    conceptIds: ["cbse-1-m03", "addition"],
    difficulty: 2, // Application (on-grade start)
    format: "mcq",
    expression: "6 + 3 = ?",
    prompt: {
      en: "Meera bought 6 mangoes in the morning and 3 more mangoes in the evening. How many mangoes did she buy in total?",
      hi: "मीरा ने सुबह 6 आम खरीदे और शाम को 3 आम और खरीदे। उसने कुल कितने आम खरीदे?",
      te: "మీరా ఉదయం 6 మామిడిపండ్లు, సాయంత్రం మరో 3 మామిడిపండ్లు కొన్నది. మొత్తం ఎన్ని మామిడిపండ్లు కొన్నది?",
    },
    options: [
      { id: "o1", value: "9", label: { en: "9", hi: "9", te: "9" } },
      { id: "o2", value: "8", label: { en: "8", hi: "8", te: "8" }, errorType: "counting_slip" },
      { id: "o3", value: "10", label: { en: "10", hi: "10", te: "10" }, errorType: "counting_slip" },
      { id: "o4", value: "3", label: { en: "3", hi: "3", te: "3" }, errorType: "wrong_operation" },
    ],
    correctAnswer: "9",
    verifiedSolution: {
      en: "6 + 3 = 9 mangoes in total.",
      hi: "6 + 3 = 9 आम कुल मिलाकर।",
      te: "6 + 3 = మొత్తం 9 మామిడిపండ్లు.",
    },
    hint: {
      en: "Start at 6 and count forward 3 steps: 7, 8, 9.",
      hi: "6 से शुरू करें और आगे 3 कदम गिनें: 7, 8, 9।",
      te: "6 నుండి ప్రారంభించి 3 అంకెలు ముందుకు లెక్కించండి: 7, 8, 9.",
    },
    provenanceLabel: "NCERT Class 1 Joyful Mathematics Chapter 3 (Mango Treat)",
  },
  {
    id: "mb_icse_1_shapes_01",
    sourceStyle: "icse_foundation",
    board: "ICSE",
    bookFamily: "CISCE Mathematics Class 1",
    class: 1,
    conceptIds: ["icse-1-m04", "shapes_spatial"],
    difficulty: 2, // Application
    format: "mcq",
    prompt: {
      en: "Kiran looks at an Indian one-rupee coin. Which geometric shape does the face of the coin represent?",
      hi: "किरण एक रुपये का सिक्का देखती है। सिक्के का मुख किस ज्यामितीय आकार का होता है?",
      te: "కిరణ్ ఒక రూపాయి నాణేన్ని చూసింది. ఆ నాణెం ఉపరితలం ఏ ఆకారంలో ఉంటుంది?",
    },
    options: [
      { id: "o1", value: "Circle", label: { en: "Circle", hi: "वृत्त (Circle)", te: "వృత్తం (Circle)" } },
      { id: "o2", value: "Square", label: { en: "Square", hi: "वर्ग (Square)", te: "చతురస్రం (Square)" }, errorType: "shape_confusion" },
      { id: "o3", value: "Triangle", label: { en: "Triangle", hi: "त्रिभुज (Triangle)", te: "త్రిభుజం (Triangle)" }, errorType: "shape_confusion" },
      { id: "o4", value: "Rectangle", label: { en: "Rectangle", hi: "आयत (Rectangle)", te: "దీర్ఘచతురస్రం (Rectangle)" }, errorType: "shape_confusion" },
    ],
    correctAnswer: "Circle",
    verifiedSolution: {
      en: "A standard coin is round with no corners, which is a circle.",
      hi: "सिक्का गोल होता है जिसमें कोई कोना नहीं होता, यह एक वृत्त है।",
      te: "నాణెం గుండ్రంగా ఉంటుంది మరియు మూలలు ఉండవు, కాబట్టి అది వృత్తం.",
    },
    hint: {
      en: "Think of a round shape with curved boundary and no corners.",
      hi: "एक गोल आकार के बारे में सोचें जिसमें कोई कोना नहीं होता।",
      te: "ఎలాంటి మూలలు లేని గుండ్రని ఆకారాన్ని గుర్తుచేసుకోండి.",
    },
    provenanceLabel: "CISCE Curriculum Framework Class 1 (Geometry & Spatial Understanding)",
  },
  {
    id: "mb_cbse_1_multistep_01",
    sourceStyle: "exemplar",
    board: "CBSE",
    bookFamily: "NCERT Exemplar Class 1",
    class: 1,
    conceptIds: ["cbse-1-m12", "money"],
    difficulty: 3, // Multi-step reasoning
    format: "mcq",
    prompt: {
      en: "Rohan has two ₹5 coins. He buys a pencil for ₹6 at the school shop. How much money is left with him?",
      hi: "रोहन के पास ₹5 के दो सिक्के हैं। उसने दुकान से ₹6 की एक पेंसिल खरीदी। उसके पास कितने रुपये बचे?",
      te: "రోహన్ దగ్గర రెండు ₹5 నాణేలు ఉన్నాయి. అతను దుకాణంలో ₹6 పెన్సిల్ కొన్నాడు. అతని వద్ద ఇంకా ఎంత డబ్బు మిగిలింది?",
    },
    options: [
      { id: "o1", value: "₹4", label: { en: "₹4", hi: "₹4", te: "₹4" } },
      { id: "o2", value: "₹5", label: { en: "₹5", hi: "₹5", te: "₹5" }, errorType: "single_coin_slip" },
      { id: "o3", value: "₹3", label: { en: "₹3", hi: "₹3", te: "₹3" }, errorType: "arithmetic_slip" },
      { id: "o4", value: "₹6", label: { en: "₹6", hi: "₹6", te: "₹6" }, errorType: "cost_confusion" },
    ],
    correctAnswer: "₹4",
    verifiedSolution: {
      en: "Step 1: Rohan has 5 + 5 = ₹10. Step 2: Spent ₹6. Left: 10 - 6 = ₹4.",
      hi: "चरण 1: रोहन के पास 5 + 5 = ₹10 हैं। चरण 2: खर्च ₹6। शेष: 10 - 6 = ₹4।",
      te: "దశ 1: రోహన్ వద్ద 5 + 5 = ₹10 ఉన్నాయి. దశ 2: ఖర్చు ₹6. మిగిలినది: 10 - 6 = ₹4.",
    },
    hint: {
      en: "First find total money from two 5-rupee coins, then subtract 6 rupees.",
      hi: "पहले दोनों 5 रुपये के सिक्कों का कुल मूल्य निकालें, फिर 6 रुपये घटाएं।",
      te: "ముందుగా రెండు ఐదు రూపాయల నాణేల మొత్తం లెక్కించండి, తరువాత 6 రూపాయలు తీసివేయండి.",
    },
    provenanceLabel: "NCERT Class 1 Joyful Mathematics Chapter 12 (How Much Can We Spend)",
  },

  // =========================================================================
  // CLASS 2 - CBSE / NCERT (Joyful Mathematics) & ICSE
  // =========================================================================
  {
    id: "mb_cbse_2_pv_01",
    sourceStyle: "ncert",
    board: "CBSE",
    bookFamily: "Joyful Mathematics 2",
    class: 2,
    conceptIds: ["cbse-2-m02", "two_digit_numbers"],
    difficulty: 2, // Application (on-grade start)
    format: "mcq",
    prompt: {
      en: "In an inter-school cricket match, Yash scored 64 runs. What is the place value of the digit 6 in 64?",
      hi: "एक स्कूल क्रिकेट मैच में यश ने 64 रन बनाए। संख्या 64 में अंक 6 का स्थानीय मान क्या है?",
      te: "పాఠశాల క్రికెట్ మ్యాచ్‌లో యశ్ 64 పరుగులు చేశాడు. 64 సంఖ్యలో 6 యొక్క స్థాన విలువ ఎంత?",
    },
    options: [
      { id: "o1", value: "60", label: { en: "60 (6 tens)", hi: "60 (6 दहाई)", te: "60 (6 పదులు)" } },
      { id: "o2", value: "6", label: { en: "6 (6 ones)", hi: "6 (6 इकाई)", te: "6 (6 ఒకట్లు)" }, errorType: "face_value_confusion" },
      { id: "o3", value: "64", label: { en: "64", hi: "64", te: "64" }, errorType: "whole_number_slip" },
      { id: "o4", value: "40", label: { en: "40", hi: "40", te: "40" }, errorType: "swapped_digit" },
    ],
    correctAnswer: "60",
    verifiedSolution: {
      en: "In 64, 6 is in the tens place. 6 tens = 60.",
      hi: "64 में, अंक 6 दहाई के स्थान पर है। 6 दहाई = 60।",
      te: "64 లో, 6 పదుల స్థానంలో ఉంది. 6 పదులు = 60.",
    },
    hint: {
      en: "64 has 6 tens and 4 ones. 6 tens means 6 × 10.",
      hi: "64 में 6 दहाई और 4 इकाई हैं। 6 दहाई का अर्थ 6 × 10 है।",
      te: "64 లో 6 పదులు మరియు 4 ఒకట్లు ఉన్నాయి. 6 పదులు అంటే 6 × 10.",
    },
    provenanceLabel: "NCERT Class 2 Joyful Mathematics Chapter 2 (Counting in Groups)",
  },
  {
    id: "mb_icse_2_addsub_01",
    sourceStyle: "icse_selina",
    board: "ICSE",
    bookFamily: "Concise Mathematics Class 2",
    class: 2,
    conceptIds: ["icse-2-m02", "addition_subtraction"],
    difficulty: 3, // Multi-step reasoning
    format: "mcq",
    prompt: {
      en: "A bakery had 75 kaju katli sweets in a display tray. In the afternoon, 38 sweets were sold. How many sweets remain in the tray?",
      hi: "एक मिठाई की दुकान पर ट्रे में 75 काजू कतली थीं। दोपहर में 38 मिठाइयां बिक गईं। ट्रे में कितनी मिठाइयां बची हैं?",
      te: "ఒక స్వీట్ దుకాణం ట్రేలో 75 కాజు కట్లీ స్వీట్లు ఉన్నాయి. మధ్యాహ్నం 38 స్వీట్లు అమ్ముడయ్యాయి. ట్రేలో ఇంకా ఎన్ని స్వీట్లు మిగిలాయి?",
    },
    options: [
      { id: "o1", value: "37", label: { en: "37", hi: "37", te: "37" } },
      { id: "o2", value: "43", label: { en: "43", hi: "43", te: "43" }, errorType: "smaller_from_larger_bug" },
      { id: "o3", value: "47", label: { en: "47", hi: "47", te: "47" }, errorType: "borrowing_slip" },
      { id: "o4", value: "113", label: { en: "113", hi: "113", te: "113" }, errorType: "wrong_operation" },
    ],
    correctAnswer: "37",
    verifiedSolution: {
      en: "75 - 38: Regroup 7 tens 5 ones as 6 tens 15 ones. 15 - 8 = 7, and 6 - 3 = 3. Result = 37.",
      hi: "75 - 38: 7 दहाई 5 इकाई को 6 दहाई 15 इकाई में बदलें। 15 - 8 = 7, और 6 - 3 = 3। उत्तर = 37।",
      te: "75 - 38: 7 పదులు 5 ఒకట్లను 6 పదులు 15 ఒకట్లుగా మార్చండి. 15 - 8 = 7, 6 - 3 = 3. జవాబు = 37.",
    },
    hint: {
      en: "Since 5 is smaller than 8, borrow 1 ten from 70 to make 15 ones.",
      hi: "चूंकि 5, 8 से छोटा है, 7 से 1 दहाई उधार लें जिससे 15 इकाई बनेगी।",
      te: "5 అనేది 8 కంటే చిన్నది కాబట్టి, 7 పదుల నుండి 1 పది అప్పు తెచ్చుకుంటే 15 ఒకట్లు అవుతాయి.",
    },
    provenanceLabel: "CISCE Class 2 Mathematics (Addition & Subtraction with Regrouping)",
  },

  // =========================================================================
  // CLASS 6 - CBSE / NCERT (Ganita Prakash NCF-SE 2023) & ICSE
  // =========================================================================
  {
    id: "mb_cbse_6_int_01",
    sourceStyle: "ncert",
    board: "CBSE",
    bookFamily: "Ganita Prakash Class 6",
    class: 6,
    conceptIds: ["cbse-6-m03", "integers"],
    difficulty: 2, // Application (on-grade start)
    format: "mcq",
    prompt: {
      en: "At midnight in Leh, the temperature was -4°C. By noon, the temperature rose by 9°C. What was the temperature at noon?",
      hi: "लेह में आधी रात को तापमान -4°C था। दोपहर तक तापमान में 9°C की वृद्धि हुई। दोपहर को तापमान कितना था?",
      te: "లేహ్‌లో అర్ధరాత్రి ఉష్ణోగ్రత -4°C గా ఉంది. మధ్యాహ్నానికి ఉష్ణోగ్రత 9°C పెరిగింది. మధ్యాహ్నం ఉష్ణోగ్రత ఎంత?",
    },
    options: [
      { id: "o1", value: "5°C", label: { en: "5°C", hi: "5°C", te: "5°C" } },
      { id: "o2", value: "-13°C", label: { en: "-13°C", hi: "-13°C", te: "-13°C" }, errorType: "sign_error_subtraction" },
      { id: "o3", value: "13°C", label: { en: "13°C", hi: "13°C", te: "13°C" }, errorType: "absolute_addition" },
      { id: "o4", value: "-5°C", label: { en: "-5°C", hi: "-5°C", te: "-5°C" }, errorType: "sign_confusion" },
    ],
    correctAnswer: "5°C",
    verifiedSolution: {
      en: "Temperature at noon = -4 + 9 = 5°C.",
      hi: "दोपहर का तापमान = -4 + 9 = 5°C।",
      te: "మధ్యాహ్నం ఉష్ణోగ్రత = -4 + 9 = 5°C.",
    },
    hint: {
      en: "On a number line, start at -4 and move 9 units to the right.",
      hi: "संख्या रेखा पर -4 से शुरू करें और 9 इकाइयां दाईं ओर जाएं।",
      te: "సంఖ్యా రేఖపై -4 వద్ద మొదలుపెట్టి కుడివైపునకు 9 స్థానాలు జరగండి.",
    },
    provenanceLabel: "NCERT Class 6 Ganita Prakash Chapter 3 (Integers)",
  },
  {
    id: "mb_icse_6_ratio_01",
    sourceStyle: "icse_selina",
    board: "ICSE",
    bookFamily: "Concise Mathematics Class 6",
    class: 6,
    conceptIds: ["icse-6-m04", "ratio_proportion"],
    difficulty: 2, // Application
    format: "mcq",
    prompt: {
      en: "In a class of 45 students, the ratio of boys to girls is 3 : 2. How many boys are there in the class?",
      hi: "45 विद्यार्थियों की एक कक्षा में लड़कों और लड़कियों का अनुपात 3 : 2 है। कक्षा में कितने लड़के हैं?",
      te: "45 మంది విద్యార్థులున్న తరగతిలో బాలురు మరియు బాలికల నిష్పత్తి 3 : 2. తరగతిలో ఎంతమంది బాలురు ఉన్నారు?",
    },
    options: [
      { id: "o1", value: "27", label: { en: "27 boys", hi: "27 लड़के", te: "27 మంది బాలురు" } },
      { id: "o2", value: "18", label: { en: "18 boys", hi: "18 लड़के", te: "18 మంది బాలురు" }, errorType: "calculated_girls_instead" },
      { id: "o3", value: "30", label: { en: "30 boys", hi: "30 लड़के", te: "30 మంది బాలురు" }, errorType: "ratio_miscalculation" },
      { id: "o4", value: "25", label: { en: "25 boys", hi: "25 लड़के", te: "25 మంది బాలురు" }, errorType: "slip" },
    ],
    correctAnswer: "27",
    verifiedSolution: {
      en: "Total parts = 3 + 2 = 5. Value of 1 part = 45 / 5 = 9. Boys = 3 parts = 3 × 9 = 27.",
      hi: "कुल भाग = 3 + 2 = 5। 1 भाग = 45 / 5 = 9। लड़के = 3 भाग = 3 × 9 = 27।",
      te: "మొత్తం భాగాలు = 3 + 2 = 5. 1 భాగం విలువ = 45 / 5 = 9. బాలురు = 3 భాగాలు = 3 × 9 = 27.",
    },
    hint: {
      en: "Divide total students by sum of ratio parts (3 + 2 = 5), then multiply by 3.",
      hi: "कुल विद्यार्थियों को अनुपात के योग (3 + 2 = 5) से भाग दें, फिर 3 से गुणा करें।",
      te: "మొత్తం విద్యార్థులను నిష్పత్తి భాగాల మొత్తంతో (3 + 2 = 5) భాగించి, 3 తో గుణించండి.",
    },
    provenanceLabel: "CISCE Mathematics Class 6 Chapter on Ratio and Proportion",
  },
  {
    id: "mb_cbse_6_alg_02",
    sourceStyle: "exemplar",
    board: "CBSE",
    bookFamily: "NCERT Exemplar Class 6",
    class: 6,
    conceptIds: ["cbse-6-m07", "algebra_intro"],
    difficulty: 3, // Multi-step reasoning
    format: "mcq",
    prompt: {
      en: "An auto-rickshaw charges ₹25 for the first kilometre and ₹12 for each subsequent kilometre. Which algebraic expression gives the total fare for travelling x kilometres (where x > 1)?",
      hi: "एक ऑटो-रिक्शा पहले किलोमीटर के लिए ₹25 और उसके बाद के प्रत्येक किलोमीटर के लिए ₹12 लेता है। x किलोमीटर (जहाँ x > 1) की यात्रा का कुल किराया किस बीजीय व्यंजक द्वारा दर्शाया जाएगा?",
      te: "ఒక ఆటో-రిక్షా మొదటి కిలోమీటరుకు ₹25 మరియు ఆ తరువాత ప్రతి కిలోమీటరుకు ₹12 ఛార్జీ చేస్తుంది. x కిలోమీటర్ల ప్రయాణానికి (x > 1 అయినప్పుడు) మొత్తం ఛార్జీని సూచించే బీజగణిత సమాసం ఏది?",
    },
    options: [
      { id: "o1", value: "25 + 12(x - 1)", label: { en: "25 + 12(x - 1)", hi: "25 + 12(x - 1)", te: "25 + 12(x - 1)" } },
      { id: "o2", value: "25 + 12x", label: { en: "25 + 12x", hi: "25 + 12x", te: "25 + 12x" }, errorType: "omitted_first_km_offset" },
      { id: "o3", value: "12 + 25(x - 1)", label: { en: "12 + 25(x - 1)", hi: "12 + 25(x - 1)", te: "12 + 25(x - 1)" }, errorType: "swapped_rates" },
      { id: "o4", value: "37x", label: { en: "37x", hi: "37x", te: "37x" }, errorType: "added_coefficients" },
    ],
    correctAnswer: "25 + 12(x - 1)",
    verifiedSolution: {
      en: "First 1 km costs ₹25. Remaining distance is (x - 1) km at ₹12 per km. Total fare = 25 + 12(x - 1).",
      hi: "पहले 1 किमी का किराया ₹25 है। शेष दूरी (x - 1) किमी ₹12 प्रति किमी की दर से है। कुल किराया = 25 + 12(x - 1)।",
      te: "మొదటి 1 కి.మీ కు ₹25. మిగిలిన దూరం (x - 1) కి.మీ కు కిలోమీటరుకు ₹12 చొప్పున. మొత్తం ఛార్జీ = 25 + 12(x - 1).",
    },
    hint: {
      en: "The ₹25 already covers the first kilometre, so ₹12 applies only to the remaining (x - 1) km.",
      hi: "₹25 पहले किलोमीटर का किराया है, इसलिए ₹12 केवल बचे हुए (x - 1) किमी पर लागू होगा।",
      te: "₹25 మొదటి కిలోమీటరుకే కాబట్టి, ₹12 మిగిలిన (x - 1) కిలోమీటర్లకే వర్తిస్తుంది.",
    },
    provenanceLabel: "NCERT Class 6 Ganita Prakash Chapter 7 (Introduction to Algebra)",
  },

  // =========================================================================
  // CLASS 7 - CBSE / NCERT & ICSE
  // =========================================================================
  {
    id: "mb_cbse_7_eqn_01",
    sourceStyle: "ncert",
    board: "CBSE",
    bookFamily: "Mathematics Class 7",
    class: 7,
    conceptIds: ["cbse-7-m04", "linear_equations"],
    difficulty: 2, // Application (on-grade start)
    format: "mcq",
    expression: "3x + 7 = 34",
    prompt: {
      en: "Solve the linear equation: 3x + 7 = 34. What is the value of x?",
      hi: "रैखिक समीकरण हल करें: 3x + 7 = 34। x का मान क्या है?",
      te: "సరళ సమీకరణాన్ని సాధించండి: 3x + 7 = 34. x విలువ ఎంత?",
    },
    options: [
      { id: "o1", value: "9", label: { en: "x = 9", hi: "x = 9", te: "x = 9" } },
      { id: "o2", value: "11", label: { en: "x = 11", hi: "x = 11", te: "x = 11" }, errorType: "sign_error_transposition" },
      { id: "o3", value: "8", label: { en: "x = 8", hi: "x = 8", te: "x = 8" }, errorType: "arithmetic_slip" },
      { id: "o4", value: "27", label: { en: "x = 27", hi: "x = 27", te: "x = 27" }, errorType: "forgot_to_divide" },
    ],
    correctAnswer: "9",
    verifiedSolution: {
      en: "3x = 34 - 7 = 27. Then x = 27 / 3 = 9.",
      hi: "3x = 34 - 7 = 27। अतः x = 27 / 3 = 9।",
      te: "3x = 34 - 7 = 27. కావున x = 27 / 3 = 9.",
    },
    hint: {
      en: "Subtract 7 from both sides first, then divide by 3.",
      hi: "पहले दोनों पक्षों से 7 घटाएं, फिर 3 से भाग दें।",
      te: "ముందుగా ఇరువైపులా 7 తీసివేయండి, ఆపై 3 తో భాగించండి.",
    },
    provenanceLabel: "NCERT Class 7 Mathematics Chapter 4 (Simple Equations)",
  },
  {
    id: "mb_icse_7_rat_01",
    sourceStyle: "icse_selina",
    board: "ICSE",
    bookFamily: "Concise Mathematics Class 7",
    class: 7,
    conceptIds: ["icse-7-m02", "rational_numbers"],
    difficulty: 2, // Application
    format: "mcq",
    expression: "(-5/8) + (3/4) = ?",
    prompt: {
      en: "Evaluate the sum of rational numbers: (-5/8) + (3/4)",
      hi: "परिमेय संख्याओं का योग ज्ञात कीजिए: (-5/8) + (3/4)",
      te: "అకరణీయ సంఖ్యల మొత్తాన్ని కనుగొనండి: (-5/8) + (3/4)",
    },
    options: [
      { id: "o1", value: "1/8", label: { en: "1/8", hi: "1/8", te: "1/8" } },
      { id: "o2", value: "-1/8", label: { en: "-1/8", hi: "-1/8", te: "-1/8" }, errorType: "sign_confusion" },
      { id: "o3", value: "-2/12", label: { en: "-2/12", hi: "-2/12", te: "-2/12" }, errorType: "added_numerators_and_denominators" },
      { id: "o4", value: "11/8", label: { en: "11/8", hi: "11/8", te: "11/8" }, errorType: "ignored_negative_sign" },
    ],
    correctAnswer: "1/8",
    verifiedSolution: {
      en: "Convert 3/4 to common denominator 8: 3/4 = 6/8. Then (-5 + 6) / 8 = 1/8.",
      hi: "3/4 को समान हर 8 में बदलें: 3/4 = 6/8। तब (-5 + 6) / 8 = 1/8।",
      te: "3/4 ను సమాన హారం 8 గా మార్చండి: 3/4 = 6/8. అప్పుడు (-5 + 6) / 8 = 1/8.",
    },
    hint: {
      en: "Find LCM of denominators 8 and 4, which is 8.",
      hi: "हरों 8 और 4 का ल.स. (LCM) 8 है।",
      te: "హారాలైన 8 మరియు 4 ల క.సా.గు 8 అవుతుంది.",
    },
    provenanceLabel: "CISCE Mathematics Class 7 (Rational Numbers & Operations)",
  },

  // =========================================================================
  // CLASS 8 - CBSE / NCERT & ICSE
  // =========================================================================
  {
    id: "mb_cbse_8_alg_01",
    sourceStyle: "cbse_reference",
    board: "CBSE",
    bookFamily: "Mathematics Class 8 (RD Sharma style)",
    class: 8,
    conceptIds: ["cbse-8-m08", "algebraic_identities"],
    difficulty: 2, // Application (on-grade start)
    format: "mcq",
    expression: "(2x + 3y)^2 = ?",
    prompt: {
      en: "Using standard algebraic identities, expand: (2x + 3y)^2",
      hi: "मानक बीजीय सर्वसमिका का प्रयोग करके प्रसार कीजिए: (2x + 3y)^2",
      te: "బీజగణిత నిత్యసమీకరణాన్ని ఉపయోగించి విస్తరించండి: (2x + 3y)^2",
    },
    options: [
      { id: "o1", value: "4x^2 + 12xy + 9y^2", label: { en: "4x² + 12xy + 9y²", hi: "4x² + 12xy + 9y²", te: "4x² + 12xy + 9y²" } },
      { id: "o2", value: "4x^2 + 9y^2", label: { en: "4x² + 9y²", hi: "4x² + 9y²", te: "4x² + 9y²" }, errorType: "forgot_middle_term_2ab" },
      { id: "o3", value: "4x^2 + 6xy + 9y^2", label: { en: "4x² + 6xy + 9y²", hi: "4x² + 6xy + 9y²", te: "4x² + 6xy + 9y²" }, errorType: "forgot_factor_of_2" },
      { id: "o4", value: "2x^2 + 12xy + 3y^2", label: { en: "2x² + 12xy + 3y²", hi: "2x² + 12xy + 3y²", te: "2x² + 12xy + 3y²" }, errorType: "forgot_to_square_coefficients" },
    ],
    correctAnswer: "4x^2 + 12xy + 9y^2",
    verifiedSolution: {
      en: "(a + b)² = a² + 2ab + b². Here a = 2x, b = 3y. (2x)² + 2(2x)(3y) + (3y)² = 4x² + 12xy + 9y².",
      hi: "(a + b)² = a² + 2ab + b²। यहाँ a = 2x, b = 3y। (2x)² + 2(2x)(3y) + (3y)² = 4x² + 12xy + 9y²।",
      te: "(a + b)² = a² + 2ab + b². ఇక్కడ a = 2x, b = 3y. (2x)² + 2(2x)(3y) + (3y)² = 4x² + 12xy + 9y².",
    },
    hint: {
      en: "Remember the middle term is 2 × a × b, not just a × b.",
      hi: "याद रखें कि मध्य पद 2 × a × b होता है, केवल a × b नहीं।",
      te: "మధ్య పదం 2 × a × b అని గుర్తుంచుకోండి.",
    },
    provenanceLabel: "NCERT Class 8 Mathematics Chapter 8 (Algebraic Expressions and Identities)",
  },
  {
    id: "mb_icse_8_exp_01",
    sourceStyle: "icse_selina",
    board: "ICSE",
    bookFamily: "Concise Mathematics Class 8",
    class: 8,
    conceptIds: ["icse-8-m01", "rational_powers"],
    difficulty: 3, // Multi-step reasoning
    format: "mcq",
    expression: "(2^3 * 2^-5) / 2^-4 = ?",
    prompt: {
      en: "Simplify using laws of exponents: (2³ × 2⁻⁵) ÷ 2⁻⁴",
      hi: "घातांक के नियमों का प्रयोग करके सरल कीजिए: (2³ × 2⁻⁵) ÷ 2⁻⁴",
      te: "ఘాతాంక న్యాయాలను ఉపయోగించి సూక్ష్మీకరించండి: (2³ × 2⁻⁵) ÷ 2⁻⁴",
    },
    options: [
      { id: "o1", value: "4", label: { en: "4 (or 2²)", hi: "4 (या 2²)", te: "4 (లేదా 2²)" } },
      { id: "o2", value: "2", label: { en: "2", hi: "2", te: "2" }, errorType: "exponent_addition_error" },
      { id: "o3", value: "1/4", label: { en: "1/4 (or 2⁻²)", hi: "1/4 (या 2⁻²)", te: "1/4 (లేదా 2⁻²)" }, errorType: "sign_error_division" },
      { id: "o4", value: "8", label: { en: "8 (or 2³)", hi: "8 (या 2³)", te: "8 (లేదా 2³)" }, errorType: "slip" },
    ],
    correctAnswer: "4",
    verifiedSolution: {
      en: "Numerator: 2^(3 + (-5)) = 2⁻². Then 2⁻² ÷ 2⁻⁴ = 2^(-2 - (-4)) = 2^(-2 + 4) = 2² = 4.",
      hi: "अंश: 2^(3 + (-5)) = 2⁻²। फिर 2⁻² ÷ 2⁻⁴ = 2^(-2 - (-4)) = 2² = 4।",
      te: "లవం: 2^(3 + (-5)) = 2⁻². తరువాత 2⁻² ÷ 2⁻⁴ = 2^(-2 - (-4)) = 2² = 4.",
    },
    hint: {
      en: "a^m × a^n = a^(m+n) and a^m ÷ a^n = a^(m-n).",
      hi: "a^m × a^n = a^(m+n) और a^m ÷ a^n = a^(m-n)।",
      te: "a^m × a^n = a^(m+n) మరియు a^m ÷ a^n = a^(m-n).",
    },
    provenanceLabel: "CISCE Mathematics Class 8 Chapter on Exponents and Powers",
  },

  // =========================================================================
  // CLASS 9 - CBSE / NCERT & ICSE
  // =========================================================================
  {
    id: "mb_cbse_9_poly_01",
    sourceStyle: "ncert",
    board: "CBSE",
    bookFamily: "Mathematics Class 9",
    class: 9,
    conceptIds: ["cbse-9-m02", "polynomials"],
    difficulty: 2, // Application (on-grade start)
    format: "mcq",
    prompt: {
      en: "Find the zeroes of the quadratic polynomial: p(x) = x² - 5x + 6",
      hi: "द्विघात बहुपद के शून्यक ज्ञात कीजिए: p(x) = x² - 5x + 6",
      te: "వర్గ బహుపది యొక్క శూన్యాలను కనుగొనండి: p(x) = x² - 5x + 6",
    },
    options: [
      { id: "o1", value: "2, 3", label: { en: "x = 2 and x = 3", hi: "x = 2 और x = 3", te: "x = 2 మరియు x = 3" } },
      { id: "o2", value: "-2, -3", label: { en: "x = -2 and x = -3", hi: "x = -2 और x = -3", te: "x = -2 మరియు x = -3" }, errorType: "sign_error_factor_to_root" },
      { id: "o3", value: "1, 6", label: { en: "x = 1 and x = 6", hi: "x = 1 और x = 6", te: "x = 1 మరియు x = 6" }, errorType: "wrong_factor_pair" },
      { id: "o4", value: "-1, 6", label: { en: "x = -1 and x = 6", hi: "x = -1 और x = 6", te: "x = -1 మరియు x = 6" }, errorType: "wrong_factor_sum" },
    ],
    correctAnswer: "2, 3",
    verifiedSolution: {
      en: "Factorise: x² - 5x + 6 = (x - 2)(x - 3). Setting p(x) = 0 gives x = 2 and x = 3.",
      hi: "गुणनखंड कीजिए: x² - 5x + 6 = (x - 2)(x - 3)। p(x) = 0 रखने पर x = 2 और x = 3 प्राप्त होता है।",
      te: "కారణాంకాలు: x² - 5x + 6 = (x - 2)(x - 3). p(x) = 0 చేస్తే x = 2 మరియు x = 3 వస్తాయి.",
    },
    hint: {
      en: "Find two numbers whose product is 6 and sum is -5. They are -2 and -3.",
      hi: "ऐसी दो संख्याएं खोजें जिनका गुणनफल 6 और योग -5 हो: -2 और -3।",
      te: "లబ్ధం 6 మరియు మొత్తం -5 అయ్యే రెండు సంఖ్యలు -2 మరియు -3.",
    },
    provenanceLabel: "NCERT Class 9 Mathematics Chapter 2 (Polynomials)",
  },
  {
    id: "mb_icse_9_coord_01",
    sourceStyle: "icse_selina",
    board: "ICSE",
    bookFamily: "Concise Mathematics Class 9",
    class: 9,
    conceptIds: ["icse-9-m07", "coordinate_geometry"],
    difficulty: 2, // Application
    format: "mcq",
    prompt: {
      en: "Point P has coordinates (-4, 7). In which quadrant of the Cartesian plane does point P lie?",
      hi: "बिंदु P के निर्देशांक (-4, 7) हैं। कार्तीय तल के किस चतुर्थांश में बिंदु P स्थित है?",
      te: "బిందువు P యొక్క నిరూపకాలు (-4, 7). కార్టీసియన్ తలంలో బిందువు P ఏ పాదంలో ఉంటుంది?",
    },
    options: [
      { id: "o1", value: "Quadrant II", label: { en: "Quadrant II (Second)", hi: "द्वितीय चतुर्थांश (Quadrant II)", te: "రెండవ పాదం (Quadrant II)" } },
      { id: "o2", value: "Quadrant I", label: { en: "Quadrant I (First)", hi: "प्रथम चतुर्थांश (Quadrant I)", te: "మొదటి పాదం (Quadrant I)" }, errorType: "ignored_negative_x" },
      { id: "o3", value: "Quadrant III", label: { en: "Quadrant III (Third)", hi: "तृतीय चतुर्थांश (Quadrant III)", te: "మూడవ పాదం (Quadrant III)" }, errorType: "assumed_both_negative" },
      { id: "o4", value: "Quadrant IV", label: { en: "Quadrant IV (Fourth)", hi: "चतुर्थ चतुर्थांश (Quadrant IV)", te: "నాల్గవ పాదం (Quadrant IV)" }, errorType: "swapped_x_and_y_signs" },
    ],
    correctAnswer: "Quadrant II",
    verifiedSolution: {
      en: "For x < 0 and y > 0, the point lies in the Second Quadrant (Quadrant II).",
      hi: "चूंकि x < 0 (ऋणात्मक) और y > 0 (धनात्मक) है, बिंदु द्वितीय चतुर्थांश में स्थित है।",
      te: "x < 0 మరియు y > 0 కాబట్టి, బిందువు రెండవ పాదంలో (Quadrant II) ఉంటుంది.",
    },
    hint: {
      en: "Quadrant I is (+, +), Quadrant II is (-, +), Quadrant III is (-, -), Quadrant IV is (+, -).",
      hi: "प्रथम चतुर्थांश (+, +), द्वितीय (-, +), तृतीय (-, -), चतुर्थ (+, -) होता है।",
      te: "మొదటి పాదం (+, +), రెండవ పాదం (-, +), మూడవ పాదం (-, -), నాల్గవ పాదం (+, -).",
    },
    provenanceLabel: "CISCE Mathematics Class 9 Chapter on Coordinate Geometry",
  },
  {
    id: "mb_cbse_9_numsys_03",
    sourceStyle: "exemplar",
    board: "CBSE",
    bookFamily: "NCERT Exemplar Class 9",
    class: 9,
    conceptIds: ["cbse-9-m01", "number_systems"],
    difficulty: 3, // Multi-step reasoning
    format: "mcq",
    expression: "1 / (sqrt(7) - sqrt(6)) = ?",
    prompt: {
      en: "Rationalise the denominator of the real number expression: 1 / (√7 - √6)",
      hi: "वास्तविक संख्या व्यंजक के हर का परिमेयकरण कीजिए: 1 / (√7 - √6)",
      te: "కరణి హారాన్ని అకరణీయం చేయండి: 1 / (√7 - √6)",
    },
    options: [
      { id: "o1", value: "sqrt(7) + sqrt(6)", label: { en: "√7 + √6", hi: "√7 + √6", te: "√7 + √6" } },
      { id: "o2", value: "sqrt(7) - sqrt(6)", label: { en: "√7 - √6", hi: "√7 - √6", te: "√7 - √6" }, errorType: "forgot_conjugate" },
      { id: "o3", value: "(sqrt(7) + sqrt(6)) / 13", label: { en: "(√7 + √6) / 13", hi: "(√7 + √6) / 13", te: "(√7 + √6) / 13" }, errorType: "added_radicands_in_denominator" },
      { id: "o4", value: "1", label: { en: "1", hi: "1", te: "1" }, errorType: "incorrect_cancellation" },
    ],
    correctAnswer: "sqrt(7) + sqrt(6)",
    verifiedSolution: {
      en: "Multiply numerator and denominator by conjugate (√7 + √6): (√7 + √6) / ((√7)² - (√6)²) = (√7 + √6) / (7 - 6) = √7 + √6.",
      hi: "अंश और हर को संयुग्मी (√7 + √6) से गुणा करें: (√7 + √6) / (7 - 6) = √7 + √6।",
      te: "లవహారాలను సంయుగ్మం (√7 + √6) తో గుణించండి: (√7 + √6) / (7 - 6) = √7 + √6.",
    },
    hint: {
      en: "Multiply by the conjugate (√7 + √6) and use (a - b)(a + b) = a² - b².",
      hi: "संयुग्मी (√7 + √6) से गुणा करें और (a - b)(a + b) = a² - b² का प्रयोग करें।",
      te: "సంయుగ్మం (√7 + √6) తో గుణించి (a - b)(a + b) = a² - b² సూత్రాన్ని వాడండి.",
    },
    provenanceLabel: "NCERT Class 9 Mathematics Chapter 1 (Number Systems)",
  },

  // =========================================================================
  // CLASS 10 - CBSE / NCERT & ICSE
  // =========================================================================
  {
    id: "mb_cbse_10_quad_01",
    sourceStyle: "ncert",
    board: "CBSE",
    bookFamily: "Mathematics Class 10",
    class: 10,
    conceptIds: ["cbse-10-m04", "quadratic_equations"],
    difficulty: 2, // Application (on-grade start)
    format: "mcq",
    expression: "2x^2 - 4x + 3 = 0",
    prompt: {
      en: "Find the discriminant (D = b² - 4ac) of the quadratic equation 2x² - 4x + 3 = 0 and determine the nature of its roots.",
      hi: "द्विघात समीकरण 2x² - 4x + 3 = 0 का विविक्तकर (D = b² - 4ac) ज्ञात कीजिए और मूलों की प्रकृति बताइए।",
      te: "వర్గ సమీకరణం 2x² - 4x + 3 = 0 యొక్క విచక్షణి (D = b² - 4ac) ను కనుగొని మూలాల స్వభావాన్ని తెలపండి.",
    },
    options: [
      { id: "o1", value: "D = -8, No real roots", label: { en: "D = -8, No real roots", hi: "D = -8, कोई वास्तविक मूल नहीं", te: "D = -8, వాస్తవ మూలాలు లేవు" } },
      { id: "o2", value: "D = 8, Two distinct real roots", label: { en: "D = 8, Two distinct real roots", hi: "D = 8, दो भिन्न वास्तविक मूल", te: "D = 8, రెండు విభిన్న వాస్తవ మూలాలు" }, errorType: "sign_error_in_b_squared" },
      { id: "o3", value: "D = 0, Two equal real roots", label: { en: "D = 0, Two equal real roots", hi: "D = 0, दो बराबर वास्तविक मूल", te: "D = 0, రెండు సమాన వాస్తవ మూలాలు" }, errorType: "calculation_slip" },
      { id: "o4", value: "D = -40, No real roots", label: { en: "D = -40, No real roots", hi: "D = -40, कोई वास्तविक मूल नहीं", te: "D = -40, వాస్తవ మూలాలు లేవు" }, errorType: "arithmetic_error" },
    ],
    correctAnswer: "D = -8, No real roots",
    verifiedSolution: {
      en: "a = 2, b = -4, c = 3. Discriminant D = b² - 4ac = (-4)² - 4(2)(3) = 16 - 24 = -8. Since D < 0, the equation has no real roots.",
      hi: "a = 2, b = -4, c = 3। D = (-4)² - 4(2)(3) = 16 - 24 = -8। चूंकि D < 0 है, कोई वास्तविक मूल नहीं हैं।",
      te: "a = 2, b = -4, c = 3. విచక్షణి D = (-4)² - 4(2)(3) = 16 - 24 = -8. D < 0 కాబట్టి వాస్తవ మూలాలు ఉండవు.",
    },
    hint: {
      en: "Calculate D = b² - 4ac. If D < 0, there are no real roots.",
      hi: "D = b² - 4ac की गणना करें। यदि D < 0 है, तो कोई वास्तविक मूल नहीं होंगे।",
      te: "D = b² - 4ac లెక్కించండి. D < 0 అయితే వాస్తవ మూలాలు ఉండవు.",
    },
    provenanceLabel: "NCERT Class 10 Mathematics Chapter 4 (Quadratic Equations)",
  },
  {
    id: "mb_cbse_10_ap_01",
    sourceStyle: "cbse_reference",
    board: "CBSE",
    bookFamily: "Mathematics Class 10 (RD Sharma style)",
    class: 10,
    conceptIds: ["cbse-10-m05", "arithmetic_progressions"],
    difficulty: 2, // Application
    format: "mcq",
    prompt: {
      en: "An Arithmetic Progression has first term a = 7 and common difference d = 4. What is the 15th term (a₁₅) of this AP?",
      hi: "एक समांतर श्रेढ़ी (AP) का प्रथम पद a = 7 और सार्व अंतर d = 4 है। इस AP का 15वां पद (a₁₅) क्या होगा?",
      te: "ఒక అంక శ్రేఢి (AP) లో మొదటి పదం a = 7 మరియు సామాన్య భేదం d = 4. ఆ AP లో 15వ పదం (a₁₅) ఎంత?",
    },
    options: [
      { id: "o1", value: "63", label: { en: "63", hi: "63", te: "63" } },
      { id: "o2", value: "67", label: { en: "67", hi: "67", te: "67" }, errorType: "used_n_instead_of_n_minus_1" },
      { id: "o3", value: "59", label: { en: "59", hi: "59", te: "59" }, errorType: "subtracted_one_too_many" },
      { id: "o4", value: "60", label: { en: "60", hi: "60", te: "60" }, errorType: "forgot_first_term" },
    ],
    correctAnswer: "63",
    verifiedSolution: {
      en: "Formula: a_n = a + (n - 1)d. a₁₅ = 7 + (15 - 1) × 4 = 7 + 14 × 4 = 7 + 56 = 63.",
      hi: "सूत्र: a_n = a + (n - 1)d। a₁₅ = 7 + 14 × 4 = 7 + 56 = 63।",
      te: "సూత్రం: a_n = a + (n - 1)d. a₁₅ = 7 + (15 - 1) × 4 = 7 + 56 = 63.",
    },
    hint: {
      en: "Use a_n = a + (n - 1)d with a = 7, n = 15, and d = 4.",
      hi: "सूत्र a_n = a + (n - 1)d का प्रयोग करें जहाँ a = 7, n = 15, d = 4।",
      te: "a = 7, n = 15, d = 4 తో a_n = a + (n - 1)d సూత్రాన్ని ఉపయోగించండి.",
    },
    provenanceLabel: "NCERT Class 10 Mathematics Chapter 5 (Arithmetic Progressions)",
  },
  {
    id: "mb_icse_10_gst_01",
    sourceStyle: "icse_selina",
    board: "ICSE",
    bookFamily: "Concise Mathematics Class 10",
    class: 10,
    conceptIds: ["icse-10-m01", "real_numbers"],
    difficulty: 2, // Application (on-grade start for ICSE 10)
    format: "mcq",
    prompt: {
      en: "A dealer in Hyderabad sells a laptop to a consumer for ₹40,000. If the GST rate is 18% (intra-state transaction), find the total CGST and SGST paid by the consumer.",
      hi: "हैदराबाद का एक डीलर एक उपभोक्ता को ₹40,000 में एक लैपटॉप बेचता है। यदि जीएसटी दर 18% है (राज्य के भीतर लेन-देन), तो उपभोक्ता द्वारा भुगतान किया गया कुल CGST और SGST ज्ञात कीजिए।",
      te: "హైదరాబాద్‌లోని ఒక వ్యాపారి ఒక వినియోగదారునికి ల్యాప్‌టాప్‌ను ₹40,000 లకు అమ్మాడు. GST రేటు 18% (అంతర్-రాష్ట్ర లావాదేవీ) అయితే, వినియోగదారుడు చెల్లించిన మొత్తం CGST మరియు SGST ఎంత?",
    },
    options: [
      { id: "o1", value: "CGST = ₹3,600, SGST = ₹3,600", label: { en: "CGST = ₹3,600, SGST = ₹3,600", hi: "CGST = ₹3,600, SGST = ₹3,600", te: "CGST = ₹3,600, SGST = ₹3,600" } },
      { id: "o2", value: "CGST = ₹7,200, SGST = ₹7,200", label: { en: "CGST = ₹7,200, SGST = ₹7,200", hi: "CGST = ₹7,200, SGST = ₹7,200", te: "CGST = ₹7,200, SGST = ₹7,200" }, errorType: "applied_full_rate_to_both" },
      { id: "o3", value: "IGST = ₹7,200", label: { en: "IGST = ₹7,200", hi: "IGST = ₹7,200", te: "IGST = ₹7,200" }, errorType: "interstate_tax_confusion" },
      { id: "o4", value: "CGST = ₹1,800, SGST = ₹1,800", label: { en: "CGST = ₹1,800, SGST = ₹1,800", hi: "CGST = ₹1,800, SGST = ₹1,800", te: "CGST = ₹1,800, SGST = ₹1,800" }, errorType: "half_again_error" },
    ],
    correctAnswer: "CGST = ₹3,600, SGST = ₹3,600",
    verifiedSolution: {
      en: "For intra-state sale at 18% GST: CGST rate = 9%, SGST rate = 9%. CGST = 9% of 40,000 = ₹3,600. SGST = 9% of 40,000 = ₹3,600.",
      hi: "राज्य के भीतर 18% जीएसटी के लिए: CGST = 9%, SGST = 9%। CGST = ₹3,600, SGST = ₹3,600।",
      te: "రాష్ట్రం లోపల 18% GST కి: CGST = 9%, SGST = 9%. CGST = ₹3,600, SGST = ₹3,600.",
    },
    hint: {
      en: "Intra-state GST splits equally between Centre (CGST = 9%) and State (SGST = 9%).",
      hi: "राज्य के भीतर जीएसटी केंद्र (9%) और राज्य (9%) में बराबर बंटता है।",
      te: "రాష్ట్రం లోపల GST కేంద్రానికి (9%) మరియు రాష్ట్రానికి (9%) సమానంగా విభజించబడుతుంది.",
    },
    provenanceLabel: "CISCE Regulations & Syllabuses Class 10 (Commercial Mathematics: Goods and Services Tax)",
  },
  {
    id: "mb_cbse_10_trig_03",
    sourceStyle: "exemplar",
    board: "CBSE",
    bookFamily: "NCERT Exemplar Class 10",
    class: 10,
    conceptIds: ["cbse-10-m08", "trigonometry"],
    difficulty: 3, // Multi-step reasoning
    format: "mcq",
    prompt: {
      en: "If sin θ + cos θ = √2 cos θ, what is the value of cos θ - sin θ?",
      hi: "यदि sin θ + cos θ = √2 cos θ है, तो cos θ - sin θ का मान क्या होगा?",
      te: "sin θ + cos θ = √2 cos θ అయితే, cos θ - sin θ విలువ ఎంత?",
    },
    options: [
      { id: "o1", value: "sqrt(2) sin theta", label: { en: "√2 sin θ", hi: "√2 sin θ", te: "√2 sin θ" } },
      { id: "o2", value: "sqrt(2) cos theta", label: { en: "√2 cos θ", hi: "√2 cos θ", te: "√2 cos θ" }, errorType: "identity_confusion" },
      { id: "o3", value: "sin theta", label: { en: "sin θ", hi: "sin θ", te: "sin θ" }, errorType: "dropped_radical" },
      { id: "o4", value: "1", label: { en: "1", hi: "1", te: "1" }, errorType: "slip" },
    ],
    correctAnswer: "sqrt(2) sin theta",
    verifiedSolution: {
      en: "Given sin θ = (√2 - 1) cos θ. Multiply both sides by (√2 + 1): (√2 + 1) sin θ = cos θ. Thus cos θ - sin θ = √2 sin θ.",
      hi: "दिया है sin θ = (√2 - 1) cos θ। दोनों पक्षों को (√2 + 1) से गुणा करें: (√2 + 1) sin θ = cos θ। अतः cos θ - sin θ = √2 sin θ।",
      te: "sin θ = (√2 - 1) cos θ. ఇరువైపులా (√2 + 1) తో గుణించండి: (√2 + 1) sin θ = cos θ. కావున cos θ - sin θ = √2 sin θ.",
    },
    hint: {
      en: "Express sin θ in terms of cos θ and rationalise the factor (√2 - 1).",
      hi: "sin θ को cos θ के पदों में व्यक्त करें और (√2 - 1) का परिमेयकरण करें।",
      te: "sin θ ను cos θ పదాలలో రాసి (√2 - 1) ను అకరణీయం చేయండి.",
    },
    provenanceLabel: "NCERT Class 10 Mathematics Chapter 8 (Introduction to Trigonometry)",
  },
  {
    id: "mb_cbse_10_hots_04",
    sourceStyle: "cbse_reference",
    board: "CBSE",
    bookFamily: "CBSE Mathematics Class 10 (HOTS)",
    class: 10,
    conceptIds: ["cbse-10-m01", "real_numbers"],
    difficulty: 4, // Challenge (HOTS / Olympiad-lite)
    format: "mcq",
    prompt: {
      en: "According to the Fundamental Theorem of Arithmetic, if p is a prime number and p divides a² (where a is a positive integer), which statement is mathematically guaranteed to be true?",
      hi: "अंकगणित की आधारभूत प्रमेय के अनुसार, यदि p एक अभाज्य संख्या है और p, a² को विभाजित करती है (जहाँ a एक धनात्मक पूर्णांक है), तो कौन-सा कथन निश्चित रूप से सत्य है?",
      te: "అంకగణిత ప్రాథమిక సిద్ధాంతం ప్రకారం, p ఒక ప్రధాన సంఖ్య మరియు p అనేది a² ను భాగిస్తే (a ఒక ధన పూర్ణాంకం), ఈ క్రింది వాటిలో ఏది కచ్చితంగా నిజం?",
    },
    options: [
      { id: "o1", value: "p divides a", label: { en: "p divides a", hi: "p, a को विभाजित करता है", te: "p అనేది a ను భాగిస్తుంది" } },
      { id: "o2", value: "a divides p", label: { en: "a divides p", hi: "a, p को विभाजित करता है", te: "a అనేది p ని భాగిస్తుంది" }, errorType: "converse_fallacy" },
      { id: "o3", value: "p = a", label: { en: "p must equal a", hi: "p को a के बराबर होना चाहिए", te: "p కచ్చితంగా a కు సమానం కావాలి" }, errorType: "equality_assumption" },
      { id: "o4", value: "p divides sqrt(a)", label: { en: "p divides √a", hi: "p, √a को विभाजित करता है", te: "p అనేది √a ను భాగిస్తుంది" }, errorType: "square_root_fallacy" },
    ],
    correctAnswer: "p divides a",
    verifiedSolution: {
      en: "Theorem (NCERT 10.1.2): Let p be a prime number. If p divides a², then p divides a, where a is a positive integer. This is the foundational lemma used to prove irrationality of √2, √3, etc.",
      hi: "प्रमेय (NCERT): मान लीजिए p एक अभाज्य संख्या है। यदि p, a² को विभाजित करता है, तो p, a को भी विभाजित करेगा।",
      te: "సిద్ధాంతం (NCERT): p ప్రధాన సంఖ్య మరియు p అనేది a² ను భాగిస్తే, p అనేది a ను కూడా భాగిస్తుంది.",
    },
    hint: {
      en: "Recall the foundational lemma used to prove the irrationality of √2 and √5.",
      hi: "उस प्रमेय को याद करें जिसका उपयोग √2 और √5 की अपरिमेयता सिद्ध करने के लिए किया जाता है।",
      te: "√2 మరియు √5 కరణీయ సంఖ్యలని నిరూపించడానికి ఉపయోగించే సిద్ధాంతాన్ని గుర్తుచేసుకోండి.",
    },
    provenanceLabel: "NCERT Class 10 Mathematics Chapter 1 (Fundamental Theorem of Arithmetic)",
  },
];
