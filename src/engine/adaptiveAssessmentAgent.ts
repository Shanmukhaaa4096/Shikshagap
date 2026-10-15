import type { Question, StudentResponse } from '../types';
import { QUESTION_BANK } from '../data/questionBank';
import { getPrerequisites } from '../data/conceptGraph';

export interface NextQuestionDecision {
  nextQuestion: Question | null;
  isAssessmentComplete: boolean;
  reasoning: {
    en: string;
    hi: string;
    te: string;
  };
  currentHypothesis?: string;
  evidenceConfidence: number; // 0 - 100
}

/**
 * Adaptive Assessment Agent
 * Selects the optimal diagnostic question using Concept Graph prerequisite backtracking.
 */
export class AdaptiveAssessmentAgent {
  /**
   * Determine the next question to ask based on response history
   */
  public static selectNextQuestion(
    targetConceptId: string,
    responses: StudentResponse[],
    maxQuestions: number = 8
  ): NextQuestionDecision {
    const answeredQuestionIds = new Set(responses.map((r) => r.questionId));

    // Calculate baseline responses
    const targetResponses = responses.filter((r) => r.conceptId === targetConceptId);
    const targetWrongCount = targetResponses.filter((r) => !r.isCorrect).length;

    // Prerequisite concepts for the target
    const prereqs = getPrerequisites(targetConceptId);
    const primaryPrereq = prereqs.find((p) => p.id === 'multiplication_fluency') || prereqs[0];

    // CASE 1: Beginning of assessment -> Ask target concept question
    if (responses.length === 0) {
      const q1 = QUESTION_BANK.find((q) => q.id === 'div_01');
      return {
        nextQuestion: q1 || QUESTION_BANK[0],
        isAssessmentComplete: false,
        reasoning: {
          en: 'Starting with a standard grade-level division problem (36 ÷ 6) to establish baseline understanding.',
          hi: 'आधारभूत समझ स्थापित करने के लिए मानक कक्षा-स्तरीय भाग के प्रश्न (36 ÷ 6) से शुरुआत की जा रही है।',
          te: 'ప్రాథమిక స్థాయి అవగాహనను అంచనా వేయడానికి ప్రామాణిక 5వ తరగతి భాగహార సమస్య (36 ÷ 6) తో ప్రారంభిస్తున్నాము.',
        },
        evidenceConfidence: 20,
      };
    }

    const lastResponse = responses[responses.length - 1];

    // CASE 2: Student failed target concept question -> Backtrack into prerequisite concept
    if (!lastResponse.isCorrect && lastResponse.conceptId === targetConceptId && primaryPrereq) {
      // Find a prerequisite probe question
      const prereqQuestion = QUESTION_BANK.find(
        (q) =>
          q.conceptId === primaryPrereq.id &&
          !answeredQuestionIds.has(q.id) &&
          (q.isPrerequisiteProbe || q.difficulty === 1)
      );

      if (prereqQuestion) {
        return {
          nextQuestion: prereqQuestion,
          isAssessmentComplete: false,
          reasoning: {
            en: `Student had difficulty with ${lastResponse.questionId.startsWith('div') ? 'division' : 'the problem'}. Investigating prerequisite concept: ${primaryPrereq.name} to check if inverse fact retrieval is the root barrier.`,
            hi: `छात्र को भाग के प्रश्न में कठिनाई हुई। मूल कारण जानने के लिए पूर्वापेक्षित अवधारणा '${primaryPrereq.name}' की जांच की जा रही है।`,
            te: `విద్యార్థి భాగహారంలో తప్పు చేశారు. గుణకార ఎక్కాల జ్ఞానమే మూలకారణమా అని నిర్ధారించడానికి పూర్వ భావన '${primaryPrereq.name}' ను పరీక్షిస్తున్నాము.`,
          },
          currentHypothesis: `Prerequisite weakness in ${primaryPrereq.name}`,
          evidenceConfidence: 55,
        };
      }
    }

    // CASE 3: Student failed prerequisite question -> Deepen probe into foundational recall
    if (!lastResponse.isCorrect && lastResponse.conceptId === 'multiplication_fluency') {
      const deepPrereqQuestion = QUESTION_BANK.find(
        (q) =>
          q.conceptId === 'multiplication_fluency' &&
          !answeredQuestionIds.has(q.id) &&
          (q.id === 'mult_prereq_02' || q.id === 'mult_prereq_03')
      );

      if (deepPrereqQuestion) {
        return {
          nextQuestion: deepPrereqQuestion,
          isAssessmentComplete: false,
          reasoning: {
            en: 'Student struggled with inverse multiplication (6 × ? = 36). Now testing direct multiplication fact fluency (7 × 6 or 6 × 5) to isolate the gap.',
            hi: 'छात्र को 6 × ? = 36 में कठिनाई हुई। अब सीधे गुणा के तथ्य (7 × 6 या 6 × 5) की जांच कर रहे हैं ताकि कमी की सटीक पहचान हो सके।',
            te: 'విద్యార్థి 6 × ? = 36 కి సరైన సమాధానం ఇవ్వలేదు. ఇప్పుడు నేరుగా గుణకార పట్టిక నైపుణ్యాన్ని (7 × 6 లేదా 6 × 5) పరిశీలిస్తున్నాము.',
          },
          currentHypothesis: 'Multiplication table fluency is the root barrier',
          evidenceConfidence: 75,
        };
      }
    }

    // CASE 4: Student answered prerequisite correctly -> Check another dimension (Place Value or Subtraction)
    if (lastResponse.isCorrect && lastResponse.conceptId === 'multiplication_fluency') {
      const pvQuestion = QUESTION_BANK.find(
        (q) => q.conceptId === 'place_val' && !answeredQuestionIds.has(q.id)
      );

      if (pvQuestion) {
        return {
          nextQuestion: pvQuestion,
          isAssessmentComplete: false,
          reasoning: {
            en: 'Multiplication fact confirmed. Now validating Place Value understanding to see if regrouping/positional understanding affects multi-step division.',
            hi: 'गुणा का ज्ञान सही पाया गया। अब स्थानीय मान (Place Value) की जांच की जा रही है ताकि भाग के चरणों में स्पष्टता देखी जा सके।',
            te: 'గుణకారం సరిగ్గా ఉంది. స్థాన విలువ (Place Value) అవగాహనను పరిశీలిస్తున్నాము.',
          },
          currentHypothesis: 'Verifying Place Value foundation',
          evidenceConfidence: 70,
        };
      }
    }

    // CASE 5: Check if stopping criterion is satisfied
    // 3 or more responses with consistent pattern, or max questions reached
    if (responses.length >= 4) {
      const multResponses = responses.filter((r) => r.conceptId === 'multiplication_fluency');
      const multFails = multResponses.filter((r) => !r.isCorrect).length;

      if (targetWrongCount >= 1 && multFails >= 2) {
        // High confidence root cause reached!
        return {
          nextQuestion: null,
          isAssessmentComplete: true,
          reasoning: {
            en: 'Diagnostic threshold reached: Sufficient consistent evidence gathered showing division difficulties stem directly from multiplication fact fluency.',
            hi: 'निदान सीमा पूरी हुई: पर्याप्त और सुसंगत साक्ष्य प्राप्त हुए कि भाग में कठिनाई का सीधा संबंध गुणा के पहाड़े याद न होने से है।',
            te: 'తగినంత సాక్ష్యాధారాలు లభించాయి: భాగహారంలో ఇబ్బందికి గుణకార ఎక్కాల బలహీనతే కారణమని స్పష్టమైంది.',
          },
          currentHypothesis: 'Multiplication Fluency Root Cause Confirmed',
          evidenceConfidence: 87,
        };
      }
    }

    if (responses.length >= maxQuestions) {
      return {
        nextQuestion: null,
        isAssessmentComplete: true,
        reasoning: {
          en: 'Assessment completed maximum diagnostic question limit.',
          hi: 'मूल्यांकन ने अधिकतम नैदानिक प्रश्न सीमा पूरी कर ली है।',
          te: 'అంచనా గరిష్ట ప్రశ్నల పరిమితిని పూర్తి చేసుకుంది.',
        },
        evidenceConfidence: 85,
      };
    }

    // Default fallback: Pick next available question
    const availableQuestion = QUESTION_BANK.find((q) => !answeredQuestionIds.has(q.id));
    if (!availableQuestion) {
      return {
        nextQuestion: null,
        isAssessmentComplete: true,
        reasoning: {
          en: 'All available diagnostic items answered.',
          hi: 'सभी उपलब्ध नैदानिक प्रश्नों के उत्तर प्राप्त हो चुके हैं।',
          te: 'అందుబాటులో ఉన్న అన్ని ప్రశ్నలు పూర్తయ్యాయి.',
        },
        evidenceConfidence: 82,
      };
    }

    return {
      nextQuestion: availableQuestion,
      isAssessmentComplete: false,
      reasoning: {
        en: `Administering follow-up question for ${availableQuestion.conceptId}.`,
        hi: `अवधारणा के लिए अगला प्रश्न प्रस्तुत किया जा रहा है।`,
        te: `తదుపరి ప్రశ్నను పరిశీలిస్తున్నాము.`,
      },
      evidenceConfidence: 60,
    };
  }
}
