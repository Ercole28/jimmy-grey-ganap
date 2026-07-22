import { useState } from "react";
import { MONTH_NAMES } from "../lib/months";
import { editUrl } from "../lib/sheetUrls";
import type { TabId } from "../lib/types";

interface ToolbarProps {
  activeTab: TabId;
  throughMonth: number;
  onThroughMonthChange: (index: number) => void;
  onRefresh: () => void;
  loading: boolean;
  lastSynced: Date | null;
  exporting: boolean;
  exportError: string | null;
  onExport: () => void;
}

function formatSyncedAt(date: Date | null): string {
  if (!date) return "belum disinkronkan";
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function Toolbar({
  activeTab,
  throughMonth,
  onThroughMonthChange,
  onRefresh,
  loading,
  lastSynced,
  exporting,
  exportError,
  onExport,
}: ToolbarProps) {
  const [copied, setCopied] = useState(false);
  const link = editUrl(activeTab);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="toolbar">
      <div className="toolbar__row">
        <div className="toolbar__group">
          <span className="toolbar__label">Realisasi s.d.</span>
          <div className="toolbar__select-wrap">
            <svg
              className="toolbar__select-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="5"
                width="18"
                height="16"
                rx="3"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
              <path
                d="M8 3v4M16 3v4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <select
              className="toolbar__select"
              value={throughMonth}
              onChange={(e) => onThroughMonthChange(Number(e.target.value))}
              aria-label="Realisasi kumulatif s.d. bulan"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
            <svg
              className="toolbar__select-chevron"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="toolbar__group">
          <span className="toolbar__synced">
            Last Synced: {formatSyncedAt(lastSynced)}
          </span>
          <button
            type="button"
            className="toolbar__refresh"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? "Memuat…" : "Refresh"}
          </button>
          <button
            type="button"
            className="toolbar__export"
            onClick={onExport}
            disabled={exporting}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {exporting ? "Membuat PNG…" : "Export High Quality PNG"}
          </button>
          {exportError && <span className="toolbar__export-error">{exportError}</span>}
        </div>
      </div>

      <div className="toolbar__editrow">
        <span className="toolbar__editlabel">
          Sumber Data: {activeTab} (Google Sheets)
        </span>
        <div className="toolbar__editactions">
          <button
            type="button"
            className="toolbar__iconbtn"
            onClick={handleCopy}
            title="Salin link"
          >
            {copied ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 12l5 5L20 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="9"
                  y="9"
                  width="12"
                  height="12"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            )}
            {copied ? "Tersalin" : "Salin Link"}
          </button>
          <a
            className="toolbar__iconbtn toolbar__iconbtn--primary"
            href={link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M14 5h5v5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19 5l-9 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Buka di Sheets
          </a>
        </div>
      </div>
    </div>
  );
}
