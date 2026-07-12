import {
  cumulativeSum,
  findPeakMonth,
  firstVsLatest,
  shareOf,
} from "../aggregate";
import { MONTH_NAMES, MONTH_NAMES_SHORT, formatValue } from "../months";
import type { RecommendationCard } from "../recommendations";
import { findAllByCode } from "../tree";
import type {
  HeaderBadge,
  InsightSegment,
  ReportHeaderData,
  SheetNode,
  StatusBarItem,
} from "../types";
import type { KpiCardData } from "./arus";

const CODE = {
  PEMANDUAN: "401.02.00.00.00.00.00.00.00", // Kpl Grk / GT Kpl Grk
  PENUNDAAN: "401.03.00.00.00.00.00.00.00", // Kpl Jam / GT Kpl Jam
  PENAMBATAN: "401.04.00.00.00.00.00.00.00", // GT Etmal / Unit
  GENERAL_CARGO: "403.01.01.00.00.00.00.00.00", // Ton
  CURAH_KERING: "403.02.01.00.00.00.00.00.00", // Ton
};

function nodesByCode(roots: SheetNode[], code: string): SheetNode[] {
  return findAllByCode(roots, code);
}

function byCodeUnit(
  roots: SheetNode[],
  code: string,
  unit: string,
): SheetNode | undefined {
  return nodesByCode(roots, code).find((n) => n.unit === unit);
}

function months(
  node: SheetNode | undefined,
  throughMonth: number,
): (number | null)[] {
  return Array.from(
    { length: throughMonth + 1 },
    (_, i) => node?.months[i] ?? null,
  );
}

export interface ProduksiAnalysis extends ReportHeaderData {
  insight: InsightSegment[];
  kpis: KpiCardData[];
  monthLabels: string[][];
  commodityDatasets: {
    label: string;
    data: (number | null)[];
    color: string;
  }[];
  commodityTrendSubtitle: string;
  commodityComposition: { labels: string[]; data: number[] };
  commodityCompositionSubtitle: string;
  pemanduanTrend: (number | null)[];
  pemanduanSubtitle: string;
  serviceGTComposition: { labels: string[]; data: number[] };
  serviceGTSubtitle: string;
  serviceRows: { label: string; unit: string; total: number }[];
  serviceRowsSubtitle: string;
  status: StatusBarItem[];
  recommendations: RecommendationCard[];
}

export function analyzeProduksi(
  roots: SheetNode[],
  meta: { tahun: string },
  throughMonth: number,
): ProduksiAnalysis {
  const year = meta.tahun || "2026";
  const periodLabel =
    throughMonth === 0 ? MONTH_NAMES[0] : `Jan–${MONTH_NAMES[throughMonth]}`;
  const isPartial = throughMonth < 11;

  const gcNode = byCodeUnit(roots, CODE.GENERAL_CARGO, "Ton");
  const ckNode = byCodeUnit(roots, CODE.CURAH_KERING, "Ton");
  const cumGC = cumulativeSum(gcNode, throughMonth) ?? 0;
  const cumCK = cumulativeSum(ckNode, throughMonth) ?? 0;
  const totalProduksi = cumGC + cumCK;
  const shareCK = shareOf(cumCK, totalProduksi);

  const pemanduanNode = byCodeUnit(roots, CODE.PEMANDUAN, "Kpl Grk");
  const pemanduanGTNode = byCodeUnit(roots, CODE.PEMANDUAN, "GT Kpl Grk");
  const penundaanNode = byCodeUnit(roots, CODE.PENUNDAAN, "Kpl Jam");
  const penundaanGTNode = byCodeUnit(roots, CODE.PENUNDAAN, "GT Kpl Jam");
  const penambatanNode = byCodeUnit(roots, CODE.PENAMBATAN, "GT Etmal");

  const cumPemanduan = cumulativeSum(pemanduanNode, throughMonth);
  const cumPemanduanGT = cumulativeSum(pemanduanGTNode, throughMonth) ?? 0;
  const cumPenundaan = cumulativeSum(penundaanNode, throughMonth);
  const cumPenundaanGT = cumulativeSum(penundaanGTNode, throughMonth) ?? 0;
  const cumPenambatanGT = cumulativeSum(penambatanNode, throughMonth) ?? 0;
  const totalServiceGT = cumPemanduanGT + cumPenundaanGT + cumPenambatanGT;
  const sharePenundaanGT = shareOf(cumPenundaanGT, totalServiceGT);

  const peakGC = findPeakMonth(gcNode, throughMonth);
  const peakCK = findPeakMonth(ckNode, throughMonth);
  const dominantCommodity =
    cumCK >= cumGC
      ? { label: "Curah Kering", peak: peakCK, share: shareCK }
      : {
          label: "General Cargo",
          peak: peakGC,
          share: shareOf(cumGC, totalProduksi),
        };

  const monthLabels = MONTH_NAMES_SHORT.slice(0, throughMonth + 1).map((m) => [
    m,
    year,
  ]);
  // Generic "how far through the year" fill for non-ratio KPI cards — see arus.ts for derivation.
  const yearElapsedPct = ((throughMonth + 1) / 12) * 100;

  // ---- Chart card conclusion subtitles ----
  const combinedMonthly = Array.from(
    { length: throughMonth + 1 },
    (_, i) => (gcNode?.months[i] ?? 0) + (ckNode?.months[i] ?? 0),
  );
  let combinedPeakIdx = -1;
  let combinedPeakVal = -Infinity;
  combinedMonthly.forEach((v, i) => {
    if (v > combinedPeakVal) {
      combinedPeakVal = v;
      combinedPeakIdx = i;
    }
  });
  const ckAlwaysLeads = Array.from(
    { length: throughMonth + 1 },
    (_, i) => (ckNode?.months[i] ?? 0) >= (gcNode?.months[i] ?? 0),
  ).every(Boolean);
  const commodityTrendSubtitle =
    combinedPeakIdx >= 0 && combinedPeakVal > 0
      ? `Throughput puncak ${MONTH_NAMES_SHORT[combinedPeakIdx]} ${formatValue(combinedPeakVal, { decimals: 0 })} Ton${ckAlwaysLeads ? " — Curah Kering penggerak utama tiap bulan" : ""}`
      : "Komposisi bulanan General Cargo & Curah Kering.";

  const commodityCompositionSubtitle =
    dominantCommodity.share !== null
      ? `${dominantCommodity.label} mendominasi ${formatValue(dominantCommodity.share, { decimals: 1 })}% dari total ${formatValue(totalProduksi / 1_000_000, { decimals: 2 })} jt Ton`
      : "Pangsa komoditas terhadap total produksi barang.";

  const pemanduanFvL = firstVsLatest(pemanduanNode, throughMonth);
  const pemanduanPeak = findPeakMonth(pemanduanNode, throughMonth);
  const pemanduanSubtitle =
    pemanduanFvL && pemanduanPeak
      ? `Tren ${pemanduanFvL.deltaPct >= 0 ? "meningkat" : "menurun"} — puncak ${MONTH_NAMES[pemanduanPeak.monthIndex]} ${formatValue(pemanduanPeak.value)} gerakan, ${pemanduanFvL.deltaPct >= 0 ? "naik" : "turun"} dari ${formatValue(pemanduanFvL.first)} (${MONTH_NAMES[pemanduanFvL.firstMonth]})`
      : "Tren gerakan pemanduan kapal per bulan.";

  const serviceGTEntries = [
    { label: "Pemanduan", gt: cumPemanduanGT },
    { label: "Penundaan", gt: cumPenundaanGT },
    { label: "Penambatan", gt: cumPenambatanGT },
  ];
  const dominantService = serviceGTEntries.reduce(
    (a, b) => (b.gt > a.gt ? b : a),
    serviceGTEntries[0],
  );
  const shareDominantService = shareOf(dominantService.gt, totalServiceGT);
  const serviceGTSubtitle =
    shareDominantService !== null
      ? `${dominantService.label} dominan ${formatValue(shareDominantService, { decimals: 1 })}% dari total ${formatValue(totalServiceGT / 1_000_000, { decimals: 2 })} jt GT`
      : "Pangsa GT antar layanan pemanduan, penundaan & penambatan.";

  const serviceRowsSubtitle = `${dominantCommodity.label} komoditas terbesar; ${dominantService.label} layanan kapal tertinggi`;

  // ---- Insight ----
  const insight: InsightSegment[] = [];
  const seg = (text: string, emphasis?: "b" | "i") =>
    insight.push({ text, emphasis });

  seg("Regional 2 Banten menangani total produksi barang ");
  seg(`${formatValue(totalProduksi)} Ton`, "b");
  seg(` (${periodLabel} ${year})`);
  if (dominantCommodity.share !== null) {
    seg(", didominasi ");
    seg(
      `${dominantCommodity.label} ${formatValue(dominantCommodity.share, { decimals: 1 })}%`,
      "b",
    );
  }
  if (dominantCommodity.peak) {
    seg(" dengan puncak ");
    seg(
      `${MONTH_NAMES[dominantCommodity.peak.monthIndex]} ${formatValue(dominantCommodity.peak.value)} Ton`,
      "b",
    );
  }
  seg(".");
  if (cumPemanduan !== null) {
    seg(` Gerakan pemanduan `);
    seg(`${formatValue(cumPemanduan)} gerakan`, "b");
    seg(" tren periode berjalan");
    if (cumPenundaan !== null) {
      seg(", didampingi penundaan ");
      seg(`${formatValue(cumPenundaan)} Kpl Jam`, "b");
    }
    seg(".");
  }
  if (isPartial) {
    seg(
      ` Data realisasi s.d. ${MONTH_NAMES[throughMonth]} ${year} — tahun berjalan (${throughMonth + 1} dari 12 bulan).`,
      "i",
    );
  }

  // ---- KPI strip ----
  const kpis: KpiCardData[] = [
    {
      label: "Total Produksi Barang",
      value: formatValue(totalProduksi),
      unit: "Ton",
      deltaText:
        peakGC || peakCK
          ? `Puncak ${dominantCommodity.peak ? MONTH_NAMES[dominantCommodity.peak.monthIndex] : "-"}`
          : undefined,
      deltaTone: "up",
      color: "blue",
      trackPercent: yearElapsedPct,
    },
    {
      label: "Curah Kering",
      value: formatValue(cumCK),
      unit: "Ton",
      deltaText:
        shareCK !== null
          ? `${formatValue(shareCK, { decimals: 1 })}% total produksi barang`
          : undefined,
      deltaTone: "up",
      color: "green",
      trackPercent: shareCK ?? undefined,
    },
    {
      label: "Gerakan Pemanduan",
      value: cumPemanduan !== null ? formatValue(cumPemanduan) : "—",
      unit: "gerakan",
      deltaText: "Akumulasi periode berjalan",
      deltaTone: "up",
      color: "blue",
      trackPercent: yearElapsedPct,
    },
    {
      label: "Volume GT Penundaan",
      value: formatValue(cumPenundaanGT / 1_000_000, { decimals: 1 }),
      unit: "jt GT",
      deltaText:
        sharePenundaanGT !== null
          ? `${formatValue(sharePenundaanGT, { decimals: 1 })}% total GT layanan kapal`
          : undefined,
      deltaTone: "neutral",
      color: "purple",
      trackPercent: sharePenundaanGT ?? undefined,
    },
  ];

  // ---- Status bar ----
  const status: StatusBarItem[] = [];
  if (dominantCommodity.share !== null) {
    status.push({
      text: `Throughput ${formatValue(totalProduksi)} Ton — ${dominantCommodity.label} andil ${formatValue(dominantCommodity.share, { decimals: 1 })}%`,
      tone: "ok",
    });
  }
  if (cumPemanduan !== null)
    status.push({
      text: `Gerakan pemanduan ${formatValue(cumPemanduan)} gerakan periode berjalan`,
      tone: "ok",
    });
  if (sharePenundaanGT !== null)
    status.push({
      text: `Penundaan dominan ${formatValue(sharePenundaanGT, { decimals: 1 })}% dari total GT layanan kapal`,
      tone: "ok",
    });
  if (dominantCommodity.peak) {
    status.push({
      text: `${dominantCommodity.label} puncak di ${MONTH_NAMES[dominantCommodity.peak.monthIndex]} → ${formatValue(dominantCommodity.peak.value)} Ton`,
      tone: "ok",
    });
  }
  if (isPartial)
    status.push({
      text: `Data realisasi mencakup ${throughMonth + 1} dari 12 bulan (s.d. ${MONTH_NAMES[throughMonth]} ${year})`,
      tone: "warn",
    });

  // ---- Recommendations ----
  const recommendations: RecommendationCard[] = [];
  if (dominantCommodity.peak) {
    recommendations.push({
      type: "op",
      headline: `Pra-alokasikan kapasitas untuk puncak ${dominantCommodity.label}`,
      body: `${dominantCommodity.label} mencapai ${formatValue(dominantCommodity.peak.value)} Ton pada ${MONTH_NAMES[dominantCommodity.peak.monthIndex]} ${year}, bulan tertinggi periode berjalan. Pastikan kapasitas alat & gudang memadai menjelang pola puncak serupa.`,
      when: "Jangka Pendek",
    });
  }
  if (dominantCommodity.share !== null && dominantCommodity.share > 60) {
    recommendations.push({
      type: "st",
      headline: `Kurangi konsentrasi produksi pada ${dominantCommodity.label}`,
      body: `${dominantCommodity.label} menyumbang ${formatValue(dominantCommodity.share, { decimals: 1 })}% dari total produksi barang ${formatValue(totalProduksi)} Ton. Diversifikasi komoditas dapat mengurangi risiko konsentrasi permintaan.`,
      when: "Jangka Menengah",
    });
  }
  if (isPartial) {
    recommendations.push({
      type: "rk",
      headline: "Validasi kelengkapan data sebelum proyeksi tahunan",
      body: `Data realisasi baru mencakup ${throughMonth + 1} dari 12 bulan (${periodLabel} ${year}). Gunakan sebagai indikasi tren, bukan basis proyeksi tahun penuh.`,
      when: "Validasi",
    });
  }

  return {
    eyebrow: `Produksi & Throughput · Realisasi s.d. ${MONTH_NAMES[throughMonth]} ${year}`,
    title: "Kinerja Produksi ",
    titleAccent: `s.d. ${MONTH_NAMES[throughMonth]} ${year}`,
    subtitle:
      "Volume produksi jasa kapal & penanganan barang — Regional 2 Banten",
    badges: [
      {
        value: `${formatValue(totalProduksi / 1_000_000, { decimals: 2 })} jt`,
        label: "Total Produksi (Ton)",
      },
      cumPemanduan !== null
        ? { value: formatValue(cumPemanduan), label: "Gerakan Pemanduan" }
        : null,
      {
        value: `${throughMonth + 1} Bln`,
        label: `Periode (${periodLabel} ${year})`,
      },
      shareCK !== null
        ? {
            value: `${formatValue(shareCK, { decimals: 1 })}%`,
            label: "Share Curah Kering",
          }
        : null,
    ].filter((b): b is HeaderBadge => b !== null),
    insight,
    kpis,
    monthLabels,
    commodityDatasets: [
      {
        label: "General Cargo",
        data: months(gcNode, throughMonth),
        color: "#6CA4E0",
      },
      {
        label: "Curah Kering",
        data: months(ckNode, throughMonth),
        color: "#1E62C4",
      },
    ],
    commodityTrendSubtitle,
    commodityComposition: {
      labels: ["General Cargo", "Curah Kering"],
      data: [cumGC, cumCK],
    },
    commodityCompositionSubtitle,
    pemanduanTrend: months(pemanduanNode, throughMonth),
    pemanduanSubtitle,
    serviceGTComposition: {
      labels: ["Pemanduan", "Penundaan", "Penambatan"],
      data: [cumPemanduanGT, cumPenundaanGT, cumPenambatanGT],
    },
    serviceGTSubtitle,
    serviceRows: [
      { label: "Curah Kering", unit: "Ton", total: cumCK },
      { label: "General Cargo", unit: "Ton", total: cumGC },
      { label: "Pemanduan", unit: "Gerakan", total: cumPemanduan ?? 0 },
      { label: "Penundaan", unit: "Kpl Jam", total: cumPenundaan ?? 0 },
      { label: "Penambatan", unit: "GT Etmal", total: cumPenambatanGT },
    ],
    serviceRowsSubtitle,
    status,
    recommendations,
    statusBarTitle: "Status Kinerja & Penanda Penting",
    footerLeft: `LAP2026 Banten — Kinerja Produksi Pelayanan s.d. ${MONTH_NAMES[throughMonth]} ${year} — PT Pelabuhan Indonesia (Persero)`,
    footerRight: `Satuan volume produksi sesuai kolom · Periode Januari–${MONTH_NAMES[throughMonth]} ${year} · Disiapkan Juli 2026`,
  };
}
