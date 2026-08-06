(()=>{
  'use strict';

  const formatToday = () => new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date());

  function prepareConfirmationPages() {
    const sheet = document.querySelector('#st-print-sheet');
    if (!sheet) return;

    sheet.dataset.printVersion = 'v12';
    const today = formatToday();

    sheet.querySelectorAll('.st-confirmation-page').forEach((page, index) => {
      page.dataset.confirmationPage = String(index + 1);
      page.setAttribute('aria-label', `Bestätigungsseite ${index + 1}`);

      const dateValue = page.querySelector('.st-confirmation-fields .st-form-field:first-child strong');
      if (dateValue && !dateValue.textContent.trim()) dateValue.textContent = today;

      const fields = [...page.querySelectorAll('.st-confirmation-fields .st-form-field')];
      if (fields[1]) fields[1].dataset.field = 'instructor-personnel-number';
      if (fields[2]) fields[2].dataset.field = 'instructor-name';
      if (fields[3]) fields[3].dataset.field = 'employee-signature';
      if (fields[4]) fields[4].dataset.field = 'instructor-signature';
    });
  }

  function enforceClosedGroups(root = document) {
    root.querySelectorAll('[data-st-action="toggle-category"], [data-st-action="toggle-job"]').forEach(toggle => {
      if (!toggle.hasAttribute('data-st-user-toggled')) {
        toggle.setAttribute('aria-expanded', 'false');
        const body = document.getElementById(toggle.getAttribute('aria-controls'));
        if (body) body.hidden = true;
      }
    });
  }

  document.addEventListener('click', event => {
    const toggle = event.target.closest?.('[data-st-action="toggle-category"], [data-st-action="toggle-job"]');
    if (toggle) toggle.setAttribute('data-st-user-toggled', 'true');
  }, true);

  const nativePrint = window.print.bind(window);
  window.print = () => {
    prepareConfirmationPages();
    nativePrint();
  };

  const observer = new MutationObserver(() => {
    enforceClosedGroups();
    if (document.querySelector('#st-print-sheet')) prepareConfirmationPages();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  document.documentElement.dataset.safetrackBuild = 'direct-static-v12';
  enforceClosedGroups();
})();
