import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VolunteerDashboard } from "@/components/volunteer-dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Relawan" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const event = await prisma.eventSetting.findFirst({ where: { isActive: true } });

  return (
    <VolunteerDashboard
      user={{
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        profilePhoto: user.profilePhoto,
        shift: user.shift,
        division: user.division
          ? { id: user.division.id, name: user.division.name }
          : null,
      }}
      event={
        event
          ? { eventName: event.eventName, radiusMeter: event.radiusMeter, shiftStart: event.shiftStart }
          : null
      }
    />
  );
}
