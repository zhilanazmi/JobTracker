import {
  Briefcase, Send, CalendarClock, Trophy, Activity, Percent,
} from "lucide-react";
import { Button, StatusBadge, MetricCard, Avatar, Chip, Input, Select, Textarea, Field, Card, CardTitle } from "@/components/ui";

/**
 * /dev/components — katalog design system (hanya relevan saat dev).
 * Setiap komponen + variant + state, untuk dibandingkan dengan render .pen
 * (checkpoint Fase 2: screenshot light + dark berdampingan).
 */

const STATUS_LIST = [
  "Wishlist", "Mau Apply", "Applied", "Screening HR", "Tes/Assignment",
  "Interview User", "Interview Akhir", "Offering", "Diterima", "Ditolak", "Ghosting",
];

export function ComponentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardTitle>Button</CardTitle>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>StatusBadge — 11 status lamaran</CardTitle>
        <div className="mt-4 flex flex-wrap gap-3">
          {STATUS_LIST.map((s) => (
            <StatusBadge key={s} label={s} />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <StatusBadge label="Tinggi" />
          <StatusBadge label="Sedang" />
          <StatusBadge label="Rendah" />
        </div>
      </Card>

      <div>
        <CardTitle>MetricCard</CardTitle>
        <div className="mt-4 grid grid-cols-1 gap-gap sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Total Entri" value="16" icon={Briefcase} iconColor="accent" delta={{ text: "12%", up: true, caption: "vs minggu lalu" }} />
          <MetricCard label="Sudah Apply" value="14" icon={Send} iconColor="info" />
          <MetricCard label="Interview/Tes" value="5" icon={CalendarClock} iconColor="warning" />
          <MetricCard label="Offer/Diterima" value="1" icon={Trophy} iconColor="success" />
          <MetricCard label="Aktif Pipeline" value="12" icon={Activity} iconColor="accent" />
          <MetricCard label="Response Rate" value="64%" icon={Percent} iconColor="info" delta={{ text: "8%", up: true }} />
        </div>
      </div>

      <Card>
        <CardTitle>Avatar & Chip</CardTitle>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Avatar initials="BS" />
          <Avatar initials="DP" />
          <Avatar initials="NA" />
          <Avatar initials="+8" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Chip active>Active</Chip>
          <Chip>JobStreet</Chip>
          <Chip>Glints</Chip>
          <Chip>Kalibrr</Chip>
        </div>
      </Card>

      <Card>
        <CardTitle>Form (inset clay)</CardTitle>
        <div className="mt-4 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Perusahaan">
            <Input placeholder="misal: Tokopedia" />
          </Field>
          <Field label="Status">
            <Select defaultValue="">
              <option value="" disabled>Pilih status…</option>
              {STATUS_LIST.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Catatan">
              <Textarea placeholder="Next action, catatan HR, dll." />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Tipografi</CardTitle>
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-[40px] font-extrabold leading-tight">Display 40/800</p>
          <p className="text-[30px] font-extrabold leading-tight">Heading 1 30/800</p>
          <p className="text-[22px] font-bold">Heading 2 22/700</p>
          <p className="text-[18px] font-bold">Heading 3 18/700</p>
          <p className="text-[15px] text-text-secondary">Body 15/400 — Kelola semua lamaran, dokumen, dan kontak dari satu tempat.</p>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-text-secondary">Label 13/600</p>
          <p className="text-xs text-text-muted">Caption 12/400 — Terakhir diperbarui 2 jam lalu</p>
        </div>
      </Card>

      <Card>
        <CardTitle>Radius</CardTitle>
        <div className="mt-4 flex flex-wrap gap-5">
          {[
            ["sm 14", "rounded-sm"],
            ["md 22", "rounded-md"],
            ["lg 32", "rounded-lg"],
            ["xl 44", "rounded-xl"],
          ].map(([label, cls]) => (
            <div key={label} className={`h-20 w-20 bg-accent-soft shadow-clay-sm ${cls} flex items-center justify-center text-xs font-semibold text-accent`}>
              {label}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
