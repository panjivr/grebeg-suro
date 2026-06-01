"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, MapPin, Crosshair } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    eventName: "",
    eventLat: 0,
    eventLong: 0,
    radiusMeter: 150,
    shiftStart: "08:00",
  });

  useEffect(() => {
    fetch("/api/admin/event-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setForm({
            eventName: d.settings.eventName,
            eventLat: d.settings.eventLat,
            eventLong: d.settings.eventLong,
            radiusMeter: d.settings.radiusMeter,
            shiftStart: d.settings.shiftStart ?? "08:00",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) return toast.error("Geolocation tidak didukung");
    toast.loading("Mengambil lokasi…", { id: "geo" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, eventLat: pos.coords.latitude, eventLong: pos.coords.longitude }));
        toast.success("Koordinat diisi dari lokasi Anda", { id: "geo" });
      },
      () => toast.error("Gagal mengambil lokasi", { id: "geo" }),
      { enableHighAccuracy: true }
    );
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/event-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: form.eventName,
          eventLat: Number(form.eventLat),
          eventLong: Number(form.eventLong),
          radiusMeter: Number(form.radiusMeter),
          shiftStart: form.shiftStart,
        }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error ?? "Gagal menyimpan");
      toast.success("Pengaturan event tersimpan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className="font-display text-lg font-semibold">Pengaturan Event</h2>
            <p className="text-sm text-muted-foreground">Nama event &amp; batas keterlambatan.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Nama Event</Label>
            <Input value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Jam Mulai Shift (batas terlambat)</Label>
            <Input type="time" value={form.shiftStart} onChange={(e) => setForm({ ...form, shiftStart: e.target.value })} />
            <p className="text-xs text-muted-foreground">Clock-in setelah jam ini ditandai &quot;Terlambat&quot;.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Geofence Lokasi</h2>
              <p className="text-sm text-muted-foreground">Titik venue &amp; radius absensi.</p>
            </div>
            <MapPin className="h-5 w-5 text-gold" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Latitude</Label>
              <Input type="number" step="any" value={form.eventLat} onChange={(e) => setForm({ ...form, eventLat: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Longitude</Label>
              <Input type="number" step="any" value={form.eventLong} onChange={(e) => setForm({ ...form, eventLong: Number(e.target.value) })} />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={useMyLocation} className="w-full">
            <Crosshair className="h-4 w-4" /> Gunakan Lokasi Saya
          </Button>
          <div className="space-y-1.5">
            <Label>Radius (meter)</Label>
            <Input type="number" value={form.radiusMeter} onChange={(e) => setForm({ ...form, radiusMeter: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground">Relawan harus dalam radius ini untuk clock-in/out.</p>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <Button onClick={save} disabled={saving} size="lg" className="w-full sm:w-auto">
          {saving ? <Loader2 className="animate-spin" /> : <Save />} Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
}
