/**
 * Aturan bisnis dari prompt §5. Semua perhitungan "hari ini" memakai
 * timezone Asia/Jakarta (WIB), bukan timezone server.
 */
import { Decimal } from "./decimal-shim";

export const WIB_TZ = "Asia/Jakarta";

/** Tanggal hari ini di WIB sebagai "YYYY-MM-DD". */
export function todayWIB(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now); // en-CA = YYYY-MM-DD
}

/** Selisih hari: from (lebih baru) − to (lebih tua), dalam hari kalender. */
export function daysBetween(to: string, from: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((a - b) / 86_400_000);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Senin pada minggu berjalan (Senin–Minggu, WIB). */
export function startOfWeekWIB(now: Date = new Date()): string {
  const today = todayWIB(now);
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0=Minggu
  const back = dow === 0 ? 6 : dow - 1;
  return addDays(today, -back);
}
