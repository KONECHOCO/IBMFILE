// Bridge to the Windows desktop shell (desktop/), which owns all Microsoft Store purchases.
const webview = () => window.chrome?.webview;

export const isWindowsStoreApp = () => !!webview();

/** Opens the Store purchase dialog. The shell reloads the page when the plan changes. */
export function purchase(sku) {
  webview()?.postMessage({ type: "purchase", sku });
}

/** Calls back with {sku, status} after the Store dialog closes. Returns an unsubscribe function. */
export function onPurchaseResult(callback) {
  const wv = webview();
  if (!wv) return () => {};
  const listener = (e) => {
    if (e.data?.type === "purchase-result") callback(e.data);
  };
  wv.addEventListener("message", listener);
  return () => wv.removeEventListener("message", listener);
}
