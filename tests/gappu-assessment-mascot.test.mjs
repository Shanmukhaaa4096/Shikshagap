import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DICTS } from '../src/lib/i18n/dict.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('Gappu Mascot on Assessment Screen: Component Presence & Interaction', () => {
  const viewFile = path.join(ROOT_DIR, 'src/components/AdaptiveAssessmentView.tsx');
  const content = fs.readFileSync(viewFile, 'utf8');

  assert.ok(content.includes('Gappu'), 'AdaptiveAssessmentView must import Gappu');
  assert.ok(content.includes('data-testid="gappu-companion-banner"'), 'Screen 2 must have Gappu companion banner');
  assert.ok(content.includes('data-testid="gappu-speech-bubble"'), 'Gappu must have a speech bubble or message area');
  assert.ok(content.includes('data-testid="star-streak-meter"'), 'Screen 2 must feature the star/streak meter');
});

test('Gappu Reaction Logic: Cheers on Correct and Gentle Encouragement on Error', () => {
  const viewFile = path.join(ROOT_DIR, 'src/components/AdaptiveAssessmentView.tsx');
  const content = fs.readFileSync(viewFile, 'utf8');

  assert.ok(content.includes('setGappuState("success")'), 'Gappu must transition to success state on correct answer');
  assert.ok(content.includes('setGappuState("thinking")'), 'Gappu must transition to thinking/encouraging state on error');
  assert.ok(content.includes('setStreak(nextStreak)'), 'Consecutive correct streak must increment on correct answer');
  assert.ok(content.includes('setStreak(0)'), 'Streak must reset on incorrect or dont-know answer');
});

test('Deficit-Free Language Guarantee: Zero Occurrences of "wrong" or "incorrect"', () => {
  const viewFile = path.join(ROOT_DIR, 'src/components/AdaptiveAssessmentView.tsx');
  const content = fs.readFileSync(viewFile, 'utf8');

  // Verify that the assessment UI never displays "wrong" or "incorrect" to students
  assert.ok(!content.includes('"Wrong"'), 'Assessment view must never render "Wrong"');
  assert.ok(!content.includes('"Incorrect"'), 'Assessment view must never render "Incorrect"');
  assert.ok(!content.includes('"wrong"'), 'Assessment view must never render "wrong"');
  assert.ok(!content.includes('"incorrect"'), 'Assessment view must never render "incorrect"');
});

test('Trilingual Completeness for Gappu Mascot & Streak Meter in English, Hindi, Telugu', () => {
  const languages = ['en', 'hi', 'te'];
  const requiredKeys = [
    'streakLabel',
    'streakCount',
    'gappuName',
    'gappuCheer1',
    'gappuCheer2',
    'gappuCheer3',
    'gappuCheerStreak',
    'gappuEncouragement1',
    'gappuEncouragement2',
    'gappuEncouragement3',
    'gappuThinkingPrompt',
    'incorrectFeedback',
  ];

  for (const lang of languages) {
    const langDict = DICTS[lang];
    assert.ok(langDict, `Dictionary for language "${lang}" must exist`);

    for (const key of requiredKeys) {
      assert.ok(langDict[key], `Language "${lang}" must contain key "${key}"`);
      assert.ok(langDict[key].trim().length > 0, `Value for "${lang}.${key}" must not be empty`);

      // Ensure no words like "wrong" or "incorrect" appear in any encouragement or feedback
      const lower = langDict[key].toLowerCase();
      assert.ok(!lower.includes('wrong'), `Key "${key}" in "${lang}" must not use the word "wrong"`);
      assert.ok(!lower.includes('incorrect'), `Key "${key}" in "${lang}" must not use the word "incorrect"`);
    }
  }

  // Explicit check for the kind phrase "Almost! Let's try it another way."
  assert.ok(DICTS.en.gappuEncouragement1.includes("Almost! Let's try it another way."));
  assert.ok(DICTS.en.incorrectFeedback.includes("Almost! Let's try it another way."));
});
