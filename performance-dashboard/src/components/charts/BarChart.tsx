import { Bar } from "react-chartjs-2";
import { X_GRID, X_TICKS, Y_GRID, idLocale } from "./chartTheme";

interface BarChartProps {
  labels: (string | string[])[];
  data: (number | null)[];
  colors: string[];
  unit: string;
  decimals?: number;
  yAxisTitle?: string;
  height?: number;
}

export function BarChart({
  labels,
  data,
  colors,
  unit,
  decimals = 0,
  yAxisTitle,
  height = 260,
}: BarChartProps) {
  // Headroom above the tallest bar so its floating datalabel isn't clipped
  // by the chart area — Chart.js's auto scale otherwise tops out exactly at
  // the max data value with no room for the label box above it.
  const maxValue = Math.max(0, ...data.filter((v): v is number => v !== null));
  const suggestedMax = maxValue > 0 ? maxValue * 1.18 : undefined;

  return (
    <div className="cw" style={{ height }}>
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: unit,
              data,
              backgroundColor: colors,
              borderRadius: 5,
              borderSkipped: false,
              barPercentage: 0.62,
              categoryPercentage: 0.88,
              datalabels: {
                display: true,
                align: "top",
                anchor: "end",
                offset: 2,
                color: "#061628",
                font: { weight: 700, size: 10 },
                backgroundColor: "rgba(255,255,255,0.82)",
                borderRadius: 3,
                padding: { top: 1, bottom: 1, left: 4, right: 4 },
                formatter: (v: number | null) =>
                  v === null ? "" : idLocale(v, decimals),
              },
            },
          ],
        }}
        options={{
          maintainAspectRatio: false,
          responsive: true,
          scales: {
            x: { ticks: X_TICKS, grid: X_GRID },
            y: {
              beginAtZero: true,
              suggestedMax,
              ticks: {
                font: { size: 9 },
                color: "#7B98B5",
                callback: (v) => idLocale(Number(v), decimals),
              },
              grid: Y_GRID,
              title: yAxisTitle
                ? {
                    display: true,
                    text: yAxisTitle,
                    color: "#7B98B5",
                    font: { size: 9, weight: 600 },
                  }
                : undefined,
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => ` ${idLocale(c.parsed.y, decimals)} ${unit}`,
              },
            },
          },
        }}
      />
    </div>
  );
}
