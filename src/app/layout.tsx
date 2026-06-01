import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Volunteer Grebeg Suro — Sistem Absensi Relawan",
    template: "%s | Volunteer Grebeg Suro",
  },
  description:
    "Sistem Absensi Relawan untuk Grebeg Suro & Festival Nasional Reog Ponorogo. Clock-in/out dengan validasi GPS dan verifikasi selfie.",
  keywords: ["Grebeg Suro", "Reog Ponorogo", "absensi relawan", "festival nasional"],
  authors: [{ name: "Panitia Grebeg Suro" }],
  openGraph: {
    title: "Volunteer Grebeg Suro",
    description: "Sistem Absensi Relawan Festival Nasional Reog Ponorogo",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0d0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "glass !text-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
