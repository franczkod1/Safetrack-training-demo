import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const commit = process.env.GITHUB_SHA || 'manual';
const base = 'https://franczkod1.github.io/Safetrack-training-demo/';
const selfTestUrl = `${base}?selftest=catalog&live-test=${commit}`;
const result = {
  testedAt: new Date().toISOString(),
  commit,
  url: selfTestUrl,
  expectedSourceSha256: '8c4ee57d1dbd6e2e56190db9b5870e387f07157ca8ac2245051bf3eb2d01fb6c',
  passed: false,
  attempts: 0,
  checks: {},
  errors: []
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;

try {
  browser = await chromium.launch({ headless: true });
  let lastError;
  for (let attempt = 1; attempt <= 36; attempt += 1) {
    result.attempts = attempt;
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(String(error)));
    page.on('console', message => {
      if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
    });
    try {
      await page.goto(selfTestUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('#selftest-result', { timeout: 20000 });
      const selfTest = JSON.parse(await page.locator('#selftest-result').innerText());
      result.checks.builtInSelfTest = selfTest;
      if (!selfTest.passed) throw new Error(`Built-in catalog self-test failed: ${JSON.stringify(selfTest.errors || selfTest)}`);

      await page.goto(`${base}?live-test=${commit}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => Boolean(window.__stCatalogApi), null, { timeout: 20000 });

      const apiSnapshot = await page.evaluate(() => {
        const api = window.__stCatalogApi;
        const trainings = Array.isArray(api.trainingContent) ? api.trainingContent : Object.values(api.trainingContent || {});
        const profiles = Array.isArray(api.jobProfiles) ? api.jobProfiles : Object.values(api.jobProfiles || {});
        return {
          trainingCount: trainings.length,
          profileCount: profiles.length,
          categoryCount: new Set(trainings.map(item => item.category).filter(Boolean)).size,
          employeeCount: Array.isArray(api.employees) ? api.employees.length : Object.keys(api.employees || {}).length,
          hasCatalogList: typeof api.catalogList === 'function',
          hasEditor: typeof api.openTrainingEditor === 'function',
          buildMeta: document.querySelector('meta[name="safetrack-build"]')?.content || ''
        };
      });
      result.checks.api = apiSnapshot;
      if (apiSnapshot.trainingCount !== 50) throw new Error(`Expected 50 trainings, received ${apiSnapshot.trainingCount}.`);
      if (apiSnapshot.categoryCount < 8) throw new Error(`Expected at least 8 categories, received ${apiSnapshot.categoryCount}.`);
      if (apiSnapshot.profileCount < 10) throw new Error(`Expected at least 10 job profiles, received ${apiSnapshot.profileCount}.`);
      if (!apiSnapshot.hasCatalogList || !apiSnapshot.hasEditor) throw new Error('Catalog API is incomplete.');

      await page.locator('[data-page="trainings"]').first().click();
      await page.waitForSelector('.training-card', { timeout: 10000 });
      const cardCount = await page.locator('.training-card').count();
      result.checks.catalog = { cardCount };
      if (cardCount !== 50) throw new Error(`Catalog expected 50 cards, received ${cardCount}.`);

      const filterInfo = await page.evaluate(() => {
        const selectors = ['#catalog-search', '#catalog-category', '#catalog-profile', '#catalog-frequency', '#catalog-activity'];
        return Object.fromEntries(selectors.map(selector => {
          const element = document.querySelector(selector);
          return [selector, element ? { found: true, tag: element.tagName, options: element.options?.length || 0 } : { found: false }];
        }));
      });
      result.checks.filters = filterInfo;
      for (const required of ['#catalog-search', '#catalog-category', '#catalog-profile']) {
        if (!filterInfo[required]?.found) throw new Error(`Required filter is missing: ${required}.`);
      }

      const categorySelect = page.locator('#catalog-category');
      if (await categorySelect.locator('option').count() > 1) {
        const categoryValue = await categorySelect.locator('option').nth(1).getAttribute('value');
        await categorySelect.selectOption(categoryValue || '');
        await page.waitForTimeout(250);
        const filteredCount = await page.locator('.training-card:visible').count();
        result.checks.catalog.categoryFilteredCount = filteredCount;
        if (filteredCount <= 0 || filteredCount >= 50) throw new Error(`Category filter produced ${filteredCount} visible cards.`);
        await categorySelect.selectOption('');
      }

      const profileSelect = page.locator('#catalog-profile');
      if (await profileSelect.locator('option').count() > 1) {
        const profileValue = await profileSelect.locator('option').nth(1).getAttribute('value');
        await profileSelect.selectOption(profileValue || '');
        await page.waitForTimeout(250);
        const filteredCount = await page.locator('.training-card:visible').count();
        result.checks.catalog.profileFilteredCount = filteredCount;
        if (filteredCount <= 0 || filteredCount >= 50) throw new Error(`Profile filter produced ${filteredCount} visible cards.`);
        await profileSelect.selectOption('');
      }

      await page.evaluate(() => window.__stCatalogApi.openTrainingEditor());
      await page.waitForTimeout(300);
      const editorSnapshot = await page.evaluate(() => {
        const modal = document.querySelector('.training-editor, [data-training-editor], .modal[open], dialog[open], .modal:not([hidden])');
        const inputs = [...document.querySelectorAll('input,select,textarea')]
          .filter(element => element.offsetParent !== null)
          .map(element => ({ id: element.id, name: element.name, type: element.type, tag: element.tagName }));
        return { modalVisible: Boolean(modal), visibleFields: inputs };
      });
      result.checks.editor = editorSnapshot;
      if (!editorSnapshot.modalVisible) throw new Error('Training editor did not open.');
      if (editorSnapshot.visibleFields.length < 8) throw new Error(`Training editor exposed only ${editorSnapshot.visibleFields.length} fields.`);
      await page.keyboard.press('Escape');

      result.checks.languages = {};
      for (const language of ['de', 'pl', 'ru', 'ar', 'tr', 'hu', 'ro']) {
        await page.evaluate(lang => {
          const select = document.querySelector('#ui-lang');
          select.value = lang;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }, language);
        await page.waitForTimeout(220);
        const direction = await page.locator('html').getAttribute('dir');
        const currentCount = await page.locator('.training-card').count();
        result.checks.languages[language] = { direction, cardCount: currentCount };
        if (currentCount !== 50) throw new Error(`${language}: expected 50 training cards, received ${currentCount}.`);
        if (language === 'ar' && direction !== 'rtl') throw new Error('Arabic interface is not RTL.');
      }

      result.checks.mobile = {};
      for (const width of [320, 360, 390, 430]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(180);
        const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
        result.checks.mobile[width] = { horizontalOverflow: overflow };
        if (overflow > 0) throw new Error(`${width}px mobile horizontal overflow: ${overflow}px.`);
      }

      result.checks.runtimeErrors = runtimeErrors;
      if (runtimeErrors.length) throw new Error(`Runtime errors: ${runtimeErrors.join(' | ')}`);
      result.passed = true;
      await page.setViewportSize({ width: 390, height: 900 });
      await page.screenshot({ path: 'LIVE_TEST_SCREENSHOT.png', fullPage: true });
      await page.close();
      break;
    } catch (error) {
      lastError = error;
      result.errors.push(`Attempt ${attempt}: ${error.message}`);
      await page.close();
      if (attempt < 36) await sleep(10000);
    }
  }
  if (!result.passed && lastError) throw lastError;
} catch (error) {
  result.errors.push(`Final: ${error.message}`);
} finally {
  if (browser) await browser.close();
  await writeFile('LIVE_TEST_RESULT.json', `${JSON.stringify(result, null, 2)}\n`);
}

if (!result.passed) process.exitCode = 1;
