import { MONTH_NAMES } from "../lib/months";

interface ToolbarProps {
  throughMonth: number;
  onThroughMonthChange: (index: number) => void;
  onRefresh: () => void;
  loading: boolean;
  lastSynced: Date | null;
}

function formatSyncedAt(date: Date | null): string {
  if (!date) return "belum disinkronkan";
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function Toolbar({ throughMonth, onThroughMonthChange, onRefresh, loading, lastSynced }: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar__group">
        <span className="toolbar__label">Realisasi s.d.</span>
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
      </div>

      <div className="toolbar__group">
        <span className="toolbar__synced">Last synced: {formatSyncedAt(lastSynced)}</span>
        <button type="button" className="toolbar__refresh" onClick={onRefresh} disabled={loading}>
          {loading ? "Memuat…" : "Refresh"}
        </button>
      </div>
    </div>
  );
}
