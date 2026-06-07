# NETLIFY.md — Deploy Grebeg Suro ke Netlify + Supabase

Hosting **Netlify** (HTTPS otomatis → kamera & GPS langsung jalan) + database **Supabase** (PostgreSQL gratis + storage selfie + realtime).

> Alur: **Supabase** (DB) → **GitHub** (kode) → **Netlify** (hosting, auto-deploy tiap push).

---

## Step 1 — Buat database di Supabase (gratis)

1. Daftar/login di **https://supabase.com** → **New project**.
   - Project name: `grebeg-suro` · Region: **Southeast Asia (Singapore)** · set **Database Password** (catat!).
2. Tunggu provisioning (~2 menit).
3. Ambil 2 connection string: **Project Settings → Database → Connection string → "URI"**, lalu lihat juga mode **Connection pooling**:
   - **DATABASE_URL** (pooled, port **6543**), tambahkan akhiran `?pgbouncer=true&connection_limit=1`:
     ```
     postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
     ```
   - **DIRECT_URL** (langsung, port **5432**):
     ```
     postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres
     ```
4. (Opsional, untuk simpan selfie di Storage) **Project Settings → API**: catat `Project URL`, `anon key`, `service_role key`. Lalu **Storage → New bucket** → nama `attendance-selfies` → **Public**.

---

## Step 2 — Buat tabel + data awal di database

Pilih salah satu cara:

### Cara A — paste SQL di Supabase (tanpa tooling)
1. Supabase → **SQL Editor → New query**.
2. Buka file repo **`prisma/migrations/0_init/migration.sql`**, copy seluruh isinya, paste, **Run**. (tabel dibuat)
3. Untuk akun admin awal, jalankan query ini (password = `admin123`, hash bcrypt sudah jadi):
   ```sql
   INSERT INTO "users" (id, name, username, password, role, is_active, created_at, updated_at)
   VALUES (gen_random_uuid()::text, 'Admin Festival', 'admin',
           '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4XQ1nQ3sQp1bQ8r3qL8q6m1mGfa',
           'SUPER_ADMIN', true, now(), now());

   INSERT INTO "event_settings" (id, event_name, event_lat, event_long, radius_meter, shift_start, is_active, created_at, updated_at)
   VALUES (gen_random_uuid()::text, 'Grebeg Suro & Festival Nasional Reog Ponorogo',
           -7.8650, 111.4690, 150, '08:00', true, now(), now());
   ```
   > Login awal: **`admin` / `admin123`** → segera ganti password di panel admin.

### Cara B — dari laptop pakai Prisma (data contoh lengkap)
> Hanya menjalankan perintah DB lokal (tanpa server/GPU). Buat file `.env` berisi `DATABASE_URL` & `DIRECT_URL` Supabase, lalu:
```powershell
cd C:\Users\Panji\grebeg-suro
npx prisma migrate deploy
npx prisma db seed      # divisi + akun demo (admin/admin123, relawan01/relawan123)
```

---

## Step 3 — Upload kode ke GitHub

Repo lokal sudah siap (commit lengkap). Buat repo kosong di **https://github.com/new** (mis. `grebeg-suro`, Private, **tanpa** README/.gitignore), lalu di laptop:

```powershell
cd C:\Users\Panji\grebeg-suro
git remote add origin https://github.com/USERNAME/grebeg-suro.git
git branch -M main
git push -u origin main
```
> Saat `git push` pertama, jendela login GitHub terbuka (Git Credential Manager) → login → selesai.

---

## Step 4 — Hubungkan ke Netlify

1. Login **https://app.netlify.com** → **Add new site → Import an existing project → GitHub** → pilih repo `grebeg-suro`.
2. Build settings (otomatis terdeteksi dari `netlify.toml`):
   - Build command: `npm run build` · Publish: `.next` · Plugin Next.js: otomatis.
3. **Sebelum klik Deploy**, buka **Site settings → Environment variables**, tambahkan:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | (pooled URL Supabase, :6543, `?pgbouncer=true&connection_limit=1`) |
   | `DIRECT_URL` | (direct URL Supabase, :5432) |
   | `JWT_SECRET` | string acak panjang (mis. hasil `openssl rand -base64 32`) |
   | `NEXT_PUBLIC_APP_NAME` | `Volunteer Grebeg Suro` |
   | `NEXT_PUBLIC_SUPABASE_URL` | (opsional, untuk storage/realtime) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (opsional) |
   | `SUPABASE_SERVICE_ROLE_KEY` | (opsional, untuk upload selfie) |
   | `SUPABASE_STORAGE_BUCKET` | `attendance-selfies` |

4. **Deploy site**. Tunggu build selesai → dapat URL `https://<nama>.netlify.app` (HTTPS, kamera & GPS aktif).

> Setiap `git push` ke `main` → Netlify auto-build & deploy ulang.

---

## Step 5 — Selesai & cek

1. Buka URL Netlify → landing page.
2. Login `admin` / `admin123` → **ganti password**.
3. Admin → **Pengaturan**: set titik venue & radius (tombol *Gunakan Lokasi Saya*).
4. Tambah divisi & relawan di panel admin.
5. Tes Clock In dari HP (kamera + GPS) — pastikan dalam radius.

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Build gagal `prisma generate` | Pastikan `binaryTargets` ada di `schema.prisma` (sudah disetel) |
| Login/absensi error 500 | `DATABASE_URL`/`DIRECT_URL` salah, atau tabel belum dibuat (Step 2) |
| `too many connections` / timeout | `DATABASE_URL` harus pakai **pooler :6543** + `?pgbouncer=true&connection_limit=1` |
| Migrate error pooler | Migrate harus pakai **DIRECT_URL :5432**, bukan pooler |
| Kamera/GPS mati | Pastikan akses lewat domain `https://...netlify.app` (bukan preview http) |
| Selfie tidak tersimpan | Set 3 env Supabase + bucket `attendance-selfies` Public; tanpa itu fallback base64 ke DB |

---

## Catatan
- `.env` lokal tidak ikut ter-commit (di-gitignore). Env produksi diatur di dashboard Netlify.
- Alternatif VPS (PM2/Nginx) tetap tersedia di **`DEPLOY.md`**.
