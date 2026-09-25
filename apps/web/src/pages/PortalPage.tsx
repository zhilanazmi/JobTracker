import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Plus, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Button, Input, Textarea, Field, Card, Chip } from "@/components/ui";
import { api } from "@/lib/api";

/**
 * Portal Job (spesifikasi MD §4): toggle Tabel ↔ Kartu (?view=),
 * filter chip per tipe, CRUD penuh. Toggle disimpan di URL (prompt §8.4).
 */

interface Portal {
  id: string;
  namaPortal: string;
  fokus: string | null;
  tipe: string | null;
  link: string | null;
  cocokUntuk: string | null;
  catatan: string | null;
  isSample: boolean;
}

interface Paginated<T> {
  items: T[];
  pagination: { page: number; take: number; total: number };
}

export function PortalPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") ?? "cards";
  const tipe = params.get("tipe") ?? "";
  const { data, isLoading } = usePortals(tipe);
  const [editing, setEditing] = useState<Portal | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Portal | null>(null);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    setParams(p, { replace: true });
  };

  const tipeList = Array.from(new Set((data?.items ?? []).map((p) => p.tipe).filter(Boolean))) as string[];

  return (
    <div className="flex flex-col gap-gap">
      <div className="flex h-13 items-center justify-between gap-4 rounded-md bg-success-soft/50 px-5 shadow-clay-sm">
        <Globe size={20} className="text-success shrink-0" aria-hidden />
        <p className="flex-1 text-[15px] font-semibold text-success-text">
          Semua portal di bawah legit &amp; banyak dipakai di Indonesia
        </p>
        <span className="text-[13px] text-text-secondary whitespace-nowrap">Total: {data?.pagination.total ?? 0} portal</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-pill bg-surface-sunken p-1" role="tablist" aria-label="Tampilan portal">
          {([["cards", "Kartu"], ["table", "Tabel"]] as const).map(([v, label]) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setParam("view", v === "cards" ? "" : v)}
              className={`h-9 rounded-pill px-4 text-[13px] font-semibold transition-shadow ${
                view === v ? "bg-surface text-accent shadow-clay-sm" : "text-text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setParam("tipe", "")}>
            <Chip active={!tipe}>Semua</Chip>
          </button>
          {tipeList.map((t) => (
            <button key={t} onClick={() => setParam("tipe", t === tipe ? "" : t)}>
              <Chip active={t === tipe}>{t}</Chip>
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setCreating(true)}><Plus size={15} aria-hidden /> Tambah Portal</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-gap sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-lg bg-surface shadow-clay-md" />)}
        </div>
      ) : view === "table" ? (
        <PortalTable items={data?.items ?? []} onEdit={setEditing} onDelete={setDeleting} />
      ) : (
        <div className="grid grid-cols-1 gap-gap sm:grid-cols-2 xl:grid-cols-3">
          {(data?.items ?? []).map((p) => (
            <PortalCard key={p.id} portal={p} onEdit={setEditing} onDelete={setDeleting} />
          ))}
        </div>
      )}

      {(creating || editing) && (
        <PortalForm
          portal={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}

      {deleting && <DeletePortalConfirm portal={deleting} onClose={() => setDeleting(null)} />}
    </div>
  );
}

function usePortals(tipe: string) {
  const qs = tipe ? `tipe=${encodeURIComponent(tipe)}&take=100` : "take=100";
  return useQuery({ queryKey: ["portals", qs], queryFn: () => api.get<Paginated<Portal>>(`/api/portals?${qs}`) });
}

const INITIALS_COLORS = ["bg-accent-soft text-accent", "bg-info-soft text-info-text", "bg-success-soft text-success-text", "bg-warning-soft text-warning-text", "bg-danger-soft text-danger-text"];

function PortalCard({ portal, onEdit, onDelete }: { portal: Portal; onEdit: (p: Portal) => void; onDelete: (p: Portal) => void }) {
  const colorIdx = (portal.tipe?.length ?? 0) % INITIALS_COLORS.length;
  const initials = portal.namaPortal.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const domain = portal.link ? new URL(portal.link).hostname.replace("www.", "") : null;
  return (
    <Card className="relative flex h-full flex-col">
      <div className="absolute right-4 top-4 flex gap-1">
        <button onClick={() => onEdit(portal)} aria-label={`Edit ${portal.namaPortal}`} className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-accent-soft hover:text-accent">
          <Pencil size={15} aria-hidden />
        </button>
        <button onClick={() => onDelete(portal)} aria-label={`Hapus ${portal.namaPortal}`} className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-danger-soft hover:text-danger-text">
          <Trash2 size={15} aria-hidden />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-pill text-[15px] font-extrabold shadow-clay-sm ${INITIALS_COLORS[colorIdx]}`}>
          {initials}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold">{portal.namaPortal}</h3>
          {portal.tipe && <Chip>{portal.tipe}</Chip>}
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-[13px] text-text-secondary">{portal.fokus}</p>
      <p className="mt-2 line-clamp-2 text-xs text-text-muted">{portal.catatan}</p>
      <div className="mt-auto flex items-center justify-between pt-4">
        {portal.link && (
          <a href={portal.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[13px] font-semibold text-accent hover:underline">
            {domain} <ExternalLink size={13} aria-hidden />
          </a>
        )}
        {portal.cocokUntuk && <span className="text-[11px] text-text-muted">Cocok: {portal.cocokUntuk}</span>}
      </div>
    </Card>
  );
}

function PortalTable({ items, onEdit, onDelete }: { items: Portal[]; onEdit: (p: Portal) => void; onDelete: (p: Portal) => void }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-surface shadow-clay-md">
      <table className="w-full min-w-[760px] border-collapse text-[15px]">
        <thead>
          <tr className="bg-surface-sunken text-left text-[13px] font-semibold text-text-secondary">
            <th className="px-4 py-3">Nama Portal</th>
            <th className="px-4 py-3">Fokus</th>
            <th className="px-4 py-3">Tipe</th>
            <th className="px-4 py-3">Link</th>
            <th className="px-4 py-3">Cocok Untuk</th>
            <th className="px-4 py-3">Catatan</th>
            <th className="w-24 px-4 py-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className="border-t border-surface-sunken hover:bg-accent-soft/20">
              <td className="px-4 py-3 font-semibold">{p.namaPortal}</td>
              <td className="px-4 py-3 text-text-secondary">{p.fokus ?? "—"}</td>
              <td className="px-4 py-3">{p.tipe ? <Chip>{p.tipe}</Chip> : "—"}</td>
              <td className="px-4 py-3">{p.link && <a href={p.link} target="_blank" rel="noreferrer" className="text-accent hover:underline">Buka</a>}</td>
              <td className="px-4 py-3 text-text-secondary">{p.cocokUntuk ?? "—"}</td>
              <td className="max-w-60 truncate px-4 py-3 text-text-muted">{p.catatan ?? "—"}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button onClick={() => onEdit(p)} aria-label={`Edit ${p.namaPortal}`} className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-accent-soft hover:text-accent">
                    <Pencil size={15} aria-hidden />
                  </button>
                  <button onClick={() => onDelete(p)} aria-label={`Hapus ${p.namaPortal}`} className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-danger-soft hover:text-danger-text">
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PortalForm({ portal, onClose }: { portal: Portal | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    namaPortal: portal?.namaPortal ?? "",
    fokus: portal?.fokus ?? "",
    tipe: portal?.tipe ?? "",
    link: portal?.link ?? "",
    cocokUntuk: portal?.cocokUntuk ?? "",
    catatan: portal?.catatan ?? "",
  });
  const save = useMutation({
    mutationFn: () =>
      portal ? api.patch(`/api/portals/${portal.id}`, form) : api.post("/api/portals", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portals"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="portal-form-title">
      <button className="absolute inset-0 bg-text-primary/30" onClick={onClose} aria-label="Tutup" />
      <Card className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto">
        <h2 id="portal-form-title" className="text-xl font-extrabold">{portal ? "Edit Portal" : "Tambah Portal"}</h2>
        <div className="mt-4 flex flex-col gap-3">
          <Field label="Nama Portal"><Input value={form.namaPortal} onChange={(e) => setForm({ ...form, namaPortal: e.target.value })} /></Field>
          <Field label="Fokus"><Input value={form.fokus} onChange={(e) => setForm({ ...form, fokus: e.target.value })} /></Field>
          <Field label="Tipe"><Input value={form.tipe} placeholder="Umum / Tech & Startup / Pemerintah…" onChange={(e) => setForm({ ...form, tipe: e.target.value })} /></Field>
          <Field label="Link"><Input value={form.link} placeholder="https://…" onChange={(e) => setForm({ ...form, link: e.target.value })} /></Field>
          <Field label="Cocok Untuk"><Input value={form.cocokUntuk} onChange={(e) => setForm({ ...form, cocokUntuk: e.target.value })} /></Field>
          <Field label="Catatan"><Textarea value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Batal</Button>
          <Button size="sm" loading={save.isPending} disabled={!form.namaPortal.trim()} onClick={() => save.mutate()}>Simpan</Button>
        </div>
      </Card>
    </div>
  );
}

function DeletePortalConfirm({ portal, onClose }: { portal: Portal; onClose: () => void }) {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: () => api.delete(`/api/portals/${portal.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portals"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="portal-delete-title">
      <button className="absolute inset-0 bg-text-primary/30" onClick={onClose} aria-label="Tutup" />
      <Card className="relative w-full max-w-md">
        <h2 id="portal-delete-title" className="text-xl font-extrabold">Hapus Portal</h2>
        <p className="mt-3 text-[15px] text-text-secondary">
          Yakin ingin menghapus <span className="font-semibold text-text-primary">{portal.namaPortal}</span>?
        </p>
        <p className="mt-1 text-[13px] text-text-muted">
          Lamaran yang terhubung dengan portal ini tidak ikut terhapus, hanya kolom portal-nya yang dikosongkan.
        </p>
        {del.isError && (
          <p className="mt-3 rounded-md bg-danger-soft px-4 py-2 text-[13px] font-semibold text-danger-text" role="alert">
            {(del.error as Error).message}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Batal</Button>
          <Button variant="danger" size="sm" loading={del.isPending} onClick={() => del.mutate()}>Hapus</Button>
        </div>
      </Card>
    </div>
  );
}
