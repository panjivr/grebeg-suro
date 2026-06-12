/**
 * Konstanta bersama pendaftaran Volunteer Grebeg Suro 2027 — dipakai oleh
 * formulir publik, validasi API, dan panel admin pendaftar.
 */

export const REGISTRATION_EVENT = {
  title: "Pendaftaran Volunteer Grebeg Suro 2027",
  subtitle: "Festival Nasional Reog Ponorogo · 29 Mei – 7 Juni 2027",
  openedAt: "16 Juni 2026",
  regPrefix: "GS27",
  timeline:
    "Pengumuman berkas 23 Apr · Wawancara 26 Apr · Bimtek 1: 3 Mei · Bimtek 2: 10 Mei · Pelantikan 15 Mei · Festival 29 Mei – 7 Jun 2027",
} as const;

export interface RegistrationDivision {
  id: string;
  name: string;
  sub: string;
  quota: number;
  jobs: string;
}

export const REGISTRATION_DIVISIONS: RegistrationDivision[] = [
  { id: "stage", name: "Stage Management", sub: "Panggung & Artistik", quota: 12, jobs: "Floor manager, rundown lapangan, koordinasi talent & performer, cue system, backstage control" },
  { id: "security", name: "Security & Crowd Control", sub: "Keamanan & Ketertiban", quota: 20, jobs: "Crowd management, akses zonasi, koordinasi satpam & TNI/Polri, evakuasi darurat" },
  { id: "mediadoc", name: "Media & Documentation", sub: "Publikasi & Konten", quota: 10, jobs: "Foto & videografi event, live coverage sosmed, daily content, press room support" },
  { id: "runner", name: "Runner & Logistics", sub: "Operasional Lapangan", quota: 15, jobs: "Distribusi perlengkapan, konsumsi, gudang, mobilitas barang antar zona" },
  { id: "lo", name: "Liaison Officer (LO)", sub: "Hubungan Tamu & Delegasi", quota: 8, jobs: "Pendampingan tamu VVIP/delegasi, penerjemah, koordinasi protokol & akomodasi" },
  { id: "protocol", name: "Protocol & Ceremonial", sub: "Tata Upacara", quota: 8, jobs: "Prosesi seremonial, penyambutan tamu resmi, MC pendamping, tata tempat duduk" },
  { id: "admin", name: "Administration & Data", sub: "Sekretariat & Registrasi", quota: 8, jobs: "Registrasi peserta, absensi, pengarsipan data, helpdesk informasi" },
  { id: "ticketing", name: "Ticketing & Gate", sub: "Tiket & Akses", quota: 10, jobs: "Verifikasi tiket, gate access, wristband, penanganan antrian masuk" },
  { id: "merchandise", name: "Merchandise & Retail", sub: "Booth & Penjualan", quota: 8, jobs: "Pengelolaan booth merch, penjualan, stok harian, laporan penjualan" },
  { id: "medical", name: "Medical First Responder", sub: "Kesehatan & P3K", quota: 8, jobs: "Pertolongan pertama, pos medis, evakuasi medis, koordinasi ambulans" },
];

export function divisionName(id: string | null | undefined): string {
  if (!id) return "—";
  return REGISTRATION_DIVISIONS.find((d) => d.id === id)?.name ?? id;
}

export const REGISTRATION_SKILLS = [
  "Fotografi",
  "Videografi",
  "Desain Grafis",
  "MC/Host",
  "Medis/PMR",
  "Bahasa Inggris",
  "Bahasa Jawa Krama",
  "Public Speaking",
  "IT/Komputer",
  "Admin/Data",
  "Mengemudi",
  "Drone",
  "Sosial Media",
  "Seni Reog",
  "Lainnya",
] as const;

export const REGISTRATION_STATUSES = [
  "BARU",
  "LOLOS_BERKAS",
  "WAWANCARA",
  "LOLOS",
  "CADANGAN",
  "TIDAK_LOLOS",
] as const;

export type RegistrationStatusValue = (typeof REGISTRATION_STATUSES)[number];

export const registrationStatusLabels: Record<RegistrationStatusValue, string> = {
  BARU: "Pendaftar Baru",
  LOLOS_BERKAS: "Lolos Berkas",
  WAWANCARA: "Tahap Wawancara",
  LOLOS: "Lolos / Diterima",
  CADANGAN: "Cadangan",
  TIDAK_LOLOS: "Tidak Lolos",
};

/** Ubah 08xx / +628xx menjadi format internasional 628xx untuk tautan wa.me */
export function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

/**
 * Template pesan pengumuman per status — dipakai tombol "Kirim WA" / "Kirim
 * Email" di panel admin. Admin masih bisa menyunting sebelum mengirim.
 */
export function statusMessage(opts: {
  status: RegistrationStatusValue;
  nama: string;
  regNumber: string;
  divisi: string;
}): { subject: string; body: string } {
  const { nama, regNumber, divisi } = opts;
  const salam = `Halo ${nama},`;
  const footer =
    "\n\nSalam budaya,\nPanitia Volunteer Grebeg Suro\nInstagram: @volunteer.grebegsuro.png";

  switch (opts.status) {
    case "LOLOS_BERKAS":
      return {
        subject: `[${regNumber}] Lolos Seleksi Berkas — Volunteer Grebeg Suro 2027`,
        body:
          `${salam}\n\nSelamat! Pendaftaran Anda (No. ${regNumber}, divisi ${divisi}) dinyatakan LOLOS SELEKSI BERKAS Volunteer Grebeg Suro 2027.\n\nTahap selanjutnya adalah WAWANCARA. Jadwal & lokasi wawancara akan kami informasikan melalui WhatsApp/Instagram resmi. Mohon siapkan KTP/kartu pelajar dan datang tepat waktu.${footer}`,
      };
    case "WAWANCARA":
      return {
        subject: `[${regNumber}] Undangan Wawancara — Volunteer Grebeg Suro 2027`,
        body:
          `${salam}\n\nAnda diundang mengikuti tahap WAWANCARA seleksi Volunteer Grebeg Suro 2027 (No. ${regNumber}, divisi ${divisi}).\n\nMohon konfirmasi kehadiran dengan membalas pesan ini. Jadwal, lokasi, dan ketentuan akan disampaikan menyusul.${footer}`,
      };
    case "LOLOS":
      return {
        subject: `[${regNumber}] SELAMAT, Anda Diterima — Volunteer Grebeg Suro 2027`,
        body:
          `${salam}\n\nSELAMAT! Anda dinyatakan LOLOS sebagai Volunteer Grebeg Suro 2027 (No. ${regNumber}, divisi ${divisi}).\n\nAgenda Anda berikutnya:\n• Bimtek 1: 3 Mei 2027\n• Bimtek 2: 10 Mei 2027\n• Pelantikan: 15 Mei 2027\n• Festival: 29 Mei – 7 Juni 2027\n\nInformasi teknis (grup koordinasi, atribut, akun absensi) akan dikirim menyusul. Sampai jumpa di Bumi Reog!${footer}`,
      };
    case "CADANGAN":
      return {
        subject: `[${regNumber}] Status Cadangan — Volunteer Grebeg Suro 2027`,
        body:
          `${salam}\n\nTerima kasih telah mengikuti seleksi Volunteer Grebeg Suro 2027. Saat ini Anda berstatus CADANGAN (No. ${regNumber}, divisi ${divisi}).\n\nBila ada kuota yang tersedia, kami akan segera menghubungi Anda. Mohon tetap pantau WhatsApp dan Instagram resmi.${footer}`,
      };
    case "TIDAK_LOLOS":
      return {
        subject: `[${regNumber}] Hasil Seleksi — Volunteer Grebeg Suro 2027`,
        body:
          `${salam}\n\nTerima kasih atas antusiasme Anda mengikuti seleksi Volunteer Grebeg Suro 2027 (No. ${regNumber}). Mohon maaf, Anda belum dapat bergabung pada tahun ini.\n\nJangan berkecil hati — pendaftaran dibuka kembali setiap tahun, dan kami menantikan partisipasi Anda berikutnya.${footer}`,
      };
    case "BARU":
    default:
      return {
        subject: `[${regNumber}] Pendaftaran Diterima — Volunteer Grebeg Suro 2027`,
        body:
          `${salam}\n\nPendaftaran Anda sebagai calon Volunteer Grebeg Suro 2027 telah kami terima dengan nomor ${regNumber} (divisi ${divisi}).\n\nHasil seleksi berkas akan diumumkan melalui WhatsApp/Instagram resmi. Simpan nomor pendaftaran Anda.${footer}`,
      };
  }
}
