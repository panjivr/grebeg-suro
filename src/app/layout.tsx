import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://grebegsuro.my.id"),
  title: {
    default: "Grebeg Suro Ponorogo — Festival Nasional Reog Ponorogo",
    template: "%s | Grebeg Suro Ponorogo",
  },
  description:
    "Pusat informasi Grebeg Suro Ponorogo: sejarah, rangkaian acara, Festival Nasional Reog Ponorogo, Larungan Risalah Doa Telaga Ngebel, dan sistem absensi relawan resmi.",
  keywords: [
    "Grebeg Suro",
    "Grebeg Suro Ponorogo",
    "Reog Ponorogo",
    "Festival Nasional Reog Ponorogo",
    "Telaga Ngebel",
    "Warisan Budaya UNESCO",
    "absensi relawan",
  ],
  authors: [{ name: "Panitia Grebeg Suro Ponorogo" }],
  icons: {
    icon: "/brand/icon.png",
    apple: "/brand/logo-mark.png",
  },
  openGraph: {
    title: "Grebeg Suro Ponorogo",
    description:
      "Pesta rakyat tahunan Ponorogo menyambut 1 Suro — Festival Nasional Reog Ponorogo & Larungan Telaga Ngebel.",
    type: "website",
    locale: "id_ID",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F9FF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}>
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
