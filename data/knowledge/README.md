# ShikshaGap Curriculum Knowledge Corpus (`data/knowledge/`)

This directory contains the authoritative curriculum knowledge corpus for ShikshaGap's Retrieval-Augmented Generation (RAG) system. The corpus grounds Gemini in genuine, board-aligned pedagogical explanations, classroom activities with zero-cost manipulatives, common diagnostic misconceptions, and hints.

## File Organization

Corpus files are partitioned by educational board and class:
- `ncert-class5.json`: Class 5 Mathematics for NCERT / CBSE curriculum.
- `icse-class5.json`: Class 5 Mathematics for ICSE / CISCE curriculum.
- `<board>-class<grade>.json`: Pattern for future expansions (Classes 1 to 10).

## Chunk Schema

Every chunk in a corpus JSON array must adhere strictly to the following specification validated via Zod:

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier, e.g., `ncert-cl5-mult-exp-01`. Must be globally unique across all files. |
| `text` | `string` | Pedagogical content strictly between **200 and 400 words**. |
| `board` | `"NCERT" \| "CBSE" \| "ICSE"` | Educational curriculum board. |
| `class` | `number` | School grade integer from `1` to `10`. |
| `conceptId` | `string` | Must exist in the curriculum DAG (`src/data/curriculum/index.ts` or `src/lib/concepts/graph.ts`). |
| `type` | `"explanation" \| "worked_example" \| "misconception" \| "activity" \| "hint"` | Pedagogical category of the chunk. |
| `lang` | `"en" \| "hi" \| "te"` | Language of the text: English (`en`), Hindi (`hi`), or Telugu (`te`). |
| `source` | `string` | Specific syllabus or textbook reference, e.g. `NCERT Math-Magic Class 5, Chapter 1 'The Fish Tale', pp. 10-12`. |
| `license` | `"own" \| "open" \| "permission"` | Copyright and usage license. Mandatory on every chunk. |

## Licensing Rule

1. **Original Pedagogical Prose**: All chunks authored for ShikshaGap must use `"own"` or `"open"` licensing.
2. **No Verbatim Copying**: Never paste paragraphs verbatim from copyrighted textbooks. Synthesize authentic explanations, classroom scenarios, and activities in your own words while citing the relevant chapter/section in `source`.
3. **Mandatory License Field**: The loader (`src/lib/rag/loader.ts`) will fail the build if any chunk omits its `license` field or references a `conceptId` not present in the curriculum DAG.

## How to Add New Chunks

1. Select the relevant file (e.g., `data/knowledge/ncert-class5.json`).
2. Verify that the `conceptId` is listed in `src/data/curriculum/` (or run `npm test` to verify graph linkage).
3. Write an original pedagogical explanation, manipulative activity, misconception diagnosis, or scaffolded hint.
4. Ensure the text contains between 200 and 400 words.
5. Re-run embedding generation:
   ```bash
   npm run build:embeddings
   ```
6. Verify validation passes and tests pass:
   ```bash
   npm test
   ```
