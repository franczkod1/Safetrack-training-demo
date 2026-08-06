(()=>{
  'use strict';

  const VERSION = 'SafeTrack v13';
  const seed = window.SafeTrackSeed;
  const api = window.__SafeTrack;
  if (!seed || !api) return;

  const LANGUAGE_NAME = {de:'Deutsch',pl:'Polski',ru:'Русский',ar:'العربية',tr:'Türkçe',hu:'Magyar',ro:'Română'};
  const CONFIRMATION_TEXT = {
    de:['Bestätigung der Unterweisung','Ich bestätige, dass ich diese Unterweisung erhalten, verstanden und Gelegenheit für Rückfragen hatte.'],
    pl:['Potwierdzenie instruktażu','Potwierdzam, że odbyłem(-am) ten instruktaż, zrozumiałem(-am) jego treść i miałem(-am) możliwość zadawania pytań.'],
    ru:['Подтверждение инструктажа','Я подтверждаю, что прошёл(прошла) этот инструктаж, понял(а) его содержание и имел(а) возможность задать вопросы.'],
    ar:['تأكيد التدريب','أؤكد أنني تلقيت هذا التدريب وفهمت محتواه وأتيحت لي فرصة طرح الأسئلة.'],
    tr:['Eğitim onayı','Bu eğitimi aldığımı, içeriğini anladığımı ve soru sorma fırsatı bulduğumu onaylıyorum.'],
    hu:['Az oktatás megerősítése','Igazolom, hogy az oktatást megkaptam, megértettem, és lehetőségem volt kérdéseket feltenni.'],
    ro:['Confirmarea instruirii','Confirm că am primit această instruire, am înțeles conținutul și am avut posibilitatea să adresez întrebări.']
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const title = (training, language='de') => training?.title?.[language] || training?.title?.de || training?.id || '';
  const category = training => seed.categories?.[training?.category]?.de || training?.category || '';
  const isoToday = () => new Date().toISOString().slice(0,10);
  const formatDate = value => new Intl.DateTimeFormat('de-DE',{dateStyle:'medium'}).format(new Date(`${value}T12:00:00`));

  function ensureVersionBadge(){
    let badge=document.querySelector('.st-version-badge');
    if(!badge){badge=document.createElement('div');badge.className='st-version-badge';badge.setAttribute('aria-label',`Aktuelle Version ${VERSION}`);document.body.appendChild(badge)}
    badge.textContent=VERSION;
  }

  function selectedTrainingIds(){
    return [...document.querySelectorAll('[data-st-training]:checked')].map(node=>node.dataset.stTraining).filter(Boolean);
  }

  function currentEmployee(){
    const id=api.state?.m?.id || api.state?.m?.e || document.querySelector('[data-id][data-a="employee"]')?.dataset.id;
    return seed.employees.find(employee=>employee[1]===id) || null;
  }

  function confirmationPage(employee, training){
    const language=employee[5] || 'de';
    const copy=CONFIRMATION_TEXT[language] || CONFIRMATION_TEXT.de;
    const completed=formatDate(isoToday());
    return `<section class="st-v13-confirmation" data-training-id="${esc(training.id)}">
      <header class="st-v13-head">
        <h1>${esc(title(training,'de'))}</h1>
        <p>${esc(category(training))}</p>
        <div class="st-v13-meta">
          <div><span>Mitarbeitende Person</span><strong>${esc(employee[0])}</strong></div>
          <div><span>Personalnummer</span><strong>${esc(employee[1])}</strong></div>
          <div><span>Bereich / Tätigkeit</span><strong>${esc(employee[2])} · ${esc(employee[3])}</strong></div>
          <div><span>Unterweisung / Version</span><strong>${esc(title(training,'de'))} · v${esc(training.version)}</strong></div>
        </div>
      </header>
      <div class="st-v13-copy" dir="${language==='ar'?'rtl':'ltr'}">
        <h2>${esc(copy[0])}</h2>
        <p><strong>${esc(title(training,language))}</strong></p>
        <p>${esc(copy[1])}</p>
        ${language==='de'?'':`<p class="st-v13-reference" dir="ltr"><strong>Deutsche Referenz:</strong> Ich bestätige, dass ich diese Unterweisung erhalten, verstanden und Gelegenheit für Rückfragen hatte.</p>`}
      </div>
      <div class="st-v13-spacer"></div>
      <section class="st-v13-signatures">
        <div class="st-v13-field"><span>Durchgeführt am</span><div class="st-v13-line">${esc(completed)}</div></div>
        <div class="st-v13-field"><span>Personalnummer der unterweisenden / beaufsichtigenden Person</span><div class="st-v13-line"></div></div>
        <div class="st-v13-field wide"><span>Name der unterweisenden / beaufsichtigenden Person</span><div class="st-v13-line"></div></div>
        <div class="st-v13-field"><span>Unterschrift Mitarbeitende:r</span><div class="st-v13-line"></div></div>
        <div class="st-v13-field"><span>Unterschrift unterweisende / beaufsichtigende Person</span><div class="st-v13-line"></div></div>
      </section>
      <footer class="st-v13-footer"><span>${VERSION}</span><span>Erstellt am ${esc(completed)}</span></footer>
    </section>`;
  }

  function contentPage(employee, training){
    const language=employee[5] || 'de';
    const slides=training.slides?.[language] || training.slides?.de || [];
    const germanSlides=training.slides?.de || [];
    const renderSlides=list=>list.map(slide=>Array.isArray(slide)?`<section class="st-v13-content-block"><h3>${esc(slide[0])}</h3><ul>${(slide[1]||[]).map(point=>`<li>${esc(point)}</li>`).join('')}</ul></section>`:'').join('');
    return `<section class="st-v13-content">
      <h1>${esc(title(training,language))}</h1>
      <h2>Unterweisung · ${esc(LANGUAGE_NAME[language]||language.toUpperCase())}</h2>
      <p>${esc(training.description?.[language]||training.description?.de||'')}</p>
      ${renderSlides(slides)}
      ${language==='de'?'':`<div style="break-before:page;page-break-before:always"><h1>${esc(title(training,'de'))}</h1><h2>Deutsche Fassung für die unterweisende Person</h2><p>${esc(training.description?.de||'')}</p>${renderSlides(germanSlides)}</div>`}
    </section>`;
  }

  function cleanup(){
    document.body.classList.remove('st-v13-printing');
    document.querySelector('#st-v13-print-sheet')?.remove();
  }

  function printV13(mode){
    const employee=currentEmployee();
    const ids=selectedTrainingIds();
    const trainings=ids.map(id=>api.catalog.find(item=>item.id===id)).filter(Boolean);
    if(!employee || !trainings.length) return;
    document.querySelector('.st-print-options-bg')?.remove();
    cleanup();
    const sheet=document.createElement('section');
    sheet.id='st-v13-print-sheet';
    sheet.dataset.version='13';
    sheet.innerHTML=trainings.map(training=>`<article class="st-v13-document">${mode==='full'?contentPage(employee,training):''}${confirmationPage(employee,training)}</article>`).join('');
    document.body.appendChild(sheet);
    document.body.classList.add('st-v13-printing');
    const after=()=>{cleanup();window.removeEventListener('afterprint',after)};
    window.addEventListener('afterprint',after,{once:true});
    requestAnimationFrame(()=>requestAnimationFrame(()=>window.print()));
    setTimeout(cleanup,30000);
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-st-print-mode]');
    if(!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    printV13(button.dataset.stPrintMode);
  },true);

  const observer=new MutationObserver(ensureVersionBadge);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  ensureVersionBadge();
})();
