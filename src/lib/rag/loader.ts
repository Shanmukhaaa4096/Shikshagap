import fs from "fs";
import path from "path";
import { KnowledgeCorpusFileSchema } from "./schema.ts";
import type { KnowledgeChunk } from "./schema.ts";
import { CURRICULUM_REGISTRY } from "../../data/curriculum/index.ts";
import { CONCEPTS } from "../concepts/graph.ts";

/**
 * Checks if a conceptId exists in the curriculum DAG.
 * Checks both the full K-10 curriculum registry (CBSE/ICSE) and the core primary DAG concepts.
 */
export function isConceptInDAG(conceptId: string): boolean {
  if (!conceptId) return false;
  if (CURRICULUM_REGISTRY[conceptId]) return true;
  if (CONCEPTS[conceptId as keyof typeof CONCEPTS]) return true;
  return false;
}

/**
 * Validates a list of knowledge chunks against curriculum DAG and license requirements.
 * Throws an Error if any chunk is invalid or unanchored in the DAG.
 */
export function validateKnowledgeChunks(chunks: unknown[], sourceIdentifier = "knowledge chunks"): KnowledgeChunk[] {
  const parseResult = KnowledgeCorpusFileSchema.safeParse(chunks);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((issue) => `[Path: ${issue.path.join(".")}] ${issue.message}`)
      .join("\n  - ");
    throw new Error(
      `[Knowledge RAG Build Error] Validation failed for ${sourceIdentifier}:\n  - ${errorDetails}`
    );
  }

  const validChunks = parseResult.data;
  const errors: string[] = [];

  for (const chunk of validChunks) {
    if (!chunk.license) {
      errors.push(`Chunk '${chunk.id}' is missing required license field.`);
    }

    if (!isConceptInDAG(chunk.conceptId)) {
      errors.push(
        `Chunk '${chunk.id}' references conceptId '${chunk.conceptId}' which does not exist in the curriculum DAG.`
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `[Knowledge RAG Build Error] Curriculum DAG alignment failed for ${sourceIdentifier}:\n  - ${errors.join(
        "\n  - "
      )}`
    );
  }

  return validChunks;
}

/**
 * Reads and validates all JSON files in data/knowledge directory.
 * Fails the build/execution if any chunk has an unknown conceptId or fails schema validation.
 */
export function loadAndValidateCorpus(knowledgeDirPath?: string): KnowledgeChunk[] {
  const dirPath =
    knowledgeDirPath || path.resolve(process.cwd(), "data/knowledge");

  if (!fs.existsSync(dirPath)) {
    throw new Error(
      `[Knowledge RAG Build Error] Knowledge directory not found at: ${dirPath}. Please create data/knowledge/ with validated corpus files.`
    );
  }

  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    throw new Error(
      `[Knowledge RAG Build Error] No JSON corpus files found in: ${dirPath}. Expected files like icse-class5.json, ncert-class5.json.`
    );
  }

  const allChunks: KnowledgeChunk[] = [];
  const seenIds = new Set<string>();

  for (const file of files) {
    const filePath = path.join(/*turbopackIgnore: true*/ dirPath, file);
    let rawContent: string;
    try {
      rawContent = fs.readFileSync(filePath, "utf-8");
    } catch (err) {
      throw new Error(`[Knowledge RAG Build Error] Failed to read ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch (err) {
      throw new Error(`[Knowledge RAG Build Error] Invalid JSON syntax in ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (!Array.isArray(parsedJson)) {
      throw new Error(`[Knowledge RAG Build Error] File ${filePath} must contain a JSON array of chunks.`);
    }

    const validatedChunks = validateKnowledgeChunks(parsedJson, file);

    for (const chunk of validatedChunks) {
      if (seenIds.has(chunk.id)) {
        throw new Error(`[Knowledge RAG Build Error] Duplicate chunk id detected: '${chunk.id}' in file ${file}.`);
      }
      seenIds.add(chunk.id);
      allChunks.push(chunk);
    }
  }

  return allChunks;
}
