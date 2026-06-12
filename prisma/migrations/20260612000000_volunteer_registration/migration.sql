-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('BARU', 'LOLOS_BERKAS', 'WAWANCARA', 'LOLOS', 'CADANGAN', 'TIDAK_LOLOS');

-- CreateTable
CREATE TABLE "volunteer_registrations" (
    "id" TEXT NOT NULL,
    "reg_number" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "tempat_lahir" TEXT NOT NULL,
    "tanggal_lahir" DATE NOT NULL,
    "jenis_kelamin" TEXT NOT NULL,
    "status_nikah" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT,
    "alamat" TEXT NOT NULL,
    "pendidikan" TEXT NOT NULL,
    "pekerjaan" TEXT,
    "kontak_darurat" TEXT NOT NULL,
    "ukuran_kaos" TEXT NOT NULL,
    "izin_ortu" BOOLEAN NOT NULL DEFAULT false,
    "divisi_utama" TEXT NOT NULL,
    "divisi_cadangan" TEXT,
    "motivasi" TEXT NOT NULL,
    "pengalaman" TEXT,
    "keahlian" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kendaraan" TEXT NOT NULL,
    "sim" TEXT NOT NULL,
    "kondisi_fisik" TEXT NOT NULL,
    "ketersediaan" TEXT NOT NULL,
    "tanggal_tersedia" TEXT,
    "riwayat_penyakit" TEXT,
    "golongan_darah" TEXT,
    "sumber_info" TEXT,
    "komitmen" BOOLEAN NOT NULL DEFAULT false,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'BARU',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_registrations_reg_number_key" ON "volunteer_registrations"("reg_number");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_registrations_nik_key" ON "volunteer_registrations"("nik");

-- CreateIndex
CREATE INDEX "volunteer_registrations_status_idx" ON "volunteer_registrations"("status");

-- CreateIndex
CREATE INDEX "volunteer_registrations_divisi_utama_idx" ON "volunteer_registrations"("divisi_utama");

-- CreateIndex
CREATE INDEX "volunteer_registrations_created_at_idx" ON "volunteer_registrations"("created_at");

