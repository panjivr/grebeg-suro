/**
 * Import & kurasi data pendaftar volunteer (Google Form xlsx) ke akun
 * yang SUDAH ADA. Default: TIDAK membuat akun baru — pendaftar yang tidak
 * punya akun dilewati, dan akun tanpa data formulir dibiarkan kosong.
 *
 * Sumber: sheet "Form Responses " — satu baris per submit formulir.
 * Kurasi yang dilakukan:
 *   - Dedup per orang (submit ulang): baris dengan timestamp TERBARU yang
 *     dipakai + gabung varian ejaan nama via identitas (WA/email + tgl lahir).
 *   - Nama formulir dicocokkan ke nama akun — paham nama akun yang DISINGKAT
 *     ("Rasantri Esa" -> "Rasantri Esa Nor Fadillah") dan INISIAL
 *     ("Aswangga F A P"); yang ambigu dilewati + peringatan, tidak menebak.
 *   - Tanggal lahir divalidasi (1940–2015); nilai mustahil dikosongkan + warning.
 *   - Nomor WA dinormalisasi ke format 08… (Excel kadang menyimpannya sebagai angka).
 *   - Jawaban kosong/"-" -> null (tidak diisi).
 *   - Divisi pilihan dipetakan ke master Divisi — HANYA untuk user yang belum
 *     punya divisi; pengaturan admin tidak ditimpa.
 *   - Yang TIDAK pernah disentuh pada akun existing: password, role, nama.
 *
 * Pakai (dari root repo; .env berisi DATABASE_URL — bisa Supabase, jalan dari laptop):
 *   npx tsx scripts/import-volunteer-profiles.ts --file data-pendaftar.xlsx --dry-run
 *   npx tsx scripts/import-volunteer-profiles.ts --file data-pendaftar.xlsx
 *
 * Opsi:
 *   --file <xlsx>    wajib — file export Google Form
 *   --dry-run        tampilkan rencana lengkap tanpa menulis apa pun
 *   --map <json>     pemetaan manual { "username-atau-nama-akun": "nama di formulir" }
 *                    untuk kasus yang tidak bisa dicocokkan otomatis
 *   --allow-create   izinkan membuat akun baru utk pendaftar tanpa akun
 *                    (default MATI; kredensial akun baru ditulis ke CSV)
 *   --out <csv>      file kredensial saat --allow-create (default: ./volunteer-credentials.csv)
 *
 * PENTING: file xlsx & CSV kredensial berisi data pribadi — jangan di-commit
 * (sudah masuk .gitignore). Hapus CSV setelah dibagikan.
 */
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import crypto from "node:crypto";
import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { nameScore, normalizeName } from "./seed-embeddings";

// ---- .env loader sederhana (tsx tidak memuat .env otomatis) ----
// Tahan terhadap file buatan Windows: BOM di awal file & akhiran baris CRLF.
function loadDotEnv(path = ".env"): void {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}
loadDotEnv();

// ---------------------------------------------------------------------------
// Helper kurasi (diekspor agar bisa diuji)
// ---------------------------------------------------------------------------

/** String kosong / hanya tanda strip -> null; selain itu di-trim. */
export function cleanText(v: string | null): string | null {
  if (v === null) return null;
  const t = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  if (!t || /^[-\u2013\u2014_.,\s]*$/.test(t)) return null;
  return t;
}

/** Normalisasi nomor WA Indonesia -> 08…; null jika bukan nomor. */
export function normalizePhone(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 16) return null;
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  if (digits.startsWith("0")) return digits;
  if (digits.startsWith("8")) return "0" + digits;
  return digits;
}

/** Validasi tanggal lahir masuk akal (data lapangan: ada isian 2024/2026 & tahun rusak). */
export function validBirthDate(d: Date | null): Date | null {
  if (!d || Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  if (y < 1940 || y > 2015) return null;
  return d;
}

/** "Ya"/"Tidak" -> boolean; lainnya null. */
export function parseYesNo(v: string | null): boolean | null {
  if (!v) return null;
  if (/^ya\b/i.test(v.trim())) return true;
  if (/^tidak\b/i.test(v.trim())) return false;
  return null;
}

/** Pemetaan divisi pilihan formulir -> nama divisi kanonis. */
export function canonicalDivision(raw: string | null): string | null {
  if (!raw) return null;
  const key = raw.trim().toUpperCase().replace(/\s+/g, " ");
  const map: Record<string, string> = {
    "ADMINISTRASI": "Administrasi",
    "STAGE MANAGER": "Stage Manager",
    "PELAYANAN PENONTON": "Pelayanan Penonton",
    "LIAISON OFFICER KONTINGEN": "Liaison Officer Kontingen",
    "KEAMANAN": "Keamanan",
    "MEDIA & DOKUMENTASI": "Media & Dokumentasi",
    "MEDIA, DOKUMENTASI & TALENT KONTEN": "Media & Dokumentasi",
    "TICKETING": "Ticketing",
  };
  if (map[key]) return map[key];
  // Fallback: Title Case apa adanya (tetap diimpor, jangan hilangkan data)
  return key
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Username dari nama: huruf/angka kecil, maks 20 karakter. */
export function usernameSlug(name: string): string {
  const base = normalizeName(name).replace(/\s+/g, "").slice(0, 20);
  return base || "volunteer";
}

/**
 * Skor utk nama akun yang DISINGKAT terhadap nama formulir lengkap
 * ("Rasantri Esa" vs "Rasantri Esa Nor Fadillah", "Aswangga F A P" vs nama
 * panjangnya). Semua token nama pendek harus muncul BERURUTAN pada nama
 * panjang; token cocok jika sama persis atau salah satunya inisial 1 huruf.
 * Hasil >= 0.93 (ambang terima) hanya saat seluruh urutan token cocok.
 */
export function subsequenceNameScore(shortName: string, fullName: string): number {
  const short = normalizeName(shortName).split(" ").filter(Boolean);
  const full = normalizeName(fullName).split(" ").filter(Boolean);
  if (short.length === 0 || full.length === 0 || short.length > full.length) return 0;
  let idx = 0;
  let exact = 0;
  for (const token of full) {
    if (idx >= short.length) break;
    const s = short[idx];
    if (s === token) {
      exact++;
      idx++;
    } else if (s.length === 1 && token.startsWith(s)) {
      idx++; // inisial pada nama pendek ("F" vs "Fawnia")
    } else if (token.length === 1 && s.startsWith(token)) {
      idx++; // inisial pada nama panjang
    }
  }
  if (idx < short.length) return 0; // ada token yang tidak ketemu berurutan
  const coverage = short.length / full.length;
  const exactness = exact / short.length;
  return 0.9 + 0.05 * coverage + 0.05 * exactness;
}

// ---------------------------------------------------------------------------
// Pembacaan xlsx (exceljs): nilai sel bisa Date/angka/string/hyperlink/richText
// ---------------------------------------------------------------------------
type Cell = ExcelJS.CellValue;

function flattenText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.richText)) {
      return (o.richText as { text?: string }[]).map((t) => t.text ?? "").join("");
    }
    if (typeof o.hyperlink === "string") {
      const text = flattenText(o.text);
      if (o.hyperlink.startsWith("mailto:")) return text ?? o.hyperlink.slice(7);
      return text && text.trim() ? text : o.hyperlink;
    }
    if ("text" in o) return flattenText(o.text);
    if ("result" in o) return flattenText(o.result);
  }
  return null;
}

function cellString(v: Cell): string | null {
  if (v instanceof Date) return null; // tanggal ditangani cellDate
  return cleanText(flattenText(v));
}

function cellDate(v: Cell): Date | null {
  if (v instanceof Date) return v;
  const s = flattenText(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Nomor WA: sel angka (float Excel) atau teks. */
function cellPhone(v: Cell): string | null {
  if (typeof v === "number") return normalizePhone(String(Math.round(v)));
  return normalizePhone(cellString(v));
}

interface FormRow {
  rowNumber: number;
  timestamp: Date | null;
  name: string;
  birthDate: Date | null;
  birthDateInvalid: boolean;
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

async function readForm(file: string): Promise<FormRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws =
    wb.worksheets.find((w) => w.name.trim().toLowerCase() === "form responses") ??
    wb.worksheets[0];
  if (!ws) throw new Error("Worksheet tidak ditemukan di file xlsx");
  console.log(`📄 Sheet: "${ws.name}" (${ws.rowCount} baris)`);

  // Peta kolom berdasarkan NAMA header (tahan terhadap perubahan urutan)
  const headerRow = ws.getRow(1);
  const col: Record<string, number> = {};
  headerRow.eachCell((cell, idx) => {
    const h = (flattenText(cell.value) ?? "").toUpperCase().replace(/\s+/g, " ").trim();
    if (!h) return;
    if (h === "COLUMN 1" || h === "TIMESTAMP") col.timestamp = idx;
    else if (h.startsWith("NAMA LENGKAP")) col.name = idx;
    else if (h.startsWith("FOTO KTP")) col.ktp = idx;
    else if (h.startsWith("TEMPAT TANGGAL LAHIR")) col.ttl = idx;
    else if (h.startsWith("JENIS KELAMIN")) col.gender = idx;
    else if (h.startsWith("ALAMAT")) col.address = idx;
    else if (h.startsWith("NOMOR WHATSAPP")) col.wa = idx;
    else if (h === "EMAIL") col.email = idx;
    else if (h.startsWith("SOSIAL MEDIA")) col.social = idx;
    else if (h.startsWith("PEKERJAAN")) col.occupation = idx;
    else if (h.startsWith("RIWAYAT PENYAKIT")) col.medical = idx;
    else if (h.startsWith("PERNAH MENJADI PANITIA")) col.committee = idx;
    else if (h.startsWith("DIVISI YANG DIPILIH")) col.division = idx;
    else if (h.startsWith("IJAZAH/SKL")) col.diploma = idx; // bukan "No Ijazah…"
    else if (h.startsWith("FOTO 3X4")) col.photo3x4 = idx;
    else if (h.startsWith("CURRICULUME VITAE") || h.startsWith("CURRICULUM VITAE")) col.cv = idx;
    else if (h.startsWith("LINK PORTOFOLIO")) col.portfolio = idx;
    else if (h.startsWith("MENGGUNAKAN AI")) col.ai = idx;
  });
  for (const required of ["name", "ttl", "division"]) {
    if (!col[required]) throw new Error(`Kolom wajib tidak ditemukan di header: ${required}`);
  }

  const rows: FormRow[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const get = (key: string): Cell => (col[key] ? row.getCell(col[key]).value : null);
    const name = cellString(get("name"));
    if (!name) return;

    const rawBirth = cellDate(get("ttl"));
    const birthDate = validBirthDate(rawBirth);
    rows.push({
      rowNumber,
      timestamp: cellDate(get("timestamp")),
      name,
      birthDate,
      birthDateInvalid: rawBirth !== null && birthDate === null,
      gender: cellString(get("gender")),
      address: cellString(get("address")),
      whatsapp: cellPhone(get("wa")),
      email: cellString(get("email"))?.toLowerCase() ?? null,
      socialMedia: cellString(get("social")),
      occupation: cellString(get("occupation")),
      medicalHistory: cellString(get("medical")),
      previousCommittee: parseYesNo(cellString(get("committee"))),
      chosenDivision: cellString(get("division")),
      ktpPhotoUrl: cellString(get("ktp")),
      diplomaUrl: cellString(get("diploma")),
      photo3x4Url: cellString(get("photo3x4")),
      cvUrl: cellString(get("cv")),
      portfolioUrl: cellString(get("portfolio")),
      aiTools: cellString(get("ai")),
    });
  });
  return rows;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const MATCH_ACCEPT = 0.93; // lebih ketat dari seed wajah: salah orang = fatal
const MATCH_GAP = 0.05;

function parseArgs(argv: string[]) {
  const args = {
    file: "",
    dryRun: false,
    allowCreate: false,
    map: "",
    out: "./volunteer-credentials.csv",
  };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--file": args.file = argv[++i] ?? ""; break;
      case "--dry-run": args.dryRun = true; break;
      case "--allow-create": args.allowCreate = true; break;
      case "--map": args.map = argv[++i] ?? ""; break;
      case "--out": args.out = argv[++i] ?? args.out; break;
      default:
        console.error(`Argumen tidak dikenal: ${argv[i]}`);
        process.exit(1);
    }
  }
  if (!args.file) {
    console.error("Wajib: --file <export-google-form.xlsx>");
    process.exit(1);
  }
  return args;
}

const prisma = new PrismaClient();

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = resolve(args.file);
  if (!existsSync(file)) {
    console.error(`File tidak ditemukan: ${file}`);
    process.exit(1);
  }

  const all = await readForm(file);
  console.log(`📋 ${all.length} baris formulir terbaca`);

  // ---- Dedup tahap 1 — per NAMA (submit TERBARU yang menang) ----
  const byPerson = new Map<string, FormRow>();
  let resubmits = 0;
  const newer = (a: FormRow, b: FormRow) =>
    (a.timestamp?.getTime() ?? a.rowNumber) >= (b.timestamp?.getTime() ?? b.rowNumber) ? a : b;
  for (const row of all) {
    const key = normalizeName(row.name);
    const existing = byPerson.get(key);
    if (!existing) {
      byPerson.set(key, row);
    } else {
      resubmits++;
      byPerson.set(key, newer(row, existing));
    }
  }

  // ---- Dedup tahap 2 — per IDENTITAS: nama boleh beda ejaan antar submit.
  // Dianggap orang yang sama jika (WA + tgl lahir) atau (email + tgl lahir)
  // identik — dua-duanya harus terisi. Submit terbaru yang dipakai.
  const byIdentity = new Map<string, string>(); // identity key -> person key
  let identityMerges = 0;
  for (const [personKey, row] of [...byPerson.entries()]) {
    const birth = row.birthDate?.toISOString().slice(0, 10);
    if (!birth) continue;
    const idKeys = [
      row.whatsapp ? `wa:${row.whatsapp}|${birth}` : null,
      row.email ? `em:${row.email}|${birth}` : null,
    ].filter((k): k is string => Boolean(k));
    const matchedKey = idKeys
      .map((k) => byIdentity.get(k))
      .find((k): k is string => Boolean(k && k !== personKey && byPerson.has(k)));
    let finalKey = personKey;
    if (matchedKey) {
      const other = byPerson.get(matchedKey)!;
      const winner = newer(row, other);
      identityMerges++;
      console.log(
        `  🔗 Identitas sama, nama beda ejaan: "${other.name}" + "${row.name}" -> dipakai "${winner.name}" (submit terbaru)`
      );
      byPerson.delete(personKey);
      byPerson.delete(matchedKey);
      finalKey = normalizeName(winner.name);
      byPerson.set(finalKey, winner);
    }
    for (const k of idKeys) byIdentity.set(k, finalKey);
  }

  const people = [...byPerson.values()];
  console.log(
    `👤 ${people.length} orang unik (${resubmits} submit ulang + ${identityMerges} varian ejaan nama digabung, dipakai yang terbaru)`
  );

  const invalidBirth = people.filter((p) => p.birthDateInvalid);
  if (invalidBirth.length > 0) {
    console.log(`⚠ ${invalidBirth.length} tanggal lahir tidak masuk akal -> dikosongkan:`);
    for (const p of invalidBirth) console.log(`    - ${p.name} (baris ${p.rowNumber})`);
  }
  const noPhone = people.filter((p) => !p.whatsapp).length;
  if (noPhone > 0) console.log(`⚠ ${noPhone} orang tanpa nomor WA valid`);

  // ---- Distribusi divisi ----
  const divCount = new Map<string, number>();
  for (const p of people) {
    const d = canonicalDivision(p.chosenDivision) ?? "(kosong)";
    divCount.set(d, (divCount.get(d) ?? 0) + 1);
  }
  console.log("🏷  Divisi:");
  for (const [d, c] of [...divCount.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${d}: ${c}`);
  }

  // ---- Cocokkan dengan user yang sudah ada ----
  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true, phone: true, divisionId: true },
  });
  const usernames = new Set(users.map((u) => u.username));
  const usedPhones = new Set(users.map((u) => u.phone).filter((v): v is string => Boolean(v)));

  interface Plan {
    row: FormRow;
    action: "update" | "create" | "skip";
    user?: (typeof users)[number];
    via?: string;
  }
  const plans: Plan[] = [];
  const claimedUserIds = new Set<string>(); // 1 akun existing maks. di-update 1 orang
  let noAccount = 0;
  let ambiguousCount = 0;

  // ---- Pemetaan manual (--map): { "username-atau-nama-akun": "nama di formulir" } ----
  const mappedPersonKeys = new Set<string>();
  if (args.map) {
    const explicit: Record<string, string> = JSON.parse(
      readFileSync(resolve(args.map), "utf8").replace(/^\uFEFF/, "")
    );
    for (const [accountKey, formName] of Object.entries(explicit)) {
      const user = users.find(
        (u) => u.username === accountKey || normalizeName(u.name) === normalizeName(accountKey)
      );
      const person = people.find((p) => normalizeName(p.name) === normalizeName(formName));
      if (!user) {
        console.warn(`  ⚠ Map: akun "${accountKey}" tidak ditemukan — dilewati.`);
      } else if (!person) {
        console.warn(`  ⚠ Map: nama formulir "${formName}" tidak ditemukan — dilewati.`);
      } else if (claimedUserIds.has(user.id)) {
        console.warn(`  ⚠ Map: akun "${accountKey}" sudah dipetakan dua kali — dilewati.`);
      } else {
        claimedUserIds.add(user.id);
        mappedPersonKeys.add(normalizeName(person.name));
        plans.push({ row: person, action: "update", user, via: "map" });
      }
    }
  }

  for (const p of people) {
    if (mappedPersonKeys.has(normalizeName(p.name))) continue;
    const scored = users
      .map((u) => ({
        u,
        score: Math.max(
          nameScore(p.name, u.name),
          nameScore(p.name, u.username),
          subsequenceNameScore(u.name, p.name), // nama akun disingkat
          subsequenceNameScore(p.name, u.name) // nama formulir disingkat
        ),
      }))
      .sort((a, b) => b.score - a.score);
    const [best, second] = scored;
    // Ambigu = dua kandidat sama-sama kuat dengan selisih tipis -> jangan tebak.
    const ambiguous =
      best && second && second.score >= MATCH_ACCEPT && best.score - second.score < MATCH_GAP;
    if (best && best.score >= MATCH_ACCEPT && !ambiguous && !claimedUserIds.has(best.u.id)) {
      claimedUserIds.add(best.u.id);
      plans.push({ row: p, action: "update", user: best.u, via: `match ${best.score.toFixed(2)}` });
    } else if (ambiguous || (best && best.score >= MATCH_ACCEPT && claimedUserIds.has(best.u.id))) {
      ambiguousCount++;
      console.warn(
        `  ⚠ "${p.name}" ambigu/bentrok dengan akun existing (top: ${best!.u.name} ${best!.score.toFixed(2)}) — dilewati, selesaikan manual.`
      );
      plans.push({ row: p, action: "skip" });
    } else if (!args.allowCreate) {
      noAccount++; // pendaftar tanpa akun — default: dilewati, BUKAN dibuatkan akun
      plans.push({ row: p, action: "skip" });
    } else {
      plans.push({ row: p, action: "create" });
    }
  }
  const nUpdate = plans.filter((x) => x.action === "update").length;
  const nCreate = plans.filter((x) => x.action === "create").length;
  const nSkip = plans.filter((x) => x.action === "skip").length;
  console.log(
    `\n📌 Rencana: ${nUpdate} akun existing dilengkapi datanya · ${nCreate} akun baru · ${nSkip} dilewati` +
      ` (${noAccount} pendaftar tanpa akun${ambiguousCount ? `, ${ambiguousCount} ambigu` : ""})`
  );
  for (const pl of plans.filter((x) => x.action === "update")) {
    console.log(`    ↻ "${pl.row.name}" -> ${pl.user!.name} (@${pl.user!.username}) [${pl.via}]`);
  }

  // Akun yang TIDAK ditemukan datanya di formulir — dibiarkan apa adanya.
  const unclaimed = users.filter((u) => !claimedUserIds.has(u.id));
  if (unclaimed.length > 0) {
    console.log(`\nℹ ${unclaimed.length} akun tanpa data formulir (dibiarkan kosong):`);
    for (const u of unclaimed) console.log(`    - ${u.name} (@${u.username})`);
  }

  if (args.dryRun) {
    console.log("\n[dry-run] Tidak ada perubahan ditulis.");
    return;
  }

  // ---- Master divisi (lazy): hanya dibuat saat benar-benar akan dipakai,
  // yaitu untuk akun yang divisinya masih kosong / akun baru (--allow-create).
  // Divisi final yang sudah diatur admin (mis. "Runner") tidak diutak-atik.
  const divisionIds = new Map<string, string>();
  const ensureDivision = async (formDivision: string | null): Promise<string | null> => {
    const name = canonicalDivision(formDivision);
    if (!name) return null;
    let id = divisionIds.get(name);
    if (!id) {
      const div = await prisma.division.upsert({
        where: { name },
        update: {},
        create: { name, description: "Divisi Volunteer FRR & FNRP 2026" },
      });
      id = div.id;
      divisionIds.set(name, id);
    }
    return id;
  };

  const profileData = (p: FormRow) => ({
    registeredAt: p.timestamp,
    birthDate: p.birthDate,
    gender: p.gender,
    address: p.address,
    whatsapp: p.whatsapp,
    email: p.email,
    socialMedia: p.socialMedia,
    occupation: p.occupation,
    medicalHistory: p.medicalHistory,
    previousCommittee: p.previousCommittee,
    chosenDivision: p.chosenDivision,
    ktpPhotoUrl: p.ktpPhotoUrl,
    diplomaUrl: p.diplomaUrl,
    photo3x4Url: p.photo3x4Url,
    cvUrl: p.cvUrl,
    portfolioUrl: p.portfolioUrl,
    aiTools: p.aiTools,
  });

  const credentials: string[] = [];
  let created = 0, updated = 0, failed = 0;

  for (const plan of plans) {
    const p = plan.row;
    try {
      if (plan.action === "update" && plan.user) {
        const u = plan.user;
        const phoneFree = p.whatsapp && !usedPhones.has(p.whatsapp) && !u.phone;
        if (phoneFree) usedPhones.add(p.whatsapp!);
        // divisi hanya diisi jika akun belum punya (pengaturan admin tidak ditimpa)
        const divId = u.divisionId ? null : await ensureDivision(p.chosenDivision);
        await prisma.user.update({
          where: { id: u.id },
          data: {
            ...(phoneFree ? { phone: p.whatsapp } : {}),
            ...(divId ? { divisionId: divId } : {}),
            profile: {
              upsert: { create: profileData(p), update: profileData(p) },
            },
          },
        });
        updated++;
      } else if (plan.action === "create") {
        const divId = await ensureDivision(p.chosenDivision);
        let username = usernameSlug(p.name);
        if (usernames.has(username)) {
          let n = 2;
          while (usernames.has(`${username}${n}`)) n++;
          username = `${username}${n}`;
        }
        usernames.add(username);
        const password = crypto.randomBytes(8).toString("base64url").slice(0, 10);
        const phoneFree = p.whatsapp && !usedPhones.has(p.whatsapp);
        if (phoneFree) usedPhones.add(p.whatsapp!);
        await prisma.user.create({
          data: {
            name: p.name,
            username,
            password: await bcrypt.hash(password, 10),
            role: Role.VOLUNTEER,
            phone: phoneFree ? p.whatsapp : null,
            divisionId: divId,
            profile: { create: profileData(p) },
          },
        });
        credentials.push(
          `"${p.name.replace(/"/g, '""')}",${username},${password},${p.whatsapp ?? ""}`
        );
        created++;
      }
    } catch (err) {
      failed++;
      console.error(`  ✗ Gagal memproses "${p.name}": ${err instanceof Error ? err.message : err}`);
    }
  }

  if (credentials.length > 0) {
    const out = resolve(args.out);
    writeFileSync(out, "nama,username,password,whatsapp\n" + credentials.join("\n") + "\n");
    chmodSync(out, 0o600);
    console.log(`\n🔑 ${credentials.length} kredensial akun baru -> ${out}`);
    console.log("   (berisi password — bagikan dengan aman lalu HAPUS file ini)");
  }

  console.log(`\n✅ Selesai: ${created} akun dibuat, ${updated} akun diperbarui, ${nSkip} dilewati, ${failed} gagal.`);
  if (failed > 0) process.exitCode = 1;
}

// Jalankan hanya saat dieksekusi langsung (bukan saat di-import untuk test)
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main()
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
