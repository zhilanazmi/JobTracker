import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { Card, CardTitle, StatusBadge } from "@/components/ui";
import { CrudTable, LinkCell, type ColumnDef, type FormFieldDef } from "@/components/CrudTable";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { medianGaji } from "@jam/shared";

interface Salary {
  id: string;
  role: string;
  level: string | null;
  industri: string | null;
  lokasi: string | null;
  gajiBawah: string | null;
  gajiAtas: string | null;
  sumber: string | null;
  catatan: string | null;
}

interface Profile {
  ekspektasiGajiBawah: string | null;
  ekspektasiGajiAtas: string | null;
}

/** Chart floating-bar range gaji (spesifikasi MD §10) — SVG ringan, Recharts menyusul. */
function SalaryChart({ items, expectation }: { items: Salary[]; expectation: number | null }) {
  const withData = items.filter((s) => s.gajiBawah && s.gajiAtas);
  if (withData.length === 0) return null;
  const max = Math.max(...withData.map((s) => Number(s.gajiAtas)), expectation ?? 0) * 1.1;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Range Gaji per Role</CardTitle>
        {expectation == null ? (
          <p className="text-[13px] text-text-muted">Isi ekspektasi gaji di Setup untuk garis pembanding.</p>
        ) : (
          <p className="text-[13px] font-semibold text-accent-text-secondary">Garis putus-putus = ekspektasi kamu</p>
        )}
      </div>
      <svg viewBox={`0 0 1000 ${withData.length * 56 + 20}`} className="mt-4 w-full" role="img" aria-label="Chart range gaji per role">
        {withData.map((s, i) => {
          const lo = (Number(s.gajiBawah) / max) * 980 + 10;
          const hi = (Number(s.gajiAtas) / max) * 980 + 10;
          const y = i * 56 + 16;
          const mid = (lo + hi) / 2;
          return (
            <g key={s.id}>
              <text x={8} y={y + 4} className="fill-current text-[12px] font-semibold" style={{ fontSize: 12 }}>{s.role}</text>
              <rect x={lo} y={y} width={Math.max(hi - lo, 4)} height={20} rx={10} className="fill-accent" opacity={0.85} />
              <circle cx={mid} cy={y + 10} r={5} className="fill-white" stroke="currentColor" strokeWidth={2} />
              <text x={hi + 8} y={y + 4} className="fill-current" style={{ fontSize: 10 }}>{formatRupiah(s.gajiAtas)}</text>
              <text x={lo - 8} y={y + 4} textAnchor="end" className="fill-current" style={{ fontSize: 10 }}>{formatRupiah(s.gajiBawah)}</text>
            </g>
          );
        })}
        {expectation != null && (
          <line
            x1={(expectation / max) * 980 + 10}
            x2={(expectation / max) * 980 + 10}
            y1={0}
            y2={withData.length * 56 + 10}
            stroke="var(--color-accent-secondary)"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        )}
        {expectation != null && (
          <text
            x={(expectation / max) * 980 + 10}
            y={12}
            textAnchor="middle"
            style={{ fontSize: 10, fill: "var(--color-info-text)", fontWeight: 600 }}
          >
            Ekspektasi
          </text>
        )}
      </svg>
    </Card>
  );
}

const columns: ColumnDef<Salary>[] = [
  { key: "role", label: "Role", className: "font-semibold" },
  { key: "level", label: "Level", render: (s) => (s.level ? <StatusBadge label={s.level} warnaToken="info" /> : "—") },
  { key: "industri", label: "Industri" },
  { key: "lokasi", label: "Lokasi" },
  { key: "gajiBawah", label: "Gaji Bawah", render: (s) => formatRupiah(s.gajiBawah) },
  { key: "gajiAtas", label: "Gaji Atas", render: (s) => formatRupiah(s.gajiAtas) },
  { key: "median", label: "Median", render: (s) => formatRupiah(medianGaji(s.gajiBawah, s.gajiAtas)) },
  { key: "sumber", label: "Sumber", render: (s) => <LinkCell url={s.sumber?.startsWith("http") ? s.sumber : null} label={s.sumber ?? ""} /> },
  { key: "catatan", label: "Catatan", className: "max-w-48 truncate" },
];

const fields: FormFieldDef[] = [
  { name: "role", label: "Role", type: "text", required: true },
  { name: "level", label: "Level", type: "select", options: ["Fresh Grad", "Junior", "Mid", "Senior"] },
  { name: "industri", label: "Industri", type: "text" },
  { name: "lokasi", label: "Lokasi", type: "text" },
  { name: "gajiBawah", label: "Gaji Bawah", type: "number" },
  { name: "gajiAtas", label: "Gaji Atas", type: "number" },
  { name: "sumber", label: "Sumber", type: "text", placeholder: "LinkedIn Salary / Glassdoor…" },
  { name: "catatan", label: "Catatan", type: "textarea" },
];

export function SalaryPage() {
  const { data } = useQuery({
    queryKey: ["salaries"],
    queryFn: () => api.get<{ items: Salary[] }>("/api/salaries?take=100"),
  });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Profile>("/api/profile"),
  });

  const expectation = profile?.ekspektasiGajiBawah ? Number(profile.ekspektasiGajiBawah) : null;

  return (
    <div className="flex flex-col gap-gap">
      <div className="flex items-center gap-2 text-[13px] text-text-muted">
        <TrendingUp size={15} aria-hidden /> Pahami nilai pasar sebelum nego.
      </div>
      <SalaryChart items={data?.items ?? []} expectation={expectation} />
      <CrudTable<Salary>
        resource="salaries"
        queryKey="salaries"
        columns={columns}
        formFields={fields}
        emptyTitle="Belum ada data benchmark"
        emptyDesc="Simpan hasil riset gaji dari LinkedIn/Glassdoor/kawan-kawannya di sini."
        searchPlaceholder="Cari role…"
      />
    </div>
  );
}
