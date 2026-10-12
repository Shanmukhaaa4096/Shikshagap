"use client";

import React, { useState, useRef } from "react";
import type {
  ConceptId,
  Question,
  TopicId,
  Attempt,
  SessionMemory,
  TopicMemory,
  TopicStatus,
  DiagnosticResult,
  MasteryEstimate,
  ResourceRecommendation,
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
  BookOpen,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import {
  CURRICULUM_TOPICS,
  TOPIC_DISPLAY_NAMES,
  estimateMastery,
} from "@/lib/engine/diagnostic";
import { TOPICS } from "@/lib/concepts/graph";
import {
  createSessionMemory,
  getNextStaircaseAction,
  applyAttemptToMemory,
  getConceptForTopic,
} from "@/lib/agents/staircase";
import { generateUnique } from "@/lib/questions/generator";
import { makeRng } from "@/lib/rng";
import { getClassConfig, DEFAULT_CLASS_ID } from "@/lib/curriculum/classes";

interface Props {
  students: DemoStudentData[];
  initialStudentId?: string;
  initialConceptId?: string;
  isStudentView?: boolean;
  selectedClassId?: string;
  onAssessmentCompleted: (updatedStudent: DemoStudentData) => void;
  onCancel: () => void;
}

export function AdaptiveAssessmentView({
  students,
  initialStudentId,
  isStudentView = false,
  selectedClassId = DEFAULT_CLASS_ID,
  onAssessmentCompleted,
  onCancel,
}: Props) {
  const { lang, dict, t, formatTxt } = useI18n();
  const classConfig = getClassConfig(selectedClassId);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.student.id || "student_1"
  );

  // Agent Runtime State: SessionMemory managed on client per SPEC.md
  const [isStarted, setIsStarted] = useState(false);
  const [sessionMemory, setSessionMemory] = useState<SessionMemory | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [recommendations, setRecommendations] = useState<ResourceRecommendation[]>([]);
  const [reportSummary, setReportSummary] = useState<string>("");
  const [isLoadingFinish, setIsLoadingFinish] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showTeacherTrace, setShowTeacherTrace] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isBackupQuestion, setIsBackupQuestion] = useState(false);
  const lastAttemptRef = useRef<Attempt | null>(null);

  const activeStudent = students.find((s) => s.student.id === selectedStudentId);

  // Helper to trigger finish endpoint (Resource Advisor + Report Writer)
  const completeAssessment = async (finalMem: SessionMemory) => {
    setIsFinished(true);
    setCurrentQuestion(null);
    setIsLoadingFinish(true);
    try {
      const res = await fetch("/api/assessment/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory: finalMem }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
        setReportSummary(data.summary || "");
      }
    } catch {
      // Ignore network errors in finish fetch; fallback remains gracefully empty or populated
    } finally {
      setIsLoadingFinish(false);
    }
  };

  // Start Multi-Topic Staircase Assessment
  const handleStart = async () => {
    if (!activeStudent) return;

    // Use strictly pseudonymous ID (DPDP compliance)
    const pseudonymousId = "anon_" + (activeStudent.student.id ? activeStudent.student.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) : "learner");
    const gradeVal = (classConfig.grade === 3 || classConfig.grade === 4 || classConfig.grade === 5)
      ? (classConfig.grade as 3 | 4 | 5)
      : 5;

    const initialMemory = createSessionMemory(
      pseudonymousId,
      gradeVal,
      lang as "en" | "hi" | "te",
      (classConfig.topics && classConfig.topics.length > 0 ? classConfig.topics : CURRICULUM_TOPICS) as TopicId[]
    );

    setIsStarted(true);
    setIsFinished(false);
    setRecommendations([]);
    setReportSummary("");
    setFeedback(null);
    setShowHint(false);
    setIsEvaluating(true);
    lastAttemptRef.current = null;

    let fetchSucceeded = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("/api/assessment/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memory: initialMemory }),
        });

        if (res.ok) {
          const data = await res.json();
          setSessionMemory(data.memory || initialMemory);
          setCurrentQuestion(data.nextQuestion);
          setIsBackupQuestion(false);
          fetchSucceeded = true;
          break;
        }
      } catch {
        // Retry once on failure before using backup question
      }
    }

    if (!fetchSucceeded) {
      // Deterministic client fallback with stable seed derived from student
      setIsBackupQuestion(true);
      const fallbackRng = makeRng(12345 + (activeStudent?.student.rollNo || 1));
      const action = getNextStaircaseAction(initialMemory);
      if (action.type === "ask") {
        const seen = new Set<string>();
        const q = generateUnique(action.conceptId, action.level, fallbackRng, seen, classConfig.grade);
        setSessionMemory({
          ...initialMemory,
          seenSignatures: Array.from(seen),
        });
        setCurrentQuestion(q);
      }
    }
    setIsEvaluating(false);
  };

  // Submit Student Answer
  const handleSubmit = (answerValue: string) => {
    if (!currentQuestion || !sessionMemory || isEvaluating) return;

    const trimmed = answerValue.trim();
    if (!trimmed) return;

    const isCorrect = trimmed === String(currentQuestion.answer);

    let errorType: string | undefined = undefined;
    if (!isCorrect && currentQuestion.meta.bugs && currentQuestion.meta.bugs[trimmed]) {
      errorType = currentQuestion.meta.bugs[trimmed];
    } else if (!isCorrect) {
      errorType = "slip";
    }

    const newAttempt: Attempt = {
      conceptId: currentQuestion.conceptId,
      level: currentQuestion.difficulty,
      questionId: currentQuestion.id,
      studentAnswer: trimmed,
      correct: isCorrect,
      errorType: !isCorrect ? errorType : undefined,
    };

    setFeedback({
      isCorrect,
      message: isCorrect
        ? "Good job! Let's continue."
        : "Let's check another question to understand this.",
    });

    lastAttemptRef.current = newAttempt;
  };

  // Advance to next staircase question
  const handleNextStep = async () => {
    if (!sessionMemory) return;

    const lastAttempt: Attempt | null = lastAttemptRef.current;
    setFeedback(null);
    setUserAnswer("");
    setShowHint(false);
    setIsEvaluating(true);

    let fetchSucceeded = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("/api/assessment/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memory: sessionMemory,
            lastAttempt: lastAttempt || undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const updatedMemory: SessionMemory = data.memory;
          setSessionMemory(updatedMemory);

          if (data.isFinished || !data.nextQuestion) {
            completeAssessment(updatedMemory);
          } else {
            setCurrentQuestion(data.nextQuestion);
            setIsBackupQuestion(false);
          }
          fetchSucceeded = true;
          break;
        }
      } catch {
        // Retry once on failure before using backup question
      }
    }

    if (!fetchSucceeded) {
      // Deterministic fallback using staircase pure engine
      setIsBackupQuestion(true);
      if (lastAttempt) {
        const advanced = applyAttemptToMemory(sessionMemory, lastAttempt);
        setSessionMemory(advanced.memory);

        if (advanced.action.type === "finish") {
          setSessionMemory(advanced.memory);
          completeAssessment(advanced.memory);
        } else if (advanced.action.type === "ask") {
          const seen = new Set<string>(advanced.memory.seenSignatures || []);
          const fallbackSeed = 9999 + (activeStudent?.student.rollNo || 1) * 31 + (sessionMemory.topics.reduce((acc, t) => acc + t.attempts.length, 0));
          const nextQ = generateUnique(
            advanced.action.conceptId,
            advanced.action.level,
            makeRng(fallbackSeed),
            seen,
            sessionMemory.grade
          );
          setSessionMemory({
            ...advanced.memory,
            seenSignatures: Array.from(seen),
          });
          setCurrentQuestion(nextQ);
        }
      }
    }
    lastAttemptRef.current = null;
    setIsEvaluating(false);
  };

  // Save diagnostic findings and return to teacher dashboard
  const handleSaveAndFinish = () => {
    if (!activeStudent || !sessionMemory) {
      onCancel();
      return;
    }

    const gapTopics = sessionMemory.topics.filter((t) => t.status === "gap");
    const devTopics = sessionMemory.topics.filter((t) => t.status === "developing");

    const calculatedStatus: "on_track" | "need_practice" | "critical" =
      gapTopics.length > 0
        ? "critical"
        : devTopics.length > 0
        ? "need_practice"
        : "on_track";

    const allAttempts = sessionMemory.topics.flatMap((t) => t.attempts);
    const correctCount = allAttempts.filter((a) => a.correct).length;
    const overallMastery = allAttempts.length > 0 ? correctCount / allAttempts.length : 1;

    const conceptEstimations: Partial<Record<ConceptId, MasteryEstimate>> = {};
    const touchedConcepts = new Set(allAttempts.map((a) => a.conceptId));
    touchedConcepts.forEach((cId) => {
      const related = allAttempts.filter((a) => a.conceptId === cId);
      const corr = related.filter((a) => a.correct).length;
      conceptEstimations[cId] = {
        conceptId: cId,
        alpha: 1 + corr,
        beta: 1 + (related.length - corr),
        attempts: related.length,
        correct: corr,
        mastery: related.length > 0 ? corr / related.length : 0.5,
        confidence: Math.min(1, related.length * 0.4),
        status: corr === related.length ? "mastered" : corr > 0 ? "developing" : "needs_support",
        lastUpdated: new Date().toISOString(),
      };
    });

    const updatedStudent: DemoStudentData = {
      ...activeStudent,
      profile: {
        ...activeStudent.profile,
        overallMastery,
        confidence: 0.9,
        status: calculatedStatus,
        concepts: {
          ...activeStudent.profile.concepts,
          ...conceptEstimations,
        },
      },
    };

    onAssessmentCompleted(updatedStudent);
  };

  const currentTopicMemory = sessionMemory?.topics[sessionMemory?.currentTopicIndex ?? 0];
  const currentTopicId: TopicId = currentTopicMemory?.topicId || "number_ops";
  const currentTopicName = TOPIC_DISPLAY_NAMES[currentTopicId]?.en || "Number Operations";

  // Filter topics for final screen per SPEC.md: gap first, then developing, then mastered
  const gapTopics = sessionMemory?.topics.filter((t) => t.status === "gap") || [];
  const devTopics = sessionMemory?.topics.filter((t) => t.status === "developing") || [];
  const masteredTopics = sessionMemory?.topics.filter((t) => t.status === "mastered") || [];
  const totalQuestionsAnswered = sessionMemory?.topics.reduce((acc, t) => acc + t.attempts.length, 0) || 0;

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
              Class {classConfig.grade} Maths Check
            </h2>
            <p className="text-xs sm:text-sm text-[#432623]/80 mt-1 leading-relaxed max-w-2xl">
              A calm check across curriculum maths topics using the difficulty staircase.
              Each topic starts at medium difficulty (level 2) and adjusts based on the student&apos;s answer.
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
            <span className="editorial-meta text-[#432623]">{classConfig.label.toUpperCase()} ASSESSMENT SCOPE</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(classConfig.topics || CURRICULUM_TOPICS).map((tId: TopicId, idx: number) => (
                <div
                  key={tId}
                  className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/25 rounded-[2px] text-left"
                >
                  <div className="text-[10px] font-mono font-bold text-[#432623]/70 uppercase">
                    STAGE 0{idx + 1}
                  </div>
                  <div className="text-xs font-bold text-[#432623] mt-0.5">
                    {TOPIC_DISPLAY_NAMES[tId]?.en || tId}
                  </div>
                  <div className="text-[10px] text-[#432623]/70 mt-1 truncate">
                    {TOPICS[tId]?.targets.map((c: ConceptId) => t(`c_${c}`) || c).join(", ")}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#432623]/80 pt-1">
              The check moves topic by topic. At most 2 questions per topic, starting at Level 2.
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
        /* SPEC.md: lists gap topics first, then developing, then mastered*/
        /* ============================================================== */
        <div className="neo-panel overflow-hidden space-y-6 p-6 sm:p-8 rounded-[2px] border border-[#432623]/25 bg-[var(--surface)]">
          {/* Editorial Header */}
          <div className="border-b border-[#432623]/20 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="editorial-meta text-[#432623] font-bold">TEST COMPLETE</span>
                <span className="text-[#432623]/40 text-xs">•</span>
                <span className="text-xs font-mono font-bold text-[#432623]">
                  {activeStudent?.student.name} • CLASS {classConfig.grade}
                </span>
              </div>
              <h2 className="editorial-title text-2xl sm:text-3xl text-[#432623] mt-1">
                Assessment Results
              </h2>
              <p className="text-xs sm:text-sm text-[#432623]/80 mt-0.5">
                Staircase check completed. Topics are grouped below by mastery status.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 bg-[#FAF8E8] dark:bg-[#432623]/30 p-3 rounded-[2px] border border-[#432623]/25">
              <div className="text-right">
                <div className="editorial-meta text-[#432623]/70">TOPICS ASSESSED</div>
                <div className="font-serif text-3xl font-black text-[#432623]">
                  {sessionMemory?.topics.length || 0}
                </div>
              </div>
              <div className="w-[1px] h-8 bg-[#432623]/20" />
              <div className="text-right">
                <div className="editorial-meta text-[#432623]/70">QUESTIONS ASKED</div>
                <div className="font-mono text-xl font-bold text-[#432623]">
                  {totalQuestionsAnswered}
                </div>
              </div>
            </div>
          </div>

          {/* Clean 3-Metric Summary Line */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 rounded-[2px] border border-[#DE2A35]/30 text-center">
              <div className="editorial-meta text-[#DE2A35]">GAPS ISOLATED</div>
              <div className="font-serif text-2xl font-bold text-[#DE2A35] mt-1">
                {gapTopics.length}
              </div>
            </div>
            <div className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 rounded-[2px] border border-[#DFA06E]/30 text-center">
              <div className="editorial-meta text-[#DFA06E]">NEEDS PRACTICE</div>
              <div className="font-serif text-2xl font-bold text-[#DFA06E] mt-1">
                {devTopics.length}
              </div>
            </div>
            <div className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 rounded-[2px] border border-[#8ABB93]/30 text-center">
              <div className="editorial-meta text-[#8ABB93]">MASTERED</div>
              <div className="font-serif text-2xl font-bold text-[#8ABB93] mt-1">
                {masteredTopics.length}
              </div>
            </div>
          </div>

          {/* 1. GAP TOPICS FIRST per SPEC.md */}
          {gapTopics.length > 0 && (
            <div className="space-y-3">
              <span className="editorial-meta text-[#DE2A35]">LEARNING GAPS (NEEDS FOUNDATIONAL SUPPORT)</span>
              <div className="grid grid-cols-1 gap-2.5">
                {gapTopics.map((topicMem) => (
                  <div
                    key={topicMem.topicId}
                    className="p-4 bg-[var(--surface)] border border-[#DE2A35]/40 rounded-[2px] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-base text-[#432623]">
                        {TOPIC_DISPLAY_NAMES[topicMem.topicId]?.en || topicMem.topicId}
                      </div>
                      <p className="text-xs text-[#432623]/80 mt-0.5">
                        Failed level 2 and level 1. Foundational support needed before advancing.
                      </p>
                      {topicMem.misconceptions && topicMem.misconceptions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {topicMem.misconceptions.map((m) => (
                            <span key={m} className="text-[10px] font-mono uppercase bg-[#DE2A35]/15 text-[#DE2A35] px-2 py-0.5 rounded-[2px] border border-[#DE2A35]/25">
                              {m.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                      {topicMem.notes && topicMem.notes.length > 0 && (
                        <p className="text-[11px] italic text-[#432623]/70 mt-1">
                          Teacher Note: {topicMem.notes.join("; ")}
                        </p>
                      )}
                    </div>
                    <span className="bg-[#DE2A35]/15 text-[#DE2A35] text-xs font-mono font-bold px-2.5 py-1 rounded-[2px] border border-[#DE2A35]/30 uppercase">
                      GAP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. DEVELOPING TOPICS SECOND per SPEC.md */}
          {devTopics.length > 0 && (
            <div className="space-y-3">
              <span className="editorial-meta text-[#DFA06E]">NEEDS PRACTICE (DEVELOPING)</span>
              <div className="grid grid-cols-1 gap-2.5">
                {devTopics.map((topicMem) => (
                  <div
                    key={topicMem.topicId}
                    className="p-4 bg-[var(--surface)] border border-[#DFA06E]/40 rounded-[2px] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-base text-[#432623]">
                        {TOPIC_DISPLAY_NAMES[topicMem.topicId]?.en || topicMem.topicId}
                      </div>
                      <p className="text-xs text-[#432623]/80 mt-0.5">
                        Concept partially established. Additional practice recommended.
                      </p>
                      {topicMem.misconceptions && topicMem.misconceptions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {topicMem.misconceptions.map((m) => (
                            <span key={m} className="text-[10px] font-mono uppercase bg-[#DFA06E]/15 text-[#DFA06E] px-2 py-0.5 rounded-[2px] border border-[#DFA06E]/25">
                              {m.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                      {topicMem.notes && topicMem.notes.length > 0 && (
                        <p className="text-[11px] italic text-[#432623]/70 mt-1">
                          Teacher Note: {topicMem.notes.join("; ")}
                        </p>
                      )}
                    </div>
                    <span className="bg-[#DFA06E]/15 text-[#DFA06E] text-xs font-mono font-bold px-2.5 py-1 rounded-[2px] border border-[#DFA06E]/30 uppercase">
                      NEEDS PRACTICE
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. MASTERED TOPICS LAST per SPEC.md */}
          {masteredTopics.length > 0 && (
            <div className="space-y-3">
              <span className="editorial-meta text-[#8ABB93]">COMPLETED (MASTERED)</span>
              <div className="grid grid-cols-1 gap-2.5">
                {masteredTopics.map((topicMem) => (
                  <div
                    key={topicMem.topicId}
                    className="p-4 bg-[var(--surface)] border border-[#8ABB93]/40 rounded-[2px] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-5 h-5 text-[#8ABB93]" />
                      <div className="font-bold text-base text-[#432623]">
                        {TOPIC_DISPLAY_NAMES[topicMem.topicId]?.en || topicMem.topicId}
                      </div>
                    </div>
                    <span className="bg-[#8ABB93]/15 text-[#8ABB93] text-xs font-mono font-bold px-2.5 py-1 rounded-[2px] border border-[#8ABB93]/30 uppercase">
                      DONE
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. RECOMMENDED RESOURCES WITH REASONS per SPEC.md */}
          {isLoadingFinish ? (
            <div className="p-6 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/20 rounded-[2px] text-center space-y-2">
              <div className="inline-block animate-spin w-5 h-5 border-2 border-[#432623] border-t-transparent rounded-full" />
              <p className="text-xs font-mono font-bold text-[#432623]/80">
                Finding targeted study materials and generating assessment summary...
              </p>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#432623]" />
                <span className="editorial-meta text-[#432623]">
                  RECOMMENDED STUDY MATERIALS (VERIFIED RAG ADVISOR)
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {recommendations.map((recGroup) => (
                  <div
                    key={recGroup.topicId}
                    className="p-4 bg-[var(--surface)] border border-[#432623]/25 rounded-[2px] space-y-3"
                  >
                    <div className="border-b border-[#432623]/15 pb-2">
                      <span className="text-xs font-mono font-bold text-[#432623]/70 uppercase">
                        RESOURCES FOR
                      </span>
                      <h4 className="font-serif font-bold text-base text-[#432623]">
                        {TOPIC_DISPLAY_NAMES[recGroup.topicId]?.en || recGroup.topicId}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {recGroup.resources.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/20 rounded-[2px] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 bg-[#432623]/10 text-[#432623] rounded-[2px]">
                                {item.source} • {item.type}
                              </span>
                            </div>
                            <h5 className="font-bold text-xs text-[#432623] mt-1.5 leading-snug">
                              {item.title}
                            </h5>
                            <p className="text-[11px] text-[#432623]/80 mt-1 italic">
                              &ldquo;{item.reason}&rdquo;
                            </p>
                          </div>

                          <div className="pt-2 mt-2 border-t border-[#432623]/15 flex justify-end">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#432623] hover:underline"
                            >
                              <span>Open Resource</span>
                              <ArrowSquareOut className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* 5. ASSESSMENT SUMMARY per SPEC.md */}
          {reportSummary && (
            <div className="p-4 sm:p-5 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/25 rounded-[2px] space-y-2">
              <span className="editorial-meta text-[#432623]">
                ASSESSMENT SUMMARY ({sessionMemory?.language.toUpperCase()})
              </span>
              <p className="font-serif text-sm sm:text-base text-[#432623] leading-relaxed">
                {reportSummary}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#432623]/20">
            <button
              onClick={() => {
                setIsStarted(false);
                setIsFinished(false);
                setSessionMemory(null);
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
              <span>SAVE &amp; RETURN TO DASHBOARD</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* SCREEN 2: ACTIVE ADAPTIVE ASSESSMENT                           */
        /* ============================================================== */
        <div className="space-y-4">
          {/* Top Editorial Diagnostic Bar */}
          <div className="bg-[var(--surface)] border border-[#432623]/25 rounded-[2px] p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#432623]/20 pb-3">
              <div>
                <span className="editorial-meta text-[#432623]/80">CLASS {classConfig.grade} MATHS CHECK</span>
                <div className="font-serif font-bold text-base sm:text-lg text-[#432623]">
                  {activeStudent?.student.name} • Class {classConfig.grade}
                </div>
              </div>

              {/* Compact Assessment Status */}
              <div className="text-right">
                <span className="editorial-meta text-[#432623]/70">TOPIC BEING CHECKED</span>
                <div className="font-mono text-xs font-bold text-[#432623] mt-0.5">
                  {currentTopicName} • Question {((currentTopicMemory?.attempts.length || 0) + 1)} of 2
                </div>
              </div>
            </div>

            {/* Assessment Progress Breadcrumbs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {(sessionMemory?.topics || []).map((tMem: TopicMemory, idx: number) => {
                const currentIdx = sessionMemory?.currentTopicIndex ?? 0;
                const isPast = idx < currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div
                    key={tMem.topicId}
                    className={`px-3 py-1.5 rounded-[2px] border text-xs font-semibold flex items-center justify-between ${
                      isCurrent
                        ? "bg-[#432623] text-[#F5F1BC] border-[#432623]"
                        : isPast
                        ? tMem.status === "mastered"
                          ? "bg-[#8ABB93]/20 text-[#432623] border-[#8ABB93]/40"
                          : tMem.status === "gap"
                          ? "bg-[#DE2A35]/20 text-[#432623] border-[#DE2A35]/40"
                          : "bg-[#DFA06E]/20 text-[#432623] border-[#DFA06E]/40"
                        : "bg-[#FAF8E8] dark:bg-[#432623]/30 text-[#432623]/70 border-[#432623]/20 opacity-70"
                    }`}
                  >
                    <span className="truncate">{TOPIC_DISPLAY_NAMES[tMem.topicId]?.en || tMem.topicId}</span>
                    <span className="font-mono font-bold ml-1.5">
                      {isPast ? (tMem.status === "mastered" ? "✓" : tMem.status === "gap" ? "✗" : "~") : isCurrent ? "●" : "○"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Large Prominent Question Card */}
          {currentQuestion && (
            <div className="bg-[var(--surface)] border border-[#432623]/25 rounded-[2px] p-6 sm:p-8 space-y-6">
              {/* Question Eyebrow */}
              <div className="flex items-center justify-between border-b border-[#432623]/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="editorial-meta text-[#432623]/70">
                    QUESTION {totalQuestionsAnswered + 1}
                  </span>
                  <span className="text-xs text-[#432623]/40">•</span>
                  <span className="text-xs font-semibold text-[#432623]">{currentTopicName}</span>
                  {isBackupQuestion && (
                    <span
                      data-testid="backup-question-note"
                      className="ml-2 inline-flex items-center text-[10px] sm:text-xs px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-800 border border-amber-200"
                    >
                      Using backup question
                    </span>
                  )}
                </div>
                <span className="bg-[#FAF8E8] dark:bg-[#432623]/30 text-[#432623] text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] border border-[#432623]/25 uppercase">
                  DIFFICULTY LEVEL {currentQuestion.difficulty}
                </span>
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
                /* Post-Submission Feedback */
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
