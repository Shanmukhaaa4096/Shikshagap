import type { RemediationPlan, DailyRemediationTask, Question } from '../types';

export class RemediationAgent {
  /**
   * Generates a 5-day personalized intervention plan for the student
   */
  public static generatePlan(
    studentId: string,
    studentName: string,
    targetConceptId: string,
    targetConceptName: string,
    rootConceptId: string,
    rootConceptName: string
  ): RemediationPlan {
    const isMultiplicationRoot = rootConceptId === 'multiplication_fluency';

    const days: DailyRemediationTask[] = isMultiplicationRoot
      ? [
          {
            day: 1,
            title: {
              en: 'Anchor Tables: Skip Counting & Arrays (×2, ×5, ×10)',
              hi: 'आधार पहाड़े: स्किप काउंटिंग और ग्रिड अभ्यास (×2, ×5, ×10)',
              te: 'ప్రాథమిక ఎక్కాలు: స్కిప్ కౌంటింగ్ & గ్రిడ్ సాధన (×2, ×5, ×10)',
            },
            durationMinutes: 15,
            objective: {
              en: 'Build automaticity in high-frequency baseline multiplication tables using visual groupings.',
              hi: 'दृश्य समूहों का उपयोग करके उच्च-आवृत्ति वाले बुनियादी पहाड़ों में गति और सटीकता विकसित करना।',
              te: 'దృశ్య సమూహాల ద్వారా 2, 5, 10 ఎక్కాలలో ప్రాథమిక వేగాన్ని పెంచడం.',
            },
            activityType: 'visual_grouping',
            description: {
              en: 'Use tamarind seeds or chalk dots on slate to group items in sets of 5 and 10. Chant 5, 10, 15, 20 rhythmically.',
              hi: 'इमली के बीज या स्लेट पर खड़िया की बिन्दियों से 5 और 10 के समूह बनाएं। लयबद्ध रूप से 5, 10, 15, 20 का अभ्यास करें।',
              te: 'చింతగింజలు లేదా బలపంతో 5 మరియు 10 సమూహాలుగా పేర్చి 5, 10, 15, 20 అంటూ లయబద్ధంగా సాధన చేయండి.',
            },
            sampleProblem: {
              en: '5 students have 2 chalk pieces each. How many chalk pieces in total? (5 × 2 = ?)',
              hi: '5 छात्रों के पास 2-2 चाक हैं। कुल कितने चाक हुए? (5 × 2 = ?)',
              te: '5 మంది విద్యార్థుల వద్ద ఒక్కొక్కరికి 2 సుద్దముక్కలు ఉన్నాయి. మొత్తం ఎన్ని? (5 × 2 = ?)',
            },
          },
          {
            day: 2,
            title: {
              en: 'The Tricky Multipliers (×3, ×4, and ×6 Tables)',
              hi: 'कठिन पहाड़े (3, 4 और 6 का पहाड़ा सुदृढ़ीकरण)',
              te: 'ముఖ్యమైన ఎక్కాలు (3, 4, 6 వ ఎక్కాల సాధన)',
            },
            durationMinutes: 15,
            objective: {
              en: 'Connect doubling strategies (double of 3 is 6) to master 6 times table facts.',
              hi: 'दुगना करने की रणनीति (3 का दुगना 6) से 6 के पहाड़े को आत्मसात करना।',
              te: 'రెట్టింపు వ్యూహం (3 కి రెట్టింపు 6) ద్వారా 6వ ఎక్కంపై పట్టు సాధించడం.',
            },
            activityType: 'drill_fluency',
            description: {
              en: 'Flashcard speed drill with peer partner: Student flashes cards for 6 × 3, 6 × 4, 6 × 5, 6 × 6 with immediate positive reinforcement.',
              hi: 'सहपाठी के साथ फ्लैशकार्ड ड्रिल: 6 × 3, 6 × 4, 6 × 5, 6 × 6 का त्वरित मौखिक अभ्यास।',
              te: 'తోటి విద్యార్థితో ఫ్లాష్ కార్డ్ సాధన: 6 × 3, 6 × 4, 6 × 5, 6 × 6 ప్రశ్నలకు తక్షణ సమాధాన సాధన.',
            },
            sampleProblem: {
              en: 'What is 6 × 6? Think: 6 groups of 6 equals 36.',
              hi: '6 × 6 कितना होगा? सोचें: 6 के 6 समूह बराबर 36।',
              te: '6 × 6 ఎంత? ఆలోచించండి: 6 యొక్క 6 సమూహాలు = 36.',
            },
          },
          {
            day: 3,
            title: {
              en: 'Connecting Multiplication directly to Division',
              hi: 'गुणा और भाग का आपसी संबंध जोड़ना',
              te: 'గుణకారం మరియు భాగహారం మధ్య సంబంధాన్ని అర్థం చేసుకోవడం',
            },
            durationMinutes: 15,
            objective: {
              en: 'Understand that division is the exact reverse of multiplication (Fact Triangles).',
              hi: 'समझना कि भाग वास्तव में गुणा का उल्टा रूप है (त्रिकोणीय तथ्य अभ्यास)।',
              te: 'భాగహారం అనేది గుణకారానికి వ్యతిరేక ప్రక్రియ అని గ్రహించడం (ఫ్యాక్ట్ ట్రయాంగిల్స్).',
            },
            activityType: 'hands_on',
            description: {
              en: 'Draw Fact Triangles: Top number 36, bottom numbers 6 and 6. Explain: "If 6 × 6 = 36, then 36 ÷ 6 must be 6."',
              hi: 'त्रिकोण चित्र बनाएं: शीर्ष पर 36, नीचे 6 और 6। समझाइए: यदि 6 × 6 = 36, तो 36 ÷ 6 = 6 होगा।',
              te: 'త్రిభుజ చిత్రం గీయండి: పైన 36, కింద 6 మరియు 6. "6 × 6 = 36 అయితే 36 ÷ 6 = 6" అని వివరించండి.',
            },
            sampleProblem: {
              en: 'Since 7 × 6 = 42, what is 42 ÷ 7?',
              hi: 'चूंकि 7 × 6 = 42, तो 42 ÷ 7 का मान क्या होगा?',
              te: '7 × 6 = 42 కాబట్టి, 42 ÷ 7 ఎంత అవుతుంది?',
            },
          },
          {
            day: 4,
            title: {
              en: 'Division Story Sharing & Real-World Contexts',
              hi: 'दैनिक जीवन के उदाहरण और वस्तुओं का बराबर वितरण',
              te: 'నిజ జీవిత పంపిణీ సమస్యలు & కథా రూప లెక్కలు',
            },
            durationMinutes: 15,
            objective: {
              en: 'Apply inverse multiplication to solve word problems with confidence.',
              hi: 'व्यावहारिक इबारती समस्याओं को हल करने में गुणा के ज्ञान का प्रयोग करना।',
              te: 'పద సమస్యలను సులభంగా పరిష్కరించడానికి గుణకార నైపుణ్యాన్ని ఉపయోగించడం.',
            },
            activityType: 'peer_work',
            description: {
              en: 'Solve story cards: Distribute 48 mangoes equally in 6 baskets. Verify: 6 × 8 = 48.',
              hi: 'कहानी कार्ड हल करें: 48 आमों को 6 टोकरियों में बराबर रखें। पुष्टि करें: 6 × 8 = 48।',
              te: '48 మామిడిపండ్లను 6 బుట్టలలో సమానంగా పంచండి. సరిచూడండి: 6 × 8 = 48.',
            },
            sampleProblem: {
              en: '48 divided among 6 children = 8 per child.',
              hi: '48 आम 6 बच्चों में = 8 प्रति बच्चा।',
              te: '48 ని 6 గురికి పంచితే = ప్రతి ఒక్కరికి 8.',
            },
          },
          {
            day: 5,
            title: {
              en: 'Mini Milestone Check & Reassessment Readiness',
              hi: 'लघु मूल्यांकन और आत्मविश्वास सुदृढ़ीकरण',
              te: 'లఘు పరీక్ష మరియు పునఃపరిశీలన సంసిద్ధత',
            },
            durationMinutes: 15,
            objective: {
              en: 'Measure retrieval fluency on 6 and 7 times tables and verify 80%+ division accuracy.',
              hi: '6 और 7 के पहाड़ों पर गति मापना और भाग में 80%+ सटीकता की पुष्टि करना।',
              te: '6, 7 ఎక్కాలలో వేగాన్ని కొలవడం మరియు భాగహారంలో 80%+ ఖచ్చితత్వాన్ని సాధించడం.',
            },
            activityType: 'mini_quiz',
            description: {
              en: '5 quick questions on multiplication recall + 5 quick division questions. Review any remaining hesitation.',
              hi: '5 त्वरित गुणा प्रश्न + 5 त्वरित भाग प्रश्न। किसी भी झिझक का समाधान करें।',
              te: '5 గుణకార ప్రశ్నలు + 5 భాగహార ప్రశ్నలతో లఘు పరీక్ష నిర్వహించండి.',
            },
            sampleProblem: {
              en: 'What is 56 ÷ 8? (Hint: 8 × ? = 56)',
              hi: '56 ÷ 8 कितना होगा? (संकेत: 8 × ? = 56)',
              te: '56 ÷ 8 ఎంత? (సూచన: 8 × ? = 56)',
            },
          },
        ]
      : [
          // General 5-day fallback for other prerequisite gaps
          {
            day: 1,
            title: { en: 'Foundation Exploration', hi: 'मूलभूत अन्वेषण', te: 'ప్రాథమిక పరిశీలన' },
            durationMinutes: 15,
            objective: { en: `Review core visual representation of ${rootConceptName}.`, hi: 'मूल अवधारणा को समझना।', te: 'మూల భావనను అర్థం చేసుకోవడం.' },
            activityType: 'visual_grouping',
            description: { en: 'Concrete manipulatives or drawings to visualize the concept.', hi: 'ठोस वस्तुओं से अवधारणा समझना।', te: 'వస్తువులతో సాధన చేయడం.' },
            sampleProblem: { en: 'Identify units and parts.', hi: 'भागों को पहचानें।', te: 'భాగాలను గుర్తించండి.' },
          },
          {
            day: 2,
            title: { en: 'Step-by-step Rule Practice', hi: 'चरणबद्ध अभ्यास', te: 'దశలవారీ సాధన' },
            durationMinutes: 15,
            objective: { en: 'Practice algorithm steps with guided assistance.', hi: 'मार्गदर्शन में अभ्यास।', te: 'ఉపాధ్యాయుల సహాయంతో సాధన.' },
            activityType: 'drill_fluency',
            description: { en: 'Solve 3 guided examples followed by 2 independent problems.', hi: 'निर्देशित उदाहरण हल करना।', te: 'ఉదాహరణలను సాధించడం.' },
            sampleProblem: { en: 'Standard problem step 1 to 3.', hi: 'मानक प्रश्न चरण।', te: 'ప్రామాణిక సమస్య.' },
          },
          {
            day: 3,
            title: { en: 'Connecting to Target Concept', hi: 'मुख्य अवधारणा से जोड़ना', te: 'ప్రధాన భావనతో అనుసంధానం' },
            durationMinutes: 15,
            objective: { en: `Bridge ${rootConceptName} directly to ${targetConceptName}.`, hi: 'दोनों अवधारणाओं में संबंध जोड़ना।', te: 'రెండు భావనల మధ్య సంబంధం.' },
            activityType: 'hands_on',
            description: { en: 'Show how prerequisite success unlocks the target task.', hi: 'दिखाएं कि पहली सफलता कैसे मुख्य प्रश्न हल करती है।', te: 'పూర్వ జ్ఞానం ప్రధాన సమస్యను ఎలా పరిష్కరిస్తుందో చూపండి.' },
            sampleProblem: { en: 'Combined multi-step check.', hi: 'संयुक्त प्रश्न।', te: 'కలిసిన సమస్య.' },
          },
          {
            day: 4,
            title: { en: 'Real-World Word Applications', hi: 'व्यावहारिक उपयोग', te: 'నిజ జీవిత సమస్యలు' },
            durationMinutes: 15,
            objective: { en: 'Translate simple everyday situations into mathematical expressions.', hi: 'दैनिक जीवन के प्रश्न।', te: 'రోజువారీ సమస్యలు.' },
            activityType: 'peer_work',
            description: { en: 'Solve partner cards with peer verification.', hi: 'सहपाठी के साथ अभ्यास।', te: 'స్నేహితుడితో సాధన.' },
            sampleProblem: { en: 'Community story distribution.', hi: 'कहानी आधारित प्रश्न।', te: 'కథా సమస్య.' },
          },
          {
            day: 5,
            title: { en: 'Progress Milestone & Review', hi: 'प्रगति समीक्षा', te: 'పురోగతి సమీక్ష' },
            durationMinutes: 15,
            objective: { en: 'Confirm mastery before official reassessment.', hi: 'पुनः मूल्यांकन से पहले पुष्टि।', te: 'పునఃపరీక్షకు సంసిద్ధత నిర్ధారణ.' },
            activityType: 'mini_quiz',
            description: { en: 'Self-check assessment and celebratory praise.', hi: 'आत्म-परीक्षण और प्रोत्साहन।', te: 'స్వీయ పరిశీలన మరియు అభినందన.' },
            sampleProblem: { en: 'Target concept verification problem.', hi: 'सत्यापन प्रश्न।', te: 'నిర్ధారణ ప్రశ్న.' },
          },
        ];

    return {
      id: `rem_plan_${studentId}_${Date.now()}`,
      studentId,
      studentName,
      conceptId: targetConceptId,
      conceptName: targetConceptName,
      rootCauseId: rootConceptId,
      rootCauseName: rootConceptName,
      durationDays: 5,
      estimatedDailyMinutes: 15,
      generatedDate: new Date().toISOString().split('T')[0],
      status: 'active',
      days,
      teacherNotes: `Focus primarily on ${rootConceptName} during the morning zero-hour or 15-minute remedial period. Do not scold for past division marks; celebrate small fact recalls to build confidence.`,
    };
  }

  /**
   * Generate targeted practice questions tailored for the identified gap
   */
  public static generateTargetedPracticeQuestions(rootConceptId: string): Question[] {
    if (rootConceptId === 'multiplication_fluency') {
      return [
        {
          id: 'prac_mult_01',
          conceptId: 'multiplication_fluency',
          difficulty: 1,
          questionType: 'mcq',
          text: {
            en: 'What is 6 × 6?',
            hi: '6 × 6 का मान क्या होगा?',
            te: '6 × 6 ఎంత?',
          },
          options: [
            { en: '30', hi: '30', te: '30' },
            { en: '32', hi: '32', te: '32' },
            { en: '36', hi: '36', te: '36' },
            { en: '42', hi: '42', te: '42' },
          ],
          correctAnswer: '36',
          explanation: {
            en: '6 groups of 6 equals 36. This is essential for 36 ÷ 6 = 6!',
            hi: '6 के 6 समूह 36 के बराबर होते हैं। यह 36 ÷ 6 = 6 के लिए आवश्यक है!',
            te: '6 యొక్క 6 సమూహాలు 36 కు సమానం. ఇది 36 ÷ 6 = 6 కోసం ముఖ్యం!',
          },
          visualHint: '••••••\n••••••\n••••••\n••••••\n••••••\n•••••• (6 rows of 6 = 36)',
        },
        {
          id: 'prac_mult_02',
          conceptId: 'multiplication_fluency',
          difficulty: 1,
          questionType: 'mcq',
          text: {
            en: 'Fill in the blank: 7 × ___ = 42',
            hi: 'रिक्त स्थान भरें: 7 × ___ = 42',
            te: 'ఖాళీని పూరించండి: 7 × ___ = 42',
          },
          options: [
            { en: '5', hi: '5', te: '5' },
            { en: '6', hi: '6', te: '6' },
            { en: '7', hi: '7', te: '7' },
            { en: '8', hi: '8', te: '8' },
          ],
          correctAnswer: '6',
          explanation: {
            en: '7 × 6 = 42. Therefore 42 ÷ 7 = 6!',
            hi: '7 × 6 = 42 होता है। अतः 42 ÷ 7 = 6!',
            te: '7 × 6 = 42. కాబట్టి 42 ÷ 7 = 6!',
          },
        },
        {
          id: 'prac_mult_03',
          conceptId: 'multiplication_fluency',
          difficulty: 1,
          questionType: 'mcq',
          text: {
            en: 'What is 8 × 6?',
            hi: '8 × 6 का मान क्या होगा?',
            te: '8 × 6 ఎంత?',
          },
          options: [
            { en: '42', hi: '42', te: '42' },
            { en: '46', hi: '46', te: '46' },
            { en: '48', hi: '48', te: '48' },
            { en: '54', hi: '54', te: '54' },
          ],
          correctAnswer: '48',
          explanation: {
            en: '8 × 6 = 48. Knowing this makes 48 ÷ 6 = 8 effortless.',
            hi: '8 × 6 = 48. इसे जानने से 48 ÷ 6 = 8 बहुत आसान हो जाता है।',
            te: '8 × 6 = 48. ఇది తెలిస్తే 48 ÷ 6 = 8 చేయడం చాలా సులభం.',
          },
        },
        {
          id: 'prac_mult_04',
          conceptId: 'division_concepts',
          difficulty: 2,
          questionType: 'word_problem',
          text: {
            en: 'Now try: 36 books are placed equally on 6 shelves. How many books on each shelf?',
            hi: 'अब प्रयास करें: 36 पुस्तकें 6 अलमारियों में बराबर रखी गई हैं। प्रत्येक अलमारी में कितनी पुस्तकें हैं?',
            te: 'ఇప్పుడు ప్రయత్నించండి: 36 పుస్తకాలను 6 అరలలో సమానంగా ఉంచారు. ప్రతి అరలో ఎన్ని పుస్తకాలు ఉన్నాయి?',
          },
          options: [
            { en: '5 books', hi: '5 पुस्तकें', te: '5 పుస్తకాలు' },
            { en: '6 books', hi: '6 पुस्तकें', te: '6 పుస్తకాలు' },
            { en: '7 books', hi: '7 पुस्तकें', te: '7 పుస్తకాలు' },
            { en: '8 books', hi: '8 पुस्तकें', te: '8 పుస్తకాలు' },
          ],
          correctAnswer: '6 books',
          explanation: {
            en: '36 ÷ 6 = 6 because 6 × 6 = 36. Great job!',
            hi: '36 ÷ 6 = 6 क्योंकि 6 × 6 = 36. शाबाश!',
            te: '36 ÷ 6 = 6 ఎందుకంటే 6 × 6 = 36. శభాష్!',
          },
        },
      ];
    }

    // Default questions
    return [
      {
        id: 'prac_gen_01',
        conceptId: rootConceptId,
        difficulty: 1,
        questionType: 'mcq',
        text: {
          en: 'Solve the foundational practice exercise.',
          hi: 'बुनियादी अभ्यास प्रश्न हल करें।',
          te: 'ప్రాథమిక సాధన ప్రశ్నను పరిష్కరించండి.',
        },
        options: [
          { en: 'Option A', hi: 'विकल्प A', te: 'ఎంపిక A' },
          { en: 'Option B', hi: 'विकल्प B', te: 'ఎంపిక B' },
        ],
        correctAnswer: 'Option A',
        explanation: {
          en: 'Good step forward!',
          hi: 'बहुत अच्छा कदम!',
          te: 'మంచి ముందడుగు!',
        },
      },
    ];
  }
}
