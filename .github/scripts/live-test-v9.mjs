import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const commit = process.env.GITHUB_SHA || 'manual';
const configuredBase = process.env.SAFETRACK_DEPLOYED_URL || 'https://franczkod1.github.io/Safetrack-training-demo/';
const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;
const testUrl = `${base}?live-test=${encodeURIComponent(commit)}`;
const result = { testedAt: new Date().toISOString(), commit, url: testUrl, expectedBuild: 'direct-static-v9', passed: false, checks: {}, errors: [] };
let browser;

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    localStorage.clear();
    window.print = () => { window.__stPrintCalled = true; };
  });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${String(error)}`));
  page.on('console', message => { if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`); });

  await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.app', { timeout: 20000 });
  const startup = await page.evaluate(() => ({
    build: document.querySelector('meta[name="safetrack-build"]')?.content || '',
    nav: document.querySelectorAll('[data-page]').length,
    cards: document.querySelectorAll('.kpi[data-a="status"]').length,
    overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    loadingError: document.body.innerText.includes('Die Anwendung konnte nicht geladen werden')
  }));
  result.checks.startup = startup;
  if (startup.build !== result.expectedBuild || startup.nav < 4 || startup.cards !== 3 || startup.overflow || startup.loadingError) {
    throw new Error(`Startup validation failed: ${JSON.stringify(startup)}`);
  }

  const expected = { critical: 5, soon: 10, valid: 30 };
  result.checks.statusCards = {};
  for (const status of Object.keys(expected)) {
    await page.goto(`${base}?status=${status}&commit=${commit}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const card = page.locator(`.kpi[data-s="${status}"]`);
    await card.waitFor({ state: 'visible' });
    const count = await card.evaluate(element => Number.parseInt(element.querySelectorAll('.kpi.dual strong')[1]?.textContent || '', 10));
    if (count !== expected[status]) throw new Error(`${status} card shows ${count}, expected ${expected[status]}`);
    await card.click();
    await page.waitForFunction(value => document.querySelector('#emp')?.value === value, status);
    const rows = await page.locator('tbody tr').count();
    if (rows !== count) throw new Error(`${status} filter contains ${rows} rows, expected ${count}`);
    result.checks.statusCards[status] = { count, rows };
  }

  await page.goto(`${base}?employee-print=${commit}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('.kpi[data-s="critical"]').click();
  await page.locator('tbody tr [data-a="employee"]').first().click();
  await page.waitForSelector('.st-category-group');

  const toggle = page.locator('.st-category-toggle').first();
  const controls = await toggle.getAttribute('aria-controls');
  const beforeExpanded = await toggle.getAttribute('aria-expanded');
  const beforeHidden = await page.locator(`#${controls}`).evaluate(node => node.hidden);
  await toggle.click();
  const afterExpanded = await toggle.getAttribute('aria-expanded');
  const afterHidden = await page.locator(`#${controls}`).evaluate(node => node.hidden);
  if (afterExpanded === beforeExpanded || afterHidden === beforeHidden || (afterExpanded === 'true') === afterHidden) {
    throw new Error(`Category did not toggle in one click: ${beforeExpanded}/${beforeHidden} -> ${afterExpanded}/${afterHidden}`);
  }
  result.checks.singleClickToggle = { beforeExpanded, beforeHidden, afterExpanded, afterHidden };

  await page.locator('[data-st-action="clear"]').click();
  const expectedSoon = await page.locator('.st-training-choice[data-status="soon"]').count();
  if (expectedSoon < 1) throw new Error('Test employee has no 6–30 day training.');
  await page.locator('[data-st-action="select-soon"]').click();
  const selectedSoon = await page.locator('.st-training-choice[data-status="soon"] [data-st-training]:checked').count();
  const wronglySelected = await page.locator('.st-training-choice:not([data-status="soon"]) [data-st-training]:checked').count();
  if (selectedSoon !== expectedSoon || wronglySelected !== 0) throw new Error(`Soon quick selection failed: ${selectedSoon}/${expectedSoon}, wrong=${wronglySelected}`);
  result.checks.selectSoon = { expectedSoon, selectedSoon, wronglySelected };

  await page.locator('[data-st-action="clear"]').click();
  const choices = page.locator('[data-st-training]');
  await choices.nth(0).check();
  await choices.nth(1).check();
  await page.locator('[data-st-action="print"]').click();
  await page.waitForSelector('.st-print-options');
  await page.locator('[data-st-print-mode="confirmation"]').click();
  const confirmation = await page.evaluate(() => ({
    called: window.__stPrintCalled === true,
    mode: document.querySelector('#st-print-sheet')?.dataset.printMode,
    documents: document.querySelectorAll('#st-print-sheet .st-print-document').length,
    confirmationPages: document.querySelectorAll('#st-print-sheet .st-print-confirmation-page').length,
    employeeSignatures: [...document.querySelectorAll('#st-print-sheet .st-signature-block span')].filter(node => node.textContent.includes('Unterschrift Mitarbeitende')).length,
    supervisorSignatures: [...document.querySelectorAll('#st-print-sheet .st-signature-block span')].filter(node => node.textContent.includes('Unterschrift unterweisende')).length
  }));
  if (!confirmation.called || confirmation.mode !== 'confirmation' || confirmation.documents !== 2 || confirmation.confirmationPages !== 2 || confirmation.employeeSignatures !== 2 || confirmation.supervisorSignatures !== 2) {
    throw new Error(`Confirmation print failed: ${JSON.stringify(confirmation)}`);
  }
  result.checks.confirmationPrint = confirmation;

  await page.evaluate(() => {
    document.querySelector('#st-print-sheet')?.remove();
    document.body.classList.remove('st-printing');
    window.__stPrintCalled = false;
  });
  await page.locator('[data-st-action="clear"]').click();
  await choices.nth(0).check();
  await page.locator('[data-st-action="print"]').click();
  await page.locator('[data-st-print-mode="full"]').click();
  const full = await page.evaluate(() => ({
    called: window.__stPrintCalled === true,
    mode: document.querySelector('#st-print-sheet')?.dataset.printMode,
    documents: document.querySelectorAll('#st-print-sheet .st-print-document').length,
    content: document.querySelectorAll('#st-print-sheet .st-print-training-content').length,
    confirmationPages: document.querySelectorAll('#st-print-sheet .st-print-confirmation-page').length,
    languageSections: document.querySelectorAll('#st-print-sheet .st-print-language').length
  }));
  if (!full.called || full.mode !== 'full' || full.documents !== 1 || full.content !== 1 || full.confirmationPages !== 1 || full.languageSections < 2) {
    throw new Error(`Full training print failed: ${JSON.stringify(full)}`);
  }
  result.checks.fullPrint = full;

  await page.evaluate(() => {
    document.querySelector('#st-print-sheet')?.remove();
    document.body.classList.remove('st-printing');
  });
  await page.setViewportSize({ width: 320, height: 900 });
  const mobileOverflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
  if (mobileOverflow) throw new Error(`Employee profile has ${mobileOverflow}px horizontal overflow at 320px.`);
  result.checks.mobileOverflow = mobileOverflow;

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('[data-a="close"]').first().click();
  await page.locator('[data-page="trainings"]').click();
  await page.waitForSelector('.training');
  const trainingCount = await page.locator('.training').count();
  if (trainingCount !== 50) throw new Error(`Training catalog contains ${trainingCount} cards.`);
  result.checks.trainingCount = trainingCount;
  if (runtimeErrors.length) throw new Error(`Runtime errors: ${runtimeErrors.join(' | ')}`);
  result.checks.runtimeErrors = runtimeErrors;

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
