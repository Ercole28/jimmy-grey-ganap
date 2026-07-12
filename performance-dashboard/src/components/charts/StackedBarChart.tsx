import type { Context } from "chartjs-plugin-datalabels";
import { Bar } from "react-chartjs-2";
import { X_GRID, X_TICKS, Y_GRID, idLocale } from "./chartTheme";

export interface StackedBarDataset {
  label: string;
  data: (number | null)[];
  color: string;
}

interface StackedBarChartProps {
  labels: (string | string[])[];
  datasets: StackedBarDataset[];
  unit: string;
  decimals?: number;
  yAxisTitle: string;
  yMax?: number;
  showTotalLabel?: boolean;
  height?: number;
}

export function StackedBarChart({
  labels,
  datasets,
  unit,
  decimals = 1,
  yAxisTitle,
  yMax,
  showTotalLabel = true,
  height = 260,
}: StackedBarChartProps) {
  const lastIdx = datasets.length - 1;
  // Headroom above the tallest *stacked total* (sum per category, not just a
  // single dataset's max) so the total datalabel isn't clipped — only when
  // the caller hasn't already pinned an explicit yMax.
  const stackTotals = labels.map((_, i) => datasets.reduce((sum, ds) => sum + (ds.data[i] ?? 0), 0));
  const maxStack = Math.max(0, ...stackTotals);
  const suggestedMax = yMax === undefined && maxStack > 0 ? maxStack * 1.18 : undefined;

  return (
    <div className="cw" style={{ height }}>
      <Bar
        data={{
          labels,
          datasets: datasets.map((ds, i) => ({
            label: ds.label,
            data: ds.data,
            backgroundColor: ds.color,
            borderRadius: i === lastIdx ? 4 : 0,
            borderSkipped: false,
            barPercentage: 0.5,
            categoryPercentage: 0.7,
            stack: "s",
            datalabels:
              showTotalLabel && i === lastIdx
                ? {
                    display: true,
                    align: "top" as const,
                    anchor: "end" as const,
                    offset: 2,
                    color: "#061628",
                    font: { weight: 700 as const, size: 10 },
                    backgroundColor: "rgba(255,255,255,0.82)",
                    borderRadius: 3,
                    padding: { top: 1, bottom: 1, left: 4, right: 4 },
                    formatter: (_v: number | null, ctx: Context) => {
                      const idx = ctx.dataIndex;
                      const total = ctx.chart.data.datasets.reduce(
                        (a: number, d) => a + (Number((d.data[idx] as number | null) ?? 0) || 0),
                        0,
                      );
                      return idLocale(total, decimals);
                    },
                  }
                : { display: false },
          })),
        }}
        options={{
          maintainAspectRatio: false,
          responsive: true,
          scales: {
            x: { stacked: true, ticks: X_TICKS, grid: X_GRID },
            y: {
              stacked: true,
              beginAtZero: true,
              max: yMax,
              suggestedMax,
              ticks: { font: { size: 9 }, color: "#7B98B5" },
              grid: Y_GRID,
              title: { display: true, text: yAxisTitle, color: "#7B98B5", font: { size: 9, weight: 600 } },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${idLocale(c.parsed.y, decimals)} ${unit}` } },
          },
        }}
      />
    </div>
  );
}
