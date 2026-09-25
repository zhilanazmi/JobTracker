/**
 * Cmp · Avatar dari .pen: 40×40 bulat, accent-secondary, clay-sm, inisial.
 */
export function Avatar({ initials, size = 40 }: { initials: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-pill bg-accent-secondary text-text-primary font-bold shadow-clay-sm"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-label={initials}
    >
      {initials}
    </span>
  );
}
