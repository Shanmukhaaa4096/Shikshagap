'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ShieldCheck, X } from '@phosphor-icons/react';

const CONSENT_STORAGE_KEY = 'shikshagap_cookie_consent';

function enableAnalytics() {
  if (typeof window === 'undefined') return;
  if (!(window as unknown as { __shikshagap_analytics_enabled?: boolean }).__shikshagap_analytics_enabled) {
    (window as unknown as { __shikshagap_analytics_enabled?: boolean }).__shikshagap_analytics_enabled = true;
    const script = document.createElement('script');
    script.src = 'https://va.vercel-scripts.com/v1/script.js';
    script.defer = true;
    script.dataset.endpoint = '/_vercel/insights';
    document.head.appendChild(script);
  }
}

function getConsentSnapshot(): string {
  if (typeof window === 'undefined') return 'pending';
  try {
    const val = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (val === 'accepted') {
      enableAnalytics();
      return 'accepted';
    }
    if (val === 'rejected') {
      return 'rejected';
    }
    return 'unprompted';
  } catch {
    return 'rejected';
  }
}

function subscribeToConsent(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function CookieBanner() {
  const consent = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    () => 'pending'
  );

  const [localDismissed, setLocalDismissed] = React.useState(false);

  const handleChoice = (accepted: boolean) => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, accepted ? 'accepted' : 'rejected');
      if (accepted) {
        enableAnalytics();
      }
    } catch {
      // Ignored
    }
    setLocalDismissed(true);
  };

  // Do not render if already chosen, pending hydration, or dismissed locally
  if (consent !== 'unprompted' || localDismissed) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Cookie and data privacy choices"
      className="fixed bottom-16 sm:bottom-4 inset-x-2 sm:inset-x-auto sm:left-4 sm:max-w-md z-50 bg-[#FAF8E8] dark:bg-[#251614] border-2 border-[#432623] dark:border-[#FAF8E8] p-4 shadow-xl text-[#432623] dark:text-[#FAF8E8] font-sans transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-1.5 text-sm font-mono uppercase font-bold text-[#DE2A35]">
          <ShieldCheck size={16} className="text-[#8ABB93]" />
          <span>DPDP 2023 : Privacy Choices</span>
        </div>
        <button
          onClick={() => handleChoice(false)}
          className="text-[#432623]/60 dark:text-[#FAF8E8]/60 hover:text-[#DE2A35] cursor-pointer p-0.5"
          aria-label="Reject cookies and dismiss"
        >
          <X size={16} />
        </button>
      </div>

      <p className="text-sm text-[#432623]/85 dark:text-[#FAF8E8]/85 leading-relaxed mb-3">
        ShikshaGap uses strictly necessary local storage for diagnostic progress. We never sell student data or track across sites. May we enable anonymous usage analytics to improve classroom tools? Read our{' '}
        <Link
          href="/privacy"
          className="underline font-bold hover:text-[#DE2A35]"
        >
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link
          href="/cookies"
          className="underline font-bold hover:text-[#DE2A35]"
        >
          Cookie Notice
        </Link>.
      </p>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleChoice(true)}
          className="flex-1 min-h-[38px] px-3 border border-[#8ABB93] bg-[#8ABB93] text-[#432623] font-mono text-sm uppercase font-bold hover:bg-[#62996C] hover:text-[#FAF8E8] transition-colors cursor-pointer"
        >
          Accept Analytics
        </button>
        <button
          type="button"
          onClick={() => handleChoice(false)}
          className="flex-1 min-h-[38px] px-3 border border-[#432623]/40 dark:border-[#FAF8E8]/40 bg-transparent text-[#432623] dark:text-[#FAF8E8] font-mono text-sm uppercase font-bold hover:bg-[#DE2A35] hover:text-[#FAF8E8] hover:border-[#DE2A35] transition-colors cursor-pointer"
        >
          Reject Non-Essential
        </button>
      </div>
    </aside>
  );
}
