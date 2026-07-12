import { findAllByLabel, flattenLeaves } from "./tree";
import type { SheetNode } from "./types";

/** Sum of months[0..throughMonth], skipping nulls (SUM() semantics). Null iff nothing reported at all in range. */
export function cumulativeSum(
  node: SheetNode | undefined,
  throughMonth: number,
): number | null {
  if (!node) return null;
  let sum = 0;
  let any = false;
  for (let i = 0; i <= throughMonth && i < node.months.length; i++) {
    const v = node.months[i];
    if (v !== null) {
      sum += v;
      any = true;
    }
  }
  return any ? sum : null;
}

/** Mean of non-null months[0..throughMonth] — for %, jam, T/G/H, bph style metrics where summing is meaningless. */
export function cumulativeAverage(
  node: SheetNode | undefined,
  throughMonth: number,
): number | null {
  if (!node) return null;
  let sum = 0;
  let count = 0;
  for (let i = 0; i <= throughMonth && i < node.months.length; i++) {
    const v = node.months[i];
    if (v !== null) {
      sum += v;
      count++;
    }
  }
  return count > 0 ? sum / count : null;
}

/**
 * Sums a specific unit across every leaf in `roots` (or a scoped subtree
 * passed as `roots`) whose label matches `match` — the generic tool for
 * "total Dalam Negeri across all 4 locations" style aggregation. Caller is
 * responsible for scoping `roots` and anchoring `match` tightly enough to
 * avoid accidentally summing unrelated same-labelled leaves elsewhere.
 */
export function sumByLabelAcrossTree(
  roots: SheetNode[],
  match: RegExp,
  unit: string,
  throughMonth: number,
): number | null {
  const leaves = flattenLeaves(roots).filter(
    (n) => n.unit === unit && match.test(n.label),
  );
  let sum = 0;
  let any = false;
  for (const leaf of leaves) {
    const v = cumulativeSum(leaf, throughMonth);
    if (v !== null) {
      sum += v;
      any = true;
    }
  }
  return any ? sum : null;
}

/**
 * Sums a unit across every leaf *nested under* any node whose own label
 * matches `headerMatch` — for aggregating by a category that only exists
 * as a header/grouping row (e.g. "Pelayaran Dalam Negeri" is a header
 * whose own row has no unit; the Call totals live on the leaves below it).
 * Matched nodes that are themselves leaves are included directly.
 */
export function sumUnderMatchingHeaders(
  roots: SheetNode[],
  headerMatch: RegExp,
  unit: string,
  throughMonth: number,
): number | null {
  const headers = findAllByLabel(roots, headerMatch);
  const leaves = flattenLeaves(headers).filter((n) => n.unit === unit);
  let sum = 0;
  let any = false;
  for (const leaf of leaves) {
    const v = cumulativeSum(leaf, throughMonth);
    if (v !== null) {
      sum += v;
      any = true;
    }
  }
  return any ? sum : null;
}

/**
 * Averages every leaf's own cumulativeAverage under nodes whose label
 * matches `headerMatch` — the ratio-metric counterpart to
 * sumUnderMatchingHeaders (e.g. "average readiness % across every piece of
 * equipment listed under Kesiapan alat bongkar muat").
 */
export function averageUnderMatchingHeaders(
  roots: SheetNode[],
  headerMatch: RegExp,
  unit: string,
  throughMonth: number,
): number | null {
  const headers = findAllByLabel(roots, headerMatch);
  const leaves = flattenLeaves(headers).filter((n) => n.unit === unit);
  const averages = leaves
    .map((l) => cumulativeAverage(l, throughMonth))
    .filter((v): v is number => v !== null);
  if (averages.length === 0) return null;
  return averages.reduce((a, b) => a + b, 0) / averages.length;
}

/** Ranked {label, value} for every leaf under matching headers with real data — for equipment-style horizontal bars. */
export function rankUnderMatchingHeaders(
  roots: SheetNode[],
  headerMatch: RegExp,
  unit: string,
  throughMonth: number,
): { label: string; value: number }[] {
  const headers = findAllByLabel(roots, headerMatch);
  const leaves = flattenLeaves(headers).filter((n) => n.unit === unit);
  return leaves
    .map((l) => ({ label: l.label, value: cumulativeAverage(l, throughMonth) }))
    .filter((r): r is { label: string; value: number } => r.value !== null)
    .sort((a, b) => b.value - a.value);
}

/** Peak month (0-11) within [0..throughMonth] with the highest positive value. */
export function findPeakMonth(
  node: SheetNode | undefined,
  throughMonth: number,
): { monthIndex: number; value: number } | null {
  if (!node) return null;
  let best: { monthIndex: number; value: number } | null = null;
  for (let i = 0; i <= throughMonth && i < node.months.length; i++) {
    const v = node.months[i];
    if (v !== null && v > 0 && (best === null || v > best.value))
      best = { monthIndex: i, value: v };
  }
  return best;
}

/** First and latest non-null reported values within [0..throughMonth], plus % change between them. */
export function firstVsLatest(
  node: SheetNode | undefined,
  throughMonth: number,
): {
  first: number;
  firstMonth: number;
  latest: number;
  latestMonth: number;
  deltaPct: number;
} | null {
  if (!node) return null;
  let first: { value: number; monthIndex: number } | null = null;
  let latest: { value: number; monthIndex: number } | null = null;
  for (let i = 0; i <= throughMonth && i < node.months.length; i++) {
    const v = node.months[i];
    if (v === null) continue;
    if (!first) first = { value: v, monthIndex: i };
    latest = { value: v, monthIndex: i };
  }
  if (
    !first ||
    !latest ||
    first.monthIndex === latest.monthIndex ||
    first.value === 0
  )
    return null;
  return {
    first: first.value,
    firstMonth: first.monthIndex,
    latest: latest.value,
    latestMonth: latest.monthIndex,
    deltaPct: ((latest.value - first.value) / Math.abs(first.value)) * 100,
  };
}

/**
 * Flags a reported month as anomalous if it deviates more than `threshold`
 * (default 40%) from the mean of the *other* reported months in range.
 * Simple, generic, defensible — not a statistical model.
 */
export function findAnomaly(
  node: SheetNode | undefined,
  throughMonth: number,
  threshold = 0.4,
): {
  monthIndex: number;
  value: number;
  meanOthers: number;
  deviationPct: number;
} | null {
  if (!node) return null;
  const reported: { monthIndex: number; value: number }[] = [];
  for (let i = 0; i <= throughMonth && i < node.months.length; i++) {
    const v = node.months[i];
    if (v !== null) reported.push({ monthIndex: i, value: v });
  }
  if (reported.length < 3) return null;

  let worst: {
    monthIndex: number;
    value: number;
    meanOthers: number;
    deviationPct: number;
  } | null = null;
  for (const candidate of reported) {
    const others = reported.filter(
      (r) => r.monthIndex !== candidate.monthIndex,
    );
    const meanOthers = others.reduce((a, b) => a + b.value, 0) / others.length;
    if (meanOthers === 0) continue;
    const deviationPct =
      ((candidate.value - meanOthers) / Math.abs(meanOthers)) * 100;
    if (
      Math.abs(deviationPct) >= threshold * 100 &&
      (!worst || Math.abs(deviationPct) > Math.abs(worst.deviationPct))
    ) {
      worst = {
        monthIndex: candidate.monthIndex,
        value: candidate.value,
        meanOthers,
        deviationPct,
      };
    }
  }
  return worst;
}

/** Share of `value` within `total`, or null if total isn't positive. */
export function shareOf(
  value: number | null,
  total: number | null,
): number | null {
  if (value === null || total === null || total <= 0) return null;
  return (value / total) * 100;
}
