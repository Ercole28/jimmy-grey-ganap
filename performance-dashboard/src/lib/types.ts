export interface SheetMeta {
  tahun: string;
  regional: string;
  cabang: string;
}

export interface SheetNode {
  code?: string;
  label: string;
  level: number;
  unit?: string;
  /** Jan..Dec, index 0..11. null = not yet reported, never coerced to 0. */
  months: Array<number | null>;
  total: number | null;
  children: SheetNode[];
}

export interface ParsedSheet {
  meta: SheetMeta;
  roots: SheetNode[];
}

export type TabId = "ARUS" | "KINERJA" | "UTILISASI" | "PRODUKSI";

export type KpiColor = "green" | "amber" | "purple" | "red" | "blue";

export interface InsightSegment {
  text: string;
  emphasis?: "b" | "i";
}

export interface StatusBarItem {
  text: string;
  tone: "ok" | "warn";
}

export interface HeaderBadge {
  value: string;
  label: string;
}

/** Shared shape every per-tab analysis module returns, consumed uniformly by App.tsx/Header. */
export interface ReportHeaderData {
  eyebrow: string;
  title: string;
  titleAccent: string;
  /** Plain text after the accented word — most report titles are prefix + <em>accent</em> + suffix. */
  titleSuffix?: string;
  subtitle: string;
  badges: HeaderBadge[];
  statusBarTitle: string;
  footerLeft: string;
  footerRight: string;
}
