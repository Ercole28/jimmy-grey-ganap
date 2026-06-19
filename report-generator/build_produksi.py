import base64, io

# --- Logos (reuse processed base64 from existing reference, same source PNGs) ---
with open('C:/Users/bradl/AppData/Local/Temp/opencode/pelindo_b64.txt') as f:
    PEL = f.read().strip()
with open('C:/Users/bradl/AppData/Local/Temp/opencode/bumn_b64.txt') as f:
    BUM = f.read().strip()

HTML = r'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Produksi Pelabuhan Regional 2 Banten 2026 — s.d. Mei</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Serif+Display&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#cbd5e8;display:flex;flex-direction:column;align-items:center;padding:40px 0 60px;font-family:'Outfit',Arial,sans-serif;-webkit-font-smoothing:antialiased;}

#toolbar{width:1400px;display:flex;justify-content:flex-end;margin-bottom:16px;}
#exportBtn{display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#0B3868,#1459A8);color:#fff;border:none;border-radius:10px;padding:12px 24px;font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 18px rgba(11,56,104,0.45);transition:transform .15s,box-shadow .15s;}
#exportBtn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(11,56,104,0.55)}
#exportBtn:disabled{opacity:0.55;cursor:not-allowed;transform:none}
#progressBar{position:fixed;top:0;left:0;height:3px;width:0%;background:linear-gradient(90deg,#1459A8,#3DD6A0);z-index:9999;transition:width 0.25s ease;}

#page{width:1400px;background:#E8EEF7;overflow:hidden;font-size:13px;color:#1A2C42;line-height:1.45;box-shadow:0 8px 40px rgba(0,0,0,0.18);}

/* HEADER (locked) */
.hdr{background:linear-gradient(112deg,#061628 0%,#0B3464 44%,#1358A4 78%,#1C6CC0 100%);padding:0;position:relative;overflow:hidden;}
.hdr::before{content:'';position:absolute;right:-50px;top:-70px;width:260px;height:260px;border-radius:50%;background:rgba(255,255,255,0.05);pointer-events:none}
.hdr::after{content:'';position:absolute;right:190px;bottom:-90px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.04);pointer-events:none}
.hdr-bar{padding:11px 44px 10px;border-bottom:1px solid rgba(255,255,255,0.13);display:flex;align-items:center;justify-content:space-between;position:relative;z-index:2;}
.hdr-bar-left{display:flex;align-items:center;gap:14px;}
.logo-pelindo{height:28px;width:auto;display:block;flex-shrink:0;filter:brightness(1.3);}
.logo-bumn{height:24px;width:auto;display:block;flex-shrink:0;filter:brightness(1.6);}
.bar-sep{width:1px;height:24px;background:rgba(255,255,255,0.22);flex-shrink:0;}
.bar-tagline{font-size:10.5px;font-weight:400;color:rgba(255,255,255,0.52);letter-spacing:0.2px;line-height:1.35;}
.bar-tagline strong{font-weight:700;font-size:11px;color:rgba(255,255,255,0.88);display:block;}
.hdr-bar-right{display:flex;align-items:center;gap:8px;}
.bar-chip{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);border-radius:5px;padding:3px 9px;font-size:9px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:0.8px;text-transform:uppercase;}
.hdr-main{padding:18px 44px 20px;display:flex;align-items:center;justify-content:space-between;gap:28px;position:relative;z-index:2;}
.hdr-left{min-width:0;}
.eyebrow{font-size:9.5px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#79B8FF;margin-bottom:6px;}
.hdr-title{font-family:'DM Serif Display',Georgia,serif;font-size:33px;font-weight:400;color:#fff;line-height:1.1;white-space:nowrap;}
.hdr-title em{color:#90CAFF;font-style:normal;}
.hdr-sub{font-size:12px;color:rgba(255,255,255,0.5);margin-top:6px;}
.hdr-badges{display:flex;gap:11px;flex-shrink:0;}
.hdr-badge{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:11px;padding:11px 18px;text-align:center;min-width:124px;}
.hdr-badge-v{font-size:18px;font-weight:700;color:#fff;line-height:1;}
.hdr-badge-l{font-size:9.5px;font-weight:500;color:rgba(255,255,255,0.46);margin-top:4px;}

/* BODY */
.body{padding:24px 36px 32px}
.sec{font-size:9px;font-weight:700;letter-spacing:2.8px;text-transform:uppercase;color:#8AAAC2;margin-bottom:12px}

/* INSIGHT BAND */
.insight{background:#F1F6FC;border-left:5px solid #1358A4;border-radius:10px;padding:13px 20px;margin-bottom:18px;display:flex;gap:18px;align-items:flex-start;}
.insight-t{font-size:8.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1358A4;flex-shrink:0;padding-top:3px;width:96px;}
.insight-b{font-size:12.5px;color:#284058;line-height:1.62;}
.insight-b b{color:#061628;font-weight:700;}
.insight-b i{color:#C07808;font-style:normal;font-weight:600;}

/* KPI */
.kpi-row{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:18px;}
.kpi{background:#fff;border-radius:12px;padding:15px 17px 13px;border-top:3px solid #1358A4;box-shadow:0 1px 6px rgba(6,22,40,0.09)}
.kpi.gr{border-top-color:#0B8A60}.kpi.am{border-top-color:#C07808}.kpi.pu{border-top-color:#5135AE}
.k-lbl{font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#7B98B5;margin-bottom:6px}
.k-val{font-size:23px;font-weight:700;color:#061628;line-height:1}
.k-unit{font-size:10px;font-weight:400;color:#A0BACC;margin-left:2px}
.k-delta{font-size:10.5px;font-weight:600;margin-top:5px}
.cu{color:#0B8A60}.cd{color:#BC1E1E}.cn{color:#8AAAC2}
.k-track{height:3px;background:#E8F0F8;border-radius:2px;margin-top:9px}
.k-fill{height:3px;border-radius:2px}

/* GRID ROWS */
.row2{display:grid;grid-template-columns:856px 1fr;gap:14px;margin-bottom:14px;}
.row3{display:grid;grid-template-columns:430px 370px 1fr;gap:14px;margin-bottom:20px;}

/* CARD */
.card{background:#fff;border-radius:14px;padding:18px 20px 16px;box-shadow:0 1px 6px rgba(6,22,40,0.09)}
.card-t{font-size:13px;font-weight:600;color:#061628;margin-bottom:2px}
.card-s{font-size:10.5px;color:#8AAAC2;margin-bottom:13px}
.card-s b{color:#1358A4;font-weight:600}

/* LEGEND */
.leg{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:10px}
.leg.cx{justify-content:center}
.li{display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:500;color:#486480}
.ls{width:10px;height:10px;border-radius:2px;flex-shrink:0}
.lsp{width:14px;height:0;border-top:2.5px solid #C07808;flex-shrink:0}

/* CHART WRAP */
.cw{position:relative;width:100%}

/* TABLE */
.t{width:100%;border-collapse:collapse;font-size:11.5px}
.t thead th{background:#F1F6FC;color:#7B98B5;font-weight:700;font-size:9.5px;text-transform:uppercase;letter-spacing:.5px;padding:7px 9px;text-align:left;border-bottom:1.5px solid #DCE8F4}
.t thead th.r{text-align:right}
.t tbody td{padding:6.5px 9px;border-bottom:1px solid #ECF2FA;color:#284058;vertical-align:middle}
.t tbody td.r{text-align:right}
.t tbody tr:last-child td{border-bottom:none}
.t .tt td{background:#E8F1FB;font-weight:700;color:#061628}
.t .hl td{background:#DCEFFE;color:#061628}
.fw{font-weight:700}.red{color:#BC1E1E}.bl{color:#0E4A90}
.muted{color:#A0BACC;font-size:9.5px;font-style:italic}

/* BADGE */
.bdg{display:inline-block;padding:2px 8px;border-radius:99px;font-size:9.5px;font-weight:700}
.b-g{background:#D9F5E8;color:#0A6C3E}.b-a{background:#FEF0D8;color:#985200}.b-b{background:#D9EFFE;color:#094E9E}

/* NOTE BOX */
.nb{margin-top:12px;padding:10px 12px;background:#F1F6FC;border-radius:10px;border-left:3px solid #1358A4}
.nb-t{font-size:10px;font-weight:700;color:#1358A4;margin-bottom:3px}
.nb-b{font-size:10px;color:#486480;line-height:1.55}

/* STATUS BAR */
.sbar{background:#061628;border-radius:12px;padding:13px 24px;display:flex;align-items:center;flex-wrap:wrap;gap:18px}
.sbar-ttl{font-size:8.5px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#68ACEE;white-space:nowrap;flex-shrink:0}
.si{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:500}
.ok{color:#45D099}.wn{color:#FFBB38}
.dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.dok{background:#45D099}.dwn{background:#FFBB38}

/* FOOTER */
.ftr{background:#061628;padding:10px 36px;display:flex;justify-content:space-between;align-items:center}
.ftr span{font-size:9.5px;color:rgba(255,255,255,0.3)}
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

<div class="hdr">
  <div class="hdr-bar">
    <div class="hdr-bar-left">
      <img class="logo-pelindo" src="__PEL__" alt="Pelindo">
      <div class="bar-sep"></div>
      <img class="logo-bumn" src="__BUM__" alt="BUMN untuk Indonesia">
      <div class="bar-sep"></div>
      <div class="bar-tagline">
        <strong>PT Pelabuhan Indonesia (Persero)</strong>
        Badan Usaha Milik Negara &nbsp;&middot;&nbsp; Regional 2 Banten &nbsp;&middot;&nbsp; Kementerian BUMN RI
      </div>
    </div>
    <div class="hdr-bar-right">
      <span class="bar-chip">Dokumen Internal</span>
      <span class="bar-chip">Executive Summary</span>
    </div>
  </div>
  <div class="hdr-main">
    <div class="hdr-left">
      <div class="eyebrow">Realisasi Produksi &middot; Januari&ndash;Mei 2026</div>
      <div class="hdr-title">Produksi Pelabuhan <em>Regional 2 Banten 2026</em></div>
      <div class="hdr-sub">Pelayanan Kapal, Bongkar Muat &amp; Pengusahaan Alat s.d. Mei 2026 (parsial)</div>
    </div>
    <div class="hdr-badges">
      <div class="hdr-badge"><div class="hdr-badge-v">3.386</div><div class="hdr-badge-l">Gerakan Pandu Kapal</div></div>
      <div class="hdr-badge"><div class="hdr-badge-v">32,9 JT</div><div class="hdr-badge-l">Total GT Dipandu</div></div>
      <div class="hdr-badge"><div class="hdr-badge-v">9.286</div><div class="hdr-badge-l">Jam Penundaan (Kpl Jam)</div></div>
      <div class="hdr-badge"><div class="hdr-badge-v">1,66 JT</div><div class="hdr-badge-l">Bongkar Muat (Ton)</div></div>
    </div>
  </div>
</div>

<div class="body">

  <div class="insight">
    <div class="insight-t">Ringkasan Eksekutif</div>
    <div class="insight-b">
      Regional 2 Banten melayani <b>3.386 gerakan pandu kapal</b> (GT <b>32,9 Juta</b>) s.d. Mei 2026, didominasi aktivitas <b>Pelabuhan Khusus/TUKS (76,7%)</b>. Produksi bongkar muat <b>1,66 Juta Ton</b> dipimpin <b>curah kering (62,9%)</b> dengan lonjakan <b>+77,1%</b> di Mei; penundaan TUKS tumbuh <b>+10,2%</b> MoM. Lahan disewa stabil <b>750.889 M&sup2;</b>. <i>Data Jan&ndash;Mei 2026 (Mei bersifat parsial).</i>
    </div>
  </div>

  <div class="sec">Indikator Kinerja Utama</div>
  <div class="kpi-row">
    <div class="kpi gr">
      <div class="k-lbl">Gerakan Pandu Kapal</div>
      <div class="k-val">3.386<span class="k-unit">Kpl Grk</span></div>
      <div class="k-delta cu">&#9650; +7,8% MoM &middot; TUKS 76,7%</div>
      <div class="k-track"><div class="k-fill" style="width:78%;background:#0B8A60"></div></div>
    </div>
    <div class="kpi pu">
      <div class="k-lbl">Total GT Dipandu</div>
      <div class="k-val">32,9<span class="k-unit">JT GT</span></div>
      <div class="k-delta cn">TUKS dominan 80,5% kontribusi</div>
      <div class="k-track"><div class="k-fill" style="width:80%;background:#5135AE"></div></div>
    </div>
    <div class="kpi gr">
      <div class="k-lbl">Penundaan Kapal</div>
      <div class="k-val">9.286<span class="k-unit">Kpl Jam</span></div>
      <div class="k-delta cu">&#9650; +10,2% MoM (TUKS)</div>
      <div class="k-track"><div class="k-fill" style="width:72%;background:#0B8A60"></div></div>
    </div>
    <div class="kpi am">
      <div class="k-lbl">Produksi Bongkar Muat</div>
      <div class="k-val">1,66<span class="k-unit">JT Ton</span></div>
      <div class="k-delta cn">Curah Kering pimpin 62,9%</div>
      <div class="k-track"><div class="k-fill" style="width:63%;background:#C07808"></div></div>
    </div>
    <div class="kpi">
      <div class="k-lbl">Lahan Disewa</div>
      <div class="k-val">750,9<span class="k-unit">RB M&sup2;</span></div>
      <div class="k-delta cn">&#9679; Stabil 100% sepanjang periode</div>
      <div class="k-track"><div class="k-fill" style="width:100%;background:#1358A4"></div></div>
    </div>
  </div>

  <!-- ROW 1 -->
  <div class="row2">
    <div class="card">
      <div class="card-t">Tren Bulanan Gerakan Pandu &amp; GT Dipandu</div>
      <div class="card-s">Volume pandu <b>tumbuh konsisten</b> hingga <b>732 gerakan</b> di Mei; GT menyentuh puncak <b>7,32 JT</b> seiring aktivitas TUKS meningkat.</div>
      <div class="leg">
        <div class="li"><span class="ls" style="background:#1E62C4"></span>Gerakan Pandu (Kpl Grk)</div>
        <div class="li"><span class="lsp"></span>GT Dipandu (Juta GT)</div>
        <div class="li" style="color:#A0BACC;font-size:9.5px;font-style:italic">*Mei bersifat parsial</div>
      </div>
      <div class="cw" style="height:280px"><canvas id="chTrend"></canvas></div>
    </div>
    <div class="card">
      <div class="card-t">Komposisi Bongkar Muat per Komoditas</div>
      <div class="card-s"><b>Curah kering mendominasi 62,9%</b> dari total 1,66 JT Ton bongkar muat dermaga.</div>
      <div class="cw" style="height:230px"><canvas id="chDonut"></canvas></div>
      <div style="margin-top:6px">
        <div class="pb-row"><span class="ls" style="width:10px;height:10px;border-radius:2px;background:#1358A4;display:inline-block;margin-right:6px"></span><span style="font-size:10.5px;color:#446280;flex:1">Curah Kering</span><span style="font-size:10.5px;font-weight:700;color:#020E1C">1.042.861 Ton</span></div>
        <div class="pb-row"><span class="ls" style="width:10px;height:10px;border-radius:2px;background:#1E62C4;display:inline-block;margin-right:6px"></span><span style="font-size:10.5px;color:#446280;flex:1">General Cargo</span><span style="font-size:10.5px;font-weight:700;color:#020E1C">389.282 Ton</span></div>
        <div class="pb-row"><span class="ls" style="width:10px;height:10px;border-radius:2px;background:#6CA4E0;display:inline-block;margin-right:6px"></span><span style="font-size:10.5px;color:#446280;flex:1">Curah Cair</span><span style="font-size:10.5px;font-weight:700;color:#020E1C">211.818 Ton</span></div>
        <div class="pb-row"><span class="ls" style="width:10px;height:10px;border-radius:2px;background:#B6D2F0;display:inline-block;margin-right:6px"></span><span style="font-size:10.5px;color:#446280;flex:1">Hewan</span><span style="font-size:10.5px;font-weight:700;color:#020E1C">15.107 Ton</span></div>
      </div>
    </div>
  </div>

  <!-- ROW 2 -->
  <div class="row3">
    <div class="card">
      <div class="card-t">Gerakan Pandu: Pelabuhan Umum vs TUKS</div>
      <div class="card-s"><b>TUKS jauh mendominasi</b> setiap bulan (3,3&times; lipat Pelabuhan Umum) dengan tren naik menuju Mei.</div>
      <div class="leg">
        <div class="li"><span class="ls" style="background:#6CA4E0"></span>Pelabuhan Umum</div>
        <div class="li"><span class="ls" style="background:#061628"></span>Pelabuhan Khusus/TUKS</div>
      </div>
      <div class="cw" style="height:248px"><canvas id="chPandu"></canvas></div>
    </div>
    <div class="card">
      <div class="card-t">Produksi Alat (Pengusahaan Alat)</div>
      <div class="card-s"><b>Timbangan memproses tonnage tertinggi</b> (742 RB Ton); Luffing Crane &amp; Wheel Loader menyusul.</div>
      <div class="cw" style="height:248px"><canvas id="chAlat"></canvas></div>
    </div>
    <div class="card">
      <div class="card-t">Rincian Pelayanan Kapal</div>
      <div class="card-s">Akumulasi <b>Jan&ndash;Mei 2026</b> per lokasi pelayanan.</div>
      <table class="t">
        <thead><tr><th>Layanan</th><th>Lokasi</th><th class="r">Volume</th><th>Satuan</th></tr></thead>
        <tbody>
          <tr><td class="fw">Pemanduan</td><td>Pel. Umum</td><td class="r">790</td><td>Kpl Grk</td></tr>
          <tr class="hl"><td class="fw">Pemanduan</td><td>TUKS</td><td class="r">2.596</td><td>Kpl Grk</td></tr>
          <tr><td class="fw">Penundaan</td><td>Pel. Umum</td><td class="r">2.093</td><td>Kpl Jam</td></tr>
          <tr class="hl"><td class="fw">Penundaan</td><td>TUKS</td><td class="r">7.194</td><td>Kpl Jam</td></tr>
          <tr><td class="fw">Penambatan</td><td>Pel. Umum</td><td class="r">7.714.755</td><td>GT Etmal</td></tr>
          <tr class="tt"><td class="fw" colspan="2">Total Gerakan Pandu</td><td class="r">3.386</td><td>Kpl Grk</td></tr>
        </tbody>
      </table>
      <div class="nb">
        <div class="nb-t">Catatan Produksi</div>
        <div class="nb-b">Pelayanan Labuh, Alur &amp; Kepil tidak tercatat (0) pada periode ini. Aktivitas terkonsentrasi pada Pemanduan, Penundaan &amp; Penambatan. Listrik disalurkan <b>696.933 KWh</b> (4 bulan).</div>
      </div>
    </div>
  </div>

  <!-- STATUS BAR -->
  <div class="sbar">
    <div class="sbar-ttl">Key Takeaways</div>
    <div class="si ok"><span class="dot dok"></span>3.386 gerakan pandu s.d. Mei 2026 &mdash; TUKS dominan 76,7%</div>
    <div class="si ok"><span class="dot dok"></span>Penundaan TUKS tumbuh +10,2% di Mei (1.532 Jam)</div>
    <div class="si ok"><span class="dot dok"></span>Bongkar Muat 1,66 JT Ton, curah kering pimpin 62,9%</div>
    <div class="si wn"><span class="dot dwn"></span>General Cargo turun &minus;30,7% di Mei, perlu pemantauan</div>
    <div class="si ok"><span class="dot dok"></span>Lahan disewa stabil 750.889 M&sup2; sepanjang periode</div>
  </div>

</div><!-- /body -->

<div class="ftr">
  <span>Laporan Produksi Pelabuhan Regional 2 Banten 2026 &mdash; PT Pelabuhan Indonesia (Persero)</span>
  <span>Disiapkan: Juni 2026 &middot; Seluruh angka akumulasi Jan&ndash;Mei 2026 (parsial) kecuali disebutkan lain</span>
</div>

</div><!-- /page -->

<script>
Chart.register(ChartDataLabels);
Chart.defaults.font.family="'Outfit',Arial,sans-serif";
Chart.defaults.devicePixelRatio=window.devicePixelRatio*2;
Chart.defaults.plugins.datalabels={display:false};

const idNum=v=>v.toLocaleString('id-ID');
const idDec=v=>Number(v).toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1});
const months=['Jan','Feb','Mar','Apr','Mei*'];
const BLUE='#1E62C4', NAVY='#061628', MIDB='#6CA4E0', LIGHT='#B6D2F0';

// ---- Chart 1: Combo bar (gerakan) + line (GT Juta) ----
new Chart(document.getElementById('chTrend'),{
  type:'bar',
  data:{
    labels:months,
    datasets:[
      {type:'bar',label:'Gerakan Pandu (Kpl Grk)',data:[684,634,646,690,732],
        backgroundColor:[BLUE,BLUE,BLUE,BLUE,'#A8BCD4'],borderRadius:5,borderSkipped:false,
        barPercentage:0.36,categoryPercentage:0.88,yAxisID:'yBar',
        datalabels:{display:true,align:'top',anchor:'end',offset:4,color:'#061628',font:{weight:700,size:10},
          backgroundColor:'rgba(255,255,255,0.82)',borderRadius:3,padding:{top:1,bottom:1,left:4,right:4},
          formatter:v=>v.toLocaleString('id-ID')}},
      {type:'line',label:'GT Dipandu (Juta GT)',data:[6.52,6.08,6.22,6.74,7.32],
        borderColor:'#C07808',backgroundColor:'#C07808',borderWidth:2.5,pointRadius:4,pointBackgroundColor:'#C07808',
        tension:0.35,fill:false,yAxisID:'yLine',
        datalabels:{display:true,align:'bottom',anchor:'center',offset:6,color:'#985200',font:{weight:700,size:9.5},
          backgroundColor:'rgba(255,255,255,0.9)',borderRadius:3,padding:{top:1,bottom:1,left:4,right:4},
          formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:1})+' JT'}}
    ]
  },
  options:{maintainAspectRatio:false,responsive:true,
    plugins:{legend:{display:false},
      tooltip:{callbacks:{label:c=>` ${c.dataset.label}: ${c.parsed.y.toLocaleString('id-ID')}`}},
      datalabels:{}},
    scales:{
      x:{grid:{display:false},ticks:{color:'#7B98B5',font:{size:10,weight:600}}},
      yBar:{position:'left',max:900,beginAtZero:true,
        title:{display:true,text:'Gerakan Pandu (Kpl Grk)',color:'#8AAAC2',font:{size:9.5,weight:600}},
        grid:{color:'#EEF3FA'},ticks:{color:'#7B98B5',font:{size:9.5},callback:v=>v.toLocaleString('id-ID')}},
      yLine:{position:'right',max:12,beginAtZero:true,
        title:{display:true,text:'GT Dipandu (Juta GT)',color:'#8AAAC2',font:{size:9.5,weight:600}},
        grid:{drawOnChartArea:false},ticks:{color:'#7B98B5',font:{size:9.5},callback:v=>v.toLocaleString('id-ID')}}
    }}
});

// ---- Chart 2: Donut BM composition ----
new Chart(document.getElementById('chDonut'),{
  type:'doughnut',
  data:{labels:['Curah Kering','General Cargo','Curah Cair','Hewan'],
    datasets:[{data:[1042861,389282,211818,15107],
      backgroundColor:['#1358A4','#1E62C4','#6CA4E0','#B6D2F0'],
      borderWidth:3,borderColor:'#fff',hoverOffset:8,
      datalabels:{display:true,color:'#fff',font:{weight:700,size:11},textAlign:'center',
        formatter:(v,ctx)=>Math.round(v/ctx.dataset.data.reduce((a,b)=>a+b,0)*100)+'%'}}]},
  options:{maintainAspectRatio:false,cutout:'62%',
    plugins:{legend:{display:false},
      tooltip:{callbacks:{label:c=>` ${c.label}: ${idNum(c.parsed)} (${Math.round(c.parsed/1659069*100)}%)`}}}},
  plugins:[{id:'cl',afterDraw(chart){
    const {ctx,chartArea:{left,top,right,bottom}}=chart;
    const cx=(left+right)/2,cy=(top+bottom)/2;
    ctx.save();ctx.textAlign='center';
    ctx.fillStyle='#9AB4CC';ctx.font='400 11px Outfit,Arial,sans-serif';
    ctx.fillText('Total BM',cx,cy-10);
    ctx.fillStyle='#061628';ctx.font='700 18px Outfit,Arial,sans-serif';
    ctx.fillText('1,66 JT Ton',cx,cy+12);
    ctx.restore();}}]
});

// ---- Chart 3: Grouped bar Pandu Umum vs TUKS ----
new Chart(document.getElementById('chPandu'),{
  type:'bar',
  data:{labels:months,datasets:[
    {label:'Pelabuhan Umum',data:[142,154,144,174,176],
      backgroundColor:[MIDB,MIDB,MIDB,MIDB,'#C9D9EC'],borderRadius:4,borderSkipped:false,
      barPercentage:0.36,categoryPercentage:0.88,
      datalabels:{display:true,align:'top',anchor:'end',offset:2,color:'#284058',font:{weight:700,size:9.5},
        backgroundColor:'rgba(255,255,255,0.82)',borderRadius:3,padding:{top:1,bottom:1,left:3,right:3},
        formatter:v=>v.toLocaleString('id-ID')}},
    {label:'Pelabuhan Khusus/TUKS',data:[542,480,502,516,556],
      backgroundColor:[NAVY,NAVY,NAVY,NAVY,'#7C8FA3'],borderRadius:4,borderSkipped:false,
      barPercentage:0.36,categoryPercentage:0.88,
      datalabels:{display:true,align:'top',anchor:'end',offset:2,color:'#061628',font:{weight:700,size:9.5},
        backgroundColor:'rgba(255,255,255,0.85)',borderRadius:3,padding:{top:1,bottom:1,left:3,right:3},
        formatter:v=>v.toLocaleString('id-ID')}}
  ]},
  options:{maintainAspectRatio:false,
    plugins:{legend:{display:false},
      tooltip:{callbacks:{label:c=>` ${c.dataset.label}: ${idNum(c.parsed.y)} Kpl Grk`}}},
    scales:{
      x:{grid:{display:false},ticks:{color:'#7B98B5',font:{size:10,weight:600}}},
      y:{beginAtZero:true,max:680,
        title:{display:true,text:'Gerakan Pandu (Kpl Grk)',color:'#8AAAC2',font:{size:9.5,weight:600}},
        grid:{color:'#EEF3FA'},ticks:{color:'#7B98B5',font:{size:9.5},callback:v=>v.toLocaleString('id-ID')}}
    }}
});

// ---- Chart 4: Equipment production (RB Ton) ----
new Chart(document.getElementById('chAlat'),{
  type:'bar',
  data:{labels:['Timbangan','Luffing Crane','Wheel Loader','Ramp Door'],
    datasets:[{label:'Produksi Alat (RB Ton)',data:[742.8,571.7,382.7,198.6],
      backgroundColor:['#1358A4','#1E62C4','#6CA4E0','#B6D2F0'],borderRadius:5,borderSkipped:false,
      barPercentage:0.62,categoryPercentage:0.88,
      datalabels:{display:true,align:'top',anchor:'end',offset:3,color:'#061628',font:{weight:700,size:10},
        backgroundColor:'rgba(255,255,255,0.82)',borderRadius:3,padding:{top:1,bottom:1,left:4,right:4},
        formatter:v=>v.toLocaleString('id-ID',{minimumFractionDigits:1})}}]},
  options:{maintainAspectRatio:false,
    plugins:{legend:{display:false},
      tooltip:{callbacks:{label:c=>` ${c.label}: ${idDec(c.parsed.y)} RB Ton`}}},
    scales:{
      x:{grid:{display:false},ticks:{color:'#284058',font:{size:10,weight:600}}},
      y:{beginAtZero:true,max:900,
        title:{display:true,text:'Produksi (RB Ton)',color:'#8AAAC2',font:{size:9.5,weight:600}},
        grid:{color:'#EEF3FA'},ticks:{color:'#7B98B5',font:{size:9.5},callback:v=>v.toLocaleString('id-ID')}}
    }}
});

async function doExport(){
  const btn=document.getElementById('exportBtn');
  const bar=document.getElementById('progressBar');
  btn.disabled=true;btn.textContent='Generating\u2026';
  let p=0;
  const t=setInterval(()=>{p=Math.min(p+5,85);bar.style.width=p+'%';},120);
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  await new Promise(r=>setTimeout(r,200));
  try{
    const el=document.getElementById('page');
    const canvas=await html2canvas(el,{
      scale:3,useCORS:true,allowTaint:true,backgroundColor:'#E8EEF7',logging:false,imageTimeout:0,
      width:el.offsetWidth,height:el.offsetHeight,windowWidth:el.offsetWidth,windowHeight:el.offsetHeight,
      scrollX:0,scrollY:0,x:0,y:0
    });
    clearInterval(t);bar.style.width='100%';
    const a=document.createElement('a');
    a.download='LAP2026_Regional2Banten_Produksi.png';
    a.href=canvas.toDataURL('image/png',1.0);
    a.click();
  }catch(e){console.error(e);clearInterval(t);}
  setTimeout(()=>{
    bar.style.width='0';btn.disabled=false;
    btn.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export High Quality PNG';
  },800);
}
</script>
</body>
</html>'''

HTML = HTML.replace('__PEL__', PEL).replace('__BUM__', BUM)

out = 'report-generator/reports/LAP2026_Regional2Banten_Produksi.html'
with open(out, 'w', encoding='utf-8') as f:
    f.write(HTML)
print('WROTE', out, 'bytes:', len(HTML))
