"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { NAV } from "@/components/nav-links";
import { cn } from "@/lib/utils";

/**
 * Header situs yang dipakai ulang di beranda & halaman Volunteer.
 * Menyediakan navigasi desktop, tombol CTA, menu hamburger untuk mobile,
 * dan penyorot bagian aktif (scroll-spy) saat `activeSpy` aktif (beranda).
 */
export function SiteHeader({ activeSpy = false }: { activeSpy?: boolean }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  // Scroll-spy: sorot anchor bagian yang sedang dilihat (hanya beranda).
  useEffect(() => {
    if (!activeSpy) return;
    const ids = NAV.map((l) => l.href)
      .filter((h) => h.includes("#"))
      .map((h) => h.split("#")[1]);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [activeSpy]);

  // Kunci scroll body saat menu mobile terbuka.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    activeSpy && href.includes("#") && href.split("#")[1] === active;

  const linkBase =
    "rounded text-sm font-medium transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-18 items-center justify-between py-3">
        <BrandLogo href="/" size={44} />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigasi utama">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "true" : undefined}
              className={cn(linkBase, isActive(n.href) ? "text-brand" : "text-body")}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Masuk Absensi</Link>
          </Button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-border text-ink transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 lg:hidden"
            aria-label="Buka menu navigasi"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <div id="mobile-menu" className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 cursor-default bg-navy/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-80 max-w-[85%] flex-col border-l border-border bg-background p-6 shadow-card">
            <div className="flex items-center justify-between">
              <BrandLogo href="/" size={40} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-lg border border-border text-ink hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-8 flex flex-col gap-1" aria-label="Navigasi mobile">
              {NAV.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-body transition-colors hover:bg-secondary hover:text-brand"
                >
                  {n.label}
                </a>
              ))}
            </nav>
            <Button asChild size="lg" className="mt-6 w-full">
              <Link href="/login" onClick={() => setOpen(false)}>
                Masuk Absensi
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
