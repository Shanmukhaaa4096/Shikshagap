import type { StudentResponse, RootCauseDiagnosis, ConceptMastery, ConceptStatus } from '../types';
import { CONCEPTS_BY_ID } from '../data/conceptGraph';
import { QUESTION_MAP } from '../data/questionBank';

export interface DiagnosticResult {
  conceptMasteryUpdates: Record<string, ConceptMastery>;
  diagnosis?: RootCauseDiagnosis;
  overallMastery: number;
  confidenceScore: number;
  safeSummary: {
    en: string;
    hi: string;
    te: string;
  };
  recommendedNextStep: {
    en: string;
    hi: string;
    te: string;
  };
}

export class DiagnosticEngine {
  /**
   * Run the complete diagnosis pipeline on student responses
   */
  public static analyzeResponses(
    studentName: string,
    targetConceptId: string,
    responses: StudentResponse[],
    existingMasteryMap: Record<string, ConceptMastery> = {}
  ): DiagnosticResult {
    const conceptGroup: Record<string, { total: number; correct: number }> = {};
    const evidencePoints: string[] = [];

    // Group responses by concept
    responses.forEach((resp) => {
      if (!conceptGroup[resp.conceptId]) {
        conceptGroup[resp.conceptId] = { total: 0, correct: 0 };
      }
      conceptGroup[resp.conceptId].total += 1;
      if (resp.isCorrect) {
        conceptGroup[resp.conceptId].correct += 1;
      }

      const q = QUESTION_MAP[resp.questionId];
      const qText = q ? q.text.en : resp.questionId;
      if (resp.isCorrect) {
        evidencePoints.push(`Answered correctly: "${qText}"`);
      } else {
        evidencePoints.push(`Answered incorrectly: "${qText}" (Answered: ${resp.studentAnswer})`);
      }
    });

    // Compute updated mastery for each assessed concept
    const updatedMastery: Record<string, ConceptMastery> = { ...existingMasteryMap };

    Object.entries(conceptGroup).forEach(([cId, stats]) => {
      const existing = existingMasteryMap[cId];
      const prevTotal = existing ? existing.questionsAttempted : 0;
      const prevCorrect = existing ? existing.questionsCorrect : 0;

      const totalAttempted = prevTotal + stats.total;
      const totalCorrect = prevCorrect + stats.correct;

      // Score calculation
      const score = Math.round((totalCorrect / Math.max(1, totalAttempted)) * 100);

      let status: ConceptStatus = 'not_assessed';
      if (score >= 75) status = 'mastered';
      else if (score >= 50) status = 'developing';
      else status = 'needs_support';

      // Confidence score based on sample size & consistency
      const confidence = Math.min(95, 60 + totalAttempted * 5);

      const conceptObj = CONCEPTS_BY_ID[cId];
      updatedMastery[cId] = {
        conceptId: cId,
        conceptName: conceptObj ? conceptObj.name : cId,
        masteryScore: score,
        status,
        questionsAttempted: totalAttempted,
        questionsCorrect: totalCorrect,
        confidenceScore: confidence,
        evidenceCount: totalAttempted,
      };
    });

    // Calculate overall mastery across core concepts
    const coreKeys = Object.keys(updatedMastery).filter((k) => updatedMastery[k].questionsAttempted > 0);
    const overallScore = coreKeys.length > 0
      ? Math.round(coreKeys.reduce((acc, k) => acc + updatedMastery[k].masteryScore, 0) / coreKeys.length)
      : 50;

    // Root Cause Analysis:
    // Check if target concept had failures
    const targetStats = conceptGroup[targetConceptId] || { total: 0, correct: 0 };
    const multStats = conceptGroup['multiplication_fluency'] || { total: 0, correct: 0 };
    const pvStats = conceptGroup['place_val'] || { total: 0, correct: 0 };
    const subStats = conceptGroup['subtraction'] || { total: 0, correct: 0 };

    let diagnosis: RootCauseDiagnosis | undefined = undefined;

    const targetConcept = CONCEPTS_BY_ID[targetConceptId] || {
      id: targetConceptId,
      name: 'Division Concepts',
    };

    // Scenario A: Target failure caused by Multiplication Fluency
    if (targetStats.total > 0 && targetStats.correct / targetStats.total < 0.6 && multStats.total > 0 && multStats.correct / multStats.total < 0.6) {
      diagnosis = {
        targetConceptId,
        targetConceptName: targetConcept.name,
        symptomDescription: {
          en: `${studentName} struggles with division problems such as 36 ÷ 6 or 42 ÷ 7.`,
          hi: `${studentName} 36 ÷ 6 या 42 ÷ 7 जैसे भाग के प्रश्नों को हल करने में कठिनाई महसूस कर रहे हैं।`,
          te: `${studentName} 36 ÷ 6 లేదా 42 ÷ 7 వంటి భాగహార సమస్యలను పరిష్కరించడంలో ఇబ్బంది పడుతున్నారు.`,
        },
        rootConceptId: 'multiplication_fluency',
        rootConceptName: 'Multiplication Facts & Fluency',
        rootCauseReasoning: {
          en: `${studentName} understands subtraction and basic regrouping, but shows slow or inconsistent recall of multiplication tables (6, 7, 8). Because division relies on inverse multiplication, multiplication fluency is the root barrier.`,
          hi: `${studentName} घटाव और पुनर्समूहन सही करते हैं, परंतु गुणा के पहाड़े (6, 7, 8) तुरंत याद करने में संघर्ष कर रहे हैं। भाग की प्रक्रिया गुणा पर निर्भर होने के कारण, गुणा का अधूरा ज्ञान ही मुख्य बाधा है।`,
          te: `${studentName} తీసివేతలను సరిగ్గా చేయగలరు, కానీ 6, 7, 8 ఎక్కాలను వెంటనే గుర్తుకు తెచ్చుకోవడంలో తడబడుతున్నారు. భాగహారం గుణకారంపై ఆధారపడి ఉంటుంది కాబట్టి, గుణకార పట్టు లేకపోవడమే మూలకారణం.`,
        },
        severity: 'high',
        confidencePercentage: 87,
        evidencePoints: [
          `Target concept score: ${Math.round((targetStats.correct / targetStats.total) * 100)}% (${targetStats.correct}/${targetStats.total})`,
          `Prerequisite multiplication score: ${Math.round((multStats.correct / multStats.total) * 100)}% (${multStats.correct}/${multStats.total})`,
          ...evidencePoints.slice(-3),
        ],
      };
    }
    // Scenario B: Target failure caused by Subtraction Regrouping (e.g. for long division)
    else if (targetStats.total > 0 && targetStats.correct / targetStats.total < 0.6 && subStats.total > 0 && subStats.correct / subStats.total < 0.6) {
      diagnosis = {
        targetConceptId,
        targetConceptName: targetConcept.name,
        symptomDescription: {
          en: `${studentName} encounters errors during multi-step division calculations.`,
          hi: `${studentName} बहु-चरणीय भाग की गणना में गलतियां कर रहे हैं।`,
          te: `${studentName} భాగహార గణనలలో తప్పులు చేస్తున్నారు.`,
        },
        rootConceptId: 'subtraction',
        rootConceptName: 'Subtraction with Regrouping',
        rootCauseReasoning: {
          en: `Evidence indicates ${studentName} can recall multiplication facts, but makes borrowing errors during intermediate division subtraction steps.`,
          hi: `साक्ष्य दर्शाते हैं कि ${studentName} गुणा जानते हैं, लेकिन भाग के बीच में घटाव के समय उधार लेने में गलती कर देते हैं।`,
          te: `సాక్ష్యాల ప్రకారం ${studentName} కు గుణకారం వచ్చు, కానీ భాగహారం మధ్యలో తీసివేత చేసేటప్పుడు అప్పు తీసుకోవడంలో తప్పులు చేస్తున్నారు.`,
        },
        severity: 'high',
        confidencePercentage: 84,
        evidencePoints: [
          `Multiplication recalled accurately`,
          `Prerequisite subtraction score: ${Math.round((subStats.correct / subStats.total) * 100)}%`,
          ...evidencePoints.slice(-2),
        ],
      };
    }
    // Scenario C: Target failure caused by Place Value
    else if (targetStats.total > 0 && targetStats.correct / targetStats.total < 0.6 && pvStats.total > 0 && pvStats.correct / pvStats.total < 0.6) {
      diagnosis = {
        targetConceptId,
        targetConceptName: targetConcept.name,
        symptomDescription: {
          en: `${studentName} has difficulty aligning digits in quotients and remainders.`,
          hi: `${studentName} भागफल और शेषफल में अंकों के स्थान निर्धारण में भ्रमित हो रहे हैं।`,
          te: `${studentName} భాగఫలంలో స్థానాలను గుర్తించడంలో ఇబ్బంది పడుతున్నారు.`,
        },
        rootConceptId: 'place_val',
        rootConceptName: 'Place Value',
        rootCauseReasoning: {
          en: `Understanding of Tens vs Units representation is underdeveloped, affecting digit placement during division.`,
          hi: `दहाई और इकाई के स्थानीय मान की समझ अधूरी है, जिससे भागफल में अंक लिखने में त्रुटि हो रही है।`,
          te: `పదులు మరియు ఒకట్ల స్థానాల విలువపై పూర్తి అవగాహన లేకపోవడం వల్ల భాగహారంలో తప్పులు జరుగుతున్నాయి.`,
        },
        severity: 'medium',
        confidencePercentage: 80,
        evidencePoints: evidencePoints.slice(-3),
      };
    }

    // AI Safety Phrasing Generator
    const safeSummary = {
      en: diagnosis
        ? `Current assessment evidence indicates ${studentName} would benefit from targeted support in ${diagnosis.rootConceptName}, which is currently impacting performance in ${diagnosis.targetConceptName}.`
        : `Assessment evidence suggests ${studentName} is making steady progress across foundational concepts.`,
      hi: diagnosis
        ? `वर्तमान मूल्यांकन साक्ष्य दर्शाते हैं कि ${studentName} को '${diagnosis.rootConceptName}' में लक्षित सहयोग की आवश्यकता है, जिससे '${diagnosis.targetConceptName}' में भी सुधार होगा।`
        : `मूल्यांकन साक्ष्य बताते हैं कि ${studentName} बुनियादी अवधारणाओं में निरंतर प्रगति कर रहे हैं।`,
      te: diagnosis
        ? `ప్రస్తుత మూల్యాంకన ఆధారాల ప్రకారం ${studentName} కు '${diagnosis.rootConceptName}' లో అదనపు మార్గదర్శకత్వం అవసరం, ఇది '${diagnosis.targetConceptName}' పై ప్రభావం చూపుతోంది.`
        : `మూల్యాంకన ఆధారాలు ${studentName} ప్రాథమిక భావనలలో నిలకడైన పురోగతిని సాధిస్తున్నట్లు సూచిస్తున్నాయి.`,
    };

    const recommendedNextStep = {
      en: diagnosis
        ? `Strengthen ${diagnosis.rootConceptName} through daily 15-minute structured practice before re-assessing ${diagnosis.targetConceptName}.`
        : `Continue regular grade-level practice and reinforce word problems.`,
      hi: diagnosis
        ? `${diagnosis.targetConceptName} का पुनः परीक्षण करने से पहले 15 मिनट दैनिक अभ्यास के माध्यम से '${diagnosis.rootConceptName}' को सुदृढ़ करें।`
        : `नियमित कक्षा-स्तरीय अभ्यास जारी रखें और इबारती प्रश्नों को प्रोत्साहित करें।`,
      te: diagnosis
        ? `${diagnosis.targetConceptName} ను మళ్లీ పరీక్షించే ముందు రోజుకు 15 నిమిషాల సాధనతో '${diagnosis.rootConceptName}' పై పట్టు సాధించండి.`
        : `సాధారణ తరగతి స్థాయి సాధనను కొనసాగించండి.`,
    };

    return {
      conceptMasteryUpdates: updatedMastery,
      diagnosis,
      overallMastery: overallScore,
      confidenceScore: diagnosis ? diagnosis.confidencePercentage : 85,
      safeSummary,
      recommendedNextStep,
    };
  }
}
