(()=>{
  'use strict';

  const seed = window.SafeTrackSeed;
  const api = window.__SafeTrack;
  const legacy = window.__SafeTrackEmployeeGroups;
  if (!seed || !api || !legacy) return;

  const STATUS_LABEL = { critical: 'Kritisch', soon: 'In 6–30 Tagen fällig', valid: 'Gültig' };
  const STATUS_RANK = { critical: 0, soon: 1, valid: 2 };
  const LANGUAGE_NAME = {
    de: 'Deutsch', pl: 'Polski', ru: 'Русский', ar: 'العربية',
    tr: 'Türkçe', hu: 'Magyar', ro: 'Română'
  };
  const CONFIRMATION_TEXT = {
    de: ['Bestätigung der Unterweisung', 'Ich bestätige, dass ich diese Unterweisung erhalten, verstanden und Gelegenheit für Rückfragen hatte.'],
    pl: ['Potwierdzenie instruktażu', 'Potwierdzam, że odbyłem(-am) ten instruktaż, zrozumiałem(-am) jego treść i miałem(-am) możliwość zadawania pytań.'],
    ru: ['Подтверждение инструктажа', 'Я подтверждаю, что прошёл(прошла) этот инструктаж, понял(а) его содержание и имел(а) возможность задать вопросы.'],
    ar: ['تأكيد التدريب', 'أؤكد أنني تلقيت هذا التدريب وفهمت محتواه وأتيحت لي فرصة طرح الأسئلة.'],
    tr: ['Eğitim onayı', 'Bu eğitimi aldığımı, içeriğini anladığımı ve soru sorma fırsatı bulduğumu onaylıyorum.'],
    hu: ['Az oktatás megerősítése', 'Igazolom, hogy az oktatást megkaptam, megértettem, és lehetőségem volt kérdéseket feltenni.'],
    ro: ['Confirmarea instruirii', 'Confirm că am primit această instruire, am înțeles conținutul și am avut posibilitatea să adresez întrebări.']
  };
  const QUESTION_HEADING = {
    de: 'Wissensfragen', pl: 'Pytania kontrolne', ru: 'Контрольные вопросы',
    ar: 'أسئلة المعرفة', tr: 'Bilgi soruları', hu: 'Ellenőrző kérdések',
    ro: 'Întrebări de verificare'
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const categoryName = (category, language = api.state.lang || 'de') =>
    seed.categories?.[category]?.[language] || seed.categories?.[category]?.de || category;
  const trainingTitle = (training, language = api.state.lang || 'de') =>
    training.title?.[language] || training.title?.de || training.id;
  const formatDate = (value, language = 'de') => value
    ? new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`))
    : '';

  function overallStatus(employeeId) {
    const statuses = legacy.assignments(employeeId).map(item => item.status);
    return statuses.includes('critical') ? 'critical' : statuses.includes('soon') ? 'soon' : 'valid';
  }

  function statusMarkup(status) {
    return `<span class="st-category-status st-${status}"><span class="st-status-icon" aria-hidden="true"></span>${STATUS_LABEL[status]}</span>`;
  }

  function collapseEmployeeTrainingCategories() {
    if (api.state.m?.t !== 'emp') return;
    const modal = document.querySelector('.modal-bg .modal');
    const groups = modal?.querySelectorAll('.st-category-group');
    if (!modal || !groups?.length || modal.dataset.stV10Collapsed === 'true') return;

    groups.forEach(group => {
      const toggle = group.querySelector('.st-category-toggle');
      const bodyId = toggle?.getAttribute('aria-controls');
      const body = bodyId ? document.getElementById(bodyId) : null;
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      if (body) body.hidden = true;
    });
    modal.dataset.stV10Collapsed = 'true';
  }

  function employeeJobGroups() {
    const filter = document.querySelector('#emp')?.value || api.state.emp || '';
    const employees = seed.employees
      .map(employee => ({ employee, status: overallStatus(employee[1]) }))
      .filter(entry => !filter || entry.status === filter);

    const groups = new Map();
    employees.forEach(entry => {
      const job = entry.employee[3] || 'Ohne Tätigkeit';
      if (!groups.has(job)) groups.set(job, []);
      groups.get(job).push(entry);
    });

    return [...groups.entries()]
      .map(([job, entries]) => {
        entries.sort((left, right) => left.employee[0].localeCompare(right.employee[0], api.state.lang || 'de'));
        const counts = { critical: 0, soon: 0, valid: 0 };
        entries.forEach(entry => counts[entry.status] += 1);
        const worst = entries.reduce(
          (status, entry) => STATUS_RANK[entry.status] < STATUS_RANK[status] ? entry.status : status,
          'valid'
        );
        return { job, entries, counts, worst };
      })
      .sort((left, right) => left.job.localeCompare(right.job, api.state.lang || 'de'));
  }

  function employeeJobMarkup(group, index) {
    const id = `st-v10-job-${index}`;
    return `<section class="st-v10-job-group" data-job="${escapeHtml(group.job)}">
      <button type="button" class="st-v10-job-toggle" data-st-v10-action="toggle-job"
        aria-expanded="false" aria-controls="${id}">
        <span class="st-v10-job-title">
          <strong>${escapeHtml(group.job)}</strong>
          <small>${group.entries.length} Mitarbeitende</small>
        </span>
        <span class="st-v10-job-summary">
          ${statusMarkup(group.worst)}
          <span>${group.counts.critical} kritisch · ${group.counts.soon} fällig · ${group.counts.valid} gültig</span>
          <span class="st-chevron" aria-hidden="true"></span>
        </span>
      </button>
      <div class="st-v10-job-body" id="${id}" hidden>
        ${group.entries.map(({ employee, status }) => `<button type="button" class="st-v10-employee-row"
          data-a="employee" data-id="${escapeHtml(employee[1])}">
          <span><strong>${escapeHtml(employee[0])}</strong><small>${escapeHtml(employee[1])} · ${escapeHtml(employee[2])}</small></span>
          ${statusMarkup(status)}
        </button>`).join('')}
      </div>
    </section>`;
  }

  function enhanceEmployeesPage() {
    if (api.state.page !== 'employees') return;
    const card = document.querySelector('.table-card');
    const table = card?.querySelector('table');
    if (!card || !table || card.dataset.stV10Jobs === 'true') return;

    table.classList.add('st-v10-source-table');
    const groups = employeeJobGroups();
    const container = document.createElement('div');
    container.className = 'st-v10-job-groups';
    container.innerHTML = groups.length
      ? groups.map(employeeJobMarkup).join('')
      : '<div class="empty">Keine Mitarbeitenden für diesen Status.</div>';
    table.after(container);
    card.dataset.stV10Jobs = 'true';
  }

  function selectedContext() {
    const employeeId = api.state.m?.t === 'emp' ? api.state.m.id : '';
    const employee = seed.employees.find(item => item[1] === employeeId);
    const selected = new Set(legacy.getSelected());
    const items = employee
      ? legacy.assignments(employeeId).filter(item => selected.has(item.training.id))
      : [];
    return { employee, items };
  }

  function completionValue(item) {
    return item.record?.date ? formatDate(item.record.date, 'de') : '';
  }

  function confirmationHeader(employee, item) {
    return `<header class="st-v10-print-header">
      <div class="st-v10-print-title">
        <h1>${escapeHtml(trainingTitle(item.training, 'de'))}</h1>
        <p>${escapeHtml(categoryName(item.training.category, 'de'))}</p>
      </div>
      <dl>
        <div><dt>Mitarbeitende Person</dt><dd>${escapeHtml(employee[0])}</dd></div>
        <div><dt>Personalnummer</dt><dd>${escapeHtml(employee[1])}</dd></div>
        <div><dt>Bereich / Tätigkeit</dt><dd>${escapeHtml(employee[2])} · ${escapeHtml(employee[3])}</dd></div>
        <div><dt>Version</dt><dd>v${escapeHtml(item.training.version)}</dd></div>
      </dl>
    </header>`;
  }

  function confirmationFields(item) {
    const completed = completionValue(item);
    return `<section class="st-v10-confirmation-fields">
      <div class="st-v10-field"><span>Durchgeführt am</span><strong>${completed ? escapeHtml(completed) : '&nbsp;'}</strong></div>
      <div class="st-v10-field"><span>Personalnummer der unterweisenden / beaufsichtigenden Person</span><strong>&nbsp;</strong></div>
      <div class="st-v10-field st-v10-field-wide"><span>Name der unterweisenden / beaufsichtigenden Person</span><strong>&nbsp;</strong></div>
      <div class="st-v10-field"><span>Unterschrift Mitarbeitende:r</span><strong>&nbsp;</strong></div>
      <div class="st-v10-field"><span>Unterschrift unterweisende / beaufsichtigende Person</span><strong>&nbsp;</strong></div>
    </section>`;
  }

  function confirmationPage(employee, item) {
    const language = employee[5] || 'de';
    const confirmation = CONFIRMATION_TEXT[language] || CONFIRMATION_TEXT.de;
    return `<section class="st-v10-confirmation-page">
      ${confirmationHeader(employee, item)}
      <div class="st-v10-confirmation-copy" dir="${language === 'ar' ? 'rtl' : 'ltr'}">
        <h2>${escapeHtml(confirmation[0])}</h2>
        <p><strong>${escapeHtml(trainingTitle(item.training, language))}</strong></p>
        <p>${escapeHtml(confirmation[1])}</p>
        ${language === 'de' ? '' : `<p class="st-v10-german-reference" dir="ltr"><strong>Deutsche Referenz:</strong> Ich bestätige, dass diese Unterweisung vollständig durchgeführt, verstanden und Gelegenheit für Rückfragen gegeben wurde.</p>`}
      </div>
      ${confirmationFields(item)}
    </section>`;
  }

  function slideMarkup(slide) {
    if (!Array.isArray(slide)) return '';
    const [heading, points] = slide;
    return `<section class="st-v10-print-slide"><h3>${escapeHtml(heading)}</h3><ul>${
      (Array.isArray(points) ? points : []).map(point => `<li>${escapeHtml(point)}</li>`).join('')
    }</ul></section>`;
  }

  function questionsMarkup(training, language) {
    const questions = training.questions?.[language] || [];
    if (!Array.isArray(questions) || !questions.length) return '';
    return `<section class="st-v10-print-questions"><h3>${escapeHtml(QUESTION_HEADING[language] || QUESTION_HEADING.de)}</h3>${
      questions.map((question, index) => `<div class="st-v10-print-question">
        <strong>${index + 1}. ${escapeHtml(question.q)}</strong>
        <ul>${(question.o || []).map(option => `<li>□ ${escapeHtml(option)}</li>`).join('')}</ul>
      </div>`).join('')
    }</section>`;
  }

  function languageContent(training, language, heading) {
    const description = training.description?.[language] || training.description?.de || '';
    const slides = training.slides?.[language] || training.slides?.de || [];
    return `<section class="st-v10-print-language" dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <h2>${escapeHtml(heading)}</h2>
      <h3>${escapeHtml(trainingTitle(training, language))}</h3>
      <p>${escapeHtml(description)}</p>
      ${slides.map(slideMarkup).join('')}
      ${questionsMarkup(training, language)}
    </section>`;
  }

  function trainingContent(employee, item) {
    const language = employee[5] || 'de';
    return `<section class="st-v10-training-content">
      ${confirmationHeader(employee, item)}
      ${languageContent(item.training, language, `Unterweisung · ${LANGUAGE_NAME[language] || language.toUpperCase()}`)}
      ${language === 'de' ? '' : languageContent(item.training, 'de', 'Deutsche Fassung für die unterweisende Person')}
    </section>`;
  }

  function printSelection(mode) {
    const { employee, items } = selectedContext();
    if (!employee || !items.length || !['confirmation', 'full'].includes(mode)) return;

    document.querySelector('.st-print-options-bg')?.remove();
    document.querySelector('#st-print-sheet')?.remove();

    const sheet = document.createElement('section');
    sheet.id = 'st-print-sheet';
    sheet.dataset.printMode = mode;
    sheet.dataset.printVersion = 'v10';
    sheet.innerHTML = items.map(item => `<article class="st-v10-print-document" data-training-id="${escapeHtml(item.training.id)}">
      ${mode === 'full' ? trainingContent(employee, item) : ''}
      ${confirmationPage(employee, item)}
    </article>`).join('');
    document.body.appendChild(sheet);
    document.body.classList.add('st-printing');

    const cleanup = () => {
      document.body.classList.remove('st-printing');
      sheet.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    setTimeout(cleanup, 30000);
  }

  document.addEventListener('click', event => {
    const printMode = event.target.closest?.('[data-st-print-mode]');
    if (printMode) {
      event.preventDefault();
      event.stopImmediatePropagation();
      printSelection(printMode.dataset.stPrintMode);
      return;
    }

    const jobToggle = event.target.closest?.('[data-st-v10-action="toggle-job"]');
    if (jobToggle) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const bodyId = jobToggle.getAttribute('aria-controls');
      const body = bodyId ? document.getElementById(bodyId) : null;
      const expanded = jobToggle.getAttribute('aria-expanded') === 'true';
      jobToggle.setAttribute('aria-expanded', String(!expanded));
      if (body) body.hidden = expanded;
    }
  }, true);

  const observer = new MutationObserver(() => {
    collapseEmployeeTrainingCategories();
    enhanceEmployeesPage();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  collapseEmployeeTrainingCategories();
  enhanceEmployeesPage();

  window.__SafeTrackV10 = {
    employeeJobGroups,
    printSelection,
    collapseEmployeeTrainingCategories
  };
})();