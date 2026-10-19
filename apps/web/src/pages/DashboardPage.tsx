import { Link } from "react-router-dom";
import {
  Briefcase, Send, CalendarClock, Trophy, Activity, Percent,
  ChevronRight, Flame, BarChart3, Settings,
} from "lucide-react";
import { MetricCard, Button } from "@/components/ui";
import { useDashboard } from "@/hooks/useDashboard";
import type { LucideIcon } from "lucide-react";

const TODO_ICONS: Record<string, LucideIcon> = {
  followup: Send,
  "minggu-ini": Briefcase,
  deadline: CalendarClock,
  interview: CalendarClock,
  kontak: Flame,
  dokumen: Settings,
};

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <Skeleton />;
  if (isError || !data) return <div className="rounded-lg bg-surface p-card shadow-clay-md text-danger-text">Gagal memuat dashboard. Coba muat ulang.</div>;

  const m = data.metrics;

  return (
    <div className="flex flex-col gap-gap">
      {data.profileIncomplete && (
        <div className="flex min-h-16 flex-wrap items-center gap-4 rounded-md bg-accent-secondary/30 px-6 py-3 shadow-clay-sm">
          <Settings size={24} className="text-accent-text shrink-0" aria-hidden />
          <p className="min-w-0 flex-1 text-[15px] font-semibold">Isi profil di Setup dulu biar target &amp; metrik akurat</p>
          <Link to="/setup" className="shrink-0">
            <Button size="sm">Isi Sekarang</Button>
          </Link>
        </div>
      )}

      {/* 6 metrik, grid 3×2 desktop / 2 kolom mobile */}
      <div className="grid grid-cols-2 gap-gap xl:grid-cols-3">
        <MetricCard label="Total Entri" value={String(m.totalEntri)} icon={Briefcase} iconColor="accent" />
        <MetricCard label="Sudah Apply" value={String(m.sudahApply)} icon={Send} iconColor="info" />
        <MetricCard label="Interview/Tes" value={String(m.interviewTes)} icon={CalendarClock} iconColor="warning" />
        <MetricCard label="Offer/Diterima" value={String(m.offerDiterima)} icon={Trophy} iconColor="success" />
        <MetricCard label="Aktif Pipeline" value={String(m.aktifPipeline)} icon={Activity} iconColor="accent" />
        <MetricCard label="Response Rate" value={m.responseRate == null ? "—" : `${m.responseRate}%`} icon={Percent} iconColor="info" />
      </div>

      <div className="grid grid-cols-1 gap-gap xl:grid-cols-[736fr_360fr]">
        {/* Yang Harus Dikerjain */}
        <section className="rounded-lg bg-surface p-card shadow-clay-md" aria-labelledby="todo-title">
          <h2 id="todo-title" className="flex items-center gap-2 text-[22px] font-bold">
            <Flame size={22} className="text-accent-text-secondary" aria-hidden /> Yang Harus Dikerjain
          </h2>
          <ul className="mt-4 divide-y divide-surface-sunken">
            {data.todo.map((item) => {
              const Icon = TODO_ICONS[item.key] ?? Briefcase;
              const disabled = item.jumlah === 0;
              return (
                <li key={item.key}>
                  {disabled ? (
                    <div className="flex h-14 items-center gap-4 opacity-50" aria-disabled>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-accent-text">
                        <Icon size={18} aria-hidden />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-semibold">{item.judul}</span>
                        <span className="block text-xs text-text-muted">{item.deskripsi}</span>
                      </span>
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      className="-mx-3 flex min-h-14 items-center gap-4 rounded-md px-3 transition-colors hover:bg-surface-sunken"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-accent-text">
                        <Icon size={18} aria-hidden />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-semibold">{item.judul}</span>
                        <span className="block text-xs text-text-muted">{item.deskripsi}</span>
                      </span>
                      <ChevronRight size={16} className="shrink-0 text-text-muted" aria-hidden />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Funnel */}
        <section className="rounded-lg bg-surface p-card shadow-clay-md" aria-labelledby="funnel-title">
          <h2 id="funnel-title" className="flex items-center gap-2 text-[22px] font-bold">
            <BarChart3 size={22} className="text-accent-text" aria-hidden /> Funnel Lamaran
          </h2>
          <ol className="mt-4 flex flex-col gap-4">
            {data.funnel.map((f, i) => {
              const max = Math.max(...data.funnel.map((x) => x.count), 1);
              const width = Math.max(8, (f.count / max) * 100);
              return (
                <li key={f.stage}>
                  <div className="flex items-center gap-2">
                    <span className="w-26 shrink-0 text-[13px] font-semibold">{f.stage}</span>
                    <div className="h-7 flex-1 rounded-pill bg-surface-sunken">
                      <div className="flex h-7 items-center justify-end rounded-pill bg-accent pr-2 text-[13px] font-extrabold text-white" style={{ width: `${width}%` }}>
                        {f.count}
                      </div>
                    </div>
                  </div>
                  {i > 0 && f.conversion != null && (
                    <p className="text-right text-[11px] text-text-muted">{f.conversion}% dari tahap sebelumnya</p>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-gap animate-pulse">
      <div className="h-16 rounded-md bg-surface-sunken" />
      <div className="grid grid-cols-2 gap-gap xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-surface shadow-clay-md" />
        ))}
      </div>
    </div>
  );
}
