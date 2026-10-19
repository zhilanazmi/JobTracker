import type { ReactNode } from "react";

/** Compact outlined label; active state uses the blue accent. */
export function Chip({
  children,
  active = false,
  interactive = false,
}: {
  children: ReactNode;
  active?: boolean;
  interactive?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border-2 border-text-primary px-3.5 py-1.5 text-[13px] font-bold shadow-clay-sm transition-shadow ${
        active ? "bg-accent-soft text-accent-text" : "bg-surface text-text-secondary"
      } ${interactive && !active ? "group-hover:shadow-clay-md group-hover:text-text-primary" : ""}`}
    >
      {children}
    </span>
  );
}
