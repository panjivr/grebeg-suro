# 🦚 Volunteer Grebeg Suro — Sistem Absensi Relawan

Sistem manajemen absensi relawan modern untuk **Grebeg Suro & Festival Nasional Reog Ponorogo**. Mobile-first, cinematic dark + gold aesthetic, dibangun untuk skala nasional.

> Clock-in / Clock-out dengan **validasi GPS (geofence)** + **verifikasi selfie**, monitoring kehadiran **real-time**, dan panel admin lengkap.

---

## ✨ Fitur Utama

| Modul | Deskripsi |
|-------|-----------|
| **Landing Page** | Hero cinematic, tentang Reog & Grebeg Suro, statistik live, CTA |
| **Autentikasi** | Login username **atau** nomor telepon + password, role-based (5 peran) |
| **Dashboard Relawan** | Kartu profil, jam live, clock-in/out, riwayat kehadiran |
| **Clock In/Out** | Kamera depan → selfie → GPS → validasi radius → simpan |
| **Geofence** | Validasi Haversine: tolak absensi di luar radius venue |
| **Panel Admin** | Analitik, manajemen user & divisi, log, live monitor, pengaturan |
| **Live Monitoring** | Update real-time via Supabase Realtime (fallback polling 15s) |
| **Export** | Unduh laporan absensi **Excel** & **PDF** |
| **Notifikasi** | Telegram admin (opsional) saat clock-in/out |

### Peran (Roles)
`VOLUNTEER` · `EO` · `COORDINATOR` · `ADMIN` · `SUPER_ADMIN`
Coordinator/Admin/Super Admin memiliki akses ke panel admin.

---

## 🧱 Tech Stack

- **Next.js 15** (App Router) + **TypeScript** (strict)
- **TailwindCSS** + **shadcn/ui** (Radix primitives)
- **Prisma ORM** + **PostgreSQL**
- **Supabase** (Storage selfie + Realtime) — *opsional, ada fallback*
- **jose** (JWT session) + **bcryptjs**
- **Recharts** (grafik) · **ExcelJS** / **pdf-lib** (export)
- **Docker** + **Docker Compose** + **Nginx**

---

## 🚀 Menjalankan Secara Lokal

```bash
# 1. Install dependencies
npm install

# 2. Siapkan environment
cp .env.example .env
#   minimal: set DATABASE_URL & JWT_SECRET

# 3. Siapkan database (PostgreSQL harus berjalan)
npm run db:push      # buat tabel dari schema
npm run db:seed      # isi data contoh + akun demo

# 4. Jalankan dev server
npm run dev
# → http://localhost:3000
```

> ⚠️ **Kamera & GPS** memerlukan **secure context**. `localhost` diizinkan browser; di server gunakan **HTTPS**.

### 👤 Akun Demo (setelah seed)

| Peran | Login | Password |
|-------|-------|----------|
| Super Admin | `superadmin` | `admin123` |
| Admin | `admin` | `admin123` |
| Koordinator | `koordinator` | `koor123` |
| EO | `eo` | `eo12345` |
| Relawan | `relawan01` | `relawan123` |

---

## 🐳 Deployment ke VPS (Docker)

Domain target: **https://103-31-38-106.sslip.io**

### 1. Siapkan `.env` untuk compose
```bash
cp .env.example .env
# Wajib di-set:
#   POSTGRES_PASSWORD=...        (untuk service db)
#   JWT_SECRET=$(openssl rand -base64 32)
#   NEXT_PUBLIC_APP_URL=https://103-31-38-106.sslip.io
```

### 2. Sertifikat TLS (untuk kamera/GPS)
Letakkan sertifikat di `./certs/`:
```bash
mkdir -p certs
# Opsi A — Let's Encrypt (disarankan):
#   certbot certonly --standalone -d 103-31-38-106.sslip.io
#   cp /etc/letsencrypt/live/103-31-38-106.sslip.io/fullchain.pem certs/
#   cp /etc/letsencrypt/live/103-31-38-106.sslip.io/privkey.pem  certs/

# Opsi B — Self-signed (cepat, browser warning):
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/privkey.pem -out certs/fullchain.pem \
  -subj "/CN=103-31-38-106.sslip.io"
```

### 3. Build & jalankan
```bash
docker compose up -d --build
# db push + seed berjalan otomatis di entrypoint (RUN_SEED=true)
docker compose logs -f app
```

Aplikasi tersedia di **https://103-31-38-106.sslip.io**.
Setelah seed pertama, set `RUN_SEED=false` di `.env` agar tidak re-seed.

### Perintah berguna
```bash
docker compose exec app npx prisma studio      # GUI database
docker compose exec app npx tsx prisma/seed.ts # seed manual
docker compose restart app
docker compose down                            # stop (data tetap di volume)
```

---

## 🗄️ Skema Database

```
users         (id, name, username, phone, password, role, division_id, profile_photo, shift, is_active, created_at)
divisions     (id, division_name, description, created_at)
attendance    (id, user_id, clock_in, clock_out, clockin_photo, clockout_photo,
               clockin_lat, clockin_long, clockout_lat, clockout_long, status, work_date, created_at)
event_settings(id, event_name, event_lat, event_long, radius_meter, shift_start, is_active)
```
Lihat [`prisma/schema.prisma`](prisma/schema.prisma).

---

## 🔌 API Routes

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login (identifier + password) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | User saat ini |
| GET | `/api/attendance` | Riwayat + absensi hari ini (user) |
| POST | `/api/attendance/clock-in` | Clock-in (selfie + GPS) |
| POST | `/api/attendance/clock-out` | Clock-out (selfie + GPS) |
| GET | `/api/admin/stats` | Statistik + tren + analitik divisi |
| GET/POST | `/api/admin/users` | List / buat user |
| PATCH/DELETE | `/api/admin/users/[id]` | Update / hapus user |
| GET/POST | `/api/admin/divisions` | List / buat divisi |
| GET | `/api/admin/attendance` | Log absensi (filter tanggal/divisi/status) |
| GET/PUT | `/api/admin/event-settings` | Geofence & pengaturan event |
| GET | `/api/admin/export?format=excel\|pdf` | Export laporan |
| GET | `/api/health` | Health check (untuk Docker) |

---

## 📐 Cara Kerja Validasi Lokasi

Saat clock-in/out, browser mengirim `latitude`, `longitude`, dan selfie. Server menghitung jarak **Haversine** ke titik venue (`event_settings`). Jika `jarak > radius_meter`, absensi ditolak:

> **"Anda berada di luar area event"**

Atur titik & radius via **Admin → Pengaturan** (tombol *Gunakan Lokasi Saya* mengisi koordinat otomatis).

---

## 📁 Struktur Proyek

```
src/
├─ app/
│  ├─ page.tsx              # Landing
│  ├─ login/                # Login
│  ├─ dashboard/            # Dashboard relawan
│  ├─ admin/                # Panel admin
│  └─ api/                  # Route handlers
├─ components/
│  ├─ ui/                   # shadcn/ui
│  ├─ admin/                # Panel-panel admin
│  ├─ attendance-capture.tsx# Kamera + GPS
│  └─ volunteer-dashboard.tsx
├─ lib/                     # prisma, auth, geo, storage, supabase, utils
└─ middleware.ts            # Proteksi route
prisma/                     # schema + seed
Dockerfile · docker-compose.yml · nginx.conf
```

---

## 🔒 Catatan Keamanan
- Password di-hash dengan **bcrypt**.
- Session **JWT httpOnly cookie**, diverifikasi di middleware (edge).
- Ganti `JWT_SECRET` & password default sebelum produksi.
- Selfie disimpan di Supabase Storage bila dikonfigurasi; jika tidak, fallback base64 di DB.

---

© Panitia Grebeg Suro Ponorogo — Festival Nasional Reog Ponorogo
