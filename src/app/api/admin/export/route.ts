import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { formatTime, statusLabels, roleLabels } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "excel";
  const dateParam = searchParams.get("date");

  const day = dateParam ? new Date(dateParam) : new Date();
  day.setHours(0, 0, 0, 0);
  const dateLabel = day.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

  const records = await prisma.attendance.findMany({
    where: { workDate: day },
    include: { user: { include: { division: true } } },
    orderBy: { clockIn: "asc" },
  });

  const rows = records.map((r, i) => ({
    no: i + 1,
    name: r.user.name,
    role: roleLabels[r.user.role] ?? r.user.role,
    division: r.user.division?.name ?? "-",
    clockIn: formatTime(r.clockIn),
    clockOut: formatTime(r.clockOut),
    status: statusLabels[r.status] ?? r.status,
  }));

  if (format === "pdf") {
    const pdf = await PDFDocument.create();
    let page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const brand = rgb(0.129, 0.518, 1);
    let y = 800;

    page.drawText("Laporan Absensi Relawan", { x: 40, y, size: 18, font: bold, color: brand });
    y -= 22;
    page.drawText("Grebeg Suro & Festival Nasional Reog Ponorogo", { x: 40, y, size: 11, font });
    y -= 16;
    page.drawText(`Tanggal: ${dateLabel}`, { x: 40, y, size: 10, font });
    y -= 24;

    const headers = ["No", "Nama", "Divisi", "Masuk", "Keluar", "Status"];
    const cols = [40, 70, 250, 360, 430, 500];
    headers.forEach((h, i) => page.drawText(h, { x: cols[i], y, size: 10, font: bold }));
    y -= 6;
    page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: brand });
    y -= 16;

    for (const row of rows) {
      if (y < 50) {
        page = pdf.addPage([595, 842]);
        y = 800;
      }
      const vals = [String(row.no), row.name.slice(0, 28), row.division.slice(0, 18), row.clockIn, row.clockOut, row.status];
      vals.forEach((v, i) => page.drawText(v, { x: cols[i], y, size: 9, font }));
      y -= 16;
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="absensi-${day.toISOString().slice(0, 10)}.pdf"`,
      },
    });
  }

  // Excel
  const wb = new ExcelJS.Workbook();
  wb.creator = "Grebeg Suro Attendance";
  const ws = wb.addWorksheet("Absensi");

  ws.mergeCells("A1:G1");
  ws.getCell("A1").value = "Laporan Absensi Relawan — Grebeg Suro";
  ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF00308F" } };
  ws.mergeCells("A2:G2");
  ws.getCell("A2").value = `Tanggal: ${dateLabel}`;

  ws.addRow([]);
  const header = ws.addRow(["No", "Nama", "Role", "Divisi", "Clock In", "Clock Out", "Status"]);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00308F" } };
  });

  rows.forEach((r) => ws.addRow([r.no, r.name, r.role, r.division, r.clockIn, r.clockOut, r.status]));
  ws.columns.forEach((col) => (col.width = 18));
  ws.getColumn(1).width = 6;

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="absensi-${day.toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
