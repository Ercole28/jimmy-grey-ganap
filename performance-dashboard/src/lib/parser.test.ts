import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import { parseSheet } from "./parser";
import { findAllByCode, findFirstByLabel } from "./tree";
import type { SheetNode } from "./types";

const dir = path.dirname(fileURLToPath(import.meta.url));

function loadFixture(name: string): string[][] {
  const csv = readFileSync(path.join(dir, "__fixtures__", name), "utf-8");
  return Papa.parse<string[]>(csv, { skipEmptyLines: false }).data;
}

function findByLabel(nodes: SheetNode[], label: string): SheetNode | undefined {
  return findFirstByLabel(
    nodes,
    new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
  );
}

describe("parseSheet — ARUS excerpt", () => {
  const rows = loadFixture("arus-excerpt.csv");
  const parsed = parseSheet(rows);

  it("extracts sheet metadata", () => {
    expect(parsed.meta.tahun).toBe("2026");
    expect(parsed.meta.regional).toBe("Regional.2");
    expect(parsed.meta.cabang).toBe("Banten");
  });

  it("builds one root section for Kunjungan Kapal", () => {
    expect(parsed.roots).toHaveLength(1);
    expect(parsed.roots[0].label).toMatch(/Kunjungan Kapal/);
  });

  it("parses a leaf's month values, stripping thousands separators", () => {
    const generalCargo = findByLabel(parsed.roots, "General Cargo");
    expect(generalCargo).toBeDefined();
    expect(generalCargo!.unit).toBe("Call");
    expect(generalCargo!.months[0]).toBe(4); // Januari
    expect(generalCargo!.total).toBe(41);
  });

  it("attaches stacked second unit-row as a sibling with inherited label", () => {
    const pair = findAllByCode(parsed.roots, "A010101010000");
    expect(pair.map((n) => n.unit).sort()).toEqual(["Call", "GT"]);
    expect(pair.every((n) => n.label === "General Cargo")).toBe(true);
    const gtNode = pair.find((n) => n.unit === "GT")!;
    expect(gtNode.months[0]).toBe(139291);
  });

  it("renders unreported months as null, not zero", () => {
    const generalCargo = findByLabel(parsed.roots, "General Cargo");
    expect(generalCargo!.months[5]).toBeNull(); // Juni, not yet reported
  });

  it("keeps a real reported zero as 0", () => {
    const gas = findByLabel(parsed.roots, "Gas");
    expect(gas).toBeDefined();
    expect(gas!.total).toBe(0);
  });

  it("treats a label-less subtotal row as a leaf at its section's level", () => {
    const jumlahDermaga = findByLabel(
      parsed.roots,
      "Jumlah kunjungan kapal di DERMAGA UMUM",
    );
    expect(jumlahDermaga).toBeDefined();
    expect(jumlahDermaga!.unit).toBe("Call");
    expect(jumlahDermaga!.total).toBe(774);
    // sibling of DERMAGA UMUM, not nested inside it
    const dermagaUmum = findByLabel(parsed.roots, "DERMAGA UMUM");
    expect(dermagaUmum!.level).toBe(jumlahDermaga!.level);
  });
});

describe("parseSheet — UTILISASI excerpt (repeating header block mid-sheet)", () => {
  const rows = loadFixture("utilisasi-excerpt.csv");
  const parsed = parseSheet(rows);

  it("produces two top-level sections despite the header block repeating", () => {
    expect(parsed.roots).toHaveLength(2);
    expect(parsed.roots[0].label).toBe("Utilisasi Infrastruktur");
    expect(parsed.roots[1].label).toBe("Utilisasi Suprastruktur");
  });

  it("parses data correctly right after the repeated header block", () => {
    const kapalTunda = findByLabel(parsed.roots, "Kapal Tunda");
    expect(kapalTunda).toBeDefined();
    expect(kapalTunda!.unit).toBe("%");
    expect(kapalTunda!.months[0]).toBeCloseTo(98.16);
  });
});
