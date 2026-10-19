import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardTitle } from "@/components/ui";
import { api } from "@/lib/api";

const STEPS = [
  { id: "profil", judul: "Isi profil & target", desc: "Buka Setup: nama, posisi tujuan, ekspektasi gaji, target tanggal.", href: "/setup" },
  { id: "dokumen", judul: "Siapkan dokumen", desc: "CV, cover letter, portfolio, transkrip — tempel link Drive di halaman Dokumen.", href: "/dokumen" },
  { id: "portal", judul: "Pilih portal favorit", desc: "21 portal tersedia di halaman Portal Job dengan catatan fokusnya.", href: "/portal" },
  { id: "tracker", judul: "Tambah lamaran pertama", desc: "Job Tracker: perusahaan, posisi, status, deadline.", href: "/tracker" },
  { id: "interview", judul: "Isi bank pertanyaan", desc: "STAR story: Situation, Task, Action, Result. Mode Latihan di tab Interview.", href: "/interview" },
  { id: "offer", judul: "Bandingkan offer", desc: "Skor berbobot Gaji/WLB/Jenjang/Budaya di halaman Offer.", href: "/offer" },
];

interface Profile {
  onboardingSteps: string[];
}

export function PanduanPage() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Profile>("/api/profile"),
  });
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: (steps: string[]) => api.patch("/api/profile/onboarding", { steps }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });

  const steps = profile?.onboardingSteps ?? [];
  const doneCount = STEPS.filter((s) => steps.includes(s.id)).length;
  const pct = Math.round((doneCount / STEPS.length) * 100);

  const toggle = (id: string) => {
    const next = steps.includes(id) ? steps.filter((s) => s !== id) : [...steps, id];
    save.mutate(next);
  };

  return (
    <div className="flex flex-col gap-gap">
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Cara Pakai App Ini</CardTitle>
          <span className="text-[13px] font-semibold text-accent-text" aria-live="polite">
            {doneCount}/{STEPS.length} selesai
          </span>
        </div>
        <p className="mt-2 text-[15px] text-text-secondary">
          Job hunting itu marathon. App ini = workbook kamu versi web: semua angka dihitung otomatis, tinggal update status.
        </p>

        <div className="mt-4">
          <div className="h-4 w-full rounded-pill bg-surface-sunken shadow-clay-pressed" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress setup awal">
            <div className="h-4 rounded-pill bg-accent shadow-clay-sm transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <ol className="mt-5 flex flex-col gap-3">
          {STEPS.map((s, i) => {
            const done = steps.includes(s.id);
            return (
              <li key={s.id}>
                <button
                  onClick={() => toggle(s.id)}
                  aria-pressed={done}
                  className={`group flex w-full items-start gap-4 rounded-md p-4 text-left transition-colors focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 ${
                    done ? "bg-success-soft/40" : "bg-surface-sunken hover:bg-accent-soft/30"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-[14px] font-extrabold shadow-clay-sm ${
                      done ? "bg-success text-white" : "bg-surface text-accent-text"
                    }`}
                  >
                    {done ? <Check size={16} aria-hidden /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[15px] font-bold ${done ? "line-through opacity-70" : ""}`}>{s.judul}</span>
                    <span className="block text-[13px] text-text-muted">{s.desc}</span>
                  </span>
                  <ArrowRight
                    size={18}
                    aria-hidden
                    className="mt-1 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </Card>

      <p className="text-center text-[13px] text-text-muted">
        Klik langkah untuk tandai selesai — klik lagi untuk batal.{" "}
        <Link to="/setup" className="font-semibold text-accent-text hover:underline">
          Mulai dari Setup
        </Link>
      </p>
    </div>
  );
}
