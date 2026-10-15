import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Trophy,
} from 'lucide-react';

export const PracticeModal: React.FC = () => {
  const {
    isPracticeModalOpen,
    practiceQuestions,
    currentPracticeIndex,
    closePracticeModal,
    nextPracticeQuestion,
    finishPractice,
    selectedStudent,
  } = useApp();

  const { language, t } = useLanguage();
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  if (!isPracticeModalOpen) return null;

  const currentQ = practiceQuestions[currentPracticeIndex];
  const langKey = language === 'hi' ? 'hi' : language === 'te' ? 'te' : 'en';

  const handleCheckAnswer = () => {
    if (!currentQ || !selectedAnswer) return;
    const correct = String(selectedAnswer).trim() === String(currentQ.correctAnswer).trim();
    setIsCorrect(correct);
    setHasChecked(true);

    if (correct && currentPracticeIndex === practiceQuestions.length - 1) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  const handleNext = () => {
    if (currentPracticeIndex < practiceQuestions.length - 1) {
      setSelectedAnswer('');
      setHasChecked(false);
      setIsCorrect(false);
      nextPracticeQuestion();
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleFinish = () => {
    finishPractice();
    setIsFinished(false);
    setSelectedAnswer('');
    setHasChecked(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                15-Min Zero-Hour Practice
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white m-0">
                {t('practiceModalTitle')}
              </h2>
            </div>
            {selectedStudent && (
              <p className="text-xs text-emerald-200 m-0 mt-1">
                Student: <strong>{selectedStudent.name}</strong> • Roll #{selectedStudent.rollNumber}
              </p>
            )}
          </div>

          <button
            onClick={closePracticeModal}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {!isFinished && currentQ ? (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {t('practiceQuestion')} {currentPracticeIndex + 1} of {practiceQuestions.length}
                  </span>
                  <span className="font-mono text-emerald-700 font-bold">
                    Target: {currentQ.conceptId}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentPracticeIndex + 1) / practiceQuestions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                <div className="text-base sm:text-lg font-bold text-slate-900">
                  {currentQ.text[langKey] || currentQ.text.en}
                </div>

                {/* Multiple Choice Options */}
                {currentQ.options && currentQ.options.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {currentQ.options.map((opt, idx) => {
                      const optVal = opt.en;
                      const optLabel = opt[langKey] || opt.en;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={hasChecked}
                          onClick={() => setSelectedAnswer(optVal)}
                          className={`p-3 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer flex items-center justify-between ${
                            selectedAnswer === optVal
                              ? hasChecked
                                ? isCorrect
                                  ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                                  : 'bg-rose-50 border-rose-600 text-rose-900 font-bold'
                                : 'bg-emerald-50 border-emerald-600 text-emerald-900'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-100/70'
                          } ${hasChecked ? 'cursor-default' : ''}`}
                        >
                          <span>{optLabel}</span>
                          {selectedAnswer === optVal && hasChecked && (
                            isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="pt-2">
                    <input
                      type="text"
                      disabled={hasChecked}
                      value={selectedAnswer}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      placeholder="Type your answer..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Feedback Alert */}
              {hasChecked && (
                <div
                  className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-150 ${
                    isCorrect
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-bold">
                      {isCorrect ? t('correctAnswerMsg') : t('incorrectAnswerMsg')}
                    </div>
                    {currentQ.explanation && (
                      <div className="text-xs opacity-90">
                        {currentQ.explanation[langKey] || currentQ.explanation.en}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={closePracticeModal}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {!hasChecked ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={!selectedAnswer}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {t('checkAnswer')}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>
                      {currentPracticeIndex === practiceQuestions.length - 1
                        ? t('finishPractice')
                        : t('nextQuestion')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Finished Celebratory Card */
            <div className="text-center py-6 space-y-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Trophy className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 m-0">
                  Targeted Practice Completed!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                  15-minute zero-hour practice successfully targeted the prerequisite gap. Daily repetition ensures permanent concept retention.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium">
                Day 1 Slate Activity Logged • Concept Confidence Improved
              </div>

              <div className="pt-2">
                <button
                  onClick={handleFinish}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  Return to Student Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
