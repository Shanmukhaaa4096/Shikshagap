// src/data/curriculum/remediationActivities.ts
/**
 * Zero-cost manipulative activities and authentic curriculum citations for 5-day remediation plans.
 * Provides static, high-performance pedagogical grounding without disk I/O or client-side fs dependencies.
 */

export interface RemediationCurriculumItem {
  conceptId: string;
  source: string;
  activityText: string;
  chunkId: string;
}

export const REMEDIATION_CURRICULUM_ITEMS: Record<string, RemediationCurriculumItem> = {
  place_value: {
    conceptId: "place_value",
    source: "NCERT Math-Magic Class 5 Chapter 1: The Fish Tale, Section: Numbers up to 10 Lakhs",
    activityText: "Classroom play money and bead strings: students unbundle 10 tens into 1 hundred bundle using rubber bands and chalk place value mats to verify digit positions.",
    chunkId: "ncert-c5-pv-04",
  },
  multi_digit_mult: {
    conceptId: "multi_digit_mult",
    source: "NCERT Math-Magic Class 5 Chapter 13: Ways to Multiply and Divide, Section: Bela's Method",
    activityText: "Bela's box area model on grid paper: draw rectangles partitioned into tens and ones (e.g. 60+5 by 30+4), calculate partial products in four quadrants, and sum them.",
    chunkId: "ncert-c5-mult-04",
  },
  long_division: {
    conceptId: "long_division",
    source: "NCERT Math-Magic Class 5 Chapter 13: Ways to Multiply and Divide, Section: Sharing Equal Shares",
    activityText: "Tamarind seeds and bottle cap distribution: children divide 75 seeds among 4 bowls by first distributing bundles of 10, then exchanging remaining tens for ones.",
    chunkId: "ncert-c5-div-04",
  },
  division_facts: {
    conceptId: "division_facts",
    source: "NCERT Math-Magic Class 4 Chapter 12: How Heavy? How Light?, Section: Equal Sharing",
    activityText: "Equal sharing arrays using chalk grids and dried beans: arrange 24 beans into 4 rows of 6, discovering the inverse relation 4 x 6 = 24 and 24 / 4 = 6.",
    chunkId: "ncert-c5-div-01",
  },
  fractions: {
    conceptId: "fractions",
    source: "NCERT Math-Magic Class 5 Chapter 4: Parts and Wholes, Section: Paper Strips and Equal Cuts",
    activityText: "Equal strip paper folding: children fold identical newspaper strips into 2, 4, and 8 equal parts, coloring unit fractions and superimposing strips to verify equivalence.",
    chunkId: "ncert-c5-frac-04",
  },
  decimals: {
    conceptId: "decimals",
    source: "NCERT Math-Magic Class 5 Chapter 10: Tenths and Hundredths, Section: Centimeter Scale",
    activityText: "Transparent 10x10 tenths and hundredths grids: shading 0.3 (3 strips of 10) vs 0.03 (3 individual squares) to concretely overcome the whole-number comparison misconception.",
    chunkId: "ncert-c5-dec-04",
  },
  factors_multiples: {
    conceptId: "factors_multiples",
    source: "NCERT Math-Magic Class 5 Chapter 6: Be My Multiple, I'll Be Your Factor, Section: Cat and Mouse Game",
    activityText: "Number line stepping game: students jump along a chalk floor line marked 1 to 50 in steps of 3 and 4, identifying meeting points as common multiples.",
    chunkId: "ncert-c5-fac-04",
  },
  measurement: {
    conceptId: "measurement",
    source: "NCERT Math-Magic Class 5 Chapter 11: Area and its Boundary, Section: Thread Boundary",
    activityText: "Piece of string boundary activity: wrap a 30 cm string around irregular leaves and flat stones on 1 cm square grid paper, counting enclosed squares.",
    chunkId: "ncert-c5-meas-04",
  },
  geometry_angles: {
    conceptId: "geometry_angles",
    source: "NCERT Math-Magic Class 5 Chapter 2: Shapes and Angles, Section: Cardboard Strips and Drawing Pins",
    activityText: "Pair of cardboard strips joined with a brass split pin: open the tester to match classroom corners (right angle), scissors (acute), and clock hands at 4:00 (obtuse).",
    chunkId: "ncert-c5-geo-04",
  },
  data_handling: {
    conceptId: "data_handling",
    source: "NCERT Math-Magic Class 5 Chapter 12: Smart Charts, Section: Tally Marks on the Road",
    activityText: "Classroom tally mark survey: count stationery items in pencil boxes using five-bar tally gates (four vertical strokes and a diagonal cross) and draw block charts.",
    chunkId: "ncert-c5-data-04",
  },
  icse_hcf_lcm: {
    conceptId: "icse_hcf_lcm",
    source: "CISCE Mathematics Class 5 Theme: Number System, Unit: Prime Factorization and HCF/LCM",
    activityText: "Factor tree construction using colored beads: decompose composite numbers into prime factor branches, identifying common prime factors in overlapping loops.",
    chunkId: "icse-c5-hcf-04",
  },
  icse_fractions: {
    conceptId: "icse_fractions",
    source: "CISCE Mathematics Class 5 Theme: Fractions and Decimals, Unit: Reciprocals and Division",
    activityText: "Fraction division ribbon cutting: take a ribbon of length 3/4 meters, use a 1/8 meter marker stick to measure how many 1/8 segments fit inside.",
    chunkId: "icse-c5-frac-04",
  },
};

export function getRemediationCurriculumItem(conceptId: string): RemediationCurriculumItem {
  if (REMEDIATION_CURRICULUM_ITEMS[conceptId]) {
    return REMEDIATION_CURRICULUM_ITEMS[conceptId];
  }
  // Fallback to related core concepts
  const cid = conceptId.toLowerCase();
  if (cid.includes("div")) return REMEDIATION_CURRICULUM_ITEMS.long_division;
  if (cid.includes("mult")) return REMEDIATION_CURRICULUM_ITEMS.multi_digit_mult;
  if (cid.includes("frac")) return REMEDIATION_CURRICULUM_ITEMS.fractions;
  if (cid.includes("dec")) return REMEDIATION_CURRICULUM_ITEMS.decimals;
  if (cid.includes("fact") || cid.includes("hcf") || cid.includes("lcm")) return REMEDIATION_CURRICULUM_ITEMS.factors_multiples;
  if (cid.includes("area") || cid.includes("meas") || cid.includes("perim")) return REMEDIATION_CURRICULUM_ITEMS.measurement;
  if (cid.includes("geom") || cid.includes("angle") || cid.includes("shape")) return REMEDIATION_CURRICULUM_ITEMS.geometry_angles;
  return REMEDIATION_CURRICULUM_ITEMS.place_value;
}
