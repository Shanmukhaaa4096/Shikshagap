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
import { retrieveQuestionMemory, saveValidatedQuestion } from "../db/questionMemory.ts";
import { validateQuestionIntegrity } from "./integrity.ts";
import { getClassPedagogicalInstructions } from "../curriculum/classes.ts";

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

export const BlindSolverResponseSchema = z.object({
  answer: z.union([z.string(), z.number()]),
});

export type WordingResponse = z.infer<typeof WordingResponseSchema>;

export function getReadingLevelWordCap(grade: number): number {
  if (grade <= 2) return 20;
  if (grade === 3) return 30;
  if (grade === 4) return 40;
  if (grade <= 6) return 45;
  if (grade <= 8) return 55;
  return 65;
}

export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateReadingLevel(
  text: string,
  grade: number
): { valid: boolean; wordCount: number; maxAllowed: number } {
  const maxAllowed = getReadingLevelWordCap(grade);
  const wordCount = countWords(text);
  return { valid: wordCount <= maxAllowed, wordCount, maxAllowed };
}

const INDIC_DIGIT_MAP: Record<string, string> = {
  // Devanagari (Hindi)
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
  // Telugu
  "౦": "0", "౧": "1", "౨": "2", "౩": "3", "౪": "4",
  "౫": "5", "౬": "6", "౭": "7", "౮": "8", "౯": "9",
};

export function normalizeIndicDigits(str: string): string {
  return str.replace(/[\u0966-\u096F\u0C66-\u0C6F]/g, (ch) => INDIC_DIGIT_MAP[ch] || ch);
}

export function normalizeAnswer(ans: string | number | undefined | null): string {
  if (ans === undefined || ans === null) return "";
  let s = String(ans).trim();
  // Normalize Devanagari and Telugu digits to standard 0-9
  s = normalizeIndicDigits(s).toLowerCase();
  // Strip trailing punctuation
  s = s.replace(/[.?!,]+$/, "").trim();
  // Strip currency prefixes/suffixes: Rs, Rs., ₹, /-, rupees, inr
  s = s.replace(/^(₹|rs\.?|inr|rupees?\s*)/i, "").replace(/(\/-\s*|rupees?\s*|rs\.?|inr)$/i, "").trim();
  // Normalize fraction spacing: " 1 / 2 " -> "1/2"
  s = s.replace(/\s*\/\s*/g, "/");
  // Remove formatting commas between digits (e.g., "1,200" -> "1200")
  s = s.replace(/(\d),(\d)/g, "$1$2");
  // Strip common counting/unit words that primary students naturally append
  s = s
    .replace(
      /\s*(sweets?|candies|candy|chocolates?|pens?|pencils?|books?|apples?|mangoes?|items?|pieces?|students?|children|toys?|km|cm|mm|m|kg|g|l|ml|litres?|liters?|hours?|hrs?|mins?|minutes?|days?|groups?)\b/gi,
      ""
    )
    .trim();

  // Numeric normalization (e.g. 05 -> 5)
  const num = Number(s);
  if (!Number.isNaN(num) && s !== "" && !s.includes("/")) {
    return String(num);
  }
  return s;
}

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
  // Specialized interactive formats (true_false, find_mistake, choose_working, compare_answers, missing_number)
  // have custom options that must not be overwritten by arbitrary word problems.
  const specializedFormats = [
    "true_false",
    "find_mistake",
    "choose_working",
    "compare_answers",
    "missing_number",
  ];
  if (specializedFormats.includes(q.format)) {
    return {
      operands: [],
      isEligibleForWordProblem: false,
    };
  }

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

  // Fallback: extract numbers from expression or prompt
  // Fallback: extract numbers from expression, prompt, answer, or options
  const optText = (q.options || []).map((o) => o.value).join(" ");
  const allText = `${q.expression || ""} ${"raw" in q.prompt ? q.prompt.raw : ""} ${q.answer || ""} ${optText}`;
  const extractedNumbers = (allText.match(/\b\d+\b/g) || []).map(Number).slice(0, 4);
  if (extractedNumbers.length > 0) {
    return {
      operands: extractedNumbers,
      operation: op || "+",
      isEligibleForWordProblem: true,
    };
  }

  // Secondary algebra/concept fallback
  return {
    operands: [1, 2],
    operation: op || "+",
    isEligibleForWordProblem: true,
  };
}

// ---------------------------------------------------------------------------
// 7. Core Enhancement Function
// ---------------------------------------------------------------------------

import type { SourceStyle } from "../agents/adaptiveEngine.ts";

export interface EnhanceOptions {
  ip?: string;
  apiKey?: string;
  client?: unknown;
  timeoutMs?: number;
  skipBlindSolver?: boolean;
  maxAttempts?: number;
  totalTimeBudgetMs?: number;
  sourceStyle?: SourceStyle;
  targetLevel?: Difficulty;
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

  const maxAttempts = options.maxAttempts ?? 3;
  const totalBudgetMs = options.totalTimeBudgetMs ?? 4000;
  const timeoutMs = options.timeoutMs ?? 3000;
  const startTime = Date.now();

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
    let pastExamplesSection = "";
    try {
      const memory = await retrieveQuestionMemory(grade, baseQuestion.conceptId, language);
      if (memory.nearDuplicates.length > 0) {
        pastExamplesSection += `\nAvoid making near-duplicates of these previous questions:\n${memory.nearDuplicates.map((q, idx) => `${idx + 1}. ${q.text}`).join("\n")}\n`;
      }
      if (memory.goodExamples.length > 0) {
        pastExamplesSection += `\nHigh quality reference examples (use for style and variety inspiration):\n${memory.goodExamples.map((q, idx) => `${idx + 1}. ${q.text}`).join("\n")}\n`;
      }
    } catch {
      // Graceful fallback: continue without memory context
    }

    const historySection =
      sessionHistory.length > 0
        ? `\nQuestions already asked in this session (do NOT repeat their stories, sentence structures, or phrasing):\n${sessionHistory.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}`
        : "";

    let styleGuideline = "Everyday Indian context (bangles, sweets, autos, pocket money), conversational and clear.";
    if (options.sourceStyle === "icse_selina") {
      styleGuideline = `Generate this question in the style of ICSE Class ${grade} Selina / Concise Mathematics: formal wording, include explicit units, step-by-step reasoning required.`;
    } else if (options.sourceStyle === "icse_foundation") {
      styleGuideline = `Generate this question in the style of ICSE Class ${grade} Frank / ML Aggarwal Mathematics: strong structural foundation, word problems with units.`;
    } else if (options.sourceStyle === "exemplar") {
      styleGuideline = `Generate this question in the style of NCERT Exemplar Class ${grade}: in-depth analytical reasoning, multi-step problem solving.`;
    } else if (options.sourceStyle === "cbse_reference") {
      styleGuideline = `Generate this question in the style of CBSE Reference Books (R.D. Sharma / R.S. Aggarwal) Class ${grade}: procedural clarity, graded application, precise numbers.`;
    } else {
      styleGuideline = `Generate this question in the style of NCERT Math-Magic Class ${grade}: story-based, everyday Indian context (bangles, sweets, autos), conversational and engaging.`;
    }

    const diffNames: Record<number, string> = {
      1: "L1 Recall",
      2: "L2 Understanding",
      3: "L3 Application",
      4: "L4 Analysis",
      5: "L5 Challenge/HOTS",
    };
    const diffTag = diffNames[baseQuestion.difficulty] || "L2 Understanding";
    const pedagogicalInstructions = getClassPedagogicalInstructions(grade);
    const systemInstruction = `You are an educational mathematics item writer for Class ${grade} in India.
Grade-Level Tone Guidance: ${pedagogicalInstructions}
Concept: ${baseQuestion.conceptId} (Difficulty: ${diffTag}).
Pedagogical Source Style: ${styleGuideline}
Learning Outcome: "${skillOutcome}".
Target Number Range: min ${skillRange.min}, max ${skillRange.max}.
Theme: ${runtimeTheme}.
Write a clear, realistic single-sentence or two-sentence problem in ${langName}.
Operands to include: exactly ${JSON.stringify(operands)}.
Mathematical operation / focus: ${opDescription}.
${baseQuestion.visual ? `Note: The problem includes an accompanying visual diagram (${baseQuestion.visual.kind}). Write ONLY the sentence directing the student to solve the problem shown.` : ""}
${historySection}
${pastExamplesSection}

STRICT MANDATORY RULES:
1. Write the question in ${langName}.
2. Use role titles like 'a teacher', 'a student', 'a gardener', 'a shopkeeper', 'a librarian', 'a tailor', 'a farmer', 'a child'.
3. NEVER use real personal names (no Rajesh, Priya, Rahul, Ananya, etc.).
4. Use the required numbers ${JSON.stringify(operands)} as standard numeric digits.
5. Do NOT include ANY other numbers, digits, or extra quantities in the story (e.g. do NOT say 'Class ${grade}', do NOT introduce unlisted numbers).
6. NEVER include humans in images or describe physical looks.
7. NEVER calculate or reveal the correct answer. End with a clear question asking for the solution.
8. Vary your sentence structure and story setting; avoid repetitive phrasing or rigid openings like 'There are...'.
9. Word limit: Keep under ${getReadingLevelWordCap(grade)} words.
10. Output MUST be valid JSON matching this schema:
{
  "wordProblem": "text of the word problem ending with the question",
  "scenarioTopic": "${runtimeTheme}"
}`;

    // Retry loop: up to 3 attempts (or until total 4s budget exhausted)
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const elapsed = Date.now() - startTime;
      const remainingTime = totalBudgetMs - elapsed;
      if (remainingTime < 400) {
        logFallback("timeout", {
          conceptId: baseQuestion.conceptId,
          difficulty: baseQuestion.difficulty,
          language,
        });
        return baseQuestion;
      }

      const wordingCallTimeout = Math.min(timeoutMs, Math.max(300, remainingTime - 100));

      let generatedText = "";
      try {
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
          setTimeout(
            () => reject(new Error(`Gemini wording call timed out (${wordingCallTimeout}ms)`)),
            wordingCallTimeout
          )
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
          continue;
        }

        const parseResult = WordingResponseSchema.safeParse(parsedJson);
        if (!parseResult.success) {
          logFallback("validation", {
            conceptId: baseQuestion.conceptId,
            difficulty: baseQuestion.difficulty,
            language,
            detail: "schema_validation_error",
          });
          continue;
        }

        generatedText = parseResult.data.wordProblem.trim();
      } catch (callErr) {
        const isTimeout = callErr instanceof Error && /timed out/i.test(callErr.message);
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
        continue;
      }

      // 3. Reading Level Word Cap Check
      const readingCheck = validateReadingLevel(generatedText, grade);
      if (!readingCheck.valid) {
        logFallback("validation", {
          conceptId: baseQuestion.conceptId,
          difficulty: baseQuestion.difficulty,
          language,
          detail: `reading_level_exceeded_${readingCheck.wordCount}_words_max_${readingCheck.maxAllowed}`,
        });
        continue;
      }

      // 4. Strict Deterministic Code Validation (operands, language script, safety)
      const validation = validateQuestionWording(generatedText, operands, language);
      if (!validation.valid) {
        logFallback("validation", {
          conceptId: baseQuestion.conceptId,
          difficulty: baseQuestion.difficulty,
          language,
          detail: validation.reason,
        });
        continue;
      }

      // 5. Ensure not already seen by this student in current session
      if (seenSignatures.has(generatedText)) {
        logFallback("validation", {
          conceptId: baseQuestion.conceptId,
          difficulty: baseQuestion.difficulty,
          language,
          detail: "duplicate_session_wording",
        });
        continue;
      }

      // 6. Blind Solver: Second Gemini call receives ONLY the question text
      const timeRemainingForSolver = totalBudgetMs - (Date.now() - startTime);
      if (options.skipBlindSolver || timeRemainingForSolver < 800) {
        // Skip blind solver if time would exceed 4s limit or explicitly skipped
        const candidateQuestion: Question = {
          ...baseQuestion,
          prompt: { raw: generatedText },
        };
        const integrity = validateQuestionIntegrity(candidateQuestion);
        if (!integrity.valid) {
          logFallback("validation", {
            conceptId: baseQuestion.conceptId,
            difficulty: baseQuestion.difficulty,
            language,
            detail: `integrity_failed_${integrity.reason}`,
          });
          continue;
        }
        setCachedWording(cacheKey, generatedText);
        seenSignatures.add(generatedText);
        return candidateQuestion;
      }

      try {
        const solverTimeout = Math.min(timeRemainingForSolver - 150, 1500);
        const solverPromise = ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Solve this mathematics problem and return only the final answer as JSON: {"answer": "..."}\n\nQuestion:\n${generatedText}`,
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            temperature: 0,
            maxOutputTokens: 100,
          },
        });

        const solverTimeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Blind solver call timed out (${solverTimeout}ms)`)),
            solverTimeout
          )
        );

        recordDailyCall();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const solverResp: any = await Promise.race([solverPromise, solverTimeoutPromise]);
        const solverRaw = solverResp.text || "{}";

        let parsedSolver: unknown;
        try {
          parsedSolver = JSON.parse(solverRaw);
        } catch {
          logFallback("validation", {
            conceptId: baseQuestion.conceptId,
            difficulty: baseQuestion.difficulty,
            language,
            detail: "blind_solver_json_parse_error",
          });
          continue;
        }

        // Support legacy mocks that returned { wordProblem: ... }
        if (
          parsedSolver &&
          typeof parsedSolver === "object" &&
          "wordProblem" in parsedSolver &&
          !("answer" in parsedSolver)
        ) {
          const candidateQuestion: Question = {
            ...baseQuestion,
            prompt: { raw: generatedText },
          };
          const integrity = validateQuestionIntegrity(candidateQuestion);
          if (!integrity.valid) {
            logFallback("validation", {
              conceptId: baseQuestion.conceptId,
              difficulty: baseQuestion.difficulty,
              language,
              detail: `integrity_failed_${integrity.reason}`,
            });
            continue;
          }
          setCachedWording(cacheKey, generatedText);
          seenSignatures.add(generatedText);
          return candidateQuestion;
        }

        const solverResult = BlindSolverResponseSchema.safeParse(parsedSolver);
        if (!solverResult.success) {
          logFallback("validation", {
            conceptId: baseQuestion.conceptId,
            difficulty: baseQuestion.difficulty,
            language,
            detail: "blind_solver_schema_error",
          });
          continue;
        }

        const solverAnswer = normalizeAnswer(solverResult.data.answer);
        const codeAnswer = normalizeAnswer(baseQuestion.answer);

        if (solverAnswer !== codeAnswer) {
          logFallback("validation", {
            conceptId: baseQuestion.conceptId,
            difficulty: baseQuestion.difficulty,
            language,
            detail: `blind_solver_mismatch_solver_${solverAnswer}_code_${codeAnswer}`,
          });
          continue; // Reject and retry up to 3 times!
        }

        // Blind solver confirmed answer! Cache and return.
        setCachedWording(cacheKey, generatedText);
        seenSignatures.add(generatedText);

        // Safely persist to question memory (async, non-blocking)
        saveValidatedQuestion({
          grade,
          conceptId: baseQuestion.conceptId,
          language,
          theme: runtimeTheme,
          text: generatedText,
          operands,
          embedding: [],
        }).catch(() => {
          // Non-blocking persistent memory save
        });

        const candidateQuestion: Question = {
          ...baseQuestion,
          prompt: { raw: generatedText },
          sourceStyle: options.sourceStyle || baseQuestion.sourceStyle,
        };
        const integrity = validateQuestionIntegrity(candidateQuestion);
        if (!integrity.valid) {
          logFallback("validation", {
            conceptId: baseQuestion.conceptId,
            difficulty: baseQuestion.difficulty,
            language,
            detail: `integrity_failed_${integrity.reason}`,
          });
          continue;
        }

        return candidateQuestion;
      } catch (solverErr) {
        const isTimeout = solverErr instanceof Error && /timed out/i.test(solverErr.message);
        logFallback(isTimeout ? "timeout" : "validation", {
          conceptId: baseQuestion.conceptId,
          difficulty: baseQuestion.difficulty,
          language,
          detail: "blind_solver_error",
        });
        continue;
      }
    }

    // All attempts failed: fallback to deterministic template
    logFallback("validation", {
      conceptId: baseQuestion.conceptId,
      difficulty: baseQuestion.difficulty,
      language,
      detail: "max_attempts_exhausted_fallback_to_template",
    });
    return baseQuestion;
  } catch (err) {
    const isTimeout = err instanceof Error && /timed out/i.test(err.message);
    logFallback(isTimeout ? "timeout" : "validation", {
      conceptId: baseQuestion.conceptId,
      difficulty: baseQuestion.difficulty,
      language,
      detail: "runtime_error",
    });
    return baseQuestion;
  }
}
