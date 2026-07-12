import { Bar } from "react-chartjs-2";
import { X_GRID, X_TICKS, Y_GRID, idLocale } from "./chartTheme";

// SKILL.md §7.3 spacing formula
const BAR_PERCENTAGE_BY_COUNT: Record<number, number> = { 1: 0.62, 2: 0.36, 3: 0.72, 4: 0.68 };

export interface GroupedBarDataset {
  label: string;
  data: (number | null)[];
  color: string;
}

interface GroupedBarChartProps {
  labels: (string | string[])[];
  datasets: GroupedBarDataset[];
  unit: string;
  decimals?: number;
  yAxisTitle: string;
  yMax?: number;
  height?: number;
}

export function GroupedBarChart({ labels, datasets, unit, decimals = 1, yAxisTitle, yMax, height = 260 }: GroupedBarChartProps) {
  const barPercentage = BAR_PERCENTAGE_BY_COUNT[datasets.length] ?? 0.68;
  // Headroom above the tallest bar so its floating datalabel isn't clipped —
  // only applied when the caller hasn't already pinned an explicit yMax.
  const maxValue = Math.max(0, ...datasets.flatMap((ds) => ds.data.filter((v): v is number => v !== null)));
  const suggestedMax = yMax === undefined && maxValue > 0 ? maxValue * 1.18 : undefined;

  return (
    <div className="cw" style={{ height }}>
      <Bar
        data={{
          labels,
          datasets: datasets.map((ds) => ({
            label: ds.label,
            data: ds.data,
            backgroundColor: ds.color,
            borderRadius: 4,
            borderSkipped: false,
            barPercentage,
            categoryPercentage: 0.88,
            datalabels: {
              display: true,
              align: "top" as const,
              anchor: "end" as const,
              offset: 2,
              color: "#061628",
              font: { weight: 700 as const, size: 9 },
              backgroundColor: "rgba(255,255,255,0.82)",
              borderRadius: 3,
              padding: { top: 1, bottom: 1, left: 3, right: 3 },
              formatter: (v: number | null) => (v === null ? "" : idLocale(v, decimals)),
            },
          })),
        }}
        options={{
          maintainAspectRatio: false,
          responsive: true,
          scales: {
            x: { ticks: X_TICKS, grid: X_GRID },
            y: {
              beginAtZero: true,
              max: yMax,
              suggestedMax,
              ticks: { font: { size: 9 }, color: "#7B98B5", callback: (v) => idLocale(Number(v), decimals) },
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
