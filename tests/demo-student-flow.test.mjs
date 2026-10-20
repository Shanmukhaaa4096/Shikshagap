import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DICTS } from '../src/lib/i18n/dict.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('Demo Student Flow: Preset Class 5 Profile in demo.ts', () => {
  const demoFile = path.join(ROOT_DIR, 'src/lib/data/demo.ts');
  const content = fs.readFileSync(demoFile, 'utf8');

  assert.ok(content.includes('export function getPresetClass5Student()'), 'demo.ts must export getPresetClass5Student()');
  assert.ok(content.includes('class_5'), 'Preset student must be for class_5');
  assert.ok(content.includes('Ravi Kumar'), 'Preset student name should be Ravi Kumar');
  assert.ok(content.includes('mult_facts'), 'Preset student should have mult_facts root cause for gap tracing');
});

test('Demo Student Flow: Trilingual Completeness for All New Keys', () => {
  const languages = ['en', 'hi', 'te'];
  const keys = ['tryAsStudent', 'demoModeBadge', 'demoStudentLabel', 'viewReportBtn'];

  for (const lang of languages) {
    const langDict = DICTS[lang];
    assert.ok(langDict, `Dictionary for language ${lang} must exist`);
    for (const key of keys) {
      assert.ok(langDict[key], `Dictionary for ${lang} must contain key "${key}"`);
      assert.ok(langDict[key].trim().length > 0, `Dictionary value for ${lang}.${key} must not be empty`);
    }
  }
});

test('Demo Student Flow: Landing Page CTA and Accessibility', () => {
  const landingFile = path.join(ROOT_DIR, 'src/app/LandingPageClient.tsx');
  const content = fs.readFileSync(landingFile, 'utf8');

  assert.ok(content.includes('tryAsStudent'), 'Landing page must reference tryAsStudent dictionary string');
  assert.ok(content.includes('/assessment?demo=student&class=class_5'), 'Landing page must route to assessment with demo=student and class=class_5');
  assert.ok(content.includes('min-h-['), 'Landing page buttons must have accessible touch targets');
});

test('Demo Student Flow: Assessment Page Demo Integration', () => {
  const clientFile = path.join(ROOT_DIR, 'src/app/assessment/AssessmentClient.tsx');
  const content = fs.readFileSync(clientFile, 'utf8');

  assert.ok(content.includes('demoModeBadge'), 'AssessmentClient must display demoModeBadge');
  assert.ok(content.includes('tryAsStudent'), 'AssessmentClient must provide tryAsStudent CTA');
  assert.ok(content.includes('isDemoMode'), 'AssessmentClient must detect demo mode');
});

test('Demo Student Flow: AdaptiveAssessmentView End-to-End No-Signup Flow', () => {
  const viewFile = path.join(ROOT_DIR, 'src/components/AdaptiveAssessmentView.tsx');
  const content = fs.readFileSync(viewFile, 'utf8');

  assert.ok(content.includes('isDemoMode'), 'AdaptiveAssessmentView must accept isDemoMode');
  assert.ok(content.includes('demoModeBadge'), 'AdaptiveAssessmentView must show demoModeBadge');
  assert.ok(content.includes('getPresetClass5Student'), 'AdaptiveAssessmentView must use preset Class 5 student');
  assert.ok(content.includes('view-full-report-btn'), 'AdaptiveAssessmentView must provide view-full-report-btn for demo and guest users');
  assert.ok(content.includes('StudentDiagnosticModal'), 'AdaptiveAssessmentView must wire StudentDiagnosticModal for gap trace/report');
  assert.ok(content.includes('WorksheetModal'), 'AdaptiveAssessmentView must wire WorksheetModal for practice');

  // Verify that neither signup nor login prompts are required on results in demo mode
  assert.ok(!content.includes('Sign up to view report'), 'No signup block in report action');
  assert.ok(!content.includes('Register to continue'), 'No registration barrier');
});
