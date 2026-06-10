export interface NavLink {
  href: string;
  label: string;
}

/** Tautan navigasi situs — dipakai header (client) & footer (server). */
export const NAV: NavLink[] = [
  { href: "/#tentang", label: "Tentang" },
  { href: "/#sejarah", label: "Sejarah" },
  { href: "/#rangkaian", label: "Rangkaian Acara" },
  { href: "/#reog", label: "Reog Ponorogo" },
  { href: "/#jadwal", label: "Jadwal 2026" },
  { href: "/#tiket", label: "Tiket" },
  { href: "/volunteer-grebeg-suro", label: "Volunteer" },
];
