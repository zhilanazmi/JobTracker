import { z } from "zod";

/** Uang selalu string desimal ("9500000.00") — tidak pernah number. */
export const moneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Format uang: angka desimal maks 2 tempat");

/** Tanggal ISO "YYYY-MM-DD". */
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD");

const httpUrl = z.string().regex(/^https?:\/\/\S+$/, "Link harus http(s)://");
export const optionalHttpUrl = z.union([httpUrl, z.literal("")]).optional().nullable();

export const progressSchema = z.number().int().min(0).max(100);
export const ratingSchema = z.number().int().min(1).max(5);

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  nama: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const profileSchema = z.object({
  nama: z.string().min(1).max(100),
  targetPosisi: z.string().max(150).optional().nullable(),
  targetIndustri: z.string().max(150).optional().nullable(),
  lokasiPreferensi: z.string().max(150).optional().nullable(),
  ekspektasiGajiBawah: moneySchema.optional().nullable(),
  ekspektasiGajiAtas: moneySchema.optional().nullable(),
  linkedin: optionalHttpUrl,
  email: z.string().email().optional().nullable(),
  noHp: z.string().max(50).optional().nullable(),
  targetLamaranPerMinggu: z.number().int().min(1).max(200).optional(),
  targetDapatKerja: dateSchema.optional().nullable(),
  statusPencarian: z.string().max(50).optional(),
});

export const optionSchema = z.object({
  tipe: z.enum(["status_lamaran", "prioritas"]),
  label: z.string().min(1).max(50),
  urutan: z.number().int().min(1),
  warnaToken: z.enum(["success", "warning", "danger", "info", "neutral", "accent"]),
  isTerminal: z.boolean().optional().default(false),
});

export const portalSchema = z.object({
  namaPortal: z.string().min(1).max(100),
  fokus: z.string().max(100).optional().nullable(),
  tipe: z.string().max(50).optional().nullable(),
  link: optionalHttpUrl,
  cocokUntuk: z.string().max(255).optional().nullable(),
  catatan: z.string().max(2000).optional().nullable(),
});

const applicationCore = {
  tglApply: dateSchema.optional().nullable(),
  perusahaan: z.string().min(1).max(150),
  posisi: z.string().min(1).max(150),
  portalId: z.number().int().positive().optional().nullable(),
  tipeKerja: z.string().max(50).optional().nullable(),
  modeKerja: z.string().max(50).optional().nullable(),
  lokasi: z.string().max(150).optional().nullable(),
  estGajiBawah: moneySchema.optional().nullable(),
  estGajiAtas: moneySchema.optional().nullable(),
  estGajiTeks: z.string().max(100).optional().nullable(),
  status: z.string().min(1).max(50),
  prioritas: z.string().max(50).optional().nullable(),
  deadline: dateSchema.optional().nullable(),
  tglInterview: dateSchema.optional().nullable(),
  nextAction: z.string().max(255).optional().nullable(),
  linkLowongan: optionalHttpUrl,
  catatan: z.string().max(5000).optional().nullable(),
};

export const applicationCreateSchema = z
  .object(applicationCore)
  .refine(
    (v) =>
      v.estGajiBawah == null || v.estGajiAtas == null || v.estGajiAtas >= v.estGajiBawah,
    { message: "Gaji atas harus ≥ gaji bawah", path: ["estGajiAtas"] },
  )
  .refine(
    (v) => v.tglApply == null || v.tglInterview == null || v.tglInterview >= v.tglApply,
    { message: "tglInterview harus ≥ tglApply", path: ["tglInterview"] },
  );

export const applicationUpdateSchema = z
  .object({ ...applicationCore, perusahaan: z.string().min(1).max(150).optional(), posisi: z.string().min(1).max(150).optional() })
  .partial()
  .refine(
    (v) =>
      v.estGajiBawah == null || v.estGajiAtas == null || v.estGajiAtas >= v.estGajiBawah,
    { message: "Gaji atas harus ≥ gaji bawah", path: ["estGajiAtas"] },
  );

export const statusChangeSchema = z.object({
  status: z.string().min(1).max(50),
});

export const documentSchema = z.object({
  namaDokumen: z.string().min(1).max(150),
  jenis: z.string().max(50).optional().nullable(),
  versi: z.string().max(50).optional().nullable(),
  linkDrive: optionalHttpUrl,
  updateTerakhir: dateSchema.optional().nullable(),
  status: z.string().max(50).optional().nullable(),
  catatan: z.string().max(2000).optional().nullable(),
});

export const contactSchema = z.object({
  nama: z.string().min(1).max(100),
  perusahaan: z.string().max(150).optional().nullable(),
  posisi: z.string().max(150).optional().nullable(),
  hubungan: z.string().max(50).optional().nullable(),
  kontak: z.string().max(255).optional().nullable(),
  kontakTerakhir: dateSchema.optional().nullable(),
  statusFollowUp: z.string().max(50).optional().nullable(),
  catatan: z.string().max(2000).optional().nullable(),
});

export const upskillSchema = z.object({
  skill: z.string().min(1).max(150),
  kategori: z.string().max(50).optional().nullable(),
  platform: z.string().max(100).optional().nullable(),
  linkCourse: optionalHttpUrl,
  prioritas: z.string().max(50).optional().nullable(),
  status: z.string().max(50).optional().nullable(),
  targetSelesai: dateSchema.optional().nullable(),
  progress: progressSchema.optional(),
  linkSertifikat: optionalHttpUrl,
});

export const questionSchema = z.object({
  pertanyaan: z.string().min(1).max(1000),
  kategori: z.string().max(50).optional().nullable(),
  untukRole: z.string().max(150).optional().nullable(),
  starSituation: z.string().max(5000).optional().nullable(),
  starTask: z.string().max(5000).optional().nullable(),
  starAction: z.string().max(5000).optional().nullable(),
  starResult: z.string().max(5000).optional().nullable(),
  contohKonkret: z.string().max(5000).optional().nullable(),
  prioritas: z.string().max(50).optional().nullable(),
  status: z.string().max(50).optional().nullable(),
  catatan: z.string().max(2000).optional().nullable(),
});

export const salarySchema = z.object({
  role: z.string().min(1).max(150),
  level: z.string().max(50).optional().nullable(),
  industri: z.string().max(100).optional().nullable(),
  lokasi: z.string().max(100).optional().nullable(),
  gajiBawah: moneySchema.optional().nullable(),
  gajiAtas: moneySchema.optional().nullable(),
  sumber: z.string().max(255).optional().nullable(),
  catatan: z.string().max(2000).optional().nullable(),
});

export const offerSchema = z.object({
  jobApplicationId: z.number().int().positive().optional().nullable(),
  perusahaan: z.string().min(1).max(150),
  posisi: z.string().min(1).max(150),
  gajiPokok: moneySchema.optional().nullable(),
  tunjangan: z.string().max(500).optional().nullable(),
  thpEstimasi: moneySchema.optional().nullable(),
  wlb: ratingSchema,
  jenjang: ratingSchema,
  budaya: ratingSchema,
  catatan: z.string().max(2000).optional().nullable(),
});

export const offerWeightsSchema = z
  .object({
    gaji: z.number().min(0).max(100),
    wlb: z.number().min(0).max(100),
    jenjang: z.number().min(0).max(100),
    budaya: z.number().min(0).max(100),
  })
  .refine((w) => w.gaji + w.wlb + w.jenjang + w.budaya === 100, {
    message: "Total bobot harus 100",
  });

export const reorderSchema = z.object({
  tipe: z.enum(["status_lamaran", "prioritas"]),
  ids: z.array(z.number().int().positive()).min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;
export type OfferInput = z.infer<typeof offerSchema>;
export type OfferWeights = z.infer<typeof offerWeightsSchema>;
