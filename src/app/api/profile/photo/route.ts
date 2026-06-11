import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { saveSelfie } from "@/lib/storage";

const schema = z.object({
  photo: z.string().startsWith("data:image", "Format foto tidak valid"),
});

/** Volunteer mengganti foto profilnya sendiri. */
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

  let photoUrl: string;
  try {
    photoUrl = await saveSelfie(parsed.data.photo, `profile/${session.sub}`);
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan foto" }, { status: 500 });
  }

  await prisma.user.update({
    where: { id: session.sub },
    data: { profilePhoto: photoUrl },
  });

  return NextResponse.json({ success: true, profilePhoto: photoUrl });
}
