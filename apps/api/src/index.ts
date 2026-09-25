import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requireAuth, handleRegister, handleLogin, handleRefresh, handleLogout } from "./auth";
import { dashboardRoutes } from "./routes/dashboard";
import { applicationRoutes } from "./routes/applications";
import { registerResources } from "./routes/resources";
import { optionRoutes, extraRoutes } from "./routes/options";
import { exportRoutes } from "./routes/export";
import { profileRoutes } from "./routes/profile";
import { NotFoundError } from "./services/applications";
import { HTTPException } from "hono/http-exception";

const app = new Hono();

app.use(logger());
app.use(
  "*",
  cors({
    origin: (origin) => (origin === process.env.WEB_ORIGIN ? origin : null),
    credentials: true,
  }),
);

/** CSRF: request mutasi wajib Origin sama dengan WEB_ORIGIN (prompt §6). */
const MUTATIONS = new Set(["POST", "PATCH", "PUT", "DELETE"]);
app.use("*", async (c, next) => {
  if (MUTATIONS.has(c.req.method)) {
    const origin = c.req.header("Origin");
    if (origin && origin !== process.env.WEB_ORIGIN) {
      return c.json({ error: { code: "CSRF", message: "Origin tidak diizinkan" } }, 403);
    }
  }
  await next();
});

/** Rate limit in-memory untuk login/register (prompt §6). */
const buckets = new Map<string, { count: number; reset: number }>();
function rateLimit(max: number, windowMs: number) {
  return async (c: any, next: () => Promise<void>) => {
    const ip = c.req.header("x-forwarded-for") ?? "local";
    const now = Date.now();
    const b = buckets.get(ip);
    if (!b || b.reset < now) {
      buckets.set(ip, { count: 1, reset: now + windowMs });
    } else {
      b.count++;
      if (b.count > max) {
        return c.json({ error: { code: "RATE_LIMIT", message: "Terlalu banyak percobaan" } }, 429);
      }
    }
    await next();
  };
}

app.onError((err, c) => {
  if (err instanceof NotFoundError) {
    // 404, bukan 403 — tidak bocorkan keberadaan data (prompt §6).
    return c.json({ error: { code: "NOT_FOUND", message: "Resource tidak ditemukan" } }, 404);
  }
  if (err instanceof HTTPException) {
    // 401 auth dsb. — respons wajar, bukan 500.
    return c.json({ error: { code: err.status === 401 ? "UNAUTHENTICATED" : "ERROR", message: err.message } }, err.status);
  }
  console.error(err);
  return c.json({ error: { code: "INTERNAL", message: "Terjadi kesalahan" } }, 500);
});

// Auth
app.post("/api/auth/register", rateLimit(10, 60_000), handleRegister);
app.post("/api/auth/login", rateLimit(10, 60_000), handleLogin);
app.post("/api/auth/refresh", handleRefresh);
app.post("/api/auth/logout", handleLogout);

// Protected
app.use("/api/*", requireAuth);

app.route("/api/dashboard", dashboardRoutes);
app.route("/api/applications", applicationRoutes);
app.route("/api/options", optionRoutes);
app.route("/api/export", exportRoutes);
app.route("/api", extraRoutes); // sample-data, offers/from-application
app.route("/api/profile", profileRoutes);
registerResources(app);

app.get("/api/health", (c) => c.json({ ok: true }));

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API jalan di http://localhost:${info.port}`);
});
