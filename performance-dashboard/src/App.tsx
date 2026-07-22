import { useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { TabNav } from "./components/TabNav";
import { Toolbar } from "./components/Toolbar";
import { useExportImage } from "./hooks/useExportImage";
import { useSheetData } from "./hooks/useSheetData";
import { analyzeArus } from "./lib/analysis/arus";
import { analyzeKinerja } from "./lib/analysis/kinerja";
import { analyzeProduksi } from "./lib/analysis/produksi";
import { analyzeUtilisasi } from "./lib/analysis/utilisasi";
import { latestReportedMonth } from "./lib/months";
import { reportFileName } from "./lib/reportNames";
import type { TabId } from "./lib/types";
import { ArusTab } from "./tabs/ArusTab";
import { KinerjaTab } from "./tabs/KinerjaTab";
import { ProduksiTab } from "./tabs/ProduksiTab";
import { UtilisasiTab } from "./tabs/UtilisasiTab";

function App() {
  const { sheets, loading, error, lastSynced, refresh } = useSheetData();
  const [activeTab, setActiveTab] = useState<TabId>("ARUS");
  const [throughMonth, setThroughMonth] = useState(0);
  const didInit = useRef(false);
  const {
    targetRef,
    exporting,
    progress,
    error: exportError,
    exportPng,
  } = useExportImage();

  useEffect(() => {
    if (didInit.current) return;
    const loaded = Object.values(sheets).filter((s) => s !== null);
    if (loaded.length === 0) return;
    setThroughMonth(
      Math.max(...loaded.map((s) => latestReportedMonth(s!.roots))),
    );
    didInit.current = true;
  }, [sheets]);

  let header = null;
  let body = null;

  if (activeTab === "ARUS" && sheets.ARUS) {
    const analysis = analyzeArus(
      sheets.ARUS.roots,
      sheets.ARUS.meta,
      throughMonth,
    );
    header = analysis;
    body = <ArusTab analysis={analysis} roots={sheets.ARUS.roots} />;
  } else if (activeTab === "KINERJA" && sheets.KINERJA) {
    const analysis = analyzeKinerja(
      sheets.KINERJA.roots,
      sheets.KINERJA.meta,
      throughMonth,
    );
    header = analysis;
    body = <KinerjaTab analysis={analysis} roots={sheets.KINERJA.roots} />;
  } else if (activeTab === "UTILISASI" && sheets.UTILISASI) {
    const analysis = analyzeUtilisasi(
      sheets.UTILISASI.roots,
      sheets.UTILISASI.meta,
      throughMonth,
    );
    header = analysis;
    body = <UtilisasiTab analysis={analysis} roots={sheets.UTILISASI.roots} />;
  } else if (activeTab === "PRODUKSI" && sheets.PRODUKSI) {
    const analysis = analyzeProduksi(
      sheets.PRODUKSI.roots,
      sheets.PRODUKSI.meta,
      throughMonth,
    );
    header = analysis;
    body = <ProduksiTab analysis={analysis} roots={sheets.PRODUKSI.roots} />;
  }

  return (
    <>
      <div
        className="export-progress"
        style={{ width: `${progress}%`, opacity: exporting ? 1 : 0 }}
      />
      <div className="app-shell" ref={targetRef}>
        {header ? (
          <Header
            eyebrow={header.eyebrow}
            title={header.title}
            titleAccent={header.titleAccent}
            titleSuffix={header.titleSuffix}
            subtitle={header.subtitle}
            badges={header.badges}
          />
        ) : (
          <Header
            eyebrow="Performance Dashboard"
            title="Memuat"
            titleAccent=" data…"
            subtitle="Menghubungkan ke Google Sheets"
            badges={[]}
          />
        )}

        <TabNav active={activeTab} onChange={setActiveTab} />
        <Toolbar
          activeTab={activeTab}
          throughMonth={throughMonth}
          onThroughMonthChange={setThroughMonth}
          onRefresh={refresh}
          loading={loading}
          lastSynced={lastSynced}
          exporting={exporting}
          exportError={exportError}
          onExport={() => exportPng(reportFileName(activeTab))}
        />

        {error && <div className="app-banner">Gagal memuat data: {error}</div>}

        <main className="app-body">
          {body ?? <p className="k-lbl">Memuat data…</p>}
        </main>

        <footer className="ftr">
          <span>
            {header?.footerLeft ?? "Performance Dashboard · Cabang Banten"}
          </span>
          <span>
            {header?.footerRight ?? "Sumber data: Google Sheets (live)"}
          </span>
        </footer>
      </div>
    </>
  );
}

export default App;
