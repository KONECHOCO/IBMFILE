// Store screenshots from the real web app, with real data from the public demo gateway.
// Prerequisite: `PLEXA_GATEWAY_URL=https://plexa.ikonetsolutions.com npm run dev -- --port 5174`
// Usage: node scripts/capture-store-screenshots.mjs [iphone|ipad|android] [it|en|fr|es|de|ja]
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { translations } from "../src/i18n/translations.js";

const device = ["ipad", "android"].includes(process.argv[2]) ? process.argv[2] : "iphone";
const lang = process.argv[3] || "it";
const t = translations[lang];
const SIZES = {
  iphone: { viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, suffix: "1320x2868" },
  ipad: { viewport: { width: 1032, height: 1376 }, deviceScaleFactor: 2, suffix: "ipad-2064x2752" },
  android: { viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, suffix: "android-1080x1920" },
};
const size = SIZES[device];
const BASE = "http://localhost:5174";
const OUT = `store-assets/screenshots/${lang}`;
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: size.viewport, deviceScaleFactor: size.deviceScaleFactor, isMobile: device !== "ipad", hasTouch: true, locale: lang,
});
await context.addInitScript((l) => localStorage.setItem("plexa.lang", l), lang);
const page = await context.newPage();

const shot = async (name) => {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${name}-${size.suffix}.png` });
  console.log("saved", lang, device, name);
};
const nav = (key) => page.locator("nav.mobile-tab-bar button:visible, .sidebar-nav-list button:visible").filter({ hasText: t.nav[key] }).first().click();

// 1) Sign-in screen with the public demo
await page.goto(`${BASE}/?storeshot`);
await page.getByText(t.ui.publicDemoTitle).waitFor({ timeout: 30000 });
await shot("01-accesso");

// Sign in to the public demo
await page.getByRole("button", { name: t.ui.enterDemo }).click();
await page.locator("h1.card-title").filter({ hasText: t.queryCentral.title }).waitFor({ timeout: 30000 });

// 2) Query Studio: wizard + results
await page.getByRole("button", { name: t.queryCentral.runQuery, exact: true }).click();
await page.locator(".ibm-data-table tbody tr").first().waitFor({ timeout: 30000 });
await page.locator(".ibm-data-table").first().scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, -260));
await shot("02-query");

// 3) Ready-made query + chart
await page.evaluate(() => window.scrollTo(0, 0));
await page.getByRole("button", { name: t.queryCentral.tabAi }).click();
await page.getByRole("button", { name: t.ui.examples.monthlyRevenue }).click();
await page.getByRole("button", { name: t.queryCentral.runQuery, exact: true }).click();
await page.waitForTimeout(1500);
await page.getByRole("button", { name: t.queryCentral.chartMode }).click();
await page.locator("select").filter({ has: page.locator('option[value="REVENUE"]') }).filter({ hasNot: page.locator('option[value="MONTH"]') }).selectOption("REVENUE");
await page.getByText(t.ui.results, { exact: true }).first().evaluate((el) => el.scrollIntoView({ block: "start" }));
await page.evaluate(() => window.scrollBy(0, -80));
await shot("03-grafico");

// 4) Data catalog
await page.evaluate(() => window.scrollTo(0, 0));
await nav("uMetadocs");
await page.getByText("main.CUSTOMERS").waitFor();
await page.waitForTimeout(1500);
await page.getByRole("button", { name: /^ORDERS/ }).first().click();
await page.getByText("main.ORDERS").waitFor();
await page.waitForTimeout(1500);
await shot("04-catalogo");

// 5) Pro
await page.evaluate(() => window.scrollTo(0, 0));
await page.locator(`button[title="${t.ui.pro.title}"]`).click();
await shot("05-pro");

await browser.close();
