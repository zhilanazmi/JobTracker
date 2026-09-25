import { Hono } from "hono";
import { db } from "../db";
import { stream } from "hono/streaming";
import { NotFoundError } from "../services/applications";

export const exportRoutes = new Hono();

/** GET /api/export/:resource?format=csv|json — streamed (prompt §7). */
exportRoutes.get("/:resource", async (c) => {
  const resource = c.req.param("resource");
  const format = c.req.query("format") ?? "csv";

  const map: Record<string, { model: any; fields: string[] }> = {
    applications: {
      model: db.jobApplication,
      fields: ["id", "tglApply", "perusahaan", "posisi", "status", "prioritas", "deadline", "tglInterview", "lokasi", "estGajiBawah", "estGajiAtas"],
    },
    portals: { model: db.jobPortal, fields: ["id", "namaPortal", "fokus", "tipe", "link", "cocokUntuk"] },
    documents: { model: db.document, fields: ["id", "namaDokumen", "jenis", "versi", "linkDrive", "status"] },
    contacts: { model: db.contact, fields: ["id", "nama", "perusahaan", "posisi", "hubungan", "kontak", "kontakTerakhir", "statusFollowUp"] },
    upskills: { model: db.upskill, fields: ["id", "skill", "kategori", "platform", "progress", "status"] },
    questions: { model: db.interviewQuestion, fields: ["id", "pertanyaan", "kategori", "untukRole", "status", "prioritas"] },
    salaries: { model: db.salaryBenchmark, fields: ["id", "role", "level", "industri", "lokasi", "gajiBawah", "gajiAtas", "sumber"] },
    offers: { model: db.jobOffer, fields: ["id", "perusahaan", "posisi", "gajiPokok", "thpEstimasi", "wlb", "jenjang", "budaya"] },
  };
  const def = map[resource];
  if (!def) throw new NotFoundError();

  const rows: Record<string, unknown>[] = await def.model.findMany({ where: { deletedAt: null } });
  const parsed = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const f of def.fields) {
      const v = row[f];
      out[f] = v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? "" : String(v);
    }
    return out;
  });

  if (format === "json") {
    return stream(c, async (s) => {
      await s.write(JSON.stringify(parsed));
    });
  }

  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [def.fields.join(","), ...parsed.map((r) => def.fields.map((f) => esc(r[f])).join(","))].join("\n");
  return stream(c, async (s) => {
    await s.write(csv);
  });
});
