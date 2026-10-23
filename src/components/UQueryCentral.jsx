import React, { useEffect, useMemo, useState } from "react";
import {
  Play, BookOpen, Table as TableIcon, BarChart3, Download, FileSpreadsheet, FileText, Code2, ShieldAlert, CheckCircle2,
  Search, Database, Lock, Unlock, Zap, AlertTriangle,
} from "lucide-react";
import { api, toRecords } from "../api/gateway";
import { exportToCsv, exportToJson, exportToExcel } from "../utils/exportUtils";
import { queryExamples } from "../data/queryExamples";
import { trackAdAction } from "../services/monetization";

// Column names that usually hold personal data. Masking is visual only;
// real data protection comes from the database user's grants.
const PII_PATTERN = /(E_?MAIL|PHONE|TELEF|CELL|TAX|CODICE_?FISC|CODFIS|FISCAL|IBAN|CARD|CARTA|SALARY|SALARIO|STIPEND|PASSWORD|SSN|BIRTH|NASCITA)/i;
const isPii = (col) => PII_PATTERN.test(col);

const NUMERIC_TYPES = /INT|DEC|NUM|FLOAT|DOUBLE|REAL|MONEY|SERIAL/i;

function quoteIdent(name, driver) {
  if (/^[A-Za-z_][A-Za-z0-9_$#@]*$/.test(name)) return name;
  return driver === "mysql" ? `\`${name.replace(/`/g, "``")}\`` : `"${name.replace(/"/g, '""')}"`;
}

function buildWizardSql({ conn, schema, table, columns, selected, filter, sort }) {
  const d = conn.driver;
  const sep = d === "ibmi" && conn.options?.naming === "system" ? "/" : ".";
  const from = d === "sqlite" ? quoteIdent(table, d) : `${quoteIdent(schema, d)}${sep}${quoteIdent(table, d)}`;
  const cols = selected.length ? selected.map((c) => quoteIdent(c, d)).join(", ") : "*";
  let sql = `SELECT ${cols}\nFROM ${from}`;
  if (filter.column && filter.value !== "") {
    const colDef = columns.find((c) => c.name === filter.column);
    const numeric = colDef && NUMERIC_TYPES.test(colDef.type || "") && filter.value.trim() !== "" && !isNaN(Number(filter.value));
    let value = filter.value;
    if (filter.op === "LIKE" && !value.includes("%")) value = `%${value}%`;
    const literal = numeric && filter.op !== "LIKE" ? Number(value) : `'${value.replace(/'/g, "''")}'`;
    sql += `\nWHERE ${quoteIdent(filter.column, d)} ${filter.op} ${literal}`;
  }
  if (sort.column) sql += `\nORDER BY ${quoteIdent(sort.column, d)} ${sort.dir}`;
  return sql;
}

function formatCell(val) {
  if (val === null || val === undefined) return <span style={{ color: "var(--cds-text-muted)" }}>NULL</span>;
  if (typeof val === "number") return <span className="mono">{val.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>;
  if (typeof val === "boolean") return String(val);
  return String(val);
}

function maskValue(val) {
  if (val === null || val === undefined) return val;
  const s = String(val);
  return s.length > 6 ? `${s.slice(0, 2)}••••••${s.slice(-2)}` : "••••";
}

export default function UQueryCentral({ lang, translations, activeDb, connections, setActiveDb, user }) {
  const tr = translations[lang] || translations.en;
  const t = tr.queryCentral;
  const u = tr.ui;

  const [activeTab, setActiveTab] = useState("wizard");

  // Catalog
  const [schema, setSchema] = useState(activeDb?.defaultSchema || "");
  const [schemas, setSchemas] = useState([]);
  const [tables, setTables] = useState([]);
  const [table, setTable] = useState("");
  const [columns, setColumns] = useState([]);
  const [catalogError, setCatalogError] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Wizard
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [filter, setFilter] = useState({ column: "", op: "=", value: "" });
  const [sort, setSort] = useState({ column: "", dir: "ASC" });
  const [maxRows, setMaxRows] = useState(500);

  // Execution
  const [sqlQuery, setSqlQuery] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [tableSearch, setTableSearch] = useState("");
  const [maskPii, setMaskPii] = useState(user?.role !== "admin");

  const describe = (e) => (e.message === "NETWORK" ? u.gatewayUnreachable : e.message);

  // Reset everything when the connection changes
  useEffect(() => {
    setSchema(activeDb?.defaultSchema || "");
    setSchemas([]);
    setTables([]);
    setTable("");
    setColumns([]);
    setResult(null);
    setError(null);
    setSqlQuery(activeDb ? (queryExamples(activeDb.driver)[0]?.sql ?? "SELECT 1") : "");
    if (!activeDb) return;
    api.schemas(activeDb.id).then(setSchemas).catch(() => setSchemas([]));
  }, [activeDb?.id]);

  // Tables of the selected schema
  useEffect(() => {
    if (!activeDb || !schema) return;
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError(null);
    api.tables(activeDb.id, schema)
      .then((rows) => {
        if (cancelled) return;
        setTables(rows);
        setTable(rows[0]?.name || "");
      })
      .catch((e) => !cancelled && (setTables([]), setTable(""), setCatalogError(describe(e))))
      .finally(() => !cancelled && setCatalogLoading(false));
    return () => { cancelled = true; };
  }, [activeDb?.id, schema]);

  // Columns of the selected table
  useEffect(() => {
    if (!activeDb || !schema || !table) {
      setColumns([]);
      return;
    }
    let cancelled = false;
    api.columns(activeDb.id, schema, table)
      .then((cols) => {
        if (cancelled) return;
        setColumns(cols);
        setSelectedColumns(cols.slice(0, 12).map((c) => c.name));
        setFilter({ column: "", op: "=", value: "" });
        setSort({ column: "", dir: "ASC" });
      })
      .catch((e) => !cancelled && (setColumns([]), setCatalogError(describe(e))));
    return () => { cancelled = true; };
  }, [activeDb?.id, schema, table]);

  const wizardSql = useMemo(() => {
    if (!activeDb || !table) return "";
    return buildWizardSql({ conn: activeDb, schema, table, columns, selected: selectedColumns, filter, sort });
  }, [activeDb, schema, table, columns, selectedColumns, filter, sort]);

  const execute = async (sql) => {
    if (!activeDb || !sql.trim()) return;
    setIsRunning(true);
    setError(null);
    try {
      const res = await api.query(activeDb.id, sql, maxRows);
      setResult(res);
      trackAdAction();
      setTableSearch("");
    } catch (e) {
      setError(describe(e));
    } finally {
      setIsRunning(false);
    }
  };

  const handleRun = () => {
    if (activeTab === "wizard") {
      setSqlQuery(wizardSql);
      execute(wizardSql);
    } else {
      execute(sqlQuery);
    }
  };

  const records = useMemo(() => toRecords(result), [result]);
  const resultColumns = result?.columns || [];

  const visibleRecords = useMemo(() => {
    const masked = maskPii
      ? records.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, isPii(k) ? maskValue(v) : v])))
      : records;
    if (!tableSearch.trim()) return masked;
    const s = tableSearch.toLowerCase();
    return masked.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(s)));
  }, [records, tableSearch, maskPii]);

  // Chart: first text column as label, first numeric column as value (user can change both)
  const numericCols = resultColumns.filter((c) => records.some((r) => typeof r[c] === "number"));
  const [chartLabel, setChartLabel] = useState("");
  const [chartValue, setChartValue] = useState("");
  useEffect(() => {
    setChartLabel(resultColumns.find((c) => records.some((r) => typeof r[c] === "string")) || resultColumns[0] || "");
    setChartValue(numericCols[numericCols.length > 1 && /ID$/i.test(numericCols[0]) ? 1 : 0] || "");
  }, [result]);

  const chartRows = visibleRecords.slice(0, 20);
  const chartMax = Math.max(1, ...chartRows.map((r) => Math.abs(Number(r[chartValue]) || 0)));
  const chartTotal = visibleRecords.reduce((acc, r) => acc + (Number(r[chartValue]) || 0), 0);

  const fileBase = (table || "query").replace(/[^A-Za-z0-9_-]/g, "_");

  if (!activeDb) {
    return (
      <div className="card-panel" style={{ textAlign: "center", padding: "40px" }}>
        <Database size={28} color="var(--cds-text-muted)" />
        <p style={{ marginTop: "12px" }}>{u.noActiveConnection}</p>
      </div>
    );
  }

  const label = { display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" };

  return (
    <div className="query-central-root">
      <div className="card-panel-header" style={{ marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="card-title">
            <Database size={20} color="var(--cds-blue-light)" />
            {t.title}
          </h1>
          <p className="card-subtitle">{t.subtitle}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, maxWidth: "100%" }}>
          <span style={{ fontSize: "12px", color: "var(--cds-text-muted)", flexShrink: 0 }}>{t.selectDb}</span>
          <select className="select-control mono" style={{ minWidth: 0, maxWidth: "100%", flex: 1 }} value={activeDb.id}
            onChange={(e) => setActiveDb(connections.find((c) => c.id === e.target.value))}>
            {connections.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.driverLabel})</option>
            ))}
          </select>
        </div>
      </div>

      {activeDb.isDemo && (
        <div className="card-panel" style={{ padding: "10px 14px", fontSize: "12px", background: "rgba(241, 194, 27, 0.08)", borderColor: "rgba(241, 194, 27, 0.35)" }}>
          <AlertTriangle size={14} style={{ verticalAlign: "-2px", marginRight: "6px", color: "var(--cds-amber)" }} />
          {u.demoNotice}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div className="card-panel" style={{ flex: "2 1 280px", margin: 0, padding: "12px 16px", background: "rgba(15, 98, 254, 0.05)", borderColor: "rgba(15, 98, 254, 0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--cds-blue-light)" }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span><strong>{t.readOnlyNotice}</strong> {u.readOnlyNotes[activeDb.driver] || activeDb.readOnlyNote}</span>
          </div>
        </div>
        <div className="card-panel" style={{ flex: "1 1 240px", margin: 0, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            {maskPii ? <Lock size={15} color="var(--cds-amber)" /> : <Unlock size={15} color="var(--cds-green-light)" />}
            <div>
              <div style={{ fontWeight: 600 }}>{t.maskingActive}</div>
              <div style={{ fontSize: "10px", color: "var(--cds-text-muted)" }}>{u.maskingHint}</div>
            </div>
          </div>
          <button className="ibm-btn ibm-btn-secondary ibm-btn-sm" onClick={() => setMaskPii(!maskPii)}>
            {maskPii ? u.maskOff : u.maskOn}
          </button>
        </div>
      </div>

      <div className="card-panel">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", borderBottom: "1px solid var(--cds-border-subtle)", paddingBottom: "12px", marginBottom: "16px" }}>
          <button className={`ibm-btn ${activeTab === "wizard" ? "ibm-btn-primary" : "ibm-btn-secondary"} ibm-btn-sm`} onClick={() => setActiveTab("wizard")}>
            <TableIcon size={14} />
            {t.tabWizard}
          </button>
          <button className={`ibm-btn ${activeTab === "sql" ? "ibm-btn-primary" : "ibm-btn-secondary"} ibm-btn-sm`} onClick={() => setActiveTab("sql")}>
            <Code2 size={14} />
            {t.tabSql}
          </button>
          <button className={`ibm-btn ${activeTab === "examples" ? "ibm-btn-primary" : "ibm-btn-secondary"} ibm-btn-sm`} onClick={() => setActiveTab("examples")}>
            <BookOpen size={14} />
            {t.tabAi}
          </button>
        </div>

        {activeTab === "wizard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={label}>{u.schema}</label>
                {schemas.length > 0 ? (
                  <select className="select-control mono" style={{ width: "100%" }} value={schema} onChange={(e) => setSchema(e.target.value)}>
                    {!schemas.includes(schema) && schema && <option value={schema}>{schema}</option>}
                    {schemas.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input className="ai-input mono" style={{ width: "100%" }} value={schema}
                    onChange={(e) => setSchema(e.target.value)} onBlur={(e) => setSchema(e.target.value.trim())} />
                )}
              </div>
              <div>
                <label style={label}>{t.selectTable}</label>
                <select className="select-control mono" style={{ width: "100%" }} value={table} onChange={(e) => setTable(e.target.value)} disabled={catalogLoading}>
                  {tables.length === 0 && <option value="">{catalogLoading ? "…" : u.noTables}</option>}
                  {tables.map((tb) => <option key={tb.name} value={tb.name}>{tb.name}{tb.type ? ` (${tb.type})` : ""}</option>)}
                </select>
                <span style={{ fontSize: "11px", color: "var(--cds-text-muted)", marginTop: "4px", display: "block" }}>
                  {tables.find((tb) => tb.name === table)?.description}
                </span>
              </div>
              <div>
                <label style={label}>{t.filterConditions}</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <select className="select-control mono" style={{ flex: 1, minWidth: 0 }} value={filter.column} onChange={(e) => setFilter({ ...filter, column: e.target.value })}>
                    <option value="">{u.noFilter}</option>
                    {columns.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <select className="select-control mono" value={filter.op} onChange={(e) => setFilter({ ...filter, op: e.target.value })}>
                    {["=", "<>", ">", ">=", "<", "<=", "LIKE"].map((op) => <option key={op} value={op}>{op}</option>)}
                  </select>
                  <input className="ai-input" style={{ padding: "6px 8px", width: "90px" }} placeholder={u.value}
                    value={filter.value} onChange={(e) => setFilter({ ...filter, value: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={label}>{t.sorting}</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <select className="select-control mono" style={{ flex: 1, minWidth: 0 }} value={sort.column} onChange={(e) => setSort({ ...sort, column: e.target.value })}>
                    <option value="">{u.noSort}</option>
                    {columns.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <button className="ibm-btn ibm-btn-secondary ibm-btn-sm" onClick={() => setSort({ ...sort, dir: sort.dir === "ASC" ? "DESC" : "ASC" })}>
                    {sort.dir}
                  </button>
                </div>
              </div>
            </div>

            {catalogError && (
              <div className="ibm-badge ibm-badge-red" style={{ display: "flex", width: "100%", padding: "8px 12px", marginBottom: "12px", borderRadius: "2px", whiteSpace: "normal" }}>
                <ShieldAlert size={16} style={{ marginRight: "8px", flexShrink: 0 }} />
                <span>{catalogError}</span>
              </div>
            )}

            {columns.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>{t.selectedColumns}:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {columns.map((col) => {
                    const on = selectedColumns.includes(col.name);
                    return (
                      <button key={col.name}
                        onClick={() => setSelectedColumns(on ? selectedColumns.filter((c) => c !== col.name) : [...selectedColumns, col.name])}
                        className={`ibm-badge ${on ? "ibm-badge-blue" : "ibm-badge-secondary"}`}
                        style={{ cursor: "pointer", padding: "4px 8px" }}
                        title={[col.type, col.description].filter(Boolean).join(" — ")}>
                        {col.name}
                        {isPii(col.name) && <Lock size={10} style={{ marginLeft: "4px", color: "var(--cds-amber)" }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {wizardSql && (
              <pre className="mono" style={{ fontSize: "11px", background: "var(--cds-bg-surface-0)", padding: "10px", border: "1px solid var(--cds-border-subtle)", whiteSpace: "pre-wrap", margin: 0 }}>
                {wizardSql}
              </pre>
            )}
          </div>
        )}

        {activeTab === "sql" && (
          <div className="sql-editor-container">
            <div className="sql-editor-header">
              <span>{activeDb.driverLabel} · {u.readOnly}</span>
              <span className="mono">{activeDb.host ? `${activeDb.host}:${activeDb.port}` : activeDb.database}</span>
            </div>
            <textarea className="sql-textarea" value={sqlQuery} onChange={(e) => setSqlQuery(e.target.value)} spellCheck={false}
              onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") execute(sqlQuery); }} />
          </div>
        )}

        {activeTab === "examples" && (
          <div>
            <p style={{ fontSize: "12px", color: "var(--cds-text-secondary)", marginBottom: "12px" }}>{u.examplesIntro}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {queryExamples(activeDb.driver).map((ex) => (
                <button key={ex.id} className="ibm-btn ibm-btn-secondary ibm-btn-sm"
                  onClick={() => { setSqlQuery(ex.sql); setActiveTab("sql"); }}>
                  <Zap size={12} color="var(--cds-blue-light)" />
                  {u.examples[ex.id] || ex.id}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="ibm-badge ibm-badge-red" style={{ display: "flex", width: "100%", padding: "8px 12px", marginTop: "12px", borderRadius: "2px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            <ShieldAlert size={16} style={{ marginRight: "8px", flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--cds-border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button className="ibm-btn ibm-btn-primary" onClick={handleRun} disabled={isRunning || activeTab === "examples" || (activeTab === "wizard" && !wizardSql)}>
              <Play size={14} />
              {isRunning ? t.runningQuery : t.runQuery}
            </button>
            <label style={{ fontSize: "12px", color: "var(--cds-text-muted)" }}>
              {t.limitRows}{" "}
              <select className="select-control mono" value={maxRows} onChange={(e) => setMaxRows(Number(e.target.value))}>
                {[100, 500, 1000, 5000].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          {result && (
            <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--cds-text-muted)" }}>
              <strong style={{ color: "var(--cds-text-primary)" }}>{result.rowCount}</strong> {t.resultsStats}{" "}
              <strong style={{ color: "var(--cds-green-light)" }}>{result.durationMs} ms</strong>
              {result.truncated && <span className="ibm-badge ibm-badge-amber" style={{ marginLeft: "8px", fontSize: "10px" }}>{u.truncated.replace("{n}", result.maxRows)}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="card-panel">
        <div className="card-panel-header" style={{ flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>{u.results}</span>
            <div style={{ display: "flex", border: "1px solid var(--cds-border-strong)", borderRadius: "2px", overflow: "hidden" }}>
              <button className={`ibm-btn ibm-btn-sm ${viewMode === "table" ? "ibm-btn-primary" : "ibm-btn-secondary"}`} onClick={() => setViewMode("table")} style={{ borderRadius: 0 }}>
                <TableIcon size={13} />
                {t.tableMode}
              </button>
              <button className={`ibm-btn ibm-btn-sm ${viewMode === "chart" ? "ibm-btn-primary" : "ibm-btn-secondary"}`} onClick={() => setViewMode("chart")} style={{ borderRadius: 0 }}
                disabled={numericCols.length === 0}>
                <BarChart3 size={13} />
                {t.chartMode}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <button className="ibm-btn ibm-btn-secondary ibm-btn-sm" disabled={!visibleRecords.length}
              onClick={() => exportToExcel(visibleRecords, `${fileBase}.xls`, table || "Plexa DB")}>
              <FileSpreadsheet size={14} color="var(--cds-green-light)" />
              {t.exportExcel}
            </button>
            <button className="ibm-btn ibm-btn-secondary ibm-btn-sm" disabled={!visibleRecords.length} onClick={() => exportToCsv(visibleRecords, `${fileBase}.csv`)}>
              <FileText size={14} color="var(--cds-blue-light)" />
              {t.exportCsv}
            </button>
            <button className="ibm-btn ibm-btn-secondary ibm-btn-sm" disabled={!visibleRecords.length} onClick={() => exportToJson(visibleRecords, `${fileBase}.json`)}>
              <Code2 size={14} color="var(--cds-magenta)" />
              {t.exportJson}
            </button>
            <button className="ibm-btn ibm-btn-secondary ibm-btn-sm" disabled={!visibleRecords.length} onClick={() => window.print()}>
              <Download size={14} />
              {t.exportPdf}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Search size={15} style={{ color: "var(--cds-text-muted)" }} />
          <input className="ai-input" style={{ padding: "6px 12px", width: "260px", maxWidth: "100%", fontSize: "12px" }}
            placeholder={u.searchResults} value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} />
          {tableSearch && <span style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>{visibleRecords.length}</span>}
        </div>

        {viewMode === "table" && (
          <div className="table-container">
            {!result || visibleRecords.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--cds-text-muted)" }}>{t.noResults}</div>
            ) : (
              <table className="ibm-data-table">
                <thead>
                  <tr>
                    {resultColumns.map((col) => (
                      <th key={col}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>{col}</span>
                          {isPii(col) && <Lock size={11} color="var(--cds-amber)" />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRecords.map((row, idx) => (
                    <tr key={idx}>
                      {resultColumns.map((col) => <td key={col}>{formatCell(row[col])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {viewMode === "chart" && numericCols.length > 0 && (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "12px", fontSize: "12px" }}>
              <label>{u.chartLabel}{" "}
                <select className="select-control mono" value={chartLabel} onChange={(e) => setChartLabel(e.target.value)}>
                  {resultColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label>{u.chartValue}{" "}
                <select className="select-control mono" value={chartValue} onChange={(e) => setChartValue(e.target.value)}>
                  {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <span style={{ color: "var(--cds-text-muted)" }}>
                {u.total}: <strong className="mono">{chartTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
              </span>
            </div>
            <div style={{ background: "var(--cds-bg-surface-1)", padding: "16px", border: "1px solid var(--cds-border-subtle)", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {chartRows.map((row, i) => {
                const val = Number(row[chartValue]) || 0;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "30%", maxWidth: "180px", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }}>
                      {String(row[chartLabel] ?? "—")}
                    </div>
                    <div style={{ flex: 1, height: "18px", background: "var(--cds-bg-surface-0)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ width: `${Math.round((Math.abs(val) / chartMax) * 100)}%`, height: "100%", background: "var(--cds-blue)" }} />
                    </div>
                    <div className="mono" style={{ width: "90px", fontSize: "12px", textAlign: "right" }}>
                      {val.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
