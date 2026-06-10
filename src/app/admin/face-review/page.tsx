import { redirect } from "next/navigation";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { FaceReviewPanel } from "@/components/admin/face-review-panel";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Review Verifikasi Wajah",
  robots: { index: false, follow: false },
};

export default async function FaceReviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdminRole(user.role)) redirect("/dashboard");

  return <FaceReviewPanel />;
}
