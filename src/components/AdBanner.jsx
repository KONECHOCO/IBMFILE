import { useEffect } from "react";
import { useMonetization } from "../services/monetization";

// The real AdMob banner is drawn by the native layer over the WebView, at the bottom.
// Here we only publish its height as --ad-banner-height, so the mobile tab bar and the
// page padding move above it instead of being covered. Web version: no ads.
export default function AdBanner() {
  const { native, isPro, bannerHeight } = useMonetization();
  const height = native && !isPro ? bannerHeight : 0;

  useEffect(() => {
    document.documentElement.style.setProperty("--ad-banner-height", `${height}px`);
  }, [height]);

  return null;
}
