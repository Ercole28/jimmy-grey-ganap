import type { TabId } from "./types";

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

// gid per tab, from performance-dashboard/SOURCE.md
const GIDS: Record<TabId, string> = {
  ARUS: "1702648279",
  KINERJA: "391255269",
  UTILISASI: "418575099",
  PRODUKSI: "1367502137",
};

export const TAB_IDS: TabId[] = ["ARUS", "KINERJA", "UTILISASI", "PRODUKSI"];

export function csvUrl(tab: TabId): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GIDS[tab]}`;
}

export function editUrl(tab: TabId): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=${GIDS[tab]}#gid=${GIDS[tab]}`;
}
