import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { NotFoundError } from "../services/applications";
import {
  portalSchema, documentSchema, contactSchema, upskillSchema,
  questionSchema, salarySchema, offerSchema, profileSchema,
} from "@jam/shared";

/**
 * REST generik: GET list (pagination, ?q=, filter, ?sort=), POST,
 * PATCH /:id, DELETE /:id. Soft delete untuk documents/contacts.
 */

interface ResourceDef {
  model: any; // delegate Prisma delegate dari db (sudah scoped userId)
  schema: z.ZodTypeAny;
  schemaPartial: z.ZodTypeAny;
  fields: Record<string, "string" | "date" | "money" | "int" | "bigintRef" | "raw">;
  softDelete?: boolean;
  search?: string[];
  /** Kolom string exact-match yang boleh difilter via query param, mis. ?tipe=Umum. */
  filters?: string[];
}

function toDb(d: any, fields: ResourceDef["fields"]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d)) {
    if (v === undefined) continue;
    const kind = fields[k];
    if (kind === "date") out[k] = v ? new Date(v as string) : null;
    else if (kind === "bigintRef") out[k] = v ? BigInt(v as string) : null;
    else out[k] = v === "" ? null : v;
  }
  return out;
}

function serialize(row: any, fields: ResourceDef["fields"]): Record<string, unknown> {
  const out: Record<string, unknown> = { id: row.id.toString() };
  for (const [k, kind] of Object.entries(fields)) {
    const v = row[k];
    if (kind === "date") out[k] = v ? v.toISOString().slice(0, 10) : null;
    else if (kind === "money") out[k] = v != null ? String(v) : null;
    else if (kind === "bigintRef") out[k] = v ? v.toString() : null;
    else out[k] = v ?? null;
  }
  return out;
}

function makeResource(name: string, def: ResourceDef): Hono {
  const r = new Hono();

  r.get("/", async (c) => {
    const page = Math.max(1, Number(c.req.query("page") ?? 1));
    const take = Math.min(100, Math.max(1, Number(c.req.query("take") ?? 50)));
    const q = c.req.query("q");
    const where: Record<string, unknown> = {};
    if (def.softDelete) where.deletedAt = null;
    for (const f of def.filters ?? []) {
      const v = c.req.query(f);
      if (v) where[f] = v;
    }
    if (q && def.search) {
      where.OR = def.search.map((f) => ({ [f]: { contains: q } }));
    }
    const [items, total] = await Promise.all([
      def.model.findMany({
        where,
        skip: (page - 1) * take,
        take,
        orderBy: { id: "desc" },
      }),
      def.model.count({ where }),
    ]);
    return c.json({ items: items.map((x: any) => serialize(x, def.fields)), pagination: { page, take, total } });
  });

  r.post("/", async (c) => {
    const parsed = def.schema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "VALIDATION", message: "Data tidak valid", fields: parsed.error.flatten().fieldErrors } },
        400,
      );
    }
    const row = await def.model.create({ data: toDb(parsed.data, def.fields) });
    return c.json(serialize(row, def.fields), 201);
  });

  r.patch("/:id", async (c) => {
    const id = BigInt(c.req.param("id"));
    const parsed = def.schemaPartial.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "VALIDATION", message: "Data tidak valid", fields: parsed.error.flatten().fieldErrors } },
        400,
      );
    }
    const existing = await def.model.findFirst({ where: { id } });
    if (!existing) throw new NotFoundError();
    const row = await def.model.update({ where: { id }, data: toDb(parsed.data, def.fields) });
    return c.json(serialize(row, def.fields));
  });

  r.delete("/:id", async (c) => {
    const id = BigInt(c.req.param("id"));
    const existing = await def.model.findFirst({ where: { id } });
    if (!existing) throw new NotFoundError();
    if (def.softDelete) {
      await def.model.update({ where: { id }, data: { deletedAt: new Date() } });
    } else {
      await def.model.delete({ where: { id } });
    }
    return c.json({ ok: true });
  });

  return r;
}

export function registerResources(app: Hono): void {
  app.route("/api/portals", makeResource("portals", {
    model: db.jobPortal,
    schema: portalSchema,
    schemaPartial: portalSchema.partial(),
    fields: { namaPortal: "string", fokus: "string", tipe: "string", link: "string", cocokUntuk: "string", catatan: "string" },
    search: ["namaPortal", "fokus"],
    filters: ["tipe", "fokus"],
  }));

  app.route("/api/documents", makeResource("documents", {
    model: db.document,
    schema: documentSchema,
    schemaPartial: documentSchema.partial(),
    fields: { namaDokumen: "string", jenis: "string", versi: "string", linkDrive: "string", updateTerakhir: "date", status: "string", catatan: "string" },
    softDelete: true,
    search: ["namaDokumen", "jenis"],
  }));

  app.route("/api/contacts", makeResource("contacts", {
    model: db.contact,
    schema: contactSchema,
    schemaPartial: contactSchema.partial(),
    fields: { nama: "string", perusahaan: "string", posisi: "string", hubungan: "string", kontak: "string", kontakTerakhir: "date", statusFollowUp: "string", catatan: "string" },
    softDelete: true,
    search: ["nama", "perusahaan"],
  }));

  app.route("/api/upskills", makeResource("upskills", {
    model: db.upskill,
    schema: upskillSchema,
    schemaPartial: upskillSchema.partial(),
    fields: { skill: "string", kategori: "string", platform: "string", linkCourse: "string", prioritas: "string", status: "string", targetSelesai: "date", progress: "int", linkSertifikat: "string" },
    search: ["skill"],
  }));

  app.route("/api/questions", makeResource("questions", {
    model: db.interviewQuestion,
    schema: questionSchema,
    schemaPartial: questionSchema.partial(),
    fields: { pertanyaan: "string", kategori: "string", untukRole: "string", starSituation: "string", starTask: "string", starAction: "string", starResult: "string", contohKonkret: "string", prioritas: "string", status: "string", catatan: "string" },
    search: ["pertanyaan"],
  }));

  app.route("/api/salaries", makeResource("salaries", {
    model: db.salaryBenchmark,
    schema: salarySchema,
    schemaPartial: salarySchema.partial(),
    fields: { role: "string", level: "string", industri: "string", lokasi: "string", gajiBawah: "money", gajiAtas: "money", sumber: "string", catatan: "string" },
    search: ["role"],
  }));

  app.route("/api/offers", makeResource("offers", {
    model: db.jobOffer,
    schema: offerSchema,
    schemaPartial: offerSchema.partial(),
    fields: { jobApplicationId: "bigintRef", perusahaan: "string", posisi: "string", gajiPokok: "money", tunjangan: "string", thpEstimasi: "money", wlb: "int", jenjang: "int", budaya: "int", catatan: "string" },
    search: ["perusahaan"],
  }));
}
