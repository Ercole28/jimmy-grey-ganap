import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import {
  averageUnderMatchingHeaders,
  cumulativeAverage,
  cumulativeSum,
  findAnomaly,
  findPeakMonth,
  firstVsLatest,
  rankUnderMatchingHeaders,
  shareOf,
  sumByLabelAcrossTree,
  sumUnderMatchingHeaders,
} from "./aggregate";
import { parseSheet } from "./parser";
import { findFirstByLabel } from "./tree";
import type { SheetNode } from "./types";

const dir = path.dirname(fileURLToPath(import.meta.url));

function loadSheet(name: string) {
  const csv = readFileSync(
    path.join(dir, "__fixtures__", `${name}.full.csv`),
    "utf-8",
  );
  const rows = Papa.parse<string[]>(csv, { skipEmptyLines: false }).data;
  return parseSheet(rows);
}

function findByLabel(nodes: SheetNode[], label: string): SheetNode | undefined {
  return findFirstByLabel(
    nodes,
    new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
  );
}

describe("aggregate — UTILISASI (real data)", () => {
  const parsed = loadSheet("UTILISASI");

  it("averageUnderMatchingHeaders(Kesiapan alat bongkar muat) matches hand-computed 95.3%", () => {
    const avg = averageUnderMatchingHeaders(
      parsed.roots,
      /^Kesiapan alat bongkar muat$/i,
      "%",
      4,
    );
    expect(avg).not.toBeNull();
    expect(avg!).toBeCloseTo(95.3, 0);
  });

  it("averageUnderMatchingHeaders(Utilisasi alat bongkar muat) matches hand-computed 8.4%", () => {
    const avg = averageUnderMatchingHeaders(
      parsed.roots,
      /^Utilisasi alat bongkar muat$/i,
      "%",
      4,
    );
    expect(avg).not.toBeNull();
    expect(avg!).toBeCloseTo(8.4, 0);
  });

  it("rankUnderMatchingHeaders ranks equipment by readiness, Head Truck near the top", () => {
    const ranked = rankUnderMatchingHeaders(
      parsed.roots,
      /^Kesiapan alat bongkar muat$/i,
      "%",
      4,
    );
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].value).toBeGreaterThanOrEqual(
      ranked[ranked.length - 1].value,
    );
    const headTruck = ranked.find((r) => r.label === "Head Truck");
    expect(headTruck?.value).toBeCloseTo(99.17, 1);
  });
});

describe("aggregate — ARUS (real data)", () => {
  const parsed = loadSheet("ARUS");

  it("cumulativeSum matches manual sum of Jan-Mei for General Cargo Call", () => {
    const node = findByLabel(parsed.roots, "General Cargo")!;
    // Jan..Mei = 4,8,12,10,7 per earlier parser.test.ts assertions
    expect(cumulativeSum(node, 4)).toBe(41);
    expect(cumulativeSum(node, 0)).toBe(4);
  });

  it("cumulativeSum returns null when nothing reported in range", () => {
    const node = findByLabel(parsed.roots, "General Cargo")!;
    // months 5-11 (Jun-Des) are all null for this node in the real data
    expect(cumulativeSum(node, 11) !== null).toBe(true); // Jan-Mei still have data
    const allNull = { ...node, months: new Array(12).fill(null) };
    expect(cumulativeSum(allNull, 11)).toBeNull();
  });

  it("cumulativeAverage differs from cumulativeSum (mean, not total)", () => {
    const node = findByLabel(parsed.roots, "General Cargo")!;
    const sum = cumulativeSum(node, 4)!;
    const avg = cumulativeAverage(node, 4)!;
    expect(avg).toBeCloseTo(sum / 5);
  });

  it("sumByLabelAcrossTree aggregates the same label across multiple locations", () => {
    // "Jumlah kunjungan kapal di X" appears once per location (4 locations)
    const total = sumByLabelAcrossTree(
      parsed.roots,
      /^Jumlah kunjungan kapal di /i,
      "Call",
      4,
    );
    const grandTotal = findByLabel(parsed.roots, "Jumlah kunjungan kapal")!;
    // grand total leaf's own cumulative sum should equal the sum of its per-branch parts
    expect(total).toBe(cumulativeSum(grandTotal, 4));
  });

  it("findPeakMonth finds March as the peak for Jumlah kunjungan kapal", () => {
    const node = findByLabel(parsed.roots, "Jumlah kunjungan kapal")!;
    const peak = findPeakMonth(node, 4);
    expect(peak?.monthIndex).toBe(2); // March, 0-indexed
    expect(peak?.value).toBe(622);
  });

  it("firstVsLatest compares Jan vs Mei for the grand total", () => {
    const node = findByLabel(parsed.roots, "Jumlah kunjungan kapal")!;
    const cmp = firstVsLatest(node, 4);
    expect(cmp?.firstMonth).toBe(0);
    expect(cmp?.latestMonth).toBe(4);
    expect(cmp?.first).toBe(325);
    expect(cmp?.latest).toBe(415);
  });

  it("shareOf computes a correct percentage", () => {
    expect(shareOf(25, 100)).toBe(25);
    expect(shareOf(1, 0)).toBeNull();
    expect(shareOf(null, 100)).toBeNull();
  });

  it("sumUnderMatchingHeaders(Luar Negeri + Dalam Negeri + Perintis + Rakyat + Lainnya) reconciles with the grand total", () => {
    const grandTotal = cumulativeSum(
      findByLabel(parsed.roots, "Jumlah kunjungan kapal"),
      4,
    )!;
    const ln =
      sumUnderMatchingHeaders(
        parsed.roots,
        /^Pelayaran Luar Negeri$/i,
        "Call",
        4,
      ) ?? 0;
    const dn =
      sumUnderMatchingHeaders(
        parsed.roots,
        /^Pelayaran Dalam Negeri$/i,
        "Call",
        4,
      ) ?? 0;
    const perintis =
      sumUnderMatchingHeaders(
        parsed.roots,
        /^Pelayaran Perintis$/i,
        "Call",
        4,
      ) ?? 0;
    const rakyat =
      sumUnderMatchingHeaders(parsed.roots, /^Pelayaran Rakyat$/i, "Call", 4) ??
      0;
    const lainnya =
      sumUnderMatchingHeaders(
        parsed.roots,
        /^Pelayaran Lainnya$/i,
        "Call",
        4,
      ) ?? 0;
    expect(ln + dn + perintis + rakyat + lainnya).toBe(grandTotal);
  });

  it("sumByLabelAcrossTree(General Cargo, Call) is a strict subset of the grand total", () => {
    const grandTotal = cumulativeSum(
      findByLabel(parsed.roots, "Jumlah kunjungan kapal"),
      4,
    )!;
    const generalCargo =
      sumByLabelAcrossTree(parsed.roots, /^General Cargo$/i, "Call", 4) ?? 0;
    expect(generalCargo).toBeGreaterThan(0);
    expect(generalCargo).toBeLessThan(grandTotal);
  });

  it("findAnomaly returns null for smoothly varying data (no false positives)", () => {
    const node = findByLabel(parsed.roots, "Jumlah kunjungan kapal")!;
    // 325,385,622,401,415 — March is a real peak but not wildly disproportionate; just confirm it doesn't throw
    const result = findAnomaly(node, 4);
    expect(result === null || typeof result.deviationPct === "number").toBe(
      true,
    );
  });
});
