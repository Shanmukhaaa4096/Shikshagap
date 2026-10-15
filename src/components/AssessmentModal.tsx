import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  X,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Brain,
  BookOpen,
} from 'lucide-react';

export const AssessmentModal: React.FC = () => {
  const {
    isAssessmentModalOpen,
    activeSession,
    currentAssessmentQuestion,
    assessmentReasoning,
    submitAssessmentAnswer,
    closeAssessmentModal,
    students,
    selectStudent,
  } = useApp();

  const { language, t } = useLanguage();
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');

  if (!isAssessmentModalOpen || !activeSession) return null;

  const targetStudent = students.find((s) => s.id === activeSession.studentId);
  const langKey = language === 'hi' ? 'hi' : language === 'te' ? 'te' : 'en';

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const answer = currentAssessmentQuestion?.options ? selectedOption : textInput;
    if (!answer || answer.trim() === '') return;

    submitAssessmentAnswer(answer.trim());
    setSelectedOption('');
    setTextInput('');
  };

  const handleFinishAndOpenProfile = () => {
    const studentId = activeSession.studentId;
    closeAssessmentModal();
    selectStudent(studentId);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-800 text-blue-200 text-xs font-mono font-bold">
                Adaptive Agent
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white m-0">
                {t('assessmentTitle')}
              </h2>
            </div>
            {targetStudent && (
              <p className="text-xs text-blue-200 m-0 mt-1">
                Student: <strong>{targetStudent.name}</strong> • Roll #{targetStudent.rollNumber} • Class {targetStudent.grade}{targetStudent.section}
              </p>
            )}
          </div>

          <button
            onClick={closeAssessmentModal}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Active Question View */}
          {!activeSession.isComplete && currentAssessmentQuestion ? (
            <div className="space-y-5">
              {/* Agent Reasoning Box */}
              {assessmentReasoning && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 shadow-xs">
                  <Brain className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-950 block mb-0.5">
                      {t('adaptiveReasoningHeader')}
                    </span>
                    <span className="leading-relaxed">{assessmentReasoning}</span>
                  </div>
                </div>
              )}

              {/* Question Card */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 uppercase tracking-wide">
                    {t('questionNumber')} {activeSession.responses.length + 1}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 rounded text-slate-700 font-mono">
                    Concept: {currentAssessmentQuestion.conceptId}
                  </span>
                </div>

                <div className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                  {currentAssessmentQuestion.text[langKey] || currentAssessmentQuestion.text.en}
                </div>

                {/* Multiple Choice Options */}
                {currentAssessmentQuestion.options && currentAssessmentQuestion.options.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {currentAssessmentQuestion.options.map((opt, idx) => {
                      const optVal = opt.en;
                      const optLabel = opt[langKey] || opt.en;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedOption(optVal)}
                          className={`p-3 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer flex items-center justify-between ${
                            selectedOption === optVal
                              ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-100/70'
                          }`}
                        >
                          <span>{optLabel}</span>
                          {selectedOption === optVal && (
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Short Answer Input */
                  <form onSubmit={handleSubmit} className="pt-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Enter Student's Numerical Answer:
                    </label>
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="e.g. 24"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </form>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Adaptive staircase active • Prerequisite investigation
                </span>
                <button
                  onClick={() => handleSubmit()}
                  disabled={
                    currentAssessmentQuestion.options
                      ? !selectedOption
                      : !textInput.trim()
                  }
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <span>{t('submitAnswer')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Assessment Completed Summary View */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center py-4 bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-emerald-950 m-0">
                  {t('diagnosisComplete')}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800 mt-1 max-w-md mx-auto">
                  The AI diagnostic agent has identified the root prerequisite gap and traced back the concept dependency.
                </p>
              </div>

              {/* Diagnosis Callout */}
              {activeSession.currentDiagnosis && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Root Cause Diagnosed
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                      Severity: {activeSession.currentDiagnosis.severity.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-base font-bold text-slate-900">
                    {activeSession.currentDiagnosis.rootConceptName}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeSession.currentDiagnosis.rootCauseReasoning[langKey] ||
                      activeSession.currentDiagnosis.rootCauseReasoning.en}
                  </p>
                </div>
              )}

              {/* Responses Sequence */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Investigation Evidence Trail ({activeSession.responses.length} questions)
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {activeSession.responses.map((resp, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2.5">
                        {resp.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold text-slate-800">
                            Q{idx + 1}: Concept <span className="font-mono text-slate-600">{resp.conceptId}</span>
                          </div>
                          <div className="text-slate-400">
                            Student Answer: <span className="font-medium text-slate-700">{resp.studentAnswer}</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          resp.isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {resp.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                <button
                  onClick={closeAssessmentModal}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleFinishAndOpenProfile}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{t('viewFullDiagnosis')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
