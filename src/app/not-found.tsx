import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-6 text-center">
      <div className="absolute inset-0 bg-hero-mesh" />
      <div className="absolute inset-0 grid-texture opacity-40" />
      <div className="relative">
        <BrandLogo href="/" size={56} />
        <p className="mt-10 font-display text-7xl font-extrabold leading-none text-gradient-brand sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink sm:text-3xl">
          Halaman tidak ditemukan
        </h1>
        <p className="mx-auto mt-3 max-w-md text-body">
          Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan. Mari kembali
          menjelajahi informasi Grebeg Suro Ponorogo.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="group">
            <Link href="/">
              <Home /> Kembali ke beranda
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/volunteer-grebeg-suro">
              <ArrowLeft /> Tentang Volunteer
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
