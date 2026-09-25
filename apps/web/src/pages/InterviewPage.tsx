import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Play, Timer, Keyboard } from "lucide-react";
import { Button, Card, CardTitle, StatusBadge, Textarea, Input, Field } from "@/components/ui";
import { CrudTable, type ColumnDef, type FormFieldDef } from "@/components/CrudTable";
import { api } from "@/lib/api";

/**
 * Bank Persiapan Interview (spesifikasi MD §9): tabel dengan baris
 * expandable ke 4 field STAR. Mode Latihan di route /interview/latihan.
 */

interface Question {
  id: string;
  pertanyaan: string;
  kategori: string | null;
  untukRole: string | null;
  starSituation: string | null;
  starTask: string | null;
  starAction: string | null;
  starResult: string | null;
  contohKonkret: string | null;
  prioritas: string | null;
  status: string | null;
  catatan: string | null;
  terakhirDilatih: string | null;
}

export function InterviewPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["questions"],
    queryFn: () => api.get<{ items: Question[] }>("/api/questions?take=100"),
  });
  const navigate = useNavigate();

  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-gap">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-text-muted">Siapin STAR story sebelum interview — jangan improv kalau bisa.</p>
        <Button size="sm" onClick={() => navigate("/interview/latihan")}>
          <Play size={15} aria-hidden /> Mode Latihan
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg bg-surface shadow-clay-md">
        <table className="w-full min-w-[820px] border-collapse text-[15px]">
          <thead>
            <tr className="bg-surface-sunken text-left text-[13px] font-semibold text-text-secondary">
              <th className="w-10 px-4 py-3" aria-label="Expand" />
              <th className="px-4 py-3">Pertanyaan</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Prioritas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Terakhir Dilatih</th>
            </tr>
          </thead>
          <tbody>
            {items.map((q) => (
              <QuestionRow key={q.id} q={q} expanded={expanded === q.id} onToggle={() => setExpanded(expanded === q.id ? null : q.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuestionRow({ q, expanded, onToggle }: { q: Question; expanded: boolean; onToggle: () => void }) {
  const qc = useQueryClient();
  const patch = useMutation({
    mutationFn: (body: Partial<Question>) => api.patch(`/api/questions/${q.id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
  });

  return (
    <>
      <tr className={`border-t border-surface-sunken ${expanded ? "bg-accent-soft/20" : "hover:bg-accent-soft/10"}`}>
        <td className="px-4 py-3">
          <button onClick={onToggle} aria-expanded={expanded} aria-label={`Expand ${q.pertanyaan.slice(0, 30)}`}>
            <ChevronDown size={16} className={`text-text-muted transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden />
          </button>
        </td>
        <td className="px-4 py-3 font-semibold">{q.pertanyaan}</td>
        <td className="px-4 py-3">{q.kategori ? <StatusBadge label={q.kategori} warnaToken="accent" /> : "—"}</td>
        <td className="px-4 py-3">{q.prioritas ? <StatusBadge label={q.prioritas} /> : "—"}</td>
        <td className="px-4 py-3">{q.status ? <StatusBadge label={q.status} warnaToken={q.status === "Siap" ? "success" : q.status === "Perlu Latihan" ? "warning" : "neutral"} /> : "—"}</td>
        <td className="px-4 py-3 text-text-secondary">{q.terakhirDilatih ? q.terakhirDilatih.slice(0, 10) : "—"}</td>
      </tr>
      {expanded && (
        <tr className="bg-surface-sunken/60">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {([["starSituation", "Situation"], ["starTask", "Task"], ["starAction", "Action"], ["starResult", "Result"]] as const).map(([key, label]) => (
                <Field key={key} label={label}>
                  <Textarea
                    defaultValue={q[key] ?? ""}
                    onBlur={(e) => e.target.value !== (q[key] ?? "") && patch.mutate({ [key]: e.target.value })}
                    placeholder={`Ceritakan bagian ${label.toLowerCase()}…`}
                  />
                </Field>
              ))}
            </div>
            {q.contohKonkret && (
              <p className="mt-3 rounded-md bg-surface p-3 text-[13px] text-text-secondary shadow-clay-pressed">
                <strong className="font-semibold">Contoh konkret:</strong> {q.contohKonkret}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/* ===== Mode Latihan (/interview/latihan) — spesifikasi MD §9b ===== */

export function InterviewPracticePage() {
  const { data } = useQuery({
    queryKey: ["questions"],
    queryFn: () => api.get<{ items: Question[] }>("/api/questions?take=100"),
  });
  const qc = useQueryClient();
  const patch = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/questions/${id}`, { status, ...(status ? {} : {}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      next();
    },
  });
  const [idx, setIdx] = useState(0);
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [showPoints, setShowPoints] = useState(false);

  // Prioritas "Tinggi" + status Perlu Latihan/Belum Disiapkan didahulukan (prompt §8.9).
  const order = useMemo(() => {
    const rank = (q: Question) =>
      (q.prioritas === "Tinggi" ? 0 : q.prioritas === "Sedang" ? 1 : 2) +
      (q.status === "Perlu Latihan" || q.status === "Belum Disiapkan" ? 0 : 10);
    return [...(data?.items ?? [])].sort((a, b) => rank(a) - rank(b));
  }, [data]);

  const q = order[idx % Math.max(order.length, 1)];
  const next = () => {
    setIdx((i) => i + 1);
    setShowPoints(false);
    setRemaining(duration);
  };

  if (!q) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <CardTitle>Belum ada pertanyaan</CardTitle>
        <p className="mt-2 text-[15px] text-text-secondary">Tambah pertanyaan dulu di halaman Interview.</p>
      </Card>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-canvas p-6">
      <p className="text-[13px] text-text-muted">Pertanyaan {Math.min(idx + 1, order.length)} dari {order.length} · Spasi = lihat poin · 1 = Siap · 2 = Perlu Latihan</p>

      <Card className="w-full max-w-3xl p-10 text-center">
        {q.kategori && <StatusBadge label={q.kategori} warnaToken="accent" />}
        <h1 className="mx-auto mt-4 max-w-2xl text-[30px] font-extrabold leading-tight">{q.pertanyaan}</h1>

        <div className="mx-auto mt-6 flex h-30 w-30 items-center justify-center rounded-pill bg-surface-sunken shadow-clay-pressed" role="timer" aria-label={`Sisa waktu ${remaining} detik`}>
          <span className="text-2xl font-extrabold">
            {String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}
          </span>
        </div>
        <div className="mt-3 flex justify-center gap-2">
          {[60, 90, 120].map((d) => (
            <button
              key={d}
              onClick={() => { setDuration(d); setRemaining(d); }}
              className={`rounded-pill px-3 py-1 text-xs font-semibold shadow-clay-sm ${duration === d ? "bg-accent text-white" : "bg-surface text-text-secondary"}`}
            >
              {d}s
            </button>
          ))}
        </div>

        {showPoints && (
          <dl className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
            {([["S", q.starSituation], ["T", q.starTask], ["A", q.starAction], ["R", q.starResult]] as const).map(([k, v]) => (
              <div key={k} className="rounded-md bg-surface-sunken p-3 shadow-clay-pressed">
                <dt className="text-xs font-extrabold text-accent">{k}</dt>
                <dd className="text-[13px] text-text-secondary">{v ?? "—"}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-8 flex justify-center gap-4">
          <Button size="lg" variant="ghost" onClick={() => setShowPoints(!showPoints)}>
            {showPoints ? "Sembunyikan" : "Lihat poin jawaban"}
          </Button>
          <Button size="lg" className="bg-success text-white" onClick={() => patch.mutate({ id: q.id, status: "Siap" })}>Siap</Button>
          <Button size="lg" className="bg-warning text-text-primary" onClick={() => patch.mutate({ id: q.id, status: "Perlu Latihan" })}>Perlu Latihan</Button>
        </div>
      </Card>
    </div>
  );
}
