#!/usr/bin/env node
/**
 * scripts/checkLinks.mjs
 *
 * Verifies all resources in src/data/resources.json:
 * 1. Checks that there are no "TODO" strings anywhere in the entry fields.
 * 2. Checks that every URL returns HTTP 200.
 *
 * Fails with exit code 1 if any TODO or non-200 URL is detected.
 */

import fs from "fs";
import path from "path";
import http from "http";
import https from "https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resourcesPath = path.resolve(__dirname, "../src/data/resources.json");

if (!fs.existsSync(resourcesPath)) {
  console.error(`[check:links] ERROR: Resource file not found: ${resourcesPath}`);
  process.exit(1);
}

const resources = JSON.parse(fs.readFileSync(resourcesPath, "utf-8"));
console.log(`[check:links] Verifying ${resources.length} resources...`);

let hasError = false;

// 1. Check for TODO markers
for (const res of resources) {
  const jsonStr = JSON.stringify(res);
  if (jsonStr.includes("TODO")) {
    console.error(`[check:links] ERROR: Resource ${res.id} contains 'TODO':`, res);
    hasError = true;
  }
}

// Helper to fetch URL with retry and timeout
function checkUrl(urlStr, maxRedirects = 3) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const mod = u.protocol === "https:" ? https : http;
      const opts = {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      };

      const req = mod.request(u, opts, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && maxRedirects > 0) {
          const redirectUrl = new URL(res.headers.location, u).toString();
          res.resume();
          return resolve(checkUrl(redirectUrl, maxRedirects - 1));
        }

        const ok = res.statusCode === 200;
        res.resume();
        resolve({ ok, status: res.statusCode, url: urlStr });
      });

      req.on("error", (err) => {
        resolve({ ok: false, status: 0, error: err.message, url: urlStr });
      });

      req.setTimeout(12000, () => {
        req.destroy();
        resolve({ ok: false, status: 0, error: "ETIMEDOUT", url: urlStr });
      });

      req.end();
    } catch (err) {
      resolve({ ok: false, status: 0, error: err.message, url: urlStr });
    }
  });
}

// 2. Run URL verification sequentially / in small batches
async function run() {
  for (let i = 0; i < resources.length; i++) {
    const res = resources[i];
    process.stdout.write(`[${i + 1}/${resources.length}] Checking ${res.id}... `);
    let result = await checkUrl(res.url);

    // One retry on timeout / transient network glitch
    if (!result.ok) {
      await new Promise((r) => setTimeout(r, 1000));
      result = await checkUrl(res.url);
    }

    if (result.ok) {
      console.log(`OK (200)`);
    } else {
      console.log(`FAILED! Status: ${result.status}, Error: ${result.error || "Non-200"}`);
      console.error(`  URL: ${res.url}`);
      hasError = true;
    }
  }

  if (hasError) {
    console.error(`\n[check:links] FAILED: One or more resources failed verification.`);
    process.exit(1);
  } else {
    console.log(`\n[check:links] SUCCESS: All ${resources.length} resources are HTTP 200 and have no TODOs.`);
  }
}

run();
