# Prompt Final Claude Code — Job Application Manager


---

## PROMPT

Kamu adalah senior full-stack engineer. Bangun web app **Job Application Manager**: versi web multi-user dari workbook job-hunting berbahasa Indonesia yang berisi 11 halaman. Desain visual sudah final dan tersimpan di **`design/job-manager.pen`** (tema claymorphism, dibuat di pen.dev). Tugasmu mengimplementasikannya menjadi aplikasi yang berjalan dengan data asli di MySQL, bukan mockup.

Kerjakan per fase (lihat bagian **Fase kerja**). **Berhenti di setiap checkpoint** dan laporkan hasilnya ke saya sebelum lanjut ke fase berikutnya.

### 1. Sumber kebenaran dan urutan prioritas

Kalau ada konflik, pakai urutan ini:

1. **File `.pen`** untuk semua hal visual: layout, ukuran, warna, shadow, radius, tipografi, spacing, ikon, state komponen, dan perilaku responsif (termasuk "tabel berubah jadi kartu di mobile").
2. **Prompt ini** untuk perilaku, data, aturan bisnis, API, dan skema database.
3. Kalau keduanya diam, pilih yang paling sederhana, lalu catat keputusanmu di `docs/DECISIONS.md`.

Angka di mockup (mis. "Total Entri 16", "Response Rate 64%") hanya **ilustrasi**. Semua angka di aplikasi harus dihitung dari database. **Jangan pernah meng-hardcode angka dari desain.**

Kalau desain menampilkan elemen yang tidak ada di prompt ini (mis. tombol atau filter tambahan), implementasikan kalau jelas fungsinya. Kalau tidak jelas, catat di `DECISIONS.md` dan tanyakan di checkpoint. Jangan membuat tombol mati.

### 2. Cara membaca desain dari pen.dev

- Server MCP `pencil` sudah terhubung. Nama tool-nya berbeda-beda antar versi. **Cek daftar tool yang tersedia saat ini dulu, jangan menebak.** Versi baru biasanya menyediakan `get_app_state`, `execute`, `read_skill`, dan `get_style`. Versi lama menyediakan `get_editor_state`, `batch_get`, `get_variables`, `get_screenshot`, dan `snapshot_layout`. Kalau ada tool `read_skill`, panggil dulu untuk mempelajari skema `.pen`.
- Urutan kerja wajib:
  1. Baca metadata dokumen. Daftar semua frame/screen dan komponen yang dapat dipakai ulang, lalu tulis inventarisnya ke `docs/DESIGN_INVENTORY.md` (nama frame → route aplikasi, nama komponen → file React).
  2. **Ekstrak semua variables/token** (warna light + dark, shadow `clay-sm/md/lg/pressed`, radius, spacing, font). Petakan ke **Tailwind v4 `@theme`** di `apps/web/src/styles/theme.css` sebagai CSS variables. Dark mode memakai `[data-theme="dark"]`, dan token yang nilainya berbeda di dark mode (terutama inner highlight/shadow clay) harus ikut dipetakan.
  3. Bangun komponen dasar sesuai komponen `.pen` beserta semua variant dan state-nya.
  4. Susun screen dari komponen tersebut.
- **Dilarang memakai nilai arbitrary** seperti `bg-[#7C6AA8]`, `rounded-[22px]`, atau shadow inline. Semua nilai harus lewat token bernama (`bg-accent-primary`, `rounded-md`, `shadow-clay-md`). Kalau ada nilai di desain yang tidak punya token, buat tokennya dan catat.
- Font: pakai font dari desain (Nunito). Self-host lewat `@fontsource`, jangan pakai CDN Google Fonts.
- Ikon: kalau desain memakai ikon Lucide, pakai `lucide-react`. Kalau bukan, cari padanan terdekat dan catat.
- **Jangan mengubah file `.pen`.** Akses ke desain hanya untuk membaca. Kalau menurutmu desainnya salah, laporkan di checkpoint.

### 3. Stack

Monorepo pnpm workspaces:

```
apps/web        React 19 + TypeScript + Vite + Tailwind v4 + React Router
apps/api        Node 22 + Hono + TypeScript (ESM) + Prisma
packages/shared Skema Zod + tipe TS yang dipakai web & api
design/         job-manager.pen (read-only)
docs/           DESIGN_INVENTORY.md, DECISIONS.md, API.md
```

- **Frontend**: TanStack Query (dengan optimistic update untuk inline edit dan drag kanban), TanStack Table, React Hook Form + Zod, Recharts, dnd-kit untuk kanban dan reorder. Tidak ada state global besar karena server adalah sumber kebenaran.
- **Backend**: Hono + Prisma → **MySQL 8**. Validasi request memakai skema Zod dari `packages/shared`, jadi satu skema dipakai di dua sisi.
- **Dilarang**: PHP/Laravel, Next.js, dan komponen UI jadi yang membawa gayanya sendiri (MUI, Chakra, Ant). Headless primitive seperti Radix boleh dipakai untuk aksesibilitas dialog, select, dan tooltip, asalkan gayanya 100% dari token clay.

### 4. Database MySQL (Prisma)

Konvensi yang berlaku di semua tabel:
- `id BigInt @id @default(autoincrement())`, `userId` FK → `users` dengan `onDelete: Cascade`, `isSample Boolean @default(false)`, `createdAt`, `updatedAt`.
- Nama tabel/kolom di MySQL memakai `snake_case` lewat `@map`/`@@map`, sedangkan field Prisma memakai `camelCase`. Charset `utf8mb4_unicode_ci`.
- Uang: `Decimal @db.Decimal(15,2)`. **Di JSON API dikirim sebagai string**, dan diformat di frontend dengan `Intl.NumberFormat('id-ID')`. Jangan pernah dikonversi ke `number` untuk perhitungan uang.
- Tanggal tanpa jam: `@db.Date`. Timezone aplikasi **Asia/Jakarta**. Semua perhitungan "hari ini", "≤3 hari", dan "≥7 hari" dihitung dalam WIB.
- Status, prioritas, kategori, dan field sejenis disimpan sebagai `String @db.VarChar(50)` dan divalidasi dengan Zod. **Jangan memakai `enum` Prisma atau MySQL**, karena daftar status bisa diedit user.
- Soft delete (`deletedAt`) untuk `job_applications`, `contacts`, dan `documents`.

Tabel:

1. `users` — `email` unique, `passwordHash`, `createdAt`.
2. `profiles` (1:1 user) — `nama`, `targetPosisi`, `targetIndustri`, `lokasiPreferensi`, `ekspektasiGajiBawah`, `ekspektasiGajiAtas`, `linkedin`, `email`, `noHp`, `targetLamaranPerMinggu` Int default 10, `targetDapatKerja` Date?, `statusPencarian` default "Aktif", `offerWeights` Json default `{"gaji":0,"wlb":34,"jenjang":33,"budaya":33}`, `onboardingSteps` Json (6 checkbox Panduan).
3. `option_lists` — `tipe` ("status_lamaran" | "prioritas"), `label`, `urutan` Int, `warnaToken` (nama token badge), `isTerminal` Boolean. Unique `(userId, tipe, label)`.
4. `job_portals` — `namaPortal`, `fokus`, `tipe`, `link`, `cocokUntuk`, `catatan` Text.
5. `job_applications` — `tglApply` Date?, `perusahaan`, `posisi`, `portalId` FK?, `tipeKerja`, `modeKerja`, `lokasi`, `estGajiBawah`?, `estGajiAtas`?, `estGajiTeks`? (untuk nilai seperti "Sesuai grade" atau "SGD 4–6k"), `status`, `prioritas`, `deadline` Date?, `tglInterview` Date?, `nextAction`, `linkLowongan`, `catatan` Text, `statusChangedAt` DateTime. Index `(userId, status)`, `(userId, deadline)`, `(userId, tglApply)`.
6. `application_status_logs` — `jobApplicationId` FK, `statusLama`?, `statusBaru`, `changedAt`.
7. `documents` — `namaDokumen`, `jenis`, `versi`, `linkDrive`?, `updateTerakhir` Date?, `status`, `catatan`.
8. `contacts` — `nama`, `perusahaan`, `posisi`, `hubungan`, `kontak`, `kontakTerakhir` Date?, `statusFollowUp`, `catatan`.
9. `upskills` — `skill`, `kategori`, `platform`, `linkCourse`, `prioritas`, `status`, `targetSelesai` Date?, `progress` Int (0–100), `linkSertifikat`?.
10. `interview_questions` — `pertanyaan` Text, `kategori`, `untukRole`, `starSituation`, `starTask`, `starAction`, `starResult` (Text), `contohKonkret` Text, `prioritas`, `status`, `catatan`, `terakhirDilatih` DateTime?.
11. `salary_benchmarks` — `role`, `level`, `industri`, `lokasi`, `gajiBawah`, `gajiAtas`, `sumber`, `catatan`.
12. `job_offers` — `jobApplicationId` FK?, `perusahaan`, `posisi`, `gajiPokok`, `tunjangan` Text, `thpEstimasi`, `wlb`, `jenjang`, `budaya` (Int 1–5), `catatan`.

**Tidak ada kolom hasil hitungan.** Median, skor, umur lamaran, dan semua metrik dihitung saat query.

### 5. Aturan bisnis (implementasikan persis seperti ini)

- **Perubahan status** hanya boleh lewat satu fungsi service `changeApplicationStatus()`. Fungsi ini, dalam satu `prisma.$transaction`, mengupdate `status` dan `statusChangedAt` lalu menulis 1 baris `application_status_logs`. Semua endpoint (PATCH, drag kanban, aksi drawer) memanggil fungsi ini. Pembuatan lamaran baru juga menulis log pertama (`statusLama = null`).
- **Sudah Apply** = status bukan "Wishlist" dan bukan "Mau Apply".
- **Interview/Tes** = status ∈ {Tes/Assignment, Interview User, Interview Akhir}.
- **Offer/Diterima** = status ∈ {Offering, Diterima}.
- **Aktif Pipeline** = sudah apply dan status bukan terminal (`isTerminal`: Diterima, Ditolak, Ghosting).
- **Response Rate** = jumlah lamaran sudah apply yang statusnya pernah melewati "Applied" (cek di log) ÷ jumlah sudah apply. Kalau penyebutnya 0, tampilkan "—", bukan 0% dan bukan NaN.
- **Perlu Follow-up** = status ∈ {Applied, Screening HR} dan `statusChangedAt` ≤ hari ini − 7 hari.
- **Deadline mepet** = `deadline` antara hari ini dan hari ini + 3 hari (inklusif). Deadline yang sudah lewat masuk kategori terpisah "Terlewat" dan tidak dihitung sebagai mepet.
- **Interview Terjadwal** = `tglInterview` ≥ hari ini.
- **Lamaran Minggu Ini** = `tglApply` di minggu berjalan (Senin–Minggu, WIB), dibandingkan dengan `targetLamaranPerMinggu`.
- **Umur Lamaran** = hari ini − `tglApply`, dalam hari.
- **Kontak perlu follow-up** = `statusFollowUp` = "Perlu Follow-up" **atau** `kontakTerakhir` > 14 hari lalu dengan status "Menunggu Balasan".
- **Funnel** = jumlah lamaran yang **pernah mencapai** tiap tahap (dari log), bukan hanya yang sedang di tahap itu. Kalau pakai status terkini, konversinya tidak bermakna. Konversi antar tahap = tahap(n) ÷ tahap(n−1).
- **Median gaji** = (gajiBawah + gajiAtas) ÷ 2, dihitung dengan Decimal.
- **Skor offer** = rata-rata berbobot dari WLB, Jenjang, Budaya, dan komponen Gaji. Komponen Gaji = THP dinormalisasi ke skala 1–5 relatif terhadap THP tertinggi di antara offer user. Total bobot harus 100. Kalau bobot default gaji 0, hasilnya sama dengan rata-rata tiga rating seperti di spreadsheet asli. **Kalau ada skor yang seri, semua yang seri diberi badge "Skor Tertinggi"** (di data contoh, ketiga offer seri di 4.0, jadi aturan ini benar-benar terpakai).
- **Hapus data contoh**: satu tombol di Setup yang menghapus semua baris `isSample = true` milik user, dengan dialog konfirmasi.
- Validasi: `tglInterview` ≥ `tglApply`, gaji atas ≥ gaji bawah, link harus `http(s)://`, progress 0–100, rating 1–5.

### 6. Auth dan keamanan

- Register/login dengan email + password (hash argon2id). Access token JWT 15 menit + refresh token 30 hari, keduanya di cookie `httpOnly; Secure; SameSite=Lax`. Refresh token disimpan hash-nya di DB dan dirotasi setiap dipakai.
- **Isolasi data wajib lewat satu mekanisme terpusat**: Prisma Client Extension atau repository layer yang otomatis menyuntik `userId` ke setiap `where` dan `data`. Handler tidak boleh menulis `userId` manual. Tulis test yang membuktikan user A tidak bisa membaca, mengubah, atau menghapus data user B lewat ID langsung (harus mengembalikan 404, bukan 403, supaya tidak membocorkan keberadaan data).
- Rate limit untuk endpoint login dan register. Proteksi CSRF untuk request yang mengubah data (double-submit token atau cek header Origin). CORS hanya untuk origin web.
- Saat register, seed otomatis `option_lists` default, 21 portal, dan semua data contoh (`isSample = true`) untuk user tersebut.

### 7. API

REST dengan prefix `/api`. Setiap resource punya `GET` list (pagination, `?q=` search, filter per kolom, `?sort=`), `POST`, `PATCH /:id`, dan `DELETE /:id`. Resource: `applications`, `portals`, `documents`, `contacts`, `upskills`, `questions`, `salaries`, `offers`, `options`, `profile`. Endpoint tambahan:

- `GET /api/dashboard` — **satu response** berisi 6 metrik, 6 item "Yang Harus Dikerjain", funnel, dan flag `profileIncomplete`.
- `PATCH /api/applications/:id/status` — mengubah status (memanggil `changeApplicationStatus`).
- `GET /api/applications/:id/timeline` — isi log status.
- `PATCH /api/options/reorder` — urutan status/prioritas.
- `POST /api/offers/from-application/:id` — membuat offer dari lamaran.
- `GET /api/export/:resource?format=csv|json` — streamed.
- `DELETE /api/sample-data`.

Format error konsisten: `{ error: { code, message, fields? } }`. Dokumentasikan semua endpoint di `docs/API.md`.

### 8. Perilaku per halaman

Layout, visual, dan susunan elemen **mengikuti frame `.pen`**. Bagian ini hanya mengatur perilakunya.

1. **Dashboard** — data dari `/api/dashboard`. Setiap item "Yang Harus Dikerjain" menjadi link ke halaman terkait dengan filter yang sudah terpasang (mis. klik "Perlu Follow-up" → `/tracker?filter=followup`). Item bernilai 0 ditampilkan redup dan tidak bisa diklik. Banner Setup muncul kalau `profileIncomplete`.
2. **Panduan** — konten statis. 6 checkbox langkah tersimpan di `profiles.onboardingSteps`.
3. **Setup** — form profil dengan autosave (debounce 800 ms) dan indikator "Tersimpan". Editor status/prioritas bisa tambah, ubah nama, ganti warna token, reorder dengan drag, dan hapus. **Status yang masih dipakai lamaran tidak boleh dihapus**; tampilkan jumlah pemakaiannya dan tawarkan untuk memindahkan lamaran ke status lain. Ada tombol "Hapus data contoh".
4. **Portal Job** — toggle Tabel ↔ Kartu (disimpan di URL `?view=`), filter chip per tipe, CRUD.
5. **Job Tracker** — tiga tampilan dari desain: tabel, kanban, dan drawer detail. Tabel mendukung inline edit per sel (Enter simpan, Esc batal, optimistic update + rollback dengan toast kalau gagal), kolom Perusahaan sticky, penanda baris follow-up/deadline/terminal sesuai desain, dan semua filter tercermin di query string URL. Kanban mendukung drag antar kolom (memanggil endpoint status) dengan urutan kolom dari `option_lists`. Drawer berisi timeline dari log, aksi cepat, "Buat Offer", dan "Tambah pertanyaan interview" (membuat pertanyaan dengan `untukRole` terisi).
6. **Dokumen & Drive** — CRUD. Sel link kosong menampilkan state "+ Tempel link" sesuai desain.
7. **Kontak & Networking** — CRUD. Tombol "Follow-up" mengisi `kontakTerakhir` = hari ini dan status = "Menunggu Balasan".
8. **Upskill** — tampilan kartu dan tabel. Slider progress menyimpan dengan debounce. Kalau progress mencapai 100, status otomatis menjadi "Selesai".
9. **Bank Persiapan Interview** — tabel dengan baris yang bisa diperluas ke 4 field STAR. **Mode Latihan** di route `/interview/latihan` sesuai desain: urutan acak dengan prioritas "Tinggi" dan status "Perlu Latihan/Belum Disiapkan" didahulukan, timer bisa dipilih 60/90/120 detik, dan tombol "Siap"/"Perlu Latihan" mengupdate status serta `terakhirDilatih`. Keyboard: Spasi untuk buka poin jawaban, 1 = Siap, 2 = Perlu Latihan.
10. **Riset & Benchmark Gaji** — tabel + chart range gaji dengan garis ekspektasi dari profil. Kalau ekspektasi kosong, garis disembunyikan dan diganti ajakan kecil untuk mengisi Setup.
11. **Perbandingan Offer** — tampilan kartu side-by-side (maksimal 3, dengan pemilih offer kalau jumlahnya lebih dari 3), radar chart, dan panel slider bobot yang menyimpan ke `offerWeights`. Kalau total bobot bukan 100, tampilkan peringatan dan jangan simpan.

Berlaku global: search `/` untuk fokus, `n` untuk tambah baris, Esc untuk tutup drawer/dialog. Setiap halaman punya empty state, loading skeleton, dan error state sesuai desain. Toggle tema tersimpan di `localStorage` dan mengikuti `prefers-color-scheme` pada kunjungan pertama. Format tanggal `DD MMM YYYY` dengan locale id-ID. Format Rupiah `Rp 9.500.000`.

### 9. Data contoh (seed)

Pakai data dari desain dan workbook asli: 21 portal, sekitar 16 lamaran (PT Kreatif Digital, Tokopedia, Startup Fintech X, Bank BUMN, Gojek, Traveloka, Shopee, Bank Mandiri, Ruangguru, Grab, Bukalapak, Tiket.com, Xendit, Blibli, Sea Group, Astra International), 10 dokumen, 2 kontak, 5 upskill, 6 pertanyaan interview, 6 benchmark gaji, dan 3 offer (Astra, Xendit, Grab Singapura).

**Penting: semua tanggal di seed harus relatif terhadap hari ini** (mis. `tglApply = today − 12`, `deadline = today + 2`), bukan tanggal tetap. Kalau memakai tanggal asli (Juni–Juli 2026), semua lamaran akan terhitung lewat deadline dan stuck, sehingga Dashboard tidak bisa diuji. Susun seed supaya setiap state yang digambar di desain punya minimal satu contoh nyata: minimal 1 perlu follow-up, 1 deadline ≤3 hari, 1 deadline terlewat, 1 interview terjadwal, 1 offering, 1 ditolak, dan 1 ghosting. Seed juga harus menulis log status yang masuk akal (lamaran di "Interview Akhir" punya log Applied → Screening HR → Interview User → Interview Akhir) supaya funnel dan timeline berisi.

### 10. Fase kerja dan checkpoint

**Fase 0 — Inventaris (tanpa kode aplikasi).** Hubungkan ke MCP pencil, baca seluruh dokumen, lalu tulis `DESIGN_INVENTORY.md`: daftar frame, token, komponen dan variant-nya, serta ketidaksesuaian atau kekurangan desain (mis. screen tanpa versi mobile, state yang tidak digambar, kontras yang meragukan). → **CHECKPOINT: kirim inventaris ke saya.**

**Fase 1 — Fondasi.** Monorepo, `docker-compose.yml` (MySQL 8 + Adminer), skema Prisma + migrasi, seed, auth, middleware isolasi user, dan test isolasi. → **CHECKPOINT: `pnpm test` hijau, tunjukkan output test isolasi.**

**Fase 2 — Design system.** `theme.css` dari token, lalu semua komponen dasar beserta variant/state di halaman `/dev/components` (hanya aktif di mode development). Bandingkan setiap komponen dengan render dari pen.dev. → **CHECKPOINT: screenshot `/dev/components` light + dark berdampingan dengan render desain.**

**Fase 3 — Irisan inti.** Dashboard + Job Tracker (tabel, kanban, drawer) end-to-end dengan data MySQL asli. → **CHECKPOINT: screenshot ketiga tampilan Job Tracker + Dashboard di desktop 1440 dan mobile 390, beserta daftar perbedaan dengan desain.**

**Fase 4 — 9 halaman sisanya**, memakai komponen yang sudah ada. Kalau butuh komponen baru, komponen itu harus berasal dari desain. → **CHECKPOINT per 3 halaman.**

**Fase 5 — Hardening.** Aksesibilitas, performa, error handling, README, dan test akhir. → **CHECKPOINT akhir.**

### 11. Verifikasi visual (wajib di setiap fase UI)

Jalankan aplikasi, lalu ambil screenshot dengan Playwright di 1440×1024 dan 390×844, light dan dark. Bandingkan dengan render frame yang sama dari pen.dev. Periksa dan perbaiki sebelum melapor:
- teks terpotong atau overflow, terutama nominal Rupiah panjang di kartu metrik
- radius, shadow, dan warna yang tidak sesuai token
- elemen yang bertumpuk
- kontras teks di bawah 4.5:1 (cek otomatis dengan `@axe-core/playwright`)
- dark mode yang membuat efek clay hilang

Jangan menyatakan "sesuai desain" tanpa screenshot pembanding.

### 12. Kualitas

- TypeScript `strict`, tanpa `any`. ESLint + Prettier. Tidak ada `console.log` di kode final.
- Tidak ada N+1: `select`/`include` Prisma harus eksplisit. List memakai pagination (default 50).
- Test: Vitest untuk unit test semua fungsi aturan bisnis di bagian 5 (termasuk edge case: penyebut 0, skor seri, deadline hari ini, perhitungan minggu WIB), integration test API terhadap database MySQL test (bukan mock), dan 1 test Playwright untuk alur apply → drag ke Interview → buat offer.
- Performa: first load bundle web < 250 KB gzip. Recharts dan halaman berat di-lazy-load per route.
- Aksesibilitas: semua kontrol bisa dipakai lewat keyboard, focus ring terlihat, label form eksplisit, drag kanban punya alternatif keyboard (dnd-kit keyboard sensor), dan dialog punya focus trap.
- Buat `CLAUDE.md` di root yang berisi ringkasan konvensi proyek ini (sumber kebenaran, larangan nilai arbitrary, fungsi `changeApplicationStatus`, isolasi userId) supaya sesi berikutnya tetap konsisten.
- `README.md`: prasyarat, `docker compose up -d`, `pnpm i`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev`, akun demo, dan struktur folder.

### 13. Definisi selesai

- Semua 11 halaman berfungsi dengan data MySQL asli. Tidak ada angka hardcoded dan tidak ada tombol mati.
- Semua test hijau, termasuk test isolasi user.
- Screenshot desktop/mobile/light/dark untuk tiap halaman tersimpan di `docs/screenshots/` bersama perbedaan yang tersisa dengan desain beserta alasannya.
- `DECISIONS.md` mencatat setiap penyimpangan dari desain atau dari prompt ini.

Mulai dari **Fase 0**. Jangan menulis kode aplikasi sebelum inventaris desain saya setujui.
