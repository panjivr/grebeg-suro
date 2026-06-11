"use client";

import {
  BadgeCheck,
  Briefcase,
  Cake,
  CalendarDays,
  ExternalLink,
  FileText,
  Heart,
  IdCard,
  Image as ImageIcon,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateShort } from "@/lib/utils";

/** Data formulir pendaftaran — semua nullable: yang kosong tidak ditampilkan. */
export interface VolunteerProfileData {
  registeredAt: string | null;
  birthDate: string | null; // ISO; ambil bagian tanggal saja
  gender: string | null;
  address: string | null;
  whatsapp: string | null;
  email: string | null;
  socialMedia: string | null;
  occupation: string | null;
  medicalHistory: string | null;
  previousCommittee: boolean | null;
  chosenDivision: string | null;
  ktpPhotoUrl: string | null;
  diplomaUrl: string | null;
  photo3x4Url: string | null;
  cvUrl: string | null;
  portfolioUrl: string | null;
  aiTools: string | null;
}

export function genderLabel(g: string | null): string | null {
  if (!g) return null;
  const up = g.trim().toUpperCase();
  if (up.startsWith("PEREMPUAN")) return "Perempuan";
  if (up.startsWith("LAKI")) return "Laki-laki";
  return g;
}

/** Parse tanggal lahir (ISO) ke komponen lokal tanpa pergeseran zona waktu. */
export function parseBirthDate(iso: string | null): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export interface BirthdayInfo {
  age: number; // umur saat ini
  nextAge: number; // umur yang akan dicapai
  daysLeft: number; // hari menuju ulang tahun berikutnya (0 = hari ini)
  isToday: boolean;
  dateLabel: string; // tanggal lahir terformat
}

export function birthdayInfo(iso: string | null, now: Date): BirthdayInfo | null {
  const birth = parseBirthDate(iso);
  if (!birth) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthdayThisYear) age -= 1;

  let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
  const daysLeft = Math.round((next.getTime() - today.getTime()) / 86_400_000);
  const isToday = daysLeft === 0;
  return {
    age,
    nextAge: isToday ? age : age + 1,
    daysLeft,
    isToday,
    dateLabel: birth.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
  };
}

interface RowDef {
  icon: React.ElementType;
  label: string;
  value: string | null;
}

/** Detail data diri volunteer (A–Z) — dipakai di dashboard volunteer & dialog admin. */
export function ProfileDetails({
  profile,
  now,
}: {
  profile: VolunteerProfileData;
  now?: Date;
}) {
  const bday = birthdayInfo(profile.birthDate, now ?? new Date());

  const rows: RowDef[] = [
    {
      icon: Cake,
      label: "Tanggal Lahir",
      value: bday ? `${bday.dateLabel} (${bday.age} tahun)` : null,
    },
    { icon: Users, label: "Jenis Kelamin", value: genderLabel(profile.gender) },
    { icon: MapPin, label: "Alamat Domisili", value: profile.address },
    { icon: Phone, label: "WhatsApp", value: profile.whatsapp },
    { icon: Mail, label: "Email", value: profile.email },
    { icon: Instagram, label: "Sosial Media", value: profile.socialMedia },
    { icon: Briefcase, label: "Pekerjaan / Kesibukan", value: profile.occupation },
    { icon: Heart, label: "Riwayat Penyakit", value: profile.medicalHistory },
    {
      icon: BadgeCheck,
      label: "Pernah Panitia Grebeg Suro",
      value:
        profile.previousCommittee === null ? null : profile.previousCommittee ? "Ya" : "Tidak",
    },
    { icon: Users, label: "Divisi Pilihan (Formulir)", value: profile.chosenDivision },
    { icon: Sparkles, label: "Tools AI yang Digunakan", value: profile.aiTools },
    {
      icon: CalendarDays,
      label: "Tanggal Mendaftar",
      value: profile.registeredAt ? formatDateShort(profile.registeredAt) : null,
    },
  ].filter((r) => r.value);

  const docs = [
    { icon: IdCard, label: "Foto KTP", url: profile.ktpPhotoUrl },
    { icon: FileText, label: "Ijazah / SKL", url: profile.diplomaUrl },
    { icon: ImageIcon, label: "Foto 3×4", url: profile.photo3x4Url },
    { icon: FileText, label: "CV / Riwayat Hidup", url: profile.cvUrl },
    { icon: ExternalLink, label: "Portofolio", url: profile.portfolioUrl },
  ].filter((d) => d.url);

  if (rows.length === 0 && docs.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Data formulir pendaftaran belum tersedia untuk akun ini.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {rows.length > 0 && (
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-3">
              <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10">
                <r.icon className="h-4 w-4 text-brand" />
              </div>
              <div className="min-w-0">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  {r.label}
                </dt>
                <dd className="whitespace-pre-line break-words text-sm font-medium text-ink">
                  {r.value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      )}

      {docs.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            Dokumen Pendaftaran
          </p>
          <div className="flex flex-wrap gap-2">
            {docs.map((d) => (
              <Button key={d.label} asChild size="sm" variant="outline">
                <a href={d.url!} target="_blank" rel="noopener noreferrer">
                  <d.icon className="h-4 w-4" /> {d.label}
                </a>
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Dokumen tersimpan di Google Drive panitia — butuh akses untuk membuka.
          </p>
        </div>
      )}

      {bday?.isToday && (
        <Badge variant="success" className="gap-1 text-sm">
          🎉 Selamat ulang tahun ke-{bday.age}!
        </Badge>
      )}
    </div>
  );
}
