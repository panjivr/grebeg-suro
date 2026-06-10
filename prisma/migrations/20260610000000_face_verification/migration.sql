-- CreateEnum
CREATE TYPE "VerifyMethod" AS ENUM ('FACE_AUTO', 'FACE_LOW_CONF', 'MANUAL_FALLBACK');

-- CreateEnum
CREATE TYPE "EmbeddingSource" AS ENUM ('SEED', 'CHECKIN');

-- CreateEnum
CREATE TYPE "FaceReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "face_matched_user_id" TEXT,
ADD COLUMN     "face_review_status" "FaceReviewStatus",
ADD COLUMN     "face_reviewed_at" TIMESTAMP(3),
ADD COLUMN     "face_reviewed_by" TEXT,
ADD COLUMN     "face_similarity" DOUBLE PRECISION,
ADD COLUMN     "possible_mismatch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verify_method" "VerifyMethod";

-- CreateTable
CREATE TABLE "face_embeddings" (
    "id" TEXT NOT NULL,
    "volunteer_id" TEXT NOT NULL,
    "embedding" BYTEA NOT NULL,
    "source" "EmbeddingSource" NOT NULL,
    "det_score" DOUBLE PRECISION NOT NULL,
    "similarity" DOUBLE PRECISION,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "face_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_verify_logs" (
    "id" TEXT NOT NULL,
    "volunteer_id" TEXT NOT NULL,
    "similarity" DOUBLE PRECISION,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "det_score" DOUBLE PRECISION,
    "matched_user_id" TEXT,
    "latency_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "face_verify_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "face_embeddings_volunteer_id_idx" ON "face_embeddings"("volunteer_id");

-- CreateIndex
CREATE INDEX "face_verify_logs_volunteer_id_idx" ON "face_verify_logs"("volunteer_id");

-- CreateIndex
CREATE INDEX "face_verify_logs_created_at_idx" ON "face_verify_logs"("created_at");

-- CreateIndex
CREATE INDEX "attendance_face_review_status_idx" ON "attendance"("face_review_status");

-- AddForeignKey
ALTER TABLE "face_embeddings" ADD CONSTRAINT "face_embeddings_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

