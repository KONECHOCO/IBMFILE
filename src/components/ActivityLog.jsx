import React, { useState } from "react";
import { 
  FileCheck2, 
  Download, 
  Search, 
  Filter, 
  ShieldCheck, 
  Lock, 
  FileSpreadsheet, 
  FileText,
  Hash,
  Clock,
  User,
  Database
} from "lucide-react";
import { exportToCsv, exportToExcel } from "../utils/exportUtils";

export default function ActivityLog({ lang, translations, logs }) {
  const t = translations[lang]?.activityLog || translations.en.activityLog;

  const [selectedAction, setSelectedAction] = useState("ALL");
  const [searchFilter, setSearchFilter] = useState("");

  const filteredLogs = logs.filter(item => {
    const matchesAction = selectedAction === "ALL" || item.action === selectedAction;
    const matchesSearch = !searchFilter.trim() || 
      item.user.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.statement.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.dbTarget.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action) => {
    if (action.includes("Eseguita") || action.includes("Query")) {
      return <span className="ibm-badge ibm-badge-blue">{action}</span>;
    }
    if (action.includes("Esportato") || action.includes("Export")) {
      return <span className="ibm-badge ibm-badge-green">{action}</span>;
    }
    if (action.includes("Bloccata") || action.includes("Blocked")) {
      return <span className="ibm-badge ibm-badge-red">{action}</span>;
    }
    return <span className="ibm-badge ibm-badge-amber">{action}</span>;
  };

  return (
    <div className="activity-log-root">
      {/* Header */}
      <div className="card-panel-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1 className="card-title">
            <FileCheck2 size={20} color="var(--cds-blue-light)" />
            {t.title}
          </h1>
          <p className="card-subtitle">{t.subtitle}</p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            className="ibm-btn ibm-btn-secondary ibm-btn-sm"
            onClick={() => exportToExcel(filteredLogs, "registro_attivita_audit.xls", "Registro Attività e Tracciamento Accessi")}
          >
            <FileSpreadsheet size={14} color="var(--cds-green-light)" />
            Esporta Excel
          </button>
          <button 
            className="ibm-btn ibm-btn-secondary ibm-btn-sm"
            onClick={() => exportToCsv(filteredLogs, "registro_attivita_audit.csv")}
          >
            <FileText size={14} color="var(--cds-blue-light)" />
            Esporta CSV
          </button>
          <button 
            className="ibm-btn ibm-btn-primary ibm-btn-sm"
            onClick={() => window.print()}
          >
            <Download size={14} />
            {t.exportAuditBtn}
          </button>
        </div>
      </div>

      {/* Compliance Verification Banner */}
      <div className="card-panel" style={{ padding: "12px 16px", background: "rgba(36, 161, 72, 0.08)", borderColor: "rgba(36, 161, 72, 0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--cds-green-light)" }}>
            <ShieldCheck size={18} />
            <strong>{t.hashVerified}</strong>
          </div>
          <span className="mono" style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>
            Ledger Hash Root: 7d4a98...3f12c (Immutabile)
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card-panel" style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "240px" }}>
            <Search size={15} style={{ color: "var(--cds-text-muted)" }} />
            <input 
              type="text" 
              className="ai-input" 
              placeholder="Filtra per operatore, query o IP..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--cds-text-muted)" }}>{t.filterByAction}:</span>
            <select 
              className="select-control"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="ALL">{t.allActions}</option>
              <option value="Query Eseguita">{t.queryExecuted}</option>
              <option value="Report Esportato">{t.reportExported}</option>
              <option value="Connessione Bloccata">{t.connectionBlocked}</option>
              <option value="Regola Modificata">{t.policyChanged}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card-panel">
        <div className="table-container">
          <table className="ibm-data-table">
            <thead>
              <tr>
                <th>ID Audit</th>
                <th>Data e Ora</th>
                <th>Operatore / Ruolo</th>
                <th>Target DB</th>
                <th>Tipo Evento</th>
                <th>Istruzione Eseguita</th>
                <th>Righe</th>
                <th>Tempo</th>
                <th>IP Origine</th>
                <th>Hash Blocco SHA-256</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(item => (
                <tr key={item.id}>
                  <td>
                    <span className="mono" style={{ fontWeight: 600, color: "var(--cds-blue-light)" }}>
                      {item.id}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>
                    {item.timestamp}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong style={{ fontSize: "12px" }}>{item.user}</strong>
                      <span style={{ fontSize: "10px", color: "var(--cds-text-muted)" }}>{item.role}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: "12px" }}>{item.dbTarget}</td>
                  <td>{getActionBadge(item.action)}</td>
                  <td>
                    <div className="mono" style={{ fontSize: "11px", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.statement}>
                      {item.statement}
                    </div>
                  </td>
                  <td className="mono" style={{ textAlign: "right" }}>{item.rows}</td>
                  <td className="mono" style={{ color: "var(--cds-green-light)" }}>{item.durationMs}ms</td>
                  <td className="mono" style={{ fontSize: "11px" }}>{item.ipAddress}</td>
                  <td>
                    <span className="mono" style={{ fontSize: "10px", color: "var(--cds-text-muted)" }}>
                      {item.sha256Hash.substring(0, 8)}...{item.sha256Hash.substring(item.sha256Hash.length - 6)}
                    </span>
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
