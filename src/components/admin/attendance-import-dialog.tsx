"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Summary {
  dryRun: boolean;
  totalEvents: number;
  totalSessions: number;
  matchedVolunteers: number;
  willCreate: number;
  created: number;
  skippedExisting: number;
  skippedDuplicateInFile: number;
  unmatched: { name: string; count: number }[];
  matchedPreview: { from: string; to: string; score: number }[];
}

/**
 * Impor absensi historis (data sebelum web ada) dari ekspor xlsx aplikasi lama.
 * Alur: pilih file -> pratinjau (dry-run) -> konfirmasi impor. Idempotent:
 * hanya menambah (user, tanggal) yang belum ada.
 */
export function AttendanceImportDialog({ onImported }: { onImported?: () => void }) {
  const [open, setOpen] = useState(false);
  const [fileB64, setFileB64] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFileB64(null);
    setFileName("");
    setSummary(null);
    setDone(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onFile(file: File) {
    if (!/\.xlsx$/i.test(file.name)) {
      toast.error("File harus berformat .xlsx");
      return;
    }
    setFileName(file.name);
    setSummary(null);
    setDone(false);
    const b64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("read"));
      reader.readAsDataURL(file);
    });
    setFileB64(b64);
    await preview(b64);
  }

  async function preview(b64: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/attendance/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64: b64, dryRun: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal membaca file");
        return;
      }
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }

  async function runImport() {
    if (!fileB64) return;
    setImporting(true);
    try {
      const res = await fetch("/api/admin/attendance/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64: fileB64, dryRun: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal mengimpor");
        return;
      }
      setSummary(data);
      setDone(true);
      toast.success(`Berhasil mengimpor ${data.created} catatan kehadiran`);
      onImported?.();
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="h-4 w-4" /> Impor Data Lama
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Impor Absensi Data Lama (Excel)</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Gabungkan absensi dari aplikasi lama (sebelum web ini ada). Sistem mencocokkan nama
          dengan akun volunteer dan hanya menambah hari yang belum tercatat — aman dijalankan
          berulang.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />

        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={loading || importing}>
          <FileSpreadsheet className="h-4 w-4" /> {fileName || "Pilih file .xlsx"}
        </Button>

        {loading && (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Membaca & mencocokkan…
          </div>
        )}

        {summary && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Stat label="Total event" value={summary.totalEvents} />
              <Stat label="Sesi (orang-hari)" value={summary.totalSessions} />
              <Stat label="Volunteer cocok" value={summary.matchedVolunteers} />
              <Stat
                label={done ? "Tercatat dibuat" : "Akan dibuat"}
                value={done ? summary.created : summary.willCreate}
                highlight
              />
              <Stat label="Dilewati (sudah ada)" value={summary.skippedExisting} />
              <Stat label="Duplikat di file" value={summary.skippedDuplicateInFile} />
            </div>

            {done && (
              <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                <CheckCircle2 className="h-5 w-5" /> Impor selesai. {summary.created} catatan
                kehadiran ditambahkan.
              </div>
            )}

            {summary.unmatched.length > 0 && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-warning">
                  <AlertTriangle className="h-4 w-4" /> {summary.unmatched.length} nama tidak cocok
                  (dilewati)
                </div>
                <p className="mb-2 text-xs text-muted-foreground">
                  Nama berikut tidak ada akunnya di sistem. Buat/perbaiki akun lalu impor ulang.
                </p>
                <div className="max-h-28 overflow-y-auto text-xs text-body">
                  {summary.unmatched.map((u) => (
                    <div key={u.name}>
                      • {u.name} {u.count > 1 && <span className="text-muted-foreground">({u.count})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!done && summary.matchedPreview.length > 0 && (
              <details className="rounded-lg border border-border bg-secondary/30 p-3 text-xs">
                <summary className="cursor-pointer font-medium text-ink">
                  Lihat pencocokan nama ({summary.matchedPreview.length})
                </summary>
                <div className="mt-2 max-h-40 space-y-0.5 overflow-y-auto text-muted-foreground">
                  {summary.matchedPreview.map((m, i) => (
                    <div key={i} className="flex justify-between gap-2">
                      <span className="truncate">{m.from}</span>
                      <span className="shrink-0">→ {m.to} ({m.score})</span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {!done && (
              <Button className="w-full" onClick={runImport} disabled={importing || summary.willCreate === 0}>
                {importing ? <Loader2 className="animate-spin" /> : <Upload />}
                {summary.willCreate === 0
                  ? "Tidak ada data baru untuk diimpor"
                  : `Impor ${summary.willCreate} catatan sekarang`}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-2.5">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`font-display text-xl font-bold ${highlight ? "text-brand" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}
