import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSessionMemory, applyAttemptToMemory, advanceToNextTopic, normalizeQuestionText, getQuestionText } from '../src/lib/agents/staircase.ts';
import { getMultiBoardQuestion } from '../src/lib/questions/multiBoardBank.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('Landing Page: Single clear "Start assessment" button with no login/signup required', () => {
  const landingFile = path.join(ROOT_DIR, 'src/app/LandingPageClient.tsx');
  const content = fs.readFileSync(landingFile, 'utf8');

  // Verify "Try as a student" is removed
  assert.ok(!content.includes('tryAsStudent'), 'Landing page must not contain tryAsStudent');
  assert.ok(!content.includes('demo=student'), 'Landing page must not route to demo=student');
  assert.ok(!content.includes('mode=demo'), 'Landing page must not route to mode=demo');

  // Verify clear Start assessment CTA exists and links to /assessment
  assert.ok(content.includes('Start assessment'), 'Landing page must contain Start assessment button');
  assert.ok(content.includes('href="/assessment"'), 'Landing page must have clear link to /assessment');
  assert.ok(content.includes('min-h-['), 'Landing page buttons must have accessible touch targets');
});

test('Assessment Screen: No demo mode badges or "Try as a student" buttons', () => {
  const assessmentClientFile = path.join(ROOT_DIR, 'src/app/assessment/AssessmentClient.tsx');
  const viewFile = path.join(ROOT_DIR, 'src/components/AdaptiveAssessmentView.tsx');

  const clientContent = fs.readFileSync(assessmentClientFile, 'utf8');
  const viewContent = fs.readFileSync(viewFile, 'utf8');

  // Verify demo badges removed
  assert.ok(!clientContent.includes('demoModeBadge'), 'AssessmentClient must not show demoModeBadge');
  assert.ok(!clientContent.includes('tryAsStudent'), 'AssessmentClient must not show tryAsStudent');
  assert.ok(!clientContent.includes('isDemoMode'), 'AssessmentClient must not have isDemoMode');

  assert.ok(!viewContent.includes('data-testid="screen1-demo-mode-badge"'), 'AdaptiveAssessmentView must not contain screen1-demo-mode-badge');
  assert.ok(!viewContent.includes('data-testid="results-demo-mode-badge"'), 'AdaptiveAssessmentView must not contain results-demo-mode-badge');
  assert.ok(!viewContent.includes('data-testid="active-demo-mode-badge"'), 'AdaptiveAssessmentView must not contain active-demo-mode-badge');
  assert.ok(!viewContent.includes('data-testid="footer-try-as-student-btn"'), 'AdaptiveAssessmentView must not contain footer-try-as-student-btn');
  assert.ok(!viewContent.includes('data-testid="screen1-try-as-student-btn"'), 'AdaptiveAssessmentView must not contain screen1-try-as-student-btn');

  // Verify no login or signup gate
  assert.ok(!viewContent.includes('Sign up to view report'), 'No signup block in report action');
  assert.ok(!viewContent.includes('Register to continue'), 'No registration barrier');
});

test('Session Memory: askedQuestionIds and askedQuestionTexts are tracked and accumulated', () => {
  const mem = createSessionMemory('student_test_1', 5, 'en', ['large_numbers', 'multiplication', 'division']);
  assert.ok(Array.isArray(mem.askedQuestionIds), 'askedQuestionIds must be initialized as an array');
  assert.ok(Array.isArray(mem.askedQuestionTexts), 'askedQuestionTexts must be initialized as an array');
  assert.equal(mem.askedQuestionIds.length, 0, 'Initially askedQuestionIds must be empty');

  // Apply attempt
  const attempt = {
    conceptId: 'c5_num_placeval_large',
    level: 3,
    questionId: 'ncert_m5_ch1_01_s1_1234567',
    questionText: 'What is the place value of 7 in 74,520?',
    studentAnswer: '70000',
    correct: true,
  };

  const { memory: updatedMem } = applyAttemptToMemory(mem, attempt);
  assert.ok(updatedMem.askedQuestionIds.includes('ncert_m5_ch1_01_s1_1234567'), 'askedQuestionIds must include the full question ID');
  assert.ok(updatedMem.askedQuestionIds.includes('ncert_m5_ch1_01'), 'askedQuestionIds must include base question ID');
  assert.ok(updatedMem.askedQuestionTexts.length > 0, 'askedQuestionTexts must record normalized question text');
});

test('Question Picker: Excludes asked question IDs and identical question texts', () => {
  const q1 = getMultiBoardQuestion({
    class: 5,
    conceptId: 'c5_num_placeval_large',
    difficulty: 3,
    board: 'CBSE',
  }, 'en');

  assert.ok(q1, 'Question 1 should be found');
  const baseId = q1.id.split('_s')[0];
  const q1Text = normalizeQuestionText(getQuestionText(q1, 'en'));

  // Now query with excludeIds including baseId and stamped ID, and excludeTexts
  const q2 = getMultiBoardQuestion({
    class: 5,
    conceptId: 'c5_num_placeval_large',
    difficulty: 3,
    board: 'CBSE',
    excludeIds: [q1.id, baseId],
    excludeTexts: [q1Text],
  }, 'en');

  if (q2) {
    const q2BaseId = q2.id.split('_s')[0];
    const q2Text = normalizeQuestionText(getQuestionText(q2, 'en'));
    assert.notEqual(q2BaseId, baseId, 'q2 base ID must differ from q1');
    assert.notEqual(q2Text, q1Text, 'q2 question text must differ from q1');
  }
});

test('Staircase Prerequisite & Topic Exhaustion: Advances to next topic when questions run out', () => {
  let mem = createSessionMemory('student_test_2', 5, 'en', ['division', 'multiplication', 'subtraction']);
  assert.equal(mem.currentTopicIndex, 0);

  // Manually advance topic
  const { memory: nextMem } = advanceToNextTopic(mem, 'Topic completed or out of questions');
  assert.equal(nextMem.currentTopicIndex, 1, 'Topic index should advance to 1');
  assert.equal(nextMem.topics[0].status, 'developing', 'Exhausted topic defaults to developing status');

  const { memory: thirdMem } = advanceToNextTopic(nextMem, 'Second topic completed');
  assert.equal(thirdMem.currentTopicIndex, 2, 'Topic index should advance to 2');
});

test('Question Text Safeguard: Normalization treats punctuation, whitespace and case equivalently', () => {
  const textA = 'What is 5 x 4?';
  const textB = '  what is 5 x 4  ';

  assert.equal(normalizeQuestionText(textA), normalizeQuestionText(textB), 'Whitespace and casing must normalize to equal');
});
