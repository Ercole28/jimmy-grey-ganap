import type { ParsedSheet, SheetNode } from "./types";

// Fixed column layout shared by all 4 sheets (see PRD §3 + implementation plan).
const LABEL_COL_START = 2; // C
const LABEL_COL_END = 7; // H
const UNIT_COL = 8; // I
const MONTH_COL_START = 9; // J (Januari)
const MONTH_COL_COUNT = 12;
const TOTAL_COL = 21; // V

function cell(row: string[], idx: number): string {
  return (row[idx] ?? "").trim();
}

function isBlankRow(row: string[]): boolean {
  return row.every((c) => (c ?? "").trim() === "");
}

function parseNumber(raw: string): number | null {
  if (raw === "") return null;
  const cleaned = raw.replace(/,/g, "");
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

/** First non-empty cell in row at or after fromIdx. */
function firstNonEmptyFrom(row: string[], fromIdx: number): string {
  for (let i = fromIdx; i < row.length; i++) {
    const v = cell(row, i);
    if (v !== "") return v;
  }
  return "";
}

const NUMERIC_MARKER = /^\d+(\.\d+)?$/;

export function parseSheet(rows: string[][]): ParsedSheet {
  const meta = { tahun: "", regional: "", cabang: "" };
  const roots: SheetNode[] = [];
  const stack: SheetNode[] = [];
  let lastLeaf: { label: string; level: number } | null = null;

  for (const row of rows) {
    if (isBlankRow(row)) continue;

    const c2 = cell(row, 2);

    // --- decorative / metadata rows, skipped everywhere they occur ---
    if (/^Version\s*:/i.test(c2)) continue;
    if (/^TAHUN\s*\(YYYY\)/i.test(c2)) {
      meta.tahun = firstNonEmptyFrom(row, 3);
      continue;
    }
    if (/^REGIONAL\s*:/i.test(c2)) {
      meta.regional = firstNonEmptyFrom(row, 3);
      continue;
    }
    if (/^CABANG\s*\/\s*TERMINAL/i.test(c2)) {
      meta.cabang = firstNonEmptyFrom(row, 3);
      continue;
    }
    if (cell(row, 1) === "Bulan") continue; // month-number helper row
    if (c2 === "No" && cell(row, 3) === "Uraian") continue; // column header row
    if (cell(row, MONTH_COL_START) === "Januari") continue; // month-name row
    if (c2 === "1" && cell(row, 3) === "2" && cell(row, UNIT_COL) === "3") continue; // index-hint row

    // --- find the label column: leftmost non-empty cell in C..H ---
    let labelCol = -1;
    for (let c = LABEL_COL_START; c <= LABEL_COL_END; c++) {
      if (cell(row, c) !== "") {
        labelCol = c;
        break;
      }
    }

    const unitVal = cell(row, UNIT_COL);
    const codeVal = cell(row, 1) || undefined;

    let label: string;
    let level: number;

    if (labelCol === -1) {
      if (unitVal === "") continue; // fully decorative, nothing to attach
      if (!lastLeaf) continue; // defensive: stray unit cell with no prior leaf
      // stacked second unit-row (e.g. Call then GT) — inherits label/level
      label = lastLeaf.label;
      level = lastLeaf.level;
    } else {
      const raw = cell(row, labelCol);
      if (NUMERIC_MARKER.test(raw)) {
        label = cell(row, labelCol + 1);
        level = labelCol + 1;
      } else {
        label = raw;
        level = labelCol;
      }
    }

    const isLeaf = unitVal !== "";
    const node: SheetNode = {
      code: codeVal,
      label,
      level,
      unit: isLeaf ? unitVal : undefined,
      months: isLeaf
        ? Array.from({ length: MONTH_COL_COUNT }, (_, i) =>
            parseNumber(cell(row, MONTH_COL_START + i)),
          )
        : new Array(MONTH_COL_COUNT).fill(null),
      total: isLeaf ? parseNumber(cell(row, TOTAL_COL)) : null,
      children: [],
    };

    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    if (isLeaf) {
      lastLeaf = { label, level };
    } else {
      stack.push(node);
      lastLeaf = null;
    }
  }

  return { meta, roots };
}
