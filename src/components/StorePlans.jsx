import React, { useEffect, useState } from "react";
import { Crown, Building2, Clock, AlertTriangle } from "lucide-react";
import { isWindowsStoreApp, onPurchaseResult, purchase } from "../native/windowsStore";

export function trialDaysLeft(expires) {
  if (!expires) return null;
  return Math.max(0, Math.ceil((new Date(expires) - Date.now()) / 86400000));
}

/** The plans a Microsoft Store user can buy; prices are shown by the Store's own dialog. */
export function StorePlans({ u, license }) {
  const [message, setMessage] = useState(null);
  useEffect(() => onPurchaseResult(({ status }) => setMessage(status === "error" ? u.store.purchaseError : null)), [u]);

  const plans = [
    { sku: "pro", icon: Crown, title: u.store.proTitle, text: u.store.proText },
    { sku: "business", icon: Building2, title: u.store.businessTitle, text: u.store.businessText },
  ].filter((p) => !(license.plan === "business" || (license.plan === "pro" && p.sku === "pro")));

  if (!plans.length) return null;
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
        {plans.map(({ sku, icon: Icon, title, text }) => (
          <div key={sku} className="card-panel" style={{ flex: "1 1 240px", margin: 0, padding: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, marginBottom: "6px" }}>
              <Icon size={16} color="var(--cds-amber)" />
              {title}
            </div>
            <p style={{ fontSize: "12px", color: "var(--cds-text-secondary)", marginTop: 0 }}>{text}</p>
            <button className="ibm-btn ibm-btn-primary ibm-btn-sm" disabled={!isWindowsStoreApp()} onClick={() => purchase(sku)}>
              {u.store.buy}
            </button>
          </div>
        ))}
      </div>
      {message && <p style={{ fontSize: "12px", color: "var(--cds-red-light)" }}>{message}</p>}
    </div>
  );
}

/** Trial countdown, or the end-of-trial notice with the plans to buy. */
export default function StoreBanner({ u, license }) {
  if (!license?.store || license.plan === "pro" || license.plan === "business") return null;
  if (license.plan === "trial") {
    const days = trialDaysLeft(license.expires);
    return (
      <div className="card-panel" style={{ padding: "10px 14px", fontSize: "12px", background: "rgba(15, 98, 254, 0.06)", borderColor: "rgba(15, 98, 254, 0.3)" }}>
        <Clock size={14} style={{ verticalAlign: "-2px", marginRight: "6px" }} />
        {days === null ? u.store.trialActive : u.store.trialDays.replace("{n}", days)}
      </div>
    );
  }
  return (
    <div className="card-panel" style={{ padding: "14px", background: "rgba(218, 30, 40, 0.08)", borderColor: "rgba(218, 30, 40, 0.4)" }}>
      <div style={{ fontWeight: 700, marginBottom: "10px", fontSize: "13px" }}>
        <AlertTriangle size={15} style={{ verticalAlign: "-2px", marginRight: "6px", color: "var(--cds-red-light)" }} />
        {u.store.trialEnded}
      </div>
      <StorePlans u={u} license={license} />
    </div>
  );
}
