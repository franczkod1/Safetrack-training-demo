(()=>{
  'use strict';

  const STORAGE_KEY = 'safetrack-static-v6';
  const FIXTURE_KEY = 'safetrack-balanced-status-v1';
  const FIXTURE_ID = 'balanced-12-15-18-v1';
  const OFFSETS = [-18, -4, 2, 4, 9, 17, 28, 48, 75, 110, 160, 240];
  const seed = window.SafeTrackSeed;

  if (!seed || !Array.isArray(seed.employees) || !Array.isArray(seed.trainings)) return;

  const classify = days => days <= 5 ? 'critical' : days <= 30 ? 'soon' : 'valid';
  const required = (employee, training) =>
    training.active !== false &&
    Array.isArray(training.roles) &&
    training.roles.some(role => role === 'all' || role === employee[4]);

  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    stored = null;
  }

  const catalog = Array.isArray(stored?.catalog) ? stored.catalog : seed.trainings;
  const existingRecords = Array.isArray(stored?.records) ? stored.records : [];
  const marker = localStorage.getItem(FIXTURE_KEY);

  if (marker === FIXTURE_ID && existingRecords.length > 0) return;

  const preservedRecords = existingRecords.filter(record => !record?.demoFixture);
  const recordsByKey = new Map(
    preservedRecords.map(record => [`${record.employeeId}::${record.trainingId}`, record])
  );
  const today = new Date().toISOString().slice(0, 10);

  seed.employees.forEach((employee, employeeIndex) => {
    const desiredStatus = employeeIndex < 12
      ? 'critical'
      : employeeIndex < 27
        ? 'soon'
        : 'valid';

    const assignedTrainings = catalog.filter(training => required(employee, training));

    assignedTrainings.forEach((training, trainingIndex) => {
      const defaultDays = OFFSETS[(employeeIndex * 7 + trainingIndex * 5) % OFFSETS.length];
      const defaultStatus = classify(defaultDays);
      const shouldComplete = desiredStatus === 'soon'
        ? defaultStatus === 'critical'
        : desiredStatus === 'valid'
          ? defaultStatus !== 'valid'
          : false;

      if (!shouldComplete) return;

      const key = `${employee[1]}::${training.id}`;
      if (recordsByKey.has(key)) return;

      recordsByKey.set(key, {
        id: `DEMO-${employee[1]}-${training.id}`,
        employeeId: employee[1],
        employeeName: employee[0],
        trainingId: training.id,
        date: today,
        instructor: 'SafeTrack Demo',
        demoFixture: FIXTURE_ID
      });
    });
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    catalog,
    records: [...recordsByKey.values()]
  }));
  localStorage.setItem(FIXTURE_KEY, FIXTURE_ID);
})();
