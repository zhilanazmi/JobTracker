import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ExternalLink, Pencil, X } from "lucide-react";
import { Button, Card, Input, Select, Textarea, Field } from "@/components/ui";
import { api } from "@/lib/api";

/**
 * CRUD table generik untuk resource simple: daftar + filter + form modal
 * + delete. Dipakai Dokumen, Kontak, Upskill, Gaji, Offer (tabel bagian bawah).
 */

interface Paginated<T> {
  items: T[];
  pagination: { page: number; take: number; total: number };
}

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface FormFieldDef {
  name: string;
  label: string;
  type: "text" | "date" | "number" | "textarea" | "select" | "url";
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

interface CrudTableProps<T extends { id: string }> {
  resource: string;
  queryKey: string;
  columns: ColumnDef<T>[];
  formFields: FormFieldDef[];
  emptyTitle: string;
  emptyDesc: string;
  searchPlaceholder: string;
  extraQuery?: string;
  initialForm?: Record<string, string>;
}

export function CrudTable<T extends { id: string }>({
  resource, queryKey, columns, formFields, emptyTitle, emptyDesc, searchPlaceholder, extraQuery = "", initialForm = {},
}: CrudTableProps<T>) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<T | null>(null);

  const qs = `q=${encodeURIComponent(q)}&take=100${extraQuery}`;
  const { data, isLoading } = useQuery({
    queryKey: [queryKey, q, extraQuery],
    queryFn: () => api.get<Paginated<T>>(`/api/${resource}?${qs}`),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/${resource}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
  });

  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-gap">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="!w-64"
        />
        <div className="ml-auto">
          <Button size="sm" onClick={() => setCreating(true)}><Plus size={15} aria-hidden /> Tambah</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-md bg-surface shadow-clay-sm" />)}
        </div>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-[15px] font-semibold">{emptyTitle}</p>
          <p className="max-w-md text-[13px] text-text-muted">{emptyDesc}</p>
          <Button size="sm" onClick={() => setCreating(true)}><Plus size={15} aria-hidden /> Tambah Sekarang</Button>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-surface shadow-clay-md">
          <table className="w-full border-collapse text-[15px]">
            <thead>
              <tr className="bg-surface-sunken text-left text-[13px] font-semibold text-text-secondary">
                {columns.map((c) => (
                  <th key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>{c.label}</th>
                ))}
                <th className="w-24 px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-t border-surface-sunken hover:bg-accent-soft/20">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setEditing(row)} aria-label="Edit" className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-accent-soft hover:text-accent-text">
                        <Pencil size={15} aria-hidden />
                      </button>
                      <button
                        onClick={() => setDeleting(row)}
                        aria-label="Hapus"
                        className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-danger-soft hover:text-danger-text"
                      >
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <CrudFormModal
          resource={resource}
          queryKey={queryKey}
          fields={formFields}
          initial={editing as unknown as Record<string, unknown> ?? initialForm}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}

      {deleting && (
        <CrudDeleteConfirm
          resource={resource}
          queryKey={queryKey}
          target={deleting}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function CrudDeleteConfirm<T extends { id: string }>({
  resource, queryKey, target, onClose,
}: {
  resource: string;
  queryKey: string;
  target: T;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/${resource}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      onClose();
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const label =
    (target as Record<string, unknown>).namaDokumen ??
    (target as Record<string, unknown>).nama ??
    (target as Record<string, unknown>).skill ??
    (target as Record<string, unknown>).role ??
    "item ini";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="crud-delete-title">
      <button className="absolute inset-0 bg-text-primary/45" onClick={onClose} aria-label="Tutup" />
      <Card className="relative w-full max-w-md">
        <div className="flex items-start justify-between">
          <h2 id="crud-delete-title" className="text-xl font-extrabold">Hapus item?</h2>
          <button onClick={onClose} aria-label="Tutup" className="rounded-pill p-1.5 text-text-muted transition-colors hover:bg-surface-sunken">
            <X size={16} aria-hidden />
          </button>
        </div>
        <p className="mt-3 text-[15px] text-text-secondary">
          Yakin ingin menghapus <span className="font-semibold text-text-primary">{String(label)}</span>? Tindakan ini tidak bisa dibatalkan.
        </p>
        {del.isError && (
          <p className="mt-3 rounded-md bg-danger-soft px-4 py-2 text-[13px] font-semibold text-danger-text" role="alert">
            {(del.error as Error).message}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Batal</Button>
          <Button variant="danger" size="sm" loading={del.isPending} onClick={() => del.mutate(target.id)}>Ya, Hapus</Button>
        </div>
      </Card>
    </div>
  );
}

function CrudFormModal({
  resource, queryKey, fields, initial, onClose,
}: {
  resource: string;
  queryKey: string;
  fields: FormFieldDef[];
  initial: Record<string, unknown>;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.name, String(initial[f.name] ?? "")])),
  );
  const isEdit = !!initial.id;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = useMutation({
    mutationFn: () => {
      const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ""));
      return isEdit
        ? api.patch(`/api/${resource}/${initial.id}`, body)
        : api.post(`/api/${resource}`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="crud-form-title">
      <button className="absolute inset-0 bg-text-primary/45" onClick={onClose} aria-label="Tutup" />
      <Card className="relative max-h-modal w-full max-w-lg overflow-y-auto">
        <div className="flex items-start justify-between">
          <h2 id="crud-form-title" className="text-xl font-extrabold">{isEdit ? "Edit Data" : "Tambah Baru"}</h2>
          <button onClick={onClose} aria-label="Tutup" className="rounded-pill p-1.5 text-text-muted transition-colors hover:bg-surface-sunken">
            <X size={16} aria-hidden />
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {fields.map((f) => (
            <Field key={f.name} label={f.label}>
              {f.type === "textarea" ? (
                <Textarea value={form[f.name] ?? ""} placeholder={f.placeholder} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
              ) : f.type === "select" ? (
                <Select value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                  <option value="" disabled>Pilih…</option>
                  {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                </Select>
              ) : (
                <Input
                  type={f.type === "url" ? "text" : f.type}
                  value={form[f.name] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                />
              )}
            </Field>
          ))}
        </div>
        {save.isError && (
          <p className="mt-3 rounded-md bg-danger-soft px-4 py-2 text-[13px] font-semibold text-danger-text" role="alert">
            {(save.error as Error).message}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Batal</Button>
          <Button size="sm" loading={save.isPending} onClick={() => save.mutate()}>Simpan</Button>
        </div>
      </Card>
    </div>
  );
}

export function LinkCell({ url, label = "Buka" }: { url: string | null; label?: string }) {
  if (!url) return <span className="text-xs text-text-muted italic">+ Tempel link</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-text hover:underline">
      {label} <ExternalLink size={12} aria-hidden />
    </a>
  );
}
