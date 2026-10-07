'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Consistent SVG stroke icons (no emojis, no lucide, no sparkles)
const SvgIcons = {
  Empty: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <rect x="3" y="4" width="18" height="16" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="15" x2="16" y2="15" />
    </svg>
  ),
  Error: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DE2A35" strokeWidth="1.5" strokeLinecap="square">
      <polygon points="12 2 22 20 2 20" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2" />
    </svg>
  ),
  Offline: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DFA06E" strokeWidth="1.5" strokeLinecap="square">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 16.05a4.99 4.99 0 0 1 3.58 0" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  ),
  SlowNetwork: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DFA06E" strokeWidth="1.5" strokeLinecap="square">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  ),
  NoSearchResults: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  PermissionDenied: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DE2A35" strokeWidth="1.5" strokeLinecap="square">
      <rect x="5" y="11" width="14" height="10" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  ),
  SessionExpired: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DE2A35" strokeWidth="1.5" strokeLinecap="square">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  Success: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8ABB93" strokeWidth="1.5" strokeLinecap="square">
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
      title: 'No Student Records Found',
      desc: 'No diagnostic assessments have been recorded for this classroom cohort yet.',
      action: 'Create New Assessment'
    },
    hi: {
      title: 'कोई छात्र रिकॉर्ड नहीं मिला',
      desc: 'इस कक्षा समूह के लिए अभी तक कोई नैदानिक मूल्यांकन दर्ज नहीं किया गया है।',
      action: 'नया मूल्यांकन शुरू करें'
    },
    te: {
      title: 'విద్యార్థి రికార్డులు కనుగొనబడలేదు',
      desc: 'ఈ తరగతి కోసం ఇంకా ఎటువంటి రోగనిర్ధారణ మూల్యాంకనాలు నమోదు కాలేదు.',
      action: 'కొత్త మూల్యాంకనాన్ని ప్రారంభించండి'
    }
  }[lang];

  return (
    <div className={`border border-[#432623]/25 dark:border-[#F5F1BC]/25 p-8 text-center bg-[#FAF8E8] dark:bg-[#381f1c] ${className}`}>
      <div className="flex justify-center mb-3 text-[#432623]/60 dark:text-[#F5F1BC]/60">
        <SvgIcons.Empty />
      </div>
      <h3 className="font-serif text-lg font-bold mb-1 text-[#432623] dark:text-[#F5F1BC]">{text.title}</h3>
      <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 max-w-md mx-auto mb-5 leading-relaxed">{text.desc}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="border border-[#432623] dark:border-[#F5F1BC] bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623] px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-[#DE2A35]"
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
      <div className="border border-[#432623]/20 dark:border-[#F5F1BC]/20 p-4 bg-[#FAF8E8] dark:bg-[#381f1c] space-y-3">
        <div className="h-4 bg-[#432623]/10 dark:bg-[#F5F1BC]/10 w-1/3" />
        <div className="h-3 bg-[#432623]/10 dark:bg-[#F5F1BC]/10 w-2/3" />
      </div>
      <div className="border border-[#432623]/20 dark:border-[#F5F1BC]/20 p-4 bg-[#FAF8E8] dark:bg-[#381f1c] space-y-3">
        <div className="h-4 bg-[#432623]/10 dark:bg-[#F5F1BC]/10 w-1/4" />
        <div className="h-8 bg-[#432623]/10 dark:bg-[#F5F1BC]/10 w-full" />
        <div className="h-8 bg-[#432623]/10 dark:bg-[#F5F1BC]/10 w-full" />
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
  referenceId = `ERR-${Date.now().toString(36).toUpperCase()}`,
  errorMessage,
  onRetry, 
  className = '' 
}: ErrorStateProps) {
  const text = {
    en: {
      title: 'Unable to Load Diagnostic Data',
      desc: errorMessage || 'An unexpected server issue occurred during processing.',
      action: 'Retry Request',
      ref: 'Reference ID'
    },
    hi: {
      title: 'डेटा लोड करने में असमर्थ',
      desc: errorMessage || 'प्रसंस्करण के दौरान एक अनपेक्षित सर्वर समस्या उत्पन्न हुई।',
      action: 'पुनः प्रयास करें',
      ref: 'संदर्भ संख्या'
    },
    te: {
      title: 'డేటాను లోడ్ చేయడం సాధ్యం కాలేదు',
      desc: errorMessage || 'ప్రాసెస్ చేస్తున్నప్పుడు ఊహించని సర్వర్ సమస్య ఏర్పడింది.',
      action: 'మళ్లీ ప్రయత్నించండి',
      ref: 'రిఫరెన్స్ ఐడీ'
    }
  }[lang];

  return (
    <div className={`border border-[#DE2A35] p-8 text-center bg-[#DE2A35]/5 ${className}`} role="alert">
      <div className="flex justify-center mb-3">
        <SvgIcons.Error />
      </div>
      <h3 className="font-serif text-lg font-bold mb-1 text-[#DE2A35]">{text.title}</h3>
      <p className="text-xs text-[#432623]/85 dark:text-[#F5F1BC]/85 max-w-md mx-auto mb-3 leading-relaxed">{text.desc}</p>
      <div className="text-[11px] font-mono text-[#432623]/60 dark:text-[#F5F1BC]/60 mb-5">
        {text.ref}: <span className="font-bold select-all">{referenceId}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="border border-[#DE2A35] bg-[#DE2A35] text-[#F5F1BC] px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-[#432623]"
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
    <div className={`border border-[#DFA06E] p-6 text-center bg-[#DFA06E]/10 ${className}`}>
      <div className="flex justify-center mb-2">
        <SvgIcons.Offline />
      </div>
      <h3 className="font-serif text-base font-bold mb-1 text-[#432623] dark:text-[#F5F1BC]">{text.title}</h3>
      <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 max-w-md mx-auto mb-4">{text.desc}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="border border-[#432623]/40 dark:border-[#F5F1BC]/40 px-3 py-1.5 text-xs font-mono uppercase hover:bg-[#FAF8E8] dark:hover:bg-[#432623]"
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
      title: 'Network Response is Slower than Normal',
      desc: 'The diagnostic request is taking longer than 5 seconds. You may keep waiting or cancel the operation.',
      action: 'Cancel Request'
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
    <div className={`border border-[#DFA06E] p-4 bg-[#DFA06E]/10 flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="text-[#DFA06E] shrink-0">
          <SvgIcons.SlowNetwork />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-[#432623] dark:text-[#F5F1BC]">{text.title}</div>
          <div className="text-[11px] text-[#432623]/75 dark:text-[#F5F1BC]/75">{text.desc}</div>
        </div>
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="border border-[#432623]/30 px-3 py-1 text-xs font-mono uppercase shrink-0 hover:bg-[#FAF8E8] dark:hover:bg-[#432623]"
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
      title: 'No Matching Records',
      desc: 'No students or concepts match the active filter criteria.',
      action: 'Clear Search Filters'
    },
    hi: {
      title: 'कोई मेल नहीं मिला',
      desc: 'दिए गए खोज मानदंडों से मेल खाने वाला कोई छात्र या विषय नहीं मिला।',
      action: 'फ़िल्टर हटाएं'
    },
    te: {
      title: 'ఫలితాలు లేవు',
      desc: 'మీరు వెతికిన సమాచారంతో సరిపోలే విద్యార్థులు లేదా అంశాలు లేవు.',
      action: 'ఫిల్టర్‌లను తొలగించండి'
    }
  }[lang];

  return (
    <div className={`border border-[#432623]/25 dark:border-[#F5F1BC]/25 p-8 text-center bg-[#FAF8E8] dark:bg-[#381f1c] ${className}`}>
      <div className="flex justify-center mb-2 text-[#432623]/60 dark:text-[#F5F1BC]/60">
        <SvgIcons.NoSearchResults />
      </div>
      <h3 className="font-serif text-base font-bold mb-1 text-[#432623] dark:text-[#F5F1BC]">{text.title}</h3>
      <p className="text-xs text-[#432623]/75 dark:text-[#F5F1BC]/75 mb-4">{text.desc}</p>
      {onClear && (
        <button
          onClick={onClear}
          className="border border-[#432623] dark:border-[#F5F1BC] px-3.5 py-1.5 text-xs font-mono uppercase hover:bg-[#F5F1BC] dark:hover:bg-[#432623]"
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
    <div className={`border border-[#DE2A35] p-8 text-center bg-[#FAF8E8] dark:bg-[#381f1c] ${className}`} role="alert">
      <div className="flex justify-center mb-2">
        <SvgIcons.PermissionDenied />
      </div>
      <h3 className="font-serif text-base font-bold mb-1 text-[#DE2A35]">{text.title}</h3>
      <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 max-w-md mx-auto mb-5">{text.desc}</p>
      <Link
        href="/app"
        className="border border-[#432623] dark:border-[#F5F1BC] bg-[#432623] text-[#F5F1BC] px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-[#DE2A35]"
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
    <div className={`border border-[#DE2A35] p-8 text-center bg-[#FAF8E8] dark:bg-[#381f1c] ${className}`} role="alert">
      <div className="flex justify-center mb-2">
        <SvgIcons.SessionExpired />
      </div>
      <h3 className="font-serif text-base font-bold mb-1 text-[#DE2A35]">{text.title}</h3>
      <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 max-w-md mx-auto mb-5">{text.desc}</p>
      <Link
        href="/login?redirect=/app"
        className="border border-[#DE2A35] bg-[#DE2A35] text-[#F5F1BC] px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-[#432623]"
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
      title: 'Assessment Processed Successfully',
      desc: message || 'Student diagnostic records and 5-day action plan have been saved.',
      action: 'View Updated Profile'
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
    <div className={`border border-[#8ABB93] p-8 text-center bg-[#8ABB93]/10 ${className}`}>
      <div className="flex justify-center mb-2">
        <SvgIcons.Success />
      </div>
      <h3 className="font-serif text-base font-bold mb-1 text-[#432623] dark:text-[#F5F1BC]">{text.title}</h3>
      <p className="text-xs text-[#432623]/85 dark:text-[#F5F1BC]/85 max-w-md mx-auto mb-4">{text.desc}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="border border-[#432623] dark:border-[#F5F1BC] bg-[#432623] text-[#F5F1BC] px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-[#8ABB93]"
        >
          {text.action}
        </button>
      )}
    </div>
  );
}
