/**
 * Seed galeri embedding wajah dari folder hasil clustering.
 *
 * Struktur input:  <dir>/<NamaVolunteer>/foto1.jpg, foto2.jpg, ...
 * Nama folder di-fuzzy-match ke nama/username volunteer di database;
 * yang ambigu ditampilkan untuk konfirmasi manual (interaktif) atau
 * dipetakan eksplisit lewat file --map.
 *
 * Setiap foto diekstrak embedding-nya via face service (endpoint internal
 * POST /embed), lalu disimpan sebagai SEED — maksimal --max foto TERBAIK
 * per orang berdasarkan det_score.
 *
 * Pakai (dari root repo, face service harus jalan):
 *   npx tsx scripts/seed-embeddings.ts --dir ./clustered
 *   npx tsx scripts/seed-embeddings.ts --dir ./clustered --dry-run        # cek mapping saja
 *   npx tsx scripts/seed-embeddings.ts --dir ./clustered --map map.json   # override manual
 *
 * Format map.json: { "Nama Folder": "username-atau-userId", ... }
 *
 * Opsi:
 *   --dir <path>       folder clustering (default: ./clustered)
 *   --map <file.json>  mapping eksplisit folder -> username/userId
 *   --max <n>          maksimal foto terbaik per orang (default: 15)
 *   --append           JANGAN hapus SEED lama (default: SEED lama diganti agar idempoten)
 *   --dry-run          tampilkan mapping tanpa ekstraksi/tulis DB
 *   --yes              non-interaktif: terima semua match kuat, lewati yang ambigu
 *   --face-url <url>   override FACE_SERVICE_URL (default: http://127.0.0.1:8001)
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import readline from "node:readline/promises";
import { PrismaClient, EmbeddingSource } from "@prisma/client";

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

// ---- CLI args ----
function parseArgs(argv: string[]) {
  const args = {
    dir: "./clustered",
    map: "",
    max: 15,
    append: false,
    dryRun: false,
    yes: false,
    faceUrl: process.env.FACE_SERVICE_URL ?? "http://127.0.0.1:8001",
  };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--dir": args.dir = argv[++i] ?? args.dir; break;
      case "--map": args.map = argv[++i] ?? ""; break;
      case "--max": args.max = Math.max(1, Number(argv[++i] ?? 15) || 15); break;
      case "--append": args.append = true; break;
      case "--dry-run": args.dryRun = true; break;
      case "--yes": args.yes = true; break;
      case "--face-url": args.faceUrl = argv[++i] ?? args.faceUrl; break;
      default:
        console.error(`Argumen tidak dikenal: ${argv[i]}`);
        process.exit(1);
    }
  }
  args.faceUrl = args.faceUrl.replace(/\/+$/, "");
  return args;
}

// ---- Fuzzy matching nama (diekspor agar bisa diuji) ----
export function normalizeName(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // buang diakritik
    .toLowerCase()
    .replace(/[_\-.]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

function ratio(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - levenshtein(a, b) / maxLen;
}

/** Skor kemiripan 0..1: gabungan ratio penuh, token terurut, dan Jaccard token. */
export function nameScore(folder: string, candidate: string): number {
  const a = normalizeName(folder);
  const b = normalizeName(candidate);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const tokensA = new Set(a.split(" "));
  const tokensB = new Set(b.split(" "));
  const inter = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  const jaccard = union === 0 ? 0 : inter / union;
  const sortedA = [...tokensA].sort().join(" ");
  const sortedB = [...tokensB].sort().join(" ");
  return Math.max(ratio(a, b), ratio(sortedA, sortedB), jaccard);
}

export interface UserLite { id: string; name: string; username: string; }
export interface Candidate { user: UserLite; score: number; }

const AUTO_ACCEPT = 0.85; // skor minimal match otomatis
const MIN_GAP = 0.05;     // jarak minimal ke kandidat kedua agar tidak ambigu

export function matchFolder(folder: string, users: UserLite[]): Candidate[] {
  return users
    .map((user) => ({
      user,
      score: Math.max(nameScore(folder, user.name), nameScore(folder, user.username)),
    }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 3);
}

// ---- Face service ----
const IMAGE_EXT_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
};

async function embedPhoto(
  faceUrl: string,
  filePath: string
): Promise<{ embedding: number[]; detScore: number } | { error: string }> {
  const mime = IMAGE_EXT_MIME[extname(filePath).toLowerCase()];
  const dataUrl = `data:${mime};base64,${readFileSync(filePath).toString("base64")}`;
  try {
    const res = await fetch(`${faceUrl}/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: dataUrl }),
      signal: AbortSignal.timeout(30000),
    });
    const data = (await res.json().catch(() => null)) as {
      embedding?: number[];
      detScore?: number;
      error?: string;
      code?: string;
    } | null;
    if (!res.ok) return { error: data?.code ?? data?.error ?? `HTTP ${res.status}` };
    if (!Array.isArray(data?.embedding) || data.embedding.length !== 512) {
      return { error: "Respons embedding tidak valid" };
    }
    return { embedding: data.embedding, detScore: Number(data.detScore ?? 0) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ---- Main ----
const prisma = new PrismaClient();
const GALLERY_MAX = Number(process.env.FACE_GALLERY_MAX_EMBEDDINGS ?? 30);

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dir = resolve(args.dir);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    console.error(`Folder tidak ditemukan: ${dir}`);
    process.exit(1);
  }

  // Health check face service (kecuali dry-run)
  if (!args.dryRun) {
    try {
      const res = await fetch(`${args.faceUrl}/health`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error(
        `Face service tidak terjangkau di ${args.faceUrl} — jalankan dulu ` +
          `(systemctl start face-service). Detail: ${err instanceof Error ? err.message : err}`
      );
      process.exit(1);
    }
  }

  const explicitMap: Record<string, string> = args.map
    ? JSON.parse(readFileSync(args.map, "utf8").replace(/^\uFEFF/, ""))
    : {};

  const users: UserLite[] = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, username: true },
  });
  if (users.length === 0) {
    console.error("Tidak ada user aktif di database — jalankan seed utama dulu.");
    process.exit(1);
  }

  const folders = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  if (folders.length === 0) {
    console.error(`Tidak ada subfolder di ${dir}. Struktur: ${dir}/<NamaVolunteer>/*.jpg`);
    process.exit(1);
  }

  console.log(`📁 ${folders.length} folder · 👤 ${users.length} user aktif · max ${args.max} foto/orang\n`);

  // ---- Tahap 1: mapping folder -> volunteer ----
  const resolved: { folder: string; user: UserLite; via: string }[] = [];
  const ambiguous: { folder: string; candidates: Candidate[] }[] = [];
  const interactive = process.stdin.isTTY && !args.yes;

  for (const folder of folders) {
    const override = explicitMap[folder];
    if (override) {
      const user = users.find((u) => u.id === override || u.username === override);
      if (user) {
        resolved.push({ folder, user, via: "map" });
      } else {
        console.warn(`⚠ Map "${folder}" -> "${override}" tidak cocok user mana pun — dilewati.`);
      }
      continue;
    }
    const candidates = matchFolder(folder, users);
    const [best, second] = candidates;
    if (best && best.score >= AUTO_ACCEPT && (!second || best.score - second.score >= MIN_GAP)) {
      resolved.push({ folder, user: best.user, via: `fuzzy ${best.score.toFixed(2)}` });
    } else {
      ambiguous.push({ folder, candidates });
    }
  }

  for (const r of resolved) {
    console.log(`  ✓ "${r.folder}" -> ${r.user.name} (@${r.user.username}) [${r.via}]`);
  }

  // ---- Konfirmasi manual untuk yang ambigu ----
  if (ambiguous.length > 0) {
    console.log(`\n⚠ ${ambiguous.length} folder AMBIGU (perlu konfirmasi manual):`);
    const rl = interactive
      ? readline.createInterface({ input: process.stdin, output: process.stdout })
      : null;
    for (const item of ambiguous) {
      console.log(`\n  Folder: "${item.folder}"`);
      item.candidates.forEach((c, i) =>
        console.log(`    ${i + 1}. ${c.user.name} (@${c.user.username}) — skor ${c.score.toFixed(2)}`)
      );
      if (rl) {
        const answer = (await rl.question("    Pilih nomor (Enter = lewati): ")).trim();
        const idx = Number(answer) - 1;
        if (answer && idx >= 0 && idx < item.candidates.length) {
          resolved.push({ folder: item.folder, user: item.candidates[idx].user, via: "manual" });
          console.log(`    ✓ dipilih: ${item.candidates[idx].user.name}`);
        } else {
          console.log("    ⏭ dilewati");
        }
      } else {
        console.log('    ⏭ dilewati — tambahkan ke file --map, contoh: {"' + item.folder + '": "username"}');
      }
    }
    rl?.close();
  }

  if (args.dryRun) {
    console.log(`\n[dry-run] ${resolved.length}/${folders.length} folder ter-mapping. Tidak ada perubahan.`);
    return;
  }

  // ---- Tahap 2: ekstraksi embedding + simpan ----
  // Gabungkan folder yang menunjuk ke volunteer sama agar tidak saling timpa
  // saat mode replace (SEED lama dihapus sekali, lalu gabungan foto disimpan).
  const byUser = new Map<string, { user: UserLite; folders: string[] }>();
  for (const { folder, user } of resolved) {
    const entry = byUser.get(user.id) ?? { user, folders: [] };
    entry.folders.push(folder);
    byUser.set(user.id, entry);
  }

  let totalSaved = 0;
  for (const { user, folders: userFolders } of byUser.values()) {
    if (userFolders.length > 1) {
      console.warn(`\n⚠ ${user.name} dipetakan dari ${userFolders.length} folder: ${userFolders.join(", ")} — digabung.`);
    }
    const photos = userFolders.flatMap((folder) =>
      readdirSync(join(dir, folder))
        .filter((f) => IMAGE_EXT_MIME[extname(f).toLowerCase()])
        .sort()
        .map((file) => ({ folder, file }))
    );
    if (photos.length === 0) {
      console.warn(`\n⚠ "${userFolders.join(", ")}": tidak ada file gambar — dilewati.`);
      continue;
    }
    console.log(`\n▶ ${user.name}: ekstraksi ${photos.length} foto…`);

    const extracted: { embedding: number[]; detScore: number; folder: string; file: string }[] = [];
    for (const { folder, file } of photos) {
      const result = await embedPhoto(args.faceUrl, join(dir, folder, file));
      if ("error" in result) {
        console.warn(`    ✗ ${folder}/${file}: ${result.error}`);
      } else {
        extracted.push({ ...result, folder, file });
      }
    }
    if (extracted.length === 0) {
      console.warn(`  ⚠ Tidak ada embedding valid untuk ${user.name}.`);
      continue;
    }

    // Sampling: ambil N terbaik berdasarkan det_score
    const best = extracted.sort((a, b) => b.detScore - a.detScore).slice(0, args.max);

    await prisma.$transaction(async (tx) => {
      if (!args.append) {
        await tx.faceEmbedding.deleteMany({
          where: { volunteerId: user.id, source: EmbeddingSource.SEED },
        });
      }
      await tx.faceEmbedding.createMany({
        data: best.map((e) => ({
          volunteerId: user.id,
          embedding: Buffer.from(new Float32Array(e.embedding).buffer),
          source: EmbeddingSource.SEED,
          detScore: e.detScore,
          photoUrl: `${args.dir}/${e.folder}/${e.file}`,
        })),
      });
      // Rolling window: total > GALLERY_MAX -> buang CHECKIN tertua (SEED aman)
      const total = await tx.faceEmbedding.count({ where: { volunteerId: user.id } });
      if (total > GALLERY_MAX) {
        const oldest = await tx.faceEmbedding.findMany({
          where: { volunteerId: user.id, source: EmbeddingSource.CHECKIN },
          orderBy: { createdAt: "asc" },
          take: total - GALLERY_MAX,
          select: { id: true },
        });
        if (oldest.length > 0) {
          await tx.faceEmbedding.deleteMany({ where: { id: { in: oldest.map((o) => o.id) } } });
        }
      }
    });
    totalSaved += best.length;
    console.log(
      `  ✓ ${best.length} embedding SEED disimpan (det_score ${best[best.length - 1].detScore.toFixed(2)}–${best[0].detScore.toFixed(2)})`
    );
  }

  // Minta face service muat ulang galeri
  try {
    await fetch(`${args.faceUrl}/reload`, { method: "POST", signal: AbortSignal.timeout(10000) });
  } catch {
    console.warn("⚠ /reload gagal — galeri akan ter-refresh otomatis via TTL.");
  }

  console.log(`\n✅ Selesai: ${totalSaved} embedding untuk ${resolved.length} volunteer.`);
  const unmapped = folders.length - resolved.length;
  if (unmapped > 0) {
    console.log(`   ${unmapped} folder belum ter-mapping — jalankan ulang dengan --map untuk melengkapi.`);
  }
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
