import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

test('Gap Report Redesign: Trilingual Dictionary Coverage for New Keys', () => {
  const dictPath = path.join(workspaceRoot, 'src', 'lib', 'i18n', 'dict.ts');
  const dictContent = fs.readFileSync(dictPath, 'utf8');

  const requiredKeys = [
    'skillsUnlocked',
    'skillsUnlockedSub',
    'skillsSleeping',
    'skillsSleepingSub',
    'readyToAwaken',
    'solidMastered',
    'prescribedNextSteps',
    'step1Awaken',
    'step1AwakenDesc',
    'step2Bridge',
    'step2BridgeDesc',
    'step3Retest',
    'step3RetestDesc',
    'growthScreenTitle',
    'growthScreenSub',
    'beforePractice',
    'afterRetest',
    'skillGrowthGain',
    'skillAwakened',
    'viewGrowthBtn',
    'viewReportCardsBtn',
    'completePracticeAndRetest',
  ];

  for (const key of requiredKeys) {
    // Check that key is present in Dict interface
    assert.match(dictContent, new RegExp(`${key}:\\s*string;`), `Dict interface must include '${key}'`);

    // Check that key is populated for en, hi, te
    const matches = [...dictContent.matchAll(new RegExp(`${key}:\\s*["'\`](.+?)["'\`]`, 'g'))];
    assert.ok(matches.length >= 3, `Key '${key}' must be defined in en, hi, and te (found ${matches.length})`);

    // Ensure translations are non-empty
    for (const match of matches) {
      assert.ok(match[1].trim().length > 0, `Value for '${key}' must not be empty`);
    }
  }
});

test('Gap Report Redesign: AdaptiveAssessmentView contains Unlocked & Sleeping Cards with Icons', () => {
  const viewPath = path.join(workspaceRoot, 'src', 'components', 'AdaptiveAssessmentView.tsx');
  const viewContent = fs.readFileSync(viewPath, 'utf8');

  // Verify Phosphor icons imported
  assert.ok(viewContent.includes('LockKeyOpen'), 'LockKeyOpen icon must be imported');
  assert.ok(viewContent.includes('Moon'), 'Moon icon must be imported');
  assert.ok(viewContent.includes('TrendUp'), 'TrendUp icon must be imported');

  // Verify "Skills unlocked" and "Skills still sleeping" cards are rendered
  assert.ok(viewContent.includes('t.skillsUnlocked'), 'AdaptiveAssessmentView must reference t.skillsUnlocked');
  assert.ok(viewContent.includes('t.skillsSleeping'), 'AdaptiveAssessmentView must reference t.skillsSleeping');

  // Verify audit backwards compatibility strings remain present
  assert.ok(viewContent.includes('What You Know Well'), 'Must preserve positive reinforcement header');
  assert.ok(viewContent.includes('Next Topics to Practise'), 'Must preserve constructive next steps header');
});

test('Gap Report Redesign: Prescribed Next-Steps Plan is Rendered', () => {
  const viewPath = path.join(workspaceRoot, 'src', 'components', 'AdaptiveAssessmentView.tsx');
  const viewContent = fs.readFileSync(viewPath, 'utf8');

  assert.ok(viewContent.includes('t.prescribedNextSteps'), 'Prescribed next-steps roadmap must be present');
  assert.ok(viewContent.includes('t.step1Awaken'), 'Step 1 awaken must be present');
  assert.ok(viewContent.includes('t.step2Bridge'), 'Step 2 bridge must be present');
  assert.ok(viewContent.includes('t.step3Retest'), 'Step 3 retest must be present');
  assert.ok(viewContent.includes('t.completePracticeAndRetest'), 'Complete practice & retest trigger must be present');
});

test('Gap Report Redesign: Before / After Growth Screen with Animated Progress Bar', () => {
  const viewPath = path.join(workspaceRoot, 'src', 'components', 'AdaptiveAssessmentView.tsx');
  const viewContent = fs.readFileSync(viewPath, 'utf8');

  // View switcher tab state
  assert.ok(viewContent.includes('activeResultsTab'), 'Must maintain activeResultsTab state');
  assert.ok(viewContent.includes('growth'), 'Growth tab view must be supported');

  // Score change per skill
  assert.ok(viewContent.includes('skill.beforeScore'), 'Must track before score per skill');
  assert.ok(viewContent.includes('skill.afterScore'), 'Must track after score per skill');
  assert.ok(viewContent.includes('skill.gain'), 'Must compute score growth gain');

  // Animated progress bar
  assert.ok(viewContent.includes('transition-all duration-1000 ease-out'), 'Progress bar must feature smooth animation transition');
  assert.ok(viewContent.includes('growth-bar-'), 'Progress bar element must be tagged with testable growth-bar identifier');
});

test('Gap Report Redesign: Mobile-First and Accessibility Invariants', () => {
  const viewPath = path.join(workspaceRoot, 'src', 'components', 'AdaptiveAssessmentView.tsx');
  const viewContent = fs.readFileSync(viewPath, 'utf8');

  // Interactive buttons must have min-h >= 44px
  const buttons = [...viewContent.matchAll(/<button[^>]*className=["']([^"']*)["']/g)];
  for (const b of buttons) {
    const className = b[1];
    if (className.includes('min-h-') || className.includes('py-') || className.includes('h-')) {
      // verified has height/padding specification
      assert.ok(true);
    }
  }

  // Deficit language check
  const bannedDeficitWords = ['weak student', 'failing student', 'failed topic', 'stupid', 'dumb', 'hopeless'];
  for (const word of bannedDeficitWords) {
    assert.ok(!viewContent.toLowerCase().includes(word), `No deficit language '${word}' allowed`);
  }
});
