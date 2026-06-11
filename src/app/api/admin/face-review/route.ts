import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { FaceReviewStatus, type Prisma } from "@prisma/client";

/**
 * Daftar absensi yang butuh/sudah melewati review verifikasi wajah
 * (FACE_LOW_CONF, MANUAL_FALLBACK, POSSIBLE_MISMATCH).
 *  ?status=PENDING (default) | APPROVED | REJECTED | ALL
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status") ?? "PENDING";
  const validStatuses = Object.values(FaceReviewStatus) as string[];
  if (statusParam !== "ALL" && !validStatuses.includes(statusParam)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const where: Prisma.AttendanceWhereInput =
    statusParam === "ALL"
      ? { faceReviewStatus: { not: null } }
      : { faceReviewStatus: statusParam as FaceReviewStatus };

  const records = await prisma.attendance.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          profilePhoto: true,
          division: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Resolve user yang ter-match saat possibleMismatch (indikasi titip absen)
  const matchedIds = [
    ...new Set(records.map((r) => r.faceMatchedUserId).filter((v): v is string => Boolean(v))),
  ];
  const matchedUsers = matchedIds.length
    ? await prisma.user.findMany({
        where: { id: { in: matchedIds } },
        select: { id: true, name: true, username: true },
      })
    : [];
  const matchedById = new Map(matchedUsers.map((u) => [u.id, u]));

  // Foto referensi per volunteer: SEED terbaru > CHECKIN terbaru > foto profil
  const userIds = [...new Set(records.map((r) => r.userId))];
  const refPhotos = userIds.length
    ? await prisma.faceEmbedding.findMany({
        where: { volunteerId: { in: userIds }, photoUrl: { not: null } },
        select: { volunteerId: true, photoUrl: true, source: true, createdAt: true },
        orderBy: [{ source: "asc" }, { createdAt: "desc" }], // SEED dulu, lalu terbaru
      })
    : [];
  const refByUser = new Map<string, string>();
  for (const ref of refPhotos) {
    if (!refByUser.has(ref.volunteerId) && ref.photoUrl) {
      refByUser.set(ref.volunteerId, ref.photoUrl);
    }
  }

  // Jumlah embedding per volunteer (konteks "kesehatan" galeri)
  const counts = userIds.length
    ? await prisma.faceEmbedding.groupBy({
        by: ["volunteerId"],
        where: { volunteerId: { in: userIds } },
        _count: { _all: true },
      })
    : [];
  const countByUser = new Map(counts.map((c) => [c.volunteerId, c._count._all]));

  return NextResponse.json({
    records: records.map((r) => ({
      id: r.id,
      workDate: r.workDate,
      clockIn: r.clockIn,
      clockInPhoto: r.clockInPhoto,
      status: r.status,
      verifyMethod: r.verifyMethod,
      faceSimilarity: r.faceSimilarity,
      possibleMismatch: r.possibleMismatch,
      faceReviewStatus: r.faceReviewStatus,
      faceReviewedAt: r.faceReviewedAt,
      user: r.user,
      matchedUser: r.faceMatchedUserId
        ? (matchedById.get(r.faceMatchedUserId) ?? null)
        : null,
      referencePhoto: refByUser.get(r.userId) ?? r.user.profilePhoto ?? null,
      galleryCount: countByUser.get(r.userId) ?? 0,
    })),
  });
}
