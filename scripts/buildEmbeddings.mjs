// scripts/buildEmbeddings.mjs
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { loadAndValidateCorpus } from "../src/lib/rag/loader.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetEmbeddingsFile = path.resolve(__dirname, "../data/embeddings.json");

import {
  l2Normalize,
  generateDeterministicSemanticVector,
} from "../src/lib/rag/vector.ts";

export { l2Normalize, generateDeterministicSemanticVector };

export function computeContentHash(chunk) {
  return crypto
    .createHash("sha256")
    .update(`${chunk.id}:${chunk.board}:${chunk.class}:${chunk.conceptId}:${chunk.type}:${chunk.lang}:${chunk.text}`)
    .digest("hex");
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedWithGemini(ai, text, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
        config: {
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: 768,
        },
      });

      const values = response?.embedding?.values;
      if (!values || !Array.isArray(values) || values.length === 0) {
        throw new Error("Invalid or empty embedding values returned by Gemini API");
      }
      return l2Normalize(values);
    } catch (err) {
      const isRateLimit = err?.status === 429 || String(err).includes("429") || String(err).includes("RESOURCE_EXHAUSTED");
      if (isRateLimit && attempt < retries) {
        const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(`[Embedding Rate Limited] Backing off for ${Math.round(backoff)}ms (attempt ${attempt}/${retries})...`);
        await sleep(backoff);
      } else if (attempt < retries) {
        const backoff = 1000 * attempt;
        console.warn(`[Embedding Error] ${err?.message || err}. Retrying in ${backoff}ms...`);
        await sleep(backoff);
      } else {
        throw err;
      }
    }
  }
}

export async function buildEmbeddings() {
  console.log("Loading and validating curriculum knowledge corpus...");
  const chunks = loadAndValidateCorpus();
  console.log(`Corpus loaded successfully: ${chunks.length} valid chunks.`);

  // Load existing cache
  const force = process.argv.includes("--force");
  let existingCache = new Map();
  if (!force && fs.existsSync(targetEmbeddingsFile)) {
    try {
      const raw = JSON.parse(fs.readFileSync(targetEmbeddingsFile, "utf-8"));
      if (Array.isArray(raw)) {
        for (const entry of raw) {
          if (entry.id && entry.contentHash && Array.isArray(entry.vector) && entry.vector.length === 768) {
            existingCache.set(entry.id, entry);
          }
        }
      }
      console.log(`Loaded ${existingCache.size} existing cached embeddings.`);
    } catch {
      console.warn("Could not parse existing data/embeddings.json. Building from scratch.");
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  let ai = null;
  if (apiKey) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      ai = new GoogleGenAI({ apiKey });
      console.log("Gemini API client initialized with GEMINI_API_KEY for embedding generation.");
    } catch (err) {
      console.warn("Failed to initialize GoogleGenAI client:", err?.message);
    }
  } else {
    console.log("No GEMINI_API_KEY detected in environment. Using deterministic semantic vectors for build.");
  }

  const embeddedChunks = [];
  let reusedCount = 0;
  let computedCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const hash = computeContentHash(chunk);
    const cached = existingCache.get(chunk.id);

    if (cached && cached.contentHash === hash) {
      // Unchanged chunk, reuse embedding
      embeddedChunks.push({
        ...chunk,
        contentHash: hash,
        vector: cached.vector,
      });
      reusedCount++;
      continue;
    }

    // Must embed
    let vector;
    if (ai) {
      try {
        console.log(`[${i + 1}/${chunks.length}] Embedding chunk '${chunk.id}' via Gemini API...`);
        vector = await embedWithGemini(ai, chunk.text);
        // Small rate limit pause between calls
        await sleep(150);
      } catch (err) {
        console.error(`Gemini API embedding failed for '${chunk.id}':`, err?.message);
        console.log(`Falling back to deterministic semantic vector for '${chunk.id}'`);
        vector = generateDeterministicSemanticVector(chunk.text, chunk, 768);
      }
    } else {
      vector = generateDeterministicSemanticVector(chunk.text, chunk, 768);
    }

    embeddedChunks.push({
      ...chunk,
      contentHash: hash,
      vector,
    });
    computedCount++;
  }

  console.log(`Embedding Summary: ${reusedCount} reused from cache, ${computedCount} computed.`);
  fs.writeFileSync(targetEmbeddingsFile, JSON.stringify(embeddedChunks, null, 2), "utf-8");
  console.log(`Successfully written ${embeddedChunks.length} embeddings to ${targetEmbeddingsFile}`);
  return embeddedChunks;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildEmbeddings()
    .then(() => {
      console.log("Embedding build completed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Embedding build failed:", err);
      process.exit(1);
    });
}
