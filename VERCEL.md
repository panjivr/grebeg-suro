# Migrasi Hosting Netlify → Vercel

Panduan memindahkan hosting Grebeg Suro dari Netlify (kena limit) ke Vercel
**tanpa mengubah aplikasi, sistem absensi, maupun data yang sudah tersimpan**.

> **Poin penting:** Database ada di **Supabase**, BUKAN di Netlify. Jadi Netlify
> yang di-pause **tidak** menghapus data apa pun. Migrasi ini hanya memindahkan
> *tempat menjalankan web*; selama Vercel memakai `DATABASE_URL` Supabase yang
> sama, seluruh data (pendaftar, user, absensi) tetap utuh.

Repo sudah tersambung ke Vercel (project `grebeg-suro`) dan build-nya sudah
sukses. Tinggal 2 hal yang harus dilakukan di dashboard: **(1) environment
variables** dan **(2) custom domain**.

---

## 1. Environment Variables di Vercel

Cara paling aman & bebas salah: **salin SEMUA env var dari Netlify apa adanya.**

1. Buka **Netlify** → Site `bright-froyo-34ffe2` → **Site configuration → Environment variables**. Catat seluruh nama & nilainya.
2. Buka **Vercel** → project `grebeg-suro` → **Settings → Environment Variables**.
3. Tambahkan satu per satu untuk environment **Production** (boleh centang Preview & Development juga). Yang wajib ada:

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | String **POOLED** Supabase (port **6543**, `?pgbouncer=true&connection_limit=1`). **Harus sama** dengan yang dipakai di Netlify. |
| `DIRECT_URL` | String **LANGSUNG** Supabase (port **5432**). Wajib di-set agar migrasi schema berjalan benar. |
| `JWT_SECRET` | **Salin persis** dari Netlify. Kalau diganti, semua sesi login lama akan logout. |
| `NEXT_PUBLIC_APP_URL` | `https://grebegsuro.my.id` |

Jika di Netlify ada variabel berikut, salin juga supaya fitur tetap sama:
`SESSION_COOKIE_NAME`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` (agar foto selfie absensi
tetap tampil), `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, dan semua `FACE_*`.

4. Setelah semua env var tersimpan, **Deployments → ⋯ → Redeploy** deployment
   Production terbaru (env var baru hanya terbaca setelah redeploy).

> Build command tidak perlu disetel manual — repo sudah punya script
> `vercel-build` yang otomatis menjalankan migrasi DB lalu `next build`,
> persis seperti perilaku Netlify dulu. Migrasi bersifat *fail-soft*: kalau
> belum ada perubahan schema, ia tidak menyentuh data; kalau gagal, build tetap
> jalan dan data lama tetap aman.

---

## 2. Pindahkan Domain `grebegsuro.my.id`

### a. Tambahkan domain di Vercel
Vercel → project → **Settings → Domains → Add** → ketik `grebegsuro.my.id`
(tambahkan juga `www.grebegsuro.my.id` bila dipakai). Vercel akan menampilkan
**record DNS yang harus dipasang** — pakai nilai yang Vercel tunjukkan.

### b. Ubah DNS di DomaiNesia
Buka **DomaiNesia → My Domains → grebegsuro.my.id → DNS Management**, lalu sesuaikan
dengan yang diminta Vercel. Umumnya:

| Type | Host | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

- **Hapus / ganti** record lama yang mengarah ke Netlify.
- Selalu **ikuti nilai persis yang ditampilkan Vercel** (IP apex bisa berbeda).
- Setelah DNS menyebar (beberapa menit s.d. ~1 jam), Vercel otomatis menerbitkan
  sertifikat HTTPS. Domain akan berstatus *Valid Configuration*.

---

## 3. Checklist Verifikasi

- [ ] `grebeg-suro.vercel.app` terbuka & halaman tampil.
- [ ] **Login admin & volunteer berhasil** (membuktikan `DATABASE_URL` + `JWT_SECRET` benar).
- [ ] **Absensi / clock-in jalan** (sistem inti tidak terganggu).
- [ ] Tab **Pendaftar** di admin menampilkan data lama → **data Supabase utuh**.
- [ ] Halaman **/volunteer-grebeg-suro/daftar** bisa submit pendaftaran baru.
- [ ] `grebegsuro.my.id` mengarah ke Vercel & gembok HTTPS hijau.

---

## Catatan

- **Netlify boleh dibiarkan paused** sebagai cadangan; tidak perlu dihapus.
  File `netlify.toml` sengaja tidak diubah agar bisa kembali sewaktu-waktu.
- Vercel free (Hobby) cocok untuk situs ini. Pastikan penggunaan bersifat
  non-komersial sesuai ketentuan Hobby plan.
- Tidak ada perubahan pada kode aplikasi, schema database, maupun sistem absensi
  dalam migrasi ini — hanya pipeline build agar ramah Vercel.
