#!/usr/bin/env bash
# ============================================================
#  Grebeg Suro — update kode di VPS (idempotent)
#  Pakai:  bash scripts/update.sh
# ============================================================
set -euo pipefail

APP_NAME="${APP_NAME:-grebeg-suro}"
cd "$(dirname "$0")/.."

echo "▶ git pull…"
git pull --ff-only

echo "▶ npm ci…"
unset NODE_ENV
npm ci

echo "▶ prisma migrate deploy…"
npx prisma migrate deploy

echo "▶ build…"
npm run build

echo "▶ pm2 restart $APP_NAME…"
pm2 restart "$APP_NAME"
pm2 save

sleep 3
PORT="${PORT:-3100}"
curl -fsS "http://localhost:${PORT}/api/health" >/dev/null && echo "✅ Update OK" || echo "⚠ Cek: pm2 logs $APP_NAME"
