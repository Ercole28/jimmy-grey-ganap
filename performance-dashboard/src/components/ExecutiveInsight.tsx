import { Fragment } from "react";
import type { InsightSegment } from "../lib/types";

interface ExecutiveInsightProps {
  segments: InsightSegment[];
}

export function ExecutiveInsight({ segments }: ExecutiveInsightProps) {
  return (
    <div className="insight">
      <span className="insight-t">Ringkasan Eksekutif</span>
      <p className="insight-b">
        {segments.map((seg, i) => {
          if (seg.emphasis === "b") return <b key={i}>{seg.text}</b>;
          if (seg.emphasis === "i") return <i key={i}>{seg.text}</i>;
          return <Fragment key={i}>{seg.text}</Fragment>;
        })}
      </p>
    </div>
  );
}
