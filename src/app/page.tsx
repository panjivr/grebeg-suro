import Link from "next/link";
import {
  Users,
  LayoutGrid,
  CalendarDays,
  Megaphone,
  MapPin,
  Camera,
  ShieldCheck,
  ArrowRight,
  Instagram,
  Facebook,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const [volunteers, divisions, eo, event] = await Promise.all([
      prisma.user.count({ where: { role: "VOLUNTEER" } }),
      prisma.division.count(),
      prisma.user.count({ where: { role: "EO" } }),
      prisma.eventSetting.findFirst({ where: { isActive: true } }),
    ]);
    return { volunteers, divisions, eo, eventName: event?.eventName };
  } catch {
    return { volunteers: 0, divisions: 0, eo: 0, eventName: undefined };
  }
}

export default async function LandingPage() {
  const stats = await getStats();

  const statCards = [
    { icon: Users, label: "Total Relawan", value: stats.volunteers, suffix: "+" },
    { icon: LayoutGrid, label: "Total Divisi", value: stats.divisions, suffix: "" },
    { icon: CalendarDays, label: "Durasi Event", value: 7, suffix: " Hari" },
    { icon: Megaphone, label: "Total EO", value: stats.eo, suffix: "" },
  ];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* ===== NAVBAR ===== */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="container flex h-18 items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-gradient font-display text-lg font-bold text-primary-foreground">
              G
            </div>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold text-gold">Grebeg Suro</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Volunteer System
              </p>
            </div>
          </Link>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Masuk Absensi</Link>
          </Button>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative flex min-h-screen items-center justify-center">
        <div className="absolute inset-0">
          {/* Cinematic gradient backdrop */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, rgba(15,13,10,0.55), rgba(15,13,10,0.85), #0f0d0a), url('https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?q=80&w=2070&auto=format&fit=crop')",
            }}
          />
          <div className="absolute inset-0 bg-dark-radial" />
          <div className="absolute inset-0 batik-texture opacity-60" />
        </div>

        <div className="container relative z-10 flex flex-col items-center pt-24 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold backdrop-blur animate-fade-up">
            <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
            Festival Nasional Reog Ponorogo
          </span>

          <h1
            className="max-w-4xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            Volunteer <span className="text-gradient-gold">Grebeg Suro</span>
          </h1>

          <p
            className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            Gerakan relawan untuk menyukseskan perhelatan budaya terbesar Ponorogo.
            Satu sistem absensi modern — clock-in dengan validasi GPS &amp; verifikasi
            selfie, langsung dari smartphone Anda.
          </p>

          <div
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row animate-fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Button asChild size="lg" className="group">
              <Link href="/login">
                Masuk Absensi
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#tentang">Pelajari Selengkapnya</Link>
            </Button>
          </div>

          <div
            className="mt-16 grid w-full max-w-3xl grid-cols-3 gap-4 animate-fade-up"
            style={{ animationDelay: "0.4s" }}
          >
            {[
              { icon: MapPin, label: "Validasi GPS" },
              { icon: Camera, label: "Verifikasi Selfie" },
              { icon: ShieldCheck, label: "Real-time Monitoring" },
            ].map((f) => (
              <div key={f.label} className="glass flex flex-col items-center gap-2 rounded-2xl p-4">
                <f.icon className="h-6 w-6 text-gold" />
                <span className="text-xs text-muted-foreground sm:text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section id="tentang" className="relative py-24">
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Tentang <span className="text-gradient-gold">Gerakan Ini</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Warisan budaya yang dijaga oleh ribuan tangan relawan.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Reog Ponorogo",
                body: "Kesenian tradisional ikonik dari Ponorogo, Jawa Timur. Tarian Reog dengan topeng Dadak Merak raksasa adalah simbol keberanian dan kebanggaan budaya nasional Indonesia.",
              },
              {
                title: "Grebeg Suro",
                body: "Perayaan tahunan menyambut Tahun Baru Islam (1 Suro). Rangkaian Festival Nasional Reog, kirab pusaka, dan larungan menjadi magnet wisata budaya berskala nasional.",
              },
              {
                title: "Gerakan Relawan",
                body: "Ribuan relawan dari berbagai divisi bahu-membahu — keamanan, konsumsi, medis, dokumentasi — memastikan setiap pertunjukan berjalan lancar dan berkesan.",
              },
            ].map((c, i) => (
              <div
                key={c.title}
                className="glass-gold group rounded-2xl p-7 transition-transform hover:-translate-y-1"
              >
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gold-gradient font-display text-xl font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="mb-2 font-display text-xl font-semibold text-gold">{c.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATISTICS ===== */}
      <section className="relative py-20">
        <div className="absolute inset-0 batik-texture opacity-40" />
        <div className="container relative">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-6 text-center">
                <s.icon className="mx-auto mb-3 h-8 w-8 text-gold" />
                <div className="font-display text-4xl font-bold text-gradient-gold">
                  {s.value}
                  {s.suffix}
                </div>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative py-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/10 via-card to-background p-10 text-center sm:p-16">
            <div className="absolute inset-0 batik-texture opacity-50" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Siap Bertugas Hari Ini?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Masuk ke akun relawan Anda dan lakukan clock-in. Pastikan Anda berada di
                area venue untuk validasi lokasi.
              </p>
              <Button asChild size="lg" className="mt-8 animate-pulse-gold">
                <Link href="/login">
                  Masuk Absensi
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/10 py-12">
        <div className="container flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-gradient font-display text-lg font-bold text-primary-foreground">
              G
            </div>
            <span className="font-display text-lg font-semibold text-gold">Grebeg Suro</span>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Sistem Absensi Relawan resmi Grebeg Suro &amp; Festival Nasional Reog Ponorogo.
          </p>
          <div className="flex gap-4">
            {[Instagram, Facebook, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Panitia Grebeg Suro Ponorogo. Hak Cipta Dilindungi.
          </p>
        </div>
      </footer>
    </main>
  );
}
