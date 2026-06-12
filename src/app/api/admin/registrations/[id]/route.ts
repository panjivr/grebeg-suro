import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { REGISTRATION_STATUSES } from "@/lib/registration-data";

const patchSchema = z.object({
  status: z.enum(REGISTRATION_STATUSES).optional(),
  catatan: z.string().max(2000).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }

  const { id } = await params;
  try {
    const registration = await prisma.volunteerRegistration.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ registration });
  } catch {
    return NextResponse.json({ error: "Pendaftar tidak ditemukan" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.volunteerRegistration.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Pendaftar tidak ditemukan" }, { status: 404 });
  }
}
