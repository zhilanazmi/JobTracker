import { chromium } from "playwright-core";

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });

// Login dulu di tab pertama agar cookie tersimpan di context
const page = await ctx.newPage();
const res = await page.request.post("http://localhost:3000/api/auth/login", {
  data: { email: "shot@test.id", password: "Password123!" },
});
console.log("login:", res.status());

// Screenshot Dashboard
for (const theme of ["light", "dark"]) {
  await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `../../docs/screenshots/dashboard-desktop-${theme}.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `../../docs/screenshots/dashboard-mobile-${theme}.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1024 });
}

// Tracker tabel + kanban + drawer
for (const theme of ["light", "dark"]) {
  await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
  await page.goto("http://localhost:5173/tracker", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `../../docs/screenshots/tracker-table-${theme}.png`, fullPage: false });
  await page.goto("http://localhost:5173/tracker?view=kanban", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `../../docs/screenshots/tracker-kanban-${theme}.png`, fullPage: false });
}
await browser.close();
console.log("OK");
