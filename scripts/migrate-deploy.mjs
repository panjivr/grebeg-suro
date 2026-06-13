/**
 * Migrasi database saat build (dijalankan sebelum `next build`).
 * Dipakai oleh Netlify (netlify.toml) maupun Vercel (script "vercel-build").
 *
 * Menangani kondisi nyata:
 *  - DB di-setup manual via paste-SQL (tanpa tabel _prisma_migrations) ->
 *    `migrate deploy` gagal P3005; di-baseline-kan dulu (migrasi 0_init
 *    ditandai sudah terpasang) lalu deploy diulang.
 *  - DIRECT_URL tidak di-set di environment -> fallback ke DATABASE_URL.
 *
 * FAIL-SOFT: langkah ini TIDAK PERNAH menggagalkan build. Bila DATABASE_URL
 * tidak ada, migrasi dilewati. Bila migrasi gagal (mis. DIRECT_URL belum
 * di-set saat pindah host), build tetap lanjut dengan peringatan — schema yang
 * sudah ada di database tidak disentuh, dan migrasi bisa dijalankan manual.
 */
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.warn("⚠ DATABASE_URL tidak di-set — migrasi dilewati, build dilanjutkan.");
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
  console.log("✅ Migrasi database selesai.");
} catch {
  // Kemungkinan P3005: schema sudah berisi tabel (setup awal via paste-SQL)
  // tetapi riwayat migrasi kosong. Baseline 0_init lalu coba lagi.
  console.warn("⚠ migrate deploy gagal — mencoba baseline 0_init (P3005)…");
  try {
    run("npx prisma migrate resolve --applied 0_init");
  } catch {
    // 0_init mungkin sudah tercatat; lanjut ke percobaan deploy terakhir.
  }
  try {
    run("npx prisma migrate deploy");
    console.log("✅ Migrasi database selesai (setelah baseline).");
  } catch (e) {
    // Fail-soft: jangan menggagalkan build. Data lama tetap aman.
    console.warn(`⚠ Migrasi tidak dapat diselesaikan saat build: ${e?.message ?? e}`);
    console.warn("  Build dilanjutkan. Jika ada perubahan schema, jalankan manual:");
    console.warn("  DATABASE_URL=… DIRECT_URL=… npx prisma migrate deploy");
  }
}
