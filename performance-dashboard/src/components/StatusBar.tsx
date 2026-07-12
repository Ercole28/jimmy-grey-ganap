import type { StatusBarItem } from "../lib/types";

interface StatusBarProps {
  items: StatusBarItem[];
  title?: string;
}

export function StatusBar({ items, title = "Key Takeaways" }: StatusBarProps) {
  if (items.length === 0) return null;

  return (
    <div className="sbar">
      <span className="sbar-ttl">{title}</span>
      <div className="sbar-list">
        {items.map((item, i) => (
          <div key={i} className={`si ${item.tone === "ok" ? "ok" : "wn"}`}>
            <span className={`dot ${item.tone === "ok" ? "dok" : "dwn"}`} />
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}
