"use client";

import React, { useState } from "react";
import type {
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Brain,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  GraduationCap,
  AlertTriangle,
  RotateCcw,
  Check,
} from "lucide-react";
import {
  initAssessmentAgent,
  evaluateAndDecideStep,
  estimateMastery,
  CURRICULUM_TOPICS,
  TOPIC_DISPLAY_NAMES,
} from "@/lib/engine/diagnostic";
import { CONCEPTS, TOPICS } from "@/lib/concepts/graph";
import { uid, makeRng } from "@/lib/rng";

interface Props {
  students: DemoStudentData[];
  initialStudentId?: string;
  initialConceptId?: string;
  onAssessmentCompleted: (updatedStudent: DemoStudentData) => void;
  onCancel: () => void;
}

export function AdaptiveAssessmentView({
  students,
  initialStudentId,
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

    let classification: any = isCorrect ? "correct" : "unclassified";
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

    (window as any).__lastResponse = newResponse;
  };

  // Advance to next adaptive step
  const handleNextStep = async () => {
    if (!agentState) return;

    const lastResp: StudentResponse | undefined = (window as any).__lastResponse;
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
      const fallback = evaluateAndDecideStep(agentState, lastResp, makeRng(Date.now()));
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
        <div className="neo-panel p-6 sm:p-8 space-y-6">
          <div className="border-b-[1.5px] border-[#172033]/15 pb-5">
            <span className="editorial-meta text-[#3156D3]">DIAGNOSTIC AGENT INITIALIZATION</span>
            <h2 className="editorial-title text-2xl sm:text-3xl text-[#171717] mt-1">
              Mathematics Diagnostic Assessment
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed max-w-2xl">
              A calm, adaptive diagnostic interview across all 4 Class 5 mathematics strands.
              When gaps are observed, the system seamlessly checks foundational prerequisites to isolate the true root cause.
            </p>
          </div>

          {/* Student Selector */}
          <div className="space-y-2">
            <label className="editorial-meta text-[#171717]">SELECT STUDENT TO ASSESS</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full h-11 px-3 text-sm font-semibold bg-[#F7F6F2] border-[1.5px] border-[#172033] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3156D3]"
            >
              {students.map((s) => (
                <option key={s.student.id} value={s.student.id}>
                  {s.student.name} (Roll #{s.student.rollNo}) — {s.profile.status.toUpperCase().replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Curriculum Scope Overview */}
          <div className="space-y-2.5">
            <span className="editorial-meta text-[#171717]">CURRICULUM ASSESSMENT SCOPE</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CURRICULUM_TOPICS.map((tId: TopicId, idx: number) => (
                <div
                  key={tId}
                  className="p-3 bg-[#F7F6F2] border-[1.5px] border-[#172033]/20 rounded-lg text-left"
                >
                  <div className="text-[10px] font-mono font-bold text-[#64748B] uppercase">
                    STAGE 0{idx + 1}
                  </div>
                  <div className="text-xs font-bold text-[#171717] mt-0.5">
                    {TOPIC_DISPLAY_NAMES[tId]?.en}
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-1 truncate">
                    {TOPICS[tId]?.targets.map((c: ConceptId) => t(`c_${c}`) || c).join(", ")}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#64748B] pt-1">
              The agent starts with Number Operations and tests each topic adaptively. During testing, the student experiences a calm, unpressured diagnostic without visible scores or timer stress.
            </p>
          </div>

          {/* Start CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#172033]/15">
            <button
              onClick={onCancel}
              className="neo-btn neo-btn-secondary px-5 py-2.5 text-xs font-bold w-full sm:w-auto"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleStart}
              className="neo-btn neo-btn-primary px-6 py-3 text-sm font-bold flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 text-blue-300" />
              <span>START DIAGNOSTIC ASSESSMENT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : isFinished ? (
        /* ============================================================== */
        /* SCREEN 3: ASSESSMENT COMPLETE SCREEN (DIAGNOSTIC REPORT)       */
        /* ============================================================== */
        <div className="neo-panel overflow-hidden space-y-6 p-6 sm:p-8">
          {/* Editorial Header */}
          <div className="border-b-[1.5px] border-[#172033]/15 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="editorial-meta text-[#2F855A]">DIAGNOSTIC COMPLETE</span>
                <span className="text-[#64748B] text-xs">•</span>
                <span className="text-xs font-mono font-bold text-[#3156D3]">
                  {activeStudent?.student.name} • CLASS 5A
                </span>
              </div>
              <h2 className="editorial-title text-2xl sm:text-3xl text-[#171717] mt-1">
                Assessment Complete
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                We&apos;ve synthesized the responses and isolated the concepts that need pedagogical attention.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 bg-[#F7F6F2] p-3 rounded-lg border-[1.5px] border-[#172033]/20">
              <div className="text-right">
                <div className="editorial-meta text-[#64748B]">OVERALL MASTERY</div>
                <div className="font-serif text-3xl font-black text-[#171717]">
                  {Math.round((completedProfile?.overallMastery ?? 0) * 100)}%
                </div>
              </div>
              <div className="w-[1px] h-8 bg-[#172033]/20" />
              <div className="text-right">
                <div className="editorial-meta text-[#64748B]">CONFIDENCE</div>
                <div className="font-mono text-xl font-bold text-[#2F855A]">
                  {Math.round((completedProfile?.overallConfidence ?? 0) * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Clean 4-Metric Summary Line */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#F7F6F2] rounded-lg border-[1.5px] border-[#172033]/20 text-center">
              <div className="editorial-meta text-[#64748B]">TOPICS ASSESSED</div>
              <div className="font-serif text-2xl font-bold text-[#171717] mt-1">4 Topics</div>
            </div>
            <div className="p-3 bg-[#F7F6F2] rounded-lg border-[1.5px] border-[#172033]/20 text-center">
              <div className="editorial-meta text-[#64748B]">QUESTIONS ASKED</div>
              <div className="font-serif text-2xl font-bold text-[#171717] mt-1">
                {agentState?.responses.length || 14}
              </div>
            </div>
            <div className="p-3 bg-[#F7F6F2] rounded-lg border-[1.5px] border-[#172033]/20 text-center">
              <div className="editorial-meta text-[#64748B]">PREREQUISITE CHECKS</div>
              <div className="font-serif text-2xl font-bold text-[#3156D3] mt-1">
                {agentState?.decisions.filter((d) => d.action === "PROBE_PREREQUISITE").length || 3}
              </div>
            </div>
            <div className="p-3 bg-[#F7F6F2] rounded-lg border-[1.5px] border-[#172033]/20 text-center">
              <div className="editorial-meta text-[#64748B]">GAPS ISOLATED</div>
              <div className="font-serif text-2xl font-bold text-[#C53030] mt-1">
                {completedProfile?.rootCauses.length || 1}
              </div>
            </div>
          </div>

          {/* Primary Gap Highlight Callout */}
          {completedProfile && completedProfile.rootCauses.length > 0 ? (
            <div className="p-5 bg-white border-[2px] border-[#172033] rounded-xl shadow-[3px_3px_0px_#172033] space-y-3">
              <div className="flex items-center justify-between">
                <span className="editorial-meta text-[#C53030]">PRIMARY LEARNING GAP DETECTED</span>
                <span className="text-[10px] font-mono font-bold uppercase bg-[#FFF5F5] text-[#C53030] px-2 py-0.5 rounded border border-[#C53030]/30">
                  REQUIRES PREREQUISITE REMEDIATION
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-3 bg-[#F7F6F2] rounded border border-[#172033]/15">
                  <div className="text-[10px] font-mono font-bold text-[#64748B] uppercase">ROOT GAP:</div>
                  <div className="font-serif text-lg font-bold text-[#C53030] mt-0.5">
                    {t(`c_${completedProfile.rootCauses[0].rootId}`) || completedProfile.rootCauses[0].rootId}
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    Missing prerequisite fluency that restricts higher-order performance.
                  </p>
                </div>

                <div className="p-3 bg-[#F7F6F2] rounded border border-[#172033]/15">
                  <div className="text-[10px] font-mono font-bold text-[#64748B] uppercase">AFFECTING CONCEPTS:</div>
                  <div className="font-serif text-lg font-bold text-[#171717] mt-0.5">
                    {completedProfile.rootCauses[0].symptomIds
                      .map((s) => t(`c_${s}`) || s)
                      .join(", ")}
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    Visible struggle points in Class 5 curriculum tasks.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-[#F0FFF4] border-[1.5px] border-[#2F855A] rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#2F855A] shrink-0" />
              <div>
                <h4 className="font-serif font-bold text-base text-[#171717]">
                  All Evaluated Strands Fluent
                </h4>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Student demonstrates conceptual mastery across all tested Class 5 mathematics strands.
                </p>
              </div>
            </div>
          )}

          {/* 4 Topic Performance Horizontal Bars */}
          <div className="space-y-3">
            <span className="editorial-meta text-[#171717]">TOPIC MASTERY BREAKDOWN</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {completedProfile?.topics.map((tSummary) => {
                const pct = Math.round(tSummary.mastery * 100);
                const isMastered = tSummary.status === "mastered";
                const isDev = tSummary.status === "developing";
                const color = isMastered ? "bg-[#2F855A]" : isDev ? "bg-[#B7791F]" : "bg-[#C53030]";

                return (
                  <div
                    key={tSummary.topicId}
                    className="p-3 bg-[#F7F6F2] border-[1.5px] border-[#172033]/20 rounded-lg space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#171717]">
                        {TOPIC_DISPLAY_NAMES[tSummary.topicId]?.en}
                      </span>
                      <span className="font-mono font-bold text-[#171717]">
                        {pct}% ({tSummary.status.toUpperCase().replace("_", " ")})
                      </span>
                    </div>
                    <div className="w-full bg-[#E2E2DC] h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#172033]/15">
            <button
              onClick={() => {
                setIsStarted(false);
                setIsFinished(false);
              }}
              className="neo-btn neo-btn-secondary px-4 py-2.5 text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Assess Another Student</span>
            </button>
            <button
              onClick={handleSaveAndFinish}
              className="neo-btn neo-btn-primary px-6 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              <span>VIEW LEARNING PROFILE &amp; SAVE</span>
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
          <div className="bg-white border-[1.5px] border-[#172033] rounded-xl p-4 sm:p-5 shadow-[2px_3px_0px_rgba(23,32,51,0.08)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-[1.5px] border-[#172033]/10 pb-3">
              <div>
                <span className="editorial-meta text-[#3156D3]">MATHEMATICS DIAGNOSTIC</span>
                <div className="font-serif font-bold text-base sm:text-lg text-[#171717]">
                  {activeStudent?.student.name} • Class 5
                </div>
              </div>

              {/* Compact Assessment Status */}
              <div className="text-right">
                <span className="editorial-meta text-[#64748B]">CURRENTLY ASSESSING</span>
                <div className="font-mono text-xs font-bold text-[#171717] mt-0.5">
                  {currentTopicName} • Evidence: {agentState?.responses.length || 0} items
                </div>
              </div>
            </div>

            {/* Assessment Progress Breadcrumbs: Number Operations ✓ | Multiplication ● | Division ○ | Fractions ○ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {CURRICULUM_TOPICS.map((tId: TopicId, idx: number) => {
                const currentIdx = agentState?.currentTopicIndex ?? 0;
                const isPast = idx < currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div
                    key={tId}
                    className={`px-3 py-1.5 rounded-lg border-[1.5px] text-xs font-semibold flex items-center justify-between transition-all ${
                      isCurrent
                        ? "bg-[#172033] text-white border-[#172033] shadow-[1.5px_1.5px_0px_#172033]"
                        : isPast
                        ? "bg-[#F0FFF4] text-[#2F855A] border-[#2F855A]/40"
                        : "bg-[#F7F6F2] text-[#64748B] border-[#172033]/15 opacity-70"
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

          {/* Compact System Status Prompt (Simple, Non-AI-slop language) */}
          <div className="flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3156D3] animate-pulse" />
              <span className="font-medium text-[#171717]">
                {isPrereqProbe
                  ? "Checking a related skill..."
                  : currentDecision?.studentFeedbackPrompt || "Let's try this question."}
              </span>
            </div>

            {/* Collapsible Teacher Intelligence Trigger */}
            <button
              onClick={() => setShowTeacherTrace(!showTeacherTrace)}
              className="text-xs text-[#3156D3] font-semibold flex items-center gap-1 hover:underline"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>{showTeacherTrace ? "Hide Teacher Trace" : "Teacher Trace"}</span>
              {showTeacherTrace ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Teacher Trace (Hidden from student unless toggled) */}
          {showTeacherTrace && currentDecision && (
            <div className="bg-[#EBF0FF] border-[1.5px] border-[#3156D3]/40 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#172033] flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-[#3156D3]" />
                  Live Diagnostic Engine Trace
                </span>
                <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-[#3156D3]/30">
                  {currentDecision.action.toUpperCase()}
                </span>
              </div>
              <p className="text-[#172033] leading-relaxed">
                {currentDecision.reason}
              </p>
              <div className="flex items-center gap-4 text-[10px] font-mono text-[#64748B]">
                <span>Target: {currentDecision.conceptId}</span>
                <span>Difficulty: Level {currentDecision.difficulty}</span>
                <span>Confidence: {Math.round(currentDecision.confidence * 100)}%</span>
              </div>
            </div>
          )}

          {/* Large Prominent Question Card */}
          {currentQuestion && (
            <div className="bg-white border-[2px] border-[#172033] rounded-xl p-6 sm:p-8 shadow-[3px_4px_0px_#172033] space-y-6">
              {/* Question Eyebrow */}
              <div className="flex items-center justify-between border-b-[1.5px] border-[#172033]/15 pb-3">
                <div className="flex items-center gap-2">
                  <span className="editorial-meta text-[#64748B]">
                    QUESTION {((agentState?.responses.length || 0) + 1)}
                  </span>
                  <span className="text-xs text-[#64748B]">•</span>
                  <span className="text-xs font-semibold text-[#171717]">{currentTopicName}</span>
                </div>
                {isPrereqProbe && (
                  <span className="bg-[#FFFDF5] text-[#B7791F] text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#B7791F]/30 uppercase">
                    Related Concept Check
                  </span>
                )}
              </div>

              {/* Large Question Text */}
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#171717] leading-snug">
                  {formatTxt(currentQuestion.prompt)}
                </h3>

                {currentQuestion.expression && (
                  <div className="py-5 text-center bg-[#F7F6F2] rounded-xl border-[1.5px] border-[#172033]/20">
                    <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-wider">
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
                          className="neo-btn neo-btn-secondary p-4 text-left text-base sm:text-lg font-bold flex items-center justify-between group"
                        >
                          <span className="font-mono">{formatTxt(opt.label)}</span>
                          <span className="text-xs font-mono text-[#64748B] group-hover:text-[#171717]">
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
                        className="h-12 font-mono text-lg bg-[#F7F6F2] border-[1.5px] border-[#172033] rounded-lg"
                      />
                      <button
                        onClick={() => handleSubmit(userAnswer)}
                        disabled={isEvaluating}
                        className="neo-btn neo-btn-primary px-6 h-12 text-sm font-bold shrink-0"
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
                          className="text-xs text-[#3156D3] font-semibold flex items-center gap-1 hover:underline"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Need a hint?</span>
                        </button>
                      ) : (
                        <div className="bg-[#FFFDF5] border-[1.5px] border-[#B7791F]/30 p-3 rounded-lg text-xs text-[#171717]">
                          <strong className="text-[#B7791F]">Hint:</strong> {formatTxt(currentQuestion.hint)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Calm Post-Submission Feedback */
                <div className="space-y-4 pt-2">
                  <div
                    className={`p-4 rounded-xl border-[1.5px] flex items-center justify-between gap-4 ${
                      feedback.isCorrect
                        ? "bg-[#F0FFF4] border-[#2F855A] text-[#2F855A]"
                        : "bg-[#FFF5F5] border-[#C53030] text-[#C53030]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {feedback.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 shrink-0" />
                      )}
                      <span className="text-sm font-bold text-[#171717]">{feedback.message}</span>
                    </div>

                    <button
                      onClick={handleNextStep}
                      disabled={isEvaluating}
                      className="neo-btn neo-btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 shrink-0"
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
