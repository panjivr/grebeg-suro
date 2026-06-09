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

const SITE = "https://grebegsuro.my.id";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Grebeg Suro Ponorogo 2026 — Festival Nasional Reog Ponorogo",
    template: "%s | Grebeg Suro Ponorogo",
  },
  description:
    "Pusat informasi Grebeg Suro Ponorogo 2026: sejarah, jadwal, rangkaian acara, Festival Nasional Reog Ponorogo (FNRP), Larungan Risalah Doa Telaga Ngebel, dan Volunteer Grebeg Suro — penggerak di balik festival.",
  applicationName: "Grebeg Suro Ponorogo",
  keywords: [
    "Grebeg Suro",
    "Grebeg Suro Ponorogo",
    "Grebeg Suro 2026",
    "jadwal Grebeg Suro 2026",
    "Reog Ponorogo",
    "Festival Nasional Reog Ponorogo",
    "FNRP 2026",
    "Volunteer Grebeg Suro",
    "Telaga Ngebel",
    "Reog Ponorogo UNESCO",
  ],
  authors: [{ name: "Volunteer Grebeg Suro" }],
  creator: "Volunteer Grebeg Suro",
  publisher: "Volunteer Grebeg Suro",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/brand/icon.png", type: "image/png" },
      { url: "/brand/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/brand/icon-512.png",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE,
    siteName: "Grebeg Suro Ponorogo",
    title: "Grebeg Suro Ponorogo 2026 — Festival Nasional Reog Ponorogo",
    description:
      "Pesta rakyat tahunan Ponorogo menyambut 1 Suro — Festival Nasional Reog Ponorogo (FNRP) ke-XXXI & Larungan Telaga Ngebel. Digerakkan oleh Volunteer Grebeg Suro.",
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "Grebeg Suro Ponorogo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grebeg Suro Ponorogo 2026",
    description:
      "Sejarah, jadwal & rangkaian Grebeg Suro Ponorogo serta Festival Nasional Reog Ponorogo.",
    images: ["/brand/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#7A0E16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Volunteer Grebeg Suro",
  url: SITE,
  logo: `${SITE}/brand/logo.png`,
  description:
    "Gerakan relawan pemuda Ponorogo penggerak di balik Festival Nasional Reog Ponorogo & Grebeg Suro.",
  sameAs: ["https://www.instagram.com/grebegsuroponorogo"],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </body>
    </html>
  );
}
