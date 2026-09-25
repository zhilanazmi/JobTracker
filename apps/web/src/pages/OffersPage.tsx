import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Scale } from "lucide-react";
import { Card, CardTitle, StatusBadge, Button } from "@/components/ui";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { offerScore, topScoreIds } from "@jam/shared";

interface Offer {
  id: string;
  jobApplicationId: string | null;
  perusahaan: string;
  posisi: string;
  gajiPokok: string | null;
  tunjangan: string | null;
  thpEstimasi: string | null;
  wlb: number;
  jenjang: number;
  budaya: number;
  catatan: string | null;
}

interface Profile {
  offerWeights: { gaji: number; wlb: number; jenjang: number; budaya: number };
}

/**
 * Perbandingan Offer (spesifikasi MD §11): side-by-side maks 3 kartu,
 * radar chart, panel slider bobot tersimpan ke offerWeights (total 100).
 */
export function OffersPage() {
  const { data } = useQuery({
    queryKey: ["offers"],
    queryFn: () => api.get<{ items: Offer[] }>("/api/offers?take=100"),
  });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Profile>("/api/profile"),
  });
  const qc = useQueryClient();

  const weights = profile?.offerWeights ?? { gaji: 0, wlb: 34, jenjang: 33, budaya: 33 };
  const [picked, setPicked] = useState<string[]>([]);
  const offers = data?.items ?? [];

  const selected = useMemo(() => {
    const base = picked.length > 0 ? offers.filter((o) => picked.includes(o.id)) : offers.slice(0, 3);
    return base.slice(0, 3);
  }, [offers, picked]);

  const maxThp = useMemo(() => {
    const nums = offers.map((o) => Number(o.thpEstimasi ?? 0));
    return nums.length ? Math.max(...nums) : 0;
  }, [offers]);

  const scoreOf = (o: Offer) => offerScore(o, weights, String(maxThp || 1));
  const topIds = topScoreIds(selected.map((o) => ({ id: Number(o.id) })), (o) => scoreOf(offers.find((x) => Number(x.id) === o.id)!));
  const totalWeights = weights.gaji + weights.wlb + weights.jenjang + weights.budaya;

  const saveWeights = useMutation({
    mutationFn: (w: Profile["offerWeights"]) => api.patch("/api/profile", { offerWeights: w }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });

  const setWeight = (key: keyof Profile["offerWeights"], value: number) => {
    const others = Object.keys(weights).filter((k) => k !== key) as (keyof Profile["offerWeights"])[];
    const rest = 100 - value;
    const restSum = others.reduce((s, k) => s + weights[k], 0) || 1;
    const next = { ...weights, [key]: value } as Profile["offerWeights"];
    for (const k of others) {
      next[k] = Math.round((weights[k] / restSum) * rest);
    }
    // Koreksi pembulatan biar total persis 100.
    const diff = 100 - (next.gaji + next.wlb + next.jenjang + next.budaya);
    const first = others[0];
    if (diff !== 0 && first != null) next[first] += diff;
    saveWeights.mutate(next);
  };

  return (
    <div className="flex flex-col gap-gap">
      <div className="flex items-center gap-2 text-[13px] text-text-muted">
        <Scale size={15} aria-hidden /> Keputusan berdasarkan angka, bukan perasaan.
      </div>

      {totalWeights !== 100 && (
        <div className="rounded-md bg-danger-soft px-5 py-3 text-[15px] font-semibold text-danger-text shadow-clay-sm" role="alert">
          Total bobot {totalWeights}% — harus 100% agar skor valid.
        </div>
      )}

      {/* Panel bobot */}
      <Card>
        <CardTitle>Bobot Prioritas</CardTitle>
        <div className="mt-4 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {(["gaji", "wlb", "jenjang", "budaya"] as const).map((k) => (
            <label key={k} className="flex flex-col gap-2">
              <span className="flex items-center justify-between text-[13px] font-semibold capitalize">
                {k} <span className="text-accent">{weights[k]}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={weights[k]}
                onChange={(e) => setWeight(k, Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-pill bg-surface-sunken shadow-clay-pressed accent-accent"
                aria-label={`Bobot ${k}`}
              />
            </label>
          ))}
        </div>
      </Card>

      {/* Side-by-side kartu */}
      {offers.length === 0 ? (
        <Card className="py-12 text-center text-text-secondary">Belum ada offer. Buat dari Job Tracker (drawer → Buat Offer) saat kamu Offering.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-gap md:grid-cols-3">
          {selected.map((o) => (
            <OfferCard key={o.id} offer={o} score={scoreOf(o)} isTop={topIds.has(Number(o.id))} />
          ))}
        </div>
      )}

      {/* Radar sederhana: 3 axis WLB/Jenjang/Budaya */}
      {selected.length > 0 && (
        <Card>
          <CardTitle>Radar WLB / Jenjang / Budaya</CardTitle>
          <svg viewBox="0 0 300 260" className="mx-auto mt-4 w-full max-w-sm" role="img" aria-label="Radar chart offer">
            {[1, 2, 3, 4, 5].map((r) => (
              <polygon
                key={r}
                points={trianglePoints(150, 130, 100 * (r / 5))}
                fill="none"
                stroke="var(--color-neutral)"
                strokeOpacity={0.3}
              />
            ))}
            {selected.map((o, i) => (
              <polygon
                key={o.id}
                points={dataPoints(150, 130, 100, [o.wlb, o.jenjang, o.budaya])}
                fill={["var(--color-accent)", "var(--color-accent-secondary)", "var(--color-accent-tertiary)"][i]}
                fillOpacity={0.35}
                stroke="var(--color-accent)"
              />
            ))}
            <text x={150} y={16} textAnchor="middle" style={{ fontSize: 11 }}>WLB</text>
            <text x={278} y={242} textAnchor="middle" style={{ fontSize: 11 }}>Jenjang</text>
            <text x={22} y={242} textAnchor="middle" style={{ fontSize: 11 }}>Budaya</text>
          </svg>
        </Card>
      )}
    </div>
  );
}

function trianglePoints(cx: number, cy: number, r: number): string {
  return [0, 120, 240].map((deg) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
  }).join(" ");
}

function dataPoints(cx: number, cy: number, r: number, values: number[]): string {
  return [0, 120, 240].map((deg, i) => {
    const v = values[i] ?? 0;
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${cx + (r * v / 5) * Math.cos(rad)},${cy + (r * v / 5) * Math.sin(rad)}`;
  }).join(" ");
}

function OfferCard({ offer, score, isTop }: { offer: Offer; score: number; isTop: boolean }) {
  const initials = offer.perusahaan.slice(0, 2).toUpperCase();
  return (
    <Card className={`relative flex flex-col ${isTop ? "ring-3 ring-accent-tertiary -translate-y-1.5" : ""}`}>
      {isTop && <span className="absolute -top-3 right-4 rounded-pill bg-accent-tertiary px-3 py-0.5 text-xs font-extrabold shadow-clay-sm">Skor Tertinggi</span>}
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-accent-soft text-[15px] font-extrabold text-accent shadow-clay-sm">{initials}</span>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-extrabold">{offer.perusahaan}</h3>
          <p className="text-[13px] text-text-secondary">{offer.posisi}</p>
        </div>
      </div>
      <p className="mt-4 text-[24px] font-extrabold">{formatRupiah(offer.gajiPokok)}</p>
      <p className="text-xs text-text-muted">Gaji Pokok</p>
      {offer.tunjangan && <p className="mt-2 text-[13px] text-text-secondary">{offer.tunjangan}</p>}
      <div className="mt-3 rounded-md bg-surface-sunken p-3 shadow-clay-pressed">
        <p className="text-[13px] font-semibold text-text-secondary">THP Estimasi</p>
        <p className="text-[15px] font-extrabold">{formatRupiah(offer.thpEstimasi)}</p>
      </div>
      <dl className="mt-4 flex flex-col gap-2 text-[13px]">
        {([["WLB", offer.wlb], ["Jenjang", offer.jenjang], ["Budaya", offer.budaya]] as const).map(([label, val]) => (
          <div key={label} className="flex items-center justify-between">
            <dt className="font-semibold text-text-secondary">{label}</dt>
            <dd className="flex gap-1" aria-label={`${label}: ${val} dari 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`h-3 w-3 rounded-pill ${i < val ? "bg-accent" : "bg-surface-sunken"}`} />
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-pill bg-accent text-lg font-extrabold text-white shadow-clay-md">{score.toFixed(1)}</span>
        {offer.catatan && <StatusBadge label={offer.catatan.slice(0, 24)} warnaToken="neutral" />}
      </div>
    </Card>
  );
}
