import { CrudTable, LinkCell, type ColumnDef, type FormFieldDef } from "@/components/CrudTable";
import { StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";

interface Upskill {
  id: string;
  skill: string;
  kategori: string | null;
  platform: string | null;
  linkCourse: string | null;
  prioritas: string | null;
  status: string | null;
  targetSelesai: string | null;
  progress: number;
  linkSertifikat: string | null;
}

const columns: ColumnDef<Upskill>[] = [
  { key: "skill", label: "Skill", className: "font-semibold" },
  { key: "kategori", label: "Kategori", render: (u) => (u.kategori ? <StatusBadge label={u.kategori} warnaToken="accent" /> : "—") },
  { key: "platform", label: "Platform" },
  { key: "progress", label: "Progress", render: (u) => (
    <div className="flex items-center gap-2">
      <div className="h-4 w-32 rounded-pill bg-surface-sunken">
        <div className="h-4 rounded-pill bg-accent" style={{ width: `${u.progress}%` }} />
      </div>
      <span className="text-[13px] font-extrabold">{u.progress}%</span>
    </div>
  ) },
  { key: "status", label: "Status", render: (u) => (u.status ? <StatusBadge label={u.status} warnaToken={u.status === "Selesai" ? "success" : u.status === "Sedang Belajar" ? "info" : "neutral"} /> : "—") },
  { key: "targetSelesai", label: "Target", render: (u) => formatDate(u.targetSelesai) },
  { key: "linkSertifikat", label: "Sertifikat", render: (u) => <LinkCell url={u.linkSertifikat} label="Lihat" /> },
];

const fields: FormFieldDef[] = [
  { name: "skill", label: "Skill", type: "text", required: true },
  { name: "kategori", label: "Kategori", type: "select", options: ["Tools", "Technical", "Soft Skill", "Bahasa"] },
  { name: "platform", label: "Platform", type: "text", placeholder: "Coursera / YouTube / Cakap…" },
  { name: "linkCourse", label: "Link Course", type: "url", placeholder: "https://…" },
  { name: "prioritas", label: "Prioritas", type: "select", options: ["Tinggi", "Sedang", "Rendah"] },
  { name: "status", label: "Status", type: "select", options: ["Belum Mulai", "Sedang Belajar", "Selesai"] },
  { name: "targetSelesai", label: "Target Selesai", type: "date" },
  { name: "progress", label: "Progress (%)", type: "number" },
];

export function UpskillPage() {
  return (
    <CrudTable<Upskill>
      resource="upskills"
      queryKey="upskills"
      columns={columns}
      formFields={fields}
      emptyTitle="Belum ada skill yang dilatih"
      emptyDesc="Upskill sambil jalan — tambah skill yang dibutuhkan target posisimu."
      searchPlaceholder="Cari skill…"
    />
  );
}
