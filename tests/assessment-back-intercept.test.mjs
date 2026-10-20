import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DICTS } from '../src/lib/i18n/dict.ts';
const { en, hi, te } = DICTS;

test('Assessment Back Button Interception & Confirmation Modal Specification', async (t) => {
  const componentPath = path.resolve('src/components/AdaptiveAssessmentView.tsx');
  const componentSource = fs.readFileSync(componentPath, 'utf8');

  await t.test('1. History Entry & Popstate Interception Logic', () => {
    // Must push history state when assessment starts / mounts
    assert.match(
      componentSource,
      /window\.history\.pushState\(\s*\{\s*assessmentActive:\s*true\s*\}\s*,\s*["']["']\s*,\s*window\.location\.href\s*\)/,
      'Assessment must push state entry to history stack'
    );

    // Must re-push state and open confirmation modal on popstate
    assert.match(
      componentSource,
      /window\.addEventListener\(["']popstate["']\s*,\s*handlePopState\)/,
      'Assessment must register popstate event listener'
    );
    assert.match(
      componentSource,
      /setIsExitModalOpen\(true\)/,
      'Must open exit confirmation modal on popstate / back button'
    );
  });

  await t.test('2. Beforeunload Warning on Refresh or Tab Close During Active Test', () => {
    assert.match(
      componentSource,
      /window\.addEventListener\(["']beforeunload["']\s*,\s*handleBeforeUnload\)/,
      'Assessment must register beforeunload event listener during active assessment'
    );
    assert.match(
      componentSource,
      /e\.preventDefault\(\)/,
      'Must call preventDefault on beforeunload'
    );
    assert.match(
      componentSource,
      /e\.returnValue\s*=\s*["']["']/,
      'Must set returnValue to trigger browser confirmation dialog'
    );
  });

  await t.test('3. Confirmation Modal UI Structure & Test IDs', () => {
    assert.ok(
      componentSource.includes('data-testid="continue-test-btn"'),
      'Must include continue-test-btn test id'
    );
    assert.ok(
      componentSource.includes('data-testid="quit-assessment-btn"'),
      'Must include quit-assessment-btn test id'
    );
    assert.ok(
      componentSource.includes('data-testid="in-app-back-btn"'),
      'Must include in-app-back-btn test id for active assessment screen'
    );
    assert.ok(
      componentSource.includes('role="dialog"'),
      'Confirmation modal must be an accessible dialog'
    );
  });

  await t.test('4. Progress Persistence & Storage Clearing on Quit', () => {
    // Saves to both sessionStorage and localStorage
    assert.match(
      componentSource,
      /sessionStorage\.setItem\(\s*sessionStorageKey\s*,/,
      'Must persist session to sessionStorage'
    );
    assert.match(
      componentSource,
      /localStorage\.setItem\(\s*sessionStorageKey\s*,/,
      'Must persist session to localStorage so continue resumes exactly where student was'
    );

    // Quit clears saved progress
    assert.match(
      componentSource,
      /sessionStorage\.removeItem\(\s*sessionStorageKey\s*\)/,
      'Must clear sessionStorage on quit'
    );
    assert.match(
      componentSource,
      /localStorage\.removeItem\(\s*sessionStorageKey\s*\)/,
      'Must clear localStorage on quit'
    );
  });

  await t.test('5. Trilingual Support (English, Hindi, Telugu) for Confirmation Modal', () => {
    const requiredKeys = [
      'continueTestModalTitle',
      'continueTestModalPrompt',
      'continueTestBtn',
      'quitAssessmentBtn',
      'back',
    ];

    for (const key of requiredKeys) {
      assert.ok(en[key], `English dictionary must contain ${key}`);
      assert.ok(hi[key], `Hindi dictionary must contain ${key}`);
      assert.ok(te[key], `Telugu dictionary must contain ${key}`);

      // English titles and button texts match prompt requirement
      assert.strictEqual(en.continueTestModalTitle, 'Continue the test?');
      assert.strictEqual(en.continueTestBtn, 'Continue test');
      assert.strictEqual(en.quitAssessmentBtn, 'Quit assessment');

      // Non-empty in Hindi & Telugu
      assert.ok(hi.continueTestModalTitle.length > 0);
      assert.ok(te.continueTestModalTitle.length > 0);
      assert.ok(hi.continueTestBtn.length > 0);
      assert.ok(te.continueTestBtn.length > 0);
      assert.ok(hi.quitAssessmentBtn.length > 0);
      assert.ok(te.quitAssessmentBtn.length > 0);
    }
  });

  await t.test('6. Mobile Touch-Friendliness Invariants', () => {
    // Check that buttons have min-h >= 44px
    assert.match(
      componentSource,
      /data-testid=["']continue-test-btn["'][\s\S]*?min-h-\[48px\]/,
      'continue-test-btn must have min-h of at least 44px (using min-h-[48px])'
    );
    assert.match(
      componentSource,
      /data-testid=["']quit-assessment-btn["'][\s\S]*?min-h-\[48px\]/,
      'quit-assessment-btn must have min-h of at least 44px (using min-h-[48px])'
    );
    assert.match(
      componentSource,
      /data-testid=["']in-app-back-btn["'][\s\S]*?min-h-\[44px\]/,
      'in-app-back-btn must have min-h of at least 44px'
    );
  });
});
