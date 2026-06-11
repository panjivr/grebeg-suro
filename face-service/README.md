# Face Verification Service — Grebeg Suro

Service Python (FastAPI) untuk verifikasi wajah saat absensi. Model **InsightFace `buffalo_l`** (pre-trained, CPU) — model **tidak pernah di-train ulang**; sistem "belajar" lewat **gallery enrichment**: setiap check-in terverifikasi menambah embedding baru ke galeri volunteer, sehingga matching makin tahan terhadap variasi mimik, pencahayaan, sudut, dan perubahan wajah.

> 🔒 **Privasi:** embedding = data biometrik. Service ini **hanya boleh listen di `127.0.0.1`** dan dipanggil server-side oleh Next.js. Jangan pernah membuka port 8001 di firewall/Nginx.

> 🛡 **Graceful degradation:** absensi **tidak pernah gagal** karena AI. Service mati/timeout/tidak terpasang → check-in tetap sukses dengan `MANUAL_FALLBACK` dan masuk antrian review admin. Jika `FACE_SERVICE_URL` tidak di-set di `.env` Next.js, fitur nonaktif total.

## Arsitektur

```
Browser ──selfie──▶ Next.js (/api/attendance/clock-in)
                       │ 1. simpan foto (Supabase/base64)         [existing]
                       │ 2. POST http://127.0.0.1:8001/verify     [timeout 5s]
                       │ 3. simpan Attendance + verifyMethod/similarity
                       │ 4. FACE_AUTO & det_score ≥ 0.6 → simpan embedding CHECKIN
                       ▼
                Face Service (FastAPI, port 8001, localhost-only)
                       │ baca galeri dari tabel face_embeddings (cache + /reload)
                       ▼
                  PostgreSQL
```

**Keputusan 3-tier** (cosine similarity **max** terhadap galeri volunteer, bukan mean):

| Similarity | Decision | Efek |
|---|---|---|
| ≥ `FACE_THRESHOLD_AUTO` (0.50) | `FACE_AUTO` | Absen sukses + badge "✓ Wajah terverifikasi" |
| 0.35 – 0.50 | `FACE_LOW_CONF` | Absen **tetap sukses**, masuk review admin |
| < `FACE_THRESHOLD_REVIEW` (0.35), wajah tak terdeteksi, atau service down | `MANUAL_FALLBACK` | Absen **tetap sukses**, masuk review admin |

Tambahan: jika top-1 **global** (semua volunteer) milik orang LAIN dengan similarity ≥ `FACE_THRESHOLD_MISMATCH` → flag **POSSIBLE_MISMATCH** (indikasi titip absen) untuk review admin.

**Self-learning (enrichment):** hanya check-in `FACE_AUTO` + `det_score ≥ 0.6` + tanpa flag mismatch yang otomatis masuk galeri (`CHECKIN`). Rolling window **maks 30 embedding/volunteer** — saat penuh, `CHECKIN` tertua dihapus, `SEED` tidak pernah dihapus. Embedding dari `FACE_LOW_CONF`/`MANUAL_FALLBACK` hanya masuk galeri jika **admin approve** di `/admin/face-review` (centang "tambahkan ke galeri") — mencegah galeri keracunan wajah orang lain. Volunteer tanpa galeri sama sekali memulai lewat seed atau approve admin.

## Endpoint (internal, localhost)

| Endpoint | Fungsi |
|---|---|
| `GET /health` | Status model + jumlah galeri |
| `POST /embed` | `{image: base64}` atau multipart `file` → embedding 512-dim + `detScore` + `bbox`. Error 422 jelas jika 0 wajah (`NO_FACE`) atau >1 wajah dominan (`MULTIPLE_FACES`). Dipakai seed script & approve admin. |
| `POST /verify` | `{image, volunteerId}` → `{decision, similarity, matchedVolunteerId, possibleMismatch, embedding, …}`. Wajah tak terdeteksi = HTTP 200 dengan `decision: MANUAL_FALLBACK` (bukan error). |
| `POST /reload` | Paksa muat ulang galeri (dipanggil Next.js setelah menulis embedding; ada juga TTL 60s) |

## Deploy di VPS (AlmaLinux, systemd)

### Cara cepat (satu perintah, idempoten)

```bash
cd /var/www/grebeg-suro
git pull && sudo bash scripts/setup-face-service.sh
```

Script ini meng-update aplikasi (migrasi DB ikut terpasang), memasang face service + systemd, lalu **mengaktifkan `FACE_SERVICE_URL` hanya setelah face service terbukti sehat** — gagal di titik mana pun, absensi tetap berjalan normal tanpa fitur wajah. Aman dijalankan berulang.

### Cara manual (langkah per langkah)

```bash
cd /var/www/grebeg-suro/face-service

# 1. Dependensi build (sekali saja — insightface compile ekstensi Cython)
dnf install -y gcc-c++ python3-devel

# 2. Virtualenv + install
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt

# 3. Konfigurasi
cp .env.example .env
nano .env            # isi DATABASE_URL (boleh sama dengan .env Next.js)

# 4. (Opsional) pre-download model ±300MB agar start pertama cepat
.venv/bin/python -c "from insightface.app import FaceAnalysis; FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider']).prepare(ctx_id=0)"

# 5. systemd
cp /var/www/grebeg-suro/deploy/face-service.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now face-service

# 6. Verifikasi
curl http://127.0.0.1:8001/health
journalctl -u face-service -f
```

Lalu aktifkan di Next.js: set `FACE_SERVICE_URL="http://127.0.0.1:8001"` di `/var/www/grebeg-suro/.env`, jalankan `npx prisma migrate deploy`, restart app (`pm2 restart grebeg-suro`).

> Model di-download otomatis saat start pertama ke `~/.insightface/models/buffalo_l` (atau `FACE_MODEL_ROOT` jika di-set). Tanpa internet: salin folder model secara manual.

## Seed galeri dari foto hasil clustering

Struktur folder: `clustered/<NamaVolunteer>/foto1.jpg …` (nama folder = nama volunteer; di-fuzzy-match ke kolom `name`/`username`).

```bash
cd /var/www/grebeg-suro

# 1. Cek dulu mapping folder -> volunteer (tanpa menulis apa pun)
npx tsx scripts/seed-embeddings.ts --dir ./clustered --dry-run

# 2. Jalankan seed (interaktif: folder ambigu dikonfirmasi manual)
npx tsx scripts/seed-embeddings.ts --dir ./clustered

# 3. Folder yang tetap ambigu -> mapping eksplisit
echo '{ "Folder Ambigu": "username_volunteer" }' > map.json
npx tsx scripts/seed-embeddings.ts --dir ./clustered --map map.json
```

Per orang disimpan **maks 15 foto terbaik** berdasarkan `det_score` (`--max` untuk mengubah). Re-run aman/idempoten: SEED lama diganti (pakai `--append` untuk menambah). Foto dengan 0/`>1` wajah dominan dilewati dengan peringatan. Setelah selesai script memanggil `/reload`.

> Foto seed adalah data biometrik — folder `clustered/` sudah masuk `.gitignore`, jangan di-commit.

## Tuning threshold dari data lapangan

Setiap verify tercatat di tabel `face_verify_logs` (`volunteer_id`, `similarity`, `decision`, `reason`, `latency_ms`) dan di journald. Setelah beberapa hari data terkumpul:

```sql
-- Distribusi similarity per decision (apakah pemisahan bersih?)
SELECT decision, COUNT(*),
       ROUND(AVG(similarity)::numeric, 3)            AS avg_sim,
       ROUND(MIN(similarity)::numeric, 3)            AS min_sim,
       ROUND(MAX(similarity)::numeric, 3)            AS max_sim,
       ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY similarity)::numeric, 3) AS median
FROM face_verify_logs
WHERE similarity IS NOT NULL
GROUP BY decision;

-- Kandidat false-reject: orang yang sering jatuh di zona abu-abu
SELECT volunteer_id, COUNT(*) AS n, ROUND(AVG(similarity)::numeric, 3) AS avg_sim
FROM face_verify_logs
WHERE decision = 'FACE_LOW_CONF'
GROUP BY volunteer_id ORDER BY n DESC LIMIT 20;
```

Panduan praktis:
- Banyak `FACE_LOW_CONF` yang ternyata orang benar (admin selalu approve) → turunkan `FACE_THRESHOLD_AUTO` (mis. 0.45).
- Ada `FACE_AUTO` orang salah (jarang, tapi periksa `POSSIBLE_MISMATCH`) → naikkan `FACE_THRESHOLD_AUTO` dan/atau turunkan `FACE_THRESHOLD_MISMATCH`.
- Banyak `LOW_SIMILARITY` padahal orang benar → galeri kurang kaya: perbanyak seed / approve "tambahkan ke galeri" di panel review.

Ubah nilai di `face-service/.env` lalu `systemctl restart face-service` — tidak perlu deploy ulang apa pun. Pantau kualitas galeri per volunteer di **Admin → Verifikasi Wajah → Statistik Galeri**.

## Troubleshooting

| Gejala | Penanganan |
|---|---|
| `/health` → `galleryError` | Cek `DATABASE_URL` di `face-service/.env`; tabel `face_embeddings` ada setelah `prisma migrate deploy` |
| Semua check-in `MANUAL_FALLBACK (TIMEOUT)` | CPU kepenuhan / model belum siap — cek `journalctl -u face-service`; naikkan `FACE_SERVICE_TIMEOUT_MS` di `.env` Next.js |
| `NO_GALLERY` terus untuk volunteer tertentu | Volunteer belum di-seed — jalankan seed atau approve check-in-nya dengan "tambahkan ke galeri" |
| Install `insightface` gagal | `dnf install -y gcc-c++ python3-devel` lalu ulangi pip install |
