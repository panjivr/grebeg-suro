"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, FileSpreadsheet, FileText, RefreshCw, Radio, ImageIcon, Download, IdCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSupabaseBrowser } from "@/lib/supabase";
import { AttendanceImportDialog } from "@/components/admin/attendance-import-dialog";
import { VolunteerCardModal } from "@/components/volunteer-card";
import { formatTime, formatDateShort, initials, statusLabels } from "@/lib/utils";

interface AttRecord {
  id: string;
  clockIn: string | null;
  clockOut: string | null;
  clockInPhoto: string | null;
  status: string;
  workDate: string;
  user: { id: string; name: string; profilePhoto: string | null; division: { name: string } | null };
}

const statusVariant: Record<string, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  PRESENT: "success",
  LATE: "warning",
  ABSENT: "destructive",
  ON_DUTY: "default",
};

export function AttendancePanel({ live = false }: { live?: boolean }) {
  const [records, setRecords] = useState<AttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [preview, setPreview] = useState<{ url: string; name: string; date: string } | null>(null);
  const [cardUserId, setCardUserId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function downloadPhoto(url: string, filename: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  }

  const load = useCallback(async () => {
    const url = live ? `/api/admin/attendance?date=${today}` : `/api/admin/attendance?all=true`;
    const data = await fetch(url).then((r) => r.json());
    setRecords(data.records ?? []);
    setLoading(false);
  }, [live, today]);

  useEffect(() => {
    load();
    if (live) {
      // Realtime via Supabase if configured, else poll every 15s
      const supabase = getSupabaseBrowser();
      if (supabase) {
        const channel = supabase
          .channel("attendance-live")
          .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => load())
          .subscribe();
        return () => {
          supabase.removeChannel(channel);
        };
      }
      intervalRef.current = setInterval(load, 15000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [live, load]);

  function exportFile(format: "excel" | "pdf") {
    window.open(`/api/admin/export?format=${format}&date=${today}`, "_blank");
  }

  return (
    <>
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {live && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                <Radio className="h-4 w-4 animate-pulse" /> Live
              </span>
            )}
            <h2 className="font-display text-lg font-semibold text-ink">
              {live ? "Monitoring Kehadiran Hari Ini" : "Log Absensi"}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={load}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {!live && <AttendanceImportDialog onImported={load} />}
            <Button size="sm" variant="outline" onClick={() => exportFile("excel")}>
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportFile("pdf")}>
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat…
          </div>
        ) : records.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Belum ada data absensi.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Volunteer</TableHead>
                <TableHead>Divisi</TableHead>
                {!live && <TableHead>Tanggal</TableHead>}
                <TableHead>Masuk</TableHead>
                <TableHead>Keluar</TableHead>
                <TableHead>Selfie</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {r.user.profilePhoto && <AvatarImage src={r.user.profilePhoto} />}
                        <AvatarFallback className="text-xs">{initials(r.user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{r.user.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="ml-auto h-7 w-7 shrink-0"
                        title="Kartu volunteer"
                        aria-label={`Kartu volunteer ${r.user.name}`}
                        onClick={() => setCardUserId(r.user.id)}
                      >
                        <IdCard className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.user.division?.name ?? "-"}</TableCell>
                  {!live && <TableCell>{formatDateShort(r.workDate)}</TableCell>}
                  <TableCell className="tabular-nums">{formatTime(r.clockIn)}</TableCell>
                  <TableCell className="tabular-nums">{formatTime(r.clockOut)}</TableCell>
                  <TableCell>
                    {r.clockInPhoto ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreview({ url: r.clockInPhoto!, name: r.user.name, date: r.workDate })
                        }
                        className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        title="Lihat foto absensi"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.clockInPhoto} alt={`Selfie ${r.user.name}`} className="h-8 w-8 rounded-md object-cover ring-1 ring-brand/30" />
                      </button>
                    ) : (
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={statusVariant[r.status] ?? "default"}>
                      {statusLabels[r.status] ?? r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Foto Absensi — {preview?.name}</DialogTitle>
          </DialogHeader>
          {preview && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt={`Selfie ${preview.name}`}
                className="w-full rounded-xl border border-border object-contain"
              />
              <Button
                onClick={() =>
                  downloadPhoto(
                    preview.url,
                    `${preview.name.replace(/\s+/g, "_")}-${preview.date.slice(0, 10)}-clockin.jpg`
                  )
                }
              >
                <Download /> Unduh Foto
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <VolunteerCardModal
        open={!!cardUserId}
        onOpenChange={(o) => !o && setCardUserId(null)}
        userId={cardUserId ?? undefined}
      />
    </>
  );
}
