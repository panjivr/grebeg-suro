#!/usr/bin/env bash
# ============================================================
#  Grebeg Suro — AUTO-FIX HTTPS subdomain (AlmaLinux 10)
#  Idempotent & AMAN: deteksi pemegang :443 dulu.
#   - nginx host / 443 kosong  -> pasang vhost + certbot otomatis
#   - 443 dipegang Docker      -> BERHENTI tanpa menyentuh apa pun
#
#  Pakai (di VPS, dari dalam repo):
#    EMAIL=kamu@mail.com sudo -E bash scripts/fix-https.sh
# ============================================================
set -euo pipefail

DOMAIN="${DOMAIN:-absensi.103-31-38-106.sslip.io}"
APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
PORT="${PORT:-3100}"
EMAIL="${EMAIL:?Set EMAIL dulu, mis: EMAIL=kamu@mail.com sudo -E bash scripts/fix-https.sh}"

echo "▶ Domain: $DOMAIN | App: $APP_DIR | Port: $PORT"

# ---- 0. App harus hidup dulu ----
if ! curl -fsS "http://localhost:${PORT}/api/health" >/dev/null 2>&1; then
  echo "✋ App belum sehat di localhost:${PORT}. Jalankan dulu scripts/setup-vps.sh."
  echo "   Cek: pm2 status ; pm2 logs grebeg-suro"
  exit 1
fi
echo "✓ App sehat di localhost:${PORT}"

# ---- 1. Siapa pemegang :443? ----
OWNER="$(ss -tlnp 2>/dev/null | awk '$4 ~ /:443$/' | head -1 || true)"
echo "▶ Pemegang :443 -> ${OWNER:-(kosong)}"

if echo "$OWNER" | grep -qiE 'docker|containerd|compose'; then
  echo ""
  echo "🛑 Port 443 dipegang DOCKER (kemungkinan sistem arbitrage)."
  echo "   Skrip BERHENTI tanpa mengubah apa pun (supaya arbitrage aman)."
  echo "   Ikuti DEPLOY.md Step 6 'Kasus B': tambahkan server block subdomain"
  echo "   ke nginx Docker tsb (proxy ke http://$(hostname -I | awk '{print $1}'):${PORT})"
  echo "   dan terbitkan cert lewat stack TLS Docker itu."
  echo ""
  echo "   Info untuk dev:"; docker ps 2>/dev/null || true
  exit 2
fi

# ---- 2. Kasus A: nginx host / 443 kosong ----
echo "▶ Mode: nginx host. Pasang vhost + certbot…"
command -v nginx   >/dev/null || dnf install -y nginx
command -v certbot >/dev/null || dnf install -y certbot python3-certbot-nginx

cp "$APP_DIR/deploy/nginx-grebeg.conf" /etc/nginx/conf.d/grebeg-suro.conf
setsebool -P httpd_can_network_connect 1 2>/dev/null || true
systemctl enable --now nginx
nginx -t && systemctl reload nginx

# firewall (abaikan kalau firewalld tidak aktif)
firewall-cmd --permanent --add-service=http  2>/dev/null || true
firewall-cmd --permanent --add-service=https 2>/dev/null || true
firewall-cmd --reload 2>/dev/null || true

# ---- 3. Terbitkan cert + redirect ----
echo "▶ certbot --nginx -d ${DOMAIN} --redirect…"
certbot --nginx -d "$DOMAIN" --redirect --agree-tos -m "$EMAIL" -n

nginx -t && systemctl reload nginx

# ---- 4. Verifikasi ----
sleep 2
echo "▶ Verifikasi:"
if curl -fsS -I "https://${DOMAIN}" >/dev/null 2>&1; then
  echo "✅ HTTPS OK — buka https://${DOMAIN}  (kamera & GPS aktif)"
else
  echo "⚠ Belum lolos. Cek: certbot certificates ; sudo nginx -t ; curl -I https://${DOMAIN}"
fi
