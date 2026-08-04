"""
Generate the Kopkar kantin July 2026 HTML dashboard report.
Reads _juli_2026.json (aggregated data) and kopkar-logo.b64.
"""
import sys, json, os
sys.stdout.reconfigure(encoding='utf-8')

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SKILL_ASSETS = r'C:\Users\bradl\.claude\skills\kopkar-skill\assets'

with open(os.path.join(HERE, '_juli_2026.json'), encoding='utf-8') as f:
    D = json.load(f)
with open(os.path.join(SKILL_ASSETS, 'kopkar-logo.b64'), encoding='utf-8-sig') as f:
    LOGO = f.read().strip()
assert LOGO.startswith('data:image/png;base64,'), "logo corrupted"

# ---------- locale helpers (id-ID) ----------
def grp(n):
    return f"{n:,.0f}".replace(',', '.')
def money_short(n):
    return f"Rp {n/1_000_000:,.2f} jt".replace(',', 'x').replace('.', ',').replace('x', '.')
def pct(n, digits=1):
    return f"{n:.{digits}f}%".replace('.', ',')

# ---------- pull values ----------
T = D['totals']
K = D['kategori']
omzet      = T['omzet']; modal = T['modal']; laba = T['laba']
margin_pct = T['margin_pct']; rp_kredit = T['rp_kredit']; rp_tunai = T['rp_tunai']
stock_val  = T['stock_value']
n_produk   = T['n_produk']; n_active = T['n_active']; n_dead = T['n_dead']
n_dead_no_stock = T['n_dead_no_stock']; n_dead_with_stock = T['n_dead_with_stock']
dead_stock_value = T['dead_stock_value']
kredit_share = T['kredit_share_pct']; hpp_ratio = T['hpp_ratio_pct']

k_order = sorted(K.keys(), key=lambda k: -K[k]['omzet'])
K_CHART = [(k, K[k]) for k in k_order if K[k]['omzet'] > 0]

KATEGORI_COLOR = {'MINUMAN':'#C01828','MAKANAN':'#0B8A60','ROKOK':'#E46018',
                  'LAIN2':'#C00C6C','OBAT':'#84909C'}
KATEGORI_FALLBACK = ['#7A0C1A', '#C07808', '#D2596A']
def k_color(k, idx):
    return KATEGORI_COLOR.get(k, KATEGORI_FALLBACK[idx % len(KATEGORI_FALLBACK)])
K_DISPLAY = {'MINUMAN':'Minuman','MAKANAN':'Makanan','ROKOK':'Rokok',
             'LAIN2':'Lain-lain','OBAT':'Obat'}

produk = D['produk']
top_omzet = sorted([p for p in produk if p['omzet']>0], key=lambda x:-x['omzet'])[:8]
top_laba  = sorted([p for p in produk if p['laba']>0],  key=lambda x:-x['laba'])[:8]
dead_with_stock = sorted([p for p in produk if p['terjual']==0 and p['sisa']>0],
                         key=lambda x:-(x['hpp']*x['sisa']))

# ---------- STATIC CSS (plain string, no f-string) ----------
CSS = """
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background:#E4D2D6; display:flex; flex-direction:column; align-items:center;
        padding:40px 0 60px; font-family:'Outfit',Arial,sans-serif; -webkit-font-smoothing:antialiased; }
#toolbar { width:1400px; display:flex; justify-content:flex-end; margin-bottom:16px; }
#page    { width:1400px; background:#F7EDEF; overflow:hidden;
            font-size:13px; color:#3A2228; line-height:1.45;
            box-shadow:0 8px 40px rgba(0,0,0,0.18); }
.body    { padding:24px 36px 32px; }
.sec     { font-size:9px; font-weight:700; letter-spacing:2.8px; text-transform:uppercase;
            color:#AE8C92; margin-bottom:12px; }

.hdr { background:linear-gradient(112deg,#2A0710 0%,#7A0C1A 44%,#C01828 78%,#D83048 100%);
        padding:0; position:relative; overflow:hidden; }
.hdr::before { content:''; position:absolute; right:-50px; top:-70px; width:260px; height:260px;
               border-radius:50%; background:rgba(255,255,255,0.05); pointer-events:none; }
.hdr::after  { content:''; position:absolute; right:190px; bottom:-90px; width:180px; height:180px;
               border-radius:50%; background:rgba(255,255,255,0.04); pointer-events:none; }
.hdr-bar { padding:11px 44px 10px; border-bottom:1px solid rgba(255,255,255,0.13);
            display:flex; align-items:center; justify-content:space-between; position:relative; z-index:2; }
.hdr-bar-left  { display:flex; align-items:center; gap:14px; }
.hdr-bar-right { display:flex; align-items:center; gap:8px; }
.logo-wrapper   { padding:5px 8px; background:rgba(255,255,255,0.88); backdrop-filter:blur(6px);
                  -webkit-backdrop-filter:blur(6px); border-radius:8px;
                  box-shadow:inset 0 0 0 1px rgba(255,255,255,0.35); }
.logo-kopkar    { height:30px; width:auto; display:block; flex-shrink:0; }
.bar-sep      { width:1px; height:24px; background:rgba(255,255,255,0.22); flex-shrink:0; }
.bar-tagline  { font-size:10.5px; font-weight:400; color:rgba(255,255,255,0.52);
                letter-spacing:0.2px; line-height:1.35; }
.bar-tagline strong { font-weight:700; font-size:11px; color:rgba(255,255,255,0.88); display:block; }
.bar-chip { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.16);
            border-radius:5px; padding:3px 9px; font-size:9px; font-weight:700;
            color:rgba(255,255,255,0.5); letter-spacing:0.8px; text-transform:uppercase; }
.hdr-main { padding:18px 44px 20px; display:flex; align-items:center; justify-content:space-between;
            gap:28px; position:relative; z-index:2; }
.hdr-left { min-width:0; }
.eyebrow  { font-size:9.5px; font-weight:700; letter-spacing:3px; text-transform:uppercase;
             color:#FFA9B4; margin-bottom:6px; }
.hdr-title { font-family:'DM Serif Display',Georgia,serif; font-size:33px; font-weight:400;
             color:#fff; line-height:1.1; white-space:nowrap; }
.hdr-title em { color:#FFB3BD; font-style:normal; }
.hdr-sub   { font-size:12px; color:rgba(255,255,255,0.5); margin-top:6px; }
.hdr-badges  { display:flex; gap:11px; flex-shrink:0; }
.hdr-badge   { background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2);
                border-radius:11px; padding:11px 18px; text-align:center; min-width:124px; }
.hdr-badge-v { font-size:18px; font-weight:700; color:#fff; line-height:1; }
.hdr-badge-l { font-size:9.5px; font-weight:500; color:rgba(255,255,255,0.46); margin-top:4px; }

#exportBtn { display:flex; align-items:center; gap:8px;
              background:linear-gradient(135deg,#7A0C1A,#C01828);
              color:#fff; border:none; border-radius:10px; padding:12px 24px;
              font-family:'Outfit',Arial,sans-serif; font-size:13px; font-weight:600;
              cursor:pointer; box-shadow:0 4px 18px rgba(122,12,26,0.45);
              transition:transform .15s, box-shadow .15s; }
#exportBtn:hover    { transform:translateY(-2px); box-shadow:0 8px 24px rgba(122,12,26,0.55); }
#exportBtn:disabled { opacity:0.55; cursor:not-allowed; transform:none; }
#progressBar { position:fixed; top:0; left:0; height:3px; width:0%;
                background:linear-gradient(90deg,#C01828,#3DD6A0);
                z-index:9999; transition:width 0.25s ease; }

.insight   { background:#FCF2F4; border-left:5px solid #C01828; border-radius:10px;
              padding:13px 20px; margin-bottom:18px; display:flex; gap:18px; align-items:flex-start; }
.insight-t { font-size:8.5px; font-weight:700; letter-spacing:2px; text-transform:uppercase;
              color:#C01828; flex-shrink:0; padding-top:3px; width:96px; }
.insight-b { font-size:12.5px; color:#52353B; line-height:1.62; }
.insight-b b { color:#2A0710; font-weight:700; }
.insight-b i { color:#C07808; font-style:normal; font-weight:600; }

.kpi-row { display:grid; gap:12px; margin-bottom:20px; }
.kpi-row.n5 { grid-template-columns: repeat(5,1fr); }
.kpi  { background:#fff; border-radius:12px; padding:15px 17px 13px;
         border-top:3px solid #7A0C1A; box-shadow:0 1px 6px rgba(42,7,16,0.09); }
.kpi.gr { border-top-color:#0B8A60; }
.kpi.am { border-top-color:#C07808; }
.kpi.mg { border-top-color:#C00C6C; }
.kpi.rd { border-top-color:#C42317; }
.k-lbl  { font-size:9px; font-weight:700; letter-spacing:.5px; text-transform:uppercase;
           color:#A98A90; margin-bottom:6px; }
.k-val  { font-size:23px; font-weight:700; color:#2A0710; line-height:1; }
.k-unit { font-size:10px; font-weight:400; color:#C4A9AD; margin-left:2px; }
.k-delta { font-size:10.5px; font-weight:600; margin-top:5px; }
.cu { color:#0B8A60; } .cd { color:#C42317; } .cn { color:#AE8C92; }
.k-track { height:3px; background:#F5E4E7; border-radius:2px; margin-top:9px; }
.k-fill  { height:3px; border-radius:2px; }

.row-eq2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
.row-1   { margin-bottom:14px; }

.card   { background:#fff; border-radius:14px; padding:18px 20px 16px;
           box-shadow:0 1px 6px rgba(42,7,16,0.09); }
.card-t { font-size:13px; font-weight:600; color:#2A0710; margin-bottom:2px; }
.card-s { font-size:10.5px; color:#AE8C92; margin-bottom:13px; }

.cw { position:relative; width:100%; }

.t { width:100%; border-collapse:collapse; font-size:11.5px; }
.t thead th { background:#FCF2F4; color:#A98A90; font-weight:700; font-size:9.5px;
              text-transform:uppercase; letter-spacing:.5px; padding:7px 9px;
              text-align:left; border-bottom:1.5px solid #F0DCE0; }
.t thead th.r { text-align:right; }
.t tbody td { padding:6.5px 9px; border-bottom:1px solid #F7E9EC; color:#52353B; vertical-align:middle; }
.t tbody td.r { text-align:right; }
.t tbody tr:last-child td { border-bottom:none; }
.t .tt td { background:#FAE4E8; font-weight:700; color:#2A0710; }
.t .hl td { background:#F8D8DE; color:#2A0710; }
.fw { font-weight:700; } .red { color:#C42317; } .bl { color:#9C0C18; }

.nb { margin-top:12px; padding:10px 12px; background:#FCF2F4; border-radius:10px; border-left:3px solid #C01828; }
.nb.am { border-left-color:#C07808; background:#FFFBF3; }
.nb-t { font-size:10px; font-weight:700; color:#C01828; margin-bottom:3px; }
.nb.am .nb-t { color:#985200; }
.nb-b { font-size:10px; color:#6B454C; line-height:1.55; }

.splt-l { font-size:11.5px; color:#52353B; font-weight:600; margin-bottom:6px; }
.splt-bar { display:flex; height:38px; border-radius:8px; overflow:hidden;
             box-shadow:inset 0 0 0 1px rgba(42,7,16,0.06); }
.ss { display:flex; flex-direction:column; justify-content:center; padding:0 12px; color:#fff; }
.ss span { font-size:11px; font-weight:700; line-height:1.1; }
.ss small { font-size:9.5px; opacity:.85; }

.spli { display:flex; align-items:center; gap:6px; font-size:11px; color:#52353B; }
.spls { width:10px; height:10px; border-radius:2px; }

.sbar    { background:#2A0710; border-radius:12px; padding:14px 24px 16px; }
.sbar-ttl{ font-size:8.5px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase;
            color:#F08A98; display:block; margin-bottom:11px; }
.sbar-list{ display:grid; grid-template-columns:1fr 1fr; gap:7px 28px; }
.si { display:flex; align-items:center; gap:6px; font-size:11px; font-weight:500;
       padding:5px 8px; border-radius:8px; background:rgba(255,255,255,0.05); }
.ok { color:#45D099; } .wn { color:#FFBB38; }
.dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.dok { background:#45D099; } .dwn { background:#FFBB38; }

.rec { border-radius:14px; overflow:hidden; box-shadow:0 3px 18px rgba(42,7,16,0.16); margin-top:14px; margin-bottom:14px; }
.rec-hdr { background:linear-gradient(112deg,#2A0710 0%,#7A0C1A 60%,#C01828 100%); padding:16px 28px;
          display:flex; align-items:baseline; justify-content:space-between; position:relative; overflow:hidden; }
.rec-hdr::before { content:''; position:absolute; right:-30px; top:-40px; width:160px; height:160px;
                  border-radius:50%; background:rgba(255,255,255,0.04); pointer-events:none; }
.rec-title { font-family:'DM Serif Display',Georgia,serif; font-size:20px; font-weight:400; color:#fff; }
.rec-sub { font-size:10px; color:rgba(255,255,255,0.42); font-style:italic; }
.rec-cols { display:grid; grid-template-columns:1fr 1fr 1fr; gap:0; }
.rec-col { padding:18px 22px; display:flex; flex-direction:column; gap:10px; }
.rc-op { background:#F6FCF9; }
.rc-st { background:#FDF3F5; }
.rc-rk { background:#FFFBF3; }
.rec-col-hdr { font-size:8.5px; font-weight:700; letter-spacing:2px; text-transform:uppercase;
              padding-bottom:10px; border-bottom:2px solid; margin-bottom:4px; }
.rc-op .rec-col-hdr { color:#0B8A60; border-bottom-color:#0B8A60; }
.rc-st .rec-col-hdr { color:#C01828; border-bottom-color:#C01828; }
.rc-rk .rec-col-hdr { color:#C07808; border-bottom-color:#C07808; }
.rec-card { background:#fff; border-radius:10px; padding:13px 15px; border-left:4px solid;
           display:flex; flex-direction:column; gap:5px; box-shadow:0 1px 4px rgba(42,7,16,0.07); }
.rc-op .rec-card { border-left-color:#0B8A60; }
.rc-st .rec-card { border-left-color:#C01828; }
.rc-rk .rec-card { border-left-color:#C07808; }
.rec-h { font-size:12px; font-weight:700; color:#2A0710; line-height:1.35; }
.rec-p { font-size:10.5px; color:#6B454C; line-height:1.52; }
.rec-when { display:inline-block; font-size:8px; font-weight:700; letter-spacing:1px; text-transform:uppercase;
           padding:3px 9px; border-radius:99px; margin-top:4px; align-self:flex-start; }
.rc-op .rec-when { background:#D9F5E8; color:#0A6C3E; }
.rc-st .rec-when { background:#FBE0E4; color:#9C0C18; }
.rc-rk .rec-when { background:#FEF0D8; color:#985200; }

.ftr { background:#2A0710; padding:10px 36px; display:flex; justify-content:space-between; align-items:center; }
.ftr span { font-size:9.5px; color:rgba(255,255,255,0.3); }
"""

# ---------- COMPUTED CHART DATA ----------
big_kateg = [k for k in ['MINUMAN','ROKOK','MAKANAN'] if k in K]
gb_labels = [[K_DISPLAY[k], pct(K[k]['omzet']/omzet*100) + " omzet"] for k in big_kateg]
gb_omzet  = [round(K[k]['omzet']/1_000_000, 2) for k in big_kateg]
gb_modal  = [round(K[k]['modal']/1_000_000, 2) for k in big_kateg]
gb_laba   = [round(K[k]['laba']/1_000_000, 2)  for k in big_kateg]

dn_labels = [K_DISPLAY[k] for k,_ in K_CHART]
dn_values = [round(v['omzet']/1_000_000, 2) for _,v in K_CHART]
dn_colors = [k_color(k, i) for i,(k,_) in enumerate(K_CHART)]

RANK_COLORS = ['#2A0710','#7A0C1A','#C01828','#D2596A','#E08794','#E08794','#F3C9CF','#F3C9CF']

top_o = [(p['nama'].title(), p['omzet']) for p in top_omzet]
top_l = [(p['nama'].title(), p['laba'])  for p in top_laba]
top_o_labels = [t[0] for t in top_o]
top_o_values = [t[1] for t in top_o]
top_l_labels = [t[0] for t in top_l]
top_l_values = [t[1] for t in top_l]
top_o_max = max(top_o_values) * 1.18
top_l_max = max(top_l_values) * 1.18

# Per-kategori kredit share rows for the kredit/tunai table
kredit_rows = []
for k in ['MINUMAN','ROKOK','MAKANAN']:
    v = K[k]
    ksh = v['rp_kredit']/v['omzet']*100 if v['omzet'] else 0
    kredit_rows.append((k, v['omzet'], ksh))

# Dead-stock rows
dead_rows = [(p['nama'].title(), K_DISPLAY.get(p['kategori'], p['kategori']),
              p['sisa'], p['satuan'], p['hpp']*p['sisa']) for p in dead_with_stock]

# ---------- BUILD HTML ----------
html = []
html.append('<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="UTF-8">\n')
html.append('<title>Laporan Penjualan Kantin Juli 2026 — Kopkar Bandar Banten</title>\n')
html.append('<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Serif+Display&display=swap" rel="stylesheet">\n')
html.append('<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>\n')
html.append('<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>\n')
html.append('<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>\n')
html.append('<style>\n' + CSS + '\n</style>\n</head>\n<body>\n')
html.append('<div id="progressBar"></div>\n')
# Toolbar
html.append("""<div id="toolbar">
  <button id="exportBtn" onclick="doExport()">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    Export High Quality PNG
  </button>
</div>
""")
html.append('<div id="page">\n')

# ----- HEADER -----
html.append(f"""<div class="hdr">
  <div class="hdr-bar">
    <div class="hdr-bar-left">
      <div class="logo-wrapper"><img class="logo-kopkar" src="{LOGO}" alt="Kopkar Bandar Banten"></div>
      <div class="bar-sep"></div>
      <div class="bar-tagline">
        <strong>Koperasi Karyawan Bandar Banten</strong>
        Unit Usaha Kantin
      </div>
    </div>
    <div class="hdr-bar-right">
      <span class="bar-chip">Dokumen Internal</span>
      <span class="bar-chip">Executive Summary</span>
    </div>
  </div>
  <div class="hdr-main">
    <div class="hdr-left">
      <div class="eyebrow">Laporan Penjualan · Juli 2026</div>
      <div class="hdr-title">Kinerja <em>Kantin</em> Juli 2026</div>
      <div class="hdr-sub">Rekap penjualan, omzet, laba kotor &amp; kategori — 90 produk, 5 kategori</div>
    </div>
    <div class="hdr-badges">
      <div class="hdr-badge"><div class="hdr-badge-v">{money_short(omzet)}</div><div class="hdr-badge-l">Omzet Juli 2026</div></div>
      <div class="hdr-badge"><div class="hdr-badge-v">{money_short(laba)}</div><div class="hdr-badge-l">Laba Kotor</div></div>
      <div class="hdr-badge"><div class="hdr-badge-v">{pct(margin_pct)}</div><div class="hdr-badge-l">Margin Laba</div></div>
      <div class="hdr-badge"><div class="hdr-badge-v">{pct(kredit_share)}</div><div class="hdr-badge-l">Porsi Kredit</div></div>
    </div>
  </div>
</div>
<div class="body">
""")

# ----- INSIGHT BAND -----
rokok_margin_pct = K['ROKOK']['laba']/K['ROKOK']['omzet']*100
html.append(f"""  <div class="insight">
    <div class="insight-t">Ringkasan Eksekutif</div>
    <div class="insight-b">
      Kantin membukukan omzet <b>{money_short(omzet)}</b> pada Juli 2026 dengan laba kotor
      <b>{money_short(laba)}</b> (margin <b>{pct(margin_pct)}</b>). Omzet ditopang
      <b>Minuman ({pct(K['MINUMAN']['omzet']/omzet*100)})</b> dan <b>Rokok ({pct(K['ROKOK']['omzet']/omzet*100)})</b>,
      namun Rokok hanya menyumbang {pct(K['ROKOK']['laba']/laba*100)} laba karena margin tipis ({pct(rokok_margin_pct)}),
      sementara Makanan berkontribusi <b>{pct(K['MAKANAN']['laba']/laba*100)} laba</b> dari {pct(K['MAKANAN']['omzet']/omzet*100)} omzet.
      <i>Sebanyak {n_dead} dari {n_produk} produk tidak mencatat penjualan bulan ini; stock opname cocok dengan sisa stok tercatat (selisih Rp 0).</i>
    </div>
  </div>
  <div class="sec">Indikator Utama</div>
""")

# ----- KPI STRIP (n5) -----
html.append(f"""  <div class="kpi-row n5">
    <div class="kpi">
      <div class="k-lbl">Omzet Juli 2026</div>
      <div class="k-val">{money_short(omzet)}</div>
      <div class="k-delta cn">Kredit {pct(kredit_share)} · Tunai {pct(100-kredit_share)}</div>
      <div class="k-track"><div class="k-fill" style="width:100.0%;background:#7A0C1A"></div></div>
    </div>
    <div class="kpi gr">
      <div class="k-lbl">Laba Kotor</div>
      <div class="k-val">{money_short(laba)}</div>
      <div class="k-delta cu">▲ {pct(margin_pct)} margin (omzet − modal)</div>
      <div class="k-track"><div class="k-fill" style="width:{margin_pct:.1f}%;background:#0B8A60"></div></div>
    </div>
    <div class="kpi">
      <div class="k-lbl">Margin Laba Kotor</div>
      <div class="k-val">{pct(margin_pct)}<span class="k-unit"></span></div>
      <div class="k-delta cn">Rasio HPP {pct(hpp_ratio)} dari omzet</div>
      <div class="k-track"><div class="k-fill" style="width:{margin_pct:.1f}%;background:#C01828"></div></div>
    </div>
    <div class="kpi am">
      <div class="k-lbl">Porsi Penjualan Kredit</div>
      <div class="k-val">{pct(kredit_share)}<span class="k-unit"></span></div>
      <div class="k-delta cd">▼ Piutang {money_short(rp_kredit)} · Kas tunai {money_short(rp_tunai)}</div>
      <div class="k-track"><div class="k-fill" style="width:{kredit_share:.1f}%;background:#C07808"></div></div>
    </div>
    <div class="kpi mg">
      <div class="k-lbl">Item Aktif / Total Katalog</div>
      <div class="k-val">{n_active}<span class="k-unit">/ {n_produk}</span></div>
      <div class="k-delta cd">▼ {n_dead} produk tanpa penjualan</div>
      <div class="k-track"><div class="k-fill" style="width:{n_active/n_produk*100:.1f}%;background:#C00C6C"></div></div>
    </div>
  </div>
  <div class="sec">Analisis Penjualan</div>
""")

# ----- ROW 1: Grouped bar | Donut -----
donut_legend = ''.join(
    f'<div class="spli"><span class="spls" style="background:{c}"></span>{l} — {pct(v*1_000_000/omzet*100)}</div>'
    for (l, v, c) in zip(dn_labels, dn_values, dn_colors)
)
html.append(f"""  <div class="row-eq2">
    <div class="card">
      <div class="card-t">Omzet, Modal &amp; Laba per Kategori</div>
      <div class="card-s">Makanan berkontribusi laba tertinggi per rupiah omzet — margin {pct(K['MAKANAN']['laba']/K['MAKANAN']['omzet']*100)} vs Rokok {pct(rokok_margin_pct)}</div>
      <div class="cw" style="height:320px"><canvas id="cGrouped"></canvas></div>
      <div class="nb">
        <div class="nb-t">Catatan Kontras Margin</div>
        <div class="nb-b">Rokok menyerap <b>{pct(K['ROKOK']['omzet']/omzet*100)} omzet</b> tetapi hanya <b>{pct(K['ROKOK']['laba']/laba*100)} laba</b>. Sebaliknya Makanan menyumbang <b>{pct(K['MAKANAN']['laba']/laba*100)} laba</b> dari {pct(K['MAKANAN']['omzet']/omzet*100)} omzet — menggeser bauran ke Makanan menaikkan laba tanpa menambah omzet.</div>
      </div>
    </div>
    <div class="card">
      <div class="card-t">Komposisi Omzet per Kategori</div>
      <div class="card-s">Minuman + Rokok menyerap {pct((K['MINUMAN']['omzet']+K['ROKOK']['omzet'])/omzet*100)} omzet kantin</div>
      <div class="cw" style="height:260px"><canvas id="cDonut"></canvas></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:11px;">
        {donut_legend}
      </div>
    </div>
  </div>
""")

# ----- ROW 2: Top omzet | Top laba -----
top2_omzet_share = (top_omzet[0]['omzet']+top_omzet[1]['omzet'])/omzet*100
html.append(f"""  <div class="row-eq2">
    <div class="card">
      <div class="card-t">Top 8 Produk berdasarkan Omzet</div>
      <div class="card-s">Dua produk air mineral (AQUA GALON &amp; LE MINERAL 330 ML) menyumbang {pct(top2_omzet_share)} omzet</div>
      <div class="cw" style="height:340px"><canvas id="cTopOmzet"></canvas></div>
    </div>
    <div class="card">
      <div class="card-t">Top 8 Produk berdasarkan Laba Kotor</div>
      <div class="card-s">INDOMIE masuk top-3 laba walau peringkat omzetnya kecil — margin 63,4%</div>
      <div class="cw" style="height:340px"><canvas id="cTopLaba"></canvas></div>
    </div>
  </div>
""")

# ----- ROW 3: Kredit vs Tunai | Dead stock -----
html.append(f"""  <div class="row-eq2">
    <div class="card">
      <div class="card-t">Penjualan Kredit vs Tunai</div>
      <div class="card-s">{pct(kredit_share)} omzet adalah piutang anggota — kas tunai bulan ini hanya {money_short(rp_tunai)}</div>
      <div style="margin-top:6px;">
        <div class="splt-l">Total omzet Juli 2026 — {grp(omzet)}</div>
        <div class="splt-bar">
          <div class="ss" style="width:{kredit_share:.1f}%; background:#7A0C1A;">
            <span>Kredit {pct(kredit_share)}</span>
            <small>{grp(rp_kredit)}</small>
          </div>
          <div class="ss" style="width:{100-kredit_share:.1f}%; background:#0B8A60;">
            <span>Tunai {pct(100-kredit_share)}</span>
            <small>{grp(rp_tunai)}</small>
          </div>
        </div>
      </div>
      <table class="t" style="margin-top:18px;">
        <thead><tr><th>Kategori</th><th class="r">Omzet</th><th class="r">% Kredit</th></tr></thead>
        <tbody>
""")
for k, k_omz, ksh in kredit_rows:
    html.append(f"""          <tr><td><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:{k_color(k,0)};margin-right:6px;vertical-align:middle;"></span>{K_DISPLAY[k]}</td>
            <td class="r">{grp(k_omz)}</td><td class="r fw">{pct(ksh)}</td></tr>
""")
html.append(f"""          <tr class="tt"><td>Total</td><td class="r">{grp(omzet)}</td><td class="r">{pct(kredit_share)}</td></tr>
        </tbody>
      </table>
      <div class="nb am">
        <div class="nb-t">Eksposur Piutang</div>
        <div class="nb-b">Dari omzet {money_short(omzet)}, sebanyak <b>{money_short(rp_kredit)}</b> ({pct(kredit_share)}) tercatat sebagai penjualan kredit. Kantin menanggung seluruh modal di muka — kas masuk tertunda hingga pelunasan.</div>
      </div>
    </div>
    <div class="card">
      <div class="card-t">Produk Tanpa Penjualan &amp; Stok Tertinggal</div>
      <div class="card-s">{n_dead} dari {n_produk} produk tidak terjual; {n_dead_with_stock} masih berstok (modal {money_short(dead_stock_value)} terikat)</div>
      <table class="t">
        <thead><tr><th>Produk</th><th>Kategori</th><th class="r">Sisa</th><th class="r">Modal Terikat</th></tr></thead>
        <tbody>
""")
for nama, kat, sisa, sat, val in dead_rows:
    html.append(f"""          <tr><td>{nama}</td><td>{kat}</td>
            <td class="r">{grp(sisa)} {sat}</td><td class="r fw red">{grp(val)}</td></tr>
""")
html.append(f"""          <tr class="tt"><td colspan="3">{n_dead_no_stock} produk lain — terjual 0 &amp; sisa 0 (tidak ada modal terikat)</td><td class="r">Rp 0</td></tr>
        </tbody>
      </table>
      <div class="nb">
        <div class="nb-t">Catatan Stok &amp; Opname</div>
        <div class="nb-b">Nilai sisa stok total <b>{money_short(stock_val)}</b> ({pct(stock_val/omzet*100)} omzet sebulan). Stock opname cocok dengan HPP × sisa stok — <b>selisih Rp 0</b>, tidak ada indikasi shrinkage.</div>
      </div>
    </div>
  </div>
""")

# ----- STATUS BAR -----
html.append(f"""  <div class="sbar">
    <span class="sbar-ttl">Key Takeaways</span>
    <div class="sbar-list">
      <div class="si ok"><span class="dot dok"></span>Omzet {money_short(omzet)} → laba kotor {money_short(laba)} (margin {pct(margin_pct)})</div>
      <div class="si ok"><span class="dot dok"></span>Makanan kontributor laba terbaik per rupiah omzet — margin {pct(K['MAKANAN']['laba']/K['MAKANAN']['omzet']*100)}</div>
      <div class="si ok"><span class="dot dok"></span>Stock opname cocok sisa stok tercatat — selisih Rp 0 (tidak ada shrinkage)</div>
      <div class="si wn"><span class="dot dwn"></span>Rokok menyerap {pct(K['ROKOK']['omzet']/omzet*100)} omzet, hanya {pct(K['ROKOK']['laba']/laba*100)} laba (margin {pct(rokok_margin_pct)})</div>
      <div class="si wn"><span class="dot dwn"></span>{pct(kredit_share)} omzet adalah piutang — kas tunai hanya {money_short(rp_tunai)}</div>
      <div class="si wn"><span class="dot dwn"></span>{n_dead} dari {n_produk} produk tidak terjual bulan ini</div>
    </div>
  </div>
""")

# ----- RECOMMENDATIONS -----
html.append(f"""  <div class="rec">
    <div class="rec-hdr">
      <span class="rec-title">Rekomendasi &amp; Tindak Lanjut</span>
      <span class="rec-sub">Berdasarkan analisis data laporan ini</span>
    </div>
    <div class="rec-cols">
      <div class="rec-col rc-op">
        <div class="rec-col-hdr">Operasional</div>
        <div class="rec-card">
          <div class="rec-h">Pangkas katalog {n_dead_no_stock} produk tanpa stok dan tanpa penjualan</div>
          <div class="rec-p">Dari {n_produk} produk, {n_dead} tidak terjual — {n_dead_no_stock} di antaranya bahkan tidak berstok. Katalog ini membebani pencatatan tanpa menghasilkan omzet.</div>
          <span class="rec-when">Segera</span>
        </div>
        <div class="rec-card">
          <div class="rec-h">Tinjau ulang margin Rokok — kini hanya {pct(rokok_margin_pct)}</div>
          <div class="rec-p">Rokok menyerap {pct(K['ROKOK']['omzet']/omzet*100)} omzet ({money_short(K['ROKOK']['omzet'])}) tetapi hanya menyumbang {pct(K['ROKOK']['laba']/laba*100)} laba. Margin 9,2% pada S. AMild Merah nyaris tidak menutup biaya penanganan.</div>
          <span class="rec-when">Jangka Pendek</span>
        </div>
      </div>
      <div class="rec-col rc-st">
        <div class="rec-col-hdr">Strategis</div>
        <div class="rec-card">
          <div class="rec-h">Geser bauran penjualan ke produk bermargin tinggi</div>
          <div class="rec-p">Makanan hanya {pct(K['MAKANAN']['omzet']/omzet*100)} omzet tetapi {pct(K['MAKANAN']['laba']/laba*100)} laba; Rokok {pct(K['ROKOK']['omzet']/omzet*100)} omzet hanya {pct(K['ROKOK']['laba']/laba*100)} laba. Menggeser bauran menaikkan laba tanpa menaikkan omzet.</div>
          <span class="rec-when">Jangka Menengah</span>
        </div>
      </div>
      <div class="rec-col rc-rk">
        <div class="rec-col-hdr">Risiko</div>
        <div class="rec-card">
          <div class="rec-h">Batasi eksposur piutang — {pct(kredit_share)} omzet belum jadi kas</div>
          <div class="rec-p">Dari omzet {money_short(omzet)}, sebanyak {money_short(rp_kredit)} tercatat sebagai penjualan kredit. Tetapkan plafon kredit per anggota dan jadwal penagihan tetap agar kas masuk lebih dapat diprediksi.</div>
          <span class="rec-when">Validasi</span>
        </div>
        <div class="rec-card">
          <div class="rec-h">Validasi data TEH KOTAK — margin tercatat negatif</div>
          <div class="rec-p">Harga jual Rp 6.000 vs HPP Rp 33.750 menghasilkan margin −462%. Diduga HPP diisi per dus sementara harga jual per pcs. Perlu koreksi master data sebelum margin per kategori dipercaya sepenuhnya.</div>
          <span class="rec-when">Monitor</span>
        </div>
      </div>
    </div>
  </div>
""")

# ----- CLOSE body + footer -----
html.append(f"""</div>
<div class="ftr">
  <span>Laporan Penjualan Kantin Juli 2026 — Koperasi Karyawan Bandar Banten · Unit Usaha Kantin</span>
  <span>Disiapkan: Juli 2026 · Seluruh angka dalam Rupiah penuh kecuali disebutkan lain</span>
</div>
</div>
""")

# ----- CHART JS -----
gb_labels_json = json.dumps(gb_labels)
gb_omzet_json  = json.dumps(gb_omzet)
gb_modal_json  = json.dumps(gb_modal)
gb_laba_json   = json.dumps(gb_laba)
dn_labels_json = json.dumps(dn_labels)
dn_values_json = json.dumps(dn_values)
dn_colors_json = json.dumps(dn_colors)
top_o_labels_json = json.dumps(top_o_labels)
top_o_values_json = json.dumps(top_o_values)
top_l_labels_json = json.dumps(top_l_labels)
top_l_values_json = json.dumps(top_l_values)
omzet_short = money_short(omzet)

JS = f"""
Chart.register(ChartDataLabels);
Chart.defaults.font.family = "'Outfit', Arial, sans-serif";
Chart.defaults.devicePixelRatio = window.devicePixelRatio * 2;
Chart.defaults.plugins.datalabels = {{ display: false }};

// Grouped bar
new Chart(document.getElementById('cGrouped'), {{
  type: 'bar',
  data: {{
    labels: {gb_labels_json},
    datasets: [
      {{ label:'Omzet', data:{gb_omzet_json},
        backgroundColor:'#C01828', borderRadius:4, borderSkipped:false,
        barPercentage:0.72, categoryPercentage:0.88,
        datalabels:{{ display:true, align:'top', anchor:'end', offset:2,
          color:'#2A0710', font:{{weight:700,size:10}},
          backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3,
          padding:{{top:1,bottom:1,left:4,right:4}},
          formatter:v => v.toLocaleString('id-ID',{{minimumFractionDigits:1}}) + ' M' }} }},
      {{ label:'Modal', data:{gb_modal_json},
        backgroundColor:'#E08794', borderRadius:4, borderSkipped:false,
        barPercentage:0.72, categoryPercentage:0.88,
        datalabels:{{ display:true, align:'top', anchor:'end', offset:2,
          color:'#2A0710', font:{{weight:700,size:10}},
          backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3,
          padding:{{top:1,bottom:1,left:4,right:4}},
          formatter:v => v.toLocaleString('id-ID',{{minimumFractionDigits:1}}) + ' M' }} }},
      {{ label:'Laba', data:{gb_laba_json},
        backgroundColor:'#0B8A60', borderRadius:4, borderSkipped:false,
        barPercentage:0.72, categoryPercentage:0.88,
        datalabels:{{ display:true, align:'top', anchor:'end', offset:2,
          color:'#2A0710', font:{{weight:700,size:10}},
          backgroundColor:'rgba(255,255,255,0.82)', borderRadius:3,
          padding:{{top:1,bottom:1,left:4,right:4}},
          formatter:v => v.toLocaleString('id-ID',{{minimumFractionDigits:1}}) + ' M' }} }}
    ]
  }},
  options: {{
    responsive:true, maintainAspectRatio:false,
    layout:{{ padding:{{ top:18 }} }},
    scales: {{
      x: {{ ticks:{{ maxRotation:0, minRotation:0, font:{{size:10}}, color:'#52353B' }},
            grid:{{ display:false }} }},
      y: {{ beginAtZero:true,
            ticks:{{ font:{{size:9}}, color:'#A98A90',
                    callback:v => v.toLocaleString('id-ID') + ' M' }},
            grid:{{ color:'#F5E7EA' }},
            title:{{ display:true, text:'Rp juta', font:{{size:9}}, color:'#A98A90' }} }}
    }},
    plugins: {{
      legend: {{ display:true, position:'bottom',
                 labels:{{ font:{{size:10}}, color:'#52353B', boxWidth:10, boxHeight:10, padding:14 }} }},
      tooltip: {{ callbacks:{{ label: c => ' ' + c.dataset.label + ': Rp ' + c.parsed.y.toLocaleString('id-ID',{{minimumFractionDigits:2}}) + ' M' }} }}
    }}
  }}
}});

// Donut
new Chart(document.getElementById('cDonut'), {{
  type: 'doughnut',
  data: {{
    labels: {dn_labels_json},
    datasets: [{{
      data: {dn_values_json},
      backgroundColor: {dn_colors_json},
      borderWidth: 3, borderColor: '#fff', hoverOffset: 10,
      datalabels: {{
        display:true, color:'#fff', font:{{ weight:700, size:11 }}, textAlign:'center',
        formatter:(v, ctx) => {{
          const total = ctx.dataset.data.reduce((a,b)=>a+b,0);
          return Math.round(v/total*100) + '%';
        }}
      }}
    }}]
  }},
  options: {{
    responsive:true, maintainAspectRatio:false, cutout:'63%',
    plugins: {{
      legend:{{ display:false }},
      tooltip:{{ callbacks:{{ label: c => {{
        const total = c.dataset.data.reduce((a,b)=>a+b,0);
        return ' ' + c.label + ': Rp ' + c.parsed.toLocaleString('id-ID') + ' M (' + Math.round(c.parsed/total*100) + '%)';
      }} }} }}
    }}
  }},
  plugins:[{{ id:'cl', afterDraw(chart){{
    const ctx = chart.ctx;
    const area = chart.chartArea;
    const cx = (area.left+area.right)/2, cy = (area.top+area.bottom)/2;
    ctx.save(); ctx.textAlign='center';
    ctx.fillStyle='#BFA0A5'; ctx.font='400 11px Outfit,Arial,sans-serif';
    ctx.fillText('Total Omzet', cx, cy-9);
    ctx.fillStyle='#2A0710'; ctx.font='700 17px Outfit,Arial,sans-serif';
    ctx.fillText('{omzet_short}', cx, cy+11);
    ctx.restore();
  }} }}]
}});

// Top produk by Omzet (horizontal)
new Chart(document.getElementById('cTopOmzet'), {{
  type:'bar',
  data:{{
    labels: {top_o_labels_json},
    datasets:[{{
      data: {top_o_values_json},
      backgroundColor: {json.dumps(RANK_COLORS[:len(top_o_values)])},
      borderRadius:4, borderSkipped:false,
      barPercentage:0.78, categoryPercentage:0.92,
      datalabels:{{
        display:true, align:'right', anchor:'end', offset:5,
        color:'#2A0710', font:{{ weight:700, size:10 }}, textAlign:'left',
        formatter:(v, ctx) => {{
          const total = ctx.dataset.data.reduce((a,b)=>a+b,0);
          return v.toLocaleString('id-ID') + '  (' + Math.round(v/total*100) + '%)';
        }}
      }}
    }}]
  }},
  options:{{
    indexAxis:'y', responsive:true, maintainAspectRatio:false,
    layout:{{ padding:{{ right:90 }} }},
    scales:{{
      x:{{ beginAtZero:true, max:{top_o_max:.0f},
           ticks:{{ font:{{size:9}}, color:'#A98A90',
                   callback:v => (v/1000000).toLocaleString('id-ID') + ' M' }},
           grid:{{ color:'#F5E7EA' }} }},
      y:{{ ticks:{{ font:{{size:10.5, weight:500}}, color:'#52353B' }}, grid:{{ display:false }} }}
    }},
    plugins:{{
      legend:{{ display:false }},
      tooltip:{{ callbacks:{{
        label: c => {{
          const total = c.dataset.data.reduce((a,b)=>a+b,0);
          return ' Omzet: Rp ' + c.parsed.x.toLocaleString('id-ID') + ' (' + Math.round(c.parsed.x/total*100) + '% top-8)';
        }}
      }} }}
    }}
  }}
}});

// Top produk by Laba (horizontal)
new Chart(document.getElementById('cTopLaba'), {{
  type:'bar',
  data:{{
    labels: {top_l_labels_json},
    datasets:[{{
      data: {top_l_values_json},
      backgroundColor: {json.dumps(RANK_COLORS[:len(top_l_values)])},
      borderRadius:4, borderSkipped:false,
      barPercentage:0.78, categoryPercentage:0.92,
      datalabels:{{
        display:true, align:'right', anchor:'end', offset:5,
        color:'#2A0710', font:{{ weight:700, size:10 }}, textAlign:'left',
        formatter:(v, ctx) => {{
          const total = ctx.dataset.data.reduce((a,b)=>a+b,0);
          return v.toLocaleString('id-ID') + '  (' + Math.round(v/total*100) + '%)';
        }}
      }}
    }}]
  }},
  options:{{
    indexAxis:'y', responsive:true, maintainAspectRatio:false,
    layout:{{ padding:{{ right:90 }} }},
    scales:{{
      x:{{ beginAtZero:true, max:{top_l_max:.0f},
           ticks:{{ font:{{size:9}}, color:'#A98A90',
                   callback:v => (v/1000000).toLocaleString('id-ID') + ' M' }},
           grid:{{ color:'#F5E7EA' }} }},
      y:{{ ticks:{{ font:{{size:10.5, weight:500}}, color:'#52353B' }}, grid:{{ display:false }} }}
    }},
    plugins:{{
      legend:{{ display:false }},
      tooltip:{{ callbacks:{{
        label: c => {{
          const total = c.dataset.data.reduce((a,b)=>a+b,0);
          return ' Laba kotor: Rp ' + c.parsed.x.toLocaleString('id-ID') + ' (' + Math.round(c.parsed.x/total*100) + '% top-8)';
        }}
      }} }}
    }}
  }}
}});

async function doExport() {{
  const btn = document.getElementById('exportBtn');
  const bar = document.getElementById('progressBar');
  btn.disabled = true; btn.textContent = 'Generating…';
  let p = 0;
  const t = setInterval(() => {{ p = Math.min(p+5,85); bar.style.width = p+'%'; }}, 120);
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 200));
  try {{
    const el = document.getElementById('page');
    const canvas = await html2canvas(el, {{
      scale: 3, useCORS: true, allowTaint: true,
      backgroundColor: '#F7EDEF', logging: false, imageTimeout: 0,
      width: el.offsetWidth, height: el.offsetHeight,
      windowWidth: el.offsetWidth, windowHeight: el.offsetHeight,
      scrollX: 0, scrollY: 0, x: 0, y: 0
    }});
    clearInterval(t); bar.style.width = '100%';
    const a = document.createElement('a');
    a.download = 'JUAL2026-07_Kantin_RekapPenjualan.png';
    a.href = canvas.toDataURL('image/png', 1.0);
    a.click();
  }} catch(e) {{ console.error(e); clearInterval(t); }}
  setTimeout(() => {{
    bar.style.width = '0'; btn.disabled = false;
    btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export High Quality PNG';
  }}, 800);
}}
"""
html.append('<script>\n' + JS + '\n</script>\n</body>\n</html>\n')

# ---------- WRITE OUT ----------
out_dir = os.path.join(ROOT, 'html-reports')
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, 'JUAL2026-07_Kantin_RekapPenjualan.html')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(''.join(html))
print(f"Wrote: {out_path}")
print(f"Size:  {os.path.getsize(out_path):,} bytes")
