"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Catat error ke konsol (bisa diganti ke layanan monitoring bila ada).
    console.error(error);
  }, [error]);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-6 text-center">
      <div className="absolute inset-0 bg-hero-mesh" />
      <div className="relative">
        <BrandLogo href="/" size={56} />
        <h1 className="mt-10 font-display text-2xl font-bold text-ink sm:text-3xl">
          Terjadi kesalahan
        </h1>
        <p className="mx-auto mt-3 max-w-md text-body">
          Maaf, ada gangguan teknis sesaat. Silakan coba muat ulang halaman ini.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={() => reset()} size="lg">
            <RotateCcw /> Coba lagi
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">
              <Home /> Beranda
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
