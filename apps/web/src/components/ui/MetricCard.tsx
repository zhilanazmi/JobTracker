import type { LucideIcon } from "lucide-react";

/**
 * Cmp · MetricCard dari .pen: radius lg, clay-md, vertical gap 14, p-card.
 * Top: label 13/600 uppercase text-secondary + IconWrap bulatan 44
 * accent-soft. Value 40/800. DeltaRow: pill delta 12 + caption 12 muted.
 */
const SOFT_CLASS: Record<string, string> = {
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-neutral-soft text-neutral",
};

export interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconColor?: keyof typeof SOFT_CLASS;
  delta?: { text: string; up: boolean; caption?: string } | null;
}

export function MetricCard({ label, value, icon: Icon, iconColor = "accent", delta }: MetricCardProps) {
  return (
    <div className="rounded-lg bg-surface p-card shadow-clay-md flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold tracking-wide uppercase text-text-secondary">{label}</span>
        <span className={`flex h-11 w-11 items-center justify-center rounded-pill shadow-clay-sm ${SOFT_CLASS[iconColor]}`}>
          <Icon size={20} aria-hidden />
        </span>
      </div>
      <div className="text-[40px] leading-none font-extrabold text-text-primary">{value}</div>
      {delta && (
        <div className="flex items-center gap-2">
          <span className={`rounded-pill px-2 py-0.5 text-xs font-semibold shadow-clay-sm ${delta.up ? "bg-success-soft text-success-text" : "bg-danger-soft text-danger-text"}`}>
            {delta.up ? "↑" : "↓"} {delta.text}
          </span>
          {delta.caption && <span className="text-xs text-text-muted">{delta.caption}</span>}
        </div>
      )}
    </div>
  );
}
