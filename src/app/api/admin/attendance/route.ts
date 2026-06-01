import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

/**
 * Attendance log with filters:
 *  ?date=YYYY-MM-DD (default today)  ?all=true  ?divisionId=  ?status=
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const all = searchParams.get("all") === "true";
  const divisionId = searchParams.get("divisionId");
  const status = searchParams.get("status");

  const where: Prisma.AttendanceWhereInput = {};

  if (!all) {
    const day = dateParam ? new Date(dateParam) : new Date();
    day.setHours(0, 0, 0, 0);
    where.workDate = day;
  }
  if (status) where.status = status as Prisma.AttendanceWhereInput["status"];
  if (divisionId) where.user = { divisionId };

  const records = await prisma.attendance.findMany({
    where,
    include: { user: { include: { division: true } } },
    orderBy: { clockIn: "desc" },
    take: all ? 500 : 200,
  });

  return NextResponse.json({ records });
}
