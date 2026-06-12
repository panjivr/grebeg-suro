import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  HeartHandshake,
  GraduationCap,
  Sparkles,
  Users,
  Rocket,
  Quote,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { SiteHeader } from "@/components/site-header";

const SITE = "https://grebegsuro.my.id";

export const metadata: Metadata = {
  title: "Volunteer Grebeg Suro — Sejarah & Cara Bergabung",
  description:
    "Mengenal Volunteer Grebeg Suro: gerakan relawan pemuda Ponorogo penggerak di balik Festival Nasional Reog Ponorogo — dari keresahan 2016, lahirnya identitas 2022, divisi, hingga cara bergabung.",
  alternates: { canonical: "/volunteer-grebeg-suro" },
  openGraph: {
    type: "article",
    url: `${SITE}/volunteer-grebeg-suro`,
    title: "Volunteer Grebeg Suro — Penggerak di Balik Festival Nasional Reog Ponorogo",
    description:
      "Sejarah Volunteer Grebeg Suro: dari gerakan sukarela pemuda pecinta Reog hingga sistem terstruktur, divisi, dan cara bergabung.",
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "Volunteer Grebeg Suro" }],
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Volunteer Grebeg Suro — Penggerak di Balik Festival Nasional Reog Ponorogo",
  image: [`${SITE}/brand/og.png`],
  author: { "@type": "Organization", name: "Volunteer Grebeg Suro", url: SITE },
  publisher: {
    "@type": "Organization",
    name: "Volunteer Grebeg Suro",
    logo: { "@type": "ImageObject", url: `${SITE}/brand/logo.png` },
  },
  datePublished: "2026-06-01",
  dateModified: "2026-06-09",
  mainEntityOfPage: `${SITE}/volunteer-grebeg-suro`,
  description:
    "Sejarah Volunteer Grebeg Suro: dari keresahan pemuda pecinta Reog (2016) hingga gerakan terstruktur (2022), divisi, dan cara bergabung.",
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Beranda", item: SITE },
    {
      "@type": "ListItem",
      position: 2,
      name: "Volunteer Grebeg Suro",
      item: `${SITE}/volunteer-grebeg-suro`,
    },
  ],
};

const sections = [
  {
    icon: Flame,
    year: "2016",
    title: "Awal dari Keresahan",
    body: "Volunteer Grebeg Suro lahir bukan dari sistem besar atau organisasi formal, melainkan dari keresahan sederhana beberapa pemuda pecinta Reog Ponorogo sekitar 2016. Saat itu Festival Nasional Reog Ponorogo sudah menjadi kebanggaan: ribuan penonton, puluhan kontingen, suasana budaya yang luar biasa. Namun di balik megahnya panggung, banyak hal di lapangan belum terorganisir — perpindahan kontingen belum tertata, koordinasi performer dan panitia terbatas, akses keluar-masuk area tampil belum teratur, dan komunikasi teknis kerap membuat ritme festival kurang maksimal. Dari sini muncul kesadaran: festival sebesar ini butuh lebih banyak tangan yang benar-benar peduli pada budayanya sendiri.",
  },
  {
    icon: HeartHandshake,
    title: "Bergerak Tanpa Imbalan",
    body: "Semua lahir tanpa bayaran, tanpa kontrak kerja, tanpa kepentingan pribadi — dengan satu tujuan: menjaga Reog tetap hidup dan berjalan lebih baik. Para pemuda dari berbagai kontingen bergerak sukarela: mengatur jalannya kontingen, mengarahkan performer, menjaga ritme perpindahan tampil, hingga membantu kebutuhan teknis di area festival. Mereka dikenal sebagai Pemandu Kontingen Reog atau Pemandu Reog. Peran sederhana itu perlahan terasa penting: mereka menjadi penghubung antara panggung, performer, panitia, dan jalannya festival di lapangan.",
  },
  {
    icon: GraduationCap,
    title: "Dari Gerakan ke Ruang Belajar",
    body: "Gerakan ini berkembang menjadi ruang belajar bagi anak muda Ponorogo untuk memahami event organizer, koordinasi lapangan, manajemen acara, komunikasi publik, dan kerja tim dalam event besar. Dinas dan penyelenggara festival pun memberi ruang serta dukungan agar gerakan kepemudaan ini terus tumbuh.",
  },
  {
    icon: Sparkles,
    year: "2022",
    title: "Lahirnya Identitas Baru",
    body: "Sekitar 2022 lahir identitas Volunteer Grebeg Suro — simbol berkembangnya sistem sederhana menjadi lebih modern, terstruktur, dan profesional, dengan divisi dan sistem kerja yang lebih jelas.",
  },
];

const divisi = [
  "Backstage Management",
  "Runner",
  "Liaison Officer",
  "Media & Publikasi",
  "Hospitality",
  "Crowd Control",
  "Logistic",
  "Stage Support",
  "Dokumentasi",
];

export default function VolunteerPage() {
  return (
    <main id="main" className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-12">
        <div className="absolute inset-0 bg-hero-mesh" />
        <div className="absolute inset-0 grid-texture opacity-40" />
        <div className="container relative max-w-3xl py-12 text-center">
          <nav aria-label="Breadcrumb" className="mb-6 flex justify-center">
            <ol className="flex items-center gap-2 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-brand">Beranda</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-brand" aria-current="page">Volunteer Grebeg Suro</li>
            </ol>
          </nav>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
            <Users className="h-3.5 w-3.5" /> Gerakan Pemuda Ponorogo
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
            Volunteer <span className="text-gradient-brand">Grebeg Suro</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
            Penggerak di balik Festival Nasional Reog Ponorogo — gerakan relawan yang
            bekerja tanpa imbalan untuk menjaga budaya Ponorogo tetap hidup dan berjalan
            lebih baik.
          </p>
          <p className="mt-5 text-xs text-muted-foreground">
            Ditulis oleh <span className="font-medium text-body">Tim Volunteer Grebeg Suro</span>{" "}
            · Diperbarui <time dateTime="2026-06-09">9 Juni 2026</time>
          </p>
        </div>
      </section>

      {/* Article */}
      <article className="pb-8">
        <div className="container max-w-3xl space-y-10">
          {sections.map((s) => (
            <section key={s.title}>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-soft">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  {s.year && (
                    <span className="text-xs font-bold uppercase tracking-wider text-brand">
                      {s.year}
                    </span>
                  )}
                  <h2 className="font-display text-2xl font-bold text-ink">{s.title}</h2>
                </div>
              </div>
              <p className="mt-4 leading-relaxed text-body">{s.body}</p>
            </section>
          ))}

          {/* Divisi */}
          <section>
            <h2 className="font-display text-2xl font-bold text-ink">Divisi &amp; Sistem Kerja</h2>
            <p className="mt-3 leading-relaxed text-body">
              Kini Volunteer Grebeg Suro bekerja dalam divisi yang terstruktur, masing-masing
              dengan peran spesifik untuk memastikan festival berjalan rapi:
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {divisi.map((d) => (
                <div
                  key={d}
                  className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-ink shadow-soft"
                >
                  {d}
                </div>
              ))}
            </div>
          </section>

          {/* Semangat */}
          <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-soft">
            <Quote className="absolute right-6 top-6 h-12 w-12 text-brand/10" />
            <h2 className="font-display text-2xl font-bold text-ink">Semangat yang Tak Berubah</h2>
            <p className="mt-4 leading-relaxed text-body">
              Satu hal tak pernah berubah: kesadaran penuh pemuda Ponorogo untuk menjaga
              budaya daerahnya. Volunteer Grebeg Suro bukan sekadar relawan acara — mereka
              wajah semangat generasi muda yang bergerak tanpa menunggu imbalan, belajar
              tanpa batas, dan bekerja bersama menjaga nama besar Festival Nasional Reog
              Ponorogo agar terus hidup dan dikenal lebih luas, di Indonesia maupun dunia.
            </p>
          </section>

          {/* Penggerak kota */}
          <section>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-soft">
                <Rocket className="h-5 w-5" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink">Menumbuhkan Penggerak Kota</h2>
            </div>
            <p className="mt-4 leading-relaxed text-body">
              Lebih dari itu, Volunteer Grebeg Suro menjadi tempat lahirnya generasi muda
              yang paham bagaimana event besar dibangun: kepemimpinan, komunikasi,
              manajemen massa, media publikasi, teknis panggung, hospitality, hingga kerja
              tim solid di bawah tekanan. Banyak yang awalnya datang sebagai volunteer kini
              tumbuh menjadi penggerak event di Ponorogo — komunitas kreatif, tim media, EO
              lokal, production team, dan penggerak kegiatan budaya, hiburan, olahraga,
              serta sosial. Dari panggung Reog mereka belajar tanggung jawab; dari kerja
              sukarela, loyalitas; dari budaya, kebersamaan.
            </p>
          </section>

          {/* Hari ini */}
          <section>
            <h2 className="font-display text-2xl font-bold text-ink">Hari Ini</h2>
            <p className="mt-4 leading-relaxed text-body">
              Volunteer Grebeg Suro bukan hanya bagian dari festival tahunan, tetapi bagian
              dari gerakan anak muda Ponorogo untuk menjaga budaya tetap hidup,
              mengembangkan event daerah, dan membangun ekosistem kreatif yang nyata bagi
              generasi berikutnya.
            </p>
          </section>

          {/* CTA */}
          <section className="overflow-hidden rounded-3xl bg-brand-gradient p-10 text-center text-white shadow-card">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Ingin Bergabung?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              Pendaftaran Volunteer Grebeg Suro 2027 telah dibuka! Isi formulir pendaftaran,
              pilih divisimu, dan jadilah bagian dari penggerak Festival Nasional Reog
              Ponorogo. Volunteer terdaftar dapat masuk ke sistem absensi di bawah ini.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="group">
                <Link href="/volunteer-grebeg-suro/daftar">
                  Daftar Volunteer 2027
                  <ArrowRight className="transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/login">Masuk Absensi Volunteer</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <a href="https://www.instagram.com/volunteer.grebegsuro.png" target="_blank" rel="noreferrer">
                  Ikuti Kanal Resmi
                </a>
              </Button>
            </div>
          </section>

          <p className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline">
              <ArrowLeft className="h-4 w-4" /> Kembali ke beranda Grebeg Suro
            </Link>
          </p>
        </div>
      </article>

      {/* Footer */}
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </main>
  );
}
