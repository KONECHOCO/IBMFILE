import React, { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import { Sidebar, MobileTabBar } from "./components/Navigation";
import UQueryCentral from "./components/UQueryCentral";
import XLock from "./components/XLock";
import USchedule from "./components/USchedule";
import UMetadocs from "./components/UMetadocs";
import ActivityLog from "./components/ActivityLog";
import MobileDistributionHub from "./components/MobileDistributionHub";
import DatabaseSettings from "./components/DatabaseSettings";
import GatewayLogin from "./components/GatewayLogin";
import { translations } from "./i18n/translations";
import { api, getSession, logout, setUnauthorizedHandler } from "./api/gateway";
import { Wifi, Battery, Signal, Monitor, Smartphone, Apple } from "lucide-react";

const SUPPORTED_LANGS = ["it", "en", "es", "fr", "de", "ja"];

function initialLang() {
  try {
    const saved = localStorage.getItem("plexa.lang");
    if (SUPPORTED_LANGS.includes(saved)) return saved;
  } catch {
    // storage unavailable
  }
  const nav = (navigator.language || "en").slice(0, 2);
  return SUPPORTED_LANGS.includes(nav) ? nav : "en";
}

export default function App() {
  const [lang, setLang] = useState(initialLang);
  const [theme, setTheme] = useState("dark");
  const [platformMode, setPlatformMode] = useState("desktop"); // 'desktop' | 'iphone' | 'android'
  const [currentTab, setCurrentTab] = useState("queryCentral");
  const [user, setUser] = useState(getSession().token ? getSession().user : null);
  const [connections, setConnections] = useState([]);
  const [activeDb, setActiveDbState] = useState(null);

  // Sync theme attribute to HTML tag
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    try {
      localStorage.setItem("plexa.lang", lang);
    } catch {
      // storage unavailable
    }
  }, [lang]);

  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
    setConnections([]);
    setActiveDbState(null);
  }, []);

  useEffect(() => setUnauthorizedHandler(handleLogout), [handleLogout]);

  const setActiveDb = (conn) => {
    setActiveDbState(conn || null);
    try {
      localStorage.setItem("plexa.activeConnection", conn?.id || "");
    } catch {
      // storage unavailable
    }
  };

  const reloadConnections = useCallback(async () => {
    const list = await api.connections();
    setConnections(list);
    setActiveDbState((current) => {
      let savedId = null;
      try {
        savedId = localStorage.getItem("plexa.activeConnection");
      } catch {
        // storage unavailable
      }
      return list.find((c) => c.id === current?.id) || list.find((c) => c.id === savedId) || list[0] || null;
    });
    return list;
  }, []);

  useEffect(() => {
    if (user) reloadConnections().catch(() => {});
  }, [user, reloadConnections]);

  // The demo connection's name comes from the gateway in English; show it in the UI language.
  const ui = (translations[lang] || translations.en).ui;
  const localize = (c) => (c && c.isDemo ? { ...c, name: ui.demoName, driverLabel: "SQLite" } : c);
  const shownConnections = connections.map(localize);
  const shownActiveDb = localize(activeDb);

  if (!user) {
    return <GatewayLogin lang={lang} setLang={setLang} translations={translations} onLoggedIn={setUser} />;
  }

  // Render view component
  const renderCurrentView = () => {
    switch (currentTab) {
      case "queryCentral":
        return (
          <UQueryCentral
            lang={lang}
            translations={translations}
            activeDb={shownActiveDb}
            connections={shownConnections}
            setActiveDb={setActiveDb}
            user={user}
          />
        );
      case "dbSettings":
        return (
          <DatabaseSettings
            key={activeDb?.id || "none"}
            lang={lang}
            translations={translations}
            connections={shownConnections}
            reloadConnections={reloadConnections}
            activeDb={shownActiveDb}
            setActiveDb={setActiveDb}
            user={user}
          />
        );
      case "xLock":
        return (
          <XLock
            lang={lang}
            translations={translations}
          />
        );
      case "uSchedule":
        return (
          <USchedule
            lang={lang}
            translations={translations}
          />
        );
      case "uMetadocs":
        return (
          <UMetadocs
            lang={lang}
            translations={translations}
            activeDb={shownActiveDb}
          />
        );
      case "activityLog":
        return (
          <ActivityLog
            lang={lang}
            translations={translations}
            user={user}
          />
        );
      case "mobileHub":
        return (
          <MobileDistributionHub
            lang={lang}
            translations={translations}
            platformMode={platformMode}
            setPlatformMode={setPlatformMode}
          />
        );
      default:
        return null;
    }
  };

  // If in Mobile Simulator Mode (iPhone / Android)
  if (platformMode === "iphone" || platformMode === "android") {
    const isIphone = platformMode === "iphone";

    return (
      <div className="simulator-wrapper" style={{ minHeight: "100vh", backgroundColor: "#0a0a0a" }}>
        {/* Simulator Control Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", zIndex: 10 }}>
          <button 
            className="ibm-btn ibm-btn-secondary ibm-btn-sm"
            onClick={() => setPlatformMode("desktop")}
          >
            <Monitor size={14} />
            {translations[lang].ui.exitSimulator}
          </button>

          <button 
            className={`ibm-btn ibm-btn-sm ${isIphone ? "ibm-btn-primary" : "ibm-btn-secondary"}`}
            onClick={() => setPlatformMode("iphone")}
          >
            <Apple size={14} />
            iPhone 16 Pro
          </button>

          <button 
            className={`ibm-btn ibm-btn-sm ${!isIphone ? "ibm-btn-primary" : "ibm-btn-secondary"}`}
            onClick={() => setPlatformMode("android")}
          >
            <Smartphone size={14} />
            Samsung Galaxy S24
          </button>
        </div>

        {/* Device Frame */}
        <div className={isIphone ? "device-frame-iphone" : "device-frame-android"}>
          {/* Dynamic Island or Punch Hole */}
          {isIphone ? (
            <div className="dynamic-island">
              <div className="dynamic-island-cam"></div>
              <div style={{ width: "30px", height: "10px", background: "#050505", borderRadius: "4px" }}></div>
              <div className="dynamic-island-sensor"></div>
            </div>
          ) : (
            <div className="android-punch-hole"></div>
          )}

          {/* Status Bar */}
          <div style={{ 
            position: "absolute", 
            top: isIphone ? "12px" : "6px", 
            left: "24px", 
            right: "24px", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            fontSize: "12px", 
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            color: "#ffffff",
            zIndex: 998
          }}>
            <span>09:41</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Signal size={12} />
              <Wifi size={12} />
              <Battery size={14} />
            </div>
          </div>

          {/* Inner Screen Scrollable View */}
          <div className="device-screen-inner">
            <Header
              lang={lang}
              setLang={setLang}
              translations={translations}
              theme={theme}
              setTheme={setTheme}
              platformMode={platformMode}
              setPlatformMode={setPlatformMode}
              activeDb={shownActiveDb}
              user={user}
              onLogout={handleLogout}
              setCurrentTab={setCurrentTab}
            />

            <main style={{ padding: "12px 12px 80px 12px", flex: 1 }}>
              {renderCurrentView()}
            </main>

            {/* Mobile Tab Bar inside device */}
            <MobileTabBar
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              translations={translations}
              lang={lang}
            />
          </div>
        </div>
      </div>
    );
  }

  // Standard Desktop Layout
  return (
    <div className="app-container">
      <Header
        lang={lang}
        setLang={setLang}
        translations={translations}
        theme={theme}
        setTheme={setTheme}
        platformMode={platformMode}
        setPlatformMode={setPlatformMode}
        activeDb={shownActiveDb}
        user={user}
        onLogout={handleLogout}
        setCurrentTab={setCurrentTab}
      />

      <div className="workspace-layout">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          translations={translations}
          lang={lang}
          activeDb={shownActiveDb}
        />

        <main className="main-view-container">
          {renderCurrentView()}
        </main>
      </div>

      {/* Mobile Tab Bar on narrow screens */}
      <MobileTabBar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        translations={translations}
        lang={lang}
      />
    </div>
  );
}
