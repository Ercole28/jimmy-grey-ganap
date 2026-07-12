import type { HeaderBadge } from "../lib/types";

interface HeaderProps {
  eyebrow: string;
  title: string;
  titleAccent: string;
  titleSuffix?: string;
  subtitle: string;
  badges: HeaderBadge[];
}

export function Header({ eyebrow, title, titleAccent, titleSuffix, subtitle, badges }: HeaderProps) {
  return (
    <header className="hdr">
      <div className="hdr-bar">
        <div className="hdr-bar-left">
          <div className="logo-wrapper">
            <img src="/pelindo-logo.png" alt="Pelindo" className="logo-wrapper__logo" />
          </div>
          <span className="bar-sep" />
          <div className="logo-wrapper">
            <img src="/danantara-indonesia.png" alt="Danantara Indonesia" className="logo-wrapper__logo" />
          </div>
          <span className="bar-sep" />
          <span className="bar-tagline">
            <strong>PT Pelabuhan Indonesia (Persero)</strong>
            Regional 2 Banten
          </span>
        </div>
        <div className="hdr-bar-right">
          <span className="bar-chip">Dokumen Internal</span>
          <span className="bar-chip">Executive Summary</span>
        </div>
      </div>

      <div className="hdr-main">
        <div className="hdr-left">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="hdr-title">
            {title}
            <em>{titleAccent}</em>
            {titleSuffix ? ` ${titleSuffix}` : ""}
          </h1>
          <p className="hdr-sub">{subtitle}</p>
        </div>
        <div className="hdr-badges">
          {badges.map((badge, i) => (
            <div className="hdr-badge" key={i}>
              <div className="hdr-badge-v">{badge.value}</div>
              <div className="hdr-badge-l">{badge.label}</div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
