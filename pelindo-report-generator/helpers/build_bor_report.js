const fs = require('fs');

// === Logos ===
const ASSETS = 'C:/Users/JIMMY GREEI GANAP/.claude/skills/ai-skill-pelindo-report/assets';
const pelindoB64 = fs.readFileSync(ASSETS + '/pelindo-logo.b64', 'utf-8').trim();
const danantaraB64 = fs.readFileSync(ASSETS + '/danantara-logo.b64', 'utf-8').trim();
if (!pelindoB64.startsWith('data:image/png;base64,')) throw new Error('pelindo b64 bad');
if (!danantaraB64.startsWith('data:image/png;base64,')) throw new Error('danantara b64 bad');

// === Verified data (from _aggregate2.js using authoritative subtotal rows) ===
const D = JSON.parse(fs.readFileSync(__dirname + '/_data.json', 'utf-8'));
const months = D.months;
const BERTHS = ['A','B','C1','C2','D'];
const s25 = D.s25, s26 = D.s26;

// Monthly arrays
const bor25 = s25.monthlyTrend.map(x => +x.avgBor.toFixed(1));
const bor26 = s26.monthlyTrend.map(x => +x.avgBor.toFixed(1));
const bk25  = s25.monthlyTrend.map(x => x.bk);
const bk26  = s26.monthlyTrend.map(x => x.bk);
const ships25 = s25.monthlyTrend.map(x => x.ships);
const ships26 = s26.monthlyTrend.map(x => x.ships);

// Semester totals
const T25 = s25.tot, T26 = s26.tot;
const dBkPct   = (T26.bk - T25.bk) / T25.bk * 100;
const dShipsPct= (T26.ships - T25.ships) / T25.ships * 100;
const dMuatPct = (T26.muat - T25.muat) / T25.muat * 100;
const dBorPp   = T26.avgBor - T25.avgBor;

// Per-berth semester arrays
const berthBor25 = BERTHS.map(b => s25.agg[b].avgBor);
const berthBor26 = BERTHS.map(b => s26.agg[b].avgBor);
const berthBk25  = BERTHS.map(b => s25.agg[b].bk);
const berthBk26  = BERTHS.map(b => s26.agg[b].bk);
const berthSh25  = BERTHS.map(b => s25.agg[b].ships);
const berthSh26  = BERTHS.map(b => s26.agg[b].ships);

// Cargo grouping (5 segments): Batubara, Baja, Gula, Gypsum, Lainnya(=Lainnya+Pulp+Rolltissue)
function cargoGroup(c){
  return {
    Batubara: c.Batubara || 0,
    Baja:     c.Baja || 0,
    Gula:     c.Gula || 0,
    Gypsum:   c.Gypsum || 0,
    Lainnya:  (c.Lainnya||0) + (c.Pulp||0) + (c.Rolltissue||0)
  };
}
// Scale grouped cargo so it sums to the authoritative subtotal bongkar total
function cargoScaled(c, total){
  const g = cargoGroup(c);
  const sum = Object.values(g).reduce((a,b)=>a+b,0);
  const scale = total / sum;
  const out = {};
  Object.entries(g).forEach(([k,v]) => out[k] = v * scale);
  return out;
}
const cargo26 = cargoScaled(s26.cargo, T26.bk);  // sums to 1,962,025
const cargo25 = cargoScaled(s25.cargo, T25.bk);  // sums to 2,237,242
const cargoOrder = ['Batubara','Baja','Gula','Gypsum','Lainnya'];

// Share shift (percentage points) for diverging bar
const sumC26 = Object.values(cargo26).reduce((a,b)=>a+b,0);
const sumC25 = Object.values(cargo25).reduce((a,b)=>a+b,0);
const cargoShift = cargoOrder.map(k => ({
  name: k,
  share25: cargo25[k]/sumC25*100,
  share26: cargo26[k]/sumC26*100,
  d: (cargo26[k]/sumC26*100) - (cargo25[k]/sumC25*100)
}));

// === helpers ===
const fid = (v, dp=0) => dp===0 ? Math.round(v).toLocaleString('id-ID') : v.toLocaleString('id-ID',{minimumFractionDigits:dp, maximumFractionDigits:dp});
const f1 = v => v.toFixed(1).replace('.',',');
const sgn = v => v>=0?'+':'−';
const jsn = JSON.stringify;

// === Vessel-type mix (from _vessel.json) ===
const V = JSON.parse(fs.readFileSync(__dirname + '/_vessel.json', 'utf-8'));
const VTYPES = ['Tongkang (BG.)','Kapal Umum (MV.)','Kapal Motor (KM.)','Lainnya'];
// Donut by VOLUME 2026 (scaled to subtotal bongkar total so center matches headline)
const vBk26Row = V.v26.bk;
const vBkSum = VTYPES.reduce((a,t)=>a+vBk26Row[t],0);
const vScale = T26.bk / vBkSum;
const vesselVol26 = VTYPES.map(t => Math.round(vBk26Row[t] * vScale));  // sums to T26.bk
const vesselCalls26 = VTYPES.map(t => V.v26.calls[t]);
const vesselCalls25 = VTYPES.map(t => V.v25.calls[t]);
// Calls by berth by type (2026) — for stacked specialization chart
const berthVesselCalls = BERTHS.map(b => VTYPES.map(t => V.byBerth26[b][t]));

// === Berth productivity (MT/ship, MT/hour, hours/ship) ===
const prod25 = BERTHS.map(b => ({
  mtShip: s25.agg[b].bk / s25.agg[b].ships,
  mtHour: s25.agg[b].bk / s25.agg[b].hours,
  hrShip: s25.agg[b].hours / s25.agg[b].ships
}));
const prod26 = BERTHS.map(b => ({
  mtShip: s26.agg[b].bk / s26.agg[b].ships,
  mtHour: s26.agg[b].bk / s26.agg[b].hours,
  hrShip: s26.agg[b].hours / s26.agg[b].ships
}));
const mtHour25 = prod25.map(p => +p.mtHour.toFixed(1));
const mtHour26 = prod26.map(p => +p.mtHour.toFixed(1));

console.log('=== VESSEL MIX 2026 ===');
VTYPES.forEach((t,i) => console.log(`  ${t}: calls=${vesselCalls26[i]} (${f1(vesselCalls26[i]/V.v26.totCalls*100)}%), vol=${fid(vesselVol26[i])} (${f1(vesselVol26[i]/T26.bk*100)}%)`));
console.log('Calls YoY:', VTYPES.map((t,i)=>`${t} ${sgn(vesselCalls26[i]-vesselCalls25[i])}${Math.abs(vesselCalls26[i]-vesselCalls25[i])}`).join(', '));
console.log('=== PRODUCTIVITY MT/jam ===');
BERTHS.forEach((b,i) => console.log(`  ${b}: ${f1(mtHour25[i])} -> ${f1(mtHour26[i])} (${sgn(mtHour26[i]-mtHour25[i])}${f1(Math.abs(mtHour26[i]-mtHour25[i]))})`));

// === helpers defined above (before vessel block) ===

// === helpers (defined above, before vessel block) ===

console.log('=== BUILD METRICS ===');
console.log(`S1 2025: ships=${T25.ships}, bk=${fid(T25.bk)}, muat=${fid(T25.muat)}, BOR=${T25.avgBor}%`);
console.log(`S1 2026: ships=${T26.ships}, bk=${fid(T26.bk)}, muat=${fid(T26.muat)}, BOR=${T26.avgBor}%`);
console.log(`YoY: ships ${f1(dShipsPct)}%, bk ${f1(dBkPct)}%, muat ${f1(dMuatPct)}%, BOR ${f1(dBorPp)} pp`);
console.log('Cargo 2026 (scaled):', Object.entries(cargo26).map(([k,v])=>`${k} ${fid(v)} (${f1(v/sumC26*100)}%)`).join(', '));
console.log('Share shift pp:', cargoShift.map(c=>`${c.name} ${sgn(c.d)}${f1(Math.abs(c.d))}`).join(', '));

// === BUILD HTML ===
let html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Perbandingan Kinerja BOR Semester 1 2025 vs 2026 — PT Pelabuhan Indonesia (Persero)</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Serif+Display&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<style>
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { background:#cbd5e8; display:flex; flex-direction:column; align-items:center; padding:40px 0 60px; font-family:'Outfit',Arial,sans-serif; -webkit-font-smoothing:antialiased; }
#toolbar { width:1400px; display:flex; justify-content:flex-end; margin-bottom:16px; }
#exportBtn { display:flex; align-items:center; gap:8px; background:linear-gradient(135deg,#0B3868,#1459A8); color:#fff; border:none; border-radius:10px; padding:12px 24px; font-family:'Outfit',Arial,sans-serif; font-size:13px; font-weight:600; cursor:pointer; box-shadow:0 4px 18px rgba(11,56,104,0.45); transition:transform .15s, box-shadow .15s; }
#exportBtn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(11,56,104,0.55); }
#exportBtn:disabled { opacity:0.55; cursor:not-allowed; transform:none; }
#progressBar { position:fixed; top:0; left:0; height:3px; width:0%; background:linear-gradient(90deg,#1459A8,#3DD6A0); z-index:9999; transition:width 0.25s ease; }
#page { width:1400px; background:#E8EEF7; overflow:hidden; font-size:13px; color:#1A2C42; line-height:1.45; box-shadow:0 8px 40px rgba(0,0,0,0.18); }

.hdr { background:linear-gradient(112deg,#061628 0%,#0B3464 44%,#1358A4 78%,#1C6CC0 100%); padding:0; position:relative; overflow:hidden; }
.hdr::before { content:''; position:absolute; right:-50px; top:-70px; width:260px; height:260px; border-radius:50%; background:rgba(255,255,255,0.05); pointer-events:none; }
.hdr::after { content:''; position:absolute; right:190px; bottom:-90px; width:180px; height:180px; border-radius:50%; background:rgba(255,255,255,0.04); pointer-events:none; }
.hdr-bar { padding:11px 44px 10px; border-bottom:1px solid rgba(255,255,255,0.13); display:flex; align-items:center; justify-content:space-between; position:relative; z-index:2; }
.hdr-bar-left { display:flex; align-items:center; gap:14px; }
.hdr-bar-right { display:flex; align-items:center; gap:8px; }
.logo-wrapper { padding:5px 8px; background:rgba(255,255,255,0.88); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); border-radius:8px; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.35); }
.logo-pelindo { height:26px; width:auto; display:block; flex-shrink:0; }
.logo-danantara { height:26px; width:auto; display:block; flex-shrink:0; }
.bar-sep { width:1px; height:24px; background:rgba(255,255,255,0.22); flex-shrink:0; }
.bar-tagline { font-size:10.5px; font-weight:400; color:rgba(255,255,255,0.52); letter-spacing:0.2px; line-height:1.35; }
.bar-tagline strong { font-weight:700; font-size:11px; color:rgba(255,255,255,0.88); display:block; }
.bar-chip { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.16); border-radius:5px; padding:3px 9px; font-size:9px; font-weight:700; color:rgba(255,255,255,0.5); letter-spacing:0.8px; text-transform:uppercase; }
.hdr-main { padding:18px 44px 20px; display:flex; align-items:center; justify-content:space-between; gap:28px; position:relative; z-index:2; }
.hdr-left { min-width:0; }
.eyebrow { font-size:9.5px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#79B8FF; margin-bottom:6px; }
.hdr-title { font-family:'DM Serif Display',Georgia,serif; font-size:33px; font-weight:400; color:#fff; line-height:1.1; white-space:nowrap; }
.hdr-title em { color:#90CAFF; font-style:normal; }
.hdr-sub { font-size:12px; color:rgba(255,255,255,0.5); margin-top:6px; }
.hdr-badges { display:flex; gap:11px; flex-shrink:0; }
.hdr-badge { background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:11px; padding:11px 18px; text-align:center; min-width:124px; }
.hdr-badge-v { font-size:18px; font-weight:700; color:#fff; line-height:1; }
.hdr-badge-l { font-size:9.5px; font-weight:500; color:rgba(255,255,255,0.46); margin-top:4px; }

.body { padding:24px 36px 32px; }
.sec { font-size:9px; font-weight:700; letter-spacing:2.8px; text-transform:uppercase; color:#8AAAC2; margin-bottom:12px; }
.insight { background:#F1F6FC; border-left:5px solid #1358A4; border-radius:10px; padding:13px 20px; margin-bottom:18px; display:flex; gap:18px; align-items:flex-start; }
.insight-t { font-size:8.5px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#1358A4; flex-shrink:0; padding-top:3px; width:96px; }
.insight-b { font-size:12.5px; color:#284058; line-height:1.62; }
.insight-b b { color:#061628; font-weight:700; }
.insight-b i { color:#C07808; font-style:normal; font-weight:600; }

.finding { background:#FFFBF3; border-left:5px solid #C07808; border-radius:10px; padding:13px 20px; margin-bottom:14px; display:flex; gap:18px; align-items:flex-start; }
.finding-t { font-size:8.5px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#C07808; flex-shrink:0; padding-top:3px; width:118px; }
.finding-b { font-size:12.5px; color:#284058; line-height:1.62; }
.finding-b b { color:#061628; font-weight:700; }
.finding-b i { color:#1358A4; font-style:normal; font-weight:600; }

.kpi-row { display:grid; gap:12px; margin-bottom:20px; }
.kpi-row.n5 { grid-template-columns:repeat(5,1fr); }
.kpi { background:#fff; border-radius:12px; padding:15px 17px 13px; border-top:3px solid #1358A4; box-shadow:0 1px 6px rgba(6,22,40,0.09); }
.kpi.gr { border-top-color:#0B8A60; } .kpi.am { border-top-color:#C07808; } .kpi.pu { border-top-color:#5135AE; } .kpi.rd { border-top-color:#BC1E1E; }
.k-lbl { font-size:9px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:#7B98B5; margin-bottom:6px; }
.k-val { font-size:23px; font-weight:700; color:#061628; line-height:1; }
.k-unit { font-size:10px; font-weight:400; color:#A0BACC; margin-left:3px; }
.k-delta { font-size:10.5px; font-weight:600; margin-top:6px; }
.cu { color:#0B8A60; } .cd { color:#BC1E1E; } .cn { color:#8AAAC2; }
.k-track { height:3px; background:#E8F0F8; border-radius:2px; margin-top:9px; }
.k-fill { height:3px; border-radius:2px; }

.row2 { display:grid; grid-template-columns:856px 1fr; gap:14px; margin-bottom:14px; }
.row-eq3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:14px; }
.row-eq2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
.row-1 { margin-bottom:14px; }
.card { background:#fff; border-radius:14px; padding:18px 20px 16px; box-shadow:0 1px 6px rgba(6,22,40,0.09); }
.card-t { font-size:13px; font-weight:600; color:#061628; margin-bottom:2px; }
.card-s { font-size:10.5px; color:#8AAAC2; margin-bottom:13px; }
.cw { position:relative; width:100%; }

.leg { display:flex; flex-wrap:wrap; gap:14px; margin-bottom:10px; }
.li { display:flex; align-items:center; gap:5px; font-size:10.5px; font-weight:500; color:#486480; }
.ls { width:10px; height:10px; border-radius:2px; flex-shrink:0; }

.t { width:100%; border-collapse:collapse; font-size:11.5px; }
.t thead th { background:#F1F6FC; color:#7B98B5; font-weight:700; font-size:9.5px; text-transform:uppercase; letter-spacing:0.5px; padding:7px 9px; text-align:left; border-bottom:1.5px solid #DCE8F4; }
.t thead th.r { text-align:right; }
.t tbody td { padding:6.5px 9px; border-bottom:1px solid #ECF2FA; color:#284058; vertical-align:middle; }
.t tbody td.r { text-align:right; }
.t tbody tr:last-child td { border-bottom:none; }
.t .tt td { background:#E8F1FB; font-weight:700; color:#061628; }
.t .hl td { background:#DCEFFE; color:#061628; }
.fw { font-weight:700; } .red { color:#BC1E1E; } .grc { color:#0A6C3E; } .bl { color:#0E4A90; }
.subgrp th { background:#DCE8F4 !important; color:#446280 !important; font-size:8.5px; text-align:center; border-bottom:1px solid #C8DAEE; }

.pb-row { display:flex; align-items:center; gap:10px; margin-bottom:9px; }
.pb-l { font-size:10.5px; color:#446280; font-weight:600; width:72px; flex-shrink:0; }
.pb-trk { flex:1; height:11px; background:#E6EEF8; border-radius:6px; overflow:hidden; position:relative; }
.pb-mid { position:absolute; left:50%; top:0; bottom:0; width:1px; background:#A8BCD4; }
.pb-fill { height:11px; border-radius:6px; position:absolute; top:0; }
.pb-v { font-size:10.5px; font-weight:700; width:78px; text-align:right; flex-shrink:0; }

.sbar { background:#061628; border-radius:12px; padding:14px 24px 16px; }
.sbar-ttl { font-size:8.5px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:#68ACEE; display:block; margin-bottom:11px; }
.sbar-list { display:grid; grid-template-columns:1fr 1fr; gap:7px 28px; }
.si { display:flex; align-items:center; gap:6px; font-size:11px; font-weight:500; color:rgba(255,255,255,0.92); }
.ok { color:#45D099; } .wn { color:#FFBB38; }
.dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.dok { background:#45D099; } .dwn { background:#FFBB38; }

.rec { border-radius:14px; overflow:hidden; box-shadow:0 3px 18px rgba(6,22,40,0.16); margin-top:14px; margin-bottom:14px; }
.rec-hdr { background:linear-gradient(112deg,#061628 0%,#0B3464 60%,#1358A4 100%); padding:16px 28px; display:flex; align-items:baseline; justify-content:space-between; position:relative; overflow:hidden; }
.rec-hdr::before { content:''; position:absolute; right:-30px; top:-40px; width:160px; height:160px; border-radius:50%; background:rgba(255,255,255,0.04); pointer-events:none; }
.rec-title { font-family:'DM Serif Display',Georgia,serif; font-size:20px; font-weight:400; color:#fff; }
.rec-sub { font-size:10px; color:rgba(255,255,255,0.42); font-style:italic; }
.rec-cols { display:grid; grid-template-columns:1fr 1fr 1fr; gap:0; }
.rec-col { padding:18px 22px; display:flex; flex-direction:column; gap:10px; }
.rc-op { background:#F6FCF9; } .rc-st { background:#F4F8FE; } .rc-rk { background:#FFFBF3; }
.rec-col-hdr { font-size:8.5px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding-bottom:10px; border-bottom:2px solid; margin-bottom:4px; }
.rc-op .rec-col-hdr { color:#0B8A60; border-bottom-color:#0B8A60; }
.rc-st .rec-col-hdr { color:#1358A4; border-bottom-color:#1358A4; }
.rc-rk .rec-col-hdr { color:#C07808; border-bottom-color:#C07808; }
.rec-card { background:#fff; border-radius:10px; padding:13px 15px; border-left:4px solid; display:flex; flex-direction:column; gap:5px; box-shadow:0 1px 4px rgba(6,22,40,0.07); }
.rc-op .rec-card { border-left-color:#0B8A60; } .rc-st .rec-card { border-left-color:#1358A4; } .rc-rk .rec-card { border-left-color:#C07808; }
.rec-h { font-size:12px; font-weight:700; color:#061628; line-height:1.35; }
.rec-p { font-size:10.5px; color:#446280; line-height:1.52; }
.rec-when { display:inline-block; font-size:8px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:3px 9px; border-radius:99px; margin-top:4px; align-self:flex-start; }
.rc-op .rec-when { background:#D9F5E8; color:#0A6C3E; }
.rc-st .rec-when { background:#D9EFFE; color:#094E9E; }
.rc-rk .rec-when { background:#FEF0D8; color:#985200; }

.ftr { background:#061628; padding:10px 36px; display:flex; justify-content:space-between; align-items:center; }
.ftr span { font-size:9.5px; color:rgba(255,255,255,0.3); }
</style>
</head>
<body>
<div id="progressBar"></div>
<div id="toolbar">
  <button id="exportBtn" onclick="doExport()">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    Export High Quality PNG
  </button>
</div>

<div id="page">
  <!-- HEADER -->
  <div class="hdr">
    <div class="hdr-bar">
      <div class="hdr-bar-left">
        <div class="logo-wrapper"><img class="logo-pelindo" src="${pelindoB64}" alt="Pelindo"></div>
        <div class="bar-sep"></div>
        <div class="logo-wrapper"><img class="logo-danantara" src="${danantaraB64}" alt="Danantara Indonesia"></div>
        <div class="bar-sep"></div>
        <div class="bar-tagline">
          <strong>PT Pelabuhan Indonesia (Persero)</strong>
          Regional 2 Banten
        </div>
      </div>
      <div class="hdr-bar-right">
        <span class="bar-chip">Dokumen Internal</span>
        <span class="bar-chip">Executive Summary</span>
      </div>
    </div>
    <div class="hdr-main">
      <div class="hdr-left">
        <div class="eyebrow">Komparasi YoY &middot; Semester 1 2025 vs 2026</div>
        <div class="hdr-title">Perbandingan Kinerja <em>BOR Semester 1</em> 2025 vs 2026</div>
        <div class="hdr-sub">Analisis Berth Occupation Ratio, throughput &amp; 5 dermaga &mdash; Jan&ndash;Jun 2025 vs 2026</div>
      </div>
      <div class="hdr-badges">
        <div class="hdr-badge"><div class="hdr-badge-v">${sgn(dBkPct)}${f1(Math.abs(dBkPct))}%</div><div class="hdr-badge-l">&Delta; Bongkar YoY</div></div>
        <div class="hdr-badge"><div class="hdr-badge-v">${sgn(dShipsPct)}${f1(Math.abs(dShipsPct))}%</div><div class="hdr-badge-l">&Delta; Kunjungan YoY</div></div>
        <div class="hdr-badge"><div class="hdr-badge-v">${f1(T26.avgBor)}%</div><div class="hdr-badge-l">Avg BOR S1 2026</div></div>
        <div class="hdr-badge"><div class="hdr-badge-v">1,96 jt</div><div class="hdr-badge-l">Bongkar MT S1 2026</div></div>
      </div>
    </div>
  </div>

  <div class="body">
    <!-- INSIGHT BAND -->
    <div class="insight">
      <div class="insight-t">Ringkasan Eksekutif</div>
      <div class="insight-b">
        Performa Semester 1 2026 melemah dari periode sama 2025: kunjungan kapal <b>${sgn(dShipsPct)}${f1(Math.abs(dShipsPct))}%</b> (${T25.ships}&rarr;${T26.ships}) dan bongkar <b>${sgn(dBkPct)}${f1(Math.abs(dBkPct))}%</b> (2,24&rarr;1,96 jt MT). Avg BOR turun <b>${f1(Math.abs(dBorPp))} pp</b> ke <b>${f1(T26.avgBor)}%</b> &mdash; tekanan kongesti berkurang, namun <b>Dermaga C1 tetap kritis di ${f1(s26.agg.C1.avgBor)}%</b>. Penurunan volume didorong <b>Batubara (share 69%&rarr;49%)</b>, sementara <b>Baja &amp; Gula tumbuh</b> mengisi kekosongan. <i>Dermaga D paling sehat: BOR 131%&rarr;72% dengan throughput tertinggi 912 rb MT.</i>
      </div>
    </div>

    <div class="sec">Indikator Kinerja Utama &mdash; Semester 1</div>
    <!-- KPI STRIP n5 -->
    <div class="kpi-row n5">
      <div class="kpi rd">
        <div class="k-lbl">Kunjungan Kapal 2026</div>
        <div class="k-val">${fid(T26.ships)}<span class="k-unit">kapal</span></div>
        <div class="k-delta cd">&darr; ${sgn(dShipsPct)}${f1(Math.abs(dShipsPct))}% vs ${fid(T25.ships)} (2025)</div>
        <div class="k-track"><div class="k-fill" style="width:${(T26.ships/T25.ships*100).toFixed(1)}%;background:#BC1E1E"></div></div>
      </div>
      <div class="kpi rd">
        <div class="k-lbl">Bongkar 2026</div>
        <div class="k-val">1,96<span class="k-unit">jt MT</span></div>
        <div class="k-delta cd">&darr; ${sgn(dBkPct)}${f1(Math.abs(dBkPct))}% vs 2,24 jt MT (2025)</div>
        <div class="k-track"><div class="k-fill" style="width:${(T26.bk/T25.bk*100).toFixed(1)}%;background:#BC1E1E"></div></div>
      </div>
      <div class="kpi am">
        <div class="k-lbl">Avg BOR 2026</div>
        <div class="k-val">${f1(T26.avgBor)}<span class="k-unit">%</span></div>
        <div class="k-delta cn">${sgn(dBorPp)}${f1(Math.abs(dBorPp))} pp vs ${f1(T25.avgBor)}% (2025)</div>
        <div class="k-track"><div class="k-fill" style="width:${T26.avgBor}%;background:#C07808"></div></div>
      </div>
      <div class="kpi rd">
        <div class="k-lbl">Muat 2026</div>
        <div class="k-val">${fid(T26.muat)}<span class="k-unit">MT</span></div>
        <div class="k-delta cd">&darr; ${sgn(dMuatPct)}${f1(Math.abs(dMuatPct))}% vs ${fid(T25.muat)} (2025)</div>
        <div class="k-track"><div class="k-fill" style="width:${(T26.muat/T25.muat*100).toFixed(1)}%;background:#BC1E1E"></div></div>
      </div>
      <div class="kpi rd">
        <div class="k-lbl">BOR Dermaga C1 2026</div>
        <div class="k-val">${f1(s26.agg.C1.avgBor)}<span class="k-unit">%</span></div>
        <div class="k-delta cd">Kronis &gt;100% &mdash; vs ${f1(s25.agg.C1.avgBor)}% (2025)</div>
        <div class="k-track"><div class="k-fill" style="width:100%;background:#BC1E1E"></div></div>
      </div>
    </div>

    <!-- ROW 1 : Lead BOR monthly + Cargo donut -->
    <div class="row2">
      <div class="card">
        <div class="card-t">Tren BOR Bulanan &mdash; S1 2025 vs S1 2026</div>
        <div class="card-s">BOR anjlok di Jan 2026 (128%&rarr;88%); Feb 2026 satu-satunya bulan yang melebihi 100% atas beban C1/C2</div>
        <div class="leg">
          <div class="li"><span class="ls" style="background:#B6D2F0"></span>S1 2025</div>
          <div class="li"><span class="ls" style="background:#1E62C4"></span>S1 2026</div>
        </div>
        <div class="cw" style="height:300px"><canvas id="chBorMonth"></canvas></div>
      </div>
      <div class="card">
        <div class="card-t">Komposisi Komoditi Bongkar &mdash; S1 2026</div>
        <div class="card-s">Batubara masih #1 namun share turun ke 49% (dari 69% di 2025) &mdash; mix kargo kian terdiversifikasi</div>
        <div class="cw" style="height:300px"><canvas id="chCargo"></canvas></div>
      </div>
    </div>

    <!-- ROW 2 : Bongkar monthly + BOR by berth + Cargo share shift -->
    <div class="row-eq3">
      <div class="card">
        <div class="card-t">Throughput Bongkar Bulanan</div>
        <div class="card-s">Penurunan terdalam di Feb 2026; Apr &amp; Mei 2026 satu-satunya bulan tumbuh YoY</div>
        <div class="leg">
          <div class="li"><span class="ls" style="background:#B6D2F0"></span>S1 2025</div>
          <div class="li"><span class="ls" style="background:#1E62C4"></span>S1 2026</div>
        </div>
        <div class="cw" style="height:260px"><canvas id="chBkMonth"></canvas></div>
      </div>
      <div class="card">
        <div class="card-t">BOR per Dermaga &mdash; S1 2025 vs 2026</div>
        <div class="card-s">Dermaga D paling membaik (131%&rarr;72%); C1 tetap kronik di 134,5%</div>
        <div class="leg">
          <div class="li"><span class="ls" style="background:#B6D2F0"></span>S1 2025</div>
          <div class="li"><span class="ls" style="background:#1E62C4"></span>S1 2026</div>
        </div>
        <div class="cw" style="height:260px"><canvas id="chBorBerth"></canvas></div>
      </div>
      <div class="card">
        <div class="card-t">Pergeseran Share Komoditi YoY</div>
        <div class="card-s">Batubara kehilangan 20 pp share &mdash; redistribusi ke Gula (+9 pp), Baja (+7 pp) &amp; Gypsum (+4 pp)</div>
        <div style="margin-top:4px">
`;
// Cargo shift diverging progress bars (share pp)
const maxAbsShift = Math.max(...cargoShift.map(c => Math.abs(c.d)));
cargoShift.forEach(c => {
  const w = (Math.abs(c.d) / maxAbsShift * 50);
  const isNeg = c.d < 0;
  const fillLeft = isNeg ? (50 - w) : 50;
  const color = isNeg ? '#BC1E1E' : '#0B8A60';
  const dColor = isNeg ? '#BC1E1E' : '#0A6C3E';
  html += `          <div class="pb-row"><div class="pb-l">${c.name}</div><div class="pb-trk"><div class="pb-mid"></div><div class="pb-fill" style="left:${fillLeft}%;width:${w}%;background:${color}"></div></div><div class="pb-v" style="color:${dColor}">${sgn(c.d)}${f1(Math.abs(c.d))} pp</div></div>\n`;
});
html += `          <div style="font-size:9px;color:#9EBACE;margin-top:6px;text-align:right">Batang kiri = share turun &middot; kanan = share naik &middot; basis % terhadap total bongkar S1</div>
        </div>
      </div>
    </div>

    <!-- ROW 3 : Full YoY detail table -->
    <div class="row-1">
      <div class="card">
        <div class="card-t">Detail Perbandingan per Dermaga &mdash; Semester 1</div>
        <div class="card-s">Dermaga D penyangga throughput tertinggi (912 rb MT) dengan utilisasi turun setengah; A satu-satunya dermaga dengan trafik kapal naik</div>
        <table class="t">
          <thead>
            <tr class="subgrp"><th colspan="1"></th><th colspan="3" style="text-align:center">BOR (%)</th><th colspan="3" style="text-align:center">Kunjungan Kapal</th><th colspan="3" style="text-align:center">Bongkar (MT)</th></tr>
            <tr>
              <th>Dermaga</th>
              <th class="r">S1 2025</th><th class="r">S1 2026</th><th class="r">&Delta; pp</th>
              <th class="r">2025</th><th class="r">2026</th><th class="r">&Delta;</th>
              <th class="r">2025</th><th class="r">2026</th><th class="r">&Delta; %</th>
            </tr>
          </thead>
          <tbody>
`;
BERTHS.forEach((b, i) => {
  const dBor = berthBor26[i] - berthBor25[i];
  const dShips = berthSh26[i] - berthSh25[i];
  const dBkP = (berthBk26[i] - berthBk25[i]) / berthBk25[i] * 100;
  const borCls = berthBor26[i] > 100 ? 'red' : (berthBor26[i] >= 80 ? 'bl' : '');
  html += `            <tr>
              <td class="fw">Dermaga ${b}</td>
              <td class="r">${f1(berthBor25[i])}</td>
              <td class="r fw ${borCls}">${f1(berthBor26[i])}</td>
              <td class="r ${dBor<0?'grc':'red'}">${sgn(dBor)}${f1(Math.abs(dBor))}</td>
              <td class="r">${berthSh25[i]}</td>
              <td class="r">${berthSh26[i]}</td>
              <td class="r ${dShips<0?'red':'grc'}">${sgn(dShips)}${Math.abs(dShips)}</td>
              <td class="r">${fid(berthBk25[i])}</td>
              <td class="r">${fid(berthBk26[i])}</td>
              <td class="r ${dBkP<0?'red':'grc'}">${sgn(dBkP)}${f1(Math.abs(dBkP))}%</td>
            </tr>\n`;
});
const dTotBor = T26.avgBor - T25.avgBor;
const dTotShips = T26.ships - T25.ships;
const dTotBkP = (T26.bk - T25.bk) / T25.bk * 100;
html += `            <tr class="tt">
              <td>Konsolidasi</td>
              <td class="r">${f1(T25.avgBor)}</td>
              <td class="r">${f1(T26.avgBor)}</td>
              <td class="r ${dTotBor<0?'grc':'red'}">${sgn(dTotBor)}${f1(Math.abs(dTotBor))}</td>
              <td class="r">${T25.ships}</td>
              <td class="r">${T26.ships}</td>
              <td class="r ${dTotShips<0?'red':'grc'}">${sgn(dTotShips)}${Math.abs(dTotShips)}</td>
              <td class="r">${fid(T25.bk)}</td>
              <td class="r">${fid(T26.bk)}</td>
              <td class="r ${dTotBkP<0?'red':'grc'}">${sgn(dTotBkP)}${f1(Math.abs(dTotBkP))}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===== NEW SECTION: Productivity & Vessel Mix ===== -->
    <div class="finding">
      <div class="finding-t">Diagnostik Produktivitas</div>
      <div class="finding-b">
        Kongesti C1 bukan akibat tingginya volume efisien &mdash; produktivitas C1 <b> turun 89&rarr;71 MT/jam</b> meski BOR tetap 134,5%. Sebaliknya Dermaga D <b>2&times; lebih produktif</b> (154&rarr;283 MT/jam) karena melayani <b>kapal umum (MV) eksklusif</b>. Trafik tongkang batubara anjlok <b>&minus;64 kunjungan</b> (178&rarr;114) sementara kapal umum naik <b>+25 (53&rarr;78)</b> &mdash; <i>tepat mencerminkan pergeseran batubara ke baja, gula &amp; gypsum.</i>
      </div>
    </div>

    <div class="sec">Analisis Produktivitas &amp; Mix Kapal &mdash; Semester 1</div>

    <!-- ROW 4 : Productivity MT/hr (wide) + Vessel mix donut -->
    <div class="row2">
      <div class="card">
        <div class="card-t">Produktivitas Bongkar per Jam &mdash; S1 2025 vs 2026</div>
        <div class="card-s">Seluruh dermaga batubara (B/C1/C2) produktivitasnya turun; D melonjak 2&times; (154&rarr;283 MT/jam) &mdash; gap efisiensi antar dermaga melebar dramatis</div>
        <div class="leg">
          <div class="li"><span class="ls" style="background:#B6D2F0"></span>S1 2025</div>
          <div class="li"><span class="ls" style="background:#1E62C4"></span>S1 2026</div>
        </div>
        <div class="cw" style="height:300px"><canvas id="chProd"></canvas></div>
      </div>
      <div class="card">
        <div class="card-t">Mix Volume per Jenis Kapal &mdash; S1 2026</div>
        <div class="card-s">Tongkang &amp; kapal umum kini nyaris 50/50 by volume &mdash; dari dominasi tongkang 67% di 2025</div>
        <div class="cw" style="height:300px"><canvas id="chMixVessel"></canvas></div>
      </div>
    </div>

    <!-- ROW 5 : Berth specialization + productivity table -->
    <div class="row-eq2">
      <div class="card">
        <div class="card-t">Spesialisasi Dermaga per Jenis Kapal &mdash; S1 2026</div>
        <div class="card-s">B/C1/C2 murni melayani tongkang batubara (90&ndash;100%); A &amp; D eksklusif kapal umum &mdash; pemisahan tajam</div>
        <div class="leg">
          <div class="li"><span class="ls" style="background:#1358A4"></span>Tongkang (BG.)</div>
          <div class="li"><span class="ls" style="background:#0B8A60"></span>Kapal Umum (MV.)</div>
          <div class="li"><span class="ls" style="background:#A8BCD4"></span>KM/Lainnya</div>
        </div>
        <div class="cw" style="height:250px"><canvas id="chBerthSpec"></canvas></div>
      </div>
      <div class="card">
        <div class="card-t">Produktivitas per Dermaga &mdash; MT/Kapal &amp; MT/Jam</div>
        <div class="card-s">D menangani 41 rb MT/kapal (4&times; rata-rata lain); A paling tidak efisien &mdash; banyak kapal kecil, throughput rendah</div>
        <table class="t" style="margin-top:4px">
          <thead>
            <tr>
              <th>Dermaga</th>
              <th class="r">MT/Kapal</th>
              <th class="r">MT/Jam</th>
              <th class="r">Jam/Kapal</th>
              <th class="r">&Delta; MT/Jam</th>
            </tr>
          </thead>
          <tbody>
`;
BERTHS.forEach((b, i) => {
  const dHr = mtHour26[i] - mtHour25[i];
  const cls = mtHour26[i] > 150 ? 'bl' : (mtHour26[i] < 60 ? 'red' : '');
  html += `            <tr>
              <td class="fw">Dermaga ${b}</td>
              <td class="r">${fid(prod26[i].mtShip)}</td>
              <td class="r fw ${cls}">${f1(prod26[i].mtHour)}</td>
              <td class="r">${f1(prod26[i].hrShip)}</td>
              <td class="r ${dHr<0?'red':'grc'}">${sgn(dHr)}${f1(Math.abs(dHr))}</td>
            </tr>\n`;
});
// Konsolidasi row
const totBk26 = T26.bk, totHr26 = BERTHS.reduce((a,b)=>a+s26.agg[b].hours,0), totSh26 = T26.ships;
const totBk25 = T25.bk, totHr25 = BERTHS.reduce((a,b)=>a+s25.agg[b].hours,0), totSh25 = T25.ships;
const cMtShip = totBk26/totSh26, cMtHr = totBk26/totHr26, cHrShip = totHr26/totSh26;
const cMtHr25 = totBk25/totHr25;
const dCons = cMtHr - cMtHr25;
html += `            <tr class="tt">
              <td>Konsolidasi</td>
              <td class="r">${fid(cMtShip)}</td>
              <td class="r">${f1(cMtHr)}</td>
              <td class="r">${f1(cHrShip)}</td>
              <td class="r ${dCons<0?'red':'grc'}">${sgn(dCons)}${f1(Math.abs(dCons))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===== END NEW SECTION ===== -->

    <div class="sbar">
      <span class="sbar-ttl">Key Takeaways</span>
      <div class="sbar-list">
        <div class="si wn"><span class="dot dwn"></span>Bongkar turun ${sgn(dBkPct)}${f1(Math.abs(dBkPct))}% YoY (&minus;${fid(T25.bk-T26.bk)} MT) didorong Batubara (share 69%&rarr;49%)</div>
        <div class="si wn"><span class="dot dwn"></span>Kunjungan kapal turun ${sgn(dShipsPct)}${f1(Math.abs(dShipsPct))}% (${T25.ships}&rarr;${T26.ships}); hanya Dermaga A yang naik (+${berthSh26[0]-berthSh25[0]})</div>
        <div class="si ok"><span class="dot dok"></span>Avg BOR turun ${f1(Math.abs(dBorPp))} pp ke ${f1(T26.avgBor)}% &mdash; tekanan kongesti berkurang</div>
        <div class="si wn"><span class="dot dwn"></span>Dermaga C1 tetap kritis ${f1(s26.agg.C1.avgBor)}% (vs ${f1(s25.agg.C1.avgBor)}% 2025) &mdash; butuh redistribusi beban</div>
        <div class="si ok"><span class="dot dok"></span>Dermaga D paling sehat: BOR ${f1(s25.agg.D.avgBor)}%&rarr;${f1(s26.agg.D.avgBor)}% dengan throughput tertinggi ${fid(berthBk26[4]/1000)} rb MT</div>
      </div>
    </div>

    <!-- RECOMMENDATIONS -->
    <div class="rec">
      <div class="rec-hdr">
        <span class="rec-title">Rekomendasi &amp; Tindak Lanjut</span>
        <span class="rec-sub">Berdasarkan analisis data laporan ini</span>
      </div>
      <div class="rec-cols">
        <div class="rec-col rc-op">
          <div class="rec-col-hdr">Operasional</div>
          <div class="rec-card">
            <div class="rec-h">Redistribusi beban dari C1 ke Dermaga D yang idle</div>
            <div class="rec-p">C1 BOR ${f1(s26.agg.C1.avgBor)}% (kritis) sementara D hanya ${f1(s26.agg.D.avgBor)}% dengan kapasitas throughput terbukti ${fid(berthBk26[4]/1000)} rb MT. Evaluasi penempatan kapal batubara ke D untuk meredam kongesti C1.</div>
            <span class="rec-when">Jangka Pendek</span>
          </div>
          <div class="rec-card">
            <div class="rec-h">Replikasi momentum Apr&ndash;Mei 2026 yang tumbuh YoY</div>
            <div class="rec-p">Apr (346 rb vs 257 rb MT) &amp; Mei 2026 (323 rb vs 293 rb MT) satu-satunya bulan tumbuh. Identifikasi driver (kenaikan Baja +27% &amp; Gula +178%) dan tiru praktik operasionalnya.</div>
            <span class="rec-when">Segera</span>
          </div>
        </div>
        <div class="rec-col rc-st">
          <div class="rec-col-hdr">Strategis</div>
          <div class="rec-card">
            <div class="rec-h">Akselerasi diversifikasi komoditi pengganti batubara</div>
            <div class="rec-p">Share batubara menyusut 20 pp (69%&rarr;49%) dan volume turun ~38%. Pertumbuhan Gula (+9 pp), Baja (+7 pp) &amp; Gypsum (+4 pp) menunjukkan arah diversifikasi &mdash; percepat akuisisi kargo ini untuk menyangga volatilitas batubara.</div>
            <span class="rec-when">Jangka Menengah</span>
          </div>
        </div>
        <div class="rec-col rc-rk">
          <div class="rec-col-hdr">Risiko</div>
          <div class="rec-card">
            <div class="rec-h">Validasi penyebab penurunan batubara ~38%</div>
            <div class="rec-p">Batubara menyumbang hampir seluruh penurunan bongkar YoY. Investigasi apakah tren struktural (kebijakan energi/kontraksi PLTU), kontrak berakhir, atau pergeseran ke pelabuhan lain &mdash; sebelum menyusun RKAP 2027.</div>
            <span class="rec-when">Validasi</span>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="ftr">
    <span>Perbandingan Kinerja BOR Semester 1 2025 vs 2026 &mdash; PT Pelabuhan Indonesia (Persero)</span>
    <span>Disiapkan: Juli 2026 &middot; BOR dalam % &middot; Bongkar/Muat dalam MT</span>
  </div>
</div>

<script>
Chart.register(ChartDataLabels);
Chart.defaults.font.family = "'Outfit',Arial,sans-serif";
Chart.defaults.devicePixelRatio = window.devicePixelRatio * 2;
Chart.defaults.plugins.datalabels = { display:false };

const idID = (v, dp=0) => dp===0 ? Math.round(v).toLocaleString('id-ID') : v.toLocaleString('id-ID',{minimumFractionDigits:dp, maximumFractionDigits:dp});
const xTick = { maxRotation:0, minRotation:0, font:{size:9, family:"'Outfit',Arial,sans-serif"}, color:'#7B98B5', autoSkip:false };

// === CHART 1: BOR Monthly grouped bar ===
new Chart(document.getElementById('chBorMonth'), {
  type:'bar',
  data:{
    labels:[['Jan',''],['Feb',''],['Mar',''],['Apr',''],['Mei',''],['Jun','']],
    datasets:[
      { label:'S1 2025', data:${jsn(bor25)},
        backgroundColor:'#B6D2F0', borderRadius:5, borderSkipped:false, barPercentage:0.36, categoryPercentage:0.88,
        datalabels:{ display:true, align:'top', anchor:'end', offset:2, color:'#446280', font:{weight:700,size:9.5}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3},
          formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1})+'%' } },
      { label:'S1 2026', data:${jsn(bor26)},
        backgroundColor:'#1E62C4', borderRadius:5, borderSkipped:false, barPercentage:0.36, categoryPercentage:0.88,
        datalabels:{ display:true, align:'top', anchor:'end', offset:2, color:'#061628', font:{weight:700,size:9.5}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3},
          formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1})+'%' } }
    ]
  },
  options:{
    maintainAspectRatio:false, responsive:true,
    scales:{
      x:{ ticks:xTick, grid:{display:false} },
      y:{ min:0, max:160, ticks:{ font:{size:9}, color:'#7B98B5', callback:v=>v+'%' }, grid:{ color:'#EEF3FA' } }
    },
    plugins:{
      legend:{ display:false },
      tooltip:{ callbacks:{ label:c=> ' '+c.dataset.label+': '+c.parsed.y.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1})+'%' } }
    }
  }
});

// === CHART 2: Cargo donut 2026 (scaled to subtotal total) ===
new Chart(document.getElementById('chCargo'), {
  type:'doughnut',
  data:{
    labels:${jsn(cargoOrder)},
    datasets:[{
      data:${jsn(cargoOrder.map(k => Math.round(cargo26[k])))},
      backgroundColor:['#1358A4','#0B8A60','#2478D8','#5135AE','#A8BCD4'],
      borderWidth:3, borderColor:'#fff', hoverOffset:10,
      datalabels:{ display:true, color:'#fff', font:{weight:700,size:11}, textAlign:'center',
        formatter:(v,ctx)=>{ const t=ctx.dataset.data.reduce((a,b)=>a+b,0); const pct=v/t*100; return pct<3?'':Math.round(pct)+'%'; } }
    }]
  },
  options:{
    maintainAspectRatio:false, responsive:true, cutout:'62%',
    plugins:{
      legend:{ display:false },
      tooltip:{ callbacks:{ label:c=>{ const t=c.dataset.data.reduce((a,b)=>a+b,0); return ' '+c.label+': '+c.parsed.toLocaleString('id-ID')+' MT ('+(c.parsed/t*100).toFixed(1)+'%)'; } } }
    }
  },
  plugins:[{ id:'cl', afterDraw(chart){
    const {ctx, chartArea:{left,top,right,bottom}} = chart;
    const cx=(left+right)/2, cy=(top+bottom)/2;
    ctx.save(); ctx.textAlign='center';
    ctx.fillStyle='#9AB4CC'; ctx.font='400 10.5px Outfit,Arial,sans-serif';
    ctx.fillText('Total Bongkar', cx, cy-12);
    ctx.fillStyle='#061628'; ctx.font='700 19px Outfit,Arial,sans-serif';
    ctx.fillText('1,96 jt MT', cx, cy+9);
    ctx.fillStyle='#7B98B5'; ctx.font='400 9px Outfit,Arial,sans-serif';
    ctx.fillText('S1 2026', cx, cy+26);
    ctx.restore();
  }}]
});

// === CHART 3: Bongkar monthly grouped bar ===
new Chart(document.getElementById('chBkMonth'), {
  type:'bar',
  data:{
    labels:[['Jan',''],['Feb',''],['Mar',''],['Apr',''],['Mei',''],['Jun','']],
    datasets:[
      { label:'S1 2025', data:${jsn(bk25)},
        backgroundColor:'#B6D2F0', borderRadius:5, borderSkipped:false, barPercentage:0.36, categoryPercentage:0.88,
        datalabels:{ display:true, align:'top', anchor:'end', offset:2, color:'#446280', font:{weight:700,size:9}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3},
          formatter:v=>Math.round(v/1000)+' rb' } },
      { label:'S1 2026', data:${jsn(bk26)},
        backgroundColor:'#1E62C4', borderRadius:5, borderSkipped:false, barPercentage:0.36, categoryPercentage:0.88,
        datalabels:{ display:true, align:'top', anchor:'end', offset:2, color:'#061628', font:{weight:700,size:9}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3},
          formatter:v=>Math.round(v/1000)+' rb' } }
    ]
  },
  options:{
    maintainAspectRatio:false, responsive:true,
    scales:{
      x:{ ticks:xTick, grid:{display:false} },
      y:{ min:0, max:540000, ticks:{ font:{size:9}, color:'#7B98B5', callback:v=>(v/1000)+' rb', maxTicksLimit:6 }, grid:{ color:'#EEF3FA' } }
    },
    plugins:{
      legend:{ display:false },
      tooltip:{ callbacks:{ label:c=>' '+c.dataset.label+': '+c.parsed.y.toLocaleString('id-ID')+' MT' } }
    }
  }
});

// === CHART 4: BOR by berth horizontal grouped bar ===
new Chart(document.getElementById('chBorBerth'), {
  type:'bar',
  data:{
    labels:${jsn(BERTHS.map(b=>'Dermaga '+b))},
    datasets:[
      { label:'S1 2025', data:${jsn(berthBor25)},
        backgroundColor:'#B6D2F0', borderRadius:5, borderSkipped:false, barPercentage:0.36, categoryPercentage:0.88,
        datalabels:{ display:true, align:'right', anchor:'end', offset:3, color:'#446280', font:{weight:700,size:9}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3},
          formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1})+'%' } },
      { label:'S1 2026', data:${jsn(berthBor26)},
        backgroundColor:'#1E62C4', borderRadius:5, borderSkipped:false, barPercentage:0.36, categoryPercentage:0.88,
        datalabels:{ display:true, align:'right', anchor:'end', offset:3, color:'#061628', font:{weight:700,size:9}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3},
          formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1})+'%' } }
    ]
  },
  options:{
    indexAxis:'y', maintainAspectRatio:false, responsive:true,
    scales:{
      y:{ ticks:{ font:{size:10}, color:'#446280' }, grid:{display:false} },
      x:{ min:0, max:170, ticks:{ font:{size:9}, color:'#7B98B5', callback:v=>v+'%' }, grid:{ color:'#EEF3FA' } }
    },
    plugins:{
      legend:{ display:false },
      tooltip:{ callbacks:{ label:c=>' '+c.dataset.label+': '+c.parsed.x.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1})+'%' } }
    }
  }
});

// === CHART 5: Productivity MT/hour by berth (grouped bar 2025 vs 2026) ===
new Chart(document.getElementById('chProd'), {
  type:'bar',
  data:{
    labels:${jsn(BERTHS.map(b=>'Dermaga '+b))},
    datasets:[
      { label:'S1 2025', data:${jsn(mtHour25)},
        backgroundColor:'#B6D2F0', borderRadius:5, borderSkipped:false, barPercentage:0.36, categoryPercentage:0.88,
        datalabels:{ display:true, align:'top', anchor:'end', offset:2, color:'#446280', font:{weight:700,size:9.5}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3},
          formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:0,maximumFractionDigits:0}) } },
      { label:'S1 2026', data:${jsn(mtHour26)},
        backgroundColor:'#1E62C4', borderRadius:5, borderSkipped:false, barPercentage:0.36, categoryPercentage:0.88,
        datalabels:{ display:true, align:'top', anchor:'end', offset:2, color:'#061628', font:{weight:700,size:9.5}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3},
          formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:0,maximumFractionDigits:0}) } }
    ]
  },
  options:{
    maintainAspectRatio:false, responsive:true,
    scales:{
      x:{ ticks:{ font:{size:10}, color:'#446280' }, grid:{display:false} },
      y:{ min:0, max:320, ticks:{ font:{size:9}, color:'#7B98B5', callback:v=>v+' MT/jam', maxTicksLimit:7 }, grid:{ color:'#EEF3FA' }, title:{ display:true, text:'MT per jam alongside', color:'#7B98B5', font:{size:9.5,weight:600} } }
    },
    plugins:{
      legend:{ display:false },
      tooltip:{ callbacks:{ label:c=>' '+c.dataset.label+': '+c.parsed.y.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1})+' MT/jam' } }
    }
  }
});

// === CHART 6: Vessel mix donut by VOLUME 2026 ===
new Chart(document.getElementById('chMixVessel'), {
  type:'doughnut',
  data:{
    labels:${jsn(VTYPES)},
    datasets:[{
      data:${jsn(vesselVol26)},
      backgroundColor:['#1358A4','#0B8A60','#5888D4','#A8BCD4'],
      borderWidth:3, borderColor:'#fff', hoverOffset:10,
      datalabels:{ display:true, color:'#fff', font:{weight:700,size:11}, textAlign:'center',
        formatter:(v,ctx)=>{ const t=ctx.dataset.data.reduce((a,b)=>a+b,0); const pct=v/t*100; return pct<3?'':Math.round(pct)+'%'; } }
    }]
  },
  options:{
    maintainAspectRatio:false, responsive:true, cutout:'62%',
    plugins:{
      legend:{ display:false },
      tooltip:{ callbacks:{ label:c=>{ const t=c.dataset.data.reduce((a,b)=>a+b,0); return ' '+c.label+': '+c.parsed.toLocaleString('id-ID')+' MT ('+(c.parsed/t*100).toFixed(1)+'%)'; } } }
    }
  },
  plugins:[{ id:'clv', afterDraw(chart){
    const {ctx, chartArea:{left,top,right,bottom}} = chart;
    const cx=(left+right)/2, cy=(top+bottom)/2;
    ctx.save(); ctx.textAlign='center';
    ctx.fillStyle='#9AB4CC'; ctx.font='400 10.5px Outfit,Arial,sans-serif';
    ctx.fillText('Volume S1 2026', cx, cy-12);
    ctx.fillStyle='#061628'; ctx.font='700 19px Outfit,Arial,sans-serif';
    ctx.fillText('1,96 jt MT', cx, cy+9);
    ctx.fillStyle='#7B98B5'; ctx.font='400 9px Outfit,Arial,sans-serif';
    ctx.fillText('Tongkang vs Umum', cx, cy+26);
    ctx.restore();
  }}]
});

// === CHART 7: Berth specialization — stacked calls by vessel type (2026) ===
new Chart(document.getElementById('chBerthSpec'), {
  type:'bar',
  data:{
    labels:${jsn(BERTHS.map(b=>'Dermaga '+b))},
    datasets:[
      { label:'Tongkang (BG.)', data:${jsn(berthVesselCalls.map(x=>x[0]))}, backgroundColor:'#1358A4', borderRadius:3, borderSkipped:false, barPercentage:0.62, categoryPercentage:0.88,
        datalabels:{ display:true, color:'#fff', font:{weight:700,size:10}, anchor:'center', align:'center', formatter:(v)=>v||'' } },
      { label:'Kapal Umum (MV.)', data:${jsn(berthVesselCalls.map(x=>x[1]))}, backgroundColor:'#0B8A60', borderRadius:3, borderSkipped:false, barPercentage:0.62, categoryPercentage:0.88,
        datalabels:{ display:true, color:'#fff', font:{weight:700,size:10}, anchor:'center', align:'center', formatter:(v)=>v||'' } },
      { label:'KM/Lainnya', data:${jsn(berthVesselCalls.map(x=>x[2]+x[3]))}, backgroundColor:'#A8BCD4', borderRadius:3, borderSkipped:false, barPercentage:0.62, categoryPercentage:0.88,
        datalabels:{ display:true, color:'#061628', font:{weight:700,size:10}, anchor:'center', align:'center', formatter:(v)=>v||'' } }
    ]
  },
  options:{
    maintainAspectRatio:false, responsive:true,
    scales:{
      x:{ stacked:true, ticks:{ font:{size:10}, color:'#446280' }, grid:{display:false} },
      y:{ stacked:true, min:0, ticks:{ font:{size:9}, color:'#7B98B5', maxTicksLimit:6 }, grid:{ color:'#EEF3FA' }, title:{ display:true, text:'Jumlah kunjungan kapal S1 2026', color:'#7B98B5', font:{size:9.5,weight:600} } }
    },
    plugins:{
      legend:{ display:false },
      tooltip:{ callbacks:{ label:c=>' '+c.dataset.label+': '+c.parsed.y+' kunjungan' } }
    }
  }
});

async function doExport() {
  const btn = document.getElementById('exportBtn');
  const bar = document.getElementById('progressBar');
  btn.disabled = true; btn.textContent = 'Generating…';
  let p = 0;
  const t = setInterval(() => { p = Math.min(p+5,85); bar.style.width = p+'%'; }, 120);
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise(r => setTimeout(r, 200));
  try {
    const el = document.getElementById('page');
    const canvas = await html2canvas(el, {
      scale: 3, useCORS: true, allowTaint: true,
      backgroundColor: '#E8EEF7', logging: false, imageTimeout: 0,
      width: el.offsetWidth, height: el.offsetHeight,
      windowWidth: el.offsetWidth, windowHeight: el.offsetHeight,
      scrollX: 0, scrollY: 0, x: 0, y: 0
    });
    clearInterval(t); bar.style.width = '100%';
    const a = document.createElement('a');
    a.download = 'LAP2026_Banten_BOR_YoY_Semester1.png';
    a.href = canvas.toDataURL('image/png', 1.0);
    a.click();
  } catch(e) { console.error(e); clearInterval(t); }
  setTimeout(() => {
    bar.style.width = '0'; btn.disabled = false;
    btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export High Quality PNG';
  }, 800);
}
</script>
</body>
</html>`;

// === Output directory: sibling reports/ or html-reports ===
const outDir = 'C:/Users/JIMMY GREEI GANAP/Documents/jimmy-grey-ganap/report-generator/html-reports';
const outFile = outDir + '/LAP2026_Banten_BOR_YoY_Semester1.html';
fs.writeFileSync(outFile, html, 'utf-8');
console.log('\nWrote:', outFile, '(', html.length, 'bytes )');
