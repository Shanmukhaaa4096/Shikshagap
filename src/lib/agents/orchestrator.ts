/**
 * src/lib/agents/orchestrator.ts
 *
 * Orchestrator per SPEC.md:
 * - Plain TypeScript state machine with NO LLM in the orchestrator itself.
 * - Flow:
 *   1. Examiner loop per topic (asking questions at level 2 -> 3 or 1 via staircase gate).
 *   2. When a topic closes as "developing" or "gap": Error Analyst runs to identify misconception labels.
 *   3. When all topics finish:
 *      a. Runs the Resource Advisor to retrieve and verify recommendations for gap and developing topics.
 *      b. Runs the Report Writer to generate a factual, language-appropriate summary from final memory and verified recs.
 */

import {
  getNextStaircaseAction,
  applyAttemptToMemory,
  advanceToNextTopic,
  type StaircaseAction,
} from "./staircase.ts";
import { runExaminerStep, type ExaminerStepResult } from "./examiner.ts";
import { analyzeErrors } from "./errorAnalyst.ts";
import { recommendResources, type ResourceAdvisorOptions } from "./resourceAdvisor.ts";
import { writeReport, type ReportWriterOptions } from "./reportWriter.ts";
import type {
  Attempt,
  ResourceRecommendation,
  SessionMemory,
} from "../types.ts";

export interface OrchestratorStepResult {
  memory: SessionMemory;
  action: StaircaseAction;
  isFinished: boolean;
  examinerNotes?: string[];
  recommendations?: ResourceRecommendation[];
  summary?: string;
}

export interface OrchestratorOptions {
  examinerClient?: unknown;
  analystClient?: unknown;
  advisorOptions?: ResourceAdvisorOptions;
  reportOptions?: ReportWriterOptions;
}

/**
 * Executes a single step in the assessment state machine.
 */
export async function stepAssessment(
  memory: SessionMemory,
  lastAttempt?: Attempt,
  options?: OrchestratorOptions
): Promise<OrchestratorStepResult> {
  let currentMemory = memory;
  let nextAction: StaircaseAction;

  if (lastAttempt) {
    // 1. Advance session memory with the attempt
    const advanced = applyAttemptToMemory(currentMemory, lastAttempt);
    currentMemory = advanced.memory;
    nextAction = advanced.action;

    // 2. If a topic closed as developing or gap, run Error Analyst
    if (
      advanced.closedTopic &&
      (advanced.closedTopic.status === "developing" || advanced.closedTopic.status === "gap")
    ) {
      const closedTopicMem = currentMemory.topics.find(
        (t) => t.topicId === advanced.closedTopic!.topicId
      );
      if (closedTopicMem) {
        const analystRes = await analyzeErrors({
          topicId: closedTopicMem.topicId,
          attempts: closedTopicMem.attempts,
          pseudonymousId: currentMemory.pseudonymousId,
          grade: currentMemory.grade,
          client: options?.analystClient,
        });
        closedTopicMem.misconceptions = analystRes.labels;
      }
    }
  } else {
    nextAction = getNextStaircaseAction(currentMemory);
  }

  // 3. Consult Examiner agent via function calling gate.
  // Note: if lastAttempt was already applied to currentMemory, pass undefined to avoid double-counting.
  const examinerRes: ExaminerStepResult = await runExaminerStep(
    currentMemory,
    undefined,
    { client: options?.examinerClient }
  );

  if (examinerRes.notes.length > 0) {
    const activeTopic =
      currentMemory.topics[currentMemory.currentTopicIndex] ||
      currentMemory.topics[currentMemory.currentTopicIndex - 1];
    if (activeTopic) {
      activeTopic.notes.push(...examinerRes.notes);
    }
  }
  nextAction = examinerRes.action;

  // If nextAction is close_topic, apply advance cleanly without dummy attempts
  if (nextAction.type === "close_topic") {
    const advanced = advanceToNextTopic(currentMemory, `Topic closed with status ${nextAction.status}`);
    currentMemory = advanced.memory;
    nextAction = advanced.action;
  }

  // 4. Check if assessment is finished
  if (nextAction.type === "finish") {
    // Run Resource Advisor
    const recommendations = await recommendResources(currentMemory, options?.advisorOptions);

    // Run Report Writer
    const reportOutput = await writeReport(
      { memory: currentMemory, recommendations },
      options?.reportOptions
    );

    return {
      memory: currentMemory,
      action: nextAction,
      isFinished: true,
      examinerNotes: examinerRes.notes,
      recommendations,
      summary: reportOutput.summary,
    };
  }

  return {
    memory: currentMemory,
    action: nextAction,
    isFinished: false,
    examinerNotes: examinerRes.notes,
  };
}

/**
 * Completes finalization step (Resource Advisor + Report Writer)
 * for a finished session memory.
 */
export async function finalizeAssessment(
  memory: SessionMemory,
  options?: OrchestratorOptions
): Promise<{
  recommendations: ResourceRecommendation[];
  summary: string;
}> {
  const recommendations = await recommendResources(memory, options?.advisorOptions);
  const reportOutput = await writeReport(
    { memory, recommendations },
    options?.reportOptions
  );

  return {
    recommendations,
    summary: reportOutput.summary,
  };
}
