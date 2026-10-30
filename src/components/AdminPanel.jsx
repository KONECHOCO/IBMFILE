import React, { useEffect, useState } from "react";
import { Settings2, Users, KeyRound, Server, Copy, Check, Trash2, UserPlus, RefreshCw, ShieldCheck, ShieldAlert, Smartphone, AlertTriangle } from "lucide-react";
import QRCode from "qrcode";
import { api } from "../api/gateway";
import { StorePlans, trialDaysLeft } from "./StorePlans";

const ROLES = ["admin", "analyst", "viewer"];

function Notice({ notice }) {
  if (!notice) return null;
  return (
    <div className={`ibm-badge ${notice.ok ? "ibm-badge-green" : "ibm-badge-red"}`}
      style={{ display: "flex", width: "100%", padding: "8px 12px", margin: "12px 0", borderRadius: "2px", whiteSpace: "normal" }}>
      {notice.text}
    </div>
  );
}

function CopyButton({ text, label }) {
  const [done, setDone] = useState(false);
  return (
    <button className="ibm-btn ibm-btn-secondary ibm-btn-sm" onClick={async () => {
      try {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      } catch {
        window.prompt("", text);
      }
    }}>
      {done ? <Check size={14} /> : <Copy size={14} />}
      {label}
    </button>
  );
}

function UsersTab({ u, me }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "analyst" });
  const [notice, setNotice] = useState(null);

  const load = () => api.users().then(setUsers).catch((e) => setNotice({ ok: false, text: e.message }));
  useEffect(() => { load(); }, []);

  const run = async (fn, okText) => {
    setNotice(null);
    try {
      await fn();
      if (okText) setNotice({ ok: true, text: okText });
      load();
    } catch (e) {
      setNotice({ ok: false, text: e.message });
    }
  };

  const add = (e) => {
    e.preventDefault();
    run(async () => {
      await api.createUser(form);
      setForm({ username: "", password: "", role: "analyst" });
    }, u.userCreated);
  };

  const resetPassword = (usr) => {
    const pw = window.prompt(u.newPasswordFor.replace("{name}", usr.username));
    if (pw) run(() => api.updateUser(usr.id, { password: pw }), u.passwordChanged);
  };

  const remove = (usr) => {
    if (window.confirm(u.confirmDeleteUser.replace("{name}", usr.username))) run(() => api.deleteUser(usr.id), u.userDeleted);
  };

  return (
    <div>
      <form onSubmit={add} style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "flex-end", marginBottom: "12px" }}>
        <div style={{ flex: "1 1 160px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>{u.username}</label>
          <input className="ai-input" style={{ width: "100%" }} value={form.username} required minLength={3} autoCapitalize="none"
            onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>
        <div style={{ flex: "1 1 160px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>{u.password}</label>
          <input className="ai-input" type="password" style={{ width: "100%" }} value={form.password} required minLength={8} autoComplete="new-password"
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div style={{ flex: "0 1 150px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>{u.role}</label>
          <select className="select-control" style={{ width: "100%" }} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{u.roles[r]}</option>)}
          </select>
        </div>
        <button type="submit" className="ibm-btn ibm-btn-primary">
          <UserPlus size={14} />
          {u.addUser}
        </button>
      </form>
      <div style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>{u.rolesHelp}</div>
      <Notice notice={notice} />
      <div className="table-container">
        <table className="ibm-data-table">
          <thead>
            <tr><th>{u.username}</th><th>{u.role}</th><th>{u.createdAt}</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((usr) => (
              <tr key={usr.id}>
                <td className="mono" style={{ fontWeight: 600 }}>{usr.username}{usr.id === me.id ? ` (${u.you})` : ""}</td>
                <td>
                  <select className="select-control" value={usr.role} disabled={usr.id === me.id}
                    onChange={(e) => run(() => api.updateUser(usr.id, { role: e.target.value }), u.roleChanged)}>
                    {ROLES.map((r) => <option key={r} value={r}>{u.roles[r]}</option>)}
                  </select>
                </td>
                <td className="mono" style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>{usr.created_at?.slice(0, 10)}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="ibm-btn ibm-btn-secondary ibm-btn-sm" onClick={() => resetPassword(usr)}>
                    <KeyRound size={13} />
                    {u.resetPassword}
                  </button>{" "}
                  {usr.id !== me.id && (
                    <button className="ibm-btn ibm-btn-danger ibm-btn-sm" onClick={() => remove(usr)}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LicenseTab({ u, info, reload }) {
  const [key, setKey] = useState("");
  const [notice, setNotice] = useState(null);
  const lic = info?.license;
  if (!lic) return null;

  const activate = async (e) => {
    e.preventDefault();
    setNotice(null);
    try {
      await api.activateLicense(key.trim());
      setKey("");
      setNotice({ ok: true, text: u.licenseActivated });
      reload();
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    }
  };

  const remove = async () => {
    if (!window.confirm(u.confirmRemoveLicense)) return;
    await api.removeLicense();
    reload();
  };

  const limit = (n) => (n === null || n === undefined ? u.unlimited : n);

  if (lic.store) {
    const days = lic.plan === "trial" ? trialDaysLeft(lic.expires) : null;
    return (
      <div>
        <table className="ibm-data-table" style={{ marginBottom: "16px" }}>
          <tbody>
            <tr><td style={{ width: "40%", color: "var(--cds-text-muted)" }}>{u.plan}</td><td>{u.store.plans[lic.plan] || lic.plan}{days !== null ? ` · ${u.store.trialDays.replace("{n}", days)}` : ""}</td></tr>
            <tr><td style={{ color: "var(--cds-text-muted)" }}>{u.usersLimit}</td><td className="mono">{info.users} / {limit(lic.maxUsers)}</td></tr>
            <tr><td style={{ color: "var(--cds-text-muted)" }}>{u.connectionsLimit}</td><td className="mono">{info.connections} / {limit(lic.maxConnections)}</td></tr>
          </tbody>
        </table>
        <StorePlans u={u} license={lic} />
        <p style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>{u.store.manage}</p>
      </div>
    );
  }

  const rows = [
    [u.plan, lic.valid ? lic.plan : "community"],
    [u.customer, lic.customer || "—"],
    [u.expires, lic.expires || (lic.valid ? u.never : "—")],
    [u.usersLimit, `${info.users} / ${limit(lic.maxUsers)}`],
    [u.connectionsLimit, `${info.connections} / ${limit(lic.maxConnections)}`],
    [u.licenseId, lic.licenseId || "—"],
  ];

  return (
    <div>
      <div className="card-panel" style={{ margin: "0 0 12px", padding: "12px 16px" }}>
        <div style={{ fontSize: "12px", color: "var(--cds-text-muted)", marginBottom: "6px" }}>{u.gatewayIdHelp}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          <strong className="mono" style={{ fontSize: "16px" }}>{info.gatewayId}</strong>
          <CopyButton text={info.gatewayId} label={u.copy} />
        </div>
      </div>

      {lic.problem && <Notice notice={{ ok: false, text: lic.problem }} />}

      <table className="ibm-data-table" style={{ marginBottom: "16px" }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}><td style={{ width: "40%", color: "var(--cds-text-muted)" }}>{k}</td><td className="mono">{v}</td></tr>
          ))}
        </tbody>
      </table>

      <form onSubmit={activate}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>{u.licenseKey}</label>
        <textarea className="ai-input mono" rows={3} style={{ width: "100%", fontSize: "11px" }} value={key}
          onChange={(e) => setKey(e.target.value)} placeholder="PLEXA1.…" required />
        <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
          <button type="submit" className="ibm-btn ibm-btn-primary"><KeyRound size={14} />{u.activateLicense}</button>
          {lic.valid && <button type="button" className="ibm-btn ibm-btn-secondary" onClick={remove}>{u.removeLicense}</button>}
        </div>
      </form>
      <Notice notice={notice} />
    </div>
  );
}

function DevicesTab({ u, info }) {
  const urls = info?.gatewayUrls || [];
  const [url, setUrl] = useState(urls[0] || "");
  const [qr, setQr] = useState(null);

  useEffect(() => {
    if (!url.trim()) { setQr(null); return; }
    // The QR holds the plain gateway URL: the Plexa DB app reads it, and a phone camera
    // opens the same address in the browser (web version) when the app is not installed.
    QRCode.toDataURL(url.trim(), { margin: 2, width: 260, errorCorrectionLevel: "M" }).then(setQr).catch(() => setQr(null));
  }, [url]);

  if (!info) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 280px", minWidth: 0 }}>
        <p style={{ fontSize: "12px", color: "var(--cds-text-secondary)", marginTop: 0 }}>{u.devicesIntro}</p>
        {!info.listensOnNetwork && (
          <div className="card-panel" style={{ padding: "10px 12px", fontSize: "12px", background: "rgba(241, 194, 27, 0.08)", borderColor: "rgba(241, 194, 27, 0.35)" }}>
            <AlertTriangle size={14} style={{ verticalAlign: "-2px", marginRight: "6px", color: "var(--cds-amber)" }} />
            {u.localOnlyWarning} <code className="mono">PLEXA_HOST=0.0.0.0</code>
          </div>
        )}
        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, margin: "8px 0 4px" }}>{u.gatewayAddressForDevices}</label>
        {urls.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
            {urls.map((x) => (
              <button key={x} className={`ibm-badge ${x === url ? "ibm-badge-blue" : "ibm-badge-secondary"}`} style={{ cursor: "pointer", padding: "4px 8px" }}
                onClick={() => setUrl(x)}>{x}</button>
            ))}
          </div>
        )}
        <input className="ai-input mono" style={{ width: "100%" }} value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="http://192.168.1.20:8787" autoCapitalize="none" />
        <div style={{ fontSize: "11px", color: "var(--cds-text-muted)", marginTop: "6px" }}>{u.devicesUrlHelp}</div>
        <ol style={{ fontSize: "12px", color: "var(--cds-text-secondary)", paddingLeft: "18px" }}>
          <li>{u.devicesStep1}</li>
          <li>{u.devicesStep2}</li>
          <li>{u.devicesStep3}</li>
        </ol>
      </div>
      {qr && (
        <div style={{ textAlign: "center" }}>
          <img src={qr} alt={url} width={260} height={260} style={{ background: "#fff", borderRadius: "4px" }} />
          <div className="mono" style={{ fontSize: "11px", marginTop: "6px", wordBreak: "break-all", maxWidth: "260px" }}>{url}</div>
          <div style={{ marginTop: "8px" }}><CopyButton text={url} label={u.copy} /></div>
        </div>
      )}
    </div>
  );
}

function SystemTab({ u, info }) {
  if (!info) return null;
  const supportInfo = JSON.stringify({
    gatewayId: info.gatewayId, version: info.version, plan: info.license.plan, licenseId: info.license.licenseId,
    licenseProblem: info.license.problem, users: info.users, connections: info.connections, ibmiReady: info.ibmiReady,
    drivers: info.drivers.filter((d) => d.available).map((d) => d.key), auditValid: info.audit.valid,
  }, null, 2);

  return (
    <div>
      <table className="ibm-data-table" style={{ marginBottom: "16px" }}>
        <tbody>
          <tr><td style={{ width: "40%", color: "var(--cds-text-muted)" }}>{u.version}</td><td className="mono">{info.product} {info.version}</td></tr>
          <tr><td style={{ color: "var(--cds-text-muted)" }}>Gateway ID</td><td className="mono">{info.gatewayId}</td></tr>
          <tr><td style={{ color: "var(--cds-text-muted)" }}>IBM i (Java + JT400)</td>
            <td>{info.ibmiReady ? <span className="ibm-badge ibm-badge-green">OK</span> : <span className="ibm-badge ibm-badge-red">{info.ibmiProblem}</span>}</td></tr>
          <tr><td style={{ color: "var(--cds-text-muted)" }}>{u.drivers}</td>
            <td style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {info.drivers.map((d) => (
                <span key={d.key} className={`ibm-badge ${d.available ? "ibm-badge-blue" : "ibm-badge-secondary"}`} title={d.label}>
                  {d.key}{d.available ? "" : " ✕"}
                </span>
              ))}
            </td></tr>
          <tr><td style={{ color: "var(--cds-text-muted)" }}>Audit</td>
            <td>{info.audit.valid
              ? <span style={{ color: "var(--cds-green-light)" }}><ShieldCheck size={13} style={{ verticalAlign: "-2px" }} /> {u.auditChecked.replace("{n}", info.audit.checked)}</span>
              : <span style={{ color: "var(--cds-red-light)" }}><ShieldAlert size={13} style={{ verticalAlign: "-2px" }} /> {u.auditBroken.replace("{seq}", info.audit.broken_at)}</span>}
            </td></tr>
        </tbody>
      </table>

      <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>{u.supportTitle}</div>
      <p style={{ fontSize: "12px", color: "var(--cds-text-secondary)", marginTop: 0 }}>{u.supportText}</p>
      <pre className="mono" style={{ fontSize: "11px", background: "var(--cds-bg-surface-0)", padding: "10px", border: "1px solid var(--cds-border-subtle)", overflowX: "auto" }}>{supportInfo}</pre>
      <CopyButton text={supportInfo} label={u.copySupportInfo} />
      <p style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>{u.lockedOutHelp}</p>
      <pre className="mono" style={{ fontSize: "11px", background: "var(--cds-bg-surface-0)", padding: "10px", border: "1px solid var(--cds-border-subtle)", overflowX: "auto" }}>
        {".venv\\Scripts\\python -m plexa_gateway.cli reset-password USERNAME"}
      </pre>
    </div>
  );
}

export default function AdminPanel({ lang, translations, user }) {
  const u = (translations[lang] || translations.en).ui;
  const [tab, setTab] = useState("users");
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  const reload = () => api.system().then(setInfo).catch((e) => setError(e.message));
  useEffect(() => { reload(); }, []);

  const tabs = [["users", Users, u.adminUsers], ["devices", Smartphone, u.adminDevices], ["license", KeyRound, u.adminLicense], ["system", Server, u.adminSystem]];

  return (
    <div>
      <div className="card-panel-header" style={{ marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="card-title">
            <Settings2 size={20} color="var(--cds-blue-light)" />
            {u.adminTitle}
          </h1>
          <p className="card-subtitle">{u.adminSubtitle}</p>
        </div>
        <button className="ibm-btn ibm-btn-secondary ibm-btn-sm" onClick={reload}><RefreshCw size={14} />{translations[lang].common.refresh}</button>
      </div>
      {error && <Notice notice={{ ok: false, text: error }} />}
      <div className="card-panel">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", borderBottom: "1px solid var(--cds-border-subtle)", paddingBottom: "12px", marginBottom: "16px" }}>
          {tabs.map(([id, Icon, label]) => (
            <button key={id} className={`ibm-btn ${tab === id ? "ibm-btn-primary" : "ibm-btn-secondary"} ibm-btn-sm`} onClick={() => setTab(id)}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        {tab === "users" && <UsersTab u={u} me={user} />}
        {tab === "devices" && <DevicesTab key={(info?.gatewayUrls || []).join()} u={u} info={info} />}
        {tab === "license" && <LicenseTab u={u} info={info} reload={reload} />}
        {tab === "system" && <SystemTab u={u} info={info} />}
      </div>
    </div>
  );
}
