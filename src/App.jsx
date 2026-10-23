import React, { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import { Sidebar, MobileTabBar } from "./components/Navigation";
import UQueryCentral from "./components/UQueryCentral";
import XLock from "./components/XLock";
import USchedule from "./components/USchedule";
import UMetadocs from "./components/UMetadocs";
import ActivityLog from "./components/ActivityLog";
import AdminPanel from "./components/AdminPanel";
import DatabaseSettings from "./components/DatabaseSettings";
import GatewayLogin from "./components/GatewayLogin";
import AdBanner from "./components/AdBanner";
import AdDiagnostics from "./components/AdDiagnostics";
import ProModal from "./components/ProModal";
import { initMonetization, trackAdAction } from "./services/monetization";
import { translations } from "./i18n/translations";
import { api, getSession, logout, setUnauthorizedHandler } from "./api/gateway";

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
  const [currentTab, setCurrentTab] = useState("queryCentral");
  const [user, setUser] = useState(getSession().token ? getSession().user : null);
  const [connections, setConnections] = useState([]);
  const [activeDb, setActiveDbState] = useState(null);
  const [proOpen, setProOpen] = useState(false);

  useEffect(() => {
    initMonetization();
  }, []);

  // Every module change is a natural break for a full-screen ad (see monetization.js)
  const changeTab = (tab) => {
    if (tab !== currentTab) trackAdAction();
    setCurrentTab(tab);
  };

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

  const monetization = (
    <>
      <AdBanner />
      <AdDiagnostics />
      <ProModal isOpen={proOpen} onClose={() => setProOpen(false)} u={ui} />
    </>
  );

  if (!user) {
    return (
      <>
        <GatewayLogin lang={lang} setLang={setLang} translations={translations} onLoggedIn={setUser} />
        {monetization}
      </>
    );
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
      case "admin":
        return user.role === "admin" ? <AdminPanel lang={lang} translations={translations} user={user} /> : null;
      default:
        return null;
    }
  };

  // Standard Desktop Layout
  return (
    <div className="app-container">
      <Header
        lang={lang}
        setLang={setLang}
        translations={translations}
        theme={theme}
        setTheme={setTheme}
        activeDb={shownActiveDb}
        user={user}
        onLogout={handleLogout}
        onOpenPro={() => setProOpen(true)}
        setCurrentTab={changeTab}
      />

      <div className="workspace-layout">
        <Sidebar
          user={user}
          currentTab={currentTab}
          setCurrentTab={changeTab}
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
        user={user}
        currentTab={currentTab}
        setCurrentTab={changeTab}
        translations={translations}
        lang={lang}
      />
      {monetization}
    </div>
  );
}
