import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { profileSchema, offerWeightsSchema, reorderSchema } from "@jam/shared";
import { NotFoundError } from "../services/applications";

export const profileRoutes = new Hono();

profileRoutes.get("/", async (c) => {
  const profile = await db.profile.findFirst();
  if (!profile) throw new NotFoundError();
  return c.json({
    id: profile.id.toString(),
    nama: profile.nama,
    targetPosisi: profile.targetPosisi,
    targetIndustri: profile.targetIndustri,
    lokasiPreferensi: profile.lokasiPreferensi,
    ekspektasiGajiBawah: profile.ekspektasiGajiBawah ? String(profile.ekspektasiGajiBawah) : null,
    ekspektasiGajiAtas: profile.ekspektasiGajiAtas ? String(profile.ekspektasiGajiAtas) : null,
    linkedin: profile.linkedin,
    email: profile.email,
    noHp: profile.noHp,
    targetLamaranPerMinggu: profile.targetLamaranPerMinggu,
    targetDapatKerja: profile.targetDapatKerja ? profile.targetDapatKerja.toISOString().slice(0, 10) : null,
    statusPencarian: profile.statusPencarian,
    offerWeights: profile.offerWeights,
    onboardingSteps: profile.onboardingSteps,
  });
});

profileRoutes.patch("/", async (c) => {
  const body = await c.req.json();
  // offerWeights divalidasi terpisah (total harus 100).
  if (body.offerWeights !== undefined) {
    const w = offerWeightsSchema.safeParse(body.offerWeights);
    if (!w.success) {
      return c.json(
        { error: { code: "VALIDATION", message: "Total bobot harus 100", fields: w.error.flatten().fieldErrors } },
        400,
      );
    }
  }
  const parsed = profileSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: { code: "VALIDATION", message: "Data tidak valid", fields: parsed.error.flatten().fieldErrors } },
      400,
    );
  }
  const existing = await db.profile.findFirst();
  if (!existing) throw new NotFoundError();

  const d = parsed.data;
  const data: Record<string, unknown> = {};
  for (const key of [
    "nama", "targetPosisi", "targetIndustri", "lokasiPreferensi", "linkedin",
    "email", "noHp", "statusPencarian", "targetLamaranPerMinggu",
  ] as const) {
    if (d[key] !== undefined) data[key] = d[key];
  }
  for (const key of ["ekspektasiGajiBawah", "ekspektasiGajiAtas"] as const) {
    if (d[key] !== undefined) data[key] = d[key] ?? null;
  }
  if (d.targetDapatKerja !== undefined) data.targetDapatKerja = d.targetDapatKerja ? new Date(d.targetDapatKerja) : null;
  if (body.offerWeights !== undefined) data.offerWeights = body.offerWeights;
  if (body.onboardingSteps !== undefined) data.onboardingSteps = body.onboardingSteps;

  const profile = await db.profile.update({ where: { id: existing.id }, data });
  return c.json({ ok: true, offerWeights: profile.offerWeights });
});

/** 6 checkbox Panduan tersimpan di profiles.onboardingSteps (prompt §8.2). */
profileRoutes.patch("/onboarding", async (c) => {
  const body = await c.req.json();
  const steps = z.array(z.string()).max(6).safeParse(body.steps);
  if (!steps.success) {
    return c.json({ error: { code: "VALIDATION", message: "steps harus array string" } }, 400);
  }
  const existing = await db.profile.findFirst();
  if (!existing) throw new NotFoundError();
  await db.profile.update({ where: { id: existing.id }, data: { onboardingSteps: steps.data } });
  return c.json({ ok: true });
});
