import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import {
  computeStars,
  formatDurationLong,
  formatPeriod,
  totalHoursNumber,
  type CardAggregate,
} from "@/lib/card-stats";

export const runtime = "nodejs";

/** Ubah URL/base64 foto profil menjadi data URL agar aman dipakai html-to-image. */
async function toPhotoDataUrl(photo: string | null): Promise<string | null> {
  if (!photo) return null;
  if (photo.startsWith("data:")) return photo;
  if (!/^https?:\/\//i.test(photo)) return null;
  try {
    const res = await fetch(photo, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 4_000_000) return null; // jaga ukuran payload
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Data Kartu Volunteer untuk pengguna saat ini (atau ?userId untuk admin).
 * Mengagregasi SELURUH riwayat kehadiran (termasuk data historis yang diimpor).
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestedId = searchParams.get("userId");
  const targetId =
    requestedId && isAdminRole(session.role) ? requestedId : session.sub;

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    include: { division: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
  }

  const attendances = await prisma.attendance.findMany({
    where: { userId: targetId },
    select: { workDate: true, clockIn: true, clockOut: true, status: true },
    orderBy: { workDate: "asc" },
  });

  const days = new Set<string>();
  let totalMs = 0;
  let onTime = 0;
  let late = 0;
  let withClockOut = 0;
  let firstDate: string | null = null;
  let lastDate: string | null = null;

  for (const a of attendances) {
    const d = a.workDate.toISOString().slice(0, 10);
    days.add(d);
    if (!firstDate) firstDate = d;
    lastDate = d;
    if (a.clockIn && a.clockOut) {
      totalMs += Math.max(0, +a.clockOut - +a.clockIn);
      withClockOut++;
    }
    if (a.status === "LATE") late++;
    else if (a.status === "PRESENT" || a.status === "ON_DUTY") onTime++;
  }

  const agg: CardAggregate = {
    totalDays: days.size,
    totalMs,
    sessions: attendances.length,
    onTime,
    late,
    withClockOut,
    firstDate,
    lastDate,
  };

  const payload = {
    name: user.name,
    username: user.username,
    role: user.role,
    division: user.division?.name ?? null,
    jobdesk: user.shift ?? null,
    photoDataUrl: await toPhotoDataUrl(user.profilePhoto),
    stars: computeStars(agg),
    totalDays: agg.totalDays,
    totalHours: totalHoursNumber(totalMs),
    durationText: formatDurationLong(totalMs),
    periodText: formatPeriod(firstDate, lastDate),
    sessions: agg.sessions,
  };

  return NextResponse.json(payload);
}
