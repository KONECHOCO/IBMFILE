import React, { useState } from "react";
import { 
  CalendarClock, 
  Play, 
  Plus, 
  Mail, 
  Server, 
  Cloud, 
  FolderSync, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Send,
  AlertCircle,
  Pause,
  Trash2
} from "lucide-react";
import { MOCK_SCHEDULE_JOBS } from "../data/mockDatabase";

export default function USchedule({ lang, translations, onLogActivity }) {
  const t = translations[lang]?.uSchedule || translations.en.uSchedule;

  const [jobs, setJobs] = useState(MOCK_SCHEDULE_JOBS);
  const [runningJobId, setRunningJobId] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [showNewJobModal, setShowNewJobModal] = useState(false);

  // Form state
  const [newJobName, setNewJobName] = useState("");
  const [newQuerySource, setNewQuerySource] = useState("SELECT * FROM PRODLIB/CUSTMAST WHERE OPEN_BALANCE > 50000");
  const [newFrequency, setNewFrequency] = useState("Ogni Giorno alle 08:00 (Cron: 0 8 * * *)");
  const [newTargetChannel, setNewTargetChannel] = useState("Email (SMTP / Outlook)");
  const [newRecipient, setNewRecipient] = useState("amministrazione@enterprise.com");
  const [newFormat, setNewFormat] = useState("Excel (.xlsx)");

  const handleRunNow = (job) => {
    setRunningJobId(job.id);
    setTimeout(() => {
      setRunningJobId(null);
      setSuccessToast(`Report '${job.name}' generato ed inviato a ${job.recipient}!`);
      setTimeout(() => setSuccessToast(null), 4000);

      if (onLogActivity) {
        onLogActivity({
          user: "U-Schedule Engine",
          role: "Automated Scheduler",
          dbTarget: "IBM i (AS/400)",
          action: "Report Esportato",
          statement: `AUTOMATED DISPATCH: ${job.name} -> ${job.targetChannel}`,
          rows: 45,
          durationMs: 820,
          piiMasked: true
        });
      }
    }, 1200);
  };

  const handleCreateJob = (e) => {
    e.preventDefault();
    if (!newJobName.trim()) return;

    const newJob = {
      id: `JOB-${Math.floor(Math.random() * 900) + 100}`,
      name: newJobName.trim(),
      querySource: newQuerySource,
      frequency: newFrequency,
      nextRun: "Domani alle 08:00",
      targetChannel: newTargetChannel,
      recipient: newRecipient,
      format: newFormat,
      status: "ACTIVE",
      lastDuration: "1.2s",
      lastRunSuccess: true
    };

    setJobs([newJob, ...jobs]);
    setShowNewJobModal(false);
    setNewJobName("");

    if (onLogActivity) {
      onLogActivity({
        user: "Current Operator",
        role: "Job Administrator",
        dbTarget: "U-Schedule Engine",
        action: "Pianificazione Creata",
        statement: `SCHEDULE CREATED: ${newJob.name} (${newJob.frequency})`,
        rows: 1,
        durationMs: 15,
        piiMasked: true
      });
    }
  };

  const handleDeleteJob = (id) => {
    setJobs(jobs.filter(j => j.id !== id));
  };

  const getChannelIcon = (channel) => {
    if (channel.includes("Email")) return <Mail size={14} color="var(--cds-blue-light)" />;
    if (channel.includes("SFTP")) return <Server size={14} color="var(--cds-green-light)" />;
    if (channel.includes("SharePoint") || channel.includes("S3")) return <Cloud size={14} color="var(--cds-magenta)" />;
    return <FolderSync size={14} color="var(--cds-amber)" />;
  };

  return (
    <div className="uschedule-root">
      {/* Header */}
      <div className="card-panel-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1 className="card-title">
            <CalendarClock size={20} color="var(--cds-blue-light)" />
            {t.title}
          </h1>
          <p className="card-subtitle">{t.subtitle}</p>
        </div>

        <button 
          className="ibm-btn ibm-btn-primary"
          onClick={() => setShowNewJobModal(true)}
        >
          <Plus size={15} />
          {t.newJobBtn}
        </button>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="ibm-badge ibm-badge-green" style={{ width: "100%", padding: "10px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="kpi-grid">
        <div className="kpi-card green">
          <span className="kpi-label">{t.statsSuccess}</span>
          <span className="kpi-value">1,428</span>
          <span className="kpi-subtext">99.9% Affidabilità Consegna</span>
        </div>

        <div className="kpi-card teal">
          <span className="kpi-label">{t.statsSavedHours}</span>
          <span className="kpi-value">160 Ore</span>
          <span className="kpi-subtext">Zero Lavoro Manuale IT</span>
        </div>

        <div className="kpi-card magenta">
          <span className="kpi-label">Pianificazioni Attive</span>
          <span className="kpi-value">{jobs.length} Processi</span>
          <span className="kpi-subtext">Multi-Canale Configurato</span>
        </div>

        <div className="kpi-card amber">
          <span className="kpi-label">{t.statsErrors}</span>
          <span className="kpi-value">0</span>
          <span className="kpi-subtext">Nessun Errore di Canale (30gg)</span>
        </div>
      </div>

      {/* NEW JOB MODAL */}
      {showNewJobModal && (
        <div className="card-panel" style={{ border: "2px solid var(--cds-blue)", background: "var(--cds-bg-surface-0)" }}>
          <div className="card-panel-header">
            <span className="card-title" style={{ fontSize: "15px" }}>Configura Nuova Automazione Report</span>
            <button className="btn-icon" onClick={() => setShowNewJobModal(false)}>✕</button>
          </div>

          <form onSubmit={handleCreateJob} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Nome Report:</label>
              <input 
                type="text" 
                className="ai-input" 
                placeholder="Es: Bilancio Settimanale Vendite EMEA"
                value={newJobName}
                onChange={(e) => setNewJobName(e.target.value)}
                style={{ width: "100%" }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Frequenza Esecuzione:</label>
              <select 
                className="select-control mono" 
                style={{ width: "100%" }}
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value)}
              >
                <option value="Ogni Giorno alle 08:00 (Cron: 0 8 * * *)">Ogni Giorno alle 08:00</option>
                <option value="Ogni Lunedì alle 07:00 (Cron: 0 7 * * 1)">Ogni Lunedì alle 07:00</option>
                <option value="1° Giorno del Mese (Cron: 0 0 1 * *)">Mensile (1° giorno del mese)</option>
                <option value="Ogni 15 Minuti (Cron: */15 * * * *)">Real-time Batch (Ogni 15 min)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Canale di Consegna:</label>
              <select 
                className="select-control" 
                style={{ width: "100%" }}
                value={newTargetChannel}
                onChange={(e) => setNewTargetChannel(e.target.value)}
              >
                <option value="Email (SMTP / Outlook)">Email (SMTP / Outlook)</option>
                <option value="SFTP Sicuro (SSH)">SFTP Sicuro (SSH / Port 22)</option>
                <option value="SharePoint / S3 Cloud">SharePoint / S3 Cloud</option>
                <option value="Condivisione LAN (SMB)">Condivisione LAN (SMB / NAS)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Destinatario / Percorso:</label>
              <input 
                type="text" 
                className="ai-input" 
                placeholder="Es: cfo@enterprise.it o sftp://server/path"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                style={{ width: "100%" }}
                required
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Formato File:</label>
              <div style={{ display: "flex", gap: "10px" }}>
                {["Excel (.xlsx)", "CSV", "PDF Dossier", "XML"].map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    className={`ibm-badge ${newFormat === fmt ? "ibm-badge-blue" : "ibm-badge-secondary"}`}
                    style={{ padding: "6px 12px", cursor: "pointer" }}
                    onClick={() => setNewFormat(fmt)}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <button type="button" className="ibm-btn ibm-btn-secondary" onClick={() => setShowNewJobModal(false)}>
                Annulla
              </button>
              <button type="submit" className="ibm-btn ibm-btn-primary">
                Salva e Attiva Job
              </button>
            </div>
          </form>
        </div>
      )}

      {/* JOBS LIST */}
      <div className="card-panel">
        <div className="card-panel-header">
          <span className="card-title" style={{ fontSize: "14px" }}>
            <Clock size={16} color="var(--cds-blue-light)" />
            {t.scheduledJobs}
          </span>
          <span className="mono" style={{ fontSize: "11px", color: "var(--cds-text-muted)" }}>
            Engine U-Schedule v4.2 &bull; Cron Daemon Attivo
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {jobs.map((job) => (
            <div 
              key={job.id}
              style={{
                background: "var(--cds-bg-surface-1)",
                border: "1px solid var(--cds-border-subtle)",
                borderRadius: "2px",
                padding: "16px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                transition: "var(--cds-transition)"
              }}
            >
              <div style={{ flex: "2", minWidth: "240px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span className="ibm-badge ibm-badge-blue" style={{ fontSize: "10px" }}>{job.id}</span>
                  <strong style={{ fontSize: "14px", color: "var(--cds-text-primary)" }}>{job.name}</strong>
                  <span className="ibm-badge ibm-badge-green" style={{ fontSize: "10px" }}>{job.format}</span>
                </div>
                <div className="mono" style={{ fontSize: "11px", color: "var(--cds-text-muted)", marginBottom: "4px" }}>
                  Query: {job.querySource}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "var(--cds-text-secondary)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={13} color="var(--cds-text-muted)" />
                    <span>{job.frequency}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {getChannelIcon(job.targetChannel)}
                    <span className="mono">{job.recipient}</span>
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ textAlign: "right", marginRight: "6px" }}>
                  <div style={{ fontSize: "10px", color: "var(--cds-text-muted)" }}>Prossimo Invio:</div>
                  <div className="mono" style={{ fontSize: "12px", fontWeight: 600 }}>{job.nextRun}</div>
                </div>

                <button 
                  className="ibm-btn ibm-btn-primary ibm-btn-sm"
                  onClick={() => handleRunNow(job)}
                  disabled={runningJobId === job.id}
                >
                  <Send size={13} />
                  {runningJobId === job.id ? "Invio in corso..." : t.runNow}
                </button>

                <button 
                  className="btn-icon" 
                  style={{ width: "30px", height: "30px" }}
                  onClick={() => handleDeleteJob(job.id)}
                  title="Elimina Pianificazione"
                >
                  <Trash2 size={13} color="var(--cds-red-light)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
