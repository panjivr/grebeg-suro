import "server-only";
import ExcelJS from "exceljs";
import { normalizeName } from "./name-match";

/**
 * Parser ekspor absensi dari aplikasi LAMA (sebelum web ini ada).
 * Sheet "Attendance" berisi event DATANG (clock-in) & PULANG (clock-out)
 * dengan timestamp epoch. Beberapa kolom header menggunakan label kembar,
 * jadi parsing dilakukan berbasis ISI sel (bukan posisi header) agar tahan
 * banting:
 *  - tipe  : sel yang bernilai "DATANG"/"PULANG"
 *  - ts    : sel angka epoch-ms (~2017..2033)
 *  - nama  : kolom 3 (teks)
 *  - tanggal kerja diturunkan dari ts dalam zona WIB (UTC+7)
 */

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const MIN_EPOCH = 1.5e12; // ~2017-07
const MAX_EPOCH = 2.0e12; // ~2033-05

export interface ImportSession {
  name: string; // nama asli dari sheet
  role: string; // divisi/jobdesk teks dari sheet
  workDate: string; // YYYY-MM-DD (WIB)
  clockInTs: number;
  clockOutTs: number | null;
}

function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    const o = v as unknown as Record<string, unknown>;
    if (typeof o.text === "string") return o.text;
    if (o.result !== undefined && o.result !== null) return String(o.result);
    if (Array.isArray(o.richText)) return o.richText.map((t) => (t as { text?: string }).text ?? "").join("");
  }
  return "";
}

function wibDate(ts: number): string {
  // Tanggal kalender di zona WIB
  return new Date(ts + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

interface RawEvent {
  name: string;
  role: string;
  type: "DATANG" | "PULANG";
  ts: number;
}

function parseRow(cells: string[]): RawEvent | null {
  // nama = kolom ke-3 (index 2); fallback: teks panjang pertama yang bukan angka/tanggal
  const name = (cells[2] ?? "").trim();
  if (!name) return null;

  let type: "DATANG" | "PULANG" | null = null;
  let ts: number | null = null;
  let role = (cells[4] ?? "").trim(); // kolom ke-5 = role/divisi

  for (const raw of cells) {
    const t = raw.trim();
    if (!t) continue;
    const up = t.toUpperCase();
    if (!type && (up === "DATANG" || up === "PULANG")) type = up as "DATANG" | "PULANG";
    if (ts === null) {
      const n = Number(t);
      if (Number.isFinite(n) && n >= MIN_EPOCH && n <= MAX_EPOCH) ts = n;
    }
  }
  if (!type || ts === null) return null;
  if (!role) role = "—";
  return { name, role, type, ts };
}

/** Parse buffer xlsx -> daftar sesi (per orang per hari). */
export async function parseAttendanceWorkbook(buf: Buffer): Promise<{
  sessions: ImportSession[];
  totalEvents: number;
}> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const ws =
    wb.getWorksheet("Attendance") ??
    wb.worksheets.find((w) => /atten|absen|hadir/i.test(w.name)) ??
    wb.worksheets[0];
  if (!ws) return { sessions: [], totalEvents: 0 };

  const events: RawEvent[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    for (let c = 1; c <= Math.max(ws.columnCount, 16); c++) {
      cells.push(cellText(row.getCell(c).value));
    }
    const ev = parseRow(cells);
    if (ev) events.push(ev);
  }

  // Group per (nama ternormalisasi | tanggal WIB)
  const groups = new Map<
    string,
    { name: string; role: string; workDate: string; datang: number[]; pulang: number[] }
  >();
  for (const e of events) {
    const workDate = wibDate(e.ts);
    const key = `${normalizeName(e.name)}|${workDate}`;
    let g = groups.get(key);
    if (!g) {
      g = { name: e.name, role: e.role, workDate, datang: [], pulang: [] };
      groups.set(key, g);
    }
    // role non-kosong pertama menang
    if ((!g.role || g.role === "—") && e.role && e.role !== "—") g.role = e.role;
    (e.type === "PULANG" ? g.pulang : g.datang).push(e.ts);
  }

  const sessions: ImportSession[] = [];
  for (const g of groups.values()) {
    const ins = g.datang.length ? g.datang : g.pulang; // fallback bila hanya ada PULANG
    const clockInTs = Math.min(...ins);
    const outCandidate = g.pulang.length ? Math.max(...g.pulang) : null;
    const clockOutTs =
      outCandidate !== null && outCandidate - clockInTs >= 60_000 ? outCandidate : null;
    sessions.push({ name: g.name, role: g.role, workDate: g.workDate, clockInTs, clockOutTs });
  }

  // Urutkan: tanggal lalu nama
  sessions.sort((a, b) => a.workDate.localeCompare(b.workDate) || a.name.localeCompare(b.name));
  return { sessions, totalEvents: events.length };
}
