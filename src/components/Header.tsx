import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useApp } from '../context/AppContext';
import type { Language } from '../types';
import { GraduationCap, Globe, RotateCcw, PlayCircle, Settings, School } from 'lucide-react';

export const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { resetToDemoData, setDemoTourOpen, setSettingsOpen } = useApp();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner: Indian Govt School Context & Demo Badge */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <School className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium text-white">{t('schoolName')}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">{t('academicYear')}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {t('demoDataBadge')}
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-300 text-[11px] hidden sm:inline">{t('badgeGovtSchool')}</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 m-0 leading-none">
                {t('appName')}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                AI Agent
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal m-0 mt-0.5">
              {t('appTagline')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* 2-Min Demo Walkthrough Guide Button */}
          <button
            onClick={() => setDemoTourOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs transition-colors cursor-pointer"
          >
            <PlayCircle className="w-4 h-4 text-slate-950" />
            <span>{t('guidedDemoTour')}</span>
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={resetToDemoData}
            title="Reset classroom to fresh demo state"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{t('resetDemoData')}</span>
          </button>

          {/* Language Switcher */}
          <div className="inline-flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 border border-slate-200">
            <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            {(['en', 'hi', 'te'] as Language[]).map((lng) => (
              <button
                key={lng}
                onClick={() => setLanguage(lng)}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  language === lng
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lng === 'en' ? 'English' : lng === 'hi' ? 'हिन्दी' : 'తెలుగు'}
              </button>
            ))}
          </div>

          {/* Settings / API Key */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="AI Settings & API key"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
