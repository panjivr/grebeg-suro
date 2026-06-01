"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Trash2, UserPlus, Power } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { roleLabels } from "@/lib/utils";

const ROLES = ["VOLUNTEER", "EO", "COORDINATOR", "ADMIN", "SUPER_ADMIN"];

interface Division {
  id: string;
  name: string;
}
interface UserRow {
  id: string;
  name: string;
  username: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  division: { name: string } | null;
}

export function UsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    phone: "",
    password: "",
    role: "VOLUNTEER",
    divisionId: "",
    shift: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, d] = await Promise.all([
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/admin/divisions").then((r) => r.json()),
      ]);
      setUsers(u.users ?? []);
      setDivisions(d.divisions ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, divisionId: form.divisionId || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal membuat user");
        return;
      }
      toast.success("User berhasil dibuat");
      setOpen(false);
      setForm({ name: "", username: "", phone: "", password: "", role: "VOLUNTEER", divisionId: "", shift: "" });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: UserRow) {
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    toast.success(u.isActive ? "User dinonaktifkan" : "User diaktifkan");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Hapus user ini?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Gagal menghapus");
    toast.success("User dihapus");
    load();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Manajemen Pengguna</h2>
            <p className="text-sm text-muted-foreground">{users.length} pengguna terdaftar</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus /> Tambah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-gold" /> Tambah Pengguna
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nama Lengkap" className="sm:col-span-2">
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="Username">
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </Field>
                <Field label="No. Telepon">
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
                <Field label="Password">
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </Field>
                <Field label="Role">
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Divisi">
                  <Select value={form.divisionId} onValueChange={(v) => setForm({ ...form, divisionId: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih divisi" /></SelectTrigger>
                    <SelectContent>
                      {divisions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Shift" className="sm:col-span-2">
                  <Input value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} placeholder="Pagi (08:00 - 16:00)" />
                </Field>
              </div>
              <Button onClick={createUser} disabled={saving} className="mt-2">
                {saving ? <Loader2 className="animate-spin" /> : <UserPlus />} Simpan
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Divisi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.username}</TableCell>
                  <TableCell><Badge variant="outline">{roleLabels[u.role] ?? u.role}</Badge></TableCell>
                  <TableCell>{u.division?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "success" : "secondary"}>
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleActive(u)} title="Aktif/Nonaktif">
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" onClick={() => remove(u.id)} title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-10 text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat…
    </div>
  );
}
