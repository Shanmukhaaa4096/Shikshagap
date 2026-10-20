import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '..', 'src');

test('Responsive Layout & Breakpoint Architecture (Mobile < 768px vs Desktop >= 1024px)', async (t) => {
  const assessmentViewPath = path.join(srcDir, 'components', 'AdaptiveAssessmentView.tsx');
  const sharedReportPath = path.join(srcDir, 'app', 'r', '[token]', 'SharedReportClient.tsx');
  const reportClientPath = path.join(srcDir, 'app', 'report', '[token]', 'ReportClientView.tsx');

  const assessmentCode = fs.readFileSync(assessmentViewPath, 'utf8');
  const sharedReportCode = fs.readFileSync(sharedReportPath, 'utf8');
  const reportClientCode = fs.readFileSync(reportClientPath, 'utf8');

  await t.test('1. Max Content Width & Container Constraints (Around 1200px on Desktop)', () => {
    // All 3 primary views must constrain container to max-w-[1200px] for desktop readability
    assert.ok(
      assessmentCode.includes('max-w-[1200px]'),
      'AdaptiveAssessmentView must specify max-w-[1200px] for generous, uncrowded desktop view'
    );
    assert.ok(
      sharedReportCode.includes('max-w-[1200px]'),
      'SharedReportClient must specify max-w-[1200px] for desktop layout'
    );
    assert.ok(
      reportClientCode.includes('max-w-[1200px]'),
      'ReportClientView must specify max-w-[1200px] for desktop layout'
    );
  });

  await t.test('2. Two-Column Desktop Architecture (Summary/Skills Left, Plan/Actions Right)', () => {
    // SharedReportClient: 12-col grid, col-span-7/8 left (skills/gap results), col-span-5/4 right (plan & share actions)
    assert.ok(
      sharedReportCode.includes('lg:grid-cols-12') &&
      (sharedReportCode.includes('lg:col-span-7') || sharedReportCode.includes('lg:col-span-8')) &&
      (sharedReportCode.includes('lg:col-span-5') || sharedReportCode.includes('lg:col-span-4')),
      'SharedReportClient must use 12-column desktop grid with left and right split'
    );

    // ReportClientView: 12-col grid, col-span-7/8 left, col-span-5/4 right
    assert.ok(
      reportClientCode.includes('lg:grid-cols-12') &&
      (reportClientCode.includes('lg:col-span-7') || reportClientCode.includes('lg:col-span-8')) &&
      (reportClientCode.includes('lg:col-span-5') || reportClientCode.includes('lg:col-span-4')),
      'ReportClientView must use 12-column desktop grid with left and right split'
    );

    // AdaptiveAssessmentView Screen 3 (Results): 12-col grid, left and right split
    assert.ok(
      assessmentCode.includes('lg:grid-cols-12') &&
      (assessmentCode.includes('lg:col-span-7') || assessmentCode.includes('lg:col-span-8')) &&
      (assessmentCode.includes('lg:col-span-5') || assessmentCode.includes('lg:col-span-4')),
      'AdaptiveAssessmentView results must use 12-column desktop grid with left and right split'
    );

    // Sticky desktop sidebars for plan & action cards
    assert.ok(
      sharedReportCode.includes('lg:sticky'),
      'SharedReportClient right column must be sticky on desktop'
    );
    assert.ok(
      reportClientCode.includes('lg:sticky'),
      'ReportClientView right column must be sticky on desktop'
    );
    assert.ok(
      assessmentCode.includes('lg:sticky'),
      'AdaptiveAssessmentView right column must be sticky on desktop'
    );
  });

  await t.test('3. Mobile Single Column Layout (< 768px)', () => {
    // Assessment options grid must be single column on mobile (grid-cols-1)
    assert.ok(
      assessmentCode.includes('grid-cols-1'),
      'Assessment options grid must be single column on mobile'
    );

    // All primary containers must be responsive without horizontal scroll
    assert.ok(
      sharedReportCode.includes('overflow-x-hidden'),
      'SharedReportClient must prevent horizontal scroll with overflow-x-hidden'
    );
    assert.ok(
      reportClientCode.includes('overflow-x-hidden'),
      'ReportClientView must prevent horizontal scroll with overflow-x-hidden'
    );
    assert.ok(
      assessmentCode.includes('overflow-x-hidden'),
      'AdaptiveAssessmentView must prevent horizontal scroll with overflow-x-hidden'
    );
  });

  await t.test('4. Sticky Bottom Action Buttons on Mobile (< 768px / lg:hidden)', () => {
    // SharedReportClient sticky mobile bottom bar
    assert.ok(
      sharedReportCode.includes('lg:hidden fixed bottom-0 left-0 right-0') ||
      (sharedReportCode.includes('fixed bottom-0') && sharedReportCode.includes('lg:hidden')),
      'SharedReportClient must have sticky mobile bottom action bar hidden on desktop'
    );

    // ReportClientView sticky mobile bottom bar
    assert.ok(
      reportClientCode.includes('lg:hidden fixed bottom-0 left-0 right-0') ||
      (reportClientCode.includes('fixed bottom-0') && reportClientCode.includes('lg:hidden')),
      'ReportClientView must have sticky mobile bottom action bar hidden on desktop'
    );

    // AdaptiveAssessmentView sticky mobile bottom bar on Screen 2 (Question) and Screen 3 (Results)
    assert.ok(
      assessmentCode.includes('mobile-sticky-share-btn'),
      'AdaptiveAssessmentView results must have mobile-sticky-share-btn in sticky bar'
    );
    assert.ok(
      assessmentCode.includes('mobile-sticky-next-btn') || assessmentCode.includes('mobile-sticky-submit-btn'),
      'AdaptiveAssessmentView active question must have mobile sticky CTA button'
    );
  });

  await t.test('5. Large Touch Target Sizing (min-h >= 44px)', () => {
    // Must feature 44px, 48px, 52px, and 56px touch target classes
    assert.ok(assessmentCode.includes('min-h-[44px]'), 'AdaptiveAssessmentView must have min-h-[44px]');
    assert.ok(assessmentCode.includes('min-h-[48px]'), 'AdaptiveAssessmentView must have min-h-[48px]');
    assert.ok(assessmentCode.includes('min-h-[52px]'), 'AdaptiveAssessmentView must have min-h-[52px]');
    assert.ok(assessmentCode.includes('min-h-[56px]'), 'AdaptiveAssessmentView must have min-h-[56px]');

    assert.ok(sharedReportCode.includes('min-h-[44px]'), 'SharedReportClient must have min-h-[44px]');
    assert.ok(sharedReportCode.includes('min-h-[48px]'), 'SharedReportClient must have min-h-[48px]');

    assert.ok(reportClientCode.includes('min-h-[44px]'), 'ReportClientView must have min-h-[44px]');
    assert.ok(reportClientCode.includes('min-h-[48px]'), 'ReportClientView must have min-h-[48px]');
  });

  await t.test('6. No Horizontal Overflow Violations at 375px, 768px, and 1440px', () => {
    // Ensure no fixed width styles like w-[800px], w-[600px], min-w-[500px] exist that cause overflow on 375px
    // Note: max-w-[1200px] or max-w-md are allowed because max-w is fluid and allows shrinking to 375px.
    const forbiddenWidthPatterns = [/(?<![a-zA-Z0-9_-])w-\[\d{3,4}px\]/g, /(?<![a-zA-Z0-9_-])min-w-\[\d{3,4}px\]/g];
    for (const code of [assessmentCode, sharedReportCode, reportClientCode]) {
      for (const pattern of forbiddenWidthPatterns) {
        const matches = code.match(pattern) || [];
        for (const match of matches) {
          // Assert no fixed width above 320px
          assert.fail(`Found rigid fixed width ${match} that risks mobile overflow on 375px screens`);
        }
      }
    }
  });

  await t.test('7. Viewport 375px (Mobile < 768px): Single-column, touch targets >= 44px, bottom padding for sticky bar', () => {
    // Ensure containers include bottom padding so sticky bottom bars never overlap content
    assert.ok(
      assessmentCode.includes('pb-28') || assessmentCode.includes('pb-24'),
      'AdaptiveAssessmentView must provide bottom clearance (pb-28 or pb-24) for mobile sticky bar'
    );
    assert.ok(
      sharedReportCode.includes('pb-28') || sharedReportCode.includes('pb-24'),
      'SharedReportClient must provide bottom clearance (pb-28) for mobile sticky bar'
    );
    assert.ok(
      reportClientCode.includes('pb-28') || reportClientCode.includes('pb-24'),
      'ReportClientView must provide bottom clearance (pb-28) for mobile sticky bar'
    );

    // Option touch targets must be comfortable on 375px (min-h-[56px] for choices, min-h-[44px] for buttons)
    assert.ok(
      assessmentCode.includes('min-h-[56px]'),
      'Options on mobile 375px must have min-h-[56px] target'
    );
  });

  await t.test('8. Viewport 768px (Tablet intermediate): Fluid options grid and flex wrapping', () => {
    // Assessment options transition to 2 columns on tablet (sm:grid-cols-2)
    assert.ok(
      assessmentCode.includes('sm:grid-cols-2'),
      'Assessment options should expand to 2-columns on tablet width (sm:grid-cols-2)'
    );

    // Results cards adapt to 2 columns on tablet (md:grid-cols-2)
    assert.ok(
      sharedReportCode.includes('md:grid-cols-2'),
      'SharedReportClient cards should adapt to 2 columns on tablet (md:grid-cols-2)'
    );
    assert.ok(
      reportClientCode.includes('md:grid-cols-2'),
      'ReportClientView cards should adapt to 2 columns on tablet (md:grid-cols-2)'
    );
  });

  await t.test('9. Viewport 1440px (Desktop >= 1024px): 2-column layout, max-w-[1200px], generous spacing, sticky panels', () => {
    // Desktop layout must not simply shrink mobile layout: uses 2-column grid with generous gap (lg:gap-8)
    assert.ok(
      assessmentCode.includes('lg:gap-8'),
      'AdaptiveAssessmentView must use generous spacing (lg:gap-8) on desktop'
    );
    assert.ok(
      sharedReportCode.includes('lg:gap-8'),
      'SharedReportClient must use generous spacing (lg:gap-8) on desktop'
    );
    assert.ok(
      reportClientCode.includes('lg:gap-8'),
      'ReportClientView must use generous spacing (lg:gap-8) on desktop'
    );

    // Sticky desktop sidebars for action & plan panels
    assert.ok(
      sharedReportCode.includes('lg:sticky lg:top-6 self-start'),
      'SharedReportClient right column must be sticky on desktop'
    );
    assert.ok(
      reportClientCode.includes('lg:sticky lg:top-6 self-start'),
      'ReportClientView right column must be sticky on desktop'
    );
    assert.ok(
      assessmentCode.includes('lg:sticky lg:top-6 self-start'),
      'AdaptiveAssessmentView right column must be sticky on desktop'
    );
  });
});
