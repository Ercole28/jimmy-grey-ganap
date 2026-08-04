const XLSX = require('xlsx');
const path = 'C:/Users/JIMMY GREEI GANAP/Documents/jimmy-grey-ganap/report-generator/raw-reports/BOR 2026 NW (1).xlsx';
const wb = XLSX.readFile(path, { cellDates:false });
const BERTHS = ['A','B','C1','C2','D'];
const M25 = ['JAN2025','FEB2025','MAR2025','APR25','MEI25','JUNI25'];
const M26 = ['JAN26','FEB26','MAR26','APR26','MEI26','JUNI26'];
const fid = (v,dp=0) => dp===0 ? Math.round(v).toLocaleString('id-ID') : v.toLocaleString('id-ID',{minimumFractionDigits:dp,maximumFractionDigits:dp});
const f1 = v => v.toFixed(1).replace('.',',');

// Classify ship type by name prefix: BG.=Barge/Tongkang, MV.=Motor Vessel, KM.=Kapal Motor, else Other
function shipType(name) {
  const s = (name||'').trim().toUpperCase();
  if (/^BG\.|^BG /.test(s)) return 'Tongkang (BG.)';
  if (/^MV\.|^MV /.test(s)) return 'Kapal Umum (MV.)';
  if (/^KM\.|^KM /.test(s)) return 'Kapal Motor (KM.)';
  return 'Lainnya';
}

function vesselAgg(sheets) {
  const out = { calls:{'Tongkang (BG.)':0,'Kapal Umum (MV.)':0,'Kapal Motor (KM.)':0,'Lainnya':0},
                bk:   {'Tongkang (BG.)':0,'Kapal Umum (MV.)':0,'Kapal Motor (KM.)':0,'Lainnya':0},
                hours:{'Tongkang (BG.)':0,'Kapal Umum (MV.)':0,'Kapal Motor (KM.)':0,'Lainnya':0} };
  sheets.forEach(s => {
    const ws = wb.Sheets[s]; if (!ws) return;
    const rows = XLSX.utils.sheet_to_json(ws, { header:1, raw:true, defval:null });
    let cur = null;
    rows.forEach(r => {
      const no=r[0], berth=r[1], ship=r[2], bk=r[8], hours=r[15];
      if (typeof berth==='string' && BERTHS.includes(berth.trim()) && Number.isInteger(no)) cur=berth.trim();
      // real ship row
      if (cur && Number.isInteger(no) && typeof ship==='string' && ship.trim() && ship.trim()!==':' && !/^NOTE|KETERANGAN/.test(ship.trim())) {
        const t = shipType(ship);
        out.calls[t]++;
        out.bk[t] += (bk||0);
        out.hours[t] += (hours||0);
      }
    });
  });
  return out;
}

// Vessel type by berth (which berths handle which vessels) — for 2026
function vesselByBerth(sheets) {
  const out = {};
  BERTHS.forEach(b => out[b] = {'Tongkang (BG.)':0,'Kapal Umum (MV.)':0,'Kapal Motor (KM.)':0,'Lainnya':0});
  sheets.forEach(s => {
    const ws = wb.Sheets[s]; if (!ws) return;
    const rows = XLSX.utils.sheet_to_json(ws, { header:1, raw:true, defval:null });
    let cur = null;
    rows.forEach(r => {
      const no=r[0], berth=r[1], ship=r[2];
      if (typeof berth==='string' && BERTHS.includes(berth.trim()) && Number.isInteger(no)) cur=berth.trim();
      if (cur && Number.isInteger(no) && typeof ship==='string' && ship.trim() && ship.trim()!==':' && !/^NOTE|KETERANGAN/.test(ship.trim())) {
        out[cur][shipType(ship)]++;
      }
    });
  });
  return out;
}

const V25 = vesselAgg(M25);
const V26 = vesselAgg(M26);
const VB26 = vesselByBerth(M26);

console.log('=== VESSEL TYPE MIX ===');
['Tongkang (BG.)','Kapal Umum (MV.)','Kapal Motor (KM.)','Lainnya'].forEach(t => {
  console.log(`${t}:`);
  console.log(`  2025: calls=${V25.calls[t]}, bk=${fid(V25.bk[t])}, hours=${f1(V25.hours[t])}`);
  console.log(`  2026: calls=${V26.calls[t]}, bk=${fid(V26.bk[t])}, hours=${f1(V26.hours[t])}`);
});

const totCalls25 = Object.values(V25.calls).reduce((a,b)=>a+b,0);
const totCalls26 = Object.values(V26.calls).reduce((a,b)=>a+b,0);
const totBk25 = Object.values(V25.bk).reduce((a,b)=>a+b,0);
const totBk26 = Object.values(V26.bk).reduce((a,b)=>a+b,0);
console.log(`\nTotal calls: 2025=${totCalls25}, 2026=${totCalls26}`);
console.log(`Total bk(row): 2025=${fid(totBk25)}, 2026=${fid(totBk26)}`);

console.log('\n=== VESSEL SHARE 2026 (calls & bk) ===');
['Tongkang (BG.)','Kapal Umum (MV.)','Kapal Motor (KM.)','Lainnya'].forEach(t => {
  console.log(`  ${t}: calls ${f1(V26.calls[t]/totCalls26*100)}% (${V26.calls[t]}), bk ${f1(V26.bk[t]/totBk26*100)}% (${fid(V26.bk[t])})`);
});

console.log('\n=== VESSEL BY BERTH 2026 (calls) ===');
BERTHS.forEach(b => {
  const tot = Object.values(VB26[b]).reduce((a,c)=>a+c,0);
  console.log(`  Dermaga ${b} (tot ${tot}): BG=${VB26[b]['Tongkang (BG.)']} MV=${VB26[b]['Kapal Umum (MV.)']} KM=${VB26[b]['Kapal Motor (KM.)']} Lain=${VB26[b]['Lainnya']}`);
});

// Productivity per vessel type 2026: MT/ship, MT/hour
console.log('\n=== VESSEL-TYPE PRODUCTIVITY 2026 ===');
['Tongkang (BG.)','Kapal Umum (MV.)','Kapal Motor (KM.)','Lainnya'].forEach(t => {
  const mtShip = V26.calls[t] ? V26.bk[t]/V26.calls[t] : 0;
  const mtHour = V26.hours[t] ? V26.bk[t]/V26.hours[t] : 0;
  console.log(`  ${t}: ${fid(mtShip)} MT/kapal, ${fid(mtHour,1)} MT/jam`);
});

// Save vessel data for the build script
const fs = require('fs');
const out = {
  types: ['Tongkang (BG.)','Kapal Umum (MV.)','Kapal Motor (KM.)','Lainnya'],
  v25: { calls: V25.calls, bk: V25.bk, hours: V25.hours, totCalls: totCalls25, totBk: totBk25 },
  v26: { calls: V26.calls, bk: V26.bk, hours: V26.hours, totCalls: totCalls26, totBk: totBk26 },
  byBerth26: VB26
};
fs.writeFileSync('_vessel.json', JSON.stringify(out, null, 2));
console.log('\n=> wrote _vessel.json');
