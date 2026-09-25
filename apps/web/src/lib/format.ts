/** Format util global (prompt §8): tanggal DD MMM YYYY id-ID, Rupiah penuh. */

const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const rupiahFmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dateFmt.format(new Date(`${iso.slice(0, 10)}T00:00:00`));
}

export function formatRupiah(value: string | null | undefined): string {
  if (!value) return "—";
  return rupiahFmt.format(Number(value));
}

/** "Rp 9,5 jt" untuk ruang sempit — uang tetap tak pernah dihitung sebagai number di data. */
export function formatRupiahShort(value: string | null | undefined): string {
  if (!value) return "—";
  const n = Number(value);
  if (n >= 1_000_000_000) return `Rp ${trim1(n / 1_000_000_000)} M`;
  if (n >= 1_000_000) return `Rp ${trim1(n / 1_000_000)} jt`;
  return formatRupiah(value);
}
const trim1 = (n: number) => (Number.isInteger(n) ? n.toFixed(0) : n.toFixed(1).replace(".", ","));
