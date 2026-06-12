"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy,
  Download,
  Loader2,
  Mail,
  MessageCircle,
  Save,
  Search,
  Trash2,
  UserSearch,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { formatDateShort } from "@/lib/utils";
import {
  REGISTRATION_STATUSES,
  divisionName,
  registrationStatusLabels,
  statusMessage,
  waNumber,
  type RegistrationStatusValue,
} from "@/lib/registration-data";

interface RegistrationRow {
  id: string;
  regNumber: string;
  nama: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  statusNikah: string;
  whatsapp: string;
  email: string | null;
  alamat: string;
  pendidikan: string;
  pekerjaan: string | null;
  kontakDarurat: string;
  ukuranKaos: string;
  divisiUtama: string;
  divisiCadangan: string | null;
  motivasi: string;
  pengalaman: string | null;
  keahlian: string[];
  kendaraan: string;
  sim: string;
  kondisiFisik: string;
  ketersediaan: string;
  tanggalTersedia: string | null;
  riwayatPenyakit: string | null;
  golonganDarah: string | null;
  sumberInfo: string | null;
  status: RegistrationStatusValue;
  catatan: string | null;
  createdAt: string;
}

const statusTone: Record<RegistrationStatusValue, string> = {
  BARU: "border-border text-muted-foreground",
  LOLOS_BERKAS: "border-brand/40 text-brand",
  WAWANCARA: "border-warning/40 text-warning",
  LOLOS: "border-success/40 text-success",
  CADANGAN: "border-cyan/40 text-cyan",
  TIDAK_LOLOS: "border-error/40 text-error",
};

const selectClass =
  "flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20";

export function RegistrationsPanel() {
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [detail, setDetail] = useState<RegistrationRow | null>(null);
  const [editStatus, setEditStatus] = useState<RegistrationStatusValue>("BARU");
  const [editCatatan, setEditCatatan] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/registrations");
      const data = await res.json();
      if (!res.ok) return void toast.error(data.error ?? "Gagal memuat pendaftar");
      setRows(data.registrations ?? []);
      setCounts(data.counts ?? {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.nama.toLowerCase().includes(q) ||
        r.regNumber.toLowerCase().includes(q) ||
        r.whatsapp.includes(q) ||
        divisionName(r.divisiUtama).toLowerCase().includes(q)
      );
    });
  }, [rows, query, statusFilter]);

  function openDetail(r: RegistrationRow) {
    setDetail(r);
    setEditStatus(r.status);
    setEditCatatan(r.catatan ?? "");
  }

  async function saveDetail() {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/registrations/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus, catatan: editCatatan.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) return void toast.error(data.error ?? "Gagal menyimpan");
      toast.success("Status pendaftar diperbarui");
      setDetail({ ...detail, status: editStatus, catatan: editCatatan.trim() || null });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(r: RegistrationRow) {
    if (!confirm(`Hapus pendaftar ${r.nama} (${r.regNumber})? Data tidak bisa dikembalikan.`))
      return;
    const res = await fetch(`/api/admin/registrations/${r.id}`, { method: "DELETE" });
    if (!res.ok) return void toast.error("Gagal menghapus");
    toast.success("Pendaftar dihapus");
    setDetail(null);
    load();
  }

  // Pesan pengumuman mengikuti STATUS YANG SEDANG DIPILIH di dialog,
  // sehingga admin bisa pratinjau pesan sebelum/menyimpan status baru.
  const message = detail
    ? statusMessage({
        status: editStatus,
        nama: detail.nama,
        regNumber: detail.regNumber,
        divisi: divisionName(detail.divisiUtama),
      })
    : null;

  function copyMessage() {
    if (!message) return;
    navigator.clipboard
      .writeText(message.body)
      .then(() => toast.success("Pesan disalin ke clipboard"))
      .catch(() => toast.error("Gagal menyalin"));
  }

  const exportHref = `/api/admin/registrations/export${statusFilter ? `?status=${statusFilter}` : ""}`;
  const totalLabel = REGISTRATION_STATUSES.map(
    (s) => `${registrationStatusLabels[s]}: ${counts[s] ?? 0}`
  ).join(" · ");

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Pendaftar Volunteer 2027
            </h2>
            <p className="text-sm text-muted-foreground">
              {rows.length} pendaftar masuk{rows.length > 0 && ` · ${totalLabel}`}
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <a href={exportHref}>
              <Download className="h-4 w-4" /> Ekspor Excel
            </a>
          </Button>
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cari nama, no. pendaftaran, WA, atau divisi…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className={`${selectClass} h-11 sm:w-56`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua status</option>
            {REGISTRATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {registrationStatusLabels[s]} ({counts[s] ?? 0})
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <UserSearch className="h-8 w-8" />
            <p className="text-sm">
              {rows.length === 0
                ? "Belum ada pendaftar masuk. Bagikan tautan /volunteer-grebeg-suro/daftar."
                : "Tidak ada pendaftar yang cocok dengan filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Reg</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Daftar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => openDetail(r)}>
                    <TableCell className="font-mono text-xs font-semibold text-brand">
                      {r.regNumber}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-ink">{r.nama}</p>
                      <p className="text-xs text-muted-foreground">{r.pendidikan}</p>
                    </TableCell>
                    <TableCell className="text-sm">{divisionName(r.divisiUtama)}</TableCell>
                    <TableCell className="text-sm">{r.whatsapp}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusTone[r.status]}>
                        {registrationStatusLabels[r.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateShort(r.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(r);
                        }}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ===== Dialog detail pendaftar ===== */}
        <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            {detail && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-brand">{detail.regNumber}</span>
                    {detail.nama}
                    <Badge variant="outline" className={statusTone[detail.status]}>
                      {registrationStatusLabels[detail.status]}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                  {(
                    [
                      ["NIK", detail.nik],
                      ["TTL", `${detail.tempatLahir}, ${formatDateShort(detail.tanggalLahir)}`],
                      ["Jenis Kelamin", detail.jenisKelamin],
                      ["Status Nikah", detail.statusNikah],
                      ["WhatsApp", detail.whatsapp],
                      ["Email", detail.email ?? "—"],
                      ["Pendidikan", detail.pendidikan],
                      ["Pekerjaan", detail.pekerjaan ?? "—"],
                      ["Kontak Darurat", detail.kontakDarurat],
                      ["Ukuran Kaos", detail.ukuranKaos],
                      ["Divisi Utama", divisionName(detail.divisiUtama)],
                      ["Divisi Cadangan", divisionName(detail.divisiCadangan)],
                      ["Kendaraan / SIM", `${detail.kendaraan} / ${detail.sim}`],
                      ["Kondisi Fisik", detail.kondisiFisik],
                      ["Ketersediaan", detail.ketersediaan],
                      ["Tgl Tersedia", detail.tanggalTersedia ?? "—"],
                      ["Riwayat Penyakit", detail.riwayatPenyakit ?? "—"],
                      ["Gol. Darah", detail.golonganDarah ?? "—"],
                      ["Sumber Info", detail.sumberInfo ?? "—"],
                      ["Tanggal Daftar", formatDateShort(detail.createdAt)],
                    ] as [string, string][]
                  ).map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3 border-b border-border/60 py-1.5">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-right font-medium text-ink">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">Alamat</p>
                  <p className="text-ink">{detail.alamat}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">Keahlian</p>
                  <p className="text-ink">{detail.keahlian.join(", ") || "—"}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">Motivasi</p>
                  <p className="whitespace-pre-wrap text-ink">{detail.motivasi}</p>
                </div>
                {detail.pengalaman && (
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Pengalaman</p>
                    <p className="whitespace-pre-wrap text-ink">{detail.pengalaman}</p>
                  </div>
                )}

                {/* Status seleksi + catatan */}
                <div className="rounded-xl border border-border bg-secondary/40 p-4">
                  <p className="mb-3 text-sm font-semibold text-ink">Status Seleksi</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status</Label>
                      <select
                        className={selectClass}
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as RegistrationStatusValue)}
                      >
                        {REGISTRATION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {registrationStatusLabels[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Catatan internal (hasil wawancara dll.)</Label>
                      <Textarea
                        className="min-h-[40px]"
                        value={editCatatan}
                        onChange={(e) => setEditCatatan(e.target.value)}
                        placeholder="Opsional"
                      />
                    </div>
                  </div>
                  <Button size="sm" className="mt-3" onClick={saveDetail} disabled={saving}>
                    {saving ? <Loader2 className="animate-spin" /> : <Save />} Simpan Status
                  </Button>
                </div>

                {/* Kirim pengumuman */}
                {message && (
                  <div className="rounded-xl border border-brand/25 bg-brand/5 p-4">
                    <p className="text-sm font-semibold text-ink">
                      Kirim Info ke Pendaftar — {registrationStatusLabels[editStatus]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Template mengikuti status yang dipilih di atas. Pesan masih bisa disunting di
                      WhatsApp/Email sebelum benar-benar terkirim.
                    </p>
                    <pre className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-background/60 p-3 text-xs leading-relaxed text-body">
                      {message.body}
                    </pre>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild size="sm" className="bg-success text-white hover:bg-success/90">
                        <a
                          href={`https://wa.me/${waNumber(detail.whatsapp)}?text=${encodeURIComponent(message.body)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle /> Kirim WhatsApp
                        </a>
                      </Button>
                      {detail.email ? (
                        <Button asChild size="sm" variant="outline">
                          <a
                            href={`mailto:${detail.email}?subject=${encodeURIComponent(message.subject)}&body=${encodeURIComponent(message.body)}`}
                          >
                            <Mail /> Kirim Email
                          </a>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled title="Pendaftar tidak mengisi email">
                          <Mail /> Email tidak tersedia
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={copyMessage}>
                        <Copy /> Salin Pesan
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button size="sm" variant="ghost" className="text-error" onClick={() => remove(detail)}>
                    <Trash2 className="h-4 w-4" /> Hapus Pendaftar
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
