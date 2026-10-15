import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Settings,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

const API_KEY_STORAGE = 'shiksha_gemini_api_key';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setSettingsOpen, resetToDemoData } = useApp();

  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE) || '');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');

  if (!isSettingsOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem(API_KEY_STORAGE, apiKey.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleClear = () => {
    localStorage.removeItem(API_KEY_STORAGE);
    setApiKey('');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleResetDemo = () => {
    if (window.confirm('Reset all classroom students to original demo benchmark data?')) {
      resetToDemoData();
      setSettingsOpen(false);
    }
  };

  const hasKey = apiKey.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-800 flex items-center justify-center text-white">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white m-0">
                AI Diagnostics & System Settings
              </h2>
              <p className="text-xs text-slate-300 m-0 mt-0.5">
                Configure Gemini API, fallback mode, and demo data
              </p>
            </div>
          </div>

          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 text-sm">
          {/* Status Indicator */}
          <div className="p-3.5 rounded-xl border flex items-center justify-between gap-3 bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  hasKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <div>
                <div className="font-semibold text-slate-900 text-xs">
                  {hasKey ? 'Gemini AI Agent Mode (Active)' : '100% Offline Rule Engine (Active)'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {hasKey
                    ? 'Live generative pedagogical explanations enabled'
                    : 'Deterministic graph backtracking (zero API key needed)'}
                </div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                hasKey
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {hasKey ? 'Live LLM' : 'Offline'}
            </span>
          </div>

          {/* API Key Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Gemini API Key (Optional)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Stored purely in your browser's local storage. Never logged or sent to any central server.
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                AI Reasoning Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Ultra-fast)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy)</option>
              </select>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Save Key
              </button>
              {hasKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Clear Key
                </button>
              )}
              {isSaved && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Settings saved!
                </span>
              )}
            </div>
          </form>

          {/* Privacy & Safety Note */}
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
              <span>DPDP Act 2023 & Student Privacy Standard</span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-900/80 m-0">
              ShikshaGap strictly strips all child Personally Identifiable Information (PII) before any diagnostic inference. The system relies strictly on concept dependency math and anonymous response IDs.
            </p>
          </div>

          {/* Reset Demo Data Button */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-slate-800">Classroom Demo Benchmarks</div>
              <div className="text-[11px] text-slate-500">Restore Class 5A (36 students) to initial baseline</div>
            </div>
            <button
              onClick={handleResetDemo}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
