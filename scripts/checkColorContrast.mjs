// Contrast ratio calculation per WCAG 2.1
// Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is lighter and L2 is darker

function parseHex(hex) {
  let c = hex.replace("#", "").trim();
  if (c.length === 3) {
    c = c.split("").map(ch => ch + ch).join("");
  }
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  return [r, g, b];
}

function sRgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex);
  const R = sRgbToLinear(r);
  const G = sRgbToLinear(g);
  const B = sRgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const PALETTE = {
  red: "#DE2A35",
  redDark: "#B51E28",
  sage: "#8ABB93",
  cream: "#F5F1BC",
  creamLight: "#FAF8E8",
  clay: "#DFA06E",
  brown: "#432623",
  darkBg: "#251614",
  darkCard: "#311E1B",
  white: "#FFFFFF",
  black: "#000000"
};

console.log("=== WCAG Contrast Ratio Checks ===");
const pairs = [
  { fg: PALETTE.brown, bg: PALETTE.creamLight, desc: "Brown text on light cream background", min: 4.5 },
  { fg: PALETTE.brown, bg: PALETTE.cream, desc: "Brown text on cream card", min: 4.5 },
  { fg: PALETTE.brown, bg: PALETTE.sage, desc: "Brown text on sage badge fill", min: 4.5 },
  { fg: PALETTE.brown, bg: PALETTE.clay, desc: "Brown text on clay badge fill", min: 4.5 },
  { fg: PALETTE.redDark, bg: PALETTE.creamLight, desc: "Dark red #B51E28 text on cream-light", min: 4.5 },
  { fg: PALETTE.redDark, bg: PALETTE.cream, desc: "Dark red #B51E28 text on cream card", min: 4.5 },
  { fg: PALETTE.red, bg: PALETTE.creamLight, desc: "Primary red #DE2A35 for large text / borders (>= 18pt / UI)", min: 3.0 },
  { fg: PALETTE.creamLight, bg: PALETTE.red, desc: "Cream text on primary red button (large / bold >= 18px)", min: 3.0 },
  { fg: PALETTE.creamLight, bg: PALETTE.redDark, desc: "Cream text on dark red button", min: 4.5 },
  { fg: PALETTE.creamLight, bg: PALETTE.darkBg, desc: "Cream text on dark editorial background", min: 4.5 }
];

let failed = false;
for (const p of pairs) {
  const ratio = contrastRatio(p.fg, p.bg);
  const pass = ratio >= p.min;
  console.log(`[${pass ? "PASS" : "FAIL"}] ${p.desc} (${p.fg} on ${p.bg}): ${ratio.toFixed(2)}:1 (required: ${p.min}:1)`);
  if (!pass) failed = true;
}

// Check illegal pairs mentioned in requirements:
const illegalSageOnCream = contrastRatio(PALETTE.sage, PALETTE.creamLight);
console.log(`Illegal: Sage text on cream: ${illegalSageOnCream.toFixed(2)}:1 (MUST NOT BE USED FOR TEXT)`);
const illegalClayOnCream = contrastRatio(PALETTE.clay, PALETTE.creamLight);
console.log(`Illegal: Clay text on cream: ${illegalClayOnCream.toFixed(2)}:1 (MUST NOT BE USED FOR TEXT)`);
const redOnCream = contrastRatio(PALETTE.red, PALETTE.creamLight);
console.log(`Info: Red #DE2A35 on cream-light: ${redOnCream.toFixed(2)}:1 (< 4.5, so use #B51E28 for normal text)`);

if (failed) {
  console.error("Some color pairs failed contrast checks!");
  process.exit(1);
} else {
  console.log("All designated pairs pass WCAG AA targets!");
}
