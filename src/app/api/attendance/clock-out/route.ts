import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { validateLocation } from "@/lib/geo";
import { saveSelfie } from "@/lib/storage";
import { notifyTelegram } from "@/lib/notify";
import { formatTime } from "@/lib/utils";

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
      { error: "Anda berada di luar area event", distance: geo.distance, radius: geo.radius },
      { status: 422 }
    );
  }

  const today = startOfToday();
  const record = await prisma.attendance.findFirst({
    where: { userId: session.sub, workDate: today },
  });

  if (!record?.clockIn) {
    return NextResponse.json(
      { error: "Anda belum clock-in hari ini" },
      { status: 409 }
    );
  }
  if (record.clockOut) {
    return NextResponse.json(
      { error: "Anda sudah melakukan clock-out hari ini" },
      { status: 409 }
    );
  }

  const now = new Date();
  let photoUrl: string;
  try {
    photoUrl = await saveSelfie(photo, `clock-out/${session.sub}`);
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan selfie" }, { status: 500 });
  }

  const updated = await prisma.attendance.update({
    where: { id: record.id },
    data: {
      clockOut: now,
      clockOutPhoto: photoUrl,
      clockOutLat: latitude,
      clockOutLong: longitude,
    },
  });

  notifyTelegram(
    `🏁 <b>Clock Out</b>\n${session.name} (${session.username})\nWaktu: ${formatTime(now)}\nJarak: ${geo.distance}m`
  );

  return NextResponse.json({
    success: true,
    clockOut: updated.clockOut,
    distance: geo.distance,
  });
}
