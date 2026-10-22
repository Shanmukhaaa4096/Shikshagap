// src/lib/questions/fingerprint.ts
/**
 * Deterministic Question Fingerprinting for ShikshaGap Question-Memory RAG.
 * Normalizes question text across languages and formats to detect duplicates.
 */

import crypto from "crypto";
import { normalizeIndicDigits } from "./normalizeAnswer.ts";

/**
 * Normalizes question text for fingerprint computation:
 * 1. Converts Indic digits to standard ASCII digits.
 * 2. Converts to lowercase.
 * 3. Strips punctuation, symbols, and extra whitespace.
 */
export function normalizeQuestionTextForFingerprint(text: string): string {
  if (!text) return "";
  const withAsciiDigits = normalizeIndicDigits(text);
  return withAsciiDigits
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "")
    .trim();
}

/**
 * Computes a SHA-256 fingerprint hash for a question.
 * Optionally incorporates sorted operands for invariant detection.
 */
export function computeQuestionFingerprint(text: string, operands?: number[]): string {
  const norm = normalizeQuestionTextForFingerprint(text);
  const operandPart = operands && operands.length > 0 ? `::${[...operands].sort((a, b) => a - b).join(",")}` : "";
  const payload = `${norm}${operandPart}`;
  return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
}
