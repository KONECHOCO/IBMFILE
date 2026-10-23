import React, { useEffect, useState } from "react";
import { Layers, Search, FolderTree, FileCode, Lock, Database, AlertCircle } from "lucide-react";
import { api } from "../api/gateway";

const PII_PATTERN = /(E_?MAIL|PHONE|TELEF|CELL|TAX|CODICE_?FISC|CODFIS|FISCAL|IBAN|CARD|CARTA|SALARY|SALARIO|STIPEND|PASSWORD|SSN|BIRTH|NASCITA)/i;

export default function UMetadocs({ lang, translations, activeDb }) {
  const tr = translations[lang] || translations.en;
  const t = tr.uMetadocs;
  const u = tr.ui;

  const [schemas, setSchemas] = useState([]);
  const [schema, setSchema] = useState(activeDb?.defaultSchema || "");
  const [tables, setTables] = useState([]);
  const [selected, setSelected] = useState(null);
  const [columns, setColumns] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const describe = (e) => (e.message === "NETWORK" ? u.gatewayUnreachable : e.message);

  useEffect(() => {
    setSchema(activeDb?.defaultSchema || "");
    setSchemas([]);
    if (!activeDb) return;
    api.schemas(activeDb.id).then(setSchemas).catch((e) => setError(describe(e)));
  }, [activeDb?.id]);

  useEffect(() => {
    if (!activeDb || !schema) return;
    setLoading(true);
    setError(null);
    api.tables(activeDb.id, schema)
      // Keep a table the user already picked if it is in the new list (the list may arrive late)
      .then((rows) => { setTables(rows); setSelected((prev) => rows.find((r) => r.name === prev?.name) || rows[0] || null); })
      .catch((e) => { setTables([]); setError(describe(e)); })
      .finally(() => setLoading(false));
  }, [activeDb?.id, schema]);

  useEffect(() => {
    if (!activeDb || !selected) { setColumns([]); return; }
    api.columns(activeDb.id, schema, selected.name).then(setColumns).catch((e) => setError(describe(e)));
  }, [activeDb?.id, schema, selected?.name]);

  if (!activeDb) {
    return <div className="card-panel" style={{ padding: "40px", textAlign: "center" }}>{u.noActiveConnection}</div>;
  }

  const s = search.toLowerCase();
  const filtered = tables.filter((tb) => tb.name.toLowerCase().includes(s) || (tb.description || "").toLowerCase().includes(s));

  return (
    <div className="umetadocs-root">
      <div className="card-panel-header" style={{ marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="card-title">
            <Layers size={20} color="var(--cds-blue-light)" />
            {t.title}
          </h1>
          <p className="card-subtitle">{t.subtitle}</p>
        </div>
        <span className="ibm-badge ibm-badge-blue">
          <Database size={12} style={{ marginRight: "4px" }} />
          {activeDb.name}
        </span>
      </div>

      <div className="card-panel" style={{ padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <FolderTree size={14} /> {t.libraries}
          {schemas.length > 0 ? (
            <select className="select-control mono" value={schema} onChange={(e) => setSchema(e.target.value)}>
              {!schemas.includes(schema) && schema && <option value={schema}>{schema}</option>}
              {schemas.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          ) : (
            <input className="ai-input mono" style={{ width: "140px", padding: "6px 8px" }} defaultValue={schema}
              onBlur={(e) => setSchema(e.target.value.trim())} />
          )}
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "200px" }}>
          <Search size={16} style={{ color: "var(--cds-text-muted)" }} />
          <input className="ai-input" style={{ width: "100%", padding: "6px 10px" }} placeholder={t.searchMeta}
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {error && (
        <div className="ibm-badge ibm-badge-red" style={{ display: "flex", width: "100%", padding: "8px 12px", marginBottom: "12px", borderRadius: "2px", whiteSpace: "normal" }}>
          <AlertCircle size={15} style={{ marginRight: "8px", flexShrink: 0 }} />
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-start" }}>
        <div className="card-panel" style={{ margin: 0, flex: "1 1 240px", minWidth: 0, maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--cds-text-muted)", marginBottom: "8px" }}>
            {t.physicalFiles} {loading ? "…" : `(${filtered.length})`}
          </div>
          {filtered.map((tb) => (
            <button key={tb.name} onClick={() => setSelected(tb)} className="nav-item-btn"
              style={{ width: "100%", textAlign: "left", padding: "6px 8px", borderLeft: `3px solid ${selected?.name === tb.name ? "var(--cds-blue)" : "transparent"}` }}>
              <FileCode size={14} style={{ flexShrink: 0 }} />
              <div className="nav-text-col" style={{ minWidth: 0 }}>
                <span className="mono">{tb.name}</span>
                <span className="nav-desc">{[tb.type, tb.description].filter(Boolean).join(" · ")}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="card-panel" style={{ margin: 0, flex: "3 1 420px", minWidth: 0 }}>
          {selected ? (
            <>
              <div className="card-panel-header">
                <span className="card-title mono" style={{ fontSize: "15px" }}>{schema}.{selected.name}</span>
                <span className="ibm-badge ibm-badge-secondary">{selected.type}</span>
              </div>
              {selected.description && <p style={{ fontSize: "12px", color: "var(--cds-text-secondary)", marginTop: 0 }}>{selected.description}</p>}
              <div className="table-container">
                <table className="ibm-data-table">
                  <thead>
                    <tr>
                      <th>{t.fieldName}</th>
                      <th>{t.dataType}</th>
                      <th>{t.length}</th>
                      <th>{u.nullable}</th>
                      <th>{t.fieldDesc}</th>
                      <th>{t.sensitivity}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((c) => (
                      <tr key={c.name}>
                        <td className="mono" style={{ fontWeight: 600 }}>{c.name}</td>
                        <td className="mono">{c.type}</td>
                        <td className="mono">{c.length ?? ""}{c.scale ? `,${c.scale}` : ""}</td>
                        <td className="mono">{c.nullable}</td>
                        <td style={{ fontSize: "12px" }}>{c.description}</td>
                        <td>{PII_PATTERN.test(c.name) && <span className="ibm-badge ibm-badge-amber"><Lock size={10} style={{ marginRight: "3px" }} />PII</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--cds-text-muted)" }}>{u.noTables}</div>
          )}
        </div>
      </div>
    </div>
  );
}
