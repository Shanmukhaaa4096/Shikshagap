import fs from "fs";
import path from "path";

function walk(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      results.push(...walk(full));
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      results.push(full);
    }
  }
  return results;
}

const files = walk("./src");
let touched = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  let original = content;

  // 1. Where sage or clay are used as background fills, ensure text on top is dark brown #432623:
  content = content.replace(/bg-\[#8ABB93\]\/15\s+text-\[#8ABB93\]/g, "bg-[#8ABB93] text-[#432623] font-bold");
  content = content.replace(/bg-\[#8ABB93\]\/20\s+text-\[#8ABB93\]/g, "bg-[#8ABB93] text-[#432623] font-bold");
  content = content.replace(/bg-\[#DFA06E\]\/15\s+text-\[#DFA06E\]/g, "bg-[#DFA06E] text-[#432623] font-bold");
  content = content.replace(/bg-\[#DFA06E\]\/20\s+text-\[#DFA06E\]/g, "bg-[#DFA06E] text-[#432623] font-bold");

  content = content.replace(/border-\[#8ABB93\]\s+text-\[#8ABB93\]/g, "bg-[#8ABB93] text-[#432623] border-[#432623]/30");
  content = content.replace(/border-\[#DFA06E\]\s+text-\[#DFA06E\]/g, "bg-[#DFA06E] text-[#432623] border-[#432623]/30");

  // Editorial metadata or headers in sage/clay -> dark brown text with bold weight
  content = content.replace(/editorial-meta text-\[#8ABB93\]/g, "editorial-meta text-[#432623] font-bold");
  content = content.replace(/editorial-meta text-\[#DFA06E\]/g, "editorial-meta text-[#432623] font-bold");

  // Big numbers on landing page in sage or clay -> use dark brown or high-contrast fill
  content = content.replace(/font-serif text-5xl sm:text-6xl font-normal text-\[#DFA06E\]/g, "font-serif text-5xl sm:text-6xl font-normal text-[#432623]");
  content = content.replace(/font-serif text-5xl sm:text-6xl font-normal text-\[#8ABB93\]/g, "font-serif text-5xl sm:text-6xl font-normal text-[#432623]");

  // In status strings:
  content = content.replace(/text-\[#8ABB93\] font-semibold/g, "text-[#432623] font-bold bg-[#8ABB93]/40 px-1.5 py-0.5 rounded-[2px]");
  content = content.replace(/text-\[#8ABB93\] font-mono/g, "text-[#432623] font-mono");
  content = content.replace(/text-\[#DFA06E\] font-mono/g, "text-[#432623] font-mono");

  // In hint text:
  content = content.replace(/<strong className=\"text-\[#DFA06E\]\">Hint:<\/strong>/g, '<strong className="text-[#432623] bg-[#DFA06E] px-1 rounded-[2px]">Hint:</strong>');

  // Small red text on cream-light (< 18px): use #B51E28 (6.2:1 contrast)
  content = content.replace(/text-sm([^\"\']*?)text-\[#DE2A35\]/g, "text-sm$1text-[#B51E28]");
  content = content.replace(/text-xs([^\"\']*?)text-\[#DE2A35\]/g, "text-xs$1text-[#B51E28]");
  content = content.replace(/text-\[#DE2A35\]([^\"\']*?)text-sm/g, "text-[#B51E28]$1text-sm");
  content = content.replace(/text-\[#DE2A35\]([^\"\']*?)text-xs/g, "text-[#B51E28]$1text-xs");

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    touched++;
  }
}

console.log("Contrast updates applied across files:", touched);
