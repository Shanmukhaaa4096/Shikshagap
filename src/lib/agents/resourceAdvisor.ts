/**
 * src/lib/agents/resourceAdvisor.ts
 *
 * Resource Advisor (RAG) agent:
 * Runs once at the end for "gap" and "developing" topics.
 *
 * Workflow:
 * 1. For each topic requiring remediation:
 *    - Builds query text from: topic, grade, language, and topic misconception labels.
 *    - Filters candidate resources from resources.json matching the grade and language (with fallback if needed).
 *    - Performs in-memory cosine similarity search between query embedding and precomputed embeddings.
 *    - Selects top candidate pool (e.g. up to 6 candidates).
 * 2. If Gemini API is available:
 *    - Asks Gemini to pick up to 3 resources per topic from the candidate pool only, with a one-line reason each.
 *    - Hard gate: verifies every returned ID exists in the candidate set; drops any that do not.
 *    - If 0 valid IDs remain or call fails, falls back to top 3 by similarity score.
 * 3. If Gemini is not available or fails, returns top 3 candidates by similarity score.
 */

import resourcesData from "../../data/resources.json" with { type: "json" };
import embeddingsData from "../../data/resources.embeddings.json" with { type: "json" };
import type { EducationalResource, ResourceRecommendation, SessionMemory, TopicId } from "../types.ts";

export interface CandidateWithScore {
  resource: EducationalResource;
  score: number;
}

export interface ResourceAdvisorOptions {
  client?: any; // GoogleGenAI client instance or mock
  modelName?: string;
}

/**
 * Deterministic query embedding (same dimension & hash as buildEmbeddings fallback)
 */
export function computeDeterministicQueryEmbedding(text: string, dim = 128): number[] {
  const vec = new Float64Array(dim);
  const normalized = text.toLowerCase();
  const words = normalized.split(/\W+/).filter(Boolean);

  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 1.0;
  }

  for (let i = 0; i < normalized.length - 2; i++) {
    const gram = normalized.slice(i, i + 3);
    let hash = 0;
    for (let j = 0; j < gram.length; j++) {
      hash = (hash << 5) - hash + gram.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 0.5;
  }

  let norm = 0;
  for (let i = 0; i < dim; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vec[i] /= norm;
    }
  }

  return Array.from(vec);
}

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

/**
 * Filters resources by topic, grade, and language.
 * Falls back to matching topic + grade if language has no matches.
 */
export function filterCandidates(
  resources: EducationalResource[],
  topicId: TopicId,
  grade: number,
  language: string
): EducationalResource[] {
  // First match topic, grade, and language
  let filtered = resources.filter(
    (r) => r.topicId === topicId && r.grade.includes(grade) && r.language === language
  );

  // If no language match, fall back to language match on topic or English
  if (filtered.length === 0) {
    filtered = resources.filter(
      (r) => r.topicId === topicId && (r.grade.includes(grade) || r.language === language || r.language === "en")
    );
  }

  // If still empty, match topic
  if (filtered.length === 0) {
    filtered = resources.filter((r) => r.topicId === topicId);
  }

  return filtered;
}

/**
 * Scores and ranks candidate resources against the query embedding
 */
export function rankCandidates(
  candidates: EducationalResource[],
  queryEmbedding: number[],
  precomputedEmbeddings: Record<string, number[]>
): CandidateWithScore[] {
  const scored: CandidateWithScore[] = [];

  for (const cand of candidates) {
    const emb = precomputedEmbeddings[cand.id];
    let score = 0;
    if (emb && emb.length === queryEmbedding.length) {
      score = cosineSimilarity(queryEmbedding, emb);
    } else {
      // Dimension mismatch or missing embedding: fallback score from text overlap
      score = 0.5;
    }
    scored.push({ resource: cand, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Generates recommendation reason when operating in fallback mode
 */
export function fallbackReason(resource: EducationalResource, misconceptions: string[]): string {
  if (misconceptions && misconceptions.length > 0) {
    const miscStr = misconceptions.slice(0, 2).join(", ").replace(/_/g, " ");
    return `Recommended for targeted practice on ${miscStr} (${resource.type}).`;
  }
  return `Targeted ${resource.type} resource for ${resource.title}.`;
}

/**
 * Main Resource Advisor Agent
 */
export async function recommendResources(
  memory: SessionMemory,
  options?: ResourceAdvisorOptions
): Promise<ResourceRecommendation[]> {
  const allResources = resourcesData as unknown as EducationalResource[];
  const precomputedEmbeddings = embeddingsData as unknown as Record<string, number[]>;

  // Topics needing recommendations: gap or developing
  const targetTopics = memory.topics.filter(
    (t) => t.status === "gap" || t.status === "developing"
  );

  if (targetTopics.length === 0) {
    return [];
  }

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

  const recommendations: ResourceRecommendation[] = [];

  for (const topicMem of targetTopics) {
    const topicId = topicMem.topicId;
    const misconceptions = topicMem.misconceptions || [];

    // 1. Build Query
    const queryText = `Topic: ${topicId}. Grade: ${memory.grade}. Language: ${memory.language}. Status: ${topicMem.status}. Misconceptions: ${misconceptions.join(", ")}.`;

    // 2. Filter candidates by grade and language
    const candidates = filterCandidates(allResources, topicId, memory.grade, memory.language);
    const candidateMap = new Map(candidates.map((c) => [c.id, c]));

    // 3. Compute query embedding & rank
    const queryEmb = computeDeterministicQueryEmbedding(queryText, 128);
    const ranked = rankCandidates(candidates, queryEmb, precomputedEmbeddings);
    const topCandidates = ranked.slice(0, 6);

    // Default fallback pick: top 3 by similarity
    const defaultFallback = topCandidates.slice(0, 3).map((item) => ({
      id: item.resource.id,
      title: item.resource.title,
      url: item.resource.url,
      source: item.resource.source,
      type: item.resource.type,
      reason: fallbackReason(item.resource, misconceptions),
    }));

    if (!client || topCandidates.length === 0) {
      recommendations.push({
        topicId,
        resources: defaultFallback,
      });
      continue;
    }

    // 4. Ask Gemini to pick up to 3 from candidates only
    try {
      const candidateListPrompt = topCandidates
        .map(
          (c) =>
            `- ID: "${c.resource.id}" | Title: "${c.resource.title}" | Type: ${c.resource.type} | Description: ${c.resource.description}`
        )
        .join("\n");

      const prompt = `You are an educational resource advisor. A student in Grade ${memory.grade} learning in language "${memory.language}" is struggling with topic "${topicId}" (status: ${topicMem.status}).
Observed misconceptions: ${misconceptions.length > 0 ? misconceptions.join(", ") : "general concept difficulty"}.

Candidate resources:
${candidateListPrompt}

Select up to 3 resources ONLY from the candidates above that best help address these misconceptions.
Output strictly valid JSON with this exact schema:
{
  "recommendations": [
    {
      "id": "exact_resource_id_from_candidates",
      "reason": "one-line reason for this choice"
    }
  ]
}`;

      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response?.text || "";
      let parsed: { recommendations?: Array<{ id: string; reason?: string }> } = {};

      try {
        parsed = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      }

      const returnedItems = Array.isArray(parsed?.recommendations) ? parsed.recommendations : [];

      // Verification gate: verify every returned id is in the candidate set and drop any that are not
      const validPicks: Array<{
        id: string;
        title: string;
        url: string;
        source: string;
        type: string;
        reason: string;
      }> = [];

      for (const item of returnedItems) {
        if (!item?.id) continue;
        const matchingCand = candidateMap.get(item.id);
        if (matchingCand) {
          // Prevent duplicates
          if (!validPicks.some((p) => p.id === matchingCand.id)) {
            validPicks.push({
              id: matchingCand.id,
              title: matchingCand.title,
              url: matchingCand.url,
              source: matchingCand.source,
              type: matchingCand.type,
              reason: item.reason && typeof item.reason === "string" && item.reason.trim().length > 0
                ? item.reason.trim()
                : fallbackReason(matchingCand, misconceptions),
            });
          }
        }
        // If not in candidate set, dropped silently by the gate
      }

      if (validPicks.length > 0) {
        recommendations.push({
          topicId,
          resources: validPicks.slice(0, 3),
        });
      } else {
        // Fallback if Gemini returned 0 valid candidates
        recommendations.push({
          topicId,
          resources: defaultFallback,
        });
      }
    } catch {
      // Fallback on any Gemini error
      recommendations.push({
        topicId,
        resources: defaultFallback,
      });
    }
  }

  return recommendations;
}
