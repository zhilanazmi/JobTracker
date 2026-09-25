# PRD — Job Application Manager

**Status**: Approved untuk eksekusi
**Tanggal**: 2026-09-24
**Deadline**: < 2 hari (target selesai 2026-09-26)
**Prompt teknis**: [Prompt Final Claude Code - Job Application Manager.md](../Prompt%20Final%20Claude%20Code%20-%20Job%20Application%20Manager.md) — **sumber kebenaran untuk semua detail teknis** (skema DB §4, aturan bisnis §5, auth §6, API §7, perilaku per halaman §8, seed §9, kualitas §12). PRD ini TIDAK menduplikasi detail tersebut.

---

## 1. Ringkasan Eksekutif

### Masalah
Melacak lamaran kerja lewat spreadsheet (workbook 11 halaman) cepat kacau: angka dihitung manual, status tidak konsisten, tidak ada riwayat perubahan, tidak bisa diakses multi-device, dan sulit dipakai ulang oleh orang lain.

### Solusi
Web app multi-user yang mengimplementasikan workbook tersebut 1:1 — dashboard metrik otomatis, job tracker (tabel + kanban), dan 9 halaman pendukung — dengan visual claymorphism dari desain final `design/job-manager.pen` dan data nyata di MySQL.

### Kriteria Sukses (KPI)

| # | KPI | Target | Cara ukur |
|---|-----|--------|-----------|
| 1 | Fungsional end-to-end | 11/11 halaman jalan dengan data MySQL asli; 0 angka hardcoded; 0 tombol mati | Uji manual per halaman + test Playwright alur apply → drag → offer |
| 2 | Kualitas teknis | `pnpm test` hijau 100% (unit aturan bisnis §5 + isolasi user + integration API vs MySQL test); bundle first load < 250 KB gzip; 0 N+1 | Output Vitest + `vite build` + review `include` Prisma |
| 3 | Kesetiaan visual | Screenshot desktop 1440 / mobile 390 × light/dark untuk semua halaman tersimpan di `docs/screenshots/`; kontras ≥ 4.5:1 (@axe-core); semua nilai via token (0 arbitrary value) | Screenshot pembanding vs render pen.dev |
| 4 | Adopsi nyata | Pemilik memakai app untuk lacak lamaran ≥ 1 minggu aktif pasca-launch; ≥ 1 teman daftar dan mengisi profil sendiri | Observasi pasca-launch (di luar scope 2 hari) |

---

## 2. Pengalaman Pengguna & Fungsionalitas

### Personas

1. **Pemilik (Zhillan)** — job hunter aktif Indonesia. Pakai harian: cek dashboard pagi, update status lamaran, follow-up kontak. Butuh cepat: keyboard shortcut, inline edit, tidak boleh ada klik sia-sia.
2. **Teman dekat (early user)** — job hunter lain. Mendaftar sendiri, mulai dari data contoh (`isSample`), belajar alur dari Panduan, lalu hapus data contoh dan isi data asli.
3. **Pengunjung publik** — menemukan app (portofolio/word of mouth). Ekspektasi: register mudah, app langsung terisi contoh sehingga bisa dinilai dalam 5 menit tanpa input data sendiri.

### User Stories (inti — daftar lengkap perilaku per halaman = prompt §8)

**US-1 — Dashboard sebagai komando pagi**
As a job hunter, I want to see 6 metrik + daftar "Yang Harus Dikerjain" sekaligus, so that saya tahu dalam 10 detik apa yang harus dilakukan hari ini.
**AC**:
- Semua angka dihitung dari DB saat query (0 kolom hasil hitungan, 0 hardcoded).
- Setiap item aksi = link ke halaman terkait dengan filter terpasang (mis. "Perlu Follow-up" → `/tracker?filter=followup`).
- Item bernilai 0: redup + tidak bisa diklik.
- Response rate 0/0 → tampil "—", bukan 0%.

**US-2 — Update status dari kanban**
As a job hunter, I want to drag lamaran antar kolom status, so that update terasa instan seperti Trello.
**AC**:
- Optimistic update; rollback + toast jika gagal.
- Drag memanggil endpoint status yang sama dengan semua aksi lain (satu fungsi service `changeApplicationStatus`).
- Kolom kanban = urutan dari `option_lists` (bisa diedit user di Setup).
- Alternatif keyboard tersedia (dnd-kit keyboard sensor).

**US-3 — Edit cepat di tabel**
As a job hunter, I want to inline-edit sel di Job Tracker, so that saya tidak perlu buka dialog untuk ganti satu nilai.
**AC**: Enter simpan, Esc batal, optimistic + rollback toast; kolom Perusahaan sticky; filter tercermin di URL.

**US-4 — Riwayat status bisa diaudit**
As a job hunter, I want to see timeline perubahan status per lamaran, so that saya ingat kapan HR terakhir membalas.
**AC**: Drawer detail menampilkan log dari `application_status_logs`; perubahan status hanya bisa lewat satu fungsi service (dalam 1 transaksi: update status + `statusChangedAt` + tulis log).

**US-5 — Data baru langsung terisi**
As a user baru, I want to see app yang sudah terisi data contoh realistis, so that saya bisa paham nilai app sebelum input apa pun.
**AC**: Register otomatis seed option_lists + 21 portal + data contoh (`isSample = true`, tanggal relatif terhadap hari ini); tombol "Hapus data contoh" di Setup dengan dialog konfirmasi.

**US-6 — Bandingkan offer secara objektif**
As a job hunter dengan >1 offer, I want to compare offer side-by-side dengan bobot yang saya tentukan, so that keputusan tidak murni perasaan.
**AC**: Maks 3 kartu + radar chart + slider bobot tersimpan di `offerWeights`; total bobot ≠ 100 → peringatan + tidak tersimpan; skor seri → semua diberi badge "Skor Tertinggi".

### Non-Goals (dilarang dibangun, lindungi timeline 2 hari)

- Mobile native app / PWA installable
- Notifikasi email / push, reminder terjadwal
- Parsing CV otomatis / integrasi ATS / scraping portal
- Multi-bahasa (id-ID saja) / multi-mata uang
- Kolaborasi tim, sharing workspace, role management
- Import workbook Excel asli (data masuk via seed + CRUD)
- Unggah file dokumen (cukup link Drive)

---

## 3. Kebutuhan Sistem AI

**Tidak ada fitur AI** di produk ini. Bagian tidak berlaku.

---

## 4. Spesifikasi Teknis (referensi, bukan duplikasi)

### Arsitektur
Monorepo pnpm workspaces — `apps/web` (React 19 + Vite + Tailwind v4), `apps/api` (Node 22 + Hono + Prisma → MySQL 8), `packages/shared` (Zod, dipakai kedua sisi). Detail lengkap: prompt §3.

**Alur data inti**: UI (TanStack Query + optimistic) → REST `/api` → validasi Zod (`packages/shared`) → service layer dengan Prisma Client Extension (injeksi `userId` otomatis) → MySQL. Status lamaran hanya lewat `changeApplicationStatus()`.

### Integration Points
- **MySQL 8** via `docker-compose.yml` (dengan Adminer) — prompt §3, §4
- **Desain `.pen`** via MCP pencil (read-only) — sumber kebenaran visual, prompt §1–2
- **Auth**: JWT access 15 menit + refresh 30 hari, cookie httpOnly, argon2id — prompt §6
- **Font**: Nunito self-host via `@fontsource`; ikon Lucide — prompt §2

### Security & Privacy
Prompt §6 adalah spesifikasi penuh. Poin kritis yang diuji eksplisit:
- **Isolasi data**: mekanisme terpusat (bukan `userId` manual per handler); user A akses data user B by-ID → **404** (bukan 403). Ada test yang membuktikannya.
- Rate limit login/register; CSRF protection untuk request mutasi; CORS terbatas origin web.
- Password argon2id; refresh token disimpan sebagai hash + rotasi tiap dipakai.

---

## 5. Risiko & Roadmap

### Roadmap terkompresi untuk deadline 2 hari

Prompt membagi 5 fase dengan checkpoint. Dengan <2 hari, urutan tetap tapi checkpoint dilaporkan **tanpa menunggu persetujuan lama** (lapor → lanjut; keberatan user = interupsi).

| Prioritas                | Scope    | Isi                                                                                                    | Kalau waktu habis                                                      |
| ------------------------ | -------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **MVP (wajib)**          | Fase 0–3 | Inventaris desain, fondasi + auth + isolasi, design system, **Dashboard + Job Tracker** end-to-end     | Tidak boleh dipotong                                                   |
| **v1.0 (target)**        | Fase 4   | 9 halaman sisanya, per 3 halaman: Setup/Panduan/Portal → Dokumen/Kontak/Upskill → Interview/Gaji/Offer | Urutan bawah dipotong duluan                                           |
| **v1.0.1 (jika sempat)** | Fase 5   | Hardening, README, CLAUDE.md, test Playwright lengkap                                                  | Kurangi jadi: README minimal + test isolasi yang sudah wajib di Fase 1 |

**Garis potong eksplisit** (didefer ke v1.1 jika timeline terancam, dalam urutan korban): export CSV streaming → mode latihan keyboard shortcut (Spasi/1/2) → toggle view URL `?view=` Portal → dokumentasi `docs/API.md` lengkap. **Tidak pernah dikorbankan**: isolasi user, `changeApplicationStatus`, seed relatif, dark mode, aksesibilitas dasar.

### Risiko Teknis

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Scope 11 halaman > kapasitas 2 hari | App setengah jadi | Garis potong eksplisit di atas; MVP dikunci Fase 0–3 |
| Ekstraksi token/komponen dari `.pen` makan waktu besar (MCP, schema, dark mode) | Fase 2 molor | Batasi inventaris ke yang dipakai UI; nilai yang tidak ada tokennya dibuat + dicatat, bukan dihabiskan waktu mencari |
| Seed tanggal tidak relatif → dashboard tak bisa diuji (semua lewat/stuck) | KPI #1 gagal | Seed wajib `today ± N`; test: minimal 1 per state (follow-up, deadline ≤3d, terlewat, interview, offering, ditolak, ghosting) — prompt §9 |
| Angka desain ter-hardcode secara tidak sengaja | Melanggar prinsip inti | Review: grep nilai metrik dari desain di kode; semua angka dari `/api/dashboard` |
| Aturan bisnis salah implementasi (funnel dari log, response rate, skor seri, minggu WIB) | Metrik salah, kepercayaan rusak | Unit test semua aturan §5 termasuk edge case sebelum halaman dibangun (TDD pada service layer) |
| Konflik desain vs prompt | Bingung saat eksekusi | Urutan prioritas prompt §1; catat di `DECISIONS.md`, tanyakan di checkpoint |
| N+1 / bundle bengkak (Recharts) | KPI #2 gagal | `include` eksplisit; Recharts + halaman berat lazy-load per route sejak awal, bukan di akhir |
| Checkpoint menunggu persetujuan | Waktu 2 hari terbakar | Mode lapor-lanjut (lihat roadmap); user bisa interupsi kapan pun |

### Definisi Selesai
Prompt §13 berlaku apa adanya: 11 halaman fungsional data asli, semua test hijau termasuk isolasi user, screenshot 4 kombinasi per halaman di `docs/screenshots/`, `DECISIONS.md` lengkap.
