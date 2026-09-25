# DESIGN_INVENTORY — job-manager.pen

Dibaca via MCP pencil, 2026-09-24. Dokumen: `design/job-manager.pen` (versi schema 2.17, tema `mode: light|dark`).

## ⚠️ Temuan Kritis #1: `.pen` TIDAK berisi 11 screen

Prompt utama menyatakan "desain visual sudah final dan tersimpan di `design/job-manager.pen` (11 halaman)". **Realitanya hanya 2 frame top-level:**

| Frame                | ID                | Isi                                                              |
| -------------------- | ----------------- | ---------------------------------------------------------------- |
| `01 · Design System` | `P2SU5p` (1400px) | Header, swatch Colors, specimen Typography, demo Radius & Shadow |
| `02 · Components`    | `Rl4ar` (1360px)  | 5 komponen reusable + variant/state-nya                          |

Tidak ada satu pun frame screen (Dashboard, Tracker, dst.), desktop maupun mobile.

**Namun**: file `Spesifikasi Detail 11 Screen (Claymorphism).md` (di root repo) adalah spesifikasi tekstual sangat detail dari 25 frame (11 screen × 2 breakpoint + 3 varian ekstra: kanban, drawer, mode latihan) — ukuran, token, konten data, dan state semuanya ada. File `Prompt Desain Claymorphism untuk Pencil.dev (1).md` adalah resep token yang **konsisten 1:1** dengan variables `.pen` (nilai warna & shadow identik).

**Keputusan (per urutan prioritas prompt §1)**: `.pen` = sumber kebenaran token/komponen; spesifikasi MD = sumber kebenaran layout per halaman. Seluruh nilai di MD sudah merujuk token `.pen`, jadi tidak konflik. Dicatat di `DECISIONS.md`.

## Temuan Kritis #2: naming token vs prompt utama

Prompt utama menulis nama token `clay-sm/md/lg/pressed` (Tailwind: `shadow-clay-md`). `.pen` memakai nama variabel berbeda:

| Token `.pen` | Setara prompt | Catatan |
|---|---|---|
| `shadow/outer-1`, `shadow/outer-2`, `shadow/inner-dark`, `shadow/highlight` | 4 komponen warna clay shadow | Warna, bukan komposisi |
| (tidak ada) | `shadow/clay-sm/md/lg/pressed` | **Komposisi 4-layer tidak ada sebagai variabel** — tersimpan per-komponen sebagai `effect` array |

→ Solusi: komposisi Tailwind `--shadow-clay-*` dibangun dari 4 warna variabel `.pen`. Pressed = hanya inner-dark + highlight. Nilai px dari `.pen` (lihat §Shadow di bawah).

## Variabel / token (38)

### Warna (light → dark)

| Token | Light | Dark |
|---|---|---|
| `font/body` | Nunito (fallback Quicksand) | sama |
| `bg/canvas` | #F4F0FA | #201C2B |
| `bg/surface` | #FFFFFF | #2B2639 |
| `bg/surface-sunken` | #EDE7F8 | #231F30 |
| `text/primary` | #2E2A3B | #F0EDF7 |
| `text/secondary` | #5A5370 | #B6B0C6 |
| `text/muted` | #6B6480 | #9A93AC |
| `accent/primary` | #7C6AA8 | #A48FD0 |
| `accent/primary-soft` | #E4DCF5 | #39335A |
| `accent/secondary` | #F2A98C | sama |
| `accent/tertiary` | #86C5B4 | sama |
| `status/success` | #7FBF8A | #8FD09A |
| `status/success-soft` | #DFF0E2 | #2A3B2E |
| `status/success-text` | #2F6B3F | #A7DCB0 |
| `status/warning` | #F2C572 | sama |
| `status/warning-soft` | #FBEFD6 | #413522 |
| `status/warning-text` | #8A6410 | #F0CE8E |
| `status/danger` | #E98B8B | sama |
| `status/danger-soft` | #FADEDE | #442A2E |
| `status/danger-text` | #9B3B3B | #F0A8A8 |
| `status/info` | #8FB3E0 | sama |
| `status/info-soft` | #DEE9F7 | #25334A |
| `status/info-text` | #2E5A96 | #A9C6EC |
| `status/neutral` | #B4AEC4 | sama |
| `status/neutral-soft` | #EBE8F2 | #332E42 |
| `status/neutral-text` | #5C5570 | #C4BED2 |

### Shadow warna (light → dark)

| Token | Light | Dark |
|---|---|---|
| `shadow/outer-1` | #7C6AA838 (rgba 124,106,168,.22) | #00000073 |
| `shadow/outer-2` | #7C6AA824 (.14) | #00000047 |
| `shadow/inner-dark` | #8B7AB82E (.18) | #00000066 |
| `shadow/highlight` | #FFFFFFD9 (.85) | #FFFFFF1A (.10) |

→ Konsisten dengan resep "dark mode: highlight .85→.10, inner shadow .18→.40-ish".

### Radius & spacing (sama di dua tema)

`radius/sm 14` · `radius/md 22` · `radius/lg 32` · `radius/xl 44` · `radius/pill 999` · `space/card 24` · `space/gap 20` · `space/page 32`. Tidak ada token gap-8 (grid 8px dari resep MD) → buat sendiri di Tailwind bila perlu, catat.

## Komponen reusable (5) + variant

### Cmp · Button (`pKgN5`)
- Dasar: h 44, radius pill, padding [0,24], gap 8, label 15/600, clay-md shadow.
- **Variant fill**: Primary (`accent/primary`, teks putih) · Secondary (`accent/primary-soft`, teks `accent/primary`... dicek saat implementasi) · Ghost (fill transparan, teks `accent/primary`, **tanpa shadow**) · Danger (digambar di panel, fill `status/danger`).
- **State**: Default, Hover (naik 2px, shadow ×1.15), Pressed (`clay-pressed`, turun 1px), Disabled (opacity 0.45, tanpa shadow), Loading.
- **Size**: sm 36, md 44, lg 52.

### Cmp · StatusBadge (`GBB1X`)
- Pill, fill soft, teks solid pasangan, clay-sm shadow.
- **11 instance status** dengan pemetaan warna (inventaris dari panel Badges):
  - Wishlist → neutral-soft/neutral-text
  - Mau Apply, Applied, Screening HR → info-soft/info-text
  - Tes/Assignment, Interview User, Interview Akhir → warning-soft/warning-text
  - Offering, Diterima → success-soft/success-text
  - Ditolak → danger-soft/danger-text
  - Ghosting → neutral-soft/neutral-text

### Cmp · MetricCard (`rMqB6`)
- 250 lebar, radius lg, clay-md, layout vertical gap 14, padding `space/card`.
- Struktur: Top (Label 13/600 uppercase `text/secondary` + IconWrap bulatan 44 `accent/primary-soft` berisi icon) → Value 40/800 `text/primary` → DeltaRow (DeltaPill "↑ 12%" 12 `status/success-text` + caption 12 `text/muted`).

### Cmp · Avatar (`Arlmg`)
- 40×40 bulat, fill `accent/secondary`, clay-sm, teks inisial. Contoh: BS, DP, NA, +8.

### Cmp · Chip (`TASuD`)
- Pill, fill `bg/surface`, clay-sm, teks label. Contoh: Active, JobStreet, Glints, Kalibrr.

## Shadow compositions (dari `effect` komponen)

**clay-md** (button, metric, kartu):
```
0 12px 24px -6px shadow/outer-1,
0 4px 8px -4px shadow/outer-2,
0 -6px 12px shadow/inner-dark,   /* outer-shim untuk inner bawah */
0 6px 10px shadow/highlight
```
**clay-sm** (badge, chip, avatar) = semua ×0.6: `0 7.2px 14.4px -3.6px outer-1, 0 2.4px 4.8px -2.4px outer-2, 0 -3.6px 7.2px inner-dark, 0 3.6px 6px highlight`.
**clay-lg** (drawer/modal) = ×1.6: `0 19.2px 38.4px -9.6px outer-1, 0 6.4px 12.8px -6.4px outer-2, 0 -9.6px 19.2px inner-dark, 0 9.6px 16px highlight`.
**clay-pressed** = hanya `0 -6px 12px inner-dark, 0 6px 10px highlight` (inner saja, outer dihapus).

Catatan implementasi: `.pen` menyimpan 4 shadow sebagai `shadowType: outer` (bukan `inset` asli). Di CSS pakai `inset` untuk 2 yang terakhir — hasil visual sama.

## Tipografi (specimen)

| Peran | fs/weight | fill |
|---|---|---|
| Display | 40/800 | text/primary |
| h1 | 30/800 | text/primary |
| h2 | 22/700 | text/primary |
| h3 | 18/700 | text/primary |
| Body | 15/400 | text/secondary |
| Label | 13/600 (+0.02em) | text/secondary |
| Caption | 12/400 | text/muted |

Weight yang dipakai desain: 400/600/700/800 (resep MD bilang 400/600/800 — 700 juga muncul; Nunito variable font menutup keduanya).

## Ketidaksesuaian & celah desain (untuk checkpoint)

1. **Tidak ada screen** di `.pen` — hanya design system + komponen. Layout 11 halaman diambil dari `Spesifikasi Detail 11 Screen.md`. Ini keputusan terbesar, butuh persetujuan user.
2. **Mobile**: spesifikasi MD mendefinisikan aturan responsive (sidebar→bottom-nav, tabel→kartu), tapi tidak ada frame mobile digambar. Implementasi mengikuti aturan MD.
3. **Tidak ada state empty/loading skeleton/surface error** yang digambar di `.pen` (hanya disebut di resep komponen DataTable). Implementasi buat konsisten dengan bahasa clay.
4. `text/secondary` light #5A5370 (di `.pen`) vs #6B647F (di resep MD) — **nilai beda**. Pakai nilai `.pen` (sumber kebenaran #1). `text/muted` juga: `.pen` #6B6480 vs resep #9A93AC — pakai `.pen`. Perlu cek kontras 4.5:1, terutama `text/muted` di atas `bg/surface-sunken`.
5. Tidak ada token komposisi `shadow/clay-*` di `.pen` (hanya 4 warna) — komposisi dibangun di Tailwind `@theme`, dicatat.
6. Font fallback: Quicksand disebut di MD; self-host Nunito via `@fontsource` saja dulu (fallback sistem sans), catat.
7. Icon library terkonfirmasi **Lucide** (icon node `lucide/briefcase`, `lucide/loader-circle`) → pakai `lucide-react`.

## Peta komponen → file React (rencana Fase 2)

| Komponen .pen                                                                                                                                                                   | File                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Cmp · Button                                                                                                                                                                    | `apps/web/src/components/ui/Button.tsx`      |
| Cmp · StatusBadge                                                                                                                                                               | `apps/web/src/components/ui/StatusBadge.tsx` |
| Cmp · MetricCard                                                                                                                                                                | `apps/web/src/components/ui/MetricCard.tsx`  |
| Cmp · Avatar                                                                                                                                                                    | `apps/web/src/components/ui/Avatar.tsx`      |
| Cmp · Chip                                                                                                                                                                      | `apps/web/src/components/ui/Chip.tsx`        |
| (spec MD) DataTable, Input, Select, DatePicker, Textarea, Slider, Toggle, Sidebar, KanbanCard/Column, FunnelBar, Drawer, Modal, Toast, Tooltip, EmptyState, ProgressBar, Rating | `apps/web/src/components/ui/*`               |

## Peta screen → route (dari MD, 11 halaman)

| #   | Screen              | Route        | Varian ekstra           |
| --- | ------------------- | ------------ | ----------------------- |
| 1   | Dashboard           | `/`          | —                       |
| 2   | Panduan             | `/panduan`   | —                       |
| 3   | Setup               | `/setup`     | —                       |
| 4   | Portal Job          | `/portal`    | `?view=table\|cards`    |
| 5   | Job Tracker         | `/tracker`   | Tabel / Kanban / Drawer |
| 6   | Dokumen & Drive     | `/dokumen`   | —                       |
| 7   | Kontak & Networking | `/kontak`    | —                       |
| 8   | Upskill             | `/upskill`   | —                       |
| 9   | Bank Interview      | `/interview` | `/interview/latihan`    |
| 10  | Riset Gaji          | `/gaji`      | —                       |
| 11  | Perbandingan Offer  | `/offer`     | —                       |
