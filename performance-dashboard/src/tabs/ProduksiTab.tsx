import { BarChart } from "../components/charts/BarChart";
import { BLUE_PROGRESSION } from "../components/charts/chartTheme";
import { DonutChart } from "../components/charts/DonutChart";
import { StackedBarChart } from "../components/charts/StackedBarChart";
import { ExecutiveInsight } from "../components/ExecutiveInsight";
import { HierarchyTree } from "../components/HierarchyTree";
import { KpiCard } from "../components/KpiCard";
import { Recommendations } from "../components/Recommendations";
import { StatusBar } from "../components/StatusBar";
import { useTreeExpansion } from "../hooks/useTreeExpansion";
import type { ProduksiAnalysis } from "../lib/analysis/produksi";
import { formatValue } from "../lib/months";
import type { SheetNode } from "../lib/types";

interface ProduksiTabProps {
  analysis: ProduksiAnalysis;
  roots: SheetNode[];
}

export function ProduksiTab({ analysis: a, roots }: ProduksiTabProps) {
  const commodityTotal = a.commodityComposition.data.reduce((x, y) => x + y, 0);
  const serviceGTTotal = a.serviceGTComposition.data.reduce((x, y) => x + y, 0);
  const tree = useTreeExpansion(roots);

  return (
    <>
      <ExecutiveInsight segments={a.insight} />

      <div className="sec-group">
        <p className="sec">Indikator Kinerja Utama</p>
        <div className={`kpi-row n${a.kpis.length}`}>
          {a.kpis.map((k, i) => (
            <KpiCard key={i} {...k} />
          ))}
        </div>
      </div>

      <div className="sec-group">
        <p className="sec">Analisis Produksi &amp; Throughput</p>

        <div className="row2">
          <div className="card">
            <p className="card-t">Produksi Barang Bulanan per Komoditas</p>
            <p className="card-s">{a.commodityTrendSubtitle}</p>
            <div className="leg">
              {a.commodityDatasets.map((ds) => (
                <div className="li" key={ds.label}>
                  <span className="ls" style={{ background: ds.color }} />
                  {ds.label}
                </div>
              ))}
            </div>
            <StackedBarChart
              labels={a.monthLabels}
              datasets={a.commodityDatasets}
              unit="Ton"
              decimals={0}
              yAxisTitle="Ton"
              height={264}
            />
          </div>
          <div className="card">
            <p className="card-t">Komposisi Produksi Barang</p>
            <p className="card-s">{a.commodityCompositionSubtitle}</p>
            <DonutChart
              labels={a.commodityComposition.labels}
              data={a.commodityComposition.data}
              colors={["#6CA4E0", "#1358A4"]}
              unit="Ton"
              centerTop="Total"
              centerBottom={formatValue(commodityTotal)}
              height={230}
            />
            <div className="leg" style={{ justifyContent: "center" }}>
              {a.commodityComposition.labels.map((label, i) => (
                <div className="li" key={label}>
                  <span
                    className="ls"
                    style={{ background: ["#6CA4E0", "#1358A4"][i] }}
                  />
                  {label}{" "}
                  {commodityTotal > 0
                    ? formatValue(
                        (a.commodityComposition.data[i] / commodityTotal) * 100,
                        { decimals: 1 },
                      )
                    : "0"}
                  %
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="row-eq3">
          <div className="card">
            <p className="card-t">Gerakan Pemanduan Bulanan</p>
            <p className="card-s">{a.pemanduanSubtitle}</p>
            <BarChart
              labels={a.monthLabels}
              data={a.pemanduanTrend}
              colors={BLUE_PROGRESSION.concat(BLUE_PROGRESSION)}
              unit="gerakan"
              height={214}
            />
          </div>
          <div className="card">
            <p className="card-t">Volume GT per Layanan Kapal</p>
            <p className="card-s">{a.serviceGTSubtitle}</p>
            <DonutChart
              labels={a.serviceGTComposition.labels}
              data={a.serviceGTComposition.data}
              colors={["#1358A4", "#0B8A60", "#5135AE"]}
              unit="GT"
              centerTop="Total GT"
              centerBottom={formatValue(serviceGTTotal / 1_000_000, {
                decimals: 1,
              })}
              height={214}
            />
          </div>
          <div className="card">
            <p className="card-t">Ringkasan Produksi per Layanan</p>
            <p className="card-s">{a.serviceRowsSubtitle}</p>
            <table className="t">
              <thead>
                <tr>
                  <th>Layanan</th>
                  <th>Satuan</th>
                  <th className="r">Total</th>
                </tr>
              </thead>
              <tbody>
                {a.serviceRows.map((row, i) => (
                  <tr key={row.label} className={i === 0 ? "hl" : undefined}>
                    <td>{row.label}</td>
                    <td>{row.unit}</td>
                    <td className="r">{formatValue(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="nb">
              <p className="nb-t">Catatan Skala</p>
              <p className="nb-b">
                Layanan kapal menggunakan satuan volume masing-masing
                (Gerakan/Kpl Jam/GT Etmal) — tidak dijumlahkan lintas satuan.
              </p>
            </div>
          </div>
        </div>
      </div>

      <StatusBar items={a.status} title={a.statusBarTitle} />
      <Recommendations cards={a.recommendations} />

      <div className="sec-group" data-export-exclude>
        <div className="sec-row">
          <p className="sec">Rincian Lengkap</p>
          <button
            type="button"
            className="sec-toggle-all"
            onClick={tree.toggleAll}
          >
            {tree.allExpanded ? "Tutup Semua" : "Buka Semua"}
          </button>
        </div>
        <div className="card tree-card">
          <HierarchyTree
            roots={roots}
            expanded={tree.expanded}
            onToggle={tree.toggle}
          />
        </div>
      </div>
    </>
  );
}
