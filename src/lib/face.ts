import "server-only";
import { prisma } from "./prisma";
import { EmbeddingSource, FaceReviewStatus, VerifyMethod } from "@prisma/client";

/**
 * Klien face service (Python FastAPI, localhost:8001).
 *
 * Prinsip keras: absensi TIDAK BOLEH gagal gara-gara AI. Semua fungsi di sini
 * graceful — service mati/timeout/error berarti MANUAL_FALLBACK, bukan throw.
 * Jika FACE_SERVICE_URL tidak di-set, fitur nonaktif total dan flow absensi
 * berjalan persis seperti sebelum fitur ini ada.
 */

const SERVICE_URL = (process.env.FACE_SERVICE_URL ?? "").replace(/\/+$/, "");
const TIMEOUT_MS = Number(process.env.FACE_SERVICE_TIMEOUT_MS ?? 5000);
const ENRICH_MIN_DET_SCORE = Number(process.env.FACE_ENRICH_MIN_DET_SCORE ?? 0.6);
const GALLERY_MAX = Number(process.env.FACE_GALLERY_MAX_EMBEDDINGS ?? 30);
const EMBEDDING_DIM = 512;

export const isFaceVerificationEnabled = Boolean(SERVICE_URL);

export interface FaceVerifyResult {
  decision: VerifyMethod;
  reason: string;
  similarity: number | null;
  /** Pemilik top-1 GLOBAL (bisa = volunteer target). */
  matchedVolunteerId: string | null;
  matchedSimilarity: number | null;
  /** Top-1 global milik volunteer LAIN dengan similarity tinggi — indikasi titip absen. */
  possibleMismatch: boolean;
  detScore: number | null;
  embedding: number[] | null;
  galleryCount: number | null;
  latencyMs: number;
}

function fallbackResult(reason: string, latencyMs: number): FaceVerifyResult {
  return {
    decision: VerifyMethod.MANUAL_FALLBACK,
    reason,
    similarity: null,
    matchedVolunteerId: null,
    matchedSimilarity: null,
    possibleMismatch: false,
    detScore: null,
    embedding: null,
    galleryCount: null,
    latencyMs,
  };
}

/**
 * Verifikasi selfie terhadap galeri embedding volunteer.
 * Mengembalikan null jika fitur nonaktif (FACE_SERVICE_URL kosong).
 */
export async function verifyFace(
  photoDataUrl: string,
  volunteerId: string
): Promise<FaceVerifyResult | null> {
  if (!isFaceVerificationEnabled) return null;

  const started = Date.now();
  try {
    const res = await fetch(`${SERVICE_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: photoDataUrl, volunteerId }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    const latencyMs = Date.now() - started;
    if (!res.ok) {
      console.error(`Face service /verify HTTP ${res.status}`);
      return fallbackResult(`HTTP_${res.status}`, latencyMs);
    }
    const data = await res.json();

    const decision =
      data.decision === "FACE_AUTO"
        ? VerifyMethod.FACE_AUTO
        : data.decision === "FACE_LOW_CONF"
          ? VerifyMethod.FACE_LOW_CONF
          : VerifyMethod.MANUAL_FALLBACK;

    return {
      decision,
      reason: typeof data.reason === "string" ? data.reason : "OK",
      similarity: typeof data.similarity === "number" ? data.similarity : null,
      matchedVolunteerId:
        typeof data.matchedVolunteerId === "string" ? data.matchedVolunteerId : null,
      matchedSimilarity:
        typeof data.matchedSimilarity === "number" ? data.matchedSimilarity : null,
      possibleMismatch: data.possibleMismatch === true,
      detScore: typeof data.detScore === "number" ? data.detScore : null,
      embedding:
        Array.isArray(data.embedding) && data.embedding.length === EMBEDDING_DIM
          ? (data.embedding as number[])
          : null,
      galleryCount: typeof data.galleryCount === "number" ? data.galleryCount : null,
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - started;
    const timedOut =
      err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    console.error(
      "Face service tidak terjangkau:",
      err instanceof Error ? err.message : err
    );
    return fallbackResult(timedOut ? "TIMEOUT" : "SERVICE_ERROR", latencyMs);
  }
}

export interface AttendanceFaceFields {
  verifyMethod?: VerifyMethod;
  faceSimilarity?: number | null;
  possibleMismatch?: boolean;
  faceMatchedUserId?: string | null;
  faceReviewStatus?: FaceReviewStatus | null;
}

/** Field face verification untuk record Attendance ({} saat fitur nonaktif). */
export function attendanceFaceFields(face: FaceVerifyResult | null): AttendanceFaceFields {
  if (!face) return {};
  const needsReview =
    face.decision !== VerifyMethod.FACE_AUTO || face.possibleMismatch;
  return {
    verifyMethod: face.decision,
    faceSimilarity: face.similarity,
    possibleMismatch: face.possibleMismatch,
    faceMatchedUserId: face.possibleMismatch ? face.matchedVolunteerId : null,
    faceReviewStatus: needsReview ? FaceReviewStatus.PENDING : null,
  };
}

/** Log verifikasi ke tabel face_verify_logs (bahan tuning threshold). Non-fatal. */
export async function logFaceVerify(
  volunteerId: string,
  face: FaceVerifyResult
): Promise<void> {
  try {
    await prisma.faceVerifyLog.create({
      data: {
        volunteerId,
        similarity: face.similarity,
        decision: face.decision,
        reason: face.reason,
        detScore: face.detScore,
        matchedUserId:
          face.matchedVolunteerId && face.matchedVolunteerId !== volunteerId
            ? face.matchedVolunteerId
            : null,
        latencyMs: Math.max(0, Math.round(face.latencyMs)),
      },
    });
  } catch (err) {
    console.error("Gagal menulis face verify log:", err);
  }
}

/**
 * Self-learning hanya dari check-in FACE_AUTO yang bersih (det_score cukup,
 * tanpa indikasi mismatch) — mencegah galeri keracunan wajah orang lain.
 */
export function shouldEnrichGallery(face: FaceVerifyResult | null): boolean {
  return Boolean(
    face &&
      face.decision === VerifyMethod.FACE_AUTO &&
      !face.possibleMismatch &&
      face.embedding &&
      face.detScore !== null &&
      face.detScore >= ENRICH_MIN_DET_SCORE
  );
}

/**
 * Tambah embedding ke galeri (gallery enrichment) + rolling window:
 * maksimal FACE_GALLERY_MAX_EMBEDDINGS per volunteer; saat penuh, embedding
 * CHECKIN tertua dihapus — SEED tidak pernah dihapus. Non-fatal.
 */
export async function addGalleryEmbedding(input: {
  volunteerId: string;
  embedding: number[];
  detScore: number;
  similarity: number | null;
  photoUrl: string | null;
}): Promise<void> {
  if (input.embedding.length !== EMBEDDING_DIM) {
    console.error(`Embedding ditolak: dimensi ${input.embedding.length} != ${EMBEDDING_DIM}`);
    return;
  }
  await prisma.faceEmbedding.create({
    data: {
      volunteerId: input.volunteerId,
      embedding: Buffer.from(new Float32Array(input.embedding).buffer),
      source: EmbeddingSource.CHECKIN,
      detScore: input.detScore,
      similarity: input.similarity,
      // Data URL (fallback tanpa Supabase) tidak disimpan ulang — terlalu besar.
      photoUrl: input.photoUrl && !input.photoUrl.startsWith("data:") ? input.photoUrl : null,
    },
  });
  await pruneGallery(input.volunteerId);
  void reloadFaceGallery();
}

/** Versi non-fatal untuk dipanggil dari flow check-in. */
export async function enrichGallerySafe(
  input: Parameters<typeof addGalleryEmbedding>[0]
): Promise<void> {
  try {
    await addGalleryEmbedding(input);
  } catch (err) {
    console.error("Gallery enrichment gagal:", err);
  }
}

async function pruneGallery(volunteerId: string): Promise<void> {
  const total = await prisma.faceEmbedding.count({ where: { volunteerId } });
  const excess = total - GALLERY_MAX;
  if (excess <= 0) return;
  const oldestCheckins = await prisma.faceEmbedding.findMany({
    where: { volunteerId, source: EmbeddingSource.CHECKIN },
    orderBy: { createdAt: "asc" },
    take: excess,
    select: { id: true },
  });
  if (oldestCheckins.length > 0) {
    await prisma.faceEmbedding.deleteMany({
      where: { id: { in: oldestCheckins.map((e) => e.id) } },
    });
  }
}

/** Minta face service memuat ulang galeri (fire-and-forget). */
export async function reloadFaceGallery(): Promise<void> {
  if (!isFaceVerificationEnabled) return;
  try {
    await fetch(`${SERVICE_URL}/reload`, {
      method: "POST",
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
  } catch {
    // TTL cache galeri di face service tetap menyusulkan refresh.
  }
}

/**
 * Ekstrak embedding satu wajah dari foto (dipakai admin approve "tambah ke
 * galeri"). Melempar Error dengan pesan yang bisa ditampilkan ke admin.
 */
export async function embedFace(
  photoDataUrl: string
): Promise<{ embedding: number[]; detScore: number }> {
  if (!isFaceVerificationEnabled) {
    throw new Error("Face service belum dikonfigurasi (FACE_SERVICE_URL)");
  }
  let res: Response;
  try {
    res = await fetch(`${SERVICE_URL}/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: photoDataUrl }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new Error("Face service tidak terjangkau — coba lagi nanti");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : `Face service error (HTTP ${res.status})`
    );
  }
  if (!Array.isArray(data?.embedding) || data.embedding.length !== EMBEDDING_DIM) {
    throw new Error("Respons face service tidak valid");
  }
  return { embedding: data.embedding as number[], detScore: Number(data.detScore ?? 0) };
}
