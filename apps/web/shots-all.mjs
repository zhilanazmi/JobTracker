import { chromium } from "playwright-core";
const PAGES = [
  ["", "dashboard"], ["panduan", "panduan"], ["setup", "setup"], ["portal", "portal"],
  ["tracker", "tracker-table"], ["tracker?view=kanban", "tracker-kanban"], ["dokumen", "dokumen"],
  ["kontak", "kontak"], ["upskill", "upskill"], ["interview", "interview"],
  ["interview/latihan", "interview-latihan"], ["gaji", "gaji"], ["offer", "offer"],
];
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();
await page.request.post("http://localhost:3000/api/auth/login", { data: { email: "shot@test.id", password: "Password123!" } });
for (const theme of ["light", "dark"]) {
  for (const [path, name] of PAGES) {
    await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
    await page.goto(`http://localhost:5173/${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `../../docs/screenshots/${name}-${theme}.png`, fullPage: false });
  }
}
await browser.close();
console.log("OK");
