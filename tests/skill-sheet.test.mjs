import test from 'node:test';
import assert from 'node:assert/strict';
import { SKILL_SHEET, getSkillEntry, getSkillRange } from '../src/data/skillSheet.ts';

test('Skill Sheet: Classes 3, 4, and 5 coverage', () => {
  const grades = new Set(SKILL_SHEET.map((s) => s.grade));
  assert.ok(grades.has(3), 'Class 3 must be covered');
  assert.ok(grades.has(4), 'Class 4 must be covered');
  assert.ok(grades.has(5), 'Class 5 must be covered');
});

test('Skill Sheet: Outcomes are one-sentence in plain words with no empty entries', () => {
  for (const skill of SKILL_SHEET) {
    assert.ok(skill.outcome && skill.outcome.length > 20, `Outcome for ${skill.conceptId} (G${skill.grade}) too short`);
    assert.ok(skill.outcome.endsWith('.'), `Outcome for ${skill.conceptId} must end with period`);
    // Verify no textbook copy paste headers
    assert.equal(skill.outcome.includes('Chapter'), false);
    assert.equal(skill.outcome.includes('NCERT Math-Magic'), false);
  }
});

test('Skill Sheet: Every concept has valid ranges for difficulties 1, 2, and 3', () => {
  for (const skill of SKILL_SHEET) {
    for (const diff of [1, 2, 3]) {
      const range = skill.ranges[diff];
      assert.ok(range, `Range missing for ${skill.conceptId} (G${skill.grade}, L${diff})`);
      assert.ok(range.min < range.max, `min (${range.min}) must be < max (${range.max}) for ${skill.conceptId} (G${skill.grade}, L${diff})`);
      if (range.operandBMin !== undefined && range.operandBMax !== undefined) {
        assert.ok(range.operandBMin <= range.operandBMax, `operandBMin <= operandBMax for ${skill.conceptId}`);
      }
    }
  }
});

test('Skill Sheet: Unsure or newly introduced concepts are marked needsTeacherCheck: true', () => {
  const unsure = SKILL_SHEET.filter((s) => s.needsTeacherCheck === true);
  assert.ok(unsure.length > 0, 'Unsure concepts must have needsTeacherCheck: true');

  // Class 3 advanced/new items must be marked needsTeacherCheck
  const c3Add3 = getSkillEntry('addition_3digit', 3);
  assert.ok(c3Add3, 'addition_3digit must exist');
  assert.equal(c3Add3.needsTeacherCheck, true, 'addition_3digit must be marked needsTeacherCheck');

  const c3Money = getSkillEntry('money_math', 3);
  assert.ok(c3Money, 'money_math must exist');
  assert.equal(c3Money.needsTeacherCheck, true, 'money_math must be marked needsTeacherCheck');
});

test('Skill Sheet: getSkillRange helper provides valid bounds', () => {
  const r1 = getSkillRange('addition', 3, 1);
  assert.ok(r1.min > 0 && r1.max > r1.min);

  const r2 = getSkillRange('multi_digit_mult', 5, 2);
  assert.ok(r2.min > 0 && r2.max > r2.min);
});
