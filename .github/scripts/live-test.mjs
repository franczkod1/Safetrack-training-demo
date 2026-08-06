import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const commit = process.env.GITHUB_SHA || 'manual';
const base = 'https://franczkod1.github.io/Safetrack-training-demo/';
const testUrl = `${base}?live-test=${encodeURIComponent(commit)}`;
const result = {
  testedAt: new Date().toISOString(),
  commit,
  url: testUrl,
  expectedBuild: 'direct-static-v6',
  passed: false,
  checks: {},
  errors: []
};

let browser;

try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const runtimeErrors = [];

  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${String(error)}`));
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
  });

  await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.app', { timeout: 20000 });

  const startup = await page.evaluate(() => ({
    build: document.querySelector('meta[name="safetrack-build"]')?.content || '',
    title: document.title,
    bodyText: document.body.innerText,
    navItems: document.querySelectorAll('[data-page]').length,
    kpiCards: document.querySelectorAll('.kpi[data-a="status"]').length,
    horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
  }));
  result.checks.startup = startup;

  if (startup.build !== result.expectedBuild) throw new Error(`Expected build ${result.expectedBuild}, received ${startup.build || 'none'}.`);
  if (startup.bodyText.includes('Die Anwendung konnte nicht geladen werden')) throw new Error('The public page displays the application loading error.');
  if (startup.bodyText.includes('Failed to Decode Data')) throw new Error('The public page still displays a decoding error.');
  if (startup.navItems < 4) throw new Error(`Expected at least 4 navigation items, received ${startup.navItems}.`);
  if (startup.kpiCards !== 3) throw new Error(`Expected 3 dashboard status cards, received ${startup.kpiCards}.`);
  if (startup.horizontalOverflow > 0) throw new Error(`Desktop horizontal overflow: ${startup.horizontalOverflow}px.`);

  result.checks.statusCards = {};
  for (const status of ['critical', 'soon', 'valid']) {
    await page.goto(`${base}?status-test=${status}&commit=${encodeURIComponent(commit)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector(`.kpi[data-s="${status}"]`, { timeout: 15000 });
    await page.locator(`.kpi[data-s="${status}"]`).click();
    await page.waitForSelector('#emp', { timeout: 10000 });
    await page.waitForFunction(expected => document.querySelector('#emp')?.value === expected, status, { timeout: 10000 });
    const filteredRows = await page.locator('tbody tr').count();
    const selectedStatus = await page.locator('#emp').inputValue();
    if (filteredRows <= 0 || filteredRows >= 45) throw new Error(`${status} dashboard card produced ${filteredRows} employee rows.`);
    if (selectedStatus !== status) throw new Error(`${status} dashboard card selected ${selectedStatus || 'no'} filter.`);

    await page.locator('[data-a="clear"]').click();
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 45, null, { timeout: 10000 });
    const clearedRows = await page.locator('tbody tr').count();
    result.checks.statusCards[status] = { filteredRows, clearedRows, selectedStatus };
  }

  await page.goto(`${base}?catalog-test=${encodeURIComponent(commit)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('[data-page="trainings"]', { timeout: 15000 });
  await page.locator('[data-page="trainings"]').click();
  await page.waitForSelector('.training', { timeout: 15000 });

  const initialTrainingCount = await page.locator('.training').count();
  result.checks.catalog = { initialTrainingCount };
  if (initialTrainingCount !== 50) throw new Error(`Expected 50 training cards, received ${initialTrainingCount}.`);

  const requiredFilters = ['#fs', '#fc', '#fr', '#fa'];
  for (const selector of requiredFilters) {
    if (!(await page.locator(selector).count())) throw new Error(`Required catalog filter is missing: ${selector}.`);
  }

  const categorySelect = page.locator('#fc');
  const categoryOptions = await categorySelect.locator('option').count();
  if (categoryOptions < 2) throw new Error('Category filter has no selectable categories.');
  const categoryValue = await categorySelect.locator('option').nth(1).getAttribute('value');
  await categorySelect.selectOption(categoryValue || '');
  await page.waitForTimeout(250);
  const categoryFilteredCount = await page.locator('.training').count();
  result.checks.catalog.categoryFilteredCount = categoryFilteredCount;
  if (categoryFilteredCount <= 0 || categoryFilteredCount >= 50) throw new Error(`Category filter produced ${categoryFilteredCount} cards.`);

  await page.locator('#fc').selectOption('');
  const roleSelect = page.locator('#fr');
  const roleOptions = await roleSelect.locator('option').count();
  if (roleOptions < 2) throw new Error('Job-profile filter has no selectable profiles.');
  const roleValue = await roleSelect.locator('option').nth(1).getAttribute('value');
  await roleSelect.selectOption(roleValue || '');
  await page.waitForTimeout(250);
  const roleFilteredCount = await page.locator('.training').count();
  result.checks.catalog.roleFilteredCount = roleFilteredCount;
  if (roleFilteredCount <= 0 || roleFilteredCount >= 50) throw new Error(`Job-profile filter produced ${roleFilteredCount} cards.`);

  await page.locator('#fr').selectOption('');
  await page.locator('#fs').fill('Brandschutz');
  await page.waitForTimeout(250);
  const searchFilteredCount = await page.locator('.training').count();
  result.checks.catalog.searchFilteredCount = searchFilteredCount;
  if (searchFilteredCount <= 0 || searchFilteredCount >= 50) throw new Error(`Text search produced ${searchFilteredCount} cards.`);
  await page.locator('#fs').fill('');

  await page.locator('button[data-a="edit"]').first().click();
  await page.waitForSelector('.modal-bg .modal', { timeout: 10000 });
  const editor = await page.evaluate(() => ({
    visible: Boolean(document.querySelector('.modal-bg .modal')),
    code: Boolean(document.querySelector('#ei')),
    version: Boolean(document.querySelector('#ev')),
    category: Boolean(document.querySelector('#ec')),
    repeatMonths: Boolean(document.querySelector('#em')),
    active: Boolean(document.querySelector('#ea')),
    roleCheckboxes: document.querySelectorAll('.er').length,
    languageTitles: [...document.querySelectorAll('[id^="et-"]')].length,
    languageDescriptions: [...document.querySelectorAll('[id^="ed-"]')].length
  }));
  result.checks.editor = editor;
  if (!editor.visible || !editor.code || !editor.version || !editor.category || !editor.repeatMonths || !editor.active) {
    throw new Error(`Training editor fields are incomplete: ${JSON.stringify(editor)}`);
  }
  if (editor.roleCheckboxes < 10) throw new Error(`Expected at least 10 job-profile checkboxes, received ${editor.roleCheckboxes}.`);
  if (editor.languageTitles !== 7 || editor.languageDescriptions !== 7) {
    throw new Error(`Expected 7 language title and description fields, received ${editor.languageTitles}/${editor.languageDescriptions}.`);
  }
  await page.locator('[data-a="close"]').first().click();
  await page.waitForSelector('.modal-bg', { state: 'detached', timeout: 10000 });

  result.checks.languages = {};
  for (const language of ['de', 'pl', 'ru', 'ar', 'tr', 'hu', 'ro']) {
    await page.locator('#lang').selectOption(language);
    await page.waitForSelector('.training', { timeout: 10000 });
    const direction = await page.locator('html').getAttribute('dir');
    const cardCount = await page.locator('.training').count();
    result.checks.languages[language] = { direction, cardCount };
    if (cardCount !== 50) throw new Error(`${language}: expected 50 cards, received ${cardCount}.`);
    if (language === 'ar' && direction !== 'rtl') throw new Error('Arabic interface is not RTL.');
    if (language !== 'ar' && direction !== 'ltr') throw new Error(`${language}: expected LTR direction, received ${direction}.`);
  }

  result.checks.mobile = {};
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    const horizontalOverflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
    const trainingCount = await page.locator('.training').count();
    result.checks.mobile[width] = { horizontalOverflow, trainingCount };
    if (horizontalOverflow > 0) throw new Error(`${width}px mobile horizontal overflow: ${horizontalOverflow}px.`);
    if (trainingCount !== 50) throw new Error(`${width}px mobile catalog contains ${trainingCount} cards instead of 50.`);
  }

  result.checks.runtimeErrors = runtimeErrors;
  if (runtimeErrors.length) throw new Error(`Runtime errors: ${runtimeErrors.join(' | ')}`);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({ path: 'LIVE_TEST_SCREENSHOT.png', fullPage: true });
  result.passed = true;
  await page.close();
} catch (error) {
  result.errors.push(error instanceof Error ? error.message : String(error));
} finally {
  if (browser) await browser.close();
  await writeFile('LIVE_TEST_RESULT.json', `${JSON.stringify(result, null, 2)}\n`);
}

if (!result.passed) process.exitCode = 1;
