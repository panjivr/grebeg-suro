"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  ImageOff,
  Inbox,
  Loader2,
  RefreshCw,
  ScanFace,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BrandLogo } from "@/components/brand-logo";
import { descriptorFromImageUrl } from "@/lib/face-client";
import { formatDateShort, formatTime, initials } from "@/lib/utils";

interface ReviewRecord {
  id: string;
  workDate: string;
  clockIn: string | null;
  clockInPhoto: string | null;
  status: string;
  verifyMethod: string | null;
  faceSimilarity: number | null;
  possibleMismatch: boolean;
  faceReviewStatus: string | null;
  faceReviewedAt: string | null;
  user: {
    id: string;
    name: string;
    username: string;
    profilePhoto: string | null;
    division: { name: string } | null;
  };
  matchedUser: { id: string; name: string; username: string } | null;
  referencePhoto: string | null;
  galleryCount: number;
}

interface GalleryStat {
  user: {
    id: string;
    name: string;
    username: string;
    profilePhoto: string | null;
    division: { name: string } | null;
  };
  seedCount: number;
  checkinCount: number;
  totalEmbeddings: number;
  verifyCount7d: number;
  avgSimilarity7d: number | null;
  autoRate7d: number | null;
}

const methodLabels: Record<string, string> = {
  FACE_AUTO: "Terverifikasi Otomatis",
  FACE_LOW_CONF: "Keyakinan Rendah",
  MANUAL_FALLBACK: "Fallback Manual",
};
const methodVariant: Record<string, "success" | "warning" | "secondary"> = {
  FACE_AUTO: "success",
  FACE_LOW_CONF: "warning",
  MANUAL_FALLBACK: "secondary",
};
const reviewLabels: Record<string, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};
const reviewVariant: Record<string, "warning" | "success" | "destructive"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

function galleryHealth(s: GalleryStat): { label: string; variant: "success" | "warning" | "destructive" | "secondary" } {
  if (s.totalEmbeddings === 0) return { label: "Tanpa galeri", variant: "destructive" };
  if (s.avgSimilarity7d === null) return { label: "Belum ada data", variant: "secondary" };
  if (s.avgSimilarity7d >= 0.5 && s.totalEmbeddings >= 5) return { label: "Sehat", variant: "success" };
  if (s.avgSimilarity7d >= 0.35) return { label: "Perlu perhatian", variant: "warning" };
  return { label: "Bermasalah", variant: "destructive" };
}

export function FaceReviewPanel() {
  const [pending, setPending] = useState<ReviewRecord[] | null>(null);
  const [history, setHistory] = useState<ReviewRecord[] | null>(null);
  const [stats, setStats] = useState<GalleryStat[] | null>(null);
  const [addToGallery, setAddToGallery] = useState<Record<string, boolean>>({});
  const [acting, setActing] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    try {
      const data = await fetch("/api/admin/face-review?status=PENDING").then((r) => r.json());
      setPending(data.records ?? []);
    } catch {
      toast.error("Gagal memuat antrian review");
      setPending([]);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await fetch("/api/admin/face-review?status=ALL").then((r) => r.json());
      setHistory(
        (data.records ?? []).filter((r: ReviewRecord) => r.faceReviewStatus !== "PENDING")
      );
    } catch {
      setHistory([]);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetch("/api/admin/face-review/stats").then((r) => r.json());
      setStats(data.stats ?? []);
    } catch {
      setStats([]);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  async function act(record: ReviewRecord, action: "APPROVE" | "REJECT") {
    const withGallery = action === "APPROVE" && Boolean(addToGallery[record.id]);
    setActing(`${record.id}:${action}`);
    try {
      // Mode tanpa face service: embedding dihitung di browser admin dari
      // foto selfie yang sedang ditampilkan, lalu dikirim bersama approve.
      let clientFace: { embedding: number[]; detScore: number } | null = null;
      if (withGallery && record.clockInPhoto) {
        const result = await descriptorFromImageUrl(record.clockInPhoto);
        if (result) clientFace = { embedding: result.descriptor, detScore: result.detScore };
      }
      const res = await fetch(`/api/admin/face-review/${record.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          addToGallery: withGallery,
          ...(clientFace ? clientFace : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal memproses review");
        return;
      }
      toast.success(
        action === "APPROVE" ? "Absensi disetujui" : "Absensi ditolak",
        {
          description: data.addedToGallery
            ? "Embedding wajah ditambahkan ke galeri."
            : undefined,
        }
      );
      setPending((prev) => prev?.filter((r) => r.id !== record.id) ?? null);
      setHistory(null); // muat ulang saat tab riwayat dibuka
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandLogo size={36} withWordmark={false} />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink">Review Verifikasi Wajah</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Grebeg Suro
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Admin
            </Link>
          </Button>
        </div>
      </header>

      <main className="container space-y-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
              <ScanFace className="h-6 w-6 text-brand" /> Verifikasi Wajah
            </h1>
            <p className="text-sm text-muted-foreground">
              Tinjau absensi berkeyakinan rendah, fallback manual, dan indikasi titip absen.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setPending(null);
              loadPending();
              setHistory(null);
              setStats(null);
            }}
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        <Tabs
          defaultValue="queue"
          className="w-full"
          onValueChange={(tab) => {
            if (tab === "history" && history === null) loadHistory();
            if (tab === "stats" && stats === null) loadStats();
          }}
        >
          <TabsList>
            <TabsTrigger value="queue">
              <Inbox className="mr-1.5 h-4 w-4" />
              Antrian{pending && pending.length > 0 ? ` (${pending.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="history">
              <ClipboardCheck className="mr-1.5 h-4 w-4" /> Riwayat
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="mr-1.5 h-4 w-4" /> Statistik Galeri
            </TabsTrigger>
          </TabsList>

          {/* ---- Antrian review ---- */}
          <TabsContent value="queue" className="space-y-4">
            {pending === null ? (
              <ReviewSkeleton />
            ) : pending.length === 0 ? (
              <EmptyState text="Tidak ada absensi yang menunggu review. 🎉" />
            ) : (
              pending.map((record) => (
                <Card key={record.id}>
                  <CardContent className="space-y-4 pt-6">
                    {/* Identitas + badge */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {record.user.profilePhoto && (
                            <AvatarImage src={record.user.profilePhoto} />
                          )}
                          <AvatarFallback>{initials(record.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-ink">{record.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            @{record.user.username}
                            {record.user.division ? ` · ${record.user.division.name}` : ""}
                            {` · ${formatDateShort(record.workDate)} ${formatTime(record.clockIn)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {record.verifyMethod && (
                          <Badge variant={methodVariant[record.verifyMethod] ?? "secondary"}>
                            {methodLabels[record.verifyMethod] ?? record.verifyMethod}
                          </Badge>
                        )}
                        {record.faceSimilarity !== null && (
                          <Badge variant="outline">
                            Similarity {record.faceSimilarity.toFixed(2)}
                          </Badge>
                        )}
                        {record.possibleMismatch && (
                          <Badge variant="destructive">
                            <ShieldAlert className="mr-1 h-3 w-3" /> Kemungkinan Mismatch
                          </Badge>
                        )}
                      </div>
                    </div>

                    {record.possibleMismatch && record.matchedUser && (
                      <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
                        ⚠ Wajah pada selfie lebih mirip dengan{" "}
                        <strong>{record.matchedUser.name}</strong> (@
                        {record.matchedUser.username}) — indikasi titip absen.
                      </div>
                    )}

                    {/* Foto side-by-side */}
                    <div className="grid grid-cols-2 gap-3">
                      <PhotoBox label="Selfie Check-in" src={record.clockInPhoto} />
                      <PhotoBox label="Foto Referensi" src={record.referencePhoto} />
                    </div>

                    {/* Aksi */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-brand"
                          checked={Boolean(addToGallery[record.id])}
                          onChange={(e) =>
                            setAddToGallery((prev) => ({
                              ...prev,
                              [record.id]: e.target.checked,
                            }))
                          }
                        />
                        Tambahkan wajah ini ke galeri ({record.galleryCount} embedding)
                      </label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={acting !== null}
                          onClick={() => act(record, "REJECT")}
                        >
                          {acting === `${record.id}:REJECT` ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <XCircle />
                          )}
                          Tolak
                        </Button>
                        <Button
                          size="sm"
                          disabled={acting !== null}
                          onClick={() => act(record, "APPROVE")}
                        >
                          {acting === `${record.id}:APPROVE` ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <CheckCircle2 />
                          )}
                          Setujui
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ---- Riwayat ---- */}
          <TabsContent value="history">
            <Card>
              <CardContent className="pt-6">
                {history === null ? (
                  <ReviewSkeleton rows={3} />
                ) : history.length === 0 ? (
                  <EmptyState text="Belum ada riwayat review." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Volunteer</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Metode</TableHead>
                        <TableHead>Similarity</TableHead>
                        <TableHead className="text-right">Hasil Review</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium text-ink">{r.user.name}</TableCell>
                          <TableCell>
                            {formatDateShort(r.workDate)} {formatTime(r.clockIn)}
                          </TableCell>
                          <TableCell>
                            {r.verifyMethod ? (
                              <Badge variant={methodVariant[r.verifyMethod] ?? "secondary"}>
                                {methodLabels[r.verifyMethod] ?? r.verifyMethod}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {r.faceSimilarity !== null ? r.faceSimilarity.toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={reviewVariant[r.faceReviewStatus ?? ""] ?? "secondary"}>
                              {reviewLabels[r.faceReviewStatus ?? ""] ?? r.faceReviewStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---- Statistik galeri ---- */}
          <TabsContent value="stats">
            <Card>
              <CardContent className="pt-6">
                {stats === null ? (
                  <ReviewSkeleton rows={3} />
                ) : stats.length === 0 ? (
                  <EmptyState text="Belum ada galeri embedding. Jalankan seed atau aktifkan face service." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Volunteer</TableHead>
                        <TableHead className="text-center">Seed</TableHead>
                        <TableHead className="text-center">Check-in</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Verifikasi 7h</TableHead>
                        <TableHead className="text-center">Avg Similarity 7h</TableHead>
                        <TableHead className="text-right">Kesehatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.map((s) => {
                        const health = galleryHealth(s);
                        return (
                          <TableRow key={s.user.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  {s.user.profilePhoto && <AvatarImage src={s.user.profilePhoto} />}
                                  <AvatarFallback className="text-xs">
                                    {initials(s.user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-ink">{s.user.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {s.user.division?.name ?? "-"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center tabular-nums">{s.seedCount}</TableCell>
                            <TableCell className="text-center tabular-nums">{s.checkinCount}</TableCell>
                            <TableCell className="text-center font-medium tabular-nums">
                              {s.totalEmbeddings}
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {s.verifyCount7d}
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {s.avgSimilarity7d !== null ? s.avgSimilarity7d.toFixed(2) : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={health.variant}>{health.label}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function PhotoBox({ label, src }: { label: string; src: string | null }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-secondary/50">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="h-8 w-8" />
            <span className="text-xs">Tidak tersedia</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-2xl" />
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>;
}
