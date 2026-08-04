const XLSX = require('xlsx');
const path = 'C:/Users/JIMMY GREEI GANAP/Documents/jimmy-grey-ganap/report-generator/raw-reports/BOR 2026 NW (1).xlsx';
const wb = XLSX.readFile(path, { cellDates:false });
const BERTHS = ['A','B','C1','C2','D'];

// AUTHORITATIVE extraction:
//  - bongkar/muat/BOR/hours from subtotal rows (file's own computed totals)
//  - ship count from NO-column max per berth section
function extract(sheet) {
  const ws = wb.Sheets[sheet];
  if (!ws) return null;
  const rows = XLSX.utils.sheet_to_json(ws, { header:1, raw:true, defval:null });
  const out = { A:{ships:0,bk:0,muat:0,bor:0,hours:0}, B:{ships:0,bk:0,muat:0,bor:0,hours:0},
                C1:{ships:0,bk:0,muat:0,bor:0,hours:0}, C2:{ships:0,bk:0,muat:0,bor:0,hours:0},
                D:{ships:0,bk:0,muat:0,bor:0,hours:0} };
  let cur = null;
  rows.forEach(r => {
    const no=r[0], berth=r[1], ship=r[2], bk=r[8], muat=r[9], bor=r[10], hrs=r[15];
    // section start: berth letter + integer NO
    if (typeof berth === 'string' && BERTHS.includes(berth.trim()) && Number.isInteger(no)) {
      cur = berth.trim();
      // count this row as 1 ship (it has a ship name normally)
    }
    // ship row: integer NO within a section → count by NO max later; but also count rows with ship name and integer no
    // Subtotal: no null, no ship, bk numeric, bor numeric
    if (no === null && !ship && typeof bk === 'number' && bk > 0 && typeof bor === 'number' && cur) {
      out[cur].bk = bk;
      out[cur].muat = muat || 0;
      out[cur].bor = bor * 100;
      out[cur].hours = hrs || 0;
    }
  });
  // ship count = max NO per berth section (re-scan)
  cur = null;
  const maxNo = { A:0,B:0,C1:0,C2:0,D:0 };
  const minNo = { A:999,B:999,C1:999,C2:999,D:999 };
  rows.forEach(r => {
    const no=r[0], berth=r[1];
    if (typeof berth === 'string' && BERTHS.includes(berth.trim()) && Number.isInteger(no)) {
      cur = berth.trim();
    }
    if (cur && Number.isInteger(no) && no > 0) {
      if (no > maxNo[cur]) maxNo[cur] = no;
      if (no < minNo[cur]) minNo[cur] = no;
    }
  });
  // ships per berth = max - min + 1 within that section. But NO is continuous across whole sheet (1..N).
  // Better: count integer-NO rows that have a ship name, per berth section.
  cur = null;
  const cnt = { A:0,B:0,C1:0,C2:0,D:0 };
  rows.forEach(r => {
    const no=r[0], berth=r[1], ship=r[2];
    if (typeof berth === 'string' && BERTHS.includes(berth.trim()) && Number.isInteger(no)) cur = berth.trim();
    // a real ship row: has integer NO AND a non-empty ship name (string, not ':')
    if (cur && Number.isInteger(no) && typeof ship === 'string' && ship.trim() && ship.trim() !== ':' && !/^NOTE|KETERANGAN/.test(ship.trim())) {
      cnt[cur]++;
    }
  });
  BERTHS.forEach(b => out[b].ships = cnt[b]);
  return out;
}

const M25 = ['JAN2025','FEB2025','MAR2025','APR25','MEI25','JUNI25'];
const M26 = ['JAN26','FEB26','MAR26','APR26','MEI26','JUNI26'];
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun'];
const fid = (v,dp=0) => dp===0 ? Math.round(v).toLocaleString('id-ID') : v.toLocaleString('id-ID',{minimumFractionDigits:dp,maximumFractionDigits:dp});

function semester(sheets) {
  const perMonth = sheets.map((s,i) => ({ name:s, m:MONTHS[i], d:extract(s) }));
  const agg = {};
  BERTHS.forEach(b => { agg[b] = { ships:0, bk:0, muat:0, borSum:0, hours:0 }; });
  perMonth.forEach(pm => {
    BERTHS.forEach(b => {
      agg[b].ships += pm.d[b].ships;
      agg[b].bk += pm.d[b].bk;
      agg[b].muat += pm.d[b].muat;
      agg[b].borSum += pm.d[b].bor;
      agg[b].hours += pm.d[b].hours;
    });
  });
  // semester BOR per berth = mean of 6 monthly BORs
  BERTHS.forEach(b => agg[b].avgBor = agg[b].borSum / 6);
  // totals
  const tot = { ships:0, bk:0, muat:0, hours:0 };
  BERTHS.forEach(b => { tot.ships+=agg[b].ships; tot.bk+=agg[b].bk; tot.muat+=agg[b].muat; tot.hours+=agg[b].hours; });
  // monthly avg BOR (mean of 5 berths) and monthly totals
  const monthlyTrend = perMonth.map(pm => {
    const avgBor = BERTHS.reduce((s,b)=>s+pm.d[b].bor,0)/5;
    const bk = BERTHS.reduce((s,b)=>s+pm.d[b].bk,0);
    const ships = BERTHS.reduce((s,b)=>s+pm.d[b].ships,0);
    return { m:pm.m, avgBor, bk, ships };
  });
  const semAvgBor = monthlyTrend.reduce((s,x)=>s+x.avgBor,0)/6;
  return { perMonth, agg, tot, monthlyTrend, semAvgBor };
}

// Cargo mix (classify Jns.Barang) using subtotal bongkar is not possible (subtotal lacks cargo type).
// So sum cargo from individual data rows (bongkar by ship), which is fine for mix proportions.
function cargoMix(sheets) {
  const cargo = {};
  sheets.forEach(s => {
    const ws = wb.Sheets[s]; if (!ws) return;
    const rows = XLSX.utils.sheet_to_json(ws, { header:1, raw:true, defval:null });
    let cur = null;
    rows.forEach(r => {
      const no=r[0], berth=r[1], ship=r[2], jns=(r[3]||'').toString().trim().toUpperCase(), bk=r[8];
      if (typeof berth==='string' && BERTHS.includes(berth.trim()) && Number.isInteger(no)) cur=berth.trim();
      // real ship row with cargo
      if (cur && Number.isInteger(no) && typeof ship==='string' && ship.trim() && ship.trim()!==':' 
          && typeof bk==='number' && bk>0 && jns) {
        let key;
        if (/BATUBARA|BATU BARA|BATU BARA/.test(jns)) key='Batubara';
        else if (/STEEL|BESI|BILLET|BLOOM|COIL|PIPE|SLAB|WIRE ROD|DEBAR/.test(jns)) key='Baja';
        else if (/GYPSUM|GIPSUM/.test(jns)) key='Gypsum';
        else if (/SUGAR|GULA/.test(jns)) key='Gula';
        else if (/TISSUE|ROLL ?TISSUE/.test(jns)) key='Rolltissue';
        else if (/PULP|KRAFT|WOOD PULP|BROWN PULP/.test(jns)) key='Pulp';
        else key='Lainnya';
        cargo[key] = (cargo[key]||0) + bk;
      }
    });
  });
  const total = Object.values(cargo).reduce((s,v)=>s+v,0);
  return { cargo, total };
}

const S25 = semester(M25);
const S26 = semester(M26);
const C25 = cargoMix(M25);
const C26 = cargoMix(M26);

console.log('================ S1 2025 ================');
console.log('Monthly trend (avgBOR%, bongkar, ships):');
S25.monthlyTrend.forEach(x => console.log(`  ${x.m}: BOR=${fid(x.avgBor,1)}%, bk=${fid(x.bk)}, ships=${x.ships}`));
console.log(`Semester: ships=${S25.tot.ships}, bongkar=${fid(S25.tot.bk)}, muat=${fid(S25.tot.muat)}, avgBOR=${fid(S25.semAvgBor,1)}%`);
console.log('Per berth:');
BERTHS.forEach(b => console.log(`  ${b}: ships=${S25.agg[b].ships}, bk=${fid(S25.agg[b].bk)}, muat=${fid(S25.agg[b].muat)}, avgBOR=${fid(S25.agg[b].avgBor,1)}%, hours=${fid(S25.agg[b].hours,1)}`));
console.log('Cargo mix:');
Object.entries(C25.cargo).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${fid(v)} (${fid(v/C25.total*100,1)}%)`));

console.log('\n================ S1 2026 ================');
console.log('Monthly trend (avgBOR%, bongkar, ships):');
S26.monthlyTrend.forEach(x => console.log(`  ${x.m}: BOR=${fid(x.avgBor,1)}%, bk=${fid(x.bk)}, ships=${x.ships}`));
console.log(`Semester: ships=${S26.tot.ships}, bongkar=${fid(S26.tot.bk)}, muat=${fid(S26.tot.muat)}, avgBOR=${fid(S26.semAvgBor,1)}%`);
console.log('Per berth:');
BERTHS.forEach(b => console.log(`  ${b}: ships=${S26.agg[b].ships}, bk=${fid(S26.agg[b].bk)}, muat=${fid(S26.agg[b].muat)}, avgBOR=${fid(S26.agg[b].avgBor,1)}%, hours=${fid(S26.agg[b].hours,1)}`));
console.log('Cargo mix:');
Object.entries(C26.cargo).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${fid(v)} (${fid(v/C26.total*100,1)}%)`));

console.log('\n================ YOY DELTAS ================');
const dShips = (S26.tot.ships - S25.tot.ships)/S25.tot.ships*100;
const dBk = (S26.tot.bk - S25.tot.bk)/S25.tot.bk*100;
const dMuat = (S26.tot.muat - S25.tot.muat)/S25.tot.muat*100;
const dBor = S26.semAvgBor - S25.semAvgBor;
console.log(`Ships YoY: ${fid(dShips,1)}%  (${S25.tot.ships} -> ${S26.tot.ships})`);
console.log(`Bongkar YoY: ${fid(dBk,1)}%  (${fid(S25.tot.bk)} -> ${fid(S26.tot.bk)})`);
console.log(`Muat YoY: ${fid(dMuat,1)}%  (${fid(S25.tot.muat)} -> ${fid(S26.tot.muat)})`);
console.log(`Avg BOR YoY: ${fid(dBor,1)} pp  (${fid(S25.semAvgBor,1)}% -> ${fid(S26.semAvgBor,1)}%)`);

// Per-berth YoY BOR and bongkar
console.log('\nPer-berth YoY:');
BERTHS.forEach(b => {
  const db = (S26.agg[b].bk - S25.agg[b].bk)/S25.agg[b].bk*100;
  const ds = (S26.agg[b].ships - S25.agg[b].ships)/S25.agg[b].ships*100;
  console.log(`  ${b}: BOR ${fid(S25.agg[b].avgBor,1)}%->${fid(S26.agg[b].avgBor,1)}% (Δ${fid(S26.agg[b].avgBor-S25.agg[b].avgBor,1)}pp) | bk ${fid(db,1)}% | ships ${fid(ds,1)}%`);
});

// Cargo YoY
console.log('\nCargo YoY (bongkar):');
const allKeys = new Set([...Object.keys(C25.cargo), ...Object.keys(C26.cargo)]);
[...allKeys].forEach(k => {
  const a = C25.cargo[k]||0, b = C26.cargo[k]||0;
  const d = a>0 ? (b-a)/a*100 : null;
  console.log(`  ${k}: ${fid(a)} -> ${fid(b)}  (${d===null?'NEW':fid(d,1)+'%'})`);
});

// Emit as JSON for the report builder
const fs = require('fs');
function berthObj(S){
  const o = {};
  BERTHS.forEach(b => {
    o[b] = { ships:S.agg[b].ships, bk:Math.round(S.agg[b].bk), muat:Math.round(S.agg[b].muat), avgBor:+S.agg[b].avgBor.toFixed(1), hours:+S.agg[b].hours.toFixed(1) };
  });
  return o;
}
function trendArr(S){
  return S.monthlyTrend.map(x => ({ m:x.m, avgBor:+x.avgBor.toFixed(2), bk:Math.round(x.bk), ships:x.ships }));
}
function cargoObj(C){
  const o = {};
  Object.entries(C.cargo).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => { o[k] = Math.round(v); });
  return o;
}
const out = {
  months: MONTHS,
  s25: { monthlyTrend: trendArr(S25), agg: berthObj(S25), tot: {ships:S25.tot.ships,bk:Math.round(S25.tot.bk),muat:Math.round(S25.tot.muat),avgBor:+S25.semAvgBor.toFixed(1)}, cargo: cargoObj(C25) },
  s26: { monthlyTrend: trendArr(S26), agg: berthObj(S26), tot: {ships:S26.tot.ships,bk:Math.round(S26.tot.bk),muat:Math.round(S26.tot.muat),avgBor:+S26.semAvgBor.toFixed(1)}, cargo: cargoObj(C26) },
};
fs.writeFileSync('_data.json', JSON.stringify(out, null, 2));
console.log('\n=> wrote _data.json');
