import React, { useEffect, useMemo, useState } from "react";
import {
  KeyRound, ShieldCheck, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, Plus, Trash2, Save, Zap, Search, Database,
} from "lucide-react";
import { api } from "../api/gateway";

const EMPTY = { id: null, name: "", driver: "ibmi", host: "", port: 446, database: "", username: "", password: "", ssl: false, options: {} };

function toForm(c) {
  return { ...EMPTY, ...c, password: "", options: { ...(c.options || {}) } };
}

export default function DatabaseSettings({ lang, translations, connections, reloadConnections, activeDb, setActiveDb, user }) {
  const tr = translations[lang] || translations.en;
  const t = tr.dbSettings;
  const u = tr.ui;
  const isAdmin = user?.role === "admin";

  const [drivers, setDrivers] = useState([]);
  const [selectedId, setSelectedId] = useState(activeDb?.id ?? null);
  const [form, setForm] = useState(() => (activeDb ? toForm(activeDb) : { ...EMPTY }));
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(null); // 'test' | 'save' | 'delete'
  const [testResult, setTestResult] = useState(null);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.drivers().then(setDrivers).catch((e) => setNotice({ ok: false, text: e.message }));
  }, []);

  const driver = drivers.find((d) => d.key === form.driver);
  const isNew = !form.id;
  const readOnlyForm = !isAdmin || form.isDemo;

  const select = (c) => {
    setSelectedId(c?.id ?? null);
    setForm(c ? toForm(c) : { ...EMPTY });
    setTestResult(null);
    setNotice(null);
    setShowPassword(false);
  };

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setOpt = (field, value) => setForm((f) => ({ ...f, options: { ...f.options, [field]: value } }));

  const payload = () => {
    const body = {
      name: form.name.trim(), driver: form.driver, host: form.host.trim(), port: form.port ? Number(form.port) : null,
      database: form.database.trim(), username: form.username.trim(), ssl: !!form.ssl, options: form.options,
    };
    // Empty password on an existing connection = keep the one stored in the vault.
    if (form.password || isNew) body.password = form.password;
    return body;
  };

  const handleTest = async () => {
    setBusy("test");
    setTestResult(null);
    try {
      const res = isAdmin && !form.isDemo
        ? await api.testDraft({ ...payload(), existingId: form.id })
        : await api.testConnection(form.id);
      setTestResult(res);
    } catch (e) {
      setTestResult({ success: false, message: e.message === "NETWORK" ? u.gatewayUnreachable : e.message });
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy("save");
    setNotice(null);
    try {
      const saved = isNew ? await api.createConnection(payload()) : await api.updateConnection(form.id, payload());
      await reloadConnections();
      select(saved);
      if (activeDb?.id === saved.id) setActiveDb(saved);
      setNotice({ ok: true, text: u.saved });
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(u.confirmDelete.replace("{name}", form.name))) return;
    setBusy("delete");
    try {
      await api.deleteConnection(form.id);
      const remaining = await reloadConnections();
      if (activeDb?.id === form.id) setActiveDb(remaining[0] || null);
      select(remaining[0] || null);
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    } finally {
      setBusy(null);
    }
  };

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return connections.filter((c) => c.name.toLowerCase().includes(s) || (c.host || "").toLowerCase().includes(s));
  }, [connections, search]);

  const label = { display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" };
  const field = { width: "100%" };

  return (
    <div className="db-settings-root">
      <div className="card-panel-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1 className="card-title">
            <KeyRound size={20} color="var(--cds-blue-light)" />
            {t.title}
          </h1>
          <p className="card-subtitle">{t.subtitle}</p>
        </div>
        {isAdmin && (
          <button className="ibm-btn ibm-btn-primary" onClick={() => select(null)}>
            <Plus size={15} />
            {t.newConnBtn}
          </button>
        )}
      </div>

      <div className="card-panel" style={{ padding: "12px 16px", background: "rgba(15, 98, 254, 0.06)", borderColor: "rgba(15, 98, 254, 0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "var(--cds-blue-light)" }}>
          <ShieldCheck size={18} style={{ flexShrink: 0 }} />
          <strong>{t.vaultNotice}</strong>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-start" }}>
        {/* Connection list */}
        <div className="card-panel" style={{ margin: 0, flex: "1 1 260px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Search size={14} style={{ color: "var(--cds-text-muted)" }} />
            <input className="ai-input" style={{ flex: 1, padding: "6px 10px", fontSize: "12px" }} placeholder={u.searchConnections}
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn-icon" onClick={reloadConnections} title={tr.common.refresh}><RefreshCw size={14} /></button>
          </div>
          {filtered.length === 0 && (
            <div style={{ fontSize: "12px", color: "var(--cds-text-muted)", padding: "12px 0" }}>{u.noConnections}</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {filtered.map((c) => (
              <button key={c.id} onClick={() => select(c)} className="nav-item-btn"
                style={{ textAlign: "left", border: `1px solid ${selectedId === c.id ? "var(--cds-blue)" : "var(--cds-border-subtle)"}`, borderRadius: "2px", padding: "8px 10px", width: "100%" }}>
                <Database size={15} style={{ flexShrink: 0, color: "var(--cds-blue-light)" }} />
                <div className="nav-text-col" style={{ minWidth: 0 }}>
                  <span style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {c.name}
                    {c.isDemo && <span className="ibm-badge ibm-badge-amber" style={{ fontSize: "9px" }}>DEMO</span>}
                    {activeDb?.id === c.id && <span className="ibm-badge ibm-badge-green" style={{ fontSize: "9px" }}>{u.inUse}</span>}
                  </span>
                  <span className="nav-desc mono">{c.driverLabel}{c.host ? ` · ${c.host}` : ""}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Connection form */}
        <form className="card-panel" style={{ margin: 0, flex: "3 1 420px", minWidth: 0 }} onSubmit={handleSave}>
          <div className="card-panel-header">
            <span className="card-title" style={{ fontSize: "15px" }}>{isNew ? u.newConnection : form.name}</span>
            {form.isDemo && <span className="ibm-badge ibm-badge-amber">{u.demoBadge}</span>}
          </div>

          <fieldset disabled={readOnlyForm} style={{ border: 0, padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
            <div>
              <label style={label}>{u.dbType}</label>
              <select className="select-control" style={field} value={form.driver}
                onChange={(e) => {
                  const d = drivers.find((x) => x.key === e.target.value);
                  setForm((f) => ({ ...f, driver: e.target.value, port: d?.defaultPort ?? null }));
                }}>
                {drivers.map((d) => (
                  <option key={d.key} value={d.key} disabled={!d.available}>
                    {d.label}{d.available ? "" : ` — ${u.notInstalled}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>{u.connName}</label>
              <input className="ai-input" style={field} value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            {driver?.usesHost !== false && (
              <>
                <div>
                  <label style={label}>{u.host}</label>
                  <input className="ai-input mono" style={field} value={form.host} onChange={(e) => set("host", e.target.value)}
                    placeholder={u.hostPlaceholder} autoCapitalize="none" required />
                </div>
                <div>
                  <label style={label}>{u.port}</label>
                  <input className="ai-input mono" type="number" style={field} value={form.port ?? ""}
                    onChange={(e) => set("port", e.target.value)} />
                </div>
              </>
            )}
            <div>
              <label style={label}>{u.databaseLabels[form.driver] || driver?.databaseLabel || "Database"}</label>
              <input className="ai-input mono" style={field} value={form.database} onChange={(e) => set("database", e.target.value)} autoCapitalize="none" />
            </div>
            {driver?.usesHost !== false && (
              <>
                <div>
                  <label style={label}>{u.username}</label>
                  <input className="ai-input mono" style={field} value={form.username} onChange={(e) => set("username", e.target.value)}
                    autoComplete="off" autoCapitalize="none" />
                </div>
                <div>
                  <label style={label}>{u.password}</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input className="ai-input mono" style={{ flex: 1 }} type={showPassword ? "text" : "password"} value={form.password}
                      onChange={(e) => set("password", e.target.value)} autoComplete="new-password"
                      placeholder={form.hasPassword ? u.passwordKeep : ""} />
                    <button type="button" className="btn-icon" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </>
            )}
            {form.driver === "ibmi" && (
              <>
                <div>
                  <label style={label}>{u.naming}</label>
                  <select className="select-control" style={field} value={form.options.naming || "sql"} onChange={(e) => setOpt("naming", e.target.value)}>
                    <option value="sql">SQL (SCHEMA.TABLE)</option>
                    <option value="system">System (LIB/FILE)</option>
                  </select>
                </div>
                <div>
                  <label style={label}>CCSID</label>
                  <input className="ai-input mono" style={field} value={form.options.ccsid || ""} placeholder="280"
                    onChange={(e) => setOpt("ccsid", e.target.value)} />
                </div>
              </>
            )}
            {form.driver === "snowflake" && (
              <>
                <div>
                  <label style={label}>Warehouse</label>
                  <input className="ai-input mono" style={field} value={form.options.warehouse || ""} onChange={(e) => setOpt("warehouse", e.target.value)} />
                </div>
                <div>
                  <label style={label}>Role</label>
                  <input className="ai-input mono" style={field} value={form.options.role || ""} onChange={(e) => setOpt("role", e.target.value)} />
                </div>
              </>
            )}
            {driver?.usesHost !== false && (
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", alignSelf: "end" }}>
                <input type="checkbox" checked={!!form.ssl} onChange={(e) => set("ssl", e.target.checked)} />
                {u.useTls}
              </label>
            )}
          </fieldset>

          {driver && (
            <div style={{ fontSize: "11px", color: "var(--cds-text-muted)", marginTop: "12px" }}>
              <ShieldCheck size={12} style={{ verticalAlign: "-2px", marginRight: "4px" }} />
              {u.readOnlyNotes[driver.key] || driver.readOnlyNote}
              {!driver.available && <div style={{ color: "var(--cds-amber)" }}>{driver.unavailableReason}</div>}
            </div>
          )}

          {testResult && (
            <div className="card-panel" style={{ marginTop: "14px", marginBottom: 0, padding: "10px 12px", fontSize: "12px",
              borderColor: testResult.success ? "rgba(36,161,72,0.4)" : "rgba(218,30,40,0.4)",
              background: testResult.success ? "rgba(36,161,72,0.08)" : "rgba(218,30,40,0.08)" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                {testResult.success ? <CheckCircle2 size={16} color="var(--cds-green-light)" /> : <AlertCircle size={16} color="var(--cds-red-light)" />}
                <div style={{ minWidth: 0 }}>
                  {testResult.success ? (
                    <>
                      <strong>{u.testOk.replace("{ms}", testResult.latencyMs)}</strong>
                      <div className="mono" style={{ marginTop: "4px", fontSize: "11px", color: "var(--cds-text-secondary)" }}>
                        {Object.entries(testResult.serverInfo || {}).map(([k, v]) => <div key={k}>{k}: {String(v)}</div>)}
                      </div>
                    </>
                  ) : (
                    <span className="mono" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{testResult.message}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {notice && (
            <div style={{ marginTop: "10px", fontSize: "12px", color: notice.ok ? "var(--cds-green-light)" : "var(--cds-red-light)" }}>{notice.text}</div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--cds-border-subtle)" }}>
            <button type="button" className="ibm-btn ibm-btn-secondary" onClick={handleTest} disabled={!!busy || (isNew && !isAdmin)}>
              <Zap size={14} />
              {busy === "test" ? u.testing : t.testBtn}
            </button>
            {!readOnlyForm && (
              <button type="submit" className="ibm-btn ibm-btn-primary" disabled={!!busy}>
                <Save size={14} />
                {t.saveBtn}
              </button>
            )}
            {!isNew && (
              <button type="button" className="ibm-btn ibm-btn-secondary" onClick={() => setActiveDb(connections.find((c) => c.id === form.id))}
                disabled={activeDb?.id === form.id}>
                <CheckCircle2 size={14} />
                {t.setActiveBtn}
              </button>
            )}
            {!isNew && isAdmin && (
              <button type="button" className="ibm-btn ibm-btn-danger" onClick={handleDelete} disabled={!!busy} style={{ marginLeft: "auto" }}>
                <Trash2 size={14} />
                {t.deleteBtn}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
