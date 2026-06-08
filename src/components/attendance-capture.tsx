"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, MapPin, RefreshCw, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Mode = "clock-in" | "clock-out";
type Coords = { latitude: number; longitude: number; accuracy: number };

interface Props {
  open: boolean;
  mode: Mode;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AttendanceCapture({ open, mode, onOpenChange, onSuccess }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [camError, setCamError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setCamError("Tidak dapat mengakses kamera. Izinkan akses kamera di browser Anda.");
    }
  }, []);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGeoStatus("ok");
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  // Lifecycle: start/stop on open
  useEffect(() => {
    if (open) {
      setPhoto(null);
      startCamera();
      fetchLocation();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, startCamera, fetchLocation, stopCamera]);

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const size = Math.min(video.videoWidth, video.videoHeight) || 640;
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Center-crop square, mirror for selfie
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 640, 640);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7); // compress
    setPhoto(dataUrl);
    stopCamera();
  }

  function retake() {
    setPhoto(null);
    startCamera();
  }

  async function submit() {
    if (!photo) return toast.error("Ambil selfie terlebih dahulu");
    if (!coords) return toast.error("Lokasi belum terdeteksi");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/attendance/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
          photo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 422) {
          toast.error(data.error, {
            description: `Jarak Anda ${data.distance}m dari venue (maks ${data.radius}m).`,
          });
        } else {
          toast.error(data.error ?? "Gagal menyimpan absensi");
        }
        return;
      }
      toast.success(
        mode === "clock-in" ? "Clock-in berhasil!" : "Clock-out berhasil!",
        { description: data.status ? `Status: ${data.status}` : undefined }
      );
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === "clock-in" ? "Clock In" : "Clock Out";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Camera className="h-5 w-5 text-brand" /> {title}
          </DialogTitle>
          <DialogDescription>
            Ambil selfie &amp; pastikan lokasi Anda di dalam area event.
          </DialogDescription>
        </DialogHeader>

        {/* Camera / preview */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-navy">
          {camError && !photo ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <AlertTriangle className="h-10 w-10 text-warning" />
              <p className="text-sm text-muted-foreground">{camError}</p>
              <Button size="sm" variant="outline" onClick={startCamera}>
                <RefreshCw className="h-4 w-4" /> Coba lagi
              </Button>
            </div>
          ) : photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Selfie" className="h-full w-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full -scale-x-100 object-cover"
            />
          )}
          {/* Camera frame guide */}
          {!photo && !camError && (
            <div className="pointer-events-none absolute inset-6 rounded-full border-2 border-dashed border-cyan/70" />
          )}
        </div>

        {/* GPS status */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm">
          <MapPin className={`h-4 w-4 ${geoStatus === "ok" ? "text-success" : geoStatus === "error" ? "text-error" : "text-brand"}`} />
          {geoStatus === "loading" && <span className="text-muted-foreground">Mendeteksi lokasi…</span>}
          {geoStatus === "ok" && coords && (
            <span className="text-muted-foreground">
              Lokasi terkunci · akurasi ±{Math.round(coords.accuracy)}m
            </span>
          )}
          {geoStatus === "error" && (
            <span className="text-error">Gagal mendeteksi lokasi. Aktifkan GPS.</span>
          )}
          {geoStatus === "error" && (
            <Button size="sm" variant="ghost" className="ml-auto h-7" onClick={fetchLocation}>
              <RefreshCw className="h-3 w-3" /> Ulangi
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!photo ? (
            <Button onClick={capture} className="flex-1" size="lg" disabled={!!camError}>
              <Camera /> Ambil Selfie
            </Button>
          ) : (
            <>
              <Button onClick={retake} variant="outline" size="lg" disabled={submitting}>
                <RefreshCw /> Ulangi
              </Button>
              <Button
                onClick={submit}
                className="flex-1"
                size="lg"
                disabled={submitting || geoStatus !== "ok"}
              >
                {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                {submitting ? "Menyimpan…" : `Kirim ${title}`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
