import { BarChart } from "../components/charts/BarChart";
import { BLUE_PROGRESSION } from "../components/charts/chartTheme";
import { ComboBarLineChart } from "../components/charts/ComboBarLineChart";
import { GroupedBarChart } from "../components/charts/GroupedBarChart";
import { StackedBarChart } from "../components/charts/StackedBarChart";
import { ExecutiveInsight } from "../components/ExecutiveInsight";
import { HierarchyTree } from "../components/HierarchyTree";
import { KpiCard } from "../components/KpiCard";
import { Recommendations } from "../components/Recommendations";
import { StatusBar } from "../components/StatusBar";
import { useTreeExpansion } from "../hooks/useTreeExpansion";
import type { KinerjaAnalysis } from "../lib/analysis/kinerja";
import { formatValue } from "../lib/months";
import type { SheetNode } from "../lib/types";

interface KinerjaTabProps {
  analysis: KinerjaAnalysis;
  roots: SheetNode[];
}

export function KinerjaTab({ analysis: a, roots }: KinerjaTabProps) {
  const tree = useTreeExpansion(roots);

  return (
    <>
      <ExecutiveInsight segments={a.insight} />

      <div className="sec-group">
        <p className="sec">Indikator Kinerja Utama — Konsolidasi</p>
        <div className={`kpi-row n${a.kpis.length}`}>
          {a.kpis.map((k, i) => (
            <KpiCard key={i} {...k} />
          ))}
        </div>
      </div>

      <div className="sec-group">
        <p className="sec">Analisis Efisiensi &amp; Produktivitas</p>

        <div className="row2">
          <div className="card">
            <p className="card-t">Tren Efisiensi Tambat (ET/BT) per Terminal</p>
            <p className="card-s">{a.etbtTrendSubtitle}</p>
            <div className="leg">
              {a.etbtTrendDatasets.map((ds) => (
                <div className="li" key={ds.label}>
                  <span className="ls" style={{ background: ds.color }} />
                  {ds.label}
                </div>
              ))}
            </div>
            <GroupedBarChart
              labels={a.monthLabels}
              datasets={a.etbtTrendDatasets}
              unit="%"
              yAxisTitle="ET/BT (%)"
              yMax={100}
            />
          </div>
          <div className="card">
            <p className="card-t">Komposisi Waktu Tambat (BT)</p>
            <p className="card-s">{a.btCompositionSubtitle}</p>
            <div className="leg">
              {a.btCompositionDatasets.map((ds) => (
                <div className="li" key={ds.label}>
                  <span className="ls" style={{ background: ds.color }} />
                  {ds.label}
                </div>
              ))}
            </div>
            <StackedBarChart
              labels={a.btCompositionLabels}
              datasets={a.btCompositionDatasets}
              unit="jam"
              yAxisTitle="Jam"
            />
          </div>
        </div>

        <div className="row-eq3">
          <div className="card">
            <p className="card-t">Waktu Pelayanan Kapal (WT &amp; AT)</p>
            <p className="card-s">{a.serviceSubtitle}</p>
            <div className="leg">
              <div className="li">
                <span className="ls" style={{ background: "#1E62C4" }} />
                Approach Time (jam)
              </div>
              <div className="li">
                <span className="ls" style={{ background: "#0B8A60" }} />
                Waiting Time (jam)
              </div>
            </div>
            <ComboBarLineChart
              labels={a.serviceLabels}
              barLabel="Approach Time (AT)"
              barData={a.serviceAT}
              barUnit="jam"
              barDecimals={2}
              barDatalabelSuffix=" j"
              lineLabel="Waiting Time (WT)"
              lineData={a.serviceWT}
              lineUnit="jam"
              lineDecimals={3}
              barAxisTitle="AT"
              lineAxisTitle="WT"
              barMax={1}
            />
          </div>
          <div className="card">
            <p className="card-t">Produktivitas T/G/H Curah Kering</p>
            <p className="card-s">{a.productivitySubtitle}</p>
            <BarChart
              labels={a.monthLabels}
              data={a.productivityTrend}
              colors={BLUE_PROGRESSION.concat(BLUE_PROGRESSION)}
              unit="T/G/H"
              decimals={1}
            />
          </div>
          <div className="card">
            <p className="card-t">Rincian Metrik Tambat per Terminal</p>
            <p className="card-s">
              Rata-rata {a.eyebrow.split("·")[1]?.trim() ?? "periode berjalan"}{" "}
              (Konsolidasi) — satuan jam kecuali ET/BT.
            </p>
            <table className="t">
              <thead>
                <tr>
                  <th>Terminal</th>
                  <th className="r">BT</th>
                  <th className="r">ET</th>
                  <th className="r">IT</th>
                  <th className="r">ET/BT</th>
                </tr>
              </thead>
              <tbody>
                {a.terminals.map((t) => (
                  <tr
                    key={t.label}
                    className={t.isAverage ? "tt" : t.isBest ? "hl" : undefined}
                  >
                    <td>{t.label}</td>
                    <td className="r">{formatValue(t.bt, { decimals: 1 })}</td>
                    <td className="r">{formatValue(t.et, { decimals: 1 })}</td>
                    <td className="r">{formatValue(t.it, { decimals: 1 })}</td>
                    <td className={`r fw${t.isBest ? " bl" : ""}`}>
                      {formatValue(t.etbt, { decimals: 1 })}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
