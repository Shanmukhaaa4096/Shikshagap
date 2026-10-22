// scripts/validateCorpus.mjs
import { loadAndValidateCorpus } from "../src/lib/rag/loader.ts";

try {
  const chunks = loadAndValidateCorpus();
  console.log(`[Corpus Validation Passed] ${chunks.length} chunks validated across NCERT, CBSE, and ICSE.`);
} catch (err) {
  console.error(`[Corpus Validation Failed] Build aborted:`, err);
  process.exit(1);
}
