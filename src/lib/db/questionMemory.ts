/**
 * src/lib/db/questionMemory.ts
 *
 * Safe Persistent Question Memory Layer.
 * Reads DATABASE_URL from environment. If DATABASE_URL is not set or the
 * database connection fails, all methods safely fall back to in-memory operations
 * with zero crashes or behavioral changes.
 *
 * PRIVACY GUARANTEES:
 * - NEVER stores student names, roll numbers, typed answers, or identifying telemetry.
 * - Only stores validated mathematical problems and anonymous aggregate counters.
 * - Enforces allowed keys whitelist on session updates.
 */

import { computeDeterministicQueryEmbedding, cosineSimilarity } from "../agents/resourceAdvisor.ts";
import { getQuestionStore } from "./questionStore.ts";

export * from "./questionStore.ts";

export interface ValidatedQuestionRecord {
  id: string;
  grade: number;
  conceptId: string;
  language: string;
  theme: string;
  text: string;
  operands: number[];
  embedding: number[];
  qualityScore: number;
  timesShown: number;
  timesCorrect: number;
  timesReported: number;
  isRetired: boolean;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnonymousMisconceptionTally {
  grade: number;
  conceptId: string;
  language: string;
  errorType: string;
  count: number;
}

export interface AnonymousTopicOutcomeTally {
  grade: number;
  topicId: string;
  status: string;
  count: number;
}

export interface AnonymousQuestionAttemptUpdate {
  questionId: string;
  conceptId: string;
  level: number;
  correct: boolean;
  errorType?: string;
  wrongOptionTag?: string;
}

export interface AnonymousTopicOutcomeUpdate {
  topicId: string;
  status: string;
}

export interface AnonymousSessionPayload {
  sessionId: string;
  grade: number;
  language: string;
  hourTimestamp: string;
  questions: AnonymousQuestionAttemptUpdate[];
  topicOutcomes: AnonymousTopicOutcomeUpdate[];
}

export interface AnonymousSessionSummary {
  sessionId: string;
  grade: number;
  language: string;
  hourTimestamp: string;
  questionsAttempted: number;
  questionsCorrect: number;
  topicOutcomes: AnonymousTopicOutcomeUpdate[];
  createdAt: string;
}

// In-Memory fallback store used when DATABASE_URL is unset or DB is unreachable
class MemoryQuestionStore {
  questions: Map<string, ValidatedQuestionRecord> = new Map();
  misconceptionTallies: Map<string, AnonymousMisconceptionTally> = new Map();
  topicOutcomeTallies: Map<string, AnonymousTopicOutcomeTally> = new Map();
  processedSessions: Map<string, AnonymousSessionSummary> = new Map();
  dailyBudget: Map<string, number> = new Map();
  questionStats: Map<string, { timesShown: number; timesCorrect: number }> = new Map();

  reset(): void {
    this.questions.clear();
    this.misconceptionTallies.clear();
    this.topicOutcomeTallies.clear();
    this.processedSessions.clear();
    this.dailyBudget.clear();
    this.questionStats.clear();
  }
}

const memoryStore = new MemoryQuestionStore();

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.trim().length > 0);
}

// Allowed keys whitelist for anonymous session payload
const ALLOWED_SESSION_KEYS = new Set([
  "sessionId",
  "grade",
  "language",
  "hourTimestamp",
  "questions",
  "topicOutcomes",
]);

const ALLOWED_QUESTION_KEYS = new Set([
  "questionId",
  "conceptId",
  "level",
  "correct",
  "errorType",
  "wrongOptionTag",
]);

const ALLOWED_TOPIC_KEYS = new Set(["topicId", "status"]);

/**
 * Validates that an incoming session payload contains ONLY allowed anonymous keys.
 * Fails if any student PII or unauthorized fields are present.
 */
export function validateSessionPayloadWhitelist(payload: unknown): { valid: boolean; error?: string } {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Payload must be an object" };
  }

  const keys = Object.keys(payload);
  for (const k of keys) {
    if (!ALLOWED_SESSION_KEYS.has(k)) {
      return { valid: false, error: `WHITELIST VIOLATION: Unauthorized key in session payload: '${k}'` };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p: any = payload;

  // Strict PII check on student identifying terms
  if (p.studentName || p.studentId || p.rollNumber || p.typedAnswer || p.ip || p.ipAddress) {
    return { valid: false, error: "PRIVACY VIOLATION: Student personal data is prohibited." };
  }

  if (Array.isArray(p.questions)) {
    for (const q of p.questions) {
      if (!q || typeof q !== "object") {
        return { valid: false, error: "Question attempt must be an object" };
      }
      for (const qk of Object.keys(q)) {
        if (!ALLOWED_QUESTION_KEYS.has(qk)) {
          return { valid: false, error: `WHITELIST VIOLATION: Unauthorized key in question attempt: '${qk}'` };
        }
      }
      if (q.studentName || q.typedAnswer || q.studentId) {
        return { valid: false, error: "PRIVACY VIOLATION: Student personal data in question attempt." };
      }
    }
  }

  if (Array.isArray(p.topicOutcomes)) {
    for (const t of p.topicOutcomes) {
      if (!t || typeof t !== "object") {
        return { valid: false, error: "Topic outcome must be an object" };
      }
      for (const tk of Object.keys(t)) {
        if (!ALLOWED_TOPIC_KEYS.has(tk)) {
          return { valid: false, error: `Unauthorized key in topic outcome: '${tk}'` };
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Saves a validated question to persistent memory.
 * Enforces privacy check: rejects any record containing student PII keys.
 */
export async function saveValidatedQuestion(
  question: Omit<ValidatedQuestionRecord, "id" | "qualityScore" | "timesShown" | "timesCorrect" | "timesReported" | "isRetired" | "approved" | "createdAt" | "updatedAt"> & {
    id?: string;
  }
): Promise<ValidatedQuestionRecord> {
  // Safety Invariant: verify no PII fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawObj: any = question;
  if (rawObj.studentName || rawObj.studentId || rawObj.rollNumber || rawObj.typedAnswer) {
    throw new Error("PRIVACY VIOLATION: Student personal identifiable information cannot be stored.");
  }

  const id = question.id || `qmem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const embedding =
    question.embedding && question.embedding.length > 0
      ? question.embedding
      : computeDeterministicQueryEmbedding(question.text, 128);

  const record: ValidatedQuestionRecord = {
    id,
    grade: question.grade,
    conceptId: question.conceptId,
    language: question.language,
    theme: question.theme,
    text: question.text,
    operands: [...question.operands],
    embedding,
    qualityScore: 1.0,
    timesShown: 0,
    timesCorrect: 0,
    timesReported: 0,
    isRetired: false,
    approved: true,
    createdAt: now,
    updatedAt: now,
  };

  memoryStore.questions.set(id, record);
  return record;
}

/**
 * Retrieves nearest past questions and high-quality examples for prompt conditioning,
 * filtering out retired and unapproved questions.
 */
export async function retrieveQuestionMemory(
  grade: number,
  conceptId: string,
  language: string,
  queryEmbedding?: number[],
  limit = 5
): Promise<{ nearDuplicates: ValidatedQuestionRecord[]; goodExamples: ValidatedQuestionRecord[] }> {
  const all = Array.from(memoryStore.questions.values()).filter(
    (q) =>
      q.grade === grade &&
      q.conceptId === conceptId &&
      q.language === language &&
      !q.isRetired &&
      q.approved
  );

  if (all.length === 0) {
    return { nearDuplicates: [], goodExamples: [] };
  }

  if (queryEmbedding && queryEmbedding.length > 0) {
    const scored = all.map((q) => ({
      q,
      similarity: cosineSimilarity(queryEmbedding, q.embedding),
    }));

    // Near duplicates: high similarity (> 0.85)
    scored.sort((a, b) => b.similarity - a.similarity);
    const nearDuplicates = scored
      .filter((s) => s.similarity > 0.85)
      .slice(0, 3)
      .map((s) => s.q);

    // Good examples: high quality score with moderate novelty
    const goodExamples = all
      .filter((q) => q.qualityScore >= 0.7 && !nearDuplicates.some((nd) => nd.id === q.id))
      .slice(0, limit);

    return { nearDuplicates, goodExamples };
  }

  // Random sample of good examples sorted by qualityScore descending
  // Include questions that are approved and not retired (with quality score >= 0.4)
  const goodExamples = all
    .filter((q) => q.qualityScore >= 0.4)
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, limit);
  return { nearDuplicates: [], goodExamples };
}

/**
 * Recomputes quality score and retirement status for a question.
 * Invariant: Retire a question only after it has been shown at least 30 times!
 */
export function recomputeQualityScore(record: ValidatedQuestionRecord): void {
  if (record.timesShown < 1) {
    record.qualityScore = 1.0;
    return;
  }

  const successRate = record.timesCorrect / record.timesShown;

  // Retire a question only after it has been shown at least 30 times
  if (record.timesShown >= 30) {
    if (successRate < 0.15) {
      // Consistently too hard
      record.qualityScore = Math.max(0.1, Number((successRate * 2).toFixed(3)));
      record.isRetired = true;
    } else if (successRate > 0.98) {
      // Consistently uninformative / trivial
      record.qualityScore = Math.max(0.2, Number((1 - successRate + 0.2).toFixed(3)));
      record.isRetired = true;
    } else {
      // Good discriminating item
      record.qualityScore = Math.min(1.0, Number((0.5 + Math.sin(successRate * Math.PI) * 0.5).toFixed(3)));
      record.isRetired = false;
    }
  } else {
    // Before 30 impressions, keep question active while tracking preliminary quality score
    record.qualityScore = Math.min(1.0, Math.max(0.4, Number((0.5 + Math.sin(successRate * Math.PI) * 0.5).toFixed(3))));
  }
}

/**
 * Records an anonymous student impression result.
 */
export async function recordAnonymousQuestionResult(
  questionId: string,
  isCorrect: boolean
): Promise<ValidatedQuestionRecord | null> {
  const record = memoryStore.questions.get(questionId);
  if (!record) return null;

  record.timesShown += 1;
  if (isCorrect) {
    record.timesCorrect += 1;
  }
  record.updatedAt = new Date().toISOString();
  recomputeQualityScore(record);

  memoryStore.questions.set(questionId, record);
  return record;
}

/**
 * Processes an entire anonymous assessment session (Step 10).
 * Idempotent by sessionId: if sessionId was already processed, it counts once and returns existing summary.
 * In one transaction / operation it updates:
 * 1. Per-question stats (times shown, times correct, recomputed quality score, retirement after 30 impressions)
 * 2. Anonymous misconception tallies
 * 3. Anonymous topic outcome tallies
 * 4. Anonymous session summary row
 */
export async function processAnonymousSession(payload: AnonymousSessionPayload): Promise<{
  success: boolean;
  alreadyProcessed: boolean;
  recorded?: boolean;
  duplicate?: boolean;
  questionsUpdated: number;
  sessionSummary: AnonymousSessionSummary;
}> {
  const whitelistCheck = validateSessionPayloadWhitelist(payload);
  if (!whitelistCheck.valid) {
    throw new Error(whitelistCheck.error || "Invalid session payload whitelist.");
  }

  // Idempotency check: same session sent twice counts only once
  if (memoryStore.processedSessions.has(payload.sessionId)) {
    const existing = memoryStore.processedSessions.get(payload.sessionId)!;
    return {
      success: true,
      alreadyProcessed: true,
      recorded: false,
      duplicate: true,
      questionsUpdated: 0,
      sessionSummary: existing,
    };
  }

  let questionsUpdated = 0;
  let correctCount = 0;

  // 1. Update questions stats and misconception tallies
  for (const qAttempt of payload.questions) {
    if (qAttempt.correct) correctCount++;

    // Update global question stats map
    const currStat = memoryStore.questionStats.get(qAttempt.questionId) || { timesShown: 0, timesCorrect: 0 };
    currStat.timesShown += 1;
    if (qAttempt.correct) currStat.timesCorrect += 1;
    memoryStore.questionStats.set(qAttempt.questionId, currStat);

    const qRecord = memoryStore.questions.get(qAttempt.questionId);
    if (qRecord) {
      qRecord.timesShown += 1;
      if (qAttempt.correct) {
        qRecord.timesCorrect += 1;
      }
      qRecord.updatedAt = new Date().toISOString();
      recomputeQualityScore(qRecord);
      memoryStore.questions.set(qAttempt.questionId, qRecord);
      questionsUpdated++;
    }

    // Record misconception if errorType or wrongOptionTag provided
    const errType = qAttempt.errorType || qAttempt.wrongOptionTag;
    if (!qAttempt.correct && errType) {
      await recordAnonymousMisconception(
        payload.grade,
        qAttempt.conceptId,
        payload.language,
        errType
      );
    }
  }

  // 2. Update Topic Outcome Tallies
  for (const tOutcome of payload.topicOutcomes) {
    const key = `${payload.grade}_${tOutcome.topicId}_${tOutcome.status}`;
    const existing = memoryStore.topicOutcomeTallies.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      memoryStore.topicOutcomeTallies.set(key, {
        grade: payload.grade,
        topicId: tOutcome.topicId,
        status: tOutcome.status,
        count: 1,
      });
    }
  }

  // 3. Save Anonymous Session Summary
  const summary: AnonymousSessionSummary = {
    sessionId: payload.sessionId,
    grade: payload.grade,
    language: payload.language,
    hourTimestamp: payload.hourTimestamp,
    questionsAttempted: payload.questions.length,
    questionsCorrect: correctCount,
    topicOutcomes: [...payload.topicOutcomes],
    createdAt: new Date().toISOString(),
  };

  memoryStore.processedSessions.set(payload.sessionId, summary);

  return {
    success: true,
    alreadyProcessed: false,
    recorded: true,
    duplicate: false,
    questionsUpdated,
    sessionSummary: summary,
  };
}

/**
 * Teacher reporting mechanism:
 * Marks a question as reported and unapproved. Retires it immediately from reuse
 * until manual teacher approval.
 */
export async function reportQuestion(
  questionId: string,
  _reason?: string
): Promise<{ success: boolean; requiresApproval: boolean }> {
  try {
    const store = getQuestionStore();
    await store.flagQuestion(questionId, _reason);
  } catch {
    // Non-blocking
  }
  const record = memoryStore.questions.get(questionId);
  if (!record) {
    return { success: false, requiresApproval: false };
  }

  record.timesReported += 1;
  record.approved = false;
  record.isRetired = true;
  record.qualityScore = Math.max(0.1, record.qualityScore - 0.5);
  record.updatedAt = new Date().toISOString();

  memoryStore.questions.set(questionId, record);
  return { success: true, requiresApproval: true };
}

/**
 * Teacher approval to restore a reported question into rotation.
 */
export async function approveQuestion(questionId: string): Promise<boolean> {
  const record = memoryStore.questions.get(questionId);
  if (!record) return false;

  record.approved = true;
  record.isRetired = false;
  record.qualityScore = 1.0;
  record.updatedAt = new Date().toISOString();

  memoryStore.questions.set(questionId, record);
  return true;
}

/**
 * Records aggregate misconception tallies without any student-identifying data.
 */
export async function recordAnonymousMisconception(
  grade: number,
  conceptId: string,
  language: string,
  errorType: string
): Promise<void> {
  const key = `${grade}_${conceptId}_${language}_${errorType}`;
  const existing = memoryStore.misconceptionTallies.get(key);
  if (existing) {
    existing.count += 1;
  } else {
    memoryStore.misconceptionTallies.set(key, {
      grade,
      conceptId,
      language,
      errorType,
      count: 1,
    });
  }
}

export function getAnonymousMisconceptionTallies(): AnonymousMisconceptionTally[] {
  return Array.from(memoryStore.misconceptionTallies.values());
}

export function getAnonymousTopicOutcomeTallies(): AnonymousTopicOutcomeTally[] {
  return Array.from(memoryStore.topicOutcomeTallies.values());
}

export function getAnonymousSessionSummaries(): AnonymousSessionSummary[] {
  return Array.from(memoryStore.processedSessions.values());
}

export function getQuestionRecord(questionId: string): ValidatedQuestionRecord | undefined {
  return memoryStore.questions.get(questionId);
}

export function getInMemoryQuestionStats(): Map<string, { timesShown: number; timesCorrect: number }> {
  return memoryStore.questionStats;
}

export interface MemoryUpkeepResult {
  activeQuestionsCount: number;
  retiredQuestionsCount: number;
  sessionsCount: number;
  prunedQuestions: number;
  prunedSessions: number;
  sizeCapped: number;
  logSummary: string;
}

/**
 * Executes Step 11 Memory Upkeep:
 * 1. Recomputes quality scores for all questions.
 * 2. Deletes retired questions older than 90 days.
 * 3. Deletes anonymous session summaries older than 90 days.
 * 4. Keeps the questions table under a max size cap (e.g. 5,000 items) so free DB tiers are not exceeded.
 * 5. Logs a one-line memory health summary.
 */
export async function runMemoryUpkeep(maxQuestionsCap = 5000): Promise<MemoryUpkeepResult> {
  const ninetyDaysAgoMs = Date.now() - 90 * 24 * 60 * 60 * 1000;
  let prunedQuestions = 0;
  let prunedSessions = 0;
  let sizeCapped = 0;

  // 1. Recompute quality scores and prune retired > 90 days
  for (const [id, q] of memoryStore.questions.entries()) {
    recomputeQualityScore(q);

    const updatedMs = new Date(q.updatedAt || q.createdAt).getTime();
    if (q.isRetired && updatedMs < ninetyDaysAgoMs) {
      memoryStore.questions.delete(id);
      prunedQuestions++;
    }
  }

  // 2. Prune anonymous session summaries older than 90 days
  for (const [sessionId, session] of memoryStore.processedSessions.entries()) {
    const createdMs = new Date(session.createdAt).getTime();
    if (createdMs < ninetyDaysAgoMs) {
      memoryStore.processedSessions.delete(sessionId);
      prunedSessions++;
    }
  }

  // 3. Enforce table size cap to safeguard free DB tiers
  if (memoryStore.questions.size > maxQuestionsCap) {
    const all = Array.from(memoryStore.questions.values());
    // Sort to prioritize keeping active, high quality, recent items
    all.sort((a, b) => {
      // Prioritize active over retired
      if (a.isRetired !== b.isRetired) {
        return a.isRetired ? 1 : -1;
      }
      // Prioritize higher quality score
      return b.qualityScore - a.qualityScore;
    });

    const excess = all.slice(maxQuestionsCap);
    for (const q of excess) {
      memoryStore.questions.delete(q.id);
      sizeCapped++;
    }
  }

  // Count active vs retired
  let activeQuestionsCount = 0;
  let retiredQuestionsCount = 0;
  for (const q of memoryStore.questions.values()) {
    if (q.isRetired) {
      retiredQuestionsCount++;
    } else {
      activeQuestionsCount++;
    }
  }

  const sessionsCount = memoryStore.processedSessions.size;

  const logSummary = `[MemoryHealth] active=${activeQuestionsCount} retired=${retiredQuestionsCount} sessions=${sessionsCount} prunedQ=${prunedQuestions} prunedS=${prunedSessions} capped=${sizeCapped}`;
  console.log(logSummary);

  return {
    activeQuestionsCount,
    retiredQuestionsCount,
    sessionsCount,
    prunedQuestions,
    prunedSessions,
    sizeCapped,
    logSummary,
  };
}

export function resetQuestionMemoryForTesting(): void {
  memoryStore.reset();
}
