import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, isAdminRole } from "@/lib/auth";

const schema = z.object({
  identifier: z.string().min(1, "Username atau nomor telepon wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { phone: identifier }],
      },
    });

    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json(
        { error: "Username/telepon atau password salah" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Akun Anda dinonaktifkan. Hubungi admin." },
        { status: 403 }
      );
    }

    await createSession({
      sub: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    });

    return NextResponse.json({
      success: true,
      redirect: isAdminRole(user.role) ? "/admin" : "/dashboard",
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
