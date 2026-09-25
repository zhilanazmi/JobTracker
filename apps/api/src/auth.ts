import { SignJWT, jwtVerify } from "jose";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";
import { hash, verify } from "@node-rs/argon2";
import { createHash, randomBytes } from "node:crypto";
import { root, db, withUser } from "./db";
import { registerSchema, loginSchema } from "@jam/shared";
import { seedUserData } from "../prisma/seed.js";
import { HTTPException } from "hono/http-exception";

const ACCESS_TTL_SEC = 15 * 60; // 15 menit (prompt §6)
const REFRESH_TTL_SEC = 30 * 24 * 60 * 60; // 30 hari

const ARGON2_OPTS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET belum diset");
  return new TextEncoder().encode(s);
}

export function isSecureCookie(c: Context): boolean {
  // Secure hanya di https; dev http localhost tetap perlu cookie jalan.
  return new URL(c.req.url).protocol === "https:";
}

export async function issueTokens(c: Context, userId: bigint): Promise<void> {
  const accessToken = await new SignJWT({ sub: userId.toString() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(secret());

  const refreshToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(refreshToken).digest("hex");

  await root.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TTL_SEC * 1000),
    },
  });

  const secure = isSecureCookie(c);
  const base = { httpOnly: true, secure, sameSite: "Lax", path: "/" } as const;
  setCookie(c, "access_token", accessToken, { ...base, maxAge: ACCESS_TTL_SEC });
  setCookie(c, "refresh_token", refreshToken, { ...base, maxAge: REFRESH_TTL_SEC });
}

/** Rotasi refresh token: hash lama dihapus, baru dibuat (prompt §6). */
export async function rotateRefresh(c: Context): Promise<bigint | null> {
  const old = getCookie(c, "refresh_token");
  if (!old) return null;
  const tokenHash = createHash("sha256").update(old).digest("hex");

  const record = await root.refreshToken.findUnique({ where: { tokenHash } });
  if (!record || record.expiresAt < new Date()) {
    if (record) await root.refreshToken.delete({ where: { id: record.id } });
    return null;
  }
  // Pakai sekali: hapus lama sebelum issue baru (rotasi).
  await root.refreshToken.delete({ where: { id: record.id } });
  await issueTokens(c, record.userId);
  return record.userId;
}

export function clearAuthCookies(c: Context): void {
  const secure = isSecureCookie(c);
  for (const name of ["access_token", "refresh_token"]) {
    deleteCookie(c, name, { path: "/", secure, httpOnly: true, sameSite: "Lax" });
  }
}

/** Middleware factory: verifikasi access token → withUser untuk handler berikutnya. */
export async function requireAuth(c: Context, next: () => Promise<void>): Promise<Response | void> {
  const token = getCookie(c, "access_token");
  if (!token) {
    throw new HTTPException(401, { message: "Tidak terautentikasi" });
  }
  try {
    const { payload } = await jwtVerify(token, secret());
    const userId = BigInt(payload.sub as string);
    c.set("userId", userId);
    // Bungkus: sisanya handler berjalan dalam scope user (isolasi terpusat).
    return withUser(userId, next);
  } catch {
    throw new HTTPException(401, { message: "Token tidak valid atau kedaluwarsa" });
  }
}

export async function handleRegister(c: Context): Promise<Response> {
  const parsed = registerSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: { code: "VALIDATION", message: "Data tidak valid", fields: parsed.error.flatten().fieldErrors } }, 400);
  }
  const { email, password, nama } = parsed.data;

  const exists = await root.user.findUnique({ where: { email } });
  if (exists) {
    return c.json({ error: { code: "EMAIL_TAKEN", message: "Email sudah terdaftar" } }, 409);
  }

  const passwordHash = await hash(password, ARGON2_OPTS);
  const user = await root.user.create({
    data: { email, passwordHash, profile: { create: { nama } } },
  });

  // Seed otomatis (prompt §6): option_lists default, 21 portal, data contoh.
  await seedUserData(user.id, true);

  await issueTokens(c, user.id);
  return c.json({ id: user.id.toString(), email: user.email }, 201);
}

export async function handleLogin(c: Context): Promise<Response> {
  const parsed = loginSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: { code: "VALIDATION", message: "Data tidak valid" } }, 400);
  }
  const { email, password } = parsed.data;
  const user = await root.user.findUnique({ where: { email } });
  // Pesan sama untuk email salah / password salah — tidak bocorkan keberadaan akun.
  const invalid = c.json({ error: { code: "INVALID_CREDENTIALS", message: "Email atau password salah" } }, 401);
  if (!user) return invalid;

  const ok = await verify(user.passwordHash, password, ARGON2_OPTS).catch(() => false);
  if (!ok) return invalid;

  await issueTokens(c, user.id);
  return c.json({ id: user.id.toString(), email: user.email });
}

export async function handleRefresh(c: Context): Promise<Response> {
  const userId = await rotateRefresh(c);
  if (!userId) {
    return c.json({ error: { code: "INVALID_REFRESH", message: "Sesi berakhir, login lagi" } }, 401);
  }
  return c.json({ id: userId.toString() });
}

export async function handleLogout(c: Context): Promise<Response> {
  const rt = getCookie(c, "refresh_token");
  if (rt) {
    const tokenHash = createHash("sha256").update(rt).digest("hex");
    await root.refreshToken.deleteMany({ where: { tokenHash } });
  }
  clearAuthCookies(c);
  return c.json({ ok: true });
}
