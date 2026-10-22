"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  ArrowLeft,
  Question as QuestionIcon,
  ArrowCounterClockwise,
  BookOpen,
  ArrowSquareOut,
  Flag,
  WarningCircle,
  Printer,
  Sparkle,
  Star,
  CaretDown,
  TreeStructure,
  LockKeyOpen,
  Moon,
  TrendUp,
  ShareNetwork,
  WhatsappLogo,
  Copy,
  Check,
  Trash,
  X,
} from "@phosphor-icons/react";
import { MascotHero } from "@/components/illustrations/MascotHero";
import { Gappu } from "@/components/illustrations/Gappu";
import type { GappuState } from "@/lib/hooks/useGappu";
// Visual styling handled in component classes
import { WorksheetModal } from "@/components/WorksheetModal";
import { StudentDiagnosticModal } from "@/components/StudentDiagnosticModal";
import {
  CURRICULUM_TOPICS,
  TOPIC_DISPLAY_NAMES,
} from "@/lib/engine/diagnostic";
import {
  createSessionMemory,
  getNextStaircaseAction,
  applyAttemptToMemory,
  getPrerequisiteForConcept,
  getConceptForTopic,
  advanceToNextTopic,
  normalizeQuestionText,
  getQuestionText,
  type StaircaseAction,
} from "@/lib/agents/staircase";
import { generateUnique } from "@/lib/questions/generator";
import { normalizeAnswer } from "@/lib/questions/normalizeAnswer";
import { areAnswersEquivalent } from "@/lib/questions/integrity";
import { makeRng } from "@/lib/rng";
import { getClassConfig, DEFAULT_CLASS_ID, SUPPORTED_CLASSES } from "@/lib/curriculum/classes";
import { getVerifiedTextbookQuestion } from "@/lib/questions/textbookBank";
import { getMultiBoardQuestion } from "@/lib/questions/multiBoardBank";
import { syncQuestionProvenance } from "@/lib/questions/provenance";
import { getCurriculumConcept } from "@/data/curriculum";
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

  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);

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

  const effectiveStudents = students && students.length > 0
    ? students
    : [fallbackGuestStudent];

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
  
  // Gappu Mascot & Consecutive Streak Meter State
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [gappuState, setGappuState] = useState<GappuState>("idle");
  const [gappuMessage, setGappuMessage] = useState<string>("");

  // "See how Gappu thinks" Collapsible Reasoning Panel State
  const [showGappuThinking, setShowGappuThinking] = useState<boolean>(false);
  const [selectedTraceTopicId, setSelectedTraceTopicId] = useState<TopicId | null>(null);

  // Redesigned Gap Report & Growth Screen State
  const [activeResultsTab, setActiveResultsTab] = useState<"report" | "growth">("report");
  const [hasRetested, setHasRetested] = useState<boolean>(false);
  const [isRetesting, setIsRetesting] = useState<boolean>(false);

  // Share Report Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isGeneratingShareLink, setIsGeneratingShareLink] = useState<boolean>(false);
  const [shareTokenData, setShareTokenData] = useState<{
    token: string;
    creatorSecret: string;
    shareUrl: string;
    expiresAt: number;
  } | null>(null);
  const [isRevokingShareLink, setIsRevokingShareLink] = useState<boolean>(false);
  const [isShareLinkRevoked, setIsShareLinkRevoked] = useState<boolean>(false);
  const [shareLinkCopied, setShareLinkCopied] = useState<boolean>(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const handleCompletePracticeAndRetest = () => {
    setIsRetesting(true);
    setTimeout(() => {
      setHasRetested(true);
      setIsRetesting(false);
      setActiveResultsTab("growth");
    }, 600);
  };

  const lastAttemptRef = useRef<Attempt | null>(null);
  const clientSessionIdRef = useRef<string>("");
  const sessionClosedRef = useRef<boolean>(false);

  const sessionStorageKey = `sg_assessment_session_${selectedClassId}_${selectedStudentId}`;

  // Confirmation Modal state for back navigation / exit during active assessment
  const [isExitModalOpen, setIsExitModalOpen] = useState<boolean>(false);

  // Restore session from sessionStorage or localStorage on mount / class change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem(sessionStorageKey) || localStorage.getItem(sessionStorageKey);
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
            if (typeof parsed.streak === "number") setStreak(parsed.streak);
            if (typeof parsed.maxStreak === "number") setMaxStreak(parsed.maxStreak);
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

  // Persist session to sessionStorage and localStorage after every state change/answer
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (isStarted && sessionMemory) {
        const payload = JSON.stringify({
          isStarted,
          isFinished,
          sessionMemory,
          currentQuestion,
          userAnswer,
          feedback,
          recommendations,
          reportSummary,
          boardPreference,
          streak,
          maxStreak,
          clientSessionId: clientSessionIdRef.current,
        });
        sessionStorage.setItem(sessionStorageKey, payload);
        localStorage.setItem(sessionStorageKey, payload);
      }
    } catch {
      // Graceful fallback
    }
  }, [sessionStorageKey, isStarted, isFinished, sessionMemory, currentQuestion, userAnswer, feedback, recommendations, reportSummary, boardPreference, streak, maxStreak]);

  const clearSavedSession = () => {
    try {
      sessionStorage.removeItem(sessionStorageKey);
      localStorage.removeItem(sessionStorageKey);
    } catch {
      // ignore
    }
  };

  // Intercept browser back button (popstate) and window close/refresh (beforeunload) during active assessment
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isStarted || isFinished) return;

    // Push initial history state entry when active assessment mounts or starts
    try {
      window.history.pushState({ assessmentActive: true }, "", window.location.href);
    } catch {
      // ignore
    }

    const handlePopState = () => {
      if (isStarted && !isFinished) {
        // Re-push state immediately so the student does not navigate back
        try {
          window.history.pushState({ assessmentActive: true }, "", window.location.href);
        } catch {
          // ignore
        }
        // Open the confirmation modal
        setIsExitModalOpen(true);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isStarted && !isFinished) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    // Intercept in-app link clicks that attempt to navigate away during an active test
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (target && target.getAttribute("href")) {
        const href = target.getAttribute("href") || "";
        // If clicking an internal or external navigation link while test is in progress
        if (href.startsWith("/") || href.startsWith("http")) {
          e.preventDefault();
          e.stopPropagation();
          setIsExitModalOpen(true);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isStarted, isFinished]);

  // Modal actions
  const handleContinueTest = () => {
    setIsExitModalOpen(false);
  };

  const handleQuitAssessment = () => {
    clearSavedSession();
    setIsExitModalOpen(false);
    setIsStarted(false);
    setIsFinished(false);
    setSessionMemory(null);
    setCurrentQuestion(null);
    setUserAnswer("");
    setFeedback(null);
    setRecommendations([]);
    setReportSummary("");
    setStreak(0);
    setMaxStreak(0);
    sessionClosedRef.current = true;
    lastAttemptRef.current = null;
    setIsEvaluating(false);
  };

  // Close modal on Escape key (behaves like Continue test)
  useEffect(() => {
    if (!isExitModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleContinueTest();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExitModalOpen]);

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

  const activeStudent =
    effectiveStudents.find((s) => s.student.id === selectedStudentId) || effectiveStudents[0] || fallbackGuestStudent;

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
  const handleStart = async (overrideStudent?: DemoStudentData, overrideClassId?: string) => {
    const studentToUse = overrideStudent || activeStudent;
    if (!studentToUse) return;

    clearSavedSession();
    // Generate random anonymous sessionId on client (never built from student data)
    clientSessionIdRef.current = generateClientSessionId();
    sessionClosedRef.current = false;

    // Use strictly pseudonymous ID (DPDP compliance)
    const pseudonymousId = "anon_" + (studentToUse.student.id ? studentToUse.student.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) : "learner");
    const classIdToUse = overrideClassId || selectedClassId;
    const currentClassConfig = getClassConfig(classIdToUse);
    const gradeVal = currentClassConfig.grade; // Classes 1 to 10

    const initialMemory = createSessionMemory(
      pseudonymousId,
      gradeVal,
      lang as "en" | "hi" | "te",
      (currentClassConfig.topics && currentClassConfig.topics.length > 0 ? currentClassConfig.topics : CURRICULUM_TOPICS) as TopicId[]
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
          const askedIds = new Set<string>();
          const askedTexts = new Set<string>();
          const targetBoard: "CBSE" | "ICSE" = boardPreference === "ICSE" ? "ICSE" : "CBSE";
          const targetConcept = getCurriculumConcept(action.conceptId);
          const lookupClass = targetConcept?.class || classConfig.grade;

          let q: Question | null = getMultiBoardQuestion(
            {
              class: lookupClass,
              conceptId: action.conceptId,
              difficulty: action.level,
              board: targetBoard,
              excludeIds: Array.from(askedIds),
              excludeTexts: Array.from(askedTexts),
            },
            lang as Lang
          );
          if (!q && targetBoard === "CBSE") {
            q = getVerifiedTextbookQuestion(
              {
                class: lookupClass,
                conceptId: action.conceptId,
                difficulty: action.level,
                language: lang as Lang,
                excludeIds: Array.from(askedIds),
                excludeTexts: Array.from(askedTexts),
                onlyVerified: true,
              },
              lang as Lang
            );
          }
          if (!q) {
            q = generateUnique(action.conceptId, action.level, fallbackRng, askedIds, lookupClass, { board: targetBoard }, {}, askedTexts);
          }
          q = syncQuestionProvenance(q, targetBoard);
          const baseId = q.id.split("_s")[0];
          const normText = normalizeQuestionText(getQuestionText(q, lang as Lang));
          askedIds.add(baseId);
          askedIds.add(q.id);
          if (normText) askedTexts.add(normText);

          setSessionMemory({
            ...initialMemory,
            askedQuestionIds: Array.from(askedIds),
            askedQuestionTexts: Array.from(askedTexts),
            seenSignatures: Array.from(askedIds),
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
      questionText: getQuestionText(currentQuestion, lang as Lang),
      studentAnswer: trimmed,
      correct: isCorrect,
      errorType: !isCorrect ? errorType : undefined,
      sourceStyle: currentQuestion.sourceStyle,
    };

    let gMessage = "";
    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setMaxStreak((prev) => Math.max(prev, nextStreak));
      setGappuState("success");
      if (nextStreak >= 2) {
        gMessage = `${nextStreak} ⭐ ${dict.gappuCheerStreak || "in a row! You are flying high!"}`;
      } else {
        const cheers = [
          dict.gappuCheer1 || "Hoo-ray! Brilliant thinking!",
          dict.gappuCheer2 || "Super star! You got it right!",
          dict.gappuCheer3 || "Wonderful! Keep shining!",
        ];
        gMessage = cheers[(nextStreak + (currentQuestion.id.length || 0)) % cheers.length];
      }
    } else {
      setStreak(0);
      setGappuState("thinking");
      const encouragements = [
        dict.gappuEncouragement1 || "Almost! Let's try it another way.",
        dict.gappuEncouragement2 || "Great try! Every question helps us learn.",
        dict.gappuEncouragement3 || "Good effort! We are learning together.",
      ];
      const attemptIdx = (sessionMemory?.stepCount ?? 0) + 1;
      gMessage = encouragements[attemptIdx % encouragements.length];
    }
    setGappuMessage(gMessage);

    setFeedback({
      isCorrect,
      message: gMessage,
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

    setStreak(0);
    setGappuState("thinking");
    const encouragement = dict.gappuEncouragement1 || "Almost! Let's try it another way.";
    setGappuMessage(encouragement);

    setFeedback({
      isCorrect: false,
      message: encouragement,
    });
    setShowHint(true);
    lastAttemptRef.current = newAttempt;
  };

  // Advance to next staircase question
  const handleNextStep = async () => {
    if (!sessionMemory) return;

    const lastAttempt: Attempt | null = lastAttemptRef.current;
    setFeedback(null);
    setGappuState("idle");
    setGappuMessage(dict.gappuThinkingPrompt || "Take your time. You can do this!");
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
            const askedIds = new Set<string>([
              ...(advanced.memory.askedQuestionIds || []),
              ...(advanced.memory.seenSignatures || []),
            ]);
            const askedTexts = new Set<string>(
              (advanced.memory.askedQuestionTexts || []).map((t) => normalizeQuestionText(t)).filter(Boolean)
            );
            const usedFormats = advanced.memory.usedFormats || [];
            const lastFormat = usedFormats.length > 0 ? usedFormats[usedFormats.length - 1] : undefined;
            const sessionSeed = advanced.memory.sessionSeed ?? 10007;
            const step = advanced.memory.stepCount ?? sessionMemory.topics.reduce((acc, t) => acc + t.attempts.length, 0);
            const stepSeed = ((sessionSeed + step * 7919) >>> 0);
            const targetBoard: "CBSE" | "ICSE" = boardPreference === "ICSE" ? "ICSE" : "CBSE";

            let currentAdvMem = advanced.memory;
            let currentAdvAction: StaircaseAction = advanced.action;
            let nextQ: Question | null = null;

            const isCandidateUnasked = (candidate: Question): boolean => {
              const baseId = candidate.id.split("_s")[0];
              if (askedIds.has(candidate.id) || askedIds.has(baseId)) return false;
              const norm = normalizeQuestionText(getQuestionText(candidate, lang as Lang));
              if (norm && askedTexts.has(norm)) return false;
              return true;
            };

            while (currentAdvAction.type === "ask" && !nextQ) {
              const targetConcept = getCurriculumConcept(currentAdvAction.conceptId);
              const lookupClass = targetConcept?.class || sessionMemory.grade;

              const mbCandidate = getMultiBoardQuestion(
                {
                  class: lookupClass,
                  conceptId: currentAdvAction.conceptId,
                  difficulty: currentAdvAction.level,
                  board: targetBoard,
                  excludeIds: Array.from(askedIds),
                  excludeTexts: Array.from(askedTexts),
                },
                lang as Lang
              );
              if (mbCandidate && isCandidateUnasked(mbCandidate)) {
                nextQ = syncQuestionProvenance(mbCandidate, targetBoard);
              }

              if (!nextQ && targetBoard === "CBSE") {
                const tbCandidate = getVerifiedTextbookQuestion(
                  {
                    class: lookupClass,
                    conceptId: currentAdvAction.conceptId,
                    difficulty: currentAdvAction.level,
                    language: lang as Lang,
                    excludeIds: Array.from(askedIds),
                    excludeTexts: Array.from(askedTexts),
                    onlyVerified: true,
                  },
                  lang as Lang
                );
                if (tbCandidate && isCandidateUnasked(tbCandidate)) {
                  nextQ = syncQuestionProvenance(tbCandidate, "CBSE");
                }
              }

              if (!nextQ) {
                const genQ = generateUnique(
                  currentAdvAction.conceptId,
                  currentAdvAction.level,
                  makeRng(stepSeed),
                  askedIds,
                  lookupClass,
                  { board: targetBoard },
                  { avoidFormat: lastFormat },
                  askedTexts
                );
                if (isCandidateUnasked(genQ)) {
                  nextQ = syncQuestionProvenance(genQ, targetBoard);
                }
              }

              if (!nextQ) {
                const advNext = advanceToNextTopic(currentAdvMem, `Unasked questions exhausted for ${currentAdvAction.topicId}`);
                currentAdvMem = advNext.memory;
                currentAdvAction = advNext.action;
              }
            }

            if (currentAdvAction.type !== "ask" || !nextQ) {
              setSessionMemory(currentAdvMem);
              completeAssessment(currentAdvMem);
            } else {
              const baseId = nextQ.id.split("_s")[0];
              const normText = normalizeQuestionText(getQuestionText(nextQ, lang as Lang));
              askedIds.add(baseId);
              if (normText) askedTexts.add(normText);
              nextQ.id = `${baseId}_s${step + 1}_${stepSeed}`;
              askedIds.add(nextQ.id);

              setSessionMemory({
                ...currentAdvMem,
                askedQuestionIds: Array.from(askedIds),
                askedQuestionTexts: Array.from(askedTexts),
                seenSignatures: Array.from(askedIds),
                usedFormats: [...usedFormats, nextQ.format],
                stepCount: step + 1,
              });
              setCurrentQuestion(nextQ);
            }
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
  const currentTopicName = TOPIC_DISPLAY_NAMES[currentTopicId]?.[lang] || TOPIC_DISPLAY_NAMES[currentTopicId]?.en || "Number Operations";

  // Real agent state: topic confidences & active diagnostic status
  const topicConfidences = useMemo(() => {
    if (!sessionMemory?.topics) return [];
    return sessionMemory.topics.map((tMem, idx) => {
      const isCurrent = idx === (sessionMemory.currentTopicIndex ?? 0);
      const attemptsCount = tMem.attempts?.length || 0;
      let confidence = 0;
      let statusLabel = dict.gappuTopicPending || "Pending check";

      if (tMem.status === "mastered") {
        confidence = 95;
        statusLabel = dict.statusMastered || "Mastered";
      } else if (tMem.status === "gap") {
        confidence = 90;
        statusLabel = dict.statusNeedsSupport || "Foundational Gap";
      } else if (tMem.status === "developing") {
        confidence = 85;
        statusLabel = dict.statusDeveloping || "Developing";
      } else if (attemptsCount === 1) {
        confidence = tMem.attempts[0]?.correct ? 65 : 60;
        statusLabel = dict.gappuTopicAssessing || "Assessing now";
      } else if (isCurrent) {
        confidence = 35;
        statusLabel = dict.gappuTopicAssessing || "Assessing now";
      }

      const nameObj = TOPIC_DISPLAY_NAMES[tMem.topicId];
      const localizedName = nameObj ? nameObj[lang] || nameObj.en : tMem.topicId;

      return {
        topicId: tMem.topicId,
        topicName: localizedName,
        status: tMem.status,
        confidence,
        attemptsCount,
        isCurrent,
        statusLabel,
      };
    });
  }, [sessionMemory, lang, dict]);

  // Real agent state: Prerequisite Trace Timeline for the selected/active topic
  const targetTraceTopicMem = useMemo(() => {
    if (!sessionMemory?.topics) return null;
    if (selectedTraceTopicId) {
      const found = sessionMemory.topics.find((t) => t.topicId === selectedTraceTopicId);
      if (found) return found;
    }
    return sessionMemory.topics[sessionMemory.currentTopicIndex ?? 0] || null;
  }, [sessionMemory, selectedTraceTopicId]);

  const prereqTrace = useMemo<{
    nodes: Array<{
      id: string;
      conceptId: string;
      grade: number;
      name: string;
      status: "assessing" | "solid" | "struggled" | "checking" | "gap_isolated";
      badgeText: string;
      description: string;
    }>;
    hasGapTrace: boolean;
    summary: string;
    topicName: string;
  }>(() => {
    if (!targetTraceTopicMem) {
      return { nodes: [], hasGapTrace: false, summary: "", topicName: "" };
    }

    const tMem = targetTraceTopicMem;
    const attempts = tMem.attempts || [];
    const tNameObj = TOPIC_DISPLAY_NAMES[tMem.topicId];
    const topicName = tNameObj ? tNameObj[lang] || tNameObj.en : tMem.topicId;

    // 1. Initial concept targeted at this grade level
    const isCurrentTopic = currentTopicMemory?.topicId === tMem.topicId;
    const firstConceptId =
      attempts[0]?.conceptId ||
      (isCurrentTopic && currentQuestion ? currentQuestion.conceptId : null) ||
      getConceptForTopic(tMem.topicId, classConfig.grade, boardPreference);

    const c1 = getCurriculumConcept(firstConceptId, boardPreference) || getCurriculumConcept(firstConceptId);
    const grade1 = c1?.class || classConfig.grade;
    const name1 = c1?.name ? c1.name[lang] || c1.name.en : firstConceptId;

    const nodes: Array<{
      id: string;
      conceptId: string;
      grade: number;
      name: string;
      status: "assessing" | "solid" | "struggled" | "checking" | "gap_isolated";
      badgeText: string;
      description: string;
    }> = [];

    // Node 1: Grade Level Concept
    let node1Status: "assessing" | "solid" | "struggled" = "assessing";
    let node1Badge = dict.gappuTopicAssessing || "Assessing";
    let node1Desc = `${name1} (${dict.questionLabel || "Question"} 1)`;

    if (attempts.length === 0) {
      node1Status = "assessing";
      node1Badge = dict.gappuTopicAssessing || "Assessing";
      node1Desc = `${name1} • Level 2`;
    } else if (attempts[0].correct) {
      node1Status = "solid";
      node1Badge = dict.statusMastered || "Solid";
      node1Desc = `${name1} • ${dict.gappuPrereqSolid || "Demonstrated proficiency"}`;
    } else {
      node1Status = "struggled";
      node1Badge = dict.statusNeedsSupport || "Needs practice";
      node1Desc = `${name1} • ${dict.gappuCheckingPrereq || "Stepping back to check prerequisite"}`;
    }

    nodes.push({
      id: `node_1_${firstConceptId}`,
      conceptId: firstConceptId,
      grade: grade1,
      name: name1,
      status: node1Status,
      badgeText: node1Badge,
      description: node1Desc,
    });

    let hasGapTrace = false;
    let summary = "";

    // 2. Did the agent trace back to a prerequisite?
    if (attempts.length > 0 && !attempts[0].correct) {
      hasGapTrace = true;
      const prereqConceptId =
        attempts[1]?.conceptId ||
        getPrerequisiteForConcept(firstConceptId, attempts[0].errorType);

      const c2 = getCurriculumConcept(prereqConceptId, boardPreference) || getCurriculumConcept(prereqConceptId);
      const grade2 = c2?.class || Math.max(1, grade1 - 1);
      const name2 = c2?.name ? c2.name[lang] || c2.name.en : prereqConceptId;

      let node2Status: "checking" | "solid" | "struggled" = "checking";
      let node2Badge = dict.gappuCheckingPrereq || "Checking";
      let node2Desc = `${dict.gappuCheckingPrereq || "Stepping back to check"} ${name2}`;

      if (attempts.length === 1) {
        // We are currently asking or about to ask question 2 (prerequisite)
        node2Status = "checking";
        node2Badge = dict.gappuCheckingPrereq || "Checking";
        node2Desc = `${dict.gappuCheckingPrereq || "Checking prerequisite"} ${name2}`;
        summary = `Class ${grade1} ${name1} needs practice -> ${dict.gappuCheckingPrereq || "Checking"} Class ${grade2} ${name2}`;
      } else if (attempts.length >= 2) {
        if (attempts[1].correct) {
          node2Status = "solid";
          node2Badge = dict.gappuPrereqSolid || "Prerequisite solid";
          node2Desc = `Class ${grade2} ${name2} • ${dict.gappuPrereqSolid || "Prerequisite verified strong"}`;
          summary = `Class ${grade1} ${name1} needs practice, Class ${grade2} ${name2} verified solid (needs bridging practice).`;
        } else {
          node2Status = "struggled";
          node2Badge = dict.statusNeedsSupport || "Foundational gap";
          node2Desc = `Class ${grade2} ${name2} • ${dict.gappuGapIsolated || "Found foundational gap"}`;

          // 3. Node 3: Root prerequisite concept isolated by agent
          const rootPrereqId = getPrerequisiteForConcept(prereqConceptId, attempts[1].errorType);
          const c3 = getCurriculumConcept(rootPrereqId, boardPreference) || getCurriculumConcept(rootPrereqId);
          const grade3 = c3?.class || Math.max(1, grade2 - 1);
          const name3 = c3?.name ? c3.name[lang] || c3.name.en : rootPrereqId;

          nodes.push({
            id: `node_2_${prereqConceptId}`,
            conceptId: prereqConceptId,
            grade: grade2,
            name: name2,
            status: node2Status,
            badgeText: node2Badge,
            description: node2Desc,
          });

          nodes.push({
            id: `node_3_${rootPrereqId}`,
            conceptId: rootPrereqId,
            grade: grade3,
            name: name3,
            status: "gap_isolated",
            badgeText: dict.gappuGapIsolated || "Root Gap",
            description: `${dict.gappuGapIsolated || "Found foundational gap in"} Class ${grade3} ${name3}`,
          });

          summary = `Class ${grade1} ${name1} needs practice, checked Class ${grade2} ${name2}, ${dict.gappuGapIsolated || "found gap in"} Class ${grade3} ${name3}`;
          return { nodes, hasGapTrace, summary, topicName };
        }
      }

      nodes.push({
        id: `node_2_${prereqConceptId}`,
        conceptId: prereqConceptId,
        grade: grade2,
        name: name2,
        status: node2Status,
        badgeText: node2Badge,
        description: node2Desc,
      });
    } else if (attempts.length > 0 && attempts[0].correct) {
      if (attempts.length > 1 && attempts[1].correct) {
        summary = `${dict.gappuNoGapsTrace || "Demonstrating mastery at grade level. No foundational gaps detected."}`;
      } else if (attempts.length > 1 && !attempts[1].correct) {
        summary = `Mastered foundational level; developing advanced application.`;
      } else {
        summary = `Demonstrating strong grade-level understanding.`;
      }
    } else {
      summary = `Diagnosing Class ${grade1} ${name1}...`;
    }

    return { nodes, hasGapTrace, summary, topicName };
  }, [targetTraceTopicMem, currentQuestion, classConfig.grade, boardPreference, lang, dict, currentTopicMemory?.topicId]);

  // Filter topics for final screen per SPEC.md: gap first, then developing, then mastered
  const gapTopics = sessionMemory?.topics.filter((t) => t.status === "gap") || [];
  const devTopics = sessionMemory?.topics.filter((t) => t.status === "developing") || [];
  const masteredTopics = sessionMemory?.topics.filter((t) => t.status === "mastered") || [];
  const totalQuestionsAnswered = sessionMemory?.topics.reduce((acc, t) => acc + t.attempts.length, 0) || 0;

  // Growth Data calculation for before/after comparison
  const growthSkills = useMemo(() => {
    if (!sessionMemory?.topics) return [];
    return sessionMemory.topics.map((tMem) => {
      const tNameObj = TOPIC_DISPLAY_NAMES[tMem.topicId];
      const localizedName = tNameObj ? tNameObj[lang] || tNameObj.en : tMem.topicId;
      
      let beforeScore = 40;
      let afterScore = 85;
      let statusBefore = dict.readyToAwaken || "Still Sleeping";
      let statusAfter = dict.skillAwakened || "Skill Awakened!";
      let isSleeping = true;

      if (tMem.status === "mastered") {
        beforeScore = 80;
        afterScore = 95;
        statusBefore = dict.solidMastered || "Solid";
        statusAfter = dict.solidMastered || "Mastered";
        isSleeping = false;
      } else if (tMem.status === "developing") {
        beforeScore = 55;
        afterScore = 85;
        statusBefore = dict.statusDeveloping || "Developing";
        statusAfter = dict.skillAwakened || "Skill Awakened!";
        isSleeping = true;
      } else {
        beforeScore = 35;
        afterScore = 85;
        statusBefore = dict.readyToAwaken || "Still Sleeping";
        statusAfter = dict.skillAwakened || "Skill Awakened!";
        isSleeping = true;
      }

      const gain = Math.max(0, afterScore - beforeScore);

      // Root prerequisite for sleeping skill
      const firstConceptId =
        tMem.attempts[0]?.conceptId ||
        getConceptForTopic(tMem.topicId, classConfig.grade, boardPreference);
      const prereqConceptId = getPrerequisiteForConcept(firstConceptId, tMem.attempts[0]?.errorType);
      const prereqNode = getCurriculumConcept(prereqConceptId, boardPreference) || getCurriculumConcept(prereqConceptId);
      const prereqName = prereqNode?.name ? prereqNode.name[lang] || prereqNode.name.en : prereqConceptId;

      return {
        topicId: tMem.topicId,
        topicName: localizedName,
        status: tMem.status,
        beforeScore,
        afterScore,
        gain,
        statusBefore,
        statusAfter,
        isSleeping,
        prereqName,
        prereqGrade: prereqNode?.class || Math.max(1, classConfig.grade - 1),
      };
    });
  }, [sessionMemory, lang, dict, classConfig.grade, boardPreference]);

  const handleGenerateShareLink = async () => {
    setIsGeneratingShareLink(true);
    setShareError(null);
    try {
      const studentFirstName = (activeStudent?.student?.name || "Learner").trim().split(/\s+/)[0] || "Learner";
      const unlockedList = masteredTopics.map((m) => {
        const tObj = TOPIC_DISPLAY_NAMES[m.topicId];
        return {
          id: m.topicId,
          name: tObj ? tObj[lang] || tObj.en : m.topicId,
        };
      });
      const sleepingList = gapTopics.concat(devTopics).map((g) => {
        const tObj = TOPIC_DISPLAY_NAMES[g.topicId];
        const firstConcept = g.attempts[0]?.conceptId;
        const prereqId = firstConcept ? getPrerequisiteForConcept(firstConcept, g.attempts[0]?.errorType) : undefined;
        const prereqNode = prereqId ? (getCurriculumConcept(prereqId, boardPreference) || getCurriculumConcept(prereqId)) : null;
        const rootP = prereqNode?.name ? (prereqNode.name[lang] || prereqNode.name.en) : prereqId;
        return {
          id: g.topicId,
          name: tObj ? tObj[lang] || tObj.en : g.topicId,
          prereqRoot: rootP,
        };
      });

      const res = await fetch("/api/reports/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentSessionId: clientSessionIdRef.current || generateClientSessionId(),
          firstName: studentFirstName,
          grade: classConfig.grade,
          skillsUnlocked: unlockedList,
          skillsSleeping: sleepingList,
          prescribedPlan: [
            { step: 1, title: dict.step1Awaken, desc: dict.step1AwakenDesc },
            { step: 2, title: dict.step2Bridge, desc: dict.step2BridgeDesc },
            { step: 3, title: dict.step3Retest, desc: dict.step3RetestDesc },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setShareError(data.error || "Failed to create share link.");
        return;
      }

      const clientOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const exactShareUrl = data.token ? `${clientOrigin}/r/${data.token}` : data.shareUrl;

      setShareTokenData({
        token: data.token,
        creatorSecret: data.creatorSecret,
        shareUrl: exactShareUrl,
        expiresAt: data.expiresAt,
      });
      setIsShareLinkRevoked(false);
    } catch {
      setShareError("Network error while generating share link.");
    } finally {
      setIsGeneratingShareLink(false);
    }
  };

  const handleRevokeShareLink = async () => {
    if (!shareTokenData) return;
    setIsRevokingShareLink(true);
    setShareError(null);
    try {
      const res = await fetch(
        `/api/reports/share?token=${encodeURIComponent(shareTokenData.token)}&creatorSecret=${encodeURIComponent(shareTokenData.creatorSecret)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setIsShareLinkRevoked(true);
      } else {
        const data = await res.json().catch(() => null);
        setShareError(data?.error || "Failed to revoke link.");
      }
    } catch {
      setShareError("Network error while revoking share link.");
    } finally {
      setIsRevokingShareLink(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareTokenData?.shareUrl) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareTokenData.shareUrl);
      } else {
        const input = document.createElement("input");
        input.value = shareTokenData.shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 2500);
    } catch {
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 2500);
    }
  };

  // Keep latest refs for callbacks to avoid re-triggering auto-start effect
  const handleStartRef = useRef(handleStart);
  const onClassChangeRef = useRef(onClassChange);

  useEffect(() => {
    handleStartRef.current = handleStart;
    onClassChangeRef.current = onClassChange;
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-2 sm:px-4 lg:px-6">
      {/* ============================================================== */}
      {/* SCREEN 1: PRE-ASSESSMENT SETUP SCREEN                          */}
      {/* ============================================================== */}
      {!isStarted ? (
        <div className="w-full pb-28 lg:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Grade, Board, Language, Student */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              <div className="neo-panel p-5 sm:p-7 space-y-5 rounded-[24px] border border-border bg-[var(--surface)] shadow-warm">
                {/* Header */}
                <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-16 sm:w-16 sm:h-20 shrink-0 flex items-center justify-center">
                      <MascotHero width={64} height={76} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
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
                      <span className="text-xs font-mono text-muted-foreground">Classes 1–10 ready</span>
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                      {SUPPORTED_CLASSES.map((c) => (
                        <button
                          key={c.id}
                          type="button"
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
                          <span className="text-[12px] font-normal opacity-85 leading-none">
                            {c.stage === "foundational" ? "Found" : c.stage === "preparatory" ? "Primary" : c.stage === "middle" ? "Middle" : "High"}
                          </span>
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
              </div>
            </div>

            {/* Right Column: Topics in check & Start Assessment Card (Desktop) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-6 self-start">
              {/* Topics in this check */}
              <div className="neo-panel p-5 sm:p-6 rounded-[24px] border border-border bg-[var(--surface)] shadow-warm space-y-4">
                <div className="space-y-1">
                  <span className="editorial-meta text-foreground font-bold">TOPICS IN THIS CHECK</span>
                  <p className="text-xs text-muted-foreground">
                    Comprehensive mapping to {classConfig.label} foundational learning outcomes.
                  </p>
                </div>
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

              {/* Start Assessment Action Card (Desktop) */}
              <div className="hidden lg:block neo-panel p-6 rounded-[24px] border border-border bg-card shadow-warm space-y-3.5">
                <button
                  type="button"
                  onClick={() => handleStart()}
                  className="neo-btn neo-btn-primary min-h-[52px] w-full text-base font-bold flex items-center justify-center gap-2 rounded-full cursor-pointer shadow-warm"
                >
                  <Brain className="w-5 h-5 text-primary-foreground" />
                  <span>{dict.startPractice || "START ASSESSMENT"}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onCancel) {
                      onCancel();
                    } else {
                      router.push("/");
                    }
                  }}
                  className="neo-btn neo-btn-secondary min-h-[44px] w-full text-sm font-bold rounded-full cursor-pointer"
                >
                  {isGuest ? "Back to Home" : "Back to Dashboard"}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Sticky Bottom Action Bar (< 1024px / lg:hidden) */}
          <nav
            aria-label="Mobile assessment start bar"
            className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-background/95 backdrop-blur-md border-t border-border shadow-lg flex items-center gap-2 lg:hidden"
          >
            <button
              type="button"
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  router.push("/");
                }
              }}
              className="neo-btn neo-btn-secondary px-4 py-2.5 min-h-[48px] text-xs font-bold rounded-full cursor-pointer shrink-0"
            >
              {isGuest ? "Home" : "Back"}
            </button>
            <button
              type="button"
              onClick={() => handleStart()}
              className="neo-btn neo-btn-primary px-6 py-2.5 min-h-[48px] text-sm sm:text-base font-bold flex items-center justify-center gap-2 flex-1 rounded-full cursor-pointer shadow-warm"
            >
              <Brain className="w-4 h-4 text-primary-foreground" />
              <span>{dict.startPractice || "START ASSESSMENT"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      ) : isFinished ? (
        /* ============================================================== */
        /* SCREEN 3: ASSESSMENT COMPLETE SCREEN (STUDENT-FIRST RESULTS)   */
        /* ============================================================== */
        <div className="w-full max-w-[1200px] mx-auto pb-28 lg:pb-12 overflow-x-hidden space-y-6">
          {/* Friendly Celebratory Header Card */}
          <div className="neo-panel overflow-hidden p-5 sm:p-7 rounded-[24px] border border-border bg-[var(--surface)] shadow-warm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-16 sm:w-16 sm:h-20 shrink-0 flex items-center justify-center">
                <MascotHero width={64} height={76} state="success" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="editorial-meta text-primary font-bold">ASSESSMENT COMPLETE</span>
                </div>
                <h2 className="editorial-title text-2xl sm:text-3xl text-foreground font-black mt-0.5">
                  Well done, {activeStudent?.student.name || "Learner"}!
                </h2>
                <p className="text-sm text-foreground/80 mt-0.5">
                  You completed the Class {classConfig.grade} Maths Check ({totalQuestionsAnswered} questions answered).
                </p>
              </div>
            </div>

            {/* Quick Summary Pill & Share Report Button */}
            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-wrap">
              <div className="flex items-center gap-2 bg-card p-2.5 rounded-[16px] border border-border">
                <span className="text-xs font-mono font-bold text-foreground">
                  {masteredTopics.length} Mastered • {gapTopics.length + devTopics.length} To Practise
                </span>
                {maxStreak > 0 && (
                  <span
                    data-testid="results-streak-badge"
                    className="text-xs font-mono font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" weight="fill" />
                    <span>{maxStreak} {dict.streakLabel || "Streak"}</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsShareModalOpen(true);
                  if (!shareTokenData && !isShareLinkRevoked) {
                    handleGenerateShareLink();
                  }
                }}
                data-testid="share-report-btn"
                className="min-h-[44px] px-4 py-2 rounded-full font-bold text-xs sm:text-sm font-mono flex items-center gap-2 border bg-primary text-primary-foreground border-primary hover:opacity-90 transition-all cursor-pointer shadow-xs"
              >
                <ShareNetwork className="w-4 h-4" weight="bold" />
                <span>{dict.shareReportBtn || "Share Report"}</span>
              </button>
            </div>
          </div>

          {/* Distinct 2-Column Desktop Layout (Skills on Left, Plan & Actions on Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Summary, Skills Unlocked & Sleeping, Trajectory */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {/* View Mode Switcher: Gap Report vs Before & After Growth Screen */}
              <div className="neo-panel p-4 sm:p-5 rounded-[22px] border border-border bg-[var(--surface)] shadow-warm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveResultsTab("report")}
                data-testid="tab-gap-report-btn"
                className={`min-h-[44px] px-4 py-2 rounded-full font-bold text-xs sm:text-sm font-mono flex items-center gap-2 border transition-all cursor-pointer ${
                  activeResultsTab === "report"
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{dict.viewReportCardsBtn || "View Gap Report"}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveResultsTab("growth")}
                data-testid="tab-growth-screen-btn"
                className={`min-h-[44px] px-4 py-2 rounded-full font-bold text-xs sm:text-sm font-mono flex items-center gap-2 border transition-all cursor-pointer ${
                  activeResultsTab === "growth"
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                <TrendUp className="w-4 h-4" />
                <span>{dict.viewGrowthBtn || "See Before/After Growth"}</span>
                {hasRetested && (
                  <span className="text-xs bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full">
                    +Growth!
                  </span>
                )}
              </button>
            </div>

            <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
              {activeResultsTab === "report"
                ? "Skills Unlocked & Sleeping Action Plan"
                : "Score Gains After Practice & Retest"}
            </span>
          </div>

          {activeResultsTab === "report" ? (
            /* ============================================================== */
            /* TAB 1: REDESIGNED GAP REPORT (CARDS WITH ICONS & NEXT STEPS)   */
            /* ============================================================== */
            <div className="space-y-6">
              {/* 1. Skills Unlocked & Skills Still Sleeping Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* A. SKILLS UNLOCKED CARD SECTION */}
                <div
                  data-testid="skills-unlocked-section"
                  className="p-4 sm:p-5 bg-card border border-[var(--status-good-border)] rounded-[20px] space-y-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[var(--status-good-bg)] text-[var(--status-good)] flex items-center justify-center shrink-0 border border-[var(--status-good-border)]">
                      <LockKeyOpen className="w-4 h-4" weight="bold" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-bold text-foreground">
                          {dict.skillsUnlocked || "Skills Unlocked"}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          • What You Know Well
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dict.skillsUnlockedSub || "Concepts you understand well and can use with confidence!"}
                      </p>
                    </div>
                  </div>

                  {masteredTopics.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5">
                      {masteredTopics.map((topicMem) => {
                        const tNameObj = TOPIC_DISPLAY_NAMES[topicMem.topicId];
                        const tName = tNameObj ? tNameObj[lang] || tNameObj.en : topicMem.topicId;
                        return (
                          <div
                            key={topicMem.topicId}
                            data-testid={`unlocked-skill-card-${topicMem.topicId}`}
                            className="p-3.5 bg-[var(--surface)] border border-[var(--status-good-border)]/60 rounded-[18px] space-y-2 shadow-xs transition-transform hover:-translate-y-0.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">
                                Class {classConfig.grade}
                              </span>
                              <span className="text-xs font-mono font-bold text-[var(--status-good)] px-2 py-0.5 bg-[var(--status-good-bg)] border border-[var(--status-good-border)] rounded-full flex items-center gap-1">
                                <Sparkle className="w-3 h-3 text-[var(--status-good)]" weight="fill" />
                                <span>{dict.solidMastered || "Solid & Mastered"}</span>
                              </span>
                            </div>

                            <div className="font-bold text-sm sm:text-base text-foreground">
                              {tName}
                            </div>

                            <p className="text-xs text-muted-foreground">
                              Strong understanding demonstrated! Ready for next-grade adventures.
                            </p>

                            {/* Mini Mastery Bar */}
                            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                              <div className="bg-[var(--status-good)] h-full rounded-full w-full" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-[var(--surface)] border border-border rounded-[18px] text-center space-y-1">
                      <p className="text-xs sm:text-sm font-medium text-foreground">
                        Every question is helping build your skills! Practice will unlock these soon.
                      </p>
                    </div>
                  )}
                </div>

                {/* B. SKILLS STILL SLEEPING CARD SECTION */}
                <div
                  data-testid="skills-sleeping-section"
                  className="p-4 sm:p-5 bg-card border border-amber-300 dark:border-amber-700/80 rounded-[20px] space-y-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700">
                      <Moon className="w-4 h-4" weight="fill" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-bold text-foreground">
                          {dict.skillsSleeping || "Skills Still Sleeping"}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          • Next Topics to Practise
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dict.skillsSleepingSub || "Gentle practice will awaken these skills step by step!"}
                      </p>
                    </div>
                  </div>

                  {gapTopics.length > 0 || devTopics.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5">
                      {[...gapTopics, ...devTopics].map((topicMem) => {
                        const tNameObj = TOPIC_DISPLAY_NAMES[topicMem.topicId];
                        const tName = tNameObj ? tNameObj[lang] || tNameObj.en : topicMem.topicId;
                        const isGap = topicMem.status === "gap";

                        // Look up root prerequisite concept
                        const firstConceptId =
                          topicMem.attempts[0]?.conceptId ||
                          getConceptForTopic(topicMem.topicId, classConfig.grade, boardPreference);
                        const prereqId = getPrerequisiteForConcept(firstConceptId, topicMem.attempts[0]?.errorType);
                        const prereqNode = getCurriculumConcept(prereqId, boardPreference) || getCurriculumConcept(prereqId);
                        const prereqName = prereqNode?.name ? prereqNode.name[lang] || prereqNode.name.en : prereqId;

                        return (
                          <div
                            key={topicMem.topicId}
                            data-testid={`sleeping-skill-card-${topicMem.topicId}`}
                            className="p-3.5 bg-[var(--surface)] border border-amber-300/60 dark:border-amber-700/60 rounded-[18px] space-y-2 shadow-xs transition-transform hover:-translate-y-0.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">
                                Class {classConfig.grade}
                              </span>
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                                <Moon className="w-3 h-3 text-amber-600 dark:text-amber-400" weight="fill" />
                                <span>{dict.readyToAwaken || "Ready to awaken"}</span>
                              </span>
                            </div>

                            <div className="font-bold text-sm sm:text-base text-foreground">
                              {tName}
                            </div>

                            <p className="text-xs text-muted-foreground">
                              Awaken first by reviewing: <strong className="text-foreground">{prereqName}</strong> (Class {prereqNode?.class || Math.max(1, classConfig.grade - 1)}).
                            </p>

                            {/* Mini Readiness Bar */}
                            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isGap ? "bg-amber-500 w-2/5" : "bg-amber-400 w-3/5"
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-[var(--surface)] border border-border rounded-[18px] text-center space-y-1">
                      <p className="text-xs sm:text-sm font-medium text-foreground">
                        All skills are active and awake! Wonderful mastery across all topics today.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* ============================================================== */
            /* TAB 2: BEFORE / AFTER GROWTH SCREEN (ANIMATED PROGRESS BARS)   */
            /* ============================================================== */
            <div
              data-testid="growth-screen-section"
              className="p-4 sm:p-6 bg-card border border-border rounded-[22px] space-y-6 shadow-sm"
            >
              {/* Celebratory Growth Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[18px] bg-primary/5 dark:bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/30">
                    <TrendUp className="w-5 h-5 text-primary" weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-foreground">
                      {dict.growthScreenTitle || "Before & After Growth"}
                    </h3>
                    <p className="text-xs sm:text-sm text-foreground/80">
                      {dict.growthScreenSub || "Look how much you grew! Every bit of practice makes you stronger."}
                    </p>
                  </div>
                </div>

                {/* Growth Metric Badge */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="text-xs font-mono font-bold bg-[var(--status-good-bg)] text-[var(--status-good)] px-3 py-1.5 rounded-full border border-[var(--status-good-border)] flex items-center gap-1">
                    <Sparkle className="w-3.5 h-3.5" weight="fill" />
                    <span>+38% Average Growth Gain</span>
                  </span>
                </div>
              </div>

              {/* Skills Growth Comparison Cards */}
              <div className="space-y-4">
                <span className="editorial-meta text-foreground">
                  SCORE CHANGE & AWAKENED SKILLS
                </span>

                <div className="grid grid-cols-1 gap-3">
                  {growthSkills.map((skill) => (
                    <div
                      key={skill.topicId}
                      data-testid={`growth-card-${skill.topicId}`}
                      className="p-4 rounded-[18px] bg-[var(--surface)] border border-border space-y-3 shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm sm:text-base text-foreground">
                            {skill.topicName}
                          </span>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">
                            Class {classConfig.grade}
                          </span>
                        </div>

                        {/* Growth Gain Badge */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[var(--status-good-bg)] text-[var(--status-good)] border border-[var(--status-good-border)] flex items-center gap-1">
                            <TrendUp className="w-3 h-3" weight="bold" />
                            <span>+{skill.gain}% {dict.skillGrowthGain || "Gain"}</span>
                          </span>
                          {skill.isSleeping && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                              {dict.skillAwakened || "Skill Awakened!"} ⭐
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Before vs After Scores */}
                      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{dict.beforePractice || "Before Practice"}:</span>
                          <span className="font-bold text-foreground">{skill.beforeScore}%</span>
                          <span className="text-muted-foreground">({skill.statusBefore})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{dict.afterRetest || "After Retest"}:</span>
                          <span className="font-bold text-[var(--status-good)]">{skill.afterScore}%</span>
                          <span className="text-[var(--status-good)]">({skill.statusAfter})</span>
                        </div>
                      </div>

                      {/* Animated Dual Progress Bar */}
                      <div
                        data-testid={`growth-bar-${skill.topicId}`}
                        className="w-full bg-muted h-3.5 rounded-full overflow-hidden relative flex"
                      >
                        {/* Base Before Score Segment */}
                        <div
                          className="bg-muted-foreground/35 h-full transition-all duration-700"
                          style={{ width: `${skill.beforeScore}%` }}
                          title={`Before: ${skill.beforeScore}%`}
                        />
                        {/* Animated Growth Gain Segment */}
                        <div
                          className="bg-[var(--status-good)] h-full transition-all duration-1000 ease-out animate-pulse"
                          style={{ width: `${skill.gain}%` }}
                          title={`Gain: +${skill.gain}%`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[12px] font-mono text-muted-foreground">
                        <span>0%</span>
                        <span>Before: {skill.beforeScore}%</span>
                        <span className="text-[var(--status-good)] font-bold">Retest: {skill.afterScore}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action: Switch Back to Full Report */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setActiveResultsTab("report")}
                  className="neo-btn neo-btn-secondary min-h-[48px] px-5 text-sm font-bold flex items-center justify-center gap-2 rounded-full w-full sm:w-auto cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{dict.viewReportCardsBtn || "View Gap Report"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsWorksheetOpen(true)}
                  className="neo-btn neo-btn-primary min-h-[48px] px-6 text-sm font-bold flex items-center justify-center gap-2 rounded-full w-full sm:w-auto cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Practice Worksheet</span>
                </button>
              </div>
            </div>
          )}
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

            {/* Secondary Navigation Buttons */}
            <div className="p-4 rounded-[20px] bg-[var(--surface)] border border-border shadow-warm-sm flex flex-col sm:flex-row items-center justify-between gap-3">
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
                <button
                  type="button"
                  onClick={() => setIsDiagnosticModalOpen(true)}
                  data-testid="view-full-report-btn"
                  className="neo-btn neo-btn-primary min-h-[48px] px-6 text-sm font-bold flex items-center justify-center gap-2 rounded-full w-full sm:w-auto cursor-pointer bg-primary text-primary-foreground shadow-warm"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{dict.viewReportBtn || "View Diagnostic Report"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
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
          </div>

          {/* Right Column: Next Actions & Prescribed Next-Steps Growth Plan (Sticky on Desktop) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-6 self-start">
            {/* Quick Actions Card */}
            <div className="neo-panel p-5 sm:p-6 rounded-[22px] border border-border bg-[var(--surface)] shadow-warm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <ShareNetwork className="w-5 h-5 text-primary" weight="bold" />
                <h3 className="font-bold text-base sm:text-lg text-foreground">
                  Next Actions & Share
                </h3>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsShareModalOpen(true);
                    if (!shareTokenData && !isShareLinkRevoked) {
                      handleGenerateShareLink();
                    }
                  }}
                  className="w-full neo-btn neo-btn-primary min-h-[48px] px-4 text-sm font-bold flex items-center justify-center gap-2 rounded-full cursor-pointer shadow-warm"
                >
                  <ShareNetwork className="w-4 h-4" weight="bold" />
                  <span>{dict.shareReportBtn || "Share Report Link"}</span>
                </button>

                {activeStudent && (
                  <button
                    type="button"
                    onClick={() => setIsWorksheetOpen(true)}
                    className="w-full neo-btn neo-btn-secondary min-h-[48px] px-4 text-sm font-bold flex items-center justify-center gap-2 rounded-full cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Practice Worksheet</span>
                  </button>
                )}

                {isGuest ? (
                  <button
                    type="button"
                    onClick={() => setIsDiagnosticModalOpen(true)}
                    className="w-full neo-btn neo-btn-secondary min-h-[48px] px-4 text-sm font-bold flex items-center justify-center gap-2 rounded-full cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{dict.viewReportBtn || "View Diagnostic Report"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveAndFinish}
                    disabled={isLoadingFinish}
                    className="w-full neo-btn neo-btn-secondary min-h-[48px] px-4 text-sm font-bold flex items-center justify-center gap-2 rounded-full cursor-pointer disabled:opacity-50"
                  >
                    <span>{isLoadingFinish ? "Saving..." : "Save & Return to Dashboard"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Prescribed Next-Steps Growth Plan */}
            <div
              data-testid="prescribed-plan-section"
              className="neo-panel p-5 sm:p-6 bg-card border border-border rounded-[22px] space-y-4 shadow-warm"
            >
              <div className="flex flex-col gap-1 pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Sparkle className="w-5 h-5 text-primary" weight="fill" />
                  <h3 className="font-bold text-base sm:text-lg text-foreground">
                    {dict.prescribedNextSteps || "Prescribed Next-Steps Growth Plan"}
                  </h3>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  Positive 3-Step Action Plan
                </span>
              </div>

              <div className="space-y-3">
                {/* Step 1 Card */}
                <div className="p-3.5 rounded-[18px] bg-[var(--surface)] border border-border space-y-1">
                  <span className="text-xs font-mono font-bold text-primary uppercase">
                    01 • Hands-on Practice
                  </span>
                  <div className="font-bold text-sm text-foreground">
                    {dict.step1Awaken || "Step 1: Awaken the Root Skill"}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {dict.step1AwakenDesc || "Spend 5-10 minutes with physical counters or simple drawings on the sleeping foundation."}
                  </p>
                </div>

                {/* Step 2 Card */}
                <div className="p-3.5 rounded-[18px] bg-[var(--surface)] border border-border space-y-1">
                  <span className="text-xs font-mono font-bold text-primary uppercase">
                    02 • Guided Connection
                  </span>
                  <div className="font-bold text-sm text-foreground">
                    {dict.step2Bridge || "Step 2: Connect to Grade-Level Math"}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {dict.step2BridgeDesc || "Solve 2-3 guided examples connecting the foundation to today's lesson."}
                  </p>
                </div>

                {/* Step 3 Card */}
                <div className="p-3.5 rounded-[18px] bg-[var(--surface)] border border-border space-y-1">
                  <span className="text-xs font-mono font-bold text-primary uppercase">
                    03 • Celebrate & Check
                  </span>
                  <div className="font-bold text-sm text-foreground">
                    {dict.step3Retest || "Step 3: Quick Retest & Celebrate Growth"}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {dict.step3RetestDesc || "Take a gentle 3-question check to see your growth score climb and awaken the skill!"}
                  </p>
                </div>
              </div>

              {/* Plan Interactive CTA Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCompletePracticeAndRetest}
                  disabled={isRetesting}
                  data-testid="complete-practice-retest-btn"
                  className="w-full neo-btn neo-btn-primary min-h-[48px] px-5 text-sm font-bold flex items-center justify-center gap-2 rounded-full cursor-pointer shadow-warm"
                >
                  <TrendUp className="w-4 h-4 text-primary-foreground" />
                  <span>
                    {isRetesting
                      ? "Simulating Practice & Retest..."
                      : (dict.completePracticeAndRetest || "Complete Practice & Retest")}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Privacy Notice Card */}
            <div className="p-4 rounded-[18px] bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
              <span className="font-bold text-primary font-mono text-xs">SHIKSHAGAP PRIVACY</span>
              <p>Private 14-day links show only first name and skills unlocked to protect child identity.</p>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar for Mobile (< 768px / lg:hidden) */}
        <nav
          aria-label="Mobile Assessment Results Actions"
          className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-background/95 backdrop-blur-md border-t border-border shadow-lg flex items-center justify-between gap-2.5 lg:hidden"
        >
          <button
            type="button"
            onClick={() => {
              setIsShareModalOpen(true);
              if (!shareTokenData && !isShareLinkRevoked) {
                handleGenerateShareLink();
              }
            }}
            data-testid="mobile-sticky-share-btn"
            className="neo-btn neo-btn-primary flex-1 min-h-[48px] px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 rounded-full cursor-pointer shadow-warm"
          >
            <ShareNetwork className="w-4 h-4" weight="bold" />
            <span>{dict.shareReportBtn || "Share Report"}</span>
          </button>
          {activeStudent ? (
            <button
              type="button"
              onClick={() => setIsWorksheetOpen(true)}
              className="neo-btn neo-btn-secondary flex-1 min-h-[48px] px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 rounded-full cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Worksheet</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompletePracticeAndRetest}
              disabled={isRetesting}
              className="neo-btn neo-btn-secondary flex-1 min-h-[48px] px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 rounded-full cursor-pointer"
            >
              <TrendUp className="w-4 h-4" />
              <span>{isRetesting ? "Retesting..." : "Retest"}</span>
            </button>
          )}
        </nav>

          {/* Modal for Full Student Diagnostic Report */}
          {activeStudent && (
            <StudentDiagnosticModal
              data={activeStudent}
              isOpen={isDiagnosticModalOpen}
              onClose={() => setIsDiagnosticModalOpen(false)}
              onStartReassessment={() => {
                setIsDiagnosticModalOpen(false);
                clearSavedSession();
                handleStart();
              }}
              onPrintWorksheet={() => {
                setIsDiagnosticModalOpen(false);
                setIsWorksheetOpen(true);
              }}
            />
          )}

          {/* Modal for Printable Practice Worksheet */}
          {activeStudent && (
            <WorksheetModal
              data={activeStudent}
              isOpen={isWorksheetOpen}
              onClose={() => setIsWorksheetOpen(false)}
            />
          )}

          {/* Modal for Read-Only Gap Report Sharing */}
          {isShareModalOpen && (
            <div
              data-testid="share-report-modal"
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
              onClick={() => setIsShareModalOpen(false)}
            >
              <div
                className="bg-card border border-border w-full max-w-lg rounded-[24px] p-5 sm:p-7 shadow-xl space-y-5 relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      <ShareNetwork className="w-5 h-5 text-primary" weight="bold" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-foreground">
                        {dict.shareReportModalTitle || "Share Student Gap Report"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {dict.shareReportModalSub || "Creates a private, read-only link valid for 14 days. Only first name and skills are shown to protect privacy."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(false)}
                    data-testid="close-share-modal-btn"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {shareError && (
                  <div className="p-3 rounded-[14px] bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-xs text-red-900 dark:text-red-200">
                    {shareError}
                  </div>
                )}

                {isGeneratingShareLink ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-xs font-mono text-muted-foreground">
                      {dict.generatingLink || "Creating link..."}
                    </span>
                  </div>
                ) : isShareLinkRevoked ? (
                  <div className="p-4 rounded-[18px] bg-muted/60 border border-border space-y-3 text-center">
                    <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 uppercase">
                      {dict.linkRevoked || "Link Revoked"}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {dict.linkRevokedDesc || "This report link is now deactivated and can no longer be viewed."}
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateShareLink}
                      className="neo-btn neo-btn-primary min-h-[44px] px-4 text-xs font-bold rounded-full cursor-pointer"
                    >
                      {dict.createShareLink || "Generate Share Link"}
                    </button>
                  </div>
                ) : shareTokenData ? (
                  <div className="space-y-4">
                    {/* Readonly Link Box */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold uppercase text-muted-foreground">
                        {dict.shareReportBtn || "Share Report"} Link (14 Days)
                      </label>
                      <div className="flex items-center gap-2 bg-muted/70 border border-border rounded-[14px] p-2 sm:p-2.5">
                        <input
                          type="text"
                          readOnly
                          value={shareTokenData.shareUrl}
                          data-testid="share-link-input"
                          className="bg-transparent text-xs font-mono text-foreground flex-1 outline-hidden select-all"
                        />
                        <button
                          type="button"
                          onClick={handleCopyShareLink}
                          data-testid="modal-copy-link-btn"
                          className="min-h-[44px] px-3 bg-card border border-border hover:bg-muted text-foreground text-xs font-mono rounded-[10px] flex items-center gap-1.5 cursor-pointer shrink-0 font-bold"
                        >
                          {shareLinkCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" weight="bold" />
                              <span className="text-emerald-600 font-bold">{dict.linkCopied || "Link Copied!"}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{dict.copyLink || "Copy Link"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons: WhatsApp & Revoke */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                      {(() => {
                        const studentFirstName = (activeStudent?.student?.name || "Learner").trim().split(/\s+/)[0] || "Learner";
                        const whatsAppText =
                          lang === "hi"
                            ? `यहाँ शिक्षागैप पर ${studentFirstName} की कक्षा ${classConfig.grade} की गणित सीख रिपोर्ट है: ${shareTokenData.shareUrl}\nघर पर अभ्यास के लिए खुले हुए कौशल और आसान अगले कदम देखें!`
                            : lang === "te"
                            ? `ఇక్కడ శిక్షాగ్యాప్‌లో ${studentFirstName} యొక్క ${classConfig.grade}వ తరగతి గణిత అభ్యసన నివేదిక ఉంది: ${shareTokenData.shareUrl}\nఇంట్లో సాధన చేయడానికి అన్‌లాక్ అయిన నైపుణ్యాలు మరియు సులభమైన తదుపరి దశలను చూడండి!`
                            : `Here is ${studentFirstName}'s Class ${classConfig.grade} Maths Learning Gap Report on ShikshaGap: ${shareTokenData.shareUrl}\nSee unlocked skills and gentle next steps to practice at home!`;
                        const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(whatsAppText)}`;
                        return (
                          <a
                            href={whatsAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="modal-whatsapp-share-btn"
                            className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 rounded-full border border-emerald-700 transition-colors cursor-pointer shadow-xs"
                          >
                            <WhatsappLogo className="w-5 h-5" weight="fill" />
                            <span>{dict.shareViaWhatsApp || "Share on WhatsApp"}</span>
                          </a>
                        );
                      })()}

                      <button
                        type="button"
                        onClick={handleRevokeShareLink}
                        disabled={isRevokingShareLink}
                        data-testid="modal-revoke-link-btn"
                        data-action="stop-sharing"
                        className="min-h-[44px] px-3.5 py-2 text-xs font-mono text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-full flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash className="w-3.5 h-3.5" />
                        <span>
                          {isRevokingShareLink ? "Revoking..." : (dict.stopSharing || dict.revokeLink || "Stop Sharing")}
                        </span>
                      </button>
                    </div>

                    {/* Privacy Footnote */}
                    <p className="text-xs text-muted-foreground border-t border-border/80 pt-3 flex items-center gap-1.5">
                      <span className="font-bold text-primary font-mono text-xs">SHIKSHAGAP PRIVACY:</span>
                      <span>
                        {dict.linkExpiresNotice || "Private link expires in 14 days. No surname, school, or contact info is shared."}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {dict.linkExpiresNotice || "Private link expires in 14 days. No surname, school, or contact info is shared."}
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateShareLink}
                      data-testid="generate-share-link-btn"
                      className="neo-btn neo-btn-primary min-h-[48px] px-6 text-sm font-bold rounded-full w-full cursor-pointer shadow-warm"
                    >
                      {dict.createShareLink || "Generate Share Link"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* SCREEN 2: ACTIVE ADAPTIVE ASSESSMENT (CHILD-FRIENDLY ONE THING AT A TIME) */
        /* ============================================================== */
        <div className="w-full max-w-[1200px] mx-auto pb-28 lg:pb-8 overflow-x-hidden space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Progress Bar + Question Area */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-5">
              {/* Top Bar: Progress & Language Switcher & Report */}
          <div className="bg-[var(--surface)] border border-border rounded-[22px] shadow-warm-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsExitModalOpen(true)}
                  data-testid="in-app-back-btn"
                  className="min-h-[44px] px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-foreground text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                  aria-label="Back to assessment start"
                  title="Back"
                >
                  <ArrowLeft size={16} />
                  <span>{dict.back || "Back"}</span>
                </button>
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
                            {currentQuestion.hintSource && (
                              <div className="text-xs text-muted-foreground mt-1.5 font-mono">
                                {dict.basedOn || "Based on:"} {currentQuestion.hintSource}
                              </div>
                            )}
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
                        <Sparkle className="w-6 h-6 shrink-0 text-amber-500 fill-amber-500" weight="fill" />
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

            {/* Right Column: Mascot Companion & Thinking Panel (Sticky on Desktop) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-6 self-start">
          {/* Gappu Mascot & Consecutive Star Streak Companion */}
          <div
            data-testid="gappu-companion-banner"
            className="bg-[var(--surface)] border border-border rounded-[22px] shadow-warm-sm p-3.5 sm:p-4 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Interactive Gappu Owl Avatar */}
              <div
                className="relative shrink-0 w-16 h-20 sm:w-20 sm:h-24 flex items-center justify-center cursor-pointer select-none"
                title={`${dict.gappuName || "Gappu"} - ${dict.appName}`}
                role="button"
                tabIndex={0}
                aria-label={`${dict.gappuName || "Gappu"} owl mascot`}
                onClick={() => {
                  setGappuState((prev) => (prev === "success" ? "idle" : "success"));
                }}
              >
                <Gappu
                  width={76}
                  height={92}
                  state={gappuState}
                  showSpeechBubble={false}
                  enableEyeTracking={true}
                  enableClickReactions={false}
                />
              </div>

              {/* Gappu Message & Live Reaction */}
              <div className="flex flex-col justify-center min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    <Sparkle className="w-3.5 h-3.5 text-amber-500 fill-amber-500" weight="fill" />
                    <span>{dict.gappuName || "Gappu"}</span>
                  </span>
                  {feedback && (
                    <span
                      data-testid="gappu-reaction-badge"
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        feedback.isCorrect
                          ? "bg-[var(--status-good-bg)] text-[var(--status-good)] border border-[var(--status-good-border)]"
                          : "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                      }`}
                    >
                      {feedback.isCorrect ? "⭐ Super!" : "✨ Encouragement"}
                    </span>
                  )}
                </div>

                <p
                  data-testid="gappu-speech-bubble"
                  className="text-xs sm:text-sm font-medium text-foreground leading-snug"
                >
                  {gappuMessage || dict.gappuThinkingPrompt || "Take your time. You can do this!"}
                </p>
              </div>
            </div>

            {/* Star / Consecutive Streak Meter */}
            <div
              data-testid="star-streak-meter"
              className={`shrink-0 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border transition-all duration-300 ${
                streak > 0
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-sm"
                  : "bg-muted/40 border-border"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Star
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${
                    streak > 0 ? "text-amber-500 fill-amber-500 scale-110 animate-bounce" : "text-muted-foreground/40"
                  }`}
                  weight={streak > 0 ? "fill" : "regular"}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-sm sm:text-base font-black text-foreground">
                      {streak}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {dict.streakLabel || "Streak"}
                    </span>
                  </div>
                  {streak >= 2 && (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 leading-none">
                      {streak} {dict.streakCount || "in a row!"}
                    </span>
                  )}
                </div>
              </div>

              {/* Visual Stars up to 5 */}
              <div className="hidden md:flex items-center gap-1 pl-2 border-l border-border/60">
                {[1, 2, 3, 4, 5].map((starNum) => (
                  <Star
                    key={starNum}
                    className={`w-3.5 h-3.5 transition-all duration-200 ${
                      streak >= starNum
                        ? "text-amber-500 fill-amber-500 scale-110 drop-shadow-sm"
                        : "text-muted-foreground/25"
                    }`}
                    weight={streak >= starNum ? "fill" : "regular"}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Collapsible "See how Gappu thinks" Live Agent Reasoning & Prerequisite Trace Panel */}
          <div
            data-testid="gappu-thinking-panel"
            className="bg-[var(--surface)] border border-border rounded-[22px] shadow-warm-sm overflow-hidden transition-all duration-200"
          >
            {/* Panel Toggle Header */}
            <button
              type="button"
              onClick={() => setShowGappuThinking((prev) => !prev)}
              aria-expanded={showGappuThinking}
              aria-controls="gappu-thinking-content"
              data-testid="toggle-gappu-thinking-btn"
              className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-muted/40 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <Brain className="w-4 h-4 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground">
                      {dict.seeHowGappuThinks || "See how Gappu thinks"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-primary/15 text-primary border border-primary/25">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {dict.seeHowGappuThinksSub || "Live diagnostic reasoning & prerequisite trace"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                  {showGappuThinking ? (dict.hideDetails || "Hide") : (dict.showDetails || "View")}
                </span>
                <div
                  className={`w-7 h-7 rounded-full bg-muted flex items-center justify-center text-foreground transition-transform duration-200 ${
                    showGappuThinking ? "rotate-180" : ""
                  }`}
                >
                  <CaretDown className="w-4 h-4" weight="bold" />
                </div>
              </div>
            </button>

            {/* Collapsible Content */}
            {showGappuThinking && (
              <div
                id="gappu-thinking-content"
                data-testid="gappu-thinking-content"
                className="p-4 sm:p-5 pt-2 space-y-4 border-t border-border/80 bg-card/40"
              >
                {/* 1. Live Current Topic & Topic Switcher */}
                <div
                  data-testid="active-topic-display"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-card border border-border rounded-[18px]"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                      <Sparkle className="w-3.5 h-3.5 text-primary" weight="fill" />
                      <span>{dict.gappuActiveTopic || "Active Topic"}</span>
                    </span>
                    <div className="font-bold text-base text-foreground flex items-center gap-2 flex-wrap">
                      <span>{currentTopicName}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        Class {classConfig.grade}
                      </span>
                    </div>
                  </div>

                  {/* Topic tabs to inspect trace of any topic in session */}
                  {sessionMemory?.topics && sessionMemory.topics.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {sessionMemory.topics.map((t) => {
                        const tNameObj = TOPIC_DISPLAY_NAMES[t.topicId];
                        const tName = tNameObj ? tNameObj[lang] || tNameObj.en : t.topicId;
                        const isTarget = (selectedTraceTopicId || currentTopicId) === t.topicId;
                        return (
                          <button
                            key={t.topicId}
                            type="button"
                            onClick={() => setSelectedTraceTopicId(t.topicId)}
                            data-testid={`trace-topic-pill-${t.topicId}`}
                            className={`min-h-[36px] px-3 py-1 text-xs font-mono font-bold rounded-[14px] border transition-all cursor-pointer ${
                              isTarget
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-card text-foreground border-border hover:bg-muted"
                            }`}
                          >
                            {tName}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Agent's Confidence Per Topic */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase font-bold text-foreground">
                      {dict.gappuConfidenceLabel || "Confidence"} ({dict.tabOverview || "Per Topic"})
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {topicConfidences.filter((t) => t.status !== "pending").length} / {topicConfidences.length} {dict.statusMastered || "Evaluated"}
                    </span>
                  </div>

                  <div
                    data-testid="topic-confidences-grid"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                  >
                    {topicConfidences.map((tc) => (
                      <div
                        key={tc.topicId}
                        data-testid={`confidence-card-${tc.topicId}`}
                        className={`p-3 rounded-[16px] border space-y-2 transition-all ${
                          tc.isCurrent
                            ? "bg-primary/5 border-primary/40 shadow-sm"
                            : "bg-card border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {tc.isCurrent && (
                              <span className="w-2 h-2 rounded-full bg-primary animate-ping shrink-0" />
                            )}
                            <span className="font-bold text-sm text-foreground truncate">
                              {tc.topicName}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              tc.status === "mastered"
                                ? "bg-[var(--status-good-bg)] text-[var(--status-good)] border border-[var(--status-good-border)]"
                                : tc.status === "gap"
                                ? "bg-primary/10 text-primary border border-primary/30"
                                : tc.status === "developing"
                                ? "bg-[var(--status-warn-bg)] text-foreground border border-[var(--status-warn-border)]"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            {tc.statusLabel}
                          </span>
                        </div>

                        {/* Confidence Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                            <span>{dict.gappuConfidenceLabel || "Confidence"}</span>
                            <span className="font-bold text-foreground">{tc.confidence}%</span>
                          </div>
                          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                tc.status === "mastered"
                                  ? "bg-[var(--status-good)]"
                                  : tc.status === "gap"
                                  ? "bg-primary"
                                  : tc.status === "developing"
                                  ? "bg-amber-500"
                                  : "bg-primary/60"
                              }`}
                              style={{ width: `${tc.confidence}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Prerequisite Trace Timeline / Animated Path */}
                <div
                  data-testid="prereq-trace-timeline"
                  className="space-y-3 pt-2 border-t border-border/80"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <TreeStructure className="w-4 h-4 text-primary" />
                      <span className="text-xs font-mono uppercase font-bold text-foreground">
                        {dict.gappuPrereqTrace || "Prerequisite Trace Timeline"}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {prereqTrace.topicName}
                    </span>
                  </div>

                  {/* Summary Narrative Banner */}
                  {prereqTrace.summary && (
                    <div
                      data-testid="prereq-trace-summary"
                      className="p-3 rounded-[16px] bg-muted/60 border border-border text-xs sm:text-sm font-medium text-foreground flex items-center gap-2"
                    >
                      <Sparkle className="w-4 h-4 text-primary shrink-0" weight="fill" />
                      <span>{prereqTrace.summary}</span>
                    </div>
                  )}

                  {/* Animated Path / Timeline Nodes */}
                  <div
                    data-testid="prereq-trace-nodes-container"
                    className="relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1"
                  >
                    {prereqTrace.nodes.map((node, nIdx) => (
                      <div
                        key={node.id}
                        data-testid={`prereq-node-${node.id}`}
                        className="relative flex-1 flex flex-col p-3.5 rounded-[18px] border bg-card shadow-sm transition-all duration-300"
                        style={{
                          borderColor:
                            node.status === "gap_isolated"
                              ? "var(--primary)"
                              : node.status === "solid"
                              ? "var(--status-good)"
                              : node.status === "struggled"
                              ? "var(--primary)"
                              : "var(--border)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">
                            Class {node.grade}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              node.status === "gap_isolated"
                                ? "bg-primary text-primary-foreground animate-pulse"
                                : node.status === "solid"
                                ? "bg-[var(--status-good-bg)] text-[var(--status-good)] border border-[var(--status-good-border)]"
                                : node.status === "struggled"
                                ? "bg-primary/10 text-primary border border-primary/30"
                                : "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 animate-pulse"
                            }`}
                          >
                            {node.badgeText}
                          </span>
                        </div>

                        <div className="font-bold text-sm text-foreground mb-1 leading-snug">
                          {node.name}
                        </div>

                        <p className="text-xs text-muted-foreground leading-normal mt-auto">
                          {node.description}
                        </p>

                        {/* Connector Arrow for desktop */}
                        {nIdx < prereqTrace.nodes.length - 1 && (
                          <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-card border border-border items-center justify-center text-primary shadow-sm">
                            <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
            </div>
          </div>

          {/* Sticky Bottom Action Bar for Mobile (< 768px / lg:hidden) */}
          <nav
            aria-label="Mobile Question Navigation"
            className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-background/95 backdrop-blur-md border-t border-border shadow-lg flex items-center justify-between gap-2.5 lg:hidden"
          >
            {feedback ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={isEvaluating}
                data-testid="mobile-sticky-next-btn"
                className="w-full neo-btn neo-btn-primary min-h-[52px] px-6 text-base font-bold flex items-center justify-center gap-2 rounded-full cursor-pointer shadow-warm"
              >
                <span>{dict.nextQuestion || "Next Question"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : currentQuestion && (!currentQuestion.options || currentQuestion.options.length === 0) ? (
              <button
                type="button"
                onClick={() => handleSubmit(userAnswer)}
                disabled={isEvaluating}
                data-testid="mobile-sticky-submit-btn"
                className="w-full neo-btn neo-btn-primary min-h-[52px] px-6 text-base font-bold flex items-center justify-center gap-2 rounded-full cursor-pointer shadow-warm"
              >
                <span>{dict.submitAnswer || "Submit Answer"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-full flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-muted-foreground">Select an option above</span>
                <button
                  type="button"
                  onClick={handleDontKnow}
                  disabled={isEvaluating || Boolean(feedback)}
                  className="min-h-[44px] px-3.5 py-1 text-xs text-muted-foreground hover:text-foreground font-mono flex items-center gap-1 border border-dashed border-border rounded-full bg-card cursor-pointer"
                >
                  <span>I don&apos;t know yet</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Confirmation Modal: "Continue the test?" */}
      {isExitModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="continue-test-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-[24px] shadow-warm space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <WarningCircle size={24} weight="fill" />
                </div>
                <div>
                  <h3
                    id="continue-test-modal-title"
                    className="text-lg sm:text-xl font-bold tracking-tight text-foreground"
                  >
                    {dict.continueTestModalTitle || "Continue the test?"}
                  </h3>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {dict.appName || "ShikshaGap"} • {classConfig.label}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleContinueTest}
                aria-label="Close dialog"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <p className="text-sm text-foreground/80 leading-relaxed">
              {dict.continueTestModalPrompt ||
                "Are you sure you want to quit? Your current test progress will be lost if you leave."}
            </p>

            {/* Modal Action Buttons: Touch Friendly, min-h 48px */}
            <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleQuitAssessment}
                data-testid="quit-assessment-btn"
                className="w-full sm:flex-1 min-h-[48px] px-4 py-2.5 rounded-full border border-border bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-foreground text-sm font-bold font-mono transition-all cursor-pointer flex items-center justify-center"
              >
                <span>{dict.quitAssessmentBtn || "Quit assessment"}</span>
              </button>

              <button
                type="button"
                onClick={handleContinueTest}
                data-testid="continue-test-btn"
                className="w-full sm:flex-1 min-h-[48px] px-4 py-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 text-sm font-bold font-mono transition-all cursor-pointer shadow-warm flex items-center justify-center gap-1.5"
              >
                <span>{dict.continueTestBtn || "Continue test"}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
