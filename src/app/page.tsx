import Link from "next/link";
import {
  ArrowRight,
  Award,
  CalendarDays,
  Crown,
  Drama,
  Drum,
  Feather,
  Flag,
  Flame,
  Globe2,
  HeartHandshake,
  History,
  Landmark,
  MapPin,
  Music2,
  Quote,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Trophy,
  Users,
  Waves,
  Zap,
  HelpCircle,
  ChevronDown,
  PlayCircle,
  Ticket,
  Megaphone,
  Shirt,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { SiteHeader } from "@/components/site-header";
import { NAV } from "@/components/nav-links";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const [volunteers, divisions, eo] = await Promise.all([
      prisma.user.count({ where: { role: "VOLUNTEER" } }),
      prisma.division.count(),
      prisma.user.count({ where: { role: "EO" } }),
    ]);
    return { volunteers, divisions, eo };
  } catch {
    return { volunteers: 0, divisions: 0, eo: 0 };
  }
}

const FAQ: { q: string; a: string; href?: string }[] = [
  {
    q: "Apa itu Grebeg Suro?",
    a: "Grebeg Suro adalah perayaan budaya tahunan masyarakat Ponorogo untuk menyambut Tahun Baru Islam 1 Muharram (1 Suro), dimeriahkan Festival Nasional Reog Ponorogo serta Larungan Risalah Doa di Telaga Ngebel.",
  },
  {
    q: "Kapan Grebeg Suro 2026 digelar?",
    a: "Rangkaian Grebeg Suro 2026 berlangsung sepanjang Juni–Juli 2026, dengan puncak pada 1 Suro / 1 Muharram melalui Larungan Risalah Doa di Telaga Ngebel.",
  },
  {
    q: "Di mana lokasi Festival Nasional Reog Ponorogo?",
    a: "Panggung utama Festival Nasional Reog Ponorogo (FNRP) berada di Alun-alun Ponorogo, Jawa Timur.",
  },
  {
    q: "Apa itu Volunteer Grebeg Suro dan bagaimana cara bergabung?",
    a: "Volunteer Grebeg Suro adalah gerakan relawan pemuda Ponorogo yang menjadi penggerak di balik Festival Nasional Reog Ponorogo. Pelajari sejarah dan cara bergabungnya di halaman Volunteer Grebeg Suro.",
    href: "/volunteer-grebeg-suro",
  },
  {
    q: "Apakah Reog Ponorogo diakui UNESCO?",
    a: "Ya. Reog Ponorogo ditetapkan sebagai Warisan Budaya Takbenda UNESCO pada 3 Desember 2024.",
  },
  {
    q: "Apa saja rangkaian acara Grebeg Suro?",
    a: "Pawai Lintas Sejarah & Kirab Pusaka, Festival Reog Remaja (FRR), Festival Nasional Reog Ponorogo (FNRP), dan Larungan Risalah Doa di Telaga Ngebel.",
  },
];

const SITE = "https://grebegsuro.my.id";

const venueAlun = {
  "@type": "Place",
  name: "Alun-alun Ponorogo",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ponorogo",
    addressRegion: "Jawa Timur",
    addressCountry: "ID",
  },
  geo: { "@type": "GeoCoordinates", latitude: -7.865, longitude: 111.469 },
};

const venueNgebel = {
  "@type": ["Place", "TouristAttraction"],
  name: "Telaga Ngebel",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ngebel, Ponorogo",
    addressRegion: "Jawa Timur",
    addressCountry: "ID",
  },
  geo: { "@type": "GeoCoordinates", latitude: -7.8175, longitude: 111.676 },
};

const eventJsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  "@id": `${SITE}/#event-2026`,
  name: "Grebeg Suro & Festival Nasional Reog Ponorogo 2026",
  description:
    "Pesta rakyat tahunan Ponorogo menyambut 1 Suro, dimeriahkan Festival Nasional Reog Ponorogo (FNRP) ke-XXXI dan Larungan Risalah Doa di Telaga Ngebel.",
  startDate: "2026-06-06",
  endDate: "2026-06-26",
  inLanguage: "id-ID",
  url: SITE,
  keywords:
    "Grebeg Suro, Festival Nasional Reog Ponorogo, FNRP 2026, Reog Ponorogo, Telaga Ngebel",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  image: [`${SITE}/brand/og.png`],
  location: venueAlun,
  organizer: { "@type": "Organization", name: "Volunteer Grebeg Suro", url: SITE },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
    availability: "https://schema.org/InStock",
    url: SITE,
    validFrom: "2026-01-01",
  },
  subEvent: [
    {
      "@type": "Event",
      name: "Pembukaan Grebeg Suro, FRR XXII & FNRP XXXI",
      startDate: "2026-06-06",
      eventStatus: "https://schema.org/EventScheduled",
      location: venueAlun,
    },
    {
      "@type": "Event",
      name: "Festival Reog Remaja (FRR) XXII",
      startDate: "2026-06-07",
      endDate: "2026-06-10",
      eventStatus: "https://schema.org/EventScheduled",
      location: venueAlun,
    },
    {
      "@type": "Event",
      name: "Festival Nasional Reog Ponorogo (FNRP) XXXI",
      startDate: "2026-06-11",
      endDate: "2026-06-14",
      eventStatus: "https://schema.org/EventScheduled",
      location: venueAlun,
    },
    {
      "@type": "Event",
      name: "Larungan Risalah Doa",
      description: "Puncak Grebeg Suro pada 1 Suro / 1 Muharram.",
      startDate: "2026-06-26",
      eventStatus: "https://schema.org/EventScheduled",
      location: venueNgebel,
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

// Video dokumentasi (YouTube embed — andal & tanpa batas kuota Drive)
const VIDEO_EMBED = "https://www.youtube-nocookie.com/embed/f7KMIPp3TkE";

const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "Cuplikan Grebeg Suro Ponorogo",
  description:
    "Video dokumentasi suasana Grebeg Suro dan Festival Nasional Reog Ponorogo, Jawa Timur.",
  thumbnailUrl: ["https://i.ytimg.com/vi/f7KMIPp3TkE/maxresdefault.jpg"],
  uploadDate: "2026-06-10",
  url: "https://youtu.be/f7KMIPp3TkE",
  embedUrl: VIDEO_EMBED,
  inLanguage: "id-ID",
  publisher: { "@type": "Organization", name: "Volunteer Grebeg Suro", url: SITE },
};

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE}/#webpage`,
  url: SITE,
  name: "Grebeg Suro Ponorogo 2026 — Festival Nasional Reog Ponorogo",
  description:
    "Pusat informasi Grebeg Suro Ponorogo 2026: sejarah, jadwal, rangkaian acara, Festival Nasional Reog Ponorogo, dan Volunteer Grebeg Suro.",
  inLanguage: "id-ID",
  isPartOf: { "@id": `${SITE}/#website` },
  primaryImageOfPage: { "@type": "ImageObject", url: `${SITE}/brand/og.png` },
  about: { "@id": `${SITE}/#event-2026` },
  dateModified: "2026-06-10",
};

// ===== Jadwal & peserta Grebeg Suro 2026 (transkrip poster resmi) =====
const AGENDA_2026: { date: string; name: string }[] = [
  { date: "19–20 Mei", name: "Simaan Al-Qur'an Rabu Pahing" },
  { date: "30 Mei", name: "Festival Pencak Silat “Jawara Bumi Warok Ponorogo”" },
  { date: "3 Juni", name: "Istighosah dan Dzikir Maulidurrasul bersama Jamaah Al Hikmah" },
  { date: "3–9 Juni", name: "Grebeg Bonsai Bumi Reog 2026" },
  { date: "6 Juni", name: "Upacara Pembukaan Grebeg Suro, FRR XXII & FNRP XXXI 2026" },
  { date: "7 Juni", name: "Lomba Burung Perkutut Grebeg Suro Cup 2026" },
  { date: "7–16 Juni", name: "Pameran Bonsai “Samandiman Bonsai Club”" },
  { date: "7–10 Juni", name: "Festival Reog Remaja (FRR) XXII" },
  { date: "9–10 Juni", name: "Festival Macapat Pelajar se-Kabupaten Ponorogo" },
  { date: "10–15 Juni", name: "Pameran Lukisan" },
  { date: "11–14 Juni", name: "Festival Nasional Reog Ponorogo (FNRP) XXXI" },
  { date: "12–15 Juni", name: "Pagelaran Pusaka" },
  { date: "13 Juni", name: "Vespakultural" },
  { date: "13–14 Juni", name: "Parade Sepeda Onthel" },
  { date: "14 Juni", name: "Ziarah Makam" },
  { date: "14 Juni", name: "Lomba & Pameran Burung Berkicau" },
  { date: "14 Juni", name: "Bedol Pusaka didahului dengan Macapat" },
  { date: "15 Juni", name: "Karnaval Keroncong Ponorogo 24 Jam Season II" },
  { date: "15 Juni", name: "Kirab Pusaka, Pawai Lintas Sejarah, dan Jamasan Pusaka" },
  { date: "15 Juni", name: "Upacara Penutupan Grebeg Suro & Pengumuman Hasil FRR XXII dan FNRP XXXI 2026" },
  { date: "15 Juni", name: "Wayang Kulit Malam 1 Suro" },
  { date: "15 Juni", name: "Laku Tirakatan" },
  { date: "16 Juni", name: "Larungan Telaga Ngebel" },
  { date: "20–21 Juni", name: "Mataraman #2 Grebeg Suro Rockfest 2026" },
  { date: "25–28 Juni", name: "Grebeg Suro Adventure Offroad VII Tingkat Nasional" },
  { date: "27–28 Juni", name: "Grebeg Suro Jatim Racing Series 2026" },
  { date: "5 Juli", name: "Grebeg Suro Adventure Trail" },
  { date: "8 Juli", name: "Grebeg Suro Tutup Suran" },
  { date: "13 Juli", name: "Simaan Molakatan" },
];

type Peserta = [no: string, nama: string, asal: string];

const FRR_PESERTA: { day: string; list: Peserta[] }[] = [
  {
    day: "Minggu, 7 Juni 2026",
    list: [
      ["02", "Singo Anurogo Anom", "SMPN 1 Ngrayun"],
      ["03", "Sardula Siswa Winasis", "SMPN 2 Badegan"],
      ["04", "Singo Bayi Djoyo Manggolo", "SMPN 3 Ponorogo"],
      ["05", "Singo Manggolo", "Kontingen se-Kecamatan Sukorejo"],
      ["06", "Taruna Manggala", "SMPN 1 Bungkal"],
    ],
  },
  {
    day: "Senin, 8 Juni 2026",
    list: [
      ["07", "Jaya Manggala", "SMPN 2 Ponorogo"],
      ["08", "Simo Endro Wijoyo", "SMPN 2 Satu Atap / Kec. Jambon"],
      ["09", "Solah Wetan", "Komunitas Masyarakat Seni Solah Wetan"],
      ["10", "Singa Mudha Utama", "Wilayah Kecamatan Pulung"],
      ["11", "Jugo Joyo Manggolo", "SMPN 2 Balong"],
      ["12", "Gogor Sembada", "SMPN/MTs se-Kec. Babadan (diwakili SMPN 2 Babadan)"],
    ],
  },
  {
    day: "Selasa, 9 Juni 2026",
    list: [
      ["13", "Singo Taruno Budoyo", "SMPN 1 Ponorogo"],
      ["14", "Putro Joyo Negoro", "Kontingen SMP/MTs Kec. Slahung"],
      ["15", "Singo Sumowicitro", "SMPN 2 Kauman"],
      ["16", "Singo Mulang Joyo", "SMPN 4 Ponorogo"],
      ["17", "Arezza Manggala", "SMPN 1 Sambit"],
      ["18", "Reyog Gunungsari", "SMPN 1 Mlarak"],
      ["01", "Reyog Nurul Huda", "Ponpes Nurul Huda Sragen"],
    ],
  },
  {
    day: "Rabu, 10 Juni 2026",
    list: [
      ["19", "Taruno Mudho", "SMPN 1 Jetis"],
      ["20", "Sardula Pratama", "SMPN 6 Ponorogo"],
      ["21", "Taruna Argo Wilis", "SMPN 1 Ngebel"],
      ["22", "Sardulo Mudho Nirmala", "SMPN 1 Jenangan"],
      ["23", "Sekar Mas", "SMPN 5 Ponorogo"],
      ["24", "Sardula Candi Taruna", "SMPN 1 Kauman"],
    ],
  },
];

const FNRP_PESERTA: { day: string; list: Peserta[] }[] = [
  {
    day: "Kamis, 11 Juni 2026",
    list: [
      ["02", "Sardhulo Kridho", "Ex-PB Somoroto"],
      ["03", "Sardhulo Djoyo Gendhilo", "PSHWTM Pusat Madiun"],
      ["04", "Manggolo Projo Arjowinangun", "Ex-PB Arjowinangun"],
      ["05", "Reyog Krida Satria Tama", "Komisariat PSHT Pusat Madiun"],
      ["06", "Taruno Jayengrono", "SMAN 1 Pulung"],
      ["07", "Gembolo Sardulo", "Ex-PB Jebeng"],
      ["08", "Singo Mudo Kepuhrubuh", "Desa Kepuhrubuh, Siman"],
    ],
  },
  {
    day: "Jumat, 12 Juni 2026",
    list: [
      ["09", "Reyog Panjer Lintang", "Ex-PB Pulung"],
      ["10", "Krida Chitraka Muda", "SMKN 1 Slahung"],
      ["11", "Gembong Tengah Kutho Titik Nol", "SMAN 1 Ponorogo"],
      ["12", "Manggolo Wiyoto", "SMAN 3 Ponorogo"],
      ["13", "Simo Budi Utomo", "PGRI Universitas Muhammadiyah Ponorogo"],
      ["14", "Taruno Adi Luhung", "SMAN 1 Babadan"],
      ["15", "Reyog Watoe Dhakon", "UIN Kyai Ageng Muhammad Besari Ponorogo"],
      ["16", "Regol Wengker", "Komunitas Seniman Reyog Kecamatan Sampung"],
    ],
  },
  {
    day: "Sabtu, 13 Juni 2026",
    list: [
      ["17", "Pemerintah Kota Surabaya", "Purbaya Surabaya"],
      ["18", "Kyai Lodra", "Disbud Jawa Timur"],
      ["19", "Kedaton Singa Lodaya", "Blit'art Community"],
      ["20", "Garudo Djoyo Manggolo", "Sekolah Rakyat Terintegrasi 5 Ponorogo"],
      ["21", "Taruno Suryo", "SMA Muhammadiyah 1 Ponorogo"],
      ["22", "Ki Ageng Mirah", "Resbumi PCNU Ponorogo"],
      ["23", "Kawulo Mudho", "Kabupaten Nganjuk"],
      ["24", "Kridha Taruna", "SMAN 2 Ponorogo"],
    ],
  },
  {
    day: "Minggu, 14 Juni 2026",
    list: [
      ["25", "PO Narendra", "PO Narendra"],
      ["26", "Reyog Pemerintah Kabupaten Wonogiri", "Pemkab Wonogiri"],
      ["27", "Manggolo Mudho", "Pawardo Yogyakarta"],
      ["28", "Gajah Manggolo", "SMAN 1 Ponorogo"],
      ["29", "Komunitas Reyog Singo Yogo", "Surakarta"],
      ["30", "Satrio Bimo Sembodo", "Baturetno, Wonogiri"],
      ["31", "Bantarangin DKI Jakarta", "Bantarangin DKI Jakarta"],
      ["32", "Reyog Laskar Sawunggaling", "Universitas Negeri Surabaya"],
      ["01", "Gembong Cadas Sriwijaya", "Sekolah Rakyat Terintegrasi 5 / Disbudpar Kota Palembang"],
    ],
  },
];

export default async function LandingPage() {
  const stats = await getStats();

  const statCards = [
    { icon: Users, label: "Total Volunteer", value: `${stats.volunteers}+` },
    { icon: Landmark, label: "Total Divisi", value: `${stats.divisions}` },
    { icon: Sparkles, label: "Total EO", value: `${stats.eo}` },
    { icon: CalendarDays, label: "Rangkaian Acara 2026", value: "29+" },
  ];

  return (
    <main id="main" className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader activeSpy />

      {/* ===== HERO ===== */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-28 pb-16">
        <div className="absolute inset-0 bg-hero-mesh" />
        <div className="absolute -left-20 top-32 h-72 w-72 rounded-full bg-cyan/20 blur-3xl" />
        <div className="absolute right-0 top-48 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute inset-0 grid-texture opacity-50" />

        <div className="container relative z-10 grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="glass inline-flex items-center gap-2 rounded-full border-brand/30 px-4 py-1.5 text-xs font-semibold text-brand animate-fade-up">
              <Award className="h-3.5 w-3.5" />
              Reog Ponorogo &mdash; Warisan Budaya Takbenda UNESCO 2024
            </span>

            <h1
              className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl xl:text-7xl animate-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              Grebeg Suro <span className="text-gradient-brand">Ponorogo</span>
            </h1>

            <p
              className="mt-6 max-w-xl text-base leading-relaxed text-body sm:text-lg animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              Pesta rakyat tahunan Kabupaten Ponorogo, Jawa Timur, untuk menyambut
              Tahun Baru Islam 1 Muharram (1 Suro). Dimeriahkan Festival Nasional Reog
              Ponorogo, pawai lintas sejarah &amp; kirab pusaka, hingga Larungan Risalah
              Doa di Telaga Ngebel.
            </p>

            <div
              className="mt-9 flex flex-col items-start gap-3 sm:flex-row animate-fade-up"
              style={{ animationDelay: "0.3s" }}
            >
              <Button asChild size="lg" className="group">
                <a href="#tentang">
                  Jelajahi Informasi
                  <ArrowRight className="transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Masuk Absensi Volunteer</Link>
              </Button>
            </div>

            <dl
              className="mt-12 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 animate-fade-up"
              style={{ animationDelay: "0.4s" }}
            >
              {[
                { k: "Digagas", v: "1987" },
                { k: "Menyambut", v: "1 Suro" },
                { k: "Panggung", v: "Alun-alun" },
                { k: "Puncak", v: "T. Ngebel" },
              ].map((f) => (
                <div key={f.k}>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">{f.k}</dt>
                  <dd className="mt-1 font-display text-xl font-bold text-ink">{f.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero emblem card */}
          <div className="relative mx-auto hidden w-full max-w-sm lg:block animate-fade-up" style={{ animationDelay: "0.25s" }}>
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-card">
              <div className="absolute inset-0 bg-soft-radial" />
              <div className="relative flex flex-col items-center text-center">
                <img
                  src="/brand/medallion.webp"
                  alt="Medali budaya Grebeg Suro Ponorogo — mandala ikon budaya dengan emblem api Reog"
                  width={460}
                  height={461}
                  loading="lazy"
                  decoding="async"
                  className="h-52 w-auto animate-float drop-shadow-[0_18px_30px_rgba(122,14,22,0.28)]"
                />
                <h2 className="mt-5 font-display text-xl font-bold text-ink">Grebeg Suro</h2>
                <p className="text-sm text-muted-foreground">Pesta Budaya Ponorogo</p>
                <div className="mt-6 grid w-full grid-cols-3 gap-3">
                  {[
                    { icon: Drama, label: "Reog" },
                    { icon: Waves, label: "Larungan" },
                    { icon: Crown, label: "Pusaka" },
                  ].map((b) => (
                    <div key={b.label} className="rounded-xl border border-border bg-soft/60 p-3">
                      <b.icon className="mx-auto h-5 w-5 text-brand" />
                      <span className="mt-1.5 block text-[11px] font-medium text-body">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HIGHLIGHT STRIP ===== */}
      <section className="border-y border-border bg-soft/60">
        <div className="container grid grid-cols-2 divide-x divide-border md:grid-cols-4">
          {[
            { k: "Sejak", v: "1987", d: "Digagas Bupati Soebarkah P.H." },
            { k: "FNRP Sejak", v: "1995", d: "Festival Nasional Reog" },
            { k: "Durasi", v: "± 1 Bulan", d: "Mengikuti bulan Muharram" },
            { k: "Skala", v: "Nasional", d: "Peserta lintas provinsi" },
          ].map((s, i) => (
            <div key={i} className="px-5 py-7 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.k}</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-gradient-brand sm:text-3xl">{s.v}</p>
              <p
                className="mt-1 text-xs text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: s.d }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ===== VIDEO ===== */}
      <section id="video" className="relative scroll-mt-20 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <SectionTag icon={PlayCircle} center>Galeri Video</SectionTag>
            <h2 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
              Cuplikan <span className="text-gradient-brand">Grebeg Suro</span>
            </h2>
            <p className="mt-4 text-body">
              Rasakan atmosfer Grebeg Suro dan Festival Nasional Reog Ponorogo melalui
              video dokumentasi berikut.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-4xl">
            <div className="overflow-hidden rounded-3xl border border-border bg-navy shadow-card">
              <div className="relative aspect-video">
                <iframe
                  src={VIDEO_EMBED}
                  title="Video cuplikan Grebeg Suro Ponorogo"
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Dokumentasi Volunteer Grebeg Suro.
            </p>
          </div>
        </div>
      </section>

      {/* ===== TENTANG ===== */}
      <section id="tentang" className="relative scroll-mt-20 py-24">
        <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionTag icon={Star}>Tentang</SectionTag>
            <h2 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
              Apa itu <span className="text-gradient-brand">Grebeg Suro?</span>
            </h2>
            <p className="mt-5 leading-relaxed text-body">
              Grebeg Suro adalah perayaan budaya tahunan masyarakat Ponorogo untuk
              menyambut datangnya Tahun Baru Islam 1 Muharram, yang dalam penanggalan
              Jawa disebut 1 Suro. Lebih dari sekadar pesta rakyat, Grebeg Suro menjadi
              ruang syukur, refleksi spiritual, sekaligus panggung pelestarian jati diri
              budaya Ponorogo &mdash; terutama kesenian Reog yang melegenda.
            </p>
            <p className="mt-4 leading-relaxed text-body">
              Perhelatan ini menyatukan ritual, seni pertunjukan, dan wisata budaya dalam
              satu rangkaian besar yang berlangsung hampir sebulan penuh dan menjadi
              magnet wisatawan dari berbagai daerah.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: CalendarDays, title: "Menyambut 1 Suro", body: "Penanda pergantian tahun dalam kalender Islam &amp; Jawa." },
              { icon: HeartHandshake, title: "Wujud Syukur", body: "Doa dan harapan akan berkah serta keselamatan." },
              { icon: Drama, title: "Pelestarian Reog", body: "Menjaga warisan kesenian khas Ponorogo tetap hidup." },
              { icon: Globe2, title: "Wisata Budaya", body: "Daya tarik pariwisata berskala nasional." },
            ].map((c) => (
              <div key={c.title} className="card-hover rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10">
                  <c.icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-ink">{c.title}</h3>
                <p
                  className="mt-1.5 text-sm leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: c.body }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SEJARAH ===== */}
      <section id="sejarah" className="relative scroll-mt-20 overflow-hidden bg-soft/50 py-24">
        <div className="absolute inset-0 grid-texture opacity-40" />
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center">
            <SectionTag icon={History} center>Perjalanan Sejarah</SectionTag>
            <h2 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
              Dari Tirakatan Malam Suro <br className="hidden sm:block" />
              ke <span className="text-gradient-brand">Pengakuan Dunia</span>
            </h2>
          </div>

          <ol className="relative mx-auto mt-14 max-w-3xl space-y-8 before:absolute before:left-[19px] before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-border sm:before:left-1/2 sm:before:-translate-x-1/2">
            {[
              { year: "Asal-usul", icon: Flame, title: "Tirakatan Malam 1 Suro", body: "Masyarakat Ponorogo, terutama para warok, mengelilingi kota semalam suntuk dan berakhir di Alun-alun Ponorogo." },
              { year: "1987", icon: Landmark, title: "Lahirnya Grebeg Suro", body: "Bupati Soebarkah Poetra Hadiwirjo memformalkan tradisi ini dan memasukkan kesenian Reog ke dalam rangkaiannya untuk membangkitkan kembali minat generasi muda." },
              { year: "1993", icon: Waves, title: "Larung Sesaji Telaga Ngebel", body: "Ritual larung di Telaga Ngebel mulai diselenggarakan secara resmi sebagai bagian rangkaian acara." },
              { year: "1995", icon: Trophy, title: "Festival Nasional Reog Ponorogo", body: "FNRP pertama digelar, mempertemukan grup-grup reog dari berbagai daerah di panggung Alun-alun Ponorogo." },
              { year: "± 1997", icon: ScrollText, title: "Larung Risalah Doa", body: "Larung Sesaji berganti nama menjadi Larung/Risalah Doa, selaras dengan identitas Ponorogo sebagai Kota Santri." },
              { year: "2024", icon: Award, title: "Diakui UNESCO", body: "Reog Ponorogo ditetapkan sebagai Warisan Budaya Takbenda UNESCO pada 3 Desember 2024." },
            ].map((t, i) => (
              <li key={i} className="relative grid gap-4 sm:grid-cols-2 sm:gap-8">
                <div className={i % 2 === 0 ? "sm:text-right" : "sm:col-start-2"}>
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand">
                      <t.icon className="h-3.5 w-3.5" /> {t.year}
                    </span>
                    <h3 className="mt-2 font-display text-lg font-semibold text-ink">{t.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
                  </div>
                </div>
                <span className="absolute left-[11px] top-5 grid h-4 w-4 place-items-center rounded-full border-2 border-brand bg-background sm:left-1/2 sm:-translate-x-1/2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== RANGKAIAN ACARA ===== */}
      <section id="rangkaian" className="scroll-mt-20 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <SectionTag icon={CalendarDays} center>Rangkaian Acara</SectionTag>
            <h2 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
              Empat Mahakarya <span className="text-gradient-brand">dalam Satu Perhelatan</span>
            </h2>
            <p className="mt-4 text-body">
              Rangkaian Grebeg Suro membentang dari prosesi sakral hingga kompetisi seni berskala nasional.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {[
              {
                icon: Flag,
                tag: "Prosesi Pembuka",
                title: "Pawai Lintas Sejarah & Kirab Pusaka",
                body: "Diawali kirab pusaka menuju makam Bathara Katong, pendiri Ponorogo. Ratusan peserta berpawai dengan bendi dan kuda hias menyusuri pusat kota, menapaktilasi sejarah panjang Bumi Reog.",
              },
              {
                icon: Users,
                tag: "Kaderisasi",
                title: "Festival Reog Remaja (FRR)",
                body: "Panggung bagi grup-grup reog usia remaja dan pelajar untuk unjuk kebolehan &mdash; wadah regenerasi seniman reog masa depan.",
              },
              {
                icon: Trophy,
                tag: "Puncak Kompetisi",
                title: "Festival Nasional Reog Ponorogo (FNRP)",
                body: "Kompetisi reog skala nasional di panggung utama Alun-alun Ponorogo. Diikuti puluhan grup dari berbagai provinsi &mdash; Madiun, Malang, Yogyakarta, Jakarta, hingga Sumatra dan Kalimantan. Digelar sejak 1995.",
              },
              {
                icon: Waves,
                tag: "Puncak & Penutup",
                title: "Larungan Risalah Doa — Telaga Ngebel",
                body: "Tepat pada 1 Suro, dua tumpeng raksasa berisi hasil bumi diarak mengelilingi telaga (± 3 km), didoakan para sesepuh, lalu dilarung ke Telaga Ngebel sebagai wujud syukur dan harapan berkah.",
              },
            ].map((c) => (
              <div key={c.title} className="card-hover group relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-soft">
                <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-brand/5 transition-transform group-hover:scale-150" />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-soft">
                      <c.icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-cyan">{c.tag}</span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold text-ink">{c.title}</h3>
                  <p
                    className="mt-2 text-sm leading-relaxed text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: c.body }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== REOG PONOROGO ===== */}
      <section id="reog" className="relative scroll-mt-20 overflow-hidden py-24">
        <div className="absolute inset-0 bg-hero-mesh opacity-70" />
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center">
            <SectionTag icon={Drama} center>Sang Bintang</SectionTag>
            <h2 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
              Mengenal <span className="text-gradient-brand">Reog Ponorogo</span>
            </h2>
            <p className="mt-4 text-body">
              Seni pertunjukan yang memadukan tari, musik gamelan, dan mitologi &mdash;
              cerminan keberanian, kesetiaan, dan kebanggaan masyarakat Ponorogo.
            </p>
          </div>

          {/* Dadak Merak highlight */}
          <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 text-white shadow-card lg:col-span-1">
              <Feather className="h-9 w-9 text-cyan" />
              <h3 className="mt-4 font-display text-2xl font-bold">Singo Barong &amp; Dadak Merak</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                Topeng raksasa berwujud kepala harimau yang dimahkotai rangkaian bulu
                merak &mdash; ikon utama Reog Ponorogo.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/20 pt-6">
                {[
                  { v: "± 2,25 m", k: "Panjang" },
                  { v: "50–60 kg", k: "Berat" },
                  { v: "Digigit", k: "Cara dibawa" },
                ].map((m) => (
                  <div key={m.k}>
                    <p className="font-display text-lg font-bold">{m.v}</p>
                    <p className="text-[11px] uppercase tracking-wider text-white/70">{m.k}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              {[
                { icon: Swords, title: "Warok", body: "Sesepuh berilmu tinggi dan berbudi luhur; lambang kekuatan lahir-batin serta pengayom masyarakat." },
                { icon: Star, title: "Jathil", body: "Prajurit berkuda yang menari lincah berpasangan di atas kuda kepang, melambangkan ketangkasan keprajuritan." },
                { icon: Zap, title: "Bujang Ganong", body: "Patih muda (Pujangga Anom) yang enerjik, jenaka, dan akrobatik &mdash; penampilannya selalu dinanti penonton." },
                { icon: Crown, title: "Prabu Klono Sewandono", body: "Raja sakti dari Kerajaan Bantarangin, pemilik pusaka andalan Pecut Samandiman." },
              ].map((t) => (
                <div key={t.title} className="card-hover rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10">
                    <t.icon className="h-5 w-5 text-brand" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-ink">{t.title}</h3>
                  <p
                    className="mt-1.5 text-sm leading-relaxed text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: t.body }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Music note */}
          <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/80 p-6 text-center shadow-soft sm:flex-row sm:text-left">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10">
              <Music2 className="h-6 w-6 text-brand" />
            </div>
            <p className="text-sm leading-relaxed text-body">
              <span className="font-semibold text-ink">Iringan musik:</span> pertunjukan
              Reog hidup dengan gamelan khas Ponorogo &mdash; kendang, ketipung, kenong,
              gong, angklung, dan <span className="font-medium text-ink">slompret</span>{" "}
              (terompet) yang melengking khas.
            </p>
            <Drum className="hidden h-8 w-8 shrink-0 text-brand/40 sm:block" />
          </div>
        </div>
      </section>

      {/* ===== LEGENDA ===== */}
      <section className="scroll-mt-20 bg-soft/50 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <SectionTag icon={ScrollText} center>Akar Legenda</SectionTag>
            <h2 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
              Dua Kisah di Balik <span className="text-gradient-brand">Reog</span>
            </h2>
            <p className="mt-4 text-body">
              Asal-usul Reog Ponorogo diwariskan melalui dua versi cerita yang sama-sama melegenda.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {[
              {
                tag: "Versi Bantarangin",
                icon: Crown,
                title: "Cinta Klono Sewandono & Dewi Songgolangit",
                body: "Prabu Klono Sewandono dari Kerajaan Bantarangin jatuh hati dan melamar Dewi Songgolangit, putri Kerajaan Kediri. Dalam perjalanan, ia dihadang Singo Barong &mdash; makhluk berkepala harimau bermahkota bulu merak. Pertarungan inilah yang diyakini menjadi cikal bakal tarian Reog.",
              },
              {
                tag: "Versi Ki Ageng Kutu",
                icon: ShieldCheck,
                title: "Sindiran untuk Penguasa Majapahit",
                body: "Pada abad ke-15, Ki Ageng Kutu &mdash; abdi Raja Brawijaya V &mdash; kecewa atas melemahnya pemerintahan Majapahit. Melalui padepokan dan kesenian barongan, ia menciptakan Reog sebagai sindiran: Singo Barong melambangkan raja yang dikendalikan, sementara bulu merak melambangkan pengaruh sang permaisuri.",
              },
            ].map((c) => (
              <div key={c.tag} className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-soft">
                <Quote className="absolute right-6 top-6 h-12 w-12 text-brand/10" />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                  <c.icon className="h-3.5 w-3.5" /> {c.tag}
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-ink">{c.title}</h3>
                <p
                  className="mt-3 leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: c.body }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== UNESCO BANNER ===== */}
      <section className="py-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-brand-gradient px-8 py-14 text-center text-white shadow-card sm:px-16">
            <div className="absolute inset-0 grid-texture opacity-20" />
            <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-cyan/20 blur-3xl" />
            <div className="absolute -bottom-12 right-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="relative mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur">
                <Globe2 className="h-4 w-4" /> UNESCO Intangible Cultural Heritage
              </span>
              <h2 className="mt-6 font-display text-3xl font-extrabold sm:text-4xl">
                Reog Ponorogo Resmi Diakui Dunia
              </h2>
              <p className="mt-4 leading-relaxed text-white/85">
                Pada Sidang ke-19 Komite Antarpemerintah untuk Pelindungan Warisan Budaya
                Takbenda di Asunci&oacute;n, Paraguay, 3 Desember 2024, UNESCO menetapkan
                Reog Ponorogo sebagai Warisan Budaya Takbenda dalam kategori yang
                membutuhkan pelindungan mendesak (In Need of Urgent Safeguarding). Reog
                menjadi elemen budaya takbenda Indonesia ke-14 yang diakui UNESCO.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {["3 Desember 2024", "Asunción, Paraguay", "Elemen ke-14 Indonesia"].map((b) => (
                  <span key={b} className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== JADWAL 2026 ===== */}
      <section id="jadwal" className="relative scroll-mt-20 overflow-hidden bg-soft/50 py-24">
        <div className="absolute inset-0 grid-texture opacity-40" />
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center">
            <SectionTag icon={CalendarDays} center>Agenda Terkini</SectionTag>
            <h2 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
              Grebeg Suro 2026 &mdash; <span className="text-gradient-brand">FNRP ke-XXXI</span>
            </h2>
            <p className="mt-4 text-body">
              Lebih dari 29 rangkaian acara digelar sepanjang Mei&ndash;Juli 2026 di
              Ponorogo. Berikut rangkaian acara lengkap beserta daftar peserta festival.
            </p>
          </div>

          {/* Rangkaian acara lengkap */}
          <div className="mx-auto mt-14 max-w-4xl">
            <h3 className="font-display text-xl font-bold text-ink">Rangkaian Acara</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {AGENDA_2026.map((e) => (
                <div
                  key={e.name}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-soft"
                >
                  <span className="shrink-0 rounded-md bg-soft px-2.5 py-1 text-xs font-bold text-cyan">
                    {e.date}
                  </span>
                  <span className="text-sm font-medium text-ink">{e.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daftar peserta */}
          <div className="mx-auto mt-16 max-w-5xl">
            <h3 className="font-display text-xl font-bold text-ink">
              Daftar Peserta &mdash; Festival Reog Remaja (FRR) XXII
            </h3>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {FRR_PESERTA.map((d) => (
                <DayCard key={d.day} day={d.day} list={d.list} />
              ))}
            </div>

            <h3 className="mt-14 font-display text-xl font-bold text-ink">
              Daftar Peserta &mdash; Festival Nasional Reog Ponorogo (FNRP) XXXI
            </h3>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {FNRP_PESERTA.map((d) => (
                <DayCard key={d.day} day={d.day} list={d.list} />
              ))}
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-muted-foreground">
            *Jadwal &amp; nomor urut tampil dapat berubah sesuai keputusan penyelenggara.
            Data dirangkum dari poster resmi Grebeg Suro 2026.
          </p>
        </div>
      </section>

      {/* ===== TIKET ===== */}
      <section id="tiket" className="relative scroll-mt-20 py-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-brand-gradient px-8 py-14 text-center text-white shadow-card sm:px-16">
            <div className="absolute inset-0 grid-texture opacity-20" />
            <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-cyan/25 blur-3xl" />
            <div className="absolute -bottom-12 right-0 h-56 w-56 rounded-full bg-purple/40 blur-3xl" />
            <div className="relative mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur">
                <Ticket className="h-4 w-4" /> Tiket Online
              </span>
              <h2 className="mt-6 font-display text-3xl font-extrabold sm:text-4xl">
                Tiket Festival Nasional Reog Ponorogo XXXI
              </h2>
              <p className="mt-4 leading-relaxed text-white/85">
                Penjualan tiket online dibuka{" "}
                <span className="font-semibold">Minggu, 7 Juni 2026</span> pukul{" "}
                <span className="font-semibold">20.00 WIB</span>. Tersedia tiga kategori:
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {["Reguler", "VIP", "VVIP"].map((k) => (
                  <span key={k} className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold backdrop-blur">
                    {k}
                  </span>
                ))}
              </div>
              <div className="mt-8">
                <a
                  href="https://reogtix.com"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-white px-8 text-base font-semibold text-brand shadow-soft transition hover:bg-white/90"
                >
                  Beli Tiket di ReogTix
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
              <p className="mt-4 text-xs text-white/70">
                Resmi melalui ReogTix &mdash; https://ReogTix.com
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HIMBAUAN ===== */}
      <section id="himbauan" className="relative scroll-mt-20 overflow-hidden bg-soft/40 py-24">
        <div className="absolute inset-0 grid-texture opacity-30" />
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center">
            <SectionTag icon={Megaphone} center>Himbauan</SectionTag>
            <h2 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
              Himbauan Perayaan <span className="text-gradient-brand">Grebeg Suro 2026</span>
            </h2>
            <p className="mt-4 text-body">
              Imbauan resmi Pemerintah Kabupaten Ponorogo untuk menyemarakkan Grebeg Suro 2026.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {[
              {
                icon: Flag,
                title: "Pasang Umbul-umbul",
                body: "Memasang umbul-umbul kesemarakan dan keindahan di masing-masing lingkungan OPD / Satuan Kerja / Kantor.",
                when: "1–30 Juni 2026",
                href: "",
                hrefLabel: "",
              },
              {
                icon: Megaphone,
                title: "Pasang Spanduk",
                body: "Memasang spanduk bertema “Bergandeng Erat, Bergerak Cepat, Ponorogo Hebat”.",
                when: "1–30 Juni 2026",
                href: "https://s.id/bannerGS2026",
                hrefLabel: "Template: s.id/bannerGS2026",
              },
              {
                icon: Shirt,
                title: "Pakaian Khas Ponorogo",
                body: "Karyawan/karyawati mengenakan Pakaian Khas Ponorogo — Bapak: Penadon & Blangkon Gadung Melati; Ibu: Penadon Wanita.",
                when: "6–15 Juni 2026",
                href: "",
                hrefLabel: "",
              },
            ].map((h) => (
              <div key={h.title} className="card-hover rounded-2xl border border-border bg-card p-7 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-soft">
                    <h.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-cyan">
                    {h.when}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{h.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{h.body}</p>
                {h.href && (
                  <a
                    href={h.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
                  >
                    {h.hrefLabel}
                  </a>
                )}
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-muted-foreground">
            Sumber: Pemerintah Kabupaten Ponorogo · ponorogo.go.id
          </p>
        </div>
      </section>

      {/* ===== VOLUNTEER + STATS ===== */}
      <section className="py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <SectionTag icon={HeartHandshake} center>Di Balik Layar</SectionTag>
            <h2 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
              Digerakkan oleh <span className="text-gradient-brand">Ribuan Volunteer</span>
            </h2>
            <p className="mt-4 text-body">
              Di balik megahnya Grebeg Suro, ada Volunteer Grebeg Suro dari berbagai
              divisi &mdash; backstage, runner, liaison officer, hospitality, hingga
              dokumentasi &mdash; yang bahu-membahu menyukseskan setiap perhelatan.
            </p>
            <div className="mt-7">
              <Button asChild variant="outline" className="group">
                <Link href="/volunteer-grebeg-suro">
                  Pelajari Volunteer Grebeg Suro
                  <ArrowRight className="transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
                <s.icon className="mx-auto mb-3 h-7 w-7 text-brand" />
                <div className="font-display text-3xl font-extrabold text-gradient-brand">{s.value}</div>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-card p-10 text-center shadow-card sm:p-14">
            <h3 className="font-display text-2xl font-bold text-ink sm:text-3xl">Volunteer Bertugas Hari Ini?</h3>
            <p className="mx-auto mt-3 max-w-xl text-body">
              Masuk ke akun volunteer Anda untuk melakukan clock-in. Pastikan Anda berada di
              area venue agar validasi lokasi berhasil.
            </p>
            <Button asChild size="lg" className="mt-8 animate-pulse-brand">
              <Link href="/login">
                Masuk Absensi Volunteer
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="scroll-mt-20 border-t border-border py-24">
        <div className="container max-w-3xl">
          <div className="text-center">
            <SectionTag icon={HelpCircle} center>Pertanyaan Umum</SectionTag>
            <h2 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
              Yang Sering <span className="text-gradient-brand">Ditanyakan</span>
            </h2>
          </div>
          <div className="mt-12 space-y-3">
            {FAQ.map((f, i) => (
              <details
                key={i}
                open={i === 0}
                className="group rounded-2xl border border-border bg-card p-5 shadow-soft [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display font-semibold text-ink">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-brand transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                {f.href && (
                  <Link
                    href={f.href}
                    className="mt-2 inline-flex text-sm font-medium text-brand hover:underline"
                  >
                    Pelajari selengkapnya →
                  </Link>
                )}
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border bg-soft/60">
        <div className="container py-14">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <BrandLogo size={52} />
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                Pusat informasi &amp; sistem absensi Volunteer Grebeg Suro dan Festival
                Nasional Reog Ponorogo.
              </p>
              <a
                href="https://www.instagram.com/volunteer.grebegsuro.png"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram Volunteer Grebeg Suro"
                className="mt-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>

            <nav aria-label="Tautan footer">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">Jelajahi</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <a href={n.href} className="text-muted-foreground transition-colors hover:text-brand">
                      {n.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">Kontak &amp; Lokasi</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>
                  <a
                    href="https://www.instagram.com/volunteer.grebegsuro.png"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 transition-colors hover:text-brand"
                  >
                    <Instagram className="h-4 w-4" /> @volunteer.grebegsuro.png
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>Alun-alun Ponorogo &amp; Telaga Ngebel, Kabupaten Ponorogo, Jawa Timur</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">Sumber Informasi</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  { label: "Wikipedia", href: "https://id.wikipedia.org/wiki/Grebeg_Suro" },
                  { label: "Pemkab Ponorogo", href: "https://ponorogo.go.id" },
                  { label: "detikcom", href: "https://www.detik.com" },
                  { label: "Kompas", href: "https://www.kompas.com" },
                  { label: "Kemdikbud", href: "https://www.kemdikbud.go.id" },
                ].map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noreferrer" className="text-muted-foreground transition-colors hover:text-brand">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Volunteer Grebeg Suro. Hak Cipta Dilindungi.
            </p>
            <p className="text-xs text-muted-foreground">
              Terakhir diperbarui <time dateTime="2026-06-10">10 Juni 2026</time>
            </p>
          </div>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
    </main>
  );
}

function DayCard({ day, list }: { day: string; list: Peserta[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h4 className="font-display text-base font-bold text-ink">{day}</h4>
      <ol className="mt-3 space-y-2.5">
        {list.map(([no, nama, asal]) => (
          <li key={no} className="flex gap-3 text-sm">
            <span className="mt-0.5 w-6 shrink-0 text-right font-bold tabular-nums text-brand">
              {no}
            </span>
            <span className="min-w-0">
              <span className="font-medium text-ink">{nama}</span>
              <span className="block text-xs text-muted-foreground">{asal}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SectionTag({
  icon: Icon,
  children,
  center,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand ${center ? "mx-auto" : ""}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}
