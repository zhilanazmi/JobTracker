# Prompt Desain: Job Application Manager — Claymorphism di Pencil.dev

Dipakai di canvas Pencil.dev (VS Code / Cursor / desktop). Karena Pencil menyimpan desain sebagai file `.pen` dan menyuplai token & koordinat ke agen lewat MCP, prompt ini menaruh design token sebagai angka pasti — bukan kata sifat — supaya output kodenya tidak ngawur.

---

## PROMPT

Desain UI lengkap untuk web app **Job Application Manager** (11 halaman, Bahasa Indonesia) di canvas ini. Buat sebagai design system dulu, lalu screen. Simpan semua warna, shadow, radius, dan spacing sebagai **design token bernama** di `.pen`, jangan nilai hardcoded per layer — token inilah yang nanti dibaca agen saat generate React + Tailwind.

### Tema: Claymorphism

Prinsipnya: elemen terasa seperti tanah liat lembut yang ditekan — tebal, membulat, empuk. Bukan glassmorphism (tanpa blur transparan), bukan neumorphism (bukan monokrom abu dengan shadow nyaris tak terlihat). Ciri wajibnya: **radius besar, warna pastel hangat, dan dua lapis shadow sekaligus — outer drop shadow yang lembut + inner highlight di sisi atas dan inner shadow di sisi bawah.**

**Resep shadow clay (token `shadow/clay-md`), pakai ini konsisten:**
```
box-shadow:
  0 12px 24px -6px rgba(124, 106, 168, 0.22),   /* outer, lembut & jauh */
  0 4px 8px -4px rgba(124, 106, 168, 0.14),     /* outer, dekat */
  inset 0 -6px 12px rgba(139, 122, 184, 0.18),  /* inner bawah: tebal */
  inset 0 6px 10px rgba(255, 255, 255, 0.85);   /* inner atas: highlight */
```
Varian: `shadow/clay-sm` (semua nilai ×0.6, untuk badge & chip), `shadow/clay-lg` (×1.6, untuk modal & drawer), `shadow/clay-pressed` (hanya inset, outer dihapus — untuk state aktif/ditekan).

**Radius:** `radius/sm 14px`, `radius/md 22px`, `radius/lg 32px`, `radius/xl 44px`, `radius/pill 999px`. Tidak ada sudut < 14px di seluruh desain. Kartu metrik pakai `lg`, tombol pakai `pill`, input pakai `md`.

**Palet — light mode:**
- `bg/canvas` #F4F0FA (lavender pucat hangat, bukan putih)
- `bg/surface` #FFFFFF, `bg/surface-sunken` #EDE7F8
- `text/primary` #2E2A3B, `text/secondary` #6B647F, `text/muted` #9A93AC
- `accent/primary` #7C6AA8 (ungu clay), `accent/primary-soft` #E4DCF5
- `accent/secondary` #F2A98C (peach clay), `accent/tertiary` #86C5B4 (mint clay)
- Status: `status/success` #7FBF8A / soft #DFF0E2 · `status/warning` #F2C572 / soft #FBEFD6 · `status/danger` #E98B8B / soft #FADEDE · `status/info` #8FB3E0 / soft #DEE9F7 · `status/neutral` #B4AEC4 / soft #EBE8F2

**Palet — dark mode** (wajib dibuat, bukan afterthought): `bg/canvas` #201C2B, `bg/surface` #2B2639, `bg/surface-sunken` #231F30, text #F0EDF7 / #A9A2BC. Di dark mode, inner highlight turun ke `rgba(255,255,255,0.10)` dan inner shadow naik ke `rgba(0,0,0,0.40)` — kalau tidak, clay-nya hilang dan jadi kotak rata.

**Tipografi:** satu keluarga geometric-rounded, `Nunito` (fallback `Quicksand`). Weight hanya 400/600/800 — clay butuh huruf tebal membulat, bukan tipis. Skala: display 40/800, h1 30/800, h2 22/700, h3 18/700, body 15/400, label 13/600 (letter-spacing +0.02em), caption 12/400. Line-height 1.45 untuk body.

**Spacing:** grid 8px. Padding kartu 24px, gap antar kartu 20px, padding halaman 32px (16px di mobile).

### Komponen yang harus dibuat sebagai komponen `.pen` (dengan variant, bukan copy-paste)

1. **Button** — variant: primary (fill `accent/primary`, teks putih), secondary (fill `accent/primary-soft`), ghost, danger. State: default / hover (naik 2px, shadow ×1.15) / pressed (`shadow/clay-pressed`, turun 1px) / disabled (opacity 0.45, shadow dihapus) / loading. Size: sm 36px, md 44px, lg 52px. Semua `radius/pill`.
2. **MetricCard** — angka display 40/800, label 13/600 uppercase di atasnya, ikon opsional dalam bulatan clay 44px berwarna soft. Ada slot delta kecil (↑12%).
3. **StatusBadge** — pill, fill warna `soft`, teks warna solid pasangannya, `shadow/clay-sm`. Buat 11 instance sesuai status lamaran: Wishlist, Mau Apply, Applied, Screening HR, Tes/Assignment, Interview User, Interview Akhir, Offering, Diterima, Ditolak, Ghosting. Petakan warnanya logis: proses awal → info, tes/interview → warning, Diterima/Offering → success, Ditolak/Ghosting → neutral & danger.
4. **DataTable** — header baris sunken dengan radius atas `lg`, baris tinggi 56px, zebra sangat tipis (2% accent), baris hover terangkat halus, kolom pertama sticky. Sel dalam mode edit berubah jadi input inset (`shadow/clay-pressed`). Sertakan state: kosong, loading skeleton, dan baris bertanda peringatan (deadline mepet → border kiri 4px `status/danger`).
5. **Input / Select / DatePicker / Textarea / Slider / Toggle** — semua bergaya *inset* clay (tertekan ke dalam), bukan menonjol. Fokus = ring 3px `accent/primary-soft` + border `accent/primary`.
6. **Sidebar** — lebar 260px, item `radius/md`, item aktif diberi fill surface + `shadow/clay-sm` seolah tombol timbul; versi collapsed 76px ikon saja; versi mobile bottom-nav 5 ikon + tombol "Lainnya".
7. **KanbanCard & KanbanColumn** — kartu clay kecil (nama perusahaan 16/700, posisi 13/400, badge prioritas, tanggal), state saat diangkat: rotate 2°, `shadow/clay-lg`. Kolom pakai `bg/surface-sunken`, header kolom menampilkan jumlah dalam bulatan pill.
8. **FunnelBar** — bar horizontal clay membulat penuh dengan label tahap di kiri, angka di kanan, dan persentase konversi kecil antar bar.
9. **Drawer & Modal** — `radius/xl` di sudut yang menghadap kanvas, `shadow/clay-lg`, overlay #2E2A3B @ 32% (tanpa blur berat).
10. **Chips filter, Progress bar, Rating 1–5 (bulatan clay terisi), Toast, Tooltip, Avatar, EmptyState** (ilustrasi bentuk geometris clay sederhana, bukan stok ilustrasi).

### Screen yang harus digambar (desktop 1440px + mobile 390px untuk tiap screen)

1. **Dashboard** — 6 MetricCard di baris atas (grid 3×2 di 1440, 2 kolom di mobile); panel "🔥 Yang Harus Dikerjain" berisi 6 baris actionable (angka besar di bulatan clay + judul + deskripsi + chevron); panel "📊 Funnel Lamaran" dengan 7 FunnelBar; banner "Isi profil di Setup" bergaya clay peach di paling atas.
2. **Panduan** — 6 kartu langkah bernomor dengan checkbox clay; blok peringatan "🛡️ Kenali Loker Penipuan" pakai `status/danger-soft` dan ikon perisai; grid 9 kartu tips.
3. **Setup** — form dua kolom (Profil & Target Karir | Target Pencarian) dalam kartu terpisah; di bawahnya editor daftar status lamaran & prioritas yang bisa di-reorder (drag handle, badge preview warna).
4. **Portal Job** — toggle tampilan Tabel ↔ Kartu; baris chip filter per tipe portal; grid kartu portal (logo/inisial dalam bulatan clay, nama, tipe sebagai badge, fokus, link, catatan).
5. **Job Tracker** — tampilan tabel penuh 15 kolom (tunjukkan scroll horizontal dengan kolom Perusahaan sticky) DAN tampilan Kanban 11 kolom; plus drawer detail lamaran berisi timeline status vertikal bergaya clay.
6. **Dokumen & Drive** — 4 MetricCard + tabel; tiap baris punya ikon jenis dokumen dan badge status.
7. **Kontak & Networking** — 3 MetricCard + tabel dengan avatar dan tombol aksi cepat "Follow-up".
8. **Upskill** — 4 MetricCard + kartu per skill dengan progress bar clay besar dan slider persen.
9. **Bank Persiapan Interview** — tabel + **mode Latihan**: satu kartu clay besar di tengah kanvas berisi pertanyaan, timer bulat, dan dua tombol besar "Siap" / "Perlu Latihan".
10. **Riset & Benchmark Gaji** — tabel + chart floating-bar range gaji per role (bar clay membulat, garis putus-putus ekspektasi gaji user).
11. **Perbandingan Offer** — tabel + tampilan 3 kartu side-by-side dengan radar chart dan slider bobot; kartu skor tertinggi diberi ring `accent/tertiary` dan label "Skor Tertinggi".

### Aturan yang tidak boleh dilanggar

- Kontras teks minimal 4.5:1 terhadap latarnya. Pastel itu jebakan: `text/muted` di atas `bg/surface-sunken` harus dicek, bukan diasumsikan.
- Jangan pakai shadow clay pada teks, ikon garis, atau baris tabel individual — kalau semuanya timbul, tidak ada yang timbul. Hierarki: kanvas rata → kartu timbul → kontrol di dalam kartu tertekan (inset).
- Jangan tumpuk lebih dari dua level clay. Kartu di dalam kartu di dalam kartu bikin UI terlihat seperti bantal berlapis.
- Density tetap kerja: ini tool untuk melacak 100+ lamaran, jadi radius besar tidak boleh menaikkan tinggi baris tabel di atas 56px atau memangkas jumlah kolom yang terlihat.
- Semua teks pakai konten nyata dari data contoh (PT Kreatif Digital, Tokopedia, Astra International, Xendit, dst.), bukan lorem ipsum — Pencil akan meneruskan teks ini ke kode.
- Setelah selesai, ekspor token ke `theme.ts` / konfigurasi Tailwind (`colors`, `borderRadius`, `boxShadow` bernama `clay-sm/md/lg/pressed`) supaya implementasi React tinggal memakai `shadow-clay-md`, bukan menulis ulang empat baris shadow di setiap komponen.
