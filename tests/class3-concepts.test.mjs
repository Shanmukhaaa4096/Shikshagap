import test from 'node:test';
import assert from 'node:assert/strict';
import { CONCEPTS } from '../src/lib/concepts/graph.ts';
import { SUPPORTED_CLASSES } from '../src/lib/curriculum/classes.ts';
import { SKILL_SHEET } from '../src/data/skillSheet.ts';
import { generateQuestion } from '../src/lib/questions/generator.ts';
import { makeRng } from '../src/lib/rng.ts';

const NEW_CLASS3_CONCEPTS = [
  'addition_3digit',
  'subtraction_3digit',
  'division_sharing',
  'money_math',
];

test('Step 4: All 4 new Class 3 concepts are marked needsTeacherCheck: true in graph.ts', () => {
  for (const cid of NEW_CLASS3_CONCEPTS) {
    const concept = CONCEPTS[cid];
    assert.ok(concept, `Concept ${cid} must exist in CONCEPTS`);
    assert.equal(concept.needsTeacherCheck, true, `Concept ${cid} must have needsTeacherCheck: true`);
    assert.equal(concept.grade, 3);
  }
});

test('Step 4: All 4 new Class 3 concepts are marked needsTeacherCheck: true in skillSheet.ts', () => {
  for (const cid of NEW_CLASS3_CONCEPTS) {
    const entry = SKILL_SHEET.find((s) => s.conceptId === cid && s.grade === 3);
    assert.ok(entry, `Concept ${cid} must exist in SKILL_SHEET for grade 3`);
    assert.equal(entry.needsTeacherCheck, true, `Concept ${cid} in skill sheet must have needsTeacherCheck: true`);
    assert.ok(entry.outcome.length > 0, `Outcome must not be empty`);
  }
});

test('Step 4: Class 3 curriculum in classes.ts includes all 4 new concepts in targetConcepts', () => {
  const class3 = SUPPORTED_CLASSES.find((c) => c.id === 'class_3');
  assert.ok(class3, 'class_3 must be supported');
  for (const cid of NEW_CLASS3_CONCEPTS) {
    assert.ok(
      class3.targetConcepts.includes(cid),
      `class_3 targetConcepts must include ${cid}`
    );
  }
});

test('Step 4: Generated questions have computed answers and misconception distractors', () => {
  const rng = makeRng(4242);
  for (const cid of NEW_CLASS3_CONCEPTS) {
    for (const d of [1, 2, 3]) {
      const q = generateQuestion(cid, d, rng, 3);
      assert.equal(q.conceptId, cid);
      assert.equal(q.difficulty, d);
      assert.ok(q.answer !== undefined && q.answer !== '', 'Computed answer must exist');
      assert.ok(q.meta, 'Question meta must exist');
      assert.ok(q.meta.bugs, 'Misconception bugs must exist in meta');
      const bugKeys = Object.keys(q.meta.bugs);
      assert.ok(bugKeys.length > 0, `Concept ${cid} level ${d} must include computed misconception distractors`);
    }
  }
});
