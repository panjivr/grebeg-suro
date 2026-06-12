"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  REGISTRATION_DIVISIONS,
  REGISTRATION_EVENT,
  REGISTRATION_SKILLS,
} from "@/lib/registration-data";

const STEPS = ["Data Diri", "Divisi", "Kompetensi", "Review", "Selesai"];

interface FormState {
  nama: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  statusNikah: string;
  whatsapp: string;
  email: string;
  alamat: string;
  pendidikan: string;
  pekerjaan: string;
  kontakDarurat: string;
  ukuranKaos: string;
  izinOrtu: boolean;
  divisiUtama: string;
  divisiCadangan: string;
  motivasi: string;
  pengalaman: string;
  keahlian: string[];
  kendaraan: string;
  sim: string;
  kondisiFisik: string;
  ketersediaan: string;
  tanggalTersedia: string;
  riwayatPenyakit: string;
  golonganDarah: string;
  sumberInfo: string;
  komitmen: boolean;
}

const INITIAL: FormState = {
  nama: "",
  nik: "",
  tempatLahir: "",
  tanggalLahir: "",
  jenisKelamin: "",
  statusNikah: "",
  whatsapp: "",
  email: "",
  alamat: "",
  pendidikan: "",
  pekerjaan: "",
  kontakDarurat: "",
  ukuranKaos: "",
  izinOrtu: false,
  divisiUtama: "",
  divisiCadangan: "",
  motivasi: "",
  pengalaman: "",
  keahlian: [],
  kendaraan: "",
  sim: "",
  kondisiFisik: "",
  ketersediaan: "",
  tanggalTersedia: "",
  riwayatPenyakit: "",
  golonganDarah: "",
  sumberInfo: "",
  komitmen: false,
};

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-body">
        {label} {required && <span className="text-error">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [f, setF] = useState<FormState>(INITIAL);
  const [sending, setSending] = useState(false);
  const [regNumber, setRegNumber] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  const divisiUtama = useMemo(
    () => REGISTRATION_DIVISIONS.find((d) => d.id === f.divisiUtama),
    [f.divisiUtama]
  );

  function validateStep(target: number): string | null {
    if (target >= 2) {
      if (!f.nama.trim() || !f.tempatLahir.trim() || !f.tanggalLahir || !f.jenisKelamin || !f.statusNikah || !f.whatsapp.trim() || !f.alamat.trim() || !f.pendidikan || !f.kontakDarurat.trim() || !f.ukuranKaos)
        return "Lengkapi semua field wajib (*) pada Data Diri.";
      if (!/^\d{16}$/.test(f.nik.trim())) return "NIK harus 16 digit angka.";
      if (!/^(\+?62|0)8\d{7,12}$/.test(f.whatsapp.trim()))
        return "Nomor WhatsApp tidak valid (contoh: 08xxxxxxxxxx).";
      if (!f.izinOrtu) return "Centang persetujuan izin orang tua/wali.";
    }
    if (target >= 3) {
      if (!f.divisiUtama) return "Pilih divisi utama terlebih dahulu.";
      if (f.divisiCadangan && f.divisiCadangan === f.divisiUtama)
        return "Divisi cadangan harus berbeda dari divisi utama.";
      if (f.motivasi.trim().length < 50) return "Isi motivasi minimal 50 karakter.";
    }
    if (target >= 4) {
      if (!f.kendaraan || !f.sim || !f.kondisiFisik || !f.ketersediaan)
        return "Lengkapi semua field wajib (*) pada Kompetensi.";
      if (!f.komitmen) return "Centang pernyataan komitmen.";
    }
    return null;
  }

  function goStep(target: number) {
    if (target > step) {
      const err = validateStep(target);
      if (err) return void toast.error(err);
    }
    setStep(target);
  }

  async function submit() {
    setSending(true);
    try {
      const res = await fetch("/api/volunteer-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          email: f.email.trim() || undefined,
          pekerjaan: f.pekerjaan.trim() || undefined,
          divisiCadangan: f.divisiCadangan || undefined,
          pengalaman: f.pengalaman.trim() || undefined,
          tanggalTersedia: f.tanggalTersedia.trim() || undefined,
          riwayatPenyakit: f.riwayatPenyakit.trim() || undefined,
          golonganDarah: f.golonganDarah || undefined,
          sumberInfo: f.sumberInfo || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) return void toast.error(data.error ?? "Gagal mengirim pendaftaran");
      setRegNumber(data.regNumber);
      setStep(5);
      toast.success("Pendaftaran terkirim!");
    } catch {
      toast.error("Jaringan bermasalah. Coba lagi.");
    } finally {
      setSending(false);
    }
  }

  const review: [string, string][] = [
    ["Nama", f.nama],
    ["NIK", f.nik],
    ["TTL", `${f.tempatLahir}, ${f.tanggalLahir}`],
    ["No. WhatsApp", f.whatsapp],
    ["Email", f.email || "—"],
    ["Alamat", f.alamat],
    ["Pendidikan", f.pendidikan],
    ["Divisi Utama", divisiUtama ? `${divisiUtama.name} — ${divisiUtama.sub}` : "—"],
    [
      "Divisi Cadangan",
      REGISTRATION_DIVISIONS.find((d) => d.id === f.divisiCadangan)?.name ?? "—",
    ],
    ["Ketersediaan", f.ketersediaan],
    ["Keahlian", f.keahlian.length ? f.keahlian.join(", ") : "—"],
    ["Ukuran Kaos", f.ukuranKaos],
  ];

  return (
    <div>
      {/* Step bar */}
      <div className="mb-8 flex items-center">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = step > n ? "done" : step === n ? "active" : "idle";
          return (
            <div key={label} className="relative flex-1 text-center">
              {n < STEPS.length && (
                <span className="absolute right-0 top-3.5 z-0 h-px w-full translate-x-1/2 bg-border" />
              )}
              <div
                className={`relative z-10 mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  state === "done"
                    ? "bg-success text-white"
                    : state === "active"
                      ? "bg-brand text-white"
                      : "border border-border bg-card text-muted-foreground"
                }`}
              >
                {state === "done" || (n === 5 && step === 5) ? <Check className="h-3.5 w-3.5" /> : n}
              </div>
              <div className="text-[11px] text-muted-foreground">{label}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        {/* ===== Step 1: Data Diri ===== */}
        {step === 1 && (
          <div>
            <h2 className="mb-5 border-b border-border pb-3 font-display text-lg font-bold text-ink">
              Data Diri Pendaftar
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama Lengkap" required>
                <Input value={f.nama} onChange={(e) => set("nama", e.target.value)} placeholder="Sesuai KTP" />
              </Field>
              <Field label="NIK" required>
                <Input value={f.nik} onChange={(e) => set("nik", e.target.value.replace(/\D/g, ""))} placeholder="16 digit" maxLength={16} inputMode="numeric" />
              </Field>
              <Field label="Tempat Lahir" required>
                <Input value={f.tempatLahir} onChange={(e) => set("tempatLahir", e.target.value)} placeholder="Kota lahir" />
              </Field>
              <Field label="Tanggal Lahir" required>
                <Input type="date" value={f.tanggalLahir} onChange={(e) => set("tanggalLahir", e.target.value)} />
              </Field>
              <Field label="Jenis Kelamin" required>
                <select className={selectClass} value={f.jenisKelamin} onChange={(e) => set("jenisKelamin", e.target.value)}>
                  <option value="">-- Pilih --</option>
                  <option>Laki-laki</option>
                  <option>Perempuan</option>
                </select>
              </Field>
              <Field label="Status Pernikahan" required>
                <select className={selectClass} value={f.statusNikah} onChange={(e) => set("statusNikah", e.target.value)}>
                  <option value="">-- Pilih --</option>
                  <option>Belum Menikah</option>
                  <option>Menikah</option>
                </select>
              </Field>
              <Field label="No. WhatsApp Aktif" required>
                <Input type="tel" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="08xxxxxxxxxx" />
              </Field>
              <Field label="Email">
                <Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="opsional" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Alamat Lengkap" required hint="Wajib berdomisili Ponorogo">
                  <Textarea value={f.alamat} onChange={(e) => set("alamat", e.target.value)} placeholder="RT/RW, Desa/Kelurahan, Kecamatan, Kabupaten" />
                </Field>
              </div>
              <Field label="Pendidikan Terakhir" required>
                <select className={selectClass} value={f.pendidikan} onChange={(e) => set("pendidikan", e.target.value)}>
                  <option value="">-- Pilih --</option>
                  <option>SMP/MTs</option>
                  <option>SMA/SMK/MA</option>
                  <option>D1/D2/D3</option>
                  <option>S1</option>
                  <option>S2/S3</option>
                </select>
              </Field>
              <Field label="Pekerjaan / Institusi">
                <Input value={f.pekerjaan} onChange={(e) => set("pekerjaan", e.target.value)} placeholder="Pelajar / Mahasiswa / Umum" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Kontak Darurat (nama & no. HP)" required>
                  <Input value={f.kontakDarurat} onChange={(e) => set("kontakDarurat", e.target.value)} placeholder="Nama — 08xxxxxxxxxx" />
                </Field>
              </div>
              <Field label="Ukuran Kaos" required>
                <select className={selectClass} value={f.ukuranKaos} onChange={(e) => set("ukuranKaos", e.target.value)}>
                  <option value="">-- Pilih --</option>
                  <option>S</option>
                  <option>M</option>
                  <option>L</option>
                  <option>XL</option>
                  <option>XXL</option>
                </select>
              </Field>
            </div>
            <label className="mt-5 flex items-start gap-2.5 text-sm text-body">
              <input type="checkbox" className="mt-0.5 accent-[#1F6DFF]" checked={f.izinOrtu} onChange={(e) => set("izinOrtu", e.target.checked)} />
              Saya mendapat izin dari orang tua/wali untuk mengikuti kegiatan ini
            </label>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => goStep(2)}>Lanjut →</Button>
            </div>
          </div>
        )}

        {/* ===== Step 2: Divisi ===== */}
        {step === 2 && (
          <div>
            <h2 className="mb-5 border-b border-border pb-3 font-display text-lg font-bold text-ink">
              Pilih Divisi
            </h2>
            <div className="mb-4 rounded-xl bg-secondary/60 p-4 text-sm text-body">
              Pilih <strong className="text-ink">1 divisi utama</strong>. Boleh tambahkan 1 divisi
              cadangan. Penempatan final ditentukan oleh panitia berdasarkan hasil seleksi.
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {REGISTRATION_DIVISIONS.map((d) => {
                const selected = f.divisiUtama === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => set("divisiUtama", d.id)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      selected
                        ? "border-brand bg-brand/10"
                        : "border-border bg-secondary/30 hover:border-brand/50"
                    }`}
                  >
                    <div className="text-sm font-semibold text-ink">{d.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{d.sub}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Kuota: {d.quota} orang</div>
                    <div className={`mt-1.5 text-xs leading-relaxed ${selected ? "text-brand" : "text-body/80"}`}>
                      {d.jobs}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-4">
              <Field label="Divisi Cadangan (opsional)">
                <select className={selectClass} value={f.divisiCadangan} onChange={(e) => set("divisiCadangan", e.target.value)}>
                  <option value="">-- Tidak ada --</option>
                  {REGISTRATION_DIVISIONS.filter((d) => d.id !== f.divisiUtama).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Motivasi mengikuti Grebeg Suro" required hint={`${f.motivasi.trim().length}/50 karakter minimum`}>
                <Textarea className="min-h-[90px]" value={f.motivasi} onChange={(e) => set("motivasi", e.target.value)} placeholder="Ceritakan alasanmu bergabung (min. 50 karakter)" />
              </Field>
              <Field label="Pengalaman volunteer / event sebelumnya">
                <Textarea value={f.pengalaman} onChange={(e) => set("pengalaman", e.target.value)} placeholder="Kosongkan jika belum pernah" />
              </Field>
            </div>
            <div className="mt-6 flex justify-between gap-3">
              <Button variant="outline" onClick={() => goStep(1)}>← Kembali</Button>
              <Button onClick={() => goStep(3)}>Lanjut →</Button>
            </div>
          </div>
        )}

        {/* ===== Step 3: Kompetensi ===== */}
        {step === 3 && (
          <div>
            <h2 className="mb-5 border-b border-border pb-3 font-display text-lg font-bold text-ink">
              Kompetensi &amp; Ketersediaan
            </h2>
            <Field label="Kemampuan / Keahlian Khusus" hint="Pilih semua yang relevan">
              <div className="flex flex-wrap gap-2 pt-1">
                {REGISTRATION_SKILLS.map((s) => {
                  const sel = f.keahlian.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        set("keahlian", sel ? f.keahlian.filter((x) => x !== s) : [...f.keahlian, s])
                      }
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        sel
                          ? "border-brand bg-brand text-white"
                          : "border-brand/30 bg-brand/5 text-body hover:border-brand"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Bisa berkendara?" required>
                <select className={selectClass} value={f.kendaraan} onChange={(e) => set("kendaraan", e.target.value)}>
                  <option value="">-- Pilih --</option>
                  <option>Motor</option>
                  <option>Mobil</option>
                  <option>Keduanya</option>
                  <option>Tidak bisa</option>
                </select>
              </Field>
              <Field label="Punya SIM?" required>
                <select className={selectClass} value={f.sim} onChange={(e) => set("sim", e.target.value)}>
                  <option value="">-- Pilih --</option>
                  <option>SIM A</option>
                  <option>SIM C</option>
                  <option>SIM A &amp; C</option>
                  <option>Tidak punya</option>
                </select>
              </Field>
              <Field label="Kondisi fisik" required>
                <select className={selectClass} value={f.kondisiFisik} onChange={(e) => set("kondisiFisik", e.target.value)}>
                  <option value="">-- Pilih --</option>
                  <option>Sangat fit</option>
                  <option>Fit</option>
                  <option>Memiliki keterbatasan tertentu</option>
                </select>
              </Field>
              <Field label="Bersedia full 10 hari?" required>
                <select className={selectClass} value={f.ketersediaan} onChange={(e) => set("ketersediaan", e.target.value)}>
                  <option value="">-- Pilih --</option>
                  <option>Ya, full 10 hari</option>
                  <option>Sebagian hari saja</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Jika tidak full, tanggal tersedia">
                  <Input value={f.tanggalTersedia} onChange={(e) => set("tanggalTersedia", e.target.value)} placeholder="contoh: 29 Mei – 3 Juni 2027" />
                </Field>
              </div>
              <Field label="Riwayat penyakit / kondisi medis">
                <Input value={f.riwayatPenyakit} onChange={(e) => set("riwayatPenyakit", e.target.value)} placeholder="Kosongkan jika tidak ada" />
              </Field>
              <Field label="Golongan darah">
                <select className={selectClass} value={f.golonganDarah} onChange={(e) => set("golonganDarah", e.target.value)}>
                  <option value="">-- Pilih --</option>
                  <option>A</option>
                  <option>B</option>
                  <option>AB</option>
                  <option>O</option>
                  <option>Tidak tahu</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Sumber informasi pendaftaran">
                  <select className={selectClass} value={f.sumberInfo} onChange={(e) => set("sumberInfo", e.target.value)}>
                    <option value="">-- Pilih --</option>
                    <option>Instagram</option>
                    <option>WhatsApp / grup</option>
                    <option>TikTok</option>
                    <option>Rekomendasi teman</option>
                    <option>Lainnya</option>
                  </select>
                </Field>
              </div>
            </div>
            <label className="mt-5 flex items-start gap-2.5 text-sm text-body">
              <input type="checkbox" className="mt-0.5 accent-[#1F6DFF]" checked={f.komitmen} onChange={(e) => set("komitmen", e.target.checked)} />
              Saya berkomitmen mengikuti seluruh proses (seleksi, bimtek, pelantikan, dan festival)
              jika dinyatakan lolos
            </label>
            <div className="mt-6 flex justify-between gap-3">
              <Button variant="outline" onClick={() => goStep(2)}>← Kembali</Button>
              <Button onClick={() => goStep(4)}>Review →</Button>
            </div>
          </div>
        )}

        {/* ===== Step 4: Review ===== */}
        {step === 4 && (
          <div>
            <h2 className="mb-5 border-b border-border pb-3 font-display text-lg font-bold text-ink">
              Review Pendaftaran
            </h2>
            <div className="divide-y divide-border">
              {review.map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="max-w-[60%] text-right font-medium text-ink">{value || "—"}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm text-body">
              <strong className="text-ink">Timeline seleksi:</strong> {REGISTRATION_EVENT.timeline}
            </div>
            <div className="mt-6 flex justify-between gap-3">
              <Button variant="outline" onClick={() => goStep(3)} disabled={sending}>← Kembali</Button>
              <Button onClick={submit} disabled={sending}>
                {sending ? <Loader2 className="animate-spin" /> : <Send />} Kirim Pendaftaran
              </Button>
            </div>
          </div>
        )}

        {/* ===== Step 5: Sukses ===== */}
        {step === 5 && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-success/15">
              <Check className="h-7 w-7 text-success" />
            </div>
            <h2 className="font-display text-xl font-bold text-ink">Pendaftaran Terkirim!</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-body">
              Data kamu sudah kami terima. Simpan nomor pendaftaran berikut untuk memantau hasil
              seleksi.
            </p>
            <div className="mx-auto mt-5 inline-block rounded-xl bg-secondary/60 px-8 py-4">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Nomor Pendaftaran
              </span>
              <div className="mt-1 font-display text-2xl font-bold tracking-[3px] text-brand">
                {regNumber}
              </div>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              Pantau pengumuman via WhatsApp / Instagram resmi{" "}
              <a
                href="https://www.instagram.com/volunteer.grebegsuro.png"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand hover:underline"
              >
                @volunteer.grebegsuro.png
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
