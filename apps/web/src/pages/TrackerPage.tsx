import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Download, LayoutGrid, Table2, X } from "lucide-react";
import { StatusBadge, Button, Select, Input } from "@/components/ui";
import { useApplications, useOptions, useChangeStatus, useTimeline, type Application } from "@/hooks/useDashboard";
import { formatDate } from "@/lib/format";
import { api } from "@/lib/api";

/**
 * Job Tracker (spesifikasi MD §5): tampilan Tabel ↔ Kanban (?view=),
 * filter di URL, kolom Perusahaan sticky, penanda baris follow-up /
 * deadline mepet / terlewat, inline edit di fase lanjutan.
 */
export function TrackerPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") ?? "table";
  const { data: options } = useOptions();
  const statuses = options?.items.filter((o) => o.tipe === "status_lamaran").sort((a, b) => a.urutan - b.urutan) ?? [];
  const priorities = options?.items.filter((o) => o.tipe === "prioritas").sort((a, b) => a.urutan - b.urutan) ?? [];

  const qs = useMemo(() => {
    const p = new URLSearchParams(params);
    p.delete("view");
    return p;
  }, [params]);
  const { data, isLoading } = useApplications(qs);
  const changeStatus = useChangeStatus();
  const [selected, setSelected] = useState<Application | null>(null);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    setParams(p, { replace: true });
  };

  const filter = params.get("filter");

  return (
    <div className="flex flex-col gap-gap">
      {/* Kontrol */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            value={params.get("q") ?? ""}
            onChange={(e) => setParam("q", e.target.value)}
            placeholder="Cari perusahaan/posisi…"
            aria-label="Cari lamaran"
            className="h-11 w-60 rounded-pill bg-surface-sunken pl-9 pr-4 text-[15px] shadow-clay-pressed focus:outline-3 focus:outline-accent"
          />
        </div>
        <Select value={params.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)} className="!w-44" aria-label="Filter status">
          <option value="">Semua status</option>
          {statuses.map((s) => <option key={s.id} value={s.label}>{s.label}</option>)}
        </Select>
        <Select value={params.get("prioritas") ?? ""} onChange={(e) => setParam("prioritas", e.target.value)} className="!w-36" aria-label="Filter prioritas">
          <option value="">Semua prioritas</option>
          {priorities.map((p) => <option key={p.id} value={p.label}>{p.label}</option>)}
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" aria-label="Export CSV">
            <Download size={16} aria-hidden /> CSV
          </Button>
          <Button size="sm"><Plus size={16} aria-hidden /> Tambah</Button>
        </div>
      </div>

      {/* Toggle view */}
      <div className="flex items-center gap-1 self-start rounded-pill bg-surface-sunken p-1" role="tablist" aria-label="Tampilan tracker">
        {([["table", "Tabel", Table2], ["kanban", "Kanban", LayoutGrid]] as const).map(([v, label, Icon]) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setParam("view", v === "table" ? "" : v)}
            className={`flex h-9 items-center gap-2 rounded-pill px-4 text-[13px] font-semibold transition-shadow ${
              view === v ? "bg-surface text-accent shadow-clay-sm" : "text-text-muted"
            }`}
          >
            <Icon size={15} aria-hidden /> {label}
          </button>
        ))}
      </div>

      {filter && (
        <div className="flex items-center gap-2 text-[13px] text-text-muted">
          Filter aktif: <span className="rounded-pill bg-accent-soft px-2.5 py-0.5 font-semibold text-accent">{filter}</span>
          <button onClick={() => setParam("filter", "")} aria-label="Hapus filter"><X size={14} /></button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-md bg-surface shadow-clay-sm" />)}</div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState />
      ) : view === "kanban" ? (
        <KanbanView items={data.items} statuses={statuses.map((s) => s.label)} onSelect={setSelected} onDrop={(id, status) => changeStatus.mutate({ id, status })} />
      ) : (
        <TableView items={data.items} onSelect={setSelected} />
      )}

      {selected && <Drawer app={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function rowAccent(a: Application): string {
  const today = new Date().toISOString().slice(0, 10);
  if (a.status === "Ditolak" || a.status === "Ghosting") return "";
  if (a.deadline && a.deadline < today) return "border-l-4 border-l-danger";
  if (a.deadline && a.deadline >= today && a.deadline <= new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)) return "border-l-4 border-l-warning";
  if ((a.status === "Applied" || a.status === "Screening HR") && Date.now() - new Date(a.statusChangedAt).getTime() >= 7 * 86400000) return "border-l-4 border-l-warning";
  if (a.status === "Offering") return "border-l-4 border-l-success bg-success-soft/30";
  return "";
}

function TableView({ items, onSelect }: { items: Application[]; onSelect: (a: Application) => void }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-surface shadow-clay-md">
      <table className="w-full min-w-[900px] border-collapse text-[15px]">
        <thead>
          <tr className="bg-surface-sunken text-left text-[13px] font-semibold text-text-secondary">
            <th className="px-4 py-3">Tgl Apply</th>
            <th className="sticky left-0 z-10 bg-surface-sunken px-4 py-3 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)]">Perusahaan</th>
            <th className="px-4 py-3">Posisi</th>
            <th className="px-4 py-3">Lokasi</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Prioritas</th>
            <th className="px-4 py-3">Deadline</th>
            <th className="px-4 py-3">Interview</th>
            <th className="px-4 py-3">Next Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr
              key={a.id}
              onClick={() => onSelect(a)}
              className={`cursor-pointer border-t border-surface-sunken transition-colors hover:bg-accent-soft/20 ${rowAccent(a)}`}
            >
              <td className="px-4 py-3 whitespace-nowrap text-text-secondary">{formatDate(a.tglApply)}</td>
              <td className="sticky left-0 z-10 bg-surface px-4 py-3 font-semibold whitespace-nowrap shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)]">{a.perusahaan}</td>
              <td className="px-4 py-3">{a.posisi}</td>
              <td className="px-4 py-3 text-text-secondary">{a.lokasi ?? "—"}</td>
              <td className="px-4 py-3"><StatusBadge label={a.status} /></td>
              <td className="px-4 py-3">{a.prioritas ? <StatusBadge label={a.prioritas} /> : "—"}</td>
              <td className={`px-4 py-3 whitespace-nowrap ${a.deadline && a.deadline < new Date().toISOString().slice(0, 10) ? "font-bold text-danger-text" : ""}`}>{formatDate(a.deadline)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(a.tglInterview)}</td>
              <td className="max-w-52 truncate px-4 py-3 text-text-secondary">{a.nextAction ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KanbanView({
  items, statuses, onSelect, onDrop,
}: {
  items: Application[];
  statuses: string[];
  onSelect: (a: Application) => void;
  onDrop: (id: string, status: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statuses.map((status) => {
        const col = items.filter((a) => a.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => { e.preventDefault(); setOverCol(status); }}
            onDragLeave={() => setOverCol(null)}
            onDrop={() => {
              if (dragId) onDrop(dragId, status);
              setDragId(null);
              setOverCol(null);
            }}
            className={`w-70 shrink-0 rounded-lg bg-surface-sunken p-3 min-h-80 ${overCol === status ? "ring-2 ring-dashed ring-accent" : ""}`}
          >
            <h3 className="flex items-center justify-between px-1 pb-2 text-[15px] font-bold">
              {status}
              <span className="rounded-pill bg-surface px-2.5 py-0.5 text-xs font-semibold shadow-clay-sm">{col.length}</span>
            </h3>
            <div className="flex flex-col gap-3">
              {col.map((a) => (
                <button
                  key={a.id}
                  draggable
                  onDragStart={() => setDragId(a.id)}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => onSelect(a)}
                  className={`w-full cursor-grab rounded-md bg-surface p-3 text-left shadow-clay-sm transition-transform active:cursor-grabbing ${
                    dragId === a.id ? "rotate-2 opacity-95 shadow-clay-lg" : "hover:-translate-y-0.5"
                  }`}
                >
                  <p className="text-base font-bold">{a.perusahaan}</p>
                  <p className="text-[13px] text-text-secondary">{a.posisi}</p>
                  <div className="mt-2 flex items-center justify-between">
                    {a.prioritas ? <StatusBadge label={a.prioritas} /> : <span />}
                    <span className="text-xs text-text-muted">{formatDate(a.deadline ?? a.tglInterview ?? a.tglApply)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg bg-surface p-12 shadow-clay-md">
      <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-accent-soft shadow-clay-sm">
        <Plus size={28} className="text-accent" aria-hidden />
      </span>
      <p className="text-[15px] font-semibold">Belum ada lamaran</p>
      <p className="text-[13px] text-text-muted">Tiap apply, tambahkan 1 baris di sini biar tidak ada yang lupa.</p>
      <Button size="sm"><Plus size={16} aria-hidden /> Tambah Lamaran</Button>
    </div>
  );
}

/** Aksi cepat drawer (prompt §8.5): Buat Offer + Tambah pertanyaan interview. */
function QuickActions({ app }: { app: Application }) {
  const qc = useQueryClient();
  const makeOffer = useMutation({
    mutationFn: () => api.post(`/api/offers/from-application/${app.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      alert("Offer dibuat dari lamaran ini. Cek halaman Offer.");
    },
  });
  const addQuestion = useMutation({
    mutationFn: () =>
      api.post("/api/questions", {
        pertanyaan: `Persiapan interview ${app.perusahaan} — posisi ${app.posisi}`,
        untukRole: app.posisi,
        status: "Belum Disiapkan",
        prioritas: "Tinggi",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      alert("Pertanyaan interview ditambahkan untuk role ini.");
    },
  });

  return (
    <>
      <Button size="sm" variant="secondary" loading={makeOffer.isPending} onClick={() => makeOffer.mutate()}>
        Buat Offer
      </Button>
      <Button size="sm" variant="ghost" loading={addQuestion.isPending} onClick={() => addQuestion.mutate()}>
        + Pertanyaan Interview
      </Button>
    </>
  );
}

function Drawer({ app, onClose }: { app: Application; onClose: () => void }) {
  const { data: timeline } = useTimeline(app.id);
  const changeStatus = useChangeStatus();
  const { data: options } = useOptions();
  const statuses = options?.items.filter((o) => o.tipe === "status_lamaran").sort((a, b) => a.urutan - b.urutan) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Detail ${app.perusahaan}`}>
      <button className="absolute inset-0 bg-text-primary/30" onClick={onClose} aria-label="Tutup" />
      <div className="relative h-full w-full max-w-[520px] overflow-y-auto rounded-l-xl bg-surface p-card shadow-clay-lg">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold">{app.perusahaan}</h2>
            <p className="text-[15px] text-text-secondary">{app.posisi}</p>
            <div className="mt-2"><StatusBadge label={app.status} /></div>
          </div>
          <button onClick={onClose} aria-label="Tutup drawer" className="flex h-11 w-11 items-center justify-center rounded-pill bg-surface-sunken shadow-clay-sm"><X size={18} /></button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Select
            value=""
            onChange={(e) => e.target.value && changeStatus.mutate({ id: app.id, status: e.target.value })}
            className="!w-44"
            aria-label="Ubah status"
          >
            <option value="" disabled>Ubah status…</option>
            {statuses.map((s) => <option key={s.id} value={s.label}>{s.label}</option>)}
          </Select>
          <QuickActions app={app} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-[15px]">
          {[["Tgl Apply", formatDate(app.tglApply)], ["Deadline", formatDate(app.deadline)], ["Interview", formatDate(app.tglInterview)],
            ["Lokasi", app.lokasi ?? "—"], ["Tipe", app.tipeKerja ?? "—"], ["Mode", app.modeKerja ?? "—"],
            ["Est. Gaji", app.estGajiTeks ?? (app.estGajiBawah ? `${app.estGajiBawah}–${app.estGajiAtas}` : "—")], ["Portal", app.portalId ?? "—"]].map(([k, v]) => (
            <div key={k as string}>
              <dt className="text-[13px] font-semibold text-text-secondary">{k}</dt>
              <dd className="text-text-primary">{v}</dd>
            </div>
          ))}
        </dl>

        <h3 className="mt-6 text-lg font-bold">Timeline Status</h3>
        <ol className="mt-3 flex flex-col gap-0 border-l-2 border-accent-soft pl-5">
          {(timeline?.items ?? []).map((t, i) => (
            <li key={t.id} className="relative pb-4">
              <span className="absolute -left-[27px] flex h-6 w-6 items-center justify-center rounded-pill bg-accent-soft shadow-clay-sm text-[10px] font-extrabold text-accent">{i + 1}</span>
              <p className="text-[15px] font-semibold">{t.statusBaru}</p>
              <p className="text-xs text-text-muted">{formatDate(t.changedAt.slice(0, 10))}</p>
            </li>
          ))}
        </ol>

        <h3 className="mt-4 text-lg font-bold">Catatan</h3>
        <p className="mt-2 rounded-md bg-surface-sunken p-4 text-[15px] text-text-secondary shadow-clay-pressed">{app.catatan ?? "—"}</p>
      </div>
    </div>
  );
}
