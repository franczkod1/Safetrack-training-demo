import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';

const files = [
  'index.html','styles.css','employee-training-groups.css','safetrack-v13.css',
  'seed-base.js','trainings-a.js','trainings-b.js','data-final.js',
  'status-fixture.js','app.js','employee-training-groups.js','safetrack-v13.js'
];
const report = { version: 'v13', files: {}, checks: [], passed: false };
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  report.checks.push(message);
};

for (const file of files) {
  const info = await stat(file);
  assert(info.isFile() && info.size > 0, `${file} exists and is not empty`);
  report.files[file] = info.size;
}

const sources = Object.fromEntries(await Promise.all(files.map(async file => [file, await readFile(file, 'utf8')])));
const index = sources['index.html'];
const groups = sources['employee-training-groups.js'];
const v13 = sources['safetrack-v13.js'];
const css = sources['safetrack-v13.css'];

for (const file of files.filter(file => file !== 'index.html')) {
  assert(index.includes(file), `index.html references ${file}`);
}
assert(index.includes('direct-static-v13'), 'index.html contains direct-static-v13 build marker');
assert(index.includes('v=13-release'), 'v13 cache-busting parameters are present');
assert(v13.includes("const VERSION = 'SafeTrack v13'"), 'runtime version is SafeTrack v13');
assert(v13.includes('st-version-badge'), 'persistent version badge is implemented');
assert(v13.includes("sheet.id='st-v13-print-sheet'"), 'v13 print sheet is generated');
assert(v13.includes("sheet.dataset.version='13'"), 'v13 print output is identified');
assert(v13.includes('Durchgeführt am'), 'completion date field exists');
assert(v13.includes('Personalnummer der unterweisenden / beaufsichtigenden Person'), 'supervisor personnel number exists');
assert(v13.includes('Name der unterweisenden / beaufsichtigenden Person'), 'supervisor name exists');
assert(v13.includes('Unterschrift Mitarbeitende:r'), 'employee signature exists');
assert(v13.includes('Unterschrift unterweisende / beaufsichtigende Person'), 'supervisor signature exists');

const confirmation = v13.slice(v13.indexOf('function confirmationPage'), v13.indexOf('function contentPage'));
assert(!confirmation.includes('Fällig') && !confirmation.includes('Status'), 'confirmation omits due date and status');
assert(groups.includes('aria-expanded="false"') && groups.includes('class="st-category-body"') && groups.includes('hidden'), 'training categories start collapsed');
assert(groups.includes("const job = entry.employee[3]") && groups.includes('class="st-job-group"'), 'employees are grouped from assigned Tätigkeit values');
assert(css.includes('height:248mm') && css.includes('overflow:hidden'), 'confirmation uses bounded iOS-safe A4 height');
assert(css.includes('break-inside:avoid!important') && css.includes('page-break-inside:avoid!important'), 'confirmation cannot split internally');
assert(css.includes('.st-v13-spacer{flex:1 1 auto'), 'signature block is pushed to page bottom');
assert(css.includes('@page{size:A4 portrait;margin:9mm}'), 'print output targets A4 portrait');

for (const file of files.filter(file => file.endsWith('.js'))) {
  new vm.Script(sources[file], { filename: file });
  report.checks.push(`${file} has valid JavaScript syntax`);
}

report.passed = true;
console.log(JSON.stringify(report, null, 2));
