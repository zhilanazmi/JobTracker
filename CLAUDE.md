# CLAUDE.md — Job Application Manager

Ringkasan konvensi proyek (prompt utama §12.8). Baca ini dulu di setiap sesi baru.

## Sumber kebenaran (urutan prioritas)
1. `design/job-manager.pen` — semua hal visual (token, komponen, shadow, radius)
2. `Prompt Final [CC] - Job Application Manager.md` — perilaku, data, bisnis, API, skema DB
3. Yang tidak disebut keduanya → paling sederhana, catat di `docs/DECISIONS.md`

## Larangan (jangan dilanggar)
- **0 nilai arbitrary Tailwind** (`bg-[#7C6AA8]`, `rounded-[22px]`, shadow inline) — semua via token `theme.css` (`bg-accent`, `rounded-md`, `shadow-clay-md`)
- **0 angka hardcoded** — semua metrik dihitung dari MySQL
- Jangan mengubah `design/job-manager.pen` (read-only)
- Jangan konversi uang ke `number` — uang = string desimal di API, format pakai `Intl.NumberFormat('id-ID')`
- Tidak ada `enum` Prisma/MySQL untuk status — status = `VarChar(50)` divalidasi Zod (daftar bisa diedit user)
- Tidak ada `console.log` di kode final, tidak ada `any`

## Fungsi sakral
- **`changeApplicationStatus()`** (`apps/api/src/services/applications.ts`) — satu pintu perubahan status. Satu transaksi: update `status` + `statusChangedAt` + tulis 1 baris `application_status_logs`. Semua endpoint (PATCH status, drag kanban, aksi drawer) wajib lewat sini. Pembuatan lamaran menulis log pertama `statusLama = null`.
- **Isolasi user terpusat** (`apps/api/src/db.ts`) — Prisma Client Extension inject `userId` otomatis dari AsyncLocalStorage. Handler TIDAK menulis `userId` manual. Operasi sistem (register/login/refresh) pakai client `root` (tanpa scoping) secara eksplisit. Akses data user lain → 404, bukan 403.
- **`withUser(userId, fn)`** — bungkus operasi dalam scope user.

## Konvensi DB
- `id BigInt autoincrement`; tabel user-scoped punya `userId` FK cascade + `isSample`
- Snake_case di MySQL via `@map`/`@@map`, camelCase di Prisma
- Uang: `Decimal(15,2)` → string di JSON. Tanggal murni: `@db.Date`
- Soft delete (`deletedAt`): `job_applications`, `contacts`, `documents`
- Timezone bisnis: **Asia/Jakarta (WIB)** — semua "hari ini", "≤3 hari", minggu WIB dihitung via `packages/shared/src/dates.ts`
- Tidak ada kolom hasil hitungan — median/skor/umur dihitung saat query

## Setup dev (tanpa Docker)
- MySQL 8 lokal (Laragon), DB `jam` + `jam_test`, user `jam`/`jampass`
- `pnpm i` → `pnpm db:migrate` (migrate dev) → `pnpm dev` (API 3000 + web 5173 via proxy)
- Test: `pnpm test` — shared unit (aturan bisnis) + API integration (DB `jam_test`, bukan mock)
- Screenshot: `apps/web/screenshot.mjs` & `shots-all.mjs` (butuh `CHROME_PATH` env + API jalan)

## Keputusan penting (detail di docs/DECISIONS.md)
- D1: `.pen` hanya berisi design system + 5 komponen; layout 11 halaman dari `Spesifikasi Detail 11 Screen (Claymorphism).md`
- D3: komposisi `shadow-clay-*` dibangun di Tailwind `@theme` dari 4 warna shadow `.pen`
- Tanpa Docker (keputusan user) — MySQL lokal Laragon
