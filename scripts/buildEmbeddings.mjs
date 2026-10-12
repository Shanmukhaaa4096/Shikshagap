#!/usr/bin/env node
/**
 * scripts/buildEmbeddings.mjs
 *
 * Reads src/data/resources.json and creates src/data/resources.embeddings.json.
 * Uses @google/genai with the configured embedding model (defaults to text-embedding-004)
 * if GEMINI_API_KEY is available.
 * If GEMINI_API_KEY is not available (e.g. offline dev/CI), computes a deterministic
 * normalized pseudo-embedding based on term frequencies and character n-grams so the
 * file is always valid, runnable, and cosine-searchable.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resourcesPath = path.resolve(__dirname, "../src/data/resources.json");
const outputPath = path.resolve(__dirname, "../src/data/resources.embeddings.json");

if (!fs.existsSync(resourcesPath)) {
  console.error(`[build:embeddings] Resource file not found: ${resourcesPath}`);
  process.exit(1);
}

const resources = JSON.parse(fs.readFileSync(resourcesPath, "utf-8"));
const modelName = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
const apiKey = process.env.GEMINI_API_KEY;

/**
 * Deterministic fallback embedding generator (dimension 128)
 * Hashes tokens and character n-grams to produce a unit-normalized vector.
 */
export function generateDeterministicEmbedding(text, dim = 128) {
  const vec = new Float64Array(dim);
  const normalized = text.toLowerCase();
  const words = normalized.split(/\W+/).filter(Boolean);

  // Bag of words hash
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 1.0;
  }

  // 3-grams hash for sub-word and multilingual character matching
  for (let i = 0; i < normalized.length - 2; i++) {
    const gram = normalized.slice(i, i + 3);
    let hash = 0;
    for (let j = 0; j < gram.length; j++) {
      hash = (hash << 5) - hash + gram.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 0.5;
  }

  // L2 normalize
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vec[i] /= norm;
    }
  }

  return Array.from(vec);
}

async function main() {
  console.log(`[build:embeddings] Processing ${resources.length} resources...`);
  const embeddings = {};

  let genAI = null;
  if (apiKey) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      genAI = new GoogleGenAI({ apiKey });
      console.log(`[build:embeddings] Using Gemini API with model: ${modelName}`);
    } catch (err) {
      console.warn(`[build:embeddings] Failed to load GoogleGenAI client: ${err.message}. Using deterministic fallback.`);
    }
  } else {
    console.log(`[build:embeddings] GEMINI_API_KEY not set. Using deterministic fallback embeddings.`);
  }

  for (let i = 0; i < resources.length; i++) {
    const item = resources[i];
    const textToEmbed = `${item.title}. ${item.description}. Topic: ${item.topicId}. Concepts: ${item.conceptIds.join(", ")}. Grade: ${item.grade.join(", ")}. Language: ${item.language}.`;

    if (genAI) {
      try {
        const response = await genAI.models.embedContent({
          model: modelName,
          contents: textToEmbed,
        });
        if (response?.embedding?.values) {
          embeddings[item.id] = response.embedding.values;
        } else {
          throw new Error("No values in response");
        }
      } catch (err) {
        console.warn(`[build:embeddings] API embedding failed for ${item.id}: ${err.message}. Falling back to deterministic vector.`);
        embeddings[item.id] = generateDeterministicEmbedding(textToEmbed);
      }
    } else {
      embeddings[item.id] = generateDeterministicEmbedding(textToEmbed);
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(embeddings, null, 2), "utf-8");
  console.log(`[build:embeddings] Successfully wrote ${Object.keys(embeddings).length} embeddings to ${outputPath}`);
}

main();
