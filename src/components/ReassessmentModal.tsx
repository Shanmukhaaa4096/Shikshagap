import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import confetti from 'canvas-confetti';
import {
  X,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Award,
} from 'lucide-react';

export const ReassessmentModal: React.FC = () => {
  const {
    isReassessmentModalOpen,
    reassessingStudent,
    closeReassessmentModal,
    applyReassessmentProgress,
  } = useApp();

  const { t } = useLanguage();
  const [hasApplied, setHasApplied] = useState<boolean>(false);

  if (!isReassessmentModalOpen || !reassessingStudent) return null;

  const handleApply = () => {
    applyReassessmentProgress();
    setHasApplied(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleClose = () => {
    closeReassessmentModal();
    setHasApplied(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-800 text-blue-200 text-xs font-bold uppercase tracking-wider">
                Progress Verification
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white m-0">
                {t('reassessmentTitle')}
              </h2>
            </div>
            <p className="text-xs text-blue-200 m-0 mt-1">
              Student: <strong>{reassessingStudent.name}</strong> • Roll #{reassessingStudent.rollNumber} • Class {reassessingStudent.grade}{reassessingStudent.section}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6">
          <div className="text-xs sm:text-sm text-slate-600">
            {t('reassessmentSubtitle')}
          </div>

          {/* Before vs After Comparison Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Before Card */}
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  {t('beforeIntervention')}
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 text-[10px] font-bold">
                  Critical Gap
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-xs text-slate-500">Multiplication Fluency (Root)</div>
                  <div className="text-lg font-bold text-rose-900">38%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Division Concepts (Symptom)</div>
                  <div className="text-lg font-bold text-rose-900">38%</div>
                </div>
                <div className="pt-1 border-t border-rose-200/80">
                  <div className="text-xs text-slate-500">Overall Mastery</div>
                  <div className="text-xl font-extrabold text-slate-900">42%</div>
                </div>
              </div>
            </div>

            {/* After Card */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  {t('afterIntervention')}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                  Recovered!
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-xs text-slate-500">Multiplication Fluency (Root)</div>
                  <div className="text-lg font-bold text-emerald-700 flex items-center gap-1">
                    <span>78%</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Division Concepts (Symptom)</div>
                  <div className="text-lg font-bold text-emerald-700 flex items-center gap-1">
                    <span>71%</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <div className="pt-1 border-t border-emerald-200/80">
                  <div className="text-xs text-slate-500">Overall Mastery</div>
                  <div className="text-xl font-extrabold text-emerald-700">76%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Summary Badge */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-950">
                  {t('growthAchieved')}
                </div>
                <div className="text-xs text-emerald-800">
                  Targeted prerequisite remediation unblocked division barrier.
                </div>
              </div>
            </div>
          </div>

          {hasApplied && (
            <div className="p-3 bg-emerald-100/70 text-emerald-900 text-xs rounded-lg border border-emerald-300 flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{t('progressSaved')}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={handleClose}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            {!hasApplied ? (
              <button
                onClick={handleApply}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Confirm & Apply Growth</span>
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                View Updated Classroom
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
