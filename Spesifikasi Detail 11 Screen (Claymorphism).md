# Lampiran: Spesifikasi Detail 11 Screen — Job Application Manager (Claymorphism)

Dipakai bersama prompt utama (token, shadow, komponen). Semua ukuran dalam px untuk frame desktop **1440×1024** kecuali disebut lain. Frame mobile **390×844** untuk tiap screen.

## Kerangka global (dipakai semua screen)

- Sidebar kiri: x 0, lebar 260, full height, `bg/surface`, radius kanan `xl` 44px, `shadow/clay-md`.
- Area konten: x 260, lebar 1180, padding 32 → lebar konten efektif **1116**.
- Topbar tinggi 72 di dalam area konten: kiri judul halaman (h1 30/800) + deskripsi satu baris (13/400 `text/secondary`) di bawahnya; kanan: search pill 280×44, tombol tema 44×44, avatar 44.
- Strip metrik: tepat di bawah topbar, tinggi kartu **120**, gap 20.
- Grid 12 kolom di area konten: kolom 77, gutter 20.
- Mobile: sidebar → bottom-nav tinggi 72 (5 ikon + "Lainnya"), padding halaman 16, metrik jadi grid 2 kolom kartu 100 tinggi, tabel → daftar kartu (bukan tabel scroll).

---

## 1. Dashboard

**Baris metrik** — 6 MetricCard, grid 3 kolom × 2 baris (kartu 359×120) di 1440; isi persis:
Total Entri `16` · Sudah Apply `14` · Interview/Tes `5` · Offer/Diterima `1` · Aktif Pipeline `12` · Response Rate `64%` (delta ↑ hijau).
Ikon bulatan clay 44px: dokumen, kirim, kalender, trofi, arus, persen — masing-masing pakai warna soft berbeda.

**Panel "🔥 Yang Harus Dikerjain"** — x 0, lebar **736** (kolom 1–8), tinggi 420, `bg/surface`, radius `lg`, `shadow/clay-md`, padding 24. Judul h2 22/700. Berisi 6 baris, tinggi 56 masing-masing, gap 8, pemisah garis 1px `bg/surface-sunken`:

| Isi baris | Angka | Deskripsi |
|---|---|---|
| Perlu Follow-up | 3 | Lamaran stuck ≥7 hari di Applied/Screening |
| Lamaran Minggu Ini | 4 | dari target 10/minggu |
| Deadline ≤3 Hari | 2 | Lowongan yang mepet deadline |
| Interview Terjadwal | 3 | Siapkan diri |
| Kontak Perlu Follow-up | 1 | Networking jangan didiemin |
| Dokumen Perlu Update | 2 | Rapihin berkas sebelum butuh |

Tiap baris: bulatan clay 40px berisi angka (18/800) di kiri, judul 15/600, deskripsi 12/400 `text/muted`, chevron 16px di kanan. Baris dengan angka 0 → opacity 0.5, tanpa chevron.

**Panel "📊 Funnel Lamaran"** — x 756, lebar **360** (kolom 9–12), tinggi 420. 7 FunnelBar tinggi 28, gap 16: Applied 4 · Screening 3 · Tes 2 · Interview User 2 · Interview Akhir 1 · Offering 1 · Diterima 0. Panjang bar proporsional ke nilai maksimum, minimum 8% agar nilai kecil tetap terlihat. Label tahap 13/600 di kiri bar (lebar tetap 104), angka 15/800 di ujung kanan. Antar bar: teks konversi 11/400 `text/muted` rata kanan, mis. "75% →".

**Banner Setup** — full width 1116, tinggi 64, di atas baris metrik, fill `accent/secondary` soft (#FDEAE1), ikon 24, teks "Isi profil di Setup dulu biar target & metrik akurat" + tombol sm "Isi Sekarang". Punya varian hidden.

**Mobile**: banner → metrik 2 kolom → panel to-do (kartu penuh) → funnel. Funnel bar tinggi 24, label di atas bar bukan di samping.

---

## 2. Panduan

Lebar konten satu kolom terpusat max **920**, sisanya ruang kosong (halaman baca).

- **Seksi "🚀 Cara Mulai"**: 6 kartu, grid 2 kolom (kartu 450×148, gap 20). Tiap kartu: bulatan clay 48 berisi nomor (20/800, fill `accent/primary`, teks putih) di kiri atas, judul 18/700, deskripsi 14/400 3 baris, checkbox clay 28px di kanan atas. Isi: (1) Isi Setup — profil, target lamaran/minggu, target tanggal. (2) Rapikan Dokumen — upload CV, cover letter, ijazah, transkrip ke Drive, tempel link. (3) Cek Portal Job — 21 portal legit sudah terisi. (4) Mulai Tracking — tiap apply, tambah 1 baris di Job Tracker. (5) Update Status Rutin — tiap ada kabar, ubah status. (6) Cek Dashboard Tiap Hari — lihat "Yang Harus Dikerjain".
  Kartu tercentang: fill `status/success-soft`, nomor jadi ikon centang, judul strikethrough opacity 0.6. Di atas seksi: progress bar "3 dari 6 langkah".
- **Blok "🛡️ Kenali Loker Penipuan"**: kartu penuh 920, fill #FDE8E8, border 2px `status/danger` opacity 0.3, radius `lg`, ikon perisai 40 di bulatan clay merah soft. Judul h2 + subjudul "Tanda loker/rekrutmen ABAL-ABAL — hati-hati kalau ketemu ini". Isi 7 item dua kolom, tiap item ikon ✕ 16px merah + teks 14/400: minta uang/biaya pelatihan/seragam · email bukan domain resmi perusahaan · interview cuma via WhatsApp/Telegram · minta scan KTP, rekening, atau NPWP di tahap awal · gaji tidak wajar untuk fresh grad · alamat kantor tidak jelas atau ruko tanpa identitas · desakan tanda tangan kontrak cepat.
- **Seksi "💡 Tips Job Hunting"**: 9 kartu grid 3 kolom (kartu 293×140). Ikon centang clay 32 di kiri atas, judul 15/700, isi 13/400. Judul persis: CV di-tailor per lowongan · Kualitas > kuantitas · Follow-up itu wajar · Networking > apply dingin · Optimalkan LinkedIn · Siapin STAR buat interview · Track semua, termasuk ditolak · Upskill sambil jalan · Jaga mental & ritme.

---

## 3. Setup

Dua kartu berdampingan di baris atas:
- **Profil & Target Karir** — x 0, lebar 548, tinggi 520. 8 field satu kolom (label 13/600 di atas input, input inset 44 tinggi, gap 16): Nama · Target Posisi (placeholder "misal: Backend Engineer") · Target Industri · Lokasi Preferensi · Ekspektasi Gaji (dua input angka bawah–atas berdampingan + prefix "Rp") · LinkedIn · Email · No. HP.
- **Target Pencarian** — x 568, lebar 548, tinggi 520. Target Lamaran/Minggu: stepper clay besar (tombol − 44, angka display 40/800, tombol +), default 10. Target Dapat Kerja: date picker inset. Status Pencarian: segmented control 3 opsi clay (Aktif / Pasif / Sudah Diterima), opsi aktif `shadow/clay-pressed`. Di bawahnya kartu sunken kecil berisi ringkasan "10 lamaran/minggu × 8 minggu = 80 lamaran sampai target".

**Kartu "⚙️ Daftar Status & Prioritas"** — full 1116, tinggi 460, di bawahnya. Subjudul: "Status = tahap lamaran (dipakai dropdown di Job Tracker). Edit sesuai kebutuhan." Dua kolom daftar:
- Kiri (lebar 700): 11 baris status, tinggi 48. Tiap baris: drag handle ⋮⋮ 16px, nomor, input nama inline, color-swatch picker bulat 28px (menampilkan warna badge), preview StatusBadge, tombol hapus. Urutan: Wishlist, Mau Apply, Applied, Screening HR, Tes/Assignment, Interview User, Interview Akhir, Offering, Diterima, Ditolak, Ghosting. Baris terakhir: tombol ghost "+ Tambah status".
- Kanan (lebar 380): 3 baris prioritas — Tinggi, Sedang, Rendah — format sama.
Tunjukkan juga **state saat sedang di-drag**: baris terangkat `shadow/clay-lg`, rotate 1°, dan placeholder garis putus-putus di posisi tujuan.

---

## 4. Portal Job

- Topbar tambahan: toggle tampilan **Tabel ↔ Kartu** (segmented clay 2 opsi) di kanan, dan teks "Total portal terdaftar: 21" 13/400 di kiri.
- Kartu badge legit: strip tinggi 52, fill `status/success-soft`, ikon perisai, teks "Semua portal di bawah legit & banyak dipakai di Indonesia".
- **Baris chip filter**: 11 chip pill (`shadow/clay-sm`): Semua · Umum · Umum/Global · Tech & Startup · Remote · Pemerintah · Pemerintah/BUMN · Riset & Gaji · Eksekutif · Luar Negeri · Langsung. Chip aktif = fill `accent/primary`, teks putih, `shadow/clay-pressed`.
- **Tampilan Kartu**: grid 3 kolom, kartu **359×220**, gap 20. Isi kartu: bulatan clay 48 berisi inisial portal (mis. "LI", "JS", "GL") dengan warna soft berbeda per tipe; nama portal 18/700; badge tipe; fokus 13/400 2 baris; catatan 12/400 `text/muted` 2 baris dengan ellipsis; footer: link domain 12/600 `accent/primary` + ikon external-link, dan badge "Cocok: Fresh grad – mid" di kanan.
  Gambar minimal **9 kartu terisi data nyata**: LinkedIn (Networking + lowongan semua bidang / Umum-Global), JobStreet (Asia Tenggara, by SEEK, verifikasi ketat), Glints (digital, kreatif, startup, chat langsung ke HR), Kalibrr (AI matching, dipakai perusahaan besar), Indeed (agregator global, database terbesar), KitaLulus (lokal, terverifikasi, aman dari loker fiktif, ada CV maker), KarirHub SIAPkerja (portal resmi Kemnaker, gratis, terverifikasi Dukcapil), Rekrutmen Bersama BUMN (FHCI, periodik tahunan), Kerjawoy (loker luar negeri).
- **Tampilan Tabel**: kolom No · Nama Portal · Fokus/Spesialisasi · Tipe · Link · Cocok Untuk · Catatan. Lebar 48/180/260/150/180/150/ sisa.

---

## 5. Job Tracker (screen paling padat — gambar 3 varian)

**5a. Tampilan Tabel**
- Strip metrik 7 kartu kecil (lebar 152×96, gap 12): Total Entri 16 · Sudah Apply 14 · Interview/Tes 5 · Offer/Diterima 1 · Aktif Pipeline 12 · Perlu Follow-up 3 · Response Rate 64%.
- Baris kontrol tinggi 56: search 280, 4 dropdown filter (Status, Prioritas, Portal, Mode) lebar 150, date range 200, tombol "Export CSV" ghost, tombol primary "+ Tambah Lamaran".
- Nota kuning 13/400: "🟡 Isi manual: Tgl Apply · Perusahaan · Posisi · Status — sisanya opsional."
- Tabel: tinggi baris **56**, header 52 sunken. Lebar kolom: No 48 · Tgl Apply 104 · **Perusahaan 180 (sticky)** · Posisi 170 · Portal 140 · Tipe 100 · Mode 96 · Lokasi 120 · Est. Gaji 120 · Status 150 · Prioritas 110 · Deadline 104 · Tgl Interview 112 · Umur 72 · Next Action 220 · Link 56. Total jauh > 1116 → tunjukkan **scroll horizontal** dengan kolom Perusahaan sticky dan bayangan tepi di batas sticky.
- Gambar **8 baris data nyata**, termasuk state khusus:
  1. PT Kreatif Digital · UI/UX Designer · Glints · Full-time · Hybrid · Jakarta · 8–11jt · **Interview User** · Tinggi · deadline 08 Jul · "Siapin portfolio walkthrough"
  2. Tokopedia · Product Analyst · LinkedIn · WFO · Jakarta · 10–14jt · **Screening HR** · Tinggi · → baris **peringatan follow-up** (border kiri 4px `status/warning`)
  3. Startup Fintech X · Growth Marketing · Kalibrr · Remote · 9–12jt · **Applied** · Sedang
  4. Bank BUMN · Management Trainee · Rekrutmen Bersama BUMN · WFO Bandung · "Sesuai grade" · **Mau Apply** · deadline 12 Jul → baris **deadline mepet** (border kiri 4px `status/danger`, tanggal jadi merah tebal)
  5. Gojek · Data Analyst · Hybrid Jakarta · 12–16jt · **Interview Akhir** · Tinggi
  6. Astra International · HR Officer · Karir.com · WFO Jakarta · 9–12jt · **Offering** · → baris disorot `status/success-soft` tipis
  7. Ruangguru · Content Strategist · **Ditolak** · Rendah · opacity 0.65
  8. Tiket.com · Digital Marketing · Dealls · **Ghosting** · Rendah
- Footer tabel: "Menampilkan 8 dari 16" + pagination pill.
- Sertakan state **sel sedang diedit** (satu sel Next Action jadi input inset) dan **baris baru kosong**.

**5b. Tampilan Kanban** — 11 kolom lebar 280, gap 16, scroll horizontal. Kolom `bg/surface-sunken` radius `lg`, header 56: nama status + jumlah dalam pill + tombol "+". KanbanCard 248×132: perusahaan 16/700, posisi 13/400, baris meta (portal + mode) 12/400, footer: StatusBadge prioritas + tanggal + avatar portal. Tunjukkan **satu kartu sedang diangkat** (rotate 2°, `shadow/clay-lg`, opacity 0.95) dan **placeholder drop** garis putus-putus di kolom tujuan.

**5c. Drawer Detail** — lebar **520**, dari kanan, radius `xl` di sisi kiri, `shadow/clay-lg`, overlay 32%. Isi urut: header (perusahaan 24/800, posisi 15/400, StatusBadge, tombol tutup 44) · baris aksi cepat (Ubah Status, Tambah Interview, Buat Offer, Hapus) · grid 2 kolom detail field (8 pasang label/nilai) · **Timeline Status vertikal**: garis 2px `accent/primary-soft` dengan 4 titik clay 24px — Applied 26 Jun, Screening HR 30 Jun, Tes/Assignment 03 Jul, Interview User 08 Jul — tiap titik ada tanggal 12/600 dan selisih hari 11/400 `text/muted` ("+4 hari") · textarea catatan inset · tombol link lowongan.

---

## 6. Dokumen & Drive

- 4 MetricCard (kartu 269×120): Total Dokumen 10 · Final/Siap 4 · Perlu Update 2 · Sudah Ada Link "0 / 10".
- Tabel: No 48 · Nama Dokumen 300 (dengan ikon jenis 32 di bulatan clay) · Jenis 140 · Versi 72 · Link Drive 200 (pill "Buka Drive" atau placeholder "+ Tempel link" bergaya ghost) · Update Terakhir 130 · Status 140 · Catatan sisa.
- 10 baris nyata: CV/Resume ATS-friendly (v1, Perlu Update, "1 halaman, sesuaikan keyword per lowongan") · CV Kreatif (Draft) · Cover Letter template (Draft) · Portfolio (Perlu Update) · Ijazah (Final, "scan berwarna") · Transkrip Nilai (Final) · Pas Foto (Final, "background merah/biru") · KTP (Final) · Sertifikat kumpulan (Draft, "gabung jadi 1 PDF") · Surat Referensi (Draft).
- Baris berstatus "Perlu Update" → border kiri 4px `status/warning`; yang belum ada link → sel link bergaya kosong garis putus-putus.

---

## 7. Kontak & Networking

- Kalimat pembuka di topbar: "Mayoritas kerja didapet dari koneksi, bukan dari apply dingin."
- 3 MetricCard (kartu 359×120): Total Kontak 2 · Perlu Follow-up 1 · Menunggu Balasan 1.
- Tabel: No 48 · Nama 200 (avatar inisial clay 36 + nama 15/600 + hubungan 12/400 di bawahnya) · Perusahaan 160 · Posisi 160 · Hubungan 130 (badge) · Kontak 220 (ikon LinkedIn/email/WA + teks terpotong) · Kontak Terakhir 130 (+ "14 hari lalu" 11/400) · Status Follow-up 160 · Aksi 120 (tombol sm "Follow-up").
- 2 baris contoh: Rina · PT Maju Jaya · HR Recruiter · Recruiter · linkedin.com/in/… · Perlu Follow-up. Budi · Tokopedia · Senior Engineer · Alumni · budi@email.com · Menunggu Balasan.
- Sertakan **EmptyState** untuk halaman ini: ilustrasi clay dua bulatan bertaut, teks "Belum ada kontak. Tambah recruiter, alumni, atau mentor yang pernah lo hubungi.", tombol primary.

---

## 8. Upskill

- 4 MetricCard: Total Skill 5 · Sedang Belajar 2 · Selesai 0 · Rata-rata Progress 14%.
- Tampilan **kartu** (bukan tabel murni): grid 2 kolom, kartu **548×180**, gap 20. Isi: judul skill 18/700 + badge kategori; baris platform 13/400 + link course; **progress bar clay tinggi 16 radius pill** dengan angka persen 15/800 di kanan; slider persen di bawahnya (thumb clay 28); footer: badge status, target selesai, tombol ghost "Sertifikat" (disabled kalau belum ada).
- 5 kartu nyata: Excel/Spreadsheet lanjutan (Tools, YouTube/Coursera, Tinggi, Sedang Belajar, 40%, "Pivot, VLOOKUP, dashboard") · Bahasa Inggris speaking (Bahasa, Cakap/EF, Tinggi, Sedang Belajar, 30%) · Data Analysis SQL (Technical, DataCamp/Prakerja, Sedang, Belum Mulai, 0%) · Komunikasi & Public Speaking (Soft Skill, 0%) · Bahasa Jepang (Bahasa, Zenleap, 0%).
- Toggle ke tampilan tabel tetap disediakan.

---

## 9. Bank Persiapan Interview (gambar 2 varian)

**9a. Tabel** — 4 MetricCard: Total Pertanyaan 6 · Siap 2 · Perlu Latihan 2 · Belum Disiapkan 1.
Kolom: No 48 · Pertanyaan 300 (15/600, 2 baris) · Kategori 150 (badge) · Untuk Role 140 · Poin Jawaban STAR 280 (teks terpotong 2 baris + ikon expand) · Prioritas 110 · Status 150 · Aksi 100 (tombol "Latih").
6 baris nyata: "Ceritakan tentang diri Anda" (Umum, Siap) · "Apa kelebihan & kekurangan Anda?" (Perilaku, Perlu Latihan) · "Kenapa tertarik dengan perusahaan kami?" (Tentang Perusahaan, Belum Disiapkan) · "Ceritakan saat menghadapi konflik di tim" (Perilaku, Draft) · "Berapa ekspektasi gaji Anda?" (Gaji & Benefit, Perlu Latihan) · "Apakah ada pertanyaan untuk kami?" (Pertanyaan Balik, Siap).
Baris expand: area sunken di bawah baris menampilkan 4 blok STAR (Situation, Task, Action, Result) masing-masing textarea inset.

**9b. Mode Latihan** — layar terpisah, sidebar tersembunyi, `bg/canvas` penuh. Kartu clay besar **720×420** terpusat, `radius/xl`, `shadow/clay-lg`: badge kategori di atas · pertanyaan 30/800 terpusat, max 3 baris · **timer bulat clay 120px** (ring progress `accent/primary`, angka "01:24" 24/800) · tombol ghost "Lihat poin jawaban" (state tertutup & terbuka — terbuka menampilkan 4 poin STAR) · dua tombol besar lg berdampingan: "Siap" (success) dan "Perlu Latihan" (warning) · footer "Pertanyaan 2 dari 6" + dot progress 6 titik clay.

---

## 10. Riset & Benchmark Gaji

- 4 MetricCard: Total Entri 6 · Median Rata-rata Rp 20.416.667 · Gaji Atas Tertinggi Rp 90.000.000 · Gaji Bawah Terendah Rp 6.000.000. (Format Rupiah penuh, font 28/800 supaya tidak terpotong — ini kartu paling rawan overflow, cek panjangnya.)
- **Chart range gaji** — kartu full 1116 × 380: sumbu Y daftar role (6 baris, tinggi 44), sumbu X Rp 0–100jt dengan gridline 1px putus-putus. Tiap role: **floating bar clay** radius pill tinggi 20 dari gaji bawah ke gaji atas, warna `accent/primary` gradasi ke `accent/tertiary`, titik median 10px putih di tengah bar, label angka 11/600 di kedua ujung bar. **Garis vertikal putus-putus 2px `accent/secondary`** di posisi ekspektasi gaji user dari Setup, dengan label pill "Ekspektasi lo: 12jt" di atasnya. Legend di kanan atas.
- Tabel di bawah: No 48 · Role 200 · Level 120 (badge) · Industri 160 · Lokasi 130 · Gaji Bawah 140 · Gaji Atas 140 · Median 140 (sel sunken, menandakan terhitung otomatis) · Sumber 150 · Catatan sisa.
- 6 baris: UI/UX Designer Mid Tech/Startup Jakarta 9–15jt (LinkedIn Salary) · Product Analyst Junior Tech Jakarta 8–12jt (Glassdoor) · Data Scientist Senior Tech Jakarta 20–35jt (Kalibrr, "butuh 3+ th") · Growth Marketing Mid Startup Remote 10–16jt (Glints) · Product Manager Mid Tech Singapura 60–90jt (LinkedIn, "SGD 5–7,5k, kurs ~Rp12rb") · Management Trainee Fresh Grad BUMN Jakarta 6–9jt.

---

## 11. Perbandingan Offer

- 4 MetricCard: Jumlah Offer 3 · Gaji Pokok Tertinggi Rp 65.000.000 · THP Rata-rata Rp 32.166.667 · Skor Tertinggi 4.0.
- **Tampilan side-by-side** — 3 kartu **359×520**, gap 20. Isi tiap kartu urut: header (bulatan inisial clay 48, perusahaan 20/800, posisi 13/400) · Gaji Pokok 24/800 + label · Tunjangan (daftar 3 chip kecil) · THP Estimasi (kartu sunken kecil) · **Rating 3 baris**: WLB / Jenjang / Budaya, masing-masing 5 bulatan clay 20px (terisi = `accent/primary`, kosong = sunken) + angka · **Skor besar** dalam bulatan clay 72px · catatan 12/400 · tombol ghost "Lihat lamaran".
  Kartu skor tertinggi: ring 3px `accent/tertiary`, terangkat 6px, badge pill "Skor Tertinggi" menempel di sudut kanan atas.
  Data: **Astra International** HR Officer, pokok Rp 9.500.000, tunjangan BPJS/THR/bonus tahunan, THP Rp 11.000.000, WLB 4 Jenjang 4 Budaya 4, skor 4.0, "Sudah tahap Offering" → ini yang tertinggi. **Xendit** Finance Associate, Rp 12.000.000, asuransi/opsi saham/WFH stipend, THP Rp 13.500.000, 3/5/4, skor 4.0, "Fintech, growth cepat". **Grab (Singapura)** Product Manager, Rp 65.000.000, relokasi/asuransi internasional, THP Rp 72.000.000, 3/5/4, skor 4.0, "Perlu relokasi".
- **Radar chart** — kartu 359×520 keempat atau di bawahnya: 3 poligon tumpang tindih (satu per offer, opacity 0.35) di atas grid segitiga WLB/Jenjang/Budaya skala 1–5, legend warna.
- **Panel bobot** — kartu sunken 1116×140: 4 slider clay berlabel Gaji, WLB, Jenjang, Budaya dengan nilai persen; total harus 100%, tampilkan peringatan kalau tidak. Perubahan slider mengubah angka skor di kartu.
- Tabel lengkap di paling bawah: No · Perusahaan · Posisi · Gaji Pokok · Tunjangan · THP Estimasi · WLB · Jenjang · Budaya · Skor (sunken) · Catatan.

---

## Checklist sebelum dianggap selesai

- 11 screen × 2 breakpoint = **22 frame**, plus 3 varian ekstra (Job Tracker kanban, Job Tracker drawer, Interview mode latihan) = **25 frame**.
- Tiap frame: tidak ada teks terpotong, tidak ada nominal Rupiah yang overflow, kolom sticky punya bayangan tepi, dan tiap tabel punya state kosong + loading.
- Semua warna & shadow merujuk token bernama — nol nilai hardcoded di layer.
- Uji kontras: `text/muted` di atas `bg/surface-sunken`, teks badge di atas fill soft, dan label di atas kartu `accent/secondary`.
