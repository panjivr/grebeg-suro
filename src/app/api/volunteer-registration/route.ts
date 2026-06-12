import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  REGISTRATION_DIVISIONS,
  REGISTRATION_EVENT,
  REGISTRATION_SKILLS,
} from "@/lib/registration-data";

const divisionIds = REGISTRATION_DIVISIONS.map((d) => d.id) as [string, ...string[]];

const schema = z.object({
  nama: z.string().trim().min(3, "Nama lengkap minimal 3 karakter").max(120),
  nik: z.string().trim().regex(/^\d{16}$/, "NIK harus 16 digit angka"),
  tempatLahir: z.string().trim().min(2, "Tempat lahir wajib diisi").max(80),
  tanggalLahir: z.coerce.date({ errorMap: () => ({ message: "Tanggal lahir tidak valid" }) }),
  jenisKelamin: z.enum(["Laki-laki", "Perempuan"], {
    errorMap: () => ({ message: "Pilih jenis kelamin" }),
  }),
  statusNikah: z.enum(["Belum Menikah", "Menikah"], {
    errorMap: () => ({ message: "Pilih status pernikahan" }),
  }),
  whatsapp: z
    .string()
    .trim()
    .regex(/^(\+?62|0)8\d{7,12}$/, "Nomor WhatsApp tidak valid (contoh: 08xxxxxxxxxx)"),
  email: z.string().trim().email("Email tidak valid").max(120).optional().or(z.literal("")),
  alamat: z.string().trim().min(10, "Alamat lengkap minimal 10 karakter").max(500),
  pendidikan: z.string().trim().min(2, "Pilih pendidikan terakhir").max(40),
  pekerjaan: z.string().trim().max(120).optional(),
  kontakDarurat: z.string().trim().min(5, "Kontak darurat wajib diisi").max(160),
  ukuranKaos: z.enum(["S", "M", "L", "XL", "XXL"], {
    errorMap: () => ({ message: "Pilih ukuran kaos" }),
  }),
  izinOrtu: z.literal(true, {
    errorMap: () => ({ message: "Centang persetujuan izin orang tua/wali" }),
  }),
  divisiUtama: z.enum(divisionIds, { errorMap: () => ({ message: "Pilih divisi utama" }) }),
  divisiCadangan: z.enum(divisionIds).optional().or(z.literal("")),
  motivasi: z.string().trim().min(50, "Motivasi minimal 50 karakter").max(2000),
  pengalaman: z.string().trim().max(2000).optional(),
  keahlian: z.array(z.enum(REGISTRATION_SKILLS)).max(REGISTRATION_SKILLS.length).default([]),
  kendaraan: z.enum(["Motor", "Mobil", "Keduanya", "Tidak bisa"], {
    errorMap: () => ({ message: "Pilih kemampuan berkendara" }),
  }),
  sim: z.enum(["SIM A", "SIM C", "SIM A & C", "Tidak punya"], {
    errorMap: () => ({ message: "Pilih kepemilikan SIM" }),
  }),
  kondisiFisik: z.enum(["Sangat fit", "Fit", "Memiliki keterbatasan tertentu"], {
    errorMap: () => ({ message: "Pilih kondisi fisik" }),
  }),
  ketersediaan: z.enum(["Ya, full 10 hari", "Sebagian hari saja"], {
    errorMap: () => ({ message: "Pilih ketersediaan" }),
  }),
  tanggalTersedia: z.string().trim().max(160).optional(),
  riwayatPenyakit: z.string().trim().max(300).optional(),
  golonganDarah: z.string().trim().max(20).optional(),
  sumberInfo: z.string().trim().max(60).optional(),
  komitmen: z.literal(true, {
    errorMap: () => ({ message: "Centang pernyataan komitmen" }),
  }),
});

async function nextRegNumber(): Promise<string> {
  const count = await prisma.volunteerRegistration.count();
  return `${REGISTRATION_EVENT.regPrefix}-${String(count + 1).padStart(4, "0")}`;
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  if (d.divisiCadangan && d.divisiCadangan === d.divisiUtama) {
    return NextResponse.json(
      { error: "Divisi cadangan harus berbeda dari divisi utama" },
      { status: 400 }
    );
  }

  // Nomor urut bisa balapan antar-request — coba ulang beberapa kali bila tabrakan.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const created = await prisma.volunteerRegistration.create({
        data: {
          regNumber: await nextRegNumber(),
          nama: d.nama,
          nik: d.nik,
          tempatLahir: d.tempatLahir,
          tanggalLahir: d.tanggalLahir,
          jenisKelamin: d.jenisKelamin,
          statusNikah: d.statusNikah,
          whatsapp: d.whatsapp,
          email: d.email || null,
          alamat: d.alamat,
          pendidikan: d.pendidikan,
          pekerjaan: d.pekerjaan || null,
          kontakDarurat: d.kontakDarurat,
          ukuranKaos: d.ukuranKaos,
          izinOrtu: d.izinOrtu,
          divisiUtama: d.divisiUtama,
          divisiCadangan: d.divisiCadangan || null,
          motivasi: d.motivasi,
          pengalaman: d.pengalaman || null,
          keahlian: d.keahlian,
          kendaraan: d.kendaraan,
          sim: d.sim,
          kondisiFisik: d.kondisiFisik,
          ketersediaan: d.ketersediaan,
          tanggalTersedia: d.tanggalTersedia || null,
          riwayatPenyakit: d.riwayatPenyakit || null,
          golonganDarah: d.golonganDarah || null,
          sumberInfo: d.sumberInfo || null,
          komitmen: d.komitmen,
        },
        select: { regNumber: true },
      });
      return NextResponse.json({ regNumber: created.regNumber }, { status: 201 });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = (err.meta?.target ?? []) as string[];
        if (target.includes("nik")) {
          return NextResponse.json(
            { error: "NIK ini sudah terdaftar. Hubungi panitia bila merasa belum pernah mendaftar." },
            { status: 409 }
          );
        }
        continue; // tabrakan nomor pendaftaran — hitung ulang
      }
      console.error("volunteer-registration:", err);
      return NextResponse.json(
        { error: "Terjadi kesalahan server. Coba lagi beberapa saat." },
        { status: 500 }
      );
    }
  }
  return NextResponse.json(
    { error: "Sistem sedang sibuk, silakan coba lagi." },
    { status: 503 }
  );
}
