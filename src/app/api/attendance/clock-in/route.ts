import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { validateLocation } from "@/lib/geo";
import { saveSelfie } from "@/lib/storage";
import { notifyTelegram } from "@/lib/notify";
import { formatTime } from "@/lib/utils";
import {
  attendanceFaceFields,
  enrichGallerySafe,
  logFaceVerify,
  shouldEnrichGallery,
  verifyFace,
  type FaceVerifyResult,
} from "@/lib/face";
import { AttendanceStatus, VerifyMethod } from "@prisma/client";

const schema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  photo: z.string().startsWith("data:image", "Selfie wajib diambil"),
});

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }
  const { latitude, longitude, photo } = parsed.data;

  // 1. Geofence validation
  const event = await prisma.eventSetting.findFirst({ where: { isActive: true } });
  if (!event) {
    return NextResponse.json(
      { error: "Pengaturan event belum dikonfigurasi" },
      { status: 400 }
    );
  }

  const geo = validateLocation(
    latitude,
    longitude,
    event.eventLat,
    event.eventLong,
    event.radiusMeter
  );
  if (!geo.valid) {
    return NextResponse.json(
      {
        error: "Anda berada di luar area event",
        distance: geo.distance,
        radius: geo.radius,
      },
      { status: 422 }
    );
  }

  // 2. Already clocked in today?
  const today = startOfToday();
  const existing = await prisma.attendance.findFirst({
    where: { userId: session.sub, workDate: today },
  });
  if (existing?.clockIn) {
    return NextResponse.json(
      { error: "Anda sudah melakukan clock-in hari ini" },
      { status: 409 }
    );
  }

  // 3. Determine status (late vs present)
  const now = new Date();
  const [sh, sm] = (event.shiftStart ?? "08:00").split(":").map(Number);
  const threshold = new Date(now);
  threshold.setHours(sh, sm, 0, 0);
  const status = now > threshold ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

  // 4. Save selfie
  let photoUrl: string;
  try {
    photoUrl = await saveSelfie(photo, `clock-in/${session.sub}`);
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan selfie" }, { status: 500 });
  }

  // 5. Face verification — graceful degradation: null saat fitur nonaktif,
  //    MANUAL_FALLBACK saat service down/timeout. Absensi tidak pernah gagal di sini.
  const face = await verifyFace(photo, session.sub);
  const faceFields = attendanceFaceFields(face);

  // 6. Persist
  const record = await prisma.attendance.upsert({
    where: { id: existing?.id ?? "__none__" },
    update: {
      clockIn: now,
      clockInPhoto: photoUrl,
      clockInLat: latitude,
      clockInLong: longitude,
      status,
      ...faceFields,
    },
    create: {
      userId: session.sub,
      clockIn: now,
      clockInPhoto: photoUrl,
      clockInLat: latitude,
      clockInLong: longitude,
      status,
      workDate: today,
      ...faceFields,
    },
  });

  // 7. Log verifikasi + self-learning (gallery enrichment) — keduanya non-fatal.
  if (face) {
    await logFaceVerify(session.sub, face);
    if (shouldEnrichGallery(face)) {
      await enrichGallerySafe({
        volunteerId: session.sub,
        embedding: face.embedding!,
        detScore: face.detScore!,
        similarity: face.similarity,
        photoUrl,
      });
    }
  }

  notifyTelegram(
    `✅ <b>Clock In</b>\n${session.name} (${session.username})\nWaktu: ${formatTime(now)}\nStatus: ${status}\nJarak: ${geo.distance}m${faceSummary(face)}`
  );

  return NextResponse.json({
    success: true,
    status,
    clockIn: record.clockIn,
    distance: geo.distance,
    faceVerified: face?.decision === VerifyMethod.FACE_AUTO,
    verifyMethod: face?.decision ?? null,
  });
}

function faceSummary(face: FaceVerifyResult | null): string {
  if (!face) return "";
  const sim = face.similarity !== null ? ` (${face.similarity.toFixed(2)})` : "";
  const mismatch = face.possibleMismatch ? " — ⚠ indikasi titip absen" : "";
  switch (face.decision) {
    case VerifyMethod.FACE_AUTO:
      return `\nWajah: ✓ terverifikasi${sim}${mismatch}`;
    case VerifyMethod.FACE_LOW_CONF:
      return `\nWajah: ⚠ keyakinan rendah${sim} — perlu review${mismatch}`;
    default:
      return `\nWajah: ⚠ fallback manual (${face.reason}) — perlu review${mismatch}`;
  }
}
