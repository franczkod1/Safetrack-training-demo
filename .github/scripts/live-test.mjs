import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const commit = process.env.GITHUB_SHA || 'manual';
const url = `https://franczkod1.github.io/Safetrack-training-demo/?live-test=${commit}`;
const result = {
  testedAt: new Date().toISOString(),
  commit,
  url,
  expectedHotfixSha256: '7cd4ddea6cc9bfbdb151df747196531833e544232030229e7ce1dcbaf79ec1d9',
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
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    result.attempts = attempt;
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(String(error)));
    page.on('console', message => {
      if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
    });
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('.v2k', { timeout: 15000 });

      const cardCount = await page.locator('.v2k').count();
      const cardText = await page.locator('.v2k').allInnerTexts();
      const metrics = await page.evaluate(() => {
        const data = window.__stStatusV2?.data?.();
        if (!data) return null;
        return {
          criticalTrainings: data.c.length,
          upcomingTrainings: data.u.length,
          validTrainings: data.v.length,
          totalTrainings: data.r.length,
          criticalEmployees: data.ce.length,
          upcomingEmployees: data.ue.length,
          fullyCurrentEmployees: data.ve.length,
          totalEmployees: data.a.employees.length
        };
      });
      if (!metrics) throw new Error('Status API is unavailable.');

      result.checks.dashboard = {
        cardCount,
        blueCardRemoved: !cardText.some(text => /Nachbearbeitung|Unterschrift offen/i.test(text)),
        cardText,
        metrics
      };
      if (cardCount !== 3) throw new Error(`Expected 3 cards, received ${cardCount}.`);
      if (!result.checks.dashboard.blueCardRemoved) throw new Error('Blue follow-up card is still present.');
      const expectedMetrics = {
        criticalTrainings: 18,
        upcomingTrainings: 9,
        validTrainings: 621,
        totalTrainings: 630,
        criticalEmployees: 18,
        upcomingEmployees: 9,
        fullyCurrentEmployees: 36,
        totalEmployees: 45
      };
      for (const [key, value] of Object.entries(expectedMetrics)) {
        if (metrics[key] !== value) throw new Error(`${key}: expected ${value}, received ${metrics[key]}.`);
      }

      const expectedRows = { critical: 18, upcoming: 9, valid: 36 };
      result.checks.filters = {};
      for (const [status, expected] of Object.entries(expectedRows)) {
        await page.locator(`[data-v2="${status}"]`).click();
        await page.waitForTimeout(350);
        const visibleRows = await page.locator('tbody tr:not([hidden])').count();
        const summary = await page.locator('.v2s').innerText();
        result.checks.filters[status] = { expected, visibleRows, summary };
        if (visibleRows !== expected) throw new Error(`${status}: expected ${expected} visible employees, received ${visibleRows}.`);
        await page.evaluate(() => {
          window.__stApi.state.page = 'dashboard';
          window.__stApi.render();
        });
        await page.waitForSelector('.v2k');
      }

      await page.locator('[data-v2="critical"]').click();
      await page.waitForTimeout(350);
      await page.locator('tbody tr:not([hidden]) [data-action="open-employee"]').first().click();
      await page.waitForTimeout(500);
      const profileKpis = await page.locator('.employee-modal .mini-kpi').count();
      const profileText = (await page.locator('.employee-modal .profile-kpis').innerText()).trim();
      result.checks.employeeProfile = { profileKpis, profileText };
      if (profileKpis !== 3) throw new Error(`Employee profile expected 3 status boxes, received ${profileKpis}.`);
      if (/Nachbearbeitung|Unterschrift offen/i.test(profileText)) throw new Error('Removed blue status is still shown in employee profile.');

      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => {
        window.__stApi.state.modal = null;
        window.__stApi.state.page = 'dashboard';
        window.__stApi.render();
      });
      await page.waitForSelector('.v2k');
      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      result.checks.mobile = { horizontalOverflow };
      if (horizontalOverflow > 0) throw new Error(`Mobile horizontal overflow: ${horizontalOverflow}px.`);

      result.checks.languages = {};
      await page.setViewportSize({ width: 1440, height: 1000 });
      for (const language of ['de', 'pl', 'ru', 'ar', 'tr', 'hu', 'ro']) {
        await page.evaluate(lang => {
          const select = document.querySelector('#ui-lang');
          select.value = lang;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }, language);
        await page.waitForTimeout(250);
        const count = await page.locator('.v2k').count();
        const direction = await page.locator('html').getAttribute('dir');
        result.checks.languages[language] = { cardCount: count, direction };
        if (count !== 3) throw new Error(`${language}: expected 3 cards, received ${count}.`);
        if (language === 'ar' && direction !== 'rtl') throw new Error('Arabic interface is not RTL.');
      }

      result.checks.runtimeErrors = runtimeErrors;
      if (runtimeErrors.length) throw new Error(`Runtime errors: ${runtimeErrors.join(' | ')}`);
      result.passed = true;
      await page.screenshot({ path: 'LIVE_TEST_SCREENSHOT.png', fullPage: true });
      await page.close();
      break;
    } catch (error) {
      lastError = error;
      result.errors.push(`Attempt ${attempt}: ${error.message}`);
      await page.close();
      if (attempt < 30) await sleep(10000);
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
