"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Trash2, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DivisionRow {
  id: string;
  name: string;
  description: string | null;
  _count?: { users: number };
}

export function DivisionsPanel() {
  const [divisions, setDivisions] = useState<DivisionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/admin/divisions").then((r) => r.json());
      setDivisions(d.divisions ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/divisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error ?? "Gagal");
      toast.success("Divisi dibuat");
      setOpen(false);
      setForm({ name: "", description: "" });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Hapus divisi ini?")) return;
    const res = await fetch(`/api/admin/divisions/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Gagal menghapus (mungkin masih ada anggota)");
    toast.success("Divisi dihapus");
    load();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Manajemen Divisi</h2>
            <p className="text-sm text-muted-foreground">{divisions.length} divisi</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus /> Tambah</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-gold" /> Tambah Divisi
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Nama Divisi</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Deskripsi</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <Button onClick={create} disabled={saving} className="mt-2">
                {saving ? <Loader2 className="animate-spin" /> : <Plus />} Simpan
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat…
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {divisions.map((d) => (
              <div key={d.id} className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10">
                    <LayoutGrid className="h-5 w-5 text-gold" />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-400 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => remove(d.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <h3 className="mt-3 font-semibold">{d.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.description ?? "—"}</p>
                <Badge variant="outline" className="mt-3">{d._count?.users ?? 0} anggota</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
