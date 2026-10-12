/**
 * ShikshaGap Error Analyst Agent
 *
 * Runs once when a topic closes with status "developing" or "gap".
 * Input: that topic's attempts.
 * Output (JSON): a list of misconception labels with a one-line explanation each.
 * Labels must come from a fixed per-concept list (extending the existing error classification).
 * Validates the JSON and falls back to existing classification values.
 */

import { GoogleGenAI } from "@google/genai";
import type { Attempt, ConceptId, TopicId } from "../types";

export const CONCEPT_MISCONCEPTIONS: Record<string, string[]> = {
  number_sense: ["slip", "place_value", "order_reversal", "magnitude_confusion", "unclassified"],
  place_value: ["place_value", "slip", "zero_placeholder", "column_alignment", "unclassified"],
  addition: ["regrouping", "slip", "column_alignment", "wrong_operation", "unclassified"],
  subtraction: ["smaller_from_larger", "regrouping", "slip", "wrong_operation", "unclassified"],
  mult_concept: ["repeated_addition_confusion", "wrong_operation", "slip", "unclassified"],
  mult_facts: ["slip", "table_recall", "wrong_operation", "unclassified"],
  multi_digit_mult: ["no_carry_mult", "regrouping", "place_value", "slip", "unclassified"],
  division_concept: ["equal_sharing_confusion", "wrong_operation", "slip", "unclassified"],
  division_facts: ["slip", "table_recall", "remainder", "wrong_operation", "unclassified"],
  long_division: ["remainder", "quotient_digit_error", "place_value", "slip", "unclassified"],
  division_word: ["wrong_operation", "remainder", "slip", "unclassified"],
  fraction_basics: ["fraction_larger_denominator", "part_whole_confusion", "slip", "unclassified"],
  equivalent_fractions: ["fraction_additive", "fraction_inverted", "slip", "unclassified"],
  comparing_fractions: ["fraction_larger_denominator", "cross_multiplication_error", "slip", "unclassified"],
  fraction_addition: ["fraction_add_denominators", "slip", "common_denominator_error", "unclassified"],
};

export const GLOBAL_FALLBACK_MISCONCEPTIONS = [
  "slip",
  "wrong_operation",
  "regrouping",
  "place_value",
  "fraction_add_denominators",
  "fraction_larger_denominator",
  "fraction_additive",
  "fraction_inverted",
  "remainder",
  "unclassified",
];

export interface MisconceptionResult {
  label: string;
  explanation: string;
}

export interface ErrorAnalystInput {
  topicId: TopicId;
  attempts: Attempt[];
  pseudonymousId: string;
  grade?: number;
  apiKey?: string;
  client?: any; // For test mocking
}

/**
 * Returns fallback misconception labels directly from the recorded attempt errorTypes.
 */
export function getFallbackMisconceptions(attempts: Attempt[]): string[] {
  const labels: string[] = [];
  for (const a of attempts) {
    if (!a.correct && a.errorType && a.errorType !== "correct") {
      if (!labels.includes(a.errorType)) {
        labels.push(a.errorType);
      }
    }
  }
  return labels.length > 0 ? labels : ["slip"];
}

/**
 * Gets the fixed allowed misconception list for a given concept.
 */
export function getAllowedMisconceptionsForConcept(conceptId?: ConceptId | string): string[] {
  if (conceptId && CONCEPT_MISCONCEPTIONS[conceptId]) {
    return CONCEPT_MISCONCEPTIONS[conceptId];
  }
  return GLOBAL_FALLBACK_MISCONCEPTIONS;
}

/**
 * Analyzes attempts on a closed topic to produce validated misconception labels.
 */
export async function analyzeErrors(
  input: ErrorAnalystInput
): Promise<{ labels: string[]; details: MisconceptionResult[] }> {
  const { topicId, attempts, pseudonymousId, grade = 5, apiKey, client } = input;

  const fallback = getFallbackMisconceptions(attempts);
  const fallbackDetails: MisconceptionResult[] = fallback.map((label) => ({
    label,
    explanation: `Identified error pattern: ${label.replace(/_/g, " ")}.`,
  }));

  // Identify concepts tested in this topic's attempts
  const testedConcepts = Array.from(new Set(attempts.map((a) => a.conceptId)));
  const primaryConcept = testedConcepts[0];
  const allowedSet = new Set<string>();

  testedConcepts.forEach((c) => {
    getAllowedMisconceptionsForConcept(c).forEach((m) => allowedSet.add(m));
  });
  GLOBAL_FALLBACK_MISCONCEPTIONS.forEach((m) => allowedSet.add(m));

  const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;

  // If no Gemini client or API key, return deterministic fallback
  if (!client && !effectiveApiKey) {
    return { labels: fallback, details: fallbackDetails };
  }

  try {
    const ai = client || new GoogleGenAI({ apiKey: effectiveApiKey });
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const allowedListStr = Array.from(allowedSet).join(", ");
    const attemptsSummary = attempts.map((a) => ({
      concept: a.conceptId,
      level: a.level,
      studentAnswer: a.studentAnswer,
      correct: a.correct,
      existingClassification: a.errorType || "none",
    }));

    const systemInstruction = `You are the ShikshaGap Error Analyst for Class ${grade} Mathematics.
Analyze the student's incorrect attempts for topic "${topicId}".
Allowed misconception labels MUST come strictly from this list: [${allowedListStr}].
Return ONLY valid JSON matching this schema:
{
  "misconceptions": [
    {
      "label": "string (must match allowed list)",
      "explanation": "one-line concise explanation"
    }
  ]
}`;

    const prompt = JSON.stringify({
      learnerPseudonym: pseudonymousId,
      topicId,
      primaryConcept,
      attempts: attemptsSummary,
    });

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\nStudent Attempts:\n${prompt}` }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 500,
      },
    });

    const rawText = response.text || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Malformed JSON fallback
      return { labels: fallback, details: fallbackDetails };
    }

    if (!parsed || !Array.isArray(parsed.misconceptions)) {
      return { labels: fallback, details: fallbackDetails };
    }

    const validatedDetails: MisconceptionResult[] = [];
    const validatedLabels: string[] = [];

    for (const item of parsed.misconceptions) {
      if (item && typeof item.label === "string" && allowedSet.has(item.label)) {
        if (!validatedLabels.includes(item.label)) {
          validatedLabels.push(item.label);
          validatedDetails.push({
            label: item.label,
            explanation: typeof item.explanation === "string" ? item.explanation : `${item.label} detected.`,
          });
        }
      }
    }

    if (validatedLabels.length === 0) {
      return { labels: fallback, details: fallbackDetails };
    }

    return { labels: validatedLabels, details: validatedDetails };
  } catch (err) {
    // If Gemini call fails for any reason, fall back gracefully
    return { labels: fallback, details: fallbackDetails };
  }
}
