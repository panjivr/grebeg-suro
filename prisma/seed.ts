import { PrismaClient, Role, AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Grebeg Suro database...");

  // ---- Event settings (geofence) ----
  const existingEvent = await prisma.eventSetting.findFirst();
  if (!existingEvent) {
    await prisma.eventSetting.create({
      data: {
        eventName: process.env.EVENT_NAME ?? "Grebeg Suro & Festival Nasional Reog Ponorogo",
        eventLat: Number(process.env.EVENT_LAT ?? -7.865),
        eventLong: Number(process.env.EVENT_LONG ?? 111.469),
        radiusMeter: Number(process.env.EVENT_RADIUS_METER ?? 150),
        shiftStart: "08:00",
        isActive: true,
      },
    });
    console.log("✓ Event settings created");
  }

  // ---- Divisions ----
  const divisionData = [
    { name: "Keamanan", description: "Pengamanan area dan kerumunan" },
    { name: "Konsumsi", description: "Logistik makanan & minuman" },
    { name: "Acara", description: "Koordinasi rundown panggung utama" },
    { name: "Dokumentasi", description: "Foto, video, dan media sosial" },
    { name: "Medis", description: "Pos kesehatan & P3K" },
    { name: "Transportasi", description: "Mobilitas peserta & tamu" },
    { name: "Humas", description: "Hubungan masyarakat & tamu undangan" },
    { name: "Kebersihan", description: "Sanitasi & kebersihan area" },
  ];

  const divisions = [];
  for (const d of divisionData) {
    const div = await prisma.division.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    });
    divisions.push(div);
  }
  console.log(`✓ ${divisions.length} divisions ready`);

  // ---- Users ----
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  const baseUsers = [
    { name: "Super Admin", username: "superadmin", phone: "081200000001", role: Role.SUPER_ADMIN, password: "admin123" },
    { name: "Admin Festival", username: "admin", phone: "081200000002", role: Role.ADMIN, password: "admin123" },
    { name: "Koordinator Lapangan", username: "koordinator", phone: "081200000003", role: Role.COORDINATOR, password: "koor123", division: "Acara" },
    { name: "EO Reog Nasional", username: "eo", phone: "081200000004", role: Role.EO, password: "eo12345", division: "Acara" },
  ];

  for (const u of baseUsers) {
    const division = u.division ? divisions.find((d) => d.name === u.division) : undefined;
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        name: u.name,
        username: u.username,
        phone: u.phone,
        password: hash(u.password),
        role: u.role,
        divisionId: division?.id,
      },
    });
  }

  // 24 sample volunteers spread across divisions
  const firstNames = ["Budi", "Siti", "Agus", "Dewi", "Eko", "Rina", "Joko", "Wati", "Bayu", "Nur", "Yudi", "Lina", "Andi", "Sri", "Tono", "Mega", "Wahyu", "Indah", "Galih", "Putri", "Rudi", "Ayu", "Fajar", "Dian"];
  for (let i = 0; i < firstNames.length; i++) {
    const division = divisions[i % divisions.length];
    const username = `relawan${String(i + 1).padStart(2, "0")}`;
    await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        name: `${firstNames[i]} Relawan`,
        username,
        phone: `0813000000${String(i + 10).padStart(2, "0")}`,
        password: hash("relawan123"),
        role: Role.VOLUNTEER,
        divisionId: division.id,
        shift: i % 2 === 0 ? "Pagi (08:00 - 16:00)" : "Sore (14:00 - 22:00)",
      },
    });
  }
  console.log("✓ Volunteers + staff created");

  // ---- Sample attendance for today ----
  const volunteers = await prisma.user.findMany({ where: { role: Role.VOLUNTEER }, take: 12 });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < volunteers.length; i++) {
    const v = volunteers[i];
    const existing = await prisma.attendance.findFirst({
      where: { userId: v.id, workDate: today },
    });
    if (existing) continue;

    const clockIn = new Date();
    clockIn.setHours(7 + (i % 3), 30 + (i % 30), 0, 0);
    const late = clockIn.getHours() >= 8;

    await prisma.attendance.create({
      data: {
        userId: v.id,
        clockIn,
        clockInLat: -7.865 + (Math.random() - 0.5) * 0.0005,
        clockInLong: 111.469 + (Math.random() - 0.5) * 0.0005,
        status: i % 5 === 0 ? AttendanceStatus.ON_DUTY : late ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
        clockOut: i % 5 === 0 ? null : new Date(clockIn.getTime() + 8 * 3600 * 1000),
        workDate: today,
      },
    });
  }
  console.log("✓ Sample attendance created");

  console.log("\n✅ Seed complete!");
  console.log("\n  Login accounts (password):");
  console.log("  • superadmin / admin123   (Super Admin)");
  console.log("  • admin / admin123        (Admin)");
  console.log("  • koordinator / koor123   (Coordinator)");
  console.log("  • eo / eo12345            (EO)");
  console.log("  • relawan01 / relawan123  (Volunteer)\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
