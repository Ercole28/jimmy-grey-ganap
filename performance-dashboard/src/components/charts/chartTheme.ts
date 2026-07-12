export const X_TICKS = {
  maxRotation: 0,
  minRotation: 0,
  font: { size: 9, family: "'Outfit', Arial, sans-serif" },
  color: "#7B98B5",
};

export const X_GRID = { display: false };
export const Y_GRID = { color: "#ECF2FA" };

export const BLUE_PROGRESSION = ["#B6D2F0", "#6CA4E0", "#1E62C4", "#061628"];
export const GREEN_PROGRESSION = ["#9EDCCA", "#48C098", "#10986A", "#0A6040"];
export const DONUT_COLORS = ["#1358A4", "#0B8A60", "#2478D8", "#5135AE", "#B6D2F0", "#C07808"];
export const CATEGORY_PROGRESSION = ["#061628", "#1358A4", "#1E62C4", "#3F86D6", "#6CA4E0", "#9CC2EC", "#C2D9F4", "#DCE7F2"];
export const PARTIAL_COLOR = "#A8BCD4";

export function idLocale(v: number | null | undefined, decimals = 0): string {
  if (v === null || v === undefined) return "";
  return v.toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function twoLineMonthLabels(monthShortNames: string[], year: string): [string, string][] {
  return monthShortNames.map((m) => [m, year]);
}

export const barDatalabel = (color = "#061628", decimals = 0) => ({
  display: true,
  align: "top" as const,
  anchor: "end" as const,
  offset: 2,
  color,
  font: { weight: 700 as const, size: 10 },
  backgroundColor: "rgba(255,255,255,0.82)",
  borderRadius: 3,
  padding: { top: 1, bottom: 1, left: 4, right: 4 },
  formatter: (v: number) => idLocale(v, decimals),
});
