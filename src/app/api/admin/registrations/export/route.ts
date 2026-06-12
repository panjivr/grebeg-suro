import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { formatDateShort } from "@/lib/utils";
import {
  REGISTRATION_STATUSES,
  divisionName,
  registrationStatusLabels,
  type RegistrationStatusValue,
} from "@/lib/registration-data";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const status = REGISTRATION_STATUSES.includes(statusParam as RegistrationStatusValue)
    ? (statusParam as RegistrationStatusValue)
    : undefined;

  const records = await prisma.volunteerRegistration.findMany({
    where: status ? { status } : undefined,
    orderBy: { regNumber: "asc" },
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "Grebeg Suro Attendance";
  const ws = wb.addWorksheet("Pendaftar Volunteer");

  ws.mergeCells("A1:Z1");
  ws.getCell("A1").value = "Data Pendaftar Volunteer Grebeg Suro 2027";
  ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF00308F" } };
  ws.mergeCells("A2:Z2");
  ws.getCell("A2").value = `Diekspor: ${new Date().toLocaleString("id-ID")}${
    status ? ` · Filter status: ${registrationStatusLabels[status]}` : ""
  } · Total: ${records.length} pendaftar`;

  ws.addRow([]);
  const header = ws.addRow([
    "No",
    "No. Pendaftaran",
    "Nama",
    "NIK",
    "Tempat Lahir",
    "Tanggal Lahir",
    "Jenis Kelamin",
    "Status Nikah",
    "WhatsApp",
    "Email",
    "Alamat",
    "Pendidikan",
    "Pekerjaan",
    "Kontak Darurat",
    "Ukuran Kaos",
    "Divisi Utama",
    "Divisi Cadangan",
    "Motivasi",
    "Pengalaman",
    "Keahlian",
    "Kendaraan",
    "SIM",
    "Kondisi Fisik",
    "Ketersediaan",
    "Tanggal Tersedia",
    "Riwayat Penyakit",
    "Gol. Darah",
    "Sumber Info",
    "Status Seleksi",
    "Catatan Panitia",
    "Tanggal Daftar",
  ]);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00308F" } };
  });

  records.forEach((r, i) =>
    ws.addRow([
      i + 1,
      r.regNumber,
      r.nama,
      r.nik,
      r.tempatLahir,
      formatDateShort(r.tanggalLahir),
      r.jenisKelamin,
      r.statusNikah,
      r.whatsapp,
      r.email ?? "-",
      r.alamat,
      r.pendidikan,
      r.pekerjaan ?? "-",
      r.kontakDarurat,
      r.ukuranKaos,
      divisionName(r.divisiUtama),
      divisionName(r.divisiCadangan),
      r.motivasi,
      r.pengalaman ?? "-",
      r.keahlian.join(", ") || "-",
      r.kendaraan,
      r.sim,
      r.kondisiFisik,
      r.ketersediaan,
      r.tanggalTersedia ?? "-",
      r.riwayatPenyakit ?? "-",
      r.golonganDarah ?? "-",
      r.sumberInfo ?? "-",
      registrationStatusLabels[r.status as RegistrationStatusValue] ?? r.status,
      r.catatan ?? "-",
      formatDateShort(r.createdAt),
    ])
  );

  ws.columns.forEach((col) => (col.width = 20));
  ws.getColumn(1).width = 5;
  ws.getColumn(11).width = 38; // alamat
  ws.getColumn(18).width = 45; // motivasi

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="pendaftar-volunteer-gs27-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
