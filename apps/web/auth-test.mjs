import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();

// Screenshot halaman login light + dark
for (const theme of ["light", "dark"]) {
  await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
  await page.goto("http://localhost:5173/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `../../docs/screenshots/auth-login-${theme}.png` });
}

// Alur register user baru
await page.goto("http://localhost:5173/register", { waitUntil: "networkidle" });
await page.fill('input[autocomplete="name"]', "Auth Test");
await page.fill('input[autocomplete="email"]', "authtest@test.id");
await page.fill('input[autocomplete="new-password"]', "Password123!");
await page.click('button[type="submit"]');
await page.waitForURL("http://localhost:5173/", { timeout: 15000 });
console.log("register → redirect / : OK");
await page.waitForTimeout(1000);
await page.screenshot({ path: "../../docs/screenshots/auth-after-register.png" });

// Logout via API lalu coba akses dashboard → harus ke /login
await ctx.request.post("http://localhost:3000/api/auth/logout");
await page.goto("http://localhost:5173/tracker", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
console.log("after logout URL:", page.url());

// Login lagi dengan user tadi
await page.goto("http://localhost:5173/login", { waitUntil: "networkidle" });
await page.fill('input[autocomplete="email"]', "authtest@test.id");
await page.fill('input[autocomplete="current-password"]', "Password123!");
await page.click('button[type="submit"]');
await page.waitForURL("http://localhost:5173/", { timeout: 15000 });
console.log("login ulang → / : OK");
await browser.close();
