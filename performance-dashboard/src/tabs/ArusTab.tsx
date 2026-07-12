import { ComboBarLineChart } from "../components/charts/ComboBarLineChart";
import { monthlyPeakColors } from "../components/charts/chartTheme";
import { DonutChart } from "../components/charts/DonutChart";
import { HorizontalBarChart } from "../components/charts/HorizontalBarChart";
import { ExecutiveInsight } from "../components/ExecutiveInsight";
import { HierarchyTree } from "../components/HierarchyTree";
import { KpiCard } from "../components/KpiCard";
import { NoteBox } from "../components/NoteBox";
import { Recommendations } from "../components/Recommendations";
import { StatusBar } from "../components/StatusBar";
import { useTreeExpansion } from "../hooks/useTreeExpansion";
import type { ArusAnalysis } from "../lib/analysis/arus";
import { formatValue } from "../lib/months";
import type { SheetNode } from "../lib/types";

interface ArusTabProps {
  analysis: ArusAnalysis;
  roots: SheetNode[];
}

export function ArusTab({ analysis: a, roots }: ArusTabProps) {
  const tree = useTreeExpansion(roots);

  return (
    <>
      <ExecutiveInsight segments={a.insight} />

      <div className="sec-group">
        <p className="sec">Indikator Kinerja Trafik</p>
        <div className={`kpi-row n${a.kpis.length}`}>
          {a.kpis.map((k, i) => (
            <KpiCard key={i} {...k} />
          ))}
        </div>
      </div>

      <div className="sec-group">
        <p className="sec">Analisis Trafik &amp; Komposisi</p>

        <div className="row2">
          <div className="card">
            <p className="card-t">Tren Bulanan Kunjungan &amp; Gross Tonnage</p>
            <p className="card-s">{a.trendSubtitle}</p>
            <div className="leg">
              <div className="li">
                <span className="ls" style={{ background: "#1E62C4" }} />
                Kunjungan (Call)
              </div>
              <div className="li">
                <span className="lsp" />
                Gross Tonnage (juta GT)
              </div>
            </div>
            <ComboBarLineChart
              labels={a.monthLabels}
              barLabel="Kunjungan (Call)"
              barData={a.trendCall}
              barColor={monthlyPeakColors(a.trendCall)}
              barUnit="Call"
              lineLabel="Gross Tonnage (juta GT)"
              lineData={a.trendGT}
              lineUnit="juta GT"
              lineDatalabelSuffix=" M"
              lineHeadroomRatio={1.6}
              barAxisTitle="Kunjungan"
              lineAxisTitle="GT"
            />
          </div>

          <div className="card">
            <p className="card-t">Komposisi Jenis Pelayaran</p>
            <p className="card-s">{a.voyageSubtitle}</p>
            <DonutChart
              labels={a.voyageComposition.labels}
              data={a.voyageComposition.data}
              colors={["#0B8A60", "#1358A4", "#B6D2F0"]}
              unit="kunjungan"
              centerTop="Total"
              centerBottom={formatValue(
                a.voyageComposition.data.reduce((x, y) => x + y, 0),
              )}
            />
            <div className="dl">
              {a.voyageComposition.labels.map((label, i) => {
                const total = a.voyageComposition.data.reduce(
                  (x, y) => x + y,
                  0,
                );
                const pct =
                  total > 0 ? (a.voyageComposition.data[i] / total) * 100 : 0;
                return (
                  <div className="li" key={label}>
                    <span
                      className="ls"
                      style={{
                        background: ["#0B8A60", "#1358A4", "#B6D2F0"][i],
                      }}
                    />
                    {label} · {formatValue(a.voyageComposition.data[i])} (
                    {formatValue(pct, { decimals: 1 })}%)
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="row-eq3">
          <div className="card">
            <p className="card-t">Kunjungan per Jenis Muatan</p>
            <p className="card-s">{a.cargoSubtitle}</p>
            {a.cargoRanking.labels.length > 0 ? (
              <HorizontalBarChart
                labels={a.cargoRanking.labels}
                data={a.cargoRanking.data}
                unit="kunjungan"
              />
            ) : (
              <p className="k-lbl">Belum ada data.</p>
            )}
          </div>

          <div className="card">
            <p className="card-t">Distribusi per Lokasi Sandar</p>
            <p className="card-s">{a.distribusiSubtitle}</p>
            {a.locations.map((loc) => (
              <div
                className={`cbg${loc === a.locations[0] ? " tot" : ""}`}
                key={loc.label}
              >
                <div className="cbg-l">
                  <span
                    className="cbg-dot"
                    style={{
                      background:
                        loc === a.locations[0] ? "#1358A4" : "#6CA4E0",
                    }}
                  />
                  <span className="cbg-n">{loc.label}</span>
                </div>
                <div>
                  <span className="cbg-v">{formatValue(loc.call)}</span>
                  <span className="cbg-p">
                    {formatValue(loc.sharePct, { decimals: 1 })}%
                  </span>
                </div>
              </div>
            ))}
            {a.locations.length > 0 && (
              <div className="ins">
                <p className="ins-t">Gross Tonnage per Kunjungan</p>
                <div className="ins-g">
                  {a.locations.slice(0, 2).map((loc) => (
                    <div key={loc.label}>
                      <p className="ins-l">{loc.label} (GT juta)</p>
                      <p className="ins-v">
                        {formatValue(loc.gt / 1_000_000, { decimals: 2 })} jt ·{" "}
                        {formatValue(loc.gtPerCall, { decimals: 0 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {a.biggerShipNote && (
              <NoteBox
                title={a.biggerShipNote.title}
                body={a.biggerShipNote.body}
              />
            )}
          </div>

          <div className="card">
            <p className="card-t">Rincian Trafik per Lokasi</p>
            <p className="card-s">{a.crossTableSubtitle}</p>
            <table className="t">
              <thead>
                <tr>
                  <th>Lokasi &amp; Pelayaran</th>
                  <th className="r">Kunjungan</th>
                  <th className="r">Share</th>
                </tr>
              </thead>
              <tbody>
                {a.crossRows.map((row) => (
                  <tr
                    key={row.label}
                    className={row.isTotal ? "tt" : undefined}
                  >
                    <td>{row.label}</td>
                    <td className={`r${row.isTotal ? "" : " fw"}`}>
                      {formatValue(row.call)}
                    </td>
                    <td className="r">
                      {formatValue(row.sharePct, { decimals: 1 })}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {a.segmentationNote && (
              <NoteBox
                title={a.segmentationNote.title}
                body={a.segmentationNote.body}
              />
            )}
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
