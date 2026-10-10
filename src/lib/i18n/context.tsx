"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Lang, Txt } from "@/lib/types";
import { DICTS, type Dict } from "@/lib/i18n/dict";

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  dict: Dict;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatTxt: (txt?: Txt) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("shikshagap_lang") as Lang | null;
        if (saved === "en" || saved === "hi" || saved === "te") {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return "en";
  });

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  }, [lang]);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    try {
      localStorage.setItem("shikshagap_lang", newLang);
      document.documentElement.lang = newLang;
    } catch {
      // ignore
    }
  };

  const currentDict = DICTS[lang] || DICTS.en;

  const t = (key: string, params?: Record<string, string | number>): string => {
    let str = (currentDict as unknown as Record<string, string>)[key] || (DICTS.en as unknown as Record<string, string>)[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  };

  const formatTxt = (txt?: Txt): string => {
    if (!txt) return "";
    if ("raw" in txt) return txt.raw;
    return t(txt.key, txt.params);
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, dict: currentDict, t, formatTxt }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within a LanguageProvider");
  }
  return ctx;
}
