#!/usr/bin/env bash
# ============================================================
#  Grebeg Suro — one-shot VPS setup (AlmaLinux 10)
#  IDEMPOTENT & NON-DESTRUCTIVE: hanya mengelola app & DB-nya
#  sendiri. TIDAK menyentuh PM2 app lain, TIDAK drop DB lain.
#
#  Pakai:
#    sudo bash scripts/setup-vps.sh
#  Jalankan dari dalam direktori repo yang sudah di-clone.
# ============================================================
set -euo pipefail

# ---- Konfigurasi (boleh di-override via environment) ----
APP_NAME="${APP_NAME:-grebeg-suro}"
APP_DIR="${APP_DIR:-$(pwd)}"
DB_NAME="${DB_NAME:-grebeg}"
DB_USER="${DB_USER:-grebeg_user}"
DB_PASS="${DB_PASS:?Set DB_PASS dulu, mis: DB_PASS=xxxx sudo -E bash scripts/setup-vps.sh}"
DOMAIN="${DOMAIN:-absensi.103-31-38-106.sslip.io}"
PORT="${PORT:-3100}"
JWT_SECRET="${JWT_SECRET:-$(node -e 'console.log(require("crypto").randomBytes(48).toString("hex"))')}"
RUN_SEED="${RUN_SEED:-true}"

echo "▶ App: $APP_NAME @ $APP_DIR  | DB: $DB_NAME  | Port: $PORT  | Domain: $DOMAIN"

# ---- 1. Database (buat HANYA jika belum ada — tidak drop apa pun) ----
echo "▶ Menyiapkan PostgreSQL (non-destruktif)…"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
SQL
# CREATE DATABASE tidak bisa di dalam DO block; cek manual:
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
fi
sudo -u postgres psql -v ON_ERROR_STOP=1 -d "${DB_NAME}" <<SQL
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER SCHEMA public OWNER TO ${DB_USER};
SQL

# ---- 2. .env (hanya tulis jika belum ada) ----
if [ ! -f "$APP_DIR/.env" ]; then
  echo "▶ Menulis .env…"
  cat > "$APP_DIR/.env" <<ENV
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"
JWT_SECRET="${JWT_SECRET}"
SESSION_COOKIE_NAME="grebeg_session"
NEXT_PUBLIC_APP_URL="https://${DOMAIN}"
NEXT_PUBLIC_APP_NAME="Volunteer Grebeg Suro"
EVENT_NAME="Grebeg Suro & Festival Nasional Reog Ponorogo"
EVENT_LAT="-7.8650"
EVENT_LONG="111.4690"
EVENT_RADIUS_METER="150"
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_STORAGE_BUCKET="attendance-selfies"
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
ENV
  chmod 600 "$APP_DIR/.env"
else
  echo "▶ .env sudah ada, dilewati."
fi

# ---- 3. Install deps, migrasi, build (devDeps dibutuhkan utk prisma/tsx) ----
echo "▶ npm ci + prisma + build…"
cd "$APP_DIR"
unset NODE_ENV
npm ci
npx prisma generate
npx prisma migrate deploy
if [ "$RUN_SEED" = "true" ]; then
  npx prisma db seed || echo "⚠ seed dilewati/gagal (lanjut)"
fi
npm run build

# ---- 4. PM2 (hanya app ini) ----
echo "▶ PM2 start $APP_NAME (port $PORT)…"
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
echo "  → jalankan 'pm2 startup' sekali (ikuti instruksinya) agar auto-start saat reboot."

# ---- 5. Health check ----
sleep 3
if curl -fsS "http://localhost:${PORT}/api/health" >/dev/null; then
  echo "✅ App sehat di http://localhost:${PORT}"
else
  echo "⚠ Health check belum lolos — cek: pm2 logs $APP_NAME"
fi

echo ""
echo "============================================================"
echo " Berikutnya (manual, karena menyangkut port 80/443 bersama):"
echo "  1. Pasang vhost Nginx → proxy ke http://127.0.0.1:${PORT}"
echo "  2. setsebool -P httpd_can_network_connect 1"
echo "  3. certbot --nginx -d ${DOMAIN}   (WAJIB: kamera/GPS perlu HTTPS)"
echo " Lihat DEPLOY.md Step 7 & 9. Pastikan tidak bentrok dgn Nginx lain."
echo "============================================================"
