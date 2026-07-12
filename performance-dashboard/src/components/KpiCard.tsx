import type { KpiColor } from "../lib/types";

const COLOR_VARS: Record<KpiColor, string> = {
  green: "var(--status-green)",
  amber: "var(--status-amber)",
  purple: "var(--status-purple)",
  red: "var(--status-red)",
  blue: "var(--brand-blue)",
};

const VARIANT_CLASS: Record<KpiColor, string> = {
  green: "gr",
  amber: "am",
  purple: "pu",
  red: "rd",
  blue: "",
};

interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
  deltaText?: string;
  deltaTone?: "up" | "down" | "neutral";
  color?: KpiColor;
  trackPercent?: number;
}

export function KpiCard({
  label,
  value,
  unit,
  deltaText,
  deltaTone = "neutral",
  color = "blue",
  trackPercent,
}: KpiCardProps) {
  const trendClass =
    deltaTone === "up" ? "cu" : deltaTone === "down" ? "cd" : "cn";

  return (
    <div
      className={`kpi ${VARIANT_CLASS[color]}`}
      style={{ ["--kpi-color" as string]: COLOR_VARS[color] }}
    >
      <p className="k-lbl">{label}</p>
      <p className="k-val">
        {value}
        <span className="k-unit">{unit}</span>
      </p>
      {deltaText && <p className={`k-delta ${trendClass}`}>{deltaText}</p>}
      {trackPercent !== undefined && (
        <div className="k-track">
          <div
            className="k-fill"
            style={{ width: `${Math.min(100, Math.max(0, trackPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
}
