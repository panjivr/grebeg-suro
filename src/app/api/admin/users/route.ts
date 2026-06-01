import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole, hashPassword } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    include: { division: true },
    orderBy: { createdAt: "desc" },
  });

  const safe = users.map(({ password: _pw, ...u }) => u);
  return NextResponse.json({ users: safe });
}

const createSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  phone: z.string().optional(),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
  divisionId: z.string().optional().nullable(),
  shift: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const exists = await prisma.user.findFirst({
    where: { OR: [{ username: data.username }, ...(data.phone ? [{ phone: data.phone }] : [])] },
  });
  if (exists) {
    return NextResponse.json(
      { error: "Username atau telepon sudah digunakan" },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      phone: data.phone || null,
      password: await hashPassword(data.password),
      role: data.role,
      divisionId: data.divisionId || null,
      shift: data.shift || null,
    },
  });

  const { password: _pw, ...safe } = user;
  return NextResponse.json({ user: safe }, { status: 201 });
}
