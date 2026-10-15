'use client';

import { useState } from 'react';
import { Printer, CheckCircle, Warning, Heart } from '@phosphor-icons/react';

interface Props {
  token: string;
  studentId: string;
  schoolId: string;
  expiresAt: number;
}

export default function ReportClientView({ expiresAt }: Props) {
  const [lang, setLang] = useState<'en' | 'hi' | 'te'>('en');

  // Formatted expiry date
  const expiryDate = new Date(expiresAt).toLocaleDateString();

  const content = {
    en: {
      title: 'Primary Mathematics Learning Progress Note',
      subtitle: 'Class 5 | Formative Progress Note for Parents & Guardians',
      childLabel: 'Student Progress Overview',
      privacyBadge: 'Confidential Family Document',
      strengthTitle: 'Current Strengths in Class',
      strengthText: 'Shows consistent enthusiasm and effort during arithmetic activities. Confident with single-digit addition, subtraction facts, and basic counting sequences.',
      gapTitle: 'Single Core Learning Goal for This Week',
      gapText: 'Understanding how borrowing works in 3-digit subtraction (for example, taking from the Tens place when subtracting a larger number from a smaller number).',
      homePracticeTitle: '3 Easy 10-Minute Activities You Can Do at Home',
      p1: '1. Bundle Sticks Game: Take 30 broomsticks or matchsticks. Make bundles of 10 with rubber bands. Practice unbundling 1 bundle into 10 single sticks when subtracting.',
      p2: '2. Currency Notes Practice: Use fake toy notes (ten-rupee notes and one-rupee coins). Ask your child to exchange one 10-rupee note for ten 1-rupee coins to make change.',
      p3: '3. Encouragement Talk: Ask your child to explain how they solved a problem out loud. Praise the thinking process rather than just the final number.',
      teacherNoteTitle: 'Teacher Classroom Observation',
      teacherNote: 'With 10 minutes of hands-on practice daily at home, this foundational gap is typically resolved within one to two weeks. Thank you for your active partnership in your child\'s learning journey.',
      printBtn: 'Print / Save as PDF',
      expiryNotice: `This private link expires on ${expiryDate} for child data privacy.`,
    },
    hi: {
      title: 'प्राथमिक गणित शिक्षण प्रगति पत्र',
      subtitle: 'कक्षा 5 | अभिभावकों हेतु रचनात्मक प्रगति नोट',
      childLabel: 'विद्यार्थी प्रगति विवरण',
      privacyBadge: 'गोपनीय पारिवारिक दस्तावेज',
      strengthTitle: 'कक्षा में वर्तमान क्षमताएं',
      strengthText: 'अंकगणितीय गतिविधियों के दौरान निरंतर उत्साह दिखाता/दिखाती है। एकल अंकों के जोड़, घटाव और बुनियादी गिनती में पूर्ण आत्मविश्वास है।',
      gapTitle: 'इस सप्ताह का मुख्य सीखने का लक्ष्य',
      gapText: '3-अंकीय घटाव में उधार (हासिल) लेने की प्रक्रिया को समझना (उदाहरण के लिए, जब इकाई में छोटी संख्या से बड़ी संख्या घटाई जाती है, तो दहाई से 10 लेना)।',
      homePracticeTitle: 'घर पर करने योग्य 3 आसान 10-मिनट के खेल',
      p1: '1. तीलियों का बंडल: माचिस की 30 तीलियां लें। 10-10 के बंडल बनाएं। घटाते समय 1 बंडल को खोलकर 10 खुली तीलियां बनाने का अभ्यास करें।',
      p2: '2. 10 रुपये के नोट का खेल: एक 10 रुपये के नोट को दस 1-रुपये के सिक्कों में बदलना सिखाएं ताकि स्थानीय मान का भाव स्पष्ट हो सके।',
      p3: '3. मौखिक बातचीत: बच्चे से कहें कि वह घटाव की प्रक्रिया बोलकर समझाए। केवल सही उत्तर के बजाय सोचने के तरीके की सराहना करें।',
      teacherNoteTitle: 'कक्षा शिक्षक का संदेश',
      teacherNote: 'घर पर प्रतिदिन केवल 10 मिनट के प्रत्यक्ष अभ्यास से यह बुनियादी अंतराल 1-2 सप्ताह में आसानी से दूर हो जाएगा। सहयोग के लिए धन्यवाद।',
      printBtn: 'प्रिंट करें / पीडीएफ सहेजें',
      expiryNotice: `यह लिंक गोपनीयता सुरक्षा हेतु ${expiryDate} को समाप्त हो जाएगा।`,
    },
    te: {
      title: 'ప్రాథమిక గణిత అభ్యసన పురోగతి పత్రం',
      subtitle: '5వ తరగతి | తల్లిదండ్రుల కోసం ప్రత్యేక నివేదిక',
      childLabel: 'విద్యార్థి అభ్యసన పురోగతి',
      privacyBadge: 'గోప్యమైన కుటుంబ పత్రం',
      strengthTitle: 'తరగతిలో ప్రస్తుత బలాలు',
      strengthText: 'గణిత పాఠాల సమయంలో చురుకుగా పాల్గొంటున్నారు. ఒంటి అంకెల కూడికలు మరియు తీసివేతలలో మంచి పట్టు ఉంది.',
      gapTitle: 'ఈ వారం సాధించాల్సిన ముఖ్య లక్ష్యం',
      gapText: '3-అంకెల తీసివేతలో దశాంశ స్థానం నుండి అప్పు తీసుకోవడం (రీగ్రూపింగ్) విధానాన్ని స్పష్టంగా అర్థం చేసుకోవడం.',
      homePracticeTitle: 'ఇంట్లో చేయగలిగే 3 సులభమైన 10 నిమిషాల సాధనలు',
      p1: '1. చీపురు పుల్లల కట్టల ఆట: 30 పుల్లలను తీసుకుని పదేసి చొప్పున కట్టలు కట్టండి. తీసివేసేటప్పుడు ఒక కట్టను విప్పి 10 విడి పుల్లలుగా మార్చడం చూపించండి.',
      p2: '2. 10 రూపాయల నోట్ల ఆట: ఒక 10 రూపాయల నోటును పది 1 రూపాయి నాణేలుగా మార్చే విధానాన్ని ఆట రూపంలో ప్రాక్టీస్ చేయించండి.',
      p3: '3. ప్రోత్సాహం: లెక్క చేసేటప్పుడు బిడ్డను ఆలోచనను గట్టిగా వివరించమని అడగండి. కేవలం జవాబు కంటే వారు ఆలోచించిన విధానాన్ని ప్రశంసించండి.',
      teacherNoteTitle: 'ఉపాధ్యాయుని గమనిక',
      teacherNote: 'ఇంట్లో రోజుకు 10 నిమిషాలు సాధన చేయించడం ద్వారా ఈ సమస్యను అతి త్వరగా సరిదిద్దవచ్చు. మీ సహకారానికి ధన్యవాదాలు.',
      printBtn: 'ప్రింట్ చేయండి / PDF సేవ్‌చేయండి',
      expiryNotice: `ఈ గోప్యమైన లింక్ ${expiryDate} తో ముగుస్తుంది.`,
    }
  }[lang];

  return (
    <div className="min-h-[100dvh] bg-card dark:bg-muted text-foreground font-sans p-4 sm:p-8 print:p-0 print:bg-white print:text-black">
      {/* Top Floating Action Bar */}
      <div className="w-full max-w-4xl lg:max-w-5xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex gap-1" role="group" aria-label="Select report language">
          {(['en', 'hi', 'te'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`min-h-[44px] px-3 text-sm font-mono uppercase border ${
                lang === l
                  ? 'bg-primary text-primary-foreground dark:bg-muted dark:text-foreground font-bold border-border'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी' : 'తెలుగు'}
            </button>
          ))}
        </div>

        <button
          onClick={() => window.print()}
          className="min-h-[44px] px-4 bg-primary text-primary-foreground dark:bg-muted dark:text-foreground text-sm font-mono uppercase font-bold inline-flex items-center gap-2 border border-border"
        >
          <Printer size={16} />
          <span>{content.printBtn}</span>
        </button>
      </div>

      {/* 1-Page Printable Report Sheet */}
      <article className="w-full max-w-4xl lg:max-w-5xl mx-auto border border-border bg-card dark:bg-card print:bg-white print:border-black print:text-black p-6 sm:p-10 shadow-none">
        {/* Header */}
        <div className="border-b-2 border-border print:border-black pb-4 mb-6">
          <div className="flex items-center justify-between text-sm font-mono uppercase mb-2">
            <span className="font-bold tracking-wider">ShikshaGap Educational Support</span>
            <span className="border border-border px-2 py-0.5 print:border-black">
              {content.privacyBadge}
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground print:text-black dark:text-foreground">
            {content.title}
          </h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground print:text-gray-700 mt-1">
            {content.subtitle}
          </p>
        </div>

        {/* Section 1: Strengths */}
        <div className="mb-6">
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-foreground print:text-black font-mono mb-1.5">
            <CheckCircle size={16} />
            <span>{content.strengthTitle}</span>
          </div>
          <p className="text-sm sm:text-sm text-foreground/80 dark:text-muted-foreground print:text-black leading-relaxed bg-muted print:bg-gray-50 p-3.5 border border-border print:border-gray-300">
            {content.strengthText}
          </p>
        </div>

        {/* Section 2: Core Learning Gap */}
        <div className="mb-6">
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-primary print:text-black font-mono mb-1.5">
            <Warning size={16} />
            <span>{content.gapTitle}</span>
          </div>
          <p className="text-sm sm:text-sm text-foreground/80 dark:text-muted-foreground print:text-black leading-relaxed bg-primary/10 print:bg-gray-50 p-3.5 border border-primary/40 print:border-gray-300 font-medium">
            {content.gapText}
          </p>
        </div>

        {/* Section 3: 3 Home Practice Activities */}
        <div className="mb-6">
          <h2 className="font-serif text-base font-bold mb-3 text-foreground print:text-black">
            {content.homePracticeTitle}
          </h2>
          <div className="space-y-2.5 text-sm sm:text-sm text-foreground/80 dark:text-muted-foreground print:text-black">
            <div className="p-3 border border-border print:border-gray-300 bg-card dark:bg-muted print:bg-white">
              {content.p1}
            </div>
            <div className="p-3 border border-border print:border-gray-300 bg-card dark:bg-muted print:bg-white">
              {content.p2}
            </div>
            <div className="p-3 border border-border print:border-gray-300 bg-card dark:bg-muted print:bg-white">
              {content.p3}
            </div>
          </div>
        </div>

        {/* Section 4: Teacher Note */}
        <div className="border-t border-border print:border-black pt-4 mb-6">
          <div className="flex items-center gap-1.5 font-bold text-sm uppercase tracking-wider font-mono mb-1">
            <Heart size={14} className="text-primary" />
            <span>{content.teacherNoteTitle}</span>
          </div>
          <p className="text-sm text-foreground/80 dark:text-muted-foreground print:text-black leading-relaxed italic">
            &quot;{content.teacherNote}&quot;
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-dashed border-border print:border-black pt-3 flex flex-col sm:flex-row justify-between text-sm font-mono text-muted-foreground dark:text-muted-foreground print:text-gray-600 gap-1">
          <span>Teacher Verified | Decision Support Only</span>
          <span>{content.expiryNotice}</span>
        </div>
      </article>
    </div>
  );
}
