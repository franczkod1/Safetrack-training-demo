import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import { writeFile } from 'node:fs/promises';

const commit = process.env.GITHUB_SHA || 'manual';
const configuredBase = process.env.SAFETRACK_DEPLOYED_URL || 'https://franczkod1.github.io/Safetrack-training-demo/';
const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;
const testUrl = `${base}?live-test=${encodeURIComponent(commit)}`;
const result = { testedAt:new Date().toISOString(), commit, url:testUrl, expectedBuild:'direct-static-v14', passed:false, checks:{}, errors:[] };
let browser;
async function pdfPages(page,path){const bytes=await page.pdf({path,format:'A4',preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false});return(await PDFDocument.load(bytes)).getPageCount()}
try{
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.addInitScript(()=>{localStorage.clear();window.print=()=>{window.__stPrintCalled=true}});
 const page=await context.newPage(),runtimeErrors=[];
 page.on('pageerror',e=>runtimeErrors.push(String(e)));page.on('console',m=>{if(m.type()==='error')runtimeErrors.push(m.text())});
 await page.goto(testUrl,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForSelector('.app',{timeout:20000});
 const startup=await page.evaluate(()=>({build:document.querySelector('meta[name="safetrack-build"]')?.content||'',version:document.querySelector('.st-version-badge')?.textContent?.trim()||'',overflow:Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth),scripts:[...document.scripts].map(s=>s.src)}));
 result.checks.startup=startup;if(startup.build!==result.expectedBuild||startup.version!=='SafeTrack v14'||startup.overflow||startup.scripts.some(s=>s.includes('safetrack-v13')))throw new Error(`Startup failed: ${JSON.stringify(startup)}`);
 await page.locator('[data-page="employees"]').click();await page.waitForSelector('.st-job-groups');
 const jobs=await page.evaluate(()=>{const used=new Set(window.SafeTrackSeed.employees.map(e=>e[3])),groups=[...document.querySelectorAll('.st-job-group')];return{expected:used.size,rendered:groups.length,onlyAssigned:groups.every(g=>used.has(g.dataset.job)),collapsed:groups.every(g=>{const t=g.querySelector('.st-job-toggle'),b=document.getElementById(t?.getAttribute('aria-controls')||'');return t?.getAttribute('aria-expanded')==='false'&&b?.hidden===true})}});
 result.checks.jobs=jobs;if(jobs.rendered!==jobs.expected||!jobs.onlyAssigned||!jobs.collapsed)throw new Error(`Job groups failed: ${JSON.stringify(jobs)}`);
 const jt=page.locator('.st-job-toggle').first(),jid=await jt.getAttribute('aria-controls');await jt.click();await page.locator(`#${jid} .st-employee-row`).first().click();await page.waitForSelector('.st-category-group');
 const categories=await page.evaluate(()=>[...document.querySelectorAll('.st-category-group')].every(g=>{const t=g.querySelector('.st-category-toggle'),b=document.getElementById(t?.getAttribute('aria-controls')||'');return t?.getAttribute('aria-expanded')==='false'&&b?.hidden===true}));result.checks.categoriesCollapsed=categories;if(!categories)throw new Error('Categories are not collapsed.');
 await page.locator('.st-category-toggle').first().click();const choices=page.locator('[data-st-training]');await choices.first().check();await page.locator('[data-st-action="print"]').click();await page.locator('[data-st-print-mode="confirmation"]').click();await page.waitForSelector('#st-print-sheet[data-print-version="v14"]');
 const confirmation=await page.evaluate(()=>{const sheet=document.querySelector('#st-print-sheet'),text=sheet?.innerText||'';return{called:window.__stPrintCalled===true,documents:sheet?.querySelectorAll('.st-print-document').length||0,pages:sheet?.querySelectorAll('.st-confirmation-page').length||0,completion:text.includes('Durchgeführt am'),supervisorNumber:text.includes('Personalnummer der unterweisenden / beaufsichtigenden Person'),supervisorName:text.includes('Name der unterweisenden / beaufsichtigenden Person'),employeeSignature:text.includes('Unterschrift Mitarbeitende:r'),supervisorSignature:text.includes('Unterschrift unterweisende / beaufsichtigende Person'),noStatus:!text.includes('Status'),noDue:!text.includes('Fällig'),version:text.includes('SafeTrack v14')}});
 await page.emulateMedia({media:'print'});confirmation.pdfPages=await pdfPages(page,'CONFIRMATION_ONE_PAGE.pdf');result.checks.confirmation=confirmation;if(!Object.values({...confirmation,pdfPages:confirmation.pdfPages===1}).every(Boolean)||confirmation.documents!==1||confirmation.pages!==1||confirmation.pdfPages!==1)throw new Error(`Single confirmation failed: ${JSON.stringify(confirmation)}`);
 await page.evaluate(()=>{document.querySelector('#st-print-sheet')?.remove();document.body.classList.remove('st-printing');window.__stPrintCalled=false});await page.emulateMedia({media:'screen'});
 const ids=await page.locator('[data-st-training]').evaluateAll(xs=>xs.slice(0,3).map(x=>x.dataset.stTraining));await page.evaluate(ids=>window.__SafeTrackEmployeeGroups.select(ids),ids);await page.locator('[data-st-action="print"]').click();await page.locator('[data-st-print-mode="confirmation"]').click();await page.waitForSelector('#st-print-sheet[data-print-version="v14"]');await page.emulateMedia({media:'print'});const count=await pdfPages(page,'CONFIRMATION_THREE_PAGES.pdf');result.checks.threeTrainingPrint={selected:ids.length,pdfPages:count};if(ids.length!==3||count!==3)throw new Error(`Three-training print failed: ${JSON.stringify(result.checks.threeTrainingPrint)}`);
 await page.emulateMedia({media:'screen'});await page.setViewportSize({width:320,height:900});const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth));result.checks.mobileOverflow=overflow;if(overflow)throw new Error(`Mobile overflow ${overflow}px`);
 result.checks.runtimeErrors=runtimeErrors;if(runtimeErrors.length)throw new Error(runtimeErrors.join(' | '));await page.setViewportSize({width:390,height:900});await page.screenshot({path:'LIVE_TEST_SCREENSHOT.png',fullPage:true});result.passed=true;
}catch(e){result.errors.push(e instanceof Error?e.message:String(e))}finally{if(browser)await browser.close();await writeFile('LIVE_TEST_RESULT.json',JSON.stringify(result,null,2)+'\n')}
if(!result.passed)process.exitCode=1;
