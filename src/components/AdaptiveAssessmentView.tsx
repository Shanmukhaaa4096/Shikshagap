"use client";

import React, { useState, useEffect } from "react";
import type { ConceptId, Question, Response } from "@/lib/types";
import type { DemoStudentData } from "@/lib/data/demo";
import { useI18n } from "@/lib/i18n/context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Brain, CheckCircle2, XCircle, ArrowRight, Sparkles, RefreshCw, HelpCircle } from "lucide-react";
import { getNextDiagnosticStep, estimateMastery, findRootCauses } from "@/lib/engine/diagnostic";
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
  initialConceptId,
  onAssessmentCompleted,
  onCancel,
}: Props) {
  const { dict, t, formatTxt } = useI18n();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.student.id || "student_1"
  );
  const [targetConceptId, setTargetConceptId] = useState<ConceptId>(
    (initialConceptId as ConceptId) || "long_division"
  );

  // Assessment Runtime State
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [agentReasoning, setAgentReasoning] = useState<string>("");
  const [responses, setResponses] = useState<Response[]>([]);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const activeStudent = students.find((s) => s.student.id === selectedStudentId);

  // Start Assessment
  const handleStart = () => {
    setIsStarted(true);
    setResponses([]);
    setIsFinished(false);
    setFeedback(null);
    setShowHint(false);

    const step = getNextDiagnosticStep(targetConceptId, [], makeRng(Date.now()));
    setCurrentQuestion(step.nextQuestion);
    setAgentReasoning(step.reasoning);
  };

  // Submit Answer
  const handleSubmit = (answerValue: string) => {
    if (!currentQuestion) return;

    const trimmed = answerValue.trim();
    if (!trimmed) return;

    // Check correctness
    const isCorrect = trimmed === String(currentQuestion.answer);

    // Classify error if incorrect
    let classification: any = isCorrect ? "correct" : "unclassified";
    if (!isCorrect && currentQuestion.meta.bugs && currentQuestion.meta.bugs[trimmed]) {
      classification = currentQuestion.meta.bugs[trimmed];
    }

    const newResponse: Response = {
      id: uid("resp"),
      studentId: selectedStudentId,
      questionId: currentQuestion.id,
      conceptId: currentQuestion.conceptId,
      difficulty: currentQuestion.difficulty,
      answer: trimmed,
      correct: isCorrect,
      classification,
      timestamp: new Date().toISOString(),
      timeMs: 4500,
      context: "assessment",
    };

    const nextResponses = [...responses, newResponse];
    setResponses(nextResponses);

    setFeedback({
      isCorrect,
      message: isCorrect
        ? dict.correctFeedback
        : `${dict.incorrectFeedback} (${t(`err_${classification}`) || classification})`,
    });
  };

  // Move to next step
  const handleNextStep = () => {
    setFeedback(null);
    setUserAnswer("");
    setShowHint(false);

    const step = getNextDiagnosticStep(targetConceptId, responses, makeRng(Date.now()));

    if (step.isComplete || !step.nextQuestion) {
      setIsFinished(true);
      setAgentReasoning(step.reasoning);
    } else {
      setCurrentQuestion(step.nextQuestion);
      setAgentReasoning(step.reasoning);
    }
  };

  // Save Results & Return
  const handleSaveAndFinish = () => {
    if (!activeStudent) return;

    // Compute updated mastery for tested concepts
    const updatedConcepts = { ...activeStudent.profile.concepts };
    const evaluatedConcepts = Array.from(new Set(responses.map((r) => r.conceptId)));

    evaluatedConcepts.forEach((cId) => {
      const cResps = responses.filter((r) => r.conceptId === cId);
      updatedConcepts[cId] = estimateMastery(cId, cResps);
    });

    const rootCauses = findRootCauses(responses);

    const updatedProfile = {
      ...activeStudent.profile,
      concepts: updatedConcepts,
      rootCauses: rootCauses.length > 0 ? rootCauses : activeStudent.profile.rootCauses,
      status: rootCauses.some((r) => r.severity === "high")
        ? ("critical" as const)
        : rootCauses.length > 0
        ? ("need_practice" as const)
        : ("on_track" as const),
      lastAssessedAt: new Date().toISOString(),
    };

    onAssessmentCompleted({
      ...activeStudent,
      profile: updatedProfile,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {dict.assessmentTitle}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {dict.adaptiveSubtitle}
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-sm">
          {dict.backToDashboard}
        </Button>
      </div>

      {!isStarted ? (
        /* Configuration Screen */
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Configure Diagnostic Session</CardTitle>
            <CardDescription className="text-xs">
              Select student and target curriculum concept to evaluate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Student
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border rounded-lg h-10 px-3 text-sm font-medium"
              >
                {students.map((s) => (
                  <option key={s.student.id} value={s.student.id}>
                    {s.student.name} (Roll #{s.student.rollNo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Target Concept (Grade 5 Math)
              </label>
              <select
                value={targetConceptId}
                onChange={(e) => setTargetConceptId(e.target.value as ConceptId)}
                className="w-full bg-white dark:bg-zinc-900 border rounded-lg h-10 px-3 text-sm font-medium"
              >
                <option value="long_division">Long Division with Remainder</option>
                <option value="division_facts">Division Facts (Inverse Multiplication)</option>
                <option value="multi_digit_mult">Multi-digit Multiplication</option>
                <option value="fraction_addition">Fraction Addition</option>
                <option value="comparing_fractions">Comparing Fractions</option>
                <option value="subtraction">Subtraction with Regrouping</option>
              </select>
            </div>

            <Button
              onClick={handleStart}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl shadow-xs gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Begin Adaptive Assessment
            </Button>
          </CardContent>
        </Card>
      ) : isFinished ? (
        /* Completion Screen */
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {dict.assessmentComplete}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Answered {responses.length} diagnostic items. AI synthesized conceptual root cause.
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900 border rounded-xl p-4 text-left max-w-lg mx-auto space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Agent Diagnostic Conclusion:
            </div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
              {agentReasoning}
            </p>
          </div>

          <Button
            onClick={handleSaveAndFinish}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 h-10 rounded-xl shadow-xs"
          >
            {dict.viewReport}
          </Button>
        </Card>
      ) : (
        /* Active Question Display */
        <div className="space-y-4">
          {/* Agent Live Reasoning Pill */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-3.5 flex items-start gap-3 text-xs">
            <div className="p-1.5 bg-blue-600 text-white rounded-md mt-0.5 shadow-2xs">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-blue-900 dark:text-blue-300">
                {dict.agentThinking}:
              </span>{" "}
              <span className="text-blue-800 dark:text-blue-200">{agentReasoning}</span>
            </div>
          </div>

          {currentQuestion && (
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b bg-zinc-50 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {dict.questionLabel} #{responses.length + 1}
                    </Badge>
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Concept: {t(`c_${currentQuestion.conceptId}`)}
                    </span>
                  </div>
                  <Badge className="bg-zinc-800 text-white text-[11px]">
                    Difficulty Level {currentQuestion.difficulty}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Prompt */}
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

                {/* Question Options or Text Input */}
                {!feedback && (
                  <div className="space-y-4 pt-2">
                    {currentQuestion.options && currentQuestion.options.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentQuestion.options.map((opt) => (
                          <Button
                            key={opt.id}
                            variant="outline"
                            onClick={() => handleSubmit(opt.value)}
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
                          className="h-11 font-mono text-base"
                        />
                        <Button
                          onClick={() => handleSubmit(userAnswer)}
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

                {/* Instant Feedback Banner */}
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
                      className="bg-zinc-900 text-white hover:bg-black font-semibold h-9 px-4 text-xs shrink-0"
                    >
                      {dict.nextQuestion}
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
