import { COLUMN_META, groupByColumn } from "../lib/recommendations";
import type { RecommendationCard } from "../lib/recommendations";

interface RecommendationsProps {
  cards: RecommendationCard[];
}

export function Recommendations({ cards }: RecommendationsProps) {
  const columns = groupByColumn(cards);
  if (columns.length === 0) return null;

  return (
    <div className="rec">
      <div className="rec-hdr">
        <span className="rec-title">Rekomendasi &amp; Tindak Lanjut</span>
        <span className="rec-sub">Berdasarkan analisis data laporan ini</span>
      </div>
      <div className={`rec-cols rec-cols--${columns.length}`}>
        {columns.map(({ type, cards: colCards }) => (
          <div className={`rec-col rc-${type}`} key={type}>
            <div className="rec-col-hdr">{COLUMN_META[type].label}</div>
            {colCards.map((card, i) => (
              <div className="rec-card" key={i}>
                <div className="rec-h">{card.headline}</div>
                <div className="rec-p">{card.body}</div>
                <span className="rec-when">{card.when}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
