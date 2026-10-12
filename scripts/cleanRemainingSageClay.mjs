import fs from "fs";

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  
  // Landing page text fixes:
  content = content.replace(
    'className="text-sm font-mono uppercase tracking-widest text-[#8ABB93] font-bold mb-1"',
    'className="text-sm font-mono uppercase tracking-widest text-[#432623] dark:text-[#FAF8E8] font-bold mb-1"'
  );
  content = content.replace(
    'className="text-sm font-mono uppercase tracking-wider text-[#8ABB93] font-bold mb-1"',
    'className="text-sm font-mono uppercase tracking-wider text-[#432623] dark:text-[#FAF8E8] font-bold mb-1"'
  );
  content = content.replace(
    "currentStudent.statusType === 'critical' ? 'text-[#DE2A35]' : 'text-[#8ABB93]'",
    "currentStudent.statusType === 'critical' ? 'text-[#B51E28]' : 'text-[#432623] dark:text-[#FAF8E8] font-bold'"
  );
  content = content.replace(
    'className="text-sm font-mono text-[#DFA06E] font-bold uppercase tracking-wider"',
    'className="text-sm font-mono text-[#432623] dark:text-[#FAF8E8] font-bold uppercase tracking-wider"'
  );
  content = content.replace(
    'className="text-sm font-mono text-[#8ABB93] font-bold uppercase tracking-wider"',
    'className="text-sm font-mono text-[#432623] dark:text-[#FAF8E8] font-bold uppercase tracking-wider"'
  );
  content = content.replace(
    'className="text-sm font-mono uppercase tracking-widest text-[#8ABB93] font-bold"',
    'className="text-sm font-mono uppercase tracking-widest text-[#432623] dark:text-[#FAF8E8] font-bold"'
  );
  
  fs.writeFileSync(filePath, content, "utf8");
}

cleanFile("./src/app/LandingPageClient.tsx");

// ReportClientView
let rcv = fs.readFileSync("./src/app/report/[token]/ReportClientView.tsx", "utf8");
rcv = rcv.replace('text-[#8ABB93]', 'text-[#432623] dark:text-[#FAF8E8]');
fs.writeFileSync("./src/app/report/[token]/ReportClientView.tsx", rcv, "utf8");

// AdaptiveAssessmentView
let aav = fs.readFileSync("./src/components/AdaptiveAssessmentView.tsx", "utf8");
aav = aav.replace('<div className="font-serif text-2xl font-bold text-[#DFA06E] mt-1">', '<div className="font-serif text-2xl font-bold text-[#432623] mt-1">');
aav = aav.replace('<div className="font-serif text-2xl font-bold text-[#8ABB93] mt-1">', '<div className="font-serif text-2xl font-bold text-[#432623] mt-1">');
fs.writeFileSync("./src/components/AdaptiveAssessmentView.tsx", aav, "utf8");

// StudentDiagnosticModal
let sdm = fs.readFileSync("./src/components/StudentDiagnosticModal.tsx", "utf8");
sdm = sdm.replace('text-[#8ABB93]', 'text-[#432623]');
fs.writeFileSync("./src/components/StudentDiagnosticModal.tsx", sdm, "utf8");

console.log("Cleaned explicit text usages of sage and clay.");
