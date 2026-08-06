import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';

const publicFiles = [
  'index.html','styles.css','employee-training-groups.css','seed-base.js','trainings-a.js',
  'trainings-b.js','data-final.js','status-fixture.js','app.js','employee-training-groups.js'
];
const scriptFiles = publicFiles.filter(file => file.endsWith('.js'));
const report = { files: {}, counts: {}, checks: [], passed: false };
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  report.checks.push(message);
};

for (const file of publicFiles) {
  const info = await stat(file);
  assert(info.isFile() && info.size > 0, `${file} exists and is not empty`);
  report.files[file] = { bytes: info.size };
}

const sources = Object.fromEntries(await Promise.all(publicFiles.map(async file => [file, await readFile(file, 'utf8')])));
const index = sources['index.html'];
for (const file of publicFiles.filter(file => file !== 'index.html')) {
  assert(index.includes(file), `index.html references ${file}`);
}
assert(index.includes('direct-static-v9'), 'index.html contains the direct-static-v9 build marker');

const forbidden = ['DecompressionStream','catalog50-v1/part','atob(','pako.','Failed to Decode Data','build-direct-static.py'];
const publicSource = Object.values(sources).join('\n');
for (const token of forbidden) assert(!publicSource.includes(token), `legacy loader token is absent: ${token}`);
for (const file of scriptFiles) {
  new vm.Script(sources[file], { filename: file });
  report.checks.push(`${file} has valid JavaScript syntax`);
}

const storage = new Map();
const localStorage = {
  getItem: key => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
  clear: () => storage.clear()
};
const context = vm.createContext({ window: {}, localStorage, Date, JSON, console });
context.window.localStorage = localStorage;
for (const file of ['seed-base.js','trainings-a.js','trainings-b.js','data-final.js','status-fixture.js']) {
  new vm.Script(sources[file], { filename: file }).runInContext(context);
}
const seed = context.window.SafeTrackSeed;
assert(seed && Array.isArray(seed.trainings), 'SafeTrackSeed is created');
report.counts.languages = seed.langs.length;
report.counts.employees = seed.employees.length;
report.counts.trainings = seed.trainings.length;
report.counts.categories = Object.keys(seed.categories).length;
report.counts.jobProfiles = Object.keys(seed.roles).filter(role => role !== 'all').length;
assert(report.counts.languages === 7, 'exactly 7 languages are configured');
assert(report.counts.employees === 45, 'exactly 45 employees are configured');
assert(report.counts.trainings === 50, 'exactly 50 trainings are configured');
assert(report.counts.categories >= 8, 'at least 8 catalog categories are configured');
assert(report.counts.jobProfiles >= 10, 'at least 10 job profiles are configured');

const state = JSON.parse(localStorage.getItem('safetrack-static-v6') || 'null');
const completed = new Set(state.records.map(record => `${record.employeeId}::${record.trainingId}`));
const offsets = [-18,-4,2,4,9,17,28,48,75,110,160,240];
const classify = days => days <= 5 ? 'critical' : days <= 30 ? 'soon' : 'valid';
const distribution = { critical: 0, soon: 0, valid: 0 };
seed.employees.forEach((employee, employeeIndex) => {
  const assigned = state.catalog.filter(training => training.active !== false && training.roles.some(role => role === 'all' || role === employee[4]));
  const statuses = assigned.map((training, trainingIndex) => completed.has(`${employee[1]}::${training.id}`)
    ? 'valid'
    : classify(offsets[(employeeIndex * 7 + trainingIndex * 5) % offsets.length]));
  const status = statuses.includes('critical') ? 'critical' : statuses.includes('soon') ? 'soon' : 'valid';
  distribution[status] += 1;
});
report.counts.statusDistribution = distribution;
assert(distribution.critical === 5 && distribution.soon === 10 && distribution.valid === 30,
  `status distribution is 5/10/30 (${distribution.critical}/${distribution.soon}/${distribution.valid})`);

const groups = sources['employee-training-groups.js'];
const printCss = sources['employee-training-groups.css'];
assert(groups.includes('data-st-action="select-critical"'), 'critical quick selection exists');
assert(groups.includes('data-st-action="select-soon"'), '6–30 day quick selection exists');
assert(groups.includes("body.hidden = expanded"), 'category visibility toggles on the first activation');
assert(groups.includes('data-st-print-mode="confirmation"') && groups.includes('data-st-print-mode="full"'), 'both print modes exist');
assert(groups.includes('Unterschrift Mitarbeitende:r') && groups.includes('Unterschrift unterweisende / beaufsichtigende Person'), 'each confirmation page has both signatures');
assert(groups.includes('st-print-document') && groups.includes('st-print-confirmation-page'), 'print output is separated per training');
assert(groups.includes("employee[5]") && groups.includes("languageContent(item.training, 'de'"), 'full print uses employee language and German reference');
assert(printCss.includes('break-after:page') && printCss.includes('break-before:page'), 'print CSS enforces training and confirmation page breaks');
assert(printCss.includes('@page{size:A4'), 'print CSS targets A4 paper');

report.passed = true;
console.log(JSON.stringify(report, null, 2));
