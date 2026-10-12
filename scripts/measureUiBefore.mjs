/**
 * scripts/measureUiBefore.mjs
 *
 * STEP 1: Measure first, change nothing.
 * Starts next dev or standalone web server, captures screenshots at 360x640 and 1280x800 of:
 * 1. Home (/)
 * 2. Login (/login)
 * 3. Student Assessment - Question screen (/app?role=student)
 * 4. Teacher Dashboard (/app?role=teacher)
 * 5. Student Diagnostic Modal (triggers modal on dashboard)
 * 6. Worksheet Modal (triggers worksheet modal on dashboard)
 * 7. Report Page (/report/demo-token)
 * Saves all screenshots to docs/ui-before/
 * Runs an axe-core scan on each page and counts:
 * - axe violation nodes
 * - elements with text < 14px (computed font-size < 14px)
 * - interactive tap targets < 44px (width < 44 or height < 44)
 */

import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "docs", "ui-before");

const VIEWPORTS = [
  { name: "mobile", width: 360, height: 640 },
  { name: "desktop", width: 1280, height: 800 },
];

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function measureMetrics(page) {
  return await page.evaluate(() => {
    let smallTextCount = 0;
    const smallTextElements = [];
    let smallTargetCount = 0;
    const smallTargets = [];

    // All elements for font size
    const all = document.querySelectorAll("*");
    for (const el of all) {
      // If it contains direct text
      const hasDirectText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
      );
      if (hasDirectText) {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize > 0 && fontSize < 14) {
          smallTextCount++;
          if (smallTextElements.length < 10) {
            smallTextElements.push({
              tag: el.tagName.toLowerCase(),
              fontSize: style.fontSize,
              text: el.textContent.trim().slice(0, 30),
            });
          }
        }
      }
    }

    // Interactive elements for tap target
    const interactives = document.querySelectorAll(
      "button, a, input, select, textarea, [role='button'], [tabindex='0']"
    );
    for (const el of interactives) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (rect.width < 44 || rect.height < 44) {
          smallTargetCount++;
          if (smallTargets.length < 10) {
            smallTargets.push({
              tag: el.tagName.toLowerCase(),
              w: Math.round(rect.width),
              h: Math.round(rect.height),
              text: el.textContent.trim().slice(0, 20),
            });
          }
        }
      }
    }

    return {
      smallTextCount,
      smallTargetCount,
      sampleSmallText: smallTextElements,
      sampleSmallTargets: smallTargets,
    };
  });
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });
  console.log(`Saving screenshots to ${outDir}`);

  const browser = await chromium.launch({ headless: true });
  const reportData = {
    timestamp: new Date().toISOString(),
    pages: {},
  };

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\nTesting Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      // 1. Home Page
      console.log(`  Capturing Home (/)...`);
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      await page.screenshot({ path: path.join(outDir, `home_${vp.name}.png`), fullPage: false });
      if (vp.name === "desktop") {
        const axe = await new AxeBuilder({ page }).analyze();
        const metrics = await measureMetrics(page);
        reportData.pages["home"] = {
          axeIssues: axe.violations.length,
          violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, desc: v.description })),
          ...metrics,
        };
      }

      // 2. Login Page
      console.log(`  Capturing Login (/login)...`);
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
      await page.screenshot({ path: path.join(outDir, `login_${vp.name}.png`), fullPage: false });
      if (vp.name === "desktop") {
        const axe = await new AxeBuilder({ page }).analyze();
        const metrics = await measureMetrics(page);
        reportData.pages["login"] = {
          axeIssues: axe.violations.length,
          violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, desc: v.description })),
          ...metrics,
        };
      }

      // Log in so authenticated routes (/app) render actual Teacher Dashboard and Student Assessment
      console.log(`  Logging in as demo teacher...`);
      await page.fill('input[type="email"]', 'teacher@shikshagap.in');
      await page.fill('input[type="password"]', 'ShikshaTeacher@2026');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/app**', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // 3. Student Assessment Question Screen
      console.log(`  Capturing Student Assessment (/app?role=student)...`);
      await page.goto(`${BASE_URL}/app?role=student`, { waitUntil: "networkidle" });
      // Wait for assessment to mount
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, `student_assessment_${vp.name}.png`), fullPage: false });
      if (vp.name === "desktop") {
        const axe = await new AxeBuilder({ page }).analyze();
        const metrics = await measureMetrics(page);
        reportData.pages["student_assessment"] = {
          axeIssues: axe.violations.length,
          violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, desc: v.description })),
          ...metrics,
        };
      }

      // 4. Teacher Dashboard
      console.log(`  Capturing Teacher Dashboard (/app?role=teacher)...`);
      await page.goto(`${BASE_URL}/app?role=teacher`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, `teacher_dashboard_${vp.name}.png`), fullPage: false });
      if (vp.name === "desktop") {
        const axe = await new AxeBuilder({ page }).analyze();
        const metrics = await measureMetrics(page);
        reportData.pages["teacher_dashboard"] = {
          axeIssues: axe.violations.length,
          violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, desc: v.description })),
          ...metrics,
        };
      }

      // 5. Student Diagnostic Modal (click first student row or button if available)
      console.log(`  Capturing Student Diagnostic Modal...`);
      const studentButton = page.locator("button:has-text('View'), tr[role='button'], button:has-text('Ananya'), button:has-text('Diagnostic')").first();
      if (await studentButton.count() > 0) {
        await studentButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(outDir, `student_diagnostic_modal_${vp.name}.png`), fullPage: false });
        if (vp.name === "desktop") {
          const axe = await new AxeBuilder({ page }).analyze();
          const metrics = await measureMetrics(page);
          reportData.pages["diagnostic_modal"] = {
            axeIssues: axe.violations.length,
            violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, desc: v.description })),
            ...metrics,
          };
        }
      }

      // Close modal by pressing Escape or refresh
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);

      // 6. Worksheet Modal
      console.log(`  Capturing Worksheet Modal...`);
      const worksheetButton = page.locator("button:has-text('Worksheet'), button:has-text('Print')").first();
      if (await worksheetButton.count() > 0) {
        await worksheetButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(outDir, `worksheet_modal_${vp.name}.png`), fullPage: false });
        if (vp.name === "desktop") {
          const axe = await new AxeBuilder({ page }).analyze();
          const metrics = await measureMetrics(page);
          reportData.pages["worksheet_modal"] = {
            axeIssues: axe.violations.length,
            violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, desc: v.description })),
            ...metrics,
          };
        }
      }

      // 7. Report Page
      console.log(`  Capturing Report Page (/report/demo)...`);
      await page.goto(`${BASE_URL}/report/demo`, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outDir, `report_${vp.name}.png`), fullPage: false });
      if (vp.name === "desktop") {
        const axe = await new AxeBuilder({ page }).analyze();
        const metrics = await measureMetrics(page);
        reportData.pages["report"] = {
          axeIssues: axe.violations.length,
          violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, desc: v.description })),
          ...metrics,
        };
      }

      await context.close();
    }

    const reportJsonPath = path.join(outDir, "measurements_before.json");
    await fs.writeFile(reportJsonPath, JSON.stringify(reportData, null, 2), "utf8");
    console.log(`\nSuccessfully saved measurement metrics to ${reportJsonPath}`);
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Measurement failed:", err);
  process.exit(1);
});
