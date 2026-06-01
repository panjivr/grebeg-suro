import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { AttendanceStatus } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalVolunteers,
    totalDivisions,
    totalEO,
    activeVolunteers,
    presentToday,
    lateToday,
    clockedInNow,
    todayRecords,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "VOLUNTEER" } }),
    prisma.division.count(),
    prisma.user.count({ where: { role: "EO" } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.attendance.count({ where: { workDate: today, status: AttendanceStatus.PRESENT } }),
    prisma.attendance.count({ where: { workDate: today, status: AttendanceStatus.LATE } }),
    prisma.attendance.count({ where: { workDate: today, clockIn: { not: null }, clockOut: null } }),
    prisma.attendance.findMany({
      where: { workDate: today },
      select: { userId: true },
    }),
  ]);

  const totalUsers = await prisma.user.count();
  const checkedInUserIds = new Set(todayRecords.map((r) => r.userId));
  const absentToday = totalUsers - checkedInUserIds.size;

  // 7-day attendance trend
  const trendStart = new Date(today);
  trendStart.setDate(trendStart.getDate() - 6);
  const trendRecords = await prisma.attendance.findMany({
    where: { workDate: { gte: trendStart } },
    select: { workDate: true, status: true },
  });

  const trendMap = new Map<string, { present: number; late: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(trendStart);
    d.setDate(d.getDate() + i);
    trendMap.set(d.toISOString().slice(0, 10), { present: 0, late: 0 });
  }
  for (const r of trendRecords) {
    const key = r.workDate.toISOString().slice(0, 10);
    const entry = trendMap.get(key);
    if (!entry) continue;
    if (r.status === "LATE") entry.late++;
    else if (r.status === "PRESENT") entry.present++;
  }
  const trend = Array.from(trendMap.entries()).map(([date, v]) => ({
    date,
    label: new Date(date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric" }),
    present: v.present,
    late: v.late,
  }));

  // Division analytics
  const divisions = await prisma.division.findMany({
    include: { _count: { select: { users: true } } },
  });
  const divisionStats = divisions.map((d) => ({
    name: d.name,
    members: d._count.users,
  }));

  return NextResponse.json({
    cards: {
      totalVolunteers,
      totalDivisions,
      totalEO,
      activeVolunteers,
      presentToday,
      lateToday,
      absentToday,
      clockedInNow,
    },
    trend,
    divisionStats,
  });
}
