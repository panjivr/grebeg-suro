/**
 * Pencocokan nama (fuzzy) — dipakai untuk menautkan nama dari sumber lama
 * (mis. ekspor absensi xlsx aplikasi lama) ke akun User di database.
 *
 * Logika disalin dari skrip impor profil (scripts/seed-embeddings.ts &
 * import-volunteer-profiles.ts) agar bisa dipakai di runtime Next.js tanpa
 * meng-import skrip dev yang punya efek samping. Perilaku matching identik.
 */

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

/** Skor kemiripan 0..1 dua nama (token-set jaccard + levenshtein). */
export function nameScore(a0: string, b0: string): number {
  const a = normalizeName(a0);
  const b = normalizeName(b0);
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

/** Nama pendek/inisial cocok sebagai sub-urutan nama lengkap ("F Azhar" -> "Fuad Azharuddin"). */
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
      idx++;
    } else if (token.length === 1 && s.startsWith(token)) {
      idx++;
    }
  }
  if (idx < short.length) return 0;
  const coverage = short.length / full.length;
  const exactness = exact / short.length;
  return 0.9 + 0.05 * coverage + 0.05 * exactness;
}

export interface MatchCandidate {
  id: string;
  name: string;
}

/**
 * Cari kandidat terbaik untuk `query` di antara `candidates`.
 * Mengembalikan match + skor; null bila skor di bawah `threshold`.
 */
export function bestNameMatch(
  query: string,
  candidates: MatchCandidate[],
  threshold = 0.86
): { candidate: MatchCandidate; score: number } | null {
  let best: { candidate: MatchCandidate; score: number } | null = null;
  for (const c of candidates) {
    const score = Math.max(
      nameScore(query, c.name),
      subsequenceNameScore(query, c.name),
      subsequenceNameScore(c.name, query)
    );
    if (!best || score > best.score) best = { candidate: c, score };
  }
  return best && best.score >= threshold ? best : null;
}
