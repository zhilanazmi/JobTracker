# API — Job Application Manager

Prefix `/api`. Semua request (kecuali register/login/refresh) butuh cookie `access_token` (JWT 15 menit). Refresh otomatis via cookie `refresh_token` (30 hari, rotasi tiap dipakai).

Format error konsisten: `{ "error": { "code": "...", "message": "...", "fields?": {...} } }`. Akses data user lain by-ID → **404** (bukan 403).

## Auth
| Endpoint | Body | Keterangan |
|---|---|---|
| `POST /api/auth/register` | `{email, password, nama}` | Rate limit 10/menit. Seed otomatis: option_lists, 21 portal, data contoh `isSample` |
| `POST /api/auth/login` | `{email, password}` | Rate limit 10/menit |
| `POST /api/auth/refresh` | — | Rotasi refresh token |
| `POST /api/auth/logout` | — | Hapus refresh token + cookie |

## Resource (pola seragam)
`applications`, `portals`, `documents`, `contacts`, `upskills`, `questions`, `salaries`, `offers`

- `GET /api/:resource?q=&page=&take=&sort=` — list, pagination default 50 (max 100)
- `POST /api/:resource` — create
- `PATCH /api/:resource/:id` — update parsial
- `DELETE /api/:resource/:id` — hapus (soft delete: documents, contacts, applications)

## Khusus
| Endpoint | Keterangan |
|---|---|
| `GET /api/dashboard` | 1 response: `metrics` (6), `todo` (6 item + href), `funnel` (7 tahap + konversi), `profileIncomplete` |
| `PATCH /api/applications/:id/status` | `{status}` — satu pintu `changeApplicationStatus`: transaksi update status+statusChangedAt+log |
| `GET /api/applications/:id/timeline` | Log status per lamaran |
| `GET /api/options` / `POST` / `PATCH /:id` / `DELETE /:id?force=true&moveTo=` | Editor status/prioritas. Delete status terpakai tanpa `force` → 409 `STATUS_IN_USE` |
| `PATCH /api/options/reorder` | `{tipe, ids[]}` — urutan baru |
| `GET /api/profile` / `PATCH /api/profile` | Profil + `offerWeights` (total wajib 100) + `onboardingSteps` |
| `PATCH /api/profile/onboarding` | `{steps[]}` — 6 checkbox Panduan |
| `POST /api/offers/from-application/:id` | Buat offer dari lamaran (prefill perusahaan/posisi/gaji) |
| `GET /api/export/:resource?format=csv\|json` | Streamed export |
| `DELETE /api/sample-data` | Hapus semua baris `isSample` milik user |

## Konvensi data
- Uang = string desimal (`"9500000.00"`) — tidak pernah number
- Tanggal = `"YYYY-MM-DD"`; timezone bisnis Asia/Jakarta
- Status/prioritas = string bebas, valid vs `option_lists` user
- id = string BigInt di JSON
