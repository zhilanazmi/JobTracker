// Screenshot harness — checkpoint visual. Usage: node screenshot.mjs <url> <out-prefix>
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const url = process.argv[2] ?? "http://localhost:5173/dev/components";
const prefix = process.argv[3] ?? "dev-components";
mkdirSync("../../docs/screenshots", { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
});
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
  const page = await ctx.newPage();
  await page.addInitScript((t) => {
    localStorage.setItem("theme", t);
  }, theme);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `../../docs/screenshots/${prefix}-desktop-${theme}.png`, fullPage: true });

  const mobile = await ctx.newPage();
  await mobile.addInitScript((t) => localStorage.setItem("theme", t), theme);
  await mobile.goto(url, { waitUntil: "networkidle" });
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.waitForTimeout(300);
  await mobile.screenshot({ path: `../../docs/screenshots/${prefix}-mobile-${theme}.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
console.log("OK");
