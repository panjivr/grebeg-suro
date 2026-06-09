import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Camera, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { BrandLogo } from "@/components/brand-logo";

export const metadata = {
  title: "Masuk Absensi Volunteer",
  description:
    "Halaman masuk untuk volunteer terdaftar Grebeg Suro — clock-in/out kehadiran dengan validasi GPS & selfie.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main id="main" className="relative grid min-h-screen lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-gradient lg:block">
        <div className="absolute inset-0 grid-texture opacity-40" />
        <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-cyan/30 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <BrandLogo size={48} />
          <div>
            <h2 className="max-w-md font-display text-4xl font-bold leading-tight text-white">
              Selamat Datang, <span className="text-cyan">Volunteer</span>
            </h2>
            <p className="mt-4 max-w-sm text-white/75">
              Festival Nasional Reog Ponorogo membutuhkan dedikasi Anda. Masuk untuk
              mencatat kehadiran dan menjalankan tugas dengan validasi GPS &amp; selfie.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                { icon: MapPin, label: "Clock-in dengan validasi lokasi" },
                { icon: Camera, label: "Verifikasi kehadiran via selfie" },
                { icon: ShieldCheck, label: "Monitoring real-time oleh tim Volunteer" },
              ].map((f) => (
                <li key={f.label} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur">
                    <f.icon className="h-4 w-4 text-white" />
                  </span>
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Volunteer Grebeg Suro
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="relative flex items-center justify-center bg-background p-6">
        <div className="absolute inset-0 bg-hero-mesh lg:hidden" />
        <div className="relative w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
          </Link>

          <div className="mb-8 lg:hidden">
            <BrandLogo size={40} />
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-ink">Masuk Absensi</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Gunakan username atau nomor telepon yang terdaftar.
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Akun volunteer dibuat &amp; dikelola oleh tim Volunteer Grebeg Suro.
          </p>
        </div>
      </div>
    </main>
  );
}
