/**
 * Migrasi database saat build Netlify (dijalankan sebelum `next build`).
 *
 * Menangani dua kondisi nyata:
 *  - DB di-setup manual via paste-SQL (tanpa tabel _prisma_migrations) ->
 *    `migrate deploy` gagal P3005; di-baseline-kan dulu (migrasi 0_init
 *    ditandai sudah terpasang) lalu deploy diulang.
 *  - DIRECT_URL tidak di-set di environment Netlify -> fallback ke
 *    DATABASE_URL agar migrasi tetap bisa berjalan.
 *
 * Tanpa DATABASE_URL sama sekali (mis. build preview tanpa env), langkah ini
 * dilewati dengan peringatan — build tetap lanjut, schema diurus terpisah.
 */
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.warn("⚠ DATABASE_URL tidak di-set — migrasi dilewati.");
  process.exit(0);
}
if (!process.env.DIRECT_URL) {
  console.warn("⚠ DIRECT_URL tidak di-set — memakai DATABASE_URL untuk migrasi.");
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

function run(cmd) {
  console.log(`▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

try {
  run("npx prisma migrate deploy");
} catch {
  // Kemungkinan P3005: schema sudah berisi tabel (setup awal via paste-SQL)
  // tetapi riwayat migrasi kosong. Baseline 0_init lalu coba lagi.
  console.warn("⚠ migrate deploy gagal — mencoba baseline 0_init (P3005)…");
  try {
    run("npx prisma migrate resolve --applied 0_init");
  } catch {
    // 0_init mungkin sudah tercatat; lanjut ke percobaan deploy terakhir.
  }
  run("npx prisma migrate deploy");
}
console.log("✅ Migrasi database selesai.");
