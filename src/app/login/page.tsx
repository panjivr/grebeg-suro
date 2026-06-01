import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen lg:grid-cols-2">
      {/* Left — cinematic panel */}
      <div className="relative hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(15,13,10,0.7), rgba(15,13,10,0.95)), url('https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?q=80&w=2070&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 batik-texture opacity-60" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold-gradient font-display text-lg font-bold text-primary-foreground">
              G
            </div>
            <span className="font-display text-lg font-semibold text-gold">Grebeg Suro</span>
          </Link>
          <div>
            <h2 className="max-w-md font-display text-4xl font-bold leading-tight">
              Selamat Datang, <span className="text-gradient-gold">Relawan</span>
            </h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Festival Nasional Reog Ponorogo membutuhkan dedikasi Anda. Masuk untuk
              mencatat kehadiran dan menjalankan tugas.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Panitia Grebeg Suro Ponorogo
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="relative flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-dark-radial lg:hidden" />
        <div className="relative w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">Masuk Absensi</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Gunakan username atau nomor telepon yang terdaftar.
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>

          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold text-gold">Demo akun:</p>
            <p>Admin — <code className="text-foreground">admin / admin123</code></p>
            <p>Relawan — <code className="text-foreground">relawan01 / relawan123</code></p>
          </div>
        </div>
      </div>
    </main>
  );
}
