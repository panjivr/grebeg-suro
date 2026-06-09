"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Clock,
  LogIn,
  LogOut as LogOutIcon,
  CalendarClock,
  History,
  MapPin,
  Sparkles,
  Loader2,
} from "lucide-react";
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
import { LogoutButton } from "@/components/logout-button";
import { BrandLogo } from "@/components/brand-logo";
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
}

const statusVariant: Record<string, "success" | "warning" | "destructive" | "default"> = {
  PRESENT: "success",
  LATE: "warning",
  ABSENT: "destructive",
  ON_DUTY: "default",
};

export function VolunteerDashboard({ user, event }: { user: UserLite; event: EventLite | null }) {
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [capture, setCapture] = useState<{ open: boolean; mode: "clock-in" | "clock-out" }>({
    open: false,
    mode: "clock-in",
  });
  const [now, setNow] = useState(new Date());

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
                <Avatar className="h-20 w-20 border-4 border-card ring-2 ring-brand/30">
                  {user.profilePhoto && <AvatarImage src={user.profilePhoto} alt={user.name} />}
                  <AvatarFallback className="text-xl">{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="mb-1">
                  <h1 className="font-display text-2xl font-bold text-ink">{user.name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="default">{roleLabels[user.role] ?? user.role}</Badge>
                    {user.division && <Badge variant="outline">{user.division.name}</Badge>}
                  </div>
                </div>
              </div>
              <Badge
                variant={hasClockedOut ? "secondary" : hasClockedIn ? "success" : "warning"}
                className="self-start px-3 py-1 text-sm sm:self-end"
              >
                {todayStatus}
              </Badge>
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
