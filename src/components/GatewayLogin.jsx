import React, { useEffect, useState } from "react";
import { Server, LogIn, ShieldCheck, AlertCircle, Globe, PlayCircle, QrCode } from "lucide-react";
import { canScanQr, scanGatewayUrl } from "../native/scanner";
import { api, getSession, setAuth, setGatewayUrl } from "../api/gateway";
import { BRAND } from "../config/brand";
import BrandMark from "./BrandMark";

const LANGS = [
  ["it", "Italiano"], ["en", "English"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"], ["ja", "日本語"],
];

export default function GatewayLogin({ lang, setLang, translations, onLoggedIn }) {
  const u = (translations[lang] || translations.en).ui;
  const [baseUrl, setBaseUrl] = useState(getSession().baseUrl || "");
  const [health, setHealth] = useState(null);
  const [checking, setChecking] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const describe = (e) => (e.message === "NETWORK" ? u.gatewayUnreachable : e.message);

  const checkGateway = async (url) => {
    setChecking(true);
    setError(null);
    try {
      const h = await api.health(url.trim().replace(/\/+$/, ""));
      setGatewayUrl(url);
      setHealth(h);
    } catch (e) {
      setHealth(null);
      setError(describe(e));
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkGateway(baseUrl);
    // Only on first render: later checks are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (action) => {
    setBusy(true);
    setError(null);
    try {
      const res = await action();
      setAuth(res.token, res.user);
      onLoggedIn(res.user);
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    signIn(() => (health?.setupRequired ? api.setup(username, password, setupCode) : api.login(username, password)));
  };

  const enterDemo = () => signIn(() => api.login(health.demoCredentials.username, health.demoCredentials.password));

  const scanQr = async () => {
    setError(null);
    try {
      const url = await scanGatewayUrl(u.scanInstructions);
      if (url === null) return setError(u.qrNotGateway);
      setBaseUrl(url);
      checkGateway(url);
    } catch (e) {
      // Cancelling the scanner rejects too: only report real failures.
      if (!/cancel/i.test(String(e?.message || e))) setError(String(e?.message || e));
    }
  };

  const tryPublicDemo = () => {
    setBaseUrl(BRAND.demoGatewayUrl);
    checkGateway(BRAND.demoGatewayUrl);
  };

  const label = { display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "var(--cds-bg-body)" }}>
      <div className="card-panel" style={{ width: "100%", maxWidth: "420px", margin: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BrandMark size={36} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "18px" }}>{BRAND.name}</div>
              <div style={{ fontSize: "12px", color: "var(--cds-text-muted)" }}>{u.loginTagline}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Globe size={14} style={{ color: "var(--cds-text-muted)" }} />
            <select className="select-control" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
              {LANGS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </div>
        </div>

        <label style={label}>
          <Server size={12} style={{ verticalAlign: "-2px", marginRight: "4px" }} />
          {u.gatewayUrl}
        </label>
        <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
          <input
            className="ai-input mono"
            style={{ flex: 1 }}
            placeholder={u.gatewayUrlPlaceholder}
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
          />
          <button type="button" className="ibm-btn ibm-btn-secondary ibm-btn-sm" onClick={() => checkGateway(baseUrl)} disabled={checking}>
            {checking ? "…" : u.check}
          </button>
        </div>
        {canScanQr() && (
          <button type="button" className="ibm-btn ibm-btn-secondary ibm-btn-sm" style={{ width: "100%", justifyContent: "center", marginBottom: "6px" }} onClick={scanQr}>
            <QrCode size={14} />
            {u.scanGatewayQr}
          </button>
        )}
        <div style={{ fontSize: "11px", color: "var(--cds-text-muted)", marginBottom: "16px" }}>
          {health ? (
            <span style={{ color: "var(--cds-green-light)" }}>
              <ShieldCheck size={12} style={{ verticalAlign: "-2px" }} /> {health.product} {health.version}
            </span>
          ) : checking ? u.testing : u.gatewayHelp}
        </div>

        {health?.publicDemo && health.demoCredentials && (
          <div className="card-panel" style={{ padding: "12px", fontSize: "12px", background: "rgba(36, 161, 72, 0.08)", borderColor: "rgba(36, 161, 72, 0.35)" }}>
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>{u.publicDemoTitle}</div>
            <div style={{ color: "var(--cds-text-secondary)", marginBottom: "10px" }}>
              {u.publicDemoText}{" "}
              <span className="mono">{health.demoCredentials.username} / {health.demoCredentials.password}</span>
            </div>
            <button type="button" className="ibm-btn ibm-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={enterDemo} disabled={busy}>
              <PlayCircle size={15} />
              {u.enterDemo}
            </button>
          </div>
        )}

        {health && (
          <form onSubmit={submit}>
            {health.setupRequired && (
              <div className="card-panel" style={{ padding: "10px 12px", fontSize: "12px", background: "rgba(15, 98, 254, 0.06)", borderColor: "rgba(15, 98, 254, 0.3)" }}>
                {u.setupIntro}
              </div>
            )}
            <label style={label}>{u.username}</label>
            <input className="ai-input" style={{ width: "100%", marginBottom: "12px" }} value={username}
              onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" required minLength={3} />
            <label style={label}>{u.password}</label>
            <input className="ai-input" type="password" style={{ width: "100%", marginBottom: "12px" }} value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete={health.setupRequired ? "new-password" : "current-password"}
              required minLength={8} />
            {health.setupRequired && (
              <>
                <label style={label}>{u.setupCode}</label>
                <input className="ai-input mono" style={{ width: "100%", marginBottom: "12px" }} value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value)} inputMode="numeric" required />
              </>
            )}
            <button type="submit" className="ibm-btn ibm-btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy}>
              <LogIn size={15} />
              {health.setupRequired ? u.createAdmin : u.signIn}
            </button>
          </form>
        )}

        {!health?.publicDemo && baseUrl.replace(/\/+$/, "") !== BRAND.demoGatewayUrl && (
          <button type="button" className="ibm-btn ibm-btn-secondary ibm-btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: "12px" }}
            onClick={tryPublicDemo} disabled={checking}>
            <PlayCircle size={14} />
            {u.tryPublicDemo}
          </button>
        )}

        {error && (
          <div className="ibm-badge ibm-badge-red" style={{ display: "flex", width: "100%", padding: "8px 12px", marginTop: "12px", borderRadius: "2px", whiteSpace: "normal" }}>
            <AlertCircle size={15} style={{ marginRight: "8px", flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
