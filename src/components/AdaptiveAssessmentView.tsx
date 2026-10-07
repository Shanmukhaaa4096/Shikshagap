"use client";

import React, { useState, useEffect } from "react";
import type {
  ConceptId,
  DiagnosticResult,
  Question,
  Response as StudentResponse,
  TopicId,
  AssessmentAgentState,
  AgentDecisionRecord,
} from "@/lib/types";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  GitBranch,
  Layers,
  GraduationCap,
  Award,
  AlertTriangle,
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
  const { dict, t, formatTxt, lang } = useI18n();

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
      // Consult server agent endpoint (with Gemini or deterministic fallback)
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
        throw new Error("Server route response not ok");
      }
    } catch {
      // Seamless client-side deterministic fallback
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

    // Deterministic validation of mathematical correctness
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
        ? dict.correctFeedback
        : `${dict.incorrectFeedback} (${t(`err_${classification}`) || classification})`,
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
      // Call server agent route
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
        throw new Error("Server route error");
      }
    } catch {
      // Client-side fallback
      const baseline = evaluateAndDecideStep(agentState, lastResp, makeRng(Date.now()));
      setAgentState(baseline.nextState);
      setCurrentDecision(baseline.decision);

      if (baseline.nextState.assessmentComplete || !baseline.nextQuestion) {
        setIsFinished(true);
        setCurrentQuestion(null);
        setCompletedProfile(baseline.nextState.diagnosticResult || null);
      } else {
        setCurrentQuestion(baseline.nextQuestion);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  // Save Results & Update Student Profile
  const handleSaveAndFinish = () => {
    if (!activeStudent || !agentState) return;

    const diag = completedProfile || agentState.diagnosticResult;
    if (!diag) return;

    // Update concept masteries
    const updatedConcepts = { ...activeStudent.profile.concepts };
    const evaluatedConcepts = Array.from(new Set(agentState.responses.map((r) => r.conceptId)));

    evaluatedConcepts.forEach((cId) => {
      const cResps = agentState.responses.filter((r) => r.conceptId === cId);
      updatedConcepts[cId] = estimateMastery(cId, cResps);
    });

    const isCritical = diag.rootCauses.some((r) => r.severity === "high");
    const isNeedPractice = diag.rootCauses.length > 0 || (diag.overallMastery < 0.75);

    const updatedProfile = {
      ...activeStudent.profile,
      concepts: updatedConcepts,
      rootCauses: diag.rootCauses.length > 0 ? diag.rootCauses : activeStudent.profile.rootCauses,
      overallMastery: diag.overallMastery,
      confidence: diag.overallConfidence,
      status: isCritical
        ? ("critical" as const)
        : isNeedPractice
        ? ("need_practice" as const)
        : ("on_track" as const),
      nextConcept: diag.recommendedNextConcept,
      nextReason: diag.rootCauses.length > 0 ? ("root_cause" as const) : ("frontier" as const),
      topicSummaries: diag.topics,
      lastDiagnosticResult: diag,
      evidenceCount: activeStudent.profile.evidenceCount + agentState.responses.length,
      lastAssessedAt: new Date().toISOString(),
    };

    onAssessmentCompleted({
      ...activeStudent,
      profile: updatedProfile,
    });
  };

  const currentTopic = agentState?.currentTopic || CURRICULUM_TOPICS[0];
  const currentTopicName = TOPIC_DISPLAY_NAMES[currentTopic]?.[lang as "en" | "hi" | "te"] || TOPIC_DISPLAY_NAMES[currentTopic]?.en;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              {dict.assessmentTitle}
            </h2>
            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 text-[11px] font-semibold gap-1">
              <Sparkles className="w-3 h-3" />
              AI Adaptive Diagnostic
            </Badge>
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            Autonomous multi-topic gap discovery & prerequisite backtracking
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-sm font-semibold">
          {dict.backToDashboard}
        </Button>
      </div>

      {!isStarted ? (
        /* Configuration Screen — Student, Class & Subject (No pre-selected weak concept) */
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-zinc-50/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Configure Diagnostic Session
            </CardTitle>
            <CardDescription className="text-xs">
              Select the student. The AI agent autonomously evaluates all curriculum topics to discover learning gaps.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 block mb-1.5">
                  Student Name
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border rounded-xl h-11 px-3 text-sm font-semibold"
                >
                  {students.map((s) => (
                    <option key={s.student.id} value={s.student.id}>
                      {s.student.name} (Roll #{s.student.rollNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 block mb-1.5">
                  Class / Grade
                </label>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800/60 border rounded-xl h-11 px-3 flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Class 5 (PM SHRI Govt School)
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 block mb-1.5">
                  Subject
                </label>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800/60 border rounded-xl h-11 px-3 flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Mathematics
                </div>
              </div>
            </div>

            {/* Diagnostic Scope Banner */}
            <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  Full Curriculum Scope (All 4 Topics Assessed)
                </span>
                <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                  Dynamic Stopping Rule
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CURRICULUM_TOPICS.map((tId: TopicId, idx: number) => (
                  <div
                    key={tId}
                    className="bg-white dark:bg-zinc-900 border rounded-lg p-2.5 shadow-2xs text-left"
                  >
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">
                      Topic {idx + 1}
                    </div>
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">
                      {TOPIC_DISPLAY_NAMES[tId]?.en}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
                      {TOPICS[tId]?.targets.map((c: ConceptId) => t(`c_${c}`) || c).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-900/80 dark:text-blue-200 leading-relaxed">
                The agent begins with Number Operations and tests each topic adaptively. If an error is observed, it dynamically backtracks to foundational prerequisites to identify the root cause before moving forward.
              </p>
            </div>

            <Button
              onClick={handleStart}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-xs gap-2 text-base"
            >
              <Sparkles className="w-5 h-5" />
              Start AI Diagnostic Assessment
            </Button>
          </CardContent>
        </Card>
      ) : isFinished ? (
        /* Comprehensive Learning Profile Screen */
        <div className="space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 text-xs font-semibold mb-2">
                    Diagnostic Complete
                  </Badge>
                  <h3 className="text-2xl font-black text-white">
                    {activeStudent?.student.name} • Learning Profile
                  </h3>
                  <p className="text-sm text-blue-200 mt-1">
                    Class 5A • Mathematics Diagnostic Assessment (All 4 Topics Synthesized)
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-blue-300">
                      Overall Mastery
                    </div>
                    <div className="text-3xl font-black text-white">
                      {Math.round((completedProfile?.overallMastery ?? 0) * 100)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-blue-300">
                      Confidence
                    </div>
                    <div className="text-3xl font-black text-emerald-400">
                      {Math.round((completedProfile?.overallConfidence ?? 0) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* 4 Topic Performance Cards */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Curriculum Topic Mastery
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {completedProfile?.topics.map((tSummary) => {
                    const statusColor =
                      tSummary.status === "mastered"
                        ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200"
                        : tSummary.status === "developing"
                        ? "border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200"
                        : "border-rose-300 bg-rose-50/60 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200";

                    const badgeColor =
                      tSummary.status === "mastered"
                        ? "bg-emerald-600 text-white"
                        : tSummary.status === "developing"
                        ? "bg-amber-600 text-white"
                        : "bg-rose-600 text-white";

                    return (
                      <div
                        key={tSummary.topicId}
                        className={`border rounded-xl p-4 space-y-2.5 ${statusColor}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">
                            {TOPIC_DISPLAY_NAMES[tSummary.topicId]?.en}
                          </span>
                          <Badge className={`text-[10px] font-bold ${badgeColor}`}>
                            {tSummary.status === "mastered"
                              ? "Mastered"
                              : tSummary.status === "developing"
                              ? "Developing"
                              : "Needs Support"}
                          </Badge>
                        </div>
                        <div className="text-2xl font-extrabold">
                          {Math.round(tSummary.mastery * 100)}%
                        </div>
                        <div className="text-[11px] opacity-80">
                          {tSummary.evidenceCount} questions answered
                          {tSummary.prerequisiteProbesCount ? ` • ${tSummary.prerequisiteProbesCount} prereq probes` : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Primary Gap & Root Cause Analysis */}
              {completedProfile && completedProfile.rootCauses.length > 0 ? (
                <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <h4 className="text-sm font-bold uppercase tracking-wider">
                      Primary Learning Gap & Isolated Root Cause
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-rose-100 dark:border-rose-900/50">
                      <div className="text-xs font-semibold text-zinc-500">Curriculum Symptom:</div>
                      <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                        {completedProfile.rootCauses[0].symptomIds
                          .map((s) => t(`c_${s}`) || s)
                          .join(", ")}
                      </div>
                      <div className="text-xs text-zinc-500 mt-2">
                        Observed performance struggle in upper curriculum tasks.
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-rose-100 dark:border-rose-900/50">
                      <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                        Diagnosed Root Cause:
                      </div>
                      <div className="text-base font-black text-rose-700 dark:text-rose-300 mt-0.5">
                        {t(`c_${completedProfile.rootCauses[0].rootId}`) || completedProfile.rootCauses[0].rootId}
                      </div>
                      <div className="text-xs text-zinc-500 mt-2">
                        Foundational prerequisite gap preventing mastery.
                      </div>
                    </div>
                  </div>

                  {/* Backtracking Chain */}
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 pt-1">
                    <span className="text-zinc-500 font-normal">Backtracking Investigation Chain: </span>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                      {completedProfile.rootCauses[0].chain
                        .map((c) => t(`c_${c}`) || c)
                        .join("  ──►  ")}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-5 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      On Track Across All Evaluated Topics
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Student demonstrates conceptual fluency and confidence across all 4 Class 5 mathematics topics. Ready for advanced enrichment.
                    </p>
                  </div>
                </div>
              )}

              {/* Evidence Trail */}
              {agentState && agentState.responses.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    Diagnostic Evidence Trail ({agentState.responses.length} Items)
                  </h4>
                  <div className="border rounded-xl divide-y overflow-hidden max-h-60 overflow-y-auto">
                    {agentState.responses.map((resp, idx) => (
                      <div
                        key={resp.id}
                        className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      >
                        <div className="flex items-center gap-2.5">
                          {resp.correct ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                              Q{idx + 1} ({t(`c_${resp.conceptId}`) || resp.conceptId}):
                            </span>{" "}
                            <span className="text-zinc-600 dark:text-zinc-400 font-mono">
                              Answer: &quot;{resp.answer}&quot;
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            L{resp.difficulty}
                          </Badge>
                          {!resp.correct && (
                            <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px]">
                              {resp.classification}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Next Step */}
              <div className="bg-zinc-50 dark:bg-zinc-900 border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Recommended Pedagogical Next Step
                  </div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                    {completedProfile?.rootCauses[0]
                      ? `Strengthen ${t(`c_${completedProfile.rootCauses[0].rootId}`) || completedProfile.rootCauses[0].rootId} with manipulative-based remediation before intensive multi-step practice.`
                      : "Continue with Grade 5 curriculum enrichment and problem solving."}
                  </div>
                </div>
                <Button
                  onClick={handleSaveAndFinish}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 h-11 rounded-xl shadow-xs shrink-0"
                >
                  Save & Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Active Question Display */
        <div className="space-y-4">
          {/* Topic Progress Bar & Breadcrumbs */}
          <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Topic {(agentState?.currentTopicIndex ?? 0) + 1} of {CURRICULUM_TOPICS.length}:{" "}
                <span className="text-blue-600 dark:text-blue-400">{currentTopicName}</span>
              </span>
              <span className="text-zinc-500 font-mono">
                Questions Answered: {agentState?.responses.length || 0}
              </span>
            </div>

            {/* Topic Breadcrumbs */}
            <div className="grid grid-cols-4 gap-2">
              {CURRICULUM_TOPICS.map((tId: TopicId, idx: number) => {
                const currentIdx = agentState?.currentTopicIndex ?? 0;
                const isPast = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                const tState = agentState?.topicStates[tId];


                let pillColor = "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400";
                if (isPast) {
                  pillColor =
                    tState?.status === "mastered"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300";
                } else if (isCurrent) {
                  pillColor = "bg-blue-600 text-white border-blue-600 shadow-xs";
                }

                return (
                  <div
                    key={tId}
                    className={`border rounded-lg px-2.5 py-1.5 text-center text-xs font-semibold truncate transition-colors ${pillColor}`}
                  >
                    <span className="mr-1">
                      {isPast ? "✓" : isCurrent ? "●" : `${idx + 1}.`}
                    </span>
                    {TOPIC_DISPLAY_NAMES[tId]?.en}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student Status Prompt */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              {currentDecision?.studentFeedbackPrompt || "Checking your understanding..."}
            </span>
            <button
              onClick={() => setShowTeacherTrace(!showTeacherTrace)}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline"
            >
              <Brain className="w-3.5 h-3.5" />
              {showTeacherTrace ? "Hide Teacher Intelligence" : "Show Teacher Intelligence"}
              {showTeacherTrace ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Expandable Teacher Intelligence View */}
          {showTeacherTrace && currentDecision && (
            <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-blue-600" />
                  Live Agent Decision Trace
                </span>
                <Badge variant="outline" className="font-mono text-[10px] bg-white dark:bg-zinc-900">
                  Action: {currentDecision.action} ({currentDecision.source})
                </Badge>
              </div>
              <p className="text-blue-800 dark:text-blue-200 leading-relaxed font-medium">
                {currentDecision.reason}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-blue-700 dark:text-blue-300">
                <span>
                  <strong>Target Concept:</strong> {currentDecision.conceptId}
                </span>
                <span>
                  <strong>Difficulty:</strong> Level {currentDecision.difficulty}
                </span>
                <span>
                  <strong>Confidence:</strong> {Math.round(currentDecision.confidence * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Student Question Card */}
          {currentQuestion && (
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b bg-zinc-50 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      Question #{((agentState?.responses.length || 0) + 1)}
                    </Badge>
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      {currentTopicName}
                    </span>
                  </div>
                  <Badge className="bg-zinc-800 text-white text-[11px]">
                    Level {currentQuestion.difficulty}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
                    {formatTxt(currentQuestion.prompt)}
                  </h3>
                  {currentQuestion.expression && (
                    <div className="py-4 text-center">
                      <span className="font-mono text-3xl font-black text-blue-700 dark:text-blue-400 tracking-wider bg-blue-50/50 dark:bg-blue-950/30 px-6 py-2 rounded-xl border border-blue-200 dark:border-blue-900">
                        {currentQuestion.expression}
                      </span>
                    </div>
                  )}
                </div>

                {/* Multiple Choice Options or Text Input */}
                {!feedback && (
                  <div className="space-y-4 pt-2">
                    {currentQuestion.options && currentQuestion.options.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentQuestion.options.map((opt) => (
                          <Button
                            key={opt.id}
                            variant="outline"
                            onClick={() => handleSubmit(opt.value)}
                            disabled={isEvaluating}
                            className="h-14 justify-start px-4 text-base font-semibold hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20"
                          >
                            <span className="font-mono text-zinc-900 dark:text-zinc-100">
                              {formatTxt(opt.label)}
                            </span>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-2 max-w-sm">
                        <Input
                          placeholder={dict.enterAnswer}
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSubmit(userAnswer)}
                          disabled={isEvaluating}
                          className="h-11 font-mono text-base"
                        />
                        <Button
                          onClick={() => handleSubmit(userAnswer)}
                          disabled={isEvaluating}
                          className="h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-xs"
                        >
                          {dict.submitAnswer}
                        </Button>
                      </div>
                    )}

                    {/* Hint Trigger */}
                    {currentQuestion.hint && (
                      <div className="pt-2">
                        {!showHint ? (
                          <button
                            type="button"
                            onClick={() => setShowHint(true)}
                            className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            {dict.showHint}
                          </button>
                        ) : (
                          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                            <strong>{dict.hintLabel}:</strong> {formatTxt(currentQuestion.hint)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback Banner */}
                {feedback && (
                  <div
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                      feedback.isCorrect
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200"
                        : "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {feedback.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600" />
                      )}
                      <span className="text-sm font-semibold">{feedback.message}</span>
                    </div>
                    <Button
                      onClick={handleNextStep}
                      disabled={isEvaluating}
                      className="bg-zinc-900 text-white hover:bg-black font-semibold h-9 px-4 text-xs shrink-0"
                    >
                      {dict.nextQuestion} →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
