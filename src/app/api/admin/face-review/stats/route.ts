import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { EmbeddingSource, VerifyMethod } from "@prisma/client";

/**
 * Statistik "kesehatan" galeri per volunteer:
 * jumlah embedding (SEED/CHECKIN) + rata-rata similarity 7 hari terakhir.
 */
export async function GET() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [embeddingGroups, logs] = await Promise.all([
    prisma.faceEmbedding.groupBy({
      by: ["volunteerId", "source"],
      _count: { _all: true },
    }),
    prisma.faceVerifyLog.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { volunteerId: true, similarity: true, decision: true },
    }),
  ]);

  interface Acc {
    seedCount: number;
    checkinCount: number;
    simSum: number;
    simCount: number;
    verifyCount: number;
    autoCount: number;
  }
  const acc = new Map<string, Acc>();
  const get = (id: string): Acc => {
    let entry = acc.get(id);
    if (!entry) {
      entry = { seedCount: 0, checkinCount: 0, simSum: 0, simCount: 0, verifyCount: 0, autoCount: 0 };
      acc.set(id, entry);
    }
    return entry;
  };

  for (const group of embeddingGroups) {
    const entry = get(group.volunteerId);
    if (group.source === EmbeddingSource.SEED) entry.seedCount = group._count._all;
    else entry.checkinCount = group._count._all;
  }
  for (const log of logs) {
    const entry = get(log.volunteerId);
    entry.verifyCount += 1;
    if (log.decision === VerifyMethod.FACE_AUTO) entry.autoCount += 1;
    if (log.similarity !== null) {
      entry.simSum += log.similarity;
      entry.simCount += 1;
    }
  }

  const userIds = [...acc.keys()];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          username: true,
          profilePhoto: true,
          division: { select: { name: true } },
        },
      })
    : [];
  const userById = new Map(users.map((u) => [u.id, u]));

  const stats = userIds
    .map((id) => {
      const entry = get(id);
      const user = userById.get(id);
      if (!user) return null; // user sudah dihapus
      return {
        user,
        seedCount: entry.seedCount,
        checkinCount: entry.checkinCount,
        totalEmbeddings: entry.seedCount + entry.checkinCount,
        verifyCount7d: entry.verifyCount,
        avgSimilarity7d: entry.simCount > 0 ? entry.simSum / entry.simCount : null,
        autoRate7d: entry.verifyCount > 0 ? entry.autoCount / entry.verifyCount : null,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => a.user.name.localeCompare(b.user.name, "id"));

  return NextResponse.json({ stats });
}
