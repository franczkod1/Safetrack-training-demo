(()=>{'use strict';
const s=window.SafeTrackSeed;if(!s)return;
const VERSION='SafeTrack v0.17';
const L=['de','pl','ru','ar','tr','hu','ro'];
const P={
 de:[['Anna','Lukas','Sophie','Daniel','Laura','Jonas','Marie','Felix'],['Müller','Schneider','Fischer','Weber','Wagner','Becker','Hoffmann','Schäfer']],
 pl:[['Anna','Piotr','Katarzyna','Tomasz','Ewa','Marek','Agnieszka','Paweł'],['Kowalski','Nowak','Wiśniewski','Wójcik','Kamiński','Lewandowski','Zieliński','Szymański']],
 ru:[['Olena','Ivan','Svetlana','Dmitri','Irina','Sergei','Natalia','Alexei'],['Petrova','Sokolov','Morozova','Volkov','Kuznetsova','Lebedev','Orlova','Smirnov']],
 ar:[['Ahmed','Layla','Omar','Mariam','Fatima','Youssef','Noor','Karim'],['Hassan','Mansour','Khalil','Nasser','Zahra','Saleh','Ibrahim','Mahmoud']],
 tr:[['Mehmet','Aylin','Emre','Zeynep','Burak','Selin','Hakan','Elif'],['Yılmaz','Demir','Kaya','Şahin','Aydın','Koç','Özdemir','Arslan']],
 hu:[['László','Éva','Miklós','Gábor','Zoltán','János','Eszter','Bence'],['Nagy','Kiss','Horváth','Tóth','Varga','Farkas','Balogh','Molnár']],
 ro:[['Andrei','Elena','Ioana','Cristian','Mihaela','Radu','Ana','Mihai'],['Popescu','Ionescu','Stan','Dumitru','Radu','Marinescu','Stoica','Georgescu']]
};
const A={
 Produktion:[['Produktionsmitarbeitende','production'],['Maschinen- und Anlagenführung','machine'],['Verpackung und Linienbetrieb','packaging'],['Teamkoordination Produktion','leader']],
 Reinigung:[['Hygiene und Reinigung','cleaning'],['Produktionsreinigung','cleaning'],['Gebäude- und Sozialraumreinigung','cleaning']],
 Logistik:[['Lager und Kommissionierung','logistics'],['Stapler und innerbetrieblicher Transport','forklift'],['Wareneingang und Versand','logistics']],
 Instandhaltung:[['Elektrotechnik','maintenance'],['Mechanik und Betriebstechnik','maintenance'],['Mechatronik','maintenance']],
 Qualitätskontrolle:[['Qualitätskontrolle','quality'],['Labor und Dokumentation','quality'],['Qualitätssicherung','quality']]
};
const AREA=i=>i<40?'Produktion':i<50?'Reinigung':i<75?'Logistik':i<85?'Instandhaltung':'Qualitätskontrolle';
const START={Produktion:0,Reinigung:40,Logistik:50,Instandhaltung:75,Qualitätskontrolle:85};
s.employees=Array.from({length:100},(_,i)=>{
 const l=L[i%7],p=P[l],k=Math.floor(i/7),area=AREA(i),jobs=A[area],local=i-START[area],job=jobs[local%jobs.length];
 return[`${p[0][k%8]} ${p[1][(Math.floor(k/8)+i%7)%8]}`,`PNr-${2001+i}`,area,job[0],job[1],l];
});
const D={production:'Produktionsmitarbeitende',machine:'Maschinen- und Anlagenführung',packaging:'Verpackung und Linienbetrieb',cleaning:'Reinigung und Hygiene',logistics:'Lager und Kommissionierung',forklift:'Stapler und innerbetrieblicher Transport',maintenance:'Instandhaltung',quality:'Qualitätskontrolle',leader:'Teamkoordination Produktion'};
Object.entries(D).forEach(([k,v])=>{if(s.roles?.[k])s.roles[k].de=v});
const number=n=>`ST-UW-${String(n).padStart(3,'0')}`;
s.trainings.forEach((t,i)=>{if(!t.trainingNumber)t.trainingNumber=number(i+1)});
if(localStorage.getItem('safetrack-v017-fixture-migrated')!=='1'){
 localStorage.removeItem('safetrack-balanced-status-v1');
 localStorage.removeItem('safetrack-balanced-status-v2');
 localStorage.setItem('safetrack-v017-fixture-migrated','1');
}
window.__SafeTrackV017={version:VERSION,employeeCount:s.employees.length,areas:['Produktion','Reinigung','Logistik','Instandhaltung','Qualitätskontrolle'],distribution:{Produktion:40,Reinigung:10,Logistik:25,Instandhaltung:10,Qualitätskontrolle:15}};
})();
