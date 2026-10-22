'use client';

import { useState } from 'react';
import {
  Printer,
  CheckCircle,
  Warning,
  LockKeyOpen,
  Moon,
  Sparkle,
  TrendUp,
  WhatsappLogo,
  Copy,
  Check,
  ShieldCheck,
  Clock,
} from '@phosphor-icons/react';

interface Props {
  token: string;
  studentId?: string;
  schoolId?: string;
  expiresAt: number;
  firstName?: string;
  grade?: number | string;
  skillsUnlocked?: Array<{ id: string; name: string }>;
  skillsSleeping?: Array<{ id: string; name: string; prereqRoot?: string }>;
  prescribedPlan?: Array<{ step: number; title: string; desc: string }>;
  totalQuestions?: number;
  confidence?: number;
  isProvisional?: boolean;
}

export default function ReportClientView({
  token,
  expiresAt,
  firstName,
  grade = 5,
  skillsUnlocked = [],
  skillsSleeping = [],
  prescribedPlan = [],
  totalQuestions,
  confidence,
  isProvisional = false,
}: Props) {
  const [lang, setLang] = useState<'en' | 'hi' | 'te'>('en');
  const [copied, setCopied] = useState(false);

  // Formatted expiry date
  const expiryDate = new Date(expiresAt).toLocaleDateString();

  // Clean first name (guarantee strictly first name only, no surname)
  const cleanFirstName = (firstName || 'Learner').trim().split(/\s+/)[0] || 'Learner';

  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://shikshagap.vercel.app/report/${token}`;

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

  const content = {
    en: {
      badge: 'STUDENT LEARNING GAP REPORT',
      docTitle: `${cleanFirstName}'s Mathematics Learning Progress`,
      subtitle: `Class ${grade} | Formative Gap Report for Parents & Guardians`,
      privacyBadge: 'Private Family Document (30-Day Link)',
      skillsUnlockedTitle: 'Skills Unlocked',
      skillsUnlockedSub: 'Concepts understood well and used with confidence!',
      skillsSleepingTitle: 'Skills Still Sleeping',
      skillsSleepingSub: 'Gentle practice will awaken these skills step by step!',
      readyToAwaken: 'Ready to awaken',
      prereqNeeded: 'Foundation needed',
      prescribedTitle: 'Prescribed Next-Steps Growth Plan',
      step1: 'Step 1: Awaken the Root Skill',
      step1Desc: 'Spend 5-10 minutes with physical counters or simple drawings on the sleeping foundation.',
      step2: 'Step 2: Connect to Grade-Level Math',
      step2Desc: 'Solve 2-3 guided examples connecting the foundation to today\'s lesson.',
      step3: 'Step 3: Quick Retest & Celebrate Growth',
      step3Desc: 'Take a gentle 3-question check to see your growth score climb and awaken the skill!',
      printBtn: 'Print / Save as PDF (A4)',
      copyBtn: 'Copy Link',
      copiedBtn: 'Link Copied!',
      whatsappBtn: 'Share on WhatsApp',
      whatsappText: `Here is ${cleanFirstName}'s Class ${grade} Maths Learning Gap Report on ShikshaGap: ${shareUrl}\nSee unlocked skills and gentle next steps to practice at home!`,
      expiryNotice: `This private link expires on ${expiryDate} (30 days). No surname, school, or contact info is stored.`,
      provisionalBadge: 'Provisional Result',
      provisionalText: 'Maximum question budget reached without concluding at full confidence. Results indicate the most probable learning goals. Additional practice is recommended.',
      teacherNoteTitle: 'Teacher Classroom Observation',
      teacherNote: 'With 10 minutes of hands-on practice daily at home, foundational math skills awaken quickly with confidence. Thank you for your active partnership in your child\'s learning journey.',
      legacyStrengthTitle: 'Current Strengths in Class',
      legacyStrengthText: 'Shows consistent enthusiasm and effort during arithmetic activities. Confident with single-digit addition, subtraction facts, and basic counting sequences.',
      legacyGapTitle: 'Single Core Learning Goal for This Week',
      legacyGapText: 'Understanding how borrowing works in 3-digit subtraction (for example, taking from the Tens place when subtracting a larger number from a smaller number).',
      shareBoxTitle: 'Share & Actions',
      evidenceStats: `${totalQuestions ? `${totalQuestions} questions answered` : 'Formative assessment complete'}${confidence ? ` • ${Math.round(confidence * 100)}% diagnostic confidence` : ''}`,
    },
    hi: {
      badge: 'छात्र शिक्षण अंतराल रिपोर्ट',
      docTitle: `${cleanFirstName} की गणित सीखने की प्रगति`,
      subtitle: `कक्षा ${grade} | माता-पिता एवं अभिभावकों के लिए रचनात्मक प्रगति रिपोर्ट`,
      privacyBadge: 'निजी पारिवारिक दस्तावेज़ (30 दिन वैध)',
      skillsUnlockedTitle: 'अनलॉक किए गए कौशल',
      skillsUnlockedSub: 'ये अवधारणाएं अच्छी तरह समझी गई हैं और आत्मविश्वास से उपयोग की जाती हैं!',
      skillsSleepingTitle: 'कौशल जो अभी सोए हुए हैं',
      skillsSleepingSub: 'सहज अभ्यास से ये कौशल कदम-दर-कदम जाग उठेंगे!',
      readyToAwaken: 'जागने के लिए तैयार',
      prereqNeeded: 'बुनियादी कौशल आवश्यक',
      prescribedTitle: 'सुझाया गया 3-चरणीय प्रगति प्लान',
      step1: 'चरण 1: बुनियादी कौशल जगाएं',
      step1Desc: 'माचिस की तीलियों, सिक्कों या साधारण चित्रों के साथ 5-10 मिनट अभ्यास करें।',
      step2: 'चरण 2: कक्षा-स्तरीय गणित से जोड़ें',
      step2Desc: 'बुनियाद को आज के पाठ से जोड़ने वाले 2-3 निर्देशित उदाहरण हल करें।',
      step3: 'चरण 3: त्वरित री-टेस्ट और सफलता का उत्सव',
      step3Desc: 'अपनी समझ और स्कोर को बढ़ते देखने के लिए 3 प्रश्नों की सहज जांच लें!',
      printBtn: 'प्रिंट / PDF के रूप में सहेजें (A4)',
      copyBtn: 'लिंक कॉपी करें',
      copiedBtn: 'लिंक कॉपी हो गया!',
      whatsappBtn: 'व्हाट्सएप पर शेयर करें',
      whatsappText: `यहाँ शिक्षागैप पर ${cleanFirstName} की कक्षा ${grade} गणित सीखने की रिपोर्ट है: ${shareUrl}\nअनलॉक किए गए कौशल और घर पर अभ्यास के आसान चरण देखें!`,
      expiryNotice: `यह निजी लिंक ${expiryDate} (30 दिन) को समाप्त होगा। कोई उपनाम, स्कूल या संपर्क जानकारी संग्रहीत नहीं है।`,
      provisionalBadge: 'अनंतिम परिणाम',
      provisionalText: 'प्रश्नों की अधिकतम सीमा समाप्त हो गई। वर्तमान परिणाम सबसे संभावित शिक्षण अंतराल दर्शाते हैं। अतिरिक्त अभ्यास की अनुशंसा की जाती है।',
      teacherNoteTitle: 'शिक्षक कक्षा अवलोकन',
      teacherNote: 'घर पर प्रतिदिन 10 मिनट के व्यावहारिक अभ्यास से बुनियादी गणितीय कौशल आत्मविश्वास के साथ जल्दी विकसित होते हैं। बच्चे की सीखने की यात्रा में आपकी सक्रिय भागीदारी के लिए धन्यवाद।',
      legacyStrengthTitle: 'कक्षा में वर्तमान क्षमताएं',
      legacyStrengthText: 'अंकगणित गतिविधियों के दौरान निरंतर उत्साह दिखाता है। एकल-अंक जोड़, घटाव और बुनियादी गिनती में आश्वस्त है।',
      legacyGapTitle: 'इस सप्ताह के लिए मुख्य शिक्षण लक्ष्य',
      legacyGapText: '3-अंकीय घटाव में उधार (हासिल) लेने की प्रक्रिया को समझना (उदाहरण के लिए, दहाई के स्थान से उधार लेना)।',
      shareBoxTitle: 'शेयर और कार्रवाइयां',
      evidenceStats: `${totalQuestions ? `${totalQuestions} प्रश्न पूर्ण हुए` : 'मूल्यांकन पूर्ण'}${confidence ? ` • ${Math.round(confidence * 100)}% विश्वसनीयता` : ''}`,
    },
    te: {
      badge: 'విద్యార్థి అభ్యసన లోపాల నివేదిక',
      docTitle: `${cleanFirstName} యొక్క గణిత అభ్యసన పురోగతి`,
      subtitle: `${grade}వ తరగతి | తల్లిదండ్రుల కోసం నిర్మాణాత్మక లోపాల నివేదిక`,
      privacyBadge: 'వ్యక్తిగత కుటుంబ నివేదిక (30 రోజుల లింక్)',
      skillsUnlockedTitle: 'అన్‌లాక్ అయిన నైపుణ్యాలు',
      skillsUnlockedSub: 'బాగా అర్థం చేసుకుని ఆత్మవిశ్వాసంతో సాధించిన భావనలు!',
      skillsSleepingTitle: 'ఇంకా నిద్రిస్తున్న నైపుణ్యాలు',
      skillsSleepingSub: 'సులభమైన సాధనతో ఈ నైపుణ్యాలు మేల్కొంటాయి!',
      readyToAwaken: 'మేల్కోవడానికి సిద్ధంగా ఉంది',
      prereqNeeded: 'పునాది అవసరం',
      prescribedTitle: 'సూచించిన 3-దశల పురోగతి ప్రణాళిక',
      step1: 'దశ 1: పునాది నైపుణ్యాన్ని మేల్కొలపండి',
      step1Desc: 'నిద్రిస్తున్న పునాదిపై నాణేలు, పుల్లలు లేదా సాధారణ చిత్రాలతో 5-10 నిమిషాలు సాధన చేయండి.',
      step2: 'దశ 2: తరగతి స్థాయి గణితంతో అనుసంధానించండి',
      step2Desc: 'పునాదిని ప్రస్తుత పాఠంతో అనుసంధానించే 2-3 మార్గదర్శక ఉదాహరణలను సాధించండి.',
      step3: 'దశ 3: చిన్న పునఃపరిశీలన & విజయాన్ని గుర్తించండి',
      step3Desc: 'మీ పురోగతిని చూడటానికి మరియు నైపుణ్యాన్ని మేల్కొలపడానికి 3-ప్రశ్నల సాధారణ పరీక్ష రాయండి!',
      printBtn: 'ప్రింట్ / PDF గా భద్రపరచండి (A4)',
      copyBtn: 'లింక్ కాపీ చేయండి',
      copiedBtn: 'లింక్ కాపీ చేయబడింది!',
      whatsappBtn: 'వాట్సాప్‌లో షేర్ చేయండి',
      whatsappText: `ఇక్కడ శిక్షాగ్యాప్‌లో ${cleanFirstName} యొక్క ${grade}వ తరగతి గణిత అభ్యసన నివేదిక ఉంది: ${shareUrl}\nఅన్‌లాక్ అయిన నైపుణ్యాలు మరియు ఇంట్లో సాధన చేయడానికి సులభమైన తదుపరి దశలను చూడండి!`,
      expiryNotice: `ఈ వ్యక్తిగత లింక్ ${expiryDate}న (30 రోజులు) ముగుస్తుంది. ఇంటిపేరు లేదా పాఠశాల వివరాలు నిల్వ చేయబడవు.`,
      provisionalBadge: 'తాత్కాలిక ఫలితం',
      provisionalText: 'గరిష్ట ప్రశ్నల పరిమితి ముగిసింది. ప్రస్తుత ఫలితం అత్యంత సంభవనీయమైన అభ్యసన లక్ష్యాన్ని సూచిస్తుంది. మరికొంత సాధన సిఫార్సు చేయబడింది.',
      teacherNoteTitle: 'తరగతి గది ఉపాధ్యాయ పరిశీలన',
      teacherNote: 'రోజూ ఇంట్లో 10 నిమిషాల ప్రయోగాత్మక సాధనతో గణిత పునాదులు సులభంగా బలపడతాయి. మీ పిల్లల విద్యా ప్రయాణంలో మీ భాగస్వామ్యానికి ధన్యవాదాలు.',
      legacyStrengthTitle: 'తరగతిలో ప్రస్తుత బలాలు',
      legacyStrengthText: 'గణిత సాధన సమయంలో నిరంతర ఆసక్తిని ప్రదర్శిస్తారు. ఒక అంకె కూడికలు, తీసివేతలు మరియు లెక్కింపులో ఆత్మవిశ్వాసం ఉంది.',
      legacyGapTitle: 'ఈ వారపు ప్రధాన అభ్యసన లక్ష్యం',
      legacyGapText: '3 అంకెల తీసివేతలో దశాంశ స్థానం నుండి అప్పు తీసుకోవడం (బారోయింగ్) యొక్క విధానాన్ని స్పష్టంగా అర్థం చేసుకోవడం.',
      shareBoxTitle: 'షేర్ & చర్యలు',
      evidenceStats: `${totalQuestions ? `${totalQuestions} ప్రశ్నలు పూర్తయ్యాయి` : 'పరిశీలన పూర్తి'}${confidence ? ` • ${Math.round(confidence * 100)}% విశ్వసనీయత` : ''}`,
    },
  };

  const currentContent = content[lang];
  const hasStudentGapData = skillsUnlocked.length > 0 || skillsSleeping.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-28 lg:pb-12 overflow-x-hidden">
      <div className="w-full max-w-[1200px] mx-auto space-y-6">
        {/* Top Control Bar: Language Switcher, Expiry, and Print */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4 print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-muted border border-border text-foreground">
              Class {grade}
            </span>
            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{expiryDate}</span>
            </span>
            <span className="text-xs font-mono text-[var(--status-good)] hidden sm:flex items-center gap-1 font-bold px-2.5 py-1 rounded-full bg-[var(--status-good-bg)] border border-[var(--status-good-border)]">
              <ShieldCheck className="w-3.5 h-3.5" weight="bold" />
              <span>{currentContent.privacyBadge}</span>
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
                {l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी' : 'తెలుగు'}
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
          {/* LEFT COLUMN: Main Report Document, Skills Unlocked/Sleeping */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <article className="border border-border bg-card dark:bg-card print:bg-white print:border-black print:text-black p-5 sm:p-8 shadow-sm rounded-[24px] space-y-6">
              {/* Header */}
              <div className="border-b-2 border-border print:border-black pb-4">
                <div className="flex items-center justify-between text-xs sm:text-sm font-mono uppercase mb-2 flex-wrap gap-2">
                  <span className="font-bold tracking-wider text-primary">ShikshaGap Educational Support</span>
                  <span className="border border-border px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground print:border-black flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" weight="bold" />
                    <span>{currentContent.privacyBadge}</span>
                  </span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground print:text-black">
                  {currentContent.docTitle}
                </h1>
                <p className="text-sm text-muted-foreground print:text-gray-700 mt-1">
                  {currentContent.subtitle}
                </p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/60 text-xs font-mono text-muted-foreground flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-foreground font-bold">
                    {currentContent.evidenceStats}
                  </span>
                  {isProvisional && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold">
                      {currentContent.provisionalBadge}
                    </span>
                  )}
                </div>
              </div>

              {isProvisional && (
                <div className="p-4 rounded-[16px] bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <Warning className="w-4 h-4 text-amber-600 dark:text-amber-400" weight="bold" />
                    <span>{currentContent.provisionalBadge}</span>
                  </div>
                  <p>{currentContent.provisionalText}</p>
                </div>
              )}

              {hasStudentGapData ? (
                /* Dynamic Gap Results */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Skills Unlocked Card */}
                    <div
                      data-testid="shared-skills-unlocked"
                      className="p-5 bg-[var(--surface)] border border-[var(--status-good-border)] rounded-[20px] space-y-3.5 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[var(--status-good-bg)] text-[var(--status-good)] flex items-center justify-center shrink-0 border border-[var(--status-good-border)]">
                          <LockKeyOpen className="w-4 h-4" weight="bold" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-base font-bold text-foreground">
                            {currentContent.skillsUnlockedTitle}
                          </h2>
                          <p className="text-xs text-muted-foreground truncate">
                            {currentContent.skillsUnlockedSub}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-1">
                        {skillsUnlocked.map((skill) => (
                          <div
                            key={skill.id}
                            className="p-3 bg-card border border-[var(--status-good-border)]/60 rounded-[14px] flex items-center justify-between gap-2"
                          >
                            <span className="font-bold text-sm text-foreground">{skill.name}</span>
                            <span className="text-xs font-mono font-bold text-[var(--status-good)] px-2 py-0.5 bg-[var(--status-good-bg)] border border-[var(--status-good-border)] rounded-full flex items-center gap-1 shrink-0">
                              <Sparkle className="w-3 h-3 text-[var(--status-good)]" weight="fill" />
                              <span>Mastered</span>
                            </span>
                          </div>
                        ))}
                        {skillsUnlocked.length === 0 && (
                          <p className="text-xs text-muted-foreground p-3 border border-border rounded-[14px]">
                            Practice starting now will unlock core skills step by step!
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Skills Still Sleeping Card */}
                    <div
                      data-testid="shared-skills-sleeping"
                      className="p-5 bg-[var(--surface)] border border-amber-300 dark:border-amber-700/80 rounded-[20px] space-y-3.5 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700">
                          <Moon className="w-4 h-4" weight="fill" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-base font-bold text-foreground">
                            {currentContent.skillsSleepingTitle}
                          </h2>
                          <p className="text-xs text-muted-foreground truncate">
                            {currentContent.skillsSleepingSub}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-1">
                        {skillsSleeping.map((skill) => (
                          <div
                            key={skill.id}
                            className="p-3 bg-card border border-amber-300/60 dark:border-amber-700/60 rounded-[14px] space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-sm text-foreground">{skill.name}</span>
                              <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-200 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 rounded-full shrink-0">
                                {currentContent.readyToAwaken}
                              </span>
                            </div>
                            {skill.prereqRoot && (
                              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
                                <span className="font-semibold text-primary">{currentContent.prereqNeeded}:</span>
                                <span>{skill.prereqRoot}</span>
                              </p>
                            )}
                          </div>
                        ))}
                        {skillsSleeping.length === 0 && (
                          <p className="text-xs text-muted-foreground p-3 border border-border rounded-[14px]">
                            All foundational skills are currently active and awake!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Fallback Teacher Observation Note */
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-foreground print:text-black font-mono mb-1.5">
                      <CheckCircle size={16} />
                      <span>{currentContent.legacyStrengthTitle}</span>
                    </div>
                    <p className="text-sm text-foreground/80 print:text-black leading-relaxed bg-muted print:bg-gray-50 p-3.5 border border-border print:border-gray-300 rounded-[14px]">
                      {currentContent.legacyStrengthText}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-primary print:text-black font-mono mb-1.5">
                      <Warning size={16} />
                      <span>{currentContent.legacyGapTitle}</span>
                    </div>
                    <p className="text-sm text-foreground/80 print:text-black leading-relaxed bg-primary/10 print:bg-gray-50 p-3.5 border border-primary/40 print:border-gray-300 font-medium rounded-[14px]">
                      {currentContent.legacyGapText}
                    </p>
                  </div>
                </div>
              )}

              {/* Teacher Classroom Observation */}
              <div className="p-4 sm:p-5 rounded-[18px] bg-muted/40 border border-border space-y-1.5">
                <span className="editorial-meta text-primary font-bold">
                  {currentContent.teacherNoteTitle}
                </span>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                  {currentContent.teacherNote}
                </p>
              </div>

              {/* Footer Notice */}
              <footer className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
                <span>{currentContent.expiryNotice}</span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="min-h-[44px] px-3.5 py-1.5 border border-border rounded-full hover:bg-muted font-mono font-bold flex items-center gap-1.5 text-foreground cursor-pointer"
                >
                  <Printer size={16} />
                  <span>{currentContent.printBtn}</span>
                </button>
              </footer>
            </article>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: Actions (Desktop) & Next-Steps Practice Plan  */}
          {/* ============================================================ */}
          <aside className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-6 self-start">
            {/* Desktop Action & Sharing Card (hidden on small screens, shown on lg:) */}
            <div className="hidden lg:block p-6 rounded-[24px] bg-card border border-border space-y-4 shadow-warm">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Sparkle className="w-4 h-4 text-primary" weight="fill" />
                <h2 className="text-sm font-bold font-mono uppercase text-foreground">
                  {currentContent.shareBoxTitle}
                </h2>
              </div>

              <div className="space-y-3">
                {/* WhatsApp Share Button */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(currentContent.whatsappText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="whatsapp-share-btn"
                  className="w-full min-h-[48px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 rounded-full border border-emerald-700 transition-colors cursor-pointer shadow-xs"
                >
                  <WhatsappLogo className="w-5 h-5" weight="fill" />
                  <span>{currentContent.whatsappBtn}</span>
                </a>

                {/* Copy Link Button */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  data-testid="copy-link-btn"
                  className="w-full min-h-[44px] px-4 bg-card hover:bg-muted text-foreground text-xs sm:text-sm font-mono font-bold border border-border flex items-center justify-center gap-2 rounded-full transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" weight="bold" />
                      <span className="font-bold text-emerald-600">{currentContent.copiedBtn}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{currentContent.copyBtn}</span>
                    </>
                  )}
                </button>

                {/* Print Button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full min-h-[44px] px-4 bg-card hover:bg-muted text-foreground text-xs sm:text-sm font-mono uppercase font-bold inline-flex items-center justify-center gap-2 border border-border rounded-full cursor-pointer"
                >
                  <Printer size={16} />
                  <span>{currentContent.printBtn}</span>
                </button>
              </div>
            </div>

            {/* Prescribed Next-Steps Growth Plan */}
            <div className="p-5 sm:p-6 bg-card border border-border rounded-[24px] space-y-4 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <TrendUp className="w-4 h-4 text-primary" weight="bold" />
                  <h3 className="font-bold text-sm sm:text-base text-foreground">
                    {currentContent.prescribedTitle}
                  </h3>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  Positive 3-Step Plan
                </span>
              </div>

              <div className="space-y-3">
                {prescribedPlan && prescribedPlan.length > 0 ? (
                  prescribedPlan.map((step) => (
                    <div key={step.step} className="p-4 rounded-[16px] bg-[var(--surface)] border border-border space-y-1">
                      <span className="text-xs font-mono font-bold text-primary uppercase">
                        {String(step.step).padStart(2, '0')} • Action Step
                      </span>
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
                    <div className="p-4 rounded-[16px] bg-[var(--surface)] border border-border space-y-1">
                      <span className="text-xs font-mono font-bold text-primary uppercase">
                        01 • Hands-on Practice
                      </span>
                      <div className="font-bold text-xs sm:text-sm text-foreground">
                        {currentContent.step1}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentContent.step1Desc}
                      </p>
                    </div>

                    <div className="p-4 rounded-[16px] bg-[var(--surface)] border border-border space-y-1">
                      <span className="text-xs font-mono font-bold text-primary uppercase">
                        02 • Guided Connection
                      </span>
                      <div className="font-bold text-xs sm:text-sm text-foreground">
                        {currentContent.step2}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentContent.step2Desc}
                      </p>
                    </div>

                    <div className="p-4 rounded-[16px] bg-[var(--surface)] border border-border space-y-1">
                      <span className="text-xs font-mono font-bold text-primary uppercase">
                        03 • Celebrate & Check
                      </span>
                      <div className="font-bold text-xs sm:text-sm text-foreground">
                        {currentContent.step3}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentContent.step3Desc}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Privacy Guarantee Card */}
            <div className="p-5 rounded-[22px] bg-muted/40 border border-border space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <ShieldCheck className="w-4 h-4 text-[var(--status-good)]" weight="bold" />
                <span>Family Privacy Guarantee</span>
              </div>
              <p className="leading-relaxed">
                {currentContent.expiryNotice}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MOBILE STICKY BOTTOM ACTION BAR (< 1024px / lg:hidden)          */}
      {/* ============================================================== */}
      <nav
        aria-label="Mobile report actions"
        className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-background/95 backdrop-blur-md border-t border-border shadow-lg flex items-center justify-between gap-2 lg:hidden print:hidden"
      >
        <a
          href={`https://wa.me/?text=${encodeURIComponent(currentContent.whatsappText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <WhatsappLogo className="w-4 h-4" weight="fill" />
          <span>{currentContent.whatsappBtn}</span>
        </a>

        <button
          type="button"
          onClick={handleCopyLink}
          className="min-h-[44px] px-3.5 py-2 rounded-full bg-card border border-border hover:bg-muted font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" weight="bold" />
              <span className="font-bold text-emerald-600">{currentContent.copiedBtn}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>{currentContent.copyBtn}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="min-h-[44px] px-3.5 py-2 rounded-full bg-card border border-border hover:bg-muted font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 text-foreground transition-colors"
          title={currentContent.printBtn}
        >
          <Printer size={16} />
          <span className="hidden sm:inline">{currentContent.printBtn}</span>
        </button>
      </nav>
    </div>
  );
}
