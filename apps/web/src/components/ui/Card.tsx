import type { ReactNode } from "react";

/**
 * Kartu clay generik: bg-surface, radius lg, clay-md, padding card.
 * Nivel 1 clay — jangan tumpuk kartu dalam kartu (aturan resep MD).
 */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg bg-surface p-card shadow-clay-md ${className}`}>{children}</div>;
}

/** Judul seksi dalam kartu: h2 22/700. */
export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-[22px] font-bold text-text-primary">{children}</h2>;
}
