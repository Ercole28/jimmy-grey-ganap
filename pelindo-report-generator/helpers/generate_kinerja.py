#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generator laporan HTML Kinerja Pelayanan — Pelindo Regional 2 Banten."""
import os

SK = r'C:\Users\bradl\.claude\skills\pelindo-skill\assets'
with open(os.path.join(SK, 'pelindo-logo.b64'), 'r', encoding='utf-8-sig') as f:
    PEL = f.read().strip()
with open(os.path.join(SK, 'danantara-logo.b64'), 'r', encoding='utf-8-sig') as f:
    DAN = f.read().strip()
assert PEL.startswith('data:image/png;base64,'), "pelindo logo corrupt"
assert DAN.startswith('data:image/png;base64,'), "danantara logo corrupt"

OUT = r'C:\Users\bradl\Documents\Jimmy Greei Ganap\report-generator\html-reports\KPI2026_Banten_KinerjaPelayanan.html'
FN = 'KPI2026_Banten_KinerjaPelayanan'

HTML = r'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Kinerja Pelayanan Operasi s.d. Mei 2026 — Regional 2 Banten</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Serif+Display&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background:#cbd5e8; display:flex; flex-direction:column; align-items:center; padding:40px 0 60px; font-family:'Outfit',Arial,sans-serif; -webkit-font-smoothing:antialiased; }
#toolbar { width:1400px; display:flex; justify-content:flex-end; margin-bottom:16px; }
#page { width:1400px; background:#E8EEF7; overflow:hidden; font-size:13px; color:#1A2C42; line-height:1.45; box-shadow:0 8px 40px rgba(0,0,0,0.18); }
.body { padding:24px 36px 32px; }
.sec { font-size:9px; font-weight:700; letter-spacing:2.8px; text-transform:uppercase; color:#8AAAC2; margin-bottom:12px; }

/* Header */
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

/* Export button */
#exportBtn { display:flex; align-items:center; gap:8px; background:linear-gradient(135deg,#0B3868,#1459A8); color:#fff; border:none; border-radius:10px; padding:12px 24px; font-family:'Outfit',Arial,sans-serif; font-size:13px; font-weight:600; cursor:pointer; box-shadow:0 4px 18px rgba(11,56,104,0.45); transition:transform .15s, box-shadow .15s; }
#exportBtn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(11,56,104,0.55); }
#exportBtn:disabled { opacity:0.55; cursor:not-allowed; transform:none; }
#progressBar { position:fixed; top:0; left:0; height:3px; width:0%; background:linear-gradient(90deg,#1459A8,#3DD6A0); z-index:9999; transition:width 0.25s ease; }

/* Insight */
.insight { background:#F1F6FC; border-left:5px solid #1358A4; border-radius:10px; padding:13px 20px; margin-bottom:18px; display:flex; gap:18px; align-items:flex-start; }
.insight-t { font-size:8.5px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#1358A4; flex-shrink:0; padding-top:3px; width:96px; }
.insight-b { font-size:12.5px; color:#284058; line-height:1.62; }
.insight-b b { color:#061628; font-weight:700; }
.insight-b i { color:#C07808; font-style:normal; font-weight:600; }

/* KPI */
.kpi-row { display:grid; gap:12px; margin-bottom:20px; }
.kpi-row.n5 { grid-template-columns:repeat(5,1fr); }
.kpi { background:#fff; border-radius:12px; padding:15px 17px 13px; border-top:3px solid #1358A4; box-shadow:0 1px 6px rgba(6,22,40,0.09); }
.kpi.gr { border-top-color:#0B8A60; }
.kpi.am { border-top-color:#C07808; }
.kpi.pu { border-top-color:#5135AE; }
.kpi.rd { border-top-color:#BC1E1E; }
.k-lbl { font-size:9px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; color:#7B98B5; margin-bottom:6px; }
.k-val { font-size:23px; font-weight:700; color:#061628; line-height:1; }
.k-unit { font-size:10px; font-weight:400; color:#A0BACC; margin-left:2px; }
.k-delta { font-size:10.5px; font-weight:600; margin-top:5px; }
.cu{color:#0B8A60;} .cd{color:#BC1E1E;} .cn{color:#8AAAC2;}
.k-track { height:3px; background:#E8F0F8; border-radius:2px; margin-top:9px; }
.k-fill { height:3px; border-radius:2px; }

/* Layout */
.row2 { display:grid; grid-template-columns:856px 1fr; gap:14px; margin-bottom:14px; }
.row-eq3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:14px; }
.row-1 { margin-bottom:14px; }

/* Card */
.card { background:#fff; border-radius:14px; padding:18px 20px 16px; box-shadow:0 1px 6px rgba(6,22,40,0.09); }
.card-t { font-size:13px; font-weight:600; color:#061628; margin-bottom:2px; }
.card-s { font-size:10.5px; color:#8AAAC2; margin-bottom:13px; }
.cw { position:relative; width:100%; }
.leg { display:flex; flex-wrap:wrap; gap:12px; margin-bottom:10px; }
.li { display:flex; align-items:center; gap:5px; font-size:10.5px; font-weight:500; color:#486480; }
.ls { width:10px; height:10px; border-radius:2px; flex-shrink:0; }

/* Table */
.t { width:100%; border-collapse:collapse; font-size:11.5px; }
.t thead th { background:#F1F6FC; color:#7B98B5; font-weight:700; font-size:9.5px; text-transform:uppercase; letter-spacing:.5px; padding:7px 9px; text-align:left; border-bottom:1.5px solid #DCE8F4; }
.t thead th.r { text-align:right; }
.t tbody td { padding:6.5px 9px; border-bottom:1px solid #ECF2FA; color:#284058; vertical-align:middle; }
.t tbody td.r { text-align:right; }
.t tbody tr:last-child td { border-bottom:none; }
.t .tt td { background:#E8F1FB; font-weight:700; color:#061628; }
.t .hl td { background:#DCEFFE; color:#061628; }
.fw{font-weight:700;} .red{color:#BC1E1E;} .bl{color:#0E4A90;}

/* Status bar */
.sbar { background:#061628; border-radius:12px; padding:14px 24px 16px; }
.sbar-ttl { font-size:8.5px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:#68ACEE; display:block; margin-bottom:11px; }
.sbar-list { display:grid; grid-template-columns:1fr 1fr; gap:7px 28px; }
.si { display:flex; align-items:center; gap:6px; font-size:11px; font-weight:500; padding:5px 8px; border-radius:8px; background:rgba(255,255,255,0.05); }
.ok{color:#45D099;} .wn{color:#FFBB38;}
.dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.dok{background:#45D099;} .dwn{background:#FFBB38;}

/* Recommendations */
.rec { border-radius:14px; overflow:hidden; box-shadow:0 3px 18px rgba(6,22,40,0.16); margin-top:14px; margin-bottom:14px; }
.rec-hdr { background:linear-gradient(112deg,#061628 0%,#0B3464 60%,#1358A4 100%); padding:16px 28px; display:flex; align-items:baseline; justify-content:space-between; position:relative; overflow:hidden; }
.rec-hdr::before { content:''; position:absolute; right:-30px; top:-40px; width:160px; height:160px; border-radius:50%; background:rgba(255,255,255,0.04); pointer-events:none; }
.rec-title { font-family:'DM Serif Display',Georgia,serif; font-size:20px; font-weight:400; color:#fff; }
.rec-sub { font-size:10px; color:rgba(255,255,255,0.42); font-style:italic; }
.rec-cols { display:grid; grid-template-columns:1fr 1fr 1fr; gap:0; }
.rec-col { padding:18px 22px; display:flex; flex-direction:column; gap:10px; }
.rc-op { background:#F6FCF9; }
.rc-st { background:#F4F8FE; }
.rc-rk { background:#FFFBF3; }
.rec-col-hdr { font-size:8.5px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding-bottom:10px; border-bottom:2px solid; margin-bottom:4px; }
.rc-op .rec-col-hdr { color:#0B8A60; border-bottom-color:#0B8A60; }
.rc-st .rec-col-hdr { color:#1358A4; border-bottom-color:#1358A4; }
.rc-rk .rec-col-hdr { color:#C07808; border-bottom-color:#C07808; }
.rec-card { background:#fff; border-radius:10px; padding:13px 15px; border-left:4px solid; display:flex; flex-direction:column; gap:5px; box-shadow:0 1px 4px rgba(6,22,40,0.07); }
.rc-op .rec-card { border-left-color:#0B8A60; }
.rc-st .rec-card { border-left-color:#1358A4; }
.rc-rk .rec-card { border-left-color:#C07808; }
.rec-h { font-size:12px; font-weight:700; color:#061628; line-height:1.35; }
.rec-p { font-size:10.5px; color:#446280; line-height:1.52; }
.rec-when { display:inline-block; font-size:8px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:3px 9px; border-radius:99px; margin-top:4px; align-self:flex-start; }
.rc-op .rec-when { background:#D9F5E8; color:#0A6C3E; }
.rc-st .rec-when { background:#D9EFFE; color:#094E9E; }
.rc-rk .rec-when { background:#FEF0D8; color:#985200; }

/* Footer */
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
        <div class="logo-wrapper"><img class="logo-pelindo" src="__PEL__" alt="Pelindo"></div>
        <div class="bar-sep"></div>
        <div class="logo-wrapper"><img class="logo-danantara" src="__DAN__" alt="Danantara Indonesia"></div>
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
        <div class="eyebrow">Realisasi Kinerja &middot; Jan&ndash;Mei 2026</div>
        <div class="hdr-title">Kinerja Pelayanan <em>Operasi</em> s.d. Mei 2026</div>
        <div class="hdr-sub">Waktu Tunggu, Efisiensi Tambat &amp; Produktivitas &mdash; Konsolidasi Regional 2 Banten</div>
      </div>
      <div class="hdr-badges">
        <div class="hdr-badge"><div class="hdr-badge-v">53,6%</div><div class="hdr-badge-l">ET/BT Konsolidasi</div></div>
        <div class="hdr-badge"><div class="hdr-badge-v">0,03</div><div class="hdr-badge-l">Waiting Time (jam)</div></div>
        <div class="hdr-badge"><div class="hdr-badge-v">198,7</div><div class="hdr-badge-l">T/G/H Curah Kering</div></div>
        <div class="hdr-badge"><div class="hdr-badge-v">Jan&ndash;Mei</div><div class="hdr-badge-l">Periode 2026 (5 bln)</div></div>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div class="body">
    <!-- INSIGHT -->
    <div class="insight">
      <div class="insight-t">Ringkasan Eksekutif</div>
      <div class="insight-b">
        Kinerja pelayanan Regional 2 Banten s.d. <b>Mei 2026</b> menunjukkan waktu tunggu kapal nyaris nol
        (<b>WT 0,03 jam</b>) dengan Approach Time stabil <b>0,63 jam</b>. Efisiensi tambat (ET/BT) Konsolidasi
        berkisar <b>53,6%&ndash;68,9%</b> &mdash; Terminal Curah Cair paling efisien, sementara Idle Time (IT)
        Multipurpose berhasil diturunkan <b>34,3%</b>. <i>Produktivitas Curah Kering menurun &minus;30,6%
        (Jan&rarr;Mei) dan terdapat anomali data T/G/H Curah Cair Mei (195.265) yang perlu validasi.</i>
      </div>
    </div>

    <div class="sec">Indikator Kinerja Utama &mdash; Konsolidasi s.d. Mei 2026</div>

    <!-- KPI STRIP (5) -->
    <div class="kpi-row n5">
      <div class="kpi gr">
        <div class="k-lbl">Efisiensi ET/BT</div>
        <div class="k-val">53,6<span class="k-unit">%</span></div>
        <div class="k-delta cu">&#9650; +5,1 pp vs Jan 2026</div>
        <div class="k-track"><div class="k-fill" style="width:53.6%;background:#0B8A60"></div></div>
      </div>
      <div class="kpi gr">
        <div class="k-lbl">Waiting Time (WT)</div>
        <div class="k-val">0,03<span class="k-unit">jam</span></div>
        <div class="k-delta cu">&#9650; 0,07 &rarr; 0,00 jam (Mei)</div>
        <div class="k-track"><div class="k-fill" style="width:6%;background:#0B8A60"></div></div>
      </div>
      <div class="kpi">
        <div class="k-lbl">Approach Time (AT)</div>
        <div class="k-val">0,63<span class="k-unit">jam</span></div>
        <div class="k-delta cn">Stabil 0,61&ndash;0,65 jam</div>
        <div class="k-track"><div class="k-fill" style="width:63%;background:#1358A4"></div></div>
      </div>
      <div class="kpi am">
        <div class="k-lbl">Produktivitas Curah Kering</div>
        <div class="k-val">198,7<span class="k-unit">T/G/H</span></div>
        <div class="k-delta cd">&#9660; &minus;30,6% vs Jan 2026</div>
        <div class="k-track"><div class="k-fill" style="width:66%;background:#C07808"></div></div>
      </div>
      <div class="kpi am">
        <div class="k-lbl">Idle Time (IT) Multipurpose</div>
        <div class="k-val">9,6<span class="k-unit">jam</span></div>
        <div class="k-delta cu">&#9660; &minus;34,3% vs Jan 2026 (membaik)</div>
        <div class="k-track"><div class="k-fill" style="width:40%;background:#C07808"></div></div>
      </div>
    </div>

    <!-- ROW 1: .row2 -->
    <div class="row2">
      <!-- Card 1: ET/BT trend (wide) -->
      <div class="card">
        <div class="card-t">Tren Efisiensi Tambat (ET/BT) per Terminal</div>
        <div class="card-s">Curah Cair paling efisien (rata-rata 68,9%); Multipurpose &amp; Curah Kering stagnan di ~54%</div>
        <div class="leg">
          <div class="li"><span class="ls" style="background:#1E62C4"></span>Multipurpose</div>
          <div class="li"><span class="ls" style="background:#0B8A60"></span>Curah Cair</div>
          <div class="li"><span class="ls" style="background:#C07808"></span>Curah Kering</div>
        </div>
        <div class="cw" style="height:288px"><canvas id="c1"></canvas></div>
      </div>
      <!-- Card 2: Composition (narrow) -->
      <div class="card">
        <div class="card-t">Komposisi Waktu Tambat (BT)</div>
        <div class="card-s">Hanya ~53% waktu tambat Multipurpose yang produktif; Curah Cair paling efisien</div>
        <div class="leg">
          <div class="li"><span class="ls" style="background:#10986A"></span>Effective Time (ET)</div>
          <div class="li"><span class="ls" style="background:#BC1E1E"></span>Idle Time (IT)</div>
          <div class="li"><span class="ls" style="background:#7BA8D8"></span>Not Op Time (NOT)</div>
        </div>
        <div class="cw" style="height:288px"><canvas id="c2"></canvas></div>
      </div>
    </div>

    <!-- ROW 2: .row-eq3 -->
    <div class="row-eq3">
      <!-- Card 3: Service times -->
      <div class="card">
        <div class="card-t">Waktu Pelayanan Kapal (WT &amp; AT)</div>
        <div class="card-s">AT Konsolidasi 0,63 jam; WT nyaris nol (0,03 jam) &mdash; pelayanan prima</div>
        <div class="leg">
          <div class="li"><span class="ls" style="background:#1E62C4"></span>Approach Time (jam)</div>
          <div class="li"><span class="ls" style="background:#0B8A60"></span>Waiting Time (jam)</div>
        </div>
        <div class="cw" style="height:248px"><canvas id="c3"></canvas></div>
      </div>
      <!-- Card 4: Productivity -->
      <div class="card">
        <div class="card-t">Produktivitas T/G/H Curah Kering</div>
        <div class="card-s">Tren menurun &minus;30,6% (Jan&rarr;Mei); Curah Cair ada anomali data Mei</div>
        <div class="cw" style="height:248px"><canvas id="c4"></canvas></div>
      </div>
      <!-- Card 5: Detail table -->
      <div class="card">
        <div class="card-t">Rincian Metrik Tambat per Terminal</div>
        <div class="card-s">Rata-rata Jan&ndash;Mei 2026 (Konsolidasi) &mdash; satuan jam kecuali ET/BT</div>
        <table class="t">
          <thead>
            <tr>
              <th>Terminal</th>
              <th class="r">BT</th>
              <th class="r">ET</th>
              <th class="r">IT</th>
              <th class="r">ET/BT</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Multipurpose</td><td class="r">80,8</td><td class="r">42,6</td><td class="r">9,6</td><td class="r fw">53,6%</td></tr>
            <tr class="hl"><td>Curah Cair</td><td class="r">27,4</td><td class="r">20,7</td><td class="r">0,1</td><td class="r fw bl">68,9%</td></tr>
            <tr><td>Curah Kering</td><td class="r">78,4</td><td class="r">41,5</td><td class="r">16,3</td><td class="r fw">54,1%</td></tr>
            <tr class="tt"><td>Rata-rata</td><td class="r">62,2</td><td class="r">34,9</td><td class="r">8,7</td><td class="r">58,9%</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- STATUS BAR -->
    <div class="sbar">
      <span class="sbar-ttl">Key Takeaways</span>
      <div class="sbar-list">
        <div class="si ok"><span class="dot dok"></span>WT Konsolidasi nyaris nol (0,03 jam) &mdash; kapal langsung dilayani</div>
        <div class="si ok"><span class="dot dok"></span>Curah Cair paling efisien, ET/BT 68,9% (rata-rata 5 bulan)</div>
        <div class="si ok"><span class="dot dok"></span>Idle Time Multipurpose turun 34,3% (10,97 &rarr; 7,20 jam)</div>
        <div class="si wn"><span class="dot dwn"></span>Produktivitas Curah Kering anjlok &minus;30,6% (247,8 &rarr; 172,0 T/G/H)</div>
        <div class="si wn"><span class="dot dwn"></span>Anomali data T/G/H Curah Cair Mei (195.265) &mdash; perlu validasi</div>
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
            <div class="rec-h">Tindak lanjuti penurunan produktivitas Curah Kering</div>
            <div class="rec-p">Produktivitas Curah Kering anjlok &minus;30,6% (247,8 &rarr; 172,0 T/G/H) selama Jan&ndash;Mei 2026. Audit jumlah alat/gang, muatan rata-rata per jam, dan hambatan operasi pada terminal.</div>
            <span class="rec-when">Jangka Pendek</span>
          </div>
        </div>
        <div class="rec-col rc-st">
          <div class="rec-col-hdr">Strategis</div>
          <div class="rec-card">
            <div class="rec-h">Tingkatkan ET/BT Multipurpose &amp; Curah Kering yang stagnan ~54%</div>
            <div class="rec-p">ET/BT Multipurpose 53,6% &amp; Curah Kering 54,1% jauh di bawah Curah Cair 68,9%. Reduksi Not Operation Time (NOT 21&ndash;30 jam) berpotensi membebaskan ~15 pp efisiensi tambat.</div>
            <span class="rec-when">Jangka Menengah</span>
          </div>
        </div>
        <div class="rec-col rc-rk">
          <div class="rec-col-hdr">Risiko</div>
          <div class="rec-card">
            <div class="rec-h">Validasi data T/G/H Curah Cair Mei sebelum dipakai</div>
            <div class="rec-p">Nilai 195.265 T/G/H pada Mei 2026 (vs rentang normal 165&ndash;246) merupakan anomali input. Jangan dijadikan basis proyeksi atau evaluasi sebelum dikoreksi ke sumber data.</div>
            <span class="rec-when">Validasi</span>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="ftr">
    <span>KPI Kinerja Pelayanan 2026 &mdash; PT Pelabuhan Indonesia (Persero)</span>
    <span>Disiapkan: Juli 2026 &middot; Satuan jam &amp; T/G/H kecuali disebutkan &middot; Data s.d. Mei 2026 (parsial)</span>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script>
Chart.register(ChartDataLabels);
Chart.defaults.font.family = "'Outfit', Arial, sans-serif";
Chart.defaults.devicePixelRatio = window.devicePixelRatio * 2;
Chart.defaults.plugins.datalabels = { display: false };

const XTICKS = { maxRotation:0, minRotation:0, font:{size:9, family:"'Outfit',Arial,sans-serif"}, color:'#7B98B5' };
const XGRID = { display:false };

// ---- Chart 1: ET/BT trend by terminal (grouped bar, 3 datasets) ----
new Chart(document.getElementById('c1'), {
  type:'bar',
  data:{
    labels:[['Jan','2026'],['Feb','2026'],['Mar','2026'],['Apr','2026'],['Mei','2026']],
    datasets:[
      { label:'Multipurpose', data:[51.46,53.71,52.92,53.26,56.56], backgroundColor:'#1E62C4', borderRadius:4, borderSkipped:false, barPercentage:0.72, categoryPercentage:0.88,
        datalabels:{ display:true, align:'top', anchor:'end', offset:2, color:'#061628', font:{weight:700,size:9}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3}, formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1}) } },
      { label:'Curah Cair', data:[70.62,63.62,76.16,73.32,60.74], backgroundColor:'#0B8A60', borderRadius:4, borderSkipped:false, barPercentage:0.72, categoryPercentage:0.88,
        datalabels:{ display:true, align:'top', anchor:'end', offset:2, color:'#061628', font:{weight:700,size:9}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3}, formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1}) } },
      { label:'Curah Kering', data:[53.21,49.73,47.89,64.93,54.69], backgroundColor:'#C07808', borderRadius:4, borderSkipped:false, barPercentage:0.72, categoryPercentage:0.88,
        datalabels:{ display:true, align:'top', anchor:'end', offset:2, color:'#061628', font:{weight:700,size:9}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3}, formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1}) } }
    ]
  },
  options:{
    maintainAspectRatio:false, responsive:true,
    scales:{
      x:{ ticks:XTICKS, grid:XGRID },
      y:{ beginAtZero:true, max:92, ticks:{ font:{size:9}, color:'#7B98B5', callback:v=>v+'%' }, grid:{ color:'#EEF3FA' }, title:{ display:true, text:'ET/BT (%)', color:'#7B98B5', font:{size:9,weight:600} } }
    },
    plugins:{
      legend:{ display:false },
      tooltip:{ callbacks:{ label:c=>` ${c.dataset.label}: ${c.parsed.y.toLocaleString('id-ID',{minimumFractionDigits:1})}%` } }
    }
  }
});

// ---- Chart 2: Berth time composition (stacked bar) ----
new Chart(document.getElementById('c2'), {
  type:'bar',
  data:{
    labels:[['Multi-','purpose'],['Curah','Cair'],['Curah','Kering']],
    datasets:[
      { label:'Effective Time (ET)', data:[42.6,20.7,41.5], backgroundColor:'#10986A', borderRadius:0, borderSkipped:false, barPercentage:0.5, categoryPercentage:0.7, stack:'s', datalabels:{ display:false } },
      { label:'Idle Time (IT)', data:[9.6,0.1,16.3], backgroundColor:'#BC1E1E', borderRadius:0, borderSkipped:false, barPercentage:0.5, categoryPercentage:0.7, stack:'s', datalabels:{ display:false } },
      { label:'Not Op Time (NOT)', data:[30.1,6.5,21.3], backgroundColor:'#7BA8D8', borderRadius:4, borderSkipped:false, barPercentage:0.5, categoryPercentage:0.7, stack:'s',
        datalabels:{ display:true, align:'top', anchor:'end', offset:2, color:'#061628', font:{weight:700,size:10}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:4,right:4},
          formatter:(v,ctx)=>{ const i=ctx.dataIndex; return ctx.chart.data.datasets.reduce((a,d)=>a+(d.data[i]||0),0).toLocaleString('id-ID',{minimumFractionDigits:1}); } } }
    ]
  },
  options:{
    maintainAspectRatio:false, responsive:true,
    scales:{
      x:{ stacked:true, ticks:XTICKS, grid:XGRID },
      y:{ stacked:true, beginAtZero:true, max:100, ticks:{ font:{size:9}, color:'#7B98B5' }, grid:{ color:'#EEF3FA' }, title:{ display:true, text:'Jam', color:'#7B98B5', font:{size:9,weight:600} } }
    },
    plugins:{
      legend:{ display:false },
      tooltip:{ callbacks:{ label:c=>` ${c.dataset.label}: ${c.parsed.y.toLocaleString('id-ID',{minimumFractionDigits:1})} jam` } }
    }
  }
});

// ---- Chart 3: Service times WT & AT (combo bar + line, dual axis) ----
new Chart(document.getElementById('c3'), {
  data:{
    labels:[['Luar','Negeri'],['Dalam','Negeri'],['Konsol.','2026']],
    datasets:[
      { type:'bar', label:'Approach Time (AT)', data:[0.7505,0.5071,0.6278], backgroundColor:'#1E62C4', borderRadius:4, borderSkipped:false, barPercentage:0.5, categoryPercentage:0.7, yAxisID:'yBar',
        datalabels:{ display:true, align:'top', anchor:'end', offset:3, color:'#061628', font:{weight:700,size:9.5}, backgroundColor:'rgba(255,255,255,0.85)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3}, formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:2})+' j' } },
      { type:'line', label:'Waiting Time (WT)', data:[0.0064,0.0523,0.0274], borderColor:'#0B8A60', backgroundColor:'#0B8A60', borderWidth:2.5, tension:0.35, pointRadius:4, pointBackgroundColor:'#0B8A60', yAxisID:'yLine',
        datalabels:{ display:true, align:'bottom', anchor:'center', offset:5, color:'#0A6040', font:{weight:700,size:9}, backgroundColor:'rgba(255,255,255,0.9)', borderRadius:3, padding:{top:1,bottom:1,left:3,right:3}, formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:3}) } }
    ]
  },
  options:{
    maintainAspectRatio:false, responsive:true,
    scales:{
      x:{ ticks:XTICKS, grid:XGRID },
      yBar:{ beginAtZero:true, max:0.90, position:'left', ticks:{ font:{size:9}, color:'#7B98B5', callback:v=>v.toLocaleString('id-ID',{minimumFractionDigits:1}) }, grid:{ color:'#EEF3FA' }, title:{ display:true, text:'AT (jam)', color:'#7B98B5', font:{size:9,weight:600} } },
      yLine:{ beginAtZero:true, max:0.085, position:'right', ticks:{ font:{size:9}, color:'#0B8A60', callback:v=>v.toLocaleString('id-ID',{minimumFractionDigits:2}) }, grid:{ display:false }, title:{ display:true, text:'WT (jam)', color:'#0B8A60', font:{size:9,weight:600} } }
    },
    plugins:{
      legend:{ display:false },
      tooltip:{ callbacks:{ label:c=>` ${c.dataset.label}: ${c.parsed.y.toLocaleString('id-ID',{minimumFractionDigits:3})} jam` } }
    }
  }
});

// ---- Chart 4: Productivity T/G/H Curah Kering (single bar trend) ----
new Chart(document.getElementById('c4'), {
  type:'bar',
  data:{
    labels:[['Jan','2026'],['Feb','2026'],['Mar','2026'],['Apr','2026'],['Mei','2026']],
    datasets:[
      { label:'T/G/H Curah Kering', data:[247.81,208.90,175.13,189.63,171.97], backgroundColor:['#6CA4E0','#5888D4','#A8BCD4','#1E62C4','#061628'], borderRadius:5, borderSkipped:false, barPercentage:0.62, categoryPercentage:0.88,
        datalabels:{ display:true, align:'top', anchor:'end', offset:2, color:'#061628', font:{weight:700,size:10}, backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3, padding:{top:1,bottom:1,left:4,right:4}, formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1}) } }
    ]
  },
  options:{
    maintainAspectRatio:false, responsive:true,
    scales:{
      x:{ ticks:XTICKS, grid:XGRID },
      y:{ beginAtZero:true, max:295, ticks:{ font:{size:9}, color:'#7B98B5' }, grid:{ color:'#EEF3FA' }, title:{ display:true, text:'T/G/H (ton per gang per jam)', color:'#7B98B5', font:{size:9,weight:600} } }
    },
    plugins:{
      legend:{ display:false },
      tooltip:{ callbacks:{ label:c=>` ${c.dataset.label}: ${c.parsed.y.toLocaleString('id-ID',{minimumFractionDigits:1})} T/G/H` } }
    }
  }
});

async function doExport() {
  const btn = document.getElementById('exportBtn');
  const bar = document.getElementById('progressBar');
  btn.disabled = true; btn.textContent = 'Generating\u2026';
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
    a.download = '__FN__.png';
    a.href = canvas.toDataURL('image/png', 1.0);
    a.click();
  } catch(e) { console.error(e); clearInterval(t); }
  setTimeout(() => {
    bar.style.width = '0'; btn.disabled = false;
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export High Quality PNG`;
  }, 800);
}
</script>
</body>
</html>
'''

html = (HTML
        .replace('__PEL__', PEL)
        .replace('__DAN__', DAN)
        .replace('__FN__', FN))

with open(OUT, 'w', encoding='utf-8') as f:
    f.write(html)

print('WROTE:', OUT)
print('Size :', len(html), 'bytes')
