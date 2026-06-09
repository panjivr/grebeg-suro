import type { MetadataRoute } from "next";

const SITE = "https://grebegsuro.my.id";

const PRIVATE = ["/admin", "/dashboard", "/api"];

// AI / generative-engine crawlers yang diizinkan mengindeks halaman publik.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "ClaudeBot",
  "Claude-Web",
  "Applebot-Extended",
  "CCBot",
  "Amazonbot",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_BOTS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
