#!/bin/sh
set -e

echo "▶ Applying database migrations (prisma migrate deploy)…"
npx prisma migrate deploy || echo "⚠ prisma migrate deploy failed (will retry on next boot)"

if [ "$RUN_SEED" = "true" ]; then
  echo "▶ Seeding database…"
  npx tsx prisma/seed.ts || echo "⚠ seed skipped/failed"
fi

echo "▶ Starting Next.js server…"
exec "$@"
