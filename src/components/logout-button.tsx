"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Berhasil keluar");
    router.replace("/login");
    router.refresh();
  }
  return (
    <Button variant="ghost" size="sm" onClick={logout} className={className}>
      <LogOut className="h-4 w-4" /> Keluar
    </Button>
  );
}
