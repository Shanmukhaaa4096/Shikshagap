/**
 * Translation key definitions for ShikshaGap.
 * Defines strongly-typed keys for question prompts, hints, options, and UI elements.
 */

export type QuestionKey =
  | "q.solve"
  | "q.fill"
  | "q.ns.bigger"
  | "q.ns.largest"
  | "q.ns.after"
  | "q.pv.value"
  | "q.pv.expanded"
  | "q.add.word"
  | "q.sub.word"
  | "q.mc.array"
  | "q.mc.groups"
  | "q.mc.repeated"
  | "q.mdm.word"
  | "q.dc.meaning"
  | "q.dc.groups"
  | "q.dc.share"
  | "q.ld.remainder"
  | "q.dw.autos"
  | "q.fb.shaded"
  | "q.fb.denominator"
  | "q.fb.of"
  | "q.ef.which"
  | "q.cf.bigger"
  | "q.fa.word";

export type HintKey =
  | "hint.number_sense"
  | "hint.place_value"
  | "hint.addition"
  | "hint.subtraction"
  | "hint.mult_concept"
  | "hint.mult_facts"
  | "hint.multi_digit_mult"
  | "hint.division_concept"
  | "hint.division_facts"
  | "hint.long_division"
  | "hint.division_word"
  | "hint.fraction_basics"
  | "hint.equivalent_fractions"
  | "hint.comparing_fractions"
  | "hint.fraction_addition";

export type OptionKey =
  | "opt.dc.share"
  | "opt.dc.groups"
  | "opt.dc.subtract"
  | "opt.dc.multiply"
  | "opt.dc.add";

export type DecisionKey =
  | "dec.start"
  | "dec.harder"
  | "dec.easier"
  | "dec.resolved_mastered"
  | "dec.resolved_gap"
  | "dec.resolved_developing"
  | "dec.probe_prereq"
  | "dec.skip_prereqs"
  | "dec.check_impact"
  | "dec.stop_evidence"
  | "dec.stop_budget";

export type KnownTKey = QuestionKey | HintKey | OptionKey | DecisionKey;

/**
 * TKey represents any valid translation key.
 * Uses (string & {}) to preserve IDE autocomplete for known keys while allowing extension.
 */
export type TKey = KnownTKey | (string & {});
