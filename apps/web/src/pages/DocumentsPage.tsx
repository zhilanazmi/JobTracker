import { CrudTable, LinkCell, type ColumnDef, type FormFieldDef } from "@/components/CrudTable";
import { StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";

interface Doc {
  id: string;
  namaDokumen: string;
  jenis: string | null;
  versi: string | null;
  linkDrive: string | null;
  updateTerakhir: string | null;
  status: string | null;
  catatan: string | null;
}

const columns: ColumnDef<Doc>[] = [
  { key: "namaDokumen", label: "Nama Dokumen", className: "font-semibold" },
  { key: "jenis", label: "Jenis" },
  { key: "versi", label: "Versi" },
  { key: "linkDrive", label: "Link Drive", render: (d) => <LinkCell url={d.linkDrive} label="Buka Drive" /> },
  { key: "updateTerakhir", label: "Update Terakhir", render: (d) => formatDate(d.updateTerakhir) },
  { key: "status", label: "Status", render: (d) => (d.status ? <StatusBadge label={d.status} warnaToken={d.status === "Final" ? "success" : d.status === "Perlu Update" ? "warning" : "neutral"} /> : "—") },
  { key: "catatan", label: "Catatan", className: "max-w-52 truncate" },
];

const fields: FormFieldDef[] = [
  { name: "namaDokumen", label: "Nama Dokumen", type: "text", required: true },
  { name: "jenis", label: "Jenis", type: "text", placeholder: "CV / Portfolio / Ijazah…" },
  { name: "versi", label: "Versi", type: "text", placeholder: "v1" },
  { name: "linkDrive", label: "Link Drive", type: "url", placeholder: "https://drive.google.com/…" },
  { name: "updateTerakhir", label: "Update Terakhir", type: "date" },
  { name: "status", label: "Status", type: "select", options: ["Draft", "Perlu Update", "Final"] },
  { name: "catatan", label: "Catatan", type: "textarea" },
];

export function DocumentsPage() {
  return (
    <CrudTable<Doc>
      resource="documents"
      queryKey="documents"
      columns={columns}
      formFields={fields}
      emptyTitle="Belum ada dokumen"
      emptyDesc="Rapihin berkas sebelum dibutuhkan — CV, portfolio, transkrip, semua di satu tempat."
      searchPlaceholder="Cari dokumen…"
    />
  );
}
