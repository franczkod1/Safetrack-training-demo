import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';

const files = [
  'index.html','styles.css','employee-training-groups.css','seed-base.js',
  'trainings-a.js','trainings-b.js','data-final.js','status-fixture.js',
  'app.js','employee-training-groups.js'
];
const report = { version: 'v14', files: {}, checks: [], passed: false };
const assert = (condition, message) => { if (!condition) throw new Error(message); report.checks.push(message); };
for (const file of files) { const info = await stat(file); assert(info.isFile() && info.size > 0, `${file} exists and is not empty`); report.files[file] = info.size; }
const sources = Object.fromEntries(await Promise.all(files.map(async file => [file, await readFile(file, 'utf8')])));
const index = sources['index.html'], groups = sources['employee-training-groups.js'], css = sources['employee-training-groups.css'];
for (const file of files.filter(file => file !== 'index.html')) assert(index.includes(file), `index.html references ${file}`);
assert(index.includes('direct-static-v14'), 'index.html contains direct-static-v14 build marker');
assert(index.includes('SafeTrack v14'), 'version badge is present in static HTML');
assert(index.includes('v=14'), 'v14 cache-busting parameters are present');
assert(!index.includes('safetrack-v13.js') && !index.includes('safetrack-v13.css'), 'no parallel v13 override assets are active');
assert(groups.includes("const VERSION='SafeTrack v14'"), 'main interaction module identifies v14');
assert(groups.includes("s.dataset.printVersion='v14'"), 'integrated print output identifies v14');
assert(groups.includes('Durchgeführt am'), 'completion date field exists');
assert(groups.includes('Personalnummer der unterweisenden / beaufsichtigenden Person'), 'supervisor personnel number exists');
assert(groups.includes('Name der unterweisenden / beaufsichtigenden Person'), 'supervisor name exists');
assert(groups.includes('Unterschrift Mitarbeitende:r'), 'employee signature exists');
assert(groups.includes('Unterschrift unterweisende / beaufsichtigende Person'), 'supervisor signature exists');
const confirmation = groups.slice(groups.indexOf('function confirmPage'), groups.indexOf('function slide'));
assert(!confirmation.includes('Fällig') && !confirmation.includes('Status'), 'confirmation omits due date and status');
assert(groups.includes('aria-expanded="false"') && groups.includes('class="st-category-body"') && groups.includes('hidden'), 'training categories start collapsed');
assert(groups.includes("const job=x.employee[3]") && groups.includes('class="st-job-group"'), 'employees are grouped from assigned Tätigkeit values');
assert(css.includes('@page{size:A4 portrait;margin:10mm}'), 'print output targets A4 portrait');
assert(css.includes('.st-confirmation-page{box-sizing:border-box;width:100%;display:block'), 'confirmation uses compact normal document flow');
assert(css.includes('break-inside:avoid-page!important') && css.includes('page-break-inside:avoid!important'), 'confirmation and signature block cannot split internally');
assert(!css.includes('height:248mm') && !css.includes('st-v13-spacer'), 'fixed-height bottom-pushing print workaround is absent');
for (const file of files.filter(file => file.endsWith('.js'))) { new vm.Script(sources[file], { filename: file }); report.checks.push(`${file} has valid JavaScript syntax`); }
report.passed = true;
console.log(JSON.stringify(report, null, 2));
