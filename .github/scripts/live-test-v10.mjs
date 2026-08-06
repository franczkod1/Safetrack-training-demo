import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import { writeFile } from 'node:fs/promises';

const commit = process.env.GITHUB_SHA || 'manual';
const configuredBase = process.env.SAFETRACK_DEPLOYED_URL || 'https://franczkod1.github.io/Safetrack-training-demo/';
const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;
const testUrl = `${base}?live-test=${encodeURIComponent(commit)}`;
const result = {
  testedAt: new Date().toISOString(),
  commit,
  url: testUrl,
  expectedBuild: 'direct-static-v10',
  passed: false,
  checks: {},
  errors: []
};

let browser;

async function pdfPageCount(page, path) {
  const bytes = await page.pdf({
    path,
    format: 'A4',
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-size:7px;width:100%;text-align:center;color:#777">SafeTrack</div>'
  });
  const pdf = await PDFDocument.load(bytes);
  return pdf.getPageCount();
}

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
    await page.locator('[data-page="dashboard"]').click();
    const card = page.locator(`.kpi[data-s="${status}"]`);
    await card.waitFor({ state: 'visible' });
    const displayed = await card.evaluate(element =>
      Number.parseInt(element.querySelectorAll('.kpi.dual strong')[1]?.textContent || '', 10)
    );
    if (displayed !== expected[status]) throw new Error(`${status} card shows ${displayed}, expected ${expected[status]}`);
    await card.click();
    await page.waitForSelector('.st-v10-job-groups');
    const rows = await page.locator('.st-v10-employee-row').count();
    const selectedFilter = await page.locator('#emp').inputValue();
    if (rows !== displayed || selectedFilter !== status) {
      throw new Error(`${status} filter contains ${rows} grouped employees and filter ${selectedFilter}; expected ${displayed}/${status}`);
    }
    result.checks.statusCards[status] = { displayed, rows, selectedFilter };
  }

  await page.locator('[data-a="clear"]').click();
  await page.waitForSelector('.st-v10-job-groups');
  await page.waitForFunction(() => document.querySelectorAll('.st-v10-employee-row').length === 45);
  const jobGroups = await page.evaluate(() => {
    const usedJobs = new Set(window.SafeTrackSeed.employees.map(employee => employee[3]));
    const groups = [...document.querySelectorAll('.st-v10-job-group')];
    const rows = [...document.querySelectorAll('.st-v10-employee-row')];
    return {
      expectedJobs: usedJobs.size,
      renderedJobs: groups.length,
      renderedEmployees: rows.length,
      onlyAssignedJobs: groups.every(group => usedJobs.has(group.dataset.job)),
      allCollapsed: groups.every(group => {
        const toggle = group.querySelector('.st-v10-job-toggle');
        const body = document.getElementById(toggle?.getAttribute('aria-controls') || '');
        return toggle?.getAttribute('aria-expanded') === 'false' && body?.hidden === true;
      }),
      sourceTableHidden: getComputedStyle(document.querySelector('.st-v10-source-table')).display === 'none'
    };
  });
  result.checks.jobGroups = jobGroups;
  if (jobGroups.renderedJobs !== jobGroups.expectedJobs || jobGroups.renderedEmployees !== 45 ||
      !jobGroups.onlyAssignedJobs || !jobGroups.allCollapsed || !jobGroups.sourceTableHidden) {
    throw new Error(`Job grouping failed: ${JSON.stringify(jobGroups)}`);
  }

  const firstJobToggle = page.locator('.st-v10-job-toggle').first();
  const firstJobBodyId = await firstJobToggle.getAttribute('aria-controls');
  await firstJobToggle.click();
  const jobToggleState = {
    expanded: await firstJobToggle.getAttribute('aria-expanded'),
    hidden: await page.locator(`#${firstJobBodyId}`).evaluate(node => node.hidden)
  };
  result.checks.jobToggle = jobToggleState;
  if (jobToggleState.expanded !== 'true' || jobToggleState.hidden) {
    throw new Error(`Job group did not open in one click: ${JSON.stringify(jobToggleState)}`);
  }

  await page.locator(`#${firstJobBodyId} .st-v10-employee-row`).first().click();
  await page.waitForSelector('.st-category-group');
  const trainingCategories = await page.evaluate(() => {
    const groups = [...document.querySelectorAll('.st-category-group')];
    return {
      count: groups.length,
      allCollapsed: groups.every(group => {
        const toggle = group.querySelector('.st-category-toggle');
        const body = document.getElementById(toggle?.getAttribute('aria-controls') || '');
        return toggle?.getAttribute('aria-expanded') === 'false' && body?.hidden === true;
      })
    };
  });
  result.checks.trainingCategories = trainingCategories;
  if (!trainingCategories.count || !trainingCategories.allCollapsed) {
    throw new Error(`Training categories are not collapsed by default: ${JSON.stringify(trainingCategories)}`);
  }

  const firstCategoryToggle = page.locator('.st-category-toggle').first();
  await firstCategoryToggle.click();
  const firstChoice = page.locator('[data-st-training]').first();
  await firstChoice.check();
  await page.locator('[data-st-action="print"]').click();
  await page.waitForSelector('.st-print-options');
  await page.locator('[data-st-print-mode="confirmation"]').click();
  await page.waitForSelector('#st-print-sheet[data-print-version="v10"]');

  const confirmation = await page.evaluate(() => {
    const sheet = document.querySelector('#st-print-sheet');
    const text = sheet?.innerText || '';
    return {
      called: window.__stPrintCalled === true,
      documents: sheet?.querySelectorAll('.st-v10-print-document').length || 0,
      pages: sheet?.querySelectorAll('.st-v10-confirmation-page').length || 0,
      completionDate: text.includes('Durchgeführt am'),
      supervisorNumber: text.includes('Personalnummer der unterweisenden / beaufsichtigenden Person'),
      supervisorName: text.includes('Name der unterweisenden / beaufsichtigenden Person'),
      employeeSignature: text.includes('Unterschrift Mitarbeitende:r'),
      supervisorSignature: text.includes('Unterschrift unterweisende / beaufsichtigende Person'),
      noStatus: !text.includes('Status'),
      noDue: !text.includes('Fällig')
    };
  });
  await page.emulateMedia({ media: 'print' });
  confirmation.pdfPages = await pdfPageCount(page, 'CONFIRMATION_ONE_PAGE.pdf');
  result.checks.confirmation = confirmation;
  if (!confirmation.called || confirmation.documents !== 1 || confirmation.pages !== 1 ||
      !confirmation.completionDate || !confirmation.supervisorNumber || !confirmation.supervisorName ||
      !confirmation.employeeSignature || !confirmation.supervisorSignature ||
      !confirmation.noStatus || !confirmation.noDue || confirmation.pdfPages !== 1) {
    throw new Error(`Single-page confirmation failed: ${JSON.stringify(confirmation)}`);
  }

  const firstTwoIds = await page.locator('[data-st-training]').evaluateAll(inputs =>
    inputs.slice(0, 2).map(input => input.dataset.stTraining)
  );
  await page.evaluate(ids => {
    document.querySelector('#st-print-sheet')?.remove();
    document.body.classList.remove('st-printing');
    window.__stPrintCalled = false;
    window.__SafeTrackEmployeeGroups.select(ids);
  }, firstTwoIds);
  await page.locator('[data-st-action="print"]').click();
  await page.locator('[data-st-print-mode="confirmation"]').click();
  await page.waitForSelector('#st-print-sheet[data-print-version="v10"]');
  const twoPagePdfCount = await pdfPageCount(page, 'CONFIRMATION_TWO_PAGES.pdf');
  const twoPageStructure = await page.locator('#st-print-sheet .st-v10-confirmation-page').count();
  result.checks.twoTrainingPrint = { selected: firstTwoIds.length, structure: twoPageStructure, pdfPages: twoPagePdfCount };
  if (firstTwoIds.length !== 2 || twoPageStructure !== 2 || twoPagePdfCount !== 2) {
    throw new Error(`Two-training confirmation print failed: ${JSON.stringify(result.checks.twoTrainingPrint)}`);
  }

  await page.evaluate(() => {
    document.querySelector('#st-print-sheet')?.remove();
    document.body.classList.remove('st-printing');
  });
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 320, height: 900 });
  const mobileOverflow = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
  );
  result.checks.mobileOverflow = mobileOverflow;
  if (mobileOverflow) throw new Error(`Employee interface has ${mobileOverflow}px horizontal overflow at 320px.`);

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
