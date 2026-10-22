import React, { useEffect, useState } from "react";
import { FileCheck2, Search, ShieldCheck, ShieldAlert, FileSpreadsheet, FileText, RefreshCw } from "lucide-react";
import { api } from "../api/gateway";
import { exportToCsv, exportToExcel } from "../utils/exportUtils";

const STATUS_BADGE = { OK: "ibm-badge-blue", BLOCKED: "ibm-badge-red", DENIED: "ibm-badge-red", ERROR: "ibm-badge-amber" };

export default function ActivityLog({ lang, translations, user }) {
  const tr = translations[lang] || translations.en;
  const t = tr.activityLog;
  const u = tr.ui;
  const isAdmin = user?.role === "admin";

  const [logs, setLogs] = useState([]);
  const [verify, setVerify] = useState(null);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setLogs(await api.audit(1000));
      if (isAdmin) setVerify(await api.verifyAudit());
    } catch (e) {
      setError(e.message === "NETWORK" ? u.gatewayUnreachable : e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const s = search.toLowerCase();
  const filtered = logs.filter((e) =>
    (status === "ALL" || e.status === status) &&
    (!s || [e.username, e.statement, e.connection_name, e.action, e.client_ip].some((v) => (v || "").toLowerCase().includes(s))));

  const exportRows = filtered.map((e) => ({
    seq: e.seq, timestamp: e.ts, user: e.username, role: e.role, connection: e.connection_name, action: e.action,
    status: e.status, statement: e.statement, rows: e.rows, duration_ms: e.duration_ms, ip: e.client_ip, hash: e.hash,
  }));

  return (
    <div className="activity-log-root">
      <div className="card-panel-header" style={{ marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="card-title">
            <FileCheck2 size={20} color="var(--cds-blue-light)" />
            {t.title}
          </h1>
          <p className="card-subtitle">{t.subtitle}</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <button className="ibm-btn ibm-btn-secondary ibm-btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} />
            {tr.common.refresh}
          </button>
          <button className="ibm-btn ibm-btn-secondary ibm-btn-sm" disabled={!filtered.length}
            onClick={() => exportToExcel(exportRows, "plexa_audit.xls", "Plexa DB — Audit")}>
            <FileSpreadsheet size={14} color="var(--cds-green-light)" />
            Excel
          </button>
          <button className="ibm-btn ibm-btn-secondary ibm-btn-sm" disabled={!filtered.length} onClick={() => exportToCsv(exportRows, "plexa_audit.csv")}>
            <FileText size={14} color="var(--cds-blue-light)" />
            CSV
          </button>
        </div>
      </div>

      {verify && (
        <div className="card-panel" style={{ padding: "12px 16px",
          background: verify.valid ? "rgba(36, 161, 72, 0.08)" : "rgba(218, 30, 40, 0.08)",
          borderColor: verify.valid ? "rgba(36, 161, 72, 0.3)" : "rgba(218, 30, 40, 0.4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: verify.valid ? "var(--cds-green-light)" : "var(--cds-red-light)" }}>
            {verify.valid ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
            <strong>
              {verify.valid
                ? `${t.hashVerified} — ${u.auditChecked.replace("{n}", verify.checked)}`
                : u.auditBroken.replace("{seq}", verify.broken_at)}
            </strong>
          </div>
        </div>
      )}

      {error && <div className="ibm-badge ibm-badge-red" style={{ display: "flex", width: "100%", padding: "8px 12px", marginBottom: "12px", whiteSpace: "normal" }}>{error}</div>}

      <div className="card-panel" style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "220px" }}>
            <Search size={15} style={{ color: "var(--cds-text-muted)" }} />
            <input className="ai-input" placeholder={u.auditSearch} value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", fontSize: "12px" }} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--cds-text-muted)" }}>
            {t.filterByAction}:
            <select className="select-control" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">{t.allActions}</option>
              <option value="OK">OK</option>
              <option value="BLOCKED">{u.statusBlocked}</option>
              <option value="ERROR">{u.statusError}</option>
              <option value="DENIED">{u.statusDenied}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="card-panel">
        <div className="table-container">
          <table className="ibm-data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{tr.common.timestamp}</th>
                <th>{tr.common.user}</th>
                <th>{tr.common.database}</th>
                <th>{u.event}</th>
                <th>{u.statement}</th>
                <th>{tr.common.rows}</th>
                <th>{tr.common.duration}</th>
                <th>IP</th>
                <th>SHA-256</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: "center", color: "var(--cds-text-muted)", padding: "24px" }}>{loading ? "…" : u.auditEmpty}</td></tr>
              )}
              {filtered.map((e) => (
                <tr key={e.seq}>
                  <td className="mono" style={{ color: "var(--cds-blue-light)", fontWeight: 600 }}>{e.seq}</td>
                  <td className="mono" style={{ fontSize: "11px", color: "var(--cds-text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(e.ts).toLocaleString(lang)}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong style={{ fontSize: "12px" }}>{e.username}</strong>
                      <span style={{ fontSize: "10px", color: "var(--cds-text-muted)" }}>{e.role}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: "12px" }}>{e.connection_name || "—"}</td>
                  <td><span className={`ibm-badge ${STATUS_BADGE[e.status] || "ibm-badge-secondary"}`}>{u.actions[e.action] || e.action}</span></td>
                  <td>
                    <div className="mono" style={{ fontSize: "11px", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.statement || ""}>
                      {e.statement}
                    </div>
                  </td>
                  <td className="mono" style={{ textAlign: "right" }}>{e.rows}</td>
                  <td className="mono">{e.duration_ms} ms</td>
                  <td className="mono" style={{ fontSize: "11px" }}>{e.client_ip}</td>
                  <td className="mono" style={{ fontSize: "10px", color: "var(--cds-text-muted)" }} title={e.hash}>
                    {e.hash.slice(0, 8)}…{e.hash.slice(-6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
