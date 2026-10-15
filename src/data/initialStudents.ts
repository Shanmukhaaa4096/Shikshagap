import type { Student, ConceptStatus } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  // 1. RAVI - Primary Demo Case (Division Symptom -> Multiplication Fluency Root Cause)
  {
    id: 'stud_ravi',
    rollNumber: 1,
    name: 'Ravi Kumar',
    grade: 5,
    section: 'A',
    attendanceRate: 88,
    overallMastery: 61,
    statusCategory: 'critical_gap',
    conceptMasteryMap: {
      num_sense: {
        conceptId: 'num_sense',
        conceptName: 'Number Sense',
        masteryScore: 95,
        status: 'mastered',
        questionsAttempted: 5,
        questionsCorrect: 5,
        confidenceScore: 92,
        evidenceCount: 5,
      },
      place_val: {
        conceptId: 'place_val',
        conceptName: 'Place Value',
        masteryScore: 85,
        status: 'mastered',
        questionsAttempted: 6,
        questionsCorrect: 5,
        confidenceScore: 88,
        evidenceCount: 6,
      },
      addition: {
        conceptId: 'addition',
        conceptName: 'Addition & Regrouping',
        masteryScore: 90,
        status: 'mastered',
        questionsAttempted: 6,
        questionsCorrect: 5,
        confidenceScore: 90,
        evidenceCount: 6,
      },
      subtraction: {
        conceptId: 'subtraction',
        conceptName: 'Subtraction with Regrouping',
        masteryScore: 82,
        status: 'mastered',
        questionsAttempted: 5,
        questionsCorrect: 4,
        confidenceScore: 84,
        evidenceCount: 5,
      },
      multiplication_fluency: {
        conceptId: 'multiplication_fluency',
        conceptName: 'Multiplication Facts & Fluency',
        masteryScore: 42,
        status: 'needs_support',
        questionsAttempted: 8,
        questionsCorrect: 3,
        confidenceScore: 87,
        evidenceCount: 8,
      },
      division_concepts: {
        conceptId: 'division_concepts',
        conceptName: 'Basic Division & Equal Sharing',
        masteryScore: 38,
        status: 'needs_support',
        questionsAttempted: 6,
        questionsCorrect: 2,
        confidenceScore: 85,
        evidenceCount: 6,
      },
      long_division: {
        conceptId: 'long_division',
        conceptName: 'Long Division Algorithm',
        masteryScore: 25,
        status: 'needs_support',
        questionsAttempted: 4,
        questionsCorrect: 1,
        confidenceScore: 78,
        evidenceCount: 4,
      },
      fractions_intro: {
        conceptId: 'fractions_intro',
        conceptName: 'Introduction to Fractions',
        masteryScore: 0,
        status: 'not_assessed',
        questionsAttempted: 0,
        questionsCorrect: 0,
        confidenceScore: 0,
        evidenceCount: 0,
      },
      equiv_fractions: {
        conceptId: 'equiv_fractions',
        conceptName: 'Equivalent Fractions',
        masteryScore: 0,
        status: 'not_assessed',
        questionsAttempted: 0,
        questionsCorrect: 0,
        confidenceScore: 0,
        evidenceCount: 0,
      },
    },
    activeDiagnosis: {
      targetConceptId: 'division_concepts',
      targetConceptName: 'Basic Division & Equal Sharing',
      symptomDescription: {
        en: 'Ravi cannot consistently solve single-digit division problems such as 36 ÷ 6 or 42 ÷ 7.',
        hi: 'रवि 36 ÷ 6 या 42 ÷ 7 जैसे एकल-अंकीय भाग के प्रश्नों को लगातार हल करने में कठिनाई महसूस कर रहा है।',
        te: 'రవి 36 ÷ 6 లేదా 42 ÷ 7 వంటి సింగిల్-డిజిట్ భాగహార సమస్యలను స్థిరంగా పరిష్కరించడంలో ఇబ్బంది పడుతున్నాడు.',
      },
      rootConceptId: 'multiplication_fluency',
      rootConceptName: 'Multiplication Facts & Fluency',
      rootCauseReasoning: {
        en: 'Ravi can subtract and regroup accurately, but struggles with rapid recall of multiplication tables (6, 7, 8). Because division requires inverse multiplication lookup, weak multiplication fluency directly causes division difficulty.',
        hi: 'रवि घटाव और पुनर्समूहन सही ढंग से कर लेता है, लेकिन गुणा के पहाड़े (6, 7, 8) तुरंत याद करने में संघर्ष करता है। चूंकि भाग में विपरीत गुणा का उपयोग होता है, इसलिए गुणा का कच्चा ज्ञान ही भाग में बाधा बन रहा है।',
        te: 'రవి తీసివేతలను సరిగ్గా చేయగలడు, కానీ 6, 7, 8 ఎక్కాలను వెంటనే గుర్తుకు తెచ్చుకోవడంలో తడబడుతున్నాడు. భాగహారానికి గుణకార ఎక్కాలు అవసరం కాబట్టి, గుణకార పట్టు లేకపోవడమే భాగహారంలో ఇబ్బందికి మూలకారణం.',
      },
      severity: 'high',
      confidencePercentage: 87,
      evidencePoints: [
        'Failed 36 ÷ 6 (selected 5 instead of 6)',
        'Failed prerequisite probe 6 × ? = 36 (selected 7)',
        'Failed 7 × 6 in fact recall (selected 36)',
        'Successfully passed place value 470 -> 70 and subtraction 42 - 36 = 6',
      ],
    },
    assessmentHistory: [
      {
        date: '2026-10-02',
        conceptId: 'division_concepts',
        score: 38,
        totalQuestions: 6,
      },
    ],
  },

  // 2. SITA - Fractions Symptom -> Equivalent Fractions Root Cause
  {
    id: 'stud_sita',
    rollNumber: 2,
    name: 'Sita Verma',
    grade: 5,
    section: 'A',
    attendanceRate: 92,
    overallMastery: 58,
    statusCategory: 'critical_gap',
    conceptMasteryMap: {
      num_sense: { conceptId: 'num_sense', conceptName: 'Number Sense', masteryScore: 92, status: 'mastered', questionsAttempted: 5, questionsCorrect: 5, confidenceScore: 90, evidenceCount: 5 },
      place_val: { conceptId: 'place_val', conceptName: 'Place Value', masteryScore: 88, status: 'mastered', questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 85, evidenceCount: 5 },
      addition: { conceptId: 'addition', conceptName: 'Addition & Regrouping', masteryScore: 85, status: 'mastered', questionsAttempted: 6, questionsCorrect: 5, confidenceScore: 85, evidenceCount: 6 },
      subtraction: { conceptId: 'subtraction', conceptName: 'Subtraction with Regrouping', masteryScore: 78, status: 'mastered', questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 80, evidenceCount: 5 },
      multiplication_fluency: { conceptId: 'multiplication_fluency', conceptName: 'Multiplication Facts & Fluency', masteryScore: 75, status: 'mastered', questionsAttempted: 6, questionsCorrect: 5, confidenceScore: 80, evidenceCount: 6 },
      division_concepts: { conceptId: 'division_concepts', conceptName: 'Basic Division & Equal Sharing', masteryScore: 70, status: 'developing', questionsAttempted: 5, questionsCorrect: 3, confidenceScore: 75, evidenceCount: 5 },
      fractions_intro: { conceptId: 'fractions_intro', conceptName: 'Introduction to Fractions', masteryScore: 65, status: 'developing', questionsAttempted: 5, questionsCorrect: 3, confidenceScore: 75, evidenceCount: 5 },
      equiv_fractions: { conceptId: 'equiv_fractions', conceptName: 'Equivalent Fractions', masteryScore: 35, status: 'needs_support', questionsAttempted: 6, questionsCorrect: 2, confidenceScore: 84, evidenceCount: 6 },
    },
    activeDiagnosis: {
      targetConceptId: 'equiv_fractions',
      targetConceptName: 'Equivalent Fractions',
      symptomDescription: {
        en: 'Sita struggles to identify equivalent representations such as 1/2 = 2/4.',
        hi: 'सीता 1/2 = 2/4 जैसे समतुल्य भिन्नों की पहचान करने में कठिनाई महसूस कर रही है।',
        te: 'సీత 1/2 = 2/4 వంటి సమాన భిన్నాలను గుర్తించడంలో ఇబ్బంది పడుతోంది.',
      },
      rootConceptId: 'fractions_intro',
      rootConceptName: 'Introduction to Fractions',
      rootCauseReasoning: {
        en: 'Evidence suggests Sita perceives numerator and denominator as separate whole numbers rather than a proportional relationship.',
        hi: 'साक्ष्यों से संकेत मिलता है कि सीता अंश और हर को आनुपातिक संबंध के बजाय अलग-अलग पूर्ण संख्या मानती है।',
        te: 'సీత లవం మరియు హారాలను ఒకే నిష్పత్తిగా కాకుండా వేర్వేరు సంఖ్యలుగా భావిస్తున్నట్లు ఆధారాలు తెలుపుతున్నాయి.',
      },
      severity: 'high',
      confidencePercentage: 84,
      evidencePoints: ['Failed 1/2 equivalence identification', 'Thinks 2/4 is larger than 1/2 purely because 2 > 1 and 4 > 2'],
    },
    assessmentHistory: [
      { date: '2026-10-03', conceptId: 'equiv_fractions', score: 35, totalQuestions: 6 },
    ],
  },

  // 3. RAHUL - Division Word Problems -> Reading Comprehension / Operation Identification
  {
    id: 'stud_rahul',
    rollNumber: 3,
    name: 'Rahul Sharma',
    grade: 5,
    section: 'A',
    attendanceRate: 85,
    overallMastery: 69,
    statusCategory: 'need_practice',
    conceptMasteryMap: {
      num_sense: { conceptId: 'num_sense', conceptName: 'Number Sense', masteryScore: 90, status: 'mastered', questionsAttempted: 5, questionsCorrect: 5, confidenceScore: 88, evidenceCount: 5 },
      place_val: { conceptId: 'place_val', conceptName: 'Place Value', masteryScore: 84, status: 'mastered', questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 82, evidenceCount: 5 },
      addition: { conceptId: 'addition', conceptName: 'Addition & Regrouping', masteryScore: 88, status: 'mastered', questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 85, evidenceCount: 5 },
      subtraction: { conceptId: 'subtraction', conceptName: 'Subtraction with Regrouping', masteryScore: 82, status: 'mastered', questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 80, evidenceCount: 5 },
      multiplication_fluency: { conceptId: 'multiplication_fluency', conceptName: 'Multiplication Facts & Fluency', masteryScore: 80, status: 'mastered', questionsAttempted: 6, questionsCorrect: 5, confidenceScore: 84, evidenceCount: 6 },
      division_concepts: { conceptId: 'division_concepts', conceptName: 'Basic Division & Equal Sharing', masteryScore: 78, status: 'mastered', questionsAttempted: 6, questionsCorrect: 5, confidenceScore: 82, evidenceCount: 6 },
      division_word_prob: { conceptId: 'division_word_prob', conceptName: 'Division Word Problems', masteryScore: 48, status: 'needs_support', questionsAttempted: 6, questionsCorrect: 3, confidenceScore: 80, evidenceCount: 6 },
    },
    activeDiagnosis: {
      targetConceptId: 'division_word_prob',
      targetConceptName: 'Division Word Problems',
      symptomDescription: {
        en: 'Rahul calculates pure numerical divisions accurately, but selects multiplication or addition in written word problems.',
        hi: 'राहुल सीधे भाग के प्रश्न सही हल करता है, लेकिन इबारती (शब्द) प्रश्नों में जोड़ने या गुणा करने का विकल्प चुन लेता है।',
        te: 'రాహుల్ సాధారణ సంఖ్యల భాగహారాన్ని సరిగ్గా చేస్తాడు, కానీ రాతపూర్వక సమస్యలలో గుణకారం లేదా కూడిక చేస్తాడు.',
      },
      rootConceptId: 'division_concepts',
      rootConceptName: 'Equal Sharing vs Totaling Concept',
      rootCauseReasoning: {
        en: 'Rahul understands division arithmetic, but struggles to identify key linguistic triggers ("shared equally", "divided among") in word statements.',
        hi: 'राहुल भाग की गणना जानता है, परंतु भाषा आधारित प्रश्नों में "समान रूप से बांटना" जैसे संकेतों की पहचान नहीं कर पाता।',
        te: 'రాహుల్ కు లెక్కలు చేయడం వచ్చు, కానీ పద సమస్యలలో "సమానంగా పంచుట" అనే అర్థాన్ని గ్రహించడంలో మార్గదర్శకత్వం అవసరం.',
      },
      severity: 'medium',
      confidencePercentage: 80,
      evidencePoints: ['Solved 48 ÷ 6 = 8 correctly in numbers', 'Multiplied 48 × 6 in word problem format'],
    },
    assessmentHistory: [{ date: '2026-10-04', conceptId: 'division_word_prob', score: 48, totalQuestions: 6 }],
  },

  // 4. ANANYA - On Track
  {
    id: 'stud_ananya',
    rollNumber: 4,
    name: 'Ananya Reddy',
    grade: 5,
    section: 'A',
    attendanceRate: 96,
    overallMastery: 88,
    statusCategory: 'on_track',
    conceptMasteryMap: {
      num_sense: { conceptId: 'num_sense', conceptName: 'Number Sense', masteryScore: 98, status: 'mastered', questionsAttempted: 5, questionsCorrect: 5, confidenceScore: 95, evidenceCount: 5 },
      place_val: { conceptId: 'place_val', conceptName: 'Place Value', masteryScore: 95, status: 'mastered', questionsAttempted: 5, questionsCorrect: 5, confidenceScore: 94, evidenceCount: 5 },
      addition: { conceptId: 'addition', conceptName: 'Addition & Regrouping', masteryScore: 92, status: 'mastered', questionsAttempted: 5, questionsCorrect: 5, confidenceScore: 92, evidenceCount: 5 },
      subtraction: { conceptId: 'subtraction', conceptName: 'Subtraction with Regrouping', masteryScore: 90, status: 'mastered', questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 90, evidenceCount: 5 },
      multiplication_fluency: { conceptId: 'multiplication_fluency', conceptName: 'Multiplication Facts & Fluency', masteryScore: 88, status: 'mastered', questionsAttempted: 6, questionsCorrect: 5, confidenceScore: 89, evidenceCount: 6 },
      division_concepts: { conceptId: 'division_concepts', conceptName: 'Basic Division & Equal Sharing', masteryScore: 85, status: 'mastered', questionsAttempted: 6, questionsCorrect: 5, confidenceScore: 88, evidenceCount: 6 },
      long_division: { conceptId: 'long_division', conceptName: 'Long Division Algorithm', masteryScore: 80, status: 'mastered', questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 82, evidenceCount: 5 },
    },
    assessmentHistory: [{ date: '2026-10-01', conceptId: 'division_concepts', score: 85, totalQuestions: 6 }],
  },

  // 5. MOHAMMED - On Track
  {
    id: 'stud_mohammed',
    rollNumber: 5,
    name: 'Mohammed Ali',
    grade: 5,
    section: 'A',
    attendanceRate: 94,
    overallMastery: 84,
    statusCategory: 'on_track',
    conceptMasteryMap: {
      num_sense: { conceptId: 'num_sense', conceptName: 'Number Sense', masteryScore: 95, status: 'mastered', questionsAttempted: 5, questionsCorrect: 5, confidenceScore: 92, evidenceCount: 5 },
      place_val: { conceptId: 'place_val', conceptName: 'Place Value', masteryScore: 90, status: 'mastered', questionsAttempted: 5, questionsCorrect: 5, confidenceScore: 90, evidenceCount: 5 },
      addition: { conceptId: 'addition', conceptName: 'Addition & Regrouping', masteryScore: 88, status: 'mastered', questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 86, evidenceCount: 5 },
      subtraction: { conceptId: 'subtraction', conceptName: 'Subtraction with Regrouping', masteryScore: 85, status: 'mastered', questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 85, evidenceCount: 5 },
      multiplication_fluency: { conceptId: 'multiplication_fluency', conceptName: 'Multiplication Facts & Fluency', masteryScore: 82, status: 'mastered', questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 84, evidenceCount: 5 },
      division_concepts: { conceptId: 'division_concepts', conceptName: 'Basic Division & Equal Sharing', masteryScore: 80, status: 'mastered', questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 82, evidenceCount: 5 },
    },
    assessmentHistory: [{ date: '2026-10-01', conceptId: 'division_concepts', score: 80, totalQuestions: 5 }],
  },

  // 6. LAKSHMI - Critical Gap in Subtraction Regrouping (Affecting Long Division)
  {
    id: 'stud_lakshmi',
    rollNumber: 6,
    name: 'Lakshmi Bai',
    grade: 5,
    section: 'A',
    attendanceRate: 82,
    overallMastery: 55,
    statusCategory: 'critical_gap',
    conceptMasteryMap: {
      num_sense: { conceptId: 'num_sense', conceptName: 'Number Sense', masteryScore: 90, status: 'mastered', questionsAttempted: 5, questionsCorrect: 5, confidenceScore: 88, evidenceCount: 5 },
      place_val: { conceptId: 'place_val', conceptName: 'Place Value', masteryScore: 78, status: 'mastered', questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 80, evidenceCount: 5 },
      addition: { conceptId: 'addition', conceptName: 'Addition & Regrouping', masteryScore: 80, status: 'mastered', questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 82, evidenceCount: 5 },
      subtraction: { conceptId: 'subtraction', conceptName: 'Subtraction with Regrouping', masteryScore: 40, status: 'needs_support', questionsAttempted: 6, questionsCorrect: 2, confidenceScore: 85, evidenceCount: 6 },
      multiplication_fluency: { conceptId: 'multiplication_fluency', conceptName: 'Multiplication Facts & Fluency', masteryScore: 72, status: 'developing', questionsAttempted: 5, questionsCorrect: 3, confidenceScore: 76, evidenceCount: 5 },
      long_division: { conceptId: 'long_division', conceptName: 'Long Division Algorithm', masteryScore: 32, status: 'needs_support', questionsAttempted: 5, questionsCorrect: 1, confidenceScore: 82, evidenceCount: 5 },
    },
    activeDiagnosis: {
      targetConceptId: 'long_division',
      targetConceptName: 'Long Division Algorithm',
      symptomDescription: {
        en: 'Lakshmi gets stuck during intermediate subtraction steps of multi-digit division.',
        hi: 'लक्ष्मी बहु-अंकीय भाग के दौरान बीच के घटाव वाले चरण में उलझ जाती है।',
        te: 'లక్ష్మి భాగహారంలో మధ్యలో వచ్చే తీసివేత దశలో తప్పులు చేస్తోంది.',
      },
      rootConceptId: 'subtraction',
      rootConceptName: 'Subtraction with Regrouping',
      rootCauseReasoning: {
        en: 'Lakshmi knows times tables up to 7, but subtracts smaller digits from larger digits without borrowing when doing division scratch work.',
        hi: 'लक्ष्मी 7 तक के पहाड़े जानती है, परंतु भाग के दौरान बिना उधार लिए छोटे अंक को बड़े अंक से घटा देती है।',
        te: 'లక్ష్మికి ఎక్కాలు వచ్చు, కానీ లెక్కించే క్రమంలో అప్పు తీసుకోకుండా తక్కువ సంఖ్య నుండి పెద్ద సంఖ్యను తీసివేస్తోంది.',
      },
      severity: 'high',
      confidencePercentage: 85,
      evidencePoints: ['Failed 42 - 36 (wrote 14)', 'Stuck on 84 ÷ 4 step 2'],
    },
    assessmentHistory: [{ date: '2026-10-04', conceptId: 'long_division', score: 32, totalQuestions: 5 }],
  },

  // 7-36: Generate remaining 30 students with realistic diversity to reach 36 students in Class 5A
  ...Array.from({ length: 30 }, (_, idx) => {
    const roll = idx + 7;
    const names = [
      'Priya Sharma', 'Arjun Das', 'Kavita Devi', 'Suresh Naidu', 'Deepa Patil',
      'Vikram Singh', 'Meera Rao', 'Aditya Joshi', 'Sunita Murthy', 'Kiran Patel',
      'Geeta Soren', 'Manoj Kumar', 'Pooja Hegde', 'Ramesh Yadav', 'Nisha Meena',
      'Ganesh Nayak', 'Shweta Kulkarni', 'Dinesh Gowda', 'Asha Begum', 'Manish Tiwari',
      'Chaya Deshmukh', 'Rajesh Sahoo', 'Vandana Sen', 'Pradeep Varma', 'Radha Mondal',
      'Santosh Roy', 'Farida Bano', 'Vijay Shankar', 'Kusum Lata', 'Karthik Pillai'
    ];
    const name = names[idx % names.length] + (idx >= names.length ? ` (${Math.floor(idx/names.length)+1})` : '');
    
    // Assign varying mastery profiles
    const categoryMod = idx % 5;
    const statusCategory: 'on_track' | 'need_practice' | 'critical_gap' = 
      categoryMod === 0 ? 'critical_gap' : 
      categoryMod === 1 || categoryMod === 2 ? 'need_practice' : 'on_track';

    const overallMastery = statusCategory === 'on_track' ? 82 + (idx % 12) :
                           statusCategory === 'need_practice' ? 62 + (idx % 10) :
                           44 + (idx % 8);

    const multScore = statusCategory === 'critical_gap' ? 40 + (idx % 10) : 
                      statusCategory === 'need_practice' ? 64 + (idx % 8) : 85 + (idx % 10);

    const divScore = statusCategory === 'critical_gap' ? 36 + (idx % 12) : 
                     statusCategory === 'need_practice' ? 60 + (idx % 10) : 82 + (idx % 12);

    return {
      id: `stud_gen_${roll}`,
      rollNumber: roll,
      name,
      grade: 5,
      section: 'A',
      attendanceRate: 78 + (idx % 20),
      overallMastery,
      statusCategory,
      conceptMasteryMap: {
        num_sense: { conceptId: 'num_sense', conceptName: 'Number Sense', masteryScore: 88 + (idx % 10), status: 'mastered' as const, questionsAttempted: 5, questionsCorrect: 5, confidenceScore: 88, evidenceCount: 5 },
        place_val: { conceptId: 'place_val', conceptName: 'Place Value', masteryScore: 82 + (idx % 12), status: 'mastered' as const, questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 84, evidenceCount: 5 },
        addition: { conceptId: 'addition', conceptName: 'Addition & Regrouping', masteryScore: 80 + (idx % 15), status: 'mastered' as const, questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 82, evidenceCount: 5 },
        subtraction: { conceptId: 'subtraction', conceptName: 'Subtraction with Regrouping', masteryScore: 75 + (idx % 18), status: 'mastered' as const, questionsAttempted: 5, questionsCorrect: 4, confidenceScore: 80, evidenceCount: 5 },
        multiplication_fluency: { 
          conceptId: 'multiplication_fluency', 
          conceptName: 'Multiplication Facts & Fluency', 
          masteryScore: multScore, 
          status: (multScore >= 75 ? 'mastered' : multScore >= 55 ? 'developing' : 'needs_support') as ConceptStatus, 
          questionsAttempted: 6, 
          questionsCorrect: Math.round((multScore / 100) * 6), 
          confidenceScore: 82, 
          evidenceCount: 6 
        },
        division_concepts: { 
          conceptId: 'division_concepts', 
          conceptName: 'Basic Division & Equal Sharing', 
          masteryScore: divScore, 
          status: (divScore >= 75 ? 'mastered' : divScore >= 55 ? 'developing' : 'needs_support') as ConceptStatus, 
          questionsAttempted: 6, 
          questionsCorrect: Math.round((divScore / 100) * 6), 
          confidenceScore: 80, 
          evidenceCount: 6 
        },
      },
      assessmentHistory: [
        { date: '2026-10-02', conceptId: 'division_concepts', score: divScore, totalQuestions: 6 }
      ]
    };
  })
];

export const DEMO_CLASSROOM_METADATA = {
  schoolName: 'PM SHRI Mandal Parishad Primary School',
  district: 'Ranga Reddy District, Telangana',
  academicYear: '2026 - 2027',
  grade: 5,
  section: 'A',
  subject: 'Mathematics (గణితం / गणित)',
};
