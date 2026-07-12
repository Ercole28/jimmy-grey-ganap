# Performance Dashboard — PRD
Source: `performance-dashboard\SOURCE.md`

## 1. Goal
A local-only React + Vite web app that shows Cabang Banten's branch performance, live from the Google Sheet defined in `SOURCE.md` / `.env`. Four tabs, one per sheet — **ARUS**, **KINERJA**, **UTILISASI**, **PRODUKSI** — each viewable per-month or as a full-year (Jan–Dec) trend. Visual identity matches the existing Pelindo report brand (`pelindo-skill`).

## 2. Data source & live fetch
- Use the **CSV export links** (not the Sheets API — file is `.xlsx`-backed, API unsupported per `SOURCE.md`).
- Confirmed by direct test: the CSV export endpoint returns `Access-Control-Allow-Origin` permissively on both the redirect and final `googleusercontent.com` host, so the app can **fetch client-side, directly from the browser** — no local proxy/backend needed.
- Fetch behavior: **on page load**, plus a **manual "Refresh" button**; no background polling (confirmed).
- A **"Last synced: <date/time>"** indicator sits near the refresh button, updated on every successful fetch. Not persisted across reloads — a fresh page load always re-fetches and re-stamps.
- All 4 sheets are scoped to a single branch (Regional 2 / Cabang 38 — Banten, year 2026) baked into the sheet itself. The dashboard is **single-branch, single-year** for now — switching branch/year later just means pointing `.env` at a different Sheet ID, no UI branch-selector is being built.

## 3. Parsing the sheets
Each sheet shares one shape, discovered by pulling the live CSVs:
- Metadata rows at the top (Tahun, Regional, Cabang, sheet title) — used for a small context strip, not shown as data.
- A header block: `No | Uraian | ... | Satuan | Januari..Desember | Total`.
- Below that, **hierarchical rows** (category → subcategory → item → unit-row), nesting expressed by which column the label text starts in. Some line items carry two stacked unit-rows (e.g. `Call` then `GT`).
- Many cells are genuinely blank (not zero) for months not yet reported — Jun–Dec 2026 are blank as of now. Blank must render as "no data yet" (e.g. `—`), not as 0, in both cards and charts.
- A single generic parser (shared across all 4 tabs) turns each sheet into a tree: `{ code, label, level, unit?, months[12], total }`, where nodes with no `unit`/values are section headers and leaf nodes carry the data.

## 4. Per-tab content
Each tab = **headline KPI cards** (curated) **+ trend chart** for the selected KPIs **+ the full hierarchical table** below as an expandable/collapsible tree (mirrors the spreadsheet exactly, so nothing is hidden — just deprioritized visually).

Top-level sections found per sheet (KPI cards are proposed one-per-section below; **please confirm or edit which single metric represents each card** — exact cell mapping happens during implementation):

- **ARUS** (5 sections): Kunjungan Kapal (ship calls) · Arus Petikemas (container throughput) · Arus Barang Nonpetikemas – Dermaga Umum · Arus Barang Nonpetikemas – Non Dermaga Umum · Arus Penumpang (passengers)
- **KINERJA** (4 sections): Kinerja Pelayanan Kapal (WT/AT/TRT) · Kinerja Pelayanan Tambatan · Kinerja Pelayanan Petikemas · Kinerja Pelayanan Non Petikemas
- **UTILISASI** (2 sections): Utilisasi Infrastruktur (BOR/YOR/SOR per terminal) · Utilisasi Suprastruktur (equipment readiness/utilization)
- **PRODUKSI** (12+ sections, longest sheet): Pelayanan Kapal · Pelayanan Petikemas · Non-Petikemas (General Cargo/Curah Kering/Curah Cair/Gas/Car Terminal/Bag Cargo) · Pelayanan Pelra · Pengusahaan Alat · Pengusahaan Properti · Pelayanan Forwarding · Marine Services — given the count, propose showing headline cards for the **top 5–6 by operational relevance** (Pelayanan Kapal, Pelayanan Petikemas, Non-Petikemas aggregate, Pengusahaan Alat, Pengusahaan Properti, Marine Services) and leave the rest fully visible only in the drill-down tree.

## 5. View modes
- **Month selector**: pick one month → KPI cards show that month's value + delta vs. the previous month.
- **Full Year toggle**: switches KPI cards/charts to a Jan–Dec trend (line/bar), skipping blank future months rather than plotting them as zero.

## 6. Branding (match `pelindo-skill` standard)
- Header: navy gradient `linear-gradient(112deg,#061628 0%,#0B3464 44%,#1358A4 78%,#1C6CC0 100%)`, dual logos (`pelindo-logo.png`, `danantara-indonesia.png` from `report-generator/assets/`) inside a translucent white `.logo-wrapper` pill (`rgba(255,255,255,0.88)`, blur backdrop).
- Palette: page-bg `#E8EEF7`, canvas `#cbd5e8`, card `#FFFFFF`, text-deep `#061628`, text-muted `#7B98B5`; status accents green `#0B8A60`, amber `#C07808`, purple `#5135AE`, red `#BC1E1E`; eyebrow/accent blue `#79B8FF`/`#90CAFF` (note: the brand's accent is **light blue, not gold** — correcting my earlier question).
- Type: `DM Serif Display` for the header title, `Outfit` for everything else (Google Fonts).
- Card/KPI radius 12–14px, soft shadows, top-border color-coded KPI cards — same as the HTML reports.

## 7. Tech stack
- React + Vite, TypeScript.
- `papaparse` for CSV parsing.
- Recharts for trend/KPI charts.

## 8. Out of scope
- No deployment/hosting, no auth, no multi-branch switcher UI, no data editing/write-back to the sheet, no offline/cached mode.
