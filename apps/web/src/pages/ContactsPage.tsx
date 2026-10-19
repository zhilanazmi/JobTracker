import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CrudTable, LinkCell, type ColumnDef, type FormFieldDef } from "@/components/CrudTable";
import { Avatar, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { daysBetween, todayWIB } from "@jam/shared";

interface Contact {
  id: string;
  nama: string;
  perusahaan: string | null;
  posisi: string | null;
  hubungan: string | null;
  kontak: string | null;
  kontakTerakhir: string | null;
  statusFollowUp: string | null;
  catatan: string | null;
}

const columns: ColumnDef<Contact>[] = [
  {
    key: "nama", label: "Nama", className: "font-semibold",
    render: (c) => (
      <div className="flex items-center gap-3">
        <Avatar initials={c.nama.slice(0, 2).toUpperCase()} size={36} />
        <span>
          {c.nama}
          {c.hubungan && <span className="block text-xs text-text-muted">{c.hubungan}</span>}
        </span>
      </div>
    ),
  },
  { key: "perusahaan", label: "Perusahaan" },
  { key: "posisi", label: "Posisi" },
  { key: "kontak", label: "Kontak", render: (c) => <LinkCell url={c.kontak?.startsWith("http") ? c.kontak : null} label={c.kontak ?? ""} /> },
  {
    key: "kontakTerakhir", label: "Kontak Terakhir",
    render: (c) => {
      const days = c.kontakTerakhir ? daysBetween(c.kontakTerakhir, todayWIB()) : null;
      return (
        <span>
          {formatDate(c.kontakTerakhir)}
          {days != null && <span className="block text-xs text-text-muted">{days} hari lalu</span>}
        </span>
      );
    },
  },
  { key: "statusFollowUp", label: "Status", render: (c) => (c.statusFollowUp ? <StatusBadge label={c.statusFollowUp} warnaToken={c.statusFollowUp === "Perlu Follow-up" ? "danger" : c.statusFollowUp === "Menunggu Balasan" ? "info" : "success"} /> : "—") },
  {
    key: "aksi", label: "Aksi",
    render: (c) => <FollowUpButton contact={c} />,
  },
];

const fields: FormFieldDef[] = [
  { name: "nama", label: "Nama", type: "text", required: true },
  { name: "perusahaan", label: "Perusahaan", type: "text" },
  { name: "posisi", label: "Posisi", type: "text" },
  { name: "hubungan", label: "Hubungan", type: "select", options: ["Recruiter", "Alumni", "Mentor", "Rekan Kerja", "Lainnya"] },
  { name: "kontak", label: "Kontak (LinkedIn/email/WA)", type: "text" },
  { name: "kontakTerakhir", label: "Kontak Terakhir", type: "date" },
  { name: "statusFollowUp", label: "Status Follow-up", type: "select", options: ["Perlu Follow-up", "Menunggu Balasan", "Selesai"] },
  { name: "catatan", label: "Catatan", type: "textarea" },
];

/** Tombol Follow-up (prompt §8.7): kontakTerakhir = hari ini + status "Menunggu Balasan". */
function FollowUpButton({ contact }: { contact: Contact }) {
  const qc = useQueryClient();
  const [done, setDone] = useState(false);
  const followUp = useMutation({
    mutationFn: () =>
      api.patch(`/api/contacts/${contact.id}`, {
        kontakTerakhir: todayWIB(),
        statusFollowUp: "Menunggu Balasan",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    },
  });
  return (
    <button
      onClick={(e) => { e.stopPropagation(); followUp.mutate(); }}
      disabled={followUp.isPending || done}
      aria-live="polite"
      className={`cursor-pointer rounded-pill px-3 py-1.5 text-xs font-semibold shadow-clay-sm transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
        done ? "bg-success-soft text-success-text" : "bg-accent-soft text-accent-text hover:shadow-clay-md"
      }`}
    >
      {followUp.isPending ? "Mengirim…" : done ? "✓ Terkirim" : "Follow-up"}
    </button>
  );
}

export function ContactsPage() {
  return (
    <div className="flex flex-col gap-gap">
      <p className="text-[13px] text-text-muted">Mayoritas kerja didapet dari koneksi, bukan dari apply dingin.</p>
      <CrudTable<Contact>
        resource="contacts"
        queryKey="contacts"
        columns={columns}
        formFields={fields}
        emptyTitle="Belum ada kontak"
        emptyDesc="Tambahkan recruiter, alumni, atau mentor yang pernah kamu hubungi."
        searchPlaceholder="Cari kontak…"
      />
    </div>
  );
}
