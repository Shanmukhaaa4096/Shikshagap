"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { FlowerPetal, BotanicalLeaf, WarmSparkle, GiftBoxMotif } from "@/components/illustrations/FloralMotifs";
import { WorksheetModal } from "@/components/WorksheetModal";
import {
  CURRICULUM_TOPICS,
  TOPIC_DISPLAY_NAMES,
} from "@/lib/engine/diagnostic";
import {
  createSessionMemory,
  getNextStaircaseAction,
  applyAttemptToMemory,
} from "@/lib/agents/staircase";
import { generateUnique } from "@/lib/questions/generator";
import { normalizeAnswer } from "@/lib/questions/hybridGenerator";
import { areAnswersEquivalent } from "@/lib/questions/integrity";
import { makeRng } from "@/lib/rng";
import { getClassConfig, DEFAULT_CLASS_ID, SUPPORTED_CLASSES } from "@/lib/curriculum/classes";
import { getVerifiedTextbookQuestion } from "@/lib/questions/textbookBank";
import {
  SOURCE_STYLE_METADATA,
  DIFFICULTY_DESCRIPTIONS,
  type BoardPreference,
  type SourceStyle,
  type DifficultyLevel,
} from "@/lib/agents/adaptiveEngine";

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
  const { lang, setLang, dict, formatTxt } = useI18n();
  const router = useRouter();
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
  const [boardPreference, setBoardPreference] = useState<BoardPreference>("BOTH");
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
          queueMicrotask(() => {
            setSessionMemory(parsed.sessionMemory);
            setCurrentQuestion(parsed.currentQuestion || null);
            setUserAnswer(parsed.userAnswer || "");
            setFeedback(parsed.feedback || null);
            setIsStarted(Boolean(parsed.isStarted));
            setIsFinished(Boolean(parsed.isFinished));
            setRecommendations(parsed.recommendations || []);
            setReportSummary(parsed.reportSummary || "");
            if (parsed.boardPreference) {
              setBoardPreference(parsed.boardPreference);
            }
            if (parsed.clientSessionId) {
              clientSessionIdRef.current = parsed.clientSessionId;
            }
          });
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
            boardPreference,
            clientSessionId: clientSessionIdRef.current,
          })
        );
      }
    } catch {
      // Graceful fallback
    }
  }, [sessionStorageKey, isStarted, isFinished, sessionMemory, currentQuestion, userAnswer, feedback, recommendations, reportSummary, boardPreference]);

  const clearSavedSession = () => {
    try {
      sessionStorage.removeItem(sessionStorageKey);
    } catch {
      // ignore
    }
  };

  // Track evaluating duration for calm loading message after 3s
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
    initialMemory.boardPreference = boardPreference;

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
        // Deterministic client fallback with fresh session-specific seed
        setIsBackupQuestion(true);
        const sessionSeed = initialMemory.sessionSeed ?? 10007;
        const fallbackRng = makeRng(sessionSeed);
        const action = getNextStaircaseAction(initialMemory);
        if (action.type === "ask") {
          const seen = new Set<string>();
          let q = getVerifiedTextbookQuestion(
            {
              class: classConfig.grade,
              conceptId: action.conceptId,
              difficulty: action.level,
              language: lang as Lang,
              onlyVerified: true,
            },
            lang as Lang
          );
          if (!q) {
            q = generateUnique(action.conceptId, action.level, fallbackRng, seen, classConfig.grade);
          }
          seen.add(q.id);
          setSessionMemory({
            ...initialMemory,
            seenSignatures: Array.from(seen),
            usedFormats: [q.format],
            stepCount: 1,
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

    const isCorrect = areAnswersEquivalent(trimmed, currentQuestion.answer);

    const normTrimmed = normalizeAnswer(trimmed);
    let errorType: string | undefined = undefined;
    if (!isCorrect && currentQuestion.meta.bugs) {
      if (currentQuestion.meta.bugs[trimmed]) {
        errorType = currentQuestion.meta.bugs[trimmed];
      } else if (currentQuestion.meta.bugs[normTrimmed]) {
        errorType = currentQuestion.meta.bugs[normTrimmed];
      } else {
        errorType = "slip";
      }
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
      sourceStyle: currentQuestion.sourceStyle,
    };

    setFeedback({
      isCorrect,
      message: isCorrect
        ? dict.correctFeedback || "Good job! Let's continue."
        : dict.incorrectFeedback || "Needs practice with this step.",
    });

    lastAttemptRef.current = newAttempt;
  };

  // Student selects "I don't know yet"
  const handleDontKnow = () => {
    if (!currentQuestion || !sessionMemory || isEvaluating || Boolean(feedback)) return;

    const newAttempt: Attempt = {
      conceptId: currentQuestion.conceptId,
      level: currentQuestion.difficulty,
      questionId: currentQuestion.id,
      studentAnswer: "dont_know",
      correct: false,
      errorType: "dont_know",
      sourceStyle: currentQuestion.sourceStyle,
    };

    const hintMsg =
      (typeof currentQuestion.hint === "object" && "raw" in currentQuestion.hint
        ? currentQuestion.hint.raw
        : "") ||
      dict.incorrectFeedback ||
      "That is completely fine! We will try a simpler question next.";

    setFeedback({
      isCorrect: false,
      message: hintMsg,
    });
    setShowHint(true);
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
            const sessionSeed = advanced.memory.sessionSeed ?? 10007;
            const step = advanced.memory.stepCount ?? sessionMemory.topics.reduce((acc, t) => acc + t.attempts.length, 0);
            const stepSeed = ((sessionSeed + step * 7919) >>> 0);
            let nextQ = getVerifiedTextbookQuestion(
              {
                class: sessionMemory.grade,
                conceptId: advanced.action.conceptId,
                difficulty: advanced.action.level,
                language: lang as Lang,
                excludeIds: Array.from(seen),
                onlyVerified: true,
              },
              lang as Lang
            );
            if (!nextQ) {
              nextQ = generateUnique(
                advanced.action.conceptId,
                advanced.action.level,
                makeRng(stepSeed),
                seen,
                sessionMemory.grade,
                {},
                { avoidFormat: lastFormat }
              );
            }
            seen.add(nextQ.id);
            setSessionMemory({
              ...advanced.memory,
              seenSignatures: Array.from(seen),
              usedFormats: [...usedFormats, nextQ.format],
              stepCount: step + 1,
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
    <div className="w-full max-w-4xl xl:max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* ============================================================== */}
      {/* SCREEN 1: PRE-ASSESSMENT SETUP SCREEN                          */}
      {/* ============================================================== */}
      {!isStarted ? (
        <div className="neo-panel p-5 sm:p-8 space-y-5 rounded-[24px] border border-border bg-[var(--surface)] shadow-warm">
          {/* Header */}
          <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-16 sm:w-16 sm:h-20 shrink-0 flex items-center justify-center">
                <MascotHero width={64} height={76} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="editorial-meta text-primary font-bold">MATHEMATICS ASSESSMENT</span>
                  <span className="text-muted-foreground text-xs">•</span>
                  <span className="text-xs font-mono font-bold text-foreground">
                    {boardPreference === "ICSE"
                      ? "ICSE (CISCE syllabus)"
                      : boardPreference === "BOTH"
                      ? "CBSE & ICSE (Balanced)"
                      : "NCERT / CBSE (2024-25)"}
                  </span>
                </div>
                <h1 className="editorial-title text-2xl sm:text-3xl text-foreground mt-1 font-serif font-black">
                  {classConfig.label} Maths Check
                </h1>
                <p className="text-sm text-foreground/80 mt-1 leading-relaxed max-w-2xl">
                  {lang === "hi"
                    ? "गणित के कौशल की एक सरल और शांत जांच। आराम से सोचकर उत्तर दें।"
                    : lang === "te"
                    ? "మీ గణిత నైపుణ్యాలను పరిశీలించే సరళమైన పరీక్ష. నిదానంగా ఆలోచించి సమాధానం ఇవ్వండి."
                    : "A calm, child-friendly check of foundational maths skills. Take your time and choose the best answer."}
                </p>
              </div>
            </div>
            {isGuest && (
              <span className="self-start sm:self-auto text-xs font-mono font-bold bg-[var(--status-good-bg)] text-foreground px-3 py-1.5 rounded-[16px] border border-[var(--status-good-border)] shrink-0">
                Trial Mode • No Sign-in Required
              </span>
            )}
          </div>

          {/* Student Picker (for Teacher) */}
          {!isGuest && !isStudentView ? (
            <div className="space-y-2">
              <label className="editorial-meta text-foreground">SELECT STUDENT TO ASSESS</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full min-h-[44px] px-3 text-sm font-semibold bg-card border border-border rounded-[16px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {effectiveStudents.map((s) => (
                  <option key={s.student.id} value={s.student.id}>
                    {s.student.name} (Roll #{s.student.rollNo}) | {s.profile.status.toUpperCase().replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          ) : !isGuest && isStudentView ? (
            <div className="p-3 bg-card border border-border rounded-[16px] flex items-center justify-between">
              <div>
                <span className="editorial-meta text-muted-foreground">LEARNER</span>
                <div className="font-serif font-bold text-lg text-foreground">{activeStudent?.student.name}</div>
              </div>
              <span className="font-mono text-sm font-bold text-muted-foreground">Roll #{activeStudent?.student.rollNo}</span>
            </div>
          ) : null}

          {/* Class Grade (Classes 1 - 10) & Language */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="editorial-meta text-foreground">SELECT CLASS (CLASSES 1 TO 10)</span>
                <span className="text-xs font-mono text-muted-foreground">Classes 3–5 ready; 1, 2, 6–10 in review</span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {SUPPORTED_CLASSES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!c.enabled}
                    onClick={() => {
                      if (c.enabled) {
                        clearSavedSession();
                        onClassChange?.(c.id);
                      }
                    }}
                    title={
                      c.enabled
                        ? `Select ${c.label} for scored ${boardPreference === "ICSE" ? "ICSE" : boardPreference === "BOTH" ? "CBSE & ICSE" : "CBSE"} assessment`
                        : `${c.label}: ${boardPreference === "ICSE" ? "ICSE (CISCE)" : "CBSE (NCERT)"} curriculum mapped. Question engine coming soon.`
                    }
                    className={`min-h-[44px] px-2 py-2 text-xs font-bold font-mono rounded-[16px] border flex flex-col items-center justify-center cursor-pointer ${
                      selectedClassId === c.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : c.enabled
                        ? "bg-card text-foreground border-border hover:bg-muted"
                        : "bg-muted/30 text-muted-foreground/60 border-border/50 cursor-not-allowed"
                    }`}
                  >
                    <span>{c.label}</span>
                    {!c.enabled && <span className="text-xs font-normal opacity-75">Soon</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Assessment Language Selector */}
            <div className="space-y-2">
              <span className="editorial-meta text-foreground">ASSESSMENT LANGUAGE</span>
              <div className="grid grid-cols-3 gap-2 max-w-sm">
                {(["en", "hi", "te"] as Lang[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className={`min-h-[44px] px-3 py-2 text-xs font-bold font-mono rounded-[16px] border cursor-pointer ${
                      lang === l
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {l === "en" ? "English" : l === "hi" ? "हिन्दी" : "తెలుగు"}
                  </button>
                ))}
              </div>
            </div>

            {/* Curriculum Board & Question Sources */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="editorial-meta text-foreground">CURRICULUM BOARD & QUESTION SOURCES</span>
                <span className="text-xs font-mono text-muted-foreground">CBSE, ICSE or Balanced Mix</span>
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-md">
                {(["CBSE", "ICSE", "BOTH"] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBoardPreference(b)}
                    className={`min-h-[44px] px-3 py-2 text-xs font-bold font-mono rounded-[16px] border cursor-pointer ${
                      boardPreference === b
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <span>{b === "BOTH" ? "Both (Balanced)" : b}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {boardPreference === "CBSE"
                  ? "Focuses on NCERT Math-Magic & Exemplar with CBSE reference problems (R.D. Sharma / R.S. Aggarwal)."
                  : boardPreference === "ICSE"
                  ? "Focuses on ICSE Selina / Concise Mathematics & ML Aggarwal with formal step-by-step reasoning."
                  : "Balanced alternation between NCERT conceptual clarity and ICSE step-by-step mathematical rigour."}
              </p>
            </div>
          </div>

          {/* Topics Covered */}
          <div className="space-y-2 pt-2 border-t border-border">
            <span className="editorial-meta text-foreground">TOPICS IN THIS CHECK</span>
            <div className="flex flex-wrap gap-2">
              {(classConfig.topics || CURRICULUM_TOPICS).map((tId: TopicId) => (
                <span
                  key={tId}
                  className="px-3 py-1.5 bg-card border border-border text-xs font-mono font-bold text-foreground rounded-[16px]"
                >
                  {TOPIC_DISPLAY_NAMES[tId]?.en || tId}
                </span>
              ))}
            </div>
          </div>

          {/* Start Actions */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
            <button
              type="button"
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  router.push("/");
                }
              }}
              className="neo-btn neo-btn-secondary px-5 py-2.5 min-h-[48px] text-sm font-bold w-full sm:w-auto rounded-full cursor-pointer"
            >
              {isGuest ? "Back to Home" : "Back to Dashboard"}
            </button>
            <button
              type="button"
              onClick={handleStart}
              className="neo-btn neo-btn-primary px-8 py-3 min-h-[52px] text-base font-bold flex items-center justify-center gap-2 w-full sm:w-auto rounded-full cursor-pointer"
            >
              <Brain className="w-5 h-5 text-primary-foreground" />
              <span>{dict.startPractice || "START ASSESSMENT"}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : isFinished ? (
        /* ============================================================== */
        /* SCREEN 3: ASSESSMENT COMPLETE SCREEN (STUDENT-FIRST RESULTS)   */
        /* ============================================================== */
        <div className="neo-panel overflow-hidden space-y-6 p-5 sm:p-8 rounded-[24px] border border-border bg-[var(--surface)] shadow-warm">
          {/* Friendly Celebratory Header */}
          <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-16 sm:w-16 sm:h-20 shrink-0 flex items-center justify-center">
                <MascotHero width={64} height={76} state="success" />
              </div>
              <div>
                <span className="editorial-meta text-primary font-bold">ASSESSMENT COMPLETE</span>
                <h2 className="editorial-title text-2xl sm:text-3xl text-foreground font-black mt-0.5">
                  Well done, {activeStudent?.student.name || "Learner"}!
                </h2>
                <p className="text-sm text-foreground/80 mt-0.5">
                  You completed the Class {classConfig.grade} Maths Check ({totalQuestionsAnswered} questions answered).
                </p>
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="flex items-center gap-2 bg-card p-2.5 rounded-[16px] border border-border shrink-0 self-start sm:self-center">
              <span className="text-xs font-mono font-bold text-foreground">
                {masteredTopics.length} Mastered • {gapTopics.length + devTopics.length} To Practise
              </span>
            </div>
          </div>

          {/* Simple, Non-Overwhelming Results Breakdown (2 clear blocks) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. What You Understand Well */}
            <div className="p-4 sm:p-5 bg-card border border-[var(--status-good-border)] rounded-[16px] space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-base">
                <CheckCircle className="w-5 h-5 text-[var(--status-good)] shrink-0" weight="bold" />
                <span>What You Know Well</span>
              </div>
              {masteredTopics.length > 0 ? (
                <ul className="space-y-2">
                  {masteredTopics.map((topicMem) => (
                    <li
                      key={topicMem.topicId}
                      className="p-2.5 bg-[var(--surface)] border border-border rounded-[22px] shadow-warm-sm flex items-center justify-between text-sm font-bold text-foreground"
                    >
                      <span>{TOPIC_DISPLAY_NAMES[topicMem.topicId]?.en || topicMem.topicId}</span>
                      <span className="text-xs font-mono font-bold text-[var(--status-good)] px-2 py-0.5 bg-[var(--status-good-bg)] rounded-[16px]">
                        Solid
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-foreground/80">
                  You are building foundational skills across these topics. Keep practising!
                </p>
              )}
            </div>

            {/* 2. What to Practise Next */}
            <div className="p-4 sm:p-5 bg-card border border-primary/40 rounded-[16px] space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Sparkle className="w-5 h-5 text-primary shrink-0" weight="fill" />
                <span>Next Topics to Practise</span>
              </div>
              {gapTopics.length > 0 || devTopics.length > 0 ? (
                <ul className="space-y-2">
                  {[...gapTopics, ...devTopics].map((topicMem) => {
                    const isGap = topicMem.status === "gap";
                    return (
                      <li
                        key={topicMem.topicId}
                        className="p-2.5 bg-[var(--surface)] border border-border rounded-[22px] shadow-warm-sm flex items-center justify-between text-sm font-bold text-foreground"
                      >
                        <span>{TOPIC_DISPLAY_NAMES[topicMem.topicId]?.en || topicMem.topicId}</span>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded-[16px] ${
                            isGap
                              ? "bg-primary/10 text-primary border border-primary/30"
                              : "bg-[var(--status-warn-bg)] text-foreground border border-[var(--status-warn-border)]"
                          }`}
                        >
                          {isGap ? "Needs Practice" : "Getting There"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-foreground/80">
                  Great job! You demonstrated strong mastery on all topics assessed today.
                </p>
              )}
            </div>
          </div>

          {/* Direct Verified NCERT Textbook Chapter Recommendations (Zero Jargon) */}
          {recommendations.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-foreground" />
                <span className="editorial-meta text-foreground">
                  RECOMMENDED TEXTBOOK READING (NCERT RATIONALISED 2024–25)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {recommendations.flatMap((recGroup) =>
                  recGroup.resources.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-card border border-border rounded-[16px] flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-mono uppercase text-primary font-bold">
                          {item.source} • {item.type}
                        </div>
                        <div className="font-bold text-sm text-foreground mt-0.5">
                          {item.title}
                        </div>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono font-bold text-foreground hover:underline px-2.5 py-1.5 border border-border rounded-[16px] bg-[var(--surface)] shrink-0"
                      >
                        <span>Open</span>
                        <ArrowSquareOut className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Adaptive Learning Path & Multi-Board Sources Breakdown */}
          {sessionMemory?.topics && sessionMemory.topics.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="editorial-meta text-foreground">
                  ADAPTIVE DIFFICULTY PATH & CURRICULUM SOURCES
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  5-Level Adaptive Trajectory
                </span>
              </div>

              <div className="space-y-2.5">
                {sessionMemory.topics.map((tMem) => {
                  const attempts: Attempt[] = tMem.attempts || [];
                  const path: DifficultyLevel[] =
                    tMem.difficultyPath && tMem.difficultyPath.length > 0
                      ? (tMem.difficultyPath as DifficultyLevel[])
                      : attempts.map((a: Attempt) => a.level as DifficultyLevel);
                  
                  const peakLevel: DifficultyLevel =
                    (tMem.highestLevelReached as DifficultyLevel) ||
                    (path.length > 0 ? (Math.max(...path) as DifficultyLevel) : 2);
                  
                  const sourcesEncountered = Array.from(
                    new Set(attempts.map((a: Attempt) => a.sourceStyle).filter(Boolean))
                  ) as SourceStyle[];

                  return (
                    <div
                      key={tMem.topicId}
                      className="p-3.5 bg-card border border-border rounded-[16px] space-y-2"
                      data-testid={`topic-adaptive-card-${tMem.topicId}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {TOPIC_DISPLAY_NAMES[tMem.topicId]?.en || tMem.topicId}
                          </span>
                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-[16px] ${
                              tMem.status === "mastered"
                                ? "bg-[var(--status-good-bg)] text-[var(--status-good)] border border-[var(--status-good-border)]"
                                : tMem.status === "gap"
                                ? "bg-primary/10 text-primary border border-primary/30"
                                : "bg-[var(--status-warn-bg)] text-foreground border border-[var(--status-warn-border)]"
                            }`}
                          >
                            {tMem.status === "mastered"
                              ? "Mastered"
                              : tMem.status === "gap"
                              ? "Needs Support"
                              : "Developing"}
                          </span>
                        </div>

                        <span className="text-xs font-mono text-muted-foreground">
                          Peak: Level {peakLevel} ({DIFFICULTY_DESCRIPTIONS[peakLevel]?.name || `L${peakLevel}`})
                        </span>
                      </div>

                      {/* Difficulty Trajectory */}
                      {path.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
                          <span className="text-muted-foreground font-semibold">Path:</span>
                          {path.map((lvl: DifficultyLevel, idx: number) => (
                            <span key={idx} className="flex items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded border ${
                                  lvl >= 4
                                    ? "bg-primary/10 border-primary/30 text-primary font-bold"
                                    : "bg-muted border-border text-foreground"
                                }`}
                                title={DIFFICULTY_DESCRIPTIONS[lvl]?.description}
                              >
                                L{lvl}
                              </span>
                              {idx < path.length - 1 && (
                                <span className="text-muted-foreground">→</span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Source Styles Encountered */}
                      {sourcesEncountered.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono pt-1">
                          <span className="text-muted-foreground">Sources:</span>
                          {sourcesEncountered.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded bg-muted/70 border border-border text-foreground"
                              title={SOURCE_STYLE_METADATA[s]?.description}
                            >
                              {SOURCE_STYLE_METADATA[s]?.label || s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
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
                className="neo-btn neo-btn-secondary min-h-[48px] px-5 text-sm font-bold flex items-center justify-center gap-2 rounded-full w-full sm:w-auto cursor-pointer"
              >
                <ArrowCounterClockwise className="w-4 h-4" />
                <span>{isGuest ? "Try Another Check" : "Check Another Student"}</span>
              </button>
              {activeStudent && (
                <button
                  type="button"
                  onClick={() => setIsWorksheetOpen(true)}
                  className="neo-btn neo-btn-secondary min-h-[48px] px-5 text-sm font-bold flex items-center justify-center gap-2 rounded-full w-full sm:w-auto cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Practice Worksheet</span>
                </button>
              )}
            </div>

            {isGuest ? (
              <a
                href="/login?redirect=/app"
                className="neo-btn neo-btn-primary min-h-[48px] px-6 text-sm font-bold flex items-center justify-center gap-2 rounded-full w-full sm:w-auto text-center cursor-pointer"
              >
                <span>Teacher Sign In to Save</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <button
                type="button"
                onClick={handleSaveAndFinish}
                disabled={isLoadingFinish}
                className="neo-btn neo-btn-primary min-h-[48px] px-6 text-sm font-bold flex items-center justify-center gap-2 rounded-full w-full sm:w-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isLoadingFinish ? "Saving Assessment..." : "Save & Return to Dashboard"}</span>
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
        <div className="space-y-4 sm:space-y-6 w-full max-w-4xl xl:max-w-5xl mx-auto">
          {/* Top Bar: Progress & Language Switcher & Report */}
          <div className="bg-[var(--surface)] border border-border rounded-[22px] shadow-warm-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono uppercase font-bold text-muted-foreground">
                  {classConfig.label.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs font-mono font-bold text-primary">
                  {currentTopicName}
                </span>
                {currentQuestion && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span
                      data-testid="difficulty-indicator"
                      className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded text-foreground border border-border"
                      title={DIFFICULTY_DESCRIPTIONS[currentQuestion.difficulty]?.description}
                    >
                      Level {currentQuestion.difficulty} of 5
                    </span>
                  </>
                )}
              </div>

              {/* Compact Language Selector + Report Button */}
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1 border border-border rounded-[16px] p-0.5 bg-card"
                  role="group"
                  aria-label="Language selection"
                >
                  {(["en", "hi", "te"] as Lang[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={`min-h-[36px] min-w-[36px] px-2 rounded-[16px] font-bold text-xs font-mono cursor-pointer ${
                        lang === l
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
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
                      {l === "en" ? "EN" : l === "hi" ? "हि" : "తె"}
                    </button>
                  ))}
                </div>

                {currentQuestion && (
                  <button
                    type="button"
                    onClick={handleReportQuestion}
                    disabled={reportedQuestionId === (currentQuestion.id || `${currentQuestion.conceptId}_${currentQuestion.difficulty}`)}
                    data-testid="report-question-btn"
                    className="inline-flex items-center gap-1 min-h-[36px] px-2.5 text-xs text-muted-foreground hover:text-primary rounded border border-border hover:border-primary/40 cursor-pointer"
                    title="Report question for teacher review"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {reportedQuestionId === (currentQuestion.id || `${currentQuestion.conceptId}_${currentQuestion.difficulty}`)
                        ? "Reported"
                        : "Report"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Simple Progress: e.g. "Question 3 of 8" */}
            <div className="space-y-1.5 pt-1 border-t border-border">
              <div className="flex items-center justify-between text-sm sm:text-base font-bold text-foreground">
                <span>
                  {dict.questionLabel || "Question"} {totalQuestionsAnswered + (currentQuestion ? 1 : 0)} of {Math.max(totalQuestionsAnswered + (currentQuestion ? 1 : 0), (sessionMemory?.topics.length || 4) * 2)}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {Math.min(
                    100,
                    Math.round(
                      ((totalQuestionsAnswered + (currentQuestion ? 1 : 0)) /
                        Math.max(1, (sessionMemory?.topics.length || 4) * 2)) *
                        100
                    )
                  )}%
                </span>
              </div>
              <div className="w-full bg-muted h-2.5 sm:h-3 rounded-[16px] overflow-hidden">
                <div
                  className="bg-[var(--status-good)] h-full rounded-[16px] transition-all duration-300"
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

          {/* Calm Loading State */}
          {isEvaluating ? (
            <div className="bg-[var(--surface)] border border-border rounded-[22px] shadow-warm-sm p-8 sm:p-12 space-y-6 text-center">
              <div className="space-y-4 max-w-md mx-auto">
                <div className="h-8 bg-muted rounded-[16px] animate-pulse w-3/4 mx-auto" />
                <div className="h-16 bg-muted rounded-[16px] animate-pulse w-full mx-auto" />
                <div className="space-y-3 pt-4">
                  <div className="h-12 bg-muted rounded-[16px] animate-pulse w-full" />
                  <div className="h-12 bg-muted rounded-[16px] animate-pulse w-full" />
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="font-serif text-lg font-bold text-foreground">
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
            <div className="bg-[var(--surface)] border border-primary/40 rounded-[22px] shadow-warm-sm p-6 sm:p-8 space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-card border border-primary flex items-center justify-center text-primary">
                <WarningCircle size={28} weight="bold" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                {lang === "hi"
                  ? "इंटरनेट में थोड़ी रुकावट आई"
                  : lang === "te"
                  ? "నెట్‌వర్క్ సమస్య ఎదురైంది"
                  : "We had trouble loading the next question"}
              </h3>
              <p className="text-base text-foreground/80 max-w-md mx-auto">
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
                  className="neo-btn neo-btn-primary min-h-[48px] px-8 text-base font-bold rounded-full cursor-pointer"
                >
                  {lang === "hi" ? "फिर से कोशिश करें (Retry)" : lang === "te" ? "మళ్ళీ ప్రయత్నించండి" : "Try Again"}
                </button>
              </div>
            </div>
          ) : currentQuestion ? (
            /* Active Question Card */
            <div className="bg-[var(--surface)] border border-border rounded-[22px] shadow-warm-sm p-5 sm:p-8 lg:p-10 space-y-6">
              {/* Question Eyebrow & Provenance */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="editorial-meta text-muted-foreground">
                    {dict.questionLabel || "Question"} {totalQuestionsAnswered + 1}
                  </span>
                  <span
                    data-testid="question-board-badge"
                    className={`inline-flex items-center text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      currentQuestion.board === "ICSE"
                        ? "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800"
                    }`}
                  >
                    {currentQuestion.board === "ICSE" ? "ICSE" : "CBSE"}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    Level {currentQuestion.difficulty} of 5
                  </span>
                  {isBackupQuestion && (
                    <span
                      data-testid="backup-question-note"
                      className="inline-flex items-center text-xs px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-800 border border-amber-200"
                    >
                      Backup Question
                    </span>
                  )}
                </div>

                {currentQuestion.sourceStyle ? (
                  <span
                    data-testid="source-style-badge"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted/60 text-muted-foreground border border-border text-xs font-mono"
                    title={SOURCE_STYLE_METADATA[currentQuestion.sourceStyle]?.description}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span>{currentQuestion.provenanceLabel || SOURCE_STYLE_METADATA[currentQuestion.sourceStyle]?.label}</span>
                  </span>
                ) : currentQuestion.provenanceLabel ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted/60 text-muted-foreground border border-border text-xs font-mono">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span>{currentQuestion.provenanceLabel}</span>
                  </span>
                ) : null}
              </div>

              {/* Large Question Text */}
              <div className="space-y-4">
                <h2 className="font-serif font-bold text-[22px] sm:text-3xl lg:text-4xl text-foreground leading-relaxed">
                  {formatTxt(currentQuestion.prompt)}
                </h2>

                {currentQuestion.expression && (
                  <div className="py-4 sm:py-6 text-center bg-card rounded-[16px] border border-border">
                    <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-wider">
                      {currentQuestion.expression}
                    </span>
                  </div>
                )}
              </div>

              {/* Answer Choices */}
              {!feedback ? (
                <div className="space-y-4 pt-2">
                  {currentQuestion.options && currentQuestion.options.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {currentQuestion.options.map((opt, optIdx) => {
                        const optLetter = String.fromCharCode(65 + optIdx);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSubmit(opt.value)}
                            disabled={isEvaluating || Boolean(feedback)}
                            className="w-full neo-btn neo-btn-secondary min-h-[56px] sm:min-h-[64px] p-4 text-left text-[18px] sm:text-xl font-bold flex items-center gap-3.5 rounded-[20px] group leading-relaxed shadow-warm-sm hover:shadow-warm transition-all cursor-pointer"
                          >
                            <span className="w-8 h-8 rounded-[16px] bg-muted/80 text-foreground text-sm font-mono font-bold flex items-center justify-center shrink-0 border border-border">
                              {optLetter}
                            </span>
                            <span className="font-mono flex-1">{formatTxt(opt.label)}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                      <Input
                        placeholder={dict.enterAnswer || "Enter your answer"}
                        value={userAnswer}
                        inputMode="decimal"
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit(userAnswer)}
                        disabled={isEvaluating || Boolean(feedback)}
                        className="min-h-[52px] font-mono text-xl sm:text-2xl bg-card border border-border rounded-[16px] text-foreground w-full px-4"
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmit(userAnswer)}
                        disabled={isEvaluating || Boolean(feedback)}
                        className="neo-btn neo-btn-primary px-8 min-h-[52px] text-base sm:text-lg font-bold shrink-0 rounded-full cursor-pointer"
                      >
                        {dict.submitAnswer || "Submit"}
                      </button>
                    </div>
                  )}

                  {/* Student Hint & "I don't know yet" option */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    {currentQuestion.hint ? (
                      <div>
                        {!showHint ? (
                          <button
                            type="button"
                            onClick={() => setShowHint(true)}
                            className="min-h-[44px] px-3 py-1.5 text-sm text-foreground font-semibold flex items-center gap-1.5 hover:underline border border-border rounded-[16px] bg-card cursor-pointer"
                          >
                            <QuestionIcon className="w-4 h-4 text-primary" />
                            <span>{dict.showHint || "Need a hint?"}</span>
                          </button>
                        ) : (
                          <div className="bg-card border border-[var(--status-warn-border)] p-3.5 rounded-[16px] text-sm text-foreground leading-relaxed">
                            <strong className="text-foreground bg-[var(--status-warn)] px-1.5 py-0.5 rounded-[16px] mr-1 font-mono text-xs">
                              {dict.hintLabel || "Hint"}:
                            </strong>{" "}
                            {formatTxt(currentQuestion.hint)}
                          </div>
                        )}
                      </div>
                    ) : <div />}

                    <button
                      type="button"
                      onClick={handleDontKnow}
                      disabled={isEvaluating || Boolean(feedback)}
                      data-testid="dont-know-btn"
                      className="min-h-[44px] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground font-mono flex items-center gap-1.5 border border-dashed border-border hover:border-foreground/40 rounded-[16px] bg-transparent cursor-pointer ml-auto"
                    >
                      <span>I don&apos;t know yet</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Post-Submission Feedback and prominent Next Button */
                <div className="space-y-4 pt-2">
                  <div
                    className={`p-4 sm:p-5 rounded-[16px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      feedback.isCorrect
                        ? "bg-[var(--status-good-bg)] border-[var(--status-good-border)] text-foreground"
                        : "bg-card border-[var(--status-warn-border)] text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {feedback.isCorrect ? (
                        <CheckCircle className="w-6 h-6 shrink-0 text-[var(--status-good)]" />
                      ) : (
                        <WarningCircle className="w-6 h-6 shrink-0 text-[var(--status-warn)]" />
                      )}
                      <span className="text-base sm:text-lg font-bold text-foreground">
                        {feedback.message}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={isEvaluating}
                      className="neo-btn neo-btn-primary min-h-[52px] px-8 text-base font-bold flex items-center justify-center gap-2 shrink-0 rounded-full cursor-pointer"
                    >
                      <span>{dict.nextQuestion || "Next Question"}</span>
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
