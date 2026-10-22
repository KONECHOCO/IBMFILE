import { Capacitor } from "@capacitor/core";

/** QR scanning is offered only in the iOS/Android apps (the web version already runs on the gateway). */
export const canScanQr = () => Capacitor.isNativePlatform();

/** Turns the QR text (the gateway URL shown in Administration → Devices) into a base URL. */
export function parseGatewayQr(text) {
  try {
    const url = new URL(String(text || "").trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Opens the camera; resolves to the gateway base URL, or null if cancelled / not a gateway QR. */
export async function scanGatewayUrl(instructions) {
  const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } = await import("@capacitor/barcode-scanner");
  const result = await CapacitorBarcodeScanner.scanBarcode({
    hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
    scanInstructions: instructions,
    scanButton: false,
  });
  return parseGatewayQr(result?.ScanResult);
}
