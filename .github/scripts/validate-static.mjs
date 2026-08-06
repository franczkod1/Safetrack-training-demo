import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';

const requiredFiles = [
  'index.html',
  'styles.css',
  'employee-training-groups.css',
  'seed-base.js',
  'trainings-a.js',
  'trainings-b.js',
  'data-final.js',
  'status-fixture.js',
  'app.js',
  'employee-training-groups.js'
];

const report = {
  files: {},
  counts: {},
  checks: [],
  passed: false
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
  report.checks.push(message);
}

for (const file of requiredFiles) {
  const info = await stat(file);
  assert(info.isFile() && info.size > 0, `${file} exists and is not empty`);
  report.files[file] = { bytes: info.size };
}

const index = await readFile('index.html', 'utf8');
const styles = await readFile('styles.css', 'utf8');
const employeeStyles = await readFile('employee-training-groups.css', 'utf8');
const scriptNames = [
  'seed-base.js',
  'trainings-a.js',
  'trainings-b.js',
  'data-final.js',
  'status-fixture.js',
  'app.js',
  'employee-training-groups.js'
];
const scripts = Object.fromEntries(
  await Promise.all(scriptNames.map(async file => [file, await readFile(file, 'utf8')]))
);

for (const reference of ['styles.css', 'employee-training-groups.css', ...scriptNames]) {
  assert(index.includes(reference), `index.html references ${reference}`);
}

let previousIndex = -1;
for (const reference of scriptNames) {
  const currentIndex = index.indexOf(reference);
  assert(currentIndex > previousIndex, `${reference} is loaded in the required order`);
  previousIndex = currentIndex;
}

assert(index.includes('direct-static-v8'), 'index.html contains the direct-static-v8 build marker');

const publicSource = [index, styles, employeeStyles, ...Object.values(scripts)].join('\n');
const forbiddenTokens = [
  'DecompressionStream',
  'catalog50-v1/part',
  'atob(',
  'pako.',
  'pako.min.js',
  'Failed to Decode Data',
  'build-direct-static.py'
];
for (const token of forbiddenTokens) {
  assert(!publicSource.includes(token), `public static files do not contain legacy loader token: ${token}`);
}

for (const [file, source] of Object.entries(scripts)) {
  new vm.Script(source, { filename: file });
  report.checks.push(`${file} has valid JavaScript syntax`);
}

const storage = new Map();
const localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  },
  clear() {
    storage.clear();
  }
};
const context = vm.createContext({
  window: {},
  localStorage,
  Date,
  JSON,
  console
});
context.window.localStorage = localStorage;

for (const file of [
  'seed-base.js',
  'trainings-a.js',
  'trainings-b.js',
  'data-final.js',
  'status-fixture.js'
]) {
  new vm.Script(scripts[file], { filename: file }).runInContext(context);
}

const seed = context.window.SafeTrackSeed;
assert(seed && typeof seed === 'object', 'SafeTrackSeed is created');
assert(Array.isArray(seed.langs), 'language list exists');
assert(Array.isArray(seed.employees), 'employee list exists');
assert(Array.isArray(seed.trainings), 'training list exists');

report.counts.languages = seed.langs.length;
report.counts.employees = seed.employees.length;
report.counts.trainings = seed.trainings.length;
report.counts.categories = Object.keys(seed.categories || {}).length;
report.counts.jobProfiles = Object.keys(seed.roles || {}).filter(role => role !== 'all').length;

assert(seed.langs.length === 7, `exactly 7 languages are configured (${seed.langs.length})`);
assert(seed.employees.length === 45, `exactly 45 test employees are configured (${seed.employees.length})`);
assert(seed.trainings.length === 50, `exactly 50 trainings are configured (${seed.trainings.length})`);
assert(report.counts.categories >= 8, `at least 8 categories are configured (${report.counts.categories})`);
assert(report.counts.jobProfiles >= 10, `at least 10 job profiles are configured (${report.counts.jobProfiles})`);

const validRoles = new Set(Object.keys(seed.roles || {}));
const validCategories = new Set(Object.keys(seed.categories || {}));
const ids = new Set();

for (const training of seed.trainings) {
  assert(training && typeof training === 'object', 'training entry is an object');
  assert(typeof training.id === 'string' && training.id.length > 0, `training has an ID: ${training.id}`);
  assert(!ids.has(training.id), `training ID is unique: ${training.id}`);
  ids.add(training.id);
  assert(validCategories.has(training.category), `${training.id} uses a valid category`);
  assert(Array.isArray(training.roles) && training.roles.length > 0, `${training.id} has job-profile assignments`);
  assert(training.roles.every(role => validRoles.has(role)), `${training.id} only uses valid job profiles`);
  assert(Number.isFinite(training.months) && training.months > 0, `${training.id} has a positive repeat interval`);
  for (const language of seed.langs) {
    assert(typeof training.title?.[language] === 'string' && training.title[language].trim(), `${training.id} has a ${language} title`);
    assert(typeof training.description?.[language] === 'string' && training.description[language].trim(), `${training.id} has a ${language} description`);
    assert(Array.isArray(training.slides?.[language]) && training.slides[language].length > 0, `${training.id} has ${language} training content`);
  }
}

const fixtureState = JSON.parse(localStorage.getItem('safetrack-static-v6') || 'null');
assert(fixtureState && Array.isArray(fixtureState.catalog), 'balanced fixture stores the catalog');
assert(Array.isArray(fixtureState.records), 'balanced fixture stores completion records');

const completed = new Set(
  fixtureState.records.map(record => `${record.employeeId}::${record.trainingId}`)
);
const offsets = [-18, -4, 2, 4, 9, 17, 28, 48, 75, 110, 160, 240];
const classify = days => days <= 5 ? 'critical' : days <= 30 ? 'soon' : 'valid';
const required = (employee, training) =>
  training.active !== false &&
  training.roles.some(role => role === 'all' || role === employee[4]);

const distribution = { critical: 0, soon: 0, valid: 0 };
seed.employees.forEach((employee, employeeIndex) => {
  const assigned = fixtureState.catalog.filter(training => required(employee, training));
  const statuses = assigned.map((training, trainingIndex) => {
    if (completed.has(`${employee[1]}::${training.id}`)) return 'valid';
    return classify(offsets[(employeeIndex * 7 + trainingIndex * 5) % offsets.length]);
  });
  const overall = statuses.includes('critical')
    ? 'critical'
    : statuses.includes('soon')
      ? 'soon'
      : 'valid';
  distribution[overall] += 1;
});

report.counts.statusDistribution = distribution;
assert(distribution.critical === 5, `exactly 5 demo employees are critical (${distribution.critical})`);
assert(distribution.soon === 10, `exactly 10 demo employees are due in 6–30 days (${distribution.soon})`);
assert(distribution.valid === 30, `exactly 30 demo employees are fully current (${distribution.valid})`);
assert(distribution.critical + distribution.soon + distribution.valid === 45, 'all demo employees belong to exactly one status');

assert(/localStorage/.test(scripts['app.js']), 'app.js contains local browser persistence');
assert(/data-a=["']edit/.test(scripts['app.js']), 'app.js contains training editing controls');
assert(/data-a=["']delete/.test(scripts['app.js']), 'app.js contains training deletion controls');
assert(/data-a=["']copy/.test(scripts['app.js']), 'app.js contains training duplication controls');
assert(/JSON exportieren/.test(scripts['app.js']) && /JSON importieren/.test(scripts['app.js']), 'app.js contains JSON export and import controls');

const employeeGroups = scripts['employee-training-groups.js'];
assert(/groupsFor/.test(employeeGroups), 'employee training enhancement groups assigned trainings by existing categories');
assert(/data-st-category/.test(employeeGroups), 'employee training enhancement contains category selection controls');
assert(/data-st-training/.test(employeeGroups), 'employee training enhancement contains individual training selection controls');
assert(/select-critical/.test(employeeGroups), 'employee training enhancement can select all critical trainings');
assert(/startBatch/.test(employeeGroups), 'employee training enhancement supports sequential multi-training start');
assert(/printSelection/.test(employeeGroups), 'employee training enhancement supports printing selected trainings');
assert(/@media print/.test(employeeStyles), 'employee training stylesheet contains a dedicated print layout');
assert(/aria-checked/.test(employeeGroups) && /indeterminate/.test(employeeGroups), 'category selection exposes mixed checkbox state');

report.passed = true;
console.log(JSON.stringify(report, null, 2));
