'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type GappuState =
  | 'idle'
  | 'hover'
  | 'clicked'
  | 'listening'
  | 'thinking'
  | 'answering'
  | 'success'
  | 'error'
  | 'sleepy'
  | 'waking';

interface GappuContextType {
  state: GappuState;
  setState: (state: GappuState) => void;
  triggerReaction: (reaction?: 'hop' | 'wave' | 'spin' | 'confetti') => void;
  wakeUp: () => void;
  tipMessage: string | null;
  setTipMessage: (tip: string | null) => void;
}

const GappuContext = createContext<GappuContextType | null>(null);

export function useGappu() {
  const context = useContext(GappuContext);
  if (!context) {
    // Return a self-contained fallback state when used outside GappuProvider
    return {
      state: 'idle' as GappuState,
      setState: () => {},
      triggerReaction: () => {},
      wakeUp: () => {},
      tipMessage: null,
      setTipMessage: () => {},
    };
  }
  return context;
}

export function GappuProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<GappuState>('idle');
  const [tipMessage, setTipMessage] = useState<string | null>(null);
  const stateRef = useRef<GappuState>(state);
  stateRef.current = state;

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wakeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setState = useCallback((nextState: GappuState) => {
    setStateRaw(nextState);
  }, []);

  const wakeUp = useCallback(() => {
    if (stateRef.current === 'sleepy') {
      setStateRaw('waking');
      if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
      wakeTimerRef.current = setTimeout(() => {
        setStateRaw('idle');
      }, 1200);
    }
  }, []);

  const triggerReaction = useCallback((reaction?: 'hop' | 'wave' | 'spin' | 'confetti') => {
    if (reaction === 'spin') {
      setStateRaw('clicked');
    } else {
      setStateRaw('clicked');
    }
    setTimeout(() => {
      setStateRaw('idle');
    }, 1500);
  }, []);

  // Sleepy Timer: 45s of user inactivity triggers sleepy mode
  const resetInactivityTimer = useCallback(() => {
    if (stateRef.current === 'sleepy') {
      wakeUp();
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // Only schedule sleep if we are in idle state
    inactivityTimerRef.current = setTimeout(() => {
      if (stateRef.current === 'idle') {
        setStateRaw('sleepy');
      }
    }, 45000);
  }, [wakeUp]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      } else {
        resetInactivityTimer();
      }
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    resetInactivityTimer();

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
    };
  }, [resetInactivityTimer]);

  return React.createElement(
    GappuContext.Provider,
    {
      value: {
        state,
        setState,
        triggerReaction,
        wakeUp,
        tipMessage,
        setTipMessage,
      },
    },
    children
  );
}
