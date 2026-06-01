import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  const divisions = await prisma.division.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ divisions });
}

const schema = z.object({
  name: z.string().min(2, "Nama divisi minimal 2 karakter"),
  description: z.string().optional(),
});

export async function POST(req: Request) {
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

  const exists = await prisma.division.findUnique({ where: { name: parsed.data.name } });
  if (exists) {
    return NextResponse.json({ error: "Divisi sudah ada" }, { status: 409 });
  }

  const division = await prisma.division.create({ data: parsed.data });
  return NextResponse.json({ division }, { status: 201 });
}
