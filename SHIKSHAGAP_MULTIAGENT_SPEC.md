# ShikshaGap multi-agent redesign: spec and phase prompts

How to use: save the "Spec" section into the repo root as `SPEC.md`. Then paste the phase prompts (Phase 1 to 4) one at a time into Antigravity. Run `npm test` and the app after each phase before starting the next.

---

# Part 1: Spec (save as SPEC.md)

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

## Out of scope

Auth, teacher dashboard redesign, offline sync, and legal pages.

---

# Part 2: Phase prompts (paste one at a time)

## Phase 1: staircase and memory

```
Read SPEC.md in the repo root and the current files src/lib/engine/diagnostic.ts, src/app/api/assessment/agent/route.ts, src/lib/questions/generator.ts, src/components/AdaptiveAssessmentView.tsx and src/lib/types.ts.

Implement Phase 1 only:
1. Add src/lib/agents/staircase.ts: a pure function that, given SessionMemory and the last Attempt, returns the single legal next action (ask at level N, or close the topic with a status, or finish). Implement exactly the staircase in SPEC.md.
2. Add the SessionMemory, TopicMemory and Attempt types to src/lib/types.ts.
3. Change the agent route and AdaptiveAssessmentView so the assessment follows the staircase using the existing question generator, with no LLM involved yet. The client keeps SessionMemory and sends it with each request.
4. Add tests in tests/staircase.test.mjs covering all five staircase paths, no repeated questions, and the max of 2 questions per topic.

Do not touch resources, embeddings, Gemini calls or the report. Run npm test and npm run build, fix any failures, and summarise what changed and which existing tests you had to modify and why.
```

## Phase 2: Examiner agent and Error analyst

```
Read SPEC.md and the Phase 1 code. Implement Phase 2 only:
1. Add src/lib/agents/examiner.ts using @google/genai function calling with the tools listed in SPEC.md. Every tool call must go through the gate in staircase.ts and be rejected if illegal. Question text and answers must come only from generateQuestion. If GEMINI_API_KEY is missing or any call fails, fall back to the staircase's own legal action.
2. Add src/lib/agents/errorAnalyst.ts, called once when a topic closes as developing or gap. Output JSON with misconception labels from a fixed per-concept list (extend the existing error classification). Validate the JSON and fall back to existing classification values.
3. Store the Examiner's notes and the analyst's labels in SessionMemory.
4. Send only the pseudonymous id to Gemini, never names.
5. Add tests with a mocked Gemini client: an illegal tool call is rejected, malformed JSON falls back, and the missing-key path completes a full assessment.

Run npm test and npm run build and summarise the result.
```

## Phase 3: RAG resource advisor

```
Read SPEC.md and the existing code. Implement Phase 3 only:
1. Create src/data/resources.json with 3 placeholder entries per topic (12 total). Where you are not certain of an exact URL, write "TODO verify exact URL". Do not invent deep links.
2. Add scripts/buildEmbeddings.mjs and the npm script build:embeddings that writes src/data/resources.embeddings.json. Add npm run check:links that fails on any TODO or non-200 URL.
3. Add src/lib/agents/resourceAdvisor.ts: build the query from topic, grade, language and misconception labels, filter by grade and language, cosine-search the precomputed embeddings in memory, then ask Gemini to pick up to 3 per topic from the candidates only with a one-line reason each. Verify every returned id is in the candidate set and drop any that are not. Fallback to the top 3 by score if Gemini fails or there is no key.
4. Add tests: ids not in the candidate set are dropped, the fallback works, and filters by grade and language are applied.

Run npm test and npm run build and summarise.
```

## Phase 4: Report writer, orchestrator and final screen

```
Read SPEC.md and everything built so far. Implement Phase 4 only:
1. Add src/lib/agents/reportWriter.ts: a short summary in en, hi or te from the final memory plus verified recommendations. It must not add facts that are not in the input. Fall back to a fixed template.
2. Add src/lib/agents/orchestrator.ts as a plain state machine: Examiner loop per topic -> Error analyst when a topic closes -> after the last topic run the Resource advisor and the Report writer (the writer may run in parallel with the advisor's formatting, but it needs the verified recommendations). Add a POST /api/assessment/finish route for the final step with the same rate limit and payload limit as the agent route.
3. Update the final screen in AdaptiveAssessmentView: gap topics first, then developing topics as needs practice, mastered topics as done, then the recommended resources with their reasons, then the summary.
4. Add an end-to-end test with all agents mocked, and one with no GEMINI_API_KEY.

Run npm test and npm run build, then give me a manual test checklist.
```

---

# Part 3: Manual checks after each phase

- Phase 1: answer right, right -> topic should be `mastered` after 2 questions. Answer wrong, wrong -> `gap`. Answer wrong, right -> `developing`.
- Phase 2: unset `GEMINI_API_KEY`, finish a full assessment. Then set it and compare.
- Phase 3: run `npm run check:links`. It should fail until you replace every `TODO` with a real, checked URL.
- Phase 4: switch language to Hindi and Telugu and read the summary for facts that are not in the data.
