'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
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

  const [localDismissed, setLocalDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only display consent prompt on user interaction or delayed idle state to preserve LCP
    const show = () => setMounted(true);
    const events = ['scroll', 'pointerdown', 'keydown', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, show, { once: true, passive: true }));
    const idleTimer = setTimeout(show, 10000);
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, show));
      clearTimeout(idleTimer);
    };
  }, []);

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

  // Do not render if not mounted yet, already chosen, pending hydration, or dismissed locally
  if (!mounted || consent !== 'unprompted' || localDismissed) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Cookie and data privacy choices"
      className="fixed bottom-16 sm:bottom-4 inset-x-2 sm:inset-x-auto sm:left-4 sm:max-w-md z-50 bg-card border-2 border-border p-4 shadow-xl text-foreground font-sans transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-1.5 text-sm font-mono uppercase font-bold text-primary">
          <ShieldCheck size={16} className="text-[var(--status-good)]" />
          <span>DPDP 2023 : Privacy Choices</span>
        </div>
        <button
          onClick={() => handleChoice(false)}
          className="text-muted-foreground dark:text-muted-foreground hover:text-primary cursor-pointer p-0.5"
          aria-label="Reject cookies and dismiss"
        >
          <X size={16} />
        </button>
      </div>

      <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed mb-3">
        ShikshaGap uses strictly necessary local storage for diagnostic progress. We never sell student data or track across sites. May we enable anonymous usage analytics to improve classroom tools? Read our{' '}
        <Link
          href="/privacy"
          className="underline font-bold hover:text-primary"
        >
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link
          href="/cookies"
          className="underline font-bold hover:text-primary"
        >
          Cookie Notice
        </Link>.
      </p>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleChoice(true)}
          className="flex-1 min-h-[38px] px-3 border border-[var(--status-good-border)] bg-[var(--status-good)] text-foreground font-mono text-sm uppercase font-bold hover:bg-[#62996C] hover:text-primary-foreground transition-colors cursor-pointer"
        >
          Accept Analytics
        </button>
        <button
          type="button"
          onClick={() => handleChoice(false)}
          className="flex-1 min-h-[38px] px-3 border border-border bg-transparent text-foreground font-mono text-sm uppercase font-bold hover:bg-primary text-primary-foreground hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
        >
          Reject Non-Essential
        </button>
      </div>
    </aside>
  );
}
