/**
 * Question Generator | produces parameterised, verifiable questions for each
 * concept at three difficulty levels. Correct answers and known misconception
 * answers ("bugs") are computed, never typed by hand, so every generated item
 * is guaranteed to be correct. Prompts are translation keys, so the same item
 * renders in English, Hindi and Telugu.
 */
import type {
  ConceptId,
  Difficulty,
  ErrorType,
  Option,
  Question,
  QuestionMeta,
  Txt,
  QuestionFormat,
} from "../types.ts";
import type { TKey } from "../i18n/keys.ts";
import { gcd, pick, randInt, shuffle, uid, type Rng } from "../rng.ts";
import { getSkillRange } from "../../data/skillSheet.ts";
import { validateQuestionIntegrity } from "./integrity.ts";

const T = (key: TKey, params?: Record<string, string | number>): Txt => ({ key, params });
const R = (raw: string | number): Txt => ({ raw: String(raw) });

export interface GenContext {
  /** Meta of a failed question from a dependent concept: used to build a linked prerequisite probe. */
  link?: { conceptId: ConceptId; meta: QuestionMeta };
  /** Factor to focus on (e.g. the 6 in "6 × 5") */
  focus?: number;
}

type Base = Omit<Question, "id" | "conceptId" | "difficulty" | "source">;

function numericOptions(rng: Rng, answer: number, bugs: Record<string, ErrorType>, spread = 2): Option[] {
  const opts: Option[] = [{ id: "o0", label: R(answer), value: String(answer) }];
  const used = new Set([String(answer)]);
  for (const [v, e] of Object.entries(bugs)) {
    if (opts.length >= 4) break;
    if (used.has(v) || Number(v) < 0) continue;
    used.add(v);
    opts.push({ id: `o${opts.length}`, label: R(v), value: v, errorType: e });
  }
  let currentSpread = spread;
  let guard = 0;
  while (opts.length < 4 && guard++ < 80) {
    if (guard > 25) currentSpread = Math.max(currentSpread, 8);
    const delta = randInt(rng, 1, currentSpread) * (rng() < 0.5 ? -1 : 1);
    const candidate = answer + delta;
    const v = String(candidate);
    if (used.has(v) || candidate < 0) continue;
    used.add(v);
    opts.push({ id: `o${opts.length}`, label: R(v), value: v, errorType: "slip" });
  }
  // Deterministic fallback if spread/non-negative constraint needs wider range
  let fallbackDelta = 1;
  while (opts.length < 4) {
    const candidate = answer + fallbackDelta;
    const v = String(candidate);
    if (!used.has(v)) {
      used.add(v);
      opts.push({ id: `o${opts.length}`, label: R(v), value: v, errorType: "slip" });
    }
    fallbackDelta++;
  }
  return shuffle(rng, opts);
}

function addBug(bugs: Record<string, ErrorType>, value: number | string, e: ErrorType, answer: number | string) {
  const v = String(value);
  if (v !== String(answer) && !(v in bugs) && !v.startsWith("-")) bugs[v] = e;
}

const digits = (n: number) => String(n).split("").map(Number);

/** column addition that forgets to carry */
function noCarryAdd(a: number, b: number): number {
  const da = digits(a).reverse();
  const db = digits(b).reverse();
  let out = 0;
  for (let i = 0; i < Math.max(da.length, db.length); i++) out += (((da[i] ?? 0) + (db[i] ?? 0)) % 10) * 10 ** i;
  return out;
}

/** classic "subtract smaller digit from larger" bug */
function smallerFromLarger(a: number, b: number): number {
  const da = digits(a).reverse();
  const db = digits(b).reverse();
  let out = 0;
  for (let i = 0; i < da.length; i++) out += Math.abs((da[i] ?? 0) - (db[i] ?? 0)) * 10 ** i;
  return out;
}

/** multiplication that forgets to carry: each digit product mod 10 */
function noCarryMult(a: number, m: number): number {
  const da = digits(a).reverse();
  let out = 0;
  for (let i = 0; i < da.length; i++) out += ((da[i] * m) % 10) * 10 ** i;
  return out;
}

/** digit-by-digit division that drops remainders */
function digitwiseDivide(a: number, m: number): number {
  return Number(digits(a).map((d) => Math.floor(d / m)).join("")) || 0;
}

const frac = (n: number, d: number) => `${n}/${d}`;
const simplify = (n: number, d: number) => {
  const g = gcd(n, d);
  return frac(n / g, d / g);
};

/* ------------------------------------------------------------------ */
/* Concept generators                                                 */
/* ------------------------------------------------------------------ */

const gen: Record<ConceptId, (d: Difficulty, rng: Rng, ctx: GenContext, grade: number) => Base> = {
  number_sense(d, rng, _ctx, grade) {
    const range = getSkillRange("number_sense", grade, d);
    if (d === 1) {
      const a = randInt(rng, range.min, range.max);
      let b = randInt(rng, range.min, range.max);
      if (b === a) b = b < range.max ? b + 1 : b - 1;
      const ans = Math.max(a, b);
      return {
        format: "mcq",
        prompt: T("q.ns.bigger"),
        expression: `${a} or ${b}`,
        answerKind: "choice",
        answer: String(ans),
        options: shuffle(
          rng,
          [a, b].map((v, i) => ({
            id: `o${i}`,
            label: R(v),
            value: String(v),
            errorType: v === ans ? undefined : ("place_value" as ErrorType),
          }))
        ),
        meta: { a, b },
        hint: T("hint.number_sense"),
      };
    }
    if (d === 2) {
      const span = range.max - range.min;
      const q1 = range.min + Math.max(1, Math.floor(span * 0.15));
      const q2 = range.min + Math.max(2, Math.floor(span * 0.45));
      const q3 = range.min + Math.max(3, Math.floor(span * 0.75));
      const q4 = range.max;
      const nums = shuffle(rng, [q1, q2, q3, q4]);
      const ans = Math.max(...nums);
      return {
        format: "mcq",
        prompt: T("q.ns.largest"),
        expression: nums.join(", "),
        answerKind: "choice",
        answer: String(ans),
        options: shuffle(
          rng,
          nums.map((v, i) => ({
            id: `o${i}`,
            label: R(v),
            value: String(v),
            errorType: v === ans ? undefined : ("place_value" as ErrorType),
          }))
        ),
        meta: { a: nums[0], b: nums[1] },
        hint: T("hint.number_sense"),
      };
    }
    const n = randInt(rng, range.min, Math.max(range.min + 1, range.max - 1));
    const ans = n + 1;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, Number(String(n).slice(0, -1) + String((n % 10) + 1)), "place_value", ans);
    addBug(bugs, n + 10, "place_value", ans);
    addBug(bugs, n - 1, "slip", ans);
    return {
      format: "short_answer",
      prompt: T("q.ns.after", { n }),
      answerKind: "int",
      answer: String(ans),
      meta: { a: n, bugs },
      hint: T("hint.number_sense"),
    };
  },

  place_value(d, rng, _ctx, grade) {
    const range = getSkillRange("place_value", grade, d);
    if (d === 1) {
      let n = randInt(rng, range.min, range.max);
      let digitArr = digits(n);
      const tensIdx = digitArr.length >= 2 ? digitArr.length - 2 : 0;
      if (digitArr[tensIdx] === 0) {
        n += randInt(rng, 1, 9) * 10;
        digitArr = digits(n);
      }
      const t = digitArr[digitArr.length >= 2 ? digitArr.length - 2 : 0];
      const ans = t * 10;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, t, "place_value", ans);
      addBug(bugs, t * 100, "place_value", ans);
      addBug(bugs, digitArr[digitArr.length - 1] ?? 0, "place_value", ans);
      return {
        format: "mcq",
        prompt: T("q.pv.value", { digit: t, n }),
        answerKind: "choice",
        answer: String(ans),
        options: numericOptions(rng, ans, bugs),
        visual: { kind: "place_value", value: n },
        meta: { a: n, bugs },
        hint: T("hint.place_value"),
      };
    }
    if (d === 2) {
      let n = randInt(rng, range.min, range.max);
      let digitArr = digits(n);
      const askH = digitArr.length >= 3 && rng() < 0.5;
      const idx = askH ? digitArr.length - 3 : Math.max(0, digitArr.length - 2);
      const placeMultiplier = 10 ** (digitArr.length - 1 - idx);
      if (digitArr[idx] === 0) {
        n += randInt(rng, 1, 9) * placeMultiplier;
        digitArr = digits(n);
      }
      const digit = digitArr[idx];
      const ans = digit * placeMultiplier;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, digit, "place_value", ans);
      addBug(bugs, askH ? digit * 10 : digit * 100, "place_value", ans);
      return {
        format: "short_answer",
        prompt: T("q.pv.value", { digit, n }),
        answerKind: "int",
        answer: String(ans),
        meta: { a: n, bugs },
        hint: T("hint.place_value"),
      };
    }
    const minN = Math.max(1000, range.min);
    const maxN = Math.max(minN + 1, range.max);
    const n = randInt(rng, minN, maxN);
    const th = Math.floor(n / 1000);
    const remTh = n % 1000;
    const h = Math.floor(remTh / 100);
    const remH = remTh % 100;
    const t = Math.floor(remH / 10);
    const o = remH % 10;
    const ans = n;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, Number([th, h, t, o].filter((x) => x !== 0).join("")), "place_value", ans);
    return {
      format: "fill_blank",
      prompt: T("q.pv.expanded", { th, h, t, o }),
      answerKind: "int",
      answer: String(ans),
      meta: { a: ans, bugs },
      hint: T("hint.place_value"),
    };
  },

  addition(d, rng, _ctx, grade) {
    const range = getSkillRange("addition", grade, d);
    const a = randInt(rng, range.min, range.max);
    const bMin = range.operandBMin ?? Math.max(10, Math.floor(range.min * 0.8));
    const bMax = range.operandBMax ?? range.max;
    const b = randInt(rng, bMin, bMax);
    const ans = a + b;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, noCarryAdd(a, b), "regrouping", ans);
    addBug(bugs, Math.abs(a - b), "wrong_operation", ans);
    const meta: QuestionMeta = { a, b, op: "+", bugs };
    if (d === 3) {
      return {
        format: "word_problem",
        prompt: T("q.add.word", { a, b }),
        answerKind: "int",
        answer: String(ans),
        meta,
        hint: T("hint.addition"),
      };
    }
    return {
      format: "short_answer",
      prompt: T("q.solve"),
      expression: `${a} + ${b} = ?`,
      answerKind: "int",
      answer: String(ans),
      meta,
      hint: T("hint.addition"),
    };
  },

  subtraction(d, rng, _ctx, grade) {
    const range = getSkillRange("subtraction", grade, d);
    const a = randInt(rng, range.min, range.max);
    const bMin = range.operandBMin ?? Math.max(5, Math.floor(range.min * 0.4));
    const bMaxAllowed = range.operandBMax ?? Math.floor(range.max * 0.8);
    const bMax = Math.min(a - 1, bMaxAllowed);
    const b = randInt(rng, Math.min(bMin, bMax), bMax);
    const ans = a - b;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, smallerFromLarger(a, b), "regrouping", ans);
    addBug(bugs, a + b, "wrong_operation", ans);
    const meta: QuestionMeta = { a, b, op: "-", bugs };
    if (d === 3) {
      return {
        format: "word_problem",
        prompt: T("q.sub.word", { a, b }),
        answerKind: "int",
        answer: String(ans),
        meta,
        hint: T("hint.subtraction"),
      };
    }
    return {
      format: "short_answer",
      prompt: T("q.solve"),
      expression: `${a} − ${b} = ?`,
      answerKind: "int",
      answer: String(ans),
      meta,
      hint: T("hint.subtraction"),
    };
  },

  mult_concept(d, rng, _ctx, grade) {
    const range = getSkillRange("mult_concept", grade, d);
    if (d === 1) {
      const rows = randInt(rng, range.min, range.max);
      const cols = randInt(rng, range.operandBMin ?? 2, range.operandBMax ?? 6);
      const ans = rows * cols;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, rows + cols, "wrong_operation", ans);
      return {
        format: "short_answer",
        prompt: T("q.mc.array", { rows, cols }),
        answerKind: "int",
        answer: String(ans),
        visual: { kind: "array", rows, cols },
        meta: { a: rows, b: cols, op: "x", bugs },
        hint: T("hint.mult_concept", { a: rows, b: cols }),
      };
    }
    if (d === 2) {
      const n = randInt(rng, range.min, range.max);
      let v = randInt(rng, range.operandBMin ?? 2, range.operandBMax ?? 7);
      if (v === n) {
        v = v < (range.operandBMax ?? 7) ? v + 1 : v - 1;
      }
      const expr = Array(n).fill(v).join(" + ");
      const correctVal = `${n}x${v}`;
      const usedValues = new Set([correctVal]);
      const options: Option[] = [{ id: "o0", label: R(`${n} × ${v}`), value: correctVal }];

      const addOption = (labelStr: string, valStr: string, errorType: ErrorType) => {
        if (!usedValues.has(valStr) && options.length < 4) {
          usedValues.add(valStr);
          options.push({ id: `o${options.length}`, label: R(labelStr), value: valStr, errorType });
        }
      };

      addOption(`${n} + ${v}`, `${n}+${v}`, "wrong_operation");
      addOption(`${v} × ${v}`, `${v}x${v}`, "unclassified");
      addOption(`${n} − ${v}`, `${n}-${v}`, "wrong_operation");
      addOption(`${v} × ${n}`, `${v}x${n}`, "slip");
      addOption(`${n + 1} × ${v}`, `${n + 1}x${v}`, "slip");
      addOption(`${n} × ${v + 1}`, `${n}x${v + 1}`, "slip");

      return {
        format: "mcq",
        prompt: T("q.mc.repeated", { a: v, times: n }),
        expression: expr,
        answerKind: "choice",
        answer: correctVal,
        options: shuffle(rng, options),
        meta: { a: n, b: v },
        hint: T("hint.mult_concept", { a: n, b: v }),
      };
    }
    const g = randInt(rng, range.min, range.max);
    const e = randInt(rng, range.operandBMin ?? 3, range.operandBMax ?? 8);
    const ans = g * e;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, g + e, "wrong_operation", ans);
    return {
      format: "word_problem",
      prompt: T("q.mc.groups", { groups: g, each: e }),
      answerKind: "int",
      answer: String(ans),
      meta: { a: g, b: e, op: "x", bugs },
      hint: T("hint.mult_concept", { a: g, b: e }),
    };
  },

  mult_facts(d, rng, ctx, grade) {
    const range = getSkillRange("mult_facts", grade, d);
    const link = ctx.link?.meta;
    if (d === 2 && link?.op === "/" && link.a && link.b && link.a % link.b === 0) {
      const ans = link.a / link.b;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, link.a - link.b, "wrong_operation", ans);
      addBug(bugs, ans + 1, "slip", ans);
      addBug(bugs, ans - 1, "slip", ans);
      return {
        format: "fill_blank",
        prompt: T("q.fill"),
        expression: `${link.b} × ? = ${link.a}`,
        answerKind: "int",
        answer: String(ans),
        meta: { a: link.b, b: ans, op: "x", bugs, focus: link.b },
        hint: T("hint.mult_facts", { a: link.b, b: ans }),
      };
    }
    const a = randInt(rng, range.min, range.max);
    const b = randInt(rng, range.operandBMin ?? 2, range.operandBMax ?? 10);
    if (d === 3) {
      const ans = b;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, a * b - a, "wrong_operation", ans);
      addBug(bugs, b + 1, "slip", ans);
      addBug(bugs, b - 1, "slip", ans);
      return {
        format: "fill_blank",
        prompt: T("q.fill"),
        expression: `${a} × ? = ${a * b}`,
        answerKind: "int",
        answer: String(ans),
        meta: { a, b, op: "x", bugs, focus: a },
        hint: T("hint.mult_facts", { a, b }),
      };
    }
    const ans = a * b;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, a + b, "wrong_operation", ans);
    addBug(bugs, a * (b + 1), "slip", ans);
    addBug(bugs, a * (b - 1), "slip", ans);
    return {
      format: "short_answer",
      prompt: T("q.solve"),
      expression: `${a} × ${b} = ?`,
      answerKind: "int",
      answer: String(ans),
      meta: { a, b, op: "x", bugs, focus: a },
      hint: T("hint.mult_facts", { a, b }),
    };
  },

  multi_digit_mult(d, rng, _ctx, grade) {
    const range = getSkillRange("multi_digit_mult", grade, d);
    const a = randInt(rng, range.min, range.max);
    const m = randInt(rng, range.operandBMin ?? 2, range.operandBMax ?? 15);
    const ans = a * m;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, noCarryMult(a, m), "regrouping", ans);
    addBug(bugs, a + m, "wrong_operation", ans);
    const meta: QuestionMeta = { a, b: m, op: "x", bugs };
    if (d === 3) {
      return {
        format: "word_problem",
        prompt: T("q.mdm.word", { a, b: m }),
        answerKind: "int",
        answer: String(ans),
        meta,
        hint: T("hint.multi_digit_mult", { a, b: m }),
      };
    }
    return {
      format: "short_answer",
      prompt: T("q.solve"),
      expression: `${a} × ${m} = ?`,
      answerKind: "int",
      answer: String(ans),
      meta,
      hint: T("hint.multi_digit_mult", { a, b: m }),
    };
  },

  division_concept(d, rng, _ctx, grade) {
    const range = getSkillRange("division_concept", grade, d);
    const n = randInt(rng, range.operandBMin ?? 2, range.operandBMax ?? 6);
    const minEach = Math.max(2, Math.ceil(range.min / n));
    const maxEach = Math.max(minEach, Math.floor(range.max / n));
    const each = randInt(rng, minEach, maxEach);
    const total = n * each;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, total - n, "wrong_operation", each);
    addBug(bugs, total + n, "wrong_operation", each);
    if (d === 1) {
      return {
        format: "short_answer",
        prompt: T("q.dc.share", { total, people: n }),
        answerKind: "int",
        answer: String(each),
        visual: { kind: "groups", groups: n, each, total },
        meta: { a: total, b: n, op: "/", bugs },
        hint: T("hint.division_concept", { a: total, b: n }),
      };
    }
    if (d === 2) {
      return {
        format: "word_problem",
        prompt: T("q.dc.groups", { total, each }),
        answerKind: "int",
        answer: String(each),
        meta: { a: total, b: n, op: "/", bugs },
        hint: T("hint.division_concept", { a: total, b: n }),
      };
    }
    const options: Option[] = shuffle(rng, [
      { id: "o0", label: T("opt.dc.share", { total, n }), value: "share" },
      { id: "o1", label: T("opt.dc.add", { total, n }), value: "add", errorType: "wrong_operation" as ErrorType },
      { id: "o2", label: T("opt.dc.subtract", { total, n }), value: "subtract", errorType: "wrong_operation" as ErrorType },
      { id: "o3", label: T("opt.dc.multiply", { total, n }), value: "multiply", errorType: "wrong_operation" as ErrorType },
    ]);
    return {
      format: "mcq",
      prompt: T("q.dc.meaning"),
      expression: `${total} ÷ ${n}`,
      answerKind: "choice",
      answer: "share",
      options,
      meta: { a: total, b: n },
      hint: T("hint.division_concept", { a: total, b: n }),
    };
  },

  division_facts(d, rng, _ctx, grade) {
    const range = getSkillRange("division_facts", grade, d);
    const b = randInt(rng, range.operandBMin ?? 2, range.operandBMax ?? 9);
    const minQ = Math.max(2, Math.ceil(range.min / b));
    const maxQ = Math.max(minQ, Math.floor(range.max / b));
    const q = randInt(rng, minQ, maxQ);
    const a = b * q;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, a - b, "wrong_operation", q);
    addBug(bugs, a + b, "wrong_operation", q);
    addBug(bugs, q + 1, "slip", q);
    addBug(bugs, q - 1, "slip", q);
    if (d === 3) {
      return {
        format: "fill_blank",
        prompt: T("q.fill"),
        expression: `? ÷ ${b} = ${q}`,
        answerKind: "int",
        answer: String(a),
        meta: { a, b, op: "/", bugs },
        hint: T("hint.division_facts", { a, b }),
      };
    }
    return {
      format: "short_answer",
      prompt: T("q.solve"),
      expression: `${a} ÷ ${b} = ?`,
      answerKind: "int",
      answer: String(q),
      meta: { a, b, op: "/", bugs },
      hint: T("hint.division_facts", { a, b }),
    };
  },

  long_division(d, rng, _ctx, grade) {
    const range = getSkillRange("long_division", grade, d);
    const m = randInt(rng, range.operandBMin ?? 2, range.operandBMax ?? 12);
    if (d === 3) {
      const minQ = Math.max(4, Math.ceil(range.min / m));
      const maxQ = Math.max(minQ, Math.floor((range.max - (m - 1)) / m));
      const q = randInt(rng, minQ, maxQ);
      const r = randInt(rng, 1, m - 1);
      const a = m * q + r;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, q, "remainder", r);
      addBug(bugs, r + 1, "slip", r);
      return {
        format: "short_answer",
        prompt: T("q.ld.remainder", { a, b: m }),
        answerKind: "int",
        answer: String(r),
        meta: { a, b: m, op: "/", bugs },
        hint: T("hint.long_division", { a, b: m }),
      };
    }
    const minQ = Math.max(5, Math.ceil(range.min / m));
    const maxQ = Math.max(minQ, Math.floor(range.max / m));
    const q = randInt(rng, minQ, maxQ);
    const a = q * m;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, digitwiseDivide(a, m), "regrouping", q);
    addBug(bugs, a - m, "wrong_operation", q);
    addBug(bugs, q + 1, "slip", q);
    return {
      format: "short_answer",
      prompt: T("q.solve"),
      expression: `${a} ÷ ${m} = ?`,
      answerKind: "int",
      answer: String(q),
      meta: { a, b: m, op: "/", bugs },
      hint: T("hint.long_division", { a, b: m }),
    };
  },

  division_word(d, rng, _ctx, grade) {
    const range = getSkillRange("division_word", grade, d);
    const n = randInt(rng, range.operandBMin ?? 2, range.operandBMax ?? 10);
    const minEach = Math.max(2, Math.ceil(range.min / n));
    const maxEach = Math.max(minEach, Math.floor(range.max / n));
    const each = randInt(rng, minEach, maxEach);
    const total = n * each;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, total - n, "wrong_operation", each);
    addBug(bugs, total + n, "wrong_operation", each);
    addBug(bugs, each + 1, "slip", each);
    return {
      format: "word_problem",
      prompt: T("q.dw.autos", { total, capacity: n }),
      answerKind: "int",
      answer: String(each),
      meta: { a: total, b: n, op: "/", bugs },
      hint: T("hint.division_word"),
    };
  },

  fraction_basics(d, rng, _ctx, grade) {
    const range = getSkillRange("fraction_basics", grade, d);
    if (d === 1) {
      const den = randInt(rng, Math.max(3, range.min), Math.max(4, range.max));
      const num = randInt(rng, 1, den - 1);
      const correctVal = frac(num, den);
      const used = new Set([correctVal]);
      const options: Option[] = [{ id: "o0", label: R(correctVal), value: correctVal }];

      const addOpt = (n: number, d: number, errorType: ErrorType) => {
        if (d > 0 && n > 0 && options.length < 4) {
          const val = frac(n, d);
          if (!used.has(val)) {
            used.add(val);
            options.push({ id: `o${options.length}`, label: R(val), value: val, errorType });
          }
        }
      };

      addOpt(den - num, den, "unclassified");
      addOpt(den, num, "fraction_inverted");
      addOpt(num, den - num, "unclassified");
      addOpt(num + 1, den, "slip");
      addOpt(Math.max(1, num - 1), den, "slip");
      addOpt(num, den + 1, "slip");
      addOpt(num, Math.max(2, den - 1), "slip");
      addOpt(1, den, "unclassified");

      return {
        format: "mcq",
        prompt: T("q.fb.shaded"),
        answerKind: "choice",
        answer: correctVal,
        options: shuffle(rng, options),
        visual: { kind: "fraction_bar", num, den },
        meta: { a: num, b: den },
        hint: T("hint.fraction_basics"),
      };
    }
    if (d === 2) {
      const den = randInt(rng, Math.max(3, range.min), Math.max(4, range.max));
      const num = randInt(rng, 1, den - 1);
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, num, "fraction_inverted", den);
      addBug(bugs, num + den, "unclassified", den);
      return {
        format: "mcq",
        prompt: T("q.fb.denominator", { num, den }),
        answerKind: "choice",
        answer: String(den),
        options: numericOptions(rng, den, bugs),
        meta: { a: num, b: den, bugs },
        hint: T("hint.fraction_basics"),
      };
    }
    const den = randInt(rng, range.operandBMin ?? 2, range.operandBMax ?? 6);
    const minK = Math.max(2, Math.ceil(range.min / den));
    const maxK = Math.max(minK, Math.floor(range.max / den));
    const total = den * randInt(rng, minK, maxK);
    const ans = total / den;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, total - den, "wrong_operation", ans);
    addBug(bugs, total * den, "wrong_operation", ans);
    return {
      format: "word_problem",
      prompt: T("q.fb.of", { fraction: frac(1, den), total }),
      answerKind: "int",
      answer: String(ans),
      meta: { a: total, b: den, op: "/", bugs },
      hint: T("hint.fraction_basics"),
    };
  },

  equivalent_fractions(d, rng, _ctx, grade) {
    const range = getSkillRange("equivalent_fractions", grade, d);
    const den = randInt(rng, Math.max(2, range.min), Math.max(3, range.max));
    const num = randInt(rng, 1, den - 1);
    if (d === 3) {
      const k = randInt(rng, 2, 4);
      const options: Option[] = shuffle(rng, [
        { id: "o0", label: R(frac(num * k, den * k)), value: frac(num * k, den * k) },
        { id: "o1", label: R(frac(num + k, den + k)), value: frac(num + k, den + k), errorType: "fraction_additive" as ErrorType },
        { id: "o2", label: R(frac(num, den * k)), value: frac(num, den * k), errorType: "unclassified" as ErrorType },
        { id: "o3", label: R(frac(num * k, den)), value: frac(num * k, den), errorType: "unclassified" as ErrorType },
      ]);
      return {
        format: "mcq",
        prompt: T("q.ef.which", { a: num, b: den }),
        answerKind: "choice",
        answer: frac(num * k, den * k),
        options,
        meta: { a: num, b: den },
        hint: T("hint.equivalent_fractions", { k }),
      };
    }
    const k = d === 1 ? 2 : randInt(rng, 3, 5);
    const ans = num * k;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, num + den * k - den, "fraction_additive", ans);
    addBug(bugs, num * k + 1, "slip", ans);
    return {
      format: "fill_blank",
      prompt: T("q.fill"),
      expression: `${frac(num, den)} = ?/${den * k}`,
      answerKind: "int",
      answer: String(ans),
      visual: d === 1 ? { kind: "fraction_compare", a: [num, den], b: [ans, den * k] } : undefined,
      meta: { a: num, b: den, bugs },
      hint: T("hint.equivalent_fractions", { k }),
    };
  },

  comparing_fractions(d, rng, _ctx, grade) {
    const range = getSkillRange("comparing_fractions", grade, d);
    let a: [number, number], b: [number, number];
    if (d === 1) {
      const den = randInt(rng, Math.max(3, range.min), Math.max(4, range.max));
      const x = randInt(rng, 1, Math.max(2, den - 2));
      const y = randInt(rng, x + 1, den - 1);
      [a, b] = rng() < 0.5 ? [[x, den], [y, den]] : [[y, den], [x, den]];
    } else if (d === 2) {
      const n = pick(rng, [1, 1, 2]);
      const p = randInt(rng, Math.max(2, range.min), Math.max(3, range.max - 1));
      const q = randInt(rng, p + 1, Math.max(p + 2, range.max));
      [a, b] = rng() < 0.5 ? [[n, p], [n, q]] : [[n, q], [n, p]];
    } else {
      const pairs: [[number, number], [number, number]][] = [
        [[2, 3], [3, 5]],
        [[3, 4], [2, 3]],
        [[2, 5], [1, 3]],
        [[5, 6], [3, 4]],
        [[3, 8], [1, 2]],
        [[4, 5], [2, 3]],
        [[3, 5], [4, 7]],
        [[5, 8], [3, 5]],
        [[5, 7], [3, 4]],
        [[7, 10], [2, 3]],
        [[4, 9], [3, 7]],
        [[5, 9], [1, 2]],
        [[7, 12], [3, 5]],
        [[5, 6], [7, 9]],
        [[3, 10], [1, 4]],
        [[7, 8], [5, 6]],
        [[2, 7], [1, 4]],
        [[5, 12], [3, 8]],
        [[4, 7], [5, 9]],
        [[8, 9], [7, 8]],
      ];
      [a, b] = shuffle(rng, [...pick(rng, pairs)]) as [[number, number], [number, number]];
    }
    const big = a[0] / a[1] > b[0] / b[1] ? a : b;
    const small = big === a ? b : a;
    const wrongErr: ErrorType = small[1] > big[1] ? "fraction_larger_denominator" : "unclassified";
    const options: Option[] = [
      { id: "o0", label: R(frac(...a)), value: frac(...a), errorType: big === a ? undefined : wrongErr },
      { id: "o1", label: R(frac(...b)), value: frac(...b), errorType: big === b ? undefined : wrongErr },
    ];
    return {
      format: "mcq",
      prompt: T("q.cf.bigger", { a: frac(...a), b: frac(...b) }),
      expression: `${frac(...a)} vs ${frac(...b)}`,
      answerKind: "choice",
      answer: frac(...big),
      options,
      visual: d === 1 ? { kind: "fraction_compare", a, b } : undefined,
      meta: { a: a[0], b: a[1] },
      hint: T("hint.comparing_fractions"),
    };
  },

  fraction_addition(d, rng, _ctx, grade) {
    const range = getSkillRange("fraction_addition", grade, d);
    let n1: number, d1: number, n2: number, d2: number;
    if (d === 2) {
      [n1, d1, n2, d2] = pick(rng, [
        [1, 2, 1, 4],
        [1, 3, 1, 6],
        [1, 2, 1, 6],
        [1, 4, 3, 8],
        [1, 5, 3, 10],
        [1, 2, 3, 8],
        [2, 3, 1, 6],
        [3, 4, 1, 8],
        [2, 5, 1, 10],
        [1, 3, 2, 9],
        [1, 4, 1, 12],
        [1, 6, 5, 12],
        [3, 10, 1, 5],
        [1, 2, 1, 8],
        [2, 5, 3, 10],
        [1, 3, 1, 9],
        [1, 2, 1, 10],
        [1, 4, 5, 12],
      ]);
    } else {
      d1 = d2 = randInt(rng, Math.max(3, range.min), Math.max(4, range.max));
      n1 = randInt(rng, 1, Math.max(2, d1 - 2));
      n2 = randInt(rng, 1, Math.max(2, d1 - 1 - n1));
    }
    const L = (d1 * d2) / gcd(d1, d2);
    const ansN = n1 * (L / d1) + n2 * (L / d2);
    const ans = simplify(ansN, L);
    const bugs: Record<string, ErrorType> = {};
    bugs[frac(n1 + n2, d1 + d2)] = "fraction_add_denominators";
    if (d1 === d2) bugs[frac(n1 + n2, d1 * d2)] = "fraction_add_denominators";
    const meta: QuestionMeta = { a: n1, b: n2, bugs };
    if (d === 3) {
      return {
        format: "word_problem",
        prompt: T("q.fa.word", { a: frac(n1, d1), b: frac(n2, d2) }),
        answerKind: "fraction",
        answer: ans,
        meta,
        hint: T("hint.fraction_addition"),
      };
    }
    return {
      format: "short_answer",
      prompt: T("q.solve"),
      expression: `${frac(n1, d1)} + ${frac(n2, d2)} = ?`,
      answerKind: "fraction",
      answer: ans,
      meta,
      hint: T("hint.fraction_addition"),
    };
  },

  addition_3digit(d, rng, _ctx, grade) {
    const range = getSkillRange("addition_3digit", grade, d);
    const a = randInt(rng, range.min, range.max);
    const bMin = range.operandBMin ?? 100;
    const bMax = range.operandBMax ?? 300;
    const b = randInt(rng, bMin, bMax);
    const ans = a + b;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, noCarryAdd(a, b), "regrouping", ans);
    addBug(bugs, Math.abs(a - b), "wrong_operation", ans);
    addBug(bugs, ans + 10, "slip", ans);
    addBug(bugs, ans - 10, "slip", ans);
    const meta: QuestionMeta = { a, b, op: "+", bugs };
    if (d === 3) {
      return {
        format: "word_problem",
        prompt: T("q.add.word", { a, b }),
        answerKind: "int",
        answer: String(ans),
        meta,
        hint: T("hint.addition_3digit"),
      };
    }
    return {
      format: "short_answer",
      prompt: T("q.solve"),
      expression: `${a} + ${b} = ?`,
      answerKind: "int",
      answer: String(ans),
      meta,
      hint: T("hint.addition_3digit"),
    };
  },

  subtraction_3digit(d, rng, _ctx, grade) {
    const range = getSkillRange("subtraction_3digit", grade, d);
    const a = randInt(rng, range.min, range.max);
    const bMin = range.operandBMin ?? 100;
    const bMaxAllowed = range.operandBMax ?? 300;
    const bMax = Math.min(a - 1, bMaxAllowed);
    const b = randInt(rng, Math.min(bMin, bMax), bMax);
    const ans = a - b;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, smallerFromLarger(a, b), "regrouping", ans);
    addBug(bugs, a + b, "wrong_operation", ans);
    addBug(bugs, ans + 10, "slip", ans);
    addBug(bugs, ans - 10, "slip", ans);
    const meta: QuestionMeta = { a, b, op: "-", bugs };
    if (d === 3) {
      return {
        format: "word_problem",
        prompt: T("q.sub.word", { a, b }),
        answerKind: "int",
        answer: String(ans),
        meta,
        hint: T("hint.subtraction_3digit"),
      };
    }
    return {
      format: "short_answer",
      prompt: T("q.solve"),
      expression: `${a} − ${b} = ?`,
      answerKind: "int",
      answer: String(ans),
      meta,
      hint: T("hint.subtraction_3digit"),
    };
  },

  division_sharing(d, rng, _ctx, grade) {
    const range = getSkillRange("division_sharing", grade, d);
    const n = randInt(rng, range.operandBMin ?? 2, range.operandBMax ?? 6);
    const minEach = Math.max(2, Math.ceil(range.min / n));
    const maxEach = Math.max(minEach, Math.floor(range.max / n));
    const each = randInt(rng, minEach, maxEach);
    const total = n * each;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, total - n, "wrong_operation", each);
    addBug(bugs, total + n, "wrong_operation", each);
    addBug(bugs, each + 1, "slip", each);
    addBug(bugs, each - 1, "slip", each);
    const meta: QuestionMeta = { a: total, b: n, op: "/", bugs };
    if (d === 1) {
      return {
        format: "short_answer",
        prompt: T("q.div.sharing", { total, n }),
        answerKind: "int",
        answer: String(each),
        visual: { kind: "groups", groups: n, each, total },
        meta,
        hint: T("hint.division_sharing"),
      };
    }
    return {
      format: "word_problem",
      prompt: T("q.div.sharing", { total, n }),
      answerKind: "int",
      answer: String(each),
      meta,
      hint: T("hint.division_sharing"),
    };
  },

  money_math(d, rng, _ctx, grade) {
    const range = getSkillRange("money_math", grade, d);
    if (d === 1) {
      const a = randInt(rng, range.min, range.max);
      const b = randInt(rng, range.operandBMin ?? 5, range.operandBMax ?? 30);
      const ans = a + b;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, Math.abs(a - b), "wrong_operation", ans);
      addBug(bugs, ans + 5, "slip", ans);
      addBug(bugs, ans - 5, "slip", ans);
      return {
        format: "word_problem",
        prompt: T("q.money.total", { a, b }),
        answerKind: "int",
        answer: String(ans),
        meta: { a, b, op: "+", bugs },
        hint: T("hint.money_math"),
      };
    }
    if (d === 2) {
      const total = randInt(rng, range.min, range.max);
      const bMin = range.operandBMin ?? 10;
      const bMax = Math.min(total - 1, range.operandBMax ?? 120);
      const spent = randInt(rng, Math.min(bMin, bMax), bMax);
      const ans = total - spent;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, total + spent, "wrong_operation", ans);
      addBug(bugs, ans + 10, "slip", ans);
      addBug(bugs, ans - 10, "slip", ans);
      return {
        format: "word_problem",
        prompt: T("q.money.change", { total, spent }),
        answerKind: "int",
        answer: String(ans),
        meta: { a: total, b: spent, op: "-", bugs },
        hint: T("hint.money_math"),
      };
    }
    const a = randInt(rng, range.min, range.max);
    const b = randInt(rng, range.operandBMin ?? 50, range.operandBMax ?? 200);
    const ans = a + b;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, noCarryAdd(a, b), "regrouping", ans);
    addBug(bugs, Math.abs(a - b), "wrong_operation", ans);
    return {
      format: "word_problem",
      prompt: T("q.money.total", { a, b }),
      answerKind: "int",
      answer: String(ans),
      meta: { a, b, op: "+", bugs },
      hint: T("hint.money_math"),
    };
  },
};

export function generateQuestion(
  conceptId: ConceptId,
  difficulty: Difficulty,
  rng: Rng,
  gradeOrCtx: number | GenContext = 5,
  ctx: GenContext = {}
): Question {
  const grade = typeof gradeOrCtx === "number" ? gradeOrCtx : 5;
  const effectiveCtx = typeof gradeOrCtx === "object" ? gradeOrCtx : ctx;
  const generatorFn = gen[conceptId];
  if (!generatorFn) {
    throw new Error(`Unknown conceptId: ${conceptId}`);
  }
  const base = generatorFn(difficulty, rng, effectiveCtx, grade);
  return {
    ...base,
    id: uid("q"),
    conceptId,
    difficulty,
    source: "bank",
    linkedFrom: effectiveCtx.link?.conceptId,
  };
}

/**
 * Normalizes mathematical and textual strings by:
 * - Collapsing whitespace sequences
 * - Normalizing math operators (×, * -> *; ÷, / -> /; −, -, – -> -)
 * - Lowercasing and trimming
 */
export function normalizeMathString(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u2013\u2212\u2014]/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Stable canonical fingerprint that distinguishes genuinely different questions
 * while recognising equivalent duplicates (even across whitespace, operator glyphs,
 * or non-semantic formatting differences).
 *
 * Ground truth includes:
 * - Concept and difficulty
 * - Format (e.g. mcq, true_false, missing_number)
 * - Normalised prompt translation key and parameters, or raw content
 * - Mathematical operands (a, b, op, focus)
 * - Normalised mathematical expression
 * - Answer (normalized)
 * - Visual representation metadata
 */
export function canonicalQuestionFingerprint(q: Question): string {
  const concept = q.conceptId || "";
  const difficulty = q.difficulty || "m";
  const format = q.format || "mcq";

  // Prompt representation
  let promptRepr = "";
  if (q.prompt && typeof q.prompt === "object") {
    if ("key" in q.prompt) {
      const pObj = q.prompt as { key: string; params?: Record<string, unknown> };
      const sortedParams = pObj.params
        ? Object.keys(pObj.params)
            .sort()
            .map((k) => `${k}=${normalizeMathString(String(pObj.params![k]))}`)
            .join("&")
        : "";
      promptRepr = `k:${pObj.key}|p:${sortedParams}`;
    } else if ("raw" in q.prompt) {
      promptRepr = `r:${normalizeMathString((q.prompt as { raw: string }).raw)}`;
    }
  } else if (typeof q.prompt === "string") {
    promptRepr = `s:${normalizeMathString(q.prompt)}`;
  }

  // Normalized expression
  const normExpr = normalizeMathString(q.expression ?? "");

  // Operands from meta
  const meta = q.meta || {};
  const metaA = meta.a !== undefined ? String(meta.a) : "";
  const metaB = meta.b !== undefined ? String(meta.b) : "";
  const metaOp = meta.op ? normalizeMathString(meta.op) : "";
  const metaFocus = meta.focus !== undefined ? String(meta.focus) : "";
  const operandsRepr = `a:${metaA}|b:${metaB}|op:${metaOp}|f:${metaFocus}`;

  // Normalized answer
  const normAnswer = normalizeMathString(String(q.answer ?? ""));

  // Visual configuration
  const visualRepr = q.visual ? JSON.stringify(q.visual) : "";

  return `${concept}|d:${difficulty}|fmt:${format}|${promptRepr}|expr:${normExpr}|${operandsRepr}|ans:${normAnswer}|v:${visualRepr}`;
}

/** A unique signature so the same item is not asked twice in a session. */
export function questionSignature(q: Question): string {
  return canonicalQuestionFingerprint(q);
}

export interface FormatDiversifyOptions {
  avoidFormat?: QuestionFormat;
  allowedFormats?: QuestionFormat[];
}

/**
 * Step 12: Question variety in shape.
 * Transforms an existing base question into an alternative pedagogical shape where concept allows:
 * - missing_number
 * - find_mistake
 * - true_false
 * - choose_working
 * - compare_answers
 * All numbers, answers, and wrong options are strictly computed by code.
 */
export function applyQuestionFormat(
  q: Question,
  format: QuestionFormat,
  rng: Rng
): Question {
  const meta = q.meta;
  const a = meta?.a;
  const b = meta?.b;
  const op = meta?.op;

  // Formats apply where binary operation, numeric operands, and numeric answer are well defined
  if (
    a === undefined ||
    b === undefined ||
    !op ||
    isNaN(Number(a)) ||
    isNaN(Number(b)) ||
    (q.prompt && "key" in q.prompt && q.prompt.key === "q.ld.remainder") ||
    (q.conceptId === "long_division" && q.difficulty === 3)
  ) {
    return q;
  }

  const aNum = Number(a);
  const bNum = Number(b);
  const opSymbol =
    op === "x"
      ? "×"
      : op === "/"
      ? "÷"
      : op === "-"
      ? "−"
      : "+";

  // Compute the authoritative mathematical result of (aNum op bNum)
  let trueVal: number;
  if (op === "+") trueVal = aNum + bNum;
  else if (op === "-") trueVal = aNum - bNum;
  else if (op === "x") trueVal = aNum * bNum;
  else if (op === "/") trueVal = Math.floor(aNum / bNum);
  else trueVal = Number(q.answer);

  if (isNaN(trueVal)) {
    return q;
  }

  if (format === "missing_number") {
    // Hide second operand: a op [ ? ] = trueVal (missing is b)
    // Or hide first operand: [ ? ] op b = trueVal (missing is a)
    const hideSecond = rng() < 0.5;
    const expression = hideSecond
      ? `${aNum} ${opSymbol} [ ? ] = ${trueVal}`
      : `[ ? ] ${opSymbol} ${bNum} = ${trueVal}`;
    const missingVal = hideSecond ? bNum : aNum;

    return {
      ...q,
      format: "missing_number",
      prompt: T("q.format.missing_number", { expression }),
      expression,
      answer: String(missingVal),
      answerKind: "choice",
      options: numericOptions(
        rng,
        missingVal,
        {
          [String(missingVal + 1)]: "slip",
          [String(Math.max(1, missingVal - 1))]: "slip",
        },
        2
      ),
    };
  }

  if (format === "true_false") {
    const isActuallyTrue = rng() < 0.5;
    let statementExpr = "";
    if (isActuallyTrue) {
      statementExpr = `${aNum} ${opSymbol} ${bNum} = ${trueVal}`;
    } else {
      const bugEntries = Object.keys(meta?.bugs || {})
        .filter((k) => k !== String(trueVal) && !isNaN(Number(k)))
        .map(Number);
      let wrongAns =
        bugEntries.length > 0
          ? bugEntries[0]
          : trueVal > 0
          ? trueVal + 2
          : trueVal + 3;
      if (wrongAns === trueVal) {
        wrongAns = trueVal + 3;
      }
      statementExpr = `${aNum} ${opSymbol} ${bNum} = ${wrongAns}`;
    }

    const correctAns = isActuallyTrue ? "True" : "False";
    const options: Option[] = [
      { id: "opt_true", label: R("True"), value: "True" },
      { id: "opt_false", label: R("False"), value: "False" },
    ];

    return {
      ...q,
      format: "true_false",
      prompt: T("q.format.true_false", { statement: statementExpr }),
      expression: statementExpr,
      answer: correctAns,
      answerKind: "choice",
      options,
    };
  }

  if (format === "find_mistake") {
    const hasMistake = rng() < 0.5;
    const bugEntries = Object.keys(meta?.bugs || {})
      .filter((k) => k !== String(trueVal) && !isNaN(Number(k)))
      .map(Number);
    let wrongVal =
      bugEntries.length > 0
        ? bugEntries[0]
        : trueVal > 0
        ? trueVal + 3
        : trueVal + 4;
    if (wrongVal === trueVal) {
      wrongVal = trueVal + 4;
    }
    const displayedAns = hasMistake ? wrongVal : trueVal;
    const workingStr = `${aNum} ${opSymbol} ${bNum} = ${displayedAns}`;

    const correctAns = hasMistake ? "Mistake" : "Correct";
    const options: Option[] = [
      { id: "opt_correct", label: R("Correct (No mistake)"), value: "Correct" },
      { id: "opt_mistake", label: R("Mistake (Incorrect)"), value: "Mistake" },
    ];

    return {
      ...q,
      format: "find_mistake",
      prompt: T("q.format.find_mistake", { working: workingStr }),
      expression: workingStr,
      answer: correctAns,
      answerKind: "choice",
      options,
    };
  }

  if (format === "choose_working") {
    let correctMethod = "";
    let wrongMethod = "";
    if (op === "+") {
      correctMethod = `${aNum} + ${bNum} = (${Math.floor(aNum / 10) * 10} + ${Math.floor(bNum / 10) * 10}) + (${aNum % 10} + ${bNum % 10})`;
      wrongMethod = `${aNum} + ${bNum} = ${aNum} − ${bNum}`;
    } else if (op === "x") {
      const bHalf = Math.floor(bNum / 2);
      if (bHalf > 0 && bNum - bHalf > 0) {
        correctMethod = `${aNum} × ${bNum} = (${aNum} × ${bHalf}) + (${aNum} × ${bNum - bHalf})`;
      } else {
        correctMethod = `${aNum} × ${bNum} = ${trueVal}`;
      }
      wrongMethod = `${aNum} × ${bNum} = ${aNum + bNum}`;
    } else if (op === "-") {
      correctMethod = `${aNum} − ${bNum} = (${aNum} − ${Math.floor(bNum / 10) * 10}) − ${bNum % 10}`;
      wrongMethod = `${aNum} − ${bNum} = ${aNum + bNum}`;
    } else {
      correctMethod = `${aNum} ÷ ${bNum} = ${trueVal}`;
      wrongMethod = `${aNum} ÷ ${bNum} = ${aNum * bNum}`;
    }

    const options: Option[] = shuffle(rng, [
      { id: "opt_method_1", label: R(correctMethod), value: correctMethod },
      { id: "opt_method_2", label: R(wrongMethod), value: wrongMethod, errorType: "wrong_operation" as ErrorType },
    ]);

    return {
      ...q,
      format: "choose_working",
      prompt: T("q.format.choose_working", { problem: `${aNum} ${opSymbol} ${bNum}` }),
      expression: `${aNum} ${opSymbol} ${bNum} = ?`,
      answer: correctMethod,
      answerKind: "choice",
      options,
    };
  }

  if (format === "compare_answers") {
    const student1Name = "Student A";
    const student2Name = "Student B";
    const bugEntries = Object.keys(meta?.bugs || {})
      .filter((k) => k !== String(trueVal) && !isNaN(Number(k)))
      .map(Number);
    let wrongVal =
      bugEntries.length > 0
        ? bugEntries[0]
        : trueVal > 0
        ? trueVal + 2
        : trueVal + 3;
    if (wrongVal === trueVal) {
      wrongVal = trueVal + 3;
    }

    const student1Ans = rng() < 0.5 ? String(trueVal) : String(wrongVal);
    const student2Ans = student1Ans === String(trueVal) ? String(wrongVal) : String(trueVal);
    const correctStudent = student1Ans === String(trueVal) ? `${student1Name}: ${student1Ans}` : `${student2Name}: ${student2Ans}`;

    const options: Option[] = [
      { id: "opt_s1", label: R(`${student1Name}: ${student1Ans}`), value: `${student1Name}: ${student1Ans}` },
      { id: "opt_s2", label: R(`${student2Name}: ${student2Ans}`), value: `${student2Name}: ${student2Ans}` },
    ];

    return {
      ...q,
      format: "compare_answers",
      prompt: T("q.format.compare_answers"),
      expression: `${aNum} ${opSymbol} ${bNum} = ?`,
      answer: correctStudent,
      answerKind: "choice",
      options,
    };
  }

  return q;
}

export function generateQuestionWithVariety(
  conceptId: ConceptId,
  difficulty: Difficulty,
  rng: Rng,
  grade = 5,
  optionsOrAvoidFormat: FormatDiversifyOptions | QuestionFormat = {},
  ctx: GenContext = {}
): Question {
  const options: FormatDiversifyOptions =
    typeof optionsOrAvoidFormat === "string"
      ? { avoidFormat: optionsOrAvoidFormat }
      : (optionsOrAvoidFormat ?? {});
  const base = generateQuestion(conceptId, difficulty, rng, grade, ctx);

  // Check if base has well-defined arithmetic operands to support interactive transformation
  const canApplyInteractiveFormats =
    base.meta?.op !== undefined &&
    base.meta?.a !== undefined &&
    base.meta?.b !== undefined &&
    !isNaN(Number(base.meta.a)) &&
    !isNaN(Number(base.meta.b)) &&
    base.conceptId !== "long_division";

  // Check if question is choice-dependent (options represent the options being selected/compared)
  const isChoiceDependent =
    base.conceptId === "comparing_fractions" ||
    (base.conceptId === "division_concept" && base.difficulty === 3) ||
    (base.conceptId === "number_sense" && (base.difficulty === 1 || base.difficulty === 2)) ||
    (base.conceptId === "equivalent_fractions" && base.difficulty === 3) ||
    (base.conceptId === "mult_concept" && base.difficulty === 2) ||
    base.answerKind === "choice";

  let candidateFormats: QuestionFormat[];
  if (canApplyInteractiveFormats) {
    candidateFormats = [
      "mcq",
      "short_answer",
      "missing_number",
      "find_mistake",
      "true_false",
      "choose_working",
      "compare_answers",
    ];
  } else if (isChoiceDependent) {
    candidateFormats = ["mcq"];
  } else if (base.format === "word_problem") {
    candidateFormats = ["word_problem", "mcq", "short_answer"];
  } else {
    candidateFormats = ["mcq", base.format];
  }

  const allowed = options.allowedFormats || candidateFormats;
  const filtered = allowed.filter((f) => f !== options.avoidFormat);
  const targetFormat = pick(rng, filtered.length > 0 ? filtered : allowed);

  // If converting to MCQ from short_answer, add computed distractors
  if (targetFormat === "mcq" && base.format !== "mcq") {
    const numAns = Number(base.answer);
    if (!isNaN(numAns)) {
      const bugs = base.meta?.bugs || {};
      const optionsList = numericOptions(rng, numAns, bugs);
      return {
        ...base,
        format: "mcq",
        answerKind: "choice",
        options: optionsList,
      };
    }
  }

  // If converting to short_answer from MCQ, remove choice options ONLY if not choice-dependent
  if (targetFormat === "short_answer" && base.format === "mcq") {
    if (!isChoiceDependent && (base.expression || !isNaN(Number(base.answer)))) {
      return {
        ...base,
        format: "short_answer",
        answerKind:
          typeof base.answer === "number" || !isNaN(Number(base.answer))
            ? "int"
            : base.answerKind,
        options: undefined,
      };
    }
  }

  if (
    base.format === "word_problem" ||
    targetFormat === base.format ||
    targetFormat === "word_problem"
  ) {
    return base;
  }

  return applyQuestionFormat(base, targetFormat, rng);
}

export function generateUnique(
  conceptId: ConceptId,
  difficulty: Difficulty,
  rng: Rng,
  seen: Set<string>,
  gradeOrCtx: number | GenContext = 5,
  ctx: GenContext = {},
  options: FormatDiversifyOptions = {}
): Question {
  const grade = typeof gradeOrCtx === "number" ? gradeOrCtx : 5;
  const effectiveCtx = typeof gradeOrCtx === "object" ? gradeOrCtx : ctx;
  let q = generateQuestionWithVariety(conceptId, difficulty, rng, grade, options, effectiveCtx);
  let attempts = 0;
  while ((seen.has(questionSignature(q)) || !validateQuestionIntegrity(q).valid) && attempts < 50) {
    attempts++;
    q = generateQuestionWithVariety(
      conceptId,
      difficulty,
      rng,
      grade,
      options,
      attempts < 15 ? effectiveCtx : { ...effectiveCtx, link: undefined }
    );
  }

  // Fallback to strict base generator if variety failed integrity checks
  if (!validateQuestionIntegrity(q).valid) {
    q = generateQuestion(conceptId, difficulty, rng, grade, effectiveCtx);
  }

  seen.add(questionSignature(q));
  return q;
}
