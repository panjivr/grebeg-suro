# DEPLOY.md — Volunteer Grebeg Suro (Sistem Absensi)

Deploy ke VPS **IDCloudHost / AlmaLinux 10** — PM2 + Nginx + PostgreSQL 16 + Prisma + Next.js 15.

> Server: AlmaLinux v10.x · 2 vCPU · 4 GB RAM · 80 GB · IP `103.31.38.106`

> 🔴 **WAJIB BACA — HTTPS bukan opsional.**
> Fitur inti aplikasi (kamera selfie & GPS) **diblokir browser** kecuali di *secure context* (HTTPS atau `localhost`).
> Di atas `http://103.31.38.106` polos, **Clock In/Out tidak akan jalan**.
> Solusi: pakai domain **`103-31-38-106.sslip.io`** (otomatis mengarah ke IP-mu) lalu pasang sertifikat Let's Encrypt (Step 9). Gratis, tanpa beli domain.

> ⚠️ **BACKUP DULU** sebelum hapus data lama (Step 1).
> ⚠️ **GANTI PASSWORD VPS** — pakai password kuat 12+ karakter, idealnya SSH key.

---

## Variabel (ganti sesuai punyamu)

```bash
APP_NAME=grebeg-suro
APP_DIR=/var/www/grebeg-suro
GIT_REPO=https://github.com/USERNAME/REPO.git      # ganti
DB_NAME=grebeg
DB_USER=grebeg_user
DB_PASS=GANTI_PASSWORD_KUAT
DOMAIN=103-31-38-106.sslip.io                      # pakai sslip.io agar bisa HTTPS
PORT=3100
```

> Tip: simpan variabel ini ke shell agar bisa dipakai di perintah berikutnya:
> ```bash
> export APP_NAME APP_DIR GIT_REPO DB_NAME DB_USER DB_PASS DOMAIN PORT
> ```

---

## Step 0 — Login & install tools (sekali per VPS)

```bash
ssh root@103.31.38.106     # atau user biasa lalu sudo
```

```bash
dnf update -y
dnf install -y git nginx policycoreutils-python-utils

# Node.js 20 LTS
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs

# PostgreSQL 16
dnf install -y postgresql-server postgresql-contrib
postgresql-setup --initdb
systemctl enable --now postgresql

# PM2
npm install -g pm2

node -v && npm -v && psql --version && nginx -v
```

> **Auth PostgreSQL AlmaLinux** default `ident`. Ubah ke `scram-sha-256`/`md5` agar bisa login pakai password dari aplikasi:
> ```bash
> PGHBA=$(sudo -u postgres psql -tAc "SHOW hba_file;")
> sed -i 's/^\(host.*all.*all.*127.0.0.1\/32.*\)ident/\1scram-sha-256/' $PGHBA
> sed -i 's/^\(host.*all.*all.*::1\/128.*\)ident/\1scram-sha-256/' $PGHBA
> systemctl restart postgresql
> ```

---

## Step 1 — BACKUP DATA LAMA (jangan dilewati)

```bash
mkdir -p /root/backups
sudo -u postgres pg_dump $DB_NAME > /root/backups/${DB_NAME}_$(date +%F_%H%M).sql 2>/dev/null || echo "DB lama tidak ada / dilewati"
tar -czf /root/backups/app_old_$(date +%F_%H%M).tar.gz $APP_DIR 2>/dev/null || echo "App lama tidak ada / dilewati"
ls -lh /root/backups
```

---

## Step 2 — HAPUS DATA LAMA & BUAT DB BARU

> Hanya setelah Step 1 selesai.

```bash
pm2 delete all || true
pm2 save --force
rm -rf $APP_DIR

# Buat user + database
sudo -u postgres psql <<EOF
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

# PENTING (PostgreSQL 15+): beri hak pada schema public di DB baru,
# kalau tidak, "prisma migrate deploy" gagal: permission denied for schema public
sudo -u postgres psql -d $DB_NAME <<EOF
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER SCHEMA public OWNER TO $DB_USER;
EOF

echo "DB baru siap."
```

---

## Step 3 — Clone kode

```bash
mkdir -p /var/www
cd /var/www
git clone $GIT_REPO grebeg-suro
cd $APP_DIR
```

---

## Step 4 — Environment (.env)

Generate JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```bash
cat > $APP_DIR/.env <<EOF
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"
JWT_SECRET="TEMPEL_HASIL_GENERATE_DI_ATAS"
SESSION_COOKIE_NAME="grebeg_session"

NEXT_PUBLIC_APP_URL="https://$DOMAIN"
NEXT_PUBLIC_APP_NAME="Volunteer Grebeg Suro"

# Geofence default (dipakai saat seed). Sesuaikan titik venue.
EVENT_NAME="Grebeg Suro & Festival Nasional Reog Ponorogo"
EVENT_LAT="-7.8650"
EVENT_LONG="111.4690"
EVENT_RADIUS_METER="150"

# Opsional — Supabase Storage (kalau kosong, selfie disimpan base64 di DB)
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_STORAGE_BUCKET="attendance-selfies"

# Opsional — notifikasi Telegram admin
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
EOF

chmod 600 $APP_DIR/.env
```

> `DATABASE_URL` & `JWT_SECRET` dibaca dari `.env` ini (tidak ada yang hardcode di kode).
> Next.js memuat `.env` otomatis saat runtime. **PORT** diatur oleh PM2 (Step 6).

---

## Step 5 — Install, migrasi DB, build

```bash
cd $APP_DIR

# JANGAN set NODE_ENV=production di shell di sini — devDependencies (prisma CLI,
# tsx untuk seed) dibutuhkan saat migrate/seed/build.
npm ci

npx prisma generate
npx prisma migrate deploy      # menerapkan migrasi baseline (prisma/migrations/0_init)
npx prisma db seed             # isi divisi + akun demo (lihat tabel di bawah)

npm run build
```

> Kalau `npm run build` ke-OOM (4 GB cukup, tapi jaga-jaga), tambah swap:
> ```bash
> fallocate -l 2G /swapfile && chmod 600 /swapfile
> mkswap /swapfile && swapon /swapfile
> echo '/swapfile none swap sw 0 0' >> /etc/fstab
> ```

### Akun demo hasil seed

| Peran | Login | Password |
|-------|-------|----------|
| Super Admin | `superadmin` | `admin123` |
| Admin | `admin` | `admin123` |
| Relawan | `relawan01` | `relawan123` |

> 🔐 **Ganti password akun-akun ini segera** setelah login pertama (lewat panel admin).

---

## Step 6 — Jalankan via PM2 (pakai ecosystem.config.js)

File `ecosystem.config.js` sudah ada di repo dan mengikat **PORT=3100**.

```bash
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup        # jalankan perintah yang muncul (auto-start saat reboot)

pm2 status
pm2 logs $APP_NAME --lines 30
```

Cek internal: `curl http://localhost:$PORT/api/health` → `{"status":"ok","db":"up"}`.

---

## Step 7 — Nginx reverse proxy + SELinux

```bash
cat > /etc/nginx/conf.d/$APP_NAME.conf <<EOF
server {
    listen 80;
    server_name $DOMAIN 103.31.38.106;

    client_max_body_size 12M;       # upload selfie

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# WAJIB di AlmaLinux: izinkan Nginx connect ke port app (SELinux)
setsebool -P httpd_can_network_connect 1

nginx -t && systemctl enable --now nginx && systemctl reload nginx
```

Sementara bisa dibuka di `http://$DOMAIN` — **tapi kamera/GPS belum jalan sampai HTTPS aktif (Step 9).**

---

## Step 8 — Firewall (firewalld)

```bash
systemctl enable --now firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh
firewall-cmd --reload
firewall-cmd --list-all
```

---

## Step 9 — HTTPS (WAJIB — agar kamera & GPS berfungsi)

Karena `$DOMAIN` = `103-31-38-106.sslip.io` adalah domain valid yang menunjuk ke IP-mu, Certbot bisa menerbitkan sertifikat asli:

```bash
dnf install -y certbot python3-certbot-nginx
certbot --nginx -d $DOMAIN --redirect -m EMAIL@kamu.com --agree-tos -n
systemctl reload nginx
```

Certbot otomatis menambah block `listen 443 ssl` + redirect HTTP→HTTPS.
Buka **https://103-31-38-106.sslip.io** → kamera & GPS sekarang aktif.

> Auto-renew sudah terpasang via systemd timer. Cek: `systemctl status certbot-renew.timer`.

---

## UPDATE berikutnya (tiap ada perubahan kode)

Laptop: `git commit` → `git push`.
VPS:

```bash
cd $APP_DIR
git pull
npm ci
npx prisma migrate deploy      # aman; hanya menerapkan migrasi baru bila ada
npm run build
pm2 restart $APP_NAME
pm2 logs $APP_NAME --lines 30
```

---

## Troubleshooting

| Masalah | Cek |
|---|---|
| Kamera/GPS tidak muncul / "permission denied" | **Belum HTTPS.** Selesaikan Step 9; akses lewat `https://$DOMAIN`, bukan IP/HTTP |
| 502 Bad Gateway | `pm2 logs $APP_NAME` + `setsebool -P httpd_can_network_connect 1` |
| `permission denied for schema public` saat migrate | Step 2 bagian GRANT/ALTER SCHEMA public belum dijalankan |
| `prisma db seed` error `tsx: not found` | Jangan set `NODE_ENV=production` saat `npm ci` (devDeps ke-skip) |
| DB connection refused | `.env` DATABASE_URL, `systemctl status postgresql`, auth scram (Step 0) |
| build terbunuh (OOM) | tambah swap (Step 5) |
| Port bentrok | `ss -tlnp | grep $PORT` lalu kill prosesnya |
| App mati pasca reboot | `pm2 startup` + `pm2 save` sudah dijalankan? |
| App jalan di 3000 bukan 3100 | pakai `pm2 start ecosystem.config.js` (bukan `pm2 start npm`) |

---

## Rollback

```bash
sudo -u postgres psql $DB_NAME < /root/backups/NAMAFILE.sql
tar -xzf /root/backups/app_old_XXXX.tar.gz -C /
pm2 restart all
```
