import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/** Current user's attendance history + today's record. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayRecord, history] = await Promise.all([
    prisma.attendance.findFirst({
      where: { userId: session.sub, workDate: today },
    }),
    prisma.attendance.findMany({
      where: { userId: session.sub },
      orderBy: { workDate: "desc" },
      take: 30,
    }),
  ]);

  return NextResponse.json({ today: todayRecord, history });
}
