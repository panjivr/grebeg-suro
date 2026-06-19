import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { parseAttendanceWorkbook } from "@/lib/attendance-import";
import { bestNameMatch, type MatchCandidate } from "@/lib/name-match";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  fileBase64: z.string().min(10, "File kosong"),
  dryRun: z.boolean().default(true),
});

function dateOnlyUTC(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

/**
 * Impor absensi historis (sebelum web ini ada) dari ekspor xlsx aplikasi lama.
 * Hanya menambah baris Attendance untuk (user, tanggal) yang BELUM ada —
 * idempotent & tidak menyentuh data clock-in yang sudah ada. Dengan dryRun
 * true, hanya menghitung & menampilkan pratinjau tanpa menulis ke database.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }

  // base64 (boleh dengan prefix data:...;base64,)
  const b64 = parsed.data.fileBase64.replace(/^data:[^;]+;base64,/, "");
  let buf: Buffer;
  try {
    buf = Buffer.from(b64, "base64");
  } catch {
    return NextResponse.json({ error: "File base64 tidak valid" }, { status: 400 });
  }

  let sessions, totalEvents;
  try {
    ({ sessions, totalEvents } = await parseAttendanceWorkbook(buf));
  } catch (e) {
    console.error("import parse error:", e);
    return NextResponse.json(
      { error: "Gagal membaca file Excel. Pastikan format sesuai (sheet Attendance)." },
      { status: 400 }
    );
  }
  if (sessions.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada data kehadiran terbaca dari file." },
      { status: 400 }
    );
  }

  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  const candidates: MatchCandidate[] = users.map((u) => ({ id: u.id, name: u.name }));

  // Pre-load Attendance yang sudah ada pada tanggal-tanggal terkait, untuk idempotensi
  const dates = [...new Set(sessions.map((s) => s.workDate))].map(dateOnlyUTC);
  const existing = await prisma.attendance.findMany({
    where: { workDate: { in: dates } },
    select: { userId: true, workDate: true },
  });
  const existingKeys = new Set(
    existing.map((e) => `${e.userId}|${e.workDate.toISOString().slice(0, 10)}`)
  );

  const matchedNames = new Map<string, { user: string; score: number; count: number }>();
  const unmatched = new Map<string, number>();
  const toCreate: {
    userId: string;
    workDate: Date;
    clockIn: Date;
    clockOut: Date | null;
    sourceName: string;
  }[] = [];
  const plannedKeys = new Set<string>(); // dedup dalam satu run (mis. duplikat foto orang sama)
  let skippedExisting = 0;
  let skippedDuplicateInFile = 0;

  for (const s of sessions) {
    const m = bestNameMatch(s.name, candidates);
    if (!m) {
      unmatched.set(s.name, (unmatched.get(s.name) ?? 0) + 1);
      continue;
    }
    const mn = matchedNames.get(s.name) ?? { user: m.candidate.name, score: m.score, count: 0 };
    mn.count++;
    matchedNames.set(s.name, mn);

    const key = `${m.candidate.id}|${s.workDate}`;
    if (existingKeys.has(key)) {
      skippedExisting++;
      continue;
    }
    if (plannedKeys.has(key)) {
      skippedDuplicateInFile++;
      continue;
    }
    plannedKeys.add(key);
    toCreate.push({
      userId: m.candidate.id,
      workDate: dateOnlyUTC(s.workDate),
      clockIn: new Date(s.clockInTs),
      clockOut: s.clockOutTs ? new Date(s.clockOutTs) : null,
      sourceName: s.name,
    });
  }

  let created = 0;
  if (!parsed.data.dryRun && toCreate.length > 0) {
    const result = await prisma.attendance.createMany({
      data: toCreate.map((c) => ({
        userId: c.userId,
        workDate: c.workDate,
        clockIn: c.clockIn,
        clockOut: c.clockOut,
        status: "PRESENT" as const,
      })),
      skipDuplicates: true,
    });
    created = result.count;
  }

  const summary = {
    dryRun: parsed.data.dryRun,
    totalEvents,
    totalSessions: sessions.length,
    matchedVolunteers: matchedNames.size,
    willCreate: toCreate.length,
    created,
    skippedExisting,
    skippedDuplicateInFile,
    unmatched: [...unmatched.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    matchedPreview: [...matchedNames.entries()]
      .map(([from, v]) => ({ from, to: v.user, score: Math.round(v.score * 100) / 100 }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 60),
  };

  return NextResponse.json(summary);
}
