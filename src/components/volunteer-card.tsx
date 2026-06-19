"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Loader2, Share2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface VolunteerCardData {
  name: string;
  username: string;
  role: string;
  division: string | null;
  jobdesk: string | null;
  photoDataUrl: string | null;
  stars: number;
  totalDays: number;
  totalHours: number;
  durationText: string;
  periodText: string;
  sessions: number;
}

const PALETTE = {
  navy: "#050816",
  panel: "#0A1838",
  panel2: "#0E2150",
  gold: "#D8A93B",
  goldLight: "#F4D88A",
  cyan: "#12E0D3",
  ink: "#F7F9FF",
  body: "#C9D4FF",
  muted: "#8FA0D8",
};

/** Warna aksen per divisi/jobdesk (kata kunci) — seperti "type" kartu. */
function divisionAccent(name: string | null): { from: string; to: string; label: string } {
  const n = (name ?? "").toLowerCase();
  const m: [RegExp, string, string][] = [
    [/aman|security|crowd/, "#FF6B57", "#C21E2B"],
    [/medis|medic|kesehatan|p3k/, "#FF7AA2", "#E0356A"],
    [/media|dokument|publik|konten|foto|video/, "#7C5CFF", "#4B2DC9"],
    [/stage|panggung|artistik/, "#FFB020", "#E08600"],
    [/liaison|lo|tamu|protokol|protocol/, "#12E0D3", "#0E9C93"],
    [/runner|logist|operasional/, "#3DD68C", "#159B5B"],
    [/admin|sekretariat|data|registr/, "#5AA9FF", "#2E6BD6"],
    [/ticket|gate|tiket/, "#FFD24A", "#D8A93B"],
    [/penonton|pelayanan|hospitality|pengunjung/, "#FF9F5A", "#E06A22"],
    [/konsumsi/, "#FF8A5A", "#D85A22"],
    [/transport/, "#9AD0FF", "#3E7BD6"],
    [/humas/, "#8FE0C0", "#2EA98A"],
    [/kebersih/, "#9AE6A0", "#2EA94A"],
  ];
  for (const [re, from, to] of m) if (re.test(n)) return { from, to, label: name ?? "—" };
  return { from: PALETTE.goldLight, to: PALETTE.gold, label: name ?? "Volunteer" };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Visual kartu (di-capture ke PNG). Dimensi tetap agar hasil konsisten. */
function CardArt({
  data,
  innerRef,
}: {
  data: VolunteerCardData;
  innerRef: React.Ref<HTMLDivElement>;
}) {
  const accent = divisionAccent(data.division ?? data.jobdesk);
  return (
    <div
      ref={innerRef}
      style={{
        width: 340,
        boxSizing: "border-box",
        padding: 14,
        borderRadius: 24,
        background: `linear-gradient(160deg, ${accent.from} 0%, ${PALETTE.gold} 18%, ${PALETTE.navy} 55%)`,
        boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
        fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
        color: PALETTE.ink,
      }}
    >
      <div
        style={{
          borderRadius: 18,
          background: `radial-gradient(120% 80% at 50% 0%, ${PALETTE.panel2} 0%, ${PALETTE.navy} 70%)`,
          border: `2px solid rgba(216,169,59,0.55)`,
          padding: 14,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* holografik halus */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 9px)",
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />

        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: PALETTE.gold, fontWeight: 700 }}>
              VOLUNTEER · LV {data.totalDays}
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.1, marginTop: 2, color: PALETTE.ink }}>
              {data.name}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
            <div style={{ fontSize: 9, color: PALETTE.muted, fontWeight: 700 }}>JAM</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: PALETTE.goldLight, lineHeight: 1 }}>
              {data.totalHours}
            </div>
          </div>
        </div>

        {/* foto */}
        <div
          style={{
            marginTop: 10,
            height: 188,
            borderRadius: 14,
            border: `3px solid ${accent.from}`,
            background: `linear-gradient(160deg, ${PALETTE.panel2}, ${PALETTE.panel})`,
            overflow: "hidden",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {data.photoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.photoDataUrl}
              alt={data.name}
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: PALETTE.goldLight,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {initials(data.name)}
            </div>
          )}
          {/* badge divisi */}
          <div
            style={{
              position: "absolute",
              left: 8,
              bottom: 8,
              padding: "4px 10px",
              borderRadius: 999,
              background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
              color: "#0A0A12",
              fontSize: 11,
              fontWeight: 800,
              boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
            }}
          >
            {accent.label}
          </div>
        </div>

        {/* jobdesk + bintang */}
        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: PALETTE.body, minWidth: 0, paddingRight: 8 }}>
            <span style={{ color: PALETTE.muted }}>Jobdesk: </span>
            {data.jobdesk || data.division || "Volunteer"}
          </div>
          <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                size={14}
                style={{ color: i < data.stars ? PALETTE.goldLight : "rgba(255,255,255,0.18)" }}
                fill={i < data.stars ? PALETTE.goldLight : "transparent"}
                strokeWidth={1.5}
              />
            ))}
          </div>
        </div>

        {/* statistik */}
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Stat label="Hari Bertugas" value={`${data.totalDays} hari`} />
          <Stat label="Jam Kerja" value={data.durationText} />
          <div style={{ gridColumn: "1 / span 2" }}>
            <Stat label="Periode Bertugas" value={data.periodText} />
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 8,
            borderTop: "1px solid rgba(216,169,59,0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 9, color: PALETTE.muted, lineHeight: 1.3 }}>
            <div style={{ color: PALETTE.gold, fontWeight: 800, letterSpacing: 1 }}>GREBEG SURO 2026</div>
            <div>Festival Nasional Reog Ponorogo</div>
          </div>
          <div style={{ fontSize: 9, color: PALETTE.muted, fontFamily: "monospace" }}>@{data.username}</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "8px 10px",
      }}
    >
      <div style={{ fontSize: 8.5, letterSpacing: 1, color: PALETTE.muted, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: PALETTE.ink, marginTop: 2 }}>{value}</div>
    </div>
  );
}

/**
 * Modal Kartu Volunteer: ambil data, tampilkan kartu, dan tombol Bagikan/Unduh.
 * - Bagikan: Web Share API (WA/IG/galeri di HP); fallback unduh di desktop.
 * - Unduh: simpan PNG ke perangkat.
 */
export function VolunteerCardModal({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}) {
  const [data, setData] = useState<VolunteerCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setData(null);
    setLoading(true);
    const url = userId
      ? `/api/attendance/card?userId=${encodeURIComponent(userId)}`
      : "/api/attendance/card";
    fetch(url)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Gagal memuat kartu");
        setData(d);
      })
      .catch((e) => toast.error(e.message ?? "Gagal memuat kartu"))
      .finally(() => setLoading(false));
  }, [open, userId]);

  const generate = useCallback(async () => {
    if (!cardRef.current) return null;
    // pastikan font siap agar teks ter-render di gambar
    if (typeof document !== "undefined" && document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        /* ignore */
      }
    }
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2.5, cacheBust: true });
    return dataUrl;
  }, []);

  const slug = (data?.username ?? "volunteer").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const fileName = `kartu-volunteer-${slug}.png`;

  async function handleShare() {
    setBusy(true);
    try {
      const dataUrl = await generate();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], fileName, { type: "image/png" });
      const navAny = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean;
      };
      if (navAny.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          title: "Kartu Volunteer Grebeg Suro",
          text: `Kartu Volunteer Grebeg Suro 2026 — ${data?.name}`,
        });
      } else {
        triggerDownload(dataUrl);
        toast.success("Perangkat tidak mendukung bagikan langsung — gambar diunduh.");
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") toast.error("Gagal membuat gambar kartu");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    setBusy(true);
    try {
      const dataUrl = await generate();
      if (dataUrl) {
        triggerDownload(dataUrl);
        toast.success("Kartu tersimpan sebagai gambar");
      }
    } catch {
      toast.error("Gagal membuat gambar kartu");
    } finally {
      setBusy(false);
    }
  }

  function triggerDownload(dataUrl: string) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kartu Volunteer</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {loading ? (
            <div className="flex h-[460px] items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat kartu…
            </div>
          ) : data ? (
            <>
              <CardArt data={data} innerRef={cardRef} />
              <div className="flex w-full gap-2">
                <Button className="flex-1" onClick={handleShare} disabled={busy}>
                  {busy ? <Loader2 className="animate-spin" /> : <Share2 />} Bagikan
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleDownload} disabled={busy}>
                  <Download /> Unduh
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Bagikan ke WhatsApp/Instagram atau simpan ke galeri. Di laptop, kartu akan
                terunduh sebagai gambar.
              </p>
            </>
          ) : (
            <p className="py-10 text-sm text-muted-foreground">Data kartu tidak tersedia.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
