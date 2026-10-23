import React, { useRef } from "react";
import { 
  ShieldCheck, 
  Database, 
  Globe, 
  Moon, 
  Sun, 
  Terminal,
  Activity,
  KeyRound,
  Settings2,
  LogOut,
  User,
  Crown
} from "lucide-react";
import { toggleTestAds, useMonetization } from "../services/monetization";
import BrandMark from "./BrandMark";

export default function Header({
  lang,
  setLang,
  translations,
  theme,
  setTheme,
  activeDb,
  user,
  onLogout,
  onOpenPro,
  setCurrentTab
}) {
  const t = translations[lang] || translations.en;
  const u = t.ui;
  const { native, isPro } = useMonetization();

  // 7 taps on the logo: test ads on/off, for checking ads in TestFlight / internal test builds
  const taps = useRef({ n: 0, at: 0 });
  const onLogoTap = () => {
    const now = Date.now();
    taps.current = { n: now - taps.current.at < 1500 ? taps.current.n + 1 : 1, at: now };
    if (taps.current.n >= 7) {
      taps.current.n = 0;
      window.alert(toggleTestAds() ? "Test ads ON — restart the app" : "Test ads OFF — restart the app");
    }
  };

  return (
    <header className="ibm-header">
      {/* Brand & System ID */}
      <div className="ibm-brand">
        <span onClick={onLogoTap} style={{ display: "inline-flex" }}><BrandMark className="ibm-bars-icon" /></span>
        <div className="ibm-title-group">
          <div className="ibm-title">
            <span>{t.systemTitle}</span>
            <span className="ibm-edition-badge">MULTI-DB</span>
          </div>
          <span className="ibm-subtitle">{t.tagline}</span>
        </div>
      </div>

      {/* Center Telemetry: DB status & Read-Only Badge */}
      <div className="ibm-header-telemetry">
        <button 
          className="telemetry-chip" 
          onClick={() => setCurrentTab && setCurrentTab("dbSettings")}
          style={{ cursor: "pointer", border: "1px solid var(--cds-border-subtle)", background: "var(--cds-bg-surface-1)" }}
          title={u.manageConnections}
        >
          <span className={activeDb ? "status-dot-green" : ""}></span>
          <span className="mono">{activeDb ? activeDb.name : u.noActiveConnection}</span>
          <KeyRound size={12} style={{ marginLeft: "4px", color: "var(--cds-blue-light)" }} />
        </button>

        <div className="read-only-shield" title={t.readOnlyTooltip}>
          <ShieldCheck size={14} />
          <span>{t.readOnlyBadge}</span>
        </div>
      </div>

      {/* Right Controls: DB Vault, Role, Platform Switcher, Language, Theme */}
      <div className="header-actions">
        {/* Quick DB Credentials & Settings button */}
        <button 
          className="btn-icon"
          onClick={() => setCurrentTab && setCurrentTab("dbSettings")}
          title={u.manageConnections}
        >
          <KeyRound size={16} color="var(--cds-blue-light)" />
        </button>

        {native && !isPro && (
          <button className="btn-icon" onClick={onOpenPro} title={u.pro.title} style={{ color: "var(--cds-amber)" }}>
            <Crown size={16} />
          </button>
        )}

        {/* Signed-in gateway user */}
        <span className="telemetry-chip mono header-user-chip" title={u.roles[user?.role] || user?.role}>
          <User size={12} />
          {user?.username} · {u.roles[user?.role] || user?.role}
        </span>
        <button className="btn-icon" onClick={onLogout} title={u.signOut}>
          <LogOut size={16} />
        </button>

        {/* Multi-Language Selector (IT, EN, ES, FR, DE, JA) */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Globe size={15} style={{ color: "var(--cds-text-muted)" }} />
          <select 
            className="select-control"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="it">🇮🇹 Italiano</option>
            <option value="en">🇬🇧 English</option>
            <option value="es">🇪🇸 Español</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="ja">🇯🇵 日本語</option>
          </select>
        </div>

        {/* Theme Switcher: Carbon Dark / Light / Cyber */}
        <button 
          className="btn-icon"
          onClick={() => {
            const nextTheme = theme === "dark" ? "light" : theme === "light" ? "cyber" : "dark";
            setTheme(nextTheme);
          }}
          title={`Theme: ${theme.toUpperCase()}`}
        >
          {theme === "dark" ? <Moon size={16} /> : theme === "light" ? <Sun size={16} /> : <Terminal size={16} />}
        </button>
      </div>
    </header>
  );
}
