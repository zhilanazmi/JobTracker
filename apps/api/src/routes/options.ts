import { Hono } from "hono";
import { z } from "zod";
import { db, currentUserId } from "../db";
import { optionSchema, reorderSchema } from "@jam/shared";
import { NotFoundError } from "../services/applications";

export const optionRoutes = new Hono();

/** Daftar status/prioritas user, urut per tipe. */
optionRoutes.get("/", async (c) => {
  const items = await db.optionList.findMany({
    orderBy: [{ tipe: "asc" }, { urutan: "asc" }],
    select: { id: true, tipe: true, label: true, urutan: true, warnaToken: true, isTerminal: true },
  });
  return c.json({
    items: items.map((o) => ({
      id: o.id.toString(),
      tipe: o.tipe,
      label: o.label,
      urutan: o.urutan,
      warnaToken: o.warnaToken,
      isTerminal: o.isTerminal,
    })),
  });
});

optionRoutes.post("/", async (c) => {
  const parsed = optionSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json(
      { error: { code: "VALIDATION", message: "Data tidak valid", fields: parsed.error.flatten().fieldErrors } },
      400,
    );
  }
  try {
    const row = await db.optionList.create({ data: parsed.data } as any);
    return c.json({ id: row.id.toString(), label: row.label }, 201);
  } catch {
    return c.json({ error: { code: "DUPLICATE", message: "Label sudah ada untuk tipe ini" } }, 409);
  }
});

optionRoutes.patch("/:id", async (c) => {
  const id = BigInt(c.req.param("id"));
  const parsed = optionSchema.partial().safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json(
      { error: { code: "VALIDATION", message: "Data tidak valid", fields: parsed.error.flatten().fieldErrors } },
      400,
    );
  }
  const existing = await db.optionList.findFirst({ where: { id } });
  if (!existing) throw new NotFoundError();
  const row = await db.optionList.update({ where: { id }, data: parsed.data });
  return c.json({ id: row.id.toString(), label: row.label, warnaToken: row.warnaToken });
});

/**
 * Reorder (prompt §7: PATCH /api/options/reorder). ids dalam urutan baru;
 * urutan ditulis ulang 1..n. Hanya menyentuh milik user (scoped).
 */
optionRoutes.patch("/reorder", async (c) => {
  const parsed = reorderSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: { code: "VALIDATION", message: "Data tidak valid" } }, 400);
  }
  const { tipe, ids } = parsed.data;
  for (let i = 0; i < ids.length; i++) {
    await db.optionList.updateMany({ where: { id: BigInt(ids[i]!), tipe }, data: { urutan: i + 1 } });
  }
  return c.json({ ok: true });
});

/**
 * Hapus status. Status yang masih dipakai lamaran tidak boleh langsung
 * dihapus (prompt §8.3): kembalikan jumlah pemakaian; client minta
 * konfirmasi move lamaran dulu.
 */
optionRoutes.delete("/:id", async (c) => {
  const id = BigInt(c.req.param("id"));
  const existing = await db.optionList.findFirst({ where: { id } });
  if (!existing) throw new NotFoundError();
  const force = c.req.query("force") === "true";
  const moveLabel = c.req.query("moveTo");

  const usage = await db.jobApplication.count({ where: { status: existing.label, deletedAt: null } });
  if (usage > 0 && !force) {
    return c.json(
      { error: { code: "STATUS_IN_USE", message: `Status dipakai ${usage} lamaran`, fields: { usage: [String(usage)] } } },
      409,
    );
  }
  if (usage > 0 && moveLabel) {
    const target = await db.optionList.findFirst({ where: { tipe: existing.tipe, label: moveLabel } });
    if (!target) {
      return c.json({ error: { code: "TARGET_NOT_FOUND", message: "Status tujuan tidak ada" } }, 400);
    }
    // Pindahkan lamaran + tulis log per lamaran (lewat service, satu per satu).
    const apps = await db.jobApplication.findMany({ where: { status: existing.label, deletedAt: null }, select: { id: true } });
    for (const a of apps) {
      await db.jobApplication.update({
        where: { id: a.id },
        data: { status: target.label, statusChangedAt: new Date() },
      });
      await db.applicationStatusLog.create({
        data: { jobApplicationId: a.id, statusLama: existing.label, statusBaru: target.label },
      });
    }
  }
  await db.optionList.delete({ where: { id } });
  return c.json({ ok: true });
});

export const extraRoutes = new Hono();

/** DELETE /api/sample-data — hapus semua baris isSample milik user (prompt §5). */
extraRoutes.delete("/sample-data", async (c) => {
  await db.jobPortal.deleteMany({ where: { isSample: true } } as any);
  await db.jobApplication.deleteMany({ where: { isSample: true } } as any);
  await db.document.deleteMany({ where: { isSample: true } } as any);
  await db.contact.deleteMany({ where: { isSample: true } } as any);
  await db.upskill.deleteMany({ where: { isSample: true } } as any);
  await db.interviewQuestion.deleteMany({ where: { isSample: true } } as any);
  await db.salaryBenchmark.deleteMany({ where: { isSample: true } } as any);
  await db.jobOffer.deleteMany({ where: { isSample: true } } as any);
  return c.json({ ok: true });
});

/** POST /api/offers/from-application/:id — buat offer dari lamaran (prompt §7). */
extraRoutes.post("/offers/from-application/:id", async (c) => {
  const id = BigInt(c.req.param("id"));
  const app = await db.jobApplication.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, perusahaan: true, posisi: true, estGajiBawah: true },
  });
  if (!app) throw new NotFoundError();
  const offer = await db.jobOffer.create({
    data: {
      jobApplicationId: app.id,
      perusahaan: app.perusahaan,
      posisi: app.posisi,
      gajiPokok: app.estGajiBawah,
      wlb: 3,
      jenjang: 3,
      budaya: 3,
    } as any,
  });
  return c.json({ id: offer.id.toString(), perusahaan: offer.perusahaan }, 201);
});
