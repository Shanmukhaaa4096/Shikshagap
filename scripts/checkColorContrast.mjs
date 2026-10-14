// Contrast ratio calculation per WCAG 2.1
// Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is lighter and L2 is darker

export function parseHex(hex) {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(ch => ch + ch).join('');
  }
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  return [r, g, b];
}

export function sRgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex) {
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

// ShikshaGap Exact Coolors 5-color Palette
export const SHIKSHAGAP_PALETTE = {
  burgundy: '#36151E', // Main text in light mode, dark-mode background, strong controls
  offwhite: '#EEF0F2', // Light-mode background, primary light text in dark mode
  stone: '#C6C7C4',    // Secondary surfaces, borders, muted elements
  mauve: '#A2999E',    // Supporting surfaces and secondary accents
  mauveText: '#5E5257',// Darkened mauve for readable body/muted text in light mode
  coral: '#F56276',    // Brand accent, highlights, active elements
  darkCard: '#250D15', // Dark burgundy card surface
  white: '#FFFFFF',
  statusGood: '#15803D',
  statusGoodBg: '#DCFCE7',
  statusWarn: '#B45309',
  statusWarnBg: '#FEF3C7',
  statusUrgent: '#B91C1C',
  statusUrgentBg: '#FEE2E2',
};

console.log('=== ShikshaGap WCAG 2.1 AA Contrast Ratio Checks ===\n');

const pairs = [
  // Light Mode Checks
  { fg: SHIKSHAGAP_PALETTE.burgundy, bg: SHIKSHAGAP_PALETTE.offwhite, desc: 'Light mode: Deep burgundy text on Cool off-white background', min: 4.5 },
  { fg: SHIKSHAGAP_PALETTE.burgundy, bg: SHIKSHAGAP_PALETTE.white, desc: 'Light mode: Deep burgundy text on White card surface', min: 4.5 },
  { fg: SHIKSHAGAP_PALETTE.mauveText, bg: SHIKSHAGAP_PALETTE.offwhite, desc: 'Light mode: Muted mauve text on Cool off-white background', min: 4.5 },
  { fg: SHIKSHAGAP_PALETTE.mauveText, bg: SHIKSHAGAP_PALETTE.white, desc: 'Light mode: Muted mauve text on White card surface', min: 4.5 },

  // Coral Button Contrast Check (CRITICAL)
  { fg: SHIKSHAGAP_PALETTE.burgundy, bg: SHIKSHAGAP_PALETTE.coral, desc: 'Coral button: Deep burgundy text on Coral pink background', min: 4.5 },

  // Dark Mode Checks
  { fg: SHIKSHAGAP_PALETTE.offwhite, bg: SHIKSHAGAP_PALETTE.burgundy, desc: 'Dark mode: Cool off-white text on Deep burgundy background', min: 4.5 },
  { fg: SHIKSHAGAP_PALETTE.offwhite, bg: SHIKSHAGAP_PALETTE.darkCard, desc: 'Dark mode: Cool off-white text on Dark burgundy card surface', min: 4.5 },
  { fg: SHIKSHAGAP_PALETTE.stone, bg: SHIKSHAGAP_PALETTE.burgundy, desc: 'Dark mode: Stone grey secondary text on Deep burgundy background', min: 4.5 },
  { fg: SHIKSHAGAP_PALETTE.stone, bg: SHIKSHAGAP_PALETTE.darkCard, desc: 'Dark mode: Stone grey secondary text on Dark burgundy card surface', min: 4.5 },
  { fg: SHIKSHAGAP_PALETTE.coral, bg: SHIKSHAGAP_PALETTE.burgundy, desc: 'Dark mode: Coral pink accent on Deep burgundy background', min: 3.0 },
  { fg: SHIKSHAGAP_PALETTE.coral, bg: SHIKSHAGAP_PALETTE.darkCard, desc: 'Dark mode: Coral pink accent on Dark burgundy card surface', min: 3.0 },

  // Learning Status Checks
  { fg: SHIKSHAGAP_PALETTE.statusGood, bg: SHIKSHAGAP_PALETTE.statusGoodBg, desc: 'Status Good text on Good background', min: 4.5 },
  { fg: SHIKSHAGAP_PALETTE.statusWarn, bg: SHIKSHAGAP_PALETTE.statusWarnBg, desc: 'Status Warn text on Warn background', min: 4.5 },
  { fg: SHIKSHAGAP_PALETTE.statusUrgent, bg: SHIKSHAGAP_PALETTE.statusUrgentBg, desc: 'Status Urgent text on Urgent background', min: 4.5 },
];

let failed = false;
for (const p of pairs) {
  const ratio = contrastRatio(p.fg, p.bg);
  const pass = ratio >= p.min;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${p.desc}\n       ${p.fg} on ${p.bg}: ${ratio.toFixed(2)}:1 (required: >= ${p.min}:1)`);
  if (!pass) failed = true;
}

console.log('\n--- WCAG Compliance Verification ---');
const offwhiteOnCoral = contrastRatio(SHIKSHAGAP_PALETTE.offwhite, SHIKSHAGAP_PALETTE.coral);
console.log(`Verification: Off-white on Coral yields ${offwhiteOnCoral.toFixed(2)}:1 (FAILS WCAG AA < 4.5:1)`);
const burgundyOnCoral = contrastRatio(SHIKSHAGAP_PALETTE.burgundy, SHIKSHAGAP_PALETTE.coral);
console.log(`Verification: Deep Burgundy on Coral yields ${burgundyOnCoral.toFixed(2)}:1 (PASSES WCAG AA >= 4.5:1)`);

if (failed) {
  console.error('\nContrast check failed!');
  process.exit(1);
} else {
  console.log('\nAll designated color pairs pass WCAG AA targets with the new 5-color palette!');
}
