const fs = require('fs');

// === Logos (read with strip, assert prefix) ===
const ASSETS = 'C:/Users/JIMMY GREEI GANAP/.claude/skills/ai-skill-pelindo-report/assets';
const pelindoB64 = fs.readFileSync(ASSETS + '/pelindo-logo.b64', 'utf-8').trim();
const danantaraB64 = fs.readFileSync(ASSETS + '/danantara-logo.b64', 'utf-8').trim();
if (!pelindoB64.startsWith('data:image/png;base64,')) throw new Error('pelindo b64 bad');
if (!danantaraB64.startsWith('data:image/png;base64,')) throw new Error('danantara b64 bad');

// === DATA (S1 = Jan–Jun, same period comparison) ===
const months = ['Jan','Feb','Mar','Apr','Mei','Jun'];

// Monthly avg BOR % (from berth subtotals)
const bor25 = [128.3, 114.7, 102.1, 80.0, 92.8, 95.0];
const bor26 = [88.3, 103.9, 90.8, 82.8, 86.9, 86.1];

// Monthly Bongkar MT (from berth subtotals)
const bk25 = [431105, 447120, 392591, 256632, 292953, 416841];
const bk26 = [361411, 303488, 312276, 346431, 322552, 315868];

// By berth S1
const berths = ['A','B','C1','C2','D'];
const berthBor25 = [60.0, 83.5, 135.6, 100.2, 131.3];
const berthBor26 = [71.7, 81.3, 131.6, 100.1, 65.8];
const berthBk25   = [128789, 294208, 539413, 374822, 900010];
const berthBk26   = [105987, 161612, 347754, 273966, 711296];
const berthShips25= [43, 38, 73, 49, 55];
const berthShips26= [61, 20, 46, 39, 27];

// Totals
const totShips25 = 258, totShips26 = 193;
const totBk25 = 2237242, totBk26 = 1600614;
const totMuat25 = 30825, totMuat26 = 17910;
const avgBor25 = 102.1, avgBor26 = 90.1;

// Cargo mix 2026 S1 (donut) — grouped
const cargo26 = [
  { name: 'Batubara',    mt: 768132, share: 48.0 },
  { name: 'Baja',        mt: 367803, share: 23.0 },
  { name: 'Gypsum',      mt: 223535, share: 14.0 },
  { name: 'Gula',        mt: 184582, share: 11.5 },
  { name: 'Rolltissue',  mt: 46233,  share: 2.9  },
  { name: 'Lainnya',     mt: 10330,  share: 0.6  },
];

// Cargo YoY shift (for progress bars)
const cargoShift = [
  { name: 'Batubara',   y25: 1456212, y26: 768132,  d: -47.3 },
  { name: 'Baja',       y25: 374988,  y26: 367803,  d: -1.9  },
  { name: 'Gypsum',     y25: 180722,  y26: 223535,  d: 23.7  },
  { name: 'Gula',       y25: 184443,  y26: 184582,  d: 0.1   },
  { name: 'Rolltissue', y25: 26219,   y26: 46233,   d: 76.3  },
];

// === helpers ===
const fid = (v, dp=0) => dp===0 ? Math.round(v).toLocaleString('id-ID') : v.toLocaleString('id-ID',{minimumFractionDigits:dp, maximumFractionDigits:dp});

// === Build HTML ===
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
.pb-v { font-size:10.5px; font-weight:700; width:64px; text-align:right; flex-shrink:0; }

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
        <div class="hdr-title">Perbandingan Kinerja <em>Semester 1</em> 2025 vs 2026</div>
        <div class="hdr-sub">Analisis BOR, trafik kapal &amp; throughput 5 dermaga &mdash; Jan&ndash;Jun 2025 vs 2026</div>
      </div>
      <div class="hdr-badges">
        <div class="hdr-badge"><div class="hdr-badge-v">&minus;28,5%</div><div class="hdr-badge-l">&Delta; Bongkar YoY</div></div>
        <div class="hdr-badge"><div class="hdr-badge-v">&minus;25,2%</div><div class="hdr-badge-l">&Delta; Kunjungan YoY</div></div>
        <div class="hdr-badge"><div class="hdr-badge-v">90,1%</div><div class="hdr-badge-l">Avg BOR S1 2026</div></div>
        <div class="hdr-badge"><div class="hdr-badge-v">1,60 jt</div><div class="hdr-badge-l">Bongkar MT S1 2026</div></div>
      </div>
    </div>
  </div>

  <div class="body">
    <!-- INSIGHT BAND -->
    <div class="insight">
      <div class="insight-t">Ringkasan Eksekutif</div>
      <div class="insight-b">
        Performa Semester 1 2026 turun signifikan dari periode sama 2025: kunjungan kapal <b>&minus;25,2%</b> (258&rarr;193) dan bongkar <b>&minus;28,5%</b> (2,24&rarr;1,60 jt MT). Avg BOR turun <b>&minus;12,0 pp</b> ke <b>90,1%</b>, namun <b>Dermaga C1 tetap kritis di 131,6%</b>. Penurunan volume didorong hampir seluruhnya oleh <b>Batubara (&minus;47,3%)</b> &mdash; komoditi lain relatif stabil hingga tumbuh.
      </div>
    </div>

    <div class="sec">Indikator Kinerja Utama &mdash; Semester 1</div>
    <!-- KPI STRIP n5 -->
    <div class="kpi-row n5">
      <div class="kpi rd">
        <div class="k-lbl">Kunjungan Kapal 2026</div>
        <div class="k-val">${fid(totShips26)}<span class="k-unit">kapal</span></div>
        <div class="k-delta cd">&darr; &minus;25,2% vs ${fid(totShips25)} (2025)</div>
        <div class="k-track"><div class="k-fill" style="width:74.8%;background:#BC1E1E"></div></div>
      </div>
      <div class="kpi rd">
        <div class="k-lbl">Bongkar 2026</div>
        <div class="k-val">1,60<span class="k-unit">jt MT</span></div>
        <div class="k-delta cd">&darr; &minus;28,5% vs 2,24 jt MT (2025)</div>
        <div class="k-track"><div class="k-fill" style="width:71.5%;background:#BC1E1E"></div></div>
      </div>
      <div class="kpi am">
        <div class="k-lbl">Avg BOR 2026</div>
        <div class="k-val">90,1<span class="k-unit">%</span></div>
        <div class="k-delta cn">&minus;12,0 pp vs 102,1% (2025)</div>
        <div class="k-track"><div class="k-fill" style="width:90.1%;background:#C07808"></div></div>
      </div>
      <div class="kpi rd">
        <div class="k-lbl">Muat 2026</div>
        <div class="k-val">${fid(totMuat26)}<span class="k-unit">MT</span></div>
        <div class="k-delta cd">&darr; &minus;41,9% vs ${fid(totMuat25)} (2025)</div>
        <div class="k-track"><div class="k-fill" style="width:58.1%;background:#BC1E1E"></div></div>
      </div>
      <div class="kpi am">
        <div class="k-lbl">BOR Dermaga C1 2026</div>
        <div class="k-val">131,6<span class="k-unit">%</span></div>
        <div class="k-delta cn">Kronis &gt;100% &mdash; vs 135,6% (2025)</div>
        <div class="k-track"><div class="k-fill" style="width:100%;background:#C07808"></div></div>
      </div>
    </div>

    <!-- ROW 1 : Lead BOR monthly + Cargo donut -->
    <div class="row2">
      <div class="card">
        <div class="card-t">Tren BOR Bulanan &mdash; S1 2025 vs S1 2026</div>
        <div class="card-s">BOR anjlok di Jan&ndash;Mar 2026 (puncak 128,3%&rarr;88,3%); Feb 2026 satu-satunya bulan yang naik atas perbaikan beban C1/C2</div>
        <div class="leg">
          <div class="li"><span class="ls" style="background:#B6D2F0"></span>S1 2025</div>
          <div class="li"><span class="ls" style="background:#1E62C4"></span>S1 2026</div>
        </div>
        <div class="cw" style="height:300px"><canvas id="chBorMonth"></canvas></div>
      </div>
      <div class="card">
        <div class="card-t">Komposisi Komoditi Bongkar &mdash; S1 2026</div>
        <div class="card-s">Batubara masih #1 namun share turun ke 48,0% (dari 64,6% di 2025) &mdash; mix kargo semakin terdiversifikasi</div>
        <div class="cw" style="height:300px"><canvas id="chCargo"></canvas></div>
      </div>
    </div>

    <!-- ROW 2 : Bongkar monthly + BOR by berth + Cargo shift -->
    <div class="row-eq3">
      <div class="card">
        <div class="card-t">Throughput Bongkar Bulanan</div>
        <div class="card-s">Penurunan terdalam di Feb 2026 (&minus;143 rb MT); Apr 2026 satu-satunya bulan tumbuh</div>
        <div class="leg">
          <div class="li"><span class="ls" style="background:#B6D2F0"></span>S1 2025</div>
          <div class="li"><span class="ls" style="background:#1E62C4"></span>S1 2026</div>
        </div>
        <div class="cw" style="height:260px"><canvas id="chBkMonth"></canvas></div>
      </div>
      <div class="card">
        <div class="card-t">BOR per Dermaga &mdash; S1 2025 vs 2026</div>
        <div class="card-s">Dermaga D paling membaik (131,3%&rarr;65,8%); C1 &amp; C2 tetap di atas ambang 100%</div>
        <div class="leg">
          <div class="li"><span class="ls" style="background:#B6D2F0"></span>S1 2025</div>
          <div class="li"><span class="ls" style="background:#1E62C4"></span>S1 2026</div>
        </div>
        <div class="cw" style="height:260px"><canvas id="chBorBerth"></canvas></div>
      </div>
      <div class="card">
        <div class="card-t">Pergeseran Kargo YoY</div>
        <div class="card-s">Batubara menyeret total (&minus;47,3%); gypsum &amp; rolltissue tumbuh dua digit</div>
`;

// Cargo shift progress bars (diverging from center)
const maxAbs = Math.max(...cargoShift.map(c => Math.abs(c.d)));
html += `        <div style="margin-top:4px">\n`;
cargoShift.forEach(c => {
  const w = (Math.abs(c.d) / maxAbs * 50); // half-width %
  const isNeg = c.d < 0;
  const fillLeft = isNeg ? (50 - w) : 50;
  const fillW = w;
  const color = isNeg ? '#BC1E1E' : '#0B8A60';
  const dColor = isNeg ? '#BC1E1E' : '#0A6C3E';
  html += `          <div class="pb-row"><div class="pb-l">${c.name}</div><div class="pb-trk"><div class="pb-mid"></div><div class="pb-fill" style="left:${fillLeft}%;width:${fillW}%;background:${color}"></div></div><div class="pb-v" style="color:${dColor}">${c.d>=0?'+':''}${c.d.toFixed(1)}%</div></div>\n`;
});
html += `          <div style="font-size:9px;color:#9EBACE;margin-top:6px;text-align:right">Batang kiri = turun &middot; kanan = naik &middot; basis MT S1 2025</div>
        </div>
      </div>
    </div>

    <!-- ROW 3 : Full YoY detail table -->
    <div class="row-1">
      <div class="card">
        <div class="card-t">Detail Perbandingan per Dermaga &mdash; Semester 1</div>
        <div class="card-s">Dermaga D penyangga throughput tertinggi (711 rb MT) dengan utilisasi turun setengah; A satu-satunya dermaga dengan trafik naik</div>
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
          <tbody>\n`;

berths.forEach((b, i) => {
  const dBor = (berthBor26[i] - berthBor25[i]);
  const dShips = (berthShips26[i] - berthShips25[i]);
  const dBkPct = ((berthBk26[i] - berthBk25[i]) / berthBk25[i] * 100);
  const borCls = berthBor26[i] > 100 ? 'red' : (berthBor26[i] >= 80 ? 'bl' : '');
  html += `            <tr>
              <td class="fw">Dermaga ${b}</td>
              <td class="r">${berthBor25[i].toFixed(1).replace('.',',')}</td>
              <td class="r fw ${borCls}">${berthBor26[i].toFixed(1).replace('.',',')}</td>
              <td class="r ${dBor<0?'grc':'red'}">${dBor>=0?'+':''}${dBor.toFixed(1).replace('.',',')}</td>
              <td class="r">${berthShips25[i]}</td>
              <td class="r">${berthShips26[i]}</td>
              <td class="r ${dShips<0?'red':'grc'}">${dShips>=0?'+':''}${dShips}</td>
              <td class="r">${fid(berthBk25[i])}</td>
              <td class="r">${fid(berthBk26[i])}</td>
              <td class="r ${dBkPct<0?'red':'grc'}">${dBkPct>=0?'+':''}${dBkPct.toFixed(1).replace('.',',')}%</td>
            </tr>\n`;
});
// total row
const dTotBor = avgBor26 - avgBor25;
const dTotShips = totShips26 - totShips25;
const dTotBkPct = (totBk26 - totBk25) / totBk25 * 100;
html += `            <tr class="tt">
              <td>Konsolidasi</td>
              <td class="r">${avgBor25.toFixed(1).replace('.',',')}</td>
              <td class="r">${avgBor26.toFixed(1).replace('.',',')}</td>
              <td class="r ${dTotBor<0?'grc':'red'}">${dTotBor>=0?'+':''}${dTotBor.toFixed(1).replace('.',',')}</td>
              <td class="r">${totShips25}</td>
              <td class="r">${totShips26}</td>
              <td class="r ${dTotShips<0?'red':'grc'}">${dTotShips>=0?'+':''}${dTotShips}</td>
              <td class="r">${fid(totBk25)}</td>
              <td class="r">${fid(totBk26)}</td>
              <td class="r ${dTotBkPct<0?'red':'grc'}">${dTotBkPct>=0?'+':''}${dTotBkPct.toFixed(1).replace('.',',')}%</td>
            </tr>\n`;
html += `          </tbody>
        </table>
      </div>
    </div>

    <!-- STATUS BAR -->
    <div class="sbar">
      <span class="sbar-ttl">Key Takeaways</span>
      <div class="sbar-list">
        <div class="si wn"><span class="dot dwn"></span>Bongkar anjlok &minus;28,5% YoY (&minus;637 rb MT) didorong Batubara &minus;47,3%</div>
        <div class="si wn"><span class="dot dwn"></span>Kunjungan kapal turun &minus;25,2% (258&rarr;193); hanya Dermaga A yang naik (+18)</div>
        <div class="si ok"><span class="dot dok"></span>Avg BOR membaik &minus;12 pp ke 90,1% &mdash; tekanan kongesti berkurang</div>
        <div class="si wn"><span class="dot dwn"></span>Dermaga C1 tetap kritis 131,6% (konsisten &gt;100% selama 14 dari 18 bulan)</div>
        <div class="si ok"><span class="dot dok"></span>Dermaga D paling sehat: BOR 65,8% dengan throughput tertinggi 711 rb MT</div>
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
            <div class="rec-p">C1 BOR 131,6% (kritis) sementara D hanya 65,8% dengan kapasitas throughput terbukti 711 rb MT. Evaluasi penempatan kapal batubara ke D untuk meredam kongesti C1.</div>
            <span class="rec-when">Jangka Pendek</span>
          </div>
          <div class="rec-card">
            <div class="rec-h">Pertahankan momentum Apr 2026 (+90 rb MT bongkar)</div>
            <div class="rec-p">Apr 2026 satu-satunya bulan tumbuh YoY. Identifikasi driver pertumbuhan (gypsum +23,7%, rolltissue +76,3%) dan replikasi praktik operasionalnya.</div>
            <span class="rec-when">Segera</span>
          </div>
        </div>
        <div class="rec-col rc-st">
          <div class="rec-col-hdr">Strategis</div>
          <div class="rec-card">
            <div class="rec-h">Diversifikasi komoditi untuk kurangi ketergantungan batubara</div>
            <div class="rec-p">Batubara turun &minus;47,3% dan menyeret total bongkar &minus;28,5%. Share batubara menyusut dari 64,6% ke 48,0% &mdash; percepat akuisisi kargo gypsum, baja, dan gula untuk menyangga volatilitas.</div>
            <span class="rec-when">Jangka Menengah</span>
          </div>
        </div>
        <div class="rec-col rc-rk">
          <div class="rec-col-hdr">Risiko</div>
          <div class="rec-card">
            <div class="rec-h">Validasi penyebab penurunan batubara &minus;47,3%</div>
            <div class="rec-p">Batubara menyumbang ~88% dari total penurunan bongkar YoY. Investigasi apakah tren struktural (kebijakan energi/kontraksi PLTU), kontrak berakhir, atau pergeseran ke pelabuhan lain.</div>
            <span class="rec-when">Monitor</span>
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

// Shared x tick config
const xTick = { maxRotation:0, minRotation:0, font:{size:9, family:"'Outfit',Arial,sans-serif"}, color:'#7B98B5', autoSkip:false };

// === CHART 1: BOR Monthly grouped bar ===
new Chart(document.getElementById('chBorMonth'), {
  type:'bar',
  data:{
    labels:[['Jan','25'],['Feb','25'],['Mar','25'],['Apr','25'],['Mei','25'],['Jun','25']],
    datasets:[
      { label:'S1 2025', data:${JSON.stringify(bor25)},
        backgroundColor:'#B6D2F0', borderRadius:5, borderSkipped:false, barPercentage:0.36, categoryPercentage:0.88,
        datalabels:{ display:true, align:'top', anchor:'end', offset:2, color:'#446280', font:{weight:700,size:9.5}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3},
          formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1})+'%' } },
      { label:'S1 2026', data:${JSON.stringify(bor26)},
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

// === CHART 2: Cargo donut 2026 ===
new Chart(document.getElementById('chCargo'), {
  type:'doughnut',
  data:{
    labels:${JSON.stringify(cargo26.map(c=>c.name))},
    datasets:[{
      data:${JSON.stringify(cargo26.map(c=>c.mt))},
      backgroundColor:['#1358A4','#0B8A60','#2478D8','#5135AE','#B6D2F0','#A8BCD4'],
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
    ctx.fillText('1,60 jt MT', cx, cy+9);
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
      { label:'S1 2025', data:${JSON.stringify(bk25)},
        backgroundColor:'#B6D2F0', borderRadius:5, borderSkipped:false, barPercentage:0.36, categoryPercentage:0.88,
        datalabels:{ display:true, align:'top', anchor:'end', offset:2, color:'#446280', font:{weight:700,size:9}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3},
          formatter:v=>Math.round(v/1000)+' rb' } },
      { label:'S1 2026', data:${JSON.stringify(bk26)},
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
    labels:${JSON.stringify(berths.map(b=>'Dermaga '+b))},
    datasets:[
      { label:'S1 2025', data:${JSON.stringify(berthBor25)},
        backgroundColor:'#B6D2F0', borderRadius:5, borderSkipped:false, barPercentage:0.36, categoryPercentage:0.88,
        datalabels:{ display:true, align:'right', anchor:'end', offset:3, color:'#446280', font:{weight:700,size:9}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3},
          formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1})+'%' } },
      { label:'S1 2026', data:${JSON.stringify(berthBor26)},
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

const outDir = 'C:/Users/JIMMY GREEI GANAP/Documents/jimmy-grey-ganap/report-generator/html-reports';
const outFile = outDir + '/LAP2026_Banten_BOR_YoY_Semester1.html';
fs.writeFileSync(outFile, html, 'utf-8');
console.log('Wrote:', outFile, '(', html.length, 'bytes )');
