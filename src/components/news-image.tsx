"use client";

import { useState } from "react";

const FALLBACK_COUNT = 3;

function fallbackPath(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return `/news/fallback-${(Math.abs(hash) % FALLBACK_COUNT) + 1}.svg`;
}

/**
 * Foto berita dari /api/news/image (og:image artikel sumber). Bila proksi
 * gagal atau gambar rusak, otomatis jatuh ke ilustrasi fallback lokal.
 */
export function NewsImage({
  articleId,
  alt,
  className,
}: {
  articleId: string;
  alt: string;
  className?: string;
}) {
  const [src, setSrc] = useState(`/api/news/image?id=${encodeURIComponent(articleId)}`);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setSrc(fallbackPath(articleId))}
    />
  );
}
