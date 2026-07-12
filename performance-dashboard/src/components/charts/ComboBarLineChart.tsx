import { Chart } from "react-chartjs-2";
import { X_GRID, X_TICKS, Y_GRID, idLocale } from "./chartTheme";

interface ComboBarLineChartProps {
  labels: (string | string[])[];
  barLabel: string;
  barData: (number | null)[];
  barColor?: string | string[];
  barUnit: string;
  barDecimals?: number;
  lineLabel: string;
  lineData: (number | null)[];
  lineColor?: string;
  lineUnit: string;
  lineDecimals?: number;
  barAxisTitle: string;
  lineAxisTitle: string;
  barMax?: number;
  lineMax?: number;
  height?: number;
}

export function ComboBarLineChart({
  labels,
  barLabel,
  barData,
  barColor = "#1E62C4",
  barUnit,
  barDecimals = 0,
  lineLabel,
  lineData,
  lineColor = "#0B8A60",
  lineUnit,
  lineDecimals = 2,
  barAxisTitle,
  lineAxisTitle,
  barMax,
  lineMax,
  height = 280,
}: ComboBarLineChartProps) {
  // Headroom above the tallest bar so its floating datalabel isn't clipped —
  // only applied when the caller hasn't already pinned an explicit barMax.
  const maxBarValue = Math.max(0, ...barData.filter((v): v is number => v !== null));
  const suggestedBarMax = barMax === undefined && maxBarValue > 0 ? maxBarValue * 1.18 : undefined;

  return (
    <div className="cw" style={{ height }}>
      <Chart
        type="bar"
        data={{
          labels,
          datasets: [
            {
              type: "bar" as const,
              label: barLabel,
              data: barData,
              backgroundColor: barColor,
              borderRadius: 5,
              borderSkipped: false,
              barPercentage: 0.42,
              categoryPercentage: 0.7,
              yAxisID: "yBar",
              datalabels: {
                display: true,
                align: "top",
                anchor: "end",
                offset: 4,
                color: "#061628",
                font: { weight: 700, size: 11 },
                backgroundColor: "rgba(255,255,255,0.85)",
                borderRadius: 3,
                padding: { top: 1, bottom: 1, left: 5, right: 5 },
                formatter: (v: number | null) => (v === null ? "" : idLocale(v, barDecimals)),
              },
            },
            {
              type: "line" as const,
              label: lineLabel,
              data: lineData,
              borderColor: lineColor,
              backgroundColor: lineColor,
              borderWidth: 2.5,
              tension: 0.35,
              pointRadius: 4,
              pointBackgroundColor: lineColor,
              fill: false,
              yAxisID: "yLine",
              datalabels: {
                display: true,
                align: "bottom",
                anchor: "center",
                offset: 6,
                color: "#0A6040",
                font: { weight: 700, size: 9.5 },
                backgroundColor: "rgba(255,255,255,0.9)",
                borderRadius: 3,
                padding: { top: 1, bottom: 1, left: 4, right: 4 },
                formatter: (v: number | null) => (v === null ? "" : idLocale(v, lineDecimals)),
              },
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: X_TICKS, grid: X_GRID },
            yBar: {
              type: "linear",
              position: "left",
              max: barMax,
              suggestedMax: suggestedBarMax,
              beginAtZero: true,
              ticks: { font: { size: 9 }, color: "#7B98B5", callback: (v) => idLocale(Number(v), barDecimals) },
              grid: Y_GRID,
              title: { display: true, text: `${barAxisTitle} (${barUnit})`, color: "#8AAAC2", font: { size: 9.5, weight: 600 } },
            },
            yLine: {
              type: "linear",
              position: "right",
              max: lineMax,
              beginAtZero: true,
              ticks: { font: { size: 9 }, color: "#0A6040", callback: (v) => idLocale(Number(v), lineDecimals) },
              grid: { display: false },
              title: { display: true, text: `${lineAxisTitle} (${lineUnit})`, color: "#0A6040", font: { size: 9.5, weight: 600 } },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) =>
                  c.dataset.yAxisID === "yLine"
                    ? ` ${c.dataset.label}: ${idLocale(c.parsed.y, lineDecimals)} ${lineUnit}`
                    : ` ${c.dataset.label}: ${idLocale(c.parsed.y, barDecimals)} ${barUnit}`,
              },
            },
          },
        }}
      />
    </div>
  );
}
