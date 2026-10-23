import React, { useState } from "react";
import { X, Crown, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { useMonetization, buyPro, restorePro } from "../services/monetization";

export default function ProModal({ isOpen, onClose, u }) {
  const { native, isPro, proPrice } = useMonetization();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  if (!isOpen) return null;
  const p = u.pro;

  const run = async (fn, okMsg, failMsg) => {
    setBusy(true);
    setMessage(null);
    try {
      setMessage((await fn()) ? okMsg : failMsg);
    } catch (err) {
      console.warn("Pro purchase error", err);
      setMessage(p.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))" }}>
      <div className="card-panel" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "400px", margin: 0, borderColor: "var(--cds-amber)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--cds-amber)", color: "#161616", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Crown size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "17px" }}>{p.title}</div>
              <div style={{ fontSize: "12px", color: "var(--cds-text-muted)" }}>{p.subtitle}</div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {[p.noAds, p.support].map((b) => (
            <li key={b} style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px" }}>
              <CheckCircle2 size={16} color="var(--cds-green-light)" style={{ flexShrink: 0 }} />
              {b}
            </li>
          ))}
        </ul>

        {isPro ? (
          <div className="ibm-badge ibm-badge-green" style={{ display: "block", textAlign: "center", padding: "10px" }}>{p.owned}</div>
        ) : !native ? (
          <div style={{ fontSize: "12px", color: "var(--cds-text-muted)", textAlign: "center" }}>{p.webOnly}</div>
        ) : (
          <>
            <button className="ibm-btn ibm-btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy}
              onClick={() => run(buyPro, p.owned, p.error)}>
              {busy ? <Loader2 size={15} /> : <Crown size={15} />}
              {/* The localized price comes from the store; this is only the fallback */}
              {p.buy.replace("{price}", proPrice || p.fallbackPrice)}
            </button>
            <button className="ibm-btn ibm-btn-secondary ibm-btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: "8px" }} disabled={busy}
              onClick={() => run(restorePro, p.restored, p.notFound)}>
              <RotateCcw size={13} />
              {p.restore}
            </button>
          </>
        )}
        {message && <p style={{ fontSize: "12px", textAlign: "center", marginBottom: 0 }}>{message}</p>}
      </div>
    </div>
  );
}
