import { useCallback, useRef, useState } from "react";

export interface UseExportImage {
  targetRef: React.RefObject<HTMLDivElement | null>;
  exporting: boolean;
  progress: number;
  exportPng: (fileName: string) => Promise<void>;
}

// Wider than .app-shell's 1400px max-width (plus body's side padding), so
// the simulated viewport below never triggers the app's own <=1024px /
// <=640px responsive breakpoints — the export always renders the desktop
// layout, regardless of the device it was triggered from.
const DESKTOP_VIEWPORT_WIDTH = 1500;
const DESKTOP_VIEWPORT_HEIGHT = 1200;

/**
 * Captures `targetRef`'s element as a high-resolution PNG, matching the
 * reference reports' own "Export High Quality PNG" behavior (html2canvas at
 * scale 3). Elements marked `data-export-exclude` (and the toolbar/tab nav)
 * are hidden for the duration of the capture via the `.exporting` class —
 * see the .exporting rules in app.css.
 *
 * html2canvas renders through its own offscreen iframe clone, sized by
 * `windowWidth`/`windowHeight` independently of the real browser viewport —
 * so pinning those to a desktop size (and letting `width`/`height` be
 * auto-derived from the clone rather than tied to the live element's
 * current, possibly-mobile, offsetWidth/offsetHeight) is what forces the
 * desktop variant into the export even when the page itself is currently
 * showing the responsive mobile/tablet layout.
 */
export function useExportImage(): UseExportImage {
  const targetRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportPng = useCallback(
    async (fileName: string) => {
      const el = targetRef.current;
      if (!el || exporting) return;

      setExporting(true);
      setProgress(0);
      const tick = window.setInterval(() => {
        setProgress((p) => Math.min(p + 5, 85));
      }, 120);

      el.classList.add("exporting");
      // Let the hidden-element layout settle, and make sure the custom web
      // fonts are actually loaded, before html2canvas measures/paints —
      // otherwise it can paint text with fallback-font metrics while the
      // already-laid-out boxes (borders, padding) were sized for the real
      // font, which shows up as text sitting off-center inside its own pill.
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r)),
      );
      await document.fonts.ready;
      await new Promise((r) => window.setTimeout(r, 200));

      try {
        // Lazily loaded — html2canvas is a sizeable dependency only needed
        // when the user actually exports, not on every initial page load.
        const { default: html2canvas } = await import("html2canvas");
        const canvas = await html2canvas(el, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#e8eef7",
          logging: false,
          imageTimeout: 0,
          windowWidth: DESKTOP_VIEWPORT_WIDTH,
          windowHeight: DESKTOP_VIEWPORT_HEIGHT,
          scrollX: 0,
          scrollY: 0,
        });
        window.clearInterval(tick);
        setProgress(100);
        const a = document.createElement("a");
        a.download = `${fileName}.png`;
        a.href = canvas.toDataURL("image/png", 1.0);
        a.click();
      } finally {
        window.clearInterval(tick);
        el.classList.remove("exporting");
        window.setTimeout(() => {
          setExporting(false);
          setProgress(0);
        }, 500);
      }
    },
    [exporting],
  );

  return { targetRef, exporting, progress, exportPng };
}
