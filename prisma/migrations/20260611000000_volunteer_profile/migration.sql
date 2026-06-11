-- CreateTable
CREATE TABLE "volunteer_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3),
    "birth_date" DATE,
    "gender" TEXT,
    "address" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "social_media" TEXT,
    "occupation" TEXT,
    "medical_history" TEXT,
    "previous_committee" BOOLEAN,
    "chosen_division" TEXT,
    "ktp_photo_url" TEXT,
    "diploma_url" TEXT,
    "photo_3x4_url" TEXT,
    "cv_url" TEXT,
    "portfolio_url" TEXT,
    "ai_tools" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_profiles_user_id_key" ON "volunteer_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

