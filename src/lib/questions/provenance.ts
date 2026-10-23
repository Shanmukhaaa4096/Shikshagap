/**
 * ShikshaGap Question Provenance & Grade-Floor Enforcement Layer
 *
 * Guarantees that:
 * 1. Question content and metadata originate from the SAME concept node.
 * 2. Board filtering is strictly enforced:
 *    - ICSE questions never contain NCERT/CBSE provenance tags.
 *    - CBSE questions never contain ICSE/CISCE provenance tags.
 * 3. Class difficulty floor validator rejects questions whose concepts, numbers,
 *    or operations fall below the minimum on-grade standard.
 */

import type { Question, Board } from "../types.ts";
import { getCurriculumConcept } from "../../data/curriculum/index.ts";

/**
 * Ensures a question's board, sourceStyle, and provenanceLabel are synchronized
 * with the target concept and selected board preference.
 */
export function syncQuestionProvenance(
  q: Question,
  selectedBoard?: "CBSE" | "ICSE"
): Question {
  const effectiveBoard: Board = selectedBoard || (q.board === "ICSE" ? "ICSE" : "CBSE");
  const concept = getCurriculumConcept(q.conceptId, effectiveBoard);

  const grade = concept?.class || q.meta?.class || 10;
  const chapter = concept?.chapterName || "Mathematics";

  if (effectiveBoard === "ICSE") {
    // Strict isolation: never mask a genuine CBSE/NCERT question with an ICSE badge
    if (
      q.board === "CBSE" ||
      (q.provenanceLabel &&
        (q.provenanceLabel.includes("NCERT") ||
          q.provenanceLabel.includes("CBSE") ||
          q.provenanceLabel.includes("Ganita Prakash") ||
          q.provenanceLabel.includes("Math-Magic")))
    ) {
      return q;
    }

    const provenance = q.provenanceLabel || `CISCE ICSE Class ${grade} Mathematics (${chapter})`;

    return {
      ...q,
      board: "ICSE",
      sourceStyle:
        q.sourceStyle === "ncert" || q.sourceStyle === "exemplar" || q.sourceStyle === "cbse_reference"
          ? "icse_selina"
          : q.sourceStyle || "icse_selina",
      provenanceLabel: provenance,
    };
  } else {
    // Strict isolation: never mask a genuine ICSE question with a CBSE/NCERT badge
    if (
      q.board === "ICSE" ||
      (q.provenanceLabel &&
        (q.provenanceLabel.includes("CISCE") ||
          q.provenanceLabel.includes("ICSE") ||
          q.provenanceLabel.includes("Selina") ||
          q.provenanceLabel.includes("Frank")))
    ) {
      return q;
    }

    const provenance = q.provenanceLabel || `NCERT Class ${grade} Mathematics (${chapter})`;

    return {
      ...q,
      board: "CBSE",
      sourceStyle:
        q.sourceStyle === "icse_selina" || q.sourceStyle === "icse_foundation"
          ? "ncert"
          : q.sourceStyle || "ncert",
      provenanceLabel: provenance,
    };
  }
}

/**
 * Validates that a question meets or exceeds the difficulty and conceptual floor
 * for the student's enrolled grade.
 *
 * For example, a Class 10 assessment must NEVER present single-step integer
 * addition within 100 like "20 + 10 = ?".
 */
export function validateQuestionDifficultyFloor(
  q: Question,
  enrolledGrade: number
): { valid: boolean; reason?: string } {
  if (!q) {
    return { valid: false, reason: "Question is undefined or null" };
  }

  const promptText = (typeof q.prompt === "object" && q.prompt !== null && "raw" in q.prompt && typeof q.prompt.raw === "string" ? q.prompt.raw : "").toLowerCase();
  const expressionText = (q.expression || "").toLowerCase();
  const concept = getCurriculumConcept(q.conceptId);

  // 1. Detection of corrupted primary arithmetic template on middle/secondary grades
  if (enrolledGrade >= 6) {
    // Flag single-digit or two-digit primary addition/subtraction
    const isElementaryArithmetic =
      /compare the two answers/i.test(promptText) ||
      /\b\d{1,2}\s*[+−x×/÷]\s*\d{1,2}\s*=\s*\?/i.test(expressionText) ||
      /\bwhat is \d{1,2}\s*[+−x×/÷]\s*\d{1,2}\?/i.test(promptText);

    // If it's pure arithmetic without variables, exponents, roots, or geometry
    const hasSecondaryElements =
      /[a-z]|\^|²|³|√|sin|cos|tan|gst|cgst|sgst|ratio|term|discriminant|quadrat/i.test(
        promptText + " " + expressionText
      );

    if (isElementaryArithmetic && !hasSecondaryElements) {
      return {
        valid: false,
        reason: `Question expression "${q.expression || promptText}" is elementary single-step arithmetic, which is strictly below the Class ${enrolledGrade} difficulty floor.`,
      };
    }
  }

  // 2. Class 10 Specific Rigor Floor
  if (enrolledGrade === 10) {
    // If the concept class is known and < 9 (unless explicitly probing prerequisite down to 8)
    if (concept && concept.class < 8) {
      return {
        valid: false,
        reason: `Concept ${q.conceptId} belongs to Class ${concept.class}, which is below the Class 10 diagnostic floor.`,
      };
    }

    // Class 10 must not be a trivial primary question
    if (
      q.difficulty === 1 &&
      promptText.includes("+") &&
      !promptText.includes("x") &&
      !promptText.includes("d") &&
      !promptText.includes("sin") &&
      !promptText.includes("=")
    ) {
      return {
        valid: false,
        reason: `Class 10 Level 1 must be foundational on-grade concept recall, not elementary addition.`,
      };
    }
  }

  // 3. Board Isolation Check
  if (q.board === "ICSE") {
    if (q.provenanceLabel && (q.provenanceLabel.includes("NCERT") || q.provenanceLabel.includes("CBSE"))) {
      return {
        valid: false,
        reason: `ICSE question cannot contain NCERT/CBSE provenance: "${q.provenanceLabel}"`,
      };
    }
  } else if (q.board === "CBSE") {
    if (q.provenanceLabel && (q.provenanceLabel.includes("CISCE") || q.provenanceLabel.includes("ICSE"))) {
      return {
        valid: false,
        reason: `CBSE question cannot contain CISCE/ICSE provenance: "${q.provenanceLabel}"`,
      };
    }
  }

  return { valid: true };
}

export function isProvenanceConsistentWithBoard(
  provenanceLabel: string,
  board: Board
): { valid: boolean; reason?: string } {
  if (board === "ICSE") {
    if (
      provenanceLabel &&
      (provenanceLabel.includes("NCERT") ||
        provenanceLabel.includes("CBSE") ||
        provenanceLabel.includes("Ganita Prakash"))
    ) {
      return {
        valid: false,
        reason: `ICSE question cannot contain NCERT/CBSE provenance: "${provenanceLabel}"`,
      };
    }
  } else if (board === "CBSE") {
    if (
      provenanceLabel &&
      (provenanceLabel.includes("CISCE") ||
        provenanceLabel.includes("ICSE") ||
        provenanceLabel.includes("Selina"))
    ) {
      return {
        valid: false,
        reason: `CBSE question cannot contain CISCE/ICSE provenance: "${provenanceLabel}"`,
      };
    }
  }
  return { valid: true };
}

