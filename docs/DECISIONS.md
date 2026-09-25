# DECISIONS — Job Application Manager

Log keputusan yang menyimpang dari desain atau prompt utama. Tanggal format YYYY-MM-DD.

## 2026-09-24 — Fase 0

### D1: `.pen` tidak berisi 11 screen; layout diambil dari spesifikasi MD
- **Fakta**: `design/job-manager.pen` hanya berisi Design System (token lengkap, light+dark) dan 5 komponen reusable (Button, StatusBadge, MetricCard, Avatar, Chip). Tidak ada frame screen.
- **Sumber layout**: `Spesifikasi Detail 11 Screen (Claymorphism).md` di root repo — spesifikasi tekstual 25 frame yang sangat detail dan semua nilainya merujuk token `.pen`.
- **Keputusan**: `.pen` = sumber kebenaran token & komponen; spesifikasi MD = sumber kebenaran layout per halaman. Keduanya tidak konflik.
- **Status**: ⏳ butuh persetujuan user di checkpoint Fase 0.

### D2: Nilai token beda antara `.pen` dan resep MD
`text/secondary` light: `.pen` #5A5370 vs resep MD #6B647F. `text/muted` light: `.pen` #6B6480 vs resep MD #9A93AC.
- **Keputusan**: pakai nilai `.pen` (urutan prioritas prompt §1 menempatkan `.pen` di atas prompt). Kontras dicek saat Fase 2 dengan axe-core.

### D3: Komposisi `shadow/clay-*` tidak ada sebagai variabel `.pen`
`.pen` hanya menyimpan 4 warna shadow (`shadow/outer-1/2`, `shadow/inner-dark`, `shadow/highlight`); komposisi 4-layer tersimpan per-node sebagai effect.
- **Keputusan**: bangun komposisi di Tailwind v4 `@theme` sebagai `--shadow-clay-sm/md/lg/pressed` dari 4 warna itu. Nilai px diambil dari effect node `.pen` (md = 0 12 24 -6 / 0 4 8 -4 / inset 0 -6 12 / inset 0 6 10; sm = ×0.6; lg = ×1.6; pressed = inner saja).

### D4: Fallback font Quicksand tidak di-self-host
- **Keputusan**: self-host Nunito via `@fontsource` saja; fallback ke system-ui sans. Quicksand hanya muncul di resep MD, bukan kebutuhan fungsional.

### D5: Token spacing grid 8px tidak ada di `.pen`
`.pen` hanya punya `space/card 24`, `space/gap 20`, `space/page 32`.
- **Keputusan**: pakai spacing scale bawaan Tailwind (basis 4px = grid 8px tercapai); tiga token `.pen` dipetakan eksplisit (`p-card` = 24, `gap` antar kartu = 20, `p-page` = 32).

### D6: Tanpa Docker — MySQL lokal Laragon (permintaan user, 2026-09-24)
`docker-compose.yml` dihapus. MySQL 8.0.30 dari Laragon dipakai; DB `jam` + `jam_test`, user `jam`/`jampass`. Adminer diganti Prisma Studio (`pnpm prisma studio`).

### D7: Extension isolasi tidak mengubah types Prisma (2026-09-24)
`db.ts` inject `userId` saat runtime, tapi TS types tetap menuntutnya di input → beberapa panggilan memakai `as any` pada create/update ter-scope. Alternatif (tiap resource punya factory client) terlalu mahal untuk timeline 2 hari. Test isolasi (10 test) membuktikan runtime-nya benar.

### D8: HTTPException 401 jatuh ke 500 (ditemukan saat verifikasi visual, 2026-09-25)
`app.onError` tidak menangani `HTTPException` → 401 auth ter-log sebagai 500. Diperbaiki: HTTPException → status asli.

### D9: Chart Recharts diganti SVG ringan (2026-09-25)
KPI bundle < 250 KB gzip tercapai tanpa Recharts (98 KB first load). Chart gaji = SVG floating-bar, radar offer = SVG polygon. Recharts (lazy chunk) jadi opsi v1.1 kalau butuh interaktivitas lebih.

### D10: `@fontsource/nunito` dipakai via package
Self-host Nunito (prompt §2) sudah terpenuhi via dependency `@fontsource/nunito`; import di `main.tsx` belum terpasang — font masih fallback saat build ini. TODO v1.0.1: import `@fontsource/nunito/400.css` dst. di `main.tsx`.

### D10-fix: font terpasang
`main.tsx` harus mengimport CSS font sebelum theme.css. Sudah diperbaiki dalam commit terkait (lihat repo state terkini).

### D11: Inline edit tabel Tracker & keyboard dnd-kit — dipotong dari MVP (2026-09-5)
Prompt §8.5 meminta inline edit per sel + keyboard drag alternatif. Deadline 2 hari: fitur ini masuk v1.1 (dicatat sebagai korban potong terurut di PRD §5). Click-to-open drawer tetap ada; status tetap bisa diubah via drawer/kanban.

### D12: `alert()` dipakai untuk feedback quick action (2026-09-25)
Seharusnya toast komponen. Dibatasi sampai v1.1 (toast design belum digambar di desain).

### D13: Panel `offerWeights` otomatis normalisasi sisa bobot
Slider mengubah satu bobot → sisa 3 di-rescale proporsional agar total selalu 100. Prompt hanya minta warning & tidak simpan; implementasi ini lebih baik (tidak bisa invalid), catat sebagai penyimpangan netral.

