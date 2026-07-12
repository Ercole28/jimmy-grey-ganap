import type { TabId } from "../lib/types";

const TABS: { id: TabId; label: string }[] = [
  { id: "ARUS", label: "Arus" },
  { id: "KINERJA", label: "Kinerja" },
  { id: "UTILISASI", label: "Utilisasi" },
  { id: "PRODUKSI", label: "Produksi" },
];

interface TabNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav className="tab-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-nav__item${tab.id === active ? " tab-nav__item--active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
