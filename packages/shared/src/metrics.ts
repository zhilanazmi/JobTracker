/**
 * Aturan bisnis murni dari prompt §5 — tanpa DB, mudah di-unit-test.
 * Semua fungsi menerima data datar; orchestrasi query di apps/api.
 */
import {
  FUNNEL_STAGES,
  INTERVIEW_STATUSES,
  OFFER_STATUSES,
  TERMINAL_STATUSES,
} from "./constants";
import { Decimal } from "./decimal-shim";
import { addDays, daysBetween, startOfWeekWIB, todayWIB } from "./dates";

export interface ApplicationLike {
  id: bigint | number;
  tglApply: string | null;
  status: string;
  statusChangedAt: Date | string;
  deadline: string | null;
  tglInterview: string | null;
  estGajiBawah: string | null;
  estGajiAtas: string | null;
}

export interface StatusLogLike {
  jobApplicationId: bigint | number;
  statusBaru: string;
}

export interface DashboardApplication {
  status: string;
  statusChangedAt: Date | string;
  deadline: Date | string | null;
  tglApply: Date | string | null;
  tglInterview: Date | string | null;
}

export interface DashboardInput {
  applications: DashboardApplication[];
  /** Log status semua lamaran user: map appId → daftar status yang pernah dicapai. */
  reachedStatuses: Map<number, Set<string>>;
  contacts: { statusFollowUp: string | null; kontakTerakhir: string | null }[];
  documents: { status: string | null; linkDrive: string | null }[];
  targetPerMinggu: number;
  now?: Date;
}

export const isWishlistOrMauApply = (s: string) => s === "Wishlist" || s === "Mau Apply";

/** "Sudah Apply" = status bukan Wishlist dan bukan Mau Apply. */
export const isSudahApply = (s: string) => !isWishlistOrMauApply(s);

export const isInterviewTes = (s: string) => INTERVIEW_STATUSES.includes(s);
export const isOfferDiterima = (s: string) => OFFER_STATUSES.includes(s);
export const isTerminal = (s: string) => TERMINAL_STATUSES.includes(s);

/** Aktif Pipeline = sudah apply dan tidak terminal. */
export const isAktifPipeline = (s: string) => isSudahApply(s) && !isTerminal(s);

/**
 * Status pernah melewati "Applied" = cek di log, bukan status terkini.
 * Return true jika penyebut 0 → caller menampilkan "—".
 */
export function responseRate(
  apps: { id: bigint | number; status: string }[],
  reachedStatuses: Map<number, Set<string>>,
  now: Date = new Date(),
): number | null {
  const sudah = apps.filter((a) => isSudahApply(a.status));
  if (sudah.length === 0) return null;
  const responded = sudah.filter((a) => {
    const reached = reachedStatuses.get(Number(a.id));
    return reached ? reached.has("Applied") : isPastApplied(a.status);
  });
  return Math.round((responded.length / sudah.length) * 100);
}

/**
 * Fallback tanpa log: status Applied sendiri atau tahap funnel setelahnya
 * dianggap pernah lewat. Ditolak/Ghosting tidak (bisa terjadi tanpa lewat Applied).
 */
function isPastApplied(status: string): boolean {
  const idx = FUNNEL_STAGES.indexOf(status);
  return idx >= 0 || isOfferDiterima(status);
}

/** Perlu Follow-up: status ∈ {Applied, Screening HR} dan statusChangedAt ≤ hari ini − 7 hari (WIB). */
export function isPerluFollowup(
  a: { status: string; statusChangedAt: Date | string },
  now: Date = new Date(),
): boolean {
  if (a.status !== "Applied" && a.status !== "Screening HR") return false;
  const changed =
    typeof a.statusChangedAt === "string"
      ? a.statusChangedAt.slice(0, 10) // DateTime → "YYYY-MM-DD" di WIB-approx; log ditulis dalam WIB
      : a.statusChangedAt.toISOString().slice(0, 10);
  const today = todayWIB(now);
  // statusChangedAt ≤ today − 7 hari
  return changed <= addDays(today, -7);
}

/** Deadline mepet: antara hari ini dan hari ini + 3 (inklusif, WIB). Terlewat dihitung terpisah. */
export function deadlineCategory(
  deadline: string | null,
  now: Date = new Date(),
): "mepet" | "terlewat" | null {
  if (!deadline) return null;
  const today = todayWIB(now);
  if (deadline < today) return "terlewat";
  if (deadline <= addDays(today, 3)) return "mepet";
  return null;
}

/** Interview Terjadwal: tglInterview ≥ hari ini (WIB). */
export function isInterviewTerjadwal(
  tglInterview: string | null,
  now: Date = new Date(),
): boolean {
  return tglInterview != null && tglInterview >= todayWIB(now);
}

/** Umur lamaran = hari ini − tglApply, hari. */
export function umurLamaran(tglApply: string | null, now: Date = new Date()): number | null {
  if (!tglApply) return null;
  return Math.max(0, daysBetween(tglApply, todayWIB(now)));
}

/** Lamaran minggu ini: tglApply dalam Senin–Minggu berjalan (WIB). */
export function isLamaranMingguIni(
  tglApply: string | null,
  now: Date = new Date(),
): boolean {
  if (!tglApply) return false;
  const start = startOfWeekWIB(now);
  return tglApply >= start && tglApply <= addDays(start, 6);
}

/** Kontak perlu follow-up: status "Perlu Follow-up" ATAU kontakTerakhir >14 hari + "Menunggu Balasan". */
export function isKontakPerluFollowup(
  c: { statusFollowUp: string | null; kontakTerakhir: string | null },
  now: Date = new Date(),
): boolean {
  if (c.statusFollowUp === "Perlu Follow-up") return true;
  if (c.statusFollowUp === "Menunggu Balasan" && c.kontakTerakhir) {
    return daysBetween(c.kontakTerakhir, todayWIB(now)) > 14;
  }
  return false;
}

/** Dokumen perlu update: status "Perlu Update". */
export const isDokumenPerluUpdate = (status: string | null) => status === "Perlu Update";

/** Dokumen "Final/Siap". */
export const isDokumenFinal = (status: string | null) => status === "Final";

/** Funnel: jumlah lamaran yang PERNAH mencapai tiap tahap (dari log). */
export function funnel(
  reachedStatuses: Map<number, Set<string>>,
  apps: { id: bigint | number; status: string }[],
): { stage: string; count: number; conversion: number | null }[] {
  const countFor = (stage: string) => {
    let n = 0;
    for (const a of apps) {
      const reached = reachedStatuses.get(Number(a.id));
      if (reached?.has(stage)) n++;
    }
    return n;
  };
  return FUNNEL_STAGES.map((stage, i) => {
    const count = countFor(stage);
    const prev = i === 0 ? null : countFor(FUNNEL_STAGES[i - 1]!);
    const conversion = prev == null || prev === 0 ? null : Math.round((count / prev) * 100);
    return { stage, count, conversion };
  });
}

/** Median gaji = (bawah + atas) / 2, Decimal. Null kalau data tak lengkap. */
export function medianGaji(
  bawah: string | null,
  atas: string | null,
): string | null {
  if (!bawah || !atas) return null;
  const mid = new Decimal(bawah).add(new Decimal(atas)).div(2n);
  return mid.toString();
}

/** Skor offer = rata-rata berbobot; komponen Gaji = THP dinormalisasi 1–5 relatif THP tertinggi. */
export function offerScore(
  offer: { thpEstimasi: string | null; wlb: number; jenjang: number; budaya: number },
  weights: { gaji: number; wlb: number; jenjang: number; budaya: number },
  maxThp: string,
): number {
  let gajiComponent = 1;
  if (offer.thpEstimasi && maxThp !== "0.00") {
    const ratio = Number(offer.thpEstimasi) / Number(maxThp);
    gajiComponent = Math.max(1, Math.min(5, ratio * 5));
  }
  const total =
    (gajiComponent * weights.gaji +
      offer.wlb * weights.wlb +
      offer.jenjang * weights.jenjang +
      offer.budaya * weights.budaya) /
    100;
  return Math.round(total * 10) / 10;
}

/** Kalau ada skor seri, SEMUA yang seri dapat badge "Skor Tertinggi". */
export function topScoreIds(
  offers: { id: number }[],
  scoreOf: (o: { id: number }) => number,
): Set<number> {
  let max = -Infinity;
  for (const o of offers) {
    const s = scoreOf(o);
    if (s > max) max = s;
  }
  const set = new Set<number>();
  for (const o of offers) {
    if (scoreOf(o) === max) set.add(o.id);
  }
  return set;
}

/** Profil dianggap belum lengkap → banner Setup muncul. */
export function profileIncomplete(p: {
  nama: string | null;
  targetPosisi: string | null;
  ekspektasiGajiBawah: string | null;
  ekspektasiGajiAtas: string | null;
  targetDapatKerja: string | null;
}): boolean {
  return !p.nama || !p.targetPosisi || !p.ekspektasiGajiBawah || !p.ekspektasiGajiAtas || !p.targetDapatKerja;
}

/** Ringkasan 6 metrik dashboard (prompt §8.1). */
export function dashboardMetrics(input: DashboardInput): {
  totalEntri: number;
  sudahApply: number;
  interviewTes: number;
  offerDiterima: number;
  aktifPipeline: number;
  responseRate: number | null;
} {
  const apps = input.applications.map((a, i) => ({ ...a, id: i }));
  return {
    totalEntri: apps.length,
    sudahApply: apps.filter((a) => isSudahApply(a.status)).length,
    interviewTes: apps.filter((a) => isInterviewTes(a.status)).length,
    offerDiterima: apps.filter((a) => isOfferDiterima(a.status)).length,
    aktifPipeline: apps.filter((a) => isAktifPipeline(a.status)).length,
    responseRate: responseRate(apps, input.reachedStatuses, input.now),
  };
}
