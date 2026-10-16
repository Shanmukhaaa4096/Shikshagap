import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DICTS } from '../src/lib/i18n/dict.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '..', 'src');

test('Priority 11: Student-First UI/UX Overhaul & Responsiveness Audit', async (t) => {
  const assessmentViewPath = path.join(srcDir, 'components', 'AdaptiveAssessmentView.tsx');
  const classSelectorPath = path.join(srcDir, 'components', 'ClassSelector.tsx');

  const assessmentCode = fs.readFileSync(assessmentViewPath, 'utf8');
  const classSelectorCode = fs.readFileSync(classSelectorPath, 'utf8');

  await t.test('1. Absence of Internal AI Jargon in Student Interface', () => {
    // Prohibited internal AI/diagnostic terms that should never be shown to students
    const prohibitedJargon = [
      'VERIFIED RAG ADVISOR',
      'difficulty staircase',
      'STAGE 01',
      'STAGE 02',
      'STAIRCASE DIAGNOSTIC',
      'INTERNAL REASONING ENGINE',
      'DEVELOPING GAP MATRIX'
    ];

    for (const phrase of prohibitedJargon) {
      assert.ok(
        !assessmentCode.includes(phrase),
        `Prohibited internal technical jargon "${phrase}" found in AdaptiveAssessmentView.tsx`
      );
    }
  });

  await t.test('2. Deficit-Free Constructive Language (No labeling children as weak/incapable)', () => {
    const deficitPhrases = [
      'weak student',
      'permanently weak',
      'incapable of',
      'failed topic',
      'failing student'
    ];

    for (const phrase of deficitPhrases) {
      assert.ok(
        !assessmentCode.toLowerCase().includes(phrase),
        `Deficit-oriented phrase "${phrase}" found in AdaptiveAssessmentView.tsx`
      );
    }

    // Results screen must use student-friendly, constructive sections
    assert.ok(
      assessmentCode.includes('What You Know Well'),
      'Results must include positive reinforcement section "What You Know Well"'
    );
    assert.ok(
      assessmentCode.includes('Next Topics to Practise'),
      'Results must include constructive action section "Next Topics to Practise"'
    );
  });

  await t.test('3. Mobile-First Touch Target Sizing (min-h >= 44px)', () => {
    // In AdaptiveAssessmentView, interactive options and primary action buttons must be comfortable
    assert.ok(
      assessmentCode.includes('min-h-[56px]'),
      'Assessment multiple-choice options must have at least 56px height for child-friendly touch targets'
    );
    assert.ok(
      assessmentCode.includes('min-h-[52px]') || assessmentCode.includes('min-h-[48px]'),
      'Assessment primary CTA button must have at least 48px/52px height'
    );

    // In ClassSelector, buttons must be min-h >= 44px
    assert.ok(
      classSelectorCode.includes('min-h-[44px]'),
      'ClassSelector buttons must meet the 44px minimum touch target standard'
    );
  });

  await t.test('4. Mobile-First Responsive Grid (Single column on narrow screens)', () => {
    // Assessment options must not be forced into a cramped 2-column grid on narrow viewports
    assert.ok(
      assessmentCode.includes('grid-cols-1'),
      'Assessment options grid must specify single column on mobile (grid-cols-1)'
    );
  });

  await t.test('5. Unobstructed Question Screen (Mascot banner not obstructing prompt)', () => {
    // Screen 2 (active question) must not duplicate the MascotHero banner above the question
    // MascotHero should only be on Screen 1 (setup) and Screen 3 (results celebration)
    const mascotCount = (assessmentCode.match(/<MascotHero/g) || []).length;
    assert.equal(
      mascotCount,
      2,
      'MascotHero should appear exactly twice: Screen 1 (setup) and Screen 3 (celebratory result)'
    );
  });

  await t.test('6. Verified Textbook Chapter Reference in Learning Recommendation', () => {
    assert.ok(
      assessmentCode.toLowerCase().includes('textbook') && assessmentCode.toLowerCase().includes('ncert'),
      'Results screen must reference verified textbook chapter recommendations'
    );
  });

  await t.test('7. Printable Practice Worksheet Action Available on Results Screen', () => {
    assert.ok(
      assessmentCode.includes('Print Practice Worksheet'),
      'Results screen must provide a direct "Print Practice Worksheet" button'
    );
    assert.ok(
      assessmentCode.includes('WorksheetModal'),
      'WorksheetModal must be integrated for printable practice offline materials'
    );
  });

  await t.test('8. Trilingual Completeness for Assessment Actions', () => {
    assert.ok(DICTS.en, 'English dictionary must exist');
    assert.ok(DICTS.hi, 'Hindi dictionary must exist');
    assert.ok(DICTS.te, 'Telugu dictionary must exist');

    assert.ok(DICTS.en.appName && DICTS.hi.appName && DICTS.te.appName);
    assert.ok(DICTS.en.startPractice && DICTS.hi.startPractice && DICTS.te.startPractice);
    assert.ok(DICTS.en.takeAssessment && DICTS.hi.takeAssessment && DICTS.te.takeAssessment);
  });

  await t.test('9. Class 1-10 Curriculum Coverage in ClassSelector', () => {
    assert.ok(
      classSelectorCode.includes('upcomingClasses'),
      'ClassSelector must dynamically manage upcoming classes'
    );
    assert.ok(
      classSelectorCode.includes('SUPPORTED_CLASSES'),
      'ClassSelector must bind to SUPPORTED_CLASSES'
    );
  });
});
