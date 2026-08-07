(()=>{'use strict';
const MARKER='safetrack-pnr-key-migration-v1';
const canonical=v=>{const s=String(v??'').trim();const m=s.match(/^(?:P-|PNr\.-?|PNr-)(\d+)$/i);return m?`PNr-${m[1]}`:s};
const replaceTokens=s=>String(s).replace(/\bPNr\.-(\d+)\b/gi,'PNr-$1').replace(/\bP-(\d+)\b/g,'PNr-$1');
function deep(v){if(Array.isArray(v))return v.map(deep);if(v&&typeof v==='object'){const out={};Object.entries(v).forEach(([k,x])=>out[replaceTokens(k)]=deep(x));return out}return typeof v==='string'?replaceTokens(v):v}
function migrateEmployees(list){if(!Array.isArray(list))return;list.forEach(e=>{if(Array.isArray(e)&&e.length>1)e[1]=canonical(e[1])})}
function migrateStorage(){for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key||!key.startsWith('safetrack-')||key===MARKER)continue;const raw=localStorage.getItem(key);if(raw==null)continue;try{const parsed=JSON.parse(raw),next=deep(parsed),encoded=JSON.stringify(next);if(encoded!==raw)localStorage.setItem(key,encoded)}catch{const next=replaceTokens(raw);if(next!==raw)localStorage.setItem(key,next)}}localStorage.setItem(MARKER,'PNr-')}
migrateEmployees(window._B?.employees);migrateEmployees(window.SafeTrackSeed?.employees);migrateStorage();
window.__SafeTrackPnrMigration={version:'v1',canonical};
})();