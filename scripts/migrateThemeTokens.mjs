import fs from 'fs';

export function migrateContent(content, isIllustration = false) {
  let file = content;

  if (isIllustration) {
    // Exact 5-color palette mapping for SVG illustrations:
    // Burgundy: #36151E
    // Off-white: #EEF0F2
    // Stone: #C6C7C4
    // Mauve: #A2999E
    // Coral: #F56276
    file = file.replace(/#432623/gi, '#36151E');
    file = file.replace(/#FAF8E8/gi, '#EEF0F2');
    file = file.replace(/#F5F1BC/gi, '#EEF0F2');
    file = file.replace(/#DE2A35/gi, '#F56276');
    file = file.replace(/#B51E28/gi, '#36151E');
    file = file.replace(/#8ABB93/gi, '#A2999E');
    file = file.replace(/#DFA06E/gi, '#C6C7C4');
    file = file.replace(/#251614/gi, '#36151E');
    file = file.replace(/#311E1B/gi, '#250D15');
    file = file.replace(/#381f1c/gi, '#250D15');
    return file;
  }

  // 1. Double/paired classes
  file = file.replace(/bg-\[#FAF8E8\]\s+dark:bg-\[#432623\]\/\d+/g, 'bg-card');
  file = file.replace(/bg-\[#FAF8E8\]\s+dark:bg-\[#251614\]/g, 'bg-card');
  file = file.replace(/bg-\[#FAF8E8\]\s+dark:bg-\[#311E1B\]/g, 'bg-card');
  file = file.replace(/bg-\[#FAF8E8\]\s+dark:bg-\[#381f1c\]/g, 'bg-card');
  file = file.replace(/dark:bg-\[#381f1c\]/g, 'dark:bg-card');
  file = file.replace(/dark:bg-\[#251614\]/g, 'dark:bg-card');
  file = file.replace(/dark:bg-\[#311E1B\](?:\/\d+)?/g, 'dark:bg-card');
  file = file.replace(/dark:bg-\[#432623\](?:\/\d+)?/g, 'dark:bg-card');

  // 2. Buttons with active dark/light state
  file = file.replace(/bg-\[#432623\]\s+text-\[#F5F1BC\]\s+border-\[#432623\]/g, 'bg-primary text-primary-foreground border-primary');
  file = file.replace(/bg-\[#432623\]\s+text-\[#F5F1BC\]/g, 'bg-primary text-primary-foreground');
  file = file.replace(/bg-\[#432623\]\s+text-\[#FAF8E8\]/g, 'bg-foreground text-background');

  // 3. Status Badges & Indicators
  file = file.replace(/bg-\[#8ABB93\]\/20\s+text-\[#432623\](?:\s+dark:text-\[#(?:FAF8E8|F5F1BC)\])?\s+border\s+border-\[#8ABB93\]\/40/g, 'bg-[var(--status-good-bg)] text-[var(--status-good)] border border-[var(--status-good-border)]');
  file = file.replace(/bg-\[#8ABB93\]\/20\s+border\s+border-\[#8ABB93\]\s+text-\[#432623\]\s+font-bold/g, 'bg-[var(--status-good-bg)] text-[var(--status-good)] border border-[var(--status-good-border)] font-bold');
  file = file.replace(/bg-\[#8ABB93\]\/20/g, 'bg-[var(--status-good-bg)]');
  file = file.replace(/bg-\[#8ABB93\]\/15/g, 'bg-[var(--status-good-bg)]');
  file = file.replace(/border-\[#8ABB93\]\/60/g, 'border-[var(--status-good-border)]');
  file = file.replace(/border-\[#8ABB93\]\/40/g, 'border-[var(--status-good-border)]');
  file = file.replace(/border-\[#8ABB93\]\/30/g, 'border-[var(--status-good-border)]');
  file = file.replace(/border-\[#8ABB93\]/g, 'border-[var(--status-good-border)]');
  file = file.replace(/text-\[#8ABB93\]/g, 'text-[var(--status-good)]');
  file = file.replace(/bg-\[#8ABB93\]/g, 'bg-[var(--status-good)]');

  // Clay / Orange (Developing / In-Progress status)
  file = file.replace(/bg-\[#DFA06E\]\/20/g, 'bg-[var(--status-warn-bg)]');
  file = file.replace(/bg-\[#DFA06E\]\/15/g, 'bg-[var(--status-warn-bg)]');
  file = file.replace(/border-\[#DFA06E\]\/60/g, 'border-[var(--status-warn-border)]');
  file = file.replace(/border-\[#DFA06E\]\/40/g, 'border-[var(--status-warn-border)]');
  file = file.replace(/border-\[#DFA06E\]\/30/g, 'border-[var(--status-warn-border)]');
  file = file.replace(/border-\[#DFA06E\]/g, 'border-[var(--status-warn-border)]');
  file = file.replace(/text-\[#DFA06E\]/g, 'text-[var(--status-warn)]');
  file = file.replace(/bg-\[#DFA06E\]/g, 'bg-[var(--status-warn)]');

  // Red / Urgent (#DE2A35, #B51E28)
  file = file.replace(/border-\[#DE2A35\]\/40/g, 'border-primary/40');
  file = file.replace(/border-\[#DE2A35\]\/30/g, 'border-primary/40');
  file = file.replace(/border-\[#DE2A35\]\/25/g, 'border-primary/40');
  file = file.replace(/border-\[#DE2A35\]/g, 'border-primary');
  file = file.replace(/hover:border-\[#DE2A35\]\/30/g, 'hover:border-primary/40');
  file = file.replace(/focus:border-\[#DE2A35\]/g, 'focus:border-primary');
  file = file.replace(/text-\[#B51E28\]/g, 'text-primary');
  file = file.replace(/hover:text-\[#B51E28\]/g, 'hover:text-primary');
  file = file.replace(/text-\[#DE2A35\]/g, 'text-primary');
  file = file.replace(/bg-\[#DE2A35\]/g, 'bg-primary text-primary-foreground');
  file = file.replace(/bg-\[#B51E28\]/g, 'bg-primary text-primary-foreground');

  // Focus rings & divide
  file = file.replace(/focus:ring-\[#432623\]/g, 'focus:ring-primary');
  file = file.replace(/focus:ring-\[#DE2A35\]/g, 'focus:ring-primary');
  file = file.replace(/divide-\[#432623\]\/\d+/g, 'divide-border');
  file = file.replace(/dark:divide-\[#F5F1BC\]\/\d+/g, 'dark:divide-border');
  file = file.replace(/dark:border-\[#F5F1BC\](?:\/\d+)?/g, 'dark:border-border');

  // Text colors
  file = file.replace(/text-\[#432623\]\/(\d+)/g, (match, op) => {
    const n = parseInt(op, 10);
    if (n >= 80) return 'text-foreground/80';
    if (n >= 70) return 'text-muted-foreground';
    return 'text-muted-foreground';
  });
  file = file.replace(/text-\[#432623\]/g, 'text-foreground');
  file = file.replace(/dark:text-\[#FAF8E8\]\/\d+/g, 'dark:text-muted-foreground');
  file = file.replace(/dark:text-\[#FAF8E8\]/g, 'dark:text-foreground');
  file = file.replace(/dark:text-\[#F5F1BC\]\/\d+/g, 'dark:text-muted-foreground');
  file = file.replace(/dark:text-\[#F5F1BC\]/g, 'dark:text-foreground');

  // Icons / elements with leftover #F5F1BC / #FAF8E8 in text
  file = file.replace(/text-\[#F5F1BC\]/g, 'text-primary-foreground');
  file = file.replace(/text-\[#FAF8E8\]/g, 'text-primary-foreground');

  // Borders
  file = file.replace(/border-\[#432623\]\/\d+/g, 'border-border');
  file = file.replace(/border-\[#432623\]/g, 'border-border');
  file = file.replace(/dark:border-\[#FAF8E8\]\/\d+/g, 'dark:border-border');
  file = file.replace(/dark:border-\[#FAF8E8\]/g, 'dark:border-border');

  // Backgrounds & Hovers
  file = file.replace(/hover:bg-\[#F5F1BC\]\/\d+/g, 'hover:bg-muted');
  file = file.replace(/hover:bg-\[#F5F1BC\]/g, 'hover:bg-muted');
  file = file.replace(/dark:hover:bg-\[#311E1B\]/g, 'dark:hover:bg-muted');
  file = file.replace(/bg-\[#F5F1BC\]\/\d+/g, 'bg-muted');
  file = file.replace(/bg-\[#F5F1BC\]/g, 'bg-muted');
  file = file.replace(/bg-\[#FAF8E8\]/g, 'bg-card');
  file = file.replace(/bg-\[#432623\]\/15/g, 'bg-muted');
  file = file.replace(/bg-\[#432623\]\/10/g, 'bg-muted');
  file = file.replace(/bg-\[#432623\]\/20/g, 'bg-muted');
  file = file.replace(/bg-\[#432623\]\/30/g, 'bg-muted');
  file = file.replace(/bg-\[#432623\]\/40/g, 'bg-foreground/40');
  file = file.replace(/bg-\[#432623\]/g, 'bg-foreground text-background');

  // Clean artifact like "bg-primary text-primary-foreground text-primary-foreground"
  file = file.replace(/bg-primary\s+text-primary-foreground\s+text-primary-foreground/g, 'bg-primary text-primary-foreground');
  file = file.replace(/hover:bg-primary\s+text-primary-foreground\/90/g, 'hover:bg-primary/90');
  file = file.replace(/text-foreground\s+dark:text-foreground/g, 'text-foreground');
  file = file.replace(/border-border\s+dark:border-border/g, 'border-border');
  file = file.replace(/hover:bg-muted\s+dark:hover:bg-muted/g, 'hover:bg-muted');
  file = file.replace(/dark:hover:bg-foreground\s+text-background/g, 'dark:hover:bg-muted');
  file = file.replace(/hover:bg-foreground\s+text-background\/5/g, 'hover:bg-muted');
  file = file.replace(/dark:bg-foreground\s+text-background/g, 'dark:bg-muted');

  // Normalize duplicate classes and spacing in className="..."
  file = file.replace(/className=(["'])(.*?)\1/g, (match, quote, classes) => {
    const list = classes.split(/\s+/).filter(Boolean);
    const seen = new Set();
    const deduped = [];
    for (const c of list) {
      if (!seen.has(c)) {
        seen.add(c);
        deduped.push(c);
      }
    }
    return `className=${quote}${deduped.join(' ')}${quote}`;
  });

  return file;
}

if (process.argv[1] && process.argv[1].endsWith('migrateThemeTokens.mjs')) {
  const targetFiles = [
    'src/components/AdaptiveAssessmentView.tsx',
    'src/components/TeacherDashboard.tsx',
    'src/components/StudentHome.tsx',
    'src/components/StudentDiagnosticModal.tsx',
    'src/components/StateScreens.tsx',
    'src/components/Header.tsx',
    'src/components/ClassSelector.tsx',
    'src/components/OfflineSyncBanner.tsx',
    'src/components/CookieBanner.tsx',
    'src/components/BlinkingDots.tsx',
    'src/components/ui/dialog.tsx',
    'src/components/landing/LandingHowAgentWorksSection.tsx',
    'src/components/landing/LandingPilotSection.tsx',
    'src/components/landing/LandingBentoSection.tsx',
    'src/components/landing/LandingDemoSection.tsx',
    'src/components/landing/LandingFaqSection.tsx',
    'src/app/LandingPageClient.tsx',
    'src/app/login/LoginForm.tsx',
    'src/app/report/[token]/ReportClientView.tsx',
    'src/app/report/[token]/page.tsx',
    'src/app/how-it-works/HowItWorksClient.tsx',
    'src/app/data-request/DataRequestForm.tsx',
    'src/app/notices/guardian/GuardianNoticeClient.tsx',
    'src/app/not-found.tsx',
    'src/app/terms/page.tsx',
    'src/app/privacy/page.tsx',
    'src/app/cookies/page.tsx',
    'src/app/licenses/page.tsx',
    'src/app/app/page.tsx',
    'src/app/app/audit-log/page.tsx'
  ];

  const illustrationFiles = [
    'src/components/illustrations/MascotHero.tsx',
    'src/components/illustrations/BentoIllustrations.tsx',
    'src/components/illustrations/MathFloatingShapes.tsx',
    'src/components/illustrations/ProblemSolutionIllustrations.tsx',
    'src/components/illustrations/StateIllustrations.tsx',
    'src/components/illustrations/WorksheetPreviewIllustration.tsx'
  ];

  let totalUpdated = 0;
  for (const rel of targetFiles) {
    if (!fs.existsSync(rel)) continue;
    const orig = fs.readFileSync(rel, 'utf8');
    const migrated = migrateContent(orig, false);
    if (migrated !== orig) {
      fs.writeFileSync(rel, migrated, 'utf8');
      totalUpdated++;
      console.log(`Updated UI: ${rel}`);
    }
  }

  for (const rel of illustrationFiles) {
    if (!fs.existsSync(rel)) continue;
    const orig = fs.readFileSync(rel, 'utf8');
    const migrated = migrateContent(orig, true);
    if (migrated !== orig) {
      fs.writeFileSync(rel, migrated, 'utf8');
      totalUpdated++;
      console.log(`Updated Illustration: ${rel}`);
    }
  }

  console.log(`Migration complete. Updated ${totalUpdated} files.`);
}
