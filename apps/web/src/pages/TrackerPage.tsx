import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Download, LayoutGrid, Table2, X, CalendarClock, AlertTriangle, Flame, Briefcase, Pencil, Trash2 } from "lucide-react";
import { StatusBadge, Button, Select, Input, Textarea, Field, Card } from "@/components/ui";
import { useApplications, useOptions, useChangeStatus, useTimeline, type Application } from "@/hooks/useDashboard";
import { formatDate } from "@/lib/format";
import { api } from "@/lib/api";

/** Job Tracker: table/Kanban, filters, detail drawer, and application CRUD. */
function rowAccent(a: Application): { cls: string; icon: typeof AlertTriangle; label: string } | null {
  const today = new Date().toISOString().slice(0, 10);
  if (a.status === "Ditolak" || a.status === "Ghosting") return null;
  if (a.deadline && a.deadline < today) return { cls: "border-l-4 border-l-danger", icon: AlertTriangle, label: "Deadline terlewat" };
  if (a.deadline && a.deadline >= today && a.deadline <= new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10))
    return { cls: "border-l-4 border-l-warning", icon: CalendarClock, label: "Deadline mepet" };
  if ((a.status === "Applied" || a.status === "Screening HR") && Date.now() - new Date(a.statusChangedAt).getTime() >= 7 * 86400000)
    return { cls: "border-l-4 border-l-warning", icon: Flame, label: "Perlu follow-up" };
  if (a.status === "Offering") return { cls: "border-l-4 border-l-success bg-success-soft/30", icon: Flame, label: "Offering" };
  return null;
}

type ApplicationFormData = {
  tglApply: string; perusahaan: string; posisi: string; portalId: string; tipeKerja: string; modeKerja: string;
  lokasi: string; estGajiBawah: string; estGajiAtas: string; estGajiTeks: string; status: string; prioritas: string;
  deadline: string; tglInterview: string; nextAction: string; linkLowongan: string; catatan: string;
};
type ApplicationPayload = {
  tglApply: string | null; perusahaan: string; posisi: string; portalId: number | null; tipeKerja: string | null; modeKerja: string | null;
  lokasi: string | null; estGajiBawah: string | null; estGajiAtas: string | null; estGajiTeks: string | null; status: string; prioritas: string | null;
  deadline: string | null; tglInterview: string | null; nextAction: string | null; linkLowongan: string | null; catatan: string | null;
};

function toApplicationPayload(form: ApplicationFormData): ApplicationPayload {
  return {
    tglApply: form.tglApply || null,
    perusahaan: form.perusahaan.trim(),
    posisi: form.posisi.trim(),
    portalId: form.portalId ? Number(form.portalId) : null,
    tipeKerja: form.tipeKerja || null,
    modeKerja: form.modeKerja || null,
    lokasi: form.lokasi || null,
    estGajiBawah: form.estGajiBawah || null,
    estGajiAtas: form.estGajiAtas || null,
    estGajiTeks: form.estGajiTeks || null,
    status: form.status,
    prioritas: form.prioritas || null,
    deadline: form.deadline || null,
    tglInterview: form.tglInterview || null,
    nextAction: form.nextAction || null,
    linkLowongan: form.linkLowongan || null,
    catatan: form.catatan || null,
  };
}

export function TrackerPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") ?? "table";
  const { data: options } = useOptions();
  const statuses = options?.items.filter((o) => o.tipe === "status_lamaran").sort((a, b) => a.urutan - b.urutan) ?? [];
  const priorities = options?.items.filter((o) => o.tipe === "prioritas").sort((a, b) => a.urutan - b.urutan) ?? [];
  const queryClient = useQueryClient();
  const [qInput, setQInput] = useState(params.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected] = useState<Application | null>(null);
  const [editing, setEditing] = useState<Application | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Application | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    setParams(p, { replace: true });
  };
  const setQDebounced = (value: string) => {
    setQInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam("q", value), 300);
  };
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const qs = useMemo(() => {
    const p = new URLSearchParams(params);
    p.delete("view");
    return p;
  }, [params]);
  const { data, isLoading } = useApplications(qs);
  const { data: portalsData } = useQuery({
    queryKey: ["application-portals"],
    queryFn: () => api.get<{ items: { id: string; namaPortal: string }[] }>("/api/portals?take=100"),
  });
  const changeStatus = useChangeStatus();
  const create = useMutation({
    mutationFn: (body: ApplicationPayload) => api.post<Application>("/api/applications", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setCreating(false);
      setCreateError(null);
    },
    onError: (error) => setCreateError(error instanceof Error ? error.message : "Gagal menyimpan lamaran."),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ApplicationPayload }) => api.patch<Application>(`/api/applications/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setEditing(null);
      setCreateError(null);
    },
    onError: (error) => setCreateError(error instanceof Error ? error.message : "Gagal menyimpan perubahan."),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/applications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleting(null);
      setSelected(null);
      setDeleteError(null);
    },
    onError: (error) => setDeleteError(error instanceof Error ? error.message : "Gagal menghapus lamaran."),
  });

  const filter = params.get("filter");
  const hasAnyFilter = Boolean(params.get("q") || params.get("status") || params.get("prioritas") || filter);
  const clearAllFilters = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const p = new URLSearchParams();
    if (view !== "table") p.set("view", view);
    setQInput("");
    setParams(p, { replace: true });
  };

  return (
    <div className="flex flex-col gap-gap">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
          <input value={qInput} onChange={(e) => setQDebounced(e.target.value)} placeholder="Cari perusahaan/posisi…" aria-label="Cari lamaran" type="search" className="h-11 w-60 rounded-pill bg-surface-sunken pl-9 pr-4 text-[15px] shadow-clay-pressed focus:outline-3 focus:outline-accent" />
        </div>
        <Select value={params.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)} className="!w-44" aria-label="Filter status"><option value="">Semua status</option>{statuses.map((s) => <option key={s.id} value={s.label}>{s.label}</option>)}</Select>
        <Select value={params.get("prioritas") ?? ""} onChange={(e) => setParam("prioritas", e.target.value)} className="!w-36" aria-label="Filter prioritas"><option value="">Semua prioritas</option>{priorities.map((p) => <option key={p.id} value={p.label}>{p.label}</option>)}</Select>
        {hasAnyFilter && <Button variant="ghost" size="sm" onClick={clearAllFilters}><X size={14} aria-hidden /> Bersihkan</Button>}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" aria-label="Export CSV" title="Segera tersedia"><Download size={16} aria-hidden /> CSV</Button>
          <Button size="sm" onClick={() => { setCreateError(null); create.reset(); setCreating(true); }}><Plus size={16} aria-hidden /> Tambah Lamaran</Button>
        </div>
      </div>

      <div className="flex items-center gap-1 self-start rounded-pill bg-surface-sunken p-1" role="tablist" aria-label="Tampilan tracker">
        {([["table", "Tabel", Table2], ["kanban", "Kanban", LayoutGrid]] as const).map(([v, label, Icon]) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setParam("view", v === "table" ? "" : v)} className={`flex h-9 items-center gap-2 rounded-pill px-4 text-[13px] font-semibold transition-shadow focus-visible:outline-3 focus-visible:outline-accent ${view === v ? "bg-surface text-accent-text shadow-clay-sm" : "text-text-muted hover:text-text-primary"}`}>
            <Icon size={15} aria-hidden /> {label}
          </button>
        ))}
      </div>
      {filter && <div className="flex items-center gap-2 text-[13px] text-text-muted">Filter aktif: <span className="rounded-pill bg-accent-soft px-2.5 py-0.5 font-semibold text-accent-text">{filter}</span><button onClick={() => setParam("filter", "")} aria-label="Hapus filter" className="rounded-pill p-1 hover:bg-surface-sunken"><X size={14} aria-hidden /></button></div>}
      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-md bg-surface shadow-clay-sm" />)}</div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState hasFilter={hasAnyFilter} onClear={clearAllFilters} onCreate={() => { setCreateError(null); create.reset(); setCreating(true); }} />
      ) : view === "kanban" ? (
        <KanbanView items={data.items} statuses={statuses.map((s) => s.label)} onSelect={setSelected} onDrop={(id, status) => changeStatus.mutate({ id, status })} />
      ) : (
        <TableView items={data.items} onSelect={setSelected} onEdit={(app) => { setCreateError(null); update.reset(); setEditing(app); }} onDelete={(app) => { setDeleteError(null); remove.reset(); setDeleting(app); }} />
      )}
      {selected && <Drawer app={selected} onClose={() => setSelected(null)} onEdit={() => { setCreateError(null); update.reset(); setEditing(selected); }} onDelete={() => { setDeleteError(null); remove.reset(); setDeleting(selected); }} />}
      {(creating || editing) && <ApplicationFormModal key={editing?.id ?? "new"} initial={editing} statuses={statuses.map((s) => s.label)} priorities={priorities.map((p) => p.label)} portals={portalsData?.items ?? []} loading={create.isPending || update.isPending} error={createError} onClose={() => { if (create.isPending || update.isPending) return; setCreating(false); setEditing(null); }} onSave={(body) => editing ? update.mutate({ id: editing.id, body }) : create.mutate(body)} />}
      {deleting && <DeleteApplicationConfirm app={deleting} loading={remove.isPending} error={deleteError} onClose={() => { if (remove.isPending) return; setDeleting(null); }} onConfirm={() => remove.mutate(deleting.id)} />}
    </div>
  );
}

function TableView({ items, onSelect, onEdit, onDelete }: { items: Application[]; onSelect: (a: Application) => void; onEdit: (a: Application) => void; onDelete: (a: Application) => void }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-surface shadow-clay-md">
      <table className="w-full min-w-table-lg border-collapse text-[15px]">
        <thead><tr className="bg-surface-sunken text-left text-[13px] font-semibold text-text-secondary">
          <th className="px-4 py-3">Tgl Apply</th><th className="sticky left-0 z-10 bg-surface-sunken px-4 py-3 shadow-clay-sm">Perusahaan</th><th className="px-4 py-3">Posisi</th><th className="px-4 py-3">Lokasi</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Prioritas</th><th className="px-4 py-3">Deadline</th><th className="px-4 py-3">Interview</th><th className="px-4 py-3">Next Action</th><th className="px-4 py-3">Aksi</th>
        </tr></thead>
        <tbody>{items.map((a) => {
          const accent = rowAccent(a);
          const AccentIcon = accent?.icon;
          return <tr key={a.id} onClick={() => onSelect(a)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onSelect(a)} aria-label={`Detail ${a.perusahaan} — ${a.posisi}`} className={`cursor-pointer border-t border-surface-sunken transition-colors hover:bg-accent-soft/20 focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-accent ${accent?.cls ?? ""}`}>
            <td className="px-4 py-3 whitespace-nowrap text-text-secondary">{formatDate(a.tglApply)}</td><td className="sticky left-0 z-10 bg-surface px-4 py-3 font-semibold whitespace-nowrap shadow-clay-sm">{accent && AccentIcon && <span title={accent.label} aria-label={accent.label}><AccentIcon size={13} aria-hidden className="mr-1.5 inline text-text-muted" /></span>}{a.perusahaan}</td><td className="px-4 py-3">{a.posisi}</td><td className="px-4 py-3 text-text-secondary">{a.lokasi ?? "—"}</td><td className="px-4 py-3"><StatusBadge label={a.status} /></td><td className="px-4 py-3">{a.prioritas ? <StatusBadge label={a.prioritas} /> : "—"}</td><td className={`px-4 py-3 whitespace-nowrap ${a.deadline && a.deadline < new Date().toISOString().slice(0, 10) ? "font-bold text-danger-text" : ""}`}>{formatDate(a.deadline)}</td><td className="px-4 py-3 whitespace-nowrap">{formatDate(a.tglInterview)}</td><td className="max-w-52 truncate px-4 py-3 text-text-secondary">{a.nextAction ?? "—"}</td>
            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><div className="flex items-center gap-1"><button onClick={() => onEdit(a)} aria-label={`Edit lamaran ${a.perusahaan}`} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-text-muted transition-colors hover:bg-accent-soft hover:text-accent-text focus-visible:outline-3 focus-visible:outline-accent"><Pencil size={15} aria-hidden /></button><button onClick={() => onDelete(a)} aria-label={`Hapus lamaran ${a.perusahaan}`} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-text-muted transition-colors hover:bg-danger-soft hover:text-danger-text focus-visible:outline-3 focus-visible:outline-danger"><Trash2 size={15} aria-hidden /></button></div></td>
          </tr>;
        })}</tbody>
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

function EmptyState({ hasFilter, onClear, onCreate }: { hasFilter: boolean; onClear: () => void; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg bg-surface p-12 text-center shadow-clay-md">
      <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-accent-soft shadow-clay-sm">
        <Briefcase size={28} className="text-accent-text" aria-hidden />
      </span>
      {hasFilter ? (
        <>
          <p className="text-[15px] font-semibold">Tidak ada lamaran yang cocok</p>
          <p className="max-w-md text-[13px] text-text-muted">Coba ubah kata kunci atau filter status/prioritas.</p>
          <Button size="sm" variant="secondary" onClick={onClear}><X size={15} aria-hidden /> Bersihkan Filter</Button>
        </>
      ) : (
        <>
          <p className="text-[15px] font-semibold">Belum ada lamaran</p>
          <p className="max-w-md text-[13px] text-text-muted">Tiap apply, tambahkan 1 baris di sini biar tidak ada yang lupa.</p>
          <Button size="sm" onClick={onCreate}><Plus size={16} aria-hidden /> Tambah Lamaran</Button>
        </>
      )}
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

function Drawer({ app, onClose, onEdit, onDelete }: { app: Application; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const { data: timeline } = useTimeline(app.id);
  const changeStatus = useChangeStatus();
  const { data: options } = useOptions();
  const statuses = options?.items.filter((o) => o.tipe === "status_lamaran").sort((a, b) => a.urutan - b.urutan) ?? [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Detail ${app.perusahaan}`}>
      <button className="absolute inset-0 bg-text-primary/45" onClick={onClose} aria-label="Tutup" />
      <div className="relative h-full w-full max-w-drawer overflow-y-auto rounded-l-xl bg-surface p-card shadow-clay-lg">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold">{app.perusahaan}</h2>
            <p className="text-[15px] text-text-secondary">{app.posisi}</p>
            <div className="mt-2"><StatusBadge label={app.status} /></div>
          </div>
          <button onClick={onClose} aria-label="Tutup drawer" className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-pill bg-surface-sunken shadow-clay-sm transition-colors hover:bg-accent-soft focus-visible:outline-3 focus-visible:outline-accent">
            <X size={18} aria-hidden />
          </button>
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
          <Button size="sm" variant="secondary" onClick={onEdit}><Pencil size={15} aria-hidden /> Edit</Button>
          <Button size="sm" variant="danger" onClick={onDelete}><Trash2 size={15} aria-hidden /> Hapus</Button>
          <QuickActions app={app} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-[15px]">
          {[ ["Tgl Apply", formatDate(app.tglApply)], ["Deadline", formatDate(app.deadline)], ["Interview", formatDate(app.tglInterview)],
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
              <span className="absolute -left-[27px] flex h-6 w-6 items-center justify-center rounded-pill bg-accent-soft shadow-clay-sm text-[10px] font-extrabold text-accent-text">{i + 1}</span>
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

const EMPTY_APPLICATION_FORM: ApplicationFormData = {
  tglApply: new Date().toISOString().slice(0, 10), perusahaan: "", posisi: "", portalId: "", tipeKerja: "", modeKerja: "",
  lokasi: "", estGajiBawah: "", estGajiAtas: "", estGajiTeks: "", status: "Applied", prioritas: "",
  deadline: "", tglInterview: "", nextAction: "", linkLowongan: "", catatan: "",
};

function ApplicationFormModal({ initial, statuses, priorities, portals, loading, error, onClose, onSave }: {
  initial: Application | null; statuses: string[]; priorities: string[]; portals: { id: string; namaPortal: string }[];
  loading: boolean; error: string | null; onClose: () => void; onSave: (body: ApplicationPayload) => void;
}) {
  const [form, setForm] = useState<ApplicationFormData>(() => initial ? {
    tglApply: initial.tglApply ?? "", perusahaan: initial.perusahaan, posisi: initial.posisi, portalId: initial.portalId ?? "",
    tipeKerja: initial.tipeKerja ?? "", modeKerja: initial.modeKerja ?? "", lokasi: initial.lokasi ?? "",
    estGajiBawah: initial.estGajiBawah ?? "", estGajiAtas: initial.estGajiAtas ?? "", estGajiTeks: initial.estGajiTeks ?? "",
    status: initial.status, prioritas: initial.prioritas ?? "", deadline: initial.deadline ?? "", tglInterview: initial.tglInterview ?? "",
    nextAction: initial.nextAction ?? "", linkLowongan: initial.linkLowongan ?? "", catatan: initial.catatan ?? "",
  } : { ...EMPTY_APPLICATION_FORM });
  const set = (key: keyof ApplicationFormData) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const submit = (event: React.FormEvent) => { event.preventDefault(); onSave(toApplicationPayload(form)); };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !loading) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/45 p-4" role="dialog" aria-modal="true" aria-label={initial ? "Edit lamaran" : "Tambah lamaran"}>
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-surface p-6 shadow-clay-lg">
        <div className="mb-5 flex items-start justify-between"><div><h2 className="text-2xl font-extrabold">{initial ? "Edit Lamaran" : "Tambah Lamaran"}</h2><p className="mt-1 text-sm text-text-secondary">Isi detail lowongan dan perkembangan lamaran.</p></div><button type="button" onClick={onClose} aria-label="Tutup" className="rounded-pill p-2 hover:bg-surface-sunken"><X size={18} /></button></div>
        {error && <p role="alert" className="mb-4 rounded-md bg-danger-soft p-3 text-sm text-danger-text">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Perusahaan *"><Input required maxLength={150} value={form.perusahaan} onChange={set("perusahaan")} /></Field><Field label="Posisi *"><Input required maxLength={150} value={form.posisi} onChange={set("posisi")} /></Field>
          <Field label="Tanggal apply"><Input type="date" value={form.tglApply} onChange={set("tglApply")} /></Field><Field label="Status"><Select value={form.status} onChange={set("status")}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
          <Field label="Prioritas"><Select value={form.prioritas} onChange={set("prioritas")}><option value="">Tanpa prioritas</option>{priorities.map((p) => <option key={p} value={p}>{p}</option>)}</Select></Field><Field label="Portal lamaran"><Select value={form.portalId} onChange={set("portalId")}><option value="">Pilih portal</option>{portals.map((p) => <option key={p.id} value={p.id}>{p.namaPortal}</option>)}</Select></Field>
          <Field label="Tipe kerja"><Select value={form.tipeKerja} onChange={set("tipeKerja")}><option value="">Pilih tipe</option>{["Full-time", "Part-time", "Contract", "Freelance", "Internship"].map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field><Field label="Mode kerja"><Select value={form.modeKerja} onChange={set("modeKerja")}><option value="">Pilih mode</option>{["On-site", "Hybrid", "Remote"].map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
          <Field label="Lokasi"><Input maxLength={150} value={form.lokasi} onChange={set("lokasi")} /></Field><Field label="Deadline"><Input type="date" value={form.deadline} onChange={set("deadline")} /></Field><Field label="Tanggal interview"><Input type="date" value={form.tglInterview} onChange={set("tglInterview")} /></Field>
          <Field label="Gaji bawah (Rp)"><Input inputMode="decimal" value={form.estGajiBawah} onChange={set("estGajiBawah")} /></Field><Field label="Gaji atas (Rp)"><Input inputMode="decimal" value={form.estGajiAtas} onChange={set("estGajiAtas")} /></Field><Field label="Rentang gaji teks"><Input maxLength={100} value={form.estGajiTeks} onChange={set("estGajiTeks")} /></Field><Field label="Link lowongan"><Input type="url" placeholder="https://" value={form.linkLowongan} onChange={set("linkLowongan")} /></Field><Field label="Next action"><Input maxLength={255} value={form.nextAction} onChange={set("nextAction")} /></Field>
          <div className="sm:col-span-2"><Field label="Catatan"><Textarea maxLength={5000} value={form.catatan} onChange={set("catatan")} /></Field></div>
        </div>
        <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={onClose}>Batal</Button><Button type="submit" loading={loading}>{initial ? "Simpan Perubahan" : "Tambah Lamaran"}</Button></div>
      </form>
    </div>
  );
}

function DeleteApplicationConfirm({ app, loading, error, onClose, onConfirm }: { app: Application; loading: boolean; error: string | null; onClose: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-text-primary/45 p-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-clay-lg"><h2 id="delete-title" className="text-xl font-extrabold">Hapus lamaran?</h2><p className="mt-3 text-sm text-text-secondary">Lamaran <strong>{app.perusahaan} — {app.posisi}</strong> akan dihapus dari tracker.</p>{error && <p role="alert" className="mt-3 text-sm text-danger-text">{error}</p>}<div className="mt-6 flex justify-end gap-3"><Button variant="ghost" onClick={onClose} disabled={loading}>Batal</Button><Button variant="danger" loading={loading} onClick={onConfirm}>Hapus</Button></div></div></div>;
}

