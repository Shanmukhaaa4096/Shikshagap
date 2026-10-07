/**
 * Question Generator — produces parameterised, verifiable questions for each
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
} from "@/lib/types";
import type { TKey } from "@/lib/i18n/keys";
import { gcd, pick, randInt, shuffle, uid, type Rng } from "@/lib/rng";

const T = (key: TKey, params?: Record<string, string | number>): Txt => ({ key, params });
const R = (raw: string | number): Txt => ({ raw: String(raw) });

export interface GenContext {
  /** Meta of a failed question from a dependent concept — used to build a linked prerequisite probe. */
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
  let guard = 0;
  while (opts.length < 4 && guard++ < 50) {
    const delta = randInt(rng, 1, spread) * (rng() < 0.5 ? -1 : 1);
    const v = String(answer + delta);
    if (used.has(v) || answer + delta < 0) continue;
    used.add(v);
    opts.push({ id: `o${opts.length}`, label: R(v), value: v, errorType: "slip" });
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

const gen: Record<ConceptId, (d: Difficulty, rng: Rng, ctx: GenContext) => Base> = {
  number_sense(d, rng) {
    if (d === 1) {
      const x = randInt(rng, 2, 9);
      let y = randInt(rng, 1, 9);
      if (y === x) y = x === 9 ? 8 : x + 1;
      const a = x * 10 + y;
      const b = y * 10 + x;
      const ans = Math.max(a, b);
      return {
        format: "mcq", prompt: T("q.ns.bigger"), answerKind: "choice", answer: String(ans),
        options: shuffle(rng, [a, b].map((v, i) => ({ id: `o${i}`, label: R(v), value: String(v), errorType: v === ans ? undefined : ("place_value" as ErrorType) }))),
        meta: { a, b }, hint: T("hint.number_sense"),
      };
    }
    if (d === 2) {
      const [p, q] = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 2);
      const nums = [p * 100 + q * 10, p * 100 + q, q * 100 + p * 10, q * 100 + p];
      const ans = Math.max(...nums);
      return {
        format: "mcq", prompt: T("q.ns.largest"), answerKind: "choice", answer: String(ans),
        options: shuffle(rng, nums.map((v, i) => ({ id: `o${i}`, label: R(v), value: String(v), errorType: v === ans ? undefined : ("place_value" as ErrorType) }))),
        meta: {}, hint: T("hint.number_sense"),
      };
    }
    const n = pick(rng, [399, 509, 699, 1099, 799, 2999, 4099]);
    const ans = n + 1;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, Number(String(n).slice(0, -1) + String((n % 10) + 1)), "place_value", ans);
    addBug(bugs, n + 10, "place_value", ans);
    addBug(bugs, n - 1, "slip", ans);
    return { format: "short_answer", prompt: T("q.ns.after", { n }), answerKind: "int", answer: String(ans), meta: { a: n, bugs }, hint: T("hint.number_sense") };
  },

  place_value(d, rng) {
    if (d === 1) {
      const t = randInt(rng, 2, 9);
      let o = randInt(rng, 1, 9);
      if (o === t) o = t === 9 ? 1 : t + 1;
      const n = t * 10 + o;
      const ans = t * 10;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, t, "place_value", ans);
      addBug(bugs, t * 100, "place_value", ans);
      addBug(bugs, o, "place_value", ans);
      return {
        format: "mcq", prompt: T("q.pv.value", { digit: t, n }), answerKind: "choice", answer: String(ans),
        options: numericOptions(rng, ans, bugs), visual: { kind: "place_value", value: n }, meta: { a: n, bugs }, hint: T("hint.place_value"),
      };
    }
    if (d === 2) {
      const [h, t, o] = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
      const n = h * 100 + t * 10 + o;
      const askH = rng() < 0.5;
      const digit = askH ? h : t;
      const ans = askH ? h * 100 : t * 10;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, digit, "place_value", ans);
      addBug(bugs, askH ? h * 10 : t * 100, "place_value", ans);
      return { format: "short_answer", prompt: T("q.pv.value", { digit, n }), answerKind: "int", answer: String(ans), meta: { a: n, bugs }, hint: T("hint.place_value") };
    }
    const th = randInt(rng, 1, 9);
    const zeroH = rng() < 0.5;
    const h = zeroH ? 0 : randInt(rng, 1, 9);
    const t = zeroH ? randInt(rng, 1, 9) : 0;
    const o = randInt(rng, 1, 9);
    const ans = th * 1000 + h * 100 + t * 10 + o;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, Number([th, h, t, o].filter((x) => x !== 0).join("")), "place_value", ans);
    return {
      format: "fill_blank", prompt: T("q.pv.expanded", { th, h, t, o }), answerKind: "int", answer: String(ans), meta: { bugs }, hint: T("hint.place_value"),
    };
  },

  addition(d, rng) {
    let a: number, b: number;
    if (d === 1) {
      a = randInt(rng, 1, 5) * 10 + randInt(rng, 0, 4);
      b = randInt(rng, 1, 4) * 10 + randInt(rng, 0, 5);
    } else if (d === 2) {
      a = randInt(rng, 1, 5) * 10 + randInt(rng, 5, 9);
      b = randInt(rng, 1, 3) * 10 + randInt(rng, 5, 9);
    } else {
      a = randInt(rng, 120, 480);
      b = randInt(rng, 115, 470);
      if ((a % 10) + (b % 10) < 10) b += 10 - (b % 10) + 6 - (a % 10 > 4 ? 0 : 0);
    }
    const ans = a + b;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, noCarryAdd(a, b), "regrouping", ans);
    addBug(bugs, Math.abs(a - b), "wrong_operation", ans);
    const meta: QuestionMeta = { a, b, op: "+", bugs };
    if (d === 3) return { format: "word_problem", prompt: T("q.add.word", { a, b }), answerKind: "int", answer: String(ans), meta, hint: T("hint.addition") };
    return { format: "short_answer", prompt: T("q.solve"), expression: `${a} + ${b} = ?`, answerKind: "int", answer: String(ans), meta, hint: T("hint.addition") };
  },

  subtraction(d, rng) {
    let a: number, b: number;
    if (d === 1) {
      a = randInt(rng, 5, 9) * 10 + randInt(rng, 5, 9);
      b = randInt(rng, 1, 4) * 10 + randInt(rng, 0, 4);
    } else if (d === 2) {
      a = randInt(rng, 5, 9) * 10 + randInt(rng, 0, 4);
      b = randInt(rng, 1, 4) * 10 + randInt(rng, 5, 9);
    } else {
      a = randInt(rng, 3, 9) * 100 + randInt(rng, 0, 3);
      b = randInt(rng, 1, 2) * 100 + randInt(rng, 4, 8) * 10 + randInt(rng, 5, 9);
    }
    const ans = a - b;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, smallerFromLarger(a, b), "regrouping", ans);
    addBug(bugs, a + b, "wrong_operation", ans);
    const meta: QuestionMeta = { a, b, op: "-", bugs };
    if (d === 3) return { format: "word_problem", prompt: T("q.sub.word", { a, b }), answerKind: "int", answer: String(ans), meta, hint: T("hint.subtraction") };
    return { format: "short_answer", prompt: T("q.solve"), expression: `${a} − ${b} = ?`, answerKind: "int", answer: String(ans), meta, hint: T("hint.subtraction") };
  },

  mult_concept(d, rng) {
    if (d === 1) {
      const rows = randInt(rng, 2, 4);
      const cols = randInt(rng, 3, 6);
      const ans = rows * cols;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, rows + cols, "wrong_operation", ans);
      return { format: "short_answer", prompt: T("q.mc.array", { rows, cols }), answerKind: "int", answer: String(ans), visual: { kind: "array", rows, cols }, meta: { a: rows, b: cols, op: "x", bugs }, hint: T("hint.mult_concept", { a: rows, b: cols }) };
    }
    if (d === 2) {
      const n = randInt(rng, 3, 5);
      const v = randInt(rng, 3, 8);
      const expr = Array(n).fill(v).join(" + ");
      const options: Option[] = shuffle(rng, [
        { id: "o0", label: R(`${n} × ${v}`), value: `${n}x${v}` },
        { id: "o1", label: R(`${n} + ${v}`), value: `${n}+${v}`, errorType: "wrong_operation" as ErrorType },
        { id: "o2", label: R(`${v} × ${v}`), value: `${v}x${v}`, errorType: "unclassified" as ErrorType },
        { id: "o3", label: R(`${n} − ${v}`), value: `${n}-${v}`, errorType: "wrong_operation" as ErrorType },
      ]);
      return { format: "mcq", prompt: T("q.mc.repeated"), expression: expr, answerKind: "choice", answer: `${n}x${v}`, options, meta: { a: n, b: v }, hint: T("hint.mult_concept", { a: n, b: v }) };
    }
    const g = randInt(rng, 4, 7);
    const e = randInt(rng, 3, 8);
    const ans = g * e;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, g + e, "wrong_operation", ans);
    return { format: "word_problem", prompt: T("q.mc.groups", { g, e }), answerKind: "int", answer: String(ans), meta: { a: g, b: e, op: "x", bugs }, hint: T("hint.mult_concept", { a: g, b: e }) };
  },

  mult_facts(d, rng, ctx) {
    const link = ctx.link?.meta;
    // Linked probe: the student failed "36 ÷ 6" → ask "6 × ? = 36" with the same numbers.
    if (d === 2 && link?.op === "/" && link.a && link.b && link.a % link.b === 0) {
      const ans = link.a / link.b;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, link.a - link.b, "wrong_operation", ans);
      addBug(bugs, ans + 1, "slip", ans);
      addBug(bugs, ans - 1, "slip", ans);
      return { format: "fill_blank", prompt: T("q.fill"), expression: `${link.b} × ? = ${link.a}`, answerKind: "int", answer: String(ans), meta: { a: link.b, b: ans, op: "x", bugs, focus: link.b }, hint: T("hint.mult_facts", { a: link.b, b: ans }) };
    }
    let a: number, b: number;
    const focus = ctx.focus ?? link?.focus;
    if (d === 1) {
      a = focus && focus <= 10 ? focus : randInt(rng, 3, 9);
      b = pick(rng, [2, 5, 10]);
      if (a === b) b = b === 5 ? 2 : 5;
    } else if (d === 2) {
      a = focus && focus >= 3 ? focus : randInt(rng, 6, 9);
      b = randInt(rng, 6, 9);
    } else {
      const x = randInt(rng, 6, 9);
      const y = randInt(rng, 4, 9);
      const ans = y;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, x * y - x, "wrong_operation", ans);
      addBug(bugs, y + 1, "slip", ans);
      addBug(bugs, y - 1, "slip", ans);
      return { format: "fill_blank", prompt: T("q.fill"), expression: `${x} × ? = ${x * y}`, answerKind: "int", answer: String(ans), meta: { a: x, b: y, op: "x", bugs, focus: x }, hint: T("hint.mult_facts", { a: x, b: y }) };
    }
    const ans = a * b;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, a + b, "wrong_operation", ans);
    addBug(bugs, a * (b + 1), "slip", ans);
    addBug(bugs, a * (b - 1), "slip", ans);
    return { format: "short_answer", prompt: T("q.solve"), expression: `${a} × ${b} = ?`, answerKind: "int", answer: String(ans), meta: { a, b, op: "x", bugs, focus: a }, hint: T("hint.mult_facts", { a, b }) };
  },

  multi_digit_mult(d, rng) {
    let a: number, m: number;
    if (d === 1) {
      m = randInt(rng, 2, 3);
      a = randInt(rng, 1, Math.floor(9 / m)) * 10 + randInt(rng, 1, Math.floor(9 / m));
    } else if (d === 2) {
      m = randInt(rng, 3, 7);
      a = randInt(rng, 1, 4) * 10 + randInt(rng, Math.ceil(10 / m), 9);
    } else {
      a = randInt(rng, 12, 25);
      m = randInt(rng, 11, 15);
      const ans = a * m;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, a * (m % 10), "place_value", ans);
      addBug(bugs, a * (m % 10) + a, "place_value", ans);
      addBug(bugs, a + m, "wrong_operation", ans);
      return { format: "word_problem", prompt: T("q.mdm.word", { a, b: m }), answerKind: "int", answer: String(ans), meta: { a, b: m, op: "x", bugs }, hint: T("hint.multi_digit_mult", { a, b: m }) };
    }
    const ans = a * m;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, noCarryMult(a, m), "regrouping", ans);
    addBug(bugs, a + m, "wrong_operation", ans);
    return { format: "short_answer", prompt: T("q.solve"), expression: `${a} × ${m} = ?`, answerKind: "int", answer: String(ans), meta: { a, b: m, op: "x", bugs }, hint: T("hint.multi_digit_mult", { a, b: m }) };
  },

  division_concept(d, rng) {
    if (d === 1) {
      const n = randInt(rng, 2, 4);
      const each = randInt(rng, 2, 5);
      const total = n * each;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, total - n, "wrong_operation", each);
      addBug(bugs, total + n, "wrong_operation", each);
      return { format: "short_answer", prompt: T("q.dc.share", { total, n }), answerKind: "int", answer: String(each), visual: { kind: "groups", groups: n, each, total }, meta: { a: total, b: n, op: "/", bugs }, hint: T("hint.division_concept", { a: total, b: n }) };
    }
    if (d === 2) {
      const n = randInt(rng, 2, 5);
      const g = randInt(rng, 3, 6);
      const total = n * g;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, total - n, "wrong_operation", g);
      addBug(bugs, total * n, "wrong_operation", g);
      return { format: "word_problem", prompt: T("q.dc.groups", { total, n }), answerKind: "int", answer: String(g), meta: { a: total, b: n, op: "/", bugs }, hint: T("hint.division_concept", { a: total, b: n }) };
    }
    const n = randInt(rng, 3, 6);
    const total = n * randInt(rng, 3, 6);
    const options: Option[] = shuffle(rng, [
      { id: "o0", label: T("opt.dc.share", { total, n }), value: "share" },
      { id: "o1", label: T("opt.dc.add", { total, n }), value: "add", errorType: "wrong_operation" as ErrorType },
      { id: "o2", label: T("opt.dc.subtract", { total, n }), value: "subtract", errorType: "wrong_operation" as ErrorType },
      { id: "o3", label: T("opt.dc.multiply", { total, n }), value: "multiply", errorType: "wrong_operation" as ErrorType },
    ]);
    return { format: "mcq", prompt: T("q.dc.meaning"), expression: `${total} ÷ ${n}`, answerKind: "choice", answer: "share", options, meta: { a: total, b: n }, hint: T("hint.division_concept", { a: total, b: n }) };
  },

  division_facts(d, rng) {
    if (d === 3) {
      const b = randInt(rng, 3, 9);
      const q = randInt(rng, 4, 9);
      const ans = b * q;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, b + q, "wrong_operation", ans);
      addBug(bugs, ans + b, "slip", ans);
      addBug(bugs, ans - b, "slip", ans);
      return { format: "fill_blank", prompt: T("q.fill"), expression: `? ÷ ${b} = ${q}`, answerKind: "int", answer: String(ans), meta: { a: ans, b, op: "/", bugs }, hint: T("hint.division_facts", { a: ans, b }) };
    }
    const b = d === 1 ? pick(rng, [2, 5, 10]) : randInt(rng, 6, 9);
    const q = d === 1 ? randInt(rng, 2, 9) : randInt(rng, 4, 9);
    const a = b * q;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, a - b, "wrong_operation", q);
    addBug(bugs, a + b, "wrong_operation", q);
    addBug(bugs, q + 1, "slip", q);
    addBug(bugs, q - 1, "slip", q);
    return { format: "short_answer", prompt: T("q.solve"), expression: `${a} ÷ ${b} = ?`, answerKind: "int", answer: String(q), meta: { a, b, op: "/", bugs }, hint: T("hint.division_facts", { a, b }) };
  },

  long_division(d, rng) {
    if (d === 3) {
      const b = randInt(rng, 3, 7);
      const q = randInt(rng, 5, 12);
      const r = randInt(rng, 1, b - 1);
      const a = b * q + r;
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, q, "remainder", r);
      addBug(bugs, r + 1, "slip", r);
      return { format: "short_answer", prompt: T("q.ld.remainder", { a, b }), answerKind: "int", answer: String(r), meta: { a, b, op: "/", bugs }, hint: T("hint.long_division", { a, b }) };
    }
    let a: number, m: number, q: number;
    if (d === 1) {
      m = randInt(rng, 2, 4);
      q = randInt(rng, 1, Math.floor(9 / m)) * 10 + randInt(rng, 1, Math.floor(9 / m));
      a = q * m;
    } else {
      m = randInt(rng, 3, 6);
      let guard = 0;
      do {
        q = randInt(rng, 12, 39);
        a = q * m;
      } while (Math.floor(a / 10) % m === 0 && guard++ < 20);
    }
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, digitwiseDivide(a, m), "regrouping", q);
    addBug(bugs, a - m, "wrong_operation", q);
    addBug(bugs, q + 1, "slip", q);
    return { format: "short_answer", prompt: T("q.solve"), expression: `${a} ÷ ${m} = ?`, answerKind: "int", answer: String(q), meta: { a, b: m, op: "/", bugs }, hint: T("hint.long_division", { a, b: m }) };
  },

  division_word(d, rng) {
    if (d === 3) {
      const n = randInt(rng, 3, 6);
      const total = n * randInt(rng, 4, 8) + randInt(rng, 1, n - 1);
      const ans = Math.ceil(total / n);
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, Math.floor(total / n), "remainder", ans);
      addBug(bugs, total - n, "wrong_operation", ans);
      return { format: "word_problem", prompt: T("q.dw.autos", { total, n }), answerKind: "int", answer: String(ans), meta: { a: total, b: n, op: "/", bugs }, hint: T("hint.division_word") };
    }
    const n = d === 1 ? pick(rng, [2, 5, 10]) : randInt(rng, 6, 9);
    const each = d === 1 ? randInt(rng, 3, 9) : randInt(rng, 4, 9);
    const total = n * each;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, total - n, "wrong_operation", each);
    addBug(bugs, total + n, "wrong_operation", each);
    addBug(bugs, total * n, "wrong_operation", each);
    addBug(bugs, each + 1, "slip", each);
    return { format: "word_problem", prompt: T(d === 1 ? "q.dw.pack" : "q.dw.teams", { total, n }), answerKind: "int", answer: String(each), meta: { a: total, b: n, op: "/", bugs }, hint: T("hint.division_word") };
  },

  fraction_basics(d, rng) {
    if (d === 1) {
      const den = randInt(rng, 3, 8);
      let num = randInt(rng, 1, den - 1);
      if (num * 2 === den) num = Math.max(1, num - 1);
      const options: Option[] = shuffle(rng, [
        { id: "o0", label: R(frac(num, den)), value: frac(num, den) },
        { id: "o1", label: R(frac(den - num, den)), value: frac(den - num, den), errorType: "unclassified" as ErrorType },
        { id: "o2", label: R(frac(den, num)), value: frac(den, num), errorType: "fraction_inverted" as ErrorType },
        { id: "o3", label: R(frac(num, den - num)), value: frac(num, den - num), errorType: "unclassified" as ErrorType },
      ]);
      return { format: "mcq", prompt: T("q.fb.shaded"), answerKind: "choice", answer: frac(num, den), options, visual: { kind: "fraction_bar", num, den }, meta: { a: num, b: den }, hint: T("hint.fraction_basics") };
    }
    if (d === 2) {
      const den = randInt(rng, 5, 9);
      const num = randInt(rng, 2, den - 2);
      const bugs: Record<string, ErrorType> = {};
      addBug(bugs, num, "fraction_inverted", den);
      addBug(bugs, num + den, "unclassified", den);
      return { format: "mcq", prompt: T("q.fb.denominator", { f: frac(num, den) }), answerKind: "choice", answer: String(den), options: numericOptions(rng, den, bugs), meta: { a: num, b: den, bugs }, hint: T("hint.fraction_basics") };
    }
    const den = pick(rng, [2, 3, 4, 5]);
    const total = den * randInt(rng, 3, 6);
    const ans = total / den;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, total - den, "wrong_operation", ans);
    addBug(bugs, total * den, "wrong_operation", ans);
    return { format: "word_problem", prompt: T("q.fb.of", { d: den, total }), answerKind: "int", answer: String(ans), meta: { a: total, b: den, op: "/", bugs }, hint: T("hint.fraction_basics") };
  },

  equivalent_fractions(d, rng) {
    const den = randInt(rng, 2, 5);
    const num = randInt(rng, 1, den - 1);
    if (d === 3) {
      const k = randInt(rng, 2, 4);
      const options: Option[] = shuffle(rng, [
        { id: "o0", label: R(frac(num * k, den * k)), value: frac(num * k, den * k) },
        { id: "o1", label: R(frac(num + k, den + k)), value: frac(num + k, den + k), errorType: "fraction_additive" as ErrorType },
        { id: "o2", label: R(frac(num, den * k)), value: frac(num, den * k), errorType: "unclassified" as ErrorType },
        { id: "o3", label: R(frac(num * k, den)), value: frac(num * k, den), errorType: "unclassified" as ErrorType },
      ]);
      return { format: "mcq", prompt: T("q.ef.which", { f: frac(num, den) }), answerKind: "choice", answer: frac(num * k, den * k), options, meta: { a: num, b: den }, hint: T("hint.equivalent_fractions", { k }) };
    }
    const k = d === 1 ? 2 : randInt(rng, 3, 5);
    const ans = num * k;
    const bugs: Record<string, ErrorType> = {};
    addBug(bugs, num + den * k - den, "fraction_additive", ans);
    addBug(bugs, num * k + 1, "slip", ans);
    return {
      format: "fill_blank", prompt: T("q.fill"), expression: `${frac(num, den)} = ?/${den * k}`, answerKind: "int", answer: String(ans),
      visual: d === 1 ? { kind: "fraction_compare", a: [num, den], b: [ans, den * k] } : undefined,
      meta: { a: num, b: den, bugs }, hint: T("hint.equivalent_fractions", { k }),
    };
  },

  comparing_fractions(d, rng) {
    let a: [number, number], b: [number, number];
    if (d === 1) {
      const den = randInt(rng, 5, 9);
      const x = randInt(rng, 1, den - 2);
      const y = randInt(rng, x + 1, den - 1);
      [a, b] = rng() < 0.5 ? [[x, den], [y, den]] : [[y, den], [x, den]];
    } else if (d === 2) {
      const n = pick(rng, [1, 1, 2]);
      const p = randInt(rng, 3, 5);
      const q = randInt(rng, p + 1, 9);
      [a, b] = rng() < 0.5 ? [[n, p], [n, q]] : [[n, q], [n, p]];
    } else {
      const pairs: [[number, number], [number, number]][] = [[[2, 3], [3, 5]], [[3, 4], [2, 3]], [[2, 5], [1, 3]], [[5, 6], [3, 4]], [[3, 8], [1, 2]], [[4, 5], [2, 3]]];
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
      format: "mcq", prompt: T("q.cf.bigger"), answerKind: "choice", answer: frac(...big), options,
      visual: d === 1 ? { kind: "fraction_compare", a, b } : undefined, meta: {}, hint: T("hint.comparing_fractions"),
    };
  },

  fraction_addition(d, rng) {
    let n1: number, d1: number, n2: number, d2: number;
    if (d === 2) {
      [n1, d1, n2, d2] = pick(rng, [[1, 2, 1, 4], [1, 3, 1, 6], [1, 2, 1, 6], [1, 4, 3, 8], [1, 5, 3, 10], [1, 2, 3, 8]]);
    } else {
      d1 = d2 = randInt(rng, 5, 9);
      n1 = randInt(rng, 1, d1 - 2);
      n2 = randInt(rng, 1, d1 - 1 - n1);
    }
    const L = (d1 * d2) / gcd(d1, d2);
    const ansN = n1 * (L / d1) + n2 * (L / d2);
    const ans = simplify(ansN, L);
    const bugs: Record<string, ErrorType> = {};
    bugs[frac(n1 + n2, d1 + d2)] = "fraction_add_denominators";
    if (d1 === d2) bugs[frac(n1 + n2, d1 * d2)] = "fraction_add_denominators";
    const meta: QuestionMeta = { bugs };
    if (d === 3) return { format: "word_problem", prompt: T("q.fa.word", { a: frac(n1, d1), b: frac(n2, d2) }), answerKind: "fraction", answer: ans, meta, hint: T("hint.fraction_addition") };
    return { format: "short_answer", prompt: T("q.solve"), expression: `${frac(n1, d1)} + ${frac(n2, d2)} = ?`, answerKind: "fraction", answer: ans, meta, hint: T("hint.fraction_addition") };
  },
};

export function generateQuestion(conceptId: ConceptId, difficulty: Difficulty, rng: Rng, ctx: GenContext = {}): Question {
  const base = gen[conceptId](difficulty, rng, ctx);
  return {
    ...base,
    id: uid("q"),
    conceptId,
    difficulty,
    source: "bank",
    linkedFrom: ctx.link?.conceptId,
  };
}

/** A unique signature so the same item is not asked twice in a session. */
export function questionSignature(q: Question): string {
  return `${q.conceptId}|${q.expression ?? ""}|${JSON.stringify("key" in q.prompt ? q.prompt.params ?? {} : q.prompt.raw)}|${q.visual ? JSON.stringify(q.visual) : ""}`;
}

export function generateUnique(conceptId: ConceptId, difficulty: Difficulty, rng: Rng, seen: Set<string>, ctx: GenContext = {}): Question {
  let q = generateQuestion(conceptId, difficulty, rng, ctx);
  for (let i = 0; i < 12 && seen.has(questionSignature(q)); i++) {
    q = generateQuestion(conceptId, difficulty, rng, i < 3 ? ctx : { ...ctx, link: undefined });
  }
  seen.add(questionSignature(q));
  return q;
}
