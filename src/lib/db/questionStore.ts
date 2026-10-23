// src/lib/db/questionStore.ts
/**
 * ShikshaGap Persistent Question-Memory Store.
 *
 * Provides a clean interface (QuestionStore) with two implementations:
 * 1. SupabaseQuestionStore: Production storage with Postgres and pgvector (768-dim embeddings).
 * 2. LocalJsonQuestionStore: Local development, offline mode, and unit tests.
 *
 * STRICT SECURITY INVARIANTS:
 * - Accessed only from server routes using the service role key.
 * - Service role key NEVER reaches the client or NEXT_PUBLIC_ variables.
 *
 * STRICT PRIVACY INVARIANTS:
 * - Only stores validated question text, answer value, format, operands, and aggregate counters.
 * - NEVER stores student names, roll numbers, session IDs, or individual student answers.
 */

import { getSupabaseAdmin } from "../server/supabase.ts";
import { cosineSimilarity, l2Normalize, generateDeterministicSemanticVector } from "../rag/vector.ts";
import { computeQuestionFingerprint } from "../questions/fingerprint.ts";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export function getDedupeSimilarityThreshold(): number {
  const envVal = process.env.RAG_DEDUPE_SIMILARITY_THRESHOLD;
  if (envVal) {
    const parsed = parseFloat(envVal);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 1) {
      return parsed;
    }
  }
  return 0.98;
}

export const DUPLICATE_THRESHOLD = 0.98;
export const MIN_EMPIRICAL_SAMPLE_SIZE = 20;

/**
 * Deterministically maps any arbitrary string ID or key to a valid RFC-4122 compliant UUID.
 * If the input is already a valid UUID, returns it in lowercase.
 * This ensures Postgres UUID primary keys never throw syntax errors while preserving idempotency.
 */
export function toDeterministicUuid(idOrKey: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrKey)) {
    return idOrKey.toLowerCase();
  }
  const hash = crypto.createHash("sha256").update(idOrKey).digest("hex");
  const p1 = hash.substring(0, 8);
  const p2 = hash.substring(8, 12);
  const p3 = "4" + hash.substring(13, 16);
  const p4 = "8" + hash.substring(17, 20);
  const p5 = hash.substring(20, 32);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

export interface QuestionMemoryItem {
  id: string;
  created_at?: string;
  board: "CBSE" | "ICSE" | string;
  class: number;
  concept_id: string;
  lang: string;
  difficulty: number;
  question_text: string;
  answer_value: string;
  answer_format: string;
  template_or_source: "hybrid" | "gemini";
  fingerprint: string;
  embedding: number[];
  times_served: number;
  times_correct: number;
  flagged: boolean;
  similarity?: number;
}

export interface RetrieveQuestionParams {
  queryEmbedding: number[];
  board: "CBSE" | "ICSE" | string;
  class: number;
  conceptId: string;
  difficultyMin?: number;
  difficultyMax?: number;
  limit?: number;
}

export interface SaveQuestionResult {
  saved: boolean;
  reason?: "duplicate_fingerprint" | "duplicate_similarity" | "database_error" | "ok";
  id?: string;
  similarity?: number;
  record?: QuestionMemoryItem;
  error?: unknown;
}

export interface EmpiricalDifficultyResult {
  sampleSize: number;
  successRate: number;
  calibratedDifficulty: number | null;
}

export interface QueryQuestionsParams {
  class: number;
  board?: "CBSE" | "ICSE" | string;
  conceptId?: string;
  difficultyMin?: number;
  difficultyMax?: number;
  excludeIds?: string[];
  limit?: number;
}

export interface QuestionStore {
  saveQuestion(item: Omit<QuestionMemoryItem, "id" | "times_served" | "times_correct" | "flagged"> & {
    id?: string;
    times_served?: number;
    times_correct?: number;
    flagged?: boolean;
  }): Promise<SaveQuestionResult>;

  retrieveSimilarQuestions(params: RetrieveQuestionParams): Promise<Array<QuestionMemoryItem & { similarity: number }>>;

  queryQuestions(params: QueryQuestionsParams): Promise<QuestionMemoryItem[]>;

  getQuestionById(id: string): Promise<QuestionMemoryItem | null>;

  getQuestionByFingerprint(fingerprint: string): Promise<QuestionMemoryItem | null>;

  incrementStats(questionId: string, wasCorrect: boolean): Promise<boolean>;

  flagQuestion(questionId: string, reason?: string): Promise<boolean>;

  getEmpiricalDifficulty(questionId: string): Promise<EmpiricalDifficultyResult>;

  clear(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Embedding Helper for Question Text
// ---------------------------------------------------------------------------

let geminiClientInstance: unknown = null;

export async function embedQuestionText(
  text: string,
  options: {
    conceptId?: string;
    board?: string;
    apiKey?: string;
    client?: unknown;
    fallbackToDeterministic?: boolean;
  } = {}
): Promise<number[]> {
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
    if (!geminiClientInstance) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        geminiClientInstance = new GoogleGenAI({ apiKey });
      } catch {
        geminiClientInstance = null;
      }
    }
    client = geminiClientInstance as typeof client;
  }

  if (client && client.models?.embedContent) {
    try {
      const response = await client.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
        config: {
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: 768,
        },
      });
      const values =
        (response as unknown as { embedding?: { values?: number[] }; embeddings?: Array<{ values?: number[] }> })?.embedding?.values ||
        (response as unknown as { embeddings?: Array<{ values?: number[] }> })?.embeddings?.[0]?.values;
      if (Array.isArray(values) && values.length >= 768) {
        return l2Normalize(values.slice(0, 768));
      }
    } catch {
      // Degrade gracefully to deterministic vector
    }
  }

  // Fallback to 768-dim deterministic vector
  return generateDeterministicSemanticVector(
    text,
    {
      conceptId: options.conceptId,
      board: options.board,
      type: "question",
    },
    768
  );
}

// ---------------------------------------------------------------------------
// Implementation 1: LocalJsonQuestionStore (Development & Tests)
// ---------------------------------------------------------------------------

export class LocalJsonQuestionStore implements QuestionStore {
  private static instance: LocalJsonQuestionStore | null = null;
  private items: Map<string, QuestionMemoryItem> = new Map();
  private filePath: string;

  constructor(filePath?: string) {
    this.filePath =
      filePath ||
      path.join(process.cwd(), "data", "question_memory.json");
    this.loadFromFile();
  }

  public static getInstance(filePath?: string): LocalJsonQuestionStore {
    if (!LocalJsonQuestionStore.instance) {
      LocalJsonQuestionStore.instance = new LocalJsonQuestionStore(filePath);
    }
    return LocalJsonQuestionStore.instance;
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.items.clear();
          for (const item of parsed) {
            this.items.set(item.id, item);
          }
        }
      }
    } catch {
      // Memory only if file read fails
    }
  }

  private saveToFile(): void {
    // Only attempt disk save outside test/read-only environments
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = Array.from(this.items.values());
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch {
      // Ignore write errors (e.g. read-only filesystem on Vercel)
    }
  }

  async saveQuestion(
    item: Omit<QuestionMemoryItem, "id" | "times_served" | "times_correct" | "flagged"> & {
      id?: string;
      times_served?: number;
      times_correct?: number;
      flagged?: boolean;
    }
  ): Promise<SaveQuestionResult> {
    const fingerprint = item.fingerprint || computeQuestionFingerprint(item.question_text);

    // 1. Check exact fingerprint duplicate
    for (const existing of this.items.values()) {
      if (existing.fingerprint === fingerprint) {
        console.log(`[QuestionStore] DEDUPED(duplicate_fingerprint) id=${existing.id} class=${item.class}`);
        return {
          saved: false,
          reason: "duplicate_fingerprint",
          id: existing.id,
          record: existing,
        };
      }
    }

    // 2. Check nearest neighbor cosine similarity
    const threshold = getDedupeSimilarityThreshold();
    const candidates = await this.retrieveSimilarQuestions({
      queryEmbedding: item.embedding,
      board: item.board,
      class: item.class,
      conceptId: item.concept_id,
      difficultyMin: 1,
      difficultyMax: 5,
      limit: 1,
    });

    if (candidates.length > 0 && candidates[0].similarity >= threshold) {
      console.log(`[QuestionStore] DEDUPED(duplicate_similarity) id=${candidates[0].id} class=${item.class}`);
      return {
        saved: false,
        reason: "duplicate_similarity",
        id: candidates[0].id,
        similarity: candidates[0].similarity,
        record: candidates[0],
      };
    }

    const id = item.id || `qm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const fullItem: QuestionMemoryItem = {
      id,
      created_at: item.created_at || new Date().toISOString(),
      board: item.board,
      class: item.class,
      concept_id: item.concept_id,
      lang: item.lang || "en",
      difficulty: item.difficulty,
      question_text: item.question_text,
      answer_value: item.answer_value,
      answer_format: item.answer_format,
      template_or_source: item.template_or_source,
      fingerprint,
      embedding: item.embedding,
      times_served: item.times_served ?? 0,
      times_correct: item.times_correct ?? 0,
      flagged: item.flagged ?? false,
    };

    this.items.set(id, fullItem);
    this.saveToFile();
    console.log(`[QuestionStore] SAVED id=${id} class=${fullItem.class}`);

    return {
      saved: true,
      reason: "ok",
      id,
      record: fullItem,
    };
  }

  async retrieveSimilarQuestions(
    params: RetrieveQuestionParams
  ): Promise<Array<QuestionMemoryItem & { similarity: number }>> {
    const diffMin = params.difficultyMin ?? 1;
    const diffMax = params.difficultyMax ?? 5;
    const limit = params.limit ?? 5;

    // Strict metadata filtering
    const matching: Array<QuestionMemoryItem & { similarity: number }> = [];

    for (const item of this.items.values()) {
      if (item.flagged) continue;
      if (item.board !== params.board) continue;
      if (item.class !== params.class) continue;
      if (item.concept_id !== params.conceptId) continue;
      if (item.difficulty < diffMin || item.difficulty > diffMax) continue;

      const sim = cosineSimilarity(params.queryEmbedding, item.embedding);
      matching.push({ ...item, similarity: Number(sim.toFixed(4)) });
    }

    // Sort descending by similarity
    matching.sort((a, b) => b.similarity - a.similarity);
    return matching.slice(0, limit);
  }

  async queryQuestions(params: QueryQuestionsParams): Promise<QuestionMemoryItem[]> {
    const diffMin = params.difficultyMin ?? 1;
    const diffMax = params.difficultyMax ?? 5;
    const limit = params.limit ?? 20;
    const excludeSet = new Set((params.excludeIds || []).map((id) => id.split("_s")[0]));

    const matching: QuestionMemoryItem[] = [];
    for (const item of this.items.values()) {
      if (item.flagged) continue;
      if (item.class !== params.class) continue;
      if (params.board && params.board !== "BOTH" && item.board !== params.board) continue;
      if (params.conceptId && item.concept_id !== params.conceptId) continue;
      if (item.difficulty < diffMin || item.difficulty > diffMax) continue;
      if (excludeSet.has(item.id) || excludeSet.has(item.id.split("_s")[0])) continue;
      matching.push(item);
      if (matching.length >= limit) break;
    }
    return matching;
  }

  async getQuestionById(id: string): Promise<QuestionMemoryItem | null> {
    const baseId = id.split("_s")[0];
    const detUuid = toDeterministicUuid(baseId);
    return this.items.get(id) || this.items.get(baseId) || this.items.get(detUuid) || null;
  }

  async getQuestionByFingerprint(fingerprint: string): Promise<QuestionMemoryItem | null> {
    for (const item of this.items.values()) {
      if (item.fingerprint === fingerprint) return item;
    }
    return null;
  }

  async incrementStats(questionId: string, wasCorrect: boolean): Promise<boolean> {
    // Check exact id, base id (strip _s suffix), or deterministic UUID
    const baseId = questionId.split("_s")[0];
    const detUuid = toDeterministicUuid(baseId);
    const target = this.items.get(questionId) || this.items.get(baseId) || this.items.get(detUuid);
    if (!target) return false;

    target.times_served += 1;
    if (wasCorrect) {
      target.times_correct += 1;
    }
    this.saveToFile();
    return true;
  }

  async flagQuestion(questionId: string, _reason?: string): Promise<boolean> {
    void _reason;
    const baseId = questionId.split("_s")[0];
    const detUuid = toDeterministicUuid(baseId);
    const target = this.items.get(questionId) || this.items.get(baseId) || this.items.get(detUuid);
    if (!target) return false;

    target.flagged = true;
    this.saveToFile();
    return true;
  }

  async getEmpiricalDifficulty(questionId: string): Promise<EmpiricalDifficultyResult> {
    const baseId = questionId.split("_s")[0];
    const detUuid = toDeterministicUuid(baseId);
    const target = this.items.get(questionId) || this.items.get(baseId) || this.items.get(detUuid);
    if (!target) {
      return { sampleSize: 0, successRate: 0, calibratedDifficulty: null };
    }

    const sampleSize = target.times_served;
    if (sampleSize < MIN_EMPIRICAL_SAMPLE_SIZE) {
      const rate = sampleSize > 0 ? target.times_correct / sampleSize : 0;
      return { sampleSize, successRate: Number(rate.toFixed(3)), calibratedDifficulty: null };
    }

    const successRate = target.times_correct / sampleSize;
    let calibrated = 3;
    if (successRate >= 0.85) calibrated = 1;
    else if (successRate >= 0.65) calibrated = 2;
    else if (successRate >= 0.45) calibrated = 3;
    else if (successRate >= 0.25) calibrated = 4;
    else calibrated = 5;

    return {
      sampleSize,
      successRate: Number(successRate.toFixed(3)),
      calibratedDifficulty: calibrated,
    };
  }

  async clear(): Promise<void> {
    this.items.clear();
    this.saveToFile();
  }
}

// ---------------------------------------------------------------------------
// Implementation 2: SupabaseQuestionStore (Production with pgvector)
// ---------------------------------------------------------------------------

export class SupabaseQuestionStore implements QuestionStore {
  async saveQuestion(
    item: Omit<QuestionMemoryItem, "id" | "times_served" | "times_correct" | "flagged"> & {
      id?: string;
      times_served?: number;
      times_correct?: number;
      flagged?: boolean;
    }
  ): Promise<SaveQuestionResult> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error(`[QuestionStore] FAILED(missing_supabase_client) id=${item.id || "unknown"} class=${item.class}`);
      return { saved: false, reason: "database_error", error: "missing_supabase_client" };
    }

    const fingerprint = item.fingerprint || computeQuestionFingerprint(item.question_text);

    // 1. Check exact fingerprint in DB
    const { data: existingFp } = await supabase
      .from("question_memory")
      .select("id, question_text")
      .eq("fingerprint", fingerprint)
      .maybeSingle();

    if (existingFp) {
      console.log(`[QuestionStore] DEDUPED(duplicate_fingerprint) id=${existingFp.id} class=${item.class}`);
      return {
        saved: false,
        reason: "duplicate_fingerprint",
        id: existingFp.id,
      };
    }

    // 2. Check nearest neighbor cosine similarity via match_questions
    const threshold = getDedupeSimilarityThreshold();
    const similar = await this.retrieveSimilarQuestions({
      queryEmbedding: item.embedding,
      board: item.board,
      class: item.class,
      conceptId: item.concept_id,
      difficultyMin: 1,
      difficultyMax: 5,
      limit: 1,
    });

    if (similar.length > 0 && similar[0].similarity >= threshold) {
      console.log(`[QuestionStore] DEDUPED(duplicate_similarity) id=${similar[0].id} class=${item.class}`);
      return {
        saved: false,
        reason: "duplicate_similarity",
        id: similar[0].id,
        similarity: similar[0].similarity,
      };
    }

    // 3. Ensure valid Postgres UUID
    const rowId = item.id ? toDeterministicUuid(item.id) : toDeterministicUuid(fingerprint);

    const insertPayload = {
      id: rowId,
      board: item.board,
      class: item.class,
      concept_id: item.concept_id,
      lang: item.lang || "en",
      difficulty: item.difficulty,
      question_text: item.question_text,
      answer_value: item.answer_value,
      answer_format: item.answer_format,
      template_or_source: item.template_or_source,
      fingerprint,
      embedding: item.embedding,
      times_served: item.times_served ?? 0,
      times_correct: item.times_correct ?? 0,
      flagged: item.flagged ?? false,
    };

    const { data, error } = await supabase
      .from("question_memory")
      .insert(insertPayload)
      .select()
      .maybeSingle();

    if (error) {
      console.error(`[QuestionStore] FAILED(${error.message}) id=${rowId} class=${item.class}`);
      return { saved: false, reason: "database_error", error: error.message };
    }

    console.log(`[QuestionStore] SAVED id=${data?.id || rowId} class=${item.class}`);
    return {
      saved: true,
      reason: "ok",
      id: data?.id || rowId,
      record: data as QuestionMemoryItem,
    };
  }

  async retrieveSimilarQuestions(
    params: RetrieveQuestionParams
  ): Promise<Array<QuestionMemoryItem & { similarity: number }>> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase.rpc("match_questions", {
        query_embedding: params.queryEmbedding,
        match_board: params.board,
        match_class: params.class,
        match_concept_id: params.conceptId,
        difficulty_min: params.difficultyMin ?? 1,
        difficulty_max: params.difficultyMax ?? 5,
        match_count: params.limit ?? 5,
      });

      if (error) {
        console.error("[SupabaseQuestionStore] match_questions RPC error:", error.message);
        return [];
      }

      if (!Array.isArray(data)) return [];

      return data.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        board: String(row.board),
        class: Number(row.class),
        concept_id: String(row.concept_id),
        lang: String(row.lang || "en"),
        difficulty: Number(row.difficulty),
        question_text: String(row.question_text),
        answer_value: String(row.answer_value),
        answer_format: String(row.answer_format),
        template_or_source: (row.template_or_source as "hybrid" | "gemini") || "gemini",
        fingerprint: String(row.fingerprint || ""),
        embedding: [],
        times_served: Number(row.times_served || 0),
        times_correct: Number(row.times_correct || 0),
        flagged: false,
        similarity: Number(Number(row.similarity || 0).toFixed(4)),
      }));
    } catch (err) {
      console.error("[SupabaseQuestionStore] Retrieval exception:", err);
      return [];
    }
  }

  async queryQuestions(params: QueryQuestionsParams): Promise<QuestionMemoryItem[]> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return [];

    try {
      let query = supabase
        .from("question_memory")
        .select("*")
        .eq("class", params.class)
        .eq("flagged", false);

      if (params.board && params.board !== "BOTH") {
        query = query.eq("board", params.board);
      }
      if (params.conceptId) {
        query = query.eq("concept_id", params.conceptId);
      }
      if (params.difficultyMin) {
        query = query.gte("difficulty", params.difficultyMin);
      }
      if (params.difficultyMax) {
        query = query.lte("difficulty", params.difficultyMax);
      }
      if (params.excludeIds && params.excludeIds.length > 0) {
        const validUuids = params.excludeIds.map((id) => toDeterministicUuid(id.split("_s")[0]));
        query = query.not("id", "in", `(${validUuids.join(",")})`);
      }

      query = query.order("times_served", { ascending: true }).limit(params.limit ?? 20);

      const { data, error } = await query;
      if (error) {
        console.error("[SupabaseQuestionStore] queryQuestions error:", error.message);
        return [];
      }
      return (data as QuestionMemoryItem[]) || [];
    } catch (err) {
      console.error("[SupabaseQuestionStore] queryQuestions exception:", err);
      return [];
    }
  }

  async getQuestionById(id: string): Promise<QuestionMemoryItem | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const baseId = id.split("_s")[0];
    const uuid = toDeterministicUuid(baseId);
    const { data } = await supabase
      .from("question_memory")
      .select("*")
      .eq("id", uuid)
      .maybeSingle();

    return (data as QuestionMemoryItem) || null;
  }

  async getQuestionByFingerprint(fingerprint: string): Promise<QuestionMemoryItem | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data } = await supabase
      .from("question_memory")
      .select("*")
      .eq("fingerprint", fingerprint)
      .maybeSingle();

    return (data as QuestionMemoryItem) || null;
  }

  async incrementStats(questionId: string, wasCorrect: boolean): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    try {
      const baseId = questionId.split("_s")[0];
      const uuid = toDeterministicUuid(baseId);
      const { data } = await supabase
        .from("question_memory")
        .select("times_served, times_correct")
        .eq("id", uuid)
        .maybeSingle();

      if (!data) return false;

      const newServed = (data.times_served || 0) + 1;
      const newCorrect = wasCorrect ? (data.times_correct || 0) + 1 : (data.times_correct || 0);

      const { error } = await supabase
        .from("question_memory")
        .update({
          times_served: newServed,
          times_correct: newCorrect,
        })
        .eq("id", uuid);

      return !error;
    } catch {
      return false;
    }
  }

  async flagQuestion(questionId: string, _reason?: string): Promise<boolean> {
    void _reason;
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    try {
      const baseId = questionId.split("_s")[0];
      const uuid = toDeterministicUuid(baseId);
      const { error } = await supabase
        .from("question_memory")
        .update({ flagged: true })
        .eq("id", uuid);

      return !error;
    } catch {
      return false;
    }
  }

  async getEmpiricalDifficulty(questionId: string): Promise<EmpiricalDifficultyResult> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return { sampleSize: 0, successRate: 0, calibratedDifficulty: null };
    }

    try {
      const baseId = questionId.split("_s")[0];
      const uuid = toDeterministicUuid(baseId);
      const { data } = await supabase
        .from("question_memory")
        .select("times_served, times_correct")
        .eq("id", uuid)
        .maybeSingle();

      if (!data) {
        return { sampleSize: 0, successRate: 0, calibratedDifficulty: null };
      }

      const sampleSize = data.times_served || 0;
      if (sampleSize < MIN_EMPIRICAL_SAMPLE_SIZE) {
        const rate = sampleSize > 0 ? (data.times_correct || 0) / sampleSize : 0;
        return { sampleSize, successRate: Number(rate.toFixed(3)), calibratedDifficulty: null };
      }

      const successRate = (data.times_correct || 0) / sampleSize;
      let calibrated = 3;
      if (successRate >= 0.85) calibrated = 1;
      else if (successRate >= 0.65) calibrated = 2;
      else if (successRate >= 0.45) calibrated = 3;
      else if (successRate >= 0.25) calibrated = 4;
      else calibrated = 5;

      return {
        sampleSize,
        successRate: Number(successRate.toFixed(3)),
        calibratedDifficulty: calibrated,
      };
    } catch {
      return { sampleSize: 0, successRate: 0, calibratedDifficulty: null };
    }
  }

  async clear(): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return;
    await supabase.from("question_memory").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let activeStoreOverride: QuestionStore | null = null;
let hasLoggedActiveStore = false;

export function setQuestionStoreOverride(store: QuestionStore | null): void {
  activeStoreOverride = store;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes("placeholder") &&
    !key.includes("placeholder") &&
    url.trim().length > 0 &&
    key.trim().length > 0
  );
}

export function getQuestionStore(): QuestionStore {
  if (activeStoreOverride) {
    return activeStoreOverride;
  }

  const configured = isSupabaseConfigured();

  // Fail loudly in production if Supabase credentials are missing or invalid
  if (process.env.NODE_ENV === "production" && !configured) {
    const hasUrl = Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
    const hasKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
    const fatalError = new Error(
      `[QuestionStore] FATAL CONFIG ERROR in production: Supabase question store is not configured. ` +
      `SUPABASE_URL: ${hasUrl ? "configured" : "MISSING"}, ` +
      `SUPABASE_SERVICE_ROLE_KEY: ${hasKey ? "configured" : "MISSING"}. ` +
      `Falling back to local disk in production serverless is strictly prohibited.`
    );
    console.error(fatalError.message);
    throw fatalError;
  }

  if (!hasLoggedActiveStore && process.env.NODE_ENV !== "test") {
    hasLoggedActiveStore = true;
    console.log(
      `[QuestionStore] Active store: ${configured ? "SupabaseQuestionStore" : "LocalJsonQuestionStore"}`
    );
  }

  if (configured) {
    return new SupabaseQuestionStore();
  }

  return LocalJsonQuestionStore.getInstance();
}

/**
 * Safe version of getQuestionStore that returns null instead of throwing
 * if the store is unconfigured in production or fails initialization.
 */
export function getQuestionStoreSafe(): QuestionStore | null {
  try {
    return getQuestionStore();
  } catch {
    return null;
  }
}

/**
 * High-level retrieveSimilarQuestions wrapper with timeout and fallback protection.
 * Resolves within ~800ms. If it times out or errors, returns [] without throwing.
 */
export async function retrieveSimilarQuestionsSafe(
  params: RetrieveQuestionParams,
  timeoutMs = 800
): Promise<Array<QuestionMemoryItem & { similarity: number }>> {
  const store = getQuestionStoreSafe();
  if (!store) {
    return [];
  }

  const fetchPromise = store.retrieveSimilarQuestions(params);
  const timeoutPromise = new Promise<Array<QuestionMemoryItem & { similarity: number }>>((resolve) =>
    setTimeout(() => resolve([]), timeoutMs)
  );

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err) {
    console.warn("[QuestionMemoryRAG] Safe retrieval fallback caught error:", err instanceof Error ? err.message : err);
    return [];
  }
}
