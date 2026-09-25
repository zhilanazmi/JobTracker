/**
 * Cmp · StatusBadge dari .pen: pill, fill soft, teks solid, clay-sm.
 * Pemetaan warna default per status (bisa dioverride warnaToken dari
 * option_lists — Setup bisa ganti warna per status).
 */
const TOKEN_CLASS: Record<string, string> = {
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
  info: "bg-info-soft text-info-text",
  neutral: "bg-neutral-soft text-neutral-text",
  accent: "bg-accent-soft text-accent",
};

const DEFAULT_TOKEN: Record<string, string> = {
  Wishlist: "neutral",
  "Mau Apply": "info",
  Applied: "info",
  "Screening HR": "info",
  "Tes/Assignment": "warning",
  "Interview User": "warning",
  "Interview Akhir": "warning",
  Offering: "success",
  Diterima: "success",
  Ditolak: "danger",
  Ghosting: "neutral",
  // prioritas
  Tinggi: "danger",
  Sedang: "warning",
  Rendah: "neutral",
};

export function StatusBadge({
  label,
  warnaToken,
}: {
  label: string;
  warnaToken?: string | null;
}) {
  const token = warnaToken ?? DEFAULT_TOKEN[label] ?? "neutral";
  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold shadow-clay-sm whitespace-nowrap ${TOKEN_CLASS[token] ?? TOKEN_CLASS.neutral}`}
    >
      {label}
    </span>
  );
}
