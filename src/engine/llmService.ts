import type { StudentResponse, RootCauseDiagnosis } from '../types';

export interface LLMAnalysisRequest {
  studentName: string;
  grade: number;
  subject: string;
  targetConcept: string;
  responses: StudentResponse[];
  deterministicDiagnosis: RootCauseDiagnosis;
}

export interface LLMEnhancedSummary {
  teacherSummary: string;
  parentNote: string;
  remediationTip: string;
  isLLMPowered: boolean;
}

export class LLMService {
  private static getApiKey(): string | null {
    // Check Vite environment variable or local storage
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (envKey && envKey.trim() !== '') return envKey.trim();

    const storedKey = localStorage.getItem('shiksha_gemini_api_key');
    if (storedKey && storedKey.trim() !== '') return storedKey.trim();

    return null;
  }

  /**
   * Generates a pedagogical summary using Gemini API when available,
   * falling back to local deterministic pedagogical engine when offline.
   */
  public static async generatePedagogicalInsights(
    request: LLMAnalysisRequest,
    language: 'en' | 'hi' | 'te' = 'en'
  ): Promise<LLMEnhancedSummary> {
    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const prompt = `You are ShikshaGap AI, an expert pedagogical diagnostic assistant for Indian government schools.
Context:
Student Name: ${request.studentName} (Class ${request.grade})
Subject: ${request.subject}
Assessed Topic: ${request.targetConcept}
Observed Symptom: ${request.deterministicDiagnosis.symptomDescription.en}
Diagnosed Root Cause: ${request.deterministicDiagnosis.rootConceptName}
Diagnosis Reasoning: ${request.deterministicDiagnosis.rootCauseReasoning.en}
Evidence Count: ${request.deterministicDiagnosis.evidencePoints.length} items

Safety Rules:
1. Never label the student as "weak", "poor", or make permanent capability statements.
2. Ground all reasoning in observed assessment evidence.
3. Keep language simple, encouraging, and actionable for a busy government school teacher.
4. Output response in ${language === 'hi' ? 'Hindi' : language === 'te' ? 'Telugu' : 'English'}.

Respond in JSON format with exactly these three keys:
{
  "teacherSummary": "1-2 concise actionable sentences for the teacher",
  "parentNote": "1 encouraging sentence in simple language for parents in the diary",
  "remediationTip": "1 practical low-cost classroom activity tip using slates/seeds/counters"
}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const parsed = JSON.parse(candidateText);
            return {
              teacherSummary: parsed.teacherSummary || '',
              parentNote: parsed.parentNote || '',
              remediationTip: parsed.remediationTip || '',
              isLLMPowered: true,
            };
          }
        }
      } catch (err) {
        console.warn('Gemini API call failed or timed out, using local agent fallback:', err);
      }
    }

    // High quality local deterministic pedagogical agent fallback
    return this.getLocalPedagogicalFallback(request, language);
  }

  private static getLocalPedagogicalFallback(
    request: LLMAnalysisRequest,
    lang: 'en' | 'hi' | 'te'
  ): LLMEnhancedSummary {
    const name = request.studentName;
    const root = request.deterministicDiagnosis.rootConceptName;
    const target = request.deterministicDiagnosis.targetConceptName;

    if (lang === 'hi') {
      return {
        teacherSummary: `मूल्यांकन साक्ष्य से स्पष्ट है कि ${name} की ${target} में कठिनाई का मुख्य कारण ${root} की कमी है। 15 मिनट की दैनिक तालिका ड्रिल से शीघ्र सुधार संभव है।`,
        parentNote: `${name} गणित में उत्साह से सीख रहे हैं। घर पर 6, 7 और 8 के पहाड़े दोहराने में उनका सहयोग करें।`,
        remediationTip: 'कक्षा में स्लेट पर इमली के बीजों से 6-6 के समूह बनाकर मौखिक अभ्यास कराएं।',
        isLLMPowered: false,
      };
    }

    if (lang === 'te') {
      return {
        teacherSummary: `${name} కు ${target} లో ఎదురవుతున్న ఇబ్బందికి ${root} పై పట్టు లేకపోవడమే మూలకారణమని మూల్యాంకనం ధ్రువీకరిస్తోంది. రోజుకు 15 నిమిషాల సాధనతో సులభంగా పురోగతి సాధించవచ్చు.`,
        parentNote: `${name} ఉత్సాహంగా నేర్చుకుంటున్నారు. ఇంట్లో 6, 7 ఎక్కాలను పునశ్చరణ చేయించడంలో ప్రోత్సహించండి.`,
        remediationTip: 'చింతగింజలు లేదా రాళ్లతో 6 సమూహాలుగా చేసి సరదాగా ఎక్కాలు పాడించండి.',
        isLLMPowered: false,
      };
    }

    return {
      teacherSummary: `Assessment evidence confirms that ${name}'s difficulty in ${target} is primarily driven by missing fluency in ${root}. A 15-min daily targeted drill will unlock division competence.`,
      parentNote: `${name} is showing enthusiastic participation. Practicing the 6, 7, and 8 times tables together at home will give great confidence!`,
      remediationTip: 'Use physical bottle caps or tamarind seeds in groups of 6 on slates for tactile array multiplication.',
      isLLMPowered: false,
    };
  }
}
