# Job Application Manager

Web app multi-user untuk melacak lamaran kerja — versi web dari workbook job-hunting 11 halaman. Tema **claymorphism** (desain token dari `design/job-manager.pen`), data nyata di **MySQL 8**.

## Prasyarat

- **Node.js 22+** & **pnpm 10+**
- **MySQL 8** lokal (tanpa Docker). Contoh: Laragon (`C:\laragon\bin\mysql\mysql-8.0.30-winx64`), XAMPP, atau installer resmi MySQL.

## Setup

```bash
# 1. Siapkan database (sekali, sebagai root MySQL)
CREATE DATABASE jam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE jam_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'jam'@'localhost' IDENTIFIED BY 'jampass';
GRANT ALL PRIVILEGES ON *.* TO 'jam'@'localhost';   -- butuh global utk shadow DB Prisma
FLUSH PRIVILEGES;

# 2. Install & migrasi
pnpm i
pnpm db:migrate        # prisma migrate dev (apps/api)

# 3. Jalankan
pnpm dev               # API :3000 + Web :5173 (proxy /api)
```

Buka `http://localhost:5173`, **Register** akun baru — data contoh otomatis terisi (21 portal, 16 lamaran, dokumen, kontak, dst.) dengan tanggal relatif terhadap hari ini.

## Struktur

```
apps/web        React 19 + TypeScript + Vite + Tailwind v4 + React Router
apps/api        Node 22 + Hono + Prisma → MySQL 8
packages/shared Skema Zod + aturan bisnis (dipakai web & api)
design/         job-manager.pen (read-only, sumber token visual)
docs/           PRD, DESIGN_INVENTORY, DECISIONS, API, screenshots/
```

## Perintah

| Perintah | Fungsi |
|---|---|
| `pnpm dev` | Jalankan API + Web bersamaan |
| `pnpm test` | Unit test aturan bisnis + integration test (DB `jam_test`) |
| `pnpm db:migrate` | Migrasi Prisma (dev) |
| `pnpm db:seed` | Seed demo |
| `pnpm build` | Build semua package |

## Halaman

Dashboard · Panduan · Setup · Portal Job · Job Tracker (tabel/kanban/drawer) · Dokumen & Drive · Kontak & Networking · Upskill · Bank Interview (+ Mode Latihan) · Riset Gaji · Perbandingan Offer

Detail perilaku: lihat `CLAUDE.md` dan `docs/PRD.md`.
