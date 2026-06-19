"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clock,
  LogIn,
  LogOut as LogOutIcon,
  CalendarClock,
  History,
  MapPin,
  Sparkles,
  Loader2,
  ShieldCheck,
  Camera,
  Cake,
  Hourglass,
  IdCard,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttendanceCapture } from "@/components/attendance-capture";
import { VolunteerCardModal } from "@/components/volunteer-card";
import { LogoutButton } from "@/components/logout-button";
import { BrandLogo } from "@/components/brand-logo";
import {
  ProfileDetails,
  birthdayInfo,
  type VolunteerProfileData,
} from "@/components/profile-details";
import { cn, formatTime, formatDate, formatDateShort, initials, roleLabels, statusLabels } from "@/lib/utils";

interface UserLite {
  id: string;
  name: string;
  username: string;
  role: string;
  profilePhoto: string | null;
  shift: string | null;
  division: { id: string; name: string } | null;
}
interface EventLite {
  eventName: string;
  radiusMeter: number;
  shiftStart: string;
}
interface AttendanceRecord {
  id: string;
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  workDate: string;
  verifyMethod?: string | null;
}

const statusVariant: Record<string, "success" | "warning" | "destructive" | "default"> = {
  PRESENT: "success",
  LATE: "warning",
  ABSENT: "destructive",
  ON_DUTY: "default",
};

/** Durasi ms -> teks Indonesia. withSeconds untuk timer live. */
function formatDuration(ms: number, withSeconds = false): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (withSeconds) return `${h} j ${m} m ${s} d`;
  if (h > 0) return `${h} jam ${m} menit`;
  return `${m} menit`;
}

export function VolunteerDashboard({
  user,
  event,
  profile,
}: {
  user: UserLite;
  event: EventLite | null;
  profile: VolunteerProfileData | null;
}) {
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [capture, setCapture] = useState<{ open: boolean; mode: "clock-in" | "clock-out" }>({
    open: false,
    mode: "clock-in",
  });
  const [now, setNow] = useState(new Date());
  const [cardOpen, setCardOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user.profilePhoto);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance");
      const data = await res.json();
      setToday(data.today);
      setHistory(data.history ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Ganti foto profil: pilih file -> kompres via canvas -> simpan. */
  async function changePhoto(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    setUploadingPhoto(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const size = Math.min(img.width, img.height);
          const canvas = document.createElement("canvas");
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("canvas"));
          // Center-crop persegi lalu kecilkan ke 512px
          ctx.drawImage(
            img,
            (img.width - size) / 2,
            (img.height - size) / 2,
            size,
            size,
            0,
            0,
            512,
            512
          );
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("load"));
        };
        img.src = url;
      });

      const res = await fetch("/api/profile/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal mengganti foto profil");
        return;
      }
      setProfilePhoto(data.profilePhoto);
      toast.success("Foto profil diperbarui");
    } catch {
      toast.error("Gagal memproses gambar");
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  // Durasi bertugas dari riwayat clock-in/out (+ sesi berjalan secara live)
  const completedMs = history.reduce((acc, r) => {
    if (r.clockIn && r.clockOut) {
      return acc + Math.max(0, +new Date(r.clockOut) - +new Date(r.clockIn));
    }
    return acc;
  }, 0);
  const ongoingMs =
    today?.clockIn && !today.clockOut
      ? Math.max(0, now.getTime() - +new Date(today.clockIn))
      : 0;
  const daysWorked = history.filter((r) => r.clockIn).length;
  const bday = profile ? birthdayInfo(profile.birthDate, now) : null;

  const hasClockedIn = Boolean(today?.clockIn);
  const hasClockedOut = Boolean(today?.clockOut);

  const todayStatus = !hasClockedIn
    ? "BELUM ABSEN"
    : hasClockedOut
      ? "SELESAI"
      : "BERTUGAS";

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandLogo size={36} withWordmark={false} />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink">Dashboard Volunteer</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Grebeg Suro
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="container space-y-6 py-6">
        {/* Profile card */}
        <Card className="overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-brand/15 via-brand/5 to-transparent grid-texture" />
          <CardContent className="-mt-10 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-card ring-2 ring-brand/30">
                    {profilePhoto && <AvatarImage src={profilePhoto} alt={user.name} />}
                    <AvatarFallback className="text-xl">{initials(user.name)}</AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    title="Ganti foto profil"
                    aria-label="Ganti foto profil"
                    className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-card bg-brand text-white shadow-soft transition hover:brightness-110 disabled:opacity-60"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) changePhoto(file);
                    }}
                  />
                </div>
                <div className="mb-1">
                  <h1 className="font-display text-2xl font-bold text-ink">{user.name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="default">{roleLabels[user.role] ?? user.role}</Badge>
                    {user.division && <Badge variant="outline">{user.division.name}</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <Badge
                  variant={hasClockedOut ? "secondary" : hasClockedIn ? "success" : "warning"}
                  className="px-3 py-1 text-sm"
                >
                  {todayStatus}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => setCardOpen(true)}>
                  <Share2 /> Kartu Volunteer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live clock + actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="mb-3 h-7 w-7 text-brand" />
              <div className="font-display text-5xl font-bold tabular-nums tracking-tight text-ink">
                {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}
                <span className="text-2xl text-muted-foreground">
                  :{now.toLocaleTimeString("id-ID", { second: "2-digit", timeZone: "Asia/Jakarta" }).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{formatDate(now)}</p>
            </CardContent>
          </Card>

          {/* Clock In/Out summary */}
          <Card className="lg:col-span-2">
            <CardContent className="grid h-full gap-4 py-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-secondary/50 p-5">
                <div className="flex items-center gap-2 text-success">
                  <LogIn className="h-5 w-5" />
                  <span className="text-sm font-medium">Clock In</span>
                </div>
                <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">
                  {formatTime(today?.clockIn)}
                </p>
                {today?.verifyMethod === "FACE_AUTO" && (
                  <Badge variant="success" className="mt-2 gap-1">
                    <ShieldCheck className="h-3 w-3" /> Wajah terverifikasi
                  </Badge>
                )}
                <Button
                  className="mt-4 w-full"
                  disabled={hasClockedIn}
                  onClick={() => setCapture({ open: true, mode: "clock-in" })}
                >
                  <LogIn /> {hasClockedIn ? "Sudah Clock In" : "Clock In Sekarang"}
                </Button>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/50 p-5">
                <div className="flex items-center gap-2 text-error">
                  <LogOutIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Clock Out</span>
                </div>
                <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">
                  {formatTime(today?.clockOut)}
                </p>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  disabled={!hasClockedIn || hasClockedOut}
                  onClick={() => setCapture({ open: true, mode: "clock-out" })}
                >
                  <LogOutIcon /> {hasClockedOut ? "Sudah Clock Out" : "Clock Out Sekarang"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info strip */}
        <div className="grid gap-4 sm:grid-cols-3">
          <InfoTile icon={CalendarClock} label="Shift" value={user.shift ?? "Belum diatur"} />
          <InfoTile icon={Sparkles} label="Event" value={event?.eventName ?? "Grebeg Suro"} />
          <InfoTile
            icon={MapPin}
            label="Radius Absensi"
            value={event ? `${event.radiusMeter} meter dari venue` : "—"}
          />
        </div>

        {/* Durasi bertugas + hitung mundur ulang tahun */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className={bday ? "" : "lg:col-span-2"}>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center gap-2">
                <Hourglass className="h-5 w-5 text-brand" />
                <h2 className="font-display text-lg font-semibold text-ink">Durasi Bertugas</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-secondary/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Total Durasi
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums text-ink">
                    {formatDuration(completedMs + ongoingMs)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Hari Bertugas
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums text-ink">
                    {daysWorked} hari
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Sesi Hari Ini
                  </p>
                  <p
                    className={cn(
                      "mt-1 font-display text-2xl font-bold tabular-nums",
                      ongoingMs > 0 ? "text-success" : "text-ink"
                    )}
                  >
                    {ongoingMs > 0 ? formatDuration(ongoingMs, true) : "—"}
                  </p>
                  {ongoingMs > 0 && (
                    <p className="text-xs text-muted-foreground">sedang bertugas…</p>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Dihitung dari riwayat clock-in/out Anda (maks. 30 catatan terakhir).
              </p>
            </CardContent>
          </Card>

          {bday && (
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center gap-2">
                  <Cake className="h-5 w-5 text-brand" />
                  <h2 className="font-display text-lg font-semibold text-ink">Ulang Tahun</h2>
                </div>
                {bday.isToday ? (
                  <div className="rounded-2xl border border-success/30 bg-success/10 p-5 text-center">
                    <p className="font-display text-3xl font-bold text-success">
                      🎉 Selamat ulang tahun ke-{bday.age}!
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{bday.dateLabel}</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border bg-secondary/50 p-5 text-center">
                    <p className="font-display text-4xl font-bold tabular-nums text-gradient-brand">
                      {bday.daysLeft} hari lagi
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      menuju ulang tahun ke-{bday.nextAge} · lahir {bday.dateLabel} ({bday.age}{" "}
                      tahun)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Data diri lengkap dari formulir pendaftaran */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center gap-2">
              <IdCard className="h-5 w-5 text-brand" />
              <h2 className="font-display text-lg font-semibold text-ink">Data Diri</h2>
            </div>
            {profile ? (
              <ProfileDetails profile={profile} now={now} />
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Data formulir pendaftaran belum tersedia untuk akun ini.
              </p>
            )}
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-brand" />
              <h2 className="font-display text-lg font-semibold text-ink">Riwayat Kehadiran</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat…
              </div>
            ) : history.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Belum ada riwayat kehadiran.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Masuk</TableHead>
                    <TableHead>Keluar</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-ink">{formatDateShort(r.workDate)}</TableCell>
                      <TableCell className="tabular-nums">{formatTime(r.clockIn)}</TableCell>
                      <TableCell className="tabular-nums">{formatTime(r.clockOut)}</TableCell>
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
      </main>

      <AttendanceCapture
        open={capture.open}
        mode={capture.mode}
        onOpenChange={(open) => setCapture((c) => ({ ...c, open }))}
        onSuccess={load}
      />

      <VolunteerCardModal open={cardOpen} onOpenChange={setCardOpen} />
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10">
          <Icon className="h-5 w-5 text-brand" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={cn("truncate text-sm font-medium text-ink")}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
