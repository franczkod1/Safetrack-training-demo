(() => {
  'use strict';

  const STATUSES = ['expired', 'upcoming', 'pending', 'valid'];
  const STYLE_ID = 'safetrack-kpi-hotfix-style';
  const ACTIVE_KEY = 'st-dashboard-status-hotfix';

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .kpi-grid .kpi[data-kpi-status] {
        width: 100%;
        border: 1px solid var(--line);
        cursor: pointer;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
        transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
      }
      .kpi-grid .kpi[data-kpi-status]:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(16,24,40,.12); }
      .kpi-grid .kpi[data-kpi-status]:focus-visible { outline: 3px solid rgba(21,94,239,.32); outline-offset: 3px; }
      .kpi-grid .kpi[data-kpi-status].is-active { border-color: #155eef; box-shadow: 0 0 0 3px rgba(21,94,239,.15),0 14px 34px rgba(16,24,40,.10); }
      .kpi-grid .kpi[data-kpi-status].is-active .kpi-label { color: #155eef; font-weight: 800; }
    `;
    document.head.appendChild(style);
  }

  function activateFilter(status) {
    if (!STATUSES.includes(status)) return;
    try { sessionStorage.setItem(ACTIVE_KEY, status); } catch (_) {}
    history.replaceState(null, '', `#employees?status=${encodeURIComponent(status)}`);

    const employeesButton = document.querySelector('[data-page="employees"]');
    if (!employeesButton) return;
    employeesButton.click();

    requestAnimationFrame(() => {
      const statusSelect = document.getElementById('filter-status');
      if (!statusSelect) return;
      statusSelect.value = status;
      statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  function apply() {
    addStyles();
    const cards = [...document.querySelectorAll('.kpi-grid .kpi')];
    if (cards.length < 4) return;
    let active = '';
    try { active = sessionStorage.getItem(ACTIVE_KEY) || ''; } catch (_) {}

    cards.slice(0, 4).forEach((card, index) => {
      const status = STATUSES[index];
      card.dataset.kpiStatus = status;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-pressed', active === status ? 'true' : 'false');
      card.classList.toggle('is-active', active === status);

      if (card.dataset.hotfixBound === 'true') return;
      card.dataset.hotfixBound = 'true';
      card.addEventListener('click', () => activateFilter(status));
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activateFilter(status);
        }
      });
    });
  }

  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();
})();
