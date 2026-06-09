# SEO + GEO Audit — Grebeg Suro Ponorogo

**Stack terdeteksi:** Next.js 15 (App Router) + TypeScript + Tailwind CSS. Deploy via Netlify (`@netlify/plugin-nextjs`) dari branch `main`. Metadata dikelola via Metadata API global (`src/app/layout.tsx`) + per-halaman (`page.tsx`, `login/page.tsx`, `volunteer-grebeg-suro/page.tsx`).

**Route publik:** `/`, `/volunteer-grebeg-suro`, `/login`.
**Route privat (di-disallow):** `/admin`, `/dashboard`, `/api/*`.

**Prinsip audit:** ADDITIVE ONLY. Tidak ada perubahan pada framework, routing, dependency, atau logika aplikasi. Sistem absensi, API (`src/app/api/**`), Prisma, `src/lib/*`, `middleware.ts`, dan `attendance-capture.tsx` TIDAK disentuh.

---

## A. SEO Teknis

| Item | Before | After |
|---|---|---|
| `<title>` unik & deskriptif per halaman | OK | OK |
| `<meta name="description">` per halaman | OK | OK |
| 1 `<h1>` per halaman + hierarki H2/H3 | OK | OK |
| Canonical URL | OK | OK |
| `robots.txt` | OK | OK (+ aturan AI crawler eksplisit) |
| `sitemap.xml` terdaftar di robots | OK | OK |
| Open Graph + Twitter Card (+ og:image) | OK | OK |
| `lang` attribute pada `<html>` | OK (`id`) | OK |
| Internal linking + anchor deskriptif | OK | OK (navbar → /volunteer-grebeg-suro, teaser, FAQ) |
| Mobile responsive + viewport meta | OK | OK |
| Core Web Vitals (lazy/dimensi/preconnect) | KURANG | OK (lihat catatan) |

**Catatan CWV:** font dimuat via `next/font` (self-host saat build, tanpa request Google Fonts runtime → preconnect tidak diperlukan). Ditambahkan `decoding="async"` pada komponen logo & `width`/`height` + `decoding="async"` pada gambar medali hero untuk mengurangi CLS.

## B. Gambar / Aset (.webp & .png di `public/brand/`)

| Item | Before | After |
|---|---|---|
| `alt` deskriptif (bukan nama file) | OK | OK |
| `decoding="async"` untuk gambar | KURANG | OK |
| Dimensi eksplisit gambar besar (anti-CLS) | KURANG | OK (medali hero) |
| Nama file SEO-friendly | OK | OK (`logo.png`, `logo-mark.png`, `medallion.webp`, `icon*.png`, `og.png`) |

## C. GEO (Generative Engine Optimization)

| Item | Before | After |
|---|---|---|
| JSON-LD `Organization` | OK | OK (via `@graph`) |
| JSON-LD `WebSite` | HILANG | **OK (ditambah)** |
| JSON-LD `BreadcrumbList` | HILANG | **OK (ditambah di /volunteer-grebeg-suro)** |
| JSON-LD `Event` | OK | OK |
| JSON-LD `FAQPage` | OK | OK |
| JSON-LD `Article` | OK | OK (halaman Volunteer) |
| Blok FAQ Tanya-Jawab | OK | OK (6 Q&A, answer-first) |
| Konten answer-first + faktual | OK | OK |
| Heading natural ("Apa itu...") | OK | OK (FAQ) |
| E-E-A-T (author, tanggal, sumber) | OK | OK (Article author + datePublished/Modified; sumber di footer landing) |
| Entity clarity (brand konsisten) | OK | OK ("Grebeg Suro Ponorogo" / "Volunteer Grebeg Suro") |
| `llms.txt` di root | HILANG | **OK (ditambah)** |
| AI crawler tidak diblokir (GPTBot, PerplexityBot, Google-Extended, dll.) | OK (default allow) | OK (allow eksplisit) |

---

## Daftar file yang diubah (ronde SEO/GEO ini)

| File | Perubahan | Alasan |
|---|---|---|
| `src/app/layout.tsx` | JSON-LD jadi `@graph` Organization + **WebSite** | Entity & site-level structured data untuk SEO/GEO |
| `src/app/robots.ts` | Aturan allow eksplisit untuk AI crawler | Pastikan mesin generatif boleh mengindeks halaman publik |
| `src/app/volunteer-grebeg-suro/page.tsx` | Tambah **BreadcrumbList** JSON-LD | Navigasi terstruktur untuk hasil pencarian |
| `src/components/brand-logo.tsx` | `decoding="async"` | Core Web Vitals |
| `src/app/page.tsx` | `width`/`height` + `decoding="async"` pada gambar medali | Anti-CLS / CWV |
| `public/llms.txt` | File baru | Ringkasan situs untuk AI crawler (GEO) |
| `SEO-GEO-AUDIT.md` | File baru | Laporan audit ini |

## Item yang sengaja di-SKIP (berisiko / di luar lingkup)

- **`src/app/api/**`, `prisma/**`, `src/lib/*`, `middleware.ts`, `attendance-capture.tsx`, `netlify.toml`, `next.config.ts`** — file kritikal sistem/absensi. Tidak disentuh sesuai aturan.
- **Rename file aset** — tidak dilakukan karena dipakai banyak referensi; cukup pastikan `alt` deskriptif.
- **Halaman About/Contact terpisah** — tidak dibuat agar tetap additive; sinyal E-E-A-T sudah terpenuhi via author/tanggal pada Article, sumber tepercaya di footer, dan kanal resmi (Instagram) di CTA.

## Status build & deploy

- `npm run lint` → 0 warning/error.
- `npx tsc --noEmit` → OK.
- `npm run build` → sukses.
- Deploy: otomatis via Netlify saat merge ke `main`.
