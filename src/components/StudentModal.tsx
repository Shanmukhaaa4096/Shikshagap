import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  X,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ListOrdered,
} from 'lucide-react';

export const StudentModal: React.FC = () => {
  const {
    selectedStudent,
    selectStudent,
    openPracticeModal,
    openReassessmentModal,
    startAssessment,
  } = useApp();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'remediation' | 'history'>('diagnosis');

  if (!selectedStudent) return null;

  const diagnosis = selectedStudent.activeDiagnosis;
  const plan = selectedStudent.remediationPlan;

  const langKey = language === 'hi' ? 'hi' : language === 'te' ? 'te' : 'en';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-800/80 text-blue-200 text-xs font-mono font-bold">
                Roll #{selectedStudent.rollNumber}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white m-0">
                {selectedStudent.name}
              </h2>
              {selectedStudent.id === 'stud_ravi' && (
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold text-xs">
                  Primary Demo Case
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 m-0 mt-1">
              Class {selectedStudent.grade}{selectedStudent.section} • Overall Math Mastery: {selectedStudent.overallMastery}% • Attendance: {selectedStudent.attendanceRate}%
            </p>
          </div>

          <button
            onClick={() => selectStudent(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-sm font-medium">
          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`py-3 px-4 border-b-2 font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'diagnosis'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Root Cause Diagnosis
          </button>
          <button
            onClick={() => setActiveTab('remediation')}
            className={`py-3 px-4 border-b-2 font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'remediation'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            5-Day Action Plan
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 border-b-2 font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Concept Mastery History
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {activeTab === 'diagnosis' && (
            <div className="space-y-5">
              {diagnosis ? (
                <>
                  {/* Diagnosis Card: Symptom vs Root Cause */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Observed Surface Symptom
                      </div>
                      <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        {diagnosis.targetConceptName}
                      </div>
                      <p className="text-xs text-slate-600 mt-2 m-0">
                        Test score showed struggle in grade-level division problems.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/80">
                      <div className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-1">
                        Diagnosed Root Cause (Prerequisite Gap)
                      </div>
                      <div className="text-lg font-bold text-rose-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                        {diagnosis.rootConceptName}
                      </div>
                      <p className="text-xs text-rose-800 font-medium mt-2 m-0">
                        Confidence: {diagnosis.confidencePercentage}% • Severity: {diagnosis.severity.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* AI & Diagnostic Rationale */}
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                    <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
                      <Sparkles className="w-4 h-4 text-blue-700" />
                      Prerequisite Tracing Rationale
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 m-0 leading-relaxed">
                      {diagnosis.rootCauseReasoning[langKey] || diagnosis.rootCauseReasoning.en}
                    </p>
                  </div>

                  {/* Evidence Points */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Assessment Evidence Points
                    </h4>
                    <ul className="space-y-1.5 m-0 pl-0 list-none">
                      {diagnosis.evidencePoints.map((point, i) => (
                        <li key={i} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800">Student is currently on track!</p>
                  <p className="text-xs">No active prerequisite learning barriers identified.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'remediation' && (
            <div className="space-y-4">
              {plan ? (
                <>
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-xl">
                    <div>
                      <div className="text-xs font-bold text-amber-800 uppercase">5-Day Zero-Hour Intervention</div>
                      <div className="text-sm font-semibold text-amber-950">
                        {plan.estimatedDailyMinutes} mins/day targeted on {plan.rootCauseName}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                      Active Plan
                    </span>
                  </div>

                  <div className="space-y-3">
                    {plan.days.map((day) => (
                      <div key={day.day} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 hover:bg-white transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                              {day.day}
                            </span>
                            {day.title[langKey] || day.title.en}
                          </div>
                          <span className="text-xs text-slate-500 font-mono">
                            {day.durationMinutes} mins
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 m-0">
                          {day.description[langKey] || day.description.en}
                        </p>
                        <div className="mt-2 text-xs bg-white p-2 rounded border border-slate-200 text-slate-700">
                          <span className="font-semibold text-slate-900">Sample Activity: </span>
                          {day.sampleProblem[langKey] || day.sampleProblem.en}
                        </div>
                      </div>
                    ))}
                  </div>

                  {plan.teacherNotes && (
                    <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900">
                      <span className="font-bold">Teacher Coaching Note: </span>
                      {plan.teacherNotes}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800">No active remediation plan needed.</p>
                  <p className="text-xs">Student has demonstrated satisfactory mastery.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Subject Concept Mastery Map
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {Object.values(selectedStudent.conceptMasteryMap).map((item) => (
                  <div key={item.conceptId} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{item.conceptName}</div>
                      <div className="text-xs text-slate-400">
                        {item.questionsCorrect} of {item.questionsAttempted} correct • Confidence {item.confidenceScore}%
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-slate-800">{item.masteryScore}%</div>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          item.status === 'mastered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'developing'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.status === 'mastered'
                          ? 'Mastered'
                          : item.status === 'developing'
                          ? 'Developing'
                          : 'Needs Support'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            DPDP Act 2023 Compliant • Anonymous Diagnostic Engine
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const id = selectedStudent.id;
                selectStudent(null);
                startAssessment(id);
              }}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Run Diagnostic</span>
            </button>
            <button
              onClick={() => openPracticeModal(selectedStudent.id)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              15-Min Zero-Hour Practice
            </button>
            <button
              onClick={() => openReassessmentModal(selectedStudent.id)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Re-Assess Student</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
