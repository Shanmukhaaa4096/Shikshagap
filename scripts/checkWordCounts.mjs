import fs from "fs";

const content = fs.readFileSync("scripts/buildCorpusFiles.mjs", "utf-8");
const regex = /id:\s*"([^"]+)"[\s\S]*?text:\s*`([\s\S]*?)`/g;
let match;
const issues = [];
while ((match = regex.exec(content)) !== null) {
  const id = match[1];
  const text = match[2];
  const wc = text.trim().split(/\s+/).filter(Boolean).length;
  if (wc < 200 || wc > 400) {
    issues.push({ id, wc });
  }
}
console.log("Issues found:", issues.length);
for (const iss of issues) {
  console.log(`- ${iss.id}: ${iss.wc} words`);
}
