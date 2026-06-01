import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  const settings = await prisma.eventSetting.findFirst({ where: { isActive: true } });
  return NextResponse.json({ settings });
}

const schema = z.object({
  eventName: z.string().min(2),
  eventLat: z.number().min(-90).max(90),
  eventLong: z.number().min(-180).max(180),
  radiusMeter: z.number().int().min(10).max(5000),
  shiftStart: z.string().regex(/^\d{2}:\d{2}$/, "Format jam HH:mm"),
});

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }

  const existing = await prisma.eventSetting.findFirst({ where: { isActive: true } });
  const settings = existing
    ? await prisma.eventSetting.update({ where: { id: existing.id }, data: parsed.data })
    : await prisma.eventSetting.create({ data: { ...parsed.data, isActive: true } });

  return NextResponse.json({ settings });
}
