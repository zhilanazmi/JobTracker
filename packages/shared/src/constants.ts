/**
 * Status lamaran default + pengelompokan (prompt §5).
 * Daftar bisa diedit user; angka ini hanya seed awal.
 */
export const DEFAULT_STATUSES: {
  label: string;
  urutan: number;
  warnaToken: string;
  isTerminal: boolean;
}[] = [
  { label: "Wishlist", urutan: 1, warnaToken: "neutral", isTerminal: false },
  { label: "Mau Apply", urutan: 2, warnaToken: "info", isTerminal: false },
  { label: "Applied", urutan: 3, warnaToken: "info", isTerminal: false },
  { label: "Screening HR", urutan: 4, warnaToken: "info", isTerminal: false },
  { label: "Tes/Assignment", urutan: 5, warnaToken: "warning", isTerminal: false },
  { label: "Interview User", urutan: 6, warnaToken: "warning", isTerminal: false },
  { label: "Interview Akhir", urutan: 7, warnaToken: "warning", isTerminal: false },
  { label: "Offering", urutan: 8, warnaToken: "success", isTerminal: false },
  { label: "Diterima", urutan: 9, warnaToken: "success", isTerminal: true },
  { label: "Ditolak", urutan: 10, warnaToken: "danger", isTerminal: true },
  { label: "Ghosting", urutan: 11, warnaToken: "neutral", isTerminal: true },
];

export const DEFAULT_PRIORITIES = [
  { label: "Tinggi", urutan: 1, warnaToken: "danger", isTerminal: false },
  { label: "Sedang", urutan: 2, warnaToken: "warning", isTerminal: false },
  { label: "Rendah", urutan: 3, warnaToken: "neutral", isTerminal: false },
];

/** Status yang dihitung sebagai interview/tes (prompt §5). */
export const INTERVIEW_STATUSES = ["Tes/Assignment", "Interview User", "Interview Akhir"];

/** Status yang dihitung sebagai offer/diterima (prompt §5). */
export const OFFER_STATUSES = ["Offering", "Diterima"];

/** Status terminal (pipeline berakhir). */
export const TERMINAL_STATUSES = ["Diterima", "Ditolak", "Ghosting"];

/** Tahap funnel, urut dari awal (prompt §5: dari log "pernah mencapai"). */
export const FUNNEL_STAGES = [
  "Applied",
  "Screening HR",
  "Tes/Assignment",
  "Interview User",
  "Interview Akhir",
  "Offering",
  "Diterima",
];
