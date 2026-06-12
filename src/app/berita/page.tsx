import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { ArrowLeft, ExternalLink, Instagram } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SiteHeader } from "@/components/site-header";
import { NewsImage } from "@/components/news-image";
import { NEWS_SORTED, byCategory, type NewsArticle } from "@/lib/news-data";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const SITE = "https://grebegsuro.my.id";

export const metadata: Metadata = {
  title: "Berita Grebeg Suro 2026 & Volunteer Grebeg Suro",
  description:
    "Kabar Grebeg Suro — kurasi berita Grebeg Suro Ponorogo 2026 dan Volunteer Grebeg Suro dari berbagai kanal media nasional & lokal: pembukaan, Festival Nasional Reog Ponorogo, Kirab Pusaka, Larungan Telaga Ngebel, hingga pelantikan volunteer.",
  alternates: { canonical: "/berita" },
  openGraph: {
    type: "website",
    url: `${SITE}/berita`,
    title: "Kabar Grebeg Suro — Berita Grebeg Suro Ponorogo 2026",
    description:
      "Kurasi berita Grebeg Suro 2026 & Volunteer Grebeg Suro dari ANTARA, detik, Kompas, Tribun, Jawa Pos, TIMES Indonesia, dan media lokal Ponorogo.",
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "Kabar Grebeg Suro" }],
  },
};

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Kabar Grebeg Suro — Berita Grebeg Suro Ponorogo 2026",
  url: `${SITE}/berita`,
  inLanguage: "id-ID",
  isPartOf: { "@id": `${SITE}/#website` },
  about: ["Grebeg Suro 2026", "Volunteer Grebeg Suro", "Festival Nasional Reog Ponorogo"],
  mainEntity: {
    "@type": "ItemList",
    itemListElement: NEWS_SORTED.slice(0, 10).map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: a.url,
      name: a.title,
    })),
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Beranda", item: SITE },
    { "@type": "ListItem", position: 2, name: "Berita", item: `${SITE}/berita` },
  ],
};

/* ===== Elemen editorial bergaya broadsheet ===== */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">
      {children}
    </span>
  );
}

function SourceLine({ a }: { a: NewsArticle }) {
  return (
    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="font-semibold uppercase tracking-wide">{a.source}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={a.dateISO}>{a.displayDate}</time>
      <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden="true" />
    </p>
  );
}

function SectionRule({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8 border-b-2 border-ink/70 pb-2">
      <h2 className="font-serif text-xl font-bold uppercase tracking-[0.12em] text-ink sm:text-2xl">
        {children}
      </h2>
    </div>
  );
}

/** Kartu berita dengan foto — tautan menuju artikel asli di kanal penerbit. */
function StoryCard({ a, large }: { a: NewsArticle; large?: boolean }) {
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
      title={`Baca di ${a.source}`}
    >
      <div className="overflow-hidden border border-border bg-soft/40">
        <NewsImage
          articleId={a.id}
          alt={a.title}
          className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-4">
        <Kicker>{a.category}</Kicker>
        <h3
          className={`mt-2 font-serif font-bold leading-snug text-ink transition-colors group-hover:text-amber-300 ${
            large ? "text-2xl sm:text-3xl" : "text-lg"
          }`}
        >
          {a.title}
        </h3>
        <p
          className={`mt-2.5 text-sm leading-relaxed text-body ${
            large ? "line-clamp-4 sm:text-base" : "line-clamp-3"
          }`}
        >
          {a.excerpt}
        </p>
        <SourceLine a={a} />
      </div>
    </a>
  );
}

/** Berita ringkas tanpa foto — gaya "briefs" surat kabar. */
function BriefItem({ a }: { a: NewsArticle }) {
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block py-5 first:pt-0 last:pb-0"
      title={`Baca di ${a.source}`}
    >
      <Kicker>{a.category}</Kicker>
      <h3 className="mt-1.5 font-serif text-base font-bold leading-snug text-ink transition-colors group-hover:text-amber-300">
        {a.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-body">{a.excerpt}</p>
      <SourceLine a={a} />
    </a>
  );
}

export default function BeritaPage() {
  const lead = NEWS_SORTED.find((a) => a.id === "antara-resmi-dibuka")!;
  const rail = NEWS_SORTED.filter((a) =>
    ["detik-wapres", "surya-wisman-serbu", "radar-1100-bregada"].includes(a.id)
  );

  const volunteer = byCategory("Volunteer");
  const volunteerLead = volunteer.find((a) => a.featured) ?? volunteer[0];
  const volunteerCards = volunteer.filter((a) => a.id !== volunteerLead.id).slice(0, 3);
  const volunteerBriefs = volunteer
    .filter((a) => a.id !== volunteerLead.id)
    .slice(3);

  const usedAbove = new Set([
    lead.id,
    ...rail.map((a) => a.id),
    ...volunteer.map((a) => a.id),
  ]);
  const festival = NEWS_SORTED.filter(
    (a) =>
      !usedAbove.has(a.id) &&
      (a.category === "Festival & Reog" || a.category === "Tradisi" || a.category === "Pariwisata")
  );
  const festivalCards = festival.slice(0, 6);
  const festivalBriefs = festival.slice(6);

  const ekonomi = byCategory("Ekonomi Kreatif").filter((a) => !usedAbove.has(a.id));
  const persiapan = byCategory("Persiapan");

  const updated = NEWS_SORTED[0];

  return (
    <main
      id="main"
      className={`${playfair.variable} relative min-h-screen overflow-x-hidden bg-background text-foreground`}
    >
      <SiteHeader />

      {/* ===== Masthead ===== */}
      <header className="relative overflow-hidden pt-28">
        <div className="absolute inset-0 bg-hero-mesh" />
        <div className="container relative max-w-6xl pb-8 pt-10 text-center">
          <nav aria-label="Breadcrumb" className="mb-6 flex justify-center">
            <ol className="flex items-center gap-2 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-brand">
                  Beranda
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-brand" aria-current="page">
                Berita
              </li>
            </ol>
          </nav>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Liputan Media Nasional &amp; Lokal
          </p>
          <h1 className="mt-3 font-serif text-5xl font-black tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Kabar <span className="italic text-amber-400">Grebeg Suro</span>
          </h1>
          <div className="mx-auto mt-6 max-w-4xl border-y border-ink/30 py-2.5">
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-medium uppercase tracking-[0.2em] text-body">
              <span>Edisi Grebeg Suro 2026</span>
              <span aria-hidden="true" className="text-amber-400">
                ❖
              </span>
              <span>Ponorogo, Jawa Timur</span>
              <span aria-hidden="true" className="text-amber-400">
                ❖
              </span>
              <span>
                Diperbarui <time dateTime={updated.dateISO}>{updated.displayDate}</time>
              </span>
            </p>
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Kurasi pemberitaan Grebeg Suro 2026 &amp; Volunteer Grebeg Suro dari berbagai kanal —
            ANTARA, detikJatim, Kompas, Tribun, Jawa Pos, TIMES Indonesia, hingga media lokal
            Ponorogo. Setiap kartu menaut ke artikel asli beserta fotonya; hak cipta konten dan
            foto sepenuhnya milik masing-masing penerbit.
          </p>
        </div>
      </header>

      {/* ===== Lead package ===== */}
      <section className="py-10" aria-label="Berita utama">
        <div className="container max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-border">
            <div className="lg:col-span-2 lg:pr-10">
              <StoryCard a={lead} large />
            </div>
            <div className="lg:pl-10">
              <p className="border-b border-ink/40 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ink">
                Sorotan Lainnya
              </p>
              <div className="divide-y divide-border">
                {rail.map((a) => (
                  <BriefItem key={a.id} a={a} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Volunteer Grebeg Suro ===== */}
      <section className="border-t border-border bg-soft/40 py-14" aria-label="Berita Volunteer Grebeg Suro">
        <div className="container max-w-6xl">
          <SectionRule>Volunteer Grebeg Suro</SectionRule>
          <div className="grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-border">
            <div className="lg:col-span-2 lg:pr-10">
              <StoryCard a={volunteerLead} large />
              <div className="mt-10 grid gap-8 border-t border-border pt-8 sm:grid-cols-3">
                {volunteerCards.map((a) => (
                  <StoryCard key={a.id} a={a} />
                ))}
              </div>
            </div>
            <div className="lg:pl-10">
              <p className="border-b border-ink/40 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ink">
                Kabar Relawan
              </p>
              <div className="divide-y divide-border">
                {volunteerBriefs.map((a) => (
                  <BriefItem key={a.id} a={a} />
                ))}
              </div>
              <div className="mt-8 border border-amber-400/30 bg-amber-400/5 p-5">
                <p className="font-serif text-lg font-bold italic text-ink">
                  Penggerak di balik festival
                </p>
                <p className="mt-2 text-sm leading-relaxed text-body">
                  Kenali sejarah dan divisi Volunteer Grebeg Suro — gerakan pemuda Ponorogo yang
                  bekerja tanpa imbalan menjaga Reog tetap hidup.
                </p>
                <Link
                  href="/volunteer-grebeg-suro"
                  className="mt-3 inline-flex text-sm font-semibold text-amber-400 hover:underline"
                >
                  Baca profil volunteer →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Festival, Tradisi & Pariwisata ===== */}
      <section className="py-14" aria-label="Berita festival, tradisi, dan pariwisata">
        <div className="container max-w-6xl">
          <SectionRule>Festival, Tradisi &amp; Pariwisata</SectionRule>
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {festivalCards.map((a) => (
              <StoryCard key={a.id} a={a} />
            ))}
          </div>
          {festivalBriefs.length > 0 && (
            <div className="mt-12 grid gap-x-10 border-t border-border pt-2 sm:grid-cols-2 lg:grid-cols-2 lg:divide-x lg:divide-border [&>*:nth-child(even)]:lg:pl-10 [&>*:nth-child(odd)]:lg:pr-10">
              {festivalBriefs.map((a) => (
                <div key={a.id} className="border-b border-border last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
                  <BriefItem a={a} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== Ekonomi Kreatif ===== */}
      <section className="border-t border-border bg-soft/40 py-14" aria-label="Berita ekonomi kreatif">
        <div className="container max-w-6xl">
          <SectionRule>Ekonomi Kreatif &amp; Dampak Daerah</SectionRule>
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {ekonomi.map((a) => (
              <StoryCard key={a.id} a={a} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Lini masa persiapan ===== */}
      <section className="py-14" aria-label="Lini masa persiapan Grebeg Suro 2026">
        <div className="container max-w-6xl">
          <SectionRule>Lini Masa Persiapan — April s.d. Juni 2026</SectionRule>
          <div className="grid gap-x-10 lg:grid-cols-2 lg:divide-x lg:divide-border [&>*:nth-child(even)]:lg:pl-10 [&>*:nth-child(odd)]:lg:pr-10">
            {[...persiapan].reverse().map((a) => (
              <div key={a.id} className="border-b border-border">
                <BriefItem a={a} />
              </div>
            ))}
          </div>
          <p className="mt-10 border-t-2 border-ink/70 pt-4 text-center text-xs leading-relaxed text-muted-foreground">
            Halaman ini merupakan kurasi tautan berita untuk dokumentasi &amp; publikasi Grebeg
            Suro 2026. Judul, ringkasan, dan foto merujuk pada artikel asli; seluruh hak cipta
            konten dan foto adalah milik penerbit masing-masing. Temukan kekeliruan atau ingin
            menambahkan berita? Hubungi tim melalui kanal resmi Volunteer Grebeg Suro.
          </p>
          <p className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke beranda Grebeg Suro
            </Link>
          </p>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-border bg-soft/60 py-12">
        <div className="container flex flex-col items-center gap-4 text-center">
          <BrandLogo size={48} />
          <a
            href="https://www.instagram.com/volunteer.grebegsuro.png"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram Volunteer Grebeg Suro"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
          >
            <Instagram className="h-5 w-5" />
          </a>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Volunteer Grebeg Suro. Hak Cipta Dilindungi.
          </p>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </main>
  );
}
