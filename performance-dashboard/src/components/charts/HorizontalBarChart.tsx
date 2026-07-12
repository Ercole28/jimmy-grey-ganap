import { Bar } from "react-chartjs-2";
import { CATEGORY_PROGRESSION, Y_GRID, idLocale } from "./chartTheme";

interface HorizontalBarChartProps {
  labels: string[];
  data: number[];
  unit: string;
  colors?: string[];
  height?: number;
  /** When the values are themselves already a ratio/percent (readiness, utilization), a "(X% of total)" share is meaningless — show a plain suffixed value instead. */
  isRatio?: boolean;
  decimals?: number;
}

export function HorizontalBarChart({ labels, data, unit, colors = CATEGORY_PROGRESSION, height = 260, isRatio = false, decimals = 0 }: HorizontalBarChartProps) {
  const total = data.reduce((a, b) => a + b, 0);
  const max = Math.max(...data, 1);

  return (
    <div className="cw" style={{ height }}>
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: unit,
              data,
              backgroundColor: labels.map((_, i) => colors[i % colors.length]),
              borderRadius: 4,
              borderSkipped: false,
              barPercentage: 0.78,
              categoryPercentage: 0.92,
              datalabels: {
                display: true,
                align: "end",
                anchor: "end",
                offset: 5,
                color: "#061628",
                font: { weight: 700, size: 10 },
                textAlign: "left",
                formatter: (v: number) => (isRatio ? `${idLocale(v, decimals)}${unit}` : `${idLocale(v)}  (${total > 0 ? Math.round((v / total) * 100) : 0}%)`),
              },
            },
          ],
        }}
        options={{
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { right: 64 } },
          scales: {
            x: {
              max: max * 1.18,
              beginAtZero: true,
              ticks: { font: { size: 9 }, color: "#7B98B5", callback: (v) => (isRatio ? `${idLocale(Number(v), 0)}${unit}` : idLocale(Number(v))) },
              grid: Y_GRID,
            },
            y: { ticks: { font: { size: 9.5, weight: 500 }, color: "#284058" }, grid: { display: false } },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => {
                  const x = c.parsed.x ?? 0;
                  return isRatio
                    ? ` ${c.label}: ${idLocale(x, decimals)}${unit}`
                    : ` ${c.label}: ${idLocale(x)} ${unit} (${total > 0 ? Math.round((x / total) * 100) : 0}%)`;
                },
              },
            },
          },
        }}
      />
    </div>
  );
}
