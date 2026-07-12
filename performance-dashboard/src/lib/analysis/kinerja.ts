import { cumulativeAverage, findAnomaly, firstVsLatest } from "../aggregate";
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

// Stable codes (label text repeats across LN/DN/KONSOLIDASI/terminal groups — codes disambiguate).
const CODE = {
  WT_KONSOLIDASI: "E130100000000",
  AT_KONSOLIDASI: "E130400000000",
  TRT_KONSOLIDASI: "E130500000000",
  TGH_CURAH_KERING_KONSOLIDASI: "D130300000000",
  TGH_CURAH_CAIR_KONSOLIDASI: "D130200000000",
};

const TERMINALS = [
  {
    label: "Multipurpose",
    bt: "F130201000000",
    bwt: "F130202000000",
    et: "F130203000000",
    it: "F130204000000",
    not: "F130205000000",
    etbt: "F130206000000",
  },
  {
    label: "Curah Cair",
    bt: "F130301000000",
    bwt: "F130302000000",
    et: "F130303000000",
    it: "F130304000000",
    not: "F130305000000",
    etbt: "F130306000000",
  },
  {
    label: "Curah Kering",
    bt: "F130401000000",
    bwt: "F130402000000",
    et: "F130403000000",
    it: "F130404000000",
    not: "F130405000000",
    etbt: "F130406000000",
  },
];

function byCode(roots: SheetNode[], code: string): SheetNode | undefined {
  return findAllByCode(roots, code)[0];
}

export interface TerminalDetail {
  label: string;
  bt: number | null;
  et: number | null;
  it: number | null;
  etbt: number | null;
  isBest?: boolean;
  isAverage?: boolean;
}

export interface KinerjaAnalysis extends ReportHeaderData {
  insight: InsightSegment[];
  kpis: KpiCardData[];
  monthLabels: string[][];
  etbtTrendDatasets: {
    label: string;
    data: (number | null)[];
    color: string;
  }[];
  etbtTrendSubtitle: string;
  btCompositionLabels: string[][];
  btCompositionDatasets: {
    label: string;
    data: (number | null)[];
    color: string;
  }[];
  btCompositionSubtitle: string;
  serviceLabels: string[][];
  serviceAT: (number | null)[];
  serviceWT: (number | null)[];
  serviceSubtitle: string;
  productivityTrend: (number | null)[];
  productivitySubtitle: string;
  terminals: TerminalDetail[];
  status: StatusBarItem[];
  recommendations: RecommendationCard[];
}

export function analyzeKinerja(
  roots: SheetNode[],
  meta: { tahun: string },
  throughMonth: number,
): KinerjaAnalysis {
  const year = meta.tahun || "2026";
  const periodLabel =
    throughMonth === 0 ? MONTH_NAMES[0] : `Jan–${MONTH_NAMES[throughMonth]}`;
  const isPartial = throughMonth < 11;

  const wtNode = byCode(roots, CODE.WT_KONSOLIDASI);
  const atNode = byCode(roots, CODE.AT_KONSOLIDASI);
  const tghKeringNode = byCode(roots, CODE.TGH_CURAH_KERING_KONSOLIDASI);
  const tghCairNode = byCode(roots, CODE.TGH_CURAH_CAIR_KONSOLIDASI);

  const wtAvg = cumulativeAverage(wtNode, throughMonth);
  const atAvg = cumulativeAverage(atNode, throughMonth);

  const terminalsBase: TerminalDetail[] = TERMINALS.map((t) => ({
    label: t.label,
    bt: cumulativeAverage(byCode(roots, t.bt), throughMonth),
    et: cumulativeAverage(byCode(roots, t.et), throughMonth),
    it: cumulativeAverage(byCode(roots, t.it), throughMonth),
    etbt: cumulativeAverage(byCode(roots, t.etbt), throughMonth),
  })).filter((t) => t.bt !== null);

  const etbtValues = terminalsBase.filter((t) => t.etbt !== null);
  const best = etbtValues.reduce(
    (a, b) => ((b.etbt ?? 0) > (a.etbt ?? 0) ? b : a),
    etbtValues[0],
  );
  const worst = etbtValues.reduce(
    (a, b) => ((b.etbt ?? 0) < (a.etbt ?? 0) ? b : a),
    etbtValues[0],
  );
  const flagship =
    terminalsBase.find((t) => t.label === "Multipurpose") ?? terminalsBase[0];

  const mean = (values: (number | null)[]) => {
    const nums = values.filter((v): v is number => v !== null);
    return nums.length > 0
      ? nums.reduce((a, b) => a + b, 0) / nums.length
      : null;
  };
  const terminals: TerminalDetail[] = [
    ...terminalsBase.map((t) => ({ ...t, isBest: t === best })),
    {
      label: "Rata-rata",
      bt: mean(terminalsBase.map((t) => t.bt)),
      et: mean(terminalsBase.map((t) => t.et)),
      it: mean(terminalsBase.map((t) => t.it)),
      etbt: mean(terminalsBase.map((t) => t.etbt)),
      isAverage: true,
    },
  ];

  const itTrend = firstVsLatest(byCode(roots, TERMINALS[0].it), throughMonth);
  const productivityTrend = firstVsLatest(tghKeringNode, throughMonth);
  const anomaly = findAnomaly(tghCairNode, throughMonth);
  // Generic "how far through the year" fill for non-ratio KPI cards — see arus.ts for derivation.
  const yearElapsedPct = ((throughMonth + 1) / 12) * 100;

  const monthLabels = MONTH_NAMES_SHORT.slice(0, throughMonth + 1).map((m) => [
    m,
    year,
  ]);

  const etbtTrendDatasets = [
    {
      label: "Multipurpose",
      data: months(byCode(roots, TERMINALS[0].etbt), throughMonth),
      color: "#1E62C4",
    },
    {
      label: "Curah Cair",
      data: months(byCode(roots, TERMINALS[1].etbt), throughMonth),
      color: "#0B8A60",
    },
    {
      label: "Curah Kering",
      data: months(byCode(roots, TERMINALS[2].etbt), throughMonth),
      color: "#C07808",
    },
  ];

  const btCompositionDatasets = [
    {
      label: "Effective Time (ET)",
      data: terminalsBase.map((t) => t.et),
      color: "#10986A",
    },
    {
      label: "Idle Time (IT)",
      data: terminalsBase.map((t) => t.it),
      color: "#BC1E1E",
    },
    {
      label: "Not Op Time (NOT)",
      data: terminalsBase.map((t) =>
        t.bt !== null && t.et !== null && t.it !== null
          ? t.bt - t.et - t.it
          : null,
      ),
      color: "#7BA8D8",
    },
  ];

  const serviceAT = [
    cumulativeAverage(byCode(roots, "E110400000000"), throughMonth),
    cumulativeAverage(byCode(roots, "E120400000000"), throughMonth),
    atAvg,
  ];
  const serviceWT = [
    cumulativeAverage(byCode(roots, "E110100000000"), throughMonth),
    cumulativeAverage(byCode(roots, "E120100000000"), throughMonth),
    wtAvg,
  ];

  // ---- Chart card conclusion subtitles ----
  let etbtTrendSubtitle = best
    ? `${best.label} paling efisien (rata-rata ${formatValue(best.etbt ?? 0, { decimals: 1 })}%)`
    : "Belum ada data efisiensi tambat.";
  const others = terminalsBase.filter((t) => t !== best);
  if (best && others.length > 0) {
    const otherVals = others.map((t) => t.etbt ?? 0);
    const spread = Math.max(...otherVals) - Math.min(...otherVals);
    const namesJoined = others.map((t) => t.label).join(" & ");
    etbtTrendSubtitle +=
      others.length > 1 && spread <= 3
        ? `; ${namesJoined} stagnan di ~${formatValue((Math.max(...otherVals) + Math.min(...otherVals)) / 2, { decimals: 0 })}%`
        : `; ${others.map((t) => `${t.label} ${formatValue(t.etbt ?? 0, { decimals: 1 })}%`).join(", ")}`;
  }

  const btCompositionSubtitle =
    flagship && best
      ? `Hanya ~${formatValue(flagship.etbt ?? 0, { decimals: 0 })}% waktu tambat ${flagship.label} yang produktif; ${best.label} paling efisien`
      : "Effective / Idle / Not Operation Time rata-rata periode berjalan.";

  const wtDescriptor =
    wtAvg !== null && wtAvg < 0.5
      ? `nyaris nol (${formatValue(wtAvg, { decimals: 2 })} jam) — pelayanan prima`
      : `${formatValue(wtAvg ?? 0, { decimals: 2 })} jam`;
  const serviceSubtitle =
    atAvg !== null
      ? `AT Konsolidasi ${formatValue(atAvg, { decimals: 2 })} jam; WT ${wtDescriptor}`
      : "Rata-rata Approach Time & Waiting Time per segmen pelayaran.";

  let productivitySubtitle = productivityTrend
    ? `Tren ${productivityTrend.deltaPct < 0 ? "menurun" : "meningkat"} ${formatValue(productivityTrend.deltaPct, { decimals: 1 })}% (${MONTH_NAMES_SHORT[productivityTrend.firstMonth]}→${MONTH_NAMES_SHORT[productivityTrend.latestMonth]})`
    : "Tren bulanan produktivitas bongkar muat Curah Kering (Konsolidasi).";
  if (anomaly)
    productivitySubtitle += `; Curah Cair ada anomali data ${MONTH_NAMES[anomaly.monthIndex]}`;

  // ---- Insight ----
  const insight: InsightSegment[] = [];
  const seg = (text: string, emphasis?: "b" | "i") =>
    insight.push({ text, emphasis });

  seg(
    `Kinerja pelayanan Regional 2 Banten s.d. ${MONTH_NAMES[throughMonth]} ${year} menunjukkan waktu tunggu kapal `,
  );
  seg(
    wtAvg !== null
      ? `rata-rata ${formatValue(wtAvg, { decimals: 2 })} jam`
      : "belum tercatat",
    "b",
  );
  if (atAvg !== null) {
    seg(" dengan Approach Time ");
    seg(`${formatValue(atAvg, { decimals: 2 })} jam`, "b");
  }
  if (best && worst && best !== worst) {
    seg(". Efisiensi tambat (ET/BT) Konsolidasi berkisar ");
    seg(
      `${formatValue(Math.min(best.etbt ?? 0, worst.etbt ?? 0), { decimals: 1 })}%–${formatValue(Math.max(best.etbt ?? 0, worst.etbt ?? 0), { decimals: 1 })}%`,
      "b",
    );
    seg(` — Terminal ${best.label} paling efisien`);
  }
  if (itTrend && itTrend.deltaPct < 0) {
    seg(`, sementara Idle Time (IT) Multipurpose berhasil diturunkan `);
    seg(`${formatValue(Math.abs(itTrend.deltaPct), { decimals: 1 })}%`, "b");
  }
  seg(".");
  if (productivityTrend && productivityTrend.deltaPct < -10) {
    seg(
      ` Produktivitas Curah Kering menurun ${formatValue(productivityTrend.deltaPct, { decimals: 1 })}% (${MONTH_NAMES[productivityTrend.firstMonth]}→${MONTH_NAMES[productivityTrend.latestMonth]})`,
      "i",
    );
  }
  if (anomaly) {
    seg(
      `${productivityTrend && productivityTrend.deltaPct < -10 ? " dan terdapat" : " Terdapat"} anomali data T/G/H Curah Cair ${MONTH_NAMES[anomaly.monthIndex]} (${formatValue(anomaly.value)}) yang perlu validasi.`,
      "i",
    );
  }

  // ---- KPI strip ----
  const kpis: KpiCardData[] = [
    {
      label: "Efisiensi ET/BT",
      value:
        flagship?.etbt !== null && flagship
          ? formatValue(flagship.etbt, { decimals: 1 })
          : "—",
      unit: "%",
      deltaText: best
        ? `Terminal ${best.label} terefisien (${formatValue(best.etbt ?? 0, { decimals: 1 })}%)`
        : undefined,
      deltaTone: "up",
      color: "green",
      trackPercent: flagship?.etbt ?? undefined,
    },
    {
      label: "Waiting Time (WT)",
      value: wtAvg !== null ? formatValue(wtAvg, { decimals: 2 }) : "—",
      unit: "jam",
      deltaText: "Rata-rata Konsolidasi periode berjalan",
      deltaTone: "up",
      color: "green",
      trackPercent: yearElapsedPct,
    },
    {
      label: "Approach Time (AT)",
      value: atAvg !== null ? formatValue(atAvg, { decimals: 2 }) : "—",
      unit: "jam",
      deltaText: "Rata-rata Konsolidasi periode berjalan",
      deltaTone: "neutral",
      color: "blue",
      trackPercent: yearElapsedPct,
    },
    {
      label: "Produktivitas Curah Kering",
      value:
        cumulativeAverage(tghKeringNode, throughMonth) !== null
          ? formatValue(cumulativeAverage(tghKeringNode, throughMonth)!, {
              decimals: 1,
            })
          : "—",
      unit: "T/G/H",
      deltaText: productivityTrend
        ? `${productivityTrend.deltaPct >= 0 ? "▲" : "▼"} ${formatValue(Math.abs(productivityTrend.deltaPct), { decimals: 1 })}% vs ${MONTH_NAMES[productivityTrend.firstMonth]} ${year}`
        : undefined,
      deltaTone:
        productivityTrend && productivityTrend.deltaPct < 0 ? "down" : "up",
      color: "amber",
      trackPercent: yearElapsedPct,
    },
    {
      label: "Idle Time (IT) Multipurpose",
      value:
        flagship?.it !== null && flagship
          ? formatValue(flagship.it, { decimals: 1 })
          : "—",
      unit: "jam",
      deltaText: itTrend
        ? `${itTrend.deltaPct <= 0 ? "▼" : "▲"} ${formatValue(Math.abs(itTrend.deltaPct), { decimals: 1 })}% vs ${MONTH_NAMES[itTrend.firstMonth]} ${year}${itTrend.deltaPct < 0 ? " (membaik)" : ""}`
        : undefined,
      deltaTone: itTrend && itTrend.deltaPct < 0 ? "up" : "down",
      color: "amber",
      trackPercent: yearElapsedPct,
    },
  ];

  // ---- Status bar ----
  const status: StatusBarItem[] = [];
  if (wtAvg !== null)
    status.push({
      text: `WT Konsolidasi rata-rata ${formatValue(wtAvg, { decimals: 2 })} jam — kapal langsung dilayani`,
      tone: "ok",
    });
  if (best)
    status.push({
      text: `${best.label} paling efisien, ET/BT ${formatValue(best.etbt ?? 0, { decimals: 1 })}% (rata-rata periode)`,
      tone: "ok",
    });
  if (itTrend && itTrend.deltaPct < 0) {
    status.push({
      text: `Idle Time Multipurpose turun ${formatValue(Math.abs(itTrend.deltaPct), { decimals: 1 })}% (${formatValue(itTrend.first, { decimals: 2 })}→${formatValue(itTrend.latest, { decimals: 2 })} jam)`,
      tone: "ok",
    });
  }
  if (productivityTrend && productivityTrend.deltaPct < -10) {
    status.push({
      text: `Produktivitas Curah Kering turun ${formatValue(Math.abs(productivityTrend.deltaPct), { decimals: 1 })}% (${formatValue(productivityTrend.first, { decimals: 1 })}→${formatValue(productivityTrend.latest, { decimals: 1 })} T/G/H)`,
      tone: "warn",
    });
  }
  if (anomaly) {
    status.push({
      text: `Anomali data T/G/H Curah Cair ${MONTH_NAMES[anomaly.monthIndex]} (${formatValue(anomaly.value)}) — perlu validasi`,
      tone: "warn",
    });
  }
  if (isPartial)
    status.push({
      text: `Data realisasi mencakup ${throughMonth + 1} dari 12 bulan (s.d. ${MONTH_NAMES[throughMonth]} ${year})`,
      tone: "warn",
    });

  // ---- Recommendations ----
  const recommendations: RecommendationCard[] = [];
  if (productivityTrend && productivityTrend.deltaPct < -10) {
    recommendations.push({
      type: "op",
      headline: "Tindak lanjuti penurunan produktivitas Curah Kering",
      body: `Produktivitas Curah Kering turun ${formatValue(Math.abs(productivityTrend.deltaPct), { decimals: 1 })}% (${formatValue(productivityTrend.first, { decimals: 1 })} → ${formatValue(productivityTrend.latest, { decimals: 1 })} T/G/H) selama ${periodLabel} ${year}. Audit jumlah alat/gang dan hambatan operasi pada terminal.`,
      when: "Jangka Pendek",
    });
  }
  if (worst && best && worst !== best) {
    recommendations.push({
      type: "st",
      headline: `Tingkatkan ET/BT ${worst.label} yang tertinggal dari ${best.label}`,
      body: `ET/BT ${worst.label} ${formatValue(worst.etbt ?? 0, { decimals: 1 })}% jauh di bawah ${best.label} ${formatValue(best.etbt ?? 0, { decimals: 1 })}%. Reduksi Not Operation Time berpotensi membebaskan efisiensi tambat tambahan.`,
      when: "Jangka Menengah",
    });
  }
  if (anomaly) {
    recommendations.push({
      type: "rk",
      headline: "Validasi data T/G/H Curah Cair sebelum dipakai",
      body: `Nilai ${formatValue(anomaly.value)} T/G/H pada ${MONTH_NAMES[anomaly.monthIndex]} ${year} menyimpang ${formatValue(Math.abs(anomaly.deviationPct), { decimals: 1 })}% dari rata-rata bulan lain. Jangan dijadikan basis proyeksi sebelum dikoreksi ke sumber data.`,
      when: "Validasi",
    });
  }

  return {
    eyebrow: `Realisasi Kinerja · ${periodLabel} ${year}`,
    title: "Kinerja Pelayanan ",
    titleAccent: "Operasi",
    titleSuffix: `s.d. ${MONTH_NAMES[throughMonth]} ${year}`,
    subtitle:
      "Waktu Tunggu, Efisiensi Tambat & Produktivitas — Konsolidasi Regional 2 Banten",
    badges: [
      flagship?.etbt !== null && flagship
        ? {
            value: `${formatValue(flagship.etbt, { decimals: 1 })}%`,
            label: "ET/BT Konsolidasi",
          }
        : null,
      wtAvg !== null
        ? {
            value: formatValue(wtAvg, { decimals: 2 }),
            label: "Waiting Time (jam)",
          }
        : null,
      cumulativeAverage(tghKeringNode, throughMonth) !== null
        ? {
            value: formatValue(
              cumulativeAverage(tghKeringNode, throughMonth)!,
              { decimals: 1 },
            ),
            label: "T/G/H Curah Kering",
          }
        : null,
      {
        value: periodLabel,
        label: `Periode ${year} (${throughMonth + 1} bln)`,
      },
    ].filter((b): b is HeaderBadge => b !== null),
    insight,
    kpis,
    monthLabels,
    etbtTrendDatasets,
    etbtTrendSubtitle,
    btCompositionLabels: [
      ["Multi-", "purpose"],
      ["Curah", "Cair"],
      ["Curah", "Kering"],
    ],
    btCompositionDatasets,
    btCompositionSubtitle,
    serviceLabels: [
      ["Luar", "Negeri"],
      ["Dalam", "Negeri"],
      ["Konsol.", year],
    ],
    serviceAT,
    serviceWT,
    serviceSubtitle,
    productivityTrend: months(tghKeringNode, throughMonth),
    productivitySubtitle,
    terminals,
    status,
    recommendations,
    statusBarTitle: "Key Takeaways",
    footerLeft: `KPI Kinerja Pelayanan ${year} — PT Pelabuhan Indonesia (Persero)`,
    footerRight: `Disiapkan: Juli 2026 · Satuan jam & T/G/H kecuali disebutkan · Data s.d. ${MONTH_NAMES[throughMonth]} ${year}${isPartial ? " (parsial)" : ""}`,
  };
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
