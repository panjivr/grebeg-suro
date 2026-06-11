import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { addGalleryEmbedding, embedFace, isFaceVerificationEnabled } from "@/lib/face";
import { FaceReviewStatus } from "@prisma/client";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  // Hanya relevan untuk APPROVE: masukkan embedding selfie ini ke galeri.
  addToGallery: z.boolean().optional().default(false),
  // Mode tanpa face service: embedding dihitung di browser admin (128-dim)
  embedding: z.array(z.number()).min(64).max(1024).optional(),
  detScore: z.number().min(0).max(1).optional(),
});

async function photoToDataUrl(photo: string): Promise<string> {
  if (photo.startsWith("data:image")) return photo;
  const res = await fetch(photo, { signal: AbortSignal.timeout(10000), cache: "no-store" });
  if (!res.ok) throw new Error(`Gagal mengunduh foto selfie (HTTP ${res.status})`);
  const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { id } = await params;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }
  const { action, addToGallery, embedding: clientEmbedding, detScore: clientDetScore } = parsed.data;

  const record = await prisma.attendance.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      clockInPhoto: true,
      faceSimilarity: true,
      faceReviewStatus: true,
    },
  });
  if (!record) {
    return NextResponse.json({ error: "Data absensi tidak ditemukan" }, { status: 404 });
  }
  if (!record.faceReviewStatus) {
    return NextResponse.json(
      { error: "Absensi ini tidak masuk antrian review wajah" },
      { status: 400 }
    );
  }

  let addedToGallery = false;
  if (action === "APPROVE" && addToGallery) {
    // Tambah ke galeri DULU — jika gagal, status tetap PENDING supaya admin
    // bisa coba lagi atau approve tanpa galeri (mencegah keadaan setengah jadi).
    if (!record.clockInPhoto) {
      return NextResponse.json(
        { error: "Foto selfie tidak tersedia untuk ditambahkan ke galeri" },
        { status: 422 }
      );
    }
    try {
      let embedding: number[];
      let detScore: number;
      if (isFaceVerificationEnabled) {
        // Mode face service (VPS): server yang menghitung embedding
        const dataUrl = await photoToDataUrl(record.clockInPhoto);
        ({ embedding, detScore } = await embedFace(dataUrl));
      } else if (clientEmbedding && clientEmbedding.length === 128) {
        // Mode browser: embedding dihitung di panel admin
        embedding = clientEmbedding;
        detScore = clientDetScore ?? 0;
      } else {
        return NextResponse.json(
          {
            error:
              "Wajah tidak terdeteksi pada foto selfie ini (deteksi dilakukan di browser) — coba lagi atau approve tanpa galeri",
          },
          { status: 422 }
        );
      }
      await addGalleryEmbedding({
        volunteerId: record.userId,
        embedding,
        detScore,
        similarity: record.faceSimilarity,
        photoUrl: record.clockInPhoto,
      });
      addedToGallery = true;
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? `Gagal menambahkan ke galeri: ${err.message}`
              : "Gagal menambahkan ke galeri",
        },
        { status: 422 }
      );
    }
  }

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      faceReviewStatus:
        action === "APPROVE" ? FaceReviewStatus.APPROVED : FaceReviewStatus.REJECTED,
      faceReviewedBy: session.sub,
      faceReviewedAt: new Date(),
    },
    select: { id: true, faceReviewStatus: true, faceReviewedAt: true },
  });

  return NextResponse.json({ success: true, record: updated, addedToGallery });
}
