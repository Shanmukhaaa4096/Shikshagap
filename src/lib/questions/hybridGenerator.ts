/**
 * ShikshaGap Hybrid Question Generator
 *
 * Combines deterministic mathematical ground-truth with Gemini contextual wording:
 * 1. Code chooses concept, difficulty, operands, distractors, and computes the answer.
 * 2. Gemini only generates the question wording (word problems in English, Hindi, or Telugu).
 * 3. Never sends the correct answer, student identifier, or student PII to Gemini.
 * 4. Code rigorously validates that every operand appears, rejects extra numbers,
 *    checks language/script fidelity, and enforces student name PII blacklists.
 * 5. Strict 3.0-second timeout; on timeout/error/validation failure, falls back to static template.
 * 6. In-memory LRU cache per skill, level, language, and operands, ensuring no duplicates within a session.
 * 7. Per-IP rate limiting and daily call budget to bound operational costs.
 */

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { ConceptId, Difficulty, Lang, Question } from "../types.ts";
import { getSkillEntry, getSkillRange } from "../../data/skillSheet.ts";

// ---------------------------------------------------------------------------
// 1. Zod Schema for Structured Output
// ---------------------------------------------------------------------------

export const WordingResponseSchema = z.object({
  wordProblem: z
    .string()
    .min(15, "Word problem too short")
    .max(350, "Word problem too long"),
  scenarioTopic: z.string().max(60).optional(),
});

export type WordingResponse = z.infer<typeof WordingResponseSchema>;

// ---------------------------------------------------------------------------
// 2. Blacklists & Regex Constants
// ---------------------------------------------------------------------------

export const PROHIBITED_NAMES_REGEX =
  /\b(rajesh|kumar|sharma|patel|singh|devi|priya|ananya|rahul|amit|pooja|sneha|mohan|rohit|ravi|sita|geeta|ramesh|suresh|anil|sunita|kavita|deepak|manoj|vijay|ajay|vikram|neha|swati|rekha)\b/i;

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const TELUGU_REGEX = /[\u0C00-\u0C7F]/;
const LATIN_LETTER_REGEX = /[a-zA-Z]/;

// ---------------------------------------------------------------------------
// 3. Validation Logic
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  extractedNumbers?: number[];
}

/**
 * Validates the generated wording against operands, extra numbers, language script, and safety.
 */
export function validateQuestionWording(
  text: string,
  operands: number[],
  language: Lang
): ValidationResult {
  const trimmed = text.trim();
  if (trimmed.length < 15) {
    return { valid: false, reason: "too_short" };
  }
  if (trimmed.length > 350) {
    return { valid: false, reason: "too_long" };
  }

  // 1. Safety & PII Check: No student names
  if (PROHIBITED_NAMES_REGEX.test(trimmed)) {
    return { valid: false, reason: "unsafe_pii_student_name" };
  }

  // 2. Language / Script Check
  if (language === "hi") {
    if (!DEVANAGARI_REGEX.test(trimmed)) {
      return { valid: false, reason: "wrong_language_hindi_missing_devanagari" };
    }
  } else if (language === "te") {
    if (!TELUGU_REGEX.test(trimmed)) {
      return { valid: false, reason: "wrong_language_telugu_missing_telugu_script" };
    }
  } else if (language === "en") {
    if (DEVANAGARI_REGEX.test(trimmed) || TELUGU_REGEX.test(trimmed)) {
      return { valid: false, reason: "wrong_language_english_has_indic_script" };
    }
    if (!LATIN_LETTER_REGEX.test(trimmed)) {
      return { valid: false, reason: "wrong_language_english_missing_latin" };
    }
  }

  // 3. Extract all integer numbers from text
  const numMatches = trimmed.match(/\b\d+\b/g) || [];
  const extractedNumbers = numMatches.map((n) => parseInt(n, 10));

  // 4. Operands check: Every operand must appear
  for (const op of operands) {
    if (!extractedNumbers.includes(op)) {
      return { valid: false, reason: `missing_operand_${op}`, extractedNumbers };
    }
  }

  // 5. Extra numbers check: No numbers other than operands are allowed
  const extraNumbers = extractedNumbers.filter((n) => !operands.includes(n));
  if (extraNumbers.length > 0) {
    return { valid: false, reason: "extra_numbers_present", extractedNumbers };
  }

  return { valid: true, extractedNumbers };
}

// ---------------------------------------------------------------------------
// 4. Rate Limiting & Daily Call Budget
// ---------------------------------------------------------------------------

export const DAILY_BUDGET_LIMIT = 1000;
let dailyCallsCount = 0;
let currentDayKey = new Date().toISOString().slice(0, 10);

// Per-IP rate limiting for question wording calls (max 30 requests/minute per IP)
const ipRateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkIpWordingLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRateLimits.get(ip);
  if (!record || now > record.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }
  if (record.count >= 30) {
    return false;
  }
  record.count += 1;
  return true;
}

export function checkDailyBudget(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== currentDayKey) {
    currentDayKey = today;
    dailyCallsCount = 0;
  }
  return dailyCallsCount < DAILY_BUDGET_LIMIT;
}

export function recordDailyCall(): void {
  dailyCallsCount += 1;
}

export function getDailyCallCount(): number {
  return dailyCallsCount;
}

// ---------------------------------------------------------------------------
// 4b. Fallback Logging (Zero Student Data)
// ---------------------------------------------------------------------------

export type FallbackReason =
  | "timeout"
  | "validation"
  | "no_key"
  | "budget"
  | "rate_limit";

export interface FallbackLogEntry {
  reason: FallbackReason;
  timestamp: number;
  conceptId?: string;
  difficulty?: number;
  language?: string;
  detail?: string;
}

const fallbackHistory: FallbackLogEntry[] = [];

/**
 * Logs question generation fallback events.
 * Strictly forbidden from recording student names, IDs, or answers.
 */
export function logFallback(
  reason: FallbackReason,
  meta?: { conceptId?: string; difficulty?: number; language?: string; detail?: string }
): void {
  const entry: FallbackLogEntry = {
    reason,
    timestamp: Date.now(),
    conceptId: meta?.conceptId,
    difficulty: meta?.difficulty,
    language: meta?.language,
    detail: meta?.detail,
  };
  fallbackHistory.push(entry);
  console.warn(`[HybridFallback] reason: ${reason} (concept: ${meta?.conceptId || "none"}, lang: ${meta?.language || "none"})`);
}

export function getFallbackHistory(): FallbackLogEntry[] {
  return [...fallbackHistory];
}

export function clearFallbackHistory(): void {
  fallbackHistory.length = 0;
}

export function resetBudgetAndLimitsForTesting(): void {
  dailyCallsCount = 0;
  currentDayKey = new Date().toISOString().slice(0, 10);
  ipRateLimits.clear();
  wordingCache.clear();
  clearFallbackHistory();
}

// ---------------------------------------------------------------------------
// 5. In-Memory Wording Cache & Session Deduplication
// ---------------------------------------------------------------------------

// Cache key: `${conceptId}:${level}:${language}:${operandsKey}`
const wordingCache = new Map<string, string[]>();

export function getWordingCacheKey(
  conceptId: ConceptId,
  difficulty: Difficulty,
  language: Lang,
  operands: number[]
): string {
  return `${conceptId}:${difficulty}:${language}:${operands.join("_")}`;
}

export function getCachedWording(key: string, seenSignatures: Set<string>): string | null {
  const cachedList = wordingCache.get(key);
  if (!cachedList || cachedList.length === 0) return null;
  // Pick one not seen in current student session
  for (const text of cachedList) {
    if (!seenSignatures.has(text)) {
      return text;
    }
  }
  return null;
}

export function setCachedWording(key: string, wording: string): void {
  const list = wordingCache.get(key) || [];
  if (!list.includes(wording)) {
    if (list.length >= 10) list.shift();
    list.push(wording);
    wordingCache.set(key, list);
  }
}

// ---------------------------------------------------------------------------
// 6. Operand Extraction from Question & Runtime Themes
// ---------------------------------------------------------------------------

export const RUNTIME_THEMES = [
  "local weekly market (haat / santhe)",
  "school sports day and playground games",
  "classroom library and reading corner",
  "community kitchen and food sharing",
  "bus or train journey ticket counter",
  "planting saplings in the village garden",
  "craft workshop with origami and clay",
  "nature walk and bird sanctuary",
];

export function pickRuntimeTheme(rng?: () => number): string {
  const r = rng ? rng() : Math.random();
  const idx = Math.floor(r * RUNTIME_THEMES.length);
  return RUNTIME_THEMES[idx] || RUNTIME_THEMES[0];
}

export interface ExtractedQuestionOperands {
  operands: number[];
  operation?: string;
  isEligibleForWordProblem: boolean;
}

export function extractQuestionOperands(q: Question): ExtractedQuestionOperands | null {
  const a = q.meta?.a;
  const b = q.meta?.b;
  const op = q.meta?.op;

  // Dual numeric operands (covers addition, subtraction, multiplication, division, fractions)
  if (typeof a === "number" && typeof b === "number") {
    return {
      operands: [a, b],
      operation: op,
      isEligibleForWordProblem: true,
    };
  }

  // Single operand with digit param (e.g. place value)
  if (typeof a === "number") {
    const digit =
      q.prompt && "key" in q.prompt && typeof q.prompt.params?.digit === "number"
        ? q.prompt.params.digit
        : undefined;
    return {
      operands: digit !== undefined ? [a, digit] : [a],
      operation: op,
      isEligibleForWordProblem: true,
    };
  }

  // Fallback checking prompt params
  if (q.prompt && "key" in q.prompt && q.prompt.params) {
    const params = q.prompt.params;
    const nums: number[] = [];
    if (typeof params.a === "number") nums.push(params.a);
    if (typeof params.b === "number") nums.push(params.b);
    if (typeof params.total === "number") nums.push(params.total);
    if (typeof params.n === "number") nums.push(params.n);
    if (typeof params.groups === "number") nums.push(params.groups);
    if (typeof params.each === "number") nums.push(params.each);
    if (typeof params.spent === "number") nums.push(params.spent);
    if (typeof params.cost === "number") nums.push(params.cost);
    if (nums.length > 0) {
      return {
        operands: nums,
        operation: op,
        isEligibleForWordProblem: true,
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// 7. Core Enhancement Function
// ---------------------------------------------------------------------------

export interface EnhanceOptions {
  ip?: string;
  apiKey?: string;
  client?: unknown;
  timeoutMs?: number;
}

/**
 * Enhances a deterministically generated Question with dynamic Gemini wording.
 * Keeps answer, options, format, and distractors 100% code-computed.
 * Falls back to base question prompt if validation fails or call times out.
 */
export async function enhanceQuestionWithHybridWording(
  baseQuestion: Question,
  language: Lang,
  grade: number,
  seenSignatures: Set<string>,
  options: EnhanceOptions = {}
): Promise<Question> {
  const extracted = extractQuestionOperands(baseQuestion);

  // If question is not a word problem / has no dual operands, preserve base template
  if (!extracted || !extracted.isEligibleForWordProblem || extracted.operands.length === 0) {
    return baseQuestion;
  }

  const { operands, operation } = extracted;
  const cacheKey = getWordingCacheKey(
    baseQuestion.conceptId,
    baseQuestion.difficulty,
    language,
    operands
  );

  // 1. Check in-memory cache for validated wording not yet seen by this student
  const cached = getCachedWording(cacheKey, seenSignatures);
  if (cached) {
    seenSignatures.add(cached);
    return {
      ...baseQuestion,
      prompt: { raw: cached },
    };
  }

  // 2. Budget & Rate Limit Checks
  const clientIp = options.ip || "127.0.0.1";
  if (!checkIpWordingLimit(clientIp)) {
    logFallback("rate_limit", {
      conceptId: baseQuestion.conceptId,
      difficulty: baseQuestion.difficulty,
      language,
    });
    return baseQuestion;
  }
  if (!checkDailyBudget()) {
    logFallback("budget", {
      conceptId: baseQuestion.conceptId,
      difficulty: baseQuestion.difficulty,
      language,
    });
    return baseQuestion;
  }

  const effectiveApiKey = options.apiKey || process.env.GEMINI_API_KEY;
  const client = options.client;

  // If no Gemini client or API key, return deterministic fallback template immediately
  if (!client && !effectiveApiKey) {
    logFallback("no_key", {
      conceptId: baseQuestion.conceptId,
      difficulty: baseQuestion.difficulty,
      language,
    });
    return baseQuestion;
  }

  const timeoutMs = options.timeoutMs ?? 3000;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai: any = client || new GoogleGenAI({ apiKey: effectiveApiKey });
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const langName =
      language === "hi"
        ? "Hindi (हिंदी)"
        : language === "te"
        ? "Telugu (తెలుగు)"
        : "English";

    const opDescription =
      operation === "+"
        ? "addition (finding total items)"
        : operation === "-"
        ? "subtraction (finding remaining items)"
        : operation === "x"
        ? "multiplication (repeated groups or arrays)"
        : operation === "/"
        ? "division (equal sharing or finding groups)"
        : "arithmetic problem solving";

    const skillEntry = getSkillEntry(baseQuestion.conceptId, grade);
    const skillOutcome = skillEntry?.outcome || "Solve the mathematics problem accurately.";
    const skillRange = getSkillRange(baseQuestion.conceptId, grade, baseQuestion.difficulty);
    const runtimeTheme = pickRuntimeTheme();

    const sessionHistory = Array.from(seenSignatures).slice(-5);
    const historySection =
      sessionHistory.length > 0
        ? `\nQuestions already asked in this session (do NOT repeat their stories, sentence structures, or phrasing):\n${sessionHistory.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}`
        : "";

    const systemInstruction = `You are an educational mathematics item writer for Class ${grade} in India.
Concept: ${baseQuestion.conceptId} (Difficulty Level ${baseQuestion.difficulty}).
Learning Outcome: "${skillOutcome}".
Target Number Range: min ${skillRange.min}, max ${skillRange.max}.
Theme: ${runtimeTheme}.
Write a clear, realistic single-sentence or two-sentence problem in ${langName}.
Operands to include: exactly ${JSON.stringify(operands)}.
Mathematical operation / focus: ${opDescription}.
${baseQuestion.visual ? `Note: The problem includes an accompanying visual diagram (${baseQuestion.visual.kind}). Write ONLY the sentence directing the student to solve the problem shown.` : ""}
${historySection}

STRICT MANDATORY RULES:
1. Write the question in ${langName}.
2. Use role titles like 'a teacher', 'a student', 'a gardener', 'a shopkeeper', 'a librarian', 'a tailor', 'a farmer', 'a child'.
3. NEVER use real personal names (no Rajesh, Priya, Rahul, Ananya, etc.).
4. Use the required numbers ${JSON.stringify(operands)} as standard numeric digits.
5. Do NOT include ANY other numbers, digits, or extra quantities in the story (e.g. do NOT say 'Class ${grade}', do NOT introduce unlisted numbers).
6. NEVER include humans in images or describe physical looks.
7. NEVER calculate or reveal the correct answer. End with a clear question asking for the solution.
8. Vary your sentence structure and story setting; avoid repetitive phrasing or rigid openings like 'There are...'.
9. Output MUST be valid JSON matching this schema:
{
  "wordProblem": "text of the word problem ending with the question",
  "scenarioTopic": "${runtimeTheme}"
}`;

    const generatePromise = ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\nOperands: ${JSON.stringify(operands)}` }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 250,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini wording call timed out (${timeoutMs}ms)`)), timeoutMs)
    );

    recordDailyCall();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await Promise.race([generatePromise, timeoutPromise]);
    const rawText = response.text || "{}";

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      logFallback("validation", {
        conceptId: baseQuestion.conceptId,
        difficulty: baseQuestion.difficulty,
        language,
        detail: "json_parse_error",
      });
      return baseQuestion;
    }

    const parseResult = WordingResponseSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      logFallback("validation", {
        conceptId: baseQuestion.conceptId,
        difficulty: baseQuestion.difficulty,
        language,
        detail: "schema_validation_error",
      });
      return baseQuestion;
    }

    const generatedText = parseResult.data.wordProblem.trim();

    // 3. Strict Deterministic Code Validation
    const validation = validateQuestionWording(generatedText, operands, language);
    if (!validation.valid) {
      logFallback("validation", {
        conceptId: baseQuestion.conceptId,
        difficulty: baseQuestion.difficulty,
        language,
        detail: validation.reason,
      });
      return baseQuestion;
    }

    // 4. Ensure not already seen by this student in current session
    if (seenSignatures.has(generatedText)) {
      logFallback("validation", {
        conceptId: baseQuestion.conceptId,
        difficulty: baseQuestion.difficulty,
        language,
        detail: "duplicate_session_wording",
      });
      return baseQuestion;
    }

    // 5. Cache and return
    setCachedWording(cacheKey, generatedText);
    seenSignatures.add(generatedText);

    return {
      ...baseQuestion,
      prompt: { raw: generatedText },
    };
  } catch (err) {
    const isTimeout = err instanceof Error && /timed out/i.test(err.message);
    if (isTimeout) {
      logFallback("timeout", {
        conceptId: baseQuestion.conceptId,
        difficulty: baseQuestion.difficulty,
        language,
      });
    } else {
      logFallback("validation", {
        conceptId: baseQuestion.conceptId,
        difficulty: baseQuestion.difficulty,
        language,
        detail: "runtime_error",
      });
    }
    return baseQuestion;
  }
}
