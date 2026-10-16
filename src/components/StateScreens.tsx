'use client';

import Link from 'next/link';

// Consistent SVG stroke icons
const SvgIcons = {
  Empty: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="15" x2="16" y2="15" />
    </svg>
  ),
  Error: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--destructive)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 20 2 20" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2" />
    </svg>
  ),
  Offline: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--status-warn)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 16.05a4.99 4.99 0 0 1 3.58 0" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  ),
  SlowNetwork: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--status-warn)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  ),
  NoSearchResults: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  PermissionDenied: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--destructive)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  ),
  SessionExpired: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--destructive)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  Success: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--status-good)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="8 12 11 15 16 9" />
    </svg>
  )
};

export type LanguageCode = 'en' | 'hi' | 'te';

interface BaseStateProps {
  lang?: LanguageCode;
  onAction?: () => void;
  onRetry?: () => void;
  className?: string;
}

// 1. EMPTY STATE
export function EmptyState({ lang = 'en', onAction, className = '' }: BaseStateProps) {
  const text = {
    en: {
      title: 'No Students Added Yet',
      desc: 'No students added yet. Add a student to start checking their learning.',
      action: 'Add Student'
    },
    hi: {
      title: 'अभी कोई छात्र नहीं जोड़ा गया',
      desc: 'अभी कोई छात्र नहीं है। सीखने की जांच शुरू करने के लिए छात्र जोड़ें।',
      action: 'छात्र जोड़ें'
    },
    te: {
      title: 'ఇంకా విద్యార్థులు చేర్చబడలేదు',
      desc: 'ఇంకా ఎవరూ లేరు. పరిశీలన ప్రారంభించడానికి విద్యార్థిని జోడించండి.',
      action: 'విద్యార్థిని జోడించండి'
    }
  }[lang];

  return (
    <div className={`rounded-[28px] border-2 border-[#C7DDAE] p-8 text-center bg-[#FFF7E6] dark:bg-[#1C2817] shadow-card ${className}`}>
      <div className="flex justify-center mb-3 text-muted-foreground">
        <SvgIcons.Empty />
      </div>
      <h3 className="font-heading text-xl font-bold mb-1 text-foreground">{text.title}</h3>
      <p className="text-xs sm:text-sm text-foreground/80 max-w-md mx-auto mb-5 leading-relaxed font-sans">{text.desc}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-xs font-sans uppercase font-bold hover:bg-primary/90 min-h-[44px] cursor-pointer shadow-warm transition-transform active:scale-95"
        >
          {text.action}
        </button>
      )}
    </div>
  );
}

// 2. LOADING STATE (SKELETONS)
export function LoadingSkeletonState({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`} aria-label="Loading content" role="status">
      <div className="rounded-[20px] border border-[#C7DDAE] p-5 bg-[#FFF7E6] dark:bg-[#1C2817] space-y-3">
        <div className="h-4 bg-[#C7DDAE]/40 rounded-full w-1/3 animate-pulse" />
        <div className="h-3 bg-[#C7DDAE]/30 rounded-full w-2/3 animate-pulse" />
      </div>
      <div className="rounded-[20px] border border-[#C7DDAE] p-5 bg-[#FFF7E6] dark:bg-[#1C2817] space-y-3">
        <div className="h-4 bg-[#C7DDAE]/40 rounded-full w-1/4 animate-pulse" />
        <div className="h-8 bg-[#C7DDAE]/20 rounded-[14px] w-full animate-pulse" />
        <div className="h-8 bg-[#C7DDAE]/20 rounded-[14px] w-full animate-pulse" />
      </div>
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
}

// 3. ERROR STATE
interface ErrorStateProps extends BaseStateProps {
  referenceId?: string;
  errorMessage?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  lang = 'en', 
  referenceId = 'ERR-DIAG',
  errorMessage,
  onRetry, 
  className = '' 
}: ErrorStateProps) {
  const text = {
    en: {
      title: "We couldn't load this report",
      desc: errorMessage || 'Please try again.',
      action: 'Try Again',
      ref: 'Reference ID'
    },
    hi: {
      title: 'हम इस रिपोर्ट को लोड नहीं कर सके',
      desc: errorMessage || 'कृपया पुनः प्रयास करें।',
      action: 'पुनः प्रयास करें',
      ref: 'संदर्भ संख्या'
    },
    te: {
      title: 'మేము ఈ నివేదికను లోడ్ చేయలేకపోయాము',
      desc: errorMessage || 'దయచేసి మళ్లీ ప్రయత్నించండి.',
      action: 'మళ్లీ ప్రయత్నించండి',
      ref: 'రిఫరెన్స్ ఐడీ'
    }
  }[lang];

  return (
    <div className={`rounded-[28px] border-2 border-accent/40 p-8 text-center bg-[#FFF7E6] dark:bg-[#1C2817] shadow-card ${className}`} role="alert">
      <div className="flex justify-center mb-3">
        <SvgIcons.Error />
      </div>
      <h3 className="font-heading text-xl font-bold mb-1 text-accent">{text.title}</h3>
      <p className="text-xs sm:text-sm text-foreground/80 max-w-md mx-auto mb-3 leading-relaxed font-sans">{text.desc}</p>
      <div className="text-xs font-mono text-muted-foreground mb-5">
        {text.ref}: <span className="font-bold select-all">{referenceId}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-full bg-accent text-accent-foreground px-6 py-2.5 text-xs font-sans uppercase font-bold hover:bg-accent/90 min-h-[44px] cursor-pointer shadow-warm transition-transform active:scale-95"
        >
          {text.action}
        </button>
      )}
    </div>
  );
}

// 4. NO INTERNET / OFFLINE DETECTOR
export function OfflineState({ lang = 'en', onRetry, className = '' }: BaseStateProps) {
  const text = {
    en: {
      title: 'No Internet Connection Detected',
      desc: 'Cached records remain visible. The application will reconnect automatically once network service returns.',
      action: 'Check Connection'
    },
    hi: {
      title: 'इंटरनेट कनेक्शन नहीं मिला',
      desc: 'कैश किया गया डेटा दिखाई दे रहा है। नेटवर्क सेवा उपलब्ध होने पर सिस्टम स्वतः पुनः कनेक्ट होगा।',
      action: 'कनेक्शन जांचें'
    },
    te: {
      title: 'ఇంటర్నెట్ కనెక్షన్ లేదు',
      desc: 'మునుపటి రికార్డులు కనిపిస్తున్నాయి. నెట్వర్క్ రాగానే సిస్టమ్ స్వయంచాలకంగా కనెక్ట్ అవుతుంది.',
      action: 'కనెక్షన్ తనిఖీ చేయండి'
    }
  }[lang];

  return (
    <div className={`rounded-[24px] border border-[var(--status-warn-border)] p-6 text-center bg-[var(--status-warn)]/10 shadow-warm ${className}`}>
      <div className="flex justify-center mb-2">
        <SvgIcons.Offline />
      </div>
      <h3 className="font-heading text-base font-bold mb-1 text-foreground">{text.title}</h3>
      <p className="text-xs sm:text-sm text-foreground/80 max-w-md mx-auto mb-4 font-sans">{text.desc}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-full border border-[#C7DDAE] px-4 py-2 text-xs font-sans uppercase font-bold hover:bg-[#C7DDAE]/30"
        >
          {text.action}
        </button>
      )}
    </div>
  );
}

// 5. SLOW NETWORK WARNING
export function SlowNetworkState({ lang = 'en', onCancel, className = '' }: { lang?: LanguageCode; onCancel?: () => void; className?: string }) {
  const text = {
    en: {
      title: 'Loading is Taking Longer Than Normal',
      desc: 'This is taking longer than 5 seconds. You can keep waiting or cancel.',
      action: 'Cancel'
    },
    hi: {
      title: 'नेटवर्क प्रतिक्रिया धीमी है',
      desc: 'अनुरोध 5 सेकंड से अधिक समय ले रहा है। आप प्रतीक्षा जारी रख सकते हैं या रद्द कर सकते हैं।',
      action: 'अनुरोध रद्द करें'
    },
    te: {
      title: 'నెట్‌వర్క్ నెమ్మదిగా ఉంది',
      desc: 'అభ్యర్థన 5 సెకన్ల కంటే ఎక్కువ సమయం తీసుకుంటోంది. మీరు వేచి ఉండవచ్చు లేదా రద్దు చేయవచ్చు.',
      action: 'అభ్యర్థనను రద్దు చేయండి'
    }
  }[lang];

  return (
    <div className={`rounded-[20px] border border-[var(--status-warn-border)] p-4 bg-[var(--status-warn)]/10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs ${className}`}>
      <div className="flex items-center gap-3">
        <div className="text-foreground shrink-0">
          <SvgIcons.SlowNetwork />
        </div>
        <div className="text-left font-sans">
          <div className="text-xs sm:text-sm font-bold text-foreground">{text.title}</div>
          <div className="text-xs text-muted-foreground">{text.desc}</div>
        </div>
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="rounded-full border border-[#C7DDAE] px-4 py-1.5 text-xs font-sans uppercase shrink-0 hover:bg-[#C7DDAE]/30 cursor-pointer font-bold"
        >
          {text.action}
        </button>
      )}
    </div>
  );
}

// 6. NO SEARCH RESULTS
export function NoSearchResultsState({ lang = 'en', onClear, className = '' }: { lang?: LanguageCode; onClear?: () => void; className?: string }) {
  const text = {
    en: {
      title: 'No Students Found',
      desc: 'No students match this search. Try another name.',
      action: 'Clear Search'
    },
    hi: {
      title: 'कोई छात्र नहीं मिला',
      desc: 'इस खोज से कोई छात्र मेल नहीं खाता। दूसरा नाम खोजें।',
      action: 'खोज साफ़ करें'
    },
    te: {
      title: 'విద్యార్థులు ఎవరూ లేరు',
      desc: 'ఈ శోధనతో ఏ విద్యార్థి సరిపోలలేదు. మరొక పేరును ప్రయత్నించండి.',
      action: 'శోధన తొలగించండి'
    }
  }[lang];

  return (
    <div className={`rounded-[24px] border border-[#C7DDAE] p-8 text-center bg-[#FFF7E6] dark:bg-[#1C2817] shadow-card ${className}`}>
      <div className="flex justify-center mb-2 text-muted-foreground">
        <SvgIcons.NoSearchResults />
      </div>
      <h3 className="font-heading text-lg font-bold mb-1 text-foreground">{text.title}</h3>
      <p className="text-xs sm:text-sm text-foreground/80 mb-4 font-sans">{text.desc}</p>
      {onClear && (
        <button
          onClick={onClear}
          className="rounded-full border border-[#C7DDAE] px-5 py-2 text-xs font-sans uppercase font-bold hover:bg-[#C7DDAE]/30 min-h-[44px] cursor-pointer shadow-xs"
        >
          {text.action}
        </button>
      )}
    </div>
  );
}

// 7. PERMISSION DENIED
export function PermissionDeniedState({ lang = 'en', requiredRole = 'School Administrator', className = '' }: { lang?: LanguageCode; requiredRole?: string; className?: string }) {
  const text = {
    en: {
      title: 'Authorization Required',
      desc: `This section requires ${requiredRole} credentials. Your account is restricted to classroom teacher records.`,
      action: 'Return to Authorized Dashboard'
    },
    hi: {
      title: 'अनुमति आवश्यक',
      desc: `इस खंड के लिए ${requiredRole} अनुमतियों की आवश्यकता है। आपका खाता कक्षा शिक्षक रिकॉर्ड तक सीमित है।`,
      action: 'डैशबोर्ड पर वापस जाएं'
    },
    te: {
      title: 'అనుమతి అవసరం',
      desc: `ఈ విభాగానికి ${requiredRole} అనుమతులు అవసరం. మీ ఖాతా తరగతి ఉపాధ్యాయ రికార్డులకు మాత్రమే పరిమితం చేయబడింది.`,
      action: 'డాష్‌బోర్డ్‌కు తిరిగి వెళ్లండి'
    }
  }[lang];

  return (
    <div className={`rounded-[28px] border-2 border-accent/40 p-8 text-center bg-[#FFF7E6] dark:bg-[#1C2817] shadow-card ${className}`} role="alert">
      <div className="flex justify-center mb-2">
        <SvgIcons.PermissionDenied />
      </div>
      <h3 className="font-heading text-xl font-bold mb-1 text-accent">{text.title}</h3>
      <p className="text-xs sm:text-sm text-foreground/80 max-w-md mx-auto mb-5 font-sans leading-relaxed">{text.desc}</p>
      <Link
        href="/app"
        className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-xs font-sans uppercase font-bold hover:bg-primary/90 shadow-warm inline-block"
      >
        {text.action}
      </Link>
    </div>
  );
}

// 8. SESSION EXPIRED
export function SessionExpiredState({ lang = 'en', className = '' }: BaseStateProps) {
  const text = {
    en: {
      title: 'Institutional Session Expired',
      desc: 'Your security token has expired. In-progress drafts have been preserved locally.',
      action: 'Re-authenticate with School Password'
    },
    hi: {
      title: 'सत्र समाप्त हो गया',
      desc: 'सुरक्षा टोकन समाप्त हो गया है। प्रगति पर मौजूद ड्राफ्ट स्थानीय रूप से सुरक्षित हैं।',
      action: 'पुनः लॉगिन करें'
    },
    te: {
      title: 'సెషన్ ముగిసింది',
      desc: 'భద్రతా టోకెన్ గడువు ముగిసింది. మీ ముసాయిదాలు సురక్షితంగా ఉన్నాయి.',
      action: 'మళ్లీ లాగిన్ అవ్వండి'
    }
  }[lang];

  return (
    <div className={`rounded-[28px] border-2 border-accent/40 p-8 text-center bg-[#FFF7E6] dark:bg-[#1C2817] shadow-card ${className}`} role="alert">
      <div className="flex justify-center mb-2">
        <SvgIcons.SessionExpired />
      </div>
      <h3 className="font-heading text-xl font-bold mb-1 text-accent">{text.title}</h3>
      <p className="text-xs sm:text-sm text-foreground/80 max-w-md mx-auto mb-5 font-sans leading-relaxed">{text.desc}</p>
      <Link
        href="/login?redirect=/app"
        className="rounded-full bg-accent text-accent-foreground px-6 py-2.5 text-xs font-sans uppercase font-bold hover:bg-accent/90 shadow-warm inline-block"
      >
        {text.action}
      </Link>
    </div>
  );
}

// 9. SUCCESS STATE
export function SuccessState({ lang = 'en', message, onAction, className = '' }: { lang?: LanguageCode; message?: string; onAction?: () => void; className?: string }) {
  const text = {
    en: {
      title: 'Test Saved Successfully',
      desc: message || 'Student answers and 5-day practice plan have been saved.',
      action: 'See Updated Profile'
    },
    hi: {
      title: 'मूल्यांकन सफलतापूर्वक सहेजा गया',
      desc: message || 'छात्र रिकॉर्ड और 5-दिवसीय योजना अद्यतित कर दी गई है।',
      action: 'प्रोफ़ाइल देखें'
    },
    te: {
      title: 'మూల్యాంకనం విజయవంతంగా పూర్తయింది',
      desc: message || 'విద్యార్థి రికార్డు మరియు 5 రోజుల కార్యాచరణ ప్రణాళిక భద్రపరచబడ్డాయి.',
      action: 'ప్రొఫైల్ చూడండి'
    }
  }[lang];

  return (
    <div className={`rounded-[28px] border-2 border-[#6CA24A]/40 p-8 text-center bg-[#C7DDAE]/20 shadow-card ${className}`}>
      <div className="flex justify-center mb-2">
        <SvgIcons.Success />
      </div>
      <h3 className="font-heading text-xl font-bold mb-1 text-foreground">{text.title}</h3>
      <p className="text-xs sm:text-sm text-foreground/80 max-w-md mx-auto mb-4 font-sans leading-relaxed">{text.desc}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-xs font-sans uppercase font-bold hover:bg-primary/90 shadow-warm"
        >
          {text.action}
        </button>
      )}
    </div>
  );
}
