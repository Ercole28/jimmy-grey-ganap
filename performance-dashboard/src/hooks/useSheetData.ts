import { useCallback, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { parseSheet } from "../lib/parser";
import { csvUrl, TAB_IDS } from "../lib/sheetUrls";
import type { ParsedSheet, TabId } from "../lib/types";

export type SheetsById = Record<TabId, ParsedSheet | null>;

const EMPTY_SHEETS: SheetsById = { ARUS: null, KINERJA: null, UTILISASI: null, PRODUKSI: null };

async function fetchAndParse(tab: TabId): Promise<ParsedSheet> {
  const res = await fetch(csvUrl(tab));
  if (!res.ok) throw new Error(`Failed to fetch ${tab}: HTTP ${res.status}`);
  const text = await res.text();
  const rows = Papa.parse<string[]>(text, { skipEmptyLines: false }).data;
  return parseSheet(rows);
}

export interface UseSheetData {
  sheets: SheetsById;
  loading: boolean;
  error: string | null;
  lastSynced: Date | null;
  refresh: () => void;
}

export function useSheetData(): UseSheetData {
  const [sheets, setSheets] = useState<SheetsById>(EMPTY_SHEETS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(() => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);

    Promise.all(TAB_IDS.map((tab) => fetchAndParse(tab)))
      .then((results) => {
        const next = { ...EMPTY_SHEETS };
        TAB_IDS.forEach((tab, i) => {
          next[tab] = results[i];
        });
        setSheets(next);
        setLastSynced(new Date());
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load sheet data");
      })
      .finally(() => {
        inFlight.current = false;
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sheets, loading, error, lastSynced, refresh };
}
