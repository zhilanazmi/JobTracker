import { Hono } from "hono";
import { db } from "../db";
import { applicationCreateSchema, applicationUpdateSchema, statusChangeSchema } from "@jam/shared";
import { changeApplicationStatus, NotFoundError } from "../services/applications";

export const applicationRoutes = new Hono();

function dateStr(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

function decStr(d: unknown): string | null {
  return d != null ? String(d) : null;
}

export function serializeApp(a: any) {
  return {
    id: a.id.toString(),
    tglApply: dateStr(a.tglApply),
    perusahaan: a.perusahaan,
    posisi: a.posisi,
    portalId: a.portalId ? a.portalId.toString() : null,
    tipeKerja: a.tipeKerja,
    modeKerja: a.modeKerja,
    lokasi: a.lokasi,
    estGajiBawah: decStr(a.estGajiBawah),
    estGajiAtas: decStr(a.estGajiAtas),
    estGajiTeks: a.estGajiTeks,
    status: a.status,
    prioritas: a.prioritas,
    deadline: dateStr(a.deadline),
    tglInterview: dateStr(a.tglInterview),
    nextAction: a.nextAction,
    linkLowongan: a.linkLowongan,
    catatan: a.catatan,
    statusChangedAt: a.statusChangedAt,
  };
}

applicationRoutes.get("/", async (c) => {
  const q = c.req.query("q");
  const status = c.req.query("status");
  const prioritas = c.req.query("prioritas");
  const portalId = c.req.query("portalId");
  const mode = c.req.query("mode");
  const filter = c.req.query("filter");
  const page = Math.max(1, Number(c.req.query("page") ?? 1));
  const take = Math.min(100, Math.max(1, Number(c.req.query("take") ?? 50)));

  const where: Record<string, unknown> = { deletedAt: null };
  if (q) {
    where.OR = [
      { perusahaan: { contains: q } },
      { posisi: { contains: q } },
      { lokasi: { contains: q } },
    ];
  }
  if (status) where.status = status;
  if (prioritas) where.prioritas = prioritas;
  if (portalId) where.portalId = BigInt(portalId);
  if (mode) where.modeKerja = mode;

  const [items, total] = await Promise.all([
    db.jobApplication.findMany({
      where,
      select: {
        id: true, tglApply: true, perusahaan: true, posisi: true,
        portalId: true, tipeKerja: true, modeKerja: true, lokasi: true,
        estGajiBawah: true, estGajiAtas: true, estGajiTeks: true,
        status: true, prioritas: true, deadline: true, tglInterview: true,
        nextAction: true, linkLowongan: true, catatan: true, statusChangedAt: true,
      },
      orderBy: [{ tglApply: "desc" }],
      skip: (page - 1) * take,
      take,
    }),
    db.jobApplication.count({ where }),
  ]);

  return c.json({ items: items.map(serializeApp), pagination: { page, take, total } });
});

applicationRoutes.get("/:id", async (c) => {
  const id = BigInt(c.req.param("id"));
  const app = await db.jobApplication.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true, tglApply: true, perusahaan: true, posisi: true,
      portalId: true, tipeKerja: true, modeKerja: true, lokasi: true,
      estGajiBawah: true, estGajiAtas: true, estGajiTeks: true,
      status: true, prioritas: true, deadline: true, tglInterview: true,
      nextAction: true, linkLowongan: true, catatan: true, statusChangedAt: true,
    },
  });
  if (!app) throw new NotFoundError();
  return c.json(serializeApp(app));
});

applicationRoutes.post("/", async (c) => {
  const parsed = applicationCreateSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json(
      { error: { code: "VALIDATION", message: "Data tidak valid", fields: parsed.error.flatten().fieldErrors } },
      400,
    );
  }
  const d = parsed.data;
  const app = await db.jobApplication.create({
    data: {
      tglApply: d.tglApply ? new Date(d.tglApply) : null,
      perusahaan: d.perusahaan,
      posisi: d.posisi,
      portalId: d.portalId ? BigInt(d.portalId) : null,
      tipeKerja: d.tipeKerja,
      modeKerja: d.modeKerja,
      lokasi: d.lokasi,
      estGajiBawah: d.estGajiBawah,
      estGajiAtas: d.estGajiAtas,
      estGajiTeks: d.estGajiTeks,
      status: d.status,
      prioritas: d.prioritas,
      deadline: d.deadline ? new Date(d.deadline) : null,
      tglInterview: d.tglInterview ? new Date(d.tglInterview) : null,
      nextAction: d.nextAction,
      linkLowongan: d.linkLowongan,
      catatan: d.catatan,
    } as any,
  });
  // Log pertama (prompt §5): statusLama = null.
  await db.applicationStatusLog.create({
    data: { jobApplicationId: app.id, statusLama: null, statusBaru: d.status },
  });
  return c.json(serializeApp(app), 201);
});

applicationRoutes.patch("/:id", async (c) => {
  const id = BigInt(c.req.param("id"));
  const parsed = applicationUpdateSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json(
      { error: { code: "VALIDATION", message: "Data tidak valid", fields: parsed.error.flatten().fieldErrors } },
      400,
    );
  }
  const d = parsed.data;
  const existing = await db.jobApplication.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new NotFoundError();

  const data: Record<string, unknown> = {};
  for (const key of [
    "perusahaan", "posisi", "tipeKerja", "modeKerja", "lokasi", "estGajiTeks",
    "prioritas", "nextAction", "linkLowongan", "catatan",
  ] as const) {
    if (d[key] !== undefined) data[key] = d[key];
  }
  for (const key of ["tglApply", "deadline", "tglInterview"] as const) {
    if (d[key] !== undefined) data[key] = d[key] ? new Date(d[key] as string) : null;
  }
  for (const key of ["estGajiBawah", "estGajiAtas"] as const) {
    if (d[key] !== undefined) data[key] = d[key] ?? null;
  }
  if (d.portalId !== undefined) data.portalId = d.portalId ? BigInt(d.portalId) : null;

  // Perubahan status TIDAK di sini — harus lewat /status (prompt §5).
  const app = await db.jobApplication.update({ where: { id: existing.id }, data });
  return c.json(serializeApp(app));
});

applicationRoutes.patch("/:id/status", async (c) => {
  const id = BigInt(c.req.param("id"));
  const parsed = statusChangeSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: { code: "VALIDATION", message: "Data tidak valid" } }, 400);
  }
  const app = await changeApplicationStatus(id, parsed.data.status);
  return c.json(serializeApp(app));
});

applicationRoutes.get("/:id/timeline", async (c) => {
  const id = BigInt(c.req.param("id"));
  const exists = await db.jobApplication.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!exists) throw new NotFoundError();
  const logs = await db.applicationStatusLog.findMany({
    where: { jobApplicationId: id },
    orderBy: [{ changedAt: "asc" }],
    select: { id: true, statusLama: true, statusBaru: true, changedAt: true },
  });
  return c.json({ items: logs.map((l) => ({ ...l, id: l.id.toString() })) });
});

applicationRoutes.delete("/:id", async (c) => {
  const id = BigInt(c.req.param("id"));
  const existing = await db.jobApplication.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!existing) throw new NotFoundError();
  await db.jobApplication.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
  return c.json({ ok: true });
});
