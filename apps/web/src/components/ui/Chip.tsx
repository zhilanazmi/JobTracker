import type { ReactNode } from "react";

/**
 * Cmp · Chip dari .pen: pill, bg-surface, clay-sm, label kecil.
 * Variant active: bg-accent-soft.
 */
export function Chip({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-3.5 py-1.5 text-[13px] font-semibold shadow-clay-sm ${
        active ? "bg-accent-soft text-accent" : "bg-surface text-text-secondary"
      }`}
    >
      {children}
    </span>
  );
}
