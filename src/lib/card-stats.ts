/**
 * Perhitungan statistik untuk Kartu Volunteer (pure, dipakai server & klien).
 */

export interface CardAggregate {
  totalDays: number; // jumlah hari unik bertugas
  totalMs: number; // total durasi sesi yang lengkap (ada clock-in & out)
  sessions: number; // jumlah catatan kehadiran (hari)
  onTime: number; // status PRESENT
  late: number; // status LATE
  withClockOut: number; // sesi yang punya clock-out
  firstDate: string | null; // ISO date
  lastDate: string | null;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Rating bintang 1..5 (0 bila belum pernah bertugas).
 * Komposit: komitmen hari (45%), kedisiplinan/ketepatan (30%), kelengkapan
 * clock-out (25%). Target hari penuh = 5 (panjang rangkaian festival).
 */
export function computeStars(a: CardAggregate): number {
  if (a.sessions === 0) return 0;
  const dayScore = clamp(a.totalDays / 5, 0, 1);
  const punctual = a.onTime / a.sessions; // PRESENT dianggap tepat waktu
  const completion = a.withClockOut / a.sessions;
  const raw = 0.45 * dayScore + 0.3 * punctual + 0.25 * completion;
  return clamp(Math.round(1 + raw * 4), 1, 5);
}

/** Total jam dalam angka (untuk "HP" kartu). */
export function totalHoursNumber(ms: number): number {
  return Math.round((ms / 3_600_000) * 10) / 10;
}

/** "12 jam 30 menit" / "45 menit". */
export function formatDurationLong(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return m > 0 ? `${h} jam ${m} menit` : `${h} jam`;
  return `${m} menit`;
}

const ID_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function fmt(d: string): { day: number; mon: number; year: number } {
  const [y, m, day] = d.split("-").map(Number);
  return { day, mon: m - 1, year: y };
}

/** "8 – 9 Jun 2026" atau "8 Jun 2026" (satu hari). */
export function formatPeriod(first: string | null, last: string | null): string {
  if (!first) return "—";
  const a = fmt(first);
  if (!last || last === first) return `${a.day} ${ID_MONTHS[a.mon]} ${a.year}`;
  const b = fmt(last);
  if (a.year === b.year && a.mon === b.mon)
    return `${a.day}–${b.day} ${ID_MONTHS[a.mon]} ${a.year}`;
  if (a.year === b.year)
    return `${a.day} ${ID_MONTHS[a.mon]} – ${b.day} ${ID_MONTHS[b.mon]} ${a.year}`;
  return `${a.day} ${ID_MONTHS[a.mon]} ${a.year} – ${b.day} ${ID_MONTHS[b.mon]} ${b.year}`;
}
