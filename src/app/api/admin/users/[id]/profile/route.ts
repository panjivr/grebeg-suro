import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";

/** Detail akun + data formulir pendaftaran satu volunteer (read-only, admin). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
      phone: true,
      role: true,
      shift: true,
      isActive: true,
      profilePhoto: true,
      createdAt: true,
      division: { select: { name: true } },
      profile: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
