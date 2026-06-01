"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  LayoutGrid,
  ClipboardList,
  Radio,
  Settings,
  UserCheck,
  Clock4,
  UserX,
  Activity,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoutButton } from "@/components/logout-button";
import { AttendanceTrendChart, DivisionChart } from "@/components/admin/charts";
import { UsersPanel } from "@/components/admin/users-panel";
import { DivisionsPanel } from "@/components/admin/divisions-panel";
import { AttendancePanel } from "@/components/admin/attendance-panel";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { roleLabels } from "@/lib/utils";

interface Stats {
  cards: {
    totalVolunteers: number;
    totalDivisions: number;
    totalEO: number;
    activeVolunteers: number;
    presentToday: number;
    lateToday: number;
    absentToday: number;
    clockedInNow: number;
  };
  trend: { label: string; present: number; late: number }[];
  divisionStats: { name: string; members: number }[];
}

export function AdminDashboard({ adminName, adminRole }: { adminName: string; adminRole: string }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const c = stats?.cards;

  const statCards = [
    { label: "Hadir Hari Ini", value: c?.presentToday, icon: UserCheck, tone: "text-emerald-400" },
    { label: "Terlambat", value: c?.lateToday, icon: Clock4, tone: "text-amber-400" },
    { label: "Belum Absen", value: c?.absentToday, icon: UserX, tone: "text-rose-400" },
    { label: "Sedang Bertugas", value: c?.clockedInNow, icon: Activity, tone: "text-gold" },
  ];

  const miniCards = [
    { label: "Total Relawan", value: c?.totalVolunteers },
    { label: "Relawan Aktif", value: c?.activeVolunteers },
    { label: "Total Divisi", value: c?.totalDivisions },
    { label: "Total EO", value: c?.totalEO },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold-gradient font-display text-base font-bold text-primary-foreground">
              G
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Admin Panel</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Grebeg Suro</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{adminName}</p>
              <Badge variant="outline" className="text-[10px]">{roleLabels[adminRole] ?? adminRole}</Badge>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="container space-y-6 py-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Selamat datang, {adminName.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground">Pantau kehadiran relawan secara real-time.</p>
        </div>

        {/* Primary stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center justify-between py-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  {s.value === undefined ? (
                    <Skeleton className="mt-2 h-8 w-12" />
                  ) : (
                    <p className="mt-1 font-display text-3xl font-bold">{s.value}</p>
                  )}
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.03]">
                  <s.icon className={`h-5 w-5 ${s.tone}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <div className="overflow-x-auto pb-1">
            <TabsList className="w-max">
              <TabsTrigger value="overview"><LayoutDashboard className="mr-1.5 h-4 w-4" /> Ringkasan</TabsTrigger>
              <TabsTrigger value="live"><Radio className="mr-1.5 h-4 w-4" /> Live</TabsTrigger>
              <TabsTrigger value="users"><Users className="mr-1.5 h-4 w-4" /> Pengguna</TabsTrigger>
              <TabsTrigger value="divisions"><LayoutGrid className="mr-1.5 h-4 w-4" /> Divisi</TabsTrigger>
              <TabsTrigger value="logs"><ClipboardList className="mr-1.5 h-4 w-4" /> Log</TabsTrigger>
              <TabsTrigger value="settings"><Settings className="mr-1.5 h-4 w-4" /> Pengaturan</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {miniCards.map((m) => (
                <Card key={m.label}>
                  <CardContent className="py-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</p>
                    {m.value === undefined ? (
                      <Skeleton className="mt-2 h-7 w-10" />
                    ) : (
                      <p className="mt-1 font-display text-2xl font-bold text-gradient-gold">{m.value}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-gold" />
                    <h2 className="font-display text-lg font-semibold">Tren Kehadiran (7 Hari)</h2>
                  </div>
                  {stats ? <AttendanceTrendChart data={stats.trend} /> : <Skeleton className="h-[260px] w-full" />}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-gold" />
                    <h2 className="font-display text-lg font-semibold">Anggota per Divisi</h2>
                  </div>
                  {stats ? <DivisionChart data={stats.divisionStats} /> : <Skeleton className="h-[260px] w-full" />}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="live"><AttendancePanel live /></TabsContent>
          <TabsContent value="users"><UsersPanel /></TabsContent>
          <TabsContent value="divisions"><DivisionsPanel /></TabsContent>
          <TabsContent value="logs"><AttendancePanel /></TabsContent>
          <TabsContent value="settings"><SettingsPanel /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
