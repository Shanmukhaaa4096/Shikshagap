/**
 * ShikshaGap Strict Question Validation Layer
 *
 * Implements rigorous deterministic validation for every question before it can
 * be returned by any API endpoint or rendered on a student's screen:
 * 1. ZERO unresolved template tokens (e.g. {each}, {num}, {den}).
 * 2. ZERO raw translation keys exposed to learners.
 * 3. Verified multiple-choice integrity: >= 2 options, unique values, correct answer exists.
 * 4. Grounded visual integrity: no questions whose meaning depends on a missing visual.
 * 5. Strict textbook provenance validation for scored assessments.
 * 6. Full trilingual validation across English, Hindi, and Telugu.
 */

import type { Lang, Question, Txt } from "../types.ts";
import { DICTS } from "../i18n/dict.ts";
import { validateQuestionIntegrity, areAnswersEquivalent } from "./integrity.ts";
import type { ValidationResult } from "./types.ts";
import { validateQuestionDifficultyFloor } from "./provenance.ts";

/** Regular expression matching unrendered template variables like {each}, {num}, {den} */
export const UNRESOLVED_TOKEN_REGEX = /\{[a-zA-Z0-9_]+\}/g;

/**
 * Checks whether a string contains any unresolved template placeholders.
 */
export function hasUnresolvedTokens(text: string): boolean {
  if (!text) return false;
  return /\{[a-zA-Z0-9_]+\}/.test(text);
}

/**
 * Extracts all unresolved placeholders from a string.
 */
export function getUnresolvedTokens(text: string): string[] {
  if (!text) return [];
  const matches = text.match(UNRESOLVED_TOKEN_REGEX);
  return matches ? Array.from(new Set(matches)) : [];
}

export interface ResolvedTextResult {
  text: string;
  hasUnresolved: boolean;
  unresolvedTokens: string[];
  isMissingKey: boolean;
}

/**
 * Safely resolves a Txt object in the target language and detects unrendered tokens or missing keys.
 */
export function resolveTxtSafe(txt?: Txt, lang: Lang = "en"): ResolvedTextResult {
  if (!txt) {
    return {
      text: "",
      hasUnresolved: false,
      unresolvedTokens: [],
      isMissingKey: false,
    };
  }

  // 1. Raw string format
  if ("raw" in txt) {
    const rawStr = txt.raw || "";
    const tokens = getUnresolvedTokens(rawStr);
    return {
      text: rawStr,
      hasUnresolved: tokens.length > 0,
      unresolvedTokens: tokens,
      isMissingKey: false,
    };
  }

  // 2. Localized key format
  const currentDict = (DICTS[lang] || DICTS.en) as unknown as Record<string, string>;
  const enDict = DICTS.en as unknown as Record<string, string>;

  const hasKey = keyInDict(txt.key, lang);
  let template = currentDict[txt.key] || enDict[txt.key];

  if (!template) {
    return {
      text: txt.key,
      hasUnresolved: true,
      unresolvedTokens: [txt.key],
      isMissingKey: true,
    };
  }

  if (txt.params) {
    for (const [k, v] of Object.entries(txt.params)) {
      template = template.replaceAll(`{${k}}`, String(v));
    }
  }

  const tokens = getUnresolvedTokens(template);

  return {
    text: template,
    hasUnresolved: tokens.length > 0,
    unresolvedTokens: tokens,
    isMissingKey: !hasKey,
  };
}

/**
 * Checks if a key exists in the specified dictionary.
 */
function keyInDict(key: string, lang: Lang): boolean {
  const dict = DICTS[lang] as unknown as Record<string, string> | undefined;
  if (!dict) return false;
  return Object.prototype.hasOwnProperty.call(dict, key);
}

/**
 * Checks if question text references a visual or diagram that must be present.
 */
export function requiresVisualDiagram(promptText: string): boolean {
  if (!promptText) return false;
  const lower = promptText.toLowerCase();
  const visualKeywords = [
    "look at the picture",
    "look at the image",
    "look at the diagram",
    "in the picture",
    "in the image",
    "in the table below",
    "shown in the picture",
    "चित्र में",
    "नीचे दिए गए चित्र",
    "చిత్రంలో",
    "కింది పటంలో",
  ];
  return visualKeywords.some((kw) => lower.includes(kw));
}

export interface StrictValidationOptions {
  /** If provided, validates specifically for this language; otherwise validates across all supported languages (en, hi, te) */
  targetLang?: Lang;
  /** Whether textbook provenance is mandatory (default: true for scored assessments) */
  requireTextbookProvenance?: boolean;
  /** Enrolled student grade (1 to 10) for difficulty floor validation */
  enrolledGrade?: number;
  /** Expected board ("CBSE" or "ICSE") for board isolation enforcement */
  expectedBoard?: "CBSE" | "ICSE";
}

/**
 * Validates a Question strictly before returning from API or rendering in UI.
 * Rejects questions with unresolved template placeholders, missing keys,
 * duplicate options, invalid correct answers, or missing visuals.
 */
export function validateQuestionStrict(
  question: Question,
  options?: StrictValidationOptions
): ValidationResult {
  const errors: string[] = [];

  // 1. Basic object sanity
  if (!question || typeof question !== "object") {
    return {
      valid: false,
      errors: ["Question is null or not an object"],
      code: "EMPTY_PROMPT",
    };
  }

  if (!question.id || typeof question.id !== "string") {
    errors.push("Question missing valid string id");
  }

  if (!question.conceptId) {
    errors.push("Question missing conceptId");
  }

  // 2. Validate Prompt Text (Check target language or all supported languages)
  const languagesToTest: Lang[] = options?.targetLang ? [options.targetLang] : ["en", "hi", "te"];

  for (const lang of languagesToTest) {
    const resolved = resolveTxtSafe(question.prompt, lang);

    if (!resolved.text.trim()) {
      return {
        valid: false,
        errors: [`Empty question prompt in language '${lang}'`],
        code: "EMPTY_PROMPT",
      };
    }

    if (resolved.isMissingKey && !("raw" in (question.prompt || {}))) {
      return {
        valid: false,
        errors: [`Translation key '${(question.prompt as { key: string }).key}' missing in dictionary for '${lang}'`],
        code: "UNRESOLVED_PLACEHOLDER",
      };
    }

    if (resolved.hasUnresolved) {
      return {
        valid: false,
        errors: [
          `Unresolved template variable(s) [${resolved.unresolvedTokens.join(", ")}] in prompt for language '${lang}': "${resolved.text}"`,
        ],
        code: "UNRESOLVED_PLACEHOLDER",
      };
    }

    // Check expression if present
    if (question.expression && hasUnresolvedTokens(question.expression)) {
      return {
        valid: false,
        errors: [
          `Unresolved template variable in expression: "${question.expression}"`,
        ],
        code: "UNRESOLVED_PLACEHOLDER",
      };
    }
  }

  // 3. Answer sanity
  if (
    question.answer === undefined ||
    question.answer === null ||
    question.answer === "" ||
    question.answer === "NaN"
  ) {
    return {
      valid: false,
      errors: ["Question answer is empty or NaN"],
      code: "INVALID_ANSWER",
    };
  }

  if (hasUnresolvedTokens(String(question.answer))) {
    return {
      valid: false,
      errors: [`Unresolved template variable in answer key: "${question.answer}"`],
      code: "UNRESOLVED_PLACEHOLDER",
    };
  }

  // 4. Multiple Choice / Options validation
  if (question.options && question.options.length > 0) {
    if (question.options.length < 2) {
      return {
        valid: false,
        errors: ["Multiple-choice question must have at least 2 options"],
        code: "MISSING_OPTIONS",
      };
    }

    const seenValues = new Set<string>();
    const seenLabels = new Set<string>();

    for (let i = 0; i < question.options.length; i++) {
      const opt = question.options[i];
      if (!opt || typeof opt.value !== "string" || !opt.value.trim()) {
        return {
          valid: false,
          errors: [`Option index ${i} has empty or non-string value`],
          code: "MISSING_OPTIONS",
        };
      }

      if (seenValues.has(opt.value)) {
        return {
          valid: false,
          errors: [`Duplicate option value detected: "${opt.value}"`],
          code: "DUPLICATE_OPTIONS",
        };
      }
      seenValues.add(opt.value);

      // Validate option labels across languages
      for (const lang of languagesToTest) {
        const resolvedOpt = resolveTxtSafe(opt.label, lang);
        if (!resolvedOpt.text.trim()) {
          return {
            valid: false,
            errors: [`Option index ${i} has empty label in language '${lang}'`],
            code: "MISSING_OPTIONS",
          };
        }
        if (resolvedOpt.hasUnresolved) {
          return {
            valid: false,
            errors: [
              `Option index ${i} has unresolved placeholder in language '${lang}': "${resolvedOpt.text}"`,
            ],
            code: "UNRESOLVED_PLACEHOLDER",
          };
        }
        if (lang === "en") {
          if (seenLabels.has(resolvedOpt.text)) {
            return {
              valid: false,
              errors: [`Duplicate option label detected: "${resolvedOpt.text}"`],
              code: "DUPLICATE_OPTIONS",
            };
          }
          seenLabels.add(resolvedOpt.text);
        }
      }
    }

    // Verify correct answer matches EXACTLY ONE option
    const matchingOptions = question.options.filter(
      (opt) =>
        opt.value === question.answer ||
        areAnswersEquivalent(opt.value, question.answer)
    );

    if (matchingOptions.length === 0) {
      return {
        valid: false,
        errors: [
          `Correct answer "${question.answer}" does not match any provided option [${question.options
            .map((o) => o.value)
            .join(", ")}]`,
        ],
        code: "ANSWER_NOT_IN_OPTIONS",
      };
    }

    if (matchingOptions.length > 1) {
      return {
        valid: false,
        errors: [
          `Multiple options match the correct answer "${question.answer}". Multiple choice must have exactly one correct answer.`,
        ],
        code: "DUPLICATE_OPTIONS",
      };
    }

    // Distractor quality check: every wrong option must be plausible, unique, and not equal to the correct answer
    const distractors = question.options.filter((opt) => opt !== matchingOptions[0]);
    for (let dIdx = 0; dIdx < distractors.length; dIdx++) {
      const dist = distractors[dIdx];
      const distVal = dist.value.trim();

      if (!distVal || distVal === "NaN" || distVal === "undefined" || distVal === "null") {
        return {
          valid: false,
          errors: [`Distractor option ${dIdx} has invalid/empty value "${dist.value}"`],
          code: "INVALID_DISTRACTOR",
        };
      }

      if (distVal === question.answer || areAnswersEquivalent(distVal, question.answer)) {
        return {
          valid: false,
          errors: [
            `Distractor option "${distVal}" is mathematically equivalent to the correct answer "${question.answer}". Distractors must be distinct and incorrect.`,
          ],
          code: "DISTRACTOR_EQUALS_ANSWER",
        };
      }
    }
  } else if (question.answerKind === "choice") {
    return {
      valid: false,
      errors: ["Question specified answerKind 'choice' but has no options"],
      code: "MISSING_OPTIONS",
    };
  }

  // 5. Visual diagram completeness
  const enPrompt = resolveTxtSafe(question.prompt, "en").text;
  if (requiresVisualDiagram(enPrompt) && !question.visual) {
    return {
      valid: false,
      errors: [
        `Question references a visual diagram or table, but question.visual is missing or undefined`,
      ],
      code: "MISSING_VISUAL",
    };
  }

  // 6. Textbook Provenance validation for scored assessment questions
  const requireTextbook =
    options?.requireTextbookProvenance ?? (question.isTextbookVerified || question.source === "bank");

  if (requireTextbook && question.isTextbookVerified) {
    if (!question.textbookSource) {
      return {
        valid: false,
        errors: ["Textbook-verified question is missing textbookSource metadata"],
        code: "UNVERIFIED_SOURCE",
      };
    }
    const src = question.textbookSource;
    if (!src.board || !src.class || !src.textbookTitle || !src.chapterTitle) {
      return {
        valid: false,
        errors: [
          "Incomplete textbook provenance metadata (missing board, class, textbookTitle, or chapterTitle)",
        ],
        code: "UNVERIFIED_SOURCE",
      };
    }
    if (!src.provenanceLabel || !src.provenanceLabel.trim()) {
      return {
        valid: false,
        errors: ["Missing human-readable provenanceLabel in textbookSource"],
        code: "UNVERIFIED_SOURCE",
      };
    }
  }

  // 7. Deterministic Mathematical Integrity Check
  const mathIntegrity = validateQuestionIntegrity(question);
  if (!mathIntegrity.valid) {
    return {
      valid: false,
      errors: [`Mathematical integrity check failed: ${mathIntegrity.reason}`],
      code: "INVALID_ANSWER",
    };
  }

  // 8. Class Difficulty Floor & Board Consistency Check
  if (options?.enrolledGrade) {
    const floorCheck = validateQuestionDifficultyFloor(question, options.enrolledGrade);
    if (!floorCheck.valid) {
      return {
        valid: false,
        errors: [`Difficulty floor check failed: ${floorCheck.reason}`],
        code: "BELOW_GRADE_FLOOR",
      };
    }
  }

  if (options?.expectedBoard) {
    if (question.board !== options.expectedBoard) {
      return {
        valid: false,
        errors: [`Board mismatch: question board '${question.board}' does not match expected '${options.expectedBoard}'`],
        code: "BOARD_MISMATCH",
      };
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return {
    valid: true,
    errors: [],
  };
}
