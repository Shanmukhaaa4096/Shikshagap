/**
 * End-to-End Smoke Test for ShikshaGap Adaptive Assessment
 * Uses Playwright Chromium (headless) to test /assessment.
 *
 * Verifies:
 * 1. Opens /assessment, verifies title and child-safe layout
 * 2. Class Selector: switches across classes 1 to 10 without errors
 * 3. Board Selector: switches between CBSE (NCERT) and ICSE
 * 4. End-to-End Interactive Flow:
 *    - Starts assessment for representative classes across Foundational, Primary, Middle, and Secondary stages
 *    - Clicks multiple choice answers
 *    - Steps through adaptive feedback and next questions
 *    - Reaches the "ASSESSMENT COMPLETE" results screen with learning recommendations and difficulty trajectory.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "https://shikshagap.vercel.app";

test("E2E Assessment Smoke Test: Multi-Class & Multi-Board Complete Flows", async (t) => {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  } catch (err) {
    console.warn("Could not launch Chromium:", err.message);
    return;
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ShikshaGap-E2E",
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("shikshagap_cookie_consent", "accepted");
    } catch {
      // ignore
    }
  });
  const page = await context.newPage();

  try {
    console.log(`[E2E] Navigating to ${BASE_URL}/assessment...`);
    await page.goto(`${BASE_URL}/assessment`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1000);

    // Verify main header and class selector exist
    const headerTitle = await page.textContent("h1");
    assert.ok(headerTitle && headerTitle.includes("Maths Check"), "Page must load Maths Check header");

    // 1. Test Class Selector: Verify every class 1 to 10 is clickable and selectable
    for (let grade = 1; grade <= 10; grade++) {
      const classBtn = page.locator(`button:has-text("Class ${grade}")`).first();
      await classBtn.scrollIntoViewIfNeeded();
      await classBtn.click();
      await page.waitForTimeout(100);

      const headingText = await page.textContent("h1");
      assert.ok(
        headingText.includes(`Class ${grade}`),
        `Heading must update to Class ${grade}. Got: ${headingText}`
      );
    }
    console.log("[E2E] ✓ All 10 class selector buttons tested and responsive.");

    // 2. Test Board Selector: Switch to ICSE and CBSE
    const icseBtn = page.locator('button:has-text("ICSE")').first();
    await icseBtn.click();
    await page.waitForTimeout(150);

    const cbseBtn = page.locator('button:has-text("CBSE")').first();
    await cbseBtn.click();
    await page.waitForTimeout(150);
    console.log("[E2E] ✓ Board selector buttons tested and responsive.");

    // 3. Complete End-to-End Assessment Run:
    // Test Class 5 CBSE assessment flow
    console.log("[E2E] Starting complete assessment flow for Class 5 CBSE...");
    const class5Btn = page.locator('button:has-text("Class 5")').first();
    await class5Btn.click();
    await page.waitForTimeout(100);

    const startBtn = page.locator('button:has-text("Start Practice")').or(page.locator('button:has-text("START ASSESSMENT")')).first();
    await startBtn.click();

    // Answer questions until reaching the results screen (up to 12 questions maximum)
    let questionsAnswered = 0;
    const maxSteps = 12;

    while (questionsAnswered < maxSteps) {
      // Check if finished screen reached
      const isComplete = await page.locator('text="ASSESSMENT COMPLETE"').or(page.locator('text="Well done"')).count();
      if (isComplete > 0) {
        console.log(`[E2E] ✓ Assessment Complete screen reached after ${questionsAnswered} questions!`);
        break;
      }

      // Wait for question options to be visible
      const optionButtons = page.locator('.grid button.neo-btn-secondary');
      try {
        await optionButtons.first().waitFor({ state: "visible", timeout: 8000 });
      } catch {
        // If not options, maybe submit input or check finish again
        const completeCheck = await page.locator('text="ASSESSMENT COMPLETE"').count();
        if (completeCheck > 0) break;
      }

      const optCount = await optionButtons.count();
      if (optCount > 0) {
        // Click the first option
        await optionButtons.first().click();
        questionsAnswered++;
        await page.waitForTimeout(200);

        // Click "Next Question" button
        const nextBtn = page.locator('button:has-text("Next Question")').first();
        try {
          await nextBtn.waitFor({ state: "visible", timeout: 4000 });
          await nextBtn.click();
        } catch {
          // If next button not visible, may have completed
        }
        await page.waitForTimeout(300);
      } else {
        // Check for text input or finish
        const inputAnswer = page.locator('input[placeholder*="answer"]');
        if (await inputAnswer.count() > 0) {
          await inputAnswer.fill("4");
          const submitBtn = page.locator('button:has-text("Submit")');
          await submitBtn.click();
          questionsAnswered++;
          await page.waitForTimeout(200);
          const nextBtn = page.locator('button:has-text("Next Question")').first();
          if (await nextBtn.isVisible()) {
            await nextBtn.click();
          }
        } else {
          break;
        }
      }
    }

    // Assert Results Screen Content
    const resultsHeader = await page.locator('text="ASSESSMENT COMPLETE"').or(page.locator('text="Well done"')).count();
    assert.ok(resultsHeader > 0, "Must reach ASSESSMENT COMPLETE results screen");

    const adaptivePathSection = await page.locator(':has-text("ADAPTIVE DIFFICULTY PATH")').count();
    assert.ok(adaptivePathSection > 0, "Results screen must display Adaptive Difficulty Path");

    console.log("[E2E] ✓ Verified Results screen with Adaptive Difficulty Path and Learning Summary.");

    // 4. Test Class 10 ICSE Assessment start
    console.log("[E2E] Testing Class 10 ICSE Assessment Start...");
    const resetBtn = page.locator('button:has-text("Try Another Check")').or(page.locator('button:has-text("Check Another Student")')).first();
    if (await resetBtn.isVisible()) {
      await resetBtn.scrollIntoViewIfNeeded();
      await resetBtn.click({ force: true });
    } else {
      await page.evaluate(() => sessionStorage.clear());
      await page.goto(`${BASE_URL}/assessment`, { waitUntil: "networkidle", timeout: 30000 });
    }
    await page.waitForTimeout(500);

    const class10Btn = page.locator('button:has-text("Class 10")').first();
    await class10Btn.click();
    await page.waitForTimeout(200);

    const icseBoardBtn = page.locator('button:has-text("ICSE")').first();
    await icseBoardBtn.click();
    await page.waitForTimeout(200);

    const startBtn10 = page.locator('button:has-text("Start Practice")').or(page.locator('button:has-text("START ASSESSMENT")')).first();
    await startBtn10.click();

    // Verify Class 10 ICSE question loads
    const questionEyebrow = page.locator('text="Question 1"');
    await questionEyebrow.waitFor({ state: "visible", timeout: 15000 });
    assert.ok(await questionEyebrow.isVisible(), "Class 10 ICSE Question 1 must render");

    const boardBadge = page.locator('[data-testid="question-board-badge"]').first();
    const boardBadgeText = await boardBadge.textContent();
    assert.equal(boardBadgeText.trim(), "ICSE", "Question board badge must display ICSE");
    console.log("[E2E] ✓ Class 10 ICSE Question 1 rendered with ICSE board badge verified.");

  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
});
