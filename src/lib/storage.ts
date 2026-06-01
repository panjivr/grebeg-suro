import "server-only";
import { getSupabaseAdmin } from "./supabase";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "attendance-selfies";

/**
 * Persist a selfie (data URL) and return a reference.
 *
 * If Supabase Storage is configured, uploads the image and returns a public URL.
 * Otherwise returns the original data URL (stored directly in the DB) so the
 * system works out-of-the-box without external dependencies.
 */
export async function saveSelfie(
  dataUrl: string,
  prefix: string
): Promise<string> {
  if (!dataUrl?.startsWith("data:image")) {
    throw new Error("Format gambar tidak valid");
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    // Fallback: keep base64 in DB.
    return dataUrl;
  }

  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Format gambar tidak valid");
  const [, mime, base64] = match;
  const ext = mime.split("/")[1] ?? "jpg";
  const buffer = Buffer.from(base64, "base64");
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false });

  if (error) {
    console.error("Supabase upload failed, falling back to base64:", error.message);
    return dataUrl;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
