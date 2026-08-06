import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';

const requiredFiles = [
  'index.html',
  'styles.css',
  'seed-base.js',
  'trainings-a.js',
  'trainings-b.js',
  'data-final.js',
  'app.js'
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
const scriptNames = ['seed-base.js', 'trainings-a.js', 'trainings-b.js', 'data-final.js', 'app.js'];
const scripts = Object.fromEntries(
  await Promise.all(scriptNames.map(async file => [file, await readFile(file, 'utf8')]))
);

for (const reference of ['styles.css', ...scriptNames]) {
  assert(index.includes(reference), `index.html references ${reference}`);
}

const orderedReferences = ['seed-base.js', 'trainings-a.js', 'trainings-b.js', 'data-final.js', 'app.js'];
let previousIndex = -1;
for (const reference of orderedReferences) {
  const currentIndex = index.indexOf(reference);
  assert(currentIndex > previousIndex, `${reference} is loaded in the required order`);
  previousIndex = currentIndex;
}

const publicSource = [index, styles, ...Object.values(scripts)].join('\n');
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

const context = vm.createContext({ window: {} });
for (const file of ['seed-base.js', 'trainings-a.js', 'trainings-b.js', 'data-final.js']) {
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

assert(/localStorage/.test(scripts['app.js']), 'app.js contains local browser persistence');
assert(/data-a=["']edit/.test(scripts['app.js']), 'app.js contains training editing controls');
assert(/data-a=["']delete/.test(scripts['app.js']), 'app.js contains training deletion controls');
assert(/data-a=["']copy/.test(scripts['app.js']), 'app.js contains training duplication controls');
assert(/JSON exportieren/.test(scripts['app.js']) && /JSON importieren/.test(scripts['app.js']), 'app.js contains JSON export and import controls');

report.passed = true;
console.log(JSON.stringify(report, null, 2));
