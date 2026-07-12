import type { Plugin } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { DONUT_COLORS, idLocale } from "./chartTheme";

interface DonutChartProps {
  labels: string[];
  data: number[];
  colors?: string[];
  centerTop?: string;
  centerBottom?: string;
  unit: string;
  height?: number;
}

export function DonutChart({
  labels,
  data,
  colors = DONUT_COLORS,
  centerTop,
  centerBottom,
  unit,
  height = 240,
}: DonutChartProps) {
  const centerLabelPlugin: Plugin<"doughnut"> = {
    id: "centerLabel",
    afterDraw(chart) {
      if (!centerTop && !centerBottom) return;
      const {
        ctx,
        chartArea: { left, top, right, bottom },
      } = chart;
      const cx = (left + right) / 2;
      const cy = (top + bottom) / 2;
      ctx.save();
      ctx.textAlign = "center";
      if (centerTop) {
        ctx.fillStyle = "#9AB4CC";
        ctx.font = "400 10px Outfit,Arial,sans-serif";
        ctx.fillText(centerTop, cx, cy - 9);
      }
      if (centerBottom) {
        ctx.fillStyle = "#061628";
        ctx.font = "700 17px Outfit,Arial,sans-serif";
        ctx.fillText(centerBottom, cx, cy + 11);
      }
      ctx.restore();
    },
  };

  return (
    <div className="cw" style={{ height }}>
      <Doughnut
        // react-chartjs-2 mutates the existing Chart.js instance on prop
        // updates rather than recreating it, so an inline plugin's closure
        // (centerTop/centerBottom here) goes stale after the first render.
        // Keying on the values that must be fresh forces a clean remount.
        key={`${centerTop ?? ""}-${centerBottom ?? ""}`}
        data={{
          labels,
          datasets: [
            {
              data,
              backgroundColor: colors,
              borderWidth: 3,
              borderColor: "#fff",
              hoverOffset: 8,
              datalabels: {
                display: true,
                color: "#fff",
                font: { weight: 700, size: 12 },
                textAlign: "center",
                formatter: (v: number, ctx) => {
                  const total = (ctx.dataset.data as number[]).reduce(
                    (a, b) => a + b,
                    0,
                  );
                  return total > 0 ? `${Math.round((v / total) * 100)}%` : "";
                },
              },
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "64%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => {
                  const total = (c.dataset.data as number[]).reduce(
                    (a, b) => a + b,
                    0,
                  );
                  const pct =
                    total > 0 ? Math.round((c.parsed / total) * 100) : 0;
                  return ` ${c.label}: ${idLocale(c.parsed)} ${unit} (${pct}%)`;
                },
              },
            },
          },
        }}
        plugins={[centerLabelPlugin]}
      />
    </div>
  );
}
