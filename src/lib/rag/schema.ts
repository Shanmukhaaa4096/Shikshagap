import { z } from "zod";

export const ChunkTypeSchema = z.enum([
  "explanation",
  "worked_example",
  "misconception",
  "activity",
  "hint",
]);

export const ChunkBoardSchema = z.enum(["NCERT", "CBSE", "ICSE"]);

export const ChunkLangSchema = z.enum(["en", "hi", "te"]);

export const ChunkLicenseSchema = z.enum(["own", "open", "permission"]);

export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const KnowledgeChunkSchema = z.object({
  id: z.string().min(1, "Chunk id is required"),
  text: z
    .string()
    .min(1, "Chunk text is required")
    .refine(
      (val) => {
        const wc = countWords(val);
        return wc >= 200 && wc <= 400;
      },
      {
        message: "Chunk text must be between 200 and 400 words",
      }
    ),
  board: ChunkBoardSchema,
  class: z.number().int().min(1).max(10),
  conceptId: z.string().min(1, "ConceptId is required"),
  type: ChunkTypeSchema,
  lang: ChunkLangSchema,
  source: z.string().min(1, "Source title and section/page is required"),
  license: ChunkLicenseSchema,
});

export const KnowledgeCorpusFileSchema = z.array(KnowledgeChunkSchema);

export type ChunkType = z.infer<typeof ChunkTypeSchema>;
export type ChunkBoard = z.infer<typeof ChunkBoardSchema>;
export type ChunkLang = z.infer<typeof ChunkLangSchema>;
export type ChunkLicense = z.infer<typeof ChunkLicenseSchema>;
export type KnowledgeChunk = z.infer<typeof KnowledgeChunkSchema>;

export interface EmbeddedChunk extends KnowledgeChunk {
  embedding: number[];
  contentHash?: string;
}
