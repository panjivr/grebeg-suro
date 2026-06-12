import { NextRequest, NextResponse } from "next/server";
import { getNewsArticle } from "@/lib/news-data";

/**
 * Proksi foto berita: mengambil og:image dari artikel sumber lalu meneruskannya
 * dengan header cache CDN. Hanya artikel yang ada di kurasi NEWS_ARTICLES yang
 * bisa diminta (bukan open proxy). Bila gagal (situs memblokir/timeout),
 * dialihkan ke ilustrasi fallback lokal sehingga halaman tetap rapi.
 */

export const runtime = "nodejs";

const FALLBACK_COUNT = 3;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
};

function fallbackPath(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return `/news/fallback-${(Math.abs(hash) % FALLBACK_COUNT) + 1}.svg`;
}

function extractOgImage(html: string): string | null {
  const metas =
    html.match(/<meta\s[^>]*(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["'][^>]*>/gi) ??
    [];
  for (const tag of metas) {
    const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
    if (content) return content;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const article = getNewsArticle(id);
  const fallback = () =>
    NextResponse.redirect(new URL(fallbackPath(id), req.url), {
      status: 302,
      headers: { "Cache-Control": "public, max-age=300" },
    });

  if (!article) return fallback();

  try {
    const pageRes = await fetch(article.url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 },
    });
    if (!pageRes.ok) return fallback();

    const og = extractOgImage(await pageRes.text());
    if (!og) return fallback();

    const imageUrl = new URL(og, article.url);
    if (imageUrl.protocol !== "https:" && imageUrl.protocol !== "http:") return fallback();

    const imgRes = await fetch(imageUrl, {
      headers: { ...BROWSER_HEADERS, Referer: article.url },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 },
    });
    const contentType = imgRes.headers.get("content-type") ?? "";
    if (!imgRes.ok || !contentType.startsWith("image/")) return fallback();

    return new NextResponse(await imgRes.arrayBuffer(), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return fallback();
  }
}
