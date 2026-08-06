(()=>{
  'use strict';

  const seed = window.SafeTrackSeed;
  const api = window.__SafeTrack;
  if (!seed || !api) return;

  const STORAGE_KEY = 'safetrack-static-v6';
  const OFFSETS = [-18, -4, 2, 4, 9, 17, 28, 48, 75, 110, 160, 240];
  const RANK = { critical: 0, soon: 1, valid: 2 };
  const LABEL = { critical: 'Kritisch', soon: 'In 6–30 Tagen fällig', valid: 'Gültig' };

  let currentEmployeeId = '';
  let selected = new Set();
  let batch = null;
  let enhancing = false;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  const today = () => new Date(new Date().setHours(0, 0, 0, 0));
  const addDays = days => {
    const date = new Date(today().getTime() + days * 864e5);
    return date.toISOString().slice(0, 10);
  };
  const dateLabel = value => new Intl.DateTimeFormat(api.state.lang || 'de', { dateStyle: 'medium' })
    .format(new Date(`${value}T12:00:00`));
  const classify = days => days <= 5 ? 'critical' : days <= 30 ? 'soon' : 'valid';
  const required = (employee, training) => training.active !== false && Array.isArray(training.roles) &&
    training.roles.some(role => role === 'all' || role === employee[4]);
  const categoryName = category => seed.categories?.[category]?.[api.state.lang] ||
    seed.categories?.[category]?.de || category;
  const trainingTitle = training => training.title?.[api.state.lang] || training.title?.de || training.id;

  function readRecords() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return Array.isArray(stored?.records) ? stored.records : [];
    } catch {
      return [];
    }
  }

  function assignments(employeeId) {
    const employeeIndex = seed.employees.findIndex(employee => employee[1] === employeeId);
    const employee = seed.employees[employeeIndex];
    if (!employee) return [];
    const records = readRecords();
    const catalog = api.catalog;
    return catalog.filter(training => required(employee, training)).map((training, trainingIndex) => {
      const record = records.find(item => item.employeeId === employee[1] && item.trainingId === training.id);
      const dueDays = record ? training.months * 30 : OFFSETS[(employeeIndex * 7 + trainingIndex * 5) % OFFSETS.length];
      return {
        training,
        dueDays,
        dueDate: addDays(dueDays),
        status: classify(dueDays),
        record
      };
    });
  }

  function groupsFor(employeeId) {
    const byCategory = new Map();
    assignments(employeeId).forEach(item => {
      const category = item.training.category;
      if (!byCategory.has(category)) byCategory.set(category, []);
      byCategory.get(category).push(item);
    });

    return [...byCategory.entries()].map(([category, items]) => {
      items.sort((left, right) => RANK[left.status] - RANK[right.status] || left.dueDays - right.dueDays ||
        trainingTitle(left.training).localeCompare(trainingTitle(right.training), api.state.lang || 'de'));
      const status = items.reduce((worst, item) => RANK[item.status] < RANK[worst] ? item.status : worst, 'valid');
      const counts = { critical: 0, soon: 0, valid: 0 };
      items.forEach(item => counts[item.status] += 1);
      return {
        category,
        name: categoryName(category),
        status,
        counts,
        earliestDue: Math.min(...items.map(item => item.dueDays)),
        items
      };
    }).sort((left, right) => RANK[left.status] - RANK[right.status] || left.earliestDue - right.earliestDue ||
      left.name.localeCompare(right.name, api.state.lang || 'de'));
  }

  function statusMarkup(status) {
    return `<span class="st-category-status st-${status}"><span class="st-status-icon" aria-hidden="true"></span>${LABEL[status]}</span>`;
  }

  function overallStatus(items) {
    const statuses = items.map(item => item.status);
    return statuses.includes('critical') ? 'critical' : statuses.includes('soon') ? 'soon' : 'valid';
  }

  function categoryMarkup(group, groupIndex) {
    const groupId = `st-category-${groupIndex}`;
    const open = group.status !== 'valid';
    return `<section class="st-category-group" data-category="${escapeHtml(group.category)}" data-status="${group.status}" role="group" aria-labelledby="${groupId}-label">
      <div class="st-category-head">
        <label class="st-category-check">
          <input type="checkbox" data-st-category="${escapeHtml(group.category)}" aria-label="Alle Unterweisungen in ${escapeHtml(group.name)} auswählen">
          <span id="${groupId}-label">${escapeHtml(group.name)}</span>
        </label>
        <button type="button" class="st-category-toggle" data-st-action="toggle-category" data-category="${escapeHtml(group.category)}" aria-expanded="${open}" aria-controls="${groupId}-body">
          ${statusMarkup(group.status)}
          <span class="st-category-counts">${group.counts.critical} kritisch · ${group.counts.soon} fällig · ${group.counts.valid} gültig</span>
          <span class="st-chevron" aria-hidden="true"></span>
        </button>
      </div>
      <div class="st-category-body" id="${groupId}-body" ${open ? '' : 'hidden'}>
        ${group.items.map(item => `<label class="st-training-choice" data-status="${item.status}">
          <input type="checkbox" data-st-training="${escapeHtml(item.training.id)}" ${selected.has(item.training.id) ? 'checked' : ''}>
          <span class="st-training-copy">
            <strong>${escapeHtml(trainingTitle(item.training))}</strong>
            <small>v${escapeHtml(item.training.version)} · ${dateLabel(item.dueDate)}</small>
          </span>
          ${statusMarkup(item.status)}
        </label>`).join('')}
      </div>
    </section>`;
  }

  function enhanceEmployeeModal() {
    if (enhancing || api.state.m?.t !== 'emp') return;
    const modal = document.querySelector('.modal-bg .modal');
    if (!modal || modal.dataset.stEnhanced === 'true') return;

    const employeeId = api.state.m.id;
    const employee = seed.employees.find(item => item[1] === employeeId);
    const body = modal.querySelector('.modal-body');
    if (!employee || !body) return;

    enhancing = true;
    if (currentEmployeeId !== employeeId) {
      currentEmployeeId = employeeId;
      selected = new Set();
      batch = null;
    }

    const groups = groupsFor(employeeId);
    const allItems = groups.flatMap(group => group.items);
    const overall = overallStatus(allItems);
    body.innerHTML = `<div class="st-employee-actions">
      <div class="st-employee-status">${statusMarkup(overall)}<span>${allItems.length} zugeordnete Unterweisungen</span></div>
      <div class="st-quick-actions">
        <button type="button" class="btn small" data-st-action="select-critical">Alle kritischen auswählen</button>
        <button type="button" class="btn small" data-st-action="clear">Auswahl aufheben</button>
      </div>
    </div>
    <div class="st-category-list">${groups.map(categoryMarkup).join('')}</div>
    <div class="st-selection-bar" aria-live="polite">
      <strong><span data-st-count>${selected.size}</span> ausgewählt</strong>
      <div class="st-selection-actions">
        <button type="button" class="btn" data-st-action="print" ${selected.size ? '' : 'disabled'}>Auswahl drucken</button>
        <button type="button" class="btn primary" data-st-action="start" ${selected.size ? '' : 'disabled'}>Auswahl starten</button>
      </div>
    </div>`;

    modal.dataset.stEnhanced = 'true';
    syncSelectionUi();
    enhancing = false;
  }

  function visibleTrainingIds(category) {
    return [...document.querySelectorAll(`.st-category-group[data-category="${CSS.escape(category)}"] [data-st-training]`)]
      .map(input => input.dataset.stTraining);
  }

  function syncSelectionUi() {
    document.querySelectorAll('[data-st-training]').forEach(input => {
      input.checked = selected.has(input.dataset.stTraining);
    });
    document.querySelectorAll('[data-st-category]').forEach(input => {
      const ids = visibleTrainingIds(input.dataset.stCategory);
      const count = ids.filter(id => selected.has(id)).length;
      input.checked = ids.length > 0 && count === ids.length;
      input.indeterminate = count > 0 && count < ids.length;
      input.setAttribute('aria-checked', input.indeterminate ? 'mixed' : String(input.checked));
    });
    document.querySelectorAll('[data-st-count]').forEach(node => node.textContent = String(selected.size));
    document.querySelectorAll('[data-st-action="print"], [data-st-action="start"]').forEach(button => {
      button.disabled = selected.size === 0;
    });
  }

  function showToast(message) {
    const toast = document.querySelector('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function selectedAssignments() {
    const order = groupsFor(currentEmployeeId).flatMap(group => group.items);
    return order.filter(item => selected.has(item.training.id));
  }

  function startBatch() {
    const items = selectedAssignments();
    if (!items.length) return showToast('Mindestens eine Unterweisung auswählen');
    batch = {
      employeeId: currentEmployeeId,
      ids: items.map(item => item.training.id),
      index: 0
    };
    openBatchItem();
  }

  function openBatchItem() {
    if (!batch || batch.index >= batch.ids.length) {
      const employeeId = batch?.employeeId || currentEmployeeId;
      batch = null;
      selected = new Set();
      api.state.page = 'employees';
      api.state.m = { t: 'emp', id: employeeId };
      api.render();
      return;
    }
    api.state.m = { t: 'session', e: batch.employeeId, id: batch.ids[batch.index] };
    api.render();
  }

  function printSelection() {
    const employee = seed.employees.find(item => item[1] === currentEmployeeId);
    const items = selectedAssignments();
    if (!employee || !items.length) return showToast('Mindestens eine Unterweisung auswählen');

    const grouped = new Map();
    items.forEach(item => {
      const category = item.training.category;
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category).push(item);
    });

    document.querySelector('#st-print-sheet')?.remove();
    const sheet = document.createElement('section');
    sheet.id = 'st-print-sheet';
    sheet.innerHTML = `<header>
      <h1>SafeTrack – Unterweisungsauswahl</h1>
      <p><strong>${escapeHtml(employee[0])}</strong> · ${escapeHtml(employee[1])}</p>
      <p>${escapeHtml(employee[2])} · ${escapeHtml(employee[3])}</p>
    </header>
    ${[...grouped.entries()].map(([category, categoryItems]) => `<section class="st-print-category">
      <h2>${escapeHtml(categoryName(category))}</h2>
      <table><thead><tr><th>Unterweisung</th><th>Version</th><th>Fällig</th><th>Status</th></tr></thead><tbody>
      ${categoryItems.map(item => `<tr><td>${escapeHtml(trainingTitle(item.training))}</td><td>v${escapeHtml(item.training.version)}</td><td>${dateLabel(item.dueDate)}</td><td>${LABEL[item.status]}</td></tr>`).join('')}
      </tbody></table>
    </section>`).join('')}
    <footer>
      <div>Unterweisende Person: ______________________________</div>
      <div>Datum: ____________________</div>
      <div class="st-print-signature">Unterschrift Mitarbeitende:r</div>
    </footer>`;
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

  document.addEventListener('change', event => {
    const training = event.target.closest?.('[data-st-training]');
    if (training) {
      training.checked ? selected.add(training.dataset.stTraining) : selected.delete(training.dataset.stTraining);
      syncSelectionUi();
      return;
    }
    const category = event.target.closest?.('[data-st-category]');
    if (category) {
      visibleTrainingIds(category.dataset.stCategory).forEach(id => {
        category.checked ? selected.add(id) : selected.delete(id);
      });
      syncSelectionUi();
    }
  });

  document.addEventListener('click', event => {
    const action = event.target.closest?.('[data-st-action]');
    if (!action) return;
    const name = action.dataset.stAction;
    if (name === 'toggle-category') {
      const body = document.querySelector(`#${CSS.escape(action.getAttribute('aria-controls'))}`);
      const expanded = action.getAttribute('aria-expanded') === 'true';
      action.setAttribute('aria-expanded', String(!expanded));
      if (body) body.hidden = !expanded;
    } else if (name === 'select-critical') {
      assignments(currentEmployeeId).filter(item => item.status === 'critical').forEach(item => selected.add(item.training.id));
      syncSelectionUi();
    } else if (name === 'clear') {
      selected.clear();
      syncSelectionUi();
    } else if (name === 'start') {
      startBatch();
    } else if (name === 'print') {
      printSelection();
    }
  });

  document.addEventListener('click', event => {
    const saveButton = event.target.closest?.('[data-a="saveSession"]');
    if (!saveButton || !batch) return;
    const before = readRecords().length;
    setTimeout(() => {
      const completed = readRecords().length > before;
      if (!completed) return;
      selected.delete(batch.ids[batch.index]);
      batch.index += 1;
      openBatchItem();
    }, 180);
  }, true);

  document.addEventListener('click', event => {
    const closeButton = event.target.closest?.('[data-a="close"]');
    if (closeButton && batch && api.state.m?.t === 'session') batch = null;
  }, true);

  const observer = new MutationObserver(enhanceEmployeeModal);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  enhanceEmployeeModal();

  window.__SafeTrackEmployeeGroups = {
    groupsFor,
    getSelected: () => [...selected],
    select(ids) {
      selected = new Set(ids);
      syncSelectionUi();
    }
  };
})();
