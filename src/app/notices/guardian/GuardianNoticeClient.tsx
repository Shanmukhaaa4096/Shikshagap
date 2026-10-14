'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Printer, ShareNetwork, Check, ArrowLeft } from '@phosphor-icons/react';
import { siteConfig } from '@/config/site';

type NoticeLanguage = 'en' | 'hi' | 'te';

interface NoticeContent {
  title: string;
  subtitle: string;
  disclaimer: string;
  intro: string;
  sec1Title: string;
  sec1Text: string;
  sec2Title: string;
  sec2Text: string;
  sec3Title: string;
  sec3Text: string;
  sec4Title: string;
  sec4Text: string;
  sec5Title: string;
  sec5Text: string;
  parentSigLabel: string;
  dateLabel: string;
  teacherSigLabel: string;
  childNameLabel: string;
}

const NOTICES: Record<NoticeLanguage, NoticeContent> = {
  en: {
    title: 'PARENT / GUARDIAN NOTICE & CONSENT RECORD',
    subtitle: 'Formative Mathematics Diagnostic Assessment | Academic Year 2026-2027',
    disclaimer: 'LEGAL DRAFT NOTICE: This template is prepared under India Digital Personal Data Protection Act 2023 guidelines. Schools must obtain formal approval from competent education authorities prior to deployment.',
    intro: 'Dear Parent / Guardian, our school is utilizing ShikshaGap, a formative diagnostic learning system, to identify foundational learning gaps in Class 5 mathematics (place value, multi-digit operations, fractions) and provide tailored classroom practice.',
    sec1Title: '1. What Child Data is Used?',
    sec1Text: 'Only the student\'s first name, roll number, classroom section, and written math answers. No biometric, Aadhaar, photographic, or financial data is collected or processed.',
    sec2Title: '2. Purpose of Processing',
    sec2Text: 'Strictly to help your child\'s teacher understand prerequisite learning hurdles and generate customized 5-day practice worksheets. No ranking, no public shaming, and no commercial use.',
    sec3Title: '3. Protection & Third Parties',
    sec3Text: 'AI-assisted diagnostic evaluation is performed using pseudonymous identifiers (e.g., anon_4b8f). Your child\'s name is never sent to external AI servers. Mathematical questions and aggregate error counts may be retained anonymously for question quality calibration, without any identifying information. Zero tracking, zero advertisements, zero data monetization.',
    sec4Title: '4. Data Retention',
    sec4Text: 'Formative assessment records are retained solely for the current academic term and erased following remedial reassessment verification. Anonymous session audit summaries are automatically pruned after a 90-day rolling window, while high-level non-personal aggregates (question difficulty and misconception frequency) are preserved for curriculum calibration. (Note: Text subject to formal legal counsel review).',
    sec5Title: '5. Guardian Rights under DPDP Act 2023',
    sec5Text: `You maintain the right to inspect your child's diagnostic records, request corrections, or ask for erasure at any time through the school headmaster or via ${siteConfig.contactEmail}.`,
    parentSigLabel: 'Signature / Thumb Impression of Parent or Guardian:',
    dateLabel: 'Date:',
    teacherSigLabel: 'Verified by Class Teacher (Signature):',
    childNameLabel: 'Student Name & Roll Number:'
  },
  hi: {
    title: 'अभिभावक / संरक्षक सूचना एवं सहमति प्रपत्र',
    subtitle: 'कक्षा 5 गणित प्रारंभिक नैदानिक मूल्यांकन | शैक्षणिक सत्र 2026-2027',
    disclaimer: 'वैधानिक प्रारूप सूचना: यह प्रारूप भारत के डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023 के तहत तैयार किया गया है। विद्यालय उपयोग से पूर्व सक्षम विधिक समीक्षा प्राप्त करें।',
    intro: 'आदरणीय अभिभावक, हमारा विद्यालय कक्षा 5 गणित में मूलभूत सीखने के अंतरालों (स्थानीय मान, जोड़-घटाव, भिन्न) की पहचान करने और उपचारात्मक अभ्यास प्रदान करने हेतु शिक्षा-गैप प्रणाली का उपयोग कर रहा है।',
    sec1Title: '1. बच्चे का कौन-सा डेटा उपयोग किया जाता है?',
    sec1Text: 'केवल विद्यार्थी का नाम, रोल नंबर, कक्षा और गणितीय प्रश्नों के उत्तर। कोई बायोमेट्रिक, आधार, फोटो या अन्य व्यक्तिगत डेटा कभी एकत्र नहीं किया जाता है।',
    sec2Title: '2. उपयोग का उद्देश्य',
    sec2Text: 'केवल शिक्षक को यह समझने में सहायता करना कि बच्चा कहाँ अटक रहा है और 5-दिवसीय उपचारात्मक अभ्यास तैयार करना। इसका कोई व्यावसायिक उपयोग नहीं है।',
    sec3Title: '3. सुरक्षा एवं गोपनीयता',
    sec3Text: 'एआई सहायता के लिए केवल छद्म कोड (जैसे anon_4b8f) भेजा जाता है। बच्चे का नाम बाहरी सर्वर पर कभी नहीं भेजा जाता। गणितीय प्रश्न एवं समूह त्रुटि गणना बिना किसी पहचान के गुणवत्ता सुधार हेतु सहेजी जा सकती है। शून्य विज्ञापन, शून्य ट्रैकिंग।',
    sec4Title: '4. डेटा भंडारण अवधि',
    sec4Text: 'मूल्यांकन डेटा चालू शैक्षणिक सत्र के लिए रखा जाता है। अनाम सत्र सारांश 90 दिनों के बाद स्वतः हटा दिए जाते हैं; केवल गैर-व्यक्तिगत समूह आंकड़े रखे जाते हैं। (विधिक अधिवक्ता द्वारा समीक्षा अनिवार्य है)।',
    sec5Title: '5. डीपीएचपी अधिनियम 2023 के तहत अधिकार',
    sec5Text: 'आप अपने बच्चे के रिकॉर्ड देखने, सुधार का अनुरोध करने या डेटा हटाने की मांग करने के अधिकारी हैं। इसके लिए प्रधानाध्यापक से संपर्क करें।',
    parentSigLabel: 'माता-पिता / अभिभावक के हस्ताक्षर या अंगूठे का निशान:',
    dateLabel: 'दिनांक:',
    teacherSigLabel: 'कक्षा शिक्षक द्वारा सत्यापित (हस्ताक्षर):',
    childNameLabel: 'विद्यार्थी का नाम एवं रोल नंबर:'
  },
  te: {
    title: 'తల్లిదండ్రులు / సంరక్షకుల సమాచార పత్రం & అంగీకార రికార్డు',
    subtitle: '5వ తరగతి గణిత ప్రాథమిక మూల్యాంకనం | విద్యా సంవత్సరం 2026-2027',
    disclaimer: 'చట్టపరమైన ముసాయిదా: ఈ నమూనా భారత డిజిటల్ పర్సనల్ డేటా ప్రొటెక్షన్ యాక్ట్ 2023 నిబంధనల ప్రకారం తయారు చేయబడింది.',
    intro: 'గౌరవనీయులైన తల్లిదండ్రులకు, 5వ తరగతి గణితంలో విద్యార్థుల అభ్యసన లోపాలను గుర్తించి వారికి మెరుగైన అభ్యాసాన్ని అందించడానికి మా పాఠశాల శిక్షా-గ్యాప్ విధానాన్ని ఉపయోగిస్తోంది.',
    sec1Title: '1. విద్యార్థికి సంబంధించి ఏ వివరాలు తీసుకుంటారు?',
    sec1Text: 'విద్యార్థి పేరు, రోల్ నంబర్, తరగతి మరియు గణిత సమాధానాలు మాత్రమే. ఎటువంటి బయోమెట్రిక్ లేదా ఆధార్ వివరాలు సేకరించబడవు.',
    sec2Title: '2. సమాచారం ఉపయోగించే ఉద్దేశం',
    sec2Text: 'ఉపాధ్యాయులు విద్యార్థికి తగిన 5 రోజుల సాధన వర్క్‌షీట్‌లను రూపొందించడానికి మాత్రమే. వాణిజ్య ప్రయోజనాల కోసం కాదు.',
    sec3Title: '3. రక్షణ మరియు గోప్యత',
    sec3Text: 'ఏఐ విశ్లేషణ కోసం విద్యార్థి పేరు ఉపయోగించబడదు, కేవలం తాత్కాలిక కోడ్ మాత్రమే పంపబడుతుంది. గణిత ప్రశ్నల నాణ్యత మెరుగుదల కోసం అజ్ఞాత సంఖ్యా వివరాలు మాత్రమే భద్రపరచబడతాయి. ప్రకటనలు లేదా ట్రాకింగ్ ఉండవు.',
    sec4Title: '4. డేటా నిల్వ వ్యవధి',
    sec4Text: 'ప్రస్తుత విద్యా సంవత్సరానికి మాత్రమే విద్యా రికార్డులు భద్రపరచబడతాయి. అజ్ఞాత సెషన్ సారాంశాలు 90 రోజుల తర్వాత తొలగించబడతాయి, సమగ్ర గణాంకాలు మాత్రమే ఉంచబడతాయి. (న్యాయవాది సమీక్ష అవసరం).',
    sec5Title: '5. చట్టబద్ధమైన హక్కులు',
    sec5Text: 'మీరు ఎప్పుడైనా మీ పిల్లల రికార్డులను పరిశీలించవచ్చు మరియు సరిచేయమని కోరవచ్చు.',
    parentSigLabel: 'తల్లిదండ్రులు లేదా సంరక్షకుని సంతకం / వేలిముద్ర:',
    dateLabel: 'తేదీ:',
    teacherSigLabel: 'తరగతి ఉపాధ్యాయుని సంతకం:',
    childNameLabel: 'విద్యార్థి పేరు మరియు రోల్ నంబర్:'
  }
};

export default function GuardianNoticeClient() {
  const [lang, setLang] = useState<NoticeLanguage>('en');
  const [schoolName, setSchoolName] = useState('Government Primary School');
  const [contactInfo, setContactInfo] = useState(`Headmaster Office / ${siteConfig.contactEmail}`);
  const [isCopied, setIsCopied] = useState(false);

  const t = NOTICES[lang];

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t.title,
          text: `${t.title} - ${schoolName}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-card dark:bg-muted text-foreground font-sans p-4 sm:p-8 print:p-0 print:bg-white print:text-black">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="max-w-3xl mx-auto mb-6 print:hidden">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-mono uppercase text-muted-foreground dark:text-muted-foreground hover:underline min-h-[44px]"
          >
            <ArrowLeft size={16} />
            <span>Back to ShikshaGap</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="min-h-[44px] px-3 border border-border text-sm font-mono uppercase inline-flex items-center gap-1.5 hover:bg-muted dark:hover:bg-[#381f1c]"
              aria-label="Share notice template"
            >
              {isCopied ? <Check size={16} className="text-[var(--status-good)]" /> : <ShareNetwork size={16} />}
              <span className="hidden sm:inline">{isCopied ? 'Link Copied' : 'Share'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="min-h-[44px] px-4 bg-primary text-primary-foreground dark:bg-muted dark:text-foreground text-sm font-mono uppercase font-bold inline-flex items-center gap-1.5 border border-border"
            >
              <Printer size={16} />
              <span>Print A4 Notice</span>
            </button>
          </div>
        </div>

        {/* Configuration Toolbar */}
        <div className="mt-4 p-4 border border-border bg-card dark:bg-card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-mono uppercase tracking-wider font-bold">
              Notice Language:
            </span>
            <div className="flex gap-1" role="group" aria-label="Select notice language">
              <button
                onClick={() => setLang('en')}
                className={`min-h-[44px] px-3 text-sm font-mono uppercase border ${
                  lang === 'en'
                    ? 'bg-primary text-primary-foreground dark:bg-muted dark:text-foreground font-bold border-border'
                    : 'border-border hover:bg-muted'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`min-h-[44px] px-3 text-sm font-mono uppercase border ${
                  lang === 'hi'
                    ? 'bg-primary text-primary-foreground dark:bg-muted dark:text-foreground font-bold border-border'
                    : 'border-border hover:bg-muted'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLang('te')}
                className={`min-h-[44px] px-3 text-sm font-mono uppercase border ${
                  lang === 'te'
                    ? 'bg-primary text-primary-foreground dark:bg-muted dark:text-foreground font-bold border-border'
                    : 'border-border hover:bg-muted'
                }`}
              >
                తెలుగు
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
            <div>
              <label htmlFor="school-name-input" className="block text-sm font-mono uppercase text-muted-foreground dark:text-muted-foreground mb-1">
                School Name (Print Header)
              </label>
              <input
                id="school-name-input"
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full min-h-[44px] bg-card dark:bg-muted border border-border px-3 py-1.5 text-base sm:text-sm font-mono text-foreground"
              />
            </div>
            <div>
              <label htmlFor="contact-info-input" className="block text-sm font-mono uppercase text-muted-foreground dark:text-muted-foreground mb-1">
                Grievance Contact Phone / Email
              </label>
              <input
                id="contact-info-input"
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full min-h-[44px] bg-card dark:bg-muted border border-border px-3 py-1.5 text-base sm:text-sm font-mono text-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable Notice Sheet (Styled as an Official 1-Page A4 Document) */}
      <div className="max-w-3xl mx-auto border border-border bg-card dark:bg-card print:bg-white print:border-black print:text-black p-6 sm:p-10 shadow-none">
        {/* Document Header */}
        <div className="text-center pb-4 mb-4 border-b-2 border-border print:border-black">
          <div className="text-sm font-mono uppercase tracking-widest font-bold">
            {schoolName}
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold mt-1 tracking-tight text-foreground print:text-black dark:text-foreground">
            {t.title}
          </h1>
          <p className="text-sm font-mono text-muted-foreground dark:text-muted-foreground print:text-gray-700 mt-1">
            {t.subtitle}
          </p>
        </div>

        {/* Legal Draft Warning */}
        <div className="mb-4 p-2.5 border border-primary bg-primary text-primary-foreground/10 print:border-gray-400 print:bg-gray-100 text-sm text-foreground print:text-black leading-tight">
          <span className="font-bold text-primary print:text-black">NOTICE: </span>
          <span>{t.disclaimer}</span>
        </div>

        {/* Introductory Message */}
        <p className="text-sm sm:text-sm text-foreground print:text-black leading-relaxed mb-4">
          {t.intro}
        </p>

        {/* Structured Legal Disclosures */}
        <div className="space-y-3 text-sm sm:text-sm border-t border-b border-border print:border-black py-4 mb-6">
          <div>
            <h2 className="font-bold font-serif text-sm">{t.sec1Title}</h2>
            <p className="text-foreground/80 dark:text-muted-foreground print:text-black mt-0.5 leading-relaxed">{t.sec1Text}</p>
          </div>
          <div>
            <h2 className="font-bold font-serif text-sm">{t.sec2Title}</h2>
            <p className="text-foreground/80 dark:text-muted-foreground print:text-black mt-0.5 leading-relaxed">{t.sec2Text}</p>
          </div>
          <div>
            <h2 className="font-bold font-serif text-sm">{t.sec3Title}</h2>
            <p className="text-foreground/80 dark:text-muted-foreground print:text-black mt-0.5 leading-relaxed">{t.sec3Text}</p>
          </div>
          <div>
            <h2 className="font-bold font-serif text-sm">{t.sec4Title}</h2>
            <p className="text-foreground/80 dark:text-muted-foreground print:text-black mt-0.5 leading-relaxed">{t.sec4Text}</p>
          </div>
          <div>
            <h2 className="font-bold font-serif text-sm">{t.sec5Title}</h2>
            <p className="text-foreground/80 dark:text-muted-foreground print:text-black mt-0.5 leading-relaxed">{t.sec5Text}</p>
          </div>
        </div>

        {/* School Contact Reference */}
        <div className="text-sm font-mono text-muted-foreground dark:text-muted-foreground print:text-gray-700 mb-6">
          Institutional Contact for Inquiries: <span className="font-bold">{contactInfo}</span>
        </div>

        {/* Acknowledgement and Signature Block */}
        <div className="border border-border print:border-black p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-border print:border-black pb-3">
            <span className="text-sm font-mono font-bold">{t.childNameLabel}</span>
            <div className="w-full sm:w-64 border-b border-dotted border-border print:border-black h-5" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <div className="text-sm font-mono uppercase mb-8">{t.parentSigLabel}</div>
              <div className="border-b border-black h-1" />
              <div className="text-sm font-mono text-right mt-1">{t.dateLabel} _______________</div>
            </div>
            <div>
              <div className="text-sm font-mono uppercase mb-8">{t.teacherSigLabel}</div>
              <div className="border-b border-black h-1" />
              <div className="text-sm font-mono text-right mt-1">{t.dateLabel} _______________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
