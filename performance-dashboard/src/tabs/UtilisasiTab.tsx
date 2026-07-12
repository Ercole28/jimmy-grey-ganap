import { BarChart } from "../components/charts/BarChart";
import { GREEN_PROGRESSION } from "../components/charts/chartTheme";
import { ComboBarLineChart } from "../components/charts/ComboBarLineChart";
import { GroupedBarChart } from "../components/charts/GroupedBarChart";
import { HorizontalBarChart } from "../components/charts/HorizontalBarChart";
import { ExecutiveInsight } from "../components/ExecutiveInsight";
import { HierarchyTree } from "../components/HierarchyTree";
import { KpiCard } from "../components/KpiCard";
import { Recommendations } from "../components/Recommendations";
import { StatusBar } from "../components/StatusBar";
import { useTreeExpansion } from "../hooks/useTreeExpansion";
import type { UtilisasiAnalysis } from "../lib/analysis/utilisasi";
import type { SheetNode } from "../lib/types";

interface UtilisasiTabProps {
  analysis: UtilisasiAnalysis;
  roots: SheetNode[];
}

export function UtilisasiTab({ analysis: a, roots }: UtilisasiTabProps) {
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
        <p className="sec">Utilisasi Infrastruktur &amp; Suprastruktur</p>

        <div className="row-eq3">
          <div className="card">
            <p className="card-t">Tren BOR Terminal</p>
            <p className="card-s">{a.borSubtitle}</p>
            <div className="leg">
              {a.borTrendDatasets.map((ds) => (
                <div className="li" key={ds.label}>
                  <span className="ls" style={{ background: ds.color }} />
                  {ds.label}
                </div>
              ))}
            </div>
            <GroupedBarChart
              labels={a.monthLabels}
              datasets={a.borTrendDatasets}
              unit="%"
              yAxisTitle="BOR (%)"
              height={230}
            />
          </div>
          <div className="card">
            <p className="card-t">Kesiapan Alat Bongkar Muat</p>
            <p className="card-s">{a.readinessSubtitle}</p>
            {a.readinessRanking.labels.length > 0 ? (
              <HorizontalBarChart
                labels={a.readinessRanking.labels}
                data={a.readinessRanking.data}
                colors={a.readinessRanking.colors}
                unit="%"
                isRatio
                decimals={1}
                height={246}
              />
            ) : (
              <p className="k-lbl">Belum ada data.</p>
            )}
          </div>
          <div className="card">
            <p className="card-t">Utilisasi Alat Bongkar Muat</p>
            <p className="card-s">{a.utilizationSubtitle}</p>
            {a.utilizationRanking.labels.length > 0 ? (
              <HorizontalBarChart
                labels={a.utilizationRanking.labels}
                data={a.utilizationRanking.data}
                colors={a.utilizationRanking.colors}
                unit="%"
                isRatio
                decimals={1}
                height={246}
              />
            ) : (
              <p className="k-lbl">Belum ada data.</p>
            )}
          </div>
        </div>

        <div className="row-eq3">
          <div className="card">
            <p className="card-t">SOR Terminal Curah Kering</p>
            <p className="card-s">{a.sorSubtitle}</p>
            <BarChart
              labels={a.monthLabels}
              data={a.sorTrend}
              colors={GREEN_PROGRESSION.concat(GREEN_PROGRESSION)}
              unit="%"
              decimals={1}
              height={230}
            />
          </div>
          <div className="card">
            <p className="card-t">Kinerja Kapal Tunda</p>
            <p className="card-s">{a.kapalTundaSubtitle}</p>
            <div className="leg">
              <div className="li">
                <span className="ls" style={{ background: "#1E62C4" }} />
                Utilisasi
              </div>
              <div className="li">
                <span className="ls" style={{ background: "#0B8A60" }} />
                Kesiapan
              </div>
            </div>
            <ComboBarLineChart
              labels={a.monthLabels}
              barLabel="Utilisasi"
              barData={a.kapalTundaUtil}
              barUnit="%"
              barDecimals={1}
              barDatalabelSuffix="%"
              lineLabel="Kesiapan"
              lineData={a.kapalTundaReady}
              lineUnit="%"
              lineDecimals={1}
              lineDatalabelSuffix="%"
              barAxisTitle="Utilisasi"
              lineAxisTitle="Kesiapan"
              barMax={100}
              lineMax={100}
              height={218}
            />
          </div>
          <div className="card">
            <p className="card-t">Konsumsi BBM Kapal Tunda</p>
            <p className="card-s">{a.bbmSubtitle}</p>
            <BarChart
              labels={a.monthLabels}
              data={a.bbmTrend}
              colors={[
                "#1E62C4",
                "#1E62C4",
                "#1E62C4",
                "#1E62C4",
                "#1E62C4",
                "#1E62C4",
              ]}
              unit="L"
              height={230}
            />
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
