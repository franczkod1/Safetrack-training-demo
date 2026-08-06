import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import { writeFile } from 'node:fs/promises';

const commit = process.env.GITHUB_SHA || 'manual';
const configuredBase = process.env.SAFETRACK_DEPLOYED_URL || 'https://franczkod1.github.io/Safetrack-training-demo/';
const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;
const url = `${base}?live-test-v13=${encodeURIComponent(commit)}`;
const result = { testedAt: new Date().toISOString(), commit, url, expectedBuild: 'direct-static-v13', checks: {}, errors: [], passed: false };
let browser;

async function pageCount(page, path) {
  const bytes = await page.pdf({ path, format: 'A4', preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
  return (await PDFDocument.load(bytes)).getPageCount();
}

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => { localStorage.clear(); window.print = () => { window.__stPrintCalled = true; }; });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') runtimeErrors.push(message.text()); });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForSelector('.app', { timeout: 20000 });
  await page.waitForSelector('.st-version-badge', { timeout: 10000 });

  const startup = await page.evaluate(() => ({
    build: document.querySelector('meta[name="safetrack-build"]')?.content || '',
    badge: document.querySelector('.st-version-badge')?.textContent?.trim() || '',
    hasV13Css: [...document.styleSheets].some(sheet => String(sheet.href || '').includes('safetrack-v13.css')),
    hasV13Js: [...document.scripts].some(script => script.src.includes('safetrack-v13.js')),
    overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
  }));
  result.checks.startup = startup;
  if (startup.build !== 'direct-static-v13' || startup.badge !== 'SafeTrack v13' || !startup.hasV13Css || !startup.hasV13Js || startup.overflow) {
    throw new Error(`v13 startup failed: ${JSON.stringify(startup)}`);
  }

  await page.locator('[data-page="employees"]').click();
  await page.waitForSelector('.st-job-groups');
  const jobs = await page.evaluate(() => {
    const groups = [...document.querySelectorAll('.st-job-group')];
    const used = new Set(window.SafeTrackSeed.employees.map(employee => employee[3]));
    return {
      rendered: groups.length,
      expected: used.size,
      onlyUsed: groups.every(group => used.has(group.dataset.job)),
      collapsed: groups.every(group => {
        const toggle = group.querySelector('.st-job-toggle');
        const body = document.getElementById(toggle?.getAttribute('aria-controls') || '');
        return toggle?.getAttribute('aria-expanded') === 'false' && body?.hidden === true;
      })
    };
  });
  result.checks.jobs = jobs;
  if (jobs.rendered !== jobs.expected || !jobs.onlyUsed || !jobs.collapsed) throw new Error(`Job groups failed: ${JSON.stringify(jobs)}`);

  const job = page.locator('.st-job-toggle').first();
  await job.click();
  const bodyId = await job.getAttribute('aria-controls');
  await page.locator(`#${bodyId} .st-employee-row`).first().click();
  await page.waitForSelector('.st-category-group');
  const categoriesCollapsed = await page.evaluate(() => [...document.querySelectorAll('.st-category-group')].every(group => {
    const toggle = group.querySelector('.st-category-toggle');
    const body = document.getElementById(toggle?.getAttribute('aria-controls') || '');
    return toggle?.getAttribute('aria-expanded') === 'false' && body?.hidden === true;
  }));
  result.checks.categoriesCollapsed = categoriesCollapsed;
  if (!categoriesCollapsed) throw new Error('Training categories do not start collapsed.');

  await page.locator('.st-category-toggle').first().click();
  await page.locator('[data-st-training]').first().check();
  await page.locator('[data-st-action="print"]').click();
  await page.locator('[data-st-print-mode="confirmation"]').click();
  await page.waitForSelector('#st-v13-print-sheet[data-version="13"]');

  const confirmation = await page.evaluate(() => {
    const sheet = document.querySelector('#st-v13-print-sheet');
    const text = sheet?.innerText || '';
    return {
      called: window.__stPrintCalled === true,
      pages: sheet?.querySelectorAll('.st-v13-confirmation').length || 0,
      hasDate: text.includes('Durchgeführt am'),
      hasSupervisorNumber: text.includes('Personalnummer der unterweisenden / beaufsichtigenden Person'),
      hasSupervisorName: text.includes('Name der unterweisenden / beaufsichtigenden Person'),
      hasEmployeeSignature: text.includes('Unterschrift Mitarbeitende:r'),
      hasSupervisorSignature: text.includes('Unterschrift unterweisende / beaufsichtigende Person'),
      hasVersion: text.includes('SafeTrack v13'),
      noStatus: !text.includes('Status'),
      noDue: !text.includes('Fällig')
    };
  });
  await page.emulateMedia({ media: 'print' });
  confirmation.pdfPages = await pageCount(page, 'CONFIRMATION_ONE_PAGE.pdf');
  result.checks.confirmation = confirmation;
  if (!Object.values({ ...confirmation, pdfPages: confirmation.pdfPages === 1 }).every(Boolean)) {
    throw new Error(`Single confirmation failed: ${JSON.stringify(confirmation)}`);
  }

  await page.evaluate(() => { document.querySelector('#st-v13-print-sheet')?.remove(); document.body.classList.remove('st-v13-printing'); window.__stPrintCalled = false; });
  await page.emulateMedia({ media: 'screen' });
  const firstTwo = page.locator('[data-st-training]').slice(0, 2);
  await firstTwo.nth(0).check();
  await firstTwo.nth(1).check();
  await page.locator('[data-st-action="print"]').click();
  await page.locator('[data-st-print-mode="confirmation"]').click();
  await page.waitForSelector('#st-v13-print-sheet[data-version="13"]');
  await page.emulateMedia({ media: 'print' });
  const twoPdfPages = await pageCount(page, 'CONFIRMATION_TWO_PAGES.pdf');
  const twoStructure = await page.locator('#st-v13-print-sheet .st-v13-confirmation').count();
  result.checks.twoTrainingPrint = { structure: twoStructure, pdfPages: twoPdfPages };
  if (twoStructure !== 2 || twoPdfPages !== 2) throw new Error(`Two-page print failed: ${twoStructure}/${twoPdfPages}`);

  await page.evaluate(() => { document.querySelector('#st-v13-print-sheet')?.remove(); document.body.classList.remove('st-v13-printing'); });
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 320, height: 900 });
  const mobileOverflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
  result.checks.mobileOverflow = mobileOverflow;
  if (mobileOverflow) throw new Error(`Mobile horizontal overflow: ${mobileOverflow}px`);

  result.checks.runtimeErrors = runtimeErrors;
  if (runtimeErrors.length) throw new Error(`Runtime errors: ${runtimeErrors.join(' | ')}`);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({ path: 'LIVE_TEST_SCREENSHOT.png', fullPage: true });
  result.passed = true;
} catch (error) {
  result.errors.push(error instanceof Error ? error.message : String(error));
} finally {
  if (browser) await browser.close();
  await writeFile('LIVE_TEST_RESULT.json', `${JSON.stringify(result, null, 2)}\n`);
}
if (!result.passed) process.exitCode = 1;
