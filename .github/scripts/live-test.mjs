import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const commit = process.env.GITHUB_SHA || 'manual';
const base = 'https://franczkod1.github.io/Safetrack-training-demo/';
const testUrl = `${base}?live-test=${encodeURIComponent(commit)}`;
const expectedDistribution = { critical: 5, soon: 10, valid: 30 };
const result = {
  testedAt: new Date().toISOString(),
  commit,
  url: testUrl,
  expectedBuild: 'direct-static-v8',
  passed: false,
  checks: {},
  errors: []
};

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
    const card = page.locator(`.kpi[data-s="${status}"]`);
    await card.waitFor({ state: 'visible', timeout: 15000 });

    const displayed = await card.evaluate(element => {
      const values = [...element.querySelectorAll('.kpi.dual strong')].map(node => node.textContent?.trim() || '');
      return {
        trainingText: values[0] || '',
        employeeText: values[1] || '',
        employeeCount: Number.parseInt((values[1] || '').split('/')[0], 10)
      };
    });

    if (!Number.isInteger(displayed.employeeCount)) {
      throw new Error(`${status} dashboard card has no readable employee count: ${displayed.employeeText}.`);
    }
    if (displayed.employeeCount !== expectedDistribution[status]) {
      throw new Error(`${status} dashboard card displays ${displayed.employeeCount} employees; expected ${expectedDistribution[status]}.`);
    }

    await card.click();
    await page.waitForSelector('#emp', { timeout: 10000 });
    await page.waitForFunction(expected => document.querySelector('#emp')?.value === expected, status, { timeout: 10000 });

    const filteredRows = await page.locator('tbody tr').count();
    const selectedStatus = await page.locator('#emp').inputValue();
    if (filteredRows !== displayed.employeeCount) {
      throw new Error(`${status} dashboard card displays ${displayed.employeeCount} employees but the filtered list contains ${filteredRows}.`);
    }
    if (selectedStatus !== status) throw new Error(`${status} dashboard card selected ${selectedStatus || 'no'} filter.`);

    await page.locator('[data-a="clear"]').click();
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 45, null, { timeout: 10000 });
    const clearedRows = await page.locator('tbody tr').count();
    result.checks.statusCards[status] = { ...displayed, filteredRows, clearedRows, selectedStatus };
  }

  await page.goto(`${base}?employee-groups-test=${encodeURIComponent(commit)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('.kpi[data-s="critical"]').click();
  await page.waitForSelector('tbody tr', { timeout: 10000 });
  await page.locator('tbody tr [data-a="employee"]').first().click();
  await page.waitForSelector('.st-category-group', { timeout: 15000 });

  const groupState = await page.evaluate(() => {
    const rank = { critical: 0, soon: 1, valid: 2 };
    const categories = [...document.querySelectorAll('.st-category-group')].map(group => ({
      category: group.dataset.category || '',
      status: group.dataset.status || '',
      items: group.querySelectorAll('[data-st-training]').length
    }));
    const knownCategories = new Set(Object.keys(window.SafeTrackSeed?.categories || {}));
    return {
      categories,
      sortedWorstFirst: categories.every((group, index) => index === 0 || rank[categories[index - 1].status] <= rank[group.status]),
      allUseCatalogCategories: categories.every(group => knownCategories.has(group.category)),
      categoryCount: categories.length,
      totalItems: categories.reduce((sum, group) => sum + group.items, 0)
    };
  });
  result.checks.employeeGroups = groupState;
  if (!groupState.categoryCount || !groupState.totalItems) throw new Error('Employee profile contains no grouped trainings.');
  if (!groupState.sortedWorstFirst) throw new Error('Employee training categories are not sorted from worst to best status.');
  if (!groupState.allUseCatalogCategories) throw new Error('Employee profile uses a category that is not present in the training catalog.');

  const firstCategory = page.locator('.st-category-group').first();
  const firstCategoryItems = await firstCategory.locator('[data-st-training]').count();
  await firstCategory.locator('[data-st-category]').check();
  const categorySelectedCount = Number(await page.locator('[data-st-count]').textContent());
  if (categorySelectedCount !== firstCategoryItems) {
    throw new Error(`Category selection selected ${categorySelectedCount} trainings; expected ${firstCategoryItems}.`);
  }
  const categoryCheckboxState = await firstCategory.locator('[data-st-category]').evaluate(input => ({
    checked: input.checked,
    indeterminate: input.indeterminate,
    ariaChecked: input.getAttribute('aria-checked')
  }));
  result.checks.employeeGroups.categorySelection = { firstCategoryItems, categorySelectedCount, categoryCheckboxState };
  if (!categoryCheckboxState.checked || categoryCheckboxState.indeterminate) throw new Error('Full category selection did not set the category checkbox correctly.');

  await page.locator('[data-st-action="clear"]').click();
  const choices = page.locator('[data-st-training]');
  if (await choices.count() < 2) throw new Error('Employee profile has fewer than two selectable trainings.');
  await choices.nth(0).check();
  await choices.nth(1).check();
  const multiSelectedCount = Number(await page.locator('[data-st-count]').textContent());
  if (multiSelectedCount !== 2) throw new Error(`Multi-selection count is ${multiSelectedCount}; expected 2.`);

  await page.locator('[data-st-action="print"]').click();
  const printState = await page.evaluate(() => ({
    called: window.__stPrintCalled === true,
    rows: document.querySelectorAll('#st-print-sheet tbody tr').length
  }));
  result.checks.employeeGroups.multiSelection = { multiSelectedCount, printState };
  if (!printState.called || printState.rows !== 2) throw new Error(`Print selection failed: ${JSON.stringify(printState)}.`);

  await page.locator('[data-st-action="start"]').click();
  await page.waitForSelector('.session-card', { timeout: 10000 });
  const batchSession = await page.evaluate(() => ({
    sessionVisible: Boolean(document.querySelector('.session-card')),
    employee: document.querySelector('.modal-head span')?.textContent || ''
  }));
  result.checks.employeeGroups.batchStart = batchSession;
  if (!batchSession.sessionVisible) throw new Error('Starting a multi-selection did not open the first training session.');
  await page.locator('[data-a="close"]').first().click();

  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(`${base}?employee-mobile-test=${encodeURIComponent(commit)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('.kpi[data-s="critical"]').click();
  await page.locator('tbody tr [data-a="employee"]').first().click();
  await page.waitForSelector('.st-category-group', { timeout: 15000 });
  const employeeMobileOverflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
  result.checks.employeeGroups.mobileOverflow = employeeMobileOverflow;
  if (employeeMobileOverflow > 0) throw new Error(`Employee grouped profile has ${employeeMobileOverflow}px horizontal overflow at 320px.`);
  await page.locator('[data-a="close"]').first().click();
  await page.setViewportSize({ width: 1440, height: 1000 });

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
