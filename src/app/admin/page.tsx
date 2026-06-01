import { redirect } from "next/navigation";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Dashboard" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdminRole(user.role)) redirect("/dashboard");

  return <AdminDashboard adminName={user.name} adminRole={user.role} />;
}
