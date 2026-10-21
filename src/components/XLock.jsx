import React, { useState } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Radio, 
  Activity, 
  AlertTriangle, 
  Plus, 
  Check, 
  XCircle, 
  Wifi, 
  Cpu, 
  Trash2,
  FileCheck2
} from "lucide-react";
import { MOCK_XLOCK_DATA } from "../data/mockDatabase";

export default function XLock({ lang, translations, onLogActivity }) {
  const t = translations[lang]?.xLock || translations.en.xLock;

  const [ports, setPorts] = useState(MOCK_XLOCK_DATA.ports);
  const [sockets, setSockets] = useState(MOCK_XLOCK_DATA.sockets);
  const [threats, setThreats] = useState(MOCK_XLOCK_DATA.threats);
  const [whitelist, setWhitelist] = useState(MOCK_XLOCK_DATA.whitelistIps);
  const [newIp, setNewIp] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddWhitelist = (e) => {
    e.preventDefault();
    if (!newIp.trim()) return;

    const entry = {
      ip: newIp.trim(),
      label: newLabel.trim() || "Regola Manuale",
      addedBy: "admin_sec",
      status: "ENABLED"
    };

    setWhitelist([...whitelist, entry]);
    setNewIp("");
    setNewLabel("");
    setShowAddModal(false);

    if (onLogActivity) {
      onLogActivity({
        user: "admin_sec",
        role: "Security Officer",
        dbTarget: "X-Lock 446 Guard",
        action: "Regola Modificata",
        statement: `ADDED TO WHITELIST: ${entry.ip} (${entry.label})`,
        rows: 1,
        durationMs: 5,
        piiMasked: true
      });
    }
  };

  const handleRemoveWhitelist = (ip) => {
    setWhitelist(whitelist.filter(item => item.ip !== ip));
  };

  const handleDisconnectSocket = (id) => {
    setSockets(sockets.map(s => s.id === id ? { ...s, state: "DISCONNECTED", throughput: "0 KB/s" } : s));
  };

  return (
    <div className="xlock-root">
      {/* Page Header */}
      <div className="card-panel-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1 className="card-title">
            <ShieldAlert size={20} color="var(--cds-blue-light)" />
            {t.title}
          </h1>
          <p className="card-subtitle">{t.subtitle}</p>
        </div>

        <div className="ibm-badge ibm-badge-green" style={{ padding: "6px 12px", fontSize: "12px" }}>
          <Radio size={14} className="status-dot-green" />
          <span>{t.firewallStatus}</span>
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div className="kpi-grid">
        <div className="kpi-card teal">
          <span className="kpi-label">{t.activeConnections}</span>
          <span className="kpi-value">{sockets.filter(s => s.state === "ESTABLISHED").length} Sockets</span>
          <span className="kpi-subtext">Porta 446 &amp; DB Gateway</span>
        </div>

        <div className="kpi-card green">
          <span className="kpi-label">{t.blockedThreats}</span>
          <span className="kpi-value">{threats.length} Minacce</span>
          <span className="kpi-subtext">0 False Positive / 100% Drop</span>
        </div>

        <div className="kpi-card magenta">
          <span className="kpi-label">{t.avgLatency}</span>
          <span className="kpi-value">1.4 ms</span>
          <span className="kpi-subtext">IBM Power10 DRDA Pipeline</span>
        </div>

        <div className="kpi-card amber">
          <span className="kpi-label">{t.complianceScore}</span>
          <span className="kpi-value">99.8%</span>
          <span className="kpi-subtext">GDPR Art. 32 &amp; SOX 404</span>
        </div>
      </div>

      {/* SECTION 1: PROTECTED PORTS STATUS */}
      <div className="card-panel">
        <div className="card-panel-header">
          <span className="card-title" style={{ fontSize: "14px" }}>
            <Cpu size={16} color="var(--cds-blue-light)" />
            Stato Porte DRDA &amp; Gateway Database Protetto
          </span>
          <span className="ibm-badge ibm-badge-blue">TLS 1.3 ENFORCED</span>
        </div>

        <div className="table-container">
          <table className="ibm-data-table">
            <thead>
              <tr>
                <th>Porta</th>
                <th>Servizio / Protocollo</th>
                <th>Stato Protezione</th>
                <th>Criterio di Sicurezza</th>
                <th>Limitazione Frequenza</th>
              </tr>
            </thead>
            <tbody>
              {ports.map(p => (
                <tr key={p.port}>
                  <td>
                    <span className="mono" style={{ fontWeight: 700, color: "var(--cds-blue-light)" }}>
                      :{p.port}
                    </span>
                  </td>
                  <td>{p.service}</td>
                  <td>
                    <span className="ibm-badge ibm-badge-green">
                      <ShieldCheck size={12} />
                      {p.status}
                    </span>
                  </td>
                  <td>{p.policy}</td>
                  <td className="mono">{p.rateLimit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: LIVE SOCKET INSPECTION */}
      <div className="card-panel">
        <div className="card-panel-header">
          <span className="card-title" style={{ fontSize: "14px" }}>
            <Activity size={16} color="var(--cds-green-light)" />
            {t.liveTraffic}
          </span>
          <span className="mono" style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>
            Aggiornamento continuo &bull; Interfaccia DRDA
          </span>
        </div>

        <div className="table-container">
          <table className="ibm-data-table">
            <thead>
              <tr>
                <th>{t.remoteIp}</th>
                <th>{t.port}</th>
                <th>{t.protocol}</th>
                <th>{t.userLogged}</th>
                <th>Origine / Rete</th>
                <th>Throughput</th>
                <th>Latenza</th>
                <th>{t.statusCol}</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {sockets.map(s => (
                <tr key={s.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>{s.ip}</td>
                  <td className="mono">:{s.port}</td>
                  <td>{s.protocol}</td>
                  <td className="mono">{s.user}</td>
                  <td>{s.origin}</td>
                  <td className="mono">{s.throughput}</td>
                  <td className="mono" style={{ color: "var(--cds-green-light)" }}>{s.latency}</td>
                  <td>
                    <span className={`ibm-badge ${s.state === "ESTABLISHED" ? "ibm-badge-green" : "ibm-badge-red"}`}>
                      {s.state}
                    </span>
                  </td>
                  <td>
                    {s.state === "ESTABLISHED" ? (
                      <button 
                        className="ibm-btn ibm-btn-danger ibm-btn-sm"
                        onClick={() => handleDisconnectSocket(s.id)}
                      >
                        Interrompi
                      </button>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>Disconnesso</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: THREAT DETECTION & IP WHITELIST */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
        {/* Threat Alert Panel */}
        <div className="card-panel" style={{ margin: 0 }}>
          <div className="card-panel-header">
            <span className="card-title" style={{ fontSize: "14px" }}>
              <AlertTriangle size={16} color="var(--cds-red-light)" />
              {t.threatAlertTitle}
            </span>
            <span className="ibm-badge ibm-badge-red">ALERT ACTIVE</span>
          </div>

          <p style={{ fontSize: "12px", color: "var(--cds-text-secondary)", marginBottom: "14px" }}>
            {t.threatDescription}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {threats.map(thr => (
              <div 
                key={thr.id} 
                style={{ 
                  background: "rgba(218, 30, 40, 0.08)", 
                  border: "1px solid rgba(218, 30, 40, 0.3)", 
                  padding: "10px 12px", 
                  borderRadius: "2px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <strong style={{ color: "var(--cds-red-light)" }}>{thr.threatType}</strong>
                  <span className="mono" style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>{thr.timestamp}</span>
                </div>
                <div style={{ fontSize: "11px", display: "flex", justifyContent: "space-between" }}>
                  <span className="mono">Host: {thr.sourceIp}:{thr.targetPort}</span>
                  <span className="ibm-badge ibm-badge-red" style={{ fontSize: "10px" }}>{thr.severity}</span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--cds-text-primary)", fontWeight: 500 }}>
                  Esito: {thr.action}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Authorized IP Whitelist */}
        <div className="card-panel" style={{ margin: 0 }}>
          <div className="card-panel-header">
            <span className="card-title" style={{ fontSize: "14px" }}>
              <ShieldCheck size={16} color="var(--cds-blue-light)" />
              {t.ipWhitelist}
            </span>
            <button 
              className="ibm-btn ibm-btn-primary ibm-btn-sm"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={13} />
              {t.addIp}
            </button>
          </div>

          {showAddModal && (
            <form onSubmit={handleAddWhitelist} style={{ background: "var(--cds-bg-surface-1)", padding: "12px", marginBottom: "14px", border: "1px solid var(--cds-border-strong)" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input 
                  type="text" 
                  className="ai-input" 
                  placeholder="IP o Subnet (Es: 192.168.1.0/24)"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  style={{ flex: 1, padding: "6px 8px" }}
                />
                <input 
                  type="text" 
                  className="ai-input" 
                  placeholder="Etichetta / Descrizione"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  style={{ flex: 1, padding: "6px 8px" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                <button type="button" className="ibm-btn ibm-btn-secondary ibm-btn-sm" onClick={() => setShowAddModal(false)}>
                  Annulla
                </button>
                <button type="submit" className="ibm-btn ibm-btn-primary ibm-btn-sm">
                  Salva Regola
                </button>
              </div>
            </form>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {whitelist.map((w, i) => (
              <div 
                key={i} 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  background: "var(--cds-bg-surface-1)",
                  padding: "10px 14px",
                  border: "1px solid var(--cds-border-subtle)",
                  borderRadius: "2px"
                }}
              >
                <div>
                  <div className="mono" style={{ fontWeight: 600, fontSize: "13px" }}>{w.ip}</div>
                  <div style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>{w.label} &bull; Aut: {w.addedBy}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="ibm-badge ibm-badge-green" style={{ fontSize: "10px" }}>{w.status}</span>
                  <button 
                    className="btn-icon" 
                    style={{ width: "26px", height: "26px" }}
                    onClick={() => handleRemoveWhitelist(w.ip)}
                    title="Elimina Regola"
                  >
                    <Trash2 size={12} color="var(--cds-red-light)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
