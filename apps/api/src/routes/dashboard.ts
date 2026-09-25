import { Hono } from "hono";
import { db } from "../db";
import {
  dashboardMetrics,
  funnel,
  profileIncomplete,
  isPerluFollowup,
  isKontakPerluFollowup,
  isDokumenPerluUpdate,
  isLamaranMingguIni,
  deadlineCategory,
  isInterviewTerjadwal,
} from "@jam/shared";
import type { DashboardInput } from "@jam/shared";

export const dashboardRoutes = new Hono();

/**
 * SATU response (prompt §7): 6 metrik + 6 item "Yang Harus Dikerjain"
 * + funnel + profileIncomplete. Semua angka dihitung dari DB saat query.
 */
dashboardRoutes.get("/", async (c) => {
  const [apps, logs, contacts, docs, profile] = await Promise.all([
    db.jobApplication.findMany({
      where: { deletedAt: null },
      select: { id: true, status: true, statusChangedAt: true, deadline: true, tglApply: true, tglInterview: true },
    }),
    db.applicationStatusLog.findMany({ select: { jobApplicationId: true, statusBaru: true } }),
    db.contact.findMany({
      where: { deletedAt: null },
      select: { statusFollowUp: true, kontakTerakhir: true },
    }),
    db.document.findMany({
      where: { deletedAt: null },
      select: { status: true, linkDrive: true },
    }),
    db.profile.findFirst({
      select: {
        nama: true,
        targetPosisi: true,
        ekspektasiGajiBawah: true,
        ekspektasiGajiAtas: true,
        targetDapatKerja: true,
      },
    }),
  ]);

  const reached = new Map<number, Set<string>>();
  for (const log of logs) {
    const id = Number(log.jobApplicationId);
    if (!reached.has(id)) reached.set(id, new Set());
    reached.get(id)!.add(log.statusBaru);
  }

  const iso = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);
  const appsS = apps.map((a) => ({
    id: a.id,
    status: a.status,
    statusChangedAt: a.statusChangedAt,
    deadline: iso(a.deadline),
    tglApply: iso(a.tglApply),
    tglInterview: iso(a.tglInterview),
  }));
  const contactsS = contacts.map((k) => ({
    statusFollowUp: k.statusFollowUp,
    kontakTerakhir: iso(k.kontakTerakhir),
  }));

  const input: DashboardInput = {
    applications: appsS,
    reachedStatuses: reached,
    contacts: contactsS,
    documents: docs,
    targetPerMinggu: 10,
  };
  const metrics = dashboardMetrics(input);
  const funnelData = funnel(reached, appsS);

  const perluFollowup = appsS.filter((a) => isPerluFollowup(a)).length;
  const lamaranMingguIni = appsS.filter((a) => a.tglApply && isLamaranMingguIni(a.tglApply)).length;
  const deadlineMepet = appsS.filter((a) => deadlineCategory(a.deadline) === "mepet").length;
  const interviewTerjadwal = appsS.filter((a) => isInterviewTerjadwal(a.tglInterview)).length;
  const kontakFollowup = contactsS.filter((k) => isKontakPerluFollowup(k)).length;
  const dokumenUpdate = docs.filter((d) => isDokumenPerluUpdate(d.status)).length;

  const todo = [
    { key: "followup", judul: "Perlu Follow-up", jumlah: perluFollowup, deskripsi: "Lamaran stuck ≥7 hari di Applied/Screening", href: "/tracker?filter=followup" },
    { key: "minggu-ini", judul: "Lamaran Minggu Ini", jumlah: lamaranMingguIni, deskripsi: "dari target mingguan profil", href: "/tracker" },
    { key: "deadline", judul: "Deadline ≤3 Hari", jumlah: deadlineMepet, deskripsi: "Lowongan yang mepet deadline", href: "/tracker?filter=deadline" },
    { key: "interview", judul: "Interview Terjadwal", jumlah: interviewTerjadwal, deskripsi: "Siapkan diri", href: "/tracker?filter=interview" },
    { key: "kontak", judul: "Kontak Perlu Follow-up", jumlah: kontakFollowup, deskripsi: "Networking jangan didiemin", href: "/kontak" },
    { key: "dokumen", judul: "Dokumen Perlu Update", jumlah: dokumenUpdate, deskripsi: "Rapihin berkas sebelum butuh", href: "/dokumen" },
  ];

  const inc = profile
    ? profileIncomplete({
        nama: profile.nama,
        targetPosisi: profile.targetPosisi,
        ekspektasiGajiBawah: profile.ekspektasiGajiBawah ? String(profile.ekspektasiGajiBawah) : null,
        ekspektasiGajiAtas: profile.ekspektasiGajiAtas ? String(profile.ekspektasiGajiAtas) : null,
        targetDapatKerja: profile.targetDapatKerja ? profile.targetDapatKerja.toISOString().slice(0, 10) : null,
      })
    : true;

  return c.json({ metrics, todo, funnel: funnelData, profileIncomplete: inc });
});
