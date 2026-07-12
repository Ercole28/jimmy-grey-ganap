import {
  cumulativeSum,
  findAnomaly,
  findPeakMonth,
  shareOf,
  sumByLabelAcrossTree,
  sumUnderMatchingHeaders,
} from "../aggregate";
import { shortLocationLabel } from "../labels";
import { MONTH_NAMES, MONTH_NAMES_SHORT, formatValue } from "../months";
import type { RecommendationCard } from "../recommendations";
import { findAllByLabel, findFirstByLabel } from "../tree";
import type { HeaderBadge, InsightSegment, KpiColor, ReportHeaderData, SheetNode, StatusBarItem } from "../types";

export interface KpiCardData {
  label: string;
  value: string;
  unit: string;
  deltaText?: string;
  deltaTone?: "up" | "down" | "neutral";
  color: KpiColor;
  trackPercent?: number;
}

export interface LocationFigure {
  label: string;
  rawLabel: string;
  call: number;
  sharePct: number;
  gt: number;
  gtPerCall: number;
}

export interface CrossRow {
  label: string;
  call: number;
  sharePct: number;
  isTotal?: boolean;
}

export interface NoteBox {
  title: string;
  body: InsightSegment[];
}

export interface ArusAnalysis extends ReportHeaderData {
  insight: InsightSegment[];
  kpis: KpiCardData[];
  monthLabels: string[][];
  trendCall: (number | null)[];
  trendGT: (number | null)[];
  trendSubtitle: string;
  voyageComposition: { labels: string[]; data: number[] };
  voyageSubtitle: string;
  cargoRanking: { labels: string[]; data: number[] };
  cargoSubtitle: string;
  locations: LocationFigure[];
  distribusiSubtitle: string;
  biggerShipNote: NoteBox | null;
  crossRows: CrossRow[];
  crossTableSubtitle: string;
  segmentationNote: NoteBox | null;
  detailRows: { label: string; call: number; sharePct: number }[];
  status: StatusBarItem[];
  recommendations: RecommendationCard[];
}

const LOCATION_LABELS = [
  "DERMAGA UMUM",
  "REDE TRANSPORT / LOADING POINT / DOLPHIN / PINGGIRAN",
  "TUKS / TERMINAL KHUSUS / UPP / BUP LAIN / PELABUHAN KHUSUS",
  "LOADING POINT (DI LUAR DLKR)",
];

const CARGO_LABELS = [
  "General Cargo",
  "Curah Cair BBM",
  "Gas",
  "Curah Cair Non - BBM",
  "Curah Kering",
  "Petikemas",
  "Ro - ro",
  "Hewan",
  "Cruise (Penumpang Wisata Asing)",
  "Penumpang",
];

/** Matches both label variants used across locations: "(Jumlah) Tug Boat dan Tongkang" and "Tug Boat dan atau Tongkang" — but not "Tug Boat tanpa tongkang" (a different category). */
const TUG_BOAT_TONGKANG = /^(?:Jumlah )?Tug Boat dan(?: atau)? Tongkang$/i;

function exact(label: string): RegExp {
  return new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

export function analyzeArus(roots: SheetNode[], meta: { tahun: string }, throughMonth: number): ArusAnalysis {
  const year = meta.tahun || "2026";
  const periodLabel = throughMonth === 0 ? MONTH_NAMES[0] : `Jan–${MONTH_NAMES[throughMonth]}`;

  const grandCallNode = findAllByLabel(roots, /^Jumlah kunjungan kapal$/i).find((n) => n.unit === "Call");
  const grandGTNode = findAllByLabel(roots, /^Jumlah kunjungan kapal$/i).find((n) => n.unit === "GT");

  const cumCall = cumulativeSum(grandCallNode, throughMonth);
  const cumGT = cumulativeSum(grandGTNode, throughMonth);
  const gtPerCall = cumCall && cumGT ? cumGT / cumCall : null;

  // ---- Voyage composition (Dalam/Luar Negeri/Lainnya) ----
  const ln = sumUnderMatchingHeaders(roots, /^Pelayaran Luar Negeri$/i, "Call", throughMonth) ?? 0;
  const dn = sumUnderMatchingHeaders(roots, /^Pelayaran Dalam Negeri$/i, "Call", throughMonth) ?? 0;
  const lainnya =
    (sumUnderMatchingHeaders(roots, /^Pelayaran Perintis$/i, "Call", throughMonth) ?? 0) +
    (sumUnderMatchingHeaders(roots, /^Pelayaran Rakyat$/i, "Call", throughMonth) ?? 0) +
    (sumUnderMatchingHeaders(roots, /^Pelayaran Lainnya$/i, "Call", throughMonth) ?? 0);
  const voyageTotal = ln + dn + lainnya;
  const shareDN = shareOf(dn, voyageTotal);

  // ---- Location breakdown ----
  const locations: LocationFigure[] = LOCATION_LABELS.map((rawLabel) => {
    const callNode = findAllByLabel(roots, exact(`Jumlah kunjungan kapal di ${rawLabel}`)).find((n) => n.unit === "Call");
    const gtNode = findAllByLabel(roots, exact(`Jumlah kunjungan kapal di ${rawLabel}`)).find((n) => n.unit === "GT");
    const call = cumulativeSum(callNode, throughMonth) ?? 0;
    const gt = cumulativeSum(gtNode, throughMonth) ?? 0;
    return { label: shortLocationLabel(rawLabel), rawLabel, call, sharePct: shareOf(call, cumCall) ?? 0, gt, gtPerCall: call > 0 ? gt / call : 0 };
  })
    .filter((l) => l.call > 0)
    .sort((a, b) => b.call - a.call);

  // ---- Location × voyage-type cross table ----
  const VOYAGE_TYPES = [
    { label: "Dalam Negeri", match: /^Pelayaran Dalam Negeri$/i },
    { label: "Luar Negeri", match: /^Pelayaran Luar Negeri$/i },
  ];
  const locationVoyage = locations.map((loc) => {
    const rootNode = findFirstByLabel(roots, exact(loc.rawLabel));
    const scoped = rootNode ? [rootNode] : [];
    const lainnyaScoped =
      (sumUnderMatchingHeaders(scoped, /^Pelayaran Perintis$/i, "Call", throughMonth) ?? 0) +
      (sumUnderMatchingHeaders(scoped, /^Pelayaran Rakyat$/i, "Call", throughMonth) ?? 0) +
      (sumUnderMatchingHeaders(scoped, /^Pelayaran Lainnya$/i, "Call", throughMonth) ?? 0);
    const types = [
      ...VOYAGE_TYPES.map((vt) => ({ label: vt.label, call: sumUnderMatchingHeaders(scoped, vt.match, "Call", throughMonth) ?? 0 })),
      { label: "Lainnya", call: lainnyaScoped },
    ]
      .filter((t) => t.call > 0)
      .sort((a, b) => b.call - a.call);
    return { loc, types };
  });

  const crossRows: CrossRow[] = locationVoyage.flatMap(({ loc, types }) =>
    types.map((t) => ({ label: `${loc.label} · ${t.label}`, call: t.call, sharePct: shareOf(t.call, cumCall) ?? 0 })),
  );
  if (crossRows.length > 0 && cumCall !== null) {
    crossRows.push({ label: "Total Regional 2 Banten", call: cumCall, sharePct: 100, isTotal: true });
  }

  const topLeadsBoth =
    locationVoyage.length > 0 &&
    VOYAGE_TYPES.every((vt) => {
      const ranked = locationVoyage
        .map(({ loc, types }) => ({ label: loc.label, call: types.find((t) => t.label === vt.label)?.call ?? 0 }))
        .sort((a, b) => b.call - a.call);
      return ranked[0]?.call > 0 && ranked[0].label === locationVoyage[0]?.loc.label;
    });

  // ---- Cargo type ranking ----
  const cargoRaw = [
    ...CARGO_LABELS.map((label) => ({
      label: label.replace(/\s*-\s*/g, "-"),
      value: sumByLabelAcrossTree(roots, exact(label), "Call", throughMonth) ?? 0,
    })),
    { label: "Tug Boat/Tongkang", value: sumByLabelAcrossTree(roots, TUG_BOAT_TONGKANG, "Call", throughMonth) ?? 0 },
  ].filter((c) => c.value > 0);
  cargoRaw.sort((a, b) => b.value - a.value);

  // ---- Monthly trend (non-cumulative, Jan..throughMonth) ----
  const monthLabels = MONTH_NAMES_SHORT.slice(0, throughMonth + 1).map((m) => [m, year]);
  const trendCall = Array.from({ length: throughMonth + 1 }, (_, i) => grandCallNode?.months[i] ?? null);
  const trendGT = Array.from({ length: throughMonth + 1 }, (_, i) => {
    const v = grandGTNode?.months[i];
    return v !== undefined && v !== null ? v / 1_000_000 : null;
  });

  const peak = findPeakMonth(grandCallNode, throughMonth);
  const anomaly = findAnomaly(grandCallNode, throughMonth);
  const topLocation = locations[0];
  const isPartial = throughMonth < 11;

  // Generic "how far through the year" fill for cumulative (non-ratio) KPI
  // cards — every reference report card shows a track/fill, and this is the
  // one formula that reproduces the reference's own numbers exactly (e.g.
  // 5 of 12 months = 41.7%, matching Kunjungan Kapal's card verbatim).
  const yearElapsedPct = ((throughMonth + 1) / 12) * 100;
  const peakMoM = peak && peak.monthIndex > 0 ? grandCallNode?.months[peak.monthIndex - 1] : null;
  const peakDelta = peak && peakMoM !== null && peakMoM !== undefined && peakMoM !== 0 ? ((peak.value - peakMoM) / Math.abs(peakMoM)) * 100 : null;

  // ---- Chart card conclusion subtitles ----
  const peakGTValue = peak ? (grandGTNode?.months[peak.monthIndex] ?? null) : null;
  const nextMonthIdx = peak && peak.monthIndex + 1 <= throughMonth ? peak.monthIndex + 1 : null;
  const nextMonthCall = nextMonthIdx !== null ? (grandCallNode?.months[nextMonthIdx] ?? null) : null;
  const nextMonthDeltaPct = nextMonthCall !== null && peak && peak.value !== 0 ? ((nextMonthCall - peak.value) / peak.value) * 100 : null;
  let trendSubtitle = "Belum ada data tren kunjungan kapal.";
  if (peak) {
    trendSubtitle = `Trafik memuncak di ${MONTH_NAMES[peak.monthIndex]} (${formatValue(peak.value)} kunjungan${
      peakGTValue !== null ? ` / ${formatValue(peakGTValue / 1_000_000, { decimals: 2 })} jt GT` : ""
    })`;
    trendSubtitle +=
      nextMonthDeltaPct !== null && nextMonthIdx !== null
        ? ` lalu ${nextMonthDeltaPct < 0 ? "terkoreksi" : "melanjutkan kenaikan"} ${formatValue(Math.abs(nextMonthDeltaPct), { decimals: 1 })}% di ${MONTH_NAMES[nextMonthIdx]}.`
        : " pada periode berjalan.";
  }

  const voyageEntries = [
    { label: "Dalam Negeri", value: dn },
    { label: "Luar Negeri", value: ln },
    { label: "Lainnya", value: lainnya },
  ];
  const topVoyage = voyageEntries.reduce((a, b) => (b.value > a.value ? b : a), voyageEntries[0]);
  const topVoyageShare = shareOf(topVoyage.value, voyageTotal);
  const voyageSubtitle =
    topVoyageShare !== null ? `${topVoyage.label} mendominasi ${formatValue(topVoyageShare, { decimals: 1 })}% trafik kunjungan.` : "Belum ada data komposisi jenis pelayaran.";

  const cargoSubtitle =
    cargoRaw.length >= 2
      ? `${cargoRaw[0].label} (${formatValue(shareOf(cargoRaw[0].value, cumCall) ?? 0, { decimals: 1 })}%) & ${cargoRaw[1].label} (${formatValue(shareOf(cargoRaw[1].value, cumCall) ?? 0, { decimals: 1 })}%) memimpin trafik.`
      : cargoRaw.length === 1
        ? `${cargoRaw[0].label} mendominasi trafik muatan.`
        : "Belum ada data jenis muatan.";

  const distribusiSubtitle =
    topLocation && locations.length >= 2 && topLocation.gtPerCall > locations[1].gtPerCall
      ? `${topLocation.label} menangani ${formatValue(topLocation.sharePct, { decimals: 0 })}% trafik dengan kapal lebih besar (${formatValue(topLocation.gtPerCall, { decimals: 0 })} GT/kunjungan).`
      : topLocation
        ? `${topLocation.label} menangani ${formatValue(topLocation.sharePct, { decimals: 0 })}% trafik kunjungan.`
        : "Belum ada data distribusi lokasi.";

  const biggerShipRatio = topLocation && locations[1] && locations[1].gtPerCall > 0 ? topLocation.gtPerCall / locations[1].gtPerCall : null;
  const biggerShipNote: NoteBox | null =
    biggerShipRatio !== null && biggerShipRatio >= 1.15 && topLocation && locations[1]
      ? {
          title: `Kapal Lebih Besar di ${topLocation.label}`,
          body: [
            { text: `Rata-rata GT/kunjungan di ${topLocation.label} (${formatValue(topLocation.gtPerCall, { decimals: 0 })}) ` },
            { text: `${formatValue(biggerShipRatio, { decimals: 1 })}× lebih besar`, emphasis: "b" },
            { text: ` dibanding ${locations[1].label} (${formatValue(locations[1].gtPerCall, { decimals: 0 })}) — indikasi layanan kapal samudra.` },
          ],
        }
      : null;

  const crossTableSubtitle = topLeadsBoth && topLocation ? `${topLocation.label} memimpin di kedua jenis pelayaran dengan volume tertinggi.` : "Rincian kunjungan per lokasi & jenis pelayaran.";

  const lnGT = sumUnderMatchingHeaders(roots, /^Pelayaran Luar Negeri$/i, "GT", throughMonth);
  const shareLNCall = shareOf(ln, voyageTotal);
  const shareLNGT = shareOf(lnGT, cumGT);
  const segmentationNote: NoteBox | null =
    shareLNCall !== null && shareLNGT !== null && lnGT !== null && shareLNGT > shareLNCall * 1.3
      ? {
          title: "Catatan Segmentasi",
          body: [
            { text: `Luar Negeri hanya ${formatValue(shareLNCall, { decimals: 1 })}% kunjungan, namun menyumbang ` },
            { text: `${formatValue(shareLNGT, { decimals: 1 })}% GT`, emphasis: "b" },
            { text: ` (${formatValue(lnGT / 1_000_000, { decimals: 2 })} jt GT) — kapal LN berukuran jauh lebih besar per kunjungan.` },
          ],
        }
      : null;

  // ---- Insight ----
  const insight: InsightSegment[] = [];
  const seg = (text: string, emphasis?: "b" | "i") => insight.push({ text, emphasis });

  seg("Regional 2 Banten mencatat ");
  seg(`${formatValue(cumCall)} kunjungan kapal`, "b");
  if (cumGT !== null) {
    seg(" dengan total ");
    seg(`${formatValue(cumGT / 1_000_000, { decimals: 2 })} juta GT`, "b");
  }
  seg(` selama ${periodLabel} ${year}`);
  if (shareDN !== null) {
    seg(", didominasi pelayaran ");
    seg(`Dalam Negeri (${formatValue(shareDN, { decimals: 1 })}%)`, "b");
  }
  if (topLocation) {
    seg(" di lokasi ");
    seg(`${topLocation.label} (${formatValue(topLocation.sharePct, { decimals: 0 })}%)`, "b");
  }
  if (peak) {
    seg(". Trafik memuncak pada ");
    seg(`${MONTH_NAMES[peak.monthIndex]} (${formatValue(peak.value)} kunjungan)`, "b");
    seg(".");
  } else {
    seg(".");
  }
  if (isPartial) {
    seg(` Data realisasi mencakup ${throughMonth + 1} dari 12 bulan (s.d. ${MONTH_NAMES[throughMonth]} ${year}).`, "i");
  }

  // ---- KPI strip ----
  const kpis: KpiCardData[] = [
    {
      label: "Kunjungan Kapal",
      value: formatValue(cumCall),
      unit: "Call",
      deltaText: throughMonth > 0 && cumCall !== null ? `Rata-rata ${formatValue(cumCall / (throughMonth + 1))} kunjungan / bulan` : undefined,
      deltaTone: "up",
      color: "green",
      trackPercent: yearElapsedPct,
    },
    {
      label: "Gross Tonnage",
      value: cumGT !== null ? formatValue(cumGT / 1_000_000, { decimals: 2 }) : "—",
      unit: "juta GT",
      deltaText: gtPerCall !== null ? `${formatValue(gtPerCall, { decimals: 0 })} GT per kunjungan rata-rata` : undefined,
      deltaTone: "neutral",
      color: "blue",
      trackPercent: yearElapsedPct,
    },
    {
      label: "Share Dalam Negeri",
      value: shareDN !== null ? formatValue(shareDN, { decimals: 1 }) : "—",
      unit: "%",
      deltaText: shareDN !== null ? `${formatValue(dn)} dari ${formatValue(voyageTotal)} kunjungan` : undefined,
      deltaTone: "up",
      color: "green",
      trackPercent: shareDN ?? undefined,
    },
    {
      label: peak ? `Puncak Trafik — ${MONTH_NAMES[peak.monthIndex]}` : "Puncak Trafik",
      value: peak ? formatValue(peak.value) : "—",
      unit: "kunjungan",
      deltaText:
        peakDelta !== null && peak && peak.monthIndex > 0
          ? `${peakDelta >= 0 ? "+" : ""}${formatValue(peakDelta, { decimals: 1 })}% MoM vs ${MONTH_NAMES[peak.monthIndex - 1]}`
          : undefined,
      deltaTone: peakDelta !== null && peakDelta < 0 ? "down" : "up",
      color: "amber",
      trackPercent: peak ? 100 : undefined,
    },
  ];

  // ---- Status bar ----
  const status: StatusBarItem[] = [];
  if (shareDN !== null) {
    status.push({ text: `Dalam Negeri mendominasi ${formatValue(shareDN, { decimals: 1 })}% (${formatValue(dn)} kunjungan) trafik total`, tone: "ok" });
  }
  if (topLocation) {
    status.push({
      text: `${topLocation.label} menangani ${formatValue(topLocation.sharePct, { decimals: 0 })}% trafik dengan GT/kunjungan ${formatValue(topLocation.gtPerCall, { decimals: 0 })}`,
      tone: "ok",
    });
  }
  if (cargoRaw.length >= 2) {
    const top2Share = shareOf(cargoRaw[0].value + cargoRaw[1].value, cumCall);
    if (top2Share !== null) {
      status.push({ text: `${cargoRaw[0].label} & ${cargoRaw[1].label} menyumbang ${formatValue(top2Share, { decimals: 1 })}% kunjungan`, tone: "ok" });
    }
  }
  if (anomaly) {
    status.push({
      text: `Trafik ${MONTH_NAMES[anomaly.monthIndex]} menyimpang ${formatValue(anomaly.deviationPct, { decimals: 1 })}% dari rata-rata bulan lain`,
      tone: "warn",
    });
  }
  if (isPartial) {
    status.push({ text: `Data realisasi baru mencakup ${throughMonth + 1} dari 12 bulan (s.d. ${MONTH_NAMES[throughMonth]} ${year})`, tone: "warn" });
  }

  // ---- Recommendations ----
  const recommendations: RecommendationCard[] = [];
  if (peak) {
    recommendations.push({
      type: "op",
      headline: "Antisipasi lonjakan trafik pada periode puncak berikutnya",
      body: `${MONTH_NAMES[peak.monthIndex]} ${year} mencatat ${formatValue(peak.value)} kunjungan, bulan tertinggi pada periode berjalan. Pastikan ketersediaan alat pandu & tunda memadai menjelang periode dengan pola serupa.`,
      when: "Jangka Pendek",
    });
  }
  if (shareDN !== null && (100 - shareDN) > 0) {
    const shareLN = shareOf(ln, voyageTotal);
    recommendations.push({
      type: "st",
      headline: "Evaluasi peluang pengembangan layanan kapal Luar Negeri",
      body: `Pelayaran Luar Negeri hanya ${formatValue(shareLN ?? 0, { decimals: 1 })}% kunjungan dari total ${periodLabel}. Bandingkan nilai GT per kunjungan LN vs DN untuk menilai potensi menarik kunjungan tambahan.`,
      when: "Jangka Menengah",
    });
  }
  if (topLocation && topLocation.sharePct > 50) {
    recommendations.push({
      type: "rk",
      headline: `Pantau konsentrasi trafik di ${topLocation.label} untuk cegah bottleneck`,
      body: `${formatValue(topLocation.sharePct, { decimals: 0 })}% trafik (${formatValue(topLocation.call)} kunjungan) terkonsentrasi di satu lokasi. Konsentrasi ini berisiko bottleneck kapasitas dermaga saat puncak musim.`,
      when: "Monitor",
    });
  }
  if (anomaly) {
    recommendations.push({
      type: "rk",
      headline: `Validasi data kunjungan kapal ${MONTH_NAMES[anomaly.monthIndex]}`,
      body: `Nilai ${formatValue(anomaly.value)} kunjungan pada ${MONTH_NAMES[anomaly.monthIndex]} menyimpang ${formatValue(Math.abs(anomaly.deviationPct), { decimals: 1 })}% dari rata-rata bulan lain. Konfirmasi ke sumber data sebelum dipakai sebagai basis proyeksi.`,
      when: "Validasi",
    });
  }

  return {
    eyebrow: `Kinerja Trafik · ${periodLabel} ${year}`,
    title: "Arus Kapal & ",
    titleAccent: "Trafik",
    titleSuffix: "Regional 2 Banten",
    subtitle: `Realisasi Kunjungan Kapal s.d. ${MONTH_NAMES[throughMonth]} ${year} — Berdasarkan Lokasi Sandar, Jenis Pelayaran & Jenis Muatan`,
    badges: [
      { value: formatValue(cumCall), label: "Kunjungan Kapal" },
      cumGT !== null ? { value: `${formatValue(cumGT / 1_000_000, { decimals: 2 })} jt`, label: "Gross Tonnage (GT)" } : null,
      gtPerCall !== null ? { value: formatValue(gtPerCall, { decimals: 0 }), label: "GT per Kunjungan" } : null,
      { value: periodLabel, label: `Realisasi ${year}` },
    ].filter((b): b is HeaderBadge => b !== null),
    insight,
    kpis,
    monthLabels,
    trendCall,
    trendGT,
    trendSubtitle,
    voyageComposition: { labels: ["Dalam Negeri", "Luar Negeri", "Lainnya"], data: [dn, ln, lainnya] },
    voyageSubtitle,
    cargoRanking: { labels: cargoRaw.slice(0, 8).map((c) => c.label), data: cargoRaw.slice(0, 8).map((c) => c.value) },
    cargoSubtitle,
    locations,
    distribusiSubtitle,
    biggerShipNote,
    crossRows,
    crossTableSubtitle,
    segmentationNote,
    detailRows: locations.map((l) => ({ label: l.label, call: l.call, sharePct: l.sharePct })),
    status,
    recommendations,
    statusBarTitle: "Key Takeaways",
    footerLeft: "LAP2026_Banten_ArusKapal — PT Pelabuhan Indonesia (Persero), Regional 2 Banten",
    footerRight: "Disiapkan: Juli 2026 · Kunjungan dalam Call, GT dalam satuan Gross Tonnage",
  };
}
