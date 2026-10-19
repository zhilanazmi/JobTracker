import type { ReactNode } from "react";

/** Neobrutalist card with bold outline and hard offset shadow. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border-2 border-text-primary bg-surface p-card shadow-clay-md ${className}`}>{children}</div>;
}

/** Judul seksi dalam kartu: h2 22/700. */
export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-[22px] font-bold text-text-primary ${className}`}>{children}</h2>;
}
