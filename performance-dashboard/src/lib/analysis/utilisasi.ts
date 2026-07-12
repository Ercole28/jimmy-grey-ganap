import { averageUnderMatchingHeaders, cumulativeAverage, cumulativeSum, findPeakMonth, rankUnderMatchingHeaders } from "../aggregate";
import { MONTH_NAMES, MONTH_NAMES_SHORT, formatValue } from "../months";
import type { RecommendationCard } from "../recommendations";
import { findAllByCode } from "../tree";
import type { HeaderBadge, InsightSegment, ReportHeaderData, SheetNode, StatusBarItem } from "../types";
import type { KpiCardData } from "./arus";

const CODE = {
  BOR_PETIKEMAS: "A21010000",
  BOR_MULTIPURPOSE: "A22010000",
  BOR_CURAH_CAIR: "A23010000",
  BOR_CURAH_KERING: "A24010000",
  SOR_CURAH_KERING: "A24030000",
  KESIAPAN_KAPAL_TUNDA: "B21010100",
  UTILISASI_KAPAL_TUNDA: "B21020100",
  BBM_KAPAL_TUNDA: "B21030100",
};

function byCode(roots: SheetNode[], code: string): SheetNode | undefined {
  return findAllByCode(roots, code)[0];
}

function months(node: SheetNode | undefined, throughMonth: number): (number | null)[] {
  return Array.from({ length: throughMonth + 1 }, (_, i) => node?.months[i] ?? null);
}

export interface UtilisasiAnalysis extends ReportHeaderData {
  insight: InsightSegment[];
  kpis: KpiCardData[];
  monthLabels: string[][];
  borTrendDatasets: { label: string; data: (number | null)[]; color: string }[];
  borSubtitle: string;
  readinessRanking: { labels: string[]; data: number[]; colors: string[] };
  readinessSubtitle: string;
  utilizationRanking: { labels: string[]; data: number[]; colors: string[] };
  utilizationSubtitle: string;
  sorTrend: (number | null)[];
  sorSubtitle: string;
  kapalTundaUtil: (number | null)[];
  kapalTundaReady: (number | null)[];
  kapalTundaSubtitle: string;
  bbmTrend: (number | null)[];
  bbmSubtitle: string;
  status: StatusBarItem[];
  recommendations: RecommendationCard[];
}

export function analyzeUtilisasi(roots: SheetNode[], meta: { tahun: string }, throughMonth: number): UtilisasiAnalysis {
  const year = meta.tahun || "2026";
  const periodLabel = throughMonth === 0 ? MONTH_NAMES[0] : `Jan–${MONTH_NAMES[throughMonth]}`;
  const isPartial = throughMonth < 11;

  const readinessAvg = averageUnderMatchingHeaders(roots, /^Kesiapan alat bongkar muat$/i, "%", throughMonth);
  const utilizationAvg = averageUnderMatchingHeaders(roots, /^Utilisasi alat bongkar muat$/i, "%", throughMonth);
  const readinessRanking = rankUnderMatchingHeaders(roots, /^Kesiapan alat bongkar muat$/i, "%", throughMonth);
  const utilizationRanking = rankUnderMatchingHeaders(roots, /^Utilisasi alat bongkar muat$/i, "%", throughMonth);
  const equipmentUnion = new Set([...readinessRanking.map((r) => r.label), ...utilizationRanking.map((r) => r.label)]);

  const borTerminals = [
    { label: "Multipurpose", code: CODE.BOR_MULTIPURPOSE, color: "#B6D2F0" },
    { label: "Curah Kering", code: CODE.BOR_CURAH_KERING, color: "#6CA4E0" },
    { label: "Curah Cair", code: CODE.BOR_CURAH_CAIR, color: "#1E62C4" },
  ];
  const borAverages = borTerminals
    .map((t) => ({ label: t.label, avg: cumulativeAverage(byCode(roots, t.code), throughMonth) }))
    .filter((t): t is { label: string; avg: number } => t.avg !== null);
  const topBOR = borAverages.reduce((a, b) => (b.avg > a.avg ? b : a), borAverages[0]);

  const kapalTundaUtilAvg = cumulativeAverage(byCode(roots, CODE.UTILISASI_KAPAL_TUNDA), throughMonth);
  const kapalTundaReadyAvg = cumulativeAverage(byCode(roots, CODE.KESIAPAN_KAPAL_TUNDA), throughMonth);
  const bbmTotal = cumulativeSum(byCode(roots, CODE.BBM_KAPAL_TUNDA), throughMonth);

  const gapPP = readinessAvg !== null && utilizationAvg !== null ? readinessAvg - utilizationAvg : null;
  const monthLabels = MONTH_NAMES_SHORT.slice(0, throughMonth + 1).map((m) => [m, year]);
  // Generic "how far through the year" fill for non-ratio KPI cards — see arus.ts for derivation.
  const yearElapsedPct = ((throughMonth + 1) / 12) * 100;

  // ---- Semantic ranking colors ----
  const READY_GREEN = "#0B8A60";
  const READY_RED = "#BC1E1E";
  const READY_BLUE = "#5888D4";
  const readinessColors = readinessRanking.map((r, i) => (i === 0 ? READY_GREEN : r.value < 90 ? READY_RED : READY_BLUE));

  const utilAscending = [...utilizationRanking].sort((a, b) => a.value - b.value);
  const UTIL_GRADIENT = ["#A8BCD4", "#6CA4E0", "#1E62C4"];
  const utilColors = utilAscending.map((_, i) => UTIL_GRADIENT[Math.min(UTIL_GRADIENT.length - 1, Math.floor((i / utilAscending.length) * UTIL_GRADIENT.length))]);

  // ---- Chart card conclusion subtitles ----
  const borSpike = borTerminals
    .filter((t) => t.label !== topBOR?.label)
    .map((t) => {
      const node = byCode(roots, t.code);
      const peak = findPeakMonth(node, throughMonth);
      const avg = borAverages.find((b) => b.label === t.label)?.avg ?? null;
      return peak && avg !== null && avg > 0 ? { label: t.label, peak, avg } : null;
    })
    .filter((x): x is { label: string; peak: { monthIndex: number; value: number }; avg: number } => x !== null)
    .sort((a, b) => b.peak.value / b.avg - a.peak.value / a.avg)[0];
  let borSubtitle = topBOR ? `${topBOR.label} tersibuk (${formatValue(topBOR.avg, { decimals: 1 })}%)` : "Perbandingan tingkat okupansi dermaga antar terminal.";
  if (borSpike && borSpike.peak.value / borSpike.avg > 1.3) {
    borSubtitle += `; ${borSpike.label} melonjak di ${MONTH_NAMES_SHORT[borSpike.peak.monthIndex]} (${formatValue(borSpike.peak.value, { decimals: 1 })}%)`;
  }

  const readinessSubtitle =
    readinessRanking.length > 0
      ? `${readinessRanking[0].label} tertinggi ${formatValue(readinessRanking[0].value, { decimals: 1 })}%; ${readinessRanking[readinessRanking.length - 1].label} terendah ${formatValue(readinessRanking[readinessRanking.length - 1].value, { decimals: 1 })}%`
      : "Peringkat kesiapan alat, rata-rata periode berjalan.";

  const utilTop = utilAscending[utilAscending.length - 1];
  const utilBottomTwo = utilAscending.slice(0, 2);
  let utilizationSubtitle = utilTop ? `${utilTop.label} tertinggi ${formatValue(utilTop.value, { decimals: 1 })}%` : "Peringkat utilisasi alat, rata-rata periode berjalan.";
  if (utilBottomTwo.length === 2 && utilBottomTwo[1].value < 10) {
    utilizationSubtitle += `; ${utilBottomTwo.map((u) => u.label).join(" & ")} nyaris idle`;
  }

  const sorNode = byCode(roots, CODE.SOR_CURAH_KERING);
  const sorPeak = findPeakMonth(sorNode, throughMonth);
  const sorAvg = cumulativeAverage(sorNode, throughMonth);
  const sorSubtitle =
    sorPeak && sorAvg !== null
      ? `Penumpukan memuncak di ${MONTH_NAMES[sorPeak.monthIndex]} (${formatValue(sorPeak.value, { decimals: 1 })}%), rata-rata ${formatValue(sorAvg, { decimals: 1 })}%`
      : "Tren tingkat penumpukan gudang/lapangan bulanan.";

  const kapalTundaSubtitle =
    kapalTundaUtilAvg !== null && kapalTundaReadyAvg !== null
      ? `Dimanfaatkan ${formatValue(kapalTundaUtilAvg, { decimals: 1 })}% dengan kesiapan ${kapalTundaReadyAvg > 90 ? "prima " : ""}${formatValue(kapalTundaReadyAvg, { decimals: 1 })}%`
      : "Utilisasi vs kesiapan operasional Kapal Tunda.";

  const bbmNode = byCode(roots, CODE.BBM_KAPAL_TUNDA);
  const bbmPeak = findPeakMonth(bbmNode, throughMonth);
  const bbmSubtitle =
    bbmTotal !== null
      ? `Total ${formatValue(bbmTotal / 1_000_000, { decimals: 2 })} jt L${bbmPeak ? `; puncak ${MONTH_NAMES[bbmPeak.monthIndex]} (${formatValue(bbmPeak.value, { decimals: 0 })} L)` : ""}`
      : "Tren konsumsi bahan bakar bulanan.";

  // ---- Insight ----
  const insight: InsightSegment[] = [];
  const seg = (text: string, emphasis?: "b" | "i") => insight.push({ text, emphasis });

  if (readinessAvg !== null) {
    seg("Kesiapan alat bongkar muat tercatat sangat tinggi ");
    seg(`${formatValue(readinessAvg, { decimals: 1 })}%`, "b");
  }
  if (utilizationAvg !== null) {
    seg(" namun utilisasinya hanya ");
    seg(`${formatValue(utilizationAvg, { decimals: 1 })}%`, "b");
  }
  if (gapPP !== null) {
    seg(" — ");
    seg(`gap ~${formatValue(gapPP, { decimals: 0 })} pp`, "b");
    seg(" mengindikasikan kapasitas siap namun idle.");
  } else {
    seg(".");
  }
  if (topBOR) {
    seg(` Terminal ${topBOR.label} menjadi dermaga tersibuk dengan BOR rata-rata `);
    seg(`${formatValue(topBOR.avg, { decimals: 1 })}%`, "b");
    seg(",");
  }
  if (kapalTundaUtilAvg !== null) {
    seg(` sementara Kapal Tunda dimanfaatkan `);
    seg(`${formatValue(kapalTundaUtilAvg, { decimals: 1 })}%`, "b");
    if (kapalTundaReadyAvg !== null) {
      seg(" dengan kesiapan ");
      seg(`${formatValue(kapalTundaReadyAvg, { decimals: 1 })}%`, "b");
    }
    seg(".");
  }
  if (bbmTotal !== null) {
    seg(` Total konsumsi BBM Kapal Tunda mencapai `);
    seg(`${formatValue(bbmTotal / 1_000_000, { decimals: 2 })} jt L`, "b");
    seg(` sepanjang periode.`);
  }
  if (isPartial) {
    seg(` Data mencakup ${periodLabel} ${year} (parsial, ${throughMonth + 1} dari 12 bulan).`, "i");
  }

  // ---- KPI strip ----
  const kpis: KpiCardData[] = [
    {
      label: "Kesiapan Alat BM",
      value: readinessAvg !== null ? formatValue(readinessAvg, { decimals: 1 }) : "—",
      unit: "%",
      deltaText: "Rata-rata seluruh alat terpantau",
      deltaTone: "up",
      color: "green",
      trackPercent: readinessAvg ?? undefined,
    },
    {
      label: "Utilisasi Alat BM",
      value: utilizationAvg !== null ? formatValue(utilizationAvg, { decimals: 1 }) : "—",
      unit: "%",
      deltaText: "Jauh di bawah kesiapan",
      deltaTone: "down",
      color: "amber",
      trackPercent: utilizationAvg ?? undefined,
    },
    {
      label: topBOR ? `BOR Tertinggi (${topBOR.label})` : "BOR Tertinggi",
      value: topBOR ? formatValue(topBOR.avg, { decimals: 1 }) : "—",
      unit: "%",
      deltaText: borAverages.length > 1 ? `Tersibuk dari ${borAverages.length} terminal` : undefined,
      deltaTone: "neutral",
      color: "blue",
      trackPercent: topBOR?.avg,
    },
    {
      label: "Utilisasi Kapal Tunda",
      value: kapalTundaUtilAvg !== null ? formatValue(kapalTundaUtilAvg, { decimals: 1 }) : "—",
      unit: "%",
      deltaText: kapalTundaReadyAvg !== null ? `Kesiapan ${formatValue(kapalTundaReadyAvg, { decimals: 1 })}%` : undefined,
      deltaTone: "neutral",
      color: "purple",
      trackPercent: kapalTundaUtilAvg ?? undefined,
    },
    {
      label: "Total BBM Kapal Tunda",
      value: bbmTotal !== null ? formatValue(bbmTotal / 1_000_000, { decimals: 2 }) : "—",
      unit: "jt L",
      deltaText: `${throughMonth + 1} bulan (${periodLabel} ${year})`,
      deltaTone: "neutral",
      color: "blue",
      trackPercent: yearElapsedPct,
    },
  ];

  // ---- Status bar ----
  const status: StatusBarItem[] = [];
  if (readinessAvg !== null) status.push({ text: `Kesiapan alat BM sangat baik — rata-rata ${formatValue(readinessAvg, { decimals: 1 })}%`, tone: "ok" });
  if (kapalTundaReadyAvg !== null && kapalTundaUtilAvg !== null) {
    status.push({ text: `Kapal Tunda prima — kesiapan ${formatValue(kapalTundaReadyAvg, { decimals: 1 })}% & utilisasi ${formatValue(kapalTundaUtilAvg, { decimals: 1 })}%`, tone: "ok" });
  }
  if (gapPP !== null && gapPP > 30) {
    status.push({ text: `Utilisasi alat BM rendah (${formatValue(utilizationAvg ?? 0, { decimals: 1 })}%) — gap ${formatValue(gapPP, { decimals: 0 })} pp vs kesiapan`, tone: "warn" });
  }
  if (topBOR) status.push({ text: `Terminal ${topBOR.label} tersibuk — BOR ${formatValue(topBOR.avg, { decimals: 1 })}% tertinggi`, tone: "ok" });
  if (isPartial) status.push({ text: `Data realisasi mencakup ${throughMonth + 1} dari 12 bulan (s.d. ${MONTH_NAMES[throughMonth]} ${year})`, tone: "warn" });

  // ---- Recommendations ----
  const recommendations: RecommendationCard[] = [];
  if (gapPP !== null && gapPP > 30 && utilBottomTwo.length === 2 && topBOR) {
    recommendations.push({
      type: "op",
      headline: "Realokasikan alat BM idle ke area berbeban tinggi",
      body: `Utilisasi rata-rata hanya ${formatValue(utilizationAvg ?? 0, { decimals: 1 })}% vs kesiapan ${formatValue(readinessAvg ?? 0, { decimals: 1 })}%. ${utilBottomTwo.map((u) => `${u.label} (${formatValue(u.value, { decimals: 1 })}%)`).join(" & ")} nyaris tidak digunakan — tinjau realokasi ke dermaga ${topBOR.label} yang BOR-nya ${formatValue(topBOR.avg, { decimals: 1 })}%.`,
      when: "Jangka Pendek",
    });
  }
  const worstReadiness = readinessRanking[readinessRanking.length - 1];
  if (worstReadiness && worstReadiness.value < 95) {
    recommendations.push({
      type: "op",
      headline: `Prioritaskan pemeliharaan ${worstReadiness.label}`,
      body: `${worstReadiness.label} memiliki kesiapan terendah ${formatValue(worstReadiness.value, { decimals: 1 })}%, di bawah ambang normal 95%. Jadwalkan maintenance untuk mencegah penurunan kinerja lebih lanjut.`,
      when: "Segera",
    });
  }
  if (kapalTundaReadyAvg !== null && kapalTundaUtilAvg !== null && kapalTundaReadyAvg - kapalTundaUtilAvg > 30) {
    recommendations.push({
      type: "st",
      headline: `Tingkatkan monetisasi Kapal Tunda yang baru ${formatValue(kapalTundaUtilAvg, { decimals: 1 })}%`,
      body: `Kesiapan ${formatValue(kapalTundaReadyAvg, { decimals: 1 })}% tapi utilisasi ${formatValue(kapalTundaUtilAvg, { decimals: 1 })}% menyisakan ruang ~${formatValue(kapalTundaReadyAvg - kapalTundaUtilAvg, { decimals: 0 })}% kapasitas armada tunda. Kaji peluang penambahan jasa pelayanan atau kerja sama lintas regional.`,
      when: "Jangka Menengah",
    });
  }
  if (sorPeak && sorAvg !== null && sorPeak.value > 60) {
    recommendations.push({
      type: "rk",
      headline: "Pantau kapasitas penumpukan Terminal Curah Kering",
      body: `SOR melonjak ke ${formatValue(sorPeak.value, { decimals: 1 })}% di ${MONTH_NAMES[sorPeak.monthIndex]} dengan rata-rata ${formatValue(sorAvg, { decimals: 1 })}%, mendekati ambang kepenuhan yard. Siapkan rencana mitigasi alih muatan sebelum SOR menembus 70%.`,
      when: "Monitor",
    });
  }
  if (isPartial) {
    recommendations.push({
      type: "rk",
      headline: "Validasi kelengkapan data sebelum evaluasi tahunan",
      body: `Data saat ini baru mencakup ${throughMonth + 1} dari 12 bulan (${periodLabel} ${year}). Gunakan sebagai indikasi tren, bukan basis evaluasi kinerja tahunan penuh.`,
      when: "Validasi",
    });
  }

  return {
    eyebrow: `Manajemen Aset · ${periodLabel} ${year}`,
    title: "Kinerja ",
    titleAccent: "Utilisasi",
    titleSuffix: `Aset ${year}`,
    subtitle: "Utilisasi Infrastruktur & Suprastruktur — Regional 2 Banten",
    badges: [
      { value: `${periodLabel} ${year}`, label: "Periode Realisasi" },
      equipmentUnion.size > 0 ? { value: `${equipmentUnion.size} Unit`, label: "Alat Bongkar Muat" } : null,
      readinessAvg !== null ? { value: `${formatValue(readinessAvg, { decimals: 1 })}%`, label: "Kesiapan Alat (avg)" } : null,
      utilizationAvg !== null ? { value: `${formatValue(utilizationAvg, { decimals: 1 })}%`, label: "Utilisasi Alat (avg)" } : null,
    ].filter((b): b is HeaderBadge => b !== null),
    insight,
    kpis,
    monthLabels,
    borTrendDatasets: borTerminals
      .filter((t) => borAverages.some((b) => b.label === t.label))
      .map((t) => ({ label: t.label, data: months(byCode(roots, t.code), throughMonth), color: t.color })),
    borSubtitle,
    readinessRanking: { labels: readinessRanking.map((r) => r.label), data: readinessRanking.map((r) => r.value), colors: readinessColors },
    readinessSubtitle,
    utilizationRanking: { labels: utilAscending.map((r) => r.label), data: utilAscending.map((r) => r.value), colors: utilColors },
    utilizationSubtitle,
    sorTrend: months(byCode(roots, CODE.SOR_CURAH_KERING), throughMonth),
    sorSubtitle,
    kapalTundaUtil: months(byCode(roots, CODE.UTILISASI_KAPAL_TUNDA), throughMonth),
    kapalTundaReady: months(byCode(roots, CODE.KESIAPAN_KAPAL_TUNDA), throughMonth),
    kapalTundaSubtitle,
    bbmTrend: months(byCode(roots, CODE.BBM_KAPAL_TUNDA), throughMonth),
    bbmSubtitle,
    status,
    recommendations,
    statusBarTitle: "Key Takeaways",
    footerLeft: `Kinerja Utilisasi Aset ${year} — PT Pelabuhan Indonesia (Persero)`,
    footerRight: `Disiapkan: Juli 2026 · Seluruh angka dalam % kecuali BBM (Liter) · Data Jan–${MONTH_NAMES[throughMonth]} ${year}${isPartial ? " (parsial)" : ""}`,
  };
}
