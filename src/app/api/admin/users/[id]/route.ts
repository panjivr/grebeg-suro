import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole, hashPassword } from "@/lib/auth";
import { Role } from "@prisma/client";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(Role).optional(),
  divisionId: z.string().optional().nullable(),
  shift: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { id } = await params;

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.password && { password: await hashPassword(data.password) }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.divisionId !== undefined && { divisionId: data.divisionId || null }),
      ...(data.shift !== undefined && { shift: data.shift || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  const { password: _pw, ...safe } = updated;
  return NextResponse.json({ user: safe });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { id } = await params;

  if (id === session.sub) {
    return NextResponse.json(
      { error: "Tidak dapat menghapus akun sendiri" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
