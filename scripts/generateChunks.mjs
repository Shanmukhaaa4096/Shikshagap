// scripts/generateChunks.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function countWords(t) {
  return t.trim().split(/\s+/).filter(Boolean).length;
}

// Helper to pad or ensure word count strictly in 210..350 range
function verifyWordCount(text, id) {
  const wc = countWords(text);
  if (wc < 200 || wc > 400) {
    throw new Error(`Chunk ${id} has invalid word count: ${wc} (must be 200-400)`);
  }
  return text;
}

console.log("Writing chunk data generator...");
