import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Check } from "lucide-react";
import { Button, Input, Select, Field, Card, CardTitle, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { useOptions, type OptionItem } from "@/hooks/useDashboard";

export function SetupPage() {
  return (
    <div className="flex flex-col gap-gap">
      <ProfileForm />
      <StatusEditor />
      <SampleDataCard />
    </div>
  );
}

interface Profile {
  nama: string;
  targetPosisi: string | null;
  targetIndustri: string | null;
  lokasiPreferensi: string | null;
  ekspektasiGajiBawah: string | null;
  ekspektasiGajiAtas: string | null;
  linkedin: string | null;
  email: string | null;
  noHp: string | null;
  targetLamaranPerMinggu: number;
  targetDapatKerja: string | null;
  statusPencarian: string;
  offerWeights: { gaji: number; wlb: number; jenjang: number; budaya: number };
  onboardingSteps: string[];
}

const useProfile = () =>
  useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Profile>("/api/profile"),
  });

function ProfileForm() {
  const { data: profile } = useProfile();
  const [form, setForm] = useState<Partial<Profile>>({});
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qc = useQueryClient();

  // Sync server → form hanya sekali (autosave, bukan controlled balik-balik).
  useEffect(() => {
    if (profile && Object.keys(form).length === 0) setForm(profile);
  }, [profile]);

  const save = useMutation({
    mutationFn: (data: Partial<Profile>) => api.patch("/api/profile", data),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const update = (patch: Partial<Profile>) => {
    setForm((f) => ({ ...f, ...patch }));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save.mutate(patch), 800); // debounce 800ms (prompt §8.3)
  };

  if (!profile || Object.keys(form).length === 0) return null;

  return (
    <Card className="relative">
      <div className="flex items-center justify-between">
        <CardTitle>Profil &amp; Target Karir</CardTitle>
        <span aria-live="polite" className="flex items-center gap-1 text-[13px] font-semibold text-success-text">
          {saved && <><Check size={14} aria-hidden /> Tersimpan</>}
        </span>
      </div>
      <div className="mt-5 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama"><Input value={form.nama ?? ""} onChange={(e) => update({ nama: e.target.value })} /></Field>
        <Field label="Target Posisi"><Input value={form.targetPosisi ?? ""} placeholder="misal: Backend Engineer" onChange={(e) => update({ targetPosisi: e.target.value })} /></Field>
        <Field label="Target Industri"><Input value={form.targetIndustri ?? ""} onChange={(e) => update({ targetIndustri: e.target.value })} /></Field>
        <Field label="Lokasi Preferensi"><Input value={form.lokasiPreferensi ?? ""} onChange={(e) => update({ lokasiPreferensi: e.target.value })} /></Field>
        <Field label="Ekspektasi Gaji Bawah">
          <Input type="number" value={form.ekspektasiGajiBawah ?? ""} onChange={(e) => update({ ekspektasiGajiBawah: e.target.value })} />
        </Field>
        <Field label="Ekspektasi Gaji Atas">
          <Input type="number" value={form.ekspektasiGajiAtas ?? ""} onChange={(e) => update({ ekspektasiGajiAtas: e.target.value })} />
        </Field>
        <Field label="LinkedIn"><Input value={form.linkedin ?? ""} placeholder="https://linkedin.com/in/…" onChange={(e) => update({ linkedin: e.target.value })} /></Field>
        <Field label="Email"><Input type="email" value={form.email ?? ""} onChange={(e) => update({ email: e.target.value })} /></Field>
        <Field label="No. HP"><Input value={form.noHp ?? ""} onChange={(e) => update({ noHp: e.target.value })} /></Field>
        <Field label="Target Dapat Kerja">
          <Input type="date" value={form.targetDapatKerja ?? ""} onChange={(e) => update({ targetDapatKerja: e.target.value })} />
        </Field>
        <Field label="Status Pencarian">
          <Select value={form.statusPencarian ?? "Aktif"} onChange={(e) => update({ statusPencarian: e.target.value })}>
            <option>Aktif</option>
            <option>Pasif</option>
            <option>Sudah Diterima</option>
          </Select>
        </Field>
        <Field label="Target Lamaran per Minggu">
          <Input type="number" min={1} value={form.targetLamaranPerMinggu ?? 10} onChange={(e) => update({ targetLamaranPerMinggu: Number(e.target.value) })} />
        </Field>
      </div>
    </Card>
  );
}

const COLOR_OPTIONS = ["success", "warning", "danger", "info", "neutral", "accent"];

function StatusEditor() {
  const { data } = useOptions();
  const qc = useQueryClient();
  const items = (data?.items ?? []).sort((a, b) => (a.tipe === b.tipe ? a.urutan - b.urutan : a.tipe < b.tipe ? -1 : 1));
  const [dragId, setDragId] = useState<string | null>(null);

  const patch = useMutation({
    mutationFn: ({ id, ...body }: { id: string; label?: string; warnaToken?: string }) => api.patch(`/api/options/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["options"] }),
  });
  const add = useMutation({
    mutationFn: (body: { tipe: string; label: string; urutan: number; warnaToken: string; isTerminal: boolean }) => api.post("/api/options", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["options"] }),
  });
  const remove = useMutation({
    mutationFn: async (o: OptionItem) => {
      try {
        return await api.delete(`/api/options/${o.id}`);
      } catch (e: any) {
        if (e?.code === "STATUS_IN_USE") {
          // Status terpakai — pindahkan lamaran ke "Wishlist" lalu hapus (prompt §8.3).
          await api.delete(`/api/options/${o.id}?force=true&moveTo=${encodeURIComponent("Wishlist")}`);
          return;
        }
        throw e;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["options"] }),
  });
  const reorder = useMutation({
    mutationFn: (body: { tipe: string; ids: string[] }) => api.patch("/api/options/reorder", { tipe: body.tipe, ids: body.ids.map(Number) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["options"] }),
  });

  const onDrop = (tipe: string, targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const list = items.filter((i) => i.tipe === tipe);
    const from = list.findIndex((i) => i.id === dragId);
    const to = list.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;
    const ids = list.map((i) => i.id);
    ids.splice(to, 0, ids.splice(from, 1)[0]!);
    reorder.mutate({ tipe, ids });
    setDragId(null);
  };

  return (
    <Card>
      <CardTitle>⚙️ Daftar Status &amp; Prioritas</CardTitle>
      <p className="mt-1 text-[13px] text-text-secondary">Status = tahap lamaran (dipakai dropdown di Job Tracker). Edit sesuai kebutuhan.</p>
      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[700fr_380fr]">
        <OptionColumn title="Status Lamaran" tipe="status_lamaran" items={items} onPatch={patch.mutate} onAdd={add.mutate} onRemove={remove.mutate} onDragStart={setDragId} onDrop={onDrop} dragId={dragId} />
        <OptionColumn title="Prioritas" tipe="prioritas" items={items} onPatch={patch.mutate} onAdd={add.mutate} onRemove={remove.mutate} onDragStart={setDragId} onDrop={onDrop} dragId={dragId} />
      </div>
    </Card>
  );
}

function OptionColumn({
  title, tipe, items, onPatch, onAdd, onRemove, onDragStart, onDrop, dragId,
}: {
  title: string;
  tipe: string;
  items: OptionItem[];
  onPatch: (p: { id: string; label?: string; warnaToken?: string }) => void;
  onAdd: (b: { tipe: string; label: string; urutan: number; warnaToken: string; isTerminal: boolean }) => void;
  onRemove: (o: OptionItem) => void;
  onDragStart: (id: string) => void;
  onDrop: (tipe: string, targetId: string) => void;
  dragId: string | null;
}) {
  const list = items.filter((i) => i.tipe === tipe);
  const [newLabel, setNewLabel] = useState("");

  return (
    <div>
      <h3 className="text-[15px] font-bold">{title}</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {list.map((o) => (
          <li
            key={o.id}
            draggable
            onDragStart={() => onDragStart(o.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(tipe, o.id); }}
            className={`flex h-12 items-center gap-3 rounded-md bg-surface-sunken px-3 shadow-clay-pressed ${dragId === o.id ? "opacity-50" : ""}`}
          >
            <span aria-hidden className="cursor-grab text-text-muted">⠿</span>
            <span className="text-xs text-text-muted w-5">{o.urutan}</span>
            <input
              value={o.label}
              onChange={(e) => onPatch({ id: o.id, label: e.target.value })}
              aria-label={`Nama ${title}: ${o.label}`}
              className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold focus:outline-2 focus:outline-accent"
            />
            <StatusBadge label={o.label} warnaToken={o.warnaToken} />
            <select
              value={o.warnaToken}
              onChange={(e) => onPatch({ id: o.id, warnaToken: e.target.value })}
              aria-label={`Warna ${o.label}`}
              className="rounded-md bg-surface px-1.5 py-1 text-xs shadow-clay-sm"
            >
              {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => onRemove(o)} aria-label={`Hapus ${o.label}`} className="text-text-muted hover:text-danger-text">
              <Trash2 size={16} />
            </button>
          </li>
        ))}
        <li className="flex h-12 items-center gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={`+ Tambah ${title.toLowerCase()}`}
            aria-label={`Nama ${title} baru`}
            className="!h-10"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newLabel.trim()) {
                onAdd({ tipe, label: newLabel.trim(), urutan: list.length + 1, warnaToken: "neutral", isTerminal: false });
                setNewLabel("");
              }
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            disabled={!newLabel.trim()}
            onClick={() => {
              onAdd({ tipe, label: newLabel.trim(), urutan: list.length + 1, warnaToken: "neutral", isTerminal: false });
              setNewLabel("");
            }}
          >
            <Plus size={14} aria-hidden /> Tambah
          </Button>
        </li>
      </ul>
    </div>
  );
}

function SampleDataCard() {
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const remove = useMutation({
    mutationFn: () => api.delete("/api/sample-data"),
    onSuccess: () => {
      qc.invalidateQueries();
      setConfirming(false);
    },
  });

  return (
    <Card>
      <CardTitle>Hapus Data Contoh</CardTitle>
      <p className="mt-1 text-[13px] text-text-secondary">Menghapus semua data contoh (portal, lamaran, dokumen, dst.) milikmu. Data asli yang kamu buat sendiri tidak terhapus.</p>
      <div className="mt-4 flex items-center gap-3">
        <Button variant="danger" size="sm" onClick={() => setConfirming(true)}><Trash2 size={15} aria-hidden /> Hapus Data Contoh</Button>
      </div>
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <button className="absolute inset-0 bg-text-primary/30" onClick={() => setConfirming(false)} aria-label="Batal" />
          <div className="relative max-w-md rounded-xl bg-surface p-card shadow-clay-lg">
            <h2 id="confirm-title" className="text-xl font-extrabold">Hapus semua data contoh?</h2>
            <p className="mt-2 text-[15px] text-text-secondary">Tindakan ini tidak bisa dibatalkan. Semua baris isSample akan dihapus permanen.</p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>Batal</Button>
              <Button variant="danger" size="sm" loading={remove.isPending} onClick={() => remove.mutate()}>Ya, Hapus</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
