// src/lib/rag/vector.ts
/**
 * Vector math and deterministic semantic projection for ShikshaGap RAG.
 * Self-contained without Node.js dependencies, safe for both client and server bundling.
 */

export function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function l2Normalize(vec: number[]): number[] {
  const sumSq = vec.reduce((sum, val) => sum + val * val, 0);
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vec.slice();
  return vec.map((val) => Number((val / norm).toFixed(7)));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  let dot = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

function stringToBytes(str: string): number[] {
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  let h3 = 0x27d4eb2d;
  let h4 = 0x165667b1;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 16777619);
    h2 = Math.imul(h2 ^ code, 2246822519);
    h3 = Math.imul(h3 ^ code, 3266489917);
    h4 = Math.imul(h4 ^ code, 668265263);
  }
  return [
    (h1 >>> 0) & 0xff,
    (h1 >>> 8) & 0xff,
    (h1 >>> 16) & 0xff,
    (h1 >>> 24) & 0xff,
    (h2 >>> 0) & 0xff,
    (h2 >>> 8) & 0xff,
    (h2 >>> 16) & 0xff,
    (h2 >>> 24) & 0xff,
    (h3 >>> 0) & 0xff,
    (h3 >>> 8) & 0xff,
    (h3 >>> 16) & 0xff,
    (h3 >>> 24) & 0xff,
    (h4 >>> 0) & 0xff,
    (h4 >>> 8) & 0xff,
    (h4 >>> 16) & 0xff,
    (h4 >>> 24) & 0xff,
  ];
}

/**
 * Deterministic semantic 768-dim vector generator for offline fallback and evaluations.
 * Partitions the 768 dimensions into:
 * - Dims 0..127: ConceptId projection
 * - Dims 128..191: Type & Board projection
 * - Dims 192..767: Content tokens, bigrams, and domain keywords
 */
export function generateDeterministicSemanticVector(
  text: string,
  metadata: { conceptId?: string; board?: string; type?: string } = {},
  dimensions = 768
): number[] {
  const vec = new Float64Array(dimensions).fill(0);

  // 1. ConceptId Projection (Dims 0..127)
  if (metadata.conceptId) {
    const h = stringToBytes(metadata.conceptId);
    for (let i = 0; i < 128; i++) {
      vec[i] += (h[i % h.length] / 255.0 - 0.5) * 6.0;
    }
  }

  // 2. Type & Board Projection (Dims 128..191)
  const metaStr = `${metadata.board || ""}::${metadata.type || ""}`;
  const mh = stringToBytes(metaStr);
  for (let i = 128; i < 192; i++) {
    vec[i] += (mh[(i - 128) % mh.length] / 255.0 - 0.5) * 4.0;
  }

  // 3. Content tokens and character n-grams (Dims 192..767)
  const contentSpan = 768 - 192; // 576 dimensions
  const fullText = `${text} ${metadata.conceptId || ""} ${(metadata.conceptId || "").replace(/_/g, " ")}`;
  const clean = fullText.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
  const tokens = clean.split(/\s+/).filter((w) => w.length > 2);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const th = stringToBytes(token);
    const idx1 = 192 + ((th[0] | (th[1] << 8)) % contentSpan);
    const idx2 = 192 + ((th[2] | (th[3] << 8)) % contentSpan);
    const sign1 = th[4] % 2 === 0 ? 1 : -1;
    const sign2 = th[5] % 2 === 0 ? 1 : -1;
    const weight = Math.min(3.0, Math.log2(token.length + 1));
    vec[idx1] += weight * sign1;
    vec[idx2] += weight * 0.5 * sign2;

    // Bigram
    if (i < tokens.length - 1) {
      const bigram = `${token}_${tokens[i + 1]}`;
      const bh = stringToBytes(bigram);
      const bIdx = 192 + ((bh[0] | (bh[1] << 8)) % contentSpan);
      const bSign = bh[2] % 2 === 0 ? 1 : -1;
      vec[bIdx] += weight * 0.75 * bSign;
    }
  }

  return l2Normalize(Array.from(vec));
}
