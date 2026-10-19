# Deploy Job Application Manager ke VPS (Nginx)

Panduan ini deploy aplikasi monorepo ke satu VPS Linux: React/Vite sebagai static files Nginx, API Hono tetap berjalan sebagai service Node.js, MySQL sebagai database. Domain contoh: `jobtracker.example.com`. Ganti domain, user, password, dan path sesuai VPS.

> Asumsi: Ubuntu 22.04/24.04, Node.js 22+, pnpm 10+, MySQL 8, Nginx. Jalankan perintah di VPS sebagai user sudo, kecuali disebut lain. Jangan expose port API atau MySQL ke internet.

## 1. Siapkan DNS dan firewall

Arahkan record DNS `A` domain ke IP publik VPS. Jika pakai `www`, tambahkan record `A` atau `CNAME` juga.

Buka SSH, HTTP, HTTPS. Contoh UFW:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Jangan buka port `3000` atau `3306` secara publik.

## 2. Install runtime dan layanan

Install Node.js 22, pnpm 10, MySQL 8, Nginx, dan Git dari repositori resmi distro/vendor. Pastikan versi:

```bash
node --version
pnpm --version
mysql --version
nginx -v
```

## 3. Siapkan MySQL production

Masuk MySQL sebagai administrator:

```bash
sudo mysql
```

Buat database dan user khusus aplikasi. Ganti password contoh sebelum menjalankan:

```sql
CREATE DATABASE jam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'jam_app'@'localhost' IDENTIFIED BY 'GANTI_DENGAN_PASSWORD_KUAT';
GRANT ALL PRIVILEGES ON jam.* TO 'jam_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

User production tidak butuh grant global/shadow database yang dipakai setup development. Migration production memakai `prisma migrate deploy`.

## 4. Clone dan build aplikasi

```bash
sudo mkdir -p /var/www/jobtracker
sudo chown "$USER":"$USER" /var/www/jobtracker
cd /var/www/jobtracker
git clone <URL_REPOSITORY> .
pnpm install --frozen-lockfile
pnpm --filter @jam/web build
pnpm --filter @jam/api build
```

Jika repository private, konfigurasi akses Git secara aman. Jangan taruh token di URL repository atau file yang ikut commit.

Build web Vite umumnya menghasilkan `apps/web/dist`; cek nama output setelah build. Build API menghasilkan `apps/api/dist` sesuai konfigurasi TypeScript.

## 5. Konfigurasi environment API

Baca `apps/api/src/auth.ts`, `apps/api/src/db.ts`, dan konfigurasi Prisma untuk memastikan format environment aktual. Buat `/etc/jobtracker-api.env` dengan nilai yang cocok dengan variabel yang dibaca kode:

```dotenv
NODE_ENV=production
PORT=3000
DATABASE_URL="mysql://jam_app:GANTI_PASSWORD_URL_ENCODED@127.0.0.1:3306/jam"
WEB_ORIGIN=https://jobtracker.example.com
```

Isi juga secret auth/cookie/JWT yang diwajibkan implementasi aplikasi, gunakan nilai acak kuat. Jangan menebak nama variabel secret; cocokkan dengan `apps/api/src/auth.ts`. URL-encode karakter spesial dalam password di `DATABASE_URL`.

Kunci file:

```bash
sudo chown root:root /etc/jobtracker-api.env
sudo chmod 600 /etc/jobtracker-api.env
```

`WEB_ORIGIN` harus persis origin frontend, termasuk skema HTTPS dan tanpa path.

## 6. Jalankan migrasi production

Pastikan environment tersedia di shell sebelum command Prisma, misalnya:

```bash
set -a
. /etc/jobtracker-api.env
set +a
pnpm --filter @jam/api exec prisma migrate deploy
```

Perintah migrasi mengubah skema database. Ambil backup database sebelum deploy migration di production.

Contoh backup manual:

```bash
mysqldump --single-transaction -u jam_app -p jam > "$HOME/jam-backup-$(date +%F-%H%M).sql"
```

## 7. Jalankan API dengan systemd

Cari path absolut Node.js dan pnpm:

```bash
command -v node
command -v pnpm
```

Buat `/etc/systemd/system/jobtracker-api.service`. Sesuaikan `ExecStart` dengan path `pnpm` yang ditemukan:

```ini
[Unit]
Description=JobTracker API
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/jobtracker
EnvironmentFile=/etc/jobtracker-api.env
ExecStart=/usr/bin/pnpm --filter @jam/api start
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Pastikan `www-data` dapat membaca repository, node_modules, dan build output, tanpa dapat menulis source atau file secret. Kalau perlu ownership berbeda, pisahkan deployment user dan runtime user serta beri akses baca minimum.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now jobtracker-api
sudo systemctl status jobtracker-api
sudo journalctl -u jobtracker-api -n 100 --no-pager
```

Tes API dari VPS:

```bash
curl -i http://127.0.0.1:3000/api/health
```

Respons yang diharapkan: HTTP 200 dengan JSON `{"ok":true}`.

## 8. Konfigurasi Nginx

Buat `/etc/nginx/sites-available/jobtracker`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name jobtracker.example.com;

    root /var/www/jobtracker/apps/web/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:js|css|svg|png|jpg|jpeg|webp|ico|woff2?)$ {
        try_files $uri =404;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }
}
```

Aktifkan config dan validasi sebelum reload:

```bash
sudo ln -s /etc/nginx/sites-available/jobtracker /etc/nginx/sites-enabled/jobtracker
sudo nginx -t
sudo systemctl reload nginx
```

Jika symlink sudah ada, jangan buat duplikat. Pastikan konfigurasi Vite memakai URL API relatif `/api`; repo dev memakai proxy Vite, sedangkan production dilayani Nginx pada origin yang sama.

## 9. Aktifkan HTTPS

Setelah DNS mengarah benar dan HTTP bisa diakses, install Certbot dari dokumentasi resmi distro/Certbot lalu jalankan plugin Nginx, misalnya:

```bash
sudo certbot --nginx -d jobtracker.example.com
sudo certbot renew --dry-run
```

Periksa sertifikat auto-renew aktif. HTTPS wajib karena autentikasi memakai cookie/token yang perlu dikirim aman.

## 10. Cek deployment

```bash
sudo systemctl status jobtracker-api
sudo nginx -t
curl -i https://jobtracker.example.com/api/health
```

Buka website, register akun, login, tambah/edit/hapus lamaran, lalu cek log API:

```bash
sudo journalctl -u jobtracker-api -f
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
```

Jangan pakai akun demo/sample untuk data nyata tanpa memahami perilaku seed/reset sample pada aplikasi.

## 11. Update versi aplikasi

Jalankan dari direktori repository. Backup DB dulu bila update membawa migration.

```bash
cd /var/www/jobtracker
git fetch origin
git checkout <BRANCH_ATAU_TAG_RELEASE>
git pull --ff-only
pnpm install --frozen-lockfile
pnpm --filter @jam/api build
pnpm --filter @jam/web build
set -a
. /etc/jobtracker-api.env
set +a
pnpm --filter @jam/api exec prisma migrate deploy
sudo systemctl restart jobtracker-api
sudo systemctl status jobtracker-api
sudo nginx -t && sudo systemctl reload nginx
```

Pakai release/tag yang sudah diuji, bukan branch development yang berubah-ubah. Migration Prisma tidak selalu bisa di-rollback otomatis; pastikan backup dan rencana pemulihan tersedia.

## Troubleshooting cepat

- **502 Bad Gateway:** API service mati, port/path salah, atau service tidak bisa membaca env. Cek `systemctl status` dan `journalctl`.
- **404 saat refresh halaman:** pastikan Nginx `try_files ... /index.html` ada.
- **Login/API gagal dari browser:** pastikan `WEB_ORIGIN` persis domain HTTPS, cookie secure/same-site sesuai konfigurasi auth, dan Nginx meneruskan header `X-Forwarded-Proto`.
- **Prisma gagal konek:** cek `DATABASE_URL`, password URL-encoded, MySQL aktif, serta grant user.
- **Assets 404:** pastikan `root` menunjuk `apps/web/dist` hasil build yang benar.
- **Port 3000 terbuka publik:** tutup di firewall; API harus hanya diakses localhost oleh Nginx.

## Checklist keamanan

- [ ] HTTPS aktif dan renewal teruji
- [ ] `DATABASE_URL` dan auth secrets disimpan di environment file mode `600`, tidak masuk Git
- [ ] MySQL hanya bind ke localhost/private network
- [ ] Port publik hanya SSH, 80, 443 (dan SSH dibatasi bila memungkinkan)
- [ ] API bind localhost/firewall membatasi port 3000
- [ ] Backup database terjadwal, terenkripsi, dan pernah diuji restore
- [ ] Runtime user minim hak; deployment user terpisah
- [ ] Versi Node, pnpm, OS, dan dependensi diperbarui berkala

---

Variabel env autentikasi dan binding API harus diverifikasi terhadap source code sebelum production. Panduan ini sengaja tidak mengarang nama secret yang tidak tercantum pada README.
