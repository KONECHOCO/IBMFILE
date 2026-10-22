import React from "react";
import { 
  Database, 
  ShieldAlert, 
  CalendarClock, 
  Layers, 
  FileCheck2, 
  Settings2,
  Server,
  KeyRound
} from "lucide-react";

export const NAV_ITEMS = [
  { id: "queryCentral", icon: Database, key: "queryCentral" },
  { id: "dbSettings", icon: KeyRound, key: "dbSettings" },
  { id: "xLock", icon: ShieldAlert, key: "xLock" },
  { id: "uSchedule", icon: CalendarClock, key: "uSchedule" },
  { id: "uMetadocs", icon: Layers, key: "uMetadocs" },
  { id: "activityLog", icon: FileCheck2, key: "activityLog" },
  { id: "admin", icon: Settings2, key: "admin", adminOnly: true },
];

export function Sidebar({ user, currentTab, setCurrentTab, translations, lang, activeDb }) {
  const t = translations[lang] || translations.en;

  return (
    <aside className="ibm-sidebar">
      <div>
        <div style={{ padding: "0 20px 12px 20px", fontSize: "11px", fontWeight: "700", color: "var(--cds-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {t.ui.modules}
        </div>
        <ul className="sidebar-nav-list">
          {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "admin").map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const title = t.nav[item.key];
            const desc = t.nav[`${item.key}Desc`];

            return (
              <li key={item.id}>
                <button
                  className={`nav-item-btn ${isActive ? "active" : ""}`}
                  onClick={() => setCurrentTab(item.id)}
                >
                  <Icon className="nav-icon" />
                  <div className="nav-text-col">
                    <span>{title}</span>
                    <span className="nav-desc">{desc}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {activeDb && (
        <div className="sidebar-footer">
          <div style={{ fontWeight: 600, color: "var(--cds-text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Server size={14} color="var(--cds-blue-light)" />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeDb.name}</span>
          </div>
          <div className="sidebar-footer-stat">
            <span>{t.ui.dbType}</span>
            <span>{activeDb.driverLabel}</span>
          </div>
          {activeDb.host && (
            <div className="sidebar-footer-stat">
              <span>{t.ui.host}</span>
              <span className="mono" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{activeDb.host}:{activeDb.port}</span>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

export function MobileTabBar({ user, currentTab, setCurrentTab, translations, lang }) {
  const t = translations[lang] || translations.en;

  return (
    <nav className="mobile-tab-bar">
      {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "admin").map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        const title = t.nav[item.key];

        return (
          <button
            key={item.id}
            className={`mobile-tab-btn ${isActive ? "active" : ""}`}
            onClick={() => setCurrentTab(item.id)}
          >
            <Icon size={18} />
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "54px" }}>
              {title}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
