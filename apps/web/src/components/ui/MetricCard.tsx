import type { LucideIcon } from "lucide-react";

/** Compact outlined metric card. */
const SOFT_CLASS: Record<string, string> = {
  accent: "bg-accent-soft text-accent-text",
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
  info: "bg-info-soft text-info-text",
  neutral: "bg-neutral-soft text-neutral-text",
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
    <div className="flex flex-col gap-3.5 rounded-lg border-2 border-text-primary bg-surface p-card shadow-clay-md">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold tracking-wide uppercase text-text-secondary">{label}</span>
        <span className={`flex h-11 w-11 items-center justify-center rounded-md border-2 border-text-primary shadow-clay-sm ${SOFT_CLASS[iconColor]}`}>
          <Icon size={20} aria-hidden />
        </span>
      </div>
      <div className="text-tabular text-[40px] leading-none font-extrabold text-text-primary">{value}</div>
      {delta && (
        <div className="flex items-center gap-2">
          <span className={`rounded-md border-2 border-text-primary px-2 py-0.5 text-xs font-semibold shadow-clay-sm ${delta.up ? "bg-success-soft text-success-text" : "bg-danger-soft text-danger-text"}`}>
            {delta.up ? "↑" : "↓"} {delta.text}
          </span>
          {delta.caption && <span className="text-xs text-text-muted">{delta.caption}</span>}
        </div>
      )}
    </div>
  );
}
