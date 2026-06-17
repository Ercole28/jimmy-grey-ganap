# SKILL.md — Pelindo RKAP HTML Dashboard Report

> **Purpose:** This skill teaches a code agent how to transform an `.xlsx` financial/operational workbook into a production-ready, single-file HTML dashboard report matching the Pelindo RKAP 2027 visual standard — complete with charts, tables, KPI cards, dual logos, and a one-click high-quality PNG export.

---

## 1. When to Use This Skill

Trigger this skill whenever a task involves:
- An `.xlsx` file containing **RKAP, Prognosa, Realisasi, Kertas Kerja, or Laba Rugi** data
- A request to **generate a dashboard**, **visual report**, or **presentable summary** from that data
- Output must be an **HTML file** the user can open in a browser and export as a PNG

Do **not** use this skill for plain CSV exports, raw data summaries, or non-Pelindo reports.

---

## 2. Output Specification

### File
- Single self-contained `.html` file — all CSS, JS, chart data, and logos **inline**
- No external dependencies except: Google Fonts CDN, Chart.js CDN, chartjs-plugin-datalabels CDN, html2canvas CDN
- Filename format: `RKAP{YEAR}_{ReportName}_{Topic}.html` (for non-RKAP operational reports, use a descriptive `{TYPE}{YEAR}_{Unit}_{Topic}.html` instead)

### Executive-First Readability
The primary reader is an **executive scanning for the "so what" in a few seconds**. Every report must:
- Lead with a **one-line narrative band** (`.insight`) summarising the headline conclusion in plain language, with the 3–4 key figures bolded.
- State a conclusion in every chart **subtitle** (e.g. "puncak Mei", "didominasi Tunda 85%") — never a bare data description.
- End with a **Key Takeaways** status bar (`.sbar`) of 4–5 plain-language bullets, each tied to a green/amber status dot.
- Prefer **derived insight** (share %, peak, dominance, per-unit yield) over raw dump. Show the number *and* what it means.

### Page Dimensions
- `#page` wrapper: **exactly 1400px wide**, `overflow: hidden`
- Body centers `#page` on a muted blue-grey canvas (`background: #cbd5e8`)
- The export button (`#toolbar`) sits **above** `#page`, outside the captured area

---

## 3. Design System — DO NOT DEVIATE

### 3.1 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `navy-deepest` | `#061628` | Header bg start, footer bg, status bar bg |
| `navy-dark` | `#0B3464` | Header gradient mid |
| `navy-mid` | `#1358A4` | Header gradient, KPI border default, primary blue |
| `navy-light` | `#1C6CC0` | Header gradient end |
| `page-bg` | `#E8EEF7` | Page background |
| `body-canvas` | `#cbd5e8` | Body background (outside page) |
| `card-bg` | `#FFFFFF` | All card backgrounds |
| `table-head-bg` | `#F1F6FC` | Table `<thead>` background |
| `table-row-alt` | `#E8F1FB` | `.tt` total rows |
| `table-row-hl` | `#DCEFFE` | `.hl` highlight rows |
| `text-primary` | `#061628` | Main body text |
| `text-secondary` | `#284058` | Table cells |
| `text-muted` | `#7B98B5` | Labels, subtitles |
| `text-placeholder` | `#A0BACC` | Units, placeholders |
| `green` | `#0B8A60` | Positive deltas, `.gr` KPI border |
| `amber` | `#C07808` | Warning states, `.am` KPI border |
| `purple` | `#5135AE` | `.pu` KPI border |
| `red` | `#BC1E1E` | Negative values, `.cd` delta |
| `badge-green-bg` | `#D9F5E8` | `.b-g` badge background |
| `badge-amber-bg` | `#FEF0D8` | `.b-a` badge background |
| `badge-blue-bg` | `#D9EFFE` | `.b-b` badge background |

### 3.2 Typography

```
Display / Title:  DM Serif Display, Georgia, serif
                  font-size: 33px, font-weight: 400
                  color: #fff (header), <em> color: #90CAFF

Body / All else:  Outfit, Arial, sans-serif
                  Weights used: 400, 500, 600, 700, 800

Section label:    9px, weight 700, letter-spacing 2.8px, uppercase, color #8AAAC2
Card title:       13px, weight 600, color #061628
Card subtitle:    10.5px, weight 400, color #8AAAC2
KPI label:        9px, weight 700, letter-spacing 0.5px, uppercase, color #7B98B5
KPI value:        23px, weight 700, color #061628
Table header:     9.5px, weight 700, uppercase, letter-spacing 0.5px, color #7B98B5
Table cell:       11.5px, weight 400, color #284058
Badge:            9.5px, weight 700, border-radius 99px
```

### 3.3 Google Fonts Import
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Serif+Display&display=swap" rel="stylesheet">
```

---

## 4. Header — IDENTICAL in every report

The header is a **locked template**. Every report produced with this skill must use the exact same header structure. Only `eyebrow`, `hdr-title`, `hdr-sub`, and badge values differ per report.

### 4.1 Header CSS (copy verbatim)

```css
.hdr {
  background: linear-gradient(112deg, #061628 0%, #0B3464 44%, #1358A4 78%, #1C6CC0 100%);
  padding: 0;
  position: relative;
  overflow: hidden;
}
.hdr::before {
  content: ''; position: absolute; right: -50px; top: -70px;
  width: 260px; height: 260px; border-radius: 50%;
  background: rgba(255,255,255,0.05); pointer-events: none;
}
.hdr::after {
  content: ''; position: absolute; right: 190px; bottom: -90px;
  width: 180px; height: 180px; border-radius: 50%;
  background: rgba(255,255,255,0.04); pointer-events: none;
}

/* Logo bar */
.hdr-bar {
  padding: 11px 44px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.13);
  display: flex; align-items: center; justify-content: space-between;
  position: relative; z-index: 2;
}
.hdr-bar-left  { display: flex; align-items: center; gap: 14px; }
.hdr-bar-right { display: flex; align-items: center; gap: 8px; }

/* Logos — preserve original colors, adjust brightness only */
.logo-pelindo {
  height: 28px; width: auto; display: block; flex-shrink: 0;
  filter: brightness(1.3);   /* Pelindo blue logo on dark bg */
}
.logo-bumn {
  height: 24px; width: auto; display: block; flex-shrink: 0;
  filter: brightness(1.6);   /* BUMN navy+teal logo on dark bg */
}
.bar-sep {
  width: 1px; height: 24px;
  background: rgba(255,255,255,0.22); flex-shrink: 0;
}
.bar-tagline {
  font-size: 10.5px; font-weight: 400;
  color: rgba(255,255,255,0.52); letter-spacing: 0.2px; line-height: 1.35;
}
.bar-tagline strong {
  font-weight: 700; font-size: 11px;
  color: rgba(255,255,255,0.88); display: block;
}
.bar-chip {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 5px; padding: 3px 9px;
  font-size: 9px; font-weight: 700;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.8px; text-transform: uppercase;
}

/* Main header row */
.hdr-main {
  padding: 18px 44px 20px;
  display: flex; align-items: center;
  justify-content: space-between; gap: 28px;
  position: relative; z-index: 2;
}
.hdr-left { min-width: 0; }
.eyebrow {
  font-size: 9.5px; font-weight: 700; letter-spacing: 3px;
  text-transform: uppercase; color: #79B8FF; margin-bottom: 6px;
}
.hdr-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 33px; font-weight: 400; color: #fff;
  line-height: 1.1; white-space: nowrap;
}
.hdr-title em { color: #90CAFF; font-style: normal; }
.hdr-sub { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 6px; }
.hdr-badges { display: flex; gap: 11px; flex-shrink: 0; }
.hdr-badge {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 11px; padding: 11px 18px;
  text-align: center; min-width: 124px;
}
.hdr-badge-v { font-size: 18px; font-weight: 700; color: #fff; line-height: 1; }
.hdr-badge-l { font-size: 9.5px; font-weight: 500; color: rgba(255,255,255,0.46); margin-top: 4px; }
```

### 4.2 Header HTML Template (copy verbatim, fill in `{{variables}}`)

```html
<div class="hdr">
  <div class="hdr-bar">
    <div class="hdr-bar-left">
      <img class="logo-pelindo" src="{{PELINDO_LOGO_BASE64}}" alt="Pelindo">
      <div class="bar-sep"></div>
      <img class="logo-bumn" src="{{BUMN_LOGO_BASE64}}" alt="BUMN untuk Indonesia">
      <div class="bar-sep"></div>
      <div class="bar-tagline">
        <strong>PT Pelabuhan Indonesia (Persero)</strong>
        Badan Usaha Milik Negara &nbsp;·&nbsp; Kementerian BUMN RI
      </div>
    </div>
    <div class="hdr-bar-right">
      <span class="bar-chip">Dokumen Internal</span>
      <span class="bar-chip">Confidential</span>
    </div>
  </div>
  <div class="hdr-main">
    <div class="hdr-left">
      <div class="eyebrow">{{EYEBROW_TEXT}}</div>
      <div class="hdr-title">{{TITLE_HTML}}</div>  <!-- use <em> for accent word -->
      <div class="hdr-sub">{{SUBTITLE_TEXT}}</div>
    </div>
    <div class="hdr-badges">
      <!-- Repeat per KPI summary metric (max 4) -->
      <div class="hdr-badge">
        <div class="hdr-badge-v">{{VALUE}}</div>
        <div class="hdr-badge-l">{{LABEL}}</div>
      </div>
    </div>
  </div>
</div>
```

### 4.3 Logo Handling Rules

Both logos are embedded as **base64 PNG data URIs** so they render offline and export cleanly.

**Pelindo logo** — transparent background PNG. Blue icon+wordmark. Displayed directly on dark header. `filter: brightness(1.3)` makes it pop.

**BUMN logo** — navy + teal on transparent background. Achieved by pixel-level background removal (flood-fill or numpy channel thresholding). `filter: brightness(1.6)` compensates for dark display. **Never use a white pill/box wrapper — display directly on dark header.**

**Background removal recipe (Python/Pillow + NumPy):**
```python
import numpy as np
from PIL import Image
import base64, io

img = Image.open('logo.png').convert('RGBA')
data = np.array(img, dtype=np.int32)
r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]

# For BUMN: keep navy (r:15-60, g:25-60, b:60-120) + teal (r<30, g>80, b>90)
is_teal  = (r < 30) & (g > 80)  & (b > 90)
is_navy  = (r >= 15) & (r < 60) & (g >= 25) & (g < 60) & (b >= 60) & (b < 120) & (b > r+25) & (~is_teal)
is_logo  = is_teal | is_navy
brightness = r + g + b
alpha = np.where(is_logo, 255,
        np.where(brightness < 30, 0,
        np.clip((brightness - 30) / 50 * 255, 0, 255))).astype(np.uint8)
data[:,:,3] = alpha
result = Image.fromarray(data.astype(np.uint8))

buf = io.BytesIO()
result.save(buf, 'PNG')
data_uri = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
```

For **Pelindo** logo (blue on black): keep pixels where `b > 60 and b > r + 20`, make rest transparent.

---

## 5. Page & Body Shell

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #cbd5e8;
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 0 60px;
  font-family: 'Outfit', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
#toolbar {
  width: 1400px; display: flex;
  justify-content: flex-end; margin-bottom: 16px;
}
#page {
  width: 1400px; background: #E8EEF7;
  overflow: hidden; font-size: 13px;
  color: #1A2C42; line-height: 1.45;
  box-shadow: 0 8px 40px rgba(0,0,0,0.18);
}
```

```html
<body>
  <div id="progressBar"></div>
  <div id="toolbar">
    <button id="exportBtn" onclick="doExport()"><!-- SVG icon --> Export High Quality PNG</button>
  </div>
  <div id="page">
    <!-- header, body, footer go here -->
  </div>
</body>
```

---

## 6. Export Button & PNG Export Logic

### 6.1 Button CSS
```css
#exportBtn {
  display: flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, #0B3868, #1459A8);
  color: #fff; border: none; border-radius: 10px;
  padding: 12px 24px;
  font-family: 'Outfit', Arial, sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(11,56,104,0.45);
  transition: transform .15s, box-shadow .15s;
}
#exportBtn:hover  { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(11,56,104,0.55); }
#exportBtn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
#progressBar {
  position: fixed; top: 0; left: 0; height: 3px; width: 0%;
  background: linear-gradient(90deg, #1459A8, #3DD6A0);
  z-index: 9999; transition: width 0.25s ease;
}
```

### 6.2 Export Function (copy verbatim)
```javascript
async function doExport() {
  const btn = document.getElementById('exportBtn');
  const bar = document.getElementById('progressBar');
  btn.disabled = true; btn.textContent = 'Generating…';
  let p = 0;
  const t = setInterval(() => { p = Math.min(p + 5, 85); bar.style.width = p + '%'; }, 120);

  // Let charts finish painting
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise(r => setTimeout(r, 200));

  try {
    const el = document.getElementById('page');
    const canvas = await html2canvas(el, {
      scale: 3,                        // 3× = ~4200px wide, print quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#E8EEF7',
      logging: false,
      imageTimeout: 0,
      width:  el.offsetWidth,          // capture ONLY #page, not full viewport
      height: el.offsetHeight,
      windowWidth:  el.offsetWidth,
      windowHeight: el.offsetHeight,
      scrollX: 0, scrollY: 0, x: 0, y: 0
    });
    clearInterval(t); bar.style.width = '100%';
    const a = document.createElement('a');
    a.download = '{{FILENAME}}.png';   // e.g. RKAP2027_Report1_Operasi.png
    a.href = canvas.toDataURL('image/png', 1.0);
    a.click();
  } catch (e) { console.error(e); clearInterval(t); }

  setTimeout(() => {
    bar.style.width = '0'; btn.disabled = false;
    btn.innerHTML = `<svg .../>  Export High Quality PNG`;
  }, 800);
}
```

### 6.3 Critical Export Rules
- The export button and `#toolbar` div must be **outside** `#page` — they must never appear in the exported PNG
- `scale: 3` is mandatory — lower values produce blurry output
- Always pass `width/height/windowWidth/windowHeight` matching `el.offsetWidth/offsetHeight` to prevent the capture bleeding into the surrounding page
- **Tooltips do NOT survive export.** Because the output is a static PNG, every critical chart value (bar heights, segment shares, totals) MUST be rendered on-canvas via data labels (see §7.6). A chart whose meaning depends on hover/tooltip is a broken chart in this skill.

---

## 7. Chart.js Configuration

### 7.1 CDN & Global Setup
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
```
```javascript
Chart.register(ChartDataLabels);
Chart.defaults.font.family = "'Outfit', Arial, sans-serif";
Chart.defaults.devicePixelRatio = window.devicePixelRatio * 2; // Sharp on retina
Chart.defaults.plugins.datalabels = { display: false };        // off by default; enable per-dataset
```

**Always set `devicePixelRatio * 2`** — omitting this produces blurry canvas charts in the export.
**Always register `ChartDataLabels` and disable it globally**, then turn it on per-dataset only where a value must be visible (see §7.6). Leaving datalabels on everywhere clutters the chart.

### 7.2 Chart Wrapper HTML
```html
<div class="cw" style="height: {{PX}}px"><canvas id="{{ID}}"></canvas></div>
```
Canvas must be inside a `.cw` div with an explicit pixel height. `maintainAspectRatio: false` is always required.

### 7.3 Grouped Bar Chart (standard pattern)
```javascript
new Chart(document.getElementById('{{ID}}'), {
  type: 'bar',
  data: {
    labels: ['Label A', 'Label B', 'Label C', 'Label D'],
    datasets: [
      {
        label: 'Series 1',
        data: [/* values */],
        backgroundColor: ['#B6D2F0', '#6CA4E0', '#1E62C4', '#061628'], // light→dark progression
        borderRadius: 5, borderSkipped: false,
        barPercentage: 0.36,          // CRITICAL: keeps bars from overlapping
        categoryPercentage: 0.88
      },
      {
        label: 'Series 2',
        data: [/* values */],
        backgroundColor: ['#9EDCCA', '#48C098', '#10986A', '#0A6040'],
        borderRadius: 5, borderSkipped: false,
        barPercentage: 0.36,
        categoryPercentage: 0.88
      }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.parsed.y}` } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#58769A' } },
      y: {
        grid: { color: '#E6EEF8', lineWidth: 1 }, border: { display: false },
        ticks: { font: { size: 10 }, color: '#9AB4CC', maxTicksLimit: 7 },
        max: /* set explicitly to add headroom */
      }
    }
  }
});
```

**`barPercentage: 0.36, categoryPercentage: 0.88`** — this exact combination prevents bar overlap for grouped charts with 2 datasets across 4 categories. For 3 datasets, use `barPercentage: 0.68, categoryPercentage: 0.90`. For 2 categories, use `barPercentage: 0.60`.

### 7.4 Doughnut Chart with Center Label
```javascript
new Chart(document.getElementById('{{ID}}'), {
  type: 'doughnut',
  data: {
    labels: ['Segment A', 'Segment B', 'Segment C', 'Segment D'],
    datasets: [{
      data: [/* values matching percentages */],
      backgroundColor: ['#1358A4', '#0B8A60', '#2478D8', '#5135AE'],
      borderWidth: 3, borderColor: '#fff', hoverOffset: 10
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    cutout: '63%',   // donut hole size
    plugins: { legend: { display: false } }
  },
  plugins: [{
    id: 'centerLabel',
    afterDraw(chart) {
      const { ctx, chartArea: { left, top, right, bottom } } = chart;
      const cx = (left + right) / 2, cy = (top + bottom) / 2;
      ctx.save(); ctx.textAlign = 'center';
      ctx.fillStyle = '#9AB4CC';
      ctx.font = '400 11px Outfit, Arial, sans-serif';
      ctx.fillText('{{TOP_LINE}}', cx, cy - 9);   // e.g. "Total"
      ctx.fillStyle = '#061628';
      ctx.font = '700 17px Outfit, Arial, sans-serif';
      ctx.fillText('{{BOTTOM_LINE}}', cx, cy + 11); // e.g. "2.479 M"
      ctx.restore();
    }
  }]
});
```

### 7.5 Color Progressions for Chart Bars

| Series | Light → Dark (4 steps) |
|---|---|
| Blue (primary) | `#B6D2F0` → `#6CA4E0` → `#1E62C4` → `#061628` |
| Green (profit/positive) | `#9EDCCA` → `#48C098` → `#10986A` → `#0A6040` |
| Multi-period neutral | `#B6D2F0`, `#5888D4`, `#C47B08`, `#020E1C` |

### 7.6 Data Labels — MANDATORY for image export

Reports are exported as **static PNG**. Tooltips are invisible in the export, so every chart must print its key numbers onto the canvas itself. Use `chartjs-plugin-datalabels` (registered in §7.1, globally off), then enable it **per-dataset**.

**Bar (single series) — value on top of each bar:**
```javascript
{
  type: 'bar', data: [/*...*/],
  datalabels: { display: true, align: 'top', anchor: 'end', offset: 2,
                color: '#061628', font: { weight: 700, size: 10 },
                formatter: v => v.toLocaleString('id-ID') }
}
```

**Stacked bar — show the stack TOTAL on top (enable on the top dataset only):**
```javascript
datalabels: { display: true, align: 'top', anchor: 'end', color: '#061628',
  font: { weight: 700, size: 9.5 },
  formatter: (v, ctx) => {
    const i = ctx.dataIndex;
    const sum = ctx.chart.data.datasets.reduce((a, d) => a + (d.data[i] || 0), 0);
    return sum.toLocaleString('id-ID');
  } }
```

**Doughnut — percentage inside each segment + center total (combine with the §7.4 center-label plugin):**
```javascript
options: { plugins: { datalabels: { display: true, color: '#fff',
  font: { weight: 700, size: 11 }, textAlign: 'center',
  formatter: (v, ctx) => Math.round(v / ctx.dataset.data.reduce((a,b)=>a+b,0) * 100) + '%' } } }
```

**Combo (dual-axis bar + line) — NEVER put both series' labels on the same side.** This is the #1 label bug: a bar and a line share a chart but sit at different heights, so two `align:'top'` label sets collide wherever the two series meet at a similar height. Split them to **opposite sides** and force the series into **different vertical bands**:

```javascript
// Bar dataset — label ABOVE the bar
datalabels: { display: true, align: 'top', anchor: 'end', offset: 4,
  color: '#061628', font: { weight: 700, size: 10 },
  backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 3,
  padding: { top: 1, bottom: 1, left: 4, right: 4 },
  formatter: v => v.toLocaleString('id-ID') }

// Line dataset — label BELOW the point (opposite side!)
datalabels: { display: true, align: 'bottom', anchor: 'point', offset: 6,
  color: '#0A6040', font: { weight: 700, size: 9.5 },
  backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 3,
  padding: { top: 1, bottom: 1, left: 4, right: 4 },
  formatter: v => v.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1}) + ' M' }
```

Then **tune axis `max`** so the line deliberately traces *below* the bar tops:
- Bar axis `max` ≈ tallest bar + ~20% headroom (room for the above-bar label).
- Line axis `max` high enough that line points peak at only ~60–75% of chart height.
- This guarantees the two label bands occupy separate vertical zones and **cannot overlap, whatever the data**.
- Always add **axis titles** on a dual-axis chart so the reader knows which scale belongs to which series.

**Rules:**
- Label at most one value per visual stack/segment group — never every sub-segment (clutter).
- **Two data-label sets on one chart must sit on opposite sides** (`top` vs `bottom`). Never stack two `align:'top'` groups — they collide wherever the two series meet at a similar height (the classic combo bar+line trap).
- Give labels a **soft white pill** (`backgroundColor:'rgba(255,255,255,0.85)'`, `borderRadius:3`, small `padding`) so they read over gridlines/bars and stay legible.
- `font.size` 9–11, `weight` 700. Label color contrasts its background (white inside colored segments, dark `#061628` above bars).
- For partial/incomplete periods, shade that bar a desaturated tint (e.g. `#A8BCD4`) and tag the label with `*` so the reader does not mistake it for a full period.
- After building any multi-series chart, **mentally render the labels**: if two series can occupy the same height band at the same x position, you have a collision — fix it before delivery (see the VERIFY checklist §12).

---

## 8. Layout Grid System

All grids use **fixed pixel column widths** summing to ≤ 1328px (1400px page − 72px body padding). Never use percentage columns — they cause overlap at fixed widths.

```css
/* Body padding */
.body { padding: 24px 36px 32px; }
/* Inner usable width = 1400 - 72 = 1328px */

/* 2-column: chart wide + secondary */
.row2 { display: grid; grid-template-columns: 856px 1fr; gap: 14px; margin-bottom: 14px; }

/* 3-column: table + chart + narrow */
.row3 { display: grid; grid-template-columns: 430px 370px 1fr; gap: 14px; margin-bottom: 20px; }

/* 3-column: wide chart + two equal */
.row-top { display: grid; grid-template-columns: 854px 1fr; gap: 14px; margin-bottom: 14px; }
.row-mid { display: grid; grid-template-columns: 430px 350px 1fr; gap: 14px; margin-bottom: 20px; }

/* All rows: align-items: start — cards size to content, no stretching */
/* (omit align-items if you want equal-height columns) */
```

**Gap between cards is always `14px`.** Do not vary this.

---

## 9. Component Library

### 9.1 KPI Strip

```css
.kpi-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
.kpi { background: #fff; border-radius: 12px; padding: 15px 17px 13px;
       border-top: 3px solid #1358A4; box-shadow: 0 1px 6px rgba(6,22,40,0.09); }
/* Color variants for border-top */
.kpi.gr { border-top-color: #0B8A60; }  /* green — positive metric */
.kpi.am { border-top-color: #C07808; }  /* amber — warning/efficiency */
.kpi.pu { border-top-color: #5135AE; }  /* purple — progress/partial */
.k-lbl  { font-size: 9px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: #7B98B5; margin-bottom: 6px; }
.k-val  { font-size: 23px; font-weight: 700; color: #061628; line-height: 1; }
.k-unit { font-size: 10px; font-weight: 400; color: #A0BACC; margin-left: 2px; }
.k-delta { font-size: 10.5px; font-weight: 600; margin-top: 5px; }
.cu { color: #0B8A60; } .cd { color: #BC1E1E; } .cn { color: #8AAAC2; }
.k-track { height: 3px; background: #E8F0F8; border-radius: 2px; margin-top: 9px; }
.k-fill  { height: 3px; border-radius: 2px; }
```

```html
<div class="kpi {{VARIANT}}">
  <div class="k-lbl">{{LABEL}}</div>
  <div class="k-val">{{VALUE}}<span class="k-unit">{{UNIT}}</span></div>
  <div class="k-delta {{cu|cd|cn}}">{{DELTA_TEXT}}</div>
  <div class="k-track"><div class="k-fill" style="width:{{PCT}}%;background:{{COLOR}}"></div></div>
</div>
```

### 9.2 Card

```css
.card   { background: #fff; border-radius: 14px; padding: 18px 20px 16px; box-shadow: 0 1px 6px rgba(6,22,40,0.09); }
.card-t { font-size: 13px; font-weight: 600; color: #061628; margin-bottom: 2px; }
.card-s { font-size: 10.5px; color: #8AAAC2; margin-bottom: 13px; }
```

```html
<div class="card">
  <div class="card-t">{{TITLE}}</div>
  <div class="card-s">{{SUBTITLE}}</div>
  <!-- content: chart, table, legend, etc. -->
</div>
```

### 9.3 Data Table

```css
.t { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.t thead th { background: #F1F6FC; color: #7B98B5; font-weight: 700; font-size: 9.5px;
              text-transform: uppercase; letter-spacing: .5px;
              padding: 7px 9px; text-align: left; border-bottom: 1.5px solid #DCE8F4; }
.t thead th.r { text-align: right; }
.t tbody td { padding: 6.5px 9px; border-bottom: 1px solid #ECF2FA; color: #284058; }
.t tbody td.r { text-align: right; }
.t tbody tr:last-child td { border-bottom: none; }
.t .tt td { background: #E8F1FB; font-weight: 700; color: #061628; } /* total row */
.t .hl td { background: #DCEFFE; color: #061628; }                   /* highlight row */
.fw { font-weight: 700; }
.red { color: #BC1E1E; }  /* negative numbers, expenses */
.bl  { color: #0E4A90; }  /* primary blue emphasis */
```

### 9.4 Inline Badges

```html
<span class="bdg b-g">+5</span>    <!-- green: positive change -->
<span class="bdg b-a">−20</span>   <!-- amber: negative/caution change -->
<span class="bdg b-b">Stabil</span> <!-- blue: neutral/stable -->
```

### 9.5 Section Label

```html
<div class="sec">Indikator Kinerja Utama</div>
```

### 9.6 Chart Legend

```html
<div class="leg">
  <span class="li"><span class="ls" style="background:#1358A4"></span>Series Name</span>
  <span class="li"><span class="ls" style="background:#0B8A60"></span>Series Name</span>
</div>
```

### 9.7 Progress Bar (for DERUM/TUKS split, BOPO, etc.)

```html
<div class="pb-row">
  <div class="pb-l">{{LABEL}}</div>
  <div class="pb-trk"><div class="pb-fill" style="width:{{PCT}}%;background:{{COLOR}}"></div></div>
  <div class="pb-v">{{VALUE}}<span class="pb-p">({{PCT}}%)</span></div>
</div>
```

```css
.pb-row  { display: flex; align-items: center; gap: 10px; margin-bottom: 7px; }
.pb-l    { font-size: 10.5px; color: #446280; font-weight: 500; width: 54px; flex-shrink: 0; }
.pb-trk  { flex: 1; height: 9px; background: #E6EEF8; border-radius: 5px; overflow: hidden; }
.pb-fill { height: 9px; border-radius: 5px; }
.pb-v    { font-size: 10.5px; font-weight: 700; color: #020E1C; width: 86px; text-align: right; flex-shrink: 0; }
.pb-p    { font-size: 9px; color: #9EBACE; font-weight: 400; margin-left: 3px; }
```

### 9.8 Status Bar (bottom of content)

```css
.sbar     { background: #061628; border-radius: 12px; padding: 13px 24px;
            display: flex; align-items: center; flex-wrap: wrap; gap: 18px; }
.sbar-ttl { font-size: 8.5px; font-weight: 700; letter-spacing: 2.5px;
            text-transform: uppercase; color: #68ACEE; white-space: nowrap; flex-shrink: 0; }
.si  { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 500; }
.ok  { color: #45D099; } .wn { color: #FFBB38; }
.dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.dok { background: #45D099; } .dwn { background: #FFBB38; }
```

```html
<div class="sbar">
  <div class="sbar-ttl">Kesesuaian Indikasi</div>
  <div class="si ok"><span class="dot dok"></span>Pendapatan Bersih — Sesuai</div>
  <div class="si wn"><span class="dot dwn"></span>BOPO — Belum Sesuai (53.2% vs target 53.1%)</div>
</div>
```

### 9.9 Footer

```css
.ftr { background: #061628; padding: 10px 36px; display: flex; justify-content: space-between; align-items: center; }
.ftr span { font-size: 9.5px; color: rgba(255,255,255,0.3); }
```

```html
<div class="ftr">
  <span>{{REPORT_FULL_NAME}}</span>
  <span>Disiapkan: {{DATE}} · Seluruh angka dalam IDR Juta kecuali disebutkan lain</span>
</div>
```

---

## 10. Layout Structure by Report Type

### Report 1 — Operasi & Realisasi (Executive Summary)

```
[HEADER]
  └── Logo Bar + Main (eyebrow / title / subtitle / badges)

[BODY]
  ├── Section Label: "Indikator Kinerja Utama"
  ├── KPI Strip (5 cards, .kpi-row)
  │     default / .gr / .am / .pu / default
  │
  ├── .row2  (856px + 1fr)
  │     ├── Card: Grouped Bar — Pendapatan Usaha & Laba Bersih (4 periods)
  │     └── Card: Doughnut  — Komposisi Pendapatan (4 segments)
  │
  ├── .row3  (430px + 370px + 1fr)
  │     ├── Card: Laba Rugi table (5 cols: Uraian + 4 periods) + BOPO mini progress
  │     ├── Card: Trafik Kapal bar chart + legend + table (4 rows + total)
  │     └── Card: SDM & Aset Lahan table + Tariff callout box
  │
  └── Status Bar (.sbar)

[FOOTER]
```

### Report 2 — Kertas Kerja A3 (Financial Workbook)

```
[HEADER]  (identical structure, different values)

[BODY]
  ├── Section Label: "Indikator Pendapatan Konsolidasi"
  ├── KPI Strip (5 cards, .krow) — 5 color variants
  │
  ├── .row-top  (854px + 1fr)
  │     ├── Card: Trend bar chart (6 periods, single dataset, color progression)
  │     └── Card: DERUM vs TUKS progress bars (2 groups: Prognosa + RKAP)
  │               + summary table (Segmen / 2026 / 2027 / Growth)
  │
  ├── .row-mid  (430px + 350px + 1fr)
  │     ├── Card: Grouped bar — Komponen (4 datasets × 3 categories) + stat boxes
  │     ├── Card: Doughnut — per Cabang (3 segments) + list rows
  │     └── Card: Grouped bar — TUKS (2 datasets × 2 categories)
  │               + split proportion bars + insight box
  │
  └── Status Bar (.sbar)

[FOOTER]
```

---

## 11. Reading the XLSX

Use `openpyxl` (Python) or `SheetJS` (JS) to read the workbook. Key extraction patterns:

```python
import openpyxl

wb = openpyxl.load_workbook('data.xlsx', data_only=True)

# Iterate sheets
for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    # Read a known cell
    value = ws['B5'].value
    # Read a range as list
    rows = [[cell.value for cell in row] for row in ws['A1:F20']]
```

**Mapping guidance:**
- Headers / period labels are typically in row 1 or column A
- Numeric values may be stored as `int`, `float`, or `None` — always coerce with `float(v or 0)`
- Indonesian number formatting: use `.toLocaleString('id-ID')` in JS (uses `.` as thousands separator, `,` as decimal)
- IDR amounts in the source are typically in **Juta (millions)** — confirm from sheet headers before scaling

---

## 12. Agent Workflow (Step by Step)

```
1. READ this SKILL.md fully before writing a single line of code.

2. PARSE the XLSX:
   - Identify sheet names and their purpose (Laba Rugi, Trafik, SDM, Pendapatan, etc.)
   - Extract all numeric values, period labels, and section headers
   - Normalize: strip whitespace, cast to float, handle None as 0

3. PLAN the layout:
   - Count KPI metrics → always exactly 5 per strip
   - Count chart series and categories → determines barPercentage
   - Decide grid column widths from the fixed table in §8

4. EMBED logos:
   - Load pelindo-logo.png and bumn-logo.png as base64 per §4.3
   - Insert as data URIs in the header HTML

5. BUILD the HTML file:
   - Start from the page shell in §5
   - Add the locked header from §4.2 (never modify its structure)
   - Build body sections following the layout for the report type (§10)
   - Configure Chart.js per §7 (always set devicePixelRatio * 2)
   - Add export function verbatim from §6.2

6. VERIFY before delivery:
   - #toolbar and #exportBtn are OUTSIDE #page
   - No inline filter: brightness(0) invert(1) on logos
   - All grid column px widths sum to ≤ 1328
   - barPercentage × number_of_datasets ≤ 0.85 (prevents overlap)
   - maintainAspectRatio: false on every chart
   - html2canvas scale: 3
   - Filename set correctly in a.download
   - **No two data-label sets share the same side** on a multi-series chart (combo bar+line: bar=`top`, line=`bottom`); tune axis `max` so series sit in separate height bands (§7.6)
   - Every chart prints its key values on-canvas (tooltips die in PNG export)

7. OUTPUT a single .html file.
```

---

## 13. Common Mistakes & Fixes

| Mistake | Fix |
|---|---|
| Charts appear blurry in export | Set `Chart.defaults.devicePixelRatio = window.devicePixelRatio * 2` |
| Bar charts only show 2 of 4 bars | Reduce `barPercentage` — use `0.36` for 2 datasets, `0.68` for 4 |
| Cards overlap in 3-col row | Use fixed px widths, not `fr` fractions; check sum ≤ 1328px |
| Export captures full viewport including toolbar | Export button must be outside `#page`; pass `width/height/windowWidth/windowHeight` to html2canvas |
| BUMN logo renders as solid white box | Remove any `filter: brightness(0) invert(1)`; remove any white wrapper div |
| Logo has black background box | Re-process with numpy channel thresholding per §4.3, embed as transparent PNG base64 |
| Donut segments overlapping or wrong shape | Always use Chart.js `doughnut` type — never hand-calculate SVG arc paths |
| Export PNG only captures half the page | Set `height: el.offsetHeight` and `windowHeight: el.offsetHeight` in html2canvas options |
| Numbers formatted wrong (e.g. 1,449 instead of 1.449) | Use `.toLocaleString('id-ID')` for Indonesian formatting |
| Data labels overlap in a combo bar+line chart | Put the two label sets on **opposite sides** (bar `align:'top'`, line `align:'bottom'`), add white-pill backgrounds, and tune axis `max` so the line traces below the bar tops (see §7.6) |

---

## 14. CDN Dependencies (always use these exact versions)

```html
<!-- Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Serif+Display&display=swap" rel="stylesheet">

<!-- Charts -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>

<!-- Chart Data Labels (on-canvas values; tooltips die in PNG export) -->
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>

<!-- PNG Export -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

---

## 15. Quick Reference — CSS Class Names

| Class | Purpose |
|---|---|
| `#page` | 1400px fixed wrapper, the export target |
| `#toolbar` | Export button container, lives outside #page |
| `.hdr` | Full header block |
| `.hdr-bar` | Top logo strip |
| `.hdr-main` | Title + badges row |
| `.body` | Main content area |
| `.sec` | Section label (uppercase, spaced) |
| `.kpi-row` / `.krow` | 5-column KPI strip grid |
| `.kpi` / `.kc` | Individual KPI card |
| `.row2` / `.row-top` | 2-column content row |
| `.row3` / `.row-mid` | 3-column content row |
| `.card` | White rounded content card |
| `.cw` | Chart canvas wrapper (needs explicit height) |
| `.t` | Data table |
| `.t .tt` | Total row (blue tinted) |
| `.t .hl` | Highlight row (blue accent) |
| `.bdg .b-g/.b-a/.b-b` | Inline badge (green/amber/blue) |
| `.leg` / `.li` / `.ls` | Chart legend row / item / color square |
| `.pb-row` | Progress bar row |
| `.sbar` | Dark status bar at bottom of content |
| `.ftr` | Dark footer strip |
| `.cu` / `.cd` / `.cn` | Delta color: up/down/neutral |
| `.fw` | Bold text |
| `.red` / `.bl` | Red negative / Blue emphasis text |
| `.r` | Right-align (on `th` or `td`) |
