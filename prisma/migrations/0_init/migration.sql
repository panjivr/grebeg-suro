-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VOLUNTEER', 'EO', 'COORDINATOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'ON_DUTY');

-- CreateTable
CREATE TABLE "divisions" (
    "id" TEXT NOT NULL,
    "division_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VOLUNTEER',
    "profile_photo" TEXT,
    "shift" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "division_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "clock_in" TIMESTAMP(3),
    "clock_out" TIMESTAMP(3),
    "clockin_photo" TEXT,
    "clockout_photo" TEXT,
    "clockin_lat" DOUBLE PRECISION,
    "clockin_long" DOUBLE PRECISION,
    "clockout_lat" DOUBLE PRECISION,
    "clockout_long" DOUBLE PRECISION,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ON_DUTY',
    "work_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_settings" (
    "id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_lat" DOUBLE PRECISION NOT NULL,
    "event_long" DOUBLE PRECISION NOT NULL,
    "radius_meter" INTEGER NOT NULL DEFAULT 150,
    "shift_start" TEXT NOT NULL DEFAULT '08:00',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "divisions_division_name_key" ON "divisions"("division_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_division_id_idx" ON "users"("division_id");

-- CreateIndex
CREATE INDEX "attendance_user_id_idx" ON "attendance"("user_id");

-- CreateIndex
CREATE INDEX "attendance_work_date_idx" ON "attendance"("work_date");

-- CreateIndex
CREATE INDEX "attendance_status_idx" ON "attendance"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
