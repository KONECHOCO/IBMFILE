import React, { useState } from "react";
import { useMonetization } from "../services/monetization";

// Ads diagnostics panel: shown only with test ads on (7 taps on the logo).
export default function AdDiagnostics() {
  const { testAds, diag, native, adsReady, isPro } = useMonetization();
  const [open, setOpen] = useState(true);
  // ?storeshot (dev only) is used for the store screenshots: no debug panel there
  if (!testAds || !native || location.search.includes("storeshot")) return null;
  return (
    <div style={{ position: "fixed", left: 8, right: 8, bottom: "calc(96px + var(--ad-banner-height, 0px))", zIndex: 1001, borderRadius: 8,
      background: "rgba(0,0,0,0.85)", border: "1px solid var(--cds-amber)", color: "#fde68a", fontFamily: "var(--font-mono)", fontSize: "10px" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", textAlign: "left", padding: "4px 8px", background: "none", border: 0, color: "var(--cds-amber)", fontWeight: 700 }}>
        ADS DEBUG · ready={String(adsReady)} pro={String(isPro)} {open ? "▼" : "▲"}
      </button>
      {open && (
        <div style={{ maxHeight: 180, overflowY: "auto", padding: "0 8px 8px" }}>
          {(diag || []).map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}
