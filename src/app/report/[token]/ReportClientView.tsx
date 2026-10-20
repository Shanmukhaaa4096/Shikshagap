'use client';

import { useState } from 'react';
import {
  Printer,
  CheckCircle,
  Warning,
  Heart,
  LockKeyOpen,
  Moon,
  Sparkle,
  TrendUp,
  WhatsappLogo,
  Copy,
  Check,
  ShieldCheck,
} from '@phosphor-icons/react';

interface Props {
  token: string;
  studentId: string;
  schoolId: string;
  expiresAt: number;
  firstName?: string;
  grade?: number | string;
  skillsUnlocked?: Array<{ id: string; name: string }>;
  skillsSleeping?: Array<{ id: string; name: string; prereqRoot?: string }>;
  prescribedPlan?: Array<{ step: number; title: string; desc: string }>;
}

export default function ReportClientView({
  token,
  expiresAt,
  firstName,
  grade = 5,
  skillsUnlocked = [],
  skillsSleeping = [],
  prescribedPlan = [],
}: Props) {
  const [lang, setLang] = useState<'en' | 'hi' | 'te'>('en');
  const [copied, setCopied] = useState(false);

  // Formatted expiry date
  const expiryDate = new Date(expiresAt).toLocaleDateString();

  // Clean first name (guarantee strictly first name only, no surname)
  const cleanFirstName = (firstName || 'Learner').trim().split(/\s+/)[0] || 'Learner';

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://shikshagap.vercel.app/report/${token}`;

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
      docTitle: `${cleanFirstName}'s Mathematics Learning Progress`,
      subtitle: `Class ${grade} | Formative Gap Report for Parents & Guardians`,
      privacyBadge: 'Private Family Document (14-Day Link)',
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
      printBtn: 'Print / Save as PDF',
      copyBtn: 'Copy Link',
      copiedBtn: 'Link Copied!',
      whatsappBtn: 'Share on WhatsApp',
      whatsappText: `Here is ${cleanFirstName}'s Class ${grade} Maths Learning Gap Report on ShikshaGap: ${shareUrl}\nSee unlocked skills and gentle next steps to practice at home!`,
      expiryNotice: `This private link expires on ${expiryDate} (14 days). No surname, school, or contact info is stored.`,
      teacherNoteTitle: 'Teacher Classroom Observation',
      teacherNote: 'With 10 minutes of hands-on practice daily at home, foundational math skills awaken quickly with confidence. Thank you for your active partnership in your child\'s learning journey.',
      legacyStrengthTitle: 'Current Strengths in Class',
      legacyStrengthText: 'Shows consistent enthusiasm and effort during arithmetic activities. Confident with single-digit addition, subtraction facts, and basic counting sequences.',
      legacyGapTitle: 'Single Core Learning Goal for This Week',
      legacyGapText: 'Understanding how borrowing works in 3-digit subtraction (for example, taking from the Tens place when subtracting a larger number from a smaller number).',
      legacyHomeTitle: '3 Easy 10-Minute Activities You Can Do at Home',
      legacyP1: '1. Bundle Sticks Game: Take 30 broomsticks or matchsticks. Make bundles of 10 with rubber bands. Practice unbundling 1 bundle into 10 single sticks when subtracting.',
      legacyP2: '2. Currency Notes Practice: Use fake toy notes (ten-rupee notes and one-rupee coins). Ask your child to exchange one 10-rupee note for ten 1-rupee coins to make change.',
      legacyP3: '3. Encouragement Talk: Ask your child to explain how they solved a problem out loud. Praise the thinking process rather than just the final number.',
    },
    hi: {
      docTitle: `${cleanFirstName} की प्राथमिक गणित शिक्षण प्रगति रिपोर्ट`,
      subtitle: `कक्षा ${grade} | अभिभावकों हेतु रचनात्मक सीख रिपोर्ट`,
      privacyBadge: 'निजी पारिवारिक दस्तावेज (14-दिवसीय लिंक)',
      skillsUnlockedTitle: 'खुले हुए कौशल',
      skillsUnlockedSub: 'वे अवधारणाएं जिन्हें विद्यार्थी अच्छी तरह समझता है!',
      skillsSleepingTitle: 'कौशल जो अभी सो रहे हैं',
      skillsSleepingSub: 'धीमे और सरल अभ्यास से ये कौशल एक-एक करके जाग जाएंगे!',
      readyToAwaken: 'जागने के लिए तैयार',
      prereqNeeded: 'बुनियादी आवश्यकता',
      prescribedTitle: 'प्रस्तावित अगले कदम की विकास योजना',
      step1: 'चरण 1: बुनियादी कौशल को जगाएं',
      step1Desc: 'चित्रों या वस्तुओं के साथ 5-10 मिनट का सरल बुनियादी अभ्यास करें।',
      step2: 'चरण 2: कक्षा स्तर के गणित से जोड़ें',
      step2Desc: '2-3 मार्गदर्शित उदाहरण हल करें और हर छोटे कदम की सराहना करें।',
      step3: 'चरण 3: त्वरित दोबारा जांच और प्रगति का उत्सव',
      step3Desc: 'अपनी प्रगति देखने और कौशल को जगाने के लिए 3 प्रश्नों की छोटी जांच करें!',
      printBtn: 'प्रिंट करें / पीडीएफ सहेजें',
      copyBtn: 'लिंक कॉपी करें',
      copiedBtn: 'लिंक कॉपी हो गया!',
      whatsappBtn: 'व्हाट्सएप पर साझा करें',
      whatsappText: `यहाँ शिक्षागैप पर ${cleanFirstName} की कक्षा ${grade} की गणित सीख रिपोर्ट है: ${shareUrl}\nघर पर अभ्यास के लिए खुले हुए कौशल और आसान अगले कदम देखें!`,
      expiryNotice: `यह निजी लिंक ${expiryDate} को समाप्त हो जाएगा (14 दिन)। कोई उपनाम, स्कूल या संपर्क जानकारी साझा नहीं की जाती है।`,
      teacherNoteTitle: 'कक्षा शिक्षक का संदेश',
      teacherNote: 'घर पर प्रतिदिन केवल 10 मिनट के प्रत्यक्ष अभ्यास से यह बुनियादी अंतराल 1-2 सप्ताह में आसानी से दूर हो जाएगा। सहयोग के लिए धन्यवाद।',
      legacyStrengthTitle: 'कक्षा में वर्तमान क्षमताएं',
      legacyStrengthText: 'अंकगणितीय गतिविधियों के दौरान निरंतर उत्साह दिखाता/दिखाती है। एकल अंकों के जोड़, घटाव और बुनियादी गिनती में पूर्ण आत्मविश्वास है।',
      legacyGapTitle: 'इस सप्ताह का मुख्य सीखने का लक्ष्य',
      legacyGapText: '3-अंकीय घटाव में उधार (हासिल) लेने की प्रक्रिया को समझना (उदाहरण के लिए, जब इकाई में छोटी संख्या से बड़ी संख्या घटाई जाती है, तो दहाई से 10 लेना)।',
      legacyHomeTitle: 'घर पर करने योग्य 3 आसान 10-मिनट के खेल',
      legacyP1: '1. तीलियों का बंडल: माचिस की 30 तीलियां लें। 10-10 के बंडल बनाएं। घटाते समय 1 बंडल को खोलकर 10 खुली तीलियां बनाने का अभ्यास करें।',
      legacyP2: '2. 10 रुपये के नोट का खेल: एक 10 रुपये के नोट को दस 1-रुपये के सिक्कों में बदलना सिखाएं ताकि स्थानीय मान का भाव स्पष्ट हो सके।',
      legacyP3: '3. मौखिक बातचीत: बच्चे से कहें कि वह घटाव की प्रक्रिया बोलकर समझाए। केवल सही उत्तर के बजाय सोचने के तरीके की सराहना करें।',
    },
    te: {
      docTitle: `${cleanFirstName} ప్రాథమిక గణిత అభ్యసన నివేదిక`,
      subtitle: `${grade}వ తరగతి | తల్లిదండ్రుల కోసం ప్రత్యేక నివేదిక`,
      privacyBadge: 'గోప్యమైన కుటుంబ పత్రం (14 రోజుల లింక్)',
      skillsUnlockedTitle: 'అన్‌లాక్ అయిన నైపుణ్యాలు',
      skillsUnlockedSub: 'విద్యార్థి బాగా అర్థం చేసుకుని ఆత్మవిశ్వాసంతో సాధించే అంశాలు!',
      skillsSleepingTitle: 'ఇంకా నిద్రపోతున్న నైపుణ్యాలు',
      skillsSleepingSub: 'సులువైన సాధనతో ఈ నైపుణ్యాలు ఒక్కొక్కటిగా మేల్కొంటాయి!',
      readyToAwaken: 'మేల్కొలపడానికి సిద్ధంగా ఉంది',
      prereqNeeded: 'పునాది అవసరం',
      prescribedTitle: 'ప్రతిపాదిత తదుపరి ఎదుగుదల ప్రణాళిక',
      step1: 'దశ 1: పునాది నైపుణ్యాన్ని మేల్కొలపండి',
      step1Desc: 'పునాది భావనపై వస్తువులు లేదా చిత్రాలతో 5-10 నిమిషాలు గడపండి.',
      step2: 'దశ 2: తరగతి స్థాయి గణితంతో అనుసంధానించండి',
      step2Desc: 'పునాదిని పాఠంతో కలిపే 2-3 ఉదాహరణలను సాధించండి.',
      step3: 'దశ 3: చిన్న పునఃపరిశీలన & ఎదుగుదల సంబరం',
      step3Desc: 'స్కోరు ఎలా పెరిగిందో మరియు నైపుణ్యం ఎలా మేల్కొందో చూడటానికి 3 ప్రశ్నల చిన్న పరిశీలన చేయండి!',
      printBtn: 'ప్రింట్ చేయండి / PDF సేవ్‌చేయండి',
      copyBtn: 'లింక్ కాపీ చేయండి',
      copiedBtn: 'లింక్ కాపీ చేయబడింది!',
      whatsappBtn: 'వాట్సాప్‌లో షేర్ చేయండి',
      whatsappText: `ఇక్కడ శిక్షాగ్యాప్‌లో ${cleanFirstName} యొక్క ${grade}వ తరగతి గణిత అభ్యసన నివేదిక ఉంది: ${shareUrl}\nఇంట్లో సాధన చేయడానికి అన్‌లాక్ అయిన నైపుణ్యాలు మరియు సులభమైన తదుపరి దశలను చూడండి!`,
      expiryNotice: `ఈ గోప్యమైన లింక్ ${expiryDate} తో ముగుస్తుంది (14 రోజులు). ఇంటిపేరు, పాఠశాల లేదా సంప్రదింపు సమాచారం ఉండదు.`,
      teacherNoteTitle: 'ఉపాధ్యాయుని గమనిక',
      teacherNote: 'ఇంట్లో రోజుకు 10 నిమిషాలు సాధన చేయించడం ద్వారా ఈ సమస్యను అతి త్వరగా సరిదిద్దవచ్చు. మీ సహకారానికి ధన్యవాదాలు.',
      legacyStrengthTitle: 'తరగతిలో ప్రస్తుత బలాలు',
      legacyStrengthText: 'గణిత పాఠాల సమయంలో చురుకుగా పాల్గొంటున్నారు. ఒంటి అంకెల కూడికలు మరియు తీసివేతలలో మంచి పట్టు ఉంది.',
      legacyGapTitle: 'ఈ వారం సాధించాల్సిన ముఖ్య లక్ష్యం',
      legacyGapText: '3-అంకెల తీసివేతలో దశాంశ స్థానం నుండి అప్పు తీసుకోవడం (రీగ్రూపింగ్) విధానాన్ని స్పష్టంగా అర్థం చేసుకోవడం.',
      legacyHomeTitle: 'ఇంట్లో చేయగలిగే 3 సులభమైన 10 నిమిషాల సాధనలు',
      legacyP1: '1. చీపురు పుల్లల కట్టల ఆట: 30 పుల్లలను తీసుకుని పదేసి చొప్పున కట్టలు కట్టండి. తీసివేసేటప్పుడు ఒక కట్టను విప్పి 10 విడి పుల్లలుగా మార్చడం చూపించండి.',
      legacyP2: '2. 10 రూపాయల నోట్ల ఆట: ఒక 10 రూపాయల నోటును పది 1 రూపాయి నాణేలుగా మార్చే విధానాన్ని ఆట రూపంలో ప్రాక్టీస్ చేయించండి.',
      legacyP3: '3. ప్రోత్సాహం: లెక్క చేసేటప్పుడు బిడ్డను ఆలోచనను గట్టిగా వివరించమని అడగండి. కేవలం జవాబు కంటే వారు ఆలోచించిన విధానాన్ని ప్రశంసించండి.',
    },
  }[lang];

  const hasStudentGapData = skillsUnlocked.length > 0 || skillsSleeping.length > 0;

  return (
    <div className="min-h-[100dvh] bg-card dark:bg-muted text-foreground font-sans p-4 sm:p-8 print:p-0 print:bg-white print:text-black">
      {/* Top Floating Action Bar */}
      <div className="w-full max-w-4xl lg:max-w-5xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        {/* Language Switcher */}
        <div className="flex gap-1" role="group" aria-label="Select report language">
          {(['en', 'hi', 'te'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`min-h-[44px] px-3 text-sm font-mono uppercase border cursor-pointer ${
                lang === l
                  ? 'bg-primary text-primary-foreground font-bold border-primary'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              {l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी' : 'తెలుగు'}
            </button>
          ))}
        </div>

        {/* Action Buttons: WhatsApp, Copy, Print */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(content.whatsappText)}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="whatsapp-share-btn"
            className="min-h-[44px] px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 rounded-md border border-emerald-700 transition-colors cursor-pointer"
          >
            <WhatsappLogo className="w-4 h-4" weight="fill" />
            <span>{content.whatsappBtn}</span>
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            data-testid="copy-link-btn"
            className="min-h-[44px] px-3.5 bg-card hover:bg-muted text-foreground text-xs sm:text-sm font-mono border border-border flex items-center gap-1.5 rounded-md transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" weight="bold" />
                <span className="font-bold text-emerald-600">{content.copiedBtn}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{content.copyBtn}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[44px] px-3.5 bg-card hover:bg-muted text-foreground text-xs sm:text-sm font-mono uppercase font-bold inline-flex items-center gap-1.5 border border-border rounded-md cursor-pointer"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">{content.printBtn}</span>
          </button>
        </div>
      </div>

      {/* 1-Page Printable Report Sheet */}
      <article className="w-full max-w-4xl lg:max-w-5xl mx-auto border border-border bg-card dark:bg-card print:bg-white print:border-black print:text-black p-6 sm:p-10 shadow-sm rounded-[24px]">
        {/* Header */}
        <div className="border-b-2 border-border print:border-black pb-4 mb-6">
          <div className="flex items-center justify-between text-xs sm:text-sm font-mono uppercase mb-2 flex-wrap gap-2">
            <span className="font-bold tracking-wider text-primary">ShikshaGap Educational Support</span>
            <span className="border border-border px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground print:border-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" weight="bold" />
              <span>{content.privacyBadge}</span>
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground print:text-black">
            {content.docTitle}
          </h1>
          <p className="text-sm text-muted-foreground print:text-gray-700 mt-1">
            {content.subtitle}
          </p>
        </div>

        {hasStudentGapData ? (
          /* ============================================================== */
          /* DYNAMIC GAP REPORT: UNLOCKED & SLEEPING SKILL CARDS            */
          /* ============================================================== */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Skills Unlocked Card */}
              <div
                data-testid="shared-skills-unlocked"
                className="p-4 sm:p-5 bg-[var(--surface)] border border-[var(--status-good-border)] rounded-[20px] space-y-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--status-good-bg)] text-[var(--status-good)] flex items-center justify-center shrink-0 border border-[var(--status-good-border)]">
                    <LockKeyOpen className="w-4 h-4" weight="bold" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {content.skillsUnlockedTitle}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {content.skillsUnlockedSub}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {skillsUnlocked.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-3 bg-card border border-[var(--status-good-border)]/60 rounded-[14px] flex items-center justify-between gap-2"
                    >
                      <span className="font-bold text-sm text-foreground">{skill.name}</span>
                      <span className="text-xs font-mono font-bold text-[var(--status-good)] px-2 py-0.5 bg-[var(--status-good-bg)] border border-[var(--status-good-border)] rounded-full flex items-center gap-1">
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
                className="p-4 sm:p-5 bg-[var(--surface)] border border-amber-300 dark:border-amber-700/80 rounded-[20px] space-y-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700">
                    <Moon className="w-4 h-4" weight="fill" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {content.skillsSleepingTitle}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {content.skillsSleepingSub}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {skillsSleeping.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-3 bg-card border border-amber-300/60 dark:border-amber-700/60 rounded-[14px] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-foreground">{skill.name}</span>
                        <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-200 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 rounded-full">
                          {content.readyToAwaken}
                        </span>
                      </div>
                      {skill.prereqRoot && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="font-semibold text-primary">{content.prereqNeeded}:</span>
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

            {/* Prescribed Next-Steps Growth Plan */}
            <div className="p-4 sm:p-5 bg-[var(--surface)] border border-border rounded-[20px] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <TrendUp className="w-4 h-4 text-primary" weight="bold" />
                  <h3 className="font-bold text-sm sm:text-base text-foreground">
                    {content.prescribedTitle}
                  </h3>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  Positive 3-Step Action Plan
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-[16px] bg-card border border-border space-y-1">
                  <span className="text-xs font-mono font-bold text-primary uppercase">
                    01 • Hands-on Practice
                  </span>
                  <div className="font-bold text-xs sm:text-sm text-foreground">
                    {content.step1}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {content.step1Desc}
                  </p>
                </div>

                <div className="p-3.5 rounded-[16px] bg-card border border-border space-y-1">
                  <span className="text-xs font-mono font-bold text-primary uppercase">
                    02 • Guided Connection
                  </span>
                  <div className="font-bold text-xs sm:text-sm text-foreground">
                    {content.step2}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {content.step2Desc}
                  </p>
                </div>

                <div className="p-3.5 rounded-[16px] bg-card border border-border space-y-1">
                  <span className="text-xs font-mono font-bold text-primary uppercase">
                    03 • Celebrate & Check
                  </span>
                  <div className="font-bold text-xs sm:text-sm text-foreground">
                    {content.step3}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {content.step3Desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* FALLBACK: LEGACY TEACHER GUARDIAN NOTE TEMPLATE                */
          /* ============================================================== */
          <div className="space-y-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-foreground print:text-black font-mono mb-1.5">
                <CheckCircle size={16} />
                <span>{content.legacyStrengthTitle}</span>
              </div>
              <p className="text-sm text-foreground/80 print:text-black leading-relaxed bg-muted print:bg-gray-50 p-3.5 border border-border print:border-gray-300 rounded-[14px]">
                {content.legacyStrengthText}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-primary print:text-black font-mono mb-1.5">
                <Warning size={16} />
                <span>{content.legacyGapTitle}</span>
              </div>
              <p className="text-sm text-foreground/80 print:text-black leading-relaxed bg-primary/10 print:bg-gray-50 p-3.5 border border-primary/40 print:border-gray-300 font-medium rounded-[14px]">
                {content.legacyGapText}
              </p>
            </div>

            <div className="mb-6">
              <h2 className="font-serif text-base font-bold mb-3 text-foreground print:text-black">
                {content.legacyHomeTitle}
              </h2>
              <div className="space-y-2.5 text-sm text-foreground/80 print:text-black">
                <div className="p-3 border border-border print:border-gray-300 bg-card rounded-[14px]">
                  {content.legacyP1}
                </div>
                <div className="p-3 border border-border print:border-gray-300 bg-card rounded-[14px]">
                  {content.legacyP2}
                </div>
                <div className="p-3 border border-border print:border-gray-300 bg-card rounded-[14px]">
                  {content.legacyP3}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section: Teacher Observation */}
        <div className="border-t border-border print:border-black pt-4 mt-6">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider font-mono mb-1 text-primary">
            <Heart size={14} className="text-primary" weight="fill" />
            <span>{content.teacherNoteTitle}</span>
          </div>
          <p className="text-xs sm:text-sm text-foreground/80 print:text-black leading-relaxed italic">
            &quot;{content.teacherNote}&quot;
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-dashed border-border print:border-black pt-3 mt-6 flex flex-col sm:flex-row justify-between text-xs font-mono text-muted-foreground print:text-gray-600 gap-1.5">
          <span>Read-Only Student Gap Report</span>
          <span>{content.expiryNotice}</span>
        </div>
      </article>
    </div>
  );
}
