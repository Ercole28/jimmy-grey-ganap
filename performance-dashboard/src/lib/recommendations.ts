export type RecommendationType = "op" | "st" | "rk";

export interface RecommendationCard {
  type: RecommendationType;
  headline: string;
  body: string;
  when: string;
}

// docs/11-analyst-role.md §9.5 — time-horizon vocabulary per recommendation type.
export const TIME_HORIZON = {
  op: { immediate: "Segera", short: "Jangka Pendek" },
  st: { medium: "Jangka Menengah", long: "Jangka Panjang" },
  rk: { monitor: "Monitor", validate: "Validasi" },
} as const;

export const COLUMN_META: Record<
  RecommendationType,
  { label: string; accent: string }
> = {
  op: { label: "Operasional", accent: "var(--status-green)" },
  st: { label: "Strategis", accent: "var(--brand-blue)" },
  rk: { label: "Risiko", accent: "var(--status-amber)" },
};

/** Groups cards by type in Operasional/Strategis/Risiko column order, dropping empty columns. */
export function groupByColumn(
  cards: RecommendationCard[],
): { type: RecommendationType; cards: RecommendationCard[] }[] {
  return (["op", "st", "rk"] as const)
    .map((type) => ({ type, cards: cards.filter((c) => c.type === type) }))
    .filter((g) => g.cards.length > 0);
}
