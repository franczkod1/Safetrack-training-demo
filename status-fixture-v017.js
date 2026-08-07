(()=>{'use strict';
const STORAGE_KEY='safetrack-static-v6',FIXTURE_KEY='safetrack-balanced-status-v2',FIXTURE_ID='balanced-five-areas-10-20-70-v017',OFFSETS=[-18,-4,2,4,9,17,28,48,75,110,160,240],seed=window.SafeTrackSeed;
if(!seed||!Array.isArray(seed.employees)||!Array.isArray(seed.trainings))return;
const PLAN={Produktion:{critical:4,soon:8},Reinigung:{critical:1,soon:2},Logistik:{critical:2,soon:5},Instandhaltung:{critical:1,soon:2},Qualitätskontrolle:{critical:2,soon:3}};
const classify=days=>days<=5?'critical':days<=30?'soon':'valid';
const required=(employee,training)=>training.active!==false&&Array.isArray(training.roles)&&training.roles.some(role=>role==='all'||role===employee[4]);
let stored=null;try{stored=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{stored=null}
const catalog=Array.isArray(stored?.catalog)?stored.catalog:seed.trainings,existingRecords=Array.isArray(stored?.records)?stored.records:[],marker=localStorage.getItem(FIXTURE_KEY);
if(marker===FIXTURE_ID&&existingRecords.some(record=>record?.demoFixture===FIXTURE_ID))return;
const preservedRecords=existingRecords.filter(record=>!record?.demoFixture),recordsByKey=new Map(preservedRecords.map(record=>[`${record.employeeId}::${record.trainingId}`,record])),today=new Date().toISOString().slice(0,10),areaPosition=new Map();
seed.employees.forEach((employee,employeeIndex)=>{
 const area=employee[2],position=areaPosition.get(area)||0;areaPosition.set(area,position+1);
 const quota=PLAN[area]||{critical:0,soon:0};
 const desiredStatus=position<quota.critical?'critical':position<quota.critical+quota.soon?'soon':'valid';
 const assignedTrainings=catalog.filter(training=>required(employee,training));
 assignedTrainings.forEach((training,trainingIndex)=>{
  const defaultDays=OFFSETS[(employeeIndex*7+trainingIndex*5)%OFFSETS.length],defaultStatus=classify(defaultDays);
  const shouldComplete=desiredStatus==='soon'?defaultStatus==='critical':desiredStatus==='valid'?defaultStatus!=='valid':false;
  if(!shouldComplete)return;
  const key=`${employee[1]}::${training.id}`;if(recordsByKey.has(key))return;
  recordsByKey.set(key,{id:`DEMO-${employee[1]}-${training.id}`,employeeId:employee[1],employeeName:employee[0],trainingId:training.id,trainingNumber:training.trainingNumber,date:today,instructor:'SafeTrack Demo',demoFixture:FIXTURE_ID});
 });
});
localStorage.setItem(STORAGE_KEY,JSON.stringify({catalog,records:[...recordsByKey.values()]}));
localStorage.setItem(FIXTURE_KEY,FIXTURE_ID);
window.__SafeTrackStatusFixtureV017={id:FIXTURE_ID,plan:PLAN};
})();
