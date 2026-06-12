import type { Metadata } from "next";
import Link from "next/link";
import { Instagram } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SiteHeader } from "@/components/site-header";
import { RegistrationForm } from "@/components/registration-form";
import { REGISTRATION_EVENT } from "@/lib/registration-data";

const SITE = "https://grebegsuro.my.id";

export const metadata: Metadata = {
  title: "Daftar Volunteer Grebeg Suro 2027",
  description:
    "Formulir pendaftaran Volunteer Grebeg Suro 2027 — Festival Nasional Reog Ponorogo. Pilih divisi (stage management, security, media, LO, medis, dll.), isi data diri & kompetensi, dan kirim pendaftaranmu.",
  alternates: { canonical: "/volunteer-grebeg-suro/daftar" },
  openGraph: {
    type: "website",
    url: `${SITE}/volunteer-grebeg-suro/daftar`,
    title: "Daftar Volunteer Grebeg Suro 2027",
    description:
      "Jadilah bagian dari penggerak Festival Nasional Reog Ponorogo. Pendaftaran Volunteer Grebeg Suro 2027 dibuka.",
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "Volunteer Grebeg Suro" }],
  },
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
    {
      "@type": "ListItem",
      position: 3,
      name: "Daftar Volunteer",
      item: `${SITE}/volunteer-grebeg-suro/daftar`,
    },
  ],
};

export default function DaftarVolunteerPage() {
  return (
    <main id="main" className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />

      <section className="relative overflow-hidden pt-28 pb-10">
        <div className="absolute inset-0 bg-hero-mesh" />
        <div className="container relative max-w-2xl text-center">
          <nav aria-label="Breadcrumb" className="mb-6 flex justify-center">
            <ol className="flex items-center gap-2 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-brand">Beranda</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/volunteer-grebeg-suro" className="transition-colors hover:text-brand">
                  Volunteer
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-brand" aria-current="page">Daftar</li>
            </ol>
          </nav>
          <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3.5 py-1 text-xs font-semibold text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Pendaftaran Dibuka · {REGISTRATION_EVENT.openedAt}
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
            {REGISTRATION_EVENT.title}
          </h1>
          <p className="mt-3 text-sm text-body sm:text-base">{REGISTRATION_EVENT.subtitle}</p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container max-w-2xl">
          <RegistrationForm />
        </div>
      </section>

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </main>
  );
}
