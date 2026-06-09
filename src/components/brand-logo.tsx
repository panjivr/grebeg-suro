import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  /** true → full horizontal lockup (logo.png); false → flame emblem only (logo-mark.png). */
  withWordmark?: boolean;
  /** Full lockup: rendered height in px (width auto). Mark: square size in px. */
  size?: number;
  /** Wrap in a link to this href. */
  href?: string;
  className?: string;
}

/**
 * Brand logo for Grebeg Suro Ponorogo.
 * Assets live in /public/brand/ — replace logo.png (full lockup) and
 * logo-mark.png (emblem) to swap the logo across the whole app.
 */
export function BrandLogo({
  withWordmark = true,
  size = 40,
  href,
  className,
}: BrandLogoProps) {
  const src = withWordmark ? "/brand/logo.png" : "/brand/logo-mark.png";
  const style = withWordmark
    ? { height: size, width: "auto" as const }
    : { height: size, width: size };

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Grebeg Suro Ponorogo — Festival Nasional Reog Ponorogo"
      style={style}
      draggable={false}
      decoding="async"
      className={cn("select-none", withWordmark ? "w-auto" : "shrink-0", className)}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {img}
      </Link>
    );
  }
  return img;
}
