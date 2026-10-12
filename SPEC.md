# ShikshaGap Multi-Agent Assessment Spec

## Goal

Replace the current "2 to 6 questions per topic with Beta mastery and DAG backtracking" assessment with a simpler difficulty staircase run by a small set of agents. At the end, show the topics the student failed and recommend study materials retrieved with RAG.

## Assumptions (change these if wrong)

- Three difficulty levels already exist in the repo (`Difficulty = 1 | 2 | 3`): 1 easy, 2 medium, 3 hard.
- Each topic starts at level 2 (medium).
- Topics assessed per subject: the four existing ones (`number_ops`, `multiplication`, `division`, `fractions`).
- One question per step. The staircase is below.

## Staircase (per topic), enforced by plain code

Start at level 2.

- Correct at 2 -> ask at level 3.
  - Correct at 3 -> topic status `mastered`, move to next topic.
  - Wrong at 3 -> topic status `developing`, move to next topic.
- Wrong at 2 -> ask at level 1 (same topic, a different question).
  - Correct at 1 -> topic status `developing`, move to next topic.
  - Wrong at 1 -> topic status `gap`, note it in memory, move to next topic.

Maximum 2 questions per topic. Questions must never repeat within a session (use the existing `generateUnique` and `questionSignature`).

Final output lists `gap` topics first, then `developing` topics as "needs practice". `mastered` topics are shown as done.

## Session memory

Plain structured object, held on the client and sent with every request (the server stays stateless, as it is today).

```ts
type TopicStatus = "pending" | "mastered" | "developing" | "gap";

interface Attempt {
  conceptId: ConceptId;
  level: 1 | 2 | 3;
  questionId: string;
  studentAnswer: string;
  correct: boolean;
  errorType?: string;      // from the existing error classification
}

interface TopicMemory {
  topicId: TopicId;
  status: TopicStatus;
  attempts: Attempt[];
  notes: string[];          // short notes written by the Examiner
  misconceptions?: string[]; // written later by the Error analyst
}

interface SessionMemory {
  pseudonymousId: string;   // never the student's name
  language: "en" | "hi" | "te";
  grade: 3 | 4 | 5;
  topics: TopicMemory[];
  currentTopicIndex: number;
}
```

## Agents (four, all optional LLM, all with deterministic fallbacks)

1. Examiner. Gemini function calling. Tools: `ask_question(conceptId, level)`, `update_memory(note)`, `next_topic()`, `finish()`. Every tool call passes through a code gate (`staircase.ts`) that rejects any call not allowed in the current state (for example `next_topic` before the topic's staircase has ended, or `ask_question` at the wrong level). Question text and correct answers always come from `generateQuestion`; the LLM never writes math. Fallback: the staircase code picks the legal action itself.
2. Error analyst. Runs once when a topic closes with status `developing` or `gap`. Input: that topic's attempts. Output (JSON): a list of misconception labels with a one-line explanation each. Labels must come from a fixed list per concept (extend the existing error classification). Fallback: use the existing `classification` values.
3. Resource advisor (RAG). Runs once at the end for gap and developing topics. Steps: build a query from topic, grade, language and misconception labels -> embed -> cosine search over `src/data/resources.json` with precomputed embeddings -> take the top candidates (filter by grade and language first) -> Gemini picks up to 3 per topic from the candidates only and writes a one-line reason for each. Code verifies every returned id exists in the candidate set and drops any that do not. Fallback: top 3 by similarity score with no LLM.
4. Report writer. Runs after the advisor. Input: final memory plus the verified recommendations. Output: a short plain-language summary for the teacher or parent in the chosen language (en, hi, te). It may not add facts that are not in the input. Fallback: a fixed template filled from the data.

Orchestrator: plain TypeScript state machine in `src/lib/agents/orchestrator.ts`. No LLM in the orchestrator.

## Resource library

`src/data/resources.json`, each entry:

```json
{
  "id": "res_001",
  "title": "…",
  "url": "TODO verify exact URL",
  "source": "NCERT | DIKSHA | Khan Academy | other",
  "topicId": "division",
  "conceptIds": ["division_facts"],
  "grade": [4, 5],
  "language": "en",
  "type": "video | worksheet | article | exercise",
  "description": "one or two sentences used for retrieval"
}
```

Rules:
- Every URL must be checked by a human before release. Do not invent deep links. Leave `TODO verify exact URL` where unsure and add an `npm run check:links` script that fails on any `TODO` or non-200 URL.
- Embeddings are computed once by `npm run build:embeddings` and stored in `src/data/resources.embeddings.json`. Do not call the embedding API at request time for the library.
- Use the Gemini embedding model available in the installed `@google/genai` version (check its docs for the current model name). Keep the model name in an env var.

## Constraints that must hold

- Server stays stateless. No new database.
- Never send student names to Gemini. Use only the pseudonymous id (existing DPDP rule).
- Without `GEMINI_API_KEY`, the whole flow must still run on fallbacks.
- Rate limit and payload size checks in the agent route stay.
- Keep the existing tests passing, or update them in the same change with a note on why. Add new tests for every phase.
- The DAG (`src/lib/concepts/graph.ts`) stays for the teacher dashboard and existing features. The new staircase does not use it.
- Keep `gemini-2.5-flash` as the default model, but read the model name from an env var `GEMINI_MODEL`.

## Persistent Question Memory & Anonymised Telemetry

<!-- Legal wording requires review by qualified legal counsel under DPDP Act 2023 -->
A safe question memory layer (`src/lib/db/questionMemory.ts`) optionally persists validated questions and aggregated performance tallies:
1. **Validated Questions Table (`validated_questions`)**:
   - Stores mathematical problem text, operands, theme, grade, concept, and pgvector embeddings.
   - Questions are saved ONLY after passing all mathematical validation, script checks, reading level limits, and blind solver validation.
   - Questions are tracked anonymously by `timesShown`, `timesCorrect`, and `timesReported`.
   - Quality score degrades and questions are automatically retired if success rate < 15% (too hard), > 98% (too trivial), or reported by teachers.
2. **Zero Student PII Guarantee**:
   - Strictly NO student names, roll numbers, typed free-form responses, device fingerprints, or student identifiers are ever stored in the database.
   - Only mathematical item text and aggregate misconception category tallies (`anonymous_misconception_tallies`) are retained to refine curriculum analytics.
3. **Teacher Reporting**:
   - Teachers can flag questions ("Report this question"). Reported items are immediately marked unapproved and retired from student rotation until explicit teacher approval.
4. **Database-Optional Architecture**:
   - If `DATABASE_URL` is unset or database connectivity is lost, the entire system falls back to in-memory handling with zero user-facing errors or interruptions.

## Out of scope

Auth, teacher dashboard redesign, offline sync, and legal pages.
