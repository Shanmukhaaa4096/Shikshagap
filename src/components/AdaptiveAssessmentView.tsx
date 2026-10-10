"use client";

import React, { useState } from "react";
import type {
  Classification,
  ConceptId,
  DiagnosticResult,
  Question,
  Response as StudentResponse,
  TopicId,
  AssessmentAgentState,
  AgentDecisionRecord,
  MasteryEstimate,
} from "@/lib/types";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { Input } from "@/components/ui/input";
import {
  Brain,
  CheckCircle,
  XCircle,
  ArrowRight,
  Question as QuestionIcon,
  CaretDown,
  CaretUp,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import {
  initAssessmentAgent,
  evaluateAndDecideStep,
  estimateMastery,
  CURRICULUM_TOPICS,
  TOPIC_DISPLAY_NAMES,
} from "@/lib/engine/diagnostic";
import { TOPICS } from "@/lib/concepts/graph";
import { uid, makeRng } from "@/lib/rng";

interface Props {
  students: DemoStudentData[];
  initialStudentId?: string;
  initialConceptId?: string;
  isStudentView?: boolean;
  onAssessmentCompleted: (updatedStudent: DemoStudentData) => void;
  onCancel: () => void;
}

export function AdaptiveAssessmentView({
  students,
  initialStudentId,
  isStudentView = false,
  onAssessmentCompleted,
  onCancel,
}: Props) {
  const { dict, t, formatTxt } = useI18n();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.student.id || "student_1"
  );

  // Agent Runtime State
  const [isStarted, setIsStarted] = useState(false);
  const [agentState, setAgentState] = useState<AssessmentAgentState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentDecision, setCurrentDecision] = useState<AgentDecisionRecord | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showTeacherTrace, setShowTeacherTrace] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [completedProfile, setCompletedProfile] = useState<DiagnosticResult | null>(null);
  const lastResponseRef = React.useRef<StudentResponse | null>(null);

  const activeStudent = students.find((s) => s.student.id === selectedStudentId);

  // Start Multi-Topic AI Diagnostic Assessment
  const handleStart = async () => {
    if (!activeStudent) return;

    const initial = initAssessmentAgent(
      activeStudent.student.id,
      activeStudent.student.name,
      5,
      "math"
    );

    setIsStarted(true);
    setIsFinished(false);
    setFeedback(null);
    setShowHint(false);
    setCompletedProfile(null);
    setIsEvaluating(true);

    try {
      const res = await fetch("/api/assessment/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: initial }),
      });

      if (res.ok) {
        const data = await res.json();
        setAgentState(data.nextState || initial);
        setCurrentQuestion(data.nextQuestion);
        setCurrentDecision(data.decision);
      } else {
        throw new Error("Server route error");
      }
    } catch {
      // Deterministic client fallback
      const baseline = evaluateAndDecideStep(initial, undefined, makeRng(Date.now()));
      setAgentState(baseline.nextState);
      setCurrentQuestion(baseline.nextQuestion);
      setCurrentDecision(baseline.decision);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Submit Student Answer
  const handleSubmit = (answerValue: string) => {
    if (!currentQuestion || !agentState || isEvaluating) return;

    const trimmed = answerValue.trim();
    if (!trimmed) return;

    const isCorrect = trimmed === String(currentQuestion.answer);

    let classification: Classification = isCorrect ? "correct" : "unclassified";
    if (!isCorrect && currentQuestion.meta.bugs && currentQuestion.meta.bugs[trimmed]) {
      classification = currentQuestion.meta.bugs[trimmed];
    } else if (!isCorrect) {
      classification = "slip";
    }

    const newResponse: StudentResponse = {
      id: uid("resp"),
      studentId: selectedStudentId,
      questionId: currentQuestion.id,
      conceptId: currentQuestion.conceptId,
      difficulty: currentQuestion.difficulty,
      answer: trimmed,
      correct: isCorrect,
      classification,
      timestamp: new Date().toISOString(),
      timeMs: 3800,
      context: "assessment",
    };

    setFeedback({
      isCorrect,
      message: isCorrect
        ? "Good job! Let's continue."
        : "Let's check a related question to understand this.",
    });

    lastResponseRef.current = newResponse;
  };

  // Advance to next adaptive step
  const handleNextStep = async () => {
    if (!agentState) return;

    const lastResp: StudentResponse | undefined = lastResponseRef.current || undefined;
    setFeedback(null);
    setUserAnswer("");
    setShowHint(false);
    setIsEvaluating(true);

    try {
      const res = await fetch("/api/assessment/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: agentState, lastResponse: lastResp }),
      });

      if (res.ok) {
        const data = await res.json();
        const nextState: AssessmentAgentState = data.nextState;
        setAgentState(nextState);
        setCurrentDecision(data.decision);

        if (nextState.assessmentComplete || !data.nextQuestion) {
          setIsFinished(true);
          setCurrentQuestion(null);
          setCompletedProfile(nextState.diagnosticResult || null);
        } else {
          setCurrentQuestion(data.nextQuestion);
        }
      } else {
        throw new Error("Server error");
      }
    } catch {
      // Deterministic fallback
      const fallback = evaluateAndDecideStep(agentState, lastResp, makeRng(agentState.responses.length + 1));
      const nextState = fallback.nextState;
      setAgentState(nextState);
      setCurrentDecision(fallback.decision);

      if (nextState.assessmentComplete || !fallback.nextQuestion) {
        setIsFinished(true);
        setCurrentQuestion(null);
        setCompletedProfile(nextState.diagnosticResult || null);
      } else {
        setCurrentQuestion(fallback.nextQuestion);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  // Save diagnostic findings and return to teacher dashboard
  const handleSaveAndFinish = () => {
    if (!activeStudent || !agentState) {
      onCancel();
      return;
    }

    const updatedProfile = completedProfile || agentState.diagnosticResult;

    if (!updatedProfile) {
      onCancel();
      return;
    }

    const calculatedStatus: "on_track" | "need_practice" | "critical" =
      updatedProfile.rootCauses.length > 0
        ? "critical"
        : updatedProfile.overallMastery < 0.75
        ? "need_practice"
        : "on_track";

    const conceptEstimations: Partial<Record<ConceptId, MasteryEstimate>> = {};
    const touchedConcepts = new Set(agentState.responses.map((r) => r.conceptId));
    touchedConcepts.forEach((cId) => {
      conceptEstimations[cId] = estimateMastery(cId, agentState.responses);
    });

    const updatedStudent: DemoStudentData = {
      ...activeStudent,
      profile: {
        ...activeStudent.profile,
        overallMastery: updatedProfile.overallMastery,
        confidence: updatedProfile.overallConfidence,
        status: calculatedStatus,
        rootCauses: updatedProfile.rootCauses,
        concepts: {
          ...activeStudent.profile.concepts,
          ...conceptEstimations,
        },
        topicSummaries: updatedProfile.topics,
      },
    };

    onAssessmentCompleted(updatedStudent);
  };

  const currentTopicId: TopicId = agentState?.currentTopic || "number_ops";
  const currentTopicName = TOPIC_DISPLAY_NAMES[currentTopicId]?.en || "Number Operations";

  // Check if system is checking a prerequisite
  const isPrereqProbe = currentDecision?.action === "PROBE_PREREQUISITE";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ============================================================== */}
      {/* SCREEN 1: PRE-ASSESSMENT SETUP SCREEN                          */}
      {/* ============================================================== */}
      {!isStarted ? (
        <div className="neo-panel p-6 sm:p-8 space-y-6 rounded-[2px] border border-[#432623]/25 bg-[var(--surface)]">
          <div className="border-b border-[#432623]/20 pb-5">
            <span className="editorial-meta text-[#432623]/80">START LEARNING CHECK</span>
            <h2 className="editorial-title text-2xl sm:text-3xl text-[#432623] mt-1">
              Class 5 Maths Check
            </h2>
            <p className="text-xs sm:text-sm text-[#432623]/80 mt-1 leading-relaxed max-w-2xl">
              A calm check across 4 Class 5 maths topics.
              When a question is hard for a student, the test asks an earlier question to find what skill they need to practice first.
            </p>
          </div>

          {/* Student Selector or Personal Learner Banner */}
          {isStudentView ? (
            <div className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/25 rounded-[2px] flex items-center justify-between">
              <div>
                <span className="editorial-meta text-[#432623]/70">LEARNER</span>
                <div className="font-serif font-bold text-lg text-[#432623] dark:text-[#F5F1BC]">{activeStudent?.student.name}</div>
              </div>
              <span className="font-mono text-xs font-bold text-[#432623]/70 dark:text-[#F5F1BC]/70">Roll #{activeStudent?.student.rollNo}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="editorial-meta text-[#432623]">SELECT STUDENT TO ASSESS</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full h-11 px-3 text-sm font-semibold bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/25 rounded-[2px] text-[#432623] focus:outline-none focus:ring-1 focus:ring-[#432623]"
              >
                {students.map((s) => (
                  <option key={s.student.id} value={s.student.id}>
                    {s.student.name} (Roll #{s.student.rollNo}) | {s.profile.status.toUpperCase().replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Curriculum Scope Overview */}
          <div className="space-y-2.5">
            <span className="editorial-meta text-[#432623]">CURRICULUM ASSESSMENT SCOPE</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CURRICULUM_TOPICS.map((tId: TopicId, idx: number) => (
                <div
                  key={tId}
                  className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/25 rounded-[2px] text-left"
                >
                  <div className="text-[10px] font-mono font-bold text-[#432623]/70 uppercase">
                    STAGE 0{idx + 1}
                  </div>
                  <div className="text-xs font-bold text-[#432623] mt-0.5">
                    {TOPIC_DISPLAY_NAMES[tId]?.en}
                  </div>
                  <div className="text-[10px] text-[#432623]/70 mt-1 truncate">
                    {TOPICS[tId]?.targets.map((c: ConceptId) => t(`c_${c}`) || c).join(", ")}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#432623]/80 pt-1">
              The test starts with Number Operations and adjusts to each student. There is no timer and no score shown during the test, so the student feels calm and comfortable.
            </p>
          </div>

          {/* Start CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#432623]/20">
            <button
              onClick={onCancel}
              className="neo-btn neo-btn-secondary px-5 py-2.5 text-xs font-bold w-full sm:w-auto rounded-[2px]"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleStart}
              className="neo-btn neo-btn-primary px-6 py-3 text-sm font-bold flex items-center justify-center gap-2 w-full sm:w-auto rounded-[2px]"
            >
              <Brain className="w-4 h-4 text-[#F5F1BC]" />
              <span>START TEST</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : isFinished ? (
        /* ============================================================== */
        /* SCREEN 3: ASSESSMENT COMPLETE SCREEN (DIAGNOSTIC REPORT)       */
        /* ============================================================== */
        <div className="neo-panel overflow-hidden space-y-6 p-6 sm:p-8 rounded-[2px] border border-[#432623]/25 bg-[var(--surface)]">
          {/* Editorial Header */}
          <div className="border-b border-[#432623]/20 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="editorial-meta text-[#432623] font-bold">TEST COMPLETE</span>
                <span className="text-[#432623]/40 text-xs">•</span>
                <span className="text-xs font-mono font-bold text-[#432623]">
                  {activeStudent?.student.name} • CLASS 5A
                </span>
              </div>
              <h2 className="editorial-title text-2xl sm:text-3xl text-[#432623] mt-1">
                Test Complete
              </h2>
              <p className="text-xs sm:text-sm text-[#432623]/80 mt-0.5">
                We checked the student&apos;s answers and found the topics that need more practice.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 bg-[#FAF8E8] dark:bg-[#432623]/30 p-3 rounded-[2px] border border-[#432623]/25">
              <div className="text-right">
                <div className="editorial-meta text-[#432623]/70">OVERALL MASTERY</div>
                <div className="font-serif text-3xl font-black text-[#432623]">
                  {Math.round((completedProfile?.overallMastery ?? 0) * 100)}%
                </div>
              </div>
              <div className="w-[1px] h-8 bg-[#432623]/20" />
              <div className="text-right">
                <div className="editorial-meta text-[#432623]/70">CONFIDENCE</div>
                <div className="font-mono text-xl font-bold text-[#432623]">
                  {Math.round((completedProfile?.overallConfidence ?? 0) * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Clean 4-Metric Summary Line */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 rounded-[2px] border border-[#432623]/25 text-center">
              <div className="editorial-meta text-[#432623]/70">TOPICS ASSESSED</div>
              <div className="font-serif text-2xl font-bold text-[#432623] mt-1">4 Topics</div>
            </div>
            <div className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 rounded-[2px] border border-[#432623]/25 text-center">
              <div className="editorial-meta text-[#432623]/70">QUESTIONS ASKED</div>
              <div className="font-serif text-2xl font-bold text-[#432623] mt-1">
                {agentState?.responses.length || 14}
              </div>
            </div>
            <div className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 rounded-[2px] border border-[#432623]/25 text-center">
              <div className="editorial-meta text-[#432623]/70">PREREQUISITE CHECKS</div>
              <div className="font-serif text-2xl font-bold text-[#432623] mt-1">
                {agentState?.decisions.filter((d) => d.action === "PROBE_PREREQUISITE").length || 3}
              </div>
            </div>
            <div className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 rounded-[2px] border border-[#432623]/25 text-center">
              <div className="editorial-meta text-[#DE2A35]">GAPS ISOLATED</div>
              <div className="font-serif text-2xl font-bold text-[#DE2A35] mt-1">
                {completedProfile?.rootCauses.length || 1}
              </div>
            </div>
          </div>

          {/* Primary Gap Highlight Callout */}
          {completedProfile && completedProfile.rootCauses.length > 0 ? (
            <div className="p-5 bg-[var(--surface)] border border-[#DE2A35]/40 rounded-[2px] space-y-3">
              <div className="flex items-center justify-between">
                <span className="editorial-meta text-[#DE2A35]">TOPIC NEEDING PRACTICE</span>
                <span className="text-[10px] font-mono font-bold uppercase bg-[#DE2A35]/15 text-[#DE2A35] px-2 py-0.5 rounded-[2px] border border-[#DE2A35]/30">
                  PRACTICE THIS SKILL FIRST
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 rounded-[2px] border border-[#432623]/20">
                  <div className="text-[10px] font-mono font-bold text-[#432623]/70 uppercase">SKILL NEEDED FIRST:</div>
                  <div className="font-serif text-lg font-bold text-[#DE2A35] mt-0.5">
                    {t(`c_${completedProfile.rootCauses[0].rootId}`) || completedProfile.rootCauses[0].rootId}
                  </div>
                  <p className="text-xs text-[#432623]/80 mt-1">
                    An earlier skill the student needs to understand first.
                  </p>
                </div>

                <div className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 rounded-[2px] border border-[#432623]/20">
                  <div className="text-[10px] font-mono font-bold text-[#432623]/70 uppercase">STRUGGLING WITH:</div>
                  <div className="font-serif text-lg font-bold text-[#432623] mt-0.5">
                    {completedProfile.rootCauses[0].symptomIds
                      .map((s) => t(`c_${s}`) || s)
                      .join(", ")}
                  </div>
                  <p className="text-xs text-[#432623]/80 mt-1">
                    Questions in Class 5 lessons where the student got stuck.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-[#8ABB93]/15 border border-[#8ABB93] rounded-[2px] flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#8ABB93] shrink-0" />
              <div>
                <h4 className="font-serif font-bold text-base text-[#432623]">
                  All Evaluated Strands Fluent
                </h4>
                <p className="text-xs text-[#432623]/80 mt-0.5">
                  Student demonstrates conceptual mastery across all tested Class 5 mathematics strands.
                </p>
              </div>
            </div>
          )}

          {/* 4 Topic Performance Horizontal Bars */}
          <div className="space-y-3">
            <span className="editorial-meta text-[#432623]">TOPIC MASTERY BREAKDOWN</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {completedProfile?.topics.map((tSummary) => {
                const pct = Math.round(tSummary.mastery * 100);
                const isMastered = tSummary.status === "mastered";
                const isDev = tSummary.status === "developing";
                const color = isMastered ? "bg-[#8ABB93]" : isDev ? "bg-[#DFA06E]" : "bg-[#DE2A35]";

                return (
                  <div
                    key={tSummary.topicId}
                    className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/25 rounded-[2px] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#432623]">
                        {TOPIC_DISPLAY_NAMES[tSummary.topicId]?.en}
                      </span>
                      <span className="font-mono font-bold text-[#432623]">
                        {pct}% ({tSummary.status.toUpperCase().replace("_", " ")})
                      </span>
                    </div>
                    <div className="w-full bg-[#F5F1BC] h-2 rounded-[2px] overflow-hidden">
                      <div className={`h-full rounded-[2px] ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#432623]/20">
            <button
              onClick={() => {
                setIsStarted(false);
                setIsFinished(false);
              }}
              className="neo-btn neo-btn-secondary px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 rounded-[2px]"
            >
              <ArrowCounterClockwise className="w-3.5 h-3.5" />
              <span>Check Another Student</span>
            </button>
            <button
              onClick={handleSaveAndFinish}
              className="neo-btn neo-btn-primary px-6 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-[2px]"
            >
              <span>SEE LEARNING PLAN &amp; SAVE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* SCREEN 2: ACTIVE ADAPTIVE ASSESSMENT (CALM DIAGNOSTIC)         */
        /* ============================================================== */
        <div className="space-y-4">
          {/* Top Editorial Diagnostic Bar */}
          <div className="bg-[var(--surface)] border border-[#432623]/25 rounded-[2px] p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#432623]/20 pb-3">
              <div>
                <span className="editorial-meta text-[#432623]/80">CLASS 5 MATHS CHECK</span>
                <div className="font-serif font-bold text-base sm:text-lg text-[#432623]">
                  {activeStudent?.student.name} • Class 5
                </div>
              </div>

              {/* Compact Assessment Status */}
              <div className="text-right">
                <span className="editorial-meta text-[#432623]/70">TOPIC BEING CHECKED</span>
                <div className="font-mono text-xs font-bold text-[#432623] mt-0.5">
                  {currentTopicName} • {agentState?.responses.length || 0} questions answered
                </div>
              </div>
            </div>

            {/* Assessment Progress Breadcrumbs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {CURRICULUM_TOPICS.map((tId: TopicId, idx: number) => {
                const currentIdx = agentState?.currentTopicIndex ?? 0;
                const isPast = idx < currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div
                    key={tId}
                    className={`px-3 py-1.5 rounded-[2px] border text-xs font-semibold flex items-center justify-between ${
                      isCurrent
                        ? "bg-[#432623] text-[#F5F1BC] border-[#432623]"
                        : isPast
                        ? "bg-[#8ABB93]/20 text-[#432623] border-[#8ABB93]/40"
                        : "bg-[#FAF8E8] dark:bg-[#432623]/30 text-[#432623]/70 border-[#432623]/20 opacity-70"
                    }`}
                  >
                    <span className="truncate">{TOPIC_DISPLAY_NAMES[tId]?.en}</span>
                    <span className="font-mono font-bold ml-1.5">
                      {isPast ? "✓" : isCurrent ? "●" : "○"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact System Status Prompt */}
          <div className="flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-[2px] bg-[#432623]" />
              <span className="font-medium text-[#432623]">
                {isPrereqProbe
                  ? "Checking a related skill..."
                  : currentDecision?.studentFeedbackPrompt || "Let's try this question."}
              </span>
            </div>

            {/* Collapsible Teacher Intelligence Trigger */}
            <button
              onClick={() => setShowTeacherTrace(!showTeacherTrace)}
              className="text-xs text-[#432623] font-semibold flex items-center gap-1 hover:underline"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>{showTeacherTrace ? "Hide Teacher Trace" : "Teacher Trace"}</span>
              {showTeacherTrace ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Teacher Trace */}
          {showTeacherTrace && currentDecision && (
            <div className="bg-[#F5F1BC]/70 border border-[#432623]/30 rounded-[2px] p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#432623] flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-[#432623]" />
                  Live Diagnostic Engine Trace
                </span>
                <span className="font-mono text-[10px] font-bold bg-[var(--surface)] text-[#432623] px-2 py-0.5 rounded-[2px] border border-[#432623]/30">
                  {currentDecision.action.toUpperCase()}
                </span>
              </div>
              <p className="text-[#432623] leading-relaxed">
                {currentDecision.reason}
              </p>
              <div className="flex items-center gap-4 text-[10px] font-mono text-[#432623]/70">
                <span>Target: {currentDecision.conceptId}</span>
                <span>Difficulty: Level {currentDecision.difficulty}</span>
                <span>Confidence: {Math.round(currentDecision.confidence * 100)}%</span>
              </div>
            </div>
          )}

          {/* Large Prominent Question Card */}
          {currentQuestion && (
            <div className="bg-[var(--surface)] border border-[#432623]/25 rounded-[2px] p-6 sm:p-8 space-y-6">
              {/* Question Eyebrow */}
              <div className="flex items-center justify-between border-b border-[#432623]/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="editorial-meta text-[#432623]/70">
                    QUESTION {((agentState?.responses.length || 0) + 1)}
                  </span>
                  <span className="text-xs text-[#432623]/40">•</span>
                  <span className="text-xs font-semibold text-[#432623]">{currentTopicName}</span>
                </div>
                {isPrereqProbe && (
                  <span className="bg-[#DFA06E]/20 text-[#432623] text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] border border-[#DFA06E]/40 uppercase">
                    Related Concept Check
                  </span>
                )}
              </div>

              {/* Large Question Text */}
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#432623] leading-snug">
                  {formatTxt(currentQuestion.prompt)}
                </h3>

                {currentQuestion.expression && (
                  <div className="py-5 text-center bg-[#FAF8E8] dark:bg-[#432623]/30 rounded-[2px] border border-[#432623]/20">
                    <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#432623] tracking-wider">
                      {currentQuestion.expression}
                    </span>
                  </div>
                )}
              </div>

              {/* Answer Options or Input */}
              {!feedback ? (
                <div className="space-y-4 pt-2">
                  {currentQuestion.options && currentQuestion.options.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentQuestion.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => handleSubmit(opt.value)}
                          disabled={isEvaluating}
                          className="neo-btn neo-btn-secondary p-4 text-left text-base sm:text-lg font-bold flex items-center justify-between rounded-[2px] group"
                        >
                          <span className="font-mono">{formatTxt(opt.label)}</span>
                          <span className="text-xs font-mono text-[#432623]/70 group-hover:text-[#432623]">
                            [Select]
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                      <Input
                        placeholder={dict.enterAnswer}
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit(userAnswer)}
                        disabled={isEvaluating}
                        className="h-12 font-mono text-lg bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/25 rounded-[2px] text-[#432623]"
                      />
                      <button
                        onClick={() => handleSubmit(userAnswer)}
                        disabled={isEvaluating}
                        className="neo-btn neo-btn-primary px-6 h-12 text-sm font-bold shrink-0 rounded-[2px]"
                      >
                        {dict.submitAnswer}
                      </button>
                    </div>
                  )}

                  {/* Student Hint Button */}
                  {currentQuestion.hint && (
                    <div className="pt-2">
                      {!showHint ? (
                        <button
                          type="button"
                          onClick={() => setShowHint(true)}
                          className="text-xs text-[#432623] font-semibold flex items-center gap-1 hover:underline"
                        >
                          <QuestionIcon className="w-3.5 h-3.5" />
                          <span>Need a hint?</span>
                        </button>
                      ) : (
                        <div className="bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#DFA06E]/40 p-3 rounded-[2px] text-xs text-[#432623]">
                          <strong className="text-[#DFA06E]">Hint:</strong> {formatTxt(currentQuestion.hint)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Calm Post-Submission Feedback */
                <div className="space-y-4 pt-2">
                  <div
                    className={`p-4 rounded-[2px] border flex items-center justify-between gap-4 ${
                      feedback.isCorrect
                        ? "bg-[#8ABB93]/15 border-[#8ABB93] text-[#432623]"
                        : "bg-[#DE2A35]/15 border-[#DE2A35] text-[#432623]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {feedback.isCorrect ? (
                        <CheckCircle className="w-5 h-5 shrink-0 text-[#8ABB93]" />
                      ) : (
                        <XCircle className="w-5 h-5 shrink-0 text-[#DE2A35]" />
                      )}
                      <span className="text-sm font-bold text-[#432623]">{feedback.message}</span>
                    </div>

                    <button
                      onClick={handleNextStep}
                      disabled={isEvaluating}
                      className="neo-btn neo-btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 shrink-0 rounded-[2px]"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
