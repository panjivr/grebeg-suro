/**
 * Deteksi & embedding wajah DI BROWSER (face-api.js + TF.js custom build).
 *
 * Mode tanpa server: HP volunteer menghitung descriptor 128-dim dari selfie,
 * server (Netlify) hanya membandingkan terhadap galeri di database — gratis
 * total. Model (±6,8 MB) dimuat sekali dari /models lalu di-cache browser.
 *
 * Semua fungsi di sini non-blocking & fail-soft: gagal memuat model /
 * mendeteksi wajah -> null, absensi tetap berjalan (fallback review admin).
 * Hanya boleh dipanggil dari komponen client (event handler / useEffect).
 */

export interface FaceDescriptorResult {
  descriptor: number[]; // 128-dim
  detScore: number; // confidence detektor 0..1
}

type FaceApi = typeof import("@vladmandic/face-api");

let faceApiPromise: Promise<FaceApi | null> | null = null;

/** Muat library + 3 model (sekali; aman dipanggil berulang). */
export function preloadFaceModels(): Promise<FaceApi | null> {
  if (!faceApiPromise) {
    faceApiPromise = (async () => {
      try {
        const faceapi = await import("@vladmandic/face-api");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        return faceapi;
      } catch (err) {
        console.warn("Model deteksi wajah gagal dimuat:", err);
        faceApiPromise = null; // boleh dicoba lagi nanti
        return null;
      }
    })();
  }
  return faceApiPromise;
}

/**
 * Hitung descriptor wajah dari canvas/gambar. null jika model gagal dimuat,
 * tidak ada wajah, atau melewati batas waktu — pemanggil lanjut tanpa wajah.
 */
export async function computeFaceDescriptor(
  source: HTMLCanvasElement | HTMLImageElement,
  timeoutMs = 15000
): Promise<FaceDescriptorResult | null> {
  const work = (async () => {
    const faceapi = await preloadFaceModels();
    if (!faceapi) return null;
    const detection = await faceapi
      .detectSingleFace(
        source,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!detection) return null;
    return {
      descriptor: Array.from(detection.descriptor),
      detScore: detection.detection.score,
    };
  })().catch((err) => {
    console.warn("Deteksi wajah gagal:", err);
    return null;
  });

  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
  return Promise.race([work, timeout]);
}

/** Descriptor dari URL/data-URL foto (dipakai panel admin saat approve). */
export async function descriptorFromImageUrl(
  url: string,
  timeoutMs = 20000
): Promise<FaceDescriptorResult | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Gagal memuat foto"));
      el.src = url;
    });
    // Gambar ke canvas dulu (ukuran wajar) agar konsisten & bebas masalah CORS-taint
    const max = 720;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await computeFaceDescriptor(canvas, timeoutMs);
  } catch {
    return null;
  }
}
