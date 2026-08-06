import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';

const publicFiles = [
  'index.html','styles.css','employee-training-groups.css','safetrack-v10.css',
  'seed-base.js','trainings-a.js','trainings-b.js','data-final.js','status-fixture.js',
  'app.js','employee-training-groups.js','safetrack-v10.js'
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

const sources = Object.fromEntries(await Promise.all(
  publicFiles.map(async file => [file, await readFile(file, 'utf8')])
));
const index = sources['index.html'];
for (const file of publicFiles.filter(file => file !== 'index.html')) {
  assert(index.includes(file), `index.html references ${file}`);
}
assert(index.includes('direct-static-v10'), 'index.html contains the direct-static-v10 build marker');
assert(index.indexOf('employee-training-groups.js') < index.indexOf('safetrack-v10.js'),
  'v10 enhancement loads after the legacy grouped-training module');

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
report.counts.usedJobTitles = new Set(seed.employees.map(employee => employee[3])).size;
assert(report.counts.languages === 7, 'exactly 7 languages are configured');
assert(report.counts.employees === 45, 'exactly 45 employees are configured');
assert(report.counts.trainings === 50, 'exactly 50 trainings are configured');
assert(report.counts.categories >= 8, 'at least 8 catalog categories are configured');
assert(report.counts.jobProfiles >= 10, 'at least 10 job profiles are configured');
assert(report.counts.usedJobTitles > 0, 'employees have assigned job titles');

const state = JSON.parse(localStorage.getItem('safetrack-static-v6') || 'null');
const completed = new Set(state.records.map(record => `${record.employeeId}::${record.trainingId}`));
const offsets = [-18,-4,2,4,9,17,28,48,75,110,160,240];
const classify = days => days <= 5 ? 'critical' : days <= 30 ? 'soon' : 'valid';
const distribution = { critical: 0, soon: 0, valid: 0 };
seed.employees.forEach((employee, employeeIndex) => {
  const assigned = state.catalog.filter(training =>
    training.active !== false && training.roles.some(role => role === 'all' || role === employee[4])
  );
  const statuses = assigned.map((training, trainingIndex) =>
    completed.has(`${employee[1]}::${training.id}`)
      ? 'valid'
      : classify(offsets[(employeeIndex * 7 + trainingIndex * 5) % offsets.length])
  );
  const status = statuses.includes('critical') ? 'critical' : statuses.includes('soon') ? 'soon' : 'valid';
  distribution[status] += 1;
});
report.counts.statusDistribution = distribution;
assert(distribution.critical === 5 && distribution.soon === 10 && distribution.valid === 30,
  `status distribution is 5/10/30 (${distribution.critical}/${distribution.soon}/${distribution.valid})`);

const v10 = sources['safetrack-v10.js'];
const v10Css = sources['safetrack-v10.css'];
assert(v10.includes("toggle.setAttribute('aria-expanded', 'false')") && v10.includes('body.hidden = true'),
  'all employee training categories are collapsed by default');
assert(v10.includes("const job = entry.employee[3]") && v10.includes('st-v10-job-group'),
  'employee menu groups only actual assigned Tätigkeit values');
assert(v10.includes('aria-expanded="false"') && v10.includes('data-st-v10-action="toggle-job"'),
  'employee job groups start collapsed and have one-click toggles');
assert(v10.includes('Durchgeführt am'), 'confirmation page contains completion date');
assert(v10.includes('Personalnummer der unterweisenden / beaufsichtigenden Person'),
  'confirmation page contains supervisor personnel number');
assert(v10.includes('Name der unterweisenden / beaufsichtigenden Person'),
  'confirmation page contains supervisor name');
assert(v10.includes('Unterschrift Mitarbeitende:r') &&
  v10.includes('Unterschrift unterweisende / beaufsichtigende Person'),
  'confirmation page contains separate employee and supervisor signatures');
const headerSource = v10.slice(v10.indexOf('function confirmationHeader'), v10.indexOf('function confirmationFields'));
assert(!headerSource.includes('Fällig') && !headerSource.includes('Status'),
  'print header omits due date and status');
assert(v10Css.includes('height:245mm') && v10Css.includes('max-height:245mm') &&
  v10Css.includes('overflow:hidden'), 'confirmation page is constrained to one A4 content page');
assert(v10Css.includes('@page{size:A4;margin:8mm}'), 'v10 print CSS uses an A4 page with compact margins');
assert(v10Css.includes('.st-v10-source-table{display:none!important}'),
  'flat employee table is hidden after job grouping enhancement');

report.passed = true;
console.log(JSON.stringify(report, null, 2));