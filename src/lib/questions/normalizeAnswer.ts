// src/lib/questions/normalizeAnswer.ts
/**
 * Trilingual answer normalization for ShikshaGap assessment inputs.
 * Normalizes Indic digits (Devanagari, Telugu), removes common counting units,
 * strips currency markers, and handles fractions.
 */

export const INDIC_DIGIT_MAP: Record<string, string> = {
  // Devanagari 0-9
  "\u0966": "0",
  "\u0967": "1",
  "\u0968": "2",
  "\u0969": "3",
  "\u096A": "4",
  "\u096B": "5",
  "\u096C": "6",
  "\u096D": "7",
  "\u096E": "8",
  "\u096F": "9",
  // Telugu 0-9
  "\u0C66": "0",
  "\u0C67": "1",
  "\u0C68": "2",
  "\u0C69": "3",
  "\u0C6A": "4",
  "\u0C6B": "5",
  "\u0C6C": "6",
  "\u0C6D": "7",
  "\u0C6E": "8",
  "\u0C6F": "9",
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
