import React, { useState } from "react";
import { 
  Smartphone, 
  Apple, 
  Globe2, 
  CheckCircle2, 
  Copy, 
  Download, 
  Terminal, 
  QrCode, 
  Layers, 
  ShieldCheck, 
  Play,
  RotateCcw
} from "lucide-react";

export default function MobileDistributionHub({
  lang,
  translations,
  platformMode,
  setPlatformMode,
  children
}) {
  const t = translations[lang]?.mobileHub || translations.en.mobileHub;
  const [copiedCmd, setCopiedCmd] = useState(false);

  const capacitorCommands = `# 1. Genera build di produzione ottimizzata
npm run build

# 2. Inizializza progetti nativi iOS e Android
npx cap add ios
npx cap add android

# 3. Sincronizza asset e plugin web nel bundle nativo
npx cap sync

# 4. Apri in Xcode (per distribuzione App Store su iOS)
npx cap open ios

# 5. Apri in Android Studio (per file .aab / .apk Google Play)
npx cap open android`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(capacitorCommands);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 3000);
  };

  return (
    <div className="mobile-hub-root">
      {/* Header */}
      <div className="card-panel-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1 className="card-title">
            <Smartphone size={20} color="var(--cds-blue-light)" />
            {t.title}
          </h1>
          <p className="card-subtitle">{t.subtitle}</p>
        </div>

        {/* Device Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--cds-text-muted)" }}>{t.switchDevice}</span>
          <button 
            className={`ibm-btn ibm-btn-sm ${platformMode === "iphone" ? "ibm-btn-primary" : "ibm-btn-secondary"}`}
            onClick={() => setPlatformMode("iphone")}
          >
            <Apple size={14} />
            iPhone 16 Pro
          </button>
          <button 
            className={`ibm-btn ibm-btn-sm ${platformMode === "android" ? "ibm-btn-primary" : "ibm-btn-secondary"}`}
            onClick={() => setPlatformMode("android")}
          >
            <Smartphone size={14} />
            Galaxy S24
          </button>
          <button 
            className={`ibm-btn ibm-btn-sm ${platformMode === "desktop" ? "ibm-btn-primary" : "ibm-btn-secondary"}`}
            onClick={() => setPlatformMode("desktop")}
          >
            {t.deviceDesktop}
          </button>
        </div>
      </div>

      {/* Grid: Global Readiness & App Store Manifests */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {/* Apple App Store Card */}
        <div className="card-panel" style={{ margin: 0, borderTop: "3px solid #ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Apple size={22} color="#ffffff" />
            <div>
              <strong style={{ fontSize: "14px" }}>Apple App Store (iOS / iPadOS)</strong>
              <div style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>Bundle ID: com.ibmfile.enterprise &bull; ibmfile.com</div>
            </div>
          </div>
          <ul style={{ listStyle: "none", fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={14} color="var(--cds-green-light)" />
              <span>Supporto Touch Haptics &amp; FaceID Biometrics</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={14} color="var(--cds-green-light)" />
              <span>Privacy Manifest Apple conforme GDPR / HIPAA</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={14} color="var(--cds-green-light)" />
              <span>Compatibile con iOS 16, 17, 18+ (iPhone &amp; iPad)</span>
            </li>
          </ul>
        </div>

        {/* Google Play Card */}
        <div className="card-panel" style={{ margin: 0, borderTop: "3px solid var(--cds-green-light)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Smartphone size={22} color="var(--cds-green-light)" />
            <div>
              <strong style={{ fontSize: "14px" }}>Google Play Store (Android Enterprise)</strong>
              <div style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>Target SDK 34+ &bull; Architettura AAB</div>
            </div>
          </div>
          <ul style={{ listStyle: "none", fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={14} color="var(--cds-green-light)" />
              <span>Android Enterprise MDM &amp; Knox Security compatibile</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={14} color="var(--cds-green-light)" />
              <span>Biometria Impronta Digitale &amp; Keystore Hardware</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={14} color="var(--cds-green-light)" />
              <span>Distribuzione globale in oltre 170 paesi</span>
            </li>
          </ul>
        </div>

        {/* PWA Offline Card */}
        <div className="card-panel" style={{ margin: 0, borderTop: "3px solid var(--cds-blue)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Globe2 size={22} color="var(--cds-blue-light)" />
            <div>
              <strong style={{ fontSize: "14px" }}>Progressive Web App (PWA)</strong>
              <div style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>Installazione Zero-Store istantanea</div>
            </div>
          </div>
          <ul style={{ listStyle: "none", fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={14} color="var(--cds-green-light)" />
              <span>Icona su Home Screen senza passare dagli store</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={14} color="var(--cds-green-light)" />
              <span>Funzionamento offline con Service Worker e Cache</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={14} color="var(--cds-green-light)" />
              <span>Aggiornamenti continui trasparenti OTA (Over-the-Air)</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Capacitor CLI Instructions & QR Code Card */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
        {/* Terminal Build Commands */}
        <div className="card-panel" style={{ margin: 0 }}>
          <div className="card-panel-header">
            <span className="card-title" style={{ fontSize: "14px" }}>
              <Terminal size={16} color="var(--cds-blue-light)" />
              Comandi di Compilazione Nativa (Capacitor / Cordova)
            </span>
            <button 
              className="ibm-btn ibm-btn-secondary ibm-btn-sm"
              onClick={copyToClipboard}
            >
              <Copy size={13} />
              {copiedCmd ? "Copiato negli appunti!" : "Copia Script"}
            </button>
          </div>

          <div className="sql-editor-container" style={{ margin: 0 }}>
            <pre className="mono" style={{ padding: "14px", fontSize: "12px", color: "var(--cds-green-light)", lineHeight: "1.6", overflowX: "auto" }}>
              {capacitorCommands}
            </pre>
          </div>
        </div>

        {/* Mobile Testing QR Code */}
        <div className="card-panel" style={{ margin: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="card-panel-header">
              <span className="card-title" style={{ fontSize: "14px" }}>
                <QrCode size={16} color="var(--cds-teal)" />
                {t.qrTitle}
              </span>
              <span className="ibm-badge ibm-badge-green">LOCAL NETWORK READY</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--cds-text-secondary)", marginBottom: "16px" }}>
              {t.qrDesc}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px", background: "var(--cds-bg-surface-1)", padding: "16px", borderRadius: "2px" }}>
            {/* SVG High-Tech QR Code Mockup */}
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ background: "#ffffff", padding: "6px", borderRadius: "4px", flexShrink: 0 }}>
              {/* QR Finder patterns */}
              <rect x="5" y="5" width="26" height="26" fill="#000" />
              <rect x="9" y="9" width="18" height="18" fill="#fff" />
              <rect x="13" y="13" width="10" height="10" fill="#000" />

              <rect x="69" y="5" width="26" height="26" fill="#000" />
              <rect x="73" y="9" width="18" height="18" fill="#fff" />
              <rect x="77" y="13" width="10" height="10" fill="#000" />

              <rect x="5" y="69" width="26" height="26" fill="#000" />
              <rect x="9" y="73" width="18" height="18" fill="#fff" />
              <rect x="13" y="77" width="10" height="10" fill="#000" />

              {/* Data modules */}
              <rect x="36" y="8" width="6" height="6" fill="#0f62fe" />
              <rect x="46" y="8" width="6" height="6" fill="#000" />
              <rect x="56" y="16" width="6" height="6" fill="#0f62fe" />
              <rect x="36" y="24" width="6" height="6" fill="#000" />
              <rect x="46" y="32" width="8" height="8" fill="#0f62fe" />
              <rect x="12" y="44" width="6" height="6" fill="#000" />
              <rect x="24" y="44" width="6" height="6" fill="#0f62fe" />
              <rect x="64" y="44" width="8" height="8" fill="#000" />
              <rect x="78" y="44" width="6" height="6" fill="#0f62fe" />
              <rect x="36" y="60" width="8" height="8" fill="#000" />
              <rect x="48" y="68" width="8" height="8" fill="#0f62fe" />
              <rect x="64" y="68" width="6" height="6" fill="#000" />
              <rect x="78" y="76" width="8" height="8" fill="#0f62fe" />
            </svg>

            <div style={{ fontSize: "11px", color: "var(--cds-text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontWeight: 600, color: "var(--cds-text-primary)" }}>Host Locale Attivo:</div>
              <div className="mono" style={{ background: "var(--cds-bg-surface-0)", padding: "4px 8px", border: "1px solid var(--cds-border-subtle)" }}>
                http://localhost:5173
              </div>
              <div>Condividi l'IP LAN aziendale con i team di test iOS e Android per validazione live.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
