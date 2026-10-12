import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQuestion } from '../src/lib/questions/generator.ts';
import { makeRng } from '../src/lib/rng.ts';
import { getSkillRange, SKILL_SHEET } from '../src/data/skillSheet.ts';

const GRADES = [3, 4, 5];

for (const grade of GRADES) {
  const gradeSkills = SKILL_SHEET.filter((s) => s.grade === grade);

  for (const skill of gradeSkills) {
    const conceptId = skill.conceptId;

    test(`Grade ${grade} Concept ${conceptId}: 200 random questions verify ranges and correct answers`, () => {
      const rng = makeRng(1000 * grade + conceptId.length * 37);

      for (let i = 0; i < 200; i++) {
        const difficulty = ((i % 3) + 1); // 1, 2, 3
        const q = generateQuestion(conceptId, difficulty, rng, grade);

        assert.equal(q.conceptId, conceptId);
        assert.equal(q.difficulty, difficulty);
        assert.ok(q.answer !== undefined && q.answer !== '', 'Answer must be defined');

        const range = getSkillRange(conceptId, grade, difficulty);

        // Check operands within range when meta numbers are present
        if (typeof q.meta?.a === 'number') {
          assert.ok(
            q.meta.a >= range.min && q.meta.a <= range.max,
            `G${grade} ${conceptId} L${difficulty}: operand a (${q.meta.a}) outside [${range.min}, ${range.max}] on iter ${i}`
          );
        }
        if (typeof q.meta?.b === 'number' && range.operandBMin !== undefined && range.operandBMax !== undefined) {
          assert.ok(
            q.meta.b >= range.operandBMin && q.meta.b <= range.operandBMax,
            `G${grade} ${conceptId} L${difficulty}: operand b (${q.meta.b}) outside [${range.operandBMin}, ${range.operandBMax}] on iter ${i}`
          );
        }

        // Verify correct answer is mathematically sound
        if (q.meta?.op === '+') {
          assert.equal(Number(q.answer), q.meta.a + q.meta.b, `Addition answer mismatch on iter ${i}`);
        } else if (q.meta?.op === '-') {
          assert.equal(Number(q.answer), q.meta.a - q.meta.b, `Subtraction answer mismatch on iter ${i}`);
        } else if (q.meta?.op === 'x') {
          if (conceptId === 'mult_facts' && difficulty === 3) {
            // ? in factor position: expression is `a * ? = a * b`, answer is b
            assert.equal(Number(q.answer), q.meta.b);
          } else {
            assert.equal(Number(q.answer), q.meta.a * q.meta.b, `Multiplication answer mismatch on iter ${i}`);
          }
        } else if (q.meta?.op === '/') {
          if (conceptId === 'long_division' && difficulty === 3) {
            // Remainder test
            assert.equal(Number(q.answer), q.meta.a % q.meta.b, `Remainder answer mismatch on iter ${i}`);
          } else if (conceptId === 'division_facts' && difficulty === 3) {
            // Expression `? ÷ b = q`, answer is a (the dividend)
            assert.equal(Number(q.answer), q.meta.a, `Division dividend mismatch on iter ${i}`);
          } else {
            assert.equal(Number(q.answer), Math.floor(q.meta.a / q.meta.b), `Division answer mismatch on iter ${i}`);
          }
        } else if (conceptId === 'number_sense') {
          if (difficulty === 1) {
            assert.equal(Number(q.answer), Math.max(q.meta.a, q.meta.b));
          } else if (difficulty === 3) {
            assert.equal(Number(q.answer), q.meta.a + 1);
          }
        }
      }
    });
  }
}
