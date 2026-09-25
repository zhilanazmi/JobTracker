import { Hono } from "hono";
import { root } from "../src/db";
import { withUser } from "../src/db";
import { seedUserData } from "../prisma/seed.js";
import { hash } from "@node-rs/argon2";

/**
 * Setup integration test: DB test terpisah (DATABASE_URL menunjuk jam_test),
 * dibersihkan sebelum tiap grup test. Dua user dibuat: A (pemilik data),
 * B (penyerang isolasi).
 */

export async function createTestUser(email: string, nama: string): Promise<bigint> {
  const passwordHash = await hash("Password123!");
  const user = await root.user.create({
    data: { email, passwordHash, profile: { create: { nama } } },
  });
  await withUser(user.id, () => seedUserData(user.id, true));
  return user.id;
}

export async function resetDb(): Promise<void> {
  // Urutan aman dari FK (cascade juga membantu, tapi eksplisit lebih cepat).
  await root.applicationStatusLog.deleteMany();
  await root.jobOffer.deleteMany();
  await root.jobApplication.deleteMany();
  await root.jobPortal.deleteMany();
  await root.document.deleteMany();
  await root.contact.deleteMany();
  await root.upskill.deleteMany();
  await root.interviewQuestion.deleteMany();
  await root.salaryBenchmark.deleteMany();
  await root.optionList.deleteMany();
  await root.profile.deleteMany();
  await root.refreshToken.deleteMany();
  await root.user.deleteMany();
}

export function buildTestApp(registerAuth: (app: Hono) => void): Hono {
  const app = new Hono();
  registerAuth(app);
  return app;
}
