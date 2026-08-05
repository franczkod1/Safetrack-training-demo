(() => {
  'use strict';

  const STATUSES = ['expired', 'upcoming', 'pending', 'valid'];
  const STYLE_ID = 'safetrack-kpi-hotfix-style';
  const ACTIVE_KEY = 'st-dashboard-status-hotfix';
  const SELF_TEST = new URLSearchParams(location.search).get('selftest') === 'kpi' || location.hash === '#selftest-kpi';
  let selfTestStarted = false;

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

    if (SELF_TEST && !selfTestStarted) {
      selfTestStarted = true;
      setTimeout(runSelfTest, 50);
    }
  }

  function waitFor(selector, timeout = 4000) {
    return new Promise((resolve, reject) => {
      const started = performance.now();
      const check = () => {
        const element = document.querySelector(selector);
        if (element) return resolve(element);
        if (performance.now() - started > timeout) return reject(new Error(`Timeout: ${selector}`));
        requestAnimationFrame(check);
      };
      check();
    });
  }

  async function runSelfTest() {
    const results = [];
    try {
      for (const status of STATUSES) {
        if (!document.querySelector(`[data-kpi-status="${status}"]`)) {
          document.querySelector('[data-page="dashboard"]')?.click();
          await waitFor(`[data-kpi-status="${status}"]`);
        }
        const card = document.querySelector(`[data-kpi-status="${status}"]`);
        const expected = Number(card.querySelector('.kpi-value')?.textContent.trim() || NaN);
        card.click();
        const select = await waitFor('#filter-status');
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const count = document.querySelectorAll('tbody tr').length;
        const selected = select.value;
        results.push({ status, expected, count, selected, passed: expected === count && selected === status });
        document.querySelector('[data-page="dashboard"]')?.click();
        await waitFor(`[data-kpi-status="${status}"]`);
      }
      const report = {
        test: 'SafeTrack deployed dashboard KPI smoke test',
        passed: results.every(result => result.passed),
        url: location.href,
        timestamp: new Date().toISOString(),
        results
      };
      observer.disconnect();
      document.body.innerHTML = `<main style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;max-width:900px;margin:auto"><h1>${report.passed ? 'PASS' : 'FAIL'}</h1><p>SafeTrack deployed dashboard KPI smoke test</p><pre id="safetrack-selftest-result" style="white-space:pre-wrap;background:#f4f7fb;border:1px solid #d0d5dd;border-radius:12px;padding:16px">${JSON.stringify(report, null, 2)}</pre></main>`;
    } catch (error) {
      observer.disconnect();
      document.body.innerHTML = `<main style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;max-width:900px;margin:auto"><h1>FAIL</h1><pre id="safetrack-selftest-result">${JSON.stringify({ passed: false, error: String(error), url: location.href }, null, 2)}</pre></main>`;
    }
  }

  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();
})();
