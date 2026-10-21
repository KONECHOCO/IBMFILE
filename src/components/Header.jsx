import React from "react";
import { 
  ShieldCheck, 
  Database, 
  Smartphone, 
  Monitor, 
  Globe, 
  Moon, 
  Sun, 
  Terminal,
  Activity,
  KeyRound,
  Settings2
} from "lucide-react";

export default function Header({
  lang,
  setLang,
  translations,
  theme,
  setTheme,
  platformMode,
  setPlatformMode,
  activeDb,
  userRole,
  setUserRole,
  setCurrentTab
}) {
  const t = translations[lang] || translations.en;

  return (
    <header className="ibm-header">
      {/* Brand & System ID */}
      <div className="ibm-brand">
        <svg className="ibm-bars-icon" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="4" fill="#0f62fe" />
          <rect x="6" y="8" width="28" height="3" fill="#ffffff" />
          <rect x="6" y="14" width="28" height="3" fill="#ffffff" />
          <rect x="6" y="20" width="28" height="3" fill="#ffffff" />
          <rect x="6" y="26" width="28" height="3" fill="#ffffff" />
        </svg>
        <div className="ibm-title-group">
          <div className="ibm-title">
            <span>{t.systemTitle}</span>
            <span className="ibm-edition-badge">IBM i &bull; MULTI-DB</span>
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
          title="Clicca per Gestire Credenziali e Parametri Database"
        >
          <span className="status-dot-green"></span>
          <span className="mono">{activeDb.name} : {activeDb.port}</span>
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
          title="Impostazioni & Credenziali Database"
        >
          <KeyRound size={16} color="var(--cds-blue-light)" />
        </button>

        {/* User Role Selector (Demonstrates Dynamic PII Masking) */}
        <select 
          className="select-control mono"
          value={userRole}
          onChange={(e) => setUserRole(e.target.value)}
          title="Simulate Role-Based Permissions"
        >
          <option value="analyst">Role: Data Analyst (Masked PII)</option>
          <option value="admin">Role: Sec Admin (Full Access)</option>
          <option value="auditor">Role: Compliance Auditor</option>
        </select>

        {/* Platform View: Desktop vs Mobile App Simulator */}
        <button 
          className={`btn-icon ${platformMode !== "desktop" ? "active" : ""}`}
          onClick={() => setPlatformMode(platformMode === "desktop" ? "iphone" : "desktop")}
          title={platformMode === "desktop" ? "Switch to Mobile App Simulator" : "Switch to Desktop Browser"}
        >
          {platformMode === "desktop" ? <Smartphone size={16} /> : <Monitor size={16} />}
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
