"""
Grebeg Suro — Face Verification Service.

InsightFace `buffalo_l` (pre-trained, TIDAK di-fine-tune) di CPU.
"Belajar" terjadi di level data: galeri embedding per volunteer (tabel
`face_embeddings`, dikelola Next.js/Prisma) terus diperkaya, model tetap.

Verifikasi = cosine similarity embedding selfie terhadap galeri volunteer
target (max similarity, bukan mean) + pengecekan top-1 global untuk
mendeteksi kemungkinan titip absen.

PRIVASI: embedding adalah data biometrik. Service ini hanya untuk konsumsi
internal Next.js (server-side) — bind ke 127.0.0.1, JANGAN diekspos publik.
"""

from __future__ import annotations

import base64
import logging
import os
import re
import threading
import time
from contextlib import asynccontextmanager
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import cv2
import numpy as np
from fastapi import FastAPI, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("face-service")

# ---------------------------------------------------------------------------
# Konfigurasi (env) — threshold akan dituning dari data lapangan, jangan hardcode
# ---------------------------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL", "")
THRESHOLD_AUTO = float(os.getenv("FACE_THRESHOLD_AUTO", "0.50"))
THRESHOLD_REVIEW = float(os.getenv("FACE_THRESHOLD_REVIEW", "0.35"))
THRESHOLD_MISMATCH = float(os.getenv("FACE_THRESHOLD_MISMATCH", "0.50"))
GALLERY_TTL_SECONDS = float(os.getenv("FACE_GALLERY_TTL_SECONDS", "60"))
DET_SIZE = int(os.getenv("FACE_DET_SIZE", "640"))
# Wajah kedua dianggap "dominan juga" (ambigu) jika luasnya >= rasio ini
# dari wajah terbesar — selfie dengan orang lain di latar jauh tetap lolos.
DOMINANT_FACE_RATIO = float(os.getenv("FACE_DOMINANT_FACE_RATIO", "0.5"))
MODEL_ROOT = os.getenv("FACE_MODEL_ROOT", "")  # default: ~/.insightface
EMBEDDING_DIM = 512

DECISION_AUTO = "FACE_AUTO"
DECISION_LOW_CONF = "FACE_LOW_CONF"
DECISION_FALLBACK = "MANUAL_FALLBACK"


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


# ---------------------------------------------------------------------------
# DSN: URL Prisma membawa query param non-libpq (schema, pgbouncer,
# connection_limit, …) yang ditolak psycopg — saring dulu.
# ---------------------------------------------------------------------------
LIBPQ_PARAMS = {
    "sslmode",
    "connect_timeout",
    "application_name",
    "options",
    "sslcert",
    "sslkey",
    "sslrootcert",
    "channel_binding",
    "target_session_attrs",
}


def sanitize_dsn(url: str) -> str:
    parts = urlsplit(url)
    kept: list[tuple[str, str]] = []
    schema = None
    for key, value in parse_qsl(parts.query, keep_blank_values=True):
        if key == "schema":
            schema = value
        elif key in LIBPQ_PARAMS:
            kept.append((key, value))
    if schema and schema != "public" and not any(k == "options" for k, _ in kept):
        kept.append(("options", f"-csearch_path={schema}"))
    return urlunsplit(
        (parts.scheme, parts.netloc, parts.path, urlencode(kept), parts.fragment)
    )


# ---------------------------------------------------------------------------
# Galeri embedding (cache in-memory, refresh via TTL atau POST /reload)
# ---------------------------------------------------------------------------
class Gallery:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._loaded_at = 0.0
        self._ever_loaded = False
        self._owners: list[str] = []
        self._matrix = np.zeros((0, EMBEDDING_DIM), dtype=np.float32)
        self._counts: dict[str, int] = {}

    def snapshot(
        self, force: bool = False
    ) -> tuple[list[str], np.ndarray, dict[str, int]]:
        """Kembalikan (owners, matrix L2-normalized, counts per volunteer)."""
        with self._lock:
            expired = time.monotonic() - self._loaded_at > GALLERY_TTL_SECONDS
            if force or expired or not self._ever_loaded:
                try:
                    self._load_locked()
                except Exception as exc:  # noqa: BLE001
                    if not self._ever_loaded:
                        raise ApiError(
                            503,
                            "GALLERY_UNAVAILABLE",
                            f"Galeri tidak dapat dimuat dari database: {exc}",
                        ) from exc
                    # DB sedang bermasalah — layani dari cache lama (stale).
                    logger.warning("Refresh galeri gagal, pakai cache lama: %s", exc)
            return self._owners, self._matrix, self._counts

    def _load_locked(self) -> None:
        import psycopg

        if not DATABASE_URL:
            raise RuntimeError("DATABASE_URL belum di-set")

        owners: list[str] = []
        vectors: list[np.ndarray] = []
        counts: dict[str, int] = {}
        with psycopg.connect(sanitize_dsn(DATABASE_URL), connect_timeout=5) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT volunteer_id, embedding FROM face_embeddings")
                for volunteer_id, raw in cur:
                    vec = np.frombuffer(bytes(raw), dtype="<f4")
                    if vec.shape[0] != EMBEDDING_DIM:
                        logger.warning(
                            "Embedding rusak (dim %d) milik %s — dilewati",
                            vec.shape[0],
                            volunteer_id,
                        )
                        continue
                    norm = float(np.linalg.norm(vec))
                    if norm == 0.0:
                        continue
                    vectors.append(vec / norm)
                    owners.append(str(volunteer_id))
                    counts[str(volunteer_id)] = counts.get(str(volunteer_id), 0) + 1

        self._owners = owners
        self._matrix = (
            np.vstack(vectors).astype(np.float32)
            if vectors
            else np.zeros((0, EMBEDDING_DIM), dtype=np.float32)
        )
        self._counts = counts
        self._loaded_at = time.monotonic()
        self._ever_loaded = True
        logger.info(
            "Galeri dimuat: %d embedding milik %d volunteer", len(owners), len(counts)
        )


gallery = Gallery()

# ---------------------------------------------------------------------------
# Model InsightFace
# ---------------------------------------------------------------------------
face_model: Any = None
model_lock = threading.Lock()


def load_model() -> None:
    global face_model
    from insightface.app import FaceAnalysis

    kwargs: dict[str, Any] = {"name": "buffalo_l", "providers": ["CPUExecutionProvider"]}
    if MODEL_ROOT:
        kwargs["root"] = MODEL_ROOT
    model = FaceAnalysis(**kwargs)
    model.prepare(ctx_id=0, det_size=(DET_SIZE, DET_SIZE))
    face_model = model
    logger.info("Model buffalo_l siap (CPUExecutionProvider, det_size=%d)", DET_SIZE)


def bbox_area(face: Any) -> float:
    x1, y1, x2, y2 = face.bbox
    return max(0.0, float(x2) - float(x1)) * max(0.0, float(y2) - float(y1))


def detect_dominant_face(img: np.ndarray) -> tuple[np.ndarray, list[float], float]:
    """Deteksi tepat SATU wajah dominan; selain itu error yang jelas."""
    if face_model is None:
        raise ApiError(503, "MODEL_NOT_READY", "Model belum selesai dimuat")
    with model_lock:
        faces = face_model.get(img)
    if not faces:
        raise ApiError(422, "NO_FACE", "Tidak ada wajah terdeteksi pada gambar")
    faces = sorted(faces, key=bbox_area, reverse=True)
    if len(faces) > 1 and bbox_area(faces[1]) >= DOMINANT_FACE_RATIO * bbox_area(faces[0]):
        raise ApiError(
            422,
            "MULTIPLE_FACES",
            f"Terdeteksi {len(faces)} wajah berukuran sebanding — "
            "pastikan hanya satu wajah dominan di frame",
        )
    face = faces[0]
    embedding = np.asarray(face.normed_embedding, dtype=np.float32)
    bbox = [float(v) for v in face.bbox]
    return embedding, bbox, float(face.det_score)


# ---------------------------------------------------------------------------
# Parsing input (JSON base64 / multipart) — dukungan dua-duanya
# ---------------------------------------------------------------------------
DATA_URL_PREFIX = re.compile(r"^data:image/[\w.+-]+;base64,", re.IGNORECASE)


def decode_base64_image(value: str) -> np.ndarray:
    payload = DATA_URL_PREFIX.sub("", value.strip())
    payload = re.sub(r"\s+", "", payload)
    try:
        raw = base64.b64decode(payload)
    except Exception as exc:  # noqa: BLE001
        raise ApiError(400, "INVALID_IMAGE", "Base64 gambar tidak valid") from exc
    return decode_image_bytes(raw)


def decode_image_bytes(raw: bytes) -> np.ndarray:
    if not raw:
        raise ApiError(400, "INVALID_IMAGE", "Data gambar kosong")
    try:
        img = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    except cv2.error as exc:
        raise ApiError(400, "INVALID_IMAGE", "Gambar tidak dapat didecode") from exc
    if img is None:
        raise ApiError(400, "INVALID_IMAGE", "Gambar tidak dapat didecode")
    return img


async def read_payload(request: Request) -> tuple[np.ndarray, dict[str, str]]:
    """Terima gambar via JSON {"image": base64} atau multipart (field file/image)."""
    content_type = (request.headers.get("content-type") or "").lower()

    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        fields = {k: v for k, v in form.multi_items() if isinstance(v, str)}
        upload = form.get("file") or form.get("image")
        if upload is not None and hasattr(upload, "read"):
            return decode_image_bytes(await upload.read()), fields
        if isinstance(upload, str) and upload:
            return decode_base64_image(upload), fields
        raise ApiError(400, "INVALID_IMAGE", "Field 'file' atau 'image' wajib diisi")

    try:
        body = await request.json()
    except Exception as exc:  # noqa: BLE001
        raise ApiError(400, "INVALID_BODY", "Body JSON tidak valid") from exc
    if not isinstance(body, dict):
        raise ApiError(400, "INVALID_BODY", "Body JSON harus berupa object")
    image = body.get("image")
    if not isinstance(image, str) or not image:
        raise ApiError(400, "INVALID_IMAGE", "Field 'image' (base64) wajib diisi")
    fields = {k: v for k, v in body.items() if isinstance(v, str)}
    return decode_base64_image(image), fields


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(_app: FastAPI):
    load_model()
    try:
        gallery.snapshot(force=True)
    except Exception as exc:  # noqa: BLE001
        # Service tetap hidup tanpa galeri (mis. DB belum siap) — /verify akan
        # mengembalikan 503 dan Next.js melakukan MANUAL_FALLBACK.
        logger.warning("Galeri belum bisa dimuat saat startup: %s", exc)
    yield


app = FastAPI(title="Grebeg Suro Face Service", version="1.0.0", lifespan=lifespan)


@app.exception_handler(ApiError)
async def api_error_handler(_request: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status, content={"error": exc.message, "code": exc.code}
    )


@app.get("/health")
def health() -> dict[str, Any]:
    info: dict[str, Any] = {
        "status": "ok",
        "model": "buffalo_l",
        "provider": "CPUExecutionProvider",
        "modelLoaded": face_model is not None,
        "thresholds": {
            "auto": THRESHOLD_AUTO,
            "review": THRESHOLD_REVIEW,
            "mismatch": THRESHOLD_MISMATCH,
        },
    }
    try:
        owners, _matrix, counts = gallery.snapshot()
        info["galleryEmbeddings"] = len(owners)
        info["galleryVolunteers"] = len(counts)
    except ApiError as exc:
        info["galleryEmbeddings"] = None
        info["galleryVolunteers"] = None
        info["galleryError"] = exc.message
    return info


@app.post("/embed")
async def embed(request: Request) -> dict[str, Any]:
    """Ekstraksi embedding murni — dipakai internal oleh seed script & approve admin."""
    img, _fields = await read_payload(request)
    embedding, bbox, det_score = await run_in_threadpool(detect_dominant_face, img)
    return {
        "embedding": embedding.tolist(),
        "detScore": det_score,
        "bbox": bbox,
        "dim": EMBEDDING_DIM,
    }


@app.post("/verify")
async def verify(request: Request) -> dict[str, Any]:
    started = time.perf_counter()
    img, fields = await read_payload(request)
    volunteer_id = (fields.get("volunteerId") or "").strip()
    if not volunteer_id:
        raise ApiError(400, "INVALID_INPUT", "Field 'volunteerId' wajib diisi")

    def result(**overrides: Any) -> dict[str, Any]:
        base: dict[str, Any] = {
            "decision": DECISION_FALLBACK,
            "reason": "OK",
            "similarity": None,
            "matchedVolunteerId": None,
            "matchedSimilarity": None,
            "possibleMismatch": False,
            "detScore": None,
            "bbox": None,
            "embedding": None,
            "galleryCount": None,
            "latencyMs": round((time.perf_counter() - started) * 1000, 1),
        }
        base.update(overrides)
        return base

    try:
        embedding, bbox, det_score = await run_in_threadpool(detect_dominant_face, img)
    except ApiError as exc:
        if exc.code in ("NO_FACE", "MULTIPLE_FACES"):
            # Bukan error fatal: absensi TIDAK boleh gagal gara-gara AI.
            response = result(decision=DECISION_FALLBACK, reason=exc.code)
            logger.info(
                "verify volunteer=%s decision=%s reason=%s latency=%sms",
                volunteer_id, response["decision"], exc.code, response["latencyMs"],
            )
            return response
        raise

    owners, matrix, counts = await run_in_threadpool(gallery.snapshot)
    gallery_count = counts.get(volunteer_id, 0)

    similarity: float | None = None
    matched_id: str | None = None
    matched_sim: float | None = None
    possible_mismatch = False

    if matrix.shape[0] > 0:
        sims = matrix @ embedding
        top_idx = int(np.argmax(sims))
        matched_id = owners[top_idx]
        matched_sim = float(sims[top_idx])
        if gallery_count > 0:
            mask = np.fromiter(
                (owner == volunteer_id for owner in owners),
                dtype=bool,
                count=len(owners),
            )
            similarity = float(sims[mask].max())
        # Top-1 GLOBAL milik volunteer lain dengan similarity tinggi → indikasi
        # titip absen, flag untuk review admin (keputusan absen tidak berubah).
        if matched_id != volunteer_id and matched_sim >= THRESHOLD_MISMATCH:
            possible_mismatch = True

    if similarity is None:
        decision, reason = DECISION_FALLBACK, "NO_GALLERY"
    elif similarity >= THRESHOLD_AUTO:
        decision, reason = DECISION_AUTO, "OK"
    elif similarity >= THRESHOLD_REVIEW:
        decision, reason = DECISION_LOW_CONF, "OK"
    else:
        decision, reason = DECISION_FALLBACK, "LOW_SIMILARITY"

    response = result(
        decision=decision,
        reason=reason,
        similarity=similarity,
        matchedVolunteerId=matched_id,
        matchedSimilarity=matched_sim,
        possibleMismatch=possible_mismatch,
        detScore=det_score,
        bbox=bbox,
        embedding=embedding.tolist(),
        galleryCount=gallery_count,
    )
    logger.info(
        "verify volunteer=%s decision=%s sim=%s top1=%s(%s) mismatch=%s latency=%sms",
        volunteer_id,
        decision,
        None if similarity is None else round(similarity, 4),
        matched_id,
        None if matched_sim is None else round(matched_sim, 4),
        possible_mismatch,
        response["latencyMs"],
    )
    return response


@app.post("/reload")
async def reload_gallery() -> dict[str, Any]:
    """Paksa muat ulang galeri — dipanggil Next.js setelah menambah embedding."""
    owners, _matrix, counts = await run_in_threadpool(gallery.snapshot, True)
    return {
        "ok": True,
        "galleryEmbeddings": len(owners),
        "galleryVolunteers": len(counts),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=os.getenv("FACE_SERVICE_HOST", "127.0.0.1"),
        port=int(os.getenv("FACE_SERVICE_PORT", "8001")),
    )
