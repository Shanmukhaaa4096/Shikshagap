/**
 * src/lib/agents/reportWriter.ts
 *
 * Report Writer agent per SPEC.md:
 * - Runs after the Resource Advisor.
 * - Input: Final SessionMemory + Verified ResourceRecommendations.
 * - Output: A short, grounded summary in English (en), Hindi (hi), or Telugu (te)
 *   for the teacher or parent.
 * - INVARIANT: Must NOT add facts or claims that are not present in the input memory/recs.
 * - Fallback: A deterministic fixed template filled directly from the input data.
 */

import type { ResourceRecommendation, SessionMemory } from "../types.ts";

export interface ReportWriterInput {
  memory: SessionMemory;
  recommendations: ResourceRecommendation[];
}

export interface ReportWriterOptions {
  client?: any; // GoogleGenAI client instance or mock
  modelName?: string;
}

export interface ReportWriterOutput {
  summary: string;
  source: "gemini" | "fallback";
}

const TOPIC_NAMES: Record<string, { en: string; hi: string; te: string }> = {
  number_ops: { en: "Number Operations", hi: "संख्या संक्रियाएं", te: "సంఖ్యా భావనలు మరియు సంకలనం" },
  multiplication: { en: "Multiplication", hi: "गुणा", te: "గుణకారం" },
  division: { en: "Division", hi: "भाग", te: "భాగహారం" },
  fractions: { en: "Fractions", hi: "भिन्न", te: "భిన్నాలు" },
};

/**
 * Deterministic template summary generator (zero hallucination risk).
 * Grounded strictly in the input counts, statuses, and recommended resource count.
 */
export function generateFallbackSummary(
  memory: SessionMemory,
  recommendations: ResourceRecommendation[]
): string {
  const lang = memory.language || "en";
  const grade = memory.grade;

  const gapTopics = memory.topics.filter((t) => t.status === "gap");
  const devTopics = memory.topics.filter((t) => t.status === "developing");
  const masteredTopics = memory.topics.filter((t) => t.status === "mastered");

  const totalRecs = recommendations.reduce((acc, r) => acc + r.resources.length, 0);

  const getTopicTitle = (tId: string): string => {
    return TOPIC_NAMES[tId]?.[lang as "en" | "hi" | "te"] || TOPIC_NAMES[tId]?.en || tId;
  };

  if (lang === "hi") {
    const parts: string[] = [];
    parts.push(`कक्षा ${grade} के गणित मूल्यांकन में ${memory.topics.length} विषयों की जांच की गई।`);

    if (masteredTopics.length > 0) {
      const names = masteredTopics.map((t) => getTopicTitle(t.topicId)).join(", ");
      parts.push(`छात्र ने ${names} में दक्षता (Mastered) प्राप्त की है।`);
    }

    if (devTopics.length > 0) {
      const names = devTopics.map((t) => getTopicTitle(t.topicId)).join(", ");
      parts.push(`${names} में अतिरिक्त अभ्यास (Needs Practice) की आवश्यकता है।`);
    }

    if (gapTopics.length > 0) {
      const names = gapTopics.map((t) => getTopicTitle(t.topicId)).join(", ");
      parts.push(`${names} में मूलभूत कमियां (Learning Gaps) पाई गई हैं।`);
    }

    if (totalRecs > 0) {
      parts.push(`सुधार हेतु ${totalRecs} अध्ययन सामग्री और अभ्यास लिंक सुझाए गए हैं।`);
    }

    return parts.join(" ");
  }

  if (lang === "te") {
    const parts: string[] = [];
    parts.push(`తరగతి ${grade} గణిత మూల్యాంకనంలో ${memory.topics.length} అంశాలు పరిశీలించబడ్డాయి.`);

    if (masteredTopics.length > 0) {
      const names = masteredTopics.map((t) => getTopicTitle(t.topicId)).join(", ");
      parts.push(`విద్యార్థి ${names} అంశాలలో పట్టు (Mastered) సాధించారు.`);
    }

    if (devTopics.length > 0) {
      const names = devTopics.map((t) => getTopicTitle(t.topicId)).join(", ");
      parts.push(`${names} అంశాలలో మరింత సాధన (Needs Practice) అవసరం.`);
    }

    if (gapTopics.length > 0) {
      const names = gapTopics.map((t) => getTopicTitle(t.topicId)).join(", ");
      parts.push(`${names} అంశాలలో ప్రాథమిక లోపాలు (Gaps) గుర్తించబడ్డాయి.`);
    }

    if (totalRecs > 0) {
      parts.push(`అభ్యసన మెరుగుదల కోసం ${totalRecs} అధ్యయన వనరులు మరియు లింకులు సిఫార్సు చేయబడ్డాయి.`);
    }

    return parts.join(" ");
  }

  // English fallback
  const parts: string[] = [];
  parts.push(`Class ${grade} Mathematics assessment evaluated ${memory.topics.length} curriculum topics.`);

  if (masteredTopics.length > 0) {
    const names = masteredTopics.map((t) => getTopicTitle(t.topicId)).join(", ");
    parts.push(`Demonstrated mastery in: ${names}.`);
  }

  if (devTopics.length > 0) {
    const names = devTopics.map((t) => getTopicTitle(t.topicId)).join(", ");
    parts.push(`Needs additional practice in: ${names}.`);
  }

  if (gapTopics.length > 0) {
    const names = gapTopics.map((t) => getTopicTitle(t.topicId)).join(", ");
    parts.push(`Foundational gaps identified in: ${names}.`);
  }

  if (totalRecs > 0) {
    parts.push(`${totalRecs} targeted learning resource(s) recommended for remediation.`);
  }

  return parts.join(" ");
}

/**
 * Main Report Writer function
 */
export async function writeReport(
  input: ReportWriterInput,
  options?: ReportWriterOptions
): Promise<ReportWriterOutput> {
  const { memory, recommendations } = input;
  const fallback = generateFallbackSummary(memory, recommendations);

  const modelName = options?.modelName || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  let client = options?.client;

  if (!client && process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch {
      client = null;
    }
  }

  if (!client) {
    return { summary: fallback, source: "fallback" };
  }

  try {
    const facts = {
      grade: memory.grade,
      language: memory.language,
      topics: memory.topics.map((t) => ({
        topicId: t.topicId,
        status: t.status,
        misconceptions: t.misconceptions || [],
        notes: t.notes || [],
      })),
      recommendationsCount: recommendations.reduce((acc, r) => acc + r.resources.length, 0),
      recommendedResourceTitles: recommendations.flatMap((r) => r.resources.map((res) => res.title)),
    };

    const targetLangName =
      memory.language === "hi" ? "Hindi (हिंदी)" : memory.language === "te" ? "Telugu (తెలుగు)" : "English";

    const prompt = `You are an educational assessment report writer for primary school teachers and parents.
Write a concise 2-4 sentence summary of the following student assessment data strictly in ${targetLangName}.

CRITICAL RULES:
1. You MUST NOT invent or add any facts, names, or performance outcomes not present in the input JSON.
2. Never mention or guess a student's personal name; refer only to "the student" or "learner".
3. Accurately state which topics were mastered, which need practice (developing), and which have gaps.
4. Keep the tone encouraging, supportive, and professional.

Input Data:
${JSON.stringify(facts, null, 2)}

Output strictly the plain text summary in ${targetLangName}. No markdown headings or bullet points.`;

    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    const summaryText = response?.text?.trim();
    if (summaryText && summaryText.length > 20) {
      return { summary: summaryText, source: "gemini" };
    }

    return { summary: fallback, source: "fallback" };
  } catch {
    return { summary: fallback, source: "fallback" };
  }
}
