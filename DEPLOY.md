# DEPLOY.md — Volunteer Grebeg Suro (Sistem Absensi)

Deploy ke VPS **IDCloudHost / AlmaLinux 10** — **berdampingan** dengan sistem yang sudah ada (mis. Ultra AI Arbitrage di Docker). Pendekatan ini **NON-DESTRUKTIF**: tidak menghapus app/DB lain, pakai **subdomain & port sendiri**.

> Server: AlmaLinux 10 · IP `103.31.38.106`
> App ini: domain **`absensi.103-31-38-106.sslip.io`** · port internal **3100** · DB `grebeg`

> 🔴 **HTTPS WAJIB.** Kamera selfie & GPS diblokir browser kecuali di HTTPS (atau localhost). Tanpa HTTPS, Clock In/Out mati. Subdomain sslip.io + Certbot (Step 6) menyelesaikan ini.

> ✅ **Aman untuk sistem lain.** Skrip `setup-vps.sh` TIDAK menjalankan `pm2 delete all`, TIDAK `DROP DATABASE`, dan hanya mengelola app `grebeg-suro`. Database & PM2 app lain tidak disentuh.

---

## Ringkasan alur (4 langkah)

1. **Laptop** → kirim arsip kode ke VPS (SCP).
2. **VPS** → ekstrak, jalankan `scripts/setup-vps.sh` (install, DB, migrate, seed, build, PM2).
3. **VPS** → pasang vhost Nginx subdomain.
4. **VPS** → `certbot` untuk HTTPS. Selesai.

---

## Step 0 — (Laptop) Kirim kode ke VPS via SCP

Arsip `grebeg-suro-deploy.zip` sudah dibuat (tanpa `node_modules`, `.next`, `.git`, `.env`).

```powershell
# Dari laptop (PowerShell), upload ke VPS:
scp C:\Users\Panji\grebeg-suro\grebeg-suro-deploy.zip root@103.31.38.106:/var/www/
```

Lalu SSH ke VPS:
```bash
ssh root@103.31.38.106
cd /var/www
dnf install -y unzip
mkdir -p grebeg-suro && unzip -o grebeg-suro-deploy.zip -d grebeg-suro
cd grebeg-suro
```

---

## Step 1 — (VPS) Install tools (lewati yang sudah ada)

```bash
dnf update -y
dnf install -y git nginx curl policycoreutils-python-utils

# Node.js 20 LTS (jika belum ada)
command -v node || { curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - && dnf install -y nodejs; }

# PostgreSQL 16 di HOST (terpisah dari Postgres Docker sistem lain, jika ada)
command -v psql || {
  dnf install -y postgresql-server postgresql-contrib
  postgresql-setup --initdb
  systemctl enable --now postgresql
}

# PM2
command -v pm2 || npm install -g pm2

node -v && npm -v && psql --version && nginx -v
```

> **Auth PostgreSQL** (sekali): ubah `ident` → `scram-sha-256` agar app bisa login pakai password.
> ```bash
> PGHBA=$(sudo -u postgres psql -tAc "SHOW hba_file;")
> sed -i 's/^\(host.*all.*all.*127.0.0.1\/32.*\)ident/\1scram-sha-256/' $PGHBA
> sed -i 's/^\(host.*all.*all.*::1\/128.*\)ident/\1scram-sha-256/' $PGHBA
> systemctl restart postgresql
> ```

---

## Step 2 — (VPS) Setup otomatis (1 perintah)

Skrip ini idempotent & non-destruktif: buat DB `grebeg` (kalau belum ada), tulis `.env`, `npm ci`, `prisma migrate deploy`, seed, `npm run build`, lalu start PM2 di port 3100.

```bash
cd /var/www/grebeg-suro

# Ganti DB_PASS dengan password kuat. JWT_SECRET di-generate otomatis bila tak diisi.
DB_PASS='GANTI_PASSWORD_KUAT_DB' \
DOMAIN='absensi.103-31-38-106.sslip.io' \
sudo -E bash scripts/setup-vps.sh
```

Output akhir: `✅ App sehat di http://localhost:3100`.
Cek manual: `curl http://localhost:3100/api/health` → `{"status":"ok","db":"up"}`.

Lalu daftarkan PM2 agar auto-start saat reboot:
```bash
pm2 startup     # jalankan baris perintah yang dicetaknya
pm2 save
```

> Kalau `npm run build` ke-OOM, tambah swap lalu ulangi:
> ```bash
> fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
> echo '/swapfile none swap sw 0 0' >> /etc/fstab
> ```

### Akun demo hasil seed
| Peran | Login | Password |
|-------|-------|----------|
| Super Admin | `superadmin` | `admin123` |
| Admin | `admin` | `admin123` |
| Relawan | `relawan01` | `relawan123` |
> 🔐 Ganti password ini setelah login pertama.

---

## Step 3 — (VPS) Nginx vhost subdomain

**Cek dulu siapa pemegang port 80/443:**
```bash
ss -tlnp | grep -E ':80|:443'
```

### Kasus A — Nginx native (host) yang pegang 80/443 (atau 80/443 kosong)
```bash
cp /var/www/grebeg-suro/deploy/nginx-grebeg.conf /etc/nginx/conf.d/grebeg-suro.conf
setsebool -P httpd_can_network_connect 1        # WAJIB di AlmaLinux (SELinux)
nginx -t && systemctl enable --now nginx && systemctl reload nginx
```

### Kasus B — Port 80/443 dipegang Nginx **di Docker** (sistem arbitrage)
Nginx native tidak bisa ikut bind 80/443. Tambahkan **server block** berikut ke konfigurasi Nginx Docker tsb (lalu reload container itu), proxy ke host:
```nginx
server {
    listen 80;
    server_name absensi.103-31-38-106.sslip.io;
    client_max_body_size 12M;
    location / {
        proxy_pass http://103.31.38.106:3100;   # IP host VPS
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
> Pastikan firewall mengizinkan kontainer mengakses host:3100, atau bind app ke `0.0.0.0` (default Next sudah begitu).

---

## Step 4 — (VPS) Firewall

```bash
systemctl enable --now firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh
firewall-cmd --reload
```

---

## Step 5 — (VPS) Cek HTTP

Buka `http://absensi.103-31-38-106.sslip.io` → landing page muncul.
(Kamera/GPS belum jalan sampai HTTPS di Step 6.)

---

## Step 6 — (VPS) HTTPS (WAJIB, agar kamera & GPS hidup)

> **Cek dulu siapa pemegang 443** untuk menentukan Kasus A atau B:
> ```bash
> sudo ss -tlnp | grep ':443'
> ```
> Kalau prosesnya `nginx` → **Kasus A**. Kalau `docker-proxy`/`containerd` → **Kasus B**.

### Kasus A (Nginx native pegang 443)
```bash
# 1) vhost subdomain (listen 80) HARUS terpasang dulu — lihat Step 3 Kasus A
ls /etc/nginx/conf.d/grebeg-suro.conf || \
  sudo cp /var/www/grebeg-suro/deploy/nginx-grebeg.conf /etc/nginx/conf.d/grebeg-suro.conf
sudo nginx -t && sudo systemctl reload nginx

# 2) terbitkan cert untuk SUBDOMAIN PERSIS (pakai email asli)
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d absensi.103-31-38-106.sslip.io --redirect --agree-tos -m EMAIL_ASLI@kamu.com -n

# 3) verifikasi
sudo nginx -t && sudo systemctl reload nginx
curl -I https://absensi.103-31-38-106.sslip.io
```
Certbot otomatis menambah blok `listen 443 ssl` (cert di `/etc/letsencrypt/live/absensi.103-31-38-106.sslip.io/`) + redirect 80→443.

> **`NET::ERR_CERT_COMMON_NAME_INVALID`?** Itu artinya 443 sedang menyajikan cert untuk domain ROOT (`103-31-38-106.sslip.io`), bukan subdomain. Penyebab: cert subdomain belum terbit / vhost subdomain belum ada saat certbot jalan. Pastikan langkah 1 dilakukan SEBELUM certbot, lalu jalankan ulang `certbot --nginx -d absensi.103-31-38-106.sslip.io --redirect`. Sertifikat baru akan cocok dengan nama subdomain.

### Kasus B (Nginx 443 di Docker / sistem arbitrage)
`certbot --nginx` di host **tidak berpengaruh** (yang menyajikan 443 adalah container). Terbitkan cert subdomain pada stack TLS Docker tsb (Certbot/Caddy/Traefik), arahkan ke server block subdomain yang proxy ke `http://103.31.38.106:3100`. Kirim `sudo docker ps` + lokasi config nginx container ke tim dev bila perlu bantuan.

Buka **https://absensi.103-31-38-106.sslip.io** → kamera & GPS aktif. ✅

---

## UPDATE berikutnya (ada perubahan kode)

Laptop: buat arsip baru (lihat bagian "Membuat arsip" di bawah) → SCP ulang → di VPS:
```bash
cd /var/www/grebeg-suro
unzip -o /var/www/grebeg-suro-deploy.zip -d .
bash scripts/update.sh        # npm ci + migrate deploy + build + pm2 restart
```
> Kalau nanti pakai GitHub, `scripts/update.sh` juga otomatis `git pull` bila repo punya remote.

### Membuat arsip dari laptop (PowerShell)
```powershell
cd C:\Users\Panji\grebeg-suro
Compress-Archive -Path * -DestinationPath grebeg-suro-deploy.zip -Force `
  -CompressionLevel Optimal
# (folder node_modules/.next/.git tidak ikut karena belum ada/di-exclude saat dibuat)
```

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Kamera/GPS tidak muncul / "permission denied" | Belum HTTPS — selesaikan Step 6, akses lewat `https://`, bukan IP/HTTP |
| `NET::ERR_CERT_COMMON_NAME_INVALID` | Cert 443 untuk domain root, bukan subdomain. Pasang vhost subdomain dulu lalu `certbot --nginx -d absensi.103-31-38-106.sslip.io --redirect` (Step 6 Kasus A). Bila 443 di Docker → Kasus B |
| Error HSTS tak bisa "proceed" di Chrome | HSTS diwarisi dari domain root (sistem lain), bukan dari app ini. Hilang sendiri begitu cert subdomain valid terpasang |
| 502 Bad Gateway | `pm2 logs grebeg-suro` + `setsebool -P httpd_can_network_connect 1` |
| `permission denied for schema public` saat migrate | Skrip sudah `GRANT/ALTER SCHEMA public`; cek user DB benar di `.env` |
| `tsx: not found` saat seed | Jangan set `NODE_ENV=production` sebelum `npm ci` (skrip sudah `unset NODE_ENV`) |
| DB connection refused | `.env` DATABASE_URL, `systemctl status postgresql`, auth scram (Step 1) |
| Port 3100 bentrok | `ss -tlnp | grep 3100`; ganti `PORT` di `ecosystem.config.js` + vhost + `.env` |
| App jalan di 3000 bukan 3100 | pakai `pm2 start ecosystem.config.js` (skrip sudah benar) |
| Nginx 80/443 sudah dipakai Docker | pakai **Kasus B** (Step 3 & 6) |

---

## Catatan keamanan
- `DATABASE_URL` & `JWT_SECRET` hanya dari `.env` (chmod 600), tidak hardcode.
- Password akun demo WAJIB diganti setelah login pertama.
- `JWT_SECRET` di-generate acak 48 byte oleh skrip bila tidak disuplai.
