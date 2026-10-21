import React, { useState, useEffect } from "react";
import { 
  Layers, 
  Search, 
  FileCode, 
  FolderTree, 
  Shield, 
  Lock, 
  GitBranch, 
  ArrowRight, 
  Database,
  Tag,
  Key
} from "lucide-react";
import { MOCK_TABLES } from "../data/mockDatabase";

export default function UMetadocs({ lang, translations, activeDb }) {
  const t = translations[lang]?.uMetadocs || translations.en.uMetadocs;

  const [searchQuery, setSearchQuery] = useState("");
  const allTables = MOCK_TABLES[activeDb.id] || [];
  const [selectedTable, setSelectedTable] = useState(allTables[0]);

  useEffect(() => {
    const tables = MOCK_TABLES[activeDb.id] || [];
    if (tables.length > 0) {
      setSelectedTable(tables[0]);
    }
  }, [activeDb.id]);

  const filteredTables = allTables.filter(tbl => {
    return tbl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           tbl.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="umetadocs-root">
      {/* Header */}
      <div className="card-panel-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1 className="card-title">
            <Layers size={20} color="var(--cds-blue-light)" />
            {t.title}
          </h1>
          <p className="card-subtitle">{t.subtitle}</p>
        </div>

        <span className="ibm-badge ibm-badge-blue">
          CATALOGO V7R5 SINCRO LIVE
        </span>
      </div>

      {/* Search Input */}
      <div className="card-panel" style={{ padding: "12px 16px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Search size={16} style={{ color: "var(--cds-text-muted)" }} />
          <input 
            type="text" 
            className="ai-input"
            placeholder={t.searchMeta}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", border: "none", background: "transparent" }}
          />
        </div>
      </div>

      {/* Main Layout: Schema Tree on Left, Column Dictionary on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {/* Left: Files / Tables Browser */}
        <div className="card-panel" style={{ margin: 0 }}>
          <div className="card-panel-header">
            <span className="card-title" style={{ fontSize: "14px" }}>
              <FolderTree size={16} color="var(--cds-blue-light)" />
              {t.physicalFiles}
            </span>
            <span className="mono" style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>
              {filteredTables.length} Archivi
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {filteredTables.map(tbl => (
              <button
                key={tbl.id}
                onClick={() => setSelectedTable(tbl)}
                style={{
                  textAlign: "left",
                  padding: "10px 14px",
                  background: selectedTable?.id === tbl.id ? "var(--cds-bg-surface-2)" : "var(--cds-bg-surface-1)",
                  border: `1px solid ${selectedTable?.id === tbl.id ? "var(--cds-blue)" : "var(--cds-border-subtle)"}`,
                  borderRadius: "2px",
                  cursor: "pointer",
                  color: "inherit",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div className="mono" style={{ fontWeight: 600, fontSize: "13px", color: selectedTable?.id === tbl.id ? "var(--cds-blue-light)" : "var(--cds-text-primary)" }}>
                    {tbl.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>
                    {tbl.description}
                  </div>
                </div>
                <span className="ibm-badge ibm-badge-secondary" style={{ fontSize: "10px" }}>
                  {tbl.type}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Selected Table Field Dictionary */}
        <div className="card-panel" style={{ margin: 0, flex: 2 }}>
          <div className="card-panel-header">
            <div>
              <span className="card-title" style={{ fontSize: "14px" }}>
                <FileCode size={16} color="var(--cds-teal)" />
                Dizionario Colonne: {selectedTable?.name}
              </span>
              <span style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>
                {selectedTable?.description}
              </span>
            </div>
            <span className="ibm-badge ibm-badge-green">
              {selectedTable?.columns.length} Colonne Verificate
            </span>
          </div>

          <div className="table-container">
            <table className="ibm-data-table">
              <thead>
                <tr>
                  <th>{t.fieldName}</th>
                  <th>{t.fieldDesc}</th>
                  <th>{t.dataType}</th>
                  <th>{t.sensitivity}</th>
                </tr>
              </thead>
              <tbody>
                {selectedTable?.columns.map(col => (
                  <tr key={col.name}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="mono" style={{ fontWeight: 600 }}>{col.name}</span>
                        {col.pk && <Key size={12} color="var(--cds-amber)" title="Primary Key" />}
                      </div>
                    </td>
                    <td style={{ fontSize: "12px" }}>{col.desc}</td>
                    <td>
                      <span className="mono" style={{ fontSize: "11px", color: "var(--cds-blue-light)" }}>
                        {col.type}
                      </span>
                    </td>
                    <td>
                      {col.pii ? (
                        <span className="ibm-badge ibm-badge-amber" style={{ fontSize: "10px" }}>
                          <Lock size={10} />
                          Sensibile PII (GDPR)
                        </span>
                      ) : (
                        <span className="ibm-badge ibm-badge-secondary" style={{ fontSize: "10px" }}>
                          Aziendale Standard
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION: VISUAL DATA LINEAGE FLOW */}
      <div className="card-panel">
        <div className="card-panel-header">
          <div>
            <span className="card-title" style={{ fontSize: "14px" }}>
              <GitBranch size={16} color="var(--cds-magenta)" />
              {t.lineageTitle}
            </span>
            <p className="card-subtitle">{t.lineageDesc}</p>
          </div>
          <span className="ibm-badge ibm-badge-blue">AUDIT GRAPH</span>
        </div>

        {/* Visual Flow diagram nodes */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "14px", padding: "16px 0" }}>
          {/* Node 1: Physical File on IBM i */}
          <div style={{ background: "var(--cds-bg-surface-1)", border: "1px solid var(--cds-border-strong)", borderLeft: "4px solid var(--cds-blue)", padding: "14px", borderRadius: "2px", flex: 1, minWidth: "180px" }}>
            <div style={{ fontSize: "10px", color: "var(--cds-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>1. Origine Dati</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: "13px", marginTop: "2px" }}>PRODLIB / CUSTMAST</div>
            <div style={{ fontSize: "11px", color: "var(--cds-text-secondary)" }}>File Fisico Db2/400 (LPAR)</div>
          </div>

          <ArrowRight size={18} color="var(--cds-border-strong)" />

          {/* Node 2: Logical View */}
          <div style={{ background: "var(--cds-bg-surface-1)", border: "1px solid var(--cds-border-strong)", borderLeft: "4px solid var(--cds-teal)", padding: "14px", borderRadius: "2px", flex: 1, minWidth: "180px" }}>
            <div style={{ fontSize: "10px", color: "var(--cds-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>2. Vista di Governance</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: "13px", marginTop: "2px" }}>CUSTBAL_V (Logical File)</div>
            <div style={{ fontSize: "11px", color: "var(--cds-text-secondary)" }}>Perimetro Sola Lettura &amp; Masking</div>
          </div>

          <ArrowRight size={18} color="var(--cds-border-strong)" />

          {/* Node 3: U-Query Central Approved Definition */}
          <div style={{ background: "var(--cds-bg-surface-1)", border: "1px solid var(--cds-border-strong)", borderLeft: "4px solid var(--cds-magenta)", padding: "14px", borderRadius: "2px", flex: 1, minWidth: "180px" }}>
            <div style={{ fontSize: "10px", color: "var(--cds-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>3. Query IT Certificata</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: "13px", marginTop: "2px" }}>QRY_OVERDUE_50K</div>
            <div style={{ fontSize: "11px", color: "var(--cds-text-secondary)" }}>Filtraggio Conti &gt; 50.000€</div>
          </div>

          <ArrowRight size={18} color="var(--cds-border-strong)" />

          {/* Node 4: U-Schedule Dispatch */}
          <div style={{ background: "var(--cds-bg-surface-1)", border: "1px solid var(--cds-border-strong)", borderLeft: "4px solid var(--cds-green-light)", padding: "14px", borderRadius: "2px", flex: 1, minWidth: "180px" }}>
            <div style={{ fontSize: "10px", color: "var(--cds-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>4. Distribuzione Report</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: "13px", marginTop: "2px" }}>U-Schedule (Cron: Lunedì)</div>
            <div style={{ fontSize: "11px", color: "var(--cds-text-secondary)" }}>Excel cifrato &bull; SMTP Direzione Finanza</div>
          </div>
        </div>
      </div>
    </div>
  );
}
