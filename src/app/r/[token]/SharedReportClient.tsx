'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  LockKeyOpen,
  Sparkle,
  WhatsappLogo,
  Copy,
  Check,
  Printer,
  StopCircle,
  TrendUp,
  WarningCircle,
} from '@phosphor-icons/react';

interface Props {
  token: string;
  firstName?: string;
  classNum?: number | string;
  expiresAt: number | string;
  skillsUnlocked?: Array<{ id: string; name: string }>;
  skillsSleeping?: Array<{ id: string; name: string; prereqRoot?: string }>;
  prescribedPlan?: Array<{ step: number; title: string; desc: string }>;
  reportData?: {
    skillsUnlocked?: Array<{ id: string; name: string }>;
    skillsSleeping?: Array<{ id: string; name: string; prereqRoot?: string }>;
    prescribedPlan?: Array<{ step: number; title: string; desc: string }>;
    [key: string]: unknown;
  };
  revoked?: boolean;
}

export default function SharedReportClient({
  token,
  firstName,
  classNum = 4,
  expiresAt,
  skillsUnlocked: rawUnlocked = [],
  skillsSleeping: rawSleeping = [],
  prescribedPlan: rawPlan = [],
  reportData,
  revoked = false,
}: Props) {
  const skillsUnlocked = rawUnlocked.length > 0 ? rawUnlocked : (reportData?.skillsUnlocked || []);
  const skillsSleeping = rawSleeping.length > 0 ? rawSleeping : (reportData?.skillsSleeping || []);
  const prescribedPlan = rawPlan.length > 0 ? rawPlan : (reportData?.prescribedPlan || []);

  const [lang, setLang] = useState<'en' | 'hi' | 'te'>('en');
  const [copied, setCopied] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isRevoked, setIsRevoked] = useState(revoked);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  // Formatted expiry date string
  const expiryDate = new Date(expiresAt).toLocaleDateString();

  // Strict first-name isolation: strictly first word only
  const cleanFirstName = (firstName || 'Learner').trim().split(/\s+/)[0] || 'Learner';

  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://shikshagap.vercel.app/r/${token}`;

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleStopSharing = async () => {
    if (!confirm('Are you sure you want to stop sharing this report? Once revoked, this link will no longer be accessible.')) {
      return;
    }

    setIsRevoking(true);
    setRevokeError(null);

    try {
      const res = await fetch(`/api/reports/share?token=${encodeURIComponent(token)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to stop sharing report');
      }

      setIsRevoked(true);
    } catch (err: unknown) {
      setRevokeError(err instanceof Error ? err.message : 'Could not stop sharing. Please try again.');
    } finally {
      setIsRevoking(false);
    }
  };

  // Safe fallback arrays
  const unlocked = skillsUnlocked.length > 0
    ? skillsUnlocked
    : [
        { id: 'u1', name: 'Single & Multi-Digit Addition' },
        { id: 'u2', name: 'Place Value Identification' },
      ];

  const sleeping = skillsSleeping.length > 0
    ? skillsSleeping
    : [
        {
          id: 's1',
          name: 'Multiplication by Grouping',
          prereqRoot: 'Skip Counting by 2s and 5s (Class 2)',
        },
        {
          id: 's2',
          name: 'Subtraction with Regrouping / Borrowing',
          prereqRoot: 'Tens & Ones Place Value Decomposition (Class 3)',
        },
      ];

  const plan = prescribedPlan.length > 0
    ? prescribedPlan
    : [
        {
          step: 1,
          title: 'Awaken the Root Skill',
          desc: 'Spend 5-10 minutes with physical counters, sticks or drawings on the prerequisite skill.',
        },
        {
          step: 2,
          title: 'Connect to Grade-Level Math',
          desc: 'Solve 2-3 guided examples linking the foundation to the current grade lesson.',
        },
        {
          step: 3,
          title: 'Quick Retest & Celebrate Growth',
          desc: 'Take a gentle 3-question check on ShikshaGap to see confidence and understanding bloom.',
        },
      ];

  // Trilingual dictionary
  const strings = {
    en: {
      badge: 'STUDENT LEARNING GAP REPORT',
      privacyBadge: 'Private 14-Day Family Link',
      title: `${cleanFirstName}'s Mathematics Learning Progress`,
      expiryNotice: `This private link is valid for 14 days (expires ${expiryDate}). No surname, phone number, or school name is stored.`,
      classLabel: `Class ${classNum}`,
      unlockedTitle: 'Skills Unlocked',
      unlockedSub: 'Concepts understood well and used with confidence!',
      sleepingTitle: 'Skills Still Sleeping',
      sleepingSub: 'Gentle practice will awaken these skills step by step!',
      prereqLabel: 'Awaken first by reviewing',
      planTitle: 'Prescribed 3-Step Practice Plan',
      shareWhatsApp: 'Share on WhatsApp',
      copyLink: 'Copy Link',
      linkCopied: 'Link Copied!',
      stopSharing: 'Stop Sharing',
      stopping: 'Stopping...',
      revokedNotice: 'This shared report link has been deactivated. The report is no longer publicly viewable.',
      noPiiNotice: 'ShikshaGap Data Privacy: Zero personal student data or school records are exposed.',
      emptyUnlocked: 'Practice questions are currently mapping unlocked concepts.',
      emptySleeping: 'All core foundational skills are currently awake and solid!',
      defaultStep1: 'Daily 10-minute number games with coins, sticks or counters.',
      defaultStep2: 'Bridge to written maths with drawing and visual groupings.',
      defaultStep3: 'Celebrate small wins and repeat a gentle 3-question check after 5 days.',
      whatsAppText: `Here is ${cleanFirstName}'s Class ${classNum} Maths Learning Progress Report on ShikshaGap: ${shareUrl}\nSee unlocked skills and gentle next steps to practice at home!`,
      printReport: 'Print / Save as PDF',
      shareBoxTitle: 'Share or Save Report',
      shareBoxSub: 'Send to parents or teachers for home practice',
      privacyTitle: 'Privacy Guarantee',
      privacyDesc: 'Only the student’s first name, grade, and skill indicators are shown. Valid for 14 days.',
    },
    hi: {
      badge: 'छात्र शिक्षण अंतराल रिपोर्ट',
      privacyBadge: 'निजी 14-दिवसीय परिवार लिंक',
      title: `${cleanFirstName} की गणित सीखने की प्रगति`,
      expiryNotice: `यह निजी लिंक 14 दिनों के लिए वैध है (${expiryDate} को समाप्त)। कोई उपनाम या स्कूल का नाम संग्रहीत नहीं है।`,
      classLabel: `कक्षा ${classNum}`,
      unlockedTitle: 'अनलॉक किए गए कौशल',
      unlockedSub: 'ये अवधारणाएं अच्छी तरह समझी गई हैं और आत्मविश्वास से उपयोग की जाती हैं!',
      sleepingTitle: 'कौशल जो अभी सोए हुए हैं',
      sleepingSub: 'सहज अभ्यास से ये कौशल कदम-दर-कदम जाग उठेंगे!',
      prereqLabel: 'पहले इसका अभ्यास करें',
      planTitle: 'सुझाया गया 3-चरणीय अभ्यास प्लान',
      shareWhatsApp: 'व्हाट्सएप पर शेयर करें',
      copyLink: 'लिंक कॉपी करें',
      linkCopied: 'लिंक कॉपी हो गया!',
      stopSharing: 'शेयरिंग बंद करें',
      stopping: 'बंद किया जा रहा है...',
      revokedNotice: 'यह साझा रिपोर्ट लिंक निष्क्रिय कर दिया गया है। यह अब उपलब्ध नहीं है।',
      noPiiNotice: 'शिक्षगैप डेटा गोपनीयता: कोई व्यक्तिगत छात्र डेटा या संपर्क जानकारी उजागर नहीं है।',
      emptyUnlocked: 'अभ्यास प्रश्न वर्तमान में अनलॉक की गई अवधारणाओं को मैप कर रहे हैं।',
      emptySleeping: 'सभी मुख्य बुनियादी कौशल वर्तमान में सक्रिय और मजबूत हैं!',
      defaultStep1: 'रोजाना 10 मिनट संख्या खेल (माचिस की तीलियों या सिक्कों के साथ)।',
      defaultStep2: 'चित्रों और दैनिक जीवन के उदाहरणों के साथ लिखित गणित को जोड़ें।',
      defaultStep3: '5 दिनों के अभ्यास के बाद प्रगति देखें और आत्मविश्वास बढ़ाएं।',
      whatsAppText: `यहाँ शिक्षगैप पर ${cleanFirstName} की कक्षा ${classNum} गणित सीखने की रिपोर्ट है: ${shareUrl}\nअनलॉक किए गए कौशल और घर पर अभ्यास के आसान चरण देखें!`,
      printReport: 'प्रिंट रिपोर्ट',
      shareBoxTitle: 'रिपोर्ट शेयर या सेव करें',
      shareBoxSub: 'घर पर अभ्यास के लिए माता-पिता या शिक्षक को भेजें',
      privacyTitle: 'डेटा सुरक्षा गारंटी',
      privacyDesc: 'केवल पहला नाम, कक्षा और कौशल दिखाए गए हैं। 14 दिनों तक वैध।',
    },
    te: {
      badge: 'విద్యార్థి అభ్యసన లోపాల నివేదిక',
      privacyBadge: 'వ్యక్తిగత 14 రోజుల కుటుంబ లింక్',
      title: `${cleanFirstName} యొక్క గణిత అభ్యసన పురోగతి`,
      expiryNotice: `ఈ ప్రైవేట్ లింక్ 14 రోజులు చెల్లుబాటు అవుతుంది (${expiryDate}న ముగుస్తుంది). ఇంటిపేరు లేదా పాఠశాల వివరాలు నిల్వ చేయబడవు.`,
      classLabel: `${classNum}వ తరగతి`,
      unlockedTitle: 'అన్‌లాక్ అయిన నైపుణ్యాలు',
      unlockedSub: 'బాగా అర్థం చేసుకుని ఆత్మవిశ్వాసంతో సాధించిన భావనలు!',
      sleepingTitle: 'ఇంకా నిద్రిస్తున్న నైపుణ్యాలు',
      sleepingSub: 'సులభమైన సాధనతో ఈ నైపుణ్యాలు మేల్కొంటాయి!',
      prereqLabel: 'ముందుగా సాధన చేయవలసిన పునాది',
      planTitle: 'సూచించిన 3-దశల సాధన ప్రణాళిక',
      shareWhatsApp: 'వాట్సాప్‌లో షేర్ చేయండి',
      copyLink: 'లింక్ కాపీ చేయండి',
      linkCopied: 'లింక్ కాపీ చేయబడింది!',
      stopSharing: 'షేరింగ్ ఆపండి',
      stopping: 'ఆపుతోంది...',
      revokedNotice: 'ఈ నివేదిక లింక్ నిష్క్రియం చేయబడింది. ఇది ఇకపై అందుబాటులో ఉండదు.',
      noPiiNotice: 'శిక్షాగ్యాప్ డేటా భద్రత: విద్యార్థి వ్యక్తిగత సమాచారం ఏదీ బయటకు వెల్లడించబడదు.',
      emptyUnlocked: 'ప్రస్తుతం నైపుణ్యాలు విశ్లేషించబడుతున్నాయి.',
      emptySleeping: 'అన్ని ప్రాథమిక గణిత నైపుణ్యాలు ప్రస్తుతం బలంగా ఉన్నాయి!',
      defaultStep1: 'రోజూ 10 నిమిషాల సంఖ్యా ఆటలు (చీపురుపుల్లలు లేదా నాణేలతో).',
      defaultStep2: 'పునాది వారధి: వస్తువుల సహాయంతో రాతపూర్వక గణితాన్ని అర్థం చేసుకోవడం.',
      defaultStep3: 'ప్రశాంత పునఃపరిశీలన: 5 రోజుల సాధన తర్వాత సాధించిన పురోగతిని గుర్తించడం.',
      whatsAppText: `ఇక్కడ శిక్షాగ్యాప్‌లో ${cleanFirstName} యొక్క ${classNum}వ తరగతి గణిత అభ్యసన నివేదిక ఉంది: ${shareUrl}\nఇంట్లో సాధన చేయడానికి అన్‌లాక్ అయిన నైపుణ్యాలు మరియు సులభమైన తదుపరి దశలను చూడండి!`,
      printReport: 'ప్రింట్ రిపోర్ట్',
      shareBoxTitle: 'నివేదికను షేర్ లేదా సేవ్ చేయండి',
      shareBoxSub: 'ఇంట్లో సాధన కోసం తల్లిదండ్రులకు పంపండి',
      privacyTitle: 'డేటా గోప్యతా హామీ',
      privacyDesc: 'కేవలం మొదటి పేరు, తరగతి మరియు నైపుణ్యాలు మాత్రమే ప్రదర్శించబడతాయి. 14 రోజులు చెల్లుబాటు.',
    },
  };

  const t = strings[lang];
  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(t.whatsAppText)}`;

  if (isRevoked) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-[24px] p-6 sm:p-8 text-center space-y-4 shadow-warm">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
            <StopCircle className="w-6 h-6" weight="fill" />
          </div>
          <h1 className="text-xl font-bold font-serif text-foreground">
            {lang === 'hi' ? 'रिपोर्ट लिंक निष्क्रिय कर दिया गया है' : lang === 'te' ? 'నివేదిక లింక్ నిష్క్రియం చేయబడింది' : 'Sharing Stopped'}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.revokedNotice}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-28 lg:pb-12 overflow-x-hidden">
      <div className="w-full max-w-[1200px] mx-auto space-y-6">
        {/* Top Control Bar: Class, 14-Day Expiry & Trilingual Selector */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-muted border border-border text-foreground">
              {t.classLabel}
            </span>
            <span className="text-xs font-mono font-medium text-muted-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{expiryDate}</span>
            </span>
            <span className="text-xs font-mono text-[var(--status-good)] hidden sm:flex items-center gap-1 font-bold px-2.5 py-1 rounded-full bg-[var(--status-good-bg)] border border-[var(--status-good-border)]">
              <ShieldCheck className="w-3.5 h-3.5" weight="bold" />
              <span>{t.privacyBadge}</span>
            </span>
          </div>

          {/* Trilingual Language Selector with 44px min touch targets */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full border border-border self-end sm:self-auto">
            {(['en', 'hi', 'te'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`min-h-[44px] px-3.5 text-xs font-bold font-mono rounded-full transition-all cursor-pointer flex items-center justify-center ${
                  lang === l
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={lang === l}
                aria-label={`Switch language to ${l === 'en' ? 'English' : l === 'hi' ? 'Hindi' : 'Telugu'}`}
              >
                {l === 'en' ? 'English' : l === 'hi' ? 'हिंदी' : 'తెలుగు'}
              </button>
            ))}
          </div>
        </header>

        {/* ============================================================== */}
        {/* RESPONSIVE LAYOUT ENGINE:                                       */}
        {/* Mobile (< 768px): Single column, short cards, sticky bottom bar */}
        {/* Desktop (>= 1024px): 2-Column Grid (Summary/Skills Left, Plan/Share Right) */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ============================================================ */}
          {/* LEFT COLUMN: Report Details, Unlocked & Sleeping Skills     */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Header / Intro Card */}
            <article className="neo-panel bg-card border border-border rounded-[24px] p-5 sm:p-7 space-y-4 shadow-warm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-primary">
                    {t.badge}
                  </span>
                  <span className="text-muted-foreground text-xs">•</span>
                  <span className="text-xs font-mono text-[var(--status-good)] flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" weight="bold" />
                    <span>{t.privacyBadge}</span>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-foreground tracking-tight">
                  {t.title}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t.expiryNotice}
                </p>
              </div>

              {revokeError && (
                <div className="p-3.5 rounded-[16px] bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-xs text-red-900 dark:text-red-200">
                  {revokeError}
                </div>
              )}
            </article>

            {/* Gap Results: 1. Skills Unlocked & 2. Skills Still Sleeping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* 1. Skills Unlocked Card */}
              <section
                aria-labelledby="skills-unlocked-heading"
                className="p-5 sm:p-6 rounded-[22px] bg-card border border-[var(--status-good-border)] space-y-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--status-good-bg)] text-[var(--status-good)] flex items-center justify-center shrink-0 border border-[var(--status-good-border)]">
                    <LockKeyOpen className="w-5 h-5" weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <h2 id="skills-unlocked-heading" className="text-base sm:text-lg font-bold text-foreground">
                      {t.unlockedTitle}
                    </h2>
                    <p className="text-xs text-muted-foreground truncate">{t.unlockedSub}</p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  {unlocked.length > 0 ? (
                    unlocked.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-[16px] bg-[var(--status-good-bg)]/40 border border-[var(--status-good-border)]/70 flex items-center gap-3 text-xs sm:text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--status-good)] shrink-0" />
                        <span className="break-words">{item.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic p-3">
                      {t.emptyUnlocked}
                    </p>
                  )}
                </div>
              </section>

              {/* 2. Skills Still Sleeping Card */}
              <section
                aria-labelledby="skills-sleeping-heading"
                className="p-5 sm:p-6 rounded-[22px] bg-card border border-amber-300 dark:border-amber-800/60 space-y-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700">
                    <Sparkle className="w-5 h-5" weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <h2 id="skills-sleeping-heading" className="text-base sm:text-lg font-bold text-foreground">
                      {t.sleepingTitle}
                    </h2>
                    <p className="text-xs text-muted-foreground truncate">{t.sleepingSub}</p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  {sleeping.length > 0 ? (
                    sleeping.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-[16px] bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-1.5 transition-transform hover:-translate-y-0.5"
                      >
                        <div className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="break-words">{item.name}</span>
                        </div>
                        {item.prereqRoot && (
                          <div className="text-xs text-muted-foreground pl-4 flex flex-wrap items-center gap-1.5">
                            <span className="font-mono font-bold text-amber-800 dark:text-amber-300">
                              {t.prereqLabel}:
                            </span>
                            <span className="font-semibold text-foreground break-words">
                              {item.prereqRoot}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic p-3">
                      {t.emptySleeping}
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* Print & Privacy Footer Note on Desktop */}
            <footer className="p-5 rounded-[20px] bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-center sm:text-left">
                <WarningCircle className="w-4 h-4 text-primary shrink-0" />
                <span>{t.noPiiNotice}</span>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[44px] px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-foreground text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>{t.printReport}</span>
              </button>
            </footer>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: Actions (Desktop) & Next-Steps Practice Plan  */}
          {/* ============================================================ */}
          <aside className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-6 self-start">
            {/* Desktop Action & Sharing Card (hidden on small mobile since sticky bottom bar is used) */}
            <div className="hidden lg:block p-6 rounded-[24px] bg-card border border-border space-y-4 shadow-warm">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Sparkle className="w-4 h-4 text-primary" weight="fill" />
                <h2 className="text-sm font-bold font-mono uppercase text-foreground">
                  {t.shareBoxTitle}
                </h2>
              </div>

              <div className="space-y-3">
                {/* Readonly URL + Copy Button */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="bg-muted/50 border border-border text-xs font-mono px-3 py-2.5 rounded-[14px] flex-1 min-w-0 text-foreground select-all outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="min-h-[44px] px-3.5 py-2 rounded-[14px] bg-card border border-border hover:bg-muted font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 text-foreground transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" weight="bold" />
                        <span className="text-emerald-600 font-bold">{t.linkCopied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>{t.copyLink}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Primary WhatsApp Action */}
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[48px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-full flex items-center justify-center gap-2.5 shadow-sm transition-all"
                >
                  <WhatsappLogo className="w-5 h-5" weight="fill" />
                  <span>{t.shareWhatsApp}</span>
                </a>

                {/* Stop Sharing Button */}
                <button
                  type="button"
                  onClick={handleStopSharing}
                  disabled={isRevoking}
                  className="w-full min-h-[44px] px-4 py-2 text-xs font-mono text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-full flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>{isRevoking ? t.stopping : t.stopSharing}</span>
                </button>
              </div>
            </div>

            {/* Prescribed Next-Steps Growth Plan Card */}
            <div className="p-5 sm:p-6 rounded-[24px] bg-card border border-border space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <TrendUp className="w-4 h-4 text-primary" weight="bold" />
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  {t.planTitle}
                </h2>
              </div>

              <div className="space-y-3">
                {plan.length > 0 ? (
                  plan.map((step, idx) => (
                    <div
                      key={step.step || idx}
                      className="p-4 rounded-[16px] bg-[var(--surface)] border border-border space-y-1 transition-transform hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-primary uppercase">
                          Step {step.step || idx + 1}
                        </span>
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-foreground">
                        {step.title}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-3.5 rounded-[16px] bg-[var(--surface)] border border-border space-y-1">
                      <span className="text-xs font-mono font-bold text-primary">Step 1</span>
                      <p className="text-xs text-foreground font-medium leading-normal">{t.defaultStep1}</p>
                    </div>
                    <div className="p-3.5 rounded-[16px] bg-[var(--surface)] border border-border space-y-1">
                      <span className="text-xs font-mono font-bold text-primary">Step 2</span>
                      <p className="text-xs text-foreground font-medium leading-normal">{t.defaultStep2}</p>
                    </div>
                    <div className="p-3.5 rounded-[16px] bg-[var(--surface)] border border-border space-y-1">
                      <span className="text-xs font-mono font-bold text-primary">Step 3</span>
                      <p className="text-xs text-foreground font-medium leading-normal">{t.defaultStep3}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Privacy Guarantee Card */}
            <div className="p-5 rounded-[22px] bg-muted/40 border border-border space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <ShieldCheck className="w-4 h-4 text-[var(--status-good)]" weight="bold" />
                <span>{t.privacyTitle}</span>
              </div>
              <p className="leading-relaxed">
                {t.privacyDesc}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MOBILE STICKY BOTTOM ACTION BAR (< 1024px / lg:hidden)          */}
      {/* Ensures large touch targets (min 44px) without horizontal scroll */}
      {/* ============================================================== */}
      <nav
        aria-label="Mobile quick actions"
        className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-background/95 backdrop-blur-md border-t border-border shadow-lg flex items-center justify-between gap-2 lg:hidden"
      >
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <WhatsappLogo className="w-4 h-4" weight="fill" />
          <span>{t.shareWhatsApp}</span>
        </a>

        <button
          type="button"
          onClick={handleCopyLink}
          className="min-h-[44px] px-3.5 py-2 rounded-full bg-card border border-border hover:bg-muted font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" weight="bold" />
              <span className="text-emerald-600 font-bold">{t.linkCopied}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>{t.copyLink}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleStopSharing}
          disabled={isRevoking}
          className="min-h-[44px] px-3 py-2 text-xs font-mono text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-full flex items-center justify-center gap-1 cursor-pointer transition-colors shrink-0"
          title={t.stopSharing}
        >
          <StopCircle className="w-4 h-4" />
          <span className="hidden sm:inline">{isRevoking ? t.stopping : t.stopSharing}</span>
        </button>
      </nav>
    </main>
  );
}
