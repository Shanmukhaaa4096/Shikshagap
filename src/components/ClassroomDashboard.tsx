import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useApp } from '../context/AppContext';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  Search,
  Sparkles,
  ClipboardList,
  Layers,
} from 'lucide-react';

export const ClassroomDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { students, classroomOverview, selectStudent, startAssessment } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical_gap' | 'need_practice' | 'on_track'>('all');

  // Filter students based on category and search, prioritized by gap severity
  const filteredStudents = students
    .filter((s) => {
      if (selectedFilter !== 'all' && s.statusCategory !== selectedFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchRoll = String(s.rollNumber).includes(q);
        const matchGap = s.activeDiagnosis?.rootConceptName.toLowerCase().includes(q) || false;
        return matchName || matchRoll || matchGap;
      }
      return true;
    })
    .sort((a, b) => {
      const priorityWeight = { critical_gap: 3, need_practice: 2, on_track: 1 };
      return priorityWeight[b.statusCategory] - priorityWeight[a.statusCategory];
    });

  return (
    <div className="space-y-6">
      {/* Prime Question Callout for Government School Teacher */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-800/80 text-blue-200 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Teacher Action Center
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white m-0">
              {t('coreTeacherQuestion')}
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 m-0">
              Transforming raw test scores into concept-level root causes and instant 15-minute interventions.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => startAssessment('stud_ravi')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              <span>{t('takeAssessment')} (Ravi Demo)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Class Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 leading-none">
              {classroomOverview.totalStudents}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">
              {t('totalStudents')}
            </div>
          </div>
        </div>

        {/* On Track */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-emerald-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-700 leading-none">
              {classroomOverview.onTrackCount}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">
              {t('onTrack')}
            </div>
          </div>
        </div>

        {/* Need Practice */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-amber-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-700 leading-none">
              {classroomOverview.needPracticeCount}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">
              {t('needPractice')}
            </div>
          </div>
        </div>

        {/* Critical Gaps */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-rose-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-rose-700 leading-none">
              {classroomOverview.criticalGapsCount}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">
              {t('criticalGaps')}
            </div>
          </div>
        </div>
      </div>

      {/* Most Common Learning Gaps Summary (Prompt Section 7) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900 m-0">
            {t('mostCommonGapsTitle')}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {classroomOverview.mostCommonGaps.map((gap, idx) => (
            <div
              key={gap.conceptId}
              className={`rounded-xl p-4 border transition-all ${
                idx === 0
                  ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                  : idx === 1
                  ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                  : 'bg-blue-50/50 border-blue-200 text-blue-950'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white shadow-2xs">
                  #{idx + 1} Most Prevalent
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    gap.severity === 'high'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {gap.severity === 'high' ? t('highSeverity') : t('mediumSeverity')}
                </span>
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-900">
                {gap.conceptName}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Affecting <span className="font-bold text-slate-900">{gap.affectedStudentsCount} students</span> ({gap.percentageOfClass}% of class)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prioritized Intervention Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 m-0">
              {t('prioritizedInterventionsTitle')}
            </h3>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              {t('prioritizedSubtitle')}
            </p>
          </div>

          {/* Filter Pills & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('searchStudents')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none w-48 sm:w-56"
              />
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({students.length})
              </button>
              <button
                onClick={() => setSelectedFilter('critical_gap')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedFilter === 'critical_gap'
                    ? 'bg-rose-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                Critical ({classroomOverview.criticalGapsCount})
              </button>
              <button
                onClick={() => setSelectedFilter('need_practice')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedFilter === 'need_practice'
                    ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                Practice ({classroomOverview.needPracticeCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table / Card List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-12 text-center">{t('rollNumber')}</th>
                <th className="py-3 px-4">{t('studentName')}</th>
                <th className="py-3 px-4">{t('observedSymptom')}</th>
                <th className="py-3 px-4">{t('rootCauseGap')}</th>
                <th className="py-3 px-4">{t('recommendedAction')}</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.slice(0, 15).map((student) => {
                const isCritical = student.statusCategory === 'critical_gap';
                const isPractice = student.statusCategory === 'need_practice';

                const rootName =
                  student.activeDiagnosis?.rootConceptName ||
                  (student.overallMastery >= 75
                    ? 'None (Grade Level)'
                    : 'Multiplication Facts');

                const symptomText =
                  student.activeDiagnosis?.targetConceptName || 'Division & Sharing';

                const recommendedActionText =
                  student.statusCategory === 'critical_gap'
                    ? '15 min targeted root practice'
                    : student.statusCategory === 'need_practice'
                    ? 'Guided word problems'
                    : 'Maintain regular curriculum';

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      student.id === 'stud_ravi' ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-mono font-medium text-slate-500">
                      {student.rollNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {student.name}
                        </span>
                        {student.id === 'stud_ravi' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            Demo Case
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>Mastery: {student.overallMastery}%</span>
                        <span>•</span>
                        <span>Att: {student.attendanceRate}%</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium">{symptomText}</div>
                      <div className="text-[11px] text-slate-400">
                        Observed test struggle
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isCritical
                              ? 'bg-rose-500'
                              : isPractice
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span
                          className={`font-semibold ${
                            isCritical
                              ? 'text-rose-700'
                              : isPractice
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {rootName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isCritical
                          ? 'Critical prerequisite barrier'
                          : isPractice
                          ? 'Developing prerequisite'
                          : 'On track'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div className="text-xs font-medium text-slate-800">
                        {recommendedActionText}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => selectStudent(student.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                        >
                          <span>{t('actionButton')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length > 15 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
            Showing top 15 of {filteredStudents.length} students in Class 5A. Use search above to find others.
          </div>
        )}
      </div>
    </div>
  );
};
