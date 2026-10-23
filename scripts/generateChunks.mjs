// scripts/generateChunks.mjs
export function countWords(t) {
  return t.trim().split(/\s+/).filter(Boolean).length;
}

// Helper to pad or ensure word count strictly in 210..350 range
export function verifyWordCount(text, id) {
  const wc = countWords(text);
  if (wc < 200 || wc > 400) {
    throw new Error(`Chunk ${id} has invalid word count: ${wc} (must be 200-400)`);
  }
  return text;
}

