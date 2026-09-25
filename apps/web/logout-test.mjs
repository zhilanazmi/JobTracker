import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();
await page.request.post("http://localhost:3000/api/auth/login", { data: { email: "authtest@test.id", password: "Password123!" } });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
// Klik avatar → menu muncul → Keluar
await page.click('button[aria-label="Menu akun"]');
await page.waitForTimeout(300);
await page.click('button[role="menuitem"]');
await page.waitForURL("**/login", { timeout: 10000 });
console.log("logout via UI → /login : OK");
await page.screenshot({ path: "../../docs/screenshots/auth-login-after-logout.png" });
await browser.close();
