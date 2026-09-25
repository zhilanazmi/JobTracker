import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Card, CardTitle } from "@/components/ui";
import { api } from "@/lib/api";

const STEPS = [
  { id: "profil", judul: "Isi profil & target", desc: "Buka Setup: nama, posisi tujuan, ekspektasi gaji, target tanggal." },
  { id: "dokumen", judul: "Siapkan dokumen", desc: "CV, cover letter, portfolio, transkrip — tempel link Drive di halaman Dokumen." },
  { id: "portal", judul: "Pilih portal favorit", desc: "21 portal tersedia di halaman Portal Job dengan catatan fokusnya." },
  { id: "tracker", judul: "Tambah lamaran pertama", desc: "Job Tracker: perusahaan, posisi, status, deadline." },
  { id: "interview", judul: "Isi bank pertanyaan", desc: "STAR story: Situation, Task, Action, Result. Mode Latihan di tab Interview." },
  { id: "offer", judul: "Bandingkan offer", desc: "Skor berbobot Gaji/WLB/Jenjang/Budaya di halaman Offer." },
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
  const toggle = (id: string) => {
    const next = steps.includes(id) ? steps.filter((s) => s !== id) : [...steps, id];
    save.mutate(next);
  };

  return (
    <Card>
      <CardTitle>Cara Pakai App Ini</CardTitle>
      <p className="mt-2 text-[15px] text-text-secondary">
        Job hunting itu marathon. App ini = workbook kamu versi web: semua angka dihitung otomatis, tinggal update status.
      </p>
      <ol className="mt-5 flex flex-col gap-3">
        {STEPS.map((s, i) => {
          const done = steps.includes(s.id);
          return (
            <li key={s.id}>
              <button
                onClick={() => toggle(s.id)}
                aria-pressed={done}
                className={`flex w-full items-start gap-4 rounded-md p-4 text-left transition-colors ${
                  done ? "bg-success-soft/40" : "bg-surface-sunken hover:bg-accent-soft/30"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-[14px] font-extrabold shadow-clay-sm ${
                    done ? "bg-success text-white" : "bg-surface text-accent"
                  }`}
                >
                  {done ? <Check size={16} aria-hidden /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[15px] font-bold ${done ? "line-through opacity-70" : ""}`}>{s.judul}</span>
                  <span className="block text-[13px] text-text-muted">{s.desc}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
