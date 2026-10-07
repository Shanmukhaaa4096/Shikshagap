import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  evaluateAndDecideStep,
  CURRICULUM_TOPICS,
  TOPIC_DISPLAY_NAMES,
} from "@/lib/engine/diagnostic";
import { CONCEPTS, CONCEPT_IDS, TOPICS } from "@/lib/concepts/graph";
import { generateQuestion } from "@/lib/questions/generator";
import { makeRng } from "@/lib/rng";
import type {
  AgentAction,
  AgentDecisionRecord,
  AssessmentAgentState,
  ConceptId,
  Difficulty,
  Question,
  Response as StudentResponse,
  TopicId,
} from "@/lib/types";

interface RequestBody {
  state: AssessmentAgentState;
  lastResponse?: StudentResponse;
}

const VALID_ACTIONS: AgentAction[] = [
  "START_TOPIC",
  "CONTINUE_TOPIC",
  "INCREASE_DIFFICULTY",
  "DECREASE_DIFFICULTY",
  "PROBE_PREREQUISITE",
  "VERIFY_MASTERY",
  "MARK_MASTERED",
  "MARK_DEVELOPING",
  "MARK_NEEDS_SUPPORT",
  "MOVE_TO_NEXT_TOPIC",
  "FINISH_ASSESSMENT",
];

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { state, lastResponse } = body;

    if (!state || !state.topics || !state.currentTopic) {
      return NextResponse.json(
        { error: "Invalid state provided in request body" },
        { status: 400 }
      );
    }

    const rng = makeRng(Date.now());

    // 1. Compute baseline deterministic evaluation
    const baseline = evaluateAndDecideStep(state, lastResponse, rng);

    // 2. If Gemini is configured, consult Gemini for high-level pedagogical adaptation
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Deterministic fallback (reliable demo mode)
      return NextResponse.json({
        decision: baseline.decision,
        nextQuestion: baseline.nextQuestion,
        nextState: baseline.nextState,
        source: "deterministic",
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      // Build context summary for Gemini
      const recentResponses = (state.responses || []).slice(-6).map((r) => ({
        concept: r.conceptId,
        difficulty: r.difficulty,
        correct: r.correct,
        classification: r.classification,
      }));

      const systemInstruction = `You are the ShikshaGap AI Assessment Agent diagnosing Class 5 Indian elementary students in Mathematics.
Curriculum Order:
1. Number Operations (place_value, addition, subtraction)
2. Multiplication (mult_facts, multi_digit_mult)
3. Division (division_facts, long_division)
4. Fractions (equivalent_fractions, comparing_fractions, fraction_addition)

Rules:
- Decide if current topic has sufficient evidence (min 2, max 6 questions per topic).
- If student struggles, consider backtracking to a foundational prerequisite (e.g. division struggle -> test multiplication facts).
- If student masters 2 items with high confidence -> MOVE_TO_NEXT_TOPIC.
- If all 4 topics are assessed -> FINISH_ASSESSMENT.
- Return ONLY valid JSON matching this schema:
{
  "action": "START_TOPIC" | "CONTINUE_TOPIC" | "INCREASE_DIFFICULTY" | "DECREASE_DIFFICULTY" | "PROBE_PREREQUISITE" | "VERIFY_MASTERY" | "MARK_MASTERED" | "MARK_DEVELOPING" | "MARK_NEEDS_SUPPORT" | "MOVE_TO_NEXT_TOPIC" | "FINISH_ASSESSMENT",
  "topicId": "number_ops" | "multiplication" | "division" | "fractions",
  "conceptId": string,
  "difficulty": 1 | 2 | 3,
  "reason": string,
  "confidence": number
}`;

      const userPrompt = JSON.stringify({
        student: state.studentName,
        currentTopic: state.currentTopic,
        currentConcept: state.currentConcept,
        currentDifficulty: state.currentDifficulty,
        topicQuestionsAnswered: (state.responses || []).filter((r) =>
          TOPICS[state.currentTopic]?.targets.includes(r.conceptId)
        ).length,
        lastResponse: lastResponse
          ? {
              concept: lastResponse.conceptId,
              correct: lastResponse.correct,
              errorType: lastResponse.classification,
            }
          : null,
        recentResponses,
        baselineSuggestedAction: baseline.decision.action,
        baselineSuggestedReason: baseline.decision.reason,
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: `${systemInstruction}\n\nCurrent Assessment State:\n${userPrompt}` }] },
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const rawText = response.text || "{}";
      const parsed = JSON.parse(rawText);

      // Validate Gemini response structure
      if (
        parsed &&
        VALID_ACTIONS.includes(parsed.action) &&
        CURRICULUM_TOPICS.includes(parsed.topicId) &&
        CONCEPT_IDS.includes(parsed.conceptId) &&
        [1, 2, 3].includes(parsed.difficulty)
      ) {
        // Safe Gemini Decision
        const aiDecision: AgentDecisionRecord = {
          step: baseline.decision.step,
          action: parsed.action as AgentAction,
          topicId: parsed.topicId as TopicId,
          conceptId: parsed.conceptId as ConceptId,
          difficulty: parsed.difficulty as Difficulty,
          reason: String(parsed.reason || baseline.decision.reason),
          confidence: typeof parsed.confidence === "number" ? parsed.confidence : baseline.decision.confidence,
          studentFeedbackPrompt: baseline.decision.studentFeedbackPrompt,
          source: "ai",
        };

        // If AI agrees on termination or finishes assessment
        if (parsed.action === "FINISH_ASSESSMENT" || baseline.nextState.assessmentComplete) {
          return NextResponse.json({
            decision: { ...aiDecision, action: "FINISH_ASSESSMENT" },
            nextQuestion: null,
            nextState: baseline.nextState,
            source: "ai",
          });
        }

        // Guaranteed deterministic numerical truth for the question
        const safeQuestion = generateQuestion(aiDecision.conceptId, aiDecision.difficulty, rng);

        const updatedNextState = {
          ...baseline.nextState,
          currentTopic: aiDecision.topicId,
          currentConcept: aiDecision.conceptId,
          currentDifficulty: aiDecision.difficulty,
          decisions: [
            ...baseline.nextState.decisions.slice(0, -1),
            aiDecision,
          ],
        };

        return NextResponse.json({
          decision: aiDecision,
          nextQuestion: safeQuestion,
          nextState: updatedNextState,
          source: "ai",
        });
      }
    } catch (aiErr) {
      console.warn("Gemini agent call fallback to deterministic engine:", aiErr);
    }

    // Fallback cleanly to baseline deterministic output
    return NextResponse.json({
      decision: baseline.decision,
      nextQuestion: baseline.nextQuestion,
      nextState: baseline.nextState,
      source: "deterministic",
    });
  } catch (error) {
    console.error("Error in assessment agent route:", error);
    return NextResponse.json(
      { error: "Internal server error during assessment step" },
      { status: 500 }
    );
  }
}
