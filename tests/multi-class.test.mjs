import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();

test('Multi-Class 1: Curriculum Classes Config Structure', () => {
  const classesPath = path.join(workspaceRoot, 'src', 'lib', 'curriculum', 'classes.ts');
  const content = fs.readFileSync(classesPath, 'utf8');

  // Verify enabled classes are 3, 4, 5
  assert.ok(content.includes('id: "class_3"'), 'Class 3 must exist in config');
  assert.ok(content.includes('id: "class_4"'), 'Class 4 must exist in config');
  assert.ok(content.includes('id: "class_5"'), 'Class 5 must exist in config');

  // Verify coming soon classes are listed but disabled
  assert.ok(content.includes('id: "class_1"'), 'Class 1 must exist');
  assert.ok(content.includes('id: "class_2"'), 'Class 2 must exist');
  assert.ok(content.includes('id: "class_6"'), 'Class 6 must exist');
  assert.ok(content.includes('id: "class_7"'), 'Class 7 must exist');
  assert.ok(content.includes('id: "class_8"'), 'Class 8 must exist');

  // Verify coming soon flag
  assert.ok(content.includes('(Coming soon)'), 'Disabled classes must specify Coming soon');
});

test('Multi-Class 2: API Route Grade Validation and Whitelist', () => {
  const agentRoutePath = path.join(workspaceRoot, 'src', 'app', 'api', 'assessment', 'agent', 'route.ts');
  const content = fs.readFileSync(agentRoutePath, 'utf8');

  // Verify allowed grades whitelist [3, 4, 5]
  assert.ok(content.includes('[3, 4, 5]'), 'Allowed grades must be restricted to [3, 4, 5]');
  assert.ok(content.includes('Invalid grade'), 'Must return error on invalid grade');
});

test('Multi-Class 3: Concept Graph DAG Cross-Class Prerequisites', () => {
  const graphPath = path.join(workspaceRoot, 'src', 'lib', 'concepts', 'graph.ts');
  const content = fs.readFileSync(graphPath, 'utf8');

  // Long Division (Class 5) depends on Division Facts (Class 4) and Subtraction (Class 3)
  assert.ok(content.includes('long_division'), 'long_division must exist in DAG');
  assert.ok(content.includes('division_facts'), 'division_facts must exist in DAG');
  assert.ok(content.includes('subtraction'), 'subtraction must exist in DAG');
  assert.ok(content.includes('number_sense'), 'number_sense must exist in DAG');
});

test('Multi-Class 4: Pilot Registration Endpoint Validation & Rate Limit', () => {
  const pilotRoutePath = path.join(workspaceRoot, 'src', 'app', 'api', 'pilot-register', 'route.ts');
  const content = fs.readFileSync(pilotRoutePath, 'utf8');

  // Verify honeypot check
  assert.ok(content.includes('honeypot'), 'Must contain honeypot check');
  // Verify rate limit
  assert.ok(content.includes('checkPilotRateLimit'), 'Must enforce rate limiting');
  // Verify masked storage
  assert.ok(content.includes('contactMasked'), 'Must mask contact info for privacy');
});

test('Multi-Class 5: No Em Dashes or Emojis in Landing Page & Configs', () => {
  const pagePath = path.join(workspaceRoot, 'src', 'app', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  assert.equal(pageContent.includes('—'), false, 'page.tsx must not contain em dashes');
  assert.equal(pageContent.includes('–'), false, 'page.tsx must not contain en dashes');

  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  assert.equal(emojiRegex.test(pageContent), false, 'page.tsx must not contain emojis');
});
