import type { SheetNode } from "./types";
import { flattenLeaves } from "./tree";

export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

/**
 * Latest month index (0-11) with any real reported activity across the tree.
 * Rollup ("Jumlah ...") rows compute a literal 0 for every month via
 * spreadsheet SUM(), even ones with no underlying data yet — so a plain
 * non-null check would always resolve to December. Requiring a non-zero
 * value filters those out and finds the last month with genuine data.
 */
export function latestReportedMonth(roots: SheetNode[]): number {
  const leaves = flattenLeaves(roots);
  let latest = 0;
  for (const leaf of leaves) {
    for (let i = 0; i < leaf.months.length; i++) {
      if (leaf.months[i] !== null && leaf.months[i] !== 0 && i > latest) latest = i;
    }
  }
  return latest;
}

export interface Delta {
  value: number | null;
  pct: number | null;
}

export function computeDelta(current: number | null, previous: number | null): Delta {
  if (current === null || previous === null) return { value: null, pct: null };
  const value = current - previous;
  const pct = previous === 0 ? null : (value / previous) * 100;
  return { value, pct };
}

export function formatValue(value: number | null, options?: { decimals?: number }): string {
  if (value === null) return "—";
  const decimals = options?.decimals ?? (Number.isInteger(value) ? 0 : 2);
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
