"""Generate RKAP 2027 Kertas Kerja A3 HTML report.

Source : raw-reports/1. Kertas Kerja A3_Prognosa 2026 dan RKAP 2027-keuangan-rev-3.xlsx
Output : html-reports/RKAP2027_Konsolidasi_KertasKerjaA3.html

Story count = 5  ->  Layout: .row2 + .row-eq3
KPI count  = 5   ->  .kpi-row.n5
Category   = B (Financial Workbook)
Unit       : IDR Juta (charts/tables) & IDR Miliar (header badges)
"""
import os

SKILL_ASSETS = r'C:\Users\bradl\.claude\skills\pelindo-skill\assets'
CSS_PATH     = os.path.join(SKILL_ASSETS, 'pelindo-report.css')
PROJECT_ROOT = r'C:\Users\bradl\Documents\Jimmy Greei Ganap\report-generator'
OUT_PATH     = os.path.join(PROJECT_ROOT, 'html-reports', 'RKAP2027_Konsolidasi_KertasKerjaA3.html')

# ── Load pre-baked logos (encoding='utf-8-sig' strips BOM; .strip() removes stray whitespace) ──
with open(os.path.join(SKILL_ASSETS, 'pelindo-logo.b64'),   'r', encoding='utf-8-sig') as f:
    PELINDO_B64 = f.read().strip()
with open(os.path.join(SKILL_ASSETS, 'danantara-logo.b64'), 'r', encoding='utf-8-sig') as f:
    DANANTARA_B64 = f.read().strip()
assert PELINDO_B64.startswith('data:image/png;base64,'),   'pelindo b64 corrupted'
assert DANANTARA_B64.startswith('data:image/png;base64,'), 'danantara b64 corrupted'

with open(CSS_PATH, 'r', encoding='utf-8') as f:
    CSS = f.read()

# ══════════════════════════════════════════════════════════════════════════════
# DATA (from Sheet1 / Sheet2 — full IDR; converted to IDR Juta = /1_000_000)
# ══════════════════════════════════════════════════════════════════════════════
# DERUM Konsolidasi (Pelayanan Kapal) — row 12
tren_labels = [['2023'],['2024'],['Real.','2025'],['RKAP','2026'],['Progn.','2026'],['RKAP','2027']]
tren_data   = [55089, 95708, 95048, 98941, 128802, 136241]
tren_colors = ['#B6D2F0','#6CA4E0','#1358A4','#093460','#C07808','#020E1C']

# DERUM by component — Real 2025, RKAP 2026, Progn 2026, RKAP 2027
komp_labels = [['Pemanduan'],['Penundaan'],['Penambatan']]
komp_periods = [
    ('Real. 2025',  '#B6D2F0', [5042, 38778, 51229]),
    ('RKAP 2026',   '#5888D4', [5064, 45802, 48074]),
    ('Progn. 2026', '#C07808', [6409, 47766, 74627]),
    ('RKAP 2027',   '#020E1C', [6596, 49035, 80609]),
]

# DERUM by entity — RKAP 2027 (IDR Juta)
cabang_labels = ['Cabang Utama','IKPP','Bojonegara']
cabang_data   = [75079, 60203, 959]
cabang_colors = ['#1358A4','#5888D4','#B6D2F0']
cabang_total  = 136241   # sum

# TUKS — Pemanduan + Penundaan, Progn 2026 vs RKAP 2027
tuks_labels = [['Pemanduan'],['Penundaan']]
tuks_periods = [
    ('Prognosa 2026', '#5888D4', [31638, 174701]),
    ('RKAP 2027',     '#020E1C', [32413, 179068]),
]

# Konsolidasi DERUM vs TUKS (Progn 2026, RKAP 2027)
kons_progn = [('DERUM', 128802), ('TUKS', 206339)]   # total 335141
kons_rkap  = [('DERUM', 136241), ('TUKS', 211481)]   # total 347722
kons_total_progn = 335141
kons_total_rkap  = 347722

# Growth percentages (per Sheet1 AI col = RKAP 2027 / Progn 2026)
g_pem   = 2.9     # 1.0292-1
g_penun = 2.7     # 1.0266-1
g_penam = 8.0     # 1.0802-1
g_derum = 5.8     # 1.0578-1
g_tuks  = 2.5     # 1.0249-1
g_kons  = 3.8     # 347722/335141-1
g_vs_2025_derum = 43.3  # 1.4333-1

# ══════════════════════════════════════════════════════════════════════════════
# HTML
# ══════════════════════════════════════════════════════════════════════════════
HTML = f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Kertas Kerja A3 — Prognosa 2026 & RKAP 2027</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Serif+Display&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<style>
{CSS}
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

<!-- ═══════ HEADER (LOCKED) ═══════ -->
<div class="hdr">
  <div class="hdr-bar">
    <div class="hdr-bar-left">
      <div class="logo-wrapper"><img class="logo-pelindo" src="{PELINDO_B64}" alt="Pelindo"></div>
      <div class="bar-sep"></div>
      <div class="logo-wrapper"><img class="logo-danantara" src="{DANANTARA_B64}" alt="Danantara Indonesia"></div>
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
      <div class="eyebrow">Kertas Kerja A3 Keuangan · Rev-3</div>
      <div class="hdr-title">Prognosa <em>2026</em> &amp; RKAP <em>2027</em></div>
      <div class="hdr-sub">Pendapatan Konsolidasi Pelayanan Kapal — DERUM &amp; TUKS · Ciwandan, IKPP, Bojonegara</div>
    </div>
    <div class="hdr-badges">
      <div class="hdr-badge"><div class="hdr-badge-v">IDR 347,7 M</div><div class="hdr-badge-l">Konsolidasi RKAP 2027</div></div>
      <div class="hdr-badge"><div class="hdr-badge-v">+3,8%</div><div class="hdr-badge-l">vs Prognosa 2026</div></div>
      <div class="hdr-badge"><div class="hdr-badge-v">IDR 211,5 M</div><div class="hdr-badge-l">TUKS RKAP 2027</div></div>
      <div class="hdr-badge"><div class="hdr-badge-v">+43,3%</div><div class="hdr-badge-l">DERUM vs Realisasi 2025</div></div>
    </div>
  </div>
</div>

<div class="body">

  <!-- ═══════ RINGKASAN EKSEKUTIF (mandatory, BEFORE KPI) ═══════ -->
  <div class="insight">
    <div class="insight-t">Ringkasan Eksekutif</div>
    <div class="insight-b">
      Konsolidasi Pelayanan Kapal RKAP 2027 ditargetkan <b>IDR 347,7 Miliar</b> — naik <b>+3,8%</b>
      dari Prognosa 2026 dan <b>+43,3%</b> di atas Realisasi 2025 (basis DERUM). <b>TUKS mendominasi 60,8%</b>
      total (IDR 211,5 M), sementara <b>Penambatan DERUM +8,0%</b> menjadi kontributor tunggal terbesar
      dengan IDR 80,6 M. <i>Cabang Utama (Ciwandan) menopang 55,1% DERUM — konsentrasi perlu menjadi prioritas pengelolaan risiko.</i>
    </div>
  </div>

  <!-- ═══════ KPI STRIP (5 cards — RKAP 2027 figures, Δ vs Progn 2026) ═══════ -->
  <div class="sec">Indikator Kinerja RKAP 2027 · IDR Juta</div>
  <div class="kpi-row n5">
    <div class="kpi">
      <div class="k-lbl">Pemanduan RKAP 2027</div>
      <div class="k-val">6.596<span class="k-unit">Juta</span></div>
      <div class="k-delta cu">▲ +{g_pem:.1f}% vs Progn 2026</div>
      <div class="k-track"><div class="k-fill" style="width:82%"></div></div>
    </div>
    <div class="kpi gr">
      <div class="k-lbl">Penundaan RKAP 2027</div>
      <div class="k-val">49.035<span class="k-unit">Juta</span></div>
      <div class="k-delta cu">▲ +{g_penun:.1f}% vs Progn 2026</div>
      <div class="k-track"><div class="k-fill" style="width:88%"></div></div>
    </div>
    <div class="kpi am">
      <div class="k-lbl">Penambatan RKAP 2027</div>
      <div class="k-val">80.609<span class="k-unit">Juta</span></div>
      <div class="k-delta cu">▲ +{g_penam:.1f}% — kontributor tertinggi</div>
      <div class="k-track"><div class="k-fill" style="width:96%"></div></div>
    </div>
    <div class="kpi pu">
      <div class="k-lbl">Total TUKS RKAP 2027</div>
      <div class="k-val">211.481<span class="k-unit">Juta</span></div>
      <div class="k-delta cu">▲ +{g_tuks:.1f}% vs Progn 2026</div>
      <div class="k-track"><div class="k-fill" style="width:78%"></div></div>
    </div>
    <div class="kpi rd">
      <div class="k-lbl">Konsolidasi RKAP 2027</div>
      <div class="k-val">347.722<span class="k-unit">Juta</span></div>
      <div class="k-delta cu">▲ +{g_kons:.1f}% vs Progn 2026</div>
      <div class="k-track"><div class="k-fill" style="width:85%"></div></div>
    </div>
  </div>

  <!-- ═══════ ROW 1 (.row2) — Wide trend + Konsolidasi composition ═══════ -->
  <div class="row2">

    <!-- Story 1: DERUM trend 2023-2027 -->
    <div class="card">
      <div class="card-t">Tren Pendapatan Pelayanan Kapal — DERUM</div>
      <div class="card-s">RKAP 2027 melampaui Prognosa 2026 sebesar +5,8% — kelanjutan pertumbuhan struktural sejak 2023</div>
      <div class="leg">
        <span class="li"><span class="ls" style="background:#B6D2F0"></span>2023 Audited</span>
        <span class="li"><span class="ls" style="background:#6CA4E0"></span>2024 Audited</span>
        <span class="li"><span class="ls" style="background:#1358A4"></span>2025 Unaudited</span>
        <span class="li"><span class="ls" style="background:#093460"></span>RKAP 2026</span>
        <span class="li"><span class="ls" style="background:#C07808"></span>Prognosa 2026</span>
        <span class="li"><span class="ls" style="background:#020E1C"></span>RKAP 2027</span>
      </div>
      <div class="cw" style="height:248px"><canvas id="cTren"></canvas></div>
      <div class="nb">
        <div class="nb-t">Catatan Analisis</div>
        <div class="nb-b">DERUM melonjak dari IDR 55,1 M (2023) ke IDR 136,2 M (RKAP 2027) — pertumbuhan 2,5× dalam 4 tahun. Lompatan terbesar terjadi di Prognosa 2026 (+30,2% vs RKAP 2026) seiring koreksi tarif &amp; rebound Penambatan.</div>
      </div>
    </div>

    <!-- Story 2: Konsolidasi DERUM vs TUKS composition -->
    <div class="card">
      <div class="card-t">Komposisi Konsolidasi — DERUM vs TUKS</div>
      <div class="card-s">TUKS menyumbang &gt;60% total — dominasi konsisten antara Progn 2026 dan RKAP 2027</div>

      <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8AAAC2;margin-bottom:8px">Prognosa 2026 · Total IDR 335,1 M</div>
      <div class="pb-row"><div class="pb-l">DERUM</div><div class="pb-trk"><div class="pb-fill" style="width:38.4%;background:#2278D8"></div></div><div class="pb-v">128.802<span class="pb-p">(38,4%)</span></div></div>
      <div class="pb-row" style="margin-bottom:0"><div class="pb-l">TUKS</div><div class="pb-trk"><div class="pb-fill" style="width:61.6%;background:#020E1C"></div></div><div class="pb-v">206.339<span class="pb-p">(61,6%)</span></div></div>

      <div class="div"></div>

      <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8AAAC2;margin-bottom:8px">RKAP 2027 · Total IDR 347,7 M</div>
      <div class="pb-row"><div class="pb-l">DERUM</div><div class="pb-trk"><div class="pb-fill" style="width:39.2%;background:#2278D8"></div></div><div class="pb-v">136.241<span class="pb-p">(39,2%)</span></div></div>
      <div class="pb-row" style="margin-bottom:0"><div class="pb-l">TUKS</div><div class="pb-trk"><div class="pb-fill" style="width:60.8%;background:#020E1C"></div></div><div class="pb-v">211.481<span class="pb-p">(60,8%)</span></div></div>

      <table class="t" style="margin-top:14px">
        <thead><tr><th>Segmen</th><th class="r">Progn. 2026</th><th class="r">RKAP 2027</th><th class="r">Growth</th></tr></thead>
        <tbody>
          <tr><td>DERUM</td><td class="r">128.802</td><td class="r fw">136.241</td><td class="r"><span class="bdg b-g">+5,8%</span></td></tr>
          <tr><td>TUKS</td><td class="r">206.339</td><td class="r fw">211.481</td><td class="r"><span class="bdg b-g">+2,5%</span></td></tr>
          <tr class="tt"><td>Konsolidasi</td><td class="r">335.141</td><td class="r">347.722</td><td class="r"><span class="bdg b-g">+3,8%</span></td></tr>
        </tbody>
      </table>
    </div>

  </div>

  <!-- ═══════ ROW 2 (.row-eq3) — DERUM component + Entity + TUKS detail ═══════ -->
  <div class="row-eq3">

    <!-- Story 3: DERUM component breakdown -->
    <div class="card">
      <div class="card-t">Breakdown Komponen DERUM</div>
      <div class="card-s">Penambatan melampaui Penundaan sejak Progn 2026 — pergeseran struktur pendapatan</div>
      <div class="leg">
        <span class="li"><span class="ls" style="background:#B6D2F0"></span>Real. 2025</span>
        <span class="li"><span class="ls" style="background:#5888D4"></span>RKAP 2026</span>
        <span class="li"><span class="ls" style="background:#C07808"></span>Progn. 2026</span>
        <span class="li"><span class="ls" style="background:#020E1C"></span>RKAP 2027</span>
      </div>
      <div class="cw" style="height:218px"><canvas id="cKomp"></canvas></div>
      <div class="sg">
        <div class="sb"><div class="sl">vs Real. 2025</div><div class="sv">+{g_vs_2025_derum:.1f}%</div></div>
        <div class="sb"><div class="sl">vs RKAP 2026</div><div class="sv">+37,7%</div></div>
        <div class="sb"><div class="sl">vs Progn. 2026</div><div class="sv">+{g_derum:.1f}%</div></div>
      </div>
    </div>

    <!-- Story 4: DERUM by entity donut -->
    <div class="card">
      <div class="card-t">Kontribusi Cabang — DERUM RKAP 2027</div>
      <div class="card-s">Cabang Utama (Ciwandan) menopang 55,1% — konsentrasi tertinggi dalam konsolidasi DERUM</div>
      <div class="cw" style="height:188px"><canvas id="cCabang"></canvas></div>
      <div style="margin-top:11px">
        <div class="cbg"><div class="cbg-l"><span class="cbg-dot" style="background:#1358A4"></span><span class="cbg-n">Cabang Utama</span></div><div><span class="cbg-v">75.079</span><span class="cbg-p">55,1%</span></div></div>
        <div class="cbg"><div class="cbg-l"><span class="cbg-dot" style="background:#5888D4"></span><span class="cbg-n">IKPP</span></div><div><span class="cbg-v">60.203</span><span class="cbg-p">44,2%</span></div></div>
        <div class="cbg"><div class="cbg-l"><span class="cbg-dot" style="background:#B6D2F0"></span><span class="cbg-n">Bojonegara</span></div><div><span class="cbg-v">959</span><span class="cbg-p">0,7%</span></div></div>
        <div class="cbg tot"><div class="cbg-l"><span class="cbg-n fw" style="color:#020E1C">Total DERUM</span></div><div><span class="cbg-v">136.241</span></div></div>
      </div>
    </div>

    <!-- Story 5: TUKS detail -->
    <div class="card">
      <div class="card-t">Detail Pendapatan TUKS</div>
      <div class="card-s">Penundaan menyumbang 84,7% TUKS — komposisi stabil antara Progn 2026 &amp; RKAP 2027</div>
      <div class="leg">
        <span class="li"><span class="ls" style="background:#5888D4"></span>Prognosa 2026</span>
        <span class="li"><span class="ls" style="background:#020E1C"></span>RKAP 2027</span>
      </div>
      <div class="cw" style="height:172px"><canvas id="cTUKS"></canvas></div>

      <div style="margin-top:13px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8AAAC2;margin-bottom:8px">Proporsi Komponen TUKS — RKAP 2027</div>
        <div class="splt">
          <div class="splt-bar">
            <div class="ss" style="width:15.3%;background:#2278D8"><span>Pem. 15,3%</span></div>
            <div class="ss" style="width:84.7%;background:#020E1C"><span>Penundaan 84,7%</span></div>
          </div>
        </div>
      </div>

      <div class="ins">
        <div class="ins-t">Growth RKAP 2027 vs Progn 2026</div>
        <div class="ins-g">
          <div><div class="ins-l">Pemanduan</div><div class="ins-v">+2,4%</div></div>
          <div><div class="ins-l">Penundaan</div><div class="ins-v">+2,5%</div></div>
        </div>
      </div>
    </div>

  </div>

  <!-- ═══════ STATUS BAR ═══════ -->
  <div class="sbar">
    <span class="sbar-ttl">Key Takeaways</span>
    <div class="sbar-list">
      <div class="si ok"><span class="dot dok"></span>RKAP 2027 vs Progn 2026: Konsolidasi +3,8% (IDR 347,7 M)</div>
      <div class="si ok"><span class="dot dok"></span>Penambatan DERUM +8,0% — kontributor tunggal terbesar (IDR 80,6 M)</div>
      <div class="si ok"><span class="dot dok"></span>DERUM RKAP 2027 vs Real 2025: +43,3% — pertumbuhan struktural</div>
      <div class="si wn"><span class="dot dwn"></span>Cabang Utama dominasi 55,1% DERUM — konsentrasi perlu dipantau</div>
      <div class="si ok"><span class="dot dok"></span>TUKS RKAP 2027 +2,5% — pemulihan bertahap dari Progn 2026</div>
    </div>
  </div>

  <!-- ═══════ RECOMMENDATIONS (mandatory, inside #page) ═══════ -->
  <div class="rec">
    <div class="rec-hdr">
      <span class="rec-title">Rekomendasi &amp; Tindak Lanjut</span>
      <span class="rec-sub">Berdasarkan analisis data laporan ini</span>
    </div>
    <div class="rec-cols">

      <div class="rec-col rc-op">
        <div class="rec-col-hdr">Operasional</div>
        <div class="rec-card">
          <div class="rec-h">Siapkan kapasitas dermaga untuk ekspansi Penambatan DERUM +8,0%</div>
          <div class="rec-p">Penambatan DERUM naik dari IDR 74,6 M (Progn 2026) ke IDR 80,6 M (RKAP 2027) — pertumbuhan tertinggi. Pastikan alokasi dermaga, SDM, &amp; tarif tambat mendukung realisasi target ini.</div>
          <span class="rec-when">Jangka Pendek</span>
        </div>
      </div>

      <div class="rec-col rc-st">
        <div class="rec-col-hdr">Strategis</div>
        <div class="rec-card">
          <div class="rec-h">Diversifikasi pendapatan untuk kurangi konsentrasi Cabang Utama &amp; TUKS</div>
          <div class="rec-p">Cabang Utama menopang 55,1% DERUM (IDR 75,1 M) dan TUKS 60,8% total konsolidasi (IDR 211,5 M). Konsentrasi dua titik ini menciptakan risiko pendapatan — kembangkan layanan di IKPP &amp; Bojonegara.</div>
          <span class="rec-when">Jangka Menengah</span>
        </div>
      </div>

      <div class="rec-col rc-rk">
        <div class="rec-col-hdr">Risiko</div>
        <div class="rec-card">
          <div class="rec-h">Validasi asumsi pemulihan TUKS sebelum finalisasi RKAP 2027</div>
          <div class="rec-p">TUKS Progn 2026 (IDR 206,3 M) masih −8,3% di bawah Realisasi 2025 (IDR 225,0 M). Asumsi +2,5% di RKAP 2027 perlu didukung data kontrak &amp; proyeksi trafik tongkang.</div>
          <span class="rec-when">Validasi</span>
        </div>
      </div>

    </div>
  </div>

</div><!-- /.body -->

<div class="ftr">
  <span>Kertas Kerja A3 — Prognosa 2026 &amp; RKAP 2027 (Keuangan Rev-3) — PT Pelabuhan Indonesia (Persero)</span>
  <span>Disiapkan: Juni 2026 · Seluruh angka dalam IDR Juta kecuali header badge (Miliar)</span>
</div>

</div><!-- /#page -->

<script>
Chart.register(ChartDataLabels);
Chart.defaults.font.family = "'Outfit', Arial, sans-serif";
Chart.defaults.devicePixelRatio = window.devicePixelRatio * 2;
Chart.defaults.plugins.datalabels = {{ display: false }};

const XTICKS = {{ maxRotation:0, minRotation:0, font:{{size:9}}, color:'#7B98B5' }};

// ── 1) DERUM Trend 2023-2027 (single-series bar with on-canvas datalabels) ──
new Chart(document.getElementById('cTren'),{{
  type:'bar',
  data:{{
    labels: {tren_labels},
    datasets: [{{
      label: 'Pendapatan DERUM',
      data: {tren_data},
      backgroundColor: {tren_colors},
      borderRadius: 6, borderSkipped: false,
      barPercentage: 0.62, categoryPercentage: 0.88,
      datalabels: {{
        display: true, align: 'top', anchor: 'end', offset: 2,
        color: '#061628', font: {{ weight: 700, size: 10 }},
        backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 3,
        padding: {{ top:1, bottom:1, left:4, right:4 }},
        formatter: (v, ctx) => {{
          if (ctx.dataIndex === 5) return v.toLocaleString('id-ID') + ' \\u25B2';
          return v.toLocaleString('id-ID');
        }}
      }}
    }}]
  }},
  options: {{
    responsive: true, maintainAspectRatio: false,
    plugins: {{
      legend: {{ display: false }},
      tooltip: {{ callbacks: {{ label: c => ` ${{c.dataset.label}}: IDR ${{c.parsed.y.toLocaleString('id-ID')}} Juta` }} }}
    }},
    scales: {{
      x: {{ ticks: XTICKS, grid: {{ display: false }} }},
      y: {{
        grid: {{ color: '#EAF1FA' }}, border: {{ display: false }},
        ticks: {{ font: {{ size: 10 }}, color: '#9AB4CC', callback: v => (v/1000).toFixed(0)+'K', maxTicksLimit: 6 }},
        max: 165000
      }}
    }}
  }}
}});

// ── 2) DERUM Component Grouped Bar (4 datasets × 3 components) ──
new Chart(document.getElementById('cKomp'),{{
  type:'bar',
  data:{{
    labels: {komp_labels},
    datasets: [
      {{label:'Real. 2025',  data:[5042,38778,51229], backgroundColor:'#B6D2F0', borderRadius:3, borderSkipped:false, barPercentage:0.68, categoryPercentage:0.90}},
      {{label:'RKAP 2026',   data:[5064,45802,48074], backgroundColor:'#5888D4', borderRadius:3, borderSkipped:false, barPercentage:0.68, categoryPercentage:0.90}},
      {{label:'Progn. 2026', data:[6409,47766,74627], backgroundColor:'#C07808', borderRadius:3, borderSkipped:false, barPercentage:0.68, categoryPercentage:0.90}},
      {{label:'RKAP 2027',   data:[6596,49035,80609], backgroundColor:'#020E1C', borderRadius:3, borderSkipped:false, barPercentage:0.68, categoryPercentage:0.90,
        datalabels: {{
          display: true, align: 'top', anchor: 'end', offset: 2,
          color: '#061628', font: {{ weight: 700, size: 9 }},
          backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 3,
          padding: {{ top:1, bottom:1, left:3, right:3 }},
          formatter: v => v.toLocaleString('id-ID')
        }}
      }}
    ]
  }},
  options: {{
    responsive: true, maintainAspectRatio: false,
    plugins: {{
      legend: {{ display: false }},
      tooltip: {{ callbacks: {{ label: c => ` ${{c.dataset.label}}: ${{c.parsed.y.toLocaleString('id-ID')}} Juta` }} }}
    }},
    scales: {{
      x: {{ ticks: XTICKS, grid: {{ display: false }} }},
      y: {{
        grid: {{ color: '#EAF1FA' }}, border: {{ display: false }},
        ticks: {{ font: {{ size: 10 }}, color: '#9AB4CC', callback: v => (v/1000).toFixed(0)+'K' }},
        max: 96000
      }}
    }}
  }}
}});

// ── 3) DERUM by Entity Donut (with center label + segment %) ──
new Chart(document.getElementById('cCabang'),{{
  type:'doughnut',
  data:{{
    labels: {cabang_labels},
    datasets: [{{
      data: {cabang_data},
      backgroundColor: {cabang_colors},
      borderWidth: 3, borderColor: '#fff', hoverOffset: 10,
      datalabels: {{
        display: true, color: '#fff', font: {{ weight: 700, size: 11 }},
        textAlign: 'center',
        formatter: (v, ctx) => {{
          const total = ctx.dataset.data.reduce((a,b)=>a+b,0);
          const pct = (v/total*100);
          return pct < 3 ? '' : Math.round(pct) + '%';
        }}
      }}
    }}]
  }},
  options: {{
    responsive: true, maintainAspectRatio: false, cutout: '63%',
    plugins: {{
      legend: {{ display: false }},
      tooltip: {{
        callbacks: {{
          label: c => {{
            const total = c.dataset.data.reduce((a,b)=>a+b,0);
            return ` ${{c.label}}: IDR ${{c.parsed.toLocaleString('id-ID')}} Juta (${{(c.parsed/total*100).toFixed(1)}}%)`;
          }}
        }}
      }}
    }}
  }},
  plugins: [{{ id:'cl', afterDraw(chart) {{
    const {{ctx, chartArea:{{left,top,right,bottom}}}} = chart;
    const cx=(left+right)/2, cy=(top+bottom)/2;
    ctx.save(); ctx.textAlign='center';
    ctx.fillStyle='#9AB4CC'; ctx.font='400 11px Outfit,Arial,sans-serif';
    ctx.fillText('RKAP 2027', cx, cy-9);
    ctx.fillStyle='#061628'; ctx.font='700 17px Outfit,Arial,sans-serif';
    ctx.fillText('IDR 136,2 M', cx, cy+11);
    ctx.restore();
  }} }}]
}});

// ── 4) TUKS Detail Grouped Bar (Progn 2026 vs RKAP 2027) ──
new Chart(document.getElementById('cTUKS'),{{
  type:'bar',
  data:{{
    labels: {tuks_labels},
    datasets: [
      {{label:'Prognosa 2026', data:[31638,174701], backgroundColor:'#5888D4', borderRadius:5, borderSkipped:false, barPercentage:0.58, categoryPercentage:0.85,
        datalabels: {{
          display: true, align: 'top', anchor: 'end', offset: 2,
          color: '#061628', font: {{ weight: 700, size: 9.5 }},
          backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 3,
          padding: {{ top:1, bottom:1, left:3, right:3 }},
          formatter: v => v.toLocaleString('id-ID')
        }}
      }},
      {{label:'RKAP 2027',     data:[32413,179068], backgroundColor:'#020E1C', borderRadius:5, borderSkipped:false, barPercentage:0.58, categoryPercentage:0.85,
        datalabels: {{
          display: true, align: 'top', anchor: 'end', offset: 2,
          color: '#061628', font: {{ weight: 700, size: 9.5 }},
          backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 3,
          padding: {{ top:1, bottom:1, left:3, right:3 }},
          formatter: v => v.toLocaleString('id-ID')
        }}
      }}
    ]
  }},
  options: {{
    responsive: true, maintainAspectRatio: false,
    plugins: {{
      legend: {{ display: false }},
      tooltip: {{ callbacks: {{ label: c => ` ${{c.dataset.label}}: ${{c.parsed.y.toLocaleString('id-ID')}} Juta` }} }}
    }},
    scales: {{
      x: {{ ticks: XTICKS, grid: {{ display: false }} }},
      y: {{
        grid: {{ color: '#EAF1FA' }}, border: {{ display: false }},
        ticks: {{ font: {{ size: 10 }}, color: '#9AB4CC', callback: v => (v/1000).toFixed(0)+'K' }},
        max: 215000
      }}
    }}
  }}
}});

// ── Export: captures only #page ──
async function doExport() {{
  const btn = document.getElementById('exportBtn');
  const bar = document.getElementById('progressBar');
  btn.disabled = true; btn.textContent = 'Generating…';
  let p = 0;
  const t = setInterval(() => {{ p = Math.min(p+5,85); bar.style.width = p+'%'; }}, 120);
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise(r => setTimeout(r, 200));
  try {{
    const el = document.getElementById('page');
    const canvas = await html2canvas(el, {{
      scale: 3, useCORS: true, allowTaint: true,
      backgroundColor: '#E8EEF7', logging: false, imageTimeout: 0,
      width: el.offsetWidth, height: el.offsetHeight,
      windowWidth: el.offsetWidth, windowHeight: el.offsetHeight,
      scrollX: 0, scrollY: 0, x: 0, y: 0
    }});
    clearInterval(t); bar.style.width = '100%';
    const a = document.createElement('a');
    a.download = 'RKAP2027_Konsolidasi_KertasKerjaA3.png';
    a.href = canvas.toDataURL('image/png', 1.0);
    a.click();
  }} catch(e) {{ console.error(e); clearInterval(t); }}
  setTimeout(() => {{
    bar.style.width = '0'; btn.disabled = false;
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export High Quality PNG`;
  }}, 800);
}}
</script>
</body>
</html>
'''

with open(OUT_PATH, 'w', encoding='utf-8') as f:
    f.write(HTML)

print(f'OK -> {OUT_PATH}')
print(f'Size: {os.path.getsize(OUT_PATH):,} bytes')
