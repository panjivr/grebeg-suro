#!/usr/bin/env bash
# ============================================================
#  Grebeg Suro — deploy fitur Face Verification (idempotent)
#
#  SATU perintah di VPS (AlmaLinux, sebagai root):
#    git pull && sudo bash scripts/setup-face-service.sh
#
#  Urutan kerja (gagal di titik mana pun = aplikasi tetap aman,
#  karena FACE_SERVICE_URL baru di-set SETELAH face service
#  terbukti sehat):
#    1. Pastikan .env app punya DIRECT_URL (syarat prisma migrate)
#    2. Update app: npm ci + prisma migrate deploy + build + pm2 restart
#    3. Pasang face service: dnf deps -> venv -> pip -> .env -> model
#    4. systemd unit (path menyesuaikan lokasi repo) + start + health check
#    5. Aktifkan FACE_SERVICE_URL di .env app + pm2 restart
#    6. Verifikasi akhir app + face service
# ============================================================
set -euo pipefail

APP_NAME="${APP_NAME:-grebeg-suro}"
cd "$(dirname "$0")/.."
APP_DIR="$(pwd)"
FACE_DIR="$APP_DIR/face-service"
HEALTH_RETRIES="${HEALTH_RETRIES:-36}"   # 36 x 5s = 3 menit (start pertama download model ±300MB)

if [ "$(id -u)" -ne 0 ]; then
  echo "✗ Jalankan sebagai root: sudo bash scripts/setup-face-service.sh" >&2
  exit 1
fi
if [ ! -f "$APP_DIR/.env" ]; then
  echo "✗ $APP_DIR/.env tidak ditemukan — jalankan setup aplikasi dulu (scripts/setup-vps.sh)." >&2
  exit 1
fi
if ! grep -qE '^DATABASE_URL=' "$APP_DIR/.env"; then
  echo "✗ DATABASE_URL tidak ada di $APP_DIR/.env" >&2
  exit 1
fi

# Peringatan dini kapasitas RAM (model buffalo_l CPU butuh ±1GB saat aktif)
TOTAL_MB=$(free -m | awk '/^Mem:/{print $2}')
if [ "${TOTAL_MB:-0}" -lt 2500 ]; then
  echo "⚠ RAM total ${TOTAL_MB}MB — face service butuh ±1GB. Pertimbangkan swap/upgrade jika OOM."
fi

# ---- 1. DIRECT_URL untuk prisma migrate (samakan dengan DATABASE_URL jika belum ada) ----
if ! grep -qE '^DIRECT_URL=' "$APP_DIR/.env"; then
  echo "▶ Menambah DIRECT_URL ke .env (salinan DATABASE_URL)…"
  grep -E '^DATABASE_URL=' "$APP_DIR/.env" | head -1 | sed 's/^DATABASE_URL=/DIRECT_URL=/' >> "$APP_DIR/.env"
fi

# ---- 2. Update aplikasi (migrasi DB ikut terpasang di sini) ----
echo "▶ Update aplikasi (npm ci + migrate + build + pm2 restart)…"
bash "$APP_DIR/scripts/update.sh"

# ---- 3. Face service: dependensi build + venv + pip ----
echo "▶ Dependensi build (gcc-c++, python3-devel)…"
dnf install -y gcc-c++ python3-devel >/dev/null

if [ ! -d "$FACE_DIR/.venv" ]; then
  echo "▶ Membuat virtualenv…"
  python3 -m venv "$FACE_DIR/.venv"
fi
echo "▶ pip install -r requirements.txt (pertama kali bisa beberapa menit)…"
"$FACE_DIR/.venv/bin/pip" install --upgrade pip -q
"$FACE_DIR/.venv/bin/pip" install -r "$FACE_DIR/requirements.txt" -q

# ---- 4. .env face service (DATABASE_URL diambil dari .env app; tidak menimpa jika sudah ada) ----
if [ ! -f "$FACE_DIR/.env" ]; then
  echo "▶ Menulis face-service/.env…"
  {
    grep -E '^DATABASE_URL=' "$APP_DIR/.env" | head -1
    grep -vE '^DATABASE_URL=' "$FACE_DIR/.env.example"
  } > "$FACE_DIR/.env"
  chmod 600 "$FACE_DIR/.env"
else
  echo "▶ face-service/.env sudah ada, dilewati."
fi

# ---- 5. Pre-download model (best-effort; kalau gagal, service mengunduh saat start) ----
echo "▶ Pre-download model buffalo_l (±300MB, sekali saja)…"
"$FACE_DIR/.venv/bin/python" - <<'PY' || echo "⚠ Pre-download gagal — service akan mencoba lagi saat start."
from insightface.app import FaceAnalysis
FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"]).prepare(ctx_id=0)
print("model siap")
PY

# ---- 6. systemd unit (path disesuaikan dgn lokasi repo) + start ----
echo "▶ Memasang systemd unit face-service…"
sed "s|/var/www/grebeg-suro|$APP_DIR|g" "$APP_DIR/deploy/face-service.service" \
  > /etc/systemd/system/face-service.service
systemctl daemon-reload
systemctl enable face-service >/dev/null 2>&1 || true
systemctl restart face-service

echo "▶ Menunggu face service sehat (maks $((HEALTH_RETRIES * 5)) detik)…"
HEALTHY=""
for i in $(seq 1 "$HEALTH_RETRIES"); do
  if curl -fsS --max-time 3 http://127.0.0.1:8001/health >/dev/null 2>&1; then
    HEALTHY="yes"; break
  fi
  sleep 5
done
if [ -z "$HEALTHY" ]; then
  echo "✗ Face service belum sehat. FACE_SERVICE_URL TIDAK diaktifkan — absensi tetap berjalan normal tanpa fitur wajah." >&2
  echo "  Diagnosa: journalctl -u face-service -n 50 --no-pager" >&2
  exit 1
fi
curl -s http://127.0.0.1:8001/health; echo

# ---- 7. Aktifkan fitur di Next.js HANYA setelah face service sehat ----
CURRENT_FACE_URL="$(sed -n 's/^FACE_SERVICE_URL=//p' "$APP_DIR/.env" | head -1 | tr -d '"')"
if [ -n "$CURRENT_FACE_URL" ]; then
  echo "▶ FACE_SERVICE_URL sudah di-set ($CURRENT_FACE_URL), dilewati."
else
  echo "▶ Mengaktifkan FACE_SERVICE_URL di .env app…"
  sed -i '/^FACE_SERVICE_URL=/d' "$APP_DIR/.env"
  {
    echo 'FACE_SERVICE_URL="http://127.0.0.1:8001"'
    grep -qE '^FACE_SERVICE_TIMEOUT_MS=' "$APP_DIR/.env" || echo 'FACE_SERVICE_TIMEOUT_MS="5000"'
    grep -qE '^FACE_ENRICH_MIN_DET_SCORE=' "$APP_DIR/.env" || echo 'FACE_ENRICH_MIN_DET_SCORE="0.6"'
    grep -qE '^FACE_GALLERY_MAX_EMBEDDINGS=' "$APP_DIR/.env" || echo 'FACE_GALLERY_MAX_EMBEDDINGS="30"'
  } >> "$APP_DIR/.env"
  pm2 restart "$APP_NAME"
  pm2 save
fi

# ---- 8. Verifikasi akhir ----
sleep 3
PORT="${PORT:-3100}"
APP_OK=""; curl -fsS "http://localhost:${PORT}/api/health" >/dev/null 2>&1 && APP_OK="yes"
FACE_OK=""; curl -fsS http://127.0.0.1:8001/health >/dev/null 2>&1 && FACE_OK="yes"
echo ""
echo "============================================================"
[ -n "$APP_OK" ]  && echo " ✅ Aplikasi sehat   : http://localhost:${PORT}/api/health" \
                  || echo " ⚠ Aplikasi belum merespons — cek: pm2 logs $APP_NAME"
[ -n "$FACE_OK" ] && echo " ✅ Face service sehat: http://127.0.0.1:8001/health (localhost-only)" \
                  || echo " ⚠ Face service belum merespons — cek: journalctl -u face-service -f"
echo ""
echo " Langkah berikutnya (isi galeri wajah awal):"
echo "   1. Upload foto: $APP_DIR/clustered/<NamaVolunteer>/*.jpg"
echo "   2. Cek mapping : npx tsx scripts/seed-embeddings.ts --dir ./clustered --dry-run"
echo "   3. Seed        : npx tsx scripts/seed-embeddings.ts --dir ./clustered"
echo " Panel review admin: https://grebegsuro.my.id/admin/face-review"
echo " Dokumentasi lengkap: face-service/README.md"
echo "============================================================"
[ -n "$APP_OK" ] && [ -n "$FACE_OK" ]
