import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import { Sidebar, MobileTabBar } from "./components/Navigation";
import UQueryCentral from "./components/UQueryCentral";
import XLock from "./components/XLock";
import USchedule from "./components/USchedule";
import UMetadocs from "./components/UMetadocs";
import ActivityLog from "./components/ActivityLog";
import MobileDistributionHub from "./components/MobileDistributionHub";
import DatabaseSettings from "./components/DatabaseSettings";
import { translations } from "./i18n/translations";
import { DATABASES, MOCK_ACTIVITY_LOG } from "./data/mockDatabase";
import { Wifi, Battery, Signal, Monitor, Smartphone, Apple } from "lucide-react";

export default function App() {
  const [lang, setLang] = useState("it");
  const [theme, setTheme] = useState("dark");
  const [platformMode, setPlatformMode] = useState("desktop"); // 'desktop' | 'iphone' | 'android'
  const [currentTab, setCurrentTab] = useState("queryCentral");
  const [databases, setDatabases] = useState(DATABASES);
  const [activeDb, setActiveDb] = useState(DATABASES[0]);
  const [userRole, setUserRole] = useState("analyst");
  const [activityLogs, setActivityLogs] = useState(MOCK_ACTIVITY_LOG);

  // Sync theme attribute to HTML tag
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Activity logger callback
  const handleLogActivity = (event) => {
    const newEntry = {
      id: `ACT-${Math.floor(Math.random() * 9000) + 1000}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      user: event.user || "Current Operator",
      role: event.role || userRole,
      dbTarget: event.dbTarget || activeDb.name,
      action: event.action || "Query Eseguita",
      statement: event.statement || "QUERY EXEC",
      rows: event.rows ?? 0,
      durationMs: event.durationMs ?? 25,
      piiMasked: event.piiMasked ?? true,
      ipAddress: "192.168.10.45",
      sha256Hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
    };

    setActivityLogs([newEntry, ...activityLogs]);
  };

  // Render view component
  const renderCurrentView = () => {
    switch (currentTab) {
      case "queryCentral":
        return (
          <UQueryCentral
            lang={lang}
            translations={translations}
            activeDb={activeDb}
            setActiveDb={setActiveDb}
            userRole={userRole}
            onLogActivity={handleLogActivity}
          />
        );
      case "dbSettings":
        return (
          <DatabaseSettings
            lang={lang}
            translations={translations}
            databases={databases}
            setDatabases={setDatabases}
            activeDb={activeDb}
            setActiveDb={setActiveDb}
            onLogActivity={handleLogActivity}
          />
        );
      case "xLock":
        return (
          <XLock
            lang={lang}
            translations={translations}
            onLogActivity={handleLogActivity}
          />
        );
      case "uSchedule":
        return (
          <USchedule
            lang={lang}
            translations={translations}
            onLogActivity={handleLogActivity}
          />
        );
      case "uMetadocs":
        return (
          <UMetadocs
            lang={lang}
            translations={translations}
            activeDb={activeDb}
          />
        );
      case "activityLog":
        return (
          <ActivityLog
            lang={lang}
            translations={translations}
            logs={activityLogs}
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
            Esci da Simulatore (Torna a Desktop)
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
              activeDb={activeDb}
              userRole={userRole}
              setUserRole={setUserRole}
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
        activeDb={activeDb}
        userRole={userRole}
        setUserRole={setUserRole}
        setCurrentTab={setCurrentTab}
      />

      <div className="workspace-layout">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          translations={translations}
          lang={lang}
          activeDb={activeDb}
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
