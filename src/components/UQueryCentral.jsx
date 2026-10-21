import React, { useState, useMemo, useEffect } from "react";
import { 
  Play, 
  Sparkles, 
  Table as TableIcon, 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Code2, 
  ShieldAlert, 
  CheckCircle2, 
  Filter, 
  ArrowUpDown, 
  Search, 
  Database,
  Lock, 
  Unlock, 
  Copy, 
  Zap, 
  Info
} from "lucide-react";
import { DATABASES, MOCK_TABLES, MOCK_AI_PROMPTS } from "../data/mockDatabase";
import { exportToCsv, exportToJson, exportToExcel } from "../utils/exportUtils";

export default function UQueryCentral({
  lang,
  translations,
  activeDb,
  setActiveDb,
  userRole,
  onLogActivity
}) {
  const t = translations[lang]?.queryCentral || translations.en.queryCentral;
  const common = translations[lang]?.common || translations.en.common;

  // Query Mode: wizard | sql | ai
  const [activeTab, setActiveTab] = useState("wizard");

  // Selection state
  const availableTables = MOCK_TABLES[activeDb.id] || [];
  const [selectedTableId, setSelectedTableId] = useState(availableTables[0]?.id || "QCUSTCDT");

  // Synchronize table selection whenever active database changes
  useEffect(() => {
    const tables = MOCK_TABLES[activeDb.id] || [];
    if (tables.length > 0) {
      const match = tables.find(t => t.id === selectedTableId);
      const targetTable = match || tables[0];
      setSelectedTableId(targetTable.id);
      setSelectedColumns(targetTable.columns.map(c => c.name));
      setResultsData(targetTable.data);
      setExecutionStats({ duration: Math.floor(Math.random() * 30) + 15, rows: targetTable.data.length, cache: true });
      setSqlQuery(`SELECT ${targetTable.columns.map(c => c.name).slice(0, 5).join(", ")}\nFROM ${targetTable.name}\nFETCH FIRST 20 ROWS ONLY;`);
    } else {
      setSelectedTableId("");
      setSelectedColumns([]);
      setResultsData([]);
    }
  }, [activeDb.id]);

  const currentTable = useMemo(() => {
    return availableTables.find(tbl => tbl.id === selectedTableId) || availableTables[0];
  }, [availableTables, selectedTableId]);

  // Wizard state
  const [selectedColumns, setSelectedColumns] = useState(currentTable ? currentTable.columns.map(c => c.name) : []);
  const [filterColumn, setFilterColumn] = useState("");
  const [filterOp, setFilterOp] = useState(">");
  const [filterVal, setFilterVal] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("ASC");
  const [rowLimit, setRowLimit] = useState(20);

  // SQL State
  const [sqlQuery, setSqlQuery] = useState(() => {
    const firstTbl = availableTables[0];
    if (firstTbl) {
      return `SELECT ${firstTbl.columns.map(c => c.name).slice(0, 5).join(", ")}\nFROM ${firstTbl.name}\nFETCH FIRST 20 ROWS ONLY;`;
    }
    return `SELECT * FROM QIWS/QCUSTCDT FETCH FIRST 20 ROWS ONLY;`;
  });
  const [sqlError, setSqlError] = useState(null);

  // AI Prompt State
  const [aiPromptText, setAiPromptText] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Execution & Results
  const [isRunning, setIsRunning] = useState(false);
  const [resultsData, setResultsData] = useState(() => currentTable?.data || []);
  const [executionStats, setExecutionStats] = useState({ duration: 38, rows: currentTable?.data?.length || 0, cache: true });
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'chart'
  const [tableSearch, setTableSearch] = useState("");
  const [maskPii, setMaskPii] = useState(userRole === "analyst");

  // Update selected columns when table changes
  const handleTableChange = (newTableId) => {
    setSelectedTableId(newTableId);
    const tbl = availableTables.find(t => t.id === newTableId);
    if (tbl) {
      setSelectedColumns(tbl.columns.map(c => c.name));
      setResultsData(tbl.data);
      setExecutionStats({ duration: Math.floor(Math.random() * 40) + 15, rows: tbl.data.length, cache: true });
      setSqlQuery(`SELECT ${tbl.columns.map(c => c.name).slice(0, 5).join(", ")}\nFROM ${tbl.name}\nFETCH FIRST 20 ROWS ONLY;`);
    }
  };

  // Run Query with Read-Only AST Protection
  const handleExecute = () => {
    setSqlError(null);

    // Read-only verification check
    const destructiveKeywords = ["DROP", "DELETE", "UPDATE", "INSERT", "TRUNCATE", "ALTER", "GRANT", "REVOKE"];
    const upperSql = sqlQuery.toUpperCase();
    const foundDestructive = destructiveKeywords.find(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, "i");
      return regex.test(upperSql);
    });

    if (foundDestructive) {
      setSqlError(`MUTATION REJECTED: '${foundDestructive}' is blocked. IBMFILE is certified read-only by construction.`);
      if (onLogActivity) {
        onLogActivity({
          user: "Current Operator",
          role: userRole,
          dbTarget: activeDb.name,
          action: "Blocked Mutation Attempt",
          statement: sqlQuery.substring(0, 100),
          rows: 0,
          durationMs: 1,
          piiMasked: true
        });
      }
      return;
    }

    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      let data = currentTable?.data ? [...currentTable.data] : [];

      // Apply wizard filters if in wizard mode
      if (activeTab === "wizard" && filterColumn && filterVal) {
        data = data.filter(row => {
          const val = row[filterColumn];
          if (typeof val === "number") {
            const numVal = parseFloat(filterVal);
            if (filterOp === ">") return val > numVal;
            if (filterOp === "<") return val < numVal;
            if (filterOp === "=") return val === numVal;
          }
          return String(val).toLowerCase().includes(String(filterVal).toLowerCase());
        });
      }

      // Apply sorting
      if (sortColumn) {
        data.sort((a, b) => {
          if (a[sortColumn] < b[sortColumn]) return sortDirection === "ASC" ? -1 : 1;
          if (a[sortColumn] > b[sortColumn]) return sortDirection === "ASC" ? 1 : -1;
          return 0;
        });
      }

      // Limit rows
      const sliced = data.slice(0, rowLimit);
      setResultsData(sliced);
      const duration = Math.floor(Math.random() * 35) + 12;
      setExecutionStats({ duration, rows: sliced.length, cache: Math.random() > 0.3 });

      if (onLogActivity) {
        onLogActivity({
          user: userRole === "admin" ? "sec_admin" : "m.bianchi",
          role: userRole,
          dbTarget: activeDb.name,
          action: "Query Eseguita",
          statement: activeTab === "sql" ? sqlQuery : `WIZARD: ${currentTable?.name}`,
          rows: sliced.length,
          durationMs: duration,
          piiMasked: maskPii
        });
      }
    }, 450);
  };

  // AI Prompt generation simulation
  const handleAiGenerate = (sample) => {
    setIsAiThinking(true);
    setTimeout(() => {
      setIsAiThinking(false);
      if (sample) {
        setSqlQuery(sample.generatedSql);
        setAiPromptText(sample.prompt);
      } else if (aiPromptText.trim()) {
        setSqlQuery(`-- IBM Granite AI Generated Query for: "${aiPromptText}"\nSELECT CUST_ID, COMPANY_NAME, OPEN_BALANCE, CREDIT_LIMIT, CITY\nFROM PRODLIB/CUSTMAST\nWHERE STATUS = 'A' AND OPEN_BALANCE > 50000.00\nORDER BY OPEN_BALANCE DESC\nFETCH FIRST 20 ROWS ONLY;`);
      }
      setActiveTab("sql");
    }, 700);
  };

  // Filtered results with search
  const filteredRows = useMemo(() => {
    if (!tableSearch.trim()) return resultsData;
    const q = tableSearch.toLowerCase();
    return resultsData.filter(row => {
      return Object.values(row).some(v => String(v).toLowerCase().includes(q));
    });
  }, [resultsData, tableSearch]);

  // Masking helper
  const renderCellContent = (colName, val) => {
    const colDef = currentTable?.columns?.find(c => c.name === colName);
    const isSensitive = colDef?.pii;

    if (isSensitive && maskPii) {
      if (typeof val === "string" && val.length > 6) {
        const masked = val.substring(0, 3) + "••••••••" + val.substring(val.length - 2);
        return <span className="pii-masked-chip" title="Dynamic PII Masking">{masked}</span>;
      }
      return <span className="pii-masked-chip" title="Dynamic PII Masking">•••• CONFIDENTIAL ••••</span>;
    }

    if (typeof val === "number") {
      return <span className="mono">{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
    }

    return String(val ?? "");
  };

  // Chart data calculations
  const chartMetrics = useMemo(() => {
    if (!resultsData || resultsData.length === 0) return null;
    const numericKeys = Object.keys(resultsData[0]).filter(k => typeof resultsData[0][k] === "number" && !k.endsWith("_ID") && !k.endsWith("KEY"));
    const primaryKey = numericKeys[0] || Object.keys(resultsData[0])[0];
    const total = resultsData.reduce((acc, row) => acc + (typeof row[primaryKey] === "number" ? row[primaryKey] : 0), 0);
    const avg = total / resultsData.length;
    const max = Math.max(...resultsData.map(row => typeof row[primaryKey] === "number" ? row[primaryKey] : 0));

    return { primaryKey, total, avg, max };
  }, [resultsData]);

  return (
    <div className="query-central-root">
      {/* Page Title & DB Switcher */}
      <div className="card-panel-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1 className="card-title">
            <Database size={20} color="var(--cds-blue-light)" />
            {t.title}
          </h1>
          <p className="card-subtitle">{t.subtitle}</p>
        </div>

        {/* Database Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--cds-text-muted)" }}>{t.selectDb}</span>
          <select 
            className="select-control mono"
            value={activeDb.id}
            onChange={(e) => {
              const found = DATABASES.find(d => d.id === e.target.value);
              if (found) {
                setActiveDb(found);
                const newTbls = MOCK_TABLES[found.id] || [];
                if (newTbls.length > 0) handleTableChange(newTbls[0].id);
              }
            }}
          >
            {DATABASES.map(db => (
              <option key={db.id} value={db.id}>{db.name} ({db.type})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Banner: Read-Only Safeguard & Dynamic Masking Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div className="card-panel" style={{ flex: "2", margin: 0, padding: "12px 16px", background: "rgba(15, 98, 254, 0.05)", borderColor: "rgba(15, 98, 254, 0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--cds-blue-light)" }}>
            <CheckCircle2 size={16} />
            <strong>{t.readOnlyNotice}</strong>
          </div>
        </div>

        <div className="card-panel" style={{ flex: "1", margin: 0, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            {maskPii ? <Lock size={15} color="var(--cds-amber)" /> : <Unlock size={15} color="var(--cds-green-light)" />}
            <div>
              <div style={{ fontWeight: 600 }}>{t.maskingActive}</div>
              <div style={{ fontSize: "10px", color: "var(--cds-text-muted)" }}>GDPR Art. 32 Compliance</div>
            </div>
          </div>
          <button 
            className="ibm-btn ibm-btn-secondary ibm-btn-sm"
            onClick={() => setMaskPii(!maskPii)}
          >
            {maskPii ? "Disattiva (Audit Logged)" : "Attiva Mascheramento"}
          </button>
        </div>
      </div>

      {/* Main Query Creation Tabs */}
      <div className="card-panel">
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--cds-border-subtle)", paddingBottom: "12px", marginBottom: "16px" }}>
          <button 
            className={`ibm-btn ${activeTab === "wizard" ? "ibm-btn-primary" : "ibm-btn-secondary"} ibm-btn-sm`}
            onClick={() => setActiveTab("wizard")}
          >
            <TableIcon size={14} />
            {t.tabWizard}
          </button>

          <button 
            className={`ibm-btn ${activeTab === "sql" ? "ibm-btn-primary" : "ibm-btn-secondary"} ibm-btn-sm`}
            onClick={() => setActiveTab("sql")}
          >
            <Code2 size={14} />
            {t.tabSql}
          </button>

          <button 
            className={`ibm-btn ${activeTab === "ai" ? "ibm-btn-primary" : "ibm-btn-secondary"} ibm-btn-sm`}
            onClick={() => setActiveTab("ai")}
          >
            <Sparkles size={14} />
            {t.tabAi}
          </button>
        </div>

        {/* TAB 1: VISUAL QUERY WIZARD */}
        {activeTab === "wizard" && (
          <div>
            {activeDb.id === "PUB400" && (
              <div style={{ background: "rgba(15, 98, 254, 0.08)", border: "1px solid var(--cds-blue)", padding: "10px 14px", borderRadius: "2px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                  <span className="status-dot-green"></span>
                  <span><strong>PUB400 Cloud Live Socket (185.113.5.134:446)</strong> &bull; Librerie Sistema: <strong className="mono">QIWS, QGPL</strong></span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>
                  File Fisici IBM i: <strong style={{ color: "var(--cds-green-light)" }}>QIWS/QCUSTCDT</strong> &bull; <strong style={{ color: "var(--cds-blue-light)" }}>QIWS/QEMP</strong>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "16px" }}>
              {/* Select Table */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                  {t.selectTable}
                </label>
                <select 
                  className="select-control mono"
                  style={{ width: "100%" }}
                  value={selectedTableId}
                  onChange={(e) => handleTableChange(e.target.value)}
                >
                  {availableTables.map(tbl => (
                    <option key={tbl.id} value={tbl.id}>{tbl.name} ({tbl.type})</option>
                  ))}
                </select>
                <span style={{ fontSize: "11px", color: "var(--cds-text-muted)", marginTop: "4px", display: "block" }}>
                  {currentTable?.description}
                </span>
              </div>

              {/* Filter Criteria */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                  {t.filterConditions}
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <select 
                    className="select-control mono"
                    style={{ flex: 1 }}
                    value={filterColumn}
                    onChange={(e) => setFilterColumn(e.target.value)}
                  >
                    <option value="">-- Nessun Filtro --</option>
                    {currentTable?.columns.map(col => (
                      <option key={col.name} value={col.name}>{col.name}</option>
                    ))}
                  </select>
                  <select 
                    className="select-control mono"
                    value={filterOp}
                    onChange={(e) => setFilterOp(e.target.value)}
                  >
                    <option value="=">=</option>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value="LIKE">LIKE</option>
                  </select>
                  <input 
                    type="text" 
                    className="ai-input" 
                    placeholder="Valore..."
                    style={{ padding: "6px 8px", width: "100px" }}
                    value={filterVal}
                    onChange={(e) => setFilterVal(e.target.value)}
                  />
                </div>
              </div>

              {/* Sorting & Limits */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                  {t.sorting} &amp; {t.limitRows}
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <select 
                    className="select-control mono"
                    style={{ flex: 1 }}
                    value={sortColumn}
                    onChange={(e) => setSortColumn(e.target.value)}
                  >
                    <option value="">-- Nessun Ordinamento --</option>
                    {currentTable?.columns.map(col => (
                      <option key={col.name} value={col.name}>{col.name}</option>
                    ))}
                  </select>
                  <button 
                    className="ibm-btn ibm-btn-secondary ibm-btn-sm"
                    onClick={() => setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC")}
                  >
                    {sortDirection}
                  </button>
                  <select 
                    className="select-control mono"
                    value={rowLimit}
                    onChange={(e) => setRowLimit(Number(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Column Chips Selector */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                {t.selectedColumns}:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {currentTable?.columns.map(col => {
                  const isSelected = selectedColumns.includes(col.name);
                  return (
                    <button
                      key={col.name}
                      onClick={() => {
                        if (isSelected) {
                          if (selectedColumns.length > 1) {
                            setSelectedColumns(selectedColumns.filter(c => c !== col.name));
                          }
                        } else {
                          setSelectedColumns([...selectedColumns, col.name]);
                        }
                      }}
                      className={`ibm-badge ${isSelected ? "ibm-badge-blue" : "ibm-badge-secondary"}`}
                      style={{ cursor: "pointer", padding: "4px 8px" }}
                    >
                      {col.name}
                      {col.pii && <Lock size={10} style={{ marginLeft: "4px", color: "var(--cds-amber)" }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRO SQL EDITOR */}
        {activeTab === "sql" && (
          <div>
            <div className="sql-editor-container">
              <div className="sql-editor-header">
                <span>SQL-92 / Db2 for i Compiler &bull; READ-ONLY ENFORCED</span>
                <span className="mono">Target: {activeDb.host}:{activeDb.port}</span>
              </div>
              <textarea 
                className="sql-textarea"
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                spellCheck={false}
              />
            </div>

            {sqlError && (
              <div className="ibm-badge ibm-badge-red" style={{ display: "flex", width: "100%", padding: "8px 12px", marginBottom: "12px", borderRadius: "2px" }}>
                <ShieldAlert size={16} style={{ marginRight: "8px", flexShrink: 0 }} />
                <span>{sqlError}</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: IBM GRANITE AI ASSISTANT */}
        {activeTab === "ai" && (
          <div className="ai-assistant-box">
            <div className="ai-header">
              <Sparkles size={18} color="var(--cds-blue-light)" />
              <strong style={{ fontSize: "14px" }}>IBM Granite Foundation AI Model for SQL</strong>
              <span className="ai-badge">ON-PREMISE AIR-GAPPED</span>
            </div>

            <p style={{ fontSize: "12px", color: "var(--cds-text-secondary)", marginBottom: "12px" }}>
              Scrivi una richiesta in linguaggio naturale. Il motore Granite genera il codice SQL conforme al perimetro di sicurezza aziendale.
            </p>

            <div className="ai-input-row" style={{ marginBottom: "16px" }}>
              <input 
                type="text"
                className="ai-input"
                placeholder={t.aiPromptPlaceholder}
                value={aiPromptText}
                onChange={(e) => setAiPromptText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
              />
              <button 
                className="ibm-btn ibm-btn-primary"
                onClick={() => handleAiGenerate()}
                disabled={isAiThinking}
              >
                {isAiThinking ? t.aiExplaining : t.aiGenerateBtn}
              </button>
            </div>

            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--cds-text-muted)", marginBottom: "8px" }}>
              PROMPT AZIENDALI CONSIGLIATI:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {MOCK_AI_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  className="ibm-btn ibm-btn-secondary ibm-btn-sm"
                  onClick={() => handleAiGenerate(p)}
                >
                  <Zap size={12} color="var(--cds-blue-light)" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Run Button & Execution Metrics Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--cds-border-subtle)" }}>
          <button 
            className="ibm-btn ibm-btn-primary"
            onClick={handleExecute}
            disabled={isRunning}
          >
            <Play size={14} />
            {isRunning ? t.runningQuery : t.runQuery}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--cds-text-muted)" }}>
            <span>
              <strong style={{ color: "var(--cds-text-primary)" }}>{executionStats.rows}</strong> {t.resultsStats} <strong style={{ color: "var(--cds-green-light)" }}>{executionStats.duration}ms</strong>
            </span>
            {executionStats.cache && (
              <span className="ibm-badge ibm-badge-green" style={{ fontSize: "10px" }}>
                {t.cacheHit}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* RESULTS SECTION: TOOLBAR & EXPORTS */}
      <div className="card-panel">
        <div className="card-panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Dati Estratti &amp; Risultati</span>
            
            {/* View Mode Toggle: Table / Chart */}
            <div style={{ display: "flex", border: "1px solid var(--cds-border-strong)", borderRadius: "2px", overflow: "hidden" }}>
              <button 
                className={`ibm-btn ibm-btn-sm ${viewMode === "table" ? "ibm-btn-primary" : "ibm-btn-secondary"}`}
                onClick={() => setViewMode("table")}
                style={{ borderRadius: 0 }}
              >
                <TableIcon size={13} />
                {t.tableMode}
              </button>
              <button 
                className={`ibm-btn ibm-btn-sm ${viewMode === "chart" ? "ibm-btn-primary" : "ibm-btn-secondary"}`}
                onClick={() => setViewMode("chart")}
                style={{ borderRadius: 0 }}
              >
                <BarChart3 size={13} />
                {t.chartMode}
              </button>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button 
              className="ibm-btn ibm-btn-secondary ibm-btn-sm"
              onClick={() => exportToExcel(filteredRows, `${currentTable?.id}_extract.xls`, currentTable?.description)}
              title="Download Excel Spreadsheet"
            >
              <FileSpreadsheet size={14} color="var(--cds-green-light)" />
              {t.exportExcel}
            </button>
            <button 
              className="ibm-btn ibm-btn-secondary ibm-btn-sm"
              onClick={() => exportToCsv(filteredRows, `${currentTable?.id}_data.csv`)}
              title="Download CSV"
            >
              <FileText size={14} color="var(--cds-blue-light)" />
              {t.exportCsv}
            </button>
            <button 
              className="ibm-btn ibm-btn-secondary ibm-btn-sm"
              onClick={() => exportToJson(filteredRows, `${currentTable?.id}_data.json`)}
              title="Download JSON"
            >
              <Code2 size={14} color="var(--cds-magenta)" />
              {t.exportJson}
            </button>
            <button 
              className="ibm-btn ibm-btn-secondary ibm-btn-sm"
              onClick={() => window.print()}
              title="Print Dossier / PDF"
            >
              <Download size={14} />
              {t.exportPdf}
            </button>
          </div>
        </div>

        {/* Quick Search Input */}
        <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Search size={15} style={{ color: "var(--cds-text-muted)" }} />
          <input 
            type="text"
            className="ai-input"
            style={{ padding: "6px 12px", width: "260px", fontSize: "12px" }}
            placeholder="Cerca nei risultati correnti..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
          />
          {tableSearch && (
            <span style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>
              {filteredRows.length} record trovati
            </span>
          )}
        </div>

        {/* VIEW 1: DATA TABLE */}
        {viewMode === "table" && (
          <div className="table-container">
            {filteredRows.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--cds-text-muted)" }}>
                {t.noResults}
              </div>
            ) : (
              <table className="ibm-data-table">
                <thead>
                  <tr>
                    {selectedColumns.map(col => {
                      const def = currentTable?.columns.find(c => c.name === col);
                      return (
                        <th key={col}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>{col}</span>
                            {def?.pii && <Lock size={11} color="var(--cds-amber)" title="Campo PII Sensibile" />}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, idx) => (
                    <tr key={idx}>
                      {selectedColumns.map(col => (
                        <td key={col}>
                          {renderCellContent(col, row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* VIEW 2: VISUAL CHART & ANALYTICS */}
        {viewMode === "chart" && chartMetrics && (
          <div>
            <div className="kpi-grid">
              <div className="kpi-card green">
                <span className="kpi-label">Totale Volume</span>
                <span className="kpi-value">
                  € {chartMetrics.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="kpi-subtext">Calcolato su colonna {chartMetrics.primaryKey}</span>
              </div>
              <div className="kpi-card teal">
                <span className="kpi-label">Media Record</span>
                <span className="kpi-value">
                  € {chartMetrics.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="kpi-subtext">Valore ponderato</span>
              </div>
              <div className="kpi-card magenta">
                <span className="kpi-label">Picco Massimo</span>
                <span className="kpi-value">
                  € {chartMetrics.max.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="kpi-subtext">Record di vertice</span>
              </div>
            </div>

            {/* SVG Modern Bar Chart */}
            <div style={{ background: "var(--cds-bg-surface-1)", padding: "20px", border: "1px solid var(--cds-border-subtle)", borderRadius: "2px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "16px", color: "var(--cds-text-secondary)" }}>
                Distribuzione Relativa per Record &bull; Indicatore di Esposizione
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {filteredRows.slice(0, 8).map((row, i) => {
                  const val = typeof row[chartMetrics.primaryKey] === "number" ? row[chartMetrics.primaryKey] : 50;
                  const pct = Math.min(100, Math.round((val / (chartMetrics.max || 1)) * 100));
                  const label = row.COMPANY_NAME || row.ITEM_DESC || row.FULL_NAME || `Record #${i+1}`;

                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "160px", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }}>
                        {label}
                      </div>
                      <div style={{ flex: 1, height: "20px", background: "var(--cds-bg-surface-0)", borderRadius: "2px", overflow: "hidden", display: "flex" }}>
                        <div 
                          style={{ 
                            width: `${pct}%`, 
                            background: i % 2 === 0 ? "var(--cds-blue)" : "var(--cds-cyan)",
                            transition: "width 0.4s ease"
                          }} 
                        />
                      </div>
                      <div style={{ width: "90px", fontSize: "12px", fontFamily: "var(--font-mono)", textAlign: "right" }}>
                        € {val.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
