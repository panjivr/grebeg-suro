import type { MetadataRoute } from "next";

const SITE = "https://grebegsuro.my.id";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/berita`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${SITE}/volunteer-grebeg-suro`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE}/volunteer-grebeg-suro/daftar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    { url: `${SITE}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
