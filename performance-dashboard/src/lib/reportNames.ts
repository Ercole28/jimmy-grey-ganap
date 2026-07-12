import type { TabId } from "./types";

// Mirrors performance-dashboard/SOURCE.md's "File:" section — the filename
// each tab's reference HTML report was generated as.
const REPORT_NAMES: Record<TabId, string> = {
  ARUS: "LAP2026_Banten_ArusKapal",
  KINERJA: "KPI2026_Banten_KinerjaPelayanan",
  UTILISASI: "LAP2026_Banten_UtilisasiAset",
  PRODUKSI: "LAP2026_Banten_ProduksiThroughput",
};

export function reportFileName(tab: TabId): string {
  return REPORT_NAMES[tab];
}
