// src/lib/rag/retrieve.ts
import fs from "fs";
import path from "path";
import { prerequisitesOf, ancestorsOf } from "../concepts/graph.ts";
import { generateDeterministicSemanticVector, l2Normalize, cosineSimilarity } from "./vector.ts";

export interface RetrieveOptions {
  board: "NCERT" | "CBSE" | "ICSE";
  class: number;
  conceptId?: string;
  lang?: "en" | "hi" | "te";
  type?: "explanation" | "worked_example" | "misconception" | "activity" | "hint";
  k?: number;
  minScore?: number;
  client?: unknown;
  apiKey?: string;
  fallbackToDeterministic?: boolean;
}

export interface RetrievedChunk {
  id: string;
  board: "NCERT" | "CBSE" | "ICSE";
  class: number;
  conceptId: string;
  type: "explanation" | "worked_example" | "misconception" | "activity" | "hint";
  lang: "en" | "hi" | "te";
  source: string;
  license: "own" | "open" | "permission";
  text: string;
  score: number;
}

interface EmbeddedChunkRecord {
  id: string;
  board: "NCERT" | "CBSE" | "ICSE";
  class: number;
  conceptId: string;
  type: "explanation" | "worked_example" | "misconception" | "activity" | "hint";
  lang: "en" | "hi" | "te";
  source: string;
  license: "own" | "open" | "permission";
  text: string;
  vector: number[];
}

// In-memory cache for loaded corpus embeddings
let cachedEmbeddings: EmbeddedChunkRecord[] | null = null;

// Lightweight in-memory LRU cache for query vectors
class SimpleLRUCache<K, V> {
  private max: number;
  private cache: Map<K, V>;

  constructor(max = 200) {
    this.max = max;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item !== undefined) {
      // Refresh order
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.max) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

const queryVectorCache = new SimpleLRUCache<string, number[]>(200);

export function getQueryCache(): SimpleLRUCache<string, number[]> {
  return queryVectorCache;
}

/**
 * Loads embeddings from data/embeddings.json.
 * Returns empty array if file missing or unparseable.
 */
function loadEmbeddings(): EmbeddedChunkRecord[] {
  if (cachedEmbeddings) {
    return cachedEmbeddings;
  }

  try {
    const filePath = path.join(process.cwd(), "data", "embeddings.json");
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cachedEmbeddings = parsed;
      return cachedEmbeddings;
    }
  } catch {
    // Fail silently to degrade gracefully
  }

  return [];
}


/**
 * Embed query string server-side using Gemini API.
 */
async function embedQuery(
  query: string,
  options: RetrieveOptions
): Promise<number[] | null> {
  const cacheKey = `${options.board}:${options.class}:${options.conceptId || ""}:${query.trim()}`;
  const cached = queryVectorCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  let client = options.client as {
    models?: {
      embedContent?: (req: {
        model: string;
        contents: string;
        config?: {
          taskType?: string;
          outputDimensionality?: number;
        };
      }) => Promise<{ embedding?: { values?: number[] } }>;
    };
  } | null | undefined;

  if (!client && apiKey) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      client = new GoogleGenAI({ apiKey }) as unknown as typeof client;
    } catch {
      client = null;
    }
  }

  if (client && client.models?.embedContent) {
    try {
      const response = await client.models.embedContent({
        model: "gemini-embedding-001",
        contents: query,
        config: {
          taskType: "RETRIEVAL_QUERY",
          outputDimensionality: 768,
        },
      });
      const values =
        (response as unknown as { embedding?: { values?: number[] }; embeddings?: Array<{ values?: number[] }> })?.embedding?.values ||
        (response as unknown as { embeddings?: Array<{ values?: number[] }> })?.embeddings?.[0]?.values;
      if (Array.isArray(values) && values.length >= 768) {
        const normalized = l2Normalize(values.slice(0, 768));
        queryVectorCache.set(cacheKey, normalized);
        return normalized;
      }
    } catch {
      // Degrade gracefully
    }
  }

  // Fallback to deterministic semantic vector only if explicitly requested (e.g. tests/evals)
  if (options.fallbackToDeterministic || process.env.RAG_OFFLINE_EVAL === "true") {
    const vec = generateDeterministicSemanticVector(query, {
      conceptId: options.conceptId,
      board: options.board,
      type: options.type,
    }, 768);
    queryVectorCache.set(cacheKey, vec);
    return vec;
  }

  // Without an API key or client in production, return null so retrieve() degrades safely to []
  return null;
}

/**
 * Retrieve relevant curriculum knowledge chunks.
 *
 * Rules:
 * 1. Hard-filter on metadata FIRST (board isolation, class <= target, concept in DAG prerequisite chain).
 * 2. Embed query server-side with LRU cache.
 * 3. Cosine-rank candidates and filter by minScore.
 * 4. Never throw: return [] on any failure, missing key, or low scores.
 */
export async function retrieve(
  query: string,
  options: RetrieveOptions
): Promise<RetrievedChunk[]> {
  try {
    if (!query || typeof query !== "string" || !options) {
      return [];
    }

    const {
      board,
      class: targetClass,
      conceptId,
      lang,
      type,
      k = 4,
      minScore = 0.0,
    } = options;

    if (!board || typeof targetClass !== "number") {
      return [];
    }

    const allRecords = loadEmbeddings();
    if (!allRecords || allRecords.length === 0) {
      return [];
    }

    // 1. Build allowed DAG concept set if conceptId is provided
    let allowedConcepts: Set<string> | null = null;
    if (conceptId) {
      allowedConcepts = new Set<string>([conceptId]);
      try {
        const prereqs = prerequisitesOf(conceptId);
        for (const p of prereqs) allowedConcepts.add(p);
        const ancestors = ancestorsOf(conceptId);
        for (const a of ancestors) allowedConcepts.add(a);
      } catch {
        // Continue with direct conceptId
      }
    }

    // 2. HARD FILTER on metadata FIRST
    const candidates = allRecords.filter((chunk) => {
      // Board isolation: ICSE selected means ICSE chunks only, never NCERT or CBSE.
      // NCERT or CBSE selected means non-ICSE chunks only, never ICSE.
      if (board === "ICSE") {
        if (chunk.board !== "ICSE") return false;
      } else if (board === "NCERT") {
        if (chunk.board !== "NCERT") return false;
      } else if (board === "CBSE") {
        // CBSE curriculum utilizes NCERT textbook chunks as national curriculum
        if (chunk.board !== "CBSE" && chunk.board !== "NCERT") return false;
      }

      // Class filtering: allow class <= selected class for prerequisite lookups
      if (chunk.class > targetClass) {
        return false;
      }

      // Concept filtering: must be target concept or in its prerequisite chain
      if (allowedConcepts && !allowedConcepts.has(chunk.conceptId)) {
        return false;
      }

      // Type filtering if specified
      if (type && chunk.type !== type) {
        return false;
      }

      // Language preference filtering if specified (prefer target lang or fallback to 'en')
      if (lang && chunk.lang !== lang && chunk.lang !== "en") {
        return false;
      }

      return true;
    });

    if (candidates.length === 0) {
      return [];
    }

    // 3. Embed the query server-side
    const queryVec = await embedQuery(query, options);
    if (!queryVec) {
      return [];
    }

    // 4. Cosine-rank candidates
    const scoredChunks: RetrievedChunk[] = [];
    for (const chunk of candidates) {
      const score = cosineSimilarity(queryVec, chunk.vector);
      if (score >= minScore) {
        scoredChunks.push({
          id: chunk.id,
          board: chunk.board,
          class: chunk.class,
          conceptId: chunk.conceptId,
          type: chunk.type,
          lang: chunk.lang,
          source: chunk.source,
          license: chunk.license,
          text: chunk.text,
          score: Number(score.toFixed(5)),
        });
      }
    }

    // Sort descending by score
    scoredChunks.sort((a, b) => b.score - a.score);

    return scoredChunks.slice(0, Math.max(1, k));
  } catch {
    // Fail-safe degradation: never throw
    return [];
  }
}
