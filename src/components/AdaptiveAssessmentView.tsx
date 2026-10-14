"use client";

import React, { useState, useRef, useEffect } from "react";
import { queueOfflineAction, syncOfflineQueue } from "@/lib/offline/sync";
import type {
  ConceptId,
  Question,
  TopicId,
  Attempt,
  SessionMemory,
  MasteryEstimate,
  ResourceRecommendation,
} from "@/lib/types";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import type { Lang } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  Brain,
  CheckCircle,
  ArrowRight,
  Question as QuestionIcon,
  ArrowCounterClockwise,
  BookOpen,
  ArrowSquareOut,
  Flag,
  WarningCircle,
  Printer,
  Sparkle,
} from "@phosphor-icons/react";
import { MascotHero } from "@/components/illustrations/MascotHero";
import { WorksheetModal } from "@/components/WorksheetModal";
import { getSkillEntry } from "@/data/skillSheet";
import {
  CURRICULUM_TOPICS,
  TOPIC_DISPLAY_NAMES,
} from "@/lib/engine/diagnostic";
import { TOPICS } from "@/lib/concepts/graph";
import {
  createSessionMemory,
  getNextStaircaseAction,
  applyAttemptToMemory,
} from "@/lib/agents/staircase";
import { generateUnique } from "@/lib/questions/generator";
import { makeRng } from "@/lib/rng";
import { getClassConfig, DEFAULT_CLASS_ID, ENABLED_CLASSES } from "@/lib/curriculum/classes";
import { generateRemediationPlan } from "@/lib/engine/remediation";
import type { RootCause } from "@/lib/types";

function generateClientSessionId(): string {
  const ts = typeof Date !== "undefined" ? Date.now() : 0;
  const rand = typeof Math !== "undefined" ? Math.random().toString(36).slice(2, 10) : "seed";
  return `sess_${ts}_${rand}`;
}

interface Props {
  students?: DemoStudentData[];
  initialStudentId?: string;
  initialConceptId?: string;
  isStudentView?: boolean;
  isGuest?: boolean;
  selectedClassId?: string;
  onClassChange?: (newClassId: string) => void;
  onAssessmentCompleted?: (updatedStudent: DemoStudentData) => void;
  onCancel?: () => void;
}

export function AdaptiveAssessmentView({
  students,
  initialStudentId,
  isStudentView = false,
  isGuest = false,
  selectedClassId = DEFAULT_CLASS_ID,
  onClassChange,
  onAssessmentCompleted,
  onCancel,
}: Props) {
  const { lang, setLang, dict, t, formatTxt } = useI18n();
  const classConfig = getClassConfig(selectedClassId);

  const fallbackGuestStudent: DemoStudentData = {
    student: {
      id: "guest_learner",
      name: "Guest Learner",
      rollNo: 1,
      classroomId: selectedClassId,
      isDemo: true,
    },
    profile: {
      studentId: "guest_learner",
      overallMastery: 0.5,
      confidence: 0.5,
      status: "need_practice",
      concepts: {},
      strong: [],
      developing: [],
      needsSupport: [],
      inferredOk: [],
      rootCauses: [],
      nextConcept: null,
      nextReason: "none",
      evidenceCount: 0,
      lastAssessedAt: "2026-10-14T00:00:00.000Z",
    },
  };

  const effectiveStudents = students && students.length > 0 ? students : [fallbackGuestStudent];
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || effectiveStudents[0]?.student.id || "guest_learner"
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
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluatingSeconds, setEvaluatingSeconds] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isBackupQuestion, setIsBackupQuestion] = useState(false);
  const [reportedQuestionId, setReportedQuestionId] = useState<string | null>(null);
  const [isWorksheetOpen, setIsWorksheetOpen] = useState(false);
  const lastAttemptRef = useRef<Attempt | null>(null);
  const clientSessionIdRef = useRef<string>("");
  const sessionClosedRef = useRef<boolean>(false);

  const sessionStorageKey = `sg_assessment_session_${selectedClassId}_${selectedStudentId}`;

  // Restore session from sessionStorage on mount / class change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem(sessionStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.sessionMemory && parsed.isStarted) {
          setSessionMemory(parsed.sessionMemory);
          setCurrentQuestion(parsed.currentQuestion || null);
          setUserAnswer(parsed.userAnswer || "");
          setFeedback(parsed.feedback || null);
          setIsStarted(Boolean(parsed.isStarted));
          setIsFinished(Boolean(parsed.isFinished));
          setRecommendations(parsed.recommendations || []);
          setReportSummary(parsed.reportSummary || "");
          if (parsed.clientSessionId) {
            clientSessionIdRef.current = parsed.clientSessionId;
          }
        }
      }
    } catch {
      // Graceful fallback
    }
  }, [sessionStorageKey]);

  // Persist session to sessionStorage on state updates
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (isStarted && sessionMemory) {
        sessionStorage.setItem(
          sessionStorageKey,
          JSON.stringify({
            isStarted,
            isFinished,
            sessionMemory,
            currentQuestion,
            userAnswer,
            feedback,
            recommendations,
            reportSummary,
            clientSessionId: clientSessionIdRef.current,
          })
        );
      }
    } catch {
      // Graceful fallback
    }
  }, [sessionStorageKey, isStarted, isFinished, sessionMemory, currentQuestion, userAnswer, feedback, recommendations, reportSummary]);

  const clearSavedSession = () => {
    try {
      sessionStorage.removeItem(sessionStorageKey);
    } catch {
      // ignore
    }
  };

  // Track evaluating duration for calm loading message after 3s without calling setState synchronously in effect body
  useEffect(() => {
    if (!isEvaluating) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      setEvaluatingSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isEvaluating]);

  // Flush queued offline sessions on load
  useEffect(() => {
    syncOfflineQueue().catch(() => {});
  }, []);

  // Send anonymous session close on visibilitychange if student leaves after answering >= 1 question
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "hidden" &&
        sessionMemory &&
        !sessionClosedRef.current &&
        !isFinished
      ) {
        // Count total questions answered so far
        const totalAttempts = sessionMemory.topics.reduce((acc, t) => acc + t.attempts.length, 0);
        if (totalAttempts >= 1 && clientSessionIdRef.current) {
          sessionClosedRef.current = true;
          const questionsList = sessionMemory.topics.flatMap((t) =>
            t.attempts.map((att) => ({
              questionId: att.questionId || `${att.conceptId}_${att.level}`,
              conceptId: att.conceptId,
              level: att.level,
              correct: att.correct,
              errorType: att.errorType,
            }))
          );

          const topicOutcomes = sessionMemory.topics.map((t) => ({
            topicId: t.topicId,
            status: t.status,
          }));

          const now = new Date();
          now.setMinutes(0, 0, 0);

          const payload = {
            sessionId: clientSessionIdRef.current,
            grade: sessionMemory.grade,
            language: sessionMemory.language,
            hourTimestamp: now.toISOString(),
            questions: questionsList,
            topicOutcomes,
          };

          const payloadStr = JSON.stringify(payload);
          let sent = false;
          if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
            const blob = new Blob([payloadStr], { type: "application/json" });
            sent = navigator.sendBeacon("/api/assessment/session-close", blob);
          }

          if (!sent) {
            // Queue in client outbox for retry
            queueOfflineAction({
              type: "session_close",
              timestamp: Date.now(),
              payload,
            });
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sessionMemory, isFinished]);

  const handleReportQuestion = async () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id || `${currentQuestion.conceptId}_${currentQuestion.difficulty}`;
    setReportedQuestionId(qId);
    try {
      await fetch("/api/assessment/report-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: qId, conceptId: currentQuestion.conceptId }),
      });
    } catch {
      // Graceful offline fallback
    }
  };

  const activeStudent = effectiveStudents.find((s) => s.student.id === selectedStudentId) || effectiveStudents[0];

  // Helper to trigger finish endpoint (Resource Advisor + Report Writer)
  const completeAssessment = async (finalMem: SessionMemory) => {
    setIsFinished(true);
    setCurrentQuestion(null);
    setIsLoadingFinish(true);
    sessionClosedRef.current = true; // Assessment finalized cleanly
    try {
      const res = await fetch("/api/assessment/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memory: finalMem,
          sessionId: clientSessionIdRef.current || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
        setReportSummary(data.summary || "");
      } else {
        // Queue payload offline if finish endpoint is unreachable
        const questionsList = finalMem.topics.flatMap((t) =>
          t.attempts.map((att) => ({
            questionId: att.questionId || `${att.conceptId}_${att.level}`,
            conceptId: att.conceptId,
            level: att.level,
            correct: att.correct,
            errorType: att.errorType,
          }))
        );
        const topicOutcomes = finalMem.topics.map((t) => ({
          topicId: t.topicId,
          status: t.status,
        }));
        const now = new Date();
        now.setMinutes(0, 0, 0);
        const fallbackId = generateClientSessionId();
        queueOfflineAction({
          type: "session_close",
          payload: {
            sessionId: clientSessionIdRef.current || fallbackId,
            grade: finalMem.grade,
            language: finalMem.language,
            hourTimestamp: now.toISOString(),
            questions: questionsList,
            topicOutcomes,
          },
        });
      }
    } catch {
      // Graceful offline fallback: queue offline update
      const questionsList = finalMem.topics.flatMap((t) =>
        t.attempts.map((att) => ({
          questionId: att.questionId || `${att.conceptId}_${att.level}`,
          conceptId: att.conceptId,
          level: att.level,
          correct: att.correct,
          errorType: att.errorType,
        }))
      );
      const topicOutcomes = finalMem.topics.map((t) => ({
        topicId: t.topicId,
        status: t.status,
      }));
      const now = new Date();
      now.setMinutes(0, 0, 0);
      const fallbackId = generateClientSessionId();
      queueOfflineAction({
        type: "session_close",
        payload: {
          sessionId: clientSessionIdRef.current || fallbackId,
          grade: finalMem.grade,
          language: finalMem.language,
          hourTimestamp: now.toISOString(),
          questions: questionsList,
          topicOutcomes,
        },
      });
    } finally {
      setIsLoadingFinish(false);
    }
  };

  // Start Multi-Topic Staircase Assessment
  const handleStart = async () => {
    if (!activeStudent) return;

    clearSavedSession();
    // Generate random anonymous sessionId on client (never built from student data)
    clientSessionIdRef.current = generateClientSessionId();
    sessionClosedRef.current = false;

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
    setHasError(false);
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
      try {
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
            usedFormats: [q.format],
          });
          setCurrentQuestion(q);
        }
      } catch (err) {
        console.error("Failed to generate fallback initial question", err);
        setHasError(true);
      }
    }
    setIsEvaluating(false);
  };

  // Submit Student Answer
  const handleSubmit = (answerValue: string) => {
    if (!currentQuestion || !sessionMemory || isEvaluating || Boolean(feedback)) return;

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
        ? dict.correctFeedback || "Good job! Let's continue."
        : dict.incorrectFeedback || "Needs practice with this step.",
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
    setHasError(false);

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
      try {
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
            const usedFormats = advanced.memory.usedFormats || [];
            const lastFormat = usedFormats.length > 0 ? usedFormats[usedFormats.length - 1] : undefined;
            const fallbackSeed = 9999 + (activeStudent?.student.rollNo || 1) * 31 + (sessionMemory.topics.reduce((acc, t) => acc + t.attempts.length, 0));
            const nextQ = generateUnique(
              advanced.action.conceptId,
              advanced.action.level,
              makeRng(fallbackSeed),
              seen,
              sessionMemory.grade,
              {},
              { avoidFormat: lastFormat }
            );
            setSessionMemory({
              ...advanced.memory,
              seenSignatures: Array.from(seen),
              usedFormats: [...usedFormats, nextQ.format],
            });
            setCurrentQuestion(nextQ);
          }
        }
      } catch (err) {
        console.error("Failed to advance fallback question", err);
        setHasError(true);
      }
    }
    lastAttemptRef.current = null;
    setIsEvaluating(false);
  };

  // Save diagnostic findings and return to teacher dashboard
  const handleSaveAndFinish = () => {
    clearSavedSession();
    if (!activeStudent || !sessionMemory) {
      if (onCancel) onCancel();
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

    if (onAssessmentCompleted) {
      onAssessmentCompleted(updatedStudent);
    } else if (onCancel) {
      onCancel();
    }
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
            <h1 className="editorial-title text-2xl sm:text-3xl text-[#432623] mt-1 font-serif font-black">
              Class {classConfig.grade} Maths Check
            </h1>
            <p className="text-sm sm:text-sm text-[#432623]/80 mt-1 leading-relaxed max-w-2xl">
              A calm check across curriculum maths topics using the difficulty staircase.
              Each topic starts at medium difficulty (level 2) and adjusts based on the student&apos;s answer.
            </p>
          </div>

          {/* Student Selector or Personal Learner Banner */}
          {isGuest ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#8ABB93]/60 rounded-[2px] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8ABB93] animate-pulse" />
                  <div>
                    <span className="editorial-meta text-[#8ABB93] font-bold">TRIAL ASSESSMENT</span>
                    <div className="font-serif font-bold text-lg text-[#432623] dark:text-[#F5F1BC]">
                      Guest Learner • {classConfig.label}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-[#8ABB93]/20 text-[#432623] dark:text-[#F5F1BC] px-2.5 py-1 rounded-[2px] border border-[#8ABB93]/40">
                  No Sign-in Required
                </span>
              </div>

              {/* Class & Language Pickers for Guest */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="editorial-meta text-[#432623]">SELECT CLASS GRADE</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ENABLED_CLASSES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          clearSavedSession();
                          onClassChange?.(c.id);
                        }}
                        className={`min-h-[44px] px-3 py-2 text-sm font-bold font-mono rounded-[2px] border transition-colors ${
                          selectedClassId === c.id
                            ? "bg-[#432623] text-[#F5F1BC] border-[#432623]"
                            : "bg-[#FAF8E8] dark:bg-[#432623]/30 text-[#432623] border-[#432623]/25 hover:bg-[#F5F1BC]/50"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="editorial-meta text-[#432623]">ASSESSMENT LANGUAGE</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["en", "hi", "te"] as Lang[]).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLang(l)}
                        className={`min-h-[44px] px-3 py-2 text-sm font-bold font-mono rounded-[2px] border transition-colors ${
                          lang === l
                            ? "bg-[#432623] text-[#F5F1BC] border-[#432623]"
                            : "bg-[#FAF8E8] dark:bg-[#432623]/30 text-[#432623] border-[#432623]/25 hover:bg-[#F5F1BC]/50"
                        }`}
                      >
                        {l === "en" ? "English" : l === "hi" ? "हिन्दी" : "తెలుగు"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : isStudentView ? (
            <div className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/25 rounded-[2px] flex items-center justify-between">
              <div>
                <span className="editorial-meta text-[#432623]/70">LEARNER</span>
                <div className="font-serif font-bold text-lg text-[#432623] dark:text-[#F5F1BC]">{activeStudent?.student.name}</div>
              </div>
              <span className="font-mono text-sm font-bold text-[#432623]/70 dark:text-[#F5F1BC]/70">Roll #{activeStudent?.student.rollNo}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="editorial-meta text-[#432623]">SELECT STUDENT TO ASSESS</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full h-11 px-3 text-sm font-semibold bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/25 rounded-[2px] text-[#432623] focus:outline-none focus:ring-1 focus:ring-[#432623]"
              >
                {effectiveStudents.map((s) => (
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
                  <div className="text-sm font-mono font-bold text-[#432623]/70 uppercase">
                    STAGE 0{idx + 1}
                  </div>
                  <div className="text-sm font-bold text-[#432623] mt-0.5">
                    {TOPIC_DISPLAY_NAMES[tId]?.en || tId}
                  </div>
                  <div className="text-sm text-[#432623]/70 mt-1 truncate">
                    {TOPICS[tId]?.targets.map((c: ConceptId) => t(`c_${c}`) || c).join(", ")}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-[#432623]/80 pt-1">
              The check moves topic by topic. At most 2 questions per topic, starting at Level 2.
            </p>
          </div>

          {/* Start CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#432623]/20">
            <button
              onClick={onCancel ? onCancel : () => { window.location.href = "/"; }}
              className="neo-btn neo-btn-secondary px-5 py-2.5 min-h-[44px] text-sm font-bold w-full sm:w-auto rounded-[2px]"
            >
              {isGuest ? "Back to Home" : "Back to Dashboard"}
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
                <span className="text-[#432623]/40 text-sm">•</span>
                <span className="text-sm font-mono font-bold text-[#432623]">
                  {activeStudent?.student.name} • CLASS {classConfig.grade}
                </span>
              </div>
              <h2 className="editorial-title text-2xl sm:text-3xl text-[#432623] mt-1">
                Assessment Results
              </h2>
              <p className="text-sm sm:text-sm text-[#432623]/80 mt-0.5">
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

          {/* Clean 3-Metric Summary Line with friendly child-level wording */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 rounded-[2px] border border-[#DE2A35]/30 text-center">
              <div className="editorial-meta text-[#DE2A35] flex items-center justify-center gap-1">
                <WarningCircle className="w-3.5 h-3.5" />
                <span>NEEDS PRACTICE</span>
              </div>
              <div className="font-serif text-2xl font-bold text-[#DE2A35] mt-1">
                {gapTopics.length}
              </div>
            </div>
            <div className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 rounded-[2px] border border-[#DFA06E]/30 text-center">
              <div className="editorial-meta text-[#432623] font-bold flex items-center justify-center gap-1">
                <Sparkle className="w-3.5 h-3.5 text-[#DFA06E]" />
                <span>GETTING THERE</span>
              </div>
              <div className="font-serif text-2xl font-bold text-[#432623] mt-1">
                {devTopics.length}
              </div>
            </div>
            <div className="p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 rounded-[2px] border border-[#8ABB93]/30 text-center">
              <div className="editorial-meta text-[#432623] font-bold flex items-center justify-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-[#8ABB93]" />
                <span>STRONG</span>
              </div>
              <div className="font-serif text-2xl font-bold text-[#432623] mt-1">
                {masteredTopics.length}
              </div>
            </div>
          </div>

          {/* 1. TOPICS TO PRACTISE FIRST (GAP TOPICS) */}
          {gapTopics.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="editorial-meta text-[#DE2A35] font-bold">
                  TOPICS TO PRACTISE FIRST
                </span>
                <span className="text-sm text-[#432623]/70 font-mono">
                  {gapTopics.length} {gapTopics.length === 1 ? "topic" : "topics"}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {gapTopics.map((topicMem) => {
                  const targetConcept = TOPICS[topicMem.topicId]?.targets[0];
                  const skill = targetConcept ? getSkillEntry(targetConcept, classConfig.grade) : undefined;
                  const outcomeText = skill?.outcome || "Foundational skills in this topic need extra practice before moving on.";

                  return (
                    <div
                      key={topicMem.topicId}
                      className="p-4 bg-[var(--surface)] border border-[#DE2A35]/40 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="font-serif font-bold text-lg text-[#432623]">
                          {TOPIC_DISPLAY_NAMES[topicMem.topicId]?.en || topicMem.topicId}
                        </div>
                        <p className="text-base text-[#432623]/80 leading-relaxed max-w-xl">
                          {outcomeText}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 bg-[#FAF8E8] border border-[#DE2A35] text-[#B51E28] font-bold text-sm px-3 py-1 rounded-[2px] shrink-0 self-start sm:self-center">
                        <WarningCircle className="w-4 h-4 text-[#B51E28]" weight="bold" />
                        <span>Needs Practice</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. DEVELOPING TOPICS (GETTING THERE) */}
          {devTopics.length > 0 && (
            <div className="space-y-3">
              <span className="editorial-meta text-[#432623] font-bold">
                NEXT STEPS TO PRACTISE
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {devTopics.map((topicMem) => {
                  const targetConcept = TOPICS[topicMem.topicId]?.targets[0];
                  const skill = targetConcept ? getSkillEntry(targetConcept, classConfig.grade) : undefined;
                  const outcomeText = skill?.outcome || "Good foundation established; a few more exercises will build full confidence.";

                  return (
                    <div
                      key={topicMem.topicId}
                      className="p-4 bg-[var(--surface)] border border-[#DFA06E]/40 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="font-serif font-bold text-lg text-[#432623]">
                          {TOPIC_DISPLAY_NAMES[topicMem.topicId]?.en || topicMem.topicId}
                        </div>
                        <p className="text-base text-[#432623]/80 leading-relaxed max-w-xl">
                          {outcomeText}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 bg-[#DFA06E] text-[#432623] font-bold text-sm px-3 py-1 rounded-[2px] border border-[#DFA06E] shrink-0 self-start sm:self-center">
                        <Sparkle className="w-4 h-4 text-[#432623]" weight="fill" />
                        <span>Getting There</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. MASTERED TOPICS (STRONG) */}
          {masteredTopics.length > 0 && (
            <div className="space-y-3">
              <span className="editorial-meta text-[#432623] font-bold">
                CONCEPTS COMPLETED
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {masteredTopics.map((topicMem) => {
                  const targetConcept = TOPICS[topicMem.topicId]?.targets[0];
                  const skill = targetConcept ? getSkillEntry(targetConcept, classConfig.grade) : undefined;
                  const outcomeText = skill?.outcome || "Learner demonstrates solid understanding across target curriculum concepts.";

                  return (
                    <div
                      key={topicMem.topicId}
                      className="p-4 bg-[var(--surface)] border border-[#8ABB93]/40 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="font-serif font-bold text-lg text-[#432623]">
                          {TOPIC_DISPLAY_NAMES[topicMem.topicId]?.en || topicMem.topicId}
                        </div>
                        <p className="text-base text-[#432623]/80 leading-relaxed max-w-xl">
                          {outcomeText}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 bg-[#8ABB93] text-[#432623] font-bold text-sm px-3 py-1 rounded-[2px] border border-[#8ABB93] shrink-0 self-start sm:self-center">
                        <CheckCircle className="w-4 h-4 text-[#432623]" weight="bold" />
                        <span>Strong</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5-DAY TARGETED CLASSROOM IMPROVEMENT PLAN */}
          {gapTopics.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-[#432623]/20 pb-2">
                <Sparkle className="w-4 h-4 text-[#DE2A35]" weight="fill" />
                <span className="editorial-meta text-[#DE2A35] font-bold">
                  RECOMMENDED 5-DAY TARGETED CLASSROOM PLAN
                </span>
              </div>
              <div className="space-y-4">
                {gapTopics.map((topicMem) => {
                  const targetConcept = TOPICS[topicMem.topicId]?.targets[0] || (topicMem.topicId as ConceptId);
                  const rootCause: RootCause = {
                    rootId: targetConcept,
                    symptomIds: TOPICS[topicMem.topicId]?.targets.filter((c) => c !== targetConcept) || [],
                    chain: [targetConcept],
                    severity: "high",
                    confidence: 0.8,
                    rootMastery: 0.3,
                    uncheckedPrereqs: [],
                    isSelfRoot: true,
                    evidence: [],
                    misconceptions: [],
                    priority: 1,
                  };
                  const plan = generateRemediationPlan(activeStudent?.student.id || "guest", rootCause);
                  return (
                    <div
                      key={topicMem.topicId}
                      className="p-4 sm:p-5 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#DE2A35]/30 rounded-[2px] space-y-3"
                    >
                      <div>
                        <span className="text-xs font-mono uppercase tracking-wider text-[#B51E28] font-bold">
                          TARGET ROOT GAP: {t(`c_${targetConcept}`) || targetConcept}
                        </span>
                        <h4 className="font-serif text-lg font-bold text-[#432623] mt-0.5">
                          5-Day Concrete Remediation Activity Plan
                        </h4>
                        <p className="text-sm text-[#432623]/80 mt-1 leading-relaxed">
                          {plan.aiNote}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-2">
                        {plan.days.map((d) => (
                          <div
                            key={d.day}
                            className="p-2.5 bg-[var(--surface)] border border-[#432623]/20 rounded-[2px] flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#DE2A35]">
                                <span>DAY {d.day}</span>
                                <span>{d.minutes}m</span>
                              </div>
                              <div className="font-bold text-xs text-[#432623] mt-1 leading-snug">
                                {formatTxt(d.title)}
                              </div>
                              <p className="text-xs text-[#432623]/70 mt-1 line-clamp-3">
                                {formatTxt(d.activity)}
                              </p>
                            </div>
                            <div className="mt-2 pt-1 border-t border-[#432623]/10 text-xs font-mono text-[#432623]/60 uppercase">
                              Focus: {d.focus}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prominent Large Print Worksheet Button */}
          <div className="p-4 sm:p-6 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/25 rounded-[2px] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-serif text-lg font-bold text-[#432623]">
                Print Practice Worksheet
              </h3>
              <p className="text-base text-[#432623]/80">
                Generate a ready-to-print practice sheet matched to this student&apos;s exact needs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsWorksheetOpen(true)}
              className="neo-btn neo-btn-primary min-h-[52px] px-8 text-base font-bold flex items-center justify-center gap-2.5 w-full sm:w-auto shrink-0 rounded-[2px]"
            >
              <Printer className="w-5 h-5 text-[#F5F1BC]" />
              <span>Print Worksheet</span>
            </button>
          </div>

          {/* 4. RECOMMENDED RESOURCES WITH REASONS */}
          {isLoadingFinish ? (
            <div className="p-6 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/20 rounded-[2px] text-center space-y-2">
              <div className="inline-block animate-spin w-5 h-5 border-2 border-[#432623] border-t-transparent rounded-full" />
              <p className="text-sm font-mono font-bold text-[#432623]/80">
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
                      <span className="text-sm font-mono font-bold text-[#432623]/70 uppercase">
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
                              <span className="text-sm font-mono font-bold uppercase px-1.5 py-0.5 bg-[#432623]/10 text-[#432623] rounded-[2px]">
                                {item.source} • {item.type}
                              </span>
                            </div>
                            <h5 className="font-bold text-sm text-[#432623] mt-1.5 leading-snug">
                              {item.title}
                            </h5>
                            <p className="text-sm text-[#432623]/80 mt-1 italic">
                              &ldquo;{item.reason}&rdquo;
                            </p>
                          </div>

                          <div className="pt-2 mt-2 border-t border-[#432623]/15 flex justify-end">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm font-bold text-[#432623] hover:underline"
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

          {/* 5. ASSESSMENT SUMMARY */}
          {reportSummary && (
            <div className="p-4 sm:p-5 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/25 rounded-[2px] space-y-2">
              <span className="editorial-meta text-[#432623]">
                ASSESSMENT SUMMARY ({sessionMemory?.language.toUpperCase()})
              </span>
              <p className="font-serif text-base text-[#432623] leading-relaxed">
                {reportSummary}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#432623]/20">
            <button
              type="button"
              onClick={() => {
                clearSavedSession();
                setIsStarted(false);
                setIsFinished(false);
                setSessionMemory(null);
                setCurrentQuestion(null);
                setFeedback(null);
              }}
              className="neo-btn neo-btn-secondary min-h-[48px] px-6 text-base font-bold flex items-center justify-center gap-2 rounded-[2px] w-full sm:w-auto"
            >
              <ArrowCounterClockwise className="w-4 h-4" />
              <span>{isGuest ? "Take Another Trial Check" : "Check Another Student"}</span>
            </button>
            {isGuest ? (
              <a
                href="/login?redirect=/app"
                className="neo-btn neo-btn-primary min-h-[48px] px-8 text-base font-bold flex items-center justify-center gap-2 rounded-[2px] w-full sm:w-auto text-center"
              >
                <span>TEACHER SIGN IN TO SAVE RESULTS</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <button
                type="button"
                onClick={handleSaveAndFinish}
                className="neo-btn neo-btn-primary min-h-[48px] px-8 text-base font-bold flex items-center justify-center gap-2 rounded-[2px] w-full sm:w-auto"
              >
                <span>SAVE &amp; RETURN TO DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Modal for Printable Practice Worksheet */}
          {activeStudent && (
            <WorksheetModal
              data={activeStudent}
              isOpen={isWorksheetOpen}
              onClose={() => setIsWorksheetOpen(false)}
            />
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* SCREEN 2: ACTIVE ADAPTIVE ASSESSMENT (CHILD-FRIENDLY ONE THING AT A TIME) */
        /* ============================================================== */
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Top Bar: Progress and Language Switcher */}
          <div className="bg-[var(--surface)] border border-[#432623]/25 rounded-[2px] p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="editorial-meta text-[#432623]/80">
                  {classConfig.label.toUpperCase()} MATHS
                </span>
                <div className="font-serif font-bold text-lg text-[#432623]">
                  {activeStudent?.student.name}
                </div>
              </div>

              {/* Accessible Language Switcher directly reachable on screen */}
              <div
                className="flex items-center gap-1 border border-[#432623]/25 rounded-[2px] p-1 bg-[#FAF8E8] dark:bg-[#432623]/30"
                role="group"
                aria-label="Language selection"
              >
                {(["en", "hi", "te"] as Lang[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className={`min-h-[44px] min-w-[44px] px-2.5 rounded-[2px] font-bold text-sm font-mono ${
                      lang === l
                        ? "bg-[#432623] text-[#F5F1BC]"
                        : "text-[#432623] hover:bg-[#F5F1BC]/40"
                    }`}
                    aria-label={
                      l === "en"
                        ? "Switch language to English"
                        : l === "hi"
                        ? "Switch language to Hindi"
                        : "Switch language to Telugu"
                    }
                    aria-pressed={lang === l}
                  >
                    {l === "en" ? "EN" : l === "hi" ? "हिन्दी" : "తెలుగు"}
                  </button>
                ))}
              </div>
            </div>

            {/* Simple Progress Bar: e.g. "Question 3 of 8" with no jargon */}
            <div className="space-y-1.5 pt-1 border-t border-[#432623]/15">
              <div className="flex items-center justify-between text-base font-bold text-[#432623]">
                <span>
                  {dict.questionLabel || "Question"} {totalQuestionsAnswered + (currentQuestion ? 1 : 0)} of {Math.max(totalQuestionsAnswered + (currentQuestion ? 1 : 0), (sessionMemory?.topics.length || 4) * 2)}
                </span>
                <span className="text-sm font-mono text-[#432623]/70">
                  {currentTopicName}
                </span>
              </div>
              <div className="w-full bg-[#432623]/15 h-3 rounded-[2px] overflow-hidden">
                <div
                  className="bg-[#8ABB93] h-full rounded-[2px] transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        ((totalQuestionsAnswered + (currentQuestion ? 1 : 0)) /
                          Math.max(1, (sessionMemory?.topics.length || 4) * 2)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Friendly Mascot Gappu placed unobtrusively beside header, never blocking question */}
          <div className="flex items-center gap-3 p-3 bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/20 rounded-[2px]">
            <div className="w-12 h-14 shrink-0 overflow-hidden flex items-center justify-center">
              <MascotHero width={48} height={58} className="scale-90" />
            </div>
            <div className="text-sm font-medium text-[#432623] leading-relaxed">
              {lang === "hi"
                ? "गप्पू आपके साथ सीख रहा है! आराम से उत्तर दें।"
                : lang === "te"
                ? "గప్పు మీతో పాటు నేర్చుకుంటున్నాడు! నిదానంగా ఆలోచించి సమాధానం ఇవ్వండి."
                : "Gappu is learning with you! Take your time and choose the best answer."}
            </div>
          </div>

          {/* Calm Loading State: skeleton with reassuring message */}
          {isEvaluating ? (
            <div className="bg-[var(--surface)] border border-[#432623]/25 rounded-[2px] p-8 sm:p-12 space-y-6 text-center">
              <div className="space-y-4 max-w-md mx-auto">
                <div className="h-8 bg-[#432623]/10 rounded-[2px] animate-pulse w-3/4 mx-auto" />
                <div className="h-16 bg-[#432623]/10 rounded-[2px] animate-pulse w-full mx-auto" />
                <div className="space-y-3 pt-4">
                  <div className="h-12 bg-[#432623]/10 rounded-[2px] animate-pulse w-full" />
                  <div className="h-12 bg-[#432623]/10 rounded-[2px] animate-pulse w-full" />
                </div>
              </div>
              <div className="pt-4 border-t border-[#432623]/15">
                <p className="font-serif text-lg font-bold text-[#432623]">
                  {evaluatingSeconds >= 3
                    ? lang === "hi"
                      ? "अगला प्रश्न तैयार हो रहा है... कृपया थोड़ा इंतज़ार करें।"
                      : lang === "te"
                      ? "తదుపరి ప్రశ్న సిద్ధమవుతోంది... దయచేసి వేచి ఉండండి."
                      : "Getting your next question ready... Thank you for waiting."
                    : lang === "hi"
                    ? "तैयार हो रहा है..."
                    : lang === "te"
                    ? "సిద్ధమవుతోంది..."
                    : "Preparing your next step..."}
                </p>
              </div>
            </div>
          ) : hasError ? (
            /* Friendly Error State with Retry Button */
            <div className="bg-[var(--surface)] border border-[#DE2A35]/30 rounded-[2px] p-6 sm:p-8 space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF8E8] border border-[#DE2A35] flex items-center justify-center text-[#B51E28]">
                <WarningCircle size={28} weight="bold" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#432623]">
                {lang === "hi"
                  ? "इंटरनेट में थोड़ी रुकावट आई"
                  : lang === "te"
                  ? "నెట్‌వర్క్ సమస్య ఎదురైంది"
                  : "We had trouble loading the next question"}
              </h3>
              <p className="text-base text-[#432623]/80 max-w-md mx-auto">
                {lang === "hi"
                  ? "चिंता न करें, आपका काम सुरक्षित है। पुनः प्रयास करने के लिए नीचे बटन दबाएं।"
                  : lang === "te"
                  ? "చింతించకండి, మీ సమాధానాలు సురక్షితంగా ఉన్నాయి. మళ్ళీ ప్రయత్నించడానికి కింద బటన్ నొక్కండి."
                  : "Don't worry, your progress is safe. Tap the button below to try again."}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setHasError(false);
                    handleNextStep();
                  }}
                  className="neo-btn neo-btn-primary min-h-[48px] px-8 text-base font-bold rounded-[2px]"
                >
                  {lang === "hi" ? "फिर से कोशिश करें (Retry)" : lang === "te" ? "మళ్ళీ ప్రయత్నించండి" : "Try Again"}
                </button>
              </div>
            </div>
          ) : currentQuestion ? (
            /* Active Question Card */
            <div className="bg-[var(--surface)] border border-[#432623]/25 rounded-[2px] p-6 sm:p-8 space-y-6">
              {/* Question Eyebrow */}
              <div className="flex items-center justify-between border-b border-[#432623]/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="editorial-meta text-[#432623]/70">
                    {dict.questionLabel || "Question"} {totalQuestionsAnswered + 1}
                  </span>
                  <span className="text-sm text-[#432623]/40">•</span>
                  <span className="text-sm font-semibold text-[#432623]">{currentTopicName}</span>
                  {isBackupQuestion && (
                    <span
                      data-testid="backup-question-note"
                      className="ml-2 inline-flex items-center text-sm px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-800 border border-amber-200"
                    >
                      Using backup question
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReportQuestion}
                    disabled={reportedQuestionId === (currentQuestion.id || `${currentQuestion.conceptId}_${currentQuestion.difficulty}`)}
                    data-testid="report-question-btn"
                    className="inline-flex items-center gap-1 min-h-[44px] text-sm text-[#432623]/70 hover:text-[#B51E28] px-2 py-0.5 rounded border border-[#432623]/20 hover:border-[#DE2A35]/30 transition-colors"
                    title="Report question for teacher review"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>
                      {reportedQuestionId === (currentQuestion.id || `${currentQuestion.conceptId}_${currentQuestion.difficulty}`)
                        ? "Reported"
                        : "Report this question"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Large Question Text */}
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-[22px] sm:text-2xl text-[#432623] leading-relaxed">
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

              {/* Answer Options as large full-width buttons */}
              {!feedback ? (
                <div className="space-y-4 pt-2">
                  {currentQuestion.options && currentQuestion.options.length > 0 ? (
                    <div className="space-y-3">
                      {currentQuestion.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSubmit(opt.value)}
                          disabled={isEvaluating || Boolean(feedback)}
                          className="w-full neo-btn neo-btn-secondary min-h-[56px] p-4 text-left text-[18px] sm:text-xl font-bold flex items-center justify-between rounded-[2px] group leading-relaxed"
                        >
                          <span className="font-mono">{formatTxt(opt.label)}</span>
                          <span className="text-sm font-mono text-[#432623]/70 group-hover:text-[#432623]">
                            [Select]
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <Input
                        placeholder={dict.enterAnswer}
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit(userAnswer)}
                        disabled={isEvaluating || Boolean(feedback)}
                        className="h-14 font-mono text-xl bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#432623]/25 rounded-[2px] text-[#432623] w-full"
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmit(userAnswer)}
                        disabled={isEvaluating || Boolean(feedback)}
                        className="neo-btn neo-btn-primary px-8 min-h-[56px] text-lg font-bold shrink-0 rounded-[2px]"
                      >
                        {dict.submitAnswer}
                      </button>
                    </div>
                  )}

                  {/* Student Visible Hint Button where hints exist */}
                  {currentQuestion.hint && (
                    <div className="pt-3">
                      {!showHint ? (
                        <button
                          type="button"
                          onClick={() => setShowHint(true)}
                          className="min-h-[44px] px-3 py-2 text-base text-[#432623] font-bold flex items-center gap-1.5 hover:underline border border-[#432623]/20 rounded-[2px] bg-[#FAF8E8]"
                        >
                          <QuestionIcon className="w-5 h-5 text-[#B51E28]" />
                          <span>{dict.showHint || "Need a hint?"}</span>
                        </button>
                      ) : (
                        <div className="bg-[#FAF8E8] dark:bg-[#432623]/30 border border-[#DFA06E]/60 p-4 rounded-[2px] text-base text-[#432623] leading-relaxed">
                          <strong className="text-[#432623] bg-[#DFA06E] px-1.5 py-0.5 rounded-[2px] mr-1">
                            {dict.hintLabel || "Hint"}:
                          </strong>{" "}
                          {formatTxt(currentQuestion.hint)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Post-Submission Calm Feedback and one clear Next Button */
                <div className="space-y-4 pt-2">
                  <div
                    className={`p-5 rounded-[2px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      feedback.isCorrect
                        ? "bg-[#8ABB93]/20 border-[#8ABB93] text-[#432623]"
                        : "bg-[#FAF8E8] border-[#DFA06E] text-[#432623]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {feedback.isCorrect ? (
                        <CheckCircle className="w-6 h-6 shrink-0 text-[#8ABB93]" />
                      ) : (
                        <CheckCircle className="w-6 h-6 shrink-0 text-[#DFA06E]" />
                      )}
                      <span className="text-base sm:text-lg font-bold text-[#432623]">
                        {feedback.message}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={isEvaluating}
                      className="neo-btn neo-btn-primary min-h-[48px] px-8 text-base font-bold flex items-center justify-center gap-2 shrink-0 rounded-[2px]"
                    >
                      <span>{dict.nextQuestion || "Next"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
